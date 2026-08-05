import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { listSpecs } from "@/lib/discovery.functions";
import { dispatchBuilderMission } from "@/lib/build.functions";
import { Block, Button, Row } from "@/components/shell/primitives";

/**
 * BUILD COULD NOT START A BUILD.
 *
 * THE FOUNDER'S OWN TEST, in his words: "Entire purpose of Build, is it done
 * there? Whatever the user wants to, WITHOUT switching the tools or switching
 * into different surfaces." The answer was no, and the station said so itself:
 * its context panel read "Hand work over on Runs, and it arrives here as the
 * crew writes it." A station whose job is building that tells you to go
 * elsewhere to begin one.
 *
 * AND THE FUNCTION WAS ALREADY WRITTEN. `dispatchBuilderMission` takes a goal,
 * a prd id, reference links and a mission title, resolves the spec context and
 * starts the run. It was defined once in `build.functions.ts` and called
 * NOWHERE. The fourth capability found in this session that was complete and
 * never connected -- after the moat's own recommendation, the spec approval,
 * and the landing frame.
 *
 * WHAT IT OFFERS, AND WHY THAT LIST. An approved spec with nothing building it
 * is precisely the work this station exists to pick up: Plan has finished with
 * it, Design has had its say, and the next real act is code. A draft is not
 * offered, because building an unapproved spec is the thing the approval gate
 * exists to prevent.
 *
 * IT DOES NOT DUPLICATE PLAN'S "SEND TO BUILD". Two doors onto one act is right
 * here for the same reason it is right on Ship: the spec surface is where you
 * are when you finish writing, and this station is where you are when you are
 * thinking about what to build next. Neither is a detour from the other.
 */
export function ReadyToBuild() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fSpecs = useServerFn(listSpecs);
  const fDispatch = useServerFn(dispatchBuilderMission);
  const [failed, setFailed] = React.useState<string | null>(null);

  const specs = useQuery({
    queryKey: ["specs"],
    queryFn: () => fSpecs(),
    staleTime: 60_000,
  });

  const start = useMutation({
    mutationFn: (v: { id: string; title: string }) =>
      fDispatch({
        data: {
          // The spec IS the goal. Re-summarising it here would hand the builder
          // a paraphrase of the document it is about to be given, and the two
          // could disagree.
          goal: `Build the approved spec: ${v.title}`,
          prdId: v.id,
          missionTitle: v.title,
        },
      }),
    onSuccess: (r) => {
      setFailed(null);
      void qc.invalidateQueries({ queryKey: ["build-work"] });
      const missionId = (r as { missionId?: string } | null)?.missionId;
      if (missionId) void navigate({ to: "/runs/$missionId", params: { missionId } });
    },
    // NAMED, NOT SWALLOWED. A dispatch that did not happen must never wear the
    // shape of one that did: the row stays, and the reason is on screen.
    onError: (e: Error) => setFailed(e.message),
  });

  if (specs.isLoading || specs.isError) return null;

  const ready = (specs.data?.prds ?? []).filter(
    (p) => (p as { status?: string }).status === "approved",
  );
  if (ready.length === 0) return null;

  return (
    <Block
      title="Approved and waiting to be built"
      sub="Plan has finished with these. Starting one here opens its run."
    >
      {failed ? (
        <Row
          lead="The build did not start"
          sub={`${failed} Nothing was dispatched, so the spec is still waiting.`}
        />
      ) : null}
      {ready.slice(0, 6).map((p) => {
        const row = p as { id: string; title: string; github_issue_url?: string | null };
        return (
          <Row
            key={row.id}
            lead={row.title}
            sub={
              row.github_issue_url
                ? "Approved, with a GitHub issue already open."
                : "Approved. Build opens the issue as it starts."
            }
            action={
              <Button
                variant="primary"
                disabled={start.isPending}
                onClick={() => start.mutate({ id: row.id, title: row.title })}
              >
                {start.isPending ? "Starting" : "Build this"}
              </Button>
            }
          />
        );
      })}
    </Block>
  );
}
