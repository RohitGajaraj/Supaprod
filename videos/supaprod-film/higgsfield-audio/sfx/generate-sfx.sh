#!/bin/bash
# Bespoke SFX pack for the film's micro-interactions (Seed Audio 1.0).
set -u
cd "$(dirname "$0")"

declare -a IDS LABELS
create() { # label, prompt
  local id
  id=$(higgsfield generate create seed_audio --prompt "$2" --json 2>/dev/null | tr -d '[]" \n')
  echo "created $1 -> $id"; IDS+=("$id"); LABELS+=("$1")
}

create click     "Single soft premium UI click, one short tactile tap, clean digital interface sound, subtle, no reverb tail, isolated on silence"
create keys      "Soft mechanical keyboard typing, gentle rapid keystrokes for three seconds, quiet office ambience, muffled premium laptop keys, no voices"
create whoosh    "Short cinematic air whoosh for a fast camera pan, smooth swish, half a second, subtle and airy, no impact, isolated on silence"
create punch     "Cinematic whoosh into a warm deep impact, camera flying through a ring of fire, one second, dramatic but smooth, warm low-end bloom, no debris"
create chime     "Single warm success chime, soft two-note marimba-like ding, premium product notification, short, isolated on silence"
create seal      "Single soft mechanical lock click with a faint warm resonance, like a wax seal pressed then a latch, short, isolated on silence"
create alert     "One soft gentle alert tone, calm two-tone notification, warm and non-alarming, premium product sound, short, isolated on silence"
create tick      "Single tiny soft tick pop, small UI element settling into place, very short, subtle, isolated on silence"
create swell     "Warm cinematic swell rising gently for two seconds, soft analog synth pad bloom, hopeful and premium, no percussion, fades in"

for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; label="${LABELS[$i]}"
  [ -z "$id" ] && { echo "SKIP $label"; continue; }
  higgsfield generate wait "$id" --json > "wait-$label.json" 2>/dev/null
  u=$(python3 -c "import json;print(json.load(open('wait-$label.json')).get('result_url') or '')")
  [ -n "$u" ] && curl -sL "$u" -o "$label.m4a" && echo "downloaded $label"
done
echo SFX_PACK_DONE; ls *.m4a 2>/dev/null
