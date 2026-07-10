/**
 * SW-5 (mission 3.11) — the render for Today's four segregated lanes. Data comes
 * from a single source (getTodayLanes), so the surface is computed-and-grouped,
 * not a data dump. Per the Obsidian design contract: Lane 1 (Needs your
 * judgment) is the ONLY ember lane; lanes 2-4 speak in the calm glacier/neutral
 * machine voice. These are presentational — no data fetching here.
 */

import * as React from "react";
import type {
  TodayLane1,
  TodayLane2,
  TodayLane3,
  TodayLane4,
  WatchItem,
} from "@/lib/today-lanes.functions";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/cadence/AutoChip";

function fmtUsd(n: number): string {
  if (n <= 0) return "$0";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

const monoLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

/** The shared lane frame: a titled section with a count and a thin rule. Lane 1
 * carries the lone ember accent; the rest are neutral. */
function LaneSection({
  title,
  count,
  accent,
  hint,
  children,
}: {
  title: string;
  count?: number;
  accent?: "ember" | "neutral";
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2
          style={{
            ...monoLabel,
            fontSize: 11,
            color: accent === "ember" ? "var(--ember-text)" : "var(--text-subtle)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        {typeof count === "number" ? (
          <span style={{ ...monoLabel, fontSize: 10.5, color: "var(--text-faint)" }}>{count}</span>
        ) : null}
        {hint ? <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{hint}</span> : null}
        <div style={{ flex: 1, height: 1, background: "var(--hairline)", alignSelf: "center" }} />
      </div>
      {children}
    </section>
  );
}

function LaneEmpty({ text }: { text: string }) {
  return (
    <p
      style={{ fontSize: 12.5, color: "var(--text-faint)", margin: "2px 0 0", fontStyle: "italic" }}
    >
      {text}
    </p>
  );
}

const card: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "12px 14px",
  boxShadow: "var(--top-light)",
};

// ---------------------------------------------------------------------------
// Lane 1 — pushed Brain insights (the judgment lane's additive half; the
// approval gates render from the existing TriageQueue above this).
// ---------------------------------------------------------------------------

const INSIGHT_LABEL: Record<string, string> = {
  next_best_action: "Do next",
  hidden_connection: "Hidden pattern",
  cost_of_inaction: "Cost of waiting",
};

