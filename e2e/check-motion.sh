#!/usr/bin/env bash
#
# THE DEAD BACKEND TEST, AS ONE COMMAND.
#
#   bash e2e/check-motion.sh              # the four public surfaces
#   bash e2e/check-motion.sh /today /runs # or any paths you name
#   bash e2e/check-motion.sh --signed-in /today /approvals   # product surfaces
#   bash e2e/check-motion.sh --signed-in --phone /today      # at 390x844
#
# Run this before you commit a surface that moves. It boots the app against a
# database that does not exist and tells you what is STILL redrawing afterwards.
# Motion that survives a dead backend is driven by a clock, not by a row.
#
# WHY YOU AND NOT S4. A verdict after the fact costs a round trip and arrives
# once the surface has shipped. This costs you ninety seconds and arrives before
# the commit. If every lane runs it, the finding never gets filed.
#
# WHAT IT DOES NOT DECIDE, and this is the honest part: it reports what moved, it
# does NOT tell you whether that motion was theatre. Ambient background motion
# lands on the list too, and decoration carrying no state claim is honest. Open
# the screenshots and ask one question:
#
#     did a STATE change, with no data behind it?
#
# A progress bar advancing, a step label changing, a count rising, a status chip
# flipping: those are states, and with a dead backend none of them can be real.
# A gradient drifting or a particle field moving is decoration and is fine.
# S4-054 records the three instruments that were tried and why none of them can
# make that call for you.
#
# SAFETY. The dummy env points at a port with nothing listening, so nothing here
# can reach production. The spec presses and submits nothing. R-21: this starts a
# dev server and kills it, and it refuses to start if one is already running.

set -euo pipefail
cd "$(dirname "$0")/.."

PORT=8080
DUMMY_ENV_WRITTEN=0
SIGNED_IN=0

# `--signed-in` measures the surfaces where a person watches their OWN work.
# Signed out, all six of those redirect to /login and you measure the login page.
while true; do
  case "${1:-}" in
    --signed-in) SIGNED_IN=1; shift ;;
    # A phone. Error copy is longer than the data it replaces, so the failure
    # states are where a narrow column breaks first.
    --phone) S4_MOTION_VIEWPORT="390x844"; export S4_MOTION_VIEWPORT; shift ;;
    --viewport) S4_MOTION_VIEWPORT="${2:?--viewport needs WxH}"; export S4_MOTION_VIEWPORT; shift 2 ;;
    *) break ;;
  esac
done
PATHS=("$@")

if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "REFUSING: something is already listening on :$PORT."
  echo "Another session may hold it. Check docs/lanes/NOW-*.md before starting one."
  exit 1
fi

# Never clobber a real .env. If one exists, this is not the machine for this test.
if [ -f .env ]; then
  echo "REFUSING: .env exists. This test needs a dummy env pointing at a dead port,"
  echo "and overwriting your real one is not a trade worth making. Move it aside first."
  exit 1
fi

cleanup() {
  local code=$?
  if lsof -ti:"$PORT" >/dev/null 2>&1; then
    kill "$(lsof -ti:"$PORT")" 2>/dev/null || true
    sleep 2
    lsof -ti:"$PORT" >/dev/null 2>&1 && kill -9 "$(lsof -ti:"$PORT")" 2>/dev/null || true
  fi
  [ "$DUMMY_ENV_WRITTEN" = "1" ] && rm -f .env
  if lsof -ti:"$PORT" >/dev/null 2>&1; then
    echo "WARNING: :$PORT is still busy. Kill it by hand before another lane needs it."
  else
    echo "Server stopped, :$PORT clear, dummy .env removed."
  fi
  exit $code
}
trap cleanup EXIT INT TERM

echo "Writing a dummy .env pointing at http://localhost:54321, where nothing listens."
cat > .env <<'ENV'
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PROJECT_ID=deadbackendtest
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiJ9.dead-backend-test.x
SUPABASE_URL=http://localhost:54321
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiJ9.dead-backend-test.x
ENV
DUMMY_ENV_WRITTEN=1

echo "Starting the dev server."
bun run dev > /tmp/check-motion-dev.log 2>&1 &

# Wait for it to answer rather than sleeping a guessed number of seconds.
for _ in $(seq 1 60); do
  curl -sf -o /dev/null --max-time 5 "http://localhost:$PORT/" && break
  sleep 2
done
if ! curl -sf -o /dev/null --max-time 10 "http://localhost:$PORT/"; then
  echo "The dev server never answered. See /tmp/check-motion-dev.log"
  exit 1
fi

# Vite compiles each route on first request, and a cold compile can exceed
# Playwright's navigation timeout. Warm every path first so the measurement times
# the SURFACE rather than the bundler.
if [ ${#PATHS[@]} -eq 0 ]; then
  TARGETS=(/ /pricing /product /demo)
else
  TARGETS=("${PATHS[@]}")
fi
# The spec reads the same list, so a path you name is a path it measures. Without
# this the argument warmed routes the spec then ignored, which is a CLI that lies.
S4_MOTION_PATHS="$(IFS=,; echo "${TARGETS[*]}")"
export S4_MOTION_PATHS

# THIS USED TO BE `curl` AND `curl` DOES NOT WARM ANYTHING. It fetches the HTML
# shell in milliseconds and never asks for the route's client chunk, so the route
# is still uncompiled when the measurement starts. That flaw produced three false
# S4 findings, the last of which called `/runs` a permanent dead end. Measured
# properly, `/runs` compiles for 105s and then redirects in 4.2s, which is FASTER
# than `/today`. Only a real browser triggers the compile. See S4-057.
if [ "$SIGNED_IN" = "1" ]; then
  # A fabricated session, checked by nothing, sent nowhere. The route guard reads
  # localStorage and makes no network call, so this is enough to render the
  # authenticated shell while every data read behind it fails. That is the point.
  mkdir -p playwright/.auth
  bun run e2e/helpers/dead-backend-session.mjs > playwright/.auth/dead.json
  S4_MOTION_STATE="$(pwd)/playwright/.auth/dead.json"
  export S4_MOTION_STATE
  echo "Measuring SIGNED IN, against a database that does not exist."
fi

echo "Warming ${#TARGETS[@]} route(s) in a browser so the timer measures the page, not the compiler."
bun run e2e/helpers/warm-routes.mjs "${TARGETS[@]}" || \
  echo "  (a route never went quiet; the measurement below still runs, read it with that in mind)"

echo
S4_MOTION=yes bunx playwright test e2e/s4-motion-must-be-earned.spec.ts \
  --no-deps --project=chromium-desktop --reporter=line || true

echo
echo "==================================================================="
cat docs/screenshots/s4-motion/motion-report.txt 2>/dev/null || echo "(no report written)"
echo "==================================================================="
echo
echo "Screenshots of anything still moving: docs/screenshots/s4-motion/"
echo "Now look at them and answer: did a STATE change, with no data behind it?"
echo "If yes, that is a clock and it does not ship. If it was decoration, it is fine."
