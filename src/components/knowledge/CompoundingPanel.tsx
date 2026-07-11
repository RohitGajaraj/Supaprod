// CompoundingPanel — Brain -> Learnings tab landing (MOAT-VIS).
//
// "Make the compounding visible": the outcome loop (recordOutcome) re-scores an
// opportunity's ICE from a real-world verdict and records WHY in a `learnings`
// row. This panel surfaces that as the felt moat artifact: a one-line summary of
// how many decisions memory has re-scored from real outcomes (net ICE movement),
// then the cause-carrying feed (verdict + opportunity + ICE delta + what
// happened), each row drilling to ?learning= for the full detail.
//
// Reads getCompounding (today.functions.ts) which shares the pure summarizer in
// moat-vis.ts, so this feed and Today's "what changed" line never drift.
//
// QA round 2 (count-vs-list): the Brain strip counts EVERY recorded outcome,
// but this panel used to render only the re-scores - "bar says 17, panel
// shows 2". It now lists the full outcome feed (listLearnings, the same read
// LearningDetail drills into), marking the rows where memory re-ranked a
// priority, and labels both numbers so each means one thing.
//
// OBS-08: ported to Obsidian — the Obsidian VerdictChip carries the tone, and
// the "what it moved" line is the machine voice in glacier mono (README law:
// the moved-line states what changed, in the machine's own voice).
import { useServerFn } from "@tanstack/react-start";
import { PanelSkeleton } from "./PanelSkeleton";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getCompounding } from "@/lib/today.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { describeCompounding } from "@/lib/moat-vis";
import { traceRef } from "@/components/discover/format";
import { MonoLabel } from "@/components/obsidian/primitives";
import { VerdictChip, type VerdictTone } from "@/components/obsidian/verdict";

export const VERDICT_TONE: Record<"validated" | "missed" | "mixed", VerdictTone> = {
  validated: "VALIDATED",
  missed: "MISSED",
  mixed: "REVISE",
};

/** Same "when" rhythm as LearningDetail: time today, "Yesterday", else "Jun 9". */
function whenOf(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

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

/** ICE delta of one learning, or null when it did not move a ranking.
 * Mirrors moat-vis rescoresOf (round to 0.1, jitter is not a move). */
function deltaOf(l: {
  prior_ice: number | string | null;
  new_ice: number | string | null;
}): number | null {
  const p = l.prior_ice == null ? null : Number(l.prior_ice);
  const n = l.new_ice == null ? null : Number(l.new_ice);
  if (p == null || n == null || !Number.isFinite(p) || !Number.isFinite(n)) return null;
  const d = Math.round((n - p) * 10) / 10;
  return d === 0 ? null : d;
}

export function CompoundingPanel() {
  const fetchCompounding = useServerFn(getCompounding);
  const fetchLearnings = useServerFn(listLearnings);
  const q = useQuery({ queryKey: ["compounding"], queryFn: () => fetchCompounding() });
  const lq = useQuery({ queryKey: ["learnings"], queryFn: () => fetchLearnings() });

  const summary = q.data?.summary;
  const headline = summary ? describeCompounding(summary) : null;
  const learnings = lq.data?.learnings ?? [];
  const rescoreCount = learnings.filter((l) => deltaOf(l) != null).length;

  if (q.isLoading || lq.isLoading) {
    return <PanelSkeleton />;
  }

  if (q.isError || lq.isError) {
    // A load failure must read as a failure, not as "the loop produced
    // nothing" (mirrors DecisionsPanel's error contract).
    return (
      <Card>
        <MonoLabel>Learnings · failed to load</MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>
          {((q.error ?? lq.error) as Error)?.message ?? "Unknown error"}
        </p>
      </Card>
    );
  }

  if (!learnings.length) {
    return (
      <Card>
        <p style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.55, margin: 0 }}>
          No outcomes recorded yet. When you record what a shipped bet actually did, the memo lands
          here and memory re-ranks the priority it touched.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {headline && (
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 15,
            fontWeight: 450,
            color: "var(--text-primary)",
            margin: "0 0 4px",
            lineHeight: 1.4,
          }}
        >
          {headline}
        </p>
      )}
      {/* One number per meaning: the strip above counts every recorded
          outcome; this line says how many of the listed ones moved a
          ranking, so the two can never read as a contradiction. */}
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-floor)",
          color: "var(--text-subtle)",
          marginBottom: 14,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {learnings.length === 50
          ? "latest 50 outcomes"
          : `${learnings.length} recorded outcome${learnings.length === 1 ? "" : "s"}`}{" "}
        · {rescoreCount} re-ranked a priority
      </p>

      <div className="flex flex-col">
        {learnings.map((l, i) => {
          const delta = deltaOf(l);
          return (
            <Link
              key={l.id}
              to="/brain"
              search={{ tab: "learnings", learning: l.id }}
              className="block outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                textDecoration: "none",
                color: "inherit",
                padding: "12px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
              }}
            >
              <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
                <VerdictChip tone={VERDICT_TONE[l.verdict]} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {l.opportunity_title ?? "an outcome memo"}
                </span>
                {delta != null && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-mono-floor)",
                      color: "var(--glacier)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {l.opportunity_title ? "RE-RANKED " : ""}
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(1)} ICE
                  </span>
                )}
                <span className="flex items-center" style={{ marginLeft: "auto", gap: 8 }}>
                  {/* dim 17: the quiet trace ref, then the time a touch more present. */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-mono-floor)",
                      letterSpacing: "0.06em",
                      color: "var(--text-faint)",
                    }}
                  >
                    LRN·{traceRef(l.id)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-subtle)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {whenOf(l.created_at)}
                  </span>
                </span>
              </div>
              {l.summary && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-subtle)",
                    marginTop: 6,
                    lineHeight: 1.45,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {l.summary}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
