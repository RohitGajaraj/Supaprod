import { describe, expect, it } from "bun:test";

import { crewFromAnchors } from "./rail-crew";
import type { Anchor } from "@/lib/presence/collision";

/**
 * THE RAIL'S CREW STACK INVENTS NOBODY.
 *
 * SPEC-MULTIPLAYER-PRESENCE section 2: "If you cannot name the row a position
 * came from, do not draw the position." The read enforces that structurally -
 * `getWorkspaceAnchors` filters `agent_runs` to running and joins `tool_calls`
 * only to those traces - so these tests pin what this file adds on top of it:
 * grouping, naming and order.
 */

const anchor = (o: Partial<Anchor>): Anchor => ({
  runId: "r1",
  agentSlug: "engineer",
  missionId: "m1",
  toolName: "studio.commit",
  targetKind: "file",
  targetId: "src/a.ts",
  createdAt: "2026-08-27T10:00:00.000Z",
  ...o,
});

describe("who is drawn", () => {
  it("names the action in plain words, from the tool slug", () => {
    const [m] = crewFromAnchors([anchor({ toolName: "studio.commit" })]);
    expect(m.verb).not.toContain("studio.commit");
    expect(m.verb.length).toBeGreaterThan(3);
  });

  it("FALLS BACK TO THE REAL TOOL NAME rather than inventing a verb", () => {
    // `verbForTool`'s honest fallback. A renamed tool reads oddly and is
    // findable; a made-up verb reads well and is a lie.
    const [m] = crewFromAnchors([anchor({ toolName: "some.new.tool" })]);
    expect(m.verb).toBe("running some.new.tool");
  });

  it("DROPS A TEAMMATE IT CANNOT NAME, because a mark with no identity is furniture", () => {
    expect(crewFromAnchors([anchor({ agentSlug: null })])).toEqual([]);
  });

  it("draws nobody from nothing", () => {
    expect(crewFromAnchors([])).toEqual([]);
    expect(crewFromAnchors(undefined)).toEqual([]);
  });
});

describe("one face per teammate", () => {
  it("DEDUPES BY TEAMMATE, NOT BY RUN, keeping the newest action", () => {
    // Two runs held by the same agent are ONE working teammate - the rule
    // `AppFrame` already applies to its own marks.
    const out = crewFromAnchors([
      anchor({ runId: "r1", toolName: "studio.commit", createdAt: "2026-08-27T10:00:00.000Z" }),
      anchor({ runId: "r2", toolName: "studio.pr.open", createdAt: "2026-08-27T10:05:00.000Z" }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].runId).toBe("r2");
  });

  it("keeps distinct teammates apart", () => {
    const out = crewFromAnchors([
      anchor({ agentSlug: "engineer" }),
      anchor({ agentSlug: "researcher", createdAt: "2026-08-27T11:00:00.000Z" }),
    ]);
    expect(out.map((m) => m.slug)).toEqual(["researcher", "engineer"]);
  });

  it("puts the newest action first", () => {
    const out = crewFromAnchors([
      anchor({ agentSlug: "a", createdAt: "2026-08-27T09:00:00.000Z" }),
      anchor({ agentSlug: "b", createdAt: "2026-08-27T12:00:00.000Z" }),
      anchor({ agentSlug: "c", createdAt: "2026-08-27T10:00:00.000Z" }),
    ]);
    expect(out.map((m) => m.slug)).toEqual(["b", "c", "a"]);
  });

  it("KEEPS A TEAMMATE WHOSE STAMP IS UNREADABLE, rather than tidying it away", () => {
    // The teammate IS working. Losing the row to fix a timestamp would
    // understate the crew, which is the direction that costs a person something.
    const out = crewFromAnchors([anchor({ createdAt: "not a date" })]);
    expect(out).toHaveLength(1);
    expect(out[0].at).toBe(0);
  });
});
