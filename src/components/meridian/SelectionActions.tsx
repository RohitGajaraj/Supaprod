import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";

/*
 * SELECTION ACTIONS, hand a highlighted passage to an agent.
 *
 * ── PROVENANCE ──────────────────────────────────────────────────────────
 * Pattern source: https://www.beautifului.dev/ , component "Selection Actions"
 *                 (their file: components/SelectionActions.tsx), MIT licensed,
 *                 read from that page's own "View code" panel on 2026-08-14.
 * To re-check it: open that URL, find the component, press "View code". Do not
 * re-derive it from the rendered demo or a screenshot.
 * Ported to Meridian tokens. Full record: docs/design/REFERENCE-PATTERNS.md
 *
 * ── WHY THIS EXISTS IN THIS PRODUCT ─────────────────────────────────────
 * It lands on prose: the spec, the PRD, the release document. Today the only
 * way to get an agent to touch one paragraph of those is to describe the
 * paragraph in a composer somewhere else, which means retyping the thing you
 * are already pointing at. Selecting it IS the reference. That is the entire
 * value, and it is why the bar attaches to the selection rather than living in
 * a toolbar at the top of the page.
 *
 * ── THE SEAM, WHICH IS DIFFERENT FROM THE REFERENCE ─────────────────────
 * The reference wraps one hard-coded sentence in its own span and measures
 * that. It can, because it is a demo of itself. A real prose surface hands you
 * a DOM `Range` from the reader's own selection, over markup this component
 * has never seen, so `range` is the input here. Everything else follows from
 * it: the bar centres on the full selection bounds and sits under the LAST
 * line of it, which is the only placement that does not cover the text the
 * reader just chose.
 *
 * The highlight is drawn by this component too, as absolutely positioned
 * panels over the range's own client rects. That is deliberate. It means the
 * caller does not have to inject a wrapper element into its document to get
 * the passage marked, and it keeps the one decision about what colour a
 * selected passage is in the one file that is allowed to make it.
 *
 * ── WHAT THE COLOUR IS DOING ────────────────────────────────────────────
 * The passage is neutral while it is merely selected, because selecting is not
 * a status. Once the work is handed over, the highlight and the spinner take
 * `--mrd-agent`: a machine is working on exactly this text, and the reader can
 * see which words are in flight without reading the bar. If the edit comes
 * back broken, `--mrd-fail` states the outcome. Nothing here uses the hue that
 * means a person is required, because the person is already here with their
 * cursor in the document; the thing that needs them is the Keep or Discard
 * decision, and that is carried by the primary control's position, not a tint.
 *
 * ── WHAT WAS DROPPED, AND WHY ───────────────────────────────────────────
 * `iconoir-react` and the two atom imports are not dependencies here, so the
 * icons are inline SVG and the shimmer is built the way LoadingState builds
 * it. The reference also streams the rewrite into the passage in place; this
 * does not, and that is a decision rather than a shortcut. The one surface in
 * this product with real token streaming, the Ask pane, refuses a separate
 * reveal path in writing (`AskTurn.tsx`): the stream patches the same message,
 * so a half-written answer and a finished one are the same JSX and cannot
 * render differently. A Meridian component that did reveal prose a character at
 * a time existed until 2026-08-21 and was deleted, partly for that reason. So
 * there is no reveal engine to reach for here and there should not be a second
 * one. The result arrives when it arrives, and the caller renders it.
 */

export type SelectionAction = {
  key: string;
  /** What it does, in the reader's language. */
  label: string;
  icon?: ReactNode;
  /** Kept out of the collapsed bar until the reader opens the overflow. */
  secondary?: boolean;
};

export type SelectionPhase = "idle" | "working" | "result";

/*
 * ── THE ACTIONS, WITH THEIR ICONS ───────────────────────────────────────
 *
 * The bar rendered `action.icon` from the very first port and DEFAULT_ACTIONS
 * never supplied one, so every button shipped as a bare word. Founder caught
 * it on 2026-08-15: the reference gives each action a mark, and it should.
 *
 * The set now matches the reference's — Explain, Improve, Shorten, Tone,
 * Grammar — rather than the near-miss it carried before (which had "Tighten",
 * a second word for Shorten, and no Grammar at all).
 *
 * The glyphs are the reference's iconoir choices redrawn as inline SVG on the
 * same 24-unit grid as every other icon in this system. `iconoir-react` is not
 * a dependency here and adding a 1,500-icon package for five marks would be a
 * poor trade; redrawing five paths is not.
 */
