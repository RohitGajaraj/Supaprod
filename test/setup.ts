// Test environment setup for Bun + React Testing Library
// This file is preloaded by bunfig.toml [test] section before running tests.
// Bun has built-in DOM support via WebKit, so minimal setup is needed.

import { afterEach } from "bun:test";

// Clean up after each test to prevent state leakage
afterEach(() => {
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
  }
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});
