/**
 * What actually happened on a piece of work, agent by agent, in order.
 *
 * FOUNDER RULING 2026-08-01: "if some agents are working, there should be some
 * scope for showing visually that this agent is what, after this particular
 * agent it switched to next agent, this is the outcome. Something like Claude
 * Code or Copilot or Codex. Some status message on each station so the user
 * knows what is happening, what got changed, what is it impacting."
 *
 * THE REFERENCE, named before building, per the standing rule. Claude Code's
 * own transcript is the information model: a flat, chronological stream where
 * every entry is ONE actor doing ONE thing, stamped with what it touched and
 * what came back. Not a progress bar, not a percentage, not a spinner with a
 * noun. The three things it always shows, and this does too:
 *
 *   1. WHO is acting, by name, right now.
 *   2. WHAT it did, in verbs, with the thing it touched named.
 *   3. WHAT CAME OUT, as an artifact you can open, or an honest nothing.
 *
 * The one thing it adds, because this product has stations and Claude Code does
 * not, is the HANDOFF: the moment one agent finishes and the next picks the work
 * up. That transition is the product's whole claim, and it was invisible.
 *
 * WHY IT REFUSES TO INVENT A STATUS. Everything here is derived from rows that
 * were written by the run itself: `agent_runs` for who acted and how it ended,
 * `spine_track_members` for what was filed. Nothing is inferred from timing,
 * nothing says "working on it" because a row is missing, and a station that
 * produced nothing says exactly that. A status display that guesses is worse
 * than none, because a person cannot tell the guesses from the facts.
 *
 * ── A TURN NOW CARRIES ITS COST AND ITS REASON (2026-08-25) ─────────────
 * `tookMs`, `tokens` and `stopLine` make a turn readable as a unit of work
 * rather than as an event, and all three are the same argument as the paragraph
 * above, applied to a column instead of to a status:
 *
 *   A ZERO IS NOT A MEASUREMENT. `duration_ms` is a hardcoded 0 on 742 of the
 *   2,272 track-linked runs and every one of them burned tokens; `tokens_used`
 *   is NOT NULL so a hole in it can only be spelled 0, and 570 spell it that
 *   way. Both collapse to `null` and print nothing. See `Turn.tookMs`.
 *
 *   A REASON COMES FROM A COLUMN, NEVER FROM THE AGENT'S SENTENCE. The seats
 *   write "I cannot proceed" onto rows whose status says they completed, and
 *   F-54 is the standing record of a seat's narrative disagreeing with its own
 *   tool calls. Only `halted_reason` and `failure_kind` are written by the
 *   platform, so only they are quoted. See `Turn.stopLine`.
 *
 * Pure and dependency-free; the server function does the reads and hands the
 * rows in, the same split route.ts, driver.ts, attach.ts and chain.ts use.
 */
import {
  AGENT_STATIONS,
  SPECIALIST_CATALOG,
  agentDisplayName,
  type AgentStation,
} from "@/lib/agent-vocabulary";
import { KIND_WORD } from "@/lib/spine/attach";

/** A run the driver started for this track. */
export type RunRow = {
  id: string;
  agent_slug: string;
  agent_name: string | null;
  status: string;
  output: string | null;
  created_at: string;
  spend_used_usd: number | string | null;
  /**
   * Milliseconds the run was alive.
   *
   * OPTIONAL ON THIS TYPE, like the three below it, for the reason
   * `run-analytics.ts` states about its own new columns: naming a column a
   * deploy has not migrated yet fails the WHOLE PostgREST query, and a
   * transcript that vanishes tells a reader nothing happened. A missing field
   * degrades one figure; a missing column degrades the screen.
   */
  duration_ms?: number | null;
  tokens_used?: number | null;
  /** Why the platform stopped the run. `out_of_credit`, or a whole sentence. */
  halted_reason?: string | null;
  /** What class of thing broke. `model_error` is the only value on record. */
  failure_kind?: string | null;
  /**
   * The run's own correlator into `ai_events`, and from there into
   * `credit_ledger` -- see `creditsSpentByTrace` (credits.functions.ts) for why
   * that join has to happen off this column rather than the run's own id.
   * Optional for the same reason as the three columns above it: a caller that
   * does not select it must not fail the whole query, and a run that predates
   * the column has none to give.
   */
  trace_id?: string | null;
};

/** An artifact this track collected, with when it landed. */
export type MemberRow = {
  artifact_kind: string;
  artifact_id: string;
  station: string;
  created_at: string;
};

