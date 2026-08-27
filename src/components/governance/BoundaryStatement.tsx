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

import { useWorkspace } from "@/hooks/use-workspace";
import { getBoundary } from "@/lib/governance.functions";

/**
 * THIS COMPONENT RESTATES NO TOOL RULE AT ALL ANY MORE, WHICH IS THE POINT.
 *
 * It used to carry `runsAloneDespiteAsking`, a client-side copy of one branch
 * of `resolveToolMode`: a low-risk `confirm` tool with no floor is cleared
 * inline. That branch is real and the restatement was honest, and it was also
 * a small fraction of the gap it existed to close. The arc dial is the big
 * door -- `resolveApprovalMode` turns EVERY `confirm` tool into `auto` on a
 * trusted arc -- so a component quoting one branch reported 52 of 74 where the
 * loop runs 68.
 *
 * `getBoundary` now calls the real resolver and buckets on `runsAs`, so the
 * counts below are the loop's own answer and the only thing left to say here
 * is WHERE the set value and the running one disagree. One server rule, zero
 * client restatements, and no way for the two to drift.
 */

export function BoundaryStatement({
  /**
   * ONE DEAD READ SHOULD SAY SO ONCE.
   *
   * This component and BoundaryControls make the IDENTICAL read under the
   * IDENTICAL key -- deliberately, so the two can never disagree about a count.
   * The cost of that is that they also fail together, and each was announcing
   * it separately. Rendered on the Safety room with the backend unreachable,
   * one failed boundary read produced three statements in a column: this
   * line, then "The boundary could not be read." as a large heading, then the
   * reason underneath it.
   *
   * When the controls are directly below, they own the failure: theirs is the
   * fuller one and it names what the reader can do about it. This becomes the
   * count it always was, and says nothing when there is no count to give.
   *
   * Same shape as `pauseShownElsewhere` on BoundaryControls: the component that
   * can see BOTH decides which one speaks, and neither has to know about the
   * other's internals.
   */
  failureShownElsewhere = false,
}: { failureShownElsewhere?: boolean } = {}) {
  const { activeWorkspaceId } = useWorkspace();
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
  /* Bucketed by the server on `runsAs`, so nothing is renumbered here. What is
     left is the disclosure: which of the tools running alone were SET to ask. */
  const demoted = (bd?.alone ?? []).filter((t) => t.mode !== "auto");
  const alone = bd?.alone.length ?? 0;
  const asks = bd?.asks.length ?? 0;
  const never = bd?.never.length ?? 0;

  return (
    <Region
      title="What your crew may do alone"
      sub="Set once, in advance. Moving one never interrupts work that is already running."
    >
      {boundaryQ.isLoading ? (
        <Reading>Reading what your crew is allowed to do.</Reading>
      ) : boundaryQ.isError ? (
        failureShownElsewhere ? null : (
          <ReadFailedLine error={boundaryQ.error} onRetry={() => void boundaryQ.refetch()}>
            The boundary did not load, so no count here would be the real one.
          </ReadFailedLine>
        )
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
                    " never hold there. Your agents have earned enough trust that the loop clears them and runs them inline rather than stopping to ask. They are counted above as done alone, which is what happens. Switch one off on the boundary to actually stop it."
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
