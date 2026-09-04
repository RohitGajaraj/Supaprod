/**
 * WHETHER A SUCCESS METRIC HAS SOMETHING THAT COULD PRODUCE A NUMBER.
 *
 * ── THE MEASURED REASON THIS IS NOT `oracle_ref !== null` ─────────────────
 * The first live release's spec (`f2aa82f1`) states two outcome metrics:
 * tablet checkout completion from 67 percent, and abandonment on the Shipping
 * Address screen from 41 percent. Measured on production 2026-09-04, BOTH
 * carry `oracle_kind: "eval"` and an `oracle_ref` that RESOLVES -- `a653a20b`
 * and `6dbb1c54` are real `eval_cases` rows in a real suite. So every check
 * shaped "does this metric name a source?" answers yes, twice, and is wrong
 * twice:
 *
 *   eval_case_results for a653a20b .......... 0
 *   eval_case_results for 6dbb1c54 .......... 0
 *   product_analytics for the workspace ..... 0 rows
 *   connections ............................. github, linear, salesforce, slack
 *
 * Neither case has ever produced a reading, and a spec-acceptance eval could
 * not observe a customer's live checkout even if it ran: it asserts that OUR
 * build satisfies the clause, not that THEIR users behaved differently. So a
 * reference that resolves is standing in for a fact that is true, which is the
 * defect family this repo keeps finding ([[F-190]], [[F-192]], [[F-196]]).
 *
 * The question here is therefore **"could this produce a reading about the
 * customer's product?"** and never "is a field populated?".
 *
 * ── WHY `ci` AND `uat` ARE NOT SOURCES, THOUGH THEY ARE REAL ──────────────
 * Both are honest oracles for a DIFFERENT question. `ci` says our tests
 * passed; `uat` says a person checked the behaviour is there. Neither observes
 * a rate among the customer's users, which is what an outcome metric claims.
 * Calling them sources would let Learn report a graded outcome off a green
 * build, which is precisely the shrug this packet exists to remove.
 *
 * A clause carrying `ci` or `uat` is not a defect and is not scolded. It is
 * reported as what it is: an acceptance check, with no reading behind it.
 *
 * ── A HAND-RECORDED READING COUNTS, AND SAYS SO ───────────────────────────
 * A person's own number is a legitimate source when nothing is connected --
 * the founder reads Relay's dashboard and types 71. It is never laundered into
 * looking automatic: it carries who recorded it and when, and every surface
 * that shows it says a person recorded it. An honest hand number beats an
 * absent one, and beats a connected-looking one that never ran.
 */

/** The oracle vocabulary already in `prds.contract`. */
export type OracleKind = "eval" | "ci" | "uat" | "unverifiable";

/**
 * A number a person typed in, stored on the clause itself in `prds.contract`
 * rather than in a table of its own. Deliberate: the reading is only ever
 * meaningful beside the metric it reads, it travels with the contract through
 * every copy and revision the contract already gets, and it needs no migration
 * to exist. `at` and `by` are not optional -- a reading nobody can attribute
 * is the thing this file refuses to let a metric look measured by.
 */
export type HandReading = {
  readonly value: number;
  readonly at: string;
  readonly by: string;
  readonly note?: string;
};

/** One clause of `contract.success_metrics`, as it is actually stored. */
export type MetricClause = {
  readonly id?: unknown;
  readonly text?: unknown;
  readonly status?: unknown;
  readonly oracle_kind?: unknown;
  readonly oracle_ref?: unknown;
  readonly readings?: unknown;
};

/**
 * What is behind a metric. Ordered from "a number exists" to "nothing does",
 * because that is the order a reader cares about and the order Learn sorts by.
 */
export type SourceState =
  /** A person's number is on the record. Always attributed, never disguised. */
  | { readonly kind: "hand"; readonly reading: HandReading }
  /** An oracle that has actually produced readings. */
  | { readonly kind: "connected"; readonly oracle: OracleKind; readonly ref: string }
  /** An oracle is named and resolves, but has never produced a reading. */
  | { readonly kind: "named-never-run"; readonly oracle: OracleKind; readonly ref: string }
  /** An acceptance check, honest about a different question. */
  | { readonly kind: "acceptance-only"; readonly oracle: "ci" | "uat" }
  /** The spec itself says this cannot be verified. */
  | { readonly kind: "declared-unverifiable" }
  /** Nothing is named at all. */
  | { readonly kind: "none" };

/** Only a standing clause is a promise; a superseded one is history. */
export function isStanding(clause: MetricClause): boolean {
  return clause.status === "standing";
}

