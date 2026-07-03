// TopBar — OBS-02 → LOOM W1 (2026-07-04): a 52px Obsidian bar, now QUIET
// (DESIGN-LOOM §9b, one ambient status line maximum). Removed from chrome:
// the machine-view toggle (the ?view=machine mechanism stays for agents),
// the AttentionBell (Today's queue + the rail badge own attention), the
// weather/geo AmbientChip (its ipapi fetch is CORS-dead in prod and showed
// wrong data), and the ConstructionPill/CookingBanner/LoopThread strips
// (the rail's shimmer working line is THE one ambient machine-status
// signal). Left: title crumb, the `actions` slot, mono date, workspace pill.
import { useEffect, useState, type ReactNode } from "react";
import { useWorkspace } from "@/hooks/use-workspace";

export function TopBar({ crumbs, actions }: { crumbs: string[]; actions?: ReactNode }) {
  const [date, setDate] = useState("");
  const { activeWorkspace } = useWorkspace();
  useEffect(() => {
    const d = new Date()
      .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      .toUpperCase()
      .replace(",", " ·");
    setDate(d);
  }, []);

  const title = crumbs[crumbs.length - 1];
  const subtitle = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 28px",
        height: 52,
        flexShrink: 0,
        borderBottom: "1px solid var(--hairline-faint)",
        background: "var(--canvas)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div className="min-w-0 flex flex-col justify-center" style={{ overflow: "hidden" }}>
        <span
          className="truncate"
          style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}
        >
          {title}
        </span>
        {subtitle && (
          <span className="truncate" style={{ fontSize: 12, color: "var(--text-subtle)" }}>
            {subtitle}
          </span>
        )}
      </div>
      <span style={{ flex: 1 }} />
      {actions}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {date}
      </span>
      {activeWorkspace?.name && (
        <span
          className="truncate"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: 99,
            padding: "3px 10px",
            maxWidth: 140,
            textTransform: "uppercase",
          }}
        >
          {activeWorkspace.name}
        </span>
      )}
    </header>
  );
}
