# Launch research briefs — 2026-07-10 (the v13 evidence base)

> _Created: 2026-07-10 · Last updated: 2026-08-04_

> _Four sourced research briefs produced by the v13 goal session's agent sweep (competitive landscape · frontier-agent UX · market sizing · Airtable HyperAgent), preserved at full detail per the founder's 2026-07-10 documentation ruling (chat-showcased analysis must land in the repo, same session). Companion: [`pm-voice-and-ai-tooling-research.md`](./pm-voice-and-ai-tooling-research.md) (user voices). Consumers: the YC application (PC-27), the demo script, the beta trust surface, and [`strategy/archive/v13-proof-campaign.md`](../strategy/archive/v13-proof-campaign.md) §§4–9._

---

## Brief 1 — Competitive landscape (2026-07-10)

### PM-native

- **ChatPRD** — chat-native PRD writer. $15–29/mo. 100K+ PMs, 750K+ docs, bootstrapped. Copilot. No ingestion, no build, no outcome loop. [chatprd.ai/pricing](https://www.chatprd.ai/pricing)
- **Productboard Spark** — "Agentic Jobs" (briefs, feedback/competitor analysis). $15–19/maker/mo + credits. $1.72B valuation, $71.8M revenue, 4K customers. Copilot. Static ICE/RICE, never outcome-reinforced. [productboard.com/pricing](https://www.productboard.com/pricing/)
- **Aha!** — bootstrapped suite, $9–59/user/mo, $100M+ ARR profitable. Copilot; single-suite, no cross-connector ingestion, no build spine. [openviewpartners.com](https://openviewpartners.com/blog/ahas-bootstrapped-journey-from-1-to-100m-in-arr/)
- **Zeda.io** — VoC + static ICE/RICE. From $228/mo; ~$360K FY25 revenue. Copilot. [zeda.io/pricing](https://zeda.io/pricing)
- **Cycle** — **acquired by Atlassian** (2025-09-03), folded into Jira Product Discovery, standalone sunset 2025-10-31. [atlassian.com/blog](https://www.atlassian.com/blog/announcements/cycle-joining-atlassian)
- **Kraftful** — **acquired by Amplitude** (Jul 2025). Was free–$400/mo, $5.15M raised (YC). [tracxn.com](https://tracxn.com/d/companies/kraftful/__ewX31_yuv6ZDkEPGlwJwRHg2kTllifVrLbQ7QwdzzG4)
- **Dovetail** — research repo + proactive signal agents. $29–99+/user/mo. Copilot leaning agent; research-only. [dovetail.com/pricing](https://dovetail.com/pricing/)
- **Sprig** — research agents. From $199/mo; $152M raised. Copilot, research station only. [g2.com](https://www.g2.com/products/sprig/pricing)
- **airfocus** — roadmaps + Insights Agent (Jun 2026), MCP server. $19–99+/editor/mo. Copilot; gets orchestrated, not orchestrating. [airfocus.com/pricing](https://airfocus.com/pricing/)
- **Featurebase** — "Fibi" resolves support tickets autonomously. $29/seat + $0.29/resolution. True-agent, support-scoped. [featurebase.app/pricing](https://www.featurebase.app/pricing)
- **Canny** — Autopilot AI (dedup, replies). $19–79+/mo. Copilot. [g2.com](https://www.g2.com/products/canny/pricing)

### Platform giants

- **Airtable** — Omni (conversational agent, Jun 2025) → **HyperAgent** (Apr 2026: autonomous 24/7 agents on dedicated VMs, Opus 4.8, code exec + browser) → **ProductCentral** (a named PM altitude product). $20–45/user/mo + $6 AI add-on; ~$478M revenue. True-agent, general-purpose; no product-decision outcome ranking. [airtable.com/platform/ai-agents](https://www.airtable.com/platform/ai-agents)
- **Atlassian Rovo + JPD** — cross-product agents, credit-metered; Rovo Dev $20/dev/mo; absorbed Cycle. Copilot/agent hybrid locked to Atlassian's graph. [atlassian.com/licensing/rovo](https://www.atlassian.com/licensing/rovo)
- **Linear** — "Linear Agent" (Mar 2026 beta, free on all plans) triages issues; **"Coding Sessions" (Jun 2026) write code via Claude Code/Codex before a human sees the issue**. True-agent; the fastest tracker closing decide→code; no ICE/outcome-scored decision layer or multi-source Brain. [theregister.com](https://www.theregister.com/2026/03/26/linear_agent/) · [linear.app/changelog](https://linear.app/changelog/2026-06-11-coding-sessions)
- **Notion** — Custom Agents (proactive, trigger-based). $10/1,000 credits. True-agent, workflow automation; no PM ranking/outcome model. [matthiasfrank.de](https://matthiasfrank.de/en/notion-custom-agents-full-tutorial-use-cases-pricing-changes/)
- **Monday.com** — credits mandatory (May 2026 repricing). [support.monday.com](https://support.monday.com/hc/en-us/articles/35277848309394-The-pricing-model-for-monday-AI-portfolio)
- **ClickUp** — Brain $9 / Everything AI $28/user; Super Agents (task ops). $300M+ ARR. [clickup.com/brain/pricing](https://clickup.com/brain/pricing)
- **Asana** — AI Studio + "Dash" AI chief-of-staff (monitors work, flags risk). True-agent (ops), not PM-specific. [computerworld.com](https://www.computerworld.com/article/4181295/asana-launches-ai-chief-of-staff-to-keep-projects-on-track.html)

### Autonomous build (dispatch targets, not competitors)

- **Devin (Cognition)** — $20/mo + $2.25/ACU. **$492M ARR (from $37M in 12 months), $26B valuation (May 2026).** [techcrunch.com](https://techcrunch.com/2026/05/27/ai-coding-startup-cognition-raises-1b-at-25b-pre-money-valuation/)
- **Factory** — enterprise Droids; $1.5B valuation (Apr 2026). [factory.ai](https://factory.ai/news/series-c)
- **Cursor** — background/cloud agents; **$2B ARR (Feb 2026), 1M+ paying users**. [eesel.ai](https://www.eesel.ai/blog/cursor-pricing)
- **GitHub Copilot** — Coding Agent GA (Sep 2025): issue → PR. [github.com/features/copilot/plans](https://github.com/features/copilot/plans)
- **Claude Code adoption signal** — at Epic over half of usage is non-developers; Anthropic run-rate ~$2.5B+. BUILD is ambient and cheap for PMs. [venturebeat.com](https://venturebeat.com/infrastructure/claude-code-turned-every-engineer-into-three-now-companies-need-more-product-thinkers)
- **Lovable / Bolt / Replit** — $400M+/$40M/$525M ARR respectively. [forbes.com](https://www.forbes.com/sites/rashishrivastava/2026/06/05/ai-coding-startup-lovable-in-talks-to-raise-funding-at-a-12-billion-valuation/)

### Recent AI-PM startups

- **Lightsprint (YC S26)** — non-engineers ship via visual plan + parallel cloud agents + PR preview; $500K. Build-collaboration layer; no signal ingestion / ranked bets / outcome learning. [ycombinator.com](https://www.ycombinator.com/companies/lightsprint)
- **Voker (YC)** — "Outcome Correlation Engine" for a product's embedded AI agents (not PM decisions); $2.2M pre-seed. [voker.ai](https://voker.ai/)
- **YC W26 signal** — 56 companies build fully autonomous multi-step agents; none found doing decision→outcome→learned-ranking for product management. [techcrunch.com](https://techcrunch.com/2026/03/26/16-of-the-most-interesting-startups-from-yc-w26-demo-day/)

### The white space (confirmed empty, both axes)

1. **Decisions → outcomes → learned ranking:** every prioritization tool found runs a static formula scored once. Nobody reinforces ranking from recorded decision outcomes.
2. **PM decision → autonomous build under one outcome record:** build is autonomous and cheap everywhere, but a human or pre-written issue still supplies "what to build"; nobody sits above both a multi-source signal Brain and a dispatched build layer. Supaprod sits there alone.

### Ranked threats

1. **Linear (12–18mo)** — free agent + Coding Sessions inside the workspace of record.
2. **Airtable (12–24mo)** — HyperAgent runtime + ProductCentral + ~$500M revenue.
3. **Atlassian (18–24mo)** — buying Discover piecemeal; Rovo distribution.

### The surprising macro finding

Build is commoditizing faster than 2025 models expected (Devin $37M→$492M in 12 months; Cursor doubling to $2B in three) while **the PM:engineer ratio inverts toward ~1:20** — the strongest argument FOR a decision layer: as building gets cheaper, deciding what's worth building becomes the scarce resource, and every funded competitor still solves it with a static formula. [venturebeat.com](https://venturebeat.com/infrastructure/claude-code-turned-every-engineer-into-three-now-companies-need-more-product-thinkers)

---

## Brief 2 — Frontier-agent UX patterns (what people love, 2026-07-10)

**Anthropic:** Claude Fable 5 / Mythos 5 (Jun 9 2026). Claude Code is the agentic-UX benchmark (r/ClaudeCode 4,200+ weekly contributors). `/goal` runs until a verification pass confirms the condition (not a step count); `/loop` + cloud Routines fire on schedule without a laptop; **Claude Tag** (Slack @-mentions, GA Aug 3) — 65% of Anthropic's own product-team code originates from internal Claude Tag; five permission modes + a documented earned-autonomy ramp; `/rewind` checkpoints; live shareable Artifacts; Agent SDK + MCP (10,000+ public servers). [anthropic.com/news/introducing-claude-tag](https://www.anthropic.com/news/introducing-claude-tag) · [code.claude.com/docs/en/checkpointing](https://code.claude.com/docs/en/checkpointing)

**OpenAI:** GPT-5.6 GA (Jul 9 2026); agent mode (Operator+Deep Research merged); Tasks (schedules); **Pulse** (proactive 5–10 item morning brief); ChatGPT Work "Company knowledge" respecting permissions; AgentKit HITL approvals + guardrails + connector registry. [openai.com/index/introducing-chatgpt-agent](https://openai.com/index/introducing-chatgpt-agent/) · [techcrunch.com (Pulse)](https://techcrunch.com/2025/09/25/openai-launches-chatgpt-pulse-to-proactively-write-you-morning-briefs/)

**Google:** Jules (submit 10 tasks, return to 10 PRs); Antigravity (agent-first IDE, multi-model); **NotebookLM the most-loved** — source-grounded honesty ("tells you when it can't find something") + Audio Overviews; 45% open it daily; grounded honesty + a delightful output format beats raw IQ for retention. [digitalapplied.com (Jules)](https://www.digitalapplied.com/blog/google-jules-gemini-async-coding-agent-guide)

**Others:** Kimi K2.6 (300-subagent swarms, 4,000 steps) + OK Computer; Groq speed-as-product (sub-100ms TTFT); Grok Build (8 parallel subagents); Meta agent-as-messaging-thread. **Hermes = Nous Research's open-source self-improving agent** — after finishing a task it **writes itself a reusable skill**; 140K+ GitHub stars, 224B daily tokens on OpenRouter; overtook OpenClaw as most-used open agent. [hermes-agent.org](https://hermes-agent.org/about/) · Manus (defined-goal autonomy), Genspark ($250M ARR in 12 months), Devin (confidence-scored PRs: green ≈ 2x merge rate), Lindy/Gumloop (credit-metered), 11x (flat-fee digital workers ~$5k/mo), Sierra (pure outcome pricing, ~$1–2.50/resolution, $150K+ contracts). [sierra.ai](https://sierra.ai/blog/outcome-based-pricing-for-ai-agents)

**The 10 patterns a product-lifecycle agentic OS must have natively:** goal-until-verified loops · scheduled agents without a laptop · @-mention delegation where work happens · graduated earned autonomy · confidence-gated execution · one-key rewind independent of VCS · live shareable artifacts as the trust primitive · outcome pricing for crisp deliverables · proactive narrated digest over passive inbox · parallel fan-out to a single review point. (Supaprod status per pattern: v13 §4.)

---

## Brief 3 — Market sizing + macro (2026-07-10)

**TAM:** PM software $3.8–10.1B (2026, midpoint ~$8B, 10–14% CAGR) [Business Research Insights, MarkWide] + enterprise AI coding/dev-agents ~$9.8–11B annualized [Gartner] ≈ **$18B combined 2026 baseline → ~$40–50B by 2030**; Gartner agentic-AI ceiling ~$450B by 2035. [gartner.com](https://www.gartner.com/en/articles/enterprise-ai-coding-agent-market) · [grandviewresearch.com](https://www.grandviewresearch.com/industry-analysis/ai-agents-market-report)

**SAM:** 1.0–2.5M core PMs [CPO Club 2026; Corpwaters 2023] + 5–8M product-adjacent operators (from the 28–47M developer population, 15–20% near spec/roadmap ownership); blended $1,200–3,500/yr core, $600–1,800 adjacent (anchored to Devin/Cursor spend bands) → **≈$11B central case ($6–20B band)**.

**SOM (5–7yr):** 0.5–1.5% of SAM = **$55–165M ARR**; bottoms-up 5,000–15,000 teams × $10–20K ACV = $50–300M (converging band). Expansion vectors: agent usage displacing **headcount budget**, and spanning spec→PR pulls in the $10B+ coding-agent line.

**Role shift:** open PM roles +75% from the 2023 low but PMs were laid off at 2x engineer rates 2022–24 [Lenny's]; Andrew Ng: the old 1:8 PM:eng ratio "collapsing"; **Cagan:** "product owner is a role in the delivery process… a very easy thing for an assistant to make a big dent into" [SVPG/airfocus]; Reforge: 59% of PMs rank strategy as the top next-3-year skill; the **product engineer** called "the most consequential shift in product work since the PM role was invented" [CIO].

**Pricing buyers accept:** hybrid floors + usage win (Bessemer); per-outcome works only when the outcome is unambiguous (Intercom Fin $0.99/resolution; Sierra negotiated; Devin $2.00–2.25/ACU; Cursor/Claude tiered credits); procurement resists pure consumption. [bvp.com](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook) · [fin.ai/pricing](https://fin.ai/pricing)

**Distribution:** Linear's manifesto-led PLG (3 years pre-first-marketer); Notion's template-marketplace SEO flywheel; PLG now ~58% of B2B SaaS GTM; community-led growth the third pillar; the Lenny ecosystem (~19K paid subs, 30K-member Slack) is the ownable PM audience surface; micro-creators deliver ~40% better cost-per-engagement.

**Surviving the frontier-lab scenario (precedents):** Jasper died to ChatGPT (thin wrapper); **Cursor thrived beside Copilot ($4B ARR by May 2026); Perplexity sustains a niche beside Google**. Survival properties [Menlo, Stanford Law]: workflow depth (10+ step multi-source) · compounding proprietary data ("decision quality that compounds" — Abridge's 1.5M encounters, EvenUp's corpus) · the clone test (could a lab rebuild you and win, absent your accumulated history?) · trust/compliance friction · headcount-budget targeting · application-layer speed. Applied to Supaprod: the moat is accumulated mission/decision/outcome history tied to one team's product — the same compounding-data logic, aimed at PM decision quality.

---

## Brief 4 — Airtable HyperAgent + the $20k credit (2026-07-10)

**What it is:** Airtable AI (2023) → agent-first relaunch around **Omni** + Field Agents (Jun 2025) → **Superagent** (Jan 27 2026) folded into **HyperAgent** (public Apr 2026, own domain/brand/infra). Each agent gets a persistent 24/7 cloud VM with real browser (Browserbase/Stagehand) + code execution, image/video/audio gen, cross-session memory, reusable Skills, LLM-judge Rubrics, Live Mode steering, parallel fleets; frontier models incl. Opus 4.8. **Seven trigger types:** chat, Slack @-mention, Telegram, email, **webhook**, schedule, autonomous change-watching. General-purpose platform, not just Airtable-data agents. [hyperagent.com/docs](https://www.hyperagent.com/docs) · [browserbase.com case study](https://www.browserbase.com/blog/case-study-hyperagent) · Caution: an unrelated OSS "HyperAgent" (Hyperbrowser SDK) pollutes search results.

**Credit mechanics:** classic Airtable AI credits are cheap/metered ($20/mo = 10,000); HyperAgent tasks bill in dollars — documented runs $6.41 (8-min research), $14.20 (25-min package), ~$35 (full startup workflow). **The $20k is the Founding 500 grant** ($10M program, closed 2026-05-31); one unverified source claims a $200 payment unlocks it; **no public expiry terms — verify on the account and treat as time-bound**. Napkin: $20k ≈ 600–3,000 full agent runs. [sidsaladi.substack.com (Hyperagent 101)](https://sidsaladi.substack.com/p/hyperagent-101-the-complete-guide) · [startupfortune.com](https://startupfortune.com/howie-liu-is-turning-hyperagent-credits-into-a-seed-stage-weapon/)

**Extensibility:** headless trigger via webhook/schedule (Supaprod's backend could kick runs); first-party integrations (Slack, Gmail, GitHub, Notion, Dropbox, Outlook, Databricks, Snowflake) + BYO MCP server + custom Skills with stored keys; result retrieval via write-back integrations (no documented REST pull). Airtable's own Web API + official MCP server exist separately (webhooks on the Web API; MCP poll-only). [support.airtable.com MCP docs](https://support.airtable.com/docs/using-the-airtable-mcp-server)

**Sentiment:** 4.8/5 detailed review (credit transparency, obstacle-handling, compounding Skills); complaints: research tasks get expensive, some runs unstoppable mid-execution, verbose output, no mobile, real integration setup effort. [aitoolssme.com](https://www.aitoolssme.com/review/hyperagent)

**Competitor or channel?** **Both, tilted competitor:** ProductCentral is a named PM hub marketed against "fragmented, narrow" point solutions (citing PMs spending "66% of time on admin") — a direct hit on Supaprod's category. Airtable remains a legitimate BYO data source under the connect doctrine. [airtable.com/solutions/product](https://www.airtable.com/solutions/product)

**The ruling (v13 §9):** spend as **disposable GTM/research compute at arm's length** — (1) GTM ops engine first (prospect/community research, launch monitoring, outreach cadence; ~$50–100/wk), (2) review-mining/research rig ($10–25/run), (3) raise/ops pipeline; **never** core orchestration, product data residency, or a maintained two-way integration; the Airtable-marketplace template idea is deprioritized (fragile distribution inside a rival's marketplace).
