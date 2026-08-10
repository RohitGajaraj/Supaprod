/**
 * A DECLINE IS A DECISION, SO IT HAS TO SAY WHY.
 *
 * Measured on production 2026-08-10: 87 real themes (the seven seeded "Helio
 * Labs" demo workspaces, ids matching '_0000000-0000-4000-8000-000000000000',
 * excluded), 48 of them still at 'new', and ZERO ever dismissed or merged. The
 * wrong lesson to draw is "promote more" — promotion is deliberately the rare
 * case. The right one is that when a cluster DID stop, nothing recorded why:
 * status said what, `dismissed_at_frequency` said how big, `stage_events` said
 * when and by whom, and the operator's actual judgment went nowhere. Worse,
 * `setThemeStatus` had accepted a `reason` in its validator since the verb
 * shipped and never read it, so a caller could send the sentence and watch the
 * server silently drop it.
 *
 * These tests hold the whole path, not the happy line through it: the note
 * lands on the row, it is cleared when the operator changes their mind, it
 * reaches `human_gate_events` as an agent correction the brain can read back,
 * a write the database refuses claims nothing at all, and the unapplied
 * `status_reason` migration degrades to "the status landed, the note did not"
 * rather than taking triage down with it.
 *
 * Only Supabase is stubbed, and faithfully enough to fail when a shape changes:
 * every update and insert is captured verbatim and the chains match the real
 * ones. A mock too loose to match the shape it mocks cannot fail when that
 * shape breaks, which is a lesson this repo has already paid for once.
 */
import { expect, test, describe } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setThemeStatusCore, attachThemeToOpportunityCore } from "./discovery.functions";

const USER = "11111111-1111-1111-1111-111111111111";
const WS = "22222222-2222-2222-2222-222222222222";
const THEME = "33333333-3333-3333-3333-333333333333";
const OPP = "44444444-4444-4444-4444-444444444444";

type Row = Record<string, unknown>;

type StubOptions = {
  theme?: Row | null;
  opportunity?: Row | null;
  members?: string[];
  /** Error the FIRST themes update returns. Later attempts succeed, which is
   *  exactly the pre-migration retry: name the column, be told it is not there,
   *  write again without it. */
  firstUpdateError?: { code?: string; message?: string } | null;
  /** Rows the themes update reports as changed. `[]` models an RLS refusal,
   *  which supabase-js RESOLVES with no error and no row. */
  updatedRows?: { id: string }[];
};

