import { useState } from "react";

/**
 * The value of an input that works both controlled (`value` + `onChange`) and uncontrolled
 * (`defaultValue`): the input itself keeps it when `value` is not given, so its own controls
 * (clear button, calendar, chips) can change it in every mode.
 */
export const useControllableValue = <T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;

  const setValue = (nextValue: T) => {
    if (!isControlled) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
  };

  return [currentValue, setValue] as const;
};
