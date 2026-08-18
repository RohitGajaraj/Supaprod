/**
 * THE GAUNTLET. The proof metrics, on a real surface, read from real tables.
 *
 * Ported off the retired Ember Editorial system (2026-07-29). MonoLabel, the
 * cards, the trend chips and every legacy token are gone. What changed,
 * and why:
 *
 * KEEP, and keep exactly, the honesty rule this panel was written around: when
 *      the data is sparse a card says "not enough data yet" rather than
 *      inventing a figure, and it says what would unlock it. The claim never
 *      outruns the wiring. What changed is only how that fact is DRAWN: a
 *      sparse metric is an Empty, which names who acts next, and a metric whose
 *      READ FAILED is a Failed with a retry. Those are different facts and the
 *      old panel rendered both as the same grey line.
 * KEEP every server function, every query key and the one exported symbol.
 *
 * KILL the six cards. Six bordered boxes in a region that is already one
 *      bordered container is anti-slop ban 5, and the same
 *      label-number-sentence-substat template repeated six times is ban 6. Each
 *      metric reads label left, fact right, so each is a Line with a Value.
 *      That also rules out a Grid of Cells: a Grid is for a catalog scanned
 *      ACROSS, and these are measurements of one loop, read down.
 * KILL all nine lucide icons. CheckCircle2, Gauge, Flame, Sparkles, Target and
 *      Layers each sat beside a heading that already said what they said, which
 *      is decoration at the size of a label (ban 8). ArrowUpRight,
 *      ArrowDownRight and Minus went with the trend chip: a trend is a WORD,
 *      and "rising" says more than an arrow and survives greyscale.
 * KILL the TrendChip's colour. Green for up and red for down asserted that a
 *      direction is an outcome. The product defines no such threshold for
 *      acceptance or for ritual days, so a colour there was a judgment nothing
 *      backs. The direction is a plain word inside the evidence line now.
 * KILL the "-" value. A dash reads as zero at a glance, and zero is a claim
 *      about what happened. A metric with nothing behind it has no figure at
 *      all and says so in words.
 * KILL the Geist Pixel headline on the moat metric, the serif display faces and
 *      the mono uppercase labels. Mono is for data only, and it reaches the
 *      screen through Num.
 * KILL the single combined error card at the foot. Six independent reads
 *      collapsed into one message, so a working metric was hidden behind a
 *      neighbour's failure and one retry refetched all six. Each read now fails
 *      in its own place and retries only itself.
 *
 * THE ONE LIT SURFACE. Outcome accuracy gets the Record, and it is the only
 * Record here. Record is a claim that confirms or contradicts YOU, and outcome
 * accuracy is the one measure on this panel that does: it is the record telling
 * you how often the bets you shipped actually validated. Memory compounding and
 * the depth split are statistics about the store, so they stay Lines.
 *
 * NO WRITE happens here. Every control is a retry on a read, so there is no
 * consequence to leave a receipt for.
 */
import * as React from "react";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  getAcceptanceRate,
  getAutonomyRatio,
  getRitualRetention,
  getMemoryCompounding,
  getOutcomeAccuracy,
  getMemoryLift,
  type Trend,
} from "@/lib/gauntlet.functions";
import { Block, Empty, Failed, Line, Loading, Record as RecordRecess, Value } from "@/components/shell/primitives";

function pct(n: number | null): string | null {
  if (n == null) return null;
  return `${Math.round(n * 100)}%`;
}

/** A direction, as a word. No colour: the product defines no threshold that
 *  makes a rising acceptance rate good or a falling one bad, so a hue here
 *  would assert a judgment nothing backs. */
const TREND_WORD: Record<Trend, string> = {
  up: "rising",
  down: "falling",
  flat: "holding steady",
};

/** A read that threw. Kept separate from "nothing here yet", because the two
 *  are different facts and a person acts differently on each. */
function readError(isError: boolean, error: unknown): string | null {
  if (!isError) return null;
  return error instanceof Error ? error.message : "The read failed.";
}

/**
 * One metric. Three states, always: a read in flight, a read that failed, and
 * an answer. An answer with nothing behind it carries no figure rather than a
 * dash, and its evidence line says what would unlock it.
 */
