// Records every effect from the built playground as a looping GIF,
// `docs/images/effects/<effect>.gif`, for the repository README.
//
// Run `pnpm capture:effects` from the repository root. It builds first, then serves
// `apps/playground/out`. The first run on a machine needs `pnpm exec playwright install chromium`.

import gifenc from "gifenc";
import { chromium } from "playwright";
import pngjs from "pngjs";

import { getVeil, openPlayground, servePlayground } from "./playground.ts";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const { GIFEncoder, applyPalette, quantize } = gifenc;
const { PNG } = pngjs;

const IMAGE_DIR = new URL("../docs/images/effects/", import.meta.url);
// Each effect's label in the playground, and its `effect` prop value for the file name.
const EFFECTS = [
  ["Float", "float"],
  ["Sand", "sand"],
  ["Scatter", "scatter"],
  ["Dissolve", "dissolve"],
  ["Wind", "wind"],
  ["Snow", "snow"],
  ["Sparkle", "sparkle"],
  ["Ash", "ash"],
] as const;
// Still and black, so the GIFs stay small and the particles stand out on the page.
const TEXTURE_LABEL = "Plain";
// How far particles fly past the veil (as in the package), included in each recording, in pixels.
const PARTICLE_ROOM = 56;
const PARTICLE_ROOM_ABOVE = 112;
// One frame every 40 ms of the page's time: the pointer sweeps across in the first 15, then the
// rest let the particles finish. The last frame holds a little before the GIF loops.
const FRAME_DURATION = 40;
const SWEEP_FRAMES = 15;
const FRAME_COUNT = 45;
const LAST_FRAME_HOLD = 600;
// How long a new effect gets to start the veil over before recording, in milliseconds.
const SETUP_DELAY = 400;

await mkdir(IMAGE_DIR, { recursive: true });
const server = await servePlayground();
const browser = await chromium.launch();
try {
  // The fake clock lets each frame be taken at exactly the right moment in the page's time, however
  // long the screenshot itself takes.
  const page = await openPlayground(browser, 1, (newPage) => newPage.clock.install());
  // The code box would show up just under the veil; only the veil is wanted.
  await page.addStyleTag({ content: "pre, pre + div { visibility: hidden !important; }" });
  await page.getByRole("radio", { name: TEXTURE_LABEL, exact: true }).click();
  // Back to the content's own height, about as tall as the brush: one stroke clears the full
  // height, so particles fly out over the page, where they show, instead of over the cover, which
  // is their own color.
  await page.getByLabel("Height").fill("");
  const veil = getVeil(page);

  for (const [label, value] of EFFECTS) {
    await page.clock.resume();
    await page.getByRole("radio", { name: label, exact: true }).click();
    await page.waitForTimeout(SETUP_DELAY);
    const box = await veil.boundingBox();
    if (!box) {
      throw new Error("The veil is not on the page");
    }
    const clip = {
      x: box.x - PARTICLE_ROOM,
      y: box.y - PARTICLE_ROOM_ABOVE,
      width: box.width + 2 * PARTICLE_ROOM,
      height: box.height + PARTICLE_ROOM_ABOVE + PARTICLE_ROOM,
    };
    const middle = box.y + box.height / 2;
    await page.mouse.move(box.x - 10, middle);
    const pageTime = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(pageTime + 1000);

    const gif = GIFEncoder();
    for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
      if (frame <= SWEEP_FRAMES) {
        await page.mouse.move(box.x + (box.width * frame) / SWEEP_FRAMES, middle);
      } else if (frame === SWEEP_FRAMES + 1) {
        await page.mouse.move(0, 0);
      }
      await page.clock.runFor(FRAME_DURATION);
      const { data, width, height } = PNG.sync.read(await page.screenshot({ clip }));
      const palette = quantize(data, 256);
      gif.writeFrame(applyPalette(data, palette), width, height, {
        palette,
        delay: frame === FRAME_COUNT - 1 ? LAST_FRAME_HOLD : FRAME_DURATION,
      });
    }
    gif.finish();

    const path = fileURLToPath(new URL(`${value}.gif`, IMAGE_DIR));
    await writeFile(path, gif.bytes());
    console.log(`Saved ${path}`);
  }
} finally {
  await browser.close();
  server.close();
}
