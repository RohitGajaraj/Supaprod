#!/usr/bin/env bash
#
# check-test-runner.sh - refuse test files written against the wrong runner.
#
# WHY THIS EXISTS. On 2026-07-25 the suite was carrying 79 failures. Forty five of
# them came from two files that used the Jest globals (jest.fn(), jest.Mock,
# jest.useFakeTimers()) while this repo runs Bun's test runner, where `jest` is not
# a global. Every test in those files died on `ReferenceError: jest is not defined`
# before asserting anything. They had never passed, and nothing caught them landing.
#
# A permanently red suite is worse than no suite: it cannot tell you whether today's
# change broke something, so people stop reading it. This guard keeps that specific
# rot out.
#
# THE RULE. In a test file, reach for Bun's API:
#   import { describe, it, expect, mock, jest, type Mock } from "bun:test";
# `jest` imported FROM bun:test is fine and supported (fn, spyOn, useFakeTimers,
# advanceTimersByTime all exist). What is banned is the bare global, which only
# looks right because Jest happens to define one.
#
# Usage: scripts/check-test-runner.sh
# Exit 0 clean, exit 1 with the offending file:line listed.

set -uo pipefail
cd "$(dirname "$0")/.."

fail=0

# A test file that says `jest.` must also import jest from bun:test. Anything else
# is the bare global and will throw at runtime.
while IFS= read -r file; do
  [ -z "$file" ] && continue
  if ! grep -qE 'import[^;]*\bjest\b[^;]*from "bun:test"' "$file"; then
    if [ "$fail" -eq 0 ]; then
      echo "check-test-runner: test files using the Jest global instead of Bun's runner"
      echo ""
    fi
    fail=1
    grep -nE '\bjest\.' "$file" | head -3 | sed "s|^|  $file:|"
  fi
done < <(grep -rlE '\bjest\.' src --include="*.test.ts" --include="*.test.tsx" 2>/dev/null || true)

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "  Fix: import what you need from bun:test, for example"
  echo "    import { describe, it, expect, jest, type Mock } from \"bun:test\";"
  echo "  Convention: this repo runs bun test, not jest. See package.json scripts.test"
  exit 1
fi

echo "check-test-runner: clean. No test file relies on a bare jest global."
exit 0
