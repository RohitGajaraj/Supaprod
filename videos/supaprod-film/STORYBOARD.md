---
format: 1920x1080
message: "Agents that know what to build, ship it, and guide the next call."
arc: Decide-first narrative — build-is-easy hook → worth-building tension → your-week pain → intro → loop (signals→bets→disagree→forecast→route→learn) → the warning → moat → promise → CTA
audience: "Product managers who ship with agents; YC/accelerator partners and investors on first watch"
mode: collaborative
music: "minimal cinematic pulse — restrained electronic with a warm analog undertone, slow build, quiet confident resolve, no drop"
---

## Video direction

**v3 — THE SYSTEM DEMO CUT. The product is the picture.** The founder rejected the typographic cut as "a PPT". This cut is the opposite: every frame from F4 onward is a full-bleed, dense, believable PRODUCT SCREEN being used, filmed by a cinematographer's camera. Type appears only as small cinematic overlays (kickers, lower-thirds) — never as the substance of a frame.

- **The screen kit is law.** `compositions/frames/_screen-kit.html` defines the Supaprod app shell (sidebar with the seven stations, top bar, workspace "harbor") and the component vocabulary (panels, rows, chips, scores, docs, consoles), built from the REAL product tokens in `frame.md` §"Product screen tokens". Every product frame inlines and reuses it — one app, thirteen shots of it.
- **Camera never sleeps.** Every frame runs a macro camera underneath (`multi-phase-camera`: pull-back → focus → push, plus continuous micro-drift) on a stage with real perspective. Reveals still land on VO cues, but between cues the camera is always breathing forward. Pans between regions ride `viewport-change` with `motion-blur-streak` at peak velocity. Focus pulls use `depth-of-field-blur`. NOTHING sits static on a black field, ever.
- **Palette**: ink ground `#0A0A0B`, app surfaces `#141416`/`#1A1A1D`, hairlines `#26262A`, text `#F2EFE9`/`#A8A29A`. Stage accents used AS THE PRODUCT USES THEM: discover `#6FA9A0` · decide `#C39A5E` · plan `#8FA464` · build `#6D97C2` · ship `#BD8092` · learn `#A89F66` · pass `#4FC47A` · warn `#E8B44C` · gate/brand ember `#FF6B2C`. Rich, but each screen leads with ITS station color + ember for brand moments.
- **Typography discipline (anti-PPT law)**: UI text at true UI scale (0.7–1.0cqw body, 1.2–1.6cqw panel titles) carries the content. Cinematic overlay type is RARE: a mono kicker (0.72cqw, 0.14em tracking, uppercase) + one sentence-case Mona Sans 600 line (2.2–3.2cqw max) in the lower-left third, arriving as a quiet lower-third, never centered poster type. Exceptions: F12 (the orange promise card, kept) and F13's lockup.
- **Cursor choreography**: product frames may use ONE minimal cursor (a small cream dot-arrow, `cursor-click-ripple`/`press-release-spring` on clicks) to drive the screen. Human-paced arcs, never teleporting.
- **Density is credibility**: every screen shows believable working data — the harbor/checkout story world (quotes, tickets, timestamps, authors, scores). Lists have 5+ rows; docs have paragraphs; consoles have logs. No lorem, no empty panels.
- **Negative list**: no floating boxes on empty ground, no centered poster typography (except F12), no purple-blue AI gradients, no bokeh, no browser chrome (the app IS the frame), no bounce, no front-load-then-freeze, no third-party logos (named text chips only).
- **Continuity**: one story world across all screens — the checkout drop-off bet travels F5→F6→F7→F8→F9; "redesign the app" is killed in F6 and returns in F10; the caret types the question in F3 and the URL in F13.

## Frame 1 — Anyone can build

- scene: An agent builds and ships a feature in seconds — an editor writes itself, a deploy goes green
- voiceover: "These days, anyone can build. Agents write the code — beautiful features, shipped in days."
- duration: 8.2s
- transition_in: cut
- status: animated
- src: compositions/frames/01-anyone-can-build.html
- type: hook
- persuasion: Concede the era — disarm before the turn
- beat: ease + admiration
- blueprint: compose
- sfx: light keyboard ambience, one soft deploy chime

narrativeRole: Opens agreeing with the world: building is solved. Shown as a real dev surface working alone, filmed close.
keyMessage: Building got easy.

