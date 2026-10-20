import type { CSSProperties, ReactNode } from "react";

export type VeilTexture =
  | "plain"
  | "noise"
  | "mosaic"
  | "scratch-card"
  | "grain"
  | "scanlines"
  | "gradient"
  | "dither";

// How cleared pixels leave the cover: `float` up, `sand` falling, `scatter` outward from the
// brush, `dissolve` fading in place, `wind` blown sideways, `snow` drifting down, `sparkle`
// flickering as they rise a little, `ash` burning, with embers rising off a glowing edge.
export type VeilEffect =
  | "float"
  | "sand"
  | "scatter"
  | "dissolve"
  | "wind"
  | "snow"
  | "sparkle"
  | "ash";

// Which way the `wind` effect blows, on a 3×3 grid; `any` blows each pixel its own way.
export type VeilWindDirection =
  | "up-left"
  | "up"
  | "up-right"
  | "left"
  | "any"
  | "right"
  | "down-left"
  | "down"
  | "down-right";

/** What a `ref` on `Veil` can do. */
export interface VeilHandle {
  /** Covers everything again, as if the veil had just appeared. */
  reset: () => void;
}

export interface VeilProps {
  /** How the cover looks. Changing it starts the veil over. */
  texture?: VeilTexture;
  /** How cleared pixels leave the cover. Changing it starts the veil over. */
  effect?: VeilEffect;
  /** Which way `wind` blows; ignored by the other effects. Changing it starts the veil over. */
  windDirection?: VeilWindDirection;
  /** Width of the cleared trail, in pixels. Changing it keeps what is already cleared. */
  brushSize?: number;
  /** Stops the pointer from clearing anything while true; what is cleared stays cleared. */
  disabled?: boolean;
  /**
   * How much of the cover (in percent, 0-100) must be cleared before the content under it can be
   * focused, clicked or read by screen readers. 0 leaves it usable from the start; 100 waits until
   * every pixel is cleared.
   */
  revealThreshold?: number;
  /** Called with how much of the cover is cleared, in whole percents (0-100), each time it changes. */
  onReveal?: (percent: number) => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export interface Point {
  x: number;
  y: number;
}
