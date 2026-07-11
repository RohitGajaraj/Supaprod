import { describe, expect, test } from "bun:test";
import {
  CONSENT_PHILOSOPHY,
  CONSEQUENCE_CLASS_ORDER,
  classifyConsequence,
  consequenceClass,
  groupToolsByConsequenceClass,
} from "./consent-classes";

describe("classifyConsequence", () => {
  test("non-side-effecting / uncatalogued reads are read-only research", () => {
    // Not in the consequence catalogue => reads, nothing to undo.
    expect(classifyConsequence("research.search")).toBe("read-only");
    expect(classifyConsequence("nope.unknown")).toBe("read-only");
    expect(classifyConsequence(null)).toBe("read-only");
    expect(classifyConsequence(undefined)).toBe("read-only");
  });

  test("side-effecting workspace-internal tools are internal writes", () => {
    expect(classifyConsequence("tasks.create")).toBe("internal-write");
    expect(classifyConsequence("notes.create")).toBe("internal-write");
    expect(classifyConsequence("memory.remember")).toBe("internal-write");
    expect(classifyConsequence("mission.plan")).toBe("internal-write");
  });

  test("external but reversible tools are stakeholder-facing", () => {
    // github.pr.open / issue.create / calendar.create are external + reversible
    // (medium blast radius) => draft-to-you, batch-approve.
    expect(classifyConsequence("github.pr.open")).toBe("stakeholder");
    expect(classifyConsequence("github.issue.create")).toBe("stakeholder");
    expect(classifyConsequence("calendar.create")).toBe("stakeholder");
    expect(classifyConsequence("prd.link_issue")).toBe("stakeholder");
  });

  test("external + high blast radius (irreversible / commits) are repo writes", () => {
    expect(classifyConsequence("studio.pr.merge")).toBe("repo-write"); // irreversible
    expect(classifyConsequence("studio.commit")).toBe("repo-write"); // external partial => high
    expect(classifyConsequence("github.commit.append")).toBe("repo-write");
    expect(classifyConsequence("delegate.openhands")).toBe("repo-write"); // irreversible external
  });
});

describe("default posture per class (trust ladder RPT-17)", () => {
  test("read-only auto-runs", () => {
    const p = consequenceClass("read-only").defaultPosture;
    expect(p.posture).toBe("auto-run");
    expect(p.mode).toBe("auto");
  });

  test("internal writes ask first", () => {
    const p = consequenceClass("internal-write").defaultPosture;
    expect(p.posture).toBe("ask-first");
    expect(p.mode).toBe("confirm");
  });

  test("stakeholder-facing drafts to you (auto-send opt-in)", () => {
    const p = consequenceClass("stakeholder").defaultPosture;
    expect(p.posture).toBe("draft-to-you");
    expect(p.mode).toBe("confirm");
  });

  test("repo writes are always gated for review", () => {
    const p = consequenceClass("repo-write").defaultPosture;
    expect(p.posture).toBe("always-gate");
    expect(p.mode).toBe("review");
  });
});

describe("groupToolsByConsequenceClass", () => {
  const names = [
    "research.search", // read-only
    "tasks.create", // internal
    "github.pr.open", // stakeholder
    "studio.pr.merge", // repo
    "notes.create", // internal
  ];

  test("returns every class in floor-to-ceiling render order", () => {
    const groups = groupToolsByConsequenceClass(names, (n) => n);
    expect(groups.map((g) => g.id)).toEqual([...CONSEQUENCE_CLASS_ORDER]);
  });

  test("partitions tools into the right class, preserving input order", () => {
    const groups = groupToolsByConsequenceClass(names, (n) => n);
    const byId = Object.fromEntries(groups.map((g) => [g.id, g.tools]));
    expect(byId["read-only"]).toEqual(["research.search"]);
    expect(byId["internal-write"]).toEqual(["tasks.create", "notes.create"]);
    expect(byId["stakeholder"]).toEqual(["github.pr.open"]);
    expect(byId["repo-write"]).toEqual(["studio.pr.merge"]);
  });

  test("keeps the original item shape so callers can render display names", () => {
    const items = [
      { tool_name: "research.search", display_name: "Search" },
      { tool_name: "studio.commit", display_name: "Commit" },
    ];
    const groups = groupToolsByConsequenceClass(items, (t) => t.tool_name);
    const repo = groups.find((g) => g.id === "repo-write")!;
    expect(repo.tools).toEqual([{ tool_name: "studio.commit", display_name: "Commit" }]);
  });

  test("empty input yields all classes with empty tool lists", () => {
    const groups = groupToolsByConsequenceClass([], (n: string) => n);
    expect(groups).toHaveLength(CONSEQUENCE_CLASS_ORDER.length);
    expect(groups.every((g) => g.tools.length === 0)).toBe(true);
  });

  test("philosophy line is present and auto-send-safe", () => {
    expect(CONSENT_PHILOSOPHY).toContain("Cadence drafts, you release");
  });
});
