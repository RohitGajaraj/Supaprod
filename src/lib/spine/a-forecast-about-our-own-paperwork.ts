/**
 * A FORECAST ABOUT SUPAPROD'S OWN PAPERWORK IS NOT A FORECAST ABOUT THE PRODUCT.
 *
 * ── WHAT IS ON THE RECORD (measured 2026-09-03, non-sample, ungraded) ─────
 * Eight of the forecasts this product has ever recorded say things like:
 *
 *   "prd.get will return status='approved' and design_gate_status='cleared'"
 *   "workspace.search returns >= 3 signals with source_kind='zendesk'"
 *   "sources.status shows active_scout_targets > 0"
 *
 * Every one of those grades itself. `prd.get` returns approved because somebody
 * pressed approve in this product; `workspace.search` returns three signals
 * because this product ingested three signals. The forecast is a statement about
 * whether Supaprod's own tables changed, and it can be made true by using
 * Supaprod. Nothing about the customer's product is being predicted.
 *
 * ── WHY THIS MATTERS MORE THAN A DATA-QUALITY PROBLEM ─────────────────────
 * The forecast captured at decision time is the thing this product says is its
 * moat. A forecast that grades itself would make the record LOOK like the moat
 * working while measuring nothing, and it would do it at exactly the moment the
 * loop first closes -- the first real verdicts this grader ever produces.
 *
 * R-31 states the rule going forward: the forecast is about the user's product
 * and the observable is never a Supaprod table. This file is how that rule is
 * enforced on what is already there, and it is a REFUSAL rather than a deletion
 * (founder, 2026-09-02): the eight are graded `inconclusive` with a sentence
 * saying why, on their own Learn tab and Start row, through the platform's own
 * path. A record that says "we could not grade this, and here is why" is worth
 * more than one with a gap where the answer should be.
 *
 * ── WHY A TOOL NAME IS THE STRONG SIGNAL AND A TABLE NAME IS NOT ──────────
 * `prd.get` and `workspace.search` are OUR vocabulary: dotted, registered, and
 * meaningless in a customer's product. A bare word like `decisions` or `sources`
 * is not -- a homeowner-services company may perfectly well forecast something
 * about its own decisions table, and refusing that would be this file inventing
 * a problem. So a registered tool name is decisive on its own, and a table name
 * counts only in the `public.`-qualified or `supaprod` forms nobody writes by
 * accident.
 *
 * The tool names are PASSED IN rather than imported: `TOOL_REGISTRY` lives in a
 * `.server.ts` module and this predicate has to run on the Decide tab too. One
 * source of truth, handed across the boundary, instead of a second list here
 * that would drift the first time a tool is renamed.
 */

/**
 * Tables that are Supaprod's own record-keeping and could not be a customer's.
 * Deliberately short and deliberately qualified: see the header on why a bare
 * `decisions` is not on this list.
 */
const OUR_TABLES = [
  "spine_tracks",
  "spine_track_members",
  "agent_runs",
  "agent_approvals",
  "track_drives",
  "studio_changesets",
  "forecast_resolution_log",
  "stage_events",
  "tool_calls",
] as const;

export type PaperworkVerdict = {
  /** True when this observable can be satisfied by using Supaprod itself. */
  ourOwn: boolean;
  /**
   * The exact thing that decided it, so the sentence can name it. "It names
   * prd.get" is something a person can act on; "it is self-referential" is not.
   */
  named: string | null;
};

/**
 * Is this observable a statement about our paperwork rather than their product?
 *
 * `toolNames` is the registry's own key set. An empty list is honest and is
 * handled: without it only the table forms below can decide, and the answer is
 * weaker rather than wrong.
 */
export function aboutOurOwnPaperwork(
  observable: string | null | undefined,
  toolNames: readonly string[] = [],
): PaperworkVerdict {
  const text = typeof observable === "string" ? observable : "";
  if (!text.trim()) return { ourOwn: false, named: null };
  const lower = text.toLowerCase();

  /*
   * Longest first, so `studio.pr.merge` is reported rather than `studio.pr`
   * where both are registered. The name in the sentence should be the most
   * specific true one.
   */
  const tools = [...toolNames].sort((a, b) => b.length - a.length);
  for (const tool of tools) {
    if (!tool || !tool.includes(".")) continue;
    /*
     * Bounded on both sides, because `prd.get` must not match inside
     * `theirprd.getter`. A dot is a word character to `\b`, so the boundary is
     * written out rather than borrowed.
     */
    const at = lower.indexOf(tool.toLowerCase());
    if (at === -1) continue;
    const before = at === 0 ? "" : lower[at - 1]!;
    const after = lower[at + tool.length] ?? "";
    const wordish = (c: string) => /[a-z0-9_.]/.test(c);
    if (!wordish(before) && !wordish(after)) return { ourOwn: true, named: tool };
  }

  for (const table of OUR_TABLES) {
    // Qualified forms only. See the header: a bare `agent_runs` in a customer's
    // own schema is their business, and `public.agent_runs` is ours.
    for (const form of [`public.${table}`, `supaprod.${table}`]) {
      if (lower.includes(form)) return { ourOwn: true, named: form };
    }
  }
  if (/\bsupaprod\b/.test(lower)) return { ourOwn: true, named: "Supaprod" };

  return { ourOwn: false, named: null };
}

/**
 * WHY THIS ONE CANNOT BE GRADED, in the words the founder settled on.
 *
 * One sentence, and it names the thing it found. A rationale that says only
 * "inconclusive" tells a person nothing about what to write differently next
 * time, and next time is the only thing this sentence can still change.
 */
export function whyItCannotBeGraded(named: string | null): string {
  const base =
    "This forecast was about Supaprod's own paperwork, not your product, so it cannot be graded.";
  return named ? `${base} It is measured by ${named}, which is ours rather than yours.` : base;
}

/** What a forecast this rule refuses is settled as. Never `held` or `missed`:
 *  both would claim we measured something, and we did not. */
export const CANNOT_BE_GRADED = "inconclusive" as const;
