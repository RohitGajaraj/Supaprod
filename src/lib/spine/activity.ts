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
 * Pure and dependency-free; the server function does the reads and hands the
 * rows in, the same split route.ts, driver.ts, attach.ts and chain.ts use.
 */
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
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
  usd: number;
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
export function buildActivity(input: { runs: RunRow[]; members: MemberRow[] }): Turn[] {
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
    const station = (
      made[0]?.kind ? stationOfMember(members, made[0].id) : null
    ) as AgentStation | null;

    return {
      runId: r.id,
      agentSlug: r.agent_slug,
      agentName: r.agent_name?.trim() || r.agent_slug,
      station,
      stationName: station ? (AGENT_STATIONS[station]?.name ?? station) : "",
      at: r.created_at,
      outcome: OUTCOME[r.status] ?? "stopped",
      made,
      said: r.output?.trim() ? r.output.trim() : null,
      usd: Number(r.spend_used_usd ?? 0) || 0,
    };
  });
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
