import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getSwarmHud } from "@/lib/swarm.functions";
import { ago } from "./when";
import { handoverLine, newestHandoverByMission } from "./handoffs";

/**
 * THE LINE UNDER A RUNNING ROW THAT SAYS WHERE THE WORK JUST CAME FROM.
 *
 * "Planner · running" is ownership. "Handed over by Scout 4m ago: 'draft the
 * launch spec'" is the event — who had it before, and what they passed on.
 * The founder asked to see the handoff twice at run level; this is the
 * board's half of it, drawn where the running work is listed.
 *
 * Engine-Room: the line names teammates and the task they passed on, both of
 * which a person delegated to them. It never names traces, hops, message
 * kinds or any machinery underneath.
 *
 * WHY A PER-ROW COMPONENT AND NOT A ROUTE-LEVEL READ. Today's wait contract
 * (`today-states-its-wait.test.ts`) counts exactly three route-level reads,
 * each with its own stated wait and refusal, and this line must not grow that
 * union: a handover provenance is an ENRICHMENT of a row that already stands,
 * not a fourth region. So the read lives here, under the shared
 * `["swarm","hud",workspaceId]` key every relay variant already uses — one
 * network round trip however many rows mount, deduped by react-query.
 *
 * HONEST BY CONSTRUCTION, BOTH WAYS. A row whose work changed hands gets its
 * line from real `agent_messages` rows written by the runtime itself
 * (`src/lib/ai/handoff.server.ts`); a row nobody handed over draws nothing;
 * and a failed or loading read draws nothing either, because absence of the
 * line claims nothing — there is a difference between saying nothing and
 * saying something untrue.
 *
 * THE WINDOW IS THE PAGE'S OWN. A morning brief says "in the last 24 hours",
 * so a handover older than that boundary is old news and drops, rather than
 * reading as current ownership. See `handoffs.ts` for the derivation and
 * `when.ts` for why the boundary is fixed rather than "since you looked".
 */
export function HandoverNote({
  missionId,
  workspaceId,
}: {
  missionId: string;
  /** The workspace the rows belong to, so the read scopes to the same one. */
  workspaceId: string | null;
}) {
  const fHud = useServerFn(getSwarmHud);
  const q = useQuery({
    queryKey: ["swarm", "hud", workspaceId],
    queryFn: () => fHud({ data: { workspaceId } }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  if (!q.data) return <HandoverLine line={null} />;
  // Read once per paint so every note on the page measures against one clock.
  const now = Date.now();
  const m = newestHandoverByMission(q.data.handoffs, now).get(missionId);
  return <HandoverLine line={handoverLine(m, m ? ago(m.created_at) : null)} />;
}

/**
 * The paint, split from the read so it can be rendered in a test without the
 * server-fn runtime. Nothing here decides facts; it draws the one it was
 * given, or nothing.
 */
export function HandoverLine({ line }: { line: string | null }) {
  if (!line) return null;
  /*
   * CAPPED AT MERIDIAN'S OWN MEASURE, for the same reason the review card is.
   *
   * `handoverLine` quotes the task verbatim and the tasks are real prose. Seen
   * on the running board 2026-08-27: "Handed over by Chief of Staff 8h ago:
   * 'Based on the root cause analysis, write a detailed product requirement
   * document (PRD) specifying the required system changes to correctly handle
   * deleted addresses...'" — 232 characters, on a row's own sub-line, running
   * the full width of the card.
   *
   * `--mrd-measure` is 68ch and its comment says "prose only, never a table or
   * a row". This is prose that happens to sit under a row, which is exactly the
   * case it means. `leading-mrd-prose` joins it because a line this long at row
   * leading is a block rather than a sentence.
   */
  return (
    <p className="max-w-[var(--mrd-measure)] px-mrd-2 pb-mrd-2 text-mrd-data leading-mrd-prose text-mrd-mute">
      {line}
    </p>
  );
}
