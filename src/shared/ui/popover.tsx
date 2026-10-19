"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "cn";
import type * as React from "react";

type PopoverProps = PopoverPrimitive.Root.Props;

export const Popover = ({ ...props }: PopoverProps) => {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
};

type PopoverTriggerProps = PopoverPrimitive.Trigger.Props;

export const PopoverTrigger = ({ ...props }: PopoverTriggerProps) => {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
};

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">;

export const PopoverContent = ({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverContentProps) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-popover-foreground text-sm shadow-md outline-hidden ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
};

type PopoverHeaderProps = React.ComponentProps<"div">;

export const PopoverHeader = ({ className, ...props }: PopoverHeaderProps) => {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    />
  );
};

type PopoverTitleProps = PopoverPrimitive.Title.Props;

export const PopoverTitle = ({ className, ...props }: PopoverTitleProps) => {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
};

type PopoverDescriptionProps = PopoverPrimitive.Description.Props;

export const PopoverDescription = ({ className, ...props }: PopoverDescriptionProps) => {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
};
