import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { AskComposer } from "@/components/today/AskComposer";
import { FocusNext } from "@/components/today/FocusNext";
import { PushedInsights } from "@/components/today/PushedInsights";
import { ConfidenceDisclosureChip } from "@/components/governance/ConfidenceDisclosureChip";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import {
  AgentMark,
  Block,
  Button,
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
  Value,
  Who,
} from "@/components/shell/primitives";
import { stripAutoPrefix, cleanTitle } from "@/components/plan/format";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getApprovalsQueue,
  decideApprovalItem,
  snoozeApprovalItem,
  REVISABLE_KINDS,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { openAsk } from "@/lib/ask-open";
import { tierFromProbability } from "@/lib/confidence";
import { isModalOpen } from "@/lib/overlay";
import { listMissions, type MissionListRow } from "@/lib/missions.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { approvalsQueueKey, missionsKey, invalidateShellReads } from "@/lib/query-keys";
import { stillWaiting } from "@/lib/query-state";
import "@/styles/today.css";

export const Route = createFileRoute("/_authenticated/today")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Supaprod" }] }),
});

const STOPPED = new Set(["cancelled", "halted"]);
const WORKING = new Set(["running", "in_progress"]);
const VERDICT_LABEL: Record<string, string> = { ship: "Ship", revise: "Revise", kill: "Kill" };
const VERDICT_TONE: Record<string, "pass" | "warn" | "fail"> = {
  ship: "pass",
  revise: "warn",
  kill: "fail",
};

type CriticHandoff = {
  idea: string;
  verdict?: string;
  summary?: string;
  risks?: string[];
  missing_evidence?: string[];
  confidence?: number;
};

function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

function finishedRecently(mission: MissionListRow): boolean {
  if (!mission.completed_at) return false;
  return Date.now() - new Date(mission.completed_at).getTime() < 86_400_000;
}

function actuallyFinished(mission: MissionListRow): boolean {
  return finishedRecently(mission) && !STOPPED.has(mission.status);
}

