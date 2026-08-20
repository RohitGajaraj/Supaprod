#!/usr/bin/env bash
#
# lane-sync.sh — pull main into this lane and say what changed.
#
# WHY THIS EXISTS. Two agents build this repo at once: Kiro pushes to `main`
# continuously, and Claude verifies from a worktree on its own lane. The kickoff
# prompt used to say "rebase before every batch", which is circular — nothing
# defines when a batch starts, so an agent two hours deep in a migration never
# fires it and the lane goes stale without noticing. A lane that has not pulled
# is a lane verifying work that has already moved.
#
# So this replaces a reminder with a command. It answers three questions in one
# run: what landed on main, what is now waiting on a verdict, and whether any of
# it touched files this lane has open.
#
# SAFE BY DEFAULT. It refuses to rebase a dirty tree rather than stashing behind
# your back, and it never pushes. Read-then-decide, always.
#
# Usage:  bun run lane:sync        (or)  bash scripts/lane-sync.sh
set -uo pipefail

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; OFF=$'\033[0m'
say() { printf '%s\n' "$*"; }
hr()  { printf '%s\n' "${DIM}────────────────────────────────────────────────────────────${OFF}"; }

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || { say "${RED}not a git repo${OFF}"; exit 1; }

say ""
say "${BOLD}lane-sync${OFF}  ${DIM}${BRANCH}${OFF}"
hr

# ── 1. refuse to touch a dirty tree ─────────────────────────────────────────
DIRTY="$(git status --porcelain)"
if [ -n "$DIRTY" ]; then
  say "${YEL}Working tree is not clean. Not rebasing.${OFF}"
  say "${DIM}Commit or stash first — this script will not stash behind your back.${OFF}"
  say ""
  printf '%s\n' "$DIRTY" | head -20
  say ""
  # This used to say "Everything below is still accurate; only the rebase was
  # skipped." That is false, and it is false in the direction that matters.
  #
  # The fetch above still runs, so the commit counts and the file list ARE
  # accurate. But the verdict and question sections read `ledger/*.md` OFF DISK,
  # and on a dirty tree those files are whatever this lane last pulled. On
  # 2026-08-19 that produced a run reporting three of Kiro's commits by SHA and
  # "Nothing awaiting a verdict" in the same breath, because the ledger it read
  # predated all three. A reader who believed the reassurance would have gone
  # back to sleep with two items waiting.
  #
  # So: say which half is stale rather than claiming neither is.
  say "${DIM}Commit counts above are live. The ledger sections BELOW are read from${OFF}"
  say "${DIM}disk and are as stale as this tree -- commit or stash, then re-run.${OFF}"
  STALE_LEDGER=1
  hr
  SKIP_REBASE=1
else
  SKIP_REBASE=0
  STALE_LEDGER=0
fi

# ── 2. what is on main that we do not have ──────────────────────────────────
git fetch origin --quiet 2>/dev/null || say "${YEL}fetch failed (offline?) — reporting from last known state${OFF}"

BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"
AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"

if [ "$BEHIND" = "0" ]; then
  say "${GRN}Up to date with origin/main.${OFF}  ${DIM}${AHEAD} of your own commit(s) not yet pushed.${OFF}"
else
  say "${BOLD}${BEHIND} commit(s) landed on main since you last synced:${OFF}"
  say ""
  git log --oneline --no-decorate HEAD..origin/main | sed 's/^/  /'
  say ""

  # which files moved — this is what tells you if your open work just collided
  say "${BOLD}Files those commits touched:${OFF}"
  git diff --name-only HEAD...origin/main 2>/dev/null | sed 's/^/  /' | head -40
  MOVED="$(git diff --name-only HEAD...origin/main 2>/dev/null | wc -l | tr -d ' ')"
  [ "$MOVED" -gt 40 ] && say "  ${DIM}… and $((MOVED - 40)) more${OFF}"
  say ""

  if [ "$SKIP_REBASE" = "0" ]; then
    say "${DIM}rebasing…${OFF}"
    if git rebase origin/main --quiet 2>/dev/null; then
      say "${GRN}Rebased onto origin/main.${OFF}"
    else
      say "${RED}REBASE HIT A CONFLICT. Stopping here.${OFF}"
      say ""
      git status --short | grep -E '^(UU|AA|DD|AU|UA|DU|UD)' | sed 's/^/  /'
      say ""
      say "${DIM}If the conflict is src/__tests__/meridian-ratchet.baseline.json:${OFF}"
      say "${DIM}  it is GENERATED. Never hand-merge it. Take either side, then:${OFF}"
      say "${DIM}    git checkout --theirs src/__tests__/meridian-ratchet.baseline.json${OFF}"
      say "${DIM}    bun run design:ratchet && git add src/__tests__/meridian-ratchet.baseline.json${OFF}"
      say "${DIM}    git rebase --continue${OFF}"
      say ""
      say "${DIM}If it is src/routes/_authenticated.meridian.tsx: it is APPEND-ONLY.${OFF}"
      say "${DIM}  Keep both additions.${OFF}"
      exit 2
    fi
  fi
