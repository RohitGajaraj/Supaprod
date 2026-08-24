import { PRIMARY_NAV, FOOTER_NAV, navKeyHint, NAV_CHORD_PREFIX } from "@/lib/nav-model";

/**
 * WHAT EVERY KEY IN THIS PRODUCT DOES, IN ONE PLACE.
 *
 * WHY THIS FILE HAD TO EXIST. A 37-agent audit read every binding in `src/`
 * against every hint drawn on screen, and the headline was not any single bug:
 * it was that NOTHING IN THE REPO KNOWS WHAT KEYS A SURFACE BINDS. Twenty-six
 * files register their own `keydown` listener, each comparing `e.key` against
 * string literals inside a `useEffect`. There was no list. There was no way to
 * ask. So a person had no way to ask either, and neither did a test.
 *
 * The consequences were not theoretical, and every one of them was found:
 *   - `Cmd+R` to reload DECLINED the focused approval, because /approvals was
 *     the one gate surface that forgot the modifier guard the others carry.
 *   - `g` then `d` walked you to Discover and rejected the call behind you.
 *   - The Settings gear promised "shortcut s"; `s` alone is bound by nothing.
 *   - /runs drew a Cmd chord on a button the key could not reach.
 *   - Seven live bindings were drawn nowhere at all.
 * Each was a separate accident. They have one cause, and this is it.
 *
 * WHAT THIS IS, AND WHAT IT IS DELIBERATELY NOT. It is a DECLARATION of the
 * keyboard, sufficient to render a help sheet a person can read. It is not yet
 * the listener: the surfaces still bind their own keys, and the audit's full
 * recommendation -- a `useSurfaceKeys` hook that registers the listener, holds
 * the shared guards in one place, and feeds the keycaps -- is the refactor this
 * file is the first half of. That refactor changes behaviour on four gate
 * surfaces and is not a thing to do in the same hour as a help sheet.
 *
 * SO WHAT STOPS IT BECOMING FICTION. `key-model.test.ts`, which reads the route
 * files and checks BOTH directions: every key declared here is really compared
 * against in that file, and every bare key really compared against in those
 * files is declared here. A registry that can drift from the code is worse than
 * no registry, because it is believed. This one cannot drift silently.
 */

/** One key, and the honest sentence about what pressing it does. */
export type SurfaceKey = {
  /** Exactly what a person presses. Drawn verbatim on the keycap. */
  key: string;
  /**
   * What it does, written as the verb it performs on the thing in front of
   * you. Not a label: "Approve" names a button, "approves the call in front of
   * you" answers what happens, which is the question a help sheet is for.
   */
  does: string;
  /**
   * True when pressing it commits something a person cannot take back, or
   * spends their money. The sheet marks these, because the whole reason to
   * read a shortcut list before using it is to find out which keys bite.
   */
  destructive?: boolean;
};

/** A surface, its route path, and the keys it binds while you stand on it. */
export type SurfaceKeys = {
  /** The path as the router knows it, matched by `surfaceKeysFor`. */
  path: string;
  /** What the sheet calls it: the rail's or the strip's own word. */
  label: string;
  /**
   * The file that actually registers the listener. The drift test reads this,
   * so it is load-bearing rather than documentation, and a moved file breaks
   * the test rather than quietly orphaning the entry.
   */
  source: string;
  keys: SurfaceKey[];
};

/**
 * THE SURFACES THAT HAVE A KEYBOARD, and the ones that do not are not listed
 * rather than listed empty. The audit found /design and /crew both run gate
 * queues -- both say "the next takes its place" over an Approve/Decline pair,
 * both use the same `Gate` primitive as /today -- with no keys bound at all.
 * Adding them here before they are bound would be inventing a keyboard, so
 * they are absent, and their absence in the sheet is the true answer.
 *
 * ORDERED as the rail and the strip order them, so the sheet reads in the
 * product's own order rather than alphabetically.
 */
