import { describe, expect, test } from "bun:test";
import {
  INCIDENT_PREFIX,
  incidentRealId,
  incidentTraceRef,
  incidentTone,
  INCIDENT_TONE_VAR,
} from "./incident-format";

describe("incidentRealId", () => {
  test("strips the source namespace prefix", () => {
    expect(incidentRealId("exec:a1b2c3d4-0000-0000-0000-000000000000")).toBe(
      "a1b2c3d4-0000-0000-0000-000000000000",
    );
    expect(incidentRealId("budget_alert:ff00")).toBe("ff00");
  });
  test("returns the id unchanged when there is no namespace", () => {
    expect(incidentRealId("plain-id")).toBe("plain-id");
  });
});

describe("incidentTraceRef", () => {
  test("prefixes INC and reads the underlying record id via the shared traceRef", () => {
    expect(incidentTraceRef("cost:ff00aa11-2222-3333-4444-555566667777")).toBe("INC\u00b7FF00AA");
    expect(INCIDENT_PREFIX).toBe("INC");
  });
});

describe("incidentTone — severity roles", () => {
  test("failures read the alert role", () => {
    expect(incidentTone("execution")).toBe("madder");
    expect(incidentTone("pipeline")).toBe("madder");
    expect(incidentTone("runaway")).toBe("madder");
  });
  test("a guardrail block reads neutral (a category tag, not a live status), cost reads caution, manual is quiet", () => {
    expect(incidentTone("guardrail")).toBe("glacier");
    expect(incidentTone("cost")).toBe("marigold");
    expect(incidentTone("manual")).toBe("muted");
  });
  test("unknown incident kinds fall back to the muted tone (defensive default)", () => {
    // This tests the fallback `KIND_TONE[kind] ?? "muted"` for unknown kinds
    expect(incidentTone("unknown" as never)).toBe("muted");
  });
});

describe("INCIDENT_TONE_VAR — CSS variable mapping", () => {
  test("maps all incident tones to valid CSS variables", () => {
    expect(INCIDENT_TONE_VAR.madder).toBe("var(--madder)");
    expect(INCIDENT_TONE_VAR.glacier).toBe("var(--text-subtle)");
    expect(INCIDENT_TONE_VAR.marigold).toBe("var(--marigold)");
    expect(INCIDENT_TONE_VAR.muted).toBe("var(--text-muted)");
  });

  test("has entries for all known incident tones", () => {
    expect(Object.keys(INCIDENT_TONE_VAR)).toHaveLength(4);
    expect(Object.keys(INCIDENT_TONE_VAR)).toContain("madder");
    expect(Object.keys(INCIDENT_TONE_VAR)).toContain("glacier");
    expect(Object.keys(INCIDENT_TONE_VAR)).toContain("marigold");
    expect(Object.keys(INCIDENT_TONE_VAR)).toContain("muted");
  });

  test("all values are valid CSS var() expressions", () => {
    for (const [tone, cssVar] of Object.entries(INCIDENT_TONE_VAR)) {
      expect(cssVar).toMatch(/^var\(--[\w-]+\)$/);
    }
  });
});
