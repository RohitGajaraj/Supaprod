import * as React from "react";
import { Row } from "@/components/meridian/rows";
import { Action, Num, Door, ReadFailedLine, Region } from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";

import { listSpecs } from "@/lib/discovery.functions";
import {
  dispatchBuilderMission,
  listDispatchDesignGates,
  listSpecDispatches,
  type DispatchDesignGate,
  type SpecDispatch,
} from "@/lib/build.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch } from "@/lib/build/repo-gate";
import { isDispatchRefusal, dispatchRefusalReason } from "@/lib/build/dispatch-refusal";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import { ago } from "@/components/runs/run-state";
import { failureLine } from "@/lib/error-copy";

/**
 * A ROUTER LINK INSIDE A SENTENCE, painted the way Meridian paints a door.
 *
 * It cannot BE `Door`: that primitive renders either a `<button>` or an
 * `<a href>` for an outbound address, and a TanStack `<Link>` renders its own
 * anchor with client navigation attached. So the paint is written out here and
 * the element stays the router's.
 *
 * It keeps `--mrd-ink` rather than stepping down to Door's `--mrd-body`,
 * because the floor rule holds: this link was full ink before the port and a
 * port may not make a surface quieter. The dotted underline is added, which is
 * the half it was missing -- a coloured word inside muted prose is not an
 * affordance a person can see from across the room.
 */
const LINK =
  "rounded-mrd-xs text-mrd-ink underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:decoration-mrd-edge hover:decoration-solid";

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
 * "WITH NOTHING BUILDING IT" WAS A CLAIM THIS LIST COULD NOT MAKE UNTIL
 * 2026-08-06. Nothing in the dispatch moves `prds.status` (only the ship stamp
 * does), so a spec dispatched an hour ago, or halted three days ago, was still
 * 'approved' and still carried a live primary button. `listSpecDispatches`
 * reads the `prd -> mission` lineage edge the dispatch already writes, so a row
 * that has a run says so and leads with the door to it; starting a second one
 * is still possible, and now says what it costs before you press it.
 *
 * IT DOES NOT DUPLICATE PLAN'S "SEND TO BUILD". Two doors onto one act is right
 * here for the same reason it is right on Ship: the spec surface is where you
 * are when you finish writing, and this station is where you are when you are
 * thinking about what to build next. Neither is a detour from the other.
 */

/**
 * How many approved specs the list offers without being asked.
 *
 * NEVER A SILENT CAP. This was a bare `.slice(0, 6)` under a sub-line reading
 * "Plan has finished with these", where "these" was the six most recently
 * touched of 42 and the other 36 could not be started from this station at all.
 * The same route refuses that exact shape one block down ("If the window
 * dropped rows, the surface says so rather than presenting a subset as the
 * whole record"), so this one does too: the remainder is stated, and the window
 * opens to the 24 ids `listDispatchDesignGates` and `listSpecDispatches` accept
 * in one call.
 */
const WINDOW = 6;
/** The ceiling both side reads accept in one request. Raising it means raising
 *  their `.max(24)` validators too, so the number lives next to the reason. */
const WINDOW_MAX = 24;

/** The shape this list needs off `listSpecs`, which selects all of it. */
type ReadySpec = {
  id: string;
  title: string;
  github_issue_url?: string | null;
  /**
   * Nullable and optional, and read for TRUTH rather than for `!== false`.
   * `prds.is_sample` is NOT NULL DEFAULT false in the database, but this row
   * arrives through a `select` whose column list can be older than the page
   * (and through a cast, which asserts rather than verifies), so an absent
   * value must mean "not known to be a sample" rather than "is one". Same rule
   * /decide states for `Workspace.is_sample`.
   */
  is_sample?: boolean | null;
};

