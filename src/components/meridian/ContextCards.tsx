import { useEffect, useState, type ReactNode } from "react";

/*
 * CONTEXT CARDS, the excerpts an answer was built from, each with its source.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Context Cards"
 *                 (their file: components/ContextCards.tsx), MIT licensed,
 *                 read on 2026-08-14 from the exact string that page's own
 *                 "View code" panel renders.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * Decide's evidence recess caps at four excerpts and offers no way to check
 * whether those four were the right four. Brain shows precedent as a bare
 * list, so a passage that decided something looks exactly like a passage that
 * merely mentioned it. This card carries the excerpt, the document it came
 * from as a real link, and, when the caller has one, the match score, so a
 * reader can spot-check the pick instead of trusting it.
 *
 * ── WHAT IS DELIBERATELY NOT COPIED ─────────────────────────────────────
 * The reference badges each source by file type in flat red and flat green.
 * Under Meridian green and red report an OUTCOME, so painting "CSV" green
 * would tell a reader a spreadsheet succeeded at something. File type is
 * categorical, so it is a neutral chip here, and the accent stays available
 * for facts that are actually status.
 *
 * The reference also prints a fixed total of 32 above two cards. A count that
 * does not match what is on screen is worse than no count, so the header here
 * states both numbers and the cap offers the way past it.
 */

export type ContextSource = {
  /** What a person would call the document. */
  label: string;
  /** Short kind marker, e.g. "PDF", "SQL", "DOC". Rendered as a neutral chip. */
  kind?: string;
  /** Opens the real thing. Without it the source is stated but not reachable. */
  href?: string;
};

export type ContextChunk = {
  id: string;
  /** What this excerpt is about, in the reader's words. */
  title: string;
  /** The excerpt itself. */
  body: string;
  /** A real measure of the excerpt, e.g. "290 characters", "lines 40 to 88". */
  extent?: string;
  source?: ContextSource;
  /**
   * Match score, 0 to 1, ONLY when the caller genuinely has one. Omitted
   * rather than defaulted: a fabricated 0.5 on every card is the same failure
   * as a model returning unparseable output and rendering as a considered
   * judgment.
   */
  relevance?: number;
};

export type ContextCardsProps = {
  chunks: ContextChunk[];
  /** Heading above the stack. */
  title?: string;
  /** Cards rendered before the cap notice appears. Omit for no cap. */
  maxChunks?: number;
  onShowAll?: () => void;
  /** True when something upstream narrowed the set. Separates the two zeroes. */
  isFiltered?: boolean;
  onClearFilter?: () => void;
  /**
   * How many excerpts existed BEFORE the filter ran. Not derivable here: by
   * the time `chunks` arrives it is already narrowed, so counting it in the
   * excluded case would print a confident zero. Omit it and the message names
   * no number rather than a wrong one.
   */
  totalBeforeFilter?: number;
  /** Shown when no excerpt exists at all. */
  emptyTitle?: string;
  emptyDetail?: string;
  /** A read that did not come back. Never an empty state. */
  failure?: { message: string; onRetry?: () => void };
  /** Slot under the heading, e.g. a search field. */
  toolbar?: ReactNode;
};

const FOCUS =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

function LinesIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}

function OutIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

/**
 * The match score as a bar, neutral. It is a measurement, not a verdict, and
 * a green bar at 0.71 would read as "this is correct" when all it says is
 * "this was the closest text". The number is printed beside it because a bar
 * alone cannot be compared between two cards at a glance.
 */
function Relevance({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <span className="flex shrink-0 items-center gap-1.5" title={`Match ${pct} percent`}>
      <span aria-hidden className="h-1 w-10 overflow-hidden rounded-full bg-mrd-sink">
        <span className="block h-full rounded-full bg-mrd-faint" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mrd-mono text-[11px] text-mrd-mute tabular-nums">{pct}%</span>
    </span>
  );
}