function Measure({
  label,
  evidence,
  figure,
  loading,
  error,
  onRetry,
}: {
  label: string;
  /** What backs the figure, or what would unlock it. Never a restatement. */
  evidence: React.ReactNode;
  /** Absent when there is nothing defensible to show. */
  figure: React.ReactNode | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) return <Loading>Reading {label.toLowerCase()}.</Loading>;
  if (error) {
    return (
      <Failed onRetry={onRetry}>
        {label} did not load, so nothing here is a claim about it. {error}
      </Failed>
    );
  }
  if (figure == null) return <Line label={label} sub={evidence} />;
  return (
    <Line label={label} sub={evidence}>
      <Value>{figure}</Value>
    </Line>
  );
}

export function GauntletMetricsPanel() {
  const fAccept = useServerFn(getAcceptanceRate);
  const fAutonomy = useServerFn(getAutonomyRatio);
  const fRitual = useServerFn(getRitualRetention);
  const fMem = useServerFn(getMemoryCompounding);
  const fAccuracy = useServerFn(getOutcomeAccuracy);
  const fLift = useServerFn(getMemoryLift);

  const acceptQ = useQuery({
    queryKey: ["gauntlet-acceptance"],
    queryFn: () => fAccept({ data: { days: 14 } }),
  });
  const autonomyQ = useQuery({
    queryKey: ["gauntlet-autonomy"],
    queryFn: () => fAutonomy({ data: { days: 14 } }),
  });
  const ritualQ = useQuery({
    queryKey: ["gauntlet-ritual"],
    queryFn: () => fRitual(),
  });
  const memQ = useQuery({
    queryKey: ["gauntlet-memory"],
    queryFn: () => fMem(),
  });
  const accuracyQ = useQuery({
    queryKey: ["gauntlet-accuracy"],
    queryFn: () => fAccuracy({ data: { days: 90 } }),
  });
  const liftQ = useQuery({
    queryKey: ["gauntlet-memory-lift"],
    queryFn: () => fLift({ data: { days: 90 } }),
  });

  const a = acceptQ.data;
  const c = autonomyQ.data;
  const b = ritualQ.data;
  const accuracy = accuracyQ.data;
  const lift = liftQ.data;
  const mem = memQ.data;

  /* ---- Metric A: acceptance ---- */
  const acceptEvidence: React.ReactNode =
    a == null || a.decided === 0 ? (
      "Of the calls you decided, the share you approved. Not enough data yet: no call was decided in the last 14 days."
    ) : (
      <>
        Of the calls you decided, the share you approved. <Num>{a.approved}</Num> approved,{" "}
        <Num>{a.rejected}</Num> rejected over the last <Num>14</Num> days
        {a.priorRate != null && a.rate != null
          ? `, ${TREND_WORD[a.trend]} against the 7 days before.`
          : "."}
      </>
    );

  /* ---- Metric C: autonomy ---- */
  const autonomyEvidence: React.ReactNode =
    c == null || c.unattended + c.gated === 0 ? (
      "Of the actions with a side effect, the share the loop carried on its own instead of stopping to ask. Not enough data yet: nothing with a side effect ran in the last 14 days."
    ) : (
      <>
        Of the actions with a side effect, the share the loop carried on its own instead of stopping
        to ask. <Num>{c.unattended}</Num> ran on its own, <Num>{c.gated}</Num> came to you over the
        last <Num>14</Num> days
        {c.priorRatio != null && c.ratio != null
          ? `, ${TREND_WORD[c.trend]} against the 7 days before.`
          : "."}
      </>
    );

  /* ---- Metric B: ritual retention ---- */
  const ritualReady = b?.tableReady ?? false;
  const ritualEvidence: React.ReactNode =
    b == null || !ritualReady ? (
      "Days in the last week you opened Today and cleared the queue. Not enough data yet: ritual tracking starts on the next sync."
    ) : b.daysActive7 === 0 ? (
      // Not a sparse read. The table answered and the answer is zero, so the
      // figure stands and the line says what zero means rather than pretending
      // the number is missing.
      "Days in the last week you opened Today and cleared the queue. You have not opened it once in the last seven days, so the streak starts the next time you do."
    ) : (
      <>
        Days in the last week you opened Today and cleared the queue. A streak of{" "}
        <Num>{b.currentStreak}</Num> {b.currentStreak === 1 ? "day" : "days"}, and{" "}
        <Num>{b.daysActive30}</Num> of the last <Num>30</Num>
        {b.realData == null ? "." : b.realData ? ", against real inputs." : ", on a demo seed."}
      </>
    );

  /* ---- The moat: outcome accuracy ---- */
  const accuracyError = readError(accuracyQ.isError, accuracyQ.error);
  const accuracyReady = accuracy?.tableReady ?? false;
  const accuracyRate = pct(accuracy?.rate ?? null);
  const accuracyHasData = accuracy != null && accuracyReady && accuracy.decided > 0;

  /* ---- The moat: memory-depth split ---- */
  const liftError = readError(liftQ.isError, liftQ.error);
  const liftReady = lift?.tableReady ?? false;
  const liftBounded = lift?.memoryBounded ?? true;
  const liftPoints = lift?.liftPoints ?? null;
  const liftHasNumber = lift != null && liftReady && liftBounded && liftPoints != null;

  // Why there is no number, keyed on the reason, so a person learns what would
  // unlock it. The over-cap case is NOT a sparse-data state and must not read
  // like one: it is a refusal to under-report depth, and no retry would change
  // it, which is why it is an Empty rather than a Failed.
  let liftBlocked = "Not enough data yet.";
  if (lift && liftReady && !liftBounded) {
    liftBlocked =
      "Your record is larger than we can score in one pass right now, so this is withheld rather than under-reported.";
  } else if (lift && liftReady && liftBounded && liftPoints == null) {
    if (lift.reason === "not-enough-outcomes") {
      liftBlocked =
        "Not enough reviewed bets yet. Two halves of 8 or more reviewed outcomes unlock this.";
    } else if (lift.reason === "depth-contrast-too-small") {
      liftBlocked =
        "Not enough variation in precedent across your reviewed bets to compare them yet.";
    } else if (lift.reason === "lift-within-noise") {
      liftBlocked = `Measured, but inside the margin of error at this sample. Earlier half ${pct(lift.sparseRate) ?? "not computable"} (n=${lift.sparseN}), later half ${pct(lift.richRate) ?? "not computable"} (n=${lift.richN}). Too close to call.`;
    } else if (lift.reason === "data-quality") {
      liftBlocked = "Not enough clean data yet.";
    }
  } else if (lift && !liftReady) {
    liftBlocked = "Not enough data yet: the precedent timeline lights up on the next sync.";
  }

  /* ---- The moat: memory compounds ---- */
  const memError = readError(memQ.isError, memQ.error);
  const memReady = mem?.tableReady ?? false;
  const memHasData = mem != null && memReady && mem.stored > 0;

  return (
    <>
      <Block
        title="The three proof metrics"
        sub="Read from real activity. The loop runs the reversible work and you make the calls, so a sparse window says so rather than inventing a number."
      >
        <Measure
          label="Acceptance rate"
          evidence={acceptEvidence}
          figure={a?.rate != null ? <Num>{pct(a.rate)}</Num> : null}
          loading={acceptQ.isLoading}
          error={readError(acceptQ.isError, acceptQ.error)}
          onRetry={() => void acceptQ.refetch()}
        />
        <Measure
          label="Autonomy ratio"
          evidence={autonomyEvidence}
          figure={c?.ratio != null ? <Num>{pct(c.ratio)}</Num> : null}
          loading={autonomyQ.isLoading}
          error={readError(autonomyQ.isError, autonomyQ.error)}
          onRetry={() => void autonomyQ.refetch()}
        />
        <Measure
          label="Ritual retention"
          evidence={ritualEvidence}
          figure={b != null && ritualReady ? <Num>{`${b.daysActive7}/7`}</Num> : null}
          loading={ritualQ.isLoading}
          error={readError(ritualQ.isError, ritualQ.error)}
          onRetry={() => void ritualQ.refetch()}
        />
      </Block>

      {/* The one Record on this surface. It is the record speaking about YOUR
          judgment, which is what separates a claim from a statistic. */}
      <Block
        title="Outcome accuracy"
        sub="We do not claim that learning caused this. That needs an on and off control we do not have, so this is the validated share and nothing more."
      >
        {accuracyQ.isLoading ? (
          <Loading>Reading what your bets came to.</Loading>
        ) : accuracyError ? (
          <Failed onRetry={() => void accuracyQ.refetch()}>
            Outcome accuracy did not load, so nothing here is a claim about your bets.{" "}
            {accuracyError}
          </Failed>
        ) : accuracyHasData ? (
          <RecordRecess
            evidence={
              <>
                <Num>{accuracy.validated}</Num> validated · <Num>{accuracy.missed}</Num> missed ·{" "}
                <Num>{accuracy.mixed}</Num> mixed, over <Num>90</Num> days
              </>
            }
          >
            Of the bets you shipped and then reviewed, <Num>{accuracyRate}</Num> validated
            {accuracy.priorRate != null && accuracy.rate != null
              ? `, ${TREND_WORD[accuracy.trend]} against the period before.`
              : "."}
          </RecordRecess>
        ) : (
          <Empty>
            {accuracyReady
              ? "Not enough data yet. Record an outcome on a shipped spec and its verdict lands here."
              : "Not enough data yet. Outcome tracking lights up on the next sync."}
          </Empty>
        )}
      </Block>

      <Block
        title="Precedent-depth split"
        sub="Correlational, within your account. It compares bets by how much precedent had accumulated when each was decided, never an on and off test, so getting better with practice could explain it instead."
      >
        {liftQ.isLoading ? (
          <Loading>Reading the split.</Loading>
        ) : liftError ? (
          <Failed onRetry={() => void liftQ.refetch()}>
            The split did not load, so nothing here is a claim about your precedent. {liftError}
          </Failed>
        ) : liftHasNumber ? (
          /* Neutral for either sign. This is an association, not a win, so the
             value takes no outcome tone. */
          <Line
            label="The later half against the earlier half"
            sub={
              <>
                Earlier half <Num>{pct(lift.sparseRate)}</Num> validated (n=
                <Num>{lift.sparseN}</Num>), later half <Num>{pct(lift.richRate)}</Num> (n=
                <Num>{lift.richN}</Num>). One outcome moves this about <Num>{lift.swingPoints}</Num>{" "}
                pts.
              </>
            }
          >
            <Value>
              <Num>{`${liftPoints > 0 ? "+" : ""}${liftPoints} pts`}</Num>
            </Value>
          </Line>
        ) : (
          <Empty>{liftBlocked}</Empty>
        )}
      </Block>

      {/* A NOUN PHRASE, like its three siblings above it on this surface. This
          was "Learning compounds" until 2026-08-10, the only heading here that
          was a sentence, so the eye read it as a claim rather than a section
          name, and on a workspace with no recall yet it sat directly on top of
          its own empty state saying nothing had been learned. It also broke the
          rule CLAUDE.md states by name: never claim accumulated learning in the
          present tense. The compounding argument is not lost, it moved to the
          sub, where it is argued off the number instead of asserted above it. */}
      <Block
        title="Learning recall"
        sub="Of what the loop learned, the share it has read back at least once. Learning it reopens is a moat; learning it never reopens is a log. Net dollar retention is deliberately absent: it needs recurring revenue, so it lands once billing ships."
      >
        {memQ.isLoading ? (
          <Loading>Reading the record.</Loading>
        ) : memError ? (
          <Failed onRetry={() => void memQ.refetch()}>
            The record did not load, so nothing here is a claim about what it learned. {memError}
          </Failed>
        ) : memHasData ? (
          <>
            <Line
              label="Recalled back"
              sub={
                <>
                  <Num>{mem.recalled}</Num> of the <Num>{mem.stored}</Num> lessons learned
                </>
              }
            >
              <Value>
                <Num>{pct(mem.reuseRate)}</Num>
              </Value>
            </Line>
            <Line
              label="New this week"
              sub="The loop learns one each time an outcome lands or an agent reflects on a run."
            >
              <Value>
                <Num>{`+${mem.newThisWeek}`}</Num>
              </Value>
            </Line>
            <Line
              label="Outcomes that moved a priority"
              sub="A recorded outcome that actually changed where a bet sits in the ranking."
            >
              <Value>
                <Num>{mem.prioritiesMoved}</Num>
              </Value>
            </Line>
          </>
        ) : (
          <Empty>
            {memReady
              ? "Not enough data yet, nothing learned. The loop learns each time an outcome lands or an agent reflects on a run, then draws on it the next pass."
              : "Not enough data yet. This lights up on the next sync."}
          </Empty>
        )}
      </Block>
    </>
  );
}
