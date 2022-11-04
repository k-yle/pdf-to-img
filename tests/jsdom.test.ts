/**
 * @jest-environment jsdom
 */
import { promises as fs, createReadStream } from "fs";
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
      EncryptFilterName: null,
      Language: "en-NZ",
      IsAcroFormPresent: false,
      IsCollectionPresent: false,
      IsLinearized: false,
      IsSignaturesPresent: false,
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
      EncryptFilterName: null,
      Language: null,
      IsAcroFormPresent: false,
      IsCollectionPresent: false,
      IsLinearized: false,
      IsSignaturesPresent: false,
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
      Author: "Kyle Hensel",
      CreationDate: "D:20210201205458+12'00'",
      Creator: "Microsoft® Word for Microsoft 365",
      EncryptFilterName: "Standard",
      Language: "en-NZ",
      IsAcroFormPresent: false,
      IsCollectionPresent: false,
      IsLinearized: false,
      IsSignaturesPresent: false,
      IsXFAPresent: false,
      ModDate: "D:20210201205458+12'00'",
      PDFFormatVersion: "1.7",
      Producer: "Microsoft® Word for Microsoft 365",
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

describe("Buffer", () => {
  it("can load a document from a buffer", async () => {
    const buf = await fs.readFile("./tests/example.pdf");

    for await (const page of await pdf(buf)) {
      expect(page).toMatchImageSnapshot();
    }
  });
});

describe("ReadableStream", () => {
  it("can load a document from a ReadableStream", async () => {
    const readableStream = createReadStream("./tests/example.pdf");

    for await (const page of await pdf(readableStream)) {
      expect(page).toMatchImageSnapshot();
    }
  });
});

describe("invalid", () => {
  it("throws an error if you pass it invalid input", async () => {
    await expect(
      // @ts-expect-error testing invalid input
      async () => pdf(1)
    ).rejects.toThrow(
      new Error(
        "pdf-to-img received an unexpected input. Provide a path to file, a data URL, a Buffer, or a ReadableStream."
      )
    );
  });
});

describe("Document Init Params", () => {
  it("correctly handles encrypted PDFs if a password is supplied in the docInitParams", async () => {
    const doc = await pdf("./tests/encrypted.pdf", {
      docInitParams: {
        password: "P@ssw0rd",
      },
    });
    expect(doc).toHaveLength(1);
    expect(doc.metadata).toStrictEqual({
      Author: "Kyle Hensel",
      CreationDate: "D:20210201205458+12'00'",
      Creator: "Microsoft® Word for Microsoft 365",
      EncryptFilterName: "Standard",
      Language: "en-NZ",
      IsAcroFormPresent: false,
      IsCollectionPresent: false,
      IsLinearized: false,
      IsSignaturesPresent: false,
      IsXFAPresent: false,
      ModDate: "D:20210201205458+12'00'",
      PDFFormatVersion: "1.7",
      Producer: "Microsoft® Word for Microsoft 365",
    });
    for await (const page of doc) {
      expect(page).toMatchImageSnapshot();
    }
  });
});
