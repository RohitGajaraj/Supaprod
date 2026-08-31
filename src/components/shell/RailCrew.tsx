import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AgentMark } from "@/components/meridian/marks";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { pollMs } from "@/components/shell/poll";
import { SlowRead } from "@/components/shell/SlowRead";
import { crewFromAnchors } from "@/components/shell/rail-crew";
import { getWorkspaceAnchors } from "@/lib/approvals-queue.functions";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

/**
 * THE CREW, ON EVERY SURFACE.
 *
 * SPEC-MULTIPLAYER-PRESENCE section 3.4: "The persistent rail carries a stack of
 * the active teammates' marks - one glance, on any surface, answers how many are
 * working and on what. Click one, go to what it is doing. Nothing running: the
 * rail is the door to /start."
 *
 * ── WHY THIS IS NOT THEATRE, STRUCTURALLY ─────────────────────────────────
 * Section 2 is the law this feature is most able to break: "A cursor that moves
 * when nothing is happening is theatre, and theatre is the one regression that
 * deletes a feature rather than fixing it. If you cannot name the row a position
 * came from, do not draw the position."
 *
 * Nothing here is careful about that, because nothing here CAN break it.
 * `getWorkspaceAnchors` filters `agent_runs` to `status IN ('running',
 * 'in_progress')` and joins `tool_calls` only to those runs' traces, so an
 * anchor IS a live run and the newest action it actually took. There is no
 * input to this component that carries a teammate without a row behind it.
 *
 * ── AND WHY IT COSTS THE AGENTS NOTHING ───────────────────────────────────
 * Section 2.5 answers the strongest objection to this whole feature - that an
 * agent will burn more tokens watching other agents than working. It is right
 * about agents and wrong about people, and the distinction is the design: this
 * is a READ OF STATE FOR A HUMAN, rendered from rows that already exist. No
 * teammate is fed another teammate's transcript to make it work. The agents are
 * not participants in it.
 *
 * ── THREE STATES, AND THE MIDDLE ONE IS THE POINT ─────────────────────────
 *   reading    quiet, then it says so. `SlowRead` stays silent for 2.5s - a
 *              rail that flickers a crew in on every navigation is worse than
 *              one that arrives a moment late - and speaks once the wait stops
 *              being ordinary. Returning `null` outright is what
 *              `a-null-under-a-heading-is-a-broken-promise` exists to stop, and
 *              it caught this file on its first run.
 *   failed     SAYS SO. Section 2: "It never shows a calm room on a dead feed."
 *              An empty rail on a broken read is the false all-clear this whole
 *              lane exists to prevent, and it would be silent.
 *   nobody     the door to /start, which is the spec's own answer.
 */
