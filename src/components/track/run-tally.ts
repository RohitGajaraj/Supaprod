/**
 * ── COUNTING WHAT A RUN GOT YOU, WHICH IS THE HALF MERIDIAN MUST NOT KNOW ─
 *
 * P-19 promoted the DRAWING into `meridian/got-you.tsx`, and this is what could
 * not go with it: `spine_track_members` counted by artifact kind, the pull
 * request on the changeset row, the forecast horizon on the decision, the two
 * refusals about a zero, and the display word for each kind. A strip that knew
 * those would be a primitive that can only ever describe a track.
 *
 * What it produces is the strip above the artifact pane: what the run produced, the verdict on it,
 * when the forecast comes due, how long it took and what it cost. A1-REPORT §4
 * calls it "the 'impact, evidenced' line and it is the sentence the person
 * repeats to a colleague", and that is the test this file is built against: if
 * a clause cannot be said out loud to somebody who was not watching, it does not
 * belong here.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Cofounder's completion screen (Mobbin, pulled 2026-09-02) closes a run with
 * **What shipped** and **Verified** as two short lists rather than a log. Devin's
 * puts the PR link FIRST, above the evidence. Both are borrowed as an
 * information order and not as chrome: what you now have, then whether it is any
 * good, then what it cost. The run screen used to answer the third of those in a
 * separate boxed region at the bottom of the right pane (`RunCost`) and the
 * first not at all.
 *
 * ── EVERY FIGURE IS A COLUMN, AND A MISSING ONE PRINTS NOTHING ────────────
 * This is the rule that decides whether the strip is worth reading. `RunCost`
 * and `cost-summary.ts` already refuse a zero on `duration_ms` and `tokens_used`
 * because a zero there is a finalizer that did not write rather than a turn that
 * cost nothing (measured: 742 of 2,272 track-linked runs). The same refusal is
 * held here, and extended: a clause with no row behind it is ABSENT rather than
 * rendered empty, so a strip with three clauses on it is a run that produced
 * three facts, not a template with three holes.
 *
 * `$0.00` is the sharpest case. Printing it would tell a person their run was
 * free when what actually happened is that nothing recorded a price, so money
 * appears only above zero.
 *
 * ── IT READS THE TWO QUERIES THE SCREEN ALREADY POLLS ─────────────────────
 * `["track-artifacts", trackId]` and `["track-activity", trackId]`, the same
 * cache entries the pane and the transcript hold. One fact about one run must
 * not have two freshnesses, which is the drift this surface has been repaired
 * for twice; a private key here would run both server functions a second time on
 * every run a person opens.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { GotYouChip } from "@/components/meridian/got-you";

import { KIND_WORD } from "@/lib/spine/attach";
import { formatElapsed } from "@/components/meridian/run-rows";
import { formatDeadlineDate } from "@/components/track/expiry-deadline";
import { costSummary, spendClause } from "@/components/track/cost-summary";
import { parseReview, verdictLine } from "@/components/track/verdict-reading";
import { selfCheckLine, type SelfCheckTally } from "@/lib/spine/track.functions";
import {
  getTrackActivity,
  getTrackArtifacts,
  type StationArtifactView,
} from "@/lib/spine/track.functions";
import type { Turn } from "@/lib/spine/activity";

/** The pull request this run opened, when it opened one. */
export type PullRequest = { number: number; url: string | null };

/**
 * One thing the run made, in the person's own word for it, and the station whose
 * row made it.
 *
 * ── CHIPS RATHER THAN A SENTENCE (founder, 2026-09-02) ────────────────────
 * This was a joined sentence: *"Produced 1 decision, 1 spec and 2 code
 * changes."* True, readable, and inert. The founder's ruling on the strip took
 * the seven-tab station display off this screen entirely, which left the right
 * pane needing a second way in beside the transcript, and a list of the things
 * the run made is exactly that list: each chip names something that EXISTS and
 * opens it.
 *
 * IT NEVER NAMES A STATION THAT MADE NOTHING, which is the difference between
 * this and the strip it replaces. A seven-slot display has to say something
 * about all seven, so it says "Discover" over a station that filed nothing on 81
 * of 106 tracks. A list of what was made is empty exactly when nothing was made.
 */
