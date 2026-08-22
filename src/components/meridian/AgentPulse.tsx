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
 * rotating verb or a per-action noun. So the reference could not answer this
 * one, which is precisely the case the founder's standing ruling covers: where
 * no reference element exists, build it into the system rather than reach past
 * the system.
 *
 * ── THE BRAND MARK IS GONE, AND THIS FILE USED TO ARGUE FOR IT ──────────
 * FOUNDER, 2026-08-19, VERBATIM: *"That circle gear icon is not good. I don't
 * want to use that."* Ruled in the room, and it needs no document behind it.
 *
 * WHAT IS BEING REVERSED. This file carried the claim that there was a standing
 * ruling that the thing a person watches while they wait should be the brand
 * rather than a borrowed spinner, and it shipped a seven-petal mark turning at
 * 6s as the DEFAULT, with the reference's pixel lattice as an opt-in variant.
 * That is now the other way round, and the variant is not a variant: the option
 * is deleted rather than defaulted away, because a prop that still offers the
 * ruled-out thing leaves the ruling unenforced and the next author will find it.
 *
 * The claimed ruling is also not written down anywhere: `grep -ci brand` in
 * `DESIGN-SYSTEM.md` returns 0. The mark still earns other moments, and those
 * have their own rulings in their own files (`BrandWait` for the auth load,
 * `ask/Working` for the pane). This is about the indicator that sits beside a
 * row while an agent works, twelve times over, which is a different job.
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
 * successfully" rendering in one colour. The fix stands; only its destination
 * changed. As of 2026-08-23 the lattice is INK and the MOTION carries "present
 * tense", which is what the reference does and what `LoadingState` already did.
 * See THE LATTICE IS INK below.
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
 * THE PIXEL GRID, now the only glyph this indicator has.
 *
 * This is beautifui.dev's loading mechanic, already ported into
 * `meridian/LoadingState` from that site's own source: a 3x3 lattice on a
 * staggered chevron so two fronts are always in flight and the grid never reads
 * as empty mid-cycle.
 *
 * IT IS INK, THE SAME AS `LoadingState`, REVERSED 2026-08-23 ON FOUNDER RULING.
 * This block used to say the azure tint was "the one thing about this component
 * that must not be tidied", on the argument that `LoadingState` reports a JOB
 * with no actor while this reports an AGENT, so azure named the actor.
 *
 * THE ARGUMENT DOES NOT SURVIVE THE OBVIOUS CHECK. The actor is already named,
 * in words, in the label this component requires: "Scout is reading the record".
 * A hue repeating what the sentence beside it already says is decoration, and it
 * is the carrier that dies first in greyscale and for a reader who cannot
 * separate it. What is left after repainting still says a machine is working
 * four ways over: the label, the rotating gerund, the lattice's motion, and the
 * elapsed figure.
 *
 * AND ONE MECHANIC MEANING ONE THING CANNOT WEAR TWO COLOURS. That is the defect
 * a design system exists to prevent, and it had it in its own two components:
 * the same 3x3 chevron, the same 650ms stagger, the same meaning, two paints.
 * The ink one is the faithful port; this one re-implemented and re-coloured it.
 *
 * Azure is not retired. It stays wherever it separates a machine from a person
 * on the same glyph family, which is work a neutral cannot do: `marks.tsx` sets
 * `running` azure against `gate` orchid, `StatusChip` carries the agent chip,
 * and `InsightCards` marks a row `you` or `agent`. Hue answers WHO when there is
 * someone to be told apart from. Motion answers IN PROGRESS. Here there was no
 * become one with a rotating word.
 *
 * THE AZURE IS NOT WHAT WAS INVISIBLE ON PAPER, which is worth stating because
 * the two defects were reported together and only one of them was here. Glyphs
 * measured 1.00 contrast on the light ground because entering
 * `[data-theme="light"]` re-declared every token and never re-bound `color`, so
 * every `currentColor` glyph inherited the dark ground's ink. That is fixed in
 * `meridian.css`.
 *
 * ── THE LATTICE IS INK, NOT AZURE. REVERSED 2026-08-23 ──────────────────
 * FOUNDER, this session: *"Why should it be blue colour? ... can't it be the
 * same as how it is there in the loading state? The loading state colours are
 * both light and dark, and they look premium."* He had raised it once before.
 *
 * WHAT THIS FILE USED TO ARGUE, so the reversal is on the record rather than
 * quietly applied: that this was the canonical use of `--mrd-agent`, and that
 * "repainting it in ink would delete the one surface in the product that says a
 * machine is working."
 *
 * THAT ARGUMENT WAS OVERSTATED, and checking it is what settles this. Four
 * things here say a machine is working: the rotating gerund, the lattice's
 * motion, the elapsed figure, and the hue. Repainting removes ONE of the four,
 * and it is the weakest of them, because a hue is exactly the carrier that dies
 * in greyscale and for a reader who cannot separate it. This file's own
 * neighbour makes that argument about `--mrd-fail` against `--mrd-stop`.
 *
 * THE DECIDING FACT IS AN INCONSISTENCY, not a preference. `LoadingState` draws
 * THE SAME chevron lattice, on the same 650ms stagger, for the same meaning, in
 * `bg-mrd-ink` -- and it is the one ported faithfully from the reference, while
 * this one re-implemented the mechanic and re-coloured it. One mechanic meaning
 * one thing cannot wear two colours; that is the defect the design system exists
 * to prevent, and it had it in its own two components.
 *
 * WHERE AZURE STAYS, because this is not "remove the agent hue". It stays
 * wherever it separates a machine from a person on the SAME glyph family, which
 * is real work a neutral cannot do: `marks.tsx` pairs `running` azure against
 * `gate` orchid, `StatusChip` carries the agent chip, and `InsightCards` marks a
 * row `you` or `agent`. Hue answers WHO when there is someone to be told apart
 * from. Motion answers IN PROGRESS. Here there is no "a person is working"
 * counterpart to contrast with, so the hue was decorating rather than saying.
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
          className="size-[4px] rounded-[1px] bg-mrd-ink"
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
  /*
   * THERE IS NO `glyph` PROP ANY MORE, and the deletion is the point rather than
   * a tidy-up. It offered `"mark" | "grid"` and defaulted to the brand mark the
   * founder ruled out on 2026-08-19. Keeping it with `grid` as the default would
   * have left the ruled-out drawing one prop away, and left the union standing as
   * an invitation. One indicator, one mark.
   */
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
      /*
       * ONE TYPE STOP, IN BOTH DENSITIES. `compact` used to drop the size from
       * `text-mrd-body` (14px) to `text-mrd-base` (13px), which made two
       * indicators of one component and put the roomy one a stop above
       * `LoadingState`'s 13px label for the same job. 13px is now both, so
       * `compact` changes the GAP and nothing else, which is what compact should
       * mean: tighter, not smaller. Shrinking type to save room is the answer the
       * ratchet forbids.
       */
      className={`inline-flex min-w-0 items-center text-mrd-base text-mrd-mute ${
        compact ? "gap-mrd-3" : "gap-mrd-4"
      }`}
    >
      <PixelGlyph />

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
       * THE HIGHLIGHT IS `--mrd-ink`, matching `LoadingState`, since 2026-08-23.
       * It shimmered toward azure on the argument that this reports an AGENT
       * rather than a JOB. The label already names the agent, so the hue was
       * repeating it; the sweep now carries brightness alone, which is the part
       * a reader actually perceives as motion.
       */}
      <span
        key={word}
        aria-hidden="true"
        className="shrink-0 bg-clip-text font-medium text-transparent"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--mrd-mute) 35%, var(--mrd-ink) 50%, var(--mrd-mute) 65%)",
          backgroundSize: "200% 100%",
          /* Two animations, one object: it arrives, then it breathes. Keyed on
             the word so it RE-ENTERS on each change rather than cross-fading in
             place, which is what makes it read as a new word and not a flicker. */
          animation:
            "mrd-fade-up 260ms var(--mrd-ease) both, mrd-shimmer var(--mrd-d-alive) linear infinite 260ms",
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
