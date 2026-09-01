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

> _Created: 2026-07-17 · Last updated: 2026-09-01_

**Supaprod tells you what to build, builds it, ships it, checks what actually happened, and learns
from it, so next time it guides the call.**

This file is the front door: what the product is, and where every other document lives. It is the
only navigation map in the repo. **It deliberately does not restate strategy, pricing or canon** in
full, because every one of those has an owning document and a duplicated copy here is a copy that
drifts. Each section below says its claim and links to the file that owns it.

If you are here to **build**, read [`CLAUDE.md`](./CLAUDE.md).

---

## The active mission

**Read [`the-first-run/START-HERE.md`](./the-first-run/START-HERE.md) before doing anything on this
repo.** Since 2026-08-25 the platform is being transformed, not extended.

| File | What it settles |
| --- | --- |
| [`START-HERE.md`](./the-first-run/START-HERE.md) | What we are doing and why, in one page |
| [`RULINGS.md`](./the-first-run/RULINGS.md) | **The tiebreaker. If any two documents in this repo disagree, it wins.** Its OPEN list is what nobody may decide alone |
| [`OPERATING-MODEL-5-SESSIONS.md`](./the-first-run/OPERATING-MODEL-5-SESSIONS.md) | **Current, from 2026-08-26.** Five sessions, path ownership, the coordination protocol, and the honest acceptance query |
| [`BUILD-QUEUE.md`](./the-first-run/BUILD-QUEUE.md) | The single ordered backlog. A lane takes the topmost item it owns by path |
| [`FINDINGS-LEDGER.md`](./the-first-run/FINDINGS-LEDGER.md) | What was found, fixed, still open, or proved false. **Read it before re-investigating anything** |
| [`SURFACE-MAP.md`](./the-first-run/SURFACE-MAP.md) | Every route and component directory, with its owner and whether it is kept, folded or deleted |
| [`THE-ONE-SCREEN.md`](./the-first-run/THE-ONE-SCREEN.md) | The target architecture, station by station |

**The acceptance, and nothing else counts as done:** one piece of work enters at the first station
and completes all seven, driven entirely by agents, with no human touching it mid-run, and a person
can watch it happen on one screen. **This has not happened yet.**

> **Do not report this from the short query.** `entry_station = 'sense' AND station = 'learn' AND
> waived = '[]'` returns a non-zero count and is not the test: it cannot see a human who answered a
> boundary call or pressed a button mid-run, which R-18 disqualifies. The honest query, which
> subtracts both and returned **0** when last measured on 2026-08-26, is in
> [`OPERATING-MODEL-5-SESSIONS.md`](./the-first-run/OPERATING-MODEL-5-SESSIONS.md) §2. The earlier
> shorthand "zero tracks reached learn" is **false** and was corrected on 2026-08-26.

The three-lane model, and [`GOAL-main-lane.md`](./the-first-run/GOAL-main-lane.md) with its two
siblings, are **superseded** by the five-session model above. They are kept for their acceptance
wording only.

---

## The three layers. This is the product.

Always told **door, then body, then brain**, one headline per surface, never all three at once.

| | Layer | What it does | Colour |
| --- | --- | --- | --- |
| **01** | **The director** | Tells you what to build. Reads your signals, product data, competitors and your own past calls, and ranks what is worth doing next. | marigold `#e8b44c` |
| **02** | **The operating system** | Decides what is worth building, builds it, ships it, and checks what actually happened. Seven stations agents walk on their own, inside boundaries a human sets in advance. | blue |
| **03** | **The brain** | Learns, then guides. It compounds, tells you what is right next time, and warns before you repeat what was wrong. | green |

**Why the order is not arbitrary.** The door is who it is for, so it earns attention. The body is
what it does, so it earns belief. The brain is why it wins, so it earns the close. Leading with the
brain sounds like a database; leading with the door and never reaching the brain sounds like a
workflow tool.

**Why all three must be one product**, which is the answer to "isn't this three companies": you
cannot be the brain without owning the loop that generates outcomes, and you cannot run the loop
without being the operating system. Each layer is the precondition for the next. Ship any one alone
and it is a feature.

