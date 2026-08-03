// Entity embeddings: the text builders and the one table-driven sweeper.
//
// The builders are where recall quality is actually decided, so each one is pinned
// on what it INCLUDES and, just as hard, on what it must never include. The sweeper
// tests pin the three properties that make it safe to run unattended: never a mixed
// per-owner batch, never a silent failure, never a row that jams the queue forever.

import { describe, expect, it } from "bun:test";
import {
  backfillEntityEmbeddings,
  collapseText,
  decisionEmbeddingText,
  DECISION_EMBEDDING_SPEC,
  ENTITY_EMBEDDING_SPECS,
  flattenMarkdown,
  learningEmbeddingText,
  LEARNING_EMBEDDING_SPEC,
  opportunityEmbeddingText,
  OPPORTUNITY_EMBEDDING_SPEC,
  PRD_EMBEDDING_SPEC,
  PRD_LEAD_CHARS,
  prdEmbeddingText,
  UNKNOWN_EMBEDDING_MODEL,
  type EntityEmbeddingSpec,
  type EntityRow,
} from "./entity-embedding.server";

describe("collapseText", () => {
  it("collapses every run of whitespace to one space and trims", () => {
    expect(collapseText("  a\n\n b\t\tc  ")).toBe("a b c");
  });

  it("is total against null and undefined", () => {
    expect(collapseText(null)).toBe("");
    expect(collapseText(undefined)).toBe("");
  });
});

describe("decisionEmbeddingText", () => {
  it("puts the title first so it survives truncation", () => {
    const out = decisionEmbeddingText(
      "Ship the weekly digest behind a flag",
      "Support asked twice and the flag lets us roll back in a minute.",
    );
    expect(out.startsWith("Ship the weekly digest behind a flag")).toBe(true);
  });

  it("carries the rationale, which is the part anyone actually searches for", () => {
    const out = decisionEmbeddingText("Ship the digest", "Because support asked twice.");
    expect(out).toContain("Because support asked twice.");
  });

  it("collapses whitespace so the same call recorded twice embeds identically", () => {
    const a = decisionEmbeddingText("Ship   the\ndigest", "Because  support\t\tasked.");
    const b = decisionEmbeddingText("Ship the digest", "Because support asked.");
    expect(a).toBe(b);
  });

  it("does not repeat the title when the rationale merely restates it", () => {
    expect(decisionEmbeddingText("Drop the v1 importer", "Drop the v1 importer")).toBe(
      "Drop the v1 importer",
    );
  });

  it("never produces leading separators for a decision with no rationale", () => {
    const out = decisionEmbeddingText("Adopt Postgres full text search", null);
    expect(out).toBe("Adopt Postgres full text search");
    expect(out.startsWith("\n")).toBe(false);
  });

  it("tolerates a fully empty decision", () => {
    expect(decisionEmbeddingText(null, null)).toBe("");
  });

  it("keeps two different decisions apart", () => {
    const a = decisionEmbeddingText("Adopt Postgres FTS", "Cheaper than a search vendor.");
    const b = decisionEmbeddingText("Drop the CSV importer", "Two users in six months.");
    expect(a).not.toBe(b);
  });

  it("bounds what it hands the embedder", () => {
    expect(decisionEmbeddingText("t", "x".repeat(50_000)).length).toBeLessThanOrEqual(8_000);
  });
});

describe("opportunityEmbeddingText", () => {
  it("is the title plus the problem, in that order", () => {
    const out = opportunityEmbeddingText(
      "Onboarding stalls at the connect step",
      "New workspaces reach the connect screen and never return.",
    );
    expect(out.startsWith("Onboarding stalls at the connect step")).toBe(true);
    expect(out).toContain("never return");
  });

  it("handles the empty-string problem default without a dangling separator", () => {
    // `opportunities.problem` is NOT NULL DEFAULT '', so this is the common shape.
    expect(opportunityEmbeddingText("Self serve billing", "")).toBe("Self serve billing");
  });

  it("keeps two problems in the same area apart", () => {
    const a = opportunityEmbeddingText("Onboarding stalls", "Users abandon at connect.");
    const b = opportunityEmbeddingText("Billing confuses", "Users cannot find the invoice.");
    expect(a).not.toBe(b);
  });
});

