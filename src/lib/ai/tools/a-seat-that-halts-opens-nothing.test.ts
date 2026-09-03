/**
 * The product's first change to reach Ship was 90 lines of CSS for
 * `.address-summary` selectors in a repo with no address summary component,
 * opened after the Build seat's own transcript said:
 *
 *   "there is no address summary component ... I must halt and state plainly
 *    that the work belongs elsewhere"
 *
 * The seat was RIGHT and had no way to say so. That is the finding: it reached
 * the correct conclusion, wrote it in prose, and prose is not a control.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  refusalAfterHalt,
  haltedBuildLine,
  HALTED_BUILD_HOLD,
  WRITES_AFTER_A_HALT,
} from "./a-seat-that-halts-opens-nothing";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const REG = code(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));
const DEFAULTS = code(readFileSync("src/lib/ai/tools/defaults.ts", "utf8"));
const CONSEQ = code(readFileSync("src/lib/tool-consequences.ts", "utf8"));

/** One tool's `run` body, bounded at both ends (F-191). */
function runBody(name: string): string {
  const at = REG.indexOf(`name: "${name}"`);
  expect(at, `${name} is not in the registry`).toBeGreaterThan(-1);
  const next = REG.indexOf("\nconst ", at);
  return REG.slice(at, next === -1 ? REG.length : next);
}

describe("the seat has the verb it lacked", () => {
  it("registers build.halt as a tool, not a note", () => {
    expect(REG).toContain('name: "build.halt"');
    expect(REG).toContain("const buildHalt = def({");
    expect(REG).toContain("    buildHalt,");
  });

  it("runs unattended, because gating the honest answer leaves the dishonest one free", () => {
    // A seat that has found the spec targets something absent has to be able to
    // SAY so without waiting for a person. Gate the halt and the only unblocked
    // path left is the one it took: stage something approximate and open a PR.
    expect(DEFAULTS).toContain('"build.halt": { mode: "auto", enabled: true');
  });

  it("is declared a READ everywhere that scores it", () => {
    // An unknown tool is high-risk by default, which is the right fail-safe and
    // the wrong answer here: it writes nothing, it ends a run.
    expect(CONSEQ).toContain('"build.halt": {');
    expect(CONSEQ).toContain('"build.halt",');
  });

  it("demands a real reason, because the sentence IS the deliverable", () => {
    const body = runBody("build.halt");
    expect(body).toContain("reason: z.string().min(20)");
  });
});

describe("a halt binds the whole run, not the next call", () => {
  it("refuses the three doors that put a change into the world", () => {
    for (const tool of ["studio.commit", "studio.pr.open", "studio.pr.merge"]) {
      const body = runBody(tool);
      expect(body, `${tool} does not check for a halt`).toContain("haltedInThisRun(ctx)");
      expect(body).toContain("refusalAfterHalt(haltedReason)");
    }
  });

  it("guards the MERGE too, which is the door that reached a customer", () => {
    expect(runBody("studio.pr.merge")).toContain("haltedInThisRun");
  });

  it("reads the halt from the run's own trace, not from memory", () => {
    // In-run memory would not survive the loop's boundaries, and the halt has to
    // bind every writing tool for the rest of the run.
    expect(REG).toContain('.eq("tool_name", "build.halt")');
    expect(REG).toContain('.eq("trace_id", ctx.traceId)');
    expect(REG).toContain('.eq("ok", true)');
  });

  it("does not refuse when it cannot tell", () => {
    // A read that fails is not evidence. Blocking a legitimate commit on a
    // lookup failure stops honest work to punish a case we did not observe.
    const fn = REG.slice(REG.indexOf("async function haltedInThisRun"));
    expect(fn.slice(0, fn.indexOf("\n}"))).toContain("if (error) return null;");
  });

  it("says what a halt MEANS when it refuses, not that a tool failed", () => {
    const said = refusalAfterHalt("there is no address summary component in this repository");
    expect(said).toContain("A halt is a conclusion about the work, not a pause");
    expect(said).toContain("there is no address summary component in this repository");
    // It leaves the seat able to act rather than merely forbidding.
    expect(said).toContain("say why it was wrong");
  });
});

describe("what the person is told", () => {
  it("holds waiting-on-a-person, because the next move is theirs", () => {
    // `produced-nothing` reads "the run worked and its output went nowhere",
    // which points at the crew. This seat did its job exactly right.
    expect(HALTED_BUILD_HOLD).toBe("waiting-on-a-person");
  });

  it("shows the SEAT's own sentence, not a template", () => {
    const line = haltedBuildLine("  there is no   address summary component here ");
    expect(line).toBe(
      "Build stopped and did not open anything: there is no address summary component here",
    );
  });

  it("says so plainly when the seat gave no reason", () => {
    expect(haltedBuildLine("   ")).toContain("gave no reason for it");
    expect(haltedBuildLine("")).not.toContain(":");
  });

  it("names every writing tool a halt must stop", () => {
    expect(WRITES_AFTER_A_HALT).toContain("studio.pr.open");
    expect(WRITES_AFTER_A_HALT).toContain("studio.pr.merge");
    expect(WRITES_AFTER_A_HALT).toContain("release.publish");
  });
});
