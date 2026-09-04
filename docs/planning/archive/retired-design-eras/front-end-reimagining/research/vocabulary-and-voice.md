# Working-State Vocabulary Deck + Microcopy Grammar

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for the front-end reimagining (charter: `../problem-statement.md`).
> Sources of law: `src/lib/agent-vocabulary.ts` (PC-28 grammar), `docs/conventions/humanized-output.md`, `docs/conventions/ui-voice.md`.
> Register: sharp PM. Contractions on. Sentence case. No em or en dashes, no trailing exclamation, no ellipsis filler, no buzzwords from the denylist, no mechanism words (mission, swarm, eval, guardrail, drift) outside the Engine Room.

## 0. The rotation contract (how the deck is used)

The whole point of a deck is that it never repeats while you watch. Binding rules for the ticker, PulseLine, Working strip, and any live caption:

1. **Session-seeded shuffle, no repeat until exhausted.** Each surface draws from the relevant stage deck with a Fisher-Yates shuffle seeded per session; a line cannot appear twice until the deck is empty. Then reshuffle.
2. **Specific beats generic.** If the engine knows the real object ("the checkout spec", "the failing test"), use the templated shape from section 3 with the real noun. The deck lines below are the fallback when only the stage and agent are known.
3. **Actor always named.** A deck line is a predicate. The renderer prefixes the agent display name from `agentDisplayName()`: "Draft is tightening the acceptance criteria."
4. **Lowercase predicates, no terminal period in the ticker,** full sentence with period in the Thread and toasts.
5. **Never two identical lines on screen at once.** If two agents draw the same line, the second draws again.

GAP: no rotation infrastructure exists today. `agent-vocabulary.ts` carries exactly one `relayVerb` per agent, so the ticker repeats the same phrase within minutes of watching. The fix is a `relayDeck: string[]` field per catalog entry plus per-stage decks, and a shared `drawWorkingLine(stage, agentSlug, sessionSeed)` helper both the Working strip and the Spine consume.

GAP: `ACTION_LABEL` covers only 10 tool ids; every unknown tool collapses to "working", so most engine activity reads identical. The registry needs a deck per tool family and a lint that fails when a registered tool has no label.

## 1. The working-state verb deck

Twelve lines per stage (minimum eight required; extras cost nothing and stretch the no-repeat window). All present-progressive, all honest: a line may only render while that kind of work is actually plausible for the running step.

### 01 Discover

- reading your sources
- sweeping the connected channels
- clustering what customers said this week
- pulling the fresh signals
- tracing a spike back to its source
- comparing this week against last
- sorting signal from noise
- checking what competitors shipped
- reading the support inbox
- lining up the evidence
- following a thread across your workspace
- writing up what changed

### 02 Decide

- ranking the bets
- scoring impact against effort
- stress-testing the top pick
- arguing the other side
- checking the bet against memory
- reading past outcomes for a precedent
- weighing what it costs to wait
- narrowing the field
- red-teaming the call
- writing up the case
- hunting for the hidden assumption
- putting a number on the risk

### 03 Plan

- drafting the spec
- turning the decision into requirements
- cutting scope to the bone
- splitting the work into slices
- writing the acceptance criteria
- naming the risks up front
- sizing the first slice
- sequencing the work
- checking the spec against the decision
- tightening the language
- marking the open questions
- drawing the line for v1

### 04 Design

- mapping the flow
- sketching the first screen
- rendering it through your brand
- walking the unhappy path
- laying out the empty state
- choosing the words on the buttons
- wiring the prototype
- checking contrast and spacing
- pressure-testing the flow
- trimming a step out of the journey
- lining up the states: loading, empty, error
- making the default the right choice

### 05 Build

- reading the codebase first
- writing the change
- running the tests
- fixing a failing check
- wiring the endpoint
- reviewing the diff
- tightening an edge case
- rerunning the suite
- committing the change
- opening the pull request
- chasing a type error
- cleaning up after itself

### 06 Ship

