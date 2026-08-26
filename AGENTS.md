# AGENTS.md, the build manual

> _Last updated: 2026-08-03_

**This file holds the rules for building Supaprod.** It is tool-agnostic and canonical: Claude Code, Antigravity, Gemini CLI, Codex, Cursor and Lovable all work from it. Per-tool notes live in [`CLAUDE.md`](./CLAUDE.md) and [`GEMINI.md`](./GEMINI.md), and those files only *point* here.

For what the product is and where every other document lives, read [`README.md`](./README.md).

**If a rule here conflicts with an older document anywhere in the repo, this file wins.**

---

---

## ⇢ THE ACTIVE MISSION LIVES IN [`the-first-run/`](./the-first-run/README.md)

**Read [`the-first-run/START-HERE.md`](./the-first-run/START-HERE.md) before doing anything on this
repo.** Since 2026-08-25 the platform is being **transformed, not extended**, and three lanes are
building against one backlog. Anything below that predates it is still true about the product; it is
not the current plan.

| File | What it settles |
| --- | --- |
| [`START-HERE.md`](./the-first-run/START-HERE.md) | What we are doing and why, in one page |
| [`RULINGS.md`](./the-first-run/RULINGS.md) | **THE TIEBREAKER — R-01…R-20. If any two documents in this repo disagree, it wins.** Its OPEN list is what nobody may decide alone |
| [`BUILD-QUEUE.md`](./the-first-run/BUILD-QUEUE.md) | The single ordered backlog. A lane takes the topmost item **it owns by path** |
| [`FINDINGS-LEDGER.md`](./the-first-run/FINDINGS-LEDGER.md) | **What was found, FIXED, still OPEN, or investigated and proved FALSE. Read it before re-investigating anything** |
| [`THE-ONE-SCREEN.md`](./the-first-run/THE-ONE-SCREEN.md) | The target architecture, station by station |
| [`GOAL-main-lane.md`](./the-first-run/GOAL-main-lane.md) · [`GOAL-lane-0.md`](./the-first-run/GOAL-lane-0.md) · [`GOAL-lane-1.md`](./the-first-run/GOAL-lane-1.md) | The three paste-ready session goals |

**The acceptance, and nothing else counts as done:** one piece of work enters at the first station and
completes all seven, driven entirely by agents, with no human touching it mid-run, and a person can
watch it happen on one screen. **In three months this has never happened once** — 59 tracks, 58
entered at `sense`, zero reached `learn`.

---

## What you are building

**Supaprod is where product decisions live when agents do the work. It tells you what to build, builds it, ships it, checks what actually happened, and learns from it, so next time it guides the call instead of waiting to be asked.**

**The product is three layers, always told door then body then brain:**

| | Layer | Does |
| --- | --- | --- |
| **01** | the director | tells you what to build |
| **02** | the operating system | **decides what is worth building, hands it to whatever builds for you — yours or ours — and checks what actually happened**. Seven stations. **We do not compete on code generation** — the first-party path is a fallback and a preview surface, never a product line |
| **03** | the brain | **learns, then guides.** Never "stores" or "remembers". |

They are one product because each is the precondition for the next: you cannot be the brain without the loop that generates outcomes, and you cannot run the loop without being the OS. **Layer 03 is the only one defensible alone**, because it needs the customer's own outcomes labelled over time, which no model has. Ship any one alone and it is a feature.

**We do not generate the code, and this is canon** (`docs/strategy/positioning-locked-2026-08.md` §5N, ruled 2026-08-26). That market is finished and priced — over $48B across Cursor, Lovable, Replit, v0 and Cognition — and **the pain moved without moving to generation**: code review time +441.5% while throughput rose 33.7%, agentic pull requests 5.3x longer to pick up, DORA flat because output queued at review. **Nobody is short of generated code; everybody is short of confidence in it.** So every builder is a substitutable supplier to layer 02, their commoditisation is our tailwind, and generating code ourselves would turn all of them into competitors who will not integrate. **Never describe layer 02 as "runs the lifecycle" in outward copy** — it invites exactly the comparison we refuse. Application answer: `docs/pitch/three-layers-and-why-not-a-builder.md`.

**Hybrid, ruled 2026-08-26: both build paths ship.** Hand the spec, the acceptance criteria and the forecast to the customer's own builder (Cursor, Claude Code, Lovable, v0, Replit, Codex), or build it here metered on credits for a customer who has none. **Neither breaks the loop, and this is the load-bearing reason: the verdict is measured against the forecast, not against the code.** We never need to know how a change was built — only that it shipped and what happened, both obtainable without owning the builder. **The preview pane belongs at Design before it belongs at Build**: an interactive prototype a person can click before anyone writes code, because the expensive mistake here is building the wrong thing correctly. **And the sandbox is not only for code:** five of seven stations need something to run before a person can judge it, and the two highest-value ones are Decide (prove the forecast's metric is readable today, or the verdict can never land) and Ship (the preview deploy that IS the proof R-27 gates production on). One isolated-execution primitive, six callers, never touching production. Spec, with the station-by-station ranking and the four handback mechanisms: `the-first-run/SPEC-BUILD-PATHS.md`.

**The last verb is the product.** It **learns and guides**; it does not "remember". Remembering is storage, and storage is not defensible: anyone can hold your decisions, and one frontier release can absorb search over them.