export type Made = {
  kind: string;
  /** `KIND_WORD`, so a `signal` is a finding here as it is in the transcript. */
  label: string;
  /** The station whose transcript row filed it. Kept for the Report and tests. */
  station: string;
  /**
   * The newest artifact of this kind, which is what the chip opens.
   *
   * An id rather than the station, for P-24's reason: a station reaches one
   * thing per station, and this chip may stand for ten prototypes. It names the
   * one a person means when they press the word, which is the one that stands.
   */
  artifactId: string;
  count: number;
};

export type Tally = {
  /** One chip per kind of thing the run made, newest station first seen wins. */
  made: Made[];
  pr: PullRequest | null;
  /** From `Verdict`, so the strip and the Build tab cannot say different things. */
  verdict: string | null;
  /** "Horizon check due Fri, 12 Sep", from the decision's own forecast. */
  horizon: string | null;
  /**
   * "3 self-checks · 5 things compared · 1 did not hold · 1 retry", counted from
   * what the checks actually compared. Null when no drive on this run made a
   * comparison, which is true of every run whose drives predate the column.
   */
  selfCheck: string | null;
  elapsed: string | null;
  cost: string | null;
};

/** True when the strip has anything to say. Nothing produced means no strip. */
export function hasAnything(t: Tally): boolean {
  return Boolean(
    t.made.length || t.pr || t.verdict || t.horizon || t.selfCheck || t.elapsed || t.cost,
  );
}

