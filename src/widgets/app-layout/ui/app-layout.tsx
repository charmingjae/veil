import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";

import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};
