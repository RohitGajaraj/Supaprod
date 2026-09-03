/**
 * What may be filed against a track, tested without a database.
 *
 * The invariant these guard is not "does it attach", it is "does it ever attach
 * the wrong thing". A member row naming an artifact that belongs to somebody
 * else's work is a false claim on the one surface whose whole job is answering
 * "what is part of this piece of work", so the cases below are mostly refusals.
 */

import { describe, expect, it } from "bun:test";
import {
  collectAttachments,
  gatesOpenedBy,
  harvestGates,
  type ApprovalRowLike,
  describeAttachments,
  STATION_ARTIFACT,
  TOOL_PRODUCTS,
  type ToolStepLike,
} from "./attach";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

/** An executed tool call, the only shape that may ever produce an attachment. */
function executed(name: string, result: unknown): ToolStepLike {
  return { kind: "tool_call", name, ok: true, status: "executed", result };
}

describe("collectAttachments takes ids only from the run's own report", () => {
  it("files the spec a define run drafted", () => {
    const out = collectAttachments([executed("prd.draft", { prd_id: A, title: "SSO" })], "define");
    expect(out).toEqual([{ artifactKind: "prd", artifactId: A, station: "define" }]);
  });

  it("reads each tool's own id field, not a guessed one", () => {
    // prd.draft returns prd_id, signals.log returns id, studio.stage returns
    // changeset_id. Assuming one shape for all three would silently attach
    // nothing for two of them.
    const out = collectAttachments(
      [
        executed("signals.log", { id: A }),
        executed("studio.stage", { changeset_id: B, repo: "acme/app" }),
      ],
      "sense",
    );
    expect(out.map((a) => a.artifactKind).sort()).toEqual(["changeset", "signal"]);
  });

  it("stamps the station that ran, not the station the kind usually comes from", () => {
    // A build run that logs a signal really did log a signal at build. Filing it
    // under sense would be tidier and untrue.
    const out = collectAttachments([executed("signals.log", { id: A })], "build");
    expect(out[0].station).toBe("build");
  });

  it("returns nothing for a run with no steps at all", () => {
    // The dispatch threw. There is no report, so there is nothing to claim.
    expect(collectAttachments([], "define")).toEqual([]);
    expect(collectAttachments(null, "define")).toEqual([]);
    expect(collectAttachments(undefined, "define")).toEqual([]);
  });
});

describe("collectAttachments refuses everything it cannot stand behind", () => {
  it("ignores a call that was queued for a person", () => {
    // Queued means it is sitting in front of someone and has produced nothing.
    const out = collectAttachments(
      [{ kind: "tool_call", name: "prd.draft", ok: true, status: "queued", result: { prd_id: A } }],
      "define",
    );
    expect(out).toEqual([]);
  });

  it("ignores a denied call and an errored one", () => {
    const out = collectAttachments(
      [
        {
          kind: "tool_call",
          name: "prd.draft",
          ok: false,
          status: "denied",
          result: { prd_id: A },
        },
        { kind: "tool_call", name: "signals.log", ok: false, status: "error", result: { id: B } },
      ],
      "define",
    );
    expect(out).toEqual([]);
  });

  it("ignores a step that says executed but not ok", () => {
    // Belt and braces: both flags must agree before an id is believed.
    const out = collectAttachments(
      [
        {
          kind: "tool_call",
          name: "prd.draft",
          ok: false,
          status: "executed",
          result: { prd_id: A },
        },
      ],
      "define",
    );
    expect(out).toEqual([]);
  });

  it("ignores thoughts and the final message", () => {
    const out = collectAttachments(
      [{ kind: "thought" }, executed("prd.draft", { prd_id: A }), { kind: "final" }],
      "define",
    );
    expect(out).toHaveLength(1);
  });

  it("ignores a tool that is not in the map", () => {
    // prd.revise edits a spec that already exists. Editing something is not a
    // statement that it belongs to this track.
    const out = collectAttachments([executed("prd.revise", { prd_id: A })], "define");
    expect(out).toEqual([]);
  });

  it("ignores a result that carries no id, or a non-uuid one", () => {
    // research.synthesize returns counts. A count is not an artifact.
    const out = collectAttachments(
      [
        executed("prd.draft", { themes_created: 3 }),
        executed("signals.log", { id: "not-a-uuid" }),
        executed("tasks.create", { id: 17 }),
        executed("tasks.create", null),
      ],
      "sense",
    );
    expect(out).toEqual([]);
  });

  it("files one row when a run reports the same artifact twice", () => {
    // studio.stage returns the same changeset id on every stage into it, and the
    // primary key is (track, kind, id), so two rows would be one row anyway.
    const out = collectAttachments(
      [
        executed("studio.stage", { changeset_id: A }),
        executed("studio.stage", { changeset_id: A }),
      ],
      "build",
    );
    expect(out).toHaveLength(1);
  });
});

