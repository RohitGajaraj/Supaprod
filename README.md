# Supaprod

> _Created: 2026-06-03 · Last updated: 2026-08-03_

**Supaprod is the agent-first operating system for product teams. It tells you what to build, builds it, ships it, checks what actually happened, and learns from it, so next time it guides the call instead of waiting to be asked. Wired end to end, from signal to learning and back again.**

This file is the front door: what the product is, why it holds, and where every other document lives. It is the only navigation map in the repo. If you are here to **build**, read [`AGENTS.md`](./AGENTS.md) instead.

---

## The three layers. This is the product.

**Everything else in this file is detail under these three.** They are named and ordered, always told **door, then body, then brain**, one headline per surface, brain as the crescendo. Never all three at once.

| | Layer | What it does | The word for it |
| --- | --- | --- | --- |
| **01** | **The director** | Tells you what to build. Reads your signals, your product data, your competitors and your own past calls, and ranks what is worth doing next. | *marigold* `#e8b44c` |
| **02** | **The operating system** | Runs the whole lifecycle. Seven stations that agents walk unattended, inside boundaries a human sets in advance. | *blue* |
| **03** | **The company brain** | Learns, and then guides. Not where the record lives: it compounds, tells you what is right next time, and warns before you repeat what was wrong. | *green* |

**Why the order is not arbitrary.** The door is who it is for, so it earns attention. The body is what it does, so it earns belief. The brain is why it wins, so it earns the close. Leading with the brain sounds like a database; leading with the door and never reaching the brain sounds like a workflow tool.

**Why all three have to be one product**, which is the earned insight and the answer to "isn't this three companies": *you cannot be the company brain without owning the loop that generates outcomes, and you cannot run the loop without being the operating system.* Each layer is the precondition for the next. Ship any one alone and it is a feature.

This maps onto YC's own three Requests for Startups, which is confirmation rather than strategy: "Cursor for Product Managers" (the door), "The AI Operating System for Companies" (the body), "Company Brain" (the brain). **"Company brain" is YC's phrase, quoted and attributed, never our brand identity.** Our owned words are the outcome ledger, the decision brain, the receipts. Canonical memo: [`docs/pitch/repositioning-2026-07-22.md`](./docs/pitch/repositioning-2026-07-22.md).

---

## The claim, and the word that carries it

The last verb in that sentence is the whole product, so it is worth being exact about it.

**It learns, and then it guides. It does not remember.** "Remembers" describes a filing cabinet, and a filing cabinet is not defensible: any vendor can store your decisions, and a frontier model release can absorb search over them next quarter. **Learning is the part that compounds**, because it needs something no model has: your outcomes, labelled, over time.

So the language is load-bearing everywhere, in this repo and on every surface:

| Never say | Say |
| --- | --- |
| "where the record lives" | "it compounds" |
| "it remembers your decisions" | "next time it tells you what is right, and warns before you repeat what was wrong" |
| "searchable history" | "it guides the next call" |
| "storage", "archive", "log" (of the brain) | "the brain", which learns and guides |

**The mechanism, plainly.** A shipped outcome is settled at Learn with a verdict, that verdict is written back against the decision that caused it, and it **re-ranks what Discover and Decide surface next**. The loop does not end in a report; it ends by changing what you are shown. That is why this is an operating system and not a dashboard.

---

## The three things that are true about it

**One loop, not seven tools.** Discover, Decide, Plan, Design, Build, Ship and Learn run as one governed route that agents walk unattended, inside boundaries a human sets in advance. A recorded outcome re-ranks the next bet rather than ending in a report.

**Product judgment compounds, and it is portable across people.** Every decision, the alternatives weighed against it, and what actually happened stay in the workspace record, which is membership scoped. When a product manager leaves, the next person inherits it instead of starting cold. That is the enterprise reason to buy: continuity, audit, onboarding.

