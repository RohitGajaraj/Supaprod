> _Created: 2026-06-03 · Last updated: 2026-09-23_

> **🛑 Supaprod product work stopped on 2026-09-23 ([R-42](./the-first-run/RULINGS.md)), and the 38
> scheduled jobs were stopped on 2026-09-28 ([R-43](./the-first-run/RULINGS.md)).**
> **If you are an agent, read [`AGENTS.md`](./AGENTS.md) before anything else** — it is a stop sign and
> it lists what may not be done here, starting with scheduling anything.
> This file describes the product as it was. Why it stopped:
> [`docs/strategy/strategy-reset-2026-09.md`](./docs/strategy/strategy-reset-2026-09.md) §14. What
> comes next, and it is not this product:
> [`docs/strategy/direction-search-2026-09.md`](./docs/strategy/direction-search-2026-09.md). Every
> recurring cost and how to stop it:
> [`docs/operations/spend-shutdown.md`](./docs/operations/spend-shutdown.md).

<p align="center">
  <img src="./docs/growth/branding/social/x-header-dark-1500x500@2x.png" alt="Supaprod. Agents that own outcomes. Not just output." width="100%">
</p>

<h3 align="center">For product managers who ship with agents</h3>

<p align="center">
  <a href="https://supaprod.ai"><b>supaprod.ai</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Supaprod">@Supaprod</a>
  &nbsp;·&nbsp;
  <a href="https://x.com/supaprodhq">@supaprodhq</a>
</p>

> _Created: 2026-07-17 · Last updated: 2026-09-02_

**Supaprod tells you what to build, builds it, ships it, checks what actually happened, and learns
from it, so next time it guides the call.**

This file is the front door: what the product is, and where every other document lives. **It does
not restate strategy, pricing or canon in full**, because each has an owning document and a second
copy here is a copy that drifts. If you are here to build, read [`CLAUDE.md`](./CLAUDE.md), then
[`docs/conventions/the-bar.md`](./docs/conventions/the-bar.md).

---

## The active mission

**Read [`the-first-run/START-HERE.md`](./the-first-run/START-HERE.md) before doing anything on this
repo.** Since 2026-08-25 the platform is being transformed, not extended.

| File | What it settles |
| --- | --- |
| [`START-HERE.md`](./the-first-run/START-HERE.md) | What we are doing and why, in one page |
| [`RULINGS.md`](./the-first-run/RULINGS.md) | **The tiebreaker. If any two documents disagree, it wins.** Its OPEN list is what nobody may decide alone |
| [`OPERATING-MODEL-5-SESSIONS.md`](./the-first-run/OPERATING-MODEL-5-SESSIONS.md) | **Current, from 2026-08-26.** Five sessions, path ownership, and the honest acceptance query |
| [`BUILD-QUEUE.md`](./the-first-run/BUILD-QUEUE.md) | The single ordered backlog. A lane takes the topmost item it owns by path |
| [`FINDINGS-LEDGER.md`](./the-first-run/FINDINGS-LEDGER.md) | Found, fixed, still open, or proved false. **Read it before re-investigating anything** |
| [`SURFACE-MAP.md`](./the-first-run/SURFACE-MAP.md) | Every route and component directory, with its owner and its fate |
| [`THE-ONE-SCREEN.md`](./the-first-run/THE-ONE-SCREEN.md) | The target architecture, station by station |

**The acceptance, and nothing else counts as done:** one piece of work enters at the first station
and completes all seven, driven entirely by agents, with no human touching it mid-run, and a person
can watch it happen on one screen. **This has not happened yet.**

> **Do not report this from the short query.** `entry_station = 'sense' AND station = 'learn' AND
> waived = '[]'` returns a non-zero count and is not the test: it cannot see a human who answered a
> boundary call or pressed a button mid-run, which R-18 disqualifies. The honest query returned
> **0** when last measured on 2026-08-26 and is in
> [`OPERATING-MODEL-5-SESSIONS.md`](./the-first-run/OPERATING-MODEL-5-SESSIONS.md) §2. The old
> shorthand "zero tracks reached learn" is **false**, corrected 2026-08-26.

