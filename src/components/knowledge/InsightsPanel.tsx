/**
 * What the record has worked out, and what it still cannot settle.
 *
 * Ported to the shell primitives, 2026-07-29. What went, and why:
 *   KILLED `borderLeft: "2px solid var(--madder)"` on the unresolved card.
 *     A thick coloured border on one side of a rounded card is anti-slop ban 4,
 *     named there as "the single most recognisable tell of AI-generated UI".
 *     The standard's own fix is a background tint, a leading mark, a full
 *     border, or nothing; the count moved into the heading, which is nothing
 *     plus a fact.
 *   KILLED the `bento` card on EVERY region: eight of them, several nested.
 *     Cards inside cards is ban 5, and one bordered container per region is the
 *     cap. Block draws a rule where the register changes, which is enough.
 *   KILLED the SpotlightCard. A lifted, glow-lit card is the retired system's
 *     "notice this", and this system already has exactly one lit surface: the
 *     Record recess, which is what the analyst's read actually is.
 *   KILLED the ToneDot, in all five places. A coloured dot beside a sentence
 *     that already carries its tone in words is state as a hue, and a column of
 *     them is a colour wheel down the left edge of the page.
 *   KILLED every MonoLabel and `mono-label` region heading, and the uppercase
 *     "STANDS" / "REVISED" / verdict columns. Mono is for data, never a label.
 *   KILLED the two-column stat grid and its `font-display` numerals. Four
 *     numbers side by side under mono captions is a dashboard; each is a Line
 *     with the different fact beside it.
 *   KILLED the shimmer skeleton and the hand-built "failed to load" card.
 *     Loading and Failed are primitives and they say different things.
 *   KILLED the strikethrough on a revised belief. Struck-through body text
 *     fails the contrast floor (ban 9), and the word beside it already says it.
 *
 * A REAL DEFECT, fixed rather than re-skinned: the analyst query
 * (getBrainAnalysis) had `retry: false` and its error was never read, so an
 * analyst that FAILED rendered identically to an analyst with nothing to say.
 * Those are different facts and a user acts differently on each. It reports the
 * failure now, in one line, without taking the surface away from everything
 * that did load.
 *
 * UNCHANGED: getBrainInsights / getBrainAnalysis, both query keys and their
 * activeWorkspaceId scoping (stale cross-workspace numbers were audit row
 * D-15), the 30 minute staleTime and no-retry on the analyst, the
 * LoopClosureBadge mount, and the deliberate distinction between decisions
 * revised (this panel) and revision links across the graph (the loop trail).
 *
 * STILL LEGACY, and named rather than hidden: SketchBarChart lives in
 * components/supaprod, which this lane does not own.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SketchBarChart } from "@/components/supaprod/Sketch";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getBrainInsights,
  getBrainAnalysis,
  type BrainInsight,
  type TimelineBucket,
} from "@/lib/brain-insights.functions";
import { LoopClosureBadge } from "@/components/knowledge/LoopClosureBadge";
import {
  Block,
  Empty,
  Failed,
  Line,
  Loading,
  Num,
  Record as RecordRecess,
  Row,
  Value,
} from "@/components/shell/primitives";

/** The one class that carries an observation's tone. Only a genuine outcome
 *  wears a colour; an observation that is neither good nor bad stays
 *  monochrome, which is most of them. */
const TONE: Record<BrainInsight["tone"], string> = {
  positive: "sp-pass",
  watch: "sp-warn",
  neutral: "",
};

const VERDICT_TONE: Record<string, "pass" | "fail" | "quiet"> = {
  validated: "pass",
  confirmed: "pass",
  missed: "fail",
  invalidated: "fail",
  mixed: "quiet",
};

function verdictClass(verdict: string): string | undefined {
  const t = VERDICT_TONE[verdict.toLowerCase()];
  if (t === "pass") return "sp-pass";
  if (t === "fail") return "sp-fail";
  return undefined;
}

