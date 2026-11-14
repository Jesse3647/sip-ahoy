import { readFile, writeFile } from "node:fs/promises";
import { crc32, deflateSync } from "node:zlib";
import { chromium } from "@playwright/test";

// Installation icons have a full-bleed background: the operating system applies its own mask.
const source = await readFile(
  new URL("../public/icon.svg", import.meta.url),
  "utf8",
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage();
  for (const [name, size, maskable] of [
    ["icon-192.png", 192, true],
    ["icon-512.png", 512, true],
    ["apple-touch-icon.png", 180, false],
    ["apple-touch-icon-v2.png", 180, false],
    ["apple-touch-icon-120.png", 120, false],
    ["apple-touch-icon-152.png", 152, false],
    ["apple-touch-icon-167.png", 167, false],
    ["apple-touch-icon-180.png", 180, false],
    ["icon-maskable-512.png", 512, true],
    ["icon-maskable-1024.png", 1024, true],
  ]) {
    const data = await page.evaluate(
      async ({ source, size, maskable }) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        // Encode RGB PNGs without an alpha channel for Apple's icon pipeline.
        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.fillStyle = "#3156f5";
        ctx.fillRect(0, 0, size, size);
        const image = new Image();
        image.src = `data:image/svg+xml,${encodeURIComponent(source)}`;
        await image.decode();
        // Keep all foreground artwork inside the maskable icon's central safe circle.
        const scale = maskable ? 0.9 : 1;
        const inset = (size * (1 - scale)) / 2;
        ctx.drawImage(image, inset, inset, size * scale, size * scale);
        const pixels = ctx.getImageData(0, 0, size, size).data;
        let binary = "";
        for (let offset = 0; offset < pixels.length; offset += 32768) {
          binary += String.fromCharCode(
            ...pixels.subarray(offset, offset + 32768),
          );
        }
        return btoa(binary);
      },
      { source, size, maskable },
    );
    await writeFile(
      new URL(`../public/${name}`, import.meta.url),
      encodeRGB(Buffer.from(data, "base64"), size),
    );
  }
} finally {
  await browser.close();
}

// Canvas PNG encoders can retain an alpha channel even for an opaque canvas.
// Write a simple RGB PNG explicitly, with unfiltered rows and standard CRCs.
function encodeRGB(rgba, size) {
  const chunk = (type, content) => {
    const name = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(content.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([name, content])));
    return Buffer.concat([length, name, content, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  const rows = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const source = (y * size + x) * 4;
      if (rgba[source + 3] !== 255)
        throw new Error("Installation icons must be opaque");
      const target = y * (size * 3 + 1) + 1 + x * 3;
      rgba.copy(rows, target, source, source + 3);
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
