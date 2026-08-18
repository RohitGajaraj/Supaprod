/**
 * The Gate: question + evidence + actions.
 *
 * A modal panel in a decision surface, the one thing a person focuses on.
 * Lifted from primitives.tsx as part of Meridian adoption.
 *
 * Meridian rendering:
 * - data-mrd root
 * - Uses --mrd-* tokens only
 * - No retired component tokens
 */

import * as React from "react";

export function Gate({
  title,
  sub,
  marks,
  children,
}: {
  /** The question. */
  title?: React.ReactNode;
  /** Secondary text, context, or a note. */
  sub?: React.ReactNode;
  /** The status marks (agent, crew, you) rendered left of the title. */
  marks?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <article
      data-mrd=""
      className="border border-mrd-line bg-mrd-float rounded-mrd-surface p-mrd-4"
    >
      {/* The header with marks and title */}
      <div className="flex items-start gap-mrd-4">
        {marks ? <div className="flex shrink-0 gap-1">{marks}</div> : null}
        <div className="flex-1 min-w-0">
          {title ? (
            <h2 className="text-[13px] leading-relaxed font-medium text-mrd-ink">{title}</h2>
          ) : null}
          {sub ? (
            <p className="mt-mrd-2 text-[12.5px] leading-relaxed text-mrd-body">{sub}</p>
          ) : null}
        </div>
      </div>

      {/* The content */}
      {children ? <div className={`${title || sub ? "mt-mrd-4" : ""}`}>{children}</div> : null}
    </article>
  );
}
