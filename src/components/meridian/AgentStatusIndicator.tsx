/**
 * Live agent status indicator — agentic-first UX.
 * Shows ONLY when sense agent actively working (not idle/stopped).
 * Core USP per design system brief.
 */
import * as React from "react";
import { formatDistance } from "date-fns";

export interface AgentStatusIndicatorProps {
  agent?: {
    name: string;
    state: "working" | "idle" | "stopped";
    lastActivityAt?: Date;
  };
}

export function AgentStatusIndicator({ agent }: AgentStatusIndicatorProps) {
  // Show ONLY when actively working. Not when idle or stopped.
  if (!agent || agent.state !== "working") {
    return null;
  }

  const activityTime = agent.lastActivityAt
    ? formatDistance(agent.lastActivityAt, new Date(), { addSuffix: true })
    : "now";

  return (
    <div
      className="flex items-center gap-mrd-s2 px-mrd-s3 py-mrd-s2 bg-mrd-lift rounded-mrd-chip border border-mrd-edge-focus"
      data-mrd=""
    >
      {/* Status indicator dot */}
      <div className="flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-mrd-agent animate-pulse" />
      </div>

      {/* Agent info */}
      <div className="flex-1 min-w-0">
        <div className="text-mrd-t-sm font-mrd-w-500 text-mrd-ink truncate">{agent.name}</div>
        <div className="text-mrd-t-nano text-mrd-mute">Working • {activityTime}</div>
      </div>
    </div>
  );
}
