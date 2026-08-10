/**
 * WHERE ONE ASSERTION CAME FROM, marked on the assertion itself.
 *
 * The product's whole claim is that the record compounds: that what this
 * workspace sees is increasingly built out of what this workspace lived
 * through, rather than out of what a model reasoned or what is broadly true of
 * teams in general. That claim is made at page level in prose everywhere on
 * Brain, and prose is exactly where it cannot be checked. Marked per assertion
 * it becomes falsifiable: a reader counts the ember and sees for themselves how
 * much of the screen is theirs.
 *
 * THE THREE SOURCES, and the tokens are already defined for this and had no
 * consumer anywhere in the app (src/styles/ink.css, --sp-eviq-*):
 *
 *   MINE       your own settled outcomes and your own recorded calls. Ember,
 *              which in this shell marks the human and nothing else.
 *   INFERRED   an agent reasoned it from what it read. Stage-build blue, which
 *              already means an agent is working.
 *   BORROWED   a population prior: true of teams like yours, not known to be
 *              true of you. Deliberately neutral, and the weakest of the three.
 *
 * IT IS HONEST ON DAY ONE PRECISELY BECAUSE IT SAYS SO. On a new account almost
 * nothing is ember, and that is the point: the mark is not a badge, it is a
 * measurement, and a screen with no ember on it is telling the truth about a
 * record that has not been lived in yet.
 *
 * RENDERED AS A 2px LEFT RULE OR A DOT, NEVER A FILL. ink.css states that as an
 * invariant and gives the reason: at fill area three more colours would become
 * the loudest thing on screen and blow the shell's own colour budget.
 *
 * WHY IT IS INLINE STYLE AND NOT A CLASS. The stylesheet is not this lane's to
 * edit, and every token here resolves the same either way. If this outlives the
 * pass it should become `.sp-eviq` rules in primitives.css and lose the objects.
 */
import type { ReactNode } from "react";

export type EvidenceSource = "mine" | "inferred" | "borrowed";

const HUE: Record<EvidenceSource, string> = {
  mine: "var(--sp-eviq-mine)",
  inferred: "var(--sp-eviq-inferred)",
  borrowed: "var(--sp-eviq-borrowed)",
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
 * The dot. For a line of running text or a row's sub, where a rule would have
 * nothing to run down.
 *
 * `aria-hidden` on the mark plus a real word in the accessible name: a colour
 * is not information to a screen reader, and a second visible legend would cost
 * more room than the fact is worth.
 */
export function Provenance({ source }: { source: EvidenceSource }) {
  return (
    <span title={MEANING[source]} style={{ whiteSpace: "nowrap" }}>
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: HUE[source],
          marginRight: 5,
          verticalAlign: "middle",
        }}
      />
      <span className="sr-only">{MEANING[source]}</span>
    </span>
  );
}

/**
 * The 2px left rule. For a BLOCK of assertion -- a quoted finding, a recess --
 * where the mark should run the height of the thing it is about.
 *
 * The padding is the rule's own weight plus a space, so the text sits off the
 * rule rather than against it, and it is the only geometry this component owns.
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
        borderLeft: `var(--sp-eviq-rule) solid ${HUE[source]}`,
        paddingLeft: "var(--sp-space-3)",
      }}
    >
      <span className="sr-only">{MEANING[source]}</span>
      {children}
    </div>
  );
}
