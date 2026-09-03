import { useLayoutEffect, useRef, useState } from "react";

import { toolActionLabel } from "@/lib/agent-vocabulary";

import { StatusChip } from "./StatusChip";
import {
  RUN_LINE,
  RUN_ROW,
  RUN_STACK,
  RunClock,
  RunGlyph,
  RunNote,
  RunRail,
  RunSubject,
  RunTook,
  runGlyphForTool,
} from "./run-rows";

/*
 * THE TOOL STREAM: work arriving, one row at a time, while it happens.
 *
 * ── WHY THIS EXISTS: A FINISHED ARRAY CANNOT BE A STREAM ─────────────────
 * The obvious way to show what an agent called is to wait for the run and then
 * render the list. That answers a real question, what did this run call, and it
 * is a different question from the one a person watching a run has, which is
 * what is it doing right now. A component built on a finished array cannot be
 * retrofitted into the second one, and the first three reasons below are
 * structural rather than a matter of effort:
 *
 *   a. ITS ROWS SHARE ONE STATE. If the array is settled then every row in it
 *      is settled, so there is nowhere to put "this call is still out". Here
 *      state is per row (`ToolStreamState`), because at any instant one row is
 *      running and the ones above it are not.
 *   b. ITS HEADER COUNTS. A total taken from a run that has not stopped
 *      changing it is wrong by the time it is read, so the honest rendering of
 *      that header on a live run is a shimmer over a number nobody should
 *      trust. This component prints no total at all.
 *   c. IT HAS NO CLOCK, because a finished list has no arrival instants to
 *      show. `at` is REQUIRED here. On the SSE feed the frame does not carry
 *      it, so the client stamps arrival, which is the only honest instant a
 *      stream has; on the mission poll the row carries a recorded one and that
 *      wins. See `at` on `ToolStreamRow` for why the two differ.
 *   d. AND ONE THAT IS A HABIT RATHER THAN A CONSEQUENCE, listed because it is
 *      the one that gets copied: a block that appears whole animates every row
 *      on every render, which is right for it and wrong for a column that
 *      grows. See `settledAtMount`.
 *
 * Nothing in this system showed work ARRIVING. That is the largest hole in "you
 * can see agents working", which is the product's own stated core, and the frame
 * that feeds it already exists: `ask-sse.ts` declares `{ kind: "tool", tool:
 * string }`, the client parses it, and IT IS NOW EMITTED -- from the research
 * phase map at `chat.ts:1306` since 2026-08-20, and from the chat branch's
 * workspace search since 2026-08-22. What is still true is narrower and it is
 * the part that blocks this component: a tool frame for MISSION work can never
 * arrive on that stream, because the handler enqueues `landing`, `meta` and
 * `[DONE]` and closes the controller before the mission runs. This component is
 * written against that frame's real shape, so wiring it is a mount and not an
 * adapter.
 *
 * ── AND IT IS MOUNTED NOW, ON A POLL RATHER THAN ON THAT STREAM ─────────
 * Since 2026-08-22 the mission half has a real caller: `/runs/$missionId`
 * renders this while a run is LIVE, fed by `getStudioSession`'s `toolCalls`
 * (studio.functions.ts) on the 4s poll that surface already runs. The SSE
 * argument above is not stale — it is precisely WHY the feed is a poll. A
 * mission's tool calls can never reach the ask stream, so the transport that
 * can see them is the one already asking the database every four seconds.
 *
 * What that source gives and what it costs: rows come from `public.tool_calls`
 * joined mission -> agent_runs -> latest checkpoint -> state.traceId ->
 * trace_id, which is the only join that table has. Those runs are filtered to
 * `agent_slug='builder'`, so an orchestrator goal-run resolves to no traces and
 * the route does not mount this at all there rather than show it empty. And a
 * row is written only after its call returns, which is where `running` goes
 * (see `ToolStreamState`).
 *
 * ── THE ALTERNATIVE WAS BUILT, CONSIDERED, AND DELETED ──────────────────
 * Two Meridian components used to sit beside this one in the gallery: a chips
 * block that took exactly the finished array described above, and an answer
 * block that revealed prose one character at a time. Both were faithful ports
 * of a reference pattern, both were correct, and neither ever had a product
 * caller. They were DELETED on 2026-08-21 by founder ruling. The argument sits
 * here rather than only in a log because the next person who wants either one
 * will be standing in this file.
 *
 * THE CHIPS BLOCK was a fourth view of a run where three had just been unified.
 * `PlanCard`, `RunTimeline` and this component shipped as three products, three
 * mark sizes and three gutters, and were pulled onto `run-rows.tsx` for it;
 * `one-run-one-rhythm.test.tsx` fails the build if they drift apart again. The
 * chips block was not on those primitives, it was a 320px column with its own
 * row height and its own four-icon tool vocabulary, and the run route already
 * renders every tool call in its steps ledger. That ledger carries no ratchet
 * debt, so it is current work rather than something waiting to be replaced.
 * Mounting the chips block would have put one fact on screen twice, in two
 * rhythms, on a surface that already answered it.
 *
 * THE ANSWER BLOCK failed on the half only production could answer, and this is
 * the measurement worth carrying forward: its `sources` input had NO DATA
 * SOURCE ANYWHERE IN THE PRODUCT. Measured across the whole database, 0 of 90
 * `prds` carry citations and the run record has no citation column at all.
 * `ai_evals.citations` is populated, but it holds a JUDGE's citations about an
 * evaluation, which is a different object from an agent's answer sources. So
 * "mount it later, when citations exist" was never an option that was waiting;
 * it was an input with nowhere to come from. On top of that, the one surface in
 * this product with real token streaming has refused a per-word reveal in
 * writing: the Ask pane patches `content` on the same message, so the
 * half-written answer and the finished one are the same JSX and cannot render
 * differently (`AskTurn.tsx`).
 *
 * WHAT TO TAKE FROM IT. A component with no home is not a defect you fix by
 * finding it one. Before adding a second way to show a run alongside these
 * rows, say which question it answers that the rows do not, and say where its
 * inputs come from in production rather than in a fixture.
 *
 * ── THE RHYTHM IS NOT THIS FILE'S TO CHOOSE ─────────────────────────────
 * Columns, gutter, glyph size and type stops all come from `run-rows.tsx`. That
 * is a correction: the first version of this component picked its own 8px gutter
 * and had no clock column at all, so it and `RunTimeline` were two renderings of
 * the same run in two different rhythms.
 *
 * ── THE MARK IS DERIVED FROM THE TOOL, NOT PASSED IN ────────────────────
 * A pull request wears the source host's mark, a web fetch a globe, our own
 * checks a clipboard. `runGlyphForTool` reads that off the tool's namespace, so
 * two surfaces cannot disagree about what `github.pr.open` looks like and no
 * caller has to know. The row that used to draw `[]` for every call is gone.
 *
 * ── THE CAPTION NAMES THE OUTCOME, NOT THE MECHANISM ────────────────────
 * A row takes the registry NAME (`prd.draft`) and resolves it through
 * `toolActionLabel`, the one place in this repo that turns a tool into "drafting
 * a spec". A tool the vocabulary has never heard of falls back to the raw name,
 * which is honest and visibly ugly, and being visibly ugly is how a missing
 * entry gets noticed rather than shipped.
 *
 * ── PIN TO BOTTOM, AND NEVER FIGHT THE READER ───────────────────────────
 * The default is to follow the newest row. The moment somebody scrolls up they
 * are reading something, and taking the viewport back off them is the behaviour
 * every log with this feature is hated for. So scrolling up unpins, the view
 * stays exactly where they left it however many rows arrive, and the arrivals are
 * counted and offered rather than forced.
 */

