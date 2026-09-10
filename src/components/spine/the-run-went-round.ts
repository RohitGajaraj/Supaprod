/**
 * THE RUN WENT ROUND, AND UNTIL NOW NOTHING ON ANY SURFACE SAID SO.
 *
 * ── THE MEASUREMENT THAT PRODUCED THIS FILE ─────────────────────────────
 * Taken on production, 2026-09-10, over every track that has ever taken a
 * turn. A leg is a station the work arrived at, consecutive turns at one
 * station being one leg:
 *
 *   tracks with turns                        117
 *   tracks that visit a station twice          27   (23%)
 *   tracks that visit one station 3+ times     19   (16%)
 *   longest route                               7 legs
 *
 * And the shapes are not noise. The commonest routes over four legs:
 *
 *   sense, decide  x3                                              5 tracks
 *   sense, decide, then (define, design, build) x3                 4 tracks
 *   sense, then (define, design, build) x3                         1 track
 *   ..., then (ship, learn) x2                                     1 track
 *   ..., then (define, design) x3 or x4                            3 tracks
 *
 * **Twenty-three of the twenty-seven are a clean repeating cycle.** A run
 * that cannot get past a wall is sent back to an earlier station, redoes the
 * work, arrives at the same wall, and goes round again, and the three
 * `given-up` runs in the founder's own workspace are all
 * `define, design, build` three times over, each lap ending on the same
 * sentence: *"No repository is connected for this workspace."*
 *
 * ── WHAT THE RUN SCREEN SAID INSTEAD ────────────────────────────────────
 * Eleven station sections in one flat column, peers of each other, the second
 * Plan indistinguishable from the first. `transcript-sections.ts` opens a new
 * section every time the station changes, correctly, and had no idea it had
 * opened Plan for the third time. The founder's sentence for this is exact:
 * *the stations do not form a flow, the journey is broken*. In the transcript
 * the journey IS the order the work walked, and walking the same three
 * stations three times is the single most important fact about such a run.
 *
 * It is also the one a person needs in order to act, because it is the fact
 * that says WAITING WILL NOT HELP. A loop that ends on the same wall every
 * lap will end on it again, and every lap is billed.
 *
 * ── PURE, AND THE MEASURE TAKES NO JUDGEMENT ────────────────────────────
 * The cycle is exact equality on the station sequence. There is no threshold
 * here and there must not be: a guard or a fold that needs a similarity score
 * has to be argued from real sentences (see `foldRepeats`), while "the work
 * walked Plan, Design, Build and then walked Plan, Design, Build" is either
 * true of the record or it is not.
 */
import type { AgentStation } from "@/lib/agent-vocabulary";

export type Round = {
  /** One lap's stations, in the order the work walks them. Never empty. */
  cycle: AgentStation[];
  /** Complete laps. Always two or more; one lap is not a circle. */
  laps: number;
  /** Index of the first section of each lap, in order. `laps` long. */
  lapStarts: number[];
};

/**
 * The longest circle this run walked, or null when it walked a line.
 *
 * ── WHY THE LONGEST AND NOT THE LAST ────────────────────────────────────
 * The obvious rule is "the cycle it is in NOW", read off the tail. It is
 * wrong on two of the seventeen measured routes and wrong in the direction
 * that hides things: `sense, decide` three times over and then `learn` has no
 * trailing cycle at all, and that run went round three times. A run that
 * escaped its loop and stopped somewhere else still went round.
 *
 * So: the repeat covering the most legs, ties broken to the LATER start (what
 * the run was doing most recently) and then to the shorter cycle (the tighter
 * circle is the more specific claim). One rule, no special cases.
 *
 * A `null` station is a section the record could not place. It participates
 * in no cycle: matching two unplaceable sections to each other would invent a
 * repeat out of an absence, which is the failure this whole file exists to
 * avoid making in the other direction.
 */
export function theRunWentRound(stations: readonly (AgentStation | null)[]): Round | null {
  const n = stations.length;
  let best: Round | null = null;
  let bestCovered = 0;

  const same = (i: number, j: number) =>
    stations[i] !== null && stations[j] !== null && stations[i] === stations[j];

  for (let start = 0; start < n; start += 1) {
    for (let p = 1; start + 2 * p <= n; p += 1) {
      /* How many whole blocks of length `p` from `start` are identical to the
         first one. Stops at the first block that differs, so the laps counted
         are always consecutive. */
      let laps = 1;
      while (start + (laps + 1) * p <= n) {
        let matches = true;
        for (let k = 0; k < p; k += 1) {
          if (!same(start + k, start + laps * p + k)) {
            matches = false;
            break;
          }
        }
        if (!matches) break;
        laps += 1;
      }
      if (laps < 2) continue;
      const covered = laps * p;
      const better =
        best === null ||
        covered > bestCovered ||
        (covered === bestCovered &&
          (start > best.lapStarts[0]! || (start === best.lapStarts[0]! && p < best.cycle.length)));
      if (!better) continue;
      bestCovered = covered;
      best = {
        cycle: stations.slice(start, start + p) as AgentStation[],
        laps,
        lapStarts: Array.from({ length: laps }, (_, l) => start + l * p),
      };
    }
  }
  return best;
}