function readingOf(v: unknown): HandReading | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  // The newest attributable reading wins. A reading missing `at` or `by` is
  // skipped rather than shown: see the type's note on attribution.
  const usable = v.filter((r): r is HandReading => {
    if (typeof r !== "object" || r === null) return false;
    const c = r as Record<string, unknown>;
    return (
      typeof c.value === "number" &&
      Number.isFinite(c.value) &&
      typeof c.at === "string" &&
      c.at.trim().length > 0 &&
      typeof c.by === "string" &&
      c.by.trim().length > 0
    );
  });
  if (usable.length === 0) return null;
  return usable.reduce((newest, r) => (r.at > newest.at ? r : newest));
}

function oracleOf(v: unknown): OracleKind | null {
  return v === "eval" || v === "ci" || v === "uat" || v === "unverifiable" ? v : null;
}

function refOf(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/**
 * What would measure this clause.
 *
 * `refsWithReadings` is the set of `oracle_ref`s that have at least one
 * recorded result, passed in rather than queried: this predicate runs on the
 * run screen, on Outcomes and inside the grader, and only the caller knows
 * which of those can reach a database. A caller that cannot check readings
 * passes an empty set, and every eval clause reports `named-never-run` --
 * which is the honest answer for a reader who does not know, and never the
 * optimistic one.
 */
export function whatWouldMeasure(
  clause: MetricClause,
  refsWithReadings: ReadonlySet<string>,
): SourceState {
  const hand = readingOf(clause.readings);
  if (hand) return { kind: "hand", reading: hand };

  const oracle = oracleOf(clause.oracle_kind);
  if (!oracle) return { kind: "none" };
  if (oracle === "unverifiable") return { kind: "declared-unverifiable" };
  if (oracle === "ci" || oracle === "uat") return { kind: "acceptance-only", oracle };

  const ref = refOf(clause.oracle_ref);
  // An eval clause with no ref names a kind and nothing to point at.
  if (!ref) return { kind: "none" };
  return refsWithReadings.has(ref)
    ? { kind: "connected", oracle, ref }
    : { kind: "named-never-run", oracle, ref };
}

/**
 * Whether a reading could be had. The single question the grader asks, and the
 * reason it is a function rather than an inlined `=== "connected"`: two states
 * qualify and the pair is easy to get wrong in a hurry.
 */
export function canProduceAReading(state: SourceState): boolean {
  return state.kind === "hand" || state.kind === "connected";
}

/**
 * What a reader is told, in the product's own voice. Names what is there, not
 * what is wrong: a clause carrying an acceptance check is not being scolded for
 * carrying one.
 */
export function metricSourceLine(state: SourceState): string {
  switch (state.kind) {
    case "hand":
      return `A person recorded ${state.reading.value} on ${state.reading.at.slice(0, 10)}.`;
    case "connected":
      return "A connected source has readings for this.";
    case "named-never-run":
      return "This names a spec-acceptance check that has never produced a reading, so there is no number behind it.";
    case "acceptance-only":
      return state.oracle === "ci"
        ? "This is checked by the build, which says our tests passed, not how people behaved."
        : "This is checked by hand against the built thing, which says the behaviour is there, not how people behaved.";
    case "declared-unverifiable":
      return "The spec says this one cannot be verified.";
    case "none":
      return "Nothing is connected that could measure this.";
  }
}

/**
 * The one line Learn leads with. Said in the negative only when it is true of
 * every metric, because "none of them" and "one of the two" are different
 * facts and a reader deciding whether to connect something needs the
 * difference.
 */
export function whatLearnCanMeasure(states: readonly SourceState[]): string {
  const total = states.length;
  if (total === 0) return "This spec states no success metrics, so there is nothing to measure.";
  const measurable = states.filter(canProduceAReading).length;
  if (measurable === 0) {
    return total === 1
      ? "The one success metric on this spec has no source that could produce a number, so this release cannot be graded yet."
      : `None of the ${total} success metrics on this spec have a source that could produce a number, so this release cannot be graded yet.`;
  }
  if (measurable === total) {
    return total === 1
      ? "The one success metric on this spec has a source."
      : `All ${total} success metrics on this spec have a source.`;
  }
  return `${measurable} of ${total} success metrics have a source; the rest cannot be graded until one is connected or a reading is recorded.`;
}

/** Why the grader will not resolve a forecast whose metric nothing measures. */
export function whyItCannotBeResolved(metric: string | null): string {
  const named = metric && metric.trim().length > 0 ? ` (${metric.trim()})` : "";
  return `This forecast could not be graded: nothing connected to this workspace measures the metric it is about${named}. Connect a source or record a reading by hand, and it can be graded then.`;
}
