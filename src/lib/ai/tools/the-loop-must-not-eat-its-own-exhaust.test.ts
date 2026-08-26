/**
 * The evidence table was majority the loop's own reports of failure.
 *
 * `signals.log` named three good examples and forbade nothing. So a station that
 * searched and found nothing filed THAT — *"No signals found for X"*, *"Zero
 * active scout targets detected"*, *"This absence has been logged as a note"* —
 * because it had somewhere to write and wanted to show its work.
 *
 * MEASURED 2026-08-25 in the live workspace `0b792d52`, mid-run:
 *
 *   SELECT count(*) FILTER (WHERE source='agent') AS agent_authored,
 *          count(*) AS total
 *     FROM signals WHERE workspace_id = '0b792d52-…';
 *   -- 54 | 75
 *
 * **Fifty-four of seventy-five signals were written by agents**, and at least
 * sixteen are explicitly about absence rather than about the product. Every
 * later Discover run reads them as evidence, which makes it self-reinforcing:
 * the more the loop fails to find something, the more absence it writes, the
 * more the next search returns absence, the harder the real customer voice is to
 * see. In that workspace one genuine Canny request sat under fifty-two notes
 * saying nothing had been found.
 *
 * FILING NOTHING IS THE CORRECT OUTCOME when there is nothing. The loop already
 * handles it: `produced-nothing`, then `needs-evidence`, whose sentence is a
 * true thing a person can act on. **An absence note is a station dodging that
 * outcome by writing a row, and the row is worse than the hold it avoided.**
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const SRC = readFileSync(fileURLToPath(new URL("./registry.server.ts", import.meta.url)), "utf8");
const TOOL = (() => {
  const at = SRC.indexOf('name: "signals.log"');
  return SRC.slice(at, SRC.indexOf("argsSchema", at));
})();
/** The description string the model actually reads, without the comment above it. */
const DESCRIPTION = TOOL.slice(TOOL.indexOf("description:"));

describe("the tool tells the agent what NOT to file", () => {
  /**
   * The prohibition has to be in the DESCRIPTION and not only in a comment,
   * because the description is the half the model sees. A rule the agent cannot
   * read is a rule for the next human reader, which is not who was filing these.
   */
  it("forbids absence in the text the model is given", () => {
    expect(DESCRIPTION).toContain("NEVER log the absence of evidence");
  });

  it("names the exact shapes that were being filed", () => {
    expect(DESCRIPTION).toContain("No signals found");
    expect(DESCRIPTION).toContain("zero results");
  });

  /**
   * Telling an agent not to do something without telling it what to do instead
   * is how you get the same behaviour wearing a different title. The
   * description has to say where the observation belongs.
   */
  it("says where the observation goes instead", () => {
    expect(DESCRIPTION).toContain("say so in your answer instead");
  });

  /**
   * And it has to make filing nothing legitimate, or a station under pressure to
   * produce will produce something. `produced-nothing` is a designed outcome
   * with a designed follow-up, not a failure to be avoided.
   */
  it("makes finding nothing an expected outcome rather than a failure", () => {
    expect(DESCRIPTION).toContain("correct, expected outcome");
  });

  /** The original purpose survives: it is still the tool for real evidence. */
  it("still asks for evidence that exists, from outside the loop", () => {
    /*
     * WIDENED 2026-08-27, and the assertion had to widen with it. This read
     * `toContain("interview quote")`, pinning a definition whose examples were
     * all verbatim human utterances. Three Discover agents concluded from it
     * that a session replay and a 41% abandonment measurement are not signals,
     * found the evidence, refused it, and filed nothing across twelve drives in
     * a workspace holding 258 signals.
     *
     * What this rule actually protects is unchanged and asserted below: do not
     * file the ABSENCE of evidence, and do not cite the product's own work.
     * Neither of those excludes observed behaviour.
     */
    expect(DESCRIPTION).toContain("evidence that EXISTS");
    expect(DESCRIPTION).toContain("interview");
    expect(DESCRIPTION).toContain("came from outside this product");
  });
});

describe("the measurement stays with the rule", () => {
  it("records what was actually in the table", () => {
    const prose = TOOL.replace(/\n\s*\*\s?/g, " ").replace(/\s+/g, " ");
    expect(prose).toContain("54 of 75 agent-authored");
  });
});
