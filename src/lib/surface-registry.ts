// Surface registry: the no-orphan enforcement for the front-end reimagining.
//
// Every server-function domain (each src/lib/*.functions.ts file) declares
// exactly one entry here: what kind of surface renders it, which home it
// belongs to in the Mission Control IA, and the VISIBLE on-screen element
// that reaches it. The companion test (src/lib/__tests__/surface-registry.test.ts)
// reads the directory listing and fails CI when a domain is missing, when an
// entry has no opensFrom, or when a kind is invalid. A capability nobody can
// reach from the screen is a bug, and this file is where that bug surfaces.
//
// Sources of truth for the homes:
// - docs/planning/front-end-reimagining/design-language-spec.md (the room
//   anatomy: Spine, Thread, Canvas faces 01..07, Composer, Approvals tray,
//   Working strip, Brain)
// - docs/planning/front-end-reimagining/research/ia-reclustering.md (the
//   five Settings groups, the Admin door, the crew drawer split)
// - docs/planning/front-end-reimagining/journey-catalog.md (journeys and
//   which surface each entry point lives on)
//
// `status` is the honesty field: 'live' means the stated home exists in code
// today and serves the domain; 'planned' means the registry states the plan
// and the home is part of the Mission Control build. Existing routes that
// keep their home default to 'live'.

export type SurfaceKind =
  "canvas-panel" | "drawer" | "settings" | "admin" | "composer-verb" | "route";

export type SurfaceStatus = "live" | "planned";

export interface SurfaceEntry {
  kind: SurfaceKind;
  /** The target surface in the reimagined IA (charter + IA proposal). */
  home: string;
  /** The visible on-screen element that reaches this domain. Never empty. */
  opensFrom: string;
  status: SurfaceStatus;
}

export const SURFACE_KINDS: readonly SurfaceKind[] = [
  "canvas-panel",
  "drawer",
  "settings",
  "admin",
  "composer-verb",
  "route",
];

export const SURFACE_STATUSES: readonly SurfaceStatus[] = ["live", "planned"];

/**
 * Domain key = the *.functions.ts filename without its suffix.
 * One entry per file on disk; the test enforces the 1:1 mapping both ways.
 */
