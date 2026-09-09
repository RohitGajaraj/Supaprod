/**
 * THE RECORD LEARN KEEPS, WHERE THE RAIL LANDS.
 *
 * ── WHY IT MOVED HERE (Lane 2, 2026-09-09) ───────────────────────────────
 * These regions were the body of `/learn`, a route the rail stopped reaching
 * on 2026-09-07 and nothing on the loop pointed at; a forecast three days
 * past its date sat there unseen while Outcomes, the one door to Learn,
 * showed the record and no way to settle it. P-14b (A-QUEUE.md) already
 * ruled that `/learn` is deleted once Outcomes carries its blocks. The desk
 * (`ForecastDeskPanel`) went to the top of Outcomes on 2026-09-08; this is
 * the rest, in the order `/learn` drew it, under the outcomes tab:
 *
 *   1. the settle gate (`SettlePanel`), the write this station exists for;
 *   2. the last verdict on the record, so "what did I just settle?" survives
 *      a reload;
 *   3. what paid off, with the misses counted rather than hidden;
 *   4. the learned cards and the claim beside the verdict;
 *   5. lessons put forward, the support notes that came back, and the
 *      record as a file.
 *
 * `/learn` is a redirect to `/outcomes?tab=learnings` now. Every read below
 * is the one `/learn` made, under the same keys, so nothing on the page can
 * disagree with the counts the desk above it draws. The context column that
 * said "What the record moved" is not carried: Outcomes draws the same block
 * from the same read already.
 *
 * ── WHAT THIS KEEPS FROM THE ROUTE'S OWN HEADER ──────────────────────────
 * The route's header (kept in git at `_authenticated.learn.tsx` before the
 * fold) argued three things that still bind here: a zero on the record is
 * never dressed as progress; a failed read is said, never rendered as an
 * empty workspace (`stillWaiting` closes the pending-not-fetching gap); and
 * the doors at the zero state go to Ship and Start, the two places work
 * becomes gradeable.
 */
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueries } from "@tanstack/react-query";

import { plainProse } from "@/lib/plain-prose";
import { endedSessionOn, failureLine } from "@/lib/error-copy";
import { Row } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingYet,
  Num,
  ReadFailedLine,
  Reading,
  RecordSpeaks,
  Region,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { Quiet } from "@/components/meridian/Quiet";
import {
  getOutcomeData,
  listAgentSettledOutcomes,
  listLearnings,
  listPendingOutcomes,
} from "@/lib/outcome.functions";
import { getImpactLedger } from "@/lib/pm-impact.functions";
import { getLearningGradeContext } from "@/lib/decisions.functions";
import { SettlePanel } from "@/components/learn/SettlePanel";
import { LearnedCards } from "@/components/learn/LearnedCards";
import { VERDICT_SAYS } from "@/components/learn/verdict-words";
import { stillWaiting } from "@/lib/query-state";