**Corrected 2026-08-10 — learning-compounds is no longer the moat claim.** A full read of the market (679 documents, 5.9M words) falsified it: the *record* is backfillable, and was backfilled twice on the record — Vercel's COO reconstructed a lost deal's true cause from Slack, email and call recordings with an agent built in two days for about $1,000 a year. **Causes survive in artifacts. Forecasts do not.** So the defensible thing is the **forecast captured at decision time** — what a team believed would happen, recorded *before* the outcome was known, which exists only if something wrote it down at the moment of the call. Everything else about a decision can be rebuilt afterwards.

**But do not LEAD with it (founder ruling 2026-08-11).** Lead with the **governed record of agentic product work**: when agents do the work, answering *why did we decide this, on what evidence, who signed off* is the control that lets you let them run at all. That is a recognised buying requirement with a named market and a 45.3% CAGR. The forecast is what makes that record uniquely ours, and it is a **byproduct of doing the work whose first consumer is the next agent**, never a scoreboard. **Corporate prediction markets at Google beat expert forecasts by a 25% reduction in mean-squared error and died anyway**, because the transparency exposed the people who could have kept them. A pitch that leads with the forecast sells accountability to the person who would be held accountable.

**The industry name for layer 03 is "context graph"**, put at *Assess* on the ThoughtWorks Technology Radar in April 2026: decisions, policies, exceptions, precedents, evidence and outcomes as connected nodes structured for AI consumption, capturing *why* where systems of record capture *what*. **Use it in docs and with technical buyers; keep it out of the hero.** Its enumeration omits forecasts, and that omission is the gap we occupy.

