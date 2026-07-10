// LearningDetail - Brain -> Learnings drill-down, rebuilt on the shared
// DetailKit anatomy (DESIGN-LOOM dim 17 / design-anatomy §3) so a learning
// reads identically to a Discover signal, a Decide opportunity, and a Today
// call: DetailHeader -> a glacier summary band (the compounding value first)
// -> a compact StatStrip -> consistent DetailSections -> an actions footer.
// Drill state rides ?learning= on /brain; the detail replaces only the tab
// body. Reads listLearnings (the same ["learnings"] cache CompoundingPanel
// fills, so the feed and this detail never drift) - which already carries the
// re-scored opportunity's title, so no second query is needed.
//
// Trace ref: LRN (dim 17 registry). Timestamps via relTimeCaps (present tone),
// the full id copyable. Provenance links back up the loop: the spec it graded
// and the priority it re-ranked (the latter recentres the knowledge graph, so
// the learning is never orphaned from its source). Real columns only: an
// absent metric or ICE pair renders nothing, never a fabricated field.
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { listLearnings } from "@/lib/outcome.functions";
import { Button, MonoLabel, VerdictChip, type VerdictTone } from "@/components/obsidian";
import {
  DetailHeader,
  DetailSection,
  StatCell,
  StatStrip,
  toneForScore,
  type StatTone,
} from "@/components/discover/DetailKit";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { toast } from "@/lib/notify";
import { PanelSkeleton } from "./PanelSkeleton";

type LearningRow = {
  id: string;
  prd_id: string | null;
  opportunity_id: string | null;
  verdict: "validated" | "missed" | "mixed";
  summary: string;
  metric_label: string | null;
  metric_value: string | null;
  prior_ice: number | string | null;
  new_ice: number | string | null;
  created_at: string;
  opportunity_title: string | null;
};

const VERDICT_TONE: Record<LearningRow["verdict"], VerdictTone> = {
  validated: "VALIDATED",
  missed: "MISSED",
  mixed: "REVISE",
};

/** Coerce a PostgREST numeric (which arrives as a string) to a finite number,
 * or null. Mirrors CompoundingPanel/moat-vis so the ICE read never differs. */
function iceNum(v: number | string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** An absolute timestamp plus a quiet relative caption (the exemplar TimeLine,
 * matching OpportunityDetailSheet / CallDetailSheet). */
function TimeLine({ iso }: { iso: string }) {
  return (
    <span
      className="flex items-baseline"
      style={{ gap: "8px", fontSize: "12.5px", color: "var(--text-body)" }}
    >
      <span>{new Date(iso).toLocaleString()}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9.5px",
          letterSpacing: "0.06em",
          color: "var(--text-faint)",
        }}
      >
        {relTimeCaps(iso)}
      </span>
    </span>
  );
}

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--top-light)",
        padding: "16px 18px",
      }}
    >
      {children}
    </div>
  );
}

