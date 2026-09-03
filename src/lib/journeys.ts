/**
 * Journeys as data (front-end reimagining, Phase 2 groundwork).
 *
 * Encodes the shippable journeys from
 * docs/planning/front-end-reimagining/journey-catalog.md as typed data the
 * composer chips, Spine slice highlights, and forward doors (NextLine) all
 * read from one place. Claim never outruns wiring: every journey carries a
 * wiredVia list naming the real server functions (file + export) its slice
 * runs on, and the companion test (journeys.test.ts) opens each file and
 * fails when a named export is missing. A journey without real wiring does
 * not belong in this file.
 *
 * Shipping decisions against the catalog's GAP lines (all verified 2026-07-19):
 * - J1..J7 and J0 all ship: each maps to server functions that exist today.
 * - J2 ships scoped to EXISTING opportunities/specs. The catalog GAP-flags
 *   the one-step "paste a raw idea and tear it down" composition as unbuilt,
 *   so the chip must attach to an artifact, not free text alone.
 * - J6 ends at "copy in hand". Launch kit drafts have no outbound channel
 *   wiring; the UI offers copy-out, never implies publishing.
 * - J7 is human-attested, not measured: present it as "record how it
 *   landed", never "we measured how it landed".
 * - J0 is the CHAIN of the slices (FULL_LOOP_CHAIN), not a separate machine.
 *   Its wiring is the union of the chained slices' wiring.
 * - Excluded entirely: nothing from the shippable set. The spend-gate GAP
 *   affects the tray's filter buckets, not any journey here.
 */

import type { LoopStageId } from "@/lib/loop-state.functions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JourneyId = "j0" | "j1" | "j2" | "j3" | "j4" | "j5" | "j6" | "j7";

/** The three canonical doors into a journey (journey-catalog Part B intro).
 *  This field records the PRIMARY door; spine nodes and forward doors remain
 *  secondary entries for most journeys. */
export type JourneyEntry = "composer-chip" | "spine" | "gate";

/** A real server function this journey's slice runs on. The test asserts the
 *  file exists and exports the named function. */
export interface JourneyWiring {
  /** Repo-relative path under src/lib. */
  file: string;
  /** The exported server-function name. */
  fn: string;
}

/** The typed DONE-to-start handoff (journey-catalog "Build the slices,
 *  compose the loop"): what the journey hands over and which journey the
 *  forward door suggests next. */
export interface JourneyHandoff {
  artifactKind: string;
  suggestedNextJourneyId: JourneyId;
}

export interface Journey {
  id: JourneyId;
  /** Plain words, catalog naming, humanized. */
  label: string;
  entry: JourneyEntry;
  /** The Spine slice this journey lights (untouched stages stay dim). */
  stages: LoopStageId[];
  /** Plain-words "Starts from" cap for the slice's first stage. */
  startState: string;
  /** Plain-words "Ends with" cap for the slice's last stage. */
  doneState: string;
  handoff: JourneyHandoff;
  /** Verified wiring; never empty. */
  wiredVia: JourneyWiring[];
}

// ---------------------------------------------------------------------------
// The slices (J1..J7)
// ---------------------------------------------------------------------------

const J1: Journey = {
  id: "j1",
  label: "What should we build next?",
  entry: "composer-chip",
  stages: ["discover", "decide"],
  startState: "Any signals present. Works from zero: the Researcher can fetch market signal first.",
  doneState:
    "A ranked, Critic-reviewed bet list. The approved bet sits at the top of Decide with its evidence chain.",
  // Catalog lists "Tear this down first?" ahead of "Write the spec"; the
  // card may render both doors, this is the suggested one.
  handoff: { artifactKind: "opportunity", suggestedNextJourneyId: "j2" },
  wiredVia: [
    { file: "src/lib/discovery.functions.ts", fn: "clusterSignals" },
    { file: "src/lib/discovery.functions.ts", fn: "runCriticReview" },
    { file: "src/lib/brief-opportunity.functions.ts", fn: "getBriefAlignment" },
    { file: "src/lib/approvals-queue.functions.ts", fn: "decideApprovalItem" },
  ],
};

