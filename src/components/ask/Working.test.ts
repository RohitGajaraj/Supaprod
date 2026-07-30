/**
 * The one rule: NEVER INVENT A STATUS.
 *
 * The founder asked for a live line "like Claude Code shows waiting for
 * background, running this task, discovering". The tempting build is a carousel
 * of those verbs on a timer, and it is a lie told at four second intervals: the
 * plain chat path in `/api/chat` (`researchMode === "chat"`) emits no progress
 * events at all, so on that path every one of those words would be invented.
 *
 * These pin the vocabulary to two client-observable facts plus whatever the
 * server actually said, so a future change that adds a nicer-sounding verb has
 * to delete a test that explains why it must not.
 */
import { describe, test, expect } from "bun:test";
import { workingLabel, WORKING_EFFORT_WORDS } from "./Working";

describe("workingLabel: the server's words win", () => {
  test("a real progress event is shown verbatim", () => {
    expect(workingLabel({ phase: "search", label: "Searching: SSO rollout" }, false)).toBe(
      "Searching: SSO rollout",
    );
    expect(workingLabel({ phase: "workspace", label: "Reading your workspace" }, true)).toBe(
      "Reading your workspace",
    );
  });

  // A status frame arriving with an empty label is a malformed frame, not an
  // instruction to render a blank line where a verb should be.
  test("an empty label falls back rather than rendering nothing", () => {
    expect(workingLabel({ phase: "plan", label: "   " }, false)).toBe("Working");
  });
});

describe("workingLabel: with no event, only what it can see", () => {
  test("tokens arriving beats any flavour word, because it is specific and true", () => {
    expect(workingLabel(null, true)).toBe("Writing the answer");
    expect(workingLabel(null, true, 5)).toBe("Writing the answer");
  });

  test("nothing back yet cycles the effort words, so the line is never frozen", () => {
    const seen = new Set<string>();
    for (let t = 0; t < WORKING_EFFORT_WORDS.length; t++) seen.add(workingLabel(null, false, t));
    expect(seen.size).toBe(WORKING_EFFORT_WORDS.length);
    // It wraps rather than running off the end of the list.
    expect(workingLabel(null, false, WORKING_EFFORT_WORDS.length)).toBe(
      workingLabel(null, false, 0),
    );
  });
});

/**
 * THE LINE THE FLAVOUR WORDS MAY NOT CROSS, and the reason this file exists.
 *
 * The founder asked for character ("something is brewing in the background"),
 * which is granted. What is NOT granted is a word that names a capability we
 * cannot prove ran: on the plain chat path no retrieval and no web search
 * happen, so "Searching" or "Reading your workspace" in the FALLBACK would be a
 * straight lie, and a reader cannot tell a flavour word from a claim.
 *
 * An effort word is intransitive and asserts nothing. An operation word does.
 */
describe("the effort words describe effort, never an operation", () => {
  const OPERATION_WORDS = [
    "search",
    "read",
    "consult",
    "analyz",
    "analys",
    "discover",
    "scan",
    "fetch",
    "query",
    "retriev",
    "check",
    "look",
    "index",
    "crawl",
  ];

  test("no word in the list names something we might not be doing", () => {
    for (const word of WORKING_EFFORT_WORDS) {
      for (const banned of OPERATION_WORDS) {
        expect(word.toLowerCase()).not.toContain(banned);
      }
    }
  });

  test("they are short enough not to wrap a 392px pane", () => {
    for (const word of WORKING_EFFORT_WORDS) expect(word.length).toBeLessThanOrEqual(24);
  });

  test("there are enough of them that the cycle is not obvious", () => {
    expect(WORKING_EFFORT_WORDS.length).toBeGreaterThanOrEqual(6);
    expect(new Set(WORKING_EFFORT_WORDS).size).toBe(WORKING_EFFORT_WORDS.length);
  });
});
