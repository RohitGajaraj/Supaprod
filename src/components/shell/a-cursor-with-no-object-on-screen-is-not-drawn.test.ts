/**
 * THE IRON LAW, ASSERTED WHERE IT CAN ACTUALLY BE BROKEN.
 *
 * `SPEC-MULTIPLAYER-PRESENCE` §2 does not say a bad cursor is a bug. It says:
 * "any cursor on screen whose position cannot be traced to a specific row" gets
 * the layer REMOVED rather than patched, and "if you cannot name the row a
 * position came from, do not draw the position."
 *
 * `placeAnchors` is the only place in this feature where a position is decided,
 * so this is the only file that can prove it. Everything else - the query, the
 * chip, the ring - is downstream of a list this function refused to invent.
 *
 * THE TEMPTATION IT EXISTS TO CATCH is not malice, it is helpfulness: an
 * anchor arrives, the object is not on this screen, and every instinct says
 * put the teammate SOMEWHERE - a corner, the last known place, the middle. All
 * three are theatre by this spec's own definition, and all three would look
 * completely reasonable in a screenshot.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { placeAnchors } from "./TeammateCursors";
import { anchorKeyOf, presenceAnchor, ANCHOR_ID_ATTR } from "./presence-anchor";
import { teammateColour, TEAMMATE_COLOURS, TEAMMATE_COLOUR_OVERFLOW } from "./teammate-colour";
import { collisionsFrom, type Anchor } from "@/lib/presence/collision";

const PRD = "e9e5b033-1111-4222-8333-444455556666";
const OTHER = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function anchor(over: Partial<Anchor> = {}): Anchor {
  return {
    runId: "run-1",
    agentSlug: "builder",
    missionId: "m1",
    toolName: "prd.revise",
    targetKind: "row:prd",
    targetId: PRD,
    createdAt: "2026-08-31T09:00:00Z",
    ...over,
  };
}

/** An element that is on screen, at a box we choose. Only the one method the
 *  code calls, so the fake cannot quietly satisfy something it should not. */
function boxed(x: number, y: number, w: number, h: number): Element {
  return { getBoundingClientRect: () => ({ x, y, width: w, height: h }) } as unknown as Element;
}

describe("a position is derived or it is not drawn", () => {
  it("draws nothing for an anchor whose object is not on this screen", () => {
    // The commonest real case by far, and the one worth being boring about:
    // the teammate is genuinely working, on something this route does not show.
    expect(placeAnchors([anchor()], new Map())).toEqual([]);
  });

  it("takes the position from the element's own box, not from anything else", () => {
    const out = placeAnchors(
      [anchor()],
      new Map([[anchorKeyOf(anchor()), boxed(120, 340, 400, 64)]]),
    );
    expect(out).toHaveLength(1);
    expect({ x: out[0]!.x, y: out[0]!.y, w: out[0]!.w, h: out[0]!.h }).toEqual({
      x: 120,
      y: 340,
      w: 400,
      h: 64,
    });
  });

  it("skips an element that is present but not laid out", () => {
    /* A row inside a closed disclosure measures 0x0 at the origin. Drawing it
       would put a named teammate at the top-left of the page - an invented
       position arrived at honestly, which is the kind this spec is least
       likely to notice and most likely to be deleted for. */
    const out = placeAnchors([anchor()], new Map([[anchorKeyOf(anchor()), boxed(0, 0, 0, 0)]]));
    expect(out).toEqual([]);
  });

  it("draws no teammate it cannot name", () => {
    // `agentSlug` is nullable on `agent_runs`. A chip with no name is furniture.
    const a = anchor({ agentSlug: null });
    const out = placeAnchors([a], new Map([[anchorKeyOf(a), boxed(10, 10, 100, 20)]]));
    expect(out).toEqual([]);
  });
});

