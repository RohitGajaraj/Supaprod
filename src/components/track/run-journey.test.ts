import { describe, expect, it } from "bun:test";

import { journeyOutcome } from "./run-journey";

/**
 * "5 PROTOTYPES" WHERE THERE IS ONE DRAWING, MADE FIVE TIMES.
 *
 * Measured across every track that filed more than two:
 *
 *   track       filed   distinct names   distinct bodies
 *   2fdf93b6     13           2                3
 *   ce846e9b     10           3                5
 *   0c0db8e6      5           1                1
 *   6cc7a010      3           1                2
 *
 * On `0c0db8e6` the road said "5 prototypes" and there is ONE name and ONE
 * description. `whatItProduced`'s header records paying for this shape on
 * decisions -- "eight distinct calls is what a person infers, and one call
 * re-made is what happened" -- and the road is where a person reads it first.
 *
 * It is also one fact rendered two ways on ONE screen: the artifact pane folds
 * versions and says "5 versions, 4 the same" while the node said "5
 * prototypes". Both true, and a reader has to work out which.
 */
describe("the road counts drawings, not filings", () => {
  const drawing = (n: number, title: string) => ({
    kind: "prototype",
    artifactId: `p-${n}`,
    title,
    missing: false,
    createdAt: `2026-09-04T02:2${n}:00Z`,
    fields: {},
  });
  const design = (items: ReturnType<typeof drawing>[]) => ({
    station: "design" as const,
    label: "Design",
    state: "done" as const,
    waivedReason: null,
    expects: { kind: "prototype", word: "prototype" },
    everDriven: true,
    hold: null,
    holdReason: null,
    items,
  });

  it("says one drawing and how often, when five are one thing", () => {
    const five = [1, 2, 3, 4, 5].map((n) => drawing(n, "Arrival window on the order page"));
    expect(journeyOutcome(design(five), null)).toBe("1 prototype, 5 times");
  });

  it("leaves the line alone when every drawing is its own thing", () => {
    // The common case must not change: three different screens are three
    // prototypes, and adding "3 times" to them would be noise.
    const three = [1, 2, 3].map((n) => drawing(n, `Screen ${n}`));
    expect(journeyOutcome(design(three), null)).toBe("3 prototypes");
  });

  it("and agrees with the pane about what counts as one thing", () => {
    // Both use `foldVersions`, so the node and "N versions, M the same"
    // cannot disagree. Two of three share a title here.
    const mixed = [
      drawing(1, "Arrival window on the order page"),
      drawing(2, "Arrival window on the order page"),
      drawing(3, "Confirmation step"),
    ];
    expect(journeyOutcome(design(mixed), null)).toBe("2 prototypes, 3 times");
  });

  it("says nothing at a station that drew nothing", () => {
    expect(journeyOutcome(design([]), null)).toBeNull();
  });

  it("and does not count a drawing the lookup could not find", () => {
    // `missing` means the row was looked for and was not there; counting it
    // would promise something a person cannot open.
    const withGhost = [
      drawing(1, "Arrival window on the order page"),
      { ...drawing(2, "Arrival window on the order page"), missing: true },
    ];
    expect(journeyOutcome(design(withGhost), null)).toBe("1 prototype");
  });
});

/**
 * THE BIGGEST INSTANCE OF THIS IN THE PRODUCT, ON ITS BUSIEST NODE.
 *
 *   track       filed   distinct titles   distinct bodies
 *   6ff86b03     148          19                22
 *   425e6887     125          12                21
 *   47dcbf3c      67           4                 4
 *
 * `47dcbf3c` said "67 findings" on the road. There are FOUR, logged about
 * seventeen times each. And Discover is where 82 of the 121 tracks this product
 * has ever made are standing, so it is the most-read node on the most common
 * screen.
 */
describe("the road counts findings, not filings", () => {
  const finding = (n: number, title: string) => ({
    kind: "signal",
    artifactId: `s-${n}`,
    title,
    missing: false,
    createdAt: `2026-09-04T02:${String(n).padStart(2, "0")}:00Z`,
    fields: {},
  });
  const discover = (items: ReturnType<typeof finding>[], everDriven = true) => ({
    station: "sense" as const,
    label: "Discover",
    state: "done" as const,
    waivedReason: null,
    expects: { kind: "signal", word: "finding" },
    everDriven,
    hold: null,
    holdReason: null,
    items,
  });

  it("says four findings and how often, not sixty-seven", () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      finding(i, `Homeowners cannot tell a reboot from an outage ${i % 4}`),
    );
    /* "findings", not "signals": the column word is `signal` and the canon
       renders it as "finding", which is the rename OPERATING-MODEL section 12
       made. My first assertion here said "signals" and the code was right. */
    expect(journeyOutcome(discover(many), null)).toBe("4 findings, 12 times");
  });

  it("leaves the line alone when every finding is its own", () => {
    const three = [1, 2, 3].map((n) => finding(n, `Finding ${n}`));
    expect(journeyOutcome(discover(three), null)).toBe("3 findings");
  });

  it("still says nothing found when a driven station found nothing", () => {
    // The state 82 of 121 tracks are actually in. It must not become "0
    // findings" or fall silent.
    expect(journeyOutcome(discover([]), null)).toBe("nothing found");
  });

  it("and says nothing at all at a station never driven", () => {
    expect(journeyOutcome(discover([], false), null)).toBeNull();
  });
});
