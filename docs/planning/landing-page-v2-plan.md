# Landing Page v2 — strategy + implementation plan

> _Created: 2026-07-14 · Status: **SHIPPED 2026-07-15** (landing v2 live in code on main; the visual direction in sections 4-5 is SUPERSEDED by the applied record [`design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md`](../../design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md); this plan remains the record of strategy, claims law, and GTM wiring)._
>
> **What this is:** the full rethink of the public landing page (`src/routes/index.tsx`), grounded in a five-stream research pass run 2026-07-14: a section-by-section audit of the current page, the positioning canon extracted from the Pitch Room, live competitive intelligence on Samepage Signals and BriefHQ, a benchmark study of Linear / Cursor / Vercel / Raycast / Clay / Braintrust / Resend / Perplexity, and a brand-asset + design-system inventory. GTM ground truth (what actually exists vs the sprint calendar) is documented separately in [`../Growth Strategy/07-gtm-ground-truth-2026-07-14.md`](../Growth%20Strategy/07-gtm-ground-truth-2026-07-14.md).
>
> **Naming note (founder, 2026-07-14):** "Cadence" is the working name; a rename may land within days. Every headline below is written to survive a rename (the name appears at most once per section and never carries the meaning). The CadenceMark is the placeholder logo; §4.2 covers its enhanced treatment.
>
> **Copy rule for this whole document:** everything inside a copy block is proposed page copy and obeys the humanized-output law (no em/en dashes, no banned words, numbers over adjectives). Nothing ships without founder approval.

---

## 0. The diagnosis in five lines

1. The current page is **9 to 11 viewports** across 14 sections; the six-station loop is explained three full times and "memory compounds" three times. Roughly 40% of the scroll is repetition.
2. It never says in one plain sentence **who it is for and what you do with it**; jargon ships unexplained ("D+14", bare "(Mosseri)" citations, "Tear down your pet feature" as an unexplained hero CTA).
3. It is **not investor-safe**: fabricated-looking numbers (48 calls, 92% validated, a rising "decision accuracy" chart marked only by a tiny "Illustrative" footnote) sit next to the page's single piece of real proof (a live `/d/` decision link). An investor who spots the fake discounts the real.
4. It is **invisible to crawlers**: `ssr:false` means search engines and AI engines see an empty body. For a product whose GEO story matters, this is the single biggest technical defect.
5. The good news: the **walkthrough family** (the failure-and-recovery flow, the typing terminal, the orbit ring) is genuinely excellent craft, the exact "watch the system think" pattern the founder wants kept. v2 keeps that DNA and rebuilds everything around it.

---

## 0.5 Founder review notes (2026-07-14) and how v2 resolves each

The founder reviewed the current page and the first draft of this plan live. Each concern below is resolved at the root, not patched:

| Founder concern                                                                                                                                  | Root cause                                                                                                                                                                                                                                                                   | v2 resolution                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Cursor line is hooky but caps us at "deciding what to build"; we OWN more than the decision                                                  | The old line names only the decide step; the product runs the whole loop                                                                                                                                                                                                     | New hero H1 extends the hook to the full claim: "the rest of the product" (§3 beat 1). The decide step is the wedge, the loop is the product; the headline now says the bigger thing                                                                                                                                                                                      |
| The sub-line ("agents do the product work end to end, you make the calls, the ledger proves what worked") is not good; needs a different message | It is a compressed slogan trilogy, not a picture; it tells three abstractions in a row                                                                                                                                                                                       | Replaced with a concrete single-journey sentence: a signal travels to shipped code and comes back graded (§3 beat 1)                                                                                                                                                                                                                                                      |
| The color combination is not good; the solar red reads badly                                                                                     | Diagnosed in §4.1b: two accents fighting (legacy violet + ember), ember used AMBIENTLY (glows, washes, shimmer, gradient morphs) at full saturation over near-black, which optically vibrates and reads alarm-neon. The accent is not the problem; its quantity and role are | The "ink and metal" palette (§4.1b): graphite/silver carries everything, ember demoted to a precise human-action signal (one CTA, one gate moment per viewport, never ambient), gold only in the mark core, zero glows/washes/gradient morphs. If ember still displeases after discipline, the accent change routes through the brand revisit, not an ad-hoc landing swap |
| The two-box "AI feature vs AI operating system" section looks like AI-slop design                                                                | Side-by-side comparison cards are a 2026 template tell; the contrast is asserted, not experienced                                                                                                                                                                            | The contrast becomes EXPERIENTIAL: a third walkthrough tab, "With a copilot," plays the same signal and dead-ends at "draft ready, waiting for you" with the remaining stations grayed out (§3 beat 3). Beat 2 becomes pure typographic narrative, zero boxes                                                                                                             |
| The moat section ("the brain that compounds / decision layer / outcome memory / compounding edge") messaging is not good                         | Abstract noun-labels in auto-cycling tabs; telling, not showing                                                                                                                                                                                                              | Killed as labels. Compounding is now SHOWN with the real, shipped precedent-citation UI (PC-16): the same bet arriving months apart, the second time carrying "similar call, right 3 of 4 times" on the card (§3 beat 5)                                                                                                                                                  |
| "Building used to be the hard part" section reads like an essay page, not a product page; needs flow, components, animation                      | Text-only sections with bullet points; length substituting for design                                                                                                                                                                                                        | That section is cut. New hard rule (§4.4): no beat carries more than ~60 words of body copy, and every beat pairs its claim with a rendered component in the same viewport. The page shows first and captions second                                                                                                                                                      |

---

## 1. Strategy