function fieldOf(items: StationArtifactView["items"], kind: string, field: string): unknown {
  for (const item of items) {
    if (item.kind !== kind || item.missing) continue;
    const v = (item.fields as Record<string, unknown> | null)?.[field];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/**
 * The whole strip, computed from rows. Pure, so the test drives it directly
 * rather than standing up a query client and two mocked server functions.
 */
export function runTally(input: {
  stops: readonly StationArtifactView[] | null;
  turns: ReadonlyArray<Pick<Turn, "tookMs" | "tokens" | "usd" | "credits">> | null;
  /**
   * Were those turns a WINDOW rather than all of them?
   *
   * The elapsed time and the bill are sums over `turns`, so on a run past
   * `TURN_WINDOW` they describe a subset and were being printed as the run's
   * totals. True marks both figures "at least". Optional and false by default,
   * for the callers (and the tests) that hand in a whole run.
   */
  turnsCapped?: boolean;
  /** What each drive's own check compared. Absent on a caller that cannot read it. */
  selfChecks?: SelfCheckTally | null;
  now: number;
}): Tally {
  const stops = input.stops ?? [];

  /*
   * COUNTS BY KIND, OVER EVERY STATION, and only over artifacts that still
   * resolve. `missing` means the lookup RAN and the row was not there, so
   * counting it would promise a person something they cannot open. `KIND_WORD`
   * is the same display map the driver's own sentence uses, so the strip and the
   * transcript call a `signal` a finding in the same breath.
   */
  const byKind = new Map<
    string,
    { station: string; artifactId: string; at: number; count: number }
  >();
  for (const stop of stops) {
    for (const item of stop.items) {
      if (item.missing) continue;
      const at = Date.parse(item.createdAt);
      const held = byKind.get(item.kind);
      if (!held) {
        byKind.set(item.kind, {
          station: stop.station,
          artifactId: item.artifactId,
          at: Number.isFinite(at) ? at : 0,
          count: 1,
        });
        continue;
      }
      held.count += 1;
      /* THE NEWEST ONE OWNS THE CHIP. A kind can be filed at two stations -- a
         mission is opened at Build and a changeset can arrive at Build and Ship
         -- and a chip has one destination. The newest is the one a person means
         when they press the word: it is the version of that thing that stands. */
      if (Number.isFinite(at) && at > held.at) {
        held.at = at;
        held.station = stop.station;
        held.artifactId = item.artifactId;
      }
    }
  }
  const made: Made[] = [];
  for (const [kind, held] of byKind) {
    const word = KIND_WORD[kind] ?? { one: kind, many: `${kind}s` };
    made.push({
      kind,
      label: held.count === 1 ? word.one : `${held.count} ${word.many}`,
      station: held.station,
      artifactId: held.artifactId,
      count: held.count,
    });
  }

  /*
   * THE PULL REQUEST, FIRST-CLASS. Devin puts it above everything else because
   * it is the thing a person actually opens, and it is already on the changeset
   * row. `pr_number` without a `pr_url` still prints: knowing the number is
   * useful and inventing a link is not.
   */
  const buildItems = stops.flatMap((s) => (s.station === "build" ? s.items : []));
  const prNumber = fieldOf(buildItems, "changeset", "pr_number");
  const prUrl = fieldOf(buildItems, "changeset", "pr_url");
  const pr =
    typeof prNumber === "number" && Number.isFinite(prNumber)
      ? { number: prNumber, url: typeof prUrl === "string" ? prUrl : null }
      : null;

  const verdict = verdictLine(parseReview(fieldOf(buildItems, "changeset", "code_review")));

  /*
   * WHEN THE FORECAST COMES DUE. The one layer-3 fact that belongs at the top of
   * the screen rather than three tabs into it: a run whose horizon has not
   * arrived is not finished, whatever its status says.
   */
  const decideItems = stops.flatMap((s) => (s.station === "decide" ? s.items : []));
  const horizonRaw = fieldOf(decideItems, "decision", "forecast_horizon_date");
  const horizonMs = typeof horizonRaw === "string" ? Date.parse(horizonRaw) : NaN;
  const horizonDate = formatDeadlineDate(Number.isFinite(horizonMs) ? horizonMs : null);
  const horizon = horizonDate ? `Horizon check due ${horizonDate}` : null;

  /*
   * TIME AND MONEY, ON THE SAME REFUSALS `cost-summary.ts` ALREADY MAKES. No
   * turn recorded a duration means no figure, never "0s"; nothing recorded a
   * price means no figure, never "$0.00". A run that genuinely cost nothing and
   * a run whose finalizer never wrote are different facts and this strip is not
   * the place that confuses them.
   *
   * `cost` leads with credits, not dollars -- `spendClause` (P-136, A-QUEUE) is
   * the one composer this strip shares with the footer bar and the artifact
   * pane's own audit, so the three cannot disagree.
   */
  const s = costSummary([...(input.turns ?? [])]);
  /*
   * ── "AT LEAST", WHEN THE TURNS WERE A WINDOW RATHER THAN ALL OF THEM ─────
   *
   * These two figures are summed over `input.turns`, which is
   * `getTrackActivity`'s capped window. On a run past the cap they were printed
   * in the footer as the run's own elapsed time and its own bill, and both were
   * short by however many turns did not fit. The strip's whole argument is that
   * a figure is honest or absent; a total that silently describes a subset is
   * neither.
   *
   * MARKED RATHER THAN DROPPED. Dropping both is the other honest answer and it
   * is worse here: the founder's ask of this strip is that finished work shows
   * what it was worth, and "we cannot say" over a run that cost real money
   * answers nothing. A trailing `+` says "at least this much", which is exactly
   * what the window supports, and the transcript above carries the sentence
   * that explains why.
   */
  const atLeast = (v: string | null): string | null =>
    v === null ? null : input.turnsCapped ? `${v}+` : v;
  const elapsed = atLeast(s.timedTurns > 0 ? formatElapsed(s.msTotal / 1000) : null);
  const cost = atLeast(spendClause(s));

  return { made, pr, verdict, horizon, selfCheck: selfCheckLine(input.selfChecks), elapsed, cost };
}

/**
 * The tally, off the two cache entries the screen already polls.
 *
 * Exported as a hook because the FOOTER needs the same two figures under both
 * panes and cannot reach into this component. Sharing the hook rather than the
 * numbers means the strip and the footer read one request on one beat, which is
 * the rule the rest of this surface is built on.
 */
export function useRunTally(trackId: string): { tally: Tally; ready: boolean } {
  const fArtifacts = useServerFn(getTrackArtifacts);
  const fActivity = useServerFn(getTrackActivity);

  const artifacts = useQuery({
    queryKey: ["track-artifacts", trackId],
    queryFn: () => fArtifacts({ data: { trackId } }),
    staleTime: 10_000,
  });
  const activity = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fActivity({ data: { trackId } }),
    staleTime: 5_000,
  });

  const tally = React.useMemo(
    () =>
      runTally({
        stops: artifacts.data?.stops ?? null,
        turns: activity.data?.turns ?? null,
        /* The read's own answer about whether its window was full, so the two
           figures below cannot claim to be totals when they are not. */
        turnsCapped: activity.data?.turnsCapped != null,
        selfChecks: activity.data?.selfChecks ?? null,
        now: Date.now(),
      }),
    [artifacts.data, activity.data],
  );

  /*
   * READY MEANS BOTH READS ANSWERED. A strip drawn from one of two reads would
   * print "Produced 1 decision" with no cost beside it for a second and then
   * reflow, which reads as the figure changing rather than as it arriving.
   */
  return { tally, ready: Boolean(artifacts.data) && Boolean(activity.data) };
}

