// SF-FOCUS (Signal Fabric Phase 1) — getFocusNext: the one ranked "Focus on this next".
//
// Ranks the workspace's themes LIVE via the pure scoreTheme (severity x recency x
// novelty-vs-memory) with NO AI, then makes ONE derive call for the single top theme to turn
// it into a concrete recommendation. Uses the "sense" CallSurface (routed in Phase 2).
// Dedup'd per (workspace, theme, day) so a Today reload reuses a fresh insight instead of
// re-spending. Returns null when there is no clear next (calm-front: render nothing).

import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callModel } from "@/lib/ai/runtime.server"; // imported (called), never edited
import { scoreTheme } from "@/lib/brain/score";
import { summarizeCalibration } from "@/lib/brain/calibrate-insights.server";
import { INELIGIBLE_STATUSES } from "@/lib/spine/promote"; // pure, dependency-free

const MODEL = "google/gemini-2.5-flash" as const; // same as getBrainAnalysis
const MIN_SCORE = 0.12; // calm gate: below this, there is no clear "next" → return null
const FRESH_MS = 30 * 60 * 1000; // reuse an insight derived within the last 30 min

/**
 * Every theme status that means a person already settled this cluster.
 *
 * WHAT WAS HERE: `.neq("status", "archived")`. One value out of the five in
 * `INELIGIBLE_STATUSES` below -- and one of the TWO in that list that nothing
 * in src/ writes at all, because `done` is equally unwritten. The only
 * theme-status writes anywhere are `new`/`dismissed` (the setThemeStatus enum,
 * discovery.functions.ts:548, applied at :576), `merged` (:671) and `promoted`
 * (:1058). Re-measured 2026-08-06: the live theme statuses are new 161, active
 * 64, investigating 14, at_risk 9, confirmed 8, promoted 1 -- SIX values, and
 * `archived` is not one of them, so the filter excluded nothing at all. (Those
 * six are what the column holds; the five above are what this filter drops.
 * The two lists overlap in exactly one place, `promoted`.) A cluster somebody
 * dismissed on /discover, or promoted into a bet, stayed in this ranking, could
 * be the top-scoring theme, and got a paid model call spent presenting it back
 * as the one thing to focus on next -- on the one card whose job is to show that
 * the brain acts on the judgments you gave it.
 *
 * IMPORTED, NEVER RETYPED. `INELIGIBLE_STATUSES` in @/lib/spine/promote is the
 * canonical list: `qualifies` gates the autonomous promote sweep on it and
 * DiscoverSurface.tsx:463 keeps a hand-copy in step with it. A hand-copy here
 * would be the third, and a hand-copy is exactly how `promoted` came to be
 * missing from two of them. A status added to that one list now reaches this
 * ranking with no edit to this file.
 *
 * THE INVENTORY ABOVE IS THE HAND-COPY INVENTORY, NOT THE DEFECT INVENTORY, and
 * the defect is STILL LIVE one file over. `fetchRankedThemes` in
 * brain/derive-insights.server.ts:87-92 runs the identical one-literal
 * `.neq("status", "archived")` against the identical `themes` table, feeds the
 * identical `scoreTheme`, discards the read error, and has no `is_sample`
 * filter either. Unlike `getInsightRail` below it is NOT dead: `deriveAllInsights`
 * is called from routes/api/public/hooks/derive-tick.ts:7, so the autonomous
 * derive tick is still ranking dismissed, merged and promoted clusters today.
 * Fixing it is the same two-line change made here (import the list, swap the
 * filter) plus the `is_sample` guard; it was left alone only because that file
 * belonged to another pass. Do not read the paragraph above as "the sweep is
 * finished".
 *
 * WHAT IT STILL MISSES, because that gap is in the data and not in this list.
 * 46 themes have an opportunity pointing at them, so they were promoted in
 * fact, and only 1 of the 46 carries status 'promoted' -- the status write
 * (discovery.functions.ts:1058) landed after most of them were promoted. So
 * this excludes 1 live theme today, not 46. Closing the other 45 is a backfill
 * nobody should run blind: 44 of them sit in `active`/`at_risk`/`confirmed`,
 * which are Discover's own escalation states, and overwriting those to
 * 'promoted' would destroy information this filter does not need.
 *
 * Rendered once as a PostgREST `in` list. Case-sensitive, unlike `qualifies`,
 * which lowercases first; every status this repo writes is lowercase and
 * `themes.status` is NOT NULL DEFAULT 'new', so nothing escapes on either count.
 * The serialisation is not a guess: the same `` `(${arr.join(",")})` `` fed to
 * `.not(col, "in", ...)` already ships in production at
 * proof-surface.functions.ts:141-148, on the /proof scorecard.
 *
 * NOTHING IS EXPLAINED AT THE CALL SITE ON PURPOSE. `the-brain-does-not-rank-
 * fiction.test.ts` asserts that `.eq("is_sample", false)` sits within 1200
 * characters of `.from("themes")`, and that gap is already 1051. Explain
 * changes to the themes read here, not beside it.
 */
