import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  parseStarterRuns,
  readStarterRunsRefusal,
  readStoredStarterRuns,
  STARTER_RUNS_SYSTEM,
  starterRunsPrompt,
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
    const [run] = parseStarterRuns({ runs: [{ sentence: "x".repeat(200), why: "y" }] });
    expect(run?.sentence.length).toBe(140);
    expect(run?.sentence.endsWith("…")).toBe(true);
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
    const from = src.indexOf("export const completeOnboarding");
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
