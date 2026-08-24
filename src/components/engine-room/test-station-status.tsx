import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusState =
  | "working"
  | "gate"
  | "waiting"
  | "done"
  | "shipped"
  | "queued"
  | "thinking"
  | "in-review"
  | "blocked"
  | "live"
  | "stale"
  | "failing";

interface StatusStyle {
  color: string;
  glow: string | null;
  animation: string | null;
}

// Core four verbatim from the prototype (README §7 "Glows"); the three
// contract aliases (thinking/in-review/blocked) reuse the gate glow's shape
// (0 0 10px 2px @ 55%) recolored to their own hue, since the spec names the
// hue but not a distinct glow shape for these three.
export const STATUS_STYLES: Record<StatusState, StatusStyle> = {
  // Glows are color-mix over the same role tokens as the dot (2026-07-11
  // audit: the old rgba literals froze the retired hexes and were dark-only).
  working: {
    color: "var(--mrd-agent)",
    glow: "0 0 8px 1px color-mix(in srgb, var(--mrd-agent) 60%, transparent)",
    animation: "cadPulse 2s ease-in-out infinite",
  },
  gate: {
    color: "var(--mrd-you)",
    glow: "0 0 10px 2px color-mix(in srgb, var(--mrd-you) 55%, transparent)",
    animation: "cadGlow 1.8s ease-in-out infinite",
  },
  waiting: {
    color: "var(--mrd-you)",
    glow: "0 0 10px 2px color-mix(in srgb, var(--mrd-you) 55%, transparent)",
    animation: "cadGlow 1.8s ease-in-out infinite",
  },
  done: {
    color: "var(--mrd-pass)",
    glow: "0 0 8px 1px color-mix(in srgb, var(--mrd-pass) 50%, transparent)",
    animation: null,
  },
  shipped: {
    color: "var(--mrd-pass)",
    glow: "0 0 8px 1px color-mix(in srgb, var(--mrd-pass) 50%, transparent)",
    animation: null,
  },
  // Spec literal (OBS-03.md line 71): "queued #55524C flat" — that hex is
  // --mrd-faint, not --slate (#6E6A64, a different token from the same
  // family). Adversarial review caught this drift; fixed to the exact hex.
  queued: {
    color: "var(--mrd-faint)",
    glow: null,
    animation: null,
  },
  // The three contract aliases (OBS-03.md line 72) name only a hue; only
  // "thinking" is explicitly given a named animation ("blossom breathe
  // (cadGlow...)"). in-review/blocked get no named animation or glow in the
  // spec, so both stay static rather than inventing a glow shape or motion.
  // Rich-blue recalibration (DESIGN-TEMPO §2, 2026-07-11 late): a machine
  // "thinking" state speaks the blue machine voice, never the magenta band
  // (violet/blossom retired from every machine/AI treatment).
  thinking: {
    color: "var(--mrd-agent)",
    glow: null,
    animation: "cadGlow 1.8s ease-in-out infinite",
  },
  "in-review": {
    color: "var(--mrd-hold)",
    glow: null,
    animation: null,
  },
  blocked: {
    color: "var(--mrd-fail)",
    glow: null,
    animation: null,
  },
  // OBS-13 §8 connection-card anatomy: a connection's own three-state
  // vocabulary (live/stale/failing), distinct from the build/mission states
  // above — every one of the three carries a glow per the card anatomy spec
  // ("glowing status word"), unlike queued/blocked/in-review which don't.
  live: {
    color: "var(--mrd-pass)",
    glow: "0 0 10px color-mix(in srgb, var(--mrd-pass) 55%, transparent)",
    animation: null,
  },
  stale: {
    color: "var(--mrd-hold)",
    glow: "0 0 10px color-mix(in srgb, var(--mrd-hold) 55%, transparent)",
    animation: null,
  },
  failing: {
    color: "var(--mrd-fail)",
    glow: "0 0 10px color-mix(in srgb, var(--mrd-fail) 55%, transparent)",
    animation: null,
  },
};

/** Default mono word per state (OBS-03 spec §9). `word` on `StatusDot` stays
 * a required prop (status must never rely on color alone); this map is a
 * convenience callers may spread rather than retype the copy register. */
export const STATUS_WORD: Record<StatusState, string> = {
  working: "WORKING",
  gate: "WAITING ON YOU",
  waiting: "WAITING ON YOU",
  done: "SHIPPED",
  shipped: "SHIPPED",
  queued: "QUEUED",
  thinking: "THINKING",
  "in-review": "IN REVIEW",
  blocked: "BLOCKED",
  live: "LIVE",
  stale: "STALE",
  failing: "FAILING",
};

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: StatusState;
  word: string;
}

/** 6px glowing dot + its mono word, always paired: status never relies on
 * color alone (README §5.12 a11y contract). */
export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ state, word, className, style, ...props }, ref) => {
    const s = STATUS_STYLES[state];
    return (
      <span
        ref={ref}
        className={cn("inline-flex items-center gap-2", className)}
        style={style}
        {...props}
      >
        <span
          aria-hidden="true"
          className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
          style={{
            backgroundColor: s.color,
            boxShadow: s.glow ?? undefined,
            animation: s.animation ?? undefined,
          }}
        />
        <span
          style={{
            fontFamily: "var(--mrd-mono)",
            letterSpacing: "0.11em",
            color: s.color,
          }}
          className="uppercase"
        >
          {word}
        </span>
      </span>
    );
  },
);
StatusDot.displayName = "StatusDot";
