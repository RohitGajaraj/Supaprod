/**
 * G-PRICE (pricing-architecture implementation-plan.md, Group A): the credit-metering
 * policy layer that sits ON TOP of the existing per-call debit engine
 * (runtime.server.ts / credits.functions.ts) without replacing its mechanics.
 *
 * PR-A2 — the free-vs-charged CallSurface map. Charging for the verification/plumbing
 * layer would suppress the exact trust mechanism that is the moat (pricing-architecture
 * §2 Rule 1), so eval/judge/embed/scheduler/test never debit. `sense` is
 * charged-but-governed (PR-D2's ambient downgrade-to-free applies there, not a blanket
 * exemption). Consulted by `debitAccountCredits` before any debit hits the ledger.
 *
 * PR-A3 — coarse, legible artifact-level credit sizing (mission ~10cr, build ~20-30cr,
 * everyday ~0), replacing raw token-derived costs for delivered artifacts. Founder-tunable
 * (the table below), mechanism final. Consumed by the mission/build completion hook in
 * loop.server.ts / handoff.server.ts (PR-A1) instead of summing the run's per-call debits.
 *
 * Pure + side-effect-free so it is directly unit-testable; no DB, no Supabase client.
 */
import type { CallSurface } from "./runtime.server";

/**
 * Whether a `CallSurface` ever debits credits. FREE surfaces are the trust/plumbing
 * layer (pricing-architecture §2 Rule 1): grading our own output, screening input,
 * embedding, scheduling, and test harness calls are never billed, no matter how the
 * debit path is invoked. Every other surface is CHARGEABLE (billed per PR-A3 sizing
 * on delivery, or per-call for surfaces PR-A1 does not yet cover with an artifact hook).
 */
const FREE_SURFACES: ReadonlySet<CallSurface> = new Set<CallSurface>([
  "eval",
  "judge",
  "embed",
  "scheduler",
  "test",
]);

/** True when calls on this surface should ever draw the credit meter. Pure. */
export function isChargeableSurface(surface: CallSurface): boolean {
  return !FREE_SURFACES.has(surface);
}

/**
 * PR-D2 — ambient/autonomous surfaces: work the account did not directly ask for in the
 * moment (cron-driven signal ingestion). At an empty pool these downgrade to the free
 * floor instead of dead-stopping (pricing-architecture §2 Rule 4, §5): "you keep the
 * baseline, you only lose the acceleration." Deliberately narrow — every other
 * chargeable surface still hard-halts on an empty pool.
 */
const AMBIENT_SURFACES: ReadonlySet<CallSurface> = new Set<CallSurface>(["sense"]);

/** True when this surface is ambient/autonomous (downgrades to free rather than halting). Pure. */
export function isAmbientSurface(surface: CallSurface): boolean {
  return AMBIENT_SURFACES.has(surface);
}

/**
 * PR-C1 — the moat surfaces (decision-layer judgment: the Critic and its eval harness,
 * plus decision-record work) stay on Cadence's own managed models even for an
 * enterprise account with BYOK configured, UNLESS that surface is on the account's
 * explicit approved-model list (pricing-architecture §5: "the moat surfaces still run
 * on Cadence's own managed models by default unless the enterprise explicitly approves
 * a model for them"). This is the DEFAULT the chokepoint enforces; an approved-model
 * override is a data lookup the caller supplies (no such list exists yet in this pass,
 * so today this is unconditional for these three surfaces).
 */
const MOAT_SURFACES: ReadonlySet<CallSurface> = new Set<CallSurface>(["judge", "eval", "decision"]);

/**
 * True when a BYOK vault key must NOT be used for this surface's call, i.e. it stays on
 * the platform's own managed key even for an enterprise account with BYOK configured.
 * `approvedSurfaces` is the account's explicit approved-model allowlist (empty/omitted
 * by default, since no admin surface exists yet to populate it); a moat surface on that
 * list is allowed to use BYOK. Pure.
 */
export function isMoatSurfaceLockedToManaged(
  surface: CallSurface,
  approvedSurfaces: ReadonlySet<CallSurface> = new Set(),
): boolean {
  return MOAT_SURFACES.has(surface) && !approvedSurfaces.has(surface);
}

/**
 * PR-C2 — the BYOK platform fee: a thin % of the rated pass-through spend on an
 * enterprise BYOK call (pricing-architecture §4, §11c). Provisional default inside the
 * founder's stated 10-20% research band; founder-config to tune per contract. A %,
 * never a flat per-token fee, so it auto-deflates with the market and scales fairly
 * across the flash-to-frontier price spread.
 */
export const BYOK_FEE_PCT = 0.15;

/** The platform-fee USD for a BYOK call's rated spend, at the given fee %. Pure. Non-finite/negative input costs 0. */
export function byokFeeUsd(ratedSpendUsd: number, feePct: number = BYOK_FEE_PCT): number {
  if (!Number.isFinite(ratedSpendUsd) || ratedSpendUsd <= 0) return 0;
  if (!Number.isFinite(feePct) || feePct <= 0) return 0;
  return ratedSpendUsd * feePct;
}

/**
 * PR-A3 — the artifact-type -> coarse credit cost table (pricing-architecture §6c,
 * §11b). Deliberately coarse so it is legible ("a mission is about 10 credits"), not a
 * token-derived number. Founder-tunable; the mechanism (one flat cost per artifact type)
 * is final.
 */
export type ArtifactKind = "mission" | "build" | "prd" | "brief" | "decision" | "research";

export const ARTIFACT_CREDIT_COST: Record<ArtifactKind, number> = {
  mission: 10,
  build: 25,
  prd: 8,
  decision: 5,
  brief: 3,
  research: 6,
};

/** The coarse credit cost for a delivered artifact type. Pure. Unknown kinds cost 0 (never bill a shape we haven't priced). */
export function artifactCreditCost(kind: ArtifactKind): number {
  return ARTIFACT_CREDIT_COST[kind] ?? 0;
}

/**
 * PR-A1 — terminal run/mission statuses that constitute "delivered" (an artifact was
 * produced) vs "abandoned" (stopped, failed, or halted before delivery — never billed).
 * `completed_with_failures` still counts as delivered: the run finished and produced
 * something the user can inspect, even if a sub-step failed along the way; only a run
 * that never reached a terminal delivery state is free.
 */
const DELIVERED_STATUSES: ReadonlySet<string> = new Set([
  "completed",
  "completed_with_failures",
  "shipped",
]);
const ABANDONED_STATUSES: ReadonlySet<string> = new Set([
  "halted",
  "failed",
  "stopped",
  "cancelled",
  "canceled",
]);

/** True when a run/mission's terminal status represents a delivered artifact. Pure. */
export function isDeliveredStatus(status: string): boolean {
  return DELIVERED_STATUSES.has(status);
}

/** True when a run/mission's terminal status represents an abandoned (never-billed) run. Pure. */
export function isAbandonedStatus(status: string): boolean {
  return ABANDONED_STATUSES.has(status);
}
