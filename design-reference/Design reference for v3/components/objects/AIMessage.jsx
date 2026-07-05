import React from "react";

/** AI message: glacier presence dot, body with citations, receipts footer. */
export function AIMessage({ children, sources, time, cost, onTrace, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div style={{ display: "flex", gap: 12, fontFamily: "var(--font-ui)", ...style }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 99,
          background: "var(--glacier)",
          boxShadow: "0 0 12px 2px rgba(127,209,220,0.45)",
          marginTop: 6,
          flex: "none",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13.5px",
            lineHeight: 1.65,
            color: "var(--text-body)",
            background: "var(--surface-card-deep)",
            border: "1px solid var(--hairline-faint)",
            borderRadius: "var(--radius-card)",
            padding: "14px 16px",
          }}
        >
          {children}
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 8,
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.08em",
            color: "var(--text-faint)",
            flexWrap: "wrap",
          }}
        >
          {sources != null && <span>{sources} SOURCES</span>}
          {time && <span>{time}</span>}
          {cost && <span>{cost}</span>}
          <span
            onClick={onTrace}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ color: hover ? "var(--glacier)" : "var(--text-subtle)", cursor: "pointer" }}
          >
            HOW I GOT THIS →
          </span>
        </div>
      </div>
    </div>
  );
}
