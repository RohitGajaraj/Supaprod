> _Produced 2026-08-25 by a six-agent workflow: a ChatPRD teardown, a category map, an outside read
> of our own surfaces, a friction count, and an adversarial test of the moat. Every claim carries a
> file:line, a production number, or a URL. **It contradicts MAIN LANE in two places and MAIN LANE is
> wrong in both** — see the note at the foot of this file._

# SUPAPROD — THE REIMAGINING

Decision document. 2026-08-25. Evidence is file:line, a production number, or a URL.

---

## 1. THE VERDICT

**What it is today.** Supaprod is an internal console for a machine nobody has watched run: 84 authenticated route files of which 48 are redirects to other routes (`src/routes/_authenticated.*.tsx`, measured), one live workspace, 59 tracks with 58 stuck at the first station and none ever finishing, and 14 forecasts of which zero were written by a human, zero are even due yet, and zero have been graded.

**What it should be.** One screen where a person writes what a change is supposed to do, watches an agent do that work in the open with a stop button that always works, and gets told inside a week whether the change did it — a single transaction that pays on first use and needs no accumulation.

**What has to die.** Layer 02 stops being a product, layer 03 stops being a present-tense sentence until one grade lands, the seven-station vocabulary comes off every surface a customer sees, and the 84 routes come down to nine work surfaces.

---

## 2. WHAT TO DELETE

**Layer 02, the operating system, as a product and as a word.** OpenAI shipped Symphony free on GitHub in April 2026 — "Ticket statuses act as a state machine that drives the orchestrator's behavior", "500% increase in landed pull requests" (helpnetsecurity.com/2026/04/28). Linear ships the same stations at $16/user/month with coding agents installed in 75% of enterprise workspaces (theregister.com/2026/03/26/linear_agent). Internally: 58 of 59 tracks entered at station one and none reached the last. A seven-station state machine is a config file now. **Keep `src/lib/spine/route.ts` as internal routing. Stop telling anyone it exists.**

**"Seven stations" from every public surface.** `src/components/landing/TheFilm.tsx:45` renders "One signal, all seven stations, and an outcome scored against the call that caused it"; `src/routes/index.tsx:197` describes the hero art as "Seven stations in orbit". `docs/strategy/positioning-locked-2026-08.md` §5 already banned exactly this: "A seven-station route diagram as the front door… a heavily-diagrammed staged lifecycle is the visual signature of SAFe, which this buyer is ripping out." The ruling exists and the shop window is violating it. This is a sweep, not a debate.

**The present-tense layer-03 claim.** `src/components/landing/ThreeLayers.tsx` currently ships `claim: "It learns, and it guides."` with the body "Every decision is recorded with its evidence, then graded against what actually happened. It compounds." Production: 0 grades ever, 0 rows in `learnings` for the live workspace. This violates §4's own binding constraint ("No present-tense claim of accumulated learning"). Either land one grade this week or move both sentences to the future tense the canon already specifies.

**The three-layer frame from all customer-facing surfaces.** `README.md`'s own moat table says layer 01 is "**No, and we should say so.**" and layer 02 is "**Partly, and only for a while.**" Two thirds of the pitch is a written admission of copyability, answering a question no first user has asked. Keep it in the deck. Take it off the door.

**48 route tombstones.** Measured: 48 of 84 authenticated route files are under 70 lines and contain nothing but `throw redirect`. Keep only the two whose URLs shipped publicly (`/trust`, `/p/teardown`). The rename rate is the real finding: five names for one object (missions / runs / track / studio / cockpit), three for one memory (brain / memory / knowledge), four for one policy surface (guardrails / engine-room / govern / boundary), and both `discover` and `discovery` exist as routes.

**Four of six rail doors, and ten of sixteen nav destinations.** The rail is Today, Approvals, Runs, Brain, Threads, Guardrails (`AppFrame.tsx:320-410`). Three of six are named after the engine. Cut to four rows: **Today, Work, Checks, Threads.** Runs and Guardrails move into Settings. Approvals folds into Today's existing "what needs you" region.