The three-lane model and its `GOAL-*.md` files are **superseded** by the five-session model above.

---

## What we are building

**A world-class, premium product, and the ambition is not decoration.** The target is something used
daily by millions of people and defensible enough to be worth a very large company. Those two are
the same target reached from opposite ends: what makes it defensible is what makes it worth opening
twice. **It is held to [`docs/conventions/the-bar.md`](./docs/conventions/the-bar.md)**, which asks
one question of every surface: if Anthropic, OpenAI, Google, Vercel, Figma, Perplexity or Microsoft
put their name on this screen tomorrow, would it ship or get sent back?

**This is not a B2B SaaS application with AI features.** It is an agentic platform, and the
difference shows in what a person sees while the system works for them: **the agent's work is shown,
not hidden**, and the human keeps talking to it while the backend keeps running. That is a product
decision, not a UI preference, and the full instruction is in `the-bar.md` §4.

---

## The three layers. This is the product.

**Read this before the seven stations, because the stations are inside layer 02 and are not the
product.** Told **door, then body, then brain**, one headline per surface, never all three at once:
the door earns attention, the body earns belief, the brain earns the close.

| | Layer | What it does | Colour |
| --- | --- | --- | --- |
| **01** | **The director** | **Strategy.** Tells you what to build. Reads your signals, product data, competitors and your own past calls, and ranks what is worth doing next. | marigold `#e8b44c` |
| **02** | **The operating system** | **Execution, the whole of it.** Decides what is worth building, builds it, ships it, and checks what actually happened. The seven stations live here. | blue |
| **03** | **The brain** | **Strategy again, earned.** Learns, then guides: it tells you what is right next time and warns before you repeat what was wrong. | green |

**Where strategy sits, which is the question the seven stations obscure.** Layer 01 is strategy.
Layer 02 is tactics. **Layer 03 is the only thing that turns finished tactics back into strategy.**
Draw it as a circle rather than a line: 01 sets the bet, 02 executes it, 03 grades it and rewrites
what 01 believes. **Almost everyone sells layer 02**, because execution is legible and demoable.
Some sell layer 01. **Nobody closes 03 back onto 01, and that closure is the company.**

**So never lead with the seven stations.** Seven stations is a workflow tool, and a workflow tool is
compared on features. Three layers is a position, and a position is compared on whether the loop
closes. The stations are how layer 02 does its job, and they belong one level down.

**Why all three must be one product**, the answer to "isn't this three companies": you cannot be the
brain without owning the loop that generates outcomes, and you cannot run the loop without being the
operating system. Each layer is the precondition for the next. Ship any one alone and it is a
feature.

