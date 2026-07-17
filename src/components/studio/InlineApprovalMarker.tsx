/**
 * PC-29 Layer 7a: inline approval marker on Build mission cards.
 * Shows what's being approved and links to the approvals queue.
 * The trust plane made felt: strangers see "who needs to decide" without leaving the card.
 */
import { Link } from "@tanstack/react-router";
import { Clock, Lock } from "lucide-react";
import { Fragment } from "react";
import type { MissionApprovalRow } from "@/hooks/use-mission-approvals";

export function InlineApprovalMarker({ approvals }: { approvals: MissionApprovalRow[] }) {
  if (!approvals.length) return null;

  const agentNames = [...new Set(approvals.map((a) => a.agent_slug || "Unknown"))];
  const toolNames = [...new Set(approvals.map((a) => a.tool_name))];
  const hasExpiry = approvals.some((a) => a.expires_at);

  return (
    <Link
      to="/engine-room"
      search={{ room: "record", view: "approvals" }}
      onClick={(e) => e.stopPropagation()}
      title={`${agentNames.join(", ")} wants to ${toolNames.join(", ")}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--madder)",
        textDecoration: "none",
        padding: "4px 8px",
        borderRadius: "var(--radius-micro)",
        background: "var(--ds-ember-bg-subtle)",
        border: "1px solid var(--hairline)",
        transition: "background-color 150ms var(--ds-motion-timing-swift)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ds-ember-bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ds-ember-bg-subtle)")}
    >
      <Lock size={14} style={{ flexShrink: 0 }} />
      <span style={{ textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
        {approvals.length} approval{approvals.length !== 1 ? "s" : ""}
      </span>
      {hasExpiry && <Clock size={14} style={{ flexShrink: 0, opacity: 0.7 }} />}
    </Link>
  );
}
