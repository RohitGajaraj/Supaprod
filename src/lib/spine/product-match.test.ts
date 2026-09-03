/**
 * P-16b (A-QUEUE.md), from R-36 and the honest run: the founder pressed
 * Start with the switcher on Prism and a sentence about "the homeowner
 * app", which is Relay. These are that exact incident and its edges.
 */
import { describe, test, expect } from "bun:test";
import { matchProductFromSentence, type ProductCandidate } from "./product-match";

const PRISM: ProductCandidate = { id: "p-prism", name: "Prism", repo: "acme/prism" };
const RELAY: ProductCandidate = { id: "p-relay", name: "Relay", repo: "acme/homeowner-app" };

describe("the honest run's own incident", () => {
  test("a sentence about the homeowner app tells Relay, by its repo's own name", () => {
    const match = matchProductFromSentence("Fix the login flow on the homeowner app for renters", [
      PRISM,
      RELAY,
    ]);
    expect(match).toEqual(RELAY);
  });

  test("a sentence naming the product outright tells it by name", () => {
    expect(matchProductFromSentence("Ship the Relay checkout redesign", [PRISM, RELAY])).toEqual(
      RELAY,
    );
  });
});

describe("what it will not guess", () => {
  test("a sentence naming neither product returns null", () => {
    expect(
      matchProductFromSentence("Add SSO so people can sign in with Google", [PRISM, RELAY]),
    ).toBeNull();
  });

  test("an empty sentence returns null", () => {
    expect(matchProductFromSentence("", [PRISM, RELAY])).toBeNull();
    expect(matchProductFromSentence("   ", [PRISM, RELAY])).toBeNull();
  });

  test("a generic repo word never counts as evidence on its own", () => {
    // "app" is in GENERIC_REPO_WORDS and in both repos' own names -- it must
    // never be read as naming either product.
    const a: ProductCandidate = { id: "a", name: "Alpha", repo: "acme/alpha-app" };
    const b: ProductCandidate = { id: "b", name: "Beta", repo: "acme/beta-app" };
    expect(matchProductFromSentence("Fix a bug in the app", [a, b])).toBeNull();
  });

  test("a sentence that names two candidates at once is ambiguous, not guessed", () => {
    expect(
      matchProductFromSentence("Compare Prism and Relay side by side", [PRISM, RELAY]),
    ).toBeNull();
  });

  test("no candidates at all returns null", () => {
    expect(matchProductFromSentence("Ship Relay", [])).toBeNull();
  });

  test("a substring that is not a whole word does not count", () => {
    // "Relay" must not fire on "relayed" -- word-boundary, not substring.
    expect(matchProductFromSentence("The webhook relayed the event", [PRISM, RELAY])).toBeNull();
  });

  test("a product with no known repo still matches on its own name", () => {
    const noRepo: ProductCandidate = { id: "c", name: "Cadence", repo: null };
    expect(matchProductFromSentence("Rebuild the Cadence onboarding", [noRepo])).toEqual(noRepo);
  });
});
