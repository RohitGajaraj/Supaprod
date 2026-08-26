/**
 * WHAT A SPEC PROMISES, AND WHAT IT DELIBERATELY DOES NOT.
 *
 * ── THE MEASURED REASON THIS EXISTS ───────────────────────────────────────
 * `prds.contract` is where a spec states its intent, how it will be judged and
 * what it is NOT doing. Measured on production 2026-08-27: of 115 specs, **2
 * carry any contract key at all** and the other 113 hold an empty object. So on
 * 98% of the specs in this product, nothing on the record says what the work is
 * for, how anyone would know it worked, or where its edges are, and no surface
 * has ever said so.
 *
 * The Plan pane rendered `body_md` and nothing else, so the contract was
 * invisible whether it was there or not. A reader could not tell a bounded spec
 * from an unbounded one.
 *
 * ── NON-GOALS GET THE SAME WEIGHT AS THE REST, WHICH IS THE RULING ────────
 * SESSION-1's brief: *"the spec section by section as it is written, non-goals
 * with equal weight"*. They are the half that stops the wrong thing being built
 * correctly, and the half every template drops to a footnote.
 *
 * ── AND AN ABSENT CONTRACT IS STATED, NOT HIDDEN ──────────────────────────
 * The tempting version renders the sections it finds and nothing where it finds
 * none, which on this data means 113 specs look exactly like a spec with no
 * edges is normal. Naming the absence is the whole value: a person about to let
 * Build spend against this spec is entitled to know that nothing bounds it.
 */

export type SpecContract = {
  intent: string | null;
  /** How anyone would know it worked. Stored as a list. */
  measures: string[];
  /** What this deliberately does not do. */
  nonGoals: string[];
  /** True when the row carries no contract clauses at all. */
  empty: boolean;
};

function list(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function text(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Read the three clauses a person needs, tolerating every other shape.
 *
 * `contract` is a jsonb column, so anything can be in it. Nothing here coerces:
 * a clause that is not a string, or a list that is not a list, comes out absent
 * rather than as a rendered `[object Object]`.
 */
export function specContract(contract: unknown): SpecContract {
  const c = (contract ?? {}) as Record<string, unknown>;
  const intent = text(c.intent);
  const measures = list(c.success_metrics);
  const nonGoals = list(c.non_goals);
  return {
    intent,
    measures,
    nonGoals,
    empty: !intent && measures.length === 0 && nonGoals.length === 0,
  };
}

/** Said when the row bounds nothing. Names what is missing, not that it is bad. */
export const NO_CONTRACT =
  "This spec carries no outcome contract, so nothing on the record says what it is for, how anyone would know it worked, or what it is deliberately not doing.";

/** Said when the contract exists but drew no edges. The commonest half-state. */
export const NO_NON_GOALS =
  "No non-goals were written, so nothing here says what this spec leaves out.";
