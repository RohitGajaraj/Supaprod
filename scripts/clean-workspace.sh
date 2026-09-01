#!/usr/bin/env bash
#
# clean-workspace.sh — the repo working-tree janitor (images + FS-dup artifacts).
#
# Idempotent and SAFE. It only relocates/purges image files in known scratch and
# ephemeral locations, and removes macOS case-insensitive FS-duplication artifacts
# ONLY when their canonical twin exists. It never touches design-reference/ (committed
# references), public/ or src/ app assets, or the durable docs/screenshots/ buckets.
#
# Three jobs (convention: docs/conventions/workspace-hygiene.md):
#   1. IMAGES
#      - relocate stray images at the repo root or docs/ top level into
#        docs/screenshots/verify/ (no image belongs at the root)
#      - purge ephemeral buckets past retention:
#          docs/screenshots/verify/  -> 14 days (SCREENSHOT_VERIFY_RETENTION_DAYS)
#          .playwright-mcp/           ->  7 days (SCREENSHOT_MCP_RETENTION_DAYS)
#   1c. AGENT PROBE + SNAPSHOT ARTIFACTS (2026-09-02)
#      - relocate root *.yml / *.yaml a11y dumps into .playwright-mcp/ (never deleted)
#      - remove e2e/zz-*.spec.ts throwaway probe specs outright
#   2. FS-DUP ARTIFACTS
#      - remove macOS "<name> 2.<ext>" / "<name> 2" duplicates (the case-insensitive
#        filesystem + sync artifacts CLAUDE.md warns about) ONLY when the canonical
#        "<name>.<ext>" / "<name>" exists, so a legitimately-named file is never lost.
#
# Run manually:  bun run clean:workspace   (or ./scripts/clean-workspace.sh)
# To run automatically, wire it to the Claude Code session Stop hook in
# .claude/settings.json (pending founder approval; that file is gated config).
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT" || exit 0

VERIFY_RETENTION_DAYS="${SCREENSHOT_VERIFY_RETENTION_DAYS:-14}"
MCP_RETENTION_DAYS="${SCREENSHOT_MCP_RETENTION_DAYS:-7}"
DEST="docs/screenshots/verify"
mkdir -p "$DEST"

# ---- 1. Images: relocate root / docs-top-level strays into the verify bucket ----
moved=0
for pat in ./*.png ./*.jpg ./*.jpeg ./*.gif ./*.webp docs/*.png docs/*.jpg docs/*.jpeg docs/*.gif docs/*.webp; do
  for f in $pat; do
    [ -e "$f" ] || continue
    target="$DEST/$(basename "$f")"
    [ -e "$target" ] && target="$DEST/$(date +%Y%m%d-%H%M%S)-$(basename "$f")"
    mv -f "$f" "$target" && moved=$((moved + 1))
  done
done

# ---- 1b. Images: purge ephemeral buckets past their retention window ----
purged_verify=$(find "$DEST" -type f -mtime +"$VERIFY_RETENTION_DAYS" -print -delete 2>/dev/null | wc -l | tr -d ' ')
purged_mcp=0
[ -d .playwright-mcp ] && purged_mcp=$(find .playwright-mcp -type f -mtime +"$MCP_RETENTION_DAYS" -print -delete 2>/dev/null | wc -l | tr -d ' ')

# ---- 1c. Agent probe + snapshot artifacts (added 2026-09-02) ----
# A session driving the browser leaves two things behind, and both were found in the
# tree on 2026-09-02: an accessibility-tree dump at the repo ROOT (er-overview.yml,
# which was the only FAIL in docs:check), and a throwaway probe spec in e2e/.
#
# The probe spec is the dangerous one and it is NOT tidy-up. playwright.config.ts
# sets testDir "./e2e" and, until 2026-09-02, carried no ignore rule, so any spec
# left there joined every `playwright test` run. This repo has already paid for that
# once: a probe pressing real surfaces created six duplicate tracks, which starved
# the one track a session was watching. The config now ignores zz-*.spec.ts; this
# removes the file so the two defences do not depend on each other.
#
# Snapshots are RELOCATED (never deleted) into .playwright-mcp/, which 1b above
# already purges at 7 days. Probe specs are removed outright: they are scratch by
# naming convention and nothing should ever read one again.
snaps=0
for f in ./*.yml ./*.yaml; do
  [ -e "$f" ] || continue
  case "$(basename "$f")" in
    # Root .yml is not a repo convention: nothing tracked lives there. Guarded anyway
    # so a deliberate future root config is never swallowed by the janitor.
    docker-compose.yml|docker-compose.yaml|.pre-commit-config.yaml) continue ;;
  esac
  mkdir -p .playwright-mcp
  target=".playwright-mcp/$(basename "$f")"
  [ -e "$target" ] && target=".playwright-mcp/$(date +%Y%m%d-%H%M%S)-$(basename "$f")"
  mv -f "$f" "$target" && snaps=$((snaps + 1))
done

probes=0
while IFS= read -r f; do
  [ -e "$f" ] || continue
  rm -f "$f" && probes=$((probes + 1))
done < <(find e2e -name 'zz-*.spec.ts' -type f 2>/dev/null)

# ---- 2. macOS FS-duplication artifacts ("<name> 2.<ext>" / "<name> 2") ----
# Removed ONLY when the canonical twin exists, so a real file is never deleted.
dups=0
while IFS= read -r p; do
  [ -e "$p" ] || continue
  base="$(basename "$p")"
  dir="$(dirname "$p")"
  if [[ "$base" == *" "[2-9]"."* ]]; then
    canon="${base/ [2-9]./.}"      # "<name> 2.<ext>" -> "<name>.<ext>"
  else
    canon="${base% [2-9]}"          # "<name> 2"       -> "<name>"
  fi
  if [ -e "$dir/$canon" ] && [ "$base" != "$canon" ]; then
    rm -rf "$p" && dups=$((dups + 1))
  fi
done < <(find . \( -path ./node_modules -o -path ./.git -o -path ./dist -o -path ./.venv -o -path ./.wrangler \) -prune -o \( -name "* [2-9]" -o -name "* [2-9].*" \) -print 2>/dev/null)

# Speak only when something actually happened (quiet on a clean tree).
if [ "$moved" -gt 0 ] || [ "$purged_verify" -gt 0 ] || [ "$purged_mcp" -gt 0 ] || [ "$dups" -gt 0 ] || [ "$snaps" -gt 0 ] || [ "$probes" -gt 0 ]; then
  echo "[clean-workspace] images: relocated ${moved}, purged ${purged_verify} verify + ${purged_mcp} mcp scratch; FS-dup artifacts removed: ${dups}; snapshots relocated: ${snaps}; probe specs removed: ${probes}."
fi
exit 0
