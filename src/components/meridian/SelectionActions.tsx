/**
 * THE BAR A PASSAGE SELECTION PUTS OVER ITS OWN WORDS.
 *
 * ── WHAT IT IS ──────────────────────────────────────────────────────────
 * A reader selects a passage of prose -- in a textarea today, in rendered text
 * tomorrow -- and this bar appears anchored to those words and hands them to an
 * agent. It lands on the spec editor first, then the PRD and the release
 * document. It shares three quarters of its name with `BulkBar` (the row-count
 * strip) and none of its job; the two were named apart on purpose, see
 * `surface-parts.tsx` around BulkBar's header for the collision record.
 *
 * NOT the same component as Discover's local `SelectionBar`, which takes a
 * `Selection` of ROW IDS, a total and a noun. Nothing on that API can hold a
 * passage, and nothing here can hold rows. The near-name is reported in both
 * headers rather than merged away.
 *
 * ── THE FOUR PHASES, IN THE FOUNDER'S WORDS ─────────────────────────────
 *
 *   idle     Nothing handed. The verbs wait beside your words.
 *   working  Handed over, and the crew is on it.
 *   ready    It came back. Keep it or throw it away.
 *   error    It came back broken. Say so, honestly, and offer the way out.
 *
 * The bar renders whenever the loop is anywhere other than fully at rest:
 * hidden ONLY when `rects` is null AND phase is idle. A selection that has been
 * handed off keeps its highlight and its bar even after the textarea itself
 * drops the native selection to button focus -- the reader must still be able
 * to see WHAT is being worked on.
 *
 * ── WHY RECTS, NOT A RANGE ───────────────────────────────────────────────
 * The component takes `rects: Array<{x,y,width,height}> | null` rather than a
 * live DOM `Range`. A textarea's selection is two integers (`selectionStart` /
 * `selectionEnd`) with no Range object and no client geometry at all -- the
 * most common prose host here cannot feed a Range-based API. Rects are the
 * common denominator both hosts can produce: a textarea via the mirror-div
 * measurement below (`measureSelectionRects`), rendered prose by walking a
 * real Range's `getClientRects()` (`rangeToRects`). Coordinates are CLIENT
 * coordinates, because that is what both producers yield natively and what
 * fixed positioning consumes without offset-parent arithmetic.
 *
 * ── MEASUREMENT: THE MIRROR DIV ──────────────────────────────────────────
 * `measureSelectionRects(textarea)` clones the field's typography into an
 * off-screen mirror div, replays the value up to `selectionEnd` with invisible
 * marker spans dropped at `selectionStart`, and reads the markers' offsets
 * back as geometry. One rect when the selection sits on one visual line;
 * first-line / middle-band / last-line approximation across a wrapped or
 * multi-line span -- good enough to anchor a toolbar and wash the passage,
 * which is all v1 claims. Empty selection returns null; callers treat null as
 * "nothing to attach to".
 */

import * as React from "react";
import { Action, Actions } from "./surface-parts";
import { Input } from "./forms";

/** One measured band of a selection, in client coordinates. */
export type SelectionRect = { x: number; y: number; width: number; height: number };

/** Where the handoff loop stands. See the header for the four in plain words. */
export type SelectionPhase = "idle" | "working" | "ready" | "error";

/** One verb the caller offers for the selected passage. */
export type SelectionAction = { key: string; label: string; onRun: () => void };

/** What came back from the agent, held as a pair until Keep or Discard settles it. */
export type SelectionProposal = { before: string; after: string };

const BAR_GAP = 8;
const EDGE_PAD = 8;

/* ------------------------------------------------------------------ *
 * Measurement helpers
 * ------------------------------------------------------------------ */

/**
 * Flatten a DOM Range into per-client-rect bands, for prose consumers that
 * hold a real Range. Provided so the next consumer (rendered markdown, not a
 * textarea) converts rather than reinvents; the spec editor's textarea path
 * uses `measureSelectionRects` instead.
 */
export function rangeToRects(range: Range): Array<SelectionRect> {
  return Array.from(range.getClientRects()).map((r) => ({
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
  }));
}

