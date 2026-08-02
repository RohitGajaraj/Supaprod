import { describe, it, expect } from "bun:test";
import {
  addedLines,
  scanStagedChangesForSecrets,
  describeStagedSecrets,
  SECRET_SCAN_LINE_BUDGET,
} from "./secret-scan";

// Structurally valid shapes drawn from EGRESS_SECRET_RULES. Assembled at
// runtime so this file never itself contains a literal that a future scanner
// (ours, GitHub's push protection, or anyone's) would flag on sight.
const AWS_KEY = `AKIA${"A1B2C3D4E5F6G7H8"}`;
const GITHUB_TOKEN = `ghp_${"a".repeat(36)}`;
const OPENAI_KEY = `sk-${"B".repeat(32)}`;

describe("addedLines", () => {
  it("treats every non-blank line of a create as added", () => {
    const added = addedLines({ path: "a.ts", op: "create", new_content: "one\n\ntwo" });
    expect(added).toEqual([
      { line: 1, text: "one" },
      { line: 3, text: "two" },
    ]);
  });

  it("reports nothing for a delete", () => {
    expect(
      addedLines({ path: "a.ts", op: "delete", base_content: "secret", new_content: null }),
    ).toEqual([]);
  });

  it("counts only lines whose exact text is not already in the base", () => {
    const added = addedLines({
      path: "a.ts",
      op: "update",
      base_content: "keep\nold",
      new_content: "keep\nfresh",
    });
    expect(added).toEqual([{ line: 2, text: "fresh" }]);
  });

  it("does not report a line that merely moved", () => {
    // THE REASON THIS IS EXACT-TEXT AND NOT AN LCS DIFF: reordering a file must
    // not read as writing every line in it.
    const added = addedLines({
      path: "a.ts",
      op: "update",
      base_content: "alpha\nbeta\ngamma",
      new_content: "gamma\nalpha\nbeta",
    });
    expect(added).toEqual([]);
  });

  it("numbers lines against the STAGED file, which is where a person will look", () => {
    const added = addedLines({
      path: "a.ts",
      op: "update",
      base_content: "one\ntwo",
      new_content: "one\ntwo\nthree",
    });
    expect(added).toEqual([{ line: 3, text: "three" }]);
  });
});

