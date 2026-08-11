#!/bin/bash
# Two signature sounds (Seed Audio 1.0): the F10 warning and the F12/F13 resolve.
# warn  — the product speaking calmly, NOT an alarm; must read differently from alert.m4a
# bloom — the brand resolve motif for the promise and the close; chime stays for utility beats
set -u
cd "$(dirname "$0")"

declare -a IDS LABELS
create() {
  local id
  id=$(higgsfield generate create seed_audio --prompt "$2" --json 2>/dev/null | tr -d '[]" \n')
  echo "created $1 -> $id"; IDS+=("$id"); LABELS+=("$1")
  sleep 2
}

create warn  "One calm low caution tone, two soft descending felt piano notes, a gentle heads up from a helpful product, warm quiet and thoughtful, not alarming, short, isolated on silence"
create bloom "Single warm resolving bell tone blooming into a soft analog pad glow, premium hopeful finish, like a promise landing, about one second, gentle fade out, isolated on silence"

for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; label="${LABELS[$i]}"
  [ -z "$id" ] && { echo "SKIP $label"; continue; }
  higgsfield generate wait "$id" --json > "wait-$label.json" 2>/dev/null
  u=$(python3 -c "import json;print(json.load(open('wait-$label.json')).get('result_url') or '')")
  [ -n "$u" ] && curl -sL "$u" -o "$label.m4a" && echo "downloaded $label"
done
echo SFX_V2_DONE; ls warn.m4a bloom.m4a 2>/dev/null
