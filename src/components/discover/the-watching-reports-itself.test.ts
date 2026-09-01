/**
 * THE SCOUT WROTE DOWN THAT IT FAILED AND NOTHING READ THE COLUMN.
 *
 * WHY THIS EXISTS. Measured 2026-08-20: `scout_runs` had exactly two queries
 * against it in the whole codebase. One sums `fetch_count` for the daily cap.
 * The other is the insert. **So six of its seven columns were written on every
 * run and read by nothing**, including `outcome`, whose CHECK constraint allows
 * `error` and `skipped-cap`. A scout failing on every target, or truncated by
 * its own cap, recorded exactly that and showed it to nobody -- not even an
 * admin.
 *
 * THE PART THAT MADE IT WORSE THAN A MISSING READER. `getSenseCoverage`'s `quiet`
 * flag is computed from `signals` alone: delivered before, silent now. A source
 * whose every fetch errors produces no signals, **so it read as `quiet` -- and
 * "quiet" tells you the source has nothing new, when the truth is that we could
 * not reach it.** Those send a person in opposite directions.
 *
 * WHAT THIS FILE CAN AND CANNOT ASSERT. It reads source text, which is the
 * precedent `discover-boundary.test.ts` set for this surface for a stated reason:
 * `DiscoverSurface.tsx` is 163 KB behind a dozen server functions, and a render
 * harness for it would assert the harness. So this pins the DECISIONS -- which
 * table is read, which condition gates the section, which tone each outcome
 * wears -- and it cannot prove a pixel. **Nobody has seen these rows render.**
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SURFACE = readFileSync(join(import.meta.dir, "DiscoverSurface.tsx"), "utf8");
const FUNCTIONS = readFileSync(join(import.meta.dir, "../../lib/discovery.functions.ts"), "utf8");
const WRITER = readFileSync(
  join(import.meta.dir, "../../routes/api/public/hooks/scout-tick.ts"),
  "utf8",
);

/** Whole-file `toContain` prints thousands of lines on failure. One line instead. */
const has = (haystack: string, needle: string, what: string) =>
  expect(haystack.includes(needle), `expected to find ${what}`).toBe(true);

describe("the outcome column is read", () => {
  it("queries scout_runs, which had no reader but the rate limiter", () => {
    has(FUNCTIONS, `.from("scout_runs")`, "a read of scout_runs in getSenseCoverage");
    has(FUNCTIONS, `.select("outcome,created_at,detail")`, "the outcome column being selected");
  });

  it("counts enabled targets, so silence can be told from nothing being asked for", () => {
    // Without this, "your sources have not been checked yet" and "you have asked
    // us to watch nothing" are the same rendering, and guessing wrong means
    // telling somebody their watcher is broken when they never set one up.
    has(FUNCTIONS, `.from("scout_targets")`, "a read of scout_targets");
    has(FUNCTIONS, `.eq("enabled", true)`, "only enabled targets being counted");
  });

  it("reads the newest check outside the seven-day window", () => {
    /*
     * MEASURED, not defensive. `scout/diff.ts`'s `backoffNext` multiplies the
     * cadence by `min(2 ** consecutiveUnchanged, MAX_BACKOFF_FACTOR)` and the
     * factor caps at 8, against a `weekly` period of 7 days -- so a target that
     * keeps coming back unchanged legitimately waits up to 56 DAYS between
     * checks. A windowed read alone therefore cannot answer "when was this last
     * checked", and a surface that guessed would call a resting watcher broken.
     */
    const diff = readFileSync(join(import.meta.dir, "../../lib/scout/diff.ts"), "utf8");
    has(diff, "MAX_BACKOFF_FACTOR = 8", "the backoff cap this reasoning depends on");
    has(FUNCTIONS, "const latest = await supabase", "an unwindowed read for the last check");
    has(FUNCTIONS, "lastCheckAt", "the last check being returned");
  });

  it("adds no write path: the scout still records, and is not read from", () => {
    // The item scoped this to a READER. `scout-tick.ts` is the writer and stays
    // as it is; everything the surface shows was already on every row.
    has(WRITER, `await db.from("scout_runs").insert({`, "the writer's insert, unchanged");
    expect(WRITER.includes("getSenseCoverage")).toBe(false);
  });
});

describe("the reader accounts for every outcome the writer can produce", () => {
  /*
   * A READER THAT SILENTLY IGNORES A SIXTH VALUE IS THIS DEFECT AGAIN, one turn
   * later. The writer's own union is the source of truth, and it agrees with the
   * migration's CHECK constraint. If somebody adds an outcome, this fails and
   * they have to decide what the surface says about it.
   */
  const UNION =
    `outcome: "first-seen" | "unchanged" | "changed" | "error" | "skipped-cap";`.replace(
      /\s+/g,
      " ",
    );

  it("pins the writer's outcome domain to the five values", () => {
    expect(WRITER.replace(/\s+/g, " ").includes(UNION)).toBe(true);
  });

  it("branches on both unhappy values by name", () => {
    has(FUNCTIONS, `r.outcome === "error"`, "the error outcome being counted");
    has(FUNCTIONS, `r.outcome === "skipped-cap"`, "the capped outcome being counted");
  });
});

