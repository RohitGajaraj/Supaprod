/**
 * AppFrame - the one shell. Step 2 of the rebuild.
 *
 * Four regions and not eight (decided, session-handoff.md "What is decided"):
 *   header 56  ·  rail 236/64  ·  work  ·  Ask summoned
 *
 * It replaces AppShell.tsx, MissionShellView.tsx and RoomChrome.tsx. The
 * disease the rebuild is treating was three shells and a hardcoded pathname
 * list in _authenticated.tsx choosing between them, so this component takes
 * no "which shell" argument and has no per-route branch.
 *
 * Anatomy: PROTOTYPE-v2.html. Styles: src/styles/shell.css. Tokens:
 * src/styles/ink.css. Nothing here carries a literal colour or size.
 *
 * ==================================================================
 * THE SEVEN QUESTIONS (SURFACE-JUSTIFICATION.md), answered for the
 * chrome. Re-answered 2026-07-30 after the founder's complaint:
 *
 *   "In our current prototype, on top we have a number of agents
 *    running, there is a status bar, all those things. So those
 *    things are getting missed as of now."
 *
 * He was right and it was measurable: this file rendered ZERO agent
 * marks. The live line was a coloured dot and a sentence. The product
 * claims agents do the work, and the most-seen surface in it showed
 * none of them.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    Nobody comes to the chrome. It is what a person reads on the way
 *    to somewhere else, roughly once a minute, all day. So it owes
 *    them one thing on arrival: is anything happening, and does any
 *    of it involve me. Anything beyond that is furniture asking to be
 *    read, and the header is the worst place in the product to put a
 *    thing that has to be read.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE.
 *    Knowing what the workspace is doing without going to look. The
 *    live line is the whole answer; the brand, the scope, the rail
 *    and Ask are doors, not information.
 *
 * 3. KEEP / MOVE / KILL.
 *    KEEP  brand, scope, rail, Ask, the account disc. All doors, each
 *          one the only route to somewhere.
 *    KEEP  the live line's fact grammar: lead, then two facts that
 *          drop at 1100 and 860 rather than truncating, so what
 *          remains is always a whole true statement.
 *    NEW   the agent marks. The prototype's #liveRun draws three
 *          overlapping marks before it says "3 agents are working",
 *          and that ordering is the point: WHO first, count second.
 *          This is the founder's complaint, and it is the only thing
 *          the chrome was genuinely missing.
 *          AMENDED 2026-08-25, by a later founder direction: the crew
 *          reads as ONE character (SPEC-PRESENCE.md), so the roster of
 *          seat silhouettes left this header — an org chart, ruled out
 *          of the experience. The who-slot now draws that worker's own
 *          face in the state the shell's rows prove; the lead sentence
 *          keeps saying WHO is working, in words.
 *    KILL  the run chip the prototype's run screen carries ("Run 41").
 *          Three reasons, and any one of them is enough. The run's
 *          identity is already the page headline AND the seven-stage
 *          strip immediately under this header, so a chip is the
 *          third statement of the same fact inside 100 pixels (hard
 *          ban 10). It would need a per-route branch or a second
 *          publish channel, and "no per-route branch" is the disease
 *          this file was written to cure. And the app has no run
 *          NUMBER: a mission is a uuid with a title, so the chip
 *          could only be drawn by inventing a sequence, which is the
 *          one thing never allowed.
 *    KILL  the chevron the prototype puts at the end of the run
 *          screen's live line. It meant "this collapses the strip",
 *          and the founder ruled on 2026-07-29 that the strip is
 *          permanent. An affordance for an action that no longer
 *          exists is worse than no affordance.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE.
 *    Everything. Off a run the live line IS the click, to /runs. The
 *    count of things waiting on you stays in the rail as a hot number
 *    beside Today rather than being spelled out here twice.
 *
 * 5. WHAT WOULD DELIGHT, AND WHAT WOULD CONFUSE.
 *    The moment: you glance up and see Engineer's own silhouette
 *    turning, in the Build hue, and the header says "Engineer is
 *    working". The machine has a face and it is at work. What would
 *    confuse, and is refused: a mark for an agent we cannot name.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    Here, permanently, which is the strongest available answer:
 *    remove the agents and this header has nothing to say. Attribution
 *    is a drawn silhouette per worker, not a word. Work in motion is
 *    visible while it happens and stops the moment it does. Nothing
 *    overclaims: see the honesty rule below.
 *
 * 7. WOULD A STRANGER RECOGNISE WHAT THEY ARE LOOKING AT?
 *    IDENTITY, AND IT IS DRAWN. Thirteen silhouettes (agent-glyphs),
 *    shape saying which agent and hue saying which of the seven loop
 *    stages, so a stranger learns the encoding here and reads it
 *    everywhere else. SCANNING PATH: the marks win, because they are
 *    the only drawn thing in a line of words and the only coloured
 *    thing in a monochrome header. THE EMPTIEST REALISTIC STATE is
 *    the one most users see most of the time: nothing running. It
 *    reads "Nothing running", in a quiet grey dot, with the last
 *    finished run named beside it. Calm, and unmistakably not broken:
 *    a header that reported nothing at all would look broken, and one
 *    that invented activity would be lying. A brand-new workspace
 *    with no history at all drops the trailing facts and says
 *    "Nothing running" on its own, which is true on day one.
 *
 * THE HONESTY RULE, and it is the whole reason this is not simply
 * "draw a mark per running mission". `missions.current_agent_id` is a
 * UUID, not a slug (run-state.ts records the same finding), so the
 * catalog cannot name it and a raw uuid fed to agentDisplayName would
 * be title-cased onto the screen. So the shell resolves the uuid
 * through the account's own roster, and draws:
 *   · a NAMED agent's own silhouette where the roster resolves it;
 *   · the generic circle labelled "The crew" where it does not, which
 *     is the fallback the Build surface already uses. Unspecific and
 *     true beats specific and invented.
 * And the LEAD only counts agents when every running run resolved.
 * The moment one did not, it counts runs instead, because the number
 * of agents is then unknown and a header may not guess.
 *
 * COLOUR, and ONE BLINK. A working mark takes its stage hue. A mark
 * waiting on you takes ember, in the `waiting` state and never `gate`:
 * `gate` blinks, exactly one thing in the product may blink, and that
 * one thing is the call actually in front of you on Today or on
 * /approvals, never a persistent header that is mounted beside it. A
 * chrome with nothing happening stays monochrome.
 * ==================================================================
 */

import { RailCrew } from "@/components/shell/RailCrew";
import { TeammateCursors } from "@/components/shell/TeammateCursors";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";
import { REVIEW_QUEUE_SEARCH } from "@/components/shell/post-auth-home";
import { pollMs } from "@/components/shell/poll";
import * as React from "react";
import { missionsKey } from "@/lib/query-keys";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { sessionEndedMessage } from "@/lib/error-copy";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { useWorkspace } from "@/hooks/use-workspace";
import { CharacterMark } from "@/components/presence/Character";
import { deriveRailPresence } from "./rail-presence";
import { GLYPH_FOR_STATION, StationGlyph } from "@/components/meridian/station-glyphs";
import { RunStripProvider, STAGE_LABEL, STATION_ROUTE, type RunStripSpec } from "./run-strip";
import { SessionEndedProvider } from "./session-ended";
import { agentDisplayName, agentStation } from "@/lib/agent-vocabulary";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { supabase } from "@/integrations/supabase/client";
import { listMissions } from "@/lib/missions.functions";
import { listAgents } from "@/lib/agents.functions";
import { listCrew } from "@/lib/crew.functions";
import { listMovingTracks, listTracks, listGatesOnTracks } from "@/lib/spine/track.functions";
import { initialsFrom } from "@/lib/initials";
import { useTheme } from "@/hooks/use-theme";
import { FOOTER_NAV, PRIMARY_NAV, navKeyHint, NAV_CHORD_PREFIX } from "@/lib/nav-model";
import { BoardPanel } from "./BoardPanel";
import { RailPhoneBar } from "./RailPhoneBar";
import { ShortcutSheet, useShortcutSheetKey } from "./ShortcutSheet";
import { AccountMenu, ScopeMenu } from "./ScopeMenu";
import { SampleBanner } from "@/components/meridian/SampleBanner";
import { AuditLineageSheet } from "@/components/supaprod/AuditLineageSheet";
import { FindAnything } from "./FindAnything";
import { genuinelyWorkingMissions } from "./genuinely-working";
import {
  IconAsk,
  IconBoard,
  IconGear,
  IconKeyboard,
  IconMoon,
  IconPlus,
  IconRailCollapse,
  IconRailExpand,
  IconArrived,
  IconBrain,
  IconCrew,
  IconSources,
  IconSun,
  IconWaiting,
  IconWork,
} from "./icons";

/**
 * THE SEVEN STATIONS THE RAIL STANDS FOR WITHOUT DRAWING.
 *
 * Taken from the strip's own station -> route map rather than typed here, so
 * the rail and the strip cannot disagree about what a station is. If Build's
 * engine moves again (it has moved once: /runs -> /build, see run-strip.tsx),
 * the row that stays lit for it moves in the same edit.
 */
const LOOP_STATIONS: readonly string[] = Object.values(STATION_ROUTE);

/** A row that stands for nothing but itself. Named rather than repeated so an
 *  empty `owns` reads as a decision instead of an oversight. */
const OWNS_NOTHING: readonly string[] = [];

/** Boundary (autonomy management) is reached from Agents, so it belongs to
 *  whichever control Agents belongs to. Since 2026-08-15 that is the Settings
 *  door in the rail foot rather than a row. */
const BOUNDARY_PATHS: readonly string[] = ["/boundary"];

/**
 * THE START ROW'S TERRITORY (P-11, A-QUEUE.md, 2026-09-02 — the rail's third
 * rewrite; see `RAIL` below for the ruling that cut it to two rows).
 *
 * "/start" is redundant with the row's own `to` and named anyway, matching
 * the convention every earlier version of this list used. "/runs" is
 * `/runs/$missionId`, a run screen; the bare `/runs` index P-10 deleted no
 * longer exists to own. The loop stations join for the same reason they
 * always have — R-01: a station is the step list INSIDE one run, and this row
 * owns the run, so a station surface is its territory. "/track" is
 * deliberately NOT here: that identity now belongs to the Run row below, and
 * `railOwnerOf`'s own-`to` pass resolves it before ever consulting this list.
 */
const START_PATHS: readonly string[] = ["/start", "/runs", "/track", ...LOOP_STATIONS];

/** Paths that live behind the Settings door but are not under /settings.
 *  Agents is the roster at /crew, which Settings now holds. */
const SETTINGS_PATHS: readonly string[] = ["/crew"];

/*
 * ── TWO ROWS, RULED 2026-09-02 (P-11, A-QUEUE.md) ───────────────────────
 *
 * The rail was five rows (Today, Brain, Threads, Engine Room, the derived
 * Work row), then four (2026-08-15), then one primary plus four secondary
 * (2026-08-31, F-144/145/146). The founder's brief on 2026-09-02 finishes
 * that arc: **Start · Run · Settings**. Settings was already an icon at the
 * foot rather than a row (see `settingsOwns` below) and stays there — the
 * count that changes here is the ROW count, five down to two.
 *
 * WHAT LEFT, AND WHY EACH IS SAFE TO LEAVE REACHABLE-BY-URL-ONLY: Approvals
 * (`/today`) folded into Start's own board months ago — its row was a second
 * door onto a surface Start already owns, exactly the "two doors, one
 * question" defect this whole mission has been closing. Insights (`/brain`),
 * Threads (`/threads`) and Policies (`/engine-room`) are all named in P-11's
 * own "not in scope" line: real surfaces, kept, just no longer advertised in
 * the eight most expensive pixels in the product. None of the four are
 * deleted; deleting them is P-14's and P-17's call, not this packet's.
 *
 * RUN IS NEW, AND IT IS THE ONE ROW THAT DOES NOT DRAW UNCONDITIONALLY. It
 * answers "where am I", not "where can I go" — so it only exists while there
 * is a where. Its destination field below is an IDENTITY, the same convention
 * the old `START_PATHS` used for this exact prefix: it is what `railOwnerOf`
 * and `doorKey` key on, never a literal navigation target. The render below
 * resolves the real destination, `/track/$trackId` for whichever track is
 * live, and drops the row from the list entirely when none is.
 */
/*
 * ── STATION ID -> ITS MARK ──────────────────────────────────────────────
 *
 * The internal ids are NOT the words on screen, and this is the seam where
 * that bites. `sense` is displayed as Discover and `define` as Plan — founder
 * ruling 2026-08-01, which changed the display names and deliberately kept the
 * ids stable so no migration was needed. Meridian's glyph set is named after
 * what a reader calls the station, because it is a generic design system and
 * has never heard of `sense`.
 *
 * EXPLICIT, NOT DERIVED FROM THE LABEL. Lowercasing `STAGE_LABEL` would work
 * today and would silently break the first time somebody improves a label —
 * copy changes, and a drawing should not vanish because a word did.
 *
 * `Record<AgentStation, …>` rather than a partial map, so adding an eighth
 * station to the vocabulary fails the build HERE until somebody draws it,
 * instead of shipping one chip with an empty corner.
 */
