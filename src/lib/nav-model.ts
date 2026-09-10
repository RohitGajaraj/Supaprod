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
 * their doors. `/outcomes`, `/threads`, `/engine-room` and `/inbox` all stay
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
/*
 * ── NINE DOORS, AND WHY THE COUNT WENT UP AGAIN (P-60, R-38) ─────────────
 *
 * This list was cut to three in P-11, and the reasoning above it is still the
 * best argument in this file: a row is worth eight of the most expensive pixels
 * in the product, and a second door onto a surface another one already owns is
 * the "two doors, one question" defect.
 *
 * IT WAS TRUE WHEN IT WAS WRITTEN AND IT IS NOT TRUE NOW, for the case it leans
 * hardest on. That paragraph says Approvals "folded into Start's own board", so
 * its row was a duplicate. `/inbox` is a full surface again -- its own
 * heading, its own queue, its own settled trail, walked live on 2026-09-03 -- so
 * the fold it describes no longer describes the product, and the row it removed
 * is now the only way in that does not require typing a URL.
 *
 * PLATFORM-AUDIT.md §1 counted the result: seven surfaces reachable only by URL,
 * a contextual link, or the live line. R-38: a surface without a door is not
 * shipped.
 *
 * SO THE RULE THAT REPLACED "AS FEW ROWS AS POSSIBLE" IS NOT "AS MANY AS WE
 * HAVE": every row is one of the PERSON'S questions, in their words, and a
 * surface that is not an answer to one does not get a row. That is why the
 * seven stations stay out (R-01: they are the route the work takes, not places
 * a person goes) and why the engine room is reached from Crew and spend rather
 * than standing beside it.
 *
 *
 * ── ONE WORD, BECAUSE THE FOUNDER RULED IT (2026-09-01) ────────────────
 * "This is not an enterprise-grade naming ceremony. It has to be one single
 * verb... Don't put the sentence as the name of the shell."
 *
 * P-60 named these doors as the person's questions -- "Waiting on you",
 * "What came in", "Crew and spend" -- which is the right INSTINCT and the
 * wrong slot: that ruling is exactly about not putting the sentence on the
 * rail. The question lives in the tagline, which is the rail's subtitle, and
 * the label is one word. "Crew" is also on the retired list in
 * `the-rail-says-words-a-person-would-say.test.ts`, so that door is Team.
 *
 * THE LETTER RULE STILL HOLDS: every key is a letter in its own visible label,
 * and `navKeyHint` below is still the single source for both the drawn keycap
 * and the binding. Nine doors, nine distinct letters, no digits.
 */
export const PRIMARY_NAV: readonly NavItemDef[] = [
  {
    to: "/start",
    label: "Home",
    zone: "home",
    tagline: "Say what should change, and watch it run.",
  },
  {
    to: "/inbox",
    label: "Inbox",
    zone: "home",
    tagline: "Everything that cannot move until you answer it.",
  },
  {
    to: "/evidence",
    label: "Evidence",
    zone: "home",
    tagline: "What came in from your sources since you last looked.",
  },
  {
    to: "/outcomes",
    label: "Outcomes",
    zone: "home",
    tagline: "Every decision, what it predicted, and what happened.",
  },
  {
    to: "/team",
    label: "Team",
    zone: "home",
    tagline: "Who is working, what they cost, and their limits.",
  },
  {
    to: "/sources",
    label: "Sources",
    zone: "home",
    tagline: "What your agents are allowed to read.",
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
      return "h"; // Home
    case "/inbox":
      return "i"; // Inbox
    case "/evidence":
      /* `e` for Evidence, and it is free: h i f o m u s were the taken set and
         `f` left with the old label. The rule this file states is that a key is
         a letter of the label a person can SEE, so a rename moves the key with
         it -- a `g f` that opens a row reading "Evidence" is a shortcut nobody
         can derive and nobody will remember. */
      return "e"; // Evidence
    case "/outcomes":
      return "o"; // Outcomes
    case "/team":
      return "m"; // teaM
    case "/sources":
      return "u"; // soUrces; `s` is Settings
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
