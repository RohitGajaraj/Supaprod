/**
 * IA — THE PURE NAVIGATION MODEL FOR THE APP SHELL.
 *
 * ── THREE DOORS, RULED 2026-09-02 (P-11, A-QUEUE.md) ────────────────────────
 * This file used to carry fifteen destinations across four narrative zones —
 * a HOME row, the seven loop stations, two OPERATIONS doors and two always-on
 * INTELLIGENCE layers — because the rail once drew five rows (Today, Brain,
 * Threads, Engine Room, and the derived Work row) and the keyboard reached
 * further still. R-01 already ruled the seven stations are never navigation;
 * F-144/F-145/F-146 folded Approvals and Runs into one home door; and the
 * founder's brief on 2026-09-02 cut the rail itself to three: **Start · Run ·
 * Settings**.
 *
 * `PRIMARY_NAV` now lists exactly those three, and nothing else, on purpose.
 * The header this replaced explained at length why a keyboard shortcut with
 * no visible door is a defect ("twelve keys that fired and were drawn
 * nowhere") — the fix that story led to was DERIVING the keycaps from one
 * list read by both the rail and the keyboard, so the two could never drift
 * again. Leaving Discover, Decide, Plan and the rest bound to a chord after
 * their rail doors are gone would reopen that exact defect in the other
 * direction: a shortcut nothing on screen advertises. So they leave with
 * their doors. `/outcomes`, `/threads`, `/engine-room` and `/approvals` all stay
 * reachable by URL (P-11's own "not in scope" line); they are simply no
 * longer doors the keyboard or the rail name.
 *
 * SHORTCUT LAW, UNCHANGED: press `g`, then a letter that appears in the
 * door's own label. `navKeyHint` is the single source of the binding — the
 * rail's keycaps and `GotoShortcuts`' bindings both read it, so a rebinding
 * changes both in one edit. See `NAV_CHORD_PREFIX` and `navKeyHint` below.
 *
 * PURE: data + active-state math only, no JSX. The shell renders these; the
 * invariants are unit-verified in nav-model.test.ts.
 */

export type NavZone = "home";

export type NavItemDef = {
  to: string;
  label: string;
  /** Narrative zone the row belongs to. Every row is "home" now — kept as a
   *  field rather than removed so a future door has somewhere to say it is
   *  not, the way the loop rows once did. */
  zone: NavZone;
  /** One-line "what happens here / why" — rail subtitle + reusable stage USP. */
  tagline: string;
  search?: Record<string, string>;
};

/**
 * The three primary destinations: Start (the composer and your open runs),
 * Run (the run you are standing in — a door the rail only draws while one is
 * live, but the keyboard and the shortcut sheet still need its identity to
 * bind a key to), and Settings (folded in from the old footer so "three
 * doors" is a fact about this list too, not just the rendered rail).
 *
 * `to: "/track"` IS NOT A ROUTE. It is Run's identity for ownership and
 * keybinding lookups, the same convention `AppFrame.tsx`'s old `START_PATHS`
 * already used for the same prefix. The rail resolves the real destination —
 * `/track/$trackId` for whichever track is live — at render time; nothing
 * here ever navigates a person to the bare string.
 */
export const PRIMARY_NAV: readonly NavItemDef[] = [
  {
    to: "/start",
    label: "Start",
    zone: "home",
    tagline: "Hand work over, watch it run.",
  },
  {
    to: "/track",
    label: "Run",
    zone: "home",
    tagline: "The run you are standing in.",
  },
  {
    to: "/settings",
    label: "Settings",
    zone: "home",
    tagline: "Account, workspace, connections, keys, billing.",
  },
];

/**
 * GO, THEN THE LETTER. The prefix every navigation shortcut begins with.
 *
 * FOUNDER RULING 2026-08-05: a bare key shares a namespace with in-page
 * actions (`a` is Approve on every gate, `r` is Reject), so navigation kept
 * losing that contest. A prefix removes it instead of adjudicating it — `r`
 * alone still rejects, `g` then `r` opens Run. This is the pattern Gmail,
 * Linear, GitHub, Jira and Superhuman already use.
 */
export const NAV_CHORD_PREFIX = "g";

/** Derived: the displayed key hint AND the GotoShortcuts binding, both from
 *  this one function (never hand-copied). Returns the SECOND key of the
 *  chord; the prefix above is always the first.
 *
 *  THE LETTER RULE, UNCHANGED: each door takes a letter that appears in its
 *  own visible label. "Start" and "Settings" both start with S, so Start
 *  takes the `t` two letters in; Run keeps its own first letter, freed by
 *  the prefix the same way it always was.
 *
 *  Nothing here returns a digit. If a future door needs a key and every
 *  useful letter is taken, add a second chord (`g` then two letters) rather
 *  than reaching for a number. */
export function navKeyHint(item: NavItemDef): string {
  switch (item.to) {
    case "/start":
      return "t"; // sTart; `s` is Settings
    case "/track":
      return "r"; // Run's own first letter
    case "/settings":
      return "s";
    case "/admin":
      /**
       * NO KEY. AppFrame renders no `/admin` control anywhere: there is no
       * `amIAdmin` query and no link in the rail or its foot. A key here
       * would be a key that goes somewhere the rail cannot follow, which is
       * precisely the defect `AppFrame.rail-covers-keys.test.ts` exists to
       * catch, and it caught this before this file was ever three doors.
       */
      return "";
    default:
      // A door with no letter draws no keycap. Never a digit: see above.
      return "";
  }
}

/**
 * Footer rows. Settings moved into `PRIMARY_NAV` in P-11 so "three doors" is
 * true of the whole model, not just the rendered rail; only Admin is left
 * here. Admin renders ONLY for actual admins (the shell gates it with its
 * existing amIAdmin query, when it has one — see `navKeyHint`'s `/admin`
 * case for the standing gap).
 */
export const FOOTER_NAV: readonly NavItemDef[] = [
  {
    to: "/admin",
    label: "Admin console",
    zone: "home",
    tagline: "Platform administration.",
  },
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
