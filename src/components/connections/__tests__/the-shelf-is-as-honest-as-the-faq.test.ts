/**
 * THE PUBLIC FAQ WAS MORE HONEST THAN THE PAGE WHERE YOU PRESS CONNECT.
 *
 * Three providers in the registry point at the shared stub rather than a real
 * adapter: they complete OAuth and return no signals. U-034 made the FAQ derive
 * that list from `PROVIDERS_WITHOUT_ADAPTERS` so a buyer reading marketing is
 * told the truth.
 *
 * The connections shelf said nothing. Worse, the detail view one click from the
 * OAuth grant promised "Connect it once and what it syncs starts feeding the
 * shared brain" -- the strongest claim on the surface, false for exactly those
 * three, made at the moment a person is about to hand over access to their
 * calendar.
 *
 * So we were more honest to a stranger than to a customer, which is backwards.
 *
 * This asserts the shelf reads the SAME export the FAQ reads. Deriving it twice
 * would move the drift rather than remove it, which is the argument the U-034
 * test makes at length about a second hand-maintained list.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { providerReturnsSignals, PROVIDERS_WITHOUT_ADAPTERS } from "@/lib/connectors/registry";

const shelf = readFileSync(join(import.meta.dir, "..", "AccountConnectionsSection.tsx"), "utf8");

describe("the shelf is as honest as the FAQ", () => {
  it("the rule has subjects, so this cannot pass by being vacuous", () => {
    expect(PROVIDERS_WITHOUT_ADAPTERS.length).toBeGreaterThan(0);
    for (const id of PROVIDERS_WITHOUT_ADAPTERS) expect(providerReturnsSignals(id)).toBe(false);
  });

  it("the shelf reads the adapter truth rather than keeping its own list", () => {
    expect(shelf).toContain("providerReturnsSignals");
    for (const id of PROVIDERS_WITHOUT_ADAPTERS) {
      expect(shelf).not.toContain(`"${id}"`);
    }
  });

  it("the feeds-the-brain promise is conditional, not unconditional", () => {
    const claim = "starts feeding the shared brain";
    expect(shelf).toContain(claim);
    /*
     * `lastIndexOf`, because the FIRST occurrence is the comment that explains
     * this rule. The first version of this test read that comment, found no
     * guard in front of it and failed -- a guard tripping over its own
     * documentation, which is a false negative and would have been "fixed" by
     * deleting the explanation.
     */
    const at = shelf.lastIndexOf(claim);
    const before = shelf.slice(Math.max(0, at - 400), at);
    expect(before).toContain("providerReturnsSignals(provider)");
  });
});
