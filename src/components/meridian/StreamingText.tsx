import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/*
 * STREAMING TEXT, an answer that arrives as it is being written.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Streaming Text"
 *                 (their file: components/StreamingText.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * The Ask pane returns an answer, and an answer without its sources attached
 * is an opinion. This renders the answer and the documents it leaned on in one
 * object, so the reader can spot-check a claim without leaving the pane. Brain
 * currently shows precedent as a bare list, which makes the reader assemble the
 * answer themselves.
 *
 * ── THE TWO HONESTY RULES THIS COMPONENT ENFORCES ───────────────────────
 * 1. A FAILED READ IS NEVER AN EMPTY STATE. If the answer could not be
 *    fetched, `error` renders a distinct panel carrying the reason and a way
 *    out. It deliberately does not wear the empty state's clothes: an empty
 *    workspace and a broken query look nothing alike, because confusing them
 *    teaches someone to wait for an answer that is never coming.
 * 2. NO CLAIM OF ACCUMULATED LEARNING IN THE PRESENT TENSE. Nothing this
 *    component renders may say the product has learned anything. It shows an
 *    answer and the documents behind it, which is all it can prove.
 *
 * ── TIMING: A DELIBERATE DEVIATION FROM THE SOURCE ──────────────────────
 * The reference reveals one word every 55ms flat. The founder reviewed this
 * port on 2026-08-14 and asked for it slower: "a little slow, not too slow",
 * so it reads as something being written rather than as a mechanical effect.
 *
 * IF YOU ARE ABOUT TO SPEED THIS BACK UP TO MATCH THE REFERENCE, DO NOT. The
 * slowness is the requested behaviour, not drift. Three things carry it:
 *
 *   a. `revealMs` is PER CHARACTER, not per word. At the default 30ms and an
 *      average English word of about 5.8 characters including its space, a
 *      word lands roughly every 175ms, about three times slower than the
 *      reference. Charging by length is also why a long word takes longer to
 *      appear than a short one, which is most of what makes it read as writing.
 *   b. The interval is not constant. A perfectly even tick is precisely what
 *      reads as mechanical, so each chunk is jittered plus or minus 20 percent.
 *      The jitter is derived from the chunk's index, never from Math.random, so
 *      the same answer always reveals identically and a test can assert it.
 *   c. Punctuation earns a beat. A sentence-ending stop holds longer than a
 *      comma, which holds longer than a plain word. That pause is the whole
 *      difference between prose being written and prose being printed.
 *
 * Reduced motion renders the answer complete and instantly. The words are the
 * information; the reveal is decoration, and decoration is what stops.
 */

/**
 * What KIND of thing a source is, which is the only thing that picks its mark.
 *
 * The reference ships a favicon per source, because its sources are websites.
 * Ours are the things this product actually reads, and they are not websites,
 * so a favicon has nothing to fetch. A kind mark is the honest equivalent: it
 * is recognisable at 12px the way a logo is, it is drawn in Meridian's own
 * neutrals rather than in a colour a remote server chose, and it survives with
 * no network at all — which matters, because a broken <img> in the middle of a
 * sentence is worse than no mark.
 */
export type SourceKind = "doc" | "thread" | "call" | "ticket" | "code" | "board";

export type AnswerSource = {
  /** What a reader would call it. A document name, not an id. */
  label: string;
  /** Where it sits, shown small and monospaced. Optional. */
  where?: string;
  href?: string;
  /** Picks the mark. Falls back to a monogram when it is not known. */
  kind?: SourceKind;
};

/**
 * An answer is prose with citations sitting inside it, so the citation has to
 * be a member of the stream rather than a footnote appended after it. That is
 * the reference's central idea and it is the reason the shape is a list of
 * parts rather than a string.
 */
export type AnswerPart = { kind: "text"; text: string } | { kind: "cite"; source: AnswerSource };

type Chunk = { word: string; cite?: undefined } | { cite: AnswerSource; word?: undefined };

const DEFAULT_REVEAL_MS = 30;
/** Nothing dwells longer than this, so one long token cannot stall the answer. */
const MAX_CHUNK_MS = 320;
const STOP_BEAT_MS = 260;
const COMMA_BEAT_MS = 110;

