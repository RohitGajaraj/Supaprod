/**
 * OBS-11 - the "What can it do?" capability catalog. Pure data: no JSX, no
 * server import. Each entry is a plain-words pitch plus a client-only run
 * target (a route to navigate to, or a client event to dispatch) - never a
 * server call. `palette-catalog.test.ts` guards that every `run.to` is a
 * real canonical route so the catalog never grows a dead link.
 *
 * SIX ENTRIES LEFT `/engine-room` FOR `/team?tab=spend` ON 2026-09-10. That
 * guard checks the destination is KNOWN, not that it is a page: `/engine-room`
 * is a route file whose whole body is `throw redirect({ to: "/team", search: {
 * tab: "spend", ... } })`, so every one of these named an address that exists
 * only to hand you a different one. They spell the real destination now, which
 * is the same edit twenty other callers took in the same pass.
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
    run: { to: "/evidence", search: { tab: "opportunities" } },
  },
  /*
   * P-14 (A-QUEUE.md ruling, R-34): /plan's Now/Next/Later board is deleted,
   * not rehomed -- "there are no lanes." The ranking itself survives on
   * Start's "Or start one of these" (top three by ICE) and Find anything ›
   * Findings, so the pitch still holds; only the destination changed.
   */
  {
    id: "rank-next",
    pitch: "Rank what to build next",
    run: { to: "/start", search: {} },
  },
  {
    id: "tickets-to-signals",
    pitch: "Turn 48 hours of tickets into signals",
    kind: "SOURCE",
    run: { to: "/evidence", search: { tab: "signals" } },
  },
  {
    id: "export-record",
    pitch: "Export my decision record",
    run: { to: "/outcomes", search: { tab: "decisions" } },
  },
  /*
   * P-14 (A-QUEUE.md ruling): /plan is deleted, and this entry's own
   * capability -- pointing the Critic at a claim manually -- has no direct
   * destination the way the ranking above does; the ruling's own words are
   * "the Critic already runs at the Decide station of a run", which is
   * automatic, not a page a person visits to trigger it by hand. Repointed
   * to /start so the entry does not dead-end; the capability gap itself is
   * flagged in P-14's own Report, same as "Name a bet" was for /decide.
   */
  {
    id: "point-critic",
    pitch: "Point the Critic at a claim",
    kind: "SPEC",
    run: { to: "/start", search: {} },
  },
  /*
   * FIFTH REVIEW, 2026-09-09: this pointed at /today, whose route P-10 deleted
   * on 2026-09-02. It kept passing the "run.to is a real route" guard only
   * because the route canon it checks against still listed /today; the canon
   * was corrected in the same pass and this entry was one of four the guard
   * then caught. A call is the thing waiting on a person, and the queue of them
   * is Approvals.
   */
  {
    id: "answer-call",
    pitch: "Answer the waiting call",
    kind: "CALL",
    run: { to: "/inbox" },
  },
  /*
   * P-14 (A-QUEUE.md ruling, R-34): /build is deleted -- "there are no
   * lanes." A running mission is now watched from Run (the rail's own
   * `/track` identity) or found by name in Find anything; repointed to
   * /start so the entry does not dead-end, the same treatment "Rank what to
   * build next" and "Point the Critic at a claim" already got above.
   */
  {
    id: "check-mission",
    pitch: "Check on a running mission",
    kind: "MISSION",
    run: { to: "/start" },
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
    run: { to: "/team", search: { tab: "spend", room: "spend" } },
  },
  {
    id: "check-quality",
    pitch: "Check if the evals still pass",
    run: { to: "/team", search: { tab: "spend", room: "quality" } },
  },
  // LOOM W1 - the "rare goes to the palette" promise, actually kept: every
  // folded or door-internal surface is indexed here (DESIGN-LOOM §9b).
  {
    id: "check-safety",
    pitch: "Check the guardrails and safety record",
    run: { to: "/team", search: { tab: "spend", room: "safety" } },
  },
  {
    id: "open-record",
    pitch: "Open the record room (traces and runs)",
    run: { to: "/team", search: { tab: "spend", room: "record" } },
  },
  {
    id: "trust-ledger",
    pitch: "Verify the audit trail integrity fingerprint",
    run: { to: "/team", search: { tab: "spend", room: "record" } },
  },
  /*
   * "Open your meetings and calendar" was removed on 2026-09-09 (fifth review)
   * rather than repointed. It sent people to /today, deleted by P-10, and the
   * meetings themselves went with that page's PM Desk -- outcomes.tsx's own
   * note records that the calendar TAB folded into Decisions while "calendar's
   * meetings themselves moved to Today's PM Desk". There is no surface left to
   * open, and a catalog entry naming a capability the product does not have is
   * worse than a missing one.
   */
  {
    id: "memory-graph",
    pitch: "Explore the knowledge graph",
    kind: "BELIEF",
    run: { to: "/outcomes", search: { tab: "graph" } },
  },
  {
    id: "prompt-studio",
    pitch: "Tune the prompts behind the agents",
    run: { to: "/team", search: { tab: "spend", room: "quality", view: "prompts" } },
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
