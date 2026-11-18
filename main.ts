// News-image-daily entry (Node 22, standard library only).
//
// Validates the entry.png beside this file, then copies the exact bytes to
// $MAKEFUN_OUTPUT_DIR (default /output) as entry.png. Validation rules:
//   - PNG magic number must match;
//   - IHDR width and height must both be exactly 1024;
//   - file size must not exceed 1 MiB.
// No timestamps, no randomness, no network: two runs produce byte-identical output.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node --experimental-strip-types main.ts

import { copyFileSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1048576; // 1 MiB
const REQUIRED_SIZE = 1024; // width and height, pixels

const SOURCE = new URL('./entry.png', import.meta.url);
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  console.error(`entry.png validation failed: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

function validate(path: URL): void {
  let bytes: Buffer;
  try {
    bytes = readFileSync(path);
  } catch (err) {
    fail(`cannot read source file: ${(err as Error).message}`);
  }

  if (bytes.length > MAX_BYTES) {
    const over = bytes.length - MAX_BYTES;
    fail(
      `file is ${bytes.length} bytes, exceeds the 1 MiB limit (${MAX_BYTES} bytes) by ${over} bytes`,
    );
  }

  if (!bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    fail('missing PNG magic number (not a valid PNG file)');
  }

  if (bytes.length < 24) {
    fail(`file too short (${bytes.length} bytes): IHDR chunk is incomplete`);
  }

  // IHDR payload starts at byte 16: width (bytes 16-19) and height (20-23), big-endian uint32.
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== REQUIRED_SIZE || height !== REQUIRED_SIZE) {
    fail(`image is ${width}x${height}, must be exactly ${REQUIRED_SIZE}x${REQUIRED_SIZE}`);
  }
}

validate(SOURCE);
copyFileSync(SOURCE, join(OUTPUT_DIR, 'entry.png'));
console.log(`entry.png validated and copied to ${join(OUTPUT_DIR, 'entry.png')}`);
