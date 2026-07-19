/**
 * BD-1, the `BuildDriver` seam (docs/strategy/build-driver-and-dispatch.md §5).
 *
 * One swappable abstraction for "who writes the code": the native in-house loop
 * and every external coding engine (OpenHands today; Claude Agent SDK / Devin /
 * Codex / Cursor reserved) behind a single dispatch / poll / result / cancel
 * lifecycle. The twin of `RepoProvider` ("where the code lives") and the
 * generalization of `DelegateProvider` (which is submit-only and external-only).
 *
 * This module is PURE, types plus the deterministic id normalizer. No env, no
 * I/O, no DB; safe to import anywhere. The adapters live in the sibling
 * `.server.ts` files (`native.server.ts`, `openhands.server.ts`) and the
 * env-reading resolver in `resolve.server.ts`, mirroring the proven
 * `delegate/provider.ts` ↔ `delegate/openhands.server.ts` split.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Every build engine we know about. Only 'native' and 'openhands' have wired
 * adapters today; the rest are reserved type members so a future adapter is a
 * bounded addition, never a union rewrite (same idiom as
 * `RESERVED_DELEGATE_PROVIDER_IDS`).
 */
export type BuildDriverId = "native" | "openhands" | "claude-sdk" | "devin" | "codex" | "cursor";

/** Every member of {@link BuildDriverId}, for deterministic id validation. */
export const ALL_BUILD_DRIVER_IDS: readonly BuildDriverId[] = [
  "native",
  "openhands",
  "claude-sdk",
  "devin",
  "codex",
  "cursor",
];

/** Reserved (typed but unimplemented) engines, named here so nothing else hard-codes them. */
export const RESERVED_BUILD_DRIVER_IDS: readonly BuildDriverId[] = [
  "claude-sdk",
  "devin",
  "codex",
  "cursor",
];

/**
 * The user-facing, ENGINE-HONEST label for a driver id (Gate #1 decision B3,
 * gap register I1). The one place a driver is named for a person, so a receipt
 * can "name what actually ran" without a surface inventing its own string.
 *
 * Honesty rule (claim never outruns wiring): the shipped `claude-sdk` adapter
 * is a SINGLE-SHOT PATCH generator, not the Claude Agent SDK, so it is labeled
 * "single-shot patch" and NEVER "Claude Agent SDK". When a real iterative Agent
 * SDK driver lands in the PC-35 lane it gets its own id and its own honest
 * label; until then no surface may imply the agentic harness exists.
 */
export const BUILD_DRIVER_LABEL: Record<BuildDriverId, string> = {
  native: "Supaprod native",
  openhands: "OpenHands",
  "claude-sdk": "single-shot patch",
  devin: "Devin",
  codex: "Codex",
  cursor: "Cursor",
};

/** The engine-honest label for whatever a `missions.build_driver` cell holds,
 *  falling back to a neutral phrase (never a guessed engine name). */
export function buildDriverLabel(value: string | null | undefined): string {
  const id = normalizeBuildDriverId(value);
  return id ? BUILD_DRIVER_LABEL[id] : "the build engine";
}

/**
 * PURE. Normalize an arbitrary string (a `preferred` param, the `BUILD_DRIVER`
 * env var, a `missions.build_driver` cell) to a known {@link BuildDriverId},
 * or null when it names no known engine.
 */
export function normalizeBuildDriverId(value: string | null | undefined): BuildDriverId | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  return (ALL_BUILD_DRIVER_IDS as readonly string[]).includes(v) ? (v as BuildDriverId) : null;
}

/**
 * The normalized brief a driver receives, the "out" control point where the
 * moat travels (spec §6): not just the goal, but the acceptance bar, the
 * decision lineage, the design pointers, the blast radius, the guardrails,
 * the repo, and the budget. Everything beyond `goal` is optional so the seam
 * never forces a caller to fabricate context it does not have.
 */
export interface BuildSpec {
  /** What to build, the canonical work-order text. */
  goal: string;
  /** The test bar: standing success-metric clauses from the Outcome Contract. */
  acceptanceCriteria?: string[];
  /** The decision that mandated this work (lineage ref). */
  decisionRef?: string | null;
  /** Design-system + convention references the engine must honor. */
  designPointers?: string[];
  /** The blast radius, files the engine is expected to touch. */
  targetFiles?: string[];
  /** Hard policy constraints the engine must honor. */
  guardrails?: string[];
  /** Where the code lives (via RepoProvider); optional for repo-implicit drivers. */
  repo?: { url?: string; baseBranch?: string };
  /** Cost/iteration budget for the engine. */
  budget?: { maxIterations?: number; maxSpendUsd?: number };
  /** The rows that justify the work (same shape as the A2A evidence contract). */
  evidenceIds?: { kind: string; id: string }[];
}

/** The handle a dispatch returns, enough to poll, fold, and cancel later. */
export interface BuildSession {
  driver: BuildDriverId;
  /** The Supaprod mission this build belongs to. */
  missionId: string;
  /** The `agent_runs` row (native: the queued run; external: the source run to fold onto). */
  runId?: string;
  /** The external engine's own job/conversation id (external drivers only). */
  externalJobId?: string;
}

/** Normalized lifecycle status across every engine. */
export type BuildStatus = "queued" | "running" | "waiting_approval" | "done" | "failed" | "unknown";

/** The terminal read-out of a build session. */
export interface BuildResult {
  status: BuildStatus;
  /** Human-readable outcome (the engine's final message / run output), if any. */
  summary?: string | null;
  /** Stable references for follow-up (mission/run/external job ids, PR url, ...). */
  refs?: Record<string, string>;
}

/**
 * Per-call context a driver needs to act on the caller's behalf. The seam is
 * DB-agnostic beyond the RLS-scoped client: drivers never read env for
 * identity, everything arrives explicitly.
 */
export interface BuildDriverContext {
  /** RLS-scoped client acting as the dispatching user. */
  supabase: SupabaseClient;
  userId: string;
  workspaceId: string;
  /**
   * An existing mission to attach to. Required by external adapters (they fold
   * results onto a mission they did not create); ignored by the native adapter,
   * whose dispatch creates the mission itself.
   */
  missionId?: string;
  /** External adapters: the source `agent_runs` row to fold terminal results onto. */
  runId?: string;
  /** Native adapter: the roster agent that runs the loop. */
  agent?: { id: string; slug: string; name: string };
  /** Native adapter: the mission title (falls back to the goal's first line). */
  missionTitle?: string;
  /** Native adapter: model override riding on the queued run row. */
  model?: string | null;
}

/**
 * The seam itself. `available` may be sync or async (a future adapter may need
 * a network probe); the sync resolver treats only a literal `true` as
 * immediately available.
 */
export interface BuildDriver {
  readonly id: BuildDriverId;
  /** Wired AND permitted right now (flag + credentials), honestly reported. */
  available(): boolean | Promise<boolean>;
  /** Hand off the task; returns the session handle. Throws on refusal. */
  dispatch(ctx: BuildDriverContext, spec: BuildSpec): Promise<BuildSession>;
  /** Live progress for a session. Fail-safe: 'unknown' over throwing. */
  poll(ctx: BuildDriverContext, session: BuildSession): Promise<BuildStatus>;
  /** The terminal read-out (and, where supported, folds it back into the mission). */
  result(ctx: BuildDriverContext, session: BuildSession): Promise<BuildResult>;
  /** Stop the session. `{ ok: false, reason }` when the engine cannot cancel. */
  cancel(ctx: BuildDriverContext, session: BuildSession): Promise<{ ok: boolean; reason?: string }>;
}
