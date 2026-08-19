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
  say "${DIM}Everything below is still accurate; only the rebase was skipped.${OFF}"
  hr
  SKIP_REBASE=1
else
  SKIP_REBASE=0
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

if [ -f "$KIRO" ]; then
  # every item Kiro reports BUILT, minus every item Claude has ruled on
  BUILT="$(grep -oE '^## (K-[0-9]+) · BUILT' "$KIRO" 2>/dev/null | grep -oE 'K-[0-9]+' | sort -u)"
  RULED="$(grep -oE '^## (K-[0-9]+) · (VERIFIED|REJECTED)' "$CLAUDE" 2>/dev/null | grep -oE 'K-[0-9]+' | sort -u)"
  PENDING="$(comm -23 <(printf '%s\n' "$BUILT" | grep -v '^$') <(printf '%s\n' "$RULED" | grep -v '^$') 2>/dev/null)"
  NP="$(printf '%s\n' "$PENDING" | grep -c '^K-' || true)"

  if [ "${NP:-0}" -gt 0 ]; then
    say "${BOLD}${NP} item(s) BUILT and awaiting your verdict:${OFF}"
    printf '%s\n' "$PENDING" | grep '^K-' | sed 's/^/  /'
    say ""
    say "${DIM}Verify against PRODUCTION and the running app, not the diff.${OFF}"
  else
    say "${GRN}Nothing awaiting a verdict.${OFF} ${DIM}Work your own lane.${OFF}"
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
  # Same subtraction the verdict check above already does, for the same reason.
  ASKED="$(grep -oE '^## K-[0-9]+ · (BLOCKED|QUESTION)' "$KIRO" 2>/dev/null | grep -oE 'K-[0-9]+' | sort -u)"
  ANSWERED="$(grep -oE '^## K-[0-9]+ · RULED' "$CLAUDE" 2>/dev/null | grep -oE 'K-[0-9]+' | sort -u)"
  OPEN_Q="$(comm -23 <(printf '%s\n' "$ASKED" | grep -v '^$') <(printf '%s\n' "$ANSWERED" | grep -v '^$') 2>/dev/null | grep '^K-' || true)"
  if [ -n "$OPEN_Q" ]; then
    say ""
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
