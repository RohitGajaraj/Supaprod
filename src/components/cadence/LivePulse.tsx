// AI-PULSE (founder ruling 2026-07-08): the platform-wide live-activity
// ticker. ONE shared query key + ONE 4s poll (paused while the tab is
// hidden) feeds every mount - the TopBar ticker on every screen, the rail
// working line, and any surface-local pulse - so the platform never
// disagrees with itself about what the machine is doing.
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLiveActivity, type LiveActivityItem } from "@/lib/agents.functions";
import { AiPulse } from "@/components/obsidian/AiPulse";

/** Polls stop while the tab is hidden, resume on the next visible tick. */
export function pollWhenVisible(ms: number) {
  return () =>
    typeof document !== "undefined" && document.visibilityState === "hidden" ? false : ms;
}

/** The one shared live-activity read; every mount rides this cache. */
export function useLiveActivity() {
  const fetchActivity = useServerFn(getLiveActivity);
  const q = useQuery({
    queryKey: ["live-activity"],
    queryFn: () => fetchActivity(),
    refetchInterval: pollWhenVisible(4000),
  });
  return { items: q.data?.items ?? [], isPending: q.isPending };
}

/** Progressive verb per run state - what a human wants to read, not a status enum. */
export function liveVerb(item: LiveActivityItem): string {
  if (item.status === "waiting_approval") return "waiting on you";
  if (item.status === "queued") return "queued";
  return item.stepIndex > 0 ? `working · step ${item.stepIndex}` : "working";
}

function itemLabel(item: LiveActivityItem): string {
  const name = item.missionTitle ?? item.agentName;
  return `${name} · ${liveVerb(item)}`;
}

/**
 * The global ticker (mounted in the TopBar, so it rides every authenticated
 * screen). Renders nothing when the machine is idle; while anything runs it
 * shows the newest run's one-liner in the azure working shimmer, linking to
 * the mission's cockpit (or /build when the run has no mission).
 */
export function LiveTicker() {
  const { items } = useLiveActivity();
  if (items.length === 0) return null;
  const first = items[0];
  const more = items.length - 1;
  const label = `${itemLabel(first)}${more > 0 ? ` · +${more} more` : ""}`;
  const inner = <AiPulse label={label} style={{ maxWidth: 380 }} />;
  return first.missionId ? (
    <Link
      to="/build/$missionId"
      params={{ missionId: first.missionId }}
      style={{ textDecoration: "none", minWidth: 0 }}
      aria-label={`Open the running mission: ${label}`}
    >
      {inner}
    </Link>
  ) : (
    <Link
      to="/build"
      style={{ textDecoration: "none", minWidth: 0 }}
      aria-label={`Open Build: ${label}`}
    >
      {inner}
    </Link>
  );
}

/**
 * A surface-local pulse: same cache, optionally filtered to one mission.
 * Renders nothing when that scope is idle.
 */
export function LivePulse({ missionId, size }: { missionId?: string; size?: number }) {
  const { items } = useLiveActivity();
  const scoped = missionId ? items.filter((i) => i.missionId === missionId) : items;
  if (scoped.length === 0) return null;
  return <AiPulse label={itemLabel(scoped[0])} size={size} />;
}
