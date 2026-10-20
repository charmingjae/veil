import { format, isValid, parse } from "date-fns";

// Date values are "YYYY-MM-DD" strings, not `Date` objects, so time zones never shift the day.
const DATE_VALUE_FORMAT = "yyyy-MM-dd";
const COMPACT_DATE_PATTERN = /^(\d{4})(\d{2})(\d{2})$/;
const SEPARATED_DATE_PATTERN = /^(\d{4})\s*[-./]\s*(\d{1,2})\s*[-./]\s*(\d{1,2})\.?$/;

/** The `Date` (local midnight) of a "YYYY-MM-DD" value, or `undefined` if it is not a real date. */
export const toDate = (value: string) => {
  const date = parse(value, DATE_VALUE_FORMAT, new Date());
  return isValid(date) && format(date, DATE_VALUE_FORMAT) === value ? date : undefined;
};

export const toDateValue = (date: Date) => format(date, DATE_VALUE_FORMAT);

/** `true` only for a real date written exactly as "YYYY-MM-DD". */
export const isDateValue = (value: string) => toDate(value) !== undefined;

/**
 * Reads typed text as a date value ("YYYY-MM-DD"), or `null` if it is not a real date.
 * Accepts `20261016`, `2026-10-16`, `2026.10.16`, `2026/10/16`, `2026. 10. 16.`, `2026-1-5`.
 */
export const parseDateText = (text: string) => {
  const trimmed = text.trim();
  const match = COMPACT_DATE_PATTERN.exec(trimmed) ?? SEPARATED_DATE_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  const value = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return isDateValue(value) ? value : null;
};
