/**
 * A WRONG RECORD IS WORSE THAN NO RECORD.
 *
 * `studio.stage` writes `.supaprod/intent.md`, `spec.md` and `plan.md` into the
 * customer's repository, so what a merge lands is a claim about what was
 * decided. Read on PR #5 by A1: the plan mixed two generations of the same
 * tasks, and the intent was placeholders.
 *
 * The three causes were all "the reader asked a wider question than the file
 * answers", which is the same shape three times:
 *
 *   members were read whether or not they had been SUPERSEDED,
 *   tasks were read whether or not they belonged to the SPEC being rendered,
 *   and the intent was read only from `decisions.intent`, which is populated on
 *     five of 422 rows -- while the same work's intent sits in the spec's
 *     contract one row away.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { intentMd, PLAYBOOK_DIR } from "@/lib/spine/playbook-files";
import { recordFilesLine, type ChangedFile } from "@/lib/spine/what-the-merge-gate-shows";

const SERVER = readFileSync("src/lib/spine/playbook-files.server.ts", "utf8")
  /* Comments stripped: this fix's explanation quotes the reads it narrows. */
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/^\s*\/\/.*$/gm, " ");

describe("only what is still true feeds the record", () => {
  it("a superseded member is not a candidate", () => {
    /*
     * The tablet track carried FOUR specs, three superseded. The newest
     * happened to be the live one, so the file was right by accident rather
     * than by rule -- and a rewind that re-attached an older spec later would
     * have made it wrong.
     */
    expect(SERVER).toContain('.is("superseded_at", null)');
  });

  it("the plan is the plan for the spec this file is about", () => {
    // Seven tasks on the tablet track, none superseded, in near-duplicate
    // pairs from two spec generations. A reader cannot tell which is the plan.
    expect(SERVER).toContain("t.prd_id === specId");
    expect(SERVER).toContain('.select("title,detail,status,seq,prd_id")');
  });

  it("but a track whose tasks predate the column still gets its plan", () => {
    // Half a plan silently is worse than one that is honestly wide.
    expect(SERVER).toContain("forThisSpec.length > 0 ? forThisSpec : rows");
  });
});

describe("intent.md says what was recorded, wherever it was recorded", () => {
  const CONTRACT_INTENT =
    "Remove the redundant address re-confirmation step on the Relay checkout screen.";

  it("carries the spec contract's intent when the decision has none", () => {
    const md = intentMd({ title: "Checkout", contractIntent: CONTRACT_INTENT });
    expect(md).toContain(CONTRACT_INTENT);
  });

  it("says where that sentence came from rather than filing it under a heading", () => {
    /*
     * It was not written to answer "problem statement" or "proposed outcome",
     * and slotting it under one would be this file deciding what the author
     * meant. `decisions.intent` is populated on 5 of 422 rows, so the five
     * structured headings stay honestly empty.
     */
    const md = intentMd({ title: "Checkout", contractIntent: CONTRACT_INTENT });
    expect(md).toContain("From the spec's outcome contract");
  });

  it("adds nothing when there is no intent anywhere", () => {
    const md = intentMd({ title: "Checkout" });
    expect(md).not.toContain("outcome contract");
  });

  it("still carries the forecast, which is the part that was never missing", () => {
    const md = intentMd({
      title: "Checkout",
      forecast: { claim: "Completion rises", observable: "The funnel", horizon: "2026-09-09" },
    });
    expect(md).toContain("**What we expect:** Completion rises");
  });
});

describe("the merge card names the files the merge adds to their repo", () => {
  const ours: ChangedFile[] = [
    { path: `${PLAYBOOK_DIR}/intent.md`, added: 12, removed: 0 },
    { path: `${PLAYBOOK_DIR}/spec.md`, added: 40, removed: 0 },
  ];
  const theirs: ChangedFile[] = [{ path: "src/checkout/AddressStep.tsx", added: 12, removed: 3 }];

  it("names them, because the count alone hid them inside 'touches 7 files'", () => {
    const said = recordFilesLine([...theirs, ...ours]);
    expect(said).toContain("2 of these are Supaprod's record");
    expect(said).toContain(`${PLAYBOOK_DIR}/intent.md`);
    expect(said).toContain("puts them in the repository");
  });

  it("says nothing when the change carries none of ours", () => {
    expect(recordFilesLine(theirs)).toBeNull();
  });

  it("is not a warning: these files are the product working as designed", () => {
    const said = recordFilesLine(ours) ?? "";
    for (const alarm of ["warning", "unexpected", "should not"]) {
      expect(said.toLowerCase()).not.toContain(alarm);
    }
  });
});

describe("no setting was invented to justify a half-built column", () => {
  it("write_record_to_repo is read nowhere", () => {
    /*
     * I applied that column, then set the packet aside when its acceptance
     * changed, leaving a column with no reader and no writer -- the exact shape
     * `workspace-automation.ts` exists to warn about, where a permanent default
     * is spelled as though it were configurable.
     *
     * The card names the files at the gate, which is where the decision is
     * actually made. A workspace-wide toggle nobody has asked for is a door
     * invented to justify the column, so the column is dropped instead.
     */
    for (const f of [
      "src/lib/ai/tools/registry.server.ts",
      "src/lib/spine/what-the-merge-gate-shows.ts",
      "src/lib/settings-sections.ts",
    ]) {
      expect(readFileSync(f, "utf8")).not.toContain("write_record_to_repo");
    }
  });
});