function toChunks(parts: AnswerPart[]): Chunk[] {
  const out: Chunk[] = [];
  for (const part of parts) {
    if (part.kind === "cite") {
      out.push({ cite: part.source });
      continue;
    }
    for (const word of part.text.split(/\s+/)) {
      if (word) out.push({ word });
    }
  }
  return out;
}

/**
 * Deterministic jitter in the range 0.8 to 1.2, keyed on position.
 *
 * A hash rather than a random draw, because the founder's note asked for
 * variance and a test asked for repeatability, and those only coexist if the
 * wobble is a pure function of the index.
 */
function wobble(index: number): number {
  const n = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return 0.8 + (n - Math.floor(n)) * 0.4;
}

/**
 * How long chunk `index` sits on screen before the next one joins it.
 * Exported so a test can pin the timing curve rather than the spelling of it.
 */
export function chunkDelay(chunk: Chunk, index: number, revealMs: number): number {
  if (chunk.cite) return Math.round(140 * wobble(index));
  const word = chunk.word;
  const base = Math.min(revealMs * (word.length + 1), MAX_CHUNK_MS);
  const beat = /[.!?]["')\]]?$/.test(word) ? STOP_BEAT_MS : /[,;:]$/.test(word) ? COMMA_BEAT_MS : 0;
  return Math.round(base * wobble(index)) + beat;
}

/**
 * Whether the block has ever been scrolled into view.
 *
 * ── WHY THIS EXISTS, and it is the whole bug the founder reported ───────
 * The reveal used to start on mount. That is fine on the Ask pane, where the
 * answer arrives while the reader is looking at it, and it is wrong everywhere
 * else: on the gallery this component sits about thirty panels down, so the
 * entire four-second reveal ran, finished and settled before anyone scrolled
 * near it. What you then arrive at is a finished paragraph — which reads
 * exactly like the whole block was pasted in at once, because from the
 * reader's side it was. The reveal was never broken; nobody was in the room
 * for it.
 *
 * Latching rather than tracking: once seen, it stays seen. A reveal that
 * restarted every time the panel scrolled off and back would re-write a
 * paragraph the reader has already read, which is worse than not animating.
 */
function useSeen(ref: { current: HTMLElement | null }, enabled: boolean): boolean {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!enabled || seen) return;
    const el = ref.current;
    if (!el) return;
    /* No observer (jsdom, an old engine): reveal rather than stall. A component
       that silently renders nothing because a browser API is missing is the
       worse failure by far. */
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled, seen]);

  return seen;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function Glyph({ d, label }: { d: string; label: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      role="img"
      aria-label={label}
    >
      <path d={d} />
    </svg>
  );
}

const COPY_D =
  "M9 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1";
const RETRY_D = "M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6";
const REPLY_D = "M9 10l-5 5 5 5M20 4v7a4 4 0 0 1-4 4H4";
const THUMB_UP_D =
  "M7 10v11M14 4.88L13 9h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 16.5 21H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L11 3a2.5 2.5 0 0 1 3 1.88z";
const THUMB_DOWN_D =
  "M17 14V3M10 19.12L11 15H5.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 7.5 3H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L13 21a2.5 2.5 0 0 1-3-1.88z";

/*
 * ── THE SOURCE MARKS ────────────────────────────────────────────────────
 * One glyph per kind, drawn on the same 24-unit grid as every other icon in
 * this system so they sit at a common weight. They are deliberately literal —
 * a page, a speech bubble, a waveform — because a mark that needs a legend is
 * not doing a mark's job. Anything unrecognised falls back to a monogram,
 * which is what the port carried for every source before kinds existed.
 */
const SOURCE_MARK_D: Record<SourceKind, string> = {
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4",
  thread: "M21 12a8 8 0 0 1-8 8H4l2.2-2.6A8 8 0 1 1 21 12z",
  call: "M3 12h2.5l2-5 3 12 2.5-9 2 6H21",
  ticket:
    "M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z",
  code: "M9 17l-5-5 5-5M15 7l5 5-5 5",
  board: "M4 5h16v14H4zM10 5v14M4 11h6",
};

/**
 * A source's mark, at whatever size the caller needs.
 *
 * The tile is `bg-mrd-lift` in every case. Colour-coding the kinds was the
 * obvious idea and it is banned here: this system spends hue on status only,
 * and "this came from a call rather than a doc" is a category, not a status.
 * Six tinted tiles would put six meaningless colours on screen and quietly
 * teach the reader that hue means nothing.
 */