- staging the release
- checking the rollout gates
- writing the changelog
- drafting the announcement
- preparing the rollback path
- tagging the release
- verifying the deploy
- notifying the channels
- watching the first minutes live
- confirming the flags are set
- closing out the release
- putting the receipt on record

### 07 Learn

- reading the first numbers
- comparing the outcome to the bet
- tracking the adoption curve
- separating novelty from habit
- reading what users did next
- checking whether the bet held
- flagging what surprised us
- writing the verdict
- feeding the result back to memory
- drafting the recap
- looking for the second-order effect
- closing the loop

### Per-agent flavor lines (layered on top of the stage deck)

Each cast agent gets three signature lines mixed into its stage deck so the roster feels like people, not a template. The Chief of Staff draws from its own deck at any stage.

| Agent (slug) | Signature lines |
| --- | --- |
| Watch (`discovery-scout`) | scanning the horizon; flagging what moved overnight; keeping an eye on the usual suspects |
| Research (`researcher`) | chasing the primary source; cross-checking two claims that disagree; reading past the headline |
| Listen (`customer-insights`) | reading between the tickets; counting how many said the same thing; pulling the exact quote |
| Prioritize (`strategist`) | making the trade explicit; asking what we'd drop to do this; ranking with yesterday's results in hand |
| Challenge (`critic`) | looking for the weakest link; asking who this breaks for; playing the skeptic on purpose |
| Draft (`prd-writer`) | writing the sentence twice to get it right; cutting a paragraph nobody needed; pinning down the fuzzy requirement |
| Plan (`sprint-planner`) | finding the smallest shippable slice; putting the risky work first; counting the dependencies |
| Design (`ux-architect`) | removing a click; making the error state say something useful; checking it holds up at a glance |
| Engineer (`builder`) | reading before writing; leaving the code better than it found it; naming things carefully |
| Review (`qa`) | trying to break it before users do; checking the diff twice; reading the tests as documentation |
| Announce (`release`) | saying what changed in plain words; leading with what it means for users; skipping the fanfare |
| Measure (`data-analyst`) | interpreting, not just counting; asking if the number would move anyway; reading the curve, not the point |
| Chief of Staff (`orchestrator`) | running the loop; lining up your next call; keeping the queue honest; deciding who moves next |

### Ambient bridge lines (between steps, any stage)

For gaps where no agent has claimed the next step yet: picking up where it left off; handing the work to the next agent; checking memory before starting; writing down what just happened; queuing the next step.

## 2. The button grammar

**The law (extends PC-28):**

- **Verb + object, sentence case, three words or fewer** ("Approve the spec", never "SUBMIT", never "OK").
- **One name per action, product-wide.** An act has exactly one verb everywhere it appears. The canonical registry below is the single source; nothing ships a synonym.
- **Consequence lives in helper text,** one plain line under or beside the button, naming what happens and who moves next. The button itself never carries the warning.
- **Every primary action has a paired toast:** past-tense receipt plus who moves next. Click and confirmation are designed together, never separately.
- **Destructive verbs are dry and exact** (ui-voice confirm pattern): "This deletes 3 runs. Continue?" Reversible acts get an Undo toast instead of a confirm.

### The canonical action registry

| Action id | Button | Helper text (the consequence) | Toast (the receipt) |
| --- | --- | --- | --- |
| `gate.approve` | Approve and run | Agents start the next stage the moment you approve. | Approved. Draft is on the spec now. |
| `gate.sendback` | Send back | Returns it with your notes. Nothing runs until it's revised. | Sent back. Draft is revising with your notes. |
| `gate.decline` | Decline | Closes this line of work. The decision is kept on record. | Declined. Logged with your reason. |
| `journey.start` | Start | Kicks off this journey from the stage you're on. | Started. Watch is reading your sources. |
| `journey.pause` | Pause | Agents finish the current step, then hold. | Paused. Work holds after the current step. |
| `journey.resume` | Resume | Picks up exactly where it stopped. | Resumed. Engineer is back on the change. |
| `journey.stop` | Stop the run | Ends this run. Finished work is kept; the rest is dropped. | Stopped. What finished is saved. |
| `run.retry` | Try again | Reruns the failed step with the same inputs. | Retrying. Same step, fresh attempt. |
| `source.connect` | Connect a source | Agents read it on the next sweep. Nothing is written back. | Connected. First sweep starts within the hour. |
| `spec.edit` | Edit the spec | Opens your version. Agents wait for you to finish. | Saved. Your edits are now the spec. |
| `ship.release` | Ship it | Deploys behind your gates. Rollback stays one click away. | Shipping. Announce drafts the changelog next. |
| `pr.merge` | Merge the change | Merges to your default branch after checks pass. | Merged. Ship is staging the release. |
| `composer.send` | Ask | The Chief of Staff routes it: an answer, an action, or a journey. | (no toast; the Thread itself is the receipt) |
| `memory.correct` | Correct this | Updates what the product believes. Future runs use your version. | Corrected. Memory updated. |
| `tour.start` | Show me around | Two minutes, skippable any time. | (no toast) |

