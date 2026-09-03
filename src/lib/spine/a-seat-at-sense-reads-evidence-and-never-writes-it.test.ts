/**
 * ── THE RUN WAS CARRIED ON EVIDENCE THE RUN HAD JUST WRITTEN ──────────────
 *
 * R-37 / P-41. On the founder's own run at 14:41 IST the Researcher called
 * `signals.log` twice and wrote two rows into Helio Labs (`source: "agent"`,
 * `source_kind: "manual"`, no product) restating a theme that was already
 * there, having read nothing outside the workspace. Confirmed on the record at
 * 14:50: those two rows were the track's ONLY Sense members, and the sweep
 * advanced it to Decide on them, while Customer Insights, reading them by id,
 * still reported there was no evidence for the sentence.
 *
 * The product's whole claim is that evidence is provable. This is the one
 * defect that breaks it.
 *
 * WHY A REFUSAL AND NOT A SMALLER TOOL KIT. R-37 asks for `signals.log` to leave
 * every Sense seat's kit while ingest paths keep it "with a source id required
 * on the row". There is no per-seat kit in this product: `loop.server.ts` builds
 * the list from the whole registry and the only per-agent filter is a risk cap.
 * So both halves are one rule -- a caller that can name an outside source keeps
 * the tool, a caller that cannot is refused -- and it holds for seats nobody has
 * written yet, which a hand-maintained kit would not.
 *
 * The description had already asked for this and asking was not enough: the same
 * disease was measured a week earlier at 54 of 75 rows agent-authored.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const REGISTRY = strip(readFileSync("src/lib/ai/tools/registry.server.ts", "utf8"));
const RULE = readFileSync("src/lib/sources/the-loop-does-not-count-its-own-writing.ts", "utf8");
const DISCOVERY = strip(readFileSync("src/lib/discovery.functions.ts", "utf8"));
const PURE = strip(readFileSync("src/lib/spine/driver.ts", "utf8"));

/** `signals.log`'s own body, bounded at the next tool. */
const LOG_TOOL = REGISTRY.slice(
  REGISTRY.indexOf('name: "signals.log"'),
  REGISTRY.indexOf("const senseFoundNothing"),
);

describe("a seat that read nothing outside cannot write a signal", () => {
  it("refuses a row that names no source", () => {
    const flat = LOG_TOOL.replace(/\s+/g, " ");
    expect(flat).toContain('const named = (a.source ?? "").trim();');
    expect(flat).toContain('if (!named || named.toLowerCase() === "agent")');
  });

  it("no longer defaults the source to the loop itself", () => {
    // `source: a.source ?? "agent"` is what produced both rows on the honest
    // run. A default here would quietly restore the hole the refusal closes.
    expect(LOG_TOOL).not.toContain('a.source ?? "agent"');
    expect(LOG_TOOL.replace(/\s+/g, " ")).toContain("source: named,");
  });

  it("the refusal names where the work goes instead", () => {
    // A refusal with no door is how a seat starts inventing one. Both honest
    // endings are named: group what is already there, or say nothing is here.
    expect(LOG_TOOL).toContain("cluster.trigger or research.synthesize");
    expect(LOG_TOOL).toContain("sense.found_nothing");
  });
});

describe("an evidence reader does not count the loop's own writing", () => {
  it("has the rule in one place, not spelled per reader", () => {
    expect(RULE).toContain("export function excludeLoopAuthored");
    expect(RULE).toContain('export const LOOP_AUTHORED_SOURCE = "agent"');
  });

  it("excludes on source and never on source_kind", () => {
    /*
     * `source_kind: "manual"` is shared with rows a PERSON pasted in by hand,
     * which are real evidence and the most valuable kind in a young workspace.
     * Excluding on it would delete the customer's own voice from the count.
     */
    expect(RULE).toContain('q.neq("source", LOOP_AUTHORED_SOURCE)');
    expect(RULE).not.toContain('neq("source_kind"');
  });

  it("getSenseCoverage applies it, which is what the Arriving line reads", () => {
    expect(DISCOVERY.replace(/\s+/g, " ")).toContain("excludeLoopAuthored(");
  });
});

describe("a decision made with no findings says so", () => {
  /**
   * A1 caught this missing from P-40: the driver wrote the hold and nothing read
   * it, so the decision Decide made carried no footing and Learn would have
   * graded a call that looked evidence-backed against a record that had none.
   */
  it("Decide is told to record the footing, and only Decide", () => {
    const flat = PURE.replace(/\s+/g, " ");
    expect(flat).toContain('carriedOnTheSentence && station === "decide"');
    expect(flat).toContain("evidence: the person's sentence, no findings");
  });

  it("tells it not to go looking for our own writing to stand on", () => {
    // The failure mode this invites is the one P-41 exists for: a seat with no
    // findings reaching for something, anything, to cite.
    expect(PURE).toContain("Do not describe it as evidence-backed");
    expect(PURE).toContain("do not go looking for our own writing to stand on");
  });

  it("rides with the filing instruction, because it is one", () => {
    expect(PURE.replace(/\s+/g, " ")).toContain(
      'const file = [FILE_IT[station], seat?.file?.trim(), footing].filter(Boolean).join(" ");',
    );
  });
});
