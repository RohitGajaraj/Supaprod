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
import { sameClaim } from "@/components/spine/what-this-station-kept-saying";
import type { PlatformWall } from "@/lib/spine/the-wall-the-platform-put-up";

/**
 * What a station cannot start without, and whether this workspace has it.
 *
 * `null` is "we did not read it" and is NOT "no". The difference decides
 * whether this surface speaks at all, and collapsing it would put a setup
 * notice on a workspace nobody checked -- the same defect as `gatesLiveWork`'s
 * null, which its own docstring spends a paragraph forbidding.
 */
/** The things a station can be missing. Not every field of the read is one. */
export type Needed = "evidence" | "repository" | "deployTarget";

export type WorkspaceSetup = {
  /**
   * Does this workspace hold ANY evidence to search?
   *
   * ── IT COUNTED SCOUT TARGETS FIRST, AND THAT WAS WRONG ──────────────────
   * The first version asked whether a source was connected, because 0 of 23
   * workspaces have an enabled `scout_target` and that number is real. S1
   * measured the rest of it an hour later and it changes the question:
   * **1,524 signals exist**, written by agent runs rather than ingested by a
   * configured source. So a workspace can have no scout target and 334 signals,
   * and telling a person there was nowhere to look would be false on every one
   * of them.
   *
   * A scout target is ONE way evidence arrives. What Discover actually needs is
   * evidence, so that is what this counts. The door still points at Sources,
   * because that is how a person deliberately adds some.
   */
  evidence: boolean | null;
  /** A repository bound. Build cannot start without one. */
  repository: boolean | null;
  /** Somewhere to release to. Ship cannot finish without one. */
  deployTarget: boolean | null;
  /**
   * Open runs standing at the same station as this one, not counting it.
   *
   * Null when nobody asked or the count did not come back; zero is a real
   * answer and means this run is the only one there.
   */
  othersAtThisStation?: number | null;
  /**
   * The wall the PLATFORM put up on this run, and whether it still stands.
   *
   * Read through Lane 1's `wallsByTrack`, which is the product's one reader of
   * `halted_reason` -- a second would be two surfaces answering one question
   * and drifting apart between deploys. Null when no slug halt was recorded, or
   * when no track was asked about.
   *
   * NOT used by `nowhereToLookYet`, which is about what a workspace is missing
   * rather than what the platform refused. It rides on this read because the
   * hold card already awaits it, so the answer costs no second round trip --
   * see `alsoBehindIt`, which is what consumes it.
   */
  wall?: PlatformWall | null;
};

