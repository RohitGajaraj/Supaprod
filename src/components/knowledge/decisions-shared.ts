// Shared decision vocabulary — single source for DecisionsPanel (list) and
// DecisionDetail (screen-6 drill-down). Non-component exports live here so
// both component files keep Vite fast-refresh (react-refresh rule: a file
// must export only components). SourceLink stays in DecisionsPanel.
import type { DecisionRow, DecisionSource } from "@/lib/decisions.functions";

/*
 * RE-EXPORTED BECAUSE EVERY CONSUMER OF THIS MODULE ALREADY IMPORTS IT FROM
 * HERE, and one of them was importing a name this file did not export.
 *
 * `decisions-shared.test.ts` has read `type DecisionRow` from this module since
 * it was written. Bun strips types without resolving them, so the test ran; tsc
 * would have said so on day one and `tsconfig.json` excluded every test file
 * from tsc. The import was fiction and nothing could see it.
 *
 * Re-exporting rather than repointing the test: the functions here take and
 * return this shape, so a caller reaching for the type alongside them is asking
 * the right module. Making that true is better than making the caller go
 * somewhere else for half of what it needs.
 */
export type { DecisionRow, DecisionSource };
import { agentDisplayName } from "@/lib/agent-vocabulary";
// The product's three forecast words, already single-sourced for the Forecast
// Desk. Imported, never restated: two surfaces must not call one outcome two
// things. The module is type-only in its own imports, so this stays client-safe.
import { FORECAST_SAYS } from "@/components/learn/forecast-words";

/**
 * Where the call came from, in the words a practitioner would use.
 *
 * EXHAUSTIVE BY CONSTRUCTION. `DecisionSource` is derived from
 * `DECISION_SOURCES`, so this Record fails to compile the moment an origin is
 * added without a label — which is exactly what did not happen the last three
 * times. This map held four keys while the database permitted nine, and the
 * cast at DecisionDetail.tsx:278 hid it from tsc, so 50 of 296 rows rendered
 * `undefined` here: a Line with no label and a filter option that did not exist.
 *
 * The six added on 2026-08-11 are the six that were already in the data.
 */
export const SOURCE_LABEL: Record<DecisionSource, string> = {
  mission: "Mission",
  prd: "Spec",
  meeting: "Meeting",
  manual: "Manual",
  roadmap: "Roadmap",
  retrospective: "Retro",
  critic: "Critic",
  opportunity: "Opportunity",
  /* Two different agent origins, and the labels have to carry the difference
   * themselves. These read "Agent API" and "Agent" until Lane 2 pointed out
   * the obvious: a reader seeing both assumes it is one thing written twice,
   * because neither word says WHOSE agent. The load-bearing fact is that one
   * of them belongs to somebody else — it arrived over the network under a
   * scoped token — and the other is this product's own Decide hand running
   * inside a mission. Those carry different trust and different blast radius,
   * so the distinction stays and the wording changed to state it.
   *
   * "Peer agent" is the product's own existing word for an outside caller
   * (a2a-card.ts, mcp.functions.ts), not a new coinage. */
  mcp: "Peer agent",
  agent: "Agent",
};

/** The outcome in plain words, and the one class that carries it.
 *
 *  Replaces the retired VerdictTone map. Green and red carry outcomes and own
 *  those two; a call nobody has settled yet is not an outcome, so it stays
 *  monochrome rather than wearing ember. Ember marks the human, and deciding
 *  happens on Today, so the ember budget belongs there. */
/*
 * PORTED OFF `sp-*` IN THE SAME COMMIT, BECAUSE THE RATCHET CAUGHT ME WIDENING IT.
 * `sp-pass` and `sp-fail` are the retired family. Adding three statuses meant
 * adding two more retired tones, and the Meridian ratchet failed with "lets no
 * known file get worse" -- correctly. **Never widen the baseline to pass**, so
 * the whole map moved to `text-mrd-pass` / `text-mrd-fail`, which is what
 * `studio/RunReturn.tsx:160` already uses. The fix reduces the debt instead of
 * growing it, and the ratchet is the only reason I noticed.
 */
