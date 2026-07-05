import React from "react";

/** Cadence button. One or two plain human words; mechanism names are banned.
 *  variant: "primary" (the one ember CTA), "secondary", "quiet". */
export function Button({ variant = "secondary", size = "md", helper, children, style, ...rest }) {
  const base = {
    fontFamily: "var(--font-ui)",
    fontSize: size === "sm" ? "12.5px" : "13px",
    borderRadius: "var(--radius-control)",
    padding: size === "sm" ? "7px 15px" : "9px 18px",
    cursor: "pointer",
    transition: "background var(--dur-control) var(--ease)",
    border: "none",
  };
  const variants = {
    primary: { fontWeight: 600, color: "var(--cta-ink)", background: "var(--cta)" },
    secondary: {
      fontWeight: 500,
      color: "var(--text-primary)",
      background: "var(--hover)",
      border: "1px solid var(--hairline-strong)",
      padding: size === "sm" ? "6px 15px" : "8px 18px",
    },
    quiet: {
      fontWeight: 500,
      color: "var(--text-muted)",
      background: "transparent",
      padding: size === "sm" ? "6px 10px" : "8px 12px",
    },
  };
  const [hover, setHover] = React.useState(false);
  const hoverFx = {
    primary: { background: "var(--cta-pressed)" },
    secondary: { background: "#242429" },
    quiet: { color: "var(--text-primary)" },
  };
  const btn = (
    <button
      style={{ ...base, ...variants[variant], ...(hover ? hoverFx[variant] : null), ...style }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {children}
    </button>
  );
  if (!helper) return btn;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {btn}
      <span
        style={{ fontSize: "11.5px", color: "var(--text-subtle)", fontFamily: "var(--font-ui)" }}
      >
        {helper}
      </span>
    </span>
  );
}
