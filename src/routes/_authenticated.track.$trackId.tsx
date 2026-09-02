import { createFileRoute } from "@tanstack/react-router";
import { searchFlag } from "@/lib/search-flag";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import "../styles/workbench.css";
import { PageHeading } from "@/components/meridian/surface-parts";
import { StatusChip } from "@/components/meridian/StatusChip";
import { TrackRunLeft, TrackPaneRight } from "@/components/track/TrackRun";
import { RunFooter } from "@/components/track/RunFooter";
import { useWorkspace } from "@/hooks/use-workspace";
import { getTrack, type Track } from "@/lib/spine/track.functions";
import { waiverFor } from "@/lib/spine/route";
import { runStatus } from "@/components/track/run-status";
import { cameBackOnItsOwn } from "@/components/track/came-back-on-its-own";
import { supabase } from "@/integrations/supabase/client";
import { holdTone } from "@/lib/spine/driver";
import { useRunTally } from "@/components/track/GotYou";

/**
 * /track/$trackId -- the one address a piece of work has.
 *
 * THE HOLE THIS CLOSES. `spine_tracks` shipped on 2026-08-01 as the object that
 * walks all seven stations, and its own migration argued for itself on exactly
 * this ground:
 *
 *   "A person needs one address. The learning curve of this product is the
 *    number of nouns in it, and 'your work is eight different things depending
 *    on which page you are on' is the expensive version."
 *
 * It then shipped as a table and stopped. Counted 2026-08-25: 84 authenticated
 * routes in this product and NOT ONE of them showed a track. The fix for "your
 * work is eight different things" was built and never given a ninth page to
 * live on, so it stayed eight.
 *
 * WHY A ROUTE AND NOT A PANEL somewhere existing. It has to be linkable. The
 * test this surface was built against is that a finished run can be sent to
 * somebody, and a tab inside another page cannot be sent to anybody.
 *
 * THE HEADER (SPEC-LAYOUT §2) names the work by its own title -- the opening
 * sentence a person recognises -- and answers the two questions they have on
 * arrival: where is it now, and who is it waiting on. Station names come from
 * the one display map and appear only as facts about this run in passing
 * (R-13), never as a menu. The status chip is derived from `holdTone` -- the
 * same set answer the driver enforces -- because TrackStart was once found
 * painting every hold amber by testing the sentence. No clock yet: whether
 * `driven_at` stamps seat-start or seat-end is UNVERIFIED (SPEC-LAYOUT G10),
 * and a clock measuring the wrong interval is worse than none.
 *
 * THE DISCLOSURE LINE (SPEC-ONRAMP §2.6) answers whose ground this runs on and
 * whether anything is being skipped, read entirely from rows.
 */