**Why we do not generate the code.** That market is finished and priced at over $48B, and the pain
moved without moving to generation: code review time **+441.5%** while throughput rose 33.7%,
agentic pull requests **5.3x** longer to pick up, DORA flat because output queued at review.
**Nobody is short of generated code; everybody is short of confidence in it.** Every builder is a
substitutable supplier to layer 02, so their commoditisation is our tailwind. Ruling:
[`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md) §5N.

**We do build, and since 2026-08-31 building here is the default and the only enabled path.** The
work is decided, built, shipped and graded inside Supaprod, with no toolchain for the customer to
assemble. Handing the spec to an external builder stays ruled in and **deferred, not deleted**.
Neither path breaks the loop, because **the verdict is measured against the forecast, not against
the code**: we never need to know how a change was built, only that it shipped and what happened.
Spec: [`the-first-run/SPEC-BUILD-PATHS.md`](./the-first-run/SPEC-BUILD-PATHS.md).

---

## Inside layer 02: seven stations, and it is a route, not a conveyor

```
  01 Discover -> 02 Decide -> 03 Plan -> 04 Design -> 05 Build -> 06 Ship -> 07 Learn
       ^                                                                        |
       +------------------------ outcome re-ranks the next bet -----------------+
```

**Work visits the subset of stations it needs and can enter at any of them** (founder ruling
2026-08-01). A copy tweak may go Discover, Build, Ship. A backend change skips Design. An existing
product getting one feature enters at Plan, and the loop must never force a customer through
discovery for work whose problem is already settled. **A skipped station is a decision on the record
with a reason**, never a silent omission. The path is policy, not permission.

| Station | What runs there |
| --- | --- |
| **01 Discover** | Signals ingest from every source, cluster into themes, surface what deserves attention. |
| **02 Decide** | A living, re-scored bet queue. The Critic red-teams every candidate before a human sees it. **The forecast is written here and nowhere else.** |
| **03 Plan** | Cited specs, scope, sequencing, the roadmap. |
| **04 Design** | Surfaces checked against Meridian, and an interactive prototype clickable before anyone writes code. |
| **05 Build** | The work is built here, on frontier models by API. |
| **06 Ship** | Release, gates, the deploy path, what customers see. |
| **07 Learn** | The outcome is settled with a verdict, written back against the decision that caused it, and used to re-rank what Discover and Decide surface next. **This is why the loop closes instead of stopping.** |

**Proof, not assertion.** The station-by-station account carrying a `file:line` for every structural
claim, and naming the gaps it still has, is
[`docs/features/lifecycle-signal-to-learning.md`](./docs/features/lifecycle-signal-to-learning.md).
Never claim a step of the loop the repo cannot show in code.

---

## Who it is for, and what we compete on

**Front door: the individual PM or founding PM**, drowning in the low-judgment half of the job.
Entry is the **Critic teardown**: point Supaprod at a feature you believe in and get an
evidence-backed red-team. **Expansion: the product team**, when a VP wants visibility over what was
decided and whether it paid off. **Buyer: the VP or Head of Product.**

**Supaprod touches eight surfaces and competes on exactly one:** whether the outcome of a shipped
bet is verified and fed back into the next decision. Everywhere else we integrate, absorb or ignore.
A company claiming to beat eight categories at once is not focused.

**The moat is the forecast captured at decision time**: what a team believed would happen, recorded
before the outcome was known. Everything else about a decision can be rebuilt afterwards from Slack
and call recordings; a forecast leaves no trace unless something caught it at the moment of the
call. **Storage is not the moat**, and neither is the compounding record, which a full read of the
market falsified on 2026-08-10.

Landscape table, per-competitor reasoning and the objection Q&A:
[`docs/strategy/moat.md`](./docs/strategy/moat.md). Vocabulary canon, including every banned word and
why: [`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md).
Live conversations: [`docs/pitch/founder-answer-playbook.md`](./docs/pitch/founder-answer-playbook.md).

---

## Where this actually is, stated plainly

**Read this before believing anything else in the file.** The engine is deep; market contact is near
zero. Both are true and the second is a decision, not an accident.

| | |
| --- | --- |
| **Users** | Founder and internal only. **Zero organic external users.** |
| **Revenue** | None. Billing is built, tested, and deliberately switched off. |
| **Public launch** | **30 September 2026** |
| **Built** _(counted 2026-09-01)_ | 2,246 source files · 86 authenticated routes · 153 server-function modules · 591 migrations · 961 test files |
| **Production data** | Founder and test workspaces only. **No customer data at all.** The loop is wired and proven; **it begins accruing on first real use.** |
| **Team** | Solo founder. No entity incorporated yet. US-primary. |

**Counts go stale. [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) is the
only status file** and wins over this table on any disagreement.

**Why no users yet, said as the decision it was.** A half-built loop teaches you the wrong thing.
The claim is that the loop *closes*, and you cannot validate that with a partial loop; you get
feedback on a demo instead of on the thesis.

**What is honestly not finished:** enterprise governance (SSO, full audit, roles) is architected, not
built; `fanout.server.ts` still passes an explicit `null` spend cap where every other writer resolves
through `resolveMissionSpendCap`; and nothing tests `discover/ranking` and `discover/format`
together, so a format-helper change can reorder the Discover queue with every unit case green.

**And the finding that shapes how we verify anything.** On 2026-08-02, nine separately shipped
features were found doing nothing in production. All nine passed typecheck and the full suite; two
had unit tests asserting the defect as the contract. **None was found by reading code.** They were
found by querying the live database. **Treat a green test as evidence the code does what the test
says, and nothing more.**

