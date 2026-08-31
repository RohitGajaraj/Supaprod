/**
 * THE SEVEN STATIONS, SAID IN THE CUSTOMER'S VOCABULARY — gap #26, the shell half.
 *
 * `RANKED-BACKLOG.md` TIER 2: *"#26 · The SDLC vocabulary as a display
 * translation — S1 the map · S2 the shell. R-01 already decoupled slug from
 * display. **One vocabulary at a time; never both on screen.**"*
 *
 * The map is S1's and already built: `src/components/track/sdlc-words.ts`,
 * whose `oneVocabulary` had **no importer outside its own test**. This is the
 * shell consuming it rather than a second copy of it — `SESSION-2` §RUN-ROWS's
 * reuse duty, and the same rule that made `groupKeyOf` exported instead of
 * restated.
 *
 * ── WHY THIS IS A LOOKUP AND NOT A MODE SWITCH ────────────────────────────
 * `SPEC-AI-NATIVE-SDLC.md` §4.2 refusal 3 justifies the whole item with one
 * sentence: *"the mapping becomes a translation the product speaks, so a
 * customer asking 'where is my `spec.md`' is answered in their words."* **That
 * is a question, not a preference**, and the strip is the wrong place to answer
 * it — see `theirStrip` below, where their Design absorbs TWO of our stations,
 * so a seven-chip strip in their vocabulary reads `Design · Design` and a
 * six-chip one silently changes how many stations the product has.
 *
 * So the substance here is the honest translation and the answer to the
 * question. **Nothing in this module renders a second vocabulary beside ours.**
 *
 * ── THE CLASH THAT MAKES "NEVER BOTH ON SCREEN" A RULE AND NOT A PREFERENCE ─
 * Two words exist in both vocabularies meaning DIFFERENT stations:
 *
 *   "Plan"    ours = `define` (third)      theirs = our `decide` (second)
 *   "Design"  ours = `design` (fourth)     theirs = our `define` AND `design`
 *
 * A screen showing both therefore does not merely look cluttered — **it is
 * ambiguous in a way the reader cannot detect**, because the same word is
 * correct in each vocabulary and means a different step in each. That is why
 * the backlog's rule is absolute, and `vocabularyClash` states it in code so a
 * later surface cannot rediscover it the expensive way.
 */
