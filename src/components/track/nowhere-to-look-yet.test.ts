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
  theRunNeverHadASource,
  type WorkspaceSetup,
} from "./nowhere-to-look-yet";

const NOTHING_CONNECTED: WorkspaceSetup = {
  sources: false,
  repository: false,
  deployTarget: false,
};
const ALL_CONNECTED: WorkspaceSetup = { sources: true, repository: true, deployTarget: true };
const UNREAD: WorkspaceSetup = { sources: null, repository: null, deployTarget: null };

describe("a station that had nowhere to look", () => {
  it("says what is absent, for Discover", () => {
    const out = nowhereToLookYet({
      station: "sense",
      filedAnything: false,
      setup: NOTHING_CONNECTED,
    })!;
    expect(out.said).toBe("No source is connected to this workspace.");
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
    ).toBe("No source is connected to this workspace.");
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
