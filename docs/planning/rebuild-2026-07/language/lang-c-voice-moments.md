# Language C: VOICE AND THE BRAND MOMENTS

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Lane C of the 2026-07-28 language sweep. Owns: the register, the person and tense grammar, how
> the machine names itself and the user, the five in-product brand moments, the working-state verb
> system, the receipt grammar, and where a tagline is allowed inside the product.
>
> Everything quoted as "now" was read out of this codebase on 2026-07-28 with a file and line
> number. Nothing here is quoted from a doc that describes the code.
>
> Lane A (naming) and Lane B (IA) own the nouns and the destinations. Section 12 is my handoff to
> them: where a noun decision changes a sentence, I say which sentence.

---

## 0. The one-paragraph thesis

The app does not have a voice problem. It has a **speaker** problem. Right now four different
speakers share one screen: a first-person-plural company (`"we will bring you the next
decision"`, `_authenticated.approvals.tsx:187`), a third-person brand (`"Supaprod keeps sensing
in the background"`, `_authenticated.today.tsx:1336`), a nameless machine (`"The agent is
unblocked"`, `_authenticated.today.tsx:616`), and thirteen named agents who almost never get
named at the moment they act (`action = "Working"`, `agents.functions.ts:114`). Fix the speaker
and the register follows almost mechanically. **One rule carries most of this document: every
sentence in the product is spoken by a named actor, and the actor is either a crew member or
you.**

---

## 1. Overrides and ratifications of the existing conventions

Both convention files exist and were read. I am not replacing them; I am tightening two rules and
extending the banned set.

| Existing rule | Source | Verdict |
| --- | --- | --- |
| No em or en dashes anywhere, authored or generated | `docs/conventions/humanized-output.md` | **Ratified, unchanged.** Hard gate. |
| No invisible or exotic-space Unicode | `humanized-output.md` | **Ratified, unchanged.** |
| Buzzword denylist (`seamless`, `leverage`, `unlock`, `elevate`, ...) | `ui-voice.md:24` | **Ratified**, and extended in §2.3. |
| Length budgets: H1 ≤ 6 words, subhead ≤ 14, button ≤ 3, toast ≤ 12, empty state ≤ 2 sentences | `ui-voice.md:11-18` | **Ratified**, plus: one sentence per line in any display lockup (founder law). |
| Sentence case except product and page names | `ui-voice.md:25` | **Ratified**, plus: crew names are proper nouns and always capitalized. |
| Confirm copy names the effect, never "Are you sure" | `ui-voice.md:27` | **Ratified, unchanged.** |
| "Human, clear, **lightly playful** in safe places (empty states, success toasts)" | `ui-voice.md:5` | **OVERRIDDEN.** See §1.1. |
| "Product texture: use our nouns (calls queue, the loop, decision card, Chief of Staff)" | `humanized-output.md:54` | **NARROWED.** See §1.2. |
| Tier 2 relaxation: internal docs and comments need no clean pass | `humanized-output.md:21` | **Ratified for docs. Suspended for the rebuild's UI strings**: in a from-zero rebuild every authored string is Tier 1 from the first keystroke, because there is no legacy sweep to defer it to. |

### 1.1 Override: playfulness is not a register, it is a budget of two

`ui-voice.md:5` licenses "lightly playful in safe places (empty states, success toasts)". That
licence produced `"Your queue is <em>clear.</em>"` (`_authenticated.today.tsx:1332`, an italic
flourish on a moss word) and `"All clear. The loop is running itself."`
(`obsidian/today/Hero.tsx:11`). Neither survives the founder's purpose test, and the second is not
even true when no run is live.

**New rule.** The product's default register is **dry and warm**: plain, specific, unhurried, never
charming. Personality is spent in exactly **two** places, and nowhere else:

1. **The working-state deck** (§7). Thirteen agents doing recognisable work is where the product
   gets to have a character.
2. **The cold-start headline** (§6.2). One line, once, on a workspace that has never held anything.

Every other empty state, toast, error, gate and label is plain. An empty state is not a joke slot;
it is the place you tell a person what is true and who moves next.

### 1.2 Narrowing: our nouns are the ones on screen, not the ones in the schema

`humanized-output.md:54` says to use "our nouns" and lists `mission` among them by implication
through the codebase. `agent-vocabulary.ts:44-51` already bans mechanism words outside the Engine
Room and names `mission` and `swarm` explicitly. The code contradicts the code:
`_authenticated.build.index.tsx:266` ships `"Mission running."` as a user toast,
`:372` ships the placeholder `"Mission title (optional)"`, `:635` ships `"Mission archived."`, and
`:965` ships the dialog title `"Delete this mission?"`.

**New rule.** "Our nouns" means the nouns that appear on the surface the reader is standing on.
A word that only exists in the database, the route table, or the engine is not our noun, it is our
plumbing. `mission`, `run`, `changeset`, `session`, `lane`, `swarm`, `station`, `face`, `arc`,
`eval`, `guardrail`, `drift`, `blast radius`, `fan-out` are **plumbing**. They are legal in the
Engine Room and in `aria-*` attributes for engineers, and illegal everywhere a PM reads.

---

## 2. THE REGISTER

Sharp PM. The voice of a very good staff PM writing to a peer at 8am: they already know the
context, they are not selling, they have the receipts, and they are not going to waste your
morning.

### 2.1 The do / do-not table

