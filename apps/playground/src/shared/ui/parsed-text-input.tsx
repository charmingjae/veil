"use client";

import { type ComponentProps, useState } from "react";

import { InputGroupInput } from "@/shared/ui/input-group";

type ParsedTextInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  value: string;
  /** Reads the typed text as a normalized value, or `null` when it is not one. */
  parse: (text: string) => string | null;
  onValueChange: (value: string) => void;
};

/**
 * The text box of `DateInput` and `TimeInput`, inside an `InputGroup`.
 * It keeps exactly what was typed. The value is `parse(text)` when the text reads as a value,
 * otherwise the text itself, so the schema can tell empty from invalid. On blur the text is
 * replaced by the value (`20261016` → `2026-10-16`). With `name`, a hidden input submits the
 * value, not the typed text, even when Enter submits before blur.
 */
export const ParsedTextInput = ({
  value,
  parse,
  onValueChange,
  name,
  disabled,
  onBlur,
  ...props
}: ParsedTextInputProps) => {
  const [text, setText] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  // The value changed from outside (picker, reset, setValue): show it.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(value);
  }

  const handleChange = (nextText: string) => {
    const nextValue = parse(nextText) ?? nextText;
    setText(nextText);
    setSyncedValue(nextValue);
    onValueChange(nextValue);
  };

  return (
    <>
      <InputGroupInput
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={(event) => {
          setText(value);
          onBlur?.(event);
        }}
        disabled={disabled}
        autoComplete="off"
        {...props}
      />
      {name && <input type="hidden" name={name} value={value} disabled={disabled} />}
    </>
  );
};