> **Known limit, do not overstate it.** `agent_memory`, the layer that pushes past outcomes into an agent's prompt and into the Critic's precedent, is still scoped to the **user** who wrote it, not the workspace. The successor inherits the record today, and not yet the compounded recall. Until that closes, say "the record travels", never "the memory travels". This is the one place where the honest claim is narrower than the ambition, and stating it narrowly is what makes the rest credible.

**Proof, not assertion.** The station-by-station, code-verified account of the loop, carrying a `file:line` for every structural claim and naming the gaps it still has, is [`docs/features/lifecycle-signal-to-learning.md`](./docs/features/lifecycle-signal-to-learning.md). Cite that file. Never claim a step of the loop the repo cannot show in code.

---

## The problem

A product operator owns the whole arc: talk to users, decide what is worth building, write the spec, get it built and shipped, launch it, handle support, and learn from the result. That arc is smeared across fifteen tools with a human manually carrying context across every seam. **The cost of switching, reconciling and re-explaining across those seams now exceeds the cost of the work itself.**

Point AI tools make one seam faster and leave the operator as the glue. To remove the glue, the substrate has to own the whole lifecycle, and agents have to *run* it, not assist it.

The deeper problem: **building is no longer the bottleneck, deciding what to build is.** Code has a fast oracle, it compiles in seconds, so building commoditizes. "What to build, and was it right" has no fast oracle, feedback lands in weeks to quarters, so it does not.

---

## The loop: seven stations, and it is a route, not a conveyor

```
  01 Discover -> 02 Decide -> 03 Plan -> 04 Design -> 05 Build -> 06 Ship -> 07 Learn
       ^                                                                        |
       +------------------------ outcome re-ranks the next bet -----------------+
```

**Work visits the subset of stations it actually needs, and can enter at any of them** (founder ruling 2026-08-01). A copy tweak may go Discover, Build, Ship. A backend change skips Design. An existing product getting one feature enters at Plan or Design, not at Discover, and the loop must never force a real customer through discovery for work whose problem is already settled.

A skipped station is **a decision on the record with a reason**, never a silent omission. The path is policy, not permission: the human sets the routing rule once and the loop routes itself thereafter. That is the line between a workflow tool and an agentic OS.

| Station | What runs there |
| --- | --- |
| **01 Discover** | Signals ingest from every source, cluster into themes, surface what is worth attention. |
| **02 Decide** | A living, re-scored opportunity queue. The Critic red-teams every candidate before a human sees it. |
| **03 Plan** | Cited specs, scope, sequencing, the roadmap. |
| **04 Design** | Scaffolded surfaces checked against the live design system. |
| **05 Build** | Our own engine writes code in the customer's repo, on frontier models via API. |
| **06 Ship** | Release, gates, the deploy path, what customers see. |
| **07 Learn** | The outcome is settled with a verdict, written back against the decision that caused it, and used to re-rank what Discover and Decide surface next. This station is the moat; it is why the loop closes instead of stopping. |

---

## Who it is for

**Front door: the individual PM or founding PM**, drowning in the low-judgment half of the job. Entry is the **Critic teardown**: point Supaprod at a feature you believe in and get an evidence-backed red-team with receipts.

**Expansion: the product team.** The decision system of record: governance, audit, shared compounding memory. The conversion happens when a VP wants visibility over what the team decided and whether it paid off.

**Buyer: the VP or Head of Product**, who wants the decision record, the governance layer, and the accountability story.

---

## Why it holds

### The six-month-forward doctrine (founder ruling 2026-08-01)

> We are not building for today's problem. Every solution is designed for where the industry will be **six months from the current date**, and it must also close the pain the user carried from the past.

Five tests, all of which a design passes before it is built:

