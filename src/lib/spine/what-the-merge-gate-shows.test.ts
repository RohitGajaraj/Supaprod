/**
 * The tablet track's pull request was merged on a gate whose only evidence was
 * a green check. What it contained -- 90 lines of CSS for `.address-summary`
 * selectors and one line in `AddressStep.tsx`, in a repo with no address
 * summary component -- and what the Build seat and the Design critic had both
 * already said about it, were all in the record at the moment of the press.
 * None of them was on the card.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  countLines,
  filesLine,
  buildLine,
  designLine,
  mergeGateLines,
  mayDrawApprove,
  type MergeGateEvidence,
} from "./what-the-merge-gate-shows";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const CARD = code(readFileSync("src/components/track/TrackConsent.tsx", "utf8"));

/** The tablet change, in the shape the record holds it. */
const TABLET: MergeGateEvidence = {
  files: [
    { path: "src/styles/checkout.css", added: 90, removed: 0 },
    { path: "src/checkout/AddressStep.tsx", added: 1, removed: 0 },
  ],
  buildHalt: "There is no address summary component in this repository.",
  designVerdict: {
    verdict: "revise",
    finding: "The spec's premise is a layout fix, which contradicts the brief.",
  },
  known: true,
};

describe("the merge gate shows what the change is", () => {
  it("names the files and the size, which the green check never did", () => {
    expect(filesLine(TABLET.files)).toBe(
      "Touches 2 files (+91 / -0): src/styles/checkout.css, src/checkout/AddressStep.tsx.",
    );
  });

  it("puts all three facts on the card, in the order a person needs them", () => {
    const lines = mergeGateLines(TABLET);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("Touches 2 files");
    expect(lines[1]).toContain("Build halted");
    expect(lines[2]).toContain("contradicts the brief");
  });

  it("does not draw the affirmative when the seat disowned the change", () => {
    // A person should not be offered a single press that merges work the seat
    // which wrote it said should not exist.
    expect(mayDrawApprove(TABLET)).toBe(false);
    expect(mayDrawApprove({ ...TABLET, buildHalt: null })).toBe(true);
  });

  it("says less rather than nothing when a seat did not halt and no critic ran", () => {
    // Most builds do not halt and not every track has a critic. Those are
    // absences, not failures.
    const plain: MergeGateEvidence = {
      files: [{ path: "src/a.ts", added: 3, removed: 1 }],
      buildHalt: null,
      designVerdict: null,
      known: true,
    };
    expect(mergeGateLines(plain)).toEqual(["Touches 1 file (+3 / -1): src/a.ts."]);
    expect(mayDrawApprove(plain)).toBe(true);
  });

  it("says the change could not be read rather than showing zero files", () => {
    const unread: MergeGateEvidence = {
      files: [],
      buildHalt: null,
      designVerdict: null,
      known: false,
    };
    expect(mergeGateLines(unread)[0]).toContain("could not be read");
    expect(mergeGateLines(unread)[0]).toContain("Open the pull request");
  });

  it("admits the limit of a line COUNT rather than claiming a diff", () => {
    // A rewrite of the same length is 0 added and 0 removed, and the sentence
    // says so instead of reading as "nothing changed".
    expect(countLines("a\nb\nc", "x\ny\nz")).toEqual({ added: 0, removed: 0 });
    expect(filesLine([{ path: "src/a.ts", added: 0, removed: 0 }])).toContain(
      "rewritten, same length",
    );
  });

  it("counts a new file and a deleted one", () => {
    expect(countLines(null, "a\nb")).toEqual({ added: 2, removed: 0 });
    expect(countLines("a\nb\nc", null)).toEqual({ added: 0, removed: 3 });
  });

  it("truncates a long list without hiding how long it is", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      path: `src/f${i}.ts`,
      added: 1,
      removed: 0,
    }));
    const said = filesLine(many);
    expect(said).toContain("Touches 9 files");
    expect(said).toContain("and 6 more");
  });

  it("has words for an empty change, which cannot be right", () => {
    expect(filesLine([])).toContain("cannot be right");
  });

  it("says nothing for an absent halt or verdict", () => {
    expect(buildLine(null)).toBeNull();
    expect(designLine(null)).toBeNull();
    expect(designLine({ verdict: "ship", finding: null })).toBe(
      "Design's verdict on this was ship.",
    );
  });
});

describe("the card reads it", () => {
  it("shows the evidence only on the merge gate", () => {
    // Every other tool's card asks about a call, not about a diff.
    expect(CARD).toContain("isMergeGate(g.toolName)");
    expect(CARD).toContain('tool === "studio.pr.merge"');
  });

  it("puts the change ABOVE the reason it asks", () => {
    const from = CARD.indexOf("mergeGateLines(evidence.data)");
    const to = CARD.indexOf("Why it asks", from);
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
  });

  it("withholds the approve control after a halt, and keeps the decline", () => {
    expect(CARD).toContain("!mayDrawApprove(evidence.data)");
    expect(CARD).toContain("Build halted on this change, so it is not offered for merging");
    // Declining is still one press: what goes is the yes.
    expect(CARD).toContain('verdict: "reject"');
  });

  it("draws the check LAST, so it stops standing in for the rest", () => {
    // The whole finding is that a green check was doing the work of three facts.
    const evidenceAt = CARD.indexOf("mergeGateLines(evidence.data)");
    const rationaleAt = CARD.indexOf("g.rationale", evidenceAt);
    expect(rationaleAt).toBeGreaterThan(evidenceAt);
  });
});
