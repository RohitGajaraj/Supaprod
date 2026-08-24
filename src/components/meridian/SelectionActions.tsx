/**
 * THE BAR A PASSAGE SELECTION PUTS OVER ITS OWN WORDS.
 *
 * ── WHAT IT IS ──────────────────────────────────────────────────────────
 * A reader selects a passage of prose -- in a textarea, or in rendered text --
 * and this bar appears anchored to those words and hands them to an agent. It
 * serves two hosts: the spec editor's markdown textarea through
 * `measureSelectionRects`, and rendered document prose through `rangeToRects`.
 *
 * NOT the same component as Discover's local `SelectionBar`, which takes a
 * `Selection` of ROW IDS, a total and a noun. Nothing on that API can hold a
 * passage, and nothing here can hold rows. The near-name is reported in both
 * headers rather than merged away.
 *
 * ── THE FOUR PHASES ─────────────────────────────────────────────────────
 *
 *   idle     Nothing handed. The verbs wait beside your words.
 *   working  Handed over, and the crew is on it.
 *   ready    It came back. Keep it or throw it away.
 *   error    It came back broken. Say so, honestly, and offer the way out.
 *
 * The bar renders whenever the loop is anywhere other than fully at rest:
 * hidden ONLY when `rects` is null AND phase is idle. A selection that has been
 * handed off keeps its highlight and its bar even after the host drops the
 * native selection -- the reader must still be able to see WHAT is being worked
 * on.
 *
 * ── WHY RECTS, NOT A RANGE ───────────────────────────────────────────────
 * The component takes `rects: Array<{x,y,width,height}> | null` rather than a
 * live DOM `Range`. Rects are the common denominator both hosts produce: a
 * textarea via the mirror-div measurement below, rendered prose by walking a
 * real Range's `getClientRects()` (`rangeToRects`). Coordinates are CLIENT
 * coordinates, because that is what both producers yield natively and what
 * fixed positioning consumes without offset-parent arithmetic.
 *
 * ── MEASUREMENT: THE MIRROR DIV, AND THE PITCH IT MEASURES ──────────────
 * `measureSelectionRects(textarea)` clones the field's typography into an
 * off-screen mirror div, replays the value up to `selectionEnd` with invisible
 * marker spans dropped at `selectionStart`, and reads the markers' offsets
 * back as geometry.
 *
 * THE DEFECT THIS VERSION FIXES, reproduced in a live browser 2026-08-24: the
 * old code classified a selection as single-line or multi-line by comparing
 * the two markers' TOPS against HALF A GUESSED line height -- guessed as
 * `parseFloat(computedLineHeight)` or, when that reads "normal", as
 * fontSize x 1.5. On a field whose computed line-height is `normal`, a
 * SINGLE-line selection whose markers sat one visual row apart (the end marker
 * after wrapped text) measured a delta far above half the guess, took the
 * multi-line path, and sprouted PHANTOM BANDS below the real row. The washes
 * painted over lines the reader never selected and the bar anchored against a
 * fiction, so it landed ON the words. Under scroll the drift grew.
 *
 * The fix is to stop guessing the row pitch and MEASURE it from the mirror
 * itself: a probe span one forced break below the end marker returns the true
 * distance from one row's top to the next, whatever the field's line-height
 * resolves to. Same-row classification and every band height read from that
 * one number.
 *
 * Empty selection returns null; callers treat null as "nothing to attach to".
 */

import * as React from "react";
import { Input } from "./forms";
import { Action } from "./surface-parts";

/** One measured band of a selection, in client coordinates. */
export type SelectionRect = { x: number; y: number; width: number; height: number };

/** Where the handoff loop stands. See the header for the four in plain words. */
export type SelectionPhase = "idle" | "working" | "ready" | "error";

/** One verb the caller offers for the selected passage. */
export type SelectionAction = { key: string; label: string; onRun: () => void };

/** What came back from the agent, held as a pair until Keep or Discard settles it. */
export type SelectionProposal = { before: string; after: string };

/** Space between the bar and the passage it anchors to. */
const BAR_GAP = 6;
/** Minimum distance between the bar and its clamp container's edges. */
const EDGE_PAD = 8;

/* ------------------------------------------------------------------ *
 * Measurement helpers
 * ------------------------------------------------------------------ */

