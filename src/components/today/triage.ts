// Loom W2-TODAY (DESIGN-LOOM §8b) — pure triage logic for the calls queue.
//
// The queue triages itself: calls group by family (the kind of judgment the
// human owes), the highest-stakes family leads, and within a group the call
// expiring soonest floats first. Pure and framework-free so the ordering
// contract is unit-testable without mounting React.
import { toolConsequence, isSideEffectingTool } from "@/lib/tool-consequences";
import { agentDisplayName } from "@/lib/agent-vocabulary";

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

/**
 * How long ago a gate expired, for the quiet Expired group (R2-ATTENTION #2).
 * Empty for null/junk dates or a date still in the future — absence over a
 * fabricated number (§9b).
 */
export function expiredAgo(expiresAtIso: string | null, now: number = Date.now()): string {
  if (!expiresAtIso) return "";
  const t = Date.parse(expiresAtIso);
  if (Number.isNaN(t) || t > now) return "";
  const minutes = Math.floor((now - t) / 60_000);
  if (minutes < 60) return `expired ${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `expired ${hours}h ago`;
  return `expired ${Math.floor(hours / 24)}d ago`;
}

/** Catalog verbs are third-person singular ("Plans", "Dispatches"); the
 * headline needs the base form ("plan", "dispatch"). Covers the catalog's
 * inflections only — this is a display transform, not a lemmatizer. */
function baseVerb(verb: string): string {
  if (/(ches|shes|xes|sses)$/i.test(verb)) return verb.slice(0, -2);
  if (/ies$/i.test(verb)) return `${verb.slice(0, -3)}y`;
  if (/[^s]s$/i.test(verb)) return verb.slice(0, -1);
  return verb;
}

/**
 * Consumer headline for a tool gate (register D-26 + R2-ATTENTION #3): name
 * the catalogued outcome, never the mechanism. "Orchestrator wants to plan
 * the mission into a small step-by-step DAG", not "orchestrator wants to run
 * mission.plan". An uncatalogued tool keeps the honest slug form (its effect
 * is unknown, and a paraphrase would outrun the wiring); the raw slug always
 * stays available for the card's mono metadata line.
 */
export function gateHeadline(
  agentSlug: string | null | undefined,
  toolName: string | null | undefined,
): string {
  // The product's user-facing agent vocabulary, not a title-cased slug:
  // "orchestrator" reads Chief of Staff, "qa" reads Review.
  const who = agentSlug ? agentDisplayName(agentSlug) : "An agent";
  if (!toolName) return `${who} is waiting on your call`;
  if (!isSideEffectingTool(toolName)) {
    // Humanize the dotted slug: "mission.plan" -> "mission plan"
    const readable = toolName.replace(/\./g, " ");
    return `${who} wants to ${readable}`;
  }
  const effect = toolConsequence(toolName).effect;
  const firstSentence = effect.split(". ")[0].replace(/\.\s*$/, "");
  const [verb, ...rest] = firstSentence.split(" ");
  const phrase = [baseVerb(verb).toLowerCase(), ...rest].join(" ");
  return `${who} wants to ${phrase}`;
}
