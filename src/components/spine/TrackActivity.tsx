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
import { humanizeText } from "@/lib/ai/humanize";
import { plainProse } from "@/lib/plain-prose";
import { AgentMark } from "@/components/meridian/marks";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

import { getTrackActivity, getTrackChain } from "@/lib/spine/track.functions";
import { countKinds, type Turn } from "@/lib/spine/activity";
import { handoffLine, turnsAtStation, whatCameWith } from "@/components/spine/handed-over";
import { carriedByMission, oncePerId } from "@/components/spine/what-a-mission-carries";
import { howThisRan } from "@/components/track/how-this-ran";
import { getMission } from "@/lib/missions.functions";
import { type HandoffRow, mergeActivityRows } from "@/components/spine/activity-rows";
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
 * WHICH teammates are in flight, not merely whether any are.
 *
 * Same rule as `hasLiveVisit` above and deliberately built on the same two
 * outcomes, so the boolean and the list can never disagree about whether work is
 * open. SPEC-MULTIPLAYER-PRESENCE needs the identities: one acting is one
 * character, two or more are drawn each with its own colour and name.
 *
 * Deduped by slug because one seat can hold several rows in a visit, and a
 * person watching two teammates must not be shown four.
 */
export function liveSeats(
  turns: Array<Pick<Turn, "outcome" | "agentSlug" | "agentName">>,
): Array<{ slug: string | null; name: string; waiting: boolean }> {
  const seen = new Map<string, { slug: string | null; name: string; waiting: boolean }>();
  for (const t of turns) {
    if (t.outcome !== "working" && t.outcome !== "waiting") continue;
    const key = t.agentSlug ?? t.agentName;
    if (!key) continue;
    const prior = seen.get(key);
    // A seat with any waiting row is waiting; otherwise it is working.
    seen.set(key, {
      slug: t.agentSlug ?? null,
      name: t.agentName,
      waiting: (prior?.waiting ?? false) || t.outcome === "waiting",
    });
  }
  return [...seen.values()];
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
/**
 * The agent's own last line, as a person should read it.
 *
 * See the render site for why this exists and what ends it. In short: the model
 * writes em dashes into `agent_runs.output`, the write path still does, and this
 * is the repo's own `humanizeText` applied on the way out rather than a second
 * rule. Idempotent, so it no-ops on any row already clean.
 *
 * "Trimmed, never rewritten" still holds: punctuation moves, prose does not, and
 * the test beside this file compares the words before and after.
 */
export function saidLine(said: string | null | undefined): string | null {
  if (!said) return null;
  /* 92 of 2,805 `agent_runs.output` rows carry `**bold**`, and this is the line
     that renders them. Same tell as the dashes, one layer along. */
  const clean = plainProse(humanizeText(said)) ?? "";
  // Truncate AFTER cleaning, so the 160th character is one a person will see.
  return clean.length > 160 ? `${clean.slice(0, 160)}...` : clean;
}

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
  onLiveSeats,
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
  /** WHICH teammates are in flight, for the multiplayer presence case. */
  onLiveSeats?: (seats: Array<{ slug: string | null; name: string; waiting: boolean }>) => void;
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
   * WHO is in flight, for the presence slot. Same source and same rule as
   * `live` above, so the two cannot disagree. Keyed on the identities rather
   * than the array so a poll returning the same seats does not re-render the
   * presence block.
   */
  const seats = React.useMemo(() => liveSeats(q.data?.turns ?? []), [q.data]);
  const seatSig = seats.map((s) => `${s.slug ?? s.name}:${s.waiting ? "w" : "r"}`).join("|");
  React.useEffect(() => {
    onLiveSeats?.(seats);
    // `seatSig` is the value that matters; the array identity changes each poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatSig, onLiveSeats]);

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

  /*
   * THE REAL HANDOFFS, which have been written all along and never read.
   *
   * SESSION-1's first unit is "handoff made visible" because "the station
   * transition already IS a handoff and nothing says what was handed over".
   * The line beside the glyph below is INFERRED from a station changing between
   * turns; meanwhile `agent_messages` holds 143 rows of `kind = 'handoff'`, each
   * carrying the instruction the sender actually wrote.
   *
   * They look unreachable because all 143 have a null `track_id`. They are not:
   * they carry a `mission_id`, this track's missions are already in the chain as
   * members of kind "mission", and `getMission` already returns a mission's
   * messages with exactly these fields. Nothing new is needed on the server --
   * this is the brief's own "the default move is always: wire what exists".
   *
   * One query per mission, and a track holds one or two. Cached hard: a handoff
   * is written once and never edited, so re-reading it on the transcript's live
   * cadence would spend requests on a row that cannot change.
   */
  const missionIds = React.useMemo(() => {
    const chain = chainQ.data?.chain;
    if (!chain) return [] as string[];
    const ids = new Set<string>();
    for (const stop of chain.stops) {
      for (const m of stop.members) if (m.kind === "mission") ids.add(m.artifactId);
    }
    for (const m of chain.orphans) if (m.kind === "mission") ids.add(m.artifactId);
    return [...ids];
  }, [chainQ.data]);

  const fetchMission = useServerFn(getMission);
  const missionQs = useQueries({
    queries: missionIds.map((id) => ({
      queryKey: ["track-handoffs", id],
      queryFn: () => fetchMission({ data: { missionId: id } }),
      staleTime: 5 * 60_000,
    })),
  });

  /*
   * CALLS A PERSON ANSWERED ON THIS WORK.
   *
   * The line above the transcript reports how the work MOVED, and an answer is
   * not a move, so nothing in the transition record can see one. On `d1168015`
   * that gap is the whole story: 19 drives, every one the sweep, and three
   * calls a person decided mid-run. Without this read the honest version of
   * that line has to warn about its own blind spot forever.
   *
   * `agent_approvals` carries `mission_id` itself, so this is one read against
   * the missions already resolved above rather than a join through
   * `agent_runs`. Direct under RLS, the same pattern as the steer read below
   * and `ArtifactPane`'s `PrototypeCard`.
   *
   * `decided_at` IS THE TEST AND NOT `status`. R-18 forbids a person TOUCHING
   * the run; a call sitting unanswered in front of somebody is the loop asking,
   * which is allowed, and only the answer is the touch.
   *
   * A FAILED OR PENDING READ RESOLVES TO NULL, NEVER ZERO, and `howThisRan`
   * treats the two differently on purpose. Zero says nobody answered anything;
   * null says nothing at all. Drawing a slow query as zero would turn latency
   * into a claim of autonomy on the one screen where that claim is the product.
   */
  const answeredQ = useQuery({
    queryKey: ["track-answered-calls", trackId, missionIds.join(",")],
    enabled: missionIds.length > 0,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("agent_approvals")
        .select("id", { count: "exact", head: true })
        .in("mission_id", missionIds)
        .not("decided_at", "is", null);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    staleTime: 60_000,
  });
  const answeredCalls = missionIds.length === 0 ? null : (answeredQ.data ?? null);

  /*
   * WHAT THE PERSON SAID INTO THIS RUN.
   *
   * Track-scoped messages -- a steer typed into the composer -- carry a
   * `track_id` and no `mission_id`, so the mission read above cannot see them.
   *
   * THAT IS TRUE OF THE COMPOSER AND IT IS NOT TRUE OF EVERY STEER, which this
   * comment used to imply and which cost three of the four. Measured: of the 4
   * rows with `kind = 'steer'`, ONE carries a `track_id` (the composer's, and
   * the only one this query can see) and THREE carry a `mission_id` instead,
   * addressed to `builder`. Those three were already being fetched by the
   * mission read above and then discarded by a `kind === "handoff"` filter, so
   * a person who steered a mission got the same silence this query was written
   * to end. Both shapes are now kept and merged below.
   * `track.functions.ts` has two INSERTs for them and no SELECT anywhere, which
   * means the product has been recording a person's instructions and never
   * showing one back. After a reload there was no evidence on any screen that
   * the steer existed.
   *
   * Read directly through the browser client under RLS, which is the pattern
   * `ArtifactPane`'s `PrototypeCard` already uses for `prototypes` and
   * `prototype_files`. A server function would be the other option and is S0's
   * to add; this needs no new surface area and the row is the person's own.
   */
  const saidQ = useQuery({
    queryKey: ["track-said", trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_messages")
        .select("id,kind,from_agent_slug,to_agent_slug,payload,created_at,consumed_by_run_id")
        .eq("track_id", trackId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as HandoffRow[];
    },
    refetchInterval: isRunning || live ? 2_000 : 30_000,
  });

  /*
   * WHAT THE MISSIONS CARRY, WHICH IS HANDOFFS AND SOME OF THE STEERS.
   *
   * `kickoff` is deliberately not here, and this is the one judgement in this
   * block. Its payload is `{goal, priority, due}`, and the goal is already the
   * mission goal rendered on the artifact pane, so drawing it would put the
   * same sentence twice on one screen, which is the exact doubling `saidOnce`
   * exists to remove. `priority` and `due` appear nowhere else and are worth a
   * home; the transcript is not it, because a brief is not something that
   * HAPPENED to the work. 14 rows, all on missions.
   */
  const fromMissions = React.useMemo<HandoffRow[]>(
    () => missionQs.flatMap((q) => carriedByMission((q.data?.messages ?? []) as HandoffRow[])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [missionQs.map((q) => q.dataUpdatedAt).join(",")],
  );

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
    () =>
      mergeActivityRows(
        q.data?.turns ?? [],
        q.data?.transitions ?? [],
        oncePerId([...fromMissions, ...(saidQ.data ?? [])]),
      ),
    [q.data, fromMissions, saidQ.data],
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
      <ReadFailedLine error={q.error}>
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

  /*
   * HOW THE WORK MOVED, ABOVE THE RECORD OF IT MOVING.
   *
   * `driven_via` is stamped on every transition and has reached this component
   * all along, read one row at a time to caption a single leg and never as a
   * whole. The product's central claim is that work walks the route on its own,
   * and this is the only place on any surface where the record can answer that.
   *
   * OUTSIDE `role="log"` ON PURPOSE. The log announces ADDITIONS, and this is a
   * standing summary of everything below it; inside, a screen reader would hear
   * it re-announced as though a new entry had landed every time a poll changed
   * the count.
   *
   * The sentence carries its own scope and never says "unattended". See
   * `how-this-ran.ts` for the track that makes that non-negotiable.
   */
  const ranLine = howThisRan(
    (q.data?.transitions ?? []).map((t) => t.drivenVia),
    answeredCalls,
  );

  return (
    <>
      {ranLine ? <p className="mrd-meta">{ranLine}</p> : null}
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

            if (row.kind === "said") {
              /*
               * THE PERSON'S OWN LINE, IN THE RECORD WITH EVERYTHING ELSE.
               *
               * Same row shape as every other entry -- clock, glyph, rail --
               * because a steer IS part of what happened to this work and a
               * separate treatment would make it commentary alongside the
               * record rather than part of it. SPEC-AGENT-COMMS is explicit
               * that this is not chat: no bubble, no avatar row, no timestamp
               * gutter.
               *
               * `pickedUp` is read from `consumed_by_run_id` and is the fact a
               * person actually wants: not that the product received it, but
               * that an agent has taken it. Until then it says so, because a
               * steer sitting unconsumed while the run works is the one state
               * where saying nothing would be a lie about being heard.
               */
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
                    <RunGlyph kind="handoff" />
                    {i === ordered.length - 1 ? null : <RunRail />}
                  </span>
                  <span className="min-w-0 pb-1">
                    <span className={RUN_LINE}>
                      <RunSubject>You said</RunSubject>
                      {row.pickedUp ? null : <RunMeta>not picked up yet</RunMeta>}
                    </span>
                    <RunNote>{row.message}</RunNote>
                  </span>
                </li>
              );
            }

            if (row.kind === "handoff") {
              /*
               * THE HANDOFF, AS ITS OWN ENTRY.
               *
               * SESSION-1's first unit, and its shape is the brief's: from- and
               * to-chips in the teammates' colours, the instruction inline,
               * "never a chat bubble, never an avatar row, never a timestamp
               * gutter". It reuses the marks and the clock every other row on
               * this transcript already uses, so nothing new is introduced.
               *
               * `waiting` is a fact from the row rather than a mood: a handoff
               * with no `consumed_by_run_id` is a dispatch nothing has picked
               * up. Saying so is the difference between a record and a feed.
               */
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
                    <RunGlyph kind="handoff" />
                    {i === ordered.length - 1 ? null : <RunRail />}
                  </span>
                  <span className="min-w-0 pb-1">
                    <span className={RUN_LINE}>
                      <AgentMark slug={row.from} state="quiet" />
                      <span aria-hidden className="text-mrd-faint">
                        &rarr;
                      </span>
                      <AgentMark slug={row.to} state={row.waiting ? "quiet" : "idle"} />
                      {row.waiting ? <RunMeta>not picked up yet</RunMeta> : null}
                    </span>
                    <RunNote>{row.task}</RunNote>
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

                  {/*
                   * THE TWO TEAMMATES, ON THE ROW WHERE THE WORK CHANGED HANDS.
                   *
                   * SESSION-1's brief asks for from- and to-chips in the
                   * teammates' own colours, and rules out the shapes that would
                   * be easier: never a chat bubble, never an avatar row, never a
                   * timestamp gutter. This is a record of work and it should
                   * read like one, so the pair sits INSIDE the line that already
                   * describes the handover rather than becoming a row of faces
                   * above it.
                   *
                   * Both marks come from run rows: `previous.agentSlug` ran
                   * before this one, `t.agentSlug` picked it up. Neither is
                   * inferred, and the arrow is the same one `Receipt` already
                   * uses for a handoff, so the gesture is not a new invention.
                   */}
                  {handedOver && handedLine ? (
                    <span className="flex flex-wrap items-center gap-mrd-2">
                      <AgentMark
                        slug={previous?.agentSlug}
                        name={previous?.agentName}
                        state="quiet"
                      />
                      <span aria-hidden className="text-mrd-faint">
                        &rarr;
                      </span>
                      <AgentMark
                        slug={t.agentSlug}
                        name={t.agentName}
                        state={t.outcome === "working" ? "running" : "idle"}
                      />
                      <RunMeta>{handedLine}</RunMeta>
                    </span>
                  ) : (
                    <RunMeta>{handedLine ?? t.stationName}</RunMeta>
                  )}

                  {/*
                   * THE INSTRUCTION THAT TRAVELLED WITH THE WORK.
                   *
                   * Its own line under the two marks rather than appended to them: the
                   * marks and `handedLine` say who let go and what they had made, and
                   * this says what the next seat was asked to do. Two different facts,
                   * and running them together makes a sentence nobody wrote.
                   *
                   * `RunNote` is the same quiet register the platform's stop reason and
                   * the agent's own last line already use on this row, so a handoff does
                   * not shout louder than a failure.
                   */}

                  <RunRollup items={rollupOf(t, titles)} />

                  {/* THE PLATFORM'S REASON, ABOVE THE AGENT'S. `halted_reason` and
                      `failure_kind` are written by the runtime rather than by the
                      seat, so when both are present the unfakeable one is read
                      first. It was on the row all along and no surface drew it:
                      a Build seat halted `out_of_credit` on this very track and
                      the transcript said only "Stopped". */}
                  {t.stopLine ? <RunNote>{t.stopLine}</RunNote> : null}

                  {/* The agent's own last line. One line is enough to tell
                      whether it understood the job; the full text lives on the
                      run. The wording is untouched: `saidLine` moves punctuation
                      and nothing else.

                      ── THIS BRIDGE CAME BACK, AND MY REMOVING IT WAS THE ERROR ─
                      RUN-27 deleted it on the strength of a measurement that
                      read zero across the whole column. That number was true and
                      it was the wrong question: S0 had just BACKFILLED, so it
                      described history rather than the write path. Measured
                      again on 2026-08-27 with the question that matters, rows
                      written SINCE the fix: 9 dashed rows in `agent_runs.output`,
                      all 9 after it, the newest at 23:30 UTC. The leak was never
                      closed; the backfill hid it for five hours.

                      **The exit condition is therefore restated so it cannot be
                      satisfied by another backfill: delete this when a count of
                      rows created AFTER the write-path fix reads zero, not when
                      the column total does.** */}
                  {saidLine(t.said) ? <RunNote>{saidLine(t.said)}</RunNote> : null}
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
      <div ref={endRef} aria-hidden="true" style={{ height: 1 }} data-testid="transcript-end" />
    </>
  );
}
