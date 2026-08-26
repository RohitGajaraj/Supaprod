/**
 * Who is working on this right now, who worked on it before, and what came out.
 *
 * FOUNDER RULING 2026-08-01: "if some agents are working, there should be some
 * scope for showing visually that this agent is what, after this particular
 * agent it switched to next agent, this is the outcome. Something like Claude
 * Code or Copilot or Codex... so the user knows what is happening."
 *
 * THE REFERENCE, named before building. Claude Code's transcript: a flat
 * chronological stream, one actor per entry, each stamped with what it touched
 * and what came back. No progress bar, no percentage, no spinner with a noun
 * attached. What is borrowed is the INFORMATION MODEL, not the chrome:
 *
 *   who acted  ->  what they did  ->  what you now have
 *
 * WHAT IS ADDED, because this product has stations and Claude Code does not:
 * the HANDOFF. The moment one agent finishes and the next picks the work up is
 * the product's entire claim, and until now it happened silently in a cron.
 *
 * IT NEVER INVENTS A STATUS. Every line is derived from a row the run wrote
 * itself. "Working" is only said when the run row literally says `running`, and
 * a turn that filed nothing says so plainly rather than being dressed up as
 * progress.
 *
 * ── A TURN IS A UNIT OF WORK WITH A COST AND A RESULT (2026-08-25) ───────
 * It listed what happened and it did not make a turn LEGIBLE as a piece of work.
 * Three things were missing and each one is now on the row:
 *
 *   THE ROLLUP. Devin closes every turn with *"Worked for 11s · Thought for 9s ·
 *   7/7 Test the app end-to-end"*; Relevance AI puts the same facts in a details
 *   rail. `RunRollup` is that line, and every figure in it is a column:
 *   `agent_runs.duration_ms` and `agent_runs.tokens_used`, both refused when
 *   they are zero, because a zero on either is a finalizer that did not write
 *   rather than a turn that cost nothing. `Turn.tookMs` carries the counts.
 *
 *   THE PROOF. A row saying *"Draft filed a spec"* is the agent's account of
 *   itself. `RunArtifact` is the record's: the kind's mark, the product's word,
 *   and the artifact's own title, read off its own table by the chain query this
 *   subscribes to alongside the pane.
 *
 *   THE REFUSAL, AND IT IS THE ONE THAT MATTERS. See `chipOf`.
 *
 * DRAWN IN THE ONE RUN VOCABULARY (2026-08-25, item 11). `run-rows.tsx` was
 * ported from beautifului.dev and reached by nothing while three surfaces drew
 * three transcripts; this now composes it -- glyph, rail, subject, clock --
 * so one rhythm carries every run view. Motion follows R-20 §4: an arrival
 * animates ONCE on `--mrd-d-enter`, nothing else moves, and every duration on
 * this file is a token. A live turn's elapsed figure ticks through
 * `useElapsed` with the WORK's start time, never the component's.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackActivity, getTrackChain } from "@/lib/spine/track.functions";
import { countKinds, type Turn } from "@/lib/spine/activity";
import { handoffLine, turnsAtStation, whatCameWith } from "@/components/spine/handed-over";
import { mergeActivityRows } from "@/components/spine/activity-rows";
import type { AgentStation } from "@/lib/agent-vocabulary";
import { GLYPH_FOR_STATION, type StationGlyphKind } from "@/components/meridian/station-glyphs";
import {
  RUN_LINE,
  RUN_ROW,
  RUN_STACK,
  RunArtifact,
  RunClock,
  RunGlyph,
  RunMeta,
  RunNote,
  RunRail,
  RunRollup,
  RunSubject,
  RunTook,
  formatElapsed,
} from "@/components/meridian/run-rows";
import { StatusChip } from "@/components/meridian/StatusChip";
import { useElapsed } from "@/components/meridian/use-elapsed";
import { Reading, ReadFailedLine, RecordSpeaks } from "@/components/meridian/surface-parts";

/** One map, so a station's slug and its drawing cannot disagree. */
function glyphForStation(s: AgentStation | null): StationGlyphKind | undefined {
  return s ? GLYPH_FOR_STATION[s] : undefined;
}

