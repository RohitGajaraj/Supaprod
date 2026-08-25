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
# AUDIT.md and PRODUCT-TRUTH.md sit at docs/ top level by the founder's direct
# instruction (2026-08-25, the /goal mission named those exact paths).
DOCS_TOP_WHITELIST=" README.md AUDIT.md PRODUCT-TRUTH.md "

echo "== docs-doctor =="

# EVERY loose file at root, not just markdown. The founder's point 2026-08-04: a
# checker scoped to one extension misses the thing that actually accumulates. Sixty
# loose PNGs, two JPEGs and three stray database files sat at root while a
# markdown-only check reported clean. Build config and lockfiles are legitimate and
# whitelisted; anything else is either misplaced or belongs in a gitignored directory.
echo "-- [1] stray files at repo root (docs, images, data, anything loose) --"
# cadence-parallel.code-workspace is editor config, the same class as the build
# config below it, and it has to be at root: its "folders" paths are resolved
# relative to the workspace file itself, so "." and "../cadence-lane-0" only mean
# the repo and its sibling lanes from here.
ROOT_ALLOWED=" AGENTS.md CLAUDE.md GEMINI.md README.md package.json package-lock.json bun.lock bunfig.toml tsconfig.json vite.config.ts eslint.config.js playwright.config.ts components.json wrangler.jsonc requirements.txt skills-lock.json cadence-parallel.code-workspace "
for f in *; do
  [ -f "$f" ] || continue
  case "$ROOT_ALLOWED" in *" $f "*) continue ;; esac
  git check-ignore -q "$f" 2>/dev/null && { echo "  WARN loose gitignored file at root: $f  (move it into a gitignored DIRECTORY; screenshots go in docs/screenshots/)"; WARN=1; continue; }
  echo "  FAIL stray root file: $f  (docs go in docs/<bucket>/ and get linked; images go in docs/screenshots/ or design-reference/)"; FAIL=1
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
  links="$(grep -oE '\]\([^)]+\.md[^)]*\)' "$mdfile" 2>/dev/null | sed -E 's/^\]\(//; s/\)$//; s/#.*$//')"
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
                   -o -path ./.conductor -o -path ./.context \
                   -o -path ./graphify-out -o -path ./.remember \) -prune \
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
# `.context/` joins that prune list 2026-08-25: it is Conductor's per-workspace
# agent scratch directory, gitignored (`.git/info/exclude`), and it holds the plan
# file the harness writes for every session. It is plugin state by the paragraph
# above, and leaving it in scope failed this gate for every agent in a Conductor
# workspace over a file none of them chose the name of.
# So: generated output and plugin state are out of scope, dated records are allowed
# by folder or by name, and everything else must carry its date in the header only.
echo "-- [6] dates in the filenames of LIVING docs (the date belongs in the header) --"
DATED="$(find . \
  \( -path ./node_modules -o -path ./.git -o -path ./dist -o -path ./.venv \
     -o -path ./.remember -o -path ./graphify-out -o -path ./.claude \
     -o -path ./.conductor -o -path ./.context \
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

