import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * EVERY SURFACE THAT SAYS "WAITING ON YOU" ABOUT A HELD TRACK HAS MADE THE
 * TERMINAL SPLIT. THIS IS THE RATCHET.
 *
 * ── THE DEFECT, COMMITTED BY ME, AND THEN AGAIN ───────────────────────────
 * RUN-125 established that four of the six reasons `holdTone` calls `"you"` are
 * the whole of `TERMINAL_HOLDS`, so **36 of the 37 open tracks wearing a
 * "Waiting on you" chip have nothing pending for anybody** — the loop gave up
 * and `track-tick.ts` dropped them from its selection. I corrected five
 * surfaces on the run screen and called it done.
 *
 * **Two more were stale and I found them only because this file made me look:**
 * `src/routes/_authenticated.start.tsx` — which is `SIGNED_IN_HOME`, the surface
 * a person LANDS on — and `src/components/spine/TrackStart.tsx`. Both derived
 * their own chip from `holdTone` and printed the old two-way sentence. Operating
 * model §12: *a word renamed in one place and left stale in another has made the
 * problem worse.*
 *
 * ── THE FIRST VERSION OF THIS GUARD WAS WRONG, AND WRONG IN THE USUAL WAY ─
 * It asserted that only ONE module may print the literal at all. **It failed on
 * 20 files**, and almost all of them were right: `TaskRows`, `BoundaryControls`,
 * `AskPane` and the rest say "waiting on you" about an APPROVAL or a task, where
 * a person genuinely is being waited on. Passing it would have meant a
 * twenty-entry allow-list, which is widening the baseline to go green — the
 * move this repo forbids for design tokens and which is the same sin here.
 *
 * **So the invariant is not "one place prints it".** Several surfaces
 * legitimately render a held-track chip and each has local nuance —
 * `TrackStart` also distinguishes a learn hold on an undated forecast as
 * *"Waiting on time"*, which `runStatus` has no branch for. The honest rule is
 * the CONJUNCTION: **a file that derives from `holdTone` and prints "Waiting on
 * you" must also consult `nothingIsComing`.** That permits the nuance and
 * catches exactly the defect, which is a chip derived without the split.
 *
 * ── AN OPEN QUESTION THIS GUARD IS LOAD-BEARING ON, RAISED BY S2 ──────────
 * **The WORDING has not been ruled and this file encodes one reading.** S2's
 * objection is fair and is recorded here rather than in a message, because a
 * decision living only in a message did not happen.
 *
 * We agree on the placement and that half is settled: parked work belongs in
 * the person's lane. `tracks-feed.ts:87-108` put it there deliberately after S4
 * measured **eight of nine real open tracks** sitting under *"waiting on an
 * agent, not on you"* when no agent was ever coming, one of them across 316
 * drives. **Nobody wants that back.**
 *
 * We differ on one word. S2 reads "Waiting on you" as already true of a parked
 * track, since a person is the only exit. I read it as overstating, because
 * this product ALREADY uses that phrase for a queue of answerable items (§12
 * renames Approvals to *Waiting for you*), so a person reads it, goes looking
 * for the thing to answer, and there is nothing queued.
 *
 * **THE REGRESSION S2 FEARS CANNOT COME THROUGH THIS GUARD, and that is worth
 * stating precisely.** The guard requires a file to CONSULT `nothingIsComing`.
 * It does not dictate a word, a lane or a tone. `run-status.ts` keeps
 * `status: "you"` on a terminal hold, so the chip stays person-toned and parked
 * work stays exactly where `tracks-feed.ts` put it. Satisfying this test by
 * moving parked tracks out of the person's lane would be a strictly harder
 * change than satisfying it correctly.
 *
 * **If S0 rules for "Waiting on you"**, the reversal is: change the two words in
 * `run-status.ts` and `run-tab.ts`, and delete this file. One commit. Recorded
 * so the ruling is cheaper than the guard, never the other way round.
 */

const SRC = join(process.cwd(), "src");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Comments argue about the defect on purpose; only shipped code counts. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("a held track's chip", () => {
  it("is never derived from holdTone without the terminal split", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(SRC)) {
      const code = stripComments(readFileSync(file, "utf8"));
      /*
       * The conjunction IS the defect class. `holdTone` alone is fine (plenty
       * of surfaces read the tone for colour and never name it), and the
       * sentence alone is fine (an approval really is waiting on you). Together
       * they are a chip about a held track, and a chip about a held track that
       * has not consulted `nothingIsComing` is telling 36 of 37 people a
       * question is open when the loop has quit.
       */
      if (!/\bholdTone\b/.test(code)) continue;
      if (!/["'`]Waiting on you["'`]/.test(code)) continue;
      if (/\bnothingIsComing\b/.test(code)) continue;
      offenders.push(file.slice(file.indexOf("/src/") + 1));
    }

    // The message is the point of the failure. Whoever trips this is one line
    // from re-committing the defect and should be told what to call.
    expect({
      offenders,
      fix: "split on nothingIsComing(holdReason), or call runStatus(track)",
    }).toEqual({
      offenders: [],
      fix: "split on nothingIsComing(holdReason), or call runStatus(track)",
    });
  });

  it("and the split still exists to be consulted", () => {
    /*
     * The scan above passes trivially if `nothingIsComing` is deleted and every
     * caller with it, so this pins the other side: the predicate exists, and it
     * is still derived from the shared constant rather than a private list.
     */
    const pred = readFileSync(join(SRC, "components/track/nothing-is-coming.ts"), "utf8");
    expect(pred).toContain("TERMINAL_HOLDS");
    expect(pred).toContain("export function nothingIsComing");
  });

  it("names the surfaces that carry it today, so a deletion is visible too", () => {
    /*
     * Not an allow-list — nothing is exempted by being here. It is a census, and
     * it fails if a surface silently STOPS carrying the chip, which a
     * violations-only scan cannot see. Five surfaces made the split in RUN-125
     * and two more were found stale by this file; if that number falls, someone
     * removed a person's only signal that their work needs them.
     */
    const carriers = sourceFiles(SRC)
      .filter((f) => {
        const code = stripComments(readFileSync(f, "utf8"));
        return /\bnothingIsComing\b/.test(code);
      })
      .map((f) => f.slice(f.indexOf("/src/") + 1))
      .sort();

    expect(carriers).toEqual([
      "src/components/spine/TrackStart.tsx",
      "src/components/track/TrackRun.tsx",
      "src/components/track/footer-mode.ts",
      "src/components/track/nothing-is-coming.ts",
      "src/components/track/run-status.ts",
      "src/components/track/run-tab.ts",
      "src/components/track/way-out.ts",
    ]);
  });
});
