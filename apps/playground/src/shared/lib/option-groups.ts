/** Options shown under one heading in `Autocomplete` and `Select`. Extend it to add fields. */
export interface OptionGroup<T> {
  label: string;
  options: T[];
}

export const isOptionGroups = <T, G>(
  options: T[] | (G & OptionGroup<T>)[],
): options is (G & OptionGroup<T>)[] => {
  const first: unknown = options[0];
  return (
    typeof first === "object" &&
    first !== null &&
    "options" in first &&
    Array.isArray(first.options)
  );
};

export const flattenOptions = <T, G>(options: T[] | (G & OptionGroup<T>)[]): T[] => {
  return isOptionGroups<T, G>(options) ? options.flatMap((group) => group.options) : options;
};
