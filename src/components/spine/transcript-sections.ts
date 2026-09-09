/**
 * THE TRANSCRIPT, CUT INTO THE STATIONS IT PASSED THROUGH.
 *
 * ── WHY SECTIONS ─────────────────────────────────────────────────────────
 * Walked live on 2026-09-08: the honest run's transcript was 40-odd rows in
 * one flat column, with "Moved to Build / the run moved on its own" as the
 * only seam between stations and a wall-clock HH:MM beside every row over a
 * run that spanned three days. A person opening it could not answer "what
 * happened at Design" without reading everything above and below Design.
 *
 * The founder's complaint is the same fact from the other side: *the stations
 * do not form a flow*. In the transcript the flow is the order the work
 * passed through them, and the seam between two stations is the most
 * important line in the column, because it is where one seat handed the work
 * to the next. So the seam becomes a header and the rows between two seams
 * become its section.
 *
 * ── WHAT DECIDES A SEAM ─────────────────────────────────────────────────
 * A `move` row, when the record has one. A turn whose station differs from
 * the section it would fall into, when the record has no move row for that
 * leg (older runs, and legs the sweep drove before transitions were written).
 * Rows without a station (a steer, a handoff) belong to the section they
 * arrived in.
 *
 * ── PURE, SO IT CAN BE TESTED WITHOUT A DOM ─────────────────────────────
 * Takes the merged rows in reading order (oldest first) and returns sections
 * in the same order. The move row itself is not rendered as a row; its
 * sentence ("the run moved on its own") becomes the section's `via` line.
 */
import type { ActivityRow } from "@/components/spine/activity-rows";
import type { AgentStation } from "@/lib/agent-vocabulary";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { claimOf, containment, MIN_CONTAINMENT } from "@/lib/spine/what-it-keeps-saying";

export type TranscriptSection = {
  /** Stable across polls: station plus the first row's key. */
  key: string;
  station: AgentStation | null;
  name: string;
  /** How the work arrived here, from the move row, or null when unrecorded or undistinguishing. */
  via: string | null;
  rows: ActivityRow[];
  /** Milliseconds, first and last row. */
  startAt: number;
  endAt: number;
  /** Seat names that acted here, in first-seen order. */
  seats: string[];
  turns: number;
  /** Summed `tookMs` over the turns that measured one, or null when none did. */
  tookMs: number | null;
  /** The last turn's outcome, the fact a closed section's header carries. */
  last: "working" | "done" | "partly" | "stopped" | "waiting" | null;
};

function stationOf(row: ActivityRow): AgentStation | null {
  if (row.kind === "turn") return row.turn.station;
  if (row.kind === "move") return row.to as AgentStation;
  return null;
}

function nameOf(station: AgentStation | null, fallback: string | null): string {
  if (station && AGENT_STATIONS[station]) return AGENT_STATIONS[station].name;
  return fallback ?? "Before the route";
}

export function transcriptSections(ordered: readonly ActivityRow[]): TranscriptSection[] {
  const sections: TranscriptSection[] = [];
  let current: TranscriptSection | null = null;

  const open = (station: AgentStation | null, row: ActivityRow, via: string | null) => {
    current = {
      key: `${station ?? "none"}:${row.key}`,
      station,
      name: nameOf(station, row.kind === "move" ? row.toName : null),
      via,
      rows: [],
      startAt: row.at,
      endAt: row.at,
      seats: [],
      turns: 0,
      tookMs: null,
      last: null,
    };
    sections.push(current);
    return current;
  };

  for (const row of ordered) {
    if (row.kind === "move") {
      open(row.to as AgentStation, row, row.line ?? null);
      continue;
    }
    const st = stationOf(row);
    if (!current || (st !== null && current.station !== null && st !== current.station)) {
      current = open(st, row, null);
    } else if (current.station === null && st !== null) {
      /* Rows that arrived before any station was recorded take the first
         station that does get recorded, rather than a nameless section. */
      current.station = st;
      current.name = nameOf(st, null);
    }
    current.rows.push(row);
    current.endAt = Math.max(current.endAt, row.at);
    current.startAt = Math.min(current.startAt, row.at);
    if (row.kind === "turn") {
      const t = row.turn;
      current.turns += 1;
      if (t.agentName && !current.seats.includes(t.agentName)) current.seats.push(t.agentName);
      if (t.tookMs !== null && t.tookMs > 0) current.tookMs = (current.tookMs ?? 0) + t.tookMs;
      current.last = t.outcome;
    }
  }
  return sections;
}