function CriticBrief({
  result,
  onOpen,
  onAnother,
}: {
  result: CriticHandoff;
  onOpen: () => void;
  onAnother: () => void;
}) {
  const risks = (result.risks ?? []).filter((risk) => risk.trim()).slice(0, 3);
  const missing = (result.missing_evidence ?? []).find((item) => item.trim());

  return (
    <section className="today-critic" aria-labelledby="today-critic-title">
      <div className="today-section-head">
        <span className="today-kicker">Your first brief</span>
        <span className="today-critic-signals">
          {result.verdict ? (
            <Value tone={VERDICT_TONE[result.verdict] ?? "quiet"}>
              {VERDICT_LABEL[result.verdict] ?? result.verdict}
            </Value>
          ) : null}
          {typeof result.confidence === "number" ? (
            <ConfidenceDisclosureChip
              confidence={result.confidence}
              tier={tierFromProbability(result.confidence)}
            />
          ) : null}
        </span>
      </div>
      <h2 id="today-critic-title" className="today-critic-title">
        {result.idea}
      </h2>
      {result.summary?.trim() ? <p className="today-critic-summary">{result.summary}</p> : null}
      {risks.length || missing ? (
        <div className="today-critic-evidence">
          {risks.length ? (
            <div>
              <div className="today-evidence-label">Key risks</div>
              <ul>
                {risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {missing ? (
            <div>
              <div className="today-evidence-label">What you need to test</div>
              <p>{missing}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="today-actions">
        <Button onClick={onOpen}>
          See the full analysis
        </Button>
        <Button variant="ghost" onClick={onAnother}>
          Try another idea
        </Button>
      </div>
    </section>
  );
}

function Today() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;

  // Engine-Room: Today names outcomes, decisions and evidence. Agent internals stay recessed.
  useSpineStrip(null);

  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchMissions = useServerFn(listMissions);
  const fetchLearnings = useServerFn(listLearnings);
  const decide = useServerFn(decideApprovalItem);
  const snooze = useServerFn(snoozeApprovalItem);

  const queue = useQuery({
    queryKey: approvalsQueueKey(workspaceId),
    queryFn: () => fetchQueue({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
  });
  const missions = useQuery({
    queryKey: missionsKey(workspaceId),
    queryFn: () => fetchMissions({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
  });
  const learnings = useQuery({
    queryKey: ["today", "learnings", workspaceId],
    queryFn: () => fetchLearnings({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
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
  const running = React.useMemo(() => rows.filter((mission) => WORKING.has(mission.status)), [rows]);
  const finishedCount = React.useMemo(() => done.filter(actuallyFinished).length, [done]);
  const learning = learnings.data?.learnings?.[0] ?? null;
  const oldest = React.useMemo(
    () =>
      rows.reduce<string | null>(
        (minimum, mission) =>
          !minimum || mission.created_at < minimum ? mission.created_at : minimum,
        null,
      ),
    [rows],
  );
  const onRecord = daysSince(oldest);

  const [receipts, setReceipts] = React.useState<
    { verb: string; consequence: string; at: string; failed?: boolean }[]
  >([]);
  const stamp = () =>
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const removeCurrentCall = async () => {
    if (!call) return { previous: undefined };
    const key = approvalsQueueKey(workspaceId);
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<{ items: ApprovalQueueItem[] }>(key);
    queryClient.setQueryData<{ items: ApprovalQueueItem[] } | undefined>(key, (current) =>
      current
        ? { ...current, items: current.items.filter((item) => item.id !== call.id) }
        : current,
    );
    return { previous };
  };

  const settle = useMutation({
    mutationFn: async (verdict: "approve" | "reject") => {
      if (!call) return;
      await decide({ data: { id: call.sourceId, kind: call.kindKey, verdict } });
    },
    onMutate: removeCurrentCall,
    onSuccess: (_result, verdict) => {
      setReceipts((current) => [
        {
          verb: verdict === "approve" ? "You approved" : "You declined",
          consequence:
            verdict === "approve"
              ? (call?.approveConsequence ?? "The decision is on the record.")
              : (call?.rejectConsequence ?? "The decision will guide the next pass."),
          at: stamp(),
        },
        ...current,
      ]);
      void queryClient.invalidateQueries({ queryKey: ["today"] });
      invalidateShellReads(queryClient);
    },
    onError: (error: Error, _verdict, context) => {
      if (context?.previous) {
        queryClient.setQueryData(approvalsQueueKey(workspaceId), context.previous);
      }
      setReceipts((current) => [
        {
          verb: "Nothing was recorded",
          consequence: error.message,
          at: stamp(),
          failed: true,
        },
        ...current,
      ]);
    },
  });

  const defer = useMutation({
    mutationFn: async () => {
      if (!call) return;
      await snooze({ data: { id: call.sourceId, kind: call.kindKey } });
    },
    onMutate: removeCurrentCall,
    onSuccess: () => {
      setReceipts((current) => [
        {
          verb: "You snoozed it",
          consequence: "It returns with tomorrow's brief.",
          at: stamp(),
        },
        ...current,
      ]);
      invalidateShellReads(queryClient);
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(approvalsQueueKey(workspaceId), context.previous);
      }
      setReceipts((current) => [
        {
          verb: "Nothing was recorded",
          consequence: error.message,
          at: stamp(),
          failed: true,
        },
        ...current,
      ]);
    },
  });

  const busy = settle.isPending || defer.isPending;
  const revisable = call ? (REVISABLE_KINDS as readonly string[]).includes(call.kindKey) : false;

  React.useEffect(() => {
    if (!call || busy) return;
    const onKey = (e: KeyboardEvent) => {
      if (isModalOpen()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
        return;
      }
      if (e.key === "a") settle.mutate("approve");
      else if (e.key === "d") settle.mutate("reject");
      else if (e.key === "z") defer.mutate();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call, busy, settle, defer]);

  const [justLanded, setJustLanded] = React.useState(false);
  const [criticResult, setCriticResult] = React.useState<CriticHandoff | null>(null);
  React.useEffect(() => {
    const landed = window.sessionStorage.getItem("supaprod.onboarding.justLanded") === "1";
    if (!landed) return;
    setJustLanded(true);
    window.sessionStorage.removeItem("supaprod.onboarding.justLanded");
    const stored = window.sessionStorage.getItem("supaprod.onboarding.criticReview");
    if (!stored) return;
    try {
      setCriticResult(JSON.parse(stored) as CriticHandoff);
    } catch {
      setCriticResult(null);
    } finally {
      window.sessionStorage.removeItem("supaprod.onboarding.criticReview");
    }
  }, []);

  const loading = stillWaiting(queue, missions);
  const headline = React.useMemo(() => {
    if (loading) return "Today";
    if (justLanded && criticResult) return "Your first brief is ready.";
    if (justLanded) return "Your workspace is ready.";
    if (items.length === 1) return "One call needs you.";
    if (items.length > 1) return `${items.length} calls need you.`;
    if (finishedCount === 1) return "One run finished while you were away.";
    if (finishedCount > 1) return `${finishedCount} runs finished while you were away.`;
    return "Nothing needs you right now.";
  }, [loading, justLanded, criticResult, items.length, finishedCount]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Surface wide>
      <div className="today-page">
        <PageHead
          title={headline}
          sub={
            <>
              {today}
              {finishedCount > 0 && items.length > 0 ? (
                <>
                  {" · "}
                  <Num>{finishedCount}</Num> finished in the last day
                </>
              ) : null}
              {onRecord !== null ? (
                <>
                  {" · "}
                  <Door title="Open the record" onClick={() => navigate({ to: "/brain", search: {} })}>
                    <Num>{onRecord}</Num> {onRecord === 1 ? "day" : "days"} on the record
                  </Door>
                </>
              ) : null}
            </>
          }
        />

        {justLanded && criticResult ? (
          <CriticBrief
            result={criticResult}
            onOpen={() => navigate({ to: "/decide" })}
            onAnother={() => {
              setCriticResult(null);
              openAsk();
            }}
          />
        ) : null}

        <div className="today-hero">
          <div className="today-call">
            <div className="today-section-head">
              <span className="today-kicker">Your next call</span>
              {call ? (
                <span className="today-position">
                  <Num>1</Num> of <Num>{items.length}</Num>
                </span>
              ) : null}
            </div>

            {call ? (
              <>
                <div className="today-call-meta">
                  <div className="today-call-source">
                    {call.agentSlug ? (
                      <Door
                        title="Open this agent in the crew"
                        onClick={() =>
                          navigate({ to: "/crew", search: { agent: call.agentSlug as string } })
                        }
                      >
                        <span className="today-agent-link">
                          <AgentMark slug={call.agentSlug} state="gate" />
                          <span>{agentDisplayName(call.agentSlug)}</span>
                        </span>
                      </Door>
                    ) : (
                      <span>{agentDisplayName(call.agentSlug)}</span>
                    )}
                    <span>{call.projectName ?? call.project ?? "This workspace"}</span>
                    {call.impact ? <span>{call.impact}</span> : null}
                  </div>
                  {items.length > 1 ? (
                    <Door title="Open the full queue" onClick={() => navigate({ to: "/approvals" })}>
                      Open {items.length - 1} more {items.length - 1 === 1 ? "call" : "calls"}
                    </Door>
                  ) : null}
                </div>
                <Gate
                  key={call.id}
                  question={stripAutoPrefix(call.title)}
                  linesLabel={call.evidence.length ? "Why this needs your call" : undefined}
                  lines={[
                    ...call.evidence
                      .slice(0, 3)
                      .map((line, index) => (
                        <span key={`evidence-${index}`}>{stripAutoPrefix(line)}</span>
                      )),
                    ...(call.evidence.length > 3
                      ? [
                          <span key="more-evidence">
                            {call.evidence.length - 3} more facts are attached in Approvals.
                          </span>,
                        ]
                      : []),
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
                  <Button
                    variant="ghost"
                    shortcut="z"
                    disabled={busy}
                    onClick={() => defer.mutate()}
                  >
                    Snooze
                  </Button>
                </Gate>
              </>
            ) : stillWaiting(queue) ? (
              <Loading>Reading what needs you.</Loading>
            ) : queue.isError ? (
              <Gate question="The queue did not load.">
                <Failed onRetry={() => queue.refetch()}>
                  Your calls are unchanged. Retry this read before you decide what is clear.
                </Failed>
              </Gate>
            ) : (
              <Gate question="Nothing needs you right now.">
                <Button variant="primary" onClick={() => openAsk()}>
                  Ask Supaprod what to build
                </Button>
              </Gate>
            )}
          </div>

          <FocusNext workspaceId={workspaceId} />
        </div>

        <div data-page-composer className="today-composer">
          <div>
            <div className="today-kicker">Start something new</div>
            <div className="today-composer-copy">Ask a question or give the crew its next outcome.</div>
          </div>
          <AskComposer />
        </div>

        <PushedInsights />

        {receipts.length > 0 ? (
          <Block
            title="What you settled"
            more="Every receipt"
            onMore={() => navigate({ to: "/engine-room", search: { room: "record" } })}
          >
            {receipts.map((receipt, index) => (
              <Receipt
                key={`${receipt.at}-${index}`}
                verb={receipt.verb}
                consequence={receipt.consequence}
                time={receipt.at}
                failed={receipt.failed}
              />
            ))}
          </Block>
        ) : null}

        <div className="today-proof-grid">
          {running.length > 0 ? (
            <Block title="Working now" more="Open Runs" onMore={() => navigate({ to: "/runs" })}>
              {running.slice(0, 4).map((mission) => {
                const agent = mission.current_agent_slug
                  ? agentDisplayName(mission.current_agent_slug)
                  : "The crew";
                const elapsed = ago(mission.created_at);
                return (
                  <Row
                    key={mission.id}
                    lead={stripAutoPrefix(mission.current_sub_goal ?? mission.title)}
                    sub={`${agent}${elapsed ? ` · ${elapsed} running` : " · running"}`}
                    onClick={() =>
                      navigate({ to: "/runs/$missionId", params: { missionId: mission.id } })
                    }
                  />
                );
              })}
            </Block>
          ) : null}

          <Block
            title="Done without you"
            more={rows.length ? "Open Runs" : undefined}
            onMore={() => navigate({ to: "/runs" })}
          >
            {stillWaiting(missions) ? (
              <Loading>Reading what the crew finished.</Loading>
            ) : missions.isError ? (
              <Failed onRetry={() => missions.refetch()}>
                The run record did not load, so this brief cannot say what finished.
              </Failed>
            ) : done.length === 0 ? (
              <Empty
                action={
                  <Button variant="ghost" onClick={() => navigate({ to: "/runs" })}>
                    Open Runs
                  </Button>
                }
              >
                No run completed in the last day. The next result will land here with its outcome.
              </Empty>
            ) : (
              done.slice(0, 4).map((mission) => (
                <Row
                  key={mission.id}
                  marks={
                    <AgentMark
                      slug={mission.current_agent_slug}
                      name={mission.build_driver}
                      state={
                        mission.status === "failed"
                          ? "failed"
                          : mission.status === "completed_with_failures" ||
                              mission.status === "cancelled" ||
                              mission.status === "halted"
                            ? "idle"
                            : "verified"
                      }
                    />
                  }
                  lead={<Who>{cleanTitle(mission.title)}</Who>}
                  sub={
                    <>
                      {mission.hop_count > 0 ? (
                        <>
                          <Num>{mission.hop_count}</Num>{" "}
                          {mission.hop_count === 1 ? "handoff" : "handoffs"} ·{" "}
                        </>
                      ) : null}
                      {mission.status === "failed" ? (
                        <span className="sp-fail">failed</span>
                      ) : mission.status === "completed_with_failures" ? (
                        <span className="sp-warn">partial</span>
                      ) : mission.status === "completed" ? (
                        <span className="sp-pass">done</span>
                      ) : (
                        mission.status
                      )}
                    </>
                  }
                  time={ago(mission.completed_at)}
                  onClick={() =>
                    navigate({ to: "/runs/$missionId", params: { missionId: mission.id } })
                  }
                />
              ))
            )}
          </Block>

          {stillWaiting(learnings) ? (
            <Loading>Reading what it learned.</Loading>
          ) : learnings.isError ? (
            <div className="today-proof-state">
              <Failed onRetry={() => learnings.refetch()}>
                The outcome record did not load, so this brief cannot show what changed next.
              </Failed>
            </div>
          ) : learning?.summary ? (
            <Block title="It learned one thing">
              <RecordRecess
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
          ) : (
            <Block title="Latest learning">
              <Empty action={<Button onClick={() => navigate({ to: "/learn" })}>Open Learn</Button>}>
                No settled outcome has changed the next call yet. Record one in Learn to start the loop.
              </Empty>
            </Block>
          )}
        </div>
      </div>
    </Surface>
  );
}