fi
hr

# ── 3. what is waiting on a verdict ─────────────────────────────────────────
KIRO="docs/operations/ledger/kiro-log.md"
CLAUDE="docs/operations/ledger/claude-log.md"

# An item is waiting on you when Kiro has said a thing about it MORE TIMES than
# you have answered. Counting, rather than subtracting sets, for two reasons.
#
# 1. AN ITEM CAN GO ROUND THE LOOP TWICE. BUILT -> REJECTED -> BUILT again is
#    the normal life of a rejected item, and `sort -u` collapsed the second
#    build into the first while `comm -23` then deleted the id outright,
#    because a verdict for it already existed. K-03 and K-07 are both sitting
#    REJECTED as this is written, so the next rebuild of either would have been
#    reported as "nothing awaiting a verdict" and Kiro would have waited on a
#    verdict that was never coming. Counts see the second build; sets cannot.
#
# 2. IT NEEDS NO CLOCK. The obvious alternative -- take the most recent entry
#    per id -- reads the timestamps in the ledger, and those are written by the
#    agents rather than measured. Checked against commit times on 2026-08-20,
#    Kiro's stamps ran from +63 to +247 minutes ahead of real time and the drift
#    grew monotonically, so every Kiro entry sorts after every verdict of yours
#    and a most-recent-wins reader calls verified items unverified. That exact
#    misreading happened here at 06:00 and cost a tick. A count of append-only
#    lines is true whatever the writers believe the time is.
pending_ids() {  # kiro-file  asked-verbs  claude-file  answered-verbs
  local kfile="$1" averbs="$2" cfile="$3" rverbs="$4" id n_asked n_answered
  for id in $(grep -oE "^## K-[0-9]+ · ($averbs)" "$kfile" 2>/dev/null \
              | grep -oE 'K-[0-9]+' | sort -u); do
    n_asked="$(grep -cE "^## ${id} · ($averbs)" "$kfile" 2>/dev/null || true)"
    n_answered="$(grep -cE "^## ${id} · ($rverbs)" "$cfile" 2>/dev/null || true)"
    if [ "${n_asked:-0}" -gt "${n_answered:-0}" ]; then printf '%s\n' "$id"; fi
  done
  return 0
}

if [ -f "$KIRO" ]; then
  # every item Kiro has built more times than you have judged it
  PENDING="$(pending_ids "$KIRO" 'BUILT' "$CLAUDE" 'VERIFIED|REJECTED')"
  NP="$(printf '%s\n' "$PENDING" | grep -c '^K-' || true)"

  if [ "${NP:-0}" -gt 0 ]; then
    [ "${STALE_LEDGER:-0}" = "1" ] && say "${YEL}(read from a stale tree, see above)${OFF}"
    say "${BOLD}${NP} item(s) BUILT and awaiting your verdict:${OFF}"
    printf '%s\n' "$PENDING" | grep '^K-' | sed 's/^/  /'
    say ""
    say "${DIM}Verify against PRODUCTION and the running app, not the diff.${OFF}"
  else
    if [ "${STALE_LEDGER:-0}" = "1" ]; then
      say "${YEL}Nothing awaiting a verdict IN THIS TREE, which is stale. Re-run after committing.${OFF}"
    else
      say "${GRN}Nothing awaiting a verdict.${OFF} ${DIM}Work your own lane.${OFF}"
    fi
  fi

  # Anything Kiro could not proceed on, MINUS anything already ruled on.
  #
  # This used to print every QUESTION ever asked, forever, because it read only
  # kiro-log and never checked whether an answer existed. On 2026-08-20 it
  # reported Kiro blocked on K-81 and K-82 in the same run that reported nothing
  # awaiting a verdict, twenty minutes after both were answered. A status line
  # that cries wolf every run is one an agent learns to skip, which is worse than
  # not printing it -- and this script exists precisely because a reminder nobody
  # acts on is not a reminder.
  #
  # Same counting the verdict check above already does, for the same reason.
  OPEN_Q="$(pending_ids "$KIRO" 'BLOCKED|QUESTION' "$CLAUDE" 'RULED')"
  if [ -n "$OPEN_Q" ]; then
    say ""
    [ "${STALE_LEDGER:-0}" = "1" ] && say "${YEL}(read from a stale tree, see above)${OFF}"
    say "${YEL}Kiro is blocked or asking on:${OFF}"
    # Print the most recent line for each still-open id, so the verb and date show.
    for id in $OPEN_Q; do
      grep -E "^## ${id} · (BLOCKED|QUESTION)" "$KIRO" | tail -1 | sed 's/^## /  /'
    done
    say "${DIM}These need a RULED entry from you, or they stay stuck.${OFF}"
  fi
else
  say "${DIM}No ledger yet — nothing has been built.${OFF}"
fi

hr
say "${DIM}next: bunx tsc --noEmit && bun test   before you push anything${OFF}"
say ""
