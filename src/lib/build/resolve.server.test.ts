import { afterEach, describe, expect, test } from "bun:test";
import { resolveBuildDriver } from "./resolve.server";
import { nativeBuildDriver } from "./native.server";
import { openHandsBuildDriver } from "./openhands.server";
import { normalizeBuildDriverId } from "./driver";

// Restore env after each test so resolution tests never leak into each other
// (same idiom as delegate/provider.test.ts).
const savedEnv = { ...process.env };
afterEach(() => {
  for (const k of ["BUILD_DRIVER", "DELEGATE_OUTBOUND_ENABLED", "OPENHANDS_ENDPOINT"]) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

function clearEnv() {
  delete process.env.BUILD_DRIVER;
  delete process.env.DELEGATE_OUTBOUND_ENABLED;
  delete process.env.OPENHANDS_ENDPOINT;
}

function enableOpenHands() {
  process.env.DELEGATE_OUTBOUND_ENABLED = "1";
  process.env.OPENHANDS_ENDPOINT = "https://oh.internal";
}

describe("normalizeBuildDriverId (pure)", () => {
  test("accepts known ids, trims + lowercases, rejects the rest", () => {
    expect(normalizeBuildDriverId("native")).toBe("native");
    expect(normalizeBuildDriverId("  OpenHands ")).toBe("openhands");
    expect(normalizeBuildDriverId("claude-sdk")).toBe("claude-sdk");
    expect(normalizeBuildDriverId("gemini")).toBe(null);
    expect(normalizeBuildDriverId("")).toBe(null);
    expect(normalizeBuildDriverId(null)).toBe(null);
    expect(normalizeBuildDriverId(undefined)).toBe(null);
  });
});

describe("resolveBuildDriver (preferred → env → native floor)", () => {
  test("defaults to the native adapter with nothing configured", () => {
    clearEnv();
    expect(resolveBuildDriver()).toBe(nativeBuildDriver);
    expect(resolveBuildDriver().id).toBe("native");
  });

  test("BUILD_DRIVER=openhands resolves the openhands adapter once the delegate seam is live", () => {
    clearEnv();
    process.env.BUILD_DRIVER = "openhands";
    enableOpenHands();
    expect(resolveBuildDriver()).toBe(openHandsBuildDriver);
  });

  test("BUILD_DRIVER=openhands degrades to native while delegation is dormant", () => {
    clearEnv();
    process.env.BUILD_DRIVER = "openhands";
    expect(resolveBuildDriver()).toBe(nativeBuildDriver);
  });

  test("the preferred param beats the env var", () => {
    clearEnv();
    process.env.BUILD_DRIVER = "native";
    enableOpenHands();
    expect(resolveBuildDriver("openhands")).toBe(openHandsBuildDriver);
  });

  test("an unknown or reserved-but-unwired preference falls back cleanly", () => {
    clearEnv();
    expect(resolveBuildDriver("gemini")).toBe(nativeBuildDriver);
    expect(resolveBuildDriver("devin")).toBe(nativeBuildDriver); // reserved id, no adapter
  });

  test("a garbage BUILD_DRIVER env value falls back to native", () => {
    clearEnv();
    process.env.BUILD_DRIVER = "not-a-driver";
    expect(resolveBuildDriver()).toBe(nativeBuildDriver);
  });
});
