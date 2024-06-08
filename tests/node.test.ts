// @vitest-environment node
import { createReadStream, promises as fs } from "node:fs";
import { describe, expect, it } from "vitest";
import { pdf } from "../src";

describe("example.pdf in node", () => {
  it("correctly generates a single png for the one page in nodejs environment", async () => {
    for await (const page of await pdf("./tests/example.pdf")) {
      expect(page).toMatchImageSnapshot();
    }
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
