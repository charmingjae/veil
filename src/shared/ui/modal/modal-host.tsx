"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useMemo, useSyncExternalStore } from "react";

import { ModalContext, type ModalContextValue } from "./modal-context";
import {
  closeModal,
  dismissModal,
  getModals,
  type ModalEntry,
  removeModal,
  subscribeModals,
} from "./modal-store";

interface ModalRootProps {
  entry: ModalEntry;
}

const ModalRoot = ({ entry }: ModalRootProps) => {
  const controller = useMemo<ModalContextValue>(
    () => ({
      id: entry.id,
      isPending: entry.isPending,
      close: (value) => closeModal(entry.id, value),
      dismiss: () => dismissModal(entry.id),
    }),
    [entry.id, entry.isPending],
  );
  const Root = entry.role === "alertdialog" ? AlertDialogPrimitive.Root : DialogPrimitive.Root;

  return (
    <ModalContext.Provider value={controller}>
      <Root
        open={entry.isOpen}
        // Esc, outside click, ✕, DialogClose: a dismissal, which the guard may refuse.
        onOpenChange={(open) => !open && dismissModal(entry.id)}
        onOpenChangeComplete={(open) => !open && removeModal(entry.id)}
      >
        {entry.render(controller)}
      </Root>
    </ModalContext.Provider>
  );
};

/**
 * Renders every modal opened with `openModal()`, later ones on top. Mount once inside the app's
 * providers, so modal content can use routing and other app context.
 */
export const ModalHost = () => {
  const entries = useSyncExternalStore(
    subscribeModals,
    getModals,
    // Server snapshot: modals open only in the browser, so on the server the list is always empty.
    getModals,
  );

  return entries.map((entry) => <ModalRoot key={entry.id} entry={entry} />);
};
