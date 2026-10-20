import { BURN_EDGE_WIDTH } from "./effects";
import type { Point } from "./types";

// Offsets of every pixel in a round brush of the given width, relative to its center.
export const getBrushOffsets = (brushSize: number) => {
  const radius = brushSize / 2;
  const offsets: Point[] = [];
  for (let y = -Math.floor(radius); y <= radius; y += 1) {
    for (let x = -Math.floor(radius); x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) {
        offsets.push({ x, y });
      }
    }
  }
  return offsets;
};

// Offsets of the pixels in a ring `BURN_EDGE_WIDTH` wide just outside a round brush of the given
// width, relative to its center.
export const getBurnEdgeOffsets = (brushSize: number) => {
  const inner = brushSize / 2;
  const outer = inner + BURN_EDGE_WIDTH;
  const offsets: Point[] = [];
  for (let y = -Math.floor(outer); y <= outer; y += 1) {
    for (let x = -Math.floor(outer); x <= outer; x += 1) {
      const distance = x * x + y * y;
      if (distance > inner * inner && distance <= outer * outer) {
        offsets.push({ x, y });
      }
    }
  }
  return offsets;
};

// Every whole pixel on the straight line from `from` to `to` (Bresenham's line), so the trail
// stays unbroken however fast the pointer moves.
export const getLinePoints = (from: Point, to: Point) => {
  const points: Point[] = [];
  const deltaX = Math.abs(to.x - from.x);
  const deltaY = -Math.abs(to.y - from.y);
  const stepX = from.x < to.x ? 1 : -1;
  const stepY = from.y < to.y ? 1 : -1;
  let error = deltaX + deltaY;
  let { x, y } = from;

  while (true) {
    points.push({ x, y });
    if (x === to.x && y === to.y) {
      return points;
    }

    const doubledError = 2 * error;
    if (doubledError >= deltaY) {
      error += deltaY;
      x += stepX;
    }
    if (doubledError <= deltaX) {
      error += deltaX;
      y += stepY;
    }
  }
};