export const Route = createFileRoute("/_authenticated/track/$trackId")({
  validateSearch: (search: Record<string, unknown>): { start?: boolean } => ({
    // The composer lands here with ?start=true so the run begins itself
    // (SPEC-ONRAMP §2.7). Anything else -- absent, false, garbage -- means
    // plain landing; a track that has already been driven never re-drives on
    // this flag no matter what it carries, because TrackRun's own drivenAt
    // guard owns that.
    /* `searchFlag`, not a hand-rolled comparison. This accepted `true` and
       `"true"` and would have dropped `?start=1` -- the same defect that has
       now shipped four times in this repo, three of them found only by walking
       the page in a browser. Every caller happens to send the boolean, so it
       was latent rather than live; the helper removes the trap either way. */
    start: searchFlag(search.start),
  }),
  component: TrackPage,
  head: () => ({ meta: [{ title: "Run · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Track] route crashed:", error);
    return (
      <div className="mrd-workbench">
        <header className="mrd-workbench-header">
          <PageHeading
            title="This run did not load."
            sub="Reload the page. Nothing about the run itself is lost -- every station writes its own row as it goes."
          />
        </header>
      </div>
    );
  },
});

/**
 * ── THE HEADER IS THE PERSON'S SENTENCE AND ONE STATUS CHIP ───────────────
 *
 * WHAT IT USED TO BE, and every line of it was defensible on its own:
 *
 *   the title                       kept, and it is the whole point
 *   "Now: Build. Next: Ship."       a POSITION, and R-13 refused positions on a
 *                                   route that waives and reopens stations. It
 *                                   also said what the strip 40px above it was
 *                                   already saying with seven lit chips, and
 *                                   what the footer under both panes says as a
 *                                   MODE, which is the honest form.
 *   `track.origin`, clamped         the opening brief, up to a paragraph of it,
 *                                   under the title. Photographed on `ce846e9b`
 *                                   it ended mid-word; `Reveal` fixed the cut
 *                                   and could not fix the placement. It is the
 *                                   run's first fact, and the transcript's first
 *                                   entry is where a first fact belongs.
 *   the status chip                 kept. One per screen, and this is the one.
 *
 * So three things said where the work is and one said what a person asked for.
 * A1-REPORT §4: "The person's sentence. A status chip. Nothing else."
 *
 * ── THE TWO ONE-LINE FACTS THAT SURVIVE, AND WHY THEY ARE NOT "ELSE" ──────
 * Neither is the origin and neither is a position. Each is a fact about this run
 * that is true nowhere else on the screen, each is one line, and each is absent
 * on almost every run:
 *
 *   came back on its own   `from_learning_id`. A track the return edge created
 *                          is the product's own loop closing, and nothing else
 *                          on this surface can say it.
 *   the decision is waived nothing is being forecast on this run, which changes
 *                          what the Decide tab and the horizon clause mean.
 *
 * They are flagged here rather than removed quietly, because "nothing else" is
 * a real instruction and this is a reading of it rather than the letter of it.
 *
 * ── EXPORTED FOR ITS GUARD, AND ONLY FOR IT ──────────────────────────────
 * The rule it holds is a NEGATIVE one -- the origin never renders here -- and a
 * guard for a negative has to render the thing and look. Reaching it through the
 * route would mean standing up a router, a workspace provider and three mocked
 * server functions to read one heading, which is how a guard ends up testing its
 * own scaffolding. `ArtifactPane` exports `MissionCard` and `TrackActivity`
 * exports `headline` for the same reason and set the precedent.
 */
export function RunHeader({
  track,
  liveNow = false,
  fromLearningId = null,
  decideWaived = false,
}: {
  track: Track;
  liveNow?: boolean;
  /**
   * `spine_tracks.from_learning_id`. Read by the route rather than carried on
   * `Track`, because that type is `src/lib/spine/**` and S0's; the one-field
   * ask is filed and this read goes when it lands.
   */
  fromLearningId?: string | null;
  decideWaived?: boolean;
}) {
  const s = runStatus(track, liveNow);
  const cameBack = cameBackOnItsOwn(fromLearningId);

  return (
    <header className="flex flex-wrap items-start justify-between gap-mrd-4">
      <div className="min-w-0 flex-1">
        <h1 className="mrd-title">{track.title}</h1>
        {cameBack ? <p className="mrd-meta mt-mrd-1">{cameBack}</p> : null}
        {decideWaived ? (
          <p className="mrd-meta mt-mrd-1">
            This one skips the decision, so nothing is being forecast on it.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-mrd-1">
        {/* The override word rides as children: StatusChip's contract is "more
            specific about the same state, never different". Absent entirely
            when there is nothing to report; see `runStatus`. */}
        {s ? (
          <>
            <StatusChip status={s.status} pulse={s.pulse}>
              {s.word}
            </StatusChip>
            {s.second ? <span className="mrd-meta max-w-[36ch] text-right">{s.second}</span> : null}
          </>
        ) : null}
      </div>
    </header>
  );
}

function TrackPage() {
  const { trackId } = Route.useParams();
  const { start } = Route.useSearch();
  const { activeWorkspace, activeProduct, productsVisible } = useWorkspace();

  /*
   * QUEUE 71 ON THIS ROUTE, WHERE IT WAS MISSING. The route composes the two
   * panes itself rather than through `TrackRun`, and its first draft dropped
   * the crew-live lift entirely -- so the artifact pane polled at idle speed
   * and the presence slot read this tab's press only, while the transcript
   * below both said Working. One fact about one run now reaches every pane
   * from one source: the transcript's own running rows.
   */
  const [crewLive, setCrewLive] = React.useState(false);
  /*
   * The footer's one control, reported up by the pane that owns the walk state.
   * Both halves travel, not just Stop: the `Run it` region came out of the left
   * pane in the same change, so starting and stopping are one control in one
   * place instead of two controls at opposite ends of a scroll.
   */
  const [drive, setDrive] = React.useState<{
    walking: boolean;
    starting: boolean;
    stopping: boolean;
    stop: () => void;
    run: () => void;
  }>({
    walking: false,
    starting: false,
    stopping: false,
    stop: () => undefined,
    run: () => undefined,
  });

  const get = useServerFn(getTrack);
  // THE HEADER READS THE SAME CACHE ENTRY TRACKRUN POLLS -- same key, same
  // ten-second beat. This used to be its own unpolled key, and the drift was
  // caught live: the walk below announced a hold while this header still said
  // "Running". One fact about one run must not have two freshesses.
  const trackQ = useQuery({
    queryKey: ["spine-track", trackId],
    queryFn: () => get({ data: { trackId } }),
    refetchInterval: 10_000,
  });
  const track = trackQ.data ?? null;

  /*
   * DID THIS WORK COME BACK ON ITS OWN? `spine_tracks.from_learning_id` is live
   * (migration `20260831010000`) and `Track` does not carry it, so this reads it
   * with the caller's own RLS-scoped client -- the pattern `PrototypeCard`
   * established in `ArtifactPane`. Keyed on the track's own id, so it can only
   * describe the row already on screen.
   *
   * Cached hard: the column is written once by the return edge and never
   * edited, so re-reading it on the run's ten-second beat would spend a request
   * on a value that cannot change. The one-field ask to fold it onto `Track` is
   * with S0; this read goes when it lands.
   */
  const cameBack = useQuery({
    queryKey: ["track-from-learning", trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spine_tracks")
        .select("from_learning_id")
        .eq("id", trackId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as { from_learning_id: string | null } | null)?.from_learning_id ?? null;
    },
    staleTime: 5 * 60_000,
  });
  const decideWaived = track ? waiverFor(track.route, "decide") !== null : false;

  /*
   * THE CLOCK AND THE BILL FOR THE FOOTER, off the same hook the strip in the
   * right pane uses and therefore the same two cache entries the panes already
   * poll. One fact about one run must not have two freshnesses, which is the
   * drift this file has been repaired for twice.
   */
  const { tally } = useRunTally(trackId);

  /*
   * ABANDONED IS SETTLED TOO, and leaving it out was a gap rather than a
   * decision. The inversion narrows the walking rail and gives the page to what
   * the run produced, and its reason is that nothing is walking any more, so
   * the wide column is spent on a transcript nobody is watching while the thing
   * a person actually came to read stays in the narrow half.
   *
   * That reason applies to an abandoned run exactly as it does to a finished
   * one: it has stopped for good and what is left is what it made.
   * workbench.css's own comment already describes the trigger more broadly than
   * the code implemented it, "track.status === done OR the walk's own finished
   * result", so this closes the gap between the two rather than widening the
   * rule.
   */
  const settled = track?.status === "done" || track?.status === "abandoned";

  return (
    /*
     * THE WORKBENCH, NOT SURFACE: a document column with a metadata sidebar is
     * the wrong geometry for watching work happen (SPEC-LAYOUT §1). The header
     * spans both panes; the walking pane and the artifact pane split at the
     * 760px container width, scroll independently, and invert proportions --
     * never sides -- when the run settles.
     */
    <div className="mrd-workbench" data-page-composer>
      <header className="mrd-workbench-header">
        {track ? (
          <>
            <RunHeader
              track={track}
              liveNow={crewLive}
              fromLearningId={cameBack.data ?? null}
              decideWaived={decideWaived}
            />
          </>
        ) : (
          <PageHeading
            /*
             * A FAILED READ IS NOT A MISSING RUN, and this said it was.
             *
             * `trackQ.data?.track` is undefined both when the row genuinely is
             * not there and when the read never completed, so a failed read fell
             * through to "That work could not be found." with a sub explaining
             * the address may be out of date or the work belongs to another
             * workspace. Both sentences are assertions about a row nobody
             * managed to look at, on the surface the whole product is judged on,
             * and a person believing them closes the tab on a run that is
             * sitting there.
             *
             * Same family as the approvals heading that called a failed read an
             * empty queue. Three states now, and they are three different
             * things: still reading, could not read, and genuinely absent.
             */
            title={
              trackQ.isLoading
                ? "This piece of work"
                : trackQ.isError
                  ? "This run could not be read."
                  : "That work could not be found."
            }
            sub={
              trackQ.isLoading
                ? "Reading the run."
                : trackQ.isError
                  ? "The run itself is untouched and still whatever it was a moment ago. This screen just could not read it."
                  : "The address may be out of date, or the work belongs to another workspace. Nothing you were working on is affected."
            }
          />
        )}
      </header>
      <div className="mrd-workbench-panes" data-settled={settled ? "true" : undefined}>
        <div className="mrd-workbench-pane">
          <TrackRunLeft
            trackId={trackId}
            autoStart={start === true}
            onCrewLive={setCrewLive}
            crewLive={crewLive}
            onDriveState={setDrive}
          />
        </div>
        <div className="mrd-workbench-pane mrd-workbench-pane--artifact">
          <TrackPaneRight trackId={trackId} isRunning={crewLive} />
        </div>
      </div>

      {/*
       * THE FOOTER (THE-ONE-SCREEN:21), which this screen shipped without.
       *
       * A third child of a two-row grid takes an implicit `auto` row, so the
       * panes' `minmax(0,1fr)` gives it its height and no change is needed in
       * workbench.css, which is another lane's file.
       *
       * It renders only with a track, because every word in it is derived from
       * one and a footer over a failed read would be describing nothing.
       */}
      {track ? (
        <RunFooter
          status={track.status}
          tone={holdTone(track.holdReason)}
          hold={track.holdReason}
          because={track.holdBecause}
          walking={drive.walking}
          crewLive={crewLive}
          onStop={drive.stop}
          onRun={drive.run}
          stopping={drive.stopping}
          starting={drive.starting}
          /* The same two figures the strip at the top of the right pane prints,
             off the same `runTally` on the same cache entries, so the bar and
             the strip cannot report different numbers for one run. */
          elapsed={tally.elapsed}
          cost={tally.cost}
        />
      ) : null}
    </div>
  );
}
