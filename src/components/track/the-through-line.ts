/**
 * A RUN AS ONE LINE OF REASONING, WHICH IS THE THING NO SURFACE EVER DREW.
 *
 * ── THE FOUNDER'S COMPLAINT, IN HIS WORDS ──────────────────────────────────
 * *"The stations do not form a flow, the journey is broken, layers 1, 2 and 3
 * do not stitch together, and it reads as a dump of data and content."*
 *
 * Everything needed to answer that has been on the wire for weeks. What the run
 * screen does with it is draw a road of seven stations at the top, a column of
 * chips on the right — `finding` `decision` `16 tasks` `5 specs` `10
 * prototypes` — and a transcript of turns down the left. Three renderings of
 * one run, none of which says what HAPPENED. A person who reads all three still
 * has to assemble the story themselves, and the chips are the dump named above:
 * five nouns and no sentence.
 *
 * ── WHAT A PERSON ACTUALLY WANTS TO KNOW, AND IT IS A NARRATIVE ────────────
 * Read the same run out loud and it is six lines:
 *
 *   Discover  found that homeowners cannot tell a reboot from an outage
 *   Decide    chose to differentiate the tile, over three alternatives
 *   Plan      wrote 5 specs and 16 tasks
 *   Design    drew the amber tile, after the critic refused yellow
 *   Build     stopped: "this repository contains only the checkout module"
 *
 * That is the run. It fits in a glance, every clause is a row somebody wrote,
 * and the ORDER is the causality — which is honest here in a way an inferred
 * "because" would not be, because the spine enforces the order. Discover ran
 * before Decide; Decide's forecast is what Build was building toward. **Nothing
 * in this file invents a link between two stations. The line between them is
 * the route, and the route is a row.**
 *
 * ── AND IT IS WHERE THE LAYERS STITCH ─────────────────────────────────────
 * Each line carries the id of the thing that station filed, so pressing a line
 * opens that artifact in the pane beside it — layer 2 — without leaving the
 * page. The chips did this too; what they could not do is tell you which one to
 * press, because a chip is a noun and a line is a sentence.
 *
 * ── WHAT IS DELIBERATELY LEFT OUT ─────────────────────────────────────────
 * **A station that did nothing gets no line.** The road above already draws all
 * seven and says which are waived; repeating them here as "Ship: nothing yet"
 * five times over is the same dump in a different shape. Measured on
 * production: 81 of 106 tracks sit at Discover having filed nothing, so a
 * seven-line list would be one line and six absences on most runs.
 *
 * Pure and dependency-free apart from the vocabulary and the two composers that
 * already own these words, so no noun is invented here (F-150's rule).
 */
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { KIND_WORD } from "@/lib/spine/attach";

/** One artifact a station filed, as the pane already holds it. */
export type LineItem = {
  kind: string;
  artifactId: string;
  title: string | null;
  missing: boolean;
  fields?: Record<string, unknown> | null;
};

/** One stop on the route, as the pane already holds it. */
export type LineStop = {
  station: AgentStation;
  items: readonly LineItem[];
};

/** One station's line in the story. */
export type Line = {
  station: AgentStation;
  /** "Decide", "Build". From the one display map, never a slug. */
  name: string;
  /** What it did, in the past tense, without the station's name in it. */
  did: string;
  /**
   * The record's own reason, when the record carries one: the decision's
   * rationale, the run's own words where it stopped. Null far more often than
   * not, and null draws nothing.
   */
  because: string | null;
  /** The artifact pressing this line opens, or null when there is none. */
  opens: string | null;
  /** True on the station the work stands at now. */
  here: boolean;
  /**
   * A seat is working this station RIGHT NOW.
   *
   * ── THE STORY USED TO GO SILENT AT THE LIVE EDGE ────────────────────────
   * A station earns a line by having filed something, and a station that is
   * mid-turn has filed nothing yet. So on a run with a seat actually working,
   * the story ran to the last COMPLETED station and stopped -- and the reader
   * scanning it for where the work had got to found the sequence ending one
   * station short of the truth.
   *
   * That is the founder's own first sentence failed by the surface built to
   * answer it: "what it is doing now, what comes next, where it needs them".
   * A story that stops before the present is a history, not a flow.
   */
  working: boolean;
};

/** The first sentence of a field, for a line that has to fit on one row. */
function firstSentence(v: unknown, cap = 150): string | null {
  if (typeof v !== "string") return null;
  const flat = v.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  const cut = flat.search(/\.\s/);
  const first = (cut === -1 ? flat : flat.slice(0, cut + 1)).trim();
  return first.length > cap ? `${first.slice(0, cap).trimEnd()}...` : first;
}

