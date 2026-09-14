import { createFileRoute } from "@tanstack/react-router";
import { searchFlag } from "@/lib/search-flag";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate, useRouter } from "@tanstack/react-router";
import * as React from "react";

import "../styles/workbench.css";
import { PageHeading, ReadFailed, NothingHere, Action } from "@/components/meridian/surface-parts";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";
import { SessionEnded, endedSessionFor } from "@/components/system/SessionEnded";
import { StatusChip } from "@/components/meridian/StatusChip";
import { TrackRunLeft, TrackPaneRight, useCopyRunSummary } from "@/components/track/TrackRun";
import { Journey } from "@/components/meridian/Journey";
import { MoreMenu, MoreItem } from "@/components/meridian/MoreMenu";
import { journeyStations, newestArtifactAt } from "@/components/track/run-journey";
import { withPresences } from "@/components/start/journey-of-a-run";
import { presenceColour } from "@/components/meridian/AgentPresence";
import { useLiveAgents } from "@/hooks/use-live-agents";
import { getTrackArtifacts, getTrackActivity } from "@/lib/spine/track.functions";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { StationGlyph, GLYPH_FOR_STATION } from "@/components/meridian/station-glyphs";
import { RunFooter } from "@/components/track/RunFooter";
import {
  horizonFromStops,
  horizonAsDate,
} from "@/components/track/a-calendar-wait-is-not-a-stoppage";
import { GateBanner } from "@/components/track/GateBanner";
import { useWorkspace } from "@/hooks/use-workspace";
import { getTrack, type Track } from "@/lib/spine/track.functions";
import { waiverFor } from "@/lib/spine/route";
import { runStatus } from "@/components/track/run-status";
import { cameBackOnItsOwn } from "@/components/track/came-back-on-its-own";
import { supabase } from "@/integrations/supabase/client";
import { holdTone } from "@/lib/spine/driver";
import { useRunTally } from "@/components/track/run-tally";

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
  validateSearch: (search: Record<string, unknown>): { start?: boolean; artifact?: string } => ({
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
    /*
     * ── WHICH ARTIFACT IS OPEN, IN THE URL (P-24) ─────────────────────────
     *
     * A person watching a run wants to send a colleague the SPEC, not the run
     * and a sentence saying which tab to press. This surface was built on the
     * rule that "a finished run can be sent to somebody, and a tab inside
     * another page cannot be sent to anybody" -- the artifact is one level down
     * from that and had the same problem.
     *
     * SHAPE-CHECKED, NOT MERELY TYPE-CHECKED. `validateSearch` is a whitelist,
     * so whatever is not returned is dropped from the URL, and returning any
     * string at all would let `?artifact=<anything>` sit in a shared link
     * looking meaningful. Every artifact this can name is a `uuid` primary key,
     * so anything that is not one is not an artifact and is dropped.
     *
     * NOT `searchFlag`'s problem, but its lesson applies: TanStack runs each
     * value through `JSON.parse` before a validator sees it, so a numeric id
     * would arrive as a number. A uuid always survives as a string, which is
     * the second reason the shape is checked rather than assumed.
     */
    artifact:
      typeof search.artifact === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search.artifact)
        ? search.artifact
        : undefined,
  }),
  component: TrackPage,
  head: () => ({ meta: [{ title: "Run · Supaprod" }] }),
  errorComponent: TrackCrashed,
});

/**
 * THE CRASH STATE, WITH THE CONTROL IT WAS ASKING FOR (fifth review, 2026-09-09).
 *
 * It used to render a heading whose sub said "Reload the page." and nothing
 * else: an instruction with no button, on the surface the product is judged on.
 * Findings gives the same state an `Action` and Outcomes gives it `ReadFailed
 * onRetry={reset}`; this is that, on the third page.
 *
 * BOTH HALVES OF THE RETRY, because __root.tsx already worked this out and says
 * either alone recovers nothing: `router.invalidate()` re-runs the loaders,
 * `reset()` clears the boundary. And `error` is passed rather than only logged,
 * so a crash that is really a dead session gets the "Sign in" door `wayOut`
 * hands out instead of a retry that can never succeed.
 *
 * A named component because it holds a hook.
 */