**Why we do not generate the code.** That market is finished and priced at over $48B, and the pain
moved without moving to generation: code review time **+441.5%** while throughput rose 33.7%,
agentic pull requests **5.3x** longer to pick up, DORA flat because output queued at review.
**Nobody is short of generated code; everybody is short of confidence in it.** Every builder is a
substitutable supplier to layer 02, so their commoditisation is our tailwind. Ruling:
[`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md) §5N.

**We do build, and since 2026-08-31 building here is the default and the only path enabled.** The
work is decided, built, shipped and graded inside Supaprod, with no toolchain for the customer to
assemble. Handing the spec out to an external builder stays ruled in and **deferred, not deleted**.
The reason neither path breaks the loop is that **the verdict is measured against the forecast, not
against the code**: we never need to know how a change was built, only that it shipped and what
happened. Spec: [`the-first-run/SPEC-BUILD-PATHS.md`](./the-first-run/SPEC-BUILD-PATHS.md).

---

## The loop: seven stations, and it is a route, not a conveyor

```
  01 Discover -> 02 Decide -> 03 Plan -> 04 Design -> 05 Build -> 06 Ship -> 07 Learn
       ^                                                                        |
       +------------------------ outcome re-ranks the next bet -----------------+
```

**Work visits the subset of stations it actually needs, and can enter at any of them** (founder
ruling 2026-08-01). A copy tweak may go Discover, Build, Ship. A backend change skips Design. An
existing product getting one feature enters at Plan or Design, and the loop must never force a real
customer through discovery for work whose problem is already settled.

A skipped station is **a decision on the record with a reason**, never a silent omission. The path
is policy, not permission: the human sets the routing rule once and the loop routes itself
thereafter. That is the line between a workflow tool and an agentic OS.

| Station | What runs there |
| --- | --- |
| **01 Discover** | Signals ingest from every source, cluster into themes, surface what is worth attention. |
| **02 Decide** | A living, re-scored opportunity queue. The Critic red-teams every candidate before a human sees it. **The forecast is written here and nowhere else.** |
| **03 Plan** | Cited specs, scope, sequencing, the roadmap. |
| **04 Design** | Scaffolded surfaces checked against the live design system, and an interactive prototype clickable before anyone writes code. |
| **05 Build** | The work is built here, on frontier models by API. |
| **06 Ship** | Release, gates, the deploy path, what customers see. |
| **07 Learn** | The outcome is settled with a verdict, written back against the decision that caused it, and used to re-rank what Discover and Decide surface next. **This station is why the loop closes instead of stopping.** |

**Proof, not assertion.** The station-by-station, code-verified account carrying a `file:line` for
every structural claim, and naming the gaps it still has, is
[`docs/features/lifecycle-signal-to-learning.md`](./docs/features/lifecycle-signal-to-learning.md).
Cite that file. Never claim a step of the loop the repo cannot show in code.

---

## Who it is for, and what we compete on

**Front door: the individual PM or founding PM**, drowning in the low-judgment half of the job.
Entry is the **Critic teardown**: point Supaprod at a feature you believe in and get an
evidence-backed red-team. **Expansion: the product team**, when a VP wants visibility over what was
decided and whether it paid off. **Buyer: the VP or Head of Product.**

**Supaprod touches eight surfaces and competes on exactly one:** whether the outcome of a shipped
bet is verified and fed back into the next decision. Everywhere else we integrate, absorb, or
deliberately ignore. A company claiming to beat eight categories at once is not focused.

**The moat is the forecast captured at decision time**: what a team believed would happen, recorded
before the outcome was known. Everything else about a decision can be rebuilt afterwards from Slack
and call recordings; a forecast leaves no trace unless something caught it at the moment of the
call. **Storage is not the moat** and neither is the compounding record, which a full read of the
market falsified on 2026-08-10.

Full landscape table, the integrate/absorb/race/ignore reasoning per competitor, and the objection
Q&A: [`docs/strategy/moat.md`](./docs/strategy/moat.md). Positioning canon, including every word
that is banned and why: [`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md).
For a live conversation: [`docs/pitch/founder-answer-playbook.md`](./docs/pitch/founder-answer-playbook.md).

---

## Where this actually is, stated plainly

**Read this before believing anything else in the file.** The engine is deep; market contact is near
zero. Both halves are true and the second one is a decision, not an accident.

| | |
| --- | --- |
| **Users** | Founder and internal only. **Zero organic external users.** |
| **Revenue** | None. Billing is built, tested, and deliberately switched off. |
| **Public launch** | **30 September 2026** |
| **Built** _(counted 2026-09-01)_ | 2,246 source files · 86 authenticated routes · 153 server-function modules · 591 migrations · 961 test files |
| **Production data** | Founder and test workspaces only. **No customer data at all.** The loop is wired and proven; **it begins accruing on first real use.** |
| **Team** | Solo founder. No entity incorporated yet. US-primary. |

**Counts go stale. [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) is the
only status file**, and it wins over this table on any disagreement.

**Why no users yet, said as the decision it was.** A half-built loop teaches you the wrong thing.
The whole claim is that the loop *closes*, and you cannot validate that with a partial loop; you get
feedback on a demo instead of on the thesis.

**What is honestly not finished:** enterprise governance (SSO, full audit, roles) is architected,
not built; `fanout.server.ts` still passes an explicit `null` spend cap where every other writer
resolves through `resolveMissionSpendCap`; and nothing tests `discover/ranking` and
`discover/format` together, so a format-helper change can reorder the Discover queue with every unit
case green.

