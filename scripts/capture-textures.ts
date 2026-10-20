// Captures every texture from the built playground into one labeled grid,
// `docs/images/textures.png`, for the repository README.
//
// Run `pnpm capture:textures` from the repository root. It builds first, then serves
// `apps/playground/out`. The first run on a machine needs `pnpm exec playwright install chromium`.

import { chromium } from "playwright";

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = new URL("../apps/playground/out/", import.meta.url);
const IMAGE_PATH = fileURLToPath(new URL("../docs/images/textures.png", import.meta.url));
const PORT = 4321;
// Each texture's label in the playground, and its `texture` prop value for the caption.
const TEXTURES = [
  ["Plain", "plain"],
  ["Noise", "noise"],
  ["Mosaic", "mosaic"],
  ["Scratch card", "scratch-card"],
  ["Grain", "grain"],
  ["Scanlines", "scanlines"],
  ["Gradient", "gradient"],
  ["Dither", "dither"],
] as const;
// The size of each tile, in CSS pixels; screenshots are taken at twice that for sharp edges.
const TILE_WIDTH = 240;
const TILE_HEIGHT = 140;
// How long a new texture gets to set up and paint before it is captured, in milliseconds.
const PAINT_DELAY = 400;

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

// Serves the static export, the way GitHub Pages would at the root of a site.
const server = createServer(async (request, response) => {
  const path = new URL(request.url ?? "/", "http://localhost").pathname;
  const file = new URL(`.${path.endsWith("/") ? `${path}index.html` : path}`, OUT_DIR);
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      "content-type": CONTENT_TYPES[extname(file.pathname)] ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise<void>((resolve) => server.listen(PORT, resolve));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  await page.goto(`http://localhost:${PORT}/`);

  // The controls live in the sidebar, which starts closed.
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await page.getByLabel("Width").fill(String(TILE_WIDTH));
  await page.getByLabel("Height").fill(String(TILE_HEIGHT));

  // The veil is the cover canvas's parent; its box is the content's size.
  const veil = page.locator("canvas").first().locator("..");
  const tiles: { value: string; image: string }[] = [];
  for (const [label, value] of TEXTURES) {
    await page.getByRole("radio", { name: label, exact: true }).click();
    await page.waitForTimeout(PAINT_DELAY);
    const image = await veil.screenshot();
    tiles.push({ value, image: image.toString("base64") });
  }

  // Lays the tiles out four to a row, each captioned with its prop value, and captures that.
  const grid = await browser.newPage({ deviceScaleFactor: 2 });
  await grid.setContent(`
    <style>
      body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      main {
        display: inline-grid;
        grid-template-columns: repeat(4, ${TILE_WIDTH}px);
        gap: 20px 16px;
        padding: 24px;
        background: #fafafa;
      }
      figure { margin: 0; }
      img { display: block; width: ${TILE_WIDTH}px; height: ${TILE_HEIGHT}px; border-radius: 6px; }
      figcaption { margin-top: 8px; font-size: 13px; color: #404040; text-align: center; }
    </style>
    <main>
      ${tiles
        .map(
          ({ value, image }) => `
            <figure>
              <img src="data:image/png;base64,${image}" alt="" />
              <figcaption>${value}</figcaption>
            </figure>`,
        )
        .join("")}
    </main>
  `);
  await grid.locator("main").screenshot({ path: IMAGE_PATH });
  console.log(`Saved ${IMAGE_PATH}`);
} finally {
  await browser.close();
  server.close();
}
