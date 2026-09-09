/**
 * THE RUN IN THIS FILE IS `ce846e9b` ON HELIO LABS, READ 2026-09-09.
 *
 * Its stations, its counts, its decision's own rationale and the sentence Build
 * kept saying are all production rows. The point of the module is that these
 * five lines ARE the run, and that a person who reads them has the story that
 * the road, the chips and the transcript together made them assemble by hand.
 */
import { describe, it, expect } from "bun:test";

import { throughLine, type LineStop } from "@/components/track/the-through-line";

const FINDING: LineStop = {
  station: "sense",
  items: [
    {
      kind: "signal",
      artifactId: "sig-1",
      title: "Homeowners cannot tell a real outage from a firmware reboot",
      missing: false,
    },
  ],
};

const DECISION: LineStop = {
  station: "decide",
  items: [
    {
      kind: "decision",
      artifactId: "dec-1",
      title: "Differentiate OTA reboot red tile from real outage red tile",
      missing: false,
      fields: {
        rationale:
          "The product renders OTA reboots and real outages identically (red tile), causing homeowner confusion and unnecessary support contacts. This is confirmed by 16+ signals across sources.",
        alternatives_considered: [
          "Leave as-is, maintains status quo but perpetuates confusion and support load",
          "Add explanatory tooltip only, insufficient for first-glance differentiation",
          "Delay until post-90-day retention threshold, violates anti-goal",
        ],
      },
    },
  ],
};

const PLAN: LineStop = {
  station: "define",
  items: [
    { kind: "prd", artifactId: "prd-1", title: "Differentiate the red tile", missing: false },
    { kind: "task", artifactId: "t-1", title: "Implement", missing: false },
    { kind: "task", artifactId: "t-2", title: "Validate", missing: false },
  ],
};

/** Build filed nothing and said the same thing on every turn. */
const BUILD: LineStop = { station: "build", items: [] };

const SAYING =
  "This repository contains only the checkout module for Relay, not the full Relay homeowner app that renders status tiles.";

describe("a run reads as one line of reasoning", () => {
  const lines = throughLine({
    stops: [FINDING, DECISION, PLAN, BUILD],
    standing: "build",
    stuckAt: "build",
    stuckSaying: SAYING,
  });

  it("is the run in four lines, in the order it happened", () => {
    expect(lines.map((l) => l.name)).toEqual(["Discover", "Decide", "Plan", "Build"]);
  });

  it("names the one thing a station filed rather than counting to one", () => {
    // "filed 1 finding" tells a reader nothing they cannot see from the chip.
    // The title IS the sentence, and it is the most informative line on the list.
    expect(lines[0]!.did).toBe(
      'filed "Homeowners cannot tell a real outage from a firmware reboot"',
    );
  });

  it("counts by kind when a station filed several, rather than listing titles", () => {
    // Three titles here would be the dump this module replaces.
    expect(lines[2]!.did).toBe("filed 1 spec and 2 tasks");
  });

  it("carries the decision's own reason and what it weighed against", () => {
    /*
     * The pair this whole module exists to surface. `rationale` and
     * `alternatives_considered` are the most valuable rows on the run and they
     * have lived one click deep, inside a card nobody opens unless they already
     * know it is there.
     */
    expect(lines[1]!.because).toBe(
      "The product renders OTA reboots and real outages identically (red tile), causing homeowner confusion and unnecessary support contacts. 3 alternatives rejected",
    );
  });

  it("gives the stopped station a line even though it filed nothing", () => {
    // The one station with no output whose line is the most important on the
    // list, because it is the one a person can act on.
    expect(lines[3]!.did).toBe("stopped");
    expect(lines[3]!.because).toBe(`"${SAYING}"`);
    expect(lines[3]!.here).toBe(true);
  });

  it("opens the newest thing each station filed, so a line reaches its layer", () => {
    expect(lines[0]!.opens).toBe("sig-1");
    expect(lines[2]!.opens).toBe("t-2");
    // Nothing filed, nothing to open, and no invented door.
    expect(lines[3]!.opens).toBeNull();
  });
});

