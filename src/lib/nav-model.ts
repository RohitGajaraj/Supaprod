/**
 * IA-NAV-V11 (v11 #12) → OBS-02 reshape → LOOM W1 (2026-07-04) → IA SPINE
 * (2026-07-11) — the pure navigation model for the app shell.
 *
 * History: the left nav had four competing metaphors, OBS-02/OBS-10 flattened
 * it, LOOM made every home visible as THE LOOP + THE ENGINE. The 2026-07-11
 * IA spine reduces the rail to ONE list of seven primary destinations,
 * keys 1-7, top to bottom:
 *
 *   Today            (pinned above all groups, unnumbered; owns the ONE
 *                     attention badge fed by the server-computed needsYouCount)
 *   WORKFLOW         01 Discover · 02 Plan · 03 Design · 04 Build
 *                     (mono indexes live ONLY in this group)
 *   Memory           (/brain, unnumbered)
 *   Engine Room      (/engine-room, unnumbered; the existing "g" alias stays
 *                     and is shown as a hint on the row)
 *   (footer)         Settings · Admin console (actual admins only) · account chip
 *
 * THE ENGINE group header is gone. Decide left the rail (/decide redirects to
 * /discover?tab=queue); Ledger left the rail (/trust-ledger redirects to
 * /engine-room?room=record). Features still NEVER add nav items (contract law).
 *
 * DERIVATION LAW: the palette JUMP section, displayed key hints, and the
 * GotoShortcuts key range are DERIVED from PRIMARY_NAV — never hand-copied.
 *
 * PURE: data + active-state math only, no JSX. The shell renders these; the
 * invariants are unit-verified in nav-model.test.ts + __tests__/nav-model.test.ts.
 */

export type NavItemDef = {
  to: string;
  label: string;
  /** Mono index, shown ONLY on WORKFLOW rows ("01".."04"); "" elsewhere. */
  index: string;
  /** Rail group. Today, Memory, and Engine Room are ungrouped. */
  group?: "workflow";
  search?: Record<string, string>;
};

/**
 * The seven primary destinations, in rail order. Position is meaning: the
 * 1-based position IS the keyboard shortcut (keys 1-7), so the palette JUMP
 * rows and GotoShortcuts derive from this list and can never drift from it.
 */
export const PRIMARY_NAV: readonly NavItemDef[] = [
  { to: "/today", label: "Today", index: "" },
  { to: "/discover", label: "Discover", index: "01", group: "workflow" },
  { to: "/plan", label: "Plan", index: "02", group: "workflow" },
  { to: "/design", label: "Design", index: "03", group: "workflow" },
  { to: "/build", label: "Build", index: "04", group: "workflow" },
  { to: "/brain", label: "Memory", index: "" },
  { to: "/engine-room", label: "Engine Room", index: "" },
];

/** Derived: the WORKFLOW group rows (the only indexed, group-headed rows). */
export const WORKFLOW_NAV: readonly NavItemDef[] = PRIMARY_NAV.filter(
  (n) => n.group === "workflow",
);

/** Derived: the displayed key hint for a destination is its 1-based position. */
export function navKeyHint(item: NavItemDef): string {
  const i = PRIMARY_NAV.findIndex((n) => n.to === item.to);
  return i >= 0 ? String(i + 1) : "";
}

/**
 * Footer rows. Admin renders ONLY for actual admins (the shell gates it with
 * its existing amIAdmin query); claiming admin moved to Settings > Workspace.
 * Settings is always visible — a real user must never need to know a URL.
 */
export const FOOTER_NAV: readonly NavItemDef[] = [
  { to: "/settings", label: "Settings", index: "" },
  { to: "/admin", label: "Admin console", index: "" },
];

/**
 * Paths that live inside the engine room (drive the Engine Room row's active
 * state). /govern and /trust-ledger are redirect stubs that land here; /sync
 * is the bindings drill layer reached from Settings.
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
