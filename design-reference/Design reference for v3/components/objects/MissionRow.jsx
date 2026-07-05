import React from "react";
import { StatusDot } from "../core/StatusDot.jsx";
import { VerdictChip } from "../core/VerdictChip.jsx";

/** Mission row: status dot + title + agent/step in mono + cost. Opens the slide-over. */
export function MissionRow({ title, status = "queued", stepLabel, verdict, cost, onClick, style }) {
  const [hover, setHover] = React.useState(false);
  const stepColor =
    {
      working: "var(--glacier)",
      waiting: "var(--ember)",
      thinking: "var(--blossom)",
      review: "var(--marigold)",
      shipped: "var(--moss)",
      blocked: "var(--madder)",
      queued: "var(--text-subtle)",
    }[status] || "var(--text-subtle)";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        width: "100%",
        padding: "14px 18px",
        background: hover ? "#141416" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--hairline-faint)",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
        textAlign: "left",
        transition: "background var(--dur-control) var(--ease)",
        ...style,
      }}
    >
      <StatusDot status={status} showLabel={false} />
      <span
        style={{
          fontSize: "13.5px",
          fontWeight: 600,
          color: "var(--text-primary)",
          flex: 1,
          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </span>
      {verdict && (
        <VerdictChip verdict={verdict} style={{ fontSize: "8.5px", padding: "1px 8px" }} />
      )}
      {stepLabel && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.08em",
            color: stepColor,
            flex: "none",
            minWidth: 96,
            textAlign: "right",
          }}
        >
          {stepLabel}
        </span>
      )}
      {cost && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--text-faint)",
            flex: "none",
            minWidth: 44,
            textAlign: "right",
          }}
        >
          {cost}
        </span>
      )}
    </button>
  );
}
