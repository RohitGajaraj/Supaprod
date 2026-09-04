/**
 * ── A READ OF A WORKSPACE-SCOPED TABLE NAMES A WORKSPACE (P-67) ──────────
 *
 * FOUR TIMES IN ONE MISSION, each found on a served surface by a person
 * reading a sentence that was true of somebody else's workspace:
 *
 *   `listRunsForStart`      Start showed every workspace's runs under one name
 *   `listTopOpportunities`  the same, for bets
 *   the Discover source count  an empty workspace was offered no source to
 *                              connect, because another workspace had one
 *   the shell's live line    an EMPTY probe workspace read "1 decision is ready
 *                            for you" and named a Helio Labs decision
 *
 * RLS answers "may this person see this row". It has never answered "whose desk
 * is this", and every one of those four passed RLS. Since migration
 * 20260907010000 a person can hold two workspaces, so the class went from
 * latent to visible, and each instance was fixed one site at a time.
 *
 * ── THIS IS A RATCHET, NOT A CLEAN BILL ──────────────────────────────────
 *
 * There are 136 bare reads across 73 files today and this test does not demand
 * they be fixed. It records them per file and fails when a file grows: the
 * fifth instance cannot be written, and every packet that closes one lowers a
 * number that can never be raised again.
 *
 * WHY PER FILE AND NOT A TOTAL: a single total lets one file add a read while
 * another removes one, which is exactly how a ratchet becomes decoration.
 *
 * ── WHAT IS NOT COUNTED, AND WHY EACH EXCLUSION IS SAFE ──────────────────
 *
 * A read NARROWED BY ANOTHER ID (`.eq("id", ...)`, `.eq("track_id", ...)`,
 * `.in("id", ids)` and the rest) is transitively scoped: the parent row was
 * itself reached through a workspace, and demanding a redundant predicate would
 * train people to add one where it proves nothing. 618 reads are in this group
 * and none of the four defects above was one of them -- all four selected a
 * LIST with no narrowing at all, which is the shape that borrows another desk.
 *
 * Writes are not counted: an INSERT or UPDATE that omits the tenant is a
 * different defect with its own guards, and folding them in here would blur two
 * rules into one number.
 *
 * Comments are stripped before scanning. A file explaining why it reads
 * unscoped must not be counted for the explanation ([[F-188]]).
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Tables that carry `workspace_id` in the live schema, read 2026-09-04. */
const WORKSPACE_SCOPED = new Set<string>([
  "activation_events",
  "agent_approvals",
  "agent_autonomy",
  "agent_memory",
  "agent_messages",
  "agent_runs",
  "agent_tools",
  "agents",
  "ai_budgets",
  "ai_evals",
  "ai_events",
  "ai_feedback",
  "announcements",
  "artifact_versions",
  "assumption_challenges",
  "assumptions",
  "brain_last_seen",
  "brief_items",
  "changelog_entries",
  "connection_bindings",
  "conversations",
  "daily_briefs",
  "decisions",
  "deployments",
  "docs",
  "goals",
  "guardrail_rules",
  "house_rules",
  "insights",
  "learnings",
  "loops",
  "meetings",
  "memory_candidates",
  "memory_recall_log",
  "messages",
  "mission_steps",
  "missions",
  "notes",
  "opportunities",
  "playbook_proposals",
  "prds",
  "projects",
  "prototypes",
  "scout_targets",
  "signals",
  "spine_tracks",
  "stage_events",
  "studio_changesets",
  "tasks",
  "themes",
  "tool_calls",
  "workspace_briefs",
]);

/**
 * An id that already narrows the read to rows reached through a workspace.
 * `slug` is here because a slug lookup is a single named row, not a list.
 * `trace_id` / `ai_event_id` added 2026-09-04 (P-136): `creditsSpentByTrace`
 * (credits.functions.ts) narrows `ai_events`/`credit_ledger` by a trace-id set
 * the caller already fetched under RLS on `agent_runs`, the same shape as
 * `run_id` above it -- an id one hop from a workspace, not a bare list.
 */
