// @vitest-environment node
import { createReadStream, promises as fs } from "node:fs";
import { describe, expect, it } from "vitest";
import { pdf } from "../src/index.js";

describe("example.pdf in node", () => {
  it("correctly generates a single png for the one page in nodejs environment", async () => {
    for await (const page of await pdf("./tests/example.pdf")) {
      expect(page).toMatchImageSnapshot();
    }
  });

  it("generates jpeg when requested", async () => {
    const document = await pdf("./tests/example.pdf", { format: "jpg" });
    const page = await document.getPage(1);

    expect(page.subarray(0, 2)).toStrictEqual(Buffer.from([0xff, 0xd8]));
    await document.destroy();
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
