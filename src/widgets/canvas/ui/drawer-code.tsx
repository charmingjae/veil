import { cn } from "cn";
import { useEffect, useState } from "react";

import { CodeBlockCopyButton } from "@/shared/ui/code-block";
import { useSidebar } from "@/shared/ui/sidebar";

import type { DrawerEffect, DrawerTexture, DrawerWindDirection } from "./drawer";

// How long each character takes to appear while the code types itself out, in milliseconds.
const TYPING_INTERVAL = 15;

// The stretch of the code still typing itself out: `start` to `end`, of which `count` characters
// have appeared. Everything outside it shows already.
interface Typing {
  start: number;
  end: number;
  count: number;
}

// The stretch of `after` that differs from `before`, found by skipping the text they start and end
// with in common; null when nothing was added (only removed).
const getChangedRange = (before: string, after: string): Typing | null => {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) {
    start += 1;
  }
  let suffix = 0;
  while (
    suffix < before.length - start &&
    suffix < after.length - start &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const end = after.length - suffix;
  return end > start ? { start, end, count: 0 } : null;
};

interface DrawerCodeProps {
  texture: DrawerTexture;
  effect: DrawerEffect;
  windDirection: DrawerWindDirection;
  brushSize: number;
  /** The content's size, in pixels; `null` leaves it to the content. */
  width: number | null;
  height: number | null;
}

// Shows the JSX that renders `Drawer` with the current settings, while the settings sidebar is open.
// Each time it opens, the code types itself out one character at a time; after that, a setting
// change types out just the part of the code it changed.
export const DrawerCode = ({
  texture,
  effect,
  windDirection,
  brushSize,
  width,
  height,
}: DrawerCodeProps) => {
  const { isMobile, open, openMobile } = useSidebar();
  const isShown = isMobile ? openMobile : open;

  const contentStyle = [width !== null && `width: ${width}`, height !== null && `height: ${height}`]
    .filter(Boolean)
    .join(", ");
  const content = contentStyle ? `<div style={{ ${contentStyle} }}>{children}</div>` : "{children}";
  const lines = [
    // `windDirection` only matters to the wind effect, so it shows only then.
    `<Drawer texture="${texture}" effect="${effect}"${effect === "wind" ? ` windDirection="${windDirection}"` : ""} brushSize={${brushSize}}>`,
    `  ${content}`,
    "</Drawer>",
  ];
  const code = lines.join("\n");

  const [typing, setTyping] = useState<Typing | null>(null);
  const isTyping = typing !== null;

  // Types the whole code each time the box opens, and the changed part each time the code changes
  // while it is open. Done while rendering, not in an effect, so the finished code never flashes
  // up first.
  const [previous, setPrevious] = useState({ isShown, code });
  if (isShown !== previous.isShown || code !== previous.code) {
    setPrevious({ isShown, code });
    if (isShown && !previous.isShown) {
      setTyping({ start: 0, end: code.length, count: 0 });
    } else if (isShown) {
      setTyping(getChangedRange(previous.code, code));
    }
  }

  useEffect(() => {
    if (!isShown || !typing) {
      return;
    }
    const timer = setTimeout(() => {
      const count = typing.count + 1;
      setTyping(typing.start + count >= typing.end ? null : { ...typing, count });
    }, TYPING_INTERVAL);
    return () => clearTimeout(timer);
  }, [isShown, typing]);

  // Splits each line around the stretch not typed yet, which is laid out but invisible so the box
  // keeps its full size while the code types.
  const hiddenFrom = typing ? typing.start + typing.count : 0;
  const hiddenTo = typing ? typing.end : 0;
  let offset = 0;
  const [openingTag, contentLine, closingTag] = lines.map((line) => {
    const from = Math.min(Math.max(hiddenFrom - offset, 0), line.length);
    const to = Math.min(Math.max(hiddenTo - offset, from), line.length);
    offset += line.length + 1;
    return (
      <>
        {line.slice(0, from)}
        <span className="invisible">{line.slice(from, to)}</span>
        {line.slice(to)}
      </>
    );
  });

  // The `Drawer` lines are what to copy; the content line only stands in for your own content.
  return (
    // Grows from zero height and fades in, in step with the sidebar sliding open, so the drawer
    // above glides up instead of jumping. `inert` keeps the hidden copy button out of tab order.
    <div
      inert={!isShown}
      className={cn(
        "grid max-w-full transition-[grid-template-rows,opacity] duration-200 ease-linear",
        isShown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="relative mt-6">
          <pre className="max-w-full overflow-x-auto rounded-lg border bg-muted py-3 pr-12 pl-4 font-mono text-sm">
            <code>
              <span className="font-medium">{openingTag}</span>
              {"\n"}
              <span className="font-extralight text-muted-foreground">{contentLine}</span>
              {"\n"}
              <span className="font-medium">{closingTag}</span>
            </code>
          </pre>
          {/* Always there but faint, darkening while the button itself is hovered or focused.
              Off until the code has finished typing, so a half-typed copy can't happen. */}
          <div className="absolute top-2 right-2 opacity-40 transition-opacity focus-within:opacity-100 hover:opacity-100">
            <CodeBlockCopyButton value={code} disabled={isTyping} className="cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
};
