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
export type ArtifactSource = {
  table: string;
  /**
   * Extra columns appended to the body, labelled, when they hold a value.
   *
   * For the one case where the row's own text is not the whole of what the next
   * station needs: a decision's `rationale` explains the call, and the FORECAST
   * is what a later station has to grade against.
   */
  also?: readonly string[];
  /** The column on THIS table that best names the row. */
  title: string;
  /**
   * A parent row whose name is better than anything this table holds.
   *
   * Only `deployment` needs one, and it needs one badly. A deployments row has
   * no human name at all: not a title, not a name, not a label. Falling back to
   * its URL rendered the Ship station as a bare hostname, which is the machine's
   * identifier for the release rather than the work's, and it was the one
   * artifact in the loop a person could not recognise on sight. The changeset it
   * shipped carries the real name, one foreign key away
   * (`deployments_changeset_id_fkey`), so the release borrows it and the URL
   * stays as the fallback for a row whose changeset is gone.
   */
  parent?: { table: string; column: string };
  /**
   * The column holding the row's own text, when it has one.
   *
   * Read by the HANDOFF (`loadUpstream` in driver.server.ts), not by the chain
   * panel, which needs only a name. It lives here because the two must resolve
   * the same row from the same table: the brief an agent is given and the record
   * a person audits have to be one story about one piece of work, and the moment
   * they read from two maps they are free to drift into two.
   *
   * Absent where the row genuinely has no body. A `mission` is a container whose
   * content is its steps, and a `deployment` is a URL and a timestamp; inventing
   * a body column for either would be the runtime failure this file's header
   * warns about, since a bad column inside `.select()` typechecks clean.
   *
   * Checked against src/integrations/supabase/types.ts, one by one. Note how
   * little agreement there is between tables: `body_md`, `content`, `summary`,
   * `detail`, `rationale` and `description` all mean "the text of this thing".
   */
  body?: string;
};

export const ARTIFACT_SOURCE: Readonly<Record<string, ArtifactSource>> = {
  signal: { table: "signals", title: "title", body: "content" },
  theme: { table: "themes", title: "title", body: "summary" },
  prd: { table: "prds", title: "title", body: "body_md" },
  task: { table: "tasks", title: "title", body: "detail" },
  changeset: { table: "studio_changesets", title: "title", body: "summary" },
  mission: { table: "missions", title: "title" },
  // The four stations that gained hands on 2026-08-01. Every one of these
  // tables was already sitting there fully shaped, waiting only for a tool.
  //
  // THE TITLE COLUMN IS NAMED PER KIND, not assumed. Three of these four do not
  // have a `title` at all: a prototype has a `name`, a learning has a `summary`,
  // and a deployment has no human name whatsoever. Hard-coding `title` across
  // the set would have compiled perfectly and failed on the first real read,
  // which is the documented failure mode for this client and the reason each of
  // these was checked against the generated types rather than guessed.
  /*
   * THE FORECAST TRAVELS WITH THE DECISION, OR LEARN CANNOT GRADE IT.
   *
   * A decision carried `title` and `rationale` into the next station's brief and
   * nothing else, so the three forecast columns — the claim, the observable that
   * settles it, and the date it comes due — reached no station. S4 measured the
   * consequence across the whole population: **18 of 18 runs by the two Learn
   * seats have no "forecast" anywhere in their input**, including two composed
   * briefs of 7,800 characters. Not truncation, not deploy lag. It was never
   * sent.
   *
   * `CLAUDE.md` calls the forecast captured at decision time the moat. It is
   * being captured. Nothing has ever read it back.
   */
  decision: {
    table: "decisions",
    title: "title",
    body: "rationale",
    also: ["forecast_claim", "forecast_how_we_will_know", "forecast_horizon_date"],
  },
  prototype: { table: "prototypes", title: "name", body: "description" },
  // A learning's `summary` IS its text, so it is both the name and the body.
  // Named twice on purpose rather than special-cased: the handoff wants the
  // verdict in full, and the panel wants something to label the stop with.
  learning: { table: "learnings", title: "summary", body: "summary" },
  deployment: {
    table: "deployments",
    title: "deploy_url",
    parent: { table: "studio_changesets", column: "title" },
  },
};

/**
 * What an always-empty station says for itself.
 *
 * IT IS EMPTY, AND THAT IS THE POINT (founder ruling 2026-08-01). This map
 * briefly held four sentences explaining why nothing could ever land at Decide,
 * Design, Ship and Learn: "design is done with people today", and so on. The
 * founder read them and called it correctly. Those sentences were not a
 * description of a design, they were an unfinished build wearing one, and they
 * put the wrapper story into our own product: four sevenths of the loop
 * advertised to the customer as human work, on the surface whose entire job is
 * to show that agents ran the loop.
 *
 * The four stations all had an active lead agent and a fully shaped table, and
 * were missing only a registered tool. So the tools were built
 * (`decision.record`, `design.draft`, `learning.record`, `release.publish`) and
 * the excuse was deleted. The test pinning this map to `STATION_ARTIFACT.gap`
 * is what forced the deletion: closing the gaps made it fail until the words
 * came out, which is the behaviour we want from every explanation of a hole.
 *
 * KEPT, EMPTY, ON PURPOSE. A future station may genuinely have no agent path,
 * and when that happens the sentence belongs here in plain words rather than in
 * an engineering note that leaks tool names onto a surface. The type and the
 * test survive; the excuses do not.
 */
export const NOTHING_LANDS_HERE: Readonly<Partial<Record<AgentStation, string>>> = {};

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
