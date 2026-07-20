// Mission Control vocabulary (front-end reimagining, Phase R).
//
// Ships the working-state verb decks from
// docs/planning/front-end-reimagining/research/vocabulary-and-voice.md as data,
// plus drawWorkingLine(stage, agentSlug, seed): the one draw helper every live
// surface (Working strip, PulseLine, Spine hover) consumes so they can never
// disagree. Extends src/lib/agent-vocabulary.ts; never modifies or shadows it.
//
// The rotation contract (binding, research doc section 0):
//   1. Session-seeded Fisher-Yates shuffle; a line cannot repeat until the
//      deck is exhausted, then reshuffle (never the same line twice in a row
//      across the boundary).
//   2. Specific beats generic: when the engine knows the real object, callers
//      use the status sentence shapes with the real noun; the deck is the
//      fallback when only stage and agent are known.
//   3. A deck line is a lowercase predicate. The renderer prefixes the agent
//      display name ("Draft is tightening the acceptance criteria.").
//   4. Never two identical lines on screen at once: pass the visible lines as
//      `avoid` and the draw skips them when it can.
//
// This file is client-safe (no server imports).

import { type AgentStation, agentDisplayName, catalogEntry } from "@/lib/agent-vocabulary";

/** The seven loop stages. Same axis the agent catalog stations use. */
export type MissionStage = AgentStation;

// ---------------------------------------------------------------------------
// The typed mission-state vocabulary (spec 6.1): one TS union renders
// everywhere (Spine, tray, SurfaceHeader) so the same state never has two
// names. Never a generic "active".
// ---------------------------------------------------------------------------

export type MissionStateKind = "working" | "needs-you" | "done" | "blocked";

export type MissionStateId =
  "plan-ready" | "awaiting-your-decision" | "blocked-on-access" | "building" | "shipped";

export interface MissionStateMeta {
  label: string;
  kind: MissionStateKind;
}

export const MISSION_STATES: Record<MissionStateId, MissionStateMeta> = {
  "plan-ready": { label: "Plan ready", kind: "needs-you" },
  "awaiting-your-decision": { label: "Awaiting your decision", kind: "needs-you" },
  "blocked-on-access": { label: "Blocked on access", kind: "blocked" },
  building: { label: "Building", kind: "working" },
  shipped: { label: "Shipped", kind: "done" },
};

// ---------------------------------------------------------------------------
// The working-state verb decks: twelve lines per stage, all present
// progressive, all honest. Stage keys are catalog stations; the user-facing
// stage names are Discover, Decide, Plan, Design, Build, Ship, Learn.
// ---------------------------------------------------------------------------

export const STAGE_DECKS: Record<MissionStage, readonly string[]> = {
  // 01 Discover
  sense: [
    "reading your sources",
    "sweeping the connected channels",
    "clustering what customers said this week",
    "pulling the fresh signals",
    "tracing a spike back to its source",
    "comparing this week against last",
    "sorting signal from noise",
    "checking what competitors shipped",
    "reading the support inbox",
    "lining up the evidence",
    "following a thread across your workspace",
    "writing up what changed",
  ],
  // 02 Decide
  decide: [
    "ranking the bets",
    "scoring impact against effort",
    "stress-testing the top pick",
    "arguing the other side",
    "checking the bet against memory",
    "reading past outcomes for a precedent",
    "weighing what it costs to wait",
    "narrowing the field",
    "red-teaming the call",
    "writing up the case",
    "hunting for the hidden assumption",
    "putting a number on the risk",
  ],
  // 03 Plan
  define: [
    "drafting the spec",
    "turning the decision into requirements",
    "cutting scope to the bone",
    "splitting the work into slices",
    "writing the acceptance criteria",
    "naming the risks up front",
    "sizing the first slice",
    "sequencing the work",
    "checking the spec against the decision",
    "tightening the language",
    "marking the open questions",
    "drawing the line for v1",
  ],
  // 04 Design
  design: [
    "mapping the flow",
    "sketching the first screen",
    "rendering it through your brand",
    "walking the unhappy path",
    "laying out the empty state",
    "choosing the words on the buttons",
    "wiring the prototype",
    "checking contrast and spacing",
    "pressure-testing the flow",
    "trimming a step out of the journey",
    "lining up the states: loading, empty, error",
    "making the default the right choice",
  ],
  // 05 Build
  build: [
    "reading the codebase first",
    "writing the change",
    "running the tests",
    "fixing a failing check",
    "wiring the endpoint",
    "reviewing the diff",
    "tightening an edge case",
    "rerunning the suite",
    "committing the change",
    "opening the pull request",
    "chasing a type error",
    "cleaning up after itself",
  ],
  // 06 Ship
  ship: [
    "staging the release",
    "checking the rollout gates",
    "writing the changelog",
    "drafting the announcement",
    "preparing the rollback path",
    "tagging the release",
    "verifying the deploy",
    "notifying the channels",
    "watching the first minutes live",
    "confirming the flags are set",
    "closing out the release",
    "putting the receipt on record",
  ],
  // 07 Learn
  learn: [
    "reading the first numbers",
    "comparing the outcome to the bet",
    "tracking the adoption curve",
    "separating novelty from habit",
    "reading what users did next",
    "checking whether the bet held",
    "flagging what surprised us",
    "writing the verdict",
    "feeding the result back to memory",
    "drafting the recap",
    "looking for the second-order effect",
    "closing the loop",
  ],
};