function TrackCrashed({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[Track] route crashed:", error);
  const router = useRouter();
  return (
    <div className="mrd-workbench">
      <header className="mrd-workbench-header">
        <PageHeading
          title="This run did not load."
          sub="Nothing about the run itself is lost -- every step writes its own row as it goes."
        />
      </header>
      {/* A plain second child, not `.mrd-workbench-pane`: the grid's second row
          is `minmax(0,1fr)` and wants filling, and `ReadFailed` already draws
          its own frame. A pane around it would be a border inside a border. */}
      <div className="min-h-0 overflow-y-auto">
        <ReadFailed
          error={error}
          onRetry={() => {
            void router.invalidate();
            reset();
          }}
        >
          This run did not load, so nothing below it is the run.
        </ReadFailed>
      </div>
    </div>
  );
}

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
  more,
}: {
  track: Track;
  liveNow?: boolean;
  /** The quiet controls that belong to the whole run: copy a summary, take a file. */
  more?: React.ReactNode;
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
        {/*
         * ── A RUN'S NAME IS A SENTENCE, NOT A TITLE (Lane 1's ruling, 2026-09-09)
         *
         * This was `<h1 className="mrd-title">` -- `--mrd-t-h3`, 20px, which is
         * the COMPONENT rung that dialogs, empty regions and cards use, while
         * every other page in the product titles at `text-mrd-h2` (25px)
         * through `PageHeading`. So the most important surface in the product
         * titled one rung below all of them.
         *
         * BOTH OBVIOUS FIXES ARE WRONG. Raising this to 25px makes it shout:
         * "The red tile after an over-the-air reboot looks exactly like a real
         * outage, so a homeowner cannot tell them apart" already wraps to two
         * lines at 20px. Lowering `PageHeading` is worse, because 25px is
         * correct for a page title and the other route was never the one out of
         * step.
         *
         * The category error is the thing to fix: **this is a lead paragraph
         * wearing a heading's clothes.** Every other page titles with a short
         * label; a run has no short label, it has a sentence describing the
         * work. So the sentence is set AS PROSE, on the reading measure, and
         * the eyebrow above carries what a title would have carried -- which
         * station this is, with the glyph the road draws, so the run is
         * visibly on the road the person saw on the home.
         *
         * IT IS STILL THE `h1`. A heading element is the page's NAME in the
         * document outline, not its largest type, and the run's name is this
         * sentence. Making the eyebrow the h1 instead would name the page
         * "Build", which is true of a hundred runs.
         */}
        <span className="mrd-eyebrow mb-mrd-2 inline-flex items-center gap-mrd-2">
          <StationGlyph
            kind={GLYPH_FOR_STATION[track.station]}
            size={12}
            className="text-mrd-mute"
          />
          {AGENT_STATIONS[track.station]?.name ?? track.station}
        </span>
        <h1 className="mrd-copy max-w-[var(--mrd-measure-prose)] text-mrd-ink">{track.title}</h1>
        {cameBack ? <p className="mrd-meta mt-mrd-1">{cameBack}</p> : null}
        {decideWaived ? (
          <p className="mrd-meta mt-mrd-1">
            This one skips the decision, so nothing is being forecast on it.
          </p>
        ) : null}
      </div>
      <div className="flex items-start gap-mrd-3">
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
        {more}
      </div>
    </header>
  );
}

