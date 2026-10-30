import { randomBetween } from "./random";
import type { Point, VeilEffect, VeilWindDirection } from "./types";

// At most this many pixels move at once. Past it, cleared pixels just vanish, so a big brush on a
// big veil can't stall the page.
export const MAX_PARTICLES = 20_000;
// How fast drifting pixels sway side to side, and twinkling ones flicker, in radians per
// millisecond.
const SWAY_SPEED = 0.008;
const TWINKLE_SPEED = 0.04;
// Ash: the share of cleared pixels that fly off as embers; the rest crumble into ash of this color.
const ASH_EMBER_SHARE = 0.1;
const ASH_COLOR = "rgb(70 70 70)";
// How an ember's color changes as it burns out: `[progress, [red, green, blue]]` stops, from
// yellow through orange and red to ash gray.
const EMBER_COLOR_STOPS: [number, [number, number, number]][] = [
  [0, [255, 230, 140]],
  [0.25, [255, 150, 40]],
  [0.6, [200, 50, 20]],
  [1, [60, 60, 60]],
];
// How many steps of that change are worked out ahead, so drawing an ember never builds a string.
const EMBER_COLOR_STEPS = 100;
// With ash, the cover just past the cleared trail glows like a burning edge: this many pixels
// wide, for this many milliseconds.
export const BURN_EDGE_WIDTH = 2;
const BURN_EDGE_LIFETIME = 600;

// Each wind direction as a step on the grid, y growing downward; null for `any`.
const WIND_STEPS: Record<VeilWindDirection, Point | null> = {
  "up-left": { x: -1, y: -1 },
  up: { x: 0, y: -1 },
  "up-right": { x: 1, y: -1 },
  left: { x: -1, y: 0 },
  any: null,
  right: { x: 1, y: 0 },
  "down-left": { x: -1, y: 1 },
  down: { x: 0, y: 1 },
  "down-right": { x: 1, y: 1 },
};

// A cleared pixel on its way off the cover. Distances are in pixels and times in milliseconds,
// with y growing downward.
export interface Particle extends Point {
  color: string;
  bornAt: number;
  lifetime: number;
  velocityX: number;
  velocityY: number;
  /** Downward acceleration, in pixels per millisecond squared. */
  gravity: number;
  /** How far it sways side to side; 0 for none. */
  sway: number;
  /** Where in its sway and flicker it starts, in radians. */
  phase: number;
  /** Whether it flickers as it fades. */
  twinkles: boolean;
  /** Whether it burns through the ember colors instead of keeping `color`. */
  glows: boolean;
}

// Every particle is built here, with the same fields in the same order, so the browser keeps them
// all in one shape and drawing them stays fast.
const makeParticle = (
  x: number,
  y: number,
  color: string,
  bornAt: number,
  lifetime: number,
  velocityX: number,
  velocityY: number,
  gravity: number,
  sway: number,
  twinkles: boolean,
  glows: boolean,
): Particle => ({
  x,
  y,
  color,
  bornAt,
  lifetime,
  velocityX,
  velocityY,
  gravity,
  sway,
  phase: randomBetween(0, 2 * Math.PI),
  twinkles,
  glows,
});

// The CSS color of each shade a cover pixel can have, made once and reused, keyed by its packed
// red, green and blue.
const pixelColors = new Map<number, string>();

// The CSS color of the pixel whose RGBA starts at `index` in `data`.
export const getPixelColor = (data: Uint8ClampedArray, index: number) => {
  const key = (data[index] << 16) | (data[index + 1] << 8) | data[index + 2];
  let color = pixelColors.get(key);
  if (color === undefined) {
    color = `rgb(${data[index]} ${data[index + 1]} ${data[index + 2]})`;
    pixelColors.set(key, color);
  }
  return color;
};

// An ember's color at each of `EMBER_COLOR_STEPS + 1` points through its life.
const EMBER_COLORS = Array.from({ length: EMBER_COLOR_STEPS + 1 }, (_, step) => {
  const progress = step / EMBER_COLOR_STEPS;
  const next = EMBER_COLOR_STOPS.findIndex(([stop]) => stop >= progress);
  if (next <= 0) {
    return `rgb(${EMBER_COLOR_STOPS[0][1].join(" ")})`;
  }
  const [fromStop, from] = EMBER_COLOR_STOPS[next - 1];
  const [toStop, to] = EMBER_COLOR_STOPS[next];
  const mix = (progress - fromStop) / (toStop - fromStop);
  return `rgb(${from.map((channel, index) => channel + (to[index] - channel) * mix).join(" ")})`;
});

// An ember's color, `progress` (0 to 1) of the way through its life.
const getEmberColor = (progress: number) =>
  EMBER_COLORS[Math.min(EMBER_COLOR_STEPS, Math.max(0, Math.round(progress * EMBER_COLOR_STEPS)))];

