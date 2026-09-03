/**
 * Controls. The boundaries this workspace runs inside, and the switches that
 * move them.
 *
 * Ported off the retired system. What changed, and why:
 *
 * KILL  the eight bordered cards. This panel sits inside a region that is
 *       already a container, so eight more cards was a card inside a card
 *       eight times over. Every region is now a Block: a rule, a title, and
 *       the content flat underneath it.
 * KILL  the per-card mono label plus icon masthead. A Block already titles its
 *       region, so the icon tile and the mono heading were a second heading
 *       grammar drawn on top of the first.
 * KILL  the two hand-rolled controls, the pill toggle and the three-stop mode
 *       segment. A boundary is a sentence with a switch at the end of it,
 *       which is exactly Line plus Switch; the oversight segment became a
 *       Select, so the safety floors ride native disabled options instead of
 *       a bespoke greyed stop.
 * KILL  the consent section's chip wall. It listed the same tools rendered in
 *       full one region above it. The count says the same thing honestly.
 * KILL  the consent posture chips. One of the four wore a hue from the banned
 *       family; a posture is a policy, not an outcome, so it is words now.
 *
 * INVERTED, deliberately: the kill switch now reads "Agents may run" and is ON
 * when they can. Green carries status, and a live boundary is a live status;
 * a green track meaning "everything is stopped" said the opposite of the truth.
 * The mutation call is unchanged, only which end of it is drawn as on.
 *
 * Mechanism words stay. This is the one room where the reader is an engineer,
 * so `signal.created`, `confirm` and `halted` are the clearest true words for
 * the audience in front of them.
 *
 * Every server function, query key, mutation and the exported signature are
 * untouched: setWorkspacePause with its audit reason and system-pause lock,
 * the reactor subscription CRUD, the usage table and the confirm-mode dispatch
 * queue all behave exactly as before. (The tool-mode write was still here when
 * that was written; the third pass below removed it, and it is the one thing on
 * this list that is no longer true.)
 *
 * SECOND PASS, 2026-07-29. Two things the first port left behind:
 *
 * KILL  the six success toasts. Every write on this surface is consequential:
 *       pausing the whole crew, handing a tool back, dispatching an agent. A
 *       toast confirms that your CLICK registered and then erases itself; a
 *       Receipt renders what your click CAUSED and stays (R10, "the Commit").
 *       An approval that erases itself teaches you that your judgment left no
 *       trace, and judgment is the product. Error toasts stay: a failure has
 *       to reach you whether or not you are looking at this panel.
 * NEW   the reactor Gate. A confirm-mode event is the ONE thing on this
 *       surface that is permission asked in the moment, and it was drawn as a
 *       Line with two small buttons, identical in weight to the twelve rows of
 *       standing policy around it. The governance canon's whole split is that
 *       policy does not block and permission does, so the thing that blocks
 *       now looks different from the things that do not. One at a time, the
 *       Approvals idiom: the oldest waiting event is the Gate, the rest queue
 *       behind it as one-line rows, and the end of the queue is visible from
 *       the start.
 *
 * THIRD PASS, 2026-08-10. THE SECOND EDITOR IS GONE.
 *
 * This panel wrote `updateToolMode` - the same mutation /boundary writes, on
 * the same stored value - through a Select offering "Auto / Ask first /
 * Review", while /boundary offered "Let them do it alone / Come to me first /
 * Nobody may do this". One value, two editors, two vocabularies, and nothing
 * anywhere reconciled them: a person could tighten a tool here, open the
 * boundary, and read a sentence that did not sound like the thing they had
 * just done. Founder ruling: /boundary is the ONE home.
 *
 * So the block below STATES rather than sets. It reads `getBoundary` under the
 * same query key /boundary uses, which means the two surfaces are not merely
 * consistent, they are the same cached read - there is no arrangement of
 * events in which they can disagree about a count. The information a VP came
 * for is all still here (how much runs unattended, how much still costs an
 * interruption, what is switched off outright); only the second set of levers
 * is gone, replaced by one door.
 *
 * AND IT NO LONGER DISPLAYS A BOUNDARY THE RUNTIME WILL NOT HONOUR. See
 * `demoted` below: the previous pass stapled a bolded warning onto the row's
 * sub-line while the Select beside it still read "Ask first". A control that
 * displays a value the system does not honour is worse than no control, and a
 * warning under it does not repair the control, it just makes the screen argue
 * with itself. The control is gone, the affected tools are counted where they
 * actually land, and the disagreement with the stored value is named out loud
 * instead of being footnoted.
 */
import { useServerFn } from "@tanstack/react-start";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  NothingYet,
  Num,
  Picker,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Input } from "@/components/meridian/forms";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import { getBoundary, getGovernanceOverview, setWorkspacePause } from "@/lib/governance.functions";
