"use client";

import {
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from "react";

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
const BURN_EDGE_WIDTH = 2;
const BURN_EDGE_LIFETIME = 600;
// Range of the cover's random gray shades (0 black, 255 white).
const NOISE_MIN_SHADE = 110;
const NOISE_MAX_SHADE = 200;
// How often the moving textures change, in milliseconds.
const NOISE_INTERVAL = 80;
// The cover's single shade for the plain texture: black.
const PLAIN_SHADE = 0;
// Side of each mosaic block, in pixels.
const MOSAIC_BLOCK_SIZE = 8;
// The scratch card's silver: a light base with diagonal sheen bands swinging it either way.
const SCRATCH_CARD_BASE_SHADE = 190;
const SCRATCH_CARD_SHEEN = 35;
// Distance between sheen bands, in pixels.
const SCRATCH_CARD_SHEEN_PERIOD = 120;
// Grain: a dark base where this share of pixels sparkle light.
const GRAIN_BASE_SHADE = 50;
const GRAIN_SPECK_SHADE = 180;
const GRAIN_DENSITY = 0.05;
// Scanlines alternate these two shades, each line this many pixels thick.
const SCANLINE_LIGHT_SHADE = 150;
const SCANLINE_DARK_SHADE = 80;
const SCANLINE_THICKNESS = 2;
// The gradient runs from the top shade down to the bottom one; dither draws the same ramp in dots.
const GRADIENT_TOP_SHADE = 60;
const GRADIENT_BOTTOM_SHADE = 200;
// 4×4 Bayer matrix: the order in which dither dots turn light as the ramp brightens.
const BAYER_MATRIX = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export type DrawerTexture =
  | "plain"
  | "noise"
  | "mosaic"
  | "scratch-card"
  | "grain"
  | "scanlines"
  | "gradient"
  | "dither";

// Textures that keep changing every `NOISE_INTERVAL`; the rest are painted once.
const MOVING_TEXTURES: DrawerTexture[] = ["noise", "mosaic", "grain", "scanlines"];

// How cleared pixels leave the cover: `float` up, `sand` falling, `scatter` outward from the
// brush, `dissolve` fading in place, `wind` blown sideways, `snow` drifting down, `sparkle`
// flickering as they rise a little, `ash` burning, with embers rising off a glowing edge.
export type DrawerEffect =
  | "float"
  | "sand"
  | "scatter"
  | "dissolve"
  | "wind"
  | "snow"
  | "sparkle"
  | "ash";

// Which way the `wind` effect blows, on a 3×3 grid; `any` blows each pixel its own way.
export type DrawerWindDirection =
  | "up-left"
  | "up"
  | "up-right"
  | "left"
  | "any"
  | "right"
  | "down-left"
  | "down"
  | "down-right";

// Each wind direction as a step on the grid, y growing downward; null for `any`.
const WIND_STEPS: Record<DrawerWindDirection, Point | null> = {
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

interface Point {
  x: number;
  y: number;
}

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

interface Particle extends Point, Motion {
  color: string;
  bornAt: number;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

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
// its pixels within the particle layer's room around the cover, 56px (`--spacing(14)`) each way
// but 112px (`--spacing(28)`) above, where embers rise; the numbers after each one show its
// furthest reach.
const createMotion = (
  effect: DrawerEffect,
  offset: Point,
  windDirection: DrawerWindDirection,
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
const createBurnEdgeMotion = (): Motion => ({
  lifetime: BURN_EDGE_LIFETIME,
  velocityX: 0,
  velocityY: 0,
  gravity: 0,
  sway: 0,
  phase: randomBetween(0, 2 * Math.PI),
  twinkles: true,
  glows: true,
});

// Offsets of every pixel in a round brush of the given width, relative to its center.
const getBrushOffsets = (brushSize: number) => {
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
const getBurnEdgeOffsets = (brushSize: number) => {
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

// How `texture` shades the pixel at (x, y) on a cover of the given size. `tick` counts repaints,
// so the moving textures can move.
const createShader = (
  texture: DrawerTexture,
  { width, height }: ImageData,
  tick: number,
): ((x: number, y: number) => number) => {
  switch (texture) {
    case "plain":
      return () => PLAIN_SHADE;
    case "noise":
      return () => randomBetween(NOISE_MIN_SHADE, NOISE_MAX_SHADE);
    case "mosaic": {
      const columns = Math.ceil(width / MOSAIC_BLOCK_SIZE);
      const rows = Math.ceil(height / MOSAIC_BLOCK_SIZE);
      const blocks = Array.from({ length: columns * rows }, () =>
        randomBetween(NOISE_MIN_SHADE, NOISE_MAX_SHADE),
      );
      return (x, y) =>
        blocks[Math.floor(y / MOSAIC_BLOCK_SIZE) * columns + Math.floor(x / MOSAIC_BLOCK_SIZE)];
    }
    case "scratch-card":
      return (x, y) =>
        SCRATCH_CARD_BASE_SHADE +
        SCRATCH_CARD_SHEEN * Math.sin(((x + y) * 2 * Math.PI) / SCRATCH_CARD_SHEEN_PERIOD);
    case "grain":
      return () => (Math.random() < GRAIN_DENSITY ? GRAIN_SPECK_SHADE : GRAIN_BASE_SHADE);
    case "scanlines":
      // Scrolls down one pixel per repaint.
      return (_x, y) =>
        Math.floor((y - tick) / SCANLINE_THICKNESS) % 2 === 0
          ? SCANLINE_LIGHT_SHADE
          : SCANLINE_DARK_SHADE;
    case "gradient":
      return (_x, y) =>
        GRADIENT_TOP_SHADE + ((GRADIENT_BOTTOM_SHADE - GRADIENT_TOP_SHADE) * y) / height;
    case "dither":
      return (x, y) =>
        y / height > (BAYER_MATRIX[y % 4][x % 4] + 0.5) / 16
          ? GRADIENT_BOTTOM_SHADE
          : GRADIENT_TOP_SHADE;
  }
};

// Gives every pixel still on the cover a gray shade from `getShade`, keeping cleared pixels clear.
const shadeCover = ({ data, width }: ImageData, getShade: (x: number, y: number) => number) => {
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }
    const pixel = index / 4;
    const shade = getShade(pixel % width, Math.floor(pixel / width));
    data[index] = shade;
    data[index + 1] = shade;
    data[index + 2] = shade;
  }
};

interface DrawerProps {
  texture: DrawerTexture;
  /** How cleared pixels leave the cover. Changing it starts the drawer over. */
  effect: DrawerEffect;
  /** Which way `wind` blows; ignored by the other effects. Changing it starts the drawer over. */
  windDirection?: DrawerWindDirection;
  /** Width of the cleared trail, in pixels. Changing it keeps what is already cleared. */
  brushSize: number;
  children: ReactNode;
}

// Covers `children` with gray, in the given `texture`. Moving the pointer over it clears the pixels underneath, which
// move off as `effect` says and fade out. Only clicks on cleared pixels reach `children`. The drawer takes the size of
// `children`.
export const Drawer = ({
  texture,
  effect,
  windDirection = "right",
  brushSize,
  children,
}: DrawerProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLCanvasElement>(null);
  // Flying pixels get their own canvas, so drawing them never touches the cover.
  const particleLayerRef = useRef<HTMLCanvasElement>(null);
  // The cover's current noise as RGBA, one canvas pixel per CSS pixel; alpha 0 once cleared.
  const pixelsRef = useRef<ImageData | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const frameRef = useRef<number | null>(null);
  // When each burning-edge pixel (by its index in `pixelsRef`) last started glowing, so the
  // overlapping edges of one stroke light it once.
  const burnedAtRef = useRef(new Map<number, number>());
  const brushOffsets = useMemo(() => getBrushOffsets(brushSize), [brushSize]);
  const burnEdgeOffsets = useMemo(() => getBurnEdgeOffsets(brushSize), [brushSize]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `effect` and `windDirection` only shape new particles, but changing them should start the drawer over too
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const cover = coverRef.current;
    const particleLayer = particleLayerRef.current;
    if (!wrapper || !cover || !particleLayer) {
      return;
    }

    let noiseTimer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      clearInterval(noiseTimer);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    // Sets up the cover from scratch, so changing any option or the drawer's size starts it over.
    const setUp = () => {
      stop();
      setUpCanvas(particleLayer);
      particlesRef.current = [];
      burnedAtRef.current.clear();

      // The cover keeps one canvas pixel per CSS pixel (stretched without smoothing on high-density
      // screens), so the noise can be written straight in with `putImageData`.
      cover.width = Math.ceil(cover.offsetWidth);
      cover.height = Math.ceil(cover.offsetHeight);
      const pixels = new ImageData(cover.width, cover.height);
      pixels.data.fill(255);
      pixelsRef.current = pixels;

      let tick = 0;
      const paintCover = () => {
        shadeCover(pixels, createShader(texture, pixels, tick));
        cover.getContext("2d")?.putImageData(pixels, 0, 0);
        tick += 1;
      };
      paintCover();
      noiseTimer = MOVING_TEXTURES.includes(texture)
        ? setInterval(paintCover, NOISE_INTERVAL)
        : undefined;
    };

    // Calls `setUp` once right away, then whenever `children` or the window resizes the drawer.
    const resizeObserver = new ResizeObserver(setUp);
    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
      stop();
    };
  }, [texture, effect, windDirection]);

  // Where a pixel's RGBA starts in `pixelsRef`, or undefined while it is not still covered.
  const getCoveredIndex = (x: number, y: number) => {
    const pixels = pixelsRef.current;
    if (!pixels || x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) {
      return undefined;
    }
    const index = (y * pixels.width + x) * 4;
    return pixels.data[index + 3] > 0 ? index : undefined;
  };

  // Clears the pixel at `offset` from the brush's `center` and sends it off, unless it is outside
  // or already cleared.
  const clearPixel = (
    context: CanvasRenderingContext2D,
    center: Point,
    offset: Point,
    now: number,
  ) => {
    const x = center.x + offset.x;
    const y = center.y + offset.y;
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
      ...createMotion(effect, offset, windDirection),
    });
  };

  // Lights up the still-covered pixels just past the brush along `centers`, as a burning edge.
  const burnEdge = (centers: Point[], now: number) => {
    for (const center of centers) {
      for (const offset of burnEdgeOffsets) {
        const x = center.x + offset.x;
        const y = center.y + offset.y;
        const index = getCoveredIndex(x, y);
        const burnedAt = index === undefined ? undefined : burnedAtRef.current.get(index);
        if (
          index === undefined ||
          (burnedAt !== undefined && now - burnedAt < BURN_EDGE_LIFETIME)
        ) {
          continue;
        }
        burnedAtRef.current.set(index, now);
        particlesRef.current.push({ x, y, color: "", bornAt: now, ...createBurnEdgeMotion() });
      }
    }
  };

  // Redraws the moving pixels each frame, and stops once they have all faded out.
  const animateParticles = (now: number) => {
    const particleLayer = particleLayerRef.current;
    const context = particleLayer?.getContext("2d");
    if (!particleLayer || !context) {
      return;
    }

    // How far the layer reaches past the cover on each side, read from its `-top-*`/`-left-*` classes.
    const roomX = -particleLayer.offsetLeft;
    const roomY = -particleLayer.offsetTop;
    particlesRef.current = particlesRef.current.filter(
      (particle) => now - particle.bornAt < particle.lifetime,
    );

    context.clearRect(0, 0, particleLayer.offsetWidth, particleLayer.offsetHeight);
    for (const particle of particlesRef.current) {
      const { x, y, color, bornAt, lifetime, velocityX, velocityY, gravity, sway, phase } =
        particle;
      const age = now - bornAt;
      const progress = age / lifetime;
      const flicker = particle.twinkles ? 0.5 + 0.5 * Math.sin(age * TWINKLE_SPEED + phase) : 1;
      context.globalAlpha = (1 - progress) * flicker;
      context.fillStyle = particle.glows ? getEmberColor(progress) : color;
      context.fillRect(
        x + roomX + velocityX * age + sway * Math.sin(age * SWAY_SPEED + phase),
        y + roomY + velocityY * age + 0.5 * gravity * age * age,
        1,
        1,
      );
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
    const centers = getLinePoints(lastPointRef.current ?? point, point);
    for (const center of centers) {
      for (const offset of brushOffsets) {
        clearPixel(context, center, offset, now);
      }
    }
    // After clearing the whole stroke, so only the edge still left standing glows.
    if (effect === "ash") {
      burnEdge(centers, now);
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
    // hovers and (cleared-pixel) clicks. `touch-none` keeps a finger dragging over it from
    // scrolling the page instead, which would cancel the pointer after the first move.
    <div
      ref={wrapperRef}
      className="relative w-fit max-w-full touch-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClickCapture={handleClickCapture}
    >
      {children}
      <canvas
        ref={coverRef}
        className="pointer-events-none absolute inset-0 size-full [image-rendering:pixelated]"
      />
      {/* Sized explicitly: a canvas keeps its default 300×150 size under `inset` alone. */}
      <canvas
        ref={particleLayerRef}
        className="pointer-events-none absolute -top-28 -left-14 h-[calc(100%+--spacing(42))] w-[calc(100%+--spacing(28))]"
      />
    </div>
  );
};
