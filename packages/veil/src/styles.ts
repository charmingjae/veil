import type { CSSProperties } from "react";

// How far the particle layer reaches past the cover at most, in pixels: this much each way, and
// more above, where embers rise.
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
// Sized explicitly: a canvas keeps its default 300×150 size under `inset` alone. It starts with no
// room past the cover, so it never overflows before `fitParticleLayer` measures the page; that then
// sets these four on the element, and React leaves them alone since this object never changes.
export const PARTICLE_LAYER_STYLE: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
};
export const CONTENT_STYLE: CSSProperties = { display: "contents" };