export const SURFACE_KEYS: readonly SurfaceKeys[] = [
  {
    path: "/today",
    label: "Today",
    /* THE COMPONENT, NOT THE ROUTE, and for the reason this whole file exists.
       Today's decisions are drawn by `DecisionQueue`, which is also where the
       listener lives, so the keycap and the binding it promises sit in one
       file where a reviewer sees both at once. Splitting them was how the
       product shipped a keycap for a key that fired nothing. /discover is
       already declared against its component for the same reason. */
    source: "src/components/today/DecisionQueue.tsx",
    keys: [
      { key: "j", does: "Moves to the next decision in the queue." },
      { key: "k", does: "Moves back to the previous one." },
      { key: "a", does: "Approves the call in front of you.", destructive: true },
      { key: "d", does: "Declines it.", destructive: true },
      { key: "z", does: "Snoozes it until later." },
    ],
  },
  {
    path: "/approvals",
    label: "Approvals",
    source: "src/routes/_authenticated.approvals.tsx",
    keys: [
      { key: "j", does: "Moves to the next call in the queue." },
      { key: "k", does: "Moves back to the previous one." },
      { key: "a", does: "Approves the focused call.", destructive: true },
      { key: "d", does: "Declines it.", destructive: true },
      { key: "z", does: "Snoozes it until later." },
    ],
  },
  {
    path: "/discover",
    label: "Discover",
    source: "src/components/discover/DiscoverSurface.tsx",
    keys: [
      { key: "j", does: "Moves down the ranking." },
      { key: "k", does: "Moves up it." },
      { key: "a", does: "Accepts the focused cluster as a bet.", destructive: true },
      { key: "m", does: "Merges it into a bet you already have.", destructive: true },
      { key: "d", does: "Declines it, so it is not a pattern.", destructive: true },
    ],
  },
  {
    path: "/decide",
    label: "Decide",
    source: "src/routes/_authenticated.decide.tsx",
    keys: [
      { key: "a", does: "Keeps the bet, and drafts its spec.", destructive: true },
      { key: "j", does: "Walks the ranking to the next bet under the question." },
      { key: "k", does: "Walks the ranking back one bet." },
      { key: "z", does: "Sends the bet under the question to Backlog." },
      {
        key: "c",
        does: "Sends the Critic to challenge it. This spends credits.",
        destructive: true,
      },
      { key: "d", does: "Drops it.", destructive: true },
    ],
  },
  {
    path: "/design",
    label: "Design",
    source: "src/routes/_authenticated.design.tsx",
    keys: [
      { key: "a", does: "Approves the brand rule the crew is asking about.", destructive: true },
      { key: "d", does: "Declines it, so it binds nothing.", destructive: true },
    ],
  },
  {
    path: "/crew",
    // "Agents" since 2026-08-15, matching the rail, the command palette and
    // Settings. This label is what the keyboard-shortcut sheet prints, so a
    // stale word here sends someone looking for a screen by a name the product
    // no longer uses. The path stays `/crew`.
    label: "Agents",
    source: "src/routes/_authenticated.crew.tsx",
    keys: [
      { key: "a", does: "Gives the agent the room it asked for.", destructive: true },
      { key: "d", does: "Says not yet, and it keeps today's limits.", destructive: true },
    ],
  },
  {
    path: "/plan/spec/$id",
    label: "A spec",
    source: "src/routes/_authenticated.plan.spec.$id.tsx",
    keys: [{ key: "⌘S", does: "Saves your edits." }],
  },
  {
    path: "/runs",
    label: "Runs",
    source: "src/routes/_authenticated.runs.index.tsx",
    keys: [{ key: "⌘↵", does: "Starts the run, from inside the box.", destructive: true }],
  },
  {
    path: "/runs/$missionId",
    label: "One run",
    source: "src/routes/_authenticated.runs.$missionId.tsx",
    keys: [{ key: "⌘↵", does: "Sends your note to the agent that is working." }],
  },
];

/**
 * The surface you are standing on, or null.
 *
 * Matches the LONGEST declared path that the current path sits under, so
 * `/runs/abc123` resolves to the single-run entry rather than the board. A bare
 * prefix match in declaration order would have given /runs both times, which is
 * the same class of mistake `railOwnerOf` in AppFrame documents fixing.
 *
 * `$param` segments match any single segment, which is how the router reads
 * them; matching them literally would mean no real URL ever resolved.
 */
export function surfaceKeysFor(path: string): SurfaceKeys | null {
  let best: SurfaceKeys | null = null;
  for (const surface of SURFACE_KEYS) {
    if (!pathMatches(path, surface.path)) continue;
    if (!best || surface.path.length > best.path.length) best = surface;
  }
  return best;
}

/** PURE. Does `path` sit on or under `pattern`, treating `$x` as a wildcard? */
function pathMatches(path: string, pattern: string): boolean {
  const a = path.split("/").filter(Boolean);
  const b = pattern.split("/").filter(Boolean);
  if (a.length < b.length) return false;
  return b.every((seg, i) => seg.startsWith("$") || seg === a[i]);
}

/**
 * THE THIRTEEN CHORDS, DERIVED AND NEVER TYPED.
 *
 * The DERIVATION LAW in nav-model.ts says the palette rows, the drawn hints and
 * the live bindings all come from `navKeyHint` so the shown key and the bound
 * key cannot drift. The help sheet is a fourth reader of that same fact and
 * obeys the same law: a door with no letter is dropped rather than given an
 * invented one, which is how `/admin` correctly stays out.
 */
export function navChords(): Array<{ label: string; keys: string; to: string }> {
  return [...PRIMARY_NAV, ...FOOTER_NAV]
    .map((door) => ({ door, hint: navKeyHint(door) }))
    .filter(({ hint }) => hint !== "")
    .map(({ door, hint }) => ({
      label: door.label,
      keys: `${NAV_CHORD_PREFIX} ${hint}`,
      to: door.to,
    }));
}

/**
 * The keys that work wherever you are.
 *
 * `Escape` is stated as "the innermost thing" rather than "this pane", because
 * that is the rule the shell is being held to and a help sheet that describes
 * the intended behaviour of a bug is worse than silence.
 */
export const GLOBAL_KEYS: readonly SurfaceKey[] = [
  { key: "⌘K", does: "Opens Ask, wherever you are. Press it again to close it." },
  { key: `${NAV_CHORD_PREFIX} ·`, does: "Hold to see every door's letter, then press one to go." },
  { key: "Esc", does: "Closes the innermost thing that is open." },
  { key: "?", does: "Opens this sheet." },
];

/**
 * The rules, one line each, and every one of them true today.
 *
 * The audit's draft carried a fourth line, "no digits anywhere", and it had to
 * be cut because it was FALSE: /discover bound 1, 2 and 3 to promote, merge and
 * decline, directly above a ranking whose rows are numbered 1 to 6, so pressing
 * `3` to pick the third row declined the first.
 *
 * That was fixed rather than tolerated -- they are `a`, `m` and `d` now -- so
 * the claim is true and is made. `key-model.test.ts` enforces it from the other
 * side: no surface may bind a digit, and the moment one does the test fails
 * instead of this sentence quietly becoming a lie.
 */
export const KEYBOARD_RULES: readonly string[] = [
  "A bare letter acts on the thing in front of you.",
  `Press ${NAV_CHORD_PREFIX}, let go, then a letter to move somewhere. Never a number.`,
  "A key that would commit something you cannot undo is marked below.",
];
