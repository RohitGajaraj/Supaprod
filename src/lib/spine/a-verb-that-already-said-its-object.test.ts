/**
 * A LINE MUST NOT SAY THE SAME NOUN TWICE.
 *
 * SEEN ON THE SERVED HOME, 2026-09-10, in a run row's live line:
 *
 *     "Draft is revising the spec the spec"
 *
 * Both halves were doing their job. `VERB_BY_TOOL` phrases are complete
 * clauses that already name what they act on -- "revising the spec",
 * "committing the change" -- and `objectLabelOf` returns the very same nouns.
 * Two call sites appended one to the other whenever the server had supplied a
 * verb, and the guard asked whether a verb EXISTED rather than what it said.
 *
 * The assertions below are about the duplication, and about the one case
 * where appending is still right: a FILE object is a filename the verb cannot
 * know, so it must survive.
 */
import { describe, test, expect } from "bun:test";

import { verbWithObject, objectLabelOf } from "@/lib/spine/what-is-running";
import { VERB_BY_TOOL } from "@/lib/presence/character";

describe("a verb that already said its object", () => {
  test("THE REGRESSION: the exact line seen on the served home", () => {
    expect(verbWithObject("revising the spec", "the spec")).toBe("revising the spec");
  });

  test("no verb in the table can duplicate any object word", () => {
    // The defect is a shape, not a string, so this walks the whole cross
    // product rather than pinning the one pair that was caught.
    const objects = [
      "the spec",
      "the change",
      "the build",
      "the drawing",
      "the record",
      "the task",
    ];
    for (const verb of Object.values(VERB_BY_TOOL)) {
      for (const object of objects) {
        const line = verbWithObject(verb, object).toLowerCase();
        const first = line.indexOf(object);
        if (first === -1) continue;
        expect(line.indexOf(object, first + 1)).toBe(-1);
      }
    }
  });

  test("a filename still survives, because the verb cannot know it", () => {
    // This is the one case the append was ever right for, and the fix must
    // not be "stop appending".
    expect(verbWithObject("staging the change", "Address.tsx")).toBe(
      "staging the change Address.tsx",
    );
    expect(objectLabelOf({ kind: "file", id: "src/app/Address.tsx" })).toBe("Address.tsx");
  });

  test("an object that only shares a word is not treated as said", () => {
    // "the change" is not contained in "reading the changelog" as a trailing
    // word, so suppressing it would lose a real fact.
    expect(verbWithObject("reading the changelog", "the change")).toBe(
      "reading the changelog the change",
    );
  });

  test("case and stray whitespace do not smuggle a duplicate through", () => {
    expect(verbWithObject("Revising The Spec", " the spec ")).toBe("Revising The Spec");
  });

  test("no object at all leaves the verb exactly as it was", () => {
    expect(verbWithObject("revising the spec", null)).toBe("revising the spec");
    expect(verbWithObject("revising the spec", "")).toBe("revising the spec");
  });
});