function TrackPage() {
  /* Reads the artifacts pane's own cache entry for the forecast horizon; see
     the `returnsOn` prop below for why it is not a second query. */
  const qc = useQueryClient();
  const { trackId } = Route.useParams();
  /*
   * ── IS THIS EVEN A RUN ADDRESS? (founder, 2026-09-09) ────────────────────
   *
   * He opened `/track/ce846e9b` -- the first block of a uuid, the shape a
   * person gets by copying an id out of a log or truncating a link -- and the
   * screen answered with FIVE messages for one cause, four of them red:
   *
   *   This run could not be read.
   *   The questions this run is waiting on could not be read, so answer
   *     nothing until this clears.
   *   Out of touch. This screen has lost sight of the run.
   *   The activity did not come back, so nothing here would be trustworthy.
   *   The record did not come back, so nothing here would be trustworthy.
   *
   * Every one of those is TRUE and every one is about the wrong thing. The
   * reads did fail, because `trackId` is validated as a uuid inside each server
   * function and this is not one. But the person's problem is not that the
   * platform is unwell, it is that the address is not a run's address, and a
   * wall of red saying the record cannot be trusted is the most alarming way to
   * say the least useful thing.
   *
   * It is also, uncomfortably, a state THIS MORNING'S WORK MADE LOUDER: those
   * reads used to swallow their errors and render as empty, and I made them
   * throw so a refusal would stop wearing the empty state's clothes. That was
   * right, and it is why the honest failure has to be routed rather than just
   * reported.
   *
   * A PURE TEST, NOT A HOOK, so it can sit above every read and gate them all.
   */
  const isRunId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackId);
  const { start, artifact } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { activeWorkspace, activeWorkspaceId, activeProduct, productsVisible } = useWorkspace();
  /*
   * The P-109 "Nothing is running. This is the last run" block that stood
   * here left on 2026-09-08: the Now card at the top of the work says the
   * same fact in its own register, the footer says it again, and three
   * statements about one moment was the defect the card was built to remove.
   */

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
   * ── WHAT IS OPEN LIVES IN THE URL, NOT IN A `useState` (P-24) ───────────
   *
   * It was component state, which made the pane's contents unshareable and
   * unreloadable: a person who found the thing worth showing somebody could
   * send them the run and a sentence about which row to press.
   *
   * `replace: true` because picking an artifact is not a place you go, it is
   * what you are looking at. Pushing would make Back walk one entry per chip
   * pressed, so leaving the run would take eleven presses.
   */
  const openArtifact = React.useCallback(
    (artifactId: string | null) => {
      void navigate({
        search: (prev) => ({ ...prev, artifact: artifactId ?? undefined }),
        replace: true,
      });
    },
    [navigate],
  );

  /*
   * ── THE TRANSCRIPT ROW THE PERSON PICKED (founder, 2026-09-02 19:25) ─────
   *
   * The run screen has no station display any more. The right pane shows what
   * the SELECTED transcript row filed, and the selection has to live here
   * because the control is a row in the left pane and the thing it changes is in
   * the right one. Null means nobody has picked, and the pane opens on the
   * newest thing the run made.
   *
   * `GotYou`'s chips set the same state, so the two ways in are one pointer
   * rather than two that can disagree.
   */
  const selected = artifact ?? null;
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
    /* An address that is not a run id cannot be read as one, and asking anyway
       is what produced five failures for one mistake. */
    enabled: isRunId,
  });
  const track = trackQ.data ?? null;

  /*
   * ── THE SHELL FOLLOWS THE OBJECT (Lane 1 ruling, 2026-09-08) ────────────
   *
   * Seen live: a Helio Labs run opened by address while the switcher held
   * another workspace, and the page drew the run in full under the wrong
   * name, with the top bar describing the other workspace's day. A run's
   * address is the person's intent, so arriving on one switches the shell to
   * its workspace; every live read keys on the active id, so the frame then
   * tells the truth on its own. Once per run, and only when they differ.
   */
  const { setActiveWorkspaceId } = useWorkspace();
  const switchedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!track?.workspaceId || switchedFor.current === track.id) return;
    switchedFor.current = track.id;
    if (track.workspaceId !== activeWorkspaceId) setActiveWorkspaceId(track.workspaceId);
  }, [track?.id, track?.workspaceId, activeWorkspaceId, setActiveWorkspaceId]);

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
    enabled: isRunId,
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
   * ── THE ROAD, IN THE HEADER (2026-09-08) ────────────────────────────────
   *
   * The run screen's one station display, and it is the Journey: seven stops
   * as a flow, each saying what it made, the current one in the register the
   * state decides, alive while a seat works. Pressing a stop opens what that
   * station made on the right, through the same URL pointer the transcript
   * rows and the proof panel use, so there is still one pointer.
   *
   * Reads off the two cache entries the panes already poll; no new fetch.
   */
  const fArtifacts = useServerFn(getTrackArtifacts);
  const artifactsQ = useQuery({
    queryKey: ["track-artifacts", trackId],
    queryFn: () => fArtifacts({ data: { trackId } }),
    staleTime: 10_000,
    enabled: !!track,
  });
  const fActivity = useServerFn(getTrackActivity);
  const activityQ = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fActivity({ data: { trackId } }),
    staleTime: 5_000,
    enabled: !!track,
  });
  const liveSince = React.useMemo(() => {
    const turns = activityQ.data?.turns ?? [];
    const live = turns.filter((t) => t.outcome === "working");
    return live.length > 0 ? live[live.length - 1]!.at : null;
  }, [activityQ.data]);
  const horizon = horizonFromStops(artifactsQ.data?.stops);
  /*
   * THE ROAD CARRIES WHO IS WORKING WHERE, the same way the home's does
   * (Lane 1, b43d45f4d): the seats from the running-now key, each in the
   * colour AgentPresence gives it everywhere else. A seat with no station of
   * its own works where the track stands.
   */
  const liveAgents = useLiveAgents();
  const seatsHere = React.useMemo(
    () =>
      liveAgents.working
        .filter((a) => a.trackId === trackId)
        .map((a) => ({ seat: a.name, station: a.station ?? track?.station ?? null })),
    [liveAgents.working, trackId, track?.station],
  );
  const stations = React.useMemo(
    () =>
      withPresences(
        journeyStations({
          stops: artifactsQ.data?.stops,
          track: track
            ? { station: track.station, status: track.status, holdReason: track.holdReason }
            : null,
          route: track?.route.path ?? null,
          live: crewLive,
          liveSince,
          horizon,
          gradableBySource: null,
          nowMs: Date.now(),
        }),
        seatsHere,
        presenceColour,
      ),
    [artifactsQ.data?.stops, track, crewLive, liveSince, horizon, seatsHere],
  );
  const openedStation = React.useMemo<AgentStation | null>(() => {
    if (!artifact) return null;
    for (const stop of artifactsQ.data?.stops ?? []) {
      if (stop.items.some((i) => i.artifactId === artifact && !i.missing)) return stop.station;
    }
    return null;
  }, [artifact, artifactsQ.data?.stops]);
  /* A stop pressed with nothing to open: the pane shows that station's own
     state rather than ignoring the press. Cleared when an artifact opens. */
  const [peek, setPeek] = React.useState<AgentStation | null>(null);
  const activeStation = openedStation ?? peek ?? track?.station ?? null;
  const copySummary = useCopyRunSummary(trackId);

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

  /*
   * ONE DEAD SESSION, SAID ONCE, ON A WHOLE PAGE (P-15, adopting the
   * component S3 and S1 already built for Brain, the settings boundary pane
   * and /learn, rather than a fourth copy). `trackQ` is the page's own read;
   * a dead session fails it and every panel `TrackRunLeft`/`TrackPaneRight`
   * mount beneath it identically, so this is a page-level fact and checking
   * the one read this route already makes is enough -- see the component's
   * own header for why per-panel honesty is the wrong call here.
   */
  const sessionEnded = endedSessionFor(trackQ.error);
  if (sessionEnded) {
    return (
      <SessionEnded title="This piece of work" error={trackQ.error}>
        Nothing about this run has changed while you were away.
      </SessionEnded>
    );
  }

  /*
   * SETTLED WITH NO ROW (fifth review, 2026-09-09), and it must be a return
   * rather than a heading.
   *
   * `getTrack` reads with `maybeSingle()` and answers null for a stale address,
   * a mistyped id, or a run in a workspace RLS will not show this person. The
   * header said "That work could not be found." and then mounted both panes on
   * the same id underneath it: the Now card settled on "Reading this run." and
   * stayed there, and the artifact pane printed the same sentence again in the
   * failed-read mood. Two surfaces contradicting the header about one id, and
   * `RunFooter` renders only with a track, so the page had no door on it at
   * all.
   *
   * Said once, with a way onward, and the panes stay unmounted so nothing
   * beneath claims to be reading a run that is not there. It sits AFTER the
   * dead-session return because a dead session is the more specific fact and
   * has its own door.
   */
  /*
   * ── THE RUN'S OWN READ FAILED, SO THE PAGE SAYS IT ONCE ──────────────────
   *
   * Reported by the founder, 2026-09-09, with a screenshot. The header already
   * said "This run could not be read." correctly and exactly once -- and then
   * the page MOUNTED THE PANES ANYWAY, and each of them honestly reported its
   * own failed read in its own words. Five messages for one cause, four of them
   * red:
   *
   *   This run could not be read.                                  (this route)
   *   The questions this run is waiting on could not be read...    (TrackConsent)
   *   Out of touch. This screen has lost sight of the run.         (the drive card)
   *   The activity did not come back...                           (TrackActivity)
   *   The record did not come back...                              (ArtifactPane)
   *
   * Every component is correct on its own. This is the compose-time defect the
   * repo already has a guard for one layer down: two correct parts, one screen,
   * and nothing owning what they add up to. A person who has lost a read is
   * told four times that nothing here is trustworthy, which reads as a platform
   * coming apart rather than as one request that did not answer.
   *
   * SO THE PANES DO NOT MOUNT. Their own error states are right when only THAT
   * pane failed; they are wrong when the run itself could not be read, because
   * then they are all saying one thing. The page keeps the sentence and adds
   * the control it was missing -- a retry, which is the whole remedy for a
   * transient read and was the one thing the wall of red did not offer.
   *
   * AND IT IS TRANSIENT. Read live twice today on two different tracks, and
   * both recovered on a retry, so this state is reached by a healthy run on a
   * slow beat rather than by a broken one.
   */
  if (trackQ.isError) {
    return (
      <div className="mrd-workbench">
        <header className="mrd-workbench-header">
          <PageHeading
            title="This run could not be read."
            sub="The run itself is untouched and still whatever it was a moment ago. This screen just could not read it."
          />
        </header>
        <div className="min-h-0 overflow-y-auto">
          <ReadFailed
            error={trackQ.error as Error}
            onRetry={() => {
              /* Every key this page reads, not only the one that reported:
                 the panes were refused too and a retry that leaves them stale
                 would redraw the same wall the moment they mount. */
              for (const key of [
                ["spine-track", trackId],
                ["track-artifacts", trackId],
                ["track-activity", trackId],
                ["spine-track-chain", trackId],
                ["track-gates", trackId],
              ]) {
                void qc.invalidateQueries({ queryKey: key });
              }
            }}
          >
            Nothing below this is the run, so it is not drawn rather than drawn wrong.
          </ReadFailed>
        </div>
      </div>
    );
  }

  /*
   * ONE PAGE FOR BOTH, and they are the same thing to the person: an address
   * that does not reach a run. The sub says which, because the two want
   * different next moves -- a stale link is somebody else's to fix, a truncated
   * one is fixed by going and getting the whole thing.
   */
  if (!isRunId || (trackQ.isSuccess && track === null)) {
    return (
      /* No `data-page-composer` here, unlike the run itself below: that
         attribute stands the ask dock down because the page carries its own
         composer, and this one carries none. Taking the dock away would leave
         the reader with no way to ask anything at all. */
      <div className="mrd-workbench">
        <header className="mrd-workbench-header">
          <PageHeading
            title="That work could not be found."
            sub={
              isRunId
                ? "The address may be out of date, or the work belongs to another workspace. Nothing you were working on is affected."
                : "That address is not a run's, so there was nothing to look up. A run's address ends in a long id; this one looks cut short. Nothing you were working on is affected."
            }
          />
        </header>
        <div className="min-h-0 overflow-y-auto">
          <NothingHere
            action={
              <Action variant="primary" onClick={() => navigate({ to: SIGNED_IN_HOME })}>
                Open your runs
              </Action>
            }
          >
            Every run you can open is on Home.
          </NothingHere>
        </div>
      </div>
    );
  }

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
              more={
                <MoreMenu label="More for this run">
                  <MoreItem onClick={() => void copySummary.copy()}>Copy a summary</MoreItem>
                </MoreMenu>
              }
            />
            {copySummary.copied ? (
              <p role="status" aria-live="polite" className="mrd-meta mt-mrd-2">
                {copySummary.copied}
              </p>
            ) : null}
            {stations.length > 0 ? (
              <Journey
                size="full"
                label="Where this work is on its road"
                stations={stations}
                active={activeStation}
                onSelect={(key) => {
                  const id = newestArtifactAt(artifactsQ.data?.stops, key);
                  if (id) {
                    setPeek(null);
                    openArtifact(id);
                  } else {
                    setPeek(key);
                    openArtifact(null);
                  }
                }}
                className="mt-mrd-5"
              />
            ) : null}
            <GateBanner trackId={trackId} />
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
             * empty queue. Three states, and they are three different things:
             * still reading, could not read, and genuinely absent.
             *
             * FIFTH REVIEW, 2026-09-09: the third leg moved out of this ternary
             * and into its own early return above, because a missing run has
             * nothing to draw beneath it and needed a door. Two legs left, and
             * the point that survives is the one this comment was written for:
             * a failed read is not a missing run.
             */
            title={trackQ.isLoading ? "This piece of work" : "This run could not be read."}
            /*
             * ── FIVE REGIONS EACH ANNOUNCED THEIR OWN READ, AND THIS WAS THE
             *    ONE THAT SAID LEAST ────────────────────────────────────────
             *
             * Read on the served build, arriving cold at `d1168015`:
             *
             *   here                This piece of work / Reading the run.
             *   the consent card    Checking whether this run needs you.
             *   the Now card        [Reading]
             *   the transcript      Reading what happened.
             *   the artifact pane   Reading what this work has made.
             *
             * Five, and every one correct on its own -- the defect that exists
             * only BETWEEN elements, which no guard here can see because each
             * asserts about a thing rather than about a thing and its
             * neighbour.
             *
             * THE PANES ARE NOT HELD BACK, and the first attempt held them.
             * `a-null-under-a-heading-is-a-broken-promise` refused it and was
             * right: a heading over an empty field reads as "this is empty",
             * not "this is loading". It is also the principle this product
             * already states one level up, in `_authenticated.tsx` -- the tree
             * keeps its shell and waits inside the work region. The run screen
             * keeps its panes for the same reason.
             *
             * So the PAGE stops narrating on top of them. Each region below
             * says what IT is reading, which is more specific than this was,
             * and each is the only thing waiting in some other state -- so
             * deleting theirs would make those states silent, which is the hole
             * S1 and I made once already by trimming one sentence from both
             * sides. The title still holds its place across every state, so
             * nothing moves when the panes fill in.
             */
            sub={
              trackQ.isLoading
                ? undefined
                : "The run itself is untouched and still whatever it was a moment ago. This screen just could not read it."
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
            selectedArtifactId={selected}
            onSelectArtifact={openArtifact}
          />
        </div>
        <div className="mrd-workbench-pane mrd-workbench-pane--artifact">
          <TrackPaneRight
            trackId={trackId}
            isRunning={crewLive}
            settled={track ? track.status !== "open" : false}
            activeArtifactId={selected}
            onOpenArtifact={openArtifact}
            stationOverride={openedStation ? null : peek}
          />
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
          /*
           * THE SENTENCE, SO A SETTLED RUN HAS SOMEWHERE TO GO. Measured live:
           * 43 of 63 runs are abandoned and the footer drew no control on any of
           * them. The door carries this title into the composer; the person's
           * Enter is still what starts anything. See `footer-mode.ts`'s `again`.
           */
          title={track.title}
          /*
           * P-37. A track at Learn on a horizon that has not arrived is waiting
           * on the CALENDAR, and this bar was calling it "Stopped, and not on
           * you." beside a "Run it now" that cannot move a date. With the
           * station the footer can tell that state apart.
           *
           * `returnsOn` IS NOT PASSED, deliberately. Nothing on `Track` carries
           * the forecast's horizon date: `tracks-feed` found the same thing and
           * wrote it down ("the date did not come free"). So the footer says
           * "Learn returns when the forecast comes due", which is true, rather
           * than a date nobody read. The dated sentence lands when a reader for
           * it exists, and inventing "soon" in the meantime is the substitution
           * this repo keeps paying for.
           */
          station={track.station}
          /*
           * P-37. The card two inches above says "The forecast comes due Sat,
           * Oct 3" and this bar said "Learn returns when the forecast comes
           * due": two lines about one date, one of which knew it.
           *
           * READ OFF THE PANE'S OWN CACHE ENTRY, not a second query.
           * `["track-artifacts", trackId]` is the key `TrackRun` already polls,
           * so this is one fact with two readers rather than two reads that can
           * drift, which is the discipline `GateBanner` states for the same
           * situation ("a second DOOR onto one fact, not a second fact").
           *
           * Null while that read is in flight or on a track that never reached
           * Decide, and the footer says the undated sentence, which is true.
           */
          returnsOn={horizonAsDate(
            horizonFromStops(
              qc.getQueryData<{ stops?: Parameters<typeof horizonFromStops>[0] }>([
                "track-artifacts",
                trackId,
              ])?.stops,
            ),
          )}
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
