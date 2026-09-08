import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { pollMs } from "./poll";

/**
 * ONE ANSWER TO "HOW OFTEN SHOULD THIS ASK AGAIN".
 *
 * The concern that had no answer anywhere before 2026-08-27 is the third:
 * backing off when the read is failing. `refetchInterval` and `retry` are
 * independent in TanStack Query, so a bare interval is an unbounded retry loop
 * against a backend that is not answering.
 */

describe("pollMs", () => {
  it("is the caller's cadence while answers are arriving", () => {
    // The base is a statement about how fast the underlying fact moves, which
    // only the caller knows. This never second-guesses it.
    expect(pollMs(5_000, 0)).toBe(5_000);
    expect(pollMs(60_000, 0)).toBe(60_000);
  });

  it("doubles as failures accumulate", () => {
    expect(pollMs(5_000, 1)).toBe(10_000);
    expect(pollMs(5_000, 2)).toBe(20_000);
    expect(pollMs(5_000, 3)).toBe(40_000);
  });

  it("CAPS, so a long outage does not drift into hours", () => {
    expect(pollMs(5_000, 4)).toBe(80_000);
    expect(pollMs(15_000, 4)).toBe(120_000);
    expect(pollMs(60_000, 9)).toBe(120_000);
    expect(pollMs(5_000, 1000)).toBe(80_000);
  });

  it("NEVER RETURNS false FOR FAILURE, which is the whole design", () => {
    // A live read that gives up stays wrong until the person navigates, so a
    // backend that came back would go unnoticed.
    for (const f of [1, 4, 50, 5000]) {
      expect(pollMs(5_000, f)).not.toBe(false);
    }
  });

  it("returns to the base cadence the instant one read succeeds", () => {
    // fetchFailureCount resets to 0 on success; recovery does not walk back
    // down the ramp.
    expect(pollMs(5_000, 0)).toBe(5_000);
  });

  it("treats a negative or absent count as healthy rather than throwing", () => {
    expect(pollMs(5_000, -1)).toBe(5_000);
  });
});

describe("every live read the shell owns is wired to it", () => {
  /*
   * Not a style rule. A bare `refetchInterval` is an unbounded retry loop
   * against a backend that is not answering, and these are the reads mounted
   * on every authenticated screen, so the cost is paid product-wide.
   *
   * Other lanes' polls are deliberately NOT asserted here: the helper is
   * available to them and the choice is theirs.
   */
  const OWNED = [
    "src/components/shell/AppFrame.tsx",
    // BoardPanel.tsx left this list (Lane 1, 2026-09-08): deleted.
    "src/components/shell/use-spine-strip.ts",
    // SystemAlerts.tsx, CrewPulseNote.tsx, OverlapNote.tsx and HandoverNote.tsx
    // left this list (P-14, A-QUEUE.md): all four were exclusively owned by
    // `components/today/Board.tsx`, unmounted (zero importers) and deleted
    // with the cluster it alone owned.
  ];

  /**
   * COMMENTS ARE STRIPPED FIRST, and this is not fussiness. The headers in
   * these files quote the exact line they replaced - "This was a bare
   * `refetchInterval: 5000`" - so a naive scan reports the fix as the defect.
   * Three assertions in this lane failed that way on 2026-08-27 before this
   * was written down.
   */
  const code = (f: string) =>
    readFileSync(f, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

  it("has NO bare numeric interval left in the files this lane owns", () => {
    const bare: string[] = [];
    for (const f of OWNED) {
      for (const m of code(f).matchAll(/refetchInterval: *(\d[\d_]*)/g)) {
        bare.push(`${f}: ${m[1]}`);
      }
    }
    // Not one exemption. "It is only a little wasteful" is how the 5s one got
    // written too, and a rule with an exception list stops being checkable.
    expect(bare).toEqual([]);
  });

  it("routes the rest through pollMs", () => {
    for (const f of OWNED) {
      expect(readFileSync(f, "utf8"), f).toContain("pollMs(");
    }
  });
});
