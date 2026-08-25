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
