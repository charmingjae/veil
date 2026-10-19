import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl items-center justify-center">
      <main className="flex-1">{children}</main>
    </div>
  );
};
