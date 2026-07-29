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
import { toast } from "@/lib/notify";
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
  Empty,
  Gate,
  Num,
  PageHead,
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

  const settle = useMutation({
    mutationFn: async (verdict: "approve" | "reject") => {
      if (!call) return;
      await decide({ data: { id: call.sourceId, kind: call.kindKey, verdict } });
    },
    onSuccess: (_r, verdict) => {
      toast.success(verdict === "approve" ? "Approved." : "Declined.");
      void qc.invalidateQueries({ queryKey: ["today"] });
      void qc.invalidateQueries({ queryKey: ["shell"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const defer = useMutation({
    mutationFn: async () => {
      if (!call) return;
      await snooze({ data: { id: call.sourceId, kind: call.kindKey } });
    },
    onSuccess: () => {
      toast.success("Back tomorrow.");
      void qc.invalidateQueries({ queryKey: ["today"] });
    },
    onError: (e: Error) => toast.error(e.message),
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

  // The headline is a fact assembled from real counts. It never claims a
  // number it does not have.
  const headline = React.useMemo(() => {
    if (loading) return "Reading the record.";
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
            <div className="sp-ctx-head">Where this call came from</div>
            <div className="sp-ctx-row">
              <AgentMark slug={call.agentSlug} state="gate" />
              <span>
                <span className="sp-ctx-name">{agentDisplayName(call.agentSlug)}</span>
                <span className="sp-ctx-sub">
                  {call.projectName ?? call.project ?? "This workspace"}
                </span>
              </span>
            </div>
            {call.impact ? (
              <>
                <div className="sp-ctx-head">What it costs</div>
                <div className="sp-ctx-body">{call.impact}</div>
              </>
            ) : null}
            {items.length > 1 ? (
              <>
                <div className="sp-ctx-head">Behind this one</div>
                <div className="sp-ctx-body">
                  <Num>{items.length - 1}</Num> more waiting. They keep their order until this call
                  is settled.
                </div>
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
            {onRecord !== null ? (
              <>
                {" · "}
                <Num>{onRecord}</Num> {onRecord === 1 ? "day" : "days"} on the record
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
      ) : loading ? null : (
        <Gate question="Nothing is waiting on you.">
          <Button variant="ghost" onClick={() => navigate({ to: "/m" })}>
            Look at the runs
          </Button>
        </Gate>
      )}

      <Block
        title="Done without you"
        more={rows.length ? `All ${rows.length} runs` : undefined}
        onMore={() => navigate({ to: "/m" })}
      >
        {loading ? null : done.length === 0 ? (
          <Empty>
            Nothing finished in the last day. The crew picks work up on its own, so this fills in as
            runs land.
          </Empty>
        ) : (
          done.slice(0, 6).map((m) => (
            <Row
              key={m.id}
              marks={<AgentMark slug={null} name={m.build_driver} state="idle" />}
              lead={<Who>{m.title}</Who>}
              sub={
                <>
                  {m.hop_count > 0 ? (
                    <>
                      <Num>{m.hop_count}</Num> {m.hop_count === 1 ? "handoff" : "handoffs"}
                      {" · "}
                    </>
                  ) : null}
                  {m.status}
                </>
              }
              time={ago(m.completed_at)}
              onClick={() => navigate({ to: "/m" })}
            />
          ))
        )}
      </Block>

      {learning?.summary ? (
        <Block title="It learned one thing">
          <RecordRecess
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