describe("flattenMarkdown", () => {
  it("removes fenced code blocks entirely", () => {
    const out = flattenMarkdown("Context here.\n\n```ts\nconst x = 1;\n```\n\nMore prose.");
    expect(out).not.toContain("const x");
    expect(out).toContain("Context here.");
    expect(out).toContain("More prose.");
  });

  it("keeps link labels and drops the URLs", () => {
    const out = flattenMarkdown(
      "See [the tracking issue](https://github.com/acme/repo/issues/42).",
    );
    expect(out).toContain("the tracking issue");
    expect(out).not.toContain("github.com");
  });

  it("strips bare URLs", () => {
    expect(flattenMarkdown("Spec at https://example.com/a/b done.")).toBe("Spec at done.");
  });

  it("strips heading, bullet, quote, rule and table chrome", () => {
    const out = flattenMarkdown(
      ["# Goals", "", "- ship it", "1. then measure", "> a quote", "---", "| a | b |"].join("\n"),
    );
    expect(out).toBe("Goals ship it then measure a quote a b");
  });

  it("keeps snake_case identifiers intact while dropping asterisk emphasis", () => {
    const out = flattenMarkdown("The **body_md** column and the `prds` table.");
    expect(out).toContain("body_md");
    expect(out).toContain("prds");
    expect(out).not.toContain("**");
  });

  it("is total against null", () => {
    expect(flattenMarkdown(null)).toBe("");
  });
});

describe("prdEmbeddingText", () => {
  it("leads with the title", () => {
    const out = prdEmbeddingText("Weekly digest", "# Weekly digest\n\nSend a Monday summary.");
    expect(out.startsWith("Weekly digest")).toBe(true);
  });

  it("drops the H1 that restates the title instead of embedding it twice", () => {
    const out = prdEmbeddingText("Weekly digest", "# Weekly digest\n\nSend a Monday summary.");
    expect(out).toBe("Weekly digest\n\nSend a Monday summary.");
  });

  it("keeps the lead, which is what a reader would search for", () => {
    const out = prdEmbeddingText(
      "Weekly digest",
      "## Problem\n\nUsers miss what changed while they were away.",
    );
    expect(out).toContain("Users miss what changed");
  });

  it("cuts the body at the lead budget so acceptance-criteria boilerplate stays out", () => {
    const body = "Problem statement. " + "must verify rollback. ".repeat(2_000);
    const out = prdEmbeddingText("Big PRD", body);
    expect(out.length).toBeLessThanOrEqual("Big PRD".length + 2 + PRD_LEAD_CHARS);
  });

  it("handles the empty body default without a dangling separator", () => {
    expect(prdEmbeddingText("Draft PRD", "")).toBe("Draft PRD");
  });

  it("keeps two PRDs apart by their lead, not their boilerplate", () => {
    const tail = "\n\n## Acceptance criteria\n\n- must verify rollback\n- must page on error";
    const a = prdEmbeddingText("A", "## Problem\n\nExports time out for large workspaces." + tail);
    const b = prdEmbeddingText("B", "## Problem\n\nInvites expire before anyone clicks." + tail);
    expect(a).not.toBe(b);
  });
});

describe("learningEmbeddingText", () => {
  it("is the summary alone", () => {
    expect(learningEmbeddingText("Activation stayed flat after launch.")).toBe(
      "Activation stayed flat after launch.",
    );
  });

  it("collapses whitespace", () => {
    expect(learningEmbeddingText("Activation  stayed\n\nflat.")).toBe("Activation stayed flat.");
  });

  it("tolerates an empty summary so the sweeper can skip the row", () => {
    expect(learningEmbeddingText(null)).toBe("");
    expect(learningEmbeddingText("   ")).toBe("");
  });

  it("bounds what it hands the embedder", () => {
    expect(learningEmbeddingText("x".repeat(50_000)).length).toBeLessThanOrEqual(8_000);
  });
});

