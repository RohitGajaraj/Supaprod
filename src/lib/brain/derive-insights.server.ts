import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";
import { scoreTheme } from "@/lib/brain/score";
import { INELIGIBLE_STATUSES } from "@/lib/spine/promote"; // pure, dependency-free

/** The settled-status set, serialised for PostgREST exactly as its twin in
 *  insights.functions.ts does. Same list, same serialisation, so the ranking
 *  the tick performs and the ranking that surface performs cannot diverge. */
const SETTLED_THEME_STATUSES = `(${INELIGIBLE_STATUSES.join(",")})`;

const MODEL = "google/gemini-2.5-flash" as const;
const MIN_SCORE = 0.12;
const FRESH_MS = 30 * 60 * 1000;

export type DerivedInsight = {
  id: string;
  themeId: string | null;
  kind: "prediction" | "risk" | "cost_of_inaction" | "hidden_connection";
  headline: string;
  detail: string;
  evidence: Record<string, unknown>;
  recommendedAction: { agent_slug: string; goal: string } | null;
  score: number;
  confidence: number | null;
  claim: string | null;
  horizonDate: string | null;
};

// FS-01: predictions and risk insights are falsifiable claims scored later by
// calibrate-tick. 30-90 day horizon matches the derivation prompt's own window.
const MIN_HORIZON_DAYS = 30;
const MAX_HORIZON_DAYS = 90;

export function clampHorizonDays(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return MIN_HORIZON_DAYS;
  return Math.min(MAX_HORIZON_DAYS, Math.max(MIN_HORIZON_DAYS, Math.round(n)));
}