export function RailCrew({ workspaceId }: { workspaceId: string | null }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fAnchors = useServerFn(getWorkspaceAnchors);

  /* THE SAME KEY `OverlapNote` READS. The board's collision marks and this
     stack are two renderings of one fact, so they share one fetch and cannot
     disagree about who is working. */
  const anchors = useQuery({
    queryKey: ["presence", "anchors", workspaceId],
    queryFn: () => fAnchors({ data: { workspaceId: workspaceId as string } }),
    enabled: Boolean(workspaceId),
    staleTime: 10_000,
    refetchInterval: (q) => pollMs(10_000, q.state.fetchFailureCount),
  });

  if (!workspaceId) return null;

  if (anchors.isError) {
    return (
      <div data-state="blind" className="mt-mrd-4 border-t border-mrd-line-soft px-mrd-4 pt-mrd-4">
        <p className="text-mrd-nano font-[650] tracking-mrd-label text-mrd-fail uppercase">
          Cannot see who is working
        </p>
      </div>
    );
  }

  /* QUIET, THEN IT SAYS SO. `isLoading` is first-load only, so a refetch never
     blanks a stack that is already correct. `SlowRead` holds its tongue for the
     first 2.5s and then reports, which is the difference between a rail that
     has not answered yet and one that is stuck. */
  if (anchors.isLoading) {
    return (
      <p className="mt-mrd-4 border-t border-mrd-line-soft px-mrd-4 pt-mrd-4 text-mrd-label text-mrd-mute">
        <SlowRead inline onRetry={() => void anchors.refetch()}>
          Reading who is working.
        </SlowRead>
      </p>
    );
  }

  const crew = crewFromAnchors(anchors.data?.anchors);

  const unknowable = anchors.data?.unknowableRuns ?? 0;

  /* A DOOR, NOT A SENTENCE, AND THAT IS THE WHOLE CARE HERE.
     The spec's words for this state are "Nothing running: the rail is the door
     to /start", and the door is safe while the SENTENCE is not.
     `getWorkspaceAnchors` swallows a failed `agent_runs` read and returns
     `{ anchors: [], unknowableRuns: 0 }` rather than throwing, so `isError`
     stays false and this branch is reached by BOTH "nobody is working" and
     "we could not find out". They are byte-identical here.
     Section 2: "It never shows a calm room on a dead feed." So this offers the
     way forward and claims nothing about the room. */
  if (crew.length === 0 && unknowable === 0) {
    /* ── A DOOR TO THE ROOM YOU ARE STANDING IN IS NOT A DOOR ──────────────
     *
     * Found by looking at the rendered shell rather than by reading this file
     * (2026-08-31, S2). Standing on the home, this offered "Start a piece of
     * work" - and the home IS the composer, three inches to the right, already
     * focused. R-20's "no dead end" is about a surface offering the next
     * action; an action that lands you where you already are is the same defect
     * wearing the remedy's clothes.
     *
     * IT WAS DEFENSIBLE UNTIL THIS MORNING and that is why it is only being
     * fixed now. While the rail's first door was Today, `/start` was somewhere
     * a person had to be sent. F-144 made the home the one primary door, so
     * this became the second door to it in the same rail.
     *
     * NOTHING IS RENDERED RATHER THAN A SENTENCE, and the reason is the one
     * this whole branch is built around: `getWorkspaceAnchors` still swallows a
     * failed `agent_runs` read and returns an empty result rather than throwing
     * (approvals-queue.functions.ts, `if (runsErr || !runs) return { anchors:
     * [] ... }`), so `isError` stays false and this branch is reached by BOTH
     * "nobody is working" and "we could not find out". **A sentence here would
     * be a false all-clear on a dead feed**, which §2 forbids by name. Drawing
     * nothing claims nothing. The fix belongs at the source and it is S0's;
     * asked again this unit. */
    if (pathname === SIGNED_IN_HOME) return null;

    return (
      <div data-state="quiet" className="mt-mrd-4 border-t border-mrd-line-soft px-mrd-4 pt-mrd-4">
        <button
          type="button"
          onClick={() => navigate({ to: "/start" })}
          className="flex w-full items-center gap-mrd-3 rounded-mrd-ctl px-mrd-2 py-mrd-2 text-left text-mrd-label text-mrd-mute transition-colors hover:bg-mrd-hover hover:text-mrd-ink"
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          Start a piece of work
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
        {crew.map((m) => {
          const name = agentDisplayName(m.slug);
          return (
            <li key={m.slug}>
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-mrd-3 rounded-mrd-ctl px-mrd-2 py-mrd-2 text-left text-mrd-label text-mrd-mute transition-colors hover:bg-mrd-hover hover:text-mrd-ink"
                style={{ transitionDuration: "var(--mrd-d-press)" }}
                /* The verb is in the accessible name, not only beside the mark:
                   "Engineer, writing the change" is the whole fact, and a
                   screen reader that gets the name alone gets half of it. */
                aria-label={`${name}, ${m.verb}`}
                title={`${name} - ${m.verb}`}
                onClick={() =>
                  m.missionId
                    ? navigate({ to: "/runs/$missionId", params: { missionId: m.missionId } })
                    : navigate({ to: "/today" })
                }
              >
                <AgentMark slug={m.slug} size="sm" state="running" />
                <span className="shrink-0 text-mrd-ink">{name}</span>
                {/* THE VERB TRUNCATES, THE NAME DOES NOT. If the rail is narrow the
                    thing to lose is what a teammate is doing, never who is
                    doing it: a nameless mark is the furniture this stack was
                    built to replace. */}
                <span className="min-w-0 truncate">{m.verb}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {/* RUNS WE CANNOT SPEAK FOR, counted rather than dropped. A live run with
          no `trace_id` cannot be tied to any tool call, so there is no action to
          name - and omitting it would undercount the crew on the one control
          that answers "how many are working". A positive count here is provable;
          zero is not, which is why it only ever draws upward. */}
      {unknowable > 0 ? (
        <p className="px-mrd-2 text-mrd-nano text-mrd-faint">
          {unknowable === 1
            ? "1 more is running and not saying what"
            : `${unknowable} more are running and not saying what`}
        </p>
      ) : null}
    </div>
  );
}