**Four rules that follow, binding on every surface:**
1. **Never claim accumulated learning in the present tense.** Not *"we learn from your corrections."* The honest and stronger form is *the loop is wired and proven, and it begins accruing on first real use.*
2. **Never imply an unbroken signal → shipped → learned chain.** It is broken in two places: Discover promotes 3 of 86 themes, and Build writes no changeset or deployment edges. Demo the Discover → Decide → Learn half, which is real.
3. **Use practitioner language everywhere — in-product as well as public** (founder ruling 2026-08-11; **this replaces the register split, which is retired**).
   - **DROP, we invented these** (rate per million across 5,721,291 words of this market's own writing): *receipts* 3.0 → **evidence** 50.9 or **history** 103.3 · *ledger* 0.2, *trust ledger* **zero** → **track record** · *unattended* 0.2 → **ran on its own** 12.4 or **overnight** 14.3 · *first run* 0.2 → **get started** 42.1 · *provenance* 0.3 → **history** · *decision layer* → say what it does · **`agentic-first` and `agent-first`** → **say what agents do.** *(Founder ruling 2026-08-11. `-first` is a category-claim construction doing the same job "operating system" did, and the compound is ours. **`agentic` alone survives**: it appears in 53 corpus documents against 1 for "audit trail", so it is the market's word, not our invention. Keep it in technical, investor and analyst material where it is native. **Never in a hero, eyebrow, kicker or the 50-character line**, because Gartner's 2026 Hype Cycle puts agentic AI at the Peak of Inflated Expectations and the corpus talks about it sceptically, so leading with it invites a discount before the second sentence.)*
   - **KEEP:** **audit trail** *(not because practitioners say it, they do not: 0.2/M, one occurrence in 5.9M words. It is the industry's standard term and the native vocabulary of AI governance platforms, the category we enter through. **Use it to NAME the artifact or the control, never to make someone care.** Full reasoning: `positioning-locked-2026-08.md` §5L)* · **shared brain** · *evidence · history · track record · decisions* 562.8 · *review* 232.1 · *ready* 160.3 · *stuck* 95.8 (beats "blocked" 11.7 by 8×) · *judgment* (never "judgement") · *drift · gate · context governance · source of truth · what good looks like*.
   - **approve vs review:** keep **approve** where it names a **gate action** (something is blocked pending the click); use **review** where it means **looking at something**. The test is whether clicking it unblocks anything.
   - **Never use "context" alone on a marketing surface** — it means the LLM context window here and reads as jargon.
   - Exact strings for every remaining instance: [`docs/growth/vocabulary-change-list-2026-08.md`](./docs/growth/vocabulary-change-list-2026-08.md).

**4. Never volunteer the zero (founder ruling 2026-08-13, and it is binding on every application).** Do not write *"zero revenue and zero outside users"*, *"no users"*, *"nobody has used it yet"*, or any sentence whose job is to announce an absence. **No form requires a deficit as an opening line** — leading with one was our craft choice, it read as candour, and it cost more than it bought. The Berkeley SkyDeck application carries it and cannot be edited. **It is the last one that will.**

**Say the state we are actually in, all of which is true:** in **private beta, invite-only** (signup closed 2026-08-07, entry is by invite code) · **public launch mid-September 2026** · the product **runs end to end and a reviewer can open a login and use it** · the founder **runs the company on it daily**, so Supaprod's own roadmap runs inside Supaprod.

> **The line that does not move, because it protects the founder.** This ruling changes what we **volunteer**, never what we **assert**. Never state or imply a user count, revenue figure, paying customer or discovery interview that does not exist — programmes verify, and YC's form says outright that stated numbers may be checked. **If a form asks for a number, answer it truthfully**: this governs prose, not numeric fields. A required revenue field gets the true figure; an optional one stays blank. Never answer *"Are people using your product?"* with yes.

Full canon and evidence: [`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md) · [`docs/research/lennys-corpus-sweep-2026-08.md`](./docs/research/lennys-corpus-sweep-2026-08.md).

This is not only marketing language, it is a design constraint you apply while coding:

- A feature that **records** something and stops has not finished. Ask what reads it, and when. If the answer is "a human, if they go looking", the loop is open.
- **The Learn station is the moat.** A verdict is settled there, written back against the decision that caused it, and used to re-rank what Discover and Decide surface next. Work that breaks that write-back is a moat regression, however well it typechecks.
- **Never write "where the record lives", "stores", or "searchable history"** in UI copy, a doc, or a commit message. Say it compounds, it guides the next call, and it warns before you repeat what was wrong.

Full positioning and the vocabulary table: [`README.md`](./README.md).

---

## Read this first

Four things carry most of the value in this file. If you read nothing else:

1. **Query the live database before believing anything about production.** On 2026-08-02, nine separately shipped features were found doing nothing in production. All nine passed typecheck and tests. Two had unit tests asserting the defect as the contract. **Not one was found by reading code.**
2. **The gate is the exception, not the loop.** Policy is set in advance and does not block. Permission is asked in the moment and does. Design for the first.
3. **Correctness gates are never skipped:** `bunx tsc --noEmit`, `bun run build`, and the feature's tests. Everything else can be deferred; these cannot.
4. **A capability with no door is not shipped.** This repo's most common defect is a feature built correctly and reachable from nowhere.

---

## 0. Before you touch anything

**Pull first.** `git pull origin main`. Several tools and sessions write to this repo, including Lovable's bot, which commits and applies migrations on its own. Main moves under you.

**Where truth lives.** Four places, and only four:

| Question | File |
| --- | --- |
| What is in flight, what is next, what needs the founder | [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md), the `## Now` section (**there is no §0**) |
| **Groundwork already done — read before proposing a redesign** | [`docs/planning/initiatives/README.md`](./docs/planning/initiatives/README.md). Answers “is my question already answered?” and routes to the platform design, the station audits, the surface brief and the build logs. |
| Per-feature status and who is on what | [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) |
| What the last session did and left open | [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md) |
| What is actually true in production | **The live database.** Not a doc. |
| **What the last full audit found, and what is still open** | [`docs/planning/initiatives/audit-reports/agent-audit-2026-08.md`](./docs/planning/initiatives/audit-reports/agent-audit-2026-08.md). **Read its section for the subsystem you are about to touch.** Roughly 60 agents produced it on 2026-08-19; every finding is verified against code or production, and it names which docs are stale so you do not trust one. |

Read the handoff and the SSOT cursor. Do not re-read the whole corpus; that is the cost this repo has been paying and the reason it was cleaned up.

### Lovable is the first checkpoint, and you query it directly

Supaprod is built on, hosted on, and published through **Lovable**, which is the live system of record: the Supabase database, auth and OAuth, edge functions, hosting, deploys, analytics, logs, and the project source.

**When you hit any gap, error, or unknown**, a schema question, a data point, a log line, an analytics number, a connector config, a deployment status, go to Lovable through its MCP (`mcp__lovable__*` or `mcp__plugin_lovable_lovable__*`) and resolve it there. Do not guess, and do not stop at a local grep when the live answer is one call away.

- **Do not request direct Supabase access.** The founder does not hold Supabase credentials; Supabase is entirely Lovable-managed. Asking him to authorize a separate Supabase connection is a wrong turn, not a shortcut. Run SQL through the Lovable MCP.
- **Secrets and env are the one local-first exception.** They live in this project's git-ignored `.env` and as wrangler secrets. Check there first for a secret value.
- **Pushing does not deploy.** The founder must click publish in Lovable for app code to go live. Database migrations applied through Lovable are live immediately; everything else waits on his publish.

---

## 1. The doctrines

Five rules that constrain *what gets designed*, not just how it is coded. Every proposal states how it satisfies them.

### 1.1 Six-month-forward (founder ruling 2026-08-01)

> We are not building for today's problem. Every solution is designed for where the industry will be **six months from the current date**, and it must also close the pain the user carried from the past.

1. **Assume the model layer commoditizes.** If one frontier release could absorb this feature, it is not a moat. Build the loop, the gates and the record *around* the model, never the thin layer on top.
2. **Assume a large vendor ships our vertical next quarter.** Name what we still have that they do not. If the answer is "nothing", the design is wrong and gets redone.
3. **Agents run it, they do not assist with it.** A surface an autonomous agent cannot run end to end under policy is legacy the day it ships. *(Was "Agentic-first, not agent-assisted" until 2026-08-11. The rule is unchanged; the compound is retired, see rule 3 in the vocabulary block.)*
4. **Solve backwards and forwards.** Close the past pain, serve today's job, leave the seam for the six-month job.
5. **Delight is a requirement, not a finishing pass.** The bar is [`docs/conventions/anti-slop.md`](./docs/conventions/anti-slop.md).

**How to apply:** state the six-month assumption when proposing a design, and say in one line what survives a frontier launch. An agent that cannot answer that has not finished thinking.

**Companion rule:** for each surface, research the best proven product in that category and **lift its information model and verbs outright**, even close to literally. Name the reference before building, then express it in our primitives and voice. Build points at Cursor and Claude Code; Design at Figma's fidelity ladder; Discover at Sentry's issue stream and Linear's triage inbox. Every research pass is appended to [`docs/design/REFERENCE-PATTERNS.md`](./docs/design/REFERENCE-PATTERNS.md) in the same session, so it is never paid for twice.

### 1.2 Governance is policy, not permission (founder ruling 2026-07-29)

> Policy is set in advance and does not block. Permission is asked in the moment and does. **Supaprod is built on policy.**

The test: *"Even human in the loop, every approval, if it passes to a human, then what is the purpose of agents?"*

**The human sets boundaries and judges the few things that cross them.** A long approvals queue is a policy failure to surface, not a workload to render. The product should offer to remove it: *"You approved 14 of these without changes. Let Engineer do it alone?"*

Autonomy is the default and the code already does it: `loadAgentArc` returns `trusted` when no row exists, and a brand-new workspace is autonomous on arrival. Autonomy is paid for with **evidence**: fewer interrupts is only safe because the tamper-evident record proves what happened. Never trade the record for speed.

**Four floors no boundary may lower:** anything irreversible from inside the product; genuine judgment with no oracle; a default the user never set (it must be visible and changeable, or it is our choice masquerading as their policy); and hard risk floors above any earned autonomy.

Canonical: [`docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md`](./docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md).

### 1.3 The Engine-Room doctrine

Complexity lives in the engine, never in the experience. **The user meets the output of the machine, never the machine.** Traces, evals, prompts, budgets, raw logs and agent internals live behind one recessed Engine Room door, revealed on demand. Labels name the **outcome**, not the mechanism. Users connect their own sources through one Connect button and never touch keys or wiring.

Every new user-facing surface runs the **Engine-Room Test**, "would a smart non-technical person feel this is for them, or does it expose how the machine works?", and carries a greppable `Engine-Room:` line. Body: [`docs/conventions/engine-room-doctrine.md`](./docs/conventions/engine-room-doctrine.md).

### 1.4 Data minimalism: every field earns its place

Capture nothing by default. No field, input, stored column or pixel exists unless a **named consumer** needs it. Run the **Value Test** (what value, to whom, where consumed, does anything change if absent?) and satisfy the **wiring rule**: a captured field ships in the *same change* as the surface or prompt that reads it. There is no "collect now, use later". Body: [`docs/conventions/data-minimalism.md`](./docs/conventions/data-minimalism.md).

### 1.5 Build, Buy, or Integrate

Run this before building any capability from core. **Default to build:** the USP lives in-house end to end.

- **BUILD** the moat: the typed decision ontology, outcome-labeled supersession, the adversarial Critic, the system of record. Never wrap a provider's generic layer and call it ours.
- **BUY** commodities: inference, embeddings, rerank, OCR, email, OAuth. Route through `runtime.server.ts` with a valid `CallSurface`; never call a provider directly.
- **INTEGRATE** high-lock-in substrates behind a typed internal seam, with a native default and graceful fallback.

The moat is the judgment. Borrow the plumbing. Full gate: [`docs/strategy/build-buy-integrate.md`](./docs/strategy/build-buy-integrate.md).

---

## 2. Pre-action protocol

1. **State the request in one sentence.** If it is ambiguous in a way that changes the work, ask.
2. **Scan available skills, agents, plugins and MCP servers, then pick the best fit.** The active list is in the session reminder; it is the source of truth, never invoke from memory. Shortlist across all namespaces with no vendor bias. Process skills before implementation skills. Selection logic: [`docs/operations/skills.md`](./docs/operations/skills.md), [`docs/operations/subagents.md`](./docs/operations/subagents.md).
3. **Track multi-step work as tasks.** Create them up front, update as you go, never batch-complete at the end.
4. **Confirm destructive or shared-state actions.** Migrations, force-pushes, branch deletes, external sends. One past approval does not extend forward.
5. **For UI work, run the dev server and look at it.** Typechecking is not feature-checking.
6. **Close with one or two sentences:** what changed, what is next.

If you catch yourself thinking "this is a quick fix, I can skip the protocol", that is the signal to follow it.

---

## 3. Architecture invariants

Non-negotiable. A change that breaks one of these is wrong even if it works.

1. **Every AI call goes through the chokepoint**, `src/lib/ai/runtime.server.ts`. No second path. A new AI surface needs a valid `CallSurface` literal from the exported union. Contract: [`architecture/runtime.md`](./architecture/runtime.md).
2. **Every multi-step autonomous workflow goes through the orchestration layer.** No ad-hoc agent loops. New agentic tools are registered in `src/lib/ai/tools/registry.server.ts`. Contract: [`architecture/orchestration.md`](./architecture/orchestration.md).
3. **RLS on every user table, scoped by membership.** No client-trusted role checks. Every write stamps `workspace_id`. Contract: [`architecture/security.md`](./architecture/security.md).
4. **Server boundary integrity.** Files ending `.server.ts` run only in the Cloudflare Worker and are never bundled to the client. The service-role client is never imported from client code.
5. **App logic is server functions**, one `src/lib/<domain>.functions.ts` module per domain, consumed by the matching `src/routes/_authenticated.<domain>.tsx` through TanStack Query. Cron-poked endpoints are `/api/public/hooks/*`. Follow an existing pair rather than inventing a new data-flow shape.
6. **Loader and Suspense, not `useEffect` and fetch.** Boundaries on every route: error, not-found, and a root default.
7. **Budget caps are sacred**, enforced server-side. Cache hits are still logged. Guardrails run on input and output.
8. **Never add a `VITE_` prefix to a secret.** Client uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; the server uses unprefixed names plus `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY` as wrangler secrets.
9. **Do not hand-edit generated files:** `src/routes/routeTree.gen.ts`, and migration SQL once applied.

---

## 4. The gates

**Every cycle, no exceptions:**

```bash
bun run lane:gates    # all four, exit code read, verdict on the LAST line
```

Or the four by hand, if you want one of them alone:

```bash
bunx tsc --noEmit     # 0 errors
bun test              # 0 failures
bun run build         # succeeds
bun run docs:check    # 0 FAIL items, and it is a gate like the others
```

**Prefer `lane:gates`, and the reason is an incident rather than convenience.** On
2026-08-20 main went out red on the doc gate while the gate was being run every
time, because it was being read as `bun run docs:check | tail -2`. A pipe reports
the exit status of `tail`, and `docs-doctor` prints its cheerful footer BELOW its
failure summary, so a failing gate ends on a reassuring sentence. `lane:gates`
runs all four, reads each exit code, and **puts the verdict on its own last line**,
so the shortcut that hid the failure cannot hide it again.

Plus an adversarial read for **runtime-fatal** bugs, the class typechecking cannot see:

- A Supabase column or table that does not exist. **`tsc` passes on a wrong column name inside a `.select()` string** and fails at runtime. Verify against `types.ts`.
- A missing `NOT NULL` value on an insert, especially `workspace_id`.
- RLS referencing a column that is not there.
- **A capability with no door**: built, correct, and reachable from no route.
- A claim that outruns its wiring.

**Honest status.** Use `◐` for partial, never `✅`, unless the behaviour was verified. "I saw it resolve" is not evidence it resolved *correctly*.

**Deferred to one founder-prompted end-stage pass**, do not spend cycle effort here: humanization scanning of authored prose, lint and prettier backlog, telemetry polish, deep doc prose-polish. The runtime `humanizeText` sanitizer stays on always; it is code, not a manual check.

---

## 5. Design

**The contract is [`docs/design/DESIGN-SYSTEM.md`](./docs/design/DESIGN-SYSTEM.md).** Read it before any UI work.

The short version, because it is easy to get wrong:

- **Meridian is the design system and there is no other one.** Tokens in [`src/styles/meridian.css`](./src/styles/meridian.css), components in [`src/components/meridian/`](./src/components/meridian/). **Compose from those.**
- **Meridian is ported from `https://www.beautifului.dev/`, which is the FLOOR — and you extract its source rather than writing your own.** Standing founder ruling, restated 2026-08-26: *"the codebase is there, so you do not need to generate anything. Literally copy the code, extract it, implement it. Anything on top of that you may create; you must not go below."* The reproducible extraction and the component-by-component parity map are in [`docs/design/MERIDIAN-REFERENCE-PARITY.md`](./docs/design/MERIDIAN-REFERENCE-PARITY.md) — decode the page's own flight payload, never compare against the rendered demo, because a screenshot loses the mechanics and the mechanics are the only part worth having. **A value chosen because it "looked right" is a fail; a value with a reason is not.**
- **Every prior system is retired**: v1 Ember, v3 Obsidian, v4 Loom, v5 Tempo, and Cadence/ink. That means `--sp-*`, `--ds-*`, `--text-*`, `--hairline`, `--madder*`, `--glacier`, `--font-pixel`, `--raised`, `[data-obsidian]`, and `src/components/shell/primitives.tsx`. They still run, because deleting them in one move is how the 2026-07 rebuild failed. **Never build from them, never extend them, whatever an older doc or skill says** — and this paragraph itself used to say the opposite, which is a large part of why 2,288 occurrences accumulated.
- **This is enforced, not requested.** `src/__tests__/meridian-ratchet.test.ts` fails `bun test` when a **new** file carries a retired token or a raw colour, and when an **existing** file grows its count. Fix the code; never widen the baseline to pass. `bun run design:ratchet` is only for recording debt you have removed.
- **No `--mrd-*` token fits? That is a gap in Meridian.** Build it there rather than reaching past it — standing founder ruling, 2026-08-15. A token earns its place on the second caller, is named for meaning rather than appearance, and is measured in both grounds before it ships.
- **The ratchet:** today's design is the floor. "Tighten this" is a request for a better surface, never a smaller one. Shrinking type, stripping padding or hiding information to save rows is forbidden as an answer.
- **Colour carries status, never decorates**, and must survive a greyscale test. Five status words and only five: `you` (a person is required), `agent` (a machine is working), `pass`/`fail` (an outcome that happened, never an intent), `hold` (waiting on a condition). Categorical colour (`--mrd-viz-*`, the syntax palette) is a separate system and is never status.
- **Identity is shape, status is hue.** Never paint a station, agent or mission identity as a colour ramp. Found and removed three times.
- **Look at it before you ship it.** The suite asks whether a component behaves, never whether anyone has looked at it. Twelve primary buttons once shipped a 1.19:1 label on paper with 8,787 tests green.

Surface mechanics are enforced by `src/__tests__/surface-discipline.test.ts`, which was proven to fail by planting the defect.

### Humanized output: consumer-facing only (explicit founder command, 2026-08-03)

> **Clean AI fingerprints only where a user can see them. Never in code that a user cannot see.**

No em or en dashes, no invisible Unicode, no AI-cliché phrasing in:

- **Consumer-facing screens.** UI copy, labels, empty states, error messages, anything rendered.
- **Outcomes the platform generates.** PRDs, drafts, chat, research, rationales, emails, anything a user reads back.
- **Public surfaces.** The landing page and every public page.

**Explicitly out of scope. Do not spend a token here:**

- **Backend and server source code.** Logic in `src/lib/**` that emits nothing a user reads.
- **Code comments**, including comment tails on a line of real code.
- **`.md` docs and `.sql` migrations**, at all.
- **Tests.**

**And the harder half: removing fingerprints is not the standard, it is the floor** (founder command, same day). Every string a user reads must feel written by a person who knew their situation. Four tests:

1. **Contextual, not generic.** It names *this* situation with *this* data. If the sentence would fit on ten other screens, it is not finished. "No items to display" fails; "No signals since Tuesday, so Discover has nothing new to rank" passes.
2. **Empathetic only where something broke**, and then it says what broke, what it cost, and what happens next. Never apologise decoratively. Warmth without information is worse than a blunt fact.
3. **Enterprise-credible.** It could sit in Stripe's or Linear's product unnoticed. No exclamation marks, no cheerleading, no hedging on a confirm.
4. **Written for one reader.** Second person, present tense, specific.

"An error occurred. Please try again." passes every automated check and still fails all four. **The scan is automatable; this bar is not.** Apply it while writing. Worked examples: [`docs/conventions/humanized-output.md`](./docs/conventions/humanized-output.md).

The founder's reason, stated as a standing instruction: cleaning fingerprints out of non-consumer-facing code is *"a waste of time for us and token and energy"*. An engineer's dash in an explanation of why a function exists is not an AI fingerprint. It never leaves the repo. Leave it.

The hard gate is the runtime sanitizer at the AI chokepoint, which protects generated output automatically and needs no manual pass. The build-time checker (`scripts/check-humanized.sh`) is scoped to match this rule. Bodies: [`docs/conventions/humanized-output.md`](./docs/conventions/humanized-output.md), [`docs/conventions/ui-voice.md`](./docs/conventions/ui-voice.md).

**No native browser chrome.** No `alert`, `confirm`, `prompt` or native `<dialog>` in `src/**`. Use `useConfirm()`, `usePrompt()`, `sonner` and shadcn. ESLint-enforced.

---

## 6. Writing code

**Think first.** State assumptions. If several readings exist, say so rather than picking silently. If a simpler approach exists, push back.

**Simplicity.** Minimum code that solves the problem. No abstractions for single-use code, no configurability nobody asked for, no error handling for impossible states. If you wrote 200 lines and it could be 50, rewrite it.

**Search before you write. This is a hard rule, not a preference** (founder ruling, 2026-08-19).

> *"No code is being written without analysing whether it is already sitting in some form in the codebase. Only then does it need to start writing code."*

**Before writing any function, component, type, helper or stylesheet rule, look for it first.** Query the knowledge graph (`graphify explain "<symbol>"`), grep for the behaviour rather than the name you would have given it, and read the folder you are about to add to. **If something close already exists, extend or import it.** If you genuinely must add a second one, say in the commit why the first could not serve.

**The evidence this repo has already paid for, measured 2026-08-19:**

- **Seven copies of `initialsFrom`.**
- **Four status normalisers, three of which disagree** about what `completed_with_failures` means, so two surfaces read the same run as opposite outcomes.
- **`ReadFailed` reached five copies** before it was pulled into one place.
- **Three shells** — `AppShell`, `MissionShellView`, `RoomChrome` — with a hardcoded pathname list choosing between them.
- **Five design systems**, each written because the previous one did not have the token somebody needed at 4pm.
- **39 vendored UI modules imported by nothing**, carrying 322 occurrences of retired vocabulary.

Every one of those began as a reasonable person writing the obvious thing without checking. **The cost is not the duplicate; it is that the copies drift and then disagree**, and a reader cannot tell which one is right.

**The same rule applies to deleting.** Unused is not a reason to delete: this repo's most common defect is a capability built correctly and reachable from nowhere, so absence of callers usually means a missing door rather than dead weight. Delete only what is **shadowed** (a later declaration wins, so it never executes), **regenerable** (one command restores it), **superseded** (a live equivalent exists), or **broken as written** (adopting it would need a rewrite). Anything else gets a door, not a grave. Worked application: [`docs/operations/kiro-queue.md`](./docs/operations/kiro-queue.md) Group F.

**Surgical changes.** Every changed line traces to the request. Do not improve adjacent code, do not refactor what is not broken, match the surrounding style. Remove orphans *your* change created; mention pre-existing dead code rather than deleting it.

**No mocks and no stubs.** If it renders, it reads and writes real data.

**Comments default to none.** Comment only when the *why* is non-obvious. When you do, explain the trap, not the syntax.

**Tests.** Unit tests for pure logic, integration tests for chokepoint behaviour. A test that encodes a bug as the contract is worse than no test; two of the nine dead features had exactly that.

---

## 7. Git discipline

**Every git interaction carries a one-line WHY.** Hooks enforce it. Canonical: [`docs/operations/commits.md`](./docs/operations/commits.md).

- The one remote is `https://github.com/RohitGajaraj/Supaprod.git`, branch `main`. It is what Lovable reads. Verify with `git remote -v` if in doubt.
- **Push with an explicit refspec:** `git push origin <branch>:main`. A bare `git push origin` from a lane branch is invisible on `main`.
- **Stage explicit paths, never `git add -A`.** Lovable's bot and audit subagents both commit while you work; a blanket add sweeps their changes into your commit.
- **Never `git init` inside a broken worktree.** If a worktree reports `fatal: not a git repository: (null)`, the fix is `git -C <main-checkout> worktree repair <path>`. On 2026-07-27 the `git init` recovery plus a force-push replaced `origin/main` with a zero-parent history and orphaned 4,124 commits. A `pre-push` hook blocks that now, but it lives in untracked `.git/hooks`: run `bash scripts/install-git-hooks.sh` in every fresh clone. Incident record: [`docs/operations/git-recovery-and-orphan-guard.md`](./docs/operations/git-recovery-and-orphan-guard.md).
- Never commit directly on a red tree.

---

## 8. Documentation

**Current mode: BUILD-ONLY** (founder ruling 2026-07-04, still active). During build work, skip the full doc loop. The one trace required: flip the feature-dashboard row and add a one-line note. To exit, the founder says so.

When you do write docs, four rules keep this from rotting again:

1. **One purpose per doc. Extend before you create.** If a doc already serves the purpose, add to it.
2. **Status lives only in the SSOT.** Never copy a status board or canon paragraph into a second file. Link instead.
3. **Archive, do not orphan.** A superseded doc moves to the nearest `archive/` with a README saying why, and inbound links are retargeted in the same commit.
4. **Every doc carries a date header** under its H1: `> _Created: YYYY-MM-DD · Last updated: YYYY-MM-DD_`. No dates in filenames.

**Root holds exactly four files:** `README.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. Adding a fifth is how the last three cleanups started.

**Creating any file? [`docs/README.md`](./docs/README.md) has a routing table with a row for every case**: research, strategy, positioning, launch, architecture, decisions, conventions, features, plans, runbooks, tests, security, prompts, and non-documents including screenshots. Find your row before you create. If your case is genuinely absent, add a row rather than inventing a folder.

**Screenshots go in `docs/screenshots/`, which is gitignored.** Never commit one, never leave one at repo root. Sixty were found loose at root on 2026-08-04, plus a 1.9 MB temp screenshot directory that had been committed.

`docs-doctor` runs itself from the pre-commit hook when a commit touches markdown, so you do not need to run `bun run docs:check` by hand.

---

## 9. Traps this repo has already paid for

> **Before adding a row here, check the audit register** — [`docs/planning/initiatives/audit-reports/agent-audit-2026-08.md`](./docs/planning/initiatives/audit-reports/agent-audit-2026-08.md). It carries roughly 60 agents' findings from 2026-08-19, grouped by subsystem, each marked open, queued, closed, or stale-doc. **Read the section for what you are touching before you start**, and **update a finding's state in the same commit as its fix.** The traps below are the ones general enough to bind every change; the register holds the specific ones.

Each of these cost real time. Add a row before you hit the same thing a third time.

**Production is not what the code says.** Nine shipped features were doing nothing, found only by querying the live database. Committed SQL is not applied SQL: verify a table with `to_regclass`, never with `schema_migrations`, which is not a trustworthy ledger here. Applied is also not correct: Lovable's bot applies migrations too.

**`CREATE OR REPLACE FUNCTION` forks, it does not replace.** A changed argument list silently adds an overload. This broke live retrieval with "could not choose a best candidate function".

**`tsc` misses bad Supabase columns.** A wrong column inside a `.select()` string typechecks clean and fails at runtime.

**Capability built, door missing.** The dominant defect here. A route-reachability test now fails the build for it.

**`src/styles.css` is a file; `src/styles/` is a directory.** Both exist. Grepping only the directory misses the 123 KB root sheet and falsely reports tokens as dead.

**Ignore the `" 2"`-suffixed directories** (`src/components 2`, `src/integrations 2`). They are empty macOS case-insensitive-filesystem artifacts. Never edit, import from, or `cd` into them.

**Internal identifiers do not follow the renames, on purpose.** The Build station was Builder, then Studio, then Build. The user-facing name is **Build** and the routes are `/build` and `/build/$missionId`, but `agent_slug='builder'`, `builder_file_claims`, `studio.functions.ts`, `src/components/studio/`, the `studio.*` engine tools and `studio_changesets` were all deliberately left unmigrated. Read them as Build. Same convention for the product rename: `Cadence` survives in a short list of internal identifiers, logged in [`docs/operations/rename-cadence-to-supaprod.md`](./docs/operations/rename-cadence-to-supaprod.md). Note the generic English word ("release cadence", the DB `cadence` schedule-frequency column) was never the brand and is untouched.

**`git mv` invalidates read-tracking.** Re-read a file at its new path before the first edit.

**`rtk` filters `ps` and `ls` output.** A bare `ps | grep` can show a live process as gone. Use absolute binary paths when it matters.

**Query the knowledge graph before grepping**, measured at roughly 206x cheaper for "where is X" and "what calls Y". `graphify explain "<symbol>"` is the sharpest. The graph is not in git; if the checkout has no `graphify-out/`, use `--graph ~/.graphify/global-graph.json`, whose node ids are prefixed `supaprod::`. Refresh with `PYTHONHASHSEED=0 graphify update .` and always pin that variable, or clustering is nondeterministic. Never use `--backend claude-cli`; it returns a wrong-schema graph that gets discarded as hollow.

**Redirect stubs use relative in-repo links only.** Eighteen once pointed into a retired repo via absolute `file://` paths, silently routing tools out of this codebase.

---

## 10. Cross-tool co-development

Several agentic tools build this repo at once. The rule that makes that safe: **git is the only shared substrate. Each tool's agent layer sits on top and is not shared.**

| Layer | Portable | Lives in |
| --- | --- | --- |
| Code and committed docs | Yes | the git tree |
| Operating rules | Yes, as plain text | `AGENTS.md`, with thin pointers in `CLAUDE.md` and `GEMINI.md` |
| MCP servers | Yes, open standard | `.mcp.json`, env-driven, no secrets |
| Skills, subagents, hooks, plugins | **No**, harness-bound | `.claude/` |

**Consequence:** moving a skill into the repo does not make Antigravity or Lovable execute it. The only way to give every tool the same behaviour is to write the rule into `AGENTS.md`. Skills are a Claude Code accelerator on top of the shared rules, never a substitute.

### The Kiro split: work is divided by capability, not by feature

**If you are Kiro, your work queue is [`docs/operations/kiro-queue.md`](./docs/operations/kiro-queue.md). Take the lowest-numbered item whose status is `TODO` and whose dependencies are `VERIFIED`.** Read that file's §1 before your first item; it carries the branch, the protocol, and the rules that fail a build.

Kiro has **no database, no MCP, and no external tools**. That is the sorting rule rather than a limitation: **every item in that queue is one whose correctness can be established from the repo alone** — a component renders, a pure function returns the right value, a type checks, a test passes. Migrations, production queries, runtime behaviour and anything whose truth lives in the database stay with Claude, because a green suite is evidence the code does what the test says and nothing more.

| | Kiro | Claude Code |
| --- | --- | --- |
| Branch | **`main`** | its own lane |
| Database / MCP | none | full |
| Status transitions it may write | `TODO` → `IN PROGRESS` → `BUILT` | `BUILT` → `VERIFIED` \| `REJECTED` |

**Kiro never writes `VERIFIED`**, because that word means "checked against production". Kiro logs what it built, what it guessed at, and what it noticed; Claude verifies and replies with a verdict. Neither edits a file the other's item lists under `Owns`.

- **Change a rule in `AGENTS.md`.** The pointers only point.
- **`.mcp.json` owns MCP servers.** Do not also source the same server from a plugin; that registers it twice.
- **`.claude/skills/` holds only project-specific skills.** Do not bulk-copy a personal library in here.
- **Commit small and pull often.** Two tools on one long-lived uncommitted tree diverge fast.
- **Secrets never enter committed config.** Use `${ENV_VAR}` placeholders.

---

## 11. If you are writing anything outward-facing

An accelerator application, an investor answer, a demo script, launch copy, a reply to an objection. **Go to [`docs/pitch/`](./docs/pitch/README.md) first and follow its seven-step procedure.** Do not compose from memory.

**If it is a live conversation** rather than a written submission, the file to open is [`docs/pitch/founder-answer-playbook.md`](./docs/pitch/founder-answer-playbook.md): the postures, the answer length per room, the numbers card, and the honest-versus-strategic map.

**That playbook is updated after every application and every interview, in the same session.** A question we fumbled, a pushback, a rejection reason, a changed number. We are applying to many programmes over the coming weeks, and that file is the only thing that compounds across them. Treat failing to update it as leaving the work unfinished.

The three rules that matter most, because they are the ones that get broken:

- **Pull, do not write.** `applications/answer-bank.md` holds every reusable answer at every length. Composing a fresh one is how two applications end up contradicting each other.
- **Facts come from the canon.** Contact addresses, the September 2026 launch date, the employer wording, the market ladder, the role arc. All in the Pitch Room README's table. Getting the employer name wrong is a real failure mode here.
- **Tag every claim** `PROVEN` / `WIRING` / `ROADMAP`, and **never say a WIRING claim publicly until it runs.**

Route the result back into `docs/pitch/` in the same session, updating the existing file. Never fork a parallel copy. And **nothing outward sends without the founder's approval**: not a DM, not a post, not a submission.

---

## 12. When to escalate

Stop and ask when the task is ambiguous in a way that changes the work; when a destructive operation is on the table; when the change touches shared infrastructure or secrets; when you find unexpected state; when a hook blocks you and you are not authorized to disable it; or when the work has outgrown the request.

**The cost of one clarification is far below the cost of one unwanted action.**

---

> Speed matters here, but speed **with drift** is worse than steady, true work. Follow the protocol, verify against production, and add a trap to section 9 when this repo teaches you something new.
