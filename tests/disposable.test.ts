// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { type Pdf, pdf } from "../src/index.js";
import { getPdfDocumentProxyPrototype } from "./pdfjsProxy.js";

describe("disposable", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should omit `asAsyncDisposable` when returning a disposable instance", async () => {
    const document = await pdf("./tests/example.pdf");
    const disposableDocument = document.asAsyncDisposable();

    expect(
      ("asAsyncDisposable" satisfies keyof Pdf) in disposableDocument
    ).toBe(false);
  });

  it("updates `isDestroyed` after manual disposal", async () => {
    const document = await pdf("./tests/example.pdf");
    const disposableDocument = document.asAsyncDisposable();

    expect(document.isDestroyed).toStrictEqual(false);
    expect(disposableDocument.isDestroyed).toStrictEqual(false);

    await disposableDocument[Symbol.asyncDispose]();

    expect(document.isDestroyed).toStrictEqual(true);
    expect(disposableDocument.isDestroyed).toStrictEqual(true);
  });

  it("rejects further work after disposal", async () => {
    const document = await pdf("./tests/example.pdf");
    const disposableDocument = document.asAsyncDisposable();
    await disposableDocument[Symbol.asyncDispose]();

    // Once `destroy` has been called, the underlying pdfjs document is torn down.
    // We expect that any methods that attempt to act on this would then reject/fail.
    await expect(document.getPage(1)).rejects.toThrow();
    await expect(disposableDocument.getPage(1)).rejects.toThrow();
  });

  it("calls the underlying pdfjs document destroy() on disposal", async () => {
    const documentProto = await getPdfDocumentProxyPrototype();
    const destroySpy = vi.spyOn(documentProto, "destroy");

    const document = await pdf("./tests/example.pdf");
    const disposableDocument = document.asAsyncDisposable();

    expect(document.isDestroyed).toStrictEqual(false);
    expect(disposableDocument.isDestroyed).toStrictEqual(false);
    expect(destroySpy).not.toHaveBeenCalled();

    await disposableDocument[Symbol.asyncDispose]();

    expect(destroySpy).toHaveBeenCalledOnce();
    expect(document.isDestroyed).toStrictEqual(true);
    expect(disposableDocument.isDestroyed).toStrictEqual(true);
  });

  it("only calls the underlying destroy once across repeated dispose calls", async () => {
    const documentProto = await getPdfDocumentProxyPrototype();
    const destroySpy = vi.spyOn(documentProto, "destroy");

    const document = await pdf("./tests/example.pdf");
    const disposableDocument = document.asAsyncDisposable();

    await disposableDocument[Symbol.asyncDispose]();
    await disposableDocument[Symbol.asyncDispose]();

    expect(destroySpy).toHaveBeenCalledOnce();
    expect(document.isDestroyed).toStrictEqual(true);
  });
});
