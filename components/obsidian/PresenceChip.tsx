// AGENT-EXP (PC-29 layer 2, the felt agent layer): the presence chip - a
// small, honest read of an agent's live state (working now / last acted /
// next scheduled run), built entirely on the shipped AgentBadge/AgentMark
// visual language (same hue-by-agent, same glyph, the same shimmer for a
// running agent). Pure presentational: it never fetches anything itself.
// Callers pass already-fetched state, the same shape getAgentFleet already
// hands back (agent-fleet.functions.ts) - see the station-header wiring in
// DiscoverSurface / DecideSurface / PlanSurface / build.index / brain.

import { AgentBadge } from "@/components/agents/AgentMark";

export type PresenceState = "working" | "idle";

export interface PresenceChipProps {
  /** The DB agent slug (e.g. "discovery-scout"). Resolved to a display name
   *  and hue inside AgentBadge - a raw slug is never rendered. */
  agentSlug: string;
  state: PresenceState;
  /** ISO timestamp of the agent's most recent run, when known. */
  lastActedAt?: string | null;
  /** ISO timestamp of the agent's next scheduled run, when known. */
  nextRunAt?: string | null;
  /** Lowercase station word for the suffix ("discover", "decide", "define",
   *  "build", "brain"). Optional - the chip still reads fine without it. */
  station?: string | null;
  size?: number;
}

/** The mission surface's time idiom: "22:00" (StageTimeline's fmtAt, minus
 * the day prefix - a presence chip only ever needs the clock). */
function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** The status suffix: "discover, working now" / "discover, last acted
 * 22:00" / "discover, next run 09:00" / just the station word when nothing
 * is known yet, else null (AgentBadge then renders name-only). */
function presenceSuffix({
  state,
  lastActedAt,
  nextRunAt,
  station,
}: Pick<PresenceChipProps, "state" | "lastActedAt" | "nextRunAt" | "station">): string | null {
  const prefix = station ? `${station}, ` : "";
  if (state === "working") return `${prefix}working now`;
  if (lastActedAt) return `${prefix}last acted ${fmtClock(lastActedAt)}`;
  if (nextRunAt) return `${prefix}next run ${fmtClock(nextRunAt)}`;
  return station ?? null;
}

/**
 * A small chip showing an agent's live state on a station header. Reuses
 * AgentBadge wholesale (mark + name + subline) rather than a bespoke inline
 * treatment - only the suffix text is new.
 */
export function PresenceChip({
  agentSlug,
  state,
  lastActedAt,
  nextRunAt,
  station,
  size = 20,
}: PresenceChipProps) {
  const verb = presenceSuffix({ state, lastActedAt, nextRunAt, station });
  return (
    <AgentBadge slug={agentSlug} verb={verb} size={size} live={state === "working"} pixelName />
  );
}
