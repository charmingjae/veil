import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Mounted by the root `app/(app)/layout.tsx`, which is outside `src` and not scanned.
    files: ["./src/widgets/app-layout/**"],
    rules: { "fsd/insignificant-slice": "off" },
  },
]);
