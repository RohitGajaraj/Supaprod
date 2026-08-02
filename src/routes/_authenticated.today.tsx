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
import { stripAutoPrefix } from "@/components/plan/format";
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

/** "While you were gone" has to mean something, so it means the last day. */
function finishedRecently(m: MissionListRow): boolean {
  if (!m.completed_at) return false;
  return Date.now() - new Date(m.completed_at).getTime() < 86_400_000;
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
    queryKey: ["today", "queue", workspaceId],
    queryFn: () => fetchQueue({ data: { workspaceId: workspaceId ?? undefined } }),
  });
  const missions = useQuery({
    queryKey: ["today", "missions", workspaceId],
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
      void qc.invalidateQueries({ queryKey: ["shell"] });
    },
    // A failed write still writes a receipt, and it goes honest immediately.
    onError: (e: Error) =>
      setReceipts((r) => [
        { verb: "Nothing was recorded", consequence: e.message, at: stamp(), failed: true },
        ...r,
      ]),
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
      void qc.invalidateQueries({ queryKey: ["today"] });
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

  const loading = queue.isLoading || missions.isLoading;

  // The headline is a fact assembled from real counts. While loading, show
  // the date — a headline that says "Reading" advertises latency; a headline
  // that says the date tells the user they arrived. Data fills in instantly
  // from cache on revisit; on first load the brief gap is invisible because
  // the shell already provides structure.
  const headline = React.useMemo(() => {
    if (loading) return "Today";
    const n = done.length;
    const g = items.length;
    const ran =
      n === 0 ? "Nothing finished overnight" : n === 1 ? "One run finished" : `${n} runs finished`;
    const needs = g === 0 ? "Nothing needs you." : g === 1 ? "One needs you." : `${g} need you.`;
    return `${ran}. ${needs}`;
  }, [loading, done.length, items.length]);

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
      ) : loading ? null : queue.isError ? (
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
        {loading ? null : missions.isError ? (
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
              marks={
                <AgentMark
                  slug={null}
                  name={m.build_driver}
                  state={
                    m.status === "failed"
                      ? "failed"
                      : m.status === "completed_with_failures"
                        ? "idle"
                        : "verified"
                  }
                />
              }
              lead={<Who>{m.title}</Who>}
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

      {learning?.summary ? (
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