// The particle a pixel at (x, y) of `color` becomes when cleared at `bornAt`, `offset` from the
// stroke's nearest point, for `effect`. Every effect keeps its pixels within the particle layer's
// most room around the cover, `PARTICLE_ROOM` (56px) each way but `PARTICLE_ROOM_ABOVE` (112px)
// above; the numbers after each one show its furthest reach.
export const createParticle = (
  effect: VeilEffect,
  x: number,
  y: number,
  color: string,
  bornAt: number,
  offsetX: number,
  offsetY: number,
  windDirection: VeilWindDirection,
): Particle => {
  switch (effect) {
    case "float":
      // Up 0.08 × 700 = 56.
      return makeParticle(
        x,
        y,
        color,
        bornAt,
        700,
        randomBetween(-0.015, 0.015),
        -randomBetween(0.03, 0.08),
        0,
        0,
        false,
        false,
      );
    case "sand":
      // Down 0.02 × 700 + ½ × 0.00017 × 700² ≈ 56.
      return makeParticle(
        x,
        y,
        color,
        bornAt,
        700,
        randomBetween(-0.01, 0.01),
        randomBetween(0, 0.02),
        0.00017,
        0,
        false,
        false,
      );
    case "scatter": {
      // Out 0.08 × 700 = 56, away from the stroke (any way from right on it).
      const angle =
        offsetX === 0 && offsetY === 0
          ? randomBetween(0, 2 * Math.PI)
          : Math.atan2(offsetY, offsetX);
      const speed = randomBetween(0.02, 0.08);
      return makeParticle(
        x,
        y,
        color,
        bornAt,
        700,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0,
        0,
        false,
        false,
      );
    }
    case "dissolve":
      return makeParticle(x, y, color, bornAt, 500, 0, 0, 0, 0, false, false);
    case "wind": {
      // Along the wind 0.075 × 700 + 3 ≈ 56, with a little drift across it.
      const step = WIND_STEPS[windDirection];
      const angle = step ? Math.atan2(step.y, step.x) : randomBetween(0, 2 * Math.PI);
      const speed = randomBetween(0.04, 0.075);
      const drift = randomBetween(-0.005, 0.005);
      return makeParticle(
        x,
        y,
        color,
        bornAt,
        700,
        Math.cos(angle) * speed - Math.sin(angle) * drift,
        Math.sin(angle) * speed + Math.cos(angle) * drift,
        0,
        3,
        false,
        false,
      );
    }
    case "snow":
      // Down 0.035 × 1400 = 49.
      return makeParticle(
        x,
        y,
        color,
        bornAt,
        1400,
        0,
        randomBetween(0.01, 0.035),
        0,
        randomBetween(2, 5),
        false,
        false,
      );
    case "sparkle":
      // Up 0.02 × 900 = 18.
      return makeParticle(x, y, color, bornAt, 900, 0, -randomBetween(0, 0.02), 0, 0, true, false);
    case "ash":
      // Embers rise faster and faster, as if on hot air: up 0.02 × 1000 + ½ × 0.00018 × 1000² =
      // 110. Sideways 0.01 × 1000 + 6 = 16.
      if (Math.random() < ASH_EMBER_SHARE) {
        return makeParticle(
          x,
          y,
          color,
          bornAt,
          1000,
          randomBetween(-0.01, 0.01),
          -randomBetween(0.005, 0.02),
          -0.00018,
          randomBetween(2, 6),
          true,
          true,
        );
      }
      // The rest crumble into ash where they were and settle a little: down 0.01 × 600 = 6.
      return makeParticle(
        x,
        y,
        ASH_COLOR,
        bornAt,
        600,
        0,
        randomBetween(0, 0.01),
        0,
        0,
        false,
        false,
      );
  }
};

// The burning edge's glow on a still-covered pixel at (x, y): an ember that stays put.
export const createBurnEdgeParticle = (x: number, y: number, bornAt: number) =>
  makeParticle(x, y, "", bornAt, BURN_EDGE_LIFETIME, 0, 0, 0, 0, true, true);

// Whether the burning edge at a pixel last lit at `burnedAt` has died down, so it may light again.
export const hasBurnedOut = (burnedAt: number | undefined, now: number) =>
  burnedAt === undefined || now - burnedAt >= BURN_EDGE_LIFETIME;

// Drops the particles that have faded out by `now`, in place, keeping the others in order.
export const removeFadedParticles = (particles: Particle[], now: number) => {
  let kept = 0;
  for (const particle of particles) {
    if (now - particle.bornAt < particle.lifetime) {
      particles[kept] = particle;
      kept += 1;
    }
  }
  particles.length = kept;
};

// Draws each particle where it has moved to `now`, fading over its life, onto the particle layer,
// whose `origin` is where the cover's top-left corner lands on it.
export const drawParticles = (
  context: CanvasRenderingContext2D,
  particles: Particle[],
  now: number,
  origin: Point,
) => {
  for (const particle of particles) {
    const { x, y, color, bornAt, lifetime, velocityX, velocityY, gravity, sway, phase } = particle;
    const age = now - bornAt;
    const progress = age / lifetime;
    const flicker = particle.twinkles ? 0.5 + 0.5 * Math.sin(age * TWINKLE_SPEED + phase) : 1;
    context.globalAlpha = (1 - progress) * flicker;
    context.fillStyle = particle.glows ? getEmberColor(progress) : color;
    context.fillRect(
      x + origin.x + velocityX * age + sway * Math.sin(age * SWAY_SPEED + phase),
      y + origin.y + velocityY * age + 0.5 * gravity * age * age,
      1,
      1,
    );
  }
  context.globalAlpha = 1;
};
