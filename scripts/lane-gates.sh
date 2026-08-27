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

# ── THE FIFTH GATE, WHICH IS NOT RUN HERE AND SAYS SO ──────────────────────
#
# The four gates above prove the code COMPILES, TYPES, TESTS and BUILDS. Not one
# of them can tell whether what a person sees on the screen is true. A progress
# bar driven by setInterval passes all four, forever.
#
# The dead backend test answers that question: point the app at a database that
# does not exist, open the surface, and see what is still redrawing afterwards.
# Motion that survives a dead backend is a clock, not a row.
#
# IT IS NOT RUN INSIDE THIS SCRIPT ON PURPOSE. It needs a dev server on port 8080
# and takes minutes, and four lanes run these gates whenever they like. Wiring it
# in would have lanes fighting over one port and would make the fast gate slow
# enough to skip. So this prints the exact command, and only when the diff you are
# about to push actually changes something a person looks at.
CHANGED="$(git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null; \
           git diff --name-only origin/main...HEAD 2>/dev/null)"
RENDERING="$(echo "$CHANGED" | grep -E '^src/(components|routes)/' | grep -v '/api/' | sort -u)"

if [ -n "$RENDERING" ]; then
  # Turn changed route files into the paths you would actually open. Flat routes:
  # drop the _authenticated prefix and the .index suffix, dots become slashes.
  ROUTES="$(echo "$RENDERING" | grep -E '^src/routes/.*\.tsx$' \
    | sed -e 's|^src/routes/||' -e 's|\.tsx$||' \
    | grep -v '\$' \
    | sed -e 's|^_authenticated\.||' -e 's|\.index$||' -e 's|^index$||' \
    | tr '.' '/' | sed -e 's|^|/|' -e 's|^//|/|' | sort -u | tr '\n' ' ')"
  echo ""
  echo "${BOLD}One thing these four gates cannot check${OFF}"
  echo "  Your diff changes $(echo "$RENDERING" | wc -l | tr -d ' ') file(s) a person looks at."
  echo "  Nothing above can tell whether the motion on those surfaces is earned."
  if [ -n "$(echo "$ROUTES" | tr -d ' ')" ]; then
    echo "    ${BOLD}bun run check:motion${OFF} ${ROUTES}"
  else
    echo "    ${BOLD}bun run check:motion${OFF} <the routes that render your components>"
  fi
  echo "  ${DIM}It boots against a dead database and reports what is still redrawing.${OFF}"
  echo "  ${DIM}Needs port 8080 free, and it refuses to start if a lane already holds it.${OFF}"
fi

# ── WILL THIS BRANCH MERGE? ────────────────────────────────────────────────
#
# Four lanes commit against one `main` all day and nobody discovers a conflict
# until somebody attempts the deploy, which is the worst moment to find one. On
# 2026-08-27 the gap was 182 commits across three lanes and exactly ONE file
# conflicted; it took ten minutes to resolve once anyone looked, and the looking
# was the whole difficulty.
#
# `git merge-tree` computes the merge WITHOUT touching a branch, a checkout or
# the working tree, so this is safe to run on every gate and costs a second.
# Informational only: a conflict with main is not a reason to block a commit on
# your own lane, it is a reason to know before the deploy does.
if git rev-parse --verify --quiet origin/main >/dev/null 2>&1; then
  MERGE_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
  if [ "$MERGE_BRANCH" != "main" ]; then
    if git merge-tree --write-tree --name-only origin/main HEAD >/tmp/lane-gates-merge.$$ 2>&1; then
      echo "${DIM}Merges cleanly into origin/main.${OFF}"
    else
      echo ""
      echo "${BOLD}This branch does NOT merge cleanly into origin/main${OFF}"
      grep '^CONFLICT' /tmp/lane-gates-merge.$$ 2>/dev/null | sed 's/^/  /' | head -8
      echo "  ${DIM}Not a reason to hold this commit. It is a reason to talk to whoever${OFF}"
      echo "  ${DIM}owns the other side before the deploy finds it.${OFF}"
    fi
    rm -f /tmp/lane-gates-merge.$$
  fi
fi

if [ -n "$FAILED" ]; then
  # THE LAST LINE, and it names what to fix.
  echo "${RED}${BOLD}GATES FAILED: ${FAILED}${OFF}- do not commit or push."
  rm -rf "$LOG_DIR"
  exit 1
fi

rm -rf "$LOG_DIR"
echo "${GRN}${BOLD}GATES GREEN${OFF} - tsc, docs:check, test, build all passed."
