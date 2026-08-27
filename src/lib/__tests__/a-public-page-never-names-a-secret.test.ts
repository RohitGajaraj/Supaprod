/**
 * THE PUBLIC /proof PAGE NAMED ONE OF OUR SECRETS TO ANY VISITOR.
 *
 * Rendered against a build with no service-role key, the app-wide route error
 * boundary printed, verbatim:
 *
 *   "Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY.
 *    Connect Supabase in Lovable Cloud."
 *
 * On the page whose entire subject is whether this product can be trusted. It
 * names a secret by variable and instructs a stranger to go and fix our vendor
 * console.
 *
 * It defeated every existing shape test, and that is the interesting part: four
 * or more words, no uuid, no lowercase snake_case, no call fragment, and it
 * ends in a full stop -- because a CONFIGURATION error is written as a
 * sentence, for an operator. Prose-shaped and not for this reader.
 *
 * Two things hold it shut and both are asserted here: the shape test refuses a
 * SCREAMING_SNAKE token, and the boundary asks before it renders.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { messageForPerson } from "@/lib/error-copy";

const THE_LEAK =
  "Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY. Connect Supabase in Lovable Cloud.";

describe("a public page never names a secret", () => {
  it("refuses the exact string that reached /proof", () => {
    expect(messageForPerson(new Error(THE_LEAK))).toBeNull();
  });

  it("refuses any environment variable named in an error", () => {
    for (const s of [
      "Missing STRIPE_SECRET_KEY. Set it and redeploy.",
      "RESEND_API_KEY is not configured for this environment.",
      "Check DATABASE_URL and try again.",
    ]) {
      expect(messageForPerson(new Error(s))).toBeNull();
    }
  });

  it("still keeps the sentences our server functions write for people", () => {
    // The rule must not be a blunt instrument: this copy is deliberate and is
    // some of the best failure writing in the product.
    for (const s of [
      "That step is ahead of this work, and undo only goes back.",
      "This is still waiting for you.",
      "Production is still running what it was.",
    ]) {
      expect(messageForPerson(new Error(s))).toBe(s);
    }
  });

  it("the route boundary asks before it renders, rather than printing what was thrown", () => {
    const router = readFileSync(join(import.meta.dir, "..", "..", "router.tsx"), "utf8");
    expect(router).toContain("messageForPerson(error)");
    // The defect was `error.message` going straight into the paragraph.
    expect(router).not.toContain("? error.message");
  });
});
