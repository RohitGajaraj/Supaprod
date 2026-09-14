import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  parseStarterRuns,
  readStarterRunsRefusal,
  readStoredStarterRuns,
  STARTER_RUNS_SYSTEM,
  starterRunsPrompt,
  starterRunsState,
} from "./starter-runs";

describe("a fresh product's first three runs", () => {
  it("the prompt carries the name, the positioning line and the north star, and says when it has neither", () => {
    expect(
      starterRunsPrompt({ name: "Prism", northStar: "Homeowners see their roof pay off" }),
    ).toBe("Product: Prism\nNorth star: Homeowners see their roof pay off");
    // FirstRun writes its one line as positioning, never as the goal.
    expect(
      starterRunsPrompt({
        name: "Prism",
        northStar: null,
        positioning: "An expense tool for freelancers",
      }),
    ).toBe(
      "Product: Prism\nPositioning (who it is for, what it does): An expense tool for freelancers",
    );
    expect(starterRunsPrompt({ name: "Prism", northStar: "  " })).toContain(
      "Nothing else is stated yet",
    );
  });

  it("the system prompt asks for the person's product, as JSON, three at most", () => {
    expect(STARTER_RUNS_SYSTEM).toContain("JSON only");
    expect(STARTER_RUNS_SYSTEM).toContain("at most");
    expect(STARTER_RUNS_SYSTEM).toContain("never about the tool doing the work");
  });

  it("reads at most three well-formed entries and invents none", () => {
    const runs = parseStarterRuns({
      runs: [
        {
          sentence: " Find out why  installers  call support twice a week ",
          why: "It sets the first fix.",
        },
        { sentence: "", why: "dropped, no sentence" },
        { sentence: "Only a sentence" },
        { sentence: "Two", why: "two" },
        { sentence: "Three", why: "three" },
        { sentence: "Four", why: "four" },
      ],
    });
    expect(runs).toEqual([
      {
        sentence: "Find out why installers call support twice a week",
        why: "It sets the first fix.",
      },
      { sentence: "Two", why: "two" },
      { sentence: "Three", why: "three" },
    ]);
  });

  it("a long sentence is cut with an ellipsis rather than shown in full", () => {
    /*
     * THE BOUND DROPPED FROM 140 TO 72 ON 2026-09-14, and the reason is on
     * `SENTENCE_MAX`: 140 was roughly twice what a `PickCard` holds at three
     * lines in this grid, so all three cards on the first screen a fresh
     * workspace ever shows rendered a clipped subordinate clause ending in an
     * ellipsis. Measured on the served product, three of three.
     *
     * The truncation BEHAVIOUR is what this test is about and it is unchanged;
     * only the number moved. The prompt now states the same number, so the model
     * aims at the bound instead of being cut at it.
     */
    const [run] = parseStarterRuns({ runs: [{ sentence: "x".repeat(200), why: "y" }] });
    expect(run?.sentence.length).toBe(72);
    expect(run?.sentence.endsWith("…")).toBe(true);
  });

  it("a row stored under the old bound reads as stale, so the sweep rewrites it", () => {
    /*
     * `clean()` truncates rather than rejecting, so without this a row written
     * under the 140 bound would render clipped for ever -- the defect the new
     * bound removes, preserved by the fix for it. Null here sends
     * `starterRunsState` to `unclaimed` and the minute sweep regenerates the row
     * against the new prompt, with no migration and no manual reset.
     *
     * Keyed on the RAW length, because after truncation a clipped sentence and a
     * naturally short one are indistinguishable.
     */
    const old = { runs: [{ sentence: "x".repeat(120), why: "y" }] };
    expect(readStoredStarterRuns(old)).toBeNull();
    expect(starterRunsState({ starter_runs: old, starter_runs_at: null }, Date.now())).toBe(
      "unclaimed",
    );
    /* A row already within the bound is untouched and still serves. */
    const fresh = { runs: [{ sentence: "Let people undo a delete", why: "y" }] };
    expect(readStoredStarterRuns(fresh)).toEqual([
      { sentence: "Let people undo a delete", why: "y" },
    ]);
    /* And a refusal is still final rather than being read as stale. */
    const refused = { runs: [], refused: { reason: "no", at: "2026-09-01T00:00:00Z" } };
    expect(starterRunsState({ starter_runs: refused, starter_runs_at: null }, Date.now())).toBe(
      "refused",
    );
  });

  it("nothing usable is an empty list, and a stored empty set reads as not generated", () => {
    expect(parseStarterRuns(null)).toEqual([]);
    expect(parseStarterRuns({ runs: "no" })).toEqual([]);
    expect(readStoredStarterRuns({ runs: [] })).toBeNull();
    expect(readStoredStarterRuns(null)).toBeNull();
    expect(readStoredStarterRuns({ runs: [{ sentence: "a", why: "b" }] })).toEqual([
      { sentence: "a", why: "b" },
    ]);
  });

  it("the read generates once on a miss and completeOnboarding kicks it off", () => {
    const src = readFileSync("src/lib/onboarding.functions.ts", "utf8");
    expect(src).toContain("export const listStarterRuns");
    expect(src).toContain("generateStarterRunsForProduct(");
    const from = src.indexOf("export async function completeOnboardingCore");
    const end = src.indexOf("\nexport ", from + 1);
    expect(from).toBeGreaterThan(-1);
    // Since 2026-09-08 the kick is behind the response (keepStarterRuns wraps
    // the generation and keeps a refusal); nobody is held for the machine.
    expect(src.slice(from, end)).toContain("void keepStarterRuns(db, userId, productId);");
    // Stored on the row, so the home's read is a row read.
    expect(src).toContain(".update({ starter_runs: { runs }, starter_runs_at:");
  });
});

describe("a refusal is final, a claim is a wait", () => {
  it("a refusal kept on the row is read back with its reason and time", () => {
    expect(
      readStarterRunsRefusal({
        runs: [],
        refused: { reason: "The model refused.", at: "2026-09-08T09:00:00.000Z" },
      }),
    ).toEqual({ reason: "The model refused.", at: "2026-09-08T09:00:00.000Z" });
    expect(readStarterRunsRefusal({ runs: [] })).toBeNull();
    expect(readStarterRunsRefusal({ refused: { reason: " ", at: "x" } })).toBeNull();
    expect(readStarterRunsRefusal(null)).toBeNull();
  });

  it("the read answers a refusal as final and a claim as pending, at once", () => {
    const src = readFileSync("src/lib/onboarding.functions.ts", "utf8");
    const from = src.indexOf("export const listStarterRuns");
    const end = src.indexOf("\nexport ", from + 1);
    const body = src.slice(from, end === -1 ? undefined : end);
    // The row's state decides (starterRunsState): a kept refusal is answered
    // as final with its reason; a live claim or a fresh claim is pending, at
    // once, with no hold on the model. The refusal is written by
    // keepStarterRuns, wherever the generation ran.
    expect(body).toContain('case "refused":');
    expect(body).toContain("reason: readStarterRunsRefusal(row.starter_runs)?.reason");
    expect(body).toContain("return { pending: true, runs: [], reason: null };");
    const keepAt = src.indexOf("export async function keepStarterRuns");
    const keep = src.slice(keepAt, src.indexOf("\nexport ", keepAt + 1));
    expect(keep).toContain("starter_runs: { runs: [], refused: { reason, at } }");
  });
});
