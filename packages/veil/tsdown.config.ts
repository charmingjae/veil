import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  // Runs in the browser, from any bundler; nothing Node-only is in it.
  platform: "neutral",
  dts: true,
  // Bundling into one file drops the `"use client"` at the top of `veil.tsx`, so it goes back on
  // top of the bundle. Without it, Next.js's App Router would try to render `Veil` on the server.
  // Not on the `.d.ts`, where TypeScript rejects it unless the consumer skips library checks.
  banner: ({ fileName }) => (fileName.endsWith(".d.ts") ? undefined : '"use client";'),
  // The warning that bundling drops that directive, which the banner above already puts back.
  checks: { moduleLevelDirective: false },
});
