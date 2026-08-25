# Supa character exploration — 2026-08-25

Visual identity concepts for Supa, the agent character: the logo come alive. All images
generated with Higgsfield (Nano Banana Pro, 2k, 1:1, dark ground). The state sheet and app
icon use `concept-a-loop-sprite.png` as their image reference for consistency.

Palette across all variants: azure into violet into ember, over near black. Ember stays at
the core (logo family); azure leads the line work (product agent color). Eyes follow the
product's geometric eye language: two simple marks, no mouth (concepts B and C drift from
this — noted below).

## Concepts (compare side by side)

### concept-a-loop-sprite.png — RECOMMENDED
**Idea:** The logo itself is the body. One continuous line, seven interlaced loops, the ember
core floating at center carrying the two-eye face. Closest to "the logo come alive."

Prompt: character design of a tiny luminous sprite whose entire body is one continuous glowing ribbon of light curling into seven overlapping loops like a stylized knot flower, the line flows azure blue into violet into warm ember orange, at the very center of the knot it protects a small glowing ember orange core like a tiny sun, two simple minimal white oval eyes glow near the core giving it a calm friendly face, deep near black background, soft ambient glow, iridescent light trails, premium playful mascot, full body neutral floating pose, centered composition, clean unique silhouette, not a robot, not humanoid

### concept-b-comet-ribbon.png
**Idea:** A wisp with a rounded azure head hugging the ember spark like a lantern, its tail
looping behind it and fading azure to violet to ember. Most character-like and animatable,
but the head-and-body reads closer to a generic spirit mascot and the knot is only implied.

Prompt: character design of a small floating wisp creature with a compact rounded head of azure light and a long flowing ribbon tail that loops exactly seven times behind it like elegant handwriting in the air, the ribbon fades from azure into violet into ember orange at the tip, the creature hugs a tiny glowing ember orange spark against its chest like a lantern, two simple minimal white eyes, deep near black background, soft glow, iridescent, premium playful mascot, full body neutral pose, centered, clean silhouette, not a robot, not humanoid

### concept-c-petal-guardian.png
**Idea:** The loops as flower petals around an ember core face, trailing a stem of light —
a balloon-flower spirit. Sweet and legible, but the crescent eyes and smile break the
product's minimal two-eye language, and it reads more flower than knot.

Prompt: character design of a small radiant flower spirit whose seven glowing petals are made of one continuous looping line of light, petals shimmer azure blue through violet with warm ember orange tips, at the center of the bloom sits a softly glowing ember orange core with two simple minimal white eyes forming a gentle face, a thin trailing light line beneath like a stem of light, deep near black background, soft glow, iridescent, premium playful mascot, full body neutral pose, centered, unique silhouette, not a robot, not humanoid

### concept-d-orbit-weaver.png
**Idea:** An ember core with eyes inside seven orbiting ribbon rings. Handsome render, but
the silhouette collapses into a generic atom mark — least unique of the four.

Prompt: character design of a tiny cosmic being that is a glowing ember orange core with two simple minimal white eyes, surrounded by seven thin luminous ribbon loops orbiting it at playful tilted angles like a hand drawn gyroscope, the orbit lines glow azure blue into violet with hints of ember, faint sparkles along the ribbons, deep near black background, soft glow, iridescent, premium playful mascot, full body neutral pose, centered, unique silhouette, not a robot, not humanoid

## Applications of concept A

### concept-a-state-sheet.png
**Idea:** Four states in one sheet — Awake (eyes open), Thinking (eyes up), Working (eyes
down, loops tightened), Celebrating (eyes closed happy, loops flared, sparkles). Matches the
product's eye-posture states. The model added its own clean labels despite "no text" in the
prompt; they happen to be correct. Working's downcast eyes read slightly stern at full size —
worth softening if this pose ships.

Prompt: using the reference character exactly, a character state sheet showing the same tiny luminous knot sprite made of one continuous looping line in four poses arranged in a two by two grid on a deep near black background, top left awake with both white oval eyes open bright and loops relaxed, top right thinking with eyes looking upward and loops drifting slightly apart, bottom left working with eyes looking downward focused and loops pulled tight and compact, bottom right celebrating with loops flared wide open and tiny sparkles around, keep the exact same colors of azure blue into violet into warm ember orange, same glowing ember orange core with the face, soft glow, clean grid layout, no text

