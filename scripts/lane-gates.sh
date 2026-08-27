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
# ── AND THE HARNESS, WHICH tsc HAS NEVER SEEN ──────────────────────────────
#
# tsconfig.json includes `src/**` only, so `e2e/**` -- every check that proves
# this product works -- was never typechecked. Measured 2026-08-28 by appending
# `const x: number = "not a number"` to a spec: `bunx tsc --noEmit` reported it
# ZERO times.
#
# That is not academic. It hid a null-dereference I introduced the same night:
# `VIEWPORT.width` where VIEWPORT is undefined on any run without --viewport,
# which is most runs. tsc passed, eslint passed, the build passed, the doc
# check passed, and the spec could not start. `bun test` does not run Playwright
# specs, so no gate here could have caught it either.
#
# It needs its own config rather than a wider include, because the harness is
# Node and Bun code while `src` is browser code, and one `types` field cannot
# be right for both. It lives IN e2e/ rather than at the repo root: root holds
# four files by rule, and docs-doctor is right to say so.
run_gate "tsc:e2e"    bunx tsc --noEmit -p e2e/tsconfig.json
# ── FINISHED WORK THAT NEVER REACHED A SCREEN ─────────────────────────────
#
# The most common defect found on these surfaces is not wrong logic. It is a
# component or a server function that is exported, complete, correct, and
# imported by NOTHING. S3 found five by hand in one night -- MessageMetaFooter,
# AskInPlace, LiveTicker, OutcomeHistory, AutoChip -- and called the class
# "completely invisible to every gate we have".
#
# It was invisible because the detector for it REPORTED and exited 0, and no
# gate ran it. This lane wrote that detector. It finds all five. Nothing called
# it, which is the same shape as a baseline comparison computed and never
# printed.
#
# It is a RATCHET: 141 server functions and 80 components is debt nobody in
# flight wrote, so it fails on an INCREASE and never on the number itself.
# Baseline in e2e/unreachable-baseline.json, and the check prints the new
# number when you improve it.
run_gate "unreachable" bun run check:unreachable
# ── AND THE ROUTE AROUND THE DESIGN-SYSTEM RATCHET ────────────────────────
#
# Meridian is the only design system and that is enforced. The enforcement
# catches `var(--canvas)` written literally. It does NOT catch the same
# retired system reached one hop away, through an alias in styles.css that
# resolves to --ds-*.
#
# 59 such aliases exist and 46 files use one, and this check said exactly that
# while exiting 0, with nothing running it. So the alias route stayed open
# the whole time the direct one was being closed.
#
# Frozen at 46 and failing only on growth, for the same reason as above.
#
# `check:dead-writers` is deliberately NOT here. It lists tables carrying both
# a live and a dead writer, and whether a dead writer is a defect or a
# deliberate leftover needs a judgement per table. A gate that fails on a
# judgement is one people learn to route around, which is the argument this
# lane used to keep tap-target sizes out of the gate too.
run_gate "aliases"     bun run check:retired-aliases
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

# ── AND WILL IT MERGE WITH THE OTHER LANES? ────────────────────────────────
#
# The check above compares against `main` ONLY, and on 2026-08-27 that was not
# enough. All four branches merged into main cleanly and TWO OF THEM CONFLICTED
# WITH EACH OTHER, in `src/routes/_authenticated.approvals.tsx`: one lane was
# reworking how the approvals queue counts and pages, the other was adding how
# long a call has waited, same file, both correct.
#
# No lane's gate could see it, and not by oversight. A conflict between two
# lanes is invisible to a main-only check BY CONSTRUCTION, because main contains
# neither side yet. Both branches answer "merges cleanly into origin/main" right
# up until the second one lands, and then the second one owns a conflict it had
# no way to know about.
#
# THE REFS ARE REFRESHED FIRST, and that is the part that makes the answer worth
# printing. A sibling comparison against a ref last fetched hours ago answers a
# question about the past, and "clean" is precisely the answer nobody goes back
# to re-check. The fetch is read-only, writes only remote-tracking refs, and is
# bounded: if it cannot finish, this SAYS its view is stale rather than printing
# a reassuring line it cannot support.
#
# Informational, like the main check. A conflict with another lane is not a
# reason to hold your commit. It is a reason to say something today instead of
# discovering it at the deploy, when both sides have moved on.
case "${MERGE_BRANCH:-}" in
  lane/*)
    ( git fetch -q --no-tags origin "+refs/heads/lane/*:refs/remotes/origin/lane/*" >/dev/null 2>&1 ) &
    FETCH_PID=$!
    FETCH_WAITED=0
    while kill -0 "$FETCH_PID" 2>/dev/null && [ "$FETCH_WAITED" -lt 25 ]; do
      sleep 1; FETCH_WAITED=$((FETCH_WAITED + 1))
    done
    SIBLING_REFS_FRESH=1
    if kill -0 "$FETCH_PID" 2>/dev/null; then
      kill "$FETCH_PID" 2>/dev/null
      SIBLING_REFS_FRESH=0
    fi
    wait "$FETCH_PID" 2>/dev/null || SIBLING_REFS_FRESH=0

    SIBLING_SEEN=0
    SIBLING_CONFLICTS=0
    for SIB in $(git for-each-ref --format='%(refname:short)' 'refs/remotes/origin/lane/*' 2>/dev/null); do
      [ "$SIB" = "origin/$MERGE_BRANCH" ] && continue
      SIBLING_SEEN=$((SIBLING_SEEN + 1))
      if ! git merge-tree --write-tree --name-only HEAD "$SIB" >/tmp/lane-gates-sib.$$ 2>&1; then
        SIBLING_CONFLICTS=$((SIBLING_CONFLICTS + 1))
        echo ""
        echo "${BOLD}Conflicts with ${SIB}${OFF} ${DIM}- not with main, only with that lane${OFF}"
        grep '^CONFLICT' /tmp/lane-gates-sib.$$ 2>/dev/null | sed 's/^/  /' | head -6
        # Name the other side's commit, so the message you send has a subject
        # line in it rather than a request for one.
        grep '^CONFLICT' /tmp/lane-gates-sib.$$ 2>/dev/null \
          | sed -n 's/.* in \(.*\)$/\1/p' | head -3 | while read -r CF; do
            [ -n "$CF" ] || continue
            THEIRS="$(git log -1 --format='%h %s' "origin/main..$SIB" -- "$CF" 2>/dev/null)"
            [ -n "$THEIRS" ] && echo "  ${DIM}their side: ${THEIRS}${OFF}"
          done
      fi
      rm -f /tmp/lane-gates-sib.$$
    done

    if [ "$SIBLING_SEEN" -gt 0 ] && [ "$SIBLING_CONFLICTS" = "0" ]; then
      if [ "$SIBLING_REFS_FRESH" = "1" ]; then
        echo "${DIM}Merges cleanly with all ${SIBLING_SEEN} other lane(s), refs just fetched.${OFF}"
      else
        echo "${DIM}No conflict with ${SIBLING_SEEN} other lane(s) - but the refs could not be${OFF}"
        echo "${DIM}refreshed, so that is true of the last fetch, not of now.${OFF}"
      fi
    fi
    ;;
esac

if [ -n "$FAILED" ]; then
  # THE LAST LINE, and it names what to fix.
  echo "${RED}${BOLD}GATES FAILED: ${FAILED}${OFF}- do not commit or push."
  rm -rf "$LOG_DIR"
  exit 1
fi

rm -rf "$LOG_DIR"
echo "${GRN}${BOLD}GATES GREEN${OFF} - tsc, docs:check, test, build all passed."