/**
 * Three, because a live call is either happening, back, or broken.
 *
 * "running" HAS NO WRITER IN THIS PRODUCT, and a caller must not invent one.
 * The loop measures `Date.now() - t0` at loop.server.ts:1661 and inserts the
 * `tool_calls` row at :1690 (ok) or :1732 (failed), both after the tool has
 * returned; the checkpoint that could otherwise witness an in-flight call is
 * written BEFORE the provider call (:1201). So no table records "this call is
 * out". The state is reachable only from a transport that sees the call being
 * ISSUED, which today is the ask stream and not the mission poll.
 *
 * A QUEUED CALL IS NOT ONE OF THESE THREE EITHER. `LoopStep` carries
 * `status: "executed" | "queued" | "error" | "denied"` (loop.server.ts:239) and
 * a queued call is blocked on a person, not executing — mapping it to "running"
 * would say the machine is busy when it is waiting on you, and mapping it to
 * "failed" would say it broke. The run route's Gate already carries that fact.
 */
export type ToolStreamState = "running" | "done" | "failed";

export type ToolStreamRow = {
  /** Stable across renders. Two calls can share a tool, so this is not it. */
  id: string;
  /** The registry name, exactly as the SSE `tool` frame carries it. */
  tool: string;
  /**
   * When this call came back, ms since epoch.
   *
   * REQUIRED, and it is not optional, because a clock column present on some
   * rows and absent on others is the same component in two rhythms.
   *
   * TWO REAL SOURCES, AND THE RECORDED ONE WINS WHERE IT EXISTS. On the ask
   * stream the SSE frame carries no instant, so the client stamps arrival, and
   * that is the only honest instant a stream has. On the run surface the source
   * is `tool_calls.created_at` — the instant the call RETURNED and the row was
   * written. That is not the same as the instant it was issued, and the
   * difference is deliberately not reconstructed: subtracting `latency_ms` to
   * fake a start would be inventing a measurement. It is also invisible at the
   * rendered resolution, since `RunClock` prints HH:MM and the calls in the
   * table run 27ms to 3.5s. A client stamp is WRONG there: reopening a settled
   * run would bunch every row into the instant the page loaded.
   */
  at: number;
  state: ToolStreamState;
  /** Overrides the derived caption. Prefer letting the tool name itself. */
  label?: string;
  /** What it was called with: a path, a query, a command. Inert by design. */
  argument?: string;
  /**
   * How long the call took. Settled rows only; omit rather than estimate.
   *
   * On the run surface this is `tool_calls.latency_ms`, which the loop derives
   * from `Date.now() - t0`. A 0 there means the call came back inside the
   * clock's resolution, NOT that it was instant, so 0 draws nothing — see
   * `callTook`.
   */
  durationMs?: number;
  /** What broke, in a sentence. Failed rows only. */
  error?: string;
};