### 1.1 The one story the page tells

**Engineers got agents. The person deciding what they build got a chatbot. Supaprod closes that gap, and proves it with receipts.**

Everything on the page serves this arc: envy (engineering got Cursor), the gap (product decisions are the bottleneck and the reasoning evaporates), the answer (governed agents run the loop end to end, you hold the gate), the proof (a ledger of real decisions, real outcomes, real misses), the ask (join the beta, bring a bet).

The thesis underneath, from the one-pager and used as the page's emotional spine: **everyone sells capability, we sell accountability.** "Agents do the work. You answer for it. Supaprod is how you answer."

### 1.2 Differentiation posture (Samepage Signals, BriefHQ, the field)

Never name them. Own the vocabulary they cannot use.

| Them (verified from their live sites, Jul 2026)                                                            | The gap we exploit                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Samepage Signals** — "Your second brain for Product Management." Push-not-pull signal feed. $4.85M seed. | Signals in, nothing out. It surfaces; the human still does the entire loop. No outcome memory, no audit trail, nothing adversarial. |
| **BriefHQ** — "AI Ships. Brief Navigates." A Product Graph feeding context to Cursor/Claude Code via MCP.  | It navigates agents it does not command. No gates, no governance, no outcome recorded back. The loop is open at both ends.          |
| **Productboard Spark / airfocus / ChatPRD** — insight agents, alignment platforms, doc copilots.           | All stop at the artifact. Nobody grades the call against what shipped.                                                              |

The saturated words to avoid because the field owns them: _signals, second brain, context, alignment, intelligence, navigate, copilot_. The words we own because nobody else can say them truthfully: **loop, receipts, outcomes, gate, ledger, governed execution**.

The differentiation section (§3, beat 5) draws this contrast structurally, unnamed: "second brains surface, context layers brief, copilots draft. Nobody closes the loop." Every reader who has seen those products knows exactly who we mean; nobody can accuse us of punching.

One market-context line is all the sizing the page carries (the thesis line "deciding what to build is the scarce work now"). TAM/SAM, funding narrative, and competitor names stay in the Pitch Room where they belong. Investors get proof on the page and the memo in the deck.

### 1.3 The stakeholder matrix (every element earns its place by serving one of these)

