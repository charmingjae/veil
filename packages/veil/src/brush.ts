import type { Point } from "./types";

// The area a stroke touched, inclusive, in whole pixels.
export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Visits, once each and row by row, every whole pixel inside a `width` × `height` area that lies
// within `reach` of the stroke from `from` to `to`: a capsule, so the trail stays unbroken however
// fast the pointer moves, without stamping the brush at every pixel along the way. `visit` gets the
// pixel, its squared distance from the stroke, and its offset from the stroke's nearest point.
// Returns the box scanned, clipped to the area.
export const scanStroke = (
  from: Point,
  to: Point,
  reach: number,
  width: number,
  height: number,
  visit: (x: number, y: number, distanceSquared: number, offsetX: number, offsetY: number) => void,
): Bounds => {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const lengthSquared = deltaX * deltaX + deltaY * deltaY;
  const reachSquared = reach * reach;
  const bounds = {
    left: Math.max(0, Math.floor(Math.min(from.x, to.x) - reach)),
    top: Math.max(0, Math.floor(Math.min(from.y, to.y) - reach)),
    right: Math.min(width - 1, Math.ceil(Math.max(from.x, to.x) + reach)),
    bottom: Math.min(height - 1, Math.ceil(Math.max(from.y, to.y) + reach)),
  };

  for (let y = bounds.top; y <= bounds.bottom; y += 1) {
    for (let x = bounds.left; x <= bounds.right; x += 1) {
      // How far along the stroke its nearest point is: 0 at `from`, 1 at `to`.
      const along =
        lengthSquared === 0
          ? 0
          : Math.min(
              1,
              Math.max(0, ((x - from.x) * deltaX + (y - from.y) * deltaY) / lengthSquared),
            );
      const offsetX = x - (from.x + along * deltaX);
      const offsetY = y - (from.y + along * deltaY);
      const distanceSquared = offsetX * offsetX + offsetY * offsetY;
      if (distanceSquared <= reachSquared) {
        visit(x, y, distanceSquared, offsetX, offsetY);
      }
    }
  }
  return bounds;
};