| # | Do | Do not | Live example of the failure |
| --- | --- | --- | --- |
| 1 | Name the actor first: `Engineer is writing the change.` | Use a nameless machine: `the agent`, `the system`, `the AI`, `your assistant` | `"Approved. The agent is unblocked."` (`today.tsx:616`) |
| 2 | Say `you` and `your` | Say `the user`, `users like you`, or the person's first name outside the one greeting | `"How Supaprod and your agents will greet you."` (`settings.tsx:3319`) |
| 3 | State what is true right now | Claim a standing property you cannot prove at that instant | `"The loop is running itself."` (`Hero.tsx:11`) with zero runs live |
| 4 | Use the object the person came for | Use the container it renders in | `"The activity lanes didn't load."` (`today.tsx:1445`) |
| 5 | One idea per sentence, two sentences max | Stack four clauses into one subtitle | `"Agents pick up approved specs, write the code, run the tests, and open the pull request. You appear only at the gates."` (`build.index.tsx:693`) |
| 6 | Put the consequence in helper text next to the button | Put the consequence inside the button label | `"Sign in · opens your workspace"` (`login.tsx:251`) |
| 7 | Verb + object, sentence case, 3 words max, on every button | Bare `Submit`, `OK`, `Go`, `Confirm`, or a sentence | `"Launch what we shipped"` (`faces.tsx:2228`) |
| 8 | Past tense with a named actor for anything finished | Present-perfect vagueness, or a status noun as a receipt | `"Mission running."` (`build.index.tsx:266`) |
| 9 | Present progressive with a named actor for anything running | A gerund with no subject: `Generating...`, `Drafting...` | `ChangesPanel.tsx:580,632,784` |
| 10 | Give a number when you have one | Give an intensity word: `several`, `many`, `a lot of`, `significantly` | (none live; hold the line) |
| 11 | Say the time you actually know | Invent a duration or a countdown | founder law: a 3-minute build "makes no logical sense" |
| 12 | Let a receipt state | Let a receipt grade: `successfully`, `cleanly`, `perfectly`, `Success!` | (none live; hold the line) |
| 13 | Say what broke and the one verb that fixes it | Apologise: `Oops`, `Sorry`, `Something went wrong`, `Hold on` | `title="Hold on, signing you in"` (`login.tsx:156`) |
| 14 | Use the middot only between peer fragments in a mono metadata line, max two per line | Use the middot inside a sentence as a dash substitute | `"you make the calls · Supaprod runs the rest"` (`AuthScaffold.tsx` default tagline) |
| 15 | End working labels with no punctuation | End them with `...` or `...` | `"Drafting today's brief..."` (`today.tsx:301`), `"Starting..."` (`build.index.tsx:571`) |
| 16 | Name the crew member who is waiting on you | Say `agents` or `AI` as a bare category | `"Give the agents a goal"` (`build.index.tsx:315`) |
| 17 | Use the engine's word in the Engine Room | Use the engine's word on a PM surface | `"Cap the blast radius of the tools this agent can call"` (`settings.tsx:2411`) |
| 18 | Write the same verb for the same act everywhere | Ship synonyms per surface: `Send back` here, `Rejected` there | `today.tsx:805` vs `approvals.tsx:41` |
| 19 | Keep subtext to two lines and let the artifact carry the specifics | Repeat in subtext what the headline already said | `build.index.tsx:691-693` |
| 20 | Cut the sentence if you cannot name who moves next | Ship a line that leaves the reader with nothing to do | `"New calls surface here first."` (`today.tsx:1336`) |

### 2.2 The three-question test (apply to every string before it ships)

1. **Who is speaking?** If the answer is not a crew member or the product's one whole-system voice
   (§4.3), rewrite.
2. **Who moves next, and when?** If the sentence does not answer it and is not a pure label,
   rewrite.
3. **Would this still be true if I read it out loud to the founder with the screen behind me?**
   If any clause could be contradicted by what is on screen, rewrite.

### 2.3 The banned set (extends `ui-voice.md:24-25`)

**Category words** (founder law, banned the moment he notices them): `operating system`, `chatbot`,
`copilot`, `assistant`, bare `AI`, bare `agents`, `agentic`, `autonomous` as an adjective on a
noun the user can see. Qualify or drop: `agents that ship real code` is legal, `agents` is not.

**Vendor and competitor names**: zero, anywhere in the authenticated app, including as analogies
and including in placeholder text.

**Machine tells**: `...` and `...` (any position), trailing `!`, `Oops`, `Sorry`, `Success!`,
`Something went wrong`, `Please wait`, `Hold on`, `Loading` as a *visible* word,
`Processing`, `Working` and `working` as a standalone label, `Are you sure`,
`Note that`, `Simply`, `Just`, `We recommend`.

**Person violations**: `we`, `us`, `our` (the product never speaks as a company inside the app;
see §4.3 for the two legal exceptions), `the user`, `users`, `folks`, `let's`.

**Plumbing nouns on PM surfaces**: `mission`, `run`, `changeset`, `session`, `lane`, `swarm`,
`station`, `face`, `arc`, `eval`, `guardrail`, `drift`, `blast radius`, `fan-out`, `queue depth`,
`checkpoint`, `trace` (the noun; `trace id` on a copy affordance is fine).

**Semicolons.** Not a fingerprint, but nobody speaks in semicolons. Two sentences or a middot.

---

## 3. PERSON, TENSE, AND SELF-REFERENCE

### 3.1 Person, by speaker

| Speaker | Person | Where it is legal | Example |
| --- | --- | --- | --- |
| A named crew member | Third person, named | Every working line, every receipt, every empty state that names who acts next | `Engineer is fixing the failing check.` |
| You | Second person | Everything addressed to the human | `Your call. Approving starts the rollout.` |
| Chief of Staff, in conversation only | **First person singular** | The composer / thread ONLY, where a human typed at it and expects a reply | `I read the last six weeks of tickets. Three themes hold up.` |
| Supaprod, the whole system | Third person, named, **max once per screen** | Acts no crew member owns: sweeps, memory consolidation, billing, retention, security | `Supaprod keeps every call on the record for 12 months.` |
| The company | First person plural | **Illegal in the app.** Legal only on `/privacy`, `/terms`, `/security`, and marketing routes | `We never read your source code.` (`privacy.tsx`) |

The first-person-singular licence is deliberately narrow: a reply to something you typed is a
conversation, and a conversation without an `I` is a worse lie than the `I`. Nothing outside the
composer gets it. The Chief of Staff never says `I` in a toast, a card, a header, or a receipt.

### 3.2 Tense, by state

| State | Tense | Shape | Example |
| --- | --- | --- | --- |
| Running | Present progressive | `{Actor} is {predicate}` | `Writer is tightening the acceptance criteria` |
| Waiting on you | Simple present, second person | `{what waits}. {why yours}. {what approving starts}` | `Engineer wants to open a pull request. Approving pushes the branch and opens it on your repo.` |
| Finished | **Simple past** | `{Actor} {verb}ed {object}{, evidence}. {time}` | `Writer drafted the checkout spec on 9 signals. 14 minutes ago` |
| Blocked | Simple present, then imperative | `{plain reason}. {recovery verb}.` | `Your GitHub token expired. Reconnect to resume.` |
| Scheduled | Simple present with a real clock | `{Actor} {verb}s {object} at {time}` | `Scout reads your sources again at 2am` |
| Nothing happening | Simple present, negative, then the trigger | `Nothing {verb}s yet. {Actor} starts when {condition}.` | `Nothing building yet. Engineer starts when you approve a spec.` |

