import { useLayoutEffect, useRef, useState } from "react";

import { toolActionLabel } from "@/lib/agent-vocabulary";

import { formatDuration } from "@/components/studio/run-return";

/*
 * THE TOOL STREAM: work arriving, one row at a time, while it happens.
 *
 * ── WHY THIS EXISTS, AND WHY `ToolChips` COULD NOT BE IT ─────────────────
 * `ToolChips` takes a FINISHED ARRAY. It is a good component and it answers a
 * different question: what did this run call. Its rows all share one state, so
 * its left slot is free to draw what KIND of call each was, and its header
 * prints a count that is only true once the run has stopped changing it.
 *
 * Nothing in this system showed work ARRIVING. That is the single largest hole
 * in "you can see agents working", which is the product's own stated core, and
 * the frame that feeds this already exists: `ask-sse.ts` declares
 * `{ kind: "tool", tool: string }`, the client parses it, and nothing emits it
 * yet (K-15). This component is written against that frame's real shape rather
 * than against a shape convenient for it, so wiring it is a mount and not an
 * adapter.
 *
 * ── THE LEFT SLOT CARRIES STATE HERE, NOT KIND ──────────────────────────
 * The one deliberate difference from `ToolChips`, and it is not drift. In a
 * finished list every row is settled, so the state is not worth a column. In a
 * live stream the state is the ENTIRE REASON somebody is looking: which of
 * these is happening right now, and did the one before it come back. So the
 * marker is the state, and `kind` is not a prop at all rather than an unused
 * one.
 *
 * Everything a reader could notice is the same as `ToolChips` on purpose: the
 * 28px row, 12.5px label over an 11.5px mono argument, the inert argument, the
 * same two empty-state sentences word for word, and the same inset focus
 * treatment. The two components must read as one vocabulary.
 *
 * ── THE LABEL NAMES THE OUTCOME, NOT THE MECHANISM ──────────────────────
 * A row takes the registry NAME (`prd.draft`) and resolves it through
 * `toolActionLabel`, which is the one place in this repo that turns a tool into
 * "drafting a spec". Engine-Room doctrine: the user meets the output of the
 * machine, never the machine. A caller may override with `label`, and should
 * almost never need to; a row whose tool is unknown to the vocabulary falls back
 * to the raw name, which is honest and visibly ugly, and being visibly ugly is
 * how a missing entry gets noticed rather than shipped.
 *
 * ── PIN TO BOTTOM, AND NEVER FIGHT THE READER ───────────────────────────
 * The default is to follow the newest row. The moment somebody scrolls up they
 * are reading something, and taking the viewport back off them is the behaviour
 * every log with this feature is hated for. So scrolling up unpins, the view
 * stays exactly where they left it however many rows arrive, and the arrivals
 * are counted and offered rather than forced.
 */

/** Three, because a live call is either happening, back, or broken. */
export type ToolStreamState = "running" | "done" | "failed";

export type ToolStreamRow = {
  /** Stable across renders. Two calls can share a tool, so this is not it. */
  id: string;
  /** The registry name, exactly as the SSE `tool` frame carries it. */
  tool: string;
  state: ToolStreamState;
  /** Overrides the derived caption. Prefer letting the tool name itself. */
  label?: string;
  /** What it was called with: a path, a query, a command. Inert by design. */
  argument?: string;
  /** How long the call took. Settled rows only; omit rather than estimate. */
  durationMs?: number;
  /** What broke, in a sentence. Failed rows only. */
  error?: string;
};

/** Status hue, from the five words. A running call is a machine working. */
const HUE: Record<ToolStreamState, string> = {
  running: "text-mrd-agent",
  done: "text-mrd-mute",
  failed: "text-mrd-fail",
};

/**
 * The state, as a word, for the accessible name and for greyscale.
 *
 * A hue alone fails two readers at once: the person who cannot separate azure
 * from red, and the person listening rather than looking. `done` says nothing,
 * because most rows of a healthy run are done and a column of the word is noise.
 */
const STATE_WORD: Record<ToolStreamState, string> = {
  running: "running",
  done: "",
  failed: "failed",
};

const FOCUS_INSET =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

/**
 * The state marker. 16px in all three states so a row does not reflow when a
 * call comes back, which is the whole reason this is a fixed box rather than
 * three glyphs that happen to be about that size.
 *
 * ONLY `running` MOVES, and the animation is declared INLINE rather than as a
 * utility. meridian.css's reduced-motion block matches on the style attribute,
 * so an animation in a class would keep spinning for somebody who asked it not
 * to. A settled call has nothing left to wait for and must be still: a spinner
 * on a finished row is the same lie as a progress bar on a coding agent.
 */
