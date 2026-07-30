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
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { useWorkspace } from "@/hooks/use-workspace";
import { stageHueForStation } from "./agent-glyphs";
import { MarkStack } from "./primitives";
import { RunStripProvider, STAGE_LABEL, type RunStripSpec } from "./run-strip";
import { agentDisplayName, agentStation } from "@/lib/agent-vocabulary";
import { supabase } from "@/integrations/supabase/client";
import { listMissions } from "@/lib/missions.functions";
import { listAgents } from "@/lib/agents.functions";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import {
  IconAsk,
  IconBrain,
  IconChevron,
  IconCrew,
  IconEngine,
  IconGear,
  IconPanel,
  IconRuns,
  IconToday,
} from "./icons";

/** The five rail rows. Decided, and not to be relitigated. Settings is not
 *  one of them: it is an icon at the foot, a door you open rather than a
 *  place you live. */
const RAIL = [
  { to: "/today", label: "Today", Icon: IconToday, count: "gates" },
  // Runs points at /runs, NOT at /m. /m is Mission Control, the one surface the
  // rebuild never ported, so the rail's own row for the engine's spine was
  // landing on the legacy five-region shell. That is the founder's "the run
  // section is still rendering in the legacy design", and this line is where it
  // started. /runs is the same surface the route used to call /build, renamed
  // because a run is the whole lifecycle and never was the build leg.
  { to: "/runs", label: "Runs", Icon: IconRuns, count: "runs" },
  { to: "/brain", label: "Brain", Icon: IconBrain, count: null },
  { to: "/crew", label: "Crew", Icon: IconCrew, count: null },
  { to: "/engine-room", label: "Engine room", Icon: IconEngine, count: null },
] as const;

const RAIL_KEY = "supaprod:rail-narrow";

