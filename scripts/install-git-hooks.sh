#!/usr/bin/env bash
# Install repo-local git hooks: a post-merge migration check, and a pre-commit
# humanized-output backstop (banned em/en dashes + invisible characters).
# Idempotent. Skipped when not inside a git repo (e.g. CI checkout-as-tarball,
# Docker builds).
set -euo pipefail

# P-27 (A-QUEUE.md, 2026-09-03): `[ ! -d .git ]` IS ALWAYS TRUE IN A
# WORKTREE, so this script silently installed nothing there, ever. A linked
# worktree's `.git` is a plain FILE (a "gitdir: <path>" pointer), never a
# directory -- `-d .git` fails, the guard fires, and the script exits 0
# before writing a single hook. Confirmed live: a worktree that had run this
# script had the SAME pre-push hook installed from the main checkout months
# earlier, still carrying the pre-P-27 orphan-guard bug this whole packet
# exists to fix. `git rev-parse --is-inside-work-tree` is true in both a
# plain checkout and a worktree, which a bare `.git` directory test is not.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

# THE HOOKS DIRECTORY, RESOLVED, NOT ASSUMED. Hooks are NOT per-worktree by
# default: every worktree of one repository shares the common git directory's
# hooks/ (unless core.hooksPath overrides it, which this repo does not set).
# `git rev-parse --git-path hooks` returns the right path either way -- the
# literal `.git/hooks` this script used to write to only happens to be
# correct from the main checkout, where `.git` is that directory itself.
HOOKS_DIR="$(git rev-parse --git-path hooks)"
mkdir -p "$HOOKS_DIR"

HOOK="$HOOKS_DIR/post-merge"
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
PRECOMMIT="$HOOKS_DIR/pre-commit"
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
PREMERGE="$HOOKS_DIR/pre-merge-commit"
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
#
# P-27 (A-QUEUE.md, 2026-09-03): THE LOGIC MOVED TO scripts/hooks/pre-push.sh,
# A TRACKED FILE, NOT A HEREDOC HERE. Every other hook in this script is
# generated inline because nothing exercises it outside a real git push; this
# one now has its own test (scripts/hooks/pre-push.test.ts) that drives real
# git repos, and a test needs a real file to execute, not a string embedded in
# an installer. The installed hook is a one-line shim so there is still one
# source of truth: edit scripts/hooks/pre-push.sh, not this file.
PREPUSH="$HOOKS_DIR/pre-push"
cat > "$PREPUSH" <<'INNER'
#!/usr/bin/env bash
# Auto-installed by scripts/install-git-hooks.sh: runs the tracked hook script
# (scripts/hooks/pre-push.sh) so there is one source of truth, testable on its
# own. `exec` replaces this process, so the hook's stdin (the ref list git
# pipes to pre-push) passes through unchanged.
exec bash "$(git rev-parse --show-toplevel)/scripts/hooks/pre-push.sh"
INNER
chmod +x "$PREPUSH"
echo "[git-hooks] pre-push orphan-main guard installed"