/** Styles a mirror needs to lay text out exactly as the source field does. */
const MIRROR_STYLE_KEYS = [
  "boxSizing",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "textIndent",
  "tabSize",
  "wordSpacing",
  "wordBreak",
  "overflowWrap",
  "whiteSpace",
] as const;

function mirrorStyleFor(ta: HTMLTextAreaElement): Record<string, string> {
  const cs = getComputedStyle(ta);
  const picked: Record<string, string> = {};
  for (const k of MIRROR_STYLE_KEYS) picked[k] = String(cs[k] ?? "");
  // The mirror must wrap at the same measure. Content-box width minus borders
  // reproduces the field's writable area whatever box-sizing the caller chose.
  picked.boxSizing = "content-box";
  picked.width = `${ta.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)}px`;
  picked.whiteSpace = "pre-wrap";
  picked.overflowWrap = "break-word";
  return picked;
}

/** Where a zero-width marker span landed, relative to the mirror's content box. */
function markerOffset(mark: HTMLElement): { top: number; left: number } {
  return { top: mark.offsetTop, left: mark.offsetLeft };
}

/**
 * Measure a textarea's current selection into client-coordinate rects, using
 * the mirror-div technique: clone the field's typography, replay the value up
 * to the selection end with markers at the start, and read the markers back.
 * Returns null for an empty (or degenerate) selection.
 *
 * Multi-line spans come back as three bands -- the first line from the start
 * marker to the line's end, the full-width middle band, and the last line up
 * to the end marker. An honest v1 approximation; refine per-line when a
 * consumer actually needs pixel-exact multi-line washes.
 */
export function measureSelectionRects(ta: HTMLTextAreaElement): Array<SelectionRect> | null {
  if (typeof document === "undefined") return null;
  const start = ta.selectionStart ?? 0;
  const end = ta.selectionEnd ?? 0;
  if (!(end > start)) return null;
  const value = ta.value ?? "";

  const mirror = document.createElement("div");
  const style = mirrorStyleFor(ta);
  for (const [k, v] of Object.entries(style)) {
    if (v !== "") (mirror.style as unknown as Record<string, string>)[k] = v;
  }
  mirror.setAttribute("aria-hidden", "true");
  const s = mirror.style;
  s.position = "fixed";
  s.visibility = "hidden";
  s.top = "-9999px";
  s.left = "-9999px";

  const tr = ta.getBoundingClientRect();
  const openAt = (mark: string) => `<span data-mark="${mark}"></span>`;
  mirror.innerHTML =
    openAt("start") +
    value.slice(0, end).replace(/\n/g, "<br>") +
    openAt("end") +
    value.slice(end).replace(/\n/g, "<br>");
  document.body.appendChild(mirror);

  try {
    const startMark = mirror.querySelector<HTMLElement>('[data-mark="start"]');
    const endMark = mirror.querySelector<HTMLElement>('[data-mark="end"]');
    if (!startMark || !endMark) return null;
    const a = markerOffset(startMark);
    const b = markerOffset(endMark);

    const cs = getComputedStyle(ta);
    const declaredLine = parseFloat(cs.lineHeight);
    const lineH =
      Number.isFinite(declaredLine) && declaredLine > 0 ? declaredLine : parseFloat(cs.fontSize) * 1.5;
    // Marker offsets are read from the mirror's border edge and already carry
    // its padding, so the client origin is the FIELD's border edge shifted by
    // whatever the field itself has scrolled away. `clientLeft`/`clientTop`
    // ARE the border widths; adding getComputedStyle's again would count them
    // twice.
    const originX = tr.left + ta.clientLeft - ta.scrollLeft;
    const originY = tr.top + ta.clientTop - ta.scrollTop;
    const contentW = mirror.clientWidth;

    const toClient = (o: { top: number; left: number }) => ({
      x: originX + o.left,
      y: originY + o.top,
    });
    const p0 = toClient(a);
    const p1 = toClient(b);

    if (Math.abs(b.top - a.top) < lineH / 2) {
      const width = Math.max(p1.x - p0.x, 2);
      return [{ x: p0.x, y: p0.y, width, height: lineH }];
    }

    const rects: Array<SelectionRect> = [];
    rects.push({ x: p0.x, y: p0.y, width: Math.max(contentW - a.left, 8), height: lineH });
    const midTop = p0.y + lineH;
    const midBottom = p1.y;
    if (midBottom - midTop > 1) {
      rects.push({ x: p0.x - a.left, y: midTop, width: contentW, height: midBottom - midTop });
    }
    rects.push({ x: p0.x - a.left, y: p1.y, width: Math.max(p1.x - (p0.x - a.left), 8), height: lineH });
    return rects;
  } finally {
    mirror.remove();
  }
}

