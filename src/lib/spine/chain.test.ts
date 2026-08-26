/**
 * Reading a track back, tested without a database.
 *
 * The invariant these guard is that the chain never quietly shrinks. A record
 * that drops a row it cannot resolve, or hides one filed at a station the route
 * has since stopped visiting, reads as complete while being short, and a
 * complete-looking short record is the one failure mode this whole surface
 * exists to prevent. Most of the cases below therefore count things.
 */

import { describe, expect, it } from "bun:test";
import {
  ARTIFACT_SOURCE,
  NOTHING_LANDS_HERE,
  buildChain,
  describeChain,
  type ChainMember,
} from "./chain";
import { STATION_ARTIFACT, TOOL_PRODUCTS } from "./attach";
import type { SpineRoute } from "./route";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

function member(over: Partial<ChainMember> = {}): ChainMember {
  return {
    kind: "signal",
    word: "signal",
    artifactId: A,
    station: "sense",
    createdAt: "2026-08-01T10:00:00Z",
    title: "A thing someone said",
    missing: false,
    ...over,
  };
}

function route(over: Partial<SpineRoute> = {}): SpineRoute {
  return {
    entry: "sense",
    path: [...AGENT_STATION_ORDER],
    waived: [],
    origin: null,
    ...over,
  };
}

/** Members across every stop plus the orphan bucket. */
function counted(chain: ReturnType<typeof buildChain>): number {
  return chain.stops.reduce((n, s) => n + s.members.length, 0) + chain.orphans.length;
}

describe("the reader can resolve everything the writer can file", () => {
  it("covers every kind a registered tool produces", () => {
    for (const product of Object.values(TOOL_PRODUCTS)) {
      expect(ARTIFACT_SOURCE[product.kind]).toBeDefined();
    }
  });

  it("covers the mission the driver files itself, which no tool writes", () => {
    expect(ARTIFACT_SOURCE.mission?.table).toBe("missions");
  });

  /**
   * Three of the four tables added on 2026-08-01 do not have a `title` column,
   * and a wrong column name inside a select string compiles clean and fails
   * only on a live read. This pins the names that were checked against the
   * generated types, so a rename has to break a test rather than a page.
   */
  it("names the title column per kind instead of assuming every table spells it title", () => {
    expect(ARTIFACT_SOURCE.prototype?.title).toBe("name");
    expect(ARTIFACT_SOURCE.learning?.title).toBe("summary");
    expect(ARTIFACT_SOURCE.deployment?.title).toBe("deploy_url");
  });

  /**
   * A deployments row has no human name of any kind, so Ship was the one
   * station whose artifact a person could not recognise on sight: it rendered
   * as a bare hostname, the machine's identifier for the release rather than
   * the work's. It borrows the name of the changeset it shipped instead.
   */
  it("gives the one artifact with no name of its own a borrowed one", () => {
    expect(ARTIFACT_SOURCE.deployment?.parent).toEqual({
      table: "studio_changesets",
      column: "title",
    });
  });

  it("borrows a name only where the table genuinely has none", () => {
    for (const [kind, source] of Object.entries(ARTIFACT_SOURCE)) {
      if (kind !== "deployment") expect(source.parent).toBeUndefined();
    }
  });

  /**
   * The engineering note and the sentence a person reads are two statements of
   * one fact, so they are pinned to each other rather than trusted to be kept
   * in step by hand. This test is what forced the excuse copy out: closing the
   * four gaps made it fail until the sentences were deleted, which is exactly
   * the behaviour we want from every explanation of a hole.
   */
  it("says something plainly at exactly the stations that have an engineering gap", () => {
    const withGap = AGENT_STATION_ORDER.filter((s) => STATION_ARTIFACT[s].gap !== null).sort();
    const withLine = (Object.keys(NOTHING_LANDS_HERE) as AgentStation[]).sort();
    expect(withLine).toEqual(withGap);
  });

  it("keeps tool names out of the words a person reads", () => {
    for (const line of Object.values(NOTHING_LANDS_HERE)) {
      // A dot followed by a word is a tool name (`decision.revise`); a dot at
      // the end is just a sentence, which is what these are supposed to be.
      expect(line).not.toMatch(/\.\w/);
      expect(line).not.toMatch(/_|-tick\b/);
    }
  });
});

