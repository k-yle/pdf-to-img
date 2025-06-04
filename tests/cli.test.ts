// @vitest-environment node
import { exec } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import { describe, expect, it } from "vitest";
import package_ from "../package.json";

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const cwd = join(__dirname, "__image_snapshots__");
const cliPath = join(__dirname, "..", package_.bin.pdf2img);
const exampleFile = join(__dirname, "7pages.pdf");

describe("CLI", () => {
  it("works when specific pages are specified", async () => {
    const { stdout, stderr } = await execAsync(
      `node ${cliPath} --pages 1,6,7 ${exampleFile}`,
      { cwd }
    );

    const pages = stdout.split("\n").filter(Boolean);

    expect(pages).toStrictEqual([
      "7pages-1.png",
      "7pages-6.png",
      "7pages-7.png",
    ]);
    expect(stderr).toBe("");

    // delete the files that the CLI wrote, and replace them with image snapshots
    for (const page of pages) {
      const fileName = join(cwd, page);
      const file = await fs.readFile(fileName);
      expect(file).toMatchImageSnapshot();
      await fs.rm(fileName);
    }
  });

  it.each(["0", "8", "abcdef"])(
    "errors if you use --pages with an invalid page (%s)",
    async (pg) => {
      await expect(() =>
        execAsync(`node ${cliPath} --pages ${pg} ${exampleFile}`, { cwd })
      ).rejects.toThrowError(
        `“${pg}” is not a valid page number. Expected 1-7`
      );
    }
  );
});
