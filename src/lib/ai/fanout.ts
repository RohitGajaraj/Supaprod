/**
 * Ephemeral sub-agent fan-out (PURE core).
 *
 * Lets a specialist spread independent, parallelizable subwork across N bounded
 * ephemeral sub-agents of one role (e.g. one per source to ingest, per spec
 * section to draft, per file to build) instead of grinding them serially in a
 * single loop. Mechanically each child is a normal A2A handoff: `enqueueFanout`
 * (the `.server` half) calls the proven `enqueueHandoff` once per planned child,
 * so a spawned child is just another mission run the existing self-driving engine
 * already carries, reflects, and completes. No new orchestration-engine surface.
 *
 * What actually BOUNDS the NUMBER of children (a budget cannot: the runtime
 * chokepoint enforces a cap PER-RUN, not as a mission-wide aggregate, so a cap
 * halts each child in turn but never limits how many children exist):
 *   1. TIER cap: the entitlements model specifies maxParallelAgents per tier
 *      (Free 1, Pro 3, Max 5, Business 8, Enterprise unlimited/null).
 *      Planning layer applies this as maxChildren; planning validates up-front.
 *   2. GLOBAL cap: absolute runtime ceiling (for emergency brakes).
 *   3. DEPTH cap: a spawned child is stamped with its fan-out depth, and a run at
 *      depth >= {@link FANOUT_MAX_DEPTH} may NOT itself spawn. With the default of
 *      1 that means exactly ONE level of fan-out (a top-level agent spawns workers;
 *      those workers cannot spawn), so the chain can never explode 8 -> 64 -> 512.
 * The self-spawn refusal (A -> A) in `enqueueFanout` is a minor extra guard, NOT a
 * recursion bound; the depth cap is what prevents fan-out explosion.
 *
 * This module is the pure, offline-verifiable heart: it caps the child count,
 * dedupes blank/duplicate subtasks, splits the supplied (remaining) budget evenly
 * across the kept children, and exposes the depth helpers. No db, no network, no
 * AI. It takes the budget as given and never decides what an ABSENT budget means:
 * `enqueueFanout` resolves that through `resolveMissionSpendCap` before calling
 * here, so a null arriving at this function is already a settled "no ceiling".
 */

/** Global emergency ceiling on parallel sub-agents (failsafe, never exceeded). */
export const FANOUT_MAX_CHILDREN = 8;

/**
 * Max fan-out depth: a run at depth >= this may not spawn. 1 = a single level of
 * fan-out (top-level agent spawns workers; a spawned worker cannot itself spawn),
 * which makes the chain length, and therefore the total run count, hard-bounded
 * independent of any budget cap.
 */
export const FANOUT_MAX_DEPTH = 1;

/**
 * PURE. Read the fan-out depth a run was stamped with, from its inbound handoff
 * payload (`context._fanout_depth`, set by {@link planFanout}'s server enqueue).
 * A top-level run (no inbound fan-out handoff, or an absent/odd stamp) is depth 0.
 */
export function fanoutDepthOf(payload: unknown): number {
  const d = (payload as { context?: { _fanout_depth?: unknown } } | null | undefined)?.context
    ?._fanout_depth;
  return typeof d === "number" && Number.isFinite(d) && d > 0 ? Math.floor(d) : 0;
}

/** PURE. True when a run at this depth may still spawn (bounds nested fan-out). */
export function canSpawnAtDepth(depth: number): boolean {
  return depth < FANOUT_MAX_DEPTH;
}

/**
 * Resolves the effective max children cap for a tier.
 * Entitlements specify maxParallelAgents per tier; this function returns that
 * clamped against the global FANOUT_MAX_CHILDREN emergency ceiling.
 *
 * @param tierCap maxParallelAgents from entitlements (null = unlimited)
 * @returns effective cap, never exceeding FANOUT_MAX_CHILDREN
 */
export function resolveMaxChildrenForTier(tierCap: number | null): number {
  if (tierCap === null) {
    return FANOUT_MAX_CHILDREN;
  }
  return Math.min(tierCap, FANOUT_MAX_CHILDREN);
}

