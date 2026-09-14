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
/**
 * ── 140 WAS TWICE WHAT THE CARD CAN HOLD (2026-09-14) ─────────────────────
 *
 * Read on the served entry, on the first screen a fresh workspace ever shows,
 * all three cards rendered a clipped sentence ending in an ellipsis:
 *
 *   "Who are the people most likely to need step-by-step guidance while
 *    walking to a new destination for the first time, and what frustrates
 *    the…"
 *
 * That is the whole region's job failing. These cards exist to teach a person
 * what a sentence this product can act on LOOKS like, and a truncated
 * subordinate clause teaches the opposite: it reads as an essay prompt, it has
 * no visible verb to copy, and it ends mid-word.
 *
 * The bound is now what a `PickCard` actually holds at three lines in the
 * grid's column width, which is the constraint the number should always have
 * come from. The prompt below states it too, so the model aims at the bound
 * rather than being cut at it -- a cap that only truncates produces a clipped
 * sentence every time, which is exactly what happened.
 */
const SENTENCE_MAX = 72;
const WHY_MAX = 160;

export const STARTER_RUNS_SYSTEM = [
  "You write the first three pieces of work a product manager should hand to an",
  "agentic product team, for a product you know only by its name and its north star.",
  /*
   * ── WHAT CHANGED, AND WHY THE OLD CLAUSE PRODUCED ESSAYS ────────────────
   *
   * This read: "a concrete question to answer or a change to make". The
   * question half is what the model reached for every time, and a question
   * about users has no natural length, so all three answers ran past the bound
   * and were clipped. Measured on the served product: three of three.
   *
   * A run's sentence is an OUTCOME. The route picker downstream already has a
   * shape for genuine discovery work, so a person who wants a question asked
   * still gets one; what this region has to demonstrate is the short, plain,
   * checkable sentence that is the product's actual input. The length is stated
   * as a hard limit and the shape is given by example, because "be concise"
   * moves nothing and a worked example moves everything.
   */
  `Each is ONE short sentence the person could type to start a run: at most ${SENTENCE_MAX}`,
  "characters, stating an outcome for THEIR product in plain words. Lead with a verb",
  "where you can. Never a question, never a preamble, never marketing, never a number",
  "you do not have, and never about the tool doing the work. Good shapes:",
  '"Cut the sign-up form from nine fields to four", "Let people undo a delete",',
  '"Password reset emails are going to spam".',
  'Answer as JSON only: {"runs":[{"sentence":"...","why":"..."}]} with at most',
  'three entries; "why" is one plain sentence saying what doing it would change.',
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

/**
 * The stored shape on `projects.starter_runs`, read back as strictly as the
 * model's answer.
 *
 * ── A ROW WRITTEN UNDER THE OLD BOUND IS STALE, NOT READY (2026-09-14) ────
 *
 * `SENTENCE_MAX` dropped from 140 to what a card can actually hold. Every row
 * already on the table was written under the old bound, and `clean()` truncates
 * rather than rejecting, so without this those rows would keep rendering a
 * clipped sentence with an ellipsis forever -- the exact defect the new bound
 * exists to remove, preserved by the fix for it.
 *
 * Returning null here makes `starterRunsState` fall through to `unclaimed`
 * (nothing stored, and the claim on these rows is months old), so the minute
 * sweep regenerates them against the new prompt. THAT IS THE WHOLE MECHANISM:
 * no migration, no manual reset, and no need for database access this session
 * does not have. A row heals the first time anybody looks at it.
 *
 * It is keyed on the RAW length, before `clean()`, because after truncation a
 * clipped 140-character sentence and a naturally short one are indistinguishable
 * -- both are within bound. Reading the stored value is the only place the
 * original length still exists.
 */
export function readStoredStarterRuns(stored: unknown): StarterRun[] | null {
  if (!stored || typeof stored !== "object") return null;
  const raw = (stored as { runs?: unknown }).runs;
  if (Array.isArray(raw)) {
    const clipped = raw.some((r) => {
      const s = (r as { sentence?: unknown } | null)?.sentence;
      return typeof s === "string" && s.replace(/\s+/g, " ").trim().length > SENTENCE_MAX;
    });
    if (clipped) return null;
  }
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
