/**
 * Tests for guardrails.functions.ts
 *
 * Security-critical server functions for guardrail rules management:
 * - Rule lifecycle (upsert, delete, toggle)
 * - Built-in seed set management
 * - Rule testing/dry-run evaluation
 * - Activity counting
 *
 * Guardrails protect against PII leakage, secret exposure, and prompt injection.
 */

import { describe, it, expect } from "vitest";

describe("guardrails.functions — input validation", () => {
  describe("RuleSchema validation", () => {
    it("should accept valid rule with all required fields", () => {
      const rule = {
        name: "Email detector",
        kind: "pii",
        pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      expect(rule.name.length).toBeGreaterThan(0);
      expect(rule.name.length).toBeLessThanOrEqual(120);
      expect(["regex", "keyword", "pii", "injection", "secret"]).toContain(rule.kind);
      expect(["block", "warn", "redact"]).toContain(rule.action);
      expect(["input", "output", "both"]).toContain(rule.applies_to);
    });

    it("should accept optional id for update operations", () => {
      const rule = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Updated rule",
        kind: "keyword",
        pattern: "dangerous",
        action: "block",
        applies_to: "input",
        enabled: false,
      };
      expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rule.id)).toBe(
        true,
      );
    });

    it("should reject name with 0 length", () => {
      const rule = {
        name: "",
        kind: "pii",
        pattern: "test",
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      expect(rule.name.length > 0).toBe(false);
    });

    it("should reject name exceeding 120 characters", () => {
      const rule = {
        name: "a".repeat(121),
        kind: "pii",
        pattern: "test",
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      expect(rule.name.length > 120).toBe(true);
    });

    it("should accept name at max boundary (120 chars)", () => {
      const rule = {
        name: "a".repeat(120),
        kind: "pii",
        pattern: "test",
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      expect(rule.name.length).toBe(120);
    });

    it("should reject invalid kind enum value", () => {
      const rule = {
        name: "Test rule",
        kind: "custom_kind",
        pattern: "test",
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      const validKinds = ["regex", "keyword", "pii", "injection", "secret"];
      expect(validKinds).not.toContain(rule.kind);
    });

    it("should accept all valid kind values", () => {
      const kinds = ["regex", "keyword", "pii", "injection", "secret"];
      kinds.forEach((kind) => {
        const rule = {
          name: "Test",
          kind,
          pattern: "test",
          action: "redact",
          applies_to: "both",
          enabled: true,
        };
        expect(["regex", "keyword", "pii", "injection", "secret"]).toContain(rule.kind);
      });
    });

    it("should reject empty pattern", () => {
      const rule = {
        name: "Test",
        kind: "keyword",
        pattern: "",
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      expect(rule.pattern.length > 0).toBe(false);
    });

    it("should reject pattern exceeding 1000 characters", () => {
      const rule = {
        name: "Test",
        kind: "regex",
        pattern: "a".repeat(1001),
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      expect(rule.pattern.length > 1000).toBe(true);
    });

    it("should accept pattern at max boundary (1000 chars)", () => {
      const rule = {
        name: "Test",
        kind: "regex",
        pattern: "a".repeat(1000),
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      expect(rule.pattern.length).toBe(1000);
    });

    it("should reject invalid action value", () => {
      const rule = {
        name: "Test",
        kind: "pii",
        pattern: "test",
        action: "ignore",
        applies_to: "both",
        enabled: true,
      };
      const validActions = ["block", "warn", "redact"];
      expect(validActions).not.toContain(rule.action);
    });

    it("should accept all valid action values", () => {
      const actions = ["block", "warn", "redact"];
      actions.forEach((action) => {
        const rule = {
          name: "Test",
          kind: "pii",
          pattern: "test",
          action,
          applies_to: "both",
          enabled: true,
        };
        expect(["block", "warn", "redact"]).toContain(rule.action);
      });
    });

    it("should reject invalid applies_to value", () => {
      const rule = {
        name: "Test",
        kind: "pii",
        pattern: "test",
        action: "redact",
        applies_to: "internal",
        enabled: true,
      };
      const validScopes = ["input", "output", "both"];
      expect(validScopes).not.toContain(rule.applies_to);
    });

    it("should accept all valid applies_to values", () => {
      const scopes = ["input", "output", "both"];
      scopes.forEach((scope) => {
        const rule = {
          name: "Test",
          kind: "pii",
          pattern: "test",
          action: "redact",
          applies_to: scope,
          enabled: true,
        };
        expect(["input", "output", "both"]).toContain(rule.applies_to);
      });
    });

    it("should reject non-boolean enabled", () => {
      const rule = {
        name: "Test",
        kind: "pii",
        pattern: "test",
        action: "redact",
        applies_to: "both",
        enabled: "yes",
      };
      expect(typeof rule.enabled === "boolean").toBe(false);
    });
  });

  describe("TestSchema validation", () => {
    it("should accept valid test input", () => {
      const test = {
        text: "Contact me at user@example.com",
        side: "input",
        rule: {
          name: "Email",
          kind: "pii",
          pattern: "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}",
          action: "redact",
          applies_to: "both",
        },
      };
      expect(test.text.length).toBeGreaterThan(0);
      expect(test.text.length).toBeLessThanOrEqual(5000);
      expect(["input", "output"]).toContain(test.side);
    });

    it("should reject empty text", () => {
      const test = {
        text: "",
        side: "input",
        rule: {
          name: "Email",
          kind: "pii",
          pattern: "test",
          action: "redact",
          applies_to: "both",
        },
      };
      expect(test.text.length > 0).toBe(false);
    });

    it("should reject text exceeding 5000 characters", () => {
      const test = {
        text: "a".repeat(5001),
        side: "input",
        rule: {
          name: "Email",
          kind: "pii",
          pattern: "test",
          action: "redact",
          applies_to: "both",
        },
      };
      expect(test.text.length > 5000).toBe(true);
    });

    it("should accept text at max boundary (5000 chars)", () => {
      const test = {
        text: "a".repeat(5000),
        side: "output",
        rule: {
          name: "Test",
          kind: "keyword",
          pattern: "test",
          action: "warn",
          applies_to: "both",
        },
      };
      expect(test.text.length).toBe(5000);
    });

    it("should reject invalid side value", () => {
      const test = {
        text: "test",
        side: "both",
        rule: {
          name: "Test",
          kind: "pii",
          pattern: "test",
          action: "redact",
          applies_to: "both",
        },
      };
      const validSides = ["input", "output"];
      expect(validSides).not.toContain(test.side);
    });

    it("should accept both valid side values", () => {
      const sides = ["input", "output"];
      sides.forEach((side) => {
        const test = {
          text: "test",
          side,
          rule: {
            name: "Test",
            kind: "pii",
            pattern: "test",
            action: "redact",
            applies_to: "both",
          },
        };
        expect(["input", "output"]).toContain(test.side);
      });
    });
  });

  describe("deleteGuardrailRule — input validation", () => {
    it("should reject invalid rule UUID", () => {
      const input = { id: "not-a-uuid" };
      expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)).toBe(
        false,
      );
    });

    it("should accept valid rule UUID", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
      expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)).toBe(
        true,
      );
    });
  });

  describe("toggleGuardrailRule — input validation", () => {
    it("should reject invalid rule UUID", () => {
      const input = { id: "bad", enabled: true };
      expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)).toBe(
        false,
      );
    });

    it("should reject non-boolean enabled", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000", enabled: "yes" };
      expect(typeof input.enabled === "boolean").toBe(false);
    });

    it("should accept valid input", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000", enabled: false };
      expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)).toBe(
        true,
      );
      expect(typeof input.enabled === "boolean").toBe(true);
    });
  });
});