/**
 * The things a station filed that a person would name, newest last.
 *
 * `missing` rows are dropped: the lookup ran and the row was not there, so
 * naming it would promise something that cannot be opened.
 */
function realItems(stop: LineStop): LineItem[] {
  return stop.items.filter((i) => !i.missing);
}

/**
 * A MISSION IS SOMETHING A STATION STARTED, NOT SOMETHING IT PRODUCED.
 *
 * ── READ LIVE ON `6cc7a010`, WHERE IT MADE THE STORY SAY THE OPPOSITE ──────
 * The story block read:
 *
 *     Build filed "Homeowner can reschedule installer visit from order page"
 *
 * Build had refused six times -- "No repository is connected for this
 * workspace" -- and produced nothing at all. What it had was one `mission`
 * member, and `KIND_WORD` is explicit about what that is: *"Opened by the
 * driver so Build's own tool will run at all. It is real membership, so it is
 * said rather than hidden."*
 *
 * That comment is right that it should be SAID. What was wrong is the verb. A
 * mission is the driver's own bookkeeping -- the work item it opens so a
 * station can be dispatched at all -- and reporting it under "filed", the verb
 * of production, told a person the station succeeded on the one line whose job
 * is to say what each station did. The machinery's own record, read as output,
 * which is the family this screen has been repaired for all week.
 *
 * So it keeps its place in a count and loses the title slot: a station whose
 * only member is a mission has STARTED something and filed nothing, and that is
 * a different sentence.
 */
const IS_BOOKKEEPING = (i: LineItem) => i.kind === "mission";

/**
 * How a station's output reads as a clause.
 *
 * Counted by KIND rather than listed by title, because a station that filed ten
 * drawings has one thing to say and ten titles would be the dump this replaces.
 * The exception is a station that filed exactly one thing WITH A TITLE — then
 * the title IS the sentence, and it is the most informative line on the list.
 */
function didClause(items: LineItem[]): string | null {
  if (items.length === 0) return null;
  const made = items.filter((i) => !IS_BOOKKEEPING(i));

  /* Nothing but the driver's own work item. Said, because it is real membership
     and hiding it would leave the station with no line at all -- but said as
     what it is. */
  if (made.length === 0) {
    const one = items.length === 1 ? items[0]! : null;
    const title = one?.title?.trim();
    return title ? `started "${title}" and filed nothing` : "started, and filed nothing";
  }

  /* The title slot is for something the station MADE. A mission alongside a
     prototype must not win it, so the single-titled-thing rule is scored over
     the products only. */
  const titled = made.filter((i) => i.title && i.title.trim());
  if (made.length === 1 && titled.length === 1) {
    const one = titled[0]!;
    /*
     * ── "FILED" IS THE WEAKEST VERB AVAILABLE FOR A DECISION ───────────────
     *
     * On `6cc7a010` this line read:
     *
     *   Decide filed "Reschedule installer visit from order page"
     *
     * and the decision was to WAIT. The title names the subject and says
     * nothing about the direction, so a person reading the story of that run
     * had no way to know the loop had decided against it -- while Plan, Design
     * and Build then filed a spec, a prototype and a code change underneath.
     *
     * `decisions.call` records the direction as of 2026-09-10 (Lane 3), and it
     * reaches this line through `ARTIFACT_SOURCE.decision.also`. So the verb
     * carries it: "chose to build" or "chose not to build", which is the same
     * length as "filed" and is the fact the sentence was missing.
     *
     * NULL KEEPS "FILED", and that is the load-bearing half. 33 of 61 agent
     * decisions carry no direction because it was never recorded before the
     * column existed, and "nobody wrote one down" is not "they decided to
     * build". A story that guessed would invent the one fact the column was
     * added to stop being invented.
     */
    const call = one.kind === "decision" ? one.fields?.call : null;
    const verb =
      call === "do-not-build"
        ? "chose not to build"
        : call === "build"
          ? "chose to build"
          : "filed";
    return `${verb} "${one.title!.trim()}"`;
  }
  /* Counted over what it MADE, so a mission alongside a prototype does not read
     as "filed 3 prototypes and 1 run" -- the same wrong verb in a count instead
     of a title. This also puts the story back in step with the road, which has
     always read a mission as a STATE rather than a product
     (`run-journey.ts`: a mission at Build renders as "building"). */
  const byKind = new Map<string, number>();
  for (const i of made) byKind.set(i.kind, (byKind.get(i.kind) ?? 0) + 1);
  const parts = [...byKind.entries()].map(([kind, n]) => {
    const word = KIND_WORD[kind] ?? { one: kind, many: `${kind}s` };
    return `${n} ${n === 1 ? word.one : word.many}`;
  });
  const list =
    parts.length === 1
      ? parts[0]!
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `filed ${list}`;
}

