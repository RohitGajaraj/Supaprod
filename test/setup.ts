// Test environment setup for Bun + React Testing Library
// This file is preloaded by bunfig.toml [test] section before running tests.
// Bun test has NO built-in DOM; happy-dom registers document/window globals
// so DOM-mounted component tests (render, fireEvent, queries) actually run.
//
// ORDER MATTERS: static ESM imports are hoisted, so RTL must be loaded via
// dynamic import AFTER GlobalRegistrator.register() has created `document`.
// RTL binds its `screen` queries to the global document at module eval time.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

const { afterEach } = await import("bun:test");
const { cleanup } = await import("@testing-library/react");

// Clean up after each test to prevent state leakage between tests
afterEach(() => {
  cleanup();
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});