1. **Assume the model layer commoditizes.** Anything one frontier release could absorb is not a moat. Build the loop, the gates and the ledger *around* the model, never the thin layer on top of it.
2. **Assume a large vendor ships our vertical next quarter.** Name what we still have that they do not. The answer must be the compounding decision-and-outcome record and the closed loop. If it is "nothing", the design is wrong and gets redone.
3. **Agentic-first, not agent-assisted.** A surface an autonomous agent cannot run end to end under policy is legacy the day it ships.
4. **Solve backwards and forwards.** Close the past pain, serve today's job, leave the seam for the six-month job.
5. **Delight is a requirement, not a finishing pass.**

### Why now

Three things had to be true at once, and they only became true recently.

1. **Agents got good enough to do the work, not just draft it.** Until roughly eighteen months ago the build half of the loop was not possible, so the loop could not close, so nobody could own it.
2. **Code got a fast oracle and judgment did not.** Code compiles in seconds, so an agent can iterate against it, so building commoditizes. "What should we build, and was that right" gets feedback in weeks to quarters. **The expensive half of product work is the half nobody automated, and it is the half that does not commoditize.**
3. **The pieces arrived in the wrong order for an incumbent to notice.** Issue trackers own tickets, doc tools own documents, code tools own repos. None had a reason to own the outcome.

**The window is one to two quarters, and it is closing.** Notion shipped "feedback to a merged PR" copy in July 2026. YC is actively funding this category by name. Whoever holds the outcome-verification loop first accumulates a record nobody can backfill.

### The moat, and where it actually sits

The moat is not one thing, it is **the third layer resting on the first two**. Each layer alone is copyable; the stack is not.

| Layer | Defensible alone? | Why, in detail |
| --- | --- | --- |
| **01 The director** | **No, and we should say so.** | Ranking what to build is a *capability*, not an asset. A frontier model plus a well-written prompt plus access to the same signals gets most of the way there, and gets closer with every model release. **Anyone can rank; the question is whether the ranking is any good, and that is answered by outcomes rather than by the ranker.** Which is why 01 is a door, not a moat: it is what earns the first ten minutes, and it is the layer we would lose first if we tried to defend it. |
| **02 The operating system** | **Partly, and only for a while.** | The loop, the gates, the tenancy model and the tamper-evident ledger are genuine engineering: months of it, and the reason autonomy is safe enough to sell. But it is *buildable*. A well-funded incumbent with distribution can construct the same route, and Notion has already shipped copy describing part of it. So the honest read is that 02 buys a lead measured in quarters, not a permanent position. **Its real job is to be the precondition for 03.** |
| **03 The company brain** | **Yes, and it is the only one.** | It requires **your** decisions, joined to **your** outcomes, labelled over time. That data does not exist anywhere to be bought, cannot be scraped, and cannot be synthesised, because it is *produced as a byproduct of running the loop*. A competitor cannot acquire it, a model release cannot absorb it, and a customer who has run six months of decisions through it holds something their competitor does not. It also gets **more** valuable as the model layer commoditizes, because when everyone has the same reasoning, the differentiator is whose context is better. |

**Read the table as one sentence:** we are honest that two of our three layers are copyable, because that is what makes the claim about the third one credible.

**So the defence is the ordering, not any single layer.** A competitor must own the loop before they can accumulate the record, and by the time they own the loop the record already favours whoever ran it longer.

### The landscape, and the one thing we compete on

**Read the framing before the table, because the framing is the strategy.**

Supaprod *touches* eight surfaces, because a closed loop necessarily passes through all of them. **We compete on exactly one:** whether the outcome of a shipped bet is verified and fed back into the next decision. Everywhere else we integrate, absorb, or deliberately ignore.

That distinction matters commercially and it matters in a pitch. **A company claiming to beat eight categories at once is not focused, it is unfocused with a long list**, and an investor reads it that way. So the table below exists to prove we know the terrain, not to declare eight wars.

