---
format: 1920x1080
message: "Agents that know what to build, ship it, and guide the next call."
arc: Decide-first narrative — build-is-easy hook → worth-building tension → your-week pain → intro → loop (signals→bets→disagree→forecast→route→learn) → the warning → moat → promise → CTA
audience: "Product managers who ship with agents; YC/accelerator partners and investors on first watch"
mode: collaborative
music: "minimal cinematic pulse — restrained electronic with a warm analog undertone, slow build, quiet confident resolve, no drop"
---

## Video direction

- **Palette system** (from `frame.md`): every frame runs the **dark register** — ground `ink-black`, type `cream`, accent `fire-orange` — except **Frame 12, the film's single orange-register frame** (ground `fire-orange`, type near-ink): the promise gets the palette flip. Secondary text `cream-muted`, hairlines `border-dark`. Nothing else, ever.
- **Motion grammar**: long-tail smooth settles (`power3` default) everywhere; zero bounce, zero overshoot. **Every reveal is paced to the VO** — at t=0 a frame shows only what the voice is saying; each further piece lands on its spoken cue, weighted into the back half. Aliveness during holds is **subtle jitter at most** — no breathing, no back-half pans or pushes.
- **Rhythm / held frames**: F7 (the forecast) and F12 (the promise) are the two deliberate breathers — near-still, one restrained move each. F3, F6, F8, F10 carry the kinetic weight. The film alternates busy → calm.
- **Continuity motifs**: the blinking **caret** types the dreaded question in F3 and returns to type the URL in F13. The **ranked bet list** born in F5 is re-ranked in F9. The **loop mark self-draw** introduced in F4 returns smaller in F13. The **struck exciting bet** from F6 is the past mistake cited in F10.
- **Product vignettes, not screenshots**: F5, F6, F8, F9, F10 are stylized product-truthful UI vignettes (cards, chips, hairline panels in the film's own design system) depicting real product behavior — never fake browser chrome, never invented capabilities.
- **Negative list**: no purple-blue AI gradients, no bokeh/particle fields, no browser chrome, no pointer cursors (the caret is a text caret), no stock icons, no third-party logos (tool names as mono text chips only), no bouncy eases, no lazy breathing, no slideshow (front-load-then-freeze), no screensaver (independent floaters). On-screen numbers only: scores 4.0 / 8.0, rank chips 01–03.

## Frame 1 — Anyone can build

- scene: Beautiful feature cards cascade in effortlessly — building looks easy because it is
- voiceover: "These days, anyone can build. Agents write the code — beautiful features, shipped in days."
- duration: 8.2s
- transition_in: cut
- status: animated
- src: compositions/frames/01-anyone-can-build.html
- type: hook
- persuasion: Concede the era — disarm before the turn
- beat: ease + admiration
- blueprint: kinetic-type-beats (Adapt)
- sfx: light UI ticks as cards land, airy pad

narrativeRole: Opens by agreeing with the world: building is solved. Sets the trap the whole film springs — if building is easy, why do products still miss?
keyMessage: Building got easy.

Adapt: keep the signature (the words are the motion, beats landing in sequence); pair the line with a cascade of product cards as supporting texture.
Scene 1 (0.0–2.4s): ink field; "anyone can build." lands center in h1 lowercase via **per-word staggered reveal** (`dynamic-content-sequencing`), smooth settle (Centered hero, ≥40% width).
Scene 2 (2.4–5.2s): as the VO says "agents write the code", a fan of small polished feature cards **cascades in a stagger** (`grid-card-assemble` flavor) behind and beneath the line — tilted, overlapping, effortless (layered-depth, 3 layers, cards dimmed to supporting).
Scene 3 (5.2–7.0s): on "shipped in days", a mono chip stamps beside the line: "shipped · shipped · shipped" ticking three times (`discrete-text-sequence`); held read, still.

## Frame 2 — Worth building

- scene: The word "worth" interrupts everything; the pretty cards dim and topple
- voiceover: "What nobody tells you is what's worth building. So teams polish the prettiest idea… and miss."
- duration: 8.5s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02-worth-building.html
- type: pain_point
- persuasion: Negative contrast — the era's blind spot named
- beat: tension
- blueprint: kinetic-type-beats (Reproduce)
- sfx: low sub swell on "worth", soft card-fall thud on "miss"

narrativeRole: The thesis. Building commoditized; deciding didn't. An investor hears the market gap; a layman hears plain truth.
keyMessage: Deciding what to build is the part nobody solved.

Scene 1 (0.0–3.0s): carried card texture dims to 30%; "what's worth building?" lands center in h2 via **hard-cut swap** (`discrete-text-sequence`), **keyword glow** ember on "worth" as the VO hits it.
Scene 2 (3.0–6.0s): on "polish the prettiest idea", the background cards **tilt and slide down-frame** out of relevance (`scale-swap-transition`, smooth recede) — the prettiness literally sinking.
Scene 3 (6.0–8.0s): on "and miss.", the field goes near-empty; the word "miss." stamps small and alone, lower-third; held, still.

## Frame 3 — You know the feeling

- scene: Your week: signal chips crowd in around a "you" marker until the dreaded question types itself over the pile
- voiceover: "You know the feeling. Signals everywhere — interviews, tickets, dashboards, hunches. The loudest voice wins the roadmap. And six months later, someone asks — why did we build this?"
- duration: 14.5s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/03-you-know-the-feeling.html
- type: pain_point
- persuasion: Role-play recognition — second-person storytelling
- beat: overwhelm → dread
- blueprint: overwhelm-surround (Adapt)
- sfx: accumulating soft thuds, murmur swell, keyboard ticks on the typed question

narrativeRole: The founder's role-play beat — the viewer IS the PM. Ends on the question nobody can answer, typed by the caret that will bookend the film.
keyMessage: You live in the scatter, and you can't answer the question it leaves behind.

Adapt: keep the signature (accumulation closing in from all sides on a centered subject); the subject is a "you" marker, and the climax is the typed question landing over the pile.
Scene 1 (0.0–1.8s): ink field; a small centered chip "you · product" (Centered, generous space) — on "You know the feeling", it gets a faint ember outline.
Scene 2 (1.8–5.8s): as the VO names each signal, tilted mono chips cascade in from all four edges on their spoken cues — INTERVIEWS · TICKETS · DASHBOARDS · HUNCHES — stacking 3 layers deep, crowding the "you" chip (layered-depth, density rising).
Scene 3 (5.8–8.4s): on "the loudest voice wins", one oversized chip "THE LOUDEST VOICE" slams in front of everything (`kinetic-beat-slam`, smooth register), tilted, occluding half the pile.
Scene 4 (8.4–12.0s): the pile dims 40%; a caret appears upper-center and **types on** (`discrete-text-sequence` + `context-sensitive-cursor`): "why did we build this?" — the last character landing with the spoken word; held, still.

## Frame 4 — Supaprod

- scene: The loop mark draws itself around its ember core; the wordmark completes the lockup
- voiceover: "Supaprod. One place where agents run the work — and you make the calls. Agents that know what to build, ship it, and guide the next call."
- duration: 10.8s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/04-supaprod.html
- type: product_intro
- persuasion: Category-claim name-drop
- beat: relief + intrigue
- blueprint: logo-assemble-lockup (Reproduce)
- focal: assets/logo-3b38dcfd.svg
- roles: logo-3b38dcfd = cutout
- asset_candidates: assets/logo-3b38dcfd.svg — white looping six-petal mark with ember ring core, the finalized Supaprod logo
- sfx: single warm swell, soft chime as the core blooms

narrativeRole: The name lands only after the problem has earned it. The ratified tagline spoken once, verbatim.
keyMessage: Supaprod — agents run the work; you make the calls.

Scene 1 (0.0–2.4s): from near-black, the loop mark **draws itself stroke-by-stroke** (`svg-path-draw`) dead-center as the VO says the name; the ember ring core **blooms** last (`ambient-glow-bloom`). Centered, mark ~35% of frame height.
Scene 2 (2.4–5.0s): on "agents run the work", wordmark "supaprod" reveals beneath **letter-by-letter** (`dynamic-content-sequencing`); a hairline splits beneath it and two mono tags fade in either side: "agents run the work" · "you make the calls".
Scene 3 (5.0–8.0s): the tagline fades up in lead size, cream-muted: "agents that know what to build, ship it — and guide the next call." Held lockup, still; core glow at rest.

## Frame 5 — Signals become bets

- scene: A scattered cloud of raw signal converges into three ranked bet cards, evidence attached
- voiceover: "Your signals pour in. It reads every one — and hands you ranked bets, evidence attached."
- duration: 7.3s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-signals-become-bets.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: curiosity → clarity
- blueprint: grid-card-assemble (Adapt)
- sfx: granular whoosh on convergence, three soft ticks for rank chips

narrativeRole: Layer one — the director. Chaos becomes an ordered, evidenced list; the film's first product vignette.
keyMessage: Raw signal in, ranked bets out, evidence attached.

Adapt: keep the signature (staggered cascade self-assembly into a vertical ranked list); the source is a scattered signal cloud converging, not tiles from off-frame.
Scene 1 (0.0–2.0s): a loose cloud of tiny mono fragments — quote snippets, ticket ids, metric ticks — scattered across 3 depth layers (`depth-scatter-assemble` resting state), dim, ink field.
Scene 2 (2.0–5.4s): on "reads every one", fragments stream inward and **self-assemble in a staggered cascade** into three bet cards stacking top-to-bottom right-of-center (asymmetric 60/40); mono rank chips 01 · 02 · 03 pop in sequence (`spring-pop-entrance`, smooth).
Scene 3 (5.4–8.0s): on "evidence attached", one quote line inside card 01 gets **keyword glow** and a source tag slides in beside it — "interview · 04:12"; held read, still.

## Frame 6 — It disagrees

- scene: Two bets side by side — the exciting one scores 4.0, the boring one 8.0; the exciting one is struck
- voiceover: "It scores each bet. And it will disagree with you — the exciting idea loses to the boring one that pays."
- duration: 8.3s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/06-it-disagrees.html
- type: feature_showcase
- persuasion: Negative contrast — the product's credibility is that it says no
- beat: surprise → trust
- blueprint: comparison-split (Adapt)
- sfx: two badge pops, one low kill-thunk on the strike

narrativeRole: The character beat. A tool that flatters is a toy; a system that disagrees is a colleague. The struck card returns in F10 as the past mistake.
keyMessage: It has judgment of its own — and shows its scoring.

Adapt: keep the signature (mirrored 3D book-open tilts + inner-edge badge spring-pops); extend with a third act — the losing card is struck and recedes.
Scene 1 (0.0–2.4s): two bet cards enter from opposite wings with **mirrored book-open tilts** (`split-tilt-cards`): left "redesign the app" tagged THE EXCITING ONE, right "fix checkout drop-off" tagged THE BORING ONE (split-screen, equal weight, mono tags upper-third).
Scene 2 (2.4–5.4s): on "scores each bet", inner-edge score badges **spring-pop** on each (`spring-pop-entrance`, smooth): left **4.0**, right **8.0**, each with a thin **bar fill** (`stat-bars-and-fills`) sweeping to its level.
Scene 3 (5.4–9.0s): on "loses", a clean hairline strike **draws across** the left card (`svg-path-draw`), it dims and **recedes in depth** (`scale-swap-transition`); the right card advances, ember edge-glow blooming (`ambient-glow-bloom`); held, still.

## Frame 7 — The forecast

- scene: A single sentence of belief is committed and sealed with a timestamp
- voiceover: "Then — the part nobody else has. It writes down what you believe will happen. Before you find out."
- duration: 8.0s
- transition_in: crossfade
- status: animated
- src: compositions/frames/07-the-forecast.html
- type: feature_showcase
- persuasion: Scarcity of the artifact — this exists nowhere else
- beat: intrigue + gravity
- blueprint: titlecard-reveal (Adapt)
- sfx: one soft seal click, sparse low pad

narrativeRole: Plants the moat mid-loop as a mechanism — before F11 pays it off. The film's first breather: near-still, one restrained move.
keyMessage: What you believed, written down before you found out.

Adapt: keep the signature (one clean title, ONE restrained reveal, still hold); the title is a belief statement and the payoff accent is a hairline seal.
Scene 1 (0.0–3.0s): calm ink field; the belief statement **slides up in a single crossfade** — ""If we fix checkout first, activation rises."" in quote-text weight, centered, upper-golden-third; beneath it a mono meta line: "your forecast · written before the outcome".
Scene 2 (3.0–5.4s): on "before you find out", a **hairline draws itself around** the statement (`svg-path-draw`) and a small mono chip stamps lower-right: "sealed at decision time" (soft click).
Scene 3 (5.4–8.0s): stillness — held read, **subtle jitter** only (`sine-wave-loop`, low amplitude).

## Frame 8 — The route

- scene: One camera pans a route of three working stations — the spec typing itself, the build inside boundaries, the ship kit assembling — landing wide on one platform
- voiceover: "From there, agents take it. In Plan, the spec writes itself. In Build, the work happens right inside. And Ship isn't just launch day — release notes, go-to-market, done. One platform. The whole lifecycle."
- duration: 18.2s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/08-the-route.html
- type: feature_showcase
- persuasion: Breadth proof — the lifecycle shown as one connected object
- beat: power + momentum
- blueprint: spatial-pan-stations (Adapt)
- sfx: soft pan whooshes, spec keystrokes, checklist ticks, one wide resolve swell

narrativeRole: The founder's expanded body beat — Plan, Build, Ship each shown WORKING, then the pull-back that lands "one platform, the whole lifecycle."
keyMessage: The entire product lifecycle runs in one connected place.

Adapt: keep the signature (pre-placed labeled stations on one oversized canvas, one virtual camera traversing); each station is a live working vignette, and the landing is a wide reveal of the connected route.
Scene 1 (0.0–2.2s): oversized horizontal canvas, a thin route line threading three station cards; camera (`viewport-change`) opens on **PLAN** — inside its card a spec document **types itself line by line** (`discrete-text-sequence`): title, then "requirements —", ticking bullets.
Scene 2 (2.2–5.0s): on "In Build", **lateral pan** at matched velocity (`motion-blur-streak`) to **BUILD** — a diff card with green/red mono rows appearing in a stagger, framed by a thin boundary outline labeled "your boundaries" in mono.
Scene 3 (5.0–8.6s): on "Ship isn't just launch day", pan to **SHIP** — a release-notes card unfurls its lines, then a go-to-market checklist beside it **ticks item by item** (`stat-bars-and-fills` flavor) on the VO's "release notes, go-to-market, done."
Scene 4 (8.6–11.0s): on "One platform.", the camera **pulls wide** (`multi-phase-camera`, single move) — all three stations visible on the one route line, connected; the route line **draws through** them (`svg-path-draw`).
Scene 5 (11.0–13.0s): mono line stamps beneath the route on "the whole lifecycle": "signal → decision → spec → build → ship → learning"; held wide, still.

## Frame 9 — The loop closes

- scene: A shipped outcome arcs back to the decision that caused it; the bet ranking visibly reorders
- voiceover: "When results land, they're scored against the call that caused them — and your next bet re-ranks itself. It learns. Then it guides."
- duration: 10.8s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/09-the-loop-closes.html
- type: benefit_highlight
- persuasion: Mechanism proof — the loop shown closing, not claimed
- beat: awe + inevitability
- blueprint: compose
- sfx: arc-draw shimmer, one reorder tick, low resolve note

narrativeRole: The brain begins. Authored as a motion diagram because compounding happens across weeks and no screen could show it honestly.
keyMessage: The loop doesn't end in a report; it changes what you're shown next.

Compose: the loop-closing diagram, built from the vocabulary, reveals strictly on VO cues.
Scene 1 (0.0–2.6s): ink field; right-of-center, a shipped card ("shipped · checkout fix"); on "results land", an outcome chip drops onto it (`spring-pop-entrance`, smooth) — asymmetric 60/40, 3 depth layers.
Scene 2 (2.6–5.4s): on "scored against the call that caused them", an ember **arc draws itself** (`svg-path-draw`) leftward from the outcome back to a small decision card — the loop line made visible.
Scene 3 (5.4–7.6s): on "re-ranks itself", a velocity-matched **cut-the-curve** seam (cut-catalog) to the ranked list from F5: two rows **swap positions on smooth arcs** (`scale-swap-transition`), rank chips renumbering with one tick.
Scene 4 (7.6–10.0s): on "It learns. Then it guides.", two mono words stamp beneath the list on their cues — "learns" then "guides" — each with **keyword glow**; held read, still.

## Frame 10 — It stops you

- scene: Mid-decision, a warning slides in: you made this call before — and here is what happened
- voiceover: "So the next time you're about to repeat a mistake, it stops you. You made this call last year. Here's what happened. Your own record, guiding the next move."
- duration: 12.3s
- transition_in: crossfade
- status: animated
- src: compositions/frames/10-it-stops-you.html
- type: benefit_highlight
- persuasion: Loss aversion resolved — the system catches you before the repeat
- beat: startle → reassurance
- blueprint: compose
- sfx: one alert tone (soft, not alarming), paper-slide, low warm resolve

narrativeRole: The founder's aha beat and the film's emotional peak of usefulness: the brain speaking up at the exact moment it matters, citing your own past call.
keyMessage: Before you repeat a mistake, your own history steps in.

Compose: a product vignette of intervention — the draft, the interruption, the past record.
Scene 1 (0.0–2.6s): a new draft decision card sits center, being written — its title types on: "redesign the app" (`discrete-text-sequence`) — the same idea F6 struck, returning (continuity).
Scene 2 (2.6–5.6s): on "it stops you", an ember-edged warning card **slides in from the right** and settles beside the draft (`spring-pop-entrance`, smooth): mono header "you've made this call before", body "last year · similar bet", and a struck mini-card thumbnail of F6's exciting bet (asymmetric 55/45).
Scene 3 (5.6–8.0s): on "Here's what happened", a line inside the warning gets **keyword glow**: "outcome: missed — the boring fix paid instead"; the draft card's score chip quietly re-scores downward (`counting-dynamic-scale`, small register).
Scene 4 (8.0–10.0s): on "guiding the next move", the warning card's edge glow settles to a calm ember; both cards hold; **subtle jitter** only.

## Frame 11 — What can't be reconstructed

- scene: Two lines of type argue; the second lands harder and holds
- voiceover: "Anyone can dig up what happened. Only Supaprod keeps what you believed — before you found out."
- duration: 7.2s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/11-what-cant-be-reconstructed.html
- type: benefit_highlight
- persuasion: Uniqueness claim stated as physics, not marketing
- beat: gravity + inevitability
- blueprint: kinetic-type-beats (Reproduce)
- sfx: single deep hit under the second line

narrativeRole: The moat, in the exact narrowed form the market read ratified. An investor hears defensibility; a layman hears a plain true sentence.
keyMessage: Forecasts leave no trace unless something caught them — that is the moat.

Scene 1 (0.0–2.8s): "anyone can dig up what happened." lands center in h3 via **per-word staggered reveal**, settles, dims to muted (Centered, single column).
Scene 2 (2.8–6.2s): **hard-cut swap** to the counter-line in h2, larger: "only supaprod keeps what you believed — before you found out." — per-word reveal paced to the VO, **keyword glow** ember on "believed"; the deep hit lands with "only".
Scene 3 (6.2–8.0s): held read, **subtle jitter** only.

## Frame 12 — The promise

- scene: Six words on a fire-orange field — the film's single palette flip
- voiceover: "You stop guessing. You start deciding."
- duration: 4.0s
- transition_in: crossfade
- status: animated
- src: compositions/frames/12-the-promise.html
- type: branding
- persuasion: Identity shift — sells who you become
- beat: aspiration
- blueprint: titlecard-reveal (Adapt)
- sfx: one warm swell

narrativeRole: The promise in plain human words — no slogan-speak. The only orange-register frame in the film.
keyMessage: The guesswork ends; the deciding begins.

Adapt: keep the signature (one clean title, one restrained move, still hold); the register flips to orange — the move is the two half-lines arriving on their spoken cues.
Scene 1 (0.0–1.8s): full **fire-orange field** (the film's one register flip); "you stop guessing." **slides up in a single crossfade**, display lowercase, near-ink, dead-center.
Scene 2 (1.8–5.0s): on its cue, "you start deciding." joins beneath at heavier weight; both hold dead-center, completely still — the stillness against the orange is the beat.

## Frame 13 — Close

- scene: Back to ink; the loop mark draws itself; the caret returns to type the address
- voiceover: "Supaprod. Build what matters. The demo is live at supaprod dot ai — no login needed."
- duration: 9.3s
- transition_in: crossfade
- status: animated
- src: compositions/frames/13-close.html
- type: cta
- persuasion: Friction reduction — a live demo, no login
- beat: motivation
- blueprint: logo-assemble-lockup (Reproduce)
- focal: assets/logo-3b38dcfd.svg
- roles: logo-3b38dcfd = cutout
- asset_candidates: assets/logo-3b38dcfd.svg — white looping six-petal mark with ember ring core, the finalized Supaprod logo
- sfx: closing chime, room tone fading out

narrativeRole: One ask only. The demo link is the strongest close because it is true and instant. The caret bookends F3's typed question.
keyMessage: supaprod.ai — try the live demo, no login.

Scene 1 (0.0–2.4s): ink field; the loop mark **draws itself on** (`svg-path-draw`) center, smaller than F4 — the signature returning; ember core at rest; on "Build what matters.", the three words stamp beneath in lead size on their cue.
Scene 2 (2.4–5.4s): wordmark completes the lockup; the caret returns and **types on** (`discrete-text-sequence` + `context-sensitive-cursor`): "supaprod.ai" in mono.
Scene 3 (5.4–8.0s): a muted sub-line fades on its cue: "live demo — no login."; hold; final frame owns the film's one real exit — a gentle fade to black.
