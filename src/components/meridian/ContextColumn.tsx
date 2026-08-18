/**
 * Context sidebar components: CtxHead, CtxRow, CtxBody.
 *
 * A narrow column beside the main surface, holding context: what is feeding
 * this desk, who is reading for you, what backs the decision in focus.
 *
 * Lifted from primitives.tsx as part of Meridian adoption.
 *
 * Meridian rendering:
 * - data-mrd root
 * - Uses --mrd-* tokens only
 * - No retired component tokens
 */

import * as React from "react";

/** The section header: uppercase micro-label. */
export function CtxHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="block text-[10px] font-[650] tracking-mrd-label text-mrd-mute uppercase">
      {children}
    </h3>
  );
}

/**
 * A row in the context column.
 *
 * Left slot holds a mark (agent, crew, you). Right slot holds the main fact
 * (name) and a secondary fact (sub).
 *
 * A row with `onClick` renders as a button with a hand cursor. A row without
 * it is text. Both use the same padding and alignment.
 */
export function CtxRow({
  mark,
  name,
  sub,
  title,
  onClick,
}: {
  /** The status mark (agent, crew, you). */
  mark?: React.ReactNode;
  /** The main line of text. */
  name: React.ReactNode;
  /** Secondary text, smaller and muted. */
  sub?: React.ReactNode;
  /** Tooltip title for a clickable row. */
  title?: string;
  /** On click, this row becomes a button. Omit for text-only rows. */
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  const wrapperProps = onClick
    ? {
        type: "button" as const,
        onClick,
        title,
        className:
          "flex w-full items-start gap-mrd-3 px-0 py-mrd-2 text-left hover:bg-mrd-hover rounded-mrd-xs transition-colors",
        style: { transitionDuration: "var(--mrd-d-press)" },
      }
    : {
        className: "flex w-full items-start gap-mrd-3 py-mrd-2",
      };

  return (
    <Wrapper {...wrapperProps}>
      {mark ? <div className="shrink-0">{mark}</div> : null}
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] leading-relaxed text-mrd-ink">{name}</div>
        {sub ? (
          <div className="mt-mrd-1 text-[11px] leading-relaxed text-mrd-mute">{sub}</div>
        ) : null}
      </div>
    </Wrapper>
  );
}

/** A paragraph in the context column, smaller and muted. */
export function CtxBody({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] leading-relaxed text-mrd-mute py-mrd-2">{children}</div>;
}
