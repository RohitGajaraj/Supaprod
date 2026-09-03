#!/usr/bin/env bash
# ORPHAN-MAIN GUARD, installed by scripts/install-git-hooks.sh into every
# checkout and worktree's .git/hooks/pre-push (a thin shim execs this file,
# so there is one source of truth rather than a copy per checkout).
#
# Background: docs/operations/git-recovery-and-orphan-guard.md
#
# On 2026-07-27 origin/main was force-replaced with a zero-parent history,
# orphaning 4,124 commits. Root cause: cadence-lane-4 was a linked worktree
# whose .git pointer file still named the pre-rename checkout
# (project_cadence_v5) after the folder became Superprod, so git inside it died
# with "fatal: not a git repository: (null)". The recovery taken was `git init`
# + `git add -A` + force-push. The correct recovery is `git worktree repair`.
#
# GitHub branch protection would catch this server-side, but it needs GitHub Pro
# on a private repo (verified 403 on both the protection and rulesets APIs), so
# this hook is the guard. Install it in EVERY checkout and worktree.
#
# P-27 (A-QUEUE.md, 2026-09-03): "NOT FETCHED" IS NOT "NO ANCESTOR".
#
# THE DEFECT THIS FIXES. `git merge-base "$local_sha" "$remote_sha"` was run
# unconditionally, and its exit code alone decided orphan-or-not. But
# merge-base can fail two ways that this hook used to treat as one:
#   (1) the two commits share no history at all -- a genuine orphan, and
#   (2) $remote_sha is simply an object this local checkout has never
#       fetched, so merge-base cannot even ask the question and errors out
#       the same way an orphan does.
# Case (2) is routine on a main this busy: `$remote_sha` comes from the
# remote's OWN current tip at push time, not from this checkout's cached
# refs/remotes/origin/main, so any push that lands on origin/main between
# this checkout's last fetch and this push reproduces it. It happened at
# 04:50 IST: A1 pushed between A2's fetch and push, A2's local object store
# never had A1's new sha, merge-base errored on a missing object, and the
# hook read that exactly like the 2026-07-27 incident -- the false alarm
# people learn to reach past with ALLOW_ORPHAN_MAIN, which is how a real
# one eventually gets through unread.
#
# THE FIX. `git cat-file -e "$remote_sha"` first. Present but no common
# ancestor: a real orphan, blocked as before. Absent: this checkout has not
# fetched what it is being compared against, which is a "fetch and rebase"
# instruction, never the word "orphan".
zero="0000000000000000000000000000000000000000"
blocked=0

while read -r local_ref local_sha remote_ref remote_sha; do
  [ "$local_sha" = "$zero" ] && continue
  case "$remote_ref" in
    refs/heads/main) ;;
    *) continue ;;
  esac

  # 1. Orphan guard: a push to main must share history with what main already is.
  if [ "$remote_sha" != "$zero" ]; then
    if ! git cat-file -e "$remote_sha" 2>/dev/null; then
      echo ""
      echo "BLOCKED: origin/main has moved and this checkout has not fetched it yet."
      echo "This is NOT an orphan finding -- the remote commit ($remote_sha) is simply"
      echo "not in your local object store to compare against, which is routine on a"
      echo "main this busy. Fetch and rebase, then push:"
      echo ""
      echo "    git fetch origin && git rebase origin/main"
      echo ""
      blocked=1
    elif ! git merge-base "$local_sha" "$remote_sha" >/dev/null 2>&1; then
      if [ "${ALLOW_ORPHAN_MAIN:-0}" = "1" ]; then
        echo "[pre-push] orphan push to main allowed via ALLOW_ORPHAN_MAIN=1."
      else
        echo ""
        echo "BLOCKED: this push to main has NO common ancestor with origin/main."
        echo "That is an orphan history. It is what wiped 4,124 commits on 2026-07-27."
        echo ""
        echo "Hit 'fatal: not a git repository: (null)' in a worktree? The fix is:"
        echo "    git -C <main-checkout> worktree repair <worktree-path>"
        echo "NEVER run 'git init' inside a broken worktree and push the result."
        echo ""
        echo "If you truly mean to replace main's history: archive the current main"
        echo "first, then re-run this one command with ALLOW_ORPHAN_MAIN=1."
        blocked=1
      fi
    fi
  fi

  # 2. Re-init fingerprint: these files only ever exist because a broken
  #    worktree was re-initialised and 'git add -A' swept them in.
  for junk in .git.broken .git-staging-note.txt; do
    if git cat-file -e "$local_sha:$junk" 2>/dev/null; then
      echo ""
      echo "BLOCKED: '$junk' is committed in the history being pushed to main."
      echo "That file is the fingerprint of a re-initialised broken worktree."
      echo "Remove it first:  git rm --cached '$junk'"
      blocked=1
    fi
  done
done

exit $blocked
