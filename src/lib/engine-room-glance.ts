/**
 * OBS-09 / LOOM W2: pure view-model for the Engine Room glance. No React, no
 * server calls. EngineRoomSurface fetches the read queries and hands their
 * outputs here.
 *
 * Honesty law (DESIGN-LOOM §9b): numbers are real or absent. The old
 * FALLBACK_VERDICT prototype literals ("$482 of $600 · trending +12%") are
 * gone; a builder is only called once its inputs have genuinely loaded, and
 * the surface renders a skeleton (loading) or an error card (failure) until
 * then. A dead backend must never read as "all clear."
 *
 * Spend figures, one truth per line (audit: three contradictory figures):
 * - When a cap is set, the glance verdict reads the budget meter
 *   (ai_budgets.*_usd_used vs its cap) - the same number that actually gates
 *   AI calls - and says so ("monthly cap"). State (watch/healthy) derives
 *   from that same pair, never from a second source.
 * - When no cap is set, the verdict reads the analytics rollup (ai_events,
 *   7 days) and labels its window ("this week").
 * - The old glance line mixed both sources plus a cross-window trend in one
 *   sentence; the trend now lives only in the Spend room's TREND view, where
 *   it is labeled "vs the week before."
 */

export type RoomState = "healthy" | "watch";
export type RoomKey = "spend" | "quality" | "safety" | "record";

export interface RoomGlance {
  key: RoomKey;
  name: string;
  question: string;
  verdict: string;
  state: RoomState;
}

export const ROOM_QUESTIONS: Record<RoomKey, string> = {
  spend: "What is this costing me?",
  quality: "Is the machine still good?",
  safety: "What is it allowed to do?",
  record: "What exactly happened?",
};

