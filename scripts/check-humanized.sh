#!/usr/bin/env bash
#
# check-humanized.sh build-time guard for the humanized-output convention.
#
# Scans ADDED lines (lines a diff prefixes with +) of staged TEXT files and
# flags AI fingerprints the convention bans: the em dash (U+2014), the en dash
# (U+2013), and the invisible / look-alike character set
# (U+200B U+200C U+200D U+2060 U+FEFF U+00A0 U+202F U+00AD U+200E U+200F U+FFFD).
# Convention: docs/conventions/humanized-output.md ("Banned fingerprints").
#
# This is the deferred build-time half of that convention. The runtime half
# (humanizeText at the AI chokepoint) already ships in src/lib/ai/humanize.ts.
#
# SCOPE: WHAT A HUMAN OR A MODEL WILL ACTUALLY READ. Narrowed by founder ruling
# 2026-08-03: the convention exists so no AI fingerprint reaches a USER, and the
# checker was spending review time on places no user can see.
#
#   CHECKED    *.ts / *.tsx, code lines only. This is where UI copy, prompt text,
#              error messages and generated output live, i.e. everything a user or
#              a model reads.
#   NOT CHECKED  comment lines and comment tails in those same files. A dash in an
#              engineer's explanation of why a function exists is not an AI
#              fingerprint, it never leaves the repo, and cleaning it is pure cost.
#   NOT CHECKED  *.md and *.sql at all. Docs are internal (see BUILD-ONLY MODE in
#              AGENTS.md) and migration prose is read by engineers, not users.
#
# The rule in one line: fix it where a user can see it, ignore it everywhere else.
# If a public marketing page is ever authored as .md, scan it explicitly by passing
# the path as an argument; that is the deliberate opt-in.
#
# It also best-effort skips obvious code samples so a legitimate dash inside one is
# not flagged: fenced triple-backtick (or triple-tilde) blocks, and inline
# `backtick` code spans on the same line.
#
# WARN-ONLY by default. It always exits 0 and prints a warning, so it can never
# block a commit or a session. Set STRICT=1 to make it exit non-zero when it
# finds a hit (for a CI gate or an opt-in blocking pre-commit hook).
#
# Usage:
#   scripts/check-humanized.sh                 # scan the staged diff (warn-only)
#   STRICT=1 scripts/check-humanized.sh        # same, but exit 1 on any hit
#   scripts/check-humanized.sh path/a.md b.ts  # scan specific files (whole file)
#
# When given file arguments it scans every line of those files (not a diff), so
# you can check a file before staging it. With no arguments it scans the staged
# diff (git diff --cached) and reports file:line for each added hit.
#
# Detection engine: perl with -CSD (decode stdin as UTF-8), so the banned set is
# matched as Unicode codepoints. This is portable across macOS (BSD grep has no
# PCRE) and Linux. Input arrives as "<lineno>\t<content>" pairs on stdin.

set -uo pipefail

STRICT="${STRICT:-0}"
# Only the files that can carry user-visible text. .md and .sql are deliberately
# absent; see SCOPE above. Passing a path explicitly still scans it whatever its
# extension, which is the escape hatch for a public page authored as markdown.
TEXT_EXT_RE='\.(ts|tsx)$'
# Generated artifacts we commit but do not author. graphify builds graphify-out/wiki/*.md and
# GRAPH_REPORT.md by quoting text extracted from the corpus, so any em-dash in them came from a
# source file, not from us, and it reappears on every rebuild. Scanning them buried the real
# violations under thousands of hits, which is how a warn-only check becomes one people ignore.
GENERATED_RE='^graphify-out/'
# NON-CONSUMER-FACING CODE, excluded by explicit founder command 2026-08-03:
#   "only on the consumer exposed user facing screens and outcomes... it's okay to
#    have it at the source code back end, which is not consumer facing, because
#    earlier you were fixing even the back end source code. That's a waste of time
#    for us and token and energy."
#
# What a user actually reads lives in src/components/** and src/routes/** (rendered
# copy) and in the prompt and humanizer modules (text sent to or returned from a
# model). Everything else under src/lib/** is server logic whose dashes never leave
# the repo, and tests are read by nobody but us.
#
# The runtime sanitizer at the AI chokepoint still protects generated output
# unconditionally, so narrowing this build-time checker loses no user-facing
# coverage. It only stops us paying to tidy prose no user will ever see.
#
# Expressed as an ALLOWLIST, not a denylist. A denylist silently re-includes every
# new server directory somebody adds, which is how this checker crept back over
# backend code the first time. An allowlist can only ever get narrower by accident,
# never wider, and a false negative here costs nothing while a false positive costs
# exactly the tokens the founder asked us to stop spending.
#
#   src/components/  src/routes/   rendered copy: labels, empty states, errors
#   src/lib/ai/prompts, humanize   text sent to a model, and the sanitizer itself
#
# Tests are excluded even inside those directories.
CONSUMER_RE='^(src/components/|src/routes/|src/lib/ai/prompts|src/lib/ai/humanize)'
TEST_RE='(\.test\.(ts|tsx)$|^src/__tests__/)'