### app-icon-knot-curl.png
**Idea:** The character curled into the logo's knot silhouette on a rounded-square icon —
azure into violet into ember sweep, eyes glowing at the dark core. Reads at tiny sizes.

Prompt: app icon design, the same tiny luminous sprite from the reference curled tightly into a perfect seven loop knot flower silhouette seen straight on, one single continuous line flowing azure blue into violet into warm ember orange, its two simple white oval eyes glowing softly on the small ember orange core at the exact center, centered inside a rounded square app icon with a deep near black background, crisp symmetrical composition, soft glow, premium minimal, unique silhouette readable at tiny sizes, no text

## Run notes

- 2026-08-25, Higgsfield CLI, model `nano_banana_2` (serves Nano Banana Pro), 454 credits at start.
- Concepts C and D failed on the first attempt with empty output: the machine's disk hit
  0 bytes free while four jobs ran in parallel. Both were re-run once, serially, and
  succeeded. No other failures; no fallback tool was needed.
- Loop counts are approximate: the model renders 7 to 8 loops depending on the run. A
  production vector pass should redraw the line to exactly seven.
- Not committed to git (screenshots/design references stay out of commits by default).

## v2 — the founder's feedback round (2026-08-25 15:4x IST)

Brief: all-positive expressions (happy-working, never angry), Thinking with visible motion
("moving through the highs" — orbiting spark trails), the Celebrating jitter kept, body anchored
tighter on the real mark (reference: public/apple-touch-icon.png; vector truth
public/favicon-adaptive.svg), and the SAME sheet proven on both grounds the way the logo itself
flips (white line on dark, ink on light, ember core constant).

| File | Idea | Note |
| --- | --- | --- |
| v2-state-sheet-dark.png | Four states (Awake, Thinking, Happy-Working, Celebrating) on dark — azure-iridescent line, ember face | Verified 2048x2048, intact |
| v2-state-sheet-light.png | The same four states pose-for-pose on near-white — deep ink/azure-violet line, ember constant | The light-theme proof the founder asked for |
| v2-hero.png | Single character, neutral-friendly, dark ground | Verified intact |

The generating agent was lost to a network drop after saving all three files; its exact prompt
strings went with its transcript. The brief above is the faithful record; the files are the
evidence. (Files prefixed free- belong to the parallel no-logo-constraint track and are
catalogued by that agent.)

---

# Free track — logo-independent concepts (2026-08-25, second session)

Divergent exploration, explicitly freed from the knot logo. Same tooling (Higgsfield CLI,
`nano_banana_2` / Nano Banana Pro, 2k, 1:1, dark ground), run serially per the disk
constraint. All files prefixed `free-`; nothing from the logo-anchored track was touched.

### free-d-all-the-hats.png — RECOMMENDED (free track)
**Idea:** A tiny glowing creature proudly wearing all seven hats at once — one worker
fronting a whole crew, and each hat can mean a station (hard hat = build, detective cap =
evidence, captain = ship, party = learn/celebrate). Product people say "I wear all the hats"
unprompted; this is that sentence as a character.

Prompt: character design of a tiny round jelly bean creature beaming with pride while wearing seven different hats stacked impossibly high on its head like a wobbly tower, the stack includes a yellow hard hat a white chef hat a detective cap a painter beret a captains hat a wizard hat and a tiny party hat at the very top, the little body glows soft iridescent blue violet with warm peach highlights, stubby little arms spread slightly in a welcoming pose, two simple dark oval eyes and a big delighted smile with rosy cheeks, deep near black background, soft ambient glow, premium playful mascot, full body neutral friendly standing pose, centered composition, clean unique silhouette readable at tiny sizes, funny and charming, no text

### free-a-seven-hands.png
**Idea:** A radial plush sun-creature with seven iridescent mitten hands, each a different
color, several holding tiny tools — seven stations, many hands, clearly not an octopus and
not a cat. The most distinct silhouette of the four at 24px (circle plus seven nubs reads
like an asterisk).

Prompt: character design of a small round radiant creature like a friendly plush star, one soft glowing round body at the center with seven stubby mitten hands radiating out evenly around it like rays of an asterisk or a snowflake, each hand shimmers a different iridescent color of the spectrum, a few hands hold tiny tools like a pencil a wrench a paintbrush a magnifying glass and a little flag, calm happy face with two simple dark oval eyes and a tiny content smile, deep near black background, soft ambient glow, iridescent, premium playful mascot, full body neutral pose, centered composition, clean unique silhouette readable at tiny sizes, clearly radial and symmetrical, not an octopus, not a cat, not a robot, no tentacles, no text

