/**
 * Today. The front door, ported onto the rebuild primitives (step 4).
 *
 * THE DECISION THIS SURFACE OBEYS: "a brief, not an inbox and not a
 * dashboard" (session-handoff.md "What is decided"). The retired version was
 * 1543 lines and roughly twenty panels: a hero card, lanes, a triage queue, a
 * desk rail, receipts, a masthead, an onramp. That is a dashboard, and a
 * dashboard asks you to scan rather than to decide.
 *
 * So this reads top to bottom and says four things in order:
 *   what happened  ·  what needs you  ·  what was done  ·  what it learned
 *
 * VOICE: never greet, always report. The first line is a fact. The retired
 * version opened with "Good afternoon, {name}", which is exactly what the
 * convention bans.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { approvalsQueueKey, missionsKey, invalidateShellReads } from "@/lib/query-keys";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { useWorkspace } from "@/hooks/use-workspace";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import {
  getApprovalsQueue,
  decideApprovalItem,
  snoozeApprovalItem,
  REVISABLE_KINDS,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { listMissions, type MissionListRow } from "@/lib/missions.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { stripAutoPrefix, cleanTitle } from "@/components/plan/format";
import {
  AgentMark,
  Block,
  Button,
  CtxBody,
  CtxHead,
  CtxRow,
  Door,
  Empty,
  Failed,
  Gate,
  Loading,
  Num,
  PageHead,
  Receipt,
  Record as RecordRecess,
  Row,
  Surface,
  Who,
} from "@/components/shell/primitives";

export const Route = createFileRoute("/_authenticated/today")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Supaprod" }] }),
});

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

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return Number.isFinite(d) && d >= 0 ? d : null;
}

/**
 * Statuses that mean the crew STOPPED, rather than finished.
 *
 * `cancelMission` writes `completed_at` when a human cancels
 * (missions.functions.ts:565), which is correct as a timestamp and wrong as a
 * claim: it made a cancelled run indistinguishable from a delivered one to
 * anything that keyed on that column alone.
 */
const STOPPED = new Set(["cancelled", "halted"]);

/** "While you were gone" has to mean something, so it means the last day. */
function finishedRecently(m: MissionListRow): boolean {
  if (!m.completed_at) return false;
  return Date.now() - new Date(m.completed_at).getTime() < 86_400_000;
}

/**
 * Did this run actually FINISH, or was it stopped?
 *
 * The headline counts "N runs finished" off this block, so a cancelled run was
 * being reported to the founder as work the crew delivered overnight. The row
 * still appears in the list, because "you cancelled this" is worth seeing; it
 * just no longer counts as a finish and no longer wears the success mark.
 */
function actuallyFinished(m: MissionListRow): boolean {
  return finishedRecently(m) && !STOPPED.has(m.status);
}

