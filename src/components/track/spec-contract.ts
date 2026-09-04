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

import { isStanding, type MetricClause } from "@/lib/spine/what-would-measure-this";

export type SpecContract = {
  intent: string | null;
  /** How anyone would know it worked. Stored as a list. */
  measures: string[];
  /**
   * The same standing clauses, unflattened, so a caller can ask what would
   * MEASURE each one. `measures` keeps its shape for the callers that only
   * render sentences; anything asking about oracles needs the objects, and
   * re-parsing the jsonb a second time in the component is how two readers of
   * one column drift apart (see the note on `list`).
   */
  metrics: MetricClause[];
  /** What this deliberately does not do. */
  nonGoals: string[];
  /** True when the row carries no contract clauses at all. */
  empty: boolean;
};

/**
 * A clause list, in BOTH shapes the column actually holds.
 *
 * MEASURED 2026-09-04 (P-137): this kept only strings, and of the 16 specs in
 * production carrying a contract, **16 store `success_metrics` as an array of
 * OBJECTS and none store strings.** So `measures` came back empty for every
 * spec that has ever existed, and `ArtifactPane` -- the run screen pane whose
 * whole job is to say how anyone would know the work worked -- rendered none
 * of them, silently, on all of them. `OutcomeContractPanel` on the product
 * surface reads the object shape correctly, so two readers of one column
 * disagreed and only the other one was right.
 *
 * The string branch is kept rather than replaced: it costs one line, and a
 * reader that only understands today's shape is how this happened.
 */
function list(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return x.trim();
      if (typeof x === "object" && x !== null) {
        const clause = x as Record<string, unknown>;
        // A superseded clause is history, not a promise, and must not be
        // rendered beside the standing ones as though it still bound anything.
        if ("status" in clause && clause.status !== "standing") return "";
        return typeof clause.text === "string" ? clause.text.trim() : "";
      }
      return "";
    })
    .filter((x) => x.length > 0);
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
  const metrics = Array.isArray(c.success_metrics)
    ? c.success_metrics.filter(
        (m): m is MetricClause =>
          typeof m === "object" &&
          m !== null &&
          isStanding(m as MetricClause) &&
          typeof (m as MetricClause).text === "string",
      )
    : [];
  return {
    intent,
    measures,
    metrics,
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

/**
 * WHETHER THE SPEC SAYS IT SOMEWHERE ELSE, BEFORE THE SCREEN SAYS NOBODY DID.
 *
 * -- WHAT WAS ON SCREEN --------------------------------------------------
 * `SpecPromise` renders `NO_CONTRACT` whenever the `contract` column carries
 * no intent, no measures and no non-goals, and the sentence it renders says
 * "nothing on the record says what it is for, how anyone would know it worked,
 * or what it is deliberately not doing."
 *
 * The next element on the pane is `<Prose markdown>{prd.body_md}</Prose>`.
 *
 * Measured over the 119 specs in this database: 117 have an empty contract, and
 * 117 of those 117 have a body. 94 of them carry a line-anchored success
 * metrics or acceptance criteria heading and 20 carry a non-goals heading.
 * Only 21 mention neither anywhere. So the sentence was false on 96 of 117, and
 * its disproof was rendered directly underneath it.
 *
 * That is the same defect as the empty upstream link and the zero cost total: a
 * narrow lookup coming back empty, and a surface reporting it as a fact about
 * the record rather than a fact about the column it read.
 *
 * -- DETECT, DO NOT EXTRACT ----------------------------------------------
 * This deliberately does NOT parse the sections out and render them as a
 * contract. Extraction would put text on screen under a heading the author
 * never agreed to, and a wrong parse would then be a wrong promise. All the
 * sentence needs is whether the document HAS the section, and if that is wrong
 * the cost is a softer line rather than an invented one.
 *
 * Line-anchored for the same reason. `## Non-Goals`, `**Non-Goals**` and
 * `Non-goals:` all count; a passing mention inside a paragraph does not, which
 * is the difference between a spec that sets its boundaries out and one that
 * merely uses the word. Two of the 96 are exactly that case.
 *
 * -- THE COLUMN BEING EMPTY STILL MATTERS AND THE LINE STILL SAYS SO ------
 * The contract is what Build is measured against and what Ship reads. A body
 * that explains itself in prose is not a substitute for that, and 0 of the 117
 * have ever been migrated (`contract_migrated_at` is null on every one). So the
 * line keeps the weight and drops the false half: it says nothing is filled in,
 * and then points at where the answer actually is.
 */

/** Whether the spec body sets these out under a heading of its own. */
export type ContractInBody = { metrics: boolean; nonGoals: boolean };

const NON_GOALS_HEADING = /^[ \t]*[#*>_-]{0,4}[ \t]*non[- ]?goals?\b/im;
const METRICS_HEADING =
  /^[ \t]*[#*>_-]{0,4}[ \t]*(success metrics?|success criteria|acceptance criteria|how we'?ll know)\b/im;

/** What the spec body sets out under its own headings. */
export function contractInBody(body: string | null | undefined): ContractInBody {
  const text = typeof body === "string" ? body : "";
  return {
    metrics: METRICS_HEADING.test(text),
    nonGoals: NON_GOALS_HEADING.test(text),
  };
}

/**
 * What to say when the contract is empty, which depends on whether it is true
 * that nobody wrote this down.
 */
export function noContractLine(body: string | null | undefined): string {
  const found = contractInBody(body);
  if (!found.metrics && !found.nonGoals) return NO_CONTRACT;

  const says =
    found.metrics && found.nonGoals
      ? "how anyone would know it worked, and what it deliberately leaves out"
      : found.metrics
        ? "how anyone would know it worked"
        : "what it deliberately leaves out";

  return `No outcome contract is filled in here, so there is nothing bounded for Build to be measured against. The spec below sets out ${says}, in its own words.`;
}