Rule of thumb for extending the table: if two rows would need the same verb, they are the same action and merge into one id. If a new surface wants "Confirm", "Accept", or "Go", it takes the registry verb instead.

GAP: no product-wide action registry exists. Today the same act carries different labels across surfaces and nothing enforces one name per action. The registry above should ship as code (an `ActionSpec { id, button, helper, toast }` map next to `agent-vocabulary.ts`) with a CI check that primary buttons reference a registry id.

GAP: toasts are ad hoc today; there is no button-to-toast pairing contract, so some actions confirm and some go silent. The `ActionSpec` map closes this by construction.

## 3. The status sentence shapes

Four states, four fixed shapes. Every live surface (Spine, Working strip, Thread, cards) renders one of these; nothing invents a fifth.

### Machine working (machine color)

Shape: **actor + present-progressive + object + time.**

- "Draft is writing the spec for checkout autofill. About 4 minutes."
- "Engineer is fixing the failing check. Started 2 minutes ago."
- "Measure is reading the first week of numbers. Nearly done."

Time slot rules: use an estimate when the engine has one ("About 4 minutes"), elapsed when it doesn't ("Started 2 minutes ago"), and "Nearly done" only when the step is genuinely in its last phase. Never a fake countdown.

GAP: the run/step contract has no duration-estimate or expected-length field, so working lines cannot honestly say "about 4 minutes" today. Either add a per-step estimate (from historical step durations, which the engine already records) or the time slot stays elapsed-only.

### Needs you (ember)

Shape: **what waits + why it's your call + what approval sets in motion.** Ember is reserved for exactly this state.

- "Your call: ship the pricing test to 10% of users? Approving starts the rollout."
- "The spec is ready for you. Approve it and Plan breaks it into work."
- "Challenge found a real risk in this bet. Read the case, then decide."

### Blocked (plain, dry)

Shape: **plain reason + recovery verb.** No apology theater, no "Oops".

- "GitHub token expired. Reconnect to resume."
- "The test suite won't start: no test command is set. Add one in Settings."
- "Rate limit from your data source. Retrying at 3:40pm, or retry now."

### Done (the receipt, past tense)

Shape: **artifact + what's in it + the one next step.**

- "Spec drafted. 9 requirements, 2 open questions. Review it."
- "Shipped to production at 4:12pm. Rollback is one click for 24 hours."
- "Week read. The bet held: activation up where we predicted. See the verdict."

## 4. Empty and warm states

The PC-28 rule holds: honest, names who acts next, and when. Never a bare "No results".