/**
 * Which sections open by default: the last one, and any that is still live
 * or ended in a stop, because those are the ones a person came to read.
 */
export function defaultOpen(sections: readonly TranscriptSection[]): Set<string> {
  const keys = new Set<string>();
  const last = sections[sections.length - 1];
  if (last) keys.add(last.key);
  for (const s of sections) {
    if (s.last === "working" || s.last === "waiting" || s.last === "stopped") keys.add(s.key);
  }
  return keys;
}

/** The header's one line: seats, turns and time, printed only where they discriminate. */
export function sectionMeta(s: TranscriptSection): string {
  const parts: string[] = [];
  if (s.seats.length > 0) parts.push(s.seats.join(", "));
  if (s.turns > 0) parts.push(`${s.turns} ${s.turns === 1 ? "turn" : "turns"}`);
  return parts.join(" · ");
}

/** A key that is equal for two instants on the same calendar day in the person's zone. */
export function dayKey(atMs: number, zone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(atMs));
}

/** The day, said the way a person would: "Thu, Sep 4". */
export function dayLabel(atMs: number, zone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(atMs));
}

/**
 * CONSECUTIVE TURNS THAT KEPT SAYING ONE THING FOLD INTO ONE.
 *
 * ── WHAT IT FOLDED WHEN IT MATCHED ON STRINGS, AND WHAT IT DID NOT ─────────
 * Written 2026-09-08 against a run stopped at Design: twelve rows reading
 * "Nothing was filed for this step. Design, 0.6s. Stopped", one per sweep tick,
 * ten minutes apart. Twelve identical rows distinguish nothing; what a person
 * needs is that it happened twelve times between 09:50 and 11:00. It folded
 * those correctly, because a sweep tick writes byte-identical rows.
 *
 * Read whole on `6cc7a010`, 2026-09-09, it folded NOTHING at Build, where the
 * dump was worst. Six turns, forty minutes:
 *
 *   02:30  Filed nothing. Engineer, 8.6s.   "No repository is connected for this
 *                                            workspace. I cannot proceed..."
 *   02:30  Filed nothing. Review, 6.0s.     "No repository is connected for this
 *                                            workspace. Repository connectivity
 *                                            is required before any code..."
 *   02:40  Filed nothing. Engineer, 6.9s.   "No repository is connected..."
 *   03:00  Filed nothing. Review, 6.5s.     "No repository is connected..."
 *   03:10  Filed nothing. Engineer, 7.6s.   "No repository is connected..."
 *   03:10  Filed nothing. Review, 5.9s.     "No repository is connected..."
 *
 * The identity was `agentName + station + outcome + stopLine + said`, and this
 * run breaks it twice over: the seat ALTERNATES between the station's two
 * agents, and the sentence is rewritten slightly every turn because a model
 * wrote it. **So the fold worked on the rows a cron produced and failed on the
 * rows an agent produced**, which is backwards -- an agent repeating itself is
 * the case a person actually needs folded, and a model never repeats itself
 * byte for byte.
 *
 * ── WHAT IT MATCHES ON NOW, AND WHY THAT MEASURE ──────────────────────────
 * The station, and the CLAIM, scored by `containment` from
 * `what-it-keeps-saying.ts` -- the same measure the refrain uses, whose
 * threshold was taken off seventeen real sentences rather than chosen
 * (restatements 0.250-0.636, unrelated 0.000-0.125, the line at 0.2).
 *
 * The seat leaves the identity and becomes something the folded entry REPORTS.
 * One station that cannot get past one wall is one event whether its two agents
 * take turns at it or not, and "Engineer and Review, 6 turns" is a better
 * sentence than six rows anyway.
 *
 * Everything else holds: nothing filed, nothing working or waiting, and the
 * floor is three, because two rows are still two events.
 *
 * ── WHAT THIS DELIBERATELY HIDES, AND WHERE IT WENT ───────────────────────
 * Six sentences become one, and the five not shown differ in their wording.
 * That is the trade the fold has always made and it is why the folded row
 * carries the representative turn's own tool calls and its trace door: the
 * count says how often, the quote says what, and the door says go and read the
 * turn itself. What is lost is five paraphrases of one sentence, which is the
 * "dump of data and content" this product was told about by name.
 */
export type TranscriptItem =
  | { kind: "row"; row: ActivityRow }
  | {
      kind: "repeat";
      row: ActivityRow;
      /** Every seat that took a turn in the run, first appearance first. */
      seats: string[];
      count: number;
      firstAt: number;
      lastAt: number;
      key: string;
    };

