# Build Engine Strategy memo (Gate #1 founder sign-off)

> Created: 2026-07-19 · Research stream, front-end reimagining Phase R
> Question: how Supaprod runs the BUILD stage natively on frontier-model APIs so users never detour to an external codegen platform.
> Web research date: 2026-07-19 (mid-2026 state, primary and secondary sources cited inline). Internal state verified against `src/lib/build/` and the PC-35 dashboard row on the same date.
> Honesty rule applied throughout: every claim is tagged WORKS TODAY, WIRED-BUT-DORMANT, or PLANNED.

---

## 1. Verdict in one paragraph

Supaprod already owns the right architecture: the `BuildDriver` seam exists in code (`src/lib/build/driver.ts`), the native loop is wrapped as an adapter, an OpenHands adapter is wired, and a first Claude-backed driver shipped 2026-07-16 (PC-35, dormant behind a flag, never live-tested). The bet for the native path is a two-rung owned ladder: the existing single-shot patch driver as the launch rung (cheap, bounded, already built), and a true Claude Agent SDK iterative driver as the premium rung (the real PC-35 promise, needs a sandbox, lands in the PC-35 lane, not this sprint). Models route to drivers through capability classes resolved by config, never vendor ids in product code. BYO engines (Devin, Codex, Cursor, self-hosted OpenHands) demote to a Settings > Build engines enterprise section and never appear in onboarding or any journey. The front-end sprint ships the Build stage experience on what is wired today and names the driver on the mission receipt; the engine lane hardens and extends underneath without the UI changing shape.

---

## 2. What exists today (code-grounded, honest)

Verified 2026-07-19 in this repo. The strategy canon (`docs/strategy/build-driver-and-dispatch.md`) is one step behind the code; the code is ahead of the doc, not the reverse.

| Piece | File | Status |
| --- | --- | --- |
| `BuildDriver` seam (types, id normalizer, `BuildSpec`, dispatch/poll/result/cancel lifecycle) | `src/lib/build/driver.ts` | WORKS TODAY (pure module, tested) |
| Native adapter wrapping the home-grown agent loop (mission + queued `agent_runs`, cancel parity with `cancelMission`) | `src/lib/build/native.server.ts` | WORKS TODAY, the default floor |
| OpenHands adapter | `src/lib/build/openhands.server.ts` | WIRED-BUT-DORMANT (needs endpoint + key, delegate-out flag) |
| Claude driver, id `claude-sdk` | `src/lib/build/claude-sdk-driver.server.ts` | WIRED-BUT-DORMANT (`CLAUDE_SDK_BUILD_DRIVER_ENABLED` off; never live-tested against a real repo per the PC-35 row) |
| Resolver: `preferred` -> `BUILD_DRIVER` env -> native floor, degrade to native when unavailable | `src/lib/build/resolve.server.ts` | WORKS TODAY |
| Driver-choice heuristic `chooseBuildDriverId` (file-count based, pure, tested) | build layer | WORKS TODAY (nothing calls it from a UI yet) |
| Merge gate (CI-green J2, eval regression P4, review-pinned `studio.pr.merge`, approvals, trust arc) | studio/loop layer | WORKS TODAY, engine-independent |
| Repo access (`RepoProvider`: readTree/readFile/createBranch/commitFiles/openChangeRequest) | `src/lib/connectors/repo-provider.ts` | WORKS TODAY (BYO-P1) |

Honest limits of the shipped `claude-sdk` driver, from its own header and the PC-35 row:

1. **It is not the Claude Agent SDK.** It is one `callModel` turn through the existing runtime chokepoint (surface `studio`): read `spec.targetFiles` (required, max 12 files), ask for full replacement file contents, commit on a fresh branch, open a PR. Single-shot, not iterative; it cannot explore an unfamiliar repo, run tests, or self-correct mid-task. dispatch() completes synchronously; poll/result report an already-known terminal state.
2. Credit enforcement is the existing account-level gate inside `callModel`; there is no per-task pre-authorization hold.
3. The model is hard-coded: `CLAUDE_SDK_MODEL = "claude-sonnet-4-5-20250929"`, a vendor id (and a stale one relative to the mid-2026 lineup) inside product code. The native loop similarly defaults to a hard-coded `google/gemini-2.5-flash`.
4. `driver.ts` still lists `claude-sdk` in `RESERVED_BUILD_DRIVER_IDS` while `resolve.server.ts` wires a live adapter for it; the registry misreports its own state.

