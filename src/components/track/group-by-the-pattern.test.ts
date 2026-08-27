import { describe, expect, it } from "bun:test";

import { groupByThePattern } from "./group-by-the-pattern";

const sig = (id: string, theme_id?: string | null, theme_title?: string | null) => ({
  artifactId: id,
  fields: {
    ...(theme_id === undefined ? {} : { theme_id }),
    ...(theme_title === undefined ? {} : { theme_title }),
  },
});

describe("group evidence by the pattern it names", () => {
  it("groups a signal whose theme is not on this track", () => {
    /*
     * The defect, in its measured proportion: of 1,133 signals attached to
     * tracks, 818 name a theme that is not a member of the same track. Every
     * one of them was drawn under "do not sit with a pattern yet", which was
     * false for all 818 and true for none.
     */
    const { groups, ungrouped } = groupByThePattern(
      [sig("s1", "t9", "Checkout drop-off")],
      new Set(),
    );
    expect(ungrouped).toHaveLength(0);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ themeId: "t9", title: "Checkout drop-off", hasCard: false });
  });

  it("marks a group whose theme card this pane actually holds", () => {
    const { groups } = groupByThePattern([sig("s1", "t1", "Slow search")], new Set(["t1"]));
    expect(groups[0].hasCard).toBe(true);
  });

  it("puts the groups it can open first, and is otherwise stable", () => {
    // A person can act on a group whose card is here; the rest are context.
    const { groups } = groupByThePattern(
      [sig("a", "t9", "Named only"), sig("b", "t1", "Has a card")],
      new Set(["t1"]),
    );
    expect(groups.map((g) => g.themeId)).toEqual(["t1", "t9"]);
  });

  it("leaves a signal with no theme at all ungrouped, which is the honest case", () => {
    const { groups, ungrouped } = groupByThePattern([sig("s1", null)], new Set());
    expect(groups).toHaveLength(0);
    expect(ungrouped).toHaveLength(1);
  });

  it("will not gather signals under a pattern it can neither draw nor name", () => {
    /*
     * An ABSENT `theme_title` is a read that failed and a null one is a theme
     * that is gone. Neither is invented into a group: a heading saying "we
     * could not read this" is worse than an ungrouped card, and
     * `clustered-into.ts` keeps the two apart at the card level anyway.
     */
    expect(groupByThePattern([sig("s1", "t9")], new Set()).ungrouped).toHaveLength(1);
    expect(groupByThePattern([sig("s1", "t9", null)], new Set()).ungrouped).toHaveLength(1);
  });

  it("still groups an unnamed theme when its card is here to speak for it", () => {
    // The card carries the title in that case, so the group is readable.
    const { groups } = groupByThePattern([sig("s1", "t1")], new Set(["t1"]));
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBeNull();
  });

  it("collects every signal naming one pattern into one group", () => {
    const { groups } = groupByThePattern(
      [sig("a", "t9", "One pattern"), sig("b", "t9", "One pattern")],
      new Set(),
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].signals.map((s) => s.artifactId)).toEqual(["a", "b"]);
  });
});
