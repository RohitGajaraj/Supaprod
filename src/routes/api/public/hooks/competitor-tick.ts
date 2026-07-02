import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { callModel } from "@/lib/ai/runtime.server";
import { withJobRun } from "@/lib/observability";
import { writeSignals } from "@/lib/sources/sink.server";
import { recordLineage } from "@/lib/lineage.functions";
import { hashContent } from "@/lib/scout/diff";

/**
 * JNY-01: the strategy head — weekly competitor + tech-shift briefs.
 *
 * Upgrades scout-tick from "raw diff signals in the feed" to a structured,
 * weekly-summarized registry: reads the week's already-ingested
 * `scout_competitor` / `scout_platform` signals (no new web fetch, scout-tick
 * already paid that cost), synthesizes ONE brief per non-empty kind via AI,
 * writes it through the same `writeSignals` keystone every source uses, and
 * links every contributing raw signal into it (`artifact_lineage`,
 * relation=derived-from) so FS-02's assumption watchers can walk from a
 * decision to the competitor moves that touch it.
 *
 * Runs weekly (migration schedules it Monday 08:00 UTC). No FIRECRAWL gate:
 * this reads signals scout-tick already collected, it makes zero new web
 * calls. Idempotent: externalId is keyed by ISO week, so a re-run this week
 * is a no-op at the sink.
 */

const MAX_WORKSPACES = 5;
const LOOKBACK_DAYS = 7;
const MAX_SIGNALS_PER_BRIEF = 25;

type BriefKind = "competitor" | "tech_shift";

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

  const { data: ownerProf } = await supabaseAdmin
    .from("profiles")
    .select("default_model")
    .eq("id", ownerId)
    .maybeSingle();
  const agenticModel =
    (ownerProf as { default_model?: string | null } | null)?.default_model?.trim() ||
    "google/gemini-2.5-flash";

  const res = await callModel(supabaseAdmin as never, ownerId, {
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

  const db = supabaseAdmin as unknown as SupabaseClient;
  const { data: briefRow } = await db
    .from("signals")
    .select("id")
    .eq("user_id", ownerId)
    .eq("workspace_id", workspaceId)
    .eq("external_id", externalId)
    .maybeSingle();
  const briefId = (briefRow as { id?: string } | null)?.id ?? null;

  if (briefId) {
    for (const r of raw) {
      await recordLineage(supabaseAdmin as never, ownerId, {
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
function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export const Route = createFileRoute("/api/public/hooks/competitor-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;

        return withJobRun("ambient.competitor-tick", async () => {
          const { data: workspaces, error: wsErr } = await supabaseAdmin
            .from("workspaces")
            .select("id, owner_id")
            .eq("auto_scout_enabled", true)
            .limit(MAX_WORKSPACES);
          if (wsErr) return json({ ok: false, error: wsErr.message }, 500);

          const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();
          const db = supabaseAdmin as unknown as SupabaseClient;
          const results: Array<{
            workspace_id: string;
            competitor?: { raw: number; briefWritten: boolean };
            tech_shift?: { raw: number; briefWritten: boolean };
            error?: string;
          }> = [];

          for (const ws of (workspaces ?? []) as Array<{ id: string; owner_id: string }>) {
            try {
              const outcome: (typeof results)[number] = { workspace_id: ws.id };
              for (const kind of ["competitor", "tech_shift"] as BriefKind[]) {
                const { data: raw } = await db
                  .from("signals")
                  .select("id,title,content")
                  .eq("workspace_id", ws.id)
                  .eq("source", BRIEF_SPEC[kind].rawSource)
                  .gte("created_at", since)
                  .order("created_at", { ascending: false })
                  .limit(MAX_SIGNALS_PER_BRIEF);
                const rows = (raw ?? []) as RawSignalRow[];
                if (rows.length === 0) {
                  outcome[kind] = { raw: 0, briefWritten: false };
                  continue;
                }
                const { inserted } = await synthesizeBrief(kind, ws.id, ws.owner_id, rows);
                outcome[kind] = { raw: rows.length, briefWritten: inserted };
              }
              results.push(outcome);
            } catch (e) {
              results.push({
                workspace_id: ws.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return json({ ok: true, processed: workspaces?.length ?? 0, results });
        });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