| Stakeholder                                                                                        | What they need in 60 seconds                                       | Page elements that serve them                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The accountable PM** (wedge ICP: senior/founding PM, product engineer running the whole loop)    | "Does this take work off me without taking the call away from me?" | Hero one-liner; the loop walkthrough with the human gate visible; the teardown hook ("bring a bet"); plain pricing link                                                                                           |
| **The engineer-skeptic** (checks every claim; decides whether the PM's enthusiasm survives)        | "Is this real or a wrapper?"                                       | The failure-and-recovery tab (we show it breaking); real artifact links (live decision record, live teardown, `/proof` ledger); the "built part of itself" PR receipt; machine view (`M` key), llms.txt, A2A card |
| **The investor** (60-second diligence scan)                                                        | Team is real, product is live, numbers are honest, wedge is sharp  | The identity line (memo-ready); live DB counters with a pull date; the honesty card (zero external users, stated, framed as "you're early"); dated shipping log from `/updates`; founder link in footer           |
| **The AI crawler** (GEO: what ChatGPT/Perplexity say when asked "best AI tools for product teams") | Checkable facts, dense and structured                              | SSR-rendered factual copy; schema.org markup; llms.txt alignment; the machine-readable page variant; claim-tagged numbers                                                                                         |

### 1.4 Conversion strategy: one primary ask, one escape hatch, one hook

The current page splits its primary CTA (hero asks for a teardown, closer asks "Start free"). v2 fixes this to a single conversion spine:

- **Primary CTA everywhere: "Join the beta"** — the waitlist, with the GTM plan's teardown hook: joining offers one optional field, _"the product bet you're least sure about"_; the first 100 get it red-teamed by the Critic personally; sharing your link moves you up the queue. This is the self-qualifying mechanic from the launch manual (idea #1), it feeds design-partner pipeline, and every submission is a discovery data point. It does not exist in code yet; the build spec is §7.1.
- **Secondary CTA: "Watch a real run"** — anchors to the walkthrough section, then offers `/demo` (live, read-only, real workspace, already shipped). Zero-friction proof path for skeptics and investors.
- **The hook, placed inside the page (not the hero CTA): the public teardown.** `/p/teardown` already lets a stranger paste a bet and get a real Critic teardown with no signup. The walkthrough section ends with "Run one on your own roadmap" pointing at it. This is the single most differentiating interactive object we own (nothing in the field is adversarial), and it is already wired.

Why the waitlist beats "Start free" as the primary right now: signup is live but the beta needs pacing (v13 stage ladder), the teardown hook self-qualifies buyers from tourists, and scarcity framing ("first 100") is honest because it is literally true. When G-BETA passes and we want direct signup, the CTA flips with one string change; the section architecture doesn't move.

### 1.5 Claims discipline (binding, from the Pitch Room)

- Only **[PROVEN]** claims appear in present tense. The live numbers strip re-pulls from the DB at render (SSR) so the page can never quote a stale count.
- **[WIRING]** never speaks in present tense anywhere on the page. "Supaprod runs on Supaprod" stays OFF the page until it demonstrably runs; the "built part of itself" PR is the provable version and links to the real merge.
- Zero fabricated numbers. The mock ledger rows in the walkthrough are visually labeled as a replay; the proof section carries only real, dated, linked artifacts.
- The honest zero: external users today are stated plainly and framed as the offer ("you're early"), consistent with the one-pager's "honest state" doctrine.
- Banned vocabulary enforced in review: no em/en dashes, no _seamless / empower / supercharge / unlock / revolutionize / game-changing / AI-powered platform_, no "not just X but Y", no "AI PM tool" ever, cite artifacts never gurus, no adjective doing a number's job.

---

## 2. Information architecture: 6 beats, ~5 viewports

Current: 14 sections, 9-11 viewports. Target: **6 beats plus footer, roughly 5 viewports on a 1440x900 laptop.** The compression comes from the benchmark study's two strongest levers: the workflow-spine structure (the page's sections ARE the product's loop, so 5 sections do the work of 15) and interactivity replacing stacking (tabs absorb what would otherwise be 4 sections of scroll).

| #   | Beat                      | Job                                                                            | Viewport budget | Fate of current sections                                                                                                                         |
| --- | ------------------------- | ------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Hero**                  | Identity in 3 seconds + the product moving                                     | 1.0             | HeroSection reworked; TerminalCard kept, upgraded                                                                                                |
| 2   | **The gap**               | Problem stated in three typographic lines, zero boxes                          | 0.4             | ManifestoStrip absorbed; ContrastSection's boxes killed (the contrast moves into beat 3 as the copilot tab)                                      |
| 3   | **The loop, running**     | The crown-jewel walkthrough: full loop, the copilot dead-end, failure recovery | 1.2             | OrbitSection + StationsSection + AgentInActionSection merged into ONE tabbed section; ContrastSection's content becomes the `With a copilot` tab |
| 4   | **Receipts**              | Investor beat: live numbers, real artifacts, the honesty card                  | 0.9             | LedgerSection reworked: fake stats out, live data + real links in                                                                                |
| 5   | **Where the field stops** | Unnamed differentiation                                                        | 0.6             | New (replaces MoatSection's auto-cycling tabs + GuerrillaSection)                                                                                |
| 6   | **Trust + close**         | Data-trust promises condensed + the one CTA                                    | 0.8             | TrustSection condensed and relocated + CtaSection                                                                                                |
| —   | **Footer**                | Credibility sitemap: Security, Proof, ARD, Updates, Privacy, Terms, founder    | —               | Kept, promoted (investor diligence surface)                                                                                                      |

**Cut entirely:** StatsStrip (architecture facts dressed as traction), MultiProductStrip (surname citations, insider math), BrandMomentSection (a full viewport of decoration before the CTA; the brand moment moves INTO the hero mark treatment), GuerrillaSection (third telling of "compounds"), MoatSection's auto-cycling tab machinery (its one great quote survives in beat 5).

**Kept and promoted:** the walkthrough family (FlowList step-timeline with the failure tab, TerminalCard char-typer, MockDecisionCard/MockLiveRun with their shared-clock rAF craft), the ContrastSection two-card frame, the TrustSection promise table (condensed), the ember scroll-progress bar, the reduced-motion kill switch, the MachineViewToggle + llms.txt layer, the real `/d/` link pattern.

---

## 3. The copy deck (draft, for founder approval)

Every line below is proposed final copy. Rename-proof: the product name appears once per beat at most.

### Beat 1 — Hero

The founder's ruling: keep the Cursor hook (it says what and why instantly) but stop capping the claim at "deciding what to build" — Supaprod owns the loop past the decision. And the old trilogy sub-line is retired for a concrete single-journey sentence.

> **H1:** What Cursor did for writing code, Supaprod does for the rest of the product.
>
> **Sub:** One governed loop takes a signal all the way to shipped code, then comes back and grades the call. You approve the moments that matter. Every step leaves a receipt.
>
> **CTAs:** `Join the beta` (primary) · `Watch a real run` (ghost, anchors to beat 3)
>
> **Under-CTA line (small, mono):** No credit card. The first 100 bring a bet; the Critic red-teams it personally.

H1 alternates, same beyond-deciding scope (all rename-proof):

> **A2:** What Cursor did for writing code, Supaprod does for running the product.
>
> **B:** Engineers got agents that ship. This is the one that decides, ships, and answers for it. _(bolder, no borrowed brand)_
>
> **C:** The operating system for the product loop. _(category variant; coldest, most enterprise)_

Sub-line alternates:

> **S2:** It senses the market, makes the call with you, builds through your gate, and remembers whether it was right.
>
> **S3:** A signal becomes a decision, the decision becomes a merged pull request, and the outcome comes back to grade the call. Yours to gate, always.

Recommendation: **A + the primary sub.** "The rest of the product" is intriguing (it invites the question "what's the rest?" and the page answers it), states ownership beyond the decision, and keeps the investor-legible hook. "Agents do the work. You answer for it." moves to beat 4 as the thesis pull quote.

**Hero visual:** the upgraded terminal replay (see §5), running on load, showing a real mission trace: signal lands, Critic verdict, human gate approval, PR merged, outcome recorded. The CadenceMark hero treatment (§4.2) sits behind or beside it as the page's single brand moment.

**Nav (sparse, per benchmark):** `Demo` · `Pricing` · `Security` · `Updates` + `Sign in` + `Join the beta` (button). Nothing else. The machine-view toggle stays (one keystroke, `M`), it is a live GEO artifact and completely on-brand.

### Beat 2 — The gap (pure typography, zero boxes)

The two-card "AI feature vs AI operating system" comparison is dead (founder: it reads as AI-slop template design). Beat 2 becomes a single typographic statement, large type on the ink canvas, the shortest beat on the page. The category contrast itself moves into beat 3 where it is EXPERIENCED instead of asserted (the copilot tab that dead-ends).

> **Line 1 (large, silver):** Engineers got agents. Product got chatbots.
>
> **Line 2 (the turn, one size down):** Shipping got 10x cheaper. Deciding what to ship is the bottleneck now, and the reasoning behind every call still evaporates into Slack.
>
> **Line 3 (small, the handoff to beat 3):** Here is what it looks like when the whole loop runs instead.

Treatment: this is where typographic scale does the design work (the benchmark pattern: hierarchy, not decoration). Staggered reveal on scroll, no cards, no icons, no bullets.

### Beat 3 — The loop, running (the walkthrough)

> **H2:** Signal to shipped. Watch it happen.
>
> **Sub:** A real mission trace, replayed. The last tab is the part nobody else shows you.
>
> **Tabs:** `The full loop` · `With a copilot` · `When it breaks`
>
> **The copilot tab (NEW — the contrast, experienced):** the same signal plays, produces "PRD draft ready. Waiting for you." and stops. The remaining stations sit grayed out, the timeline visibly dead-ends, and one caption lands: **This is where every other tool stops.** No comparison boxes anywhere on the page; the reader feels the difference in ten seconds.
>
> **Failure-tab callout (kept, the differentiator):** CI fails. Supaprod reads the failure, revises its own spec, rebuilds, and ships green. It never stopped; it recovered. Your gate stayed in the middle the whole time.
>
> **Section closer (text link):** Run one on your own roadmap. The Critic will tear it down, free, no signup. → `/p/teardown`

Structure: the six/seven stations render as a compact horizontal spine above the tabbed FlowList (absorbing OrbitSection's content); the MockDecisionCard and MockLiveRun sit to the right exactly as today. Auto-cycle timers are replaced by user-controlled tabs and scroll-driven progression (§4.3): motion narrates, the reader sets the pace. The ember moment in this beat is the human gate lighting up when the run reaches it — color as meaning, the two-voice grammar made visible.

### Beat 4 — Receipts (the investor beat)

> **H2:** Receipts, not screenshots.
>
> **Sub:** Every number below is pulled live from our own workspace. Supaprod has run our product since June 2026. We publish the misses on the same ledger as the wins.
>
> **Live counters (SSR, real, dated):** `missions run` · `decisions recorded` · `outcomes graded` · `AI calls through one governed chokepoint` _(rendered from the live DB at request time; the figures in the repo today are 133 / 72 / 49 / 2,162 and will differ on publish day, correctly)_
>
> **Artifact row (all real, all live):**
> A decision, with its receipt → `/d/706dec…` · A public teardown → `/t/…` · The trust ledger → `/proof` · What shipped this week → `/updates`
>
> **The honesty card:** Where we actually are: the engine is built and it survived an outside code audit. External users today: zero. We built the operating system before opening the doors, on purpose, and it ran our own product while we did. This month the doors open. Early is the offer.
>
> **Pull quote (the thesis, promoted from the one-pager):** Agents do the work. You answer for it. Supaprod is how you answer.

This beat replaces every fabricated stat on the current page. If a number cannot be pulled live, it does not render (the strip degrades to the artifact row, never to a hardcoded count).

### Beat 5 — Where the field stops (and why ours compounds)

The old moat section's abstract labels ("decision layer", "outcome memory", "compounding edge") are retired as user-facing language (founder: the portrayal was not good). Compounding is now shown, not named, using a UI element that actually shipped (the PC-16 precedent citations on ranked bets).

> **H2:** The field stops at the insight.
>
> **Three short lines (unnamed, structural, set as a typographic ladder, not cards):**
> **Second brains** surface what is happening. You still do everything after.
> **Context layers** brief your coding agents. Nobody checks how the story ended.
> **Copilots** draft the document. The decision inside it goes untracked.
>
> **The turn:** Supaprod closes the loop and keeps the record. A record like that cannot be bought or backfilled. It exists only if the system was in the loop when the call was made.
>
> **The compounding moment (shown, not told):** two renderings of the same decision card, months apart. March: the bet arrives cold, ranked on evidence alone. July: the same class of bet arrives carrying its precedent chip, the real UI element: _"Similar call, right 3 of 4 times."_ One caption: **It gets sharper with every call it records. That is the part nobody can copy.**
>
> **Pull line:** Alignment is a screenshot. Outcomes are a ledger.

### Beat 6 — Trust + close

> **Trust strip (one row, four promises, linked to `/security`):** Read-only by default · Your keys stay yours · No training on your data · One-click revoke
>
> **Close H2:** Decisions made the way your team would make them.
>
> **Close sub:** Judgment, applied at the speed of your product.
>
> **CTA:** `Join the beta` + the waitlist field inline (email + the optional bet field, §7.1)
>
> **Waitlist microcopy:** First 100 get their bet red-teamed by the Critic. Sharing your link moves you up.

### Footer

Columns: **Product** (Demo, Pricing, Updates, Machine view) · **Proof** (Trust ledger, A decision record, A public teardown, ARD spec) · **Trust** (Security, Privacy, Terms) · **Company** (the founder's handle, "Built in public since June 2026", contact). A dense, honest footer is quiet investor diligence surface; the `/proof` and `/ard` links get promoted here from obscurity.

---

## 4. Design direction

### 4.1 System base

Tempo v5 remains the base (tokens verbatim from `design-reference/tempo-v5/tokens/`, type only via the class system, materials presets, 4px ramp, both themes from the same tokens). The current page predates the contract and runs violet as its working accent; v2 retires violet entirely (ember is THE accent, blue strictly machine-voice). This also makes the landing visually continuous with the freshly Tempo-ported app, which matters because visitors click from one into the other; the benchmark rule is fidelity parity between the marketing mock and the shipped product, and for once we have it: the app itself is the design system.

The ambition layer on top of Tempo: the mark treatment (§4.2), the motion system (§4.3), and typographic scale courage (Geist headline sizes at the top of the `text-heading-72/64/48` scale with tight tracking; restraint everywhere else). Dark-first; light theme generated and verified, not designed separately.

### 4.1b The color diagnosis (why the current page reads "solar red", and the fix)

The founder's reaction to the current colorway is correct, and the root cause is diagnosable, so we fix the disease, not the symptom:

1. **Two accents are fighting.** The page still runs its legacy electric-violet system with ember layered on top. Neither reads intentional; together they read like a template that couldn't decide.
2. **Ember is used ambiently.** Scroll-reactive glows, aurora washes, gradient morphs, shimmer text, glowing card borders. A high-saturation orange (`#FF6B2C`) spread across large areas of near-black optically vibrates: the eye reads alarm and cheap neon. This is also precisely the "glowing blob on dark" pattern the 2026 anti-slop research flags as the most recognizable AI-generated tell.
3. **The accent was tuned for the app, not the poster.** Full-saturation ember is calibrated for 36px buttons and gate chips. At marketing scale it needs to appear rarely and small, or muted and deep.

**The fix: the "ink and metal" palette.** The page is carried by graphite ink and silver light, the register the mark itself already lives in:

- **Canvas:** the Tempo ink scale (`#0a0a0a` base, graphite steps for elevation). Depth from materials and type, never from glow.
- **Type:** silver-to-warm-white (the token text scale). Large headlines are the page's brightest objects; nothing decorative outshines a word.
- **Ember, demoted to meaning:** it appears ONLY where a human acts: the primary CTA, and the gate moment inside the walkthrough replay. At most one ember object per viewport, always small, never as wash, glow, border, or gradient. Color as signal restores its dignity; scarcity is what makes it read premium instead of alarming.
- **Gold (`#E8B44C`):** the mark's core only, plus at most one micro-detail (the live counter numerals in beat 4 are the candidate). Warmth without alarm.
- **Blue:** machine voice strictly inside the replay frames (running states, agent labels), exactly as in the app. "Orange is my move, blue is theirs" survives at marketing scale.
- **Banned outright on this page:** violet anywhere, ambient color of any hue, gradient-tinted backgrounds, shimmer on text, colored glows behind cards.

**If ember itself is still wrong after discipline:** that is a brand-level call (the founder has flagged a brand revisit and a possible rename). The landing page then inherits the new accent through the same token seam with zero structural change. We do not improvise a different accent on this page ahead of the brand decision; per the standing design law, we fix the root or we route the decision, we never quietly desaturate.

### 4.2 The mark, treated like it matters

The CadenceMark is parametric (a seven-petal epitrochoid drawn in code, ember/gold core), which means the landing page can render it at any scale with zero raster loss. Two sanctioned treatments, pick per surface:

1. **Hero: the specular glint (recommended, the page's ONE personality touch).** The mark large in the hero, spiral stroked silver-to-white, with a slow conic-gradient light pass masked to the stroke: a glint travels the curve once every ~12 seconds. Not a rotation of the static logo (the brand README forbids that); a light moving over a still object, metallic and calm. The ember/gold core keeps its built-in glow as the only chromatic point. Static gradient fallback under reduced-motion. Zero new dependencies (SVG + motion).
2. **Stretch option, only if the founder wants true 3D:** the same u(t) curve extruded as a three.js TubeGeometry with a metallic physical material over `#0a0a0a`, slow drift, torn down off-screen. `three` is already in the dependency tree and `shader-animation.tsx` is the in-repo lifecycle reference. Costlier to make feel premium; the SVG glint gets 90% of the effect at 10% of the risk.
3. **The loop section: the seven-petal scroll-scrub.** The epitrochoid draws itself progressively as the user scrolls the walkthrough, each petal completing as its station enters view, the ember core igniting at Learn. This is feedback motion (it narrates the content) rather than decoration, so it passes the motion law; reduced-motion shows the completed mark with stations statically lit. This makes the logo mean something: the mark IS the loop, drawn by reading about the loop.
4. **Mono watermark** behind the close beat: the mono variant enormous, ~3% opacity, bleeding off one edge. Structural texture, grayscale-safe, costs nothing against the restraint budget.

### 4.3 Motion system: reader-paced, never timer-paced

The current page's paradox is busy-but-flat: everything auto-cycles (stations 2.5s, moat tabs 5.2s, ledger rows 3.8s) so the reader controls nothing and the moat's 90-word paragraphs get swapped away mid-read. v2 inverts the rule:

- **Text never moves on a timer.** Tabs are clicked; walkthrough steps advance on scroll or click; nothing swaps content the reader is consuming.
- **Replays are the exception:** the hero terminal and the mock product frames play on load (they are theater, not reading), loop cleanly, and pause off-screen.
- Transform/opacity only, swift easing from the token, everything gated on `prefers-reduced-motion`, IntersectionObserver mounts (the existing pattern, kept).
- Perf fixes from the audit are mandatory: the scroll-progress bar and reactive glow move to CSS-variable writes via rAF (no per-frame React re-render of a 14-section tree), and the page splits out of the single 3,696-line file (§8).

### 4.4 Anti-slop guardrails (the review checklist)

From the 2026 benchmark sweep, the tells that instantly read as AI-generated, all banned in v2: purple-to-blue gradients anywhere; glowing blob backgrounds; the "✨ Announcing" eyebrow pill; oversized italic serif heroes; _supercharge/empower/streamline_ headlines; emoji-bullet feature grids; identical icon-tile card grids; fake or anonymous testimonials; badge walls and "trusted by" logos that are integrations rather than customers; placeholder-data dashboard mocks ("John Doe" rows); colored left-border accent strips; decorative glassmorphism; numbered 01/02/03 kickers on non-sequential sections; gradient text on numbers; bounce easing; length-as-substance.

Additions of our own: every claim within one viewport of its evidence (show/tell adjacency, the strongest pattern in the benchmark set); real data in every frame of every mock (the walkthrough replays use a real mission's trace, labeled as a replay); one ember object per viewport; the grayscale test on every beat.

**The essay-kill rule (founder, 2026-07-14):** no beat carries more than ~60 words of body copy, no bullet lists anywhere in the page body, and every beat pairs its claim with a rendered component in the same viewport. The page shows first and captions second; if a section cannot be expressed as an artifact plus two sentences, it does not belong on the landing page (it belongs in `/updates`, the docs, or the Pitch Room). Beat 2 is the single sanctioned typography-only moment, and it is three lines.

---

## 5. Showing the product without recorded video

Founder constraint: no recorded demo video. The benchmark research is unambiguous that this is not a handicap: the most professional pattern in the class (Linear, Cursor) is the **code-built animated product mock**, and we already own an unusually good one. The plan, in order of load-bearing:

1. **The hero terminal replay (upgrade of TerminalCard):** types a real mission trace char-by-char with live timer and gate moments. The content switches from the current generic success log to an actual trace (real station names, real artifact ids, the human-gate approval visible). It is theater built from truth.
2. **The walkthrough's product frames (upgrade of MockDecisionCard / MockLiveRun):** the fake-UI frames get re-skinned to match the Tempo-ported app pixel-for-pixel (fidelity parity: investors WILL open `/demo` next, and the mock must not oversell). The shared-clock rAF engine (ETA and progress bar derived from the same clock) is kept as-is; it is the best motion craft on the current page.
3. **The interactive escape hatch: `/demo` and `/p/teardown` are real.** Every showcase section links to the live thing it depicts. This is the credibility inversion no competitor page can do: our mock is a replay OF the product, and the product is one click away with no signup.
4. **Before/after artifact pairs (beat 4):** the real signal that became a real decision that became a real merged PR, linked in sequence. For an agentic product, inspectable artifacts are the most honest demo that exists.
5. **Optional week-2 addition, not launch-gating:** a 10-second chromeless product capture as a moving screenshot (muted, looping). Only if a raw capture of the Tempo-ported app looks good with zero editing; a code-built mock beats a low-effort capture.

What we do NOT do: talking-head video, voiceover, Figma-mocked screenshots with fake data, or any frame whose content could not survive an engineer pausing it.

---

## 6. SEO + GEO plan

_Grounded in a dedicated research pass (2026-07-14) over current 2025-2026 sources plus a live audit of this repo's public surface. Full sourced report in the session archive; the load-bearing findings are folded in here._

### 6.1 The one critical fix, plus two operational traps

- `ssr: false` currently ships an empty body to every crawler. GPTBot, ClaudeBot, and PerplexityBot do not execute JavaScript, so today the page is literally invisible to every AI answer engine (Googlebot is the lone exception). v2 renders the full page server-side, moving the logged-in redirect to a client effect. Verification is literal: `curl -A "GPTBot" <domain>/ | grep "<title>"` must return real content. This single change outweighs everything else in this section, and it is also the LCP win.
- **Cloudflare trap:** Cloudflare now blocks AI crawlers by default on new zones. When the custom domain lands on Cloudflare, explicitly confirm AI-crawler blocking is OFF for the marketing surface, or the relaunch silently opts out of every answer engine.
- **Domain cutover hygiene:** 301 from cadence-flow-beta.lovable.app to the custom domain, `rel=canonical` everywhere, or accumulated signals split across two hosts.

### 6.2 Metadata + structured data (cheap, do all of it)

- **Retitle.** The current 75-char title truncates (~60-char limit), repeats the name twice, contains zero searchable terms, and putting a competitor's brand in the `<title>` is the legally weakest trademark placement (in-body nominative use is safe; metadata is where courts have found infringement). Target shape: identity + query terms, under 60 chars. Meta description trimmed to under 155 chars.
- **JSON-LD:** `Organization` with `sameAs` (Crunchbase, LinkedIn, GitHub, X) and a `disambiguatingDescription` — this matters more than usual because **"Cadence" collides with Cadence Design Systems**, a $75B company that owns the term in every LLM's prior. (Relevant to the rename decision: a more ownable name is itself a GEO win.) Plus `SoftwareApplication` with category/offers. `FAQPage` only if the visible Q&A section ships.
- **Hygiene now missing entirely:** `sitemap.xml` (about 10 public routes) + a `Sitemap:` line in robots.txt + explicit allows for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended. The `/trust` route ships with no head/meta at all: finish it or noindex it.

### 6.3 GEO: what actually earns citations (evidence-ranked)

1. **Factual claim density is the best-replicated lever** (~30-40% relative visibility gains in the founding GEO study; independently corroborated 2026). Every claim gets a number, a name, or a date, written as self-contained extractable sentences. The receipts beat IS the GEO beat, and `/proof` (a page of dated verifiable outcomes) is a native GEO asset no competitor has.
2. **Comparison pages are the best-evidenced owned-content play** (Ramp grew AI-citation share 3.2% → 22.2% in one month on this format). Week-2 content, not launch-gating: "Supaprod vs Productboard", "ChatPRD alternatives", "AI agents for product teams, compared" — honest tables, named pricing, explicit "when to pick them instead" (which is also the engineer-trust posture).
3. **Third-party presence outranks on-site polish for the head queries.** "Best AI tools for product managers" is 100% listicles on page 1; no product page ranks. The play: Crunchbase + G2 + Capterra profiles now, Product Hunt timed to the beta, pitch inclusion into the existing listicles (Pendo, G2 Learn, Builder.io). Skip Wikipedia (not notable yet; rejected drafts are indexed).
4. **llms.txt reclassified:** near-zero citation lift (97% of llms.txt files get zero AI-assistant requests; Google explicitly doesn't read it), BUT genuinely consumed by IDE agents and MCP clients — which for a product whose buyers point Claude Code at vendors is a real channel. Keep and maintain the whole machine layer (llms.txt, agents.txt, A2A card, the `M`-key machine view) and market it as engineering proof ("agent-native down to the wire protocol"), not as discoverability. **One canonical one-liner everywhere:** today the hero, meta, and llms.txt each carry a different self-description; LLMs reconcile drift poorly. The v2 copy deck's identity line propagates verbatim to all of them.

### 6.4 Keyword posture + content decision

Contested and not worth chasing at launch: "AI product management" (Pendo/Productboard/Aha!), "PM copilot" (ChatPRD owns it with a 100k-PM content hub). Winnable: the agentic phrasings ("AI agents for product teams", "AI product operating system" — thin SERPs, no entrenched owner, and our differentiation is the honest answer), the comparison long-tail, and **terms only we can define**: "agent requirements document (ARD)", "AI agent trust ledger", "Critic teardown". Owning novel-term definitions is a classic LLM-citation win; `/ard` already exists and gets real prose. **No blog at launch** (B2B content ROI arrives months after the v13 window); `/updates` stays dated and alive as the freshness + anti-vaporware signal. Internal linking pattern: every landing beat body-links its evidence page (`/proof`, `/demo`, `/security`) — the SEO pattern, the GEO pattern, and the receipts posture are the same pattern.

### 6.5 Messaging evidence the founder should see before locking the hero

The research surfaced a genuine, sourced critique of the "What Cursor did for X" pattern: it requires the visitor to hold "Cursor-for-code" as a pre-loaded fact (parse cost; heads of product are less Cursor-native than engineers), it inherits Cursor's news cycles and the already-memed "Cursor for X" fatigue on HN, and 2026 conversion evidence consistently favors plain literal claims over clever analogies (plain-benefit headlines beating clever variants by double digits in the cited A/B cases). The evidence-backed compromise, which v2 adopts regardless of the H1 choice: **the analogy never appears in the `<title>` metadata** (trademark + truncation + zero search value), and wherever it appears it is glossed in the same breath by the literal claim (our sub-line already does this). The founder's call in §9 stands: the Cursor line is genuinely hooky for the wedge audience that DOES hold the reference; the literal-first alternates (B, S2/S3) are the evidence-favored fallback. One more lesson from the same pass, already honored in the deck: after Devin and the Replit database incident, "autonomous" is a credibility bet skeptics immediately try to break. The hero says "governed loop"; autonomy is the conclusion the visitor draws from watching the walkthrough, never the adjective we claim.

### 6.6 One unowned differentiator worth shipping

None of the researched exemplars (Cursor, Linear, Braintrust, Harvey) proactively state what their agent does NOT do unsupervised. A short "what the agents can't do without you" element (the non-overridable floors: merge, revert, delegate always human-gated) answers the post-Replit question before it is asked, is provably true of our architecture, and no one else says it. Candidate placement: inside beat 6's trust strip or as the FAQ's first entry. This is the honesty doctrine as a competitive weapon.

---

## 7. GTM wiring (what the page must ship with to serve the launch)

### 7.1 The waitlist mechanic (build spec, currently ZERO code)

The launch manual's creative core, confirmed unbuilt in the ground-truth audit. Minimal honest version:

- **Table** `waitlist_signups`: email (unique), optional `bet_text`, `referral_code` (generated), `referred_by`, timestamps. RLS: insert-only public, read service-role.
- **Server fn** `joinWaitlist`: validates email, stores, returns position (count-based) + share link `?r=code`. A referred signup bumps the referrer (position recomputed from a simple score: order + referral count weight).
- **Surface**: inline in beat 6 (email field + optional bet textarea + button), plus the same form in a slide-over reachable from every `Join the beta` button. No separate page.
- **The teardown promise is operational, not automatic:** the first-100 teardowns run through the dogfood workspace per the launch manual's capacity model; the form's copy promises only what the founder will actually deliver.
- **Anti-abuse**: honeypot field + per-IP rate limit at the server fn; no captcha at launch.

### 7.2 Funnel events

Visit → waitlist_join → referral_share → demo_click → signup, wired through the observability facade (`src/lib/observability/`), NOT a raw vendor SDK import (the AFD rule). PostHog client capture lands inside the facade; the checklist item "verify events actually fire" gets a literal test on publish day (38 of 49 audited Show HN launches had dead analytics on their biggest day; we will not be one).

### 7.3 Launch-asset alignment

The wave copy (founder story, receipts drop, teardown challenge) all point at this page. The page must therefore be live and approved BEFORE Day 3 of the (recalendared) wave. OG cards from the brand kit make every share render correctly. The Show HN hard gate (PC-04 demo) is already cleared; this page is the remaining launch-surface dependency.

---

## 8. Implementation plan

### 8.1 File strategy

The page leaves its 3,696-line single file. Target structure:

```
src/routes/index.tsx                 (route shell: SSR config, head(), beat composition)
src/components/landing/
  Hero.tsx  TheGap.tsx  LoopWalkthrough.tsx  Receipts.tsx
  FieldStops.tsx  TrustClose.tsx  LandingFooter.tsx  LandingNav.tsx
  replay/ (TerminalReplay.tsx, MockDecisionCard.tsx, MockLiveRun.tsx, FlowList.tsx)  ← ported, not rewritten
  MarkHero.tsx (the glint treatment)  WaitlistForm.tsx
src/lib/landing.functions.ts         (live counters fn, joinWaitlist fn)
```

The walkthrough replay components port with their rAF engines intact; only their skins change to Tempo tokens.

### 8.2 Phases (each independently shippable, review-gated)

| Phase                                             | Scope                                                                                                                                                                                                     | Gate                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **P0 Foundations**                                | SSR flip + file split + Tempo token migration + perf fixes (CSS-var scroll effects) + kill violet                                                                                                         | tsc, build, both themes render, Lighthouse ≥90 perf                     |
| **P1 Hero + nav + footer**                        | New hero, mark glint, terminal replay upgrade, sparse nav, credibility footer                                                                                                                             | Founder copy approval; grayscale test                                   |
| **P2 The walkthrough**                            | Merge Orbit/Stations/AgentInAction into the tabbed beat 3; scroll-scrub mark; teardown link-out                                                                                                           | Reduced-motion pass; reader-paced rule verified                         |
| **P3 Receipts**                                   | Live counters server fn, artifact row, honesty card; delete every fabricated stat                                                                                                                         | Every number traces live or doesn't render                              |
| **P4 Differentiation + trust + close + waitlist** | Beats 5-6, waitlist table/fn/form, funnel events via facade                                                                                                                                               | Events verified firing; anti-abuse tested                               |
| **P5 SEO/GEO layer**                              | Retitle + meta trim, JSON-LD (Organization w/ disambiguation + SoftwareApplication), sitemap.xml + robots Sitemap line + AI-bot allows, machine-view rewrite + llms.txt one-liner sync, `/trust` meta fix | Rendered-HTML crawl check (curl as GPTBot, no JS); title under 60 chars |
| **P6 QA + ship**                                  | Tempo test on every beat, copy read-aloud pass, claims audit vs the PROVEN list, cross-browser, `bun test` green                                                                                          | Founder final approval, then publish via Lovable                        |

Estimated effort: P0-P2 one focused day, P3-P5 a second day, P6 a half day. The two founder clock-starters from the ground-truth doc (domain warm-up, OAuth verification submission) run in parallel and are not blocked by any of this.

### 8.3 Skills + agents to invoke at implementation time

Per the founder's direction to use the best available tooling: `cadence-tempo` (contract compliance), `high-end-visual-design` + `design-taste-frontend` + `impeccable` (the craft pass on hero and walkthrough), `emil-design-eng` (motion quality), `verify` (end-to-end drive before commit), plus a `code-review` pass and an adversarial copy review against §4.4's banned list before founder sign-off.

### 8.4 Verification (definition of done)

Both themes from the same tokens; every color/type/radius traces to Tempo; server-rendered HTML contains the full copy and live numbers (verified with a no-JS fetch); Lighthouse performance ≥90 on the published page; reduced-motion produces a complete, calm page; every outward claim maps to a [PROVEN] row; zero banned words (grep-gated); the waitlist round-trips and events fire in PostHog; the founder has read every line aloud once.

---

## 9. Open founder decisions (blocking items only)

1. **Hero: A "the rest of the product" (recommended) or A2/B/C, and the sub-line pick.** §3 beat 1. All variants honor the beyond-deciding ruling. Before locking, read §6.5: the research surfaced real evidence against analogy headlines (parse cost, anchor risk, plain-claim conversion data). Either way the Cursor name leaves the `<title>` tag; that part is not optional.
2. **Waitlist as primary CTA** (recommended, §1.4) **or direct "Start free"?** One string flips it later either way.
3. **The ink-and-metal palette (§4.1b): approve ember-as-signal-only, or route an accent change through the brand revisit?** The page structure is identical either way.
4. **Mark treatment: SVG glint (recommended) or the three.js extruded stretch goal?** §4.2.
5. **The honesty card's "external users today: zero" line: approve the framing?** It is the canon's own doctrine applied to the highest-visibility surface; the alternative is silence, never a fudge.
6. **The new name** (whenever ready): all copy is rename-proof; the swap is one constant + the mark's wordmark lockup.
7. **Custom domain** for canonical URL, OG, and the OAuth verification submission.

---

_Research artifacts backing this plan (session scratchpad, 2026-07-14): the five structured research reports (landing audit, positioning canon, competitor intel, design benchmarks, brand assets). Canon sources: [`docs/pitch/one-pager.md`](../pitch/one-pager.md), [`docs/pitch/launch-assets.md`](../pitch/launch-assets.md), [`docs/strategy/v13-proof-campaign.md`](../strategy/v13-proof-campaign.md), [`DESIGN-TEMPO.md`](../../DESIGN-TEMPO.md), [`docs/Growth Strategy/00-launch-operating-manual.md`](../Growth%20Strategy/00-launch-operating-manual.md)._