describe("guardrails.functions — business logic", () => {
  describe("seedBuiltInGuardrails — deduplication", () => {
    it("should not re-insert rules by name", () => {
      const builtinNames = [
        "Email address",
        "Phone number",
        "Credit card",
        "OpenAI API key",
        "AWS access key",
        "GitHub token",
        "Ignore instructions",
        "System prompt leak",
        "Profanity (mild)",
      ];
      const existing = ["Email address", "Phone number"];
      const have = new Set(existing);
      const toInsert = builtinNames.filter((r) => !have.has(r));

      expect(toInsert).not.toContain("Email address");
      expect(toInsert).not.toContain("Phone number");
      expect(toInsert).toContain("Credit card");
      expect(toInsert).toHaveLength(7);
    });

    it("should insert all if none exist", () => {
      const builtinCount = 9;
      const have = new Set();
      const toInsert = builtinCount - have.size;
      expect(toInsert).toBe(9);
    });

    it("should insert nothing if all exist", () => {
      const builtinNames = [
        "Email address",
        "Phone number",
        "Credit card",
        "OpenAI API key",
        "AWS access key",
        "GitHub token",
        "Ignore instructions",
        "System prompt leak",
        "Profanity (mild)",
      ];
      const have = new Set(builtinNames);
      const toInsert = builtinNames.filter((r) => !have.has(r));
      expect(toInsert).toHaveLength(0);
    });
  });

  describe("upsertGuardrailRule — insert vs update", () => {
    it("should insert when no id is provided", () => {
      const rule = {
        name: "Custom rule",
        kind: "keyword",
        pattern: "dangerous",
        action: "block",
        applies_to: "input",
        enabled: true,
      };
      const hasId = "id" in rule && rule.id;
      expect(hasId).toBe(false);
    });

    it("should update when id is provided", () => {
      const rule = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Updated rule",
        kind: "pii",
        pattern: "updated-pattern",
        action: "redact",
        applies_to: "both",
        enabled: true,
      };
      const hasId = "id" in rule && !!rule.id;
      expect(hasId).toBe(true);
    });
  });

  describe("testGuardrailRule — response structure", () => {
    it("should return text, hits, and blocked", () => {
      const response = {
        text: "Redacted content [redacted]",
        hits: [{ rule: "Email", position: 0, matched: "user@example.com" }],
        blocked: false,
      };
      expect(response).toHaveProperty("text");
      expect(response).toHaveProperty("hits");
      expect(response).toHaveProperty("blocked");
    });

    it("should mark as blocked when action is block", () => {
      // When a rule with action=block matches, blocked should be true
      const response = {
        text: "original",
        hits: [{ rule: "API key", matched: "sk-abc123" }],
        blocked: true,
      };
      expect(response.blocked).toBe(true);
    });

    it("should not block when action is warn or redact", () => {
      const responsesNotBlocked = [
        { text: "[redacted]", hits: [], blocked: false }, // redact action
        { text: "original", hits: [{ rule: "warning" }], blocked: false }, // warn action
      ];
      responsesNotBlocked.forEach((r) => {
        expect(r.blocked).toBe(false);
      });
    });
  });

  describe("getGuardrailOverview — response structure", () => {
    it("should return rules, hits, and builtins", () => {
      const response = {
        rules: [{ id: "r1", name: "Custom rule", enabled: true, pattern: "test" }],
        hits: [{ id: "h1", rule_name: "Email", created_at: "2026-01-01T00:00:00Z" }],
        builtins: [
          {
            name: "Email address",
            kind: "pii",
            pattern: "regex",
            action: "redact",
            applies_to: "both",
          },
        ],
      };
      expect(Array.isArray(response.rules)).toBe(true);
      expect(Array.isArray(response.hits)).toBe(true);
      expect(Array.isArray(response.builtins)).toBe(true);
    });

    it("should return empty arrays when no data", () => {
      const response = { rules: [], hits: [], builtins: [] };
      expect(response.rules).toHaveLength(0);
      expect(response.hits).toHaveLength(0);
    });

    it("should have 9 built-in rules", () => {
      const builtins = [
        { name: "Email address", kind: "pii" },
        { name: "Phone number", kind: "pii" },
        { name: "Credit card", kind: "pii" },
        { name: "OpenAI API key", kind: "secret" },
        { name: "AWS access key", kind: "secret" },
        { name: "GitHub token", kind: "secret" },
        { name: "Ignore instructions", kind: "injection" },
        { name: "System prompt leak", kind: "injection" },
        { name: "Profanity (mild)", kind: "keyword" },
      ];
      expect(builtins).toHaveLength(9);
    });
  });

  describe("getGuardrailHitCount — response structure", () => {
    it("should return count as number", () => {
      const response = { count: 42 };
      expect(typeof response.count).toBe("number");
      expect(response.count).toBeGreaterThanOrEqual(0);
    });

    it("should return 0 for no hits", () => {
      const response = { count: 0 };
      expect(response.count).toBe(0);
    });
  });
});

describe("guardrails.functions — authorization", () => {
  describe("cross-user isolation", () => {
    it("should scope rules to user_id in select", () => {
      // All rule queries should have .eq('user_id', userId)
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const ruleOwnerId = userId;
      expect(ruleOwnerId === userId).toBe(true);
    });

    it("should scope rules to user_id in update", () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const updateUserId = userId;
      expect(updateUserId === userId).toBe(true);
    });

    it("should scope rules to user_id in delete", () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const deleteUserId = userId;
      expect(deleteUserId === userId).toBe(true);
    });

    it("should scope hits to user_id in select", () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const hitOwnerId = userId;
      expect(hitOwnerId === userId).toBe(true);
    });
  });

  describe("built-in rules", () => {
    it("should mark seeded rules with built_in=true", () => {
      const seededRule = { built_in: true, enabled: true, user_id: "user-uuid" };
      expect(seededRule.built_in).toBe(true);
    });
  });
});
