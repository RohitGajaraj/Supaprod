import { AgentPulse } from "@/components/meridian/AgentPulse";
import { useLiveAgents } from "@/hooks/use-live-agents";
import { agentStation, type AgentStation } from "@/lib/agent-vocabulary";

/**
 * THE CREW, WORKING, ON THE SURFACE WHERE THE WORK IS.
 *
 * Mount this on a station and it says nothing at all until an agent is
 * genuinely mid-run somewhere in this workspace, then names who, on what, and
 * what they are actually doing about it.
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
 * AND THE SECOND LINE IS WHERE THAT TEST IS ACTUALLY PASSED. A name and a state
 * prove something is alive. The planner's own sentence for the step the mission
 * is on — "Implement a /health JSON endpoint and a plain landing page in the
 * starter app" — proves something is thinking, and it was already written,
 * already stored and already fetched: `listMissions` reads `mission_steps` for
 * the step dots, so this is one column, not a request. It is null often (a
 * single-run mission has no steps at all), and the line simply does not appear
 * then, because the mission title above it is still true.
 *
 * WHY IT IS NOT PASSED AS THE PULSE'S `detail`. That slot is mono, nowrap and
 * one line (`.sp-pulse-detail`, primitives.css:2592-2605) and its contract asks
 * for "a NOUN THIS SURFACE ALREADY READ. Never a second verb"
 * (AgentPulse.tsx:112-117). A sub_goal is an imperative sentence starting with
 * a verb, so it would fight the rotating one and be clipped to a few monospaced
 * words. The title stays in `detail`, where a noun belongs, and the sentence
 * gets room to be a sentence.
 *
 * HONEST BY CONSTRUCTION. It reads real run rows, so it cannot show a
 * fabricated step: with nothing running it renders `null` and takes no space.
 * That is also why it is safe to mount on every station.
 *
 * surface-discipline §7 is satisfied for the same reason: `AgentPulse` is
 * reserved for a genuinely dispatched agent, and this mounts one only when a
 * mission row says an agent is mid-run.
 */

/**
 * HOW THE SENTENCE IS BOUNDED, AND WHY NOT IN JAVASCRIPT.
 *
 * It has to be bounded by something: `.sp-line-sub` sets a 56ch measure
 * (primitives.css:1104-1110), so two lines is the budget before a third starts
 * shoving the station's own title down the page. Measured over every
 * `mission_steps` row on 2026-08-06: 291 of 291 carry a sub_goal, median 110
 * characters, p90 240, longest 561 — so about half arrive whole and the rest
 * are longer than the room available.
 *
 * THE BOUND IS THE BROWSER'S, NOT OURS, and in this product that distinction is
 * not a style preference. Slicing the string at 112 characters and appending an
 * ellipsis would put a sentence on screen that the planner never wrote, inside
 * the one surface whose entire job is to report what an agent actually said.
 * `-webkit-line-clamp` renders the same two lines and the same trailing
 * ellipsis, but the sentence in the DOM stays whole: it selects whole, copies
 * whole, and is read out whole by a screen reader, which does not honour the
 * clamp. What is clipped is the VIEW of the fact, never the fact.
 *
 * Inline rather than a utility class on purpose. `.sp-line-sub` declares
 * `display: block` and is unlayered, so it outranks anything in Tailwind's
 * `utilities` layer (`line-clamp-2` included) no matter the source order; the
 * clamp needs `display: -webkit-box` to survive, and only the style attribute
 * reliably gets it there.
 */
const CLAMP_TO_TWO_LINES = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
} as const;

export function CrewWorking({
  /** Optional. Narrows the line to one mission, for a surface about one thing. */
  missionId,
  /**
   * Optional. Narrows to the agents standing at ONE STATION.
   *
   * WHY A STATION MOUNT NEEDS THIS. `useLiveAgents` reads every mission mid-run
   * in the workspace, so an unscoped mount on a station can print "Engineer is
   * working on Beacon SSO" above the grading desk while nothing whatsoever
   * about Learn is running. That sentence is true at PRODUCT scope and false at
   * STATION scope, and a person standing on one station reads it as a claim
   * about the station they are standing on.
   *
   * THE RULE, so the next mount does not have to re-derive it: a surface ABOUT
   * a station passes its station. A surface about the whole product (Brain,
   * Today) passes nothing, and its unscoped line is honest precisely because
   * the surface itself is product-wide.
   *
   * IT COSTS NOTHING. `agentStation` is the same pure catalog lookup
   * `listStudioSessions` uses server-side to place a mission on the seven-stage
   * strip, applied to the slug this hook already carries. No second query, no
   * second key, and the station is derived the way the strip's own chip derives
   * it rather than by a rule invented at the call site.
   *
   * An agent whose slug the catalog does not know resolves to no station and is
   * therefore counted at none, which is the same refusal-to-guess
   * `listStudioSessions` makes rather than parking it on a default.
   */
  station,
}: {
  missionId?: string | null;
  station?: AgentStation;
}) {
  const { working } = useLiveAgents();
  const scoped = station ? working.filter((w) => agentStation(w.slug) === station) : working;
  const shown = missionId ? scoped.filter((w) => w.missionId === missionId) : scoped;
  if (shown.length === 0) return null;

  const lead = shown[0];
  const others = shown.length - 1;
  // Trimmed, not shortened. A blank-but-present sub_goal would otherwise render
  // as an empty line under the pulse, which reads as a rendering fault rather
  // than as the absence of a step.
  const work = lead.subGoal?.trim() || null;

  return (
    <div>
      <AgentPulse
        // The NAME and the WORK, never "loading". A screen reader gets the same
        // sentence a sighted reader gets.
        //
        // The sub_goal is deliberately NOT folded in here. This string is read
        // out by a live region on every change, and a 110-character sentence
        // announced into someone's ear is hostile; the line below it is plain
        // page content, so a screen reader reaches it in order, once, when the
        // reader is ready for it.
        label={
          others > 0
            ? `${lead.name} is working on ${lead.title}, and ${others} more ${others === 1 ? "run is" : "runs are"} going`
            : `${lead.name} is working on ${lead.title}`
        }
        /* The RUN id, which every seat has (P-127). `missionId` is nullable
           now -- a release seat has no mission -- so a seed built from it
           would be undefined for exactly the seats this packet made visible. */
        seed={lead.slug ?? lead.id}
        detail={lead.title}
      />
      {/* The step, in the planner's words, WHOLE. `sp-line-sub` rather than a
          new class because it is the one second-line style in the system with a
          prose measure on it (56ch), which is what a wrapped sentence needs and
          what a path or a count — everything else that sits under a live line —
          does not. The clamp above decides how much of it is visible; nothing
          decides how much of it exists. Nothing is written here that the row did
          not carry. */}
      {work ? (
        <span className="sp-line-sub" style={CLAMP_TO_TWO_LINES}>
          {work}
        </span>
      ) : null}
    </div>
  );
}