export function ReadyToBuild() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fSpecs = useServerFn(listSpecs);
  const fDispatch = useServerFn(dispatchBuilderMission);
  const fGates = useServerFn(listDispatchDesignGates);
  const fDispatched = useServerFn(listSpecDispatches);
  const fCanDispatch = useServerFn(canDispatchToRepo);
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

  /** The connect-a-repo gate, and the reason the resolver gave for opening it. */
  const [repoGate, setRepoGate] = React.useState<{ prdId: string; reason: string | null } | null>(
    null,
  );
  /** The row whose repo pre-check is in flight, so its button says so instead
   *  of looking dead for the length of a network round trip. */
  const [checking, setChecking] = React.useState<string | null>(null);
  /** Opened past the default window by a person who asked to see the rest. */
  const [showAll, setShowAll] = React.useState(false);

  const specs = useQuery({
    queryKey: ["specs"],
    queryFn: () => fSpecs(),
    staleTime: 60_000,
  });

  const ready = (specs.data?.prds ?? []).filter(
    (p) => (p as { status?: string }).status === "approved",
  ) as Array<ReadySpec>;
  const visible = ready.slice(0, showAll ? WINDOW_MAX : WINDOW);
  const visibleIds = visible.map((p) => p.id);
  /** Approved specs this station is not offering. Stated, never swallowed. */
  const beyond = Math.max(0, ready.length - visible.length);

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
   * starts.", a promise about a press that `dispatchBuilderMission` may be
   * about to refuse. `unresolved` is the same mistake in its quieter form: an id
   * the server's own `prds` select did not return is unknown, not unblocked. All
   * three now say what is known, and none of them takes the button away: the
   * dispatch enforces the gate itself and its refusal message is accurate.
   *
   * THE GATE IS NOT A STATION THAT IS OWED. A spec whose design gate never
   * opened because nobody ever drew anything is NOT blocked here, and that is
   * the founder's non-linear ruling working as intended: `design_gate_status`
   * is NOT NULL DEFAULT 'pending', so 'pending' alone is not evidence design is
   * owed. `loadDesignGateState` is what separates "a drawing is waiting on a
   * human" from "there is no drawing and none is required", and it is why this
   * list asks the server rather than reading the column.
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

  /**
   * WHICH OF THESE ROWS ALREADY HAS A BUILD BEHIND IT.
   *
   * Same window and same lifetime as the gate read above, and read for the same
   * reason: the alternative is a primary button that mints a second mission and
   * a second billed run against work that is already under way, with nothing on
   * screen saying so.
   *
   * A FAILED READ MUST NOT READ AS "NEVER DISPATCHED". `listSpecDispatches`
   * reports its own failure rather than returning an empty list, and every row
   * below says "we could not check" instead of promising a clean first build.
   *
   * IN FLIGHT IS NOT FAILED, and the two get different sentences. A read still
   * on the wire is the first frame of every visit, and telling everyone we
   * could not check would make the honest failure sentence unreadable by making
   * it the ordinary one. Neither state takes the button away: the dispatch is
   * legal in both, it just may be a second one.
   */
  const dispatched = useQuery({
    queryKey: ["build-spec-dispatches", visibleIds],
    queryFn: () => fDispatched({ data: { prdIds: visibleIds } }),
    enabled: visibleIds.length > 0,
  });
  /** Most recent first, because the server ordered them that way and the newest
   *  run is the one a person means by "the run". */
  const runsBySpec = new Map<string, SpecDispatch[]>();
  for (const d of dispatched.data?.dispatches ?? []) {
    const list = runsBySpec.get(d.prdId);
    if (list) list.push(d);
    else runsBySpec.set(d.prdId, [d]);
  }
  const dispatchReading = dispatched.isLoading;
  const dispatchUnread = dispatched.isError || dispatched.data?.unread != null;

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
      // The row this press came from now HAS a run, and the list above decides
      // what to offer from exactly that fact. Without this the button it was
      // pressed on stays "Build this" until the next mount.
      void qc.invalidateQueries({ queryKey: ["build-spec-dispatches"] });
      /**
       * `mission_id`, NOT `missionId`, AND A CAST IS WHY IT TOOK AN AUDIT.
       *
       * `dispatchBuilderMission` returns the dispatch's answer spread over
       * `mission_id`, `run_id`, `issue_number` and `issue_url` alongside
       * `run_error`, `run_started`, `issue_link_error` and `roster_error`. This
       * read asked for `missionId`, so it was `undefined` on every single
       * dispatch and the navigate never fired.
       *
       * The dispatch used to hold the request open for the whole inline agent
       * loop, so the visible behaviour was: press "Build this", wait out a full
       * builder run, and land back on the same row with no toast, no route
       * change and the status still reading "Approved. Build opens the issue as
       * it starts." The natural response is to press it again, which starts a
       * SECOND builder mission against the same reused `github_issue_url` --
       * two agents on one issue, and the founder pays for both. (The dispatch
       * has since stopped holding the request open: it queues the run and the
       * resume sweeper promotes it. The naming defect this paragraph is about
       * was independent of that, and both are fixed.)
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
       * AUTHOR while READ is open to the whole workspace, so a teammate
       * building a colleague's approved spec can have it refused. The server
       * used to drop that on the floor; it now reports it here.
       *
       * The build itself is fine, so the door still opens the mission, but the
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
       * A refused `agents` read leaves the dispatch with no builder agent, so it
       * creates no mission and returns `run_error` naming the roster failure as
       * the cause. `roster_error` carries the read's own words alongside it.
       * Without this note the reason the server went to the trouble of
       * capturing printed nowhere in the ordinary case. Appended rather than
       * promoted ahead of `run_error`: the two sentences are about the same
       * refusal from two distances, and the panel prints both rather than
       * choosing.
       */
      const rosterNote = r?.roster_error
        ? ` Your agent roster could not be read on the way in (${r.roster_error}), which on its own is enough to stop a mission being created for this dispatch.`
        : "";
      /**
       * NAVIGATE ONLY WHERE THE REASON SURVIVES THE NAVIGATION.
       *
       * This read `if (missionId)` and returned, so a `run_error` the server had
       * gone to the trouble of reporting was shown nowhere at all. It was wrong
       * for the window the server explicitly opens: a mission created and no run
       * ever started on it, where the run page is an empty page.
       *
       * `run_started` IS THE SERVER'S OWN ANSWER: whether the build seam came
       * back holding the `agent_runs` row it queued. So this branch asks a
       * question the server already answered rather than inferring it from the
       * presence of an error string. Since the dispatch stopped running the
       * build inline, true here means "a queued run exists and the sweeper will
       * promote it within the minute", which is what makes navigating right:
       * the run page has a real run on it from the first frame, and watching it
       * start is the thing this station exists for.
       *
       * It is false on every failure path. That case loses nothing: the notice
       * below states the reason and its door opens the mission, so the run page
       * is one click away instead of being the only place the story lives.
       */
      if (missionId && r?.run_started && !linkError) {
        void navigate({ to: "/runs/$missionId", params: { missionId } });
        return;
      }
      if (missionId && r?.run_started && linkError) {
        setFailed({
          lead: "The build started, but the spec was not linked to its GitHub issue",
          sub: `Issue #${r?.issue_number} is open and the builder is queued against it, so this dispatch worked. What did not: writing that issue back onto the spec. ${linkError} Pressing "Build this" again would open a SECOND issue and start a second billed run, so use the door on this notice instead.`,
          missionId,
        });
        return;
      }
      /**
       * WHAT THIS SENTENCE MAY CLAIM, given `run_started` is false here.
       *
       * False means the dispatch got no run id back, and that covers two states
       * it cannot tell apart: no run row was ever inserted, and one that was
       * inserted and came back without an id. So the copy states the fact that
       * holds in both (no run id came back) and points at the mission, rather
       * than asserting that nothing is building, which would be this repo's
       * signature defect written into UI copy.
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
       * returns with `mission_id` null. This used to fall off the end of the
       * handler: no navigation, no message, and a row still reading "Approved.
       * Build opens the issue as it starts." after a full builder run had been
       * billed.
       *
       * "CHECK THAT A BUILDER AGENT EXISTS IN YOUR ROSTER" WAS AN INSTRUCTION
       * BUILT ON A DISCARDED READ. The server resolved the builder agent with a
       * `maybeSingle()` whose `error` it threw away, so a transport failure or an
       * RLS refusal produced the same `null` as a genuinely empty roster and this
       * line sent the person to fix something that may be perfectly fine. The
       * server now separates the two and `roster_error` carries the read's own
       * words; the confident sentence is kept for the case it is true of.
       *
       * THE SEAM CAN ALSO LEAVE A MISSION THIS BRANCH CANNOT NAME. If the run
       * insert is refused after the mission row is written, the mission id goes
       * with the throw and arrives here as null with a `run_error`. So the
       * `run_error` sentence says a mission MAY have been created rather than
       * that none was, and sends the reader to Runs where it would appear.
       */
      setFailed({
        lead: r?.run_error ? "The build did not get a run" : "The build has no run to open",
        sub: r?.run_error
          ? `${r.run_error} The GitHub issue is open at #${r.issue_number}. A mission may still have been created for this dispatch, so check Runs before pressing again.${rosterNote}${linkNote}`
          : r?.roster_error
            ? `The GitHub issue is open at #${r.issue_number}, but your agent roster could not be read, so no mission was created and nothing here can tell you whether a builder agent exists. The read failed with: ${r.roster_error}${linkNote}`
            : `The GitHub issue is open at #${r.issue_number}, but no mission was created for it, so there is no run to open. Check that a builder agent exists in your roster.${linkNote}`,
      });
    },
    /**
     * NAMED, NOT SWALLOWED. A dispatch that did not happen must never wear the
     * shape of one that did: the row stays, and the reason is on screen.
     *
     * THE TAIL IS CONDITIONAL NOW, AND THE CONDITION IS THE POINT. It read,
     * unconditionally, "Nothing was dispatched, so the spec is still waiting."
     * and the comment here argued that "only here is it true", because the
     * handler throws only where nothing durable happened. That reasoning covers
     * a SERVER THROW and nothing else: `onError` also fires for a gateway
     * timeout, a dropped connection, an edge 5xx and an aborted fetch, and in
     * every one of those the request may have reached the handler and run it to
     * the end: the GitHub issue open, the mission created, a builder queued and
     * spending. Telling someone nothing happened is an invitation to press
     * again, and a second press is a second issue and a second billed run.
     *
     * `isDispatchRefusal` asks whether this is the handler's own pre-durable
     * refusal, which it marks (see lib/build/dispatch-refusal.ts). The fail
     * direction is deliberate: anything unmarked, including a sanitised
     * production error, lands on the cautious sentence.
     */
    onError: (e: Error) => {
      const refused = isDispatchRefusal(e.message);
      setFailed({
        lead: refused ? "The build did not start" : "We do not know whether the build started",
        sub: refused
          ? `${dispatchRefusalReason(e.message)} Nothing was dispatched, so the spec is still waiting.`
          : failureLine(
              "The connection to us failed rather than the dispatch refusing, so the dispatch may have started: a GitHub issue may be open and a builder may be queued. Check Runs before pressing again.",
              e,
            ),
      });
    },
  });

  /**
   * THE PRESS, GATED ON A REPO EXISTING: the fix /runs and the spec page have
   * had for a while and this station did not.
   *
   * Both of those wrap the same act in `gateDispatch` plus `RepoGateDialog`,
   * which pre-checks the repo and, when there is none, offers
   * `provisionRepoForSpec` and retries the interrupted dispatch in place. Build
   * pressed straight into the mutation, so a person with no repo connected got
   * a raw "GitHub is not connected" in the failure row and a context panel
   * pointing at /sync. For a launch-week visitor that is the ORDINARY state,
   * and this is the station whose whole job it is.
   *
   * The gate is advisory by construction: `gateDispatch` dispatches anyway when
   * the check itself fails or answers "unknown", so a broken pre-check can
   * never block a build that would have worked.
   */
  const gatedStart = async (row: { id: string; title: string }) => {
    setChecking(row.id);
    try {
      await gateDispatch({
        check: () => fCanDispatch({ data: { prdId: row.id } }),
        dispatch: () => start.mutate(row),
        openGate: (reason) => setRepoGate({ prdId: row.id, reason }),
      });
    } finally {
      setChecking(null);
    }
  };
  /** The row the gate interrupted, so its retry re-runs the same dispatch. */
  const gatedRow = repoGate ? (visible.find((r) => r.id === repoGate.prdId) ?? null) : null;

  /**
   * A FAILED READ MUST NOT DELETE THE STATION'S ONLY START CONTROL IN SILENCE.
   *
   * This was `if (specs.isLoading || specs.isError) return null;`, so a refused
   * or failed `prds` read rendered exactly what an empty list renders: nothing,
   * with no word said, while the page around it still called itself the build
   * engine. The sibling states on this same surface get it right (the route's
   * "Every change" block renders `<Failed onRetry=...>`), so this one does too.
   * The silent null is kept for the one case it is honest about: a read that
   * answered and found nothing.
   */
  if (specs.isError) {
    return (
      <Region title="Approved and waiting to be built">
        {/* The bare half of the pair. `ReadFailed` draws its own bordered box
            and this already sits under a Region heading; two containers around
            one sentence is a frame. */}
        <ReadFailedLine onRetry={() => void specs.refetch()}>
          The spec list did not load, so nothing can be started from here. This is not a statement
          that you have no approved specs.
        </ReadFailedLine>
      </Region>
    );
  }
  if (specs.isLoading) return null;
  if (ready.length === 0) return null;

  // Hoisted out of the JSX so the door below needs no cast: narrowing a
  // PROPERTY does not survive into a callback, narrowing a const local does,
  // and this file's own comment about `as { missionId?: string }` is the reason
  // not to reach for the assertion instead.
  const failedMissionId = failed && failed.missionId ? failed.missionId : null;

  return (
    <>
      <Region
        title="Approved and waiting to be built"
        sub={
          beyond > 0 ? (
            <>
              Plan has finished with <Num>{ready.length}</Num>. Starting one here opens its run. The{" "}
              <Num>{visible.length}</Num> most recently touched are shown, and <Num>{beyond}</Num>{" "}
              are not.{" "}
              {showAll ? (
                <>
                  The rest are on{" "}
                  <Link to="/plan" className={LINK}>
                    Plan
                  </Link>
                  , where each one can be sent to Build from its own page.
                </>
              ) : null}
            </>
          ) : (
            "Plan has finished with these. Starting one here opens its run."
          )
        }
        /*
         * ── THE WAY PAST THE CAP CAME OUT OF THE HEADING, AND THAT IS THE PORT
         *    RATHER THAN A TIDY-UP ────────────────────────────────────────
         * This was `more`/`onMore`, which put "Show 34 more" in the REGION
         * HEADING -- above rows the reader had not reached yet. Meridian's
         * `Region` refuses that slot by name and gives the reason: the offer to
         * see more of a list is announced before any of it has been seen, and
         * the number in that offer is the only place the real total appears.
         *
         * `Region` splits the old prop three ways and none of them fits a cap:
         * `goTo` LEAVES the region, `toggle` reveals something and announces
         * `aria-expanded`, `act` dispatches work. This does none of those; it
         * lengthens the list you are already reading.
         *
         * So it moved UNDER the last row, which is where `RecordsTable` already
         * puts it and where a reader arrives having actually hit the limit. The
         * arithmetic is unchanged: WINDOW_MAX is what both side reads accept in
         * one call, so this is the largest window that costs no second round
         * trip per row.
         */
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
           * This list filters on `prds.status === 'approved'` (the SPEC approval)
           * and said "Approved. Build opens the issue as it starts." while
           * `dispatchBuilderMission` was going to refuse the press outright because
           * the spec's DESIGN gate had a drawing waiting on a human. Re-measured
           * 2026-08-06: two of the 42 approved specs are in exactly that state, and
           * exactly one spec now has an approved design gate, the first, so this
           * paragraph's earlier "not one" was true when written and is not now. The
           * sub-line promised the opposite of what the button did, with no way to
           * tell beforehand and no link to the page where the call is actually
           * made.
           *
           * The row is not dropped and the person is not left holding a control
           * that cannot work: the sub-line says which gate is holding it and the
           * action becomes the door to the gate.
           *
           * WHICH SENTENCE, THOUGH: THE FIRST VERSION OF THIS ROW HAD ONE FOR
           * THREE DIFFERENT STATES. It said "a mockup is drawn and nobody has
           * approved or rejected it" for every blocked row, and the gate blocks on
           * `status !== "approved"`: a REJECTED design is blocked, and so is a spec
           * whose drawing count could not be read (the gate stays shut on unknown,
           * design-gate.server.ts:34). For those two the row asserted the opposite
           * of the truth: this repo's signature defect, written inside the fix for
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
          /**
           * A SPEC GENERATED FROM A SEEDED EXAMPLE BET IS NOT WORK.
           *
           * `listSpecs` selects `is_sample` deliberately and /decide prints the
           * Example tag on the bet this spec came from; the cast on this list
           * used to drop the column, so a spec descended from invented evidence
           * got a primary "Build this" that opens a real GitHub issue in the
           * customer's repository and starts a real billed run against fiction.
           * On a brand-new workspace that is the FIRST spec a stranger sees, by
           * construction: /decide's gate falls through to the top-ranked bet
           * when there is no real one.
           *
           * The migration that added the column states the contract in its own
           * comment: "Surfaces must mark it the way /decide marks the bet it
           * came from, and anything that forms a judgement must exclude it." So
           * the row is marked in /decide's own words and its press is refused;
           * the door to the spec replaces the button rather than leaving the
           * row inert, because reading the example is the legitimate thing to
           * do with it.
           */
          const sample = row.is_sample === true;
          const runs = runsBySpec.get(row.id) ?? [];
          const latest = runs[0] ?? null;
          /* Hoisted for the same reason `failedMissionId` above is: narrowing a
             property does not survive into a callback, and this file's rule is
             that no cast stands between a navigate and the typechecker. */
          const latestMissionId = latest ? latest.missionId : null;
          const busy = start.isPending || checking === row.id;
          const pressing =
            (start.isPending && start.variables?.id === row.id) || checking === row.id;
          /**
           * The already-dispatched sentence, assembled rather than nested,
           * because it has four independent clauses and one of them is a read
           * that can fail on its own.
           *
           * `ago` returns a bare token ("3h", "Aug 1"), which does not read as
           * prose, so WHEN lives in the row's time slot and this says WHAT.
           * A null `status` here is the mission read failing while the edge
           * read succeeded: the dispatch is a fact, its current state is not,
           * and the sentence says so rather than dropping the clause and
           * leaving the reader to assume the run is fine.
           */
          const alreadySent = latest
            ? `Already sent to Build${
                latest.status
                  ? `, and that mission is ${latest.status}`
                  : ", and we could not read what that mission is doing now"
              }${runs.length > 1 ? `. ${runs.length} builds have been started on it` : ""}. ` +
              "Building again mints another mission and another billed run."
            : null;

          return (
            <Row
              key={row.id}
              lead={
                sample ? (
                  <>
                    <b>Example</b>
                    {" · "}
                    {row.title}
                  </>
                ) : (
                  row.title
                )
              }
              sub={
                sample
                  ? "Generated from a seeded example bet, so it describes invented work. Building it would open a real issue in your repository and bill a real run."
                  : gate
                    ? gate.status === "rejected"
                      ? "Waiting on the design gate: this spec's design was rejected and nothing approved has replaced it, so a build started here would be refused."
                      : !gate.drawingConfirmed
                        ? "Waiting on the design gate: whether a mockup exists could not be read, and the gate stays shut while that is unknown, so a build started here would be refused."
                        : "Waiting on the design gate: a mockup is drawn and nobody has approved it yet, so a build started here would be refused."
                    : alreadySent
                      ? alreadySent
                      : dispatchUnread
                        ? "Approved. We could not check whether a build has already been started on this spec, so pressing may start a second one."
                        : dispatchReading
                          ? "Approved. Whether a build has already been started on this spec has not come back yet."
                          : unread
                            ? "Approved. The design gate has not been read for this spec yet, so a build started here may still be refused."
                            : row.github_issue_url
                              ? "Approved, with a GitHub issue already open."
                              : "Approved. Build opens the issue as it starts."
              }
              /* WHEN it was sent to Build, for the rows that were. The sub-line
                 above says what happened; the time slot is where this list
                 keeps when, and a spec nobody has dispatched has no when. */
              time={latest ? ago(latest.dispatchedAt) : null}
              /* PER ROW, not per mutation. One shared `isPending` drove all six
               buttons, so starting ONE build reported that six were starting
               and disabled five specs the person had not touched.
               `start.variables` is the row the mutation is actually running
               for; fifteen sibling files already use this shape. */
              action={
                sample ? (
                  <Door
                    title="Open this example spec without building it"
                    onClick={() => void navigate({ to: "/plan/spec/$id", params: { id: row.id } })}
                  >
                    Read the example
                  </Door>
                ) : gated ? (
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
                   * `DesignScaffoldPanel`, the same approve / request-changes pair
                   * that writes the gate, which is also where
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
                ) : latestMissionId ? (
                  /**
                   * THE RUN LEADS, AND STARTING A SECOND ONE STAYS POSSIBLE.
                   *
                   * Removing the press outright would be the easy version and
                   * the wrong one: a halted build is a real reason to dispatch
                   * again, and this station is where a person does it. So the
                   * primary becomes the door to what already exists and the
                   * second dispatch steps down to a secondary that says what it
                   * costs, in the sub-line above and on the control itself.
                   */
                  <>
                    <Door
                      title="Open the run this spec was already sent to"
                      onClick={() =>
                        void navigate({
                          to: "/runs/$missionId",
                          params: { missionId: latestMissionId },
                        })
                      }
                    >
                      Open the run
                    </Door>
                    <Action
                      busy={busy}
                      title="Start a SECOND mission and a second billed run on this spec"
                      onClick={() => void gatedStart({ id: row.id, title: row.title })}
                    >
                      {pressing ? "Starting" : "Build again"}
                    </Action>
                  </>
                ) : (
                  /* AN `Action`, NEVER AN `Approve`, AND THE ACCENT IS THE
                     REASON. Meridian spends `--mrd-you` on one meaning: a
                     person is required, the work is stopped until this is
                     pressed. Nothing is held here -- the spec is approved and
                     idle, and this STARTS work rather than releasing any. The
                     neutral primary is the one stop on the ladder nothing else
                     uses, which is what makes it the loudest control on the
                     station without borrowing the gate's colour. */
                  <Action
                    variant="primary"
                    busy={busy}
                    onClick={() => void gatedStart({ id: row.id, title: row.title })}
                  >
                    {pressing ? "Starting" : "Build this"}
                  </Action>
                )
              }
            />
          );
        })}

        {/* THE REAL ARITHMETIC, UNDER THE LAST ROW, with the way out beside it.
            This is the half the region heading used to carry. A reader reaches
            it having actually run out of rows, which is the only moment an
            offer to see more of a list is answering a question they have. */}
        {beyond > 0 && !showAll ? (
          <div className="mt-mrd-4 text-mrd-label text-mrd-mute">
            <Num>{beyond}</Num> more {beyond === 1 ? "spec is" : "specs are"} approved and not
            shown.{" "}
            <Door onClick={() => setShowAll(true)}>
              Show {Math.min(beyond, WINDOW_MAX - WINDOW)} more
            </Door>
          </div>
        ) : null}
      </Region>

      {/* The two real paths when no repo resolves: connect one on /sync, or
        provision a starter repo for this spec, after which the interrupted
        dispatch retries itself. Same component /runs and the spec page mount. */}
      <RepoGateDialog
        open={repoGate !== null}
        prdId={repoGate?.prdId ?? null}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => {
          if (gatedRow) start.mutate({ id: gatedRow.id, title: gatedRow.title });
        }}
      />
    </>
  );
}
