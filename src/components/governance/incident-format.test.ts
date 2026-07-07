import { describe, expect, test } from "bun:test";
import {
  INCIDENT_PREFIX,
  incidentRealId,
  incidentTraceRef,
  incidentTone,
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
  test("a guardrail block reads the machine voice, cost reads caution, manual is quiet", () => {
    expect(incidentTone("guardrail")).toBe("glacier");
    expect(incidentTone("cost")).toBe("marigold");
    expect(incidentTone("manual")).toBe("muted");
  });
});