**The approval-policy module with zero callers.** ChatPRD gates approval workflows at Enterprise (chatprd.ai/enterprise). Supaprod built a policy language before it had one user. Delete the policy engine. Keep **one gate, one rule**: anything that leaves the building pauses for a person.

**The 14 existing forecasts.** Seven are near-duplicates of "Halt 'EU Timezone Support Latency'" and their observables are `workspace.search(...)` and `sources.status shows active_scout_targets > 0` — assertions about whether Supaprod's own scrapers ran. Delete them, or the first calibration readout grades the product on its own empty connectors.

**The dead onboarding phases.** `ObsidianOnboarding.tsx:1196-1210` records that `arrival`, `product` and `data` have been unreachable since 2026-08-10. Delete the code; the file drops well below 75KB.

**The two-seat Business minimum.** It attaches a procurement conversation to a product nobody has used. The gate to remove is the invite code (`src/routes/pricing.tsx:181`), not the price.

**Target: 84 → 9.** Start, Today, Work (list), Work (one item), Checks, Threads, Approvals-in-Today, Settings, and one public page a stranger can reach with no account. Plus auth and legal, which are not work surfaces.

---

## 3. THE ONE LOOP

The whole product is five steps and the user learns four nouns: **change, why, work, check.**

**Step 1 — one box, one sentence.** Placeholder: *"What are you changing, and what should it do?"* They type: "Rewriting the checkout error copy — I think it'll cut abandonment."

This box already exists and already works. Post-signup, `/today` redirects to onboarding (`_authenticated.tsx:69-74`), the user types one assumption, clicks once, waits ~21s, and gets a real verdict. Three clicks to first value. It is the only path in the product that works end to end. Protect it.

**Step 2 — it splits the sentence in two, on screen.** Left: the change. Right: what it should do, drafted with a number and a date it can actually check — *"checkout abandonment below 22%, checked 1 September."* The user edits or accepts. **This is the forecast. It is never called that on screen, and the horizon is days.**

Today, that belief lands as an opportunity and nothing converts it (`ObsidianOnboarding.tsx:741`, `beliefTarget` typed `{kind:"opportunity"}`). That is the single highest-leverage broken wire in the product.

**Step 3 — it starts working and the user watches.** No form, no shape picker, no station map. Detail in §4.

**Step 4 — it stops once, in one place.** Before anything leaves the building. One line at the top: *"Waiting on you."* Two buttons: the affirmative one names the consequence ("Open the pull request"), the other is "Not yet" and opens a one-line instruction box.

**Step 5 — on the date, it comes back on its own.** One line: *"You said abandonment would drop below 22%. It's at 24.1%. You were wrong."* Plus one sentence on what it will do differently next time. That is the entire brain surface for now.

**Does "seven stations" survive? No.** The friction count settles it: 15 nouns before a single word of the user's own content, ~54 to complete one lap, 72 with agent names. Starting a track costs 6 clicks and 4 decisions, three of which require already understanding the model — and the shape picker's own header (`TrackStart.tsx:17-19`) says asking someone to know the model before they have used it is wrong, then asks a proxy question that requires exactly that. Worse, the model is not internally consistent: `AppFrame.tsx:302-308` records that `sense` displays as Discover and `define` as Plan, and that it once leaked to a user as "Waived: sense, decide" under a rail saying Discover.

**What replaces it on screen: one line, two verbs.** *"Now: writing the change. Next: your review."* The route still has seven stops internally. The user sees the current one and the next one. Nothing else.

---

## 4. WHAT THE AGENT DOES ON SCREEN

The founder's ask is the right ask, and it is buildable in one week.

**The unit is a row that appears when work starts, not when it finishes.** Verb, object, ticking timer: *"Reading 34 Linear issues — 0:04."* On completion it collapses to a one-line result with a disclosure triangle. **Never a spinner with no noun.** The judge call measures mean 20,628 ms, max 24,777 ms (`ObsidianOnboarding.tsx:1390`). A person will wait 21 seconds for something they can watch and will not wait 8 for a blank screen.

