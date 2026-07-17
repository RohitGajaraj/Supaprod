import { describe, it, expect } from "bun:test";
import {
  AUDIT_KINDS,
  auditShort,
  formatAuditId,
  parseAuditId,
  findAuditIds,
  auditKindMeta,
} from "./audit-id";

describe("audit-id · auditShort", () => {
  it("takes the first six alphanumerics, uppercased (mirrors traceRef)", () => {
    expect(auditShort("005c82ab-1234-...")).toBe("005C82");
    expect(auditShort("7e7d59")).toBe("7E7D59");
    expect(auditShort("ab")).toBe("AB");
  });
});

describe("audit-id · formatAuditId", () => {
  it("builds the canonical PREFIX·SHORT tag per kind", () => {
    expect(formatAuditId("opportunity", "005c82ab")).toBe("OPP·005C82");
    expect(formatAuditId("mission", "7e7d59ff")).toBe("MIS·7E7D59");
    expect(formatAuditId("decision", "8976c0aa")).toBe("DEC·8976C0");
    expect(formatAuditId("signal", "37af77bb")).toBe("SIG·37AF77");
    expect(formatAuditId("spec", "abf938cc")).toBe("PRD·ABF938");
  });
});

describe("audit-id · every kind has a table + prefix", () => {
  it("maps every core entity to a real table + a unique prefix", () => {
    expect(AUDIT_KINDS.length).toBe(12);
    // prefixes are unique (no two kinds collide on a tag)
    const prefixes = AUDIT_KINDS.map((k) => k.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
    // the five loop-stage entities keep their canonical prefixes
    expect(AUDIT_KINDS.find((k) => k.kind === "signal")?.prefix).toBe("SIG");
    expect(AUDIT_KINDS.find((k) => k.kind === "mission")?.prefix).toBe("MIS");
    // the founder's additions (learnings, memories, ...) are traceable too
    expect(AUDIT_KINDS.find((k) => k.kind === "learning")?.table).toBe("learnings");
    expect(AUDIT_KINDS.find((k) => k.kind === "memory")?.table).toBe("agent_memory");
    for (const k of AUDIT_KINDS) expect(auditKindMeta(k.kind)).toBe(k);
  });
});

describe("audit-id · parseAuditId", () => {
  it("parses the middot form (as shown on cards)", () => {
    expect(parseAuditId("OPP·005C82")).toMatchObject({ kind: "opportunity", short: "005C82" });
  });
  it("parses hyphen, colon, underscore, slash, and space forms", () => {
    expect(parseAuditId("MIS-0674")?.kind).toBe("mission");
    expect(parseAuditId("dec:8976c0")).toMatchObject({ kind: "decision", short: "8976C0" });
    expect(parseAuditId("sig_37af77")?.kind).toBe("signal");
    expect(parseAuditId("prd/abf938")?.kind).toBe("spec");
    expect(parseAuditId("mis 7e7d59")).toMatchObject({ kind: "mission", short: "7E7D59" });
  });
  it("is case-insensitive and trims", () => {
    expect(parseAuditId("  opp·005c82  ")).toMatchObject({ kind: "opportunity", short: "005C82" });
  });
  it("rejects unknown prefixes and malformed tokens", () => {
    expect(parseAuditId("XYZ·123456")).toBeNull();
    expect(parseAuditId("just some text")).toBeNull();
    expect(parseAuditId("OPP")).toBeNull();
    expect(parseAuditId("")).toBeNull();
  });
});

describe("audit-id · findAuditIds", () => {
  it("extracts known ids from a free-text Ask query, de-duplicated", () => {
    const found = findAuditIds(
      "what happened with MIS·7E7D59 and OPP·005C82? and MIS·7E7D59 again",
    );
    expect(found.map((f) => `${f.kind}:${f.short}`)).toEqual([
      "mission:7E7D59",
      "opportunity:005C82",
    ]);
  });
  it("does not false-match ordinary prose (needs a real prefix + separator)", () => {
    expect(findAuditIds("re-run the plan for next quarter")).toEqual([]);
    expect(findAuditIds("the-team shipped it")).toEqual([]);
  });
});