/**
 * FOUNDER RULING 2026-08-01. Every station gets an agent that can produce its
 * artifact. Sense had six tools, Define four, Build fifteen; Decide, Design,
 * Ship and Learn had none, and the surface had begun excusing that in words a
 * customer would read. These assertions are the guard: a station that loses its
 * tool fails here rather than quietly going back to being narrated.
 */
describe("every station can produce its own artifact", () => {
  it("leaves no station without a tool that creates what it exists to make", () => {
    const handless = AGENT_STATION_ORDER.filter((s) => STATION_ARTIFACT[s].createdBy === null);
    expect(handless).toEqual([]);
  });

  it("names a tool that is actually registered, not an aspiration", () => {
    for (const station of AGENT_STATION_ORDER) {
      const tool = STATION_ARTIFACT[station].createdBy;
      expect(TOOL_PRODUCTS[tool as string]).toBeDefined();
    }
  });

  it("files that tool's output under the kind the station is for", () => {
    for (const station of AGENT_STATION_ORDER) {
      const spec = STATION_ARTIFACT[station];
      expect(TOOL_PRODUCTS[spec.createdBy as string].kind).toBe(spec.kind);
    }
  });

  it("can resolve every station's artifact back to a readable row", () => {
    for (const station of AGENT_STATION_ORDER) {
      expect(ARTIFACT_SOURCE[STATION_ARTIFACT[station].kind]).toBeDefined();
    }
  });
});

describe("every member appears exactly once", () => {
  it("reconciles against total", () => {
    const members = [
      member({ artifactId: A, station: "sense" }),
      member({ artifactId: B, station: "define", kind: "prd" }),
      member({ artifactId: C, station: "nowhere" }),
    ];
    const chain = buildChain({ route: route(), station: "define", status: "open", members });
    expect(chain.total).toBe(3);
    expect(counted(chain)).toBe(3);
  });

  it("surfaces a member filed at a station the route no longer visits", () => {
    // Design was waived after it had already produced something. The row must
    // not fall through the floor just because the plan changed.
    const r = route({
      path: AGENT_STATION_ORDER.filter((s) => s !== "design") as AgentStation[],
      waived: [
        {
          station: "design",
          reason: "No interface changes here",
          by: "human",
          reopensWhen: "never",
        },
      ],
    });
    const chain = buildChain({
      route: r,
      station: "build",
      status: "open",
      members: [member({ station: "design", kind: "prd", artifactId: B })],
    });
    const design = chain.stops.find((s) => s.station === "design");
    expect(design?.members).toHaveLength(1);
    expect(counted(chain)).toBe(1);
  });

  it("puts a member with an unreadable station in orphans rather than losing it", () => {
    const chain = buildChain({
      route: route(),
      station: "sense",
      status: "open",
      members: [member({ station: "not-a-station" })],
    });
    expect(chain.orphans).toHaveLength(1);
    expect(counted(chain)).toBe(1);
  });

  it("keeps a member whose artifact no longer resolves", () => {
    const chain = buildChain({
      route: route(),
      station: "sense",
      status: "open",
      members: [member({ title: null, missing: true })],
    });
    expect(counted(chain)).toBe(1);
    expect(chain.stops.find((s) => s.station === "sense")?.members[0].missing).toBe(true);
  });
});

describe("where a station sits relative to the work", () => {
  it("marks behind, current and ahead", () => {
    const chain = buildChain({ route: route(), station: "define", status: "open", members: [] });
    const state = (s: AgentStation) => chain.stops.find((x) => x.station === s)?.state;
    expect(state("sense")).toBe("passed");
    expect(state("define")).toBe("here");
    expect(state("build")).toBe("not-reached");
  });

  it("does not leave a finished track standing at its last station", () => {
    const chain = buildChain({ route: route(), station: "learn", status: "done", members: [] });
    expect(chain.stops.find((s) => s.station === "learn")?.state).toBe("passed");
  });

  it("lets a waiver outrank position and carries the reason given", () => {
    const r = route({
      waived: [
        {
          station: "design",
          reason: "Nothing here that people see",
          by: "human",
          reopensWhen: "never",
        },
      ],
    });
    const stop = buildChain({ route: r, station: "learn", status: "open", members: [] }).stops.find(
      (s) => s.station === "design",
    );
    expect(stop?.state).toBe("waived");
    expect(stop?.waivedReason).toBe("Nothing here that people see");
  });

  it("orders stops along the spine, never by when things were filed", () => {
    const chain = buildChain({ route: route(), station: "build", status: "open", members: [] });
    const seen = chain.stops.map((s) => s.station);
    const expected = AGENT_STATION_ORDER.filter((s) => seen.includes(s));
    expect(seen).toEqual(expected as AgentStation[]);
  });
});

