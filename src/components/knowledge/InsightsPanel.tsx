// BRAIN-UX-V11 — human-lens Insights tab (floor) + AI analyst ceiling.
// Loom W2-BRAIN: queries carry the active workspace (stale cross-workspace
// numbers were audit row D-15), loading is a layout-matching skeleton, and
// the error state names the cause and offers a retry (DESIGN-LOOM section 9).
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MonoLabel } from "@/components/obsidian/primitives";
import { SpotlightCard } from "@/components/obsidian/spotlight";
import { SketchBarChart } from "@/components/cadence/Sketch";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getBrainInsights,
  getBrainAnalysis,
  type BrainInsight,
  type TimelineBucket,
  type BrainSignal,
} from "@/lib/brain-insights.functions";
import { LoopClosureBadge } from "@/components/knowledge/LoopClosureBadge";

// Tempo v5 glacier narrowing (2026-07-11): only action (positive) and risk
// (danger) are real status semantics; prediction/connection are categorical,
// not status, so they stay neutral gray rather than an ambient AI tint.
const SIGNAL_COLOR: Record<BrainSignal["kind"], string> = {
  prediction: "var(--text-subtle)",
  action: "var(--moss)",
  risk: "var(--madder)",
  connection: "var(--text-subtle)",
};

const TONE: Record<BrainInsight["tone"], { color: string }> = {
  positive: { color: "var(--moss)" },
  watch: { color: "var(--madder)" },
  neutral: { color: "var(--text-subtle)" },
};

const VERDICT_COLOR: Record<string, string> = {
  validated: "var(--moss-bright)",
  confirmed: "var(--moss-bright)",
  missed: "var(--madder-bright)",
  invalidated: "var(--madder-bright)",
  mixed: "var(--text-subtle)",
};

/** No icon set (the iconography law): a small role-colored dot marks tone. */
function ToneDot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        marginTop: 6,
      }}
    />
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        className="font-display tabular-nums"
        style={{ fontSize: 22, color: color ?? "var(--ink)", lineHeight: 1 }}
      >
        {value}
      </span>
      <span className="mono-label" style={{ fontSize: "var(--text-label-12)", color: "var(--ink-subtle)" }}>
        {label}
      </span>
    </div>
  );
}

function Timeline({ buckets }: { buckets: TimelineBucket[] }) {
  return (
    <SketchBarChart
      data={buckets.map((b) => ({ label: b.month.slice(2), value: b.decisions + b.learnings }))}
      color="var(--cornflower)"
      formatValue={(v) => String(Math.round(v))}
      ariaLabel="Decisions and outcomes logged per month"
      trackH={76}
    />
  );
}

