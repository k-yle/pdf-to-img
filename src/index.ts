import "./polyfill.js"; // do this before pdfjs
import { createRequire } from "node:module";
import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import type {
  DocumentInitParameters,
  RenderParameters,
} from "pdfjs-dist/types/src/display/api.js";
import { NodeCanvasFactory } from "./canvasFactory.js";
import { parseInput } from "./parseInput.js";

const pdfjsPath = path.dirname(
  createRequire(import.meta.url).resolve("pdfjs-dist/package.json")
);

/** required since k-yle/pdf-to-img#58, the objects from pdfjs are weirdly structured */
const sanitize = (x: object) => {
  const object: Record<string, string> = JSON.parse(JSON.stringify(x));

  // remove UTF16 BOM and weird 0x0 character introduced in k-yle/pdf-to-img#138 and k-yle/pdf-to-img#184
  for (const key in object) {
    if (typeof object[key] === "string") {
      // eslint-disable-next-line no-control-regex -- this is deliberate
      object[key] = object[key].replaceAll(/(^þÿ|\u0000)/g, "");
    }
  }
  return object;
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
  /** render parameters which are passed to `PdfPage#render` */
  renderParams?: Omit<RenderParameters, "canvasContext" | "viewport">;
  /** document init parameters which are passed to pdfjs.getDocument */
  docInitParams?: Partial<DocumentInitParameters>;
};

/**
 * Converts a PDF to a series of images. This returns a `Symbol.asyncIterator`
 *
 * @param input Either (a) the path to a pdf file, or (b) a data url, or (b) a buffer, (c) a buffer, or (e) a ReadableStream.
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
  input: string | Uint8Array | Buffer | NodeJS.ReadableStream,
  options: Options = {}
): Promise<{
  length: number;
  metadata: PdfMetadata;
  getPage(pageNumber: number): Promise<Buffer>;
  [Symbol.asyncIterator](): AsyncIterator<Buffer, void, void>;
}> {
  const data = await parseInput(input);

  const canvasFactory = new NodeCanvasFactory();
  const pdfDocument = await pdfjs.getDocument({
    password: options.password, // retain for backward compatibility, but ensure settings from docInitParams overrides this and others, if given.
    standardFontDataUrl: path.join(pdfjsPath, `standard_fonts${path.sep}`),
    cMapUrl: path.join(pdfjsPath, `cmaps${path.sep}`),
    cMapPacked: true,
    ...options.docInitParams,
    isEvalSupported: false,
    canvasFactory,
    data,
  }).promise;

  const metadata = await pdfDocument.getMetadata();

  async function getPage(pageNumber: number) {
    const page = await pdfDocument.getPage(pageNumber);

    const viewport = page.getViewport({ scale: options.scale ?? 1 });

    const { canvas, context } = canvasFactory.create(
      viewport.width,
      viewport.height,
      !!options.renderParams?.background
    );

    await page.render({
      canvasContext: context,
      viewport,
      ...options.renderParams,
    }).promise;

    return canvas.toBuffer();
  }

  return {
    length: pdfDocument.numPages,
    metadata: sanitize(metadata.info),
    getPage,
    [Symbol.asyncIterator]() {
      return {
        pg: 0,
        async next(this: { pg: number }) {
          if (this.pg < pdfDocument.numPages) {
            this.pg += 1;

            return { done: false, value: await getPage(this.pg) };
          }
          return { done: true, value: undefined };
        },
      };
    },
  };
}
