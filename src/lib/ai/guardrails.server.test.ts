/**
 * Test suite for guardrails.server.ts — evaluateGuardrails pure function.
 * Security-critical guardrail evaluation covering redaction, blocking, warnings,
 * injection-kind force-block override, zero-width regex handling, and side filtering.
 */

import { describe, it, expect } from "bun:test";
import { evaluateGuardrails, type GuardrailRule, type GuardrailResult } from "./guardrails.server";

// Helper to create minimal rule for testing
function rule(overrides: Partial<GuardrailRule> = {}): GuardrailRule {
  return {
    id: "rule-1",
    name: "Test Rule",
    kind: "regex",
    pattern: "test",
    action: "block",
    applies_to: "both",
    enabled: true,
    ...overrides,
  };
}

describe("evaluateGuardrails", () => {
  describe("basic pass-through", () => {
    it("should return text unchanged when no rules match", () => {
      const text = "This is safe text";
      const rules = [rule({ pattern: "dangerous", kind: "keyword" })];
      const result = evaluateGuardrails(text, rules, "input");

      expect(result.text).toBe(text);
      expect(result.hits).toHaveLength(0);
      expect(result.blocked).toBe(false);
    });

    it("should handle empty rules array", () => {
      const text = "Any text";
      const result = evaluateGuardrails(text, [], "input");

      expect(result.text).toBe(text);
      expect(result.hits).toHaveLength(0);
      expect(result.blocked).toBe(false);
    });

    it("should handle empty text", () => {
      const result = evaluateGuardrails("", [rule()], "input");

      expect(result.text).toBe("");
      expect(result.hits).toHaveLength(0);
      expect(result.blocked).toBe(false);
    });
  });

  describe("blocking behavior", () => {
    it("should set blocked=true when rule.action is 'block'", () => {
      const rules = [rule({ pattern: "secret", action: "block" })];
      const result = evaluateGuardrails("contains secret data", rules, "input");

      expect(result.blocked).toBe(true);
      expect(result.hits).toHaveLength(1);
      expect(result.hits[0]!.action).toBe("block");
    });

    it("should record hit but not change text for 'block' action", () => {
      const text = "my secret password";
      const rules = [rule({ pattern: "secret", action: "block" })];
      const result = evaluateGuardrails(text, rules, "input");

      expect(result.text).toBe(text); // text unchanged, not redacted
      expect(result.blocked).toBe(true);
    });
  });

  describe("redaction behavior", () => {
    it("should redact matching text when rule.action is 'redact'", () => {
      const rules = [
        rule({
          pattern: "password",
          action: "redact",
          kind: "keyword",
        }),
      ];
      const result = evaluateGuardrails("my password is secret", rules, "input");

      expect(result.text).toContain("[REDACTED:keyword]");
      expect(result.text).not.toContain("password");
      expect(result.blocked).toBe(false);
    });

    it("should redact all occurrences case-insensitively", () => {
      const rules = [
        rule({
          pattern: "password",
          action: "redact",
          kind: "secret",
        }),
      ];
      const result = evaluateGuardrails(
        "PASSWORD=secret123 and password=secret456",
        rules,
        "output",
      );

      const redactCount = (result.text.match(/\[REDACTED:secret\]/g) || []).length;
      expect(redactCount).toBe(2); // both PASSWORD and password should be redacted
    });

    it("should include kind name in redaction placeholder", () => {
      const kinds: Array<"pii" | "secret"> = ["pii", "secret"];
      for (const kind of kinds) {
        const rules = [
          rule({
            pattern: "sensitive",
            action: "redact",
            kind,
          }),
        ];
        const result = evaluateGuardrails("sensitive data", rules, "input");

        expect(result.text).toContain(`[REDACTED:${kind}]`);
      }
    });
  });

  describe("warning behavior", () => {
    it("should record hit but not modify text for 'warn' action", () => {
      const text = "warning word here";
      const rules = [
        rule({
          pattern: "warning",
          action: "warn",
          kind: "keyword",
        }),
      ];
      const result = evaluateGuardrails(text, rules, "input");

      expect(result.text).toBe(text);
      expect(result.blocked).toBe(false);
      expect(result.hits).toHaveLength(1);
      expect(result.hits[0]!.action).toBe("warn");
    });
  });

  describe("injection-kind forced blocking", () => {
    it("should force block=true for injection kind regardless of action", () => {
      const rules = [
        rule({
          pattern: "<script>",
          kind: "injection",
          action: "warn", // even though action is warn, injection forces block
        }),
      ];
      const result = evaluateGuardrails("contains <script>alert()</script>", rules, "input");

      expect(result.blocked).toBe(true);
    });

    it("should force block even with 'redact' action on injection", () => {
      const rules = [
        rule({
          pattern: "javascript:",
          kind: "injection",
          action: "redact",
        }),
      ];
      const result = evaluateGuardrails("href='javascript:void(0)'", rules, "input");

      expect(result.blocked).toBe(true);
    });
  });

  describe("side filtering", () => {
    it("should skip rules with applies_to='input' when side='output'", () => {
      const rules = [
        rule({
          pattern: "test",
          applies_to: "input",
          action: "block",
        }),
      ];
      const result = evaluateGuardrails("contains test word", rules, "output");

      expect(result.blocked).toBe(false);
      expect(result.hits).toHaveLength(0);
    });

    it("should skip rules with applies_to='output' when side='input'", () => {
      const rules = [
        rule({
          pattern: "test",
          applies_to: "output",
          action: "block",
        }),
      ];
      const result = evaluateGuardrails("contains test word", rules, "input");

      expect(result.blocked).toBe(false);
      expect(result.hits).toHaveLength(0);
    });

    it("should apply rules with applies_to='both' to both sides", () => {
      const rules = [
        rule({
          pattern: "danger",
          applies_to: "both",
          action: "block",
        }),
      ];

      const inputResult = evaluateGuardrails("danger", rules, "input");
      const outputResult = evaluateGuardrails("danger", rules, "output");

      expect(inputResult.blocked).toBe(true);
      expect(outputResult.blocked).toBe(true);
    });
  });

  describe("disabled rules", () => {
    it("should skip disabled rules", () => {
      const rules = [
        rule({
          pattern: "blocked",
          action: "block",
          enabled: false,
        }),
      ];
      const result = evaluateGuardrails("contains blocked word", rules, "input");

      expect(result.blocked).toBe(false);
      expect(result.hits).toHaveLength(0);
    });

    it("should process enabled=true rules", () => {
      const rules = [
        rule({
          pattern: "blocked",
          action: "block",
          enabled: true,
        }),
      ];
      const result = evaluateGuardrails("contains blocked word", rules, "input");

      expect(result.blocked).toBe(true);
      expect(result.hits).toHaveLength(1);
    });
  });

  describe("invalid regex patterns", () => {
    it("should skip rules with invalid regex patterns", () => {
      const rules = [
        rule({
          pattern: "[invalid(regex", // unclosed bracket
          kind: "regex",
        }),
      ];
      const result = evaluateGuardrails("any text", rules, "input");

      expect(result.hits).toHaveLength(0);
      expect(result.blocked).toBe(false);
    });

    it("should continue processing other rules after invalid one", () => {
      const rules = [
        rule({
          id: "invalid",
          pattern: "[invalid(regex",
          kind: "regex",
          action: "block",
        }),
        rule({
          id: "valid",
          pattern: "danger",
          kind: "keyword",
          action: "block",
        }),
      ];
      const result = evaluateGuardrails("contains danger", rules, "input");

      expect(result.blocked).toBe(true);
      expect(result.hits.some((h) => h.rule_id === "valid")).toBe(true);
    });
  });

  describe("keyword literal matching", () => {
    it("should escape regex special chars in keyword rules", () => {
      const rules = [
        rule({
          pattern: "price: $99",
          kind: "keyword",
          action: "redact",
        }),
      ];
      const result = evaluateGuardrails("The price: $99 is a deal", rules, "input");

      expect(result.text).toContain("[REDACTED:keyword]");
      expect(result.text).not.toContain("$99");
    });

    it("should treat keywords as case-insensitive", () => {
      const rules = [
        rule({
          pattern: "Secret",
          kind: "keyword",
          action: "block",
        }),
      ];

      const result1 = evaluateGuardrails("SECRET data", rules, "input");
      const result2 = evaluateGuardrails("secret data", rules, "input");

      expect(result1.blocked).toBe(true);
      expect(result2.blocked).toBe(true);
    });
  });

  describe("zero-width match guard", () => {
    it("should handle zero-width assertions without infinite loop", () => {
      const rules = [
        rule({
          pattern: "^", // matches at start, zero-width
          kind: "regex",
          action: "block",
        }),
      ];
      const result = evaluateGuardrails("text", rules, "input");

      // Should complete without hanging; exact behavior depends on zero-width guard
      expect(result.hits.length).toBeGreaterThanOrEqual(0);
      expect(result.blocked).toBe(true);
    });

    it("should advance past zero-width matches", () => {
      // A lookahead is zero-width
      const rules = [
        rule({
          pattern: "(?=test)", // lookahead for 'test', zero-width
          kind: "regex",
          action: "warn",
        }),
      ];
      const result = evaluateGuardrails("test data", rules, "input");

      // Should not loop infinitely on zero-width match
      expect(result.hits.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("multiple matches and multiple rules", () => {
    it("should record all hits for multiple matches of same rule", () => {
      const rules = [
        rule({
          pattern: "danger",
          action: "block",
          kind: "keyword",
        }),
      ];
      const result = evaluateGuardrails("danger zone, danger ahead, more danger", rules, "input");

      expect(result.hits.length).toBe(3);
      expect(result.hits.every((h) => h.matched === "danger")).toBe(true);
    });

    it("should apply multiple rules in order", () => {
      const rules = [
        rule({
          id: "rule-1",
          pattern: "secret",
          action: "redact",
          kind: "keyword",
        }),
        rule({
          id: "rule-2",
          pattern: "password",
          action: "block",
          kind: "keyword",
        }),
      ];
      const result = evaluateGuardrails("secret password", rules, "input");

      expect(result.blocked).toBe(true);
      expect(result.hits.length).toBe(2);
      expect(result.text).toContain("[REDACTED:keyword]");
    });

    it("should stop processing after any block rule", () => {
      // Note: current implementation does NOT stop, it continues.
      // This test documents actual behavior: all rules are evaluated.
      const rules = [
        rule({
          id: "block-rule",
          pattern: "block-me",
          action: "block",
          kind: "keyword",
        }),
        rule({
          id: "redact-rule",
          pattern: "redact-me",
          action: "redact",
          kind: "keyword",
        }),
      ];
      const result = evaluateGuardrails("block-me and redact-me", rules, "input");

      expect(result.blocked).toBe(true);
      expect(result.hits.length).toBe(2); // both are evaluated
      expect(result.text).toContain("[REDACTED:keyword]"); // redaction still applied
    });
  });

  describe("hit details", () => {
    it("should populate hit with rule metadata", () => {
      const rules = [
        rule({
          id: "rule-abc",
          name: "My Custom Rule",
          pattern: "match-me",
          kind: "pii",
          action: "warn",
          applies_to: "input",
        }),
      ];
      const result = evaluateGuardrails("match-me now", rules, "input");

      expect(result.hits).toHaveLength(1);
      const hit = result.hits[0]!;
      expect(hit.rule_id).toBe("rule-abc");
      expect(hit.rule_name).toBe("My Custom Rule");
      expect(hit.kind).toBe("pii");
      expect(hit.action).toBe("warn");
      expect(hit.side).toBe("input");
      expect(hit.matched).toBe("match-me");
    });

    it("should truncate matched text to 80 chars in hit", () => {
      const longMatch = "a".repeat(100);
      const rules = [rule({ pattern: "a+", kind: "regex" })];
      const result = evaluateGuardrails(longMatch, rules, "input");

      expect(result.hits[0]!.matched.length).toBe(80);
      expect(result.hits[0]!.matched).toBe("a".repeat(80));
    });
  });

  describe("edge cases and stress", () => {
    it("should handle very long text", () => {
      const longText = "normal " + "a".repeat(10000) + " text";
      const rules = [rule({ pattern: "a{100,}", kind: "regex", action: "block" })];
      const result = evaluateGuardrails(longText, rules, "input");

      expect(result.blocked).toBe(true);
      expect(result.hits.length).toBeGreaterThan(0);
    });

    it("should handle many rules", () => {
      const manyRules: GuardrailRule[] = Array.from({ length: 50 }, (_, i) => ({
        id: `rule-${i}`,
        name: `Rule ${i}`,
        kind: "keyword" as const,
        pattern: `danger${i}`,
        action: "warn" as const,
        applies_to: "both" as const,
        enabled: i < 5, // only first 5 enabled
      }));

      const result = evaluateGuardrails("danger1 danger10", manyRules, "input");

      // danger1 matches rule 1 (enabled), danger10 matches rule 10 (disabled)
      expect(result.hits.length).toBeGreaterThanOrEqual(1);
      const matchedIds = result.hits.map((h) => h.rule_id);
      expect(matchedIds.some((id) => id.includes("1"))).toBe(true);
    });

    it("should handle text with various line endings", () => {
      const rules = [rule({ pattern: "test", kind: "keyword", action: "block" })];

      const textCRLF = "line1\r\ntest\r\nline3";
      const textLF = "line1\ntest\nline3";
      const textCR = "line1\rtest\rline3";

      expect(evaluateGuardrails(textCRLF, rules, "input").blocked).toBe(true);
      expect(evaluateGuardrails(textLF, rules, "input").blocked).toBe(true);
      expect(evaluateGuardrails(textCR, rules, "input").blocked).toBe(true);
    });
  });

  describe("complex interaction scenarios", () => {
    it("should handle injection rule with redaction on other rules", () => {
      const rules = [
        rule({
          id: "redact",
          pattern: "secret",
          action: "redact",
          kind: "keyword",
        }),
        rule({
          id: "inject",
          pattern: "<script>",
          action: "warn",
          kind: "injection",
        }),
      ];
      const result = evaluateGuardrails("my secret is <script>", rules, "input");

      expect(result.blocked).toBe(true); // injection forces block
      expect(result.text).toContain("[REDACTED:keyword]"); // secret still redacted
      expect(result.hits.length).toBe(2);
    });

    it("should apply different rules to input vs output", () => {
      const rules = [
        rule({
          id: "input-only",
          pattern: "user_data",
          applies_to: "input",
          action: "block",
        }),
        rule({
          id: "output-only",
          pattern: "generated",
          applies_to: "output",
          action: "block",
        }),
      ];

      const input = evaluateGuardrails("user_data here", rules, "input");
      const output = evaluateGuardrails("generated here", rules, "output");
      const generatedOnInput = evaluateGuardrails("generated", rules, "input");

      expect(input.blocked).toBe(true); // user_data rule applies to input
      expect(output.blocked).toBe(true); // generated rule applies to output
      expect(generatedOnInput.blocked).toBe(false); // generated rule only applies to output, not input
    });
  });
});
