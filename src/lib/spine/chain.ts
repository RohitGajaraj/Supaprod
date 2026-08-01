/**
 * Reading a track back: one piece of work, station by station, with what each
 * station actually produced.
 *
 * WHY THIS EXISTS. `spine_track_members` has been written well since the
 * attachment pass landed, and until now nothing read it as membership. There
 * was exactly one read in the product, `missionForTrack` in driver.server.ts,
 * and it filters `artifact_kind = 'mission'` and takes one row: the machine
 * reading back its own bookkeeping so Build does not open a fresh mission every
 * tick. Signals, specs, tasks, code changes and clusters were write-only.
 *
 * That is worth naming precisely, because a partial reader is better camouflage
 * for a missing door than no reader at all. A dead-code scan sees traffic on
 * the table and stays quiet, while the record the whole product is built on has
 * no reader anywhere.
 *
 * WHAT THIS MODULE IS, AND IS NOT. It orders and states; it does no I/O. The
 * server function resolves titles and hands the resolved rows in, the same pure
 * module plus server function split route.ts, driver.ts and attach.ts already
 * use, so the ordering rules are tested without a database.
 *
 * THE ROUTE IS RENDERED, NOT JUST THE MEMBERS. A chain built only from rows
 * that exist would show a track as an unbroken run of productive stations and
 * silently omit every station that produced nothing. Those are the interesting
 * ones: four of the seven have no registered tool that writes their artifact at
 * all, so they will always be empty, and a reader deserves to know the
 * difference between "nothing happened here yet" and "nothing can land here".
 * `STATION_ARTIFACT` already records that per station, in a sentence, so an
 * empty stop carries the reason rather than looking like a failure.
 *
 * THREE RULES IT WILL NOT BREAK, all of them the read-side twin of the write
 * side's refusal to guess:
 *
 *   1. A member whose artifact row is GONE is kept and marked, never dropped.
 *      Dropping it would make the chain under-report and look complete, which
 *      is the same lie by omission the attachment pass rejected time windows
 *      for. A record that quietly shrinks is worse than one that says "this was
 *      filed and I can no longer find it".
 *   2. A member is never invented from proximity. Nothing here queries for what
 *      appeared near a track in time, or infers membership from a shared user.
 *      What is on the record is what was filed.
 *   3. Every member appears EXACTLY ONCE. Stations shown are the union of the
 *      route, its waivers, and any station that actually holds a member, so a
 *      row filed at a station the route no longer visits still surfaces instead
 *      of falling through the floor. `total` exists so the invariant is
 *      assertable, and a test asserts it.
 */