describe("the specs", () => {
  it("gives every entity its own error surface, so a failing sweep is nameable", () => {
    const surfaces = ENTITY_EMBEDDING_SPECS.map((s) => s.errorSurface);
    expect(new Set(surfaces).size).toBe(surfaces.length);
    for (const s of surfaces) expect(s.startsWith("cron.embed-tick.")).toBe(true);
  });

  it("gives every entity its own ai_events surface_ref, so spend is attributable", () => {
    const refs = ENTITY_EMBEDDING_SPECS.map((s) => s.surfaceRef);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("covers exactly the four entities that had no embedding column", () => {
    expect(ENTITY_EMBEDDING_SPECS.map((s) => s.table).sort()).toEqual([
      "decisions",
      "learnings",
      "opportunities",
      "prds",
    ]);
  });

  it("builds each entity's text from the columns it declares, and nothing else", () => {
    for (const spec of ENTITY_EMBEDDING_SPECS) {
      const row: EntityRow = { id: "r1", user_id: "u1" };
      for (const c of spec.columns) row[c] = `value-of-${c}`;
      // A column the spec did not ask for is not selected, so it must not be read.
      row.secret_column = "must-not-appear";
      const out = spec.text(row);
      for (const c of spec.columns) expect(out).toContain(`value-of-${c}`);
      expect(out).not.toContain("must-not-appear");
    }
  });

  it("returns empty text for a row with nothing in it, so the sweeper skips it", () => {
    for (const spec of ENTITY_EMBEDDING_SPECS) {
      expect(spec.text({ id: "r1", user_id: "u1" })).toBe("");
    }
  });

  it("drains newest first, because the live record beats the archive", () => {
    for (const spec of ENTITY_EMBEDDING_SPECS) {
      expect(spec.order).toEqual({ column: "created_at", ascending: false });
    }
  });
});

/* -------------------------------------------------------------------------- */
/* The sweeper.                                                               */
/* -------------------------------------------------------------------------- */

type SelectCall = {
  table: string;
  columns: string;
  order: string;
  ascending: boolean;
  /** The `.or(...)` predicate the sweeper filtered on, recorded so a test can assert it
   *  still picks up untagged rows and not only unembedded ones. */
  filter: string;
};
type UpdateCall = { table: string; id: string; embedding: unknown; embeddingModel?: unknown };

/** Minimal stand-in for the two supabase chains the sweeper uses. */
function fakeDb(rows: EntityRow[], opts: { selectError?: string; updateError?: string } = {}) {
  const selects: SelectCall[] = [];
  const updates: UpdateCall[] = [];
  const db = {
    from(table: string) {
      return {
        select(columns: string) {
          const call: SelectCall = {
            table,
            columns,
            order: "",
            ascending: true,
            filter: "",
          };
          const chain = {
            is: () => chain,
            or: (filter: string) => {
              call.filter = filter;
              return chain;
            },
            order: (column: string, o: { ascending: boolean }) => {
              call.order = column;
              call.ascending = o.ascending;
              return chain;
            },
            limit: (n: number) => {
              selects.push(call);
              return Promise.resolve(
                opts.selectError
                  ? { data: null, error: { message: opts.selectError } }
                  : { data: rows.slice(0, n), error: null },
              );
            },
          };
          return chain;
        },
        update(values: { embedding: unknown; embedding_model?: unknown }) {
          return {
            eq: (_col: string, id: string) => {
              updates.push({
                table,
                id,
                embedding: values.embedding,
                embeddingModel: values.embedding_model,
              });
              return Promise.resolve({
                error: opts.updateError ? { message: opts.updateError } : null,
              });
            },
          };
        },
      };
    },
  };
  return { db: db as never, selects, updates };
}

type EmbedBatch = {
  userId: string | null | undefined;
  texts: string[];
  surfaceRef?: string | null;
};

function fakeEmbed(behaviour: (userId: string) => "ok" | "throw" | "short") {
  const batches: EmbedBatch[] = [];
  const embed = async (
    texts: string[],
    o: { userId?: string | null; surfaceRef?: string | null },
  ) => {
    const userId = o.userId ?? "";
    batches.push({ userId, texts, surfaceRef: o.surfaceRef });
    const mode = behaviour(userId);
    if (mode === "throw") throw new Error(`no key for ${userId}`);
    if (mode === "short") return texts.map(() => undefined as unknown as number[]);
    return texts.map((_t, i) => [i, 0, 1]);
  };
  return { embed: embed as never, batches };
}

type Reported = { surface?: string; user_id?: string; failure_kind?: string };

function fakeReport() {
  const events: Reported[] = [];
  const report = async (_e: unknown, ctx: Reported = {}) => {
    events.push(ctx);
    return true;
  };
  return { report: report as never, events };
}

const oppRow = (id: string, user: string, title: string): EntityRow => ({
  id,
  user_id: user,
  title,
  problem: `problem for ${title}`,
});

describe("backfillEntityEmbeddings", () => {
  it("embeds per owner and never mixes two workspaces into one batch", async () => {
    // A mixed batch would send one workspace's text to another workspace's BYO key.
    const { db, updates } = fakeDb([
      oppRow("a", "u1", "alpha"),
      oppRow("b", "u2", "beta"),
      oppRow("c", "u1", "gamma"),
    ]);
    const { embed, batches } = fakeEmbed(() => "ok");
    const { report, events } = fakeReport();

    const r = await backfillEntityEmbeddings(db, OPPORTUNITY_EMBEDDING_SPEC, {
      embed,
      report,
    });

    expect(batches.length).toBe(2);
    for (const b of batches) expect(b.userId === "u1" || b.userId === "u2").toBe(true);
    expect(batches.find((b) => b.userId === "u1")!.texts.length).toBe(2);
    expect(batches.find((b) => b.userId === "u2")!.texts.length).toBe(1);
    expect(r).toEqual({
      table: "opportunities",
      scanned: 3,
      skipped: 0,
      embedded: 3,
      failed: 0,
    });
    expect(updates.map((u) => u.id).sort()).toEqual(["a", "b", "c"]);
    expect(events.length).toBe(0);
  });

  it("tags the embed call with the spec's surface_ref so spend is attributable", async () => {
    const { db } = fakeDb([oppRow("a", "u1", "alpha")]);
    const { embed, batches } = fakeEmbed(() => "ok");
    await backfillEntityEmbeddings(db, OPPORTUNITY_EMBEDDING_SPEC, { embed });
    expect(batches[0].surfaceRef).toBe("opportunity-embedding-backfill");
  });

  it("selects only the declared columns, on the declared ordering", async () => {
    const { db, selects } = fakeDb([]);
    const { embed } = fakeEmbed(() => "ok");
    await backfillEntityEmbeddings(db, DECISION_EMBEDDING_SPEC, { embed });
    expect(selects[0].table).toBe("decisions");
    expect(selects[0].columns).toBe("id, user_id, title, rationale");
    expect(selects[0].order).toBe("created_at");
    expect(selects[0].ascending).toBe(false);
  });

  it("skips rows with no text instead of embedding an empty string forever", async () => {
    const { db, updates } = fakeDb([
      { id: "a", user_id: "u1", summary: "Activation stayed flat." },
      { id: "b", user_id: "u1", summary: "   " },
      { id: "c", user_id: "u1", summary: null },
    ]);
    const { embed, batches } = fakeEmbed(() => "ok");

    const r = await backfillEntityEmbeddings(db, LEARNING_EMBEDDING_SPEC, { embed });

    expect(batches[0].texts).toEqual(["Activation stayed flat."]);
    expect(r.scanned).toBe(3);
    expect(r.skipped).toBe(2);
    expect(r.embedded).toBe(1);
    expect(updates.map((u) => u.id)).toEqual(["a"]);
  });

  it("reports a failing owner to error_events and keeps sweeping the others", async () => {
    // The memory sweeper's whole incident: it caught its own failure, wrote to a
    // console nobody reads, and the tick still returned ok.
    const { db, updates } = fakeDb([oppRow("a", "broken", "alpha"), oppRow("b", "fine", "beta")]);
    const { embed } = fakeEmbed((u) => (u === "broken" ? "throw" : "ok"));
    const { report, events } = fakeReport();

    const r = await backfillEntityEmbeddings(db, OPPORTUNITY_EMBEDDING_SPEC, { embed, report });

    expect(r.embedded).toBe(1);
    expect(r.failed).toBe(1);
    expect(updates.map((u) => u.id)).toEqual(["b"]);
    expect(events.length).toBe(1);
    expect(events[0].surface).toBe("cron.embed-tick.opportunities");
    expect(events[0].user_id).toBe("broken");
    expect(events[0].failure_kind).toBe("embed_failed");
  });

  it("reports write failures once per owner, not once per row", async () => {
    // recordErrorEvent has a 40 writes per minute storm guard; one event per row
    // would spend the whole budget and mask a different failure in the same tick.
    const { db } = fakeDb(
      [oppRow("a", "u1", "alpha"), oppRow("b", "u1", "beta"), oppRow("c", "u1", "gamma")],
      { updateError: "permission denied" },
    );
    const { embed } = fakeEmbed(() => "ok");
    const { report, events } = fakeReport();

    const r = await backfillEntityEmbeddings(db, OPPORTUNITY_EMBEDDING_SPEC, { embed, report });

    expect(r.embedded).toBe(0);
    expect(r.failed).toBe(3);
    expect(events.length).toBe(1);
    expect(events[0].failure_kind).toBe("write_failed");
    expect(events[0].surface).toBe("cron.embed-tick.opportunities");
  });

  it("counts a missing vector as a failure and leaves the row null for the retry", async () => {
    const { db, updates } = fakeDb([oppRow("a", "u1", "alpha")]);
    const { embed } = fakeEmbed(() => "short");
    const { report, events } = fakeReport();

    const r = await backfillEntityEmbeddings(db, OPPORTUNITY_EMBEDDING_SPEC, { embed, report });

    expect(r.embedded).toBe(0);
    expect(r.failed).toBe(1);
    expect(updates.length).toBe(0);
    expect(events[0].failure_kind).toBe("write_failed");
  });

  it("throws on a select failure so the tick reports it rather than logging ok", async () => {
    const { db } = fakeDb([], { selectError: "column embedding does not exist" });
    const { embed } = fakeEmbed(() => "ok");
    await expect(backfillEntityEmbeddings(db, PRD_EMBEDDING_SPEC, { embed })).rejects.toThrow(
      /prds\) select failed: column embedding does not exist/,
    );
  });

  it("does nothing and reports nothing when the backlog is drained", async () => {
    const { db, updates } = fakeDb([]);
    const { embed, batches } = fakeEmbed(() => "ok");
    const { report, events } = fakeReport();

    const r = await backfillEntityEmbeddings(db, PRD_EMBEDDING_SPEC, { embed, report });

    expect(r).toEqual({ table: "prds", scanned: 0, skipped: 0, embedded: 0, failed: 0 });
    expect(batches.length).toBe(0);
    expect(updates.length).toBe(0);
    expect(events.length).toBe(0);
  });

  it("honours the batch limit passed by the tick", async () => {
    const rows = Array.from({ length: 10 }, (_v, i) => oppRow(`r${i}`, "u1", `t${i}`));
    const { db, updates } = fakeDb(rows);
    const { embed } = fakeEmbed(() => "ok");
    const r = await backfillEntityEmbeddings(db, OPPORTUNITY_EMBEDDING_SPEC, { embed, limit: 4 });
    expect(r.scanned).toBe(4);
    expect(updates.length).toBe(4);
  });

  it("runs every shipped spec end to end", async () => {
    // Guards the wiring itself: a spec whose columns do not match its text builder
    // would embed empty strings, which no per-entity test above would catch.
    const fixtures: Record<string, EntityRow> = {
      opportunities: { id: "x", user_id: "u", title: "T", problem: "P" },
      decisions: { id: "x", user_id: "u", title: "T", rationale: "R" },
      prds: { id: "x", user_id: "u", title: "T", body_md: "B" },
      learnings: { id: "x", user_id: "u", summary: "S" },
    };
    for (const spec of ENTITY_EMBEDDING_SPECS as EntityEmbeddingSpec[]) {
      const { db, updates } = fakeDb([fixtures[spec.table]]);
      const { embed, batches } = fakeEmbed(() => "ok");
      const r = await backfillEntityEmbeddings(db, spec, { embed });
      expect(r.embedded).toBe(1);
      expect(r.skipped).toBe(0);
      expect(batches[0].texts[0].length).toBeGreaterThan(0);
      expect(updates[0].table).toBe(spec.table);
    }
  });

  it("selects rows that have a vector but no model tag, not only unembedded rows", async () => {
    // Regression guard, 2026-08-03. The predicate used to be `embedding IS NULL` alone,
    // which made a vector carrying no model tag invisible to every sweeper for good: it
    // was not in the backlog and could never enter it, so the only repair was a human
    // noticing and writing UPDATE by hand. Retrieval that filters by model silently
    // excludes untagged rows, so "invisible to the sweeper" means "gone from recall".
    const { db, selects } = fakeDb([{ id: "a", user_id: "u", title: "T", rationale: "R" }]);
    const { embed } = fakeEmbed(() => "ok");
    await backfillEntityEmbeddings(db, DECISION_EMBEDDING_SPEC, { embed });

    expect(selects[0].filter).toContain("embedding.is.null");
    expect(selects[0].filter).toContain("embedding_model.is.null");
  });

  it("never writes a null model tag alongside a vector, because that would loop forever", async () => {
    // The sharp edge of the predicate above. A row written with a vector and a NULL tag
    // matches `embedding_model.is.null`, so it would be re-selected, re-embedded and
    // re-written with a null tag on every single tick: unbounded provider spend that
    // never drains. The injected test embedder has no model tracking and so returns an
    // empty model, which is exactly the path that used to write NULL.
    const { db, updates } = fakeDb([{ id: "a", user_id: "u", title: "T", rationale: "R" }]);
    const { embed } = fakeEmbed(() => "ok");
    const r = await backfillEntityEmbeddings(db, DECISION_EMBEDDING_SPEC, { embed });

    expect(r.embedded).toBe(1);
    expect(updates).toHaveLength(1);
    expect(updates[0].embeddingModel).toBe(UNKNOWN_EMBEDDING_MODEL);
    expect(updates[0].embeddingModel).not.toBeNull();
  });
});
