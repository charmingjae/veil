"use client";

import { createContext, useContext, useEffect } from "react";

import { type DismissGuard, type ModalController, setModalGuard } from "./modal-store";

export interface ModalContextValue extends ModalController<unknown> {
  id: number;
  isPending: boolean;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal() works only inside content opened with openModal().");
  }
  return context;
};

/** The controller of the modal this component is rendered in: `close(value)`, `dismiss()`. */
export const useModal = <T = undefined>() => {
  return useModalContext() as ModalController<T>;
};

/**
 * Runs `guard` before the modal is dismissed (Esc, outside click, ✕, `dismiss()`); returning
 * `false` keeps it open. `null` removes the guard. `close(value)` is never guarded.
 */
export const useModalDismissGuard = (guard: DismissGuard | null) => {
  const { id } = useModalContext();

  useEffect(() => {
    setModalGuard(id, guard);
    return () => setModalGuard(id, null);
  }, [id, guard]);
};
