/**
 * THE ANCHOR IS THE LAST PLACE WE KNEW — 2026-08-31.
 *
 * Two defects at the same seam, one found by S2 and one underneath it.
 *
 * S2's: `getWorkspaceAnchors` took the NEWEST call per trace and dropped the run
 * when that call named nothing. The ordinary agent shape is `repo.read` (names a
 * file), `ci.logs` (names nothing), `studio.stage` — so a run demonstrably
 * working on a file was anchored for about nine seconds of a ninety-eight second
 * run. 1,983 of 2,271 calls over 60 days resolve to no target, and they are
 * mostly `*.search`/`*.list`/creates whose target does not exist until the call
 * returns. Nothing to name, so the answer is to stop forgetting the last place
 * we DID know.
 *
 * The one underneath it, and it is bigger: **`targetOf` could not see a single
 * `studio.stage` call.** It read top-level keys only, and `studio.stage` names
 * its file at `changes[0].path`. Measured before fixing: 46 of 46 `studio.stage`
 * calls carry `changes[0].path`, and 0 were seen. **Two agents writing the same
 * file is the canonical collision this module exists to catch**, and it was the
 * shape it was structurally blind to. S2 explicitly said the key list was fine —
 * they had checked `studio.commit`'s `files` (a count of 3, correctly dismissed)
 * rather than `studio.stage`'s `changes`.
 */
import { describe, expect, it } from "bun:test";

import { targetOf, groupKeyOf, collisionsFrom, type Anchor } from "./collision";

describe("targetOf reads the nested path that studio.stage actually uses", () => {
  it("finds changes[0].path, which 46 of 46 staging calls carry and none were seen by", () => {
    expect(
      targetOf({
        changes: [{ op: "update", path: "src/checkout/AddressStep.tsx", content: "..." }],
      }),
    ).toEqual({ targetKind: "file", targetId: "src/checkout/AddressStep.tsx" });
  });

  it("takes the first entry only, on the same reasoning `paths` already uses", () => {
    expect(targetOf({ changes: [{ path: "a.ts" }, { path: "b.ts" }] })?.targetId).toBe("a.ts");
  });

  it("a top-level key still wins, so nothing that worked before changed", () => {
    expect(targetOf({ path: "top.ts", changes: [{ path: "nested.ts" }] })?.targetId).toBe("top.ts");
  });

  it("`files: 3` is a COUNT and names nothing — the miss S2 chased and correctly dismissed", () => {
    expect(targetOf({ files: 3 })).toBeNull();
  });

  it("and a malformed changes array names nothing rather than throwing", () => {
    expect(targetOf({ changes: [] })).toBeNull();
    expect(targetOf({ changes: [null] })).toBeNull();
    expect(targetOf({ changes: [{ op: "delete" }] })).toBeNull();
    expect(targetOf({ changes: "not an array" })).toBeNull();
    expect(targetOf({ changes: [{ path: "   " }] })).toBeNull();
  });
});

describe("the exported group key is the one collisionsFrom actually groups by", () => {
  it("A-006: identity is the id, not the key that named it", () => {
    // `row:prd` and bare `row` over one uuid are one thing. A component
    // re-deriving this is how a wrong all-clear gets shipped, so it imports it.
    const uuid = "3fbf73c9-1111-4222-8333-444444444444";
    expect(groupKeyOf({ targetKind: "row:prd", targetId: uuid })).toBe(
      groupKeyOf({ targetKind: "row", targetId: uuid }),
    );
  });

  it("and two different files are never one group", () => {
    expect(groupKeyOf({ targetKind: "file", targetId: "a.ts" })).not.toBe(
      groupKeyOf({ targetKind: "file", targetId: "b.ts" }),
    );
  });

  it("the key the mark computes matches the group the collision was built from", () => {
    const at = "2026-08-31T09:30:00Z";
    const anchors: Anchor[] = [
      {
        runId: "r1",
        agentSlug: "builder",
        missionId: null,
        toolName: "studio.stage",
        targetKind: "file",
        targetId: "src/checkout/AddressStep.tsx",
        createdAt: at,
      },
      {
        runId: "r2",
        agentSlug: "qa",
        missionId: null,
        toolName: "repo.read",
        targetKind: "file",
        targetId: "src/checkout/AddressStep.tsx",
        createdAt: at,
      },
    ];
    const [collision] = collisionsFrom(anchors);
    expect(collision).toBeDefined();
    // What a mark on that file would compute, independently:
    expect(groupKeyOf({ targetKind: "file", targetId: "src/checkout/AddressStep.tsx" })).toBe(
      groupKeyOf(collision!),
    );
    expect(collision!.runs).toHaveLength(2);
  });
});
