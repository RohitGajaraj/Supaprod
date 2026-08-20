import { TOOL_DEFAULTS } from "@/lib/ai/tools/defaults";

// The user-facing agent vocabulary (AGENT-EXP, 2026-06-18).
//
// Three tiers the product is built around:
//   - STATIONS (6): the standing spine the user navigates (Sense -> Decide ->
//     Define -> Build -> Ship -> Learn). Phases, not personnel.
//   - The CAST: named agents that appear IN MOTION under a station (the relay).
//     Each carries its own identity (name, hue, glyph, one-liner).
//   - CREW: engine-only mechanisms (event fan-out, memory consolidation) that
//     never surface to the end user; we see them only in the Engine Room.
//
// The SPECIALIST_CATALOG below is the single source of truth and the one
// growable axis: adding a specialist is one entry and it auto-folds into a
// station + face + identity with no other code change.
//
// Hard rule (rename-disclaimer pattern): DB slugs are NEVER renamed. This module
// is a pure DISPLAY mapping. `agents.slug` stays `discovery-scout`, `builder`,
// `customer-insights`, ... in the database and every server function; only what
// the human reads on screen changes. That is why several cast agents reuse an
// existing slug (e.g. `customer-insights` is shown as "Voice", `qa` as
// "Reviewer", `release` as "Herald", `data-analyst` as "Echo").
//
// The five legacy "faces" (scout/strategist/critic/scribe/chief-of-staff) are
// retained as a coarse grouping for back-compat with existing consumers; every
// catalog entry declares the face it rolls up to.
//
// This file is client-safe (no server imports) so route components and panels
// can call it directly while rendering agent identities.
//
// THE VOICE GRAMMAR (PC-28, the naming and voice pass - binding for every
// surface and every generated string, not just agent identities):
//   - Surfaces are outcome nouns: the D-family (Discover, Decide, Define,
//     Design) plus Today, Build, Brain, Ledger. No invented nouns, no
//     mechanism words as a surface name.
//   - Sublines say what the surface does for you, one plain sentence. The
//     sublines LOOM already shipped are good; do not rewrite a subline that
//     already reads this way just to reword it.
//   - Buttons are verb + object, sentence case, never mono-uppercase (Loom
//     §1 - the button hierarchy already bans the bare text-button; this adds
//     the copy rule on top: "Approve the spec", not "SUBMIT").
//   - Empty states are honest, name who acts next, and when: "Nothing needs
//     you. Supaprod's next sweep is at 2am." Never a bare "No results" or a
//     dead silence.
//   - Taglines derive from the one-liner family in docs/pitch/one-pager.md -
//     never invent a new slogan per surface.
//   - Mechanism words (mission, swarm, arc, eval, guardrail, drift, station,
//     specialist) stay OUT of user-facing copy everywhere except Engine
//     Room, where they are the correct technical whisper for the audience
//     that reads them (an engineer debugging, not a PM glancing at Today).
//     A subline may whisper the mechanism in small print for recognition
//     ("evals · guardrails") but never as the headline.

export type AgentFace = "scout" | "strategist" | "critic" | "scribe" | "chief-of-staff";
export type AgentStation = "sense" | "decide" | "define" | "design" | "build" | "ship" | "learn";
export type AgentTier = "cast" | "crew";

export interface AgentFaceMeta {
  /** The name shown to the user. */
  name: string;
  /** One-word function (the legacy v6 framing). */
  verb: string;
  /** One honest line about what this face does. */
  blurb: string;
}

/** The five legacy faces, kept for back-compat (coarse grouping). */
export const AGENT_FACES: Record<AgentFace, AgentFaceMeta> = {
  scout: { name: "Scout", verb: "senses", blurb: "Reads your sources and surfaces what changed." },
  strategist: {
    name: "Strategist",
    verb: "ranks",
    blurb: "Scores and re-ranks opportunities by impact.",
  },
  critic: { name: "Critic", verb: "challenges", blurb: "Red-teams the call before you make it." },
  scribe: {
    name: "Scribe",
    verb: "drafts",
    blurb: "Turns a decision into the artifact that follows.",
  },
  "chief-of-staff": {
    name: "Chief of Staff",
    verb: "orchestrates",
    blurb: "Runs the loop and brings you the calls that need you.",
  },
};

