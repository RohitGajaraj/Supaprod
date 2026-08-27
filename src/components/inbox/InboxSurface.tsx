import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AgentInbox, type AgentSession, type InboxNeed } from "@/components/meridian/AgentInbox";
import { Num, PageHeading, ReadFailedLine, Reading } from "@/components/meridian/surface-parts";
import { Surface } from "@/components/meridian/Surface";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { taskStatus } from "@/components/meridian/TaskRows";
import { RunState, ShippedState } from "@/components/today/RunState";
import { ago } from "@/components/today/when";
import { cleanTitle, stripAutoPrefix } from "@/components/plan/format";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { useWorkspace } from "@/hooks/use-workspace";
import { openAsk } from "@/lib/ask-open";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { listMissions, type MissionListRow } from "@/lib/missions.functions";
import { approvalsQueueKey, missionsKey } from "@/lib/query-keys";
import { stillWaiting } from "@/lib/query-state";

/**
 * THE INBOX SURFACE. One list of everything the crew holds, sorted by who needs
 * you rather than by who is working: the review gate first, then runs stopped on
 * an answer, then live work, then what is over.
 *
 * EVERY ROW IS A REAL READ. The calls come from `getApprovalsQueue`, the runs
 * from `listMissions`, the same two resolvers Today composes its triage card
 * from, under the same shared cache keys. Nothing here is sample data; where a
 * group has nothing real to show, the component draws nothing for it.
 *
 * SPEND TRANSPARENCY. Each run shows its cost, and the page headline includes
 * the total workspace spend. Cost is "—" when unknown (no checkpointed traces
 * yet), never a fabricated $0.00. Totaling unknown costs is the sum of the
 * known ones only, which is honest about what is measured.
 */
const SUBTITLE = "Every call and run in one list, grouped by what each one needs from you.";

const GROUP_NOTES: Record<InboxNeed, React.ReactNode> = {
  "needs-input": "Nothing moves on these until you act.",
  ready: "These stopped before they finished. Open one to see how far it got.",
  working: "Waiting on an agent, not on you.",
  done: "Finished. Open one to see how it ended, and what it left behind.",
};

/** Epoch ms for sort, never NaN: an undated row falls back through the chain
 *  and lands at zero, the oldest thing in its group, rather than sorting
 *  unpredictably against a number it does not have. */
function instant(primary?: string | null, fallback?: string | null): number {
  const first = Date.parse(primary ?? "");
  if (Number.isFinite(first)) return first;
  const second = Date.parse(fallback ?? "");
  return Number.isFinite(second) ? second : 0;
}

function withWhen(state: React.ReactNode, iso: string | null | undefined): React.ReactNode {
  const when = ago(iso);
  return when ? (
    <>
      {state} {when}
    </>
  ) : (
    state
  );
}

/** Compute total spend across missions, null = unknown (has any null values) */
function workspaceSpendTotal(rows: MissionListRow[]): number | null {
  let total = 0;
  for (const m of rows) {
    if (m.cost_usd === null) return null; // Any unknown makes the total unknown
    total += m.cost_usd;
  }
  return total;
}

