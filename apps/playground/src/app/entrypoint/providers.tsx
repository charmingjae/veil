"use client";

import type { ReactNode } from "react";

import { ModalHost } from "@/shared/ui/modal";
import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <TooltipProvider>
      {children}
      <ModalHost />
      {/* App-wide toast defaults; each toast() call can override them. */}
      <Toaster position="top-center" />
    </TooltipProvider>
  );
};
