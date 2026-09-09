/**
 * Starting a track from one sentence has never once worked in production.
 *
 * `spine_tracks.workspace_id` is **NOT NULL** with default
 * `current_user_default_workspace()`. A column default fires only when the
 * column is ABSENT from the INSERT. `startTrackCore` wrote
 * `workspace_id: data.workspaceId ?? null`, so PostgREST sent an explicit
 * `"workspace_id": null` and Postgres refused the row.
 *
 * MEASURED 2026-08-24 on the live database:
 *
 *   SELECT count(*), count(theme_id) FROM spine_tracks;   -- 59, 58
 *   SELECT ... FROM pg_trigger WHERE tgrelid='spine_tracks'::regclass
 *     AND NOT tgisinternal;                               -- zero rows
 *   SELECT column_default, is_nullable FROM information_schema.columns
 *     WHERE table_name='spine_tracks' AND column_name='workspace_id';
 *     -- current_user_default_workspace() , NO
 *
 * `theme_id` is set by the promotion sweep alone, so **58 of 59 tracks came from
 * the sweep and the 59th is the 2026-08-01 seed row.** Not one arrived through
 * `startTrack`. There are no triggers, so the default is the only filler and
 * omission is the only way to reach it.
 *
 * THIS CORRECTS THE EARLIER READING (ledger F-05), which was that a
 * null-workspace track would be silently dropped from every sweep because
 * `NULL NOT IN (...)` is NULL in SQL. That is true of SQL and could never happen
 * here: the constraint refuses the row before any sweep sees it. The defect sat
 * one layer earlier and was one order of magnitude worse -- not a track in the
 * wrong place, no track at all.
 *
 * It is on the critical path for the acceptance, which says a run **starts from
 * one sentence, zero configuration**. That sentence goes through this function.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");

/** The INSERT object `startTrackCore` builds, isolated from the rest of the file. */
const INSERT = (() => {
  const from = SRC.indexOf('.from("spine_tracks" as never)\n      .insert({');
  return SRC.slice(from, SRC.indexOf("} as never)", from));
})();

describe("a track started from a sentence reaches a workspace", () => {
  /**
   * THE DEFECT, stated as the exact string that caused it. Pinned as a literal
   * because this is one of the few places where the literal IS the bug: `?? null`
   * and omission are one keystroke apart and behave completely differently
   * against a NOT NULL column with a default.
   */
  it("never sends workspace_id as an explicit null", () => {
    expect(INSERT).not.toContain("workspace_id: data.workspaceId ?? null");
    expect(INSERT).not.toContain("workspace_id: null");
  });

  it("omits the column entirely when no workspace is named, so the default fires", () => {
    expect(INSERT).toContain("...(data.workspaceId ? { workspace_id: data.workspaceId } : {})");
  });

  /**
   * The other columns are unaffected and must stay unaffected. They are
   * ordinary nullable columns, where `?? null` is correct and omission would be
   * pointless churn. Asserted so a later sweep does not "consistently" apply the
   * spread to columns that never needed it.
   */
  it("leaves the ordinary nullable columns alone", () => {
    expect(INSERT).toContain("product_id: data.productId ?? null");
    expect(INSERT).toContain("project_id: data.projectId ?? null");
    expect(INSERT).toContain("theme_id: data.themeId ?? null");
  });

  /** P-134 (A-QUEUE.md): the ranked bet a press started from, when it did. */
  it("writes the opportunity a press started from", () => {
    expect(INSERT).toContain("opportunity_id: data.opportunityId ?? null");
  });

  /**
   * THE LOOP'S CLOSING SEAM (2026-09-10). `from_learning_id` has been readable
   * all along -- `came-back-on-its-own.ts` draws a line for it -- and nothing
   * on the start path could write it. Measured: 135 learnings on the record and
   * ONE track of 121 that ever started from one.
   */
  it("writes the learning a press came out of", () => {
    expect(INSERT).toContain("from_learning_id: data.fromLearningId ?? null");
  });
});