export function InboxSurface() {
  const navigate = useNavigate();
  // Not a station on the spine; the strip lights nothing here, like /runs.
  useSpineStrip(null);
  const { activeWorkspace, workspaces, isLoading: readingWorkspaces } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;

  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchMissions = useServerFn(listMissions);

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

  /*
   * QUEUED MISSIONS ARE DELIBERATELY ABSENT. A queued run has no worker on it
   * yet, so it is neither needing a person nor working, and every group here is
   * a claim about whose move it is. They stay visible on Open Runs instead.
   */
  const sessions = React.useMemo<AgentSession[]>(() => {
    const calls = queue.data?.items ?? [];
    const rows = missions.data?.missions ?? [];

    const callSessions: AgentSession[] = calls.map((c) => ({
      id: c.id,
      title: cleanTitle(c.title),
      need: "needs-input",
      activity: "waiting on your call",
      at: instant(c.timestamp),
      agentSlug: c.agentSlug ?? null,
    }));

    const runSessions: AgentSession[] = rows.flatMap((m): AgentSession[] => {
      const title = cleanTitle(m.title);
      const onOpen = () => void navigate({ to: "/runs/$missionId", params: { missionId: m.id } });

      switch (taskStatus(m.status)) {
        case "blocked":
          return [
            {
              id: m.id,
              title,
              need: "needs-input",
              activity: "waiting on you",
              at: instant(m.completed_at ?? m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
              onReply: (text: string) => openAsk(`About the run "${title}": ${text}`),
            },
          ];
        case "running": {
          const elapsed = ago(m.created_at);
          return [
            {
              id: m.id,
              title,
              need: "working",
              activity: m.current_sub_goal
                ? stripAutoPrefix(m.current_sub_goal)
                : elapsed
                  ? `running ${elapsed}`
                  : "running",
              at: instant(m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
            },
          ];
        }
        case "failed":
          // Failed sits in ready, per the component's own rule: the machine has
          // finished and it is now your turn, so the chip reads the outcome.
          return [
            {
              id: m.id,
              title,
              need: "ready",
              failed: true,
              activity: withWhen(<RunState status={m.status} />, m.completed_at ?? m.updated_at),
              at: instant(m.completed_at ?? m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
            },
          ];
        case "stopped":
          return [
            {
              id: m.id,
              title,
              need: "done",
              activity: withWhen(<RunState status={m.status} />, m.completed_at ?? m.updated_at),
              at: instant(m.completed_at ?? m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
            },
          ];
        case "done":
        case "partial":
          return [
            {
              id: m.id,
              title,
              need: "done",
              activity: withWhen(
                <ShippedState partial={taskStatus(m.status) === "partial"} />,
                m.completed_at ?? m.updated_at,
              ),
              at: instant(m.completed_at ?? m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
            },
          ];
        case "queued":
          return [];
      }
    });

    return [...callSessions, ...runSessions];
  }, [queue.data, missions.data, navigate]);

  const missionRows = missions.data?.missions ?? [];
  const workspaceSpend = workspaceSpendTotal(missionRows);

  const waitingOnYou = sessions.filter((s) => s.need === "needs-input").length;
  const runningCount = sessions.filter((s) => s.need === "working").length;

  const reading = stillWaiting(queue, missions);

  const headline = React.useMemo(() => {
    if (reading) return "Inbox";
    if (queue.isError && missions.isError)
      return "Neither your call queue nor your run record loaded.";
    if (queue.isError) return "Your call queue did not load.";
    if (missions.isError) return "Your run record did not load.";
    if (waitingOnYou > 0)
      return (
        <>
          <Num>{waitingOnYou}</Num> waiting on you.
        </>
      );
    if (runningCount > 0)
      return (
        <>
          Nothing waits on you. <Num>{runningCount}</Num> still running.
        </>
      );
    return "Nothing needs you.";
  }, [reading, queue.isError, missions.isError, waitingOnYou, runningCount]);

  if (!readingWorkspaces && workspaces.length === 0) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading title="Inbox" sub={SUBTITLE} />
          <NeedsSetup
            kind="no-workspace"
            thenWhat="every call the crew stops to ask, and every run it is holding, lands here grouped by what each one needs from you."
          />
        </div>
      </Surface>
    );
  }

  const spendNote = workspaceSpend !== null ? `Workspace spend: $${workspaceSpend.toFixed(2)}` : null;

  return (
    <Surface>
      <div className="flex flex-col gap-mrd-7">
        <div className="flex items-end justify-between gap-mrd-4">
          <PageHeading title={headline} sub={SUBTITLE} />
          {spendNote && (
            <p className="mrd-meta">{spendNote}</p>
          )}
        </div>

        {reading ? (
          <Reading>Reading what needs you.</Reading>
        ) : queue.isError || missions.isError ? (
          <ReadFailedLine
            onRetry={() => {
              void queue.refetch();
              void missions.refetch();
            }}
            error={queue.error ?? missions.error}
          >
            {queue.isError && missions.isError
              ? "Nothing was settled and nothing was lost while this page could not read them. Retry before you treat the inbox as clear."
              : queue.isError
                ? "Your calls are unchanged and this could not read them. Retry before you treat the inbox as clear."
                : "The run record did not load, so what stopped, what is live and what shipped are missing from this list."}
          </ReadFailedLine>
        ) : (
          <AgentInbox sessions={sessions} groupNote={GROUP_NOTES} />
        )}
      </div>
    </Surface>
  );
}