/**
 * PURE. What a parent run has LEFT to hand its children, from its own ceiling and
 * what it has already spent. `undefined` means "this run's ceiling is unknown", and
 * that distinction is the whole point of the function.
 *
 * WHY THIS IS NOT `?? null`, WHICH IS WHAT IT USED TO BE. `resolveMissionSpendCap`
 * reads `undefined` as "nobody said" (inherit the workspace ceiling) and `null` as
 * "somebody said no ceiling" (returned verbatim, no read, no ceiling). A caller that
 * cannot read the parent's cap — the `agent_runs` row errored, or there is no run id
 * to read, or the run predates the day every writer began resolving — knows nothing,
 * which is "nobody said". Collapsing that into `null` made a database hiccup delete
 * the spending limit for EVERY child of the fan-out, on the one call that turns
 * itself into N runs. Proved 2026-08-10 against the real path: an explicit null went
 * in and `[null, null]` came out on the child `agent_runs` rows, with the workspace
 * never read. That is precisely the fail direction `mission-caps.server.ts` names as
 * "exactly backwards for a safety control".
 *
 * A parent that has genuinely burnt its budget returns 0, NOT undefined: zero is a
 * real ceiling that halts each child on its first check. See `planFanout` below.
 */
export function remainingMissionBudget(
  cap: number | null | undefined,
  used: number | null | undefined,
): number | undefined {
  if (typeof cap !== "number" || !Number.isFinite(cap)) return undefined;
  const spent = typeof used === "number" && Number.isFinite(used) ? used : 0;
  return Math.max(0, cap - spent);
}

export type FanoutItem = { task: string; context?: Record<string, unknown> };

export type PlannedChild = {
  task: string;
  context?: Record<string, unknown>;
  /** Per-child spend ceiling = supplied cap / kept-child-count (null when no cap supplied). */
  spendCapUsd: number | null;
  /** Per-child token ceiling = floor(supplied cap / kept-child-count) (null when no cap supplied). */
  tokenCap: number | null;
};

export type FanoutPlan = {
  children: PlannedChild[];
  /** How many valid subtasks were dropped by the cap (surfaced so truncation is never silent). */
  dropped: number;
};

/**
 * PURE. Turn a requested list of subtasks + an optional mission budget into a
 * bounded, deduped, budget-split set of children. Caps at {@link FANOUT_MAX_CHILDREN}
 * (and any tighter `maxChildren`), drops blank/non-string/duplicate tasks, reports
 * how many valid tasks were cut by the cap.
 */
export function planFanout(
  items: readonly FanoutItem[],
  opts: { maxChildren?: number; spendCapUsd?: number | null; tokenCap?: number | null } = {},
): FanoutPlan {
  const cap = Math.max(1, Math.min(opts.maxChildren ?? FANOUT_MAX_CHILDREN, FANOUT_MAX_CHILDREN));

  const seen = new Set<string>();
  const valid: FanoutItem[] = [];
  for (const it of items ?? []) {
    if (!it || typeof it.task !== "string") continue;
    const task = it.task.trim();
    if (!task || seen.has(task)) continue;
    seen.add(task);
    valid.push({ task, context: it.context });
  }

  const kept = valid.slice(0, cap);
  const dropped = valid.length - kept.length;
  const n = kept.length;

  // A supplied cap of ZERO is a real ceiling, not an absent one. `agent.spawn`
  // hands us `max(0, cap - already_spent)`, so zero is precisely the parent that
  // has burnt its whole budget, and that is the moment a null (which every
  // downstream reader takes to mean "no ceiling") would be most expensive: N
  // children, none of them stoppable. Only an ABSENT cap yields null here.
  // Negatives are clamped rather than dropped for the same fail-closed reason.
  const suppliedSpend =
    typeof opts.spendCapUsd === "number" && Number.isFinite(opts.spendCapUsd)
      ? Math.max(0, opts.spendCapUsd)
      : null;
  const suppliedTokens =
    typeof opts.tokenCap === "number" && Number.isFinite(opts.tokenCap)
      ? Math.max(0, opts.tokenCap)
      : null;

  const spend = n > 0 && suppliedSpend !== null ? suppliedSpend / n : null;
  const tokens = n > 0 && suppliedTokens !== null ? Math.floor(suppliedTokens / n) : null;

  return {
    children: kept.map((it) => ({
      task: it.task,
      context: it.context,
      spendCapUsd: spend,
      tokenCap: tokens,
    })),
    dropped,
  };
}