/**
 * What a turn has to have in common with its neighbour to fold into it.
 *
 * `where` must match exactly. `claim` is scored by containment when both have
 * one -- and when NEITHER does, `where` alone decides, which is the original
 * rule preserved intact: a sweep tick that writes no words at all is still one
 * event repeated, and it was the case this fold was written for.
 *
 * A turn with a claim never folds into one without, in either direction. They
 * are not the same event, and pretending otherwise would let a silent tick
 * swallow the one turn on the run that said why.
 */
function foldIdentity(row: ActivityRow): { where: string; claim: string | null } | null {
  if (row.kind !== "turn") return null;
  const t = row.turn;
  if (t.made.length > 0) return null;
  if (t.outcome === "working" || t.outcome === "waiting") return null;
  /* The stop line counts as the claim when there is no prose: a halt says
     nothing in `said` and everything in `stopLine`. */
  const claim = claimOf(t.said) ?? claimOf(t.stopLine);
  /* The seat stays in `where` ONLY for the silent case, where it is all the
     identity there is. Once a turn has words, the words are the identity and
     one station's two agents taking turns at one wall is one event. */
  const where = claim
    ? `${t.station ?? ""}|${t.outcome}`
    : `${t.station ?? ""}|${t.outcome}|${t.agentName}|${t.stopLine ?? ""}|${t.said ?? ""}`;
  return { where, claim };
}

export function foldRepeats(rows: readonly ActivityRow[], floor = 3): TranscriptItem[] {
  const out: TranscriptItem[] = [];
  let i = 0;
  while (i < rows.length) {
    const anchor = foldIdentity(rows[i]!);
    let j = i + 1;
    if (anchor) {
      while (j < rows.length) {
        const next = foldIdentity(rows[j]!);
        if (!next || next.where !== anchor.where) break;
        if ((anchor.claim === null) !== (next.claim === null)) break;
        /* Scored against the ANCHOR rather than the previous row, so a claim
           cannot drift across a long run by small steps until the last row
           shares nothing with the first. */
        if (
          anchor.claim !== null &&
          next.claim !== null &&
          containment(anchor.claim, next.claim) < MIN_CONTAINMENT
        ) {
          break;
        }
        j += 1;
      }
    }
    const n = j - i;
    if (anchor && n >= floor) {
      const first = rows[i]!;
      const last = rows[j - 1]!;
      const seats: string[] = [];
      for (let k = i; k < j; k += 1) {
        const r = rows[k]!;
        if (r.kind === "turn" && !seats.includes(r.turn.agentName)) seats.push(r.turn.agentName);
      }
      out.push({
        kind: "repeat",
        /*
         * ── THE REPRESENTATIVE TURN IS THE LAST, AND IT WAS THE FIRST FOR A DAY ────
         * The argument for the first was: every later turn is the same seat
         * re-reporting the same wall, so the first telling is the one written before
         * any of the re-trying coloured it. That is true of a STATIC wall. It is false
         * of a wall that is changing, and S1 read the difference on the served build
         * within an hour:
         *
         *   before  09:30  "3 times, 09:10 to 09:30"  ...account credit balance (15)
         *           11:00  "9 times, 09:40 to 11:00"  ...account credit balance (1)
         *   after   11:00  "12 times, 09:10 to 11:00" ...account credit balance (15)
         *
         * **Stamped at the END of the span and quoting the START of it**, over a hold
         * card still quoting (1), so one page carried one event with two balances and
         * the card's number matched no row below it. And 15 draining to 1 is the only
         * thing those twelve turns actually recorded happening -- the run spent the
         * account while failing -- so quoting the first is the single choice that hides
         * the only news in the group.
         *
         * The last is right on three counts and loses nothing on the fourth: it matches
         * the stamp a reader is looking at, it is the current state where the text
         * varies, it agrees with every other surface quoting the same group, and where
         * the text does not vary it is the same sentence.
         *
         * It also puts the row's stamp, quote, tool calls and trace door on ONE
         * turn. They were split -- `lastAt` for the clock, the first turn for
         * everything else -- which is the same mismatch in three more places.
         */
        row: last,
        seats,
        count: n,
        firstAt: first.at,
        lastAt: last.at,
        key: `repeat:${first.key}:${n}`,
      });
    } else {
      for (let k = i; k < j; k += 1) out.push({ kind: "row", row: rows[k]! });
    }
    i = j;
  }
  return out;
}
