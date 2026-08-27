import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import "../styles/workbench.css";
import { PageHeading } from "@/components/meridian/surface-parts";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Row } from "@/components/meridian/rows";
import { TrackRunLeft, TrackPaneRight } from "@/components/track/TrackRun";
import { RunFooter } from "@/components/track/RunFooter";
import { useWorkspace } from "@/hooks/use-workspace";
import { getTrack, type Track } from "@/lib/spine/track.functions";
import { nextStation, waiverFor, type SpineRoute } from "@/lib/spine/route";
import { holdTone } from "@/lib/spine/driver";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

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
    start: search.start === "true" || search.start === true ? true : undefined,
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
 * The status chip's three inputs, derived once so the header cannot drift from
 * the driver's own vocabulary. `Finished` overrides StatusChip's default word
 * for pass because reaching the end of a route is a completion, not a graded
 * outcome -- the product has never graded a forecast, and "Passed" would claim
 * one.
 *
 * `liveNow` is RUN-18's input: work in motion outranks a hold row written
 * between automatic legs. An out-of-time hold lands mid-press by design; while
 * the next leg is already walking, the truthful headline is Running, and the
 * hold sentence returns the moment the walk hands control back.
 */
function runStatus(
  track: Track,
  liveNow = false,
): {
  status: "you" | "agent" | "pass" | "hold";
  word: string;
  pulse: boolean;
  second: string | undefined;
} | null {
  if (track.status === "done") {
    return {
      status: "pass",
      word: "Finished",
      pulse: false,
      second: "It reached the end of its route.",
    };
  }
  if (track.status === "abandoned") {
    return { status: "hold", word: "Abandoned", pulse: false, second: undefined };
  }
  const tone = holdTone(track.holdReason);
  if (tone !== "you" && liveNow) {
    return { status: "agent", word: "Running", pulse: true, second: undefined };
  }
  if (tone === "you") {
    return {
      status: "you",
      word: "Waiting on you",
      pulse: true,
      second: track.hold ?? undefined,
    };
  }
  if (tone === "hold") {
    return {
      status: "hold",
      word: "On hold",
      pulse: false,
      second: track.hold ?? undefined,
    };
  }
  /*
   * NO CHIP, AND THIS IS THE HONESTY FIX RATHER THAN A GAP.
   *
   * The fallback used to return "Running" for any open track with no hold. That
   * is every track sitting between sweeps, which is most of them: caught at
   * 1024px on a real run where the header said Running while the pane directly
   * beneath it said "Nothing is driving it right now" and the character said
   * "Ready when you are." Three statements about one run, and the loudest was
   * the false one.
   *
   * Nothing is running here, nothing is holding it, and nobody is waiting on
   * anybody. This system already has a word for that and it is silence: the
   * spec chip follows the same rule, "quiet in this system means nothing to
   * report, and a chip that says nothing is noise". So the chip is absent and
   * the two honest sentences below it carry the state.
   */
  return null;
}

function RunHeader({ track, liveNow = false }: { track: Track; liveNow?: boolean }) {
  const stationName = AGENT_STATIONS[track.station]?.name ?? track.station;
  const next = nextStation(track.route as SpineRoute, track.station);
  const nextName = next ? (AGENT_STATIONS[next]?.name ?? next) : null;
  const s = runStatus(track, liveNow);

  return (
    <header className="flex flex-wrap items-start justify-between gap-mrd-4">
      <div className="min-w-0 flex-1">
        <h1 className="mrd-title">{track.title}</h1>
        <p className="mrd-meta mt-mrd-1">
          Now: {stationName}.{" "}
          {nextName ? <>Next: {nextName}.</> : <>Nothing further on this route.</>}
        </p>
        {/* Clamped to two lines: some origins are whole paragraphs (a
            clustered brief with counts), and an unbounded mono block under the
            title competed with the status for first read. The full text lives
            on the row; the header only says where this came from. */}
        {track.origin ? (
          <p className="mrd-meta mt-mrd-1 line-clamp-2 text-mrd-faint">{track.origin}</p>
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
            {s.second ? (
              <span className="mrd-meta max-w-[36ch] text-right">{s.second}</span>
            ) : null}
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
  /* The footer's Stop, reported up by the pane that owns the press. */
  const [drive, setDrive] = React.useState<{ canStop: boolean; stop: () => void }>({
    canStop: false,
    stop: () => undefined,
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
  const decideWaived = track ? waiverFor(track.route, "decide") !== null : false;

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
            <RunHeader track={track} liveNow={crewLive} />
            {/*
             * THE LOCATION LINE IS GONE, AND THAT IS THE FIX RATHER THAN A CUT.
             *
             * It read `Running in {workspace} · on {product}` on EVERY track,
             * including this one, which is abandoned, and including every held
             * and finished run. The status chip sits directly above it saying
             * the opposite, so the header asserted two different things about
             * one run, which is the drift this screen has already been repaired
             * for twice.
             *
             * And the fact itself was already on screen: the shell's own header
             * carries `Helio Labs / Prism` as the workspace switcher, a few
             * pixels above. So the honest repair is not a truer sentence, it is
             * one fewer. It also recovered the dead band under the title, which
             * was the largest empty area on the page.
             *
             * It rendered as a `Row`, which reserves a leading column for a
             * glyph or a clock, so it also sat indented from the heading it
             * belonged to. A list primitive was doing a caption's job.
             */}
            {decideWaived ? (
              <p className="mrd-meta">
                This one skips the decision, so nothing is being forecast on it.
              </p>
            ) : null}
          </>
        ) : (
          <PageHeading
            title={trackQ.isLoading ? "This piece of work" : "That work could not be found."}
            sub={
              trackQ.isLoading
                ? "Reading the run."
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
          <TrackPaneRight trackId={trackId} isRunning={crewLive} promised={track?.origin ?? null} />
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
          walking={drive.canStop}
          crewLive={crewLive}
          onStop={drive.stop}
        />
      ) : null}
    </div>
  );
}