function day(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}`;
}

function iceShiftOf(prior: number | string | null, next: number | string | null): number | null {
  const a = prior === null ? NaN : Number(prior);
  const b = next === null ? NaN : Number(next);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) * 10) / 10;
}

const GRADE_CONTEXT_BOUND = 8;

/**
 * THE CLAIM BESIDE THE VERDICT (queue 70, F-65's read half): what the team
 * believed before the outcome was known, next to how it settled. A learning
 * with no linked decision returns null and renders nothing; bounded at the
 * newest eight. Renders nothing at all until one pairing exists.
 */
function ClaimBesideVerdict({
  learnings,
  enabled,
}: {
  learnings: ReadonlyArray<{ id: string; verdict: string }>;
  enabled: boolean;
}) {
  const fGrade = useServerFn(getLearningGradeContext);
  const slice = learnings.slice(0, GRADE_CONTEXT_BOUND);
  const contexts = useQueries({
    queries: slice.map((l) => ({
      queryKey: ["learning-grade-context", l.id],
      queryFn: () => fGrade({ data: { learningId: l.id } }),
      enabled,
      staleTime: 60_000,
    })),
  });

  const pairings = contexts
    .map((q, i) => ({ q, learning: slice[i] }))
    .filter(({ q }) => q.data?.decision != null);

  if (!enabled || pairings.length === 0) return null;

  return (
    <Region
      title="The claim beside the verdict"
      sub="What was believed before the outcome was known, next to how it settled."
    >
      <div className="flex flex-col gap-mrd-3">
        {pairings.map(({ q, learning }) => {
          const d = q.data!.decision;
          const said = VERDICT_SAYS[learning.verdict as keyof typeof VERDICT_SAYS] ?? "settled";
          const parts = [
            d!.forecastClaim,
            d!.forecastHorizonDate ? `Due ${day(d!.forecastHorizonDate)}` : null,
            d!.forecastResolution ?? `The outcome: ${said}.`,
          ].filter(Boolean);
          return <Row key={d!.id} lead={d!.title} sub={parts.join(" · ")} />;
        })}
      </div>
    </Region>
  );
}

export function LearnRecord() {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [focus, setFocus] = React.useState(0);
  const [tookIt, setTookIt] = React.useState<string | null>(null);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const fOutcome = useServerFn(getOutcomeData);
  const fLedger = useServerFn(getImpactLedger);
  const fPending = useServerFn(listPendingOutcomes);
  const fSettled = useServerFn(listAgentSettledOutcomes);
  const fLearnings = useServerFn(listLearnings);

  const outcome = useQuery({ queryKey: ["outcome"], queryFn: () => fOutcome() });
  const pendingQ = useQuery({ queryKey: ["outcome-pending"], queryFn: () => fPending() });
  const settledQ = useQuery({ queryKey: ["outcome-agent-settled"], queryFn: () => fSettled() });

  /*
   * WHICH WORKSPACE THE RECORD IS DRAWN FROM: the bet in focus on the settle
   * gate, else the first pending, else the first agent-settled. The desk is
   * the RLS union across every workspace the person is in; the record below
   * it is one workspace's, and it follows the bet a person is looking at.
   */
  const [focusWorkspaceId, setFocusWorkspaceId] = React.useState<string | null>(null);
  const rememberDeskWorkspace = React.useCallback((workspaceId: string | null) => {
    if (workspaceId) setFocusWorkspaceId(workspaceId);
  }, []);
  const recordWorkspaceId =
    focusWorkspaceId ??
    pendingQ.data?.pending[0]?.workspaceId ??
    settledQ.data?.settled[0]?.workspaceId ??
    null;

  const ledgerQ = useQuery({
    queryKey: ["impact-ledger", recordWorkspaceId],
    queryFn: () => fLedger({ data: recordWorkspaceId ? { workspaceId: recordWorkspaceId } : {} }),
  });

  const lastQ = useQuery({
    queryKey: ["learnings", recordWorkspaceId],
    queryFn: () => fLearnings({ data: { workspaceId: recordWorkspaceId } }),
    enabled: !!recordWorkspaceId,
  });
  const lastSettled = lastQ.data?.learnings[0] ?? null;

  const ledger = ledgerQ.data?.ledger ?? null;
  const markdown = ledgerQ.data?.markdown ?? "";
  const outcomes = ledger?.outcomes ?? null;
  const support = outcome.data?.support ?? [];
  const waiting = pendingQ.data?.pending.length ?? 0;

  const highlights = ledger?.highlights ?? [];
  const focusIdx = highlights.length > 0 ? Math.min(focus, highlights.length - 1) : 0;
  const lead = highlights[focusIdx] ?? null;

  const loading = stillWaiting(ledgerQ, outcome);

  const leadEvidence = lead
    ? [
        lead.metricLabel && lead.metricValue ? `${lead.metricLabel}: ${lead.metricValue}` : null,
        lead.iceShift !== null ? `priority ${signed(lead.iceShift)}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const doc = React.useMemo(() => {
    const who = name.trim();
    return who && markdown ? markdown.replace(/^# .*$/m, `# ${who}`) : markdown;
  }, [markdown, name]);

  async function copyRecord() {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(doc);
      setTookIt("Copied");
    } catch {
      downloadRecord();
      setTookIt("Downloaded instead");
    }
    copyTimer.current = setTimeout(() => {
      setTookIt(null);
      copyTimer.current = null;
    }, 1600);
  }

  function downloadRecord() {
    const blob = new Blob([doc], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "decision-record.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  const endedSession = endedSessionOn(
    outcome.error,
    ledgerQ.error,
    lastQ.error,
    pendingQ.error,
    settledQ.error,
  );

  if (endedSession) {
    /* "The record did not load" is the machine's problem; that the record is
       still there is the person's. Said that way, with the one door out. */
    return (
      <div className="flex flex-col items-start gap-mrd-4">
        <RecordSpeaks>{`The record is still here. Nothing you have learned is lost. ${endedSession}`}</RecordSpeaks>
        <Action onClick={() => window.location.assign("/login")}>Sign in</Action>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-mrd-7">
      {/* The write this station exists for. It owns its own reads, its own
          receipts and the queue it drains, and reports which workspace the bet
          in focus lives in; everything below is drawn from that workspace. */}
      <SettlePanel onDeskWorkspace={rememberDeskWorkspace} />

      {/* WHAT SURVIVES A RELOAD. The panel's receipt stack is React state and
          gone the moment the page reloads, and the paid-off block below cannot
          carry a fresh verdict at all (validated-only, ranked by score
          movement). Ordered by when it was written, which every learning has. */}
      {lastSettled ? (
        <Region
          title="The last verdict on the record"
          sub={
            outcomes && outcomes.total > 1 ? (
              <>
                <Num>{outcomes.total - 1}</Num> on the record before it
              </>
            ) : null
          }
        >
          {/* NOT `tight`: 134 of 135 learning summaries on production run past
              one clamped line, and nothing else opens this row. */}
          <Row
            lead={
              lastSettled.summary.trim() ||
              lastSettled.opportunity_title ||
              "Settled with nothing written up"
            }
            sub={
              <>
                {VERDICT_SAYS[lastSettled.verdict]}
                {lastSettled.metric_label && lastSettled.metric_value ? (
                  <>
                    {" · "}
                    {lastSettled.metric_label}: <Num>{lastSettled.metric_value}</Num>
                  </>
                ) : null}
                {(() => {
                  const shift = iceShiftOf(lastSettled.prior_ice, lastSettled.new_ice);
                  return shift === null || shift === 0 ? null : (
                    <>
                      {" · priority "}
                      <Num>{signed(shift)}</Num>
                    </>
                  );
                })()}
              </>
            }
            time={day(lastSettled.created_at)}
          />
        </Region>
      ) : null}

      {/* The sub carries what the title cannot: the ledger only ever writes up
          wins, so without it the misses are invisible on the one surface that
          must not flatter. */}
      <Region
        title="What paid off"
        sub={
          outcomes && outcomes.missed > 0 ? (
            <>
              <Num>{outcomes.missed}</Num> came back against you. Those are counted, not written up
              here.
            </>
          ) : null
        }
      >
        {ledgerQ.isError ? (
          <ReadFailedLine onRetry={() => void ledgerQ.refetch()} error={ledgerQ.error}>
            Nothing here would be trustworthy until it loads, and nothing has been lost.
          </ReadFailedLine>
        ) : stillWaiting(ledgerQ) ? (
          <Reading>Reading the record.</Reading>
        ) : lead ? (
          <>
            <RecordSpeaks evidence={leadEvidence || null}>{plainProse(lead.summary)}</RecordSpeaks>
            {highlights.length > 1 ? (
              <div className="mt-mrd-4">
                {highlights.map((h, i) =>
                  i === focusIdx ? null : (
                    <Row
                      key={i}
                      tight
                      lead={plainProse(h.summary) ?? undefined}
                      sub={
                        h.metricLabel && h.metricValue ? (
                          <>
                            {h.metricLabel}: <Num>{h.metricValue}</Num>
                          </>
                        ) : null
                      }
                      time={h.iceShift !== null ? signed(h.iceShift) : null}
                      onClick={() => setFocus(i)}
                    />
                  ),
                )}
              </div>
            ) : null}
          </>
        ) : (outcomes?.total ?? 0) === 0 ? (
          /* A new workspace gets a door, not a paragraph: Ship is where work
             becomes gradeable, Start is where the specs in flight live. Both
             are `Action`, neither is `Approve`: nothing here is held. */
          <>
            <Quiet
              says="Nothing has shipped yet, so there is nothing to grade."
              whatWillAppear="A verdict lands here the first time a shipped bet is graded against what its spec said it was for, and it stays on the record after that. Write down what a bet is meant to move before it goes out, and the grade has something to measure against."
            />
            <Actions>
              {/* P-14b (2026-09-09): Ship's record is the artifacts tab of this
                  same page now, so the door names the tab rather than the
                  retired route -- a redirect would land here anyway, and a
                  door that goes out and comes back is a door that flickers. */}
              <Action
                variant="primary"
                onClick={() => navigate({ to: "/outcomes", search: { tab: "artifacts" } })}
              >
                See what is waiting to go out
              </Action>
              <Action onClick={() => navigate({ to: "/start" })}>Open the specs</Action>
            </Actions>
          </>
        ) : (outcomes?.validated ?? 0) === 0 ? (
          <NothingYet>
            Nothing has paid off yet. <Num>{outcomes?.total}</Num> outcomes are on the record and
            none of them came back for you.
          </NothingYet>
        ) : (
          <NothingYet>
            Outcomes paid off, none of them written up. Add what happened the next time you record a
            verdict.
          </NothingYet>
        )}
      </Region>

      {/* What an outcome taught, through the Meridian card pair; fed by the
          same `listLearnings` rows the last-verdict row reads, so it costs no
          second fetch and cannot disagree with the counts. */}
      {recordWorkspaceId ? (
        <LearnedCards
          learnings={lastQ.data?.learnings ?? []}
          settledOnRecord={outcomes?.total ?? null}
          awaitingVerdict={waiting > 0 ? waiting : undefined}
          loading={stillWaiting(lastQ)}
          loadError={
            lastQ.isError ? failureLine("The last verdict did not load.", lastQ.error) : null
          }
          onRetry={() => void lastQ.refetch()}
        />
      ) : null}

      <ClaimBesideVerdict learnings={lastQ.data?.learnings ?? []} enabled={!!recordWorkspaceId} />

      {/* Lessons put forward: no resolver returns rows that answer the scope
          question yet, so this is the pair's own empty state, pointed at where
          standing rules live (the decisions tab of this page). */}
      <Region title="Lessons put forward to hold everywhere">
        <RecordSpeaks>
          Nothing reads promotions yet, so this cannot tell you whether a lesson is waiting to
          travel beyond the product it was learned in.
        </RecordSpeaks>
        <div className="mt-mrd-3">
          <Action onClick={() => navigate({ to: "/outcomes", search: { tab: "decisions" } })}>
            See the standing rules
          </Action>
        </div>
      </Region>

      {/* Support notes belong to Discover, which triages them against open
          bets: one line and a door. */}
      {outcome.isError ? (
        <Region>
          <ReadFailedLine onRetry={() => void outcome.refetch()} error={outcome.error}>
            What came back from people did not load.
          </ReadFailedLine>
        </Region>
      ) : loading ? (
        <Reading>Reading what else it learned.</Reading>
      ) : support.length > 0 ? (
        <Region>
          <Row
            tight
            lead={
              <>
                <Num>{support.length}</Num>{" "}
                {support.length === 1 ? "note came back" : "notes came back"} from people
              </>
            }
            sub="Read them on the signals desk, against the bets you have open"
            onClick={() => navigate({ to: "/arriving", search: { tab: "signals" } })}
          />
        </Region>
      ) : null}

      {ledger && ledgerQ.data ? (
        <Region title="Take the record with you">
          <div className="flex flex-col gap-mrd-5">
            <Field label="Name on the header" htmlFor="record-name">
              <Input
                id="record-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
                autoComplete="name"
              />
            </Field>
            {/* Neither unblocks anything: one writes to the clipboard and one
                writes a file. `Action`, no primary, the same offer twice. */}
            <Actions>
              <Action onClick={() => void copyRecord()}>{tookIt ?? "Copy it"}</Action>
              <Action onClick={downloadRecord}>Download it</Action>
            </Actions>
          </div>
        </Region>
      ) : null}
    </div>
  );
}

export default LearnRecord;
