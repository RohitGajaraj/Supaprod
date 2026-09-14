/**
 * ── THE TWO REGIONS THAT OWN AN OTHERWISE EMPTY ENTRY ─────────────────────
 *
 * The reasoning, the reproduction and the reason every OTHER region on this
 * page is right to draw nothing are all in
 * `nobody-owned-the-empty-entry.ts`. Read that first; this file is the paint.
 *
 * In short: signed in on the workspace the scope menu opens by default, the
 * whole home screen was a loading line and an empty text box, because each
 * region independently and correctly refused to speak. Nobody owned the sum.
 *
 * ── WHY THIS IS TWO COMPONENTS AND NOT ONE ────────────────────────────────
 * The first draft was one block sitting above the composer, and driving it in a
 * browser showed the cost immediately. On the empty workspace the screen then
 * carried FIVE regions all saying a version of "say a sentence" -- the
 * "nothing is waiting on you" panel, this sentence, the hero's invitation, this
 * region's examples, and `StarterRuns`' generated ones -- with two of them at
 * `text-mrd-h1`. That is the founder's *"dump of data"* reproduced by the fix
 * for it, which is the failure mode the earlier pass on this page warned about
 * in exactly these words: *"the page would have carried THREE sentences about
 * saying a sentence"*.
 *
 * So the two halves sit where each belongs and are gated separately:
 *
 *   `WhatThisDoes`      ABOVE the hero. What the machine is. Always drawn in
 *                       the empty state, because it is the only region that can
 *                       answer "what is this".
 *   `FirstLookExamples` BELOW the composer, next to where `StarterRuns` draws,
 *                       because a press fills the box ABOVE it. It stands down
 *                       entirely when `StarterRuns` will draw, since a sentence
 *                       written from this product's own one-liner beats a
 *                       generic one and two sets of example cards on one screen
 *                       is the duplication this whole change is removing.
 *
 * ── THE CARDS FILL THE BOX AND START NOTHING ──────────────────────────────
 * `onUse` puts the sentence in the composer, sets the shape, and focuses the
 * box. The person's own Enter is what spends money, which is the consent rule
 * `StarterRuns` and `ExampleJobs` already hold for a suggestion. Verified in a
 * browser: pressing a card filled the composer and left the route on `/start`
 * with no row written.
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

/**
 * What the machine is, in one sentence, above the invitation.
 *
 * NOT AT `h1`. The hero below it holds the page's one h1 and names the person's
 * own product; this is the frame around it and reads as prose. Two headings at
 * the same size, 200px apart, is what the empty screen had.
 */
export function WhatThisDoes() {
  return (
    <section
      data-mrd=""
      aria-label="What this does"
      className="flex flex-col gap-mrd-2"
      /* Meridian's own arrival fade, keyed by name so the reduced-motion block
         in meridian.css can stop it. Same as `Hero`. */
      style={{ animation: "mrd-fade-in var(--mrd-d-move) var(--mrd-ease-soft) both" }}
    >
      <Eyebrow>What this does</Eyebrow>
      {/* The measure token, not a hand-picked width: this is prose and
          `--mrd-measure-page` is what every other reading column on the entry
          uses. A sentence this long at full page width is unreadable at 1920. */}
      <p className="max-w-[var(--mrd-measure-page)] text-mrd-prose leading-mrd-prose text-mrd-body">
        {WHAT_IT_DOES}
      </p>
    </section>
  );
}

/**
 * Three sentences that teach the shape of one this product can act on.
 *
 * Drawn only when nothing better is available; see the file header and
 * `EXAMPLE_SENTENCES` for why invented examples are right in this state and
 * were wrong where they used to stand.
 */
export function FirstLookExamples({
  onUse,
}: {
  /** Put the sentence in the composer, pick its shape, and focus the box. */
  onUse: (example: (typeof EXAMPLE_SENTENCES)[number]) => void;
}) {
  return (
    <section data-mrd="" aria-label="Example sentences" className="flex flex-col gap-mrd-3">
      {/* Says what a press DOES, because a card that silently spent money would
          be the one thing this region must not do. */}
      <p className="mrd-meta">
        Examples of the kind of sentence it can act on. Pick one to put it in the box, then change it
        to yours.
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
                 the sentence -- so it is never clipped behind a tooltip a touch
                 device will never show. Same call `StarterRuns` makes. */
              clamp={false}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