import { humanWriteError } from "@/lib/roles.functions";
import { BoundaryStatement } from "./BoundaryStatement";
import { useGovernedWrite } from "@/hooks/use-workspace-role";
import {
  listEventSubscriptions,
  upsertEventSubscription,
  deleteEventSubscription,
  listEventQueue,
  decideEventDispatch,
} from "@/lib/reactor.functions";
import { relTime, fmtUsd } from "@/components/product/format";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { CONSENT_PHILOSOPHY, groupToolsByConsequenceClass } from "@/lib/consent-classes";
import { Receipt } from "@/components/meridian/Receipt";
import { Ask } from "@/components/meridian/Ask";
import { askQuestion } from "@/components/meridian/question";
import { AgentMark } from "@/components/meridian/marks";
import { useConfirm } from "@/hooks/use-confirm";

type EventType =
  | "signal.created"
  | "opportunity.scored"
  | "prd.approved"
  | "signal.clustered"
  | "outcome.recorded"
  | "decision.made";

/**
 * What each event IS, in the words the picker below already puts beside it.
 *
 * `signal.created` is the key the reactor routes on, and it was reaching the
 * page in six places: the pipeline name, both add receipts, the live-event
 * line, and the history rows. The dotted key is the engine's own address for a
 * moment, and a person setting policy is owed the moment. An event this map
 * has not seen prints its key rather than a guess, which is the honest failure
 * on a surface about what runs unattended.
 */
const EVENT_WORD: Record<string, string> = {
  "signal.created": "A new signal",
  "opportunity.scored": "An opportunity scored",
  "prd.approved": "A spec approved",
  "signal.clustered": "Signals clustered",
  "outcome.recorded": "An outcome recorded",
  "decision.made": "A decision made",
};

function eventWord(type: string): string {
  return EVENT_WORD[type] ?? type;
}

/** What a decided write left behind. `handoff` is drawn only when something
 *  real picks the work up, which on this surface is a dispatched agent and
 *  nothing else. Never an arrow to nowhere. */
type Committed = {
  verb: string;
  consequence: string;
  at: string;
  handoff?: { slug: string | null | undefined } | null;
};

/** A quiet fact that hangs off a control rather than sitting on its own line. */
const NOTE = {
  fontSize: "var(--mrd-t-label)",
  color: "var(--mrd-mute)",
  marginTop: "var(--mrd-s3)",
  maxWidth: "56ch",
};

/** The right-hand word in a Line: a status, a posture, a mode. */
const CONTROL_WORD = {
  fontSize: "var(--mrd-t-label)",
  color: "var(--mrd-mute)",
};

/** What a reactor event is about, taken from its own payload. A payload with no
 *  title is named generically rather than given an invented one - and never by
 *  eight characters of its uuid, which asked "Let Scout run on 3f2a1b9c?" and
 *  named nothing a person could recognise. */
function eventLabel(e: { payload: unknown; source_id: string }): string {
  const t = (e.payload as Record<string, unknown> | null)?.title;
  return typeof t === "string" && t.trim() ? t : "this event";
}

/** relTime hands back "now" for anything under a minute, so "now ago" has to be
 *  caught rather than concatenated. */
function firedPhrase(iso: string): string {
  const t = relTime(iso);
  return t === "now" ? "just now" : `${t} ago`;
}

