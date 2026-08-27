import * as React from "react";
import { Row } from "@/components/meridian/rows";
import { Action, Door, ReadFailedLine, Region } from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { listBuilderClaims, releaseBuilderClaim } from "@/lib/build.functions";
import { ago } from "@/components/runs/run-state";
import { stillWaiting } from "@/lib/query-state";

/**
 * THE CONTROL A BLOCKED BUILD IS TOLD TO COME HERE AND USE.
 *
 * `builder_file_claims` is a per-(repo, path) lock: while one Builder mission
 * holds a path, another mission asking for the same path is refused by the tool
 * registry with this sentence, verbatim:
 *
 *   BuilderFileConflict: path "X" is already claimed by another Builder mission
 *   ("<title>"). Wait for it to finish or have the operator release the claim
 *   from /build.
 *
 * /build had no such control. `listBuilderClaims` and `releaseBuilderClaim`
 * were written, exported and mounted nowhere, and build.functions.ts's own
 * header admitted it and then deferred it ("mounting them is a /build change
 * and /build is not this file"). So the product's one recovery instruction for
 * a stuck build sent a person to a page that could not perform it: a capability
 * with no door, which is this repo's signature defect, sitting under an error
 * message that names the door by URL.
 *
 * WHY IT RENDERS NOTHING MOST OF THE TIME. A claim is held only while a builder
 * is mid-write, and the terminal-run trigger releases them. So the ordinary
 * state is no claims at all, and a permanent empty block on the station would
 * be a standing invitation to release locks that are doing their job. It
 * appears when there is something to act on, and disappears again.
 *
 * WHY A FAILED READ STILL DRAWS. "No claim is held" and "we could not find out"
 * are different facts, and the second one matters more here than almost
 * anywhere: a person arrives at this block BECAUSE a build told them a claim
 * exists, and a silent empty block would tell them the error was lying.
 */
export function HeldClaims() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fClaims = useServerFn(listBuilderClaims);
  const fRelease = useServerFn(releaseBuilderClaim);

  /** The last release that failed, and its reason, kept on screen next to the
   *  row it belongs to rather than thrown at a toast that scrolls away. */
  const [failed, setFailed] = React.useState<{ id: string; reason: string } | null>(null);

  const claims = useQuery({
    queryKey: ["builder-claims"],
    queryFn: () => fClaims(),
    // The same cadence as the build list above it: a claim released by a run
    // finishing should stop being offered without a reload.
    refetchInterval: 15_000,
  });

  const release = useMutation({
    mutationFn: (claimId: string) => fRelease({ data: { claim_id: claimId } }),
    onSuccess: () => {
      setFailed(null);
      void qc.invalidateQueries({ queryKey: ["builder-claims"] });
    },
    /**
     * NAMED, AND ROW-SCOPED. `releaseBuilderClaim` throws two different
     * refusals: the row was not found or was already released (which is what an
     * RLS refusal also looks like from here, and the server says so in those
     * words), and a transport failure. Neither may leave the row looking
     * released, so the list is NOT invalidated on this path.
     */
    onError: (e: Error, claimId) => setFailed({ id: claimId, reason: e.message }),
  });

  const reading = stillWaiting(claims);
  const held = claims.data?.claims ?? [];

  // Nothing to act on and nothing to report: the block does not exist. A read
  // still in flight is also nothing to report, and a spinner for a block that
  // is usually absent would be worse than silence.
  if (reading) return null;
  if (!claims.isError && held.length === 0) return null;

  return (
    <Region
      title="Files held by a build"
      sub={
        claims.isError
          ? undefined
          : "A build holds a path while it writes to it, and another build asking for the same path is refused. Releasing one lets the waiting build proceed."
      }
    >
      {/* The count is this block's tracked fact, so its changes are said
          politely; identical polls render identical text and say nothing. */}
      <p role="status" aria-live="polite" className="sr-only">
        {`${held.length} ${held.length === 1 ? "path is" : "paths are"} held by a build`}
      </p>
      {claims.isError ? (
        /* `ReadFailedLine` and not `ReadFailed`: the bordered half draws its own
           box, and this already sits inside a Region under a heading. Two
           containers around one sentence is a frame. */
        <ReadFailedLine onRetry={() => void claims.refetch()} error={claims.error}>
          We could not read which files are held, so this is not a statement that none are. A build
          that was refused for a file conflict is still refused.
        </ReadFailedLine>
      ) : (
        held.map((c) => {
          const isFailed = failed?.id === c.id;
          return (
            <Row
              key={c.id}
              tight
              lead={c.path}
              sub={
                /* NO WRAPPER SPAN. It used to be `<span className="sp-meta">`,
                   and `.sp-meta` is declared in NO stylesheet in this repo --
                   not `primitives.css`, not `ink.css`, not `styles.css`. It
                   painted nothing, in the same way `FOCUS_RING` painted nothing
                   for six files. `Row` already sets the sub-line's size and ink,
                   so removing it changes no pixel and removes a retired name. */
                isFailed ? (
                  /* Red is an OUTCOME here and that is the only thing it is
                     allowed to be: the release was refused, and this is the
                     server's own word for what happened. */
                  <span className="text-mrd-fail">{failed.reason}</span>
                ) : (
                  <>
                    {c.repo}
                    {" · "}
                    {/* WHO HOLDS IT, in the words the refusal uses. The tool
                        error names the holding mission's title, so a person
                        matching this list against that message needs the same
                        string here. */}
                    {c.mission_title ?? "a build with no title on the record"}
                    {c.is_mine ? "" : " · started by someone else in this workspace"}
                  </>
                )
              }
              time={ago(c.claimed_at)}
              action={
                /* A fragment, not a wrapper: `Row` already lays the trailing
                   slot out as a flex row with its own gap, and a second box
                   inside it would add a block's worth of spacing. */
                <>
                  {/* The run that holds it, because releasing a claim from a
                      build that is still writing is the wrong fix and the run
                      page is where you find out whether it is. */}
                  {c.mission_id ? (
                    <Door
                      title="Open the run holding this file"
                      onClick={() =>
                        void navigate({
                          to: "/runs/$missionId",
                          params: { missionId: c.mission_id as string },
                        })
                      }
                    >
                      Open the run
                    </Door>
                  ) : null}
                  {/* AN `Action` AND NOT AN `Approve`. Meridian's split is by
                      what the click does: Approve is for a control that
                      UNBLOCKS something a person is holding. This releases a
                      lock a MACHINE is holding, so nothing here is waiting on a
                      judgement — it is an act, at the neutral face. */}
                  <Action
                    onClick={() => release.mutate(c.id)}
                    disabled={release.isPending && release.variables === c.id}
                    title="Release this lock so another build may take the file"
                  >
                    {release.isPending && release.variables === c.id ? "Releasing" : "Release"}
                  </Action>
                </>
              }
            />
          );
        })
      )}
    </Region>
  );
}
