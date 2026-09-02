/**
 * P-14 (A-QUEUE.md), A1's own live finding, 2026-09-03: "Redundant Data
 * Entry" and "Competitors Advancing Software & Ecosystems" on Start's cards,
 * a theme's own name rather than a sentence a person would type.
 */
import { describe, it, expect } from "bun:test";
import { looksLikeASentence } from "./bet-title";

describe("looksLikeASentence: a theme's name is not a bet's title", () => {
  it("rejects the two live examples that shipped wrong", () => {
    expect(looksLikeASentence("Redundant Data Entry")).toBe(false);
    expect(looksLikeASentence("Competitors Advancing Software & Ecosystems")).toBe(false);
  });

  it("accepts the good example on the same screen", () => {
    expect(looksLikeASentence("Skip the address re-confirm when nothing changed")).toBe(true);
  });

  it("accepts the product's own hand-written examples", () => {
    expect(looksLikeASentence("Make the checkout accept an American Express card")).toBe(true);
    expect(looksLikeASentence("Cut the sign-up form from nine fields to four")).toBe(true);
    expect(looksLikeASentence("Find out why people abandon the address step")).toBe(true);
  });

  it("a proper noun inside a real sentence does not trip the floor", () => {
    expect(looksLikeASentence("Add Stripe as a payment option at checkout")).toBe(true);
  });

  it("rejects anything too short to be this product's kind of sentence", () => {
    expect(looksLikeASentence("Checkout bug")).toBe(false);
    expect(looksLikeASentence("Latency")).toBe(false);
    expect(looksLikeASentence("")).toBe(false);
  });

  it("rejects a Title Case cluster name even at three words", () => {
    expect(looksLikeASentence("Off Hours Latency")).toBe(false);
  });
});