/** Ordered list of the five faces for legacy roster / sheet rendering. */
export const AGENT_FACE_ORDER: AgentFace[] = [
  "scout",
  "strategist",
  "critic",
  "scribe",
  "chief-of-staff",
];

export interface AgentStationMeta {
  id: AgentStation;
  /** The label shown on the loop spine. */
  name: string;
  /** Present-tense verb for the station. */
  verb: string;
  /** One outcome-framed line: what this station is for. */
  blurb: string;
}

/** The seven stations, in loop order. The standing spine the user navigates.
 *  ("Design" joined 2026-07-17, PC-29 repair pass: the Tempo nav revamp
 *  (2026-07-13) added Design as its own loop stage between Plan and Build,
 *  but the agent-experience canon was never updated to match - ux-architect
 *  carried the display name "Design" while still bucketed under "define",
 *  so its live relay showed Plan's drafting activity instead of its own.) */
export const AGENT_STATIONS: Record<AgentStation, AgentStationMeta> = {
  sense: {
    id: "sense",
    // FOUNDER RULING 2026-08-01: the first station is called Discover, on every
    // surface, with no exceptions.
    //
    // `sense` stays as the internal id, the same way `define` is the id of the
    // station a person calls Plan. What changed is that this display name used
    // to disagree with the rest of the product: the nav, the spine rail, the
    // audit-id ledger, the briefing, the Ask scope chip and the public landing
    // replay all said Discover, and only this map said Sense. Anything
    // rendering from here therefore leaked a word the customer had never seen,
    // which is how the Plan receipt came to read "Waived: sense, decide" while
    // the rail above it said Discover. run-strip.tsx had already worked around
    // it with a private alias calling this "the internal name", which is the
    // tell that the vocabulary, not the surface, was wrong.
    name: "Discover",
    verb: "senses",
    blurb: "Reads the world and surfaces what changed.",
  },
  decide: {
    id: "decide",
    name: "Decide",
    verb: "decides",
    blurb: "Ranks the bets and challenges the call.",
  },
  define: {
    id: "define",
    name: "Plan",
    verb: "plans",
    blurb: "Turns the decision into a spec and a plan.",
  },
  design: {
    id: "design",
    name: "Design",
    verb: "designs",
    blurb: "Maps the experience and renders it through your brand.",
  },
  build: {
    id: "build",
    name: "Build",
    verb: "builds",
    blurb: "Ships the change behind your gates.",
  },
  ship: {
    id: "ship",
    name: "Ship",
    verb: "ships",
    blurb: "Takes it to the world and says what changed.",
  },
  learn: {
    id: "learn",
    name: "Learn",
    verb: "learns",
    blurb: "Reads the outcome and feeds it back.",
  },
};

export const AGENT_STATION_ORDER: AgentStation[] = [
  "sense",
  "decide",
  "define",
  "design",
  "build",
  "ship",
  "learn",
];

export type SpecialistStatus = "active" | "deprecated";

export interface CatalogEntry {
  /** The DB slug. Never renamed. */
  slug: string;
  /** The friendly name shown to the user. */
  name: string;
  /** The station this agent serves. */
  station: AgentStation;
  /** The coarse legacy face this agent rolls up to. */
  face: AgentFace;
  /** cast = can appear in the relay; crew = engine-only, never user-facing. */
  tier: AgentTier;
  /** Present-tense phrase for the relay ("reading your sources"). */
  relayVerb: string;
  /** One outcome-framed line. */
  blurb: string;
  /** Per-agent hue from the agent palette (teal -> blue range per the
   *  violet-retirement ruling 2026-07-11; deliberately disjoint from the
   *  semantic status colors: ember/green/red). */
  hue: string;
  /** A lucide icon name, the agent's geometric mark. Color is never the only signal. */
  glyph: string;
  /**
   * active = seeded + shown; deprecated = map-only, renders a name on historical runs.
   *
   * ── AND `active` MEANS TWO DIFFERENT THINGS DEPENDING ON `tier` ─────────
   * Recorded 2026-08-20 rather than corrected, because correcting it is a data
   * change and this is the catalogue.
   *
   * For a `cast` agent the sentence above is true: active means it is seeded into
   * a workspace, shown in the roster, and dispatched by a station crew.
   *
   * For a `crew` agent it is false on both counts. `reactor` and `archivist` are
   * `active` and are seeded NOWHERE and shown NOWHERE, which is correct for what
   * they are -- engine-only mechanisms, dispatched by their own subsystem rather
   * than by a station -- and it means the word is carrying two meanings. The guard
   * that now reads it is in `spine/driver.test.ts`, and it asks the question per
   * tier rather than once: a cast agent must be in a station crew, and a crew
   * agent must NOT be, because a station-dispatched agent is by definition
   * user-facing.
   *
   * A third value would be the tidy fix and it is not obviously right: `tier`
   * already says engine-only, so a `status` of `engine` would say it twice and
   * the two could then disagree. Left as a documented split until somebody has a
   * reason to prefer one.
   */
  status: SpecialistStatus;
  /** The orchestrator/conductor: routes work, never a station occupant in the relay. */
  conductor?: boolean;
}

