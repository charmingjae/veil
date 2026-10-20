import { RadioGroup } from "@/shared/ui/radio-group";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/shared/ui/sidebar";

import type { DrawerTexture } from "./drawer";

const TEXTURE_OPTIONS: { value: DrawerTexture; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "noise", label: "Noise" },
  { value: "mosaic", label: "Mosaic" },
  { value: "scratch-card", label: "Scratch card" },
  { value: "grain", label: "Grain" },
  { value: "scanlines", label: "Scanlines" },
  { value: "gradient", label: "Gradient" },
  { value: "dither", label: "Dither" },
];

interface DrawerControlsProps {
  texture: DrawerTexture;
  onTextureChange: (texture: DrawerTexture) => void;
}

// The control panel for the props `Drawer` takes.
export const DrawerControls = ({ texture, onTextureChange }: DrawerControlsProps) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel id="texture-label">Texture</SidebarGroupLabel>
      <SidebarGroupContent className="px-2">
        <RadioGroup
          aria-labelledby="texture-label"
          // White circles, so they stand out on the sidebar's gray; a checked one keeps its fill.
          className="**:data-[slot=radio-group-item]:not-data-checked:bg-background"
          options={TEXTURE_OPTIONS}
          value={texture}
          onChange={(value) => onTextureChange(value as DrawerTexture)}
        />
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
