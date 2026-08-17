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
  /**
   * What a person would call the document, and PREFERABLY ITS FILENAME.
   *
   * The reference's own data is filenames — `Dairy Onboarding SOP.pdf`,
   * `Sales Velocity Export.csv` — and that is not incidental. An extension is the
   * most reliable thing a source carries, it needs no second field to be
   * recognisable, and it is what lets `sourceMark` draw the right glyph without
   * the caller thinking about it.
   */
  label: string;
  /**
   * A word for the kind when the label is not a filename, e.g. "mail", "board".
   * Used as a HINT for the glyph and no longer rendered as its own text chip:
   * "MAIL" beside "Support inbox, ticket 4471" was the same fact twice.
   */
  kind?: string;
  /**
   * Force the glyph, when the caller knows better than the filename does.
   *
   * The case this exists for is a provider: a `.eml` from Gmail and one from
   * Outlook are the same extension and a different thing to check, and only the
   * caller knows which mailbox it came out of.
   */
  mark?:
    | "pdf"
    | "sheet"
    | "doc"
    | "code"
    | "mail"
    | "gmail"
    | "outlook"
    | "web"
    | "chat"
    | "board"
    | "unknown";
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

/**
 * WHAT KIND OF THING THIS CAME FROM, DRAWN.
 *
 * ── WHY A GLYPH AND NOT THE REFERENCE'S COLOURED TILE ───────────────────
 * The reference badges each source with a 14px tile filled `bg-red` for PDF and
 * `bg-green` for CSV. The colour is doing real work there: it is the only thing
 * that makes a format recognisable at a glance in a 380px column.
 *
 * Meridian cannot spend red and green on a file extension — they report an
 * OUTCOME, so a green CSV would say a spreadsheet succeeded at something. The
 * first port answered that by dropping to a neutral text chip, and in doing so
 * threw away the recognisability along with the colour. Two decisions were
 * collapsed into one.
 *
 * Law 4 separates them: identity is SHAPE, status is hue. So the format keeps a
 * distinct mark and gives up only its colour, which is both faithful to the
 * reference's intent and stronger than its execution — a drawn envelope is
 * legible to someone who cannot distinguish red from green, and a red tile is
 * not.
 *
 * ── WHY THE PROVIDERS ARE HERE TOO ──────────────────────────────────────
 * A source is not always a file. An excerpt pulled from a mailbox came from
 * Gmail or from Outlook, and which one is the first thing a person checks when
 * they doubt it. These are drawn, never a fetched brand asset: a logo loaded
 * from a third party is a request that can fail, a licence to honour, and a
 * layout that shifts when it does not arrive.
 */
type SourceMark =
  | "pdf"
  | "sheet"
  | "doc"
  | "code"
  | "mail"
  | "gmail"
  | "outlook"
  | "web"
  | "chat"
  | "board"
  | "unknown";

/**
 * Read the mark off whatever the caller actually has, filename first.
 *
 * FILENAME FIRST, because the reference's own data is filenames and an extension
 * is the most reliable thing on a source: `Dairy Onboarding SOP.pdf` needs no
 * separate field to be recognisable. `kind` is the fallback for a source that has
 * no filename at all, like a mailbox or a board.
 */
export function sourceMark(source: ContextSource): SourceMark {
  const explicit = (source.mark ?? "").toLowerCase();
  if (explicit) return (explicit as SourceMark) ?? "unknown";

  const label = source.label.toLowerCase();
  const hint = `${label} ${(source.kind ?? "").toLowerCase()}`;

  if (/\bgmail\b/.test(hint)) return "gmail";
  if (/\boutlook\b/.test(hint)) return "outlook";
  if (/\.pdf\b/.test(label) || /\bpdf\b/.test(hint)) return "pdf";
  if (/\.(csv|xlsx?|tsv|numbers)\b/.test(label) || /\b(csv|sheet|spreadsheet)\b/.test(hint))
    return "sheet";
  if (/\.(tsx?|jsx?|py|rb|go|rs|sql|sh|css|json|ya?ml)\b/.test(label) || /\bcode\b/.test(hint))
    return "code";
  if (/\.(docx?|md|rtf|pages|txt)\b/.test(label) || /\b(doc|document|spec|sop)\b/.test(hint))
    return "doc";
  if (/\b(mail|inbox|ticket|email)\b/.test(hint)) return "mail";
  if (/^https?:\/\//.test(source.href ?? "") && !/\bboard\b/.test(hint)) return "web";
  if (/\b(slack|thread|chat|call|transcript)\b/.test(hint)) return "chat";
  if (/\b(board|queue|station)\b/.test(hint)) return "board";
  return "unknown";
}

/** One drawing per mark, all on a 14px box so the chip never reflows. */
function SourceGlyph({ mark }: { mark: SourceMark }) {
  const common = {
    width: 13,
    height: 13,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (mark) {
    case "pdf":
      /* A page with a folded corner and a filled bar: the bar is what separates
         it from `doc` at 13px, where a corner fold alone is two pixels. */
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M8.5 15.5h5" strokeWidth="2.6" />
        </svg>
      );
    case "sheet":
      /* A grid, because a spreadsheet's whole identity is cells. */
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 10h16M4 15h16M10 4v16" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M8.5 13h7M8.5 17h4" />
        </svg>
      );
    case "code":
      return (
        <svg {...common}>
          <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 7l8.5 6 8.5-6" />
        </svg>
      );
    case "gmail":
      /* Gmail's mark is the envelope's inner M, and that shape is what people
         actually recognise. Drawn open at the top so it reads as the M rather
         than as a second envelope flap. */
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 6.5L12 13l8.5-6.5" />
          <path d="M7.5 18V9.5M16.5 18V9.5" strokeWidth="1.6" />
        </svg>
      );
    case "outlook":
      /* Outlook's mark is a rounded square O beside a panel. */
      return (
        <svg {...common}>
          <rect x="3" y="6" width="10" height="12" rx="2.5" />
          <ellipse cx="8" cy="12" rx="2.2" ry="3" />
          <path d="M14 8h7v8h-7" />
        </svg>
      );
    case "web":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14 0 17M12 3.5c-2.5 2.5-2.5 14 0 17" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M20 12a7 7 0 0 1-7 7H9l-4 3v-4.5A7 7 0 0 1 6 6h7a7 7 0 0 1 7 6z" />
        </svg>
      );
    case "board":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 8v8M15 8v5" />
        </svg>
      );
    default:
      /* Honest about not knowing, rather than guessing a file type. */
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" strokeDasharray="2 2.5" />
        </svg>
      );
  }
}