// THE CANONICAL CATALOG. Order = roster order within a station.
// Cast (active) first, then crew, then deprecated aliases (map-only).
export const SPECIALIST_CATALOG: CatalogEntry[] = [
  // --- CAST: Sense ---
  {
    slug: "discovery-scout",
    name: "Watch",
    station: "sense",
    face: "scout",
    tier: "cast",
    relayVerb: "reading your sources",
    blurb: "Watches your connected sources and surfaces what changed.",
    hue: "oklch(0.56 0.12 208)",
    glyph: "radar",
    status: "active",
  },
  {
    slug: "researcher",
    name: "Research",
    station: "sense",
    face: "scout",
    tier: "cast",
    relayVerb: "digging into the question",
    blurb: "Digs into a question across the web and your workspace.",
    hue: "oklch(0.54 0.115 189)",
    glyph: "search",
    status: "active",
  },
  {
    slug: "customer-insights",
    name: "Listen",
    station: "sense",
    face: "scout",
    tier: "cast",
    relayVerb: "clustering customer signals",
    blurb: "Clusters what customers are saying into themes.",
    hue: "oklch(0.58 0.12 236)",
    glyph: "messages-square",
    status: "active",
  },
  // --- CAST: Decide ---
  {
    slug: "strategist",
    name: "Prioritize",
    station: "decide",
    face: "strategist",
    tier: "cast",
    relayVerb: "ranking the bets",
    blurb: "Ranks and re-scores opportunities by impact.",
    hue: "oklch(0.55 0.13 227)",
    glyph: "target",
    status: "active",
  },
  {
    slug: "critic",
    name: "Challenge",
    station: "decide",
    face: "critic",
    tier: "cast",
    relayVerb: "red-teaming the call",
    blurb: "Red-teams the decision before you commit.",
    hue: "oklch(0.53 0.13 245)",
    glyph: "shield-alert",
    status: "active",
  },
  // --- CAST: Define ---
  {
    slug: "prd-writer",
    name: "Draft",
    station: "define",
    face: "scribe",
    tier: "cast",
    relayVerb: "drafting the spec",
    blurb: "Turns the decision into a clear spec.",
    hue: "oklch(0.57 0.115 199)",
    glyph: "file-text",
    status: "active",
  },
  {
    slug: "sprint-planner",
    name: "Plan",
    station: "define",
    face: "strategist",
    tier: "cast",
    relayVerb: "breaking it into work",
    blurb: "Breaks the spec into sprint-ready work.",
    hue: "oklch(0.55 0.11 180)",
    glyph: "list-checks",
    status: "active",
  },
  // --- CAST: Design ---
  {
    slug: "ux-architect",
    name: "Design",
    station: "design",
    face: "scribe",
    tier: "cast",
    relayVerb: "mapping the experience",
    blurb: "Maps the experience and renders it through your brand.",
    hue: "oklch(0.585 0.12 213)",
    glyph: "pen-tool",
    status: "active",
  },
  {
    // ADDED 2026-08-01. Design was the only station in the loop with a single
    // agent and therefore the only one where nothing checked the work before it
    // was handed on. Every other station already pairs a maker with a reader:
    // Decide has Challenge, Build has Review, Plan has Plan. A design that no
    // one reads against the standing system is how a surface ships looking like
    // it came from a different product.
    slug: "design-critic",
    name: "Critique",
    station: "design",
    face: "critic",
    tier: "cast",
    relayVerb: "reading the design back",
    blurb: "Reads the design against the standing system before it is built.",
    hue: "oklch(0.55 0.125 219)",
    glyph: "scan-eye",
    status: "active",
  },
  // --- CAST: Build ---
  {
    slug: "builder",
    name: "Engineer",
    station: "build",
    face: "scribe",
    tier: "cast",
    relayVerb: "writing the change",
    blurb: "Writes the change in your codebase.",
    hue: "oklch(0.525 0.12 194)",
    glyph: "code",
    status: "active",
  },
  {
    slug: "qa",
    name: "Review",
    station: "build",
    face: "critic",
    tier: "cast",
    relayVerb: "checking the diff",
    blurb: "Checks the diff before it ships.",
    hue: "oklch(0.55 0.135 241)",
    glyph: "check-check",
    status: "active",
  },
  // --- CAST: Ship ---
  {
    // ADDED 2026-08-01, and it runs BEFORE Announce, which is the point of it.
    // Ship is the one station whose action cannot be undone from inside the
    // product, and until now nothing stood between arriving at Ship and
    // publishing. `release.publish` sits at a hard review floor, so a person was
    // the only readiness check there was, which makes the gate do a job policy
    // should have done first.
    slug: "release-verifier",
    name: "Verify",
    station: "ship",
    face: "critic",
    tier: "cast",
    relayVerb: "checking it is ready to go out",
    blurb: "Checks the change is ready to go out, before it goes out.",
    hue: "oklch(0.57 0.125 255)",
    glyph: "clipboard-check",
    status: "active",
  },
  {
    slug: "release",
    name: "Announce",
    station: "ship",
    face: "scribe",
    tier: "cast",
    relayVerb: "announcing the release",
    blurb: "Announces what shipped: notes, changelog, post.",
    hue: "oklch(0.60 0.12 250)",
    glyph: "megaphone",
    status: "active",
  },
  // --- CAST: Learn ---
  {
    slug: "data-analyst",
    name: "Measure",
    station: "learn",
    face: "strategist",
    tier: "cast",
    relayVerb: "reading the outcome",
    blurb: "Reads the outcome against the bet and feeds the next.",
    hue: "oklch(0.565 0.11 203)",
    glyph: "activity",
    status: "active",
  },
  {
    // ADDED 2026-08-01. Measure grades ONE outcome; nothing turned that grade
    // into something the next piece of work would meet. The investor canon is
    // explicit that the brain is never storage, that it compounds and warns
    // before you repeat what went wrong, and a station that only writes a
    // learnings row is storage. This is the role that makes the claim true:
    // it generalises the verdict and promotes it into memory the next track's
    // Decide and Plan stations actually read.
    //
    // Distinct from Measure on purpose. Grading an outcome is quantitative and
    // bounded to one bet; deciding what it means for the next bet is judgment.
    // One agent doing both does the second badly, because it is finished by the
    // time it gets there.
    slug: "insight-keeper",
    name: "Guide",
    station: "learn",
    face: "strategist",
    tier: "cast",
    relayVerb: "turning the outcome into guidance",
    blurb: "Turns what happened into guidance the next piece of work will meet.",
    hue: "oklch(0.60 0.10 195)",
    glyph: "lightbulb",
    status: "active",
  },
  // --- CAST: the conductor ---
  {
    slug: "orchestrator",
    name: "Chief of Staff",
    station: "decide",
    face: "chief-of-staff",
    tier: "cast",
    relayVerb: "running the loop",
    blurb: "Runs the loop and brings you the calls that need you.",
    hue: "oklch(0.55 0.12 196)",
    glyph: "compass",
    status: "active",
    conductor: true,
  },

  // --- CREW: engine-only mechanisms, never user-facing (not seeded as loop agents) ---
  {
    slug: "reactor",
    name: "Reactor",
    station: "sense",
    face: "chief-of-staff",
    tier: "crew",
    relayVerb: "routing events",
    blurb: "Wakes the right agent when something happens.",
    hue: "oklch(0.55 0.11 180)",
    glyph: "zap",
    status: "active",
  },
  {
    slug: "archivist",
    name: "Archivist",
    station: "learn",
    face: "chief-of-staff",
    tier: "crew",
    relayVerb: "settling what was learned",
    blurb: "Consolidates what was learned for the crew to use.",
    hue: "oklch(0.565 0.11 203)",
    glyph: "archive",
    status: "active",
  },

  /*
   * ── DEPRECATED / ALIASES: map-only, a friendly name on historical runs ────
   *
   * THEY SHARE DISPLAY NAMES WITH THE LIVE AGENTS ON PURPOSE, and that is the
   * whole mechanism rather than an oversight. A run recorded months ago against
   * `scout` has to come back reading "Watch", not `scout` and not a title-cased
   * guess, so the alias carries the CURRENT name of the seat it used to be.
   *
   * WHICH MAKES ONE THING LOAD-BEARING: an alias may never be seeded. The moment
   * one is, its workspace has two rows with one name and no way to tell them
   * apart, which is the single failure a job-verb naming scheme exists to prevent.
   *
   * THAT IS LIVE TODAY AND IT IS A DATA DEFECT, NOT A CATALOGUE ONE. `engineer`
   * is `deprecated` here and correct here, and it is seeded into all 16
   * workspaces in production, so both it and `builder` render as "Engineer" at
   * Build. Unseeding it is a migration and belongs to the lane with database
   * access; `spine/driver.test.ts` now guards the half that lives in this file, by
   * refusing two ACTIVE agents with one name at one station.
   *
   * Do not resolve the collision by renaming either one. `builder` is the live
   * seat and its name is the product's word for that job; renaming the alias
   * would break the only thing the alias is for.
   */
  {
    slug: "operations",
    name: "Chief of Staff",
    station: "decide",
    face: "chief-of-staff",
    tier: "cast",
    relayVerb: "running the loop",
    blurb: "Runs the loop and brings you the calls that need you.",
    hue: "oklch(0.55 0.12 196)",
    glyph: "compass",
    status: "deprecated",
  },
  {
    slug: "copilot",
    name: "Chief of Staff",
    station: "decide",
    face: "chief-of-staff",
    tier: "cast",
    relayVerb: "running the loop",
    blurb: "Runs the loop and brings you the calls that need you.",
    hue: "oklch(0.55 0.12 196)",
    glyph: "compass",
    status: "deprecated",
  },
  {
    slug: "support",
    name: "Chief of Staff",
    station: "decide",
    face: "chief-of-staff",
    tier: "cast",
    relayVerb: "running the loop",
    blurb: "Runs the loop and brings you the calls that need you.",
    hue: "oklch(0.55 0.12 196)",
    glyph: "compass",
    status: "deprecated",
  },
  {
    slug: "growth-strategist",
    name: "Prioritize",
    station: "decide",
    face: "strategist",
    tier: "cast",
    relayVerb: "ranking the bets",
    blurb: "Ranks and re-scores opportunities by impact.",
    hue: "oklch(0.55 0.13 227)",
    glyph: "target",
    status: "deprecated",
  },
  {
    slug: "quant",
    name: "Prioritize",
    station: "decide",
    face: "strategist",
    tier: "cast",
    relayVerb: "ranking the bets",
    blurb: "Ranks and re-scores opportunities by impact.",
    hue: "oklch(0.55 0.13 227)",
    glyph: "target",
    status: "deprecated",
  },
  {
    slug: "pricer",
    name: "Prioritize",
    station: "decide",
    face: "strategist",
    tier: "cast",
    relayVerb: "ranking the bets",
    blurb: "Ranks and re-scores opportunities by impact.",
    hue: "oklch(0.55 0.13 227)",
    glyph: "target",
    status: "deprecated",
  },
  {
    slug: "discovery",
    name: "Watch",
    station: "sense",
    face: "scout",
    tier: "cast",
    relayVerb: "reading your sources",
    blurb: "Watches your connected sources and surfaces what changed.",
    hue: "oklch(0.56 0.12 208)",
    glyph: "radar",
    status: "deprecated",
  },
  {
    slug: "scout",
    name: "Watch",
    station: "sense",
    face: "scout",
    tier: "cast",
    relayVerb: "reading your sources",
    blurb: "Watches your connected sources and surfaces what changed.",
    hue: "oklch(0.56 0.12 208)",
    glyph: "radar",
    status: "deprecated",
  },
  {
    slug: "listener",
    name: "Watch",
    station: "sense",
    face: "scout",
    tier: "cast",
    relayVerb: "reading your sources",
    blurb: "Watches your connected sources and surfaces what changed.",
    hue: "oklch(0.56 0.12 208)",
    glyph: "radar",
    status: "deprecated",
  },
  {
    slug: "research",
    name: "Research",
    station: "sense",
    face: "scout",
    tier: "cast",
    relayVerb: "digging into the question",
    blurb: "Digs into a question across the web and your workspace.",
    hue: "oklch(0.54 0.115 189)",
    glyph: "search",
    status: "deprecated",
  },
  {
    slug: "competitor-watcher",
    name: "Watch",
    station: "sense",
    face: "scout",
    tier: "cast",
    relayVerb: "reading your sources",
    blurb: "Watches your connected sources and surfaces what changed.",
    hue: "oklch(0.56 0.12 208)",
    glyph: "radar",
    status: "deprecated",
  },
  {
    slug: "historian",
    name: "Measure",
    station: "learn",
    face: "strategist",
    tier: "cast",
    relayVerb: "reading the outcome",
    blurb: "Reads the outcome against the bet and feeds the next.",
    hue: "oklch(0.565 0.11 203)",
    glyph: "activity",
    status: "deprecated",
  },
  {
    slug: "planner",
    name: "Plan",
    station: "define",
    face: "strategist",
    tier: "cast",
    relayVerb: "breaking it into work",
    blurb: "Breaks the spec into sprint-ready work.",
    hue: "oklch(0.55 0.11 180)",
    glyph: "list-checks",
    status: "deprecated",
  },
  {
    slug: "designer",
    name: "Design",
    station: "define",
    face: "scribe",
    tier: "cast",
    relayVerb: "mapping the experience",
    blurb: "Maps the experience and the flows.",
    hue: "oklch(0.585 0.12 213)",
    glyph: "pen-tool",
    status: "deprecated",
  },
  {
    slug: "scribe",
    name: "Draft",
    station: "define",
    face: "scribe",
    tier: "cast",
    relayVerb: "drafting the spec",
    blurb: "Turns the decision into a clear spec.",
    hue: "oklch(0.57 0.115 199)",
    glyph: "file-text",
    status: "deprecated",
  },
  {
    slug: "engineer",
    name: "Engineer",
    station: "build",
    face: "scribe",
    tier: "cast",
    relayVerb: "writing the change",
    blurb: "Writes the change in your codebase.",
    hue: "oklch(0.525 0.12 194)",
    glyph: "code",
    status: "deprecated",
  },
  {
    slug: "studio",
    name: "Engineer",
    station: "build",
    face: "scribe",
    tier: "cast",
    relayVerb: "writing the change",
    blurb: "Writes the change in your codebase.",
    hue: "oklch(0.525 0.12 194)",
    glyph: "code",
    status: "deprecated",
  },
  {
    slug: "inspector",
    name: "Review",
    station: "build",
    face: "critic",
    tier: "cast",
    relayVerb: "checking the diff",
    blurb: "Checks the diff before it ships.",
    hue: "oklch(0.55 0.135 241)",
    glyph: "check-check",
    status: "deprecated",
  },
  {
    slug: "releaser",
    name: "Announce",
    station: "ship",
    face: "scribe",
    tier: "cast",
    relayVerb: "announcing the release",
    blurb: "Announces what shipped: notes, changelog, post.",
    hue: "oklch(0.60 0.12 250)",
    glyph: "megaphone",
    status: "deprecated",
  },
  {
    slug: "marketer",
    name: "Announce",
    station: "ship",
    face: "scribe",
    tier: "cast",
    relayVerb: "announcing the release",
    blurb: "Announces what shipped: notes, changelog, post.",
    hue: "oklch(0.60 0.12 250)",
    glyph: "megaphone",
    status: "deprecated",
  },
  {
    slug: "stakeholder",
    name: "Announce",
    station: "ship",
    face: "scribe",
    tier: "cast",
    relayVerb: "announcing the release",
    blurb: "Announces what shipped: notes, changelog, post.",
    hue: "oklch(0.60 0.12 250)",
    glyph: "megaphone",
    status: "deprecated",
  },
];