**Banned tense moves.** No future without a real trigger or clock (`will soon`, `shortly`, `in a
moment`). No present perfect as a receipt (`has been approved`) because it hides who did it. No
passive voice anywhere a human or an agent did the thing.

### 3.3 How the machine refers to itself, in one table

| Situation | Say | Never say |
| --- | --- | --- |
| One agent is doing the work | `Engineer` | `the agent`, `the AI`, `Supaprod` |
| Several agents on one object | `Writer and Critic` (two), `The crew` (three or more) | `the agents`, `the swarm`, `the team` |
| The whole roster, as a body | `your crew` | `the agents`, `the fleet`, `the mesh` |
| A whole-system act nobody owns | `Supaprod` | `we`, `the platform`, `the system` |
| Talking about itself in a reply you asked for | `I` (composer only) | `Supaprod thinks`, `As an AI` |
| The record of what happened | `the record` | `the ledger` outside the Engine Room, `the audit trail`, `logs` |

**Collective noun ruling: `your crew`.** It is one syllable more than "agents", it is not a banned
category word, it survives the founder's qualification rule because it is concrete, it lets a
thirteen-agent roster be one thing, and it pairs with the individual names without a seam
(`your crew` -> `Engineer`). It is also the only collective in the running that does not read as
either a swarm or a product feature.

---

## 4. THE CREW: fixing the names so the sentences work

### 4.1 The collision, measured

`src/lib/agent-vocabulary.ts:197-360` names the cast with **verbs**: Watch, Research, Listen,
Prioritize, Challenge, Draft, Plan, Design, Engineer, Review, Announce, Measure, Chief of Staff.
Because they are verbs, they collide with three other vocabularies that are already live:

| Agent name | Collides with | The sentence that breaks |
| --- | --- | --- |
| `Plan` (`sprint-planner`) | Loop stage 03 `Plan` (`nav-model.ts:98`) | "Plan is planning the Plan stage." |
| `Design` (`ux-architect`) | Loop stage 04 `Design` (`nav-model.ts:106`) | "Design finished Design." |
| `Draft` (`prd-writer`) | The spec status `draft` (`today.tsx:655`, `savePrd({status:'draft'})`) | "Draft sent the spec back to draft." |
| `Review` (`qa`) | The approval mode `review` (`settings.tsx:2472`) and the button `Review it` | "Review needs review." |
| `Watch` (`discovery-scout`) | The Today door `Watch` (`today.tsx:1490`) and the lane `At risk / watch` | "Watch is in Watch." |
| `Challenge` (`critic`) | The object `assumption challenge` (`today.tsx:151`, "Open challenge") | "Challenge opened a challenge." |
| `Announce`, `Measure`, `Research`, `Listen`, `Prioritize` | All read as buttons under the §2.1 rule 7 button grammar | An agent name is indistinguishable from an action |

There is also a **live inconsistency**: `ColdStartOnramp.tsx` ships `"a signal Scout reads"` and
`"enough for Scout to find the first themes"`, but the catalog renamed `discovery-scout` to
`"Watch"`. The first-run screen names an agent that does not exist on screen.

### 4.2 The rule, and the roster

**THE RULE: a crew member is named for the person who does the job, never for the job.** An agent
name may never equal a stage name, a button verb, an object status, or a nav label. Mechanically:
take the role, use the `-er` form or the plain professional noun.

This is a **display rename only**. DB slugs are never renamed (the standing convention that kept
`agent_slug='builder'` alive across Builder -> Studio -> Build). Only `CatalogEntry.name` changes.

| Slug (frozen) | Now | **Ship** | Why |
| --- | --- | --- | --- |
| `discovery-scout` | Watch | **Scout** | Person noun, no collision, and the first-run copy already says Scout |
| `researcher` | Research | **Researcher** | Same word, made a person |
| `customer-insights` | Listen | **Listener** | Same |
| `strategist` | Prioritize | **Strategist** | The slug's own word is already the right person noun |
| `critic` | Challenge | **Critic** | Code and copy already say Critic (`today.tsx:128,695`, `criticEvidence`) |
| `prd-writer` | Draft | **Writer** | Frees `draft` back to being a spec status |
| `sprint-planner` | Plan | **Planner** | Frees `Plan` back to being stage 03 |
| `ux-architect` | Design | **Designer** | Frees `Design` back to being stage 04 |
| `builder` | Engineer | **Engineer** | Already correct |
| `qa` | Review | **Reviewer** | Frees `review` back to being the approval mode |
| `release` | Announce | **Herald** | Person noun, unmistakably one job, no verb collision. Fallback if it reads too literary: **Publisher** |
| `data-analyst` | Measure | **Analyst** | Plain, and it is what the slug says |
| `orchestrator` | Chief of Staff | **Chief of Staff** | Already correct, already the conductor |

Thirteen named crew members. The sentence test now passes at every stage:
`Planner is finding the smallest shippable slice.` `Writer is cutting a paragraph nobody needed.`
`Reviewer is checking the diff twice.` `Herald is saying what changed in plain words.`

### 4.3 Capitalisation and articles

- Crew names are proper nouns. Always capitalised, never `the`. `Engineer is writing`, not
  `The Engineer is writing`. `Chief of Staff` is the one two-word name and takes no article either.
- `your crew` is lowercase and always takes `your`, never `the`.
- `Supaprod` is capitalised, never possessive on a user's object (`your workspace`, never
  `Supaprod's workspace`).

---

## 5. WHERE A TAGLINE BELONGS INSIDE THE PRODUCT

### 5.1 The placement ruling

A tagline is a promise made to someone who has not bought yet. Inside the app the person has
already bought, so a tagline there is either noise or a claim the screen is about to contradict.
**The authenticated app carries a tagline in exactly one place: the door.**

| Surface | Tagline? | What carries the meaning instead |
| --- | --- | --- |
| Sign-in, sign-up, reset, invite accept (`AuthScaffold`) | **Yes, one.** Below the mark, above the form | the tagline |
| First run / workspace creation | No | a promise sentence about what happens to what you give it (§6.2) |
| Cold-start home | No | the on-ramp headline, one line, once |
| Home with nothing to do | No | a true state sentence naming the crew member still working |
| Every loop surface, Brain, Settings, Engine Room | No | the surface's own one-line subtitle (`nav-model.ts` taglines are good; keep them as subtitles, do not promote them) |
| Loading and boot | No | nothing. The mark turns. |
| Command palette, empty | No | `Try a verb, like challenge or connect.` (already right, `CommandPalette.tsx:280`) |
| Exported artifacts (PDF, changelog, shared spec) | No | a provenance footer (§9.4), which is the tagline's proof rather than its claim |
| Public landing and marketing | Yes | out of this lane's scope; the public canon is `Agents that know what to build, ship it, and remember.` |

