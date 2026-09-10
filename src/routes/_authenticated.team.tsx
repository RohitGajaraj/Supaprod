/**
 * CREW. Redesigned, not ported (SURFACE-JUSTIFICATION.md, founder-directed
 * 2026-07-29). The prototype decided the roster GRID and its stage-hue
 * encoding, so that part is a legitimate re-skin and survives verbatim.
 * Everything else on this surface is new, because the founder's own reading of
 * the old one was that it had nothing to do:
 *
 *   "If you see the crew section, it is just a display of what it is, but there
 *    is no action items there. So if I click on a Discover agent, what will
 *    happen inside? In Settings we have something called agent roster. Can we
 *    bring all those things here, or queue things here?"
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    The person who owns the workspace, here to change how much rope ONE agent
 *    gets, and then leave. The sentence in their head is "stop asking me before
 *    Engineer opens a pull request" or "Watch has been wrong twice, pull it
 *    back". Nobody opens Crew to admire thirteen icons, which is exactly what
 *    the old surface offered, and why it failed.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS TO MAKE POSSIBLE.
 *    Setting how much a named worker may decide alone. That is the governance
 *    canon's own split (GOVERNANCE-PRINCIPLE.md): policy is set in advance and
 *    does not block; permission is asked in the moment and does. It is also why
 *    these controls belong HERE rather than in Settings. Settings is where you
 *    configure an application. Crew is where you decide how much rope your
 *    workforce gets, and that is a different act by a person in a different
 *    frame of mind. Everything else on this page supports that or is gone.
 *
 * 3. KEEP / MOVE / KILL, every element.
 *    KEEP  the roster grid and the stage groups. Decided by the prototype.
 *    KEEP  the live mark states. A running agent is marked while it runs and
 *          stops when the run does.
 *    KILL  the standing sentence "The shape is the agent, the colour is the
 *          stage it works in. Ember and blinking means it is waiting on you."
 *          Every stage group is already headed by its own mark and its own
 *          name, so the legend teaches itself; and the half about what is
 *          asking now sits next to the thing actually asking, where it is a
 *          fact rather than a rule to memorise. Three sentences of instruction
 *          for a legend that the layout already draws is scaffolding, not
 *          design.
 *    KILL  the listMissions read. It answered "is this agent running" through a
 *          mission's current_agent_id, one indirection away from the truth. The
 *          run rows themselves are what the loop writes, so the surface reads
 *          those, workspace scoped, in the same call as everything else.
 *    MOVE IN, from Settings > Roster: the per-agent tool reach cap. It moved
 *          because the tool list on this page is ALREADY filtered by it
 *          (capToolsByRisk runs before anything else in the loop), so reading
 *          "nine tools" without being able to see or change the cap that
 *          produced the nine is reading a derived number with its input
 *          hidden. This leaves the same control in two places until that lane
 *          retires its copy; flagged in the report rather than reached for.
 *    MOVE IN, from Settings > Autonomy: the per-agent dial. It was a
 *          workspace-wide panel; autonomy is per agent and always was.
 *    MOVE IN, the per-agent on/off switch that Settings correctly KILLED for
 *          calling no server function. It is drawn again here because a real
 *          one exists (setAgentEnabled, onboarding.functions.ts) and is wired.
 *    NEW   the per-tool policy, and the graduation queue. Neither existed on
 *          any surface a product lead can reach.
 *
 * 4. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE.
 *    Everything about one agent. A roster card is a mark, a name and one line.
 *    Its record, its boundary, its tool policy and what it is asking for all
 *    live on its own page, which is one click. The only thing promoted onto the
 *    roster is what genuinely needs a person: an agent asking for more room,
 *    which is drawn above the grid as a short queue.
 *
 * 5. WHAT WOULD DELIGHT, AND WHAT WOULD CONFUSE.
 *    The moment is an agent proposing its own promotion. "Engineer has opened
 *    five pull requests in a row that you did not change. Let it stop asking?"
 *    is the product's whole thesis in one card: the machine earned something,
 *    the record proves it, and the human rules on the boundary rather than on
 *    the work. It is real (trust_graduation_proposals, written by the
 *    reflection pass) and it is rendered as a Gate whose settlement leaves a
 *    mark, so the judgment is visible instead of vanishing into a toast.
 *    What would confuse, and is therefore refused: a control that draws a
 *    setting the runtime would silently override. Every per-tool control here
 *    offers only the modes that survive resolveToolMode unchanged, so a
 *    force-review tool states its floor in words and no dropdown at all.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    This surface IS the crew, so the test has to be sharper than "are agents
 *    visible". It proves three things. Attribution: every boundary on the page
 *    is attached to a named worker with a face, never to an abstract setting.
 *    Work in motion: a running agent is marked while it runs, read from the run
 *    rows and not from a status column someone might forget to clear.
 *    Judgment leaves a trace: deciding a graduation renders what the decision
 *    caused. And nothing overclaims: what an agent may do is composed by
 *    calling the loop's own resolveToolMode rather than by restating its rules,
 *    so the page cannot promise a permission the wiring lacks. Remove the
 *    agents and this surface does not exist at all, which is the strongest
 *    possible answer to the test.
 *
 * ONE KNOWN DIVERGENCE, INHERITED, AND FOLLOWED DELIBERATELY. loadAgentArc,
 * which the loop calls, defaults an agent with no autonomy row to "trusted"
 * (founder ruling 2026-07-08). computeAllAgentTrust, ten lines away in the same
 * file, defaults the same field to "observing". This surface follows the LOOP,
 * because it must describe what will happen. See crew.functions.ts's header.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2026-08-15: PORTED TO MERIDIAN.
 *
 * Every `--sp-*` shape is gone from this file. It keeps `Surface` alone, which
 * is the app shell's two-column region and belongs to the shell rather than to
 * this surface, and which /inbox — the house pattern for a ported surface —
 * keeps for the same reason. Everything else is drawn from `--mrd-*` through
 * the parts in components/crew/CrewChrome.tsx.
 *
 * TWO THINGS CHANGED THAT ARE NOT A RE-SKIN, and both are rulings this surface
 * was on the wrong side of:
 *
 *   THE STAGE HUE IS GONE, from the marks and from the group heads. The KEEP
 *   list above said the hue encoding survives verbatim, and that entry is now
 *   struck. The founder was asked on 2026-08-15 whether each station could take
 *   its own colour and ruled that it cannot: colour carries STATUS in this
 *   product — waiting on you, running, held, failed — and seven categorical
 *   hues spend the whole palette on category, so a reader can no longer tell
 *   "Plan is amber because it is Plan" from "Plan is amber because something is
 *   stuck there". The ruling is written into meridian/station-glyphs.tsx and it
 *   names this exact encoding. Identity is carried by SHAPE, which is what the
 *   glyphs were drawn for and which survives greyscale on its own; the colour
 *   on this page is now spent on the four facts that change what a reader does.
 *
 *   THE TOOL LISTS ARE A GRID, not two hand-rolled columns with a show-all
 *   toggle. `RecordsTable` sorts them, caps them, and prints the number of rows
 *   it is withholding — which the bespoke version could not do, because "All
 *   12" tells you the total and never that eight are hidden. It also carries
 *   the empty and failed states as separate facts, which is the rule this
 *   surface already followed by hand in two places and would have had to keep
 *   following by hand in every place after.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { messageForPerson } from "@/lib/error-copy";
import { SlowRead } from "@/components/shell/SlowRead";
import { needsALookLine, workingNowLine } from "@/components/crew/crew-words";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import {
  AGENT_STATION_ORDER,
  AGENT_STATIONS,
  SPECIALIST_CATALOG,
  agentBlurb,
  agentDisplayName,
  castEntries,
  catalogEntry,
  type AgentStation,
  type CatalogEntry,
} from "@/lib/agent-vocabulary";
import { useWorkspace } from "@/hooks/use-workspace";
import { Surface } from "@/components/meridian/Surface";
import { RecordsTable, type RecordColumn } from "@/components/meridian/RecordsTable";
import {
  CrewMark,
  CtxBody,
  CtxHead,
  CtxRow,
  CtxSection,
  DoorRow,
  Gate,
  ListRow,
  Setting,
  Settled,
  StationHeading,
  type CrewMarkState,
} from "@/components/crew/CrewChrome";
import {
  Action,
  Actions,
  Approve,
  Figure,
  NothingHere,
  PageHeading,
  Picker,
  ReadFailed,
  Reading,
  RecordSpeaks,
  Region,
  Toggle,
} from "@/components/meridian/surface-parts";
import {
  listCrew,
  getCrewMember,
  setCrewToolMode,
  type CrewArc,
  type CrewMember,
  type CrewRosterMember,
  type CrewToolMode,
  type CrewToolPolicy,
} from "@/lib/crew.functions";
import { setAgentArc, decideTrustGraduation } from "@/lib/trust.functions";
import { isModalOpen } from "@/lib/overlay";
import { setAgentToolCap, listAgentReflections } from "@/lib/agents.functions";
import { setAgentEnabled } from "@/lib/onboarding.functions";
import { CrewMethods } from "@/components/crew/CrewMethods";
import { EngineRoomEmbedded, ROOM_KEYS } from "@/components/engine-room/EngineRoomEmbedded";
import { BoundaryPane } from "@/components/settings/BoundaryPane";
import type { RoomKey } from "@/lib/engine-room-glance";
import {
  ARC_CHOICE,
  ARC_ORDER,
  MODE_CHOICE,
  MODE_PHRASE,
  REACH_CHOICE,
  RISK_NOTE,
  arcHeadline,
} from "@/components/crew/crew-words";

/** Team's own combined search shape. `panel` is what `view=methods` used to
 *  be called before P-79 -- renamed because `room`/`view` now belong to the
 *  embedded engine-room content (Spend and limits), and Team's own panel
 *  switch and the room's own sub-tab could not share the name `view` once
 *  both live on this one route. `agent` still means a crew member; the
 *  engine room's own agent-filter param is `roomAgent` for the same reason. */
