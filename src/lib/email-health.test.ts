import { describe, it, expect } from "bun:test";
import { looksLikeSecret, SECRET_PLACEHOLDER } from "./email-health.functions";

/**
 * This guard exists because the panel it protects leaked a real Resend key
 * within minutes of shipping: the founder put his API key in
 * RESEND_FROM_EMAIL, and the From row printed it verbatim on the strength of
 * the variable's NAME. A misconfiguration panel runs precisely when names and
 * contents have come apart, so these tests encode the rule that no environment
 * value is echoed because of what it is called.
 */
describe("looksLikeSecret", () => {
  it("catches the exact shape that leaked", () => {
    // Same shape as the key that appeared on screen, different characters.
    expect(looksLikeSecret("re_agpFR93u_DyABCd4NNfwqkn71EW3JGYxz")).toBe(true);
  });

  it("catches other vendors' tokens, since the next mistake will not be Resend", () => {
    for (const t of [
      "sk-proj-abc123def456ghi789jkl012",
      "sk_live_51H8xY2abcdefghijklmnop",
      "ghp_16C7e42F292c6912E7710c838347Ae178B4a",
      "xoxb-123456789012-1234567890123-AbCdEfGhIjKlMnOpQrStUvWx",
      "Bearer abc123def456ghi789jkl012mno",
    ]) {
      expect(looksLikeSecret(t)).toBe(true);
    }
  });

  it("catches a long high-entropy string with no known prefix", () => {
    expect(looksLikeSecret("Zk92mQ4vT8xL1pR7nB3wY6dH5sJ0aC")).toBe(true);
  });

  it("never masks a real From header, in any of its legal forms", () => {
    for (const from of [
      "Supaprod <notifications@supaprod.ai>",
      "notifications@supaprod.ai",
      "Rohit at Supaprod <rohit@supaprod.ai>",
      // Long enough to trip the entropy heuristic, saved by the @.
      "Supaprod Notifications Team <notifications+launch2026@supaprod.ai>",
    ]) {
      expect(looksLikeSecret(from)).toBe(false);
    }
  });

  it("leaves short or wordy values alone rather than masking everything", () => {
    for (const v of ["", "   ", "Supaprod", "no reply", "Supaprod Team"]) {
      expect(looksLikeSecret(v)).toBe(false);
    }
  });

  it("the placeholder names the problem rather than only hiding the value", () => {
    // A masked field with no explanation reads as a bug in the panel, which is
    // how a real misconfiguration gets dismissed.
    expect(SECRET_PLACEHOLDER).toContain("API key");
    expect(SECRET_PLACEHOLDER).toContain("variable");
    expect(SECRET_PLACEHOLDER).not.toContain("re_");
  });
});