**One consequence to enforce:** `nav-model.ts:60-63` calls its per-destination subtitle field
`tagline`. Rename the field to `subtitle` in the rebuild. Nothing in the app should have a field
called tagline except the auth scaffold, or the word will creep back onto surfaces.

### 5.2 The in-product tagline candidates

Now (`AuthScaffold.tsx`, default prop): `you make the calls · Supaprod runs the rest`

Constraints: one line at 360px, sentence case, no middot-as-dash, no banned category word, no
vendor name, true on the day a user first sees it.

| # | Candidate | Register read |
| --- | --- | --- |
| **A (ship this)** | **You make the calls. Your crew runs the rest.** | Minimal change from the line that already exists, fixes the two style tics (lowercase opening, middot as a dash), and swaps the brand name for the thing the user is about to meet. Both halves are literally true on day one. |
| B | Your crew has been working. | Short, warm, and it is the exact state a returning user is in. Weaker on a first-ever sign-in, so it needs a sign-up variant. |
| C | Agents that ship real code, and stop at your gates. | Uses the founder's own approved qualified phrasing. Two clauses, slightly long for 360px. |
| D | You judge. Your crew builds. | Very sharp, very short. Loses the "remember" layer entirely. |
| E | Every call on the record. | Leads with the ledger. Strong for an enterprise buyer, cold for a first-time PM. |
| F | Signal in. Shipped out. Remembered. | Rejected: triple-pattern listicle, explicitly banned by `ui-voice.md:25`. Listed so nobody proposes it again. |

**Decision: A.** `You make the calls. Your crew runs the rest.`
Sign-up variant of the value line under it (`login.tsx:117` currently ships a three-noun list):
`Your crew kept working. Sign in to see what needs you.` and on sign-up
`Point it at your sources and your crew starts reading.`

---

## 6. THE FIVE BRAND MOMENTS

Five moments where the product speaks with a personality rather than labelling something. Each
gets exact copy. Anything not listed here is a label and gets §2's plain register.

### 6.1 Moment 1: the door (sign-in)

| Slot | Now | Ship |
| --- | --- | --- |
| Tagline | `you make the calls · Supaprod runs the rest` (`AuthScaffold.tsx`) | `You make the calls. Your crew runs the rest.` |
| Title | `Welcome back` (`login.tsx:106`) | `Welcome back` (keep; it is the one correct greeting in the app) |
| Value line | `Sign in to your decision workspace. Your calls, the receipts, and the loop, in one place.` (`login.tsx:117`) | `Your crew kept working. Sign in to see what needs you.` |
| Google button, idle | `Continue with Google` | keep |
| Google button, busy | `Opening Google` (`login.tsx:161`) | keep. Correct shape already: verb + object, no ellipsis |
| Submit, idle | `Sign in · opens your workspace` (`login.tsx:251`) | `Sign in` |
| Submit, busy | `Signing in` (`login.tsx:248`) | keep |
| Disabled tooltip | `Hold on, signing you in` (`login.tsx:156`) | `Signing in` |
| Success toast | `toast.success("Welcome back")` (`login.tsx:76`) | **delete.** It fires as `window.location.assign` navigates away, so it is a toast nobody reads. The workspace appearing is the confirmation |
| Footer help | `Trouble signing in? Ask your workspace admin to check your invite.` | keep |

### 6.2 Moment 2: first run (a workspace that has never held anything)

`ColdStartOnramp.tsx` already replaces the hero on a genuinely cold workspace, self-gated on
`getColdStart`. Its bones are right. Three fixes.

| Slot | Now | Ship |
| --- | --- | --- |
| Headline (the one Pixel moment) | `Give your agents something to read.` | `Give your crew something to read.` (bare "agents" is banned; "crew" is the collective) |
| Promise line (new, replaces nothing) | none | `Whatever lands here, Scout reads it and brings you the first themes. You decide what is worth building.` Two sentences, and it is the first-run stand-in for a tagline |
| Step 1 body | `...Every piece of feedback that lands becomes a signal Scout reads.` | keep verbatim. Under the §4.2 roster this becomes correct again; today it names an agent the catalog no longer has |
| Step 2 body | `A dozen is enough for Scout to find the first themes.` | keep verbatim, same reason |
| Step 3 body | `Link a tool you already live in so signals flow in on their own. One click per source, no keys to paste.` | keep |
| Step titles | `Open the ingest door` / `Or paste a few by hand` / `Connect a source` | `Point a source at it` / `Or paste a few by hand` / `Connect a tool you already use`. "Ingest door" is plumbing |

**First-approval moment (spend it exactly once, ever, per user).** After the first gate a user ever
answers, one line under the hero, dismissable, never modal, no confetti:
`That was your first call. Engineer picked it up 4 seconds later.` The second number must be real
elapsed or the line does not render.

### 6.3 Moment 3: home with nothing to do

This is the moment the product is most likely to lie. `Hero.tsx:11` currently ships
`All clear.` + ` The loop is running itself.` on a workspace where nothing may be running at all.

**Rule: the all-clear line branches on whether a run is actually live.** Three states, three lines.

| Real state | Lead (Pixel) | Tail |
| --- | --- | --- |
| Nothing pending, at least one run live | `All clear.` | ` Engineer is on the checkout change.` (the newest live actor and object, from the same query that feeds the ticker) |
| Nothing pending, nothing running, sources connected | `All clear.` | ` Nothing is running. Scout reads your sources again at 2am.` (real next sweep time or the clause is dropped) |
| Nothing pending, nothing running, nothing connected | `Quiet.` | ` Nothing is connected yet. Give your crew something to read.` (doors into the on-ramp) |

Judgment-lane empty card, now `"New calls surface here first. Supaprod keeps sensing in the
background."` (`today.tsx:1336`), becomes:
`Nothing needs you. Scout is still reading your sources; the next call lands here.`
without the semicolon: **`Nothing needs you. The next call lands here.`** plus, on its own mono
line, the honest schedule: `Scout reads again at 2am`.

