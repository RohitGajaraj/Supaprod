import { describe, expect, test } from "bun:test";
import {
  INCIDENT_PREFIX,
  INCIDENT_VALUE_TONE,
  incidentRealId,
  incidentTraceRef,
  incidentTraceRefs,
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
// INCIDENT_VALUE_TONE - Severity tone to the `Value` primitive's vocabulary.
//
// This replaced INCIDENT_TONE_VAR on 2026-07-29. The old map handed back raw
// CSS variables from the retired palette, which is how a panel ends up drawing
// its own colour; the stylesheet owns every mix now, so a panel asks for a tone
// and never for a hue. The tests below assert the CONTRACT the panel depends
// on, which is that every incident kind lands on one of the four tones `Value`
// knows and that a failure never reads as quiet.
// ─────────────────────────────────────────────────────────────────────────────
const VALUE_TONES = ["quiet", "pass", "warn", "fail"] as const;

describe("INCIDENT_VALUE_TONE", () => {
  test("is a Record whose every value is a tone the Value primitive accepts", () => {
    expect(typeof INCIDENT_VALUE_TONE).toBe("object");
    Object.values(INCIDENT_VALUE_TONE).forEach((val) => {
      expect(VALUE_TONES).toContain(val);
    });
  });

  test("carries no CSS variable: colour is the stylesheet's job, not the map's", () => {
    Object.values(INCIDENT_VALUE_TONE).forEach((val) => {
      expect(val).not.toContain("var(--");
    });
  });

  test("'madder' is a failure, so it reads as fail", () => {
    expect(INCIDENT_VALUE_TONE.madder).toBe("fail");
  });

  test("'glacier' is a category, not a status, so it stays quiet", () => {
    expect(INCIDENT_VALUE_TONE.glacier).toBe("quiet");
  });

  test("'marigold' is caution, so it reads as warn", () => {
    expect(INCIDENT_VALUE_TONE.marigold).toBe("warn");
  });

  test("'muted' stays quiet", () => {
    expect(INCIDENT_VALUE_TONE.muted).toBe("quiet");
  });

  test("has exactly 4 tone mappings", () => {
    expect(Object.keys(INCIDENT_VALUE_TONE).length).toBe(4);
  });

  test("includes all IncidentTone variants", () => {
    const tones: IncidentTone[] = ["madder", "glacier", "marigold", "muted"];
    tones.forEach((tone) => {
      expect(INCIDENT_VALUE_TONE).toHaveProperty(tone);
    });
  });

  test("every incident kind resolves to a tone the Value primitive accepts", () => {
    const kinds = ["execution", "pipeline", "runaway", "guardrail", "cost", "manual"] as const;
    kinds.forEach((kind) => {
      expect(VALUE_TONES).toContain(INCIDENT_VALUE_TONE[incidentTone(kind)]);
    });
  });

  test("a run that failed never reads as quiet", () => {
    (["execution", "pipeline", "runaway"] as const).forEach((kind) => {
      expect(INCIDENT_VALUE_TONE[incidentTone(kind)]).toBe("fail");
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

  test("handles three-level namespace nesting (still splits on the first colon only)", () => {
    expect(incidentRealId("exec:namespace:inner:abc123")).toBe("namespace:inner:abc123");
  });

  test("handles empty namespace (colon at start)", () => {
    expect(incidentRealId(":abc123")).toBe("abc123");
  });

  test("handles empty string", () => {
    expect(incidentRealId("")).toBe("");
  });

  test("handles a lone colon", () => {
    expect(incidentRealId(":")).toBe("");
  });

  test("handles consecutive colons (keeps the second one in the tail)", () => {
    expect(incidentRealId("exec::abc")).toBe(":abc");
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

  test("multi-colon namespaces: only the first colon is stripped, the rest feeds traceRef", () => {
    // incidentRealId keeps "ns:inner:a1b2c3d4" (colons intact past the first),
    // so traceRef's alphanumeric-only, first-6 rule reads "nsinne", not the uuid tail.
    expect(incidentTraceRef("exec:ns:inner:a1b2c3d4")).toBe("INC·NSINNE");
  });

  test("strips non-alphanumeric characters (hyphens) from a non-UUID real id", () => {
    expect(incidentTraceRef("exec:xyz-123-abc")).toBe("INC·XYZ123");
  });

  test("handles real ids with fewer than 6 alphanumeric characters", () => {
    expect(incidentTraceRef("exec:a1b")).toBe("INC·A1B");
  });

  test("handles an empty real id after the namespace", () => {
    expect(incidentTraceRef("exec:")).toBe("INC·");
  });
});

/**
 * Set-wide trace refs (2026-08-03).
 *
 * All seven incidents in the live Engine room rendered the identical tag
 * `INC.600000`, because every seeded id begins `60000000-` and a short is the
 * first six alphanumerics. A reference that cannot tell two records apart is an
 * audit trail failing at its only job.
 */
describe("incidentTraceRefs", () => {
  const seeded = (tail: string) => `guard:60000000-0005-4000-8000-${tail}`;

  test("gives colliding incidents distinct refs", () => {
    const ids = [seeded("000000000001"), seeded("000000000002"), seeded("000000000003")];
    const refs = incidentTraceRefs(ids);
    expect(new Set(refs.values()).size).toBe(3);
  });

  test("leaves a non-colliding incident on its existing six-char ref", () => {
    // The tag people may already have written down must not move underneath them.
    const ids = ["guard:a1b2c3d4-0000-0000-0000-000000000001", seeded("000000000009")];
    expect(incidentTraceRefs(ids).get(ids[0])).toBe("INC·A1B2C3");
  });

  test("extends only as far as it must", () => {
    // These differ at the SEVENTH hex character, so seven is enough and the
    // extension must stop there rather than running to the full 32.
    const ids = [
      "guard:600000a0-0000-0000-0000-000000000001",
      "guard:600000b0-0000-0000-0000-000000000002",
    ];
    for (const r of incidentTraceRefs(ids).values()) {
      expect(r.split("·")[1]).toHaveLength(7);
    }
  });

  test("returns a ref for every id it was given", () => {
    const ids = [
      seeded("000000000001"),
      seeded("000000000002"),
      "guard:ffffffff-0000-0000-0000-000000000000",
    ];
    expect(incidentTraceRefs(ids).size).toBe(3);
  });
});
