import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A SEEDED BET MUST SAY IT IS SEEDED ON EVERY SURFACE THAT SHOWS IT.
 *
 * WHAT ONBOARDING DOES. It writes four invented opportunities into the new
 * user's REAL workspace, so Decide has something to show on day one. That is a
 * reasonable thing to do and a dangerous thing to do silently: the first
 * screens a Product Hunt visitor sees would otherwise present fiction about a
 * product they do not have, identically to their own work, and pressing "Keep
 * it" spends real model credits writing a spec for it.
 *
 * WHAT WAS ALREADY RIGHT. `/decide`'s gate says it, as its FIRST line, before
 * the evidence -- because a caveat printed under the facts arrives after the
 * decision is already forming. That was done on 2026-08-05 and it is correct.
 *
 * WHAT WAS STILL MISSING, found by checking rather than assuming:
 *   - THE RANKED LIST said nothing. Every row carries a rank, a designation, a
 *     verdict and a lane, so four invented bets sat among the real ones looking
 *     exactly as considered. The list is where a person forms their impression
 *     of what is in their workspace, and the gate only speaks about the ONE bet
 *     it is asking about.
 *   - THE DETAIL SHEET declared `is_sample` on its own interface and rendered
 *     it nowhere. That is the surface someone opens to STUDY a bet before
 *     acting, and it was the quietest of the three.
 *
 * Measured live while wiring it: 20 sample opportunities across 5 workspaces,
 * with `select("*")` carrying the flag to the client the whole time. The data
 * was never the problem.
 */

const ROOT = join(import.meta.dir, "..", "..");
const DECIDE = readFileSync(join(ROOT, "routes", "_authenticated.decide.tsx"), "utf8");
const SHEET = readFileSync(
  join(ROOT, "components", "discover", "OpportunityDetailSheet.tsx"),
  "utf8",
);

describe("every surface that shows a bet says when it is an example", () => {
  it("the gate says it", () => {
    expect(DECIDE).toMatch(/activeOpp\.is_sample/);
    expect(DECIDE).toMatch(/This is an example\./);
  });

  it("the ranked list says it on the row, not only on the focused bet", () => {
    expect(DECIDE).toMatch(/o\.is_sample \?/);
  });

  it("the detail sheet renders the flag it declares", () => {
    // It typed `is_sample` and showed nothing. A field on an interface that no
    // JSX reads is the same defect as an uncalled export, one layer down.
    expect(SHEET).toMatch(/opportunity\.is_sample \?/);
    expect(SHEET).toMatch(/This is an example/);
  });

  it("the mark comes BEFORE the facts, on both surfaces", () => {
    // A person scanning a row stops at the rank; a person reading the sheet
    // starts at the problem. A caveat after either arrives once the impression
    // has formed, which is worse than useless because it reads as a footnote.
    const rowSub = DECIDE.slice(DECIDE.indexOf("{o.is_sample ?"));
    expect(rowSub.slice(0, 400)).toMatch(/Example[\s\S]{0,200}#\{r\.rank\}/);

    // PINNED ON THE CLAIM, NOT ON THE SPELLING. This read
    // `'<Block title="The bet">'` and went red on 2026-08-18 for a rename:
    // porting the sheet to Meridian turned every `Block` into a `Region` and
    // the ORDER this test exists to protect never moved. A guard on a component
    // name fails when the paint improves and passes when the meaning breaks,
    // which is the wrong way round. What matters is that the region titled "The
    // bet" comes after the sample mark, whatever draws it.
    const sampleAt = SHEET.indexOf("opportunity.is_sample ?");
    const theBetAt = SHEET.search(/title="The bet"/);
    expect(sampleAt).toBeGreaterThan(-1);
    expect(theBetAt).toBeGreaterThan(sampleAt);
  });

  it("an unknown flag reads as NOT a sample, never as one", () => {
    // The field's own note: mislabelling a real bet as fiction is worse than
    // leaving one example unmarked. Both surfaces must test truthiness rather
    // than absence.
    expect(SHEET).not.toMatch(/is_sample\s*!==\s*false/);
    expect(DECIDE).not.toMatch(/is_sample\s*!==\s*false/);
  });
});
