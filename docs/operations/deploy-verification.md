# Deploy verification

> _Last updated: 2026-08-25_

**The publish status is not proof a deploy is live.** On 2026-08-25, `deploy_project` returned
`pending`, the publish reported completed at 12:07 UTC, and https://supaprod.ai was still serving a
bundle built before the pushed commits. The check below is what found it, and it is the only check
that counts.

## Why the publish status lies

The completed status says the publish pipeline finished. It does not say which build the site is
serving. The two can disagree: the pipeline can complete against a build taken before your push
landed, and the status reads completed either way. That is what happened — the publish completed at
12:07 UTC, and every one of the 294 chunks referenced by the serving entry bundle predated the
pushed commits. Two marker strings that exist in the pushed source (`steps of this plan`,
`mutate("press")`) had zero hits across all 294, and the live DOM confirmed the old rendering. A
re-deploy at 12:26 (deployment `409f6cdd`) was the fix.

This is the third platform signal caught reporting a state it does not measure — F-23 holds the
other two. `latest_commit_sha` is unordered, the project screenshot is a lazy artifact, and the
publish status confirms the pipeline rather than the served bytes. None of the three can verify a
deploy. Only the served bundle can.

## The rule

> **A deploy is verified when the SERVING bundle carries a marker from the commit you shipped,
> never when the publish reports completed.**

## The check

Pick a marker first: a string literal that exists in the commit you shipped and could not exist in
the previous build — new UI copy, a new log message, a new string argument. It must be a string
literal. Identifiers, comments and whitespace do not survive minification, so a function name is
not a marker.

```bash
#!/usr/bin/env bash
# Verify that the SERVING bundle carries a marker string from the commit you shipped.
#
#   ./verify-deploy.sh 'steps of this plan'
#   ./verify-deploy.sh 'mutate("press")' https://supaprod.ai
set -euo pipefail

MARKER="${1:?usage: verify-deploy.sh '<marker string>' [site-url]}"
SITE="${2:-https://supaprod.ai}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# The entry bundle the site is serving right now — not the one the publish claims.
ENTRY="$(curl -fsSL "$SITE" | grep -oE '/assets/index-[A-Za-z0-9._-]+\.js' | head -n1)"
[ -n "$ENTRY" ] || { echo "FAIL: no /assets/index-*.js referenced by the served HTML"; exit 2; }
curl -fsSL "$SITE$ENTRY" -o "$WORK/entry.js"

if grep -qF "$MARKER" "$WORK/entry.js"; then
  echo "VERIFIED: marker is in the serving entry bundle ($ENTRY)"
  exit 0
fi

# Every chunk the entry references, deduplicated.
grep -oE 'assets/[A-Za-z0-9._-]+\.js' "$WORK/entry.js" | sort -u > "$WORK/chunks.txt"
TOTAL="$(wc -l < "$WORK/chunks.txt" | tr -d ' ')"

SCANNED=0
while IFS= read -r CHUNK; do
  curl -fsSL "$SITE/$CHUNK" -o "$WORK/chunk.js" || continue
  SCANNED=$((SCANNED + 1))
  if grep -qF "$MARKER" "$WORK/chunk.js"; then
    echo "VERIFIED: marker is in /$CHUNK (chunk $SCANNED of $TOTAL)"
    exit 0
  fi
done < "$WORK/chunks.txt"

echo "NOT SERVING YOUR COMMIT: marker missing from the entry bundle and all $SCANNED of $TOTAL referenced chunks."
echo "The site is running an older build. Re-deploy and run this again."
exit 1
```

`VERIFIED` (exit 0) means the serving bundle carries your commit. Exit 1 means the site is running
an older build: fire another deploy and run the check again until it says VERIFIED. Do not report a
deploy as shipped, and do not measure the live site, until it does. When the change spans chunks,
run the script once per marker — two markers from different files are cheap insurance against one
of them being tree-shaken out.