export type CrewSearch = {
  agent?: string;
  panel?: "methods";
  /* `boundary` joined `spend` on 2026-09-09 (fifth review): Settings' Autonomy
     group folded in here, and the tab takes the name this page already gave
     the thing. "The boundary" is the row under "Across the whole crew" and the
     heading on a member's page, so a third word for it would have been a
     second name for one boundary, which is the defect crew-words.ts exists to
     prevent. */
  tab?: "spend" | "boundary";
  room?: RoomKey;
  view?: string;
  suite?: string;
  roomAgent?: string;
  surface?: string;
};

export const Route = createFileRoute("/_authenticated/team")({
  // One agent open at a time, in the URL, so the browser's own back button
  // closes the detail and a teammate can be sent straight to it. A modal would
  // have neither, and a governance pane with three controls in it is exactly
  // the modal abuse the anti-slop list bans.
  // `panel` earns its place in the URL for the same three reasons `agent` did:
  // the back button closes it, the address bar names what you are looking at,
  // and a teammate can be sent straight to it. It is a closed set of one, so an
  // unrecognised value falls back to the roster rather than rendering nothing.
  validateSearch: (search: Record<string, unknown>): CrewSearch => ({
    agent: typeof search.agent === "string" && search.agent ? search.agent : undefined,
    panel: search.panel === "methods" ? "methods" : undefined,
    // P-79: the engine room, folded in as Team's own "Spend and limits" tab.
    // `boundary` is the Autonomy fold (2026-09-09). A closed set of two, so an
    // unrecognised value falls back to the roster rather than rendering nothing.
    tab: search.tab === "spend" ? "spend" : search.tab === "boundary" ? "boundary" : undefined,
    room: ROOM_KEYS.includes(search.room as RoomKey) ? (search.room as RoomKey) : undefined,
    view: typeof search.view === "string" ? search.view : undefined,
    suite: typeof search.suite === "string" ? search.suite : undefined,
    roomAgent: typeof search.roomAgent === "string" ? search.roomAgent : undefined,
    surface: typeof search.surface === "string" ? search.surface : undefined,
  }),
  component: Team,
  // P-61 (A-QUEUE.md): the tab title is the rail's own word for this door
  // (PRIMARY_NAV's "Team"), not the route's internal name.
  head: () => ({ meta: [{ title: "Team · Supaprod" }] }),
});

/* ------------------------------------------------------------------ *
 * Vocabulary. Mechanism words (arc, mode, graduation) never reach the
 * screen; they are the correct technical whisper in the Engine Room and
 * nowhere else.
 *
 * IT MOVED OUT OF THIS FILE 2026-08-10, to components/crew/crew-words.ts.
 * These labels were declared privately here, and Settings declared its own
 * set privately over the SAME stored values - which is how one boundary ended
 * up with two names. The words are shared now, so a second name for a
 * boundary has to be written on purpose rather than by not looking.
 * ------------------------------------------------------------------ */

const NUMBER_WORD = [
  "None",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
];

function count(n: number): string {
  return n < NUMBER_WORD.length ? NUMBER_WORD[n] : String(n);
}

/** Plain-words relative time. Mono is applied by the row, not here. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * "Last worked 4h ago", and the two ways that sentence goes wrong.
 *
 * `ago()` answers "now" under a minute, so the obvious template produces **"Last
 * worked now ago."** — seen on the live roster 2026-08-27, on the two agents that
 * had just run. It also answers null for a timestamp it cannot use, which the
 * same template renders as **"Last worked null ago."**
 *
 * Null here means the row HAS a time and we could not read it, which is not the
 * same as never having run. Saying nothing is the only honest answer: "has not
 * run here yet" would be a claim about the agent made from a fault in our own
 * parsing.
 */
function lastWorkedLine(iso: string | null | undefined): string | null {
  if (!iso) return "Has not run here yet.";
  const when = ago(iso);
  if (when === null) return null;
  return when === "now" ? "Last worked just now." : `Last worked ${when} ago.`;
}

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

function Team() {
  const { agent, panel, tab, room, view, suite, roomAgent, surface } = Route.useSearch();
  const navigate = useNavigate();

  const open = React.useCallback(
    (slug: string | null) => {
      void navigate({ to: "/team", search: slug ? { agent: slug } : {} });
    },
    [navigate],
  );

  // THE BOUNDARY, 2026-09-09. Same precedence as the two below and for the
  // same reason: it is a question about the crew as a whole, so it takes over
  // the URL rather than competing with an agent left open in the same one. It
  // is checked first only because it needs none of the room search fields.
  if (tab === "boundary") return <BoundaryPane onBack={() => open(null)} />;

  // P-79: Spend and limits is its own top-level surface, same precedence as
  // the methods panel below -- it takes over the URL rather than competing
  // with an agent left open in the same one.
  if (tab === "spend") {
    return (
      <EngineRoomEmbedded
        room={room}
        view={view}
        suite={suite}
        roomAgent={roomAgent}
        surface={surface}
      />
    );
  }

  // The methods surface answers a question about the crew as a WHOLE, so it
  // takes precedence over an agent left open in the same URL rather than
  // competing with it. `open(null)` clears both keys, so the one back control
  // closes whichever of the two is showing.
  if (panel === "methods") return <CrewMethods onBack={() => open(null)} />;

  return agent ? <MemberView slug={agent} onBack={() => open(null)} /> : <Roster onOpen={open} />;
}

/* ------------------------------------------------------------------ *
 * The roster
 * ------------------------------------------------------------------ */

/** One entry per identity. The catalog carries five slugs that all mean
 *  "Watch"; the roster should show one Watch, not five. */
function rosterCatalog(): CatalogEntry[] {
  const seen = new Set<string>();
  const out: CatalogEntry[] = [];
  for (const e of castEntries()) {
    if (seen.has(e.name)) continue;
    seen.add(e.name);
    out.push(e);
  }
  return out;
}

