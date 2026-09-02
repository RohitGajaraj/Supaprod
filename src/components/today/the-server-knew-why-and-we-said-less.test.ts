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
import { messageForPerson, reasonLine } from "@/lib/error-copy";

// "composes with reasonLine rather than a fixed sentence", "uses reasonLine,
// NOT failureLine" and "still keeps its own sentence" left this describe
// block (P-14, A-QUEUE.md): all three checked `components/today/FocusNext.tsx`'s
// own source, and that component was unmounted (zero importers, its only
// caller `components/today/Board.tsx` deleted with it) and deleted. What
// remains is genuinely about `error-copy.ts` itself, which stays live
// (36 other importers).
describe("the failed Director's read carries the server's own reason", () => {
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
