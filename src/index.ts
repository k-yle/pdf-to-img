import "./polyfill"; // do this before pdfjs

// 🛑 inspite of esModuleInterop being on, you still need to use `import *`, and there are no typedefs
import * as _pdfjs from "pdfjs-dist/legacy/build/pdf";
import type { DocumentInitParameters } from "pdfjs-dist/types/src/display/api";
import { NodeCanvasFactory } from "./canvasFactory";
import { parseInput } from "./parseInput";
import path from "path";

const pdfjs: typeof import("pdfjs-dist") = _pdfjs;
const pdfjs_path = path.dirname(require.resolve("pdfjs-dist/package.json"));

/** required since k-yle/pdf-to-img#58, the objects from pdfjs are weirdly structured */
const sanitize = (x: object) => {
  const obj: Record<string, string> = JSON.parse(JSON.stringify(x));

  // remove UTF16 BOM and weird 0x0 character introduced in k-yle/pdf-to-img#138 and k-yle/pdf-to-img#184
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      // eslint-disable-next-line no-control-regex -- this is deliberate
      obj[key] = obj[key].replace(/(^þÿ|\x00)/g, "");
    }
  }
  return obj;
};

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
  /** document init parameters which are passed to pdfjs.getDocument */
  docInitParams?: Partial<DocumentInitParameters>;
};

/**
 * Converts a PDF to a series of images. This returns a `Symbol.asyncIterator`
 *
 * @param input Either (a) the path to a pdf file, or (b) a data url, or (c) a buffer, or (d) a ReadableStream.
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
  input: string | Buffer | NodeJS.ReadableStream,
  options: Options = {}
): Promise<{
  length: number;
  metadata: PdfMetadata;
  [Symbol.asyncIterator](): AsyncIterator<Buffer, void, void>;
}> {
  const data = await parseInput(input);
  const { docInitParams } = options;

  const pdfDocument = await pdfjs.getDocument({
    password: options.password, // retain for backward compatibility, but ensure settings from docInitParams overrides this and others, if given.
    standardFontDataUrl: path.join(pdfjs_path, "standard_fonts"),
    cMapUrl: path.join(pdfjs_path, "cmaps"),
    cMapPacked: true,
    ...docInitParams,
    data,
  }).promise;

  return {
    length: pdfDocument.numPages,
    metadata: sanitize((await pdfDocument.getMetadata()).info),
    [Symbol.asyncIterator]() {
      return {
        pg: 0,
        async next(this: { pg: number }) {
          // eslint-disable-next-line no-unreachable-loop -- broken rule, this is a generator
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
