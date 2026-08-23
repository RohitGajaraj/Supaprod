/**
 * Context column components for sidebar evidence/details.
 * Meridian styling, replacing primitives Ctx* components.
 */
import * as React from "react";

import { SourceMark } from "@/components/meridian/source-marks";

export interface CtxHeadProps {
  children: React.ReactNode;
}

export function CtxHead({ children }: CtxHeadProps) {
  return (
    <h3
      className="mrd-eyebrow"
      data-mrd=""
    >
      {children}
    </h3>
  );
}

export interface CtxRowProps {
  key?: string | number;
  mark?: React.ReactNode;
  /** The row's `signals.source`. Draws the brand mark, or the kind mark, or
   *  nothing. Ignored when an explicit `mark` is passed. */
  source?: string | null;
  /** The one row that earns the spotlight. At most ONE per column: a row can
   *  only look important if the rows beside it agree not to. */
  lead?: boolean;
  name?: React.ReactNode;
  /**
   * THE HOVER HINT, AND IT USED TO EAT THE ROW'S NAME.
   *
   * This was `React.ReactNode` and the body read `const displayName = title ||
   * name`, so a caller passing both got the hint rendered AS the name and no
   * tooltip at all. Proven in a render on 2026-08-21: `<CtxRow name="GitHub"
   * title="Open this source in Settings, Connections" />` printed
   * `"Open this source in Settings, Connections"` and emitted no `title`
   * attribute.
   *
   * Every caller in the tree meant a tooltip, and all three are on Discover's
   * context rail, so all three were showing a sentence about a door where the
   * thing behind the door belongs. The worst was "What backs this", the evidence
   * under a cluster: it passed `name={signalPreview(s.content, 96)}` and
   * `title={`Open the source: ${s.url}`}`, so the quote a person is being asked
   * to trust was replaced by its own URL. **A section whose entire job is to
   * show the evidence verbatim was showing the address instead.**
   *
   * It is `string` now rather than `ReactNode` because that is what an HTML
   * `title` can carry, and the narrower type is what stops the two roles being
   * confused again: a node cannot be a tooltip, so it cannot be passed as one.
   */
  title?: string;
  sub?: React.ReactNode;
  onClick?: () => void | Promise<void>;
  href?: string;
}

export function CtxRow({ mark, name, title, sub, source, lead, onClick, href }: CtxRowProps) {
  // `data-mrd` was in this string as a CLASS. No `.data-mrd` rule exists in any
  // stylesheet, so it styled nothing; the attribute below is the real one.
  /*
   * THE SPACING, REBUILT 2026-08-23. Founder: "every word is stuck and very
   * close to each other, especially on the right side... back to back, back to
   * back. There is no proper differentiation, and there is no proper spotlight."
   *
   * Measured before the fix: `py-mrd-1` is 2px, and the name and its subtitle
   * were two stacked divs with NO gap. So the whole vertical budget between one
   * row's subtitle and the next row's name was 4px, and every piece of text on
   * the rail sat between 10px and 12px. Nothing could be a spotlight because
   * nothing had room and nothing had size.
   *
   * `py-mrd-4` is 10px, which is the step this ladder actually has for one row
   * to the next. 8px was the reflex and Meridian has no 8px on purpose: 2, 4, 6,
   * 10 is non-linear so adjacent steps stay visibly different, and squeezing an
   * 8 between 6 and 10 would put three values inside four pixels, which is the
   * type defect this session just removed, rebuilt in spacing.
   */
  const className = lead
    ? "flex gap-mrd-inline py-mrd-4 px-mrd-3 rounded-mrd-ctl bg-mrd-lift transition-colors"
    : "flex gap-mrd-inline py-mrd-4 px-mrd-3 rounded-mrd-ctl transition-colors";
  const hoverClass = onClick || href ? "hover:bg-mrd-hover cursor-pointer" : "";

  /* The name is truncated to one line, so the tooltip is also the only way to
     read a long one in full. That is the second thing the old `title || name`
     took away: it removed the hint AND the overflow escape in one move. */
  /*
   * THE MARK IS THE ONLY COLOURED THING ON THE ROW, and that is what makes a
   * brand hue safe here. The founder asked for real logos so a reader connects
   * a row to Slack or a call without reading; the 2026-07-13 ruling had said
   * monotone because a brand hue in a list competes with the state a person has
   * to act on. Both are right, and the conflict was never the hue, it was TWO
   * coloured marks in one row. So the source mark takes the leading slot and
   * carries the colour, and state is carried by the row's ground and its chip
   * rather than by a second dot. One colour system per row.
   */
  const glyph = mark ?? (source ? <SourceMark source={source} size={16} /> : null);
  const content = (
    <>
      {glyph && <div className="flex-shrink-0">{glyph}</div>}
      {/* `gap-mrd-pair` rather than a margin on the subtitle: the gap belongs to
          the RELATIONSHIP between the two lines, not to one of them, so it
          cannot go missing when a caller renders the name without a subtitle. */}
      <div className="flex min-w-0 flex-1 flex-col gap-mrd-pair">
        <div className={lead ? "mrd-subtitle truncate" : "text-mrd-base font-medium text-mrd-ink truncate"}>
          {name}
        </div>
        {sub && <div className="text-mrd-tiny text-mrd-mute truncate">{sub}</div>}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={`${className} ${hoverClass}`} title={title} data-mrd="">
        {content}
      </a>
    );
  }

  /**
   * A ROW THAT DOES SOMETHING IS A REAL `<button>`.
   *
   * This branch was `<div onClick role="button" tabIndex={0}>` with no
   * `onKeyDown`. A div does not natively activate on Enter or Space, so the row
   * was reachable by Tab, announced itself as a button and took the focus ring,
   * then did nothing when operated. Focusable and announced but inert is worse
   * than not being focusable at all.
   *
   * `text-left` and `w-full` come with the element rather than being extra
   * polish: a button centres its content and shrinks to fit, and this row's
   * whole layout assumes full width with the text against the left edge.
   */
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${className} ${hoverClass} w-full text-left`}
        title={title}
        data-mrd=""
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${className} ${hoverClass}`} title={title} data-mrd="">
      {content}
    </div>
  );
}

export interface CtxBodyProps {
  children: React.ReactNode;
}

export function CtxBody({ children }: CtxBodyProps) {
  return (
    <p className="text-mrd-small leading-[1.625] text-mrd-body" data-mrd="">
      {children}
    </p>
  );
}
