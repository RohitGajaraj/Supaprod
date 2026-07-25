import * as React from "react";

export interface WhatChangedItem {
  dot: string;
  text: string;
  cause: string;
  /** Dim 17: the LRN trace ref (faint) + relative time (a touch more present),
   * and a click that opens the learning in Brain. All optional. */
  traceRef?: string;
  time?: string;
  onOpen?: () => void;
}

export interface WhatChangedProps {
  items: WhatChangedItem[];
}

/** Loom W2-TODAY (DESIGN-LOOM §8b): the list stays capped at five lines;
 * anything beyond folds behind a quiet inline disclosure. */
const CAP = 5;

/** "What changed overnight" — causal one-liners, each with a status dot and
 * a mono cause tag. The empty state is an instruction, never a blank box. */
export function WhatChanged({ items }: WhatChangedProps) {
  const [showAll, setShowAll] = React.useState(false);
  const visible = showAll ? items : items.slice(0, CAP);
  const folded = items.length - CAP;
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.11em",
          color: "var(--text-subtle)",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        What changed overnight
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-body)", margin: 0 }}>
          Nothing shifted overnight. The next outcome shows up here the moment a mission lands.
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: 11 }}>
          {visible.map((it, i) => {
            const meta = [it.cause, it.traceRef, it.time].filter(Boolean).join(" · ");
            const inner = (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 99,
                    background: it.dot,
                    position: "relative",
                    top: -2,
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--text-body)" }}>
                    {it.text}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.06em",
                      color: "var(--text-faint)",
                    }}
                  >
                    {meta}
                  </div>
                </div>
              </>
            );
            return it.onOpen ? (
              <button
                key={i}
                type="button"
                onClick={it.onOpen}
                title="Open this learning"
                className="loom-press flex items-baseline text-left outline-none transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  gap: 10,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                {inner}
              </button>
            ) : (
              <div key={i} className="flex items-baseline" style={{ gap: 10 }}>
                {inner}
              </div>
            );
          })}
          {folded > 0 ? (
            <button
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
              className="loom-press self-start outline-none transition-colors [color:var(--text-muted)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "transparent",
                border: "none",
                padding: "2px 0",
              }}
            >
              {showAll ? "Show fewer" : `${folded} more`}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
