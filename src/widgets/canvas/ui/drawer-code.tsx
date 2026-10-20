import { cn } from "cn";

import { CodeBlockCopyButton } from "@/shared/ui/code-block";
import { useSidebar } from "@/shared/ui/sidebar";

import type { DrawerTexture } from "./drawer";

interface DrawerCodeProps {
  texture: DrawerTexture;
  brushSize: number;
  /** The content's size, in pixels; `null` leaves it to the content. */
  width: number | null;
  height: number | null;
}

// Shows the JSX that renders `Drawer` with the current settings, while the settings sidebar is open.
export const DrawerCode = ({ texture, brushSize, width, height }: DrawerCodeProps) => {
  const { isMobile, open, openMobile } = useSidebar();
  const isShown = isMobile ? openMobile : open;

  const contentStyle = [width !== null && `width: ${width}`, height !== null && `height: ${height}`]
    .filter(Boolean)
    .join(", ");
  const content = contentStyle ? `<div style={{ ${contentStyle} }}>{children}</div>` : "{children}";
  const openingTag = `<Drawer texture="${texture}" brushSize={${brushSize}}>`;
  const contentLine = `  ${content}`;
  const closingTag = "</Drawer>";

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
          {/* Always there but faint, darkening while the button itself is hovered or focused. */}
          <div className="absolute top-2 right-2 opacity-40 transition-opacity focus-within:opacity-100 hover:opacity-100">
            <CodeBlockCopyButton
              value={[openingTag, contentLine, closingTag].join("\n")}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
