/**
 * The one thing that proves an agent is actually working.
 *
 * FOUNDER RULING 2026-08-01, and he framed it as the product's core claim:
 * "That's the only core USP of our platform, because we are saying agentic
 * driven, agentic-first, AI-native. But if something happens in the background
 * with no visual effect or calling out what it is, then it does not even feel
 * valuable." And: "wherever the agent work is happening... not just at the first
 * layer, layer two, layer three, layer five, getting into the depth."
 *
 * THE REFERENCE, named before building: Claude Code's own working indicator. A
 * shape-shifting glyph on the left, one gerund, an ellipsis, swapped every few
 * seconds. What it borrows is the MECHANIC and the register, never the words:
 *
 *   1. ONE word, not a sentence. A sentence asks to be read; a word is absorbed.
 *   2. It CHANGES, on a rhythm slow enough to read and fast enough to prove the
 *      thing is alive. A static label is indistinguishable from a frozen page.
 *   3. The vocabulary is slightly unexpected but never nonsense. "Whirring"
 *      earns a half-smile; "Processing" is wallpaper. The founder was explicit:
 *      "it's not regular words, it's some random words, but something meaning it
 *      has, so when a user sees it he feels connected."
 *
 * WHY A WORD AND NOT A PERCENTAGE. We do not know the percentage. An agent loop
 * runs until it decides it is finished, so any bar would be a number we made up,
 * and this product does not make numbers up. A word claims exactly what we know:
 * something is running.
 *
 * THE GLYPH IS OURS. It is the SupaprodMark's seven-petal geometry, drawn at
 * indicator scale and rotating, so the thing a person watches while they wait is
 * the brand rather than a borrowed spinner. It turns slowly and breathes; it
 * never spins fast, because a fast spinner reads as "blocked" and this is the
 * opposite of blocked.
 *
 * ACCESSIBILITY, and it is why the word is not merely decorative. The live
 * region announces the STATIC label a caller passes, never the rotating word: a
 * screen reader interrupting itself every three seconds with a new gerund is
 * hostile. Under `prefers-reduced-motion` the rotation and the swapping both
 * stop and the first word stands, so the information survives without the
 * movement.
 */
import * as React from "react";

import { WORKING_WORDS, WORD_HOLD_MS, seedFrom } from "@/components/shell/agent-pulse-words";

/**
 * The seven-petal mark at indicator scale.
 *
 * Redrawn here rather than importing `SupaprodMark`, because that one carries
 * the full brand lockup (the ember core, the loop spiral) which is illegible at
 * 14px and expensive to animate. This is the same geometry reduced to what
 * survives at this size: seven petals around a centre.
 */
function PulseGlyph({ label }: { label?: string }) {
  const petals = Array.from({ length: 7 }, (_, i) => (i * 360) / 7);
  return (
    <svg
      className="sp-pulse-glyph"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
    >
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="12"
          cy="6.6"
          rx="2.05"
          ry="4.3"
          transform={`rotate(${deg} 12 12)`}
          fill="currentColor"
          opacity="0.85"
        />
      ))}
      <circle cx="12" cy="12" r="2.1" fill="currentColor" />
    </svg>
  );
}

export function AgentPulse({
  label,
  seed,
  words = WORKING_WORDS,
  compact = false,
}: {
  /**
   * What a screen reader is told, once. Say the WORK, not the animation:
   * "Design is working", never "loading spinner".
   */
  label: string;
  /** Anything stable about this agent, so two indicators do not sync up. */
  seed?: string;
  /** Override the vocabulary where a surface knows something more specific. */
  words?: readonly string[];
  /** Inline, for a row or a button, rather than a block with its own room. */
  compact?: boolean;
}) {
  const base = React.useMemo(() => seedFrom(seed), [seed]);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    // Honour the OS setting rather than the CSS one, because the CSS override
    // can stop the rotation but cannot stop a setInterval from firing forever
    // in a background tab.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => setTick((t) => t + 1), WORD_HOLD_MS);
    return () => window.clearInterval(id);
  }, []);

  const word = words[Math.abs(tick + base) % words.length] ?? words[0];

  return (
    <span className="sp-pulse" data-compact={compact ? "" : undefined}>
      <PulseGlyph />
      {/* The live region carries the STATIC label. The rotating word is marked
        aria-hidden: a screen reader restarting every 2.6 seconds with a new
        gerund is hostile, and the word adds nothing a blind user needs beyond
        "this is working", which the label already says. */}
      <span className="sp-sr-only" aria-live="polite">
        {label}
      </span>
      <span className="sp-pulse-word" aria-hidden="true">
        {/* Keyed so the word re-enters rather than cross-fading in place, which
          is what makes it read as a NEW word rather than as a flicker. */}
        <span key={word} className="sp-pulse-word-in">
          {word}
        </span>
        <span className="sp-pulse-dots">...</span>
      </span>
    </span>
  );
}
