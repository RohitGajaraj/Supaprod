// SW-4 / mission 3.10 GOAL MODE: the work pass a standing goal runs.
//
// A goal never executes anything itself. Each pass reads recent workspace
// state (signals, themes, what this goal already proposed) and proposes AT
// MOST one new opportunity into Decide, linked via opportunities.goal_id.
// The human gates stay exactly where they are: the proposal lands in the
// Decide queue like any other opportunity, neutral-ICE so the deterministic
// ranker (DEC-RANK) scores it honestly rather than trusting the model.
//
// Bounded by contract: one proposal per goal per 24h (checked before any
// model spend), and the model is told to skip when nothing genuinely new is
// warranted. Both the create-time first pass and the goal-tick cron call
// runGoalWorkPass; only the client differs (RLS user client vs admin).

import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";
import { recordStageEvent } from "@/lib/stage-events.server";

export interface GoalRow {
  id: string;
  user_id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  target_metric: string | null;
  target_date: string | null;
  status: string;
  last_worked_at: string | null;
}

export interface GoalProposal {
  title: string;
  problem: string;
  target_user: string | null;
  hypothesis: string | null;
}

export type GoalPassResult =
  | { proposed: 1; opportunityId: string }
  | { proposed: 0; skipped: string };

/** One proposal per goal per 24h: the hard spend bound the tick enforces
 *  before any model call. */
export const GOAL_PROPOSAL_COOLDOWN_MS = 24 * 3600_000;

export const GOAL_PROPOSER_SYSTEM = `You are the Cadence goal planner. The user has a standing goal (an outcome they want, not a task list). Given the goal and a snapshot of recent workspace state, decide whether there is ONE genuinely new opportunity worth proposing that advances this goal.
Rules:
- Ground the proposal ONLY in the goal and the workspace snapshot. Never invent signals, metrics, or user data that are not shown.
- Skip when nothing new is warranted: the snapshot shows no relevant movement, or every promising angle is already covered by an existing opportunity listed below. Skipping is the correct answer most of the time.
- A proposal names a specific problem and a testable hypothesis, in plain product language.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON, one of:
  {"skip": true, "reason": "<one short sentence>"}
  {"skip": false, "title": "<under 120 chars>", "problem": "<1-3 sentences>", "target_user": "<who, under 120 chars>", "hypothesis": "<one testable sentence>"}`;

/** Pure response validator: accepts the model's JSON and returns either a
 *  clean proposal or a skip reason. Fails closed (garbage means skip). */
export function parseGoalProposal(raw: unknown): GoalProposal | { skip: string } {
  if (!raw || typeof raw !== "object") return { skip: "unparseable model output" };
  const o = raw as Record<string, unknown>;
  if (o.skip === true || o.skip === "true") {
    const reason =
      typeof o.reason === "string" && o.reason.trim() ? o.reason.trim() : "nothing new warranted";
    return { skip: reason.slice(0, 300) };
  }
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const problem = typeof o.problem === "string" ? o.problem.trim() : "";
  if (title.length < 3 || problem.length < 3) return { skip: "proposal missing title or problem" };
  return {
    title: title.slice(0, 200),
    problem: problem.slice(0, 2000),
    target_user:
      typeof o.target_user === "string" && o.target_user.trim()
        ? o.target_user.trim().slice(0, 200)
        : null,
    hypothesis:
      typeof o.hypothesis === "string" && o.hypothesis.trim()
        ? o.hypothesis.trim().slice(0, 500)
        : null,
  };
}

/** Bounded workspace snapshot the proposer reasons over. Every read degrades
 *  to empty on failure so a partial snapshot never blocks the pass. */