const J2: Journey = {
  id: "j2",
  label: "Tear this idea down",
  entry: "composer-chip",
  stages: ["decide"],
  // GAP honesty: the one-call "paste raw text and tear it down" seam does
  // not exist yet, so this journey starts from an existing artifact.
  startState: "An existing opportunity or spec to challenge.",
  doneState: "A teardown verdict on the record, attached to the idea for good.",
  handoff: { artifactKind: "teardown-verdict", suggestedNextJourneyId: "j3" },
  wiredVia: [
    { file: "src/lib/discovery.functions.ts", fn: "runWedgeTeardown" },
    { file: "src/lib/fanout.functions.ts", fn: "dispatchExploration" },
    { file: "src/lib/fanout.functions.ts", fn: "decideFanoutBatch" },
  ],
};

const J3: Journey = {
  id: "j3",
  label: "Just write the PRD",
  entry: "composer-chip",
  stages: ["plan"],
  startState: "An approved opportunity, or a bare idea typed in the composer.",
  doneState: "An approved, cited spec with assumptions on watch and a task graph.",
  // Catalog: design stage on suggests "Design it" (j5); the UI substitutes
  // j4 where design_stage_enabled is off for the workspace.
  handoff: { artifactKind: "spec", suggestedNextJourneyId: "j5" },
  wiredVia: [
    { file: "src/lib/discovery.functions.ts", fn: "generatePrd" },
    { file: "src/lib/discovery.functions.ts", fn: "prdAssist" },
    { file: "src/lib/discovery.functions.ts", fn: "generateTaskGraph" },
  ],
};

const J4: Journey = {
  id: "j4",
  label: "Build this feature",
  entry: "composer-chip",
  stages: ["build"],
  startState:
    "An approved spec plus a reachable repo. No repo yet: the journey creates one in your GitHub.",
  doneState: "Applied changeset, green CI, a preview URL, and a PR opened on your repo.",
  handoff: { artifactKind: "changeset", suggestedNextJourneyId: "j6" },
  wiredVia: [
    // P-29 (A-QUEUE.md, 2026-09-03): dispatchStudioSession is deleted -- it
    // lost its last three callers to R-35 (no door outside the track path
    // may create a mission). dispatchBuilderMission (build.functions.ts) is
    // the one remaining server-side dispatch path that enforces the spec
    // gate (spec-gate.test.ts's own reachability check, and this file's own
    // "j0" wiring-honesty test, both confirm the name).
    { file: "src/lib/build.functions.ts", fn: "dispatchBuilderMission" },
    { file: "src/lib/new-build.functions.ts", fn: "canDispatchToRepo" },
    { file: "src/lib/new-build.functions.ts", fn: "provisionRepoForSpec" },
  ],
};

const J5: Journey = {
  id: "j5",
  label: "Design this",
  entry: "composer-chip",
  stages: ["design"],
  startState: "A spec, approved or in progress.",
  doneState: "An approved mockup bound to the spec. Build inherits it.",
  handoff: { artifactKind: "mockup", suggestedNextJourneyId: "j4" },
  wiredVia: [
    { file: "src/lib/design-scaffold.functions.ts", fn: "generateDesignScaffold" },
    { file: "src/lib/design-scaffold.functions.ts", fn: "runScaffoldDesignCritic" },
    { file: "src/lib/design-scaffold.functions.ts", fn: "decideDesignGate" },
  ],
};

const J6: Journey = {
  id: "j6",
  label: "Launch what we shipped",
  entry: "composer-chip",
  stages: ["ship"],
  startState: "A shipped or shippable changeset.",
  // GAP honesty: the kit is drafts with copy-out affordances; nothing is
  // sent or scheduled from here.
  doneState:
    "Live in production, changelog written, launch copy in hand, outcome check armed with a date.",
  handoff: { artifactKind: "release", suggestedNextJourneyId: "j7" },
  wiredVia: [
    { file: "src/lib/deployments.functions.ts", fn: "promoteToProduction" },
    { file: "src/lib/studio.functions.ts", fn: "generateReleaseNotes" },
    { file: "src/lib/studio.functions.ts", fn: "generateLaunchKit" },
    { file: "src/lib/launch-plan.functions.ts", fn: "generateLaunchPlan" },
  ],
};

const J7: Journey = {
  id: "j7",
  // GAP honesty: human-attested. The UI says "record how it landed".
  label: "How did it land?",
  entry: "gate",
  stages: ["learn"],
  startState:
    "A shipped PRD with an outcome contract, ideally with the check window already armed.",
  doneState: "The outcome recorded. The learning is on the record; challenged assumptions flagged.",
  handoff: { artifactKind: "learning", suggestedNextJourneyId: "j1" },
  wiredVia: [
    { file: "src/lib/outcome.functions.ts", fn: "getOutcomeData" },
    { file: "src/lib/outcome.functions.ts", fn: "checkPrdShipped" },
    { file: "src/lib/outcome.functions.ts", fn: "recordOutcome" },
  ],
};

