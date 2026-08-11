#!/bin/bash
# Final VO batch: all 13 v5 lines in Vesper (qwen_audio_tts, 48kHz), name spelled "Soopah-prod".
set -u
cd "$(dirname "$0")"
V=c3204739-4084-41a3-9dc5-c805b307ec18
BASE="Warm human founder voice, never an announcer."

gen(){ # num, instruction-extra, text
  sleep 2
  local id
  id=$(higgsfield generate create qwen_audio_tts --prompt "$3" --voice-id $V --voice-type preset --language en --sample-rate 48000 --instruction "$BASE $2" --json 2>&1 | tr -d '[]" \n')
  if [ -z "$id" ] || [[ "$id" == *rror* ]]; then echo "FAIL $1"; return; fi
  higgsfield generate wait "$id" --json > "wait-$1-vesper.json" 2>/dev/null
  local u
  u=$(python3 -c "import json;print(json.load(open('wait-$1-vesper.json')).get('result_url') or '')")
  [ -n "$u" ] && curl -sL "$u" -o "$1.mp3" && printf "%s %.2fs\n" "$1" "$(/opt/homebrew/bin/ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$1.mp3")"
}

gen 01 "Light, admiring." "These days, anyone can build. Claude Code, Codex - agents write the code. Beautiful features, shipped in days."
gen 02 "Slower; weight on the last sentence." "Nobody answers the real question: what's worth building. Months go into the wrong bets. That's the judgment gap."
gen 03 "Knowing; final question lands quiet." "You know the feeling. Signals everywhere - interviews, tickets, dashboards, hunches. The loudest voice wins the roadmap. And six months later, someone asks - why did we build this?"
gen 04 "Warm; the name lands clean." "Soopah-prod. One place where agents run the work - and you make the calls. Agents that know what to build, ship it, and guide the next call."
gen 05 "Crisp momentum." "Your signals pour in. It reads every one - and hands you ranked bets, evidence attached."
gen 06 "Near-smile on the twist." "It scores each bet. And it will disagree with you - the exciting idea loses to the boring one that pays."
gen 07 "Slow, quiet, weighty." "And at the moment you commit - it writes down what you believe will happen. Before you find out."
gen 08 "Confident tour pace; last lines land." "From there, agents take it. In Plan, the spec writes itself. In Build, the work happens right inside. And Ship isn't just launch day - the announcement, the changelog, the customer email. Done. One platform. The whole lifecycle."
gen 09 "Crescendo by slowing; real pauses." "When results land, they're scored against the call that caused them - and your next bet re-ranks itself. It learns. Then it guides."
gen 10 "Reassuring, then calm certainty." "And the next time you're deciding, it's beside you - similar calls, what worked, what didn't. About to repeat a mistake? It stops you."
gen 11 "Staccato; each fragment breathes." "What you believed. What worked. What didn't - and why. Your shared brain, guiding the next call."
gen 12 "Six words, all space." "You stop guessing. You start deciding."
gen 13 "Settled, warm, final." "Soopah-prod. Agents run the work. You make the calls - and every call makes the next one sharper."
echo VESPER_BATCH_DONE
