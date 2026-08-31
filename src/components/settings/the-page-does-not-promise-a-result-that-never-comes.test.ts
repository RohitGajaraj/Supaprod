import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE NOTIFICATIONS PAGE PROMISED A RESULT THAT NINE PIECES OF WORK IN TEN NEVER
 * PRODUCE.
 *
 * WHAT IT SAID, to all sixteen profiles, on a default only one of them has a row
 * for:
 *
 *   "Work that finishes while you are away also emails you what came of it."
 *   "The result finds you, even with the tab closed."
 *
 * WHY THAT IS A CLAIM AND NOT A ROUGH EDGE. The send behind it is real:
 * `dispatchVerdictEmail` is wired, awaited, and called from the agent path at
 * `src/lib/ai/tools/registry.server.ts`. It fires when work reaches a VERDICT.
 * Measured on the live database 2026-08-31 through `query_database`:
 *
 *   spine_tracks                                        106
 *   ... carrying a hold                                  97
 *   ... reached station 'learn'                           2
 *   ... hold is in TERMINAL_HOLDS (sweep refuses by design) 42
 *   learnings written since the trigger shipped 2026-08-26  0
 *   newest learnings row                  2026-08-25 19:40 UTC
 *
 * The newest verdict in the database PREDATES ITS OWN TRIGGER, so the email has
 * fired zero times ever, and 42 of the 97 holds are ones nothing can arrive to
 * clear, so those tracks will never produce the verdict it needs. F-84 named
 * this and the wording was lost in the handoff: gap #2 is "nothing reaches a
 * person who left the page", and the built half covers the rarer case.
 *
 * WHAT CHANGED, AND WHAT DELIBERATELY DID NOT. Standard #7 takes the claim
 * rather than the feature: the toggle is correct about its own mechanism and
 * stayed. The two sentences that overstated its reach are gone, and a second
 * line states what is not covered and links to Today, which lists held work
 * (`src/components/today/tracks-feed.ts`) -- R-20 section 6 forbids saying
 * "nothing tells you" and stopping there.
 *
 * WHY THIS TEST IS SOURCE-TEXT AND NOT A RENDER. The defect is a sentence, and a
 * sentence is exactly what a later editor restores while every render assertion
 * still passes. This is a ratchet against the wording, in the same form as
 * `a-mockup-is-not-a-prototype.test.ts`.
 *
 * WHEN THIS TEST SHOULD BE DELETED: when the stopped-work send exists
 * (`coordination/requests/S3/the-work-that-stopped-reaches-nobody.md`), the
 * second line becomes false in the other direction and the whole region needs
 * rewriting. Delete it then, in that commit, rather than loosening it now.
 */

const FILE = join(import.meta.dir, "NotificationsSection.tsx");
const SRC = readFileSync(FILE, "utf8");

/**
 * The comment block above quotes the retired sentences on purpose, and a naive
 * `SRC.includes(...)` would therefore match this file's own header if it ever
 * moved in here. Everything below reads only the code, with block comments
 * stripped, so a quotation can never satisfy or break an assertion.
 */
/* F-159 corollary: a JSX comment comes out WITH its braces. Stripping the
   block form alone leaves `{` and `}` behind, and a comment above a
   protected line then puts a brace between a `>` and the word a matcher
   wants. That silently disabled this lane's rename guard until a mutation
   test caught it, so every guard here strips the JSX form first. */
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("the notifications page does not promise a result that never comes", () => {
  it("has retired the two sentences that overstated the send's reach", () => {
    for (const retired of [
      "Work that finishes while you are away also emails you what came of it",
      "The result finds you, even with the tab closed",
    ]) {
      expect(CODE).not.toContain(retired);
    }
  });

  it("still offers the verdict toggle, because the mechanism was never the defect", () => {
    expect(CODE).toContain("Email me what came of it");
    expect(CODE).toContain("setVerdictEmail(next)");
  });

  it("names the case the send does not cover", () => {
    expect(CODE).toContain("Work that stops early does not reach you yet");
  });

  it("gives that case somewhere to go, which R-20 section 6 requires", () => {
    const line = CODE.slice(CODE.indexOf("Work that stops early does not reach you yet"));
    expect(line).toContain('to="/today"');
  });

  /**
   * A count rendered on a surface is measured once and read forever. This repo
   * has paid for that: every document quoting "73 tracks, 71 entered at sense"
   * was stale within days. The measurement belongs in the comment above and in
   * `docs/lanes/log/S3.md`, where it carries its date.
   */
  it("renders no measured count in the copy", () => {
    const region = CODE.slice(
      CODE.indexOf('title="When work finishes"'),
      CODE.indexOf('<Region title="The digest">'),
    );
    expect(region.length).toBeGreaterThan(0);
    expect(region).not.toMatch(/\b(97|106|42|46%|9 (out )?of 10)\b/);
  });
});
