/**
 * WHEN THE SERVER WROTE A SENTENCE FOR A PERSON, THE SURFACE SAYS IT.
 *
 * ── MEASURED ON THE RUNNING PRODUCT, 2026-09-01 ───────────────────────────
 * `getFocusNext` returned **HTTP 200** carrying:
 *
 *   "AI rate limit reached. Try again in a moment."
 *
 * and the board rendered *"The brain did not answer, so there is no read on what
 * to build next. This is a failed look-up, not a quiet morning."* — **a vaguer
 * sentence than the one it was handed, and one with no next action in it**,
 * fourth from the top of the only signed-in home.
 *
 * R-20 §3: *every failure names the thing that failed and the next action.* The
 * next action was already in the payload. Transient rate limiting is precisely
 * the case where *"try again in a moment"* is true and *"the brain did not
 * answer"* invites a person to conclude the brain is broken.
 *
 * ── WHY `reasonLine` AND NOT `failureLine`, WHICH IS DOCTRINE NOT TASTE ───
 * `error-copy.ts` states it: *"`failureLine` where the line stands alone and
 * nothing else will say it, `reasonLine` where a wrapper will."* This renders
 * INSIDE `ReadFailed`, whose `wayOut` already supplies the ended-session
 * sentence — and `failureLine` there printed that sentence **twice in one box at
 * nine sites** the day `error` was passed everywhere.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { messageForPerson, reasonLine } from "@/lib/error-copy";

const SRC = readFileSync("src/components/today/FocusNext.tsx", "utf8");
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");

describe("the failed Director's read carries the server's own reason", () => {
  it("composes with reasonLine rather than a fixed sentence", () => {
    expect(code).toContain("reasonLine(");
  });

  it("uses reasonLine, NOT failureLine, because a wrapper already speaks", () => {
    /* Inside ReadFailed, failureLine would print the ended-session sentence
       twice in one box. That is not a style call - it is the defect error-copy
       records at nine sites. */
    expect(code).not.toContain("failureLine(");
  });

  it("still keeps its own sentence, so the fix is not a deletion", () => {
    expect(code).toContain("The brain did not answer");
  });

  it("and the real message survives the humanizer, which is the whole point", () => {
    /*
     * The exact string the live server returned. `messageForPerson` refuses
     * machine text - codes, uuids, snake_case, SCREAMING_SNAKE, stack frames,
     * JSON bodies, anything over 200 chars - so a fix that appends "the server's
     * message" is worthless if the message it appends is filtered out. Pinned
     * with the real sentence rather than a friendly invented one, because a
     * fixture I write cannot tell me whether the real payload survives.
     */
    const real = "AI rate limit reached. Try again in a moment.";
    expect(messageForPerson(new Error(real))).toBe(real);
    expect(reasonLine("The brain did not answer.", new Error(real))).toBe(
      `The brain did not answer. ${real}`,
    );
  });

  it("adds nothing when the server wrote machine text", () => {
    /* The other half: a raw error must NOT reach a person, so the surface's own
       sentence stands alone rather than growing a database string. */
    const machine = new Error('null value in column "to_agent_slug" violates not-null constraint');
    expect(messageForPerson(machine)).toBeNull();
    expect(reasonLine("The brain did not answer.", machine)).toBe("The brain did not answer.");
  });
});
