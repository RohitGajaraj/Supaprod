/**
 * "NOTHING FOUND" AND "NOWHERE TO LOOK" ARE DIFFERENT ANSWERS AND THE SCREEN
 * GIVES ONE OF THEM.
 *
 * ── THE MEASUREMENT, AND IT IS THE WHOLE PLATFORM ─────────────────────────
 * The founder's words: *"I cannot feel the value or see real connectivity.
 * Nothing joins up."* Read literally against the database on 2026-09-09:
 *
 *     23 workspaces.
 *     0 scout targets, of any kind, enabled or not.
 *     124 `sources.status` calls in the whole history of the product.
 *     124 of them returned `{"active_scout_targets": 0}`.
 *
 * **Every time any agent has ever asked whether a source is connected, the
 * answer has been no.** There is no connectivity, and the product does not say
 * so anywhere a person building a run will meet it.
 *
 * ── WHAT LAYER 1 SAYS AND WHAT LAYER 3 KNOWS ──────────────────────────────
 * On `6cc7a010`, the run screen's road reads **"Discover: nothing found"** and
 * the story reads **"Discover filed nothing"**. Both true. What the trace holds,
 * two clicks down, is the model's own account:
 *
 *   sources.status -> {"active_scout_targets":0,"signals_7d_by_source":{}}
 *   "The sources.status shows zero active scout targets and no signals ingested
 *    in the last 7 days, WHICH EXPLAINS WHY NO EVIDENCE WAS FOUND."
 *
 * "Nothing found" reads as *we looked and there is nothing there*, which is a
 * finding about the world. The truth is *there is nowhere to look*, which is a
 * finding about the setup, and only one of the two has a door.
 *
 * That is the layer stitch the founder named, in one concrete instance: the
 * actionable half of the answer exists, it is two layers down, and nothing
 * carries it up.
 *
 * ── AND IT IS NOT ALWAYS TRUE, WHICH IS WHY THIS TAKES A FACT ─────────────
 * I nearly shipped "no sources connected is why nothing was found" as a general
 * claim and it is wrong. Workspaces DO hold signals: 334, 283, 261 in the three
 * largest, 1,524 in all, arriving by other routes than a scout. On those, a
 * station that searched and found nothing genuinely searched something, and
 * telling a person there was nowhere to look would be the same lie pointing the
 * other way.
 *
 * The track this was read off happens to sit in a workspace with **zero
 * signals and zero sources**, so both halves are true there. The distinction
 * has to be made per workspace, from a read, never from the shape of the
 * output -- which is why this function takes the setup facts and returns null
 * the moment it has not been given them.
 *
 * ── THE READ IT NEEDS DOES NOT EXIST YET ──────────────────────────────────
 * The run screen holds turns and tool-call SUMMARIES; `getTrackToolCalls`
 * returns `{id, tool, at, ok, latencyMs, error, argument, runId}` and no
 * result, so `sources.status`'s answer is not on this wire. Reading it off the
 * agent's prose is the trap S1 named on the Connectors door: pattern-matching
 * an English sentence gives a door that vanishes the moment a model rewords,
 * and an absent door looks exactly like a run that did not need one.
 *
 * So the input is the workspace's own state -- ask the workspace, not the agent
 * -- and the read is filed with Lane 3. This module is the decision, complete
 * and tested, and it draws nothing until it is fed.
 */
import type { AgentStation } from "@/lib/agent-vocabulary";

/**
 * What a station cannot start without, and whether this workspace has it.
 *
 * `null` is "we did not read it" and is NOT "no". The difference decides
 * whether this surface speaks at all, and collapsing it would put a setup
 * notice on a workspace nobody checked -- the same defect as `gatesLiveWork`'s
 * null, which its own docstring spends a paragraph forbidding.
 */
export type WorkspaceSetup = {
  /** Enabled scout targets. Discover has nowhere to look without one. */
  sources: boolean | null;
  /** A repository bound. Build cannot start without one. */
  repository: boolean | null;
  /** Somewhere to release to. Ship cannot finish without one. */
  deployTarget: boolean | null;
};

