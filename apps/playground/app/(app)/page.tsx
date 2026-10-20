import type { Metadata } from "next";

export { HomePage as default } from "@/pages/home";

export const metadata: Metadata = {
  title: "Veil",
  description: "Every surface hides a story",
  robots: { index: true, follow: true },
};
