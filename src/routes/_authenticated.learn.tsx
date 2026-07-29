/**
 * Learn. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the five answers. Pass
 * one ported it onto the primitives and deleted the second header; that work
 * stands. This pass decides what is allowed to be on it.
 *
 * 1. WHO IS HERE, AND WHY. A product lead who shipped a bet and has come back
 *    to find out whether it worked. Not to browse the loop's last stage: to
 *    read one verdict and leave believing something different.
 *
 * 2. THE ONE THING IT EXISTS FOR. To let the record contradict you. A bet
 *    shipped, the world answered, and the answer is on file with the number
 *    that settles it. Nothing else here earns its place unless it serves that,
 *    which is why the Record recess is the top of the page and the only lit
 *    thing on it.
 *
 * 3. KEEP / MOVE / KILL, on what pass one left standing:
 *    KEEP  the Record recess and the learnings list. This IS the surface. Made
 *          switchable: any learning can take the recess, so the surface stops
 *          choosing for you and every one of them can be read in full.
 *    KEEP  the headline. A count that is true or it is not drawn.
 *    KEEP  "Take the record with you". Brain's own pass moved ImpactLedgerPanel
 *          here and killed its copy, so this is now its only home. Reduced to
 *          one field and two buttons, and the field now does something: it was
 *          sent to the server on a query key that never carried it, so typing a
 *          name refetched nothing and never reached the document. The header is
 *          retitled on the client instead, which is all the server did with it.
 *    KEEP  two context facts, and only two: how far priority moved, and how
 *          many calls you later replaced. Neither appears anywhere else on the
 *          page and both are about learning rather than about volume.
 *    MOVE  "What came back from people" -> /discover, the signals desk. A
 *          support note is the INPUT to a learning, not a learning. The old
 *          empty state admitted it: "the crew reads them against the bets you
 *          have open", which is Discover's job. Eight dead rows here become one
 *          line with a count and a door.
 *    KILL  the "Should this go out?" gate. It was the biggest thing on a
 *          surface whose subject is the past, it decided nothing, it navigated
 *          away, and /ship owns announcements completely: draft, submit,
 *          approve, publish, off the same ["outcome"] read. Three surfaces
 *          half-doing one job.
 *    KILL  the "Announcements" block. What we told people is not what the world
 *          told us. /ship already draws it from the same query.
 *    KILL  "Priorities it changed". Its rows were opportunities where
 *          updated_at - created_at > 60s, which the server itself calls a
 *          proxy: it means somebody edited the row, not that an outcome moved
 *          the priority. It then showed the CURRENT score, not the shift, so
 *          the title claimed a causation the data never carried. On the one
 *          surface whose whole authority is that the record is true, that is
 *          the worst thing that can be on it. The honest version of the same
 *          fact is already here twice: the per-learning shift, and the net
 *          shift in the context column.
 *    KILL  the inline markdown dump behind "Read it". It re-rendered the page
 *          you are already looking at, in raw form, and was the single biggest
 *          contributor to the vertical scroll named twice as a pain point. Copy
 *          and Download deliver the same bytes.
 *    KILL  the "N calls on the record, X yours, Y from the crew" context row.
 *          The human-versus-crew split is a track record, and the export exists
 *          precisely to carry it out of the product.
 *    KILL  the "N outcomes recorded" context row. It restated the headline
 *          almost word for word (hard ban 10).
 *    KILL  the hand-styled input and the hand-styled <pre>, 32 lines of inline
 *          CSS between them. Field, Input and Actions exist.
 *
 * 4. ONE CLICK AWAY. Every learning that is not the one in focus. The support
 *    notes, on Discover. The announcements, on Ship. The full document, by Copy
 *    or Download rather than dumped on the page.
 *
 * 5. DELIGHT, AND CONFUSION. The moment is the record disagreeing with you:
 *    a bet you were sure of, and a number underneath it that says otherwise.
 *    "N calls you later replaced" is the other one, because nothing else in a
 *    product lead's working life ever counts the times they changed their mind
 *    on evidence.
 *    The confusion this surface shipped with: `highlights` is built only from
 *    POSITIVE verdicts, so a block titled "What it learned" silently showed
 *    wins and hid every miss. The title now says what it is, and the misses are
 *    counted out loud above the list instead of being quietly absent.
 *
 * VOICE: never greet, always report. The first line is a count that is true or
 * it is not drawn at all. Same server functions, same query keys ["outcome"]
 * and ["impact-ledger"], so the cache stays shared with Ship and Brain.
 */

import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { getOutcomeData } from "@/lib/outcome.functions";
import { getImpactLedger } from "@/lib/pm-impact.functions";
import {
  Actions,
  Block,
  Button,
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

  const ledger = ledgerQ.data?.ledger ?? null;
  const markdown = ledgerQ.data?.markdown ?? "";
  const outcomes = ledger?.outcomes ?? null;
  const support = outcome.data?.support ?? [];

  const highlights = ledger?.highlights ?? [];
  const focusIdx = highlights.length > 0 ? Math.min(focus, highlights.length - 1) : 0;
  const lead = highlights[focusIdx] ?? null;

  const loading = ledgerQ.isLoading || outcome.isLoading;

  // A fact, assembled from real counts. Never a number we do not have.
  const headline = React.useMemo(() => {
    if (ledgerQ.isLoading) return "Reading the record.";
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
  }, [ledgerQ.isLoading, outcomes]);

  const since = day(ledger?.span.firstAt ?? null);
  const movedPriority = (ledger?.measuredOutcomes ?? 0) > 0;
  const revisedBeliefs = (ledger?.beliefsRevised ?? 0) > 0;

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
            <div className="sp-ctx-head">What the record moved</div>
            {movedPriority ? (
              <div className="sp-ctx-row">
                <span>
                  <span className="sp-ctx-name">
                    Priority moved <Num>{signed(ledger.iceShiftTotal)}</Num>
                  </span>
                  <span className="sp-ctx-sub">
                    across <Num>{ledger.measuredOutcomes}</Num> measured outcomes
                  </span>
                </span>
              </div>
            ) : null}
            {revisedBeliefs ? (
              <div className="sp-ctx-row">
                <span>
                  <span className="sp-ctx-name">
                    <Num>{ledger.beliefsRevised}</Num> calls later replaced
                  </span>
                  <span className="sp-ctx-sub">you changed your mind on evidence</span>
                </span>
              </div>
            ) : null}
          </>
        ) : null
      }
    >
      <PageHead
        title={headline}
        sub={
          since ? (
            <>
              Since <Num>{since}</Num>
              {movedPriority ? (
                <>
                  {" · "}
                  <Num>{ledger?.measuredOutcomes}</Num> measured
                </>
              ) : null}
            </>
          ) : null
        }
      />

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
