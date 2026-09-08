/**
 * P-63 · A FIRST-VISIT ZERO STATE GETS ONE ACT, NOT JUST ONE SENTENCE.
 *
 * `Quiet` and `ApprovalCard` gained an optional action slot for exactly this
 * case (see each component's own header, and docs/design/first-visit-2026-09.md
 * for the full nine-door record). This is the source-text guard the design
 * doc promises: one fact per site that touched it, so a future edit that
 * drops the action back out fails loud rather than quietly regressing to the
 * blank-with-a-sentence state P-63 closed.
 *
 * Source text, not render: several of these sites need a live workspace read
 * to reach their zero branch at all, which a unit test cannot cheaply fake
 * across five different pages. Reading the file the same way
 * `the-rail-says-words-a-person-would-say.test.ts` reads `AppFrame.tsx` is
 * the same trade this repo already makes elsewhere for this reason.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("every P-63 first-visit site keeps its door", () => {
  it("Waiting: ApprovalCard's zero case is offered a zeroAction", () => {
    const card = read("src/components/meridian/ApprovalCard.tsx");
    expect(card).toContain("zeroAction");
    const route = read("src/routes/_authenticated.approvals.tsx");
    expect(route).toContain("zeroAction={");
    expect(route).toContain("Start a sentence");
  });

  it("Arriving: DiscoverSurface's Quiet carries a Connect a source action", () => {
    const surface = read("src/components/discover/DiscoverSurface.tsx");
    expect(surface).toContain("action={");
    expect(surface).toContain("Connect a source");
  });

  it("Outcomes: the empty-record branch renders Quiet with a Start a sentence action", () => {
    const route = read("src/routes/_authenticated.outcomes.tsx");
    expect(route).toContain("emptyRecord ? (");
    expect(route).toContain('says="Nothing is on the record yet."');
    expect(route).toContain("Start a sentence");
  });

  it("Conversations: both zero panes carry a Start a sentence action", () => {
    const route = read("src/routes/_authenticated.threads.tsx");
    // Two distinct sites: the left-pane list and the right-hand detail pane.
    const hits = route.match(/Start a sentence/g) ?? [];
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });

  it("Sources: a first visit meets what to connect, and the zero text names it", () => {
    /* 2026-09-08: the page's rebuild made the whole "Connect a source" region
       the door (one press per provider) rather than a single button under a
       list of negations; the zero text on the Connected region points at it. */
    const route = read("src/routes/_authenticated.sync.tsx");
    expect(route).toContain("Connect a source");
    expect(route).toContain("Connect a source below and Discover can read it.");
    expect(route).toContain("Each one opens that source's own sign-in");
  });

  it("Quiet.tsx and ApprovalCard.tsx document why the action defaults to none", () => {
    // The refusal this file's own header explains: a caller must opt in, an
    // ordinary empty queue must not grow a button nobody asked for.
    expect(read("src/components/meridian/Quiet.tsx")).toContain("action = null");
    expect(read("src/components/meridian/ApprovalCard.tsx")).toContain("zeroAction?: ReactNode");
  });
});