describe("the two-tracks-in-one-tick case, which is why this is not a time window", () => {
  it("attributes only what each run reported, even for identical stations", () => {
    // Two tracks, same user, same station, driven back to back by one tick.
    // Track one drafted spec A, track two drafted spec B. A window over
    // `prds` created after the tick started would hand BOTH specs to BOTH
    // tracks; reading each run's own steps cannot, because neither run ever
    // mentions the other's id.
    const trackOne = collectAttachments([executed("prd.draft", { prd_id: A })], "define");
    const trackTwo = collectAttachments([executed("prd.draft", { prd_id: B })], "define");

    expect(trackOne.map((a) => a.artifactId)).toEqual([A]);
    expect(trackTwo.map((a) => a.artifactId)).toEqual([B]);
    expect(trackOne.map((a) => a.artifactId)).not.toContain(B);
    expect(trackTwo.map((a) => a.artifactId)).not.toContain(A);
  });

  it("attributes nothing to a run that did nothing, whatever else was happening", () => {
    // The concurrent-cron case: a recluster loop or a person on Discover can be
    // writing rows for this same user while this run does no work at all. A
    // run with no productive step attaches nothing, full stop.
    expect(collectAttachments([{ kind: "thought" }, { kind: "final" }], "sense")).toEqual([]);
  });
});

describe("TOOL_PRODUCTS and STATION_ARTIFACT agree with each other", () => {
  it("every station names an artifact and a table", () => {
    for (const station of AGENT_STATION_ORDER) {
      const spec = STATION_ARTIFACT[station];
      expect(spec, `${station} has no artifact spec`).toBeTruthy();
      expect(spec.kind.length).toBeGreaterThan(0);
      expect(spec.table.length).toBeGreaterThan(0);
    }
  });

  it("a station claiming a tool names one that exists in the map", () => {
    for (const station of AGENT_STATION_ORDER) {
      const spec = STATION_ARTIFACT[station];
      if (!spec.createdBy) continue;
      expect(TOOL_PRODUCTS[spec.createdBy], `${spec.createdBy} is not mapped`).toBeTruthy();
      expect(TOOL_PRODUCTS[spec.createdBy].kind).toBe(spec.kind);
      expect(TOOL_PRODUCTS[spec.createdBy].table).toBe(spec.table);
    }
  });

  it("a station with no tool states the gap instead of leaving it blank", () => {
    // The honest half of the map. Decide, Design, Ship and Learn have no tool
    // that creates their artifact, and a silent null there would read as an
    // oversight rather than as the finding it is.
    for (const station of AGENT_STATION_ORDER) {
      const spec = STATION_ARTIFACT[station];
      if (!spec.createdBy) {
        expect(spec.gap, `${station} has no tool and no stated reason`).toBeTruthy();
      }
    }
  });

  it("leaves no station stranded without a way to produce a member row", () => {
    // HISTORY WORTH KEEPING, because this test did its job twice.
    //
    // It first pinned four stations and asserted Build was attachable, which
    // was false: studio.stage refuses without a mission and the driver never
    // passed one. It was corrected to key off `gap` rather than `createdBy`,
    // since a tool existing and the driver being able to reach it are two
    // different facts.
    //
    // Then it held the list ["decide","design","ship","learn"] as a permanent
    // feature of the system, and the founder read that state on the surface and
    // refused it: four sevenths of the loop cannot be human work in a product
    // whose claim is that agents run the loop. Every one of those stations had
    // an active lead agent and a fully shaped table and was missing only a
    // registered tool, so the tools were built and this now asserts the
    // opposite. A station that ever loses its hands fails here.
    const stranded = AGENT_STATION_ORDER.filter((s) => STATION_ARTIFACT[s].gap !== null);
    expect(stranded).toEqual([]);
  });
});

