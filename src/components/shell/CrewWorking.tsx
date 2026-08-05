import { AgentPulse } from "@/components/shell/AgentPulse";
import { useLiveAgents } from "@/hooks/use-live-agents";

/**
 * THE CREW, WORKING, ON THE SURFACE WHERE THE WORK IS.
 *
 * Mount this on a station and it says nothing at all until an agent is
 * genuinely mid-run somewhere in this workspace, then names who and on what.
 *
 * WHY IT EXISTS. Every other `<AgentPulse>` on a station is gated on a
 * mutation's `isPending`, so it reports the fetch the person's own click
 * started and nothing else. The autonomous path had no light anywhere: a track
 * the driver is walking, a queued run the sweeper just promoted, a mission Ask
 * dispatched. See `use-live-agents.ts` for the full reasoning.
 *
 * IT IS NOT A SPINNER, AND THIS IS THE DISTINCTION THAT MATTERS. A spinner says
 * the surface is busy. This says a named agent is doing a named piece of work,
 * which is the only version of "agentic" a person can actually check. The
 * founder's test is not whether automation happened, it is whether the value of
 * it is visually obvious.
 *
 * HONEST BY CONSTRUCTION. It reads real run rows, so it cannot show a
 * fabricated step: with nothing running it renders `null` and takes no space.
 * That is also why it is safe to mount on every station.
 *
 * surface-discipline §7 is satisfied for the same reason: `AgentPulse` is
 * reserved for a genuinely dispatched agent, and this mounts one only when a
 * mission row says an agent is mid-run.
 */
export function CrewWorking({
  /** Optional. Narrows the line to one mission, for a surface about one thing. */
  missionId,
}: {
  missionId?: string | null;
}) {
  const { working } = useLiveAgents();
  const shown = missionId ? working.filter((w) => w.missionId === missionId) : working;
  if (shown.length === 0) return null;

  const lead = shown[0];
  const others = shown.length - 1;

  return (
    <AgentPulse
      // The NAME and the WORK, never "loading". A screen reader gets the same
      // sentence a sighted reader gets.
      label={
        others > 0
          ? `${lead.name} is working on ${lead.title}, and ${others} more ${others === 1 ? "run is" : "runs are"} going`
          : `${lead.name} is working on ${lead.title}`
      }
      seed={lead.slug ?? lead.missionId}
      detail={lead.title}
    />
  );
}
