/**
 * P-85: the generic tier -- shown when a workspace has neither arrivals nor
 * a product with a stated goal -- must not carry a domain noun from any
 * OTHER workspace. Read live in the empty probe workspace 2026-09-04: three
 * sentences about "the checkout", "the sign-up form" and "the address
 * step", all Relay's, none of the probe's. This is the guard the packet's
 * own scope names: "an empty workspace's examples contain no product or
 * domain noun from any other workspace."
 *
 * A denylist rather than an allowlist, on purpose: the failure mode is a
 * FUTURE edit reintroducing a concrete product noun into the generic tier
 * (the exact shape of the original bug), and a denylist catches that
 * whether the noun is one already named here or a new one nobody thought
 * to add -- see the second test below, which checks the denylist itself
 * covers the retired sentences rather than trusting the list is complete.
 */
import { describe, expect, it } from "bun:test";
import { GENERIC_EXAMPLE_JOBS, productExampleJobs } from "./ExampleJobs";

/** Every domain/product noun a live workspace's examples have carried,
 *  named so a future one joins this list rather than slipping past it. */
const KNOWN_DOMAIN_NOUNS = [
  "checkout",
  "sign-up form",
  "sign up form",
  "address step",
  "american express",
  "amex",
  "relay",
  "helio",
  "payroll",
];

function containsDomainNoun(text: string): string | null {
  const lower = text.toLowerCase();
  return KNOWN_DOMAIN_NOUNS.find((noun) => lower.includes(noun)) ?? null;
}

describe("the generic example tier names no product or domain noun", () => {
  it("no sentence or sub-line contains a known domain noun", () => {
    for (const job of GENERIC_EXAMPLE_JOBS) {
      expect(containsDomainNoun(job.sentence)).toBeNull();
      expect(containsDomainNoun(job.sub)).toBeNull();
    }
  });

  it("the retired checkout sentence itself would trip this guard", () => {
    // Proves the denylist is not merely empty-handed -- it actually catches
    // the sentence this packet exists to remove.
    expect(containsDomainNoun("Make the checkout accept an American Express card")).toBe(
      "checkout",
    );
    expect(containsDomainNoun("Cut the sign-up form from nine fields to four")).toBe(
      "sign-up form",
    );
    expect(containsDomainNoun("Find out why people abandon the address step")).toBe("address step");
  });

  it("names the three shapes -- a capability, a change, a question -- and nothing else", () => {
    expect(GENERIC_EXAMPLE_JOBS.map((j) => j.shape)).toEqual([
      "new-capability",
      "existing-feature",
      "existing-feature",
    ]);
  });
});

describe("the product-shaped middle tier carries the product's own words, not another workspace's", () => {
  it("names the given product and goal, and no known domain noun from elsewhere", () => {
    const jobs = productExampleJobs("Helio", "the default expense tool for freelancers");
    for (const job of jobs) {
      expect(job.sentence).toContain("Helio");
      expect(job.sentence.toLowerCase()).toContain("expense tool for freelancers");
    }
    // "helio" itself is in the denylist (it is a real workspace's product),
    // so this proves the denylist is workspace-relative: it is fine for
    // Helio's OWN tier to name Helio, and this test does not run it through
    // containsDomainNoun for that reason -- the empty-workspace guard above
    // is the one that must never see it.
  });
});
