/*
 * THE CHARACTER — one worker, in front of you, in the state the data proves.
 *
 * The founder's 2026-08-25 direction made presence the core product bet: the
 * crew reads as ONE named worker or the product never feels agentic. This
 * component is that worker's face. It renders `deriveCharacter`'s output and
 * NOTHING else — no timers, no scripted sequences; the derivation module holds
 * the iron law and this file holds only the drawing of it (SPEC-PRESENCE.md).
 *
 * THE FACE IS GEOMETRY, NOT A MASCOT. Two eyes in a rounded mark, posture per
 * state: reading down while working, up while thinking, closed between legs,
 * level lines when a door is locked. Meaning never lives in hue alone — the
 * posture carries it in greyscale, the chip family confirms it, and the line
 * beside the mark says it in words (the StatusChip rule, inherited).
 *
 * COLOUR SPEAKS MERIDIAN'S EXISTING STATUS LANGUAGE rather than inventing a
 * sixth: the worker wears `agent`, a question wears `you`, a locked door wears
 * `hold`, a finished route wears `pass`. A reader who knows the chips already
 * knows the character. Ember appears nowhere — it belongs to the logo alone.
 *
 * Class strings are LITERAL, never interpolated (Tailwind scans source text —
 * the every-meridian-utility-paints lesson), and every animation is declared
 * inline because meridian.css's reduced-motion block matches on the style
 * attribute.
 */

import * as React from "react";

import {
  CHARACTER_NAME,
  deriveCharacter,
  type CharacterState,
  type Presence,
  type PresenceInput,
} from "@/lib/presence/character";
import { usePrefersReducedMotion } from "@/components/knowledge/graph-visual";

/** Chip-family face per state. Literal strings, one pair each, never mixed. */
const MARK_FACE: Record<CharacterState, string> = {
  "out-of-touch": "bg-mrd-sink text-mrd-faint",
  awake: "bg-mrd-agent-chip text-mrd-agent-on-chip",
  thinking: "bg-mrd-agent-chip text-mrd-agent-on-chip",
  working: "bg-mrd-agent-chip text-mrd-agent-on-chip",
  asking: "bg-mrd-you-chip text-mrd-you-on-chip",
  blocked: "bg-mrd-hold-chip text-mrd-hold-on-chip",
  resting: "bg-mrd-agent-chip text-mrd-agent-dim",
  done: "bg-mrd-pass-chip text-mrd-pass-on-chip",
};

/**
 * The breath, per state. Only states that are genuinely still moving may ask
 * for motion (StatusChip's rule): the worker breathing is ambient (2400ms), a
 * question for a person is quicker (1600ms), the between-legs rest is the
 * slowest (3200ms). Outcomes are still. Cadences are `marks.tsx`'s, held
 * steady so the beat a reader knows does not move under them.
 */
const MARK_MOTION: Partial<Record<CharacterState, string>> = {
  thinking: "mrd-attention 2400ms var(--mrd-ease-soft) infinite",
  working: "mrd-attention 2400ms var(--mrd-ease-soft) infinite",
  asking: "mrd-attention 1600ms var(--mrd-ease-soft) infinite",
  resting: "mrd-attention 3200ms var(--mrd-ease-soft) infinite",
};

/**
 * The eyes, per state, in a 24x24 viewBox. Posture is the meaning:
 * level and open at rest, lifted while thinking, lowered onto the work,
 * widened toward you when asking, flat dashes at a locked door, closed
 * curves between legs, risen curves when done, dimmed dots out of touch.
 */