**Text streams into its final position, not into a chat bubble.** When the agent writes a spec or a pull-request description, the characters land in the place that text will live. That is what makes it feel like a cursor rather than a chat window.

**Render the caret.** A small named caret at the current write point, one per running agent, one colour each. Two agents means two carets and two names. This is cheap and it is the literal answer to "like a live cursor."

**Stop is always the same pixel.** It never moves, never greys out, and it takes effect on the UI immediately. Stopping leaves the partial work visible and editable. It is never discarded.

**Per-row: "skip this" and "do this differently."** The second opens a one-line box whose text is prepended to the retry. This is the difference between watching and steering.

**The user can type into what the agent is writing, while it writes.** The agent's next write does not clobber it — it locks that region and appends a row: *"You edited this, I left it alone."* This is the single most important trust behaviour on the page and region locks are a day of work.

**When it needs a person, no modal.** The in-flight row turns into the question, the page header becomes *"Waiting on you"*, and the tab title gets a prefix. If they are elsewhere, Today's "what needs you" region gains a row. No email in the first version.

**When it waits, it stops spending.** After the timeout it writes *"still waiting on you since 14:02"* and holds. Ship this together with the fix to `src/lib/spine/promote.server.ts` — it contains zero occurrences of `is_sample` and is scoped `.eq("user_id", userId)` at line 271, with `cluster-tick.ts:164` passing the workspace owner rather than the workspace. That path can spend money building seeded demo data, and `track-tick.ts:68-70` already records it happening: "52 open tracks and every one was on a sample workspace… a demo fixture driving itself in a circle."

---

## 5. THE HONEST POSITION

**What Supaprod sells: the check between what a change was supposed to do and what it did, run by something that did not write the change.**

**Why here.** Producing work is finished and priced: Cursor at roughly $4B ARR, Lovable $500M, Replit $525M, Cognition $492M run-rate, against ChatPRD's six figures on 100,000 users and a celebrity founder (every.to/podcast, chatprd.ai/pricing). Writing the document is a $15/month feature with a measured ceiling. Running the lifecycle is free from OpenAI and included in Linear.

Accepting work is where the pain moved, and it is measured: median code review time up 441.5% while task throughput rose 33.7% (Faros AI, 22,000 developers); agentic PRs have 5.3x longer pickup time (LinearB 2026 benchmarks); "30 PRs per day with only six reviewers"; DORA metrics flat because the output queued at review. The specific gap is not code quality, it is intent: "the reviewer often receives a completed diff without the same implementation journey or decision trail, and the reviewer has to reconstruct intent from the ticket, PR description, and code changes alone" (codex.danielvaughan.com/2026/05/24).

**To whom.** The person now accountable for merging output they did not write — a tech lead, a founder-engineer, a PM on a team running Cursor or Claude Code. Not the IC PM drafting a PRD; that buyer is already served at $15 and the ceiling is proven.

**Why not a coding agent plus a doc tool.** Because both sit on the producing side and neither is a counterparty. The coding agent writes the diff and also judges the diff. The doc tool holds the intent and cannot see the diff. What does not exist is a record written before the work started that something other than the writer checks the result against. That is one transaction. It does not require a year of data.

**Is the forecast the answer? Not as stated. Yes, reframed.** As stated — accumulated calibration compounding over time — it is contradicted from four directions. Pre-registration is the identical mechanism and tops out at 10–12% after twenty years of journal and funder pressure (Hahn et al. 2025: 5% in 2020 rising to 12% by 2023; Sports Medicine 2026: 10% of 2024 articles). Eppo made the hypothesis optional and backfillable on purpose (docs.geteppo.com: "you can also add this later"). Statsig auto-graded against a declared metric and sold for $1.1B without enforcing pre-commitment. ADRs have carried append-only, do-not-edit, expected-consequences-at-decision-time since 2011, free, prescribed by Microsoft's own Well-Architected Framework — so "an agent can't write a forecast into a markdown file" is not a defensible line. And the founder's own workspace attaches a forecast to 15.2% of decisions.

