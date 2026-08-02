import { describe, it, expect } from "bun:test";
import { GATE_CODES, classifyFailureCode, isGateCode, noteGate } from "./gates";

describe("gate vocabulary", () => {
  it("prefixes every gate code so a refusal is separable from a failure", () => {
    for (const code of Object.values(GATE_CODES)) {
      expect(isGateCode(code)).toBe(true);
    }
  });

  it("does not treat a failure kind as a gate", () => {
    // These are the strings agent_runs.failure_kind already stores, so both
    // vocabularies land in ai_events.error_code and must stay tellable apart.
    for (const kind of ["timeout", "model_error", "tool_error", "unknown"]) {
      expect(isGateCode(kind)).toBe(false);
    }
    expect(isGateCode(null)).toBe(false);
    expect(isGateCode(undefined)).toBe(false);
  });

  it("keeps every code unique, so a count never merges two boundaries", () => {
    const codes = Object.values(GATE_CODES);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("classifyFailureCode (AFD-06 taxonomy, moved not changed)", () => {
  it("maps the taxonomy the way the chokepoint always did", () => {
    expect(classifyFailureCode("Request timed out after 30s")).toBe("timeout");
    expect(classifyFailureCode("The operation was aborted")).toBe("user_aborted");
    expect(classifyFailureCode("HTTP 402 credits exhausted")).toBe("budget_kill");
    expect(classifyFailureCode("Blocked by guardrail: no secrets")).toBe("guardrail_block");
    expect(classifyFailureCode("permission denied for table")).toBe("rls_denied");
    expect(classifyFailureCode("tool call failed")).toBe("tool_error");
    expect(classifyFailureCode("upstream returned 500")).toBe("model_error");
  });

  it("says unknown rather than guessing when there is no message", () => {
    expect(classifyFailureCode(null)).toBe("unknown");
    expect(classifyFailureCode(undefined)).toBe("unknown");
    expect(classifyFailureCode("")).toBe("unknown");
  });

  it("is case insensitive, because provider error strings are not consistent", () => {
    expect(classifyFailureCode("TIMED OUT")).toBe("timeout");
    expect(classifyFailureCode("Forbidden")).toBe("rls_denied");
  });
});

describe("noteGate (vendor forward)", () => {
  it("no-ops and reports false with no PostHog key, which is today's state", async () => {
    const previous = process.env.POSTHOG_API_KEY;
    delete process.env.POSTHOG_API_KEY;
    try {
      const sent = await noteGate(GATE_CODES.kill_switch, {
        userId: "user-1",
        surface: "chat",
        model: "google/gemini-2.5-flash",
        workspaceId: "ws-1",
      });
      expect(sent).toBe(false);
    } finally {
      if (previous !== undefined) process.env.POSTHOG_API_KEY = previous;
    }
  });

  it("never throws, whatever the context carries", async () => {
    const previous = process.env.POSTHOG_API_KEY;
    delete process.env.POSTHOG_API_KEY;
    try {
      await expect(noteGate(GATE_CODES.guardrail_block, { userId: "", surface: "" })).resolves.toBe(
        false,
      );
    } finally {
      if (previous !== undefined) process.env.POSTHOG_API_KEY = previous;
    }
  });
});