/**
 * Which lap a section belongs to, 1-based, or null for a section outside the
 * circle. The sections BEFORE the circle are how the run got there and the
 * ones after are how it left; neither is a lap, and numbering them would make
 * the count in the lead disagree with the seams in the column.
 */
export function lapOf(round: Round | null, sectionIndex: number): number | null {
  if (!round) return null;
  const size = round.cycle.length;
  const first = round.lapStarts[0]!;
  const end = first + round.laps * size;
  if (sectionIndex < first || sectionIndex >= end) return null;
  return Math.floor((sectionIndex - first) / size) + 1;
}

const COUNT_WORDS = ["", "once", "twice", "three times", "four times", "five times", "six times"];

/** "three times", and past six the numeral, because "eleven times" is not read. */
export function timesWord(n: number): string {
  return COUNT_WORDS[n] ?? `${n} times`;
}

const ORDINALS = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth"];

/**
 * The seam between two laps, in the lead's own words.
 *
 * "Second time round" rather than "Lap 2", because the lead above the column
 * says *"Three times round Plan, Design and Build."* and a column that then
 * counted laps would be a second vocabulary for one fact. This repo has paid
 * for that twice: a road saying filings while a card said turns, and one word
 * carrying two units four hundred pixels apart.
 */
export function roundSeam(lap: number): string {
  const word = ORDINALS[lap];
  return word ? `${word} time round` : `${lap}th time round`;
}

/**
 * The lead: the one sentence the run screen was missing.
 *
 * "Three times round Plan, Design and Build." Station NAMES, because the
 * column's headers carry names and a lead that said `define` would be the
 * only place in the product using the column key.
 */
export function roundLead(round: Round, nameOf: (s: AgentStation) => string): string {
  const names = round.cycle.map(nameOf);
  const list =
    names.length === 1
      ? names[0]!
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]!}`;
  const times = timesWord(round.laps);
  return `${times.charAt(0).toUpperCase()}${times.slice(1)} round ${list}.`;
}

/**
 * ── WHAT A LAP FILED, AND WHETHER ANY OF IT WAS NEW ──────────────────────
 *
 * The lead says the run went round. This says whether going round was worth
 * anything, which is the half a person is actually deciding on.
 *
 * THE MEASURE IS EXACT EQUALITY ON `kind` AND `title`, and that is a
 * deliberate refusal of the cleverer options. Artifact IDS are useless here:
 * a re-filed prototype is a NEW row with a NEW id every lap. On `6cc7a010`
 * the same drawing is prototypes `161e1663`, `aa884e5b` and `96b427ed`, so an
 * id comparison would call three copies of one drawing three new things,
 * which is the exact claim the surface must not make. A similarity score on
 * the BODY would be better still and it needs a threshold argued from real
 * text, which is a different piece of work with a different burden of proof.
 *
 * A title match is what a reader sees on the row anyway: the rows say
 * `prototype · Reschedule installer visit from order page` on three separate
 * laps, and this says so out loud.
 *
 * Returns the 1-based laps that filed nothing whose kind and title had not
 * already been filed on an earlier lap. The first lap is never in it: there
 * is nothing earlier for it to repeat.
 */
export function lapsThatFiledNothingNew(
  lapFilings: ReadonlyArray<ReadonlyArray<{ kind: string; title: string }>>,
): number[] {
  const seen = new Set<string>();
  const out: number[] = [];
  lapFilings.forEach((filed, i) => {
    const keys = filed.map((f) => `${f.kind} ${f.title.trim().toLowerCase()}`);
    /* A lap that filed NOTHING AT ALL is not a lap that repeated itself. It is
       a lap that produced nothing, which the column's own rows already say
       turn by turn, and folding the two together would put "nothing new" on a
       lap whose honest report is "nothing". */
    if (i > 0 && keys.length > 0 && keys.every((k) => seen.has(k))) out.push(i + 1);
    for (const k of keys) seen.add(k);
  });
  return out;
}

/**
 * The second sentence, or null when there is nothing discriminating to say.
 *
 * Silent when every lap filed something new, because then the circling is a
 * run making progress the long way round and the lead has already said the
 * only true thing about it.
 */
export function nothingNewLine(round: Round, repeats: readonly number[]): string | null {
  if (repeats.length === 0) return null;
  if (repeats.length === round.laps - 1) {
    return round.laps === 2
      ? "The second lap filed nothing that was not already on the record."
      : "Every lap after the first filed nothing that was not already on the record.";
  }
  if (repeats.length === 1 && repeats[0] === round.laps) {
    return "The last lap filed nothing that was not already on the record.";
  }
  const list = repeats.map(String);
  const joined =
    list.length === 1 ? list[0]! : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]!}`;
  return `Lap${list.length > 1 ? "s" : ""} ${joined} filed nothing that was not already on the record.`;
}
