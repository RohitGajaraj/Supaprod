/**
 * THE CARD A PERSON ACTUALLY PRESSED FROM HAD NOTHING ON IT.
 *
 * The tablet track's merge gate, 05:54 UTC 2026-09-04: `rationale` null, `args`
 * `{}`. P-72 had given the merge gate three facts and only `TrackConsent` drew
 * them, so the run screen's banner showed a headline and two buttons and the
 * Waiting page showed a tool name.
 *
 * Two rules, and the second is the one with teeth: the card is composed once,
 * and EMPTY ARGS STILL RENDER SOMETHING TRUE.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  isMergeGate,
  mergeCardLines,
  raisedOverLine,
  type MergeGateEvidence,
} from "@/lib/spine/what-the-merge-gate-shows";

const strip = (f: string) =>
  readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

const LIVE: MergeGateEvidence = {
  files: [{ path: "src/checkout/AddressStep.tsx", added: 12, removed: 3 }],
  buildHalt: null,
  designVerdict: null,
  known: true,
};

describe("a card with nothing on it is never drawn", () => {
  it("says so when there is neither live evidence nor a pinned sentence", () => {
    /*
     * THE EXACT SHAPE OF THE GATE THAT ROSE: no rationale, nothing readable.
     * A blank card reads as a change with nothing in it, which is the one
     * reading that must never be available.
     */
    const lines = mergeCardLines({ evidence: null, rationale: null });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain("not on this card");
    expect(lines[0]).toContain("Open the pull request");
  });

  it("an unreadable live read falls back rather than showing zero files", () => {
    const unknown: MergeGateEvidence = { ...LIVE, files: [], known: false };
    const lines = mergeCardLines({ evidence: unknown, rationale: "Raised over 2 files: a, b." });
    expect(lines).toEqual(["Raised over 2 files: a, b."]);
    // Never "touches no files, which cannot be right" off a failed read.
    expect(lines.join(" ")).not.toContain("cannot be right");
  });

  it("live evidence wins when it answered, because the person decides about now", () => {
    const lines = mergeCardLines({ evidence: LIVE, rationale: "Raised over 1 file: old.ts." });
    expect(lines.join(" ")).toContain("AddressStep.tsx");
    expect(lines.join(" ")).not.toContain("old.ts");
  });
});

describe("what the raise pins", () => {
  it("names the files it committed and what the checks said", () => {
    const said = raisedOverLine({
      committedFiles: ["src/a.tsx", "src/b.ts"],
      failingChecks: [],
      checksPassed: true,
    });
    expect(said).toContain("2 files");
    expect(said).toContain("src/a.tsx");
    expect(said).toContain("checks had passed");
  });

  it("says the checks were red when they were", () => {
    const said = raisedOverLine({
      committedFiles: ["src/a.tsx"],
      failingChecks: ["typecheck", "test"],
      checksPassed: false,
    });
    expect(said).toContain("red at the time: typecheck, test");
  });

  it("an absent checks result is NOT reported as a pass", () => {
    /*
     * The stale-read defect in miniature. Two of us called a green PR red on
     * 2026-09-04 by reading a result two commits old; claiming a pass we never
     * saw would be the same error pointing the other way, which is worse.
     */
    const said = raisedOverLine({
      committedFiles: ["src/a.tsx"],
      failingChecks: [],
      checksPassed: false,
    });
    expect(said).toContain("src/a.tsx");
    expect(said).not.toContain("passed");
  });

  it("pins nothing rather than an empty sentence when it knows nothing", () => {
    expect(
      raisedOverLine({ committedFiles: [], failingChecks: [], checksPassed: false }),
    ).toBeNull();
  });
});

describe("one composer, three surfaces", () => {
  it("all three call it, and none writes its own merge sentences", () => {
    for (const f of [
      "src/components/track/TrackConsent.tsx",
      "src/components/track/GateBanner.tsx",
      "src/lib/approvals-queue.functions.ts",
    ]) {
      const src = strip(f);
      expect(src, `${f} must use the shared composer`).toContain("mergeCardLines(");
      // The old direct call is the drift this packet removed.
      expect(src, `${f} must not compose its own`).not.toContain("mergeGateLines(");
    }
  });

  it("the question of what a merge gate IS lives in one place", () => {
    // It was a private const in the only surface that drew the card, so the two
    // that did not could not even ask.
    expect(isMergeGate("studio.pr.merge")).toBe(true);
    expect(isMergeGate("release.publish")).toBe(true);
    expect(isMergeGate("studio.commit")).toBe(false);
    expect(isMergeGate(null)).toBe(false);
    for (const f of [
      "src/components/track/TrackConsent.tsx",
      "src/components/track/GateBanner.tsx",
      "src/lib/approvals-queue.functions.ts",
    ]) {
      expect(strip(f), `${f} must import the predicate`).not.toMatch(/const isMergeGate\s*=/);
    }
  });

  it("the banner shares the transcript's query key, so both cannot disagree", () => {
    const banner = strip("src/components/track/GateBanner.tsx");
    const consent = strip("src/components/track/TrackConsent.tsx");
    expect(banner).toContain('["merge-gate-evidence", trackId]');
    expect(consent).toContain('["merge-gate-evidence", trackId]');
  });

  it("the raise pins into the rationale the queue already reads", () => {
    const loop = strip("src/lib/ai/loop.server.ts");
    expect(loop).toContain("raisedOverLine({");
    expect(loop).toContain("pinnedForCard");
  });
});
