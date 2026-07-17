import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";

// FS-01: calibrate-tick. Scores expired prediction/risk claims Brier-style
// against what actually happened, throttles a kind that keeps missing, and
// makes the resulting hit rate readable ("Supaprod called 7 of the last 9").

const MODEL = "google/gemini-2.5-flash" as const;
const CALIBRATE_BATCH = 10;
const THROTTLE_HOURS = 72;
const MIN_SAMPLES_FOR_THROTTLE = 3;
const THROTTLE_HIT_RATE_FLOOR = 0.34;
const ROLLING_WINDOW = 10;

export type CalibrationOutcome = "hit" | "miss" | "inconclusive";
export type CalibrationKind = "prediction" | "risk";

const CALIBRATE_SYSTEM = `You are the Supaprod forecast auditor. You are given a claim made in the past and what is known now. Judge honestly whether the claim came true.
Rules:
- Signal-first: state the verdict, then the one fact that decided it.
- Short: rationale max 2 sentences.
- If the evidence does not clearly confirm or deny the claim, say inconclusive rather than guessing.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON matching the requested schema.`;

export function computeBrierScore(
  confidence: number | null | undefined,
  outcome: CalibrationOutcome,
): number | null {
  if (outcome === "inconclusive") return null;
  const p =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? Math.min(1, Math.max(0, confidence))
      : 0.5;
  const actual = outcome === "hit" ? 1 : 0;
  return (p - actual) ** 2;
}

type DueInsight = {
  id: string;
  kind: string;
  claim: string | null;
  confidence: number | null;
  theme_id: string | null;
  evidence: Record<string, unknown> | null;
  created_at: string;
};

async function judgeOutcome(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  insight: DueInsight,
): Promise<{ outcome: CalibrationOutcome; rationale: string }> {
  let currentState = "No linked theme data is available anymore.";
  if (insight.theme_id) {
    const { data: theme } = await supabase
      .from("themes")
      .select("title,summary,severity,status,confidence,last_signal_at")
      .eq("id", insight.theme_id)
      .maybeSingle();
    if (theme) {
      const t = theme as Record<string, unknown>;
      currentState = `Theme "${String(t.title ?? "")}" is now status=${String(t.status ?? "unknown")}, severity=${String(t.severity ?? "?")}/5, confidence=${String(t.confidence ?? "?")}, last signal at ${String(t.last_signal_at ?? "unknown")}. Summary: ${String(t.summary ?? "")}`;
    }
  }

  const res = await callModel(supabase as never, userId, {
    surface: "sense",
    surface_ref: "calibrate_insight",
    model: MODEL,
    workspaceId,
    responseFormat: "json_object",
    messages: [
      { role: "system", content: CALIBRATE_SYSTEM },
      {
        role: "user",
        content: `CLAIM MADE ON ${insight.created_at}: ${insight.claim}

WHAT IS KNOWN NOW: ${currentState}

Did the claim come true? Output JSON: {"outcome":"hit|miss|inconclusive","rationale":"..."}`,
      },
    ],
  });
  const j = (res.json ?? {}) as { outcome?: string; rationale?: string };
  const outcome: CalibrationOutcome =
    j.outcome === "hit" || j.outcome === "miss" ? j.outcome : "inconclusive";
  return { outcome, rationale: j.rationale ?? "" };
}

export type CalibrationSummary = {
  kind: CalibrationKind;
  resolved: number;
  hits: number;
  hitRate: number | null;
  recentLabel: string;
};

/** Pure: turns a resolution list into the hit-rate summary. Exported for unit tests. */
export function summarizeResolutions(
  rows: Array<{ resolution: string | null }>,
  kind: CalibrationKind,
): CalibrationSummary {
  const resolved = rows.length;
  const hits = rows.filter((r) => r.resolution === "hit").length;
  const hitRate = resolved > 0 ? hits / resolved : null;
  const recentLabel =
    resolved > 0
      ? `Supaprod called ${hits} of the last ${resolved}`
      : "Not enough resolved calls yet";
  return { kind, resolved, hits, hitRate, recentLabel };
}

/** Pure: whether a generator kind should be throttled off the rolling summary. */
export function shouldThrottle(summary: CalibrationSummary): boolean {
  return (
    summary.resolved >= MIN_SAMPLES_FOR_THROTTLE &&
    summary.hitRate !== null &&
    summary.hitRate < THROTTLE_HIT_RATE_FLOOR
  );
}

/** Rolling hit rate over the last `window` decided (non-inconclusive) calls. */
export async function summarizeCalibration(
  supabase: SupabaseClient,
  workspaceId: string,
  kind: CalibrationKind,
  window = ROLLING_WINDOW,
): Promise<CalibrationSummary> {
  const { data } = await supabase
    .from("insights")
    .select("resolution")
    .eq("workspace_id", workspaceId)
    .eq("kind", kind)
    .not("resolution", "is", null)
    .neq("resolution", "inconclusive")
    .order("resolved_at", { ascending: false })
    .limit(window);
  return summarizeResolutions((data ?? []) as { resolution: string }[], kind);
}

async function updateThrottle(
  supabase: SupabaseClient,
  workspaceId: string,
  kind: CalibrationKind,
): Promise<void> {
  const summary = await summarizeCalibration(supabase, workspaceId, kind, ROLLING_WINDOW);
  const column = kind === "prediction" ? "prediction_throttle_until" : "risk_throttle_until";
  await supabase
    .from("workspaces")
    .update({
      [column]: shouldThrottle(summary)
        ? new Date(Date.now() + THROTTLE_HOURS * 60 * 60 * 1000).toISOString()
        : null,
    })
    .eq("id", workspaceId);
}

/** Scores every prediction/risk insight whose horizon date has passed. */
export async function calibrateExpiredInsights(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<{ scored: number; expiredWithoutClaim: number }> {
  const nowIso = new Date().toISOString();
  const { data: due } = await supabase
    .from("insights")
    .select("id,kind,claim,confidence,theme_id,evidence,created_at")
    .eq("workspace_id", workspaceId)
    .in("kind", ["prediction", "risk"])
    .eq("status", "open")
    .is("resolution", null)
    .not("horizon_date", "is", null)
    .lte("horizon_date", nowIso)
    .limit(CALIBRATE_BATCH);

  let scored = 0;
  let expiredWithoutClaim = 0;
  const kindsTouched = new Set<CalibrationKind>();

  for (const raw of (due ?? []) as DueInsight[]) {
    if (!raw.claim) {
      // Pre-FS-01 row with no falsifiable claim recorded: expire, do not score.
      await supabase
        .from("insights")
        .update({ status: "expired", resolved_at: nowIso })
        .eq("id", raw.id);
      expiredWithoutClaim++;
      continue;
    }

    const { outcome, rationale } = await judgeOutcome(supabase, userId, workspaceId, raw);
    const brier = computeBrierScore(raw.confidence, outcome);
    await supabase
      .from("insights")
      .update({
        resolution: outcome,
        brier_score: brier,
        resolved_at: nowIso,
        status: "expired",
        evidence: { ...(raw.evidence ?? {}), calibration_rationale: rationale },
      })
      .eq("id", raw.id);
    scored++;
    if (raw.kind === "prediction" || raw.kind === "risk") kindsTouched.add(raw.kind);
  }

  for (const kind of kindsTouched) await updateThrottle(supabase, workspaceId, kind);

  return { scored, expiredWithoutClaim };
}
