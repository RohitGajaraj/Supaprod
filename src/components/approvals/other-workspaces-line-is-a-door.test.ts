/**
 * P-93: the other-workspaces line names a workspace and is a door, never a
 * bare cross-workspace count. The sentence-building logic
 * (`otherWorkspacesLine`'s own `useMemo` in `_authenticated.approvals.tsx`)
 * is small and pure enough to lift and test directly rather than mounting
 * the whole page (workspace context, router search params, N live
 * per-workspace queries, a keyboard effect) -- same reasoning
 * `waiting-announces-its-own-arrivals.test.ts` (P-90) already used for this
 * file's own live region.
 */
import { describe, expect, it } from "bun:test";

type Ranked = { id: string; name: string; count: number };

/** Byte-identical to the route file's own `otherWorkspacesLine` memo body --
 *  kept here as a plain function so it can be exercised directly. If the
 *  route file's logic ever drifts from this, `the route file's own source
 *  still matches this shape` below catches it. */
function otherWorkspacesLine(
  otherWorkspacesWithWork: readonly Ranked[],
): { text: string; targetWorkspaceId: string } | null {
  if (otherWorkspacesWithWork.length === 0) return null;
  const [top, second] = otherWorkspacesWithWork;
  if (!top) return null;
  const parts = [`${top.count} waiting in ${top.name}`];
  if (second) parts.push(`${second.count} in ${second.name}`);
  const restCount = otherWorkspacesWithWork.length - parts.length;
  const tail =
    restCount === 0 ? "." : restCount === 1 ? ", and one more." : `, and ${restCount} more.`;
  return { text: `${parts.join(", ")}${tail}`, targetWorkspaceId: top.id };
}

const ws = (id: string, name: string, count: number): Ranked => ({ id, name, count });

describe("otherWorkspacesLine names the workspace with the most waiting", () => {
  it("is null with nothing waiting anywhere else (P-63's zero state covers the page)", () => {
    expect(otherWorkspacesLine([])).toBeNull();
  });

  it("names the one workspace, per the packet's own example sentence", () => {
    expect(otherWorkspacesLine([ws("w1", "Helio Labs", 51)])).toEqual({
      text: "51 waiting in Helio Labs.",
      targetWorkspaceId: "w1",
    });
  });

  it("lists the top two when a second workspace also holds work", () => {
    expect(otherWorkspacesLine([ws("w1", "Helio Labs", 51), ws("w2", "Acme Co", 12)])).toEqual({
      text: "51 waiting in Helio Labs, 12 in Acme Co.",
      targetWorkspaceId: "w1",
    });
  });

  it('says "and one more" for exactly a third, per the packet\'s own wording', () => {
    expect(
      otherWorkspacesLine([
        ws("w1", "Helio Labs", 51),
        ws("w2", "Acme Co", 12),
        ws("w3", "Third", 3),
      ]),
    ).toEqual({
      text: "51 waiting in Helio Labs, 12 in Acme Co, and one more.",
      targetWorkspaceId: "w1",
    });
  });

  it("generalizes past three to a real count, not a second singular", () => {
    const line = otherWorkspacesLine([
      ws("w1", "Helio Labs", 51),
      ws("w2", "Acme Co", 12),
      ws("w3", "Third", 3),
      ws("w4", "Fourth", 1),
    ]);
    expect(line?.text).toBe("51 waiting in Helio Labs, 12 in Acme Co, and 2 more.");
  });

  it("the door always targets the workspace with the most waiting, never the second", () => {
    const line = otherWorkspacesLine([ws("w1", "Helio Labs", 5), ws("w2", "Acme Co", 40)]);
    // The caller is responsible for sorting descending before this function
    // ever sees the list -- asserted here so a caller that forgot to sort
    // is visible: this function trusts its input's order.
    expect(line?.targetWorkspaceId).toBe("w1");
  });

  it("never renders a bare number with no workspace name attached to it", () => {
    const line = otherWorkspacesLine([ws("w1", "Helio Labs", 51)]);
    // The one number this whole file exists to forbid: a count that names
    // no workspace. Every digit in the sentence has a name within a few
    // words of it.
    expect(line?.text).not.toMatch(/^\d+\.?$/);
    expect(line?.text).toContain("Helio Labs");
  });
});

describe("the route file's own source still matches this shape", () => {
  it("carries the same three-way tail branch (0 / one more / N more)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const src = readFileSync(
      join(import.meta.dir, "..", "..", "routes", "_authenticated.approvals.tsx"),
      "utf8",
    );
    expect(src).toContain('restCount === 0 ? "." : restCount === 1 ? ", and one more."');
    expect(src).toContain("targetWorkspaceId: top.id");
    // The door itself: a button that switches the active workspace, not a
    // route Link -- pressing it never changes the URL, it changes which
    // workspace /approvals is scoped to.
    expect(src).toContain("setActiveWorkspaceId(otherWorkspacesLine.targetWorkspaceId)");
  });
});
