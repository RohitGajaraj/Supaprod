import React from "react";
import { Button } from "../core/Button.jsx";
import { Cite } from "../core/Cite.jsx";

/** The Call card: the atomic unit of the product. Identical everywhere it appears. */
export function CallCard({
  kind = "SHIP IT?",
  expiry,
  title,
  body,
  evidence = [],
  okLabel = "Approve",
  noLabel = "Send back",
  consequence,
  onApprove,
  onSendBack,
  style,
}) {
  return (
    <div
      style={{
        background: "var(--surface-card-deep)",
        border: "1px solid rgba(255,107,44,0.25)",
        borderRadius: "var(--radius-card)",
        padding: "20px 22px",
        fontFamily: "var(--font-ui)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "0.1em",
            fontWeight: 600,
            color: "var(--ember)",
            border: "1px solid rgba(255,107,44,0.4)",
            borderRadius: 99,
            padding: "2px 9px",
          }}
        >
          {kind}
        </span>
        {expiry && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              letterSpacing: "0.1em",
              color: "var(--text-faint)",
              textTransform: "uppercase",
            }}
          >
            {expiry}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "20px",
          fontWeight: 460,
          color: "var(--text-primary)",
          lineHeight: 1.3,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {body && (
        <div
          style={{
            fontSize: "13px",
            lineHeight: 1.65,
            color: "var(--text-muted)",
            marginBottom: 12,
          }}
        >
          {body}
        </div>
      )}
      {evidence.length > 0 && (
        <div style={{ display: "grid", gap: 5, marginBottom: 16 }}>
          {evidence.map((e, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 9,
                alignItems: "baseline",
                fontSize: "12.5px",
                lineHeight: 1.5,
                color: "var(--text-body)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "8.5px",
                  letterSpacing: "0.08em",
                  color: "var(--blossom)",
                  border: "1px solid rgba(229,189,223,0.35)",
                  borderRadius: 99,
                  padding: "0 6px",
                  flex: "none",
                }}
              >
                {e.source}
              </span>
              <span>
                {e.text}
                {e.cite && <Cite n={e.cite.n} quote={e.cite.quote} source={e.source} />}
              </span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Button variant="primary" onClick={onApprove}>
          {okLabel}
        </Button>
        <Button variant="secondary" onClick={onSendBack}>
          {noLabel}
        </Button>
        {consequence && (
          <span style={{ fontSize: "11.5px", color: "var(--text-subtle)" }}>{consequence}</span>
        )}
      </div>
    </div>
  );
}
