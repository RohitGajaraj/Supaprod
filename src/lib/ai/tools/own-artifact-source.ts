/**
 * F-73: THE LOOP CITING ITS OWN SPEC AS CUSTOMER EVIDENCE.
 *
 * ── WHAT HAPPENED ──────────────────────────────────────────────────────────
 * Track `d1168015` cleared Discover on 2026-08-25 by filing three signals whose
 * `source` columns read, verbatim:
 *
 *     PRD b401ccd4-030a-47b9-adb9-507f153d2f71
 *     Decision f9ac68cb
 *     workspace.brief
 *
 * `b401ccd4` is ANOTHER TRACK'S PRD. Discover satisfied its station by citing
 * the product's own output as evidence about the world.
 *
 * ── WHY THE EXISTING GUARD DID NOT CATCH IT ────────────────────────────────
 * `the-loop-must-not-eat-its-own-exhaust.test.ts` was built against agents
 * filing ABSENCE — "No signals found for X" — which reads obviously empty. This
 * is the same disease with better manners: a spec cited as a signal reads
 * SUBSTANTIVE. It becomes evidence for the next decision, which becomes a spec,
 * which can be cited again, and nothing in the text looks wrong.
 *
 * ── WHY A REFUSAL RATHER THAN MORE WORDS IN THE DESCRIPTION ────────────────
 * The absence rule is a description line, and the description is advice. This
 * one is an integrity boundary: evidence about the world cannot originate in
 * the product, so the tool refuses rather than asks. Filing nothing is already
 * the correct, designed outcome (`produced-nothing` → `needs-evidence`), so a
 * refusal costs the crew nothing it is entitled to.
 *
 * ── THE SHAPE OF THE RULE ──────────────────────────────────────────────────
 * Three narrow patterns, each matching something no customer source looks like,
 * so a real interview or ticket cannot trip them:
 *
 *   1. the source IS an artifact kind          "PRD", "decision"
 *   2. an artifact kind followed by ITS ID     "PRD b401ccd4-…", "Decision f9ac68cb"
 *   3. an internal dotted namespace            "workspace.brief", "track.spec"
 *
 * A source that merely CONTAINS one of these words is left alone on purpose —
 * "post-decision interview" is a real place evidence comes from, and refusing
 * it would cost more than the exhaust it prevents.
 */

/** What the product itself produces. Evidence about the world never originates here. */
const OWN_ARTIFACT_KINDS = [
  "prd",
  "spec",
  "changeset",
  "mission",
  "track",
  "forecast",
  "learning",
  "decision",
  "theme",
  "roadmap",
  "opportunity",
  "brief",
] as const;

/** Its own row id trailing the kind: a uuid, or the short hex prefix the crews write. */
const LOOKS_LIKE_AN_ID = /^[0-9a-f]{6,}(-[0-9a-f]{4,})*$/i;

/** The namespaces the product uses for its own surfaces and tools. */
const INTERNAL_NAMESPACES = ["workspace", "product", "track", "mission", "prd", "spec", "decision"];

const singular = (word: string) => (word.endsWith("s") ? word.slice(0, -1) : word);

const isKind = (word: string) =>
  (OWN_ARTIFACT_KINDS as readonly string[]).includes(singular(word.toLowerCase()));

/**
 * The artifact kind this `source` names, or null when it names something real.
 *
 * PURE, so the rule can be tested against the exact strings that were filed
 * rather than against a mock of the write path.
 */
export function namesOwnArtifact(source: string | null | undefined): string | null {
  if (!source) return null;
  const trimmed = source.trim();
  if (trimmed.length === 0) return null;

  // 1 — the whole source is a kind.
  if (isKind(trimmed)) return singular(trimmed.toLowerCase());

  // 2 — a kind followed by its own id ("PRD b401ccd4-…", "Decision f9ac68cb").
  const words = trimmed.split(/\s+/);
  if (words.length === 2 && isKind(words[0]) && LOOKS_LIKE_AN_ID.test(words[1])) {
    return singular(words[0].toLowerCase());
  }

  // 3 — an internal dotted namespace ("workspace.brief"). Both halves must be
  //     ours: a customer source is not spelled `noun.noun` in lower case.
  const dotted = trimmed.toLowerCase().split(".");
  if (
    dotted.length === 2 &&
    INTERNAL_NAMESPACES.includes(dotted[0]) &&
    /^[a-z]+$/.test(dotted[1])
  ) {
    return `${dotted[0]}.${dotted[1]}`;
  }

  return null;
}

/**
 * What the crew is told when it tries. It names the offending source, says why
 * the boundary exists, and — the part that stops the same act wearing a new
 * title — makes the empty outcome explicitly allowed.
 */
export function ownArtifactRefusal(source: string, kind: string): string {
  return (
    `"${source}" names this product's own ${kind}, which is not evidence about the world, ` +
    `it is something the loop wrote. A spec cited as a signal becomes evidence for the next ` +
    `decision, which becomes the next spec. File what a person outside this product said or ` +
    `did, naming where it came from; if there is none, file nothing and say so, that is a ` +
    `correct, expected outcome, not a failure.`
  );
}
