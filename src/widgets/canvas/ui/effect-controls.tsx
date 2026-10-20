import {
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ArrowDownRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  type LucideIcon,
  MoveIcon,
} from "lucide-react";

import { RadioGroup } from "@/shared/ui/radio-group";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/shared/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { DrawerEffect, DrawerWindDirection } from "./drawer";

const EFFECT_OPTIONS: { value: DrawerEffect; label: string }[] = [
  { value: "float", label: "Float" },
  { value: "sand", label: "Sand" },
  { value: "scatter", label: "Scatter" },
  { value: "dissolve", label: "Dissolve" },
  { value: "wind", label: "Wind" },
  { value: "snow", label: "Snow" },
  { value: "sparkle", label: "Sparkle" },
  { value: "ash", label: "Ash" },
];

// In grid order, row by row, so each arrow sits where it points.
const WIND_DIRECTION_OPTIONS: { value: DrawerWindDirection; label: string; icon: LucideIcon }[] = [
  { value: "up-left", label: "Up left", icon: ArrowUpLeftIcon },
  { value: "up", label: "Up", icon: ArrowUpIcon },
  { value: "up-right", label: "Up right", icon: ArrowUpRightIcon },
  { value: "left", label: "Left", icon: ArrowLeftIcon },
  { value: "any", label: "Every way", icon: MoveIcon },
  { value: "right", label: "Right", icon: ArrowRightIcon },
  { value: "down-left", label: "Down left", icon: ArrowDownLeftIcon },
  { value: "down", label: "Down", icon: ArrowDownIcon },
  { value: "down-right", label: "Down right", icon: ArrowDownRightIcon },
];

interface EffectControlsProps {
  effect: DrawerEffect;
  windDirection: DrawerWindDirection;
  onEffectChange: (effect: DrawerEffect) => void;
  onWindDirectionChange: (windDirection: DrawerWindDirection) => void;
}

// The control panel for how `Drawer`'s cleared pixels leave the cover. Wind adds a direction pad.
export const EffectControls = ({
  effect,
  windDirection,
  onEffectChange,
  onWindDirectionChange,
}: EffectControlsProps) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel id="effect-label">Effect</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-4 px-2">
        <RadioGroup
          aria-labelledby="effect-label"
          options={EFFECT_OPTIONS}
          value={effect}
          onChange={(value) => onEffectChange(value as DrawerEffect)}
          // White circles, so they stand out on the sidebar's gray; a checked one keeps its fill.
          className="**:data-[slot=radio-group-item]:not-data-checked:bg-background"
        />
        {effect === "wind" && (
          <div className="fade-in-0 slide-in-from-top-1 flex animate-in flex-col gap-2 duration-200">
            <span id="wind-direction-label" className="font-medium text-sm">
              Direction
            </span>
            <ToggleGroup
              aria-labelledby="wind-direction-label"
              value={[windDirection]}
              // Pressing the pressed arrow again would leave none pressed, so that is ignored.
              onValueChange={([value]) => {
                if (value) {
                  onWindDirectionChange(value as DrawerWindDirection);
                }
              }}
              variant="outline"
              size="sm"
              spacing={1}
              className="grid grid-cols-3"
            >
              {WIND_DIRECTION_OPTIONS.map(({ value, label, icon: Icon }) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  aria-label={label}
                  // White like the radios; the pressed arrow turns dark.
                  className="bg-background aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
                >
                  <Icon />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
