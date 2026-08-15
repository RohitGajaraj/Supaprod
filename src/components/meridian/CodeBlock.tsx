import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/*
 * CODE BLOCK, agent written code arriving a line at a time.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Code Block"
 *                 (their file: components/CodeBlock.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * The `<pre>` at `traces.$traceId` carries a comment claiming it clips and
 * scrolls. It does neither. A long file pushes every control below it off the
 * screen and the page grows to whatever the agent happened to write, which is
 * the one dimension the reader cannot predict. This block caps its own height
 * and scrolls inside it, which is the entire fix, and the streaming treatment
 * is what makes the cap tolerable while the code is still arriving.
 *
 * ── THE COLOURS, WHICH ARE NOT SYNTAX COLOURS ───────────────────────────
 * Their scheme tints keywords, strings and numbers three different hues.
 * Meridian cannot spend hue that way: green and red are outcome, so a green
 * string literal reads as "this passed", and the number tint they use is a
 * colour this system does not have at all.
 *
 * So the ladder here is neutral and it ranks by a real question: how much of
 * this line did the agent DECIDE? A reviewer scanning generated code is not
 * looking for the keywords, which the language dictated, but for the names and
 * the literals, which the agent chose. So chosen things sit at the top of the
 * text ladder, language scaffolding sits at the bottom, and the block passes a
 * greyscale test by being greyscale.
 *
 *      names and literals   --mrd-ink     the agent picked these
 *      identifiers          --mrd-body    the working level
 *      keywords             --mrd-mute    the language, not the author
 *      punctuation          --mrd-faint   structure you read past
 *
 * One hue survives, and it earns it: the caret is `--mrd-agent`, because a
 * caret moving is the single most direct statement in the product that a
 * machine is writing right now. `--mrd-pass` appears once, on "Copied", where
 * it reports an outcome that actually happened.
 */

export type CodeTone = "kw" | "str" | "num" | "fn" | "dim";

/** One run of characters, and how much of it the agent chose. */
export type CodeToken = { t: string; c?: CodeTone };

const TONE: Record<CodeTone, string> = {
  fn: "var(--mrd-ink)",
  str: "var(--mrd-ink)",
  num: "var(--mrd-ink)",
  kw: "var(--mrd-mute)",
  dim: "var(--mrd-faint)",
};