| # | Surface we touch | Who owns it today | Our posture | Why |
| --- | --- | --- | --- | --- |
| 1 | **Outcome verification and decision memory** | **Nobody, and this is the whole company** | **COMPETE** | The bet is recorded, the result is settled against it, and that re-ranks what comes next. Measured empty in a fresh sweep: the drafting tools do not check, the workspaces do not close, the labs have no customer outcomes. **This is the only row where we intend to win.** |
| 2 | Issue tracking and the workspace | **Linear, Notion**, Jira, Monday, Asana, Height, Shortcut | **RACE, carefully** | **The genuine threat.** They have distribution we do not, and Notion shipped feedback-to-merged-PR copy in July 2026. They dispatch work; they do not verify outcomes. We do not try to be a better tracker. |
| 3 | Product management suites | Productboard, Aha!, Airtable, Coda, Fibery | ABSORB | Roadmap and prioritisation surfaces built for a human to fill in. Their information model assumes a person does the judgment. Ours assumes an agent does the work under policy. |
| 4 | Code generation | Cursor, Claude Code, Lovable, Devin, Replit, Bolt, v0, Factory, Cognition | **IGNORE as competitors** | Racing to zero on a fast oracle. They are this era's proof that agents can do real work. **Not our subcontractors either:** our build engine is our own, running frontier models by API in the customer's repo. |
| 5 | PRD and spec drafting | ChatPRD, Spark, plus every chat tab | ABSORB | Drafting is the cheap half and it commoditized first. One station of ours. |
| 6 | Customer feedback and signal | Dovetail, Enterpret, Cycle, Kraftful, Viable, Unwrap, Gong, Intercom | **INTEGRATE** | They are inputs, not rivals. Layer 01 reads them through one Connect button. Competing here would be replacing a source we want to consume. |
| 7 | Experimentation and analytics | Amplitude, Mixpanel, PostHog, Statsig, LaunchDarkly, Pendo | **INTEGRATE** | This is where the *outcome* actually lands. We read the result rather than own the measurement, and reading it is precisely what makes row 1 possible. |
| 8 | The model layer | Anthropic, OpenAI, Google | INTEGRATE | An input we orchestrate. A better model makes layers 01 and 02 better for free. |

**Say it in one line when asked "who are your competitors":** *"On the loop closing, nobody, and that is the bet. On the workspace, Linear and Notion, who have distribution we do not and no outcome verification. Everyone else in this space is either an input we read or a category we absorb."*

**The frontier test, applied.** When a lab ships a better model, layers 01 and 02 improve and layer 03 is untouched, because no model has your outcomes. That is why the six-month-forward doctrine above is a gate and not a slogan.

Full canon, the integrate/absorb/race/ignore reasoning per competitor, and the objection Q&A with answers: [`docs/strategy/moat.md`](./docs/strategy/moat.md). For a live conversation: [`docs/pitch/founder-answer-playbook.md`](./docs/pitch/founder-answer-playbook.md).

### How it makes money

**Outcome Credits, and no seats.** A credit prices a **finished deliverable**, never a token and never a person. Two mechanisms, and they deliberately do different jobs across the three layers.

**Mechanism one: credits meter delivery, on every layer that has marginal cost.**

| Layer | What draws a credit | What is free, on purpose |
| --- | --- | --- |
| **01 The director** | A ranked bet with the Critic's full teardown. A research brief you keep. | Browsing signals, clustering, the ranked queue itself, foresight. The high-frequency work feels unlimited. |
| **02 The operating system** | A spec, a design, a build run, a shipped change. The substantial deliverables. | **A run you stop early costs nothing.** Viewing, editing, retrying a failure. |
| **03 The company brain** | **Nothing.** Recall is never metered per query. | Every read of the record, always. |

Four rules make it feel unlike a meter: a credit is drawn **only on delivery** of something you can point at; **the trust layer is free**, so traces, evals and verification never cost you; the user is **never shown a dollar figure per action** or asked to approve a cost mid-flow; and the default is **stop-at-allowance**, so there is no surprise bill.

