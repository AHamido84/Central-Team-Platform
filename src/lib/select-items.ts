/**
 * Base UI's `Select.Value` only renders the selected item's label
 * automatically when `Select.Root` is given an `items` map — otherwise it
 * falls back to printing the raw value (e.g. "PLANNED" instead of "مخطط
 * له"). Every `<Select>` in this app needs one of these passed to its
 * `items` prop.
 */
export function optionsToSelectItems(
  options: { id: string; label: string }[],
): Record<string, string> {
  return Object.fromEntries(options.map((option) => [option.id, option.label]));
}

export function valuesToSelectItems<T extends string>(
  values: readonly T[],
  labelFor: (value: T) => string,
): Record<string, string> {
  return Object.fromEntries(values.map((value) => [value, labelFor(value)]));
}
