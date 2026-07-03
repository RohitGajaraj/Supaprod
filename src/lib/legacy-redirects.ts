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
  "/stakeholder",
  "/fleet",
  "/delegate",
  "/product",
] as const;

/**
 * PERMANENT doors (2026-07-03, reclassified) - architectural, not pending
 * work. Each is a depth-2+ drill-in layer a shipped destination's own UI
 * deliberately links INTO, the same pattern `/govern` already established
 * for Engine Room (`RoomDetail`/`rooms/*.tsx` navigate there for the deeper
 * view). Building a duplicate full surface into the destination just to fold
 * these away would be redundant, speculative work against a link that
 * already works - never re-list these under "genuinely remaining work":
 *
 * - `/govern` - Engine Room's own detail/drill layer; still renders its own
 *   live tabs (traces/evals/drift/guardrails/budgets/team/approvals/etc).
 * - `/prds/$id` - the full PRD editor (AI assist, GitHub issue creation, task
 *   graphs, design scaffolding, Linear issues, Studio dispatch). Plan's
 *   `SpecDetail` is explicitly read-only and links here itself as its own
 *   "Open full spec ->" drill-in ("`src/components/plan/SpecDetail.tsx`).
 *   Duplicating this into Plan would be a second full PRD editor, not a fold.
 * - `/traces`, `/traces/$traceId` - Engine Room's own `RecordRoom` navigates
 *   here for trace detail; `/govern?tab=traces` is a second live consumer.
 *   Same drill-in-layer shape as `/govern` itself, one level deeper.
 *
 * Genuinely remaining work (verified against the real shipped code - each
 * carries live functionality its canonical replacement does not yet have,
 * so folding it now would delete a working feature, not relocate one):
 *
 * - `/product` - 2026-07-03 (lane2): the Signals/Opportunities write actions
 *   (capture, bulk import, cluster, promote, draft-spec, lineage, delete) are
 *   now ALSO on `/discover` (SignalComposer.tsx, SignalCard.tsx,
 *   OpportunityRow.tsx) - that half is closed. `/product` itself still stays
 *   live: its other 4 tabs (roadmap/specs/releases/strategy) each carry real
 *   unclosed write surfaces of their own (Specs' rename/delete/promote/
 *   dispatch, Releases' AnnouncementsManager approval workflow, Roadmap's
 *   bulk-update) with no home yet on `/plan` or elsewhere - a materially
 *   larger, separate effort, not part of this row's remaining scope.
 * - `/stakeholder` - audience-specific pack generation (exec/eng/board,
 *   copy/download); Plan's roadmap view has no equivalent.
 * - `/fleet`, `/delegate` - agent-capacity and delegation-queue views with
 *   no Build equivalent.
 *
 * `/impact` and `/changelog` closed 2026-07-03 (lane1, OBS-10 Brain fold):
 * Brain gained an `ImpactLedgerPanel` ("Impact" tab, the full 4-stat
 * breakdown + highlights + copy/download + markdown preview BrainStatTrio's
 * strip only summarized) and a `ChangelogPanel` ("Changelog" tab, net-new -
 * Brain had zero prior changelog coverage). Both fold into `/knowledge` below.
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
  "/impact": { to: "/knowledge", search: { tab: "impact" } },
  "/changelog": { to: "/knowledge", search: { tab: "changelog" } },

  // -- Build (canonical /build; also the one true missions home, see below) --
  "/cockpit": { to: "/build" },
  // OBS-10 (2026-07-03, resumed): Build widened to list every agent-mesh
  // mission (Studio/Build code-gen AND orchestrator goal-runs, distinguished
  // by `StudioSessionListItem.kind`), so /missions no longer carries anything
  // Build lacks - the composer's "Run a goal" mode replaced its composer, and
  // MissionOrchestratorDetail replaced its detail page's hops/replay/cancel/
  // compounding view. Both prior blockers (the 3 glance widgets, the 1399-vs-
  // 530-line detail-page gap) are resolved; this is no longer in the
  // "Deliberately NOT folded" list above.
  "/missions": { to: "/build" },

  // -- Today --
  "/tasks": { to: "/today" },
  "/inbox": { to: "/today" },
  "/chat": { to: "/today" }, // Ask is the Cmd+J panel now (OBS-12), not a page.

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
