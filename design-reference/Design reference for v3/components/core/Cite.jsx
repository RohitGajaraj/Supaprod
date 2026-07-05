import React from "react";

/** Citation chip: superscript blossom [n]; verbatim quote + source on hover. */
export function Cite({ n = 1, quote, source, style }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          fontWeight: 600,
          color: "var(--blossom)",
          background: "rgba(229,189,223,0.10)",
          border: "1px solid rgba(229,189,223,0.35)",
          borderRadius: 99,
          padding: "0 5px",
          cursor: "pointer",
          verticalAlign: "super",
          lineHeight: 1.5,
          ...style,
        }}
      >
        {n}
      </span>
      {open && quote && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: 240,
            background: "var(--raised)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: 10,
            padding: "10px 12px",
            zIndex: 50,
            fontFamily: "var(--font-ui)",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "var(--text-body)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          {source && (
            <span
              style={{
                display: "inline-block",
                fontFamily: "var(--font-mono)",
                fontSize: "8.5px",
                letterSpacing: "0.08em",
                color: "var(--blossom)",
                border: "1px solid rgba(229,189,223,0.35)",
                borderRadius: 99,
                padding: "0 6px",
                marginBottom: 6,
              }}
            >
              {source}
            </span>
          )}
          <span style={{ display: "block" }}>{quote}</span>
        </span>
      )}
    </span>
  );
}
