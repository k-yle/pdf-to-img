import { readFileSync } from "node:fs";
import { arrayBuffer } from "node:stream/consumers";

const PREFIX = "data:application/pdf;base64,";

export async function parseInput(
  input: string | Uint8Array | Buffer | NodeJS.ReadableStream
): Promise<Uint8Array> {
  // Buffer is a subclass of Uint8Array, but it's not actually
  // compatible: https://github.com/sindresorhus/uint8array-extras/issues/4
  if (Buffer.isBuffer(input)) return Uint8Array.from(input);

  if (input instanceof Uint8Array) return input;

  // provided with a data url or a path to a file on disk
  if (typeof input === "string") {
    if (input.startsWith(PREFIX)) {
      return Uint8Array.from(Buffer.from(input.slice(PREFIX.length), "base64"));
    }
    return new Uint8Array(readFileSync(input));
  }

  // provided a ReadableStream (or any object with an asyncIterator that yields buffer chunks)
  if (typeof input === "object" && input && Symbol.asyncIterator in input) {
    return new Uint8Array(await arrayBuffer(input));
  }

  throw new Error(
    "pdf-to-img received an unexpected input. Provide a path to file, a data URL, a Uint8Array, a Buffer, or a ReadableStream."
  );
}