/**
 * Per-agent signature lines, keyed by DB slug (never renamed), mixed into the
 * agent's stage deck so the roster reads like people, not a template. The
 * Chief of Staff (`orchestrator`) draws from its own deck at any stage.
 */
export const AGENT_SIGNATURE_LINES: Record<string, readonly string[]> = {
  "discovery-scout": [
    "scanning the horizon",
    "flagging what moved overnight",
    "keeping an eye on the usual suspects",
  ],
  researcher: [
    "chasing the primary source",
    "cross-checking two claims that disagree",
    "reading past the headline",
  ],
  "customer-insights": [
    "reading between the tickets",
    "counting how many said the same thing",
    "pulling the exact quote",
  ],
  strategist: [
    "making the trade explicit",
    "asking what we'd drop to do this",
    "ranking with yesterday's results in hand",
  ],
  critic: [
    "looking for the weakest link",
    "asking who this breaks for",
    "playing the skeptic on purpose",
  ],
  "prd-writer": [
    "writing the sentence twice to get it right",
    "cutting a paragraph nobody needed",
    "pinning down the fuzzy requirement",
  ],
  "sprint-planner": [
    "finding the smallest shippable slice",
    "putting the risky work first",
    "counting the dependencies",
  ],
  "ux-architect": [
    "removing a click",
    "making the error state say something useful",
    "checking it holds up at a glance",
  ],
  builder: [
    "reading before writing",
    "leaving the code better than it found it",
    "naming things carefully",
  ],
  qa: [
    "trying to break it before users do",
    "checking the diff twice",
    "reading the tests as documentation",
  ],
  release: [
    "saying what changed in plain words",
    "leading with what it means for users",
    "skipping the fanfare",
  ],
  "data-analyst": [
    "interpreting, not just counting",
    "asking if the number would move anyway",
    "reading the curve, not the point",
  ],
  orchestrator: [
    "running the loop",
    "lining up your next call",
    "keeping the queue honest",
    "deciding who moves next",
  ],
};

/** Ambient bridge lines: gaps between steps where no agent owns the next one. */
export const AMBIENT_BRIDGE_LINES: readonly string[] = [
  "picking up where it left off",
  "handing the work to the next agent",
  "checking memory before starting",
  "writing down what just happened",
  "queuing the next step",
];

// ---------------------------------------------------------------------------
// The draw machinery: deterministic seeded shuffle, no repeat until the deck
// is exhausted, no identical line across a reshuffle boundary.
// ---------------------------------------------------------------------------

