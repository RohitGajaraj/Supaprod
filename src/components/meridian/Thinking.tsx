import { useLayoutEffect, useRef, useState } from "react";

/*
 * THINKING, the expandable trace of what an agent did on the way to an answer.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Thinking"
 *                 (their file: components/ThinkingState.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * `traces.$traceId` is the rawest file in the app, roughly one primitive per
 * bare div, and the step list on `runs.$missionId` is the same shape drawn a
 * second time by hand. Both answer "what did it do" with a flat list that can
 * never be folded away, so a reader who wants only the conclusion scrolls past
 * the work every single time. A trace that opens while the agent runs and
 * settles shut when it finishes puts the detail one keystroke away, and out of
 * the way the rest of the time.
 *
 * ── THE FOUR VARIANTS ───────────────────────────────────────────────────
 *   Steps      a checklist. Only the last row carries the spinner, the rest
 *              carry checks, so "where it is now" is one glance and not a read.
 *   Reasoning  prose. Rows wrap instead of truncating, because half a sentence
 *              of reasoning is worse than no sentence.
 *   Search     the sources it read, each one a real link out.
 *   Coding     tool calls: what was read, what was edited, what was run.
 *
 * ── WHAT WE CHANGED, AND WHY ────────────────────────────────────────────
 * Their demo drives itself from a fixed five stage clock and carries its own
 * row content. Production has neither: the caller knows whether the agent is
 * still going, and the caller owns the rows. So `working` and `rows` are props
 * and the reveal follows real arrivals. The stagger is the one place where that
 * substitution is not free, and the comment on it says why.
 *
 * Their search trace tints its source dots three colours in rotation. Meridian
 * has no three categorical hues, and more to the point those dots carry no
 * fact: nothing about the third source differs from the first. Here they are
 * one neutral glyph. `--mrd-agent` is spent only where it means something, on
 * the two marks that say a machine is working right now, the header glyph and
 * the spinner. Green and red appear on edit counts alone, which is the outcome
 * register: they report what happened to a file, never that you must act.
 *
 * Nothing here asks for a person, so `--mrd-you` appears nowhere in this file.
 * A trace is a report on work already done; the call it leads to belongs to
 * whatever sits beside it.
 */

export type ThinkingVariant = "Steps" | "Reasoning" | "Search" | "Coding";

export type ThinkingRow = {
  /** The row's subject: a step, a sentence of reasoning, a source, a tool. */
  primary: string;
  /** The qualifier that sits to its right: a count, a domain, a filename. */
  secondary?: string;
  /** Render `secondary` in mono. True for anything a machine would type. */
  mono?: boolean;
  /** Lines added and removed by an edit. Each renders independently. */
  add?: number;
  del?: number;
  /** Makes the row a link out. Search rows only. */
  href?: string;
};

const ACTIVE_LABEL: Record<ThinkingVariant, string> = {
  Steps: "Thinking",
  Reasoning: "Thinking",
  Search: "Searching the web",
  Coding: "Running tools",
};

/*
 * The settled label quotes a real number where we hold one and stays silent
 * where we do not. Their demo hardcodes "Thought for 4 seconds" and "Ran 3
 * tools"; a port that keeps those strings is stating a duration it never
 * measured, on a surface whose entire job is to be checkable.
 */
function settledLabel(variant: ThinkingVariant, rowCount: number, durationMs?: number) {
  if (variant === "Coding") {
    if (rowCount === 0) return "Ran no tools";
    return rowCount === 1 ? "Ran 1 tool" : `Ran ${rowCount} tools`;
  }
  if (variant === "Search") return "Searched the web";
  if (durationMs === undefined) return "Finished thinking";
  const s = Math.round(durationMs / 1000);
  return s <= 1 ? "Thought for a second" : `Thought for ${s} seconds`;
}

