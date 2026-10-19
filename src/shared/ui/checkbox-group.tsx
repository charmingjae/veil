"use client";

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group";
import { cn } from "cn";
import { type ComponentProps, type ReactNode, type Ref, useId } from "react";

import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/shared/ui/field";

export interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

type CheckboxGroupProps<T extends CheckboxOption> = Omit<
  ComponentProps<"div">,
  "defaultValue" | "onChange" | "children" | "ref"
> & {
  options: T[];
  /** The checked options' `value`s. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Every checked option is submitted under this name (`FormData.getAll(name)`). */
  name?: string;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  /** `card` makes each option a bordered, fully clickable box. */
  variant?: "default" | "card";
  /** Adds a parent checkbox that checks or unchecks every enabled option. */
  showSelectAll?: boolean;
  selectAllLabel?: ReactNode;
  /** Renders an option's label; defaults to `label` (and `description`). */
  renderOption?: (option: NoInfer<T>) => ReactNode;
  /** Reaches the first checkbox, so a form can focus the group (React Hook Form's `field.ref`). */
  ref?: Ref<HTMLElement>;
};

export const CheckboxGroup = <T extends CheckboxOption>({
  options,
  value,
  defaultValue,
  onChange,
  name,
  disabled,
  orientation = "vertical",
  variant = "default",
  showSelectAll = false,
  selectAllLabel = "전체",
  renderOption,
  ref,
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: CheckboxGroupProps<T>) => {
  const idPrefix = useId();
  const enabledValues = options.filter((option) => !option.disabled).map((option) => option.value);

  const renderItem = (
    key: string,
    checkbox: ReactNode,
    label: ReactNode,
    description?: string,
    isDisabled?: boolean,
  ) => {
    const checkboxId = `${idPrefix}-${key}`;
    const isCard = variant === "card";
    const item = (
      <Field
        key={isCard ? undefined : key}
        orientation="horizontal"
        data-disabled={isDisabled || undefined}
      >
        {checkbox}
        {isCard || description ? (
          <FieldContent>
            {isCard ? (
              <FieldTitle>{label}</FieldTitle>
            ) : (
              <FieldLabel htmlFor={checkboxId}>{label}</FieldLabel>
            )}
            {description && <FieldDescription>{description}</FieldDescription>}
          </FieldContent>
        ) : (
          <FieldLabel htmlFor={checkboxId} className="font-normal">
            {label}
          </FieldLabel>
        )}
      </Field>
    );

    return isCard ? (
      <FieldLabel key={key} htmlFor={checkboxId}>
        {item}
      </FieldLabel>
    ) : (
      item
    );
  };

  return (
    <CheckboxGroupPrimitive
      data-slot="checkbox-group"
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onChange?.(nextValue)}
      allValues={enabledValues}
      disabled={disabled}
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap gap-x-6 *:w-auto",
        className,
      )}
      {...props}
    >
      {showSelectAll &&
        renderItem(
          "select-all",
          <Checkbox id={`${idPrefix}-select-all`} parent aria-invalid={ariaInvalid} />,
          selectAllLabel,
        )}
      {options.map((option, index) =>
        renderItem(
          option.value,
          <Checkbox
            ref={index === 0 ? ref : undefined}
            id={`${idPrefix}-${option.value}`}
            name={name}
            value={option.value}
            disabled={option.disabled}
            aria-invalid={ariaInvalid}
          />,
          renderOption ? renderOption(option) : option.label,
          renderOption ? undefined : option.description,
          disabled || option.disabled,
        ),
      )}
    </CheckboxGroupPrimitive>
  );
};
