/**
 * OBS-10 - the single source of truth for every legacy `_authenticated.*`
 * route's fold target. Pure data: no JSX, no side effects. Route stubs and
 * `legacy-redirects.test.ts` both read this map so there is exactly one
 * place that names "where did X go."
 *
 * Canonical-path history: OBS-10 found Brain living at `/knowledge` (OBS-08
 * reskinned it in place) and Engine Room at the new `/engine-room` glance
 * with `/govern` as its live drill layer. LOOM W1 (2026-07-04) finished the
 * rename the OBS-10 spec originally assumed: Brain canonical = `/brain`
 * (label and URL agree); `/knowledge` is now itself a legacy key below.
 * Engine Room canonical stays `/engine-room`; LOOM W2 (2026-07-04) folded
 * `/govern`'s live tabs into the four rooms, so `/govern` is a legacy key
 * below too (its stub branches ?tab= onto ?room=&view=).
 */

export type RedirectTarget = { to: string; search?: Record<string, string> };

/** The nine primary destinations (THE SUPAPROD LOOP, Tempo revamp 2026-07-13):
 * Today (home), the six loop stages (Discover · Plan · Design · Build · Ship ·
 * Learn), and the two always-on intelligence layers (Memory /brain, Engine
 * Room). Ship (/ship) and Learn (/learn) are now first-class loop pages, no
 * longer folded into Brain's tabs. Decide folded into Discover's queue tab;
 * the ledger folded into the Engine Room's record room — both are legacy keys
 * below. */