function Marker({ state }: { state: ToolStreamState }) {
  if (state === "running") {
    return (
      <span
        aria-hidden
        className="size-3 shrink-0 rounded-full border-[1.5px] border-mrd-edge border-t-mrd-agent"
        style={{ animation: "mrd-spin 700ms linear infinite" }}
      />
    );
  }

  return (
    <svg
      aria-hidden
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={state === "failed" ? 2.6 : 2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${HUE[state]}`}
    >
      {state === "failed" ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M20 6L9 17l-5-5" />}
    </svg>
  );
}

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
  /** The accessible name of the log. */
  label?: string;
  /** Where the column starts scrolling. */
  maxHeight?: number;
  /** Omit and rows are plain facts with no pointer and no tab stop. */
  onSelectRow?: (row: ToolStreamRow, index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * Pinned means "following the newest row". It starts true, because arriving at
   * a live stream and being shown the oldest call is the wrong end of it.
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
   * `ToolChips` animates every row on every render, which is correct for a
   * block that appears whole and wrong here in two ways: reopening a surface on
   * a run with 400 calls would play 400 entrances at once, and it costs a
   * compositor layer per row on exactly the case the acceptance criteria name.
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
   * THE ZERO CASE, in `ToolChips`' own words. Two components saying the same
   * thing differently is how a reader learns they are two different systems.
   *
   * `data-mrd` on the early return as well: this is exactly how a component
   * loses the attribute, because the eye reads the main return as the root and
   * stops, and without it the box falls back to the legacy focus ring.
   */
  if (rows.length === 0) {
    return (
      <div data-mrd="" className="w-full max-w-80 font-mrd">
        <p className="text-[12.5px] text-mrd-mute">
          {working ? "Nothing called yet." : "This run called no tools."}
        </p>
      </div>
    );
  }

  return (
    <div data-mrd="" className="relative flex w-full max-w-80 flex-col font-mrd">
      {/*
       * `role="log"` rather than a bare `aria-live` region, and the difference
       * matters on this component specifically: a log announces ADDITIONS only,
       * so a stream that reaches 500 rows does not read the whole column out
       * every time one arrives.
       */}
      <div
        ref={scrollRef}
        role="log"
        aria-label={label}
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          /* 2px of tolerance, because fractional layout puts `scrollTop` at the
             true bottom a hair under the arithmetic and an exact comparison
             would unpin a reader who never scrolled. */
          setPinned(el.scrollHeight - el.scrollTop - el.clientHeight <= 2);
        }}
        className="min-h-0 overflow-y-auto"
        style={{ maxHeight }}
      >
        {/* Nothing in a row may be wider than the row, so 500 of them cannot
            push the page sideways. The argument breaks rather than truncates:
            half a path is worse than a wrapped one. */}
        <ol className="flex flex-col gap-1">
          {rows.map((row, i) => {
            const caption = row.label ?? toolActionLabel(row.tool) ?? row.tool;
            const took = row.durationMs === undefined ? null : formatDuration(row.durationMs);
            const word = STATE_WORD[row.state];
            const arrived = i >= settledAtMount.current;

            const body = (
              <>
                <Marker state={row.state} />
                <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                  <span className="text-[12.5px] font-medium text-mrd-ink">{caption}</span>
                  {row.argument ? (
                    <span className="min-w-0 font-mrd-mono text-[11.5px] break-all text-mrd-mute">
                      {row.argument}
                    </span>
                  ) : null}
                  {word ? <span className={`text-[11px] ${HUE[row.state]}`}>{word}</span> : null}
                  {took ? (
                    <span className="font-mrd-mono text-[11px] text-mrd-faint tabular-nums">
                      {took}
                    </span>
                  ) : null}
                  {/* A failed call says what broke, on its own line, because a
                      reason that has to fit beside a filename is a reason
                      nobody wrote honestly. */}
                  {row.state === "failed" && row.error ? (
                    <span className="w-full text-[11.5px] leading-relaxed text-mrd-body">
                      {row.error}
                    </span>
                  ) : null}
                </span>
              </>
            );

            const shape = "flex min-h-7 w-full items-start gap-2 rounded-mrd-ctl px-[3px] py-1";
            const enter = arrived
              ? { animation: "mrd-fade-up 300ms var(--mrd-ease) both" }
              : undefined;

            if (!onSelectRow) {
              return (
                <li key={row.id} className={shape} style={enter}>
                  {body}
                </li>
              );
            }

            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onSelectRow(row, i)}
                  className={`${shape} ${FOCUS_INSET} text-left transition-colors duration-100 hover:bg-mrd-hover`}
                  style={enter}
                >
                  {body}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/*
       * THE WAY BACK, drawn only when the reader has actually left the bottom.
       * It names how many arrived rather than saying "new items", because the
       * count is the thing that decides whether they want to go back yet.
       */}
      {!pinned ? (
        <button
          type="button"
          onClick={jump}
          data-mrd=""
          className="mt-mrd-3 flex w-fit items-center gap-1.5 self-center rounded-mrd-ctl bg-mrd-lift px-2 py-1 text-[11.5px] font-medium text-mrd-ink transition-colors duration-100 hover:bg-mrd-lift-hover"
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
