import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { requiredArgNames, requiredArgsClause } from "./required-args";

/**
 * THE MODEL WAS NEVER SHOWN A TOOL'S PARAMETERS (F-185, found by S4 as S4-181).
 *
 * `describeToolsForPrompt` rendered `- name (category, mode): description` and
 * its own doc comment said *"(no schemas)"*. The native path that would send
 * them is gated on `AGENT_NATIVE_TOOLCALLING === "1"` and ships empty. So the
 * model inferred argument names from prose.
 *
 * **`ce846e9b`'s Discover visit: three seats, 146,239 tokens, two dead at the
 * step limit on** *"the signals.log tool requires a 'content' field"*.
 */
describe("required args", () => {
  it("names the fields a caller must supply", () => {
    const schema = z.object({ content: z.string(), source: z.string() });
    expect(requiredArgNames(schema)).toEqual(["content", "source"]);
  });

  it("leaves out anything the caller may omit", () => {
    // `.optional()`, `.nullish()` and `.default()` are all "you need not send
    // this". A field with a default is not something the model must supply, and
    // listing it would push noise into every station's prompt.
    const schema = z.object({
      content: z.string(),
      tags: z.array(z.string()).optional(),
      url: z.string().nullish(),
      kind: z.string().default("note"),
    });
    expect(requiredArgNames(schema)).toEqual(["content"]);
  });

  it("keeps declaration order, because that is the order the tool documents", () => {
    const schema = z.object({ title: z.string(), body: z.string(), draft: z.boolean().optional() });
    expect(requiredArgNames(schema)).toEqual(["title", "body"]);
  });

  it("DEGRADES TO TODAY'S BEHAVIOUR on anything it cannot read", () => {
    // The only safe failure here: the prompt is what every station runs on, so a
    // schema this cannot inspect must still yield a tool line with its
    // description, exactly as before. Never a throw.
    expect(requiredArgNames(z.string())).toEqual([]);
    expect(requiredArgNames(undefined)).toEqual([]);
    expect(requiredArgNames(null)).toEqual([]);
    expect(requiredArgNames({ shape: "not a schema" })).toEqual([]);
  });

  it("adds nothing to the line when there is nothing to add", () => {
    // A tool whose arguments are all optional reads exactly as it does today.
    expect(requiredArgsClause(z.object({ q: z.string().optional() }))).toBe("");
    expect(requiredArgsClause(z.string())).toBe("");
  });

  it("renders the clause the prompt actually carries", () => {
    expect(requiredArgsClause(z.object({ title: z.string(), body: z.string() }))).toBe(
      " Required: title, body.",
    );
  });

  it("says the one word signals.log's three paragraphs never did", () => {
    // The live failure, reduced to its schema. The description talks about
    // quotes and tickets and what qualifies as evidence; the word the two dead
    // seats needed was `content`.
    const signalsLog = z.object({
      content: z.string(),
      source: z.string().optional(),
      url: z.string().optional(),
    });
    expect(requiredArgsClause(signalsLog)).toContain("content");
  });
});
