import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { BRAND_GLYPHS } from "@/components/meridian/brand-glyphs.gen";
import { ProviderMark } from "@/components/meridian/source-marks";

/**
 * A CONNECTOR WEARS ITS OWN LOGO, IN ITS OWN COLOURS.
 *
 * ── THE RULING THIS ENFORCES ────────────────────────────────────────────
 * Founder, 2026-08-23, reversing his own earlier monotone ruling and then
 * restating it twice when the first attempt was still half monochrome: "use the
 * original logo and glyphs", "not the monos", "I'll prefer the original logos
 * for all those connectors".
 *
 * The doctrine in this repo is that a reversed ruling gets its guard INVERTED
 * rather than deleted, so the decision stays enforced in its new direction. The
 * old direction was a silhouette. This is the new one.
 *
 * ── THE TWO DEFECTS IT WOULD HAVE CAUGHT ────────────────────────────────
 * ONE: Linear was three freehand strokes, `M3 7 9 13 M3 3 13 13 M7 3 13 9`, and
 * not Linear's mark at all. Nobody reads path data, so it survived until the
 * founder looked at the rendered product.
 *
 * TWO: every mark was a single `<path fill="currentColor">` from simple-icons,
 * which is monochrome by design. Slack's logo is four colours; it shipped as one
 * flat shape. That is the case this file pins hardest, because it is the one
 * that looks fine in a diff.
 */

/** Brands whose published mark genuinely carries more than one colour. */
const POLYCHROME: ReadonlyArray<{ id: string; leastColours: number }> = [
  { id: "slack", leastColours: 4 },
  { id: "gmail", leastColours: 4 },
  { id: "google_calendar", leastColours: 4 },
  { id: "figma", leastColours: 5 },
  { id: "microsoft_outlook", leastColours: 4 },
];

/** Brands whose published mark is genuinely one colour. They are not a failure;
 *  they resolve through `--mrd-brand-*` so the ground picks which of the brand's
 *  OWN two variants shows. */
const MONOCHROME = ["github", "linear", "notion", "zendesk", "intercom"];

function fillsOf(id: string): string[] {
  const { container } = render(<ProviderMark provider={id} />);
  const svg = container.querySelector("svg");
  if (!svg) throw new Error(`${id} rendered no svg`);
  return [...svg.querySelectorAll("path")].map((p) => p.getAttribute("fill") ?? "");
}

describe("a brand mark is the real logo", () => {
  it("has geometry for every brand, and none of it is empty", () => {
    const ids = Object.keys(BRAND_GLYPHS);
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) {
      const g = BRAND_GLYPHS[id];
      expect(g.viewBox, `${id} has no viewBox`).toMatch(/^[\d.\s-]+$/);
      expect(g.parts.length, `${id} has no drawable parts`).toBeGreaterThan(0);
      for (const p of g.parts) expect(p.d.length, `${id} has an empty path`).toBeGreaterThan(10);
    }
  });

  it("draws a polychrome logo in its real colours, not as one silhouette", () => {
    for (const { id, leastColours } of POLYCHROME) {
      const fills = fillsOf(id);
      const distinct = new Set(fills.map((f) => f.toLowerCase()));
      expect(
        distinct.size,
        `${id} rendered ${distinct.size} colour(s); it is a ${leastColours}-colour mark`,
      ).toBeGreaterThanOrEqual(leastColours);
      // The specific regression: everything collapsing to the theme's ink.
      expect(
        [...distinct].every((f) => f === "currentcolor"),
        `${id} is a silhouette again`,
      ).toBe(false);
    }
  });

  it("resolves a monochrome brand through its own token, never a bare interface colour", () => {
    for (const id of MONOCHROME) {
      const fills = fillsOf(id);
      expect(fills.length).toBeGreaterThan(0);
      for (const f of fills) {
        expect(f, `${id} should paint through --mrd-brand-*`).toMatch(/^var\(--mrd-brand-/);
      }
    }
  });

  it("still honours an explicit mono request from a caller", () => {
    // The tone prop is the escape hatch and it must keep working, because a
    // caller that genuinely wants a silhouette is not the defect.
    const { container } = render(<ProviderMark provider="slack" tone="mono" />);
    const fills = [...container.querySelectorAll("path")].map((p) => p.getAttribute("fill"));
    expect(fills.length).toBeGreaterThan(0);
    expect(fills.every((f) => f === "currentColor")).toBe(true);
  });

  it("has not quietly gone back to a freehand Linear", () => {
    // The exact string that shipped as "Linear" until 2026-08-23.
    const drawn = "M3.0 7.0 9.0 13.0M3.0 3.0 13.0 13.0M7.0 3.0 13.0 9.0";
    for (const p of BRAND_GLYPHS.linear.parts) expect(p.d).not.toBe(drawn);
    // Linear's real mark is one detailed path, not three line segments.
    expect(BRAND_GLYPHS.linear.parts[0].d.length).toBeGreaterThan(200);
  });

  it("is a MARK and never a wordmark lockup", () => {
    /*
     * THE DEFECT THIS PINS, found by the founder in the rendered product:
     * HubSpot arrived as the full lockup, sprocket plus the word "HubSpot", on a
     * 512x149 box. Fitted into a 16px square the wordmark is about four pixels
     * tall. His words: "you have used text plus mark logo, which is not
     * readable". Stripe was the same shape of mistake at 512x214.
     *
     * A lockup is detectable without looking at it, which is what makes this
     * worth a guard rather than a code review: a mark is roughly square because
     * it is a symbol, and a lockup is wide because it contains a word. Every
     * correct glyph here sits between 0.67 (Figma, which is genuinely tall) and
     * 1.42 (Salesforce). Nothing legitimate is anywhere near 3.44.
     *
     * The band is deliberately generous. It is not trying to judge proportion,
     * only to catch the one mistake that a 16px slot cannot survive.
     */
    const offenders: string[] = [];
    for (const [id, g] of Object.entries(BRAND_GLYPHS)) {
      const [, , w, h] = g.viewBox.split(/\s+/).map(Number);
      const ratio = w / h;
      if (!Number.isFinite(ratio) || ratio > 2 || ratio < 0.5) {
        offenders.push(
          `${id} is ${w}x${h} (ratio ${ratio.toFixed(2)}); that is a lockup, use the mark`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });

  it("fits each publisher's own viewBox instead of assuming a 24 grid", () => {
    // Figma publishes 256x384 and Stripe 512x214. A fixed scale squashed them.
    const boxes = new Set(Object.values(BRAND_GLYPHS).map((g) => g.viewBox));
    expect(
      boxes.size,
      "every mark shares one viewBox, which means they were redrawn",
    ).toBeGreaterThan(3);
    const { container } = render(<ProviderMark provider="figma" />);
    expect(container.querySelector("svg")?.getAttribute("preserveAspectRatio")).toBe(
      "xMidYMid meet",
    );
  });
});
