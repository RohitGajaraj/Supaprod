import * as React from "react";

import { WORKING_WORDS, WORD_HOLD_MS, seedFrom } from "@/components/shell/agent-pulse-words";
import { useElapsed } from "@/components/meridian/use-elapsed";

/**
 * THE ONE THING THAT PROVES AN AGENT IS ACTUALLY WORKING.
 *
 * FOUNDER RULING 2026-08-01, framed as the product's core claim: "That's the
 * only core USP of our platform, because we are saying agentic driven,
 * agentic-first, AI-native. But if something happens in the background with no
 * visual effect or calling out what it is, then it does not even feel
 * valuable." And: "wherever the agent work is happening... not just at the
 * first layer, layer two, layer three, layer five, getting into the depth."
 *
 * ── WHY THIS IS IN MERIDIAN, AND WHY IT WAS THE LAST THING LEFT ─────────
 * beautifui.dev has no equivalent. Its nearest components, Loading State and
 * Thinking, are both already ported and at parity, and neither carries a
 * rotating verb, a per-action noun, or a brand glyph. So the reference could
 * not answer this one, which is precisely the case the founder's standing
 * ruling covers: where no reference element exists, build it into the system
 * rather than reach past the system.
 *
 * Until today this was the last retired-layer dependency of every already
 * ported surface. Three separate ports in one afternoon reported it as the
 * reason they could not finish a file: Meridian's `Reading` takes children and
 * nothing else, so swapping `Loading working agent=... detail=...` for it would
 * have dropped the agent-working state, the name of the agent running, and what
 * it was reading.
 *
 * ── WHAT IS BORROWED, AND FROM WHERE ────────────────────────────────────
 * The MECHANIC is Claude Code's own working indicator: a shape-shifting glyph,
 * one gerund, an ellipsis, swapped every few seconds. Never the words.
 *
 *   1. ONE word, not a sentence. A sentence asks to be read; a word is absorbed.
 *   2. It CHANGES, on a rhythm slow enough to read and fast enough to prove the
 *      thing is alive. A static label is indistinguishable from a frozen page.
 *   3. The vocabulary is slightly unexpected and never nonsense. "Whirring"
 *      earns a half-smile; "Processing" is wallpaper.
 *
 * WHY A WORD AND NOT A PERCENTAGE. We do not know the percentage. An agent loop
 * runs until it decides it is finished, so any bar would be a number we made
 * up, and this product does not make numbers up. A word claims exactly what we
 * know: something is running.
 *
 * ── THE ONE THING THE PORT CHANGES, AND IT IS A LAW FIX ─────────────────
 * The retired glyph was painted `--sp-pass`. GREEN. In Meridian green reports
 * an OUTCOME and nothing else, so a working indicator wearing it is the same
 * conflation `Value` was corrected for: "still deploying" and "deployed
 * successfully" rendering in one colour. A machine at work is `--mrd-agent`,
 * present tense, which is the token that exists to say exactly this.
 *
 * ── THERE IS NO BOOLEAN, AND THAT IS DELIBERATE ─────────────────────────
 * This takes no `working`, `pending`, `busy` or `isPending` prop. Mounting it
 * IS the claim that an agent is running, so a caller cannot wire a fetch to it
 * without writing that lie in plain sight at the call site. `primitives.Loading`
 * took a `working` boolean and eleven of the twelve pulses in the product ended
 * up gated on a mutation's `isPending`, reporting the fetch the reader's own
 * click started. A prop that can be handed the wrong fact will be.
 *
 * ── ACCESSIBILITY ───────────────────────────────────────────────────────
 * The live region announces the STATIC label, never the rotating word: a screen
 * reader interrupting itself every 2.6 seconds with a new gerund is hostile.
 * Under reduced motion the rotation and the swapping both stop and the first
 * word stands, so the information survives without the movement. The interval
 * is not merely stopped in CSS but never started, because a CSS override cannot
 * stop a `setInterval` firing forever in a background tab.
 */

/**
 * The seven-petal mark at indicator scale.
 *
 * Redrawn rather than importing `SupaprodMark`, because that one carries the
 * full brand lockup, which is illegible at 14px and expensive to animate. This
 * is the same geometry reduced to what survives at this size.
 *
 * It turns slowly and breathes; it never spins fast, because a fast spinner
 * reads as "blocked" and this is the opposite of blocked. Both animations are
 * declared INLINE, because meridian.css's reduced-motion block matches on the
 * style attribute and an animation in a utility class would keep running for
 * someone who asked it not to.
 */
