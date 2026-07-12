import { describe, expect, test } from "bun:test";
import {
  INCIDENT_PREFIX,
  INCIDENT_TONE_VAR,
  incidentRealId,
  incidentTraceRef,
  incidentTone,
  type IncidentTone,
} from "../incident-format";

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENT_PREFIX - Engine-local trace prefix constant
// ─────────────────────────────────────────────────────────────────────────────
describe("INCIDENT_PREFIX", () => {
  test("is defined and is a string", () => {
    expect(typeof INCIDENT_PREFIX).toBe("string");
  });

  test("equals 'INC'", () => {
    expect(INCIDENT_PREFIX).toBe("INC");
  });

  test("is exactly 3 characters", () => {
    expect(INCIDENT_PREFIX.length).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INCIDENT_TONE_VAR - Severity tone to CSS variable mapping
// ─────────────────────────────────────────────────────────────────────────────
describe("INCIDENT_TONE_VAR", () => {
  test("is a Record with string values", () => {
    expect(typeof INCIDENT_TONE_VAR).toBe("object");
    Object.values(INCIDENT_TONE_VAR).forEach((val) => {
      expect(typeof val).toBe("string");
      expect(val).toContain("var(--");
    });
  });

  test("includes mapping for 'madder'", () => {
    expect(INCIDENT_TONE_VAR.madder).toBe("var(--madder)");
  });

  test("includes mapping for 'glacier'", () => {
    expect(INCIDENT_TONE_VAR.glacier).toBe("var(--text-subtle)");
  });

  test("includes mapping for 'marigold'", () => {
    expect(INCIDENT_TONE_VAR.marigold).toBe("var(--marigold)");
  });

  test("includes mapping for 'muted'", () => {
    expect(INCIDENT_TONE_VAR.muted).toBe("var(--text-muted)");
  });

  test("has exactly 4 tone mappings", () => {
    expect(Object.keys(INCIDENT_TONE_VAR).length).toBe(4);
  });

  test("all values are valid CSS var() strings", () => {
    Object.values(INCIDENT_TONE_VAR).forEach((val) => {
      expect(val.startsWith("var(--")).toBe(true);
      expect(val.endsWith(")")).toBe(true);
    });
  });

  test("includes all IncidentTone variants", () => {
    const tones: IncidentTone[] = ["madder", "glacier", "marigold", "muted"];
    tones.forEach((tone) => {
      expect(INCIDENT_TONE_VAR).toHaveProperty(tone);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// incidentRealId - Extract namespace-stripped id
// ─────────────────────────────────────────────────────────────────────────────
describe("incidentRealId", () => {
  test("strips namespace prefix before colon", () => {
    expect(incidentRealId("exec:12345678-1234-1234-1234-123456789012")).toBe(
      "12345678-1234-1234-1234-123456789012",
    );
  });

  test("handles 'cost:' namespace", () => {
    expect(incidentRealId("cost:abcdef")).toBe("abcdef");
  });

  test("handles 'guard:' namespace", () => {
    expect(incidentRealId("guard:xyz123")).toBe("xyz123");
  });

  test("returns id unchanged when no colon", () => {
    expect(incidentRealId("bare-id-no-namespace")).toBe("bare-id-no-namespace");
  });

  test("returns empty string after colon when id is blank", () => {
    expect(incidentRealId("exec:")).toBe("");
  });

  test("handles multiple colons (uses first)", () => {
    expect(incidentRealId("exec:part1:part2")).toBe("part1:part2");
  });

  test("handles UUID with dashes", () => {
    const id = "exec:550e8400-e29b-41d4-a716-446655440000";
    expect(incidentRealId(id)).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// incidentTone - Map incident kind to severity tone
// ─────────────────────────────────────────────────────────────────────────────
describe("incidentTone", () => {
  test("execution -> madder", () => {
    expect(incidentTone("execution")).toBe("madder");
  });

  test("pipeline -> madder", () => {
    expect(incidentTone("pipeline")).toBe("madder");
  });

  test("runaway -> madder", () => {
    expect(incidentTone("runaway")).toBe("madder");
  });

  test("guardrail -> glacier", () => {
    expect(incidentTone("guardrail")).toBe("glacier");
  });

  test("cost -> marigold", () => {
    expect(incidentTone("cost")).toBe("marigold");
  });

  test("manual -> muted", () => {
    expect(incidentTone("manual")).toBe("muted");
  });

  test("unknown kind defaults to muted", () => {
    expect(incidentTone("unknown" as any)).toBe("muted");
  });

  test("all kinds map to a valid tone", () => {
    const kinds = ["execution", "pipeline", "runaway", "guardrail", "cost", "manual"] as const;
    kinds.forEach((kind) => {
      const tone = incidentTone(kind);
      expect(["madder", "glacier", "marigold", "muted"]).toContain(tone);
    });
  });

  test("returns consistent tone for same kind", () => {
    expect(incidentTone("execution")).toBe(incidentTone("execution"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// incidentTraceRef - Generate trace reference with tone
// ─────────────────────────────────────────────────────────────────────────────
describe("incidentTraceRef", () => {
  test("includes INCIDENT_PREFIX", () => {
    const ref = incidentTraceRef("exec:550e8400-e29b-41d4-a716-446655440000");
    expect(ref).toContain("INC");
  });

  test("uses middle dot as separator", () => {
    const ref = incidentTraceRef("exec:550e8400-e29b-41d4-a716-446655440000");
    expect(ref).toContain("·");
  });

  test("extracts uuid part from namespaced id", () => {
    const ref = incidentTraceRef("exec:550e8400-e29b-41d4-a716-446655440000");
    // Should include first 6 alphanumerics of uuid in uppercase
    expect(ref).toContain("550E84");
  });

  test("strips namespace before processing", () => {
    const ref1 = incidentTraceRef("exec:550e8400-e29b-41d4-a716-446655440000");
    const ref2 = incidentTraceRef("550e8400-e29b-41d4-a716-446655440000");
    expect(ref1).toBe(ref2);
  });

  test("handles cost namespace", () => {
    const ref = incidentTraceRef("cost:123e4567-e89b-12d3-a456-426614174000");
    expect(ref).toContain("INC");
    expect(ref).toContain("·");
  });

  test("produces consistent trace ref for same id", () => {
    const ref1 = incidentTraceRef("exec:abc123def456");
    const ref2 = incidentTraceRef("exec:abc123def456");
    expect(ref1).toBe(ref2);
  });

  test("produces different refs for different ids", () => {
    const ref1 = incidentTraceRef("exec:abc123def456");
    const ref2 = incidentTraceRef("exec:xyz789uvw000");
    expect(ref1).not.toBe(ref2);
  });

  test("format is 'INC·XXXXXX' with 6-char code", () => {
    const ref = incidentTraceRef("exec:550e8400-e29b-41d4-a716-446655440000");
    const match = ref.match(/INC·[A-Z0-9]{6}$/);
    expect(match).toBeDefined();
  });
});
