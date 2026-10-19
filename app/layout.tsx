import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/app/entrypoint/providers";

import "@/app/styles/index.css";

export const metadata: Metadata = {
  title: "veil",
  // Not indexed unless a page opts in with its own `robots`.
  robots: { index: false, follow: false },
};

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
