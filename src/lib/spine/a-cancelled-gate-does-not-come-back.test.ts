/**
 * `pending_gates` COULD ONLY EVER GROW, AND A CANCELLED GATE CAME BACK.
 *
 * ── WHAT THE LIVE RUN SHOWED ───────────────────────────────────────────────
 * Track `2fdf93b6`, 2026-09-03. `pending_gates` went from ONE entry to TWO
 * across a single drive. Approval `a220388d` had been cancelled at 19:35 and the
 * harvest at the top of that drive removed it correctly -- and it was back in
 * the column at the end of the same drive, sitting beside the new gate.
 *
 * ── THE DEFECT, WHICH IS AN ORDERING AND NOT A LOGIC ERROR ─────────────────
 * `harvestAnsweredGates` runs early, files what was answered, and writes the
 * SHRUNK list. `rememberGates` runs at the end and appended the newly-opened
 * gates to `row.pending_gates` -- and `row` is the snapshot read at drive START,
 * before the harvest. So the final write was
 *
 *     [everything pending before the harvest, ...opened]
 *
 * which restored every gate the harvest had just removed. Neither function is
 * wrong on its own. The bug is entirely in which value the second one read, and
 * that is exactly the kind of defect a unit test of either half cannot see.
 *
 * ── WHY IT MATTERS MORE THAN A STALE ROW ───────────────────────────────────
 * `decideDrive` reads the pending count to decide whether the work is waiting on
 * a person. A list that only grows means a track that has had gates answered
 * looks permanently blocked, and the sweep stops driving it. The acceptance run
 * this product has never completed is a run nobody touched mid-flight -- and a
 * resurrected gate is a track that stops for a person who has already answered.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/lib/spine/driver.server.ts", "utf8");
const flat = SRC.replace(/\s+/g, " ");

/**
 * The CODE, without the comments about it.
 *
 * The first draft of this file asserted `not.toContain("row.pending_gates")`
 * over the raw slice and failed against the comment explaining why that read was
 * removed. Which is the right failure for the wrong reason: a guard that a
 * correct explanation can break is a guard that gets its explanation deleted.
 */
function code(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/\s+/g, " ");
}

function slice(from: string, to: string): string {
  const a = SRC.indexOf(from);
  const b = SRC.indexOf(to, a + 1);
  expect(a, `${from} not found`).toBeGreaterThan(-1);
  expect(b, `${to} not found`).toBeGreaterThan(a);
  return code(SRC.slice(a, b));
}

const REMEMBER = slice("async function rememberGates", "\n}\n");

describe("the merge reads what survived, not what was there before", () => {
  it("rememberGates no longer reads row.pending_gates at all", () => {
    /*
     * THE ASSERTION THAT IS THE FIX. Everything else in this file describes the
     * shape; this one line is the defect. If `row.pending_gates` is read here
     * again, the cancelled gate comes back.
     */
    expect(REMEMBER).not.toContain("row.pending_gates");
  });

  it("takes the surviving list as an argument instead", () => {
    expect(REMEMBER).toContain("existing: PendingGate[]");
    expect(REMEMBER).toContain("new Set(existing.map((g) => g.id))");
  });

  it("and the caller passes the harvest's own answer", () => {
    // Not re-read from the database: a second read is a second race, and the
    // harvest already knows what it wrote.
    expect(flat).toContain("await rememberGates(supabase, row, opened, gates.keep);");
  });
});

describe("what the harvest now returns", () => {
  it("returns the surviving list beside the count", () => {
    expect(flat).toContain(
      "Promise<{ filed: Attachment[]; stillOpen: number; keep: PendingGate[] }>",
    );
  });

  it("fails closed on every path, keeping the full list when it could not read", () => {
    /*
     * Both error paths return `keep: pending`, which is the whole pre-harvest
     * list. That is the SAFE direction and it is worth stating: a gate we could
     * not confirm as answered must stay pending, because dropping it would lose
     * the artifact permanently -- nothing else in the product reads
     * `agent_approvals.result` back.
     */
    const HARVEST = slice("async function harvestAnsweredGates", "async function rememberGates");
    expect([...HARVEST.matchAll(/keep: pending/g)].length).toBe(2);
    expect(HARVEST).toContain("stillOpen: 0, keep: []");
  });

  it("still only shrinks the stored list when the attach landed", () => {
    // Untouched by this fix and load-bearing: a gate dropped after a failed
    // write loses its artifact for good.
    expect(flat).toContain(
      "const keep = filed.length === attachments.length ? stillPending : pending;",
    );
  });
});