**Mechanism two: tiers gate the layer that compounds.** Layer 03 has near-zero marginal cost and unbounded value, so metering it would be both wrong and hostile. It is the reason to move up instead.

| | Free | Pro | Business | Enterprise |
| --- | --- | --- | --- | --- |
| Price | $0 | $20/mo | $50/mo | committed contract |
| Base credits | 50, 30-day decay | 100 | 100, pooled | committed annual pool |
| **Top-up** | upgrade | **credit dropdown, 100 to 10,000** | same, pooled + per-user caps | committed pool, negotiated |
| **Memory** | **decays** | **persistent** | shared across the team | plus governance and audit |
| Connectors | manual | read | write | approved lists |
| Seats | — | 1 | — | **unlimited** |

**How a top-up works, since a credit model is only as good as its refill.** You size the allowance from a **dropdown on the subscription**, from 100 up to 10,000 credits, on a **linear ladder with no volume discount** so the arithmetic stays honest and nobody negotiates against themselves. It is not a surprise overage charge and not a per-action purchase: **the default is stop-at-allowance**, so you run out rather than get billed. Near the limit there is a quiet nudge, and a flex buffer absorbs a single run that would otherwise clip the ceiling mid-flight. Base prices are placeholders until the founder sets the final Stripe numbers.

> **Honest caveat on the tier names.** Free / Pro / Business / Enterprise is the founder's locked decision (2026-07-13), which also retired the earlier thematic names. **The code and database still ship five tiers on the old slugs** (`free`, `pro`, `max`, `team`, `enterprise`), and `business` appears nowhere in the billing code. So the table above is the decision, not yet the implementation. Tracked as an open finding in [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md).

**Why this shape, in one line each.** Charging for deliverables rather than tokens means the customer compares us to the work replaced, not to an API bill. Not charging for recall means the brain gets used, which is the only way it compounds. **Unlimited seats at Enterprise** means we never tax a company for putting more people on the shared record, which is the exact behaviour our moat depends on. And per-seat pricing anywhere would tax usage, which is the behaviour that deepens the moat.

Full model, unit economics, and the BYOK stance (an advanced option from Business up, metered and governed with a thin platform fee): [`docs/strategy/pricing/pricing-architecture.md`](./docs/strategy/pricing/pricing-architecture.md).

**And your data is yours.** Full export in open formats, any time. A record that compounds is only a retention argument if leaving is genuinely possible; otherwise it is a trap, and buyers can tell the difference.

### Governance: policy, not permission (founder ruling 2026-07-29)

> Policy is set in advance and does not block. Permission is asked in the moment and does. **Supaprod is built on policy.**

The test every product decision passes: *"Even human in the loop, every approval, if it passes to a human, then what is the purpose of agents?"*

**The human's job is not to approve work. It is to set the boundaries, and to judge the small number of things that genuinely cross them.** The gate is the exception, not the loop. A long approvals queue is a policy failure to surface, not a workload to render.

This does not weaken the moat, it is why the moat matters: **autonomy is paid for with evidence.** Fewer interrupts is only safe because every action is recorded against a tamper-evident record. Four floors no boundary may lower: anything irreversible from inside the product, genuine judgment with no oracle, defaults the user never set, and hard risk floors above any earned autonomy.

Canonical: [`docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md`](./docs/planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md).

---

## Positioning canon

**These are founder-ratified and supersede conflicting copy anywhere in this repo.** Outward-facing work starts here, then goes to [`docs/pitch/`](./docs/pitch/README.md).

- **Tagline, all surfaces:** "Agents that know what to build, ship it, and remember."
  Support line: "One agentic operating system, every call on the record."
  Journey kicker: `signal -> shipped -> remembered`.
