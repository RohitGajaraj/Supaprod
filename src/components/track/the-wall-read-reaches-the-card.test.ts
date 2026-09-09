/**
 * A SENTENCE THAT CANNOT RENDER IS NOT A FEATURE, AND THIS REPO HAS SHIPPED
 * THREE OF THEM.
 *
 * `run-now.ts` held three verdict lines behind `input.verdict ? ... : null`
 * while `TrackRun` passed `verdict: null` as a literal -- not one had ever
 * rendered. The Inbox's settled line held ten past-tense sentences behind a
 * `??` on a field that is never null. Same shape both times: somebody wrote the
 * right words, the wire was never connected, and nothing failed. **A hard-coded
 * null is worse than a missing argument, because the compiler is satisfied and
 * the reader of the call site sees a decision.**
 *
 * `alsoBehindIt` now takes a wall and subtracts one the account has since
 * fixed. Every one of its branches is unit-tested and every one of them is
 * unreachable if the wall never arrives -- so what is pinned here is the WIRE,
 * end to end, which no test of either end can see.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/** A source guard scoring the prose that explains it is the standing trap. */
const codeOnly = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const READ = codeOnly(readFileSync("src/lib/workspace-setup.functions.ts", "utf8"));
const CARD = codeOnly(readFileSync("src/components/track/TrackRun.tsx", "utf8"));

describe("the read actually asks for the wall", () => {
  it("calls the one shared reader of halted_reason, and not a second one", () => {
    expect(READ).toContain("wallsByTrack");
    /* A second reader of that column is the defect Lane 1's module exists to
       prevent: two surfaces answering one question and drifting between
       deploys. So this file must not query the halts itself. */
    expect(READ).not.toContain("halted_reason");
  });

  it("and returns it on the shape the card reads", () => {
    expect(READ).toMatch(/wall:/);
    expect(READ).toContain("data.trackId");
  });
});

describe("and the card actually passes it", () => {
  it("hands the wall to alsoBehindIt rather than calling it bare", () => {
    /*
     * THE WHOLE POINT. `alsoBehindIt(blocker)` compiles, renders, and silently
     * never subtracts anything -- which is exactly how the verdict lines sat
     * dead for a month.
     */
    expect(CARD).toMatch(/alsoBehindIt\(\s*blocker\s*,/);
    expect(CARD).not.toMatch(/alsoBehindIt\(\s*blocker\s*\)/);
  });

  it("and asks for it with the run's own id", () => {
    expect(CARD).toMatch(/trackId,/);
  });

  it("with trackId in the CACHE KEY, not only in the arguments", () => {
    /*
     * The answer is per-run twice over -- which run to leave out of the peer
     * count, and whose wall to read -- so a key without it serves one run's
     * answer to another. The file's own note makes this argument for the
     * station and the id was a line below it.
     */
    const at = CARD.indexOf('queryKey: ["workspace-setup"');
    expect(at).toBeGreaterThan(-1);
    const key = CARD.slice(at, CARD.indexOf("]", at));
    expect(key).toContain("trackId");
    /* The mirror: every assertion here passes by finding something in a slice,
       so a slice that collapsed would fail loudly rather than quietly. */
    expect(key.length).toBeGreaterThan(30);
  });
});
