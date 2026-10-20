import { randomBetween } from "./random";
import type { VeilTexture } from "./types";

// Range of the cover's random gray shades (0 black, 255 white).
const NOISE_MIN_SHADE = 110;
const NOISE_MAX_SHADE = 200;
// How often the moving textures change, in milliseconds.
export const NOISE_INTERVAL = 80;
// The cover's single shade for the plain texture: black.
const PLAIN_SHADE = 0;
// Side of each mosaic block, in pixels.
const MOSAIC_BLOCK_SIZE = 8;
// The scratch card's silver: a light base with diagonal sheen bands swinging it either way.
const SCRATCH_CARD_BASE_SHADE = 190;
const SCRATCH_CARD_SHEEN = 35;
// Distance between sheen bands, in pixels.
const SCRATCH_CARD_SHEEN_PERIOD = 120;
// Grain: a dark base where this share of pixels sparkle light.
const GRAIN_BASE_SHADE = 50;
const GRAIN_SPECK_SHADE = 180;
const GRAIN_DENSITY = 0.05;
// Scanlines alternate these two shades, each line this many pixels thick.
const SCANLINE_LIGHT_SHADE = 150;
const SCANLINE_DARK_SHADE = 80;
const SCANLINE_THICKNESS = 2;
// The gradient runs from the top shade down to the bottom one; dither draws the same ramp in dots.
const GRADIENT_TOP_SHADE = 60;
const GRADIENT_BOTTOM_SHADE = 200;
// 4×4 Bayer matrix: the order in which dither dots turn light as the ramp brightens.
const BAYER_MATRIX = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// Textures that keep changing every `NOISE_INTERVAL`; the rest are painted once.
export const MOVING_TEXTURES: VeilTexture[] = ["noise", "mosaic", "grain", "scanlines"];

// How `texture` shades the pixel at (x, y) on a cover of the given size. `tick` counts repaints,
// so the moving textures can move.
export const createShader = (
  texture: VeilTexture,
  { width, height }: ImageData,
  tick: number,
): ((x: number, y: number) => number) => {
  switch (texture) {
    case "plain":
      return () => PLAIN_SHADE;
    case "noise":
      return () => randomBetween(NOISE_MIN_SHADE, NOISE_MAX_SHADE);
    case "mosaic": {
      const columns = Math.ceil(width / MOSAIC_BLOCK_SIZE);
      const rows = Math.ceil(height / MOSAIC_BLOCK_SIZE);
      const blocks = Array.from({ length: columns * rows }, () =>
        randomBetween(NOISE_MIN_SHADE, NOISE_MAX_SHADE),
      );
      return (x, y) =>
        blocks[Math.floor(y / MOSAIC_BLOCK_SIZE) * columns + Math.floor(x / MOSAIC_BLOCK_SIZE)];
    }
    case "scratch-card":
      return (x, y) =>
        SCRATCH_CARD_BASE_SHADE +
        SCRATCH_CARD_SHEEN * Math.sin(((x + y) * 2 * Math.PI) / SCRATCH_CARD_SHEEN_PERIOD);
    case "grain":
      return () => (Math.random() < GRAIN_DENSITY ? GRAIN_SPECK_SHADE : GRAIN_BASE_SHADE);
    case "scanlines":
      // Scrolls down one pixel per repaint.
      return (_x, y) =>
        Math.floor((y - tick) / SCANLINE_THICKNESS) % 2 === 0
          ? SCANLINE_LIGHT_SHADE
          : SCANLINE_DARK_SHADE;
    case "gradient":
      return (_x, y) =>
        GRADIENT_TOP_SHADE + ((GRADIENT_BOTTOM_SHADE - GRADIENT_TOP_SHADE) * y) / height;
    case "dither":
      return (x, y) =>
        y / height > (BAYER_MATRIX[y % 4][x % 4] + 0.5) / 16
          ? GRADIENT_BOTTOM_SHADE
          : GRADIENT_TOP_SHADE;
  }
};

// Gives every pixel still on the cover a gray shade from `getShade`, keeping cleared pixels clear.
export const shadeCover = (
  { data, width }: ImageData,
  getShade: (x: number, y: number) => number,
) => {
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }
    const pixel = index / 4;
    const shade = getShade(pixel % width, Math.floor(pixel / width));
    data[index] = shade;
    data[index + 1] = shade;
    data[index + 2] = shade;
  }
};
