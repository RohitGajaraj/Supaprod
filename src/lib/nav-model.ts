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
 *     Today            the daily landing; owns the ONE attention badge  [g t]
 *   THE LOOP  (signal → shipped)   — the product management lifecycle as it
 *                                     lives in the app, one connected journey:
 *     01 Discover      signals become ranked bets                      [g d]
 *     02 Decide        keep or kill each bet (the judgment gate)       [g e]
 *     03 Plan          decisions become cited specs and a roadmap      [g p]
 *     04 Design        specs get your brand and a design gate          [g n]
 *     05 Build         agents build, test, and open the PR             [g b]
 *     06 Ship          preview to production, with receipts            [g h]
 *     07 Learn         outcomes close the loop and teach the system    [g l]
 *   OPERATIONS  (the work, and who does it) — the two standing doors that are
 *                                     not lifecycle stations. Both are rail
 *                                     rows in AppFrame and were, until now, in
 *                                     no nav list at all, so no key reached
 *                                     them and their rows drew no keycap:
 *     Runs             work you handed over, and how far it got        [g r]
 *     Crew             how much rope each agent gets                   [g c]
 *   INTELLIGENCE  (always on)      — the compounding layers that make Supaprod
 *                                     more than a tracker:
 *     Brain            everything the product knows, one substrate     [g k]
 *     Pulse            the machine's vital signs: spend/quality/safety [g u]
 *   (footer)  Settings [g s] · Admin console (no key, see navKeyHint) · account chip
 *
 * (Brain + Pulse are one living system: the Brain is what the product KNOWS;
 * the Pulse is how it LIVES and runs — both always on. "Pulse" keeps the
 * `/engine-room` route + the calm-front/deep-engine doctrine underneath it.)
 *
 * SHORTCUT LAW (rewritten 2026-08-05 on the founder's ruling): GO, THEN THE
 * LETTER. Press `g`, release, then a letter that appears in the door's own
 * label. No digit is bound anywhere.
 *
 * The previous law was "the key EQUALS the visible number": Today 0, the loop
 * 1-7, Brain 8, Engine 9, then letters once the digits ran out. It failed twice
 * over. A number beside a rail row could be the station's 01-07 IDENTITY, its
 * shortcut, or a count, and the reader had to work out which. And bare keys
 * shared a namespace with in-page actions, so navigation kept losing: `a` was
 * surrendered to Approve outright, `r` went to Reject so Runs became `u`, `c`
 * went to Challenge so Crew became `e`. Nobody can re-derive `u` for Runs.
 *
 * A prefix removes the contest instead of adjudicating it. `r` alone still
 * rejects; `g` then `r` goes to Runs. Runs and Crew get their natural first
 * letters back, the 01-07 markers can only mean identity, and the pattern is
 * the one Gmail, Linear, GitHub, Jira and Superhuman already use. See
 * NAV_CHORD_PREFIX and navKeyHint below for the per-door letters and for why
 * Admin still has none.
 *
 * DERIVATION LAW: the palette JUMP section, the displayed key hints, and the
 * GotoShortcuts bindings are ALL DERIVED from `navKeyHint` over PRIMARY_NAV +
 * FOOTER_NAV — never hand-copied, so the shown key and the bound key can never
 * drift. `navKeyHint` returns the SECOND key of the chord; the prefix is always
 * the first, and the rail draws both. Engine's old standing bare-`g` alias is
 * gone, because `g` now arms every chord.
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
    tagline: "Rank opportunities by impact.",
  },
  {
    to: "/decide",
    label: "Decide",
    index: "02",
    zone: "loop",
    group: "workflow",
    tagline: "Approve ideas or pass on them.",
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
    tagline: "See results and system insights.",
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
    // NOT "Everything the product knows." That claimed knowledge in the
    // present tense on the door to the brain, which is the one claim the
    // vocabulary canon forbids outright: the loop is wired and proven, and it
    // accrues on first real use. This says what the crew does with the record,
    // which is true on day one and stays true as the record fills.
    tagline: "What the crew reads before it acts.",
  },
  {
    to: "/engine-room",
    label: "Pulse",
    index: "",
    zone: "intelligence",
    // Names the four rooms, not the machinery. "The machine's vital signs"
    // told the reader about our internals rather than about their work.
    tagline: "Spend, quality, safety, and the record.",
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

/**
 * GO, THEN THE LETTER. The prefix every navigation shortcut begins with.
 *
 * FOUNDER RULING 2026-08-05, and the reasoning is worth keeping because it
 * overturns a rule this file argued for at length.
 *
 * The old scheme mixed the two alphabets: Today `0`, the loop `1`-`7`, Brain
 * `8`, Engine `9`, then letters once the digits ran out. His objection, in his
 * words: *"if you are using alphanumeric in between, it really confuses the
 * user... Either you need to go with numbers or you need to go with
 * alphabets."* Two things were wrong with it and both are now fixed:
 *
 *   1. A NUMBER ON A ROW WAS AMBIGUOUS. The loop stations already render a
 *      two-digit lifecycle marker, 01 to 07. Drawing the shortcut as the same
 *      digit meant a number beside a row could be its identity, its shortcut,
 *      or a count, and the reader had to work out which. Now the marker is the
 *      only number on the row and it can only mean identity.
 *
 *   2. BARE KEYS SHARED A NAMESPACE WITH PAGE ACTIONS, so navigation kept
 *      losing. `a` was surrendered entirely because it is Approve on every
 *      gate; `r` went to Reject so Runs became `u`; `c` went to Challenge so
 *      Crew became `e`. Nobody can derive `u` for Runs or `e` for Crew, and
 *      the previous version of this comment needed eighteen lines to justify
 *      them. A prefix removes the contest instead of adjudicating it: `r`
 *      alone is still Reject, and `g` then `r` is Runs. Different keystrokes,
 *      so neither has to yield. Admin gets a key back for the first time.
 *
 * This is the pattern Gmail, Linear, GitHub, Jira, Superhuman and Height all
 * use, so for most people it is already learned. It is also re-derivable,
 * which the old scheme was not: `g` for go, then a letter you can see in the
 * word itself.
 */
export const NAV_CHORD_PREFIX = "g";

/** Derived: the displayed key hint AND the GotoShortcuts binding, both from
 *  this one function (never hand-copied). Returns the SECOND key of the chord;
 *  the prefix above is always the first, so the rail draws "g d" for Discover.
 *
 *  THE LETTER RULE. Each door takes a letter that appears in its own visible
 *  label, so it can be re-derived rather than memorised. Discover, Decide and
 *  Design all begin with D and only one can have it, so the two others take
 *  their first distinctive letter instead: deCide is not free (`c` is Crew's
 *  natural first letter and Crew has no alternative), so Decide takes the `e`
 *  of dEcide, and Design takes the `n` of desigN.
 *
 *  Brain is the one door whose letter is not in its label: `k`, for what the
 *  product KNOWS. That is this file's own definition of it (see the header:
 *  "the Brain is what the product KNOWS"), and `b` belongs to Build.
 *
 *  Nothing here returns a digit. If a future door needs a key and every useful
 *  letter is taken, add a second chord (`g` then two letters) rather than
 *  reaching for a number: reintroducing digits reopens the ambiguity above. */
export function navKeyHint(item: NavItemDef): string {
  switch (item.to) {
    case "/today":
      return "t";
    case "/discover":
      return "d";
    case "/decide":
      return "e"; // dEcide; `d` is Discover
    case "/plan":
      return "p";
    case "/design":
      return "n"; // desigN; `d` is Discover, `e` is Decide
    case "/build":
      return "b";
    case "/ship":
      return "h"; // sHip; `s` is Settings
    case "/learn":
      return "l";
    case "/runs":
      return "r"; // its own first letter, freed by the prefix
    case "/crew":
      return "c"; // its own first letter, freed by the prefix
    case "/brain":
      return "k"; // what the product Knows; `b` is Build
    case "/engine-room":
      return "u"; // pUlse; `p` is Plan
    case "/settings":
      return "s";
    case "/admin":
      /**
       * STILL NO KEY, but for a different reason than before.
       *
       * The original reason is gone: bare `a` is Approve on every gate, both
       * window listeners fired, and pressing `a` on a gate approved the call
       * AND threw you to the admin console (verified live 2026-07-29). The
       * chord ends that contest, so `g` then `a` would now be free.
       *
       * A SECOND REASON SURVIVES IT, and it is the one that binds. AppFrame
       * renders no `/admin` control anywhere: there is no `amIAdmin` query and
       * no link in the rail or its foot. A key here would be a key that goes
       * somewhere the rail cannot follow, which is precisely the defect
       * AppFrame.rail-covers-keys.test.ts exists to catch, and it caught this.
       *
       * Worth noting for whoever picks this up: FOOTER_NAV's own comment claims
       * "Admin renders ONLY for actual admins (the shell gates it with its
       * existing amIAdmin query)". That query does not exist in AppFrame. The
       * footer row is currently unreachable except by typing the URL. Give the
       * shell a lit admin control and this may return `a`.
       */
      return "";
    default:
      // A door with no letter draws no keycap. Never a digit: see above.
      return "";
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
