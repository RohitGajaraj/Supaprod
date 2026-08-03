/**
 * The screening floor is a promise, so it is checked like one.
 *
 * These assertions exist because the 2026-08-03 walkthrough found screening was a
 * property of WHICH USER was signed in: `loadGuardrails` filtered guardrail_rules
 * by user_id, so a workspace member who had configured nothing was screened by
 * nothing at all, while the Safety room showed them a colleague's incidents. The
 * floor is what makes workspace scoping safe rather than a downgrade, and a floor
 * nobody tests is a comment.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GUARDRAIL_FLOOR, withFloor } from "./guardrail-floor";
import { evaluateGuardrails, type GuardrailRule } from "./guardrails.server";

describe("the guardrail floor", () => {
  it("screens personal data, credentials and injection with no configuration at all", () => {
    // The case that matters: a brand new workspace, nothing set up, first call.
    const kinds = new Set(withFloor([]).map((r) => r.kind));
    expect(kinds.has("pii")).toBe(true);
    expect(kinds.has("secret")).toBe(true);
    expect(kinds.has("injection")).toBe(true);
  });

  it("redacts personal data rather than blocking it", () => {
    // Blocking a support transcript because it contains an email address breaks
    // the job the product exists to do. Redact is the gentlest action that works.
    for (const r of GUARDRAIL_FLOOR.filter((x) => x.kind === "pii")) {
      expect(r.action).toBe("redact");
    }
  });

  it("blocks credentials, because a leaked key is not recoverable", () => {
    for (const r of GUARDRAIL_FLOOR.filter((x) => x.kind === "secret")) {
      expect(r.action).toBe("block");
    }
  });

  it("actually fires on a real key and a real address", () => {
    const onKey = evaluateGuardrails(
      "here is the key sk-abcdefghijklmnopqrstuvwxyz012345",
      withFloor([]),
      "input",
    );
    expect(onKey.hits.some((h) => h.action === "block")).toBe(true);

    const onEmail = evaluateGuardrails("mail me at someone@example.com", withFloor([]), "input");
    expect(onEmail.hits.some((h) => h.action === "redact")).toBe(true);
  });

  it("does not double-count a workspace that installed the built-in catalogue", () => {
    // Two identical rules mean two hits for one leak, which makes the incident
    // count untrustworthy in the surface whose whole job is being trustworthy.
    const installed: GuardrailRule[] = [
      {
        id: "ws-1",
        name: "OpenAI API key",
        kind: "secret",
        pattern: "sk-[A-Za-z0-9]{20,}",
        action: "block",
        applies_to: "both",
        enabled: true,
      },
    ];
    const merged = withFloor(installed);
    expect(merged.filter((r) => r.pattern === "sk-[A-Za-z0-9]{20,}")).toHaveLength(1);
  });

  it("keeps a workspace's own additional rules", () => {
    const custom: GuardrailRule[] = [
      {
        id: "ws-2",
        name: "Internal codename",
        kind: "keyword",
        pattern: "projectfalcon",
        action: "redact",
        applies_to: "both",
        enabled: true,
      },
    ];
    expect(withFloor(custom).some((r) => r.id === "ws-2")).toBe(true);
  });

  it("stays in step with the built-in catalogue it mirrors", () => {
    // The floor is a separate literal from BUILTIN_SEED on purpose: that seed is a
    // catalogue a workspace may edit or delete, this is a floor it may not. The
    // cost of duplication is drift, so a pattern improved in one and not the other
    // is caught here rather than by a leak.
    const seed = readFileSync(join(import.meta.dir, "../guardrails.functions.ts"), "utf8");
    for (const rule of GUARDRAIL_FLOOR) {
      // Compare against the pattern AS IT APPEARS IN SOURCE. The seed holds a JS
      // string literal, so every backslash is doubled there; JSON.stringify
      // reproduces exactly that escaping, where a raw compare would never match.
      const asWrittenInSource = JSON.stringify(rule.pattern).slice(1, -1);
      expect(
        seed.includes(asWrittenInSource),
        `floor rule "${rule.name}" has a pattern BUILTIN_SEED no longer contains`,
      ).toBe(true);
    }
  });
});
