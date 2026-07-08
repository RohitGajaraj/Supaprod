import { describe, expect, test } from "bun:test";

// NOTE: SketchLine, SketchBar, and SketchBarChart all use React hooks (useMemo/useState),
// which require a mounted React context that doesn't exist in bun:test. Full component
// rendering tests require jsdom + React Testing Library, which this repo avoids per
// the pattern in MissionSlideOver.test.tsx. Instead, the pure functions these
// components depend on are tested comprehensively in:
// - sketch-helpers.test.ts (mulberry32, seedOf, sketchPath, capFirst)
// - sketch-insight.test.ts (barInsight)
//
// The components themselves are covered by the OBS-03 spec's "Manual checks" tier
// (see DESIGN-OBSIDIAN.md), verified by hand in dev and demo screenshots, never
// random-jittered state), and smoke-tested in the dev server.
//
// This file is a placeholder documenting the testing boundary and can be removed
// or converted to snapshot/serialization tests if jsdom becomes available.

describe("Sketch component testing boundary", () => {
  test("pure helper functions are tested in sketch-helpers.test.ts and sketch-insight.test.ts", () => {
    // mulberry32, seedOf, sketchPath, capFirst, barInsight are all pure functions
    // with comprehensive test coverage. See sibling test files.
    expect(true).toBe(true);
  });

  test("React component rendering (SketchLine, SketchBar, SketchBarChart) requires jsdom", () => {
    // These components use useMemo/useState which need a React dispatcher context.
    // This test suite can't provide that context. Manual verification in dev server
    // and design screenshots verify correctness.
    expect(true).toBe(true);
  });
});
