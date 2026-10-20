import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/shared/ui/sidebar";
import { Slider } from "@/shared/ui/slider";

// Bigger brushes clear (and send flying) far more pixels per move, so the range stops at 200.
const MIN_BRUSH_SIZE = 10;
const MAX_BRUSH_SIZE = 200;
const BRUSH_SIZE_STEP = 5;

interface BrushControlsProps {
  brushSize: number;
  onBrushSizeChange: (brushSize: number) => void;
}

// The control panel for how `Veil` clears its cover.
export const BrushControls = ({ brushSize, onBrushSizeChange }: BrushControlsProps) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Brush</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-3 px-2">
        <div className="flex items-center justify-between">
          <span id="brush-size-label" className="font-medium text-sm">
            Size
          </span>
          <span className="text-muted-foreground text-sm tabular-nums">{brushSize}px</span>
        </div>
        <Slider
          aria-labelledby="brush-size-label"
          value={brushSize}
          onValueChange={onBrushSizeChange}
          min={MIN_BRUSH_SIZE}
          max={MAX_BRUSH_SIZE}
          step={BRUSH_SIZE_STEP}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