function Timeline({ buckets }: { buckets: TimelineBucket[] }) {
  return (
    <SketchBarChart
      data={buckets.map((b) => ({ label: b.month.slice(2), value: b.decisions + b.learnings }))}
      color="var(--sp-stage-learn)"
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
  // The analyst loads lazily: staleTime 30 min so it fires at most once per
  // session, and it does not retry, because a second model call after a failed
  // read spends real money for the same answer.
  const qa = useQuery({
    queryKey: ["brain-analysis", activeWorkspaceId],
    queryFn: () => fAnalysis(),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  if (q.isPending) return <Loading>Reading what the record has worked out.</Loading>;

  if (q.isError) {
    return (
      <Failed onRetry={() => void q.refetch()}>
        This did not load, so nothing here is a claim about what the record knows.{" "}
        {(q.error as Error)?.message ?? ""}
      </Failed>
    );
  }

  const d = q.data!;
  const totalDecisions = d.beliefs.standing + d.beliefs.superseded;

  return (
    <div>
      {/* LOOP-PROVE: is the decision loop closing on this workspace's data. */}
      <LoopClosureBadge />

      {/* The analyst's current read, in the record's own voice. The one lit
          surface in the product, and this is what it exists for. */}
      {qa.isError ? (
        <Failed onRetry={() => void qa.refetch()}>
          The analyst did not answer, so it has not told you there is nothing to see. Everything
          below is the raw record and it loaded fine.
        </Failed>
      ) : qa.data && !qa.data.sparse && qa.data.signals.length > 0 ? (
        <RecordRecess>
          {qa.data.signals.map((s, i) => (
            <span key={i} style={{ display: "block" }}>
              {s.text}
            </span>
          ))}
        </RecordRecess>
      ) : null}

      {/* Supporting observations, calm and secondary to the read above. */}
      {d.insights.length > 0 ? (
        <Block
          title="What the record supports"
          // Different information from the title, not a restatement.
          sub="Derived from the rows themselves, with no model involved."
        >
          {d.insights.map((ins, i) => (
            <p key={i} className="sp-loading">
              <span className={TONE[ins.tone] || undefined}>{ins.text}</span>
            </p>
          ))}
        </Block>
      ) : null}

      <Block
        title="What still stands"
        sub={
          totalDecisions === 0
            ? "Nothing is on the record yet."
            : "Your recorded decisions only. The loop trail above counts revision links across the whole graph, which is a different number on purpose."
        }
      >
        <Line label="Calls that still hold" sub="Agents read these before they act">
          <Value tone={d.beliefs.standing > 0 ? "pass" : "quiet"}>
            <Num>{d.beliefs.standing}</Num>
          </Value>
        </Line>
        <Line label="Calls a later call replaced" sub="Kept on the record, never deleted">
          <Value>
            <Num>{d.beliefs.superseded}</Num>
          </Value>
        </Line>
      </Block>

      <Block
        title="What it got right"
        sub={
          d.learned.total === 0
            ? "No outcomes recorded yet. The hit rate appears once results come back."
            : `Across ${d.learned.total} recorded outcome${d.learned.total === 1 ? "" : "s"}.`
        }
      >
        <Line label="Hit rate" sub="Bets that landed the way the record expected">
          {d.learned.hitRate === null ? (
            <Value>Not enough settled outcomes yet</Value>
          ) : (
            <Value>
              <Num>{d.learned.hitRate}%</Num>
            </Value>
          )}
        </Line>
        <Line label="It worked">
          <Value tone={d.learned.validated > 0 ? "pass" : "quiet"}>
            <Num>{d.learned.validated}</Num>
          </Value>
        </Line>
        <Line label="It missed">
          <Value tone={d.learned.missed > 0 ? "fail" : "quiet"}>
            <Num>{d.learned.missed}</Num>
          </Value>
        </Line>
        <Line label="Mixed" sub="Partial signal, and not an outcome yet">
          <Value>
            <Num>{d.learned.mixed}</Num>
          </Value>
        </Line>
      </Block>

      {/* Current beliefs in plain language: why decided, and what changed it. */}
      {d.recentBeliefs.length > 0 ? (
        <Block title="Why it believes this">
          {d.recentBeliefs.map((b, i) => (
            <Row
              key={i}
              lead={b.title}
              // The different fact, never more of the title: where the call
              // stands, why, and what replaced it if anything did.
              sub={
                <>
                  <span className={b.superseded ? "sp-fail" : "sp-pass"}>
                    {b.superseded ? "Replaced" : "Still stands"}
                  </span>
                  {" · "}
                  {b.rationale || "nobody wrote down why"}
                  {b.superseded && b.revisedBy ? ` · now: ${b.revisedBy}` : ""}
                </>
              }
            />
          ))}
        </Block>
      ) : null}

      {/* The open questions: decisions in active conflict, plus unsettled
          outcomes. The count goes in the heading, never a stripe down a side. */}
      <Block
        title="What is unresolved"
        sub={
          d.unresolved.count > 0 ? (
            <span className="sp-warn">
              <Num>{d.unresolved.count}</Num> open right now
            </span>
          ) : undefined
        }
      >
        {d.unresolved.count === 0 ? (
          <Empty>
            Nothing is open. No recorded decision is in active conflict, and no outcome is sitting
            mixed.
          </Empty>
        ) : (
          <>
            {d.unresolved.contradictions.map((c, i) => (
              <Row key={i} lead={c.title} sub={c.detail} />
            ))}
            {d.unresolved.mixedOutcomes > 0 ? (
              <p className="sp-loading">
                <Num>{d.unresolved.mixedOutcomes}</Num> outcome
                {d.unresolved.mixedOutcomes === 1 ? "" : "s"} came back mixed: partial signal, still
                waiting on a clean result.
              </p>
            ) : null}
          </>
        )}
      </Block>

      {d.timeline.length > 0 ? (
        <Block
          title="How it accrued"
          sub="Decisions and outcomes logged per month. Focus a bar to read its count."
        >
          <Timeline buckets={d.timeline} />
        </Block>
      ) : null}

      {d.recentLearnings.length > 0 ? (
        <Block title="Recent outcomes">
          {d.recentLearnings.map((l, i) => (
            <Row
              key={i}
              lead={l.summary || "An outcome with no memo"}
              // The different fact: how it landed, what it measured, and
              // whether it moved a ranking.
              sub={
                <>
                  {l.verdict ? (
                    <span className={verdictClass(l.verdict)}>{l.verdict}</span>
                  ) : (
                    "no verdict recorded"
                  )}
                  {l.metricLabel && l.metricValue ? ` · ${l.metricLabel}: ${l.metricValue}` : ""}
                  {l.iceShift !== null && l.iceShift !== 0 ? (
                    <>
                      {" · re-ranked "}
                      <Num>
                        {l.iceShift > 0 ? "+" : ""}
                        {l.iceShift}
                      </Num>{" "}
                      ICE
                    </>
                  ) : null}
                </>
              }
            />
          ))}
        </Block>
      ) : null}
    </div>
  );
}
