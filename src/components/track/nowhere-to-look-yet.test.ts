/**
 * THE THREE WAYS THIS WOULD BE A LIE, EACH WITH ITS OWN ASSERTION.
 *
 * The measurement behind the module: 23 workspaces, 0 scout targets, and 124 of
 * 124 `sources.status` calls in the product's whole history returning zero. But
 * workspaces DO hold signals -- 1,524 of them, arriving by routes other than a
 * scout -- so "no source connected" does not mean "nothing to search", and a
 * surface that said it did would be the same lie pointing the other way.
 *
 * That is why every case below is about REFUSING to speak.
 */
import { describe, expect, it } from "bun:test";

import {
  nowhereToLookYet,
  theQuoteAlreadySaidIt,
  theRunNeverHadASource,
  type WorkspaceSetup,
} from "./nowhere-to-look-yet";

const NOTHING_CONNECTED: WorkspaceSetup = {
  evidence: false,
  repository: false,
  deployTarget: false,
};
const ALL_CONNECTED: WorkspaceSetup = { evidence: true, repository: true, deployTarget: true };
const UNREAD: WorkspaceSetup = { evidence: null, repository: null, deployTarget: null };

describe("a station that had nowhere to look", () => {
  it("says what is absent, for Discover", () => {
    const out = nowhereToLookYet({
      station: "sense",
      filedAnything: false,
      setup: NOTHING_CONNECTED,
    })!;
    /*
     * THE SENTENCE NAMES EVIDENCE AND THE DOOR NAMES A SOURCE, deliberately.
     * 0 of 23 workspaces hold a scout target, so "no source is connected" is
     * true of every workspace in the product and says nothing about whether
     * there was anywhere to look. 1,524 signals exist, written by agent runs.
     * Evidence is what Discover needs; a source is one way to get some.
     */
    expect(out.said).toBe("This workspace holds no evidence yet.");
    expect(out.door).toEqual({ label: "Connect a source", href: "/sources" });
  });

  it("and for Build and Ship, which need different things", () => {
    expect(
      nowhereToLookYet({ station: "build", filedAnything: false, setup: NOTHING_CONNECTED })!.said,
    ).toBe("No repository is connected to this workspace.");
    expect(
      nowhereToLookYet({ station: "ship", filedAnything: false, setup: NOTHING_CONNECTED })!.said,
    ).toBe("No deployment target is connected to this workspace.");
  });

  it("says what is absent and never what it means", () => {
    /*
     * The station's own line already said it found nothing. This sentence's
     * whole job is the fact that line could not include, and a clause
     * explaining the first is the machinery narrating itself.
     */
    const said = nowhereToLookYet({
      station: "sense",
      filedAnything: false,
      setup: NOTHING_CONNECTED,
    })!.said;
    expect(said).not.toMatch(/so |because|which is why|nowhere|explains|that is/i);
  });
});

describe("and the three ways it would be a lie", () => {
  it("silent on a station that needs nothing", () => {
    // Decide with no sources connected is an ordinary Decide.
    for (const station of ["decide", "define", "design", "learn"] as const) {
      expect(
        nowhereToLookYet({ station, filedAnything: false, setup: NOTHING_CONNECTED }),
      ).toBeNull();
    }
  });

  it("silent on a station that FILED, whatever the setup says", () => {
    // It found something, so it looked somewhere, and the record's verdict
    // beats any account of what was connected.
    expect(
      nowhereToLookYet({ station: "sense", filedAnything: true, setup: NOTHING_CONNECTED }),
    ).toBeNull();
  });

  it("silent on a setup fact nobody read", () => {
    /*
     * Null is "we did not look" and is NOT "no". Collapsing it would put a
     * setup notice on a workspace nobody checked -- the same defect
     * `gatesLiveWork`'s docstring spends a paragraph forbidding.
     */
    expect(nowhereToLookYet({ station: "sense", filedAnything: false, setup: UNREAD })).toBeNull();
    expect(nowhereToLookYet({ station: "sense", filedAnything: false, setup: null })).toBeNull();
    expect(
      nowhereToLookYet({ station: "sense", filedAnything: false, setup: undefined }),
    ).toBeNull();
  });

  it("and silent when the thing IS connected", () => {
    // A workspace with a source, whose Discover found nothing, genuinely
    // searched and genuinely found nothing. That is a finding about the world
    // and the screen must not turn it into a setup gap.
    expect(
      nowhereToLookYet({ station: "sense", filedAnything: false, setup: ALL_CONNECTED }),
    ).toBeNull();
  });

  it("and on a station the record cannot name", () => {
    expect(
      nowhereToLookYet({ station: null, filedAnything: false, setup: NOTHING_CONNECTED }),
    ).toBeNull();
  });
});

