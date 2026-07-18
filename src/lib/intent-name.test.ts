import { describe, expect, test } from "bun:test";
import { nameFromIntent } from "@/lib/intent-name";

describe("nameFromIntent", () => {
  test("drops stop words and title-cases the remaining words", () => {
    expect(nameFromIntent("build a landing page for the launch")).toBe("Landing Page Launch");
  });

  test("caps at three meaningful words", () => {
    expect(nameFromIntent("design a fast checkout flow with saved cards")).toBe(
      "Fast Checkout Flow",
    );
  });

  test("falls back to the raw words when every word is a stop word", () => {
    expect(nameFromIntent("build the plan")).toBe("Build The Plan");
  });

  test("strips punctuation before splitting", () => {
    expect(nameFromIntent("Ship a pricing page, redesigned!")).toBe("Pricing Page Redesigned");
  });
});