export function PushedInsights({
  lane,
  onOpen,
  onAct,
}: {
  lane: TodayLane1;
  onOpen: () => void;
  /** SEAM-3 one-click action on a pushed insight (push_action rows). */
  onAct?: (ins: TodayLane1["insights"][number]) => void;
}) {
  if (lane.insights.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {lane.insights.map((ins) => {
        const pushAction = ins.action?.kind && onAct ? ins.action : null;
        // The button carries a short, plain action label, never the full goal
        // sentence: dumping the goal into a mono-caps label produced an
        // all-uppercase sentence (a Loom section 1 violation). The goal already
        // reads in the headline and detail above.
        const actionLabel = pushAction?.label?.trim() || "Open in Brain";
        return (
          <div
            key={ins.id}
            style={{ ...card, borderColor: "var(--ember-hairline, var(--hairline))" }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ ...monoLabel, color: "var(--ember-text)" }}>
                {INSIGHT_LABEL[ins.kind] ?? "Insight"}
              </span>
              <span style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 460 }}>
                {ins.headline}
              </span>
            </div>
            {ins.detail ? (
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--text-body)",
                  margin: "0 0 10px",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {ins.detail}
              </p>
            ) : null}
            <button
              type="button"
              onClick={pushAction ? () => onAct!(ins) : onOpen}
              className="loom-press transition-colors hover:[background-color:var(--surface-raised)] hover:[border-color:var(--text-faint)]"
              style={{
                alignSelf: "flex-start",
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--glacier)",
                background: "transparent",
                border: "1px solid var(--hairline-strong)",
                borderRadius: "var(--radius-control)",
                padding: "5px 11px",
                cursor: "pointer",
              }}
            >
              {actionLabel}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lane 2 — What the swarm did (grouped by mission, with cost)
// ---------------------------------------------------------------------------

export function SwarmActivityLane({
  lane,
  onOpenMission,
}: {
  lane: TodayLane2;
  onOpenMission: (missionId: string) => void;
}) {
  return (
    <LaneSection
      title="What the swarm did"
      hint={
        lane.total_cost_usd > 0
          ? `${fmtUsd(lane.total_cost_usd)} in the last 24h`
          : "in the last 24 hours"
      }
    >
      {lane.groups.length === 0 ? (
        <LaneEmpty text="No swarm activity in the last 24 hours." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lane.groups.map((g) => {
            const clickable = g.key !== "unassigned";
            return (
              <div
                key={g.key}
                style={{
                  ...card,
                  cursor: clickable ? "pointer" : "default",
                }}
                onClick={clickable ? () => onOpenMission(g.key) : undefined}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpenMission(g.key);
                        }
                      }
                    : undefined
                }
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span
                    className="min-w-0 flex-1 truncate"
                    style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 460 }}
                  >
                    {stripAutoPrefix(g.title)}
                  </span>
                  {isAutoTitle(g.title) ? <AutoChip /> : null}
                  {g.cost_usd > 0 ? (
                    <span style={{ ...monoLabel, fontSize: 10, color: "var(--text-subtle)" }}>
                      {fmtUsd(g.cost_usd)}
                    </span>
                  ) : null}
                  <span style={{ ...monoLabel, fontSize: 10, color: "var(--text-faint)" }}>
                    {g.count} {g.count === 1 ? "move" : "moves"}
                  </span>
                </div>
                {g.goal ? (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-faint)",
                      marginTop: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {g.goal}
                  </div>
                ) : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {g.items.map((it) => (
                    <span
                      key={it.id}
                      style={{
                        ...monoLabel,
                        fontSize: 9.5,
                        color: "var(--text-subtle)",
                        background: "var(--surface-card-deep)",
                        borderRadius: 4,
                        padding: "2px 6px",
                      }}
                    >
                      {it.stage}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </LaneSection>
  );
}

// ---------------------------------------------------------------------------
// Lane 3 — At risk / watch (foresight + calibration + assumptions)
// ---------------------------------------------------------------------------

const WATCH_LABEL: Record<WatchItem["type"], string> = {
  prediction_risk: "Watch",
  calibration_miss: "Missed call",
  assumption_challenge: "Challenged",
};

function WatchLaneBody({ lane }: { lane: TodayLane3 }) {
  if (lane.items.length === 0) {
    return (
      <LaneEmpty text="Nothing flagged. No open predictions, misses, or challenged assumptions." />
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {lane.items.map((it) => (
        <div key={it.id} style={card}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
            <span
              style={{
                ...monoLabel,
                color: it.type === "calibration_miss" ? "var(--madder)" : "var(--text-subtle)",
              }}
            >
              {WATCH_LABEL[it.type]}
            </span>
            <span
              className="min-w-0 flex-1 truncate"
              style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 460 }}
            >
              {it.title}
            </span>
            {it.confidence != null ? (
              <span style={{ ...monoLabel, fontSize: 10, color: "var(--text-faint)" }}>
                {Math.round(it.confidence * 100)}%
              </span>
            ) : null}
          </div>
          {it.description ? (
            <p
              style={{
                fontSize: 12.5,
                color: "var(--text-body)",
                margin: "0 0 4px",
                lineHeight: 1.5,
              }}
            >
              {it.description}
            </p>
          ) : null}
          {it.recommendation ? (
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              → {it.recommendation}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function WatchLane({ lane, bare }: { lane: TodayLane3; bare?: boolean }) {
  // PC-32 block 5: `bare` renders just the list — the Watch slide-over's
  // header already names the zone, so the section frame would duplicate it.
  if (bare) return <WatchLaneBody lane={lane} />;
  return (
    <LaneSection title="At risk / watch" count={lane.count || undefined}>
      <WatchLaneBody lane={lane} />
    </LaneSection>
  );
}

// ---------------------------------------------------------------------------
// Lane 4 — Shipped and what it cost (outcomes + cost-per-outcome)
// ---------------------------------------------------------------------------

const VERDICT_DOT: Record<string, string> = {
  achieved: "var(--moss)",
  partial: "var(--glacier)",
  missed: "var(--madder)",
};
const VERDICT_LABEL: Record<string, string> = {
  achieved: "Achieved",
  partial: "Partial",
  missed: "Missed",
};

export function ShippedLane({ lane }: { lane: TodayLane4 }) {
  const hint =
    lane.shipped_count > 0
      ? `${lane.shipped_count} shipped · avg ${fmtUsd(lane.avg_cost_per_outcome_usd)}/outcome`
      : undefined;
  return (
    <LaneSection title="Shipped and what it cost" hint={hint}>
      {lane.items.length === 0 ? (
        <LaneEmpty text="No outcomes closed in the last 30 days." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lane.items.map((it) => (
            <div key={it.id} style={card}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    background: VERDICT_DOT[it.verdict] ?? "var(--glacier)",
                    flexShrink: 0,
                    alignSelf: "center",
                  }}
                />
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 460 }}
                >
                  {it.title}
                </span>
                <span style={{ ...monoLabel, fontSize: 10, color: "var(--text-subtle)" }}>
                  {VERDICT_LABEL[it.verdict] ?? it.verdict}
                </span>
                {it.spent_usd > 0 ? (
                  <span style={{ ...monoLabel, fontSize: 10, color: "var(--text-faint)" }}>
                    {fmtUsd(it.spent_usd)}
                  </span>
                ) : null}
              </div>
              {it.metric_label && it.metric_value != null ? (
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--text-faint)",
                    marginTop: 3,
                    paddingLeft: 17,
                  }}
                >
                  {it.metric_label}: {it.metric_value}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </LaneSection>
  );
}
