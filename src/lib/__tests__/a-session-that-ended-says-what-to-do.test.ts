/**
 * "UNAUTHORIZED: INVALID TOKEN" WAS BEING READ BY PEOPLE.
 *
 * `requireSupabaseAuth` throws that string and six siblings. Surfaces render a
 * thrown message straight into their failure copy, so it appeared on Brain,
 * Learn, Guardrails and Settings, spliced mid-sentence into prose written to a
 * much higher standard (found by S4, signed in against a dead database).
 *
 * Nobody outside this repo can act on "Invalid token", and the one thing the
 * reader needs to do -- sign in again -- was not in the sentence.
 *
 * It is deliberately NOT in RAW_DATABASE_FINGERPRINTS. That list means "the
 * database wrote this, show the generic fallback", and an ended session has a
 * better answer than the generic one.
 */
import { describe, it, expect } from "bun:test";
import { sessionEndedMessage, humanWriteError, readFailureMessage } from "@/lib/roles.functions";

const ENDED = "Your session ended. Sign in again and this will load.";

describe("a session that ended says what to do about it", () => {
  it("catches every string the auth middleware actually throws", () => {
    // Copied from integrations/supabase/auth-middleware.ts, which is the only
    // thing that throws them.
    for (const thrown of [
      "Unauthorized: Invalid token",
      "Unauthorized: No token provided",
      "Unauthorized: No request headers available",
      "Unauthorized: No authorization header provided",
      "Unauthorized: Only Bearer tokens are supported",
      "Unauthorized: No user ID found in token",
    ]) {
      expect(sessionEndedMessage(new Error(thrown))).toBe(ENDED);
    }
  });

  it("leaves everything else alone, so it cannot swallow a real reason", () => {
    expect(sessionEndedMessage(new Error("The suite could not run."))).toBeNull();
    expect(sessionEndedMessage(null)).toBeNull();
    expect(sessionEndedMessage(new Error("   "))).toBeNull();
  });

  it("outranks the generic fallback rather than being hidden behind it", () => {
    expect(humanWriteError(new Error("Unauthorized: Invalid token"), "generic")).toBe(ENDED);
    expect(readFailureMessage(new Error("Unauthorized: Invalid token"))).toBe(ENDED);
  });

  it("still hides what the database wrote, which was the original job", () => {
    expect(
      humanWriteError(new Error("new row violates row-level security policy"), "generic"),
    ).toBe("generic");
  });

  it("a failed read with no message still says something", () => {
    // A Failed block with nothing in it reads as "it worked".
    expect(readFailureMessage(new Error(""))).toBe("The read failed.");
  });
});
