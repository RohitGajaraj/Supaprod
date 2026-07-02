/**
 * OBS-09: pure view-model for the Engine Room glance. No React, no server
 * calls. EngineRoomSurface fetches the read queries and hands their outputs
 * here. Every verdict falls back to the prototype's exact literal when its
 * inputs are absent (loading or truly empty), so a cold render still matches
 * the design floor (`design-reference/obsidian-v3/.../cadence-app.html`).
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

const ROOM_NAMES: Record<RoomKey, string> = {
  spend: "Spend",
  quality: "Quality",
  safety: "Safety",
  record: "Record",
};

// Prototype literals (design-reference/obsidian-v3/design-reference/cadence-app.html
// `rooms` array). The exact fallback for a loading/empty cold render.
const FALLBACK_VERDICT: Record<RoomKey, string> = {
  spend: "$482 of $600 · trending +12%",
  quality: "Evals 94 / 88 / 91 · no drift",
  safety: "3 guardrails on · 0 incidents",
  record: "1,284 traces · ledger intact",
};

function fmtUsd(n: number): string {
  return n >= 1000 ? `$${Math.round(n).toLocaleString("en-US")}` : `$${n.toFixed(0)}`;
}

function fmtSignedPct(pct: number): string {
  const rounded = Math.round(pct);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
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
  /** `getAnalyticsOverview({ days: 14 }).summary.totalCost`: trailing 14 days.
   * Used to derive the previous week (`cost14d - cost7d`) for the trend,
   * without a dedicated range-offset server fn. */
  costTrailing14d: number;
}

function buildSpendGlance(input: SpendGlanceInput | undefined): RoomGlance {
  if (!input || !input.global) {
    return {
      key: "spend",
      name: ROOM_NAMES.spend,
      question: ROOM_QUESTIONS.spend,
      verdict: FALLBACK_VERDICT.spend,
      state: "healthy",
    };
  }
  const { global, costThisWeek, costTrailing14d } = input;
  // Monthly cap answers "what is this costing me" at a glance; fall back to the
  // daily cap only when no monthly cap is configured.
  const cap = Number(global.monthly_usd_cap ?? global.daily_usd_cap ?? 0);
  const used = Number(
    global.monthly_usd_cap != null ? (global.monthly_usd_used ?? 0) : (global.daily_usd_used ?? 0),
  );
  const prevWeek = Math.max(0, costTrailing14d - costThisWeek);
  const trendPct = prevWeek > 0 ? ((costThisWeek - prevWeek) / prevWeek) * 100 : 0;
  if (cap <= 0) {
    return {
      key: "spend",
      name: ROOM_NAMES.spend,
      question: ROOM_QUESTIONS.spend,
      verdict: `${fmtUsd(costThisWeek)} this week · no cap set`,
      state: "healthy",
    };
  }
  const state: RoomState = used / cap >= 0.8 ? "watch" : "healthy";
  return {
    key: "spend",
    name: ROOM_NAMES.spend,
    question: ROOM_QUESTIONS.spend,
    verdict: `${fmtUsd(used)} of ${fmtUsd(cap)} · trending ${fmtSignedPct(trendPct)}`,
    state,
  };
}

export interface QualityGlanceInput {
  /** `listEvalSuites()` rows, each carrying `pass_threshold` + `last_run`. */
  suites: Array<{
    pass_threshold: number | string | null;
    last_run: { avg_score: number | null } | null;
  }>;
  /** `getDriftOverview().openIncidents` */
  driftOpenCount: number;
}

function buildQualityGlance(input: QualityGlanceInput | undefined): RoomGlance {
  if (!input || input.suites.length === 0) {
    return {
      key: "quality",
      name: ROOM_NAMES.quality,
      question: ROOM_QUESTIONS.quality,
      verdict: FALLBACK_VERDICT.quality,
      state: "healthy",
    };
  }
  const { suites, driftOpenCount } = input;
  const scored = suites.filter((s) => s.last_run?.avg_score != null);
  const belowBaseline = scored.some(
    (s) => Math.round(s.last_run!.avg_score as number) < Number(s.pass_threshold ?? 0),
  );
  const driftOpen = driftOpenCount > 0;
  const state: RoomState = belowBaseline || driftOpen ? "watch" : "healthy";
  const scoreLine = scored.length
    ? scored
        .slice(0, 3)
        .map((s) => Math.round(s.last_run!.avg_score as number))
        .join(" / ")
    : "no runs yet";
  return {
    key: "quality",
    name: ROOM_NAMES.quality,
    question: ROOM_QUESTIONS.quality,
    verdict: `Evals ${scoreLine} · ${driftOpen ? "drift open" : "no drift"}`,
    state,
  };
}

export interface SafetyGlanceInput {
  /** `getGuardrailOverview().rules` */
  rules: Array<{ enabled: boolean }>;
  /** `getIncidents().count` */
  incidentCount: number;
}

function buildSafetyGlance(input: SafetyGlanceInput | undefined): RoomGlance {
  if (!input) {
    return {
      key: "safety",
      name: ROOM_NAMES.safety,
      question: ROOM_QUESTIONS.safety,
      verdict: FALLBACK_VERDICT.safety,
      state: "healthy",
    };
  }
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
  /** `listTraces({ days: 30, limit: 200 }).traces.length` */
  traceCount: number;
  /** `getLedgerSeal().available`: the fingerprint computed cleanly. */
  ledgerVerifies: boolean;
}

function buildRecordGlance(input: RecordGlanceInput | undefined): RoomGlance {
  if (!input) {
    return {
      key: "record",
      name: ROOM_NAMES.record,
      question: ROOM_QUESTIONS.record,
      verdict: FALLBACK_VERDICT.record,
      state: "healthy",
    };
  }
  const traceLabel = input.traceCount.toLocaleString("en-US");
  return {
    key: "record",
    name: ROOM_NAMES.record,
    question: ROOM_QUESTIONS.record,
    // Record is always healthy when the ledger verifies (extensions §5); a
    // broken fingerprint is a Call on Today, never a silent room state.
    verdict: `${traceLabel} trace${input.traceCount === 1 ? "" : "s"} · ${input.ledgerVerifies ? "ledger intact" : "ledger unverified"}`,
    state: "healthy",
  };
}

export interface GlanceInputs {
  spend?: SpendGlanceInput;
  quality?: QualityGlanceInput;
  safety?: SafetyGlanceInput;
  record?: RecordGlanceInput;
}

/** Maps the four rooms' existing read-query outputs to their glance state + verdict. */
export function buildGlance(inputs: GlanceInputs): RoomGlance[] {
  return [
    buildSpendGlance(inputs.spend),
    buildQualityGlance(inputs.quality),
    buildSafetyGlance(inputs.safety),
    buildRecordGlance(inputs.record),
  ];
}
