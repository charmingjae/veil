"use client";

import {
  Veil,
  type VeilEffect,
  type VeilHandle,
  type VeilTexture,
  type VeilWindDirection,
} from "@-3-/veil";
import { useRef, useState } from "react";

import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";

import { BrushControls } from "./brush-controls";
import { EffectControls } from "./effect-controls";
import { GithubLink } from "./github-link";
import { SizeControls } from "./size-controls";
import { StateControls } from "./state-controls";
import { TextureControls } from "./texture-controls";
import { VeilCode } from "./veil-code";

export const Canvas = () => {
  const [texture, setTexture] = useState<VeilTexture>("noise");
  const [effect, setEffect] = useState<VeilEffect>("float");
  const [windDirection, setWindDirection] = useState<VeilWindDirection>("right");
  const [brushSize, setBrushSize] = useState(50);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [revealedPercent, setRevealedPercent] = useState(0);
  const [revealThreshold, setRevealThreshold] = useState(50);
  const veilRef = useRef<VeilHandle>(null);

  return (
    <SidebarProvider defaultOpen={false}>
      {/* `overflow-hidden` clips pixels flying off past the edges, so they never add a scrollbar. */}
      <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden p-6">
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <GithubLink />
          {/* Flipped so the panel icon points at the right-hand sidebar. */}
          <SidebarTrigger className="[&>svg]:rotate-180" />
        </div>
        <Veil
          ref={veilRef}
          texture={texture}
          effect={effect}
          windDirection={windDirection}
          brushSize={brushSize}
          revealThreshold={revealThreshold}
          onReveal={setRevealedPercent}
        >
          <div
            className="flex max-w-full flex-col items-center justify-center"
            style={{ width: width ?? undefined, height: height ?? undefined }}
          >
            <p className="font-bold">Veil</p>
            <p className="font-extralight text-muted-foreground">Every surface hides a story</p>
          </div>
        </Veil>
        <VeilCode
          texture={texture}
          effect={effect}
          windDirection={windDirection}
          brushSize={brushSize}
          revealThreshold={revealThreshold}
          width={width}
          height={height}
        />
      </div>
      <Sidebar side="right" variant="floating">
        <SidebarContent>
          <StateControls
            revealedPercent={revealedPercent}
            revealThreshold={revealThreshold}
            onRevealThresholdChange={setRevealThreshold}
            onReset={() => veilRef.current?.reset()}
          />
          <TextureControls texture={texture} onTextureChange={setTexture} />
          <EffectControls
            effect={effect}
            windDirection={windDirection}
            onEffectChange={setEffect}
            onWindDirectionChange={setWindDirection}
          />
          <BrushControls brushSize={brushSize} onBrushSizeChange={setBrushSize} />
          <SizeControls
            width={width}
            height={height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
          />
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
};