# WHY THIS CHECK EXISTS (added 2026-08-04). Structure being clean does not make
# CONTENT true. On the day this was written, a full-content scan of the live docs
# found four real defects that every structural check passed over:
#
#   - docs/pitch/applications/answer-bank.md warned "Never close on 'remember'"
#     and then, three lines later, its PASTE-READY block closed on "and
#     remembers." The instruction and the artifact contradicted each other, and
#     the artifact is the thing that gets pasted into an application.
#   - the one-pager's category line had the same stale close.
#   - the marketing checklist answered "what colour should this be?" by pointing
#     at DESIGN-TEMPO.md, a contract the founder rejected on 2026-07-28.
#   - agent-experience.md said "all six stations" when there are seven.
#
# So this greps for the specific phrasings that are now WRONG. It is deliberately
# a small, literal list rather than a clever heuristic: each entry earned its place
# by actually being found in a live doc. Add a line when a ruling retires a phrase.
#
# Scoped out: archive/ (history must stay accurate to its date), references/ and
# prompts/ (verbatim source material), and the append-forward logs, whose job is to
# record what was said at the time.
#
# THE APPEND-FORWARD LOGS ARE ONE LIST NOW, shared by check [9] and check [11]
# (2026-08-20). It was inline in [9] only, and it was already three names short:
# `ledger/kiro-log.md` and `ledger/claude-log.md` are the two build ledgers, both
# strictly append-only with one writer each, and both have to be able to QUOTE a
# defect in order to record fixing it. Within one hour of the ledger existing that
# stopped being hypothetical: an entry recording that check [11] had been failing
# on two gitignored exports named the file and quoted the planted string, and the
# next markdown commit was blocked by its own changelog.
#
# A record that cannot name what it fixed is not a record. The rule these checks
# enforce is about what a doc CLAIMS; a log entry saying "this used to say X and X
# was wrong" claims the opposite of X.
#
# ARRIVED AT TWICE, INDEPENDENTLY, IN THE SAME HOUR. Claude hit the same wall from
# the other side and added the same two exclusions as separate inline greps; this
# is the merge of the two, kept as one shared list rather than two copies of it,
# for the reason the repo has already paid for seven times over. Both versions had
# identical behaviour; the only difference is how many places the next name has to
# be added in.
RECORD_FILES='session-decisions\|strategic-inputs-log\|session-handoff\|build-log\|ledger/kiro-log\|ledger/claude-log'
echo "-- [9] retired wording still present in LIVE docs --"
STALE_SCOPE="--include=*.md docs architecture"
stale_hits() {
  grep -rInE "$1" $STALE_SCOPE ./AGENTS.md ./README.md ./CLAUDE.md ./GEMINI.md 2>/dev/null \
    | grep -v '/archive/' | grep -v 'docs/research/' | grep -v 'docs/prompts/' \
    | grep -v "$RECORD_FILES" \
    | grep -viE 'never (say|close|call|write)|bans?\b|ban on|banned|do not (say|use)|retired|instead of|rather than|superseded|no longer|insists|forbidden|stale as of|\| \*\*"|^[^:]*:[0-9]+:\s*\||^[^:]*:[0-9]+:\s*-\s*"' || true
}
STALE=""
# The claim closes on learning and guiding. "Remembers" describes storage.
STALE="${STALE}$(stale_hits 'and remembers\.|where the record lives')"
# Seven stations, and it is a route rather than a conveyor.
STALE="${STALE}$(stale_hits 'six stations|five destinations|5 destinations')"
# The design contract is docs/design/DESIGN-SYSTEM.md.
STALE="${STALE}$(stale_hits 'DESIGN-TEMPO\.md|DESIGN-LOOM\.md|DESIGN-OBSIDIAN\.md')"
# The launch date is September 2026.
STALE="${STALE}$(stale_hits 'under 25 days|~Aug 4')"
if [ -n "$STALE" ]; then
  printf '%s\n' "$STALE" | sed 's/^/  FAIL stale wording: /' | cut -c1-160
  echo "  (the claim LEARNS and GUIDES, never 'remembers' · SEVEN stations, a route not a conveyor ·"
  echo "   the design contract is docs/design/DESIGN-SYSTEM.md · the launch date is September 2026)"
  FAIL=1
else echo "  ok"; fi

# WHY THIS CHECK EXISTS (added 2026-08-04). The founder asked the right question:
# whether the placement rules would actually be followed, or just dumped somewhere an
# agent never reads. Documentation is the weak layer. A rule in a doc is followed only
# if somebody opens the doc; a rule in this script is followed always.
#
# This is the enforcement half of the routing table in docs/README.md, and it catches
# the case that table cannot: a file put in the RIGHT folder and then linked from
# nowhere, which every other check here is blind to. Nine such orphans were found by
# hand on 2026-08-03 and thirteen more on 2026-08-04.
#
# IMPLEMENTED AS ONE PASS, deliberately. The first version grepped the whole tree once
# per file, which is O(n-squared) over ~250 docs and did not finish inside two minutes.
# A check that slow gets removed from the hook, which would defeat the point. This
# extracts every referenced basename in a single grep, then tests membership.
#
# Scope: live docs we own. archive/ is exempt, since history is reached through its
# archive README rather than per file, and a README is never counted as an orphan.
echo "-- [10] live docs reachable from nowhere (orphans) --"
# ONE grep over the tree emitting "path:referenced.md", then awk decides. A file is
# reachable when some OTHER file names it. Self-references do not count, which is the
# THIS FILE MUST BE PER-PROCESS. It was `/tmp/dd_referenced.txt`, a fixed path, and
# two concurrent runs shared it: the second truncates it with `>` while the first is
# still grepping it, so every doc reads as unreferenced. Measured 2026-08-22 while
# several agents worked one tree -- one run reported 394 phantom orphans and the next
# reported none, from an unchanged repo. A gate that fails at random gets ignored,
# which is worse than one that does not exist.
#
# This repo has already paid for this exact shape once, recorded as "a background job
# truncating the file a foreground grep was reading".
DD_REFERENCED="$(mktemp "${TMPDIR:-/tmp}/dd_referenced.XXXXXX")"
trap 'rm -f "$DD_REFERENCED"' EXIT

# subtle part: a doc that only mentions its own filename is still an orphan.
ORPH="$(grep -roE '[A-Za-z0-9._-]+\.md' docs architecture ./AGENTS.md ./README.md ./CLAUDE.md ./GEMINI.md --include='*.md' 2>/dev/null \
  | awk -F: '
      { path = $1; ref = $2
        n = split(path, parts, "/"); self = parts[n]
        if (ref != self) seen[ref] = 1
      }
      END { for (r in seen) print r }' \
  | sort -u > "$DD_REFERENCED"; \
  find docs architecture -name "*.md" -not -path "*/archive/*" 2>/dev/null \
  | while IFS= read -r f; do
      b="$(basename "$f")"
      [ "$b" = "README.md" ] && continue
      grep -qxF "$b" "$DD_REFERENCED" || echo "  FAIL orphan (linked from nowhere): $f"
    done)"
