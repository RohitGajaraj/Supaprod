/**
 * ── AN ARGUMENT NOBODY REFUSES ───────────────────────────────────────────────
 *
 * The defect, measured by worktree-1-68 on 2026-09-09: a zod object strips what
 * it does not declare, so an argument the model invented was deleted between
 * the model and the tool and NOTHING said so. Trace 0588c262 ran one search
 * four times believing it had run four, because `signals.list` has no query
 * argument, and then filed all four phrasings on the evidence record.
 *
 * Over 60 days of `ai_events`: 1,059 outputs emitted `days_back` (the argument
 * is `lookback_days`) and 228 emitted a `query` beside `signals.list`.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { TOOL_REGISTRY } from "./registry.server";
import { acceptedArgKeys, unknownArgKeys, unknownArgsMessage } from "./an-argument-nobody-refuses";

const listSignals = TOOL_REGISTRY["signals.list"]!;

describe("an argument the schema does not declare is refused, not deleted", () => {
  it("names the two the model actually sent, and only those", () => {
    const unknown = unknownArgKeys(listSignals.argsSchema, {
      query: "reschedule installer visit order page",
      days_back: 30,
      limit: 20,
    });
    expect(unknown.sort()).toEqual(["days_back", "query"]);
  });

  /*
   * THE MIRROR (law 12). A guard that only checks that a stray key is caught
   * passes just as happily if every key is refused, which would break every
   * call in the product. So the good call is asserted in the same breath.
   */
  it("refuses nothing when every argument is one the tool declares", () => {
    for (const [name, def] of Object.entries(TOOL_REGISTRY)) {
      const keys = acceptedArgKeys(def.argsSchema);
      if (!keys?.length) continue;
      const everyDeclaredKey = Object.fromEntries(keys.map((k) => [k, null]));
      expect({ name, stray: unknownArgKeys(def.argsSchema, everyDeclaredKey) }).toEqual({
        name,
        stray: [],
      });
    }
  });

  it("says what was refused, what the tool takes, and that the call did not do it", () => {
    const msg = unknownArgsMessage(
      "signals.list",
      ["query"],
      acceptedArgKeys(listSignals.argsSchema) ?? [],
    );
    expect(msg).toContain("signals.list has no argument named query");
    expect(msg).toContain("lookback_days");
    // The consequence, said out loud: the model believed the call had searched.
    expect(msg).toContain("did NOT do what they asked for");
    // No guess at intent: a near-miss suggestion that is wrong is worse than a
    // list that is always true.
    expect(msg).not.toContain("did you mean");
  });

  it("never refuses on a guess where it cannot read the schema", () => {
    // A schema told to keep what it does not declare, and one that is not an
    // object at all: this file has no business naming keys in either.
    expect(unknownArgKeys(z.object({ a: z.string() }).passthrough(), { b: 1 })).toEqual([]);
    expect(unknownArgKeys(z.string(), { b: 1 })).toEqual([]);
    expect(unknownArgKeys(z.object({ a: z.string() }), null)).toEqual([]);
    expect(unknownArgKeys(z.object({ a: z.string() }), [1, 2])).toEqual([]);
  });

  it("reads through the wrappers the registry actually uses", () => {
    const inner = z.object({ a: z.string(), b: z.number() });
    expect(acceptedArgKeys(inner.refine(() => true))).toEqual(["a", "b"]);
    expect(acceptedArgKeys(inner.optional())).toEqual(["a", "b"]);
  });

  /*
   * A CENSUS, so a tool added with an exotic schema is noticed rather than
   * quietly exempted. Every tool is either readable here or on this list with
   * a reason, and the two sides are asserted to cover the registry.
   */
  it("every tool's arguments are readable, or the list says which are not", () => {
    const unreadable = Object.entries(TOOL_REGISTRY)
      .filter(([, def]) => acceptedArgKeys(def.argsSchema) === null)
      .map(([name]) => name)
      .sort();
    expect(unreadable).toEqual([]);
    // And the sweep saw the registry, rather than an empty one reading as clean.
    expect(Object.keys(TOOL_REGISTRY).length).toBeGreaterThan(50);
  });
});

describe("a description that names its arguments is one the model can obey", () => {
  it("signals.list names every argument it takes, derived from the schema", () => {
    /* "how many days back to look" is why 1,059 outputs emitted `days_back`.
       Comparing the description against the schema's own keys means a renamed
       argument fails here rather than being invented at by a model for a
       month. */
    const keys = acceptedArgKeys(listSignals.argsSchema) ?? [];
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) expect(listSignals.description).toContain(k);
  });

  it("and says it cannot search by words, naming the tool that can", () => {
    expect(listSignals.description).toContain("workspace.search");
    expect(TOOL_REGISTRY["workspace.search"]).toBeDefined();
  });
});

/**
 * ── THE ONE THING A UNIT TEST CANNOT SAY ─────────────────────────────────────
 *
 * `safeParse` is what DELETES the stray key. A refusal placed after it would
 * never fire, because by then the argument is gone and every call looks clean,
 * and the file would still be full of passing tests. So the order is the
 * property, and only the call site can be asked about it.
 */
describe("the refusal happens before the strip, or it happens never", () => {
  const LOOP = readFileSync("src/lib/ai/loop.server.ts", "utf8");

  it("asks for stray arguments before parsing them away, and stops the call", () => {
    const stray = LOOP.indexOf("const strayArgs = unknownArgKeys(def.argsSchema, call.args)");
    const strip = LOOP.indexOf("const parseRes = def.argsSchema.safeParse(call.args)");
    expect(stray).toBeGreaterThan(-1);
    expect(strip).toBeGreaterThan(-1);
    expect(stray).toBeLessThan(strip);
    // Bounded at the strip so a neighbour's text is never read as this branch's.
    const branch = LOOP.slice(stray, strip);
    // The model is told, on the conversation, and the call does not run.
    expect(branch).toContain("unknownArgsMessage(");
    expect(branch).toContain("Fix args or finalize.");
    expect(branch).toContain("continue;");
    // And it is recorded as a failed call rather than vanishing from the run.
    expect(branch).toContain('status: "error"');
  });
});