describe("what it refuses to draw", () => {
  it("gives no line to a station that did nothing and did not stop", () => {
    /*
     * The road above already draws all seven and says which are waived.
     * Measured on production: 81 of 106 tracks sit at Discover having filed
     * nothing, so a seven-line list would be one line and six absences on most
     * runs -- the same dump in a different shape.
     */
    const lines = throughLine({
      stops: [FINDING, { station: "ship", items: [] }, { station: "learn", items: [] }],
      standing: "sense",
    });
    expect(lines).toHaveLength(1);
    expect(lines[0]!.name).toBe("Discover");
  });

  it("never names an artifact whose row was not there", () => {
    // `missing` means the lookup RAN and found nothing, so opening it would
    // promise a person something that cannot be shown.
    const lines = throughLine({
      stops: [
        {
          station: "sense",
          items: [{ kind: "signal", artifactId: "gone", title: null, missing: true }],
        },
      ],
      standing: "sense",
    });
    expect(lines).toHaveLength(0);
  });

  it("says nothing about why when the record wrote no why", () => {
    // A decision with no rationale and no alternatives gets a line and no
    // reason, rather than a reason this file made up.
    const lines = throughLine({
      stops: [
        {
          station: "decide",
          items: [{ kind: "decision", artifactId: "d", title: "A call", missing: false }],
        },
      ],
      standing: "decide",
    });
    expect(lines[0]!.because).toBeNull();
  });

  it("draws nothing at all for a run that has filed nothing anywhere", () => {
    expect(throughLine({ stops: [], standing: null })).toEqual([]);
    expect(throughLine({ stops: null, standing: null })).toEqual([]);
  });
});

describe("the story reaches the present, not just the last thing filed", () => {
  /*
   * ── IT USED TO GO SILENT AT THE LIVE EDGE ─────────────────────────────
   * A station earns a line by having filed something, and a station mid-turn
   * has filed nothing yet. So on a run with a seat actually working, the story
   * ran to the last COMPLETED station and stopped, one station short of the
   * truth, and a reader scanning it for where the work had got to was looking
   * at history. That is the founder's own first sentence -- "what it is doing
   * now" -- failed by the surface built to answer it.
   */
  it("gives a line to the station being worked, even with nothing filed", () => {
    const lines = throughLine({
      stops: [FINDING, { station: "build", items: [] }],
      standing: "build",
      workingAt: "build",
    });
    expect(lines.map((l) => l.name)).toEqual(["Discover", "Build"]);
    expect(lines[1]!.did).toBe("is working now");
    expect(lines[1]!.working).toBe(true);
  });

  it("says both when a working station has already filed something", () => {
    const lines = throughLine({ stops: [PLAN], standing: "define", workingAt: "define" });
    expect(lines[0]!.did).toBe("filed 1 spec and 2 tasks, still working");
  });

  it("names no seat and no verb, because two other places already do", () => {
    /*
     * The Now card says "Engineer is reading the spec" -- the seat AND the verb
     * -- and the transcript says it again under the turn. What the story alone
     * can say is that the SEQUENCE has reached here and has not finished.
     */
    const lines = throughLine({
      stops: [{ station: "build", items: [] }],
      standing: "build",
      workingAt: "build",
    });
    expect(lines[0]!.did).not.toMatch(/Engineer|reading|Review/);
  });

  it("marks only the station actually being worked", () => {
    const lines = throughLine({
      stops: [FINDING, PLAN],
      standing: "define",
      workingAt: "define",
    });
    expect(lines.map((l) => l.working)).toEqual([false, true]);
  });

  it("says stopped rather than working when it is both, because a stop is the news", () => {
    // `stuckAt` and `workingAt` cannot honestly both be true, but if a caller
    // ever passes both the reader must not be told work is in flight.
    const lines = throughLine({
      stops: [{ station: "build", items: [] }],
      standing: "build",
      stuckAt: "build",
      stuckSaying: SAYING,
      workingAt: null,
    });
    expect(lines[0]!.did).toBe("stopped");
    expect(lines[0]!.working).toBe(false);
  });
});

