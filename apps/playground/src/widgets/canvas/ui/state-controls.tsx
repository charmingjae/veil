import { RotateCcwIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/shared/ui/sidebar";
import { Slider } from "@/shared/ui/slider";

const REVEAL_THRESHOLD_STEP = 5;

interface StateControlsProps {
  /** How much of the cover is cleared, from `Veil`'s `onReveal`. */
  revealedPercent: number;
  revealThreshold: number;
  onRevealThresholdChange: (revealThreshold: number) => void;
  onReset: () => void;
}

// Shows how much of `Veil` is revealed and whether its content is usable yet, sets the share that
// makes it usable, and covers it again through its `ref`.
export const StateControls = ({
  revealedPercent,
  revealThreshold,
  onRevealThresholdChange,
  onReset,
}: StateControlsProps) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>State</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-3 px-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            Revealed <span className="text-muted-foreground tabular-nums">{revealedPercent}%</span>
            <span className="text-muted-foreground">
              {" · "}
              {revealedPercent < revealThreshold ? "Locked" : "Usable"}
            </span>
          </span>
          <Button variant="outline" size="xs" onClick={onReset}>
            <RotateCcwIcon />
            Reset
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span id="reveal-threshold-label" className="font-medium text-sm">
            Reveal threshold
          </span>
          <span className="text-muted-foreground text-sm tabular-nums">{revealThreshold}%</span>
        </div>
        <Slider
          aria-labelledby="reveal-threshold-label"
          value={revealThreshold}
          onValueChange={onRevealThresholdChange}
          min={0}
          max={100}
          step={REVEAL_THRESHOLD_STEP}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
