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
      className="text-mrd-t-nano font-mrd-w-650 uppercase tracking-mrd-track text-mrd-mute"
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
  const className =
    "flex gap-mrd-s2 py-mrd-s1 px-mrd-s2 rounded-mrd-ctl text-mrd-t-sm transition-colors data-mrd";
  const hoverClass = onClick || href ? "hover:bg-mrd-hover cursor-pointer" : "";

  const displayName = title || name;

  const content = (
    <>
      {mark && <div className="flex-shrink-0">{mark}</div>}
      <div className="flex-1 min-w-0">
        <div className="font-mrd-w-500 text-mrd-ink truncate">{displayName}</div>
        {sub && <div className="text-mrd-t-nano text-mrd-mute truncate">{sub}</div>}
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

  return (
    <div
      onClick={onClick}
      className={`${className} ${hoverClass}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-mrd=""
    >
      {content}
    </div>
  );
}

export interface CtxBodyProps {
  children: React.ReactNode;
}

export function CtxBody({ children }: CtxBodyProps) {
  return (
    <p className="text-mrd-t-sm leading-mrd-lh-relaxed text-mrd-body" data-mrd="">
      {children}
    </p>
  );
}