/** What each mark is called out loud, so the chip is not a silent picture. */
const MARK_NAME: Record<SourceMark, string> = {
  pdf: "PDF",
  sheet: "Spreadsheet",
  doc: "Document",
  code: "Code",
  mail: "Mail",
  gmail: "Gmail",
  outlook: "Outlook",
  web: "Web page",
  chat: "Conversation",
  board: "Board",
  unknown: "Source",
};

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

/** How many blocks the meter is made of. Four, and the count is a decision. */
const MATCH_BLOCKS = 4;

/**
 * THE MATCH AS FOUR BLOCKS, and the number beside them.
 *
 * ── WHY BLOCKS AND NOT THE THIN BAR THIS REPLACES ───────────────────────
 * Founder, on seeing the bar: a percentage next to a hairline "does not make
 * sense at all ... when you show it in the form of blocks and you mention 71%,
 * it would understand".
 *
 * That is a real perceptual point, not a preference. A 40px continuous bar asks
 * the reader to judge one length against another length on a different card, four
 * rows apart, which is a comparison the eye is bad at. Four discrete blocks turn
 * it into COUNTING, which the eye is good at and which survives a glance: three
 * of four beats two of four without measuring anything.
 *
 * ── THE BLOCK COUNT IS A HONESTY DECISION ───────────────────────────────
 * Four, because four blocks claim a precision of one quarter and that is roughly
 * what an embedding similarity is worth. Ten blocks would claim decimal precision
 * the number does not have; two could not tell a good match from a mediocre one.
 * The exact figure is printed beside them for the reader who does want it, so the
 * blocks carry the glance and the number carries the detail.
 *
 * ── STILL NEUTRAL ───────────────────────────────────────────────────────
 * Unchanged from the bar it replaces, and worth restating because blocks look
 * more like a verdict than a bar does: this is a MEASUREMENT. Filling three
 * blocks green would say "this excerpt is correct" when all it says is "this was
 * the closest text we held". Green and red are outcomes.
 */
function Relevance({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = Math.round(clamped * 100);
  /*
   * CEIL, so any non-zero match lights at least one block. A real but weak match
   * rendering as four empty blocks is indistinguishable from no match at all,
   * which is the one thing this meter must never say.
   */
  const lit = clamped === 0 ? 0 : Math.max(1, Math.ceil(clamped * MATCH_BLOCKS));

  return (
    <span
      className="flex shrink-0 items-center gap-1.5"
      /* One accessible string for the whole meter. Four blocks announced
         individually is four meaningless words. */
      role="img"
      aria-label={`Match ${pct} percent`}
      title={`Match ${pct} percent, ${lit} of ${MATCH_BLOCKS} blocks`}
    >
      <span aria-hidden className="flex items-end gap-[2px]">
        {Array.from({ length: MATCH_BLOCKS }, (_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-[1px]"
            style={{
              /*
               * A RISING STAIR, not four equal bars. Equal blocks read as a
               * segmented progress bar, which implies the thing is loading;
               * stepped heights read as strength, which is what this measures.
               */
              height: `${5 + i * 2}px`,
              background: i < lit ? "var(--mrd-body)" : "var(--mrd-sink)",
              transition: "background-color var(--mrd-d-press) linear",
            }}
          />
        ))}
      </span>
      <span className="font-mrd-mono text-[11px] text-mrd-mute tabular-nums">{pct}%</span>
    </span>
  );
}

function SourceChip({ source }: { source: ContextSource }) {
  const mark = sourceMark(source);
  const inner = (
    <>
      {/*
       * The glyph replaces the text chip that used to sit here. "MAIL" printed
       * beside "Support inbox, ticket 4471" was the same fact twice, and it spent
       * the chip's scarce width on a word the label already implies.
       *
       * Named for assistive tech, because a drawing on its own is silent and the
       * format is exactly the thing a doubting reader checks first.
       */}
      <span className="shrink-0 text-mrd-mute" title={MARK_NAME[mark]}>
        <SourceGlyph mark={mark} />
        <span className="sr-only">{MARK_NAME[mark]}: </span>
      </span>
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
