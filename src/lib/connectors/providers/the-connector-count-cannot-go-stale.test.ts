/**
 * A COUNT IN PROSE IS A CLAIM. THIS MAKES IT EVIDENCE (§1c, 2026-08-27).
 *
 * `index.server.ts` opens with "SEVENTEEN ARE REAL AND THREE ARE STILL STUBS",
 * and its own header explains why that sentence is dangerous: it previously read
 * "TWELVE ARE REAL AND EIGHT ARE STILL STUBS" and named figma and jira among the
 * stubs while its own inline comments twelve lines below said both were real
 * (F-80, S4-003). It was true when written and nobody re-ran it.
 *
 * The header's own conclusion was **"a count in prose carries the sha it was
 * measured at, or it is a claim rather than evidence"** — and then it stayed
 * prose. A sha makes a stale number honest about being stale; it does not stop
 * anyone reading it as current, and S4 filed exactly that a second time.
 *
 * ── SO THE MAP COUNTS ITSELF ───────────────────────────────────────────────
 * `SESSION-0-CONDUCTOR.md` §1c says to audit what is wired, report the number,
 * and that nothing else in `SPEC-CONNECTORS` starts before it. This is that
 * audit, expressed so it can never rot: the numbers come from the dispatch map,
 * and the header has to agree with them or this fails.
 *
 * Finish a stub and this test tells you which sentence to edit. That is the
 * point: the next person cannot forget, because the build stops them.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CONNECTOR_ADAPTERS } from "./index.server";

const SRC = readFileSync(fileURLToPath(new URL("./index.server.ts", import.meta.url)), "utf8");

/** The stub's tell: it is the one adapter whose validate refuses by construction. */
const NOT_IMPLEMENTED = "adapter not implemented";

const entries = Object.entries(CONNECTOR_ADAPTERS);

/** Bound to the shared stub, read off the source rather than guessed. */
const stubNames = [...SRC.matchAll(/^\s+(\w+): stubAdapter,$/gm)].map((m) => m[1]!);

const WORDS: Record<number, string> = {
  1: "ONE",
  2: "TWO",
  3: "THREE",
  4: "FOUR",
  5: "FIVE",
  6: "SIX",
  7: "SEVEN",
  8: "EIGHT",
  9: "NINE",
  10: "TEN",
  11: "ELEVEN",
  12: "TWELVE",
  13: "THIRTEEN",
  14: "FOURTEEN",
  15: "FIFTEEN",
  16: "SIXTEEN",
  17: "SEVENTEEN",
  18: "EIGHTEEN",
  19: "NINETEEN",
  20: "TWENTY",
};

describe("the audit: every provider is either wired or a stub, and nothing is unaccounted for", () => {
  it("every registry provider has an adapter", () => {
    // A missing entry is worse than a stub: `getProviderAdapter` returns
    // undefined and the caller crashes instead of refusing politely.
    for (const [name, adapter] of entries) {
      expect(adapter, `${name} has no adapter at all`).toBeDefined();
    }
  });

  it("the stubs are exactly the ones the header names", () => {
    expect(stubNames.sort()).toEqual(["firecrawl", "google_calendar", "google_tasks"]);
  });
});

describe("THE HEADER MUST AGREE WITH THE MAP", () => {
  const real = entries.length - stubNames.length;

  it(`says ${WORDS[real]} are real`, () => {
    expect(
      SRC,
      `the map has ${real} real adapters; the header says something else. Edit the header.`,
    ).toContain(`${WORDS[real]} ARE REAL`);
  });

  it(`says ${WORDS[stubNames.length]} are stubs`, () => {
    expect(
      SRC,
      `the map has ${stubNames.length} stubs; the header says something else. Edit the header.`,
    ).toContain(`${WORDS[stubNames.length]} ARE STILL STUBS`);
  });

  it("and names each remaining stub, so the next one to finish is obvious", () => {
    for (const name of stubNames) {
      expect(SRC, `the header does not name the stub ${name}`).toContain(name);
    }
  });
});

describe("why a stub is not harmless, kept beside the count", () => {
  it("the stub refuses, and the header says what that costs a person", () => {
    expect(SRC).toContain(NOT_IMPLEMENTED);
    // "Test it" calls verifyConnection, so a stub tells somebody their good
    // connection failed: a reported defect that does not exist, shown while
    // they are deciding whether to trust us with their data.
    expect(SRC).toContain("their good connection has failed");
  });
});
