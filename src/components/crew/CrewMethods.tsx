/**
 * HOW THE WORK GETS DONE — the reader for the playbook registry.
 *
 * WHY THIS EXISTS AT ALL. `getPlaybooks` (src/lib/playbooks.functions.ts) is
 * live server code with zero UI callers. `rankPlaybooksByOutcome` is consumed
 * for real at src/lib/ai/tools/orchestrator.server.ts:280 to choose the method
 * a mission step runs under, and that choice lands on
 * `mission_steps.playbook_id`. So the machine is already picking a method on
 * the user's behalf, every mission, and the user cannot see that methods exist
 * at all. That is this repo's named dominant defect: capability built, door
 * missing.
 *
 * WHERE THE DOOR BELONGS, AND WHY THE OTHER TWO CANDIDATES ARE WRONG.
 *
 *   CREW, which is where it went. A playbook is the reusable way the crew does
 *   a kind of work. The Crew roster already answers "who works here", and the
 *   door it grew on 2026-08-01 answers "what may they do without me". "How do
 *   they do it, and what has actually worked" is the third question in that
 *   same sentence, asked by the same person in the same sitting. It is also
 *   the only one of the three surfaces where the reader is already thinking
 *   about the crew as a group rather than about one artifact.
 *
 *   ENGINE ROOM, rejected. It is the right place for a mechanism and it is the
 *   wrong place for this. The engine-room doctrine is that the user meets the
 *   OUTPUT, not the machine; the Engine Room is the technical whisper for
 *   someone debugging the system. The whole point of outcome ranking is that a
 *   non-technical product lead reads "this way of working keeps validating
 *   here" and believes it. Filed under machinery, that person never finds it,
 *   and the thing the product calls its moat stays invisible to the only
 *   audience it was built to convince.
 *
 *   BRAIN, rejected, and this one is the closer call. Brain is the RECORD:
 *   what happened here, what was decided, what was learned. A playbook is not
 *   a record. It is standing method, it is code-versioned rather than
 *   accumulated, and all six exist in full before a single run has happened.
 *   Brain's honest empty state is "nothing has happened yet"; this surface is
 *   never empty and must never render as though it were. Filing shipped method
 *   under the record would also weaken the record's own claim, which is that
 *   everything in it was learned HERE.
 *
 * NOT A SIXTH RAIL ROW. AppFrame.tsx:161 says the five rail rows are decided
 * and not to be relitigated. This follows the precedent the boundary door set
 * on the same surface: a row on the roster, and the detail one click behind
 * it, held in the URL so the browser's own back button closes it and a
 * teammate can be sent straight to it.
 *
 * WHAT IT REFUSES TO DO. Every one of the 34 recorded runs currently carries a
 * NULL verdict: nothing in src/ writes that column yet, and
 * mission-advance.server.ts says so outright. So the empty-evidence state is
 * not an edge case here, it is THE state, and it is the one this file was
 * actually designed around. There is no fake percentage, no placeholder bar,
 * no sparkline over a column of nulls. The surface states the run counts,
 * which are real; states that no result has come back, which is true; and
 * discloses that the order on screen is therefore the order the registry ships
 * in rather than a league table. A reader who is not told that would read the
 * top row as the winner, and nothing has won anything yet.
 *
 * KNOWN LIMIT, INHERITED, FLAGGED RATHER THAN PAPERED OVER. `getPlaybooks`
 * scopes its run counts with the `current_user_default_workspace` RPC, not
 * with the workspace the user is currently looking at. Fixing that means
 * editing the server function, which this lane does not own. Until it is
 * fixed, the copy here claims no workspace scope it cannot back: it says how
 * many times a method has been run, and never whose workspace that was.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2026-08-15: PORTED TO MERIDIAN. Every `--sp-*` shape is gone; only
 * `Surface`, the shell's own region, is kept, exactly as /approvals keeps it.
 *
 * ONE THING CHANGED THAT IS NOT A RE-SKIN: the middle tone. `methodRecord`
 * returns four tones and the old `Value` painted the middle one amber. Under
 * Meridian amber means STOPPED AND NOT ON YOU — no source connected, a cap
 * nearly spent — and a method validating at half its results is not stopped
 * and is not waiting for a condition. Green and red are the only outcome hues
 * this system has, so a rate between the two thresholds is drawn with no hue at
 * all, which is the honest reading: it is an outcome that has not gone either
 * way. The thresholds themselves are untouched and still pinned by the test
 * beside this file; what changed is only what the middle band looks like.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  AGENT_TO_PLAYBOOK_STATION,
  type PlaybookRanking,
  type PlaybookStation,
} from "@/lib/playbooks/registry";
import { getPlaybooks } from "@/lib/playbooks.functions";
import { Surface } from "@/components/meridian/Surface";
import {
  Action,
  Actions,
  Figure,
  NothingHere,
  PageHeading,
  ReadFailed,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";

/* ------------------------------------------------------------------ *
 * The honesty rules, as pure functions. Everything between here and
 * "The surface" is unit-tested, because these are the calls that decide
 * whether a number is allowed to reach the screen at all.
 * ------------------------------------------------------------------ */

