/**
 * A SIGNAL'S THEME IS NOT ATTACHED WITH IT, AND THAT IS DELIBERATE.
 *
 * S1 measured that 1,133 signals filed to tracks all carry a `theme_id` while
 * only 315 of those themes are attached to the same track, and flagged the other
 * 818: if a signal is part of this work's record, surely the pattern it belongs
 * to is too. It is a reasonable reading and it is wrong, and the reason is worth
 * a test because **the fix is tempting, small, and would break something quiet.**
 *
 * `attach.ts` line 2: members are *"what a station actually produced"*. And
 * `didStationProduce` treats them as exactly that:
 *
 *     attachedCount: "Artifacts harvested from the seats that ran in THIS tick"
 *     if (input.attachedCount > 0) return true;
 *
 * So attaching a theme created by another track's clustering pass would make a
 * station report that it produced something when it produced nothing —
 * *"exactly the progress-the-work-did-not-buy that `produced-nothing` exists to
 * refuse"*, in `driver.ts`'s own words two lines above that function.
 *
 * The pattern's name reaches the surface through `signals.theme_id -> themes.id`
 * instead (F-129), which is the platform truth and holds whether or not anything
 * was attached. **Membership is bookkeeping about production; the foreign key is
 * the fact about belonging.** Different questions, different answers.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { didStationProduce } from "@/lib/spine/driver";

const ATTACH = readFileSync(fileURLToPath(new URL("./attach.ts", import.meta.url)), "utf8");

describe("the reason membership is not belonging", () => {
  it("one harvested artifact is all it takes to claim a station produced", () => {
    // The whole risk in one assertion: whatever lands in members is a claim.
    expect(
      didStationProduce({ attachedCount: 1, startSeat: 0, filedAtStationSinceArrival: null }),
    ).toBe(true);
    expect(
      didStationProduce({ attachedCount: 0, startSeat: 0, filedAtStationSinceArrival: null }),
    ).toBe(false);
  });

  it("so a station that made nothing must stay at nothing", () => {
    // Attaching a pre-existing theme would flip exactly this case.
    expect(
      didStationProduce({ attachedCount: 0, startSeat: 0, filedAtStationSinceArrival: false }),
    ).toBe(false);
  });
});

describe("signals.log attaches the signal and nothing else", () => {
  it("its product is the signal itself", () => {
    expect(ATTACH).toContain('"signals.log": { kind: "signal", table: "signals", idField: "id" }');
  });

  it("it does not reach for the signal's theme", () => {
    const entry = ATTACH.slice(ATTACH.indexOf('"signals.log":'));
    expect(entry.slice(0, 200)).not.toContain("theme");
  });

  it("and only the tools that CREATE themes attach them", () => {
    /*
     * `cluster.trigger` and `research.synthesize`, both of which make several
     * themes in one call and hand back every id. Those are productions; a
     * signal's pre-existing theme is not.
     *
     * My first version asserted `signals.cluster`, a name I reached for rather
     * than read. It failed, which is the right outcome and a small instance of
     * the night's own lesson: a plausible-looking name is a runtime error rather
     * than a compile one, which is why this file's `FIELDS` map is written per
     * kind in the first place.
     */
    expect(ATTACH).toContain('"cluster.trigger"');
    expect(ATTACH).toContain('"research.synthesize"');
  });

  it("the ruling is written down where the next person will look", () => {
    // This reasoning lived in a peer message. A ruling that only exists in a
    // conversation gets re-litigated by whoever reads the row counts next.
    expect(ATTACH).toContain("WHY A SIGNAL'S THEME IS NOT ATTACHED WITH IT");
    expect(ATTACH).toContain("progress-the-work-did-not-buy");
  });
});
