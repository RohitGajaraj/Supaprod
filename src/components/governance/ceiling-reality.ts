/**
 * WHAT A CEILING COSTS TO REACH, SAID BESIDE THE CEILING ITSELF.
 *
 * The boundary screen states the policy -- "$10.00. A run that reaches it halts
 * and says so" -- and states nothing about whether that number has ever meant
 * anything. A person reads it and concludes they have a working brake. They
 * have no way from this screen to tell a brake from a decoration.
 *
 * Measured on the live database on 2026-08-27, they had a decoration. Every one
 * of the 21 workspaces carries the same $10.00 per-goal ceiling, the most
 * expensive single run ever recorded spent $0.142, the most expensive whole
 * goal $0.4297 across 25 handoffs, and `agent_runs.halted_reason` has never
 * once carried `mission_spend_cap` -- all-time, not in a window. The only halts
 * on record are ten `out_of_credit` and eight sweeper sentences.
 *
 * So this returns the other half of the sentence: what the work actually cost,
 * over a population it names, and whether anything ever stopped there.
 *
 * ── THREE THINGS IT REFUSES TO CLAIM ──────────────────────────────────────
 *
 * 1. IT NEVER SPEAKS FOR A RUN IT CANNOT SEE. The caller's population is the
 *    last 25 rows of `agent_runs` for THIS person (`getGovernanceOverview`),
 *    not the workspace and not all time. "Your last 25 runs" is in the sentence
 *    for that reason: a count whose population is not named is a count that
 *    will be read as covering everything.
 *
 * 2. IT NEVER SUMS A GOAL. The ceiling is enforced against the SUM of
 *    `spend_used_usd` across every run sharing a `mission_id` (the
 *    `mission_cap_state` RPC), and the rows this reads carry no `mission_id`,
 *    so a per-run figure is the most this can honestly say. It says "runs", and
 *    the label beside it says the ceiling counts a whole goal, so the reader is
 *    never handed a number that looks like the one being capped. Understating
 *    an amount spent is the safe direction here: it makes a ceiling look TIGHTER
 *    than it is, never looser.
 *
 * 3. SILENCE OVER A GUESS. No runs, or no run carrying a usable amount, returns
 *    null and draws nothing. "Nothing has come near this ceiling" asserted out of
 *    an empty read is the reassuring answer arrived at by omission, which R-22
 *    forbids in exactly those words.
 */

/** The shape `getGovernanceOverview().runs` already returns. Numeric columns
 *  arrive as strings from PostgREST for `numeric`, so both are accepted. */
export interface CeilingRun {
  spend_used_usd?: number | string | null;
  halted_reason?: string | null;
}

export interface CeilingReality {
  /** The sentence to draw beside the ceiling, or null to draw nothing. */
  said: string | null;
  /** Runs in the population that the spend gate itself stopped. */
  stopped: number;
  /** The most expensive single run in the population, in dollars. */
  highest: number | null;
  /** How many runs were read. Always named inside `said`. */
  population: number;
}

const NOTHING: CeilingReality = { said: null, stopped: 0, highest: null, population: 0 };

/** A dollar amount the record actually wrote, or null. Zero is a real answer
 *  and is kept; a negative or unparseable value is not an amount. */
function dollars(v: number | string | null | undefined): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Whether the SPEND GATE stopped this run, as opposed to anything else that
 * halts one.
 *
 * `halt_agent_run` is called with `${err.kind}: ${err.message}`, so a run the
 * ceiling stopped carries the literal `mission_spend_cap` (runtime.server.ts).
 * Matching the kind and not the word "spend" is what keeps `out_of_credit` --
 * which is the platform running out of money, not this policy binding -- from
 * being counted as proof that the reader's ceiling works.
 */
function stoppedOnSpend(reason: string | null | undefined): boolean {
  return /\bmission_spend_cap\b/.test(reason ?? "");
}

/** "$0.05", and never "$0.0537" on a surface: two places is what a person
 *  reads a price in. An amount under a cent says so rather than rounding to
 *  "$0.00", which reads as free. */
export function money(n: number): string {
  if (n > 0 && n < 0.01) return "under $0.01";
  return `$${n.toFixed(2)}`;
}

function runsWord(n: number): string {
  return n === 1 ? "Your last run" : `Your last ${n} runs`;
}

/** "cost $0.05 at the most" reads wrong about a single run, which cost exactly
 *  that. One run gets the plain verb; a population gets the superlative. */
function costPhrase(population: number, highest: number): string {
  return population === 1 ? `cost ${money(highest)}` : `cost ${money(highest)} at the most`;
}

export function ceilingReality(runs: readonly CeilingRun[] | null | undefined): CeilingReality {
  if (!runs || runs.length === 0) return NOTHING;

  const amounts = runs.map((r) => dollars(r.spend_used_usd)).filter((n): n is number => n !== null);
  if (amounts.length === 0) return NOTHING;

  const stopped = runs.filter((r) => stoppedOnSpend(r.halted_reason)).length;
  const highest = Math.max(...amounts);
  const population = amounts.length;
  const subject = runsWord(population);
  const cost = costPhrase(population, highest);

  /* THE STOPS LEAD WHEN THERE ARE ANY. A ceiling that has actually bound is a
     working brake, and that is the more decision-relevant fact than a price. */
  if (stopped > 0) {
    const many =
      population === 1
        ? "it stopped here"
        : stopped === 1
          ? "one stopped here"
          : `${stopped} stopped here`;
    return { said: `${subject} ${cost}, and ${many}.`, stopped, highest, population };
  }

  if (highest === 0) {
    return {
      said: `${subject} ${population === 1 ? "has" : "have"} not spent anything yet.`,
      stopped: 0,
      highest: 0,
      population,
    };
  }

  const none = population === 1 ? "it did not stop here" : "none of them stopped here";
  return { said: `${subject} ${cost}, and ${none}.`, stopped: 0, highest, population };
}
