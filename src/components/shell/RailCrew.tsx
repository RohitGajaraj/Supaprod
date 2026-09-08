/**
 * WHO IS WORKING, IN THE RAIL, BY NAME.
 *
 * ── ONE READ FOR LIVE WORK (Lane 1, 2026-09-08) ───────────────────────────
 * This read `getWorkspaceAnchors` on its own key and drew a mark, a name
 * and a verb; the home's Working-now strip and the road's presence dots
 * read `listRunningNow` under `runningNowKey`. Two feeds for one fact, and
 * the rail's had no identity colour, no object, no clock, and a door that
 * landed on the queue rather than the run (entry review, 2026-09-08). Now
 * every surface that says who is working reads the same key, which
 * `useRunningNowPush` moves the moment a seat starts, ends or stamps, and
 * draws the same AgentPresence in the seat's own colour, so the rail, the
 * home and the run screen can never disagree about who is doing what.
 *
 * ── THREE STATES, AND THE MIDDLE ONE IS THE POINT ─────────────────────────
 *   reading    quiet, then it says so. `SlowRead` stays silent for 2.5s; a
 *              rail that flickers a crew in on every navigation is worse than
 *              one that arrives a moment late.
 *   failed     SAYS SO. "It never shows a calm room on a dead feed." An empty
 *              rail on a broken read is the false all-clear this rail exists
 *              to prevent, and it would be silent.
 *   nobody     the door to the home, except on the home, which IS the
 *              composer three inches to the right (S2, 2026-08-31).
 */
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AgentPresence } from "@/components/meridian/AgentPresence";
import { pollMs } from "@/components/shell/poll";
import { SlowRead } from "@/components/shell/SlowRead";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";
import { workingSeats } from "@/components/start/CrewAtWork";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { runningNowKey } from "@/lib/query-keys";
import { listRunningNow } from "@/lib/spine/track.functions";

export function RailCrew({ workspaceId }: { workspaceId: string | null }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fRunning = useServerFn(listRunningNow);

  const q = useQuery({
    queryKey: runningNowKey(workspaceId),
    queryFn: () => fRunning({ data: { workspaceId } }),
    enabled: Boolean(workspaceId),
    staleTime: 10_000,
    refetchInterval: (q) => pollMs(10_000, q.state.fetchFailureCount),
  });

  if (!workspaceId) return null;

  if (q.isError) {
    return (
      <div data-state="blind" className="mt-mrd-4 border-t border-mrd-line-soft px-mrd-4 pt-mrd-4">
        <p className="text-mrd-nano font-[650] tracking-mrd-label text-mrd-fail uppercase">
          Cannot see who is working
        </p>
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <p className="mt-mrd-4 border-t border-mrd-line-soft px-mrd-4 pt-mrd-4 text-mrd-label text-mrd-mute">
        <SlowRead inline onRetry={() => void q.refetch()}>
          Reading who is working.
        </SlowRead>
      </p>
    );
  }

  const seats = workingSeats(q.data);

  if (seats.length === 0) {
    /* A door to the room you are standing in is not a door: the home IS the
       composer. Elsewhere, the way forward and no claim about the room. */
    if (pathname === SIGNED_IN_HOME) return null;
    return (
      <div data-state="quiet" className="mt-mrd-4 border-t border-mrd-line-soft px-mrd-4 pt-mrd-4">
        <button
          type="button"
          onClick={() => navigate({ to: SIGNED_IN_HOME })}
          className="flex w-full items-center gap-mrd-3 rounded-mrd-ctl px-mrd-2 py-mrd-2 text-left text-mrd-label text-mrd-mute transition-colors hover:bg-mrd-hover hover:text-mrd-ink"
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          Start a run
        </button>
      </div>
    );
  }

  return (
    <div
      data-state="working"
      className="mt-mrd-4 flex min-w-0 flex-col gap-mrd-2 border-t border-mrd-line-soft px-mrd-4 pt-mrd-4"
    >
      <p className="text-mrd-nano font-[650] tracking-mrd-label text-mrd-mute uppercase">
        Working now
      </p>
      <ul className="flex min-w-0 flex-col gap-mrd-1">
        {seats.map((s) => (
          <li key={s.runId} className="min-w-0">
            {/* The same presence the home strip and the road draw, in the
                seat's own colour; the door opens the run it is inside. */}
            <AgentPresence
              seat={s.seat}
              verb={
                s.verb
                  ? s.objectLabel
                    ? `${s.verb} ${s.objectLabel}`
                    : s.verb
                  : s.station
                    ? `working at ${AGENT_STATIONS[s.station].name}`
                    : "working"
              }
              since={s.since}
              onOpen={
                s.trackId
                  ? () => navigate({ to: "/track/$trackId", params: { trackId: s.trackId! } })
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RailCrew;
