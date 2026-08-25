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

import * as React from "react";
import { approvalsQueueKey, missionsKey } from "@/lib/query-keys";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { useWorkspace } from "@/hooks/use-workspace";
import { MarkStack } from "@/components/meridian/marks";
import { GLYPH_FOR_STATION, StationGlyph } from "@/components/meridian/station-glyphs";
import { RunStripProvider, STAGE_LABEL, STATION_ROUTE, type RunStripSpec } from "./run-strip";
import { agentDisplayName, agentStation, type AgentStation } from "@/lib/agent-vocabulary";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { supabase } from "@/integrations/supabase/client";
import { listMissions } from "@/lib/missions.functions";
import { listAgents } from "@/lib/agents.functions";
import { listCrew } from "@/lib/crew.functions";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { listTracks } from "@/lib/spine/track.functions";
import { initialsFrom } from "@/lib/initials";
import { useTheme } from "@/hooks/use-theme";
import {
  ENGINE_ROOM_PATHS,
  FOOTER_NAV,
  PRIMARY_NAV,
  navKeyHint,
  NAV_CHORD_PREFIX,
} from "@/lib/nav-model";
import { BoardPanel } from "./BoardPanel";
import { ShortcutSheet, useShortcutSheetKey } from "./ShortcutSheet";
import { AccountMenu, ScopeMenu } from "./ScopeMenu";
import { AuditLineageSheet } from "@/components/supaprod/AuditLineageSheet";
import {
  IconApprovals,
  IconAsk,
  IconBrain,
  IconCrew,
  IconEngine,
  IconBoard,
  IconFind,
  IconGear,
  IconKeyboard,
  IconMoon,
  IconPlus,
  IconRailCollapse,
  IconRailExpand,
  IconSun,
  IconRuns,
  IconThreads,
  IconToday,
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

/** Paths owned by the Today row. Approvals is a high-urgency surface that was
 *  previously unreachable from the rail; making Today own it ensures the row
 *  stays lit when users navigate there. */
const APPROVALS_PATHS: readonly string[] = ["/approvals"];

/** Boundary (autonomy management) is reached from Agents, so it belongs to
 *  whichever control Agents belongs to. Since 2026-08-15 that is the Settings
 *  door in the rail foot rather than a row. */
const BOUNDARY_PATHS: readonly string[] = ["/boundary"];

const TODAY_PATHS: readonly string[] = ["/today"];
const BRAIN_PATHS: readonly string[] = ["/brain"];

/** Paths that live behind the Settings door but are not under /settings.
 *  Agents is the roster at /crew, which Settings now holds. */
const SETTINGS_PATHS: readonly string[] = ["/crew"];

/** Paths owned by the Brain row. Threads (conversation history) is reached from
 *  Brain and should keep the Brain row lit. */
const THREADS_PATHS: readonly string[] = ["/threads"];

/** The five rail rows. Decided, and not to be relitigated. Settings is not
 *  one of them: it is an icon at the foot, a door you open rather than a
 *  place you live.
 *
 *  `owns` IS THE PLACE-KEEPING FIX (2026-08-05). A row lights for its own path
 *  and for the paths it owns. It exists because seven bound keys - 1..7, the
 *  loop stations - navigate to surfaces that are NOT rail rows and never will
 *  be, so the rail went blank the moment you used the keyboard: press 3, land
 *  on Plan, and the shell stopped saying where you were standing.
 *
 *  The fix is NOT a row per station. That was decided twice and against, most
 *  recently in run-strip.tsx on this same day, which chose the 01-07 strip as
 *  the place the seven stations live and paid 97px of viewport on 13 surfaces
 *  to keep the rail at five. Two controls, two altitudes: the RAIL says which
 *  SECTION you are in, the STRIP says which STATION. The founder's own ruling
 *  is that the strip belongs to "the run section" (run-strip.tsx, 2026-07-29),
 *  and use-spine-strip.ts calls /runs "the section entry rather than one of the
 *  seven" - so /runs is the row the seven stations hang under, and lighting it
 *  on /plan is a restatement of the model rather than a claim invented here.
 *
 *  The engine room's list was already declared in nav-model.ts and consumed by
 *  nothing: /govern, /trust-ledger and /sync land inside the engine room and
 *  the row went dark on all three. Same defect, and it is fixed by the same
 *  field rather than by a second mechanism.
 */
/*
 * ── TWO TIERS, DECIDED 2026-08-15 ───────────────────────────────────────
 *
 * This was five equal rows. The founder's objection was that it read as a
 * menu rather than as a place to work, and he is right: Crew and Engine room
 * are not daily destinations, they are places you VISIT to configure
 * something. Sitting them at the same altitude as Today told the reader all
 * five mattered equally, every day, which is false.
 *
 * PRIMARY is where the work happens. SECONDARY is everything else that still
 * deserves a named row rather than an unlabelled glyph in the foot — which is
 * the other half of the complaint, and the reason these did not simply move
 * down there.
 *
 * RUNS STAYS PRIMARY, against the founder's instinct, and this is the one
 * place I am pushing back. His reasoning was that the strip already covers the
 * stations so the row is redundant. The strip navigates to a STATION; `/runs`
 * lists RUNS — one piece of work walking all seven. Those are perpendicular
 * axes. Remove the row and there is no door left to the list of work items,
 * only doors to stages. That confusion has a history here: it is what put
 * Build's engine at /runs and left the real one unbuilt.
 *
 * ── FOUR DOORS, 2026-08-15, AND CREW IS THE ONE THAT LEFT ───────────────
 *
 * Today · Runs · Brain · Guardrails. Crew, renamed Agents, moved into Settings.
 * "Engine room" became "Guardrails" on the same pass; its reasoning is on the
 * row itself.
 *
 * THE RAIL IS THE MOST EXPENSIVE REAL ESTATE IN THE PRODUCT and it should go to
 * surfaces touched DURING work. Three measurements decided this rather than
 * taste:
 *
 *   1. AUTONOMY IS CONFIGURATION, NOT WORK. Across all 77 agents,
 *      `agent_autonomy.set_at` covers 14 distinct days between 2026-06-04 and
 *      2026-08-06, and nothing in the nine days since. That is a set-and-revisit
 *      cadence. A door you open twice a month does not earn a permanent row
 *      above the door to everything the product knows.
 *
 *   2. ITS ONE DECISION-SHAPED SECTION IS NOT A QUEUE. "Asking for more room"
 *      reads urgent and is not: `asking` is derived client-side in
 *      `_authenticated.crew.tsx` from each agent's own track record — it has
 *      done the same thing cleanly enough times to propose it stops asking.
 *      Nothing is blocked while it sits, there is no counterparty and no clock.
 *      It is the product proposing an optimisation, not an agent at a gate.
 *
 *   3. WHAT GENUINELY BLOCKS IS ALREADY VISIBLE. `agent_approvals` has pending
 *      rows, they live at /approvals, and they already light the seven-station
 *      strip as "waiting on you". Crew was never carrying that load, so moving
 *      it costs no urgency.
 *
 * WHAT THE MOVE MUST NOT LOSE, and this is the half a demotion usually drops:
 * the suggestion is genuinely valuable, so the rail foot's Settings control
 * carries a QUIET COUNT of agents asking. Not the gate treatment: orchid means
 * a person is REQUIRED, and by (2) this is available rather than owed. Zero
 * draws nothing at all, per the standing ruling that an empty chip stays blank
 * rather than saying "none".
 *
 * AND `railOwnerOf` NO LONGER ANSWERS FOR /crew. The keyboard still binds `g c`
 * to it, so the foot's Settings control takes ownership of /crew and /boundary
 * instead — see `settingsOwns` below. Without that the chord would land
 * somewhere the shell cannot name, which is the exact defect
 * `AppFrame.rail-covers-keys.test.ts` exists to catch.
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
  {
    to: "/today",
    label: "Today",
    Icon: IconToday,
    count: null,
    owns: TODAY_PATHS,
    tier: "primary",
  },
  // APPROVALS, ITS OWN ROW, 2026-08-24. The gates count rode on Today since
  // the rail existed; the founder asked for a door of its own and the
  // reasoning holds - a person-required surface was a chip on somebody
  // else's row. Today keeps the feed; Approvals carries the count and the
  // orchid treatment the count earns.
  {
    to: "/approvals",
    label: "Approvals",
    Icon: IconApprovals,
    count: "gates",
    owns: APPROVALS_PATHS,
    tier: "primary",
  },
  // Runs points at /runs, NOT at /m. /m is Mission Control, the one surface the
  // rebuild never ported, so the rail's own row for the engine's spine was
  // landing on the legacy five-region shell. That is the founder's "the run
  // section is still rendering in the legacy design", and this line is where it
  // started. /runs is the same surface the route used to call /build, renamed
  // because a run is the whole lifecycle and never was the build leg.
  {
    to: "/runs",
    label: "Runs",
    Icon: IconRuns,
    count: "runs",
    owns: LOOP_STATIONS,
    tier: "primary",
  },
  {
    to: "/brain",
    label: "Brain",
    Icon: IconBrain,
    count: null,
    owns: BRAIN_PATHS,
    tier: "primary",
  },
  // THREADS, ITS OWN ROW, same ruling as Approvals above: the conversations
  // archive was one cell on Brain's substrate grid, a whole surface with no
  // front door. No keycap - every letter of its label is taken, and the law
  // drops a door rather than invents a letter.
  {
    to: "/threads",
    label: "Threads",
    Icon: IconThreads,
    count: null,
    owns: THREADS_PATHS,
    tier: "primary",
  },
  /*
   * ── "GUARDRAILS", NOT "ENGINE ROOM" ───────────────────────────────────
   *
   * FOUNDER, 2026-08-15: "Engine Room is a ratifying word. I don't know what
   * word we need to use to make it simple, one word which would do the job."
   * He rejected "Controls" on the way here, and rightly: controls is the
   * language of a mechanical or physical product, and this is software.
   *
   * THE EVIDENCE IS IN THE SCHEMA AGAIN. `guardrail_hits` carries 340 rows, so
   * the data model has been using this word while the UI said something else —
   * the same shape of defect as Crew above, found the same way. It is also
   * native to agentic software rather than borrowed from machinery.
   *
   * WHAT IS BEHIND THE DOOR agrees: Quality, Safety, Spend, Routines, Verify
   * and Record. That is not an engine. It is where you set what agents may do
   * and what they may cost, and check afterwards that they held.
   *
   * "ENGINE" WAS ALREADY TAKEN, which is the argument against keeping any part
   * of it. `use-spine-strip.ts` carries the founder's ruling that clicking a
   * station "must open that station's engine" — seven stations, seven engines,
   * and the strip that draws them sits TEN PIXELS above this row. A door called
   * Engine anything is a second, different meaning of the word inside one
   * glance.
   *
   * THE LABEL ONLY. Route, folder, components and test ids stay
   * `/engine-room`. `nav-model.ts` has meanwhile been calling this door
   * "Pulse", so the product was already saying two things; it now says one.
   * The bound letter survives the rename intact: `u`, for pUlse, is also in
   * gUardrails.
   */
  {
    to: "/engine-room",
    label: "Guardrails",
    Icon: IconEngine,
    count: null,
    owns: ENGINE_ROOM_PATHS,
    tier: "secondary",
  },
] as const;