### free-b-forecaster.png
**Idea:** A cloud creature whose glass belly is a little snow globe showing the weather it
believes is coming, weather-vane antenna on top, pencil ready to write the prediction down —
the forecast-then-grade loop as anatomy. Sweetest of the four; weakest tiny-size silhouette
(round blob).

Prompt: character design of a tiny soft cloud creature whose round belly is a clear glass dome like a little snow globe, inside the dome swirls a miniature glowing weather scene with a tiny sun and tiny sparkling rain showing what it believes will happen next, a small golden weather vane arrow sits on top of its head like a charming antenna, rosy blushing cheeks and two simple dark oval eyes with a gentle proud smile, it holds a tiny pencil in one stubby paw ready to write down its prediction, iridescent pastel glow of blue violet and warm gold, deep near black background, soft ambient glow, premium playful mascot, full body neutral friendly pose, centered composition, clean unique silhouette, funny and endearing, no text

### free-c-courier.png
**Idea:** A tiny courier mid-stride hoisting a glowing parcel bigger than itself, satchel
and soft cap, trailing a light ribbon dotted with seven station beads — the work walking all
seven stations end to end. Most animatable; the model added a circular vignette frame
worth cropping out if this ships.

Prompt: character design of a tiny determined courier sprite with a small round glowing body and short little legs mid stride, proudly carrying a glowing luminous parcel box bigger than itself high above its head with both stubby arms, wearing a tiny messenger satchel strap and a small soft cap, behind it trails a flowing ribbon of light dotted with seven small glowing beads like stations along a delivery route, big simple white eyes full of joyful determination and a happy open smile, iridescent blue violet and warm orange glow, deep near black background, soft ambient glow, premium playful mascot, full body pose, centered composition, clean unique silhouette readable at tiny sizes, adorable and heroic, no text

### free-best-state-sheet.png
**Idea:** Four states of the hat-stack concept in one sheet — Awake (stack straight),
Thinking (stack leans, spark trails and an idea bulb orbit), Happy-Working (pencil out, hats
tipped forward with effort), Celebrating (jumping, all seven hats popped off midair with
confetti). Character consistency held across all four. Thinking reads pensive rather than
sad, but its eyes are slightly watery and the mouth is a wavy line — soften both if this
pose ships.

Prompt: using the reference character exactly, a character state sheet of the same tiny glowing round creature wearing its tall stack of seven hats, four poses arranged in a two by two grid on a deep near black background, top left awake standing calm and bright with the hat stack perfectly straight and both eyes open wide with a small smile, top right thinking with eyes looking upward while the hat stack leans playfully and little spark trails and glowing idea sparkles orbit its head as if it is moving through ideas, bottom left happy working with delighted focused eyes and a big content smile holding a tiny glowing pencil in one stubby arm while the hat stack tilts forward with cheerful effort, bottom right celebrating mid jump with joyful motion lines and confetti sparkles while all seven hats pop slightly up off its head in midair, keep the exact same soft iridescent blue violet glowing body with rosy cheeks and the exact same seven hats in the same order, premium playful mascot, clean grid layout, no text

## Run notes (free track)

- 2026-08-25 second session, 436 credits at start. Five generations, all serial, all
  succeeded on the first attempt, no disk incidents (2.2Gi free after run).
- The state sheet used `free-d-all-the-hats.png` as its image reference; the seven-hat
  order survived the reference pass.
- `free-d` renders exactly seven hats: hard hat, chef toque, detective cap, beret,
  captain, wizard, party. `free-a` renders exactly seven mittens. Verified by eye at full
  size; a production vector pass should pin both counts.
- Not committed to git (design references stay out of commits by default).

## VERDICT on the free family — REJECTED by the founder, 2026-08-25 16:0x IST

All five free-* files rejected in his words: "looks like a kid's platform or some childish show
or some cookery show — I do not resonate with it." The register is ENTERPRISE PREMIUM
(Anthropic/Linear/Vercel): abstract, minimal, personality through material, light and eye
geometry — never costumes, props, or mascot cuteness. The approved direction remains the
v2 line-being (the logo alive); v3 iterates it under the corrected register. Files stay on disk
as the record of what was explored and declined.
