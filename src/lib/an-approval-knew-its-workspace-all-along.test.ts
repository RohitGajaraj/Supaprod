/**
 * F-149: A FALSE COMMENT, NOT A MISSING COLUMN.
 *
 * `approvals-queue.functions.ts` stated in two places that `agent_approvals`
 * *"predates workspace tenancy (no workspace_id column), so this stays
 * unscoped"*, and the queue read that family unscoped on that basis.
 *
 * **The column exists. All 324 rows carry it**, including 28 of the 29 pending,
 * and `loop.server.ts:1906` has written it all along. The same file's own
 * `GATE_SOURCE` table already recorded `hasWorkspace: true` for this family —
 * **the code contradicted itself and the prose won.**
 *
 * ── WHAT IT COST ───────────────────────────────────────────────────────────
 * The inbox's "N need you" mixed one workspace's calls and runs with EVERY
 * workspace's approvals, in one figure, with no seam a surface could show.
 *
 * S1 found it from the inbox, S2 from the queue, and **both correctly declined
 * to act** because they believed it needed a schema change and a schema change
 * is S0's. I went further and wrote the migration before checking the data. The
 * `ALTER` was a no-op; the query that should have come first was
 * `count(*) FILTER (WHERE workspace_id IS NOT NULL)`.
 *
 * ── THE LESSON, WHICH IS S1'S OWN, ARRIVING BACK AT ME ─────────────────────
 * *"An invariant recorded in prose decays silently, and one recorded as a
 * bidirectional check does not."* This comment was presumably true when written.
 * Nothing failed when it stopped being true, three sessions read it as fact, and
 * two of them shaped a decision around it.
 *
 * So this file is that check: it asserts the column is READ, not that a comment
 * says it exists.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
/*
 * WHITESPACE-NORMALISED. Prettier reflows a chained validator across five
 * lines, and my first version asserted the single-line form and failed on code
 * that was correct. A test that fails on formatting teaches people to weaken
 * it, so the search space is flattened once here.
 */
const flat = (t: string) => t.replace(/\s+/g, " ");
const GOV = flat(read("./governance.functions.ts"));
const QUEUE = flat(read("./approvals-queue.functions.ts"));
const LOOP = flat(read("./ai/loop.server.ts"));

describe("the column is written, which is why it can be read", () => {
  it("the loop stamps the workspace on every approval it files", () => {
    expect(LOOP).toContain("workspace_id: workspaceId,");
  });

  it("and the queue's own source table always knew it was scopable", () => {
    const entry = QUEUE.slice(QUEUE.indexOf("tool_call: {"));
    expect(entry.slice(0, 220)).toContain("hasWorkspace: true");
  });
});

describe("the read is scoped when a caller asks", () => {
  it("listGovernApprovals accepts a workspace", () => {
    expect(GOV).toContain(".object({ workspaceId: z.string().uuid().optional() })");
  });

  it("and BOTH reads take it, including the mission_id fallback", () => {
    /*
     * The fallback exists for a missing `mission_id` column and has nothing to
     * do with tenancy. Scoping one and not the other would make a workspace's
     * queue depend on whether an unrelated migration had landed.
     */
    expect(GOV).toContain(
      'if (scopeToWorkspace) approvalsQ = approvalsQ.eq("workspace_id", scopeToWorkspace);',
    );
    expect(GOV).toContain(
      'if (scopeToWorkspace) fallbackQ = fallbackQ.eq("workspace_id", scopeToWorkspace);',
    );
  });

  it("the queue passes its own workspace through", () => {
    expect(QUEUE).toContain("listGovernApprovals({ data: { workspaceId: wsId ?? undefined } })");
  });

  it("omitted, the read is exactly what it always was", () => {
    // Additive. Every existing caller keeps the RLS-wide answer; only a caller
    // that asks for one workspace gets one.
    expect(GOV).toContain("const scopeToWorkspace = data?.workspaceId ?? null;");
  });

  it("and it is a plain conditional, not an invented builder step", () => {
    /*
     * My first version used a generic helper with an `as never` cast. It
     * compiled the cast and then lost `.order` off the end — the same "the type
     * system is not looking here" family as the `.apply()` I invented on
     * `listStudioSessions` an hour earlier.
     */
    expect(GOV).not.toContain("const scoped = <Q extends");
  });
});

describe("the false claim is gone from both places it appeared", () => {
  it("the correction is stated where the false claim used to be", () => {
    /*
     * ASSERTS THE REFUTATION, NOT AN ABSENCE, and the first version got that
     * wrong: it asserted the string "agent_approvals predates" never appears,
     * and **my own correction comment quotes the claim it refutes.** A guard
     * matching its own documentation, for the fifth time in one night.
     *
     * The lesson has stopped being about grep. Explanatory comments in this
     * repo quote the state they replaced, on purpose, because a fix whose
     * before-state is unstated is a fix nobody can evaluate. So an absence
     * assertion over prose is structurally unsafe here, and the right shape is
     * to assert what the code now SAYS rather than what it no longer says.
     */
    // Without the bold markers: `flat()` collapses whitespace and keeps `**`,
    // so matching the rendered sentence rather than the source of it.
    expect(QUEUE).toContain("The column exists and all 324 rows");
    expect(QUEUE).toContain("Corrected 2026-08-28 (F-149): `agent_approvals` DOES carry one");
  });

  it("and the one genuine exception is still named as such", () => {
    // `trust_graduation_proposals` really does lack the column. The correction
    // must not sweep away a true exception with a false one.
    expect(QUEUE).toContain("trust_graduation_proposals");
    const entry = QUEUE.slice(QUEUE.indexOf("trust_graduation: {"));
    expect(entry.slice(0, 200)).toContain("hasWorkspace: false");
  });
});