/** What each station cannot begin without. Stations absent from this need nothing. */
const NEEDS: Partial<Record<AgentStation, Needed>> = {
  sense: "evidence",
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
const THING: Record<Needed, { absent: string; door: string; href: string }> = {
  /* The sentence names EVIDENCE and the door names a source, because they are
     different things: evidence is what Discover needs, and connecting a source
     is one way to get some. Saying "no source is connected" would be true of
     every workspace in the product and false about whether there was anywhere
     to look. */
  evidence: {
    absent: "This workspace holds no evidence yet.",
    door: "Connect a source",
    href: "/sources",
  },
  /*
   * ── THE DOOR LANDED ON THE PROFILE PAGE, AND I NEVER OPENED IT ──────────
   * These read `/settings?tab=connectors` from the day they shipped.
   * `connectors` is not a `SectionId` and not in `LEGACY_SECTION_MAP`, so
   * `normalizeSection` fell through to `DEFAULT_SECTION` -- **profile**. The
   * one actionable control on the hold card, the half the agent's own prose
   * cannot be, sent a person to their account settings.
   *
   * I proved the WALL was real -- `connection_bindings` = 0 on the measured
   * workspace -- and told Lane 1 the door was right on the strength of it. A
   * door is a second claim and it needed its own read. `AppFrame.tsx`, one
   * directory away, had `?tab=connections` and was correct the whole time.
   *
   * `?section=` is the canonical param (`?tab=` is a legacy alias kept
   * landing), and `connections` is a real section that renders Connectors.
   * `a-door-must-open.test.ts` now resolves every settings link in `src/`
   * against the section vocabulary, because this class is invisible to
   * everything except clicking it.
   */
  repository: {
    absent: "No repository is connected to this workspace.",
    door: "Connect a repository",
    href: "/settings?section=connections",
  },
  deployTarget: {
    absent: "No deployment target is connected to this workspace.",
    door: "Connect a deployment target",
    href: "/settings?section=connections",
  },
};

export type NowhereToLook = {
  /** The sentence, which says what is absent and never what it means. */
  said: string;
  /** Where to go and get one. */
  door: { label: string; href: string };
  /**
   * How many other runs are standing in the same place, when we counted and
   * there are any. Null on nought, so the surface never says "0 other runs".
   */
  alsoWaiting: string | null;
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
  const others = input.setup.othersAtThisStation;
  return {
    /*
     * WHAT IS ABSENT, AND NOT WHAT IT MEANS. "No source is connected, so there
     * was nowhere to look" is one clause too many: the station's own line
     * already said it found nothing, and this sentence's whole job is the fact
     * that line could not include. A second clause explaining the first is the
     * machinery narrating itself, which is what the rest of this screen has
     * been repaired for.
     */
    said: t.absent,
    door: { label: t.door, href: t.href },
    /*
     * ── THE SCALE, WHICH IS THE DIFFERENCE BETWEEN A NUISANCE AND A SETTING ─
     *
     * Measured all time: 82 of the 121 tracks this product has ever made stand
     * at Discover, and 37 were abandoned there. Per workspace it is starker --
     * in the four where it bites, EVERY open run at Discover has nothing filed:
     * 5 of 5, 5 of 5, 4 of 4, 3 of 3.
     *
     * One stuck run is something a person shrugs at. Five stuck on one missing
     * connection is a reason to go and change a setting, and the screen could
     * not say which of the two it was showing. This is the fact a person needs
     * before they think to ask for it.
     *
     * IT COUNTS AND DOES NOT PREDICT. "5 other runs are standing here" is a
     * fact; "connecting a source unblocks them" is not one this can support --
     * a source brings evidence forward from the day it is connected and does
     * not retroactively give a three-week-old run something to have found. So
     * it says where they are and stops.
     */
    alsoWaiting:
      typeof others === "number" && others > 0
        ? `${others} other ${others === 1 ? "run is" : "runs are"} standing here too.`
        : null,
  };
}

/**
 * WHEN THE AGENT HAS ALREADY SAID IT, THE DOOR IS THE ONLY NEW THING.
 *
 * The Now card quotes the seat that hit the wall. Printing this module's
 * sentence underneath is the same sentence twice, a few pixels apart, which is
 * the defect this screen has been repaired for five times this week.
 *
 * So the halves separate. The QUOTE says what is wrong, in the words of the
 * seat, which are better than anything here can write. The DOOR says where to
 * go, derived from the workspace's own state, which is the half the quote
 * cannot be -- an agent's prose is not a link.
 *
 * ── IT COMPARED STATIONS AND SHOULD HAVE COMPARED SENTENCES ──────────────
 * The first version asked whether the blocker's station was the station the run
 * stands at. Read on the served build, `6cc7a010`, that is exactly wrong: the
 * blocker is Build's and the run stands at Design, so the rule said "different
 * station, keep the sentence" and the card drew
 *
 *   "No repository is connected for this workspace. Binding a repository is
 *    required before any code changes... Please bind a repository on
 *    Connectors and retry."
 *   Connect a repository
 *   No repository is connected to this workspace.
 *
 * Two lines apart, saying one thing. **The station was never the question.**
 * What decides it is whether the sentence is already on the screen, and a
 * blocker quoted about ANOTHER station is still quoted, still two lines up,
 * still read first.
 *
 * Which makes this the sixth sighting of law 14 tonight and the second in my
 * own code: correct in the module, correct in the card, wrong composed, and
 * invisible until both were rendered together.
 *
 * `sameClaim` scores the claim rather than the string, because the two
 * sentences are written by different authors about one fact -- the seat says
 * "for this workspace" and this module says "to this workspace" -- and string
 * equality would call them different every time.
 */
export function theQuoteAlreadySaidIt(
  quoted: string | null | undefined,
  found: NowhereToLook | null,
): boolean {
  return Boolean(found && sameClaim(quoted, found.said));
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