/*
 * ONE LITERAL, A `tier` FIELD, NOT TWO ARRAYS — and the colocated guards are
 * the reason. `AppFrame.rail-covers-keys.test.ts` and the nav-model suite read
 * this block out of the SOURCE TEXT, by finding `const RAIL = [` and slicing to
 * `] as const;`. Splitting the rail into `RAIL_PRIMARY` and `RAIL_SECONDARY`
 * with `const RAIL = [...a, ...b]` left that marker matching a block containing
 * no rows at all, so three guards that enforce "every rail row has a key" and
 * "no row's ownership swallows another's door" quietly passed over an empty
 * list. They failed loudly instead, which is exactly what they are for.
 *
 * Keeping one literal keeps those guards reading the real rows, and the tier is
 * just a field the render groups on.
 */
const RAIL_PRIMARY = RAIL.filter((r) => r.tier === "primary");
const RAIL_SECONDARY = RAIL.filter((r) => r.tier === "secondary");

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
 * PURE - which rail row must be lit for this path. Approvals is owned by Today,
 * Threads by Brain. Previously these were unreachable dead zones; now each is
 * owned by a rail row so the row stays lit when navigating there.
 *
 * A row's OWN path wins over any other row's ownership claim, which is why
 * this is two passes and not one: /runs owns /build, and if /build ever became
 * a row it must light itself rather than its former owner.
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
export const STATION_DOORS: ReadonlyArray<{ station: string; to: string; key: string }> =
  Object.entries(STATION_ROUTE).map(([station, to]) => ({ station, to, key: doorKey(to) }));

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
const CREW = "The crew";

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
        <span className="sp-auto" title="The crew raised this on its own">
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
 * How often the live line re-reads, given whether anything is actually moving.
 *
 * Returns false while the tab is hidden, so a backgrounded tab costs nothing.
 * The cadence follows the strength of the claim being made: while a run is
 * working the header asserts something second by second and has to keep up;
 * idle, it is only waiting for work to appear.
 */
