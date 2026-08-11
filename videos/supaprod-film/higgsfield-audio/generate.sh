#!/bin/bash
# Generate all Supaprod film VO lines (Higgsfield text2speech_v2, voice Arthur) + music bed (sonilo_music).
# Creates jobs, waits, downloads into this directory as NN.mp3 / music.mp3.
set -u
cd "$(dirname "$0")"
VOICE=30fc8796-ceb6-4a66-b3a7-4a145ef7f346

declare -a IDS LABELS

create() { # label, prompt
  local label="$1"; shift
  local id
  id=$(higgsfield generate create text2speech_v2 --prompt "$1" --variant elevenlabs --voice-id "$VOICE" --voice-type preset --json 2>/dev/null | tr -d '[]" \n')
  echo "created $label -> $id"
  IDS+=("$id"); LABELS+=("$label")
}

create 01 "These days, anyone can build. Agents write the code — beautiful features, shipped in days."
create 02 "What nobody tells you is what's worth building. So teams polish the prettiest idea… and miss."
create 03 "You know the feeling. Signals everywhere — interviews, tickets, dashboards, hunches. The loudest voice wins the roadmap. And six months later, someone asks — why did we build this?"
create 04 "Supaprod. One place where agents run the work — and you make the calls. Agents that know what to build, ship it, and guide the next call."
create 05 "Your signals pour in. It reads every one — and hands you ranked bets, evidence attached."
create 06 "It scores each bet. And it will disagree with you — the exciting idea loses to the boring one that pays."
create 07 "Then — the part nobody else has. It writes down what you believe will happen. Before you find out."
create 08 "From there, agents take it. In Plan, the spec writes itself. In Build, the work happens right inside. And Ship isn't just launch day — release notes, go-to-market, done. One platform. The whole lifecycle."
create 09 "When results land, they're scored against the call that caused them — and your next bet re-ranks itself. It learns. Then it guides."
create 10 "So the next time you're about to repeat a mistake, it stops you. You made this call last year. Here's what happened. Your own record, guiding the next move."
create 11 "Anyone can dig up what happened. Only Supaprod keeps what you believed — before you found out."
create 13 "Supaprod. Build what matters. The demo is live at supaprod dot ai — no login needed."

# Line 12 was created in the validation call
IDS+=("92f4d4f4-8b97-4c32-9c16-3428e3c2da98"); LABELS+=("12")

MUSIC_ID=$(higgsfield generate create sonilo_music --prompt "Minimal cinematic score for a premium product film: restrained electronic pulse, warm analog undertone, slow patient build, quiet confident resolve at the end, no drop, no vocals, sparse and modern, Apple-film restraint" --duration 118 --json 2>/dev/null | tr -d '[]" \n')
echo "created music -> $MUSIC_ID"
IDS+=("$MUSIC_ID"); LABELS+=("music")

for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; label="${LABELS[$i]}"
  [ -z "$id" ] && { echo "SKIP $label (no id)"; continue; }
  higgsfield generate wait "$id" --json > "wait-$label.json" 2>/dev/null
  url=$(grep -oE 'https://[^"]+\.(mp3|wav|m4a|ogg)[^"]*' "wait-$label.json" | head -1)
  if [ -z "$url" ]; then url=$(grep -oE '"url"[[:space:]]*:[[:space:]]*"https://[^"]+"' "wait-$label.json" | head -1 | sed 's/.*"\(https:[^"]*\)"/\1/'); fi
  if [ -n "$url" ]; then
    ext="${url##*.}"; ext="${ext%%\?*}"
    curl -sL "$url" -o "$label.$ext" && echo "downloaded $label.$ext"
  else
    echo "NO URL for $label — see wait-$label.json"
  fi
done
echo "HIGGSFIELD_AUDIO_COMPLETE"
