import { promises as fs } from "node:fs";

const PREFIX = "data:application/pdf;base64,";

async function streamToBuffer(
  readableStream: NodeJS.ReadableStream
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

export async function parseInput(
  input: string | Buffer | NodeJS.ReadableStream
): Promise<Buffer | Uint8Array> {
  // provided with a data url or a path to a file on disk
  if (typeof input === "string") {
    return input.startsWith(PREFIX)
      ? Buffer.from(input.slice(PREFIX.length), "base64")
      : new Uint8Array(await fs.readFile(input));
  }

  // provided a buffer
  if (Buffer.isBuffer(input)) return input;

  // provided a ReadableStream (or any object with an asyncIterator that yields buffer chunks)
  if (typeof input === "object" && input && Symbol.asyncIterator in input) {
    return streamToBuffer(input);
  }

  throw new Error(
    "pdf-to-img received an unexpected input. Provide a path to file, a data URL, a Buffer, or a ReadableStream."
  );
}