// Lower-cased slug -> entry. Built once from the catalog.
const SLUG_TO_ENTRY: Record<string, CatalogEntry> = Object.fromEntries(
  SPECIALIST_CATALOG.map((e) => [e.slug.toLowerCase(), e]),
);

/** The catalog entry for a slug, or null. */
export function catalogEntry(slug: string | null | undefined): CatalogEntry | null {
  if (!slug) return null;
  return SLUG_TO_ENTRY[slug.toLowerCase()] ?? null;
}

/** The legacy face a slug rolls up to, or null when unknown. */
export function agentFace(slug: string | null | undefined): AgentFace | null {
  return catalogEntry(slug)?.face ?? null;
}

/** The station a slug serves, or null when unknown. */
export function agentStation(slug: string | null | undefined): AgentStation | null {
  return catalogEntry(slug)?.station ?? null;
}

/** Total station resolver: never null for a non-empty slug. Unknown work defaults to BUILD (execute). */
export function resolveStationTotal(slug: string | null | undefined): AgentStation {
  return agentStation(slug) ?? "build";
}

/** cast | crew for a slug; defaults to cast for unknown slugs (they would surface in a relay). */
export function agentTier(slug: string | null | undefined): AgentTier {
  return catalogEntry(slug)?.tier ?? "cast";
}

