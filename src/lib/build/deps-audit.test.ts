import { describe, it, expect } from "bun:test";
import {
  depsAuditGate,
  isDependencyManifest,
  lockfileDivergenceNote,
  normalizeDependabotAlert,
  summarizeDepAlerts,
  type DepAlert,
} from "./deps-audit";

const alert = (severity: DepAlert["severity"], pkg = "left-pad"): DepAlert => ({
  package: pkg,
  ecosystem: "npm",
  severity,
  summary: "",
  manifest: "package.json",
  patched_version: null,
  advisory_id: null,
});

describe("isDependencyManifest", () => {
  it("matches a manifest at the root or in a workspace", () => {
    expect(isDependencyManifest("package.json")).toBe(true);
    expect(isDependencyManifest("apps/web/package.json")).toBe(true);
    expect(isDependencyManifest("requirements.txt")).toBe(true);
  });

  it("does not match ordinary source or a lookalike name", () => {
    expect(isDependencyManifest("src/package.ts")).toBe(false);
    expect(isDependencyManifest("src/lib/package.json.ts")).toBe(false);
  });
});

describe("normalizeDependabotAlert", () => {
  it("reads a real-shaped alert", () => {
    const got = normalizeDependabotAlert({
      dependency: { manifest_path: "package.json" },
      security_vulnerability: {
        package: { name: "lodash", ecosystem: "npm" },
        severity: "high",
        first_patched_version: { identifier: "4.17.21" },
      },
      security_advisory: { summary: "Prototype pollution", ghsa_id: "GHSA-xxxx" },
    });
    expect(got).toEqual({
      package: "lodash",
      ecosystem: "npm",
      severity: "high",
      summary: "Prototype pollution",
      manifest: "package.json",
      patched_version: "4.17.21",
      advisory_id: "GHSA-xxxx",
    });
  });

  it('maps GitHub "moderate" onto the medium band', () => {
    const got = normalizeDependabotAlert({
      security_vulnerability: { package: { name: "a" }, severity: "moderate" },
    });
    expect(got?.severity).toBe("medium");
  });

  it("degrades to unknown rather than guessing at an unrecognised severity", () => {
    const got = normalizeDependabotAlert({
      security_vulnerability: { package: { name: "a" }, severity: "spicy" },
    });
    expect(got?.severity).toBe("unknown");
  });

  it("drops, rather than throws on, anything that is not a usable alert", () => {
    for (const bad of [null, undefined, 7, "x", [], {}, { security_vulnerability: {} }]) {
      expect(normalizeDependabotAlert(bad)).toBeNull();
    }
  });
});

describe("summarizeDepAlerts", () => {
  it("counts by severity and names the worst", () => {
    const s = summarizeDepAlerts([alert("low"), alert("critical"), alert("medium")]);
    expect(s.total).toBe(3);
    expect(s.by_severity.critical).toBe(1);
    expect(s.worst).toBe("critical");
  });

  it("has no worst when there is nothing", () => {
    expect(summarizeDepAlerts([]).worst).toBeNull();
  });
});

describe("depsAuditGate", () => {
  const clean = summarizeDepAlerts([]);

  it("never reports an unavailable audit as a clean one", () => {
    // THE HONESTY ASSERTION. "We could not look" and "there is nothing" are
    // different facts, and a reader must be able to tell them apart.
    const gate = depsAuditGate({
      available: false,
      unavailableReason: "Dependabot alerts are not enabled on this repo",
      summary: clean,
      touchesManifest: true,
    });
    expect(gate.mayProceed).toBe(true);
    expect(gate.reason).toContain("not a clean result");
    expect(gate.reason).toContain("not enabled");
  });

  it("passes a repo with no advisories", () => {
    const gate = depsAuditGate({ available: true, summary: clean, touchesManifest: true });
    expect(gate.mayProceed).toBe(true);
  });

  it("does not block a changeset for advisories it did not cause", () => {
    // A repo carrying twelve pre-existing advisories would otherwise block
    // every build forever, for something no work order can fix.
    const gate = depsAuditGate({
      available: true,
      summary: summarizeDepAlerts([alert("critical"), alert("high")]),
      touchesManifest: false,
    });
    expect(gate.mayProceed).toBe(true);
    expect(gate.reason).toContain("Reported, not blocking");
  });

  it("DOES block when this changeset edits a manifest and a critical or high is open", () => {
    const gate = depsAuditGate({
      available: true,
      summary: summarizeDepAlerts([alert("high")]),
      touchesManifest: true,
    });
    expect(gate.mayProceed).toBe(false);
    expect(gate.reason).toContain("patched version");
  });

  it("lets a manifest edit through when nothing open is critical or high", () => {
    const gate = depsAuditGate({
      available: true,
      summary: summarizeDepAlerts([alert("low"), alert("medium")]),
      touchesManifest: true,
    });
    expect(gate.mayProceed).toBe(true);
  });
});

describe("lockfileDivergenceNote", () => {
  it("is silent when no manifest is touched", () => {
    expect(lockfileDivergenceNote(["src/a.ts"])).toBe("");
    expect(lockfileDivergenceNote([])).toBe("");
  });

  it("states the consequence of the lockfile boundary rather than asking to cross it", () => {
    // STUDIO_FORBIDDEN_PREFIXES keeps Build out of lockfiles, and that stays.
    // The note exists so the consequence is disclosed, not so the rule bends.
    const note = lockfileDivergenceNote(["package.json", "src/a.ts"]);
    expect(note).toContain("package.json");
    expect(note).toContain("not allowed to stage a lockfile");
    expect(note).toContain("pull request body");
  });
});
