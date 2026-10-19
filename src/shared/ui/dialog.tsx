"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { XIcon } from "lucide-react";
import type * as React from "react";
import { type Ref, useRef } from "react";

import { Button } from "@/shared/ui/button";

// Ours: where the dialog sits; `ModalLayout` exposes it as `position`.
const dialogPositionVariants = cva("fixed", {
  variants: {
    position: {
      "top-left": "top-4 left-4",
      "top-center": "top-4 left-1/2 -translate-x-1/2",
      "top-right": "top-4 right-4",
      "center-left": "top-1/2 left-4 -translate-y-1/2",
      center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
      "center-right": "top-1/2 right-4 -translate-y-1/2",
      "bottom-left": "bottom-4 left-4",
      "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
      "bottom-right": "right-4 bottom-4",
    },
  },
  defaultVariants: {
    position: "center",
  },
});

export type DialogPosition = NonNullable<VariantProps<typeof dialogPositionVariants>["position"]>;

type DialogProps = DialogPrimitive.Root.Props;

export const Dialog = ({ ...props }: DialogProps) => {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
};

type DialogTriggerProps = DialogPrimitive.Trigger.Props;

export const DialogTrigger = ({ ...props }: DialogTriggerProps) => {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
};

type DialogPortalProps = DialogPrimitive.Portal.Props;

export const DialogPortal = ({ ...props }: DialogPortalProps) => {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
};

type DialogCloseProps = DialogPrimitive.Close.Props;

export const DialogClose = ({ ...props }: DialogCloseProps) => {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
};

type DialogOverlayProps = DialogPrimitive.Backdrop.Props;

export const DialogOverlay = ({ className, ...props }: DialogOverlayProps) => {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "data-open:fade-in-0 data-closed:fade-out-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 data-closed:animate-out data-open:animate-in supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
};

type DialogCornerCloseProps = DialogPrimitive.Close.Props;

/** Ours: the ✕ in the top right corner. */
const DialogCornerClose = ({ className, ...props }: DialogCornerCloseProps) => {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      render={
        <Button
          variant="ghost"
          className={cn("absolute top-4 right-4", className)}
          size="icon-sm"
        />
      }
      {...props}
    >
      <XIcon />
      <span className="sr-only">닫기</span>
    </DialogPrimitive.Close>
  );
};

// The first element marked `data-autofocus` (a button, an input), else the dialog itself.
const findAutoFocus = (popup: HTMLElement | null) =>
  popup?.querySelector<HTMLElement>("[data-autofocus]") ?? popup;

const assignRef = <T,>(ref: Ref<T> | undefined, value: T) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
};

type DialogContentProps = DialogPrimitive.Popup.Props &
  VariantProps<typeof dialogPositionVariants> & {
    showCloseButton?: boolean;
  };

// Ours: `position`; the content is a flex column capped at the viewport height, so a
// `DialogBody` inside it scrolls while the parts outside it stay fixed. On open, focus goes to the
// element marked `data-autofocus`, else the dialog itself, not its first button: a button in a
// scrolling body would scroll it to the end. `initialFocus` still overrides both.
export const DialogContent = ({
  className,
  children,
  position,
  showCloseButton = true,
  initialFocus,
  ref,
  ...props
}: DialogContentProps) => {
  const popupRef = useRef<HTMLDivElement | null>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    popupRef.current = node;
    assignRef(ref, node);
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-show-close={showCloseButton || undefined}
        ref={setRefs}
        initialFocus={initialFocus ?? (() => findAutoFocus(popupRef.current))}
        className={cn(
          dialogPositionVariants({ position }),
          "group/dialog-content data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-6 rounded-xl bg-popover p-6 text-popover-foreground text-sm outline-none ring-1 ring-foreground/10 duration-100 data-closed:animate-out data-open:animate-in sm:max-w-md",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && <DialogCornerClose />}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
};

type DialogHeaderProps = React.ComponentProps<"div">;

export const DialogHeader = ({ className, ...props }: DialogHeaderProps) => {
  return (
    <div
      data-slot="dialog-header"
      // Ours: room for the ✕ so a long title never runs under it.
      className={cn("flex flex-col gap-2 group-data-show-close/dialog-content:pr-8", className)}
      {...props}
    />
  );
};

type DialogBodyProps = React.ComponentProps<"div">;

/**
 * Ours: the part that scrolls when the content is taller than the screen. The 8px of inner room
 * (taken back with negative margins) keeps focus rings and the enlarged hit areas of checkboxes,
 * radios, and switches from being clipped or causing a scrollbar.
 */
export const DialogBody = ({ className, ...props }: DialogBodyProps) => {
  return (
    <div
      data-slot="dialog-body"
      className={cn("-mx-6 -my-2 min-h-0 flex-1 overflow-y-auto px-6 py-2", className)}
      {...props}
    />
  );
};

type DialogFooterProps = React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
};

export const DialogFooter = ({
  className,
  showCloseButton = false,
  children,
  ...props
}: DialogFooterProps) => {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        // Ours: the label is in the language users see.
        <DialogPrimitive.Close render={<Button variant="outline" />}>닫기</DialogPrimitive.Close>
      )}
    </div>
  );
};

type DialogTitleProps = DialogPrimitive.Title.Props;

export const DialogTitle = ({ className, ...props }: DialogTitleProps) => {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading font-medium leading-none", className)}
      {...props}
    />
  );
};

type DialogDescriptionProps = DialogPrimitive.Description.Props;

export const DialogDescription = ({ className, ...props }: DialogDescriptionProps) => {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-muted-foreground text-sm *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
};
