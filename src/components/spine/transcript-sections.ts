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
 * CONSECUTIVE IDENTICAL TURNS FOLD INTO ONE (2026-09-08).
 *
 * Seen live on a run stopped at Design: twelve rows in a row reading "Nothing
 * was filed for this step. Design, 0.6s. Stopped", one per sweep tick, ten
 * minutes apart. Twelve identical rows distinguish nothing; what a person
 * needs is that it happened twelve times between 09:50 and 11:00. So a run
 * of turns with the same seat, the same outcome, the same stop line, nothing
 * filed and nothing said folds into one entry that carries the count and the
 * span. Three is the floor: two identical rows are still two events.
 */
export type TranscriptItem =
  | { kind: "row"; row: ActivityRow }
  | {
      kind: "repeat";
      row: ActivityRow;
      count: number;
      firstAt: number;
      lastAt: number;
      key: string;
    };

function foldKey(row: ActivityRow): string | null {
  if (row.kind !== "turn") return null;
  const t = row.turn;
  if (t.made.length > 0) return null;
  if (t.outcome === "working" || t.outcome === "waiting") return null;
  /* The seat's own last line is part of the identity: twelve turns that said
     the same sentence are one event repeated, twelve that said different
     things are twelve. The walk that found this had twelve identical rows
     each carrying the same closed sentence, so the first rule (fold nothing
     that said anything) folded none of them. */
  return [t.agentName, t.station ?? "", t.outcome, t.stopLine ?? "", t.said ?? ""].join(" ");
}

export function foldRepeats(rows: readonly ActivityRow[], floor = 3): TranscriptItem[] {
  const out: TranscriptItem[] = [];
  let i = 0;
  while (i < rows.length) {
    const key = foldKey(rows[i]!);
    let j = i + 1;
    if (key !== null) {
      while (j < rows.length && foldKey(rows[j]!) === key) j += 1;
    }
    const n = j - i;
    if (key !== null && n >= floor) {
      const first = rows[i]!;
      const last = rows[j - 1]!;
      out.push({
        kind: "repeat",
        row: last,
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