Approvals empty state, now `"Nothing needs you."` + `"Agents are working; we will bring you the
next decision."` (`approvals.tsx:187,225`), becomes:
`Nothing needs you.` + `Engineer is writing the change. The next call lands here.`
and when nothing is running at all: `Nothing needs you. Nothing is running either.`

The page subtitle `"Everything that needs you. Nothing that doesn't."` (`approvals.tsx:201`) is the
best sentence in the app. Do not touch it.

### 6.4 Moment 4: while the crew is working

Owned in full by §7.

### 6.5 Moment 5: the receipt

Owned in full by §9.

---

## 7. WORKING-STATE LANGUAGE

### 7.1 What already exists, and what is wrong with it

`src/lib/mission-vocabulary.ts` already ships the right machine: seven stage decks of twelve
present-progressive predicates, thirteen sets of per-agent signature lines, five ambient bridge
lines, a session-seeded Fisher-Yates shuffle with no repeat until the deck is exhausted, an `avoid`
list so two surfaces cannot show the same line, and `drawWorkingLine(stage, slug, seed)`. **Ratify
all of it and carry it into the rebuild unchanged.** It is the strongest voice asset in the repo.

Four things defeat it in practice:

| Defect | Evidence | Fix |
| --- | --- | --- |
| The global ticker never uses it | `agents.functions.ts:114` sets `let action = "Working"` and `:131` `"Starting up"`, and only overrides from `stepLabel` | The ticker draws from the deck, always |
| `stepLabel` falls back to a single word | `agent-vocabulary.ts:773-777` returns `"working"` / `"thinking"` / `"starting up"` | No generic fallback ships. See §7.3 |
| `ACTION_LABEL` covers ten tool ids | `agent-vocabulary.ts:759-770` | Outcome label becomes a **required field on tool registration**, with a CI check |
| Faces hardcode the word | `faces.tsx:89` `{kind:"working", label:"Working"}` | Draw from the deck with the stage it already knows |

### 7.2 Where personality is allowed, and where it is a lie

A rotating verb deck is only honest when a named agent is genuinely doing multi-second cognitive
work. A CSV export is not thinking.

| Kind of wait | Deck? | What shows |
| --- | --- | --- |
| An agent running a step in the loop | **Yes** | `{Actor} is {deck line}` |
| An agent between steps, no owner yet | Yes, bridge deck only | `handing the work to the next agent` |
| The composer thinking about your message | Yes, Chief of Staff deck | `Chief of Staff is checking memory before starting` |
| A file export, a settings save, a search, a billing call, sign-in, a page fetch | **No** | plain, fixed, one string. §7.6 |
| A skeleton while data loads | **No** | no text at all. The skeleton is the state. `aria-label` only |

### 7.3 The fallback ladder (replaces every generic string)

When a working line must render, resolve in this order and **never** reach a generic word:

1. **The real object, if the engine knows it.** `Engineer is fixing the failing test in checkout.ts`
2. **The tool's registered outcome label.** `Engineer is opening a pull request`
3. **The agent's signature deck.** `Engineer is reading before writing`
4. **The stage deck.** `Engineer is running the tests`
5. **The bridge deck** (stage unknown, agent known). `Engineer is picking up where it left off`
6. **No label at all** (nothing known). The mark turns, alone. Never a word.

`"Working"`, `"working"`, `"Processing"`, `"Loading"`, `"Starting up"`, `"Generating"`,
`"Please wait"` never render. If step 6 is reached, silence is more honest than a placeholder.

### 7.4 The duration ladder (what the line grows into)

Rotating verbs forever imply progress that may not exist. The line escalates on real elapsed time
and stops rotating when the underlying step stops moving.

| Elapsed | What shows | Rotating? |
| --- | --- | --- |
| 0 to 2.5s | The mark turning. No text | n/a |
| 2.5s to 25s | `{Actor} is {line}` | Yes |
| 25s to 2min | `{Actor} is {line}` + elapsed, mono, dim: `1m 04s` | Yes |
| 2min to 10min | + step position: `step 4` | Yes |
| over 10min | + one honest line: `This one is long. It keeps running if you leave.` + a `Stop` affordance | Yes |
| step unchanged for 3 rotations | **Holds the last line.** Stops rotating | **No** |
| step unchanged for 8min | Replaces the line: `Nothing has moved for 8 minutes.` + `Stop` and `Try again` | No |

**Timing.** A line changes when the underlying step changes, or after 6s if the step has not
changed, whichever is later. Minimum dwell 4s so it does not read as a slot machine. Never a
countdown, never an ETA, unless the run contract carries a real per-step estimate (it does not
today, so: elapsed only).

### 7.5 Placement and yield

| Placement | What it shows | Yields to |
| --- | --- | --- |
| Global ticker (top bar, `LivePulse.tsx`) | The newest live actor and predicate, no object title | Anything below it on the same object |
| Object strip (on the artifact being worked) | Actor, predicate, real object, elapsed | nothing; it is the most specific |
| Spine / stage marker | Actor initial + a dot. No words | always |
| Card row in a list | Actor + predicate, truncated, no elapsed | the object strip if open |
| Composer / thread | Full sentence with terminal period: `Chief of Staff is reading past outcomes for a precedent.` | nothing |

**One shimmer per screen.** If two placements are live on the same object, the more specific one
renders the words and the other renders the mark alone. The `avoid` parameter on
`drawWorkingLine` already prevents two identical lines; the yield rule prevents two competing ones.

**No terminal punctuation** in the ticker, strips, spine, or cards. A full sentence with a period
only in the composer and in toasts.

### 7.6 The plain waits (no personality, ever)

| Situation | Now | Ship |
| --- | --- | --- |
| Sign-in submit | `Signing in` (`login.tsx:248`) | keep |
| OAuth redirect | `Opening Google` (`login.tsx:161`) | keep |
| Export | `Preparing your export` (`DataExportCard.tsx:108`) | keep |
| Agent bundle export | `Preparing your bundle` (`SkillsFileExportCard.tsx:62`) | keep |
| Start a build | `Starting...` (`build.index.tsx:571`) | `Starting` |
| Delete | `Deleting...` (`build.index.tsx:982`) | `Deleting` |
| Any settings save | (varies) | `Saving` |
| Any data fetch behind a skeleton | `headline = "Loading"` (`HealthCard.tsx:45`) | no visible text. `aria-label="Loading your calls"` only |