describe("the section reaches the workspace that needs it most", () => {
  it("is not gated on a signal ever having arrived", () => {
    /*
     * THE DEFECT THIS PREVENTS, and it is the one worth the whole item. The
     * section was gated on `hasCoverage`, which is `cov.sources.length > 0`. A
     * scout erroring on every target produces NO signals, so that is false --
     * **so the workspace whose watching is most broken is the one this section
     * would have said nothing to.** The reader who needs the warning was the
     * reader the condition excluded.
     */
    has(SURFACE, "(hasCoverage || hasWatching) && cov ?", "the widened section condition");
    has(SURFACE, "const hasWatching =", "a flag independent of the sources list");
  });

  it("derives that flag from the watching, never from the sources", () => {
    const line = SURFACE.split("\n").find((l) => l.includes("const hasWatching ="));
    expect(line).toBeDefined();
    expect(line).toContain("scout.targets > 0 || scout.checks > 0");
    // The whole point: no reference to the signal side of the read.
    expect(line).not.toContain("sources");
  });

  it("keeps the rail out of the context column when there is genuinely nothing", () => {
    // A workspace watching nothing, with no signals, renders no section rather
    // than an empty bordered aside. `hasContext` is the flag `Surface` reads.
    has(SURFACE, "hasWatching || hasEvidence", "hasWatching folded into hasContext");
  });

  it("says the read failed rather than going quiet, like the two branches above it", () => {
    has(SURFACE, "scout.unread", "an explicit failed-read branch");
    has(
      SURFACE,
      "Whether your sources were checked did not load",
      "the failed-read sentence, which never reads as a clean bill of health",
    );
  });
});

describe("the three unhappy outcomes are three different facts", () => {
  it("paints a failed read as an outcome", () => {
    // Red reports something that HAPPENED, which is the only thing this system's
    // red is allowed to mean.
    has(SURFACE, `<Value tone="fail">`, "the fail tone on the error row");
    has(SURFACE, "could not read the", "the error row naming what failed");
  });

  it("paints the cap amber, and never red or orchid", () => {
    /*
     * THE ONE COLOUR DECISION HERE WORTH A GUARD. A capped check is not a
     * failure: the scout worked exactly as configured and the CONFIGURATION ran
     * out. Red would report an outcome that did not happen. Orchid promises a
     * person is required, and nobody is -- the cap resets tomorrow on its own.
     * Amber means waiting on a condition, the condition is the cap, and the door
     * is how you change it rather than a demand that you do. Painting this as a
     * fault is the exact amber/orchid confusion K-18 found on the gates.
     */
    const row = SURFACE.slice(
      SURFACE.indexOf("the daily cap stopped") - 1200,
      SURFACE.indexOf("the daily cap stopped") + 400,
    );
    expect(row).toContain(`<Value tone="hold">`);
    expect(row).not.toContain(`<Value tone="fail">`);
    expect(row).not.toContain("mrd-you");
  });

  it("gives the cap a door, because the condition is one a person can change", () => {
    const row = SURFACE.slice(
      SURFACE.indexOf("the daily cap stopped"),
      SURFACE.indexOf("the daily cap stopped") + 700,
    );
    expect(row).toContain("raise it in Settings");
    expect(row).toContain(`section: "connections"`);
  });

  it("lets the healthy case say so without shouting", () => {
    /*
     * `unchanged` is the ordinary state of a source being watched properly, so a
     * green mark would spend the outcome colour on nothing happening. The row
     * exists at all because "we checked and there was nothing" and "we did not
     * check" are different facts, and without it the ABSENCE of a warning meant
     * both.
     */
    const at = SURFACE.indexOf("none failed");
    expect(at).toBeGreaterThan(0);
    const row = SURFACE.slice(at - 700, at + 500);
    expect(row).not.toContain("<Value");
    has(SURFACE, "scout.errors === 0 && scout.capped === 0", "the healthy condition");
  });

  it("makes no claim about a week with no checks in it", () => {
    // 56 days is a legal gap for a backed-off weekly target, so this row says
    // WHEN and lets the reader judge rather than guessing WHETHER.
    const at = SURFACE.indexOf("none\n                            checked this week");
    const idx = at > 0 ? at : SURFACE.indexOf("checked this week");
    expect(idx).toBeGreaterThan(0);
    const row = SURFACE.slice(idx - 1400, idx + 900);
    expect(row).not.toContain("<Value");
    expect(row).toContain("a quiet source is checked less often");
  });
});
