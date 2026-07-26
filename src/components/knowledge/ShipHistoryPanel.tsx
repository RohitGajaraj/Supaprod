// ShipHistoryPanel - Brain tab (OBS-10, folds the retired /product Releases
// tab's read-only history: the legacy ReleasesPanel at
// src/components/product/ReleasesPanel.tsx). Strictly read-only, zero
// mutations - completed Studio/Build missions and completed agent runs, via
// the same getOutcomeData server function. Named ShipHistoryPanel (not
// ReleasesPanel) because that name is already taken by the legacy component,
// which may briefly coexist during this port.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { getOutcomeData } from "@/lib/outcome.functions";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { StatusDot, STATUS_WORD } from "@/components/obsidian/status";
import { fmtUsd, relTime } from "./ship-format";
import { PanelSkeleton } from "./PanelSkeleton";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/supaprod/AutoChip";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
      }}
    >
      {children}
    </div>
  );
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the missions list shows the
// top few and expands on demand, so Brain never becomes a long wall. Runs
// already cap at 10 (runs.slice below); this is the missions half of that.
const VISIBLE_MISSIONS = 8;

export function ShipHistoryPanel() {
  const fOutcome = useServerFn(getOutcomeData);
  const [showAll, setShowAll] = useState(false);
  const outcome = useQuery({ queryKey: ["outcome"], queryFn: () => fOutcome() });

  const missions = outcome.data?.releases.missions ?? [];
  const runs = outcome.data?.releases.runs ?? [];
  const empty = missions.length === 0 && runs.length === 0;

  if (outcome.isLoading) {
    return <PanelSkeleton />;
  }

  if (outcome.isError) {
    return (
      <Card>
        <MonoLabel style={{ marginBottom: 8 }}>Ship history · failed to load</MonoLabel>
        <p style={{ color: "var(--text-muted)", marginBottom: 12 }}>
          {(outcome.error as Error).message}
        </p>
        <Button variant="secondary" onClick={() => void outcome.refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  if (empty) {
    return (
      <div
        style={{
          background: "var(--card)",
          border: "1px solid color-mix(in srgb, var(--moss) 30%, transparent)",
          borderRadius: "var(--radius-card)",
          padding: "28px 26px",
        }}
      >
        <p
          style={{ color: "var(--text-body)", margin: "0 0 12px", lineHeight: 1.55 }}
        >
          Ship history will land here. When a Build session completes end to end, it appears here
          with duration and cost.
        </p>
        <Link
          to="/build"
          style={{
            color: "var(--text-subtle)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
          }}
          className="hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        >
          Go to Build →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {missions.length > 0 ? (
        <MonoLabel style={{ display: "block" }}>
          Completed missions
        </MonoLabel>
      ) : null}
      {(showAll ? missions : missions.slice(0, VISIBLE_MISSIONS)).map((m) => (
        <Link
          key={m.id}
          to="/build/$missionId"
          params={{ missionId: m.id }}
          className="flex items-center hover:[background-color:var(--hover)]"
          style={{
            gap: 12,
            padding: "13px 18px",
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            textDecoration: "none",
          }}
        >
          <StatusDot state="shipped" word={STATUS_WORD.shipped} />
          <span
            style={{ fontWeight: 500, flexShrink: 0, color: "var(--text-primary)" }}
          >
            {stripAutoPrefix(m.title)}
          </span>
          {isAutoTitle(m.title) ? <AutoChip /> : null}
          <span
            className="truncate"
            style={{ flex: 1, minWidth: 0, color: "var(--text-muted)" }}
          >
            {m.goal}
          </span>
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-subtle)",
            }}
          >
            {m.hop_count} hop{m.hop_count === 1 ? "" : "s"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-subtle)",
            }}
          >
            {relTime(m.completed_at ?? m.updated_at)}
          </span>
          <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
        </Link>
      ))}

      {missions.length > VISIBLE_MISSIONS ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="loom-press w-full outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "8px 14px",
          }}
        >
          {showAll ? "Show fewer" : `Show ${missions.length - VISIBLE_MISSIONS} more`}
        </button>
      ) : null}

      {runs.length > 0 ? (
        <MonoLabel
          style={{
            display: "block",
            marginTop: missions.length ? 8 : 0,
          }}
        >
          Completed agent runs
        </MonoLabel>
      ) : null}
      {runs.slice(0, 10).map((r) => (
        <div
          key={r.id}
          className="flex items-center"
          style={{
            gap: 12,
            padding: "13px 18px",
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
          }}
        >
          <StatusDot state="done" word={STATUS_WORD.done} />
          <span
            style={{
              flexShrink: 0,
              fontFamily: "var(--font-mono)",
              color: "var(--text-subtle)",
            }}
          >
            {r.agent_name}
          </span>
          <span
            className="truncate"
            style={{ flex: 1, minWidth: 0, color: "var(--text-muted)" }}
          >
            {r.input}
          </span>
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-subtle)",
            }}
          >
            {r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : "-"} ·{" "}
            {Number(r.tokens_used ?? 0).toLocaleString()} tok · {fmtUsd(r.spend_used_usd)}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-subtle)",
            }}
          >
            {relTime(r.created_at)}
          </span>
          {r.mission_id ? (
            <Link
              to="/build/$missionId"
              params={{ missionId: r.mission_id }}
              aria-label="Open mission"
              style={{ display: "inline-flex", color: "var(--text-faint)" }}
            >
              <ChevronRight size={16} />
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}
