"use client";

import { type MouseEvent, type PointerEvent, type ReactNode, useEffect, useRef } from "react";

// Width of the cleared trail, in pixels.
const BRUSH_SIZE = 100;
// How long a cleared pixel flies before it fades out, in milliseconds.
const PARTICLE_LIFETIME = 700;
// Upward speed range, in pixels per millisecond. The fastest flies 56px (0.08 × 700), which fits
// the particle layer's `-top-14` (56px) room above the cover.
const PARTICLE_MIN_SPEED = 0.03;
const PARTICLE_MAX_SPEED = 0.08;
// Sideways drift, in pixels per millisecond, either way.
const PARTICLE_MAX_DRIFT = 0.015;
// Range of the cover's random gray shades (0 black, 255 white).
const NOISE_MIN_SHADE = 110;
const NOISE_MAX_SHADE = 200;
// How often the noise changes, in milliseconds.
const NOISE_INTERVAL = 80;

interface Point {
  x: number;
  y: number;
}

interface Particle extends Point {
  color: string;
  bornAt: number;
  velocityX: number;
  velocityY: number;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

// Offsets of every pixel in a round brush, relative to its center.
const BRUSH_OFFSETS = (() => {
  const radius = BRUSH_SIZE / 2;
  const offsets: Point[] = [];
  for (let y = -Math.floor(radius); y <= radius; y += 1) {
    for (let x = -Math.floor(radius); x <= radius; x += 1) {
      if (x * x + y * y <= radius * radius) {
        offsets.push({ x, y });
      }
    }
  }
  return offsets;
})();

// Every whole pixel on the straight line from `from` to `to` (Bresenham's line), so the trail
// stays unbroken however fast the pointer moves.
const getLinePoints = (from: Point, to: Point) => {
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

// The whole pixel under the pointer, relative to the cover.
const getPixel = (cover: HTMLCanvasElement, event: MouseEvent) => {
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

// Gives every pixel still on the cover a new random gray shade, keeping cleared pixels clear.
const shuffleNoise = ({ data }: ImageData) => {
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }
    const shade = randomBetween(NOISE_MIN_SHADE, NOISE_MAX_SHADE);
    data[index] = shade;
    data[index + 1] = shade;
    data[index + 2] = shade;
  }
};

interface DrawerProps {
  children: ReactNode;
}

// Covers `children` with gray noise that keeps changing. Moving the pointer over it clears the pixels underneath, which
// fly up and fade out. Only clicks on cleared pixels reach `children`.
export const Drawer = ({ children }: DrawerProps) => {
  const coverRef = useRef<HTMLCanvasElement>(null);
  // Flying pixels get their own canvas, so drawing them never touches the cover.
  const particleLayerRef = useRef<HTMLCanvasElement>(null);
  // The cover's current noise as RGBA, one canvas pixel per CSS pixel; alpha 0 once cleared.
  const pixelsRef = useRef<ImageData | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const cover = coverRef.current;
    const particleLayer = particleLayerRef.current;
    if (!cover || !particleLayer) {
      return;
    }

    setUpCanvas(particleLayer);

    // The cover keeps one canvas pixel per CSS pixel (stretched without smoothing on high-density
    // screens), so the noise can be written straight in with `putImageData`.
    cover.width = Math.ceil(cover.offsetWidth);
    cover.height = Math.ceil(cover.offsetHeight);
    const pixels = new ImageData(cover.width, cover.height);
    pixels.data.fill(255);
    pixelsRef.current = pixels;

    const paintNoise = () => {
      shuffleNoise(pixels);
      cover.getContext("2d")?.putImageData(pixels, 0, 0);
    };
    paintNoise();
    const noiseTimer = setInterval(paintNoise, NOISE_INTERVAL);

    return () => {
      clearInterval(noiseTimer);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  // Where a pixel's RGBA starts in `pixelsRef`, or undefined while it is not still covered.
  const getCoveredIndex = (x: number, y: number) => {
    const pixels = pixelsRef.current;
    if (!pixels || x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) {
      return undefined;
    }
    const index = (y * pixels.width + x) * 4;
    return pixels.data[index + 3] > 0 ? index : undefined;
  };

  // Clears one pixel from the cover and sends it flying, unless it is outside or already cleared.
  const clearPixel = (context: CanvasRenderingContext2D, x: number, y: number, now: number) => {
    const data = pixelsRef.current?.data;
    const index = getCoveredIndex(x, y);
    if (!data || index === undefined) {
      return;
    }

    const color = `rgb(${data[index]} ${data[index + 1]} ${data[index + 2]})`;
    data[index + 3] = 0;
    context.clearRect(x, y, 1, 1);
    particlesRef.current.push({
      x,
      y,
      color,
      bornAt: now,
      velocityX: randomBetween(-PARTICLE_MAX_DRIFT, PARTICLE_MAX_DRIFT),
      velocityY: randomBetween(PARTICLE_MIN_SPEED, PARTICLE_MAX_SPEED),
    });
  };

  // Redraws the flying pixels each frame, and stops once they have all faded out.
  const animateParticles = (now: number) => {
    const particleLayer = particleLayerRef.current;
    const context = particleLayer?.getContext("2d");
    if (!particleLayer || !context) {
      return;
    }

    // How far the layer reaches above the cover, read from its `-top-*` class.
    const headroom = -particleLayer.offsetTop;
    particlesRef.current = particlesRef.current.filter(
      (particle) => now - particle.bornAt < PARTICLE_LIFETIME,
    );

    context.clearRect(0, 0, particleLayer.offsetWidth, particleLayer.offsetHeight);
    for (const { x, y, color, bornAt, velocityX, velocityY } of particlesRef.current) {
      const age = now - bornAt;
      context.globalAlpha = 1 - age / PARTICLE_LIFETIME;
      context.fillStyle = color;
      context.fillRect(x + velocityX * age, y + headroom - velocityY * age, 1, 1);
    }
    context.globalAlpha = 1;

    frameRef.current =
      particlesRef.current.length > 0 ? requestAnimationFrame(animateParticles) : null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const cover = coverRef.current;
    const context = cover?.getContext("2d");
    if (!cover || !context) {
      return;
    }

    const point = getPixel(cover, event);
    const now = performance.now();
    for (const center of getLinePoints(lastPointRef.current ?? point, point)) {
      for (const offset of BRUSH_OFFSETS) {
        clearPixel(context, center.x + offset.x, center.y + offset.y, now);
      }
    }
    lastPointRef.current = point;

    if (frameRef.current === null && particlesRef.current.length > 0) {
      frameRef.current = requestAnimationFrame(animateParticles);
    }
  };

  const handlePointerLeave = () => {
    lastPointRef.current = null;
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    const cover = coverRef.current;
    if (!cover) {
      return;
    }

    const { x, y } = getPixel(cover, event);
    if (getCoveredIndex(x, y) !== undefined) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    // The canvases let pointer events through, so the wrapper scratches and `children` still get
    // hovers and (cleared-pixel) clicks.
    <div
      className="relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClickCapture={handleClickCapture}
    >
      {children}
      <canvas
        ref={coverRef}
        className="pointer-events-none absolute inset-0 size-full [image-rendering:pixelated]"
      />
      <canvas
        ref={particleLayerRef}
        className="pointer-events-none absolute -top-14 left-0 h-[calc(100%+--spacing(14))] w-full"
      />
    </div>
  );
};