Reframed, it holds: **not a belief about the quarter, a statement about this change, checked in days, read by the person about to merge.** That is neither advisory (it gates a merge) nor a scoreboard (it is private to the person and never rolls up), which is the only escape from the two named failure modes — ownership failure kills the byproduct version, and accountability kills the submitted version.

**Price per checked change, not per seat.** $20/mo and $50/seat are above ChatPRD's proven dead end. Usage billing is already normal in this budget: "$150/month on AI coding tools in 2026", "$200/month ceiling across Claude Code Max, Cursor Ultra, ChatGPT Pro" (morphllm.com/ai-coding-costs).

**Standing rule from here on:** nothing enters the positioning doc until a route renders it and a person who is not the founder has reached it.

---

## 6. THE FIRST TEN DAYS

Three lanes. Ordered by leverage per unit of risk. Wiring before building.

**Lane A — wiring (highest leverage, near-zero risk)**
1. Day 1: `onClick={() => navigate({to:'/track/$trackId', params:{trackId:t.id}})}` at `TrackStart.tsx:480` — the only page showing the product's object has zero inbound links (grep: 0 results).
2. Day 1: run `driveTrackNow` (`track.functions.ts:1139`) on one track in the live workspace until it reaches the last station, and screen-record it. Three months in, nobody has seen this.
3. Day 1: add `.eq("is_sample", false)` and workspace scoping to `promote.server.ts:271` before the spender bills a real user for seeded data.
4. Day 2: delete the 48 tombstones; cut the rail from 6 rows to 4; move Runs and Guardrails to Settings.
5. Day 2: delete the 14 self-referential forecasts, cap every horizon at 7 days, and force one real grade through by hand — one grade makes the ThreeLayers sentence true; until then rewrite it and `demo.tsx:56` to future tense.

**Lane B — the one loop**
6. Day 3–5: convert the onboarding belief into a started track and land the user on `/track/<id>` watching it walk; 6 clicks and 4 decisions become 0 and 0.
7. Day 4–6: the live view — rows appended on start with ticking timers, text streaming into final position, named caret, permanent Stop, per-row "do this differently".
8. Day 5–7: region locks so a person can edit while the agent writes, and the agent says so.
9. Day 7–8: one gate, one rule — anything leaving the building pauses; delete the policy module.
10. Day 8–10: the check — on the horizon date the item reopens itself with one line: what you said, what happened, right, wrong, or can't tell.

**Lane C — the door**
11. Day 3–6: rebuild `/p/teardown` with no signup, ending on "what is this supposed to do, and by when", returning a dated shareable page.
12. Day 7–10: sweep "seven stations", "crew", "bet", "the call", "the record" and "station" off every surface, and run the corpus test that killed "receipts" against them.

---

## 7. WHERE THE FOUNDER IS WRONG

**The moat has never existed, not even in his own hands.** Live workspace, 2026-08-25: 92 decisions, 90 agent-authored, 2 human-authored, **0 human-authored with a forecast**. All 14 forecast rows carry `auto_origin=true`, `source_kind='agent'`, `decided_by_agent_slug` in ('strategist','critic'). The claim is "what a *team* believed would happen." Nothing in this product has ever recorded a human belief. Either make it a required field on the human decision path, server-side, or restate the claim as "what the agent predicted", which is a weaker and different product.

**"Zero graded" is not market feedback, it is a horizon he chose.** Earliest horizon is 2026-09-05, twelve days out. Latest is 2030-01-01, two rows, both agent-set. Nothing is due. Nothing has been deferred. Three months in, the core mechanism's first possible test is still in the future. That is worse than being rejected, not better.

**Every graded forecast in the database is seed data.** The 91 graded rows sit in workspaces named "Sample workspace" and "Helio Labs" (six of them, 12 graded each, all created 2026-07-25 with identical counts). The live workspace has 14 forecasts, 0 graded, and 0 rows in `learnings`. This is the same failure as the retracted "36 real learning→decision edges" in §4, repeating on the moat feature itself.

