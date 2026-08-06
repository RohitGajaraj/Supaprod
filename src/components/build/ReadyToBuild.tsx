import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { listSpecs } from "@/lib/discovery.functions";
import {
  dispatchBuilderMission,
  listDispatchDesignGates,
  type DispatchDesignGate,
} from "@/lib/build.functions";
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
   *
   * `missionId` is here for the one outcome that has somewhere to go and is not
   * a success: the mission row exists, the agent never started, so the person is
   * told why AND handed the door, instead of being navigated onto a run page
   * with no run on it. Absent for every failure with no mission behind it.
   */
  const [failed, setFailed] = React.useState<{
    lead: string;
    sub: string;
    missionId?: string;
  } | null>(null);

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
   *
   * AN UNANSWERED GATE READ IS NOT AN OPEN GATE, and this list used to treat it
   * as one. On `isError` the map is empty and on the first render it is not
   * filled yet, so every row fell back to "Approved. Build opens the issue as it
   * starts." — a promise about a press that `dispatchBuilderMission` may be
   * about to refuse. `unresolved` is the same mistake in its quieter form: an id
   * the server's own `prds` select did not return is unknown, not unblocked. All
   * three now say what is known, and none of them takes the button away: the
   * dispatch enforces the gate itself and its refusal message is accurate.
   */
  const gates = useQuery({
    queryKey: ["build-design-gates", visibleIds],
    queryFn: () => fGates({ data: { prdIds: visibleIds } }),
    enabled: visibleIds.length > 0,
  });
  const blocked = new Map<string, DispatchDesignGate>(
    (gates.data?.blocked ?? []).map((g) => [g.id, g]),
  );
  const unresolved = new Set(gates.data?.unresolved ?? []);
  // `enabled` is true whenever a row renders (this component returns null on an
  // empty list), so `isLoading` is a real in-flight read here and never the
  // forever-pending state a disabled query holds under react-query v5.
  const gateUnread = gates.isError || gates.isLoading;

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
           * hit the "Need a GitHub issue" throw on every call. (That was cited
           * here as build.functions.ts:478; six commits have landed in it since
           * and the line now sits inside the PRD lookup, so the throw is named by
           * its message instead. A line number in a comment rots in days.)
           * Measured on the live database: 55 approved specs, ZERO with a
           * `github_issue_url`. Re-measured 2026-08-06: 42 approved specs and
           * exactly ONE with an issue url, the same spec that just became the
           * first with a compiled contract and an approved design gate. So the
           * first of the three sources now covers one row out of 42, and the
           * control this flag replaces was wrong on every press before that.
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
       * `dispatchBuilderMission` returns the agent result spread over
       * `mission_id`, `issue_number` and `issue_url` (build.functions.ts, which
       * has since added `run_error`, `run_started`, `issue_link_error` and
       * `roster_error` alongside them — this paragraph is about the name of the
       * first one, not a census of the shape). This read asked for `missionId`,
       * so it was `undefined` on every single dispatch and the navigate never
       * fired.
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
      /**
       * THE ISSUE WAS OPENED AND THE SPEC DOES NOT KNOW IT, WHICH IS THE ONE
       * SUCCESS WORTH STOPPING ON.
       *
       * `dispatchBuilderMission` writes the new issue's url back onto the spec
       * so a second press reuses it instead of opening another. That write is a
       * `prds` update, and `prds` UPDATE is row-level-security'd to the spec's
       * AUTHOR while READ is open to the whole workspace — so a teammate
       * building a colleague's approved spec can have it refused. The server
       * used to drop that on the floor; it now reports it here.
       *
       * The build itself is fine, so the door still opens the mission — but the
       * navigation is withheld, because the one thing the person must not do is
       * press "Build this" again, and a run page cannot tell them that.
       */
      const linkError = r?.issue_link_error ?? null;
      /** Appended wherever a failure sentence is already being written, so the
       *  hazard is named there too rather than only on the success path. */
      const linkNote = linkError
        ? ` The spec was also not linked to the issue (${linkError}), so pressing again would open a second one.`
        : "";
      /**
       * THE ROSTER REASON HAS TO RIDE THE `run_error` SENTENCE, BECAUSE THAT IS
       * THE BRANCH A FAILED ROSTER READ ACTUALLY LANDS ON.
       *
       * `runAgentLoop` repeats the dispatch's roster read with the same client
       * and the same filters (`agents`, `user_id` + `slug`, `maybeSingle`) and
       * throws `Unknown agent: builder` when it comes back empty — and a read
       * that was REFUSED comes back empty. So an RLS refusal or a transport
       * failure sets `roster_error` AND `run_error`, and the `roster_error`
       * branch further down is reachable only in the narrow window where this
       * dispatch's read failed and the loop's identical read then succeeded.
       * Without this note the reason the server went to the trouble of capturing
       * printed nowhere in the ordinary case. Appended rather than promoted
       * ahead of `run_error`: the panel cannot know that the loop's failure was
       * caused by the same refusal, only that both happened. Same shape as
       * `linkNote` above, for the same reason.
       */
      const rosterNote = r?.roster_error
        ? ` Your agent roster could not be read on the way in (${r.roster_error}), which on its own is enough to stop a mission being created for this dispatch.`
        : "";
      /**
       * NAVIGATE ONLY WHERE THE REASON SURVIVES THE NAVIGATION.
       *
       * This read `if (missionId)` and returned, so a `run_error` the server had
       * gone to the trouble of reporting was shown nowhere at all. For a failure
       * inside `runAgentLoop` that cost little, because the run page it landed on
       * carried the failure in full. It was wrong for the window the server
       * explicitly opened: a mission created and no run ever started on it, which
       * `recordLineage` throwing a transport error reaches. There the run page
       * has no run on it, so navigating showed an empty page, no message, and a
       * build that genuinely did not start.
       *
       * `run_started` IS THE LOOP'S OWN ANSWER — whether `runAgentLoop` came back
       * holding an `agent_runs` id — so this branch asks a question the server
       * already answered rather than inferring it from the presence of an error
       * string. It was the server's `loopEntered`, which was assigned BEFORE the
       * loop was awaited and so was true of every throw that never reaches the
       * run insert — an unknown agent, a disabled one, the insert itself being
       * refused; this navigate fired on all of them, onto a page with no run.
       *
       * It is false on every failure path, including a failure that landed after
       * a run did exist. That case loses nothing: the notice below states the
       * reason and its door opens the mission, so the run page is one click away
       * instead of being the only place the story lives.
       */
      if (missionId && r?.run_started && !linkError) {
        void navigate({ to: "/runs/$missionId", params: { missionId } });
        return;
      }
      if (missionId && r?.run_started && linkError) {
        setFailed({
          lead: "The build started, but the spec was not linked to its GitHub issue",
          sub: `Issue #${r?.issue_number} is open and the builder is running against it, so this dispatch worked. What did not: writing that issue back onto the spec. ${linkError} Pressing "Build this" again would open a SECOND issue and start a second billed run, so use the door on this notice instead.`,
          missionId,
        });
        return;
      }
      /**
       * WHAT THIS SENTENCE MAY CLAIM, given `run_started` is false here.
       *
       * False means the dispatch got no run id back, and that covers three states
       * it cannot tell apart: no run was ever created, a run was created and the
       * loop then threw with the answer inside it, and a loop that returned
       * normally holding no run id. So the copy states the fact that holds in all
       * three — no run id came back — and points at the mission, rather than
       * asserting that nothing is building, which would be this repo's signature
       * defect written into UI copy.
       */
      if (missionId) {
        setFailed({
          lead: "The build stopped without a run to open",
          sub: `${r?.run_error ?? "No reason was reported."} The GitHub issue is open at #${r?.issue_number} and the mission was created, but this dispatch got no run id back for it, so open the mission to see what landed on it.${linkNote}`,
          missionId,
        });
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
       *
       * "CHECK THAT A BUILDER AGENT EXISTS IN YOUR ROSTER" WAS AN INSTRUCTION
       * BUILT ON A DISCARDED READ. The server resolved the builder agent with a
       * `maybeSingle()` whose `error` it threw away, so a transport failure or an
       * RLS refusal produced the same `null` as a genuinely empty roster and this
       * line sent the person to fix something that may be perfectly fine. The
       * server now separates the two and `roster_error` carries the read's own
       * words; the confident sentence is kept for the case it is true of.
       *
       * THE THIRD BRANCH IS NOT WHERE A FAILED ROSTER READ USUALLY ARRIVES, and
       * that is why `rosterNote` exists. `runAgentLoop` re-runs the same read and
       * throws `Unknown agent: builder` on an empty result, so a refusal almost
       * always sets `run_error` too and the first branch wins. This branch is
       * left standing for the window it is true of — this dispatch's read failed
       * and the loop's identical read succeeded — and the note carries the reason
       * into the branch that actually renders.
       */
      setFailed({
        lead: r?.run_error ? "The build started and then stopped" : "The build has no run to open",
        sub: r?.run_error
          ? `${r.run_error} The GitHub issue is open at #${r.issue_number} and the work is not finished; nothing here can open the run, because no mission was created for it.${rosterNote}${linkNote}`
          : r?.roster_error
            ? `The GitHub issue is open at #${r.issue_number}, but your agent roster could not be read, so no mission was created and nothing here can tell you whether a builder agent exists. The read failed with: ${r.roster_error}${linkNote}`
            : `The GitHub issue is open at #${r.issue_number}, but no mission was created for it, so there is no run to open. Check that a builder agent exists in your roster.${linkNote}`,
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

  // Hoisted out of the JSX so the door below needs no cast: narrowing a
  // PROPERTY does not survive into a callback, narrowing a const local does,
  // and this file's own comment about `as { missionId?: string }` is the reason
  // not to reach for the assertion instead.
  const failedMissionId = failed && failed.missionId ? failed.missionId : null;

  return (
    <Block
      title="Approved and waiting to be built"
      sub="Plan has finished with these. Starting one here opens its run."
    >
      {failed ? (
        <Row
          lead={failed.lead}
          sub={failed.sub}
          /* The mission is real even though its run is not, so the record of
             the attempt is reachable rather than only described. */
          action={
            failedMissionId ? (
              <Door
                title="Open the mission this dispatch created"
                onClick={() =>
                  void navigate({
                    to: "/runs/$missionId",
                    params: { missionId: failedMissionId },
                  })
                }
              >
                Open the mission
              </Door>
            ) : undefined
          }
        />
      ) : null}
      {visible.map((row) => {
        /**
         * "APPROVED" WAS A CLAIM ABOUT THE WRONG GATE.
         *
         * This list filters on `prds.status === 'approved'` — the SPEC approval —
         * and said "Approved. Build opens the issue as it starts." while
         * `dispatchBuilderMission` was going to refuse the press outright because
         * the spec's DESIGN gate had a drawing waiting on a human. Re-measured
         * 2026-08-06: two of the 42 approved specs are in exactly that state, and
         * exactly one spec now has an approved design gate — the first, so this
         * paragraph's earlier "not one" was true when written and is not now. The
         * sub-line promised the opposite of what the button did, with no way to
         * tell beforehand and no link to the page where the call is actually
         * made.
         *
         * The row is not dropped and the person is not left holding a control
         * that cannot work: the sub-line says which gate is holding it and the
         * action becomes the door to the gate.
         *
         * WHICH SENTENCE, THOUGH — THE FIRST VERSION OF THIS ROW HAD ONE FOR
         * THREE DIFFERENT STATES. It said "a mockup is drawn and nobody has
         * approved or rejected it" for every blocked row, and the gate blocks on
         * `status !== "approved"`: a REJECTED design is blocked, and so is a spec
         * whose drawing count could not be read (the gate stays shut on unknown,
         * design-gate.server.ts:34). For those two the row asserted the opposite
         * of the truth — this repo's signature defect, written inside the fix for
         * it. Re-measured 2026-08-06, the honest branch is unexercised: of 81
         * specs not one carries `design_gate_status = 'rejected'`, and the two
         * approved specs the gate does block are both drawn-and-pending (21 of 21
         * workspaces have the design stage on). Latent, not broken, and worth
         * stating anyway,
         * because `decideDesignGate` writes 'rejected' the first time a person
         * uses the button the door below points at.
         */
        const gate = blocked.get(row.id) ?? null;
        const gated = gate !== null;
        // Only meaningful when the row is NOT blocked: a row we know is blocked
        // is blocked whatever else went unread.
        const unread = !gated && (gateUnread || unresolved.has(row.id));
        return (
          <Row
            key={row.id}
            lead={row.title}
            sub={
              gate
                ? gate.status === "rejected"
                  ? "Waiting on the design gate: this spec's design was rejected and nothing approved has replaced it, so a build started here would be refused."
                  : !gate.drawingConfirmed
                    ? "Waiting on the design gate: whether a mockup exists could not be read, and the gate stays shut while that is unknown, so a build started here would be refused."
                    : "Waiting on the design gate: a mockup is drawn and nobody has approved it yet, so a build started here would be refused."
                : unread
                  ? "Approved. The design gate has not been read for this spec yet, so a build started here may still be refused."
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
                /**
                 * THE DOOR OPENS THE SPEC IT NAMES, WHICH `/design?focus=` COULD
                 * NOT PROMISE. That route resolves `focus` against the list
                 * `listDesignWork` returns, which is scoped to
                 * `current_user_default_workspace` and capped at WORK_LIMIT; a
                 * spec outside either falls back to `items[0]`
                 * (_authenticated.design.tsx:381) and the person judges a
                 * DIFFERENT spec's drawing believing it is this one. This list is
                 * fed by `listSpecs`, which is not workspace-scoped at all, so the
                 * two disagree by construction. `/plan/spec/$id?tab=flow` takes
                 * the id in the path, cannot fall back to anything, and mounts
                 * `DesignScaffoldPanel` — the same approve / request-changes pair
                 * that writes the gate — which is also where
                 * DESIGN_GATE_BLOCK_MESSAGE has always sent people ("the spec
                 * page"). The design station keeps its own handoff; it just is not
                 * the one a named row can rely on.
                 */
                <Door
                  title="Open this spec's design gate on its spec page"
                  onClick={() =>
                    void navigate({
                      to: "/plan/spec/$id",
                      params: { id: row.id },
                      search: { tab: "flow" },
                    })
                  }
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
