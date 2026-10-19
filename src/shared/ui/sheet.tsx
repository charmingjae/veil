"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/shared/ui/button";

type SheetProps = SheetPrimitive.Root.Props;

export const Sheet = ({ ...props }: SheetProps) => {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
};

type SheetTriggerProps = SheetPrimitive.Trigger.Props;

export const SheetTrigger = ({ ...props }: SheetTriggerProps) => {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
};

type SheetCloseProps = SheetPrimitive.Close.Props;

export const SheetClose = ({ ...props }: SheetCloseProps) => {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
};

type SheetPortalProps = SheetPrimitive.Portal.Props;

const SheetPortal = ({ ...props }: SheetPortalProps) => {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
};

type SheetOverlayProps = SheetPrimitive.Backdrop.Props;

const SheetOverlay = ({ className, ...props }: SheetOverlayProps) => {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
};

type SheetContentProps = SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
};

export const SheetContent = ({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetContentProps) => {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-popover-foreground text-sm shadow-lg transition duration-200 ease-in-out data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=bottom]:inset-x-0 data-[side=top]:inset-x-0 data-[side=left]:inset-y-0 data-[side=right]:inset-y-0 data-[side=top]:top-0 data-[side=right]:right-0 data-[side=bottom]:bottom-0 data-[side=left]:left-0 data-[side=bottom]:h-auto data-[side=left]:h-full data-[side=right]:h-full data-[side=top]:h-auto data-[side=left]:w-3/4 data-[side=right]:w-3/4 data-[side=bottom]:border-t data-[side=left]:border-r data-[side=top]:border-b data-[side=right]:border-l data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={<Button variant="ghost" className="absolute top-4 right-4" size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
};

type SheetHeaderProps = React.ComponentProps<"div">;

export const SheetHeader = ({ className, ...props }: SheetHeaderProps) => {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
};

type SheetFooterProps = React.ComponentProps<"div">;

export const SheetFooter = ({ className, ...props }: SheetFooterProps) => {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
};

type SheetTitleProps = SheetPrimitive.Title.Props;

export const SheetTitle = ({ className, ...props }: SheetTitleProps) => {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading font-medium text-foreground", className)}
      {...props}
    />
  );
};

type SheetDescriptionProps = SheetPrimitive.Description.Props;

export const SheetDescription = ({ className, ...props }: SheetDescriptionProps) => {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
};