describe("describeAttachments says only what landed", () => {
  it("says nothing when nothing was filed", () => {
    expect(describeAttachments([])).toBeNull();
  });

  it("uses plain words, never the mechanism word", () => {
    const line = describeAttachments([{ artifactKind: "prd", artifactId: A, station: "define" }]);
    expect(line).toBe("It produced 1 spec, now part of this work.");
    expect(line).not.toContain("prd");
    expect(line).not.toContain("artifact");
  });

  it("counts by kind and reads as a sentence", () => {
    const line = describeAttachments([
      { artifactKind: "signal", artifactId: A, station: "sense" },
      { artifactKind: "signal", artifactId: B, station: "sense" },
      { artifactKind: "task", artifactId: A, station: "sense" },
    ]);
    expect(line).toBe("It produced 2 findings and 1 task, now part of this work.");
  });

  it("carries no dash characters, per the voice rules", () => {
    const line = describeAttachments([
      { artifactKind: "changeset", artifactId: A, station: "build" },
    ]);
    expect(line).toBe("It produced 1 code change, now part of this work.");
    expect(line).not.toMatch(/[–—]/);
  });
});

describe("harvestGates reads back what an approved gate produced", () => {
  const gate = { id: "11111111-1111-4111-8111-111111111111", station: "define" as const };
  const row = (over: Partial<ApprovalRowLike> = {}): ApprovalRowLike => ({
    id: over.id ?? gate.id,
    tool_name: over.tool_name ?? "prd.draft",
    status: over.status ?? "executed",
    result: "result" in over ? over.result : { prd_id: A },
  });

  it("files the artifact once the person said yes and the tool ran", () => {
    // The whole point: work made THROUGH a boundary used to attach to nothing,
    // because executeApproval runs outside the loop and nothing read its result.
    const out = harvestGates([gate], [row()]);
    expect(out.attachments).toEqual([{ artifactKind: "prd", artifactId: A, station: "define" }]);
    expect(out.stillPending).toEqual([]);
  });

  it("files against the station that ASKED, not wherever the track is now", () => {
    // A person may move the track by hand before answering. The artifact still
    // belongs to the station that produced it.
    const out = harvestGates(
      [{ ...gate, station: "sense" }],
      [row({ tool_name: "signals.log", result: { id: A } })],
    );
    expect(out.attachments[0].station).toBe("sense");
  });

  it("keeps waiting on a gate nobody has answered", () => {
    const out = harvestGates([gate], [row({ status: "pending" })]);
    expect(out.attachments).toEqual([]);
    expect(out.stillPending).toEqual([gate]);
  });

  it("keeps waiting on an approved gate whose tool has not run yet", () => {
    // approved means yes was said; the result only exists after it executes.
    const out = harvestGates([gate], [row({ status: "approved", result: null })]);
    expect(out.stillPending).toEqual([gate]);
  });

  it("drops a gate that was refused, expired, or threw, and never retries it", () => {
    // None of these will ever yield an artifact, so carrying them forever would
    // re-read the same rows on every tick to learn nothing.
    for (const status of ["rejected", "expired", "failed"]) {
      const out = harvestGates([gate], [row({ status })]);
      expect(out.attachments).toEqual([]);
      expect(out.stillPending, `${status} should not be carried`).toEqual([]);
    }
  });

  it("drops a gate whose approval row has vanished", () => {
    expect(harvestGates([gate], []).stillPending).toEqual([]);
  });

  it("attaches nothing when the executed result carries no id", () => {
    // A tool that returns only a count is invisible here, by design.
    expect(harvestGates([gate], [row({ result: { themes_created: 3 } })]).attachments).toEqual([]);
  });

  it("survives malformed input", () => {
    expect(harvestGates(null, null)).toEqual({ attachments: [], stillPending: [] });
    expect(harvestGates([], [row()])).toEqual({ attachments: [], stillPending: [] });
  });
});

