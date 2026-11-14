import { readFile, writeFile } from "node:fs/promises";
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
    ["icon-192.png", 192, false],
    ["icon-512.png", 512, false],
    ["apple-touch-icon.png", 180, false],
    ["icon-maskable-512.png", 512, true],
  ]) {
    const data = await page.evaluate(
      async ({ source, size, maskable }) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#3156f5";
        ctx.fillRect(0, 0, size, size);
        const image = new Image();
        image.src = `data:image/svg+xml,${encodeURIComponent(source)}`;
        await image.decode();
        // Keep all foreground artwork inside the maskable icon's central safe circle.
        const scale = maskable ? 0.75 : 1;
        const inset = (size * (1 - scale)) / 2;
        ctx.drawImage(image, inset, inset, size * scale, size * scale);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { source, size, maskable },
    );
    await writeFile(
      new URL(`../public/${name}`, import.meta.url),
      Buffer.from(data, "base64"),
    );
  }
} finally {
  await browser.close();
}
