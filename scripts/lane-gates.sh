#!/usr/bin/env bash
#
# lane-gates.sh — run every gate, read every exit code, and say so in the LAST line.
#
# WHY THIS EXISTS, and it is a specific incident rather than tidiness.
#
# The rule is four gates before every push: `bunx tsc --noEmit`, `bun test`,
# `bun run build`, and `bun run docs:check`. On 2026-08-20 main went out red
# anyway, on the doc gate, and stayed red until a probe run for an unrelated
# reason happened to print the failure.
#
# THE GATE WAS RUN. It was read wrong:
#
#     bun run docs:check 2>&1 | tail -2
#
# reports the exit status of `tail`, which is 0 forever, and `docs-doctor`'s own
# final line is "docs-doctor: clean of hard rot" -- printed as a footer, two lines
# BELOW "ISSUES FOUND (hard rot)". So a failing gate ends on a cheerful sentence
# and a two-line tail shows the cheerful sentence.
#
# That is recorded as a past incident in this repo's own memory, in almost those
# words, and it was reproduced exactly. A rule that has now failed twice the same
# way is not a rule anybody is going to remember harder.
#
# SO THIS SCRIPT'S LAST LINE IS ALWAYS THE VERDICT. Not a footer, not a summary of
# the last gate: the answer. `| tail -1` is enough to read it correctly, which is
# the whole design. A defence that only works when nobody takes the shortcut is
# not a defence, because the shortcut is what happened.
#
# It also runs ALL FOUR even after one fails, because the question before a push
# is "what is broken", not "what broke first", and a second run to find the next
# failure costs more than finishing this one.

set -uo pipefail
cd "$(dirname "$0")/.."

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GRN=$'\033[32m'; OFF=$'\033[0m'
[ -t 1 ] || { BOLD=""; DIM=""; RED=""; GRN=""; OFF=""; }

FAILED=""
LOG_DIR="${TMPDIR:-/tmp}/lane-gates.$$"
mkdir -p "$LOG_DIR"

run_gate() {
  local name="$1"; shift
  printf '%s' "  ${name} … "
  local log="$LOG_DIR/${name//[^a-zA-Z0-9]/_}.log"
  if "$@" > "$log" 2>&1; then
    printf '%s\n' "${GRN}pass${OFF}"
  else
    printf '%s\n' "${RED}FAIL${OFF}"
    FAILED="${FAILED}${name} "
    # The last 12 lines of the gate that failed, indented, so the reason is here
    # rather than in a file somebody has to be told about.
    sed 's/^/      /' "$log" | tail -12
  fi
}

echo ""
echo "${BOLD}lane-gates${OFF}  ${DIM}$(git rev-parse --abbrev-ref HEAD 2>/dev/null)${OFF}"
echo "${DIM}────────────────────────────────────────────────────────────${OFF}"

run_gate "tsc"        bunx tsc --noEmit
run_gate "docs:check" bash scripts/docs-doctor.sh
run_gate "test"       bun test
run_gate "build"      bun run build

echo "${DIM}────────────────────────────────────────────────────────────${OFF}"

if [ -n "$FAILED" ]; then
  # THE LAST LINE, and it names what to fix.
  echo "${RED}${BOLD}GATES FAILED: ${FAILED}${OFF}- do not commit or push."
  rm -rf "$LOG_DIR"
  exit 1
fi

rm -rf "$LOG_DIR"
echo "${GRN}${BOLD}GATES GREEN${OFF} - tsc, docs:check, test, build all passed."