const STATION_MARK = GLYPH_FOR_STATION;

const RAIL = [
  /*
   * ── SIX ROWS IN TWO TIERS (Lane 1, 2026-09-08) ────────────────────────
   *
   * Founder, 2026-09-08: "rename, merge, split or delete surfaces so
   * structure matches how a user thinks. Plain language, no jargon." Eight
   * rows read as a list of nouns. These are the person's four questions, in
   * the order they ask them, then the two things they set up once:
   *
   *   Home       what should it do next, and where is everything
   *   Inbox      what needs me (the only counted row)
   *   Findings   what came in from my sources
   *   Outcomes   what happened to what we decided
   *   ---
   *   Team       who does the work, and their limits
   *   Sources    what they are allowed to read
   *
   * WHAT LEFT. "Run" pointed at one specific run, which the home's rows and
   * the header's live line already open; a row that is a shortcut to a list
   * item is not a place. "Conversations" is Ask's own history and is reached
   * from Ask (AskSwitcher) and Find; the route stays. "Start", "Waiting" and
   * "Arriving" are renamed: "Start" is a verb on a page that is the home,
   * "Waiting" did not say waiting for what, and "Arriving" named the machine's
   * motion rather than what the person gets.
   *
   * THE FIRST ROW IS STILL DERIVED (F-144): it names `SIGNED_IN_HOME`, so a
   * future flip of the home moves this row in the same edit. The colocated
   * guard `AppFrame.rail-covers-keys.test.ts` reads this block as SOURCE.
   */
  {
    to: SIGNED_IN_HOME,
    label: "Home",
    Icon: IconWork,
    count: null,
    owns: START_PATHS,
    tier: "primary",
  },
  {
    to: "/approvals",
    label: "Inbox",
    Icon: IconWaiting,
    /* THE ONLY COUNTED ROW, and it reads the gate count P-66 scoped to the
       workspace. Never a second query: a badge that counts differently from
       the page it opens is the defect P-56 spent a packet removing. */
    count: "gates",
    owns: OWNS_NOTHING,
    tier: "primary",
  },
  {
    to: "/arriving",
    label: "Findings",
    Icon: IconArrived,
    count: null,
    owns: OWNS_NOTHING,
    tier: "primary",
  },
  {
    to: "/outcomes",
    label: "Outcomes",
    Icon: IconBrain,
    count: null,
    owns: OWNS_NOTHING,
    tier: "primary",
  },
  {
    to: "/crew",
    label: "Team",
    Icon: IconCrew,
    count: null,
    owns: OWNS_NOTHING,
    tier: "setup",
  },
  {
    to: "/sync",
    label: "Sources",
    Icon: IconSources,
    count: null,
    owns: OWNS_NOTHING,
    tier: "setup",
  },
] as const;

/*
 * ONE LITERAL — and the colocated guards are the reason.
 * `AppFrame.rail-covers-keys.test.ts` and the nav-model suite read this block
 * out of the SOURCE TEXT, by finding `const RAIL = [` and slicing to `] as
 * const;`. `tier` is kept as a field on each row rather than deleted with the
 * old secondary tier, so a future row can rejoin the secondary group without
 * reshaping every row that came before it; both rows are "primary" today
 * because there is no secondary group left to put anything in.
 */

/** True when `path` is `base` or lives underneath it, so /runs/<id> and
 *  /plan/spec/<id> keep the row that owns them lit. The same shape as
 *  `engineRoomActive` in nav-model.ts, deliberately: one rule for "inside". */
function under(path: string, base: string): boolean {
  return path === base || path.startsWith(base + "/");
}

/**
 * THE SETTINGS DOOR'S OWN TERRITORY, which is not a rail row's.
 *
 * Agents moved inside Settings on 2026-08-15, so /crew and /boundary are now
 * behind the gear rather than behind a row. `railOwnerOf` deliberately only
 * answers for ROWS — returning a row for a path no row draws would have the
 * rail claim a place it cannot point at — so the foot needs its own answer and
 * this is it.
 *
 * Two tokens, the same pair the rows use: "page" is the door you are standing
 * on, "true" is the door whose territory contains you. A screen reader gets the
 * difference; both draw identically.
 *
 * Exported for the colocated guard, which is what stops the move quietly
 * costing `g c` its lit control.
 */
export function settingsOwns(path: string): "page" | "true" | undefined {
  if (under(path, "/settings")) return "page";
  for (const owned of [...SETTINGS_PATHS, ...BOUNDARY_PATHS]) {
    if (under(path, owned)) return "true";
  }
  return undefined;
}

/**
 * PURE - which rail row must be lit for this path.
 *
 * A row's OWN path wins over any other row's ownership claim, which is why
 * this is two passes and not one: Run's `to` is `/track`, an identity Start's
 * `owns` list does not repeat, so a `/track/:id` page resolves to Run in the
 * first pass rather than falling through to Start in the second.
 *
 * Exported for the colocated guard test, which is what stops a future binding
 * from landing somewhere the rail cannot follow.
 */
export function railOwnerOf(path: string): string | null {
  for (const row of RAIL) if (under(path, row.to)) return row.to;
  for (const row of RAIL) for (const owned of row.owns) if (under(path, owned)) return row.to;
  return null;
}

/* ==================================================================
 * THE TWELVE KEYS THAT FIRED AND WERE DRAWN NOWHERE.
 *
 * GotoShortcuts (components/supaprod/GotoShortcuts.tsx -- cite the symbol,
 * not a line: this pointer read CommandPalette.tsx:419 and was already wrong
 * by a hundred lines before that file was renamed) is mounted on every
 * authenticated surface except onboarding and Mission Control
 * (_authenticated.tsx:190), and it binds a bare key per destination
 * derived from `navKeyHint`. So today, on this shell, pressing 3
 * navigates to /plan. Nothing on screen has ever said so.
 *
 * The DERIVATION LAW in nav-model.ts says the palette JUMP rows, the
 * displayed hints and the bindings are all derived from one function
 * so the shown key and the bound key can never drift. The law was
 * intact and the only surviving consumer was the command palette,
 * which _authenticated.tsx documents as unmounted. A navigation layer
 * whose whole affordance lives inside an overlay nobody opens is a
 * capability with no door, which is this repo's signature defect.
 *
 * So the hint moves to where the door already is: the rail row. It is
 * DERIVED here too, by looking the row's own `to` up in the same
 * PRIMARY_NAV + FOOTER_NAV list `navKeyHint` governs, so a rebinding
 * changes the drawn keycap in the same edit. Nothing is hand-copied
 * and there is no second list.
 *
 * THE GAP THIS PARAGRAPH USED TO REPORT IS CLOSED (2026-08-06). It
 * read: "Seven more keys (1..7) fire at the loop stations, which have
 * no rail row; inventing rows for them is a nav change and the five
 * rows are decided. That gap is reported, not papered over." Both
 * halves have since moved. The keys are no longer digits (the chord
 * replaced them, see NAV_CHORD_PREFIX), and the founder read the
 * consequence off the screen before any test did: keycaps on Today,
 * Runs and the gate buttons, and nothing on Discover or Decide.
 *
 * It was closed WITHOUT relitigating the five rows, which is what the
 * old paragraph was really protecting. The seven stations get their
 * keycaps on the STRIP, where the seven stations already live. Two
 * controls, two altitudes, each drawing the keys it governs. See
 * `STATION_DOORS` below and the stage render in the strip.
 *
 * /runs and /crew now resolve to `r` and `c`; the sentence claiming
 * they "carry no binding at all" was written before the prefix freed
 * their own first letters. Every rail row draws a keycap today.
 * ================================================================== */

/** Every door the keyboard can reach, in one list, so the lookup below
 *  cannot silently miss the footer ones (Settings holds `s`). */
const KEYED_DOORS = [...PRIMARY_NAV, ...FOOTER_NAV];

/**
 * The key that is BOUND to this path today, or "" when nothing is.
 *
 * Derived, never typed: it reads the same `navKeyHint` GotoShortcuts reads,
 * off the same list, so the drawn keycap and the live binding are the same
 * fact read twice. A path the keyboard does not reach returns "" and draws
 * nothing, because a keycap that does nothing is a lie.
 */
function doorKey(to: string): string {
  const door = KEYED_DOORS.find((d) => d.to === to);
  return door ? navKeyHint(door) : "";
}

/** The rail, with each row's bound key resolved. Exported for the colocated
 *  test, which is what holds the derivation law on this surface. */
export const RAIL_DOORS: ReadonlyArray<{ to: string; label: string; key: string }> = RAIL.map(
  ({ to, label }) => ({ to, label, key: doorKey(to) }),
);

/** The footer door's key, derived the same way. Exported for the same test. */
export const SETTINGS_KEY = doorKey("/settings");

/**
 * THE SEVEN STATIONS, with each one's bound key resolved.
 *
 * The same shape and the same lookup as `RAIL_DOORS` above, because it is the
 * same question asked of the other control. The rail says which SECTION you are
 * in and the strip says which STATION, and until 2026-08-06 only the first of
 * the two drew the keys it was governed by.
 *
 * Exported for the colocated guard, which is the whole reason it exists as a
 * const rather than being computed inline in the render: the invariant worth
 * pinning is that ALL SEVEN resolve to a key. Six of seven would look correct
 * on screen -- one quiet chip among six annotated ones reads as a station that
 * simply has no shortcut -- and only a test that counts can tell the difference
 * between "this door has no key" and "this door lost its key".
 */
/*
 * ── A STATION CHIP DRAWS NO KEY, WHATEVER ITS ROUTE IS (P-60) ────────────
 *
 * This derived the key from the route, which worked only while no station's
 * route was also a rail door. P-60 made `/arriving` the door "What came in" and
 * `STATION_ROUTE` maps `sense` there, so the Discover chip silently inherited
 * `g i` -- a keycap on a chip that R-01 and F-146 deliberately made
 * non-interactive, promising a control that is not there.
 *
 * The station's keylessness is a fact about the CHIP, not about the route: the
 * same URL can be a person's door and a station's surface at once, and it is
 * the chip that must not claim a key. So it is stated rather than derived, and
 * the derivation that used to state it by accident cannot be broken again by
 * the next door that shares a route.
 */
export const STATION_DOORS: ReadonlyArray<{ station: string; to: string; key: string }> =
  Object.entries(STATION_ROUTE).map(([station, to]) => ({ station, to, key: "" }));

/**
 * The keycap, quiet.
 *
 * It is the shape primitives.css already draws for `.sp-btn kbd`, restated
 * here because this file owns the rail and a rail row is not a button: mono
 * at the keycap size, in a tint mixed out of the row's OWN colour.
 *
 * Taking the tint from `currentColor` is what makes it track the row for
 * free, with no state of its own to keep in sync: quiet on a resting row,
 * present on the one you are standing on. The tint is also what stops the key
 * being mistaken for a count, which matters on Today, the one rail row that
 * carries both. A bare "0" beside a bare "3" is a riddle; a "0" in a keycap
 * is a key.
 *
 * The text colour is left to `.sp-navcount`, deliberately. That is the
 * product's existing "quiet trailing text on a rail row" colour, and reusing
 * it means the hint sits at the same volume as the count rather than at a
 * volume invented here.
 *
 * Tokens only, no literal colour, per this file's standing rule. The two bare
 * numbers are the keycap's existing geometry in primitives.css, carried with
 * it so the two keycaps in the product stay the same object.
 */
const KEYCAP = {
  fontFamily: "var(--mrd-mono)",
  /* `--mrd-t-tiny` and NOT `--mrd-t-micro`, whose comment says "keycaps".
   * The retired `--sp-text-kbd` was 11px and so is `--mrd-t-tiny`; micro is
   * 10.5px. Two reasons the exact value wins over the nicer name here. The
   * paragraph above says the two keycaps in the product are one object, and
   * the other one -- `.sp-btn kbd` in primitives.css -- is still drawn at
   * `--sp-text-kbd`, so taking micro would split them by half a pixel for the
   * length of the port. And the design ratchet forbids shrinking type as the
   * answer to anything. If the button keycap moves to micro later, this moves
   * with it, and they are still one object. */
  fontSize: "var(--mrd-t-tiny)",
  // A kbd inherits weight, so the active row would otherwise render its
  // keycap at 600 and turn a hint into a heading.
  fontWeight: "var(--mrd-w-regular)",
  padding: "1px 4px",
  borderRadius: "var(--mrd-r-xs)",
  background: "color-mix(in oklab, currentColor 13%, transparent)",
  flex: "none",
} as React.CSSProperties;

const RAIL_KEY = "supaprod:rail-narrow";
/* The familiarity tracker that used to drive auto-collapse is gone with it
 * (2026-08-15). It wrote a list of visited stations to localStorage purely to
 * decide when to hide the rail's labels; nothing else ever read it. The stale
 * `supaprod:rail-visited` key is harmless and is not migrated — it simply
 * stops being written. */

