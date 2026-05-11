// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { pdf } from "../src/index.js";
import { getPdfDocumentProxyPrototype } from "./pdfjsProxy.js";

describe("resource management", () => {
  describe("destroy", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("updates `isDestroyed` after calling `destroy`", async () => {
      const document = await pdf("./tests/example.pdf");

      expect(document.isDestroyed).toStrictEqual(false);
      await document.destroy();
      expect(document.isDestroyed).toStrictEqual(true);

      await expect(document.getPage(1)).rejects.toThrow();
    });

    it("should throw upon acting upon a destroyed instance", async () => {
      const document = await pdf("./tests/example.pdf");

      // Once `destroy` has been called, the underlying pdfjs document is torn down.
      // We expect that any methods that attempt to act on this would then reject/fail.
      await document.destroy();
      await expect(document.getPage(1)).rejects.toThrow();
    });

    it("calls underlying pdfjs document when calling destroy", async () => {
      const documentProto = await getPdfDocumentProxyPrototype();
      const destroySpy = vi.spyOn(documentProto, "destroy");

      const document = await pdf("./tests/example.pdf");

      expect(document.isDestroyed).toStrictEqual(false);
      expect(destroySpy).not.toHaveBeenCalled();

      await document.destroy();

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(document.isDestroyed).toStrictEqual(true);
    });

    it("only calls the underlying destroy once upon multiple destroy calls", async () => {
      const documentProto = await getPdfDocumentProxyPrototype();
      const destroySpy = vi.spyOn(documentProto, "destroy");

      const document = await pdf("./tests/example.pdf");

      await document.destroy();
      await document.destroy();

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(document.isDestroyed).toStrictEqual(true);
    });
  });

  describe("disposable", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("updates `isDestroyed` after manual disposal", async () => {
      const document = await pdf("./tests/example.pdf");

      expect(document.isDestroyed).toStrictEqual(false);

      await document[Symbol.asyncDispose]();

      expect(document.isDestroyed).toStrictEqual(true);
    });

    it("rejects further work after disposal", async () => {
      const document = await pdf("./tests/example.pdf");
      await document[Symbol.asyncDispose]();

      // Once `destroy` has been called, the underlying pdfjs document is torn down.
      // We expect that any methods that attempt to act on this would then reject/fail.
      await expect(document.getPage(1)).rejects.toThrow();
    });

    it("calls the underlying pdfjs document destroy() on disposal", async () => {
      const documentProto = await getPdfDocumentProxyPrototype();
      const destroySpy = vi.spyOn(documentProto, "destroy");

      const document = await pdf("./tests/example.pdf");

      expect(document.isDestroyed).toStrictEqual(false);
      expect(destroySpy).not.toHaveBeenCalled();

      await document[Symbol.asyncDispose]();

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(document.isDestroyed).toStrictEqual(true);
    });

    it("only calls the underlying destroy once across repeated dispose calls", async () => {
      const documentProto = await getPdfDocumentProxyPrototype();
      const destroySpy = vi.spyOn(documentProto, "destroy");

      const document = await pdf("./tests/example.pdf");

      await document[Symbol.asyncDispose]();
      await document[Symbol.asyncDispose]();

      expect(destroySpy).toHaveBeenCalledOnce();
      expect(document.isDestroyed).toStrictEqual(true);
    });
  });
});