/** True when the slug is the orchestrator/conductor (never a station occupant). */
export function isConductor(slug: string | null | undefined): boolean {
  return catalogEntry(slug)?.conductor === true;
}

/**
 * The name to SHOW for a slug. Catalog name first (per-agent identity), then the
 * DB-provided fallback name, then a title-cased slug, so a raw slug never leaks.
 */
export function agentDisplayName(
  slug: string | null | undefined,
  fallbackName?: string | null,
): string {
  const entry = catalogEntry(slug);
  if (entry) return entry.name;
  if (fallbackName && fallbackName.trim()) return fallbackName.trim();
  if (slug && slug.trim()) return titleCase(slug);
  return "Agent";
}

/** The one-line blurb for a slug (per-agent), falling back to the face blurb, else null. */
export function agentBlurb(slug: string | null | undefined): string | null {
  const entry = catalogEntry(slug);
  if (entry) return entry.blurb;
  const face = agentFace(slug);
  return face ? AGENT_FACES[face].blurb : null;
}

/** The legacy short verb ("senses" / "ranks" / ...) for a slug's face, or null. Back-compat. */
export function agentVerb(slug: string | null | undefined): string | null {
  const face = agentFace(slug);
  return face ? AGENT_FACES[face].verb : null;
}

/** The present-tense relay phrase ("reading your sources") for a slug, or null. */
export function agentRelayVerb(slug: string | null | undefined): string | null {
  return catalogEntry(slug)?.relayVerb ?? null;
}