describe("two teammates on one object are drawn once, together", () => {
  it("groups them onto a single mark rather than stacking two", () => {
    /* Stacked marks would put the second exactly over the first, so a
       collision - the one thing on this layer worth interrupting somebody
       about - would render as a single teammate. §3.3: "say so on the object,
       both colours, once." */
    const a = anchor({ runId: "r1", agentSlug: "builder" });
    const b = anchor({ runId: "r2", agentSlug: "designer", toolName: "design.draft" });
    const out = placeAnchors([a, b], new Map([[anchorKeyOf(a), boxed(0, 0, 200, 40)]]));
    expect(out).toHaveLength(1);
    expect(out[0]!.on.map((t) => t.slug).sort()).toEqual(["builder", "designer"]);
  });

  it("counts one teammate holding two runs as one face", () => {
    /* The rail dedupes by teammate, and if these two disagree about how many
       faces there are, one of them is lying on the same screen as the other. */
    const a = anchor({ runId: "r1" });
    const b = anchor({ runId: "r2", toolName: "prd.get" });
    const out = placeAnchors([a, b], new Map([[anchorKeyOf(a), boxed(0, 0, 200, 40)]]));
    expect(out[0]!.on).toHaveLength(1);
  });

  it("puts contested objects last so their mark is not painted over", () => {
    const solo = anchor({ runId: "r0", agentSlug: "researcher", targetId: OTHER });
    const a = anchor({ runId: "r1", agentSlug: "builder" });
    const b = anchor({ runId: "r2", agentSlug: "designer" });
    const out = placeAnchors(
      [a, b, solo],
      new Map([
        [anchorKeyOf(a), boxed(0, 0, 200, 40)],
        [anchorKeyOf(solo), boxed(0, 80, 200, 40)],
      ]),
    );
    expect(out.map((p) => p.on.length)).toEqual([1, 2]);
  });
});

describe("the mark and the collision are keyed by one function, not two", () => {
  /*
   * ── THIS WAS A DRIFT GUARD AND IS NOW A CONTRACT GUARD ───────────────────
   * `anchorKeyOf` used to be a marked COPY of `groupKeyOf`, and these cases
   * existed to catch the copy drifting. S0 exported the real one on
   * 2026-08-31, so the copy is gone and `anchorKeyOf` IS `groupKeyOf`.
   *
   * **The cases are kept, and they are not now trivial**, because what they
   * assert was never "the two functions agree" - it is that the key the MARK
   * computes selects the same group a COLLISION was actually built from. Those
   * are one function and two call paths, and the failure this protects against
   * is the second one changing: an `anchoredElements` that keyed on the raw
   * kind, or a `placeAnchors` that grouped before normalising, would pass every
   * other test in this file and put two teammates on two marks over one object.
   *
   * Asserted against the real `collisionsFrom` rather than a restatement of the
   * rule, for the reason that has not changed: a rule checked by a second copy
   * of the rule proves nothing.
   */
  it("treats one uuid named two ways as one object, exactly as collisionsFrom does", () => {
    // A-006: PRD e9e5b033 was held by several runs, some naming it `prd_id` and
    // some `id`, and the split reported them as unrelated pairs.
    const named = anchor({ runId: "r1", agentSlug: "builder", targetKind: "row:prd" });
    const bare = anchor({ runId: "r2", agentSlug: "designer", targetKind: "row" });

    expect(anchorKeyOf(named)).toBe(anchorKeyOf(bare));
    expect(collisionsFrom([named, bare])).toHaveLength(1);

    const out = placeAnchors([named, bare], new Map([[anchorKeyOf(named), boxed(0, 0, 10, 10)]]));
    expect(out).toHaveLength(1);
    expect(out[0]!.on).toHaveLength(2);
  });

  it("keeps a non-uuid id apart by kind, exactly as collisionsFrom does", () => {
    // `signal_id: "1"` and `theme_id: "1"` are two different things, and a mark
    // that fires where nothing is shared is the other way this surface dies.
    const s = anchor({ runId: "r1", targetKind: "row:signal", targetId: "1" });
    const t = anchor({ runId: "r2", targetKind: "row:theme", targetId: "1" });
    expect(anchorKeyOf(s)).not.toBe(anchorKeyOf(t));
    expect(collisionsFrom([s, t])).toEqual([]);
  });
});

describe("a surface says which object it drew, or says nothing", () => {
  it("stamps both facts when the object has an id", () => {
    expect(presenceAnchor("row:decision", "abc")).toEqual({
      "data-presence-kind": "row:decision",
      "data-presence-id": "abc",
    });
  });

  it("stamps NOTHING when the id is missing, rather than an empty attribute", () => {
    /* `data-presence-id=""` on every unidentified row would make them all key
       the same, so one anchor would light every card on the board at once.
       Returning no attributes means the layer simply does not know about the
       object, which is the honest state and the safe one. */
    for (const missing of [null, undefined, "", "   "]) {
      expect(presenceAnchor("row:decision", missing)).toEqual({});
      expect(Object.keys(presenceAnchor("row:decision", missing))).not.toContain(ANCHOR_ID_ATTR);
    }
  });
});

