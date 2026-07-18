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
# Warn-only by default so it never blocks a commit; set HUMANIZE_STRICT=1 to
# make a hit fail the commit.
PRECOMMIT=".git/hooks/pre-commit"
cat > "$PRECOMMIT" <<'EOF'
#!/usr/bin/env bash
# Auto-installed by scripts/install-git-hooks.sh: humanized-output backstop.
# Convention: docs/conventions/humanized-output.md.
if [ -f scripts/check-humanized.sh ]; then
  if [ "${HUMANIZE_STRICT:-0}" = "1" ]; then
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
# an archive/ branch is blocked unless FOUNDER_APPROVED=1 is set for that
# one command. Applies to every session, human or agent.
PREMERGE=".git/hooks/pre-merge-commit"
cat > "$PREMERGE" <<'INNER'
#!/usr/bin/env bash
if [ -f .git/MERGE_MSG ] && grep -qE "archive/" .git/MERGE_MSG; then
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
