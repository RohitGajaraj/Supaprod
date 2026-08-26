/**
 * A PASTED LINK IS A CLAIM, NOT A PROOF (gap #12, 2026-08-26).
 *
 * ── THE ONE THING THIS MUST NEVER DO ───────────────────────────────────────
 * Turn a string somebody typed into evidence that something shipped.
 *
 * `release.publish` proves a merged changeset. `studio.pr.merge` re-proves CI at
 * the head sha and refuses red. A pasted URL proves **neither** — and the product's
 * central claim is that a verdict is measured against a forecast, so letting a
 * typed address stand in for a release would corrupt the one output that matters.
 *
 * This repo has already paid for the mirror of this: F-68, a station reporting
 * *"these changes were staged and committed to a pull request"* while its own
 * `studio.commit` came back `ok: false`. That was an agent asserting over a
 * visible refusal. A handback that reads as verified would be the same defect
 * arrived at from the person's side.
 *
 * So `verified` is a separate field, starts `false`, and nothing in this module
 * sets it true. And `claimedByPerson` is always true, because R-18 forbids
 * counting a run with a human act in it as unattended — F-79 caught exactly that
 * false acceptance once already.
 */
import { describe, expect, it } from "bun:test";

import { readPasteBack, pasteBackLine } from "./paste-back";

const ok = (raw: string) => {
  const r = readPasteBack(raw);
  if (!r.ok) throw new Error(`expected ok, got: ${r.reason}`);
  return r.value;
};

describe("it reads what the link actually names", () => {
  it("a GitHub pull request", () => {
    const p = ok("https://github.com/Supaprod/relay-homeowner-app/pull/1");
    expect(p.kind).toBe("pull_request");
    expect(p.target).toBe("Supaprod/relay-homeowner-app");
  });

  it("a GitLab merge request", () => {
    const p = ok("https://gitlab.com/acme/web/-/merge_requests/42");
    expect(p.kind).toBe("pull_request");
    expect(p.target).toBe("acme/web");
  });

  it("anything else is a deploy, because a deploy can live anywhere", () => {
    const p = ok("https://relay-homeowner.vercel.app");
    expect(p.kind).toBe("deployment");
    expect(p.target).toBe("relay-homeowner.vercel.app");
  });
});

describe("it refuses what it cannot read, and says what to paste instead", () => {
  it("empty", () => {
    const r = readPasteBack("   ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("Paste the link");
  });

  it("not a link at all", () => {
    const r = readPasteBack("we shipped it yesterday");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("starting with https://");
  });

  it("a repository page is NOT a pull request", () => {
    // The dangerous near-miss: right host, wrong thing. Accepting it would file
    // "a change exists" on the strength of somebody landing on the repo home.
    const r = readPasteBack("https://github.com/Supaprod/relay-homeowner-app");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("not a pull request");
  });

  it("a PR path with no number is refused", () => {
    expect(readPasteBack("https://github.com/a/b/pull/").ok).toBe(false);
  });

  it("http is refused", () => {
    expect(readPasteBack("http://github.com/a/b/pull/1").ok).toBe(false);
  });
});

describe("THE INVARIANT: nothing here can claim proof", () => {
  const SAMPLES = [
    "https://github.com/Supaprod/relay-homeowner-app/pull/1",
    "https://gitlab.com/acme/web/-/merge_requests/42",
    "https://relay-homeowner.vercel.app",
    "https://app.customer.example.com/release/9",
  ];

  it("every accepted paste is unverified and person-claimed", () => {
    for (const raw of SAMPLES) {
      const p = ok(raw);
      expect(p.verified, `${raw} claimed verification`).toBe(false);
      expect(p.claimedByPerson, `${raw} lost its attribution`).toBe(true);
    }
  });

  it("the sentence says nobody checked it, so screen and record agree", () => {
    for (const raw of SAMPLES) {
      const line = pasteBackLine(ok(raw));
      expect(line).toContain("Nothing here has checked it");
      // And it must not borrow the vocabulary of a proven release.
      expect(line.toLowerCase()).not.toContain("verified");
      expect(line.toLowerCase()).not.toContain("merged");
    }
  });

  it("it says the verdict is measured against what happens, not the code", () => {
    // The load-bearing sentence of the whole handback: this is WHY
    // bring-your-own-builder does not break the loop.
    expect(pasteBackLine(ok(SAMPLES[0]!))).toContain("measured against what happens");
  });
});