function Today() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;

  /**
   * The seven stations, on the surface everyone lands on.
   *
   * FOUNDER RULING 2026-08-01. Today had no link to any of the seven: the rail
   * carries Today, Runs, Brain, Crew and Engine room, and the spine strip was
   * published only by loop surfaces. So the product's entire spine had exactly
   * one door from its own home page, the command palette, which is a keyboard
   * shortcut nobody has been told about yet. That is the door-missing defect on
   * the most visited screen in the app.
   *
   * `null` means no station is lit, which the strip already supports on purpose:
   * "a board opens with no stage selected, and that is a strip with nothing lit,
   * not the absence of a strip". Today is not a station, so nothing should be
   * lit; it is where you see the whole loop before choosing a part of it.
   *
   * This does revise the earlier reading that off a run there is no strip. That
   * reading came from a ruling whose actual words were "that horizontal pane,
   * always remain... right from 01 to 07. It should not collapse", which argues
   * for the strip being present, not absent. The 97px it costs buys the only
   * visible route into the loop from the front door.
   */
  useSpineStrip(null);

  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchMissions = useServerFn(listMissions);
  const fetchLearnings = useServerFn(listLearnings);
  const decide = useServerFn(decideApprovalItem);
  const snooze = useServerFn(snoozeApprovalItem);

  const queue = useQuery({
    queryKey: approvalsQueueKey(workspaceId),
    queryFn: () => fetchQueue({ data: { workspaceId: workspaceId ?? undefined } }),
  });
  const missions = useQuery({
    queryKey: missionsKey(workspaceId),
    queryFn: () => fetchMissions({ data: {} }),
  });
  const learnings = useQuery({
    queryKey: ["today", "learnings", workspaceId],
    queryFn: () => fetchLearnings(),
  });

  const items = queue.data?.items ?? [];
  const call: ApprovalQueueItem | null = items[0] ?? null;
  const rows = missions.data?.missions ?? [];
  const done = React.useMemo(
    () =>
      rows
        .filter(finishedRecently)
        .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
    [rows],
  );
  const learning = learnings.data?.[0] ?? null;

  const oldest = React.useMemo(
    () =>
      rows.reduce<string | null>(
        (min, m) => (!min || m.created_at < min ? m.created_at : min),
        null,
      ),
    [rows],
  );
  const onRecord = daysSince(oldest);

  // THE COMMIT (agents/FINAL-agent-presence.md R10). A settled call leaves a
  // receipt on the surface, never a toast. A toast confirms that your click
  // registered; a receipt renders what your click CAUSED, and judgment leaving
  // no trace is the thing the doctrine calls out by name.
  const [receipts, setReceipts] = React.useState<
    { verb: string; consequence: string; at: string; failed?: boolean }[]
  >([]);
  const stamp = () =>
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const settle = useMutation({
    mutationFn: async (verdict: "approve" | "reject") => {
      if (!call) return;
      await decide({ data: { id: call.sourceId, kind: call.kindKey, verdict } });
    },
    /* THE CALL YOU JUST SETTLED KEPT ASKING, FOR THREE FULL SECONDS.
     *
     * There was no onMutate, so `call` stayed items[0] of the stale cache until
     * the refetch landed, and query-keys.ts measures that refetch at 2944 to
     * 3271ms. For that whole window the front door showed the receipt below
     * saying "You approved" while the gate directly above it still asked the
     * same question with a live Approve, Decline and Snooze. The obvious human
     * reaction is to press Approve again, which fires a second decide on an
     * already-settled item.
     *
     * Removed optimistically instead of disabling the buttons: disabling hides
     * the state, advancing it is the fix. The previous list is kept so a failed
     * write puts the call straight back, next to the receipt that says nothing
     * was recorded. */
    onMutate: async () => {
      if (!call) return { prev: undefined };
      const key = approvalsQueueKey(workspaceId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<{ items: ApprovalQueueItem[] }>(key);
      qc.setQueryData<{ items: ApprovalQueueItem[] } | undefined>(key, (old) =>
        old ? { ...old, items: old.items.filter((i) => i.id !== call.id) } : old,
      );
      return { prev };
    },
    onSuccess: (_r, verdict) => {
      setReceipts((r) => [
        {
          verb: verdict === "approve" ? "You approved" : "You declined",
          consequence:
            verdict === "approve"
              ? (call?.approveConsequence ?? "The decision is on the record.")
              : (call?.rejectConsequence ?? "Noted for next time."),
          at: stamp(),
        },
        ...r,
      ]);
      void qc.invalidateQueries({ queryKey: ["today"] });
      invalidateShellReads(qc);
    },
    // A failed write still writes a receipt, and it goes honest immediately.
    // The call comes BACK at the same time, so the surface and the receipt
    // agree: nothing was settled, and here is the thing still asking.
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(approvalsQueueKey(workspaceId), ctx.prev);
      setReceipts((r) => [
        { verb: "Nothing was recorded", consequence: e.message, at: stamp(), failed: true },
        ...r,
      ]);
    },
  });

  const defer = useMutation({
    mutationFn: async () => {
      if (!call) return;
      await snooze({ data: { id: call.sourceId, kind: call.kindKey } });
    },
    onSuccess: () => {
      setReceipts((r) => [
        {
          verb: "You snoozed it",
          consequence: "It comes back with tomorrow's brief.",
          at: stamp(),
        },
        ...r,
      ]);
      /* SNOOZE USED TO DO NOTHING YOU COULD SEE, and it was one missing line.
       *
       * `["today"]` prefix-matches only the learnings query on this page. The
       * queue this call actually lives in is `approvalsQueueKey(ws)`, which is
       * `["approvals-queue", ws]`, and the missions list is `["missions-list",
       * ws]`. Neither begins with "today", so neither refetched. With
       * refetchOnWindowFocus off and a 30s staleTime, nothing else rescued it
       * either.
       *
       * So the receipt said "You snoozed it. It comes back with tomorrow's
       * brief" while the identical call stayed on screen, still asking, and the
       * header count did not move. Pressing it again just produced a second
       * receipt. A control that reports a consequence the surface then
       * contradicts is worse than one that does nothing, because the user has
       * to work out which of the two is lying.
       *
       * `settle` directly above has always called this; `defer` was simply
       * never given it. */
      invalidateShellReads(qc);
    },
    onError: (e: Error) =>
      setReceipts((r) => [
        { verb: "Nothing was recorded", consequence: e.message, at: stamp(), failed: true },
        ...r,
      ]),
  });

  const busy = settle.isPending || defer.isPending;
  const revisable = call ? (REVISABLE_KINDS as readonly string[]).includes(call.kindKey) : false;

  // The shortcuts the gate's keycaps promise. A keycap that does nothing is a
  // lie, so they are bound here rather than drawn for looks. Bare letters, so
  // they stand down whenever focus is in a field.
  React.useEffect(() => {
    if (!call || busy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "a") settle.mutate("approve");
      else if (e.key === "d") settle.mutate("reject");
      else if (e.key === "z") defer.mutate();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call, busy, settle, defer]);

  /**
   * THE UNION IS THE HEADLINE'S BUSINESS AND NOBODY ELSE'S.
   *
   * One sentence assembled from two counts genuinely needs both reads, so it
   * waits for both. Every REGION below now waits on its OWN read instead: the
   * gate on the queue, the finished block on the missions list, the learning on
   * the learnings list.
   *
   * All three used to key off this union, and that is a latency bug rather than
   * a spinner bug: the queue landing first bought the user nothing, because the
   * gate stayed hidden until the SLOWER of the two returned. The thing a person
   * opens Today for is the call that needs them, and it was being held back by
   * a list of finished runs it does not depend on.
   */
  const loading = queue.isLoading || missions.isLoading;

  // The headline is a fact assembled from real counts. While loading, show
  // the date — a headline that says "Reading" advertises latency; a headline
  // that says the date tells the user they arrived. Data fills in instantly
  // from cache on revisit; on first load the brief gap is invisible because
  // the shell already provides structure.
  const headline = React.useMemo(() => {
    if (loading) return "Today";
    // Counts finishes, not stops. `done` still lists a cancelled run, because
    // seeing it is useful, but calling it a finish in the headline was the
    // product claiming work it did not do.
    const n = done.filter(actuallyFinished).length;
    const g = items.length;
    const ran =
      n === 0 ? "Nothing finished overnight" : n === 1 ? "One run finished" : `${n} runs finished`;
    // The noun, said out loud. The header 200px above counts the SAME approvals
    // queue and says "N calls need you", so a bare "N need you" here read as a
    // second, contradicting number. Same fix as the Runs board.
    const needs =
      g === 0 ? "Nothing needs you." : g === 1 ? "One call needs you." : `${g} calls need you.`;
    return `${ran}. ${needs}`;
  }, [loading, done, items.length]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Surface
      context={
        call ? (
          <>
            {/* THE AGENT THAT RAISED IT, and it opens the agent. This markup was
                hand-copied out of the primitives rather than using them, which
                is the drift CtxRow's own note names; going through the
                primitive is also what makes the door possible, because a div
                cannot take one. `/crew?agent=` is the agent's real address:
                what it may do, on whose approval, and its record. Absent when
                the queue does not say which agent raised the call, because a
                door to the whole roster is not a door to this agent. */}
            <CtxHead>Where this call came from</CtxHead>
            <CtxRow
              mark={<AgentMark slug={call.agentSlug} state="gate" />}
              name={agentDisplayName(call.agentSlug)}
              sub={call.projectName ?? call.project ?? "This workspace"}
              title={call.agentSlug ? "Open this agent in the crew" : undefined}
              onClick={
                call.agentSlug
                  ? () => navigate({ to: "/crew", search: { agent: call.agentSlug as string } })
                  : undefined
              }
            />
            {call.impact ? (
              <>
                <CtxHead>Before you decide</CtxHead>
                <CtxBody>{call.impact}</CtxBody>
              </>
            ) : null}
            {/* THE DOOR TO THE QUEUE. This counted the rest of the queue and
                gave no way to reach it, on the one surface that shows exactly
                one call at a time. /approvals IS the queue, and it is where
                the other N are. */}
            {items.length > 1 ? (
              <>
                <CtxHead>Behind this one</CtxHead>
                <CtxRow
                  name={
                    <>
                      <Num>{items.length - 1}</Num> more waiting
                    </>
                  }
                  sub="They keep their order until this call is settled."
                  title="Open the queue"
                  onClick={() => navigate({ to: "/approvals" })}
                />
              </>
            ) : null}
          </>
        ) : null
      }
    >
      <PageHead
        title={headline}
        sub={
          <>
            {today}
            {/* "On the record" names a place, and Brain is that place. It was
                a plain span on the front door: the product's own word for its
                moat, printed at you with no way in. The number is the age of
                the record, so the door is the record itself rather than the
                run the age happens to be measured from. */}
            {onRecord !== null ? (
              <>
                {" · "}
                <Door
                  title="Open the record"
                  onClick={() => navigate({ to: "/brain", search: {} })}
                >
                  <Num>{onRecord}</Num> {onRecord === 1 ? "day" : "days"} on the record
                </Door>
              </>
            ) : null}
          </>
        }
      />

      {call ? (
        <Gate
          // The stored title carries a machine "[auto]" origin prefix when the
          // loop raised it. That is provenance, not copy, and it must never
          // reach the one sentence the human is asked to judge.
          question={stripAutoPrefix(call.title)}
          lines={[
            ...call.evidence
              .slice(0, 3)
              .map((line, i) => <span key={i}>{stripAutoPrefix(line)}</span>),
            <span key="consequence">{call.approveConsequence}</span>,
          ]}
        >
          <Button
            variant="primary"
            shortcut="a"
            disabled={busy}
            onClick={() => settle.mutate("approve")}
          >
            Approve
          </Button>
          {revisable ? (
            <Button
              disabled={busy}
              onClick={() => navigate({ to: "/approvals" })}
              title="Send it back with a note"
            >
              Send back
            </Button>
          ) : null}
          <Button shortcut="d" disabled={busy} onClick={() => settle.mutate("reject")}>
            Decline
          </Button>
          <Button variant="ghost" shortcut="z" disabled={busy} onClick={() => defer.mutate()}>
            Snooze
          </Button>
        </Gate>
      ) : queue.isLoading ? (
        /* THE THIRD FACT, and the front door was the one surface missing it.
         *
         * `loading ? null` drew nothing where the biggest element on the screen
         * goes, so for the whole of a cold read Today was a headline over a
         * rule, and a screen reader was handed silence. Neither of the two
         * branches below is usable here: "Nothing is waiting on you" and
         * "Cannot reach the queue" are both claims, and at this moment neither
         * is known. Loading is the primitive for precisely that gap, it carries
         * the live region, and it reserves its own height so the gate arriving
         * pushes nothing around.
         *
         * It states what it is READING, in this surface's own words (the header
         * says "N calls need you"), and it says nothing about how long that
         * takes. Advertising latency is what surface-discipline bans outright. */
        <Loading>Reading what needs you.</Loading>
      ) : queue.isError ? (
        // A failed read is not an empty queue. `items` falls back to [] on error,
        // so without this branch the front door told a user "Nothing is waiting on
        // you" at the exact moment it had no idea what was waiting. That is the
        // worst sentence in the product to get wrong: it is the one thing Today
        // exists to say, and being confidently wrong about it teaches the user
        // that the surface cannot be trusted when it is quiet.
        <Gate question="Cannot reach the queue right now.">
          <Failed onRetry={() => queue.refetch()}>
            Your calls are safe, this screen just could not load them.
          </Failed>
        </Gate>
      ) : (
        <Gate question="Nothing is waiting on you.">
          <Button variant="ghost" onClick={() => navigate({ to: "/runs" })}>
            Look at the runs
          </Button>
        </Gate>
      )}

      {receipts.length > 0 ? (
        // THE RECEIPTS GO SOMEWHERE NOW. A receipt on this page is the trace of
        // a judgment made in this session and it vanished on reload, which
        // taught exactly what the receipt doctrine exists to prevent: that your
        // judgment left no lasting trace. The Record room is where every
        // receipt is kept, sealed, with the chain behind it. The door is on the
        // block rather than on each line because the block is the set, and
        // an individual settled item has no address of its own: `decideApprovalItem`
        // fans out across ten different kinds and only some of them land
        // somewhere a person can open.
        <Block
          title="What you settled"
          more="Every receipt"
          onMore={() => navigate({ to: "/engine-room", search: { room: "record" } })}
        >
          {receipts.map((r, i) => (
            <Receipt
              key={i}
              verb={r.verb}
              consequence={r.consequence}
              time={r.at}
              failed={r.failed}
            />
          ))}
        </Block>
      ) : null}

      <Block
        title="Done without you"
        more={rows.length ? `All ${rows.length} runs` : undefined}
        onMore={() => navigate({ to: "/runs" })}
      >
        {missions.isLoading ? (
          // The block head already renders its title, so this fills the body
          // rather than leaving a heading standing over a void. It is deliberately
          // the same subject as the Failed line just below: "Reading what the crew
          // finished" then "Could not load what the crew finished" is one topic
          // told twice, honestly, and the reader never has to reconcile them.
          <Loading>Reading what the crew finished.</Loading>
        ) : missions.isError ? (
          // Same rule as the Gate above: a read that failed must not be reported
          // as a day where nothing happened.
          <Failed onRetry={() => missions.refetch()}>Could not load what the crew finished.</Failed>
        ) : done.length === 0 ? (
          <Empty>
            Nothing finished in the last day. The crew picks work up on its own, so this fills in as
            runs land.
          </Empty>
        ) : (
          done.slice(0, 6).map((m) => (
            <Row
              key={m.id}
              // Every run on this block rendered state="idle", so MarkState
              // "verified" existed solely to show a win and was never once used:
              // Today could shout a loss and had no way to show a success.
              /* A CANCELLED RUN WAS WEARING THE GREEN SUCCESS MARK.
               *
               * This ternary sent everything that was not `failed` or
               * `completed_with_failures` to `verified`, and the block it sits in
               * selects on `completed_at` alone (finishedRecently, above).
               * `cancelMission` writes `status:"cancelled", completed_at: now`
               * (missions.functions.ts:565), so a run the human deliberately
               * stopped arrived here, was painted green, and was counted in the
               * headline as one of the runs that finished. `halted` did the same.
               *
               * That breaks the primitive's own written contract: verified "IS
               * NOT done... A run that claims done with nothing behind it stays
               * neutral, because painting every finished run green would be the
               * product asserting success it never checked." Colour carries
               * status here, so green has to mean a real outcome and nothing
               * else. Stopped work is neutral, not a win and not a failure. */
              marks={
                <AgentMark
                  slug={null}
                  name={m.build_driver}
                  state={
                    m.status === "failed"
                      ? "failed"
                      : m.status === "completed_with_failures" ||
                          m.status === "cancelled" ||
                          m.status === "halted"
                        ? "idle"
                        : "verified"
                  }
                />
              }
              lead={<Who>{cleanTitle(m.title)}</Who>}
              sub={
                <>
                  {m.hop_count > 0 ? (
                    <>
                      <Num>{m.hop_count}</Num> {m.hop_count === 1 ? "handoff" : "handoffs"}
                      {" · "}
                    </>
                  ) : null}
                  {/* Three outcomes, three tones. A partial used to be painted in
                      the same red as an outright failure, which taught the eye to
                      read "some of it landed" as "none of it landed"; warn is
                      exactly what a partial is. A clean run used to render the raw
                      database word in body grey, so the one thing worth celebrating
                      was also the least visible thing on the row. */}
                  {m.status === "failed" ? (
                    <span className="sp-fail">failed</span>
                  ) : m.status === "completed_with_failures" ? (
                    <span className="sp-warn">partial</span>
                  ) : m.status === "completed" ? (
                    <span className="sp-pass">done</span>
                  ) : (
                    m.status
                  )}
                </>
              }
              time={ago(m.completed_at)}
              onClick={() => navigate({ to: "/runs/$missionId", params: { missionId: m.id } })}
            />
          ))
        )}
      </Block>

      {learnings.isLoading ? (
        /* NO BLOCK AROUND THIS ONE, and that is the whole point of writing it
         * out. The block's title is "It learned one thing", which is a CLAIM:
         * printing it before the read lands asserts a learning exists when
         * nobody yet knows whether one does. So the wait is the bare fact, and
         * the title arrives with the thing it describes. */
        <Loading>Reading what it learned.</Loading>
      ) : learnings.isError ? (
        // Same rule the Gate and the block above already obey: a read that
        // failed is not a record that learned nothing. This branch rendered
        // nothing at all, so an unreachable brain and a quiet one looked
        // identical on the one surface that is supposed to tell them apart.
        <Failed onRetry={() => learnings.refetch()}>Could not load what it learned.</Failed>
      ) : learning?.summary ? (
        <Block title="It learned one thing">
          <RecordRecess
            // THE RECESS OPENS THE OUTCOME. This is the one lit surface in the
            // product and on the front door it was inert: a claim about what
            // the record learned, with no way to read the outcome behind it.
            // Brain's Outcomes tab takes the learning id it already has, which
            // is the same drill CompoundingPanel's own rows use, so the two
            // doors cannot drift.
            title="Open this outcome in the record"
            onClick={() =>
              navigate({ to: "/brain", search: { tab: "learnings", learning: learning.id } })
            }
            evidence={
              <>
                {learning.recorded_by_agent_slug
                  ? `${agentDisplayName(learning.recorded_by_agent_slug)} recorded it`
                  : "Recorded"}
                {learning.created_at
                  ? ` · ${new Date(learning.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}`
                  : ""}
              </>
            }
          >
            {learning.summary}
          </RecordRecess>
        </Block>
      ) : null}
    </Surface>
  );
}