export function InsightsPanel() {
  const { activeWorkspaceId } = useWorkspace();
  const fInsights = useServerFn(getBrainInsights);
  const fAnalysis = useServerFn(getBrainAnalysis);
  const q = useQuery({
    queryKey: ["brain-insights", activeWorkspaceId],
    queryFn: () => fInsights({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  // AI analyst loads lazily: staleTime 30 min so it fires at most once per session.
  const qa = useQuery({
    queryKey: ["brain-analysis", activeWorkspaceId],
    queryFn: () => fAnalysis(),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  if (q.isPending) {
    // Shimmer skeleton matching the loaded layout: badge line, insight rows,
    // then the two stat cards side by side.
    const bar = (h: number, w?: string) => (
      <div
        style={{
          width: w ?? "100%",
          height: h,
          borderRadius: "var(--radius-card)",
          background:
            "linear-gradient(90deg, var(--raised), var(--hover), var(--raised)) 0 0 / 280% 100%",
          animation: "cadShimmer 1.6s linear infinite",
        }}
      />
    );
    return (
      <div role="status">
        <span className="sr-only">Loading insights…</span>
        <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bar(22, "40%")}
          {bar(46)}
          {bar(46)}
          <div style={{ display: "flex", gap: 12 }}>
            {bar(110, "50%")}
            {bar(110, "50%")}
          </div>
        </div>
      </div>
    );
  }
  if (q.isError) {
    return (
      <div
        className="material-medium"
        style={{
          background: "var(--card)",
          padding: "16px 18px",
        }}
      >
        <MonoLabel style={{ marginBottom: 8, display: "block" }}>
          Insights · failed to load
        </MonoLabel>
        <p style={{ fontSize: "var(--text-label-13)", color: "var(--text-muted)", marginBottom: 12 }}>
          {(q.error as Error)?.message ?? "Unknown error"}
        </p>
        <button
          type="button"
          className="loom-press outline-none hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-subtle)",
            background: "transparent",
            border: "none",
            padding: 0,
          }}
          onClick={() => void q.refetch()}
        >
          Retry · reloads insights
        </button>
      </div>
    );
  }
  const d = q.data!;
  const totalDecisions = d.beliefs.standing + d.beliefs.superseded;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* LOOP-PROVE - is the decision/outcome/supersession loop closing on this workspace's data? */}
      <LoopClosureBadge />

      {/* The ONE spotlight: the analyst's current read, in a human voice, lifted
          and glow-lit so it reads as "notice this" — not a competing wall of
          insight blocks (Loom §0.1 prominence + rethink-don't-just-delete). */}
      {qa.data && !qa.data.sparse && qa.data.signals.length > 0 ? (
        <SpotlightCard kicker="What Cadence is seeing" tone="neutral">
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {qa.data.signals.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <ToneDot color={SIGNAL_COLOR[s.kind] ?? "var(--text-subtle)"} />
                <span style={{ fontSize: 14, color: "var(--text-body)", lineHeight: 1.55 }}>
                  {s.text}
                </span>
              </div>
            ))}
          </div>
        </SpotlightCard>
      ) : null}

      {/* Supporting observations — calm, secondary to the spotlight above.
          A quiet label makes the hierarchy explicit so the two do not read as
          duplicate "insights". Side-stripes removed (impeccable ban); the
          ToneDot carries the tone. */}
      {d.insights.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <MonoLabel tone="muted" style={{ marginBottom: 2 }}>
            What the record supports
          </MonoLabel>
          {d.insights.map((ins, i) => {
            const t = TONE[ins.tone];
            return (
              <div
                key={i}
                className="bento"
                style={{
                  padding: "12px 15px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <ToneDot color={t.color} />
                <span style={{ fontSize: "var(--text-label-14)", color: "var(--ink)", lineHeight: 1.5 }}>
                  {ins.text}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Beliefs + Learned at a glance. */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="bento" style={{ padding: 16 }}>
          <MonoLabel style={{ marginBottom: 12 }}>Beliefs</MonoLabel>
          <div style={{ display: "flex", gap: 24 }}>
            <Stat
              value={String(d.beliefs.standing)}
              label="decisions stand"
              color="var(--moss-bright)"
            />
            <Stat value={String(d.beliefs.superseded)} label="revised" />
          </div>
          <p style={{ fontSize: "var(--text-label-12)", color: "var(--ink-faint)", marginTop: 12, lineHeight: 1.5 }}>
            {totalDecisions === 0
              ? "No decisions recorded yet."
              : "Counts your recorded decisions only: the calls that still hold, and the ones a later call replaced. The loop trail above counts revision links across everything on the graph."}
          </p>
        </div>
        <div className="bento" style={{ padding: 16 }}>
          <MonoLabel style={{ marginBottom: 12 }}>What Cadence has learned</MonoLabel>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Stat
              value={d.learned.hitRate === null ? "-" : `${d.learned.hitRate}%`}
              label="hit rate"
            />
            <Stat
              value={String(d.learned.validated)}
              label="validated"
              color="var(--moss-bright)"
            />
            <Stat value={String(d.learned.missed)} label="missed" color="var(--madder-bright)" />
            <Stat value={String(d.learned.mixed)} label="mixed" color="var(--ink-subtle)" />
          </div>
          <p style={{ fontSize: "var(--text-label-12)", color: "var(--ink-faint)", marginTop: 12, lineHeight: 1.5 }}>
            {d.learned.total === 0
              ? "No outcomes recorded yet. The hit rate appears once results come back."
              : `Across ${d.learned.total} recorded outcome${d.learned.total === 1 ? "" : "s"}.`}
          </p>
        </div>
      </div>

      {/* Per-decision WHY — current beliefs in plain language: why decided, and (if revised) what changed it. */}
      {d.recentBeliefs.length > 0 ? (
        <div className="bento" style={{ padding: 16 }}>
          <MonoLabel style={{ marginBottom: 12 }}>Why we believe this</MonoLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {d.recentBeliefs.map((b, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="mono-label"
                    style={{
                      fontSize: "var(--text-label-12)",
                      color: b.superseded ? "var(--ink-subtle)" : "var(--moss-bright)",
                      flexShrink: 0,
                      textTransform: "uppercase",
                    }}
                  >
                    {b.superseded ? "revised" : "stands"}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--ink)",
                      lineHeight: 1.4,
                      textDecoration: b.superseded ? "line-through" : "none",
                      textDecorationColor: "var(--ink-faint)",
                    }}
                  >
                    {b.title}
                  </span>
                </div>
                {b.rationale ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ink-muted)",
                      lineHeight: 1.5,
                      paddingLeft: 2,
                    }}
                  >
                    {b.rationale}
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "var(--text-label-12)",
                      color: "var(--ink-faint)",
                      fontStyle: "italic",
                      paddingLeft: 2,
                    }}
                  >
                    No rationale was recorded for this decision.
                  </span>
                )}
                {b.superseded && b.revisedBy ? (
                  <span style={{ fontSize: "var(--text-label-12)", color: "var(--madder-bright)", paddingLeft: 2 }}>
                    now replaced by: {b.revisedBy}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* What's unresolved — the open questions: decisions in active conflict + unsettled outcomes. */}
      <div
        className="bento"
        style={{
          padding: 16,
          borderLeft: d.unresolved.count > 0 ? "2px solid var(--madder)" : undefined,
        }}
      >
        <MonoLabel style={{ marginBottom: 10 }}>What is unresolved</MonoLabel>
        {d.unresolved.count === 0 ? (
          <p style={{ fontSize: "var(--text-label-13)", color: "var(--ink-faint)", lineHeight: 1.5 }}>
            Nothing open right now: no recorded decisions are in active conflict, and no outcomes
            are sitting mixed.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {d.unresolved.contradictions.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <ToneDot color="var(--madder)" />
                <span style={{ fontSize: "var(--text-label-13)", color: "var(--ink)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--ink-muted)" }}>{c.title}</span> · {c.detail}
                </span>
              </div>
            ))}
            {d.unresolved.mixedOutcomes > 0 ? (
              <p
                style={{ fontSize: "var(--text-label-12)", color: "var(--ink-faint)", lineHeight: 1.5, marginTop: 2 }}
              >
                {d.unresolved.mixedOutcomes} outcome{d.unresolved.mixedOutcomes === 1 ? "" : "s"}{" "}
                came back mixed: partial signal, still waiting on a clean result.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Timeline. */}
      {d.timeline.length > 0 ? (
        <div className="bento" style={{ padding: 16 }}>
          <MonoLabel style={{ marginBottom: 10 }}>How it accrued</MonoLabel>
          <Timeline buckets={d.timeline} />
          <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 8 }}>
            Decisions and outcomes logged per month. Scrub or focus a bar to read its count.
          </p>
        </div>
      ) : null}

      {/* Recent learnings with their verdict + ICE shift. */}
      {d.recentLearnings.length > 0 ? (
        <div className="bento" style={{ padding: 16 }}>
          <MonoLabel style={{ marginBottom: 12 }}>Recent outcomes</MonoLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {d.recentLearnings.map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span
                  className="mono-label"
                  style={{
                    fontSize: "var(--text-label-12)",
                    color: VERDICT_COLOR[l.verdict?.toLowerCase()] ?? "var(--ink-subtle)",
                    flexShrink: 0,
                    minWidth: 60,
                    textTransform: "uppercase",
                  }}
                >
                  {l.verdict || "-"}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-label-13)",
                    color: "var(--ink-muted)",
                    lineHeight: 1.5,
                    flex: 1,
                  }}
                >
                  {l.summary || "(no summary)"}
                  {l.metricLabel && l.metricValue ? (
                    <span
                      className="mono-label"
                      style={{ fontSize: "var(--text-label-12)", color: "var(--ink-subtle)", marginLeft: 6 }}
                    >
                      {l.metricLabel}: {l.metricValue}
                    </span>
                  ) : null}
                  {l.iceShift !== null && l.iceShift !== 0 ? (
                    <span
                      className="mono-label tabular-nums"
                      style={{
                        fontSize: "var(--text-label-12)",
                        marginLeft: 6,
                        color: l.iceShift > 0 ? "var(--moss-bright)" : "var(--madder-bright)",
                      }}
                    >
                      ICE {l.iceShift > 0 ? "+" : ""}
                      {l.iceShift}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