/**
 * Flatten a DOM Range into per-client-rect bands, for prose consumers that
 * hold a real Range. The rendered-document host converts with this; the
 * textarea host uses `measureSelectionRects` instead.
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

/**
 * Measure a textarea's current selection into client-coordinate rects, using
 * the mirror-div technique described in the header. Returns null for an empty
 * (or degenerate) selection.
 *
 * One rect when the selection sits on one visual line. Across a wrapped or
 * multi-line span: first row, full-width middle band, last row. The row pitch
 * every one of those heights reads is MEASURED off this mirror with a probe
 * mark, not derived from a style string that may say "normal".
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
  const cs = getComputedStyle(ta);
  const fallbackPitch =
    Number.isFinite(parseFloat(cs.lineHeight)) && parseFloat(cs.lineHeight) > 0
      ? parseFloat(cs.lineHeight)
      : parseFloat(cs.fontSize) * 1.6;
  const openAt = (mark: string) => `<span data-mark="${mark}"></span>`;
  // The pitch probe sits ONE FORCED BREAK below the end marker, so
  // probe.top - end.top is the mirror's true distance from one row's top to
  // the next. It only shifts content AFTER itself, which nothing reads.
  mirror.innerHTML =
    openAt("start") +
    value.slice(0, end).replace(/\n/g, "<br>") +
    openAt("end") +
    "<br>" +
    openAt("pitch") +
    value.slice(end).replace(/\n/g, "<br>");
  document.body.appendChild(mirror);

  try {
    const startMark = mirror.querySelector<HTMLElement>('[data-mark="start"]');
    const endMark = mirror.querySelector<HTMLElement>('[data-mark="end"]');
    const pitchMark = mirror.querySelector<HTMLElement>('[data-mark="pitch"]');
    if (!startMark || !endMark || !pitchMark) return null;
    const a = { top: startMark.offsetTop, left: startMark.offsetLeft };
    const b = { top: endMark.offsetTop, left: endMark.offsetLeft };
    const measuredPitch = pitchMark.offsetTop - b.top;
    const rowH = Math.max(Number.isFinite(measuredPitch) && measuredPitch > 0 ? measuredPitch : 0, fallbackPitch);

    // Marker offsets are read from the mirror's border edge and already carry
    // its padding, so the client origin is the FIELD's border edge shifted by
    // whatever the field itself has scrolled away. `clientLeft`/`clientTop`
    // ARE the border widths; adding getComputedStyle's again would count them
    // twice.
    const originX = tr.left + ta.clientLeft - ta.scrollLeft;
    const originY = tr.top + ta.clientTop - ta.scrollTop;
    const contentW = mirror.clientWidth;

    if (Math.abs(b.top - a.top) < rowH / 2) {
      const width = Math.max(b.left - a.left, 2);
      return [{ x: originX + a.left, y: originY + a.top, width, height: rowH }];
    }

    const rects: Array<SelectionRect> = [];
    rects.push({
      x: originX + a.left,
      y: originY + a.top,
      width: Math.max(contentW - a.left, 8),
      height: rowH,
    });
    const midTop = originY + a.top + rowH;
    const midBottom = originY + b.top;
    if (midBottom - midTop > 1) {
      rects.push({ x: originX, y: midTop, width: contentW, height: midBottom - midTop });
    }
    rects.push({ x: originX, y: midBottom, width: Math.max(b.left, 8), height: rowH });
    return rects;
  } finally {
    mirror.remove();
  }
}

/* ------------------------------------------------------------------ *
 * Placement
 * ------------------------------------------------------------------ */

/**
 * WHERE THE BAR GOES, decided once as arithmetic so tests can hold it without
 * a layout engine. Above the TOPMOST band by `BAR_GAP`; flipped BELOW the
 * BOTTOM-most band when the above position clips the container's top edge;
 * clamped horizontally inside the container by `EDGE_PAD` either side. The
 * anchor column is the topmost band's left edge, so the bar points at where
 * the reader started selecting.
 */