export const OUTCOME_WORD: Record<string, { word: string; tone: string }> = {
  approved: { word: "Kept", tone: "text-mrd-pass" },
  rejected: { word: "Dropped", tone: "text-mrd-fail" },
  pending: { word: "Not settled", tone: "" },
  /*
   * THREE STATUSES THE MAP NEVER HAD, AND THEY ARE 115 OF 385 ROWS (2026-09-01).
   *
   * `decisions.status` carries FIVE values; this map had three, and one of the
   * three -- `rejected` -- has never had a single row. Measured:
   *
   *   approved   144   was mapped
   *   pending    126   was mapped
   *   standing    80   NOT mapped
   *   superseded  20   NOT mapped
   *   declined    15   NOT mapped, and dated TODAY
   *   rejected     0   mapped, and has never existed
   *
   * `DecisionsPanel` read `OUTCOME_WORD[d.status].tone` unguarded, so 29.9% of
   * rows threw `Cannot read properties of undefined`, and the default filter is
   * "all". S2 drove it signed in: the /brain page rendered 525 characters and no error
   * message at all, and the region simply vanished, which is a failed read
   * wearing an empty state's clothes at full page scale.
   *
   * THE TYPE CERTIFIED THE BUG RATHER THAN CATCHING IT. This was
   * `Record<DecisionRow["status"], ...>`, and that union is declared
   * `"pending" | "approved" | "rejected"` at `lib/decisions.functions.ts:69` --
   * narrower than the column it describes. A `Record` over a union that is a
   * SUBSET of reality type-checks perfectly and is wrong at runtime for every
   * value the union forgot. Widening the union is S0's file and is filed; this
   * map is now keyed by `string` so the component cannot inherit that mistake
   * again, and `outcomeWord` below makes the absence unthrowable.
   *
   * THE WORDS. §12 binds these and "Dropped" is already spent on `rejected`.
   * `declined` is what S0's F-174 decline arm writes, and F-32 ruled that a
   * "no" is a decision filed exactly as a yes -- so it reads as a decision, not
   * as a failure. `superseded` is monochrome because being replaced is not an
   * outcome, it is a later call taking over.
   */
  standing: { word: "Still stands", tone: "text-mrd-pass" },
  declined: { word: "Said no", tone: "text-mrd-fail" },
  superseded: { word: "Replaced", tone: "" },
};

/**
 * The outcome word for any status, including one nobody has written down.
 *
 * **A lookup on this map may never throw.** That is the whole lesson of the
 * /brain crash: an unmapped status took an entire page with it, and the page
 * showed no error, so the failure was indistinguishable from having no
 * decisions. An unknown status is a gap in OUR vocabulary, not an error in the
 * reader's data, and it should read as one.
 *
 * It does NOT print the raw status. §12 keeps slugs off surfaces, and a word a
 * person cannot say out loud is what this map exists to prevent; a status we
 * have not named yet is better admitted than leaked.
 */
export function outcomeWord(status: string | null | undefined): { word: string; tone: string } {
  return (status && OUTCOME_WORD[status]) || { word: "No word for this yet", tone: "" };
}