- **The three layers, always named and colored:** 01 the director (tells you what to build, marigold `#e8b44c`) · 02 the operating system (runs the whole lifecycle, blue) · 03 the company brain (remembers, and it guides, green).
- **The brain is never storage.** Banned framing: "where the record lives". It compounds; next time it tells you what is right, and warns before you repeat what was wrong.
- **Public launch date on every external surface: mid-September 2026.**
- **Market sizing ladder:** TAM $300B+/yr (2.6M PMs x ~$115K loaded). SAM $2B to $12B/yr. SOM ~$47M ARR. Arithmetic in the deck appendix B.
- **Never list, investor material:** no commit counts or feature-register numbers, no YC mentions in generic materials, self-build story implicit only, no "Cursor for PMs" phrasing on surfaces, employer is "Intellect, a leading BFSI technology OEM", education shows TUM only.
- **Contact:** founder@supaprod.ai · investors@supaprod.ai · linkedin.com/in/rohit-gajaraj.

**The triple-RFS telling** (2026-07-22): Supaprod sits at the intersection of YC's own three requests, one product at three altitudes. **The door** (who it is for) then **the body** (the closed loop) then **the brain** (the compounding memory, always the crescendo). One headline per surface, never all three at once. "Company brain" is YC's phrase, quoted and attributed, never our brand identity. Canonical memo: [`docs/pitch/repositioning-2026-07-22.md`](./docs/pitch/repositioning-2026-07-22.md).

---

## Where this actually is, stated plainly

**Read this before believing anything else in the file.** The engine is deep; market contact is near zero. Both halves are true and the second one is a decision, not an accident.

| | |
| --- | --- |
| **Users** | 8, all founder or internal. **Zero organic external users.** |
| **Revenue** | None. Billing is built, tested, and deliberately switched off. |
| **Public launch** | **mid-September 2026** |
| **Built** | 1,440 source files · 79 authenticated routes · 151 server-function modules · 462 migrations · 402 test files, 7,159 passing |
| **Open work** | 31 register rows. 371 shipped. |
| **Engine warmth** | 133 missions · 72 decisions · 49 learnings, on founder data, with outcome-reinforced ranking live |
| **Team** | Solo founder. No entity incorporated yet. US-primary. |

**Why no users yet, said as the decision it was.** A half-built loop teaches you the wrong thing. The whole claim is that the loop *closes*, that a shipped outcome changes what you are shown next, and you cannot validate that with a partial loop; you get feedback on a demo instead of on the thesis. The loop closes now.

**What is honestly not finished:**

- `agent_memory` is scoped to the **user** who wrote it, not the workspace. The successor inherits the record but not the compounded recall. Say "the record travels", never "the memory travels".
- Enterprise governance (SSO, full audit, roles) is architected, not built.
- `fanout.server.ts` still passes an explicit `null` spend cap, which reads as a deliberate no-ceiling on that one path while every other writer resolves through `resolveMissionSpendCap`.
- Nothing tests `discover/ranking` and `discover/format` together, so a format-helper change can reorder the Discover queue with all 212 unit cases green.

**And the finding that shapes how we verify anything.** On 2026-08-02, nine separately shipped features were found doing nothing in production. All nine passed typecheck and the full suite; two had unit tests asserting the defect as the contract. **None was found by reading code.** They were found by querying the live database, and a detector now exists so the tenth is caught automatically. Treat a green test as evidence the code does what the test says, and nothing more.

Live status: [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) §0.

---

## Architecture

Two views, because "how is it built" and "how does a person move through it" are different questions and the second one is the product.

### 1. What a user actually does

