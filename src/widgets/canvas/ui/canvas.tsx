"use client";

import { useState } from "react";

import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";

import { BrushControls } from "./brush-controls";
import { Drawer, type DrawerTexture } from "./drawer";
import { DrawerCode } from "./drawer-code";
import { DrawerControls } from "./drawer-controls";
import { SizeControls } from "./size-controls";

export const Canvas = () => {
  const [texture, setTexture] = useState<DrawerTexture>("noise");
  const [brushSize, setBrushSize] = useState(50);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center p-6">
        {/* Flipped so the panel icon points at the right-hand sidebar. */}
        <SidebarTrigger className="absolute top-2 right-2 [&>svg]:rotate-180" />
        <Drawer texture={texture} brushSize={brushSize}>
          <div
            className="flex max-w-full flex-col items-center justify-center"
            style={{ width: width ?? undefined, height: height ?? undefined }}
          >
            <p className="font-bold">Veil</p>
            <p className="font-extralight text-muted-foreground">Every surface hides a story</p>
          </div>
        </Drawer>
        <DrawerCode texture={texture} brushSize={brushSize} width={width} height={height} />
      </div>
      <Sidebar side="right" variant="floating">
        <SidebarContent>
          <DrawerControls texture={texture} onTextureChange={setTexture} />
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