/** One agent's turn: who acted, how it ended, and what it left behind. */
export type Turn = {
  runId: string;
  agentSlug: string;
  /** The role name a person reads: Draft, Critique, Verify. Never the slug. */
  agentName: string;
  station: AgentStation | null;
  stationName: string;
  at: string;
  /**
   * How the turn ended, in the product's words rather than the column's.
   *
   * `working` is only ever said when the row literally says `running`; it is
   * never inferred from a missing row or from elapsed time.
   */
  outcome: "working" | "done" | "partly" | "stopped" | "waiting";
  /** What it produced, resolved to kind words a person recognises. */
  made: Array<{ kind: string; word: string; id: string }>;
  /** The agent's own last line. Trimmed, never rewritten. */
  said: string | null;
  /**
   * How long the seat worked, in milliseconds, or null when NOTHING MEASURED IT.
   *
   * ── ZERO IS NOT A MEASUREMENT ON THIS COLUMN, AND THAT IS THE WHOLE POINT ─
   * The obvious reading of `duration_ms` is "null means unknown, a number means
   * measured". It is wrong here, and rendering a `0` as `0s` would be exactly
   * the class of claim this file exists to refuse. Counted on production,
   * 2026-08-25, over the 2,272 runs that carry a `track_id`:
   *
   *   duration_ms > 0     1,355   a real elapsed time
   *   duration_ms = 0       742   and EVERY ONE OF THEM burned tokens
   *   duration_ms IS NULL   175   never written at all
   *
   * Every single zero row has `tokens_used > 0`, so not one of them is a run
   * that genuinely took no time: a model call cannot. `run-analytics.ts` already
   * carries the cause in its own header, measured independently -- *"`duration_ms`
   * was a hardcoded 0 in both finalize paths"* -- and refuses the same value on
   * the same grounds, so this is that rule applied at a second reader rather
   * than a second rule.
   *
   * So a zero and a null collapse to one answer, `null`, and the transcript
   * prints no figure at all rather than telling a person a 76-second turn was
   * instant.
   */
  tookMs: number | null;
  /**
   * Tokens this turn burned, or null when the column carries no count.
   *
   * SAME RULE, AND IT HAS TO BE. `tokens_used` is `NOT NULL` so it can only say
   * "nothing counted this" by saying 0, and 570 of the 2,272 track-linked runs
   * do -- almost all of them `failed`, 397 of which carry `failure_kind:
   * model_error`, which means the run REACHED a model and the finalizer never
   * wrote what it spent. A zero there is a hole, not a bill of zero.
   */
  tokens: number | null;
  /**
   * WHY THE RECORD SAYS THIS TURN STOPPED, as a finished sentence, or null.
   *
   * ── READ FROM A COLUMN, NEVER FROM THE AGENT'S PROSE ────────────────────
   * This is the narrow half of a wide temptation. The seats on this track write
   * things like *"I cannot proceed... the repository tree could not be
   * retrieved"* while their own row says `completed_with_failures`, and the
   * reflex is to read the sentence and call the turn refused. F-54 is the
   * standing reason not to: a seat's narrative disagreed with its own tool calls
   * for as long as the checking seat has existed, and a transcript that grades
   * turns by their prose would inherit every one of those lies and present it as
   * a fact. `halted_reason` and `failure_kind` are written by the platform, not
   * by the agent, so they are the only refusal this view is entitled to assert.
   *
   * The turn's own PRODUCE-NOTHING fact is separate and lives in `made`, which
   * is a join against `spine_track_members` and equally unfakeable. Between the
   * two, a reader can see the seat's claim and the record side by side and judge
   * the disagreement themselves, which is the only honest thing this screen can
   * do about it.
   */
  stopLine: string | null;
  usd: number;
  /**
   * Credits this turn's own calls debited, summed off `credit_ledger` and
   * keyed by `trace_id` -- see `RunRow.trace_id`. Like `usd`, a real debit
   * legitimately lands on zero (a seat that refused before reaching a model),
   * so this is never null; it is the account's own currency, and P-136 (one
   * currency on the run screen) is what leads with it instead of `usd`.
   */
  credits: number;
  /**
   * The trace this turn wrote, when the runtime recorded one. The run screen
   * opens it as the depth behind a turn ("open the full trace"); null on runs
   * older than tracing and on turns that never reached a model.
   */
  traceId: string | null;
};

const OUTCOME: Record<string, Turn["outcome"]> = {
  running: "working",
  queued: "waiting",
  completed: "done",
  completed_with_failures: "partly",
  halted: "stopped",
  failed: "stopped",
};

/**
 * How wide a window counts an artifact as belonging to a turn.
 *
 * A member row records the station it came from but not the RUN, so a station
 * whose crew is three agents cannot say which of the three filed what from the
 * rows alone. The turn that was open when the row landed is the one credited,
 * bounded by the next turn's start, which is exact whenever the crew runs
 * sequentially. The crew does run sequentially, by construction in
 * `driveTrackOnce`, so this is a lookup rather than a guess; the constant exists
 * only to bound the LAST turn, which has no successor to end it.
 */
export const TRAILING_CREDIT_MS = 5 * 60 * 1000;

