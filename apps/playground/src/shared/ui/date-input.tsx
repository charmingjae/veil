"use client";

import { CalendarIcon } from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";
import type { DateRange } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { parseDateText, toDate, toDateValue } from "@/shared/lib/date";
import { useControllableValue } from "@/shared/lib/use-controllable-value";
import { Calendar } from "@/shared/ui/calendar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "@/shared/ui/input-group";
import { ParsedTextInput } from "@/shared/ui/parsed-text-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

const DATE_PLACEHOLDER = "YYYY-MM-DD";
// The year dropdown otherwise stops at the current year, which rules out due dates next year.
const CALENDAR_PROPS = {
  locale: ko,
  captionLayout: "dropdown",
  startMonth: new Date(1900, 0),
  endMonth: new Date(new Date().getFullYear() + 10, 11),
  autoFocus: true,
} as const;

interface CalendarPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  /** The calendar. */
  children: ReactNode;
}

// The calendar button at the end of the box and the popover it opens.
const CalendarPopover = ({ open, onOpenChange, disabled, children }: CalendarPopoverProps) => {
  return (
    <InputGroupAddon align="inline-end">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={<InputGroupButton size="icon-xs" aria-label="달력 열기" disabled={disabled} />}
        >
          <CalendarIcon />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          {children}
        </PopoverContent>
      </Popover>
    </InputGroupAddon>
  );
};

type DateInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  /** "YYYY-MM-DD"; `""` means empty; any other text means the typed text is not a date. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

export const DateInput = ({
  value,
  defaultValue = "",
  onChange,
  disabled,
  readOnly,
  placeholder = DATE_PLACEHOLDER,
  className,
  ...props
}: DateInputProps) => {
  const [currentValue, handleChange] = useControllableValue(value, defaultValue, onChange);
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = toDate(currentValue);

  const handleSelect = (date: Date) => {
    handleChange(toDateValue(date));
    setIsOpen(false);
  };

  return (
    <InputGroup data-disabled={disabled || undefined} className={className}>
      <ParsedTextInput
        value={currentValue}
        parse={parseDateText}
        onValueChange={handleChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        {...props}
      />
      <CalendarPopover open={isOpen} onOpenChange={setIsOpen} disabled={disabled || readOnly}>
        <Calendar
          {...CALENDAR_PROPS}
          mode="single"
          required
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={handleSelect}
        />
      </CalendarPopover>
    </InputGroup>
  );
};

export interface DateRangeValue {
  /** Same rules as `DateInput`'s value. */
  from: string;
  to: string;
}

export const EMPTY_DATE_RANGE: DateRangeValue = { from: "", to: "" };

type DateRangeInputProps = Omit<
  ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onChange?: (value: DateRangeValue) => void;
};

/**
 * `id`, `ref`, and the other input props go to the start date box. Two entries are submitted
 * under one `name`: `FormData.getAll(name)` gives [from, to].
 */
export const DateRangeInput = ({
  value,
  defaultValue = EMPTY_DATE_RANGE,
  onChange,
  name,
  disabled,
  readOnly,
  placeholder = DATE_PLACEHOLDER,
  className,
  onBlur,
  ...props
}: DateRangeInputProps) => {
  const [currentValue, handleChange] = useControllableValue(value, defaultValue, onChange);
  const [isOpen, setIsOpen] = useState(false);
  // The first click in the calendar picks the start; the value changes only after the second.
  const [pendingRange, setPendingRange] = useState<DateRange>();
  const fromDate = toDate(currentValue.from);
  const selectedRange =
    pendingRange ?? (fromDate && { from: fromDate, to: toDate(currentValue.to) });
  const boxProps = { name, disabled, readOnly, placeholder, onBlur };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setPendingRange(undefined);
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range.to) {
      handleChange({ from: toDateValue(range.from), to: toDateValue(range.to) });
      handleOpenChange(false);
      return;
    }
    setPendingRange(range);
  };

  return (
    <InputGroup data-disabled={disabled || undefined} className={className}>
      <ParsedTextInput
        value={currentValue.from}
        parse={parseDateText}
        onValueChange={(from) => handleChange({ ...currentValue, from })}
        {...boxProps}
        {...props}
      />
      <InputGroupText aria-hidden>~</InputGroupText>
      <ParsedTextInput
        value={currentValue.to}
        parse={parseDateText}
        onValueChange={(to) => handleChange({ ...currentValue, to })}
        {...boxProps}
        aria-label="종료일"
        aria-invalid={props["aria-invalid"]}
      />
      <CalendarPopover
        open={isOpen}
        onOpenChange={handleOpenChange}
        disabled={disabled || readOnly}
      >
        <Calendar
          {...CALENDAR_PROPS}
          mode="range"
          resetOnSelect
          numberOfMonths={2}
          selected={selectedRange}
          defaultMonth={fromDate}
          onSelect={handleSelect}
        />
      </CalendarPopover>
    </InputGroup>
  );
};
