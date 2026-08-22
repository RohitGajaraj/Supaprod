import { describe, expect, test } from "bun:test";
import { asPlainText } from "./TeardownReceipt";
import type { Teardown } from "@/lib/ai/public-teardown.server";

// The teardown is the most shareable artifact the product makes and until
// 2026-08-05 it had no way off the screen: a decision gets a public /d/<slug>,
// a teardown got nothing. It copies rather than minting a link because the page
// promises "Nothing is stored to an account until you make one" and the API
// keeps that promise by persisting nothing. These pin the copied format, since
// it is what lands in someone else's Slack.

const full: Teardown = {
  verdict: "risky as written",
  headline: "The problem and proposed solution are too loosely defined to justify building.",
  risks: ["PMs may already have sufficient signal access, making the digest redundant."],
  gaps: ["No evidence is provided that PMs are currently missing customer signals."],
  recommendation: "Conduct qualitative research with PMs before building.",
  confidence: 0.7,
};

describe("asPlainText", () => {
  test("leads with the verdict, so a reader skimming a channel gets the judgment first", () => {
    expect(asPlainText(full).split("\n")[0]).toBe("SUPAPROD CRITIC / RISKY AS WRITTEN");
  });

  test("carries the headline, both lists and the recommendation", () => {
    const out = asPlainText(full);
    expect(out).toContain(full.headline);
    expect(out).toContain("- PMs may already have sufficient signal access");
    expect(out).toContain("WHAT YOU CANNOT PROVE YET");
    expect(out).toContain("Conduct qualitative research");
  });

  test("ends with an attributed link, because this is the growth loop", () => {
    expect(asPlainText(full).trimEnd().endsWith("https://supaprod.ai")).toBe(true);
    // Pinned NEGATIVELY too: the retired teardown URL must never come back
    // here. This string reaches a clipboard from the authenticated onboarding
    // surface, not just from a public page.
    expect(asPlainText(full)).not.toContain("/p/teardown");
  });

  test("drops empty sections rather than printing a bare heading", () => {
    const thin: Teardown = { ...full, risks: [], gaps: [], recommendation: "" };
    const out = asPlainText(thin);
    expect(out).not.toContain("RISKS");
    expect(out).not.toContain("WHAT YOU CANNOT PROVE YET");
    expect(out).not.toContain("RECOMMENDATION");
    // The verdict and headline still survive, so a thin teardown is still shareable.
    expect(out).toContain(full.headline);
  });
});