const NARROWED =
  /\.(eq|in)\(\s*"(id|track_id|mission_id|run_id|decision_id|prd_id|product_id|project_id|changeset_id|conversation_id|theme_id|opportunity_id|agent_id|user_id|artifact_id|signal_id|goal_id|loop_id|task_id|slug|trace_id|ai_event_id)"/;

/**
 * BASELINE, MEASURED 2026-09-04. A number here may go DOWN and never up.
 *
 * Raising one is not a fix and never will be: CLAUDE.md's standing rule is that
 * widening a baseline to make something pass is the one move that is never
 * sanctioned. If a new read genuinely cannot name a workspace -- a cron pass
 * that iterates every workspace on purpose, for instance -- it belongs in
 * `DELIBERATELY_UNSCOPED` with its reason, where a reader can weigh it.
 */
const BASELINE: Record<string, number> = {
  "src/lib/agent-fleet.functions.ts": 1,
  "src/lib/agents.functions.ts": 7,
  "src/lib/ai/loop.server.ts": 1,
  "src/lib/ai/mission-advance.server.ts": 1,
  "src/lib/ai/reflection.server.ts": 1,
  "src/lib/ai/research.server.ts": 4,
  "src/lib/ai/run-attempt.server.ts": 1,
  "src/lib/ai/runtime.server.ts": 2,
  "src/lib/ai/tools/registry.server.ts": 4,
  "src/lib/artifacts.functions.ts": 2,
  "src/lib/ask-blocks.server.ts": 4,
  "src/lib/ask-promote.functions.ts": 1,
  "src/lib/brain.functions.ts": 2,
  "src/lib/brain/memory-embedding.server.ts": 1,
  "src/lib/brain/theme-embedding.server.ts": 1,
  "src/lib/brief-opportunity.functions.ts": 2,
  "src/lib/budgets.functions.ts": 1,
  "src/lib/calendar.functions.ts": 1,
  "src/lib/changelog.functions.ts": 1,
  "src/lib/connectors/product-binding.functions.ts": 1,
  "src/lib/conversations.functions.ts": 2,
  "src/lib/copilot.functions.ts": 5,
  "src/lib/credits.functions.ts": 1,
  "src/lib/decisions-share.functions.ts": 2,
  "src/lib/decisions.functions.ts": 1,
  "src/lib/delegate-desk.functions.ts": 1,
  "src/lib/deployments.functions.ts": 1,
  "src/lib/design-scaffold.functions.ts": 2,
  "src/lib/docs.functions.ts": 1,
  "src/lib/forecast.functions.ts": 3,
  "src/lib/gdocs.functions.ts": 1,
  "src/lib/guardrails.functions.ts": 3,
  "src/lib/landing.functions.ts": 4,
  "src/lib/lineage.functions.ts": 1,
  "src/lib/linear.functions.ts": 1,
  "src/lib/meetings.functions.ts": 2,
  "src/lib/memory-candidates.functions.ts": 2,
  "src/lib/notion.functions.ts": 1,
  "src/lib/observability.functions.ts": 2,
  "src/lib/onboarding.functions.ts": 1,
  "src/lib/opportunities-share.functions.ts": 1,
  "src/lib/outcome.functions.ts": 6,
  "src/lib/payments.functions.ts": 1,
  "src/lib/projects.functions.ts": 1,
  "src/lib/proof-surface.functions.ts": 1,
  "src/lib/prototypes.functions.ts": 1,
  "src/lib/routing-console.functions.ts": 1,
  "src/lib/sources/signal-embedding.server.ts": 1,
  "src/lib/sources/sink.server.ts": 1,
  "src/lib/spine/correction.server.ts": 1,
  "src/lib/spine/driver.server.ts": 5,
  "src/lib/spine/return-edge.server.ts": 1,
  "src/lib/stage-events.functions.ts": 1,
  "src/lib/stakeholder-update.functions.ts": 1,
  "src/lib/support-triage.functions.ts": 1,
  "src/lib/tasks.functions.ts": 2,
  "src/lib/traces.functions.ts": 3,
  "src/lib/trust-chain.functions.ts": 1,
  "src/routes/api/chat.ts": 2,
  "src/routes/api/public/hooks/approvals-tick.ts": 4,
  "src/routes/api/public/hooks/delegate-poll-tick.ts": 1,
  "src/routes/api/public/hooks/drift-tick.ts": 1,
  "src/routes/api/public/hooks/eval-tick.ts": 4,
  "src/routes/api/public/hooks/fanout-reconcile-tick.ts": 1,
  "src/routes/api/public/hooks/resume-runs.ts": 4,
  "src/routes/api/public/hooks/track-tick.ts": 1,
  "src/routes/p.$slug.tsx": 1,
};

/** Reads that are unscoped ON PURPOSE, each with the reason it is safe. */
const DELIBERATELY_UNSCOPED: Record<string, string> = {
  "src/routes/api/public/hooks/calibrate-tick.ts":
    "The tick iterates workspaces itself and scopes each pass; that loop IS the scoping.",
};

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sourceFiles(p, out);
    else if (/\.(ts|tsx)$/.test(p) && !/\.test\.|__tests__|\.gen\./.test(p)) out.push(p);
  }
  return out;
}

