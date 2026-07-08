// AI-PULSE (founder ruling 2026-07-08, v3): the platform-wide live-activity
// line, in ONE place - the top bar. One shared 4s poll (paused when the tab is
// hidden) feeds it; keepPreviousData holds the line across the refetch so it
// never blanks. It shows the ACTION verb (never the mission title), fades only
// when the machine is truly idle. The sidebar no longer duplicates it.
import { Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveActivity, type LiveActivity } from "@/lib/agents.functions";
import { AiPulse } from "@/components/obsidian/AiPulse";

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
 * the ACTION in the ember shimmer, linking to the mission's cockpit. It does
 * NOT show human-gate state - that lives in its own surfaces (Today badge +
 * gate cards), so a stale open approval never keeps the pulse lit.
 */
export function LiveTicker() {
  const a = useLiveActivity();
  if (a.state === "idle" || !a.action) return null;
  const inner = (
    <AiPulse
      label={a.action}
      state={a.state === "waiting" ? "waiting" : "working"}
      style={{ maxWidth: 260 }}
    />
  );
  return a.missionId ? (
    <Link
      to="/build/$missionId"
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
