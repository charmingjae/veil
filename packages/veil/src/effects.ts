import { randomBetween } from "./random";
import { PARTICLE_ROOM, PARTICLE_ROOM_ABOVE } from "./styles";
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
// With ash, the cover just past the cleared trail glows like a burning edge: this many pixels
// wide, for this many milliseconds.
export const BURN_EDGE_WIDTH = 2;
export const BURN_EDGE_LIFETIME = 600;

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

// How a cleared pixel moves once it leaves the cover. Distances are in pixels and times in
// milliseconds, with y growing downward.
interface Motion {
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
  /** Whether it burns through the ember colors instead of keeping one color. */
  glows: boolean;
  /** Its color, when not the cleared pixel's own. */
  color?: string;
}

export interface Particle extends Point, Motion {
  color: string;
  bornAt: number;
}

// An ember's color, `progress` (0 to 1) of the way through its life.
const getEmberColor = (progress: number) => {
  const next = EMBER_COLOR_STOPS.findIndex(([stop]) => stop >= progress);
  if (next <= 0) {
    return `rgb(${EMBER_COLOR_STOPS[0][1].join(" ")})`;
  }
  const [fromStop, from] = EMBER_COLOR_STOPS[next - 1];
  const [toStop, to] = EMBER_COLOR_STOPS[next];
  const mix = (progress - fromStop) / (toStop - fromStop);
  return `rgb(${from.map((channel, index) => channel + (to[index] - channel) * mix).join(" ")})`;
};

// How a pixel cleared at `offset` from the brush's center moves for `effect`. Every effect keeps
// its pixels within the particle layer's room around the cover, `PARTICLE_ROOM` (56px) each way
// but `PARTICLE_ROOM_ABOVE` (112px) above; the numbers after each one show its furthest reach.
export const createMotion = (
  effect: VeilEffect,
  offset: Point,
  windDirection: VeilWindDirection,
): Motion => {
  const still = {
    lifetime: 700,
    velocityX: 0,
    velocityY: 0,
    gravity: 0,
    sway: 0,
    phase: randomBetween(0, 2 * Math.PI),
    twinkles: false,
    glows: false,
  };
  switch (effect) {
    case "float":
      // Up 0.08 × 700 = 56.
      return {
        ...still,
        velocityX: randomBetween(-0.015, 0.015),
        velocityY: -randomBetween(0.03, 0.08),
      };
    case "sand":
      // Down 0.02 × 700 + ½ × 0.00017 × 700² ≈ 56.
      return {
        ...still,
        velocityX: randomBetween(-0.01, 0.01),
        velocityY: randomBetween(0, 0.02),
        gravity: 0.00017,
      };
    case "scatter": {
      // Out 0.08 × 700 = 56, away from the brush's center (any way from the center itself).
      const angle =
        offset.x === 0 && offset.y === 0
          ? randomBetween(0, 2 * Math.PI)
          : Math.atan2(offset.y, offset.x);
      const speed = randomBetween(0.02, 0.08);
      return { ...still, velocityX: Math.cos(angle) * speed, velocityY: Math.sin(angle) * speed };
    }
    case "dissolve":
      return { ...still, lifetime: 500 };
    case "wind": {
      // Along the wind 0.075 × 700 + 3 ≈ 56, with a little drift across it.
      const step = WIND_STEPS[windDirection];
      const angle = step ? Math.atan2(step.y, step.x) : randomBetween(0, 2 * Math.PI);
      const speed = randomBetween(0.04, 0.075);
      const drift = randomBetween(-0.005, 0.005);
      return {
        ...still,
        velocityX: Math.cos(angle) * speed - Math.sin(angle) * drift,
        velocityY: Math.sin(angle) * speed + Math.cos(angle) * drift,
        sway: 3,
      };
    }
    case "snow":
      // Down 0.035 × 1400 = 49.
      return {
        ...still,
        lifetime: 1400,
        velocityY: randomBetween(0.01, 0.035),
        sway: randomBetween(2, 5),
      };
    case "sparkle":
      // Up 0.02 × 900 = 18.
      return { ...still, lifetime: 900, velocityY: -randomBetween(0, 0.02), twinkles: true };
    case "ash":
      // Embers rise faster and faster, as if on hot air: up 0.02 × 1000 + ½ × 0.00018 × 1000² =
      // 110. Sideways 0.01 × 1000 + 6 = 16.
      if (Math.random() < ASH_EMBER_SHARE) {
        return {
          ...still,
          lifetime: 1000,
          velocityX: randomBetween(-0.01, 0.01),
          velocityY: -randomBetween(0.005, 0.02),
          gravity: -0.00018,
          sway: randomBetween(2, 6),
          twinkles: true,
          glows: true,
        };
      }
      // The rest crumble into ash where they were and settle a little: down 0.01 × 600 = 6.
      return { ...still, lifetime: 600, velocityY: randomBetween(0, 0.01), color: ASH_COLOR };
  }
};

// The burning edge's glow on a still-covered pixel: an ember that stays put.
export const createBurnEdgeMotion = (): Motion => ({
  lifetime: BURN_EDGE_LIFETIME,
  velocityX: 0,
  velocityY: 0,
  gravity: 0,
  sway: 0,
  phase: randomBetween(0, 2 * Math.PI),
  twinkles: true,
  glows: true,
});

// Draws each particle where it has moved to `now`, fading over its life, onto the particle layer.
export const drawParticles = (
  context: CanvasRenderingContext2D,
  particles: Particle[],
  now: number,
) => {
  for (const particle of particles) {
    const { x, y, color, bornAt, lifetime, velocityX, velocityY, gravity, sway, phase } = particle;
    const age = now - bornAt;
    const progress = age / lifetime;
    const flicker = particle.twinkles ? 0.5 + 0.5 * Math.sin(age * TWINKLE_SPEED + phase) : 1;
    context.globalAlpha = (1 - progress) * flicker;
    context.fillStyle = particle.glows ? getEmberColor(progress) : color;
    context.fillRect(
      x + PARTICLE_ROOM + velocityX * age + sway * Math.sin(age * SWAY_SPEED + phase),
      y + PARTICLE_ROOM_ABOVE + velocityY * age + 0.5 * gravity * age * age,
      1,
      1,
    );
  }
  context.globalAlpha = 1;
};