/**
 * The kind's own mark, so a chip is scannable before it is read.
 *
 * `GLYPH_FOR_STATION` draws stations and this list is of THINGS, so the marks
 * come from the artifact vocabulary instead. Anything unmapped gets no mark
 * rather than a wrong one: a chip with the wrong glyph is worse than a chip with
 * none, because the glyph is what a person reads first.
 */
const MARK: Record<string, string> = {
  signal: "\u25CB",
  theme: "\u25CE",
  prd: "\u25A4",
  task: "\u25AB",
  decision: "\u25C7",
  prototype: "\u25A7",
  changeset: "\u25A9",
  mission: "\u25B7",
  deployment: "\u25B2",
  learning: "\u25C9",
};

function markFor(kind: string): string {
  return MARK[kind] ?? "";
}

/**
 * The tally as `meridian/got-you.tsx` draws it: chips that open something, and
 * clauses that state facts and open nothing.
 *
 * The division is the design, so it is decided HERE, where the facts are, rather
 * than at the call site: a person can tell at a glance which half they can press
 * because the pressable half is exactly the half that names a thing that exists.
 */
export function gotYouChips(t: Tally): GotYouChip[] {
  return t.made.map((m) => ({ id: m.artifactId, label: m.label, mark: markFor(m.kind) }));
}

export function gotYouClauses(t: Tally): string[] {
  /*
   * THE SELF-CHECK SITS AFTER THE VERDICT AND BEFORE THE HORIZON.
   *
   * After the verdict because the verdict is somebody else's judgment of the
   * work and this is the work checking itself, and the outside opinion is the
   * one a person acts on first. Before time and money because it is a fact
   * about whether the run can be believed, and those two are facts about what
   * it cost -- a reader who stops after three clauses should have the three
   * that bear on trust.
   */
  return [t.verdict, t.selfCheck, t.horizon, t.elapsed, t.cost].filter((c): c is string =>
    Boolean(c),
  );
}

export function gotYouLink(t: Tally): { label: string; href: string } | null {
  /* Only when it can actually be opened. A number with no url is still worth
     saying, and it is said as a chip rather than as a link that goes nowhere. */
  return t.pr?.url ? { label: `PR #${t.pr.number}`, href: t.pr.url } : null;
}
