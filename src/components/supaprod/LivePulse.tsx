// AI-PULSE (founder ruling 2026-07-08, v3): the platform-wide live-activity
// line, in ONE place - the top bar. One shared 4s poll (paused when the tab is
// hidden) feeds it; keepPreviousData holds the line across the refetch so it
// never blanks. It shows the ACTION verb (never the mission title), fades only
// when the machine is truly idle. The sidebar no longer duplicates it.
import { Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveActivity, type LiveActivity } from "@/lib/agents.functions";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { AiPulse } from "@/components/meridian/AiPulse";
import { useWorkspace } from "@/hooks/use-workspace";
import { approvalsQueueKey } from "@/lib/query-keys";

/** Polls stop while the tab is hidden, resume on the next visible tick. */
export function pollWhenVisible(ms: number) {
  return () =>
    typeof document !== "undefined" && document.visibilityState === "hidden" ? false : ms;
}

const EMPTY: LiveActivity = { state: "idle", missionId: null, action: "" };

/** The one shared live-activity read; every mount rides this cache. */
export function useLiveActivity(): LiveActivity {
  const fetchActivity = useServerFn(getLiveActivity);
  const q = useQuery({
    queryKey: ["live-activity"],
    queryFn: () => fetchActivity(),
    refetchInterval: pollWhenVisible(4000),
    placeholderData: keepPreviousData,
  });
  return q.data ?? EMPTY;
}

/**
 * The global ticker (mounted in the top bar, so it rides every authenticated
 * screen). Renders nothing when the machine is idle. While work runs it shows
 * the ACTION in the glacier shimmer (working = glacier, waiting on you =
 * ember; founder ruling 2026-07-11), linking to the mission's cockpit. It
 * does NOT show human-gate state - that lives in its own surfaces (Today
 * badge + gate cards), so a stale open approval never keeps the pulse lit.
 */
export function LiveTicker() {
  const a = useLiveActivity();
  // Founder ruling 2026-07-18: "Waiting on you" IS the approvals affordance,
  // so it must do the job completely. It stays visible with the live count
  // whenever ANYTHING sits in the federated queue (not only while an agent
  // run is mid-pause), and clicking it opens the one queue. ONE COUNT, ONE
  // SOURCE: scoped to the active workspace, same query key the rail badge,
  // the Today hero, and the /approvals page all read - one shared cache, one
  // number, everywhere.
  const { activeWorkspaceId } = useWorkspace();
  const fetchQueue = useServerFn(getApprovalsQueue);
  const queue = useQuery({
    queryKey: approvalsQueueKey(activeWorkspaceId),
    queryFn: () => fetchQueue({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    refetchInterval: pollWhenVisible(30_000),
    placeholderData: keepPreviousData,
  });
  const waitingCount = queue.data?.items?.length ?? 0;

  if (waitingCount > 0 || a.state === "waiting") {
    // Say WHAT waits (founder 2026-07-18): these are approvals, name them.
    const label =
      waitingCount > 0
        ? `${waitingCount} approval${waitingCount === 1 ? "" : "s"} waiting on you`
        : a.action || "An approval is waiting on you";
    return (
      <Link
        to="/approvals"
        style={{ textDecoration: "none", minWidth: 0 }}
        aria-label={`Open the approvals queue (${label})`}
      >
        <AiPulse label={label} state="waiting" style={{ maxWidth: 260 }} />
      </Link>
    );
  }

  if (a.state === "idle" || !a.action) return null;
  const inner = <AiPulse label={a.action} state="working" style={{ maxWidth: 260 }} />;
  return a.missionId ? (
    <Link
      to="/runs/$missionId"
      params={{ missionId: a.missionId }}
      style={{ textDecoration: "none", minWidth: 0 }}
      aria-label={`Open the running mission (${a.action})`}
    >
      {inner}
    </Link>
  ) : (
    <Link
      to="/build"
      style={{ textDecoration: "none", minWidth: 0 }}
      aria-label={`Open Build (${a.action})`}
    >
      {inner}
    </Link>
  );
}
