/**
 * OBS-10 - the single source of truth for every legacy `_authenticated.*`
 * route's fold target. Pure data: no JSX, no side effects. Route stubs and
 * `legacy-redirects.test.ts` both read this map so there is exactly one
 * place that names "where did X go."
 *
 * Canonical-path correction (OBS-10 spec step 1): the spec's default
 * assumption was Brain = `/brain` and Engine Room = `/govern`. Neither
 * holds - OBS-08 reskinned `/knowledge` in place (no `/brain` route was
 * created), and OBS-09 built a NEW route `/engine-room` additive alongside
 * the untouched parchment `/govern` (which stays live as the room-detail
 * drill layer `RoomDetail`/`RecordRoom` navigate into). So:
 * Brain canonical = `/knowledge`. Engine Room canonical (door) = `/engine-room`.
 */

export type RedirectTarget = { to: string; search?: Record<string, string> };

/** The six primary destinations + the door. */
export const CANONICAL_PATHS = [
  "/today",
  "/discover",
  "/plan",
  "/build",
  "/knowledge",
  "/engine-room",
] as const;

/**
 * Paths that are reached from a destination/door but are not themselves one
 * of the six primary entries - Settings, Admin, onboarding, and the two
 * standing door-links (Trust Ledger, Connectors). A redirect target may
 * legally land here without being "another legacy key."
 *
 * Also includes the surfaces OBS-10 investigated and found still load-bearing
 * for a shipped Obsidian destination or with no un-regressive fold target yet
 * (see the module-doc "Deliberately NOT folded" list below) - these are not
 * legacy keys either; they are live pages other live pages depend on.
 */
export const DOOR_INTERNAL_PATHS = [
  "/settings",
  "/onboarding",
  "/admin",
  "/trust-ledger",
  "/sync",
  "/govern",
  "/traces",
  "/traces/$traceId",
  "/prds/$id",
  "/missions",
  "/missions/$missionId",
  "/stakeholder",
  "/impact",
  "/changelog",
  "/fleet",
  "/delegate",
  "/chat",
  "/product",
] as const;

/**
 * Deliberately NOT folded (verified against the real shipped code, not the
 * spec's abstract table - each of these carries live functionality its
 * canonical replacement does not yet have):
 *
 * - `/product` - Discover (OBS-06) is explicitly additive; capture, bulk
 *   import, cluster, promote, draft-spec, lineage, and delete all still
 *   live only on `/product` (confirmed in `DiscoverSurface`'s own file
 *   comment). Folding this would delete every write action Discover lacks.
 * - `/prds/$id` - the full PRD editor (AI assist, GitHub issue creation,
 *   task graphs, design scaffolding, Linear issues, Studio dispatch).
 *   Plan's `SpecDetail` is explicitly read-only and links here itself
 *   ("Open full spec ->", see `src/components/plan/SpecDetail.tsx`).
 * - `/traces`, `/traces/$traceId` - Engine Room's own `RecordRoom` navigates
 *   here for trace detail; `/govern?tab=traces` is a second live consumer.
 * - `/missions` (bare) - hosts `LoopHealthBanner`, `MissionsCostGlance`, and
 *   `ReliabilityGlance`; none of the three exist on `/build` yet.
 * - `/missions/$missionId` - 1399 lines vs `/build/$missionId`'s 530; not a
 *   verified duplicate, likely carries content the newer page lacks.
 * - `/stakeholder` - audience-specific pack generation (exec/eng/board,
 *   copy/download); Plan's roadmap view has no equivalent.
 * - `/impact` - the impact-ledger detail view; not verified redundant with
 *   Brain's simpler `BrainStatTrio` export.
 * - `/changelog` - Brain has no "record"/changelog-equivalent tab yet.
 * - `/fleet`, `/delegate` - agent-capacity and delegation-queue views with
 *   no Build equivalent.
 * - `/chat` - the Ask panel (OBS-12) does not exist yet; redirecting this
 *   away now would delete AI chat with no replacement. OBS-12 owns this.
 * - `/govern` - Engine Room's own detail/drill layer (`RoomDetail` and every
 *   `rooms/*.tsx` navigate here for the deeper view); still renders its own
 *   live tabs (traces/evals/drift/guardrails/budgets/team/approvals/etc).
 *
 * These are flagged to the founder per OBS-10.md §13 (URL renames + scope);
 * each is real product functionality that would be deleted, not merely
 * relocated, by a literal reading of the spec's mapping table. Folding them
 * is follow-up work gated on giving their destination surface real parity
 * first - that is feature work, explicitly out of OBS-10's wiring-only scope.
 */
export const LEGACY_REDIRECTS: Record<string, RedirectTarget> = {
  // -- Discover --
  "/discovery": { to: "/discover", search: { tab: "signals" } },
  "/opportunities": { to: "/discover", search: { tab: "opportunities" } },

  // -- Plan --
  "/prds": { to: "/plan" }, // bare list only; /prds/$id stays live (see above)
  "/roadmap": { to: "/plan", search: { view: "roadmap" } },

  // -- Brain (canonical /knowledge) --
  "/memory": { to: "/knowledge", search: { tab: "memory" } },
  "/docs": { to: "/knowledge", search: { tab: "docs" } },
  "/learn": { to: "/knowledge", search: { tab: "learnings" } },
  "/outcome": { to: "/knowledge", search: { tab: "learnings" } },
  "/calendar": { to: "/knowledge", search: { tab: "calendar" } },
  "/meetings": { to: "/knowledge", search: { tab: "calendar" } },

  // -- Build --
  "/cockpit": { to: "/missions" }, // /missions itself stays live (see above)

  // -- Today --
  "/tasks": { to: "/today" },
  "/inbox": { to: "/today" },

  // -- Engine Room (canonical /engine-room; /govern stays live as its detail layer) --
  "/agents": { to: "/govern", search: { tab: "team" } },
  "/swarm": { to: "/govern", search: { tab: "team" } },
  "/evals": { to: "/engine-room", search: { room: "quality", view: "suites" } },
  "/eval-health": { to: "/engine-room", search: { room: "quality", view: "score" } },
  "/drift": { to: "/engine-room", search: { room: "quality", view: "drift" } },
  "/guardrails": { to: "/engine-room", search: { room: "safety" } },
  "/budgets": { to: "/engine-room", search: { room: "spend" } },
  "/analytics": { to: "/engine-room", search: { room: "spend" } },
  "/observe": { to: "/engine-room" },
  "/prompts": { to: "/engine-room" },
  "/governance": { to: "/govern" },

  // -- Settings --
  "/notifications": { to: "/settings" },
  "/briefing": { to: "/settings" },
  "/integrations": { to: "/settings" },

  // -- Build (already-correct stubs, listed for completeness / the test's coverage) --
  "/studio": { to: "/build" },
};