/** What a turn's artifacts are actually called, keyed by id. */
export type TitleBook = Map<string, { title: string | null; missing: boolean }>;

/*
 * ── THE THREE BELOW ARE EXPORTED FOR THE GUARD, AND ONLY FOR IT ─────────
 * Each one is the whole verdict of a row -- what it says, whether it wears a
 * chip, what it cost -- and each is pure, taking a `Turn` and returning words or
 * markup. Reaching them through the component would mean standing up a query
 * client and two mocked server functions to assert a sentence, which is how a
 * guard ends up testing its own scaffolding. `ArtifactPane` exports `TaskSteps`
 * and `MissionCard` for the same reason and set the precedent.
 */
/**
 * How a finished turn reads, in verbs rather than status words.
 *
 * ── THE OUTCOME COMES FIRST WHEN THE OUTCOME IS BAD ─────────────────────
 * This used to test `made.length` before it tested `stopped`, so a run that
 * filed something and was then stopped read as *"Studio filed a code change"*
 * and the stop survived only in a chip. Both facts are true and they are not
 * equally urgent, so the sentence carries both in the order a reader needs
 * them, and nothing is left for a chip alone to say.
 *
 * "Filed nothing" is its own ending rather than a clause tacked to a status
 * word, because it is the single fact the record is surest about: it is a join
 * against `spine_track_members`, and no agent can write it.
 */
export function headline(t: Turn): string {
  if (t.outcome === "working") return `${t.agentName} is working`;
  if (t.outcome === "waiting") return `${t.agentName} is queued`;
  if (t.outcome === "stopped") {
    return t.made.length
      ? `${t.agentName} was stopped after filing ${countKinds(t.made)}`
      : `${t.agentName} was stopped, filing nothing`;
  }
  if (t.made.length) return `${t.agentName} filed ${countKinds(t.made)}`;
  return `${t.agentName} filed nothing`;
}

/*
 * A chip only where there is something to say. Most rows of a healthy run are
 * done, and a column of chips saying so buries the one row that is not -- the
 * same argument ToolStream states for its own stream. Green is never used for
 * "still working": azure (`agent`) is the only tone that means now.
 *
 * ── THE ROW THAT USED TO CARRY NO CHIP AT ALL, AND HAD TO ───────────────
 * `completed_with_failures` maps to `partly`, and `partly` fell through to
 * `null`. So a seat that hit a locked door -- ran, admitted failures on its own
 * row, and filed nothing -- rendered as a plain grey line, indistinguishable
 * from a station that had simply had nothing to add. Live on track
 * `7977dc06`: the Build seat came back with *"Repository access failed: GitHub
 * 404. I cannot proceed"* and the transcript drew a neutral entry.
 *
 * The chip is `fail` and the discriminator is TWO INDEPENDENT RECORDS AGREEING:
 * the run's own status says something inside it failed, AND the members join
 * says nothing came out. Either alone is the common healthy case and would make
 * the chip noise rather than signal, which is not a hypothetical --
 * `completed_with_failures` is 810 of the 2,272 track-linked runs on production
 * and most of them filed their work, while a clean `completed` that files
 * nothing is the Critique and Verify seats doing their job, which is a verdict
 * and not a failure. Chipping either would bury the row this exists to surface.
 *
 * ── WHAT IS DELIBERATELY NOT READ ───────────────────────────────────────
 * The agent's own sentence. F-54 is why: a seat's narrative disagreed with its
 * own tool calls on every track since the checking seat existed, and a
 * transcript that graded turns by their prose would inherit every one of those
 * lies and re-publish it as a verdict. The prose is still shown, verbatim, one
 * line down, next to the record -- so a reader can see the disagreement rather
 * than be handed this file's opinion of it.
 */
