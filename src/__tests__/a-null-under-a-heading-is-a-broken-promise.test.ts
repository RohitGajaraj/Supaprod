/**
 * WAITING IS A STATE SOMEBODY HAS TO DESIGN, AND ALMOST NOBODY DOES.
 *
 * The design lane's framing, and it is the best diagnosis anyone produced
 * tonight:
 *
 *   Failure gets designed because someone imagines it happening.
 *   Waiting gets skipped because the machine the developer is sitting at
 *   is fast.
 *
 * That is the same root cause as the ten-millisecond bet in
 * `a-timeout-is-not-a-wait`, arriving from the other direction. Both are a
 * fast developer machine deciding what a slow user sees.
 *
 * Four live instances were found and fixed on 2026-08-10 in one sweep:
 * `/inbox` showed a heading and a blank rectangle on a cold load;
 * `/threads` announced an empty workspace while it was still reading;
 * `/engine-room` printed the section title "Reading from" over nothing.
 *
 * WHAT THIS GUARD DOES NOT DO, and the restraint is the whole design.
 *
 * It does not flag every `isLoading ? null`. A small decoration that stays
 * silent while it loads is fine, and a guard that flags twelve sites when
 * four are defects is a guard people route around. That is not a theory: the
 * first draft of `a-timeout-is-not-a-wait` flagged eight legitimate mocked
 * handlers, and had it shipped that way it would have been deleted by the
 * third person who hit it.
 *
 * The distinction is the design lane's and it is exactly right:
 *
 *   A null with no heading above it is a quiet component.
 *   A null UNDER a heading is a broken promise.
 *
 * When an ancestor has already printed "Reading from", the page has asserted
 * that a section exists. Returning null then shows a title with no evidence
 * under it, which reads to a person as "this is empty" rather than "this is
 * still loading". Those are different sentences and only one of them is true.
 *
 * So the allowance below is a DEBT, not a licence. It may shrink and must
 * never grow. A new entry means somebody wrote a new blank rectangle.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..");

function uiFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === "__tests__") continue;
      uiFiles(full, out);
      continue;
    }
    if (!/\.tsx$/.test(entry)) continue;
    if (/\.test\.tsx$/.test(entry)) continue;
    out.push(full);
  }
  return out;
}

/** Comments stripped, for the fifth time in this codebase and for the same
 *  reason: this repo documents a fixed defect by quoting the broken line, and
 *  a scanner that cannot tell code from prose about code finds the defect
 *  forever. It cost three lanes time tonight, including a grep for a dead path
 *  that had already been fixed and only survived inside its own explanation. */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** The shape: a render that answers a pending read with nothing. */
const SILENT_WHILE_LOADING = /(?:isLoading|isPending)\s*(?:\?\s*null|\)\s*return null|&&\s*null)/g;

/**
 * Files carrying the pattern as of 2026-08-11, each tolerated for now.
 *
 * This list may SHRINK and must never grow. It is not an approval of the
 * pattern in these files; it is an honest record that they were not audited
 * one by one, because deciding whether each null sits under a heading is a
 * judgement about a rendered surface and belongs to the lane that owns it.
 */
const KNOWN: ReadonlyArray<string> = [
  "routes/_authenticated.plan.spec.$id.tsx",
  "routes/_authenticated.threads.tsx",
  "routes/_authenticated.inbox.tsx",
  "routes/_authenticated.engine-room.tsx",
  "components/shell/AppFrame.tsx",
  "components/product/ProductAnalyticsPanel.tsx",
  "components/governance/TrustGraduations.tsx",
  // The design lane's grep did not reach this one, because it searched
  // `isLoading ? null` and this uses `isPending` or `&& null`. Worth noting on
  // its own: the same defect wearing two other spellings is why this guard
  // matches a shape rather than a string.
  "components/engine-room/rooms/ReceiptsPanel.tsx",
  // PAID OFF WITH THE PAGE 2026-09-03 (P-14, A-QUEUE.md, A1's ruling):
  // `components/today/PushedInsights.tsx` is deleted along with `Board.tsx`,
  // the dead cluster it alone belonged to, not fixed in place, so the debt
  // it carried left with it. Same as ReadyToBuild.tsx just below.
  // PAID OFF WITH THE PAGE 2026-09-03 (P-14, A-QUEUE.md, R-34):
  // `components/build/ReadyToBuild.tsx` is deleted along with `/build`, not
  // fixed in place, so the debt it carried left with it. The entry is deleted
  // rather than left as a stale allowance, same as ControlsPanel's above.
  // PAID OFF 2026-08-11: `components/governance/ControlsPanel.tsx`. Its
  // `if (overview.isLoading) return null` was the whole body of both Settings >
  // Controls and the Engine Room's Safety room, so it was the textbook case
  // this guard was written for: a heading the person navigated to, and a blank
  // rectangle under it. It now says it is reading. The entry is deleted rather
  // than left as a stale allowance, so reinstating that line fails this test.
];

describe("a region a person is waiting on says so", () => {
  const offenders = uiFiles(SRC)
    .map((f) => ({
      rel: f.slice(SRC.length + 1),
      hits: [...codeOf(readFileSync(f, "utf8")).matchAll(SILENT_WHILE_LOADING)].length,
    }))
    .filter((r) => r.hits > 0);

  it("finds .tsx files at all, so a passing run means something", () => {
    // Without this the guard passes vacuously the moment the walker breaks,
    // which is how an enforcement layer becomes decorative. Five of those were
    // found in this repo in a single day.
    expect(uiFiles(SRC).length).toBeGreaterThan(100);
  });

  it("no NEW surface renders nothing while a read is in flight", () => {
    const unexpected = offenders.filter((o) => !KNOWN.some((k) => o.rel.endsWith(k)));
    expect(
      unexpected.map((o) => `${o.rel} (${o.hits})`),
      "A render that answers a pending read with `null` shows a person an empty " +
        "region and lets them conclude there is nothing there. If a heading above " +
        "it has already named the section, that is a broken promise rather than a " +
        "quiet component. Say that you are reading.",
    ).toEqual([]);
  });

  it("the tolerated list is a debt that has not grown", () => {
    const tolerated = offenders.filter((o) => KNOWN.some((k) => o.rel.endsWith(k)));
    expect(tolerated.length).toBeLessThanOrEqual(KNOWN.length);
  });
});
