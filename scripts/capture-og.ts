// Renders the demo's link preview image, `apps/playground/public/og.png` (1200 × 630): the name,
// what it does, and a veil caught mid-scratch with embers flying. The page's metadata points to it.
//
// Run `pnpm capture:og` from the repository root. It builds first, then serves
// `apps/playground/out`. The first run on a machine needs `pnpm exec playwright install chromium`.

import { chromium } from "playwright";

import { getVeil, openPlayground, servePlayground } from "./playground.ts";
import { fileURLToPath } from "node:url";

const IMAGE_PATH = fileURLToPath(new URL("../apps/playground/public/og.png", import.meta.url));
// The veil in the picture, in CSS pixels, and how far its particles may fly past it.
const VEIL_WIDTH = 440;
const VEIL_HEIGHT = 240;
const PARTICLE_ROOM = 56;
const PARTICLE_ROOM_ABOVE = 112;
// The stroke: from the bottom left to past the middle, in this many 40 ms steps of the page's time,
// then a moment for the embers to rise before the picture is taken.
const STROKE_STEPS = 12;
const STEP_DURATION = 40;
const RISE_DURATION = 160;

const server = await servePlayground();
const browser = await chromium.launch();
try {
  // At twice the size, so the preview stays sharp where it is shown large.
  const page = await openPlayground(browser, 2, (newPage) => newPage.clock.install());
  // The code box would show up just under the veil; only the veil is wanted.
  await page.addStyleTag({ content: "pre, pre + div { visibility: hidden !important; }" });
  await page.getByLabel("Width").fill(String(VEIL_WIDTH));
  await page.getByLabel("Height").fill(String(VEIL_HEIGHT));
  // Black, so the embers and the glowing edge stand out.
  await page.getByRole("radio", { name: "Plain", exact: true }).click();
  await page.getByRole("radio", { name: "Ash", exact: true }).click();
  await page.waitForTimeout(400);

  const box = await getVeil(page).boundingBox();
  if (!box) {
    throw new Error("The veil is not on the page");
  }
  const pageTime = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(pageTime + 1000);
  for (let step = 0; step <= STROKE_STEPS; step += 1) {
    const progress = step / STROKE_STEPS;
    await page.mouse.move(
      box.x + box.width * (0.1 + 0.55 * progress),
      box.y + box.height * (0.8 - 0.5 * progress),
    );
    await page.clock.runFor(STEP_DURATION);
  }
  await page.clock.runFor(RISE_DURATION);
  const veil = await page.screenshot({
    clip: {
      x: box.x - PARTICLE_ROOM,
      y: box.y - PARTICLE_ROOM_ABOVE,
      width: box.width + 2 * PARTICLE_ROOM,
      height: box.height + PARTICLE_ROOM_ABOVE + PARTICLE_ROOM,
    },
  });

  // The card: words on the left, the scratched veil on the right.
  const card = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await card.setContent(`
    <style>
      body {
        margin: 0;
        width: 1200px;
        height: 630px;
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 0 64px 0 80px;
        box-sizing: border-box;
        background: #ffffff;
        font-family: "Segoe UI", Inter, system-ui, sans-serif;
        color: #0a0a0a;
      }
      section { flex: 1; }
      h1 { margin: 0; font-size: 96px; letter-spacing: -2px; }
      p { margin: 16px 0 40px; font-size: 32px; line-height: 1.3; color: #525252; }
      code {
        font-family: ui-monospace, Consolas, monospace;
        font-size: 26px;
        padding: 12px 20px;
        border-radius: 10px;
        background: #f5f5f5;
        border: 1px solid #e5e5e5;
      }
      img { width: ${box.width + 2 * PARTICLE_ROOM}px; }
    </style>
    <section>
      <h1>Veil</h1>
      <p>Scratch-to-reveal<br />React component</p>
      <code>npm i @-3-/veil</code>
    </section>
    <img src="data:image/png;base64,${veil.toString("base64")}" alt="" />
  `);
  await card.screenshot({ path: IMAGE_PATH });
  console.log(`Saved ${IMAGE_PATH}`);
} finally {
  await browser.close();
  server.close();
}