/**
 * How many decisive results a method needs before its rate is printed.
 *
 * The ENGINE ranks on one: rankPlaybooksByOutcome puts any method with a
 * decisive result ahead of every method without one, and
 * pickPlaybookForAgentStation hands that leader to the orchestrator. This is a
 * stricter DISPLAY gate sitting on top of that, and the two are stated
 * separately on the surface because conflating them would misdescribe the
 * engine. Two out of three is a fact; it is not a rate, and a product whose
 * whole pitch is an honest record cannot afford to print it as one.
 */
export const MIN_RESULTS_FOR_RATE = 5;

export type MethodTone = "quiet" | "pass" | "warn" | "fail";

export type MethodRecord = {
  /** Recorded applications. Real, from playbook_runs. */
  runs: number;
  /** Applications that came back with a decisive result. */
  results: number;
  /** Percent validated. NULL whenever it would be invented or premature. */
  ratePct: number | null;
  /** The record as one short phrase, or null when the run count says it all. */
  recordText: string | null;
  tone: MethodTone;
};

function clampInt(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : 0;
  return v > 0 ? v : 0;
}

/**
 * PURE. What a method's track record is allowed to say about itself.
 *
 * Four states, in the order they are reached:
 *   never run      -> the run count is the whole story, and no second phrase
 *   run, no result -> say exactly that; never dress a null as a zero percent
 *   thin evidence  -> the raw counts, plus why they are not a rate yet
 *   rated          -> the percentage, with its sample size beside it
 *
 * `winRate` is honoured as a second lock: if the ranking says there is no
 * rate, no rate is printed, whatever the counts happen to look like.
 */
export function methodRecord(input: {
  runs: number;
  decisive: number;
  validated: number;
  winRate: number | null;
}): MethodRecord {
  const runs = clampInt(input.runs);
  const results = clampInt(input.decisive);
  const validated = Math.min(results, clampInt(input.validated));

  if (runs === 0) {
    return { runs: 0, results: 0, ratePct: null, recordText: null, tone: "quiet" };
  }
  if (results === 0) {
    return { runs, results: 0, ratePct: null, recordText: "No result yet", tone: "quiet" };
  }
  if (input.winRate === null || results < MIN_RESULTS_FOR_RATE) {
    const tail = results < MIN_RESULTS_FOR_RATE ? ", too few to rate" : "";
    return {
      runs,
      results,
      ratePct: null,
      recordText: `${validated} of ${results} validated${tail}`,
      tone: "quiet",
    };
  }
  const ratePct = Math.round((validated / results) * 100);
  return {
    runs,
    results,
    ratePct,
    recordText: `${ratePct}% validated, ${results} results`,
    // Colour carries the outcome and nothing else here. The two thresholds are
    // a display encoding of a real number, not a judgment invented on top of
    // one, and the test pins them so they cannot drift quietly.
    tone: ratePct >= 60 ? "pass" : ratePct >= 40 ? "warn" : "fail",
  };
}

export type MethodsSummaryKind = "no-runs" | "none-rated" | "some-rated";

/**
 * PURE. Which headline sentence the surface is entitled to.
 *
 * The middle branch is the one that matters. A workspace with runs but no
 * results has real usage and no ranking, and if the page does not say so the
 * reader will take the printed order for a verdict.
 */
export function methodsSummary(input: {
  methods: number;
  runs: number;
  rated: number;
}): MethodsSummaryKind {
  if (clampInt(input.runs) === 0) return "no-runs";
  if (clampInt(input.rated) === 0) return "none-rated";
  return "some-rated";
}

/**
 * The stations, in the words of the outcome rather than of the machine.
 * `prd`, `prioritization` and `discovery` are our column values; nobody
 * outside this repo calls the act of writing a spec "prd".
 */
