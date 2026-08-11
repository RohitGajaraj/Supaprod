#!/bin/bash
# Music audition set, founder-requested 2026-08-12: three out-of-the-box directions,
# each generated at FULL film length in one piece (never extend, never splice).
# Constraints baked into every prompt: sits under narration, no vocals, no drop,
# one gentle lift late (the orange promise), quiet resolved ending.
set -u
cd "$(dirname "$0")"

declare -a IDS LABELS
create() {
  local id
  id=$(higgsfield generate create sonilo_music --prompt "$2" --duration 145 --json 2>/dev/null | tr -d '[]" \n')
  echo "created $1 -> $id"; IDS+=("$id"); LABELS+=("$1")
  sleep 2
}

create felt-piano "Intimate felt piano over soft analog tape hiss, a small recurring four note motif, slow warm sub bass pulse, spacious and human, documentary film score restraint, stays quiet under a narrator, one gentle swell in the final third, ends resolved and calm, no drums, no vocals, no drop"

create midnight-workshop "Quiet analog synthesizer arpeggio like a machine gently working, dusty brushed percussion barely there, warm Rhodes chords far in the background, steady patient forward motion at one tempo throughout, krautrock restraint, premium and modern, low energy under a narrator, one confident lift near the end then a calm resolved outro, no vocals, no drop"

create hang-drum "Organic minimalism with soft hang drum and warm marimba patterns, deep upright bass notes, subtle room air, handmade and premium, unusual for a product film, gentle constant pulse that never competes with a narrator, patient build, one warm bloom in the final third, quiet resolved ending, no vocals, no drop, no cymbals"

for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; label="${LABELS[$i]}"
  [ -z "$id" ] && { echo "FAILED_CREATE $label"; continue; }
  higgsfield generate wait "$id" --json > "wait-music-$label.json" 2>/dev/null
  u=$(python3 -c "import json;print(json.load(open('wait-music-$label.json')).get('result_url') or '')")
  [ -n "$u" ] && curl -sL "$u" -o "music-audition-$label.m4a" && echo "downloaded $label"
done
echo MUSIC_AUDITIONS_DONE; ls -la music-audition-*.m4a 2>/dev/null
