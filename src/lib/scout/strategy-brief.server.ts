// JNY-01 strategy head: the weekly competitor + tech-shift brief pass for ONE
// workspace. Extracted from the competitor-tick route (moved, not duplicated)
// so two callers share it: the competitor-tick cron sweeping every opted-in
// workspace, and SW-4 loop mode running it as a user-owned governed loop.
//
// Reads the week's already-ingested scout signals (no new web fetch, the
// scout-tick already paid that cost), synthesizes ONE brief per non-empty
// kind via AI, writes it through the same writeSignals keystone every source
// uses, and links every contributing raw signal into it (artifact_lineage,
// relation=derived-from). Idempotent: externalId is keyed by ISO week, so a
// re-run inside the same week is a no-op at the sink.

import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";
import { writeSignals } from "@/lib/sources/sink.server";
import { recordLineage } from "@/lib/lineage.functions";

export const MAX_SIGNALS_PER_BRIEF = 25;
export const BRIEF_LOOKBACK_DAYS = 7;

export type BriefKind = "competitor" | "tech_shift";

const BRIEF_SPEC: Record<
  BriefKind,
  { rawSource: string; briefSource: string; label: string; system: string }
> = {
  competitor: {
    rawSource: "scout_competitor",
    briefSource: "strategy_competitor_brief",
    label: "Weekly competitor brief",
    system: `You are a competitive intelligence analyst. Given a week's worth of raw competitor-surface diffs, write a concise 3-5 bullet weekly brief (plain text, no markdown headers, no em dashes).
Each bullet: one real move (a pricing change, a launch, a positioning shift) worth a PM knowing about, not a restatement of the raw text.
Group near-duplicate diffs from the same competitor into one bullet. Return only the bullets, nothing else.`,
  },
  tech_shift: {
    rawSource: "scout_platform",
    briefSource: "strategy_tech_shift_brief",
    label: "Tech-shift brief",
    system: `You are a platform-risk analyst. Given a week's worth of raw API/SDK/platform changelog diffs, write a concise 3-5 bullet tech-shift brief (plain text, no markdown headers, no em dashes).
Each bullet: one real shift (a deprecation, a breaking change, a new capability) that could affect how a product built on this platform ships. Return only the bullets, nothing else.`,
  },
};

type RawSignalRow = { id: string; title: string; content: string | null };

async function synthesizeBrief(
  client: SupabaseClient,
  kind: BriefKind,
  workspaceId: string,
  ownerId: string,
  raw: RawSignalRow[],
): Promise<{ inserted: boolean; briefId: string | null }> {
  const spec = BRIEF_SPEC[kind];
  const snippets = raw
    .slice(0, MAX_SIGNALS_PER_BRIEF)
    .map((r, i) => `[${i + 1}] ${r.title}\n${(r.content ?? "").slice(0, 400)}`)
    .join("\n\n");

  const { data: ownerProf } = await client
    .from("profiles")
    .select("default_model")
    .eq("id", ownerId)
    .maybeSingle();
  const agenticModel =
    (ownerProf as { default_model?: string | null } | null)?.default_model?.trim() ||
    "google/gemini-2.5-flash";

  const res = await callModel(client as never, ownerId, {
    surface: "sense",
    surface_ref: `strategy-head:${kind}:${workspaceId}`,
    model: agenticModel,
    fallbackModel: "anthropic/claude-haiku-4-5-20251001",
    messages: [
      { role: "system", content: spec.system },
      { role: "user", content: snippets },
    ],
  });

  const briefContent = (res.output ?? "").trim();
  if (!briefContent) return { inserted: false, briefId: null };

  // ISO week key so a re-run inside the same week dedups at the sink.
  const weekKey = isoWeekKey(new Date());
  const externalId = `strategy-head:${workspaceId}:${kind}:${weekKey}`;

  const writeRes = await writeSignals(ownerId, workspaceId, [
    {
      externalId,
      source: spec.briefSource,
      sourceKind: "web_scout",
      title: `${spec.label}: week of ${weekKey}`,
      content: briefContent,
      tags: ["scout", "strategy", "weekly-brief", kind],
      untrusted: true,
    },
  ]);

  if (writeRes.inserted === 0) return { inserted: false, briefId: null };

  const { data: briefRow } = await client
    .from("signals")
    .select("id")
    .eq("user_id", ownerId)
    .eq("workspace_id", workspaceId)
    .eq("external_id", externalId)
    .maybeSingle();
  const briefId = (briefRow as { id?: string } | null)?.id ?? null;

  if (briefId) {
    for (const r of raw) {
      await recordLineage(client as never, ownerId, {
        parent_kind: "signal",
        parent_id: r.id,
        child_kind: "signal",
        child_id: briefId,
        relation: "derived-from",
        rationale: `Summarized into the ${spec.label.toLowerCase()}`,
        created_by_agent: "strategy-head",
      });
    }
  }

  return { inserted: true, briefId };
}

/** ISO week label, e.g. "2026-W27". Deterministic, no external dep. */
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export interface StrategyBriefPassResult {
  competitor: { raw: number; briefWritten: boolean };
  tech_shift: { raw: number; briefWritten: boolean };
}

/** The whole per-workspace pass: both brief kinds, each fed by the last
 *  BRIEF_LOOKBACK_DAYS of raw scout signals. */
export async function runStrategyBriefPass(
  client: SupabaseClient,
  ownerId: string,
  workspaceId: string,
): Promise<StrategyBriefPassResult> {
  const since = new Date(Date.now() - BRIEF_LOOKBACK_DAYS * 86_400_000).toISOString();
  const result: StrategyBriefPassResult = {
    competitor: { raw: 0, briefWritten: false },
    tech_shift: { raw: 0, briefWritten: false },
  };

  for (const kind of ["competitor", "tech_shift"] as BriefKind[]) {
    const { data: raw } = await client
      .from("signals")
      .select("id,title,content")
      .eq("workspace_id", workspaceId)
      .eq("source", BRIEF_SPEC[kind].rawSource)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_SIGNALS_PER_BRIEF);
    const rows = (raw ?? []) as RawSignalRow[];
    if (rows.length === 0) continue;
    const { inserted } = await synthesizeBrief(client, kind, workspaceId, ownerId, rows);
    result[kind] = { raw: rows.length, briefWritten: inserted };
  }

  return result;
}
