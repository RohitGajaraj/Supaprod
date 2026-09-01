import * as React from "react";

/**
 * ── CLAMPED TEXT THAT ALWAYS HAS A WAY IN ────────────────────────────────
 *
 * Added to Meridian 2026-09-01 under the founder's grant to close gaps in the
 * system rather than work around them per surface.
 *
 * THE REPORT: *"everywhere, the text is getting truncated ... this truncation
 * is the major problem. That's not the right UI/UX part ... either shorten it
 * or give only the summary that it has required. Use wherever that's necessary
 * to get to the inside and give a clickable action."*
 *
 * ── THE DEFECT, STATED PRECISELY ─────────────────────────────────────────
 * There are two ways to shorten text and this product had only the bad one.
 *
 *   A SUMMARY is a shorter thing that is COMPLETE. It ends. A reader who stops
 *   there has lost nothing, because what was cut was detail rather than
 *   substance.
 *
 *   A TRUNCATION is a longer thing with its end removed. It does not end, it
 *   STOPS. The reader is told, by the ellipsis, that there is more -- and then
 *   given nothing to press.
 *
 * A truncation with no way in is the worst of the three options available,
 * worse than showing everything and worse than summarising: it costs the space
 * a summary would have cost AND advertises that the reader is missing
 * something. This component makes the third option impossible to ship by
 * accident: it clamps, and the affordance is part of the same object, so a
 * clamp cannot exist without its way in.
 *
 * ── WHY IT MEASURES RATHER THAN COUNTS CHARACTERS ────────────────────────
 * A character cap is wrong at both ends. At 160 characters a short line in a
 * narrow column is still cut, and a long line in a wide one is padded out with
 * space nobody wanted. Worse, it makes the decision at BUILD time, so the same
 * string is cut identically on a 13in laptop and a 32in monitor -- which is the
 * founder's standing objection to fixed sizing, in a second form.
 *
 * `-webkit-line-clamp` cuts by RENDERED LINES, so the same text shows more of
 * itself when there is more room and the control appears only when the text
 * genuinely overflows the space it was given. `scrollHeight > clientHeight`
 * is the measurement, taken after layout and re-taken on resize, so a person
 * dragging a window never sees a "Show more" for text that now fits.
 *
 * ── THE CONTROL IS A BUTTON, WHICH IS NOT A DETAIL ───────────────────────
 * `title=` was the pattern this replaces in several places, and it is not an
 * answer: it never appears on touch, it never appears for a keyboard user, and
 * a screen reader's treatment of it is inconsistent. A real button is
 * focusable, announces its state through `aria-expanded`, and works on a phone.
 */
export function Reveal({
  children,
  lines = 3,
  more = "Show more",
  less = "Show less",
  className = "",
}: {
  children: React.ReactNode;
  /** How many lines survive before the clamp. */
  lines?: number;
  more?: string;
  less?: string;
  className?: string;
}) {
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [clipped, setClipped] = React.useState(false);

  /*
   * MEASURED AFTER LAYOUT AND AGAIN ON RESIZE. A single measurement on mount is
   * wrong twice: web fonts land after first paint and reflow the block, and the
   * column this sits in changes width whenever the rail collapses or the window
   * is dragged. `ResizeObserver` on the element itself catches both, including
   * the case a viewport listener misses -- a pane resizing while the window
   * does not.
   */
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => {
      // Only meaningful while clamped: expanded, scrollHeight === clientHeight.
      if (open) return;
      setClipped(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    /* GUARDED, and this is not defensive dressing: happy-dom implements no
       ResizeObserver, so an unguarded `new ResizeObserver` throws on mount and
       takes down every test that renders a surface using this. Two of the five
       converted surfaces have mounting suites (`AskDecisionCard.test.tsx`,
       `VerifyCockpit.test.tsx`). Same shape as `RunTimeline.tsx` and
       `SidebarNav.tsx`, which hit this first. The one-shot `measure()` above
       still runs there, so the component degrades to "measured once". */
    const Observer = typeof ResizeObserver === "undefined" ? null : ResizeObserver;
    const obs = Observer ? new Observer(measure) : null;
    obs?.observe(el);
    return () => obs?.disconnect();
  }, [open, children]);

  return (
    <div data-mrd="" className={className}>
      <div
        ref={bodyRef}
        style={
          open
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
                overflow: "hidden",
              }
        }
      >
        {children}
      </div>
      {/*
        DRAWN ONLY WHEN THE TEXT ACTUALLY OVERFLOWS. A "Show more" under a
        paragraph that already fits is noise, and it teaches a reader to stop
        believing the control -- which is how they come to ignore it on the one
        card where something really is hidden.

        `!open` is not enough on its own: once expanded the measurement is
        meaningless (the box grew to fit), so `clipped` is frozen at its last
        clamped value and the collapse control rides on it.
      */}
      {clipped || open ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mt-mrd-2 rounded-mrd-xs text-mrd-label text-mrd-mute underline underline-offset-2 transition-colors hover:text-mrd-ink"
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          {open ? less : more}
        </button>
      ) : null}
    </div>
  );
}