---

## Architecture

### What a user actually does

```
     Ask (top right, any surface): one composer, opens a pane, starts work at any station

  /start ---> what changed, what needs you, what agents did overnight
     |
     +---> 01 /discover   signals land, cluster into themes
     +---> 02 /decide     the ranked bet queue, red-teamed BEFORE you see it
     +---> 03 /plan       the cited spec, scope, sequencing              the outcome
     +---> 04 /design     surfaces against Meridian, clickable prototype re-ranks what
     +---> 05 /build      the work is built, diffs, the merge gate       appears here
     +---> 06 /ship       release, gates, what customers see                   ^
     +---> 07 /learn      the verdict is settled --------------------------->--+
                |
                v
        /outcomes         decisions, evidence, outcomes, and what it now advises
                          (a graph-view tab on the same page)

  /engine-room            one recessed door: traces, evals, prompts, budgets, guardrails
```

**Work enters at any station**, so an existing product getting one feature starts at `/plan` and
never sees discovery. **The line back from Learn to Discover is the product**; without it this is a
workflow tool. And the machinery lives behind **one door**, because the user should meet the output
of the machine, never the machine. That is the engine-room doctrine, and it is not in tension with
showing the agent's work: **the machinery is hidden, the work is shown.**

### How a request is served

```
  CLIENT            TanStack Start (React 19 + Vite 7) · Tailwind v4 · shadcn/ui
                    one Cloudflare Worker
                      | typed server functions        | /api/public/hooks/* (cron, ingest, webhooks)
                      v                                v
  TENANCY GATE      account -> workspace -> product
                    Supabase Auth, then RLS keyed on MEMBERSHIP in the database,
                    not in application code, which is why autonomy is safe here
                      v
  ORCHESTRATION     the seven-station route · the agent loop · the Critic
                    policy resolution (trust arc, tool risk floors, spend ceilings)
                      v
  AI CHOKEPOINT     src/lib/ai/runtime.server.ts, EVERY model call, no second path
                    budget -> credits -> cache -> pre-guard -> RAG -> PROVIDER
                                                 -> post-guard -> humanize -> log
                      v                                v
  MODELS            model-agnostic, our keys,   DATA   Supabase Postgres
                    credits-metered, BYOK              RLS · pgvector · pg_cron
                    from Business up                   embeddings via Cohere embed-v4
```

**The chokepoint is the design decision that matters most.** One function sees every model call, so
budgets, guardrails, cost tracking, caching, provider routing and output sanitising are implemented
once and cannot be bypassed. A new AI surface needs a valid `CallSurface` literal, which makes an
unbudgeted or unguarded call **a type error rather than an incident**.

Hosting, database, auth and deploys are managed by **Lovable**, the live system of record. **Pushing
does not deploy**; the founder clicks publish. Contracts: [`architecture/`](./architecture/README.md).

---

## Pricing, in one paragraph

**A tier sells seats and capability. Credits sell capacity.** Four tiers and only four: Free ($0),
Pro ($20/mo), Business ($50 per seat/mo, minimum 2), Enterprise (committed). **Every action spends
credits**, and the trust layer stays free, so traces, evals and verification never cost you.
**Read-only versus write-back is a permission boundary, not a paywall trick:** Free and Pro are in
only, Business is in and out, and `connectorTier` is a real entitlement whose guard throws.

**Twenty connector providers are registered and seventeen have a real adapter** (counted from
`src/lib/connectors/providers/index.server.ts`, 2026-09-01). **Three are stubs and must never be
named as available: Google Calendar, Google Tasks, Firecrawl.**

Full model and unit economics:
[`docs/strategy/pricing/pricing-architecture.md`](./docs/strategy/pricing/pricing-architecture.md).
**The live page `src/routes/pricing.tsx` is the authority when a document disagrees with it.**

---

## Run it

