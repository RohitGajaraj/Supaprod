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
// OBS-08: ported to Obsidian — the Obsidian VerdictChip carries the tone, and
// the "what it moved" line is the machine voice in glacier mono (README law:
// the moved-line states what changed, in the machine's own voice).
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getCompounding } from "@/lib/today.functions";
import { describeCompounding } from "@/lib/moat-vis";
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

export function CompoundingPanel() {
  const fetchCompounding = useServerFn(getCompounding);
  const q = useQuery({ queryKey: ["compounding"], queryFn: () => fetchCompounding() });

  const summary = q.data?.summary;
  const rescores = q.data?.rescores ?? [];
  const headline = summary ? describeCompounding(summary) : null;

  if (q.isLoading) {
    return (
      <Card>
        <MonoLabel>LOADING</MonoLabel>
      </Card>
    );
  }

  if (q.isError) {
    // A load failure must read as a failure, not as "the loop produced
    // nothing" (mirrors DecisionsPanel's error contract).
    return (
      <Card>
        <MonoLabel>Compounding · failed to load</MonoLabel>
        <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>
          {(q.error as Error)?.message ?? "Unknown error"}
        </p>
      </Card>
    );
  }

  if (!rescores.length) {
    return (
      <Card>
        <p style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.55, margin: 0 }}>
          No decision has been re-scored from a real outcome yet. When you record what a shipped bet
          actually did, memory moves its priority and the change shows up here.
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
      {summary && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-faint)",
            marginBottom: 14,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {summary.movedUp} moved up · {summary.movedDown} moved down · {summary.validatedCount}{" "}
          validated · {summary.missedCount} missed
        </p>
      )}

      <div className="flex flex-col">
        {rescores.map((r, i) => (
          <Link
            key={r.id}
            to="/knowledge"
            search={{ tab: "learnings", learning: r.id }}
            className="block outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
            style={{
              textDecoration: "none",
              color: "inherit",
              padding: "12px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
            }}
          >
            <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
              <VerdictChip tone={VERDICT_TONE[r.verdict]} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {r.opportunity_title ?? "a priority"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--glacier)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {r.opportunity_title ? "RE-RANKED " : ""}
                {r.delta >= 0 ? "+" : ""}
                {r.delta.toFixed(1)} ICE
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-faint)",
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {whenOf(r.created_at)}
              </span>
            </div>
            {r.summary && (
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
                {r.summary}
              </p>
            )}
          </Link>
        ))}
      </div>
    </Card>
  );
}
