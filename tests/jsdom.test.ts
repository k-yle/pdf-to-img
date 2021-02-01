/**
 * @jest-environment jsdom
 */
import { promises as fs } from "fs";
import { pdf } from "../src";

describe("example.pdf", () => {
  it("correctly generates a single png for the one page", async () => {
    for await (const page of await pdf("./tests/example.pdf")) {
      expect(page).toMatchImageSnapshot();
    }
  });
});

describe("multipage.pdf", () => {
  it("works for multipage PDFs", async () => {
    const doc = await pdf("./tests/multipage.pdf");
    expect(doc).toHaveLength(2);
    expect(doc.metadata).toStrictEqual({
      Author: "Kyle Hensel",
      CreationDate: "D:20210202090134+12'00'",
      Creator: "Microsoft® PowerPoint® for Microsoft 365",
      IsAcroFormPresent: false,
      IsCollectionPresent: false,
      IsLinearized: false,
      IsXFAPresent: false,
      ModDate: "D:20210202090134+12'00'",
      PDFFormatVersion: "1.7",
      Producer: "Microsoft® PowerPoint® for Microsoft 365",
      Title: "",
    });
    for await (const page of doc) {
      expect(page).toMatchImageSnapshot();
    }
  });
});

describe("test-pattern.pdf", () => {
  it("correctly handles PDFs with no margin", async () => {
    const doc = await pdf("./tests/test-pattern.pdf");
    expect(doc).toHaveLength(1);
    expect(doc.metadata).toStrictEqual({
      Author: "KyleH",
      CreationDate: "D:20210115104832+13'00'",
      IsAcroFormPresent: false,
      IsCollectionPresent: false,
      IsLinearized: false,
      IsXFAPresent: false,
      ModDate: "D:20210115104832+13'00'",
      PDFFormatVersion: "1.7",
      Producer: "Microsoft: Print To PDF",
      Title: "Pattern Test - PAL Static.png",
    });
    for await (const page of doc) {
      expect(page).toMatchImageSnapshot();
    }
  });
});

describe("encrypted.pdf", () => {
  it("correctly handles encrypted PDFs if a password is supplied", async () => {
    const doc = await pdf("./tests/encrypted.pdf", {
      password: "P@ssw0rd",
    });
    expect(doc).toHaveLength(1);
    expect(doc.metadata).toStrictEqual({
      Author: "Kyle Hensel\x00",
      CreationDate: "D:20210201205458+12'00'",
      Creator: "Microsoft® Word for Microsoft 365\x00",
      IsAcroFormPresent: false,
      IsCollectionPresent: false,
      IsLinearized: false,
      IsXFAPresent: false,
      ModDate: "D:20210201205458+12'00'",
      PDFFormatVersion: "1.7",
      Producer: "Microsoft® Word for Microsoft 365\x00",
    });
    for await (const page of doc) {
      expect(page).toMatchImageSnapshot();
    }
  });

  it("rejects if no password is supplied", async () => {
    await expect(() => pdf("./tests/encrypted.pdf")).rejects.toThrow(
      new Error("No password given")
    );
  });

  it("rejects if the wrong password is supplied", async () => {
    await expect(() =>
      pdf("./tests/encrypted.pdf", { password: "UwU" })
    ).rejects.toThrow(new Error("Incorrect Password"));
  });
});

describe("data url", () => {
  it("can load a document from a data URL", async () => {
    const b64 = await fs.readFile("./tests/example.pdf", "base64");
    const dataUrl = `data:application/pdf;base64,${b64}`;

    for await (const page of await pdf(dataUrl)) {
      expect(page).toMatchImageSnapshot();
    }
  });
});
