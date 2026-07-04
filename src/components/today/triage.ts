// Loom W2-TODAY (DESIGN-LOOM §8b) — pure triage logic for the calls queue.
//
// The queue triages itself: calls group by family (the kind of judgment the
// human owes), the highest-stakes family leads, and within a group the call
// expiring soonest floats first. Pure and framework-free so the ordering
// contract is unit-testable without mounting React.

export type CallFamily = "ship" | "build" | "reexamine";

/** The rendering order of the families: agent tool gates carry expiries and
 * side effects, so they are the highest-stakes group and lead the queue. */
export const FAMILY_ORDER: CallFamily[] = ["ship", "build", "reexamine"];

export const FAMILY_LABEL: Record<CallFamily, string> = {
  ship: "Ship it?",
  build: "Worth building?",
  reexamine: "Worth re-examining?",
};

export interface TriageOrderable {
  /** Epoch ms when the call expires, or null when it never does. */
  expiresAt: number | null;
  /** Epoch ms when the call was raised — newest first among never-expiring calls. */
  raisedAt: number;
}

/**
 * Within a group: expiring-soonest first (already-expired calls are the most
 * urgent of all), then never-expiring calls newest-first. Stable for ties.
 */
export function sortWithinGroup<T extends TriageOrderable>(calls: T[]): T[] {
  return [...calls].sort((a, b) => {
    if (a.expiresAt != null && b.expiresAt != null) return a.expiresAt - b.expiresAt;
    if (a.expiresAt != null) return -1;
    if (b.expiresAt != null) return 1;
    return b.raisedAt - a.raisedAt;
  });
}

/**
 * Mono-caps expiry chip copy. Honest tenses: an expired gate says so, a live
 * one names the window that is left. Empty when the call never expires —
 * absence over a fabricated number (DESIGN-LOOM §9b).
 */
export function expiryLabel(expiresAtIso: string | null, now: number = Date.now()): string {
  if (!expiresAtIso) return "";
  const t = Date.parse(expiresAtIso);
  if (Number.isNaN(t)) return "";
  const deltaMinutes = Math.round((t - now) / 60_000);
  if (deltaMinutes <= 0) return "EXPIRED";
  if (deltaMinutes < 60) return `EXPIRES IN ${deltaMinutes}M`;
  const hours = Math.round(deltaMinutes / 60);
  if (hours < 48) return `EXPIRES IN ${hours}H`;
  return `EXPIRES IN ${Math.round(hours / 24)}D`;
}