`Loading` is legal in `aria-label` and `aria-busy` because it is the assistive-technology idiom.
It is never legal on screen.

---

## 8. THE ACTION VOCABULARY (one verb per act, product-wide)

The same act ships two different verbs today: `today.tsx:805` says `Send back`,
`approvals.tsx:41` says `Rejected`. Both fire on the same gate. One name per act, enforced.

| Act | Button | Helper (the consequence) | Toast (the receipt) |
| --- | --- | --- | --- |
| Approve a gate | `Approve` | `{Actor} runs it the moment you approve.` | `Approved. Engineer is running it now.` |
| Send it back | `Send back` | `Returns it with your note. Nothing runs until it is revised.` | `Sent back. Writer has your note and is revising.` |
| Decline for good | `Decline` | `Closes this line of work. Your reason stays on the record.` | `Declined. Your reason is on the record.` |
| Defer | `Later` | `It comes back in 24 hours.` | `Set aside. It comes back tomorrow.` |
| Keep a bet | `Keep` | `Moves it to Now on the roadmap.` | `Kept. It moves to Now on the roadmap.` |
| Drop a bet | `Drop` | `Drops it from the backlog. Critic's concern stays on the record.` | `Dropped. Critic's concern stays on the record.` |
| Start work | `Start` | `Your crew plans the steps and runs them.` | `Started. Engineer is reading the repo.` |
| Stop a run | `Stop` | `Ends the run. Finished work is kept.` | `Stopped. What finished is saved.` |
| Retry | `Try again` | `Reruns the failed step with the same inputs.` | `Retrying. Same step, fresh attempt.` |
| Connect a source | `Connect` | `Scout reads it on the next sweep. Nothing is written back.` | `Connected. Scout reads it at 2am.` |
| Adopt a method | `Adopt` | `Adds it to the record with its source learnings.` | `Adopted. It is on the record with 4 learnings behind it.` |
| Correct memory | `Correct this` | `Future runs use your version.` | `Corrected. Your version is what the brain believes now.` |

Rules: if two rows would want the same verb they are the same act and merge. If a new surface wants
`Confirm`, `Accept`, `OK`, `Submit` or `Go`, it takes the registry verb instead. Every primary
action has a paired toast; the button and its receipt are written together, never separately.

---

## 9. HOW A RECEIPT READS

The brief's requirement: which agent, when, on what evidence, and it must feel like confidence
rather than noise. Noise is what you get when provenance is dumped; confidence is what you get when
provenance is **ordered, one clause deep, and always openable**.

### 9.1 The grammar

```
{Actor} {past-tense verb} {object}{, on {N} {evidence noun}}. {time}   [{trace}]
```

- **Actor first.** The sentence opens with who. This single rule is what turns provenance from
  metadata into a statement.
- **Exactly one evidence clause**, always a count, always a door. `on 9 signals`, not a list of
  nine signals. Clicking the count opens them.
- **Time last**, in the prose. Relative under 7 days (`14 minutes ago`), absolute after
  (`14 Jul, 4:12pm`). Ship and spend events are always absolute.
- **Ids are never in the prose.** The trace ref lives in a dim mono tail with copy-on-click, which
  `today.tsx:761-772` and `CallDetailSheet.tsx:560` already do correctly. Keep that anatomy.
- **No adverbs of quality.** `successfully`, `cleanly`, `automatically` are banned. A receipt
  states; it does not grade.
- **Supersession is in the same line, never silent.** `Superseded by Writer's revision, 2 days ago`
  is part of the receipt or the record is not trustworthy.
- **Money appears only where a human authorised spend.** `today.tsx:801` (`$0.42 so far on this
  call`) is the correct placement: on the gate the human is about to answer. Never on an activity
  row nobody authorised.

### 9.2 The believability floor (founder law: a 3-minute build makes no logical sense)

| Rule | Effect |
| --- | --- |
| A build-class receipt whose real elapsed is under 60 seconds shows **step count, not duration** | `Engineer wrote the change in 6 steps.` never `Engineer built it in 47 seconds.` |
| Durations are never rounded up to look substantial, and never down to look fast | render real elapsed or render nothing |
| A count of zero is stated, never hidden | `on 0 signals` renders as `with no signals behind it`, and that receipt is a warning, not a receipt |
| A timestamp that would imply impossible parallelism is not rendered | if two agents show the same second on the same object, collapse to one line with both actors |

### 9.3 The three densities

**Line** (activity strips, Today, list rows). Actor, act, object, relative time. No id, no cost.
```
Engineer opened a pull request on checkout autofill.   12 minutes ago
Scout clustered 34 signals into 3 themes.               6 hours ago
You approved the pricing spec.                          yesterday
```

**Card** (call detail, artifact header). Adds the evidence door, the model when a human is about
to authorise spend, and the absolute time on hover.
```
Writer drafted the checkout spec, on 9 signals.          14 minutes ago
  Evidence      9 signals, 2 customer quotes        >
  Model         (only on a gate the human is answering)
  Spend so far  $0.42                              (only on a gate)
```

**Record** (the ledger). Adds the trace id, the verification state, and the full chain, in mono.
```
Writer  drafted  checkout-spec           14 Jul 09:41   PRD·4c9a  [copy]
You     approved checkout-spec           14 Jul 10:02   APR·77e1  [copy]
Engineer opened  PR #418                 14 Jul 10:02   MIS·1b30  [copy]
                                          verified  ✓
```

### 9.4 The provenance footer (the tagline's proof, on anything that leaves the app)

Any exported or shared artifact carries one line, no tagline, no logo lockup, no marketing:
```
Decided by you. Drafted by Writer on 9 signals. Shipped 14 Jul, 4:12pm.
```
This is the one place the product's whole claim is stated, and it is stated entirely in facts.

### 9.5 The anti-patterns, named

| Anti-pattern | Why it reads as noise | Instead |
| --- | --- | --- |
| Leading with the id or the trace ref | The reader parses a hash before a fact | Actor first, id in the mono tail |
| Dumping every source inline | Nine sources is a wall, not evidence | one count, one door |
| Repeating the receipt in three places on one screen | The founder's purpose test kills it | one receipt per object per screen |
| `successfully completed` | Grading, and two words for zero information | the past-tense verb alone |
| A cost on a row the user never authorised | Reads as a meter running against them | cost only on gates and in the Engine Room |
| A receipt with no actor (`Mission archived`) | Provenance with the provenance removed | `You archived it.` or `Supaprod archived it after 90 days.` |

