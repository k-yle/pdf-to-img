import { toMatchImageSnapshot } from "jest-image-snapshot";
import { pdf } from "../src";

expect.extend({ toMatchImageSnapshot });

const opts = <const>{
  failureThresholdType: "percent",
  failureThreshold: 0.1,
};

describe("example.pdf", () => {
  it("correctly generates a single png for the one page", async () => {
    for await (const page of await pdf("./tests/example.pdf")) {
      expect(page).toMatchImageSnapshot(opts);
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
      expect(page).toMatchImageSnapshot(opts);
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
      expect(page).toMatchImageSnapshot(opts);
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
  it.todo("can load doc from a data URL");
});