/**
 * A MISSION IS SOMETHING A STATION STARTED, NOT SOMETHING IT PRODUCED.
 *
 * Read live on `6cc7a010`: the story said *"Build filed 'Homeowner can
 * reschedule installer visit from order page'"* on a station that had refused
 * six times and produced nothing. What Build had was one `mission` member, and
 * `KIND_WORD` says what that is -- "opened by the driver so Build's own tool
 * will run at all". Real membership, correctly recorded, and read under the verb
 * of production it told a person the station had succeeded.
 *
 * It also puts the story back in step with the ROAD, which has always read a
 * mission as a state rather than a product: `run-journey.ts` renders a mission
 * at Build as "building".
 */
describe("the driver's own work item is not the station's output", () => {
  const line = (items: LineStop["items"]) =>
    throughLine({
      stops: [{ station: "build", items }],
      standing: "build",
    })[0];

  it("a station with only a mission started something and filed nothing", () => {
    const l = line([
      {
        kind: "mission",
        artifactId: "m-1",
        title: "Homeowner can reschedule installer visit from order page",
        missing: false,
      },
    ]);
    expect(l?.did).toBe(
      'started "Homeowner can reschedule installer visit from order page" and filed nothing',
    );
  });

  it("and never takes the title slot from something the station made", () => {
    const l = line([
      {
        kind: "prototype",
        artifactId: "p-1",
        title: "Reschedule from the order page",
        missing: false,
      },
      { kind: "mission", artifactId: "m-1", title: "Homeowner can reschedule", missing: false },
    ]);
    expect(l?.did).toBe('filed "Reschedule from the order page"');
  });

  it("nor a place in the count beside what it made", () => {
    const l = line([
      { kind: "prototype", artifactId: "p-1", title: "One", missing: false },
      { kind: "prototype", artifactId: "p-2", title: "Two", missing: false },
      { kind: "mission", artifactId: "m-1", title: "Homeowner can reschedule", missing: false },
    ]);
    expect(l?.did).toBe("filed 2 prototypes");
  });

  it("but an untitled mission still says the station started", () => {
    // Hiding it would leave the station with no line at all, and "it started
    // and filed nothing" is the true and useful sentence.
    const l = line([{ kind: "mission", artifactId: "m-1", title: null, missing: false }]);
    expect(l?.did).toBe("started, and filed nothing");
  });
});

/**
 * "FILED" IS THE WEAKEST VERB AVAILABLE FOR A DECISION.
 *
 * On `6cc7a010` the story read `Decide filed "Reschedule installer visit from
 * order page"` and the decision was to WAIT. The title names the subject and
 * says nothing about the direction, so a person reading that run's story could
 * not know the loop had decided against it -- while Plan, Design and Build then
 * filed a spec, a prototype and a code change underneath.
 *
 * `decisions.call` records the direction as of 2026-09-10 and reaches this line
 * through `ARTIFACT_SOURCE.decision.also`.
 */
