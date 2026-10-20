import type { MouseEvent } from "react";

// The whole pixel under the pointer, relative to the cover.
export const getPixel = (cover: HTMLCanvasElement, event: MouseEvent) => {
  const { left, top } = cover.getBoundingClientRect();
  return { x: Math.floor(event.clientX - left), y: Math.floor(event.clientY - top) };
};

// Sizes a canvas to its displayed size, sharp on high-density screens.
export const setUpCanvas = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio;
  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  context?.scale(ratio, ratio);
};