describe("an empty station says why it is empty", () => {
  /**
   * Design and Ship used to carry a sentence here. They do not any more,
   * because they can now produce their own artifact, and an empty stop on a
   * station that CAN produce means "not yet" all by itself. Excusing it would
   * tell a person nothing lands there when something just has not landed there
   * yet, which is a different and false claim.
   */
  it("excuses nothing now that every station has a tool", () => {
    const chain = buildChain({ route: route(), station: "sense", status: "open", members: [] });
    for (const stop of chain.stops) expect(stop.gap).toBeNull();
  });

  it("does not excuse a station that produced something", () => {
    const chain = buildChain({
      route: route(),
      station: "sense",
      status: "open",
      members: [member({ station: "sense" })],
    });
    expect(chain.stops.find((s) => s.station === "sense")?.gap).toBeNull();
  });

  it("leaves a station with a tool but no output un-excused, so it reads as not yet", () => {
    const chain = buildChain({ route: route(), station: "sense", status: "open", members: [] });
    expect(chain.stops.find((s) => s.station === "sense")?.gap).toBeNull();
  });
});

describe("members within a station", () => {
  it("reads oldest first", () => {
    const chain = buildChain({
      route: route(),
      station: "sense",
      status: "open",
      members: [
        member({ artifactId: B, createdAt: "2026-08-01T12:00:00Z" }),
        member({ artifactId: A, createdAt: "2026-08-01T09:00:00Z" }),
      ],
    });
    expect(
      chain.stops.find((s) => s.station === "sense")?.members.map((m) => m.artifactId),
    ).toEqual([A, B]);
  });

  it("does not reshuffle when two were filed in the same instant", () => {
    const same = "2026-08-01T09:00:00Z";
    const build = () =>
      buildChain({
        route: route(),
        station: "sense",
        status: "open",
        members: [
          member({ artifactId: B, createdAt: same }),
          member({ artifactId: A, createdAt: same }),
        ],
      })
        .stops.find((s) => s.station === "sense")
        ?.members.map((m) => m.artifactId);
    expect(build()).toEqual(build());
  });
});

describe("the sentence", () => {
  it("says plainly when nothing has been filed", () => {
    const chain = buildChain({ route: route(), station: "sense", status: "open", members: [] });
    expect(describeChain(chain)).toBe("Nothing has been filed against this work yet.");
  });

  it("counts in the words the driver already uses, never the table names", () => {
    const chain = buildChain({
      route: route(),
      station: "build",
      status: "open",
      members: [
        member({ artifactId: A, station: "sense" }),
        member({ artifactId: B, station: "define", kind: "prd" }),
      ],
    });
    const said = describeChain(chain);
    expect(said).toContain("1 finding");
    expect(said).toContain("1 spec");
    expect(said).not.toContain("prd");
  });

  it("pluralizes off the shared vocabulary", () => {
    const chain = buildChain({
      route: route(),
      station: "build",
      status: "open",
      members: [
        member({ artifactId: A, station: "build", kind: "changeset" }),
        member({ artifactId: B, station: "build", kind: "changeset" }),
      ],
    });
    expect(describeChain(chain)).toContain("2 code changes");
  });

  it("says missing artifacts out loud instead of folding them into the count", () => {
    const chain = buildChain({
      route: route(),
      station: "sense",
      status: "open",
      members: [member({ artifactId: A, title: null, missing: true })],
    });
    expect(describeChain(chain)).toContain("no longer resolves");
  });

  it("stays silent about missing artifacts when there are none", () => {
    const chain = buildChain({
      route: route(),
      station: "sense",
      status: "open",
      members: [member()],
    });
    expect(describeChain(chain)).not.toContain("no longer resolves");
  });

  it("counts orphans too, so the sentence cannot undercount the record", () => {
    const chain = buildChain({
      route: route(),
      station: "sense",
      status: "open",
      members: [member({ station: "not-a-station" })],
    });
    expect(describeChain(chain)).toContain("1 finding");
  });
});
