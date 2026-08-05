#!/usr/bin/env bash
# Live availability sweep for the Supaprod social handles.
#
# Run this immediately before claiming anything. The table in
# docs/growth/brand-ops/social-accounts.md is a snapshot, and handle
# availability decays in days.
#
#   bash scripts/check-handles.sh
#
# READING THE OUTPUT IS THE WHOLE SKILL:
#
#   AVAILABLE   a trustworthy not-found. Only GitHub, Bluesky, npm and PyPI
#               give one, because only they answer honestly to a script.
#   TAKEN       a trustworthy found.
#   UNKNOWN     the platform bot-walled us. X, Instagram, TikTok, LinkedIn,
#               Reddit and Product Hunt all return 200 or 403 to anything that
#               is not a browser, whether or not the handle exists.
#
# UNKNOWN never means taken. Check those at signup, by hand.

set -uo pipefail

UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36'
EXACT="supaprod"
HQ="supaprodhq"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
row() { printf '  %-14s %-22s %s\n' "$1" "$2" "$3"; }

code() { curl -s -o /dev/null -w '%{http_code}' -A "$UA" -L --max-time 15 "$1" 2>/dev/null; }

# Platforms whose 404 we trust.
check_reliable() {
  local label=$1 handle=$2 url=$3
  local c
  c=$(code "$url")
  case "$c" in
  404) row "$label" "$handle" "AVAILABLE" ;;
  200) row "$label" "$handle" "TAKEN" ;;
  *) row "$label" "$handle" "UNKNOWN (http $c)" ;;
  esac
}

# Platforms that bot-wall. We report the code but never call it taken.
check_walled() {
  local label=$1 handle=$2 url=$3
  local c
  c=$(code "$url")
  if [ "$c" = "404" ]; then
    row "$label" "$handle" "probably AVAILABLE (404)"
  else
    row "$label" "$handle" "UNKNOWN (http $c, bot-walled) check at signup"
  fi
}

echo
bold "Reliable signals"
check_reliable "GitHub" "$EXACT" "https://github.com/$EXACT"
check_reliable "GitHub" "$HQ" "https://github.com/$HQ"
check_reliable "npm" "$EXACT" "https://registry.npmjs.org/$EXACT"
check_reliable "PyPI" "$EXACT" "https://pypi.org/pypi/$EXACT/json"

for h in "$EXACT" "$HQ"; do
  if curl -s --max-time 15 \
    "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=$h.bsky.social" |
    grep -q "Unable to resolve"; then
    row "Bluesky" "$h" "AVAILABLE"
  else
    row "Bluesky" "$h" "TAKEN"
  fi
done

echo
bold "Bot-walled, treat every UNKNOWN as unknown"
check_walled "X" "@$EXACT" "https://x.com/$EXACT"
check_walled "X" "@$HQ" "https://x.com/$HQ"
check_walled "YouTube" "@$EXACT" "https://www.youtube.com/@$EXACT"
check_walled "YouTube" "@$HQ" "https://www.youtube.com/@$HQ"
check_walled "LinkedIn" "company/$EXACT" "https://www.linkedin.com/company/$EXACT"
check_walled "Instagram" "@$HQ" "https://www.instagram.com/$HQ/"
check_walled "TikTok" "@$HQ" "https://www.tiktok.com/@$HQ"
check_walled "Reddit" "u/$HQ" "https://www.reddit.com/user/$HQ/about.json"
check_walled "ProductHunt" "$EXACT" "https://www.producthunt.com/products/$EXACT"

echo
bold "Domains"
for d in supaprod.com supaprod.ai supaprodhq.com superprod.ai supaprod.io supaprod.dev; do
  body=$(curl -sL --max-time 15 "https://rdap.org/domain/$d")
  # An unregistered domain gives either an errorCode object or, at some
  # registries, an empty body. Both mean available; only a real record with an
  # ldhName means registered. Testing for the positive is the only safe way
  # round: an earlier version of this check tested for the negative and
  # reported two genuinely free domains as taken.
  if [ -z "$body" ] || printf '%s' "$body" | grep -q '"errorCode"'; then
    row "domain" "$d" "AVAILABLE"
  elif printf '%s' "$body" | grep -q '"ldhName"'; then
    exp=$(printf '%s' "$body" |
      grep -o '"eventAction":"expiration","eventDate":"[^"]*' | cut -d'"' -f8 | cut -c1-10)
    row "domain" "$d" "REGISTERED${exp:+ (expires $exp)}"
  else
    row "domain" "$d" "UNKNOWN, check by hand"
  fi
done
echo
