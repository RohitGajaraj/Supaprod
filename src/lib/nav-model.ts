/**
 * IA — THE SUPAPROD LOOP (Tempo revamp, 2026-07-13). The pure navigation model
 * for the app shell.
 *
 * The rail is no longer a cold flat "WORKFLOW" list; it tells the product's
 * story in four narrative zones, top to bottom, so a first-time user can see
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
 *   OPERATIONS  (the work, and who does it) — the two standing doors that are
 *                                     not lifecycle stations. Both are rail
 *                                     rows in AppFrame and were, until now, in
 *                                     no nav list at all, so no key reached
 *                                     them and their rows drew no keycap:
 *     Runs             work you handed over, and how far it got          [u]
 *     Crew             how much rope each agent gets                     [e]
 *   INTELLIGENCE  (always on)      — the compounding layers that make Supaprod
 *                                     more than a tracker:
 *     Brain            everything the product knows, one substrate       [8]
 *     Pulse            the machine's vital signs: spend/quality/safety    [9] (also `g`)
 *   (footer)  Settings [s] · Admin console (no bare key, see navKeyHint) · account chip
 *
 * (Brain + Pulse are one living system: the Brain is what the product KNOWS;
 * the Pulse is how it LIVES and runs — both always on. "Pulse" keeps the
 * `/engine-room` route + the calm-front/deep-engine doctrine underneath it.)
 *
 * SHORTCUT LAW: the key EQUALS the visible number, so pressing what you see
 * does what you expect — Today 0, the loop 1-7 (matching its 01-07 markers),
 * Brain 8, Engine 9. The digits are spent there, so every remaining door takes
 * a LETTER FROM ITS OWN LABEL: the first letter of the visible word that no
 * in-page action has already claimed, read left to right. Runs -> `r` is taken
 * (Reject, on the approvals queue) so Runs is `u`; Crew -> `c` is taken
 * (Challenge, on the decide gate) and `r` is taken, so Crew is `e`; Settings is
 * `s`. The rule is stateable, so the next door does not need a committee, and
 * the key it lands on is one a person can re-derive.
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
 * WHY /runs AND /crew JOINED THE LIST (2026-08-05). That contract law is about
 * FEATURES inventing rows. These two are not new rows: they have been rail
 * rows in AppFrame all along, and their absence here was the bug. An audit
 * measured it - the rail offers 5 doors, the keyboard 12, the stage strip 7,
 * and only THREE destinations appeared in all three lists. Two of the five
 * rail rows carried no shortcut at all because neither path was in PRIMARY_NAV
 * or FOOTER_NAV, the only two lists GotoShortcuts reads. Listing them here is
 * what the DERIVATION LAW demands: one list of doors, one function that keys
 * them. The rail keycaps and the palette JUMP rows follow with no other edit,
 * and the three-list overlap goes from three destinations to five.
 *
 * PURE: data + active-state math only, no JSX. The shell renders these; the
 * invariants are unit-verified in nav-model.test.ts + __tests__/nav-model.test.ts.
 */

export type NavZone = "home" | "loop" | "operations" | "intelligence";

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
 * The twelve primary destinations, in narrative order: HOME, then THE LOOP,
 * then OPERATIONS, then INTELLIGENCE. The palette JUMP rows, the rail keycaps
 * and the GotoShortcuts bindings all derive from this list, so it cannot drift
 * from what the keyboard actually does.
 *
 * Position is NOT the key any more (it stopped being it when Today took 0 and
 * the loop took its own 01-07 markers). `navKeyHint` is the single source of
 * the binding; read it, never count rows.
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
  // OPERATIONS. Two doors the shell has always drawn and the keyboard could
  // never reach. Their labels here are the labels AppFrame's rail draws, on
  // purpose: the keycap is a letter of the word next to it, so the row teaches
  // its own shortcut.
  {
    to: "/runs",
    label: "Runs",
    index: "",
    zone: "operations",
    tagline: "Work you handed over, and how far it got.",
  },
  {
    to: "/crew",
    label: "Crew",
    index: "",
    zone: "operations",
    tagline: "How much rope each agent gets.",
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

/** Derived: the two operations doors (the work in flight, and who does it). */
export const OPERATIONS_NAV: readonly NavItemDef[] = PRIMARY_NAV.filter(
  (n) => n.zone === "operations",
);

/** Derived: the always-on intelligence layers. */
export const INTELLIGENCE_NAV: readonly NavItemDef[] = PRIMARY_NAV.filter(
  (n) => n.zone === "intelligence",
);

/** Derived: the displayed key hint AND the GotoShortcuts binding, both from
 *  this one function (never hand-copied). The shortcut EQUALS the visible
 *  lifecycle number so pressing what you see does what you expect:
 *    Today = 0 (home)  ·  the 7 loop stages = 1..7 (their 01..07 markers)
 *    Brain = 8  ·  Engine Room = 9
 *    Runs = u  ·  Crew = e  ·  Settings = s  ·  Admin console = none
 *  Digits carry the lifecycle spine; letters pick up once the digits are
 *  spent (the founder's "numeric first, then keyboard" rule). Engine Room
 *  also keeps its standing `g` alias (bound in GotoShortcuts).
 *
 *  THE LETTER RULE, and why it is not the obvious letter. A shortcut here is
 *  a WINDOW listener, so it fires on every surface at once. When it lands on
 *  a letter a surface already uses for an in-page action, BOTH fire: that is
 *  exactly how `a` was lost for /admin (verified live 2026-07-29 - pressing
 *  `a` on a gate approved the call AND threw you to the admin console). So a
 *  door takes the first letter of its own visible label that no in-page
 *  action has already claimed, read left to right:
 *    Runs -> `r` is Reject on the approvals queue, a decided contract in
 *            routes/_authenticated.approvals.tsx (the j/k/a/r keys, kept by
 *            name in that file's own header). Next letter: `u`.
 *    Crew -> `c` is Challenge on the decide gate
 *            (routes/_authenticated.decide.tsx), `r` is spoken for above.
 *            Next letter: `e`.
 *  Also claimed elsewhere and therefore off limits: a/d/z (the Today gate),
 *  k/x (the decide gate), j/k (every list that walks with j/k), h (snooze in
 *  the approvals tray), s and g (already bound here). Nothing binds `u` or
 *  `e` on any surface, which is what makes them free rather than merely
 *  unused. Navigation never outranks the decision the product exists to
 *  collect; when the two want the same key, navigation moves. */
export function navKeyHint(item: NavItemDef): string {
  switch (item.to) {
    case "/today":
      return "0";
    case "/runs":
      return "u";
    case "/crew":
      return "e";
    case "/brain":
      return "8";
    case "/engine-room":
      return "9";
    case "/settings":
      return "s";
    case "/admin":
      // NO BARE KEY. `a` is Approve on every gate (Today, Approvals), which is
      // the highest-frequency action in the product and the one the prototype
      // draws a keycap for. Both bindings are window listeners, so both fired:
      // verified live on 2026-07-29, pressing `a` on a gate approved the call
      // AND threw you to the admin console, where you could not see what you
      // had just done. A rare admin door does not outrank the decision the
      // whole product exists to collect. Admin stays reachable from Settings.
      return "";
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
