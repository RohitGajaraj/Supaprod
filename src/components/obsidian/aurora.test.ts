import { describe, it, expect } from "bun:test";
import { auroraBackground } from "./aurora";
import type { AuroraHue } from "./aurora";

describe("aurora", () => {
  describe("auroraBackground", () => {
    it("should return healthy hue color", () => {
      const result = auroraBackground("healthy");
      expect(result).toBe("#0F1B12");
    });

    it("should return attention hue color (color-mix variant)", () => {
      const result = auroraBackground("attention");
      expect(result).toContain("color-mix");
      expect(result).toContain("var(--ember)");
      expect(result).toContain("12%");
      expect(result).toContain("var(--surface-card-deep)");
    });

    it("should return failing hue color (color-mix variant)", () => {
      const result = auroraBackground("failing");
      expect(result).toContain("color-mix");
      expect(result).toContain("var(--madder)");
      expect(result).toContain("12%");
      expect(result).toContain("var(--surface-card-deep)");
    });

    it("should return consistent results for the same hue", () => {
      expect(auroraBackground("healthy")).toBe(auroraBackground("healthy"));
      expect(auroraBackground("attention")).toBe(auroraBackground("attention"));
      expect(auroraBackground("failing")).toBe(auroraBackground("failing"));
    });

    it("should have different results for different hues", () => {
      const healthy = auroraBackground("healthy");
      const attention = auroraBackground("attention");
      const failing = auroraBackground("failing");

      expect(healthy).not.toBe(attention);
      expect(healthy).not.toBe(failing);
      expect(attention).not.toBe(failing);
    });

    it("should use hex notation for healthy hue (literal)", () => {
      const result = auroraBackground("healthy");
      expect(result).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it("should use CSS variables for non-healthy hues", () => {
      const attention = auroraBackground("attention");
      const failing = auroraBackground("failing");

      expect(attention).toContain("var(");
      expect(failing).toContain("var(");
    });

    it("should include oklab color space in color-mix expressions", () => {
      const attention = auroraBackground("attention");
      const failing = auroraBackground("failing");

      expect(attention).toContain("in oklab");
      expect(failing).toContain("in oklab");
    });

    it("should use consistent color percentages for color-mix variants", () => {
      const attention = auroraBackground("attention");
      const failing = auroraBackground("failing");

      // Both should use 12% of the primary color
      expect(attention).toContain("12%");
      expect(failing).toContain("12%");
    });

    it("should have distinct visual semantics", () => {
      const healthy = auroraBackground("healthy");
      const attention = auroraBackground("attention");
      const failing = auroraBackground("failing");

      // healthy is a real color (dark green)
      expect(healthy).toBe("#0F1B12");

      // attention uses ember (warm color)
      expect(attention).toContain("var(--ember)");

      // failing uses madder (red color)
      expect(failing).toContain("var(--madder)");
    });

    it("should accept all valid AuroraHue values", () => {
      const validHues: AuroraHue[] = ["healthy", "attention", "failing"];
      for (const hue of validHues) {
        expect(() => auroraBackground(hue)).not.toThrow();
        const result = auroraBackground(hue);
        expect(result).toBeDefined();
        expect(typeof result).toBe("string");
      }
    });

    it("should return non-empty strings", () => {
      expect(auroraBackground("healthy").length).toBeGreaterThan(0);
      expect(auroraBackground("attention").length).toBeGreaterThan(0);
      expect(auroraBackground("failing").length).toBeGreaterThan(0);
    });

    it("should maintain color values across module reloads", () => {
      // Call multiple times to ensure consistency
      const calls = Array.from({ length: 5 }, () => auroraBackground("healthy"));
      calls.forEach((result) => expect(result).toBe("#0F1B12"));
    });
  });
});
