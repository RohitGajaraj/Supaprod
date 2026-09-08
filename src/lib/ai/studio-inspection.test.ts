import { describe, it, expect } from "vitest";
import { isTestPath } from "./studio-inspection";

describe("isTestPath", () => {
  it("matches .test / .spec files of any js/ts flavor", () => {
    expect(isTestPath("src/lib/foo.test.ts")).toBe(true);
    expect(isTestPath("src/lib/foo.spec.tsx")).toBe(true);
    expect(isTestPath("src/lib/foo.test.js")).toBe(true);
    expect(isTestPath("src/lib/foo.spec.mjs")).toBe(true);
  });

  it("matches files under __tests__ / test / tests dirs", () => {
    expect(isTestPath("src/__tests__/foo.ts")).toBe(true);
    expect(isTestPath("test/foo.ts")).toBe(true);
    expect(isTestPath("packages/x/tests/foo.ts")).toBe(true);
  });

  it("does not match ordinary source files", () => {
    expect(isTestPath("src/lib/foo.ts")).toBe(false);
    expect(isTestPath("src/components/Latest.tsx")).toBe(false); // 'test' inside a word
    expect(isTestPath("docs/testing.md")).toBe(false);
  });
});