/*
 * The zero case is the case. Production holds one forecast against 296
 * decisions and zero rows of agent memory of kind outcome, so a trace with
 * nothing in it is what most readers will meet first. It gets a sentence
 * rather than a blank box, and the sentence never implies a failure: a run
 * that genuinely took no steps is a fact, not an error, and a read that
 * failed must say so in its own words somewhere else.
 */
const ZERO_LINE: Record<ThinkingVariant, string> = {
  Steps: "This run reported no steps.",
  Reasoning: "This run reported no reasoning.",
  Search: "No sources were read.",
  Coding: "No tools were called.",
};

/*
 * Every interactive row in this component sits inside the trace's own
 * overflow-hidden box and runs flush to its right edge, so the system's default
 * OUTSET ring is sheared off there and reads as a broken border rather than as
 * focus. The inset variant is what meridian.css keeps for exactly this case: a
 * control whose container clips. The explicit utilities restate what the
 * `[data-mrd]` rule already says, so the treatment survives if this component is
 * ever dropped onto a surface that rule has not reached.
 */
const FOCUS_INSET =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

/** A source the agent read. One neutral glyph, see the note in the header. */
function SourceGlyph() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--mrd-mute)"
      strokeWidth="1.8"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--mrd-mute)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/*
 * 700ms is fast for a spinner and that is deliberate: this one sits on the row
 * that is executing, inches from static rows, and at a slower rate the two read
 * as the same object. The lit arc is the agent hue, so the one moving thing on
 * the surface is also the one thing saying a machine holds this.
 */
function SpinnerGlyph() {
  return (
    <span
      aria-hidden
      className="size-3 shrink-0 rounded-full border-[1.5px] border-mrd-edge border-t-mrd-agent"
      style={{ animation: "mrd-spin 700ms linear infinite" }}
    />
  );
}