function SourceMark({ source, size }: { source: AnswerSource; size: 3 | 3.5 | 4 }) {
  const box = size === 3 ? "size-3" : size === 3.5 ? "size-3.5" : "size-4";
  const glyph = size === 3 ? 9 : size === 3.5 ? 10 : 11;
  const d = source.kind ? SOURCE_MARK_D[source.kind] : undefined;

  return (
    <span
      aria-hidden
      className={`grid ${box} shrink-0 place-items-center rounded-mrd-xs bg-mrd-lift text-mrd-mute`}
    >
      {d ? (
        <svg
          width={glyph}
          height={glyph}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={d} />
        </svg>
      ) : (
        <span className={size === 3 ? "text-[8px] font-medium" : "text-[9px] font-medium"}>
          {source.label.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}

/**
 * A citation sitting in the run of the text.
 */
function SourceChip({ source }: { source: AnswerSource }) {
  const body = (
    <>
      <SourceMark source={source} size={3} />
      <span className="max-w-32 truncate">{source.where ?? source.label}</span>
    </>
  );

  const className =
    "mr-1 inline-flex h-[18px] translate-y-[-1px] items-center gap-1 rounded-mrd-chip bg-mrd-sink px-1 align-middle font-mrd-mono text-[10.5px] text-mrd-body transition-colors duration-150 hover:bg-mrd-hover hover:text-mrd-ink";

  return (
    <span style={{ animation: "mrd-fade-in var(--mrd-d-move) var(--mrd-ease) both" }}>
      {source.href ? (
        <a href={source.href} target="_blank" rel="noreferrer" className={className}>
          {body}
        </a>
      ) : (
        <span className={className}>{body}</span>
      )}
    </span>
  );
}

export function StreamingText({
  parts = [],
  sources = [],
  followUps = [],
  onFollowUp,
  onRetry,
  onCopy,
  onRate,
  rating = null,
  error = null,
  emptyLabel = "No answer yet",
  emptyHint = "Ask a question and the answer is written here as it arrives.",
  revealMs = DEFAULT_REVEAL_MS,
  loop = false,
  loopHoldMs = 3400,
}: {
  /** The answer, as prose with its citations sitting inside the run. */
  parts?: AnswerPart[];
  /** Every document the answer leaned on, listed under the disclosure. */
  sources?: AnswerSource[];
  followUps?: string[];
  onFollowUp?: (question: string) => void;
  /** Also the way out of a failed read, so wire it whenever `error` can be set. */
  onRetry?: () => void;
  onCopy?: (text: string) => void;
  /**
   * Record what the reader thought of this answer. Passing `null` clears a
   * rating the reader is taking back, which matters: a thumb you cannot undo
   * is a thumb people stop pressing.
   *
   * Omit it and no rating controls render at all. See the note at the buttons.
   */
  onRate?: (rating: "up" | "down" | null) => void;
  /** The rating already on record, so the control shows what was said before. */
  rating?: "up" | "down" | null;
  /** Set when the answer could NOT be read. Never render this as an empty state. */
  error?: string | null;
  emptyLabel?: string;
  emptyHint?: string;
  /**
   * Milliseconds per CHARACTER, jittered per chunk. The default is the value
   * the founder asked for on 2026-08-14; see the timing note in the header
   * before changing it.
   */
  revealMs?: number;
  /**
   * Write the answer again after it settles. FOR DEMONSTRATION SURFACES ONLY —
   * the workbench and anything else whose job is to show what streaming looks
   * like. Never set it on a real answer: prose that rewrites itself under a
   * reader who is halfway through a sentence is a defect.
   */
  loop?: boolean;
  /** How long a looping answer stays complete before it rewrites. */
  loopHoldMs?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const chunks = useMemo(() => toChunks(parts), [parts]);
  const [count, setCount] = useState(0);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const seen = useSeen(hostRef, chunks.length > 0 && !reduced);

  // Restart the reveal whenever a new answer arrives, and skip it entirely
  // when the reader has asked for reduced motion.
  useEffect(() => {
    setCount(reduced ? chunks.length : 0);
  }, [chunks, reduced]);

  useEffect(() => {
    if (reduced || !seen) return;

    if (count < chunks.length) {
      const t = setTimeout(
        () => setCount((c) => c + 1),
        chunkDelay(chunks[count], count, revealMs),
      );
      return () => clearTimeout(t);
    }

    /*
     * The written answer holds, then writes itself again. Only where a surface
     * asks for it — a real answer that rewrote itself under the reader would
     * be a bug, not a demo. The workbench asks for it, because a component
     * that streams once on mount cannot be looked at.
     */
    if (loop && chunks.length > 0) {
      const t = setTimeout(() => setCount(0), loopHoldMs);
      return () => clearTimeout(t);
    }
  }, [count, chunks, reduced, revealMs, seen, loop, loopHoldMs]);

  const plain = useMemo(
    () =>
      parts
        .map((p) => (p.kind === "text" ? p.text : (p.source.where ?? p.source.label)))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    [parts],
  );

  const copy = useCallback(() => {
    if (onCopy) onCopy(plain);
    else void navigator.clipboard?.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [onCopy, plain]);

  /*
   * A FAILED READ. Deliberately not shaped like the empty state below: it
   * carries an outcome colour, states what went wrong in the reader's words,
   * and offers the way out. Someone who lands here must never conclude that
   * the workspace is simply empty.
   */
  /*
   * ── THE LEFT EDGE ──────────────────────────────────────────────────────
   * `border-left` on the rounded card, which is what this carried originally.
   *
   * It was briefly replaced with an inset pill-shaped bar held off the
   * corners, on the argument that a straight border mitred into a 12px radius
   * tapers at both ends. The founder looked at both on 2026-08-15 and called
   * it: the taper is the better read, and the floating bar is worse. He is
   * right, and the reasoning that replaced it was treating a property of the
   * shape as a defect — the border FOLLOWS the card's curve, which is what
   * ties it to the card instead of sitting on top of it. A detached bar has
   * to be positioned, and anything positioned can drift.
   *
   * The failure glyph on the heading stays, because it is what makes the
   * panel survive greyscale; that part was an addition, not a replacement.
   *
   * DO NOT "FIX" THIS BACK TO AN INSET BAR.
   */
  if (error) {
    return (
      <div
        data-mrd=""
        role="alert"
        className="w-full rounded-mrd-card bg-mrd-sink p-4"
        style={{ borderLeft: "2px solid var(--mrd-fail)" }}
      >
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-mrd-ink">
          <span className="shrink-0 text-mrd-fail">
            <Glyph d="M12 8v4M12 16h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" label="" />
          </span>
          The answer could not be read
        </p>
        <p className="mt-1 text-[13px] leading-[1.65] text-mrd-body">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex h-7 items-center gap-1.5 rounded-mrd-ctl bg-mrd-lift px-2.5 text-[12.5px] text-mrd-ink transition-colors duration-150 hover:bg-mrd-lift-hover"
          >
            <Glyph d={RETRY_D} label="" />
            Try again
          </button>
        )}
      </div>
    );
  }

  /*
   * EMPTY, which is the case this workspace is actually in today. Quiet, no
   * outcome colour, no alarm: nothing has gone wrong, nothing has been asked.
   */
  if (chunks.length === 0) {
    return (
      <div data-mrd="" className="w-full py-2">
        <p className="text-[13px] font-medium text-mrd-body">{emptyLabel}</p>
        <p className="mt-1 max-w-[68ch] text-[13px] leading-[1.65] text-mrd-mute">{emptyHint}</p>
      </div>
    );
  }

  const done = count >= chunks.length;

  return (
    /*
     * ── A FLOOR, SO THE ANSWER DOES NOT PUSH THE PAGE DOWN ──────────────
     * The reference sets `min-h-[15.5rem]` here and the port dropped it. It
     * matters most precisely when the reveal is working: the paragraph grows a
     * word at a time, and without a floor everything below the answer — the
     * actions, the sources, the follow-ups, and whatever the host surface puts
     * underneath — walks down the page for the whole four seconds it is being
     * written. Reserving the space makes the reveal feel like writing into a
     * page rather than like the page inflating.
     */
    <div data-mrd="" ref={hostRef} className="w-full" style={{ minHeight: "15.5rem" }}>
      <p
        className="text-[13px] leading-[1.65] text-mrd-ink"
        style={{ maxWidth: "var(--mrd-measure)" }}
        /*
         * A LOOPING ANSWER IS NOT ANNOUNCED. `aria-live` on prose that rewrites
         * itself every few seconds would read the whole answer to a screen
         * reader again on every pass, forever. The loop only ever runs on a
         * demonstration surface, where there is no answer to announce.
         */
        aria-live={loop ? "off" : "polite"}
        aria-busy={loop ? undefined : !done}
      >
        {chunks.slice(0, count).map((chunk, i) =>
          chunk.cite ? (
            <SourceChip key={i} source={chunk.cite} />
          ) : (
            /*
             * The reference resolves each word out of a blur. Meridian carries
             * no blur keyframe and this file may not add one, so the words fade
             * in instead. Fade rather than fade-up on purpose: a vertical
             * nudge on every word makes a paragraph of prose twitch as it
             * arrives, which is worse than no motion at all.
             */
            <span
              key={i}
              className="inline"
              style={{ animation: "mrd-fade-in var(--mrd-d-move) var(--mrd-ease-soft) both" }}
            >
              {chunk.word}{" "}
            </span>
          ),
        )}
        {/*
         * The caret carries the agent hue, because while it is on screen a
         * machine is still working. It is the same fact the rest of the product
         * states with that hue, and it is readable here before a single word
         * is. It stays ambient rather than urgent: nothing is being asked of
         * the reader while an answer writes itself.
         */}
        {!done && (
          <span
            aria-hidden
            className="ml-0.5 inline-block h-3 w-0.5 translate-y-0.5 rounded-full bg-mrd-agent"
            style={{ animation: "mrd-pixel-on 1.1s ease-in-out infinite" }}
          />
        )}
      </p>

      {/*
       * Actions and follow-ups stay mounted and fade in, so the block does not
       * change height at the moment the answer finishes. A jump there pulls the
       * reader's eye off the last sentence they were reading.
       */}
      <div
        className="mt-2 flex items-center gap-0.5 transition-opacity duration-300"
        style={{ opacity: done ? 1 : 0, pointerEvents: done ? "auto" : "none" }}
      >
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy answer"}
          className="flex size-6 items-center justify-center rounded-mrd-xs text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
        >
          {copied ? (
            <span className="text-mrd-pass">
              <Glyph d="M20 6L9 17l-5-5" label="" />
            </span>
          ) : (
            <Glyph d={COPY_D} label="" />
          )}
        </button>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            aria-label="Ask again"
            className="flex size-6 items-center justify-center rounded-mrd-xs text-mrd-mute transition-colors duration-100 hover:bg-mrd-hover hover:text-mrd-body"
          >
            <Glyph d={RETRY_D} label="" />
          </button>
        )}

        {/*
         * ── WAS THIS ANSWER ANY GOOD ────────────────────────────────────
         * The reference's third and fourth action icons, which the port had
         * dropped. They are worth having here for a reason beyond parity: this
         * product's whole argument is that a judgement recorded at the time is
         * worth more than one reconstructed later, and "that answer was wrong"
         * is exactly such a judgement — cheap to capture in the second the
         * reader notices, and unrecoverable an hour afterwards.
         *
         * RENDERED ONLY WHEN `onRate` IS WIRED, and that is deliberate rather
         * than defensive. A thumb that goes nowhere is a control that lies
         * about being heard, and a surface with nowhere to put the rating
         * should show no thumbs at all rather than swallow them.
         */}
        {onRate && (
          <>
            <button
              type="button"
              onClick={() => onRate(rating === "up" ? null : "up")}
              aria-label="This answer was useful"
              aria-pressed={rating === "up"}
              className={`flex size-6 items-center justify-center rounded-mrd-xs transition-colors duration-100 hover:bg-mrd-hover ${
                rating === "up" ? "text-mrd-ink" : "text-mrd-mute hover:text-mrd-body"
              }`}
            >
              <Glyph d={THUMB_UP_D} label="" />
            </button>
            <button
              type="button"
              onClick={() => onRate(rating === "down" ? null : "down")}
              aria-label="This answer was not useful"
              aria-pressed={rating === "down"}
              className={`flex size-6 items-center justify-center rounded-mrd-xs transition-colors duration-100 hover:bg-mrd-hover ${
                rating === "down" ? "text-mrd-ink" : "text-mrd-mute hover:text-mrd-body"
              }`}
            >
              <Glyph d={THUMB_DOWN_D} label="" />
            </button>
          </>
        )}

        {/*
         * The count is the length of the list, never a figure typed in beside
         * it. The reference hardcoded "10 sources" above three rows, and a
         * count that disagrees with what opening it shows is the fastest way to
         * lose a reader's trust in every other number on the screen.
         */}
        {sources.length > 0 && (
          <button
            type="button"
            aria-expanded={sourcesOpen}
            onClick={() => setSourcesOpen((open) => !open)}
            className="ml-1.5 flex items-center gap-1.5 rounded-mrd-xs px-1 py-0.5 text-[12px] text-mrd-body transition-colors duration-150 hover:bg-mrd-hover hover:text-mrd-ink"
          >
            {/*
             * The overlapping stack, which the port had dropped. It is not
             * decoration: it says HOW MANY and WHAT KIND before the disclosure
             * is opened, so a reader can tell an answer leaning on three call
             * recordings from one leaning on three tickets without a click.
             *
             * Capped at three with the ring drawn in the CONTAINING surface's
             * colour rather than in the page ground, so the overlap reads as a
             * stack rather than as three tiles with holes punched in them. Four
             * or more marks at 14px stop being separable and become a smudge,
             * and the number beside them is the exact figure anyway.
             */}
            <span aria-hidden className="flex -space-x-1">
              {sources.slice(0, 3).map((source) => (
                <span
                  key={source.label + (source.where ?? "")}
                  className="rounded-mrd-xs ring-2 ring-mrd-bg"
                >
                  <SourceMark source={source} size={3.5} />
                </span>
              ))}
            </span>
            {sources.length} {sources.length === 1 ? "source" : "sources"}
          </button>
        )}
      </div>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: done && sourcesOpen ? "1fr" : "0fr",
          opacity: done && sourcesOpen ? 1 : 0,
          transitionTimingFunction: "var(--mrd-ease)",
        }}
      >
        <div className="overflow-hidden">
          <div className="mt-1.5 flex flex-col rounded-mrd-ctl bg-mrd-sink p-1">
            {sources.map((source) => {
              const inner = (
                <>
                  <SourceMark source={source} size={4} />
                  {/*
                   * `min-w-0` is what actually lets the name truncate. A flex
                   * child's default `min-width: auto` refuses to shrink below
                   * its content, so without it a long source name pushes the
                   * path out of the row instead of ellipsing — the same defect
                   * the founder reported on the diff table.
                   */}
                  <span className="min-w-0 flex-1 truncate">{source.label}</span>
                  {source.where && (
                    <span className="ml-auto max-w-[45%] shrink-0 truncate font-mrd-mono text-[10.5px] text-mrd-mute">
                      {source.where}
                    </span>
                  )}
                </>
              );
              const cls =
                "flex items-center gap-2 rounded-mrd-xs px-1.5 py-1 text-[12px] text-mrd-body transition-colors duration-150 hover:bg-mrd-hover hover:text-mrd-ink";
              return source.href ? (
                <a
                  key={source.label + (source.where ?? "")}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className={cls}
                >
                  {inner}
                </a>
              ) : (
                <span key={source.label + (source.where ?? "")} className={cls}>
                  {inner}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {followUps.length > 0 && (
        <div
          className="mt-2.5 transition-opacity duration-300"
          style={{ opacity: done ? 1 : 0, pointerEvents: done ? "auto" : "none" }}
        >
          <p className="text-[12px] font-medium text-mrd-body">Follow-ups</p>
          <div className="mt-0.5 flex flex-col">
            {followUps.map((question, i) => (
              <button
                key={question}
                type="button"
                onClick={() => onFollowUp?.(question)}
                className="-mx-1.5 flex items-center gap-2 rounded-mrd-chip border-b border-mrd-line px-1.5 py-1.5 text-left text-[12.5px] text-mrd-ink transition-colors duration-100 hover:bg-mrd-hover"
                style={
                  done
                    ? {
                        animation: `mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) ${i * 90}ms both`,
                      }
                    : { opacity: 0 }
                }
              >
                <span className="shrink-0 text-mrd-mute">
                  <Glyph d={REPLY_D} label="" />
                </span>
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamingText;
