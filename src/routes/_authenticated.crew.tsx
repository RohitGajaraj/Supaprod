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
 *    KEEP  the roster grid, the stage groups and the hue encoding. Decided by
 *          the prototype, and it is the one surface where colour is the
 *          subject: shape says which agent, colour says which stage.
 *    KEEP  the live mark states. A running agent wears its stage hue while it
 *          runs and stops when the run does.
 *    KILL  the standing sentence "The shape is the agent, the colour is the
 *          stage it works in. Ember and blinking means it is waiting on you."
 *          Every stage group is already headed by its own coloured bar and its
 *          own name, so the legend teaches itself; and the ember half now sits
 *          next to the thing actually asking, where it is a fact rather than a
 *          rule to memorise. Three sentences of instruction for a legend that
 *          the layout already draws is scaffolding, not design.
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
 *    Everything about one agent. A roster card is a mark, a name and one line,
 *    and it never wraps. Its record, its boundary, its tool policy and what it
 *    is asking for all live on its own page, which is one click. The only thing
 *    promoted onto the roster is what genuinely needs a person: an agent asking
 *    for more room, which is drawn above the grid as a short queue.
 *
 * 5. WHAT WOULD DELIGHT, AND WHAT WOULD CONFUSE.
 *    The moment is an agent proposing its own promotion. "Engineer has opened
 *    five pull requests in a row that you did not change. Let it stop asking?"
 *    is the product's whole thesis in one card: the machine earned something,
 *    the record proves it, and the human rules on the boundary rather than on
 *    the work. It is real (trust_graduation_proposals, written by the
 *    reflection pass) and it is rendered as a Gate with a Receipt, so the
 *    judgment leaves a mark instead of vanishing into a toast.
 *    What would confuse, and is therefore refused: a control that draws a
 *    setting the runtime would silently override. Every per-tool control here
 *    offers only the modes that survive resolveToolMode unchanged, so a
 *    force-review tool shows its floor in words and no dropdown at all.
 *
 * 6. WHERE DOES THE CREW APPEAR, AND WHAT DOES IT PROVE?
 *    This surface IS the crew, so the test has to be sharper than "are agents
 *    visible". It proves three things. Attribution: every boundary on the page
 *    is attached to a named worker with a face, never to an abstract setting.
 *    Work in motion: a running agent wears its hue while it runs, read from the
 *    run rows and not from a status column someone might forget to clear.
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
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import {
  AGENT_STATION_ORDER,
  AGENT_STATIONS,
  agentBlurb,
  agentDisplayName,
  castEntries,
  catalogEntry,
  type AgentStation,
  type CatalogEntry,
} from "@/lib/agent-vocabulary";
import { useWorkspace } from "@/hooks/use-workspace";
import { stageHueForStation } from "@/components/shell/agent-glyphs";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  CtxBody,
  CtxHead,
  CtxRow,
  Empty,
  Failed,
  Gate,
  Line,
  Loading,
  Num,
  PageHead,
  Receipt,
  // Aliased: the primitive is a value, the TypeScript utility type of the same
  // name is used all over this file, and one of them shadowing the other in a
  // reader's head is a bug waiting to be written.
  Record as RecordSays,
  Row,
  Select,
  Surface,
  Switch,
  type MarkState,
} from "@/components/shell/primitives";
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
import {
  ARC_CHOICE,
  ARC_ORDER,
  MODE_CHOICE,
  MODE_PHRASE,
  REACH_CHOICE,
  RISK_NOTE,
  arcHeadline,
} from "@/components/crew/crew-words";

