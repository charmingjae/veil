import type { CSSProperties } from "react";

// How far the particle layer reaches past the cover, in pixels: this much each way, and more
// above, where embers rise.
export const PARTICLE_ROOM = 56;
export const PARTICLE_ROOM_ABOVE = 112;

// Inline styles rather than classes, so the veil needs no stylesheet or CSS framework.
export const WRAPPER_STYLE: CSSProperties = {
  position: "relative",
  width: "fit-content",
  maxWidth: "100%",
  // Keeps a finger dragging over it from scrolling the page instead, which would cancel the
  // pointer after the first move.
  touchAction: "none",
};
export const COVER_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  imageRendering: "pixelated",
};
// Sized explicitly: a canvas keeps its default 300×150 size under `inset` alone.
export const PARTICLE_LAYER_STYLE: CSSProperties = {
  position: "absolute",
  top: -PARTICLE_ROOM_ABOVE,
  left: -PARTICLE_ROOM,
  width: `calc(100% + ${2 * PARTICLE_ROOM}px)`,
  height: `calc(100% + ${PARTICLE_ROOM_ABOVE + PARTICLE_ROOM}px)`,
  pointerEvents: "none",
};
export const CONTENT_STYLE: CSSProperties = { display: "contents" };
