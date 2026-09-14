/**
 * ── THE ONE REGION THAT OWNS AN OTHERWISE EMPTY ENTRY ─────────────────────
 *
 * The reasoning, the reproduction and the reason every OTHER region on this
 * page is right to draw nothing are all in
 * `nobody-owned-the-empty-entry.ts`. Read that first; this file is only the
 * paint.
 *
 * In short: signed in on the workspace the scope menu opens by default, the
 * whole home screen was a loading line and an empty text box, because each
 * region independently and correctly refused to speak. Nobody owned the sum.
 * This does.
 *
 * ── IT IS NOT AN ONBOARDING STEP, A TOUR, OR A DISMISSIBLE BANNER ─────────
 * There is nothing to dismiss and nothing to complete. It is what the entry
 * says when it has nothing else to say, so it disappears on its own the moment
 * any real work exists -- no flag, no stored "seen" state, nothing that can
 * drift out of step with what is on screen. A person who starts one run never
 * sees it again, and a person whose workspace empties would see it again, which
 * is correct both times.
 *
 * ── THE THREE CARDS FILL THE BOX AND START NOTHING ────────────────────────
 * `onUse` puts the sentence in the composer and focuses it. The person's own
 * Enter is what spends money, which is the consent rule `StarterRuns` and
 * `ExampleJobs` already hold for a suggestion. Nothing invented here can become
 * a row without somebody choosing it.
 */
import * as React from "react";

import { Eyebrow } from "@/components/meridian/surface-parts";
import { PickCard } from "@/components/meridian/onramp-parts";
import { SketchBroken, SketchProblem, SketchScreen } from "@/components/meridian/sketch-glyphs";
import { EXAMPLE_SENTENCES, WHAT_IT_DOES } from "@/components/start/nobody-owned-the-empty-entry";

/**
 * A mark per shape, so the three cards have silhouettes rather than three
 * identical blocks of prose. `aria-hidden` inside `PickCard`; the sentence is
 * the only label. Same argument as `PickCard`'s own `glyph` docblock.
 */
const GLYPH: Record<(typeof EXAMPLE_SENTENCES)[number]["shape"], React.ReactNode> = {
  "interface-change": <SketchScreen />,
  "new-capability": <SketchProblem />,
  "incident-fix": <SketchBroken />,
};

export function FirstLook({
  onUse,
}: {
  /** Put the sentence in the composer, pick its shape, and focus the box. */
  onUse: (example: (typeof EXAMPLE_SENTENCES)[number]) => void;
}) {
  return (
    <section
      data-mrd=""
      aria-label="What this does"
      className="flex flex-col gap-mrd-4"
      /* Meridian's own arrival fade, keyed by name so the reduced-motion block
         in meridian.css can stop it. Same as `Hero`. */
      style={{ animation: "mrd-fade-in var(--mrd-d-move) var(--mrd-ease-soft) both" }}
    >
      <div className="flex flex-col gap-mrd-2">
        <Eyebrow>What this does</Eyebrow>
        {/*
         * The measure token, not a hand-picked width: this is prose and
         * `--mrd-measure-page` is what every other reading column on the entry
         * uses. A sentence this long at full page width is unreadable at 1920.
         */}
        <p className="max-w-[var(--mrd-measure-page)] text-mrd-prose leading-mrd-prose text-mrd-body">
          {WHAT_IT_DOES}
        </p>
      </div>

      <div className="flex flex-col gap-mrd-3">
        {/* Says what a press DOES, because a card that silently spent money
            would be the one thing this region must not do. */}
        <p className="mrd-meta">
          Examples of the kind of sentence it can act on. Pick one to put it in the box, then change
          it to yours.
        </p>
        <ul className="grid gap-mrd-3 md:grid-cols-3">
          {EXAMPLE_SENTENCES.map((example) => (
            <li key={example.sentence}>
              <PickCard
                lead={example.sentence}
                sub={example.why}
                glyph={GLYPH[example.shape]}
                onSelect={() => onUse(example)}
                className="h-full"
                /* The why exists nowhere but this card -- the press carries only
                   the sentence -- so it is never clipped behind a tooltip a
                   touch device will never show. Same call `StarterRuns` makes. */
                clamp={false}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default FirstLook;
