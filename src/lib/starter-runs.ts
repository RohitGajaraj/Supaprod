/**
 * A FRESH PRODUCT'S FIRST THREE RUNS, FROM WHAT THE PERSON SAID ABOUT IT.
 *
 * After FirstRun the home is an invitation over nothing: the example jobs draw
 * only once evidence has arrived, and none has. The first thing the machine
 * can do for a new product is read its name and north star and offer three
 * runs worth starting, each with one line of why. This module is the pure
 * half: the prompt, and the reading of what the model returns, which admits
 * at most three well-formed sentences and invents none.
 */

export type StarterRun = { sentence: string; why: string };

export const STARTER_RUNS_MAX = 3;
const SENTENCE_MAX = 140;
const WHY_MAX = 160;

export const STARTER_RUNS_SYSTEM = [
  "You write the first three pieces of work a product manager should hand to an",
  "agentic product team, for a product you know only by its name and its north star.",
  "Each is ONE sentence the person could type to start a run: a concrete question",
  "to answer or a change to make, about THEIR product and its users, never about",
  "the tool doing the work. No preamble, no marketing, no numbers you do not have.",
  'Answer as JSON only: {"runs":[{"sentence":"...","why":"..."}]} with at most',
  'three entries; "why" is one plain sentence saying what answering it would change.',
].join(" ");

export function starterRunsPrompt(product: { name: string; northStar: string | null }): string {
  const north = product.northStar?.trim();
  return north
    ? `Product: ${product.name.trim()}\nNorth star: ${north}`
    : `Product: ${product.name.trim()}\nNorth star: not stated yet; infer the likeliest from the name and say so in each why.`;
}

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/**
 * What the model returned, read strictly: an object with a `runs` array, each
 * entry a sentence and a why, both non-empty strings. Anything else is dropped
 * rather than repaired, and the list is cut at three. An empty result is the
 * honest answer for a model that returned nothing usable.
 */
export function parseStarterRuns(raw: unknown): StarterRun[] {
  const runs = (raw as { runs?: unknown } | null)?.runs;
  if (!Array.isArray(runs)) return [];
  const out: StarterRun[] = [];
  for (const r of runs) {
    if (!r || typeof r !== "object") continue;
    const sentence = clean((r as { sentence?: unknown }).sentence, SENTENCE_MAX);
    const why = clean((r as { why?: unknown }).why, WHY_MAX);
    if (!sentence || !why) continue;
    out.push({ sentence, why });
    if (out.length === STARTER_RUNS_MAX) break;
  }
  return out;
}

/** The stored shape on `projects.starter_runs`, read back as strictly as the model's answer. */
export function readStoredStarterRuns(stored: unknown): StarterRun[] | null {
  if (!stored || typeof stored !== "object") return null;
  const runs = parseStarterRuns(stored);
  return runs.length > 0 ? runs : null;
}
