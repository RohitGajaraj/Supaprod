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

  test("carries exactly one link, and it is not a redirect", () => {
    // docs/growth/email-sequences.md section 7: "One naked URL per email,
    // matching the single CTA." A second link halves the first and reads as a
    // redirect chain to a filter that has no reputation history to weigh it
    // against. The footer's unsubscribe is a mailto, which is not a web link
    // and does not count against this.
    //
    // THE DESTINATION CHANGED ON 2026-08-22: it was /p/teardown until the
    // public teardown was retired. /p/teardown still resolves, as a permanent
    // redirect, which is precisely why this test now asserts it is ABSENT
    // rather than just asserting the new path. A cold sending domain whose
    // first-ever email links through a redirect is a spam signal, and the
    // failure would have been invisible: the link would still work.
    const urls = a1Text().match(/https?:\/\/[^\s)]+/g) ?? [];
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("/demo");
    expect(urls[0]).not.toContain("/p/teardown");

    const hrefs = a1Html().match(/href="https?:[^"]+"/g) ?? [];
    expect(hrefs).toHaveLength(1);
    expect(hrefs[0]).toContain("/demo");
    expect(hrefs[0]).not.toContain("/p/teardown");
  });

  test("never invents a launch date when LAUNCH_DATE is unset", () => {
    // The canon genuinely disagrees with itself about the date and the sequence
    // file forbids resolving it here. The email must still send, so the date
    // sentence has a second form that promises nothing undecided.
    delete process.env.LAUNCH_DATE;
    const body = a1Text();
    expect(body).toContain("your code comes with your name on it");
    expect(body).not.toContain("We open ");
    // No month name may leak in from anywhere.
    expect(body).not.toMatch(
      /January|February|March|April|May|June|July|August|September|October|November|December/,
    );
  });

  test("uses the ratified sentence once a date is set, with no code change", () => {
    process.env.LAUNCH_DATE = "16 September";
    const body = a1Text();
    expect(body).toContain("We open 16 September, and your code arrives that morning");
    expect(body).toContain("16 September");
  });

  test("greets correctly with no name, which is the only case we actually have", () => {
    // The waitlist form collects an email address and nothing else, so the
    // token is always empty in production. "Hi ," would be the tell that nobody
    // read the rendered output.
    expect(a1Text()).toStartWith("Hey,\n");
    expect(a1Text("Rohit")).toStartWith("Hey Rohit,\n");
  });

  test("reads completely with images off", () => {
    // Section 7: "No image-only email and no image-only CTA." A large share of
    // recipients read with remote images blocked and Gmail proxies the rest.
    //
    // THIS USED TO ASSERT `not.toContain("<img")`, which was stricter than the
    // rule it was defending and failed the moment a branded header landed. The
    // invariant is not "no images", it is that nothing a reader NEEDS lives in
    // one. So: every image must carry real alt text, and no image may be the
    // clickable content of the CTA.
    const html = a1Html();
    const imgs = html.match(/<img[^>]*>/g) ?? [];
    for (const img of imgs) {
      expect(img).toMatch(/alt="[^"]+"/);
    }
    // The CTA is a text link, not a wrapped image. Matched by SHAPE (the one
    // non-mailto anchor) rather than by the destination path: pinning the path
    // here is what let this assertion keep passing against /p/teardown after
    // the CTA above had already moved off it.
    const cta = /<a href="https?:[^"]*"[^>]*>([\s\S]*?)<\/a>/.exec(html);
    expect(cta).not.toBeNull();
    expect(cta?.[1]).not.toContain("<img");
    expect(cta?.[1].replace(/<[^>]*>/g, "").trim().length).toBeGreaterThan(0);
    // The plain-text part can carry no image at all, by construction.
    expect(a1Text()).not.toContain("<img");
  });

  test("subject matches the ratified line", () => {
    expect(A1_SUBJECT).toBe("You are on the list");
  });

  test("never throws, so a dead vendor cannot cost us a signup", async () => {
    // Called from inside joinWaitlist. Losing a genuine signup is the one
    // unrecoverable outcome on that path: the person does not come back and we
    // never learn we lost them. A missing welcome is merely bad.
    await expect(sendWaitlistWelcome("someone@example.com")).resolves.toBeUndefined();
    await expect(sendWaitlistWelcome("not-an-email")).resolves.toBeUndefined();
  });
});
