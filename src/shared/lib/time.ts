// Time values are 24-hour "HH:mm" strings.
const TIME_VALUE_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const SEPARATED_TIME_PATTERN = /^(\d{1,2})\s*[:.]\s*(\d{2})$/;
const COMPACT_TIME_PATTERN = /^(\d{1,2})(\d{2})$/;
const HOUR_ONLY_PATTERN = /^(\d{1,2})$/;

/** `true` only for a real time written exactly as "HH:mm" (00:00–23:59). */
export const isTimeValue = (value: string) => TIME_VALUE_PATTERN.test(value);

/**
 * Reads typed text as a time value ("HH:mm"), or `null` if it is not a real time.
 * Accepts `14:30`, `14.30`, `1430`, `930` (09:30), `9:30`, `14` (14:00).
 */
export const parseTimeText = (text: string) => {
  const trimmed = text.trim();
  const hourOnly = HOUR_ONLY_PATTERN.exec(trimmed);
  const match = hourOnly
    ? [trimmed, hourOnly[1], "00"]
    : (SEPARATED_TIME_PATTERN.exec(trimmed) ?? COMPACT_TIME_PATTERN.exec(trimmed));
  if (!match) {
    return null;
  }
  const [, hour, minute] = match;
  const value = `${hour.padStart(2, "0")}:${minute}`;
  return isTimeValue(value) ? value : null;
};

/** "00" to "23". */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

/** "00", "05", ... every `step` minutes (`step` should divide 60). */
export const getMinuteOptions = (step: number) => {
  return Array.from({ length: Math.ceil(60 / step) }, (_, index) =>
    String(index * step).padStart(2, "0"),
  );
};
