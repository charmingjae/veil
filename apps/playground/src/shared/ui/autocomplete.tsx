"use client";

import { cn } from "cn";
import { SearchIcon, XIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  Fragment,
  type KeyboardEvent,
  type ReactNode,
  useContext,
} from "react";

import { flattenOptions, isOptionGroups, type OptionGroup } from "@/shared/lib/option-groups";
import { useControllableValue } from "@/shared/lib/use-controllable-value";
import { Button } from "@/shared/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@/shared/ui/combobox";
import { InputGroupAddon } from "@/shared/ui/input-group";

export interface AutocompleteOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type AutocompleteBaseProps<T extends AutocompleteOption, G extends object> = Omit<
  ComponentProps<"button">,
  "value" | "defaultValue" | "onChange" | "children"
> & {
  /**
   * A flat list, or groups shown under headings with separators between them. Extra fields on
   * options and groups reach the render props typed when the data has a declared type.
   */
  options: T[] | (G & OptionGroup<T>)[];
  /** Renders the inside of one list item; defaults to its `label`. Search still matches `label`. */
  renderOption?: (option: NoInfer<T>) => ReactNode;
  /** Renders the inside of a group heading; defaults to its `label`. */
  renderGroupLabel?: (group: NoInfer<G & OptionGroup<T>>) => ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
};

type AutocompleteSingleProps<
  T extends AutocompleteOption,
  G extends object,
> = AutocompleteBaseProps<T, G> & {
  multiple?: false;
  /** The selected option's `value`; `""` means nothing is selected. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Renders the selected option in the trigger; defaults to its `label`. */
  renderValue?: (option: NoInfer<T>) => ReactNode;
  renderChip?: never;
};

type AutocompleteMultipleProps<
  T extends AutocompleteOption,
  G extends object,
> = AutocompleteBaseProps<T, G> & {
  multiple: true;
  /** The selected options' `value`s, in the order they were picked. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Renders one selected option; return an `AutocompleteChip`. */
  renderChip?: (option: NoInfer<T>) => ReactNode;
  renderValue?: never;
};

type AutocompleteProps<T extends AutocompleteOption, G extends object> =
  | AutocompleteSingleProps<T, G>
  | AutocompleteMultipleProps<T, G>;

// While a value can be cleared, hovering or focusing the field (or any touch device) swaps the
// chevron for the clear button.
const CHEVRON_SWAP_CLASSES =
  "group-data-clearable/autocomplete:pointer-coarse:[&>svg]:invisible group-data-clearable/autocomplete:group-hover/autocomplete:[&>svg]:invisible group-data-clearable/autocomplete:group-focus-within/autocomplete:[&>svg]:invisible";

const findOption = <T extends AutocompleteOption>(options: T[], value: string) => {
  return options.find((option) => option.value === value) ?? null;
};

export const Autocomplete = <T extends AutocompleteOption, G extends object = object>(
  props: AutocompleteProps<T, G>,
) => {
  if (props.multiple) {
    const { multiple, ...rest } = props;
    return <AutocompleteMultiple<T, G> {...rest} />;
  }
  const { multiple, ...rest } = props;
  return <AutocompleteSingle<T, G> {...rest} />;
};

const AutocompleteSingle = <T extends AutocompleteOption, G extends object>({
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
  searchPlaceholder,
  emptyText,
  className,
  onKeyDown,
  ...props
}: Omit<AutocompleteSingleProps<T, G>, "multiple">) => {
  // Kept here even when uncontrolled, so the clear button and Backspace/Delete can empty it.
  const [currentValue, handleChange] = useControllableValue(value, defaultValue, onChange);
  const selectedOption = findOption(flattenOptions<T, G>(options), currentValue);
  const isClearable = currentValue !== "" && !disabled;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (isClearable && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      handleChange("");
    }
  };

  return (
    <Combobox
      items={toComboboxItems<T, G>(options)}
      value={selectedOption}
      onValueChange={(option) => handleChange(option?.value ?? "")}
      name={name}
      disabled={disabled}
    >
      <div
        data-slot="autocomplete"
        data-clearable={isClearable || undefined}
        className={cn("group/autocomplete relative w-full", className)}
      >
        <ComboboxTrigger
          data-slot="autocomplete-trigger"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-1.5 whitespace-nowrap rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            CHEVRON_SWAP_CLASSES,
          )}
          onKeyDown={handleKeyDown}
          {...props}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
            {selectedOption === null ? (
              <span className="truncate text-muted-foreground">{placeholder}</span>
            ) : renderValue ? (
              renderValue(selectedOption)
            ) : (
              <span className="truncate">{selectedOption.label}</span>
            )}
          </span>
        </ComboboxTrigger>
        {isClearable && <AutocompleteClearButton onClick={() => handleChange("")} />}
      </div>
      <AutocompletePopup
        renderOption={renderOption}
        renderGroupLabel={renderGroupLabel}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
      />
    </Combobox>
  );
};