describe("gatesOpenedBy remembers only gates worth harvesting", () => {
  const G = "22222222-2222-4222-8222-222222222222";

  it("records a queued step's own approval id", () => {
    const out = gatesOpenedBy(
      [{ kind: "tool_call", name: "prd.draft", status: "queued", ok: true, approval_id: G }],
      "define",
    );
    expect(out).toEqual([{ id: G, station: "define" }]);
  });

  /**
   * INVERTED 2026-08-01, and the inversion is the point.
   *
   * This asserted that a queued tool with no harvestable artifact was ignored,
   * on the reasoning that carrying it means re-reading a row forever to learn
   * nothing. That was right about harvesting and wrong about the list, because
   * the list is now also the answer to "is this track waiting on a person".
   *
   * The driver used to answer that with a count of every pending approval the
   * USER owned, so one unanswered call anywhere froze all their tracks. Now that
   * the hold is scoped to this track's own gates, an unrecorded queued call
   * would read as "not waiting", and the next tick would redispatch the station
   * and queue the same call again, every ten minutes, forever.
   */
  it("records a queued call even when no artifact will ever come back from it", () => {
    const out = gatesOpenedBy(
      [{ kind: "tool_call", name: "notes.create", status: "queued", ok: true, approval_id: G }],
      "define",
    );
    expect(out).toEqual([{ id: G, station: "define" }]);
  });

  it("does not hold a track forever for a call that produced nothing", () => {
    // The other half of the bargain: harvestGates drops an executed gate with no
    // product, so a product-less gate holds the track exactly as long as the
    // call is genuinely open and not one tick longer.
    const { attachments, stillPending } = harvestGates(
      [{ id: G, station: "define" }],
      [{ id: G, tool_name: "notes.create", status: "executed", result: { id: A } }],
    );
    expect(attachments).toEqual([]);
    expect(stillPending).toEqual([]);
  });

  it("ignores executed steps, which collectAttachments already handled", () => {
    const out = gatesOpenedBy(
      [
        {
          kind: "tool_call",
          name: "prd.draft",
          status: "executed",
          ok: true,
          result: { prd_id: A },
        },
      ],
      "define",
    );
    expect(out).toEqual([]);
  });

  it("rejects a non-uuid approval id rather than storing junk", () => {
    const out = gatesOpenedBy(
      [{ kind: "tool_call", name: "prd.draft", status: "queued", ok: true, approval_id: "nope" }],
      "define",
    );
    expect(out).toEqual([]);
  });
});

