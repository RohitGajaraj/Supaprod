/**
 * THE ONE SETTING THAT DECIDES EVERYTHING ELSE ON THE BOUNDARY SCREEN, SAID ON
 * THE BOUNDARY SCREEN.
 *
 * A person reads "your crew does 68 of 74 things without asking" and has no way
 * from that page to learn WHY, or that there is a dial. The answer is not the
 * per-tool settings above it: 16 of those 68 are set to come to you first. The
 * answer is the rung every agent sits on, which `resolveApprovalMode` composes
 * with each tool's mode before the loop runs anything.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-27: `agent_autonomy` holds 93 rows and
 * every single one is `trusted`, 92 of them from the bootstrap in
 * `20260708150000_founder_autonomy_defaults.sql` rather than from any promotion.
 * So the sentence a person most needs is that this is where agents START.
 *
 * THE WORDS ARE THE TRUST DIAL'S OWN, VERBATIM. TrustDial says "it runs alone,
 * except the risky calls" for this rung; saying it differently here would give
 * one setting two vocabularies across two screens, which is how a person comes
 * to believe they are two settings. §12 keeps "arc" out of the copy entirely.
 *
 * IT NEVER DESCRIBES A CREW BY ITS LOOSEST MEMBER. Nine trusted agents and
 * three that ask first is not "your agents run alone", so a mixed crew is
 * counted rather than generalised.
 */

export type Rung = "observing" | "proving" | "trusted" | "ambient";

/**
 * What each rung does, in the trust dial's own words, in both numbers.
 *
 * TWO FORMS AND NOT ONE WITH AN `s` BOLTED ON. The subject changes with the
 * count ("all 12 of your agents RUN", "every one of them RUNS"), and `proving`
 * changes more than its verb: "asks before IT acts" becomes "ask before THEY
 * act". A single string cannot carry that, and the first draft of this file
 * shipped "12 of your agents runs alone" straight past me.
 */
const RUNG_SAYS: Record<Rung, { one: string; many: string }> = {
  observing: { one: "waits for you on everything", many: "wait for you on everything" },
  proving: { one: "asks before it acts", many: "ask before they act" },
  trusted: {
    one: "runs alone except on the risky calls",
    many: "run alone except on the risky calls",
  },
  ambient: { one: "runs alone, always", many: "run alone, always" },
};

/** Loosest last. Used to name the crew by its most permissive rung when they
 *  differ, because that is the one that answers "what can they do alone". */
const ORDER: readonly Rung[] = ["observing", "proving", "trusted", "ambient"];

export interface CrewStanding {
  /** The sentence, or null when there is nothing honest to say. */
  said: string | null;
  /** Agents with a rung on record. */
  total: number;
}

export function whereTheCrewStands(
  counts: Partial<Record<Rung, number>> | null | undefined,
): CrewStanding {
  const present = ORDER.map((r) => [r, counts?.[r] ?? 0] as const).filter(([, n]) => n > 0);
  const total = present.reduce((n, [, c]) => n + c, 0);

  /*
   * NO ROWS IS NOT NO AGENTS, and it must not read as one. `loadAgentArc` hands
   * a run with no row `trusted` anyway (SW-7), so an empty table means the
   * default is in force for everybody rather than that nobody is running.
   */
  if (total === 0) {
    return {
      said: `Nobody has set a level for any agent, so every one of them ${RUNG_SAYS.trusted.one}. You can change that per agent on Crew.`,
      total: 0,
    };
  }

  if (present.length === 1) {
    const [rung, n] = present[0];
    const who = n === 1 ? "Your one agent" : `All ${n} of your agents`;
    return { said: `${who} ${n === 1 ? RUNG_SAYS[rung].one : RUNG_SAYS[rung].many}.`, total };
  }

  /* Mixed: lead with the loosest, because that is the rung that answers the
     question this screen exists for, then say what the rest do. */
  const loosest = present[present.length - 1];
  const rest = total - loosest[1];
  return {
    said: `${loosest[1]} of your ${total} agents ${loosest[1] === 1 ? RUNG_SAYS[loosest[0]].one : RUNG_SAYS[loosest[0]].many}. The other ${rest === 1 ? "one is held tighter" : `${rest} are held tighter`}.`,
    total,
  };
}
