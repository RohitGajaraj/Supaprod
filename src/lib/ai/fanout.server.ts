/**
 * Ephemeral sub-agent fan-out: gated server orchestrator.
 *
 * `.server.ts` (Worker-only; never bundled to the client).
 *
 * Flag-gated OFF by default (AGENT_FANOUT). When the founder enables it, a
 * specialist's `agent.spawn` tool call resolves the target agent, plans a bounded
 * budget-split set of children (PURE `planFanout`), and enqueues each as a normal
 * A2A handoff (`enqueueHandoff`). A spawned child is therefore just another mission
 * run the existing self-driving engine already carries, reflects, and completes
 * (parallel same-agent children are already handled by `consumeInboundHandoff`'s
 * CAS claim), so fan-out adds NO new orchestration-engine surface.
 *
 * Because each child flows through `enqueueHandoff`, it also inherits the #1
 * evidence gate: when the gate is enforced, a child payload that asserts artifacts
 * without evidence is rejected like any other handoff.
 *
 * Runaway is bounded by the COUNT cap (planFanout) and the DEPTH cap: each child is
 * stamped `context._fanout_depth = parent_depth + 1`, and `agent.spawn` refuses when
 * the calling run's depth is already >= FANOUT_MAX_DEPTH, so a spawned worker cannot
 * itself spawn. The DEPTH cap, not the budget, is what makes the chain length
 * bounded: the runtime enforces a spend cap per-run, not as a mission-wide
 * aggregate, so a cap alone would never bound how MANY runs exist.
 *
 * The budget is nonetheless a real second belt here, because this path resolves it
 * the way every other writer does (`resolveMissionSpendCap`) before splitting it.
 * See the note on {@link enqueueFanout} for why that resolution has to happen HERE
 * rather than being left to `enqueueHandoff`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { enqueueHandoff, resolveAgent, type HandoffPayload } from "./handoff.server";
import { resolveMissionSpendCap } from "./mission-caps.server";
import { planFanout, type FanoutItem } from "./fanout";

/** Capability flag. New surface, so OFF means the tool errors (never silently no-ops). */
export function fanoutEnabled(): boolean {
  const v = process.env.AGENT_FANOUT;
  return v === "1" || v === "true";
}

/**
 * Spawn the planned children as parallel A2A handoffs to one target specialist.
 * Returns the spawned child ids and the count the cap dropped. Resolves the target
 * once (enabled-roster check via `resolveAgent`) before any enqueue, and refuses the
 * trivial direct self-spawn (A -> A). The REAL recursion bound is the depth cap, NOT
 * this guard: each child's payload is stamped `context._fanout_depth = parent_depth + 1`
 * so a spawned worker's own `agent.spawn` is refused once depth >= FANOUT_MAX_DEPTH.
 * Each child also carries its share of the resolved budget.
 *
 * WHY THE CAP IS RESOLVED HERE AND NOT LEFT TO `enqueueHandoff`. Every other writer
 * (`loop.server.ts` twice, `handoff.server.ts` once) passes its OPTIONAL cap
 * straight through to `resolveMissionSpendCap`, so an absent cap arrives as
 * `undefined` ("nobody said") and inherits the workspace ceiling. Fan-out cannot do
 * that, because the value has to be a number BEFORE `planFanout` can divide it. If
 * we passed the absent cap along unresolved we would have to hand `planFanout` a
 * `null`, and a `null` reaching `enqueueHandoff` means "somebody said no ceiling",
 * which is the one answer this path must never give: it is the only writer that
 * creates N runs from one call, so an uncapped fan-out is N uncapped runs.
 * Resolving first also makes the split honest: the children divide a REAL remaining
 * budget, so their per-run ceilings sum to the parent's rather than to nothing.
 * A resolved `null` still reaches the children uncapped, and should: that is a
 * workspace that cleared its own ceiling on the record, which the resolver obeys.
 *
 * WHY `spend_cap_usd` IS `number | undefined` AND NOT `number | null | undefined`,
 * unlike every sibling writer. The paragraph above says a caller-supplied `null` is
 * "the one answer this path must never give", and for two months that stayed a
 * comment while `agent.spawn` supplied exactly that null whenever it could not read
 * the parent run's cap. The narrower type is the same sentence written where the
 * compiler enforces it: a caller that does not know the ceiling passes `undefined`
 * and inherits the workspace's, and there is no longer a way to spell "uncap all N
 * children" at this door. The single legitimate uncapped child still exists — it
 * comes out of the resolver, from a workspace that cleared its ceiling on the
 * record, and never from a caller. Use {@link remainingMissionBudget} to compute the
 * argument; it returns `undefined` for an unknown ceiling on purpose.
 */
export async function enqueueFanout(
  supabase: SupabaseClient,
  userId: string,
  args: {
    mission_id: string;
    workspace_id: string;
    from_agent_id: string | null;
    from_agent_slug: string | null;
    to_agent_slug: string;
    items: FanoutItem[];
    parent_depth: number;
    source_run_id: string | null;
    source_trace_id: string | null;
    /** Absent = "nobody said", inherit the workspace ceiling. No null: see above. */
    spend_cap_usd?: number;
    token_cap?: number | null;
  },
): Promise<{ spawned: { message_id: string; queued_run_id: string }[]; dropped: number }> {
  const to = await resolveAgent(supabase, userId, { agent_slug: args.to_agent_slug });
  if (to.id === args.from_agent_id) {
    throw new Error("agent.spawn: cannot fan out to yourself");
  }

  // Resolve BEFORE splitting, so an absent cap inherits the workspace ceiling
  // instead of reading downstream as a deliberate "no ceiling". See the note above.
  const spendCapUsd = await resolveMissionSpendCap(supabase, args.workspace_id, args.spend_cap_usd);

  const plan = planFanout(args.items, {
    spendCapUsd,
    tokenCap: args.token_cap ?? null,
  });

  const childDepth = (Number.isFinite(args.parent_depth) ? Math.max(0, args.parent_depth) : 0) + 1;
  const spawned: { message_id: string; queued_run_id: string }[] = [];
  for (const child of plan.children) {
    // Stamp the fan-out depth so a spawned worker's own agent.spawn is depth-refused.
    const payload: HandoffPayload = {
      task: child.task,
      context: { ...(child.context ?? {}), _fanout_depth: childDepth },
    };
    const res = await enqueueHandoff(supabase, userId, {
      mission_id: args.mission_id,
      workspace_id: args.workspace_id,
      from_agent_id: args.from_agent_id,
      from_agent_slug: args.from_agent_slug,
      to,
      payload,
      source_run_id: args.source_run_id,
      source_trace_id: args.source_trace_id,
      mission_spend_cap_usd: child.spendCapUsd,
      mission_token_cap: child.tokenCap,
    });
    spawned.push(res);
  }

  return { spawned, dropped: plan.dropped };
}