export function placeSelectionBar(
  bands: Array<SelectionRect>,
  container: { left: number; top: number; right: number; bottom: number },
  barWidth: number,
  barHeight: number,
): { left: number; top: number } {
  const first = bands.reduce((acc, r) => (r.y < acc.y ? r : acc), bands[0]);
  const last = bands.reduce((acc, r) => (r.y + r.height > acc.y + acc.height ? r : acc), bands[0]);

  let top = first.y - barHeight - BAR_GAP;
  if (top < container.top + EDGE_PAD) {
    top = last.y + last.height + BAR_GAP;
    // No room below either (the passage fills the container): sit on the
    // container floor rather than drifting outside the document the reader
    // is looking at.
    if (top + barHeight > container.bottom - EDGE_PAD) {
      top = Math.max(container.bottom - EDGE_PAD - barHeight, first.y + first.height + BAR_GAP);
    }
  }

  const minLeft = container.left + EDGE_PAD;
  const maxLeft = Math.max(minLeft, container.right - EDGE_PAD - barWidth);
  const left = Math.min(Math.max(first.x, minLeft), maxLeft);
  return { left, top };
}

/* ------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------ */

/**
 * One line of the float menu, carried over from `MoreMenu`'s `MoreItem` so the
 * two floating surfaces wear the same face: rounded control, nine-by-seven
 * padding, body text stepping to ink over the hover wash.
 */