---

## 10. TWENTY-TWO BEFORE AND AFTER REWRITES

Every "now" was read from the file and line given, this session.

| # | File:line | Now | Ship | Why |
| --- | --- | --- | --- | --- |
| 1 | `components/supaprod/AuthScaffold.tsx` (tagline default) | `you make the calls · Supaprod runs the rest` | `You make the calls. Your crew runs the rest.` | Lowercase opening and a middot standing in for a dash are style tics, not a voice. Two sentences. Names the thing the user is about to meet |
| 2 | `routes/login.tsx:117` | `Sign in to your decision workspace. Your calls, the receipts, and the loop, in one place.` | `Your crew kept working. Sign in to see what needs you.` | "decision workspace" is a category word; the three-noun list is the banned listicle rhythm. Replace a feature list with a state |
| 3 | `routes/login.tsx:251` | `Sign in · opens your workspace` | `Sign in` | Consequence belongs in helper text, never inside the label. A sign-in button's consequence is not in doubt |
| 4 | `routes/login.tsx:156` | `title="Hold on, signing you in"` | `title="Signing in"` | "Hold on" is filler and reads as an apology. A tooltip is not a tone slot |
| 5 | `routes/login.tsx:76` | `toast.success("Welcome back")` | delete | It fires as `window.location.assign(dest)` navigates away. A toast nobody can read fails the purpose test |
| 6 | `components/obsidian/today/Hero.tsx:11` | `All clear.` + ` The loop is running itself.` | branch on real state (§6.3): ` Engineer is on the checkout change.` / ` Nothing is running. Scout reads your sources again at 2am.` / ` Nothing is connected yet.` | The current tail is a standing claim rendered with zero runs live. Copy must branch on what is true |
| 7 | `routes/_authenticated.today.tsx:1336` | `New calls surface here first. Supaprod keeps sensing in the background.` | `Nothing needs you. The next call lands here.` + mono line `Scout reads again at 2am` | "surface" is a mechanism verb, "keeps sensing" is unfalsifiable, and neither says who moves next |
| 8 | `today.tsx:301` | `Drafting today's brief...` | `Chief of Staff is drafting your brief` | Ellipsis banned; no actor; "your" beats "today's" on a screen called Today |
| 9 | `today.tsx:616` | `Approved. The agent is unblocked.` | `Approved. Engineer is running it now.` | A receipt names who moved. "The agent" is the nameless machine |
| 10 | `today.tsx:617` | `Sent back. Nothing runs without you.` | `Sent back. Writer has your note and is revising.` | The second clause is a slogan sitting in a receipt slot |
| 11 | `today.tsx:1445` | `The activity lanes didn't load.` | `Last night's activity didn't load.` | "Activity lanes" is the internal layout name. Name what the reader wanted |
| 12 | `routes/_authenticated.approvals.tsx:187` | `Agents are working; we will bring you the next decision.` | `Engineer is writing the change. The next call lands here.` | The product never says "we"; bare "agents" is banned; nobody speaks in semicolons |
| 13 | `approvals.tsx:41` | `Rejected. Noted for next time.` | `Sent back. Writer has your reason on record.` | "Rejected" is a synonym for the registry verb `Send back`; "noted for next time" claims learning with no evidence |
| 14 | `routes/_authenticated.build.index.tsx:266` | `Mission running.` | `Started. Engineer is reading the repo.` | "Mission" is plumbing; a receipt opens with what happened, not an object's status |
| 15 | `build.index.tsx:268` | `Mission running · 1 approval waits for you.` | `Started. One call already waits on you.` | Same, plus the middot is doing sentence work |
| 16 | `build.index.tsx:693` | `Agents pick up approved specs, write the code, run the tests, and open the pull request. You appear only at the gates.` | `You appear only at the gates.` | Four clauses restating the headline `Approved specs in, merged PRs out.` Subtext is capped at two lines and never carries what the artifact owns |
| 17 | `build.index.tsx:315` | `Give the agents a goal` / `Plain language in. The agents plan the steps and run them.` | `Describe the goal` / `Plain words in. Your crew plans the steps and runs them.` | Bare "agents" twice; "give the agents" puts the human in service of the machine |
| 18 | `build.index.tsx:635` | `Mission archived. Its decisions stay in Memory.` | `Archived. The decisions stay in the brain.` | Plumbing noun, and "Memory" is one of three live names for one concept (handoff, §12) |
| 19 | `routes/_authenticated.settings.tsx:3319` | `How Supaprod and your agents will greet you.` | `What your crew calls you.` | Names the brand and a banned category in seven words, in future tense, for something already true |
| 20 | `settings.tsx:2411` | `Cap the blast radius of the tools this agent can call` | `Limit how far this agent's tools can reach` | "Blast radius" is Engine Room language on a settings row a PM reads. Same fix on `CallDetailSheet.tsx:315` (`Blast radius` -> `Reach`) |
| 21 | `components/mission/faces.tsx:2227` | `Nothing shipped yet. When a build is green, Ship stages the release and drafts the launch kit for your review.` | `Nothing shipped yet. Herald stages the release once a build is green.` | 21 words, two mechanism clauses, and it uses the stage name `Ship` as an actor, which is exactly the collision §4 removes |
| 22 | `faces.tsx:2228` | `actionLabel: "Launch what we shipped"` | `Announce the release` | "we" is banned; a button is verb plus object |
| 23 | `components/mission/faces.tsx:89`, `lib/agents.functions.ts:114,131`, `lib/agent-vocabulary.ts:775-777` | `label: "Working"`, `action = "Working"`, `"Starting up"`, `"working"`, `"thinking"` | draw from the deck; if nothing is known, render the mark with no text (§7.3) | One word on thirteen agents is the exact failure this lane exists to kill |
| 24 | `components/studio/ChangesPanel.tsx:580,632,784` | `Generating...`, `Drafting...`, `Generating note...` | `Writer is drafting the note` (deck-drawn), no ellipsis | Subjectless gerunds with banned punctuation |
| 25 | `components/settings/HealthCard.tsx:45` | `headline = "Loading"` | no visible headline; skeleton only, `aria-label` carries it | "Loading" never renders on screen |
| 26 | `components/mission/MissionOnboarding.tsx:138` | `Or tour a workspace we already filled` | `Or look around a workspace with real work in it` | "we" |
| 27 | `today.tsx:1507` | SlideOver title `At risk / watch` | `At risk` | A slash in a title is two names for one thing |