function hashString(input: string): number {
  // FNV-1a, 32 bit. Deterministic across sessions for the same seed string.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(deck: readonly string[], rngSeed: number): string[] {
  const rng = mulberry32(rngSeed);
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface DeckCycle {
  order: string[];
  index: number;
  round: number;
  last: string | null;
}

const cycles = new Map<string, DeckCycle>();

/** Test and HMR hygiene: forget every in-flight deck cycle. */
export function resetWorkingLineCycles(): void {
  cycles.clear();
}

/**
 * The deck a given (stage, agent) pair draws from: the stage deck plus the
 * agent's signature lines. The conductor draws only from its own deck at any
 * stage; unknown or crew slugs draw the stage deck alone.
 */
export function workingDeckFor(stage: MissionStage, agentSlug?: string | null): string[] {
  const slug = agentSlug?.toLowerCase() ?? "";
  const entry = catalogEntry(slug);
  const signature = AGENT_SIGNATURE_LINES[entry?.slug ?? slug] ?? [];
  if (entry?.conductor && signature.length > 0) return signature.slice();
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const line of [...STAGE_DECKS[stage], ...signature]) {
    if (seen.has(line)) continue;
    seen.add(line);
    merged.push(line);
  }
  return merged;
}

function drawFromDeck(key: string, deck: readonly string[], avoid?: readonly string[]): string {
  if (deck.length === 0) return "working";
  let cycle = cycles.get(key);
  if (!cycle || cycle.order.length !== deck.length) {
    cycle = { order: shuffled(deck, hashString(key)), index: 0, round: 0, last: null };
    cycles.set(key, cycle);
  }
  if (cycle.index >= cycle.order.length) {
    cycle.round += 1;
    cycle.order = shuffled(deck, hashString(`${key}#${cycle.round}`));
    cycle.index = 0;
    // Never the same line twice in a row across the reshuffle boundary.
    if (cycle.order.length > 1 && cycle.order[0] === cycle.last) {
      [cycle.order[0], cycle.order[1]] = [cycle.order[1], cycle.order[0]];
    }
  }
  // Never two identical lines on screen at once: skip lines the caller says
  // are already visible, when any un-avoided line remains in this cycle.
  if (avoid && avoid.length > 0) {
    const avoidSet = new Set(avoid);
    for (let i = cycle.index; i < cycle.order.length; i++) {
      if (!avoidSet.has(cycle.order[i])) {
        [cycle.order[cycle.index], cycle.order[i]] = [cycle.order[i], cycle.order[cycle.index]];
        break;
      }
    }
  }
  const line = cycle.order[cycle.index];
  cycle.index += 1;
  cycle.last = line;
  return line;
}

/**
 * Draw the next working line for a stage and agent. Session-seeded no-repeat
 * shuffle: within one seed, a line cannot recur until the whole deck has
 * shown. Returns a lowercase predicate ("reading your sources"); renderers
 * prefix the actor. Pass currently visible lines as `avoid` so two surfaces
 * never show the same line at once.
 */
export function drawWorkingLine(
  stage: MissionStage,
  agentSlug?: string | null,
  seed: string | number = "session",
  opts?: { avoid?: readonly string[] },
): string {
  const slug = agentSlug?.toLowerCase() ?? "";
  const key = `${seed}|${stage}|${slug}`;
  return drawFromDeck(key, workingDeckFor(stage, slug), opts?.avoid);
}

/** Draw an ambient bridge line (between steps, any stage), same rotation contract. */
export function drawBridgeLine(
  seed: string | number = "session",
  opts?: { avoid?: readonly string[] },
): string {
  return drawFromDeck(`${seed}|bridge`, AMBIENT_BRIDGE_LINES, opts?.avoid);
}

/**
 * The full Thread-register sentence for a drawn line: actor named, terminal
 * period. The ticker and Working strip render the bare predicate instead.
 */
export function workingSentence(
  stage: MissionStage,
  agentSlug: string,
  seed: string | number = "session",
  opts?: { avoid?: readonly string[] },
): string {
  const line = drawWorkingLine(stage, agentSlug, seed, opts);
  return `${agentDisplayName(agentSlug)} is ${line}.`;
}