export const Route = createFileRoute("/_authenticated/crew")({
  // One agent open at a time, in the URL, so the browser's own back button
  // closes the detail and a teammate can be sent straight to it. A modal would
  // have neither, and a governance pane with three controls in it is exactly
  // the modal abuse the anti-slop list bans.
  // `view` earns its place in the URL for the same three reasons `agent` did:
  // the back button closes it, the address bar names what you are looking at,
  // and a teammate can be sent straight to it. It is a closed set of one, so an
  // unrecognised value falls back to the roster rather than rendering nothing.
  validateSearch: (search: Record<string, unknown>): { agent?: string; view?: "methods" } => ({
    agent: typeof search.agent === "string" && search.agent ? search.agent : undefined,
    view: search.view === "methods" ? "methods" : undefined,
  }),
  component: Crew,
  head: () => ({ meta: [{ title: "Crew · Supaprod" }] }),
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

/** A card is a button here, and the roster's own class carries the shape. The
 *  four properties below are the button reset, which the class cannot supply
 *  because it was written for a div and this lane does not own the stylesheet. */
const CARD_RESET: React.CSSProperties = {
  appearance: "none",
  background: "none",
  border: 0,
  font: "inherit",
  textAlign: "left",
  width: "100%",
  cursor: "pointer",
  color: "inherit",
};

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

function Crew() {
  const { agent, view } = Route.useSearch();
  const navigate = useNavigate();

  const open = React.useCallback(
    (slug: string | null) => {
      void navigate({ to: "/crew", search: slug ? { agent: slug } : {} });
    },
    [navigate],
  );

  // The methods surface answers a question about the crew as a WHOLE, so it
  // takes precedence over an agent left open in the same URL rather than
  // competing with it. `open(null)` clears both keys, so the one back control
  // closes whichever of the two is showing.
  if (view === "methods") return <CrewMethods onBack={() => open(null)} />;

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

  function stateFor(slug: string): MarkState {
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
    if (!m.enabled) return "quiet";
    return "idle";
  }

  const sub = crew.isLoading ? (
    "Reading the boundary in force."
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
      All <Num>{all.length}</Num> run without asking you. Nothing has been narrowed here yet.
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
      <Num>{alone}</Num> run without asking you, <Num>{asks}</Num> ask first
      {off > 0 ? (
        <>
          , <Num>{off}</Num> are switched off
        </>
      ) : null}
      .
      {onDefaults > 0 ? (
        <>
          {" "}
          <Num>{onDefaults}</Num> of the <Num>{all.length}</Num> have never been narrowed here, so
          they run on the default policy.
        </>
      ) : null}
    </>
  );

  return (
    // wide: the roster is a grid, not prose, so it wants the room rather than
    // the 74ch measure.
    <Surface wide>
      {/* SAY WHAT SIXTEEN OF. The title read "16 work here.", which omits the
          noun entirely and leaves the one word a newcomer needs to the page
          they would have to already understand to be here.
          `count` returns a number WORD below ten, so the verb has to agree with
          it: "one agent works here", "sixteen agents work here". */}
      <PageHead
        title={
          all.length === 1
            ? `${count(1)} agent works here.`
            : `${count(all.length)} agents work here.`
        }
        sub={sub}
      />

      {crew.isError ? (
        <Block>
          <Failed onRetry={() => crew.refetch()}>
            The crew did not load, so nothing below is the real boundary.
          </Failed>
        </Block>
      ) : null}

      {/* THE DOOR TO THE BOUNDARY.
        Crew answers "who works here". The boundary answers "what may they do
        without me", and until 2026-08-01 that question had no single surface:
        it was spread across four Engine Room rooms and a settings page. The
        two belong beside each other, and this is the only place in the product
        where a reader is already thinking about the crew as a group.

        A row rather than a rail entry on purpose. The rail's own comment says
        the five rows are "decided, and not to be relitigated", and quietly
        adding a sixth would be relitigating a founder ruling by commit rather
        than by asking. */}
      <Block title="What they may do without you">
        <Row
          tight
          lead="The boundary"
          sub="Every tool, across the whole crew. Set once, and it never interrupts work already running."
          onClick={() => navigate({ to: "/boundary" })}
        />
      </Block>

      {/* THE DOOR TO THE METHODS.
        The third standing question about the crew, beside "who works here" and
        "what may they do without me": HOW do they work, and what has actually
        held up. It had no door at all. `getPlaybooks` has been live server code
        with zero UI callers, while the loop has been picking a method per
        mission step on the reader's behalf the whole time
        (orchestrator.server.ts, via rankPlaybooksByOutcome), so the one thing
        the product calls its moat was invisible to the person it is meant to
        convince. Capability built, door missing.

        It sits on Crew rather than in the Engine Room or in Brain, and the
        component's own header argues that choice out. Same shape as the
        boundary door directly above, and for the same reason: a row here, not
        a sixth rail entry.

        Its own Block rather than a second row under the boundary's, because
        "what they may do without you" is a true title for exactly one of these
        two and would have to be watered down to cover both. */}
      <Block title="How they work">
        <Row
          tight
          lead="The methods"
          sub="The named ways of working the crew draws on, how often each has been used, and what has held up so far."
          onClick={() => navigate({ to: "/crew", search: { view: "methods" } })}
        />
      </Block>

      {asking.length > 0 ? (
        <Block
          title="Asking for more room"
          sub="Each one has done the same thing cleanly enough times to propose it stops asking. Open it to rule."
        >
          {asking.map((m) => (
            <Row
              key={m.slug}
              marks={
                <AgentMark
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
                    <Num>{m.runs.total}</Num> runs in this workspace
                  </>
                ) : (
                  "No runs in this workspace yet"
                )
              }
              tight
              onClick={() => onOpen(m.slug)}
            />
          ))}
        </Block>
      ) : null}

      {AGENT_STATION_ORDER.map((station) => {
        const members = byStation.get(station);
        if (!members?.length) return null;
        const hue = stageHueForStation(station);
        return (
          <section
            className="sp-stagegroup"
            key={station}
            style={{ "--sp-hue": hue } as React.CSSProperties}
          >
            <div className="sp-sg-head">
              <span className="sp-sg-bar" aria-hidden="true" />
              <span className="sp-sg-name">{AGENT_STATIONS[station].name}</span>
              <span className="sp-sg-count">
                <Num>{members.length}</Num>
              </span>
            </div>
            <div className="sp-agrid">
              {members.map((e) => {
                const m = bySlug.get(e.slug);
                return (
                  <button
                    type="button"
                    className="sp-acard"
                    key={e.slug}
                    style={CARD_RESET}
                    onClick={() => onOpen(e.slug)}
                  >
                    <AgentMark slug={e.slug} size="lg" state={stateFor(e.slug)} />
                    <span>
                      <div className="sp-aname">{e.name}</div>
                      <div className="sp-asub">
                        {/* The blurb says what it does, which is what the roster
                            teaches. The two exceptions are facts that
                            contradict the blurb: it is switched off, or this
                            account has no row for it at all. */}
                        {!m
                          ? `${agentBlurb(e.slug) ?? e.relayVerb} Runs on the default policy.`
                          : !m.enabled
                            ? "Switched off. It will not be dispatched."
                            : (agentBlurb(e.slug) ?? e.relayVerb)}
                      </div>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
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

  const back = (
    <Button variant="ghost" onClick={onBack}>
      All of them
    </Button>
  );

  if (member.isLoading) {
    return (
      <Surface>
        <PageHead title={agentDisplayName(slug)} />
        <Loading>Reading what this one is allowed to do.</Loading>
      </Surface>
    );
  }

  if (member.isError) {
    return (
      <Surface>
        <PageHead title={agentDisplayName(slug)} />
        <Block>
          <Failed onRetry={() => member.refetch()}>
            This one did not load, so the boundary shown would not be the real one.
          </Failed>
        </Block>
        <Block>{back}</Block>
      </Surface>
    );
  }

  const m = member.data;
  if (!m) {
    return (
      <Surface>
        <PageHead title="No agent by that name." />
        <Empty action={back}>
          Nothing in this account answers to that name, and nothing in the catalog does either.
        </Empty>
      </Surface>
    );
  }

  return (
    <Surface context={<MemberRecord member={m} />}>
      <PageHead
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
        <Block>
          <Empty action={back}>
            The catalog knows this one, but this account has no row for it, so there is nothing to
            govern yet. It arrives with the first mission that needs it.
          </Empty>
        </Block>
      ) : (
        <>
          <Proposals member={m} onDecided={invalidate} />
          <Boundary member={m} onChanged={invalidate} />
          <ToolPolicy member={m} onChanged={invalidate} />
          <Lessons slug={m.slug} name={m.name} />
          <Block>{back}</Block>
        </>
      )}
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
   * A keyboard audit of every binding in the product found /crew and /design
   * running gate QUEUES with no keys bound and none drawn. This surface says
   * "Settle the one above and the next takes its place" over an accept/decline
   * pair, which is the exact shape Today binds `a` and `d` for, on the same
   * `Gate` primitive. So a person who learned the keyboard on the front door
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
              It has done this <Num>{live.cleanStreak}</Num> times in a row and you changed nothing.
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
          <Button
            variant="primary"
            shortcut="a"
            disabled={decide.isPending}
            onClick={() => settle(true)}
          >
            Give it the room
          </Button>
          <Button shortcut="d" disabled={decide.isPending} onClick={() => settle(false)}>
            Not yet
          </Button>
        </Gate>
      ) : null}

      {behind.length > 0 ? (
        <Block title="Behind it" sub="Settle the one above and the next takes its place.">
          {behind.map((p) => (
            <Row
              key={p.id}
              marks={<AgentMark slug={member.slug} name={member.name} state="waiting" />}
              lead={
                <>
                  {p.toolLabel}, asking to run {MODE_PHRASE[p.toMode]}
                </>
              }
              sub={
                <>
                  <Num>{p.cleanStreak}</Num> clean in a row
                </>
              }
              time={ago(p.createdAt)}
              tight
            />
          ))}
        </Block>
      ) : null}

      {decide.isError ? (
        <Block>
          <Failed>{(decide.error as Error).message}</Failed>
        </Block>
      ) : null}

      {/* THE COMMIT. A toast confirms that your click registered; this renders
          what your click caused. No arrow is drawn: nothing picks this up, it
          is a standing rule from now on, and an arrow to nowhere is worse than
          no arrow. */}
      {decided.map((d, i) => (
        <Receipt
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

  return (
    <Block
      title="The boundary"
      sub="Set once, and it holds inside every run. Nothing here asks you again in the moment."
    >
      <Line
        label="Working in this workspace"
        sub={
          member.enabled
            ? "Switch it off and the loop will not dispatch it."
            : "It is off. Nothing dispatches it and its tools are unreachable."
        }
      >
        <Switch
          checked={member.enabled}
          disabled={enabled.isPending}
          label={`${member.name} works in this workspace`}
          onChange={(next) => enabled.mutate(next)}
        />
      </Line>

      <Line
        label="How much it decides by itself"
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
        <Select
          value={member.arc}
          disabled={arc.isPending}
          aria-label={`How much ${member.name} decides by itself`}
          onChange={(e) => arc.mutate(e.target.value as CrewArc)}
        >
          {ARC_ORDER.map((a) => (
            <option key={a} value={a}>
              {ARC_CHOICE[a]}
            </option>
          ))}
        </Select>
      </Line>

      <Line
        label="How far its tools may reach"
        sub="Anything past this is removed from its hands before a run starts, not gated during one."
      >
        <Select
          value={member.maxToolRisk ?? ""}
          disabled={cap.isPending}
          aria-label={`How far ${member.name} may reach`}
          onChange={(e) => cap.mutate(e.target.value)}
        >
          {REACH_CHOICE.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Line>

      {failure ? <Failed>{(failure as Error).message}</Failed> : null}

      {suggestion && t ? (
        <>
          <RecordSays
            evidence={
              <>
                <Num>{t.score}</Num> out of <Num>100</Num>, from <Num>{t.samples}</Num> signals
              </>
            }
          >
            {suggestion === "up"
              ? `${member.name} has earned more room than you have given it. On what it has actually done, it belongs at "${ARC_CHOICE[t.suggestedArc]}".`
              : `${member.name} has more room than its record backs. On what it has actually done, it belongs at "${ARC_CHOICE[t.suggestedArc]}".`}
          </RecordSays>
          <Actions>
            <Button
              variant="ghost"
              disabled={arc.isPending}
              onClick={() => arc.mutate(t.suggestedArc)}
            >
              {suggestion === "up" ? "Give it that" : "Pull it back"}
            </Button>
          </Actions>
        </>
      ) : null}
    </Block>
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
 * TWO BLOCKS RATHER THAN TWO LITERAL COLUMNS. Blocks are this system's
 * regions; a hand-rolled two-column grid inside one region would be a second
 * layout grammar drawn on top of the first, and it would collapse to exactly
 * these two stacked regions on the narrow width anyway. The pairing is carried
 * by the titles and by them being adjacent, which is what a reader uses.
 *
 * How many rows before a list has a bottom. A tool list is read, not browsed,
 * and forty rows in one block is a settings page again.
 */
const TOOLS_VISIBLE = 8;

function ToolPolicy({ member, onChanged }: { member: CrewMember; onChanged: () => void }) {
  const fMode = useServerFn(setCrewToolMode);
  const [showAll, setShowAll] = React.useState<Record<string, boolean>>({});
  const mode = useMutation({
    mutationFn: (v: { toolName: string; mode: CrewToolMode }) =>
      fMode({ data: { agentSlug: member.slug, ...v } }),
    onSuccess: onChanged,
  });

  if (member.noToolsEnabled) {
    return (
      <Block title="What it may do without you">
        <Empty>
          No tools are switched on for this account, so there is nothing for it to do or to ask
          about yet.
        </Empty>
      </Block>
    );
  }

  if (member.tools.length === 0) {
    return (
      <Block title="What it may do without you">
        <Empty>
          Its reach is set narrow enough that none of the switched-on tools are in its hands. Widen
          the reach above to give it some.
        </Empty>
      </Block>
    );
  }

  const alone = member.tools.filter((t) => t.resolvedMode === "auto");
  const gated = member.tools.filter((t) => t.resolvedMode !== "auto");

  // When the dial alone gates everything, listing sixty rows would be sixty
  // rows that all say the same thing and cannot be changed. Say it once.
  const dialGatesAll = member.arc === "observing";

  const column = (
    key: string,
    title: string,
    sub: React.ReactNode,
    tools: CrewToolPolicy[],
    empty: React.ReactNode,
  ) => {
    const open = showAll[key] ?? false;
    const shown = open ? tools : tools.slice(0, TOOLS_VISIBLE);
    return (
      <Block
        title={title}
        sub={sub}
        more={
          tools.length > TOOLS_VISIBLE ? (open ? "Show fewer" : `All ${tools.length}`) : undefined
        }
        onMore={() => setShowAll((s) => ({ ...s, [key]: !open }))}
      >
        {tools.length === 0 ? (
          <Empty>{empty}</Empty>
        ) : (
          shown.map((t) => (
            <ToolLine
              key={t.toolName}
              tool={t}
              pending={mode.isPending}
              onSet={(next) => mode.mutate({ toolName: t.toolName, mode: next })}
            />
          ))
        )}
      </Block>
    );
  };

  // The whole dial has overridden every tool, so the two columns would be a
  // lie in two parts. One statement instead.
  if (dialGatesAll) {
    return (
      <Block
        title="What it may do without you"
        sub={
          <>
            Nothing. All <Num>{member.tools.length}</Num> of its tools come to you.
          </>
        }
      >
        <Empty>
          While it waits for you on everything, every tool goes to review whatever each one is set
          to. Give it more room above to set them one at a time.
        </Empty>
      </Block>
    );
  }

  return (
    <>
      {column(
        "alone",
        "What it does alone",
        <>
          <Num>{alone.length}</Num> of <Num>{member.tools.length}</Num> tools, run with nobody
          watching. This is the reach you are actually granting.
        </>,
        alone,
        "Nothing runs on its own. Every tool in its hands comes back to a person first.",
      )}

      {column(
        "asks",
        "What comes to you",
        <>
          {gated.length === 0 ? (
            "Nothing stops for a person."
          ) : (
            <>
              <Num>{gated.length}</Num>{" "}
              {gated.length === 1 ? "tool stops and waits" : "tools stop and wait"} for a person
              before anything happens. Today that person is you.
            </>
          )}
        </>,
        gated,
        "Nothing. Every tool in its hands runs without asking. The safety floors still hold: a one way door would come back to you even here.",
      )}

      {mode.error ? (
        <Block>
          <Failed>{(mode.error as Error).message}</Failed>
        </Block>
      ) : null}
    </>
  );
}

function ToolLine({
  tool,
  pending,
  onSet,
}: {
  tool: CrewToolPolicy;
  pending: boolean;
  onSet: (mode: CrewToolMode) => void;
}) {
  // A floor that leaves one choice is not a choice. Drawing a dropdown there
  // would be a control that cannot do the thing it draws, which is the exact
  // defect the justification wave found in Settings.
  const settable = tool.offerable.length > 1;

  // The second line always carries DIFFERENT information from the control:
  // why it is pinned, who pinned it, or what it would touch. Never a restating
  // of the value the dropdown already shows.
  const note = tool.floor
    ? tool.floor === "review"
      ? "Pinned. There is no way back from this one."
      : "Pinned. It reaches something outside this workspace."
    : tool.storedSource === "operator"
      ? "You set this one."
      : tool.storedSource === "graduation"
        ? "It earned this one."
        : RISK_NOTE[tool.risk];

  return (
    <Line label={tool.label} sub={note}>
      {settable ? (
        <Select
          value={tool.resolvedMode}
          disabled={pending}
          aria-label={`How ${tool.label} runs`}
          onChange={(e) => onSet(e.target.value as CrewToolMode)}
        >
          {tool.offerable.map((m) => (
            <option key={m} value={m}>
              {MODE_CHOICE[m]}
            </option>
          ))}
        </Select>
      ) : null}
    </Line>
  );
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
      <Block title="What it has learned">
        <Loading>Reading its lessons.</Loading>
      </Block>
    );
  }
  if (q.isError) {
    return (
      <Block title="What it has learned">
        <Failed onRetry={() => q.refetch()}>Its lessons did not load.</Failed>
      </Block>
    );
  }

  const rows = q.data?.reflections ?? [];
  if (rows.length === 0) {
    return (
      <Block title="What it has learned">
        <Empty>
          {name} has written nothing down yet. It records a lesson after a run it can learn from.
        </Empty>
      </Block>
    );
  }

  return (
    <Block title="What it has learned" sub="Written by the agent itself, after its own runs.">
      {rows.map((r) => (
        <Row
          key={r.id}
          marks={<AgentMark slug={slug} name={name} />}
          lead={r.content}
          sub={r.metadata?.what_to_change ?? undefined}
          time={ago(r.created_at)}
          tight
        />
      ))}
    </Block>
  );
}

/* ---------------- the record, in the context column --------------- */

function MemberRecord({ member }: { member: CrewMember }) {
  const r = member.runs;
  const t = member.trust;
  const entry = catalogEntry(member.slug);

  return (
    <>
      <CtxHead>What it has done here</CtxHead>

      {r.total === 0 ? (
        <CtxBody>It has not run in this workspace yet.</CtxBody>
      ) : (
        <>
          <CtxRow
            name={
              <>
                <Num>{r.total}</Num> runs
              </>
            }
            sub={
              <>
                <Num>{r.finished}</Num> finished
                {r.failed > 0 ? (
                  <>
                    , <Num>{r.failed}</Num> failed
                  </>
                ) : null}
                {r.running > 0 ? (
                  <>
                    , <Num>{r.running}</Num> running now
                  </>
                ) : null}
              </>
            }
          />
          {r.lastAt ? <CtxRow name="Last run" sub={`${ago(r.lastAt)} ago`} /> : null}
        </>
      )}

      {t ? (
        <>
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
                    <Num>{t.score}</Num> out of <Num>100</Num>
                  </>
                }
                sub={
                  <>
                    from <Num>{t.samples}</Num> signals
                  </>
                }
              />
              {t.approvalsTotal > 0 ? (
                <CtxRow
                  name={
                    <>
                      You said yes to <Num>{t.approvalsApproved}</Num> of{" "}
                      <Num>{t.approvalsTotal}</Num>
                    </>
                  }
                  sub="calls it brought you"
                />
              ) : null}
              {t.outcomesTotal > 0 ? (
                <CtxRow
                  name={
                    <>
                      <Num>{t.outcomesValidated}</Num> of <Num>{t.outcomesTotal}</Num> turned out
                      right
                    </>
                  }
                  sub="once real signal came in"
                />
              ) : null}
            </>
          )}
        </>
      ) : (
        <>
          <CtxHead>Its record</CtxHead>
          <CtxBody>Not read. The boundary above is still yours to set.</CtxBody>
        </>
      )}

      {entry ? (
        <>
          <CtxHead>Where it works</CtxHead>
          <CtxBody>
            {AGENT_STATIONS[entry.station].name}. {AGENT_STATIONS[entry.station].blurb}
          </CtxBody>
        </>
      ) : null}
    </>
  );
}