export function chipOf(t: Turn) {
  if (t.outcome === "working")
    return (
      <StatusChip status="agent" pulse>
        Working
      </StatusChip>
    );
  if (t.outcome === "waiting") return <StatusChip status="hold">Queued</StatusChip>;
  if (t.outcome === "stopped") return <StatusChip status="fail">Stopped</StatusChip>;
  if (t.outcome === "partly" && t.made.length === 0)
    return <StatusChip status="fail">Nothing filed</StatusChip>;
  return null;
}

/** The live turn's age, ticking. Reports the WORK, not the component. */
function LiveTook({ startedAt }: { startedAt: number }) {
  const elapsed = useElapsed(startedAt);
  return <RunTook>{`Working for ${elapsed}`}</RunTook>;
}

/**
 * Whether a crew is genuinely mid-visit, read only off run rows (queue 71).
 *
 * A seat whose row says `running` or `queued` is the record claiming work is
 * open RIGHT NOW, and nothing else in the payload may stand in for it: an open
 * unheld track is also what an idle track looks like between sweeps, so
 * deriving "at work" from anything less would pulse at silence. Exported for
 * the guard, like headline and chipOf above.
 */
export function hasLiveVisit(turns: Array<Pick<Turn, "outcome">>): boolean {
  return turns.some((t) => t.outcome === "working" || t.outcome === "waiting");
}

/**
 * Every figure and every artifact this turn amounted to, in one line.
 *
 * ONE PLACE FOR A DURATION ON A ROW, live or finished. The elapsed figure used
 * to sit up on the subject line while a settled duration had nowhere to go at
 * all, which is the same defect `run-rows.tsx` records against `RunTimeline`:
 * one idea rendered in two slots depending on which branch a row took.
 *
 * A missing figure contributes NOTHING rather than a placeholder, and that is
 * the honest half. `duration_ms` is null or a hardcoded zero on 917 of the
 * 2,272 track-linked runs and `tokens_used` is zero on 570, so an incomplete
 * rollup is the normal case, not the edge one. `RunRollup` drops falsy items so
 * a hole never prints as a stray separator.
 */
export function rollupOf(t: Turn, titles: TitleBook): React.ReactNode[] {
  const took =
    t.outcome === "working" ? (
      <LiveTook key="took" startedAt={Date.parse(t.at)} />
    ) : t.tookMs != null ? (
      <RunTook key="took">{`Worked for ${formatElapsed(t.tookMs / 1000)}`}</RunTook>
    ) : null;

  // `toLocaleString` rather than a hand-built grouping: 65732 is unreadable and
  // `65,732` is wrong in every locale that groups with a space or a full stop.
  const tokens =
    t.tokens != null ? (
      <RunTook key="tokens">{`${t.tokens.toLocaleString()} tokens`}</RunTook>
    ) : null;

  const made = t.made.map((m) => {
    const known = titles.get(m.id);
    return (
      <RunArtifact
        key={m.id}
        kind={m.kind}
        word={m.word}
        title={known?.title ?? null}
        missing={known?.missing ?? false}
      />
    );
  });

  return [took, tokens, ...made];
}