```bash
bun install        # deps (bunfig.toml enforces a 24h supply-chain guard)
bun run dev        # Vite dev server, verify UI changes here
bunx tsc --noEmit  # typecheck
bun test           # unit + integration, and it holds the repo invariants
bun run build      # production build (Vite -> Cloudflare Worker)
bun run lint       # ESLint
bun run docs:check # doc anti-rot, run before committing doc changes
```

Database changes are timestamped, RLS-aware SQL in `supabase/migrations/`, applied through Lovable
rather than a local Supabase CLI. Demo logins:
[`docs/operations/demo-credentials.md`](./docs/operations/demo-credentials.md), the only copy.

---

## Where everything lives

**Root holds two files.** It held four until 2026-09-01, when `AGENTS.md`, `CLAUDE.md` and
`GEMINI.md` (72KB, auto-loaded every session on top of a 45KB SessionStart injection) were archived
and a short `CLAUDE.md` written, to test whether a smaller instruction surface produces better work.
**Nothing was withdrawn and no ruling was reversed.**

| If you want... | Go to |
| --- | --- |
| **How do I build it** | [`CLAUDE.md`](./CLAUDE.md), auto-loaded. Long form: [`docs/archive/agent-operating-manual.md`](./docs/archive/agent-operating-manual.md) (was `AGENTS.md`). |
| **The standard every surface is held to** | [`docs/conventions/the-bar.md`](./docs/conventions/the-bar.md). Read before any surface work. |
| **Where we are, what is next, what needs the founder** | [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md). **The only status file.** |
| **What the last session did and left open** | [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md) |
| **Design: the live system** | [`docs/design/DESIGN-SYSTEM.md`](./docs/design/DESIGN-SYSTEM.md). **Meridian, and there is no other one.** Source `src/styles/meridian.css`, components `src/components/meridian/`. Extracted from [beautifui.dev](https://beautifui.dev), which is the floor rather than the inspiration and exposes its own codebase to port from. **Meridian is a baseline you may raise, never one to work below.** |
| **Design files that are NOT authority** | Everything in `design-reference/` is retired, including its `DESIGN.md` and `AI_Product_Design_Constitution.md`, which both call themselves the source of truth and are not. Each now carries a banner saying so. `bun test` fails on their tokens. |
| **Which strategy doc is current** | [`docs/strategy/README.md`](./docs/strategy/README.md), the arbiter. Moat: [`docs/strategy/moat.md`](./docs/strategy/moat.md). |
| **Writing an application, pitch, or demo** | [`docs/pitch/`](./docs/pitch/README.md), the Pitch Room, and its seven-step procedure. Start there, never from scratch. |
| **How a feature works, end to end** | [`docs/features/`](./docs/features/README.md) |
| **Architecture contracts** | [`architecture/`](./architecture/README.md): runtime · orchestration · security · data · frontend · integrations. |
| **Durable conventions** (the bar, voice, chrome, destructive actions, engine room) | [`docs/conventions/`](./docs/conventions/README.md) |
| **Ops: commits, hooks, skills, memory, demo logins** | [`docs/operations/`](./docs/operations/) |
| **Pricing and billing** | [`docs/strategy/pricing/`](./docs/strategy/pricing/README.md) |
| **Market and competitor evidence** | [`docs/research/`](./docs/research/) |
| **GTM execution, brand ops** | [`docs/growth/`](./docs/growth/README.md) |
| **The founding constitution** | [`docs/strategy/founding-constitution.md`](./docs/strategy/founding-constitution.md) |

**Before creating any file**, read the placement policy in [`docs/README.md`](./docs/README.md). One
purpose per doc, extend before you create, archive before you orphan, and link it from its folder
index in the same commit.

---

## Naming

**Supaprod**: lowercase for domains, handles and slugs, `Supaprod` in prose, never "SupaProd". It
shipped as *Cadence* until the 2026-07-17 rename; that name survives only as the generic English
word, in dated historical narrative, and in a few internal identifiers left unmigrated on purpose.
Ledger: [`docs/operations/rename-cadence-to-supaprod.md`](./docs/operations/rename-cadence-to-supaprod.md).

## License

Permissive intent. Until chosen: all rights reserved, © Supaprod contributors.
