/**
 * 05 Build, the station's own engine. The room the spine was missing.
 *
 * WHAT WAS HERE BEFORE, and why replacing it is not a reversal. This file was a
 * 28-line permanent redirect to /runs, written on 2026-07-29 when the RUN LIST
 * moved off /build. That move was right: a run is one piece of work walking all
 * seven stages, and calling its list "Build" told people the spine covered one
 * stage of seven. What the redirect then hid is that Build had no home at all.
 *
 * Founder, 2026-07-30: "isnt /run comprises of all this 7? and if /runs is for
 * /build then what happens to the other 6? where would they should be seen
 * from? what's the home for them?" The other six were fine. /discover, /decide,
 * /plan, /design, /ship and /learn are all real surfaces. Build was the only
 * station whose door led to a different axis, and a redirect is the perfect
 * camouflage for that: the URL answers, a real page appears, and nothing looks
 * missing.
 *
 * So /build stops meaning "the old name for /runs" and starts meaning what it
 * says. A bookmark to /build wanted the build work, and this is nearer to that
 * than a list of runs is; the strip above is one click back to Runs.
 *
 * ==================================================================
 * THE SEVEN QUESTIONS (SURFACE-JUSTIFICATION.md)
 *
 * 1. WHO IS STANDING HERE. Someone who wants to know what the crew is
 *    writing right now, across everything, without opening seven runs
 *    to find out. Usually because something is stuck, or because they
 *    are about to merge and want to see what else is in flight.
 *
 * 2. THE ONE THING IT EXISTS FOR. To answer "what is being written,
 *    and which of it is waiting on me" in one screen. Everything else
 *    here serves that or was cut.
 *
 * 3. KEEP / MOVE / KILL.
 *    NEW   the live block. What the crew is writing at this moment,
 *          with the agent's own mark. This is the founder's first ask
 *          of the session ("what the agents is doing") and it existed
 *          nowhere at workspace scope.
 *    NEW   the change list: every changeset with its repo, branch,
 *          file count and pull request. The build record, workspace
 *          wide, which only existed one run at a time.
 *    KEEP  where builds land. Lifted in shape from /runs, because it
 *          is the precondition for a build existing at all, and this
 *          is now the surface where that matters most.
 *    KILL  the composer. Handing work over is Runs' job and it is the
 *          reason a person opens Runs. Two doors for one act is the
 *          redundancy this rebuild keeps removing.
 *    KILL  a per-changeset cost. Nothing here is decided by it and the
 *          total already lives on Runs.
 *    KILL  a line-level diffstat on the row. It is real and it is
 *          computable, and pulling every version of every file in the
 *          workspace to render a list is the wrong trade. SYSTEM.md
 *          rule 4 decides it: full detail belongs to the item in
 *          focus. Files and created/deleted counts come free from a
 *          query that never touches the content columns.
 *
 * 4. ONE CLICK AWAY. The run, which already holds the diff, the trace,
 *    CI and the merge gate. This surface never rebuilds what the run
 *    detail already does well.
 *
 * 5. DELIGHT AND CONFUSION. The delight is opening this mid-morning
 *    and watching a file count climb on a row you were not watching.
 *    The confusion refused: a row that claims a diff it did not read.
 *
 * 6. WHERE THE CREW APPEARS. On every row, as its own silhouette, in
 *    the Build hue while it writes. Remove the agents and the live
 *    block is empty, which is the honest proof this surface is about
 *    their work rather than about files.
 *
 * 7. WOULD A STRANGER RECOGNISE IT. The emptiest realistic state is
 *    the common one: nothing building. It says so and names where
 *    builds would land, so it reads as calm rather than broken.
 * ==================================================================
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import {
  Action,
  Door,
  NothingYet,
  Num,
  PageHeading,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { listBuildWork, type BuildWorkItem } from "@/lib/build-engine.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { getWorkspaceSpendPolicy, setWorkspaceSpendPolicy } from "@/lib/governance.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { AgentPulse } from "@/components/meridian/AgentPulse";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { ago } from "@/components/runs/run-state";
import { ReadyToBuild } from "@/components/build/ReadyToBuild";
import { HeldClaims } from "@/components/build/HeldClaims";
import { CrewWorking } from "@/components/shell/CrewWorking";
import { CtxBody, CtxHead } from "@/components/meridian/ContextColumn";
import { Input } from "@/components/meridian/forms";
import { Receipt } from "@/components/meridian/Receipt";
import { Surface } from "@/components/meridian/Surface";
import { AgentMark } from "@/components/meridian/marks";
import { stillWaiting } from "@/lib/query-state";

/** The agent that writes code. Its mark is the one on every row here. */
const BUILDER = "builder";

