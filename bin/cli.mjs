#!/usr/bin/env node

// @ts-check
import { promises as fs } from "node:fs";
import { parseArgs } from "node:util";
import { join } from "node:path";
import { pdf } from "../dist/index.js";

const { values, positionals } = parseArgs({
  options: {
    scale: { short: "s", type: "string", default: "3" },
    password: { short: "p", type: "string" },
    output: { short: "o", type: "string" },
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
const inputFileBaseName = /** @type {string} */ (
  inputFile.split("/").at(-1)
).replace(/\.pdf$/, "");

const fullInputFilePath = join(process.cwd(), inputFile);
const outputFolder = join(process.cwd(), values.output || "");

async function main() {
  let pageNumber = 1;

  const document = await pdf(fullInputFilePath, {
    scale: +(values.scale || 3),
    password: values.password,
  });

  if (values.output) {
    // if the user specified a custom output folder,
    // create it if it does't already exist.
    await fs.mkdir(outputFolder, { recursive: true });
  }

  for await (const image of document) {
    const outputImageName = `${inputFileBaseName}-${pageNumber}.png`;
    console.log(outputImageName);
    await fs.writeFile(join(outputFolder, outputImageName), image);
    pageNumber++;
  }
}

main();
