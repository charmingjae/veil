"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { MinusIcon, PlusIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";

type NumberInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "prefix"
> & {
  /** `null` means empty. */
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Step for the arrow keys and the stepper buttons. Shift + arrow uses 10 steps. */
  step?: number;
  /** Thousands separators. On by default. */
  formatted?: boolean;
  /** Other `Intl.NumberFormat` options, e.g. `{ maximumFractionDigits: 2 }`. */
  format?: Intl.NumberFormatOptions;
  /** Shown before the number, e.g. a currency sign. */
  prefix?: ReactNode;
  /** Shown after the number, e.g. a unit. */
  suffix?: ReactNode;
  /** Shows − / + buttons. */
  showStepper?: boolean;
};

export const NumberInput = ({
  value,
  defaultValue,
  onChange,
  min,
  max,
  step,
  formatted = true,
  format,
  prefix,
  suffix,
  showStepper = false,
  name,
  disabled,
  readOnly,
  required,
  className,
  ...props
}: NumberInputProps) => {
  return (
    <NumberFieldPrimitive.Root
      value={value}
      defaultValue={defaultValue ?? undefined}
      onValueChange={(nextValue) => onChange?.(nextValue)}
      min={min}
      max={max}
      step={step}
      format={{ ...format, useGrouping: formatted && format?.useGrouping !== false }}
      name={name}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
    >
      <NumberFieldPrimitive.Group
        render={<InputGroup data-disabled={disabled || undefined} className={className} />}
      >
        {prefix && (
          <InputGroupAddon>
            <InputGroupText>{prefix}</InputGroupText>
          </InputGroupAddon>
        )}
        <NumberFieldPrimitive.Input render={<InputGroupInput />} {...props} />
        {suffix && (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{suffix}</InputGroupText>
          </InputGroupAddon>
        )}
        {showStepper && (
          <InputGroupAddon align="inline-end" className="gap-0.5">
            <NumberFieldPrimitive.Decrement
              render={<InputGroupButton size="icon-xs" aria-label="감소" />}
            >
              <MinusIcon />
            </NumberFieldPrimitive.Decrement>
            <NumberFieldPrimitive.Increment
              render={<InputGroupButton size="icon-xs" aria-label="증가" />}
            >
              <PlusIcon />
            </NumberFieldPrimitive.Increment>
          </InputGroupAddon>
        )}
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
};
