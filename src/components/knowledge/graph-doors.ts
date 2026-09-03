/**
 * WHERE A GRAPH NODE ACTUALLY LIVES.
 *
 * The founder's rule for this pass: "Every node must open its real record.
 * Doors, not dead ends." Until now a node on the canvas offered three things you
 * could DO to it (reopen it, send it to the Critic, start a mission from it) and
 * no way to simply go and read the thing. A map you cannot leave through is a
 * picture of the territory.
 *
 * THE HONESTY RULE THIS FILE ENFORCES, and it is the reason it is a table rather
 * than a `/${kind}s/${id}` template: an affordance is a promise
 * (`shell/primitives.tsx`, the `Cell` and `CtxRow` notes), so a door that leads
 * to a page which cannot find the row is worse than no door at all. Three tiers,
 * and every kind is assigned to one deliberately:
 *
 *   `row`    the destination opens THIS artifact. Five kinds have one (P-14,
 *            A-QUEUE.md: `mission` moved to list when /runs/$missionId went).
 *   `list`   the destination is the right surface but cannot address the row, so
 *            the label says "the queue" and not "this bet". Four kinds.
 *   absent   the product genuinely has nowhere to send you. Named in the table
 *            with the reason rather than quietly aimed at something adjacent.
 *
 * Verified against `src/routes/` and each route's own `validateSearch`, because a
 * search key a route's parser drops is discarded before any component sees it,
 * which is the exact defect Discover's `?focus=` carried for a release.
 */

export type NodeDoorTier = "row" | "list";

export type NodeDoor = {
  /** What the control says. Names the destination, never the mechanism. */
  label: string;
  tier: NodeDoorTier;
  /** Route path, exactly as the file-based router declares it. */
  to: string;
  search?: Record<string, string>;
  params?: Record<string, string>;
};

/**
 * The table. `(id) => NodeDoor` so a row door can place the id wherever its
 * route wants it, which differs per surface: Brain takes it as a search param,
 * Plan and Runs take it as a path param, Discover takes it as `focus`.
 */
const DOORS: Record<string, (id: string) => NodeDoor> = {
  // Brain's own two drills. Both are real per-row detail views on this surface.
  decision: (id) => ({
    label: "Open this call",
    tier: "row",
    to: "/outcomes",
    search: { tab: "decisions", decision: id },
  }),
  learning: (id) => ({
    label: "Open this outcome",
    tier: "row",
    to: "/outcomes",
    search: { tab: "learnings", learning: id },
  }),
  // The spec editor is addressed by path.
  prd: (id) => ({ label: "Open the spec", tier: "row", to: "/plan/spec/$id", params: { id } }),
  // P-14 (A-QUEUE.md, R-35): /runs/$missionId is deleted. A driven mission's
  // real record is /track/$trackId, but only for the minority that has a
  // track (measured: 395 of 407 do not), and this function has only the
  // mission id to work with, synchronously -- no read to resolve a track
  // from it. Downgraded to list tier rather than claiming a row door most
  // missions do not have: Start carries the workspace's own runs.
  mission: () => ({ label: "Open your runs", tier: "list", to: "/start" }),
  /**
   * Discover's `?focus=` deliberately takes either a signal id or a cluster id
   * and resolves whichever it was given (its own parser documents this), so both
   * kinds address a row through the same key.
   */
  signal: (id) => ({
    label: "Open the signal",
    tier: "row",
    to: "/arriving",
    search: { tab: "signals", focus: id },
  }),
  theme: (id) => ({
    label: "Open the cluster",
    tier: "row",
    to: "/arriving",
    search: { tab: "signals", focus: id },
  }),
  /**
   * LIST TIER, and the label says so. Discover's focus resolver matches a signal
   * or a ranked cluster; an opportunity id matches neither and resolves to null,
   * so pointing `focus` at one would put the reader on whichever bet happened to
   * rank first with nothing explaining why. The queue is the honest destination.
   */
  opportunity: () => ({
    label: "Open the queue",
    tier: "list",
    to: "/arriving",
    search: { tab: "queue" },
  }),
  task: () => ({ label: "Open the tasks", tier: "list", to: "/start" }),
  deployment: () => ({ label: "Open what shipped", tier: "list", to: "/ship" }),
  /** Design memory is settled brand direction, and it lives in Settings. */
  design_memory: () => ({
    label: "Open the brand record",
    tier: "list",
    to: "/settings",
    search: { section: "brand" },
  }),
};

/**
 * Kinds with NO door, and why. Recorded rather than silently omitted, so the
 * next person can tell "nobody wired it" from "there is nothing to wire".
 *
 *   meeting        the meetings surface is gone. `/meetings` and `/meetings/$id`
 *                  both redirect to `/brain?tab=calendar`, and `calendar`
 *                  resolves through LEGACY_TABS to the decision ledger, which
 *                  renders no meetings at all.
 *   changeset      a changeset is addressed through its mission, and the graph
 *                  node does not carry the mission id. Following the parent edge
 *                  to find one would be a guess dressed as a link.
 *   prd_scaffold   same shape: identified by the spec it belongs to, never by
 *                  itself. `artifact-tables.ts` leaves it unmapped for the same
 *                  reason and says so.
 *   prd_flow       as above.
 *   roadmap_item   there is no roadmap_items table. A roadmap item is an
 *                  opportunity carrying a bucket, so no row exists to open.
 *   prototype      /design is deleted (P-14, A-QUEUE.md, R-34); its own
 *                  ruling names the drawing's new homes as each run's
 *                  artifact pane and Find anything's prototype group, and
 *                  neither is a URL a door can point at -- Find anything is
 *                  a shell overlay with no route of its own, and the run
 *                  that owns a given prototype is not known here.
 */
export const KINDS_WITHOUT_A_DOOR = [
  "meeting",
  "changeset",
  "prd_scaffold",
  "prd_flow",
  "roadmap_item",
  "prototype",
] as const;

/** The door for a node, or null when the product has nowhere honest to send it. */
export function nodeDoor(kind: string, id: string): NodeDoor | null {
  const build = DOORS[kind];
  if (!build || !id) return null;
  return build(id);
}
