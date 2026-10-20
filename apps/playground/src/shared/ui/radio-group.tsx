"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cn } from "cn";
import { type ComponentProps, type ReactNode, type Ref, useId } from "react";

import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/shared/ui/field";

type RadioGroupRootProps = RadioGroupPrimitive.Props;

// shadcn names this `RadioGroup`; renamed so our `RadioGroup` (at the end of this file) can take the name.
export const RadioGroupRoot = ({ className, ...props }: RadioGroupRootProps) => {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  );
};

type RadioGroupItemProps = RadioPrimitive.Root.Props;

export const RadioGroupItem = ({ className, ...props }: RadioGroupItemProps) => {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-input outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 group-has-[:focus-visible]/field-label:not-data-checked:border-input group-has-[:focus-visible]/field-label:ring-0 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:bg-input/30 dark:data-checked:bg-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
};

// Ours: a radio group with the same `options` shape as `Select` and the same layout props as
// `CheckboxGroup`.

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

type RadioGroupProps<T extends RadioOption> = Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange" | "children" | "ref"
> & {
  options: T[];
  /** The selected option's `value`; `""` means nothing is selected. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** The selected value is submitted under this name. */
  name?: string;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  /** `card` makes each option a bordered, fully clickable box. */
  variant?: "default" | "card";
  /** Renders an option's label; defaults to `label` (and `description`). */
  renderOption?: (option: NoInfer<T>) => ReactNode;
  /** Reaches the selected (or first) radio, so a form can focus the group (React Hook Form's `field.ref`). */
  ref?: Ref<HTMLElement>;
};

export const RadioGroup = <T extends RadioOption>({
  options,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  orientation = "vertical",
  variant = "default",
  renderOption,
  ref,
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: RadioGroupProps<T>) => {
  const idPrefix = useId();
  const isCard = variant === "card";
  const selectedValue = value ?? defaultValue ?? "";
  const focusTarget =
    options.find((option) => option.value === selectedValue && !option.disabled) ??
    options.find((option) => !option.disabled);

  return (
    <RadioGroupRoot
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onChange?.(String(nextValue))}
      name={name}
      disabled={disabled}
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap gap-x-6 *:w-auto",
        className,
      )}
      {...props}
    >
      {options.map((option) => {
        const radioId = `${idPrefix}-${option.value}`;
        const label = renderOption ? renderOption(option) : option.label;
        const description = renderOption ? undefined : option.description;
        const item = (
          <Field
            key={isCard ? undefined : option.value}
            orientation="horizontal"
            data-disabled={disabled || option.disabled || undefined}
          >
            <RadioGroupItem
              ref={option === focusTarget ? ref : undefined}
              id={radioId}
              value={option.value}
              disabled={option.disabled}
              aria-invalid={ariaInvalid}
            />
            {isCard || description ? (
              <FieldContent>
                {isCard ? (
                  <FieldTitle>{label}</FieldTitle>
                ) : (
                  <FieldLabel htmlFor={radioId}>{label}</FieldLabel>
                )}
                {description && <FieldDescription>{description}</FieldDescription>}
              </FieldContent>
            ) : (
              <FieldLabel htmlFor={radioId} className="font-normal">
                {label}
              </FieldLabel>
            )}
          </Field>
        );

        return isCard ? (
          <FieldLabel key={option.value} htmlFor={radioId}>
            {item}
          </FieldLabel>
        ) : (
          item
        );
      })}
    </RadioGroupRoot>
  );
};
