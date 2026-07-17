/**
 * IA — THE SUPAPROD LOOP (Tempo revamp, 2026-07-13). The pure navigation model
 * for the app shell.
 *
 * The rail is no longer a cold flat "WORKFLOW" list; it tells the product's
 * story in three narrative zones, top to bottom, so a first-time user can see
 * what Supaprod does, where to start, and how to move through it — with zero
 * training:
 *
 *   HOME
 *     Today            the daily landing; owns the ONE attention badge   [0]
 *   THE LOOP  (signal → shipped)   — the product management lifecycle as it
 *                                     lives in the app, one connected journey:
 *     01 Discover      signals become ranked bets                        [1]
 *     02 Decide        keep or kill each bet (the judgment gate)         [2]
 *     03 Plan          decisions become cited specs and a roadmap        [3]
 *     04 Design        specs get your brand and a design gate            [4]
 *     05 Build         agents build, test, and open the PR               [5]
 *     06 Ship          preview to production, with receipts              [6]
 *     07 Learn         outcomes close the loop and teach the system      [7]
 *   INTELLIGENCE  (always on)      — the compounding layers that make Supaprod
 *                                     more than a tracker:
 *     Brain            everything the product knows, one substrate       [8]
 *     Pulse            the machine's vital signs: spend/quality/safety    [9] (also `g`)
 *   (footer)  Settings [s] · Admin console [a] (actual admins only) · account chip
 *
 * (Brain + Pulse are one living system: the Brain is what the product KNOWS;
 * the Pulse is how it LIVES and runs — both always on. "Pulse" keeps the
 * `/engine-room` route + the calm-front/deep-engine doctrine underneath it.)
 *
 * SHORTCUT LAW: the key EQUALS the visible number, so pressing what you see
 * does what you expect — Today 0, the loop 1-7 (matching its 01-07 markers),
 * Brain 8, Engine 9; Settings/Admin pick up letters once the digits are spent.
 *
 * DERIVATION LAW: the palette JUMP section, the displayed key hints, and the
 * GotoShortcuts bindings are ALL DERIVED from `navKeyHint` over PRIMARY_NAV +
 * FOOTER_NAV — never hand-copied, so the shown key and the bound key can never
 * drift. `navKeyHint` maps the visible number to the key (see SHORTCUT LAW
 * above); Engine also keeps its standing `g` alias in GotoShortcuts.
 *
 * Each destination now also carries a `zone` and a `tagline` (the one-line
 * "what happens here / why", surfaced in the rail and reusable as the stage
 * USP). Features still NEVER add nav items (contract law): the loop is the
 * fixed spine of the product; everything else is a door reached from inside a
 * destination, the command palette, or Settings.
 *
 * PURE: data + active-state math only, no JSX. The shell renders these; the
 * invariants are unit-verified in nav-model.test.ts + __tests__/nav-model.test.ts.
 */

export type NavZone = "home" | "loop" | "intelligence";

export type NavItemDef = {
  to: string;
  label: string;
  /** Mono index, shown ONLY on THE LOOP rows ("01".."06"); "" elsewhere. */
  index: string;
  /** Narrative zone the row belongs to. */
  zone: NavZone;
  /** One-line "what happens here / why" — rail subtitle + reusable stage USP. */
  tagline: string;
  /** Legacy group flag kept for the loop rows (was "workflow"). */
  group?: "workflow";
  search?: Record<string, string>;
};

/**
 * The nine primary destinations, in rail order. Position is meaning: the
 * 1-based position IS the keyboard shortcut (keys 1-9), so the palette JUMP
 * rows and GotoShortcuts derive from this list and can never drift from it.
 */
export const PRIMARY_NAV: readonly NavItemDef[] = [
  {
    to: "/today",
    label: "Today",
    index: "",
    zone: "home",
    tagline: "What needs you now.",
  },
  {
    to: "/discover",
    label: "Discover",
    index: "01",
    zone: "loop",
    group: "workflow",
    tagline: "Signals become ranked bets.",
  },
  {
    to: "/decide",
    label: "Decide",
    index: "02",
    zone: "loop",
    group: "workflow",
    tagline: "Keep or kill each bet.",
  },
  {
    to: "/plan",
    label: "Plan",
    index: "03",
    zone: "loop",
    group: "workflow",
    tagline: "Cited specs and the roadmap.",
  },
  {
    to: "/design",
    label: "Design",
    index: "04",
    zone: "loop",
    group: "workflow",
    tagline: "Your brand, in every build.",
  },
  {
    to: "/build",
    label: "Build",
    index: "05",
    zone: "loop",
    group: "workflow",
    tagline: "Agents build and open the PR.",
  },
  {
    to: "/ship",
    label: "Ship",
    index: "06",
    zone: "loop",
    group: "workflow",
    tagline: "Preview to production.",
  },
  {
    to: "/learn",
    label: "Learn",
    index: "07",
    zone: "loop",
    group: "workflow",
    tagline: "Outcomes close the loop.",
  },
  {
    to: "/brain",
    label: "Brain",
    index: "",
    zone: "intelligence",
    tagline: "Everything the product knows.",
  },
  {
    to: "/engine-room",
    label: "Pulse",
    index: "",
    zone: "intelligence",
    tagline: "The machine's vital signs: spend, quality, safety, record.",
  },
];

/** Derived: the seven LOOP rows (the only indexed rows, 01-07). */
export const WORKFLOW_NAV: readonly NavItemDef[] = PRIMARY_NAV.filter((n) => n.zone === "loop");

/** Alias kept for readers that think in lifecycle terms. */
export const LOOP_NAV = WORKFLOW_NAV;

/** Derived: the home row(s). */
export const HOME_NAV: readonly NavItemDef[] = PRIMARY_NAV.filter((n) => n.zone === "home");

/** Derived: the always-on intelligence layers. */
export const INTELLIGENCE_NAV: readonly NavItemDef[] = PRIMARY_NAV.filter(
  (n) => n.zone === "intelligence",
);

/** Derived: the displayed key hint AND the GotoShortcuts binding, both from
 *  this one function (never hand-copied). The shortcut EQUALS the visible
 *  lifecycle number so pressing what you see does what you expect:
 *    Today = 0 (home)  ·  the 7 loop stages = 1..7 (their 01..07 markers)
 *    Brain = 8  ·  Engine Room = 9  ·  Settings = s  ·  Admin console = a
 *  Digits carry the lifecycle spine; letters pick up once the digits are
 *  spent (the founder's "numeric first, then keyboard" rule). Engine Room
 *  also keeps its standing `g` alias (bound in GotoShortcuts). */
export function navKeyHint(item: NavItemDef): string {
  switch (item.to) {
    case "/today":
      return "0";
    case "/brain":
      return "8";
    case "/engine-room":
      return "9";
    case "/settings":
      return "s";
    case "/admin":
      return "a";
    default:
      // Loop stages carry a two-digit lifecycle marker ("01".."07"); the
      // shortcut is that number (1..7), so the shown index IS the key.
      return item.index ? String(parseInt(item.index, 10)) : "";
  }
}

/**
 * Footer rows. Admin renders ONLY for actual admins (the shell gates it with
 * its existing amIAdmin query); claiming admin moved to Settings > Workspace.
 * Settings is always visible — a real user must never need to know a URL.
 */
export const FOOTER_NAV: readonly NavItemDef[] = [
  {
    to: "/settings",
    label: "Settings",
    index: "",
    zone: "home",
    tagline: "Account, workspace, connections, keys, billing.",
  },
  {
    to: "/admin",
    label: "Admin console",
    index: "",
    zone: "home",
    tagline: "Platform administration.",
  },
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
