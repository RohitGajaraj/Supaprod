/**
 * ── A RULE WRITTEN AS PROSE IS A REQUEST. THIS ONE IS NOW A REFUSAL. ──────
 *
 * `repo.read`'s description has said "NEVER stage an edit to a file you have
 * not read in this session" for as long as it has existed, and `studio.stage`
 * never checked it.
 *
 * Found by looking for the CLASS rather than the instance. Three separate
 * defects on 2026-09-03 were the same shape:
 *
 *   `signals.log`'s description forbade filing the absence of evidence, and 96
 *   of the 277 signals in the workspace the team walks were the loop's own
 *   writing. Fixed in P-41 by making it a refusal.
 *
 *   Four comments asserted the shell rendered a sample tag and a banner
 *   (`use-workspace.tsx`, `_authenticated.tsx`, the seeder, a migration).
 *   Nothing rendered either. Fixed in P-33 by building them.
 *
 *   `seed_sample_workspace` was expected to mark the rows it invents. It never
 *   did, for a month. Fixed by a trigger, so it cannot be forgotten again.
 *
 * WHY THIS INSTANCE IS WORTH A REFUSAL AND NOT A BETTER SENTENCE. `op: "update"`
 * carries the whole new `content` and REPLACES the file. Staging an update to a
 * file the seat has not read is a blind whole-file overwrite of a customer's
 * code, with nothing on the record showing it was never looked at. That is the
 * most expensive thing in this registry that was resting on please.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const CODE = strip(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));

/** `studio.stage`'s own body, bounded at the next tool. */
const STAGE = CODE.slice(
  CODE.indexOf('name: "studio.stage"'),
  (() => {
    const from = CODE.indexOf('name: "studio.stage"');
    const next = CODE.indexOf("= def({", from);
    return next < 0 ? CODE.length : next;
  })(),
);

describe("staging an edit to a file nobody read is refused", () => {
  it("asks what was actually read, from the record of what the seat did", () => {
    // `tool_calls` already stores every call's args against the run's trace, so
    // this cannot drift from what happened: it IS what happened.
    expect(CODE).toContain("async function pathsReadInThisSession");
    expect(CODE.replace(/\s+/g, " ")).toContain('.eq("trace_id", ctx.traceId)');
  });

  it("refuses an update or a delete to an unread path", () => {
    const flat = STAGE.replace(/\s+/g, " ");
    expect(flat).toContain('a.changes.filter((c) => c.op !== "create").map((c) => c.path)');
    expect(flat).toContain("const blind = touched.filter((p) => !seen.has(p));");
    expect(flat).toContain("if (blind.length > 0)");
  });

  it("exempts create, because there is nothing to read", () => {
    // Requiring a read there would make the tool unable to add a file at all.
    expect(STAGE).toContain('c.op !== "create"');
  });

  it("counts a path this session already staged as read", () => {
    // The seat wrote that content, so it has seen it. Without this a second
    // stage touching one file in a session would be refused for not re-reading.
    expect(CODE.replace(/\s+/g, " ")).toContain('.in("tool_name", ["repo.read", "studio.stage"])');
  });

  it("fails OPEN when it cannot tell, and never closed", () => {
    /*
     * Two ways it cannot tell: no `trace_id` (a test, a direct call), or the
     * lookup itself failed. Neither is evidence the seat skipped its homework,
     * so neither may be the thing that refuses a write. It closes the hole for
     * the callers it can see rather than inventing a claim about the ones it
     * cannot.
     */
    expect(CODE.replace(/\s+/g, " ")).toContain(
      "if (!ctx.traceId || paths.length === 0) return null;",
    );
    expect(CODE.replace(/\s+/g, " ")).toContain("if (error) return null;");
    // `seen === null` means unknown, and the caller must skip rather than refuse.
    expect(STAGE.replace(/\s+/g, " ")).toContain("if (seen) {");
  });

  it("the refusal tells the seat exactly what to do next", () => {
    // A refusal with no door is how a seat starts inventing one.
    expect(STAGE).toContain("Call repo.read on");
    expect(STAGE).toContain("an update replaces the whole file");
  });
});