function MenuItem({
  children,
  onClick,
  emphasized = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  /** Slight weight, for the one affirmative verb in a group (Keep, Ask). */
  emphasized?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-mrd-ctl px-[9px] py-[7px] text-left text-mrd-base whitespace-nowrap transition-colors hover:bg-mrd-hover hover:text-mrd-ink ${
        emphasized ? "font-medium text-mrd-ink" : "text-mrd-body"
      }`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {children}
    </button>
  );
}

/**
 * A hairline between groups of menu items. `MoreMenu` stacks one flat list, so
 * it draws none of these; this bar carries whole phases (a verdict beside its
 * verbs), and a rule between phases is the system's own separator token doing
 * its job.
 */
function MenuDivider() {
  return <div aria-hidden="true" className="mx-[3px] border-t border-mrd-line" />;
}

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
   * Fired by Escape OUTSIDE the ask field. Inside the field, Escape belongs to
   * the field: it collapses back to the verbs and the handoff stays. Same
   * deviation record as before -- surface-parts.tsx described internal hiding,
   * but the parent owns the mode, so the parent is told instead.
   */
  onDismiss?: () => void;
}) {
  const resting = !rects && phase === "idle";
  const barRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  const [askOpen, setAskOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    if (resting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The ask field handles its own Escape (collapse the field) and stops
      // the event before it reaches here; this gate is the belt to those
      // braces, covering the case where focus sits in the field but the event
      // was retargeted.
      const t = e.target as HTMLElement | null;
      if (t && barRef.current?.contains(t) && t.tagName === "INPUT") return;
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
   * FOCUS, SET IMPERATIVELY RATHER THAN TRUSTED TO `autoFocus`. autoFocus
   * fires once at mount and loses every race: anything else that claims focus
   * in the same commit window leaves the field permanently dead to the
   * keyboard, which reads exactly as "this affordance does not accept typing".
   * An effect that reclaims focus whenever the field OPENS cannot lose that
   * race, because it runs after the whole commit settles.
   */
  React.useEffect(() => {
    if (askOpen) inputRef.current?.focus();
  }, [askOpen]);

  /*
   * Two-pass positioning: render, then measure the bar's real box against the
   * container's real box, then place. The arithmetic lives in
   * `placeSelectionBar` so tests can hold it without a browser.
   */
  React.useLayoutEffect(() => {
    const c = containerRef.current;
    const bar = barRef.current;
    if (!c || !bar || resting || !rects?.length) {
      setPos(null);
      return;
    }
    const cr = c.getBoundingClientRect();
    const placed = placeSelectionBar(rects, cr, bar.offsetWidth, bar.offsetHeight);
    // Same answer, same object: this effect intentionally runs on every render
    // (the bar's own size changes with what it carries), so it must not hand
    // back a fresh tuple each time or it renders itself forever.
    setPos((prev) =>
      prev && prev.left === placed.left && prev.top === placed.top ? prev : placed,
    );
  });

  if (resting) return null;

  const positioned = pos !== null;

  const submitInstruction = () => {
    const t = draft.trim();
    if (!t) return;
    onInstruct?.(t);
    setDraft("");
    setAskOpen(false);
  };

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
      {/* THE FLOAT MENU SURFACE, CARRIED OVER FROM `MoreMenu`: the card radius,
          the hairline border, the float ground, one small padding all round,
          the floating shadow, and the pop-in entrance. z-index matches the
          reference's z-[5]. */}
      <div
        ref={barRef}
        role="toolbar"
        aria-label="Edit the selected passage"
        data-mrd=""
        className="fixed z-[5] flex min-w-[168px] max-w-[min(92vw,34rem)] flex-col rounded-mrd-card border border-mrd-line bg-mrd-float p-1 shadow-mrd-float"
        style={{
          left: pos?.left ?? 0,
          top: pos?.top ?? 0,
          visibility: positioned ? "visible" : "hidden",
          animation: "mrd-pop-in var(--mrd-d-move) var(--mrd-ease)",
        }}
      >
        {phase === "working" ? (
          <p className="px-[9px] py-[7px] text-mrd-base text-mrd-mute" aria-live="polite">
            {workingLabel}
          </p>
        ) : null}

        {phase === "error" && error ? (
          <>
            <p role="alert" className="max-w-[36ch] px-[9px] py-[7px] text-mrd-base leading-mrd-prose text-mrd-body">
              {error}
            </p>
            <MenuDivider />
            {onRetry ? (
              <MenuItem onClick={onRetry} emphasized>
                Try again
              </MenuItem>
            ) : null}
            <MenuItem onClick={() => onDismissError?.()}>Dismiss</MenuItem>
          </>
        ) : null}

        {phase === "ready" && proposal ? (
          <>
            <div className="flex gap-mrd-3 px-mrd-1 py-mrd-1">
              {/* Typographic contrast only: before reads muted, after reads
                  normal. No strikethrough, no syntax colouring -- this is a
                  pair of passages, not a compiler diagnostic. */}
              <figure className="min-w-0 flex-1">
                <figcaption className="mb-mrd-1 text-[11px] tracking-wide text-mrd-faint uppercase">
                  Before
                </figcaption>
                <p className="max-h-40 overflow-y-auto text-[13px] leading-mrd-prose whitespace-pre-wrap text-mrd-mute">
                  {proposal.before}
                </p>
              </figure>
              <figure className="min-w-0 flex-1">
                <figcaption className="mb-mrd-1 text-[11px] tracking-wide text-mrd-faint uppercase">
                  After
                </figcaption>
                <p className="max-h-40 overflow-y-auto text-[13px] leading-mrd-prose whitespace-pre-wrap text-mrd-ink">
                  {proposal.after}
                </p>
              </figure>
            </div>
            <MenuDivider />
            {onKeep ? (
              <MenuItem onClick={onKeep} emphasized>
                Keep
              </MenuItem>
            ) : null}
            {onDiscard ? <MenuItem onClick={onDiscard}>Discard</MenuItem> : null}
          </>
        ) : null}

        {phase === "idle" ? (
          <>
            {actions.map((a) => (
              <MenuItem key={a.key} onClick={a.onRun}>
                {a.label}
              </MenuItem>
            ))}
            {onInstruct ? (
              <>
                {actions.length > 0 ? <MenuDivider /> : null}
                {askOpen ? (
                  <form
                    className="flex items-center gap-mrd-2 px-mrd-1 py-mrd-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitInstruction();
                    }}
                  >
                    {/* A REAL MERIDIAN FIELD, per forms.tsx: the sink ground,
                        the field border that steps up on focus (focus:, not
                        focus-visible:, because a text control is focused by
                        clicking into it as often as by tabbing), h-8, the
                        control radius. Focus lands through the ref effect
                        above, so no mount-order race can leave it dead. */}
                    <div className="w-52">
                      <Input
                        ref={inputRef}
                        aria-label="Instruction for the selected passage"
                        placeholder={'Try "Make this tighter"'}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            submitInstruction();
                          } else if (e.key === "Escape") {
                            // ESCAPE COLLAPSES THE FIELD, NOT THE HANDOFF.
                            // Stopping propagation keeps the window-level
                            // dismissal from hearing the key.
                            e.preventDefault();
                            e.stopPropagation();
                            setDraft("");
                            setAskOpen(false);
                          }
                        }}
                      />
                    </div>
                    <Action type="submit" variant="default" disabled={!draft.trim()}>
                      Ask
                    </Action>
                  </form>
                ) : (
                  <MenuItem onClick={() => setAskOpen(true)}>Ask AI to edit</MenuItem>
                )}
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
