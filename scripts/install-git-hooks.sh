#!/usr/bin/env bash
# Install repo-local git hooks: a post-merge migration check, and a pre-commit
# humanized-output backstop (banned em/en dashes + invisible characters).
# Idempotent. Skipped when not inside a git repo (e.g. CI checkout-as-tarball,
# Docker builds).
set -euo pipefail

if [ ! -d .git ]; then
  exit 0
fi

HOOK=".git/hooks/post-merge"
cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
# Auto-installed by scripts/install-git-hooks.sh: verify DB migrations are
# applied after a successful merge / pull. Non-blocking warning only here;
# the hard gate runs in `prebuild` so deploys can't ship with drift.
if [ -f scripts/check-migrations.sh ]; then
  bash scripts/check-migrations.sh || {
    echo ""
    echo "⚠️  Pending migrations after pull. Apply them before building or deploying."
  }
fi
EOF
chmod +x "$HOOK"
echo "[git-hooks] post-merge hook installed"

# F-HUMANIZE-HOOK: pre-commit backstop for the humanized-output convention.
# Scans the staged diff for banned em/en dashes and invisible characters.
# BLOCKING BY DEFAULT since 2026-08-26, on the founder's instruction that no AI
# fingerprint may reach a user-facing surface. It was warn-only, which is how a
# warning becomes furniture: the check ran, printed, exited 0, and the dashes
# shipped anyway.
#
# Flipping it cost nothing on the day it was flipped: all 548 user-facing files
# scanned clean, so strict mode had no backlog to clear. Set HUMANIZE_STRICT=0
# to fall back to warn-only for a single commit.
#
# NOTE what this can and cannot see. It scans SOURCE. The em dashes actually
# visible in the running application were never in the source: they were in
# model-written text that agents wrote into the DATABASE through tool arguments,
# which no source scan can reach. That hole is closed separately by
# `humanizeToolArgs` at the tool-call chokepoint in `runtime.server.ts`.
PRECOMMIT=".git/hooks/pre-commit"
cat > "$PRECOMMIT" <<'EOF'
#!/usr/bin/env bash
# Auto-installed by scripts/install-git-hooks.sh: humanized-output backstop.
# Convention: docs/conventions/humanized-output.md.
if [ -f scripts/check-humanized.sh ]; then
  if [ "${HUMANIZE_STRICT:-1}" = "1" ]; then
    STRICT=1 bash scripts/check-humanized.sh
  else
    bash scripts/check-humanized.sh || true
  fi
fi

EOF
chmod +x "$PRECOMMIT"
echo "[git-hooks] pre-commit hook installed (humanized-output check)"
# F6 MERGE LOCK (founder ruling 2026-07-18): the archived front-end rebuild
# (archive/final-sweep-2026-07-18) must never merge into main without the
# founder's explicit, per-merge approval. Any merge whose message references
# an archive ref is blocked unless FOUNDER_APPROVED=1 is set for that
# one command. Applies to every session, human or agent.
#
# The pattern matches archive/ AND archive- (2026-07-28): archives are now also
# kept as tags (archive-lovable-orphan-2026-07-28,
# archive-final-sweep-2026-07-18), and a slash-only pattern would have let the
# orphan history merge into main unchallenged.
PREMERGE=".git/hooks/pre-merge-commit"
cat > "$PREMERGE" <<'INNER'
#!/usr/bin/env bash
if [ -f .git/MERGE_MSG ] && grep -qE "archive[/-]" .git/MERGE_MSG; then
  if [ "${FOUNDER_APPROVED:-0}" != "1" ]; then
    echo ""
    echo "BLOCKED: merging an archive/ branch needs the founder's explicit approval."
    echo "Ruling F6 (2026-07-18): the archived rebuild never lands on main without it."
    echo "If Rohit approved THIS merge in his own words, re-run with FOUNDER_APPROVED=1."
    exit 1
  fi
fi
exit 0
INNER
chmod +x "$PREMERGE"
echo "[git-hooks] pre-merge-commit archive lock installed"

# ORPHAN-MAIN GUARD (added 2026-07-28 after the incident below).
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
PREPUSH=".git/hooks/pre-push"
cat > "$PREPUSH" <<'INNER'
#!/usr/bin/env bash
# Auto-installed by scripts/install-git-hooks.sh: orphan-history guard on main.
# Background: docs/operations/git-recovery-and-orphan-guard.md
zero="0000000000000000000000000000000000000000"
blocked=0

while read -r local_ref local_sha remote_ref remote_sha; do
  [ "$local_sha" = "$zero" ] && continue
  case "$remote_ref" in
    refs/heads/main) ;;
    *) continue ;;
  esac

  # 1. Orphan guard: a push to main must share history with what main already is.
  if [ "$remote_sha" != "$zero" ] &&
     ! git merge-base "$local_sha" "$remote_sha" >/dev/null 2>&1; then
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
INNER
chmod +x "$PREPUSH"
echo "[git-hooks] pre-push orphan-main guard installed"
