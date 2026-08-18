/**
 * Learn. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md, all seven).
 *
 * THE FINDING THIS PASS ANSWERS. An audit of the 01..07 spine asked which
 * server functions each stage's surface actually calls. Learn called two, and
 * both were reads: `getOutcomeData` and `getImpactLedger`. So stage 07 was a
 * report. You could not record an outcome from it. `recordOutcome` had been
 * built, in this surface's own domain module, and the only caller in the whole
 * product was a pre-rebuild card inside a tab of `/plan/spec/$id` that fired a
 * success toast and rendered nothing of what the write caused.
 *
 * That matters more than any other stage being thin, because the investor
 * canon is binding on it: "The brain is never storage. It compounds; next time
 * it tells you what is right, and warns before you repeat what was wrong." A
 * loop whose last stage cannot capture what happened does not compound.
 *
 * 1. WHO IS HERE, AND WHAT DID THEY COME TO DO. A product lead whose bet has
 *    shipped, come to settle it: to put on the record what the world actually
 *    did, and to be told what that costs.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS FOR. To settle an outcome, and to show
 *    what settling it changed. Everything else here is the record that
 *    settling produces, or a door out of it.
 *
 * 3. KEEP / MOVE / KILL, against what the previous pass left standing:
 *    ADD   the settle Gate, the verdict form and the waiting queue
 *          (`SettlePanel`). The surface's whole reason to exist, and the write
 *          that was already built and unreachable from the spine.
 *    ADD   the projection. Before you click, the Gate says what the verdict
 *          would move the linked bet's priority to, computed by the server
 *          from the same arithmetic the write runs, so the promise and the
 *          write cannot drift.
 *    ADD   the consequence beyond the score. A missed verdict against an agent
 *          still earning its autonomy holds its promotion, because
 *          `auto_advance_agent_arc` returns early on exactly that row. Warned
 *          before, recorded after.
 *    ADD   the receipt. A settled outcome renders what it caused; a failed one
 *          says so and says nothing was written (anti-slop.md section 5).
 *    ADD   (2026-08-06) "The last verdict on the record", and it closes a hole
 *          the receipt could not. The receipt stack lives in React state and
 *          dies on reload, and the paid-off list below can never carry a
 *          freshly settled outcome: `computeImpactLedger` builds it from
 *          VALIDATED learnings only, ranks them by ICE shift, sorts a null
 *          shift last (-Infinity) and keeps three. A bet with no linked
 *          opportunity gets prior_ice and new_ice null by construction
 *          (`applyOutcome` rescores nothing when `prd.opportunity_id` is null),
 *          so its shift is null, so it is last forever behind whatever already
 *          moved a score. Both bets on the desk today are exactly that. The
 *          result: you settle a verdict, reload, and the only trace is a
 *          waiting count one lower. This row is read from `listLearnings`,
 *          which is ordered by when it was written rather than by a number an
 *          unlinked bet can never have. The ranking itself is in pm-impact.ts,
 *          which belongs to no station and is not touched here.
 *    ADD   (2026-08-02) the agent as the DEFAULT settler, and this surface as
 *          the exception desk. The hourly sweep now puts the verdict on the
 *          record itself whenever the evidence supports it, so the headline
 *          counts what the agent could not evidence rather than every outcome,
 *          the sub says how many it settled without you, and the panel carries
 *          a block of agent-settled verdicts with their confidence, the facts
 *          they rested on, and a one-click way to disagree. The founder's
 *          ruling and the governance floor it has to respect are argued in
 *          full at the top of src/lib/ai/outcome-review.ts.
 *    KEEP  the record recess and the paid-off list. Made switchable last pass,
 *          and still the only place a learning can be read in full here.
 *    KEEP  the headline, now leading with what is WAITING, because that is the
 *          job. The record so far moves to the sub, which is a different fact.
 *    KEEP  "Take the record with you". Brain's own pass moved the impact
 *          ledger here and killed its copy, so this is its only home.
 *    KEEP  two context facts and only two: how far priority moved, and how
 *          many calls you later replaced.
 *    KEEP  the one-line door to the signals desk. A support note is the INPUT
 *          to a learning; Discover triages it against the bets you have open.
 *    KILL  nothing further. The previous pass already removed the announcement
 *          gate, the announcements block, the false "Priorities it changed"
 *          list, the inline markdown dump and two restating context rows, and
 *          every one of those verdicts still holds.
 *
 * 4. ONE CLICK AWAY. Every waiting bet that is not the one in focus, as a
 *    two-line row. Every learning that is not the one in focus. The support
 *    notes, on Discover. The full document, by Copy or Download.
 *
 * 5. DELIGHT, AND CONFUSION. The moment is the sentence that appears before
 *    you commit: "Checkout retry moves from 6.3 to 7.0", and under a miss,
 *    "Engineer made this call, so its promotion is held". Nothing else in a
 *    product lead's working life prices a verdict before they give it. The
 *    confusion the surface shipped with, and still guards against: the ledger
 *    only ever writes up WINS, so the paid-off block names itself honestly and
 *    counts the misses out loud above the list.
 *
 * 6. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Measure drafts the verdict
 *    from real usage deltas and the merged change, and the draft is attributed
 *    and confidence-tiered rather than presented as fact. Every waiting row
 *    wears the mark of the agent that made the call being judged. A miss
 *    against an agent still on the observing or proving arc holds its
 *    promotion. Remove every agent and this surface loses the draft, the
 *    attribution and the consequence, and becomes a manual form. It passes.
 *
 * 7. WOULD A STRANGER RECOGNISE IT.
 *    IDENTITY DRAWN: the agent that decided each waiting bet wears its own
 *      glyph, shape first so it survives greyscale. Nothing else on this
 *      surface has an identity a reader already carries.
 *    SCANNING PATH: the Gate question. It is the largest type on the page and
 *      it is a question with a name in it, so the eye lands on WHICH bet is
 *      being judged before anything else. Nothing competes: the headline is a
 *      count, the form is labels, the record below is a recess.
 *    EMPTIEST REALISTIC STATE: a month-old workspace with one shipped spec, no
 *      linked opportunity, no analytics event and no merged changeset. The
 *      Gate then says there is no draft, names exactly what was missing when
 *      you ask for one, and says settling moves no priority because no bet is
 *      linked. Every one of those is a fact, and none of them is a zero.
 *    WHAT A STRANGER DOES NOT UNDERSTAND, and what was done about it: ICE is
 *      never printed, the word is "priority" and the number is a score; the
 *      trust arc is never named, it is "promotion"; the verdicts are "it
 *      worked", "mixed", "it did not", the same three words the run screen's
 *      stage 07 panel uses.
 *
 * ONE WORKSPACE, AND IT IS THE ONE THE BET IN FOCUS LIVES IN.
 *
 * The desk (`listPendingOutcomes`) applies no workspace filter, deliberately:
 * it is every bet anywhere the reader can see that needs a call. The record
 * (`getImpactLedger`) is one workspace, and with no argument it resolves
 * `current_user_default_workspace()`, which is the EARLIEST workspace_members
 * row and has nothing to do with where the work is. Measured live: both bets on
 * the desk are in one workspace and the default is a different one, so settling
 * a bet wrote a learning into the bet's workspace and left every number on this
 * page untouched. So the panel reports which workspace the bet in focus lives
 * in, and the ledger and the last-verdict row are both pointed at it. Scoping
 * the DESK to the default workspace instead would have been one line and is the
 * wrong half to change: it empties the desk and takes the work away.
 *
 * VOICE: never greet, always report. The first line is a count that is true or
 * it is not drawn at all. ["outcome"], ["outcome-pending"] and
 * ["outcome-agent-settled"] are unchanged. ["impact-ledger"] and ["learnings"]
 * now carry the workspace as a second key segment, because the same key holding
 * two workspaces' answers is the cache serving one workspace's record to
 * another. Both still match SettlePanel's invalidations, which are by prefix.
 */