/**
 * How long ONE CALL took, at the resolution a tool call actually runs at.
 *
 * THE CORRECTION, and it was found by the data rather than by review. This
 * component used `formatDuration` (studio/run-return.ts:65-74), which floors to
 * whole seconds because it was written for "worked for 18m 06s" on a settled
 * run. A single tool call is three orders of magnitude smaller. Measured
 * 2026-08-22 20:30:16 UTC against the two newest traces the run surface now
 * reads — `select array_agg(latency_ms order by created_at), count(*) filter
 * (where latency_ms < 1000), count(*) from public.tool_calls where trace_id in
 * ('5a37e139-f7e6-4674-898c-2a4455f299cd','614bd26d-a98a-4353-9320-ff31f217927e')`
 * -> {68,27,82,386,536,1139,3531}, 5, 7 — FIVE OF THOSE SEVEN would have
 * rendered as a confident "0s". A stream whose job is to be the proof of what
 * an agent did cannot print zero for a call it timed at 386ms.
 *
 * NOT A FOURTH COPY OF A DURATION FORMATTER, and the distinction is the
 * quantity rather than the code. `formatDuration` takes a finished RUN SPAN;
 * `formatElapsed` (run-rows.tsx:479) takes a LIVE TICK in tenths; this takes a
 * SINGLE CALL'S LATENCY. The product already made this exact split once and
 * this follows it rather than inventing a rule: `/traces/$traceId`, the one
 * other surface that renders `tool_calls.latency_ms` per call, formats it
 * ms-under-a-second and to two decimals above (traces.$traceId.tsx:206-210), so
 * the two places that show a tool's latency now agree on what it looks like.
 */