const SETTLED_THEME_STATUSES = `(${INELIGIBLE_STATUSES.join(",")})`;

export type FocusEvidence = {
  severity: number;
  confidence: number;
  novelty: number | null;
  recencyHours: number;
  score: number;
  title: string;
};

export type FocusInsight = {
  id: string;
  themeId: string | null;
  headline: string;
  detail: string;
  evidence: FocusEvidence;
  recommendedAction: { agent_slug: string; goal: string } | null;
  score: number;
  confidence: number | null;
};

const FOCUS_SYSTEM = `You are the Supaprod intelligence analyst. Given the single highest-priority emerging theme from a PM's signal stream, write ONE "focus on this next" recommendation.
Rules:
- Signal-first: lead with what to do, not the reasoning.
- Short: headline max 18 words, one sentence. detail max 2 sentences.
- Honest: never fabricate; ground strictly in the theme provided.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer).
- recommended_action.goal: a concrete next step a builder agent could run (max 200 chars).
- Output ONLY JSON: {"headline":"...","detail":"...","recommended_action":{"agent_slug":"strategist","goal":"..."}}`;

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
};

function toFocusInsight(row: Record<string, unknown>, score: number): FocusInsight {
  const ra = (row.recommended_action ?? null) as { agent_slug?: string; goal?: string } | null;
  return {
    id: String(row.id),
    themeId: (row.theme_id as string | null) ?? null,
    headline: String(row.headline ?? ""),
    detail: String(row.detail ?? ""),
    evidence: (row.evidence ?? {}) as FocusEvidence,
    recommendedAction:
      ra && ra.goal ? { agent_slug: ra.agent_slug ?? "strategist", goal: ra.goal } : null,
    score: typeof row.score === "number" ? row.score : score,
    confidence: (row.confidence as number | null) ?? null,
  };
}

function focusPrompt(t: ThemeRow, score: number): string {
  return `EMERGING THEME (top-ranked by severity x recency x novelty-vs-memory, score ${score.toFixed(3)}):
title: ${t.title}
summary: ${t.summary ?? ""}
severity: ${t.severity}/5
confidence: ${Number(t.confidence)}
novelty: ${t.novelty ?? "unknown (treat as new)"}

Write the one focus-next recommendation as JSON.`;
}

