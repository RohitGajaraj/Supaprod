#!/usr/bin/env bash
#
# seed-demo.sh - one-command helper for the Helio Labs demo seed migration.
#
# The seed itself lives at supabase/migrations/20260718120000_helio_labs_demo_seed.sql
# (Master Brief section 14): an isolated, additive-only, idempotent demo
# workspace ("Helio Labs") for the front end rebuild. This script does not
# invent a new apply path. It prints the two ways this repo already applies
# migrations (Lovable, or the Supabase CLI), and offers a third for local/CI
# convenience: a direct psql apply when DATABASE_URL is set. It is always
# safe to run twice (every INSERT in the seed uses a fixed UUID with a bare
# ON CONFLICT DO NOTHING).
#
# Usage:
#   scripts/seed-demo.sh            # print how to apply, apply via psql if DATABASE_URL is set
#   scripts/seed-demo.sh --dry-run  # only print instructions, never apply, even with DATABASE_URL set
#
# This script never applies anywhere by itself unless DATABASE_URL is
# explicitly set in the environment. Reading this file or running it with
# no DATABASE_URL is always a no-op apply-wise.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
[[ -z "$PROJECT_DIR" ]] && PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

MIGRATION_FILE="$PROJECT_DIR/supabase/migrations/20260718120000_helio_labs_demo_seed.sql"
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "seed-demo: migration file not found at $MIGRATION_FILE" >&2
  exit 2
fi

cat <<EOF
Helio Labs demo seed
=====================
Migration: supabase/migrations/20260718120000_helio_labs_demo_seed.sql

This migration is additive-only and idempotent (fixed UUIDs, bare
ON CONFLICT DO NOTHING on every insert), so applying it more than once is
always safe. It resolves demo@redcadence.app (owner) and
demo2@redcadence.app (admin) by email at apply time and no-ops cleanly if
either account does not exist yet in the target database.

Apply it one of three ways:

  1) Lovable (the canonical path for this repo)
     Push this repo to the branch Lovable reads, or run the migration
     through the Lovable dashboard's SQL / migrations tool. Lovable applies
     new files under supabase/migrations/ automatically on sync.

  2) Supabase CLI (a linked project)
     supabase link --project-ref <ref>   # once, if not already linked
     supabase db push

  3) Direct psql (local/CI convenience, this script)
     Set DATABASE_URL to a Postgres connection string, then re-run this
     script (or run the applied command below yourself):
       DATABASE_URL="postgres://..." scripts/seed-demo.sh

EOF

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set, printing instructions only, nothing applied."
  exit 0
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "DATABASE_URL is set, but --dry-run was passed, nothing applied."
  exit 0
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "seed-demo: DATABASE_URL is set but psql is not installed; install the Postgres client to apply directly, or use Lovable / the Supabase CLI instead." >&2
  exit 2
fi

echo "DATABASE_URL is set, applying via psql now."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_FILE"
echo "seed-demo: applied. Re-run any time, every insert is idempotent."
