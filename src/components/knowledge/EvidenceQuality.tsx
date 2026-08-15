/**
 * WHERE ONE ASSERTION CAME FROM, marked on the assertion itself.
 *
 * The product's whole claim is that the record compounds: that what this
 * workspace sees is increasingly built out of what this workspace lived
 * through, rather than out of what a model reasoned or what is broadly true of
 * teams in general. That claim is made at page level in prose everywhere on
 * Brain, and prose is exactly where it cannot be checked. Marked per assertion
 * it becomes falsifiable: a reader counts the marks and sees for themselves how
 * much of the screen is theirs.
 *
 * THE THREE SOURCES:
 *
 *   MINE       your own settled outcomes and your own recorded calls.
 *   INFERRED   an agent reasoned it from what it read.
 *   BORROWED   a population prior: true of teams like yours, not known to be
 *              true of you. Deliberately the weakest of the three.
 *
 * IT IS HONEST ON DAY ONE PRECISELY BECAUSE IT SAYS SO. On a new account almost
 * nothing is marked mine, and that is the point: the mark is not a badge, it is
 * a measurement, and a screen with none of it is telling the truth about a
 * record that has not been lived in yet.
 *
 * ── PROVENANCE IS A CATEGORY, AND IT IS NOT ONE OF THE FIVE ─────────────
 * This was `--sp-eviq-mine/-inferred/-borrowed`, which resolved through
 * `--sp-gate` (the human accent), `--sp-stage-build` and `--sp-mute`. Under
 * Meridian neither of the first two is available and the reason is worth
 * writing down, because the mapping looks obvious and is wrong:
 *
 *   `--mrd-you` means A PERSON IS REQUIRED, and nothing else. An assertion that
 *   came out of your own record is not asking you for anything; it already
 *   happened. Spending the human accent on it is exactly the drift that put
 *   ember on every focus ring in the old shell.
 *
 *   `--mrd-agent` means A MACHINE IS WORKING, present tense. An agent having
 *   reasoned something last Tuesday is not a machine working now.
 *
 * So this is categorical colour, which Meridian keeps as a separate system for
 * this case: `--mrd-viz-*`, explicitly never status.
 *
 * ── AND COLOUR IS NOT ALLOWED TO BE THE ONLY CARRIER ────────────────────
 * The three marks were three 6px dots differing ONLY in hue, which fails the
 * greyscale test the contract requires by name: in greyscale, and to the
 * commonest colour vision deficiencies, they are one mark repeated three times.
 * The header above asks a reader to COUNT them, which is the one thing that
 * cannot be done when they are indistinguishable.
 *
 * Each now has its own silhouette as well, which is the same rule
 * `station-glyphs.tsx` states for the seven stations: identity is shape.
 *   mine      a filled disc, solid because the fact is settled
 *   inferred  a hollow ring, open because nothing has closed it yet
 *   borrowed  a bar, which is not about you at all and does not pretend to be
 *
 * RENDERED AS A SMALL MARK OR A 2px LEFT RULE, NEVER A FILL. At fill area three
 * more colours would become the loudest thing on screen and spend the whole
 * restraint budget on a footnote.
 */
import type { ReactNode } from "react";

export type EvidenceSource = "mine" | "inferred" | "borrowed";

const HUE: Record<EvidenceSource, string> = {
  mine: "var(--mrd-viz-1)",
  inferred: "var(--mrd-viz-2)",
  // Not a viz stop, deliberately. A population prior is the absence of anything
  // learned about you, and the honest paint for that is the ink ramp rather
  // than a third series colour that would read as a third finding.
  borrowed: "var(--mrd-mute)",
};

/**
 * What each mark means, in the reader's words rather than ours. These are the
 * `title` strings, so they are the only explanation a hovering reader gets and
 * they have to carry the whole idea in one line. None of them says "we".
 */
const MEANING: Record<EvidenceSource, string> = {
  mine: "From your own record: something this workspace settled or shipped.",
  inferred: "An agent reasoned this from what it read. Nothing has confirmed it yet.",
  borrowed: "A general prior, not learned from your record.",
};

/**
 * The mark itself, sized to sit on a line of running text.
 *
 * `borrowed` is drawn as a bar rather than a shape with a middle, because it is
 * the one of the three that makes no claim about this workspace, and a bar is
 * the quietest thing that is still unmistakably not a dot.
 */
function Mark({ source }: { source: EvidenceSource }) {
  const hue = HUE[source];
  if (source === "borrowed") {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 7,
          height: 2,
          background: hue,
          marginRight: 5,
          verticalAlign: "middle",
        }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        // The ring is drawn with a border rather than a second element so the
        // two marks occupy exactly the same box and a column of them lines up.
        background: source === "mine" ? hue : "transparent",
        border: source === "inferred" ? `1.5px solid ${hue}` : undefined,
        marginRight: 5,
        verticalAlign: "middle",
      }}
    />
  );
}

/**
 * The inline mark. For a line of running text or a row's sub, where a rule
 * would have nothing to run down.
 *
 * `aria-hidden` on the mark plus a real sentence in the accessible name: a
 * colour is not information to a screen reader, and a second visible legend
 * would cost more room than the fact is worth.
 */
export function Provenance({ source }: { source: EvidenceSource }) {
  return (
    <span title={MEANING[source]} style={{ whiteSpace: "nowrap" }}>
      <Mark source={source} />
      <span className="sr-only">{MEANING[source]}</span>
    </span>
  );
}

/**
 * The 2px left rule. For a BLOCK of assertion, a quoted finding or a recess,
 * where the mark should run the height of the thing it is about.
 *
 * The padding matches Meridian's own `RecordSpeaks`, which draws the same
 * gesture for the same reason, so a rule and a record quote sitting in one
 * column start their text on the same line.
 */
export function EvidenceRule({
  source,
  children,
}: {
  source: EvidenceSource;
  children: ReactNode;
}) {
  return (
    <div
      title={MEANING[source]}
      style={{
        borderLeft: `2px solid ${HUE[source]}`,
        paddingLeft: "var(--mrd-s5)",
      }}
    >
      <span className="sr-only">{MEANING[source]}</span>
      {children}
    </div>
  );
}
