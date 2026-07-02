import * as React from "react";

export interface WhatChangedItem {
  dot: string;
  text: string;
  cause: string;
}

export interface WhatChangedProps {
  items: WhatChangedItem[];
}

/** "What changed overnight" — causal one-liners, each with a status dot and
 * a mono cause tag. The empty state is an instruction, never a blank box. */
export function WhatChanged({ items }: WhatChangedProps) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
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
          {items.map((it, i) => (
            <div key={i} className="flex items-baseline" style={{ gap: 10 }}>
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
                    fontSize: 9,
                    letterSpacing: "0.06em",
                    color: "var(--text-faint)",
                  }}
                >
                  {it.cause}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