describe("a teammate's colour is an identity, or it is not a colour", () => {
  it("gives the same slug the same colour for the same crew, every time", () => {
    const crew = ["builder", "designer"];
    const once = teammateColour("builder", crew);
    expect(teammateColour("builder", [...crew].reverse())).toBe(once);
    expect(teammateColour("builder", crew)).toBe(once);
  });

  it("never hands one palette colour to two teammates at once", () => {
    /* §3.1 makes colour carry identity, so a repeat asserts something false: a
       person tracking "the blue one" would be watching two workers. */
    const crew = ["builder", "designer"];
    const used = crew.map((s) => teammateColour(s, crew));
    expect(new Set(used).size).toBe(crew.length);
  });

  it("falls back to a neutral past the end of the palette rather than repeating", () => {
    const crew = ["alpha", "beta", "gamma", "delta"];
    const used = crew.map((s) => teammateColour(s, crew));
    const identities = used.filter((c) => (TEAMMATE_COLOURS as readonly string[]).includes(c));
    // Exactly as many identity colours as the palette is wide, and every other
    // teammate says "out of colours" rather than "the same as that one".
    expect(identities.length).toBe(TEAMMATE_COLOURS.length);
    expect(new Set(identities).size).toBe(TEAMMATE_COLOURS.length);
    expect(used.filter((c) => c === TEAMMATE_COLOUR_OVERFLOW).length).toBe(
      crew.length - TEAMMATE_COLOURS.length,
    );
  });

  it("never spends the ember or the failure hue on a teammate", () => {
    /* §3.1 forbids the brand ember by name; --mrd-viz-4 sits beside --mrd-fail
       in meaning and a teammate drawn in failure-red reads as one that failed.
       Asserted on the palette itself so widening it later has to answer here. */
    expect(TEAMMATE_COLOURS).not.toContain("--mrd-viz-1");
    expect(TEAMMATE_COLOURS).not.toContain("--mrd-viz-4");
    for (const c of TEAMMATE_COLOURS) expect(c.startsWith("--mrd-")).toBe(true);
  });
});

describe("the layer is reachable, and something on a surface can be found", () => {
  /*
   * THE CLASS S3 FOUND SEVEN OF IN ONE NIGHT: work wired end to end with no
   * way in. It typechecks, it lints, it builds, its tests pass, and no gate
   * sees it. This feature is unusually exposed to it, because it has TWO ways
   * to be unreachable and each looks fine on its own.
   *
   *   1. The layer is never mounted, so no cursor is ever drawn.
   *   2. The layer is mounted and NOTHING on any surface is stamped, so it
   *      searches an empty registry forever and correctly draws nothing.
   *
   * The second is the nastier one: every unit test above passes, the component
   * renders, and the feature does not exist. Both are asserted on the source
   * because both are facts about wiring rather than about behaviour.
   */
  const read = (p: string) => readFileSync(join(import.meta.dir, p), "utf8");

  it("mounts the layer in the shell, once", () => {
    const shell = read("./AppFrame.tsx");
    expect(shell).toContain("<TeammateCursors");
    // ONCE. §4: "Cross-surface, so it lives with the shell. One
    // implementation, never per-route."
    expect(shell.match(/<TeammateCursors/g)).toHaveLength(1);
  });

  it("has at least one surface that stamps an object for it to find", () => {
    /* Asserted as "at least one" rather than by naming the file: which surface
       stamps first is a product decision that will move, and pinning it here
       would make this test a copy of today's shape rather than of the
       invariant. Zero is the only count that means the feature is not real. */
    const stamped = execSync(
      "grep -rl 'presenceAnchor(' src/components src/routes --include='*.tsx' | grep -v presence-anchor | grep -v '\\.test\\.' || true",
      { cwd: join(import.meta.dir, "..", "..", ".."), encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean);
    expect(stamped.length).toBeGreaterThan(0);
  });
});