describe("a decision's line says which way the call went", () => {
  const decided = (call: unknown) =>
    throughLine({
      stops: [
        {
          station: "decide",
          items: [
            {
              kind: "decision",
              artifactId: "d-1",
              title: "Reschedule installer visit from order page",
              missing: false,
              fields: call === undefined ? {} : { call },
            },
          ],
        },
      ],
      standing: "decide",
    })[0];

  it("says it chose not to build, when that is what the record says", () => {
    expect(decided("do-not-build")?.did).toBe(
      'chose not to build "Reschedule installer visit from order page"',
    );
  });

  it("and that it chose to build", () => {
    expect(decided("build")?.did).toBe(
      'chose to build "Reschedule installer visit from order page"',
    );
  });

  it("KEEPS 'filed' when nobody recorded a direction", () => {
    /*
     * The load-bearing half. 33 of 61 agent decisions carry no direction,
     * because it was never recorded before the column existed, and "nobody
     * wrote one down" is not "they decided to build". A story that guessed
     * would invent the one fact the column was added to stop being invented.
     */
    expect(decided(null)?.did).toBe('filed "Reschedule installer visit from order page"');
    expect(decided(undefined)?.did).toBe('filed "Reschedule installer visit from order page"');
  });

  it("and on a value this build does not know", () => {
    // The column is text with a CHECK, not a type, and a newer deploy can write
    // a third word. Falling back to "filed" says less and stays true.
    expect(decided("maybe")?.did).toBe('filed "Reschedule installer visit from order page"');
    expect(decided("BUILD")?.did).toBe('filed "Reschedule installer visit from order page"');
  });

  it("and never on a kind that is not a decision", () => {
    // `call` on a prototype would be a column that does not exist; if one ever
    // arrives, it is not this sentence's business.
    const l = throughLine({
      stops: [
        {
          station: "design",
          items: [
            {
              kind: "prototype",
              artifactId: "p-1",
              title: "Reschedule from the order page",
              missing: false,
              fields: { call: "do-not-build" },
            },
          ],
        },
      ],
      standing: "design",
    })[0];
    expect(l?.did).toBe('filed "Reschedule from the order page"');
  });
});

/**
 * THE STORY, THE ROAD AND THE PANE AGREE ABOUT WHAT COUNTS AS ONE THING.
 *
 * The road began folding repeats through `foldVersions` an hour before this,
 * so its Discover node on `47dcbf3c` reads "4 findings, 67 times" while this
 * line still counted filings and said "Discover filed 67 findings". Two numbers
 * for one set on one screen, and the change that created the gap was mine.
 *
 * Law 20 on my own work: the road's count was reviewed against its own reason,
 * the reason was right, and nothing in that diff showed the sentence it now
 * stood beside.
 */
describe("the story counts things, not filings", () => {
  const item = (n: number, kind: string, title: string) => ({
    kind,
    artifactId: `${kind}-${n}`,
    title,
    missing: false,
    createdAt: `2026-09-04T02:0${n}:00Z`,
  });
  const line = (items: ReturnType<typeof item>[]) =>
    throughLine({ stops: [{ station: "sense", items }], standing: "sense" })[0];

  it("says four findings and how often, not sixty-seven", () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      item(i, "signal", `Homeowners cannot tell a reboot from an outage ${i % 4}`),
    );
    expect(line(many)?.did).toBe("filed 4 findings, 8 times");
  });

  it("leaves the clause alone when every one is its own thing", () => {
    const three = [1, 2, 3].map((n) => item(n, "signal", `Finding ${n}`));
    expect(line(three)?.did).toBe("filed 3 findings");
  });

  it("folds each kind on its own", () => {
    // Two findings filed four times, and two genuinely different specs.
    const mixed = [
      item(1, "signal", "One thing"),
      item(2, "signal", "One thing"),
      item(3, "signal", "Another thing"),
      item(4, "signal", "Another thing"),
      item(5, "prd", "Spec A"),
      item(6, "prd", "Spec B"),
    ];
    expect(line(mixed)?.did).toBe("filed 2 findings, 4 times and 2 specs");
  });

  it("and a single titled thing still takes the title slot", () => {
    // The rule above the count is untouched: one thing with a name says the
    // name, which is more informative than "1 finding".
    expect(line([item(1, "signal", "Homeowners cannot tell a reboot")])?.did).toBe(
      'filed "Homeowners cannot tell a reboot"',
    );
  });
});