/**
 * A ROUTER LINK INSIDE A SENTENCE, painted the way Meridian paints a door.
 *
 * `Door` renders either a `<button>` or an outbound `<a href>`; a TanStack
 * `<Link>` renders its own anchor and attaches client navigation to it, so the
 * element has to stay the router's and only the paint moves.
 *
 * It keeps `--mrd-ink` rather than stepping down to Door's `--mrd-body`: these
 * were `var(--sp-ink)` before the port and the ratchet law makes today's design
 * the floor, so a port may not make the surface quieter. The dotted underline
 * is the half that is new, and it is the half these links were missing -- a
 * word that is merely a different colour inside a muted sentence is not an
 * affordance anyone can see.
 */
const LINK =
  "rounded-mrd-xs text-mrd-ink underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:decoration-mrd-edge hover:decoration-solid";

/** The id binding the ceiling's visible label to its control. Meridian's `Line`
 *  binds a label BY NAME (the retired one bound by containment), so without a
 *  matching pair the field silently loses its accessible name. */
const CAP_INPUT_ID = "run-spend-cap";

/**
 * The row's second line, in the record's own words.
 *
 * Facts the title does not carry: what state it reached, where it is going, how
 * big it is. Never a status word the mark already carries, and never a number
 * this surface did not read.
 */
function statusPhrase(item: BuildWorkItem): string {
  // No `live` branch. A live row is drawn by the working indicator instead of by
  // a phrase, so "being written now" would be unreachable here and a second,
  // silently-dead way of saying the same thing. One vocabulary per fact.
  if (item.gated) return "waiting on you";
  /**
   * THE STOPPED PHRASE OUTRANKS THE CHANGESET'S OWN COLUMN, and that ordering
   * is the whole of the fix.
   *
   * `studio_changesets.status` describes the CHANGE ("staged, not committed").
   * `stopped` describes the RUN that was writing it. When the run has halted,
   * the change's own word is the more misleading of the two: "staged, not
   * committed" reads as work in flight, and on 2026-08-06 that sentence was
   * printed over 67 halted missions while the headline said nothing needed
   * anybody. So the run's state is said first.
   *
   * It is NOT said INSTEAD for a change that landed. A merged change is not
   * un-merged by its run stopping afterwards, and dropping "merged" to say
   * "stopped" would be the same class of error in the other direction.
   */
  if (item.stopped) {
    switch (item.status) {
      case "merged":
        return "merged, and the run behind it stopped";
      case "pr_open":
        return "pull request open, and the run behind it stopped";
      default:
        return "stopped, and nothing is picking it back up";
    }
  }
  switch (item.status) {
    case "merged":
      return "merged";
    case "pr_open":
      return "pull request open";
    case "committed":
      return "committed, no pull request yet";
    case "staged":
      return "staged, not committed";
    default:
      // The status vocabulary is CHECK-constrained to five values and the fifth
      // (abandoned) never reaches this list, so this branch is only reachable
      // if that constraint changes. It shows the raw value rather than
      // inventing a friendlier one: a word we made up would be harder to debug
      // than the one actually in the column.
      return item.status;
  }
}

