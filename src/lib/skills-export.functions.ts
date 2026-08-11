/**
 * RPT-15: the ledger as an executable skills-file export. Reformats the same
 * decisions/outcomes/taste data the JSON export already covers (U6,
 * exportWorkspace) as an AGENTS.md-style markdown bundle - mountable as
 * project context into Claude Code, Codex, or any AI coding fleet. No new
 * data model: this is a formatter over existing tables, regenerated on
 * demand, never a stored artifact of its own.
 */

import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getActiveHouseRulesForWorkspace, type HouseRule } from "./house-rules.functions";

type DecisionRow = {
  title: string;
  rationale: string | null;
  status: string;
  decided_by_agent_slug: string | null;
  created_at: string;
};

type LearningRow = {
  verdict: string | null;
  summary: string | null;
  metric_label: string | null;
  metric_value: string | null;
  created_at: string;
  opportunity: { title: string | null } | { title: string | null }[] | null;
};

function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

function opportunityTitle(o: LearningRow["opportunity"]): string | null {
  if (!o) return null;
  return Array.isArray(o) ? (o[0]?.title ?? null) : o.title;
}

/** PURE. Builds the markdown bundle from already-fetched rows. Exported for
 *  testing without a database round trip. */
export function buildSkillsMarkdown(input: {
  workspaceName: string | null;
  decisions: DecisionRow[];
  learnings: LearningRow[];
  houseRules: HouseRule[];
  generatedAt: string;
}): string {
  const { workspaceName, decisions, learnings, houseRules, generatedAt } = input;
  const lines: string[] = [];

  lines.push(`# ${workspaceName ?? "Supaprod"} - Agent Context Bundle`);
  lines.push("");
  lines.push(
    `Generated ${fmtDate(generatedAt)} by Supaprod. Mount this file as project context for ` +
      "Claude Code, Codex, or any AI agent fleet so it inherits this workspace's decisions, " +
      "outcomes, and standing rules instead of relearning them from scratch. Regenerate any " +
      "time from Settings - Export; this file is never the source of truth, the audit trail is.",
  );
  lines.push("");

  lines.push("## Decisions");
  lines.push("");
  if (decisions.length === 0) {
    lines.push("_No decisions recorded yet._");
  } else {
    for (const d of decisions) {
      lines.push(`### ${d.title}`);
      lines.push(`- Status: ${d.status}`);
      lines.push(`- Decided: ${fmtDate(d.created_at)}`);
      if (d.decided_by_agent_slug) lines.push(`- Decided by: ${d.decided_by_agent_slug}`);
      if (d.rationale) {
        lines.push("");
        lines.push(d.rationale);
      }
      lines.push("");
    }
  }

  lines.push("## Outcomes");
  lines.push("");
  if (learnings.length === 0) {
    lines.push("_No recorded outcomes yet._");
  } else {
    for (const l of learnings) {
      const title = opportunityTitle(l.opportunity) ?? "Outcome";
      lines.push(`### ${title} - ${l.verdict ?? "unrecorded"}`);
      lines.push(`- Recorded: ${fmtDate(l.created_at)}`);
      if (l.metric_label) {
        lines.push(`- Metric: ${l.metric_label}${l.metric_value ? ` = ${l.metric_value}` : ""}`);
      }
      if (l.summary) {
        lines.push("");
        lines.push(l.summary);
      }
      lines.push("");
    }
  }

  lines.push("## Taste rules");
  lines.push("");
  if (houseRules.length === 0) {
    lines.push("_No standing house rules yet._");
  } else {
    for (const r of houseRules) lines.push(`- ${r.rule_text.trim()}`);
  }
  lines.push("");

  return lines.join("\n");
}

export const exportSkillsFile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const db = supabase as unknown as SupabaseClient;

    const { data: memberRows } = await db
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1);
    const workspaceId = memberRows && memberRows.length > 0 ? memberRows[0].workspace_id : null;

    let workspaceName: string | null = null;
    if (workspaceId) {
      const { data: ws } = await db
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .maybeSingle();
      workspaceName = (ws?.name as string | null) ?? null;
    }

    const [decisionsRes, learningsRes, houseRules] = await Promise.all([
      workspaceId
        ? db
            .from("decisions")
            .select("title,rationale,status,decided_by_agent_slug,created_at")
            .eq("workspace_id", workspaceId)
            .order("created_at", { ascending: false })
            .limit(500)
        : Promise.resolve({ data: [], error: null }),
      db
        .from("learnings")
        .select(
          "verdict,summary,metric_label,metric_value,created_at,opportunity:opportunities(title)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500),
      workspaceId ? getActiveHouseRulesForWorkspace(db, workspaceId) : Promise.resolve([]),
    ]);
    if (decisionsRes.error) throw new Error(decisionsRes.error.message);
    if (learningsRes.error) throw new Error(learningsRes.error.message);

    const decisions = (decisionsRes.data ?? []) as DecisionRow[];
    const learnings = (learningsRes.data ?? []) as unknown as LearningRow[];

    const generatedAt = new Date().toISOString();
    const markdown = buildSkillsMarkdown({
      workspaceName,
      decisions,
      learnings,
      houseRules,
      generatedAt,
    });

    return {
      markdown,
      counts: {
        decisions: decisions.length,
        outcomes: learnings.length,
        houseRules: houseRules.length,
      },
    };
  });
