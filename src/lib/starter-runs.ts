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

/**
 * What the person said about the product, in the two places they say it:
 * `north_star` on the project row (a goal), and the positioning brief item
 * (who it is for and what it does; FirstRun writes its one line there, never
 * into the goal field). Either may be missing; the prompt names what it has
 * and says when it has neither, rather than templating one as the other.
 */
export function starterRunsPrompt(product: {
  name: string;
  northStar: string | null;
  positioning?: string | null;
}): string {
  const lines = [`Product: ${product.name.trim()}`];
  const north = product.northStar?.trim();
  const positioning = product.positioning?.trim();
  if (positioning) lines.push(`Positioning (who it is for, what it does): ${positioning}`);
  if (north) lines.push(`North star: ${north}`);
  if (!north && !positioning) {
    lines.push(
      "Nothing else is stated yet; infer the likeliest users and goal from the name and say so in each why.",
    );
  }
  return lines.join("\n");
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

/**
 * A refusal kept on the row, so the next read does not ask the model again
 * and the home stops saying "still writing" over a model that said no. A
 * timeout is not a refusal and stores nothing: the next read tries again.
 */
export type StarterRunsRefusal = { reason: string; at: string };

export function readStarterRunsRefusal(stored: unknown): StarterRunsRefusal | null {
  const refused = (stored as { refused?: unknown } | null)?.refused;
  if (!refused || typeof refused !== "object") return null;
  const reason = (refused as { reason?: unknown }).reason;
  const at = (refused as { at?: unknown }).at;
  if (typeof reason !== "string" || !reason.trim() || typeof at !== "string") return null;
  return { reason: reason.trim(), at };
}

/**
 * How long a claim on a product's starter runs is honoured before another
 * writer may take it. A generation is one model call (tens of seconds); a
 * claim older than this belongs to a Worker that was cancelled after its
 * response went out, and the minute sweep takes it over.
 */
export const STARTER_RUNS_CLAIM_MS = 2 * 60 * 1000;

export type StarterRunsState = "ready" | "refused" | "in-flight" | "unclaimed";

/**
 * PURE. What a product's row says about its starter runs, so every reader
 * (the home's read, onboarding, the sweep) makes the same call:
 *
 *   ready       runs are stored; serve them
 *   refused     the model said no, kept on the row; final until cleared
 *   in-flight   nothing stored and a claim younger than STARTER_RUNS_CLAIM_MS;
 *               someone is generating, say pending and do not start another
 *   unclaimed   nothing stored and no claim, or a claim past its time; take it
 */
export function starterRunsState(
  row: { starter_runs: unknown; starter_runs_at: string | null },
  nowMs: number,
): StarterRunsState {
  if (readStoredStarterRuns(row.starter_runs)) return "ready";
  if (readStarterRunsRefusal(row.starter_runs)) return "refused";
  if (row.starter_runs_at) {
    const claimed = Date.parse(row.starter_runs_at);
    if (Number.isFinite(claimed) && nowMs - claimed < STARTER_RUNS_CLAIM_MS) return "in-flight";
  }
  return "unclaimed";
}