/** J0's chain: the full loop is the composition of the slices, DONE flowing
 *  into the next start. J5 participates only where the workspace has the
 *  design stage enabled; J2 is the optional adversarial beat. */
export const FULL_LOOP_CHAIN: readonly JourneyId[] = ["j1", "j2", "j3", "j5", "j4", "j6", "j7"];

const CHAINED_SLICES: Journey[] = [J1, J2, J3, J5, J4, J6, J7];

function dedupeWiring(wiring: JourneyWiring[]): JourneyWiring[] {
  const seen = new Set<string>();
  const out: JourneyWiring[] = [];
  for (const w of wiring) {
    const key = `${w.file}#${w.fn}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(w);
    }
  }
  return out;
}

const J0: Journey = {
  id: "j0",
  label: "Take it from signal to shipped",
  entry: "composer-chip",
  stages: ["discover", "decide", "plan", "design", "build", "ship", "learn"],
  startState: "Anything the first slice accepts.",
  doneState:
    "The loop closes at Learn. The whole run reads left to right on the spine as one slice.",
  handoff: { artifactKind: "learning", suggestedNextJourneyId: "j1" },
  // The chain IS the wiring: no separate orchestration exists or should.
  wiredVia: dedupeWiring(CHAINED_SLICES.flatMap((j) => j.wiredVia)),
};

// ---------------------------------------------------------------------------
// The catalog
// ---------------------------------------------------------------------------

export const JOURNEYS: readonly Journey[] = [J0, J1, J2, J3, J4, J5, J6, J7];

const BY_ID = new Map<JourneyId, Journey>(JOURNEYS.map((j) => [j.id, j]));

export function journeyById(id: JourneyId): Journey {
  const j = BY_ID.get(id);
  if (!j) throw new Error(`Unknown journey id: ${id}`);
  return j;
}

/** The Spine slice a journey lights (a copy; callers may not mutate data). */
export function spineSliceFor(journeyId: JourneyId): LoopStageId[] {
  return [...journeyById(journeyId).stages];
}

// ---------------------------------------------------------------------------
// Intent matching (chip suggestions)
// ---------------------------------------------------------------------------

/**
 * Light keyword matching for composer chip suggestions. Pure, first match
 * wins, order matters: specific phrasings before generic verbs so
 * "what should we build next" lands on J1, not on J4's bare "build".
 * Returns null when nothing matches; the composer then offers no chip and
 * lets Ask handle the text. This is a suggestion aid, never a router:
 * the user always confirms the chip before anything runs.
 */
const INTENT_RULES: ReadonlyArray<{ id: JourneyId; patterns: RegExp[] }> = [
  {
    id: "j0",
    patterns: [/signal to shipped/, /full loop/, /whole loop/, /end to end/],
  },
  {
    id: "j1",
    patterns: [
      /what should we build/,
      /build next/,
      /what'?s next/,
      /next bet/,
      /rank(ed)? (the )?(bets|opportunit)/,
      /prioriti[sz]e/,
    ],
  },
  {
    id: "j7",
    patterns: [/how did it land/, /did it land/, /outcome/, /how'?s it (doing|landing)/],
  },
  {
    id: "j2",
    patterns: [
      /tear (it|this|that|.+?) down/,
      /teardown/,
      /poke holes/,
      /devil'?s advocate/,
      /strongest case against/,
    ],
  },
  {
    id: "j3",
    patterns: [/\bprd\b/, /write the spec/, /\bspec (it|this|out)\b/, /requirements doc/],
  },
  {
    id: "j5",
    patterns: [/design (it|this|that)/, /mock ?up/, /prototype/, /scaffold/],
  },
  {
    id: "j6",
    patterns: [
      /launch/,
      /\bship (it|this|that|what)\b/,
      /release notes/,
      /announce/,
      /promote to production/,
    ],
  },
  {
    id: "j4",
    patterns: [/\bbuild\b/, /\bimplement\b/, /code (it|this|that|up)/],
  },
];

export function journeyForIntent(text: string): Journey | null {
  const t = text.trim().toLowerCase();
  if (t.length === 0) return null;
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(t))) return journeyById(rule.id);
  }
  return null;
}