export const getFocusNext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FocusInsight | null> => {
    const { supabase, userId } = context as unknown as { supabase: SupabaseClient; userId: string };

    /**
     * A REFUSED RPC IS NOT "THIS USER HAS NO WORKSPACE". On error `ws` is null,
     * the early return below fires, and the themes read never runs -- so the
     * log on THAT read cannot cover this path. It was the one failure mode in
     * this function that was completely silent, and it is the house shape: a
     * discarded read error standing in as evidence of absence. Behaviour is
     * unchanged (returning null is still the safe answer); this only names it.
     */
    const { data: ws, error: wsErr } = await supabase.rpc("current_user_default_workspace");
    if (wsErr) console.error(`[focus-next] workspace lookup failed: ${wsErr.message}`);
    const workspaceId = (ws as string | null) ?? null;
    if (!workspaceId) return null;

    // Rank themes LIVE — no AI for ranking.
    const { data: themes, error: themesErr } = await supabase
      .from("themes")
      .select("id,title,summary,severity,confidence,created_at,last_signal_at,novelty,status")
      .eq("workspace_id", workspaceId)
      .not("status", "in", SETTLED_THEME_STATUSES)
      /**
       * NEVER RECOMMEND A THEME MADE ONLY OF EXAMPLES.
       *
       * Onboarding seeds twenty signals into the user's REAL workspace and they
       * cluster like any others, so on a new workspace the only themes that
       * exist are the seeded ones. This function took the top-ranked theme,
       * spent a model call on it, and the card above it on Today reads "Ranked
       * against every outcome this workspace has already settled" -- the
       * product's single most important claim, demonstrated with invented
       * evidence, in the first place a stranger looks.
       *
       * Measured before the column existed: 16 of 257 themes built entirely
       * from sample signals. A theme that has since attracted one real signal
       * is not filtered, because it is about the user's own product now.
       */
      .eq("is_sample", false)
      .order("created_at", { ascending: false })
      .limit(60);
    /**
     * A REFUSED READ IS NOT AN EMPTY WORKSPACE. On error `themes` is null, the
     * `?? []` below turns that into no candidates, and the card renders nothing
     * -- which is byte-for-byte the calm gate this function uses to mean "there
     * is no clear next". The two are indistinguishable from outside. This does
     * NOT change the behaviour (rendering nothing is still the safe answer);
     * it only makes the difference visible in the logs.
     */
    if (themesErr) console.error(`[focus-next] theme read failed: ${themesErr.message}`);
    const now = Date.now();
    const ranked = ((themes ?? []) as ThemeRow[])
      .map((t) => ({
        t,
        s: scoreTheme(
          {
            severity: t.severity,
            confidence: Number(t.confidence),
            createdAt: t.created_at,
            lastSignalAt: t.last_signal_at,
            novelty: t.novelty,
          },
          now,
        ),
      }))
      .sort((a, b) => b.s - a.s);
    const top = ranked[0];
    if (!top || top.s < MIN_SCORE) return null;

    // Dedup / freshness: reuse a recent insight rather than re-deriving on every Today load.
    const dedupKey = `next_best_action:${top.t.id}:${new Date(now).toISOString().slice(0, 10)}`;
    const { data: existing, error: existingErr } = await supabase
      .from("insights")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("dedup_key", dedupKey)
      .gte("created_at", new Date(now - FRESH_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    // This read failing is not free: a refusal is indistinguishable from "no
    // fresh insight", so every Today load falls through and pays for another
    // model call. Behaviour is deliberately unchanged -- deriving is still the
    // right answer when we cannot prove a fresh one exists -- but a silent
    // repeat spend should not be invisible.
    if (existingErr) console.error(`[focus-next] dedup read failed: ${existingErr.message}`);
    if (existing) return toFocusInsight(existing as Record<string, unknown>, top.s);

    const res = await callModel(supabase as never, userId, {
      surface: "sense",
      surface_ref: "focus_next",
      model: MODEL,
      workspaceId,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: FOCUS_SYSTEM },
        { role: "user", content: focusPrompt(top.t, top.s) },
      ],
    });
    const j = (res.json ?? {}) as {
      headline?: string;
      detail?: string;
      recommended_action?: { agent_slug?: string; goal?: string };
    };
    if (!j.headline) return null;

    const recencyHours = Math.max(
      0,
      (now - (Date.parse(top.t.last_signal_at ?? "") || Date.parse(top.t.created_at))) / 3_600_000,
    );
    const evidence: FocusEvidence = {
      severity: top.t.severity,
      confidence: Number(top.t.confidence),
      novelty: top.t.novelty,
      recencyHours,
      score: top.s,
      title: top.t.title,
    };
    const recommended_action = j.recommended_action?.goal
      ? {
          agent_slug: j.recommended_action.agent_slug ?? "strategist",
          goal: j.recommended_action.goal,
        }
      : null;

    const { data: row, error: upsertErr } = await supabase
      .from("insights")
      .upsert(
        {
          workspace_id: workspaceId,
          theme_id: top.t.id,
          kind: "next_best_action",
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
    /**
     * supabase-js RESOLVES a refused write. The model call above is already
     * paid for by the time this runs, so an RLS refusal -- or an insert that
     * lands but cannot be read back -- loses the derivation and the card goes
     * blank, with nothing anywhere saying why. `row` being null is still the
     * only thing that decides the return below; this only makes the loss
     * visible. It does not retry and it does not recover the spend.
     */
    if (upsertErr) console.error(`[focus-next] insight upsert failed: ${upsertErr.message}`);

    return row ? toFocusInsight(row as Record<string, unknown>, top.s) : null;
  });

// ---------------------------------------------------------------------------
// InsightRail — the open insights of the four rail kinds, scored DESC, limit 6.
// getFocusNext owns the single top-ranked action; the push lane owns the three
// PushKinds; this rail owns the four foresight kinds named in RAIL_KINDS.
// Returns an empty array (never null) so the caller can hide the rail cleanly.
// ---------------------------------------------------------------------------

/**
 * The kinds this rail renders, and the one place the list lives.
 *
 * WAS `.neq("kind", "next_best_action")`: one excluded literal against a column
 * that holds EIGHT values live -- next_best_action 32, prediction 28, risk 21,
 * ground_shift 9, bet_contradiction 8, cost_of_inaction 7, assumption_miss 7,
 * hidden_connection 7. So the rail also selected the 24 `ground_shift`,
 * `bet_contradiction` and `assumption_miss` rows, which are push-insights.ts's
 * three PushKinds and belong to PushedInsights.tsx, and then `toInsightRailItem`
 * cast every one of them to a union that does not contain them.
 *
 * Nobody saw it because nothing renders this function today: the InsightRail
 * component was dropped from Today in OBS-04 and no caller survives anywhere in
 * src/. It would have shown a duplicate of the push lane the moment somebody
 * mounted it, and the cast would have gone on lying about the kind.
 *
 * Written as an INCLUSION list and the type below is derived from it, so the
 * declared kinds and the queried kinds cannot drift, and a ninth insight kind
 * stays off the rail until somebody adds it here on purpose. Whether the three
 * PushKinds should ever appear here is a product call for whoever re-mounts the
 * rail; today they are the push lane's and this leaves them there.
 */
const RAIL_KINDS = ["prediction", "risk", "cost_of_inaction", "hidden_connection"] as const;

export type InsightRailItem = {
  id: string;
  kind: (typeof RAIL_KINDS)[number];
  headline: string;
  detail: string;
  evidence: Record<string, string | number | boolean | null>;
  recommendedAction: { agent_slug: string; goal: string } | null;
  score: number;
  confidence: number | null;
  themeId: string | null;
  createdAt: string;
  /**
   * FS-04: FS-01's rolling calibration hit rate for this kind ("Supaprod
   * called N of the last M"), so the card reads as earned trust rather than
   * an unchecked claim. Only set for `prediction`/`risk` (the calibrated
   * kinds) and only once at least one call has resolved — never a fabricated
   * "not enough data yet" filler on every card.
   */
  calibrationLabel: string | null;
};

function toInsightRailItem(
  row: Record<string, unknown>,
  calibrationLabel: string | null = null,
): InsightRailItem {
  const ra = (row.recommended_action ?? null) as { agent_slug?: string; goal?: string } | null;
  return {
    id: String(row.id),
    // The cast holds because the only caller filters `kind` to RAIL_KINDS.
    // `insights.kind` is NOT NULL, so the fallback is belt-and-braces and has
    // never fired; reuse this helper against an unfiltered read and both of
    // those stop being true.
    kind: (row.kind as InsightRailItem["kind"]) ?? "prediction",
    headline: String(row.headline ?? ""),
    detail: String(row.detail ?? ""),
    evidence: (row.evidence ?? {}) as Record<string, string | number | boolean | null>,
    recommendedAction:
      ra && ra.goal ? { agent_slug: ra.agent_slug ?? "strategist", goal: ra.goal } : null,
    score: typeof row.score === "number" ? row.score : 0,
    confidence: (row.confidence as number | null) ?? null,
    themeId: (row.theme_id as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
    calibrationLabel,
  };
}

export const getInsightRail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InsightRailItem[]> => {
    const { supabase, userId } = context as unknown as { supabase: SupabaseClient; userId: string };

    // Same silent-absence shape as getFocusNext's workspace lookup above, and
    // the same treatment: an empty rail is still the safe answer, but a refused
    // rpc no longer reads as "no workspace" with nothing anywhere saying so.
    const { data: ws, error: wsErr } = await supabase.rpc("current_user_default_workspace");
    if (wsErr) console.error(`[insight-rail] workspace lookup failed: ${wsErr.message}`);
    const workspaceId = (ws as string | null) ?? null;
    if (!workspaceId) return [];

    const { data: rows, error: rowsErr } = await supabase
      .from("insights")
      .select(
        "id,kind,headline,detail,evidence,recommended_action,score,confidence,theme_id,created_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("status", "open")
      .in("kind", [...RAIL_KINDS])
      .order("score", { ascending: false, nullsFirst: false })
      .limit(6);
    // A refused read and a genuinely empty rail both arrive here as `[]`, and
    // the caller hides the rail either way. Unchanged behaviour, logged cause.
    if (rowsErr) console.error(`[insight-rail] insights read failed: ${rowsErr.message}`);

    const items = (rows ?? []) as Record<string, unknown>[];

    // FS-04: one calibration lookup per calibrated kind actually present
    // (never per-row), so a full rail never costs more than two extra reads.
    const calibratedKinds = Array.from(
      new Set(items.map((r) => r.kind as string).filter((k) => k === "prediction" || k === "risk")),
    ) as Array<"prediction" | "risk">;
    const labelByKind = new Map<"prediction" | "risk", string | null>(
      await Promise.all(
        calibratedKinds.map(async (kind) => {
          const summary = await summarizeCalibration(supabase, workspaceId, kind);
          return [kind, summary.resolved > 0 ? summary.recentLabel : null] as const;
        }),
      ),
    );

    return items.map((row) =>
      toInsightRailItem(row, labelByKind.get(row.kind as "prediction" | "risk") ?? null),
    );
  });