Scene 1 (0.0–2.6s): CLOSE-UP, angled 3D perspective on a dark code editor pane (realistic: line numbers, syntax-toned mono code) — new lines type themselves in a fast agent cadence (`discrete-text-sequence`), a mono badge "agent · building" pulsing top-right; the camera drifts slowly right (`multi-phase-camera`). Lower-third overlay kicker fades in: "THE ERA" + line "anyone can build now."
Scene 2 (2.6–5.6s): camera pans right with a motion-blur streak (`viewport-change` + `motion-blur-streak`) to a deploy panel: pipeline steps ticking green (`stat-bars-and-fills`), "preview → production" progressing; on "beautiful features", three concrete artifact cards slide up in a quick stagger — "UI · checkout redesign" (a polished UI thumbnail), "API · /v2/payments" (a mono endpoint card), "feature · one-tap retry" — the era's output made specific.
Scene 3 (5.6–8.2s): on "shipped in days", the deploy status flips to a green "live" chip with a soft chime; camera eases into a slow push on the green chip; micro-drift hold, cursor blinking in the editor behind, blurred by `depth-of-field-blur`.

## Frame 2 — Worth building

- scene: A wall of shipped features over a flat adoption chart — lots built, nothing moved
- voiceover: "But nobody tells you what's worth building. Teams ship the wrong features — beautifully. That's the judgment gap."
- duration: 8.5s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02-worth-building.html
- type: pain_point
- persuasion: Negative contrast — the era's blind spot shown as data
- beat: tension
- blueprint: compose
- sfx: low sub swell on the flat line, air going out of the room

narrativeRole: The thesis shown, not told: shipping ≠ winning. A metrics surface makes the miss undeniable.
keyMessage: Deciding what to build is the part nobody solved.

Scene 1 (0.0–3.0s): a releases/changelog surface: a dense scrolling column of shipped-feature rows (names, dates, "shipped" chips) — the camera pans slowly down the list as more rows land; lower-third kicker "THE BLIND SPOT" + line "knowing what to build — that's the hard part now." with a quiet ember tint on "what to build".
Scene 2 (3.0–6.0s): camera pulls back and racks focus (`depth-of-field-blur`) to reveal, beside the list, an analytics panel: an "activation" line chart drawing itself FLAT across weeks (`svg-path-draw`) while release markers tick along the axis — polish shipping, line not moving.
Scene 3 (6.0–8.5s): on "and miss.", the chart's period-summary chip lands: "no change"; the releases column dims; slow push on the flat line; micro-drift hold.

## Frame 3 — You know the feeling

- scene: A PM's screen at 9am — threads, tickets, dashboards, a roadmap doc — piling into one unanswerable question
- voiceover: "You know the feeling. Signals everywhere — interviews, tickets, dashboards, hunches. The loudest voice wins the roadmap. And six months later, someone asks — why did we build this?"
- duration: 14.5s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/03-you-know-the-feeling.html
- type: pain_point
- persuasion: Role-play recognition — second-person storytelling
- beat: overwhelm → dread
- blueprint: compose
- sfx: notification pings accumulating (soft), murmur swell, keyboard ticks on the typed question

narrativeRole: The founder's role-play beat: the viewer's own week, shown as overlapping real work surfaces, ending on the question typed into a search bar that finds nothing.
keyMessage: You live in the scatter, and you can't answer the question it leaves behind.

Scene 1 (0.0–2.2s): over-the-shoulder wide on a desktop of overlapping app windows in 3D depth — each window titled as the real tool a PM juggles: an intercom-style support inbox ("intercom · inbox 47"), user-interview notes, a zendesk-style ticket board, an analytics dashboard, the roadmap doc — believable content in each, named in text only (no logo art); camera drifts in; on "You know the feeling", a lower-third: "MONDAY, 9:04".
Scene 2 (2.2–7.0s): as the VO names each source, the camera pans window to window (`viewport-change`, blur streaks), each surfacing to front with a soft ping: the interview notes ("I gave up at the payment step"), the intercom-style inbox (unread climbing), the ticket board (12 open), the dashboard (drop-off 41%), a hunches note. Depth-of-field keeps one window sharp at a time — the juggling made visible.
Scene 3 (7.0–10.0s): on "the loudest voice wins", a chat message slams to front in its thread — "exec: let's redesign the whole app 🚀" — pinned, reactions piling; the roadmap doc behind visibly reorders its top row to "App redesign".
Scene 4 (10.0–14.5s): the pile dims and blurs (`depth-of-field-blur`); a clean search/ask bar surfaces center-top; the caret types "why did we build this?" (`discrete-text-sequence` + `context-sensitive-cursor`), last character landing with the spoken word; camera pushes slowly INTO the bar as its result area renders "no record found"; hold on the emptiness, drifting.