describe("a learning a press names must belong to the workspace it lands in", () => {
  /*
   * ── THE CHECK `opportunityId` DOES NOT HAVE ──────────────────────────────
   * S3 asked me to read that field's gating before copying its shape rather
   * than assume it had any. It has none: a client uuid goes through the
   * validator into `startTrackCore` and onto the row with nothing verifying it
   * belongs to the caller. Reported separately and NOT fixed here -- different
   * column, somebody else's press path -- and measured before being described:
   * the only reader of `spine_tracks.opportunity_id` uses the user-scoped
   * client and matches the caller's own ids, so a forged value is a false
   * provenance stamp on your own row rather than a read of anyone else's.
   *
   * This one is checked anyway, because a uuid accepted from a client and
   * written to a workspace-scoped table without an ownership test is the SHAPE
   * of a hole even where this instance is not one.
   *
   * Asserted on the source, like the insert above, because driving the handler
   * needs an auth context and a Supabase double, and the property here is that
   * the check EXISTS and is scoped -- which the source states exactly.
   */
  const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");

  it("reads the learning back before writing its id", () => {
    expect(SRC).toContain('.from("learnings")');
    expect(SRC).toContain('.eq("id", data.fromLearningId)');
  });

  it("and scopes that read to the workspace the track lands in", () => {
    // `resolved.workspaceId`, not the raw input: the caller's requested
    // workspace has already been gated by `resolveStartWorkspace` above, so
    // this cannot be pointed at a third one.
    expect(SRC).toContain('.eq("workspace_id", resolved.workspaceId)');
  });

  it("drops an unverifiable learning rather than refusing the run", () => {
    /*
     * The run is still worth starting. What is lost is the line saying where it
     * came from, which is the honest outcome for a provenance claim that could
     * not be verified -- the same rule the rest of this screen follows for a
     * fact nobody could read.
     */
    expect(SRC).toContain("fromLearningId = learning ? data.fromLearningId : null;");
  });
});

describe("a caller cannot name a workspace it does not belong to, unless they own it", () => {
  /**
   * Tenant isolation, and the reason the gate cannot live in `startTrackCore`.
   * Core is also called by the promotion sweep on a SERVICE-ROLE client, where a
   * membership read returns nothing and would refuse every promoted track. The
   * gate belongs on the caller's RLS-scoped client, where the read itself is the
   * proof.
   */
  it("proves membership on the caller's own client before honouring a named workspace", () => {
    expect(SRC).toContain("async function resolveStartWorkspace");
    const fn = SRC.slice(SRC.indexOf("async function resolveStartWorkspace"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    expect(body).toContain('.from("workspace_members")');
    expect(body).toContain('.eq("workspace_id", explicit)');
  });

  /**
   * P-65. An owner without a member row (the probe workspace's own shape,
   * live 00:35 IST 09-04) is still the owner: the membership check alone
   * used to throw for this exact case, and `messageForPerson` drops
   * "forbidden" as machine copy (`error-copy.ts`'s own `MACHINE` list), so
   * the refusal reached nobody. `workspaces`' own RLS ("ws owner manages own
   * regardless of membership", 20260909030000) already admits this; this
   * function did not know it.
   */
  it("admits the workspace owner even with no member row", () => {
    const fn = SRC.slice(SRC.indexOf("async function resolveStartWorkspace"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    expect(body).toContain('.from("workspaces")');
    expect(body).toContain('.eq("owner_id", userId)');
  });

  /**
   * P-65's other half of the same rule: a refusal is RETURNED, not thrown.
   * A thrown error is reserved for the session ending and the server
   * failing; this is a fact `problems` already knows how to carry, and
   * `Receipt` already knows how to render.
   */
  it("returns a refusal rather than throwing one, with a sentence a person can act on", () => {
    const fn = SRC.slice(SRC.indexOf("async function resolveStartWorkspace"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    expect(body).not.toContain("throw new Error");
    expect(body).toContain("You are not a member of this workspace; ask its owner to add you.");
  });

  it("asks for no proof when no workspace was named, which is the zero-config path", () => {
    const fn = SRC.slice(SRC.indexOf("async function resolveStartWorkspace"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    expect(body).toContain("if (!explicit) return { ok: true, workspaceId: null };");
  });

  it("the server function routes its input through the gate and stands down on a refusal", () => {
    const handler = SRC.slice(SRC.indexOf("export const startTrack = createServerFn"));
    const body = handler.slice(0, handler.indexOf("\n  });"));
    expect(body).toContain("workspaceId: z.string().uuid().optional()");
    expect(body).toContain("resolveStartWorkspace(");
    expect(body).toContain(
      "if (!resolved.ok) return { track: null, problems: [resolved.problem] };",
    );
  });
});

describe("the failure names what failed", () => {
  /**
   * R-16. Once the column is omitted, a NOT NULL violation has exactly one
   * cause left: `current_user_default_workspace()` returned null, meaning this
   * account is in no workspace. That is a setup gap a person closes in one
   * action, and "null value in column workspace_id violates not-null
   * constraint" names a column rather than naming it.
   */
  it("turns the not-null violation into something a person can act on", () => {
    expect(SRC).toContain('if (code === "23502")');
    expect(SRC).toContain("This account is not in a workspace yet");
    // And it must not have replaced the pre-existing promotion race handling.
    expect(SRC).toContain(
      'if (code === "23505") return { track: null, problems: ["already promoted"] };',
    );
  });
});
