import type { ReactNode } from "react";

/** Handed to the content of an open modal (also via `useModal()`). */
export interface ModalController<T> {
  /** Closes with a value; `openModal()` resolves to it. Skips the dismiss guard. */
  close: (value: T) => void;
  /** Closes without a value (`undefined`), like Esc, outside click, and ✕. Asks the guard first. */
  dismiss: () => void;
}

interface OpenModalOptions {
  /** `alertdialog` for questions that need an answer: outside clicks do not close it. */
  role?: "dialog" | "alertdialog";
}

/** Answers whether the modal may close; `false` keeps it open. */
export type DismissGuard = () => boolean | Promise<boolean>;

export interface ModalEntry {
  id: number;
  role: "dialog" | "alertdialog";
  render: (controller: ModalController<unknown>) => ReactNode;
  isOpen: boolean;
  /** A `ModalButton` is running its work: every button is disabled and dismissing is blocked. */
  isPending: boolean;
  resolve: (value: unknown) => void;
}

// Module-level store, so `openModal()` can be called from anywhere, like `toast()`.
let entries: ModalEntry[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const guards = new Map<number, DismissGuard>();

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

export const subscribeModals = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getModals = () => entries;

/**
 * Opens a modal whose content is whatever `render` returns (usually `<ModalLayout>`), on top of
 * any open one. Resolves to the value given to `close(value)`, or `undefined` when dismissed.
 */
export const openModal = <T = undefined>(
  render: (controller: ModalController<T>) => ReactNode,
  options: OpenModalOptions = {},
) => {
  return new Promise<T | undefined>((resolve) => {
    const entry: ModalEntry = {
      id: nextId++,
      role: options.role ?? "dialog",
      // The entry list holds modals of every value type; each controller only ever sees its own T.
      render: render as ModalEntry["render"],
      isOpen: true,
      isPending: false,
      resolve: resolve as ModalEntry["resolve"],
    };
    entries = [...entries, entry];
    emit();
  });
};

const settle = (id: number, value: unknown) => {
  const entry = entries.find((item) => item.id === id);
  if (!entry?.isOpen) {
    return;
  }
  entry.resolve(value);
  guards.delete(id);
  // Stays in the list, closed, until its closing animation ends (`removeModal`).
  entries = entries.map((item) =>
    item.id === id ? { ...item, isOpen: false, isPending: false } : item,
  );
  emit();
};

export const closeModal = (id: number, value: unknown) => settle(id, value);

export const dismissModal = async (id: number) => {
  if (entries.find((item) => item.id === id)?.isPending) {
    return;
  }
  const guard = guards.get(id);
  if (guard && !(await guard())) {
    return;
  }
  settle(id, undefined);
};

export const setModalPending = (id: number, isPending: boolean) => {
  entries = entries.map((item) => (item.id === id ? { ...item, isPending } : item));
  emit();
};

export const removeModal = (id: number) => {
  entries = entries.filter((item) => item.id !== id);
  emit();
};

export const setModalGuard = (id: number, guard: DismissGuard | null) => {
  if (guard) {
    guards.set(id, guard);
  } else {
    guards.delete(id);
  }
};
