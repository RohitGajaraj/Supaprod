/**
 * F-128: 22 OF 29 PENDING GATES HELD WORK THAT HAD ALREADY FINISHED.
 *
 * S1 measured `/inbox` against the database. The screen says **"52 decisions
 * are ready for you"**, and every row promises **"Approve · unblocks Build for
 * this spec"**. For 22 of the 29 pending tool-call gates **the run they held is
 * over**, so approving cannot unblock anything. Seven more (`memory.promote`)
 * have no `agent_runs` row at all. **None is past its expiry**, so nothing will
 * ever clear them, and the youngest is 33 days old.
 *
 *   tool_name            pending   run finished   no run row   youngest
 *   backlog.prioritize      7            7             0        33 days
 *   memory.promote          7            0             7        33 days
 *   mission.dispatch        7            7             0        33 days
 *   studio.pr.merge         7            7             0        33 days
 *   cluster.trigger         1            1             0         6 days
 *
 * That is the founder's own bar failing on the one surface whose entire job is
 * telling a person what needs them: a screen implying work that is not real.
 *
 * ── WHY A FIELD AND NOT A HEURISTIC THE SURFACE COULD COMPUTE ──────────────
 * Age cannot carry it. A 33-day-old call whose run is still queued is genuinely
 * waiting; one whose run finished is not; and `created_at` cannot tell them
 * apart. The fact lives in `agent_runs.status`, one join away, and every surface
 * that wanted it would have to make that join identically. They would not.
 *
 * ── THE NULL IS LOAD-BEARING ───────────────────────────────────────────────
 * Three states, never two. `false` means we looked and the work is over; `null`
 * means we cannot say — no mission on the gate, no run for that mission, or the
 * lookup failed. Those seven `memory.promote` rows are exactly the `null` case,
 * and collapsing them into `false` would tell a person the work had finished
 * when **nothing ever started**.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const code = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")
    .split("\n")
    .filter((l) => {
      const t = l.trim();
      return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
    })
    .join("\n");

const GOV = code("./governance.functions.ts");
const QUEUE = code("./approvals-queue.functions.ts");

describe("the fact is fetched once, for the rows that can use it", () => {
  it("only pending gates are asked about", () => {
    // A decided approval's run status changes nothing a person can act on, and
    // the queue is the only reader.
    expect(GOV).toContain('.filter((a) => a.status === "pending" && a.mission_id)');
  });

  it("in one query for the whole queue, not one per row", () => {
    /* One query for the whole queue, still: since 2026-09-09 the same read
       also answers which run each pending gate belongs to, so it asks by
       mission AND by run id in one `.or()` rather than making a second trip. */
    expect(GOV).toContain('`mission_id.in.(${pendingMissionIds.join(",")})`');
    expect(GOV).toContain('.select("id,mission_id,track_id,status,created_at")');
    // One trip inside the gate read's own hop, whatever else the file reads.
    const at = GOV.indexOf("const [missions, runsRes, histRes, learningsRes]");
    const hop = GOV.slice(at, GOV.indexOf("]);", at));
    expect(at).toBeGreaterThan(-1);
    expect(hop.match(/\.from\("agent_runs"\)/g) ?? []).toHaveLength(1);
  });

  it("and the newest run per mission decides it", () => {
    expect(GOV).toContain('.order("created_at", { ascending: false })');
    expect(GOV).toContain("if (!liveByMission.has(r.mission_id))");
  });
});

describe("what counts as still live, decided on the real status vocabulary", () => {
  it("a run halted at a gate is LIVE, because that is the run this releases", () => {
    /*
     * The one that would be easy to get backwards. `halted` and
     * `waiting_approval` are exactly the states an approval exists to end, and
     * calling them finished would hide the only gates that still matter.
     */
    expect(GOV).toContain('new Set(["waiting_approval", "halted"])');
  });

  it("completed, completed_with_failures and failed are all over", () => {
    // Measured vocabulary: 1218 / 1008 / 596 / 18 halted / 7 waiting_approval.
    // "It failed" is not a reason to keep promising that approving unblocks it.
    expect(GOV).not.toContain('"completed"');
    expect(GOV).not.toContain('"failed"');
  });
});

describe("THE NULL: a failed lookup never reads as finished work", () => {
  it("a read error leaves every gate unknown rather than false", () => {
    /*
     * Saying "the work behind this has finished" on the strength of a query we
     * could not run is the F-76 shape on the surface built to tell people the
     * truth about what needs them.
     */
    expect(GOV).toContain("run status unreadable, gates left unknown");
    const errBranch = GOV.slice(GOV.indexOf("if (runErr)"));
    expect(errBranch.slice(0, 300)).not.toContain("set(");
  });

  it("a gate with no mission is null, not false", () => {
    expect(GOV).toContain("a.mission_id ? (liveByMission.get(a.mission_id) ?? null) : null");
  });

  it("a mission with no run row is null, which is the memory.promote case", () => {
    // `.get()` returns undefined for a mission that produced no rows, and `??`
    // carries that to null rather than to false.
    expect(GOV).toContain("liveByMission.get(a.mission_id) ?? null");
  });
});

describe("the queue item carries it, and every kind declares it", () => {
  it("the tool-call gate reads it off the row rather than re-deriving", () => {
    expect(QUEUE).toContain("gatesLiveWork:");
    expect(QUEUE).toContain(".gatesLiveWork ?? null");
  });

  it("every other kind declares null explicitly", () => {
    /*
     * The typechecker forced this and it was right to: an optional field would
     * have let a new kind default silently, and the whole point is that whether
     * a gate holds live work is a question each kind has to answer.
     */
    const declared = (QUEUE.match(/gatesLiveWork: null,/g) ?? []).length;
    expect(declared).toBeGreaterThanOrEqual(9);
  });

  it("and the count matches the kinds that push items", () => {
    /*
     * ASSIGNMENTS ONLY. My first version counted every `gatesLiveWork:` and got
     * 11 against 10 pushes, because the TYPE DECLARATION matches too. A guard
     * off by one is a guard somebody deletes rather than reads, and the fix is
     * a pattern that means what the test says: an assignment ends in a comma,
     * the declaration ends in a semicolon.
     */
    const pushes = (QUEUE.match(/items\.push\(\{/g) ?? []).length;
    const assigned = (QUEUE.match(/gatesLiveWork:[^;\n]*,/g) ?? []).length;
    expect(pushes).toBeGreaterThan(0);
    expect(assigned).toBe(pushes);
  });
});
