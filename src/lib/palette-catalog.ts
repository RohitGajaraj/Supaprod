/**
 * OBS-11 - the "What can it do?" capability catalog. Pure data: no JSX, no
 * server import. Each entry is a plain-words pitch plus a client-only run
 * target (a route to navigate to, or a client event to dispatch) - never a
 * server call. `palette-catalog.test.ts` guards that every `run.to` is a
 * real canonical route so the catalog never grows a dead link.
 */

export type CatalogKind = "CALL" | "MISSION" | "SPEC" | "BELIEF" | "SOURCE";

export type CatalogEntry = {
  id: string;
  pitch: string;
  kind?: CatalogKind;
  run: { to: string; search?: Record<string, string>; event?: string };
};

export const CATALOG: CatalogEntry[] = [
  {
    id: "challenge-belief",
    pitch: "Tear down a belief with evidence",
    kind: "BELIEF",
    run: { to: "/arriving", search: { tab: "opportunities" } },
  },
  {
    id: "rank-next",
    pitch: "Rank what to build next",
    run: { to: "/plan", search: { view: "roadmap" } },
  },
  {
    id: "tickets-to-signals",
    pitch: "Turn 48 hours of tickets into signals",
    kind: "SOURCE",
    run: { to: "/arriving", search: { tab: "signals" } },
  },
  {
    id: "export-record",
    pitch: "Export my decision record",
    run: { to: "/outcomes", search: { tab: "decisions" } },
  },
  {
    id: "point-critic",
    pitch: "Point the Critic at a claim",
    kind: "SPEC",
    run: { to: "/plan" },
  },
  {
    id: "answer-call",
    pitch: "Answer the waiting call",
    kind: "CALL",
    run: { to: "/today" },
  },
  {
    id: "check-mission",
    pitch: "Check on a running mission",
    kind: "MISSION",
    run: { to: "/build" },
  },
  {
    id: "connect-source",
    pitch: "Connect a source",
    kind: "SOURCE",
    run: { to: "/settings", search: { section: "connections" } },
  },
  {
    id: "check-spend",
    pitch: "See what the agents are spending",
    run: { to: "/engine-room", search: { room: "spend" } },
  },
  {
    id: "check-quality",
    pitch: "Check if the evals still pass",
    run: { to: "/engine-room", search: { room: "quality" } },
  },
  // LOOM W1 - the "rare goes to the palette" promise, actually kept: every
  // folded or door-internal surface is indexed here (DESIGN-LOOM §9b).
  {
    id: "check-safety",
    pitch: "Check the guardrails and safety record",
    run: { to: "/engine-room", search: { room: "safety" } },
  },
  {
    id: "open-record",
    pitch: "Open the record room (traces and runs)",
    run: { to: "/engine-room", search: { room: "record" } },
  },
  {
    id: "trust-ledger",
    pitch: "Verify the audit trail integrity fingerprint",
    run: { to: "/engine-room", search: { room: "record" } },
  },
  {
    id: "open-calendar",
    pitch: "Open your meetings and calendar",
    run: { to: "/today" },
  },
  {
    id: "memory-graph",
    pitch: "Explore the knowledge graph",
    kind: "BELIEF",
    run: { to: "/outcomes", search: { tab: "graph" } },
  },
  {
    id: "prompt-studio",
    pitch: "Tune the prompts behind the agents",
    run: { to: "/engine-room", search: { room: "quality", view: "prompts" } },
  },
  {
    id: "open-settings",
    // NAMES THE GROUPS THAT EXIST, or names none. Settings was regrouped from a
    // flat fifteen into five named groups; this pitch still listed the old
    // four-way split, so the palette promised a shape the surface no longer
    // had. A parenthetical that enumerates another file's contents rots the
    // moment that file changes, which is why it now reads off the grouping
    // rather than restating it.
    pitch: "Open settings (the crew, the brief, reach, you, plan)",
    run: { to: "/settings" },
  },
  {
    id: "plan-billing",
    pitch: "See my plan and billing",
    run: { to: "/settings", search: { section: "plan" } },
  },
  {
    id: "admin-console",
    pitch: "Open the admin console",
    run: { to: "/admin" },
  },
];

/** PURE - case-insensitive substring match over `pitch`, stable order. */
export function filterCatalog(query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return CATALOG;
  return CATALOG.filter((entry) => entry.pitch.toLowerCase().includes(q));
}
