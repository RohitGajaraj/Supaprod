import { describe, expect, test } from "bun:test";
import { chooseBuildDriverId } from "./claude-sdk-driver.server";
import type { BuildSpec } from "./driver";

describe("chooseBuildDriverId (automatic driver selection heuristic)", () => {
  test("routes small, bounded specs (1-3 files) to the native driver", () => {
    expect(chooseBuildDriverId({ goal: "test" })).toBe("claude-sdk");
    expect(chooseBuildDriverId({ goal: "test", targetFiles: [] })).toBe("claude-sdk");
    expect(chooseBuildDriverId({ goal: "test", targetFiles: ["src/app.ts"] })).toBe("native");
    expect(chooseBuildDriverId({ goal: "test", targetFiles: ["src/app.ts", "src/index.ts"] })).toBe(
      "native",
    );
    expect(chooseBuildDriverId({ goal: "test", targetFiles: ["a", "b", "c"] })).toBe("native");
  });

  test("routes larger or unbounded specs (4+ files or no targetFiles) to the SDK driver", () => {
    expect(chooseBuildDriverId({ goal: "test", targetFiles: ["a", "b", "c", "d"] })).toBe(
      "claude-sdk",
    );
    expect(chooseBuildDriverId({ goal: "test", targetFiles: Array(10).fill("file.ts") })).toBe(
      "claude-sdk",
    );
    expect(chooseBuildDriverId({ goal: "test", targetFiles: undefined })).toBe("claude-sdk");
  });

  test("specs with explicit null targetFiles default to SDK driver (unbounded)", () => {
    expect(chooseBuildDriverId({ goal: "test", targetFiles: null as unknown as never })).toBe(
      "claude-sdk",
    );
  });
});