function Eyes({ state }: { state: CharacterState }) {
  switch (state) {
    case "thinking":
      return (
        <>
          <circle cx="9" cy="10.5" r="1.6" fill="currentColor" />
          <circle cx="15" cy="10.5" r="1.6" fill="currentColor" />
        </>
      );
    case "working":
      return (
        <>
          <circle cx="9" cy="13.5" r="1.6" fill="currentColor" />
          <circle cx="15" cy="13.5" r="1.6" fill="currentColor" />
        </>
      );
    case "asking":
      return (
        <>
          <circle cx="9" cy="12" r="2.1" fill="currentColor" />
          <circle cx="15" cy="12" r="2.1" fill="currentColor" />
        </>
      );
    case "blocked":
      return (
        <>
          <rect x="7" y="11.2" width="4" height="1.6" rx="0.8" fill="currentColor" />
          <rect x="13" y="11.2" width="4" height="1.6" rx="0.8" fill="currentColor" />
        </>
      );
    case "resting":
      return (
        <>
          <path
            d="M7.2 12 A 2 2 0 0 0 10.8 12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M13.2 12 A 2 2 0 0 0 16.8 12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case "done":
      return (
        <>
          <path
            d="M7.2 12.8 A 2 2 0 0 1 10.8 12.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M13.2 12.8 A 2 2 0 0 1 16.8 12.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
    case "out-of-touch":
      return (
        <>
          <circle cx="9" cy="12" r="1.3" fill="currentColor" opacity="0.6" />
          <circle cx="15" cy="12" r="1.3" fill="currentColor" opacity="0.6" />
        </>
      );
    case "awake":
      return (
        <>
          <circle cx="9" cy="12" r="1.6" fill="currentColor" />
          <circle cx="15" cy="12" r="1.6" fill="currentColor" />
        </>
      );
  }
}

/**
 * The mark alone — the rail miniature and anywhere else the face must fit a
 * row. `size` is the box edge in pixels; the two the product uses are 24 (rail)
 * and 40 (the run header), and arbitrary values are allowed because the SVG
 * scales rather than repaints.
 */
export function CharacterMark({
  state,
  size = 40,
  className = "",
  hue,
  label,
}: {
  state: CharacterState;
  size?: number;
  className?: string;
  /**
   * ONE TEAMMATE'S OWN COLOUR, and only ever for the many-teammates case.
   *
   * SPEC-MULTIPLAYER-PRESENCE §1 narrows the one-character ruling: more than one
   * teammate genuinely acting at once means each is drawn, **same body, its own
   * colour and its own name**, and identity is carried by colour and name and
   * never by a different avatar per seat. So this tints the SAME face rather
   * than swapping it, which is why it is a hue rather than a variant.
   *
   * The value comes from `agentMark(slug).hue`, a palette that already exists in
   * agent-vocabulary and is deliberately held in a teal-to-blue range so it
   * cannot be mistaken for the semantic status colours. Meridian needed no new
   * token, which is the whole reason this looked like it needed one and did not.
   */
  hue?: string | null;
  /** The teammate's name, for the screen reader, when this is not Supa alone. */
  label?: string | null;
}) {
  /*
   * ── THE ONE ANIMATION THAT NEVER STOPS ON ITS OWN ──────────────────────
   * Four of these states run `mrd-attention ... infinite`, and they are the four
   * a person watching a run looks at most. meridian.css:2087 catches it through
   * `[style*="mrd-attention"]`, but only under
   * `@media (prefers-reduced-motion: reduce)`: `data-motion` appears NOWHERE in
   * `src/styles/`, so the product's own motion toggle never reached this and the
   * mark pulsed forever for somebody who had just switched motion off.
   *
   * Dropping the animation lands exactly where the CSS stop lands. `mrd-attention`
   * is `0%, 100% { opacity: 1 }`, and this mark sets no resting opacity, so both
   * routes leave it at 1. That is the check meridian.css's own header says was
   * skipped for the pixel lattice, whose cells carry an inline `opacity: 0.15`
   * and parked at 1.19:1 contrast; this element carries none, so it is safe.
   */
  const reducedMotion = usePrefersReducedMotion();
  return (
    <span
      data-mrd=""
      data-presence-state={state}
      role="img"
      aria-label={`${label ?? CHARACTER_NAME}: ${state.replace(/-/g, " ")}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-mrd-ctl ${MARK_FACE[state]} ${className}`}
      style={{
        width: size,
        height: size,
        animation: reducedMotion ? undefined : MARK_MOTION[state],
        /* Inline beats the face classes, so the tint replaces the shared chip
           colour while the state's own motion is untouched. */
        ...(hue
          ? { backgroundColor: `color-mix(in oklch, ${hue} 20%, transparent)`, color: hue }
          : null),
      }}
    >
      <svg width="60%" height="60%" viewBox="0 0 24 24" aria-hidden="true">
        <Eyes state={state} />
      </svg>
    </span>
  );
}

/**
 * The full presence block: mark, name, and the one first-person sentence.
 * Derivation happens HERE from the caller's real inputs, so a surface cannot
 * hand-pick a state — it can only hand over what its reads returned.
 */
export function Character({
  input,
  size = 40,
  className = "",
}: {
  input: PresenceInput;
  size?: number;
  className?: string;
}) {
  const presence: Presence = deriveCharacter(input);
  return (
    <div
      data-mrd=""
      data-presence-state={presence.state}
      /*
       * TOP-ALIGNED, not centred. Once the sentence is allowed to wrap, centring
       * the mark against a block whose height changes with the words makes the
       * mark drift up and down as the run moves. Aligning it to the name is also
       * how every reference renders a speaker beside what they said.
       */
      className={`flex items-start gap-3 ${className}`}
    >
      <CharacterMark state={presence.state} size={size} />
      <div className="min-w-0">
        <div className="text-mrd-label text-mrd-mute">{CHARACTER_NAME}</div>
        {/* aria-live: the line changes as the walk moves, and the transcript
            a11y work (queue #21) established that a silent live surface is a
            defect, not a default. Polite, because the sentence is ambient.

            AND IT WRAPS. It carried `truncate` until 2026-08-27, which is
            `nowrap` plus an ellipsis, so on the run screen the character's own
            voice was cut mid-sentence: "I've stopped, the reason is on the hold
            line. I'll carry ..." -- the half that said what happens next was the
            half thrown away. Every line this thing says is one or two sentences
            written to be read whole; a surface that clips the product's own
            voice to protect a row height has the priority backwards. The height
            changes when the state changes, which is a handful of times in a run
            and is not a reason to say less. */}
        <p aria-live="polite" className="text-mrd-body text-mrd-ink">
          {presence.line}
        </p>
      </div>
    </div>
  );
}

export default Character;
