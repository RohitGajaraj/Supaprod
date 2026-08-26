import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import "../styles/workbench.css";
import { PageHeading } from "@/components/meridian/surface-parts";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Row } from "@/components/meridian/rows";
import { TrackRunLeft, TrackPaneRight } from "@/components/track/TrackRun";
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
 */
function runStatus(track: Track): {
  status: "you" | "agent" | "pass" | "hold";
  word: string;
  pulse: boolean;
  second: string | undefined;
} {
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
  return { status: "agent", word: "Running", pulse: true, second: undefined };
}

function RunHeader({ track }: { track: Track }) {
  const stationName = AGENT_STATIONS[track.station]?.name ?? track.station;
  const next = nextStation(track.route as SpineRoute, track.station);
  const nextName = next ? (AGENT_STATIONS[next]?.name ?? next) : null;
  const s = runStatus(track);

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
            specific about the same state, never different". */}
        <StatusChip status={s.status} pulse={s.pulse}>
          {s.word}
        </StatusChip>
        {s.second ? <span className="mrd-meta max-w-[36ch] text-right">{s.second}</span> : null}
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

  const settled = track?.status === "done";

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
            <RunHeader track={track} />
            <Row
              tight
              lead={`Running in ${activeWorkspace?.name ?? "your workspace"}${
                productsVisible && activeProduct ? ` · on ${activeProduct.name}` : ""
              }`}
              sub={
                decideWaived
                  ? "This one skips the decision, so nothing is being forecast on it."
                  : undefined
              }
            />
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
          />
        </div>
        <div className="mrd-workbench-pane mrd-workbench-pane--artifact">
          <TrackPaneRight trackId={trackId} isRunning={crewLive} promised={track?.origin ?? null} />
        </div>
      </div>
    </div>
  );
}
