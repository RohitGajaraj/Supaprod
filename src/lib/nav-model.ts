/**
 * IA-NAV-V11 (v11 #12) → OBS-02 reshape — the pure navigation model for the app shell.
 *
 * The left nav had four competing metaphors stacked on top of each other: a
 * "Workspace" daily rail (Today · Ask), a labelled "Loop" section fed through a
 * vestigial NavGroup indirection (Product · Build · Missions · Brain), a 5-icon
 * "Trust" row in the footer (Approvals · Spend · Engine Room · Trust Ledger ·
 * Connectors), and a floating QuickAccessDock (Calendar). This module flattens
 * that to ONE calm list of outcome-named destinations + ONE recessed Engine Room
 * door that reveals the governance/engine surfaces on demand (the engine-room
 * doctrine: calm front, deep engine behind one door). The dock is gone — Calendar
 * is reached from the Brain surface and the ⌘K palette.
 *
 * OBS-02: the Obsidian iconography law has no icon set - the nav is a mono
 * numeral index (01-05), not lucide glyphs. `icon` is replaced by `index`.
 * Ask leaves the rail (it returns as the ⌘J panel, OBS-12); Discover and Plan
 * are added as first-class destinations.
 *
 * OBS-10: Discover/Plan now target their real shipped routes (`/discover`,
 * `/plan`), no longer the interim `/product?tab=`. The Engine Room door now
 * targets `/engine-room` (OBS-09's new ported glance), not `/govern` - the
 * spec's default assumption inverted here exactly as its own step 1 warns it
 * might: `/govern` remains a real, live detail layer the new rooms drill into
 * (see `legacy-redirects.ts`'s module doc), not the canonical door itself.
 *
 * PURE: data + active-state math only, no JSX. The shell renders these; the
 * invariants (the destinations are flat + unique, no engine-room surface is
 * orphaned, active-state matching) are unit-verified.
 */

export type NavItemDef = {
  to: string;
  label: string;
  index: string;
  search?: Record<string, string>;
};

/**
 * The primary destinations - ONE flat, outcome-named list (no "Loop"/"Workspace"
 * labels, no NavGroup indirection). These are the calm front of the product.
 *
 * OBS-10: all five now point at their real canonical routes (Discover/Plan no
 * longer share the interim `/product?tab=` scope).
 */
export const PRIMARY_NAV: readonly NavItemDef[] = [
  { to: "/today", label: "Today", index: "01" },
  { to: "/discover", label: "Discover", index: "02" },
  { to: "/plan", label: "Plan", index: "03" },
  { to: "/build", label: "Build", index: "04" },
  { to: "/knowledge", label: "Brain", index: "05" },
];

/**
 * The single recessed door into the engine room. Carries the live approvals
 * badge; clicking it reveals ENGINE_ROOM_LINKS on demand.
 *
 * OBS-10: targets the new ported glance `/engine-room` (OBS-09), not the
 * parchment `/govern` - see the module doc above.
 */
export const ENGINE_ROOM_DOOR: NavItemDef = {
  to: "/engine-room",
  label: "Engine Room",
  index: "G",
};

/**
 * The governance / machinery surfaces, revealed on demand behind the door.
 * EVERY surface the old 5-icon Trust row exposed is preserved here, so collapsing
 * the row never orphans a destination (Trust Ledger + Connectors are not indexed
 * by the ⌘K palette, so they must stay reachable from the door). Obsidian has no
 * icon set, so the door's menu is plain text rows.
 *
 * OBS-10: Approvals is dropped (approvals are Calls on Today, never in the
 * door - contract §8). Spend and the bare Engine Room link now point at the
 * new `/engine-room` glance + its Spend room, not `/govern`.
 */
export const ENGINE_ROOM_LINKS: readonly NavItemDef[] = [
  { to: "/engine-room", label: "Spend", index: "", search: { room: "spend" } },
  { to: "/engine-room", label: "Engine Room", index: "" },
  { to: "/trust-ledger", label: "Trust Ledger", index: "" },
  { to: "/sync", label: "Connectors", index: "" },
];

/**
 * Paths that live inside the engine room (drive the door's active state).
 * OBS-10: `/engine-room` is the door's own destination; `/govern` stays too
 * since it is still a real, live detail layer the rooms drill into.
 */
export const ENGINE_ROOM_PATHS: readonly string[] = [
  "/engine-room",
  "/govern",
  "/trust-ledger",
  "/sync",
];

/**
 * PURE active-state for a primary destination. A bare item is active on an exact
 * path match; a tab-scoped item additionally requires its tab to be the live one.
 * A bare item is only active when no tab is active on this route (prevents
 * simultaneous activation of bare and tab-scoped items on the same route).
 */
export function navItemActive(
  item: { to: string; search?: { tab?: string } },
  path: string,
  searchTab: string | null,
): boolean {
  if (path !== item.to) return false;
  if (item.search?.tab) return searchTab === item.search.tab;
  // Bare item: only active when no tab is active on this route
  if (searchTab) return false;
  return true;
}

/** PURE — is the user anywhere inside the engine room (so the door reads active)? */
export function engineRoomActive(path: string): boolean {
  return ENGINE_ROOM_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}