const AutocompleteMultiple = <T extends AutocompleteOption, G extends object>({
  options,
  renderOption,
  renderGroupLabel,
  value,
  defaultValue = [],
  onChange,
  renderChip = (option) => <AutocompleteChip>{option.label}</AutocompleteChip>,
  name,
  disabled,
  placeholder = "선택하세요",
  searchPlaceholder,
  emptyText,
  className,
  onKeyDown,
  ...props
}: Omit<AutocompleteMultipleProps<T, G>, "multiple">) => {
  // Kept here even when uncontrolled, so chips, the clear button, and Backspace/Delete can change it.
  const [currentValue, handleChange] = useControllableValue(value, defaultValue, onChange);
  const flatOptions = flattenOptions<T, G>(options);
  const selectedOptions = currentValue
    .map((selected) => findOption(flatOptions, selected))
    .filter((option) => option !== null);
  const isClearable = selectedOptions.length > 0 && !disabled;

  const handleRemove = (removed: string) => {
    handleChange(currentValue.filter((selected) => selected !== removed));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (!isClearable) {
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      handleChange(currentValue.slice(0, -1));
    } else if (event.key === "Delete") {
      event.preventDefault();
      handleChange([]);
    }
  };

  return (
    <Combobox
      multiple
      items={toComboboxItems<T, G>(options)}
      value={selectedOptions}
      onValueChange={(nextOptions) => handleChange(nextOptions.map((option) => option.value))}
      name={name}
      disabled={disabled}
    >
      {/* The trigger fills the box behind the chips: chips have remove buttons, and a button
          cannot contain a button. Clicks between or on chips fall through to the trigger. */}
      <div
        data-slot="autocomplete"
        data-clearable={isClearable || undefined}
        className={cn(
          "group/autocomplete relative flex min-h-9 w-full items-center rounded-md border border-input bg-transparent py-1 pr-8 pl-1 shadow-xs transition-[color,box-shadow] has-disabled:cursor-not-allowed has-aria-invalid:border-destructive has-focus-visible:border-ring has-disabled:opacity-50 has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40 dark:hover:bg-input/50",
          className,
        )}
      >
        <ComboboxTrigger
          data-slot="autocomplete-trigger"
          className={cn(
            "absolute inset-0 flex items-center justify-between gap-1.5 rounded-md pr-2 pl-2.5 text-sm outline-none disabled:cursor-not-allowed [&>svg]:ml-auto [&_svg]:pointer-events-none [&_svg]:shrink-0",
            CHEVRON_SWAP_CLASSES,
          )}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {selectedOptions.length > 0 ? (
            <span className="sr-only">
              {selectedOptions.map((option) => option.label).join(", ")}
            </span>
          ) : (
            <span className="flex-1 truncate text-left text-muted-foreground">{placeholder}</span>
          )}
        </ComboboxTrigger>
        {selectedOptions.length > 0 && (
          <div className="pointer-events-none relative flex flex-wrap gap-1">
            {selectedOptions.map((option) => (
              <AutocompleteChipContext
                key={option.value}
                value={{
                  label: option.label,
                  onRemove: disabled ? undefined : () => handleRemove(option.value),
                }}
              >
                {renderChip(option)}
              </AutocompleteChipContext>
            ))}
          </div>
        )}
        {isClearable && <AutocompleteClearButton onClick={() => handleChange([])} />}
      </div>
      <AutocompletePopup
        renderOption={renderOption}
        renderGroupLabel={renderGroupLabel}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
      />
    </Combobox>
  );
};