export function TrackActivity({
  trackId,
  isRunning = false,
  onLiveChange,
}: {
  trackId: string;
  isRunning?: boolean;
  /**
   * QUEUE 71: tells the host whether a crew is genuinely here, so the WHOLE
   * pane can poll at visit speed. The sweep serves tracks with no local
   * mutation to watch -- nothing on this screen was pressed -- so the
   * payload's own running rows are the only honest "someone is working"
   * signal there is. When they are absent this reports false and nothing
   * pulses, which is the correct answer for an idle track.
   */
  onLiveChange?: (live: boolean) => void;
}) {
  const fetchActivity = useServerFn(getTrackActivity);
  const fetchChain = useServerFn(getTrackChain);
  const q = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fetchActivity({ data: { trackId } }),
    refetchInterval: (query) => {
      // Visit speed while a crew is here -- from THIS payload's running rows
      // (queue 71), not only from a press this screen made. The sweep serves
      // tracks nobody has touched, and its work deserves the same liveness.
      const turns = (query.state.data?.turns ?? []) as Array<Pick<Turn, "outcome">>;
      return isRunning || hasLiveVisit(turns) ? 500 : 10_000;
    },
  });

  /*
   * QUEUE 71: the live fact, read once and used three ways -- this
   * component's own poll speed, the chain query beside it, and lifted to the
   * host so panes that cannot see run rows can follow. The transcript is
   * where "is a crew here" is provable: only run rows may say so.
   */
  const live = React.useMemo(() => hasLiveVisit(q.data?.turns ?? []), [q.data]);
  React.useEffect(() => {
    onLiveChange?.(live);
  }, [live, onLiveChange]);

  /*
   * WHAT THE ARTIFACTS ARE CALLED, AND WHY THIS COSTS NOTHING EXTRA.
   *
   * `spine_track_members` records a kind and an id and no name, so the title
   * has to come from the artifact's own table, and the column it lives in is
   * different for every kind (a prototype has `name`, a learning has `summary`).
   * `getTrackChain` already does exactly that resolution, including the part
   * that matters most here: it separates *we looked and the row is gone* from
   * *we did not look*, so a chip can say "no longer on file" without ever
   * saying it because a query happened to error.
   *
   * THE KEY AND THE OPTIONS ARE `ArtifactPane`'S, TO THE CHARACTER, and that is
   * the point rather than a coincidence. Both panes are on `/track/:id` at
   * once, so an identical `queryKey` and an identical `refetchInterval` mean
   * TanStack serves both from one cache entry and one request. A key of this
   * component's own would have doubled the read on a 500ms poll during a live
   * run, which is the cost this transcript is least entitled to add.
   */
  const chainQ = useQuery({
    queryKey: ["spine-track-chain", trackId],
    queryFn: () => fetchChain({ data: { trackId } }),
    refetchInterval: isRunning || live ? 500 : 10_000,
  });

  const titles = React.useMemo<TitleBook>(() => {
    const book: TitleBook = new Map();
    const chain = chainQ.data?.chain;
    if (!chain) return book;
    for (const stop of chain.stops) {
      for (const m of stop.members) book.set(m.artifactId, { title: m.title, missing: m.missing });
    }
    // Orphans are members whose station this build does not know. They are still
    // things this track filed, so they keep their names.
    for (const m of chain.orphans) book.set(m.artifactId, { title: m.title, missing: m.missing });
    return book;
  }, [chainQ.data]);

  /*
   * ARRIVALS ANIMATE, THE FIRST PAINT DOES NOT. Every run id present when the
   * first page of data lands goes into `seen` un-animated: a transcript of
   * twenty rows playing one entrance is noise, not movement. An id that shows
   * up on a LATER poll was not on screen before -- that is an event, and it
   * gets the entrance once, then joins `seen`.
   */
  const seen = React.useRef<Set<string>>(new Set());
  const primed = React.useRef(false);
  const rows = React.useMemo(
    () => mergeActivityRows(q.data?.turns ?? [], q.data?.transitions ?? []),
    [q.data],
  );
  React.useEffect(() => {
    if (!q.data) return;
    if (!primed.current) {
      for (const r of rows) seen.current.add(r.key);
      primed.current = true;
      return;
    }
    const keys = rows.map((r) => r.key);
    const timer = window.setTimeout(() => {
      for (const k of keys) seen.current.add(k);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [q.data, rows]);

  /*
   * FOLLOW THE WORK, POLITELY. Newest entries now land at the BOTTOM, so the
   * reading position that shows the live entry is the end of the scroll. On
   * every arrival: if the person is already near the end, keep them there; if
   * they scrolled up to reread, leave them alone. The distance test runs
   * against whichever ancestor actually scrolls, found at call time -- this
   * component owns neither the pane nor its overflow.
   */
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const followLive = React.useCallback(() => {
    const el = endRef.current;
    if (!el || typeof el.scrollIntoView !== "function") return;
    const scroller = el.closest(".mrd-workbench-pane");
    if (scroller) {
      const box = scroller as HTMLElement;
      const distance = box.scrollHeight - box.scrollTop - box.clientHeight;
      // jsdom and zero-size layouts report 0 everywhere, which reads as "at the
      // bottom" -- the safe default for a guard like this.
      if (distance > 200) return;
    }
    el.scrollIntoView({ block: "nearest" });
  }, []);
  React.useEffect(() => {
    if (!q.data) return;
    followLive();
  }, [q.data, rows.length, followLive]);

  if (q.isLoading) return <Reading>Reading what happened.</Reading>;
  if (q.isError)
    return (
      // The LINE half of the failed-read pair, not the boxed one: this renders
      // inside a region that already draws its own container, and the standard
      // caps a region at one bordered box.
      <ReadFailedLine>
        The activity did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );

  const turns = q.data?.turns ?? [];
  // NOT "no agent has worked on this yet", which is a claim this cannot support.
  // Runs only carry a track from the day `track_id` was added, so work done
  // before that is real and unlinked, and saying it never happened would be
  // exactly the invention this view exists to refuse. Deliberately silent on the
  // reason: an unlinked history and a genuinely new track are indistinguishable
  // here, and a made-up reason is worse than a plain absence.
  if (!turns.length) {
    return (
      <RecordSpeaks>
        Nothing is recorded against this work yet. Activity appears here as agents run.
      </RecordSpeaks>
    );
  }

  /*
   * OLDEST FIRST -- a transcript reads top to bottom like one (THE-ONE-SCREEN:
   * "newest last, the live entry still ticking"). `mergeActivityRows` sorts
   * newest first because its marker logic thinks in recency; reversing at the
   * render boundary keeps that logic untouched. The rail now grows DOWNWARD
   * through the work and stops under the newest entry, which is the honest
   * direction: the line ends where the record ends.
   */
  const ordered = [...rows].reverse();

  return (
    <>
      {/*
       * THE TRANSCRIPT IS A LOG, and that is a role rather than a decoration.
       * This file polls every ten seconds, so without it every arrival was silent
       * to a screen reader. `role="log"` announces ADDITIONS only, so a
       * transcript that grows long does not read the whole column out each time
       * one entry lands. `aria-live="polite"` is explicit for browser compatibility,
       * and `aria-busy` announces when agents are working (queue 71).
       */}
      <div
        role="log"
        aria-label="What the agents did, in order"
        aria-live="polite"
        aria-busy={live}
      >
        <ol className={RUN_STACK}>
          {ordered.map((row, i) => {
            if (row.kind === "move") {
              // WHO CAUSED THIS LEG (queue 65). press names the person, sweep
              // names the loop, continuation says it carried on alone. Rows
              // with no provable driver never reach this list at all.
              const arrived = primed.current && !seen.current.has(row.key);
              return (
                <li
                  key={row.key}
                  className={RUN_ROW}
                  style={
                    arrived
                      ? { animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both" }
                      : undefined
                  }
                >
                  <RunClock at={row.at} />
                  <span className="flex flex-col items-center self-stretch">
                    <RunGlyph kind="station" station={glyphForStation(row.to as AgentStation)} />
                    {i === ordered.length - 1 ? null : <RunRail />}
                  </span>
                  <span className="min-w-0 pb-1">
                    <span className={RUN_LINE}>
                      <RunSubject>{`Moved to ${row.toName}`}</RunSubject>
                    </span>
                    <RunMeta>{row.line}</RunMeta>
                  </span>
                </li>
              );
            }

            const t = row.turn;
            // The handoff. Marked when the station changes from the turn that
            // ran BEFORE this one chronologically -- in oldest-first order that
            // is the previous TURN upward from here, skipping move markers,
            // which are not seats.
            let previous: Turn | undefined;
            for (let j = i - 1; j >= 0; j--) {
              const r = ordered[j];
              if (r.kind === "turn") {
                previous = r.turn;
                break;
              }
            }
            const handedOver =
              Boolean(t.stationName) && previous != null && previous.stationName !== t.stationName;

            /*
             * WHAT CAME WITH IT. The mark and the sender were already here; the
             * thing that changed hands never was, and that is the half a person
             * needs. Read from the whole stretch the previous station ran, not
             * from the turn immediately before the move, which is very often the
             * one that checked the work rather than the one that produced it.
             *
             * The slice is O(rows) inside a map over rows. A transcript is tens
             * of entries and this keeps the tested derivation as the only copy
             * of the rule; a hand-rolled backward walk here would be a second.
             */
            const handedLine =
              handedOver && previous?.stationName
                ? handoffLine(
                    previous.stationName,
                    whatCameWith(
                      turnsAtStation(
                        ordered.slice(0, i).flatMap((r) => (r.kind === "turn" ? [r.turn] : [])),
                        previous.stationName,
                      ),
                    ),
                  )
                : null;

            const arrived = primed.current && !seen.current.has(row.key);

            return (
              <li
                key={row.key}
                className={RUN_ROW}
                style={
                  arrived
                    ? { animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both" }
                    : undefined
                }
              >
                <RunClock at={Date.parse(t.at)} />

                {/* The rail stops on the last row of the STREAM, which in
                    reading order is the NEWEST entry: a line continuing past it
                    claims another one is already coming. */}
                <span className="flex flex-col items-center self-stretch">
                  <RunGlyph
                    kind={handedOver ? "handoff" : "station"}
                    station={handedOver ? undefined : glyphForStation(t.station)}
                  />
                  {i === ordered.length - 1 ? null : <RunRail />}
                </span>

                <span className="min-w-0 pb-1">
                  <span className={RUN_LINE}>
                    <RunSubject>{headline(t)}</RunSubject>
                    {chipOf(t)}
                  </span>

                  <RunMeta>
                    {[handedLine ?? t.stationName]
                      .filter(Boolean)
                      .join(" · ")}
                  </RunMeta>

                  <RunRollup items={rollupOf(t, titles)} />

                  {/* THE PLATFORM'S REASON, ABOVE THE AGENT'S. `halted_reason` and
                      `failure_kind` are written by the runtime rather than by the
                      seat, so when both are present the unfakeable one is read
                      first. It was on the row all along and no surface drew it:
                      a Build seat halted `out_of_credit` on this very track and
                      the transcript said only "Stopped". */}
                  {t.stopLine ? <RunNote>{t.stopLine}</RunNote> : null}

                  {/* The agent's own last line, trimmed and never rewritten.
                      One line is enough to tell whether it understood the job;
                      the full text lives on the run.

                      This printed through a sanitiser for four hours on
                      2026-08-26, because 1,375 of 2,771 `agent_runs.output`
                      rows carried an em dash the model had written. S0 wrapped
                      all seven write sites in `loop.server.ts` and backfilled
                      the stored rows; measured again after, every one of those
                      columns reads zero. Both conditions that bridge named for
                      its own removal were met, so it is gone rather than left
                      as a permanent no-op nobody dares delete. */}
                  {t.said ? (
                    <RunNote>{t.said.length > 160 ? `${t.said.slice(0, 160)}...` : t.said}</RunNote>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {/*
       * THE LIVE ENTRY STAYS IN VIEW (RUN-02). A transcript that grows at the
       * bottom while the viewport sits above it hides exactly the entries worth
       * watching, so when the reader is already near the end each arrival pulls
       * them back to it. Someone who scrolled up to reread is never dragged --
       * distance from the bottom past ~200px means they went somewhere on
       * purpose.
       */}
      <div
        ref={endRef}
        aria-hidden="true"
        style={{ height: 1 }}
        data-testid="transcript-end"
      />
    </>
  );
}