function Roster({ onOpen }: { onOpen: (slug: string) => void }) {
  // The roster's own navigate, for the one link that leaves this surface: the
  // workspace boundary. Every other row here opens a member in place via
  // onOpen, which is why this hook did not already exist.
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const fList = useServerFn(listCrew);
  const crew = useQuery({
    queryKey: ["crew", "roster", activeWorkspace?.id ?? null],
    queryFn: () => fList({ data: { workspaceId: activeWorkspace?.id ?? null } }),
    staleTime: 30_000,
  });

  const all = React.useMemo(rosterCatalog, []);
  const bySlug = React.useMemo(() => {
    const map = new Map<string, CrewRosterMember>();
    for (const m of crew.data?.members ?? []) map.set(m.slug, m);
    return map;
  }, [crew.data]);

  const byStation = React.useMemo(() => {
    const map = new Map<AgentStation, CatalogEntry[]>();
    for (const e of all) {
      const list = map.get(e.station) ?? [];
      list.push(e);
      map.set(e.station, list);
    }
    return map;
  }, [all]);

  // The census. It counts the CARDS, so the four buckets add back up to the
  // number in the title. An identity the account has no row for is its own
  // bucket rather than being quietly dropped, which is how a census on a
  // screen stops reconciling and starts being ignored.
  const asking = React.useMemo(
    () =>
      all.map((e) => bySlug.get(e.slug)).filter((m): m is CrewRosterMember => !!m?.asking.length),
    [all, bySlug],
  );
  const present = all.map((e) => bySlug.get(e.slug)).filter((m): m is CrewRosterMember => !!m);

  /**
   * What the header may claim, and it is the read that decides.
   *
   * Three states, and only one of them names a number the record supports:
   * a read that has not landed says who the page is about; an account with no
   * `agents` rows keeps the catalogue count, because the sub beneath it argues
   * from the same catalogue that nothing has been narrowed yet; and a live
   * roster counts what is actually present and actually rendered.
   */
  const crewTitle: string = !crew.isSuccess
    ? "Your team"
    : crew.data?.empty
      ? all.length === 1
        ? `${count(1)} agent works here.`
        : `${count(all.length)} agents work here.`
      : present.length === 1
        ? `${count(1)} agent works here.`
        : `${count(present.length)} agents work here.`;
  /**
   * AN AGENT WITH NO ROW IS NOT ABSENT, IT IS ON THE DEFAULT POLICY.
   *
   * Found by walking the live product 2026-08-03: this page reported "13 have not
   * arrived yet" with Challenge, Research, Listen and Prioritize all marked "Not
   * in this workspace yet", while all four were plainly working. Challenge had
   * just produced a teardown at 76 percent confidence, Research and Listen appear
   * fourteen times in one track's log, and Prioritize had raised three decisions
   * in the Brain.
   *
   * The roster table is an OVERRIDES table, exactly like agent_tools. The registry
   * is the list. trust.server.ts settles it: `autonomy.get(a.id) ?? "trusted"`,
   * per the founder ruling that an agent is autonomous by default. So the agents
   * this page called missing are in fact the MOST autonomous ones in the
   * workspace, and counting them as absent inverted the one number the surface
   * exists to report.
   */
  const onDefaults = all.length - present.length;
  const alone =
    present.filter((m) => m.enabled && (m.arc === "trusted" || m.arc === "ambient")).length +
    onDefaults;
  const asks = present.filter(
    (m) => m.enabled && (m.arc === "proving" || m.arc === "observing"),
  ).length;
  const off = present.filter((m) => !m.enabled).length;

  // Exactly one mark on a screen may blink, so the blink means "look here".
  const blinkSlug = asking[0]?.slug ?? null;

  function stateFor(slug: string): CrewMarkState {
    const m = bySlug.get(slug);
    /* NO ROW IS NOT SWITCHED OFF, IT IS THE DEFAULT POLICY.
     *
     * This returned "quiet", which is the switched-off state, so on a brand-new
     * account EVERY card on this page rendered as off. That inverted the one
     * number the surface exists to report: `agent_tools` is an OVERRIDES table,
     * an agent with no row is on the default policy, and the default is
     * autonomous. The agents this page was drawing as disabled were in fact the
     * most autonomous ones in the workspace.
     *
     * The page's own copy twenty lines down already says this ("on the default
     * policy, never configured here"), so the two halves of this surface
     * disagreed with each other. "idle" is the honest state: present, on, with
     * nothing currently in flight. */
    if (!m) return "idle";
    if (m.asking.length > 0) return slug === blinkSlug ? "gate" : "waiting";
    if (m.runs.running > 0) return "running";
    if (!m.enabled) return "off";
    return "idle";
  }

  const sub = crew.isLoading ? (
    /* MEASURED AT 6.9 SECONDS on the running product 2026-08-27, holding this
       one static sentence the whole way, which is the state a person cannot
       tell from a hung one. `inline` because `PageHeading` draws its sub
       inside a `<p>` and the block form cannot legally go there.

       `onRetry` past fifteen seconds, the same `refetch` the failure branch
       below already uses. This was the LAST `SlowRead` in the product without
       one, and it is the site the escalation was measured on - 6.9 seconds
       holding a single sentence. A figure answers "is this moving"; after
       fifteen seconds the only question left is what to do about it. */
    <SlowRead inline onRetry={() => void crew.refetch()}>
      Reading the boundary in force.
    </SlowRead>
  ) : crew.isError ? (
    "The boundary did not load."
  ) : crew.data?.empty ? (
    /* THIS SENTENCE CONTRADICTED THE HEADLINE ABOVE IT.
     *
     * The title counts the static roster ("13 work here") while this said the
     * account has no agents, on the same header, on day one. Both were drawn
     * from the same load and disagreed.
     *
     * The truth is the more flattering one and it is the product's whole
     * argument: no row means no OVERRIDE, and the default policy is autonomous.
     * A new account's crew is not absent, it is already working without being
     * asked. Said that way, the emptiest state in the product becomes the
     * clearest statement of what the product does. */
    <>
      {/*
       * ── "START", BECAUSE THE SAME ACCOUNT IS ALSO BEING ASKED SIX THINGS ──
       *
       * WALKED AS A STRANGER, 2026-09-10. This page said **"All 16 run without
       * asking you"** while the entry, on the same workspace in the same
       * session, said **"4 design gates and 2 other calls are waiting for
       * you."** Both are true and they are about different things: `alone`
       * counts agents whose AUTONOMY setting is run-alone, and the calls come
       * from TOOL boundaries. Nothing on either page says so.
       *
       * A reader has one word for both and no way to tell which is meant, so
       * the two pages read as a flat contradiction on the product's central
       * claim. That is law 14: each sentence is right, the defect is between
       * them, and no check that reads one page can see it.
       *
       * "Start" scopes the claim to dispatch and leaves the boundary alone --
       * and the boundary card sits two lines above this, saying "Every tool,
       * across the whole crew", which is the other half already on the page.
       */}
      All <Figure>{all.length}</Figure> start without asking you. Nothing has been narrowed here
      yet.
    </>
  ) : (
    /* "OF THEM" POINTED AT THE WRONG SET (2026-08-11). This used to end with a
       parenthetical, "(13 of them on the default policy, never configured
       here)", and "them" attaches to whichever group was named last. Read
       straight through, "16 run without asking you, 0 ask first (13 of them on
       the default policy)" says thirteen of the zero, which is not a number.
       `onDefaults` is counted against the WHOLE roster, so it now names the
       whole roster out loud and stands as its own sentence rather than an
       aside. It is also the most consequential fact on the line: an agent
       nobody has configured is running on a default, and that deserves better
       than a bracket. */
    <>
      {/*
       * ── "ALL" WHEN IT IS ALL, BECAUSE TWO EQUAL COUNTS MAKE A READER COMPARE ──
       *
       * READ ON THE SERVED /team, 2026-09-10. The header showed:
       *
       *   16 agents work here.
       *   16 run without asking you.
       *
       * Two counts, both 16, stacked. The second is only informative BECAUSE it
       * equals the first, and stating it as a bare number makes the reader do
       * that comparison to find out. "All 16" states the fact instead.
       *
       * AND IT IS A THIRD CASE OF THE SAME SHAPE FOUND TONIGHT: an
       * individually-correct decision arriving somewhere it did not intend.
       * This branch was written for "16 run without asking you, 3 ask first",
       * where the counts differ and both earn their place. The zero-omission
       * beside it is right and well argued -- nobody says "0 ask first". What
       * nobody looked at was the sentence LEFT BEHIND when that clause is
       * omitted and `alone` happens to equal the roster, which is the common
       * case on a workspace that has never narrowed anything.
       *
       * The empty branch above already says "All 16 run without asking you"
       * for the no-overrides case; this is the same sentence for the case where
       * overrides exist but none of them asks.
       */}
      {alone === all.length ? "All " : null}
      {/* "start", not "run": see the empty branch above. The same account is
          being asked six things at its tool boundaries while this says nobody
          is asked, and both are true of different questions. */}
      <Figure>{alone}</Figure> start without asking you
      {/* OMITTED AT ZERO, the way the switched-off clause beside it already is.
          Read on the running product: "16 run without asking you, 0 ask first."
          Nobody says "0 ask first"; they say none do, or they say nothing at
          all because the first half already told you. A zero stated as a count
          is the same defect as the negation wall on the board: an absence
          dressed as a measurement. The clause returns the moment one agent
          actually asks, which is when it carries news. */}
      {asks > 0 ? (
        <>
          , <Figure>{asks}</Figure> ask first
        </>
      ) : null}
      {off > 0 ? (
        <>
          , <Figure>{off}</Figure> are switched off
        </>
      ) : null}
      .
      {onDefaults > 0 ? (
        <>
          {" "}
          <Figure>{onDefaults}</Figure> of the <Figure>{all.length}</Figure> have never been
          narrowed here, so they run on the default policy.
        </>
      ) : null}
    </>
  );

  return (
    // wide: the roster is a grid, not prose, so it wants the room rather than
    // the 74ch measure.
    <Surface wide>
      <div className="flex flex-col gap-mrd-7">
        {/* SAY WHAT SIXTEEN OF. The title read "16 work here.", which omits the
            noun entirely and leaves the one word a newcomer needs to the page
            they would have to already understand to be here.
            `count` returns a number WORD below ten, so the verb has to agree with
            it: "one agent works here", "sixteen agents work here". */}
        {/*
         * THE HEADLINE COUNTED THE SOURCE, NOT THE WORKSPACE (S4-173, 2026-08-31).
         *
         * It read `count(all.length)`, and `all` is `rosterCatalog()` -- a
         * catalogue compiled into this file, deduped by name, that makes no query
         * at all. So "16 agents work here" was a fact about our source code
         * printed as a fact about YOUR workspace, and it printed the same 16
         * whether the account held sixteen, one, or none, and whether the backend
         * answered or died.
         *
         * S4 settled it against live data after I asked them to check it against a
         * live backend rather than a dead one, and the live answer is worse than
         * the dead-backend one: distinct agent names per owner are 22 / 19 / 17,
         * and **ZERO of the sixteen owners have sixteen.** Twelve have seventeen.
         * So the constant was wrong for 100% of accounts, on the page whose whole
         * subject is who is working for you.
         *
         * WHY IT SLIPPED, and it is worth keeping: the headline never READ the
         * data, so it never looked like a read that could fail. Every guard in
         * this file protects something that queries -- :423's SlowRead, :438's sub
         * replacement, :516's ReadFailed card -- and `all.length` queries nothing,
         * so it was not on the list of things that could be wrong. Its own comment
         * even reasons carefully about the verb agreement of a number that was
         * never true.
         *
         * ── WHY `present` AND NOT THE RAW LIVE COUNT ──────────────────────────
         * `present` is the catalogue entries that have a live agent row, which is
         * exactly the set of rows rendered below. The database holds 17 slugs for
         * every owner and this catalogue deduplicates to 16 identities on purpose
         * ("five slugs all mean Watch; the roster should show one Watch, not
         * five"), so counting raw slugs would put 17 over a list of 16 and
         * recreate the headline-contradicts-body defect the comment at the empty
         * branch below was written to fix. The number now names what is on screen
         * AND is derived from the read.
         *
         * ── AND IT SAYS NOTHING UNTIL THE READ LANDS ─────────────────────────
         * While loading or after a failure there is no honest count, so the title
         * carries none. The empty branch is the deliberate exception: an account
         * with no `agents` rows has not lost its crew, it has simply never
         * narrowed one, and the sub below argues exactly that from the catalogue.
         * A title of "no agents work here" over "All 16 run without asking you"
         * would be the same contradiction in the other direction.
         */}
        <PageHeading title={crewTitle} sub={sub} />

        {crew.isError ? (
          <ReadFailed error={crew.error} onRetry={() => void crew.refetch()}>
            The crew did not load, so nothing below is the real boundary.
          </ReadFailed>
        ) : null}

        {/*
         * ── ONE REGION, TWO ROWS, 2026-08-17 ──────────────────────────────────────
         * Founder: "if you click on Open Crew, it says What they may do without you.
         * How they work. This is all like a card, but it needs to be really even and
         * have a proper structure. It does not hold proper structure." And again, on
         * the whole surface: "those things also can be brought into one layer hub so
         * that everything would be in the same section."
         *
         * He is describing a real fault. These were two Regions holding exactly ONE
         * DoorRow each: a full heading, its own sub, and its own vertical band spent on
         * a single link, twice in a row. That is scaffolding heavier than the thing it
         * holds, and it made two closely related doors read as two unrelated topics.
         *
         * ── THIS REVERSES A DECISION, AND THE OLD REASON IS ANSWERED ──────────────
         * The previous comment kept them apart because "what they may do without you"
         * is a true title for exactly one of the two and "would have to be watered down
         * to cover both". That reasoning was sound and its conclusion was that no
         * shared title existed. One does. Both of these are crew-WIDE: the boundary is
         * every tool across everybody, and the methods are the ways the whole crew
         * draws on. Neither is about one agent, which is exactly what distinguishes
         * them from every other row on this page.
         *
         * "Across the whole crew" is therefore not a watered-down cover, it is the
         * precise thing the two have in common, and it is already this product's phrase
         * for the same idea -- the roster files the conductor under "Across the whole
         * loop". The sub carries the distinction the two titles used to carry.
         *
         * ── WHAT THE ROWS STILL OWN, UNCHANGED ────────────────────────────────────
         * The boundary: until 2026-08-01 "what may they do without me" was spread over
         * four Engine Room rooms and a settings page. Rows rather than rail entries,
         * because the rail's five rows are a founder ruling and adding a sixth by
         * commit would be relitigating it.
         * The methods: `getPlaybooks` was live server code with zero UI callers while
         * the loop picked a method per mission step on the reader's behalf, so the
         * thing this product calls its moat had no door at all.
         */}
        <Region
          title="Across the whole crew"
          sub="Not about any one agent: what it is costing, what every one of them may reach, and the ways they all work."
        >
          {/* P-79 (A-QUEUE.md): the engine room's four rooms, as Team's own
              Spend and limits tab. The general door lands on the overview;
              "The boundary" below is the same content's own deep link into
              one room, repointed rather than duplicated. */}
          <DoorRow
            lead="Spend and limits"
            sub="What the crew is costing this week, the caps, the costliest model, and what has failed."
            onClick={() => void navigate({ to: "/team", search: { tab: "spend" } })}
          />
          <DoorRow
            lead="The boundary"
            sub="Every tool, across the whole crew. Set once, and it never interrupts work already running."
            /* IT POINTS AT ITS OWN TAB NOW, 2026-09-09. This row used to open
               Spend and limits, then the Safety room, then that room's rules
               view -- a door three levels down into content whose other half
               was drawn a second time under Settings > Autonomy. The Autonomy
               group folded in here, so the boundary has one address and this
               row is it. */
            onClick={() => void navigate({ to: "/team", search: { tab: "boundary" } })}
          />
          <DoorRow
            lead="The methods"
            sub="The named ways of working the crew draws on, how often each has been used, and what has held up so far."
            onClick={() => void navigate({ to: "/team", search: { panel: "methods" } })}
          />
        </Region>
        {asking.length > 0 ? (
          <Region
            title="Asking for more room"
            sub="Each one has done the same thing cleanly enough times to propose it stops asking. Open it to rule."
          >
            <div className="flex flex-col gap-mrd-2">
              {asking.map((m) => (
                <DoorRow
                  key={m.slug}
                  marks={
                    <CrewMark
                      slug={m.slug}
                      name={m.name}
                      state={m.slug === blinkSlug ? "gate" : "waiting"}
                    />
                  }
                  lead={
                    // One ask reads as one sentence. Several would need one phrase
                    // per tool, and a row in a list never wraps, so the count goes
                    // here and the tools go on its own page.
                    m.asking.length === 1 ? (
                      <>
                        {agentDisplayName(m.slug, m.name)} wants to run {m.asking[0].toolLabel}{" "}
                        {MODE_PHRASE[m.asking[0].toMode]}.
                      </>
                    ) : (
                      <>
                        {agentDisplayName(m.slug, m.name)} is asking about {m.asking.length} tools.
                      </>
                    )
                  }
                  sub={
                    m.runs.total > 0 ? (
                      <>
                        <Figure>{m.runs.total}</Figure> runs in this workspace
                      </>
                    ) : (
                      "No runs in this workspace yet"
                    )
                  }
                  onClick={() => onOpen(m.slug)}
                />
              ))}
            </div>
          </Region>
        ) : null}

        {AGENT_STATION_ORDER.map((station) => {
          const members = byStation.get(station);
          if (!members?.length) return null;
          return (
            <section key={station}>
              <StationHeading station={station} count={members.length} />
              {/* The arithmetic that makes this a grid rather than a column:
                  sixteen agents down a column is sixteen rows of scrolling, and
                  the same sixteen at three or four across is four. The 232px
                  measure is the prototype's and is kept; only the ground, the
                  radius and the focus treatment moved to Meridian. */}
              <div className="mt-mrd-4 grid gap-mrd-2 [grid-template-columns:repeat(auto-fill,minmax(232px,1fr))]">
                {members.map((e) => {
                  const m = bySlug.get(e.slug);
                  return (
                    <button
                      type="button"
                      key={e.slug}
                      onClick={() => onOpen(e.slug)}
                      data-mrd=""
                      className="flex w-full items-center gap-mrd-4 rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-4 py-mrd-3 text-left transition-colors hover:bg-mrd-lift"
                      style={{ transitionDuration: "var(--mrd-d-press)" }}
                    >
                      <CrewMark slug={e.slug} name={e.name} size="lg" state={stateFor(e.slug)} />
                      <span className="min-w-0">
                        <span className="block truncate text-mrd-base font-medium text-mrd-ink">
                          {e.name}
                        </span>
                        <span className="mt-0.5 block text-mrd-small leading-mrd-snug text-mrd-mute">
                          {/* The blurb says what it does, which is what the roster
                              teaches. The two exceptions are facts that
                              contradict the blurb: it is switched off, or this
                              account has no row for it at all. */}
                          {!m
                            ? `${agentBlurb(e.slug) ?? e.relayVerb} Runs on the default policy.`
                            : !m.enabled
                              ? "Switched off. It will not be dispatched."
                              : (agentBlurb(e.slug) ?? e.relayVerb)}
                        </span>
                        {/*
                          WHEN IT LAST DID ANYTHING, which this page held and
                          never showed. `CrewRunTally.lastAt` has been on every
                          roster row all along and was rendered only inside the
                          member view, so learning which of seventeen teammates
                          has gone quiet meant opening seventeen cards. That is
                          this lane's own failure test, applied to the team:
                          if a person has to open each one to find out whether
                          any of them needs them, the surface has failed.

                          Measured 2026-08-27, and the spread is the argument:
                          prd-writer last ran minutes ago and ux-architect
                          twenty-nine hours ago, and the two cards were
                          identical. Sixteen of the seventeen have run here.

                          Silent while it is RUNNING, because the mark beside
                          the name already says so and a card should carry one
                          live signal, not two. Silent when the tally is null
                          rather than guessing a date it does not have; "has not
                          run here yet" is the one thing worth saying, and it is
                          said, because a teammate that has never worked is a
                          different fact from one that is merely quiet now.
                        */}
                        {m && m.enabled && m.runs.running === 0 ? (
                          <span className="mt-0.5 block text-mrd-small leading-mrd-snug text-mrd-mute">
                            {lastWorkedLine(m.runs.lastAt)}
                          </span>
                        ) : null}
                        {/*
                          ── THE WORKING CARD SAYS SOMETHING NOW (2026-09-01) ──
                          The branch above draws only when NOTHING is running, so
                          on a roster of seventeen the card that is actually
                          working was the only one with no words at all -- its
                          entire state was a hue on a 24px mark. That is the one
                          card a person is looking for.

                          The comment above it argued "a card should carry one
                          live signal, not two", which is right about
                          duplication and produced the wrong outcome. This is not
                          the second copy it was guarding: the mark says THAT it
                          is running, this says how much is in flight and how
                          much is queued behind. Both already on the roster row
                          and drawn nowhere in the product. See
                          `workingNowLine`.

                          `--mrd-agent` is the azure that means a machine is
                          working, which is the colour law used as intended
                          rather than a decoration -- this line only exists while
                          one is.
                        */}
                        {m && m.enabled && m.runs.running > 0 ? (
                          <span className="mt-0.5 block text-mrd-small leading-mrd-snug text-mrd-agent">
                            {workingNowLine(m.runs.running, m.runs.queued)}
                          </span>
                        ) : null}
                        {/*
                          WHICH TEAMMATE NEEDS A LOOK. `CrewRunTally.failed` has
                          been on every roster row all along and appeared
                          nowhere on the card, so an agent with three runs that
                          stopped without finishing was indistinguishable from a
                          healthy quiet one. That is this card's own failure
                          test, the one written two comments up for `lastAt`:
                          if a person has to open each one to find out whether
                          any of them needs them, the surface has failed.

                          THE MARK CANNOT CARRY THIS. `agent-fleet.ts` has a
                          `stateFor` returning "attention" on failures and the
                          roster's `stageFor` does not use it — it returns gate,
                          waiting, running, off or idle, so a failing agent
                          renders as IDLE. And even if it turned, R-19 keeps
                          accessibility at full weight: colour must never be the
                          only signal, and a sentence survives greyscale and a
                          screen reader where a hue does not.

                          It wears `--mrd-fail` and it is the card's ONE live
                          signal: it draws only when there is an exception, and
                          the line above it is mute context rather than a second
                          claim. */}
                        {m && m.enabled && needsALookLine(m.runs.failed) ? (
                          <span className="mt-0.5 block text-mrd-small leading-mrd-snug text-mrd-fail">
                            {needsALookLine(m.runs.failed)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </Surface>
  );
}

/* ------------------------------------------------------------------ *
 * One agent
 * ------------------------------------------------------------------ */

type Decided = { accept: boolean; toolLabel: string; mode: CrewToolMode; at: string };

function MemberView({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { activeWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const wsId = activeWorkspace?.id ?? null;
  const memberKey = ["crew", "member", slug, wsId];

  const fMember = useServerFn(getCrewMember);
  const member = useQuery({
    queryKey: memberKey,
    queryFn: () => fMember({ data: { slug, workspaceId: wsId } }),
  });

  const invalidate = React.useCallback(() => {
    void qc.invalidateQueries({ queryKey: memberKey });
    void qc.invalidateQueries({ queryKey: ["crew", "roster", wsId] });
    // The rail badge and Settings read the same rows.
    void qc.invalidateQueries({ queryKey: ["agents"] });
  }, [qc, slug, wsId]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = <Action onClick={onBack}>All of them</Action>;

  if (member.isLoading) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading
            station={SPECIALIST_CATALOG.find((e) => e.slug === slug)?.station}
            title={agentDisplayName(slug)}
          />
          <Reading>Reading what this one is allowed to do.</Reading>
        </div>
      </Surface>
    );
  }

  if (member.isError) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading title={agentDisplayName(slug)} />
          <ReadFailed error={member.error} onRetry={() => void member.refetch()}>
            This one did not load, so the boundary shown would not be the real one.
          </ReadFailed>
          <Actions>{back}</Actions>
        </div>
      </Surface>
    );
  }

  const m = member.data;
  if (!m) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading title="No agent by that name." />
          <NothingHere action={back}>
            Nothing in this account answers to that name, and nothing in the catalog does either.
          </NothingHere>
        </div>
      </Surface>
    );
  }

  return (
    <Surface context={<MemberRecord member={m} />}>
      <div className="flex flex-col gap-mrd-7">
        <PageHeading
          /* The seat's station as the eyebrow, the same glyph the road uses,
             so a teammate's page stays on the road a person saw on the home. */
          station={SPECIALIST_CATALOG.find((e) => e.slug === slug)?.station}
          // The headline is the boundary in force, which is the one thing this
          // page exists to change. It is never stated for an agent that has no
          // row, because that one is not running under any boundary at all and
          // saying otherwise would be the surface overclaiming.
          title={
            m.agentId === null
              ? `${m.name} has not arrived yet.`
              : !m.enabled
                ? `${m.name} is switched off.`
                : arcHeadline(m.name, m.arc)
          }
          sub={m.blurb}
        />

        {m.agentId === null ? (
          <NothingHere action={back}>
            The catalog knows this one, but this account has no row for it, so there is nothing to
            govern yet. It arrives with the first mission that needs it.
          </NothingHere>
        ) : (
          <>
            <Proposals member={m} onDecided={invalidate} />
            <Boundary member={m} onChanged={invalidate} />
            <ToolPolicy member={m} onChanged={invalidate} />
            <Lessons slug={m.slug} name={m.name} />
            <Actions>{back}</Actions>
          </>
        )}
      </div>
    </Surface>
  );
}

/* ---------------- the moment: an agent asking for itself --------------- */

function Proposals({ member, onDecided }: { member: CrewMember; onDecided: () => void }) {
  const fDecide = useServerFn(decideTrustGraduation);
  const [decided, setDecided] = React.useState<Decided[]>([]);

  const decide = useMutation({
    mutationFn: (v: { proposalId: string; accept: boolean }) => fDecide({ data: v }),
  });

  // Exactly one thing asks at a time, so there is one primary action on the
  // screen and the end of the queue is visible from the start. The rest are
  // one-line rows that take the Gate's place as it is settled.
  //
  // THIS RUNS BEFORE THE EARLY RETURN BELOW, and that ordering is load-bearing
  // rather than stylistic. The keyboard effect underneath is a hook, and a hook
  // that sits after a conditional `return null` is skipped on the renders that
  // take the return -- which is the hooks-order violation React refuses at
  // runtime. `live` is simply undefined on an empty queue, which both the
  // settle function and the effect already guard for.
  const [live, ...behind] = member.proposals;

  function settle(accept: boolean) {
    if (!live) return;
    decide.mutate(
      { proposalId: live.id, accept },
      {
        onSuccess: () => {
          setDecided((d) => [
            ...d,
            {
              accept,
              toolLabel: live.toolLabel,
              mode: accept ? live.toMode : live.fromMode,
              at: new Date().toISOString(),
            },
          ]);
          onDecided();
        },
      },
    );
  }

  /**
   * THE SAME TWO KEYS THE OTHER GATES USE, and this station had neither.
   *
   * A keyboard audit of every binding in the product found /team and /design
   * running gate QUEUES with no keys bound and none drawn. This surface says
   * "Settle the one above and the next takes its place" over an accept/decline
   * pair, which is the exact shape Today binds `a` and `d` for, on the same
   * `Gate` shape. So a person who learned the keyboard on the front door
   * arrived here and it silently stopped working. An inconsistent keyboard
   * teaches people not to trust the keyboard at all, which costs more than
   * never having had one.
   *
   * `a` and `d`, deliberately not letters invented for this file. The audit's
   * companion finding is that decline changes letter on every station -- `d` on
   * Today, `r` on Approvals, `x` on Decide -- so a third choice here would add
   * to that problem while looking like a fix.
   *
   * THE WORDS ON THE BUTTONS ARE THIS SURFACE'S OWN and are not changed. "Give
   * it the room" and "Not yet" say what granting autonomy means far better than
   * Approve and Decline would, and the keys are about the ACT rather than the
   * label: `a` accepts what is being asked, here as everywhere.
   *
   * The guard is copied verbatim from today.tsx, SELECT included. The one
   * surface that wrote its own variant is the one where Cmd+R declined a call.
   */
  React.useEffect(() => {
    if (!live || decide.isPending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      /**
       * AND NOT WHILE SOMETHING IS OPEN OVER THIS SURFACE.
       *
       * The sharpest case is the shortcut sheet itself: press `?`, read the row
       * that says "a -- Approves the call in front of you", press `a`, and the
       * call behind the scrim is settled. The sheet documents the key and then
       * leaves it armed. `BoardPanel` has the identical shape and opens on an
       * ordinary rail click.
       *
       * The field guards above cannot help: both overlays are made of BUTTONs
       * and a scrim, so focus is never in an INPUT, TEXTAREA or SELECT. The
       * chord handler has stood down under this exact selector for hours; the
       * gates never learned to.
       */
      if (isModalOpen()) return;

      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "a") settle(true);
      else if (e.key === "d") settle(false);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `settle` is redeclared every render and is not a dependency worth
    // chasing: it closes over `live` and `decide`, both of which are.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, decide.isPending]);

  if (member.proposals.length === 0 && decided.length === 0) return null;

  return (
    <>
      {live ? (
        <Gate
          question={`Let ${member.name} run ${live.toolLabel} ${MODE_PHRASE[live.toMode]}?`}
          lines={[
            <>
              It has done this <Figure>{live.cleanStreak}</Figure> times in a row and you changed
              nothing.
            </>,
            <>
              Today it runs {MODE_PHRASE[live.fromMode]}. It is asking to run{" "}
              {MODE_PHRASE[live.toMode]}.
            </>,
            ...(live.rationale ? [<>{live.rationale}</>] : []),
          ]}
        >
          {/* The keycaps are drawn because the keys are bound above. `shortcut`
              renders a <kbd> and binds nothing by itself, so it is never passed
              without the effect that makes it true. */}
          <Approve shortcut="a" busy={decide.isPending} onClick={() => settle(true)}>
            Give it the room
          </Approve>
          <Action shortcut="d" busy={decide.isPending} onClick={() => settle(false)}>
            Not yet
          </Action>
        </Gate>
      ) : null}

      {behind.length > 0 ? (
        <Region title="Behind it" sub="Settle the one above and the next takes its place.">
          <div className="flex flex-col gap-mrd-2">
            {behind.map((p) => (
              <ListRow
                key={p.id}
                marks={<CrewMark slug={member.slug} name={member.name} state="waiting" />}
                lead={
                  <>
                    {p.toolLabel}, asking to run {MODE_PHRASE[p.toMode]}
                  </>
                }
                sub={
                  <>
                    <Figure>{p.cleanStreak}</Figure> clean in a row
                  </>
                }
                time={ago(p.createdAt)}
              />
            ))}
          </div>
        </Region>
      ) : null}

      {decide.isError ? (
        <ReadFailed detail="Nothing was granted and nothing was refused. The proposal is still open.">
          {messageForPerson(decide.error)}
        </ReadFailed>
      ) : null}

      {/* THE COMMIT. A toast confirms that your click registered; this renders
          what your click caused. No arrow is drawn: nothing picks this up, it
          is a standing rule from now on, and an arrow to nowhere is worse than
          no arrow. */}
      {decided.length > 0 ? (
        <div className="flex flex-col gap-mrd-2">
          {decided.map((d, i) => (
            <Settled
              key={`${d.at}-${i}`}
              verb={d.accept ? "You gave it the room" : "You said not yet"}
              consequence={
                d.accept ? (
                  <>
                    {member.name} runs {d.toolLabel} {MODE_PHRASE[d.mode]} from now on.
                  </>
                ) : (
                  <>
                    {member.name} still runs {d.toolLabel} {MODE_PHRASE[d.mode]}.
                  </>
                )
              }
              time={ago(d.at)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

/* ---------------- the boundary --------------- */

function Boundary({ member, onChanged }: { member: CrewMember; onChanged: () => void }) {
  const fArc = useServerFn(setAgentArc);
  const fCap = useServerFn(setAgentToolCap);
  const fEnabled = useServerFn(setAgentEnabled);
  const agentId = member.agentId as string;

  const arc = useMutation({
    mutationFn: (v: CrewArc) => fArc({ data: { agentId, arc: v } }),
    onSuccess: onChanged,
  });
  const cap = useMutation({
    mutationFn: (v: string) =>
      fCap({
        data: { agentId, maxToolRisk: v === "" ? null : (v as "low" | "medium" | "high") },
      }),
    onSuccess: onChanged,
  });
  const enabled = useMutation({
    mutationFn: (v: boolean) => fEnabled({ data: { agentId, enabled: v } }),
    onSuccess: onChanged,
  });

  const failure = arc.error ?? cap.error ?? enabled.error;

  // The record speaking. Only drawn when there is enough history for the
  // suggestion to mean anything: suggestArc returns "observing" below three
  // signals, and rendering that as advice would be inventing a verdict out of
  // an absence of evidence.
  const t = member.trust;
  const suggestion =
    t && t.samples >= 3 && t.suggestedArc !== member.arc
      ? ARC_ORDER.indexOf(t.suggestedArc) > ARC_ORDER.indexOf(member.arc)
        ? ("up" as const)
        : ("down" as const)
      : null;

  const arcId = `crew-arc-${member.slug}`;
  const reachId = `crew-reach-${member.slug}`;

  return (
    <Region
      title="The boundary"
      sub="Set once, and it holds inside every run. Nothing here asks you again in the moment."
    >
      <div className="rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-1">
        <Setting
          label="Working in this workspace"
          sub={
            member.enabled
              ? "Switch it off and the loop will not dispatch it."
              : "It is off. Nothing dispatches it and its tools are unreachable."
          }
        >
          <Toggle
            checked={member.enabled}
            disabled={enabled.isPending}
            label={`${member.name} works in this workspace`}
            onChange={(next) => enabled.mutate(next)}
          />
        </Setting>

        <Setting
          label="How much it decides by itself"
          htmlFor={arcId}
          // Different information from the control beside it: who set this, not
          // what it is set to. The dropdown already says what it is set to.
          sub={
            !member.enabled
              ? "Only takes effect once it is switched back on."
              : member.arcIsDefault
                ? "Nobody set this. It is our default, and it is yours to change."
                : "You set this."
          }
        >
          <Picker
            id={arcId}
            value={member.arc}
            disabled={arc.isPending}
            onChange={(e) => arc.mutate(e.target.value as CrewArc)}
          >
            {ARC_ORDER.map((a) => (
              <option key={a} value={a}>
                {ARC_CHOICE[a]}
              </option>
            ))}
          </Picker>
        </Setting>

        <Setting
          label="How far its tools may reach"
          htmlFor={reachId}
          sub="Anything past this is removed from its hands before a run starts, not gated during one."
        >
          <Picker
            id={reachId}
            value={member.maxToolRisk ?? ""}
            disabled={cap.isPending}
            onChange={(e) => cap.mutate(e.target.value)}
          >
            {REACH_CHOICE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Picker>
        </Setting>
      </div>

      {failure ? (
        <div className="mt-mrd-4">
          <ReadFailed detail="The boundary on screen is still whatever it was a moment ago; the change did not land.">
            {messageForPerson(failure)}
          </ReadFailed>
        </div>
      ) : null}

      {suggestion && t ? (
        <div className="mt-mrd-5 flex flex-col gap-mrd-4">
          <RecordSpeaks
            evidence={
              <>
                <Figure>{t.score}</Figure> out of <Figure>100</Figure>, from{" "}
                <Figure>{t.samples}</Figure> entries in the record
              </>
            }
          >
            {suggestion === "up"
              ? `${member.name} has earned more room than you have given it. On what it has actually done, it belongs at "${ARC_CHOICE[t.suggestedArc]}".`
              : `${member.name} has more room than its record backs. On what it has actually done, it belongs at "${ARC_CHOICE[t.suggestedArc]}".`}
          </RecordSpeaks>
          <Actions>
            <Action busy={arc.isPending} onClick={() => arc.mutate(t.suggestedArc)}>
              {suggestion === "up" ? "Give it that" : "Pull it back"}
            </Action>
          </Actions>
        </div>
      ) : null}
    </Region>
  );
}

/* ---------------- the authority this one holds --------------- */

/**
 * THE TWO COLUMNS, AND WHY THE SECOND ONE IS THE PRODUCT.
 *
 * Until 2026-08-10 this was ONE block, "What it still asks about", and it
 * listed only the gated half. The other half - everything this agent does with
 * nobody watching - was a number in the subtitle and nothing else. That is the
 * wrong half to summarise. Every product with a permission model can tell you
 * what an actor MAY do; the question an autonomous system has to answer, and
 * the one a security reviewer actually asks, is the pair:
 *
 *   what does this thing do with no human present, and
 *   who catches it when it is wrong?
 *
 * So both halves are named, both are listed, and the second one names the
 * person rather than leaving "approval" as an abstraction with no owner. A
 * capability with no named catcher is the shape of every autonomy incident.
 *
 * TWO REGIONS RATHER THAN TWO LITERAL COLUMNS. Regions are this system's
 * divisions; a hand-rolled two-column grid inside one region would be a second
 * layout grammar drawn on top of the first, and it would collapse to exactly
 * these two stacked regions on the narrow width anyway. The pairing is carried
 * by the titles and by them being adjacent, which is what a reader uses.
 *
 * WHY EACH HALF IS A `RecordsTable` NOW. A tool list is read, not browsed, and
 * forty rows in one region is a settings page again. That was already true and
 * the bespoke answer to it was a "All 12" toggle, which states the total and
 * never states that four rows are being withheld — the one thing a capped list
 * may not do, and a defect this repo has shipped before. The grid states both
 * numbers, sorts by any column, and keeps "nothing exists" and "the read
 * failed" as separate facts without this file writing either by hand.
 *
 * How many rows before a list has a bottom.
 */
const TOOLS_VISIBLE = 8;

function ToolPolicy({ member, onChanged }: { member: CrewMember; onChanged: () => void }) {
  const fMode = useServerFn(setCrewToolMode);
  const mode = useMutation({
    mutationFn: (v: { toolName: string; mode: CrewToolMode }) =>
      fMode({ data: { agentSlug: member.slug, ...v } }),
    onSuccess: onChanged,
  });

  /**
   * The three columns, and each says something the other two cannot.
   *
   * WHAT IT IS is the identity and stays pinned as the grid scrolls sideways.
   * WHY carries the second-line information the old `Line` carried: why it is
   * pinned, who pinned it, or what it would touch — never a restatement of the
   * value the control already shows. HOW IT RUNS is the control itself, or, on
   * a tool whose floor leaves exactly one option, the plain word: a dropdown
   * with one entry is a control that cannot do the thing it draws, which is the
   * exact defect the justification wave found in Settings.
   */
  const columns: RecordColumn<CrewToolPolicy>[] = React.useMemo(
    () => [
      {
        key: "tool",
        header: "What it is",
        cell: (t) => t.label,
        sortValue: (t) => t.label,
      },
      {
        key: "why",
        header: "Why it is set that way",
        cell: (t) => <span className="text-mrd-mute">{noteFor(t)}</span>,
        sortValue: (t) => noteFor(t),
      },
      {
        key: "mode",
        header: "How it runs",
        cell: (t) =>
          t.offerable.length > 1 ? (
            <Picker
              className="mrd-focus-inset"
              value={t.resolvedMode}
              disabled={mode.isPending}
              aria-label={`How ${t.label} runs`}
              onChange={(e) =>
                mode.mutate({ toolName: t.toolName, mode: e.target.value as CrewToolMode })
              }
            >
              {t.offerable.map((m) => (
                <option key={m} value={m}>
                  {MODE_CHOICE[m]}
                </option>
              ))}
            </Picker>
          ) : (
            <span className="text-mrd-prose text-mrd-body">{MODE_CHOICE[t.resolvedMode]}</span>
          ),
        sortValue: (t) => MODE_CHOICE[t.resolvedMode],
      },
    ],
    [mode],
  );

  if (member.noToolsEnabled) {
    return (
      <Region title="What it may do without you">
        <NothingHere>
          No tools are switched on for this account, so there is nothing for it to do or to ask
          about yet.
        </NothingHere>
      </Region>
    );
  }

  if (member.tools.length === 0) {
    return (
      <Region title="What it may do without you">
        <NothingHere>
          Its reach is set narrow enough that none of the switched-on tools are in its hands. Widen
          the reach above to give it some.
        </NothingHere>
      </Region>
    );
  }

  const alone = member.tools.filter((t) => t.resolvedMode === "auto");
  const gated = member.tools.filter((t) => t.resolvedMode !== "auto");

  // When the dial alone gates everything, listing sixty rows would be sixty
  // rows that all say the same thing and cannot be changed. Say it once.
  if (member.arc === "observing") {
    return (
      <Region
        title="What it may do without you"
        sub={
          <>
            Nothing. All <Figure>{member.tools.length}</Figure> of its tools come to you.
          </>
        }
      >
        <NothingHere>
          While it waits for you on everything, every tool goes to review whatever each one is set
          to. Give it more room above to set them one at a time.
        </NothingHere>
      </Region>
    );
  }

  return (
    <>
      <Region
        title="What it does alone"
        sub={
          <>
            <Figure>{alone.length}</Figure> of <Figure>{member.tools.length}</Figure> tools, run
            with nobody watching. This is the reach you are actually granting.
          </>
        }
      >
        <RecordsTable
          rows={alone}
          columns={columns}
          rowKey={(t) => t.toolName}
          caption={`Tools ${member.name} runs with nobody watching`}
          maxRows={TOOLS_VISIBLE}
          emptyTitle="Nothing runs on its own"
          emptyDetail="Every tool in its hands comes back to a person first."
        />
      </Region>

      <Region
        title="What comes to you"
        sub={
          gated.length === 0 ? (
            "Nothing stops for a person."
          ) : (
            <>
              <Figure>{gated.length}</Figure>{" "}
              {gated.length === 1 ? "tool stops and waits" : "tools stop and wait"} for a person
              before anything happens. Today that person is you.
            </>
          )
        }
      >
        <RecordsTable
          rows={gated}
          columns={columns}
          rowKey={(t) => t.toolName}
          caption={`Tools ${member.name} brings to a person first`}
          maxRows={TOOLS_VISIBLE}
          emptyTitle="Nothing stops for a person"
          emptyDetail="Every tool in its hands runs without asking. The safety floors still hold: a one way door would come back to you even here."
        />
      </Region>

      {mode.error ? (
        <ReadFailed detail="The tool is still set to whatever it was a moment ago; the change did not land.">
          {messageForPerson(mode.error)}
        </ReadFailed>
      ) : null}
    </>
  );
}

/** Why a tool sits where it sits. Always DIFFERENT information from the control
 *  beside it, never a restatement of the mode the control already shows. */
function noteFor(tool: CrewToolPolicy): string {
  if (tool.floor) {
    return tool.floor === "review"
      ? "Pinned. There is no way back from this one."
      : "Pinned. It reaches something outside this workspace.";
  }
  if (tool.storedSource === "operator") return "You set this one.";
  if (tool.storedSource === "graduation") return "It earned this one.";
  return RISK_NOTE[tool.risk];
}

/* ---------------- what it has learned --------------- */

function Lessons({ slug, name }: { slug: string; name: string }) {
  const fReflections = useServerFn(listAgentReflections);
  const q = useQuery({
    queryKey: ["crew", "lessons", slug],
    queryFn: () => fReflections({ data: { agentSlug: slug, limit: 5 } }),
    staleTime: 60_000,
  });

  if (q.isLoading) {
    return (
      <Region title="What it has learned">
        <Reading>Reading its lessons.</Reading>
      </Region>
    );
  }
  if (q.isError) {
    return (
      <Region title="What it has learned">
        <ReadFailed error={q.error} onRetry={() => void q.refetch()}>
          Its lessons did not load.
        </ReadFailed>
      </Region>
    );
  }

  const rows = q.data?.reflections ?? [];
  if (rows.length === 0) {
    return (
      <Region title="What it has learned">
        <NothingHere>
          {name} has written nothing down yet. It records a lesson after a run it can learn from.
        </NothingHere>
      </Region>
    );
  }

  return (
    <Region title="What it has learned" sub="Written by the agent itself, after its own runs.">
      <div className="flex flex-col gap-mrd-2">
        {rows.map((r) => (
          <ListRow
            key={r.id}
            marks={<CrewMark slug={slug} name={name} />}
            lead={r.content}
            sub={r.metadata?.what_to_change ?? undefined}
            time={ago(r.created_at)}
          />
        ))}
      </div>
    </Region>
  );
}

/* ---------------- the record, in the context column --------------- */

function MemberRecord({ member }: { member: CrewMember }) {
  const r = member.runs;
  const t = member.trust;
  const entry = catalogEntry(member.slug);

  return (
    <div className="flex flex-col gap-mrd-5">
      <CtxSection>
        <CtxHead>What it has done here</CtxHead>

        {r.total === 0 ? (
          <CtxBody>It has not run in this workspace yet.</CtxBody>
        ) : (
          <>
            <CtxRow
              name={
                <>
                  <Figure>{r.total}</Figure> runs
                </>
              }
              sub={
                <>
                  <Figure>{r.finished}</Figure> finished
                  {r.failed > 0 ? (
                    <>
                      , <Figure>{r.failed}</Figure> failed
                    </>
                  ) : null}
                  {r.running > 0 ? (
                    <>
                      , <Figure>{r.running}</Figure> running now
                    </>
                  ) : null}
                </>
              }
            />
            {/*
             * THE FAILURE COUNT GETS A DOOR (2026-08-27).
             *
             * The roster card now says "12 runs did not finish" and this view
             * said "47 runs, 35 finished, 12 failed", and both stopped there. A
             * person learned that twelve runs failed and could not reach ONE of
             * them. R-20 section 6: a screen that only tells is a fail.
             *
             * THE DESTINATION WAS ALREADY BUILT AND I TRACED IT BEFORE POINTING
             * AT IT, because a door onto the right page in the wrong state is
             * worse than none - the defect fixed on SystemAlerts href earlier
             * today. The chain: SpendRoom reads view and agent, view
             * "by-agent" with an agent renders AgentSpendDetail, and that
             * component lists the agent runs from agent_runs. SpendRoom:143
             * already builds this exact link shape for its own rows, so this is
             * the address that surface uses about itself.
             *
             * NOT room=record. That room accepts an agent param and IGNORES it,
             * checked, its body never reads it, so a link there would land on
             * an unfiltered trace list wearing the agent name.
             *
             * Drawn only when something actually failed, so a healthy teammate
             * gains no furniture.
             */}
            {r.failed > 0 ? (
              <CtxRow
                name="What did not finish"
                sub={
                  <Link
                    to="/team"
                    search={{ tab: "spend", room: "spend", view: "by-agent", roomAgent: member.slug }}
                    className="text-mrd-you underline underline-offset-2"
                  >
                    Open the runs for this one
                  </Link>
                }
              />
            ) : null}
            {r.lastAt ? <CtxRow name="Last run" sub={`${ago(r.lastAt)} ago`} /> : null}
          </>
        )}
      </CtxSection>

      {t ? (
        <CtxSection>
          {/* A different scope, and it is labelled rather than blended into the
              numbers above: the roster, the dial and the record are per
              account, and only the run history is per workspace. */}
          <CtxHead>Across everything it has done for you</CtxHead>
          {t.samples === 0 ? (
            <CtxBody>
              No signals yet, so there is no record to read. The boundary is yours to set until
              there is one.
            </CtxBody>
          ) : (
            <>
              <CtxRow
                name={
                  <>
                    <Figure>{t.score}</Figure> out of <Figure>100</Figure>
                  </>
                }
                sub={
                  <>
                    from <Figure>{t.samples}</Figure> entries in the record
                  </>
                }
              />
              {t.approvalsTotal > 0 ? (
                <CtxRow
                  name={
                    <>
                      You said yes to <Figure>{t.approvalsApproved}</Figure> of{" "}
                      <Figure>{t.approvalsTotal}</Figure>
                    </>
                  }
                  sub="calls it brought you"
                />
              ) : null}
              {t.outcomesTotal > 0 ? (
                <CtxRow
                  name={
                    <>
                      <Figure>{t.outcomesValidated}</Figure> of <Figure>{t.outcomesTotal}</Figure>{" "}
                      turned out right
                    </>
                  }
                  sub="once real signal came in"
                />
              ) : null}
            </>
          )}
        </CtxSection>
      ) : (
        <CtxSection>
          <CtxHead>Its record</CtxHead>
          <CtxBody>Not read. The boundary above is still yours to set.</CtxBody>
        </CtxSection>
      )}

      {entry ? (
        <CtxSection>
          <CtxHead>Where it works</CtxHead>
          <CtxBody>
            {AGENT_STATIONS[entry.station].name}. {AGENT_STATIONS[entry.station].blurb}
          </CtxBody>
        </CtxSection>
      ) : null}
    </div>
  );
}
