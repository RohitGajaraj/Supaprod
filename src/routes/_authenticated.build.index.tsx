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
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { listBuildWork, type BuildWorkItem } from "@/lib/build-engine.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { getWorkspaceSpendPolicy, setWorkspaceSpendPolicy } from "@/lib/governance.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { ago } from "@/components/runs/run-state";
import {
  AgentMark,
  Block,
  Button,
  CtxBody,
  CtxHead,
  Empty,
  Failed,
  Input,
  Line,
  Num,
  PageHead,
  Receipt,
  Row,
  Surface,
} from "@/components/shell/primitives";

/** The agent that writes code. Its mark is the one on every row here. */
const BUILDER = "builder";

/**
 * The row's second line, in the record's own words.
 *
 * Facts the title does not carry: what state it reached, where it is going, how
 * big it is. Never a status word the mark already carries, and never a number
 * this surface did not read.
 */
function statusPhrase(item: BuildWorkItem): string {
  if (item.live) return "being written now";
  if (item.gated) return "waiting on you";
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

  /** The ceiling on what one run may spend. Owner-only; the query reports
   *  `is_owner: false` for everyone else and the line is not drawn. */
  const spend = useQuery({ queryKey: ["spend-policy"], queryFn: () => fSpend() });
  const [capReceipt, setCapReceipt] = React.useState<{ cap: number | null } | null>(null);
  const setCap = useMutation({
    mutationFn: (cap_usd: number | null) => fSetSpend({ data: { cap_usd } }),
    onSuccess: (_r, cap) => {
      setCapReceipt({ cap });
      void qc.invalidateQueries({ queryKey: ["spend-policy"] });
    },
  });
  // The active product, because a repo can be bound to a PRODUCT and the check
  // is blind to that binding without it. See canDispatchToRepo.
  const { activeProductId } = useWorkspace();

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
  const loading = work.isLoading;

  /** Assembled from counts this surface actually read, never from an estimate. */
  const headline = loading
    ? "Reading the record."
    : work.isError
      ? "The build record did not load."
      : `${
          live.length === 0
            ? "Nothing is being written"
            : live.length === 1
              ? "One change is being written"
              : `${live.length} changes are being written`
        }. ${
          gated.length === 0
            ? "Nothing needs you."
            : gated.length === 1
              ? "One needs you."
              : `${gated.length} need you.`
        }`;

  const rowFor = (item: BuildWorkItem, keyPrefix: string) => {
    const parts: React.ReactNode[] = [statusPhrase(item)];
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
    // `Diffstat`'s "+2 −0" shape, for the two reasons this row already recorded
    // and which the colour ruling does not touch: the shape reads as LINES to
    // anyone who has used a diff and these are FILES, and "−0" renders a zero as
    // if it were a fact. So the colour comes, the pill and the fake zero stay
    // away. Only the non-zero side is drawn at all.
    if (item.added > 0) {
      parts.push(
        <span className="sp-pass">
          {item.added} new {item.added === 1 ? "file" : "files"}
        </span>,
      );
    }
    if (item.deleted > 0) {
      parts.push(<span className="sp-fail">{item.deleted} deleted</span>);
    }
    if (item.prNumber != null) {
      parts.push(
        item.prUrl ? (
          <a
            href={item.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--sp-ink)" }}
            // The row is a button. Without this the link would open the pull
            // request AND navigate into the run behind it.
            onClick={(e) => e.stopPropagation()}
          >
            #{item.prNumber}
          </a>
        ) : (
          <>#{item.prNumber}</>
        ),
      );
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
            state={item.live ? "running" : item.gated ? "waiting" : "quiet"}
            name={item.missionTitle ?? item.title}
          />
        }
        lead={item.title}
        sub={
          <span className="sp-meta">
            {parts.map((p, i) => (
              <React.Fragment key={i}>
                {i > 0 ? <span aria-hidden="true"> · </span> : null}
                {p}
              </React.Fragment>
            ))}
          </span>
        }
        time={ago(item.updatedAt)}
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
                    <Link to="/sync" style={{ color: "var(--sp-ink)" }}>
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
            A change is written by a run. Hand work over on{" "}
            <Link to="/runs" style={{ color: "var(--sp-ink)" }}>
              Runs
            </Link>
            , and it arrives here as the crew writes it.
          </CtxBody>
        </>
      }
    >
      <PageHead title={headline} sub="Every change the crew has written, across every run." />

      {/* The live and gated rows appear here AND in the full list below, on
        purpose. Pulling them out of the record to avoid repeating them would
        make the record incomplete in order to save a repetition, which is the
        wrong side of that trade: the list is the build's history and history
        does not skip the present. */}
      {live.length > 0 ? (
        <Block title="Being written now">{live.map((i) => rowFor(i, "live"))}</Block>
      ) : null}

      {gated.length > 0 ? (
        <Block title="Waiting on you">{gated.map((i) => rowFor(i, "gate"))}</Block>
      ) : null}

      <Block
        title="Every change"
        sub={
          // Never a silent cap. If the window dropped rows, the surface says so
          // rather than presenting a subset as the whole record.
          work.data && work.data.more > 0
            ? `The ${items.length} most recently touched. ${work.data.more} older ${
                work.data.more === 1 ? "change is" : "changes are"
              } not shown.`
            : undefined
        }
      >
        {loading ? null : work.isError ? (
          <Failed onRetry={() => void work.refetch()}>
            The build record did not load, so this list is not the whole picture.
          </Failed>
        ) : items.length === 0 ? (
          <Empty>
            The crew has not written anything yet. Hand work over on Runs and the change appears
            here as it is written, with its files and its pull request.
          </Empty>
        ) : (
          items.map((i) => rowFor(i, "all"))
        )}
      </Block>

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
        <Block title="The boundary">
          <Line
            label="What one run may spend before it stops"
            sub={
              spend.data.cap_usd === null ? (
                "No ceiling. A run continues until it finishes or something else stops it."
              ) : spend.data.is_default ? (
                <>
                  <Num>${spend.data.cap_usd.toFixed(2)}</Num>, which is our number rather than yours
                  until you change it.
                </>
              ) : (
                <>
                  <Num>${spend.data.cap_usd.toFixed(2)}</Num>. A run that reaches it halts and says
                  so.
                </>
              )
            }
          >
            <Input
              type="number"
              min={1}
              step={1}
              defaultValue={spend.data.cap_usd ?? undefined}
              aria-label="Dollars one run may spend before it stops"
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
        </Block>
      ) : null}
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/build/")({
  component: BuildEngine,
  head: () => ({ meta: [{ title: "Build · Supaprod" }] }),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <PageHead
        title="Build did not load."
        sub={(error as Error)?.message ?? "The reason did not come back with the error."}
      />
      <Block>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </Block>
    </Surface>
  ),
});