function initialsFrom(email: string | null | undefined, name?: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
const WORKING = new Set(["running", "in_progress"]);

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

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { activeWorkspace, activeProduct } = useWorkspace();

  // The rail's collapsed state is the user's, so it survives a reload.
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    setNarrow(window.localStorage.getItem(RAIL_KEY) === "1");
  }, []);
  const toggleRail = React.useCallback(() => {
    setNarrow((v) => {
      window.localStorage.setItem(RAIL_KEY, v ? "0" : "1");
      return !v;
    });
  }, []);

  // The seven-stage strip. The shell owns the region, a run owns the content:
  // whatever surface is mounted publishes its stages through run-strip.tsx, and
  // only a run does. See that file's header for the founder ruling this obeys.
  const [strip, setStrip] = React.useState<RunStripSpec | null>(null);

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

  const missions = useQuery({
    queryKey: ["shell", "missions", workspaceId],
    queryFn: () => fetchMissions({ data: {} }),
    staleTime: 30_000,
  });
  const queue = useQuery({
    queryKey: ["shell", "approvals", workspaceId],
    queryFn: () => fetchQueue({ data: { workspaceId: workspaceId ?? undefined } }),
    staleTime: 30_000,
  });

  const rows = React.useMemo(() => missions.data?.missions ?? [], [missions.data]);
  const running = React.useMemo(() => rows.filter((m) => WORKING.has(m.status)), [rows]);
  const gateCount = queue.data?.items.length ?? 0;

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

  const openAsk = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent("supaprod:open-ask"));
  }, []);

  // setStrip is stable, so this identity only changes when a strip is published
  // or withdrawn, which is exactly when a consumer needs to re-render.
  const stripCtx = React.useMemo(() => ({ spec: strip, publish: setStrip }), [strip]);

  // Voice: never greet, always report. The lead is a fact, and it is a fact we
  // can prove. Five states, in the order a person cares about them.
  //
  // "Reading" and "Cannot see" are not decoration. A header that says "Nothing
  // running" while the read is still in flight, or after it failed, has told
  // you something false about your own workspace, which is the same class of
  // error as a fabricated count.
  const liveLead = React.useMemo(() => {
    if (missions.isError) return "Cannot see what is running";
    if (missions.isLoading) return "Reading";
    if (running.length === 0) {
      if (gateCount === 0) return "Nothing running";
      return gateCount === 1 ? "1 call needs you" : `${gateCount} calls need you`;
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
  ]);

  // The two trailing facts, in importance order: the first survives to 860px,
  // the second goes at 1100px. Positional, so a state that has only one fact
  // still gives it the slot that lasts longest.
  const liveFacts = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    if (missions.isError || missions.isLoading) return out;
    if (running.length > 0) {
      // One run: name it. Several: naming one of them would be arbitrary, so it
      // says how many there are, which pairs with the agent count in the lead.
      const only = running.length === 1 ? running[0] : null;
      out.push(
        only ? (
          only.title
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
      if (first?.title) out.push(first.title);
      const at = first?.timestamp ? since(first.timestamp) : null;
      if (at) out.push(<span className="sp-num">{at}</span>);
      return out;
    }
    if (lastDone) {
      out.push(<>last: {lastDone.title}</>);
      const at = since(lastDone.completed_at);
      if (at) out.push(<span className="sp-num">{at}</span>);
    }
    return out;
  }, [missions.isError, missions.isLoading, running, gateCount, queue.data, lastDone]);

  // The marks, and the colour law in three lines: a working agent wears its
  // stage hue, an agent waiting on you wears ember without blinking, and a
  // chrome with nothing happening wears a grey dot and no colour at all.
  const liveMarks =
    running.length > 0 && workers.length > 0 ? (
      <MarkStack agents={workers} state="running" />
    ) : running.length === 0 && waiting.length > 0 ? (
      <MarkStack agents={waiting} state="waiting" />
    ) : null;

  const liveState = running.length ? "running" : gateCount ? "gate" : "idle";

  const scopeLabel = activeWorkspace?.name ?? null;

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
        data-rail={narrow ? "narrow" : "wide"}
        data-strip={strip ? "on" : "none"}
      >
        <header className="sp-top">
          <Link to="/today" className="sp-brand" aria-label="Supaprod, go to Today">
            {/* mono + no glow: the mark is identity, not an event, and colour
              arrives only when something happens. The glow is also a recorded
              defect on the auth door (session-handoff.md), so it is not
              carried into the chrome. */}
            <span className="sp-logo">
              <SupaprodMark size={21} mono glow={false} />
            </span>
            <span className="sp-wordmark">Supaprod</span>
          </Link>

          {scopeLabel ? (
            <Link to="/settings" className="sp-scope" title="Workspace and product">
              {scopeLabel}
              {activeProduct?.name ? (
                <>
                  <span className="sp-scope-sep">/</span>
                  {activeProduct.name}
                </>
              ) : null}
              <IconChevron className="sp-chev" />
            </Link>
          ) : null}

          {/* A button only where pressing it does something. On a run the strip
              is already on screen and permanent, so this is a status line and
              renders as a div; everywhere else it takes you to the work. A
              control that reports a fact and then does nothing when you press
              it is worse than a label. */}
          {React.createElement(
            strip ? "div" : "button",
            strip
              ? { className: "sp-live", "data-static": "true" }
              : {
                  className: "sp-live",
                  type: "button",
                  onClick: () => void navigate({ to: "/runs" }),
                  title: "Go to Runs",
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
              <span className="sp-askbtn-key">&#8984;J</span>
            </button>
            <Link
              to="/settings"
              className="sp-me"
              title={me.email ?? "Account"}
              aria-label="Account and settings"
            >
              {initialsFrom(me.email, me.name)}
            </Link>
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
              return (
                <button
                  key={stage.station}
                  type="button"
                  role={asTab ? "tab" : undefined}
                  aria-selected={asTab ? on : undefined}
                  aria-pressed={asTab ? undefined : on}
                  className="sp-stage"
                  data-state={stage.state}
                  data-on={on ? "true" : "false"}
                  onClick={() => strip.onSelect(stage.station)}
                  style={{ "--sp-hue": stageHueForStation(stage.station) } as React.CSSProperties}
                >
                  <span className="sp-stage-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="sp-stage-name">{STAGE_LABEL[stage.station]}</span>
                  <span className="sp-stage-state">{stage.note}</span>
                  {/* The dot repeats what the note already says in words, for
                    the glance that does not read. It is aria-hidden for the
                    same reason: a screen reader gets "2 waiting on you" and
                    does not need "dot" after it. */}
                  {stage.state === "gate" || stage.state === "working" ? (
                    <span
                      className="sp-stage-dot"
                      data-kind={stage.state}
                      data-moving={moving ? "true" : "false"}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="sp-mid">
          <aside className="sp-rail">
            <nav className="sp-nav" aria-label="Main">
              {RAIL.map(({ to, label, Icon, count }) => {
                const n = count ? counts[count] : 0;
                return (
                  <Link
                    key={to}
                    to={to}
                    className="sp-navrow"
                    activeProps={{ "aria-current": "page" }}
                    title={narrow ? label : undefined}
                  >
                    <Icon />
                    <span className="sp-navlabel">{label}</span>
                    {count && n > 0 ? (
                      <span className="sp-navcount" data-hot={count === "gates" ? "true" : "false"}>
                        {n}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <div className="sp-railfoot">
              <Link
                to="/settings"
                className="sp-setbtn"
                title="Settings"
                aria-label="Settings"
                activeProps={{ "aria-current": "page" }}
              >
                <IconGear />
              </Link>
              <button
                type="button"
                className="sp-collapse"
                onClick={toggleRail}
                title={narrow ? "Expand the rail" : "Collapse the rail"}
                aria-label={narrow ? "Expand the rail" : "Collapse the rail"}
                aria-pressed={narrow}
              >
                <IconPanel />
              </button>
            </div>
          </aside>

          {/* The work region is a scroll container and nothing else. A ported
            surface opts into .sp-inner; an unported one renders raw so its
            own padding is not doubled. See shell.css TRANSITION RULE. */}
          <main className="sp-work" key={pathname}>
            {children}
          </main>
        </div>
      </div>
    </RunStripProvider>
  );
}
