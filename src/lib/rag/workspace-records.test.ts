/**
 * The search that could not find the thing it was standing on.
 *
 * `workspace.search` promises "docs, PRDs, notes, signals, meetings" and reads
 * `rag_chunks`. Measured on the live database 2026-08-24, `rag_chunks` held
 * **17 rows, all of kind `finding`, one with an embedding** -- and they were the
 * QUESTIONS people had typed, not content: "sso", "what happened with
 * DEC-6416AD?", "can we add the dark mode to the app?". Not one signal, PRD,
 * decision, theme or learning had ever been indexed.
 *
 * So the tool every Discover agent reaches for first was structurally incapable
 * of returning a signal, and it answered "nothing here" every time. The agents
 * did the right thing with that answer -- refused to invent evidence, reported
 * the workspace empty -- and 18 tracks stalled at Discover while **72 signals
 * sat in the table**, 52 of them the agents' own notes recording that they had
 * found nothing. The loop was indexing its own emptiness back into itself.
 *
 * These tests cover the seam that fixes it. The riskiest thing about that seam
 * is not whether it finds rows; it is whether it can be made to read a workspace
 * the caller does not own, so that is what most of this file is about.
 */
import { describe, expect, it } from "bun:test";

import { SEARCHABLE_KINDS, scoreHit, searchTerms } from "./workspace-records.server";

describe("the terms an agent's query actually reduces to", () => {
  /**
   * THE LIVE QUERY, from the run that exposed this. The scout searched
   * `dark mode OR system preference OR theme OR canny` and got nothing back
   * while the matching Canny signal sat in the table.
   */
  it("drops the boolean words a model writes into its query", () => {
    expect(searchTerms("dark mode OR system preference OR theme OR canny")).toEqual([
      "dark",
      "mode",
      "system",
      "preference",
      "theme",
      "canny",
    ]);
  });

  /**
   * The old keyword fallback did `.filter(w => w.length > 3).join(" ")` and then
   * ILIKE'd the RESULT — one phrase, with the dropped words closed up. So
   * "dark mode OR system preference" became `%mode system preference%`, a string
   * that appears in no row ever written. A "keyword fallback" that can only match
   * a phrase it invented is not a fallback.
   */
  it("keeps the terms separate rather than gluing them into one phrase", () => {
    const terms = searchTerms("dark mode OR system preference");
    expect(terms).toContain("mode");
    expect(terms).toContain("preference");
    expect(terms.some((t) => t.includes(" "))).toBe(false);
  });

  it("drops short words, which match everything and rank nothing", () => {
    expect(searchTerms("the ui is on")).toEqual([]);
  });

  it("de-duplicates, so one repeated word cannot spend the whole budget", () => {
    expect(searchTerms("theme theme theme dark")).toEqual(["theme", "dark"]);
  });

  it("is bounded, because each term becomes a filter", () => {
    expect(searchTerms("alpha bravo charlie delta echo foxtrot golf hotel").length).toBe(6);
  });

  it("survives punctuation and casing", () => {
    expect(searchTerms("Dark-Mode, system_preference!")).toEqual([
      "dark",
      "mode",
      "system",
      "preference",
    ]);
  });
});

describe("what gets searched, and what deliberately does not", () => {
  /**
   * Knowledge, not containers. A mission is a container, a deployment is a URL,
   * and a task is a unit of work rather than a statement about the world.
   */
  it("covers the five kinds that carry what a workspace knows", () => {
    expect([...SEARCHABLE_KINDS]).toEqual(["signal", "theme", "decision", "prd", "learning"]);
  });

  it("does not search containers or addresses", () => {
    for (const noise of ["mission", "deployment", "task", "changeset"]) {
      expect(SEARCHABLE_KINDS).not.toContain(noise as never);
    }
  });
});

describe("ranking cannot outrank the index", () => {
  /**
   * The index is still the better answer when it has one. A keyword score that
   * could beat a real semantic similarity would make a cold cache look like a
   * confident hit, which is a subtler version of the bug being fixed.
   */
  it("never scores above 0.35, so a genuine ANN hit always wins", () => {
    expect(
      scoreHit(["dark", "mode"], "Dark Mode everywhere", "dark mode dark mode"),
    ).toBeLessThanOrEqual(0.35);
    expect(scoreHit(["a"], "a", "a")).toBeLessThanOrEqual(0.35);
  });

  it("ranks a title match above a body match, because a title is what a row is about", () => {
    const inTitle = scoreHit(["dark"], "Dark mode", "unrelated body");
    const inBody = scoreHit(["dark"], "Unrelated title", "mentions dark once");
    expect(inTitle).toBeGreaterThan(inBody);
  });

  it("scores a row that matches nothing at zero", () => {
    expect(scoreHit(["dark"], "Telemetry gap", "nothing relevant")).toBe(0);
  });

  it("does not divide by zero when there are no terms", () => {
    expect(scoreHit([], "anything", "anything")).toBe(0);
  });

  /** The live row this was built for has to outrank a passing mention. */
  it("puts the Canny request above a row that merely says the word", () => {
    const terms = searchTerms("dark mode system preference theme");
    const canny = scoreHit(
      terms,
      "Add Dark Mode & System Preference theme in addition to the light theme.",
      "",
    );
    const passing = scoreHit(terms, "Telemetry blind spot", "a theme was mentioned");
    expect(canny).toBeGreaterThan(passing);
  });
});

describe("tenant isolation, which is the thing that must not go wrong", () => {
  /**
   * These tables are read with whatever client the tool was handed, and on the
   * autonomous driver's path that is a SERVICE-ROLE client with no RLS. So the
   * workspace scope is the only thing standing between an agent's speculative
   * search and every other tenant's evidence.
   *
   * Asserted against the source because the failure mode is a MISSING line, and
   * a mock that returns rows would pass whether or not the filter was applied.
   */
  it("scopes every query by workspace and refuses when there is none", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      fileURLToPath(new URL("./workspace-records.server.ts", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("if (!workspaceId) return [];");
    expect(src).toContain('.eq("workspace_id", workspaceId)');
    // And the refusal must come before any query is built.
    const gate = src.indexOf("if (!workspaceId) return [];");
    const firstQuery = src.indexOf(".from(source.table)");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(firstQuery);
  });

  /**
   * PostgREST parses `or()` as a comma-separated list with parentheses, so a
   * term carrying those characters could change the shape of the filter rather
   * than the value inside it. Terms are already alphanumeric by construction;
   * this is the belt to that braces.
   */
  it("refuses terms that could restructure a PostgREST filter", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      fileURLToPath(new URL("./workspace-records.server.ts", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("function safeTerm");
    expect(src).toContain(".filter(safeTerm)");
    // The tokeniser splits on non-alphanumerics, so nothing risky survives it.
    expect(searchTerms("drop,table(users)").every((t) => /^[a-z0-9]+$/.test(t))).toBe(true);
  });
});
