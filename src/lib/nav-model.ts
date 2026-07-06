/**
 * IA-NAV-V11 (v11 #12) → OBS-02 reshape → LOOM W1 (2026-07-04) — the pure
 * navigation model for the app shell.
 *
 * History: the left nav had four competing metaphors (a "Workspace" rail, a
 * "Loop" section, a 5-icon Trust row, a floating dock). OBS-02/OBS-10
 * flattened that to five destinations + ONE recessed Engine Room door (a
 * hover menu). The founder's 2026-07-04 production-readiness mission found
 * the door made real surfaces effectively invisible (Settings, Trust Ledger,
 * Connections, Admin had no click path a new user could find), so LOOM
 * retires the hover-menu door for a VISIBLE grouped rail (DESIGN-LOOM §8):
 *
 *   THE LOOP    01 Today · 02 Discover · 03 Plan · 04 Build · 05 Brain
 *   THE ENGINE  06 Engine Room · 07 Trust Ledger
 *   (footer)    Settings · Admin (role-gated) · the user chip menu
 *
 * Everything reachable by clicking; depth stays on demand behind the visible
 * doors. Features still NEVER add nav items (contract law).
 *
 * LOOM also renames Brain's URL: /knowledge → /brain (label and URL now
 * agree; /knowledge is a permanent redirect).
 *
 * PURE: data + active-state math only, no JSX. The shell renders these; the
 * invariants are unit-verified in nav-model.test.ts.
 */

export type NavItemDef = {
  to: string;
  label: string;
  index: string;
  search?: Record<string, string>;
};

/** THE LOOP — the five outcome-named destinations (the calm front). */
export const PRIMARY_NAV: readonly NavItemDef[] = [
  { to: "/today", label: "Today", index: "01" },
  { to: "/discover", label: "Discover", index: "02" },
  { to: "/plan", label: "Plan", index: "03" },
  { to: "/build", label: "Build", index: "04" },
  { to: "/brain", label: "Brain", index: "05" },
];

/**
 * THE ENGINE: the machinery group, VISIBLE in the rail (LOOM retires the
 * hover-menu door; these are direct rows). The Engine Room row is the glance
 * (four rooms inside; /govern remains its drill layer); Trust Ledger is the
 * receipts surface. Connections was removed from the rail (2026-07-06): the
 * single connect home is Settings > Connections, and /sync (retitled "Sync &
 * bindings") is reached from there, not the primary nav. Approvals are Calls
 * on Today, NEVER here (contract §8).
 */
export const ENGINE_GROUP: readonly NavItemDef[] = [
  { to: "/engine-room", label: "Engine Room", index: "06" },
  { to: "/trust-ledger", label: "Trust Ledger", index: "07" },
];

/**
 * Footer rows. Admin renders only for admins (the shell gates it with its
 * existing amIAdmin query); Settings is always visible — a real user must
 * never need to know a URL (the LOOM visibility law).
 */
export const FOOTER_NAV: readonly NavItemDef[] = [
  { to: "/settings", label: "Settings", index: "" },
  { to: "/admin", label: "Admin console", index: "" },
];

/**
 * Paths that live inside the engine room (drive the group's active state).
 * /govern stays: it is the rooms' live drill layer, one level deeper.
 */
export const ENGINE_ROOM_PATHS: readonly string[] = [
  "/engine-room",
  "/govern",
  "/trust-ledger",
  "/sync",
];

/**
 * PURE active-state for a destination. A bare item is active on an exact
 * path match; a tab-scoped item additionally requires its tab to be the live
 * one. A bare item is only active when no tab is active on this route.
 */
export function navItemActive(
  item: { to: string; search?: { tab?: string } },
  path: string,
  searchTab: string | null,
): boolean {
  if (path !== item.to) return false;
  if (item.search?.tab) return searchTab === item.search.tab;
  if (searchTab) return false;
  return true;
}

/** PURE — is the user anywhere inside the engine room? */
export function engineRoomActive(path: string): boolean {
  return ENGINE_ROOM_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}
