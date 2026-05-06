import * as fs from "node:fs/promises";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * `pdfjs` doesn't export the `PDFDocumentProxy` prototype.
 * Workaround to be able to spy on the underlying prototype.
 */
export async function getPdfDocumentProxyPrototype(): Promise<pdfjs.PDFDocumentProxy> {
  const data = new Uint8Array(await fs.readFile("./tests/example.pdf"));
  const document = await pdfjs.getDocument({ data }).promise;
  await document.destroy();

  const proto = Reflect.getPrototypeOf(document) as pdfjs.PDFDocumentProxy;

  return proto;
}
