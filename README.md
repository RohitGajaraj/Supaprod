# Supaprod

> _Created: 2026-06-03 · Last updated: 2026-08-03_

**Supaprod is the agent-first operating system for product teams. It tells you what to build, builds it, ships it, checks what actually happened, and learns from it, so next time it guides the call instead of waiting to be asked. Wired end to end, from signal to learning and back again.**

This file is the front door: what the product is, why it holds, and where every other document lives. It is the only navigation map in the repo. If you are here to **build**, read [`AGENTS.md`](./AGENTS.md) instead.

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

### The moat

The moat is the **decision layer**: what to build, and whether the call was right. Vibe-coding tools own the build layer, which is racing to zero. We own the decision layer, which has no fast oracle, and we run the build ourselves on the same commodity models they race on.

**Engine positioning, not a wrapper.** The models are interchangeable parts; the system is ours: the loop, the gates, the ledger. Our own build engine runs frontier models via API in the customer's repo. Never say we dispatch work to Cursor, Lovable, or Devin. They are the era's proof, not our subcontractors.

Full canon, competitor map, and the objection Q&A: [`docs/strategy/moat.md`](./docs/strategy/moat.md).

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

## The system, at a glance

```
1. CLIENT   calm front; the loop is the hero
            TanStack Start (React 19 + Vite 7) · Tailwind v4 · shadcn/ui
              |  server functions (typed RPC)     |  /api/public/hooks/*
              v                                   v
2. TENANCY  account / workspace / product
            Supabase Auth -> RLS scoped by membership
              |
              v
3. ORCHESTRATION  runs the seven-station route
            agent loop · the Critic · governance gates · spend ceilings
              |
              v
4. AI CHOKEPOINT  src/lib/ai/runtime.server.ts, EVERY model call
            budget -> credits -> cache -> guardrails -> RAG -> provider -> guardrails
              |
              v
5a. MODELS  model-agnostic, our keys, credits-metered (BYOK is enterprise-only)
5b. DATA    Supabase Postgres: RLS · pgvector · pg_cron
```

Deployed to **Cloudflare Workers**; backend, auth, hosting and deploys are provisioned and managed by **Lovable**, which is the live system of record. Contracts live in [`architecture/`](./architecture/).

**Scale today:** 1,440 source files · 79 authenticated routes · 151 server-function modules · 462 migrations · 402 test files.

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
