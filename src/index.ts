import { promises as fs } from "fs";

import "./polyfill"; // do this before pdfjs

// @ts-expect-error 🛑 inspite of esModuleInterop being on, you still need to use `import *`, and there are no typedefs
import * as _pdfjs from "pdfjs-dist/es5/build/pdf";
import { NodeCanvasFactory } from "./canvasFactory";

const pdfjs: typeof import("pdfjs-dist") = _pdfjs;

export type PdfMetadata = {
  Title?: string;
  Author?: string;
  // TODO: Subject?
  Producer?: string;
  Creator?: string;
  CreationDate?: string;
  ModDate?: string;
};

export type Options = {
  /** For cases where the PDF is encrypted with a password */
  password?: string;
  /** defaults to `1`. If you want high-resolution images, increase this */
  scale?: number;
};

const PREFIX = "data:application/pdf;base64,";

/**
 * Converts a PDF to a series of images. This returns a `Symbol.asyncIterator`
 *
 * @param pathOrDataUrl the path to a pdf file, or a data url.
 *
 * @example
 * ```js
 * import pdf from "pdf-to-img";
 *
 * for await (const page of await pdf("example.pdf")) {
 *   expect(page).toMatchImageSnapshot();
 * }
 *
 * // or if you want access to more details:
 *
 * const doc = await pdf("example.pdf");
 * expect(doc.length).toBe(1);
 * expect(doc.metadata).toEqual({ ... });
 *
 * for await (const page of doc) {
 *   expect(page).toMatchImageSnapshot();
 * }
 * ```
 */
export async function pdf(
  pathOrDataUrl: string,
  options: Options = {}
): Promise<{
  length: number;
  metadata: PdfMetadata;
  [Symbol.asyncIterator](): AsyncIterator<Buffer, void, void>;
}> {
  const data = pathOrDataUrl.startsWith(PREFIX)
    ? Buffer.from(pathOrDataUrl.slice(PREFIX.length), "base64")
    : new Uint8Array(await fs.readFile(pathOrDataUrl));

  const pdfDocument = await pdfjs.getDocument({
    data,
    cMapUrl: "../node_modules/pdfjs-dist/cmaps/", // TODO: this feels hacky
    cMapPacked: true,
    password: options.password,
  }).promise;

  return {
    length: pdfDocument.numPages,
    metadata: (await pdfDocument.getMetadata()).info,
    [Symbol.asyncIterator]() {
      return {
        pg: 0,
        async next(this: { pg: number }) {
          while (this.pg < pdfDocument.numPages) {
            this.pg += 1;
            const page = await pdfDocument.getPage(this.pg);

            const viewport = page.getViewport({ scale: options.scale ?? 1 });

            const canvasFactory = new NodeCanvasFactory();
            const { canvas, context } = canvasFactory.create(
              viewport.width,
              viewport.height
            );

            await page.render({
              canvasContext: context,
              viewport,
              canvasFactory,
            }).promise;

            return { done: false, value: canvas.toBuffer() };
          }
          return { done: true, value: undefined };
        },
      };
    },
  };
}
