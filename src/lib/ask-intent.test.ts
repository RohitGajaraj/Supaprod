import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contentForIntent, defaultIntent } from "./ask-intent";

describe("ask-intent: the fork the old box hid", () => {
  it("reads a question as a question", () => {
    expect(defaultIntent("what happened to run 41")).toBe("question");
    expect(defaultIntent("why did we decide that")).toBe("question");
    expect(defaultIntent("show me the spec")).toBe("question");
  });

  it("reads work as work", () => {
    expect(defaultIntent("fix the checkout redirect")).toBe("instruction");
    expect(defaultIntent("draft the release note")).toBe("instruction");
    expect(defaultIntent("migrate the settings table")).toBe("instruction");
  });

  // The clearest signal a person gives, and it wins over everything: a question
  // phrased as an imperative must never silently start a run.
  it("a question mark outranks an imperative verb", () => {
    expect(defaultIntent("run me through the checkout change?")).toBe("question");
  });

  it("an explicit mention is already a command", () => {
    expect(defaultIntent("@engineer rename the caller")).toBe("instruction");
  });

  it("an empty draft is a question, because nothing should default to spending", () => {
    expect(defaultIntent("")).toBe("question");
    expect(defaultIntent("   ")).toBe("question");
  });

  it("falls back to a question when it cannot tell, for the same reason", () => {
    expect(defaultIntent("checkout redirect")).toBe("question");
  });
});

/**
 * ── THE `@cos` ACCIDENT, AND THE GUARD THAT KEEPS IT DEAD ──────────────────
 *
 * This module used to prefix the literal string `@cos` onto every instruction,
 * because `api/chat.ts` treats a leading `@slug` as an unambiguous command and
 * dispatches without asking its classifier. It worked, and it cost four things
 * that the file's own header now lists: the classifier never ran on a handover
 * (it is gated on `!mentionedAgent`), the dispatch took the single-step mention
 * path instead of the planning loop, a `station: "decide"` frame went out off a
 * seat the catalog documents as occupying no station, and the person watched
 * their own sentence get edited on the way to the transcript.
 *
 * The honest lever had been live since 2026-08-20: `wantsDispatch` reads
 * `body.intent`, so a stated "do" with words after it opens a run on its own.
 *
 * THE PREFIX IS NOT A THING THAT CAN BE HALF-REMOVED. Put it back in any form —
 * `@cos`, `@chief`, `@chief-of-staff`, all three of which `MENTION_ALIASES` maps
 * to the conductor — and every one of those four costs returns silently, with
 * every test still green, because the feature keeps working. That is why the
 * guard below is on the SHAPE (nothing is prepended) rather than on the string.
 */
describe("ask-intent: what goes on the wire", () => {
  it("a question travels verbatim", () => {
    expect(contentForIntent("  what happened  ", "question")).toBe("what happened");
  });

  it("an instruction travels verbatim too, which is the repair", () => {
    expect(contentForIntent("fix the redirect", "instruction")).toBe("fix the redirect");
    expect(contentForIntent("  draft the release note  ", "instruction")).toBe(
      "draft the release note",
    );
  });

  it("adds nothing to the front of anything, whichever fork was pressed", () => {
    // The general claim, not a spelling. Any prefix at all fails this, so
    // reintroducing the accident under a different alias fails it too.
    for (const draft of ["fix the redirect", "what happened", "ship it", "@engineer fix it"]) {
      for (const intent of ["question", "instruction"] as const) {
        expect(contentForIntent(draft, intent)).toBe(draft.trim());
      }
    }
  });

  it("leaves a mention the person typed exactly where they put it", () => {
    // Their sentence, their address. The mention branch is the right path for
    // an explicitly named specialist; what was wrong was writing one for them.
    expect(contentForIntent("@engineer fix it", "instruction")).toBe("@engineer fix it");
    expect(contentForIntent("ask @engineer why this broke", "question")).toBe(
      "ask @engineer why this broke",
    );
  });

  it("the module itself no longer knows the conductor's alias", () => {
    /*
     * A source guard, because the two above pass just as well while a dead
     * `HANDOVER_MENTION` sits exported one line away waiting for the next
     * person to reach for it. Comments are stripped: the header explains this
     * history at length and has to be allowed to name the string it killed.
     */
    const src = readFileSync(join(import.meta.dir, "ask-intent.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(src).not.toMatch(/@(cos|chief)/);
    expect(src).not.toContain("HANDOVER_MENTION");
  });
});
