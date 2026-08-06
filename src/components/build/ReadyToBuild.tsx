import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { listSpecs } from "@/lib/discovery.functions";
import { dispatchBuilderMission, listDispatchDesignGates } from "@/lib/build.functions";
import { Block, Button, Door, Row } from "@/components/shell/primitives";

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
  const fGates = useServerFn(listDispatchDesignGates);
  /**
   * THE WHOLE SENTENCE, NOT A FRAGMENT WITH A FIXED TAIL.
   *
   * This held the error message alone and the row appended "Nothing was
   * dispatched, so the spec is still waiting." to it unconditionally. That tail
   * is true of a failure before the mission exists and false of one after it,
   * and the dispatch reaches both. Holding lead and sub together is what lets
   * each outcome say its own true sentence.
   */
  const [failed, setFailed] = React.useState<{ lead: string; sub: string } | null>(null);

  const specs = useQuery({
    queryKey: ["specs"],
    queryFn: () => fSpecs(),
    staleTime: 60_000,
  });

  const ready = (specs.data?.prds ?? []).filter(
    (p) => (p as { status?: string }).status === "approved",
  ) as Array<{ id: string; title: string; github_issue_url?: string | null }>;
  const visible = ready.slice(0, 6);
  const visibleIds = visible.map((p) => p.id);

  /**
   * WHICH OF THESE ROWS WOULD THE DISPATCH REFUSE.
   *
   * `listSpecs` already returns `design_gate_status`, and deciding from that
   * alone would be wrong in the worst direction: the blocking rule also needs
   * the workspace's design-stage switch and whether a drawing EXISTS at all,
   * and a spec nobody ever drew must not be gated. Reading it here from the
   * server fn that reuses the dispatch's own predicate keeps one rule in one
   * place. No `staleTime`: a gate approved in another tab should stop blocking
   * this list the next time it mounts.
   */
  const gates = useQuery({
    queryKey: ["build-design-gates", visibleIds],
    queryFn: () => fGates({ data: { prdIds: visibleIds } }),
    enabled: visibleIds.length > 0,
  });
  const blocked = new Set(gates.data?.blocked ?? []);

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
          /**
           * WITHOUT THIS, EVERY PRESS THREW. `dispatchBuilderMission` needs an
           * issue from one of three sources -- a linked PRD that already has
           * one, an issue number typed in, or this flag -- and got none, so it
           * hit the throw at build.functions.ts:478 on every call. Measured on
           * the live database: 55 approved specs, ZERO with a
           * `github_issue_url`. The control was wrong 100% of the time from the
           * moment it shipped.
           *
           * And the row already promised this: "Approved. Build opens the issue
           * as it starts." The copy described the behaviour the flag turns on
           * while the flag was absent, which is the same defect as a keycap
           * that does nothing -- a sentence describing an act the code declines
           * to perform.
           */
          autoCreateIssue: true,
        },
      }),
    onSuccess: (r) => {
      setFailed(null);
      void qc.invalidateQueries({ queryKey: ["build-work"] });
      /**
       * `mission_id`, NOT `missionId`, AND A CAST IS WHY IT TOOK AN AUDIT.
       *
       * `dispatchBuilderMission` returns `{ ...result, mission_id, issue_number,
       * issue_url }` (build.functions.ts). This read asked for `missionId`, so it
       * was `undefined` on every single dispatch and the navigate never fired.
       *
       * The dispatch holds the request open for the whole inline agent loop, so
       * the visible behaviour was: press "Build this", wait out a full builder
       * run, and land back on the same row with no toast, no route change and
       * the status still reading "Approved. Build opens the issue as it starts."
       * The natural response is to press it again, which starts a SECOND builder
       * mission against the same reused `github_issue_url` -- two agents on one
       * issue, and the founder pays for both.
       *
       * `as { missionId?: string }` is the whole reason this typechecked. A cast
       * does not verify the shape, it ASSERTS it, so naming a field the server
       * never sends silences the one tool that would have caught this instantly.
       * Reading the field off the value directly keeps tsc in the loop: rename it
       * server-side and this line goes red.
       */
      const missionId = r?.mission_id;
      if (missionId) {
        void navigate({ to: "/runs/$missionId", params: { missionId } });
        return;
      }
      /**
       * A RESOLVED DISPATCH WITH NO MISSION IS NOT A SILENT SUCCESS.
       *
       * `dispatchBuilderMission` creates the mission only when it resolved both
       * a workspace and a `builder` agent in this user's roster; without one it
       * still runs the agent loop and returns with `mission_id` null. This used
       * to fall off the end of the handler: no navigation, no message, and a row
       * still reading "Approved. Build opens the issue as it starts." after a
       * full builder run had been billed. The `run_error` half is the loop
       * failing AFTER the work was already durably written, which the server now
       * reports rather than throwing — see its comment above `runAgentLoop`.
       */
      setFailed({
        lead: r?.run_error ? "The build started and then stopped" : "The build has no run to open",
        sub: r?.run_error
          ? `${r.run_error} The GitHub issue is open at #${r.issue_number} and the work is not finished; nothing here can open the run, because no mission was created for it.`
          : `The GitHub issue is open at #${r.issue_number}, but no mission was created for it, so there is no run to open. Check that a builder agent exists in your roster.`,
      });
    },
    /**
     * NAMED, NOT SWALLOWED. A dispatch that did not happen must never wear the
     * shape of one that did: the row stays, and the reason is on screen.
     *
     * The tail is stated HERE rather than in the row because only here is it
     * true. `dispatchBuilderMission` now throws only when no mission was created
     * and the agent loop was never entered; every failure after that point comes
     * back through `onSuccess` carrying `run_error`, because a run that opened an
     * issue and started an agent has not left "the spec still waiting" and
     * saying so invited a second press and a second billed mission.
     */
    onError: (e: Error) =>
      setFailed({
        lead: "The build did not start",
        sub: `${e.message} Nothing was dispatched, so the spec is still waiting.`,
      }),
  });

  if (specs.isLoading || specs.isError) return null;
  if (ready.length === 0) return null;

  return (
    <Block
      title="Approved and waiting to be built"
      sub="Plan has finished with these. Starting one here opens its run."
    >
      {failed ? <Row lead={failed.lead} sub={failed.sub} /> : null}
      {visible.map((row) => {
        /**
         * "APPROVED" WAS A CLAIM ABOUT THE WRONG GATE.
         *
         * This list filters on `prds.status === 'approved'` — the SPEC approval —
         * and said "Approved. Build opens the issue as it starts." while
         * `dispatchBuilderMission` was going to refuse the press outright because
         * the spec's DESIGN gate had a drawing waiting on a human. Two of the 41
         * approved specs are in exactly that state today and not one has an
         * approved design gate, so the sub-line promised the opposite of what the
         * button did, with no way to tell beforehand and no link to the page
         * where the call is actually made.
         *
         * The row is not dropped and the person is not left holding a control
         * that cannot work: the sub-line says which gate is holding it and the
         * action becomes the door to the gate.
         */
        const gated = blocked.has(row.id);
        return (
          <Row
            key={row.id}
            lead={row.title}
            sub={
              gated
                ? "Waiting on the design gate: a mockup is drawn and nobody has approved or rejected it, so a build started here would be refused."
                : row.github_issue_url
                  ? "Approved, with a GitHub issue already open."
                  : "Approved. Build opens the issue as it starts."
            }
            /* PER ROW, not per mutation. One shared `isPending` drove all six
               buttons, so starting ONE build reported that six were starting
               and disabled five specs the person had not touched.
               `start.variables` is the row the mutation is actually running
               for; fifteen sibling files already use this shape. */
            action={
              gated ? (
                <Door
                  title="Open this spec's drawing at the design gate"
                  onClick={() => void navigate({ to: "/design", search: { focus: row.id } })}
                >
                  Judge the design
                </Door>
              ) : (
                <Button
                  variant="primary"
                  disabled={start.isPending}
                  onClick={() => start.mutate({ id: row.id, title: row.title })}
                >
                  {start.isPending && start.variables?.id === row.id ? "Starting" : "Build this"}
                </Button>
              )
            }
          />
        );
      })}
    </Block>
  );
}
