// @vitest-environment node
import { promises as fs } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { type Pdf, pdf } from "../src/index.js";

/**
 * `pdfjs` doesn't export the `PDFDocumentProxy` prototype.
 * Workaround to be able to spy on the underlying prototype.
 */
const documentProto = (async () => {
  const data = new Uint8Array(await fs.readFile("./tests/example.pdf"));
  const loadingTask = pdfjs.getDocument({ data });

  return Reflect.getPrototypeOf(loadingTask) as pdfjs.PDFDocumentLoadingTask;
})();

describe("resource management", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // manually called .destroy() and .[Symbol.asyncDispose]() should behave
  // the same, so test both.
  const disposeFns = [Symbol.asyncDispose, "destroy"] as const;

  describe.each(disposeFns)("%s", (disposeFunction) => {
    it("updates `isDestroyed` after manually calling destroy/dispose", async () => {
      const document = await pdf("./tests/example.pdf");

      expect(document.isDestroyed).toStrictEqual(false);
      await document[disposeFunction]();
      expect(document.isDestroyed).toStrictEqual(true);

      // Once `destroy` has been called, the underlying pdfjs document is torn down.
      // We expect that any methods that attempt to act on this would then reject/fail.
      await document[disposeFunction]();
      await expect(document.getPage(1)).rejects.toThrow();
    });

    it("calls underlying pdfjs document when calling destroy/dispose", async () => {
      const destroySpy = vi.spyOn(await documentProto, "destroy");

      const document = await pdf("./tests/example.pdf");

      Reflect.getPrototypeOf(document);

      expect(document.isDestroyed).toStrictEqual(false);
      expect(destroySpy).not.toHaveBeenCalled();

      await document[disposeFunction]();

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(document.isDestroyed).toStrictEqual(true);
    });

    it("only calls the underlying destroy once upon multiple destroy/dispose calls", async () => {
      const destroySpy = vi.spyOn(await documentProto, "destroy");

      const document = await pdf("./tests/example.pdf");

      await document[disposeFunction]();
      await document[disposeFunction]();

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(document.isDestroyed).toStrictEqual(true);
    });
  });

  describe("using", () => {
    it("updates `isDestroyed` after implicit disposal", async () => {
      let document!: Pdf;
      await (async () => {
        await using _document = await pdf("./tests/example.pdf");
        document = _document;

        expect(_document.isDestroyed).toStrictEqual(false);
      })();

      expect(document.isDestroyed).toStrictEqual(true);

      // Once `destroy` has been called, the underlying pdfjs document is torn down.
      // We expect that any methods that attempt to act on this would then reject/fail.
      await expect(document.getPage(1)).rejects.toThrow();
    });

    it("calls the underlying pdfjs document destroy() on disposal", async () => {
      const destroySpy = vi.spyOn(await documentProto, "destroy");

      let document!: Pdf;
      await (async () => {
        await using _document = await pdf("./tests/example.pdf");
        document = _document;

        expect(document.isDestroyed).toStrictEqual(false);
        expect(destroySpy).not.toHaveBeenCalled();
      })();

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(document.isDestroyed).toStrictEqual(true);
    });
  });
});
