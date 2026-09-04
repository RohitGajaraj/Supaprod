/**
 * THE SPEC'S METRICS, AND WHAT MEASURES EACH ONE, AS THE LEARN SEAT READS THEM.
 *
 * ── WHY THE READING NEVER REACHED THE SEAT ────────────────────────────────
 * P-137 gave a person a press that writes a number onto the standing clause in
 * `prds.contract`. Measured 2026-09-04: `clause.readings` has exactly one
 * reader in the product, the sentence that says whether a source exists. The
 * Learn driver never mentions a reading.
 *
 * The reason is structural rather than an oversight. A brief carries an
 * artifact's BODY, and `ARTIFACT_SOURCE` maps a spec to `body_md`. The
 * contract is a different column, so the metrics and every reading recorded
 * against them were never in the text the seat was handed. The spec arrives
 * whole at Learn -- `describeUpstream(upstream, ["prd", "decision"])` -- and
 * whole means its prose, not its promises.
 *
 * The same defect was found and fixed one kind over, and its write-up is in
 * `chain.ts`: a decision reached the seat with `title` and `rationale` and none
 * of its forecast columns, so **18 of 18 runs by the two Learn seats had no
 * "forecast" anywhere in their input**, two of them in briefs of 7,800
 * characters. It was never sent. This is that, for the number.
 *
 * ── AND WHY THIS IS A RENDERER RATHER THAN ANOTHER `also` COLUMN ──────────
 * `also` exists for exactly this and would have been the one-line change:
 * `also: ["contract"]`. It also would not have worked, and would have looked
 * like it did. The extras are rendered with `String(v)`, so a jsonb column
 * arrives in the brief as `[object Object]` -- it compiles, it runs, the column
 * is genuinely being sent, and the seat is handed nine characters of nothing.
 * That is the whole family of defect this repo keeps finding, and it would have
 * been shipped as "the reading now reaches the seat".
 *
 * So the contract is rendered to prose here, and `driver.server.ts` refuses to
 * `String()` an object it has no renderer for rather than printing that shape
 * again for the next column somebody adds.
 *
 * ── WHAT THE SEAT IS TOLD, AND WHAT IT IS NOT ─────────────────────────────
 * Each standing metric, with the number if there is one and who gave it. A
 * hand reading is always attributed in the text: the seat is grading a
 * customer's product against a figure a person typed, and an agent that cannot
 * tell that from an instrument reading will write "measured" over "somebody
 * told us". Where nothing can produce a number the line says so, so the seat
 * can refuse rather than invent -- which is the behaviour P-42's grader
 * already has and the seat did not.
 */

import {
  whatWouldMeasure,
  isStanding,
  canProduceAReading,
  type MetricClause,
  type SourceState,
} from "./what-would-measure-this";

/** One clause, ready to be read aloud to the seat. */
type MetricLine = { readonly text: string; readonly state: SourceState };

function clausesOf(contract: unknown): MetricClause[] {
  const raw = (contract as { success_metrics?: unknown } | null)?.success_metrics;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (c): c is MetricClause => typeof c === "object" && c !== null && isStanding(c as MetricClause),
  );
}

/**
 * How a reading is said. `by` and `at` are ALWAYS in the sentence, never
 * summarised away: "71" and "a person recorded 71 on 2026-09-08" are different
 * claims, and the seat is composing a verdict that will be read as the
 * product's own measurement.
 */
function readingSentence(state: SourceState): string {
  switch (state.kind) {
    case "hand": {
      const note = state.reading.note ? ` They noted: ${state.reading.note}` : "";
      return `A person (${state.reading.by}) recorded ${state.reading.value} on ${state.reading.at.slice(0, 10)}.${note}`;
    }
    case "connected":
      return "A connected source has readings for this.";
    case "named-never-run":
      return "This names a check that has never produced a reading, so there is no number for it.";
    case "acceptance-only":
      return state.oracle === "ci"
        ? "This is checked by the build, which says our tests passed, not how people behaved."
        : "This is checked by hand against the built thing, not by how people behaved.";
    case "declared-unverifiable":
      return "The spec says this one cannot be verified.";
    case "none":
      return "Nothing connected can measure this.";
  }
}

/**
 * The block that rides into the brief, or null when the spec promises nothing.
 *
 * Null rather than an empty heading: a section titled "Success metrics" with
 * nothing under it reads as a failed read, and the seat would be right to
 * wonder what it was not shown.
 */
export function metricsForTheBrief(
  contract: unknown,
  refsWithReadings: ReadonlySet<string> = new Set<string>(),
): string | null {
  const clauses = clausesOf(contract);
  if (clauses.length === 0) return null;

  const lines: MetricLine[] = clauses.map((c) => ({
    text: typeof c.text === "string" ? c.text.trim() : "",
    state: whatWouldMeasure(c, refsWithReadings),
  }));

  const measurable = lines.filter((l) => canProduceAReading(l.state)).length;
  const head =
    measurable === 0
      ? "Success metrics on this spec, and what measures them. NOTHING can produce a number for any of them, so you cannot grade this against a measurement; say so rather than estimating one."
      : `Success metrics on this spec, and what measures them. ${measurable} of ${lines.length} have a number behind them; grade against those and say plainly that the rest have none.`;

  return [head, ...lines.map((l) => `- ${l.text} ${readingSentence(l.state)}`)].join("\n");
}

/**
 * What the station's verify says it graded against.
 *
 * The verify used to be able to say only that a learning EXISTS. A learning
 * written with no number in front of it and one written against a recorded 71
 * are different artifacts, and the record could not tell them apart, so a
 * verdict composed from nothing passed the same check as one composed from a
 * measurement.
 */
export function whatItWasGradedAgainst(
  contract: unknown,
  refsWithReadings: ReadonlySet<string> = new Set<string>(),
): string {
  const clauses = clausesOf(contract);
  if (clauses.length === 0) return "graded with no success metric on the spec";
  const n = clauses
    .map((c) => whatWouldMeasure(c, refsWithReadings))
    .filter(canProduceAReading).length;
  if (n === 0) return "graded with no reading";
  return `graded against ${n} reading${n === 1 ? "" : "s"}`;
}

/**
 * The same sentence from source states rather than a raw contract, for the
 * caller that has already resolved them.
 *
 * NULL when the states could not be read. The verify's own note says an absent
 * `trackId` degrades Build's check to the filing check it was; this degrades
 * the same way and for the same reason. "graded with no reading" is a claim,
 * and a check that could not look must not make it -- it would put "no
 * reading" on the record for a track that had one.
 */
export function gradedAgainstFromStates(states: readonly SourceState[] | null): string | null {
  if (states === null) return null;
  if (states.length === 0) return "graded with no success metric on the spec";
  const n = states.filter(canProduceAReading).length;
  if (n === 0) return "graded with no reading";
  return `graded against ${n} reading${n === 1 ? "" : "s"}`;
}