export const ROOM_NAMES: Record<RoomKey, string> = {
  spend: "Spend",
  quality: "Quality",
  safety: "Safety",
  record: "Record",
};

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${Math.round(n).toLocaleString("en-US")}`;
  if (n >= 10) return `$${n.toFixed(0)}`;
  // Small real amounts must not round to a fabricated "$0".
  return `$${n.toFixed(2)}`;
}

/**
 * OBS-15: zero-fills a sparse day-bucketed series (as returned by
 * getAnalyticsOverview's `daily`, which only carries an entry for a day that
 * had at least one event) into a fixed-length window of `days` entries
 * ending at `asOfMs` (defaults to Date.now()), oldest first. A day with no
 * bucket entry is a real zero, not a gap: without this, a chart that plots
 * the sparse array by index draws a quiet day as if it were adjacent to its
 * neighbors, implying a smooth trend across days that never happened.
 */
export function zeroFillDaily(
  daily: readonly { day: string; cost: number }[],
  days: number,
  asOfMs = Date.now(),
): number[] {
  const byDay = new Map(daily.map((d) => [d.day, d.cost]));
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(asOfMs - i * 86400000).toISOString().slice(0, 10);
    out.push(byDay.get(key) ?? 0);
  }
  return out;
}

export interface SpendGlanceInput {
  /** `getBudgetOverview().global`: real DB row, `null` when unconfigured. */
  global: {
    daily_usd_cap: number | string | null;
    monthly_usd_cap: number | string | null;
    daily_usd_used?: number | string | null;
    monthly_usd_used?: number | string | null;
  } | null;
  /** `getAnalyticsOverview({ days: 7 }).summary.totalCost`: this week's spend. */
  costThisWeek: number;
}

export function buildSpendGlance(input: SpendGlanceInput): RoomGlance {
  const { global, costThisWeek } = input;
  const monthlyCap = global?.monthly_usd_cap != null ? Number(global.monthly_usd_cap) : 0;
  const dailyCap = global?.daily_usd_cap != null ? Number(global.daily_usd_cap) : 0;
  if (monthlyCap > 0 || dailyCap > 0) {
    // One source: the budget meter that actually gates calls, cap + used
    // from the same row, window named in the sentence.
    const monthly = monthlyCap > 0;
    const cap = monthly ? monthlyCap : dailyCap;
    const used = Number((monthly ? global?.monthly_usd_used : global?.daily_usd_used) ?? 0);
    return {
      key: "spend",
      name: ROOM_NAMES.spend,
      question: ROOM_QUESTIONS.spend,
      verdict: `${fmtUsd(used)} of ${fmtUsd(cap)} ${monthly ? "monthly" : "daily"} cap`,
      state: used / cap >= 0.8 ? "watch" : "healthy",
    };
  }
  return {
    key: "spend",
    name: ROOM_NAMES.spend,
    question: ROOM_QUESTIONS.spend,
    verdict: `${fmtUsd(costThisWeek)} this week · no cap set`,
    state: "healthy",
  };
}

export interface QualityGlanceInput {
  /**
   * `getEvalHealth().health` - the ONE quality truth. The audit found a
   * three-way conflict (header "Evals 81" - a suite's average score - vs the
   * room's "PASS RATE 75%" vs a raw "unknown · watch" note); the glance now
   * reads the same pass-rate report the room's score card renders, so the
   * header and the card can never disagree.
   */
  passRate: number | null;
  totalRuns: number;
  verdict: "healthy" | "watch" | "at-risk" | "no-data";
  /** `getDriftOverview().openIncidents` */
  driftOpenCount: number;
}

export function buildQualityGlance(input: QualityGlanceInput): RoomGlance {
  const { passRate, totalRuns, verdict, driftOpenCount } = input;
  const driftOpen = driftOpenCount > 0;
  const driftWord = driftOpen ? "drift open" : "no drift";
  if (passRate == null || totalRuns === 0 || verdict === "no-data") {
    return {
      key: "quality",
      name: ROOM_NAMES.quality,
      question: ROOM_QUESTIONS.quality,
      verdict: `No eval runs yet · ${driftWord}`,
      state: driftOpen ? "watch" : "healthy",
    };
  }
  // State derives from the same report as the number (never a second source).
  const state: RoomState = verdict !== "healthy" || driftOpen ? "watch" : "healthy";
  return {
    key: "quality",
    name: ROOM_NAMES.quality,
    question: ROOM_QUESTIONS.quality,
    verdict: `Pass rate ${Math.round(passRate * 100)}% across ${totalRuns} run${totalRuns === 1 ? "" : "s"} · ${driftWord}`,
    state,
  };
}

export interface SafetyGlanceInput {
  /** `getGuardrailOverview().rules` */
  rules: Array<{ enabled: boolean }>;
  /** `getIncidents().count` */
  incidentCount: number;
}

export function buildSafetyGlance(input: SafetyGlanceInput): RoomGlance {
  const onCount = input.rules.filter((r) => r.enabled).length;
  const state: RoomState = input.incidentCount > 0 ? "watch" : "healthy";
  return {
    key: "safety",
    name: ROOM_NAMES.safety,
    question: ROOM_QUESTIONS.safety,
    verdict: `${onCount} guardrail${onCount === 1 ? "" : "s"} on · ${input.incidentCount} incident${input.incidentCount === 1 ? "" : "s"}`,
    state,
  };
}

export interface RecordGlanceInput {
  /** `listTraces({ days: 7, limit: 200 }).traces.length` (window named in the verdict). */
  traceCount: number;
  /** `getLedgerSeal().available`: the fingerprint computed cleanly. */
  ledgerVerifies: boolean;
}

export function buildRecordGlance(input: RecordGlanceInput): RoomGlance {
  const traceLabel = input.traceCount.toLocaleString("en-US");
  return {
    key: "record",
    name: ROOM_NAMES.record,
    question: ROOM_QUESTIONS.record,
    // Record is always healthy when the ledger verifies (extensions §5); a
    // broken fingerprint is a Call on Today, never a silent room state.
    verdict: `${traceLabel} run${input.traceCount === 1 ? "" : "s"} this week · ${input.ledgerVerifies ? "ledger intact" : "ledger unverified"}`,
    state: "healthy",
  };
}
