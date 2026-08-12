/**
 * The forecast desk's own wording, kept out of the component file.
 *
 * A .ts module and not an export from ForecastDeskPanel, for the same reason
 * verdict-words.ts is one: a component file that also exports constants breaks
 * Fast Refresh for every component in it (`react-refresh/only-export-components`).
 * It also lets these be tested without rendering anything.
 *
 * Plan: docs/planning/initiatives/forecast-resolution-plan.md
 */

/**
 * The forecast group sits beside the spec-outcome group on one route, and the
 * two answer different questions. The label has to say which question this group
 * is asking or a reader takes them for synonyms. See forecast-words.ts for why
 * the verdict vocabularies must never be mapped onto each other.
 */
export function forecastGroupLabel(n: number): string {
  return `Forecasts due (${n})`;
}

/**
 * Read off the FROZEN horizon, which is what makes an uncapped deferral safe: a
 * forecast can be given more time any number of times and the record still shows
 * how late the call was settled.
 */
export function lateness(daysLate: number): string {
  if (daysLate <= 0) return "due today";
  return `due ${daysLate} day${daysLate === 1 ? "" : "s"} ago`;
}

/**
 * The deferral count is kept because it is signal: a forecast given more time
 * four times is one whose observable never resolved. Hiding it would be the
 * opposite of why the column exists.
 */
export function deferredNote(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) return "given more time once";
  return `given more time ${count} times`;
}
