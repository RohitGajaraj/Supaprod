#!/bin/bash
# Arthur (ElevenLabs via Higgsfield text2speech_v2) on the v11 script — founder-ruled 2026-08-12.
# Vesper takes are preserved in vesper-takes/ before download overwrites NN.mp3.
# ASCII punctuation only (em dashes and ellipses have silently killed job creation before).
set -u
cd "$(dirname "$0")"
VOICE=30fc8796-ceb6-4a66-b3a7-4a145ef7f346

mkdir -p vesper-takes
for i in 01 02 03 04 05 06 07 08 09 10 11 12 13; do
  [ -f "$i.mp3" ] && cp -n "$i.mp3" "vesper-takes/$i.mp3"
done

declare -a IDS LABELS
create() { # label, prompt
  local label="$1"; shift
  local id
  id=$(higgsfield generate create text2speech_v2 --prompt "$1" --variant elevenlabs --voice-id "$VOICE" --voice-type preset --json 2>/dev/null | tr -d '[]" \n')
  echo "created $label -> $id"
  IDS+=("$id"); LABELS+=("$label")
  sleep 2
}

create 01 "These days, anyone can build. Agents write the code - beautiful features, shipped in days."
create 02 "But what to build - nobody cracks that call. So teams build the wrong features... and miss what mattered. That's the judgment gap."
create 03 "You know the feeling. Signals everywhere - interviews, tickets, dashboards, hunches. The loudest voice wins the roadmap. And six months later, someone asks - why did we build this?"
create 04 "Soopah-prod... Where the work runs on agents - and the calls stay yours. Agents that know what to build, ship it, and guide the next call."
create 05 "Your signals pour in. It reads every one - and hands you ranked bets, evidence attached."
create 06 "It scores each bet. When the data says you're wrong - it disagrees. And the exciting idea loses to the boring one that pays."
create 07 "And at the moment you commit - it writes down what you believe will happen. Before you find out."
create 08 "Agents run every station. In Plan, the spec writes itself. In Design, the prototype takes shape. In Build, the code is written and tested - inside your boundaries. And Ship isn't just launch day - the announcement, the changelog, the customer email. Done. One platform. The whole product lifecycle."
create 09 "When results land, Learn scores every outcome against the call that caused it. The brain takes it in - and your next bet re-ranks itself."
create 10 "And the next time you're deciding, it's beside you - the same call from last quarter, and how it went. About to repeat a mistake? It warns you."
create 11 "What you believed. What worked. What didn't - and why. Your shared brain - at the table, every time."
create 12 "You stop guessing. You start deciding. Build what matters."
create 13 "Soopah-prod... Agents run the work. You make the calls. And every call makes the next one sharper."

for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; label="${LABELS[$i]}"
  [ -z "$id" ] && { echo "FAILED_CREATE $label"; continue; }
  higgsfield generate wait "$id" --json > "wait-$label-arthur.json" 2>/dev/null
  u=$(python3 -c "import json;print(json.load(open('wait-$label-arthur.json')).get('result_url') or '')")
  if [ -n "$u" ]; then
    curl -sL "$u" -o "$label.mp3" && echo "downloaded $label"
  else
    echo "NO_RESULT_URL $label"
  fi
done

echo "=== durations vs frame windows ==="
python3 - << 'PY'
import subprocess
win = {1:8.8,2:12.1,3:13.7,4:11.3,5:6.9,6:11.0,7:6.4,8:22.8,9:10.8,10:10.8,11:11.8,12:6.4,13:9.3}
for i in range(1,14):
    f = f"{i:02d}.mp3"
    try:
        d = float(subprocess.run(['/opt/homebrew/bin/ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip())
    except Exception:
        print(f"{f}: MISSING"); continue
    eff = d/1.05 + 0.4
    slack = win[i] + 0.5 - eff
    print(f"{f}: raw {d:.2f}s -> effective {eff:.2f}s in a {win[i]}s window  {'OK' if slack>=0 else 'OVERRUN by %.2fs'%(-slack)}")
PY
echo ARTHUR_V11_DONE