interface AutocompleteChipContextValue {
  label: string;
  /** Missing when the field is disabled. */
  onRemove?: () => void;
}

const AutocompleteChipContext = createContext<AutocompleteChipContextValue | null>(null);

type AutocompleteChipProps = ComponentProps<"span">;

/** One selected option in a `multiple` Autocomplete. Use it in `renderChip`; removing is wired up. */
export const AutocompleteChip = ({ className, children, ...props }: AutocompleteChipProps) => {
  const chip = useContext(AutocompleteChipContext);
  if (!chip) {
    throw new Error("AutocompleteChip must be rendered by Autocomplete's renderChip.");
  }

  return (
    <span
      data-slot="autocomplete-chip"
      className={cn(
        "flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 whitespace-nowrap rounded-sm bg-muted px-1.5 font-medium text-foreground text-xs has-data-[slot=autocomplete-chip-remove]:pr-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      {children}
      {chip.onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          tabIndex={-1}
          data-slot="autocomplete-chip-remove"
          aria-label={`${chip.label} 삭제`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={chip.onRemove}
          className="pointer-events-auto -ml-1 opacity-50 hover:opacity-100"
        >
          <XIcon />
        </Button>
      )}
    </span>
  );
};

interface AutocompleteClearButtonProps {
  onClick: () => void;
}

// A sibling over the chevron, not inside the trigger: a button cannot contain a button.
const AutocompleteClearButton = ({ onClick }: AutocompleteClearButtonProps) => {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      tabIndex={-1}
      aria-label="선택 지우기"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="absolute top-1/2 right-1 pointer-coarse:flex hidden -translate-y-1/2 text-muted-foreground group-focus-within/autocomplete:flex group-hover/autocomplete:flex"
    >
      <XIcon />
    </Button>
  );
};

// Base UI recognizes groups by an `items` array; it filters inside each group and drops empty ones.
const toComboboxItems = <T, G>(options: T[] | (G & OptionGroup<T>)[]) => {
  return isOptionGroups<T, G>(options)
    ? options.map((group) => ({ ...group, items: group.options }))
    : options;
};

interface AutocompletePopupProps<T extends AutocompleteOption, G extends object> {
  renderOption?: (option: T) => ReactNode;
  renderGroupLabel?: (group: G & OptionGroup<T>) => ReactNode;
  searchPlaceholder?: string;
  emptyText?: string;
}

const AutocompletePopup = <T extends AutocompleteOption, G extends object>({
  renderOption,
  renderGroupLabel,
  searchPlaceholder = "검색",
  emptyText = "결과가 없습니다.",
}: AutocompletePopupProps<T, G>) => {
  const renderItem = (option: T) => (
    <ComboboxItem key={option.value} value={option} disabled={option.disabled}>
      {renderOption ? renderOption(option) : option.label}
    </ComboboxItem>
  );

  return (
    <ComboboxContent className="min-w-(--anchor-width)">
      <ComboboxInput showTrigger={false} placeholder={searchPlaceholder}>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxEmpty>{emptyText}</ComboboxEmpty>
      <ComboboxList>
        {(entry: T | (G & OptionGroup<T> & { items: T[] }), index: number) =>
          "items" in entry ? (
            <Fragment key={entry.label}>
              {index > 0 && <ComboboxSeparator />}
              <ComboboxGroup items={entry.items}>
                <ComboboxLabel className="flex items-center gap-2 [&_svg:not([class*='size-'])]:size-3.5">
                  {renderGroupLabel ? renderGroupLabel(entry) : entry.label}
                </ComboboxLabel>
                <ComboboxCollection>{renderItem}</ComboboxCollection>
              </ComboboxGroup>
            </Fragment>
          ) : (
            renderItem(entry)
          )
        }
      </ComboboxList>
    </ComboboxContent>
  );
};