export function LearningDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const fLearnings = useServerFn(listLearnings);
  const learnings = useQuery({ queryKey: ["learnings"], queryFn: () => fLearnings() });

  const onBack = () => navigate({ to: "/brain", search: { tab: "learnings" } });

  if (learnings.isLoading) return <PanelSkeleton />;

  if (learnings.isError) {
    return (
      <StateCard>
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>
          Learning · failed to load
        </MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
          {(learnings.error as Error)?.message ?? "Unknown error"}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void learnings.refetch()}>
          Retry
        </Button>
      </StateCard>
    );
  }

  const l = ((learnings.data?.learnings ?? []) as LearningRow[]).find((x) => x.id === id);
  if (!l) {
    return (
      <StateCard>
        <MonoLabel style={{ marginBottom: 10, display: "block" }}>
          Learning not found · it may have been removed
        </MonoLabel>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back · all learnings
        </Button>
      </StateCard>
    );
  }

  const priorIce = iceNum(l.prior_ice);
  const newIce = iceNum(l.new_ice);
  const delta =
    priorIce != null && newIce != null ? Math.round((newIce - priorIce) * 10) / 10 : null;
  const moved = delta != null && delta !== 0;

  const deltaTone: StatTone =
    delta == null || delta === 0 ? "muted" : delta > 0 ? "moss" : "madder";

  const copyId = () => {
    void navigator.clipboard?.writeText(l.id);
    toast("Trace id copied");
  };

  // The compounding value, led first (the moat made visible): what the outcome
  // moved, honestly stated. No movement reads as recorded-but-neutral.
  const headline = moved
    ? `Memory re-ranked ${l.opportunity_title ? `"${l.opportunity_title}"` : "a priority"} by ${
        delta! > 0 ? "+" : ""
      }${delta!.toFixed(1)} ICE from the real outcome.`
    : "Recorded from the real outcome. It did not move a ranking.";

  return (
    <div className="fade-up" style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={onBack}
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-subtle)",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
        >
          {"<-"} All learnings
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: "16px",
          background: "var(--card)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--top-light)",
          padding: "18px 20px",
        }}
      >
        <DetailHeader
          title={l.opportunity_title ?? "Recorded outcome"}
          chips={<VerdictChip tone={VERDICT_TONE[l.verdict]} />}
          time={
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9.5px",
                letterSpacing: "0.06em",
                color: "var(--text-subtle)",
              }}
            >
              RECORDED {relTimeCaps(l.created_at)}
            </span>
          }
          traceRef={
            <button
              type="button"
              onClick={copyId}
              aria-label="Copy trace id"
              title="Copy the full trace id"
              className="loom-press flex items-center hover:[color:var(--text-subtle)]"
              style={{
                gap: "6px",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.06em",
                color: "var(--text-faint)",
                background: "transparent",
                border: "none",
                padding: "3px 2px",
                cursor: "pointer",
              }}
            >
              LRN·{traceRef(l.id)}
              <Copy className="h-3 w-3" />
            </button>
          }
        />

        {/* Summary band: the compounding value first (calm glacier tint). */}
        <div
          style={{
            display: "grid",
            gap: "8px",
            background: "color-mix(in srgb, var(--glacier) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--glacier) 22%, transparent)",
            borderRadius: "var(--radius-card)",
            padding: "13px 15px",
          }}
        >
          <MonoLabel
            style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
          >
            What memory learned
          </MonoLabel>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "13px",
              fontWeight: 550,
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}
          >
            {headline}
          </span>
        </div>

        {/* The ICE movement, glanceable. Rendered only when the outcome carried
            a scored before/after pair (no fabricated numbers). */}
        {priorIce != null && newIce != null ? (
          <StatStrip columns={3}>
            <StatCell label="Prior ICE" value={priorIce.toFixed(1)} tone={toneForScore(priorIce)} />
            <StatCell label="New ICE" value={newIce.toFixed(1)} tone={toneForScore(newIce)} />
            <StatCell
              label="Change"
              value={delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}` : "0.0"}
              tone={deltaTone}
            />
          </StatStrip>
        ) : null}

        {/* What happened: the outcome memo. */}
        <DetailSection heading="What happened">
          {l.summary ? (
            <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--text-body)", margin: 0 }}>
              {l.summary}
            </p>
          ) : (
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-subtle)",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              No memo was recorded for this outcome.
            </p>
          )}
        </DetailSection>

        {/* The metric, if one was captured. */}
        {l.metric_label && l.metric_value ? (
          <DetailSection heading="Measured result">
            <div className="flex items-baseline" style={{ gap: "10px" }}>
              <MonoLabel
                style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text-subtle)" }}
              >
                {l.metric_label}
              </MonoLabel>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "16px",
                  color: "var(--text-primary)",
                }}
              >
                {l.metric_value}
              </span>
            </div>
          </DetailSection>
        ) : null}

        {/* Provenance: link back up the loop. The priority recentres the graph
            (reuse the lineage view, never orphan); the spec opens in Plan. */}
        {l.opportunity_id || l.prd_id ? (
          <DetailSection heading="Where it points">
            <div style={{ display: "grid", gap: "10px" }}>
              {l.opportunity_id ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/brain",
                      search: {
                        tab: "graph",
                        focusKind: "opportunity",
                        focusId: l.opportunity_id!,
                      },
                    })
                  }
                  className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                  style={{
                    fontSize: "12.5px",
                    color: "var(--glacier)",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Trace {l.opportunity_title ? `"${l.opportunity_title}"` : "the priority"} in the
                  graph {"->"}
                </button>
              ) : null}
              {l.prd_id ? (
                <button
                  type="button"
                  onClick={() => navigate({ to: "/plan/spec/$id", params: { id: l.prd_id! } })}
                  className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
                  style={{
                    fontSize: "12.5px",
                    color: "var(--glacier)",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Open the spec it graded {"->"}
                </button>
              ) : null}
            </div>
          </DetailSection>
        ) : null}

        {/* Activity. */}
        <DetailSection heading="Activity">
          <div style={{ display: "grid", gap: "3px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)" }}>Recorded</span>
            <TimeLine iso={l.created_at} />
          </div>
        </DetailSection>

        {/* Actions. */}
        {l.prd_id ? (
          <div
            className="flex flex-wrap items-center"
            style={{ gap: "10px", paddingTop: "15px", borderTop: "1px solid var(--hairline)" }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate({ to: "/plan/spec/$id", params: { id: l.prd_id! } })}
            >
              Open the spec
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
