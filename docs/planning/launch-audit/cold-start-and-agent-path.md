# The first sixty seconds, for a person and for an agent

> _Created: 2026-08-10 · Lane 1 (function / gaps / ship) · Measured against the live database and the shipped code, not read off a plan._

**Read beside [`station-chain-audit.md`](./station-chain-audit.md), which measures whether work flows between stations. This one measures whether anyone can get in at all.**

The brief sets two bars. A person should reach a real outcome in **60 seconds** with no docs or training. And the product is an **agent-first OS** where "every surface [is] usable in seconds by a person and **callable by an agent**", with 90 to 95 percent of the work executed by agents.

Those are two different products and only one of them exists.

---

## The human path: five phases, and the product promises ten minutes

First run is `ObsidianOnboarding`, a five-phase golden path: **arrival → product → data → critic → results**. It ends on a real Critic teardown, which is a genuine outcome and the right thing to end on. The path is not a tour; it produces something.

Three things it gets right, and they are worth protecting:

- **The data step is skippable.** There is an explicit "skip and connect later" path, so the classic onboarding wall (connect a source before you may see anything) is not a wall here.
- **It ends in an artifact, not a dashboard.** The user leaves with a teardown they can read and share.
- **Model latency is not the bottleneck.** Measured across 20,000+ `ai_events`: embedding-class calls average ~310ms, and the heaviest substantive surfaces (`discovery-scout`, `researcher`, `orchestrator`) average 3.5 to 3.8 seconds. A teardown inside 60 seconds is comfortably achievable on latency alone.

**What it gets wrong is the promise.** The onboarding runs a visible stopwatch against a "10-minute wedge" (`ObsidianOnboarding.tsx`, the `elapsed` timer). **The product's own first-run promise is ten minutes, which is ten times the target the brief sets.** That is not a bug in the timer; it is a decision about what first run is for, and the two cannot both be right.

**The gap is steps, not speed.** Latency says 60 seconds is reachable. Five phases with typed input in the middle says it is not. Closing it means removing phases, not optimizing calls.

---

## The agent path, and this is the finding that matters

The public agent surface is `POST /api/mcp` (JSON-RPC 2.0). It dispatches:

| | |
| --- | --- |
| **Read tools** | 11 — `search_signals`, `search_decisions`, `search_opportunities`, `search_prds`, `get_prd`, `get_ard`, `get_roadmap`, `get_governing_decision`, `get_contradiction_history`, `outcome_history`, `export_skillpack` |
| **Write tools** | **1** — `ingest_signal` |

The read surface is genuinely good. An agent can interrogate the whole record: decisions, specs, contradictions, outcome history, and a full skillpack export.

**The write surface is one tool, and it writes to station 01.** An agent can hand us a signal. It cannot decide, cut a spec, run design, build, ship, or settle an outcome. Every station after the first is closed to it.

### And today, an agent can do none of it

Three numbers from production:

| Measure | Value |
| --- | --- |
| `interop_write_enabled()` | **false** — so `ingest_signal`, the only write tool, is not callable |
| `mcp_tokens` issued, ever | **0** |
| `api_calls` by an agent, ever | **0** |

**Not one agent has ever connected to this product.** Not in test, not in a demo, not once. The surface has never been exercised by the user it was built for.

### Set that against the internal agents

The product's own agents run on `TOOL_REGISTRY`: **36 side-effecting tools**, spanning repo writes, PRs, merges, deployments, calendar, memory promotion and mission dispatch. Those agents can do the work. External agents get one write, switched off.

So the honest statement of where the thesis stands:

> The record is fully readable by an agent, and the work is not yet doable by one. "90-95% executed by agents" describes our OWN agents running inside the product, not the agent-first surface a customer would call.

That distinction is defensible and worth making plainly. What is not defensible is copy that implies a customer's agent can operate the lifecycle today.

---

## What is built and switched off, versus what is missing

This is not a hole where nothing exists. The governance around agent writes is real and complete:

- Per-token **scopes**, with `WRITE_SCOPE_BY_TOOL` mapping each write tool to its required scope
- A **global write gate** (`interop_write_enabled()`), off by default, so `toolsForScopes` yields the read-only catalogue unless both the gate and the scope agree
- **Rate limiting** with the write path counted separately from reads
- **Audit logging** into `api_calls`, recording the real tool name and a write flag rather than the literal `tools/call`
- Token **issue and revoke** paths (`issue_mcp_token`, `revoke_mcp_token`)

Everything needed to let an agent write safely exists. What is missing is the write tools themselves, all but one.

---

## Gaps

| P | Gap | Note |
| --- | --- | --- |
| **P0** | The agent surface has **1 write tool**, and the thesis claims agents execute the work | The governance is built; the verbs are not. Adding them is additive and can land behind the existing gate. |
| **P0** | **0 tokens, 0 calls** — the agent surface has never been exercised | Unexercised is not the same as broken, and it is not the same as working either. It needs one real end-to-end agent run before any agent-first claim ships. |
| **P1** | First run promises **10 minutes**; the target is **60 seconds** | A decision, not a bug. Closing it means removing phases, not optimizing calls. |
| **P2** | `MachineViewContainer.tsx` advertises "10 read tools"; there are **11** | Doc drift on an agent-facing surface. |

---

## What I would build, in order

1. **The write verbs that matter**, behind the gate that already exists and stays off: record a decision, draft a spec, settle an outcome. Those three turn the agent surface from "hand us a signal" into "run the loop", and each has a scope slot waiting for it.
2. **One real agent run, end to end**, issuing a token and driving a decision through to an outcome. Until that happens the surface is untested by its own user.
3. **Then decide the 60-second question**, because it is a product call about what first run is for and not an engineering one.