/** What the shell needs off the account's roster: a uuid, and the slug the
 *  agent catalog can actually draw and name. `listAgents` selects the whole
 *  row; the shell reads two columns of it and nothing else. */
type RosterRow = { id: string; slug: string };

/** One drawable worker. `slug` null is the honest unknown: the generic circle
 *  glyph, labelled by `name`, never a fabricated identity. */
type Worker = { slug: string | null; name?: string | null };

/** The name for work whose worker we cannot resolve. Matches the Build
 *  surface (runs/run-state.ts), so the product says one thing everywhere. */
const CREW = "Your agents";

/** What "working" means for a mission, and it is not one string.
 *
 *  This line used to test `status === "running"` alone, and that is half the
 *  truth: `in_progress` is a real status a mission takes in production
 *  (recorded in ask-blocks.server.ts, and mission-advance.server.ts advances
 *  both), so a workspace with live work read as "Nothing running" in the
 *  chrome while every other surface showed it moving. Under-reporting your own
 *  workspace is the same class of error as inventing a count.
 *
 *  `queued` is deliberately NOT here. A queued run has nobody turning on it
 *  yet, and the live line's whole claim is that somebody is working. */
/**
 * A title as a person should read it, and never as the pipeline stored it.
 *
 * `[auto]` is `AUTO_TITLE_PREFIX` from `sensing/trigger.ts`, a dedup marker the
 * tick writes so it can find its own proposals. `stripAutoPrefix`'s own doc has
 * said "it must never reach the user, call this on ANY title that may have come
 * from the trigger pipeline" the whole time, and this header did not call it.
 * The founder has now reported the leak twice.
 *
 * The provenance itself is worth keeping, and `isAutoTitle`'s doc already
 * prescribed the shape: strip the prefix from the visible text, then show a
 * small chip. That reading is better than the raw prefix in both directions.
 * It is quieter, and it says something truer: the crew raised this by itself,
 * which is the product's whole argument rather than a piece of debris in a
 * string.
 */
function TitleFact({ title }: { title: string }) {
  const clean = stripAutoPrefix(title);
  return (
    <>
      {isAutoTitle(title) ? (
        <span className="sp-auto" title="Your agents raised this on their own">
          auto
        </span>
      ) : null}
      {clean}
    </>
  );
}

const WORKING = new Set(["running", "in_progress"]);

/** Fast enough to look alive while work moves, cheap enough to leave running. */
const LIVE_POLL_WORKING_MS = 4_000;
const LIVE_POLL_IDLE_MS = 20_000;

/**
 * How often the live line re-reads, given whether anything is actually moving
 * AND how the last read went.
 *
 * The cadence follows the strength of the claim being made: while a run is
 * working the header asserts something second by second and has to keep up;
 * idle, it is only waiting for work to appear.
 *
 * THE FAILURE COUNT WAS MISSING UNTIL 2026-08-27 and it is the expensive half.
 * This hook is mounted for the whole signed-in session, so against a backend
 * that was not answering it re-asked from every screen in the product, forever,
 * at the idle cadence. `pollMs` owns the backoff, the cap and the hidden-tab
 * pause; this function owns only the thing it alone knows, which is how fast
 * the underlying fact moves.
 */
function livePoll(anyWorking: boolean, failures: number): number | false {
  return pollMs(anyWorking ? LIVE_POLL_WORKING_MS : LIVE_POLL_IDLE_MS, failures);
}

/**
 * What the NEXT press does, not what the current state is.
 *
 * A control's label is a promise about the click. "Light" on a button that is
 * currently light tells you where you are, which the icon already does, and
 * leaves you guessing what pressing it will get you. The cycle is
 * light -> dark -> system, set by use-theme.tsx.
 */
// Two grounds, so the control names the one it will move you to. System
// preference was removed on 2026-08-14, which also fixed the old three-stop
// cycle where pressing this twice from dark did not return you to dark.
const THEME_TITLE: Record<"light" | "dark", string> = {
  light: "Switch to dark",
  dark: "Switch to light",
};

/** Plain-words relative time. Mono digits are applied by the caller. */
function since(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * ── "NEW WORK ITEM", THE FIRST OF THE THREE ─────────────────────────────
 *
 * Founder, reviewing the rail: it needs an action that starts a new piece of
 * work. It had none, on any surface reachable from the chrome.
 *
 * WHERE IT GOES, AND WHY IT IS A LINK RATHER THAN A HANDLER. `/runs` carries
 * the product's only real dispatcher: the "Hand work over" composer, with its
 * two doors (from a goal, from a spec) and the repo gate behind them. So this
 * is a door to the place work actually starts, and it is a real `<Link>` so
 * middle click, copy link address and open-in-new-tab all work — none of which
 * work on a button.
 *
 * WHAT IT DELIBERATELY IS NOT: a second Ask. The header already has Ask, on
 * Cmd+K, and Ask is a CONVERSATION. Wiring this to `openAsk()` would have made
 * two controls that do one thing, and the one labelled "New work item" would
 * open something that is not a new work item — the exact shape of lie this
 * file's own comments record twice (the Ask button that opened the palette, the
 * chevron that opened a navigation).
 *
 * THE HONEST LIMIT, stated rather than papered over: this lands you on /runs
 * with the composer as the second block on the page, not with the caret already
 * in it. Focusing it from here would mean reaching into another surface's DOM
 * with a loose selector, which is how a shell comes to depend on a page it does
 * not own. A `?compose` search param on the runs route is the right fix and it
 * belongs to that route.
 */
/*
 * ── RE-AIMED 2026-08-27, AND THE COMMENT ABOVE WAS TRUE WHEN IT WAS WRITTEN ──
 *
 * It said `/runs` carries "the product's only real dispatcher: the Hand work
 * over composer, with its two doors (from a goal, from a spec)". That composer
 * was 1,434 lines and the fold deleted it; `/runs` is a redirect to the board
 * now. So this control, labelled **New work item**, opened a LIST. That is the
 * precise lie the comment above warns about and this file records twice
 * already: a control that opens something which is not what it is named.
 *
 * The fold moved the content and nothing moved the door. Third one of these
 * tonight, and the pattern is worth naming: a redirect keeps every link
 * WORKING, which is what made the fold safe, and that is exactly why a link
 * whose *meaning* died goes unnoticed. Nothing 404s. It just quietly starts
 * lying.
 *
 * `/start` is where work begins: it creates a spine track and walks it, and 41
 * of the last 43 tracks in this workspace entered there. It is also where the
 * board's own composer sends a person (D2), so the two agree.
 *
 * Still a real `<Link>`, for the reason the original gave: middle click, copy
 * link address and open-in-new-tab all work, and none of them work on a button.
 */
function RailNew({ narrow }: { narrow: boolean }) {
  return (
    <Link
      to="/start"
      className="sp-new"
      /* Named out loud only when the label is not on screen, so a screen
         reader is never handed the same words twice. */
      aria-label={narrow ? "New work item" : undefined}
      title={narrow ? "New work item" : undefined}
    >
      <span className="sp-new-label">New work item</span>
      <IconPlus />
    </Link>
  );
}

