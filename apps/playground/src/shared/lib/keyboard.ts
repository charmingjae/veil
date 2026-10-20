import type { KeyboardEvent } from "react";

// While composing Korean (IME), Enter first confirms the syllable and still fires keydown.
// Handling that keydown runs the action too early and the confirmed syllable is typed again.
// Safari reports `isComposing: false` for it, so keyCode 229 ("IME is processing") is checked too.
export const isEnterKey = (event: KeyboardEvent) => {
  return event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229;
};