export const CANONICAL_PATHS = [
  "/today",
  "/arriving",
  "/decide",
  "/plan",
  "/design",
  "/build",
  "/ship",
  "/learn",
  "/outcomes",
  "/approvals",
  "/threads",
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
  "/sync",
  "/traces",
  "/traces/$traceId",
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
 * - `/traces`, `/traces/$traceId` - Engine Room's own `RecordRoom` navigates
 *   here for trace detail. A live drill-in layer, one level deeper than the
 *   Record room.
 *
 * `/govern` left this list on 2026-07-04 (LOOM W2, the audit's #1 IA
 * insight: ONE Engine Room). Its 15 live tabs were folded into the four
 * rooms as ?view= sub-tabs; /govern is now a permanent redirect stub that
 * maps ?tab= (and the suite/agent/surface drill params) onto
 * /engine-room?room=&view= - a per-tab branching a single static map entry
 * cannot express (same shape as `/product`), so the map entry below carries
 * the bare-URL default only.
 *
 * `/prds/$id` left this list on 2026-07-04 (LOOM W2): the full spec editor
 * was re-homed to `/plan/spec/$id` (Plan's own drill layer) and `/prds/$id`
 * is now a permanent param-forwarding redirect stub - a param route cannot
 * be expressed in the static map below (same shape as `/product`'s ?tab=
 * branching), so the stub `src/routes/_authenticated.prds.$id.tsx` carries
 * the id + ?tab= forward itself.
 *
 * Genuinely remaining work: NONE as of 2026-07-03 (lane3) - every legacy
 * surface below is closed. `/product` itself (2026-07-03, lane3, final
 * closure): lane2 closed the Signals/Opportunities half onto `/discover`
 * earlier this session; this pass closed the remaining four tabs - Specs'
 * rename/delete/promote/create-issue/hand-to-build/lineage (a new row
 * overflow menu on Plan, plus the "draft a spec from one line" composer),
 * Roadmap's bulk multi-select re-prioritize + post-commit outcome editing +
 * the RoadmapHistory audit trail (Plan), the Announcements authoring/
 * approval workflow + a read-only ship-history view (Brain's Changelog tab),
 * Strategy's tracked-entities watch list + weekly competitor briefs
 * (Discover), and the product-portfolio lifecycle - switch/archive/restore/
 * export/delete (a new Products section on Settings' Workspace pane, inside
 * the existing four-pane cap, not a fifth pane). `/product` itself now
 * branches its `beforeLoad` redirect on the incoming `?tab=` (see the route
 * stub `src/routes/_authenticated.product.tsx` - a single static target
 * cannot express this, so it is not entered in `LEGACY_REDIRECTS` below with
 * per-tab search params; the map entry uses the bare-URL default instead).
 * All ten now-orphaned `src/components/product/*Panel.tsx`/`*Board.tsx`
 * files were deleted (verified zero remaining importers before removal).
 *
 * `/impact` and `/changelog` closed 2026-07-03 (lane1, OBS-10 Brain fold):
 * Brain gained an `ImpactLedgerPanel` ("Impact" tab, the full 4-stat
 * breakdown + highlights + copy/download + markdown preview BrainStatTrio's
 * strip only summarized) and a `ChangelogPanel` ("Changelog" tab, net-new -
 * Brain had zero prior changelog coverage). Both fold into `/knowledge` below.
 *
 * `/stakeholder` closed 2026-07-03 (lane3, OBS-10 Plan fold): Plan gained a
 * "Stakeholder Pack." section (`StakeholderPackPanel`, the same decision
 * picker + exec/eng/board tabs + copy/download the legacy page had).
 * `/fleet` and `/delegate` closed 2026-07-03 (lane3, OBS-10 Build fold):
 * Build gained two orthogonal view-mode tabs, "By Agent" (`FleetView`) and
 * "By Lane" (`DelegateBoard`), both reusing `computeAgentFleet`/
 * `computeDelegateDesk` unchanged. All three fold below.
 *
 * These are flagged to the founder per OBS-10.md §13 (URL renames + scope);
 * each is real product functionality that would be deleted, not merely
 * relocated, by a literal reading of the spec's mapping table. Folding them
 * is follow-up work gated on giving their destination surface real parity
 * first - that is feature work, explicitly out of OBS-10's wiring-only scope.
 */
export const LEGACY_REDIRECTS: Record<string, RedirectTarget> = {
  // -- Discover --
  "/discovery": { to: "/arriving", search: { tab: "signals" } },
  "/opportunities": { to: "/arriving", search: { tab: "opportunities" } },
  // Decide is now a first-class Loop stage (canonical /decide, Option B
  // 2026-07-13) — the ranked judgment queue is its own destination.
  // OBS-10 (2026-07-03, lane3, final closure): the bare-URL default (the
  // legacy page's own default tab is "signals"). The real stub branches on
  // ?tab= six ways - see the module doc above and the route stub itself.
  "/product": { to: "/arriving" },

  // -- Plan --
  // LOOM W2 (2026-07-04): /plan honors ?view= (roadmap · specs ·
  // stakeholders) via validateSearch + section scroll, so the params these
  // redirects carry are no longer dead. /prds/$id -> /plan/spec/$id lives in
  // its own param-forwarding stub (see the module doc above).
  "/prds": { to: "/plan", search: { view: "specs" } },
  "/roadmap": { to: "/plan", search: { view: "roadmap" } },
  "/stakeholder": { to: "/plan", search: { view: "stakeholders" } },

  // -- Brain (canonical /brain since LOOM W1; /knowledge is legacy) --
  "/knowledge": { to: "/outcomes" },
  "/memory": { to: "/outcomes", search: { tab: "memory" } },
  "/docs": { to: "/outcomes", search: { tab: "docs" } },
  // /learn is now a first-class Loop stage (canonical), not a Brain tab.
  "/outcome": { to: "/learn" },
  "/calendar": { to: "/outcomes", search: { tab: "calendar" } },
  "/meetings": { to: "/outcomes", search: { tab: "calendar" } },
  "/impact": { to: "/outcomes", search: { tab: "impact" } },
  "/changelog": { to: "/outcomes", search: { tab: "changelog" } },

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
  // OBS-10 (2026-07-03, resumed, lane3): Fleet and Delegate folded in as two
  // orthogonal view-mode tabs on Build (by-agent and by-lane lenses on the
  // same agent-mesh activity, ported unchanged from computeAgentFleet /
  // computeDelegateDesk) - both no longer in the "Genuinely remaining work"
  // list above.
  "/fleet": { to: "/build", search: { view: "agent" } },
  "/delegate": { to: "/build", search: { view: "lane" } },

  // -- Today --
  "/tasks": { to: "/today" },
  // /inbox left this map on 2026-08-25: it is a real route now
  // (_authenticated.inbox.tsx, AgentInbox on real reads), so a redirect here
  // would bounce a live surface. This file's map is also imported by nothing
  // at runtime; the tests pin it as documentation.
  "/chat": { to: "/today" }, // Ask is the Cmd+J panel now (OBS-12), not a page.

  // -- Engine Room (canonical /engine-room; /govern folded 2026-07-04, LOOM W2) --
  // The stub itself branches ?tab= 14 ways and forwards drill params; this
  // entry is the bare-URL default (the glance), per the /product precedent.
  "/govern": { to: "/engine-room" },
  "/agents": { to: "/engine-room", search: { room: "safety", view: "team" } },
  "/swarm": { to: "/engine-room", search: { room: "safety", view: "team" } },
  "/evals": { to: "/engine-room", search: { room: "quality", view: "suites" } },
  "/eval-health": { to: "/engine-room", search: { room: "quality", view: "score" } },
  "/drift": { to: "/engine-room", search: { room: "quality", view: "drift" } },
  "/guardrails": { to: "/engine-room", search: { room: "safety", view: "rules" } },
  "/budgets": { to: "/engine-room", search: { room: "spend", view: "caps" } },
  "/analytics": { to: "/engine-room", search: { room: "spend", view: "usage" } },
  // Bare /observe lands on the glance (the audit flagged the old Spend-room
  // landing as semantically odd); the stub still maps ?tab= to the room.
  "/observe": { to: "/engine-room" },
  // Prompt Studio's first reachable home (the audit found it dormant: the
  // old redirect dropped it on the bare glance with no prompts anchor).
  "/prompts": { to: "/engine-room", search: { room: "quality", view: "prompts" } },
  // The old default tab (controls) preserved; the stub branches per ?tab=.
  "/governance": { to: "/engine-room", search: { room: "safety", view: "controls" } },
  // IA SPINE (2026-07-11): Ledger left the rail; the receipts surface is the
  // Engine Room's record room (the stub forwards ?view=).
  "/trust-ledger": { to: "/engine-room", search: { room: "record" } },

  // -- Settings --
  "/notifications": { to: "/settings" },
  "/briefing": { to: "/settings" },
  "/integrations": { to: "/settings" },

  // -- Build (already-correct stubs, listed for completeness / the test's coverage) --
  "/studio": { to: "/build" },
};
