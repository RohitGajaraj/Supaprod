// Journeys-as-data gate (front-end reimagining): the catalog encoding must
// stay honest. The heavyweight check here is wiring verification: every
// journey names real server functions (file + export) and this suite opens
// each file and fails when the export is missing, so a journey chip can
// never ship pointing at wiring that does not exist (claim never outruns
// wiring). Deliberately fs-based and synchronous, same shape as
// surface-registry.test.ts.
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  FULL_LOOP_CHAIN,
  JOURNEYS,
  journeyById,
  journeyForIntent,
  spineSliceFor,
  type Journey,
  type JourneyId,
} from "../journeys";
import { LOOP_STAGES } from "../loop-state.functions";

// src/lib/__tests__ -> repo root is three levels up.
const REPO_ROOT = join(import.meta.dir, "..", "..", "..");

const ids = JOURNEYS.map((j) => j.id);

describe("journeys catalog shape", () => {
  test("ids are unique and cover j0..j7", () => {
    expect(new Set(ids).size).toBe(JOURNEYS.length);
    expect([...ids].sort()).toEqual(["j0", "j1", "j2", "j3", "j4", "j5", "j6", "j7"]);
  });

  test("labels are plain words: non-empty, humanized, no AI-tell dashes", () => {
    for (const j of JOURNEYS) {
      expect(j.label.trim().length).toBeGreaterThan(0);
      for (const text of [j.label, j.startState, j.doneState]) {
        expect(text, `em/en dash in ${j.id}: ${text}`).not.toMatch(/[–—]/);
      }
    }
  });

  test("every journey's stages are valid loop stages, in loop order, non-empty", () => {
    const order = new Map(LOOP_STAGES.map((s, i) => [s, i]));
    for (const j of JOURNEYS) {
      expect(j.stages.length, `${j.id} has an empty slice`).toBeGreaterThan(0);
      for (const s of j.stages) {
        expect(order.has(s), `${j.id} names unknown stage ${s}`).toBe(true);
      }
      const indices = j.stages.map((s) => order.get(s)!);
      expect(indices, `${j.id} stages out of loop order`).toEqual(
        [...indices].sort((a, b) => a - b),
      );
    }
  });

  test("every handoff has an artifact kind and points at a real journey", () => {
    const known = new Set<JourneyId>(ids);
    for (const j of JOURNEYS) {
      expect(j.handoff.artifactKind.trim().length, `${j.id} handoff artifactKind`).toBeGreaterThan(
        0,
      );
      expect(
        known.has(j.handoff.suggestedNextJourneyId),
        `${j.id} hands off to unknown journey ${j.handoff.suggestedNextJourneyId}`,
      ).toBe(true);
    }
  });

  test("j0 is the chain of the slices: full spine, chain ids real, wiring is the union", () => {
    const j0 = journeyById("j0");
    expect(j0.stages).toEqual([...LOOP_STAGES]);
    expect(FULL_LOOP_CHAIN.every((id) => id !== "j0" && ids.includes(id))).toBe(true);
    // The chain covers every slice journey exactly once.
    expect([...FULL_LOOP_CHAIN].sort()).toEqual(["j1", "j2", "j3", "j4", "j5", "j6", "j7"]);
    // j0's wiring contains every chained slice's wiring (composition, not a
    // separate machine).
    const j0Keys = new Set(j0.wiredVia.map((w) => `${w.file}#${w.fn}`));
    for (const id of FULL_LOOP_CHAIN) {
      for (const w of journeyById(id).wiredVia) {
        expect(j0Keys.has(`${w.file}#${w.fn}`), `j0 wiring missing ${w.fn} from ${id}`).toBe(true);
      }
    }
  });
});

describe("wiring honesty (claim never outruns wiring)", () => {
  test("every journey has wiring, and every named export exists in its file", () => {
    for (const j of JOURNEYS) {
      expect(j.wiredVia.length, `${j.id} ships with no wiring`).toBeGreaterThan(0);
      for (const w of j.wiredVia) {
        const abs = join(REPO_ROOT, w.file);
        expect(existsSync(abs), `${j.id}: ${w.file} does not exist`).toBe(true);
        const source = readFileSync(abs, "utf8");
        const exported =
          source.includes(`export const ${w.fn} `) ||
          source.includes(`export const ${w.fn}=`) ||
          source.includes(`export function ${w.fn}(`) ||
          source.includes(`export async function ${w.fn}(`);
        expect(exported, `${j.id}: ${w.file} does not export ${w.fn}`).toBe(true);
      }
    }
  });
});

describe("spineSliceFor", () => {
  test("returns the catalog slices", () => {
    expect(spineSliceFor("j1")).toEqual(["discover", "decide"]);
    expect(spineSliceFor("j2")).toEqual(["decide"]);
    expect(spineSliceFor("j3")).toEqual(["plan"]);
    expect(spineSliceFor("j4")).toEqual(["build"]);
    expect(spineSliceFor("j5")).toEqual(["design"]);
    expect(spineSliceFor("j6")).toEqual(["ship"]);
    expect(spineSliceFor("j7")).toEqual(["learn"]);
    expect(spineSliceFor("j0")).toEqual([...LOOP_STAGES]);
  });

  test("returns a copy: mutating the result never corrupts the catalog", () => {
    const slice = spineSliceFor("j1");
    slice.pop();
    expect(spineSliceFor("j1")).toEqual(["discover", "decide"]);
  });
});

describe("journeyForIntent", () => {
  const cases: Array<[string, JourneyId]> = [
    ["What should we build next?", "j1"],
    ["what's next for us", "j1"],
    ["Tear this idea down", "j2"],
    ["run a teardown on the export bet", "j2"],
    ["Just write the PRD for checkout autofill", "j3"],
    ["write the spec", "j3"],
    ["build SPEC-14", "j4"],
    ["implement the retry logic", "j4"],
    ["design this screen", "j5"],
    ["give me a mockup", "j5"],
    ["launch what we shipped", "j6"],
    ["draft the release notes", "j6"],
    ["how did it land?", "j7"],
    ["record the outcome", "j7"],
    ["take it from signal to shipped", "j0"],
    ["run the full loop", "j0"],
  ];

  for (const [text, expected] of cases) {
    test(`"${text}" -> ${expected}`, () => {
      expect(journeyForIntent(text)?.id).toBe(expected);
    });
  }

  test("specific phrasing beats generic verbs: 'what should we build next' is j1, not j4", () => {
    expect(journeyForIntent("what should we build next")?.id).toBe("j1");
  });

  test("no match returns null, never a guess", () => {
    expect(journeyForIntent("")).toBeNull();
    expect(journeyForIntent("   ")).toBeNull();
    expect(journeyForIntent("good morning")).toBeNull();
    expect(journeyForIntent("why did we decide X")).toBeNull();
  });

  test("pure: same input, same output", () => {
    const a = journeyForIntent("build SPEC-14");
    const b = journeyForIntent("build SPEC-14");
    expect(a).toBe(b as Journey);
  });
});
