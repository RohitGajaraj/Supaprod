import * as React from "react";

/** GitHub live-pulse strip (§7). Connections live in Settings (OBS-13);
 * this is a read-only glance, never a Connect/manage action. */
export function ConnectionStrip() {
  return (
    <div
      className="flex flex-wrap items-center"
      style={{
        gap: "14px",
        backgroundColor: "var(--surface-card-deep)",
        border: "1px solid var(--hairline)",
        borderRadius: "10px",
        padding: "12px 16px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        GitHub
      </span>
      <span
        style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-subtle)" }}
      >
        ACME/LUMEN-APP · CONNECTED BY ROHIT
      </span>
      <span
        className="inline-flex items-center uppercase"
        style={{
          gap: "6px",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          letterSpacing: "0.08em",
          color: "var(--moss-bright)",
        }}
      >
        <span
          aria-hidden="true"
          className="inline-block rounded-full"
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: "var(--moss)",
            boxShadow: "0 0 8px 1px rgba(127, 191, 142, 0.6)",
            animation: "cadPulse 2.4s ease-in-out infinite",
          }}
        />
        LIVE · SYNCED 4 MIN AGO
      </span>
      <span className="flex-1" />
      <span
        style={{ fontFamily: "var(--font-ui)", fontSize: "11.5px", color: "var(--text-faint)" }}
      >
        Connections live in Settings · one home, no duplicates
      </span>
    </div>
  );
}