export const STATION_WORDS: Record<PlaybookStation, string> = {
  discovery: "Finding the real problem",
  prioritization: "Choosing what goes first",
  prd: "Turning the bet into a spec",
  positioning: "Saying what it is, and who it is for",
  validation: "Testing it before anyone builds it",
};

/**
 * Which stations the crew picks a method for ON ITS OWN. Derived from the
 * loop's own map rather than restated beside it, so the sentence on screen
 * cannot drift away from what the orchestrator actually does.
 */
const AUTO_PICKED: ReadonlySet<string> = new Set(
  Object.values(AGENT_TO_PLAYBOOK_STATION).filter((s): s is PlaybookStation => Boolean(s)),
);

/** PURE. True when a mission step selects one of this station's methods itself. */
export function isAutoPicked(station: PlaybookStation): boolean {
  return AUTO_PICKED.has(station);
}

/**
 * PURE. What a reader needs to know about a station before reading its rows:
 * whether anything is choosing between these on their behalf. Saying "run one
 * by hand" for the two that nothing selects would promise a button that does
 * not exist, which is the same defect this whole surface was built to close.
 */
export function stationSub(station: PlaybookStation): string {
  return isAutoPicked(station)
    ? "The crew picks one of these itself when a mission reaches this step."
    : "Nothing picks one of these on its own yet. They are the standing method for this part of the work.";
}

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

const TITLE = "How the work gets done.";

function runsPhrase(runs: number): React.ReactNode {
  if (runs === 0) return "Never run";
  if (runs === 1) return "Run once";
  return (
    <>
      Run <Figure>{runs}</Figure> times
    </>
  );
}

/**
 * What a tone looks like, and the middle band is the interesting one.
 *
 * Green and red are the only outcome hues Meridian has, and they mean it worked
 * and it did not. `warn` is neither: a method validating between the two
 * thresholds has an outcome that has not gone either way, so it takes the body
 * ink and no hue. Amber would be the reflex and it would be wrong — in this
 * system amber means stopped and NOT on you, which sends a reader hunting for a
 * condition to change that does not exist here. `quiet` is for a record that is
 * not a verdict at all: a run count with no result behind it.
 */
const TONE_INK: Record<MethodTone, string> = {
  quiet: "text-mrd-faint",
  pass: "text-mrd-pass",
  warn: "text-mrd-body",
  fail: "text-mrd-fail",
};

function SummaryLine({
  kind,
  methods,
  runs,
  rated,
}: {
  kind: MethodsSummaryKind;
  methods: number;
  runs: number;
  rated: number;
}) {
  if (kind === "no-runs") {
    return (
      <>
        <Figure>{methods}</Figure> named ways of working the crew can reach for. None of them has
        been run yet, so nothing below is ranked. What you are reading is the order they ship in.
      </>
    );
  }
  if (kind === "none-rated") {
    return (
      <>
        <Figure>{methods}</Figure> named ways of working, run <Figure>{runs}</Figure> times so far.
        No result has come back against any of them yet, so what you are reading is still the order
        they ship in and not a league table.
      </>
    );
  }
  return (
    <>
      <Figure>{methods}</Figure> named ways of working, run <Figure>{runs}</Figure> times so far.{" "}
      <Figure>{rated}</Figure> of them have enough results to rank on. The rest keep the order they
      ship in.
    </>
  );
}

/**
 * ONE METHOD, AS A CARD RATHER THAN A LINE PLUS A PARAGRAPH.
 *
 * The shape this replaces was a `Line` (a label with a value on the right) with
 * a `Prose` block underneath it, and the two were siblings: nothing in the
 * markup said the steps belonged to the name above them, so six methods in one
 * region read as twelve unrelated things. A method is one object with a name, a
 * record, a procedure and a win condition, so it is drawn as one object.
 *
 * The record sits at the TOP RIGHT and never inside the procedure, because it
 * is the fact a reader is scanning for and the steps are what they read once
 * they have stopped.
 */
