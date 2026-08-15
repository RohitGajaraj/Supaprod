import { describe, expect, test } from "bun:test";
import { ConfidenceDisclosureChip } from "./ConfidenceDisclosureChip";

/**
 * The arithmetic and the tone mapping, read off the element tree.
 *
 * REWRITTEN 2026-07-29 with the port. Every assertion in the previous version
 * was about inline style: `color: var(--emerald)`, `borderRadius: 99`,
 * `padding: "2px 8px"`, a mono font stack, a `color-mix` border. Those pinned
 * the chip to the retired palette, which is exactly what the port removed, and
 * one of them (`fontSize: 9.5`) had already drifted from the component and was
 * failing on main. A test that fails when the paint changes and passes when the
 * meaning changes is testing the wrong thing.
 *
 * What is worth pinning is what the chip CLAIMS: the percent it discloses, the
 * word it puts on it, and the tone that word carries. The DOM side of that lives
 * in `__tests__/confidence-disclosure-chip.test.tsx`.
 */

type Rendered = { props: { tone?: string; children?: { props?: { title?: string } } } };

function chipFor(confidence: number, tier: "high" | "medium" | "low") {
  return ConfidenceDisclosureChip({ confidence, tier }) as unknown as Rendered;
}

function toneOf(confidence: number, tier: "high" | "medium" | "low"): string | undefined {
  return chipFor(confidence, tier).props.tone;
}

function titleOf(confidence: number, tier: "high" | "medium" | "low"): string {
  return chipFor(confidence, tier).props.children?.props?.title ?? "";
}

describe("ConfidenceDisclosureChip tone", () => {
  test("a confident verdict reads as a pass", () => {
    expect(toneOf(0.9, "high")).toBe("pass");
  });

  test("a moderate verdict stays quiet, because it is neither an outcome nor a warning", () => {
    expect(toneOf(0.5, "medium")).toBe("quiet");
  });

  test("an unsure verdict reads as a caution, and never as the human accent", () => {
    // The accent marks A PERSON IS REQUIRED. This is the machine reporting on
    // itself, so the low tier takes the caution tone rather than the accent
    // reserved for a call genuinely waiting on somebody.
    //
    // `hold` since 2026-08-15, and it is the same claim in Meridian's words
    // rather than a changed one. The retired layer called this `warn`; Meridian
    // has five status meanings and `hold` is the one that says STOPPED, AND
    // WAITING ON A CONDITION RATHER THAN ON YOU -- which is exactly what low
    // confidence is, since more evidence changes it and no decision does.
    expect(toneOf(0.25, "low")).toBe("hold");
  });
});

describe("ConfidenceDisclosureChip disclosure", () => {
  test("discloses the percent it is confident to", () => {
    expect(titleOf(0.85, "high")).toContain("85%");
    expect(titleOf(0.85, "high")).toContain("Supaprod discloses");
  });

  test("clamps a negative probability to 0%", () => {
    expect(titleOf(-0.5, "low")).toContain("0%");
  });

  test("clamps a probability over 1 to 100%", () => {
    expect(titleOf(1.5, "high")).toContain("100%");
  });

  test("rounds to the nearest percent", () => {
    expect(titleOf(0.555, "high")).toContain("56%");
  });

  test("exactly 0 discloses 0%", () => {
    expect(titleOf(0, "low")).toContain("0%");
  });

  test("exactly 1 discloses 100%", () => {
    expect(titleOf(1, "high")).toContain("100%");
  });

  test("exactly 0.5 discloses 50%", () => {
    expect(titleOf(0.5, "medium")).toContain("50%");
  });
});