import { AGENT_STATIONS, AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { KIND_WORD, joinPlainly } from "@/lib/spine/attach";
import type { SpineRoute } from "@/lib/spine/route";

/**
 * Which table holds each kind that can become a member.
 *
 * Deliberately its own map rather than derived from `TOOL_PRODUCTS`, because
 * `mission` is written by the driver and by no tool, so no tool-keyed map can
 * cover the set. A test asserts every kind `TOOL_PRODUCTS` can write appears
 * here, which is what keeps the two from drifting: register a tool that files a
 * new kind and the test fails until this reader can resolve it.
 *
 * Every table below was checked to carry `id` and `title` against
 * src/integrations/supabase/types.ts. That check is not optional here: a column
 * that does not exist inside a `.select()` string typechecks perfectly and
 * fails only at runtime.
 */
export const ARTIFACT_TABLE: Readonly<Record<string, string>> = {
  signal: "signals",
  theme: "themes",
  prd: "prds",
  task: "tasks",
  changeset: "studio_changesets",
  mission: "missions",
};

/**
 * What an always-empty station says for itself, in plain words.
 *
 * WHY THIS IS NOT `STATION_ARTIFACT.gap`. That field is an engineering note and
 * reads like one: it names tools ("decision.revise only edits one that
 * exists"). The voice rules keep mechanism words off surfaces a person reads,
 * so the same fact is said twice, once for each audience, and a test asserts
 * the two maps cover exactly the same stations. Add a tool that closes a gap
 * and the test fails until this map drops the station too.
 *
 * THESE SENTENCES DO NOT APOLOGISE. Four of the seven stations will be empty on
 * every track that ever runs, so this copy is the most-read text on the
 * surface. It says where the artifact actually comes from, which is useful and
 * true, rather than "nothing yet", which reads as a stall the person is
 * supposed to fix.
 */
export const NOTHING_LANDS_HERE: Readonly<Partial<Record<AgentStation, string>>> = {
  decide: "Calls here are made by people, and recorded as decisions rather than filed by an agent.",
  design: "Design is done with people today, so nothing arrives here on its own.",
  ship: "A release is recorded when it goes out, by the path that ships it.",
  learn: "What was learned is written by the outcome review after the fact, not during the run.",
};

/** A member row as it comes off the table. */
export type MemberRow = {
  artifact_kind: string;
  artifact_id: string;
  station: string;
  created_at: string;
};

/** A member after its title has been looked up, or found to be gone. */
export type ChainMember = {
  kind: string;
  /** The plain word for the kind, from the one vocabulary the driver uses. */
  word: string;
  artifactId: string;
  station: string;
  createdAt: string;
  /** The artifact's own title. Null when its row could not be found. */
  title: string | null;
  /** True when this was filed and its artifact no longer resolves. */
  missing: boolean;
};

/**
 * Where a station sits relative to the work.
 *
 * `not-reached` rather than a separate word per track status, because it is
 * true in both readings: on open work the station is still to come, on closed
 * work it never happened. Neither claims it was visited.
 */
export type StopState = "passed" | "here" | "not-reached" | "waived";

export type ChainStop = {
  station: AgentStation;
  label: string;
  state: StopState;
  /** The words the person gave when they waived it. Null when not waived. */
  waivedReason: string | null;
  members: ChainMember[];
  /**
   * Where this station's artifact actually comes from, said only when nothing
   * can land here and nothing has. A station that produced something needs no
   * explaining, and one that simply has not produced yet is not excused either:
   * "not yet" is already what an empty stop means.
   */
  gap: string | null;
};

export type Chain = {
  stops: ChainStop[];
  /** Members whose station column is not a station this build knows. */
  orphans: ChainMember[];
  /** Every member counted once. stops + orphans always sum to this. */
  total: number;
};

const ORDER = new Map<string, number>(AGENT_STATION_ORDER.map((s, i) => [s, i]));

function isStation(s: string): s is AgentStation {
  return ORDER.has(s);
}

/** Oldest first, with a stable tiebreak so equal timestamps do not reshuffle. */
function byTime(a: ChainMember, b: ChainMember): number {
  return a.createdAt === b.createdAt
    ? a.artifactId.localeCompare(b.artifactId)
    : a.createdAt.localeCompare(b.createdAt);
}

/** The plain word for a kind, falling back to the kind itself rather than throwing. */
export function wordFor(kind: string, n = 1): string {
  const w = KIND_WORD[kind] ?? { one: kind, many: `${kind}s` };
  return n === 1 ? w.one : w.many;
}

/**
 * Lay the members out along the route.
 *
 * Takes resolved members so it stays pure. A waiver outranks position, because
 * "you chose to skip this, and here is the reason you gave" is more use to a
 * reader than "this is behind you".
 */
export function buildChain(input: {
  route: SpineRoute;
  station: AgentStation;
  status: "open" | "done" | "abandoned";
  members: readonly ChainMember[];
}): Chain {
  const { route, station, status, members } = input;

  const orphans = members.filter((m) => !isStation(m.station)).sort(byTime);
  const placed = members.filter((m) => isStation(m.station));

  const waivedBy = new Map(route.waived.map((w) => [w.station as string, w.reason]));

  // The union, so nothing filed can fall outside the rendered set.
  const shown = new Set<string>();
  for (const s of route.path) shown.add(s);
  for (const w of route.waived) shown.add(w.station);
  for (const m of placed) shown.add(m.station);

  const here = ORDER.get(station) ?? 0;

  const stops: ChainStop[] = [...shown]
    .filter(isStation)
    .sort((a, b) => (ORDER.get(a) ?? 0) - (ORDER.get(b) ?? 0))
    .map((s) => {
      const idx = ORDER.get(s) ?? 0;
      const waivedReason = waivedBy.get(s) ?? null;
      const mine = placed.filter((m) => m.station === s).sort(byTime);

      // A closed track has passed the station it stopped on; an open one is
      // still standing there, which is a different sentence for the reader.
      const state: StopState =
        waivedReason !== null
          ? "waived"
          : idx < here || (idx === here && status !== "open")
            ? "passed"
            : idx === here
              ? "here"
              : "not-reached";

      return {
        station: s,
        label: AGENT_STATIONS[s].name,
        state,
        waivedReason,
        members: mine,
        gap: mine.length === 0 ? (NOTHING_LANDS_HERE[s] ?? null) : null,
      };
    });

  return { stops, orphans, total: members.length };
}

/**
 * One sentence for what is on the record, or the plain absence of one.
 *
 * It counts what was filed and nothing else. Missing artifacts are said out
 * loud in their own sentence rather than folded into the totals, because a
 * count that quietly includes rows the product can no longer show is the exact
 * kind of confident number this codebase keeps deleting.
 */
export function describeChain(chain: Chain): string {
  if (chain.total === 0) {
    return "Nothing has been filed against this work yet.";
  }

  const counts = new Map<string, number>();
  for (const stop of chain.stops) {
    for (const m of stop.members) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1);
  }
  for (const m of chain.orphans) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1);

  const parts = [...counts].map(([kind, n]) => `${n} ${wordFor(kind, n)}`);
  const gone = [...chain.stops.flatMap((s) => s.members), ...chain.orphans].filter(
    (m) => m.missing,
  ).length;

  const head = `${joinPlainly(parts)} on the record.`;
  if (gone === 0) return head;
  return `${head} ${gone === 1 ? "One of them" : `${gone} of them`} no longer resolves to anything we can show.`;
}
