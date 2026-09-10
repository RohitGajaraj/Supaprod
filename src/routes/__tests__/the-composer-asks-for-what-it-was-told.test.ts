/**
 * THE TWO CONTROLS OF ONE COMPOSER MUST NOT DISAGREE ABOUT WHAT IS BEING
 * DESCRIBED.
 *
 * MEASURED ON THE SERVED HOME, 2026-09-10, workspace A1 delete probe. The
 * shape picker read *"Something we have not built before"* -- which is its
 * DEFAULT (`useState<WorkShape>("new-capability")`), so this was the first
 * frame of every arrival, not a state someone had to reach -- and the box
 * eighteen pixels above it read:
 *
 *     "Change one thing in A1 delete probe, and say what it should do"
 *
 * A person had chosen nothing and the composer was already contradicting
 * itself: one control said this is work we have never built, the other told
 * them to change an existing thing. `placeholderFor` took only the product,
 * so it could not follow the shape even in principle -- five shapes, one
 * sentence, and the sentence written for exactly one of them.
 *
 * These assertions pin the AGREEMENT, not the copy. Each shape's ask must be
 * its own and must not carry the vocabulary of a shape it is not, so the
 * wording can improve freely and only a genuine contradiction fails.
 */
import { describe, test, expect } from "bun:test";

import { placeholderFor } from "@/routes/_authenticated.start";
import { WORK_SHAPE_LABEL, type WorkShape } from "@/lib/spine/route";

const SHAPES = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];
const PRODUCT = { name: "Relay", northStar: null };

describe("the composer asks for what its picker was told", () => {
  test("every shape is covered, so a new one cannot inherit another's prompt", () => {
    // The defect shape: a shape added to the union with no ask of its own
    // would silently borrow whatever the fallback happened to be.
    for (const shape of SHAPES) {
      expect(placeholderFor(PRODUCT, shape)).toContain(PRODUCT.name);
    }
  });

  test("no two shapes ask the same question", () => {
    const asks = SHAPES.map((s) => placeholderFor(PRODUCT, s));
    expect(new Set(asks).size).toBe(SHAPES.length);
  });

  test("THE REGRESSION: work we have never built is never asked to be a change", () => {
    // The exact served contradiction. "change one thing" belongs to
    // existing-feature and to nothing else.
    const ask = placeholderFor(PRODUCT, "new-capability").toLowerCase();
    expect(ask).not.toContain("change one thing");
  });

  test("the default shape and the default prompt agree", () => {
    // `pickedShape` defaults to new-capability, and placeholderFor defaults to
    // the same, so the first frame of an arrival is coherent by construction.
    expect(placeholderFor(PRODUCT)).toBe(placeholderFor(PRODUCT, "new-capability"));
  });

  test("a broken thing is not asked what it should do instead of existing", () => {
    const ask = placeholderFor(PRODUCT, "incident-fix").toLowerCase();
    expect(ask).toContain("broken");
  });

  test("a change nobody sees is not asked what a person sees", () => {
    const seen = placeholderFor(PRODUCT, "interface-change").toLowerCase();
    const unseen = placeholderFor(PRODUCT, "under-the-hood").toLowerCase();
    expect(seen).toContain("sees");
    expect(unseen).not.toContain("sees");
  });
});

describe("the north star still speaks, where it is the right question", () => {
  const WITH_GOAL = { name: "Relay", northStar: "Convert more trial teams to paid" };

  test("an open-ended outcome prompt belongs to open-ended work", () => {
    expect(placeholderFor(WITH_GOAL, "new-capability")).toBe(
      "Help Relay convert more trial teams to paid",
    );
  });

  test("it does not answer a question the person just said they were not asking", () => {
    // Over "Something is broken now", a north star prompt is the composer
    // ignoring the control beside it -- the same defect one level quieter.
    expect(placeholderFor(WITH_GOAL, "incident-fix").toLowerCase()).toContain("broken");
    for (const shape of SHAPES.filter((s) => s !== "new-capability")) {
      expect(placeholderFor(WITH_GOAL, shape)).not.toContain("Help Relay convert");
    }
  });

  test("a north star that is not a verb phrase is still refused", () => {
    // Unchanged behaviour: "Help Relay the fastest handover in the trade"
    // is not a sentence, so the shape's own ask is used instead.
    const notAVerb = { name: "Relay", northStar: "The fastest handover in the trade" };
    expect(placeholderFor(notAVerb, "new-capability")).toBe(
      placeholderFor(PRODUCT, "new-capability"),
    );
  });

  test("with no product at all, the example sentence stands", () => {
    for (const shape of SHAPES) {
      expect(placeholderFor(null, shape)).toBe(placeholderFor(null));
    }
  });
});