const DEFAULT_ACTIONS: SelectionAction[] = [
  {
    key: "explain",
    label: "Explain",
    /* A question inside a speech bubble: ask about this passage. */
    icon: (
      <Icon>
        <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V9a5 5 0 0 1 5-5h5a8 8 0 0 1 8 8z" />
        <path d="M10.4 9.4a1.9 1.9 0 1 1 2.6 1.8c-.6.3-1 .8-1 1.5" />
        <path d="M12 16.2h.01" />
      </Icon>
    ),
  },
  {
    key: "improve",
    label: "Improve",
    /* A spark: make it better. The four-point star reads as "enhance" far more
       clearly at 14px than a wand or a plus does. */
    icon: (
      <Icon>
        <path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z" />
        <path d="M18.5 15.5l.7 1.9 1.8.6-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.6z" />
      </Icon>
    ),
  },
  {
    key: "shorten",
    label: "Shorten",
    /* Scissors: cut it down. */
    icon: (
      <Icon>
        <circle cx="6" cy="6" r="2.6" />
        <circle cx="6" cy="18" r="2.6" />
        <path d="M20 4L8.6 16.4M8.6 7.6L20 20" />
      </Icon>
    ),
    secondary: true,
  },
  {
    key: "tone",
    label: "Tone",
    /* A face: change how it reads, not what it says. */
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
        <path d="M9 9.5h.01M15 9.5h.01" />
      </Icon>
    ),
    secondary: true,
  },
  {
    key: "grammar",
    label: "Grammar",
    /* Lines in a box: fix the writing itself. */
    icon: (
      <Icon>
        <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
        <path d="M7 9.5h10M7 14.5h6" />
      </Icon>
    ),
    secondary: true,
  },
];

