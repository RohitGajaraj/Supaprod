// PC-32 block 4 — "While you slept": the receipts strip that replaces the
// SwarmActivityLane card grid. Max 5 rows, one line each: who (agent byline
// from stage_events.actor) moved what, when, with a receipt link into the
// mission trace. Quiet rows, never cards; overflow folds behind one door to
// the full activity view on Build.
import * as React from "react";
import type { TodayLane2, SwarmActivityGroup } from "@/lib/today-lanes.functions";
import { AgentMark } from "@/components/agents/AgentMark";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { relTimeCaps } from "@/components/discover/format";
import { stripAutoPrefix } from "@/components/plan/format";

const VISIBLE_ROWS = 5;

function fmtUsd(n: number): string {
  if (n <= 0) return "$0";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

/** stage_events.actor is 'human', an agent slug, or 'system'. */
function actorOf(group: SwarmActivityGroup): { label: string; slug: string | null } {
  const actor = group.items[0]?.actor ?? null;
  if (!actor || actor === "system") return { label: "Cadence", slug: null };
  if (actor === "human") return { label: "You", slug: null };
  return { label: agentDisplayName(actor, actor), slug: actor };
}

/** The one-line act: "moved {title} to {stage}" in plain words. */
function actLine(group: SwarmActivityGroup): string {
  const stage = (group.items[0]?.stage ?? "").replace(/_/g, " ");
  const title = stripAutoPrefix(group.title);
  if (group.key === "unassigned") {
    return `${group.count} ${group.count === 1 ? "move" : "moves"} across the workspace`;
  }
  const tail = group.count > 1 ? ` · ${group.count} moves` : "";
  return stage ? `moved ${title} to ${stage}${tail}` : `worked on ${title}${tail}`;
}

export function ReceiptsStrip({
  lane,
  onOpenMission,
  onOpenActivity,
}: {
  lane: TodayLane2;
  onOpenMission: (missionId: string) => void;
  onOpenActivity: () => void;
}) {
  const rows = lane.groups.slice(0, VISIBLE_ROWS);
  const shownActs = rows.reduce((s, g) => s + g.count, 0);
  const remaining = Math.max(0, lane.acts_total - shownActs);

  return (
    <section
      aria-label="While you slept"
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-subtle)",
            margin: 0,
          }}
        >
          While you slept
        </h2>
        {lane.total_cost_usd > 0 ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-faint)",
            }}
          >
            {fmtUsd(lane.total_cost_usd)} · 24h
          </span>
        ) : null}
        <div style={{ flex: 1, height: 1, background: "var(--hairline)", alignSelf: "center" }} />
      </div>

      {rows.length === 0 ? (
        <p
          style={{
            fontSize: 12.5,
            color: "var(--text-faint)",
            margin: "2px 0 0",
            fontStyle: "italic",
          }}
        >
          A quiet night. No agent moves in the last 24 hours.
        </p>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--top-light)",
          }}
        >
          {rows.map((g, i) => {
            const actor = actorOf(g);
            const clickable = g.key !== "unassigned";
            return (
              <div
                key={g.key}
                className="flex items-center"
                style={{
                  gap: 10,
                  padding: "9px 14px",
                  borderTop: i > 0 ? "1px solid var(--hairline)" : "none",
                  minWidth: 0,
                }}
              >
                {actor.slug ? (
                  <AgentMark slug={actor.slug} size={18} />
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 99,
                      background: "var(--text-faint)",
                      opacity: 0.6,
                      margin: "0 6.5px",
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 550,
                    color: "var(--text-body)",
                    flexShrink: 0,
                  }}
                >
                  {actor.label}
                </span>
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{ fontSize: 12.5, color: "var(--text-muted)" }}
                >
                  {actLine(g)}
                </span>
                {g.items[0]?.at ? (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      letterSpacing: "0.06em",
                      color: "var(--text-faint)",
                      flexShrink: 0,
                    }}
                  >
                    {relTimeCaps(g.items[0].at)}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={clickable ? () => onOpenMission(g.key) : onOpenActivity}
                  className="loom-press outline-none transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--link)",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    flexShrink: 0,
                    transitionDuration: "140ms",
                  }}
                >
                  Receipt
                </button>
              </div>
            );
          })}
        </div>
      )}

      {remaining > 0 ? (
        <button
          type="button"
          onClick={onOpenActivity}
          className="loom-press self-start outline-none transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--link)",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            transitionDuration: "140ms",
          }}
        >
          {remaining} more {remaining === 1 ? "move" : "moves"} → Activity
        </button>
      ) : null}
    </section>
  );
}
