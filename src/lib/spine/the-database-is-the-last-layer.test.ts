/**
 * THE LAST LAYER EVERY WRITER PASSES THROUGH (2026-08-27).
 *
 * The founder asked that no em or en dash appear anywhere a person can see.
 * Three passes were made in application code. Each was necessary, none was
 * sufficient, and each one was followed by a writer coming through a different
 * door:
 *
 *   · `humanizeText` guarded STREAMED model text, not tool arguments
 *   · `humanizeToolArgs` guarded tool arguments, not direct writes
 *   · `runOutput` guarded seven writes in `loop.server.ts` — and an EIGHTH
 *     writer was found in `agents.functions.ts` afterwards, and **two dashed
 *     rows still appeared after that**, from a path nobody has yet identified
 *
 * S1's measurement is what made the pattern legible: a column TOTAL answers a
 * question about history, and after a backfill it says nothing about whether the
 * path is open. Only rows created SINCE the fix answer that, and that count kept
 * coming back non-zero.
 *
 * ── SO IT IS ENFORCED WHERE THE WRITERS CONVERGE ───────────────────────────
 * A `BEFORE INSERT OR UPDATE` trigger on the three tables that render:
 * `agent_runs.output`, `decisions` (title, rationale, and both forecast fields)
 * and `signals` (title, content).
 *
 * IT SANITISES, IT DOES NOT REJECT, and that is the whole design. A CHECK
 * constraint would make the write FAIL, and a failed write loses the run's own
 * account of what it did — far worse than a typographic dash. This rewrites the
 * value and lets the write succeed, so no writer can lose data by being wrong.
 *
 * `forecast_claim` is the one that most needed this: it is immutable by another
 * trigger, so its INSERT is the only chance anyone ever gets to write it clean.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SQL = readFileSync(
  fileURLToPath(
    new URL(
      "../../../supabase/migrations/20260827020000_the_last_layer_every_writer_passes_through.sql",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("it sanitises rather than refusing", () => {
  it("is a BEFORE trigger, so it can rewrite the value", () => {
    expect(SQL).toContain("BEFORE INSERT OR UPDATE");
  });

  it("and is not a CHECK constraint, which would lose the write", () => {
    // A failed write loses the run's own account of what it did, which is far
    // worse than the dash it was refusing.
    expect(SQL).not.toMatch(/ADD CONSTRAINT \w+ CHECK/);
  });
});

describe("it mirrors humanize.ts exactly, in the same order", () => {
  it("a dash between digits becomes a range", () => {
    expect(SQL).toContain("'\\1 to \\2'");
  });

  it("a spaced dash becomes a sentence break", () => {
    expect(SQL).toContain("'\\s+[' || chr(8212) || chr(8211) || ']\\s+', ', '");
  });

  it("and any remaining dash becomes a comma", () => {
    expect(SQL).toContain("'[' || chr(8212) || chr(8211) || ']', ', '");
  });

  it("ASCII hyphens are never mentioned, so slugs and uuids survive", () => {
    // The rewrites name only U+2014 and U+2013. Nothing touches a plain "-".
    expect(SQL).not.toContain("'-'");
  });
});

describe("the three tables a person actually reads", () => {
  it("agent_runs.output, the agent's own line in the transcript", () => {
    expect(SQL).toContain("agent_runs_strip_dashes");
    expect(SQL).toContain("NEW.output := public.strip_ai_dashes(NEW.output)");
  });

  it("decisions, including BOTH forecast fields", () => {
    expect(SQL).toContain("NEW.forecast_claim := public.strip_ai_dashes(NEW.forecast_claim)");
    expect(SQL).toContain(
      "NEW.forecast_how_we_will_know := public.strip_ai_dashes(NEW.forecast_how_we_will_know)",
    );
  });

  it("and signals, which is what Discover files", () => {
    expect(SQL).toContain("signals_strip_dashes");
  });

  it("the reason forecast_claim most needed it is recorded", () => {
    // Immutable by another trigger: its INSERT is the only chance, ever.
    expect(SQL).toContain("immutable");
  });
});
