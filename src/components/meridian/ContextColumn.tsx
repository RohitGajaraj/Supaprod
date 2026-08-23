/**
 * Context column components for sidebar evidence/details.
 * Meridian styling, replacing primitives Ctx* components.
 */
import * as React from "react";

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

export function CtxRow({ mark, name, title, sub, onClick, href }: CtxRowProps) {
  // `data-mrd` was in this string as a CLASS. No `.data-mrd` rule exists in any
  // stylesheet, so it styled nothing; the attribute below is the real one.
  const className =
    "flex gap-mrd-2 py-mrd-1 px-mrd-2 rounded-mrd-ctl text-[12px] transition-colors";
  const hoverClass = onClick || href ? "hover:bg-mrd-hover cursor-pointer" : "";

  /* The name is truncated to one line, so the tooltip is also the only way to
     read a long one in full. That is the second thing the old `title || name`
     took away: it removed the hint AND the overflow escape in one move. */
  const content = (
    <>
      {mark && <div className="flex-shrink-0">{mark}</div>}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-mrd-ink truncate">{name}</div>
        {sub && <div className="text-[10px] text-mrd-mute truncate">{sub}</div>}
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