export function ageOf(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return ""; // Guard against malformed timestamps
  const ms = Date.now() - then;
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function hasSource(d: DecisionRow): boolean {
  return !!(d.mission_id || d.prd_id || d.meeting_id);
}

/** Who decided, user-facing. A human call reads as "You"; an agent call
 * resolves through the agent-vocabulary catalog so a raw DB slug (e.g.
 * "prd-writer") never leaks to the panel - it reads as the agent's real
 * name (e.g. "Draft"). */
export function displayWho(slug: string | null): string {
  if (!slug) return "You";
  return agentDisplayName(slug);
}

/** The forecast chip on a list row, or null when the row carries no forecast.
 *
 *  Colour rule matches OUTCOME_WORD: green and red carry outcomes and own those
 *  two. A hit and a miss ARE outcomes (the horizon passed, the answer is in);
 *  an inconclusive one did not settle, and a forecast still waiting on its
 *  horizon is not an outcome at all — both stay monochrome, which reads as the
 *  system's "hold". "hold" is deliberately not in FORECAST_SAYS: that map holds
 *  verdicts, and "waiting" is a state, so it is named here once.
 *
 *  The tone strings are READ from OUTCOME_WORD rather than written again:
 *  pass/fail classes are owned there, and a second copy would grow this file's
 *  retired-vocabulary count, which the Meridian ratchet refuses.
 *
 *  PURE AND EXPORTED so the panel and its test read one definition. */
const PASS_TONE = OUTCOME_WORD.approved.tone;
const FAIL_TONE = OUTCOME_WORD.rejected.tone;

export function forecastChip(d: {
  forecast_claim?: string | null;
  forecast_resolution?: string | null;
}): { claim: string; word: string; tone: string } | null {
  const claim = d.forecast_claim?.trim();
  if (!claim) return null;
  if (d.forecast_resolution === "hit") return { claim, word: FORECAST_SAYS.hit, tone: PASS_TONE };
  if (d.forecast_resolution === "miss") return { claim, word: FORECAST_SAYS.miss, tone: FAIL_TONE };
  if (d.forecast_resolution === "inconclusive")
    return { claim, word: FORECAST_SAYS.inconclusive, tone: "" };
  // No resolution yet: the horizon has not come due, or nobody has graded it.
  return { claim, word: HOLD_WORD, tone: "" };
}

/**
 * "hold", named once so the list can recognise its own output.
 *
 * ── SIX ROWS OUT OF EIGHT ENDED IN THIS WORD ──────────────────────────────
 * Read signed in on `/outcomes`, 2026-09-10. Every decision in the workspace
 * that carried a forecast carried an unsettled one, so `forecastChip` fell
 * through to the same string six times in the last position on the line. The
 * remaining two rows read "no forecast", which means the column had exactly
 * two values and one of them was the absence of the other.
 *
 * ── AND IT IS NOT A VERDICT, WHICH IS WHY IT IS THE ONE THAT MAY GO ───────
 * This file's own header says it: *"'hold' is deliberately not in
 * FORECAST_SAYS: that map holds verdicts, and 'waiting' is a state"*. A
 * settled hit, miss or inconclusive is the payload of this page and is never
 * suppressed however uniform the column gets -- suppressing an outcome to
 * save a repetition would be the trade running backwards. An unsettled state
 * identical on every row is the PAGE's state, and the coverage line above the
 * list is where a page states its own.
 */
export const HOLD_WORD = "hold";

/**
 * Whether the forecast word may be dropped from the rows about to be drawn.
 *
 * True only when every row that has a forecast at all is on `hold`. One
 * settled verdict anywhere in the set and every row keeps its word, because
 * then the word is the fastest way to see which one settled.
 *
 * Rows with NO forecast do not count towards it either way: they already say
 * "no forecast", which is a different fact and stays.
 */
export function holdIsTheWholeColumn(
  rows: readonly { forecast_claim?: string | null; forecast_resolution?: string | null }[],
): boolean {
  const words = rows.map((r) => forecastChip(r)?.word).filter((w): w is string => Boolean(w));
  return words.length >= 2 && words.every((w) => w === HOLD_WORD);
}

/**
 * A CLAIM THAT IS THE ROW'S OWN TITLE IS NOT A SECOND FACT.
 *
 * Two rows on `/outcomes` read, twenty pixels apart:
 *
 *   Warn a homeowner before an installer visit is cancelled
 *   Kept · You settled it · Forecast: Warn a homeowner before an installer
 *   visit is cancelled · hold
 *
 * Measured across the whole record: 2 of 204 forecast claims are their own
 * decision's title, and BOTH of them are in the workspace the founder was
 * looking at. Rare, and it is the repo's oldest defect -- two elements saying
 * one thing -- on the surface that is meant to prove the product works.
 *
 * Compared on a normalised string rather than scored: this is exact
 * restatement, not similarity, and a threshold here would be a judgement the
 * check cannot make. Trailing punctuation and case are the only differences a
 * model reliably introduces when it copies a line.
 *
 * The second line still says a forecast EXISTS -- the verdict word draws
 * whenever `forecastChip` returns -- so nothing is hidden. What goes is the
 * sentence a reader has already read.
 */
export function claimRestatesTitle(claim: string, title: string): boolean {
  const flat = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .replace(/[.\s]+$/, "");
  return flat(claim) === flat(title) && flat(claim).length > 0;
}

/** The chip's title attribute: the observable and the date, since neither fits
 *  a compact claim line and both are the half a reader would ask for next.
 *  Undefined when there is nothing to say, so no empty tooltip ever mounts. */
export function forecastTitle(d: {
  forecast_how_we_will_know?: string | null;
  forecast_horizon_date?: string | null;
}): string | undefined {
  const know = d.forecast_how_we_will_know?.trim();
  const raw = d.forecast_horizon_date;
  const due = raw ? new Date(raw) : null;
  const dueWord =
    due && !Number.isNaN(due.getTime())
      ? `By ${due.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}`
      : null;
  return (
    [know ? `How you will know: ${know}` : null, dueWord].filter(Boolean).join(" · ") || undefined
  );
}

/**
 * HOW MANY OF THESE CALLS CARRY A FORECAST, and the honest clause about the rest.
 *
 * A forecast is written at Decide and at no other station, so the decisions list
 * is the only surface in the product that can report whether its own bar is
 * being met. Until this existed it could not: a call WITH a forecast drew a
 * chip and a call WITHOUT one drew nothing, so silence meant either "none was
 * written" or "the column was not read", and no reader could tell which.
 *
 * The gap is not a footnote. Measured on the live record while this was
 * written: 175 of 367 calls carry one, the largest workspace 20 of 109, and one
 * workspace 0 of 61.
 *
 * PURE, so the rule is asserted here rather than eyeballed in a browser -- the
 * panel has no DOM renderer in its tests, which is exactly how a sentence like
 * this rots without anything failing.
 *
 * The caller passes the rows it is ABOUT TO RENDER, never a second query, so the
 * count and the rows beneath it cannot disagree.
 */
export function forecastCoverage(rows: readonly { forecast_claim?: string | null }[]): {
  withForecast: number;
  total: number;
  /** The trailing clause, or null when every call carries one and there is
   *  nothing left to admit. */
  tail: string | null;
} {
  const total = rows.length;
  const withForecast = rows.filter((d) => d.forecast_claim?.trim()).length;
  const tail =
    total === 0
      ? null
      : withForecast === 0
        ? "Nothing on this list can be graded until one is."
        : withForecast < total
          ? "The rest cannot be graded against anything."
          : null;
  return { withForecast, total, tail };
}

/**
 * THE CALLS WHOSE DATE HAS PASSED AND WHOSE ANSWER NEVER ARRIVED.
 *
 * `forecastCoverage` above answers "how many of these can be graded at all".
 * This answers the second half, and it is the half the product's own claim
 * rests on: a forecast written at decision time is worth nothing until somebody
 * settles it against what happened. A horizon date that has gone by with no
 * resolution is a bet the team made and then stopped watching.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-27: 369 decisions, 176 carrying a
 * forecast, 91 graded, and 15 past their date with no resolution. Nothing in
 * the product said so anywhere a person browsing their own calls would see it.
 *
 * IT COUNTS, AND IT DOES NOT SETTLE. The Forecast Desk on /learn owns that
 * write and owns the queue it drains; a second settle control here would be a
 * second place for one decision to be made, which is the defect this repo has
 * found on six surfaces already. This states the fact and names the door.
 *
 * A ROW WITH NO HORIZON IS NOT LATE, it is ungradeable, and `forecastCoverage`
 * already says so. Counting it here would blame a team for missing a date
 * nobody set.
 */
export function forecastDue(
  rows: readonly {
    forecast_horizon_date?: string | null;
    forecast_resolution?: string | null;
  }[],
  nowMs: number,
): {
  /** Past their horizon with no resolution. */
  due: number;
  /** The sentence, or null when there is nothing to say. */
  said: string | null;
} {
  const due = rows.filter((d) => {
    if (d.forecast_resolution) return false;
    const at = d.forecast_horizon_date ? Date.parse(d.forecast_horizon_date) : NaN;
    /* An unparseable date is not a late one. Treating it as late would turn a
       bad row into an accusation, and the reader cannot act on either. */
    return Number.isFinite(at) && at < nowMs;
  }).length;

  if (due === 0) return { due: 0, said: null };
  return {
    due,
    said:
      due === 1
        ? "One is past the date it set and has not been graded."
        : `${due} are past the dates they set and have not been graded.`,
  };
}
