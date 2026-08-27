/**
 * F-118: THE AUDIT ROW THAT JUSTIFIED ACTING ALONE HAD NO READER.
 *
 * `decision-gate.server.ts` states the rule the whole autonomy design rests on:
 * *"an auto-approval nobody can audit is worse than a queue"*. It writes a
 * `workspace_audit_log` row carrying the gate's exact sentence and every fact it
 * acted on, under a comment saying "that row is what a human reads before
 * overturning".
 *
 * **No surface has ever read it.** Grepped across the whole tree: the only
 * readers of that table were the two writers and a billing card looking for
 * claim events. So the audit trail that justified letting the platform act
 * without a person existed as a promise and as rows, and never as something a
 * person could see.
 *
 * That is the same defect as F-116 one layer up, and this one had already been
 * argued for in writing. A rule stated in a comment above the code that writes
 * the row is not a rule anybody can check.
 *
 * ── WHY GUARDRAILS AND NOT A NEW PAGE ──────────────────────────────────────
 * Guardrails is where a person sets what the crew may do without them. What the
 * crew then DID without them belongs on the same page, or the policy is set in
 * one place and exercised somewhere invisible. Governance canon: policy is set
 * in advance and does not block. This is that policy's receipt.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { AUTO_CLEARED_ACTION } from "@/lib/spec-gate.constants";

const FNS_RAW = readFileSync(
  fileURLToPath(new URL("./guardrails.functions.ts", import.meta.url)),
  "utf8",
);
/*
 * WHITESPACE-NORMALISED, because Prettier reflows JSX text.
 *
 * The first version of this file asserted on contiguous source strings and
 * failed on copy that was in the file and correct: Prettier had wrapped a
 * sentence across three lines with indentation between the words. A test that
 * fails on formatting teaches people to weaken it, so the search space is
 * flattened once, here, and every assertion below reads the flattened form.
 */
const flat = (t: string) => t.replace(/\s+/g, " ");

const FNS = flat(FNS_RAW);

const PANEL = flat(
  readFileSync(
    fileURLToPath(new URL("../components/governance/GuardrailsPanel.tsx", import.meta.url)),
    "utf8",
  ),
);

describe("the rows are read", () => {
  it("the overview reads both gates' audit actions", () => {
    expect(FNS).toContain('.in("action", [AUTO_APPROVED_ACTION, AUTO_CLEARED_ACTION])');
  });

  it("it names the actions by their constants, so a rename cannot silently unhook it", () => {
    expect(FNS).toContain('from "@/lib/decision-gate.server"');
    expect(FNS).toContain('from "@/lib/spec-gate.constants"');
  });

  it("and the panel renders them", () => {
    expect(PANEL).toContain("What your crew decided alone");
    expect(PANEL).toContain("decidedAlone.map");
  });
});

describe("what a person is actually shown", () => {
  it("the gate's own sentence, not a summary of it", () => {
    // Stored verbatim by both writers precisely so the person reads the sentence
    // the writer acted on rather than a reconstruction of it.
    expect(FNS).toContain('typeof d.reason === "string" ? d.reason : null');
    expect(PANEL).toContain("{d.reason ??");
  });

  it("plain words for what moved, never the action slug", () => {
    expect(FNS).toContain('"A spec cleared its review"');
    expect(FNS).toContain('"A decision landed"');
    // The raw slug must not reach the screen.
    expect(PANEL).not.toContain(AUTO_CLEARED_ACTION);
    expect(PANEL).not.toContain("decision.auto_approved");
  });

  it("a missing reason is reported as a fact, not hidden", () => {
    // A silent approval with no stored reason is the worst row in the table and
    // the one a person most needs to see.
    expect(PANEL).toContain("No reason was stored, which is itself worth knowing");
  });

  it("and an empty list says which of the two silences it is", () => {
    // "Nothing has met the bar" and "nothing came up" send a person to
    // completely different places, and a bare "nothing yet" says neither.
    expect(PANEL).toContain("nothing has met the bar yet");
    expect(PANEL).toContain("nothing has come up that could be decided this way");
  });
});

describe("a failed read stopped being reported as an empty one", () => {
  it("the overview carries the error out", () => {
    /*
     * `rulesRes.data ?? []` was reading only `data`, so a refused query arrived
     * as "no rules" and the page said "Nothing checks your AI calls yet" over a
     * table it could not read. F-76, inside the function whose own comment
     * describes fixing the previous version of this same class of bug.
     */
    expect(FNS).toContain("const readFailed =");
    expect(FNS).toContain("rulesRes.error?.message");
    expect(FNS).toContain("hitsRes.error?.message");
    expect(FNS).toContain("aloneRes.error?.message");
  });
});

describe("the user-facing copy carries no machine punctuation", () => {
  /*
   * Standing founder instruction, given twice: no em dashes, no en dashes,
   * nothing that reads as machine-written, anywhere a person can see it. This
   * asserts it on the strings this commit added rather than on the whole file,
   * because a scan that covers everything gets widened the first time it fails.
   */
  const ADDED = [
    "What your crew decided alone",
    "Every time the platform acted without asking you, and the reason it acted on. Change any of these by overturning them; the record stays.",
    "Nothing has been decided without you.",
    "No reason was stored, which is itself worth knowing.",
    "A spec cleared its review",
    "A decision landed",
  ];

  it.each(ADDED)("%s has no em or en dash", (line) => {
    expect(line).not.toMatch(/[–—]/);
  });

  it("and every one of them is actually in the shipped files", () => {
    // Otherwise the test above proves a property of strings in a test file.
    for (const line of ADDED) {
      expect(FNS.includes(line) || PANEL.includes(line), line).toBe(true);
    }
  });
});
