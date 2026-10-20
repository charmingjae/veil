"use client";

import { type ComponentProps, useState } from "react";

import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";

import { useModalContext } from "./modal-context";
import { setModalPending } from "./modal-store";

type ModalButtonProps<T> = Omit<ComponentProps<typeof Button>, "value" | "onClick"> & {
  /** The value `openModal()` resolves to. Without it the button dismisses (like Cancel). */
  value?: T;
  /**
   * Work to run before closing. While it runs, this button shows a spinner and every button and
   * dismissal (Esc, outside click, ✕) is blocked. If it throws, the modal stays open; report the
   * failure inside it (e.g. `toast.error`).
   */
  onClick?: () => unknown;
};

/** A button that closes its modal, with `value` or as a dismissal, after its optional work. */
export const ModalButton = <T,>({
  value,
  onClick,
  disabled,
  children,
  ...props
}: ModalButtonProps<T>) => {
  const modal = useModalContext();
  const [isRunning, setIsRunning] = useState(false);

  const handleClick = async () => {
    if (onClick) {
      setIsRunning(true);
      setModalPending(modal.id, true);
      try {
        await onClick();
      } catch {
        // Stay open; `onClick` reports the failure itself.
        return;
      } finally {
        setIsRunning(false);
        setModalPending(modal.id, false);
      }
    }
    if (value === undefined) {
      modal.dismiss();
    } else {
      modal.close(value);
    }
  };

  return (
    <Button
      {...props}
      disabled={disabled || modal.isPending}
      aria-busy={isRunning || undefined}
      onClick={handleClick}
    >
      {isRunning && <Spinner />}
      {children}
    </Button>
  );
};