export function Thinking({
  variant = "Steps",
  rows = [],
  query,
  working = false,
  durationMs,
  label,
  summary,
  moreCount = 0,
  minHeight = 176,
  onSelectRow,
}: {
  variant?: ThinkingVariant;
  /** What the agent did, in order. Empty is a first class case. */
  rows?: ThinkingRow[];
  /** The search string. Search variant only. */
  query?: string;
  /** True while the agent is still going. Drives the glyph, the shimmer, the spinner and the auto open. */
  working?: boolean;
  /** How long the work took. Omit and the settled label stays number free. */
  durationMs?: number;
  /** Overrides the working label. */
  label?: string;
  /** Overrides the settled label. */
  summary?: string;
  /** Sources read beyond the ones listed. Search variant only. */
  moreCount?: number;
  /**
   * The floor this block reserves, in px. 176 matches the reference and exists
   * because this component OPENS ITSELF while the agent works and shuts when it
   * settles: without a floor, the moment the run finishes everything below the
   * trace jumps up by the height of the trace. Reserving the space means the
   * settle is a fade rather than a lurch.
   *
   * Pass 0 where the trace is threaded inline through a conversation and the
   * reserved space would read as the unexplained gap the founder already
   * reported once. A floor is right for a block that stands alone and wrong for
   * one that sits in a column of prose.
   */
  minHeight?: number;
  /** Fires when a Coding row is picked. Omit and the pick is visual only. */
  onSelectRow?: (row: ThinkingRow, index: number) => void;
}) {
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  /*
   * Open while it runs, shut once it settles, until the reader says otherwise.
   * That ordering is the whole argument for the component: the detail is worth
   * watching while it is happening and worth hiding the moment it is not.
   */
  const autoExpanded = working;
  const showZero = !working && rows.length === 0;
  const hasTrace = rows.length > 0 || Boolean(query) || showZero;
  const expanded = hasTrace && (manualExpanded ?? autoExpanded);

  /*
   * Rows present at mount arrive as a wave, 120ms apart. Rows that turn up
   * afterwards do not wait: they are the thing the reader is watching for, and
   * holding the twentieth one back by 2.4s to preserve a wave nobody is
   * watching would make a live trace feel slower than the work behind it.
   * Their demo never appends after mount, so a flat `i * 120` is safe there
   * and wrong here.
   */
  const staggerUntil = useRef(rows.length);

  /*
   * The rail is drawn, not bordered, because it has to stop exactly at the last
   * row's midpoint rather than run the full height of a container. Measuring is
   * the only way to know where that is once rows wrap.
   */
  const traceRef = useRef<HTMLDivElement>(null);
  const [railHeight, setRailHeight] = useState(0);
  useLayoutEffect(() => {
    if (traceRef.current) setRailHeight(traceRef.current.offsetHeight);
  }, [rows.length, expanded, variant, working, query]);

  return (
    <div
      data-mrd=""
      className="flex w-full max-w-95 flex-col font-mrd"
      style={{ minHeight: minHeight || undefined }}
    >
      {/*
       * The live region sits on the button rather than on the label inside it,
       * because the label is two different elements that swap. A region that
       * unmounts at the moment it has something to announce announces nothing.
       */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-live="polite"
        disabled={!hasTrace}
        onClick={() => setManualExpanded((current) => !(current ?? autoExpanded))}
        className="-mx-1.5 flex w-fit items-center gap-2 rounded-mrd-ctl px-1.5 py-1 transition-colors duration-100 enabled:hover:bg-mrd-hover disabled:cursor-default"
      >
        <svg
          aria-hidden
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={working ? "var(--mrd-agent)" : "var(--mrd-mute)"}
        >
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
        </svg>

        {working ? (
          /*
           * Shimmer rather than pulse, for the reason LoadingState gives: a
           * pulse changes the whole label's brightness and pulls the eye off
           * the content beside it, a travelling highlight reads as "still
           * going" in peripheral vision and goes quiet when looked at.
           */
          <span
            className="bg-clip-text text-[13px] font-medium whitespace-nowrap text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--mrd-mute) 35%, var(--mrd-ink) 50%, var(--mrd-mute) 65%)",
              backgroundSize: "200% 100%",
              animation: "mrd-shimmer var(--mrd-d-alive) linear infinite",
            }}
          >
            {label ?? ACTIVE_LABEL[variant]}
          </span>
        ) : (
          <span
            className="text-[13px] font-medium whitespace-nowrap text-mrd-prose text-mrd-body"
            style={{ animation: "mrd-fade-in 350ms ease-out both" }}
          >
            {summary ?? settledLabel(variant, rows.length, durationMs)}
          </span>
        )}

        {hasTrace && (
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mrd-mute)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>

      {/*
       * Grid rows from 0fr to 1fr, which animates a height the component does
       * not know in advance. A max-height guess is the usual shortcut and it
       * either clips a long trace or leaves the short one easing through empty
       * space for most of its duration.
       */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-[400ms]"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          opacity: expanded ? 1 : 0,
          transitionTimingFunction: "var(--mrd-ease)",
        }}
      >
        <div className="overflow-hidden">
          <div className="relative mt-1 ml-[5px] pl-4">
            {hasTrace && (
              <span
                aria-hidden
                className="absolute left-[3px] w-px bg-mrd-line"
                style={{
                  top: -8,
                  height: railHeight ? railHeight - 2 : 0,
                  transition: "height 500ms var(--mrd-ease)",
                }}
              />
            )}

            <div ref={traceRef} className="flex flex-col gap-1 py-1">
              {query && (
                <div
                  className="flex h-6 items-center gap-2 px-1.5"
                  style={{
                    animation: expanded
                      ? "mrd-fade-up 300ms var(--mrd-ease) both"
                      : undefined,
                  }}
                >
                  <svg
                    aria-hidden
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--mrd-mute)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="shrink-0"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  <span className="text-[12.5px] text-mrd-prose text-mrd-body">{query}</span>
                </div>
              )}

              {showZero && (
                <p className="px-1.5 py-0.5 text-[12.5px] text-mrd-mute">{ZERO_LINE[variant]}</p>
              )}

              {rows.map((row, i) => {
                const delay = i < staggerUntil.current ? i * 120 : 0;
                const enter = {
                  animation: `mrd-fade-up 320ms var(--mrd-ease) ${delay}ms both`,
                };
                const rowClass =
                  "flex min-h-7 w-full items-center gap-2 rounded-mrd-chip px-1.5 py-0.5 text-left";

                const content = (
                  <>
                    {variant === "Search" && <SourceGlyph />}
                    {variant === "Steps" &&
                      (i < rows.length - 1 || !working ? <CheckGlyph /> : <SpinnerGlyph />)}

                    {/*
                     * 12.5 over 11.5 is the reference's own pairing for a row
                     * and its qualifier, and it is not a rounding of 12 over
                     * 11. The half stops are what let the qualifier sit under
                     * the subject without either of them shouting; collapsing
                     * them onto whole pixels flattens the two into one voice.
                     *
                     * The Search underline fades in by decoration colour
                     * rather than appearing whole. text-decoration-color
                     * transitions and text-decoration-line does not, so this
                     * is the only underline that can arrive rather than snap.
                     */}
                    <span
                      className={`min-w-0 truncate text-[12.5px] ${
                        variant === "Reasoning"
                          ? "leading-relaxed whitespace-normal text-mrd-prose text-mrd-body"
                          : "font-medium text-mrd-ink"
                      } ${
                        variant === "Search"
                          ? "underline decoration-transparent underline-offset-[3px] transition-colors duration-200 group-hover:decoration-current"
                          : ""
                      }`}
                    >
                      {row.primary}
                    </span>

                    {row.secondary && (
                      <span
                        className={`shrink-0 text-[11.5px] text-mrd-mute ${
                          row.mono ? "font-mrd-mono" : ""
                        }`}
                      >
                        {row.secondary}
                      </span>
                    )}

                    {/*
                     * Added and removed render independently. Their version
                     * gates both on `add`, so an edit that only deletes prints
                     * a literal "undefined" beside a minus.
                     */}
                    {(row.add !== undefined || row.del !== undefined) && (
                      <span className="shrink-0 font-mrd-mono text-[11px] tabular-nums">
                        {row.add !== undefined && <span className="text-mrd-pass">+{row.add}</span>}
                        {row.add !== undefined && row.del !== undefined && " "}
                        {row.del !== undefined && <span className="text-mrd-fail">-{row.del}</span>}
                      </span>
                    )}
                  </>
                );

                if (variant === "Search" && row.href) {
                  return (
                    <a
                      key={`${i}-${row.primary}`}
                      href={row.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`${rowClass} ${FOCUS_INSET} group transition-colors duration-150 hover:bg-mrd-hover`}
                      style={enter}
                    >
                      {content}
                    </a>
                  );
                }

                if (variant === "Coding") {
                  const isSelected = selected === i;
                  return (
                    <button
                      key={`${i}-${row.primary}`}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelected(isSelected ? null : i);
                        onSelectRow?.(row, i);
                      }}
                      /*
                       * A picked row was drawn on `sink`, which is DARKER than
                       * the canvas: on the dark ground the selected row read as
                       * a hole in the surface rather than as the one row the
                       * reader had chosen, and next to a 4.5% hover the two
                       * were within a whisker of each other. `--mrd-select` is
                       * the token the system keeps for a passage a reader has
                       * picked, at 17% precisely so it cannot be mistaken for a
                       * hover, and it is an alpha, so it reads the same whether
                       * this trace lands on sheet, sink or paper.
                       */
                      className={`${rowClass} ${FOCUS_INSET} transition-colors duration-150 ${
                        isSelected ? "bg-mrd-select" : "hover:bg-mrd-hover"
                      }`}
                      style={enter}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div key={`${i}-${row.primary}`} className={rowClass} style={enter}>
                    {content}
                  </div>
                );
              })}

              {variant === "Search" && !working && moreCount > 0 && (
                <span
                  className="px-1.5 mrd-meta"
                  style={{ animation: "mrd-fade-in 300ms ease-out both" }}
                >
                  +{moreCount} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Thinking;