**And the finding that shapes how we verify anything.** On 2026-08-02, nine separately shipped
features were found doing nothing in production. All nine passed typecheck and the full suite; two
had unit tests asserting the defect as the contract. **None was found by reading code.** They were
found by querying the live database. **Treat a green test as evidence the code does what the test
says, and nothing more.**

---

## Architecture

Two views, because "how is it built" and "how does a person move through it" are different
questions, and the second one is the product.

### 1. What a user actually does

```
        +---------------------------- Ask (top right, any surface) ----------------------------+
        |            one composer, opens a pane, can start work at any station                 |
        +--------------------------------------------------------------------------------------+

  /today ---> the daily ritual: what changed, what needs you, what agents did overnight
     |
     +---> 01 /discover   signals land from every source, cluster into themes
     |          |                                                   ^
     +---> 02 /decide     the ranked bet queue, red-teamed BEFORE you see it
     |          |                                                   |
     +---> 03 /plan       the cited spec, scope, sequencing         |  the outcome
     |          |                                                   |  re-ranks what
     +---> 04 /design     surfaces scaffolded against the live system  appears here
     |          |                                                   |
     +---> 05 /build      the work is built, diffs, the merge gate  |
     |          |                                                   |
     +---> 06 /ship       release, gates, what customers see        |
     |          |                                                   |
     +---> 07 /learn      the verdict is settled -------------------+
                |
                v
           /brain         the compounding record: decisions, evidence, outcomes, what it now advises
                          (/knowledge for the graph view)

  /engine-room            one recessed door: traces, evals, prompts, budgets, guardrails, incidents
```

**Three things this view is meant to make obvious.** Work **enters at any station**, so an existing
product getting one feature starts at `/plan` and never sees discovery. The line back from Learn to
Discover **is the product**; without it this is a workflow tool. And every piece of machinery lives
behind **one door**, because the user should meet the output of the machine, never the machine.

### 2. How a request is served

```
  CLIENT            TanStack Start (React 19 + Vite 7) · Tailwind v4 · shadcn/ui
                    deployed as a single Cloudflare Worker
                      | typed server functions              | /api/public/hooks/*
                      v                                      v
  TENANCY GATE      account -> workspace -> product
                    Supabase Auth, then RLS keyed on MEMBERSHIP in the database
                    (not in application code, which is why autonomy is safe here)
                      |
                      v
  ORCHESTRATION     the seven-station route · the agent loop · the Critic
                    policy resolution (trust arc, tool risk floors, spend ceilings)
                    a skipped station is recorded WITH ITS REASON, never silently
                      |
                      v
  AI CHOKEPOINT     src/lib/ai/runtime.server.ts, EVERY model call, no second path
                    budget -> credits -> cache -> pre-guard -> RAG -> PROVIDER
                                                 -> post-guard -> humanize -> log
                      |                                  |
                      v                                  v
  MODELS            model-agnostic, our keys,      DATA   Supabase Postgres
                    credits-metered, BYOK from            RLS · pgvector · pg_cron
                    Business up                           embeddings via Cohere embed-v4
```

**The chokepoint is the design decision that matters most.** One function sees every model call, so
budgets, guardrails, cost tracking, caching, provider routing and output sanitising are each
implemented once and cannot be bypassed. A new AI surface needs a valid `CallSurface` literal, which
means an unbudgeted or unguarded call is a **type error rather than an incident**.

Hosting, the database, auth and deploys are provisioned and managed by **Lovable**, which is the
live system of record. **Pushing does not deploy**; the founder clicks publish. Contracts per layer:
[`architecture/`](./architecture/README.md).

---

## Pricing, in one paragraph

**A tier sells seats and capability. Credits sell capacity.** Keeping those two axes separate is the
whole model. Four tiers and only four: Free ($0), Pro ($20/mo), Business ($50 per seat/mo, minimum
2), Enterprise (committed). **Every action spends credits**, and what stays free is the trust layer,
so traces, evals and verification never cost you. **Read-only versus write-back is a permission
boundary, not a paywall trick:** Free and Pro are in only, Business is in and out, and
`connectorTier` is a real entitlement whose guard throws rather than a label on a pricing page.

**Twenty connector providers are registered and seventeen have a real adapter** (counted from
`src/lib/connectors/providers/index.server.ts` on 2026-09-01). **Three are still stubs and must
never be named as available in outward copy: Google Calendar, Google Tasks and Firecrawl.**

Full model, unit economics and the BYOK stance:
[`docs/strategy/pricing/pricing-architecture.md`](./docs/strategy/pricing/pricing-architecture.md).
Per-provider status: [`docs/operations/connectors/README.md`](./docs/operations/connectors/README.md).
**The live page `src/routes/pricing.tsx` is the authority when a document disagrees with it.**

