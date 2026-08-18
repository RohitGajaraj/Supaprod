/**
 * AgentStatusIndicator: Shows agent activity with premium styling.
 *
 * Displays when a sense agent is actively running (not idle, not stopped).
 * Shows: agent name, state (working/idle), last activity timestamp.
 *
 * Part of Meridian adoption for agentic-first UX.
 *
 * Meridian rendering:
 * - data-mrd root
 * - Uses --mrd-* tokens only
 * - Premium OpenAI/Google standard UX
 */

import * as React from "react";

export type AgentState = "working" | "idle" | "running" | "asking" | "queued";

export function AgentStatusIndicator({
  agentName,
  state = "idle",
  lastActivity,
  showOnly = false,
}: {
  /** Display name of the agent (e.g. "Discovery Scout"). */
  agentName: string;
  /** Agent state: working, idle, running, etc. */
  state?: AgentState;
  /** ISO timestamp of last activity. */
  lastActivity?: string | null;
  /** If true, only show when agent is actively running. Default false. */
  showOnly?: boolean;
}) {
  // Only render when agent is actively working, not idle
  if (showOnly && state !== "running" && state !== "working" && state !== "asking") {
    return null;
  }

  const isActive = state === "running" || state === "working" || state === "asking";
  const stateLabel = state || "idle";

  const activityText =
    lastActivity && isActive
      ? `Last activity ${formatTime(new Date(lastActivity))}`
      : isActive
        ? "Starting up..."
        : "Idle";

  return (
    <div
      data-mrd=""
      className="inline-flex items-center gap-mrd-3 px-mrd-3 py-mrd-2 rounded-mrd-xs bg-mrd-lift border border-mrd-line"
    >
      {/* Status indicator dot */}
      <div
        className={`w-2 h-2 rounded-full shrink-0 transition-colors`}
        style={{
          backgroundColor: isActive ? "var(--mrd-agent)" : "var(--mrd-mute)",
          transitionDuration: "var(--mrd-d-press)",
        }}
      />

      {/* Agent name and status */}
      <div className="flex flex-col gap-mrd-1">
        <div className="text-[12.5px] font-medium text-mrd-ink">{agentName}</div>
        <div
          className={`text-[11px] leading-relaxed ${
            isActive ? "text-mrd-agent font-medium" : "text-mrd-mute"
          }`}
        >
          {stateLabel} · {activityText}
        </div>
      </div>
    </div>
  );
}

/** Format a timestamp for display. */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