# --- The perl scanner: reads "<lineno>\t<content>" lines, prints a hit line
# "  <file>:<lineno>  <names>" for each offending added line, and exits with a
# count of hits via a trailing "HITS=<n>" sentinel line on its last line.
# $1 is the file label to print in hits.
run_scanner() {
  local file="$1"
  perl -CSD -e '
    my $file = shift;
    my $in_fence = 0;
    my $in_block = 0;
    my $hits = 0;
    # Banned set: em dash, en dash, then the invisible / look-alike chars.
    my $banned = qr/[\x{2014}\x{2013}\x{200B}\x{200C}\x{200D}\x{2060}\x{FEFF}\x{00A0}\x{202F}\x{00AD}\x{200E}\x{200F}\x{FFFD}]/;
    while (my $rec = <STDIN>) {
      chomp $rec;
      my ($lineno, $content) = split(/\t/, $rec, 2);
      $content = "" unless defined $content;

      # Toggle fenced-code state on a line that opens or closes ``` or ~~~ .
      if ($content =~ /^\s*(```|~~~)/) { $in_fence = $in_fence ? 0 : 1; next; }
      next if $in_fence;

      # COMMENTS ARE NOT USER-FACING, so they are not scanned (founder ruling
      # 2026-08-03). Track /* ... */ blocks across lines, drop whole-line // and *
      # comments, and cut a trailing // tail off a code line.
      #
      # Deliberately naive about a "//" or "/*" appearing INSIDE a string literal
      # (a URL, a regex): the cost of that miss is a fingerprint left in a rare
      # string, and the cost of getting clever here is a scanner nobody trusts.
      # Erring toward silence is the point of this whole change.
      if ($in_block) {
        if ($content =~ m{\*/}) { $in_block = 0; $content =~ s{^.*?\*/}{}; }
        else { next; }
      }
      $content =~ s{/\*.*?\*/}{}g;                 # self-contained /* ... */
      if ($content =~ m{/\*}) { $in_block = 1; $content =~ s{/\*.*$}{}; }
      next if $content =~ m{^\s*(//|\*)};          # // line, or a jsdoc * line
      $content =~ s{//.*$}{};                      # trailing // tail
      next if $content =~ /^\s*$/;

      # Best-effort: drop inline `code` spans before checking.
      (my $stripped = $content) =~ s/`[^`]*`//g;

      next unless $stripped =~ $banned;

      my @names;
      push @names, "em-dash(U+2014)"  if $stripped =~ /\x{2014}/;
      push @names, "en-dash(U+2013)"  if $stripped =~ /\x{2013}/;
      push @names, "invisible-or-lookalike-char"
        if $stripped =~ /[\x{200B}\x{200C}\x{200D}\x{2060}\x{FEFF}\x{00A0}\x{202F}\x{00AD}\x{200E}\x{200F}\x{FFFD}]/;
      printf "  %s:%s  %s\n", $file, (defined $lineno ? $lineno : "?"), join(", ", @names);
      $hits++;
    }
    print "HITS=$hits\n";
  ' "$file"
}

# Total hits accumulate here across files.
total_hits=0

# Consume one scanner's output (passed on stdin): print hit lines to stdout and
# add the HITS sentinel to total_hits. Runs in the current shell (fed via a
# process-substitution redirect, not a pipe) so total_hits survives.
consume_scanner() {
  local line n
  while IFS= read -r line; do
    case "$line" in
      HITS=*)
        n="${line#HITS=}"
        total_hits=$((total_hits + n))
        ;;
      *)
        printf '%s\n' "$line"
        ;;
    esac
  done
}

scan_file_args() {
  local f n line tmp
  tmp="$(mktemp)"
  for f in "$@"; do
    if [[ ! -f "$f" ]]; then
      printf 'check-humanized: not a file, skipping: %s\n' "$f" >&2
      continue
    fi
    [[ "$f" =~ $TEXT_EXT_RE ]] || continue
    [[ "$f" =~ $GENERATED_RE ]] && continue
    # Emit "<lineno>\t<line>" for every line, scan, capture, then consume in the
    # current shell so the hit count is not lost to a pipeline subshell.
    n=0
    while IFS= read -r line || [[ -n "$line" ]]; do
      n=$((n + 1))
      printf '%s\t%s\n' "$n" "$line"
    done < "$f" | run_scanner "$f" > "$tmp"
    consume_scanner < "$tmp"
  done
  rm -f "$tmp"
}

scan_staged_diff() {
  local files file tmp
  # Consumer-facing paths only (explicit founder command 2026-08-03). An explicit
  # path argument still bypasses this, which is the opt-in for a public page.
  files="$(git diff --cached --name-only --diff-filter=ACMR \
    | grep -E "$TEXT_EXT_RE" \
    | grep -Ev "$GENERATED_RE" \
    | grep -E "$CONSUMER_RE" \
    | grep -Ev "$TEST_RE" || true)"
  [[ -z "$files" ]] && return 0
  tmp="$(mktemp)"
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    [[ -f "$file" ]] || continue
    # Parse the unified diff: track the new-file line number per hunk, then feed
    # only ADDED lines (a leading "+", not the "+++" header) to the scanner as
    # "<newlineno>\t<content>". Capture to a temp file, then consume in the
    # current shell so the hit count is not lost to a pipeline subshell.
    git diff --cached --unified=0 -- "$file" \
      | awk '
          /^@@ / {
            match($0, /\+[0-9]+/)
            newno = substr($0, RSTART + 1, RLENGTH - 1) + 0
            next
          }
          /^\+\+\+/ { next }
          /^\+/ {
            printf "%d\t%s\n", newno, substr($0, 2)
            newno++
          }
        ' \
      | run_scanner "$file" > "$tmp"
    consume_scanner < "$tmp"
  done <<< "$files"
  rm -f "$tmp"
}

main() {
  if ! command -v perl >/dev/null 2>&1; then
    echo "check-humanized: perl not found; cannot scan. Skipping (warn-only)." >&2
    exit 0
  fi

  if [[ $# -gt 0 ]]; then
    scan_file_args "$@"
  else
    if ! command -v git >/dev/null 2>&1; then
      echo "check-humanized: git not found and no file arguments given; nothing to scan." >&2
      exit 0
    fi
    scan_staged_diff
  fi

  if [[ $total_hits -eq 0 ]]; then
    echo "check-humanized: clean. No banned dashes or invisible characters in scanned additions."
    exit 0
  fi

  echo ""
  echo "check-humanized: found $total_hits line(s) with banned dashes or invisible characters."
  echo "Fix hint: replace em/en dashes with a period, comma, colon, parentheses, or a line break;"
  echo "          delete invisible or look-alike characters (use a normal space)."
  echo "Convention: docs/conventions/humanized-output.md"

  if [[ "$STRICT" == "1" ]]; then
    echo "check-humanized: STRICT=1, exiting non-zero."
    exit 1
  fi
  echo "check-humanized: warn-only (set STRICT=1 to fail). Exiting 0."
  exit 0
}

main "$@"
