import { AGENT_STATIONS, AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

/**
 * THE SAME SEVEN STATIONS, SAID IN THE PLAYBOOK'S WORDS. GAP #26.
 *
 * ── WHY THIS EXISTS: A REFUSAL WE AGREED TO PAY FOR ───────────────────────
 * `SESSION-1-THE-RUN.md` §STATIONS: the seven stations stay exactly as they
 * are and we do **not** renumber to Anthropic's six — *"but that refusal is
 * PAID FOR, not free: the mapping in `SPEC-AI-NATIVE-SDLC.md` §2 becomes a
 * translation the product speaks, so a customer asking 'where is my spec.md'
 * is answered in their words. Refusing a rename is not refusing the
 * vocabulary."* This is that payment.
 *
 * R-01 already decoupled slug from display, so this is a third column on a
 * decoupling that exists rather than a new concept.
 *
 * ── THE TRAP, AND IT IS THE WHOLE REASON THIS IS A MODULE AND NOT A RECORD ─
 * **"Plan" is a word in both vocabularies and it means different stations.**
 *
 *   their Plan   (stage 1, `intent.md`)  ==  our **Decide**
 *   our Plan     (`define`)              ==  their **Design**
 *
 * So a surface that switches vocabulary carelessly leaves one word meaning two
 * things — and a reader who has learned "Plan" in our product opens their
 * playbook and finds it somewhere else. That is F-150's defect at vocabulary
 * scale: one idea wearing two names, in a map nothing type-checks.
 *
 * **Hence `oneVocabulary()` rather than two exported records.** A caller cannot
 * accidentally hold our word for one station and theirs for the next, because
 * the choice is made once for the whole list. §5's own rule: *one vocabulary at
 * a time on screen; never both.*
 *
 * ── AND TWO HONEST GAPS THAT ARE NOT ALLOWED TO GO QUIET ──────────────────
 * 1. **Discover has no counterpart in their playbook at all.** §2's first
 *    reading: *"Their Stage 1 starts with a person who already knows the
 *    problem. That is ours, it is the harder half, and it stays."* So its
 *    translation is `null` and the surface says so, rather than borrowing a
 *    word that does not fit.
 * 2. **Their Test stage has no station of ours, and we do not claim it.** §2's
 *    second reading is a correction to that file's own earlier text (F-148):
 *    `verifyStationOutput` compiles nothing and executes nothing, and at Build
 *    it asks for artifact kind `mission` which the driver writes itself before
 *    any seat runs — *"so Build's self-check cannot fail no matter what the
 *    builder did."* **A filing check is not a verification check.** So Test is
 *    exported as an uncovered stage with the reason attached, and a surface
 *    showing their six MUST show it as not covered rather than skipping it.
 *    **Quietly omitting a stage is how a translation becomes a claim.**
 */

/** Their six, in their order. Ours is `AGENT_STATION_ORDER` and is unchanged. */
export type SdlcStage = "plan" | "design" | "build" | "test" | "deploy" | "maintain";

export type SdlcWords = {
  /** Their stage name, as they write it. */
  stage: string;
  /** The file their playbook expects at this stage, when there is one. */
  artifact: string | null;
};

/**
 * Our station to their stage. `null` means their playbook has no counterpart,
 * which is a fact worth saying rather than a hole to fill.
 *
 * Written per station and checked against `SPEC-AI-NATIVE-SDLC.md` §2's table
 * rather than derived, because the relation is not one-to-one in either
 * direction: two of ours collapse into their Design, and one of theirs has
 * nothing of ours at all.
 */
const SDLC: Readonly<Record<AgentStation, SdlcWords | null>> = {
  // Theirs starts with a person who already knows the problem. This is the
  // half they do not have, so it borrows no word.
  sense: null,
  decide: { stage: "Plan", artifact: "intent.md" },
  define: { stage: "Design", artifact: "spec.md" },
  design: { stage: "Design", artifact: "spec.md" },
  build: { stage: "Build", artifact: "plan.md" },
  ship: { stage: "Deploy", artifact: "REVIEW.md" },
  /*
   * Their Maintain is our Learn, and this is the row where we have MORE than
   * they do rather than less. Their stage 6 detects and opens a new
   * `intent.md`; ours also grades the forecast written at Decide, which their
   * pipeline has no artifact for at all (§2: "they published layers 01 and 02
   * and left 03 empty"). `verdict.md` is gap #27 and ours to define, so it is
   * named here as theirs-adjacent rather than as one of their files.
   */
  learn: { stage: "Maintain", artifact: null },
};

/**
 * THE STAGE OF THEIRS WE DO NOT COVER, stated rather than skipped.
 *
 * §2, F-148: we have no Test station and the station self-check is a FILING
 * check, not a verification check. Gap #22 and gap #21 are what would earn it.
 * Until then a surface speaking their vocabulary shows this and says it is not
 * covered, because a six-stage list rendered as five is a claim that the sixth
 * did not exist.
 */
export const UNCOVERED_STAGE: { stage: string; because: string } = {
  stage: "Test",
  because: "We do not cover this stage yet, so nothing here reports on it.",
};

/** Their word for one of ours, or null where their playbook has none. */
export function sdlcWordsFor(station: AgentStation): SdlcWords | null {
  return SDLC[station] ?? null;
}

/**
 * THE WHOLE ROUTE IN ONE VOCABULARY, WHICH IS THE ONLY WAY IT MAY BE READ.
 *
 * Returns a label per station, and `borrowed: false` on any station their
 * playbook cannot name. A caller renders `label` and, where `borrowed` is
 * false while showing theirs, has to decide what to do about it — the type
 * makes that visible instead of letting a `??` quietly substitute our word
 * into their column, which would put both vocabularies on one screen while
 * looking like neither.
 */
export function oneVocabulary(
  vocabulary: "ours" | "theirs",
  stations: readonly AgentStation[] = AGENT_STATION_ORDER,
): Array<{ station: AgentStation; label: string; borrowed: boolean }> {
  return stations.map((station) => {
    const ours = AGENT_STATIONS[station]?.name ?? station;
    if (vocabulary === "ours") return { station, label: ours, borrowed: true };
    const theirs = sdlcWordsFor(station);
    /*
     * Their word where they have one; OURS where they do not, and `borrowed`
     * false so the surface knows it is showing a word from the other
     * vocabulary. Falling back silently is the failure mode this whole module
     * exists to prevent, so the fallback is loud in the type rather than
     * absent.
     */
    return theirs
      ? { station, label: theirs.stage, borrowed: true }
      : { station, label: ours, borrowed: false };
  });
}

/**
 * The answer to *"where is my spec.md"*, which is the question §STATIONS says
 * this translation exists to answer. Returns every station of ours that
 * produces the file they named, in route order.
 */
export function stationsForArtifact(artifact: string): AgentStation[] {
  const want = artifact.trim().toLowerCase();
  return AGENT_STATION_ORDER.filter((s) => sdlcWordsFor(s)?.artifact?.toLowerCase() === want);
}
