import type { SwarmHud } from "@/lib/swarm.functions";

/**
 * WHETHER A QUIET BOARD IS THIS PRODUCT WORKING, OR THIS PRODUCT STOPPED.
 *
 * ── THE PROBLEM, IN THE FOUNDER'S OWN FRAMING ──────────────────────────────
 * "A truthfully empty board that is still worth looking at, without implying
 * work that is not happening." The second half is the hard half. A calm screen
 * is the product's best day and its worst failure wearing the same pixels, and
 * the reader cannot tell which one they are looking at.
 *
 * `QuietMorning` answers the first-run version of this well: it teaches the
 * SHAPE of a decision with a worked example, declared as an example, carrying
 * no working control. What neither it nor anything else on this board answers
 * is the returning reader's question, which is not "what does a decision look
 * like" but **"is anything actually running?"**
 *
 * ── THREE SITUATIONS THE BOARD DRAWS IDENTICALLY ───────────────────────────
 *   1. The crew ran, finished, and none of it needed a person.  THE PRODUCT
 *      WORKING, and the one thing it most wants to be able to say.
 *   2. The crew has not run for days. THE PRODUCT STOPPED, and today it looks
 *      exactly like (1).
 *   3. No agent is switched on yet. A SETUP STATE, which is neither of the
 *      above and needs a door rather than reassurance.
 *
 * Telling them apart is the whole of this module, and every part of it is
 * derivable from a read the board already makes.
 *
 * ── IT COSTS NO REQUEST ────────────────────────────────────────────────────
 * `HandoverNote` and `AgentRelay` already read `getSwarmHud` under the key
 * `["swarm","hud",workspaceId]`. React-query dedupes to one round trip however
 * many components ask, which is the same argument `OverlapNote`'s header makes
 * for enriching rows from one shared read.
 *
 * ── WHAT IS DELIBERATELY NOT CLAIMED ───────────────────────────────────────
 * `throughput.total_runs` is tempting and is NOT used. Its handler bounds it
 * with `.gte("created_at", oneHourAgoIso)`, so it counts the last HOUR — on a
 * quiet board that is a zero, and printing "0 runs" from a one-hour window as
 * though it described the morning would be a wrong number wearing a fact's
 * clothes. `latest_run.created_at` carries no window at all, which is why the
 * sentence is built from it.
 *
 * Nor does this say "nothing the crew did needed you". `approvals` is what is
 * PENDING, not what was resolved, so that would be a claim about the past made
 * from a snapshot of the present. The lanes above already establish that
 * nothing is waiting; this says who was working and when they last did.
 */

/** What the board can prove about the crew's own activity. */
export interface CrewPulse {
  /** Agents switched on. Zero means nothing can run, which is a setup fact. */
  enabled: number;
  /** Epoch ms of the most recent run any agent started, or null if none has. */
  lastRunAt: number | null;
}

/** Epoch ms, or null when absent, unparseable, or ahead of our clock. */
function instant(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms) || ms > now) return null;
  return ms;
}

export function crewPulse(hud: SwarmHud | null | undefined, now: number): CrewPulse {
  const agents = hud?.agents ?? [];
  let lastRunAt: number | null = null;
  for (const a of agents) {
    const ms = instant(a.latest_run?.created_at, now);
    if (ms !== null && (lastRunAt === null || ms > lastRunAt)) lastRunAt = ms;
  }
  return { enabled: agents.filter((a) => a.enabled).length, lastRunAt };
}

/**
 * The sentence for a quiet board, or null when there is nothing provable.
 *
 * NULL WHEN THE READ HAS NOT ANSWERED, which is the difference between this and
 * a false all-clear. `crewPulse(undefined)` reports zero enabled agents exactly
 * as a workspace with none does, so the caller must pass `known` rather than
 * letting an unanswered read render as "no agent is switched on yet" — that
 * sentence would send someone to configure a crew they already have.
 */
export function crewPulseLine(
  pulse: CrewPulse,
  now: number,
  ago: (iso: string | null | undefined) => string | null,
  known: boolean,
): string | null {
  if (!known) return null;

  if (pulse.enabled === 0) {
    // A setup state, not a quiet one. The caller pairs this with a door.
    return "No agent is switched on yet, so nothing can run here.";
  }

  const crew = pulse.enabled === 1 ? "1 agent is on" : `${pulse.enabled} agents are on`;

  if (pulse.lastRunAt === null) {
    // Switched on and never run. Distinct from stale, and from working.
    return `${crew}, and none of them has run yet.`;
  }

  const since = ago(new Date(pulse.lastRunAt).toISOString());
  if (!since) return `${crew}.`;
  return `${crew}. The last one ran ${since} ago.`;
}