export function CodeBlock({
  filename,
  language,
  lines,
  streaming = false,
  maxHeight = 320,
  emptyLabel = "No code was produced.",
  revealPerLineMs,
  loop = false,
}: {
  filename: string;
  /** Shown beside the filename. Omit where the extension already says it. */
  language?: string;
  /** The code. Empty is a real case and gets its own line, not a blank box. */
  lines: CodeToken[][];
  /** True while the agent is still writing. Shows the caret and follows the tail. */
  streaming?: boolean;
  /** The cap this component exists to enforce, in px. */
  maxHeight?: number;
  emptyLabel?: string;
  /**
   * Write the code out a line at a time, at this interval. Omit it and every
   * line renders at once, which is right for a file that already exists.
   *
   * This is a DIFFERENT thing from `streaming`. `streaming` says the caller is
   * still appending lines and drives the caret and the tail-follow; this says
   * "reveal the lines I already have, progressively", which is what makes the
   * behaviour demonstrable on a workbench and what the reference does.
   */
  revealPerLineMs?: number;
  /** Only meaningful with `revealPerLineMs`: write it again after it settles. */
  loop?: boolean;
}) {
  /** Three states, because a copy that failed must not look like one that
   *  never happened. See the note on `copy` below. */
  const [copied, setCopied] = useState<"no" | "yes" | "failed">("no");
  const resetAt = useRef<number | undefined>(undefined);
  const scroller = useRef<HTMLPreElement>(null);

  /*
   * Derived, never a second copy. Their version keeps the plain text in a RAW
   * constant beside the token array, so an edit to one silently ships a Copy
   * button that hands over different code from the one on screen.
   */
  const raw = useMemo(
    () => lines.map((line) => line.map((tok) => tok.t).join("")).join("\n"),
    [lines],
  );

  useEffect(() => () => window.clearTimeout(resetAt.current), []);

  /*
   * Follow the tail while it streams. A block that caps its height and then
   * writes below the fold has replaced one problem with a worse one: the
   * reader can see that something is happening and not what.
   */

  /*
   * ── COPY, AND WHY IT HAS A SECOND PATH ──────────────────────────────────
   *
   * The founder's report on 2026-08-15 was that the copy button never works.
   * The async clipboard API is not reliably available: it is undefined outside
   * a secure context, it can be refused by permission policy, and inside an
   * iframe without `clipboard-write` allowed it rejects. In every one of those
   * cases the old code hit an early `return` or an empty rejection handler and
   * the button simply did nothing — no copy, and no sign that anything had
   * been attempted, which is the worst of the three possible outcomes.
   *
   * So there are now three states, not two: copied, FAILED, and idle. A button
   * that cannot do its job has to say so, because a reader who believes they
   * copied something and pastes stale content is worse off than one who knows
   * it failed and selects the text by hand.
   *
   * The fallback is the old `execCommand` route via an off-screen textarea. It
   * is deprecated and it is also the only thing that works in the contexts
   * above, so it stays until it genuinely stops functioning. It is deliberately
   * NOT the primary path: it forces a layout and a selection change, which the
   * async API avoids.
   */
  const copy = useCallback(() => {
    if (!raw) return;

    const settle = (ok: boolean) => {
      setCopied(ok ? "yes" : "failed");
      window.clearTimeout(resetAt.current);
      resetAt.current = window.setTimeout(() => setCopied("no"), ok ? 1500 : 2400);
    };

    const legacy = () => {
      try {
        const pad = document.createElement("textarea");
        pad.value = raw;
        /* Off-screen rather than hidden: a `display:none` textarea cannot be
           selected, so the copy silently yields an empty string. */
        pad.setAttribute("readonly", "");
        pad.style.position = "fixed";
        pad.style.top = "-9999px";
        pad.style.opacity = "0";
        document.body.appendChild(pad);
        pad.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(pad);
        settle(ok);
      } catch {
        settle(false);
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(raw).then(() => settle(true), legacy);
      return;
    }
    legacy();
  }, [raw]);

  /*
   * ── THE PROGRESSIVE REVEAL ──────────────────────────────────────────────
   * Lines appear one at a time when the caller asks for it. The reference does
   * this at 240ms a line with a 3.2s hold before it starts over, and the effect
   * is most of why its code block reads as "an agent is writing" rather than as
   * a static snippet.
   *
   * `shown` is capped at `lines.length` rather than being reset by it, so a
   * caller that APPENDS while revealing does not restart from the top.
   */
  const [shown, setShown] = useState(0);
  const reveal = revealPerLineMs !== undefined && lines.length > 0;

  useEffect(() => {
    if (!reveal) return;
    if (shown < lines.length) {
      const t = window.setTimeout(() => setShown((n) => n + 1), revealPerLineMs);
      return () => window.clearTimeout(t);
    }
    if (loop) {
      const t = window.setTimeout(() => setShown(0), 3200);
      return () => window.clearTimeout(t);
    }
  }, [reveal, shown, lines.length, revealPerLineMs, loop]);

  const visible = reveal ? lines.slice(0, shown) : lines;
  /* The caret belongs on the last visible line while anything is still to come
     — either the caller is appending, or the reveal has not caught up. */
  const writing = streaming || (reveal && shown < lines.length);

  /*
   * Follow the tail. A block that caps its height and then writes below the
   * fold has replaced one problem with a worse one: the reader can see that
   * something is happening and not what.
   *
   * Declared HERE rather than beside the other effects because it depends on
   * `shown`, and an effect placed above that `const` would read it in its own
   * dependency array during render — before the binding is initialised, which
   * is a temporal-dead-zone crash rather than a stale value.
   */
  useEffect(() => {
    if (!scroller.current) return;
    if (!streaming && revealPerLineMs === undefined) return;
    scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [lines.length, shown, streaming, revealPerLineMs]);

  const empty = lines.length === 0;

  return (
    <div
      data-mrd=""
      className="w-full max-w-95 overflow-hidden rounded-mrd-card bg-mrd-sheet font-mrd"
      style={{ boxShadow: "var(--mrd-shadow-card)" }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-mrd-line px-2.5 py-1.5">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate font-mrd-mono text-[12px] font-medium text-mrd-ink">
            {filename}
          </span>
          {language && <span className="shrink-0 text-[11px] text-mrd-mute">{language}</span>}
        </span>

        <button
          type="button"
          aria-label="Copy code"
          onClick={copy}
          disabled={empty}
          className={`flex h-6 shrink-0 items-center gap-1 rounded-mrd-xs px-1.5 text-[11px] font-medium transition-colors duration-100 enabled:hover:bg-mrd-hover disabled:cursor-default disabled:opacity-40 ${
            copied === "yes"
              ? "text-mrd-pass"
              : copied === "failed"
                ? "text-mrd-fail"
                : "text-mrd-mute enabled:hover:text-mrd-ink"
          }`}
        >
          {copied === "yes" ? (
            <svg
              aria-hidden
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg
              aria-hidden
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="12" height="12" rx="2.5" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          {copied === "yes" ? "Copied" : copied === "failed" ? "Press ⌘C" : "Copy"}
        </button>
      </div>

      {/*
       * The cap and the scroll, which is the whole reason this replaces the
       * hand-rolled `<pre>`. `maxHeight` rather than a fixed height, so a four
       * line file stays four lines tall instead of sitting in a tall empty box.
       */}
      <pre
        ref={scroller}
        className="overflow-auto bg-mrd-sink px-3 py-2.5 font-mrd-mono text-[12px] leading-[1.7]"
        style={{ maxHeight }}
        tabIndex={0}
      >
        {empty ? (
          <span className="font-mrd text-[12px] text-mrd-mute">
            {streaming ? "Waiting for the first line." : emptyLabel}
          </span>
        ) : (
          visible.map((line, i) => (
            <div
              key={i}
              className="flex"
              style={{
                animation: "mrd-fade-up 250ms cubic-bezier(0.23,1,0.32,1) both",
              }}
            >
              {/*
               * The gutter is unselectable so that a drag-copy of the code
               * does not carry line numbers into whatever it is pasted in.
               * 1.86 against the line's 1.7 is what sits the numeral on the
               * baseline of a smaller glyph; it is an alignment value, not a
               * rhythm one, and it moves if either size moves.
               */}
              <span className="w-5 shrink-0 text-right text-[11px] leading-[1.86] text-mrd-faint select-none">
                {i + 1}
              </span>
              <span className="pl-2.5 whitespace-pre">
                {line.map((tok, j) => (
                  <span
                    key={j}
                    style={{
                      color: tok.c ? TONE[tok.c] : "var(--mrd-body)",
                      fontWeight: tok.c === "fn" ? 500 : undefined,
                    }}
                  >
                    {tok.t}
                  </span>
                ))}
                {/* On the last VISIBLE line: the caret marks where writing has
                    reached, which during a reveal is not the end of the file. */}
                {writing && i === visible.length - 1 && (
                  <span
                    aria-hidden
                    className="ml-0.5 inline-block h-3 w-[3px] translate-y-0.5 rounded-full bg-mrd-agent"
                  />
                )}
              </span>
            </div>
          ))
        )}
      </pre>
    </div>
  );
}

export default CodeBlock;