**He falsified the compounding record and did not run the same test on the forecast.** The nearest neighbour is not FICO or SAS. It is Cloverpop, selling "Capture every decision in the Decision Bank, tracking rationale, data sources, and outcomes" with a Learning Loop and a "Decision System of Record" that tracks "how results compare with expectations" — for eleven years, $12.6M raised across 5 rounds. §5K.2 declines the category naming FICO, SAS, IBM, Quantexa, ACTICO and Aera, and never mentions the company that shipped this exact thesis in 2015. There is no answer in the repo to "how are you different from Cloverpop." Read their product before the next investor call.

**"Un-backfillable" is not a differentiator.** ADRs are append-only with supersession, prescribed by Microsoft, free. Eppo made the hypothesis backfillable deliberately. Statsig sold for $1.1B without enforcing it. The market has priced this constraint and declined it repeatedly. §5 already dropped it once for the outcome record; drop it here too.

**The product is over-built, not under-built.** 616 markdown files and 2.7M words in `docs/`. 1,742 source files. 2,078 lines in `AppFrame.tsx` to draw a six-row sidebar. 84 authenticated routes with 48 redirects. Against one live workspace, 5 tracks all sitting at decide and design, and zero completions. The corpus is a cost, not an asset — reading it is what makes each session repeat the last one. **New test on every open workstream: does this move one piece of work one step forward? If not, it doesn't get built.**

**Killing the public teardown was the right diagnosis of the wrong object.** His note is correct that a red-team reads as another copilot window (`p.teardown.tsx:6-9`). But he removed the surface instead of changing what it returned. The result is that today the only thing a stranger can experience is a film of a workspace flagged `is_sample = true` (`demo.tsx:12`), behind an invite code (`pricing.tsx:181`). Meanwhile the free tier of the category leader hands a stranger a finished document in about ninety seconds. Bring the page back and make it end on the one output ChatGPT cannot produce.

**The register drift he swept out of the marketing is still all over the product.** `AppFrame.tsx:665` renders "The crew raised this on its own". `_authenticated.decide.tsx:685` labels a control "Where this bet sits", `:745` "The bet, in your words". `_authenticated.brain.tsx:732` "The crew has read this record before acting." The 5.9M-word audit killed a word set, not the shape of the defect, and the in-product register was never re-measured.

**Layer 03 is not unoccupied, and the sentence on the site is currently false.** Linear is publicly claiming context-driven product development with an agent that can "synthesize context, make recommendations, and take action", funded, holding the workspace. Supaprod's site says "It learns, and it guides" against zero grades. Four accelerators have said no to a pitch that leads with the one claim a single SQL query falsifies in the room.

**What he got right, stated precisely so it isn't over-read.** The three-click onboarding is genuinely good and is the only thing in the product that works end to end. The intuition that the record of intent is the missing artifact is correct — it is confirmed by an unprompted stranger on a competitor's own review page ("noting initial hypothesis… better to be down on paper… than for me to leave and loose a a few years worth of knowledge", chatprd.ai/reviews) and by the 441% review-time data. What is wrong is the timing (a quarter, not a merge), the buyer (the PM writing docs, not the person accepting agent output), the tense (present, not future), and the belief that it needed a seven-station machine underneath it before anyone could use it once.

---

## MAIN LANE's two corrections, recorded rather than quietly fixed

**1. I framed "14 forecasts, 0 graded" as the moat failing. That was wrong.** The earliest horizon in
the database is 2026-09-05, twelve days out; the latest is 2030-01-01. **Nothing is due yet.** Zero
graded is a horizon that was chosen, not a verdict the market returned. The honest reading is worse
than mine, not better: three months in, the core mechanism's first possible test is still in the
future.

**2. I called them "14 real forecasts". They are 14 AGENT forecasts.** All carry `auto_origin=true`,
`source_kind='agent'`, and a `decided_by_agent_slug` of strategist or critic. The live workspace holds
92 decisions, 90 agent-authored, 2 human-authored, and **0 human-authored decisions with a forecast.**
The positioning claim is *what a team believed would happen*. **Nothing in this product has ever
recorded a human belief.** Either that becomes a required field on the human decision path, enforced
server-side, or the claim gets restated as *what the agent predicted*, which is a different and
weaker product.
