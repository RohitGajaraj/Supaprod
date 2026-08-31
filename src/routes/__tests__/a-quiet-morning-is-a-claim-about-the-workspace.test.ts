import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE QUIET MORNING MAY NOT BE DECIDED BY A 24 HOUR WINDOW.
 *
 * ── THE DEFECT ─────────────────────────────────────────────────────────────
 * `quietMorning` gates two things: the sentence saying nothing needs you, and
 * `QuietMorning`, a worked Example shown on the premise that there is nothing
 * real to look at. It used to ask `stuck.length === 0`, and `stuck` is filtered
 * through `withinLastDay`. So the test was *"nothing became blocked in the last
 * 24 hours"* while the claim was *"nothing needs you at all"*.
 *
 * Measured against the live database 2026-08-27: **89 missions are waiting on a
 * person and 85 of them last moved between 8 and 30 days ago.** Exactly three
 * were inside the window that day, which is the only reason the quiet screen
 * did not fire. When those three aged out it would have, and the board would
 * have offered a teaching Example while 89 real things waited.
 *
 * ── WHY THE UNWINDOWED SET, AND WHY THAT IS SAFE ───────────────────────────
 * `rows` is `listMissions`' answer before the lane's window is applied. It is
 * capped at 50 by the server, which makes this test conservative in the
 * direction that cannot hurt: **it can fail to call a quiet morning quiet, and
 * it cannot call a busy morning quiet.** An unnecessary feed is a small cost; a
 * false all-clear on the surface whose job is to say what needs you is the
 * failure this repo keeps paying for.
 *
 * `stuck` KEEPS its window and should. That lane is genuinely about the last
 * day and says so on the surface. Being quiet is a stronger claim than having a
 * quiet lane, and a stronger claim needs a stronger test.
 */

// Subject moved 2026-08-31: the board was lifted out of the route file into
// `src/components/today/Board.tsx`. The CLAIM is unchanged.
const SRC = readFileSync("src/components/today/Board.tsx", "utf8");

function block(name: string): string {
  const start = SRC.indexOf(`const ${name} =`);
  expect(start, `${name} not found`).toBeGreaterThan(-1);
  const end = SRC.indexOf(";", SRC.indexOf("running.length === 0", start));
  return SRC.slice(start, end === -1 ? start + 900 : end);
}

describe("a quiet morning is a claim about the workspace", () => {
  it("does not decide quiet from the windowed lane", () => {
    // `stuck` is windowed. If it reappears here, the false all-clear is back.
    expect(block("quietMorning")).not.toContain("stuck.length === 0");
  });

  it("decides quiet from the unwindowed rows instead", () => {
    expect(block("quietMorning")).toContain("!anythingBlocked");
    const derived = SRC.slice(SRC.indexOf("const anythingBlocked"));
    expect(derived).toContain("rows.some");
    expect(derived).toContain("STUCK.has");
  });

  it("still refuses to call a failed read a quiet morning", () => {
    // The older and equally important half: "nothing needs you" must never be
    // printed because a fetch refused.
    const q = block("quietMorning");
    expect(q).toContain("!queue.isError");
    expect(q).toContain("!missions.isError");
    expect(q).toContain("!loading");
  });

  it("leaves the lane's own window alone, because that lane says what it shows", () => {
    expect(SRC).toContain("withinLastDay(m.completed_at ?? m.updated_at)");
  });
});
