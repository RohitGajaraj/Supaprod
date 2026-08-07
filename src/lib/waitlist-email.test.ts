import { expect, test, describe, afterEach } from "bun:test";
import { a1Text, a1Html, A1_SUBJECT, sendWaitlistWelcome } from "./waitlist-email.server";

/**
 * A1 is the first email the company ever sends, from a domain with no sending
 * history. These tests guard the three properties that are cheap to break in a
 * later edit and expensive to discover in a spam folder: the single link, the
 * refusal to invent a launch date, and the promise that a send failure can
 * never cost us a signup.
 */
describe("A1 waitlist welcome", () => {
  const ORIGINAL = process.env.LAUNCH_DATE;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.LAUNCH_DATE;
    else process.env.LAUNCH_DATE = ORIGINAL;
  });

  test("carries exactly one link, the teardown", () => {
    // docs/growth/email-sequences.md section 7: "One naked URL per email,
    // matching the single CTA." A second link halves the first and reads as a
    // redirect chain to a filter that has no reputation history to weigh it
    // against. The footer's unsubscribe is a mailto, which is not a web link
    // and does not count against this.
    const urls = a1Text().match(/https?:\/\/[^\s)]+/g) ?? [];
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("/p/teardown");

    const hrefs = a1Html().match(/href="https?:[^"]+"/g) ?? [];
    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toContain("/p/teardown");
  });

  test("never invents a launch date when LAUNCH_DATE is unset", () => {
    // The canon genuinely disagrees with itself about the date and the sequence
    // file forbids resolving it here. The email must still send, so the date
    // sentence has a second form that promises nothing undecided.
    delete process.env.LAUNCH_DATE;
    const body = a1Text();
    expect(body).toContain("The moment a slot opens, you get an invite code");
    expect(body).not.toContain("We open ");
    // No month name may leak in from anywhere.
    expect(body).not.toMatch(
      /January|February|March|April|May|June|July|August|September|October|November|December/,
    );
  });

  test("uses the ratified sentence once a date is set, with no code change", () => {
    process.env.LAUNCH_DATE = "16 September";
    const body = a1Text();
    expect(body).toContain("We open 16 September. You get an invite code that morning");
    expect(body).not.toContain("The moment a slot opens");
  });

  test("greets correctly with no name, which is the only case we actually have", () => {
    // The waitlist form collects an email address and nothing else, so the
    // token is always empty in production. "Hi ," would be the tell that nobody
    // read the rendered output.
    expect(a1Text()).toStartWith("Hi,\n");
    expect(a1Text("Rohit")).toStartWith("Hi Rohit,\n");
  });

  test("reads completely with images off", () => {
    // Section 7: "No image-only email and no image-only CTA." A large share of
    // recipients see it this way and the CTA has to survive it.
    expect(a1Html()).not.toContain("<img");
  });

  test("subject matches the ratified line", () => {
    expect(A1_SUBJECT).toBe("You are in. Well, in line.");
  });

  test("never throws, so a dead vendor cannot cost us a signup", async () => {
    // Called from inside joinWaitlist. Losing a genuine signup is the one
    // unrecoverable outcome on that path: the person does not come back and we
    // never learn we lost them. A missing welcome is merely bad.
    await expect(sendWaitlistWelcome("someone@example.com")).resolves.toBeUndefined();
    await expect(sendWaitlistWelcome("not-an-email")).resolves.toBeUndefined();
  });
});
