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
      className="text-[10px] font-[650] uppercase tracking-mrd-label text-mrd-mute"
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
  title?: React.ReactNode;
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

  const displayName = title || name;

  const content = (
    <>
      {mark && <div className="flex-shrink-0">{mark}</div>}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-mrd-ink truncate">{displayName}</div>
        {sub && <div className="text-[10px] text-mrd-mute truncate">{sub}</div>}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={`${className} ${hoverClass}`} data-mrd="">
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
        data-mrd=""
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`${className} ${hoverClass}`} data-mrd="">
      {content}
    </div>
  );
}

export interface CtxBodyProps {
  children: React.ReactNode;
}

export function CtxBody({ children }: CtxBodyProps) {
  return (
    <p className="text-[12px] leading-[1.625] text-mrd-prose text-mrd-body" data-mrd="">
      {children}
    </p>
  );
}