/** Bare reads in one file: a select on a workspace-scoped table naming neither
 *  a workspace nor a narrowing id. */
function bareReads(file: string): number {
  const src = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const re = /\.from\(\s*"([a-z_]+)"(?:\s+as\s+never)?\s*\)/g;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(src))) {
    if (!WORKSPACE_SCOPED.has(m[1])) continue;
    const chain = src.slice(m.index, m.index + 900);
    const end = chain.search(/;\s*\n/);
    const body = end === -1 ? chain : chain.slice(0, end);
    if (!/\.select\(/.test(body)) continue;
    if (/workspace_id/.test(body)) continue;
    if (NARROWED.test(body)) continue;
    /*
     * ── THE TWO-STATEMENT IDIOM IS SCOPED (found by using this guard) ─────
     *
     * The first draft of this scan stopped at the `;` and so read
     *
     *     let q = supabase.from("prds").select("id");
     *     if (wid) q = q.eq("workspace_id", wid);
     *
     * as UNSCOPED -- which is the repo's own idiom for "filter only when the
     * workspace resolved", the one `listTracks` and every P-66 read use, and
     * the only correct way to express it. A guard that fails the correct form
     * teaches people to write the incorrect one, and it inflated the baseline
     * with reads that were already right.
     *
     * So the assignment that follows is read too: if the same variable is
     * given a `workspace_id` predicate in the next few statements, the read is
     * scoped. Bounded to 400 characters and to THIS variable, so an unrelated
     * mention further down cannot silently excuse a bare read.
     */
    /*
     * Matched with a BACKREFERENCE, so no declaration parsing is needed: the
     * form is literally `q = q.eq("workspace_id", ...)` for some q. Bounded to
     * 400 characters after the statement, so a scoped query further down cannot
     * excuse a bare one above it.
     */
    const tail = src.slice(
      m.index + (end === -1 ? 0 : end),
      m.index + (end === -1 ? 0 : end) + 400,
    );
    if (/(\w+)\s*=\s*\1\s*\.\s*(eq|in)\(\s*"workspace_id"/.test(tail)) continue;
    n++;
  }
  return n;
}

describe("a read of a workspace-scoped table names a workspace", () => {
  const files = sourceFiles("src").sort();

  it("finds the reads at all, so a broken scan cannot pass as a clean repo", () => {
    // The scan going quiet is indistinguishable from the defect being fixed,
    // and one of those is a lot more likely than the other.
    const total = files.reduce((t, f) => t + bareReads(f), 0);
    expect(total).toBeGreaterThan(0);
    expect(files.length).toBeGreaterThan(500);
  });

  it("lets no file grow a new unscoped read", () => {
    const grown: string[] = [];
    for (const f of files) {
      if (DELIBERATELY_UNSCOPED[f]) continue;
      const now = bareReads(f);
      const was = BASELINE[f] ?? 0;
      if (now > was) grown.push(`${f}: ${was} -> ${now}`);
    }
    /*
     * The message a person gets here matters more than the assertion. If this
     * fails, the read you just added selects a LIST from a workspace-scoped
     * table and names no workspace, so it will show one workspace's rows under
     * another's name the moment somebody holds two. Take the workspace as an
     * input and filter on it; leave it unfiltered only when it cannot be
     * resolved, because narrowing to a workspace you cannot name turns a failed
     * lookup into "you have nothing", and that is a claim.
     */
    expect(grown).toEqual([]);
  });

  it("keeps the baseline honest: no file listed that no longer has any", () => {
    // A stale entry is a licence to add one back for free, which is how a
    // ratchet quietly loosens.
    const stale = Object.keys(BASELINE).filter((f) => {
      try {
        return bareReads(f) === 0;
      } catch {
        return true; // deleted file
      }
    });
    expect(stale).toEqual([]);
  });

  it("names a reason for every deliberately unscoped file", () => {
    for (const [f, why] of Object.entries(DELIBERATELY_UNSCOPED)) {
      expect(why.length).toBeGreaterThan(20);
      expect(BASELINE[f]).toBeUndefined();
    }
  });
});