describe("the run that never had a source", () => {
  /*
   * A run whose FIRST station had nowhere to look is a different run from one
   * that reached Build and stopped: nothing downstream ever had a chance.
   */
  it("speaks when the entry station was the one with nowhere to look", () => {
    expect(
      theRunNeverHadASource({
        entryStation: "sense",
        filedAnything: false,
        setup: NOTHING_CONNECTED,
      })!.said,
    ).toBe("This workspace holds no evidence yet.");
  });

  it("and not when the run entered somewhere that needs nothing", () => {
    // A run started at Decide from a person's own sentence never needed a
    // source, and telling them it did would explain a failure that did not
    // happen.
    expect(
      theRunNeverHadASource({
        entryStation: "decide",
        filedAnything: false,
        setup: NOTHING_CONNECTED,
      }),
    ).toBeNull();
  });

  it("nor when the run filed something", () => {
    expect(
      theRunNeverHadASource({
        entryStation: "sense",
        filedAnything: true,
        setup: NOTHING_CONNECTED,
      }),
    ).toBeNull();
  });
});

describe("when the agent has already said it, the door is the only new thing", () => {
  const found = nowhereToLookYet({
    station: "build",
    filedAnything: false,
    setup: NOTHING_CONNECTED,
  });

  /* The real quote, from `6cc7a010` on the served build. */
  const QUOTED =
    "No repository is connected for this workspace. Binding a repository is required before any code changes, file operations, or builds can proceed. Please bind a repository on Connectors and retry.";

  it("drops the sentence when the quote above is already saying it", () => {
    expect(theQuoteAlreadySaidIt(QUOTED, found)).toBe(true);
  });

  it("EVEN THOUGH the quote is about a different station", () => {
    /*
     * THE FIRST VERSION COMPARED STATIONS AND THIS IS THE CASE THAT BROKE IT.
     * On `6cc7a010` the blocker is Build's and the run stands at Design, so a
     * station comparison said "different, keep the sentence" and the card drew
     * the quote, the door, and then "No repository is connected to this
     * workspace." two lines under it.
     *
     * The station was never the question. What decides it is whether the
     * sentence is already on the screen, and a blocker quoted about another
     * station is still quoted, still two lines up, still read first.
     */
    expect(found!.said).toBe("No repository is connected to this workspace.");
    expect(QUOTED).toContain("for this workspace");
    expect(theQuoteAlreadySaidIt(QUOTED, found)).toBe(true);
  });

  it("scores the claim, not the string", () => {
    // Two authors, one fact: the seat says "for this workspace" and this module
    // says "to this workspace". String equality calls them different every time.
    expect(QUOTED).not.toContain(found!.said);
  });

  it("keeps the sentence when the quote is about something else", () => {
    expect(
      theQuoteAlreadySaidIt(
        "The test suite timed out after ninety seconds on the payments module.",
        found,
      ),
    ).toBe(false);
  });

  it("and when there is no quote at all", () => {
    // A station that found nothing cleanly has no blocker above it, so this
    // sentence is the only thing saying why.
    expect(theQuoteAlreadySaidIt(null, found)).toBe(false);
    expect(theQuoteAlreadySaidIt(undefined, found)).toBe(false);
  });

  it("says nothing to suppress when there is no gap", () => {
    expect(theQuoteAlreadySaidIt(QUOTED, null)).toBe(false);
  });
});

describe("how many others are standing in the same place", () => {
  /*
   * 82 of the 121 tracks this product has ever made stand at Discover and 37
   * were abandoned there; per workspace, in the four where it bites, EVERY open
   * run at Discover has nothing filed. One stuck run is something a person
   * shrugs at. Five on one missing connection is a reason to change a setting,
   * and the screen could not say which it was showing.
   */
  const withPeers = (n: number | null): WorkspaceSetup => ({
    ...NOTHING_CONNECTED,
    othersAtThisStation: n,
  });

  it("says how many, when there are any", () => {
    expect(
      nowhereToLookYet({ station: "sense", filedAnything: false, setup: withPeers(4) })!
        .alsoWaiting,
    ).toBe("4 other runs are standing here too.");
  });

  it("counts one correctly", () => {
    expect(
      nowhereToLookYet({ station: "sense", filedAnything: false, setup: withPeers(1) })!
        .alsoWaiting,
    ).toBe("1 other run is standing here too.");
  });

  it("says nothing on a nought, rather than '0 other runs'", () => {
    expect(
      nowhereToLookYet({ station: "sense", filedAnything: false, setup: withPeers(0) })!
        .alsoWaiting,
    ).toBeNull();
  });

  it("and nothing when nobody counted", () => {
    expect(
      nowhereToLookYet({ station: "sense", filedAnything: false, setup: withPeers(null) })!
        .alsoWaiting,
    ).toBeNull();
    expect(
      nowhereToLookYet({ station: "sense", filedAnything: false, setup: NOTHING_CONNECTED })!
        .alsoWaiting,
    ).toBeNull();
  });

  it("counts and does not predict", () => {
    /*
     * "5 other runs are standing here" is a fact. "Connecting a source unblocks
     * them" is not one this can support: a source brings evidence forward from
     * the day it is connected and does not retroactively give a three-week-old
     * run something to have found.
     */
    const line = nowhereToLookYet({
      station: "sense",
      filedAnything: false,
      setup: withPeers(5),
    })!.alsoWaiting!;
    expect(line).not.toMatch(/unblock|will |would |fix|solve|release/i);
  });
});