/* ------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------ */

/**
 * The anchored toolbar itself. Renders nothing while nothing is handed off
 * (`rects` null AND phase idle); otherwise paints a subtle wash over each
 * measured band and floats the verbs above the topmost one, dropping below
 * when there is no room and clamping inside the container horizontally.
 */
export function SelectionActions({
  rects,
  containerRef,
  phase = "idle",
  workingLabel = "The crew is on your words.",
  error = null,
  actions = [],
  onInstruct,
  proposal = null,
  onKeep,
  onDiscard,
  onDismissError,
  onRetry,
  onDismiss,
}: {
  /** Measured bands of the live selection, client coordinates; null when none. */
  rects: Array<SelectionRect> | null;
  /** The element the bar clamps itself inside -- usually the prose host itself. */
  containerRef: React.RefObject<HTMLElement | null>;
  phase?: SelectionPhase;
  /** Said once while working. Name the work, never the machinery. */
  workingLabel?: string;
  error?: string | null;
  actions?: Array<SelectionAction>;
  /** Fired with the trimmed instruction from the inline ask field. */
  onInstruct?: (instruction: string) => void;
  proposal?: SelectionProposal | null;
  onKeep?: () => void;
  onDiscard?: () => void;
  onDismissError?: () => void;
  onRetry?: () => void;
  /**
   * Fired by Escape. DEVIATION FROM THE DOCUMENTED ASPIRATION, recorded
   * because it is load-bearing: surface-parts.tsx described a component that
   * hides itself on Escape with no callback. Hiding internally would desync
   * the caller, which still holds the captured selection and the loop state --
   * the parent owns the mode, so the parent must be told it ended. Same rule
   * BulkBar follows: every mode in this product leaves by Escape, audibly.
   */
  onDismiss?: () => void;
}) {
  const resting = !rects && phase === "idle";
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  const [askOpen, setAskOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    if (resting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onDismiss?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resting, onDismiss]);

  // Leave the collapsed ask state behind when the whole bar leaves, so the
  // next selection opens on the verbs rather than on a leftover field.
  React.useEffect(() => {
    if (resting) {
      setAskOpen(false);
      setDraft("");
    }
  }, [resting]);

  /*
   * Two-pass positioning: render, then measure the bar's real box against the
   * container's real box, then place. Above the topmost band by default;
   * below the last band when there is no room above; clamped inside the
   * container horizontally. Re-runs when phase changes because the bar's own
   * height changes with what it carries.
   */
  React.useLayoutEffect(() => {
    const c = containerRef.current;
    const bar = barRef.current;
    if (!c || !bar || resting) {
      setPos(null);
      return;
    }
    const cr = c.getBoundingClientRect();
    const bw = bar.offsetWidth;
    const bh = bar.offsetHeight;
    const anchor = rects?.[0];
    let top: number;
    if (anchor) {
      top = anchor.y - bh - BAR_GAP;
      if (top < cr.top + EDGE_PAD) {
        const lastBand = rects![rects!.length - 1];
        top = lastBand.y + lastBand.height + BAR_GAP;
      }
    } else {
      top = cr.top + EDGE_PAD;
    }
    let left = anchor ? anchor.x : cr.left;
    left = Math.min(Math.max(left, cr.left + EDGE_PAD), Math.max(cr.left + EDGE_PAD, cr.right - bw - EDGE_PAD));
    // Same answer, same object: this effect intentionally runs on every render
    // (the bar's own size changes with what it carries), so it must not hand
    // back a fresh tuple each time or it renders itself forever.
    setPos((prev) => (prev && prev.left === left && prev.top === top ? prev : { left, top }));
  });

  if (resting) return null;

  const positioned = pos !== null;

  return (
    <>
      {rects?.map((r, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="pointer-events-none fixed rounded-[3px]"
          style={{
            left: r.x,
            top: r.y,
            width: r.width,
            height: r.height,
            background: "var(--mrd-hover)",
            boxShadow: "inset 0 0 0 1px var(--mrd-edge)",
          }}
        />
      ))}
      <div
        ref={barRef}
        role="toolbar"
        aria-label="Edit the selected passage"
        data-mrd=""
        className={`fixed z-50 flex max-w-[min(92vw,34rem)] flex-col gap-mrd-2 rounded-mrd-ctl border border-mrd-edge bg-mrd-float p-mrd-2 shadow-lg`}
        style={{
          left: pos?.left ?? 0,
          top: pos?.top ?? 0,
          visibility: positioned ? "visible" : "hidden",
        }}
      >
        {phase === "working" ? (
          <p className="px-mrd-1 py-mrd-1 text-[13px] text-mrd-mute" aria-live="polite">
            {workingLabel}
          </p>
        ) : null}

        {phase === "error" && error ? (
          <div className="flex flex-col gap-mrd-2">
            <p role="alert" className="px-mrd-1 text-[13px] leading-mrd-prose text-mrd-body">
              {error}
            </p>
            <Actions>
              {onRetry ? (
                <Action variant="primary" onClick={onRetry}>
                  Try again
                </Action>
              ) : null}
              <Action variant="quiet" onClick={onDismissError}>
                Dismiss
              </Action>
            </Actions>
          </div>
        ) : null}

        {phase === "ready" && proposal ? (
          <div className="flex flex-col gap-mrd-2">
            <div className="grid grid-cols-2 gap-mrd-2">
              {/* Typographic contrast only: before reads muted, after reads
                  normal. No strikethrough, no syntax colouring -- this is a
                  pair of passages, not a compiler diagnostic. */}
              <figure className="min-w-0">
                <figcaption className="mb-mrd-1 text-[11px] tracking-wide text-mrd-faint uppercase">
                  Before
                </figcaption>
                <p className="max-h-40 overflow-y-auto text-[13px] leading-mrd-prose whitespace-pre-wrap text-mrd-mute">
                  {proposal.before}
                </p>
              </figure>
              <figure className="min-w-0">
                <figcaption className="mb-mrd-1 text-[11px] tracking-wide text-mrd-faint uppercase">
                  After
                </figcaption>
                <p className="max-h-40 overflow-y-auto text-[13px] leading-mrd-prose whitespace-pre-wrap text-mrd-ink">
                  {proposal.after}
                </p>
              </figure>
            </div>
            <Actions>
              {onKeep ? (
                <Action variant="primary" onClick={onKeep}>
                  Keep
                </Action>
              ) : null}
              {onDiscard ? (
                <Action variant="quiet" onClick={onDiscard}>
                  Discard
                </Action>
              ) : null}
            </Actions>
          </div>
        ) : null}

        {phase === "idle" ? (
          <>
            {actions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-mrd-2">
                {actions.map((a) => (
                  <Action key={a.key} variant="quiet" onClick={a.onRun}>
                    {a.label}
                  </Action>
                ))}
              </div>
            ) : null}
            {onInstruct ? (
              askOpen ? (
                <form
                  className="flex items-center gap-mrd-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const t = draft.trim();
                    if (!t) return;
                    onInstruct(t);
                    setDraft("");
                    setAskOpen(false);
                  }}
                >
                  <Input
                    autoFocus
                    aria-label="Instruction for the selected passage"
                    placeholder={'Try "Make this tighter" or "Turn into bullets"'}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <Action type="submit" variant="default">
                    Ask
                  </Action>
                </form>
              ) : (
                <div>
                  <Action variant="quiet" onClick={() => setAskOpen(true)}>
                    Ask AI to edit
                  </Action>
                </div>
              )
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