---

## Run it

Bun is the package manager and runner.

```bash
bun install        # deps (bunfig.toml enforces a 24h supply-chain guard)
bun run dev        # Vite dev server, verify UI changes here
bunx tsc --noEmit  # typecheck
bun test           # unit + integration, and it holds the repo invariants
bun run build      # production build (Vite -> Cloudflare Worker)
bun run lint       # ESLint
bun run docs:check # doc anti-rot, run before committing doc changes
```

Database changes are timestamped, RLS-aware SQL in `supabase/migrations/`. Applying them is done
through Lovable, not a local Supabase CLI.

**Logins for demos and testing:**
[`docs/operations/demo-credentials.md`](./docs/operations/demo-credentials.md). That file is the
only copy; do not paste credentials into other docs.

---

## Where everything lives

**Root holds two files.** It held four until 2026-09-01, when `AGENTS.md`, `CLAUDE.md` and
`GEMINI.md` (72KB, auto-loaded into every session on top of a 45KB SessionStart injection) were
archived and a short `CLAUDE.md` written, to test whether a smaller instruction surface produces
better work. **Nothing was withdrawn and no ruling was reversed.**

| File | Answers | Read it when |
| --- | --- | --- |
| **`README.md`** (here) | What is Supaprod, and where is everything? | Evaluating it, or looking for another doc. |
| [**`CLAUDE.md`**](./CLAUDE.md) | How do I build it? | Writing any code, human or agent. Commands and the invariants that bite. |
| [`docs/archive/agent-operating-manual.md`](./docs/archive/agent-operating-manual.md) | The long form of the above | You need a rule the short brief does not carry. Was `AGENTS.md`. |

### By what you are doing

| If you want... | Go to |
| --- | --- |
| **Where we are, what is next, what needs the founder** | [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md). **The only status file.** |
| **What the last session did and left open** | [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md) |
| **Which strategy doc is current** | [`docs/strategy/README.md`](./docs/strategy/README.md), the arbiter. Moat: [`docs/strategy/moat.md`](./docs/strategy/moat.md). |
| **Writing an application, pitch, or demo** | [`docs/pitch/`](./docs/pitch/README.md), **the Pitch Room.** Its README carries the seven-step procedure. Start there, never from scratch. |
| **Design: the live system** | [`docs/design/DESIGN-SYSTEM.md`](./docs/design/DESIGN-SYSTEM.md). **Meridian, and there is no other one.** Its source and reasoning are in `src/styles/meridian.css`; it is extracted from [beautifui.dev](https://beautifui.dev), which is the floor rather than the inspiration and exposes its own codebase to port from. Meridian is a baseline you may raise, never one to work below. Every earlier contract (v1 Ember, v3 Obsidian, v4 Loom, v5 Tempo, Cadence/ink) is retired history, and `bun test` fails on their tokens. |
| **How a feature works, end to end** | [`docs/features/`](./docs/features/README.md). The loop's proof file: [`docs/features/lifecycle-signal-to-learning.md`](./docs/features/lifecycle-signal-to-learning.md). |
| **Architecture contracts** | [`architecture/`](./architecture/README.md): runtime · orchestration · security · data · frontend · integrations. |
| **Durable conventions** (voice, chrome, destructive actions, engine room) | [`docs/conventions/`](./docs/conventions/README.md) |
| **Ops: commits, hooks, skills, memory, demo logins** | [`docs/operations/`](./docs/operations/) |
| **Pricing and billing** | [`docs/strategy/pricing/`](./docs/strategy/pricing/README.md), start at `pricing-architecture.md`. |
| **Market and competitor evidence** | [`docs/research/`](./docs/research/) |
| **GTM execution, brand ops** | [`docs/growth/`](./docs/growth/README.md) |
| **The founding constitution** | [`docs/strategy/founding-constitution.md`](./docs/strategy/founding-constitution.md) |

**Before creating any file**, read the placement policy in [`docs/README.md`](./docs/README.md). One
purpose per doc, extend before you create, archive before you orphan, and link it from its folder
index in the same commit.

---

## Naming

The product is **Supaprod**: lowercase `supaprod` for domains, handles and slugs, `Supaprod` in
prose, `SUPAPROD` only in legal contexts, and never camel-case "SupaProd". It shipped as *Cadence*
until the rename on 2026-07-17. That name is retired, with three narrow exceptions: the generic
English word ("release cadence", the DB `cadence` column), dated historical narrative, and a short
list of internal identifiers left unmigrated on purpose. The ledger:
[`docs/operations/rename-cadence-to-supaprod.md`](./docs/operations/rename-cadence-to-supaprod.md).

## License

Permissive intent. Until chosen: all rights reserved, © Supaprod contributors.
