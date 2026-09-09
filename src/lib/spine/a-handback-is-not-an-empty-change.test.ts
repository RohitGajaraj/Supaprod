/**
 * A HANDBACK IS NOT AN EMPTY CHANGE, AND A CLAIM IS NOT A RELEASE.
 *
 * ── THE SENTENCE THAT WOULD HAVE CALLED A SUPPORTED PATH A DEFECT ────────
 * `filesLine([])` says "This change touches no files, which cannot be right",
 * and on a merge gate that is exactly right: a changeset we staged with nothing
 * in it is worth stopping on.
 *
 * A handback has no files for the opposite reason. `paste-back.ts` exists so a
 * customer can use their own builder -- "the verdict is measured against the
 * forecast, not against the code" -- and `submitStationByHand` records the
 * outcome with no changeset of ours behind it. Running the gate's sentence over
 * that release tells the customers on the cheapest handback mechanism we have
 * that the product thinks their release is broken.
 *
 * ── AND THE OTHER HALF: WHAT MAY BE SAID OUT LOUD ────────────────────────
 * An announcement is the only thing here a stranger reads. `claimed` exists so
 * a typed address can never stand as proof that something shipped; announcing
 * one publishes that claim to people who cannot check it.
 *
 * NEITHER SHAPE IS IN THE DATA TODAY -- there are no `claimed` deploys and no
 * `handback` rows, counted 2026-09-04 -- which is the reason to hold them here
 * rather than to wait. The first one that lands is a customer's.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  deploymentLine,
  filesLine,
  handRecordedLine,
  mayAnnounce,
  releaseFilesLine,
  releaseSummaryLines,
  whyNotAnnounceable,
  type ReleaseEvidence,
} from "@/lib/spine/what-the-merge-gate-shows";
import { releaseStanding } from "@/components/track/release-words";

const base: ReleaseEvidence = {
  files: [],
  buildHalt: null,
  designVerdict: null,
  known: true,
  deployment: null,
  handRecorded: false,
};

describe("an empty change means three different things now (P-121)", () => {
  it("the GATE's own sentence still calls a built change with no files wrong", () => {
    // Unchanged, and it must stay: this is the case it was written for. Only
    // `filesLine` directly (mergeGateLines' own caller) reads this way --
    // `releaseSummaryLines` no longer does, per the two tests below.
    expect(filesLine([])).toContain("cannot be right");
  });

  it("a RELEASE with no files recorded, and no other reason for it, says so neutrally -- never that it 'cannot be right'", () => {
    // Served Ship, 12:10 IST 09-04: a July release, live in production,
    // whose changeset simply has no file rows recorded (not a handback --
    // `handRecorded: false`) read the gate's own accusation. It is not a
    // defect the product staged; it is a fact about the record.
    const said = releaseSummaryLines({ ...base, handRecorded: false })[0];
    expect(said).toBe("No file list was recorded for this change.");
    expect(said).not.toContain("cannot be right");
  });

  it("releaseFilesLine only reads neutrally when there really are no files -- a real list still lists them", () => {
    expect(releaseFilesLine([])).toBe("No file list was recorded for this change.");
    expect(releaseFilesLine([{ path: "src/a.ts", added: 1, removed: 0 }])).toBe(
      filesLine([{ path: "src/a.ts", added: 1, removed: 0 }]),
    );
  });

  it("a hand-recorded release says who recorded it instead", () => {
    const said = releaseSummaryLines({ ...base, handRecorded: true })[0];
    expect(said).toBe(handRecordedLine());
    expect(said).not.toContain("cannot be right");
    expect(said).toContain("Recorded by a person");
  });

  it("a hand-recorded release that DID stage files still describes them", () => {
    /*
     * The exemption is for the empty case only. A handback that carries a real
     * change has a real change to show, and hiding it behind "recorded by a
     * person" would lose the fact the row exists to carry.
     */
    const said = releaseSummaryLines({
      ...base,
      handRecorded: true,
      files: [{ path: "src/checkout/AddressStep.tsx", added: 12, removed: 3 }],
    })[0];
    expect(said).toContain("AddressStep.tsx");
    expect(said).not.toContain("Recorded by a person");
  });

  it("an unreadable release says so, and still says where it went", () => {
    const lines = releaseSummaryLines({
      ...base,
      known: false,
      deployment: { word: "Went out", note: null },
    });
    expect(lines[0]).toContain("could not be read");
    expect(lines).toContain("Went out.");
  });
});

describe("where it went carries what the word does not say", () => {
  it("a provider's deploy reads as an outcome", () => {
    const s = releaseStanding("success");
    expect(deploymentLine({ word: s.word, note: s.note })).toBe("Went out.");
  });

  it("a typed address carries its caveat into the summary, never alone", () => {
    /*
     * The load-bearing case. If these two ever read the same, the product's
     * central claim rests on a string somebody typed.
     */
    const s = releaseStanding("claimed");
    const line = deploymentLine({ word: s.word, note: s.note });
    expect(line).toContain("Told to us");
    expect(line).toContain("Nothing here has checked it");
    expect(line).not.toBe(deploymentLine({ word: "Went out", note: null }));
  });

  it("no deploy at all is said, not left blank", () => {
    expect(deploymentLine(null)).toContain("No deploy is on the record");
  });
});

describe("only a live release may be announced", () => {
  it("needs a production address", () => {
    expect(mayAnnounce({ productionUrl: null })).toBe(false);
    expect(mayAnnounce({ productionUrl: "   " })).toBe(false);
    expect(mayAnnounce({ productionUrl: "https://relay.example.com" })).toBe(true);
  });

  it("says why it is not offered, and names where it actually is", () => {
    const s = releaseStanding("claimed");
    const why = whyNotAnnounceable({ deployment: { word: s.word, note: s.note } });
    expect(why).toContain("nothing to announce");
    expect(why).toContain("Told to us");
  });

  it("says why even when there is no deploy row to name", () => {
    expect(whyNotAnnounceable({ deployment: null })).toContain("Promote it first");
  });
});

describe("one vocabulary: /ship composes nothing of its own", () => {
  /*
   * THE ROUTE THIS READS MOVED (P-14b, A-QUEUE.md, 2026-09-09). `/ship` is a
   * redirect to `/outcomes?tab=artifacts`; the station's regions, and the
   * `releaseSummaryLines` / `mayAnnounce` / `releaseStanding` calls pinned
   * below, are `components/ship/ShipRecord.tsx`. Same source, same rules.
   */
  const SHIP = readFileSync("src/components/ship/ShipRecord.tsx", "utf8")
    /* Comments stripped: this packet's explanation quotes the sentences it
       forbids re-writing (F-188). */
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("calls the shared composer rather than writing release sentences", () => {
    expect(SHIP).toContain("releaseSummaryLines(");
    expect(SHIP).toContain("mayAnnounce(");
  });

  it("takes the deploy word from releaseStanding and never re-derives it", () => {
    expect(SHIP).toContain("releaseStanding(");
    // The two statuses whose difference the whole distinction rests on are
    // never compared by hand on this page.
    expect(SHIP).not.toMatch(/===\s*"claimed"/);
  });
});