function BuildEngine() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fWork = useServerFn(listBuildWork);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const fSpend = useServerFn(getWorkspaceSpendPolicy);
  const fSetSpend = useServerFn(setWorkspaceSpendPolicy);

  // The active product, because a repo can be bound to a PRODUCT and the check
  // is blind to that binding without it. See canDispatchToRepo. And the active
  // WORKSPACE, because the ceiling below binds a workspace and the server
  // cannot guess which one this screen is showing.
  const { activeProductId, activeWorkspaceId } = useWorkspace();

  /**
   * The ceiling on what one run may spend. Owner-only; the query reports
   * `is_owner: false` for everyone else and the line is not drawn.
   *
   * THE WORKSPACE IS SENT, AND WITHOUT IT THIS LINE MOVED THE WRONG CEILING.
   * `setWorkspaceSpendPolicy`'s own input doc says a screen that knows its
   * active workspace MUST send it: with no id, `resolveGovernedWorkspace` falls
   * back to `current_user_default_workspace`, while enforcement reads the
   * ceiling off the workspace the MISSION carries, and this station's dispatch
   * puts the mission in the spec's workspace, not the user's default. A user
   * who owns more than one workspace (the product creates the second one
   * itself) therefore read and moved a number that did not bind the run they
   * were watching. The id is in the query key for the same reason: switching
   * workspace must not show the previous workspace's ceiling.
   */
  const spend = useQuery({
    queryKey: ["spend-policy", activeWorkspaceId],
    queryFn: () => fSpend({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  const [capReceipt, setCapReceipt] = React.useState<{ cap: number | null } | null>(null);
  /** A ceiling write the server refused, in its own words. Rendered next to the
   *  control, because the input keeps the typed number on screen and a person
   *  who sees their number sitting there believes it took. */
  const [capError, setCapError] = React.useState<string | null>(null);
  /**
   * Bumped on every refusal, and it is the `key` on the ceiling input.
   *
   * The input is uncontrolled on purpose (`defaultValue`, so typing does not
   * re-render the block), which means the refused number stays in the box after
   * a failed write unless something puts it back. Remounting through the key is
   * how an uncontrolled control is reset to its default: no ref, no imperative
   * write, and the default is read from `spend.data` so it is always the number
   * the SERVER last confirmed rather than the one this page hoped for.
   */
  const [capReset, setCapReset] = React.useState(0);
  const setCap = useMutation({
    mutationFn: (cap_usd: number | null) =>
      fSetSpend({ data: { cap_usd, workspaceId: activeWorkspaceId ?? undefined } }),
    onSuccess: (_r, cap) => {
      setCapError(null);
      setCapReceipt({ cap });
      void qc.invalidateQueries({ queryKey: ["spend-policy"] });
    },
    /**
     * A REFUSED CEILING SHOWED NOTHING AT ALL, and the server went to real
     * trouble to make that impossible.
     *
     * `setWorkspaceSpendPolicy` throws on a role refusal, and throws
     * `unconfirmedWrite("that the ceiling moved")` when the update matched no
     * rows, which is what row-level security looks like from a client, because
     * supabase-js RESOLVES a refused write. There was no `onError` here and
     * nothing rendered `setCap.isError`, so the number stayed in the box, the
     * old receipt stayed on screen, and the person believed their spend was
     * bounded at a number nothing enforces. That is the exact sentence the
     * server's own comment says it exists to prevent.
     *
     * The stale receipt goes with it: a receipt is what your click CAUSED, and
     * this click caused nothing.
     */
    onError: (e: Error) => {
      setCapReceipt(null);
      setCapError(e.message);
      setCapReset((n) => n + 1);
    },
  });

  // The spine, lit on Build. Same hook and same cache the other six use, so
  // seven surfaces cost one query rather than seven.
  useSpineStrip("build");

  const work = useQuery({
    queryKey: ["build-work"],
    queryFn: () => fWork({ data: {} }),
    refetchInterval: 5000,
  });
  const repoStatus = useQuery({
    queryKey: ["repo-dispatch-check"],
    queryFn: () => fCanDispatch({ data: { productId: activeProductId ?? undefined } }),
    staleTime: 60_000,
  });

  const items = React.useMemo(() => work.data?.items ?? [], [work.data]);
  const live = React.useMemo(() => items.filter((i) => i.live), [items]);
  const gated = React.useMemo(() => items.filter((i) => i.gated && !i.live), [items]);
  /**
   * A BUILD THAT STOPPED IS A THING THAT NEEDS YOU, and it was invisible here.
   *
   * `live` asks about running/queued and `gated` about a pending approval, so
   * the state that dominates the live database (67 halted, 19
   * completed_with_failures, 0 running on 2026-08-06) mapped to neither. Those
   * rows appeared only in "Every change", wearing their changeset's own word,
   * under a headline that said nothing needed anybody.
   *
   * Gated wins where both are true: an approval is a thing a person can answer
   * in one click, and a halted mission with a gate on it is usually halted
   * BECAUSE of the gate.
   */
  const stopped = React.useMemo(
    () => items.filter((i) => i.stopped && !i.live && !i.gated),
    [items],
  );
  const loading = stillWaiting(work);
  /** What the four side reads could not answer. See BuildWorkUnread: a refused
   *  read used to reach this headline as a confident "nothing". */
  const unread = work.data?.unread;

  /** Assembled from counts this surface actually read, never from an estimate. */
  const needsYou = gated.length + stopped.length;

  /*
   * NEVER STARTED IS NOT THE SAME FACT AS CURRENTLY IDLE, and the composed
   * headline could not tell them apart.
   *
   * On a workspace that has never reached this station it read "Nothing is
   * being written. Nothing needs you." Both halves are literally true and
   * together they are an ALL CLEAR: the sentence a person wants after a busy
   * week, shown to someone who has not begun. It is the same shape as a count
   * of zero offered as reassurance, and it tells a first time reader that they
   * have arrived at the end of something rather than the start.
   *
   * Gated on `isSuccess` for the reason this file already gives twice: a read
   * that refused also has zero items, and calling that "nothing written yet"
   * states a fact about the workspace on the strength of an answer we never
   * got.
   */
  const nothingEverWritten = work.isSuccess && items.length === 0;

  const headline = loading
    ? "Reading the record."
    : work.isError
      ? "The build record did not load."
      : nothingEverWritten
        ? "The crew has not written anything yet."
        : `${
            live.length === 0
              ? unread?.runs
                ? "We could not read what is being written"
                : "Nothing is being written"
              : live.length === 1
                ? "One change is being written"
                : `${live.length} changes are being written`
          }. ${
            needsYou === 0
              ? // "Nothing needs you" is a claim, and both halves of it come off
                // reads that can fail. Either failing turns it into a question.
                unread?.gates || unread?.runs
                ? "We could not read what is waiting on you."
                : "Nothing needs you."
              : stopped.length === 0
                ? needsYou === 1
                  ? "One needs you."
                  : `${needsYou} need you.`
                : gated.length === 0
                  ? stopped.length === 1
                    ? "One has stopped and nothing is picking it back up."
                    : `${stopped.length} have stopped and nothing is picking them back up.`
                  : `${needsYou} need you, ${stopped.length} of them stopped.`
          }`;

  const rowFor = (item: BuildWorkItem, keyPrefix: string) => {
    const parts: React.ReactNode[] = [
      // A LIVE ROW MEANS AN AGENT IS WRITING, and `live` is read off a builder
      // `agent_runs` row in running/queued on this mission, which the resume
      // sweeper drives through `runAgentLoop` (and every step of that loop
      // through `callModel`). So the phrase "being written now" gives way to the
      // indicator, which says the same thing and proves it: the static words
      // and a frozen page look identical.
      // THE DETAIL IS THE RUN IT BELONGS TO, because it is the only real field
      // on `BuildWorkItem` this line does not already carry: the file count, the
      // created/deleted counts and the repo are all in `parts` below, and the
      // changeset title is the row's lead. There is no "currently writing file
      // X" on the type, and a list query that never touches the content columns
      // could not honestly produce one. With no mission title resolved the
      // indicator carries no detail rather than a stand-in.
      item.live ? (
        <AgentPulse
          label="Build is writing this change"
          seed={`${BUILDER}-${item.changesetId}`}
          compact
          detail={item.missionTitle ?? undefined}
        />
      ) : (
        statusPhrase(item)
      ),
    ];
    if (item.files > 0) {
      parts.push(
        <>
          <Num>{item.files}</Num> {item.files === 1 ? "file" : "files"}
        </>,
      );
    }
    // COLOURED, BUT STILL PLAIN WORDS, and the distinction is the whole point.
    // Founder ruling 2026-08-01 puts green and red on every diff number so it is
    // evident at a glance, and these counts get it. What they do NOT get is
    // `Diffstat`'s "+2 −3" shape, because THE SHAPE READS AS LINES to anyone who
    // has used a diff, and these are FILES.
    //
    // RE-EXAMINED 2026-08-16 and the refusal holds, but only half of it. This
    // note used to give a second reason -- that "−0" renders a zero as if it
    // were a fact -- and Meridian's `Diffstat` now guards exactly that
    // ("A ZERO SIDE IS NOT DRAWN", surface-parts.tsx), so that half is dead and
    // is removed rather than left to be re-argued.
    //
    // The surviving reason is not answered by `unit`, which is the obvious
    // rebuttal and does not work: `unit` reaches only the `aria-label`, so a
    // sighted reader still sees "+2 −3" whatever it is set to. Until the glyphs
    // themselves can say files, words are the honest shape here.
    // Only the non-zero side is drawn at all.
    //
    // THE COLOUR SURVIVES THE PORT, AND IT WAS CHECKED RATHER THAN CARRIED. The
    // rule under Meridian is that green and red report an OUTCOME and nothing
    // else, so "a count is not an outcome" is the right question to ask of these
    // two. They pass it: this is a DIFF DELTA, files created and files deleted
    // by the change, which is the one thing `Diffstat` in surface-parts.tsx is
    // allowed to paint green and red for and says so in its own header. These
    // are the same fact in words rather than in "+2 -3", for the reason above:
    // that shape reads as LINES and these are FILES.
    if (item.added > 0) {
      parts.push(
        <span className="text-mrd-pass">
          {item.added} new {item.added === 1 ? "file" : "files"}
        </span>,
      );
    }
    if (item.deleted > 0) {
      parts.push(<span className="text-mrd-fail">{item.deleted} deleted</span>);
    }
    /*
     * THE PULL REQUEST WITH AN ADDRESS MOVED OUT OF THE SENTENCE, and that is a
     * bug fix the port surfaced rather than a rearrangement.
     *
     * A `Row` carrying `onClick` and no `action` renders as a single `<button>`
     * (rows.tsx), so an `<a>` inside its sub-line was interactive content nested
     * inside a button: invalid markup, and it needed a `stopPropagation` to stop
     * one click doing two things. `Row`'s `action` slot exists for exactly this
     * and says so -- "a control belonging to THIS row ... it sits outside the
     * clickable region so it is never a button inside a button" -- and passing
     * one makes the row a container with the readable half as the button.
     *
     * A pull request with NO url has no address to open, so it stays a plain
     * fact in the sentence where it always was.
     */
    if (item.prNumber != null && !item.prUrl) {
      parts.push(<>#{item.prNumber}</>);
    }
    // The repo, and NOT the branch. A row is one line that never wraps, and a
    // branch name is long enough to push the repo off the end of it, which is
    // what it did on first render: the most important fact on the line was the
    // one being truncated. The branch is one click into the run, where there is
    // room for it.
    parts.push(item.repo);

    return (
      <Row
        key={`${keyPrefix}-${item.changesetId}`}
        tight
        marks={
          <AgentMark
            slug={BUILDER}
            state={
              item.live
                ? "running"
                : item.gated
                  ? "waiting"
                  : // The mark carries the state and owns the colour, so a
                    // stopped run reads as stopped at a glance rather than as
                    // one more quiet row in a long list.
                    item.stopped
                    ? "failed"
                    : "quiet"
            }
            name={item.missionTitle ?? item.title}
          />
        }
        lead={item.title}
        sub={
          /* NO WRAPPER SPAN. It was `<span className="sp-meta">`, and `.sp-meta`
             is declared in no stylesheet in this repo -- not primitives.css,
             not ink.css, not styles.css. It painted nothing, the same way the
             `FOCUS_RING` constant painted nothing in six files. `Row` already
             sets this line's size and ink, so dropping it moves no pixel. */
          <>
            {parts.map((p, i) => (
              <React.Fragment key={i}>
                {i > 0 ? <span aria-hidden="true"> · </span> : null}
                {p}
              </React.Fragment>
            ))}
          </>
        }
        time={ago(item.updatedAt)}
        action={
          item.prNumber != null && item.prUrl ? (
            <Door href={item.prUrl} title="Open the pull request on GitHub">
              #{item.prNumber}
            </Door>
          ) : undefined
        }
        // A change with no run behind it cannot be opened, and says so by not
        // offering. Better than a click that goes nowhere.
        onClick={
          item.missionId
            ? () =>
                void navigate({
                  to: "/runs/$missionId",
                  params: { missionId: item.missionId as string },
                })
            : undefined
        }
      />
    );
  };

  return (
    <Surface
      context={
        <>
          {repoStatus.data ? (
            <>
              <CtxHead>Where the next build lands</CtxHead>
              <CtxBody>
                {/* Three states, because "not connected" and "could not tell"
                  send a person to two different places. Saying the first when
                  the truth is the second sends them to connect a repo they
                  already have. See repo-gate.ts. */}
                {repoStatus.data.resolution === "connected" ? (
                  (repoStatus.data.repo ?? "A connected repo.")
                ) : repoStatus.data.resolution === "not_connected" ? (
                  <>
                    No repo is connected, so a build has nowhere to open a pull request.{" "}
                    <Link to="/sync" className={LINK}>
                      Connect one
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    We could not read where builds land, so this is not a statement about your
                    setup. A build will still try, and will say what went wrong.
                  </>
                )}
              </CtxBody>
            </>
          ) : null}
          <CtxHead>Where work comes from</CtxHead>
          <CtxBody>
            An approved spec can be started here. Anything else is handed over on{" "}
            <Link to="/runs" className={LINK}>
              Runs
            </Link>
            , and arrives here as the crew writes it.
          </CtxBody>
        </>
      }
    >
      {/* THE PAGE'S RHYTHM, STATED HERE RATHER THAN INHERITED FROM A STYLESHEET.
          The retired `Block` carried its own 36px margin, 40px top padding and a
          hairline above every region, so the spacing between regions lived in
          `primitives.css`. Meridian's `Region` draws no frame and no margin at
          all, on purpose: the surface owns its own rhythm. `gap-mrd-6` is the
          step every ported surface uses between regions, and Meridian's ramp
          grows, so it is a larger step than anything inside one. */}
      <div className="flex flex-col gap-mrd-6">
        {/* THE AUTONOMOUS PATH, VISIBLE. Renders nothing unless an agent is
          genuinely mid-run, so it costs no space when the crew is idle and
          cannot show a step that did not happen. Every other pulse on this
          station is gated on a mutation the reader's own click started;
          this one is bound to the run. See use-live-agents.ts. */}
        <CrewWorking station="build" />
        <PageHeading title={headline} sub="Every change the crew has written, across every run." />

        {/* THE STATION CAN START ITS OWN WORK. Until now this surface could only
            watch: its own context panel said "hand work over on Runs, and it
            arrives here". A station whose job is building that told you to begin
            somewhere else. `dispatchBuilderMission` was already written and
            called nowhere. Renders nothing when no approved spec is waiting. */}
        <ReadyToBuild />

        {/* The live and gated rows appear here AND in the full list below, on
            purpose. Pulling them out of the record to avoid repeating them
            would make the record incomplete in order to save a repetition,
            which is the wrong side of that trade: the list is the build's
            history and history does not skip the present. */}
        {live.length > 0 ? (
          <Region title="Being written now">{live.map((i) => rowFor(i, "live"))}</Region>
        ) : null}

        {gated.length > 0 ? (
          <Region title="Waiting on you">{gated.map((i) => rowFor(i, "gate"))}</Region>
        ) : null}

        {/* STOPPED GETS ITS OWN REGION for the same reason "Waiting on you"
            does: it is a call to act, and a call to act buried in a 60-row
            history is not one. The row's door is the run page, which already
            carries the retry for a failed mission, so this region adds a way to
            SEE the state rather than a second place to change it. */}
        {stopped.length > 0 ? (
          <Region
            title="Stopped"
            sub="Nothing is picking these back up on its own. Open one to see why it stopped and to start it again."
          >
            {stopped.map((i) => rowFor(i, "stop"))}
          </Region>
        ) : null}

        <Region
          title="Every change"
          sub={
            /*
             * ── IT SAYS IT REPEATS THE LANES NOW (2026-09-01) ────────────────
             *
             * Found by walking this station rather than reading it. Measured on
             * the rendered page at 1512px: six rows appear TWICE, once under
             * "Waiting on you" at y=746 and again here at y=1284, all twelve
             * visible at once. Not a responsive pair -- both are on screen.
             *
             * The list is CORRECT and is not the defect: it holds 9 rows against
             * the lanes' 8, and the 3 it adds are real (two with a pull request
             * open whose run stopped, one merged). It is the complete record and
             * deleting it would remove the only place those three appear.
             *
             * The defect was that the heading said none of that, so a reader
             * meeting "Add SSO login" for the second time 500px lower has no way
             * to tell it is the same piece of work rather than a duplicate row.
             * Unexplained repetition reads as a data fault, which is the
             * founder's "things are duplicated" complaint arriving from a list
             * that is behaving correctly.
             *
             * One sentence converts it from apparent duplication into stated
             * completeness. The cap clause keeps its place after it, because a
             * dropped row and a repeated row are two different facts and the
             * surface owes both.
             */
            work.data && work.data.more > 0
              ? `Everything the crew has written, including the rows above. The ${items.length} most recently touched; ${work.data.more} older ${
                  work.data.more === 1 ? "change is" : "changes are"
                } not shown.`
              : "Everything the crew has written, including the rows above."
          }
        >
          {loading ? (
            <Reading>Reading the build record.</Reading>
          ) : work.isError ? (
            /* `ReadFailedLine`, the bare half: this is inside a Region that
               already carries the heading, and `ReadFailed` would draw a second
               bordered box around one sentence. */
            <ReadFailedLine onRetry={() => void work.refetch()}>
              The build record did not load, so this list is not the whole picture.
            </ReadFailedLine>
          ) : items.length === 0 ? (
            <NothingYet>
              {/* RUNS IS A DOOR HERE, AS IT ALREADY IS IN THE CONTEXT COLUMN.
              This sentence named the one place a reader should go next and
              rendered it as dead text, while the identical word is a live link
              seventy lines above in "Where work comes from". Naming a
              destination without a way to reach it is the same defect as a
              button that does nothing, in a quieter costume. */}
              The crew has not written anything yet. Hand work over on{" "}
              <Link to="/runs" className={LINK}>
                Runs
              </Link>{" "}
              and the change appears here as it is written, with its files and its pull request.
            </NothingYet>
          ) : (
            items.map((i) => rowFor(i, "all"))
          )}
          {/* THE READS THAT DID NOT ANSWER, NAMED UNDER THE ROWS THEY WOULD HAVE
          FILLED. The changeset list itself succeeded (this branch is past
          `work.isError`), so the rows are real; what may be wrong is what is
          written ON them. Every count reading zero because a read was refused
          is a false statement about a real row, and it is the quietest of the
          four failures. */}
          {!loading && !work.isError && unread ? (
            <div className="mt-mrd-4 flex flex-col gap-mrd-3">
              {unread.files ? (
                <ReadFailedLine onRetry={() => void work.refetch()}>
                  The file counts did not load, so every count on these rows reads zero whether or
                  not the change touched anything.
                </ReadFailedLine>
              ) : null}
              {unread.runs ? (
                <ReadFailedLine onRetry={() => void work.refetch()}>
                  We could not read which of these are running and which have stopped, so no row
                  here claims either.
                </ReadFailedLine>
              ) : null}
              {unread.gates ? (
                <ReadFailedLine onRetry={() => void work.refetch()}>
                  We could not read what is waiting on a person, so nothing here is marked as
                  waiting on you.
                </ReadFailedLine>
              ) : null}
              {unread.missions ? (
                <ReadFailedLine onRetry={() => void work.refetch()}>
                  We could not read the runs these changes belong to, so rows show the change&apos;s
                  own title rather than the work it is for.
                </ReadFailedLine>
              ) : null}
            </div>
          ) : null}
        </Region>

        {/* THE CONTROL A BLOCKED BUILD IS SENT HERE TO USE. Renders nothing
            while no file claim is held, which is the ordinary state. See
            HeldClaims. */}
        <HeldClaims />

        {/* THE CEILING, on the station where the money is actually spent.
        `resolveMissionSpendCap` has resolved this on every dispatch since the
        mission-caps fix and `checkMissionCaps` enforces it fail-closed before
        every model call, but a repo-wide grep for the column outside the
        server returned nothing: the single most important governance control
        in the product was invisible to the person accountable for it.

        `mission-caps.server.ts` asked for this surface in its own words, about
        its own built-in number: "a default the user never chose, which by the
        governance canon's fourth floor makes it our decision rather than their
        policy, so it must stay visible and changeable rather than quietly
        correct."

        It is one line, not a panel, because a boundary is a sentence you set
        once and it does not block anything. And it is HERE rather than three
        clicks into Settings because GOVERNANCE-PRINCIPLE.md's instruction is to
        promote the policy layer to the centre of the product, and the centre
        for a spend ceiling is the room where agents write code. */}
        {spend.data?.is_owner ? (
          <Region title="The boundary">
            <Line
              /* BOUND BY NAME, NOT BY CONTAINMENT. Meridian's `Line` renders its
                 label in a `<span>` unless it is given the id of the control on
                 the right, and the retired one bound a control only when the
                 control happened to be a descendant. Passing the pair promotes
                 it to a real `<label for>`, which is also what lets a person
                 click the sentence to reach the box.
                 THE `aria-label` CAME OFF WITH IT. Two names on one control is a
                 defect rather than belt and braces: with a real label the
                 accessible name has to be the words a sighted person is already
                 reading, or the two can drift and only one of them is checkable. */
              htmlFor={CAP_INPUT_ID}
              label="What one run may spend before it stops"
              sub={
                spend.data.cap_usd === null ? (
                  "No ceiling. A run continues until it finishes or something else stops it."
                ) : spend.data.is_default ? (
                  <>
                    <Num>${spend.data.cap_usd.toFixed(2)}</Num>, which is our number rather than
                    yours until you change it.
                  </>
                ) : (
                  <>
                    <Num>${spend.data.cap_usd.toFixed(2)}</Num>. A run that reaches it halts and
                    says so.
                  </>
                )
              }
            >
              <Input
                id={CAP_INPUT_ID}
                // Remount on a refusal, so the box goes back to the confirmed
                // number. See `capReset`.
                key={`cap-${spend.data.cap_usd ?? "none"}-${capReset}`}
                type="number"
                min={1}
                step={1}
                defaultValue={spend.data.cap_usd ?? undefined}
                style={{ width: 96, textAlign: "right" }}
                disabled={setCap.isPending}
                onBlur={(e) => {
                  const raw = e.currentTarget.value.trim();
                  const next = raw === "" ? null : Number(raw);
                  if (next !== null && (!Number.isFinite(next) || next <= 0)) return;
                  if (next === spend.data?.cap_usd) return;
                  setCap.mutate(next);
                }}
              />
            </Line>
            {/* THE REFUSAL, WHERE THE CONTROL IS. Not a toast: the number the
            person typed has been put back to the one the server last
            confirmed, and the sentence has to be next to the box that changed
            under them or the change reads as a glitch. */}
            {capError ? (
              <ReadFailedLine onRetry={() => void spend.refetch()} retryLabel="Re-read the ceiling">
                The ceiling did not move. {capError} The box has been put back to the number the
                server last confirmed, which is the one that binds a run right now.
              </ReadFailedLine>
            ) : null}
            {capReceipt ? (
              <Receipt
                verb="You moved the ceiling"
                consequence={
                  capReceipt.cap === null ? (
                    "A run now continues until it finishes. Nothing stops it on spend."
                  ) : (
                    <>
                      A run now halts at <Num>${capReceipt.cap.toFixed(2)}</Num>.
                    </>
                  )
                }
              />
            ) : null}
          </Region>
        ) : null}
      </div>
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/build/")({
  component: BuildEngine,
  head: () => ({ meta: [{ title: "Build · Supaprod" }] }),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <div className="flex flex-col gap-mrd-6">
        <PageHeading
          title="Build did not load."
          sub={(error as Error)?.message ?? "The reason did not come back with the error."}
        />
        <Region>
          {/* An `Action` and never an `Approve`. Nothing is held pending this
              press: it re-reads. The accent is spent on one meaning in this
              product and a retry is not it. */}
          <Action variant="primary" onClick={reset}>
            Try again
          </Action>
        </Region>
      </div>
    </Surface>
  ),
});