rm -f "$DD_REFERENCED"
if [ -n "$ORPH" ]; then
  printf '%s\n' "$ORPH"
  echo "  (link it from its folder's README in the same commit, or move it to an archive/)"
  FAIL=1
else echo "  ok"; fi

echo ""

# WHY THIS CHECK EXISTS (added 2026-08-19). Check [8] looks for LINKS to a retired
# contract by FILENAME, and excludes design-reference/ because that folder is frozen
# history. Both choices were defensible and together they left the exact hole the
# founder found on 2026-08-19: design-reference/README.md carried
#
#     > ## CURRENT: the v5 "Tempo" system (adopted 2026-07-10)
#     > The design contract for EVERY Supaprod surface ... is
#     > [docs/design/archive/tempo-v5.md] (repo root, the law)
#
# A retired system DECLARING ITSELF CURRENT, in the folder AI builders are pointed
# at, five days after it was retired. Check [8] could not see it twice over: the
# folder was excluded, and the link was into archive/ rather than to a DESIGN-*.md
# filename. This checks the DECLARATION rather than the link, which is the shape the
# defect actually takes.
# THE TWO AGENT LEDGERS ARE EXCLUDED, for the reason check [9] already gives one
# screen up: they are append-forward logs "whose job is to record what was said at
# the time". `ledger/claude-log.md` and `ledger/kiro-log.md` were created
# 2026-08-19, after that exclusion list was written, so they were never added to
# it. Both quote the retired claims they are recording the correction of -- that
# is the entry, not a lapse in it -- and on 2026-08-20 exactly that turned main
# red: an entry explaining this check's own fix tripped it, and checks [9] and
# [11] together blocked every further markdown commit by either agent.
#
# An append-only record of a false claim being retired is the opposite of a live
# doc asserting it. If the ledgers ever do assert one, the ledger protocol's own
# rule applies -- corrections go in a NEW entry naming the one they correct -- and
# no grep can enforce that.
echo "-- [11] a retired design system DECLARED current in a live doc --"
# A GITIGNORED FILE IS NOT A LIVE DOC, and this check failed on two of them for
# anyone who had them on disk (found 2026-08-20 while K-22 was correcting the
# architecture contracts, which is when it started blocking commits).
#
# `design-reference/Latest Design System - v3 /DESIGN-OBSIDIAN.md` and its
# handoff twin were UNTRACKED as of `2894167ad` -- deliberately local-only large
# exports -- and both open with `status: THE design contract for the product
# app`. That sentence is true of what the file was when it was written and the
# file is not in the repo, so there is nothing to correct and nothing to commit:
# the only ways to clear the FAIL were to edit a founder's local export or to
# stop scanning things git does not track. Every other check in this script is
# scoped to `docs architecture` for the same reason; this one scans `.` with a
# hand-maintained exclude list, which cannot keep up.
#
# `git check-ignore` rather than another `--exclude-dir`: the list was already
# ten directories long and would have needed an eleventh the next time somebody
# unpacked a reference bundle. This asks git what belongs to the repo.
drop_ignored() {
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    f="${line%%:*}"
    git check-ignore -q "$f" 2>/dev/null || printf '%s\n' "$line"
  done
}
DECLARED="$(grep -rIn -E '(CURRENT|is the law|design contract for|source of truth)[^|]{0,160}(Tempo|Obsidian|Loom|Ember|Cadence/ink)' . \
  --include='*.md' --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=graphify-out \
  --exclude-dir=archive --exclude-dir=worktrees --exclude-dir=.agents --exclude-dir=.kiro \
  --exclude-dir=.gemini --exclude-dir=.conductor 2>/dev/null \
  | grep -viE 'retired|history is not authority|was wrong|corrected|no longer|superseded|used to' \
  | grep -v "$RECORD_FILES" \
  | drop_ignored )"
if [ -n "$DECLARED" ]; then
  echo "$DECLARED" | sed 's/^/  FAIL retired system declared current: /'
  echo "  (Meridian is the only design system. v1 Ember, v3 Obsidian, v4 Loom, v5 Tempo"
  echo "   and Cadence/ink are retired. Naming one to RETIRE it is fine and is not caught;"
  echo "   declaring one CURRENT or as the contract is the defect. Contract:"
  echo "   docs/design/DESIGN-SYSTEM.md)"
  FAIL=1
else echo "  ok"; fi

if [ "$FAIL" -ne 0 ]; then echo "docs-doctor: ISSUES FOUND (hard rot). Fix the FAIL items in the same commit."; exit 1; fi
[ "$WARN" -ne 0 ] && echo "docs-doctor: clean of hard rot; review the WARN items above." || echo "docs-doctor: clean."
exit 0