| Surface | Line |
| --- | --- |
| Approvals tray, empty | Nothing needs you. The Chief of Staff will bring the next call here. |
| Approvals tray, empty, sweep scheduled | Nothing needs you. The next sweep is at 2am. |
| Thread, brand-new product | Tell me what you're building, or start with "What should we build next?" |
| Discover, no sources | Nothing to read yet. Connect a source and Watch starts on the next sweep. |
| Decide, no ranked bets | No bets ranked yet. Run Discover first, or hand Prioritize a candidate yourself. |
| Plan, no decision upstream | Nothing to spec yet. Decide on a bet and Draft picks it up from there. |
| Design, nothing in flight | Nothing being designed right now. Design starts when a spec is approved. |
| Build, no approved spec | Engineer is waiting on an approved spec. That's your gate to open. |
| Ship, nothing staged | Nothing staged. Ship wakes when a change is merged. |
| Learn, too early | Too early to read. Measure starts once the release has a day of traffic. |
| Brain, new workspace | Memory starts empty and fills as you decide. Your first approval writes the first entry. |
| Search, no hits | No matches for that. Try the product name or ask the Composer instead. |
| Quiet week (Learn digest) | A quiet week. Nothing shipped, nothing broke, memory unchanged. |

## 5. The delight budget (five, enterprise-fit, one each)

1. **First approval, once ever per user:** the Spine lights stage by stage as agents pick the work up, with the one-time caption "That approval just set three agents in motion." The signature moment the charter asks for, spent exactly once.
2. **Week in receipts:** a Monday Briefing card that reads like a sharp colleague's note: what shipped, what you decided, what held up, one honest line about what didn't. Dismissable, never modal.
3. **The bet held:** when Learn confirms an outcome, the original decision card gets a quiet ember check and the line "This call held up." The loop visibly closes on the artifact the user approved weeks earlier.
4. **First ship:** the changelog card carries the provenance line "Decided by you. Built by Engineer. Shipped 4:12pm." The user's name sits in the chain of receipts, once per release, no confetti.
5. **Milestone receipts, dry on purpose:** at the 10th, 50th, 100th approval, a single toast: "That's 100 calls made here. 84 held up." A stat, not a celebration; it lands because it's true.

Budget rule: five and no more; each fires from real state, never on a timer; each is skippable or dismissable; none uses decorative emoji.

## What Supaprod should steal

Concrete, implementable, in priority order:

1. **Claude Code's rotating spinner discipline, formalized.** Ship the section 1 decks as data: add `relayDeck: string[]` to `CatalogEntry`, add per-stage decks, and one `drawWorkingLine(stage, slug, seed)` helper with session-seeded no-repeat shuffle. Both the Working strip and the Spine consume it so they can never disagree.
2. **One `ActionSpec` registry as code, CI-enforced.** Port the section 2 table into a typed map beside `agent-vocabulary.ts`; a test walks rendered primary buttons (or a lint walks `Button` usages with an `action` prop) and fails on any label not in the registry. This is the mechanical enforcement of "one name per action" that PC-28 states but nothing checks.
3. **Linear's receipt tone for done states.** Past tense, counts, one next step ("Spec drafted. 9 requirements, 2 open questions. Review it."). Kill every "Success!" and every silent completion.
4. **Vercel's deploy-status grammar for the Working strip:** actor, verb, object, honest time. Add a per-step duration estimate to the run contract so "About 4 minutes" is real; fall back to elapsed time, never fake countdowns.
5. **Stripe's dry blocked-state copy:** reason plus recovery verb, no apology theater. Adopt the section 3 blocked shape as the only error shape outside the Engine Room.
6. **The ember contract as a copy rule, not just a color rule.** Ember text always answers three things: what waits, why it's yours, what approving sets in motion. Any ember string missing the third clause is a bug.
7. **Extend `ACTION_LABEL` into families.** Every registered tool id gets an outcome-named label at registration time (make it a required field on the tool registry entry) so "working" becomes the exception, not the default.

## GAP register (consolidated)

- GAP: no rotation infrastructure; one `relayVerb` per agent means the ticker visibly repeats within a session.
- GAP: `ACTION_LABEL` covers 10 tool ids and everything else renders "working"; label should be a required field on tool registration.
- GAP: no product-wide action registry; the same act carries different button labels across surfaces and nothing enforces one name per action.
- GAP: no button-to-toast pairing contract; some actions confirm, some complete silently.
- GAP: the run/step contract has no duration-estimate field, so working-state lines cannot honestly state remaining time.
- GAP: ember is defined as a color today, not a copy contract; needs-you strings are not required to say what approval sets in motion.