```
        ┌──────────────────────────── Ask (top right, any surface) ────────────────────────────┐
        │            one composer, opens a pane, can start work at any station                 │
        └──────────────────────────────────────────────────────────────────────────────────────┘

  /today ──► the daily ritual: what changed, what needs you, what agents did overnight
     │
     ├──► 01 /discover   signals land from every source ──► cluster into themes ──► what deserves attention
     │         │                                                    ▲
     │         ▼                                                    │
     ├──► 02 /decide     the ranked bet queue · the Critic red-teams it BEFORE you see it
     │         │                                                    │
     │         ▼                                                    │  the outcome
     ├──► 03 /plan       the cited spec, scope, sequencing          │  re-ranks
     │         ▼                                                    │  what appears
     ├──► 04 /design      surfaces scaffolded against the live system   here
     │         ▼                                                    │
     ├──► 05 /build       our engine writes code in your repo · diffs · the merge gate
     │         ▼                                                    │
     ├──► 06 /ship        release, gates, what customers see        │
     │         ▼                                                    │
     └──► 07 /learn       the verdict is settled ────────────────────┘
               │
               ▼
          /brain          the compounding record: decisions, evidence, outcomes, and what it now advises
                          (/knowledge for the graph view)

  /engine-room            one recessed door: traces, evals, prompts, budgets, guardrails, incidents
                          the machinery is reachable on demand and never in the way
```

**Three things this view is meant to make obvious.** Work **enters at any station**, so an existing product getting one feature starts at `/plan` and never sees discovery. The line back from Learn to Discover **is the product**; without it this is a workflow tool. And every piece of machinery lives behind **one door**, because the user should meet the output of the machine, never the machine.

### 2. How a request is served

```
  CLIENT            TanStack Start (React 19 + Vite 7) · Tailwind v4 · shadcn/ui
                    deployed as a single Cloudflare Worker
                      │ typed server functions              │ /api/public/hooks/*
                      │ (one module per domain)             │ (cron, ingest, webhooks)
                      ▼                                     ▼
  TENANCY GATE      account ─► workspace ─► product
                    Supabase Auth, then RLS keyed on MEMBERSHIP in the database
                    ── not in application code, which is why autonomy is safe here
                      │
                      ▼
  ORCHESTRATION     the seven-station route · the agent loop · the Critic
                    policy resolution (trust arc, tool risk floors, spend ceilings)
                    a skipped station is recorded WITH ITS REASON, never silently
                      │
                      ▼
  AI CHOKEPOINT     src/lib/ai/runtime.server.ts ── EVERY model call, no second path
                    budget ─► credits ─► cache ─► pre-guard ─► RAG ─► PROVIDER
                                                    ─► post-guard ─► humanize ─► log
                      │                                     │
                      ▼                                     ▼
  MODELS            model-agnostic, selected per job     DATA   Supabase Postgres
                    our keys, credits-metered                    RLS · pgvector · pg_cron
                    BYOK from Business up, thin platform fee   embeddings via Cohere embed-v4
```

**The chokepoint is the design decision that matters most.** One function sees every model call, so budgets, guardrails, cost tracking, caching, provider routing and output sanitising are each implemented once and cannot be bypassed. A new AI surface needs a valid `CallSurface` literal, which means an unbudgeted or unguarded call is a type error rather than an incident.

Hosting, the database, auth and deploys are provisioned and managed by **Lovable**, which is the live system of record. **Pushing does not deploy**; the founder clicks publish. Contracts per layer: [`architecture/`](./architecture/README.md).

---

## Run it

Bun is the package manager and runner.

```bash
bun install        # deps (bunfig.toml enforces a 24h supply-chain guard)
bun run dev        # Vite dev server, verify UI changes here
bunx tsc --noEmit  # typecheck
bun test           # unit + integration
bun run build      # production build (Vite -> Cloudflare Worker)
bun run lint       # ESLint
```

Database changes are timestamped, RLS-aware SQL in `supabase/migrations/`. Applying them is done through Lovable, not a local Supabase CLI.

**Logins for demos and testing:** [`docs/operations/demo-credentials.md`](./docs/operations/demo-credentials.md). Do not paste credentials into other docs; that file is the only copy, and it carries a warning about which rows have been verified. Rehearse on the `harbor@` account, never on one you plan to send out.

---

## Where everything lives

**Root holds four files, and nothing else.** Each answers one question.

