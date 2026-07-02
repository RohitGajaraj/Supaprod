#!/usr/bin/env bash
# sync-pcv4.sh — Pull origin/main into project_cadence_v4, the shared local
# viewing checkout (also the git-dir host for the cadence-lane-N worktrees).
#
# Corrected 2026-07-01/02: this script pointed at "Project-Cadence-v4"
# (capitalized), a path that no longer exists — every call silently hit the
# "not found, skipping" branch and exited 0, so this has been a no-op for an
# unknown stretch of time despite being called after every push. Also,
# despite the header comment below, lane.sh does not actually invoke this —
# that claim was stale too; call it explicitly after pushing, as documented
# in AGENTS.md / CLAUDE.md.
#
# `project_cadence_v4` and every `cadence-lane-N` worktree of it were
# repointed to `project_cadence_v5` (the repo Lovable is actually connected
# to) on 2026-07-01/02 — see AGENTS.md § "Canonical repo law". This script
# still only refreshes the local project_cadence_v4 viewing checkout to
# match whatever was just pushed to that shared origin (now v5).
#
# MANDATORY: run this after EVERY git push from any lane.
# `post-push` is not a real git hook, so this must be called explicitly.
#
# Usage:  bash scripts/sync-pcv4.sh
# Exit 0 always — sync failure is a warning, not a blocker.

V4="/Users/rohitgajaraj/Projects/My Projects/My Builds/project_cadence_v4"

if [[ ! -d "$V4" ]]; then
  echo "[sync-pcv4] WARN: $V4 not found — skipping"
  exit 0
fi

git -C "$V4" fetch origin -q 2>/dev/null || { echo "[sync-pcv4] WARN: fetch failed"; exit 0; }

LOCAL=$(git -C "$V4" rev-parse main 2>/dev/null)
REMOTE=$(git -C "$V4" rev-parse origin/main 2>/dev/null)
[[ "$LOCAL" == "$REMOTE" ]] && echo "[sync-pcv4] already up to date ($LOCAL)" && exit 0

# Stash tracked modifications (routeTree.gen.ts etc.) so the merge can proceed
STASHED=0
if ! git -C "$V4" diff --quiet 2>/dev/null || ! git -C "$V4" diff --cached --quiet 2>/dev/null; then
  git -C "$V4" stash push -q --message "sync-pcv4 pre-pull" 2>/dev/null && STASHED=1
fi

if git -C "$V4" merge --ff-only origin/main -q 2>/dev/null; then
  [[ $STASHED -eq 1 ]] && git -C "$V4" stash pop -q 2>/dev/null
  SHORT=$(git -C "$V4" rev-parse --short HEAD 2>/dev/null)
  printf "\033[32m[sync-pcv4]\033[0m local v4 checkout fast-forwarded FROM origin project_cadence_v5 to %s (direction: v5 GitHub -> local v4 folder; nothing is pushed to any v4 repo)\n" "$SHORT"
else
  [[ $STASHED -eq 1 ]] && git -C "$V4" stash pop -q 2>/dev/null
  printf "\033[33m[sync-pcv4]\033[0m WARN: could not fast-forward. Run manually:\n"
  printf "  git -C '%s' stash && git -C '%s' pull origin main && git -C '%s' stash pop\n" "$V4" "$V4" "$V4"
fi

exit 0
