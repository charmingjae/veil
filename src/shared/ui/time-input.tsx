"use client";

import { ClockIcon } from "lucide-react";
import { type ComponentProps, type KeyboardEvent, type RefObject, useRef, useState } from "react";

import { getMinuteOptions, HOUR_OPTIONS, isTimeValue, parseTimeText } from "@/shared/lib/time";
import { useControllableValue } from "@/shared/lib/use-controllable-value";
import { Button } from "@/shared/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@/shared/ui/input-group";
import { ParsedTextInput } from "@/shared/ui/parsed-text-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

const TIME_PLACEHOLDER = "HH:mm";
const DEFAULT_TIME_STEP = 5;

interface TimeColumnProps {
  ref: RefObject<HTMLFieldSetElement | null>;
  label: string;
  options: string[];
  /** The option that matches the value, highlighted. */
  selected: string | undefined;
  /** The option centered on open and reached with Tab: `selected`, else the nearest to now. */
  target: string;
  onSelect: (option: string) => void;
}

// One column of the picker: one Tab stop, ↑↓ move between options.
const TimeColumn = ({ ref, label, options, selected, target, onSelect }: TimeColumnProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLFieldSetElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }
    event.preventDefault();
    const buttons = [...event.currentTarget.querySelectorAll("button")];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const offset = event.key === "ArrowDown" ? 1 : -1;
    buttons[(index + offset + buttons.length) % buttons.length]?.focus();
  };

  return (
    <div className="flex flex-col">
      <span className="border-b px-2 py-1.5 text-center text-muted-foreground text-xs">
        {label}
      </span>
      <fieldset
        ref={ref}
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="relative flex max-h-56 flex-col gap-0.5 overflow-y-auto p-1"
      >
        {options.map((option) => (
          <Button
            key={option}
            variant="ghost"
            size="sm"
            tabIndex={option === target ? 0 : -1}
            aria-pressed={option === selected}
            data-selected={option === selected || undefined}
            onClick={() => onSelect(option)}
            className="tabular-nums data-selected:bg-primary data-selected:text-primary-foreground data-selected:hover:bg-primary/80"
          >
            {option}
          </Button>
        ))}
      </fieldset>
    </div>
  );
};

const centerTarget = (column: HTMLFieldSetElement | null) => {
  const button = column?.querySelector<HTMLElement>("[tabindex='0']");
  if (column && button) {
    column.scrollTop = button.offsetTop - (column.clientHeight - button.offsetHeight) / 2;
  }
  return button ?? null;
};

interface TimePickerButtonProps {
  value: string;
  step: number;
  disabled?: boolean;
  label: string;
  onSelect: (value: string) => void;
}

// The clock button opens two columns: hours and minutes (every `step` minutes).
// Picking an hour keeps the minutes and the picker open; picking a minute keeps the hour and
// closes it. Without a value, an hour pick gets minute "00" and a minute pick gets the current
// hour (the one centered in the hour column). Minutes between steps (14:07) are typed.
const TimePickerButton = ({ value, step, disabled, label, onSelect }: TimePickerButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hourColumnRef = useRef<HTMLFieldSetElement>(null);
  const minuteColumnRef = useRef<HTMLFieldSetElement>(null);
  const minuteOptions = getMinuteOptions(step);
  const [hour, minute] = isTimeValue(value) ? value.split(":") : [undefined, undefined];

  const now = new Date();
  const nearestMinute = (minutes: number) =>
    minuteOptions[Math.min(Math.round(minutes / step), minuteOptions.length - 1)] ?? "00";
  const targetHour = hour ?? String(now.getHours()).padStart(2, "0");
  const targetMinute =
    minute === undefined
      ? nearestMinute(now.getMinutes())
      : minuteOptions.includes(minute)
        ? minute
        : nearestMinute(Number(minute));

  // On open: center the value (or now) in both columns and focus the hour.
  const handleInitialFocus = () => {
    centerTarget(minuteColumnRef.current);
    return centerTarget(hourColumnRef.current);
  };

  const handleMinuteSelect = (nextMinute: string) => {
    onSelect(`${targetHour}:${nextMinute}`);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={<InputGroupButton size="icon-xs" aria-label={label} disabled={disabled} />}
      >
        <ClockIcon />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        initialFocus={handleInitialFocus}
        className="w-auto flex-row gap-0 divide-x p-0"
      >
        <TimeColumn
          ref={hourColumnRef}
          label="시"
          options={HOUR_OPTIONS}
          selected={hour}
          target={targetHour}
          onSelect={(nextHour) => onSelect(`${nextHour}:${minute ?? "00"}`)}
        />
        <TimeColumn
          ref={minuteColumnRef}
          label="분"
          options={minuteOptions}
          selected={minute}
          target={targetMinute}
          onSelect={handleMinuteSelect}
        />
      </PopoverContent>
    </Popover>
  );
};

type TimeInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  /** "HH:mm" (24-hour); `""` means empty; any other text means the typed text is not a time. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Minutes between options in the minute column. */
  step?: number;
};

export const TimeInput = ({
  value,
  defaultValue = "",
  onChange,
  step = DEFAULT_TIME_STEP,
  disabled,
  readOnly,
  placeholder = TIME_PLACEHOLDER,
  className,
  ...props
}: TimeInputProps) => {
  const [currentValue, handleChange] = useControllableValue(value, defaultValue, onChange);

  return (
    <InputGroup data-disabled={disabled || undefined} className={className}>
      <ParsedTextInput
        value={currentValue}
        parse={parseTimeText}
        onValueChange={handleChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <TimePickerButton
          value={currentValue}
          step={step}
          disabled={disabled || readOnly}
          label="시간 선택 열기"
          onSelect={handleChange}
        />
      </InputGroupAddon>
    </InputGroup>
  );
};

export interface TimeRangeValue {
  /** Same rules as `TimeInput`'s value. */
  from: string;
  to: string;
}

export const EMPTY_TIME_RANGE: TimeRangeValue = { from: "", to: "" };

type TimeRangeInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  value?: TimeRangeValue;
  defaultValue?: TimeRangeValue;
  onChange?: (value: TimeRangeValue) => void;
  /** Minutes between options in the minute columns. */
  step?: number;
};

/**
 * `id`, `ref`, and the other input props go to the start time box. Two entries are submitted
 * under one `name`: `FormData.getAll(name)` gives [from, to].
 * The end may be earlier than the start (overnight shifts), so the order is left to the schema.
 */
export const TimeRangeInput = ({
  value,
  defaultValue = EMPTY_TIME_RANGE,
  onChange,
  step = DEFAULT_TIME_STEP,
  name,
  disabled,
  readOnly,
  placeholder = TIME_PLACEHOLDER,
  className,
  onBlur,
  ...props
}: TimeRangeInputProps) => {
  const [currentValue, handleChange] = useControllableValue(value, defaultValue, onChange);
  const boxProps = { name, disabled, readOnly, placeholder, onBlur };

  const handleFromChange = (from: string) => handleChange({ ...currentValue, from });
  const handleToChange = (to: string) => handleChange({ ...currentValue, to });

  return (
    <InputGroup data-disabled={disabled || undefined} className={className}>
      <ParsedTextInput
        value={currentValue.from}
        parse={parseTimeText}
        onValueChange={handleFromChange}
        {...boxProps}
        {...props}
      />
      {/* Each box has its own picker; `order-none` keeps this one next to the start box. */}
      <InputGroupAddon align="inline-end" className="order-none">
        <TimePickerButton
          value={currentValue.from}
          step={step}
          disabled={disabled || readOnly}
          label="시작 시간 선택 열기"
          onSelect={handleFromChange}
        />
      </InputGroupAddon>
      <InputGroupText aria-hidden>~</InputGroupText>
      <ParsedTextInput
        value={currentValue.to}
        parse={parseTimeText}
        onValueChange={handleToChange}
        {...boxProps}
        aria-label="종료 시간"
        aria-invalid={props["aria-invalid"]}
      />
      <InputGroupAddon align="inline-end">
        <TimePickerButton
          value={currentValue.to}
          step={step}
          disabled={disabled || readOnly}
          label="종료 시간 선택 열기"
          onSelect={handleToChange}
        />
      </InputGroupAddon>
    </InputGroup>
  );
};