export const SURFACE_REGISTRY = {
  // ---- Admin console (role-gated door from Workspace > People) ----
  admin: { kind: "admin", home: "admin/overview", opensFrom: "admin-nav", status: "live" },
  "admin-invitations": {
    kind: "admin",
    home: "admin/people",
    opensFrom: "admin-nav",
    status: "live",
  },
  "admin-platform": {
    kind: "admin",
    home: "admin/platform",
    opensFrom: "admin-nav",
    status: "live",
  },
  "admin-vouchers": {
    kind: "admin",
    home: "admin/pricing",
    opensFrom: "admin-nav",
    status: "live",
  },
  "admin-workspaces": {
    kind: "admin",
    home: "admin/workspaces",
    opensFrom: "admin-nav",
    status: "live",
  },
  // The invite door (signup closed 2026-08-07, private beta). This domain has
  // TWO callers and only one of them can be the registered home: the public
  // check-and-redeem pair on /signup, which no admin nav reaches, and the mint
  // and revoke console. The console is what this registry is for, because it is
  // the surface that would be an orphan if nobody linked it. The public half
  // has a door the whole internet can find.
  invites: { kind: "admin", home: "admin/invites", opensFrom: "admin-nav", status: "live" },
  // Lives on the observability page rather than owning a route: "is email
  // working" is a health question and belongs beside the other health answers.
  "email-health": {
    kind: "admin",
    home: "admin/observability",
    opensFrom: "admin-nav",
    status: "live",
  },
  activation: { kind: "admin", home: "admin/proof", opensFrom: "admin-nav", status: "live" },
  incidents: { kind: "admin", home: "admin/observability", opensFrom: "admin-nav", status: "live" },
  // Feature liveness shares the Health surface with observability: same
  // operator, same trip, one asking whether the machine is ticking and the
  // other whether it is ticking over anything.
  liveness: { kind: "admin", home: "admin/observability", opensFrom: "admin-nav", status: "live" },
  moat: { kind: "admin", home: "admin/proof", opensFrom: "admin-nav", status: "live" },
  observability: {
    kind: "admin",
    home: "admin/observability",
    opensFrom: "admin-nav",
    status: "live",
  },
  pricing: { kind: "admin", home: "admin/pricing", opensFrom: "admin-nav", status: "live" },
  "proof-surface": { kind: "admin", home: "admin/proof", opensFrom: "admin-nav", status: "live" },
  roles: { kind: "admin", home: "admin/people", opensFrom: "admin-nav", status: "live" },
  "routing-console": {
    kind: "admin",
    home: "admin/routing",
    opensFrom: "admin-nav",
    status: "live",
  },

  // ---- Settings > You ----
  profile: {
    kind: "settings",
    home: "settings/you/profile",
    opensFrom: "settings-nav",
    status: "live",
  },
  notifications: {
    kind: "drawer",
    home: "notifications-drawer",
    opensFrom: "top-bar-bell",
    status: "live",
  },

  // ---- Settings > Workspace ----
  projects: {
    kind: "settings",
    home: "settings/workspace/products",
    opensFrom: "settings-nav",
    status: "live",
  },
  "design-memory": {
    kind: "settings",
    home: "settings/workspace/brand",
    opensFrom: "settings-nav",
    status: "planned",
  },
  workspaces: {
    kind: "route",
    home: "workspace-switcher",
    opensFrom: "top-bar-workspace-switcher",
    status: "live",
  },
  // The claim lives under Plan rather than Workspace: the person deciding
  // whether to hand a year of solo work to their employer is standing in front
  // of what their plan is and what it could be, and that is where the question
  // belongs. Both halves (the person's offer, the admin's record of what was
  // claimed) render from WorkspaceClaimCard on that one pane.
  "workspace-claim": {
    kind: "settings",
    home: "settings/plan/billing",
    opensFrom: "settings-nav",
    status: "live",
  },

  // ---- Settings > Agents (the charter-mandated deliberate home) ----
  agents: {
    kind: "settings",
    home: "settings/agents/roster",
    opensFrom: "settings-nav",
    status: "live",
  },
  byokeys: {
    kind: "settings",
    home: "settings/agents/models-and-keys",
    opensFrom: "settings-nav",
    status: "live",
  },
  governance: {
    kind: "settings",
    home: "settings/agents/autonomy-and-approvals",
    opensFrom: "settings-nav",
    status: "planned",
  },
  reactor: {
    kind: "settings",
    home: "settings/agents/autonomy-and-approvals",
    opensFrom: "settings-nav",
    status: "planned",
  },
  "skills-export": {
    kind: "settings",
    home: "settings/agents/skills",
    opensFrom: "settings-nav",
    status: "planned",
  },
  trust: {
    kind: "settings",
    home: "settings/agents/autonomy-and-approvals",
    opensFrom: "settings-nav",
    status: "planned",
  },
  "trust-ledger": {
    kind: "settings",
    home: "settings/agents/autonomy-and-approvals",
    opensFrom: "settings-nav",
    status: "planned",
  },

  // ---- Settings > Connections & Data ----
  "calendar-connections": {
    kind: "settings",
    home: "settings/connections-and-data/sources",
    opensFrom: "settings-nav",
    status: "live",
  },
  connections: {
    kind: "settings",
    home: "settings/connections-and-data/sources",
    opensFrom: "settings-nav",
    status: "live",
  },
  gdocs: {
    kind: "settings",
    home: "settings/connections-and-data/sources",
    opensFrom: "settings-nav",
    status: "live",
  },
  ingest: {
    kind: "settings",
    home: "settings/connections-and-data/sync-and-bindings",
    opensFrom: "settings-nav",
    status: "planned",
  },
  integrations: {
    kind: "settings",
    home: "settings/connections-and-data/sources",
    opensFrom: "settings-nav",
    status: "live",
  },
  linear: {
    kind: "settings",
    home: "settings/connections-and-data/sources",
    opensFrom: "settings-nav",
    status: "live",
  },
  mcp: {
    kind: "settings",
    home: "settings/connections-and-data/agent-access",
    opensFrom: "settings-nav",
    status: "live",
  },
  notion: {
    kind: "settings",
    home: "settings/connections-and-data/sources",
    opensFrom: "settings-nav",
    status: "live",
  },
  sync: {
    kind: "settings",
    home: "settings/connections-and-data/sync-and-bindings",
    opensFrom: "settings-nav",
    status: "planned",
  },
  "value-receipts": {
    kind: "settings",
    home: "settings/connections-and-data/your-data",
    opensFrom: "settings-nav",
    status: "live",
  },

  // ---- Settings > Plan & Usage (costs are quiet; this is where they live) ----
  billing: {
    kind: "settings",
    home: "settings/plan-usage/plan",
    opensFrom: "settings-nav",
    status: "live",
  },
  budgets: {
    kind: "settings",
    home: "settings/plan-usage/usage",
    opensFrom: "settings-nav",
    status: "live",
  },
  "cost-per-outcome": {
    kind: "settings",
    home: "settings/plan-usage/usage",
    opensFrom: "settings-nav",
    status: "live",
  },
  credits: {
    kind: "settings",
    home: "settings/plan-usage/credits",
    opensFrom: "settings-nav",
    status: "live",
  },
  health: {
    kind: "settings",
    home: "settings/plan-usage/diagnostics",
    opensFrom: "settings-nav",
    status: "live",
  },
  limits: {
    kind: "settings",
    home: "settings/plan-usage/usage",
    opensFrom: "settings-nav",
    status: "live",
  },
  "loop-health": {
    kind: "settings",
    home: "settings/plan-usage/diagnostics",
    opensFrom: "settings-nav",
    status: "live",
  },
  payments: {
    kind: "settings",
    home: "settings/plan-usage/plan",
    opensFrom: "settings-nav",
    status: "live",
  },
  reliability: {
    kind: "settings",
    home: "settings/plan-usage/diagnostics",
    opensFrom: "settings-nav",
    status: "live",
  },

  // ---- Canvas face 01: evidence (signals, clusters, ranked bets) ----
  calendar: {
    kind: "canvas-panel",
    home: "canvas/01-evidence",
    opensFrom: "spine-stage-01",
    status: "planned",
  },
  discovery: {
    kind: "canvas-panel",
    home: "canvas/01-evidence",
    opensFrom: "spine-stage-01",
    status: "planned",
  },
  meetings: {
    kind: "canvas-panel",
    home: "canvas/01-evidence",
    opensFrom: "spine-stage-01",
    status: "planned",
  },
  "support-triage": {
    kind: "canvas-panel",
    home: "canvas/01-evidence",
    opensFrom: "spine-stage-01",
    status: "planned",
  },

  // ---- Canvas face 02: decision (the case, teardown verdicts) ----
  "brief-opportunity": {
    kind: "canvas-panel",
    home: "canvas/02-decision",
    opensFrom: "spine-stage-02",
    status: "planned",
  },
  "contradiction-auditor": {
    kind: "canvas-panel",
    home: "canvas/02-decision",
    opensFrom: "spine-stage-02",
    status: "planned",
  },
  "decision-currency": {
    kind: "canvas-panel",
    home: "canvas/02-decision",
    opensFrom: "spine-stage-02",
    status: "planned",
  },
  "decision-judgment": {
    kind: "canvas-panel",
    home: "canvas/02-decision",
    opensFrom: "spine-stage-02",
    status: "planned",
  },
  decisions: {
    kind: "canvas-panel",
    home: "canvas/02-decision",
    opensFrom: "spine-stage-02",
    status: "planned",
  },
  gauntlet: {
    kind: "canvas-panel",
    home: "canvas/02-decision",
    opensFrom: "spine-stage-02",
    status: "planned",
  },
  "shared-premise": {
    kind: "canvas-panel",
    home: "canvas/02-decision",
    opensFrom: "spine-stage-02",
    status: "planned",
  },

  // ---- Canvas face 03: spec (document, assumptions, task graph) ----
  roadmap: {
    kind: "canvas-panel",
    home: "canvas/03-spec",
    opensFrom: "spine-stage-03",
    status: "planned",
  },
  "task-graph": {
    kind: "canvas-panel",
    home: "canvas/03-spec",
    opensFrom: "spine-stage-03",
    status: "planned",
  },
  tasks: {
    kind: "canvas-panel",
    home: "canvas/03-spec",
    opensFrom: "spine-stage-03",
    status: "planned",
  },

  // ---- Canvas face 04: interactive prototype ----
  "design-interchange": {
    kind: "canvas-panel",
    home: "canvas/04-prototype",
    opensFrom: "spine-stage-04",
    status: "planned",
  },
  "design-parity": {
    kind: "canvas-panel",
    home: "canvas/04-prototype",
    opensFrom: "spine-stage-04",
    status: "planned",
  },
  "design-scaffold": {
    kind: "canvas-panel",
    home: "canvas/04-prototype",
    opensFrom: "spine-stage-04",
    status: "planned",
  },
  flows: {
    kind: "canvas-panel",
    home: "canvas/04-prototype",
    opensFrom: "spine-stage-04",
    status: "planned",
  },
  prototypes: {
    kind: "canvas-panel",
    home: "canvas/04-prototype",
    opensFrom: "spine-stage-04",
    status: "planned",
  },

  // ---- Canvas face 05: code (diff, CI state, sandbox, preview) ----
  build: {
    kind: "canvas-panel",
    home: "canvas/05-code",
    opensFrom: "spine-stage-05",
    status: "planned",
  },
  "intent-diff": {
    kind: "canvas-panel",
    home: "canvas/05-code",
    opensFrom: "spine-stage-05",
    status: "planned",
  },
  "new-build": {
    kind: "canvas-panel",
    home: "canvas/05-code",
    opensFrom: "spine-stage-05",
    status: "planned",
  },
  studio: {
    kind: "canvas-panel",
    home: "canvas/05-code",
    opensFrom: "spine-stage-05",
    status: "planned",
  },

  // ---- Canvas face 06: ship state (release, rollout, launch kit) ----
  changelog: {
    kind: "canvas-panel",
    home: "canvas/06-ship",
    opensFrom: "spine-stage-06",
    status: "planned",
  },
  "changelog-heartbeat": {
    kind: "canvas-panel",
    home: "canvas/06-ship",
    opensFrom: "spine-stage-06",
    status: "planned",
  },
  deployments: {
    kind: "canvas-panel",
    home: "canvas/06-ship",
    opensFrom: "spine-stage-06",
    status: "planned",
  },
  "launch-plan": {
    kind: "canvas-panel",
    home: "canvas/06-ship",
    opensFrom: "spine-stage-06",
    status: "planned",
  },

  // ---- Canvas face 07: growth digest (outcome versus contract) ----
  analytics: {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  // INSTRUMENT: per-station run outcomes, abandonment and duration. The read
  // exists and is tested; no surface renders it yet, which is exactly what
  // `planned` means here and why it is registered rather than left off the
  // list to keep a guard quiet.
  "run-analytics": {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  // INSTRUMENT: rework — first-pass acceptance, review burden, reopens and
  // spec/design divergence over a stated window, with clarification loops
  // declared unmeasured rather than drawn as a zero. The read exists and is
  // tested; no surface renders it yet, which is what `planned` means here.
  rework: {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  drift: {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  funnel: {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  goals: {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  outcome: {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  // FC-01, the grading half. Same home and door as `outcome`, because a due
  // forecast and a due spec outcome are settled at the same desk. It is
  // deliberately NOT the same domain: a spec outcome asks whether shipping paid
  // off and a forecast asks whether the belief was right, and one event can
  // answer those two differently.
  forecast: {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  "pm-impact": {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },
  "product-analytics": {
    kind: "canvas-panel",
    home: "canvas/07-growth",
    opensFrom: "spine-stage-07",
    status: "planned",
  },

  // ---- The Thread (cards arrive in the conversation spine of the room) ----
  briefing: {
    kind: "canvas-panel",
    home: "thread",
    opensFrom: "thread-briefing-card",
    status: "planned",
  },
  briefs: {
    kind: "canvas-panel",
    home: "thread",
    opensFrom: "thread-briefing-card",
    status: "planned",
  },
  "delegate-poll": {
    kind: "canvas-panel",
    home: "thread",
    opensFrom: "thread-poll-card",
    status: "planned",
  },
  greeting: {
    kind: "canvas-panel",
    home: "thread",
    opensFrom: "thread-catchup-card",
    status: "planned",
  },
  "stakeholder-pack": {
    kind: "canvas-panel",
    home: "thread",
    opensFrom: "composer-report-verb",
    status: "planned",
  },
  "stakeholder-update": {
    kind: "canvas-panel",
    home: "thread",
    opensFrom: "composer-report-verb",
    status: "planned",
  },

  // ---- The Spine (journeys, lanes, stage state) ----
  "loop-state": {
    kind: "canvas-panel",
    home: "spine",
    opensFrom: "spine-stage-node",
    status: "planned",
  },
  loops: { kind: "canvas-panel", home: "spine", opensFrom: "spine-lane", status: "planned" },
  "stage-events": {
    kind: "canvas-panel",
    home: "spine",
    opensFrom: "spine-stage-node",
    status: "planned",
  },

  // ---- Composer verbs (the human's entry point into work) ----
  agent_loop: { kind: "composer-verb", home: "thread", opensFrom: "composer", status: "planned" },
  "ask-canvas": { kind: "composer-verb", home: "thread", opensFrom: "composer", status: "planned" },
  "ask-promote": {
    kind: "composer-verb",
    home: "thread",
    opensFrom: "composer",
    status: "planned",
  },
  audio: { kind: "composer-verb", home: "composer", opensFrom: "composer-mic", status: "planned" },
  copilot: { kind: "composer-verb", home: "composer", opensFrom: "composer", status: "planned" },
  "delegate-desk": {
    kind: "composer-verb",
    home: "composer",
    opensFrom: "composer-delegate-verb",
    status: "planned",
  },
  playbooks: {
    kind: "composer-verb",
    home: "composer",
    opensFrom: "composer-verb-menu",
    status: "planned",
  },
  researcher: { kind: "composer-verb", home: "thread", opensFrom: "composer", status: "planned" },
  routines: {
    kind: "composer-verb",
    home: "composer",
    opensFrom: "composer-loop-verb",
    status: "planned",
  },

  // ---- Approvals tray (the GateChip object; one count, one source) ----
  "approvals-queue": {
    kind: "drawer",
    home: "approvals-tray",
    opensFrom: "spine-gate-chip",
    status: "planned",
  },
  "gate-signals": {
    kind: "drawer",
    home: "approvals-tray",
    opensFrom: "spine-gate-chip",
    status: "planned",
  },
  "house-rules": {
    kind: "drawer",
    home: "approvals-tray",
    opensFrom: "spine-gate-chip",
    status: "planned",
  },
  "memory-candidates": {
    kind: "drawer",
    home: "approvals-tray",
    opensFrom: "spine-gate-chip",
    status: "planned",
  },

  // ---- Working strip and crew drawer (agents at work, live state) ----
  "agent-fleet": {
    kind: "drawer",
    home: "crew-drawer",
    opensFrom: "pulse-line-agent-chip",
    status: "planned",
  },
  "agent-runs": {
    kind: "drawer",
    home: "crew-drawer",
    opensFrom: "pulse-line-agent-chip",
    status: "planned",
  },
  "agent-scorecard": {
    kind: "drawer",
    home: "crew-drawer",
    opensFrom: "pulse-line-agent-chip",
    status: "planned",
  },
  ambient: { kind: "drawer", home: "working-strip", opensFrom: "working-strip", status: "planned" },
  capabilities: {
    kind: "drawer",
    home: "crew-drawer",
    opensFrom: "pulse-line-agent-chip",
    status: "planned",
  },
  fanout: { kind: "drawer", home: "working-strip", opensFrom: "working-strip", status: "planned" },
  orchestrator: {
    kind: "drawer",
    home: "working-strip",
    opensFrom: "working-strip",
    status: "planned",
  },
  "product-context": {
    kind: "drawer",
    home: "crew-drawer",
    opensFrom: "pulse-line-agent-chip",
    status: "planned",
  },
  pulse: { kind: "drawer", home: "working-strip", opensFrom: "working-strip", status: "planned" },
  swarm: { kind: "drawer", home: "working-strip", opensFrom: "working-strip", status: "planned" },

  // ---- Behind the receipt (infrastructure, one click deep, spec section 9) ----
  "artifact-rewind": {
    kind: "drawer",
    home: "receipt-details",
    opensFrom: "receipt-kebab",
    status: "planned",
  },
  "audit-lineage": {
    kind: "drawer",
    home: "receipt-details",
    opensFrom: "receipt-kebab",
    status: "planned",
  },
  lineage: {
    kind: "drawer",
    home: "receipt-details",
    opensFrom: "receipt-kebab",
    status: "planned",
  },
  // The bidirectional walk over artifact_lineage (what this came from AND what
  // it caused), rendered in the same drawer as audit-lineage. Its door is the
  // AuditTag chip: every `MIS·7E7D59` on screen is a <span role="button"> that
  // calls openLineage, so the entry point is the tag itself, not a kebab menu.
  "lineage-graph": {
    kind: "drawer",
    home: "receipt-details",
    opensFrom: "audit-tag",
    status: "planned",
  },
  traces: {
    kind: "drawer",
    home: "receipt-details",
    opensFrom: "receipt-kebab",
    status: "planned",
  },
  "trust-chain": {
    kind: "drawer",
    home: "receipt-details",
    opensFrom: "receipt-kebab",
    status: "planned",
  },

  // ---- Thread history and conversations ----
  conversations: {
    kind: "drawer",
    home: "thread",
    opensFrom: "thread-history-menu",
    status: "planned",
  },

  // ---- Addendum 1.1 placeholders (founder red-lines, items 5-6) ----
  // Threads home: the revisitable archive of every conversation. Founder-approved
  // 2026-07-19 ("build it"), reached from the room's Threads door and /threads
  // (deep link ?c=<id>). Backed by threads.functions.ts; folders, cross-scope
  // views, full-text search, and promote-to-memory follow with their migration
  // (gaps K1-K5).
  threads: {
    kind: "route",
    home: "route:/threads",
    opensFrom: "room-topbar-threads-door",
    status: "live",
  },
  // Artifacts: what the loop has MADE (prototypes, specs, docs today).
  // Founder-approved 2026-07-19 and named "Artifacts"; MOVED into Brain by the
  // 2026-07-30 ruling after a reachability audit found /artifacts orphaned, its
  // only inbound link being the retired Mission Control chrome. It is now the
  // Artifacts tab on Brain, so the door is the tab, not a rail item and not the
  // room's top bar. /artifacts is a permanent redirect to /brain?tab=artifacts.
  // Backed by artifacts.functions.ts; versions follow with their migration (K7).
  artifacts: {
    kind: "route",
    home: "brain",
    opensFrom: "brain-tab-artifacts",
    status: "live",
  },

  // ---- Brain (memory as a destination, not a settings pane) ----
  brain: { kind: "route", home: "brain", opensFrom: "nav-rail-brain", status: "live" },
  "brain-insights": { kind: "route", home: "brain", opensFrom: "nav-rail-brain", status: "live" },
  // What the record has TAUGHT (standing house rules + recall outcomes), the
  // counterpart to brain.functions.ts. Same door, same surface.
  "brain-standing": { kind: "route", home: "brain", opensFrom: "nav-rail-brain", status: "live" },
  "decision-precedent": {
    kind: "route",
    home: "brain",
    opensFrom: "nav-rail-brain",
    status: "live",
  },
  "knowledge-graph-explorer": {
    kind: "route",
    home: "brain",
    opensFrom: "nav-rail-brain",
    status: "live",
  },
  "knowledge-graph-view": {
    kind: "route",
    home: "brain",
    opensFrom: "nav-rail-brain",
    status: "live",
  },
  memory: { kind: "route", home: "brain", opensFrom: "nav-rail-brain", status: "planned" },
  "strategy-registry": {
    kind: "route",
    home: "brain",
    opensFrom: "nav-rail-brain",
    status: "planned",
  },

  // ---- Engine Room (machinery behind one door) ----
  "eval-health": {
    kind: "route",
    home: "engine-room",
    opensFrom: "engine-room-door",
    status: "live",
  },
  evals: { kind: "route", home: "engine-room", opensFrom: "engine-room-door", status: "live" },
  "guardrails-injection": {
    kind: "route",
    home: "engine-room",
    opensFrom: "engine-room-door",
    status: "live",
  },
  guardrails: { kind: "route", home: "engine-room", opensFrom: "engine-room-door", status: "live" },
  "prompt-optimization": {
    kind: "route",
    home: "engine-room",
    opensFrom: "engine-room-door",
    status: "live",
  },
  prompts: { kind: "route", home: "engine-room", opensFrom: "engine-room-door", status: "live" },
  "self-improve": {
    kind: "route",
    home: "engine-room",
    opensFrom: "engine-room-door",
    status: "live",
  },
  "test-station": {
    kind: "route",
    home: "engine-room",
    opensFrom: "engine-room-door",
    status: "live",
  },

  // ---- Crew (governing the workforce: one nav-rail destination) ----
  // Reached from the Crew item in the app frame's nav rail (AppFrame.tsx),
  // which routes to /crew.
  crew: { kind: "route", home: "crew", opensFrom: "nav-rail-crew", status: "live" },

  // ---- Runs (the whole lifecycle of one run, not just Build) ----
  // The seven-stage strip on /runs/$missionId, reached from the Runs item in
  // the nav rail (AppFrame.tsx).
  "run-stages": { kind: "route", home: "runs", opensFrom: "nav-rail-runs", status: "live" },

  // 05 Build's own engine at /build: every change the crew has written, across
  // every run. Reached by clicking Build on the seven-stage strip, which is the
  // only door it has and is the point of it. Build was the one station whose
  // route was a redirect to /runs (a different axis entirely), so the engine
  // did not exist until 2026-07-30.
  "build-engine": { kind: "route", home: "build", opensFrom: "spine-strip", status: "live" },

  // ---- Mission Control shell and remaining routes ----
  dashboard: {
    kind: "route",
    home: "mission-control",
    opensFrom: "nav-rail-home",
    status: "planned",
  },
  missions: {
    kind: "route",
    home: "mission-control",
    opensFrom: "nav-rail-home",
    status: "planned",
  },
  today: { kind: "route", home: "mission-control", opensFrom: "nav-rail-home", status: "planned" },
  "today-lanes": {
    kind: "route",
    home: "mission-control",
    opensFrom: "nav-rail-home",
    status: "planned",
  },
  onboarding: {
    kind: "route",
    home: "mission-control/first-run",
    opensFrom: "first-login-redirect",
    status: "planned",
  },
  announcements: {
    kind: "drawer",
    home: "notifications-drawer",
    opensFrom: "top-bar-bell",
    status: "live",
  },
  feedback: {
    kind: "drawer",
    home: "feedback-dialog",
    opensFrom: "help-menu-feedback",
    status: "live",
  },
  compliance: {
    kind: "route",
    home: "route:/security",
    opensFrom: "public-footer-security-link",
    status: "live",
  },
  demo: {
    kind: "route",
    home: "route:/demo",
    opensFrom: "public-landing-demo-link",
    status: "live",
  },
  docs: { kind: "route", home: "route:/docs", opensFrom: "help-menu-docs", status: "live" },
  landing: { kind: "route", home: "route:/", opensFrom: "public-url", status: "live" },
  "decisions-share": {
    kind: "route",
    home: "route:/d/$slug",
    opensFrom: "decision-share-button",
    status: "live",
  },
  "opportunities-share": {
    kind: "route",
    home: "route:/p/$slug",
    opensFrom: "opportunity-share-button",
    status: "live",
  },
  "proof-share": {
    kind: "route",
    home: "route:/proof",
    opensFrom: "proof-share-button",
    status: "live",
  },
} as const satisfies Record<string, SurfaceEntry>;

export type SurfaceDomain = keyof typeof SURFACE_REGISTRY;

/**
 * Registry entries that are IA placeholders (design-language-spec Addendum
 * 1.1, items 5-6): the surface is founder-mandated but no server-function
 * domain module exists yet. The no-rot test exempts exactly this list, and
 * separately asserts each stays status 'planned' and gains no file on disk
 * while listed here. When a placeholder's *.functions.ts lands, remove it
 * from this list in the same commit.
 */
export const PLACEHOLDER_DOMAINS: readonly SurfaceDomain[] = [];

/** Lookup with a typed result; returns undefined for unknown domains. */
export function surfaceForDomain(domain: string): SurfaceEntry | undefined {
  return (SURFACE_REGISTRY as Record<string, SurfaceEntry>)[domain];
}
