# AGENTS.md, the build manual

> _Last updated: 2026-08-03_

**This file holds the rules for building Supaprod.** It is tool-agnostic and canonical: Claude Code, Antigravity, Gemini CLI, Codex, Cursor and Lovable all work from it. Per-tool notes live in [`CLAUDE.md`](./CLAUDE.md) and [`GEMINI.md`](./GEMINI.md), and those files only *point* here.

For what the product is and where every other document lives, read [`README.md`](./README.md).

**If a rule here conflicts with an older document anywhere in the repo, this file wins.**

---

## What you are building

**Supaprod is where product decisions live when agents do the work. It tells you what to build, builds it, ships it, checks what actually happened, and learns from it, so next time it guides the call instead of waiting to be asked.**

**The product is three layers, always told door then body then brain:**

| | Layer | Does |
| --- | --- | --- |
| **01** | the director | tells you what to build |
| **02** | the operating system | runs the whole lifecycle, seven stations |
| **03** | the brain | **learns, then guides.** Never "stores" or "remembers". |

They are one product because each is the precondition for the next: you cannot be the brain without the loop that generates outcomes, and you cannot run the loop without being the OS. **Layer 03 is the only one defensible alone**, because it needs the customer's own outcomes labelled over time, which no model has. Ship any one alone and it is a feature.

**The last verb is the product.** It **learns and guides**; it does not "remember". Remembering is storage, and storage is not defensible: anyone can hold your decisions, and one frontier release can absorb search over them.

**Corrected 2026-08-10 — learning-compounds is no longer the moat claim.** A full read of the market (679 documents, 5.9M words) falsified it: the *record* is backfillable, and was backfilled twice on the record — Vercel's COO reconstructed a lost deal's true cause from Slack, email and call recordings with an agent built in two days for about $1,000 a year. **Causes survive in artifacts. Forecasts do not.** So the defensible thing is the **forecast captured at decision time** — what a team believed would happen, recorded *before* the outcome was known, which exists only if something wrote it down at the moment of the call. Everything else about a decision can be rebuilt afterwards.

**But do not LEAD with it (founder ruling 2026-08-11).** Lead with the **governed record of agentic product work**: when agents do the work, answering *why did we decide this, on what evidence, who signed off* is the control that lets you let them run at all. That is a recognised buying requirement with a named market and a 45.3% CAGR. The forecast is what makes that record uniquely ours, and it is a **byproduct of doing the work whose first consumer is the next agent**, never a scoreboard. **Corporate prediction markets at Google beat expert forecasts by a 25% reduction in mean-squared error and died anyway**, because the transparency exposed the people who could have kept them. A pitch that leads with the forecast sells accountability to the person who would be held accountable.

**The industry name for layer 03 is "context graph"**, put at *Assess* on the ThoughtWorks Technology Radar in April 2026: decisions, policies, exceptions, precedents, evidence and outcomes as connected nodes structured for AI consumption, capturing *why* where systems of record capture *what*. **Use it in docs and with technical buyers; keep it out of the hero.** Its enumeration omits forecasts, and that omission is the gap we occupy.

**Three rules that follow, binding on every surface:**
1. **Never claim accumulated learning in the present tense.** Not *"we learn from your corrections."* The honest and stronger form is *the loop is wired and proven, and it begins accruing on first real use.*
2. **Never imply an unbroken signal → shipped → learned chain.** It is broken in two places: Discover promotes 3 of 86 themes, and Build writes no changeset or deployment edges. Demo the Discover → Decide → Learn half, which is real.
3. **Use practitioner language everywhere — in-product as well as public** (founder ruling 2026-08-11; **this replaces the register split, which is retired**).
   - **DROP, we invented these** (rate per million across 5,721,291 words of this market's own writing): *receipts* 3.0 → **evidence** 50.9 or **history** 103.3 · *ledger* 0.2, *trust ledger* **zero** → **track record** · *unattended* 0.2 → **ran on its own** 12.4 or **overnight** 14.3 · *first run* 0.2 → **get started** 42.1 · *provenance* 0.3 → **history** · *decision layer* → say what it does.
   - **KEEP, practitioners say these unprompted:** **audit trail** · **shared brain** · *evidence · history · track record · decisions* 562.8 · *review* 232.1 · *ready* 160.3 · *stuck* 95.8 (beats "blocked" 11.7 by 8×) · *judgment* (never "judgement") · *drift · gate · context governance · source of truth · what good looks like*.
   - **approve vs review:** keep **approve** where it names a **gate action** (something is blocked pending the click); use **review** where it means **looking at something**. The test is whether clicking it unblocks anything.
   - **Never use "context" alone on a marketing surface** — it means the LLM context window here and reads as jargon.
   - Exact strings for every remaining instance: [`docs/growth/vocabulary-change-list-2026-08.md`](./docs/growth/vocabulary-change-list-2026-08.md).

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
| What is in flight, what is next, what needs the founder | [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) §0 |
| Per-feature status and who is on what | [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) |
| What the last session did and left open | [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md) |
| What is actually true in production | **The live database.** Not a doc. |

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
3. **Agentic-first, not agent-assisted.** A surface an autonomous agent cannot run end to end under policy is legacy the day it ships.
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
bunx tsc --noEmit     # 0 errors
bun test              # 0 failures
bun run build         # succeeds
```

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

- **The baseline is what is shipped**: `--sp-*` tokens in `src/styles/ink.css`, the primitives in `src/components/shell/primitives.tsx`. Compose from those.
- **`--ds-*` in `src/styles.css` is the legacy Tempo layer** under `src/components/ui/`. It still runs. Never add to it, never style a new surface from it.
- **Tempo v5, Loom v4, Obsidian v3 and Ember are retired**, rejected on 2026-07-28. They live in [`docs/design/archive/`](./docs/design/archive/README.md) as history. Never build from them, whatever an older doc or skill says.
- **The ratchet:** today's design is the floor. "Tighten this" is a request for a better surface, never a smaller one. Shrinking type, stripping padding or hiding information to save rows is forbidden as an answer.
- **Monochrome by default.** Ember is rare and is not the default for approvals or actions. Blue means agents running; green and red mean status. Colour must survive a greyscale test.

Mechanics are enforced by `src/__tests__/surface-discipline.test.ts`, which was proven to fail by planting the defect.

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
