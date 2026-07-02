// TopBar — OBS-02: a 52px Obsidian bar. The left crumb trail collapses to a
// surface title (from the last crumb) + an optional subtitle (the
// penultimate crumb); no lucide chevrons. Right side keeps the `actions`
// slot, then a mono-caps date and a workspace pill. The auxiliary widgets
// (AttentionBell, MachineViewToggle, ConstructionPill, CookingBanner,
// LoopThread, AmbientChip) keep their current markup — their reskin rides
// with later OBS items (scope OUT of this one).
import { useEffect, useState, type ReactNode } from "react";
import { AmbientChip } from "./AmbientChip";
import { AttentionBell } from "./AttentionBell";
import { CookingBanner, ConstructionPill } from "./CookingBanner";
import { LoopThread } from "./LoopThread";
import { MachineViewToggle } from "./MachineViewToggle";
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
    <>
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
            <span className="truncate" style={{ fontSize: 12, color: "var(--text-faint)" }}>
              {subtitle}
            </span>
          )}
        </div>
        {/* Twin spacers center the pill between the title and date/actions
            clusters; being in-flow, it can never overlap either (it
            ellipsizes, then hides under 1100px via its own media query). */}
        <span style={{ flex: 1 }} />
        <ConstructionPill />
        <span style={{ flex: 1 }} />
        {actions}
        <MachineViewToggle />
        <AttentionBell />
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
        <AmbientChip inline />
      </header>
      <LoopThread />
      <CookingBanner />
    </>
  );
}