function BrandGlyph() {
  const petals = Array.from({ length: 7 }, (_, i) => (i * 360) / 7);
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      className="shrink-0 text-mrd-agent"
      style={{
        transformOrigin: "50% 50%",
        animation: "mrd-spin 6s linear infinite, mrd-attention 2.6s var(--mrd-ease-soft) infinite",
      }}
    >
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx="12"
          cy="6.4"
          rx="2.1"
          ry="4.1"
          fill="currentColor"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

/**
 * THE PIXEL GRID, the other candidate, kept as a variant rather than as a
 * replacement so the two can be compared on one screen.
 *
 * This is beautifui.dev's loading mechanic, already ported into
 * `meridian/LoadingState` from that site's own source: a 3x3 lattice on a
 * staggered chevron so two fronts are always in flight and the grid never reads
 * as empty mid-cycle.
 *
 * IT IS TINTED `--mrd-agent`, WHERE `LoadingState` USES INK. That is not a
 * preference. `LoadingState` reports a JOB running, which has no actor; this
 * reports an AGENT running, and azure is the token that says so. The same
 * lattice in ink would be the generic loader wearing our spacing.
 *
 * WHAT IT COSTS, said plainly, because the choice is a real trade. The brand
 * mark is ours and nothing else in the category looks like it, and there is a
 * standing ruling that the thing a person watches while they wait should be the
 * brand rather than a borrowed spinner. The lattice is calmer, reads better at
 * small sizes, and sits more quietly beside the shimmer. One is more
 * distinctive; the other is more restrained.
 */
function PixelGlyph() {
  /* The chevron stagger from LoadingState's Drive variant. `null` is a cell
     that never lights, which is what gives the front its shape. */
  const delays = [0, 130, 260, 130, 260, 390, 260, 390, 520];
  return (
    <span aria-hidden className="grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]">
      {delays.map((d, i) => (
        <span
          key={i}
          className="size-[4px] rounded-[1px] bg-mrd-agent"
          style={{ opacity: 0.15, animation: `mrd-pixel-on 650ms ease-in-out ${d}ms infinite` }}
        />
      ))}
    </span>
  );
}

export function AgentPulse({
  label,
  seed,
  words = WORKING_WORDS,
  compact = false,
  detail,
  startedAt,
  glyph = "mark",
}: {
  /** The static sentence a screen reader gets, once. Never the rotating word. */
  label: string;
  /** Anything stable about this agent, so two indicators do not sync up. */
  seed?: string;
  /** Override the vocabulary where a surface knows something more specific. */
  words?: readonly string[];
  /** Inline, for a row or a button, rather than a block with its own room. */
  compact?: boolean;
  /**
   * WHAT it is working on, right now. A file path, a line, an artifact title, a
   * tool name, a rule count.
   *
   * FOUNDER RULING 2026-08-01, and it is the half that makes the indicator
   * worth anything: "add the per-action detail (which file, which line, which
   * artifact)." A rotating gerund alone proves something is alive; it does not
   * tell you what is happening to your work.
   *
   * THE RULE FOR WHAT GOES IN HERE: a NOUN THIS SURFACE ALREADY READ. Never a
   * second verb (the word is the verb), never a percentage, never a guess about
   * a step the client cannot see. If the only honest thing available is "an
   * agent is running", pass nothing: an empty detail is the correct output when
   * the specific fact is not in scope, and inventing one would be the same
   * defect as a made-up progress bar.
   */
  detail?: React.ReactNode;
  /**
   * When the WORK started, as an epoch ms. Optional, and it renders nothing at
   * all when absent.
   *
   * That default is the whole point. The common case is not a fresh mount:
   * someone reopens a surface on a run that has been going four minutes, and a
   * figure counting from zero there reports the age of the indicator rather
   * than the age of the run. So this only ever shows a number a caller could
   * actually prove, and shows none otherwise, which is the same refusal as
   * `detail`: an empty slot beats an invented fact.
   */
  startedAt?: number;
  /**
   * Which mark turns while the agent works.
   *
   * `mark` is the seven-petal brand geometry; `grid` is the reference's pixel
   * lattice. Both are kept so they can be judged side by side in the gallery
   * rather than one of them living only in git history, where nobody can look
   * at it. The default is the brand, per the standing ruling that what a person
   * watches while they wait should be ours.
   */
  glyph?: "mark" | "grid";
}) {
  const elapsed = useElapsed(startedAt, startedAt != null);
  const base = React.useMemo(() => seedFrom(seed), [seed]);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(() => setTick((t) => t + 1), WORD_HOLD_MS);
    return () => window.clearInterval(id);
  }, []);

  const word = words[Math.abs(tick + base) % words.length] ?? words[0];

  return (
    <span
      data-mrd=""
      className={`inline-flex min-w-0 items-center text-mrd-mute ${
        compact ? "gap-mrd-3 text-[13px]" : "gap-mrd-4 text-[13.5px]"
      }`}
    >
      {glyph === "grid" ? <PixelGlyph /> : <BrandGlyph />}

      {/* The live region carries the STATIC label. */}
      <span className="sr-only" aria-live="polite">
        {label}
      </span>

      {/*
       * THE WORD SHIMMERS, and this is the one place the port changes the
       * mechanic rather than the paint.
       *
       * THE PROBLEM IT SOLVES IS THE FOUNDER'S OWN: "you just cannot put the
       * word Reading and just end it there." A static label is indistinguishable
       * from a frozen page. The retired answer was three dots on a staggered
       * 1.4s cycle, animating independently of the word.
       *
       * WHY THAT WAS REPLACED RATHER THAN PORTED. Counting the retired version's
       * motion: the glyph turns, the glyph breathes, the word enters, and three
       * dots blink out of phase. Four simultaneous animations on one 200px
       * indicator, and meridian.css's own rule is that two motions on one screen
       * must differ in more than duration. Four is not restraint, and restraint
       * is most of what reads as premium.
       *
       * The shimmer is the reference's mechanic, lifted from `LoadingState`
       * where it was already ported from beautifui.dev's source: a highlight
       * travelling through the text rather than a pulse changing its brightness.
       * A pulse pulls the eye off whatever sits beside it; a travelling
       * highlight reads as "still going" in peripheral vision and stays quiet
       * when looked at directly. It makes the WORD ITSELF alive, which is what
       * the dots were a proxy for, so the requirement is met by the thing it was
       * about rather than by punctuation next to it.
       *
       * THE ELLIPSIS STAYS, as characters. It is the convention for "in
       * progress" and dropping it would make a completed-looking phrase. It sits
       * inside the shimmering span, so it travels with the word as one string
       * rather than being a second thing that moves.
       *
       * THE HIGHLIGHT IS `--mrd-agent`, not `--mrd-ink`. `LoadingState` shimmers
       * toward ink because it reports a JOB running. This reports an AGENT
       * running, and azure is the token that means exactly that, so the colour
       * law is carried by the brightest part of the sweep.
       */}
      <span
        key={word}
        aria-hidden="true"
        className="shrink-0 bg-clip-text font-medium text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--mrd-mute) 35%, var(--mrd-agent) 50%, var(--mrd-mute) 65%)",
          backgroundSize: "200% 100%",
          /* Two animations, one object: it arrives, then it breathes. Keyed on
             the word so it RE-ENTERS on each change rather than cross-fading in
             place, which is what makes it read as a new word and not a flicker. */
          animation:
            "mrd-fade-up 260ms var(--mrd-ease) both, mrd-shimmer 1.4s linear infinite 260ms",
        }}
      >
        {word}
        {"..."}
      </span>

      {/* The noun, after the verb, quieter than it. It does not rotate and does
          not animate: it is a FACT about this run, and a fact that moves reads
          as another animation rather than as information. Beside the word rather
          than under it, so the whole indicator stays one line and drops into a
          row or a button without changing the height of anything around it.
          `truncate` needs the `min-w-0` on the root to have something to bite. */}
      {detail ? (
        <span className="min-w-0 truncate text-mrd-faint" aria-hidden="true">
          {detail}
        </span>
      ) : null}

      {/* Tabular figures, so the number does not jitter sideways as it ticks.
          Not aria-hidden: unlike the rotating word, how long something has been
          running is a fact a person waiting genuinely needs, and it is the one
          part of this indicator that changes meaning rather than merely
          proving life. */}
      {startedAt != null ? (
        <span className="font-mrd-mono shrink-0 text-[12px] tabular-nums text-mrd-mute">
          {elapsed}
        </span>
      ) : null}
    </span>
  );
}