function stubDb(o: StubOptions) {
  const themeUpdates: Row[] = [];
  const inserts: Record<string, Row[]> = {
    stage_events: [],
    human_gate_events: [],
    artifact_lineage: [],
  };

  const db = {
    from(table: string) {
      return {
        select(_sel: string) {
          return {
            eq(_col: string, _val: string) {
              const list = {
                data: (o.members ?? []).map((id) => ({ id })),
                error: null,
              };
              return {
                async maybeSingle() {
                  const single = table === "themes" ? (o.theme ?? null) : (o.opportunity ?? null);
                  return { data: single, error: null };
                },
                // The member-signal read is awaited directly, with no
                // .maybeSingle(), so the builder itself has to be thenable.
                then<T>(resolve: (v: typeof list) => T) {
                  return Promise.resolve(list).then(resolve);
                },
              };
            },
          };
        },
        update(values: Row) {
          return {
            eq(_col: string, _val: string) {
              return {
                async select(_sel: string) {
                  themeUpdates.push(values);
                  if (o.firstUpdateError && themeUpdates.length === 1) {
                    return { data: null, error: o.firstUpdateError };
                  }
                  return { data: o.updatedRows ?? [{ id: THEME }], error: null };
                },
              };
            },
          };
        },
        async insert(row: Row) {
          (inserts[table] ??= []).push(row);
          return { error: null };
        },
        async upsert(row: Row | Row[]) {
          (inserts[table] ??= []).push(...(Array.isArray(row) ? row : [row]));
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient;

  return { db, themeUpdates, inserts };
}

const NEW_THEME: Row = {
  id: THEME,
  status: "new",
  workspace_id: WS,
  title: "Checkout times out on mobile",
  frequency: 6,
};

describe("declining a cluster records why it stopped, not just that it stopped", () => {
  test("the operator's sentence lands on the row alongside the status", async () => {
    const { db, themeUpdates } = stubDb({ theme: NEW_THEME });
    const r = await setThemeStatusCore(db, USER, {
      theme_id: THEME,
      status: "dismissed",
      reason: "One loud account, not a pattern",
    });

    expect(themeUpdates).toHaveLength(1);
    expect(themeUpdates[0].status).toBe("dismissed");
    expect(themeUpdates[0].status_reason).toBe("One loud account, not a pattern");
    // The size-at-decline reading still goes with it: theme growth compares
    // later frequency against this, so the two have to move together.
    expect(themeUpdates[0].dismissed_at_frequency).toBe(6);
    expect(r.reasonRecorded).toBe(true);
    expect(r.settled).toBe(true);
    expect(r.ok).toBe(true);
    expect(r.unsettledReason).toBeNull();
  });

  test("a decline with no sentence still lands, and does not claim one was stored", async () => {
    const { db, themeUpdates } = stubDb({ theme: NEW_THEME });
    const r = await setThemeStatusCore(db, USER, { theme_id: THEME, status: "dismissed" });

    expect(themeUpdates[0].status).toBe("dismissed");
    expect(themeUpdates[0].status_reason).toBeNull();
    expect(r.reasonRecorded).toBe(false);
    expect(r.settled).toBe(true);
  });

  test("whitespace is not a reason", async () => {
    const { db, themeUpdates } = stubDb({ theme: NEW_THEME });
    const r = await setThemeStatusCore(db, USER, {
      theme_id: THEME,
      status: "dismissed",
      reason: "   \n  ",
    });
    expect(themeUpdates[0].status_reason).toBeNull();
    expect(r.reasonRecorded).toBe(false);
  });

  test("the note is bounded to what the column will accept, never handed over long", async () => {
    // The CHECK on themes.status_reason is 400 chars. A validator and a column
    // that disagree turn an over-long note into a failed decline.
    const { db, themeUpdates } = stubDb({ theme: NEW_THEME });
    await setThemeStatusCore(db, USER, {
      theme_id: THEME,
      status: "dismissed",
      reason: "x".repeat(900),
    });
    expect((themeUpdates[0].status_reason as string).length).toBe(400);
  });

  test("un-declining clears the sentence rather than leaving a withdrawn judgment behind", async () => {
    const { db, themeUpdates } = stubDb({
      theme: { ...NEW_THEME, status: "dismissed" },
    });
    const r = await setThemeStatusCore(db, USER, { theme_id: THEME, status: "new" });

    expect(themeUpdates[0].status).toBe("new");
    expect(themeUpdates[0].status_reason).toBeNull();
    expect(themeUpdates[0].dismissed_at_frequency).toBeNull();
    expect(themeUpdates[0].escalated_at).toBeNull();
    expect(r.reasonRecorded).toBe(false);
  });

  test("a reason sent with an un-decline is not smuggled onto the row", async () => {
    const { db, themeUpdates } = stubDb({ theme: { ...NEW_THEME, status: "dismissed" } });
    await setThemeStatusCore(db, USER, {
      theme_id: THEME,
      status: "new",
      reason: "changed my mind",
    });
    // status_reason explains the status currently on the row. A note about
    // putting something BACK would read as the reason it was declined.
    expect(themeUpdates[0].status_reason).toBeNull();
  });
});

describe("the decline reaches the flywheel as a correction of the agent that clustered it", () => {
  test("the row carries the why, the agent, and the workspace every consumer scopes on", async () => {
    const { db, inserts } = stubDb({ theme: NEW_THEME });
    await setThemeStatusCore(db, USER, {
      theme_id: THEME,
      status: "dismissed",
      reason: "Two of these quotes are the same customer",
    });

    expect(inserts.human_gate_events).toHaveLength(1);
    const g = inserts.human_gate_events[0];
    // `rejection` is in CORRECTION_GATE_TYPES, so this moves a correction rate.
    expect(g.gate_type).toBe("rejection");
    expect(g.subject_type).toBe("theme");
    expect(g.subject_ref).toBe(THEME);
    // Every theme is agent-drafted; this is the cast member that clusters them.
    expect(g.agent_slug).toBe("customer-insights");
    expect(g.verdict).toBe("dismissed");
    // The one field on the row that can say WHY. This is the whole point.
    expect(g.diff_summary).toBe("Two of these quotes are the same customer");
    // readAgentSignals filters `.eq("workspace_id", ...)`; a null here is a row
    // that is stored and read by nobody.
    expect(g.workspace_id).toBe(WS);
    expect(g.user_id).toBe(USER);
  });

  test("a decline with no sentence is still a correction, just a silent one", async () => {
    const { db, inserts } = stubDb({ theme: NEW_THEME });
    await setThemeStatusCore(db, USER, { theme_id: THEME, status: "dismissed" });
    expect(inserts.human_gate_events).toHaveLength(1);
    expect(inserts.human_gate_events[0].diff_summary).toBeNull();
  });

  test("re-declining an already-declined cluster is not a second correction", async () => {
    // The bulk-decline path on /discover retries a partly-succeeded set, so this
    // is reachable by ordinary use, not just by a double-click. Counting it
    // would let one cluster move a correction rate twice.
    const { db, inserts } = stubDb({ theme: { ...NEW_THEME, status: "dismissed" } });
    const r = await setThemeStatusCore(db, USER, {
      theme_id: THEME,
      status: "dismissed",
      reason: "still not a pattern",
    });
    expect(inserts.human_gate_events).toHaveLength(0);
    // recordStageEvent applies the same from === to rule to itself.
    expect(inserts.stage_events).toHaveLength(0);
    // The note on the row is still refreshed; only the scoring is suppressed.
    expect(r.reasonRecorded).toBe(true);
  });

  test("putting a cluster back is not scored as a second correction", async () => {
    // The operator reversing themselves is not the agent being wrong again.
    // Scoring it would let one indecisive person move a rate twice per cluster.
    const { db, inserts } = stubDb({ theme: { ...NEW_THEME, status: "dismissed" } });
    await setThemeStatusCore(db, USER, { theme_id: THEME, status: "new" });
    expect(inserts.human_gate_events).toHaveLength(0);
    // The stage history still records the reversal — that is what it is for.
    expect(inserts.stage_events).toHaveLength(1);
    expect(inserts.stage_events[0].to_stage).toBe("new");
  });
});

describe("the note degrades before triage does", () => {
  test("pre-migration: the status lands, the note does not, and the caller is told which", async () => {
    // PostgREST answers an UPDATE naming an unknown column with PGRST204. The
    // failure this guards is not cosmetic: without the retry, shipping the
    // reason would break the decline verb outright until the migration lands.
    const { db, themeUpdates } = stubDb({
      theme: NEW_THEME,
      firstUpdateError: {
        code: "PGRST204",
        message: "Could not find the 'status_reason' column of 'themes' in the schema cache",
      },
    });
    const r = await setThemeStatusCore(db, USER, {
      theme_id: THEME,
      status: "dismissed",
      reason: "Duplicate of the payments cluster",
    });

    expect(themeUpdates).toHaveLength(2);
    expect(themeUpdates[0]).toHaveProperty("status_reason");
    expect(themeUpdates[1]).not.toHaveProperty("status_reason");
    expect(themeUpdates[1].status).toBe("dismissed");
    expect(r.settled).toBe(true);
    // Taken and not stored, said out loud. The defect being fixed here is
    // precisely a sentence that vanished without anyone being able to tell.
    expect(r.reasonRecorded).toBe(false);
  });

  test("a permission error is not mistaken for a missing column", async () => {
    const { db, themeUpdates } = stubDb({
      theme: NEW_THEME,
      firstUpdateError: { code: "42501", message: "permission denied for table themes" },
    });
    await expect(
      setThemeStatusCore(db, USER, { theme_id: THEME, status: "dismissed", reason: "nope" }),
    ).rejects.toThrow("permission denied");
    expect(themeUpdates).toHaveLength(1); // no blind retry
  });

  test("a write the database silently refuses claims nothing", async () => {
    // supabase-js RESOLVES an RLS refusal: no error, no row. Before `.select`,
    // a refusal and a success were the same value.
    const { db, inserts } = stubDb({ theme: NEW_THEME, updatedRows: [] });
    const r = await setThemeStatusCore(db, USER, {
      theme_id: THEME,
      status: "dismissed",
      reason: "not a pattern",
    });

    expect(r.settled).toBe(false);
    expect(r.ok).toBe(false);
    expect(r.reasonRecorded).toBe(false);
    expect(r.unsettledReason).toBeTruthy();
    // No history and no telemetry for a transition that never happened.
    expect(inserts.stage_events).toHaveLength(0);
    expect(inserts.human_gate_events).toHaveLength(0);
  });

  test("a missing theme is refused before anything is written", async () => {
    const { db, themeUpdates } = stubDb({ theme: null });
    await expect(
      setThemeStatusCore(db, USER, { theme_id: THEME, status: "dismissed" }),
    ).rejects.toThrow("Theme not found");
    expect(themeUpdates).toHaveLength(0);
  });
});

describe('"same as that one" records why it was the same thing', () => {
  const OPP_ROW: Row = { id: OPP, title: "Make checkout survive bad networks", workspace_id: WS };

  test("the sentence lands on the row and rides the lineage edge the graph walks", async () => {
    const { db, themeUpdates, inserts } = stubDb({
      theme: NEW_THEME,
      opportunity: OPP_ROW,
      members: ["s1", "s2"],
    });
    const r = await attachThemeToOpportunityCore(db, USER, {
      theme_id: THEME,
      opportunity_id: OPP,
      reason: "Same root cause as the payments timeout bet",
    });

    expect(themeUpdates[0].status).toBe("merged");
    expect(themeUpdates[0].status_reason).toBe("Same root cause as the payments timeout bet");
    expect(r.reasonRecorded).toBe(true);
    expect(r.settled).toBe(true);
    expect(r.evidence).toBe(2);

    // The theme->opportunity edge still says what kind of link it is, with the
    // operator's words appended rather than replacing it.
    const themeEdge = inserts.artifact_lineage.find((e) => e.parent_kind === "theme");
    expect(themeEdge?.rationale).toBe(
      "Merged into an existing bet as further evidence: Same root cause as the payments timeout bet",
    );
  });

  test("with no sentence the edge keeps exactly the wording it always had", async () => {
    const { db, inserts } = stubDb({ theme: NEW_THEME, opportunity: OPP_ROW, members: [] });
    const r = await attachThemeToOpportunityCore(db, USER, {
      theme_id: THEME,
      opportunity_id: OPP,
    });
    const themeEdge = inserts.artifact_lineage.find((e) => e.parent_kind === "theme");
    expect(themeEdge?.rationale).toBe("Merged into an existing bet as further evidence");
    expect(r.reasonRecorded).toBe(false);
  });

  test("a merge reaches the flywheel as an edit, not a rejection", async () => {
    // The operator is not calling the evidence noise. They are saying the
    // clustering drew the boundary in the wrong place, which is a different
    // thing for a reader of the row to learn.
    const { db, inserts } = stubDb({ theme: NEW_THEME, opportunity: OPP_ROW, members: ["s1"] });
    await attachThemeToOpportunityCore(db, USER, {
      theme_id: THEME,
      opportunity_id: OPP,
      reason: "Already covered by that bet",
    });

    expect(inserts.human_gate_events).toHaveLength(1);
    const g = inserts.human_gate_events[0];
    expect(g.gate_type).toBe("edit");
    expect(g.subject_type).toBe("theme");
    expect(g.agent_slug).toBe("customer-insights");
    expect(g.verdict).toBe("merged");
    expect(g.diff_summary).toBe(
      'Merged into "Make checkout survive bad networks": Already covered by that bet',
    );
    expect(g.workspace_id).toBe(WS);
  });

  test("pre-migration: the merge still settles and only the note is lost", async () => {
    const { db, themeUpdates, inserts } = stubDb({
      theme: NEW_THEME,
      opportunity: OPP_ROW,
      members: [],
      firstUpdateError: { code: "42703", message: 'column "status_reason" does not exist' },
    });
    const r = await attachThemeToOpportunityCore(db, USER, {
      theme_id: THEME,
      opportunity_id: OPP,
      reason: "Same as the payments bet",
    });

    expect(themeUpdates).toHaveLength(2);
    expect(themeUpdates[1]).not.toHaveProperty("status_reason");
    expect(r.settled).toBe(true);
    expect(r.reasonRecorded).toBe(false);
    expect(inserts.stage_events).toHaveLength(1);
  });

  test("a cross-workspace merge is still refused, note or no note", async () => {
    const { db, themeUpdates } = stubDb({
      theme: NEW_THEME,
      opportunity: { ...OPP_ROW, workspace_id: "55555555-5555-5555-5555-555555555555" },
    });
    await expect(
      attachThemeToOpportunityCore(db, USER, {
        theme_id: THEME,
        opportunity_id: OPP,
        reason: "looks the same to me",
      }),
    ).rejects.toThrow("different workspace");
    expect(themeUpdates).toHaveLength(0);
  });
});