export interface AgentMark {
  /** Hue from the agent palette (safe: never a status color). */
  hue: string;
  /** lucide icon name. */
  glyph: string;
}

/** The visual identity (hue + glyph) for a slug. Falls back to the machine-blue anchor + a generic mark. */
export function agentMark(slug: string | null | undefined): AgentMark {
  const entry = catalogEntry(slug);
  if (entry) return { hue: entry.hue, glyph: entry.glyph };
  return { hue: "oklch(0.55 0.12 196)", glyph: "bot" };
}

/** Active cast entries (the user-facing roster), excluding crew + deprecated. */
export function castEntries(): CatalogEntry[] {
  return SPECIALIST_CATALOG.filter((e) => e.tier === "cast" && e.status === "active");
}

/** Active crew entries (engine-only). */
export function crewEntries(): CatalogEntry[] {
  return SPECIALIST_CATALOG.filter((e) => e.tier === "crew" && e.status === "active");
}

/** The active cast at a station, in catalog order, excluding the conductor. */
export function castByStation(station: AgentStation): CatalogEntry[] {
  return castEntries().filter((e) => e.station === station && !e.conductor);
}

/** The conductor (Chief of Staff) entry, or null. */
export function conductorEntry(): CatalogEntry | null {
  return SPECIALIST_CATALOG.find((e) => e.conductor && e.status === "active") ?? null;
}

