import type { MouseEvent } from "react";

import { PARTICLE_ROOM, PARTICLE_ROOM_ABOVE } from "./styles";
import type { Point } from "./types";

// The whole pixel under the pointer, relative to the cover.
export const getPixel = (cover: HTMLCanvasElement, event: MouseEvent) => {
  const { left, top } = cover.getBoundingClientRect();
  return { x: Math.floor(event.clientX - left), y: Math.floor(event.clientY - top) };
};

// Sizes a canvas to its displayed size, sharp on high-density screens.
const setUpCanvas = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  context?.scale(ratio, ratio);
};

// The box, in viewport coordinates, that something overflowing `element` may fill without being
// clipped or making anything scroll: along each axis, the padding box of the nearest ancestor
// whose overflow is not visible on that axis, or else the viewport.
const getOverflowBounds = (element: HTMLElement) => {
  const root = document.documentElement;
  const bounds = { left: 0, right: root.clientWidth, top: 0, bottom: root.clientHeight };
  let hasBoundX = false;
  let hasBoundY = false;
  // The body's and the root's overflow apply to the viewport, so the walk stops below them.
  for (
    let ancestor = element.parentElement;
    ancestor && ancestor !== document.body && ancestor !== root && !(hasBoundX && hasBoundY);
    ancestor = ancestor.parentElement
  ) {
    const { overflowX, overflowY } = getComputedStyle(ancestor);
    const rect = ancestor.getBoundingClientRect();
    if (!hasBoundX && overflowX !== "visible") {
      bounds.left = rect.left + ancestor.clientLeft;
      bounds.right = bounds.left + ancestor.clientWidth;
      hasBoundX = true;
    }
    if (!hasBoundY && overflowY !== "visible") {
      bounds.top = rect.top + ancestor.clientTop;
      bounds.bottom = bounds.top + ancestor.clientHeight;
      hasBoundY = true;
    }
  }
  return bounds;
};

// Gives the particle layer room past the cover, up to `PARTICLE_ROOM` (`PARTICLE_ROOM_ABOVE`
// above) but only as far as the visible part of the page or its scrolling container reaches, so
// the layer never adds a scrollbar; particles past that would be out of sight anyway. Returns where
// the cover's top-left corner lands on the layer.
export const fitParticleLayer = (layer: HTMLCanvasElement, cover: HTMLCanvasElement): Point => {
  const bounds = getOverflowBounds(cover);
  const rect = cover.getBoundingClientRect();
  const getRoom = (space: number, max: number) => Math.max(0, Math.min(max, Math.floor(space)));
  const left = getRoom(rect.left - bounds.left, PARTICLE_ROOM);
  const right = getRoom(bounds.right - rect.right, PARTICLE_ROOM);
  const above = getRoom(rect.top - bounds.top, PARTICLE_ROOM_ABOVE);
  const below = getRoom(bounds.bottom - rect.bottom, PARTICLE_ROOM);
  Object.assign(layer.style, {
    top: `${-above}px`,
    left: `${-left}px`,
    width: `calc(100% + ${left + right}px)`,
    height: `calc(100% + ${above + below}px)`,
  });
  setUpCanvas(layer);
  return { x: left, y: above };
};