function MethodCard({ ranking }: { ranking: PlaybookRanking }) {
  const rec = methodRecord(ranking);
  const p = ranking.playbook;
  return (
    <article className="rounded-mrd-card border border-mrd-line bg-mrd-sheet px-mrd-5 py-mrd-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-mrd-5 gap-y-mrd-1">
        <h3 className="text-mrd-base font-medium text-mrd-ink">{p.name}</h3>
        <span className="flex shrink-0 items-baseline gap-mrd-4 text-mrd-small">
          {/* Mono and tabular, because both of these are counts and rates. The
              run count is always true; the record beside it is printed only
              when `methodRecord` says the numbers are allowed to speak. */}
          <span className="font-mrd-mono text-mrd-faint tabular-nums">{runsPhrase(rec.runs)}</span>
          {rec.recordText ? (
            <span className={`font-mrd-mono tabular-nums ${TONE_INK[rec.tone]}`}>
              {rec.recordText}
            </span>
          ) : null}
        </span>
      </div>

      <p className="mt-mrd-2 max-w-[68ch] text-mrd-label leading-mrd-prose text-mrd-mute">
        {p.summary}
      </p>

      {/* The procedure, in a recess. The standard caps a region at one bordered
          container, so the steps read as part of the card by sitting BELOW its
          ground rather than inside a second border. The numerals are mono
          because they are numbers; the steps are not. */}
      <ol className="mt-mrd-4 flex list-none flex-col gap-mrd-2 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
        {p.steps.map((step, i) => (
          <li key={step} className="flex gap-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-body">
            <span className="font-mrd-mono shrink-0 text-mrd-tiny text-mrd-faint tabular-nums">
              {i + 1}
            </span>
            <span className="min-w-0">{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-mrd-3 text-mrd-small leading-mrd-prose text-mrd-mute">
        What counts as this one working: {p.rankingSignal}.
      </p>
    </article>
  );
}

export function CrewMethods({ onBack }: { onBack: () => void }) {
  const fGet = useServerFn(getPlaybooks);
  const q = useQuery({
    queryKey: ["playbooks", "registry"],
    queryFn: () => fGet({ data: {} }),
    staleTime: 60_000,
  });

  const back = <Action onClick={onBack}>Back to the crew</Action>;

  if (q.isLoading) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading title={TITLE} />
          <Reading>Reading what the crew has actually run.</Reading>
        </div>
      </Surface>
    );
  }

  if (q.isError) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading title={TITLE} />
          <ReadFailed error={q.error} onRetry={() => void q.refetch()}>
            The record did not load, so no count below would be the real one.
          </ReadFailed>
          <Actions>{back}</Actions>
        </div>
      </Surface>
    );
  }

  const stations = q.data?.stations ?? [];
  const all = stations.flatMap((s) => s.playbooks);

  if (all.length === 0) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading title={TITLE} />
          <NothingHere action={back}>
            Nothing came back from the registry. That is not an empty workspace, it is a read that
            found no methods at all, and the crew has been working to a method this whole time.
          </NothingHere>
        </div>
      </Surface>
    );
  }

  const totalRuns = all.reduce((n, r) => n + Math.max(0, r.runs), 0);
  const rated = all.filter((r) => methodRecord(r).ratePct !== null).length;
  const kind = methodsSummary({ methods: all.length, runs: totalRuns, rated });

  return (
    <Surface>
      <div className="flex flex-col gap-mrd-7">
        <PageHeading
          title={TITLE}
          sub={<SummaryLine kind={kind} methods={all.length} runs={totalRuns} rated={rated} />}
        />

        {stations.map((s) =>
          s.playbooks.length === 0 ? null : (
            <Region key={s.station} title={STATION_WORDS[s.station]} sub={stationSub(s.station)}>
              <div className="flex flex-col gap-mrd-4">
                {s.playbooks.map((r) => (
                  <MethodCard key={r.playbook.id} ranking={r} />
                ))}
              </div>
            </Region>
          ),
        )}

        {/* The forward line, and the reason this page reads as "it sharpens" and
            not as "it is broken". Both sentences are true of shipped code:
            rankPlaybooksByOutcome puts any method with a decisive result ahead of
            every method with none, and pickPlaybookForAgentStation hands that
            leader to the orchestrator. Neither sentence promises the verdict
            stamping, because a surface may not promise a mechanism the wiring
            does not yet have. */}
        <Region title="How one of these earns its place">
          <div className="flex max-w-[68ch] flex-col gap-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-body">
            <p>
              The moment a method has a result on the record, it moves ahead of every method that
              has none, and the crew reaches for it first at that step. That is the whole ranking,
              and it takes one result to start.
            </p>
            <p>
              A rate is only printed here once there are <Figure>{MIN_RESULTS_FOR_RATE}</Figure>{" "}
              results to draw it from. Two out of three is a fact worth showing, and it is not a
              rate.
            </p>
          </div>
        </Region>

        <Actions>{back}</Actions>
      </div>
    </Surface>
  );
}