/**
 * The reason a station's line carries, when the record wrote one down.
 *
 * ONLY TWO SOURCES, and both are rows rather than inferences:
 *
 *   A DECISION'S OWN RATIONALE. `fields.rationale` is what the seat wrote when
 *   it recorded the call, and `alternatives_considered` is what it weighed
 *   against. Those two are the most valuable pair on the whole run and they
 *   have lived one click deep, inside a card nobody opens unless they already
 *   know it is there.
 *
 *   WHERE THE RUN STOPPED SAYING IT. The refrain is handed in by the caller
 *   because it is computed over turns rather than artifacts, and it is quoted
 *   rather than paraphrased for the reason `what-it-keeps-saying.ts` gives.
 */
function becauseFor(station: AgentStation, items: LineItem[], stuck: string | null): string | null {
  if (stuck) return `"${stuck}"`;
  if (station !== "decide") return null;
  const decision = items.find((i) => i.kind === "decision");
  if (!decision) return null;
  const why = firstSentence(decision.fields?.rationale);
  const alts = decision.fields?.alternatives_considered;
  const n = Array.isArray(alts) ? alts.length : 0;
  /* The count, not the list: three rejected alternatives is a fact about how
     hard the call was, and reading all three is what pressing the line is for. */
  const weighed = n > 0 ? `${n} ${n === 1 ? "alternative" : "alternatives"} rejected` : null;
  return [why, weighed].filter(Boolean).join(" ") || null;
}

/**
 * The run, in order, as the line of reasoning it actually was.
 *
 * `stuckAt` and `stuckSaying` come from the caller: the refrain is computed over
 * TURNS and this file reads ARTIFACTS, and joining those two is the run
 * screen's job rather than this module's.
 */
export function throughLine(input: {
  stops: readonly LineStop[] | null | undefined;
  standing: AgentStation | null;
  /** The station the run stopped at, when it stopped. */
  stuckAt?: AgentStation | null;
  /** What it kept saying there, verbatim. See `what-it-keeps-saying.ts`. */
  stuckSaying?: string | null;
  /**
   * The station a seat is working RIGHT NOW, when one is.
   *
   * Handed in like `stuckAt` and for the same reason: it is read off turns
   * rather than artifacts, and joining the two is the run screen's job. See
   * `Line.working` for why the story is wrong without it.
   */
  workingAt?: AgentStation | null;
}): Line[] {
  const out: Line[] = [];
  for (const stop of input.stops ?? []) {
    const items = realItems(stop);
    const stuck = input.stuckAt === stop.station && input.stuckSaying ? input.stuckSaying : null;
    const working = input.workingAt === stop.station;
    const did = didClause(items);
    /*
     * A STATION WITH NOTHING TO SAY GETS NO LINE, unless it is where the run
     * stopped -- because "it stopped here and said why" is the most important
     * line on the list and it is precisely a station that filed nothing -- or
     * where a seat is working right now, which is the same argument in the
     * present tense: the one station a reader is looking for is the one that
     * has not finished, and it is the one with nothing filed to earn a line.
     */
    if (!did && !stuck && !working) continue;
    /*
     * WHAT A WORKING STATION SAYS, AND WHAT IT DELIBERATELY DOES NOT.
     *
     * "is working now", and no seat name and no verb. The Now card at the top
     * of the other pane already says "Engineer is reading the spec" -- the seat
     * AND what it is doing -- and the transcript says it a third time under the
     * turn. What the story alone can say is that THE SEQUENCE HAS REACHED HERE
     * and has not finished, which is a fact about the shape of the run rather
     * than about the seat. Repeating the name or the verb here would be the
     * defect this file's own neighbours were repaired for all day.
     */
    const clause = did
      ? working
        ? `${did}, still working`
        : did
      : working
        ? "is working now"
        : "stopped";
    out.push({
      station: stop.station,
      name: AGENT_STATIONS[stop.station]?.name ?? stop.station,
      did: clause,
      because: becauseFor(stop.station, items, stuck),
      /* The NEWEST thing it filed: the chain appends as it harvests, so the
         last one is the version that stands. */
      opens: items.length > 0 ? (items[items.length - 1]!.artifactId ?? null) : null,
      here: input.standing === stop.station,
      working,
    });
  }
  return out;
}