describe("a tool that makes several rows in one call", () => {
  const B = "33333333-3333-4333-8333-333333333333";

  it("attaches every theme a clustering pass created, not just the first", () => {
    // The bug this guards: forcing the many case through the one case would
    // file one theme and silently drop the rest of the same pass.
    const out = collectAttachments(
      [
        {
          kind: "tool_call",
          name: "cluster.trigger",
          status: "executed",
          ok: true,
          result: { themes: 2, theme_ids: [A, B] },
        },
      ],
      "sense",
    );
    expect(out).toEqual([
      { artifactKind: "theme", artifactId: A, station: "sense" },
      { artifactKind: "theme", artifactId: B, station: "sense" },
    ]);
  });

  it("attaches nothing when the pass created nothing", () => {
    const out = collectAttachments(
      [
        {
          kind: "tool_call",
          name: "cluster.trigger",
          status: "executed",
          ok: true,
          result: { themes: 0, theme_ids: [] },
        },
      ],
      "sense",
    );
    expect(out).toEqual([]);
  });

  it("drops junk entries without losing the good ones", () => {
    const out = collectAttachments(
      [
        {
          kind: "tool_call",
          name: "research.synthesize",
          status: "executed",
          ok: true,
          result: { themes_created: 3, theme_ids: [A, "not-a-uuid", null, B] },
        },
      ],
      "sense",
    );
    expect(out.map((a) => a.artifactId)).toEqual([A, B]);
  });

  it("still reads a bare count as nothing, rather than guessing", () => {
    // A tool that has not been updated stays invisible on purpose.
    const out = collectAttachments(
      [
        {
          kind: "tool_call",
          name: "research.synthesize",
          status: "executed",
          ok: true,
          result: { themes_created: 3 },
        },
      ],
      "sense",
    );
    expect(out).toEqual([]);
  });

  it("harvests every theme from a gate answered later", () => {
    const gate = { id: "44444444-4444-4444-8444-444444444444", station: "sense" as const };
    const out = harvestGates(
      [gate],
      [
        {
          id: gate.id,
          tool_name: "cluster.trigger",
          status: "executed",
          result: { theme_ids: [A, B] },
        },
      ],
    );
    expect(out.attachments).toHaveLength(2);
    expect(out.stillPending).toEqual([]);
  });
});

describe("studio.pr.open filing a changeset always attaches it (P-36, A-QUEUE.md)", () => {
  /*
   * THE GUARD THIS PACKET ASKED FOR. `studio.pr.open` runs through the gate
   * path, not `collectAttachments`'s own-tick path (it is operator-gated),
   * so the only way it ever produces a member row is the SAME two-step
   * lifecycle `harvestGates reads back what an approved gate produced` and
   * `gatesOpenedBy remembers only gates worth harvesting` already test
   * generically above: `gatesOpenedBy` records the approval id the moment
   * the call is queued, `harvestGates` reads its result back once a person
   * has answered and it has run. This block runs that exact lifecycle with
   * `studio.pr.open` itself, not a stand-in tool name, so a regression in
   * either step -- or in `TOOL_PRODUCTS["studio.pr.open"]` itself -- fails
   * here rather than needing a live PR to notice.
   */
  it("a queued PR-open call is remembered as a gate the moment it opens", () => {
    const queued: ToolStepLike = {
      kind: "tool_call",
      name: "studio.pr.open",
      status: "queued",
      approval_id: A,
    };
    expect(gatesOpenedBy([queued], "build")).toEqual([{ id: A, station: "build" }]);
  });

  it("once answered and run, the changeset it opened is filed at the station that asked", () => {
    const gate = { id: A, station: "build" as const };
    const out = harvestGates(
      [gate],
      [
        {
          id: A,
          tool_name: "studio.pr.open",
          status: "executed",
          result: { changeset_id: B, repo: "example/repo", pr_number: 4, pr_url: "https://…" },
        },
      ],
    );
    expect(out.attachments).toEqual([{ artifactKind: "changeset", artifactId: B, station: "build" }]);
    expect(out.stillPending).toEqual([]);
  });

  it("nothing is filed while the call sits unanswered, and it is not dropped either", () => {
    const gate = { id: A, station: "build" as const };
    const out = harvestGates([gate], [{ id: A, tool_name: "studio.pr.open", status: "pending", result: null }]);
    expect(out.attachments).toEqual([]);
    expect(out.stillPending).toEqual([gate]);
  });
});
