// PC-34 Judgment lens. The centerpiece: decisions to evidence to outcome to
// superseded-by, read as a narrative timeline ("how belief moved"), not a
// data table. The calibration line ("Cadence called N of the last M") sits
// once at the top, quiet and confident, when the server has one to show.
// Supersession renders as a plain sentence ("replaced by X"), never graph
// jargon (no "supersedes", "lineage", "edge"). This supersedes DecisionsPanel
// as the primary Judgment read, but DecisionsPanel itself stays reachable
// (nothing previously reachable is lost) so this file reuses, never edits,
// its status-chip convention (OBS_STATUS_TONE) and its click-to-open route.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PanelSkeleton } from "./PanelSkeleton";
import { MonoLabel, Button } from "@/components/obsidian/primitives";
import { VerdictChip } from "@/components/obsidian/verdict";
import { getJudgmentTimeline, type JudgmentEntry } from "@/lib/brain-front-door.functions";
import { OBS_STATUS_TONE } from "./DecisionsPanel";
import { ageOf, displayWho } from "./decisions-shared";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/cadence/AutoChip";
import { traceRef } from "@/components/discover/format";

// Anti-scroll (founder ruling 2026-07-06, PC-32): a narrative timeline still
// caps what renders at once and reveals the rest on demand, the same idiom
// as SignalFeed.tsx (a VISIBLE_* constant, showAll state, a "Show N more"
// button below the list). The server already caps at 30 (getJudgmentTimeline);
// this is the UI-side half of that cap.
const VISIBLE_ENTRIES = 12;

// Rail dot color per status: moss (approved, holds), madder (rejected), a
// faint neutral dot for pending (no verdict yet, nothing to color).
const DOT_COLOR: Record<JudgmentEntry["status"], string> = {
  approved: "var(--moss)",
  rejected: "var(--madder)",
  pending: "var(--text-faint)",
};

export function JudgmentTimeline() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const fJudgmentTimeline = useServerFn(getJudgmentTimeline);

  const q = useQuery({
    queryKey: ["judgment-timeline"],
    queryFn: () => fJudgmentTimeline(),
  });

  if (q.isPending) {
    return <PanelSkeleton />;
  }

  if (q.isError) {
    return (
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          padding: "16px 18px",
        }}
      >
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>
          Judgment · failed to load
        </MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
          {(q.error as Error)?.message ?? "Unknown error"}
        </p>
        <Button variant="secondary" onClick={() => void q.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { entries, calibrationLine } = q.data;
  const shown = showAll ? entries : entries.slice(0, VISIBLE_ENTRIES);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {calibrationLine ? (
        <p
          style={{
            fontSize: 14.5,
            fontWeight: 500,
            color: "var(--text-primary)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {calibrationLine}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            padding: "24px 22px",
          }}
        >
          <p style={{ fontSize: 12.5, color: "var(--text-subtle)", lineHeight: 1.6, margin: 0 }}>
            No decisions recorded yet.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          {shown.map((entry, i) => {
            const isLast = i === shown.length - 1;
            return (
              <div key={entry.id} style={{ display: "flex", gap: 14, padding: "0 18px" }}>
                {/* The narrative rail: a status-colored dot plus a connecting
                    line down to the next entry. Decorative only, aria-hidden;
                    the button beside it carries the click. */}
                <div
                  aria-hidden="true"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 10,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: DOT_COLOR[entry.status],
                      marginTop: 18,
                      flexShrink: 0,
                    }}
                  />
                  {!isLast ? (
                    <span
                      style={{ flex: 1, width: 1, background: "var(--hairline)", marginTop: 6 }}
                    />
                  ) : null}
                </div>

                {/* Loom law 17: every object opens on click. Same detail
                    route DecisionsPanel already uses, since a judgment entry
                    IS a decision, just told as a story instead of a row. */}
                <button
                  type="button"
                  onClick={() =>
                    navigate({ to: "/brain", search: { tab: "decisions", decision: entry.id } })
                  }
                  className="flex-1 min-w-0 text-left outline-none hover:[background-color:#141416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                  style={{
                    padding: "14px 0 18px",
                    borderBottom: isLast ? "none" : "1px solid var(--hairline)",
                    background: "transparent",
                    border: "none",
                  }}
                >
                  <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
                    <VerdictChip tone={OBS_STATUS_TONE[entry.status]} />
                    <span style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>
                      {stripAutoPrefix(entry.title)}
                    </span>
                    {isAutoTitle(entry.title) ? <AutoChip /> : null}
                  </div>

                  {entry.rationale ? (
                    <p
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-subtle)",
                        margin: "5px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {entry.rationale}
                    </p>
                  ) : null}

                  <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 6 }}>
                    {entry.decidedBy ? (
                      <>
                        <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>
                          decided by {displayWho(entry.decidedBy)}
                        </span>
                        <span style={{ color: "var(--text-faint)" }}>·</span>
                      </>
                    ) : null}
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-mono-floor)",
                        color: "var(--text-subtle)",
                      }}
                    >
                      {ageOf(entry.createdAt)}
                    </span>
                  </div>

                  {/* The key differentiator: supersession and contradiction as
                      plain narrative sentences, never graph/node/edge words.
                      Reuses the madder-bright tint InsightsPanel already uses
                      for "now replaced by" (its closest existing precedent),
                      a quiet marker, not an alarm. */}
                  {entry.supersededByTitle ? (
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "var(--madder-bright)",
                        margin: "6px 0 0",
                        lineHeight: 1.5,
                      }}
                    >
                      Replaced by '{entry.supersededByTitle}'
                    </p>
                  ) : entry.contradicted ? (
                    <p
                      style={{
                        fontSize: 11.5,
                        color: "var(--madder-bright)",
                        margin: "6px 0 0",
                        lineHeight: 1.5,
                      }}
                    >
                      A later outcome contradicted this, no replacement decided yet
                    </p>
                  ) : null}

                  <span
                    style={{
                      display: "block",
                      marginTop: 6,
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-mono-floor)",
                      letterSpacing: "0.06em",
                      color: "var(--text-faint)",
                    }}
                  >
                    DEC·{traceRef(entry.id)}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {entries.length > VISIBLE_ENTRIES ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="loom-press w-full outline-none transition-colors hover:[color:var(--text-body)] hover:[border-color:var(--text-faint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "transparent",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "8px 14px",
          }}
        >
          {showAll ? "Show fewer" : `Show ${entries.length - VISIBLE_ENTRIES} more`}
        </button>
      ) : null}
    </div>
  );
}