## Frame 4 — Supaprod

- scene: The mark draws itself; the camera pushes through its ember core into the product's home
- voiceover: "Supaprod. One place where agents run the work — and you make the calls. Agents that know what to build, ship it, and guide the next call."
- duration: 10.8s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/04-supaprod.html
- type: product_intro
- persuasion: Category-claim name-drop → immediate product proof
- beat: relief + intrigue
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/logo-3b38dcfd.svg
- roles: logo-3b38dcfd = cutout
- asset_candidates: assets/logo-3b38dcfd.svg — white looping six-petal mark with ember ring core, the finalized Supaprod logo
- sfx: warm swell, soft chime on the core, room tone of the app opening

narrativeRole: The name lands, then the film's signature camera move: THROUGH the logo's core INTO the running product. The ratified tagline spoken over first sight of the real app.
keyMessage: Supaprod — agents run the work; you make the calls.

Adapt: keep the signature (mark assembles into lockup); extend with a push-THROUGH into the app shell — the product reveal is the payoff.
Scene 1 (0.0–2.6s): ink field; the loop mark **draws itself** (`svg-path-draw`) center as the VO says the name — and the whole mark REVOLVES slowly as it draws (the product's own loader motif: the icon turning as it completes into its circle, white on ink with the ember core); core blooms (`ambient-glow-bloom`); "supaprod" wordmark rises beneath.
Scene 2 (2.6–5.4s): on "one place", the camera pushes INTO the ember core (`zoom-through` seam, `motion-blur-streak`) — the glow fills frame and resolves into the app shell's home (Today screen): sidebar with the seven stations glowing their colors, greeting "Tuesday — 3 calls waiting", a queue of decision cards, an agent-activity feed streaming on the right.
Scene 3 (5.4–10.8s): slow cinematic pan across the home while the tagline plays; on "you make the calls", a gate chip in the queue pulses ember once; lower-third: "SUPAPROD" + "agents run the work — you make the calls."; camera settles into a gentle push, always breathing.

## Frame 5 — Signals become bets

- scene: The Discover screen clusters raw signal into ranked bets, evidence pinned
- voiceover: "Your signals pour in. It reads every one — and hands you ranked bets, evidence attached."
- duration: 7.3s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-signals-become-bets.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: curiosity → clarity
- blueprint: compose
- sfx: granular stream, three soft ticks as ranks land

narrativeRole: Layer one, on its real surface: Discover. The transformation happens inside the product's own screen.
keyMessage: Raw signal in, ranked bets out, evidence attached.

Scene 1 (0.0–2.0s): full Discover screen (discover teal accents): left rail is a PAIN-POINT INBOX — above it a connector strip of source chips feeding it: "connected sources · customer calls · interviews · support · tickets · analytics · surveys · community · sales notes" (a WIDE intake range as generic categories, chips flowing subtly into the inbox — vendor names live only in F3's pain scatter, never as product claims); header "pain points · this week · 9 customers"; rows that read like a PM's real Monday: "checkout takes too long — 4 customers", "community thread: pricing page confusion (12 replies)", ""I gave up at the payment step" — interview", "support: refund flow dead-end (3 tickets)", "activation dip flagged — analytics" — each with timestamp + source chip; camera tracks down the rail; lower-third kicker: "01 · DISCOVER".
Scene 2 (2.0–5.0s): on "reads every one", signal rows light in a fast reading sweep (`asr-keyword-glow` cascade); the main pane clusters them into three bet cards ("fix checkout drop-off" / "unify billing alerts" / "redesign onboarding") with rank chips 01/02/03 and evidence counts ("19 signals · 6 sources"); camera pans right to the ranking as it settles.
Scene 3 (5.0–7.3s): on "evidence attached", the cursor hovers bet 01 — its evidence popover opens: the quote "I gave up at the payment step" with source "interview · 04:12"; camera pushes on the popover; drift hold.

## Frame 6 — It disagrees

- scene: The Decide screen scores both bets; the exciting one loses and is moved to passed
- voiceover: "It scores each bet. And it will disagree with you — the exciting idea loses to the boring one that pays."
- duration: 8.3s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/06-it-disagrees.html
- type: feature_showcase
- persuasion: Negative contrast — the product's credibility is that it says no
- beat: surprise → trust
- blueprint: compose
- sfx: two score ticks, one decisive low thunk on the pass

narrativeRole: The character beat on the Decide surface: scoring panels, an agent's dissent note, and the kill executed in-product.
keyMessage: It has judgment of its own — and shows its scoring.

Scene 1 (0.0–2.4s): Decide screen (decide gold accents): two bet detail cards side by side — "redesign the app" (tag: the exciting one) vs "fix checkout drop-off" (tag: the boring one), each with impact/confidence/effort sub-bars; camera arcs slightly around the pair in perspective; kicker "02 · DECIDE".
Scene 2 (2.4–5.2s): on "scores each bet", the sub-bars fill and composite scores count up (`counting-dynamic-scale` small register): 4.0 vs 8.0; an agent note slides under the right card: "agent · recommends: smaller bet, direct evidence, faster payback"; camera racks focus between the two (`depth-of-field-blur`).
Scene 3 (5.2–8.3s): on "loses", the cursor drags "redesign the app" toward a Passed column — it slides over with a strike and dims (`scale-swap-transition`); the winner card advances with an ember edge; camera pushes on the winner; drift hold.

## Frame 7 — The forecast

- scene: The decision commit form — a forecast typed, sealed, locked
- voiceover: "And at the moment you commit — it writes down what you believe will happen. Before you find out."
- duration: 8.0s
- transition_in: crossfade
- status: animated
- src: compositions/frames/07-the-forecast.html
- type: feature_showcase
- persuasion: Scarcity of the artifact — this exists nowhere else
- beat: intrigue + gravity
- blueprint: compose
- sfx: quiet keys, one seal click, sparse low pad

narrativeRole: The moat as a product moment — and this surface now exists in code (Lane 1, 2026-08-11): the commit form captures the forecast triple and the trigger seals it. The film's breather — slow camera, quiet sound.
keyMessage: What you believed, written down before you found out.

Scene 1 (0.0–3.2s): the log-a-decision form over the dimmed Decide screen: fields visible — decision "Fix checkout drop-off first"; a forecast field where the caret types ""If we fix checkout first, activation rises."" (`discrete-text-sequence`); beneath it "how we'll know: activation rate" and "horizon: 30 days"; camera in a slow push, shallow focus on the typing.
Scene 2 (3.2–5.6s): on "before you find out", the cursor clicks Commit (`cursor-click-ripple`); the form condenses into a decision-record row with a sealed chip: a small lock icon draws itself (`svg-path-draw`) + mono stamp "forecast sealed · at decision time"; one soft click.
Scene 3 (5.6–8.0s): close-up hold on the sealed row (timestamp, author, immutable badge); micro-drift only; the quiet center of the film.

## Frame 8 — The route

- scene: One traveling shot across Plan, Build, Ship — the spec writes, agents build inside boundaries, the ship kit assembles — landing wide on the whole route
- voiceover: "From there, agents take it. In Plan, the spec writes itself. In Build, the work happens right inside. And Ship isn't just launch day — release notes, go-to-market, done. One platform. The whole lifecycle."
- duration: 18.2s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/08-the-route.html
- type: feature_showcase
- persuasion: Breadth proof — the lifecycle as one connected system
- beat: power + momentum
- blueprint: spatial-pan-stations (Adapt)
- sfx: pan whooshes, spec keystrokes, console ticks, checklist ticks, one wide resolve swell

narrativeRole: The film's biggest shot: three real working surfaces on one oversized canvas, one camera. The pull-wide lands "one platform".
keyMessage: The entire product lifecycle runs in one connected place.

Adapt: keep the signature (stations on one canvas, one camera); each station is a FULL screen region, and the wide reveal shows the product's spine strip connecting them.
Scene 1 (0.0–4.2s): camera on the PLAN screen (plan green): a spec editor — left TOC ("problem / approach / requirements / rollout"), main doc typing itself in realistic prose about the checkout fix (`discrete-text-sequence`), an agent chip "drafting…"; kicker "03 · PLAN".
Scene 2 (4.2–8.6s): blur-streak pan to BUILD (build blue): an agent run console — steps ticking live ("branch created ✓ · migration written ✓ · tests 214 passing"), a diff pane streaming rows, a thin ember boundary banner across the top: "boundary: no schema drops · no prod writes"; kicker "05 · BUILD".
Scene 3 (8.6–13.0s): pan to SHIP (ship rose): a release surface — "v2.4 — checkout, rebuilt" notes unfurl; beside it the GTM checklist ticks on the VO ("release notes ✓ announcement ✓ changelog ✓"); a deploy status flips live; kicker "06 · SHIP".
Scene 4 (13.0–16.0s): on "One platform.", the camera pulls back and DOLLIES fast along the full route (`viewport-change`, blur-streaked): ALL SEVEN stations flash past as quick individual camera hits — mini-screens for 01 Discover (signal rail), 02 Decide (scores), 03 Plan (the spec), 04 Design (a prototype canvas, design plum accent), 05 Build (the console), 06 Ship (the release), 07 Learn (a verdict) — each tapped for ~0.35s with its station color and number chip, the spine line drawing through them as the camera passes (`svg-path-draw`).
Scene 5 (16.0–18.2s): the camera settles WIDE on the whole connected route — seven stations, one line — and the strip completes into "signal → decision → spec → build → ship → learning"; slow drift; held breathing read.

## Frame 9 — The loop closes

- scene: The Learn screen scores the outcome against the call; Discover's ranking visibly reorders
- voiceover: "When results land, they're scored against the call that caused them — and your next bet re-ranks itself. It learns. Then it guides."
- duration: 10.8s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/09-the-loop-closes.html
- type: benefit_highlight
- persuasion: Mechanism proof — the loop shown closing in-product
- beat: awe + inevitability
- blueprint: compose
- sfx: arc shimmer, one reorder tick, low resolve note

narrativeRole: The brain on its real surfaces: Learn writes the verdict; Discover reorders. The film's mechanism crescendo.
keyMessage: The loop doesn't end in a report; it changes what you're shown next.

Scene 1 (0.0–3.0s): Learn screen (learn olive): an outcome card — "checkout fix · shipped 14 days ago" with the verdict landing: "outcome: activation ↑ · forecast: right" (pass-green tick); camera pushes in as the verdict chip stamps; kicker "07 · LEARN".
Scene 2 (3.0–5.8s): on "scored against the call", an ember thread draws (`svg-path-draw`) from the verdict backwards across the screen to the sealed decision row from F7 (its lock chip glints); the record entry gains "scored ✓".
Scene 3 (5.8–8.0s): on "re-ranks itself", cut-the-curve seam to the Discover ranking: rows swap live — "unify billing alerts" rises to 01 with a re-score animation, chips renumbering; a small toast: "ranking updated — 1 outcome applied".
Scene 4 (8.0–10.8s): on "It learns. Then it guides.", the camera pulls to show Learn and Discover as two panes of one space, the ember thread connecting them; slow push; drift hold.

## Frame 10 — It stops you

- scene: Mid-draft, the product interrupts: you've made this call before — with the record to prove it
- voiceover: "So the next time you're about to repeat a mistake, it stops you. Q3 last year — same call, shipped, missed."
- duration: 12.3s
- transition_in: crossfade
- status: animated
- src: compositions/frames/10-it-stops-you.html
- type: benefit_highlight
- persuasion: Loss aversion resolved — the system catches the repeat
- beat: startle → reassurance
- blueprint: compose
- sfx: one soft alert tone, paper-slide, low warm resolve

narrativeRole: The aha beat as a product moment: a precedent panel interrupts a new draft, citing the killed bet from F6 with its outcome.
keyMessage: Before you repeat a mistake, your own record steps in.

Scene 1 (0.0–3.0s): back on Decide: a NEW draft bet being typed — "redesign the app" (the caret typing, F6's idea returning); its score chip reads "scoring…"; camera close on the typing, shallow focus.
Scene 2 (3.0–6.4s): on "it stops you", a precedent panel slides from the right (soft alert tone): header "you've made this call before", the past decision card ("redesign the app · last year · scored 4.0 · struck"), and the linked outcome line; the camera racks focus to the panel; the draft dims slightly.
Scene 3 (6.4–9.4s): on "Here's what happened", the panel's outcome line glows word-by-word (`asr-keyword-glow`): "outcome: missed — the boring fix paid instead"; the new draft's score quietly recomputes DOWN (`counting-dynamic-scale` small); a "view the record" link pulses once.
Scene 4 (9.4–12.3s): on "guiding the next move", the panel settles to a calm ember edge; camera pulls back to show draft + precedent side by side — the product literally in the loop; drift hold.

## Frame 11 — What can't be reconstructed

- scene: The decision record close-up: artifacts on one side, the sealed belief on the other
- voiceover: "What you believed. What worked. What didn't — and why. Your shared brain, guiding the next call."
- duration: 7.2s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/11-what-cant-be-reconstructed.html
- type: benefit_highlight
- persuasion: Uniqueness claim shown as two columns of the record
- beat: gravity + inevitability
- blueprint: compose
- sfx: single deep hit under the rack focus

narrativeRole: The moat, filmed on the record itself: what's reconstructable vs what only Supaprod holds. The camera does the arguing via focus.
keyMessage: Forecasts leave no trace unless something caught them — that is the moat.

Scene 1 (0.0–2.8s): extreme close-up on a decision-record entry in perspective: left region "what happened" — artifact rows (thread refs, commits, calls, tickets) softly lit; camera slides across them; lower-third: "anyone can dig this up."
Scene 2 (2.8–5.4s): on "Supaprod keeps", a rack focus (`depth-of-field-blur`) blurs the artifacts and snaps the right region sharp: the sealed forecast row — ""If we fix checkout first, activation rises." · sealed · before the outcome" — the lock glinting ember (deep hit lands here); lower-third swaps: "the record of every call — and what you believed."
Scene 3 (5.4–7.2s): on "guides your next call", a small ember guidance chip slides onto the record row — "informs 2 upcoming decisions" — then slow push on the sealed row; everything else stays soft; drift hold.

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

narrativeRole: The one deliberate typographic moment left in the film — a 4-second orange punctuation mark between the proof and the ask.
keyMessage: The guesswork ends; the deciding begins.

Adapt: keep the signature (one clean title, one restrained move, still hold); the camera still breathes — a barely-perceptible slow push the whole 4 seconds; a fine grain texture keeps the field alive.
Scene 1 (0.0–1.6s): full fire-orange field; "you stop guessing." slides up — Mona Sans 600 sentence case at a restrained 3.4cqw, near-ink, positioned lower-left third like a film title, NOT centered poster type.
Scene 2 (1.6–4.0s): "you start deciding." joins beneath at 700; both hold as the slow push continues.

## Frame 13 — Close

- scene: The app recedes into the dark; the mark draws; the caret types the address
- voiceover: "Supaprod. Agents run the work. You make the calls — and every call makes the next one sharper."
- duration: 9.3s
- transition_in: crossfade
- status: animated
- src: compositions/frames/13-close.html
- type: cta
- persuasion: Friction reduction — a live demo, no login
- beat: motivation
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/logo-3b38dcfd.svg
- roles: logo-3b38dcfd = cutout
- asset_candidates: assets/logo-3b38dcfd.svg — white looping six-petal mark with ember ring core, the finalized Supaprod logo
- sfx: closing chime, room tone fading out

narrativeRole: One ask. The product glows faint behind the mark — the film ends on the thing it showed, not on a slide.
keyMessage: supaprod.ai — try the live demo, no login.

Adapt: keep the lockup signature; the stage is the blurred app receding, not a black void.
Scene 1 (0.0–2.6s): the app home from F4, blurred deep (`depth-of-field-blur`) and receding in perspective, station colors still readable as soft lights; the loop mark **draws itself** center (`svg-path-draw`), ember core at rest; on "Build what matters.", the three words rise beneath the mark in sentence case.
Scene 2 (2.6–5.8s): wordmark completes the lockup; the caret returns (F3's bookend) and types "supaprod.ai" in mono; camera pushes very slowly the whole time.
Scene 3 (5.8–9.3s): sub-line fades: "live demo — no login."; the blurred app lights dim first, then the film's one real exit — a gentle fade to black over the last second.