function callTook(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

const FOCUS_INSET =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

export function ToolStream({
  rows,
  working = false,
  label = "What the agent is calling",
  maxHeight = 280,
  onSelectRow,
}: {
  /** In arrival order, oldest first. Empty is a first class case. */
  rows: ToolStreamRow[];
  /**
   * True while the run is still going. It changes only the empty sentence: a run
   * that has called nothing YET and a run that called nothing AT ALL are two
   * different facts and the reader has no other way to tell them apart.
   */
  working?: boolean;
  label?: string;
  maxHeight?: number;
  /** Omit and rows are plain facts with no pointer and no tab stop. */
  onSelectRow?: (row: ToolStreamRow, index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * Pinned means "following the newest row". It starts true, because arriving at a
   * live stream and being shown the oldest call is the wrong end of it.
   */
  const [pinned, setPinned] = useState(true);
  const [unseen, setUnseen] = useState(0);

  /*
   * How many rows the reader had when they scrolled away. Held in a ref rather
   * than in state because writing it must not itself cause a render: it is
   * updated inside the same layout effect that does the scrolling.
   */
  const seen = useRef(rows.length);

  /*
   * ROWS PRESENT AT MOUNT DO NOT ANIMATE. Only arrivals do.
   *
   * Animating every row on every render is correct for a block that appears
   * whole, and wrong here in two ways: reopening a surface on a run with 400
   * calls would play 400 entrances at once, and it costs a compositor layer per
   * row on exactly the case the acceptance criteria name.
   */
  const settledAtMount = useRef(rows.length);

  /*
   * LAYOUT effect, not a plain one: the scroll has to land before the browser
   * paints, or a new row is visible at the old scroll position for one frame and
   * the column appears to jump backwards as it grows.
   */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (pinned) {
      el.scrollTop = el.scrollHeight;
      seen.current = rows.length;
      setUnseen(0);
      return;
    }

    /*
     * NOTHING TOUCHES `scrollTop` ON THIS BRANCH, and that is the acceptance
     * criterion. The reader is holding a position; the arrivals are counted and
     * offered instead.
     */
    setUnseen(Math.max(0, rows.length - seen.current));
  }, [rows.length, pinned]);

  const jump = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setPinned(true);
  };

  /*
   * THE ZERO CASE, AND IT IS TWO CASES. A run that has called nothing YET and a
   * run that called nothing AT ALL are different facts, and the reader has no
   * other way to tell them apart. These two sentences were written for the chips
   * block deleted on 2026-08-21 and were kept verbatim when it went, so a reader
   * who had already learnt the wording did not have to learn it twice.
   *
   * `data-mrd` on the early return as well: this is exactly how a component loses
   * the attribute, because the eye reads the main return as the root and stops.
   */
  if (rows.length === 0) {
    return (
      <div data-mrd="" className="w-full max-w-[520px] font-mrd">
        <p className="text-mrd-label text-mrd-mute">
          {working ? "Nothing called yet." : "This run called no tools."}
        </p>
      </div>
    );
  }

  return (
    <div data-mrd="" className="relative flex w-full max-w-[520px] flex-col font-mrd">
      {/*
       * `role="log"` rather than a bare `aria-live` region, and the difference
       * matters on this component specifically: a log announces ADDITIONS only, so
       * a stream that reaches 500 rows does not read the whole column out every
       * time one arrives.
       */}
      <div
        ref={scrollRef}
        role="log"
        aria-label={label}
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          /* 2px of tolerance, because fractional layout puts `scrollTop` at the
             true bottom a hair under the arithmetic and an exact comparison would
             unpin a reader who never scrolled. */
          setPinned(el.scrollHeight - el.scrollTop - el.clientHeight <= 2);
        }}
        className="min-h-0 overflow-y-auto"
        style={{ maxHeight }}
      >
        <ol className={RUN_STACK}>
          {rows.map((row, i) => {
            const caption = row.label ?? toolActionLabel(row.tool) ?? row.tool;
            /* `> 0` rather than `>= 0`, and it is not defensive noise: the loop
               measures with `Date.now() - t0` (loop.server.ts:1661), so a 0 is
               "under the clock's resolution" and not a call that took no time.
               Rendering "0ms" would turn the absence of a measurement into
               one. */
            const took =
              row.durationMs === undefined || row.durationMs <= 0 ? null : callTook(row.durationMs);
            const arrived = i >= settledAtMount.current;

            const body = (
              <>
                <RunClock at={row.at} />

                {/*
                 * THE RAIL, WHICH THIS COMPONENT DID NOT HAVE.
                 *
                 * Founder review 2026-08-20: nothing connects one row to the next.
                 * `RunTimeline` had a rail and this had none, so two views of one
                 * run read as a sequence and a list. Same wrapper, same `RunRail`,
                 * stopped on the last row, because a line continuing past the last
                 * call is a claim another one is coming.
                 *
                 * `last` is the last row of the STREAM, not of the render pass: a
                 * running stream's newest row is still the end of what is known.
                 */}
                <span className="flex flex-col items-center self-stretch">
                  <RunGlyph kind={runGlyphForTool(row.tool)} />
                  {i === rows.length - 1 ? null : <RunRail />}
                </span>

                <span className="min-w-0 pb-1">
                  <span className={RUN_LINE}>
                    <RunSubject>{caption}</RunSubject>
                    {/*
                     * A chip only where there is something to say. `done` gets
                     * none, for the same reason the timeline gives it none: most
                     * rows of a healthy run are done, and a column of chips
                     * saying so buries the one row that is not.
                     */}
                    {row.state === "running" ? (
                      <StatusChip status="agent" pulse>
                        Running
                      </StatusChip>
                    ) : null}
                    {row.state === "failed" ? <StatusChip status="fail">Failed</StatusChip> : null}
                    {took ? <RunTook>{took}</RunTook> : null}
                  </span>

                  {/* The argument breaks rather than truncates: half a path is
                      worse than a wrapped one, and it is the second line so a
                      long one cannot widen the row. */}
                  {row.argument ? (
                    <span className="mt-0.5 block font-mrd-mono text-mrd-data break-all text-mrd-mute">
                      {row.argument}
                    </span>
                  ) : null}

                  {row.state === "failed" && row.error ? <RunNote>{row.error}</RunNote> : null}
                </span>
              </>
            );

            const enter = arrived
              ? { animation: "mrd-fade-up 300ms var(--mrd-ease) both" }
              : undefined;

            if (!onSelectRow) {
              return (
                <li key={row.id} className={RUN_ROW} style={enter}>
                  {body}
                </li>
              );
            }

            return (
              <li key={row.id} style={enter}>
                <button
                  type="button"
                  onClick={() => onSelectRow(row, i)}
                  className={`${RUN_ROW} ${FOCUS_INSET} w-full rounded-mrd-chip text-left transition-colors duration-[var(--mrd-d-press)] hover:bg-mrd-hover`}
                >
                  {body}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/*
       * THE WAY BACK, drawn only when the reader has actually left the bottom. It
       * names how many arrived rather than saying "new items", because the count
       * is the thing that decides whether they want to go back yet.
       */}
      {!pinned ? (
        <button
          type="button"
          onClick={jump}
          data-mrd=""
          className="mt-mrd-3 flex w-fit items-center gap-1.5 self-center rounded-mrd-ctl bg-mrd-lift px-2 py-1 text-mrd-data font-medium text-mrd-ink transition-colors duration-[var(--mrd-d-press)] hover:bg-mrd-lift-hover"
        >
          <svg
            aria-hidden
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
          {unseen > 0 ? (
            <span>
              <span className="tabular-nums">{unseen}</span>
              {unseen === 1 ? " more call" : " more calls"}
            </span>
          ) : (
            <span>Back to the newest</span>
          )}
        </button>
      ) : null}
    </div>
  );
}

export default ToolStream;