function Icon({
  children,
  size = 14,
  strokeWidth = 1.8,
}: {
  children: ReactNode;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/*
 * EVERY CONTROL IN THIS BAR TAKES AN INSET RING, and it is not a preference.
 * The pill clips its own contents — it has to, because it animates its width
 * between modes and un-clipped children would spill out of the rounded end
 * while it narrows. A clipping parent shears the outer half off an outset focus
 * ring, so a tabbed control comes back with a broken-looking half edge instead
 * of a ring. `mrd-focus-inset` moves the ring inside the control, which is what
 * that class exists for.
 */
const FOCUS_INSET =
  "mrd-focus-inset focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]";

const control = `inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] text-mrd-ink transition-[background-color,color,transform] duration-150 hover:bg-mrd-hover active:scale-[0.96] ${FOCUS_INSET}`;

/*
 * The primary is the next stop on the neutral ladder, not an inverted ink
 * block. The reference inverts. Meridian rejected a saturated or inverted
 * primary twice on the record, both times because it spends the product's one
 * accent on chrome, and this product needs that accent free to mean "a person
 * is required" somewhere that actually blocks.
 *
 * It carries the specular top edge every filled control in this system carries,
 * which is what stops it reading as a flat rectangle beside the unfilled
 * controls it sits next to.
 *
 * HOVER IS OPACITY, AND THE PREVIOUS ANSWER WAS BROKEN IN BOTH GROUNDS. This
 * used to hover to `--mrd-float`, which is a DARKER stop than `--mrd-solid` on
 * the dark ground — so the primary dimmed when a pointer landed on it — and on
 * paper `float` is very nearly white, so the same line turned a dark slab into
 * a pale one under a label that stays light in both grounds: an invisible word,
 * which is the exact defect `--mrd-on-solid` exists to prevent. Softening the
 * whole control fades fill and label together and cannot invert either ground.
 */
const primary = `inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-mrd-solid px-2.5 text-[12.5px] text-mrd-on-solid shadow-[inset_0_1px_0_var(--mrd-sheen)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.96] ${FOCUS_INSET}`;

type Box = { top: number; left: number; width: number; height: number };

export function SelectionActions({
  range,
  containerRef,
  actions = DEFAULT_ACTIONS,
  phase = "idle",
  workingLabel = "Working",
  error = null,
  onAction,
  onInstruction,
  onKeep,
  onDiscard,
  onRetry,
  placeholder = "Describe the edit",
}: {
  /** The reader's live selection. Null hides the bar entirely. */
  range: Range | null;
  /** The positioned ancestor the bar and the highlight are measured against. */
  containerRef: RefObject<HTMLElement | null>;
  actions?: SelectionAction[];
  phase?: SelectionPhase;
  workingLabel?: string;
  /** Set when the edit came back broken. Never rendered as a quiet nothing. */
  error?: string | null;
  onAction?: (action: SelectionAction) => void;
  /** A free-text instruction typed into the bar instead of picking an action. */
  onInstruction?: (text: string) => void;
  onKeep?: () => void;
  onDiscard?: () => void;
  onRetry?: () => void;
  placeholder?: string;
}) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [rects, setRects] = useState<Box[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [instruction, setInstruction] = useState("");
  /**
   * The width the bar had at the moment the reader started typing, held so it
   * does not shrink out from under them. See the note where it is captured.
   */
  const [typingWidth, setTypingWidth] = useState<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(0);
  const widthAnimation = useRef<Animation | null>(null);
  const previousMode = useRef<string | null>(null);

  const primaryActions = actions.filter((a) => !a.secondary);
  const secondaryActions = actions.filter((a) => a.secondary);
  const hasInstruction = instruction.trim().length > 0;

  /*
   * Measure inside a frame. A selection over wrapped prose produces one rect
   * per visual line, and reading them during layout thrash puts the bar at an
   * intermediate position for one paint, which shows up as a visible jump.
   */
  const place = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const host = containerRef.current;
      if (!host || !range) {
        setAnchor(null);
        setRects([]);
        return;
      }
      const lines = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
      const lastLine = lines.at(-1);
      if (!lastLine) {
        setAnchor(null);
        setRects([]);
        return;
      }
      const bounds = range.getBoundingClientRect();
      const hostBox = host.getBoundingClientRect();

      setRects(
        lines.map((r) => ({
          top: r.top - hostBox.top,
          left: r.left - hostBox.left,
          width: r.width,
          height: r.height,
        })),
      );
      // Centred on the whole selection, dropped under its final line.
      setAnchor({
        x: Math.round(bounds.left - hostBox.left + bounds.width / 2),
        y: Math.round(lastLine.bottom - hostBox.top + 8),
      });
    });
  }, [range, containerRef]);

  useLayoutEffect(() => {
    place();
  }, [place, phase, expanded, error]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const observer = new ResizeObserver(place);
    observer.observe(host);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [place, containerRef]);

  // Reset the local draft whenever the reader moves to a different passage.
  useEffect(() => {
    setInstruction("");
    setExpanded(false);
    setTypingWidth(null);
  }, [range]);

  /*
   * ── THE BAR CHANGES WIDTH, AND IT DOES IT AS A MOVE ─────────────────────
   *
   * Every mode swaps the entire contents of the pill: five actions and a field
   * become one spinner, then become Keep / Discard / retry. Left alone the pill
   * SNAPS from 380 pixels to 120 and back between paints, which reads as three
   * different objects appearing in the same place rather than as one object
   * responding. The reference animates the width across that swap and it is
   * most of why its bar feels like a physical thing; ours had dropped it.
   *
   * The mechanism is the reference's: measure the intrinsic width of the new
   * contents, animate from the width the bar actually had to that figure, and
   * let it return to `auto` afterwards so nothing is pinned. It runs in a
   * layout effect, before the browser paints, so the old width is never shown
   * against the new contents.
   *
   * REDUCED MOTION IS HONOURED HERE IN CODE rather than by the stylesheet's
   * keyframe rule, because a Web Animations API call is invisible to CSS. The
   * width is not information — the contents are — so it is decoration and it
   * stops.
   */
  const mode = error ? "error" : phase;

  useLayoutEffect(() => {
    const bar = barRef.current;
    const content = contentRef.current;
    if (!bar || !content) return;

    /* `+ 8` is the pill's own `p-1` on both sides: the frame around content. */
    const next = Math.ceil(content.getBoundingClientRect().width) + 8;
    const previous = lastWidthRef.current || Math.ceil(bar.getBoundingClientRect().width);
    const changed = previousMode.current !== null && previousMode.current !== mode;
    previousMode.current = mode;

    const still =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!changed || still || Math.abs(next - previous) <= 1) {
      lastWidthRef.current = next;
      return;
    }

    widthAnimation.current?.cancel();
    const animation = bar.animate([{ width: `${previous}px` }, { width: `${next}px` }], {
      duration: 320,
      /* `--mrd-ease` written out: the Web Animations API takes a string, and a
         var() reference in it is silently ignored rather than resolved. */
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    });
    widthAnimation.current = animation;
    animation.onfinish = () => {
      lastWidthRef.current = next;
      widthAnimation.current = null;
    };
  }, [mode]);

  /*
   * Keep the remembered width current while the CSS-driven parts of the bar
   * resize — opening the overflow, collapsing the presets — so the next mode
   * change animates from where the bar really is rather than from where it was
   * the last time a mode changed.
   */
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (widthAnimation.current?.playState === "running") return;
      lastWidthRef.current = Math.ceil(content.getBoundingClientRect().width) + 8;
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
      widthAnimation.current?.cancel();
    };
  }, []);

  if (!range || !anchor) return null;

  const working = phase === "working";
  /* While typing, the bar holds the width it had when the first character
     landed. See the note where `typingWidth` is captured. */
  const pinnedWidth = mode === "idle" && hasInstruction && typingWidth ? typingWidth : undefined;

  return (
    <>
      {/*
       * The highlight. Neutral while it is only selected; the agent hue once a
       * machine has been handed the passage, so the words in flight are
       * identifiable without reading the bar under them.
       */}
      {rects.map((r, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-mrd-xs transition-[background-color] duration-300"
          style={{
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            /*
             * A SELECTION, NOT A HOVER. This used to paint `--mrd-hover`, a
             * 4.5% whisper tuned to be almost imperceptible under a pointer,
             * so the passage the whole toolbar acts on was the faintest thing
             * on screen in both grounds. `--mrd-select` is its own token,
             * solved per ground, and roughly four times stronger.
             */
            background: working ? "var(--mrd-select-agent)" : "var(--mrd-select)",
            transitionTimingFunction: "var(--mrd-ease)",
          }}
        />
      ))}

      {/*
       * `data-mrd` goes here rather than on the component root, because the
       * root is a fragment and the spans above it are `aria-hidden` decoration
       * with nothing focusable in them. Every control this component owns is
       * inside this positioned wrapper, so this is the smallest element that
       * still covers all of them.
       */}
      <div
        data-mrd=""
        className="absolute top-0 left-0 z-10"
        style={{
          transform: `translate3d(${anchor.x}px, ${anchor.y}px, 0) translateX(-50%)`,
          transition: "transform var(--mrd-d-move) var(--mrd-ease)",
          willChange: "transform",
        }}
      >
        {/*
         * `overflow-hidden` is load-bearing rather than tidy: the pill animates
         * its own width between modes, and without a clip the outgoing contents
         * hang out of the rounded end while it narrows. `justify-center` is the
         * other half of the same effect — contents that are centred stay
         * centred through the move instead of being pinned to the left edge
         * while the right edge travels. Every control inside therefore carries
         * `mrd-focus-inset`; see the note on FOCUS_INSET.
         */}
        <div
          ref={barRef}
          role="toolbar"
          aria-label="Actions for the selected passage"
          className="flex h-9 w-fit max-w-[calc(100vw-48px)] items-center justify-center gap-0.5 overflow-hidden rounded-full bg-mrd-float p-1 font-mrd text-mrd-ink"
          style={{
            width: pinnedWidth,
            boxShadow: "var(--mrd-shadow-float)",
            /*
             * `pop-in`, not `fade-up`. A bar that attaches itself under a
             * passage is something arriving that was not there a moment ago,
             * which is the case that keyframe exists for; fade-up is for a row
             * joining a list it already belongs to.
             */
            animation: "mrd-pop-in var(--mrd-d-move) var(--mrd-ease) both",
          }}
        >
          <div
            ref={contentRef}
            className="flex w-fit shrink-0 items-center justify-center gap-0.5"
            style={{ width: pinnedWidth === undefined ? undefined : pinnedWidth - 8 }}
          >
            {/*
             * A FAILED EDIT. It states the outcome and offers the way back. It
             * does not fall silently to the idle bar, because a bar that simply
             * reappears unchanged reads as "nothing happened" rather than as
             * "that did not work", and the reader tries the same thing again.
             */}
            {error ? (
              <>
                <span className="inline-flex h-7 items-center gap-1.5 px-2.5 text-[12.5px] whitespace-nowrap text-mrd-prose text-mrd-body">
                  <span className="text-mrd-fail">
                    <Icon size={13} strokeWidth={2.2}>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4M12 16h.01" />
                    </Icon>
                  </span>
                  {error}
                </span>
                {onRetry && (
                  <button type="button" onClick={onRetry} className={primary}>
                    <Icon>
                      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
                    </Icon>
                    Try again
                  </button>
                )}
                {onDiscard && (
                  <button type="button" onClick={onDiscard} className={control}>
                    <Icon>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </Icon>
                    Dismiss
                  </button>
                )}
              </>
            ) : working ? (
              <span className="inline-flex h-7 items-center gap-1.5 px-2.5 text-[12.5px] whitespace-nowrap">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full border-[1.5px] border-mrd-edge border-t-mrd-agent"
                  style={{ animation: "mrd-spin 700ms linear infinite" }}
                />
                {/*
                 * Shimmer rather than pulse, for the reason LoadingState gives:
                 * a pulse changes the whole label's brightness and pulls the eye,
                 * a highlight travelling through it reads as "still going" in
                 * peripheral vision and stays quiet when looked at directly.
                 */}
                <span
                  className="bg-clip-text font-medium text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, var(--mrd-mute) 35%, var(--mrd-ink) 50%, var(--mrd-mute) 65%)",
                    backgroundSize: "200% 100%",
                    animation: "mrd-shimmer var(--mrd-d-alive) linear infinite",
                  }}
                >
                  {workingLabel}
                </span>
              </span>
            ) : phase === "result" ? (
              <>
                <button type="button" onClick={onKeep} className={primary}>
                  <Icon>
                    <path d="M20 6L9 17l-5-5" />
                  </Icon>
                  Keep
                </button>
                <button type="button" onClick={onDiscard} className={control}>
                  <Icon>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </Icon>
                  Discard
                </button>
                {onRetry && (
                  <>
                    <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-mrd-line" />
                    <button
                      type="button"
                      aria-label="Try again"
                      onClick={onRetry}
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-mrd-mute transition-[background-color,color,transform] duration-150 hover:bg-mrd-hover hover:text-mrd-prose text-mrd-body active:scale-[0.96] ${FOCUS_INSET}`}
                    >
                      <Icon>
                        <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
                      </Icon>
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {onInstruction && (
                  <form
                    /*
                     * The field takes over the width the presets are giving up,
                     * rather than the bar shrinking to fit the field. See the
                     * capture below: `- 40` is the send button and its gap, which
                     * is the one control that arrives as the presets leave.
                     */
                    className="flex h-7 shrink-0 items-center transition-[width] duration-300"
                    style={{
                      width: hasInstruction && typingWidth ? typingWidth - 40 : 140,
                      transitionTimingFunction: "var(--mrd-ease)",
                    }}
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (hasInstruction) onInstruction(instruction.trim());
                    }}
                  >
                    <input
                      value={instruction}
                      /*
                       * ── THE BAR MUST NOT SHRINK UNDER THE FIRST KEYSTROKE ───
                       * Typing collapses five preset buttons and a divider, which
                       * is most of the pill's width. Without this the bar lurches
                       * inward on the first character — the reader watches the
                       * thing they are typing into get smaller — and lurches back
                       * out if they delete it. So the width the bar HAD at that
                       * moment is captured once and held for as long as there is
                       * text, and released when the field is emptied. It is the
                       * reference's behaviour and this port had dropped it.
                       */
                      onChange={(event) => {
                        const next = event.target.value;
                        if (!hasInstruction && next.trim()) {
                          setTypingWidth(
                            Math.ceil(barRef.current?.getBoundingClientRect().width ?? 0),
                          );
                        } else if (!next.trim()) {
                          setTypingWidth(null);
                        }
                        setInstruction(next);
                      }}
                      aria-label="Describe the edit"
                      placeholder={placeholder}
                      className="h-7 w-full bg-transparent pr-2.5 pl-3 text-[12.5px] text-mrd-ink outline-none placeholder:text-mrd-mute"
                    />
                  </form>
                )}

                {/*
                 * The preset actions collapse away entirely once the reader
                 * starts typing, because at that point they have told us they
                 * want something the presets do not cover.
                 */}
                <div
                  className="flex min-w-0 items-center gap-0.5 overflow-hidden transition-[max-width,opacity,transform] duration-300"
                  style={{
                    maxWidth: hasInstruction ? 0 : expanded ? 460 : 240,
                    opacity: hasInstruction ? 0 : 1,
                    /* They travel a few pixels as they go, which is what makes
                     the collapse read as the presets LEAVING rather than as a
                     column of buttons being cropped in place. */
                    transform: hasInstruction ? "translateX(-8px)" : "translateX(0)",
                    transitionTimingFunction: "var(--mrd-ease)",
                  }}
                >
                  {onInstruction && (
                    <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-mrd-edge" />
                  )}

                  {primaryActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => onAction?.(action)}
                      className={control}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}

                  <div
                    className="flex min-w-0 items-center gap-0.5 overflow-hidden transition-[max-width,opacity,margin] duration-300"
                    style={{
                      maxWidth: expanded ? 260 : 0,
                      opacity: expanded ? 1 : 0,
                      marginLeft: expanded ? 2 : 0,
                      transitionTimingFunction: "var(--mrd-ease)",
                    }}
                  >
                    {secondaryActions.map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        onClick={() => onAction?.(action)}
                        className={control}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>

                  {secondaryActions.length > 0 && (
                    <>
                      <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-mrd-line" />
                      <button
                        type="button"
                        aria-label={expanded ? "Show fewer actions" : "Show more actions"}
                        aria-expanded={expanded}
                        onClick={() => setExpanded((open) => !open)}
                        /*
                         * The open state takes `--mrd-select`, not `--mrd-hover`.
                         * This chevron is a held-open toggle — the overflow stays
                         * out until it is pressed again — and a 4.5% wash is not
                         * a pressed state, it is a whisper under a pointer. The
                         * rotation says which way it is pointing; the fill says
                         * it is holding something open.
                         */
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-mrd-ink transition-[background-color,transform] duration-200 active:scale-[0.96] ${expanded ? "bg-mrd-select" : "hover:bg-mrd-hover"} ${FOCUS_INSET}`}
                      >
                        <span
                          className="flex transition-transform duration-300"
                          style={{
                            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                            transitionTimingFunction: "var(--mrd-ease)",
                          }}
                        >
                          <Icon>
                            <path d="M9 6l6 6-6 6" />
                          </Icon>
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {/*
                 * Send appears only once there is something to send, which keeps
                 * the collapsed bar as short as it can be. A pane is narrow and
                 * this bar floats inside prose; every control that is not needed
                 * yet is one that pushes the useful ones off the line.
                 */}
                {onInstruction && (
                  <div
                    className="flex min-w-0 items-center overflow-hidden transition-[max-width,opacity] duration-300"
                    style={{
                      maxWidth: hasInstruction ? 30 : 0,
                      opacity: hasInstruction ? 1 : 0,
                      transitionTimingFunction: "var(--mrd-ease)",
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Send edit instruction"
                      onClick={() => hasInstruction && onInstruction(instruction.trim())}
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-mrd-solid text-mrd-on-solid shadow-[inset_0_1px_0_var(--mrd-sheen)] transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.94] ${FOCUS_INSET}`}
                    >
                      <Icon size={16} strokeWidth={2.4}>
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </Icon>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default SelectionActions;