async function gatherGoalContext(client: SupabaseClient, goal: GoalRow): Promise<string> {
  const cutoff7d = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const [signalsRes, themesRes, linkedRes, openOppsRes] = await Promise.all([
    client
      .from("signals")
      .select("title")
      .eq("workspace_id", goal.workspace_id)
      .gte("created_at", cutoff7d)
      .order("created_at", { ascending: false })
      .limit(25),
    client
      .from("themes")
      .select("title, frequency")
      .eq("user_id", goal.user_id)
      .order("frequency", { ascending: false, nullsFirst: false })
      .limit(15),
    client
      .from("opportunities")
      .select("title, status")
      .eq("goal_id", goal.id)
      .order("created_at", { ascending: false })
      .limit(20),
    client
      .from("opportunities")
      .select("title")
      .eq("workspace_id", goal.workspace_id)
      .order("ice_score", { ascending: false, nullsFirst: false })
      .limit(10),
  ]);

  const lines: string[] = [];
  lines.push(`GOAL: ${goal.title}`);
  if (goal.description) lines.push(`Detail: ${goal.description.slice(0, 600)}`);
  if (goal.target_metric) lines.push(`Target metric: ${goal.target_metric}`);
  if (goal.target_date) lines.push(`Target date: ${goal.target_date}`);

  const sig = (signalsRes.data ?? []).map((s) => `- ${s.title}`).join("\n");
  lines.push(`\nRecent signals (7d):\n${sig || "(none)"}`);

  const th = (themesRes.data ?? []).map((t) => `- ${t.title} (x${t.frequency ?? 1})`).join("\n");
  lines.push(`\nTop themes:\n${th || "(none)"}`);

  const linked = (linkedRes.data ?? [])
    .map((o) => `- [${o.status ?? "backlog"}] ${o.title}`)
    .join("\n");
  lines.push(
    `\nOpportunities ALREADY proposed for this goal (do not duplicate):\n${linked || "(none)"}`,
  );

  const open = (openOppsRes.data ?? []).map((o) => `- ${o.title}`).join("\n");
  lines.push(`\nOther top workspace opportunities (do not duplicate):\n${open || "(none)"}`);

  return lines.join("\n");
}

/**
 * One work pass for one goal: cooldown check, snapshot, one model call, and
 * (when the model proposes) one opportunity insert into Decide. Always
 * advances last_worked_at so the tick's oldest-first queue stays fair.
 */
export async function runGoalWorkPass(
  client: SupabaseClient,
  goal: GoalRow,
): Promise<GoalPassResult> {
  // Hard spend bound BEFORE any model call: one proposal per goal per 24h.
  const cooldownCutoff = new Date(Date.now() - GOAL_PROPOSAL_COOLDOWN_MS).toISOString();
  const { count: recentCount } = await client
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("goal_id", goal.id)
    .gte("created_at", cooldownCutoff);
  if ((recentCount ?? 0) > 0) {
    await touchGoal(client, goal.id);
    return { proposed: 0, skipped: "proposed within the last 24h" };
  }

  const context = await gatherGoalContext(client, goal);

  // A model/gateway failure here must not strand the goal at last_worked_at
  // = NULL forever: an unguarded throw would keep re-sorting it to the front
  // of the tick's oldest-first queue and fail identically on every future
  // tick (observed live: a stale hardcoded model id did exactly this for
  // 8+ hours straight before the string was corrected).
  let res: Awaited<ReturnType<typeof callModel>>;
  try {
    res = await callModel(client as never, goal.user_id, {
      surface: "discovery",
      surface_ref: `goal:${goal.id}`,
      model: "google/gemini-2.5-flash",
      workspaceId: goal.workspace_id,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: GOAL_PROPOSER_SYSTEM },
        { role: "user", content: `${context}\n\nDecide: skip, or propose ONE new opportunity.` },
      ],
    });
  } catch (e) {
    await touchGoal(client, goal.id);
    return {
      proposed: 0,
      skipped: `model call failed: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }

  const parsed = parseGoalProposal(res.json);
  if ("skip" in parsed) {
    await touchGoal(client, goal.id);
    return { proposed: 0, skipped: parsed.skip };
  }

  // Neutral ICE: the goal planner does not score its own bet; DEC-RANK and
  // the Critic judge it like any human-recorded idea.
  const { data: opp, error } = await client
    .from("opportunities")
    .insert({
      user_id: goal.user_id,
      workspace_id: goal.workspace_id,
      goal_id: goal.id,
      title: parsed.title,
      problem: parsed.problem,
      target_user: parsed.target_user,
      hypothesis: parsed.hypothesis,
      impact: 5,
      confidence: 5,
      ease: 5,
    } as never)
    .select("id, status")
    .single();
  if (error || !opp) {
    await touchGoal(client, goal.id);
    return { proposed: 0, skipped: `insert failed: ${error?.message ?? "unknown"}` };
  }

  const oppRow = opp as { id: string; status: string | null };
  await recordStageEvent(client, {
    entityType: "opportunity",
    entityId: oppRow.id,
    from: null,
    to: oppRow.status ?? "backlog",
    actor: "goal-planner",
    workspaceId: goal.workspace_id,
    userId: goal.user_id,
  });

  await touchGoal(client, goal.id);
  return { proposed: 1, opportunityId: oppRow.id };
}

async function touchGoal(client: SupabaseClient, goalId: string): Promise<void> {
  await client
    .from("goals")
    .update({
      last_worked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", goalId);
}