/** The chronological story of one piece of work. */
export function buildActivity(input: {
  runs: RunRow[];
  members: MemberRow[];
  /** Each run's own credits, keyed by `trace_id` -- from `creditsSpentByTrace`. */
  creditsByTrace?: Record<string, number>;
}): Turn[] {
  const runs = [...input.runs].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const members = [...input.members].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return runs.map((r, i) => {
    const start = Date.parse(r.created_at);
    const nextStart = i + 1 < runs.length ? Date.parse(runs[i + 1].created_at) : null;
    const end = nextStart ?? start + TRAILING_CREDIT_MS;

    const made = members
      .filter((m) => {
        const t = Date.parse(m.created_at);
        return t >= start && t < end;
      })
      .map((m) => ({
        kind: m.artifact_kind,
        word: KIND_WORD[m.artifact_kind]?.one ?? m.artifact_kind,
        id: m.artifact_id,
      }));

    // The station is taken from what this turn FILED, never from where the
    // track happens to be standing now: a track moves on, and a turn that ran
    // at Plan must keep saying Plan when it is read back an hour later.
    /*
     * ── A TURN THAT FILED NOTHING STILL RAN SOMEWHERE (2026-09-08) ────────
     * Walked live: Discover's three "filed nothing" turns sat under the Decide
     * header, because the move row is stamped before the seats of the station
     * it left, and a turn with no member had no station of its own. The seat's
     * own station is fixed in the catalog, so it is the honest fallback, and it
     * is still not "where the track stands now".
     */
    const station = ((made[0]?.kind ? stationOfMember(members, made[0].id) : null) ??
      stationOfSeat(r.agent_slug)) as AgentStation | null;

    return {
      runId: r.id,
      agentSlug: r.agent_slug,
      /*
       * ONE SEAT, ONE NAME (Lane 1 ruling, 2026-09-08). The stored
       * `agent_name` is the mission era's job title ("Discovery Scout", "PRD
       * Writer"); the catalog's is the role a person reads on every other
       * surface ("Watch", "Draft"), and `presenceColour` hashes the name, so
       * two names for one seat were two colours on one screen. The catalog
       * wins wherever the slug is known; the stored name stands where it is
       * not; the slug itself only when there is nothing else.
       */
      agentName: agentDisplayName(r.agent_slug, r.agent_name),
      station,
      stationName: station ? (AGENT_STATIONS[station]?.name ?? station) : "",
      at: r.created_at,
      outcome: OUTCOME[r.status] ?? "stopped",
      made,
      said: r.output?.trim() ? r.output.trim() : null,
      tookMs: measured(r.duration_ms),
      tokens: measured(r.tokens_used),
      stopLine: stopLine(r),
      usd: Number(r.spend_used_usd ?? 0) || 0,
      credits: (r.trace_id && input.creditsByTrace?.[r.trace_id]) || 0,
      traceId: r.trace_id ?? null,
    };
  });
}

/**
 * A figure that was actually measured, or null.
 *
 * ONE HELPER FOR THE TWO COLUMNS BECAUSE THEY FAIL THE SAME WAY, and writing
 * the rule twice is how the two readers drift. See `Turn.tookMs` for the counts
 * behind `<= 0`; the short form is that a zero on either column is a finalizer
 * that did not write, and admitting it is how a placeholder becomes a statistic.
 */
function measured(v: number | null | undefined): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return v;
}

/**
 * The platform's own reason this run stopped, spelled for a reader, or null.
 *
 * `halted_reason` IS TWO VOCABULARIES IN ONE COLUMN and both are on production:
 * a slug the halt path writes (`out_of_credit`, 8 rows) and a whole sentence the
 * stall sweeper writes (*"Stopped automatically: no progress for 4 hours..."*,
 * 8 rows). Framing the sentence again would stutter, and printing the slug raw
 * puts an engine word on a screen the Engine-Room doctrine says must not carry
 * one. Whitespace is the test between them, which is exact rather than clever:
 * a slug has none.
 *
 * `failure_kind` is the fallback and is always a slug (`model_error`). It is
 * read SECOND because a halt reason is the more specific fact whenever a row
 * carries both.
 *
 * Null when neither column says anything, and that is deliberate: `outcome`
 * already carries THAT the turn stopped. This carries WHY, and inventing a why
 * from a status word is the thing being avoided.
 */
function stationOfSeat(slug: string | null | undefined): AgentStation | null {
  if (!slug) return null;
  return SPECIALIST_CATALOG.find((e) => e.slug === slug)?.station ?? null;
}

function stopLine(r: RunRow): string | null {
  const raw = (r.halted_reason ?? "").trim() || (r.failure_kind ?? "").trim();
  if (!raw) return null;
  if (/\s/.test(raw)) return raw;
  return `Stopped: ${raw.replace(/[_-]+/g, " ")}.`;
}

function stationOfMember(members: MemberRow[], artifactId: string): string | null {
  return members.find((m) => m.artifact_id === artifactId)?.station ?? null;
}

/** "2 signals and a spec", never "2 signal(s)". */
export function countKinds(made: Turn["made"]): string {
  const byKind = new Map<string, number>();
  for (const m of made) byKind.set(m.kind, (byKind.get(m.kind) ?? 0) + 1);

  const parts = [...byKind.entries()].map(([kind, n]) => {
    const w = KIND_WORD[kind];
    if (!w) return `${n} ${kind}`;
    return n === 1 ? `a ${w.one}` : `${n} ${w.many}`;
  });

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** Whether anything is live right now, for the header a person glances at. */
export function liveTurn(turns: Turn[]): Turn | null {
  return turns.find((t) => t.outcome === "working" || t.outcome === "waiting") ?? null;
}