export function ControlsPanel({
  onOpenQueue,
  boundaryElsewhere = false,
  controlsOnly = false,
}: {
  onOpenQueue?: () => void;
  /**
   * True when the surface mounting this panel has ALREADY put the tool boundary
   * on a tab of its own, which the Safety room now does: its front tab is named
   * "What is allowed", and the boundary is the answer to that question.
   *
   * Settings > Controls has no such tab, so it leaves this false and keeps the
   * block. Either way it is the same component reading the same cache entry, so
   * this decides where the statement is drawn and never what it says.
   */
  boundaryElsewhere?: boolean;
  /**
   * DRAW THE CONTROLS AND NOT THE HISTORY.
   *
   * This panel holds six regions and only four of them set anything. "Recent
   * runs" is a spend log and "Reactor activity" is a queue of events waiting on
   * a decision. Both are real and neither is an answer to "what may these
   * agents do without asking me", which is the question the Settings pane
   * mounting this panel is titled for.
   *
   * The founder's verdict on that pane was that it fails at every depth, and
   * this is one of the reasons why: a person came for four switches and got
   * them underneath, then past, a run-by-run spend history.
   *
   * The history is NOT deleted and does not move. It still draws at the Engine
   * Room address, which passes nothing and gets the whole panel, so this flag
   * decides where a region is drawn and never whether it exists.
   */
  controlsOnly?: boolean;
}) {
  const { activeWorkspaceId } = useWorkspace();
  /**
   * The pause switch is platform policy, not a user row: `kill_switches` writes
   * are owner or admin. It is asked in the workspace this panel is actually
   * showing, because a person can be an owner in one and a viewer in the next.
   *
   * The `agent_tools` pair that used to sit beside it is gone with the editor
   * it guarded. Nothing on this panel writes a tool boundary any more, so
   * asking whether the reader may is asking about a control that is not here.
   */
  const qc = useQueryClient();
  const navigate = useNavigate();
  const overviewFn = useServerFn(getGovernanceOverview);
  const boundaryFn = useServerFn(getBoundary);
  const listSubsFn = useServerFn(listEventSubscriptions);
  const upsertSubFn = useServerFn(upsertEventSubscription);
  const deleteSubFn = useServerFn(deleteEventSubscription);
  const listQueueFn = useServerFn(listEventQueue);
  const decideEvtFn = useServerFn(decideEventDispatch);

  const overview = useQuery({
    queryKey: ["governance", "overview", activeWorkspaceId],
    queryFn: () => overviewFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
  });
  const subsQ = useQuery({
    queryKey: ["reactor", "subs", activeWorkspaceId],
    queryFn: () => listSubsFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
  });
  const queueQ = useQuery({
    queryKey: ["reactor", "queue", activeWorkspaceId],
    queryFn: () => listQueueFn({ data: { workspaceId: activeWorkspaceId ?? null } }),
    refetchInterval: 5000,
  });
  /**
   * THE SAME READ /boundary MAKES, UNDER THE SAME KEY.
   *
   * Not "a read that agrees with it" - the identical key and the identical
   * server function, so TanStack hands both surfaces one cache entry. Two
   * copies of a governance count that merely happen to match today is how the
   * vocabulary drift this pass removed got in.
   */
  const boundaryQ = useQuery({
    queryKey: ["boundary", activeWorkspaceId],
    queryFn: () => boundaryFn(),
  });

  // THE COMMIT. Every write below leaves a Receipt carrying what it caused,
  // rather than a toast confirming that the click landed.
  const [committed, setCommitted] = useState<Committed[]>([]);
  const commit = (
    verb: string,
    consequence: string,
    handoff?: { slug: string | null | undefined } | null,
  ) => setCommitted((c) => [...c, { verb, consequence, at: new Date().toISOString(), handoff }]);

  type UpsertSubInput = {
    id?: string;
    event_type: EventType;
    target_agent_slug: string;
    approval_mode: "auto" | "confirm";
    enabled?: boolean;
    filter?: Record<string, unknown>;
  };
  const pipeName = (s: { event_type: string; target_agent_slug: string }) =>
    `${eventWord(s.event_type)} → ${agentDisplayName(s.target_agent_slug)}`;

  const toggleSubMut = useMutation({
    mutationFn: (v: UpsertSubInput & { name: string }) => upsertSubFn({ data: v }),
    onSuccess: (_d, v) => {
      commit(
        v.enabled ? "You turned it on" : "You turned it off",
        v.enabled
          ? `${v.name} routes itself again, starting with the next matching event.`
          : `${v.name} stops routing. Matching events sit there until you turn it back on.`,
      );
      qc.invalidateQueries({ queryKey: ["reactor", "subs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const addSubMut = useMutation({
    mutationFn: (v: UpsertSubInput) => upsertSubFn({ data: v }),
    onSuccess: (_d, v) => {
      commit(
        "You added a pipeline",
        v.approval_mode === "auto"
          ? `${eventWord(v.event_type)} dispatches ${agentDisplayName(v.target_agent_slug)} the moment it fires, without asking you.`
          : `${eventWord(v.event_type)} comes to you for a confirm before ${agentDisplayName(v.target_agent_slug)} runs.`,
      );
      setAddOpen(false);
      qc.invalidateQueries({ queryKey: ["reactor", "subs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteSubMut = useMutation({
    mutationFn: (v: { id: string; name: string }) => deleteSubFn({ data: { id: v.id } }),
    onSuccess: (_d, v) => {
      commit("You removed a pipeline", `${v.name} stops firing. Nothing routes on that event now.`);
      qc.invalidateQueries({ queryKey: ["reactor", "subs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  /*
   * ── THE REVERSIBLE CONTROL SITS RIGHT BESIDE THE IRREVERSIBLE ONE ────────
   *
   * The Toggle two lines below turns a pipeline OFF and back on. Remove deletes
   * the row. They sit in the same Line, and only the one you cannot undo fired
   * on a single click.
   *
   * That is the fourth instance of one inversion in this repo. `MembersCard`
   * records the first and says /boundary found the second on its own mode
   * controls; RUN-120 found the third on the run screen. 18 pipelines are live
   * right now, all enabled, and each is a route from an event to an agent -- so
   * a mis-click stops work routing and the only tell is a toast.
   *
   * The success note already says "<name> stops firing. Nothing routes on that
   * event now." This asks the same thing BEFORE, where a person can still act
   * on it, and points at the toggle, which is what most people actually want.
   */
  const confirm = useConfirm();
  const askThenDeleteSub = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Remove the ${name} pipeline?`,
      body: `Nothing routes on that event afterwards, so work that would have reached this agent stops arriving. If you only want it to stop for now, the switch beside this row turns it off and back on again. Removing it means building the route from scratch.`,
      confirmLabel: "Remove the pipeline",
      destructive: true,
    });
    if (ok) deleteSubMut.mutate({ id, name });
  };

  const decideEvtMut = useMutation({
    mutationFn: (v: {
      eventId: string;
      decision: "approve" | "reject";
      agentSlug: string;
      label: string;
    }) => decideEvtFn({ data: { eventId: v.eventId, decision: v.decision } }),
    onSuccess: (_d, v) => {
      // The one write on this surface that genuinely hands work to someone, so
      // the receipt draws the arrow. Skipping hands it to nobody, so it does not.
      commit(
        v.decision === "approve" ? "You dispatched it" : "You skipped it",
        v.decision === "approve"
          ? `${agentDisplayName(v.agentSlug)} is running on ${v.label} now.`
          : `Nothing ran. ${v.label} stays on the record as skipped.`,
        v.decision === "approve" ? { slug: v.agentSlug } : null,
      );
      qc.invalidateQueries({ queryKey: ["reactor"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<EventType>("signal.created");
  const [newAgent, setNewAgent] = useState("discovery");
  const [newMode, setNewMode] = useState<"auto" | "confirm">("confirm");
  const [newMinScore, setNewMinScore] = useState("8");

  const data = overview.data;
  const ks = data?.killState;
  const killed = !!(ks?.system_paused || ks?.workspace_paused);
  const stuck = (data?.approvals ?? []).filter((a) => a.escalation_state === "expired").length;
  const subs = subsQ.data?.subscriptions ?? [];
  const runs = data?.runs ?? [];
  const events = queueQ.data?.events ?? [];
  // A confirm-mode event that nobody has settled is the one shape on this
  // surface that BLOCKS. Oldest first, so the queue drains in the order it
  // arrived rather than in whatever order the read came back.
  const waiting = events
    .filter((e) => e.status === "pending" && e.approval_mode === "confirm")
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const live = waiting[0] ?? null;
  const deciding = (id: string) => decideEvtMut.isPending && decideEvtMut.variables?.eventId === id;

  const bd = boundaryQ.data;
  // Consent classes are grouped over the tools an agent can actually reach,
  // which is exactly the boundary's live-and-not-off set. Reading it from here
  // rather than from a second listTools call is what keeps this block and the
  // three counts above it describing one list.
  const reachable = [...(bd?.alone ?? []), ...(bd?.asks ?? [])];

  if (overview.error) {
    return (
      /* The ERROR goes to the primitive rather than its message onto the
         screen. ReadFailed knows that a dead session gets a way to /login,
         where a "Try again" would re-read with the same dead token forever. */
      <ReadFailed error={overview.error} onRetry={() => void overview.refetch()}>
        Controls did not load.
      </ReadFailed>
    );
  }

  /*
   * A SURFACE HOLDS ITS SHAPE WHILE IT READS, and for a while this line said so
   * and then did the opposite. It was `if (overview.isLoading) return null`,
   * which does not hold the shape, it drops the shape.
   *
   * This component is the whole body of Settings > Controls AND of the Engine
   * Room's Safety room, so a person who clicked in to answer "what may my crew
   * do without me" got the section heading they navigated to and then a blank
   * rectangle under it until one query landed: no kill switch, no pipelines, no
   * boundary counts, and no reactor Gate, which is the one thing on this
   * surface with an agent stopped mid-run waiting on a human.
   *
   * It was also hiding regions whose data was already in hand. `boundaryQ`
   * reads under the same key /boundary uses, so arriving from that surface you
   * stared at nothing while the counts sat warm in the cache.
   *
   * Every region below guards its own query independently, so only the
   * Boundaries block has anything to wait for, and it now says it is reading in
   * the same shape the boundary block a few hundred lines down already used.
   * Do not reinstate an early return here.
   */

  /** What the pause switch currently lets through, or why it is locked.
   *
   *  A system-wide pause outranks the role, because it locks the switch for
   *  everybody including the owner. Below that, the role is the reason, and it
   *  is said here rather than left as a switch that does nothing. */
  const pauseSub = ks?.system_paused
    ? "A system-wide pause is on, which locks the switch for everybody including the owner."
    : killed
      ? "Every agent is holding. Nothing was lost. The switch is on the boundary above."
      : "Nothing is stopped. The switch that stops it is on the boundary above.";

  return (
    <>
      {/* PERMISSION ASKED IN THE MOMENT OUTRANKS EVERY STANDING POLICY ON THE
          PAGE, and until 2026-08-11 it did not: the Gate rendered sixth, below
          an unbounded list of recent runs, while its own note claimed the end
          of the queue was "visible from the start". The governance canon this
          file cites is that policy does not block and permission does, so the
          one thing on this surface with an agent stopped mid-run waiting on a
          human is now the first thing on it.

          One at a time, so there is one primary action on screen. */}
      {live ? (
        <Ask
          question={askQuestion(
            `Let ${agentDisplayName(live.target_agent_slug)} run on ${eventLabel(live)}`,
          )}
          reason={`${eventWord(live.event_type)} fired ${firedPhrase(live.created_at)}, and this pipeline asks you before it dispatches.`}
          risk="Skipping runs nothing. The event stays on the record either way."
          fallback={{ kind: "irreversible" }}
          answer={{
            label: "Dispatch it",
            busy: deciding(live.id),
            onPress: () =>
              decideEvtMut.mutate({
                eventId: live.id,
                decision: "approve",
                agentSlug: live.target_agent_slug,
                label: eventLabel(live),
              }),
          }}
          decline={{
            label: "Skip it",
            onPress: () =>
              decideEvtMut.mutate({
                eventId: live.id,
                decision: "reject",
                agentSlug: live.target_agent_slug,
                label: eventLabel(live),
              }),
          }}
        />
      ) : null}

      {/* THE STOP, ON ITS OWN, IN THE TAB'S OWN WORDS. It used to be one Line
          inside a block titled "Boundaries", drawn identically to a hardcoded
          concurrency cap two rows below it, under a tab whose descriptor reads
          "Stop the machine now, if you have to." A kill switch with no more
          weight than a 5 is a kill switch nobody finds in the minute they need
          it. The standing limits it used to share a block with are their own
          region below, because a limit that has always been there and a switch
          you are about to throw are different kinds of fact. */}
      <Region title="Stop the machine">
        {overview.isLoading ? (
          <Reading>Reading whether the crew is running.</Reading>
        ) : (
          <>
            {/*
             * A READOUT, NOT AN EDITOR (S0 ruling A-006 section 2).
             *
             * BoundaryControls is the only editor of this switch now. It was
             * a live toggle here while that panel drew a read-only line, and
             * both were mounted on the same settings pane -- so one stale
             * read could show a person the OPPOSITE of the truth about
             * whether their agents were running. That is the one fact on this
             * page nobody may be wrong about, and two editors of it is worse
             * than two names for one destination.
             *
             * The state still reads from THIS panel's own `overview`, so this
             * line is never a guess about what the other panel holds.
             */}
            <Line label="Agents may run" sub={pauseSub}>
              <Value tone={killed ? "fail" : undefined}>{killed ? "Paused" : "Running"}</Value>
            </Line>
            {ks?.reason ? <div style={NOTE}>On record: {ks.reason}</div> : null}
          </>
        )}
      </Region>

      <Region title="Standing limits">
        {overview.isLoading ? (
          <Reading>Reading the limits this workspace runs inside.</Reading>
        ) : (
          <>
            {/*
             * THIS SAID 5, AND NOTHING HAS EVER LIMITED IT (2026-08-31).
             *
             * `MISSION_CONCURRENCY_CAP = 5` is exported from
             * `governance.functions.ts:463` and has exactly TWO references in the
             * repository: its own definition, and the `<Num>` that used to render
             * here. **Nothing reads it**, so nothing queued and nothing was at
             * capacity. Searched for an enforcement under other names too
             * (`maxInFlight`, `at capacity`, concurrency limiting in the dispatch
             * path); every hit is unrelated, being optimistic locking, digest
             * batching, or the Linear API rate limit.
             *
             * MEASURED, BECAUSE A GREP ALONE PROVES ONLY THAT I DID NOT FIND IT.
             * Live database, same day: **330 of 397 missions are open right now**,
             * and the peak in a single workspace is **94** open at once, taking
             * `created_at` to `coalesce(completed_at, archived_at)` as the window.
             * A cap of five cannot have been in force while ninety-four ran.
             *
             * WHY THE NUMBER GOES RATHER THAN THE LINE. This Region is "Standing
             * limits" and a company reads it to decide whether to put real work
             * through this (§0.7 rank 5). The absence of a concurrency ceiling is
             * exactly the kind of thing they need to know, so deleting the row
             * would hide a real fact; keeping the 5 was standard #7's "invented
             * number", which is the one bar that deletes a claim rather than
             * sending it back. So the row stays and says what is true.
             *
             * NOT WRITTEN AS "unlimited". R-22's rule is that an absence must
             * never be dressed as a deliberate choice, and nobody chose this.
             *
             * The orphaned constant is in S0's file and is theirs to wire or
             * delete: `coordination/requests/S3/a-cap-nothing-enforces.md`.
             */}
            <Line
              label="Missions at once"
              sub="Nothing caps this today. A new goal starts straight away however many are already running, so this is not a limit you can rely on yet."
            />
            <Line
              label="Approvals past their deadline"
              sub={
                stuck > 0
                  ? "Nobody settled these in time. They are still waiting on you."
                  : "Nothing has aged out."
              }
            >
              {/* Ember marks the one thing waiting on you, and only when something is. */}
              <span style={{ color: stuck > 0 ? "var(--mrd-you)" : undefined }}>
                <Num>{stuck}</Num>
              </span>
              {onOpenQueue ? (
                <Action variant="quiet" onClick={onOpenQueue}>
                  Open the queue
                </Action>
              ) : null}
            </Line>
          </>
        )}
      </Region>

      <Region
        title="Auto-pipelines"
        sub="What routes an event to an agent without asking you first."
        /* `toggle` and not `act` or `goTo`: the form this opens renders INSIDE
           this region, below the rules it adds to, so what expands is this
           region and `aria-expanded` is the true thing to say. The control
           hides itself while the form is open, which is why `toggled` reads
           false wherever it is drawn -- the form's own Cancel closes it. */
        toggle={addOpen ? undefined : "Add a rule"}
        onToggle={() => setAddOpen(true)}
        toggled={addOpen}
      >
        {/* THE THREE ARMS, IN THE ORDER THE FILE ALREADY ARGUES FOR ELSEWHERE.
            `subs` is `subsQ.data?.subscriptions ?? []`, so without the loading
            arm this region asserted "no pipeline rules yet" as a fact from the
            first paint - directly beneath a Boundaries block that was honestly
            saying it was still reading. On a governance surface "no pipeline
            routes anything without asking you" and "we have not looked yet" are
            opposite facts. The Empty is reachable only after a read that
            SUCCEEDED. */}
        {subsQ.isError ? (
          <ReadFailedLine error={subsQ.error} onRetry={() => void subsQ.refetch()}>
            Pipeline rules did not load.
          </ReadFailedLine>
        ) : subsQ.isLoading ? (
          <Reading>Reading the pipeline rules.</Reading>
        ) : subs.length === 0 ? (
          <NothingYet>
            No pipeline rules yet. Add one and the next matching event routes itself.
          </NothingYet>
        ) : (
          subs.map((s) => {
            const filter = (s.filter as Record<string, unknown>) ?? {};
            const minScore = typeof filter.min_score === "number" ? filter.min_score : null;
            const desc =
              (s.approval_mode === "auto"
                ? "Dispatches the agent the moment the event fires"
                : "Waits for your confirm before dispatching") +
              (minScore != null ? ` · min ICE ${minScore}` : "") +
              (s.is_default ? " · default" : "");
            return (
              <Line
                key={s.id}
                label={
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--mrd-s3)",
                    }}
                  >
                    <AgentMark slug={s.target_agent_slug} state={s.enabled ? "idle" : "quiet"} />
                    <span>
                      <Num>{eventWord(s.event_type)}</Num> → {agentDisplayName(s.target_agent_slug)}
                    </span>
                  </span>
                }
                sub={desc}
              >
                <Action
                  variant="quiet"
                  title="It stops firing."
                  busy={deleteSubMut.isPending}
                  onClick={() => void askThenDeleteSub(s.id, pipeName(s))}
                >
                  Remove
                </Action>
                <Toggle
                  checked={s.enabled}
                  label={`${pipeName(s)} pipeline`}
                  disabled={toggleSubMut.isPending}
                  onChange={() =>
                    toggleSubMut.mutate({
                      id: s.id,
                      event_type: s.event_type as EventType,
                      target_agent_slug: s.target_agent_slug,
                      approval_mode: s.approval_mode as "auto" | "confirm",
                      enabled: !s.enabled,
                      filter,
                      name: pipeName(s),
                    })
                  }
                />
              </Line>
            );
          })
        )}

        {addOpen ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const filter: Record<string, unknown> = {};
              if (newEvent === "opportunity.scored" && newMinScore.trim()) {
                const n = Number(newMinScore);
                if (Number.isFinite(n)) filter.min_score = n;
              }
              addSubMut.mutate({
                event_type: newEvent,
                target_agent_slug: newAgent.trim(),
                approval_mode: newMode,
                enabled: true,
                filter,
              });
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "var(--mrd-s4)",
              }}
            >
              <Field label="Event" htmlFor="pipeline-event">
                <Picker
                  id="pipeline-event"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value as EventType)}
                >
                  <option value="signal.created">New signal · signal.created</option>
                  <option value="opportunity.scored">
                    Opportunity scored · opportunity.scored
                  </option>
                  <option value="prd.approved">Spec approved · prd.approved</option>
                  <option value="signal.clustered">Signals clustered · signal.clustered</option>
                  <option value="outcome.recorded">Outcome recorded · outcome.recorded</option>
                  <option value="decision.made">Decision made · decision.made</option>
                </Picker>
              </Field>
              <Field label="Agent" htmlFor="pipeline-agent">
                <Input
                  id="pipeline-agent"
                  value={newAgent}
                  onChange={(e) => setNewAgent(e.target.value)}
                  placeholder="agent slug"
                />
              </Field>
              <Field label="Before it runs" htmlFor="pipeline-mode">
                <Picker
                  id="pipeline-mode"
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value as "auto" | "confirm")}
                >
                  <option value="confirm">Ask first</option>
                  <option value="auto">Auto</option>
                </Picker>
              </Field>
              {newEvent === "opportunity.scored" ? (
                <Field label="Min ICE" htmlFor="pipeline-min-ice">
                  <Input
                    id="pipeline-min-ice"
                    value={newMinScore}
                    onChange={(e) => setNewMinScore(e.target.value)}
                    placeholder="8"
                    inputMode="decimal"
                  />
                </Field>
              ) : null}
            </div>
            <Actions>
              <Action
                variant="primary"
                type="submit"
                disabled={addSubMut.isPending || !newAgent.trim()}
              >
                Add rule
              </Action>
              <Action variant="quiet" onClick={() => setAddOpen(false)}>
                Cancel
              </Action>
            </Actions>
          </form>
        ) : null}
      </Region>

      {/* THE BOUNDARY, STATED. NOT A SECOND PLACE TO SET IT.

          It lives in BoundaryStatement.tsx now, because the Safety room's front
          tab is named "What is allowed" and these are the three lines that
          answer it. Settings > Controls mounts the same component, off the same
          cached `getBoundary` read under the same key /boundary uses, so the two
          cannot disagree about a count. `boundaryElsewhere` is how the Safety
          room says it has already put this on the tab whose name promises it. */}
      {/* `controlsOnly` is set by the Settings pane and by nothing else, and that
          pane renders BoundaryControls above this, whose posture line already
          states the "set once, moving one never interrupts" rule. The Engine
          Room passes nothing, so the statement keeps its rule there. */}
      {boundaryElsewhere ? null : <BoundaryStatement ruleShownElsewhere={controlsOnly} />}

      {/* The SAME tools the boundary counts are drawn from, grouped by blast
          radius with the trust-ladder default posture per class. Consent is a
          per-class idea, not a per-tool one; this states what each class
          defaults to, and the boundary is where a specific tool moves.

          THE SAME QUERY MEANS THE SAME ARMS. This block used to open straight
          on `reachable.length === 0`, and `reachable` is built off `bd`, which
          is undefined whenever the boundary read fails. So a failed read landed
          on the Empty and told a person, as a fact, that no tool is switched on
          and therefore no blast-radius class holds anything - the single most
          reassuring reading available of a read that produced no information,
          on the one surface where the answer is about consent.

          It also put the two blocks in open contradiction on one screen: the
          block above already says the boundary did not load. Same query, same
          arms, and the Empty is reachable only after a read that SUCCEEDED. */}
      <Region title="Consent by consequence" sub={CONSENT_PHILOSOPHY}>
        {boundaryQ.isError ? (
          <ReadFailedLine error={boundaryQ.error} onRetry={() => void boundaryQ.refetch()}>
            The boundary did not load, so nothing here would be the real reach of any class.
          </ReadFailedLine>
        ) : boundaryQ.isLoading ? (
          <Reading>Reading which tools your crew can reach.</Reading>
        ) : reachable.length === 0 ? (
          <NothingYet>No tools enabled yet, so no class has anything in it.</NothingYet>
        ) : (
          groupToolsByConsequenceClass(reachable, (t) => t.name)
            .filter((g) => g.tools.length > 0)
            .map((g) => (
              <Line key={g.id} label={g.label} sub={g.description}>
                <Num>{g.tools.length}</Num>
                <span style={CONTROL_WORD}>{g.defaultPosture.label}</span>
              </Line>
            ))
        )}
      </Region>

      {controlsOnly ? (
        /* WHAT IS NOT DRAWN HERE, AND WHERE IT IS. Hiding two regions without
           saying so would leave a reader who has seen the full panel elsewhere
           wondering which of the two surfaces is broken.

           "THEY ARE IN THE ENGINE ROOM" WAS THE LAST RETIRED WORD ON THIS PREFIX
           (§12, 2026-09-01). The map sends *Engine Room · Guardrails · Govern ·
           Boundary · Safety* to one plain phrase, and §12's own warning is that a
           word renamed in one place and left stale in another has made the
           problem worse. S2 has applied the rail labels; this was the matching
           destination-side sentence, and it was the ONLY user-facing instance
           left across governance, engine-room, brain, memory, knowledge, trust,
           settings and billing. Measured before changing it, not assumed.

           It now points by the DOOR rather than by the room, which is also more
           useful: the control below navigates there, so the sentence names what
           the reader will find rather than a place they have to hold in mind. */
        <Region
          title="What each run spent, and what is waiting"
          sub="The run-by-run spend history and the queue of events waiting on a decision are not on this page, because neither answers what the crew may do. The control below opens them."
        >
          <Actions>
            <Action
              variant="quiet"
              onClick={() => void navigate({ to: "/engine-room", search: { room: "safety" } })}
            >
              {/* NAMES WHAT IT OPENS, not the room it lives in (§12). This read
                  "Open the Engine Room", and it is the instance a prop-only
                  sweep misses: it is JSX TEXT, so grepping title=/label= does
                  not see it. The guard beside this file found it after I had
                  already declared the prefix clean. */}
              Open spending and the queue
            </Action>
          </Actions>
        </Region>
      ) : null}

      {!controlsOnly ? (
        <>
          {/*
           * "AGAINST THE CAPS IT WAS GIVEN" WAS HALF TRUE, and the half that
           * was not is invisible from the row.
           *
           * Measured on the live database 2026-08-27: of 2,570 runs in 30 days,
           * 2,555 carry a `mission_spend_cap_usd` and ZERO carry a
           * `mission_token_cap`. Not a few. None, ever.
           *
           * `executeLoop` takes an optional `missionTokenCap` and writes it to
           * the row, and NO CALLER PASSES ONE -- the only three references in
           * src/ are the type, and the two writes of `?? null`. So the token
           * gate in `checkMissionCaps` cannot fire, and this row's token figure
           * is a usage number rather than a comparison.
           *
           * The row itself was already honest: it prints "of N" only when a cap
           * exists, so it says "1,234 tokens" and claims nothing. It was the
           * REGION HEADING that promised a comparison for both numbers. It now
           * promises it for the one that has it, and the token figure reads as
           * what it is. Filed with S0, whose `src/lib/ai` the unwired input is.
           */}
          <Region
            title="Recent runs"
            sub="What each run spent against the ceiling it was given, and the tokens it used."
          >
            {/* `runs` is `data?.runs ?? []`, so "no mission runs yet" was asserted
            from the first paint of every load. The only overview.isLoading
            guard in this file used to sit in the Boundaries block, three
            regions up, which put one honest region and one asserting region on
            screen together out of a single unfinished read. */}
            {overview.isLoading ? (
              <Reading>Reading what the crew has run.</Reading>
            ) : runs.length === 0 ? (
              <NothingYet>
                No mission runs yet. The first one starts when you give the crew a goal.
              </NothingYet>
            ) : (
              runs.map((r) => {
                const halted = r.status === "halted" || !!r.halted_reason;
                const tokCap = r.mission_token_cap;
                const spendCap = r.mission_spend_cap_usd ? Number(r.mission_spend_cap_usd) : null;
                const tokHot = tokCap ? (r.tokens_used ?? 0) / tokCap >= 0.8 : false;
                const spendHot = spendCap ? Number(r.spend_used_usd ?? 0) / spendCap >= 0.8 : false;
                const statusWord = halted ? "halted" : r.status;
                const statusClass =
                  halted || r.status === "failed"
                    ? "sp-fail"
                    : r.status === "completed"
                      ? "sp-pass"
                      : undefined;
                return (
                  <Row
                    key={r.id}
                    tight
                    // Every run says who made it. The catalog name when the slug is
                    // known, the stored name when it is not.
                    marks={
                      <AgentMark
                        slug={r.agent_slug}
                        name={r.agent_name}
                        state={
                          halted || r.status === "failed"
                            ? "failed"
                            : r.status === "running"
                              ? "running"
                              : "quiet"
                        }
                      />
                    }
                    lead={agentDisplayName(r.agent_slug, r.agent_name)}
                    // The second line is the outcome and what it cost, never the
                    // name again. A halted run says why instead of what it spent.
                    sub={
                      <>
                        <span className={statusClass}>{statusWord}</span>
                        {halted && r.halted_reason ? (
                          <> · {r.halted_reason}</>
                        ) : (
                          <>
                            {" · "}
                            <span className={tokHot ? "sp-warn" : undefined}>
                              <Num>{r.tokens_used ?? 0}</Num>
                              {tokCap ? (
                                <>
                                  {" of "}
                                  <Num>{tokCap}</Num>
                                </>
                              ) : null}
                              {" tokens"}
                            </span>
                            {" · "}
                            <span className={spendHot ? "sp-warn" : undefined}>
                              <Num>{fmtUsd(r.spend_used_usd ?? 0)}</Num>
                              {spendCap ? (
                                <>
                                  {" of "}
                                  <Num>{fmtUsd(spendCap)}</Num>
                                </>
                              ) : null}
                            </span>
                          </>
                        )}
                      </>
                    }
                    time={relTime(r.created_at)}
                  />
                );
              })
            )}
          </Region>

          <Region
            title="Reactor activity"
            sub={
              waiting.length > 1 ? (
                <>
                  <Num>{waiting.length - 1}</Num> more are waiting behind the one at the top of this
                  page. Settle it and the next takes its place.
                </>
              ) : (
                "What the rules above routed, and what came of it."
              )
            }
          >
            {queueQ.isError ? (
              <ReadFailedLine error={queueQ.error} onRetry={() => void queueQ.refetch()}>
                Reactor activity did not load.
              </ReadFailedLine>
            ) : queueQ.isLoading ? (
              <Reading>Reading the reactor queue.</Reading>
            ) : events.length === 0 ? (
              <NothingYet>
                No reactor events yet. One appears the moment a rule above matches.
              </NothingYet>
            ) : (
              events
                // The one being asked is drawn as the Gate at the top of the page,
                // so it is not drawn twice.
                .filter((e) => e.id !== live?.id)
                .map((e) => {
                  const isPending = e.status === "pending" && e.approval_mode === "confirm";
                  const statusClass =
                    e.status === "dispatched"
                      ? "sp-pass"
                      : e.status === "failed"
                        ? "sp-fail"
                        : undefined;
                  return (
                    <Line
                      key={e.id}
                      label={
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "var(--mrd-s3)",
                          }}
                        >
                          {/* Ember without the blink for the ones queued behind:
                          exactly one mark on a screen may blink, and it is the
                          Gate's. */}
                          <AgentMark
                            slug={e.target_agent_slug}
                            state={
                              isPending
                                ? "waiting"
                                : e.status === "failed"
                                  ? "failed"
                                  : e.status === "dispatched"
                                    ? "idle"
                                    : "quiet"
                            }
                          />
                          <span>
                            <Num>{eventWord(e.event_type)}</Num> to{" "}
                            {agentDisplayName(e.target_agent_slug)}
                          </span>
                        </span>
                      }
                      sub={
                        <>
                          {e.error ? <span className="sp-fail">{e.error}</span> : eventLabel(e)}
                          {" · "}
                          <Num>{relTime(e.created_at)}</Num>
                        </>
                      }
                    >
                      <span style={CONTROL_WORD} className={statusClass}>
                        {isPending ? "waiting on you" : e.status}
                      </span>
                    </Line>
                  );
                })
            )}
          </Region>
        </>
      ) : null}

      {/* THE COMMIT. What every decision above actually caused, kept on screen
          rather than flashed once and lost. */}
      {committed.map((c, i) => (
        <Receipt
          key={`${c.at}-${i}`}
          verb={c.verb}
          consequence={c.consequence}
          handoff={c.handoff}
          time={relTime(c.at)}
        />
      ))}
    </>
  );
}