/** What each station cannot begin without. Stations absent from this need nothing. */
const NEEDS: Partial<Record<AgentStation, keyof WorkspaceSetup>> = {
  sense: "sources",
  build: "repository",
  ship: "deployTarget",
};

/**
 * The words for the thing, and where a person goes to get one.
 *
 * The noun is the whole label: "Connect a source" reads better than "Go to
 * Sources" and does not make a person learn the name of a screen to understand
 * the offer. A first draft carried the destination's name as well and nothing
 * read it, which is the tell that it was there for the writer.
 */
const THING: Record<keyof WorkspaceSetup, { noun: string; href: string }> = {
  sources: { noun: "source", href: "/sources" },
  repository: { noun: "repository", href: "/settings?tab=connectors" },
  deployTarget: { noun: "deployment target", href: "/settings?tab=connectors" },
};

export type NowhereToLook = {
  /** The sentence, which says what is absent and never what it means. */
  said: string;
  /** Where to go and get one. */
  door: { label: string; href: string };
};

/**
 * Did this station have anywhere to look?
 *
 * Null unless ALL of: the station needs something, the record says it filed
 * nothing, and the read came back saying that thing is absent. Every one of the
 * three is required, and each is a different way to be wrong:
 *
 *   a station that needs nothing      -- Decide with no sources is fine
 *   a station that FILED              -- it found something, so it looked
 *   a setup fact we did not read      -- see the note on `WorkspaceSetup`
 */
export function nowhereToLookYet(input: {
  station: AgentStation | null | undefined;
  filedAnything: boolean;
  setup: WorkspaceSetup | null | undefined;
}): NowhereToLook | null {
  if (!input.station || input.filedAnything || !input.setup) return null;
  const need = NEEDS[input.station];
  if (!need) return null;
  if (input.setup[need] !== false) return null;

  const t = THING[need];
  return {
    /*
     * WHAT IS ABSENT, AND NOT WHAT IT MEANS. "No source is connected, so there
     * was nowhere to look" is one clause too many: the station's own line
     * already said it found nothing, and this sentence's whole job is the fact
     * that line could not include. A second clause explaining the first is the
     * machinery narrating itself, which is what the rest of this screen has
     * been repaired for.
     */
    said: `No ${t.noun} is connected to this workspace.`,
    door: { label: `Connect a ${t.noun}`, href: t.href },
  };
}

/**
 * WHEN THE AGENT HAS ALREADY SAID IT, THE DOOR IS THE ONLY NEW THING.
 *
 * On `6cc7a010` the Now card quotes Build verbatim: *"No repository is
 * connected for this workspace. Please bind a repository on Connectors."*
 * Rendering "No repository is connected to this workspace." underneath that is
 * the same sentence twice, a few pixels apart, which is the defect this screen
 * has been repaired for four times this week.
 *
 * So the two halves separate. The QUOTE says what is wrong, in the words of the
 * seat that hit it, which are better than anything this module can write. The
 * DOOR says where to go, derived from the workspace's own state, which is the
 * half the quote cannot be trusted for -- an agent's prose is not a link, and
 * S1's point stands that matching on it gives a door that disappears when a
 * model rewords.
 *
 * Together they are what the card was missing: it named the wall and offered
 * nothing, or offered the one act ("send it back a step") that had already
 * failed three times.
 *
 * `true` when the record's own quote is already telling the person this, so the
 * caller draws the door alone.
 */
export function theQuoteAlreadySaidIt(
  blockerStation: AgentStation | null | undefined,
  found: NowhereToLook | null,
  atStation: AgentStation | null | undefined,
): boolean {
  return Boolean(found && blockerStation && atStation && blockerStation === atStation);
}

/**
 * The same question asked of a whole run, for the road and the story.
 *
 * A run whose FIRST station had nowhere to look is a different run from one
 * that got to Build and stopped: nothing downstream of it ever had a chance,
 * and saying so once at the top is worth more than a mark on each stop.
 */
export function theRunNeverHadASource(input: {
  entryStation: AgentStation | null | undefined;
  filedAnything: boolean;
  setup: WorkspaceSetup | null | undefined;
}): NowhereToLook | null {
  return nowhereToLookYet({
    station: input.entryStation,
    filedAnything: input.filedAnything,
    setup: input.setup,
  });
}
