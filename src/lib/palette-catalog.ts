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
    pitch: "Tear down a belief with receipts",
    kind: "BELIEF",
    run: { to: "/discover", search: { tab: "opportunities" } },
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
    run: { to: "/discover", search: { tab: "signals" } },
  },
  {
    id: "export-record",
    pitch: "Export my decision record",
    run: { to: "/knowledge", search: { tab: "insights" } },
  },
  {
    id: "point-critic",
    pitch: "Point the Critic at a claim",
    kind: "SPEC",
    run: { to: "/plan" },
  },
  {
    id: "answer-call",
    pitch: "Answer the current Call",
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
    run: { to: "/sync" },
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
];

/** PURE - case-insensitive substring match over `pitch`, stable order. */
export function filterCatalog(query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return CATALOG;
  return CATALOG.filter((entry) => entry.pitch.toLowerCase().includes(q));
}
