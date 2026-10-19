"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
import { type ComponentProps, Fragment, type KeyboardEvent, type ReactNode } from "react";

import { flattenOptions, isOptionGroups, type OptionGroup } from "@/shared/lib/option-groups";
import { useControllableValue } from "@/shared/lib/use-controllable-value";
import { Button } from "@/shared/ui/button";

// shadcn names this `Select`; renamed so our `Select` (at the end of this file) can take the name.
export const SelectRoot = SelectPrimitive.Root;

type SelectGroupProps = SelectPrimitive.Group.Props;

export const SelectGroup = ({ className, ...props }: SelectGroupProps) => {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
};

type SelectValueProps = SelectPrimitive.Value.Props;

export const SelectValue = ({ className, ...props }: SelectValueProps) => {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  );
};

type SelectTriggerProps = SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
};

export const SelectTrigger = ({
  className,
  size = "default",
  children,
  ...props
}: SelectTriggerProps) => {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 whitespace-nowrap rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-9 data-[size=sm]:h-8 data-placeholder:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:hover:bg-input/50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={<ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />}
      />
    </SelectPrimitive.Trigger>
  );
};

type SelectContentProps = SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >;

export const SelectContent = ({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectContentProps) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-y-auto overflow-x-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-closed:animate-out data-open:animate-in",
            className,
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
};

type SelectLabelProps = SelectPrimitive.GroupLabel.Props;

export const SelectLabel = ({ className, ...props }: SelectLabelProps) => {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-muted-foreground text-xs", className)}
      {...props}
    />
  );
};

type SelectItemProps = SelectPrimitive.Item.Props;

export const SelectItem = ({ className, children, ...props }: SelectItemProps) => {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
};

type SelectSeparatorProps = SelectPrimitive.Separator.Props;

export const SelectSeparator = ({ className, ...props }: SelectSeparatorProps) => {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
};

type SelectScrollUpButtonProps = ComponentProps<typeof SelectPrimitive.ScrollUpArrow>;

export const SelectScrollUpButton = ({ className, ...props }: SelectScrollUpButtonProps) => {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
};

type SelectScrollDownButtonProps = ComponentProps<typeof SelectPrimitive.ScrollDownArrow>;

export const SelectScrollDownButton = ({ className, ...props }: SelectScrollDownButtonProps) => {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
};

// Ours: a select with the same props and clear behavior as `Autocomplete`.

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type SelectProps<T extends SelectOption, G extends object> = Omit<
  ComponentProps<"button">,
  "value" | "defaultValue" | "onChange" | "children"
> & {
  /**
   * A flat list, or groups shown under headings with separators between them. Extra fields on
   * options and groups reach the render props typed when the data has a declared type.
   */
  options: T[] | (G & OptionGroup<T>)[];
  /** Renders the inside of one list item; defaults to its `label`. */
  renderOption?: (option: NoInfer<T>) => ReactNode;
  /** Renders the inside of a group heading; defaults to its `label`. */
  renderGroupLabel?: (group: NoInfer<G & OptionGroup<T>>) => ReactNode;
  /** Renders the selected option in the trigger; defaults to its `label`. */
  renderValue?: (option: NoInfer<T>) => ReactNode;
  /** The selected option's `value`; `""` means nothing is selected. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

export const Select = <T extends SelectOption, G extends object = object>({
  options,
  renderOption,
  renderGroupLabel,
  renderValue,
  value,
  defaultValue = "",
  onChange,
  name,
  disabled,
  placeholder = "선택하세요",
  className,
  onKeyDown,
  ...props
}: SelectProps<T, G>) => {
  const flatOptions = flattenOptions<T, G>(options);
  // Kept here even when uncontrolled, so the clear button and Backspace/Delete can empty it.
  const [currentValue, handleChange] = useControllableValue(value, defaultValue, onChange);
  const selectedOption = flatOptions.find((option) => option.value === currentValue) ?? null;
  const isClearable = currentValue !== "" && !disabled;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (isClearable && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      handleChange("");
    }
  };

  const renderItem = (option: T) => (
    <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
      {renderOption ? renderOption(option) : option.label}
    </SelectItem>
  );

  return (
    <SelectRoot
      items={flatOptions}
      value={currentValue === "" ? null : currentValue}
      onValueChange={(nextValue) => handleChange(nextValue ?? "")}
      name={name}
      disabled={disabled}
    >
      <div
        data-slot="select"
        data-clearable={isClearable || undefined}
        className={cn("group/select relative w-full", className)}
      >
        <SelectTrigger
          className="w-full group-data-clearable/select:pointer-coarse:[&>svg]:invisible group-data-clearable/select:group-hover/select:[&>svg]:invisible group-data-clearable/select:group-focus-within/select:[&>svg]:invisible"
          onKeyDown={handleKeyDown}
          {...props}
        >
          <SelectValue placeholder={placeholder}>
            {renderValue && selectedOption ? renderValue(selectedOption) : undefined}
          </SelectValue>
        </SelectTrigger>
        {/* A sibling over the chevron, not a child: a button cannot contain a button. */}
        {isClearable && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            tabIndex={-1}
            aria-label="선택 지우기"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleChange("")}
            className="absolute top-1/2 right-1 pointer-coarse:flex hidden -translate-y-1/2 text-muted-foreground group-focus-within/select:flex group-hover/select:flex"
          >
            <XIcon />
          </Button>
        )}
      </div>
      <SelectContent alignItemWithTrigger={false} align="start" sideOffset={6}>
        {isOptionGroups<T, G>(options)
          ? options.map((group, index) => (
              <Fragment key={group.label}>
                {index > 0 && <SelectSeparator />}
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2 [&_svg:not([class*='size-'])]:size-3.5">
                    {renderGroupLabel ? renderGroupLabel(group) : group.label}
                  </SelectLabel>
                  {group.options.map(renderItem)}
                </SelectGroup>
              </Fragment>
            ))
          : options.map(renderItem)}
      </SelectContent>
    </SelectRoot>
  );
};