/**
 * SEARCH, THE SECOND OF THE THREE. `FindAnything.tsx` -- its own header
 * explains the P-25 swap from this rail's former in-memory search
 * (`RailFind`, runs + destinations) to a server-backed search across every
 * artifact kind a track can hold.
 */

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  /**
   * The track this PAGE is standing on, or null -- narrowed by P-109 to what
   * it is actually for now: whether the rail's `owner`/`current` styling
   * should light Run up as the section you are in. It is no longer what
   * decides whether the Run row draws or where it points; `runDoor` below
   * answers both of those regardless of which page this is.
   */
  const trackId = /^\/track\/([^/]+)/.exec(pathname)?.[1] ?? null;
  /* Whether the surface below is the board, which states the gate count itself.
     Exact match, not `startsWith`: a child route of /today would be a different
     surface with its own claims, and inheriting this suppression would silence
     a fact nothing else is saying. */
  /*
   * ── THE GUARD WAS RIGHT AND ITS ADDRESS WENT STALE (2026-09-01) ─────────
   * Photographed on the front door, signed in: the top bar read "70 decisions
   * are ready for you" and the page headline 570px below read "70 decisions
   * are ready for your review." That is the exact duplication the comment at
   * the guard below describes, screenshotted on 2026-08-27 and fixed then --
   * and it is back, without anybody touching the guard.
   *
   * The board moved. `/today` now throws a redirect to `SIGNED_IN_HOME` and
   * `<Board />` renders on `/start`, so `pathname === "/today"` stopped being
   * true anywhere a reader can stand and the suppression stopped firing. The
   * logic never broke; the ADDRESS it names did.
   *
   * It names the constant now, so the next time home moves this follows it in
   * the same edit -- which is the rule the rail's own home link two hundred
   * lines up already states about `SIGNED_IN_HOME`. `/today` is kept for the
   * instant before its redirect resolves.
   */
  const onTheBoard = pathname === SIGNED_IN_HOME || pathname === "/today";
  const navigate = useNavigate();
  // Only the id. The NAME and the product moved to ScopeMenu, which owns the
  // scope control now; keeping a second copy here is how two headers drift.
  const { activeWorkspace, activeWorkspaceId, workspaces, setActiveWorkspaceId } = useWorkspace();
  /*
   * ── P-66: THE LIVE LINE READS THE WORKSPACE IT STANDS IN ────────────────
   *
   * Read live in an empty probe workspace: "1 decision is ready for you - What
   * we expected did not happen: Decline shipping ...". Both facts were Helio
   * Labs'. The three reads below named no workspace and neither did their query
   * keys, so the shell reported every open track the person could see anywhere
   * under the name of the one they were standing in.
   *
   * THE KEY CARRIES IT TOO, and that half is not cosmetic: without it, react-
   * query serves the previous workspace's answer from cache on the switch, so
   * the borrowed fact survives the fix that was supposed to remove it.
   */
  const wsKey = activeWorkspaceId ?? null;
  const wsArg = activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {};

  /* The first workspace this person has that is NOT a fixture, which is where
     the sample banner's return door goes. Undefined when they have none. */
  const firstOwnWorkspace = React.useMemo(() => workspaces.find((w) => !w.is_sample), [workspaces]);

  /*
   * The rail's collapsed state is the user's, so it survives a reload.
   *
   * ── AUTO-COLLAPSE IS RETIRED, 2026-08-15 ──────────────────────────────
   * This used to collapse the rail BY ITSELF once the user had visited four
   * distinct stations, on the theory that a familiar reader knows the icons
   * and would rather have the 172px. Founder verdict on looking at the result:
   * the shell "is broken and it's not at all good", and he is right. Three
   * things were wrong with it:
   *
   *   1. It made the product change shape on its own, on a schedule the user
   *      could not see, for a reason they were never told. The nav they
   *      learned on Monday is a column of unlabelled glyphs on Thursday.
   *   2. Familiarity with a STATION is not familiarity with its ICON. Visiting
   *      /runs four times teaches you the page, not which of ten similar
   *      14px glyphs opens it.
   *   3. It is the opposite of the reference this system is being held to.
   *      beautifului.dev's left plane names every destination, always, and that
   *      legibility is most of why it reads as premium rather than as dense.
   *
   * The manual toggle stays — a reader who wants the space can still take it,
   * and their explicit choice still persists. What is gone is the product
   * deciding for them. Default is now WIDE and named.
   */
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    const explicit = window.localStorage.getItem(RAIL_KEY);
    if (explicit !== null) setNarrow(explicit === "1");
  }, []);
  const toggleRail = React.useCallback(() => {
    setNarrow((v) => {
      window.localStorage.setItem(RAIL_KEY, v ? "0" : "1");
      return !v;
    });
  }, []);
  /** Open the rail, and remember that it is open. Pressing the collapsed
   *  search glyph is an explicit choice to widen, so it persists like any
   *  other; a rail that silently snapped shut again on the next reload would
   *  be the product changing shape on its own, which is the behaviour the
   *  auto-collapse was retired for. */
  const expandRail = React.useCallback(() => {
    window.localStorage.setItem(RAIL_KEY, "0");
    setNarrow(false);
  }, []);

  // The seven-stage strip. The shell owns the region, a run owns the content:
  // whatever surface is mounted publishes its stages through run-strip.tsx, and
  // only a run does. See that file's header for the founder ruling this obeys.
  const [strip, setStrip] = React.useState<RunStripSpec | null>(null);
  const [boardOpen, setBoardOpen] = React.useState(false);
  const [keysOpen, setKeysOpen] = React.useState(false);
  // `?` from anywhere. Memoised so the capture listener registers once for the
  // life of the shell rather than on every render of a frame that re-renders
  // on every route change and every live-line tick.
  const openKeys = React.useCallback(() => setKeysOpen(true), []);
  useShortcutSheetKey(openKeys);
  const { theme, toggleTheme } = useTheme();

  // THE STRIP DOES NOT COLLAPSE. Founder, 2026-07-29, revising the earlier
  // "if it has to be collapsed" allowance:
  //   "First, fix that horizontal pane, always remain. When I click on run,
  //    that horizontal pane should be there right from 01 to 07. It should not
  //    collapse."
  //
  // So there is no toggle and no remembered state. On a run the seven stages
  // are furniture, because they are the run's spine and a reader has to know
  // where in the loop they are looking without asking for it. Off a run there
  // is no strip at all, which is the same ruling's other half.

  const [me, setMe] = React.useState<{ email: string | null; name: string | null }>({
    email: null,
    name: null,
  });
  React.useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      const u = data.user;
      setMe({
        email: u?.email ?? null,
        name: (u?.user_metadata?.full_name as string | undefined) ?? null,
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  const fetchMissions = useServerFn(listMissions);
  const workspaceId = activeWorkspace?.id ?? null;

  /* THE LIVE LINE WAS NOT LIVE, and it is the product's only always-on proof of
   * the one thing it claims.
   *
   * Both reads sat on `staleTime: 30_000` with NO `refetchInterval`.
   * `refetchOnWindowFocus` is false globally (router.tsx:98) and
   * `_authenticated.tsx` keeps this shell mounted across every route change, so
   * it never remounted either. The result: whatever the workspace looked like
   * when the shell mounted is what the header kept saying, on 100% of
   * authenticated screens, for the rest of the session.
   *
   * It was wrong in BOTH directions, which is the part that matters. It went on
   * asserting "Engineer is working" long after the run finished, and it said
   * "Nothing running" for the whole duration of a run dispatched from anywhere
   * that is not Today or Ask (the only two other consumers of these keys). A
   * live indicator that lies is worse than no indicator, because the founder's
   * own bar is that a mark for work nobody is doing is a lie.
   *
   * `pollWhenVisible` is not new: LivePulse.tsx has shipped it since the
   * 2026-07-08 ruling and the rebuild simply did not carry it across. Polls
   * stop while the tab is hidden, so an idle background tab costs nothing.
   *
   * The cadence follows the claim. While something is running the line is
   * making a second-by-second assertion, so it earns 4s. Idle, it is only
   * watching for work to appear, so 20s is enough and cheaper. */
  const missions = useQuery({
    queryKey: missionsKey(workspaceId),
    /* Scoped, because the key claims a workspace. See use-live-agents.ts: the
     * key and the fetch disagreed, so this line rendered on every authenticated
     * screen and could name an agent in a workspace the reader had left. */
    queryFn: () => fetchMissions({ data: { workspaceId: workspaceId ?? undefined } }),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const rows = query.state.data?.missions ?? [];
      return livePoll(
        rows.some((m) => WORKING.has(m.status)),
        query.state.fetchFailureCount,
      );
    },
    placeholderData: keepPreviousData,
  });
  /*
   * P-18a (A-QUEUE.md). Gates on OPEN TRACKS, not `getApprovalsQueue`'s
   * ten-family workspace-wide federation -- see `listGatesOnTracks`'s own
   * header for the defect this replaces and the number that proved it.
   */
  const fetchGatedTracks = useServerFn(listGatesOnTracks);
  const gated = useQuery({
    queryKey: ["shell", "gated-tracks", wsKey],
    queryFn: () => fetchGatedTracks({ data: wsArg }),
    staleTime: 10_000,
    // A waiting call is not moving, so this never needs the fast cadence; it
    // only has to notice a NEW one arriving. Same cadence `moving` uses below.
    refetchInterval: (query) => livePoll(false, query.state.fetchFailureCount),
    placeholderData: keepPreviousData,
  });
  const gatedTracks = React.useMemo(() => gated.data ?? [], [gated.data]);

  /* THE WALK THE HEADER COULD NOT SEE.
   *
   * The live line above reads missions, and a spine track only becomes a
   * mission at Build (`driver.server.ts:674`). A run moving through Discover,
   * Decide or Plan wrote `spine_tracks.driven_at` and station activity while
   * this header went on saying "Nothing running" -- the exact invisibility the
   * mission exists to end (EVIDENCE.md §2: nine tracks sat waiting on a person
   * with nothing anywhere saying so). This read is the header's second ear.
   */
  const fetchOpenTracks = useServerFn(listTracks);
  const openTracks = useQuery({
    queryKey: ["shell", "open-tracks", wsKey],
    queryFn: () => fetchOpenTracks({ data: wsArg }),
    staleTime: 30_000,
    refetchInterval: (query) => livePoll(false, query.state.fetchFailureCount),
    placeholderData: keepPreviousData,
  });
  /*
   * P-18 (A-QUEUE.md). MOVING MEANS A SEAT IS LITERALLY IN FLIGHT, not "driven
   * recently". This used to read `spine_tracks.driven_at` within the last five
   * minutes -- a proxy for recent activity, not a claim that anything is
   * running THIS INSTANT, and it produced exactly the packet's own
   * reproduction: "3 runs are moving" over zero live `agent_runs` rows, because
   * a dispatch that finished in under a second touches `driven_at` the same way
   * one still mid-run does. `listMovingTracks` (`track.functions.ts`) is
   * `listRunsForStart`'s own `workingByTrack` query -- `agent_runs.status IN
   * ('running','queued','in_progress')`, never inferred from elapsed time --
   * factored out so the shell asks the precise question rather than
   * approximating it a second way.
   */
  const fetchMovingTracks = useServerFn(listMovingTracks);
  const moving = useQuery({
    queryKey: ["shell", "moving-tracks", wsKey],
    queryFn: () => fetchMovingTracks({ data: wsArg }),
    staleTime: 10_000,
    refetchInterval: (query) =>
      livePoll((query.state.data ?? []).length > 0, query.state.fetchFailureCount),
    placeholderData: keepPreviousData,
  });
  const movingRuns = React.useMemo(() => moving.data ?? [], [moving.data]);

  const rows = React.useMemo(() => missions.data?.missions ?? [], [missions.data]);
  const movingTrackIds = React.useMemo(() => new Set(movingRuns.map((t) => t.id)), [movingRuns]);
  // See genuinely-working.ts's own header for the defect this refuses: a
  // mission's stored status can go stale independently of the work it names.
  const running = React.useMemo(
    () =>
      genuinelyWorkingMissions(
        rows.filter((m) => WORKING.has(m.status)),
        movingTrackIds,
      ),
    [rows, movingTrackIds],
  );
  const gateCount = gatedTracks.length;
  /*
   * THE "AT LEAST" FLOOR IS GONE, ON PURPOSE (P-18a). It existed because
   * `getApprovalsQueue` bounded ten families to a fixed limit each and could
   * silently drop some of what it counted -- 116 specs pending a design gate
   * against a limit of 100, S1's own measurement. `listGatesOnTracks` has no
   * families to bound; it is one query over open tracks, capped at 50 the
   * same way `listTracks` and `listMovingTracks` already are without either
   * of them flagging that cap as partial. There is no equivalent "some of
   * what is waiting is missing" fact left to say here.
   */

  /*
   * ── WHAT AGENTS MOVING INTO SETTINGS MUST NOT COST ──────────────────────
   *
   * "Asking for more room" is the product noticing an agent has earned more
   * independence, and it was the one genuinely valuable thing on the surface
   * that just left the rail. Burying it behind a gear with no signal would
   * waste it, so the gear carries the count.
   *
   * THE SAME QUERY KEY THE ROSTER SURFACE USES, deliberately. `/crew` reads
   * `["crew","roster",workspaceId]` with `listCrew`; this joins that cache
   * entry rather than opening a second read of the same table, so the number in
   * the foot and the list you land on cannot disagree, and opening Agents costs
   * no extra round trip.
   *
   * NO POLL, AND A LONG STALE TIME. `asking` is derived from an agent's own
   * track record over many runs. It does not change second to second, so
   * refetching it on the live line's cadence would be paying the four-second
   * price for a fact that moves weekly. Measured on the live workspace:
   * `agent_autonomy.set_at` covers 14 distinct days in two months.
   */
  const fetchCrew = useServerFn(listCrew);
  const crew = useQuery({
    // Written as the literal `/crew` already writes it, character for
    // character, because sharing the cache entry IS the point. A helper in
    // query-keys.ts would be the tidier home and belongs in the same commit as
    // the roster surface adopting it; inventing a second spelling here would
    // give the two surfaces two caches and one of them would go stale.
    queryKey: ["crew", "roster", workspaceId],
    queryFn: () => fetchCrew({ data: { workspaceId } }),
    staleTime: 5 * 60_000,
  });
  const askingCount = React.useMemo(
    () => (crew.data?.members ?? []).filter((m) => m.asking.length > 0).length,
    [crew.data],
  );

  /* One string, said twice, because `title` and `aria-label` must never drift:
   * a pointer user and a screen-reader user are being told the same thing. */
  const settingsTitle = React.useMemo(() => {
    const key = SETTINGS_KEY ? `, shortcut ${NAV_CHORD_PREFIX} then ${SETTINGS_KEY}` : "";
    if (askingCount === 0) return `Settings${key}`;
    return askingCount === 1
      ? `Settings${key}. 1 agent is asking for more room`
      : `Settings${key}. ${askingCount} agents are asking for more room`;
  }, [askingCount]);

  // WHO is working. `missions.current_agent_id` is a uuid, so the roster is the
  // only way to turn it into a slug the catalog can draw and name; without it
  // every running agent would be an unnamed circle. The read is deliberately
  // deferred: it fires the first time work with an agent on it appears, and a
  // workspace sitting idle (the common case) never pays for it at all.
  const fetchAgents = useServerFn(listAgents);
  // Only for the fallback path: a mission that carries a uuid and no slug.
  const needRoster = running.some((m) => !m.current_agent_slug && !!m.current_agent_id);
  const roster = useQuery({
    queryKey: ["shell", "roster"],
    queryFn: () => fetchAgents(),
    enabled: needRoster,
    // The roster is a fixed catalog of thirteen. It does not change during a
    // session, so it is read once and not polled with the missions.
    staleTime: 10 * 60_000,
  });
  /*
   * AN ENDED SESSION IS ONE FACT ABOUT THE TAB, AND IT IS SAID ONCE.
   *
   * ReadFailed and ReadFailedLine learned to offer a Sign in door instead of a
   * retry when the error says the session ended (S0's `wayOut`), and I passed
   * `error` at fourteen reads across my surfaces. S1 then drove a genuinely
   * expired session and found what that composes into: the learn page said "Your
   * session ended. Sign in again and this will load." three times, in three
   * regions, with three identical doors.** Today would have said it five times.
   *
   * A dead token fails every read in the tab at once. It is not a fact about
   * the run record, or the queue, or the roster. It is a fact about you, and a
   * person needs ONE door. So the shell says it once, above everything, and the
   * regions go back to naming which read failed, which is the thing they know
   * and the shell does not.
   *
   * Derived from the shell's own five queries rather than a sixth: whichever
   * failed first the answer is identical, and it costs no request.
   */
  const sessionEnded =
    sessionEndedMessage(missions.error) ??
    sessionEndedMessage(gated.error) ??
    sessionEndedMessage(openTracks.error) ??
    sessionEndedMessage(crew.error) ??
    sessionEndedMessage(roster.error);

  const slugById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const a of (roster.data?.agents ?? []) as RosterRow[]) {
      if (a?.id && a?.slug) map.set(a.id, a.slug);
    }
    return map;
  }, [roster.data]);

  // Distinct workers holding a running run, plus a count of the runs whose
  // worker we could not name. Two runs held by Engineer are ONE working agent,
  // so the marks are deduplicated and the count follows the marks.
  const { workers, unnamedRuns } = React.useMemo(() => {
    const slugs: string[] = [];
    let unresolved = 0;
    for (const m of running) {
      // THE SLUG FIRST, the uuid second. `agent_runs.agent_slug` is NOT NULL
      // and written by the thing that actually runs; `current_agent_id` is a
      // uuid that needs the roster and is not reliably maintained. On the live
      // workspace the one running mission had no uuid, so this header showed
      // "1 run working" and a generic crew mark for work an agent was visibly
      // doing. The uuid path stays as the fallback rather than being deleted,
      // because a mission whose runs predate the slug column still resolves
      // through it.
      const slug =
        m.current_agent_slug ??
        (m.current_agent_id ? (slugById.get(m.current_agent_id) ?? null) : null);
      if (!slug) unresolved += 1;
      else if (!slugs.includes(slug)) slugs.push(slug);
    }
    const list: Worker[] = slugs.map((slug) => ({ slug }));
    if (unresolved > 0) list.push({ slug: null, name: CREW });
    return { workers: list, unnamedRuns: unresolved };
  }, [running, slugById]);

  /**
   * WHICH STAGE the crew is at, for the surfaces that do not draw the strip.
   *
   * Founder, 2026-07-30: "should we put it on other surfaces as well as we say
   * this is our spine of our product?" The strip is 97px, 11% of the viewport,
   * and it answers "where am I in the lifecycle", which is a question Today,
   * Brain and Crew do not have. So the strip stays on the spine and the global
   * signal stays where it already is: this one line.
   *
   * What the line could not say before is the stage. It can now, and only when
   * it is unambiguously true: EVERY working agent has to resolve to the SAME
   * station. Two agents at two stations get nothing rather than one of the two
   * picked arbitrarily, and an unnamed worker (the CREW fallback, slug null)
   * fails the test on its own, which is the same honesty rule the lead already
   * applies when it counts runs instead of agents.
   */
  const workingStation = React.useMemo(() => {
    if (unnamedRuns > 0 || workers.length === 0) return null;
    const stations = new Set(workers.map((w) => agentStation(w.slug)));
    if (stations.size !== 1) return null;
    const only = [...stations][0];
    return only ?? null;
  }, [workers, unnamedRuns]);

  /*
   * THE ONE CHARACTER, IN THE CHROME (founder direction + SPEC-PRESENCE.md,
   * 2026-08-25). The header used to draw a stack of seat silhouettes — an org
   * chart — beside the count of them. The ruling that built the presence work
   * replaced that: the crew reads as ONE named worker whose hands are the
   * seats, so the chrome shows the worker's own face in the state the shell's
   * rows prove. The lead sentence keeps naming WHO is working; the mark
   * stopped duplicating it as a roster.
   *
   * Every input is a read this file already polls: the gated tracks are the
   * decisions waiting on a person, the missions' working statuses and the
   * freshness window on `spine_tracks.driven_at` are the proof something
   * moves. `deriveRailPresence` holds the precedence; nothing here stages a
   * state. While the reads have not answered, NO mark renders — a face drawn
   * before its facts would be smiling on a dead feed (F-38/F-39).
   */
  const railPresence = deriveRailPresence({
    loading: missions.isLoading || openTracks.isLoading || moving.isLoading,
    feedDead: missions.isError || openTracks.isError || moving.isError,
    waitingOnYou: gateCount,
    missionsWorking: running.length,
    tracksMoving: movingRuns.length,
  });

  // The most recently touched finished run, for the live line's second fact.
  const lastDone = React.useMemo(() => {
    const done = rows
      .filter((m) => !WORKING.has(m.status) && m.completed_at)
      .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
    return done[0] ?? null;
  }, [rows]);

  const counts: Record<string, number> = { gates: gateCount, runs: running.length };

  /* ONE BOX, ONE KEY, AND THE BOX IS ASK.
   *
   * This briefly opened the legacy palette instead, on the theory that the
   * palette was the front door and would hand free text through to Ask. The
   * founder found it immediately and it was the wrong call: *"if I click on Ask
   * or the shortcut Cmd+K, it still opens me that old section... It does not
   * open me the Ask panel. You need to ensure that old one is gone."*
   *
   * He is right, and the reason is worth keeping. A door labelled Ask that
   * opens something that is not Ask is a lie about itself, and the handoff was
   * an extra press between a person and the thing they came for. Ask is the
   * front door now: the button and Cmd+K both land in the pane, which is where
   * a conversation lives. The keybind itself is in AskProvider, next to the
   * open state it toggles. */
  const openAsk = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
  }, []);

  // setStrip is stable, so this identity only changes when a strip is published
  // or withdrawn, which is exactly when a consumer needs to re-render.
  const stripCtx = React.useMemo(() => ({ spec: strip, publish: setStrip }), [strip]);

  // Voice: never greet, always report. The lead is a fact, and it is a fact we
  // can prove. Five states, in the order a person cares about them.
  //
  // The live line stays quiet until data arrives. A header that says "Nothing
  // running" before the read lands would be a false claim about workspace state.
  // But saying "Reading" advertises latency. The dot already communicates the
  // idle state and the shell provides enough structure; the words appear the
  // moment data resolves (instant from cache on revisit).
  const liveLead = React.useMemo(() => {
    /*
     * BOTH READS, NOT ONE (S0 -> S2, 2026-08-27, found at the source).
     *
     * This guarded `missions` alone, and the line it protects makes a claim
     * over TWO reads: `running` comes from missions, and `movingRuns` comes
     * from `moving` (`listMovingTracks`, P-18 -- `openTracks` until then). So a
     * workspace where missions answered "nothing running" while the tracks
     * read REFUSED fell straight through to the literal "Nothing running" at
     * the bottom of this chain. The guard was checking the wrong query.
     *
     * That is the highest-traffic place in the product where "nothing is in
     * flight" can be a lie, and until 042a47952 it could not even be detected
     * here: `listTracks` swallowed its own errors and returned `[]`, so a
     * refusal and an empty workspace were one answer. S0 made a real failure
     * raise, which is what makes `openTracks.isError` worth reading at all --
     * `moving.isError` carries the exact same claim now that `movingRuns`
     * reads that query instead.
     *
     * The sentence is unchanged. Whichever of the two died, what the reader
     * needs to know is the same: this line cannot see, so do not read its
     * silence as calm.
     */
    if (missions.isError || openTracks.isError || moving.isError)
      return "Cannot see what is running";
    if (missions.isLoading) return null;
    if (running.length === 0) {
      /* NOT ON THE BOARD, WHICH IS SAYING IT LOUDER TWO INCHES BELOW.
       *
       * This file's own rule, already applied to the station a few lines down,
       * bans the third statement of one fact inside 100 pixels. The gate count
       * never got the same treatment, and it is the worst offender because it
       * is the PRIMARY claim of the surface it duplicates.
       *
       * Screenshotted on the running board 2026-08-27, signed in: the top bar
       * read "52 decisions are ready for you" and the headline 190px below read
       * "52 decisions are ready for your review." Same number, same things,
       * near-identical words - which reads as a screen repeating itself rather
       * than as one surface with one thing to say.
       *
       * The header's job is to carry what is happening when you are NOT looking
       * at the board. On the board, it falls through to what is running, which
       * the headline does not say. Everywhere else the sentence is unchanged,
       * and the error branch above is deliberately outside this guard: "Cannot
       * see what is running" must survive on every surface including this one.
       */
      if (gateCount > 0 && !onTheBoard) {
        /* "DECISIONS", NOT "CALLS", and the two surfaces now agree.
         *
         * The shell said "83 calls need you" while /today, one inch below it,
         * said "83 decisions are ready for your review". Same number, same
         * things, two nouns -- which reads as two different counts until you
         * work out that it isn't.
         *
         * "Decision" is also the word the market uses and "call" is not:
         * measured across 5.72M words of operator conversation, "decisions" is
         * the single most common substantive term at 562.8 per million, while
         * "call" in this sense barely registers and is ambiguous with a phone
         * call in the same breath as agents and runs. */
        return gateCount === 1
          ? "1 decision is ready for you"
          : `${gateCount} decisions are ready for you`;
      }
      /* A walk with no mission yet lands here, said from its own row. The
       * station is named the way the transcript names one in passing, which is
       * where this vocabulary is allowed to appear (R-13); it is a fact about
       * the work, never a menu. */
      if (movingRuns.length === 1) {
        const label = STAGE_LABEL[movingRuns[0].station];
        return label ? `Your agents are moving · ${label}` : "Your agents are moving";
      }
      if (movingRuns.length > 1) return `${movingRuns.length} runs are moving`;
      return "Nothing running";
    }
    // Every running run resolved to a named worker, so the agents are
    // countable and the count is the thing worth saying.
    if (unnamedRuns === 0) {
      // The stage is appended only when the strip is NOT on screen. On a run or
      // a station the strip is already saying it two rows down, and this file's
      // own rule bans the third statement of one fact inside 100 pixels.
      const at = !strip && workingStation ? ` at ${STAGE_LABEL[workingStation]}` : "";
      if (workers.length === 1) return `${agentDisplayName(workers[0].slug)} is working${at}`;
      return `${workers.length} agents are working${at}`;
    }
    /* AN AGENT IS ALWAYS THE ACTOR. The count is only ever of what we can count.
     *
     * Founder, 2026-07-30: should "1 run working" say "agents" instead, since
     * this is an agentic-first product? The vocabulary yes, the NUMBER no, and
     * the two have to be separated or this line starts lying.
     *
     * This branch is reached when at least one running run's worker could not
     * be named, which means the number of AGENTS is unknown: the named path
     * above deduplicates deliberately, because two runs held by Engineer are
     * ONE working agent. So "3 agents are working" over three unresolved runs
     * could be three agents or one agent doing three things, and inventing the
     * distinction is the same class of fabrication as a made-up diffstat.
     *
     * The fix is to move the agent into the SUBJECT and leave the count on the
     * thing that is genuinely countable. The crew is who is working, which is
     * also exactly what the mark beside this line already says, so the words
     * and the drawing finally agree. "Run" survives only as the object of the
     * sentence, where it is a true noun for a true number. */
    return running.length === 1
      ? `${CREW} are working`
      : `${CREW} are working on ${running.length} runs`;
  }, [
    missions.isError,
    /*
     * `openTracks.isError` IS READ IN THIS BODY AND WAS NOT IN THESE DEPS.
     *
     * Two lines above return on it — `feedDead` and the "Cannot see what is
     * running" branch — so the headline whose entire job is to admit the feed
     * died could not recompute when the tracks feed was the thing that died.
     *
     * NOTHING ELSE COVERS IT, which is what makes this a defect rather than a
     * lint nit. `movingRuns` memoises on `moving.data` (P-18; `openTracks.data`
     * until then), which does NOT change when a read fails: on a first-load
     * failure `data` is `undefined` and stays `undefined`, and on a later
     * failure TanStack RETAINS the last successful value. So the reference
     * holds, no dep changes, and the memo keeps returning the sentence it
     * computed while the feed was alive. `moving.isError` carries the same
     * fix `openTracks.isError` was added for, now that `movingRuns` is fed by
     * a second, separate query.
     *
     * That is this lane's recurring defect in its purest form: a failed read
     * that never reaches the surface. `getWorkspaceAnchors` swallowing an error
     * and returning empty is the same shape one layer down, and it is why the
     * rail crew's quiet state had to become a door rather than a sentence.
     */
    openTracks.isError,
    moving.isError,
    missions.isLoading,
    running.length,
    gateCount,
    onTheBoard,
    workers,
    unnamedRuns,
    workingStation,
    strip,
    movingRuns,
  ]);

  // The two trailing facts, in importance order: the first survives to 860px,
  // the second goes at 1100px. Positional, so a state that has only one fact
  // still gives it the slot that lasts longest.
  /* ELAPSED TIME WAS FROZEN, which made a polling fix only half a fix.
   *
   * `since()` computes against Date.now() at RENDER, and nothing re-rendered
   * this component on a clock. So even once the reads poll, a run that reported
   * "started 4m ago" kept saying 4m until some unrelated state changed. The
   * header's whole job is to be true at a glance, and a stopped clock beside a
   * live dot is the same class of lie as a mark for work nobody is doing.
   *
   * One tick a minute is all the resolution `since()` has (it renders whole
   * minutes, then hours, then days), so anything faster would re-render for no
   * visible change. It stops while the tab is hidden for the same reason the
   * polls do. */
  const [, forceClock] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "hidden") forceClock();
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const liveFacts = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    if (missions.isError || missions.isLoading) return out;
    if (running.length > 0) {
      // One run: name it. Several: naming one of them would be arbitrary, so it
      // says how many there are, which pairs with the agent count in the lead.
      const only = running.length === 1 ? running[0] : null;
      out.push(
        only ? (
          <TitleFact title={only.title} />
        ) : (
          <>
            across <span className="sp-num">{running.length}</span> runs
          </>
        ),
      );
      // `created_at` is when the mission was opened and dispatched, which is
      // the only start instant the list read carries. Said in those words
      // rather than as an elapsed working time we do not have.
      const started = only ? since(only.created_at) : null;
      if (started)
        out.push(
          <>
            started <span className="sp-num">{started}</span>
          </>,
        );
      return out;
    }
    if (gateCount > 0) {
      /* THE ONE IN FRONT, FROM THE SAME READER AS THE COUNT (P-18a). Naming
         the track waiting on a call, not a phrase for the call's mechanics --
         `gatedTracks` carries no such phrase, and inventing a second one here
         risks the exact defect this packet exists to close: a count from one
         source beside a detail from another that can name something the
         count did not include. */
      const first = gatedTracks[0];
      if (first?.title) out.push(<TitleFact title={first.title} />);
      const at = first?.updatedAt ? since(first.updatedAt) : null;
      if (at) out.push(<span className="sp-num">{at}</span>);
      return out;
    }
    if (lastDone) {
      out.push(
        <>
          last: <TitleFact title={lastDone.title} />
        </>,
      );
      const at = since(lastDone.completed_at);
      if (at) out.push(<span className="sp-num">{at}</span>);
    }
    return out;
  }, [missions.isError, missions.isLoading, running, gateCount, gatedTracks, lastDone]);

  /**
   * WHERE THE LINE TAKES YOU, and it follows what the line SAYS.
   *
   * It used to go to /runs from every state. The founder pressed it while it
   * read "21 calls need you", landed on a list of runs, and reported that
   * nothing happened. He was right in the way that matters: something did
   * happen, and it was useless, which is indistinguishable from nothing. A
   * control that reports a fact and then takes you somewhere unrelated to that
   * fact is worse than one that does nothing, because you also have to work
   * out where you are.
   *
   * So the destination is derived from the same state the sentence is. Calls
   * need you goes where calls are answered. One run is working goes to that
   * run. Nothing running goes to the last finished one, because that is the
   * only thing the sentence names.
   */
  const liveTarget = React.useMemo(() => {
    const go =
      (to: string, params?: Record<string, string>, search?: Record<string, unknown>) => () =>
        void navigate({ to, params, search } as never);
    if (gateCount > 0) {
      // Calls are settled on Start's review queue. `/today` was the door to it
      // until P-10 deleted the redirect stub (2026-09-02); this raw string is
      // exactly the shape tsc cannot check, which is how it outlived the route.
      return {
        go: go(SIGNED_IN_HOME, undefined, { [REVIEW_QUEUE_SEARCH]: true }),
        title: "Go to the calls waiting on you",
      };
    }
    if (running.length === 1) {
      const only = running[0];
      /* THE RUN KNOWS ITS WORK, so the door opens the watchable address, not
       * the container id. Null is a real state -- every run started before the
       * loop wrote the link, and any not started by the driver -- and null
       * keeps the mission door rather than guessing (R021/R023). */
      if (only.trackId) {
        return {
          go: go("/track/$trackId", { trackId: only.trackId }),
          title: "Open the piece of work that is moving",
        };
      }
      // P-14 (A-QUEUE.md, R-35): /runs/$missionId is deleted; this branch is
      // the genuinely track-less case (R021/R023's own null-is-real state)
      // and there is nowhere else to send it. Start rather than a dead link.
      return { go: go(SIGNED_IN_HOME), title: "Open the run that is working" };
    }
    /* THE BOARD BY NAME, not through the alias. This said `/runs`, which the
       fold turned into a redirect to `/today`, so the most-used control in the
       shell took a person through a bounce to reach a page it could have named.
       It always MEANT the board and now it says so. */
    // Every run is listed on Start; `/today` was its redirect stub until P-10.
    if (running.length > 1) return { go: go(SIGNED_IN_HOME), title: "See every run" };
    /* Nothing in the mission world is working, but a spine run moved moments
     * ago -- so the door opens THE address of that run, not a list. The track
     * is named by its own row; this mapping is read, not guessed (the
     * proven mission-to-track version waits on request 021). */
    if (movingRuns.length > 0) {
      return {
        go: go("/track/$trackId", { trackId: movingRuns[0].id }),
        title:
          movingRuns.length === 1 ? "Open the run that is moving" : "Open the run that moved last",
      };
    }
    if (lastDone) {
      // P-14 (A-QUEUE.md, R-35): /runs/$missionId is deleted. `lastDone` is a
      // mission (`listMissions`' own shape), not a track, and carries no
      // track id to send this to /track/$trackId with. Start rather than a
      // dead link.
      return { go: go(SIGNED_IN_HOME), title: "Open the last run that finished" };
    }
    /* TRULY NOTHING — no working run, no moving track, nothing even finished
     * recently. The old door was the runs list, which in this state shows an
     * empty board: a surface that only tells (R-03). The character beside
     * these words is awake, and SPEC-PRESENCE §Anatomy #2 rules that an idle
     * one is the door to where work starts. */
    return { go: go("/start"), title: "Start a piece of work" };
  }, [gateCount, running, movingRuns, lastDone, navigate]);

  /* THE ONE THING ON THE STRIP THAT MOVES.
   * A gate outranks a run in progress, because the gate is the one asking for a
   * person. If nothing is gated, the running stage gets the motion, which is
   * what makes progress visible as it walks the spine. If neither, nothing
   * moves, and a still strip is the honest picture of a still workspace. */
  const blinkStation = React.useMemo(() => {
    if (!strip) return null;
    return (
      strip.stages.find((s) => s.state === "gate")?.station ??
      strip.stages.find((s) => s.state === "working")?.station ??
      null
    );
  }, [strip]);

  return (
    <RunStripProvider value={stripCtx}>
      <div
        className="sp-app"
        /*
         * THE SYSTEM TRAVELS WITH THE PART, and this is the line that moves the
         * whole shell onto it.
         *
         * meridian.css scopes its focus treatment, its caret and accent
         * colours, its selection colour and its neutralisation of the legacy
         * `--focus-ring` alias chain to `[data-mrd]`. Every Meridian component
         * carries the attribute; the chrome that frames all of them did not, so
         * the shell was the one surface still picking up `[data-obsidian]
         * :focus-visible` out of the unlayered part of styles.css — an ember
         * ring on every tab press, in the product that retired ember from every
         * interaction state.
         *
         * `[data-mrd][data-mrd] :focus-visible` scores (0,3,0) against that
         * rule's (0,2,0), so it wins outright rather than on source order. The
         * descendant reach is deliberate and is the migration working as
         * designed: an unported surface mounted inside this shell stops glowing
         * too, without being touched.
         */
        data-mrd=""
        data-rail={narrow ? "narrow" : "wide"}
        data-strip={strip ? "on" : "none"}
      >
        {/* THE FIRST TAB STOP ON EVERY SIGNED-IN PAGE (P-16b, A-QUEUE.md). See
            `.skip-link` in shell.css for why this is a skip link rather
            than a DOM reorder. Hidden until focused; the second Tab press (or
            Enter) lands in `#main-content`, past the rail's own doors. */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <header className="sp-top">
          {/* THE BRAND AND THE RAIL TOGGLE, AS ONE BLOCK. Founder, 2026-08-15:
            the collapse control belongs at the top, next to the logo. See
            `.sp-collapse` in shell.css for why the rail foot was the wrong home
            for it — chiefly that below 640px the rail is `display: none`, so the
            control that reveals the rail vanished with the rail. */}
          <div className="sp-lede">
            {/* THE OTHER HALF OF F-144, AND IT WAS NOT IN THE FINDING.
              The wordmark is the most conventional "go home" gesture on the
              web, and it pointed at /today - so a person who reached for the
              logo landed on the surface the 2026-08-25 flip existed to escape,
              exactly as the rail's first row did. Same defect, second control,
              and the aria-label said "go to Today" out loud to a screen reader.
              Derived from the constant for the same reason the rail row is. */}
            <Link to={SIGNED_IN_HOME} className="sp-brand" aria-label="Supaprod, go home">
              {/* mono + no glow: the mark is identity, not an event, and colour
              arrives only when something happens. The glow is also a recorded
              defect on the auth door (session-handoff.md), so it is not
              carried into the chrome. */}
              <span className="sp-logo">
                {/* THE REAL MARK, not the watermark. `mono` was set here and it
                  is a documented switch that REPLACES the Brain+Pulse core with
                  a grey circle ("silver/gray spiral + core, no ember/gold").
                  So the wordmark in the top left was the brand with its centre
                  removed. The founder caught it: "on the logo which is used
                  across our platform, top left, there also it is the same
                  thing... it needs to be the real one, not just a mockup."
                  The ember core is the ONE piece of brand colour the rebuild's
                  monochrome default does not govern: a logo's own colour is
                  identity, not interface state. */}
                <SupaprodMark size={21} glow={false} />
              </span>
              <span className="sp-wordmark">Supaprod</span>
            </Link>
            {/* ONE GLYPH SOURCE, which is the other half of what he asked for.
              The mark beside it and this control were drawn by two different
              hands — `IconPanel` here, and a second inline drawing inside
              Meridian's own SidebarNav. Both are now the one drawing in
              icons.tsx, mirrored for the two directions so the icon is a
              promise about the next press rather than a picture of the current
              state. `IconPanel` is deleted rather than deprecated. */}
            <button
              type="button"
              className="sp-collapse"
              onClick={toggleRail}
              title={narrow ? "Expand the rail" : "Collapse the rail"}
              aria-label={narrow ? "Expand the rail" : "Collapse the rail"}
              aria-pressed={narrow}
            >
              {narrow ? <IconRailExpand /> : <IconRailCollapse />}
            </button>
          </div>

          {/* The chevron is a menu now. It was a Link to /settings wearing a
            chevron, which promises a menu and delivers a navigation. See
            ScopeMenu.tsx for where the switching went and why it was missing. */}
          <ScopeMenu />

          {/* A button only where pressing it does something. On a run the strip
              is already on screen and permanent, so this is a status line and
              renders as a div; everywhere else it takes you to the work. A
              control that reports a fact and then does nothing when you press
              it is worse than a label.

              THE TEST IS THE MODE, NOT THE PRESENCE, and that is a repair. This
              read `strip ? "div" : "button"`, which was correct when a strip
              existed only on a run. It stopped being correct the day
              `WorkspaceSpine` began publishing one on EVERY authenticated
              surface (use-spine-strip.ts: it is always mounted and calls
              `useSpineStrip(null)`, which publishes `mode: "nav"`). From then on
              `strip` was never null, the button branch was unreachable, and the
              live line became exactly the thing the paragraph above forbids: it
              reported that an agent was working and did nothing when pressed, on
              essentially every screen in the product.

              `mode: "tab"` is a run's own seven stages, already on screen and
              permanent, which is the case the div was written for. `mode: "nav"`
              is the workspace strip, which is not the same thing as being on the
              work, so the line stays a door. */}
          {React.createElement(
            strip?.mode === "tab" ? "div" : "button",
            strip?.mode === "tab"
              ? { className: "sp-live", "data-static": "true" }
              : {
                  className: "sp-live",
                  type: "button",
                  onClick: liveTarget.go,
                  title: liveTarget.title,
                },
            <>
              {/* THE CHARACTER'S FACE, in the fixed slot the marks used to
                  share. One worker fronts the crew (SPEC-PRESENCE §Anatomy #2):
                  its state is derived from this file's own reads, and while
                  those reads have not answered, no face renders — the quiet
                  dot holds the box rather than a smile claiming a feed it has
                  not seen (F-38/F-39). The mark carries its own accessible
                  name, so a screen reader hears "Supa: working" where it used
                  to hear nothing from an unnamed glyph stack. */}
              <span className="sp-live-who">
                {missions.isLoading || openTracks.isLoading || moving.isLoading ? (
                  <span className="sp-live-dot" data-state="idle" />
                ) : (
                  <CharacterMark state={railPresence} size={24} />
                )}
              </span>
              <span className="sp-live-lead">{liveLead}</span>
              {liveFacts.map((fact, i) => {
                // Position decides which fact dies first: index 0 is the more
                // important one and survives to 860px, index 1 goes at 1100px.
                const drop = i === 0 ? "2" : "1";
                return (
                  <React.Fragment key={drop}>
                    <span className="sp-live-sep" data-drop={drop} aria-hidden="true">
                      &middot;
                    </span>
                    <span className="sp-live-fact" data-drop={drop}>
                      {fact}
                    </span>
                  </React.Fragment>
                );
              })}
            </>,
          )}

          <div className="sp-tools">
            <button type="button" className="sp-askbtn" onClick={openAsk}>
              <IconAsk className="sp-askbtn-icon" />
              Ask
              {/* The one key. Cmd+J is gone: it was Ask's half of a split that
                only ever made people guess which box they wanted. */}
              {/* The literal glyph, not `&#8984;`. Identical output, and the
                  entity's digits were being counted as a raw colour by the
                  design scanner. Every other keycap in the product already
                  spells the command key this way. */}
              <span className="sp-askbtn-key">⌘K</span>
            </button>
            {/* The account disc owns who you are, including the way out. Sign
              out was reachable from exactly one component in the repo and that
              component only renders in the retired Mission Control chrome, so
              the shipped shell had no way to log out at all. */}
            <AccountMenu initials={initialsFrom(me.email, me.name)} />
          </div>
        </header>

        {/*
         * ── SAYING WHERE YOU ARE WHEN WHERE YOU ARE IS A FIXTURE (P-33) ─────
         *
         * Directly under the header, above every surface, because the door
         * that brings people here MOVES them rather than previewing: Discover's
         * empty-desk button sets the seeded workspace active and persists that
         * choice, so the next visit lands here too. Before this, nothing on any
         * screen said so and no return door was named anywhere.
         *
         * `firstOwnWorkspace` is the first NON-sample workspace the person has.
         * It is frequently null and that is the ordinary case rather than an
         * error: the door is offered ON an empty desk, and plenty of accounts
         * hold only the sample. The banner drops the return control and keeps
         * the sentence, because where you are is still worth saying when there
         * is nowhere else to be.
         */}
        {activeWorkspace?.is_sample ? (
          <SampleBanner
            workspaceName={activeWorkspace.name}
            ownWorkspaceName={firstOwnWorkspace?.name ?? null}
            onReturn={
              firstOwnWorkspace ? () => setActiveWorkspaceId(firstOwnWorkspace.id) : undefined
            }
          />
        ) : null}

        {/*
          ── THE STRIP IS A RUN'S OWN STEP LIST, AND NOTHING ELSE (2026-09-02) ──
          Founder decision, taken on measurements rather than taste. It used to
          draw on EVERY signed-in surface, and on those surfaces it was a 94.5px
          band -- 10.6% of a 900px viewport, more like 13% on a 13in laptop --
          in which FOUR OF SEVEN chips carried nothing but a two-digit number
          and a word.

          The three that did carry a fact were the worse half. The header read
          "68 decisions are ready for you" and the Discover chip, 150px below
          it, read "89+ runs waiting on you": two different counts of
          things-waiting-on-you in one glance, with nothing saying why they
          differ. One is gates, the other is runs held at a gate per station.
          Both true, and together they read as the screen disagreeing with
          itself.

          It also contradicted the positioning it was meant to serve. README:
          "never lead with the seven stations ... a workflow tool is compared on
          features; three layers is a position." A permanent seven-station band
          on every screen leads with stations on every screen.

          And F-146 -- founder-reported, 2026-08-31 -- had already written the
          remedy down: "the fold: when the rail carries one primary door and
          stations appear only as the step list inside a run, the ambiguity has
          nowhere left to live." This is that fold, finished.

          THE TEST IS `mode`, NOT PRESENCE. Four publishers still push a `nav`
          strip (`WorkspaceSpine` plus three surfaces calling `useSpineStrip`),
          and gating on `strip` alone would leave the band on every one of them.
          Gating on the mode means the band draws only where a run published its
          own seven stages, whoever else is publishing.

          WHAT IS LOST, said plainly rather than buried: the per-station split of
          runs held at a gate. The AGGREGATE is not lost -- it is on the rail's
          Approvals row and in the header's live line, both of which reach the
          queue that works them. The SPLIT has no home now, and the record of
          that is `docs/design/station-strip-before-the-fold.md`.

          No collapse, by ruling. The ARIA is not cosmetic: a tablist promises
          exactly one selection at all times, which a run's strip does honour.
          See run-strip.tsx. */}
        {strip && strip.mode === "tab" ? (
          <div
            className="sp-strip"
            role={(strip.mode ?? "tab") === "tab" ? "tablist" : "group"}
            aria-label={strip.label ?? "The seven stages of this run"}
          >
            {strip.stages.map((stage, i) => {
              const on = stage.station === strip.active;
              const asTab = (strip.mode ?? "tab") === "tab";
              /*
               * A CHIP IS A CONTROL ONLY IF SOMETHING IS LISTENING (F-146).
               *
               * `mode: "tab"` supplies `onSelect`, and a chip there switches the
               * work region without leaving the run - R-01's "step list inside one
               * run". The workspace strip supplies none, because picking a stage
               * there used to navigate to a station engine, which is the founder's
               * own F-146 report: a rail door and a station chip both clickable,
               * with nothing saying which was a place and which was a step.
               *
               * Read off the HANDLER rather than off the mode, so a future mode
               * inherits the right behaviour without editing this line.
               */
              const interactive = typeof strip.onSelect === "function";
              /* ONE CLASS EXPRESSION FOR BOTH BRANCHES. Writing `sp-stage` twice
                 would be a second place to edit and the Meridian ratchet counts
                 it as the file getting worse - correctly. `mrd-focus-inset` is
                 only meaningful on something focusable, so it rides the
                 interactive branch. */
              const chipClass = `sp-stage${interactive ? " mrd-focus-inset" : ""}`;
              // THE ONE BLINK, enforced here rather than trusted to callers.
              // SYSTEM.md: "`gate` blinks and is the only blink in the system,
              // so exactly one mark on a screen may wear it... A list that gave
              // every pending row `gate` blinked a dozen marks at once and
              // spent the whole restraint budget." Every gated stage still
              // wears its ember dot so you can see all of them without opening
              // anything; only the first one moves. This component is the only
              // place that can see all seven at once, so it is the only place
              // that can hold the rule.
              const moving = stage.station === blinkStation;
              /**
               * THE STATION'S OWN KEY, drawn on the station at last.
               *
               * Founder, 2026-08-06: the keycaps appeared on Today, Runs and
               * the gate buttons and nowhere on Discover, Decide and the rest.
               * True, and the reason is structural: only a RAIL ROW drew a
               * keycap, and the seven stations have never been rail rows (see
               * the RAIL comment above, which decided that twice and against
               * relitigating). They live here. So the keycap comes here.
               *
               * Derived through STATION_ROUTE, so it is the same fact the rail
               * reads, twice: station -> route -> `doorKey` -> `navKeyHint`.
               * Nothing is hand-typed, and moving a station's route moves its
               * drawn key in the same edit. That is the DERIVATION LAW in
               * nav-model.ts, held on one more surface.
               *
               * NOT IN TAB MODE, and this is the line that keeps the keycap
               * honest. On the spine (`mode: "nav"`) a chip navigates to the
               * station, which is exactly what `g d` does, so the keycap is
               * the keyboard equivalent of the click. INSIDE one run the strip
               * is a tablist and a chip switches tab without leaving the run --
               * there `g d` would abandon the run for /discover, a different
               * act entirely. Drawing it would be a keycap that lies about the
               * control it sits on, which is the defect `doorKey` returning ""
               * exists to prevent everywhere else.
               */
              /* NO KEYCAP ON A CHIP THAT IS NOT A CONTROL. The keycap is how this
                 strip advertises a door, so drawing one over a chip that opens
                 nothing would be exactly the promise `doorKey` returning "" exists
                 to prevent, made by the other half of the same component. */
              const stageKey = asTab || !interactive ? "" : doorKey(STATION_ROUTE[stage.station]);
              const chipBody = (
                <>
                  <span className="sp-stage-n">
                    {String(i + 1).padStart(2, "0")}
                    {/* Inline with the 01-07 marker, not stacked, so the chip
                        keeps its three-line rhythm and the strip keeps its
                        height. The two are never confusable: the marker is a
                        bare mono number and the key is in a keycap, which is
                        the same distinction the rail draws on Today. */}
                    {stageKey ? (
                      <kbd
                        className="sp-stage-key"
                        data-shortcut={`${NAV_CHORD_PREFIX} ${stageKey}`}
                        aria-hidden="true"
                        style={KEYCAP}
                      >
                        {NAV_CHORD_PREFIX} {stageKey}
                      </kbd>
                    ) : null}
                  </span>
                  {/* Said in words, because the keycap above is revealed on
                      hover and on an armed chord and a screen reader has
                      neither. An `aria-label` would have been wrong here: it
                      REPLACES the accessible name, and the name is currently
                      "01 Discover, 9 runs waiting on you" -- the count is the
                      most valuable thing on the chip and must not be traded for
                      a shortcut. `aria-keyshortcuts` was the other candidate and
                      is also wrong: ARIA reads its space-separated values as
                      ALTERNATIVE shortcuts, so "g d" would announce as "g or d",
                      and `d` alone does nothing. */}
                  {stageKey ? (
                    <span className="sp-sr-only">
                      Shortcut: {NAV_CHORD_PREFIX} then {stageKey}
                    </span>
                  ) : null}
                  <span className="sp-stage-name">{STAGE_LABEL[stage.station]}</span>
                  {/* THE "+" IN THE NOTE IS A FLOOR, and the chip has no room
                      for the sentence. Same convention as the rail's own count a
                      few hundred lines down; the title carries the words. */}
                  <span
                    className="sp-stage-state"
                    /*
                      ONE LINE, AND THE WHOLE SENTENCE IN THE TITLE (2026-09-02).
                      The note used to be a count and now it is what the station
                      produced -- "Plan filed 16 tasks and 5 specs. 12 of them
                      repeat 5 things already filed." Measured when that landed:
                      the band went from 74px to 115px, taller than the 91px it
                      had just been cut down from, because two stations wrapped
                      to three lines each.

                      The strip is the glance. The full sentence is not lost and
                      is not only in a tooltip: `ArtifactPane` prints it in the
                      pane below, from the same chain read, which is why a clamp
                      is honest here and would not be on a row that is the only
                      copy.
                    */
                    title={
                      stage.bounded
                        ? `${stage.note} -- more are waiting than this counts`
                        : stage.note || undefined
                    }
                  >
                    {stage.note}
                  </span>
                  {/* The dot repeats what the note already says in words, for
                      the glance that does not read. It is aria-hidden for the
                      same reason: a screen reader gets "2 waiting on you" and
                      does not need "dot" after it. */}
                  {/*
                      THE STATION'S OWN MARK, in the corner that was empty.
                      Founder, 2026-08-15: there is dead space at the top right of
                      every chip and nothing says which station this is except the
                      word. The mark is the same drawing Meridian's rail uses for
                      the same station — imported, not redrawn, so the two can
                      never disagree about what Discover looks like.
  
                      IDENTITY BY SHAPE, NOT BY HUE. He also asked whether each
                      station could take its own colour. It cannot: colour in this
                      product means STATUS, and seven categorical hues would leave
                      a reader unable to tell "Plan is amber because it is Plan"
                      from "Plan is amber because something is stuck there". Seven
                      silhouettes separate better than seven hues at 13px anyway,
                      and they survive a colour vision deficiency that the hues
                      would not.
                    */}
                  <span className="sp-stage-mark">
                    {stage.state === "gate" ||
                    stage.state === "working" ||
                    stage.state === "held" ||
                    stage.state === "failed" ? (
                      <span
                        className="sp-stage-dot"
                        data-kind={stage.state}
                        data-moving={moving ? "true" : "false"}
                        aria-hidden="true"
                      />
                    ) : null}
                    <StationGlyph kind={STATION_MARK[stage.station]} size={12} />
                  </span>
                </>
              );
              return interactive ? (
                <button
                  key={stage.station}
                  type="button"
                  role={asTab ? "tab" : undefined}
                  aria-selected={asTab ? on : undefined}
                  aria-pressed={asTab ? undefined : on}
                  /* `mrd-focus-inset` is Meridian's own hook and is not
                     decoration here. The strip becomes a horizontal scroller at
                     640px, and an OUTSET ring on the first or last chip is
                     sheared off by that overflow, which reads as a broken
                     half-drawn edge rather than as focus. Written as the class
                     rather than as an `outline-offset` in shell.css because
                     `[data-mrd][data-mrd] :focus-visible` scores (0,3,0) and
                     would win over `.sp-stage:focus-visible` at (0,2,0) --
                     verified in the browser, where the offset came back 1px
                     instead of -2px. The system already solved this; the hook
                     is how it is asked for. */
                  className={chipClass}
                  data-state={stage.state}
                  data-on={on ? "true" : "false"}
                  /* NO `--sp-hue` HERE ANY MORE, 2026-08-15. This chip used to
                     set a per-station colour inline, from `stageHueForStation`,
                     and shell.css painted three things with it: the active
                     station's bar, the working note, and the status dot. That
                     is a station IDENTITY drawn as a seven-colour ramp, on the
                     one control that is on screen everywhere — the exact thing
                     the comment forty lines below says the system may not do,
                     contradicted by this line. The bar is neutral now, and the
                     working note and dot take the machine hue, which is what
                     "a machine is working" means in every other surface. */
                  onClick={() => strip.onSelect?.(stage.station)}
                >
                  {chipBody}
                </button>
              ) : (
                /* NOT A BUTTON, NOT FOCUSABLE, AND NOT ANNOUNCED AS ONE. The counts,
                   the states and the station marks are untouched - this strip still
                   answers "where is the work, and which stage wants me". Only the
                   door is gone, and with it the keycap that advertised one. */
                <div
                  key={stage.station}
                  className={chipClass}
                  data-state={stage.state}
                  data-on={on ? "true" : "false"}
                >
                  {chipBody}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="sp-mid">
          {/* P-81: `.sp-rail` itself hides below 640px now (shell.css, nested
              inside its own rule) -- `RailPhoneBar` takes over down there,
              mounted below. */}
          <aside className="sp-rail">
            {/* ── THE HEAD OF THE RAIL ─────────────────────────────────────
              Two controls the founder asked for on review and that did not
              exist: a way to START a piece of work, and a way to FIND one.

              NEITHER IS A ROW, and that is the contract rather than a layout
              preference. nav-model.ts's law is that features never add nav
              items, because the loop is the fixed spine of the product. An
              action and a field are not destinations, so they sit above the
              rows where Meridian's own rail (SidebarNav.tsx) puts them. */}
            <div className="sp-railhead">
              <RailNew narrow={narrow} />
              <FindAnything narrow={narrow} onExpand={expandRail} />
            </div>
            <nav className="sp-nav" aria-label="Main">
              {
                /*
                 * RUN ALWAYS DRAWS NOW (P-109, A-QUEUE.md). P-11 dropped the row
                 * whenever there was no id to complete its identity with; P-63
                 * named exactly what that cost -- "Run has no door to design for
                 * while nothing's live" -- so every row draws unconditionally,
                 * Run included, and `runDoor` below always has an answer for it:
                 * a live run, the last one, or `/start` with nothing to point at
                 * yet.
                 */
                RAIL.map(({ to, label, Icon, count, tier }) => {
                  const n = count ? counts[count] : 0;
                  // The key this row is actually bound to, read off the binding
                  // itself. "" for a row the keyboard does not reach.
                  const shortcut = doorKey(to);
                  // THE ROW THAT STAYS LIT. `activeProps` only knows this row's
                  // own route, so pressing 3 for Plan - or opening /govern - used
                  // to leave the whole rail dark. `railOwnerOf` answers the wider
                  // question the rail is actually asking, "which section am I
                  // in", and it is written on the same attribute the CSS already
                  // draws so nothing about the look is invented here.
                  // "page" is a promise that THIS row is the page you are on, so a
                  // row that is merely the section containing it says "true"
                  // instead. Both are drawn identically (shell.css matches the two
                  // tokens), so the rail looks the same and stops telling a screen
                  // reader you are on Runs when you are standing on Plan.
                  //
                  // BOTH READ THE IDENTITY `to`, NEVER THE RESOLVED HREF: Run's
                  // `to` is always "/track", so `owner`/`current` answer "am I on
                  // some track" the same way regardless of which one, and the
                  // `<Link>` below is the only place the live id enters.
                  const owner = railOwnerOf(pathname) === to;
                  const current = owner ? (under(pathname, to) ? "page" : "true") : undefined;
                  /*
                   * THE THREE RESOLUTIONS, SPENT (P-109). "none" points at
                   * Start rather than at nothing: `runDoor.trackId` is null
                   * exactly there, and `/start` is where a person builds the
                   * run this row currently has none of -- the same door
                   * `RailNew` already opens, composer auto-focused on
                   * arrival by that page's own effect.
                   */
                  const href = to;
                  return (
                    <Link
                      key={to}
                      to={href}
                      className="sp-navrow"
                      data-tier={tier}
                      activeProps={{ "aria-current": "page" }}
                      aria-current={current}
                      /* The name carries the key, and that is not decoration. In
                       the narrow rail this string IS the tooltip (shell.css
                       draws it from attr(aria-label)), so collapsing the rail
                       stops costing you the hint instead of hiding it, and a
                       screen reader is told the shortcut it could never have
                       seen drawn. Said in words rather than punctuation,
                       because "Today, 0" is a riddle when it is spoken.

                       THE PREFIX IS SPOKEN TOO, and it was missing. This read
                       "Today, shortcut t" while the visible keycap two lines
                       below correctly read "g t" -- so the sighted user was
                       told the truth and the screen-reader user was told a key
                       that does nothing, and the narrow rail's tooltip carried
                       the wrong one to everybody. Left over from the bare-key
                       scheme the chord replaced. "g then t" rather than "g t":
                       spoken, the space is inaudible and the two would run
                       together into one word. */
                      aria-label={[
                        label,
                        shortcut ? `shortcut ${NAV_CHORD_PREFIX} then ${shortcut}` : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    >
                      <Icon />
                      <span className="sp-navlabel">{label}</span>
                      {count && n > 0 ? (
                        /* NO FLOOR CAVEAT HERE ANY LONGER (P-18a). The old
                             "52+" existed because `getApprovalsQueue` bounded
                             ten families and could silently drop some of what
                             it counted; `gates` now reads open tracks with a
                             boundary call, one query with no families to
                             bound, so there is nothing left to flag as a
                             floor. See `listGatesOnTracks`'s own header. */
                        <span
                          className="sp-navcount"
                          data-hot={count === "gates" ? "true" : "false"}
                        >
                          {n}
                        </span>
                      ) : null}
                      {/* THE HINT, on the door it opens.
                        `sp-navcount` is worn for ONE property and it is not
                        colour: it is the only selector in shell.css that drops
                        a rail row's trailing text at 64px and under 900px, and
                        the keycap has to disappear with the label it annotates
                        or it collides with the icon in a 64px rail. The
                        keycap's own look is the inline style; the class is the
                        responsive rule. aria-hidden because the accessible
                        name above already says it, in better words. */}
                      {shortcut ? (
                        /* THE PREFIX IS DRAWN, not assumed. A keycap reading a
                         * bare "d" would be a promise the keyboard does not
                         * keep: `d` alone does nothing, `g` then `d` opens
                         * Discover. Showing both is also what teaches the chord
                         * without a tour, the way Gmail's "g i" does. */
                        <kbd
                          className="sp-navcount sp-navkey"
                          data-shortcut={`${NAV_CHORD_PREFIX} ${shortcut}`}
                          aria-hidden="true"
                          style={KEYCAP}
                        >
                          {NAV_CHORD_PREFIX} {shortcut}
                        </kbd>
                      ) : null}
                    </Link>
                  );
                })
              }
            </nav>
            {/* THE CREW, ON EVERY SURFACE (SPEC-MULTIPLAYER-PRESENCE 3.4).
                Mounted here, once, rather than per route: the whole point is
                that one glance answers "who is working and on what" wherever
                you are standing. It sits below the nav because it is a READ,
                not a destination - the rows above take you somewhere by name,
                this one takes you to whatever is moving right now. */}
            <RailCrew workspaceId={workspaceId} />
            {/* THE CURSOR LAYER (SPEC-MULTIPLAYER-PRESENCE 3.1-3.3), and it is
                mounted HERE for the reason 4 gives: "Cross-surface, so it
                lives with the shell. One implementation, never per-route."

                It renders `position: fixed` over the whole viewport, so it does
                not matter that it sits inside the rail in the tree - it is
                placed next to RailCrew because the two read the SAME query key
                and are two renderings of one fact, and keeping them adjacent is
                how the next person finds that out. */}
            <TeammateCursors workspaceId={workspaceId} />
            <div className="sp-railfoot">
              {/* THE BOARD, one click from anywhere (founder ruling
                2026-07-30). It opens the same board /runs draws, over the page
                you are on, so glancing at every run never costs you your
                place. It deliberately does NOT repeat the live line above:
                that says who is working, this says where all the work stands. */}
              <button
                type="button"
                className="sp-setbtn"
                onClick={() => setBoardOpen(true)}
                title="Every run"
                aria-label="Every run"
                aria-haspopup="dialog"
                aria-expanded={boardOpen}
              >
                <IconBoard />
              </button>
              {/* THE THEME, which was reported broken and was in fact absent.
                `use-theme.tsx` has been a complete light/dark/system system the
                whole time with no control anywhere in the shell, and the
                Settings link beside it was drawn as a SUN, in the corner every
                application puts a theme toggle. So the founder pressed the
                theme switcher, got Settings, and reported it as not working.
                He was reading the icon correctly; the icon was wrong. */}
              <button
                type="button"
                className="sp-setbtn"
                onClick={toggleTheme}
                title={THEME_TITLE[theme]}
                aria-label={THEME_TITLE[theme]}
              >
                {theme === "light" ? <IconSun /> : <IconMoon />}
              </button>
              {/* Settings holds a key too (`s`), and it is a door in the foot
                rather than a row, so the hint rides its name instead of a
                keycap: three 34px icon buttons in a 236px foot have no room
                for an annotation, and a keycap crammed under a gear would be
                the noise the founder is already complaining about. Derived
                from the same lookup as the rows above, so it cannot drift
                either.

                IT NOW HOLDS AGENTS TOO (2026-08-15). The Crew row left the rail
                and its surface lives behind this door, so this control lights
                for /crew and /boundary as well as for /settings, and carries
                the count of agents asking for more room. Both of those are what
                stop a demotion becoming a disappearance. See `settingsOwns`. */}
              <Link
                to="/settings"
                className="sp-setbtn"
                /* The same stale-prefix defect the rail rows carried: this said
                   "shortcut s", and `s` alone opens nothing. The gear is the
                   ONLY place Settings' key is stated anywhere in the product --
                   it draws no keycap (three 34px buttons in a 236px foot have
                   no room) and the command palette that used to list it is not
                   mounted -- so this string was the whole affordance, and it
                   was wrong.

                   THE COUNT IS SPOKEN, NEVER LEFT AS A BARE NUMBER. A dot in a
                   corner says nothing out loud, and "2" on its own is a number
                   with no noun. */
                title={settingsTitle}
                aria-label={settingsTitle}
                aria-current={settingsOwns(pathname)}
                activeProps={{ "aria-current": "page" }}
              >
                <IconGear />
                {/* THE QUIET COUNT, and deliberately not the gate treatment.
                  `data-hot="false"` is the same neutral the Runs row's count
                  wears; orchid is reserved for "a person is REQUIRED" and an
                  agent proposing that it stops asking is available rather than
                  owed. Nothing at all is drawn at zero, per the standing ruling
                  that an empty chip stays blank rather than saying "none". */}
                {askingCount > 0 ? (
                  <span
                    /* Keyed on the number so a CHANGE remounts the disc and
                       replays its arrival. Without the key it mounts once and
                       the count going from one to two changes a glyph in
                       silence, which is the whole event. */
                    key={askingCount}
                    className="sp-setcount"
                    data-hot="false"
                    aria-hidden="true"
                  >
                    {askingCount}
                  </span>
                ) : null}
              </Link>
              {/* THE DOOR ONTO THE KEYBOARD, and it is drawn rather than left
                to be guessed. `?` is what Gmail, GitHub, Linear, Jira, Slack,
                Notion and Superhuman all bind, so most people will try it --
                but "most people will try it" is not a door, it is a hope, and
                this repo's signature defect is a capability with no door.

                IT IS A KEYBOARD NOW, NOT A QUESTION MARK (founder, 2026-08-15).
                The old glyph was the character itself, which was clever and was
                also the wrong word: "?" means HELP generically -- docs, support,
                a tour -- and this door opens exactly one thing. A keyboard says
                which one. The key that opens it is unchanged and still spoken in
                the accessible name, so nothing is lost to a reader who cannot
                see the glyph; and the button stops being the one control in the
                foot holding a text character among three stroked icons. */}
              <button
                type="button"
                className="sp-setbtn sp-keysbtn"
                onClick={() => setKeysOpen(true)}
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts, press question mark"
                aria-haspopup="dialog"
                aria-expanded={keysOpen}
              >
                <IconKeyboard />
              </button>
              {/* The rail collapse used to be the fifth control here. It is in
                the header now, beside the brand — see `.sp-lede` above and the
                note on `.sp-collapse` in shell.css. */}
            </div>
          </aside>

          {/* The work region is a scroll container and nothing else. A ported
            surface opts into .sp-inner; an unported one renders raw so its
            own padding is not doubled. See shell.css TRANSITION RULE. */}
          {/* SAID ONCE, ABOVE EVERYTHING, because it is true of the tab and
              not of any one region. Sits outside `sp-work`'s key so it does not
              remount on navigation: the session is still ended on the next
              page, and a notice that flickers away when you click something
              reads as a glitch rather than a fact. */}
          {sessionEnded ? (
            <div
              role="alert"
              className="flex items-baseline gap-mrd-3 border-b border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-3 text-mrd-data leading-mrd-prose text-mrd-ink"
            >
              <span>{sessionEnded}</span>
              <Link
                to="/login"
                className="whitespace-nowrap text-mrd-you underline underline-offset-2"
              >
                Sign in
              </Link>
            </div>
          ) : null}
          {/* `id` + `tabIndex={-1}` (P-16b, A-QUEUE.md): the skip link's landing
              spot. `<main>` is not natively focusable, so without `tabIndex`
              a click or Enter on the skip link would scroll here but leave
              keyboard focus behind at the link itself -- the next Tab press
              would walk right back into the rail it was meant to skip past. */}
          <main className="sp-work" id="main-content" tabIndex={-1} key={pathname}>
            {/* THE SAME FACT, CARRIED DOWN RATHER THAN RECOMPUTED (S4-167).
              The banner above is the ONE door. A region inside that offers a
              second remedy - "Try again" against a dead token - offers what the
              product cannot honour. Regions holding an `error` already resolve
              this through `wayOut`; the workspaces arm has no error to hold,
              because every board query is workspace-gated and therefore idle in
              exactly that state. So the shell hands its own answer down. No new
              read. */}
            <SessionEndedProvider value={sessionEnded}>{children}</SessionEndedProvider>
          </main>
        </div>
        <BoardPanel open={boardOpen} onClose={() => setBoardOpen(false)} />
        {/* The keyboard, on `?` from anywhere. It is mounted here rather than
          beside GotoShortcuts because the sheet needs the pathname to answer
          "what do the keys do HERE", and the shell is what knows it. */}
        <ShortcutSheet open={keysOpen} onClose={() => setKeysOpen(false)} pathname={pathname} />
        {/* THE MOUNT THAT WAS MISSING. `openLineage()` has fired a window event
        with no listener since 2026-07-13, because this component was written,
        tested and never rendered anywhere. That is why BetCard's audit tag has
        been a control that does nothing when pressed. It renders null until
        something opens it, so mounting it costs nothing until it is used. */}
        <AuditLineageSheet />
        {/* P-81: the rail's phone-width replacement. Fixed-position, renders
            nothing above 640px (its own `sm:hidden`) -- mounted once here
            rather than inside `.sp-rail` so it survives the rail's own
            `display: none` at that width. `liveLead` is `.sp-live`'s own
            first fact, carried down rather than recomputed. */}
        <RailPhoneBar
          liveLead={liveLead ?? undefined}
          onLiveClick={strip?.mode === "tab" ? undefined : liveTarget.go}
          liveTitle={strip?.mode === "tab" ? undefined : liveTarget.title}
        />
      </div>
    </RunStripProvider>
  );
}
