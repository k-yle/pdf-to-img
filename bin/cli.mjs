#!/usr/bin/env node

// @ts-check
import { promises as fs } from "node:fs";
import { parseArgs } from "node:util";
import { basename, join, resolve } from "node:path";
import { pdf } from "../dist/index.js";

const { values, positionals } = parseArgs({
  options: {
    scale: { short: "s", type: "string", default: "3" },
    password: { short: "p", type: "string" },
    output: { short: "o", type: "string" },
    pages: { short: "g", type: "string", multiple: true },
  },
  allowPositionals: true,
});

const [inputFile] = positionals;

if (!inputFile) {
  throw new Error(
    "Please specify an input file, for example, `pdf2img -s 3 example.pdf`"
  );
}

/** the name of the file, without the file extension */
const inputFileBaseName = /** @type {string} */ (basename(inputFile)).replace(
  /\.pdf$/,
  ""
);

const fullInputFilePath = resolve(process.cwd(), inputFile);
const outputFolder = join(process.cwd(), values.output || "");

async function main() {
  const document = await pdf(fullInputFilePath, {
    scale: +(values.scale || 3),
    password: values.password,
  });

  if (values.output) {
    // if the user specified a custom output folder,
    // create it if it does't already exist.
    await fs.mkdir(outputFolder, { recursive: true });
  }

  if (values.pages) {
    const allPages = new Set(values.pages.flatMap((str) => str.split(",")));
    for (const pageNumber of allPages) {
      const pageCount = document.length;
      if (
        Number.isNaN(+pageNumber) ||
        !Number.isInteger(+pageNumber) ||
        +pageNumber <= 0 ||
        +pageNumber > pageCount
      ) {
        throw new TypeError(
          `“${pageNumber}” is not a valid page number. Expected 1-${pageCount}`
        );
      }
      const image = await document.getPage(+pageNumber);
      const outputImageName = `${inputFileBaseName}-${pageNumber}.png`;
      console.log(outputImageName);
      await fs.writeFile(join(outputFolder, outputImageName), image);
    }
  } else {
    let pageNumber = 1;
    for await (const image of document) {
      const outputImageName = `${inputFileBaseName}-${pageNumber}.png`;
      console.log(outputImageName);
      await fs.writeFile(join(outputFolder, outputImageName), image);
      pageNumber++;
    }
  }
}

main();
