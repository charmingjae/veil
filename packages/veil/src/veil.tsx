"use client";

import {
  forwardRef,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { getBrushOffsets, getBurnEdgeOffsets, getLinePoints } from "./brush";
import { getPixel, setUpCanvas } from "./canvas";
import {
  BURN_EDGE_LIFETIME,
  createBurnEdgeMotion,
  createMotion,
  drawParticles,
  MAX_PARTICLES,
  type Particle,
} from "./effects";
import { CONTENT_STYLE, COVER_STYLE, PARTICLE_LAYER_STYLE, WRAPPER_STYLE } from "./styles";
import { createShader, MOVING_TEXTURES, NOISE_INTERVAL, shadeCover } from "./textures";
import type { Point, VeilEffect, VeilHandle, VeilProps } from "./types";

// With this set, cleared pixels just fade in place and moving textures hold still.
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Covers `children` with gray, in the given `texture`. Moving the pointer over it clears the pixels underneath, which
// move off as `effect` says and fade out. Until `revealThreshold` percent is cleared, `children` are inert; after that,
// only clicks on cleared pixels reach them. The veil takes the size of `children`.
export const Veil = forwardRef<VeilHandle, VeilProps>(function Veil(
  {
    texture = "noise",
    effect = "float",
    windDirection = "right",
    brushSize = 50,
    disabled = false,
    revealThreshold = 50,
    onReveal,
    className,
    style,
    children,
  },
  ref,
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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
  // How many cover pixels are cleared, and the percent last passed to `onReveal`.
  const clearedCountRef = useRef(0);
  const reportedPercentRef = useRef(0);
  // The same percent as state, so the content's inertness follows it and `revealThreshold`.
  const [revealedPercent, setRevealedPercent] = useState(0);
  // The latest `onReveal`, so the setup below needn't rerun when a new one is passed.
  const onRevealRef = useRef(onReveal);
  // Starts the veil over; set by the setup below, for `reset`.
  const setUpRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onRevealRef.current = onReveal;
  });

  useImperativeHandle(ref, () => ({ reset: () => setUpRef.current?.() }), []);

  // Set on the element rather than as a prop, which React 18 does not know.
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.inert = revealedPercent < revealThreshold;
    }
  }, [revealedPercent, revealThreshold]);

  // Tells `onReveal` (and the inert content) how much is cleared, when the whole percent changes.
  const reportReveal = () => {
    const pixels = pixelsRef.current;
    const total = pixels ? pixels.width * pixels.height : 0;
    const percent = total > 0 ? Math.floor((clearedCountRef.current / total) * 100) : 0;
    if (percent === reportedPercentRef.current) {
      return;
    }
    reportedPercentRef.current = percent;
    setRevealedPercent(percent);
    onRevealRef.current?.(percent);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: `effect` and `windDirection` only shape new particles, but changing them should start the veil over too
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

    // Sets up the cover from scratch, so changing any option or the veil's size starts it over.
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
      clearedCountRef.current = 0;
      reportReveal();

      let tick = 0;
      const paintCover = () => {
        shadeCover(pixels, createShader(texture, pixels, tick));
        cover.getContext("2d")?.putImageData(pixels, 0, 0);
        tick += 1;
      };
      paintCover();
      noiseTimer =
        MOVING_TEXTURES.includes(texture) && !window.matchMedia(REDUCED_MOTION_QUERY).matches
          ? setInterval(paintCover, NOISE_INTERVAL)
          : undefined;
    };
    setUpRef.current = setUp;

    // Calls `setUp` once right away, then whenever `children` or the window resizes the veil.
    const resizeObserver = new ResizeObserver(setUp);
    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
      stop();
      setUpRef.current = null;
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

  // Clears the pixel at `offset` from the brush's `center` and sends it off as `motionEffect` says,
  // unless it is outside or already cleared.
  const clearPixel = (
    context: CanvasRenderingContext2D,
    center: Point,
    offset: Point,
    motionEffect: VeilEffect,
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
    clearedCountRef.current += 1;
    context.clearRect(x, y, 1, 1);
    if (particlesRef.current.length >= MAX_PARTICLES) {
      return;
    }
    particlesRef.current.push({
      x,
      y,
      color,
      bornAt: now,
      ...createMotion(motionEffect, offset, windDirection),
    });
  };

  // Lights up the still-covered pixels just past the brush along `centers`, as a burning edge.
  const burnEdge = (centers: Point[], now: number) => {
    for (const center of centers) {
      for (const offset of burnEdgeOffsets) {
        if (particlesRef.current.length >= MAX_PARTICLES) {
          return;
        }
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

    particlesRef.current = particlesRef.current.filter(
      (particle) => now - particle.bornAt < particle.lifetime,
    );

    context.clearRect(0, 0, particleLayer.offsetWidth, particleLayer.offsetHeight);
    drawParticles(context, particlesRef.current, now);

    frameRef.current =
      particlesRef.current.length > 0 ? requestAnimationFrame(animateParticles) : null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const cover = coverRef.current;
    const context = cover?.getContext("2d");
    if (!cover || !context || disabled) {
      // So moving again once enabled does not clear a line from where the pointer stopped.
      lastPointRef.current = null;
      return;
    }

    const point = getPixel(cover, event);
    const now = performance.now();
    const motionEffect = window.matchMedia(REDUCED_MOTION_QUERY).matches ? "dissolve" : effect;
    const centers = getLinePoints(lastPointRef.current ?? point, point);
    for (const center of centers) {
      for (const offset of brushOffsets) {
        clearPixel(context, center, offset, motionEffect, now);
      }
    }
    // After clearing the whole stroke, so only the edge still left standing glows.
    if (motionEffect === "ash") {
      burnEdge(centers, now);
    }
    lastPointRef.current = point;
    reportReveal();

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
      ref={wrapperRef}
      className={className}
      style={{ ...WRAPPER_STYLE, ...style }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClickCapture={handleClickCapture}
    >
      <div ref={contentRef} style={CONTENT_STYLE}>
        {children}
      </div>
      <canvas ref={coverRef} style={COVER_STYLE} aria-hidden />
      <canvas ref={particleLayerRef} style={PARTICLE_LAYER_STYLE} aria-hidden />
    </div>
  );
});