function SourceChip({ source }: { source: ContextSource }) {
  const inner = (
    <>
      {source.kind && (
        <span className="flex h-3.5 items-center rounded-mrd-xs bg-mrd-lift px-1 font-mrd-mono text-[8px] font-semibold tracking-wide text-mrd-body">
          {source.kind}
        </span>
      )}
      <span className="truncate">{source.label}</span>
      {source.href && <OutIcon />}
    </>
  );

  const shell =
    "inline-flex h-6 max-w-full items-center gap-1.5 rounded-full border border-mrd-line bg-mrd-sink px-2 text-[12px] font-medium text-mrd-body";

  /*
   * A source without a link is still stated, just not dressed as a control.
   * Rendering it as a button that does nothing is the worse option: the reader
   * presses it, nothing happens, and they stop trusting the other ones.
   */
  if (!source.href) {
    return <span className={shell}>{inner}</span>;
  }

  return (
    <a
      href={source.href}
      target="_blank"
      rel="noreferrer"
      /*
       * `--mrd-lift` on hover, not `--mrd-hover`. This chip is the one thing on
       * the card that LEAVES the page, and at 4.5% over a recess the pointer
       * landing on it changed nothing a reader would notice — so the only chip
       * that is a link looked exactly like the ones that are not. Stepping the
       * fill from `sink` to `lift` moves it a whole rung of the surface ladder,
       * which is legible on both grounds.
       */
      className={`${shell} transition-colors hover:bg-mrd-lift hover:text-mrd-ink ${FOCUS}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {inner}
    </a>
  );
}

export function ContextCards({
  chunks,
  title = "Evidence",
  maxChunks,
  onShowAll,
  isFiltered = false,
  onClearFilter,
  totalBeforeFilter,
  emptyTitle = "No evidence attached yet",
  emptyDetail,
  failure,
  toolbar,
}: ContextCardsProps) {
  const shown = maxChunks ? chunks.slice(0, maxChunks) : chunks;
  const withheld = chunks.length - shown.length;

  /*
   * ── THE SECOND BEAT ─────────────────────────────────────────────────────
   * The reference enters in two movements, and the port only had the first.
   * The cards arrive staggered, and THEN — after a hold — each card's source
   * chip scales up into place, itself staggered.
   *
   * It is worth restoring because the order matches how the card is read: the
   * excerpt is the thing, and where it came from is the thing you check
   * second. Landing both at once gives the reader two places to look and no
   * order to look in. The hold is what turns two animations into a sequence.
   */
  const [chipsIn, setChipsIn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setChipsIn(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section data-mrd="" className="flex w-full flex-col gap-2" aria-label={title}>
      {/*
       * The heading arrives too. The reference fades it in over 400ms and the
       * port had it appear instantly above a stack that then animated in
       * underneath it, which reads as the cards being late rather than as the
       * group arriving. It is the first beat of a three-beat entrance: heading,
       * then cards, then each card's source chip after the hold below.
       */}
      <div
        className="flex items-center gap-2 px-0.5"
        style={{ animation: "mrd-fade-in var(--mrd-d-enter) var(--mrd-ease) both" }}
      >
        <h2 className="text-[13px] font-semibold text-mrd-ink">{title}</h2>
        {/* The count is what is on screen over what exists, never a fixed figure. */}
        {!failure && chunks.length > 0 && (
          <span className="inline-flex h-5 items-center rounded-mrd-xs border border-mrd-line bg-mrd-sink px-1.5 font-mrd-mono text-[11.5px] font-medium text-mrd-body tabular-nums">
            {shown.length === chunks.length ? chunks.length : `${shown.length} of ${chunks.length}`}
          </span>
        )}
        {toolbar && <div className="ml-auto">{toolbar}</div>}
      </div>

      {/*
       * The three state panels below arrive exactly as a first card would, with
       * the same shadow and the same entrance. They are the body of this
       * section, so a heading that fades in above a panel that snaps into place
       * would read as two unrelated things landing.
       */}
      {failure ? (
        <div
          className="flex flex-col items-center gap-2 rounded-mrd-card border border-mrd-line bg-mrd-sheet px-4 py-8 text-center shadow-mrd-card"
          style={{ animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both" }}
        >
          <span className="text-[13px] font-medium" style={{ color: "var(--mrd-fail)" }}>
            {failure.message}
          </span>
          <span className="text-[12px] text-mrd-mute">
            No excerpt was read. Do not take this as an answer with no evidence behind it.
          </span>
          {failure.onRetry && (
            <button
              type="button"
              onClick={failure.onRetry}
              className={`mt-1 rounded-mrd-ctl bg-mrd-solid px-2.5 py-1 text-[12.5px] font-medium text-mrd-on-solid transition-opacity hover:opacity-90 ${FOCUS}`}
              style={{
                transitionDuration: "var(--mrd-d-press)",
                /* The specular top edge every filled control in this system
                   carries. It was missing, so the one control on a failed read
                   was the flattest thing on the panel. */
                boxShadow: "inset 0 1px 0 var(--mrd-sheen), var(--mrd-shadow-card)",
              }}
            >
              Try again
            </button>
          )}
        </div>
      ) : chunks.length === 0 && isFiltered ? (
        <div
          className="flex flex-col items-center gap-1.5 rounded-mrd-card border border-mrd-line bg-mrd-sheet px-4 py-8 text-center shadow-mrd-card"
          style={{ animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both" }}
        >
          <span className="text-[13px] font-medium text-mrd-ink">
            No excerpt matches this filter
          </span>
          <span className="text-[12px] text-mrd-mute">
            {totalBeforeFilter
              ? `${totalBeforeFilter} excerpt${totalBeforeFilter === 1 ? "" : "s"} exist and the filter is hiding all of them.`
              : "The excerpts exist. Widen the filter to bring them back."}
          </span>
          {onClearFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              className={`mt-1 rounded-mrd-ctl border border-mrd-edge px-2.5 py-1 text-[12.5px] font-medium text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              Clear the filter
            </button>
          )}
        </div>
      ) : chunks.length === 0 ? (
        <div
          className="flex flex-col items-center gap-1.5 rounded-mrd-card border border-mrd-line bg-mrd-sheet px-4 py-8 text-center shadow-mrd-card"
          style={{ animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both" }}
        >
          <span className="text-[13px] font-medium text-mrd-ink">{emptyTitle}</span>
          {emptyDetail && <span className="text-[12px] text-mrd-mute">{emptyDetail}</span>}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((chunk, index) => (
            <li
              key={chunk.id}
              className="overflow-hidden rounded-mrd-card border border-mrd-line bg-mrd-sheet"
              style={{
                /*
                 * Staggered by index so the stack arrives as a sequence rather
                 * than a flash. It runs once on arrival and never loops: a card
                 * that keeps moving after it has landed reads as still working.
                 *
                 * 100ms per card, which is the reference's figure; the port had
                 * shortened it to 60 and at that spacing the cards read as one
                 * blurred event rather than as a stack being dealt. Capped at
                 * 600ms because the reference only ever shows two cards and this
                 * one can be handed a dozen, where an uncapped stagger would
                 * leave the last card still arriving a second and a half after
                 * the reader started looking.
                 */
                animation: `mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) ${Math.min(index * 100, 600)}ms both`,
                /* Cards sit off the ground. The reference gives them a shadow
                   and the port had only the border, which on the dark ground
                   left the stack flush with the page. */
                boxShadow: "var(--mrd-shadow-card)",
              }}
            >
              {/*
               * `--mrd-line`, not `--mrd-line-soft`. This rule separates a card's
               * header from its body, which is the reference's `border-line` and
               * is a real edge, not a rule between sections. At 5.5% it was below
               * the threshold where the eye reads a division on the dark ground
               * at all, so the title and the excerpt ran together as one block.
               */}
              <div className="flex items-center gap-2.5 border-b border-mrd-line px-3 py-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-mrd-ink">
                  <span className="shrink-0 text-mrd-mute">
                    <LinesIcon />
                  </span>
                  <span className="truncate">{chunk.title}</span>
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-2.5">
                  {/* "241 characters", "lines 12 to 18" — a phrase, not a
                      figure, so the sans face with tabular figures kept. */}
                  {chunk.extent && (
                    <span className="text-[12px] text-mrd-mute tabular-nums">{chunk.extent}</span>
                  )}
                  {chunk.relevance !== undefined && <Relevance value={chunk.relevance} />}
                </span>
              </div>

              <p className="px-3 pt-2 pb-1 text-[12.5px] leading-relaxed text-mrd-body">
                {chunk.body}
              </p>

              {chunk.source && (
                <div
                  className="px-3 pb-3 transition-[opacity,transform] duration-300"
                  style={{
                    opacity: chipsIn ? 1 : 0,
                    /* From 0.95, never from 0: a chip that grows from nothing
                       reads as a pop, and this system does not bounce. */
                    transform: chipsIn ? "scale(1)" : "scale(0.95)",
                    transformOrigin: "left center",
                    transitionDelay: `${index * 80}ms`,
                    transitionTimingFunction: "var(--mrd-ease)",
                  }}
                >
                  <SourceChip source={chunk.source} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Withheld cards are counted on screen, with the way past the cap. */}
      {withheld > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-3 py-2">
          {/* A sentence, so the sans face. See the note in StalledWork. */}
          <span className="text-[12px] text-mrd-mute tabular-nums">
            {withheld} more excerpt{withheld === 1 ? "" : "s"} not shown.
          </span>
          {onShowAll && (
            <button
              type="button"
              onClick={onShowAll}
              className={`rounded-mrd-ctl border border-mrd-edge px-2 py-0.5 text-[12px] font-medium text-mrd-body transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${FOCUS}`}
              style={{ transitionDuration: "var(--mrd-d-press)" }}
            >
              Show all {chunks.length}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default ContextCards;