### 10.1 Already right. Do not touch.

| File:line | String | Why it is the target |
| --- | --- | --- |
| `approvals.tsx:201` | `Everything that needs you. Nothing that doesn't.` | Two sentences, a promise and its limit, zero mechanism. The register's high-water mark |
| `settings.tsx:2472-2474` | `needs review` / `asks first` / `runs alone` | Three postures in seven words, each unambiguous, none jargon |
| `today.tsx:1401` | `{n} answered · {m} open` | Two real numbers, no shifting denominator, correct middot use |
| `today.tsx:647` | `Set aside. It returns in 24 hours.` | Receipt plus a real, checkable promise |
| `faces.tsx:268` | `Nothing to read yet. Connect a source and Watch starts on the next sweep.` | Correct empty-state shape. Only the agent name changes (`Watch` -> `Scout`) |
| `CommandPalette.tsx:280` | `Try a verb, like challenge or connect.` | Teaches by example in six words |
| `nav-model.ts:78` | `What needs you now.` | The best destination subtitle in the file |
| `login.tsx:145` | `Trouble signing in? Ask your workspace admin to check your invite.` | Names the real recovery path, not a support address |

---

## 11. WHAT SHIPS AS CODE

The rebuild should make most of this unbreakable rather than reviewable.

| Artifact | Contract |
| --- | --- |
| `src/lib/voice/crew.ts` | The thirteen display names from §4.2, keyed by frozen slug. The single source; nothing hardcodes an agent name in a string |
| `src/lib/voice/decks.ts` | `mission-vocabulary.ts` carried over unchanged, plus the bridge deck as the level-5 fallback and a `drawWorkingLine` that **cannot return a generic word** |
| `src/lib/voice/actions.ts` | The §8 table as `ActionSpec { id, button, helper, toast }`. Primary buttons take an `action` id, never a raw label |
| `src/lib/voice/receipt.ts` | `formatReceipt(actor, verb, object, evidence?, time)` implementing §9.1 and the §9.2 believability floor. Nothing composes a receipt by hand |
| `src/lib/voice/waits.ts` | The §7.6 plain-wait strings. Fixed, non-rotating, no personality |
| Tool registry | An outcome label becomes a **required** field on every registered tool, so `ACTION_LABEL`'s ten entries become full coverage by construction |
| `nav-model.ts` | Field `tagline` renamed to `subtitle` (§5.1) |

### 11.1 CI checks (all cheap, all mechanical)

1. **Banned literal scan** over `src/**/*.{ts,tsx}` string literals, excluding `*.test.*` and
   `engine-room/**`: `...`, `...`, `Working`, `working` (standalone), `Processing`, `Loading`
   (outside `aria-`), `Oops`, `Sorry`, `Success!`, `Please wait`, `Are you sure`, `\bwe\b`,
   `\bour\b`, `the user`, `mission`, `swarm`, `blast radius`, `changeset`, the buzzword denylist,
   em and en dashes, the invisible-character set.
2. **Agent-name scan**: no string literal may contain a crew display name except through
   `crew.ts`. Catches the `Scout` / `Watch` drift that is live today.
3. **Button scan**: every `variant="primary"` button resolves an `action` id from `actions.ts`.
4. **Toast pairing**: every `ActionSpec` has a non-empty `toast`, or an explicit
   `toast: null` with a one-line reason in a comment.
5. **Middot scan**: no more than two `·` per string literal, and none adjacent to a lowercase word
   that starts a clause (catches the `AuthScaffold` tagline shape).

---

## 12. HANDOFF

### 12.1 To Lane A (naming): nouns I need decided, and the sentences that move when you decide

| Collision | What I need | What changes in my lane |
| --- | --- | --- |
| Nav says `Pulse`, URL is `/engine-room`, code and docs say `Engine Room` (`nav-model.ts:147`) | **One word.** My preference: `Pulse` in the nav and the URL, `Engine Room` retired entirely, because "the machine's vital signs" is a voice the deck can speak and "engine room" is a metaphor nobody says out loud | Every mechanism-word exemption in §2.3 is scoped to "the Engine Room". Rename it and I rescope to "Pulse" verbatim |
| `/artifacts` vs the founder's `Library` ruling | One word | Receipt objects (`§9.3`) name where a thing landed. Today they cannot |
| `Memory` vs `Brain` vs `Knowledge` (`/brain` live, `/memory` and `/knowledge` redirect, Settings has its own `Memory`) | One word | Rewrite #18 (`build.index.tsx:635`), the Settings footer note `Looking for Memory? It lives in Brain now.`, the action `memory.correct` toast, and the §9 "the record" ruling all take your word |
| `Missions` / `Builds` / `Runs` / `Changesets` / `Sessions` | One user-facing noun; the other four are plumbing under §1.2 | Rewrites #14, #15, #18 and the dialog `Delete this mission?` |
| Crew display names | §4.2 is mine to decide and I have decided it. **What I need from you: confirm no stage, destination, or nav label in your IA equals `Scout, Researcher, Listener, Strategist, Critic, Writer, Planner, Designer, Engineer, Reviewer, Herald, Analyst, Chief of Staff`.** `Herald` is the one I would trade first; fallback `Publisher` | The whole working-state and receipt system renders these names |

### 12.2 To Lane B (IA)

- `/decide`, `/ship` and `/learn` own no queries. If they survive as destinations they still need
  honest empty states; §6.3's shape (`Nothing {verb}s yet. {Actor} starts when {condition}.`) works
  for all three and is the only thing that makes a stage-shaped destination readable when it owns
  nothing. If they are collapsed, three empty-state strings disappear and nothing else in my lane
  moves.
- The all-clear branch in §6.3 needs one query that answers "is anything actually running", which
  `getLiveActivity` already provides. Whatever the home surface becomes, keep that read on it or
  the hero goes back to lying.
- `nav-model.ts`'s per-destination `tagline` field is a subtitle. If your IA keeps a rail, keep
  the subtitles and rename the field (§5.1).

### 12.3 What this lane holds regardless of what A and B decide

The speaker rule (§3), the register table (§2.1), the crew naming rule (§4.2, the rule if not the
exact roster), the fallback ladder (§7.3), the duration ladder (§7.4), the action registry shape
(§8), and the receipt grammar (§9.1) are all noun-independent. They can be implemented before the
naming decisions land.