| File | Answers | Read it when |
| --- | --- | --- |
| **`README.md`** (here) | What is Supaprod, and where is everything? | Evaluating it, or looking for another doc. |
| [**`AGENTS.md`**](./AGENTS.md) | How do I build it? | Writing any code, human or agent. The rules, gates and invariants. |
| [**`CLAUDE.md`**](./CLAUDE.md) | Claude Code specifics | Auto-loaded by Claude Code. Thin by design. |
| [**`GEMINI.md`**](./GEMINI.md) | Gemini / Antigravity specifics | Auto-loaded by those tools. Thin by design. |

### By what you are doing

| If you want... | Go to |
| --- | --- |
| **Where we are, what is next, what needs the founder** | [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) §0. The only status file. |
| **Per-feature status and claims** | [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) |
| **What the last session did and left open** | [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md) |
| **Which strategy doc is current** | [`docs/strategy/README.md`](./docs/strategy/README.md), the arbiter. Direction: [`docs/strategy/v11-guiding-star.md`](./docs/strategy/v11-guiding-star.md). Moat: [`docs/strategy/moat.md`](./docs/strategy/moat.md). |
| **⭐ Writing an application, pitch, or demo** | [`docs/pitch/`](./docs/pitch/README.md), **the Pitch Room.** Its README carries the seven-step procedure for a new accelerator or investor application: which programs are worth applying to, the two blockers that kill most of them, where to pull answers rather than compose them, the facts that get fumbled, and the never-list. Start there, never from scratch. For a live investor or interview conversation, [`docs/pitch/founder-answer-playbook.md`](./docs/pitch/founder-answer-playbook.md) is the trainer, and it is updated after every one. |
| **Design: the live system** | [`docs/design/DESIGN-SYSTEM.md`](./docs/design/DESIGN-SYSTEM.md). The shipped `--sp-*` shell is the baseline; every earlier design contract is retired history. |
| **How a feature works, end to end** | [`docs/features/`](./docs/features/README.md). The loop's proof file: [`docs/features/lifecycle-signal-to-learning.md`](./docs/features/lifecycle-signal-to-learning.md). |
| **Architecture contracts** | [`architecture/`](./architecture/): runtime · orchestration · security · data · frontend · integrations. |
| **Durable conventions** (voice, chrome, destructive actions, engine room) | [`docs/conventions/`](./docs/conventions/README.md) |
| **Ops: commits, hooks, skills, memory, demo logins** | [`docs/operations/`](./docs/operations/) |
| **Pricing and billing** | [`docs/strategy/pricing/`](./docs/strategy/pricing/README.md), start at `pricing-architecture.md`. |
| **Market and competitor evidence** | [`docs/research/`](./docs/research/) |
| **GTM execution, brand ops** | [`docs/growth/`](./docs/growth/README.md) · [`docs/growth/brand-ops/`](./docs/growth/brand-ops/README.md) |
| **The founding constitution** | [`docs/strategy/founding-constitution.md`](./docs/strategy/founding-constitution.md) |
| **What shipped, historically** | [`docs/planning/archive/build-log.md`](./docs/planning/archive/build-log.md) |

**Before creating any file**, read the placement policy in [`docs/README.md`](./docs/README.md). One purpose per doc, extend before you create, archive before you orphan, and link it from its folder index in the same commit.

---

## Naming

The product is **Supaprod**: lowercase `supaprod` for domains, handles and slugs, `Supaprod` in prose, `SUPAPROD` only in legal contexts, and never camel-case "SupaProd". It shipped as *Cadence* until the rename executed on 2026-07-17. That name is retired, with three narrow exceptions: the generic English word ("release cadence", the DB `cadence` column), dated historical narrative, and a short list of internal identifiers left unmigrated on purpose. The ledger of those: [`docs/operations/rename-cadence-to-supaprod.md`](./docs/operations/rename-cadence-to-supaprod.md).

## License

Permissive intent. Until chosen: all rights reserved, © Supaprod contributors.
