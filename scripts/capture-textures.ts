// Captures every texture from the built playground into one labeled grid,
// `docs/images/textures.png`, for the repository README.
//
// Run `pnpm capture:textures` from the repository root. It builds first, then serves
// `apps/playground/out`. The first run on a machine needs `pnpm exec playwright install chromium`.

import { chromium } from "playwright";

import { getVeil, openPlayground, servePlayground, TILE_HEIGHT, TILE_WIDTH } from "./playground.ts";
import { fileURLToPath } from "node:url";

const IMAGE_PATH = fileURLToPath(new URL("../docs/images/textures.png", import.meta.url));
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
// How long a new texture gets to set up and paint before it is captured, in milliseconds.
const PAINT_DELAY = 400;

const server = await servePlayground();
const browser = await chromium.launch();
try {
  // At twice the size, for sharp edges.
  const page = await openPlayground(browser, 2);
  const veil = getVeil(page);
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