function titleCase(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * AI-PULSE (founder ruling 2026-07-08): the outcome-named caption for a tool
 * the loop is running RIGHT NOW - never the raw tool id (a new tool must not
 * leak its internal name to the user). Shared by the Build cockpit's live
 * header and the platform-wide activity ticker so the two can never disagree.
 */
export const ACTION_LABEL: Record<string, string> = {
  "repo.read": "reading the repo",
  "repo.tree": "reading the repo",
  "repo.search": "searching the repo",
  "studio.stage": "drafting changes",
  "studio.commit": "saving changes",
  "studio.pr.open": "opening a pull request",
  "studio.pr.merge": "merging",
  "github.ci.read": "checking tests",
  "ci.logs": "reading the failing check",
  "github.commit.append": "fixing the failing check",
};

/**
 * SIX OF THE SEVEN STATIONS SAID "WORKING".
 *
 * `ACTION_LABEL` above has ten entries and every one is repo, studio or CI. The
 * registry has 59 tools. So `stepLabel` fell through to the literal word
 * "working" for the other 49, which is EVERY Discover, Decide, Plan, Design,
 * Ship and Learn tool. In the Build cockpit a person could read "opening a pull
 * request"; on the other six stations the same surfaces said "working" while an
 * agent drafted their spec, recorded their decision or graded their outcome.
 *
 * That is the founder's question answered badly by our own vocabulary: the
 * automation was running and the surface could not name it.
 *
 * The names already existed. `TOOL_DEFAULTS` carries a written `label` for all
 * 59 ("Draft a spec", "Record a decision", "Log a signal"), because the
 * boundary screen has to name every tool a person can govern. They are
 * imperatives, and a live caption wants a gerund, so this turns "Draft a spec"
 * into "drafting a spec" and leaves the ten hand-written strings above winning
 * wherever they read better ("reading the repo" beats "reading repo tree").
 *
 * A tool that is in neither still returns "working", so a tool shipped without
 * a label degrades to today's behaviour rather than leaking its internal id.
 * `defaults.test.ts` already fails the build when a registered tool is missing
 * from TOOL_DEFAULTS, so that path should stay empty.
 */
/**
 * Consonant-doubling verbs, which no simple rule gets right without stress
 * information English spelling does not carry. Listed rather than guessed.
 *
 * Every one of these is reachable from a tool label today or is a plain
 * candidate for the next one. `scan` earned its place the hard way: the first
 * run of this produced "scaning for credentials" on `studio.secrets.scan`,
 * which is the kind of small wrongness that makes a product feel unfinished. A
 * verb missing from here degrades to a misspelt gerund rather than to a crash,
 * so print the whole table when adding tools rather than trusting the rule.
 */
const GERUND_EXCEPTIONS: Record<string, string> = {
  log: "logging",
  map: "mapping",
  run: "running",
  plan: "planning",
  scan: "scanning",
  ship: "shipping",
  set: "setting",
  get: "getting",
  put: "putting",
  cut: "cutting",
  stop: "stopping",
  drop: "dropping",
  trim: "trimming",
  tag: "tagging",
  pin: "pinning",
  split: "splitting",
  fit: "fitting",
  quit: "quitting",
  submit: "submitting",
  commit: "committing",
  permit: "permitting",
  admit: "admitting",
  omit: "omitting",
  emit: "emitting",
  refer: "referring",
  transfer: "transferring",
  control: "controlling",
};

/** "Draft" -> "drafting". Handles the silent -e and the doubling cases. */
function gerund(verb: string): string {
  const w = verb.toLowerCase();
  if (GERUND_EXCEPTIONS[w]) return GERUND_EXCEPTIONS[w];
  // "merge" -> "merging", but never "see" -> "sing" or "dye" -> "dying".
  if (w.length > 2 && w.endsWith("e") && !/(ee|ye|oe)$/.test(w)) return `${w.slice(0, -1)}ing`;
  return `${w}ing`;
}

/**
 * The outcome-named caption for one tool, derived rather than hand-listed.
 * Exported so a surface can label a tool it names directly, not only a step.
 */
export function toolActionLabel(toolName: string | null | undefined): string | null {
  if (!toolName) return null;
  const written = ACTION_LABEL[toolName];
  if (written) return written;
  const label = TOOL_DEFAULTS[toolName]?.label;
  if (!label) return null;
  const [head, ...rest] = label.trim().split(/\s+/);
  if (!head) return null;
  return [gerund(head), ...rest].join(" ");
}

/** The one-liner for a run's latest step; calm fallbacks, never internals. */
export function stepLabel(step: { kind: string; name?: string } | undefined | null): string {
  if (!step) return "starting up";
  if (step.kind === "tool_call") return toolActionLabel(step.name) ?? "working";
  if (step.kind === "thought") return "thinking";
  return "working";
}
