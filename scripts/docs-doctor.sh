#!/bin/bash
# docs-doctor.sh - anti-rot check for the Cadence documentation system.
#
# WHY: this repo's docs have been cleaned up repeatedly. This check catches the
# rot that forces those cleanups, so it does not return. Run before committing
# doc changes (bun run docs:check). It is the enforcement half of the
# "Documentation Operating System" standing rule in AGENTS.md.
#
# Scope: EVERYTHING, archive included (archive is not exempt from the rules).
# Exit 1 (hard fail) on unambiguous rot: stray root/top-level files, macOS " 2"
# duplicates, dates in filenames. Reports (warns) on broken links, duplicated
# status owners, and docs missing a Created/Last updated header.

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)" || exit 0

FAIL=0
WARN=0

# Root is reserved for SYSTEM-READ entry points (tools auto-load them from here, so they MUST stay at root).
# Root holds exactly four docs (2026-08-03 cleanup). Each answers one question:
# README = what is it and where is everything · AGENTS = how to build it ·
# CLAUDE/GEMINI = per-tool specifics, thin because they auto-load every session.
# Adding a fifth is how the last three cleanups started. Do not widen this list.
ROOT_WHITELIST=" AGENTS.md CLAUDE.md GEMINI.md README.md "
DOCS_TOP_WHITELIST=" README.md brand-feed.md "

echo "== docs-doctor =="

echo "-- [1] stray .md at repo root (only the system-read entry points belong here) --"
for f in *.md; do
  [ -e "$f" ] || continue
  case "$ROOT_WHITELIST" in *" $f "*) ;; *) echo "  FAIL stray root doc: $f  (move into docs/<subfolder>/ and link it from that folder's index)"; FAIL=1;; esac
done