function livePoll(anyWorking: boolean): number | false {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return false;
  return anyWorking ? LIVE_POLL_WORKING_MS : LIVE_POLL_IDLE_MS;
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
function RailNew({ narrow }: { narrow: boolean }) {
  return (
    <Link
      to="/runs"
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

/** What a found thing is, said in one word beside it. A run title and a
 *  station name are otherwise two identical rows and the reader has to guess
 *  which one goes where. */
type FoundKind = "run" | "go";
type Found = {
  key: string;
  label: string;
  kind: FoundKind;
  to: string;
  params?: { missionId: string };
};

/**
 * ── SEARCH, THE SECOND OF THE THREE ─────────────────────────────────────
 *
 * WHAT IT SEARCHES, AND WHY THAT IS THE ONLY HONEST ANSWER. Meridian's rail
 * filters its own rows; this rail has five, and a field that narrows five
 * visible rows is theatre. There is no workspace-wide search service in this
 * product and inventing a UI for one would be a door onto nothing.
 *
 * So it searches the two things the shell ALREADY HOLDS and can therefore
 * answer for truthfully:
 *   · RUNS, off the `missions` read the live line is already polling. No new
 *     query, no new server function, no second cache key — the header and the
 *     field are reading one fact.
 *   · DESTINATIONS, off `RAIL` and `STATION_ROUTE`, the same two lists the
 *     rail and the strip draw from. Typing "disc" jumps to Discover, which is
 *     the other half of what anyone means by search in a rail.
 *
 * A run wins over a destination when both match, because a person who types
 * four words is naming a thing, not a place.
 *
 * NO KEYCAP, and it is not an oversight. `/` is bound to nothing here and
 * `key-model.ts` holds a drift test over what each surface binds, in both
 * directions. Drawing a `/` cap would promise a key that does not fire, which
 * is this shell's own definition of a lie. The cap arrives with the binding.
 */
function RailFind({
  narrow,
  runs,
  onExpand,
}: {
  narrow: boolean;
  runs: ReadonlyArray<{ id: string; title: string }>;
  onExpand: () => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const box = React.useRef<HTMLInputElement | null>(null);

  const found = React.useMemo<Found[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out: Found[] = [];
    for (const m of runs) {
      // The title as a person reads it. `[auto]` is a dedup marker from the
      // trigger pipeline and must never reach a user, here included.
      const clean = stripAutoPrefix(m.title);
      if (!clean.toLowerCase().includes(needle)) continue;
      out.push({
        key: `run:${m.id}`,
        label: clean,
        kind: "run",
        to: "/runs/$missionId",
        params: { missionId: m.id },
      });
      if (out.length === 6) break;
    }
    for (const row of RAIL) {
      if (row.label.toLowerCase().includes(needle)) {
        out.push({ key: `go:${row.to}`, label: row.label, kind: "go", to: row.to });
      }
    }
    for (const [station, to] of Object.entries(STATION_ROUTE)) {
      const label = STAGE_LABEL[station as AgentStation];
      if (label.toLowerCase().includes(needle)) {
        out.push({ key: `go:${to}`, label, kind: "go", to });
      }
    }
    return out;
  }, [q, runs]);

  const open = found.length > 0 || q.trim().length > 0;

  const go = React.useCallback(
    (hit: Found) => {
      setQ("");
      void navigate({ to: hit.to, params: hit.params } as never);
    },
    [navigate],
  );

  if (narrow) {
    return (
      <button
        type="button"
        className="sp-findbtn"
        onClick={() => {
          onExpand();
          // The rail animates its width, so the field is not in the layout the
          // frame this fires. One frame later it is.
          requestAnimationFrame(() => box.current?.focus());
        }}
        title="Find a run"
        aria-label="Find a run, opens the rail"
      >
        <IconFind />
      </button>
    );
  }

  return (
    <div className="sp-find">
      <IconFind />
      <input
        ref={box}
        type="text"
        value={q}
        placeholder="Find a run"
        aria-label="Find a run or a station"
        onChange={(e) => {
          setQ(e.target.value);
          setCursor(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQ("");
            return;
          }
          if (found.length === 0) return;
          /*
           * The cursor is clamped ONCE, here, rather than trusted. Typing
           * shortens the list under it, so the index held from the last render
           * can be past the end by the time a key arrives.
           *
           * WRITTEN AS A VALUE, NOT A FUNCTIONAL UPDATER, and that is
           * deliberate rather than stylistic. `no-fabricated-agent-steps.test`
           * bans `setX(c => (c + 1) % list.length)` in any file that also holds
           * a timer, because that is the exact shape of a fake agent walking a
           * label list on an interval -- and this file does hold a timer, for
           * the live line's clock. The guard cannot tell a keypress from a
           * tick, and it is right not to try: the shape is the tell. `cursor`
           * is stable inside one handler, so the updater bought nothing here
           * anyway.
           */
          const at = Math.min(cursor, found.length - 1);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor(at === found.length - 1 ? 0 : at + 1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor(at === 0 ? found.length - 1 : at - 1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(found[at]);
          }
        }}
      />
      {open ? (
        <div className="sp-findlist" role="listbox" aria-label="Results">
          {found.length === 0 ? (
            /* A search that matched nothing says so. A blank panel reads as a
               broken component rather than as an answer. */
            <p className="sp-findnone">Nothing here matches that.</p>
          ) : (
            found.map((hit, i) => (
              <button
                key={hit.key}
                type="button"
                role="option"
                aria-selected={i === cursor}
                className="sp-findrow mrd-focus-inset"
                data-on={i === cursor ? "true" : "false"}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(hit)}
              >
                <span className="sp-findrow-text">{hit.label}</span>
                <span className="sp-findrow-kind">{hit.kind === "run" ? "run" : "go"}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  // Only the id. The NAME and the product moved to ScopeMenu, which owns the
  // scope control now; keeping a second copy here is how two headers drift.
  const { activeWorkspace } = useWorkspace();

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
   *      beautifui.dev's left plane names every destination, always, and that
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
  const fetchQueue = useServerFn(getApprovalsQueue);
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
      return livePoll(rows.some((m) => WORKING.has(m.status)));
    },
    placeholderData: keepPreviousData,
  });
  const queue = useQuery({
    queryKey: approvalsQueueKey(workspaceId),
    queryFn: () => fetchQueue({ data: { workspaceId: workspaceId ?? undefined } }),
    staleTime: 30_000,
    // A waiting call is not moving, so the queue never needs the fast cadence;
    // it only has to notice a NEW one arriving.
    refetchInterval: () => livePoll(false),
    placeholderData: keepPreviousData,
  });

  /* THE WALK THE HEADER COULD NOT SEE.
   *
   * The live line above reads missions, and a spine track only becomes a
   * mission at Build (`driver.server.ts:674`). A run moving through Discover,
   * Decide or Plan wrote `spine_tracks.driven_at` and station activity while
   * this header went on saying "Nothing running" -- the exact invisibility the
   * mission exists to end (EVIDENCE.md §2: nine tracks sat waiting on a person
   * with nothing anywhere saying so). This read is the header's second ear: an
   * open track driven within the last five minutes IS a run that moved, said by
   * its own row and never inferred from anything else. Five minutes, because
   * the foreground walk updates per seat and the cron's round-robin can leave
   * gaps shorter than that; a track idle longer than it is a stopped one and
   * stays silent here rather than wearing a live dot it did not earn.
   */
  const fetchOpenTracks = useServerFn(listTracks);
  const openTracks = useQuery({
    queryKey: ["shell", "open-tracks"],
    queryFn: () => fetchOpenTracks(),
    staleTime: 30_000,
    refetchInterval: () => livePoll(false),
    placeholderData: keepPreviousData,
  });
  const movingRuns = React.useMemo(() => {
    const cutoff = Date.now() - 5 * 60_000;
    return (openTracks.data ?? [])
      .filter((t) => t.drivenAt !== null && new Date(t.drivenAt).getTime() >= cutoff)
      .sort((a, b) => (b.drivenAt ?? "").localeCompare(a.drivenAt ?? ""));
  }, [openTracks.data]);

  const rows = React.useMemo(() => missions.data?.missions ?? [], [missions.data]);
  const running = React.useMemo(() => rows.filter((m) => WORKING.has(m.status)), [rows]);
  const gateCount = queue.data?.items.length ?? 0;

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

  // Who is waiting on YOU. The queue names its own owner (a real slug on a
  // tool-call gate, else the owning station's specialist), which is the same
  // attribution Today and /approvals draw, so the header cannot disagree with
  // the surface you land on.
  const waiting = React.useMemo(() => {
    const seen = new Set<string>();
    const list: Worker[] = [];
    for (const item of queue.data?.items ?? []) {
      const slug = item.agentSlug ?? null;
      const key = slug ?? CREW;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(slug ? { slug } : { slug: null, name: CREW });
    }
    return list;
  }, [queue.data]);

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
    if (missions.isError) return "Cannot see what is running";
    if (missions.isLoading) return null;
    if (running.length === 0) {
      if (gateCount > 0) {
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
        return label ? `The crew is moving · ${label}` : "The crew is moving";
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
      ? `${CREW} is working`
      : `${CREW} is working on ${running.length} runs`;
  }, [
    missions.isError,
    missions.isLoading,
    running.length,
    gateCount,
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
      // The one in front. Today opens on the same item, so the header is
      // naming the call you will actually land on.
      const first = queue.data?.items[0];
      if (first?.title) out.push(<TitleFact title={first.title} />);
      const at = first?.timestamp ? since(first.timestamp) : null;
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
  }, [missions.isError, missions.isLoading, running, gateCount, queue.data, lastDone]);

  // The marks, and the colour law in three lines: a working agent wears its
  // stage hue, an agent waiting on you wears ember without blinking, and a
  // chrome with nothing happening wears a grey dot and no colour at all.
  /**
   * WHO IS ON IT, and the one case where this header may blink.
   *
   * Founder, 2026-07-30: "if something is waiting for me it should be blinking.
   * If you just keep it that way, how would a user even know that something he
   * needs to act on?" Fair, and the answer is not simply to turn the blink on,
   * because SYSTEM.md rations it: "`gate` blinks and is the only blink in the
   * system, so exactly one mark on a screen may wear it: THE ONE THING ACTUALLY
   * ASKING."
   *
   * Read that rule literally and it decides this. On Today and Approvals the
   * real gate card is on screen, it is the thing actually asking, and it owns
   * the blink; a second one in the header beside it would be the dozen-blinking
   * -marks failure the rule was written after. Everywhere else, this header is
   * the ONLY thing on screen that knows a call is waiting, so it IS the thing
   * asking, and blanket-suppressing it was me applying the letter of the rule
   * against its purpose.
   *
   * So the blink follows the rule rather than a surface list: it lands on
   * whichever mark is genuinely the only one asking, and there is never more
   * than one, on any screen.
   */
  const gateSurfaceOnScreen = pathname.startsWith("/today") || pathname.startsWith("/approvals");
  const liveMarks =
    running.length > 0 && workers.length > 0 ? (
      <MarkStack agents={workers} state="running" />
    ) : running.length === 0 && waiting.length > 0 ? (
      <MarkStack agents={waiting} state={gateSurfaceOnScreen ? "waiting" : "gate"} />
    ) : null;

  const liveState = running.length ? "running" : gateCount ? "gate" : "idle";

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
    const go = (to: string, params?: Record<string, string>) => () =>
      void navigate({ to, params } as never);
    if (gateCount > 0) {
      // Today is where a call is settled, and the header already names the
      // item Today opens on, so the sentence and the landing agree.
      return { go: go("/today"), title: "Go to the calls waiting on you" };
    }
    if (running.length === 1) {
      const only = running[0];
      return {
        go: go("/runs/$missionId", { missionId: only.id }),
        title: "Open the run that is working",
      };
    }
    if (running.length > 1) return { go: go("/runs"), title: "See every run" };
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
      return {
        go: go("/runs/$missionId", { missionId: lastDone.id }),
        title: "Open the last run that finished",
      };
    }
    return { go: go("/runs"), title: "See every run" };
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
        <header className="sp-top">
          {/* THE BRAND AND THE RAIL TOGGLE, AS ONE BLOCK. Founder, 2026-08-15:
            the collapse control belongs at the top, next to the logo. See
            `.sp-collapse` in shell.css for why the rail foot was the wrong home
            for it — chiefly that below 640px the rail is `display: none`, so the
            control that reveals the rail vanished with the rail. */}
          <div className="sp-lede">
            <Link to="/today" className="sp-brand" aria-label="Supaprod, go to Today">
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
              {/* WHO, before how many. A fixed-height slot, so swapping the
                  quiet dot for a mark stack cannot move the line, and the
                  header stays 56px in every state. */}
              <span className="sp-live-who">
                {liveMarks ?? <span className="sp-live-dot" data-state={liveState} />}
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

        {/* Permanent whenever a run surface published one. No collapse, by
          ruling. Two modes, and the ARIA is not cosmetic: a tablist promises
          exactly one selection at all times, which is a lie on the board,
          where opening unfiltered is the normal state. So the board is a group
          of toggles and says so. See run-strip.tsx. */}
        {strip ? (
          <div
            className="sp-strip"
            role={(strip.mode ?? "tab") === "tab" ? "tablist" : "group"}
            aria-label={strip.label ?? "The seven stages of this run"}
          >
            {strip.stages.map((stage, i) => {
              const on = stage.station === strip.active;
              const asTab = (strip.mode ?? "tab") === "tab";
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
              const stageKey = asTab ? "" : doorKey(STATION_ROUTE[stage.station]);
              return (
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
                  className="sp-stage mrd-focus-inset"
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
                  onClick={() => strip.onSelect(stage.station)}
                >
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
                  <span className="sp-stage-state">{stage.note}</span>
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
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="sp-mid">
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
              <RailFind narrow={narrow} runs={rows} onExpand={expandRail} />
            </div>
            <nav className="sp-nav" aria-label="Main">
              {[
                { rows: RAIL_PRIMARY, divider: false },
                /*
                 * The divider is the whole point of the second tier: it says
                 * "these are a different kind of thing" without spending a
                 * word, a colour or an indent on saying it. Hidden when the
                 * rail is narrow, where there are no labels to separate and a
                 * rule between two icons reads as damage.
                 */
                { rows: RAIL_SECONDARY, divider: true },
              ].flatMap(({ rows, divider }) => [
                divider && !narrow ? (
                  /* The key is "tier-rule" rather than "sp-tier-rule": the class
                     name stays, but a React key is not a class and the scanner
                     cannot tell them apart. The rows keep their own keys off
                     `to`, so nothing else in this list is reconciled by it. */
                  <span key="tier-rule" aria-hidden className="sp-navrule" />
                ) : null,
                ...rows.map(({ to, label, Icon, count }) => {
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
                  const owner = railOwnerOf(pathname) === to;
                  const current = owner ? (under(pathname, to) ? "page" : "true") : undefined;
                  return (
                    <Link
                      key={to}
                      to={to}
                      className="sp-navrow"
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
                      aria-label={
                        shortcut ? `${label}, shortcut ${NAV_CHORD_PREFIX} then ${shortcut}` : label
                      }
                    >
                      <Icon />
                      <span className="sp-navlabel">{label}</span>
                      {count && n > 0 ? (
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
                }),
              ])}
            </nav>
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
          <main className="sp-work" key={pathname}>
            {children}
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
      </div>
    </RunStripProvider>
  );
}
