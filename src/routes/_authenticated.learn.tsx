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
 * VOICE: never greet, always report. The first line is a count that is true or
 * it is not drawn at all. Query keys ["outcome"] and ["impact-ledger"] are
 * unchanged, so the cache stays shared with Ship and Brain.
 */

import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { getOutcomeData, listPendingOutcomes } from "@/lib/outcome.functions";
import { getImpactLedger } from "@/lib/pm-impact.functions";
import { SettlePanel } from "@/components/learn/SettlePanel";
import {
  Actions,
  Block,
  Button,
  CtxHead,
  CtxRow,
  Empty,
  Failed,
  Field,
  Input,
  Num,
  PageHead,
  Record as RecordRecess,
  Row,
  Surface,
} from "@/components/shell/primitives";
import { useSpineStrip } from "@/components/shell/use-spine-strip";

export const Route = createFileRoute("/_authenticated/learn")({
  component: Learn,
  head: () => ({ meta: [{ title: "Learn · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Learn] route crashed:", error);
    return (
      <Surface>
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

  // Same query keys the retired panels used, so the cache stays shared with
  // Ship and Brain rather than fetching the same rows twice.
  const outcome = useQuery({ queryKey: ["outcome"], queryFn: () => fOutcome() });
  // The name is NOT sent to the server. It only ever set the document's H1, and
  // the key here has never carried it, so typing a name refetched nothing and
  // the field silently did nothing at all. Titling the document on the client
  // makes the field work and keeps the key stable enough to share.
  const ledgerQ = useQuery({
    queryKey: ["impact-ledger"],
    queryFn: () => fLedger({ data: {} }),
  });
  // The same key SettlePanel reads, so the count in the headline and the queue
  // below it are one fetch and can never disagree.
  const pendingQ = useQuery({ queryKey: ["outcome-pending"], queryFn: () => fPending() });

  const ledger = ledgerQ.data?.ledger ?? null;
  const markdown = ledgerQ.data?.markdown ?? "";
  const outcomes = ledger?.outcomes ?? null;
  const support = outcome.data?.support ?? [];
  const waiting = pendingQ.data?.pending.length ?? 0;

  const highlights = ledger?.highlights ?? [];
  const focusIdx = highlights.length > 0 ? Math.min(focus, highlights.length - 1) : 0;
  const lead = highlights[focusIdx] ?? null;

  const loading = ledgerQ.isLoading || outcome.isLoading;

  // A fact, assembled from real counts. Never a number we do not have. What is
  // WAITING leads, because settling it is the job; what came back so far is a
  // different fact and goes in the sub.
  const headline = React.useMemo(() => {
    if (ledgerQ.isLoading || pendingQ.isLoading) return "Reading the record.";
    if (waiting > 0) {
      return waiting === 1
        ? "One shipped bet is waiting on your verdict."
        : `${waiting} shipped bets are waiting on your verdict.`;
    }
    if (!outcomes) return "The record is not readable right now.";
    if (outcomes.total === 0) return "No outcome has come back yet.";
    const back =
      outcomes.total === 1 ? "One outcome came back" : `${outcomes.total} outcomes came back`;
    const decisive = outcomes.validated + outcomes.missed;
    const verdict =
      decisive > 0
        ? `${outcomes.validated} of ${decisive} paid off.`
        : "None of them decisive yet.";
    return `${back}. ${verdict}`;
  }, [ledgerQ.isLoading, pendingQ.isLoading, waiting, outcomes]);

  const since = day(ledger?.span.firstAt ?? null);
  const movedPriority = (ledger?.measuredOutcomes ?? 0) > 0;
  const revisedBeliefs = (ledger?.beliefsRevised ?? 0) > 0;
  const decisive = outcomes ? outcomes.validated + outcomes.missed : 0;

  // The sub carries the OTHER fact, never a restatement of the title (hard ban
  // 10). With bets waiting, that is the record so far; with none waiting, it is
  // how far back the record goes.
  const sub: React.ReactNode =
    waiting > 0 && outcomes && decisive > 0 ? (
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
      <PageHead title={headline} sub={sub} />

      {/* The write this stage exists for. It owns its own reads, its own
          receipts and the queue it drains. */}
      <SettlePanel />

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
        ) : ledgerQ.isLoading ? null : lead ? (
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
          <Empty>
            Nothing has come back yet. A learning lands here the first time a shipped bet gets its
            verdict, and it stays on the record after that.
          </Empty>
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
      ) : loading ? null : support.length > 0 ? (
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
