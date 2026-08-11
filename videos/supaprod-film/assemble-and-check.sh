#!/bin/bash
# v3 post-fleet pipeline: mark frames animated → assemble → transitions → checks → contact sheet.
# Stops at the contact sheet for orchestrator QA; render is a separate, deliberate step.
set -uo pipefail
cd "$(dirname "$0")"
SKILL="../../.claude/skills/product-launch-video/scripts"

python3 - <<'EOF'
import re, os
s = open('STORYBOARD.md').read()
done = {f.split('.html')[0] for f in os.listdir('compositions/frames') if f.endswith('.html') and not f.startswith('_')}
out=[]
for c in re.split(r'(?=## Frame \d+)', s):
    m = re.search(r'- src: compositions/frames/([\w-]+)\.html', c)
    if m and m.group(1) in done:
        c = c.replace('- status: outline', '- status: animated', 1)
    out.append(c)
open('STORYBOARD.md','w').write(''.join(out))
print('animated:', len(done), 'frames')
EOF

node "$SKILL/assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes . | tail -3
node "$SKILL/transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes . | tail -2
node "$SKILL/transitions.mjs" verify --storyboard ./STORYBOARD.md --index ./index.html | tail -2


# enforce the ink base ground (the cream canvas caused white flashes at every seam)
python3 -c "s=open('index.html').read();open('index.html','w').write(s.replace('background: #F2EFE9;','background: #0A0A0B;'))"

npx hyperframes lint 2>&1 | tail -6
npx hyperframes validate 2>&1 | tail -5
npx hyperframes inspect 2>&1 | tail -4
npx hyperframes snapshot --at 4.1,12.4,24.0,36.6,45.6,53.4,61.6,74.7,89.2,100.7,110.5,116.1,122.7 2>&1 | tail -3
echo "ASSEMBLY_AND_CHECKS_DONE — review snapshots/contact-sheet-*.jpg before rendering"