describe("scanStagedChangesForSecrets", () => {
  it("is clean on ordinary source", () => {
    const scan = scanStagedChangesForSecrets([
      { path: "src/a.ts", op: "create", new_content: "export const risk = 1;\n" },
    ]);
    expect(scan.blocked).toBe(false);
    expect(scan.findings).toEqual([]);
  });

  it("finds a credential on an added line and reports path, line, and TYPE", () => {
    const scan = scanStagedChangesForSecrets([
      {
        path: "src/config.ts",
        op: "create",
        new_content: `const region = "us-east-1";\nconst key = "${AWS_KEY}";\n`,
      },
    ]);
    expect(scan.blocked).toBe(true);
    expect(scan.findings).toEqual([{ path: "src/config.ts", line: 2, type: "AWS access key id" }]);
  });

  it("never returns the matched value anywhere in the result", () => {
    const scan = scanStagedChangesForSecrets([
      { path: "a.ts", op: "create", new_content: `token = "${GITHUB_TOKEN}"` },
    ]);
    // THE INVARIANT THAT MATTERS MOST. This result becomes a tool result,
    // which becomes a prompt, which becomes a stored run trail.
    expect(JSON.stringify(scan)).not.toContain(GITHUB_TOKEN);
    expect(describeStagedSecrets(scan)).not.toContain(GITHUB_TOKEN);
  });

  it("does NOT fire on a credential that was already in the file", () => {
    // A repo carrying a secret must not become un-editable: an agent fixing an
    // unrelated function in that file would otherwise be blocked with no action
    // it could take, and a floor whose only escape is "give up" gets routed
    // around rather than obeyed.
    const line = `const key = "${AWS_KEY}";`;
    const scan = scanStagedChangesForSecrets([
      {
        path: "src/config.ts",
        op: "update",
        base_content: `${line}\nexport const a = 1;`,
        new_content: `${line}\nexport const a = 2;`,
      },
    ]);
    expect(scan.blocked).toBe(false);
  });

  it("fires when the credential is the newly written line in an otherwise old file", () => {
    const scan = scanStagedChangesForSecrets([
      {
        path: "src/config.ts",
        op: "update",
        base_content: "export const a = 1;",
        new_content: `export const a = 1;\nconst key = "${OPENAI_KEY}";`,
      },
    ]);
    expect(scan.blocked).toBe(true);
    expect(scan.findings[0]).toMatchObject({ path: "src/config.ts", line: 2 });
  });

  it("ignores a deleted file entirely", () => {
    const scan = scanStagedChangesForSecrets([
      { path: "old.ts", op: "delete", base_content: `k = "${AWS_KEY}"`, new_content: null },
    ]);
    expect(scan.blocked).toBe(false);
  });

  it("does not trip on the pattern SOURCE that defines these rules", () => {
    // The regexes themselves live in this repo, and a scanner that blocked the
    // file defining it would be self-defeating.
    const scan = scanStagedChangesForSecrets([
      {
        path: "src/lib/egress-guardrails.ts",
        op: "update",
        new_content: 'secretRule("egress-aws-akid", "AWS access key id", "AKIA[0-9A-Z]{16}"),',
      },
    ]);
    expect(scan.blocked).toBe(false);
  });

  it("does not trip on ordinary hyphenated prose or identifiers", () => {
    const scan = scanStagedChangesForSecrets([
      {
        path: "docs.ts",
        op: "create",
        new_content: "// risk-management-system-overview and task-oriented-workflows\n",
      },
    ]);
    expect(scan.blocked).toBe(false);
  });

  it("reports truncation rather than silently scanning less", () => {
    const many = Array.from({ length: 50 }, (_, i) => `line ${i}`).join("\n");
    const scan = scanStagedChangesForSecrets([{ path: "a.ts", op: "create", new_content: many }], {
      lineBudget: 10,
    });
    expect(scan.truncated).toBe(true);
    expect(scan.added_lines_scanned).toBe(10);
  });

  it("is totally defined on empty and malformed input", () => {
    expect(scanStagedChangesForSecrets([]).blocked).toBe(false);
    expect(
      scanStagedChangesForSecrets([{ path: "a", op: "create", new_content: null }]).blocked,
    ).toBe(false);
    expect(SECRET_SCAN_LINE_BUDGET).toBeGreaterThan(0);
  });

  it("is idempotent", () => {
    const changes = [{ path: "a.ts", op: "create", new_content: `k = "${AWS_KEY}"` }];
    expect(scanStagedChangesForSecrets(changes)).toEqual(scanStagedChangesForSecrets(changes));
  });
});

describe("describeStagedSecrets", () => {
  it("is empty for a clean scan", () => {
    expect(
      describeStagedSecrets({
        blocked: false,
        findings: [],
        files_scanned: 0,
        added_lines_scanned: 0,
        truncated: false,
      }),
    ).toBe("");
  });

  it("names path, line, and kind so the fix is one re-stage away", () => {
    const msg = describeStagedSecrets({
      blocked: true,
      findings: [{ path: "src/a.ts", line: 12, type: "AWS access key id" }],
      files_scanned: 1,
      added_lines_scanned: 40,
      truncated: false,
    });
    expect(msg).toContain("src/a.ts:12");
    expect(msg).toContain("AWS access key id");
    expect(msg).toContain("StagedSecretDetected");
  });

  it("caps the list but always states the true count", () => {
    const findings = Array.from({ length: 9 }, (_, i) => ({
      path: `f${i}.ts`,
      line: i + 1,
      type: "GitHub token",
    }));
    const msg = describeStagedSecrets(
      { blocked: true, findings, files_scanned: 9, added_lines_scanned: 9, truncated: false },
      3,
    );
    expect(msg).toContain("and 6 more");
    expect(msg).not.toContain("f8.ts");
  });
});