PC-35 dashboard row (row 19, In Dev, lane-3, 2026-07-16): the driver needs a Fable review pass and a real dry run on a connected test repo before the flag ever flips on. PC-21 (row 85, Gated): OpenHands productized as the $0/self-host enterprise driver plus BYO Devin/Codex/Cursor keys, post-launch at G-TEAM. Neither the receipt line UI ("Driver: ...") nor any driver-facing surface exists.

---

## 3. Market scan (mid-2026, web-verified)

### 3.1 Frontier coding models

Prices are USD per 1M tokens, input/output, standard API tier, as published mid-July 2026. SWE-Bench Pro is the harder, contamination-resistant benchmark; Verified is the older, commonly quoted one.

| Model | Price (in/out) | Coding capability | Notes for Supaprod |
| --- | --- | --- | --- |
| **Claude Fable 5** (Anthropic) | $10 in (premium tier) | 80.3% SWE-Bench Pro, 11 points clear of next best; 1M context, 128K output | The frontier ceiling. Access restored 2026-07-01 after a restricted period. Judgment-class, not the default build workhorse |
| **Claude Mythos 5** (Anthropic) | $10 in | Same capability class as Fable 5 | Trusted-access variant, broader safeguards lifted; not relevant to codegen routing |
| **Claude Opus 4.8** (Anthropic) | $5 / $25 | 79.4% SWE-bench Verified, 69.2% SWE-Bench Pro | Strong but priced above Sonnet 5 for a smaller gap |
| **Claude Sonnet 5** (Anthropic, rel. 2026-06-30) | $2 / $10 intro through 2026-08-31, then $3 / $15 | 72.7% Verified, 63.2% Pro, 80.4% Terminal-Bench 2.1 (beats Opus 4.8's 74.6% there); "most agentic Sonnet yet" | **The price-performance sweet spot for an owned driver.** Best-in-family terminal/agentic behavior at a fifth of Opus output cost |
| **GPT-5.3-Codex** (OpenAI) | $1.75 / $14 | 55.6% SWE-Bench Pro (SOTA claim within the Codex line) | Credible alternate for the standard class |
| **GPT-5 Codex** (OpenAI) | $1.25 / $10 | >70% SWE-bench Verified | Cheap standard-class alternate; Codex product itself is $20-$200/mo subscription |
| **GPT-5.6 "Sol"** (OpenAI) | ~half Fable 5 cost (reported) | Fast coding; benchmark reliability questioned in reviews | Watch, do not bet |
| **Gemini 3.1 Pro** (Google) | $2 / $12 (<=200K), $4 / $18 long context | Recommended by Google for agentic coding | Alternate standard class |
| **Gemini 3.5 Flash** (Google) | $1.50 / $9 | 76.2% Terminal-bench 2.1, 55.1% SWE-Bench Pro | Strong economy-class candidate; thinking tokens compound cost in agent loops |
| **Kimi K2.6 / K2.7 Code** (Moonshot, open weights, rel. 2026-04-20, 1T MoE) | $0.95 / $4, $0.19 cache-hit input | K2.6: 58.6% SWE-Bench Pro, 66.7% Terminal-Bench 2.0; K2.7 Code leads MCP tool-use scores | **The economy-class disruptor**: near-standard capability at roughly a quarter of Sonnet 5 cost, and self-hostable (open weights) for the enterprise/OpenHands path |
| **DeepSeek V4** (open weights) | competitive with Kimi (per open-weights comparisons) | Contender in every mid-2026 open-weights coding showdown | Same role as Kimi: economy class + self-host |

Sources: [Finout Fable 5/Mythos 5 pricing](https://www.finout.io/blog/claude-fable-5-mythos-5-pricing-benchmarks), [TrueFoundry Fable 5](https://www.truefoundry.com/blog/claude-fable-5-api-benchmarks-pricing-how-to-use-it), [BenchLM Claude pricing](https://benchlm.ai/anthropic/api-pricing), [MarkTechPost Sonnet 5 vs Opus 4.8](https://www.marktechpost.com/2026/07/13/anthropic-claude-sonnet-5-vs-sonnet-4-6-vs-opus-4-8-agentic-coding-benchmarks-api-pricing-and-cost-performance-tradeoffs-compared/), [Vellum Sonnet 5 benchmarks](https://www.vellum.ai/blog/claude-sonnet-5-benchmarks-explained), [OpenRouter GPT-5.3-Codex](https://openrouter.ai/openai/gpt-5.3-codex), [PricePerToken GPT-5.3-Codex](https://pricepertoken.com/pricing-page/model/openai-gpt-5.3-codex), [BenchLM Gemini pricing](https://benchlm.ai/blog/posts/gemini-api-pricing), [BenchLM Kimi pricing](https://benchlm.ai/moonshot/api-pricing), [Codersera K2.6 guide](https://codersera.com/blog/kimi-k2-6-complete-guide-2026/), [TechTimes GPT-5.6 Sol review](https://www.techtimes.com/articles/319808/20260707/gpt-56-sol-review-faster-coding-half-fable-5-cost-benchmark-problem.htm).

### 3.2 Harness landscape (who runs the loop)

| Harness | Mid-2026 state | Embed/white-label | Role for Supaprod |
| --- | --- | --- | --- |
| **Claude Agent SDK** | Python + TS, the exact engine under Claude Code, headless by design (call a function, stream messages, embed in a product or unattended pipeline). Renamed from Claude Code SDK 2025-09. The announced 2026-06-15 separate credit-pool billing change was PAUSED by Anthropic; SDK usage still rides normal API/plan billing | Yes: terms permit powering your own product ("Supaprod Build, powered by Claude" style attribution; not "Claude Code") | **The premium owned-harness bet** (the real BD-1) |
| **OpenHands** (All Hands AI) | v1.7.0 (May 2026), 71K+ stars, MIT core, model-agnostic (75+ providers incl. open weights), new Software Agent SDK (Python + REST), Kubernetes support (v1.6.0), Agent Canvas control center; enterprise tier: VPC self-host, RBAC, SAML/SSO, budget enforcement | Yes, MIT self-host | The $0-COGS enterprise/self-host driver (PC-21, post-launch); pair with open-weights models (Kimi/DeepSeek) for a fully self-hosted stack |
| **Devin** (Cognition) | Entry price collapsed 96% to $20/mo + $2.25/ACU ($2.00 on the $500 Teams plan); 67% of PRs merged (their own figure); still 5-10x pricier per task than token-billed rivals; no self-host, no white-label, no BYO LLM | No | BYO relay only (enterprise setting) |
| **Cursor** (Anysphere) | Pro $20/mo (incl. $20 usage), Pro+ $60, Ultra $200, Teams $40/user; Cloud Agents API exists; explicitly no white-label/reseller | No | BYO relay only (enterprise setting) |
| **OpenAI Codex** (product) | $20-$200/mo, lives in ChatGPT + terminal, CLI open source | CLI yes, cloud no | BYO relay / CLI adapter, demand-gated |
| **OSS agents** (Aider, SWE-agent, Cline, Goose) | Alive, Apache/MIT | Yes | Optional adapters, demand-gated; not worth attention this quarter |

Sources: [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview), [Agent SDK credit-change pause](https://www.digitalapplied.com/blog/anthropic-claude-credit-overhaul-june-15-2026), [OpenHands GitHub](https://github.com/OpenHands/OpenHands), [OpenHands Software Agent SDK](https://docs.openhands.dev/sdk), [openhands.dev](https://www.openhands.dev/), [Devin pricing](https://devin.ai/pricing/), [AgentMarketCap pricing wars](https://agentmarketcap.ai/blog/2026/04/07/coding-agent-pricing-wars-devin-commodity), [TECHSY background agents compared](https://techsy.io/en/blog/background-coding-agents-compared).

**What changed since the June-2026 canon in `build-driver-and-dispatch.md`:** the Claude 5 family landed (Sonnet 5's terminal/agentic scores make the owned-driver economics much better than when BD-1 was specced against the 4.x line); Devin's price collapsed from $500/mo to $20/mo + ACUs, confirming the commoditization thesis in real time; open-weights models (Kimi K2.6/2.7, DeepSeek V4) crossed the "good enough for bounded tasks" line at roughly a quarter of frontier cost; OpenHands shipped a proper SDK + Kubernetes, strengthening the enterprise self-host rung. Every shift favors the seam strategy; none weakens it.

---

## 4. Recommendation: the owned native path

### 4.1 The driver ladder (three owned rungs, one seam)

1. **Native loop (floor).** WORKS TODAY. Bounded, small, safe changes; cheapest; fully owned. Keep as the resolver's degrade target forever.
2. **Single-shot patch driver (launch rung).** WIRED-BUT-DORMANT. Rename it honestly (see 4.3): it is a targeted-files patch generator riding `callModel`, not an agentic session. After the Fable review + one real dry run on a test repo, this is the rung the rebuild's Build stage ships on. It covers the charter's "Build this feature" journey for scoped work: spec in, real PR out, merge behind the untouched gate.
3. **Agentic driver on the Claude Agent SDK (premium rung, the real PC-35).** PLANNED. Multi-turn, tool-using, test-running, self-correcting, against a sandboxed checkout. This is the genuine "never detour to an external platform" promise for unscoped or large work. It requires an execution sandbox (the Cloudflare Workers runtime cannot run generated code or a repo checkout); candidates: Cloudflare Sandbox/containers (closest to our deploy target), E2B, Modal, Daytona, Fly Machines. Sandbox selection is a PC-35-lane decision, not a front-end decision.

Why the Agent SDK over OpenHands for the premium owned rung: it is the same harness under Claude Code (the strongest harness in the market by usage), headless-first, embeddable under our brand by its terms, and it pairs with the Sonnet 5 price-performance point. OpenHands stays exactly where PC-21 put it: the $0/self-host enterprise driver (its MIT license plus open-weights models gives enterprises a fully self-hosted stack we can white-label), post-launch at G-TEAM.

### 4.2 Model routing by capability class (the Master Brief rule, made concrete)

Product code must never name a vendor model. Introduce three codegen capability classes, resolved to concrete models by one config table (env/DB-backed, per-workspace overridable for BYOK), living beside the existing `callModel` chokepoint:

| Class | Contract | Mid-2026 default resolution | Alternates (config-swappable) |
| --- | --- | --- | --- |
| `codegen.economy` | Bounded diffs, small blast radius, cost floor | Gemini 3.5 Flash or Kimi K2.7 Code | Gemini 3 Flash, DeepSeek V4 |
| `codegen.standard` | The workhorse: patch driver + most agentic tasks | **Claude Sonnet 5** | GPT-5.3-Codex, Gemini 3.1 Pro |
| `codegen.frontier` | Hard tasks, large refactors, last-resort escalation | Claude Opus 4.8 or Fable 5 | (judgment call per task budget) |

Routing: `chooseBuildDriverId` (exists) picks the driver; the driver requests a class; the class table resolves the model. A better model shipping anywhere becomes a one-row config change, zero product-code change, which is exactly the seam economics argument in the canon (`build-driver-and-dispatch.md`, 2026-07-10 appendix, argument 4).

### 4.3 Naming honesty

The id `claude-sdk` on a driver that does not use the Claude Agent SDK is a claim outrunning wiring inside our own codebase. Two options, either acceptable: (a) rename the shipped driver id to something engine-honest (e.g. `patch`) and reserve `claude-sdk` for the real Agent SDK driver; (b) keep the id but fix the file header and every surface string to "single-shot patch driver" until the SDK harness actually lands. The mission receipt must name what actually ran.

---

## 5. Cost per outcome (estimates, tagged as such)

Anchors: a chat turn is ~$0.003-0.02; an agentic coding task averages 1-3.5M tokens including retries (canon §8.3); Devin charges $2.25/ACU (~15 min work).

| Outcome | Driver + class | Estimated raw model cost | Basis |
| --- | --- | --- | --- |
| Bounded diff, 1-3 files | Native, `codegen.economy` | $0.01-0.10 | Small prompt, one or two turns on a Flash/Kimi-class model |
| Targeted patch PR, <=12 files | Patch driver, `codegen.standard` (Sonnet 5 intro $2/$10) | **$0.10-0.50 per PR** | ~20-60K in + 5-25K out, single shot, no retries inside the driver |
| Full agentic task (explore, edit, test, iterate) | Agent SDK driver, `codegen.standard` | **$2-8 per task** (before caching; prompt caching typically cuts input cost 60-90%, so $1-4 effective) | 1-2M in + 200-400K out at $2/$10; rises ~50% at post-August $3/$15 |
| Same task, `codegen.frontier` escalation | Agent SDK driver, Opus 4.8/Fable 5 | $10-40 per task | Reserve for budget-approved hard tasks only |
| Same task on BYO Devin | relay | $4.50-22.50 (2-10 ACUs), on the user's contract | Their COGS, not ours |

Per-outcome, not per-run: price the **merged PR**, not the attempt. Devin's own 67% merge rate says one in three runs needs a retry or human salvage; budget 1.3-1.5x the per-task figure per merged outcome. Two consequences: (1) the per-task pre-authorization hold (PC-35's named next increment) is mandatory before the agentic rung goes to paying users; (2) managed-credits pricing keeps healthy margin even at 2x markup on the standard class (a ~$3 effective task billed at ~$6-8 in credits undercuts a Devin ACU-priced equivalent while covering retries).

---

## 6. What ships in this rebuild sprint vs the PC-35 lane

### Inside the rebuild sprint (front-end lane, sandbox branch)

- **The Build stage Canvas face** (`CanvasFace`: code + terminal per the charter): live diff view, file list, CI status, PR link, all reading the mission/run rows the native driver already writes. No new engine work required.
- **Dispatch wiring**: the Build journey calls `resolveBuildDriver` + `chooseBuildDriverId` (both exist); driver choice is automatic and silent; no engine picker in any primary flow.
- **Driver named on the mission receipt** (one quiet line in the details view, credits language, per the costs-are-quiet rule): "Driver: Supaprod native" today; the patch driver's name appears only after its dry run passes and the flag flips.
- **Copy discipline**: the Build stage describes what is wired (scoped changes to a connected repo, PR out, you approve the merge). No "autonomous engineer" language until the agentic rung exists.
- **Settings > Build engines section scaffold** (enterprise-labeled, see §7), even if it only shows the native driver at first.

### The PC-35 lane (engine work, unchanged shape underneath the UI)

1. Fable review pass + one real dry run of the patch driver on a connected test repo (the row's own gate); then flip `CLAUDE_SDK_BUILD_DRIVER_ENABLED`.
2. Fix the honesty items: driver naming (§4.3), remove `claude-sdk` from `RESERVED_BUILD_DRIVER_IDS`, replace the two hard-coded model ids with the capability-class table (§4.2).
3. Per-task credit pre-authorization hold in the credits ledger.
4. The real Agent SDK iterative driver: sandbox selection, repo checkout, multi-turn loop, same `BuildSpec` in, same PR + merge gate out.
5. PC-21 stays post-launch: OpenHands productized + BYO keys at G-TEAM.

---

## 7. BYO engines demote cleanly to an enterprise setting

- **Location**: Settings > Workspace > Build engines, in an explicitly enterprise-labeled section. Never in onboarding, never in any journey, never a modal interrupting a build.
- **Default**: every workspace builds on the owned ladder with automatic driver selection. Zero configuration required to complete the "Build this feature" journey.
- **BYO shape**: paste-a-key (Devin/Codex/Cursor) or endpoint + key (self-hosted OpenHands) through the existing `resolveProviderAuth` credential chain (workspace binding -> user connection -> env fallback) and the encrypted vault; each BYO engine is just another `BuildDriver` adapter behind the same resolver, so enabling one changes routing, not the product.
- **Transparency**: BYO runs are labeled with the user's own engine name on the receipt ("Driver: your Devin"). Their engine, their bill, our spec + merge gate; the canon's trust-feature framing, not brand dilution.
- **Degrade**: a misconfigured or unavailable BYO engine silently falls back to the native floor (the resolver already does this), so an enterprise toggle can never dead-end a journey.

---

## 8. What Supaprod should steal

1. **Steal Sonnet 5 as the `codegen.standard` default** the day the class table exists: 80.4% Terminal-Bench 2.1 (best in the Claude family for agentic terminal work) at $2/$10 intro pricing is the best owned-driver economics available in mid-2026. Set a calendar note for the 2026-09-01 price step to $3/$15.
2. **Steal the capability-class routing table now, in this sprint's registry work**: a tiny config module (`codegen.economy|standard|frontier` -> model id) that `claude-sdk-driver.server.ts` and the native loop read instead of their hard-coded ids. One file, removes both Master Brief violations, and makes every future frontier release a config change.
3. **Steal Devin's receipt honesty inversion**: Devin hides cost mechanics behind ACUs; we name the driver and surface credits one click deep. "Driver: Supaprod native / patch / agent" on every mission receipt is cheap to build (the data is on the session row) and is the trust signature no competitor shows.
4. **Steal the Kimi/DeepSeek open-weights rung for the enterprise story**: OpenHands (MIT, K8s, SDK) + open-weights models = a fully self-hosted, $0-marginal-COGS build stack for enterprise procurement conversations. Do not build it now (PC-21, G-TEAM); do put one sentence about it in the pitch room's enterprise Q&A.
5. **Steal the Agent SDK's headless contract as the internal driver contract**: dispatch, stream, finish-or-fail-detectably. The dormant patch driver's synchronous dispatch() is fine for single-shot but the `BuildSession`/poll shape must stay async-first so the agentic rung drops in without changing any UI code.
6. **Steal Cursor's "included usage" framing for managed credits**: plans include a build allowance in credits, metered per driver, never flat-fee unlimited (canon §9 already forbids it; the front end should show remaining allowance in Settings, not inline).

---

## 9. Gaps discovered

GAP: The shipped `claude-sdk` build driver does not use the Claude Agent SDK; it is a single-shot `callModel` patch generator requiring `spec.targetFiles`. The name is a claim outrunning wiring inside our own code; rename or re-scope the surface strings before any UI names it.
GAP: Vendor model ids are hard-coded in product code (`CLAUDE_SDK_MODEL = "claude-sonnet-4-5-20250929"` in `claude-sdk-driver.server.ts`; `google/gemini-2.5-flash` default in the native loop), violating the Master Brief's capability-class rule; no codegen class-to-model routing table exists anywhere.
GAP: No execution sandbox exists for an iterative agentic driver; the Cloudflare Workers runtime cannot check out a repo or run tests, and no sandbox provider (Cloudflare Sandbox, E2B, Modal, Daytona) is integrated or even selected.
GAP: No per-task credit pre-authorization hold; the only spend enforcement is the account-level gate inside `callModel`, so one runaway agentic task could drain a workspace's whole allowance before tripping it.
GAP: `RESERVED_BUILD_DRIVER_IDS` in `driver.ts` still lists `claude-sdk` even though `resolve.server.ts` wires a live adapter for it; the driver registry misreports which engines are implemented.
GAP: The patch driver has never been live-tested against a real repo (PC-35 row's own admission); the rebuild's Build journey cannot present it as available until the dry run passes.
GAP: No surface anywhere names the driver on a mission receipt; the "driver named on every mission receipt" ruling (2026-07-10 driver ladder) has no UI home yet.

---

## 10. Founder decisions requested at Gate #1

1. Approve the two-rung owned ladder (patch driver at launch, Agent SDK agentic driver in the PC-35 lane) as the native-build story the rebuilt front end is designed around.
2. Approve the capability-class routing table as in-sprint scope (small, removes the vendor hard-coding violations).
3. Approve the driver rename/re-scope (§4.3) before any UI string names it.
4. Confirm BYO engines live only in Settings > Build engines (enterprise section), per §7.
5. Authorize the patch-driver dry run on a test repo (real credits, small budget) so the flag can flip inside the sprint window.
