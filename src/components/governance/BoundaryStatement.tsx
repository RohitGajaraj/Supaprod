/**
 * THE TOOL BOUNDARY, STATED. NOT A SECOND PLACE TO SET IT.
 *
 * WHY THIS IS ITS OWN FILE. It was the third block of ControlsPanel, which is
 * the body of the Safety room's "Emergency controls" tab. So the three lines
 * that answer the room's own title question, "what is it allowed to do?", sat
 * behind a tab name that promises a stop button, while the tab actually called
 * "What is allowed" opened on regex rules for redacting email addresses: what
 * an agent may SAY, not what it may DO. A buyer clicking the tab whose name
 * matches the page title word for word got the wrong subject.
 *
 * Lifting it here lets the Safety room lead "What is allowed" with the answer
 * and lets Settings > Controls keep the block it has always had, from ONE
 * source. Both mount the same component, which reads `getBoundary` under the
 * same query key /boundary uses, so there is no arrangement of events in which
 * two copies of this can disagree about a count.
 *
 * IT STATES AND DOES NOT SET, and that is load-bearing rather than incidental.
 * ControlsPanel used to write `updateToolMode` here through a second vocabulary
 * over the same stored value; the founder's ruling is that /boundary is the ONE
 * home. So the only affordance is the door.
 */
import { useServerFn } from "@tanstack/react-start";
import { Line } from "@/components/meridian/rows";
import {
  NothingYet,
  Num,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useWorkspace } from "@/hooks/use-workspace";
import { getBoundary } from "@/lib/governance.functions";
import type { BoundaryTool } from "@/lib/governance.functions";

/**
 * THE ONE TOOL RULE THIS COMPONENT RESTATES, AND THE ONLY ONE.
 *
 * `resolveToolMode` (lib/ai/loop.server.ts) carries a branch quoted here
 * verbatim rather than paraphrased:
 *
 *     } else if (mode === "confirm" && toolRisk(toolName) === "low") {
 *       mode = "auto";
 *
 * So a reversible tool that never leaves this workspace does not hold at "come
 * to me first" - the run executes it inline. `getBoundary` buckets on the
 * STORED value, so these tools are listed there under what still comes to you
 * while the loop runs them alone. This block counts them where they actually
 * land and says so; it does not silently renumber the boundary underneath the
 * reader.
 *
 * It reads `floor` and `risk` off the boundary's own rows rather than
 * recomputing either, so there is exactly one client-side restatement of one
 * server rule, and it is this function.
 */
export function runsAloneDespiteAsking(t: BoundaryTool): boolean {
  return t.mode === "confirm" && t.risk === "low" && t.floor === null;
}

export function BoundaryStatement() {
  const { activeWorkspaceId } = useWorkspace();
  const navigate = useNavigate();
  const boundaryFn = useServerFn(getBoundary);

  /**
   * THE SAME READ /boundary MAKES, UNDER THE SAME KEY. Not "a read that agrees
   * with it" - the identical key and the identical server function, so TanStack
   * hands every surface that mounts this one cache entry.
   */
  const boundaryQ = useQuery({
    queryKey: ["boundary", activeWorkspaceId],
    queryFn: () => boundaryFn(),
  });

  const bd = boundaryQ.data;
  const demoted = (bd?.asks ?? []).filter(runsAloneDespiteAsking);
  const alone = (bd?.alone.length ?? 0) + demoted.length;
  const asks = (bd?.asks.length ?? 0) - demoted.length;
  const never = bd?.never.length ?? 0;

  return (
    <Region
      title="What your crew may do alone"
      sub="Set once, on the boundary. Moving one never interrupts work that is already running."
      goTo="Open the boundary"
      onGoTo={() => void navigate({ to: "/boundary" })}
    >
      {boundaryQ.isLoading ? (
        <Reading>Reading what your crew is allowed to do.</Reading>
      ) : boundaryQ.isError ? (
        <ReadFailedLine onRetry={() => void boundaryQ.refetch()}>
          The boundary did not load, so no count here would be the real one.
        </ReadFailedLine>
      ) : alone + asks + never === 0 ? (
        <NothingYet>
          No tools are switched on for this account yet, so there is nothing to allow or refuse.
        </NothingYet>
      ) : (
        <>
          <Line
            label="What they do alone"
            sub="No approval, no interruption. This is where the leverage is."
          >
            <Num>{alone}</Num>
          </Line>
          <Line
            label="What still comes to you"
            sub="Each of these costs one interruption every time it happens."
          >
            <Num>{asks}</Num>
          </Line>
          <Line
            label="What nobody may do"
            sub="Off for agents and for people. Turning one back on is a decision on the record."
          >
            <Num>{never}</Num>
          </Line>

          {/* THE ONE PLACE WHAT YOU SET AND WHAT RUNS DISAGREE, and it is said
              as its own row rather than footnoted under a control showing the
              wrong value. Named tools, not a bare count: "three do not do what
              you set" is only actionable if you know which three.

              NO TONE ON THE COUNT. This is a policy fact, not an outcome, and
              the number is not a status - the sentence carries the whole
              meaning and survives greyscale on its own. */}
          {demoted.length > 0 ? (
            <Line
              label="Set to come to you first, and they will not"
              sub={
                <>
                  {demoted
                    .slice(0, 4)
                    .map((t) => t.label)
                    .join(", ")}
                  {demoted.length > 4 ? ` and ${demoted.length - 4} more` : ""}
                  {
                    " never hold there: each one is reversible and stays inside this workspace, so a run executes it inline rather than stopping to ask. They are counted above as done alone, which is what happens. Switch one off on the boundary to actually stop it."
                  }
                </>
              }
            >
              <Num>{demoted.length}</Num>
            </Line>
          ) : null}
        </>
      )}
    </Region>
  );
}