import * as React from "react";
import { Row } from "@/components/meridian/rows";
import { Num, Actions } from "@/components/meridian/surface-parts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import {
  getOutcomeData,
  listAgentSettledOutcomes,
  listLearnings,
  listPendingOutcomes,
} from "@/lib/outcome.functions";
import { getImpactLedger } from "@/lib/pm-impact.functions";
import { SettlePanel } from "@/components/learn/SettlePanel";
import { ForecastDeskPanel } from "@/components/learn/ForecastDeskPanel";
import { VERDICT_SAYS } from "@/components/learn/verdict-words";
import { Block, Button, CtxHead, CtxRow, Empty, Failed, Gate, Loading, Field, Input, PageHead, Record as RecordRecess, Surface } from "@/components/shell/primitives";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { CrewWorking } from "@/components/shell/CrewWorking";
import { stillWaiting } from "@/lib/query-state";

export const Route = createFileRoute("/_authenticated/learn")({
  component: Learn,
  head: () => ({ meta: [{ title: "Learn · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Learn] route crashed:", error);
    return (
      <Surface>
        {/* THE AUTONOMOUS PATH, VISIBLE. Renders nothing unless an agent is
            genuinely mid-run, so it costs no space when the crew is idle and
            cannot show a step that did not happen. Every other pulse on this
            station is gated on a mutation the reader's own click started;
            this one is bound to the run. See use-live-agents.ts. */}
        <CrewWorking />
        <PageHead title="The record did not load." sub="Reload the page. Nothing here is lost." />
      </Surface>
    );
  },
});

function day(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function signed(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}`;
}

/** How far a learning moved the bet it was written against, or null when it
 *  moved nothing. `numeric` columns arrive as strings over PostgREST, so both
 *  ends are coerced before the subtraction; a learning with no linked
 *  opportunity carries neither end and yields null rather than a zero. */
function iceShiftOf(prior: number | string | null, next: number | string | null): number | null {
  const a = prior === null ? NaN : Number(prior);
  const b = next === null ? NaN : Number(next);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) * 10) / 10;
}

function Learn() {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("learn");
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  // Which learning holds the recess. The list is short (the ledger caps
  // highlights at three), so this is a click, never a scroll.
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
  // The same keys SettlePanel reads, so the counts in the headline and the
  // queues below it are one fetch each and can never disagree. Read BEFORE the
  // record, because the record is scoped by what these return.
  const pendingQ = useQuery({ queryKey: ["outcome-pending"], queryFn: () => fPending() });
  const settledQ = useQuery({ queryKey: ["outcome-agent-settled"], queryFn: () => fSettled() });

  /**
   * WHICH WORKSPACE THE RECORD ON THIS PAGE IS DRAWN FROM.
   *
   * Told by the panel, which owns which bet is in focus, and falling back to
   * the desk's own lead row before its first report so the first paint is
   * already right rather than briefly showing another workspace's numbers. The
   * agent-settled list is the second fallback: with nothing waiting, the bets
   * Measure settled are still the work this page is about.
   *
   * Null means the page has never been told and the desk has nothing to read
   * it off, and then this stays out of the way and lets the server resolve its
   * default. That is the one case where the page cannot name its own
   * workspace.
   *
   * A REPORT OF null IS NOT A REPORT OF ANOTHER WORKSPACE, which is why the
   * last answer is kept rather than cleared. The panel reports null the moment
   * it has no bet in focus, and the commonest way to get there is settling the
   * LAST bet on the desk. Taking that literally would swing the ledger back to
   * the server's default workspace at the exact moment the reader has just
   * written into a different one: every count on this page would change under
   * the same headline for a reason nothing on screen explains, and the
   * last-verdict row below, which is gated on knowing the workspace, would
   * disappear on the one write it exists to show. So the last workspace
   * actually NAMED wins, and only another name replaces it.
   */
  const [focusWorkspaceId, setFocusWorkspaceId] = React.useState<string | null>(null);
  // Stable identity on purpose: the panel lists this in an effect's
  // dependencies, so a fresh function every render would fire it every render.
  const rememberDeskWorkspace = React.useCallback((workspaceId: string | null) => {
    if (workspaceId) setFocusWorkspaceId(workspaceId);
  }, []);
  const recordWorkspaceId =
    focusWorkspaceId ??
    pendingQ.data?.pending[0]?.workspaceId ??
    settledQ.data?.settled[0]?.workspaceId ??
    null;

  // The name is NOT sent to the server. It only ever set the document's H1, and
  // the key here has never carried it, so typing a name refetched nothing and
  // the field silently did nothing at all. Titling the document on the client
  // makes the field work and keeps the key stable.
  const ledgerQ = useQuery({
    queryKey: ["impact-ledger", recordWorkspaceId],
    queryFn: () => fLedger({ data: recordWorkspaceId ? { workspaceId: recordWorkspaceId } : {} }),
  });

  /**
   * WHAT WAS SETTLED LAST, in the order it was settled.
   *
   * Gated on knowing the workspace, and that gate is the point rather than
   * caution: unfiltered, `listLearnings` returns the union across every
   * workspace the reader belongs to, and a row from one workspace sitting
   * beside a ledger from another is the exact defect this pass is closing. With
   * no bet on the desk and none settled by an agent there is nothing to have
   * just settled, so nothing is lost by staying quiet.
   */
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
  const agentSettled = settledQ.data?.settled.length ?? 0;

  const highlights = ledger?.highlights ?? [];
  const focusIdx = highlights.length > 0 ? Math.min(focus, highlights.length - 1) : 0;
  const lead = highlights[focusIdx] ?? null;

  const loading = stillWaiting(ledgerQ, outcome);

  // A fact, assembled from real counts. Never a number we do not have. What is
  // WAITING leads, because settling it is the job; what came back so far is a
  // different fact and goes in the sub.
  const headline = React.useMemo(() => {
    // Same gap as the record Block below, and it matters more here: every
    // number in this headline is derived from `ledger`/`outcomes`, so an
    // unanswered read does not produce a blank, it produces CONFIDENT ZEROES.
    // "None of them decisive yet" is a claim about the record, and it was
    // reachable from a read that had not returned.
    if (stillWaiting(ledgerQ, pendingQ)) return "Learn";
    if (waiting > 0) {
      // "Asked for" rather than "waiting on", because the queue is now the
      // exception the agent could not evidence, not the default every outcome
      // passes through. Calling it a waiting list would misdescribe what a
      // person is looking at and quietly re-centre the human as the bottleneck.
      return waiting === 1
        ? "One shipped bet needs your call."
        : `${waiting} shipped bets need your call.`;
    }
    if (agentSettled > 0) {
      return agentSettled === 1
        ? "Measure settled the last outcome on its own."
        : `Measure settled the last ${agentSettled} outcomes on its own.`;
    }
    if (!outcomes) return "The record is not readable right now.";
    if (outcomes.total === 0) return "No outcome has come back yet.";
    const back =
      outcomes.total === 1 ? "One outcome came back" : `${outcomes.total} outcomes came back`;
    const decisive = outcomes.validated + outcomes.missed;
    // SAY WHY THE TWO NUMBERS DIFFER. This read "8 outcomes came back. 4 of 7
    // paid off", which is arithmetically right and looks like a typo: the eighth
    // outcome is real but has not settled either way. An unexplained mismatch on
    // the surface that reports whether the product works costs more than the word
    // it takes to explain it.
    const verdict =
      decisive > 0
        ? decisive === outcomes.total
          ? `${outcomes.validated} of ${decisive} paid off.`
          : `${outcomes.validated} of the ${decisive} that settled paid off.`
        : "None of them decisive yet.";
    return `${back}. ${verdict}`;
  }, [ledgerQ, pendingQ, waiting, agentSettled, outcomes]);

  const since = day(ledger?.span.firstAt ?? null);
  const movedPriority = (ledger?.measuredOutcomes ?? 0) > 0;
  const revisedBeliefs = (ledger?.beliefsRevised ?? 0) > 0;
  const decisive = outcomes ? outcomes.validated + outcomes.missed : 0;

  // The sub carries the OTHER fact, never a restatement of the title (hard ban
  // 10). With bets waiting, that is the record so far; with none waiting, it is
  // how far back the record goes.
  const sub: React.ReactNode =
    waiting > 0 && agentSettled > 0 ? (
      <>
        Measure settled <Num>{agentSettled}</Num> more without you
      </>
    ) : waiting > 0 && outcomes && decisive > 0 ? (
      <>
        <Num>{outcomes.validated}</Num> of <Num>{decisive}</Num> already settled paid off
      </>
    ) : since ? (
      <>
        Since <Num>{since}</Num>
        {movedPriority ? (
          <>
            {" · "}
            <Num>{ledger?.measuredOutcomes}</Num> measured
          </>
        ) : null}
      </>
    ) : null;

  // What backs the one in focus. Assembled as a string so a learning carrying
  // neither a metric nor a shift draws no evidence line at all, rather than an
  // empty one pretending there is something under it.
  const leadEvidence = lead
    ? [
        lead.metricLabel && lead.metricValue ? `${lead.metricLabel}: ${lead.metricValue}` : null,
        lead.iceShift !== null ? `priority ${signed(lead.iceShift)}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  // renderImpactMarkdown writes the header as a single "# " line, so retitling
  // it here is exactly what passing the name to the server used to do.
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
      // Clipboard unavailable. Give them the file rather than a dead button.
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

  return (
    <Surface
      context={
        ledger && (movedPriority || revisedBeliefs) ? (
          <>
            <CtxHead>What the record moved</CtxHead>
            {movedPriority ? (
              <CtxRow
                name={
                  <>
                    Priority moved <Num>{signed(ledger.iceShiftTotal)}</Num>
                  </>
                }
                sub={
                  <>
                    across <Num>{ledger.measuredOutcomes}</Num> measured outcomes
                  </>
                }
              />
            ) : null}
            {revisedBeliefs ? (
              <CtxRow
                name={
                  <>
                    <Num>{ledger.beliefsRevised}</Num> calls later replaced
                  </>
                }
                sub="you changed your mind on evidence"
              />
            ) : null}
          </>
        ) : null
      }
    >
      {/* THE AUTONOMOUS PATH, VISIBLE, ON THE SURFACE A PERSON ACTUALLY READS.
          This mount existed only inside `errorComponent` above, so the crew
          line appeared on Learn exactly when the station had CRASHED and never
          when it was working — the one branch where an agent's sentence is
          least useful. Above the headline, as on Decide, Build, Ship, Design
          and Brain. Renders nothing unless an agent is genuinely mid-run. See
          use-live-agents.ts. */}
      <CrewWorking />
      <PageHead title={headline} sub={sub} />

      {/* The write this stage exists for. It owns its own reads, its own
          receipts and the queue it drains. It reports which workspace the bet
          in focus lives in, and everything below is drawn from that workspace;
          see the header. */}
      {/* FC-01: due forecasts come first, because a forecast is settled against
          a date the team set and a spec outcome is not. It is a SEPARATE group
          and never a synonym: a spec outcome asks whether shipping paid off, a
          forecast asks whether the belief was right, and one event answers those
          differently. It renders nothing when there is nothing to settle, and
          nothing when its reads fail, so it can never take this desk down. */}
      <ForecastDeskPanel />

      <SettlePanel onDeskWorkspace={rememberDeskWorkspace} />

      {/* WHAT SURVIVES A RELOAD. The panel's receipt stack is React state and
          is gone the moment the page reloads, and the paid-off block below
          cannot carry a fresh verdict at all: it is validated-only, ranked by
          score movement, and a bet with no linked opportunity never has any.
          So without this row the honest answer to "what did I just settle?"
          was a waiting count one lower. Ordered by when it was written, which
          is a fact every learning has. */}
      {lastSettled ? (
        <Block
          title="The last verdict on the record"
          // A different fact from the row, not a restatement of it (hard ban
          // 10): the row is one verdict, this is how much record it landed on
          // top of. Exact, because both numbers are now the same workspace.
          //
          // ONE WORD MUST NOT NAME TWO SETS ON ONE SCREEN (found 2026-08-10).
          // This read "N settled before it" off `outcomes.total`, while the
          // headline a few hundred pixels above defines settling narrowly and
          // deliberately: `decisive = validated + missed`, said as "3 of the 5
          // that settled paid off", precisely because an outcome can be real
          // and not have settled either way. With total 8 and decisive 5 the
          // page said five settled at the top and seven settled below, off one
          // fetch, on the one surface whose whole job is reporting whether the
          // product works.
          //
          // THE NOUN CHANGED RATHER THAN THE NUMBER, and not for the easier
          // life: `decisive - 1` would be the wrong count here. `lastSettled`
          // comes from listLearnings and its verdict may be `mixed`, which is
          // a real verdict on the record (see verdict-words.ts, three keys and
          // no fourth) and is NOT in `decisive`. Subtracting it from a set it
          // was never in would make this line wrong in exactly the cases it is
          // most needed. `total - 1` is the true count of what the record held
          // before this verdict, so it keeps its number and gets the noun that
          // fits it. Do not put "settled" back.
          sub={
            outcomes && outcomes.total > 1 ? (
              <>
                <Num>{outcomes.total - 1}</Num> on the record before it
              </>
            ) : null
          }
        >
          <Row
            tight
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
                  // Silent when nothing moved, rather than printing a zero over
                  // a bet that never had a score to move.
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
        </Block>
      ) : null}

      {/* The sub carries different information from the title, not a
          restatement: the ledger only ever writes up wins, so without this line
          the misses are invisible on the one surface that must not flatter. */}
      <Block
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
          <Failed onRetry={() => void ledgerQ.refetch()}>
            The record did not load. {(ledgerQ.error as Error).message}
          </Failed>
        ) : /* `isLoading` is `isPending && isFetching` in react-query v5, so it
              is false in the gap where a read is pending but not in flight:
              paused, offline, or the instant a fetch resolves. `data` is
              undefined there, this block fell through to "Nothing has come back
              yet", and on the station that IS the record that sentence is the
              worst available lie. `stillWaiting` closes the gap. The error
              branch stays first, and until 2026-08-11 it had to: the helper was
              `isPending || data === undefined`, a failed read also leaves `data`
              undefined, and this would have waited here forever instead of
              saying what broke. The helper now stands down on a failed read, so
              the order is kept on its own merits rather than out of need. Last of
              the two surfaces the budget in
              an-empty-read-is-not-an-empty-workspace.test.ts allowed; that
              constant reaches 0 in the same commit. */
        stillWaiting(ledgerQ) ? (
          <Loading>Reading the record.</Loading>
        ) : lead ? (
          <>
            <RecordRecess evidence={leadEvidence || null}>{lead.summary}</RecordRecess>
            {highlights.map((h, i) =>
              i === focusIdx ? null : (
                <Row
                  key={i}
                  tight
                  lead={h.summary}
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
          </>
        ) : (outcomes?.total ?? 0) === 0 ? (
          /* A GATE, NOT AN EMPTY LINE, and this was the only station of the seven
             that handed a new person nothing at all.

             Every read on this desk is count-gated, and correctly: the forecast
             desk draws nothing with no forecast due, the settle panel returns
             null with no rows, the notes row is gated on notes, and the
             take-it-with-you block is gated on a record existing. So a brand-new
             workspace got a headline and one paragraph with no button and no
             link, while Discover, Decide, Design and Brain all hand a new person
             a door. Learn is the station the moat rests on, and it was the one
             with no way forward.

             THE WORDS ARE THE ONES THE LOOP ALREADY USES for exactly this state.
             `STATION_NEEDS.learn` in src/lib/spine/correction.ts says what is
             missing, "something written down to grade the outcome against", and
             what fills it, "write down what this was meant to move before it can
             be graded". The correction loop says that sentence to an agent when a
             track reaches Learn with nothing to grade; there is no reason for the
             surface to invent a second wording of the same fact.

             TWO DOORS, ONE PRIMARY. Ship is the primary because it is the station
             immediately before this one and the place work becomes gradeable at
             all. Plan is the secondary, because a spec with nothing written down
             about what it was meant to move cannot be graded even after it ships,
             which is the failure this station sees most. */
          <Gate
            question="What should this grade first?"
            lines={[
              <span key="what">
                A verdict lands here the first time a shipped bet is graded against what its spec
                said it was for, and it stays on the record after that.
              </span>,
              <span key="need">
                Nothing has shipped yet, so there is nothing to grade. Write down what a bet is
                meant to move before it goes out, and the grade has something to measure against.
              </span>,
            ]}
          >
            <Button variant="primary" onClick={() => navigate({ to: "/ship" })}>
              See what is waiting to go out
            </Button>
            <Button onClick={() => navigate({ to: "/plan" })}>Open the specs</Button>
          </Gate>
        ) : (outcomes?.validated ?? 0) === 0 ? (
          <Empty>
            Nothing has paid off yet. <Num>{outcomes?.total}</Num> outcomes are on the record and
            none of them came back for you.
          </Empty>
        ) : (
          <Empty>
            Outcomes paid off, none of them written up. Add what happened the next time you record a
            verdict.
          </Empty>
        )}
      </Block>

      {/* Support notes belong to Discover, which triages them against open bets.
          One line and a door, not eight rows nobody can act on from here. It
          gets its own rule because it is a change of register, and no title
          because the line already says what it is. */}
      {outcome.isError ? (
        <Block>
          <Failed onRetry={() => void outcome.refetch()}>
            What came back from people did not load.
          </Failed>
        </Block>
      ) : loading ? (
        <Loading>Reading what else it learned.</Loading>
      ) : support.length > 0 ? (
        <Block>
          <Row
            tight
            lead={
              <>
                <Num>{support.length}</Num>{" "}
                {support.length === 1 ? "note came back" : "notes came back"} from people
              </>
            }
            sub="Read them on the signals desk, against the bets you have open"
            onClick={() => navigate({ to: "/discover", search: { tab: "signals" } })}
          />
        </Block>
      ) : null}

      {ledger && ledgerQ.data ? (
        <Block title="Take the record with you">
          <Field label="Name on the header">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              autoComplete="name"
            />
          </Field>
          <Actions>
            <Button onClick={() => void copyRecord()}>{tookIt ?? "Copy it"}</Button>
            <Button onClick={downloadRecord}>Download it</Button>
          </Actions>
        </Block>
      ) : null}
    </Surface>
  );
}