function horizonDateFrom(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

type ThemeRow = {
  id: string;
  title: string;
  summary: string | null;
  severity: number;
  confidence: number | string;
  created_at: string;
  last_signal_at: string | null;
  novelty: number | null;
  status: string | null;
  /** Backing signal count. Maintained by the signals_theme_frequency trigger. */
  frequency: number | null;
};

const DERIVE_SYSTEM = `You are the Supaprod intelligence analyst. Given emerging product theme data, write a single insight.
Rules:
- Signal-first: lead with what matters, not the reasoning.
- Short: headline max 18 words, one sentence. detail max 2 sentences.
- Honest: never fabricate; ground strictly in the theme data provided.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- recommended_action.goal: a concrete next step a builder agent could run (max 200 chars).
- Output ONLY valid JSON matching the requested schema.`;

function toDerivedInsight(
  row: Record<string, unknown>,
  kind: DerivedInsight["kind"],
  score: number,
): DerivedInsight {
  const ra = (row.recommended_action ?? null) as { agent_slug?: string; goal?: string } | null;
  return {
    id: String(row.id),
    themeId: (row.theme_id as string | null) ?? null,
    kind,
    headline: String(row.headline ?? ""),
    detail: String(row.detail ?? ""),
    evidence: (row.evidence ?? {}) as Record<string, unknown>,
    recommendedAction:
      ra && ra.goal ? { agent_slug: ra.agent_slug ?? "strategist", goal: ra.goal } : null,
    score: typeof row.score === "number" ? row.score : score,
    confidence: (row.confidence as number | null) ?? null,
    claim: (row.claim as string | null) ?? null,
    horizonDate: (row.horizon_date as string | null) ?? null,
  };
}

async function fetchRankedThemes(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<Array<{ t: ThemeRow; s: number }>> {
  /**
   * THE DEFECT THIS CLOSES, named in insights.functions.ts and left live one
   * file over because that file belonged to another pass.
   *
   * The filter here was `.neq("status", "archived")` - one literal, matching
   * one of the five statuses that mean a person already settled the cluster,
   * and `archived` is not a value the column has ever held. Measured through
   * the Lovable MCP: the live statuses are new, active, investigating,
   * at_risk, confirmed and promoted. So the filter excluded NOTHING.
   *
   * Unlike its dead twin in insights.functions.ts, this path runs:
   * `deriveAllInsights` is called from the derive tick
   * (routes/api/public/hooks/derive-tick.ts). So every tick was ranking
   * clusters the user had already dismissed, merged or promoted, spending a
   * paid model call presenting one back as the single thing to focus on next
   * - on the one card whose entire job is to show that the brain acts on the
   * judgments you gave it. Handing back a bet somebody already made, or a
   * cluster they explicitly declined, is the most direct contradiction of that
   * claim the product could produce.
   *
   * IMPORTED, NEVER RETYPED. `INELIGIBLE_STATUSES` in @/lib/spine/promote is
   * canonical; `qualifies` gates the autonomous promote sweep on it. A
   * hand-copy here would have been the fourth, and a hand-copy is exactly how
   * `promoted` came to be missing from two of them.
   *
   * The `is_sample` guard lands in the same edit for the same reason: without
   * it the tick ranks seeded demo clusters beside real ones and can spend a
   * real model call recommending fictional work.
   */
  const { data: themes } = await supabase
    .from("themes")
    .select(
      "id,title,summary,severity,confidence,created_at,last_signal_at,novelty,status,frequency",
    )
    .eq("workspace_id", workspaceId)
    .not("status", "in", SETTLED_THEME_STATUSES)
    .eq("is_sample", false)
    .order("created_at", { ascending: false })
    .limit(60);
  const now = Date.now();
  return ((themes ?? []) as ThemeRow[])
    .map((t) => ({
      t,
      s: scoreTheme(
        {
          severity: t.severity,
          confidence: Number(t.confidence),
          createdAt: t.created_at,
          lastSignalAt: t.last_signal_at,
          novelty: t.novelty,
          // Same scorer, same inputs. The Brain must not rank a theme differently
          // from the surface the user just read it on.
          frequency: t.frequency,
        },
        now,
      ),
    }))
    .sort((a, b) => b.s - a.s);
}

async function resolveWorkspaceId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return (member?.workspace_id as string | undefined) ?? null;
}

function sanitizeField(s: string, maxLen: number): string {
  return s.replace(/[\r\n]+/g, " ").slice(0, maxLen);
}

function themeContext(t: ThemeRow, s: number): string {
  return `title: ${sanitizeField(t.title, 200)}
summary: ${sanitizeField(t.summary ?? "", 800)}
severity: ${t.severity}/5
confidence: ${Number(t.confidence)}
novelty: ${t.novelty ?? "unknown (treat as new)"}
score: ${s.toFixed(3)}`;
}

async function isThrottled(
  supabase: SupabaseClient,
  workspaceId: string,
  column: "prediction_throttle_until" | "risk_throttle_until",
): Promise<boolean> {
  const { data } = await supabase
    .from("workspaces")
    .select(column)
    .eq("id", workspaceId)
    .maybeSingle();
  const until = (data as Record<string, string | null> | null)?.[column] ?? null;
  return !!until && new Date(until).getTime() > Date.now();
}

export async function derivePrediction(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<DerivedInsight | null> {
  if (await isThrottled(supabase, workspaceId, "prediction_throttle_until")) return null;
  const ranked = await fetchRankedThemes(supabase, workspaceId);
  const top = ranked[0];
  if (!top || top.s < MIN_SCORE) return null;

  const now = Date.now();
  const dedupKey = `prediction:${top.t.id}:${new Date(now).toISOString().slice(0, 10)}`;
  const { data: existing } = await supabase
    .from("insights")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("dedup_key", dedupKey)
    .gte("created_at", new Date(now - FRESH_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return toDerivedInsight(existing as Record<string, unknown>, "prediction", top.s);

  const res = await callModel(supabase as never, userId, {
    surface: "sense",
    surface_ref: "derive_prediction",
    model: MODEL,
    workspaceId,
    responseFormat: "json_object",
    messages: [
      { role: "system", content: DERIVE_SYSTEM },
      {
        role: "user",
        content: `EMERGING THEME (top-ranked, score ${top.s.toFixed(3)}):
${themeContext(top.t, top.s)}

Given this emerging theme, what is the most likely outcome or market shift in the next 30-90 days if this pattern continues? State it as a single falsifiable claim someone could check later and say "true" or "false" about, plus how many days out it resolves.
Output JSON: {"headline":"...","detail":"...","claim":"a single checkable statement, e.g. 'X will happen by the horizon date'","horizon_days":30-90,"recommended_action":{"agent_slug":"strategist","goal":"..."}}`,
      },
    ],
  });
  const j = (res.json ?? {}) as {
    headline?: string;
    detail?: string;
    claim?: string;
    horizon_days?: number;
    recommended_action?: { agent_slug?: string; goal?: string };
  };
  if (!j.headline) return null;

  const recommended_action = j.recommended_action?.goal
    ? {
        agent_slug: j.recommended_action.agent_slug ?? "strategist",
        goal: j.recommended_action.goal,
      }
    : null;
  const evidence: Record<string, unknown> = {
    severity: top.t.severity,
    confidence: Number(top.t.confidence),
    novelty: top.t.novelty,
    score: top.s,
    title: top.t.title,
  };
  const horizonDays = clampHorizonDays(j.horizon_days);
  const claim = (j.claim ?? j.headline).slice(0, 500);

  const { data: row } = await supabase
    .from("insights")
    .upsert(
      {
        workspace_id: workspaceId,
        theme_id: top.t.id,
        kind: "prediction",
        headline: j.headline,
        detail: j.detail ?? "",
        evidence,
        recommended_action,
        score: top.s,
        confidence: Number(top.t.confidence),
        status: "open",
        dedup_key: dedupKey,
        claim,
        horizon_date: horizonDateFrom(horizonDays),
      },
      { onConflict: "workspace_id,dedup_key" },
    )
    .select("*")
    .single();

  return row ? toDerivedInsight(row as Record<string, unknown>, "prediction", top.s) : null;
}

export async function deriveRisk(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<DerivedInsight | null> {
  if (await isThrottled(supabase, workspaceId, "risk_throttle_until")) return null;
  const ranked = await fetchRankedThemes(supabase, workspaceId);
  const top = ranked[0];
  if (!top || top.s < MIN_SCORE) return null;

  const now = Date.now();
  const dedupKey = `risk:${top.t.id}:${new Date(now).toISOString().slice(0, 10)}`;
  const { data: existing } = await supabase
    .from("insights")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("dedup_key", dedupKey)
    .gte("created_at", new Date(now - FRESH_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return toDerivedInsight(existing as Record<string, unknown>, "risk", top.s);

  const res = await callModel(supabase as never, userId, {
    surface: "sense",
    surface_ref: "derive_risk",
    model: MODEL,
    workspaceId,
    responseFormat: "json_object",
    messages: [
      { role: "system", content: DERIVE_SYSTEM },
      {
        role: "user",
        content: `EMERGING THEME (top-ranked, score ${top.s.toFixed(3)}):
${themeContext(top.t, top.s)}

Given this emerging theme, what is the biggest risk if the team does NOT act on it? Be concrete. State it as a single falsifiable claim someone could check later and say "true" or "false" about, plus how many days out it resolves.
Output JSON: {"headline":"...","detail":"...","claim":"a single checkable statement, e.g. 'X will happen by the horizon date'","horizon_days":30-90,"recommended_action":{"agent_slug":"researcher","goal":"..."}}`,
      },
    ],
  });
  const j = (res.json ?? {}) as {
    headline?: string;
    detail?: string;
    claim?: string;
    horizon_days?: number;
    recommended_action?: { agent_slug?: string; goal?: string };
  };
  if (!j.headline) return null;

  const recommended_action = j.recommended_action?.goal
    ? {
        agent_slug: j.recommended_action.agent_slug ?? "researcher",
        goal: j.recommended_action.goal,
      }
    : null;
  const evidence: Record<string, unknown> = {
    severity: top.t.severity,
    confidence: Number(top.t.confidence),
    novelty: top.t.novelty,
    score: top.s,
    title: top.t.title,
  };
  const horizonDays = clampHorizonDays(j.horizon_days);
  const claim = (j.claim ?? j.headline).slice(0, 500);

  const { data: row } = await supabase
    .from("insights")
    .upsert(
      {
        workspace_id: workspaceId,
        theme_id: top.t.id,
        kind: "risk",
        headline: j.headline,
        detail: j.detail ?? "",
        evidence,
        recommended_action,
        score: top.s,
        confidence: Number(top.t.confidence),
        status: "open",
        dedup_key: dedupKey,
        claim,
        horizon_date: horizonDateFrom(horizonDays),
      },
      { onConflict: "workspace_id,dedup_key" },
    )
    .select("*")
    .single();

  return row ? toDerivedInsight(row as Record<string, unknown>, "risk", top.s) : null;
}

export async function deriveCostOfInaction(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<DerivedInsight | null> {
  const ranked = await fetchRankedThemes(supabase, workspaceId);
  const top = ranked[0];
  if (!top || top.s < MIN_SCORE) return null;

  const now = Date.now();
  const dedupKey = `cost_of_inaction:${top.t.id}:${new Date(now).toISOString().slice(0, 10)}`;
  const { data: existing } = await supabase
    .from("insights")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("dedup_key", dedupKey)
    .gte("created_at", new Date(now - FRESH_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing)
    return toDerivedInsight(existing as Record<string, unknown>, "cost_of_inaction", top.s);

  const res = await callModel(supabase as never, userId, {
    surface: "sense",
    surface_ref: "derive_cost_of_inaction",
    model: MODEL,
    workspaceId,
    responseFormat: "json_object",
    messages: [
      { role: "system", content: DERIVE_SYSTEM },
      {
        role: "user",
        content: `EMERGING THEME (top-ranked, score ${top.s.toFixed(3)}):
${themeContext(top.t, top.s)}

Given this theme, quantify the opportunity cost of waiting 30 more days. What signal will be missed, what competitor gains ground, what user trust erodes?
Output JSON: {"headline":"...","detail":"...","recommended_action":{"agent_slug":"strategist","goal":"..."}}`,
      },
    ],
  });
  const j = (res.json ?? {}) as {
    headline?: string;
    detail?: string;
    recommended_action?: { agent_slug?: string; goal?: string };
  };
  if (!j.headline) return null;

  const recommended_action = j.recommended_action?.goal
    ? {
        agent_slug: j.recommended_action.agent_slug ?? "strategist",
        goal: j.recommended_action.goal,
      }
    : null;
  const evidence: Record<string, unknown> = {
    severity: top.t.severity,
    confidence: Number(top.t.confidence),
    novelty: top.t.novelty,
    score: top.s,
    title: top.t.title,
  };

  const { data: row } = await supabase
    .from("insights")
    .upsert(
      {
        workspace_id: workspaceId,
        theme_id: top.t.id,
        kind: "cost_of_inaction",
        headline: j.headline,
        detail: j.detail ?? "",
        evidence,
        recommended_action,
        score: top.s,
        confidence: Number(top.t.confidence),
        status: "open",
        dedup_key: dedupKey,
      },
      { onConflict: "workspace_id,dedup_key" },
    )
    .select("*")
    .single();

  return row ? toDerivedInsight(row as Record<string, unknown>, "cost_of_inaction", top.s) : null;
}

export async function deriveHiddenConnection(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<DerivedInsight | null> {
  const ranked = await fetchRankedThemes(supabase, workspaceId);
  // Need at least 2 themes above MIN_SCORE to find a connection.
  const eligible = ranked.filter((r) => r.s >= MIN_SCORE).slice(0, 3);
  if (eligible.length < 2) return null;

  const now = Date.now();
  // Dedup key includes all top theme ids so a different theme set produces a new insight.
  const themeIds = eligible.map((r) => r.t.id).join("+");
  const dedupKey = `hidden_connection:${themeIds}:${new Date(now).toISOString().slice(0, 10)}`;
  const { data: existing } = await supabase
    .from("insights")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("dedup_key", dedupKey)
    .gte("created_at", new Date(now - FRESH_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing)
    return toDerivedInsight(
      existing as Record<string, unknown>,
      "hidden_connection",
      eligible[0].s,
    );

  const themesBlock = eligible
    .map((r, i) => `THEME ${i + 1} (score ${r.s.toFixed(3)}):\n${themeContext(r.t, r.s)}`)
    .join("\n\n");

  const res = await callModel(supabase as never, userId, {
    surface: "sense",
    surface_ref: "derive_hidden_connection",
    model: MODEL,
    workspaceId,
    responseFormat: "json_object",
    messages: [
      { role: "system", content: DERIVE_SYSTEM },
      {
        role: "user",
        content: `${themesBlock}

Given these ${eligible.length} concurrent themes, what non-obvious connection or underlying cause links them? Surface the hidden pattern.
Output JSON: {"headline":"...","detail":"...","recommended_action":{"agent_slug":"researcher","goal":"..."}}`,
      },
    ],
  });
  const j = (res.json ?? {}) as {
    headline?: string;
    detail?: string;
    recommended_action?: { agent_slug?: string; goal?: string };
  };
  if (!j.headline) return null;

  const recommended_action = j.recommended_action?.goal
    ? {
        agent_slug: j.recommended_action.agent_slug ?? "researcher",
        goal: j.recommended_action.goal,
      }
    : null;
  // Evidence captures all contributing themes.
  const evidence: Record<string, unknown> = {
    themes: eligible.map((r) => ({ id: r.t.id, title: r.t.title, score: r.s })),
    topScore: eligible[0].s,
  };

  const { data: row } = await supabase
    .from("insights")
    .upsert(
      {
        workspace_id: workspaceId,
        // hidden_connection spans multiple themes; store the top-ranked one as the anchor.
        theme_id: eligible[0].t.id,
        kind: "hidden_connection",
        headline: j.headline,
        detail: j.detail ?? "",
        evidence,
        recommended_action,
        score: eligible[0].s,
        confidence: Number(eligible[0].t.confidence),
        status: "open",
        dedup_key: dedupKey,
      },
      { onConflict: "workspace_id,dedup_key" },
    )
    .select("*")
    .single();

  return row
    ? toDerivedInsight(row as Record<string, unknown>, "hidden_connection", eligible[0].s)
    : null;
}

export async function deriveAllInsights(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<DerivedInsight[]> {
  const results = await Promise.allSettled([
    derivePrediction(supabase, userId, workspaceId),
    deriveRisk(supabase, userId, workspaceId),
    deriveCostOfInaction(supabase, userId, workspaceId),
    deriveHiddenConnection(supabase, userId, workspaceId),
  ]);
  return results
    .filter(
      (r): r is PromiseFulfilledResult<DerivedInsight> =>
        r.status === "fulfilled" && r.value !== null,
    )
    .map((r) => r.value);
}