# Checks EVERY loose file, not just *.md. A founder mission prompt sat at docs/
# top level for weeks with NO file extension ("Readiness Audit & Consumer
# Production grade"), so the old *.md glob never saw it. An extensionless file is
# the easiest kind to lose, which makes it the most important kind to catch.
echo "-- [2] stray files at docs/ top level (everything belongs in a subfolder) --"
for f in docs/*; do
  [ -f "$f" ] || continue
  b="$(basename "$f")"
  case "$DOCS_TOP_WHITELIST" in *" $b "*) ;; *) echo "  FAIL stray docs/ file: $f  (belongs in docs/<subfolder>/ and linked from its index)"; FAIL=1;; esac
done

echo "-- [3] macOS ' 2' duplication artifacts --"
DUPES="$(find . \( -path ./node_modules -o -path ./.git -o -path ./dist -o -path ./.venv \) -prune -o \( -name '* 2.*' -o -name '* 2' \) -print 2>/dev/null)"
if [ -n "$DUPES" ]; then echo "$DUPES" | sed 's/^/  FAIL dup artifact: /'; FAIL=1; else echo "  none"; fi

echo "-- [4] duplicated status ownership (status must live only in the SSOT / dashboard) --"
BOARDS="$(grep -rIl --include='*.md' --exclude-dir=node_modules --exclude-dir=.git 'Live status board' . 2>/dev/null)"
BOARD_COUNT="$(printf '%s' "$BOARDS" | grep -c . )"
if [ "$BOARD_COUNT" -gt 1 ]; then
  echo "  WARN the phrase 'Live status board' appears in $BOARD_COUNT files (check none is a second live board; status belongs in the SSOT / feature-dashboard):"
  printf '%s\n' "$BOARDS" | sed 's/^/    /'
  WARN=1
else
  echo "  ok ($BOARD_COUNT)"
fi

echo "-- [5] broken relative .md links (report only; archive INCLUDED) --"
BROKEN_LIST=""
while IFS= read -r mdfile; do
  [ -z "$mdfile" ] && continue
  d="$(dirname "$mdfile")"
  links="$(grep -oE '\]\([^) ]+\.md[^) ]*\)' "$mdfile" 2>/dev/null | sed -E 's/^\]\(//; s/\)$//; s/#.*$//')"
  while IFS= read -r link; do
    case "$link" in ""|http*|/*|mailto:*) continue ;; esac
    # Markdown percent-encodes spaces. A link like "docs/some%20folder/x.md" is VALID
    # link to a real file; testing it undecoded reported 8 healthy links as broken,
    # which is how a warn list gets ignored. Decode before the existence test.
    dec="$(printf '%s' "$link" | sed 's/%20/ /g')"
    if [ ! -f "$d/$dec" ]; then BROKEN_LIST="${BROKEN_LIST}  BROKEN ${mdfile} -> ${link}"$'\n'; fi
  done <<< "$links"
  # Scope: docs WE own. Vendored tool libraries (.agents, .claude, .kiro, .gemini,
  # .conductor) ship their own broken cross-references and we do not maintain them;
  # including them buried our own findings under ~40 of theirs. Generated graphify
  # output is excluded for the same reason: it is rewritten on every build.
done < <(find . \( -path ./node_modules -o -path ./.git -o -path ./dist -o -path ./.venv \
                   -o -path ./.agents -o -path ./.claude -o -path ./.kiro -o -path ./.gemini \
                   -o -path ./.conductor -o -path ./graphify-out -o -path ./.remember \) -prune \
                -o -name '*.md' -print 2>/dev/null)
if [ -n "$BROKEN_LIST" ]; then
  LIVE="$(printf '%s' "$BROKEN_LIST" | grep -v '/archive/' || true)"
  ARCH="$(printf '%s' "$BROKEN_LIST" | grep -c '/archive/' || true)"
  if [ -n "$LIVE" ]; then printf '%s\n' "$LIVE"; echo "  WARN $(printf '%s\n' "$LIVE" | grep -c 'BROKEN') broken link(s) in LIVE docs (fix these)."; WARN=1; else echo "  no broken links in live docs"; fi
  [ "${ARCH:-0}" -gt 0 ] && echo "  (plus ${ARCH} broken link(s) inside archived historical docs - left as historical record)"
else
  echo "  none"
fi

# WHY THIS CHECK WAS NARROWED (2026-08-03). It used to fail on EVERY dated
# filename anywhere, which meant 36 hits including generated graphify output and
# .remember plugin state. It failed on every run, so it was read as noise and the
# genuine offenders sat in it for weeks. A check that always fails enforces nothing.
#
# The rule's PURPOSE is that freshness is learned on open, from the header, so a
# name can never imply a doc is current when it is not. That purpose is served by
# banning dates on LIVING docs (plans, specs, indexes, conventions). It is not
# served by banning them on a DATED RECORD of a specific event, where the date is
# the file's identity and removing it causes collisions: a founder verdict given on
# one day, an applied design record in a series, an archived session report.
# So: generated output and plugin state are out of scope, dated records are allowed
# by folder or by name, and everything else must carry its date in the header only.
echo "-- [6] dates in the filenames of LIVING docs (the date belongs in the header) --"
DATED="$(find . \
  \( -path ./node_modules -o -path ./.git -o -path ./dist -o -path ./.venv \
     -o -path ./.remember -o -path ./graphify-out -o -path ./.claude \
     -o -path '*/archive/*' -o -path '*/applied/*' \) -prune \
  -o -name '*[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*.md' -print 2>/dev/null \
  | grep -v -E 'FOUNDER-VERDICT-|/docs/pitch/repositioning-' || true)"
if [ -n "$DATED" ]; then
  echo "$DATED" | sed 's/^/  FAIL dated filename: /'
  echo "  (drop the date from the name and put Created/Last updated in the file header."
  echo "   If it is genuinely a dated RECORD of one event, put it under archive/ or applied/.)"
  FAIL=1
else echo "  none"; fi

echo "-- [7] docs missing a Created / Last updated header --"
MISS=0
while IFS= read -r mdfile; do
  [ -z "$mdfile" ] && continue
  if ! head -12 "$mdfile" | grep -qiE 'Last updated|Created:'; then echo "  WARN no date header: $mdfile"; MISS=1; fi
done < <( { find docs -name '*.md' 2>/dev/null; for r in AGENTS.md CLAUDE.md GEMINI.md README.md; do [ -f "$r" ] && echo "$r"; done; } )
if [ "$MISS" -ne 0 ]; then echo "  (add '> _Created: YYYY-MM-DD · Last updated: YYYY-MM-DD_' under the H1)"; WARN=1; else echo "  ok"; fi

# WHY THIS CHECK REPLACED THE OLD ONE. Until 2026-08-03 slot [8] checked the CASE
# of links to a root DESIGN.md. That file no longer exists, so the check could
# only ever pass, while the real hazard went unguarded: three of the four root
# docs were pointing agents at Tempo v5, a design contract the founder rejected
# on 2026-07-28. Following the docs actively undid the rebuild. A doc that sends
# a reader at a retired contract is worse than a missing doc.
#
# Narrowed once, immediately: the first version also matched a BACKTICKED mention,
# which flagged docs/design/DESIGN-SYSTEM.md for the sentence that names the four
# contracts in order to retire them. Naming a dead contract as dead is the correct
# behaviour and must not be a failure. Only a LINK can actually send a reader
# somewhere, so only a link is a defect.
echo "-- [8] a retired design contract LINKED as if it were current --"
RETIRED="$(grep -rIn -E '\]\((\./)?(\.\./)*DESIGN(-TEMPO|-LOOM|-OBSIDIAN)?\.md\)' . \
  --include='*.md' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=graphify-out \
  --exclude-dir=archive --exclude-dir=design-reference --exclude-dir=worktrees \
  --exclude-dir=.agents --exclude-dir=.kiro --exclude-dir=.gemini --exclude-dir=.conductor 2>/dev/null)"
if [ -n "$RETIRED" ]; then
  echo "$RETIRED" | sed 's/^/  FAIL retired design contract cited: /'
  echo "  (DESIGN.md, DESIGN-TEMPO.md, DESIGN-LOOM.md and DESIGN-OBSIDIAN.md were all retired."
  echo "   The live contract is docs/design/DESIGN-SYSTEM.md. History lives in docs/design/archive/.)"
  FAIL=1
else echo "  ok"; fi

echo ""
if [ "$FAIL" -ne 0 ]; then echo "docs-doctor: ISSUES FOUND (hard rot). Fix the FAIL items in the same commit."; exit 1; fi
[ "$WARN" -ne 0 ] && echo "docs-doctor: clean of hard rot; review the WARN items above." || echo "docs-doctor: clean."
exit 0