import {
  oneVocabulary,
  sdlcWordsFor,
  stationsForArtifact,
  UNCOVERED_STAGE,
} from "@/components/track/sdlc-words";
import { AGENT_STATIONS, AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

/** One stage as the customer's playbook names it, and what of ours it covers. */
export interface TheirStage {
  /** Their word. For an uncovered stage, still their word. */
  label: string;
  /** Our stations it covers, in route order. Empty only for an uncovered stage. */
  stations: AgentStation[];
  /** Our display names for those stations, so a caller never re-derives them. */
  ours: string[];
  /**
   * False for a stage of theirs we do not run at all — their **Test**.
   *
   * `sdlc-words.ts` states the reason and it is worth repeating at the surface:
   * *"a six-stage list rendered as five is a claim that the sixth did not
   * exist."* An uncovered stage is DRAWN and marked, never dropped.
   */
  covered: boolean;
  /**
   * False where their playbook has no word and ours is standing in.
   *
   * Only `sense`/Discover — *"the half they do not have"*, because their
   * pipeline starts with someone who already knows the problem. `oneVocabulary`
   * returns this rather than substituting silently, and a surface that ignores
   * it puts our word in their column while looking like neither vocabulary.
   */
  borrowed: boolean;
  /** Why this stage is not covered. Present only when `covered` is false. */
  because?: string;
}

/**
 * The route in their vocabulary, honest about all three asymmetries.
 *
 * **Adjacent stages carrying the same word collapse into one entry**, because
 * their Design is our Plan AND our Design. Two chips both reading *"Design"*
 * would read as a rendering bug; two stations named inside one stage is what is
 * actually true. The collapse is adjacency-only and deliberately so — a
 * repeated word that is NOT adjacent would mean the route revisits a stage, and
 * merging those would hide it.
 *
 * **Their Test is inserted at its real position**, after Build, marked
 * `covered: false`. We fold the check inside Build (F-148) and gaps #21/#22 are
 * what would earn the stage.
 */
export function theirStrip(): TheirStage[] {
  const rows = oneVocabulary("theirs", AGENT_STATION_ORDER);
  const out: TheirStage[] = [];

  for (const row of rows) {
    const last = out[out.length - 1];
    /* Collapse only into the immediately preceding stage, and only when both
       are genuinely borrowed. Merging a borrowed word into an unborrowed one
       would file one of our stations under a word their playbook never gave
       us. */
    if (last && last.covered && last.label === row.label && last.borrowed === row.borrowed) {
      last.stations.push(row.station);
      last.ours.push(AGENT_STATIONS[row.station]?.name ?? row.station);
      continue;
    }
    out.push({
      label: row.label,
      stations: [row.station],
      ours: [AGENT_STATIONS[row.station]?.name ?? row.station],
      covered: true,
      borrowed: row.borrowed,
    });

    /* THEIR TEST GOES IN AFTER BUILD, WHICH IS WHERE THEY PUT IT. Appending it
       at the end would put it after Maintain and misdescribe their pipeline
       while claiming to speak it. */
    if (row.station === "build") {
      out.push({
        label: UNCOVERED_STAGE.stage,
        stations: [],
        ours: [],
        covered: false,
        borrowed: true,
        because: UNCOVERED_STAGE.because,
      });
    }
  }
  return out;
}

/**
 * *"Where is my `spec.md`?"* — the question this whole item exists to answer.
 *
 * Returns one sentence in **our** words about a file named in **theirs**, which
 * is the only combination that is not two vocabularies on one screen: they
 * asked using their noun, so the noun is quoted back and everything else is
 * ours.
 *
 * **Null when we do not produce it**, and null is the honest answer rather than
 * a guess. A file we have never heard of and a file we deliberately do not emit
 * are both "not here"; inventing a station for either is the fabrication this
 * repo deletes features over.
 */
export function answerForArtifact(artifact: string): string | null {
  const name = artifact.trim();
  if (!name) return null;
  const stations = stationsForArtifact(name);
  if (stations.length === 0) return null;

  const ours = stations.map((s) => AGENT_STATIONS[s]?.name ?? s);
  /* Two stations is the normal case for `spec.md`, not an edge one: their
     Design covers our Plan and our Design, so the honest answer names both. */
  const who =
    ours.length === 1 ? ours[0]! : `${ours.slice(0, -1).join(", ")} and ${ours[ours.length - 1]!}`;
  const verb = ours.length === 1 ? "files" : "file";
  return `${who} ${verb} your ${name}.`;
}

/**
 * The words that mean different steps in the two vocabularies.
 *
 * Derived rather than listed, so it stays true if S1's map changes. A word is a
 * clash when it is one of OUR station names AND one of THEIR stage names, and
 * the stations behind those two readings are not the same set.
 *
 * This exists to be asserted on. It is the evidence for *"one vocabulary at a
 * time"* being a correctness rule rather than a style preference.
 */
export function vocabularyClash(): string[] {
  const clashes: string[] = [];
  for (const station of AGENT_STATION_ORDER) {
    const ourWord = AGENT_STATIONS[station]?.name;
    if (!ourWord) continue;
    /* Every station THEY would file under this same word. */
    const theirs = AGENT_STATION_ORDER.filter((s) => sdlcWordsFor(s)?.stage === ourWord);
    if (theirs.length === 0) continue;
    if (theirs.length === 1 && theirs[0] === station) continue; // the word agrees
    clashes.push(ourWord);
  }
  return [...new Set(clashes)].sort();
}
