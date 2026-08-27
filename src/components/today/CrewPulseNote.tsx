import { pollMs } from "@/components/shell/poll";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getSwarmHud } from "@/lib/swarm.functions";
import { ago } from "./when";
import { crewPulse, crewPulseLine } from "./crew-pulse";

/**
 * ON A QUIET BOARD, WHETHER THE QUIET IS THE PRODUCT WORKING OR THE PRODUCT
 * STOPPED.
 *
 * `crew-pulse.ts` carries the argument. The short version: a calm screen is
 * this product's best day and its worst failure drawn in the same pixels, and
 * until now a reader could not tell which. Three situations, one appearance —
 * the crew ran and needed nobody, the crew has not run for days, and no agent
 * is switched on at all.
 *
 * ── ONE READ, SHARED ───────────────────────────────────────────────────────
 * Same shape and the same reason as `HandoverNote`: the key is
 * `["swarm","hud",workspaceId]`, which `HandoverNote` and `AgentRelay` already
 * use, so react-query serves all of them from one round trip. This is an
 * ENRICHMENT of a state the board already draws, not a region of its own, so
 * it does not owe the wait-and-refusal contract that
 * `today-states-its-wait.test.ts` holds over regions.
 *
 * ── IT IS SILENT UNTIL IT KNOWS ────────────────────────────────────────────
 * `known` is passed as `Boolean(q.data)` and it is load-bearing. An unanswered
 * read produces zero enabled agents, which is indistinguishable from a
 * workspace that genuinely has none — so without it, every quiet board would
 * flash "No agent is switched on yet" while the read was still in flight and
 * send people to configure a crew they already have. A failed read says
 * nothing at all for the same reason: this sits under a state that already
 * claims calm, and adding a second sentence about a read nobody asked about
 * would be the surface talking about itself.
 *
 * ── THE SETUP CASE GETS A DOOR ─────────────────────────────────────────────
 * R-20 section 6: a screen that only tells is a fail. "No agent is switched on"
 * is the one branch here that names something a person can act on, so it is the
 * one branch that carries a link. The other two are facts about work already
 * happening and need no verb.
 */
export function CrewPulseNote({ workspaceId }: { workspaceId: string | null }) {
  const fHud = useServerFn(getSwarmHud);
  const q = useQuery({
    queryKey: ["swarm", "hud", workspaceId],
    queryFn: () => fHud({ data: { workspaceId } }),
    /* Backed off while the read is failing (`poll.ts`). The base cadence is
       this note's own statement about how fast the fact it draws moves. */
    refetchInterval: (q) => pollMs(15_000, q.state.fetchFailureCount),
    refetchIntervalInBackground: false,
  });

  const now = Date.now();
  const pulse = crewPulse(q.data, now);
  const line = crewPulseLine(pulse, now, ago, Boolean(q.data));
  if (!line) return null;

  const needsSetup = pulse.enabled === 0;
  return (
    <p className="text-mrd-data leading-mrd-prose text-mrd-mute">
      {line}
      {needsSetup ? (
        <>
          {" "}
          <Link to="/crew" className="text-mrd-you underline underline-offset-2">
            Switch one on
          </Link>
        </>
      ) : null}
    </p>
  );
}
