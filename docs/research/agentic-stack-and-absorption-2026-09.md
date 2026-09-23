# The agentic stack in 2026: what the labs absorb, and what is left

> _Created: 2026-09-23 · Last updated: 2026-09-23_

**Part of the 2026-09-23 strategy reset** ([`../strategy/strategy-reset-2026-09.md`](../strategy/strategy-reset-2026-09.md)).
This is the **verbatim** final report of a research subagent, extracted from its session transcript
by script so no wording was changed; only the original H1 was demoted to H2 under this header. It
was briefed to map the 2026 agentic stack layer by layer, work out which startup categories the
frontier labs flattened and which survived and why, test Supaprod's current thesis adversarially,
rank what agent builders actually pay to fix, read the 2026 investor theses and YC batches, and
settle B2B versus B2C.

**How to use it.** Labels are the agent's own: **[FACT]** is sourced and dated, **[INF]** is its
inference, **[SPEC]** is speculation; table cells are [FACT] unless tagged. The synthesising session
did not re-verify each row. It independently confirmed the YC Fall 2026 RFS list
([YC](https://www.ycombinator.com/rfs)) and the W26 batch composition
([Extruct](https://www.extruct.ai/research/ycw26/)). **Before quoting any number outward, open its
link.** The companion report on regulated financial services is
[`./regulated-fs-agent-governance-2026-09.md`](./regulated-fs-agent-governance-2026-09.md).

---

## Adversarial market research: agentic stack, what labs absorb, and pivot options (as of 2026-09-23)

Labels: **[FACT]** means sourced and dated. **[INF]** is my inference. **[SPEC]** is speculation. In the table, cells are [FACT] unless tagged, and the source is linked in the cell.

## A. The 2026 agentic stack

**Changes to the layering you proposed [INF]:**
- Put sandboxes next to the runtime, since they are the runtime's execution environment.
- Split "payments" in two: billing *for* agent companies, and payments made *by* agents.
- Split "compliance" in two: a vendor-run **control plane** (policy, cost, human approval) and **independent assurance** (validation, certification, insurance).
- Add **implementation services** as a layer, because the labs entered it in 2026.

| Layer | Independent players and 2025-26 deals | What labs and hyperscalers shipped | Status [INF] |
|---|---|---|---|
| Runtime / harness | LangChain $125M at $1.25B, Oct 2025, about $16M ARR ([Sacra](https://sacra.com/c/langchain/)) | OpenAI AgentKit, 2025-10-06 ([OpenAI](https://openai.com/index/introducing-agentkit/)); Claude Agent SDK, 2025-09-29; Claude Managed Agents, 2026-04-08, $0.08 per active session-hour ([Anthropic](https://claude.com/blog/claude-managed-agents)); AgentCore GA, Oct 2025 ([AWS](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available)); OpenAI Frontier, 2026-02-05 ([Axios](https://axios.com/2026/02/05/openai-platform-ai-agents)) | Absorbed |
| Execution (sandboxes, browsers) | Modal $355M at $4.65B, May 2026; Daytona $24M, Feb 2026 ([bex](https://bex.co/blog/2026/09/11/ai-sandbox-funding-modal-daytona-e2b)); Browserbase $40M at $300M | Managed Agents sandbox; AgentCore Code Interpreter and Browser; Codex background computer use, Apr 2026 | Contested; survivors win on scale |
| Connectivity | Arcade $60M Series A; Composio had a credential breach in May 2026 ([DevDigest](https://www.developersdigest.tech/blog/ai-agent-auth-platforms-comparison-2026)); Workato Enterprise MCP | MCP and AGENTS.md donated to the Linux Foundation's Agentic AI Foundation, 2025-12-09 ([LF](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)); MCP Registry preview, 2025-09-08; A2A (Google's agent-to-agent protocol) moved to the same foundation ([Axios](https://www.axios.com/2026/08/17/a2a-agentic-ai-foundation-open-ai-standards)); AgentKit Connector Registry; AgentCore Gateway | Protocols are commodity; long-tail legacy connectors are not |
| Memory / context | Mem0 $24M, Oct 2025; Zep; Letta | AgentCore Memory; Managed Agents "dreaming" memory, May 2026 ([9to5Mac](https://9to5mac.com/2026/05/07/anthropic-updates-claude-managed-agents-with-three-new-features/)) | Mostly absorbed |
| Identity / authorization | Palo Alto–CyberArk about $24B; CrowdStrike–SGNL $740M; ServiceNow–Veza about $1B; Cisco–Astrix about $400M ([IDSync](https://idsync.com/reports/state-of-ai-agent-identity-2026)); Twilio–Stytch closed 2025-11-14 ([Twilio](https://www.twilio.com/en-us/blog/company/news/twilio-to-acquire-stytch)) | Entra Agent ID GA, Apr 2026; Agent 365 GA 2026-05-01 at $15/user ([Cloudpartner](https://learn.cloudpartner.fi/posts/agent365-ga-governance-licensing)); Okta Agent SSO GA 2026-08-24, and Okta's Cross App Access adopted as an MCP extension ([Okta](https://www.okta.com/newsroom/press-releases/okta-brings-first-class-identity-to-ai-agents-with-agent-sso/)) | Owned by security incumbents |
| Control plane (policy, cost, human approval) | LiteLLM about $6M ARR on a $1.6M seed; HumanLayer $660K revenue in 2025, then moved into coding tools ([Latka](https://getlatka.com/companies/humanlayer.dev)) | AgentCore Policy GA 2026-03-03; Claude Enterprise spend limits 2026-07-02 ([Anthropic](https://claude.com/blog/giving-admins-more-visibility-and-control-over-claude-usage-and-spend)); ChatGPT Enterprise spend caps, Jun 2026 ([OpenAI](https://openai.com/index/chatgpt-enterprise-spend-controls/)); ServiceNow AI Control Tower now governs third-party agents ([ServiceNow](https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-expands-AI-agent-governance-through-deeper-integration-with-Microsoft/default.aspx)) | Absorbed within each vendor; cross-vendor contested by ServiceNow and Microsoft |
| Evals / observability | Braintrust $80M at $800M, 2026-02-17 ([SiliconANGLE](https://siliconangle.com/2026/02/17/braintrust-lands-80m-series-b-funding-round-become-observability-layer-ai/)); Patronus $50M, 2026-06-25, revenue up 15x ([TechCrunch](https://techcrunch.com/2026/06/25/patronus-ai-lands-50m-to-build-digital-worlds-that-stress-test-ai-agents/)). Exits: Langfuse to ClickHouse, 2026-01-16; Promptfoo to OpenAI, 2026-03-09; Galileo to Cisco, May 2026; Helicone to Mintlify ([ai-evals](https://ai-evals.tools/editorial/llm-evals-observability-company-acquisitions)) | OpenAI trace grading and datasets; AgentCore Evaluations GA Mar 2026 | Consolidating fast |
| Billing for agent companies | Metronome to Stripe, about $1B, closed 2026-01-14 ([Stripe](https://stripe.com/newsroom/news/stripe-completes-metronome-acquisition)); Orb to Adyen, $335M, closed 2026-07-01 ([Adyen](https://www.adyen.com/knowledge-hub/talon-one-orb-acquisitions)); Paid $33M raised ([Lightspeed](https://lsvp.com/stories/the-ai-agent-economy-has-a-19-trillion-problem-our-investment-in-paid/)) | n/a | Taken by payments giants |
| Payments by agents | Natural $30M, Jul 2026 ([TechCrunch](https://techcrunch.com/2026/07/20/natural-raises-30m-to-reinvent-payments-for-ai-agents-and-take-on-stripe/)); Skyfire; Nekuda | Visa Intelligent Commerce; Mastercard Agent Pay; Stripe shared payment tokens; Google AP2 and UCP (UCP launched 2026-01-11) ([Google](https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/)) | Card networks own the rails; demand is weak (section D) |
| Independent assurance | AIUC $40M Series A, Sep 2026, backed by Lloyd's; KPMG was the first Big Four firm certified to its standard ([SiliconANGLE](https://siliconangle.com/2026/09/15/ai-agent-certification-startup-aiuc-raises-40m-to-begin-auditing-frontier-models/)); Armilla, $25M Lloyd's-backed limits; ValidMind $8.1M seed; Norm Ai $120M at $1.2B, 2026-07-07 ([fintech.global](https://fintech.global/2026/07/08/norm-ai-raises-120m-to-expand-ai-native-legal-platform/)) | Claude Compliance API 2026-05-21, extended to agent sessions Aug 2026 ([Datadog docs](https://docs.datadoghq.com/integrations/anthropic-compliance-logs/)); Frontier audit logs. Both are first-party logs only | Labs supply logs, not independence |
| Implementation services | Forward-deployed engineer job postings up more than 1,000% year on year (Lightcast data, [Fortune](https://fortune.com/2026/09/03/forward-deployed-engineers-fast-growing-six-figure-silicon-valley-job-integrate-ai-with-customers-tech-careers-palantir/), 2026-09-03) | Ode with Anthropic, a $1.5B joint venture; OpenAI's Deployment Company, about $14B, which bought Tomoro (May 2026, [TechCrunch](https://techcrunch.com/2026/05/04/anthropic-and-openai-are-both-launching-joint-ventures-for-enterprise-ai-services/)) | Labs entered directly |
| Apps / verticals | Sierra $200M ARR at $15.8B; Decagon $100M ARR ([Sacra](https://sacra.com/c/sierra/)); Fin (formerly Intercom) to Salesforce for $3.6B, signed 2026-06-15 ([Salesforce](https://www.salesforce.com/news/press-releases/2026/06/15/salesforce-signs-definitive-agreement-to-acquire-fin/)); Harvey at $11B ([CNBC](https://www.cnbc.com/2026/03/25/legal-ai-startup-harvey-raises-200-million-at-11-billion-valuation.html)) | Cowork legal plugin, 2026-02-03; ten finance agents including a **KYC screener**, 2026-05-05 ([Anthropic](https://www.anthropic.com/news/finance-agents)); ChatGPT Health, 2026-01-07; ChatGPT for Financial Services, 2026-09-10 | Category leaders grow; number twos get squeezed |

**[INF]** In 2025-26 the labs moved into every layer *around their own agents*: runtime, memory, sandboxes, evals, spend limits, logs, identity hooks, and now services and vertical templates.

## B. What got absorbed, what survived, and why

**Flattened or absorbed:**
- **[FACT]** Jasper revenue reportedly fell from about $120M (2023) to $55M (2024) ([Contrary](https://research.contrary.com/company/jasper)).
- **[FACT]** Humanloop (prompts and evals) was sunset on 2025-09-08 after its team joined Anthropic ([HN](https://news.ycombinator.com/item?id=44592216)).
- **[FACT]** Pinecone changed CEO and weighed a sale; vector search is now a "checkbox feature" ([VentureBeat](https://venturebeat.com/ai/from-shiny-object-to-sober-reality-the-vector-database-story-two-years-later), 2025).
- **[FACT]** Relay (automation) shut down in Aug 2026; its founder joined Google Chrome ([TechCrunch](https://techcrunch.com/2026/08/17/ai-automation-startup-relay-shuts-down-staff-joins-googles-chrome-team/)).
- **[FACT]** Midjourney fell to #46 on a16z's consumer list after ChatGPT and Gemini added native image generation ([a16z](https://a16z.com/100-gen-ai-apps-6/), 2026-03-09).
- **[FACT]** Huxe shut down one day after Spotify launched a similar feature (May 2026) ([VentureCurator](https://www.venturecurator.com/p/ai-startups-model-release-risk)).
- **[FACT]** Graphite (code review) went to Cursor (2025-12-19), and Cursor then went to SpaceX/xAI for $60B, closed 2026-08-14 ([TechCrunch](https://techcrunch.com/2026/06/16/spacex-to-acquire-cursor-for-60b-in-stock-days-after-blockbuster-ipo/)).
- **[FACT]** Incumbents were hit too: Thomson Reuters fell about 16-18% and LegalZoom about 19.7% after the Cowork legal plugin launched on 2026-02-03 ([Artificial Lawyer](https://www.artificiallawyer.com/2026/02/04/claude-crash-impact-on-thomson-reuters-lexisnexis-is-irrational/)).

**Grew despite lab launches:**
- **[FACT]** CodeRabbit went from $25M ARR (end 2025) to $50M (Jul 2026), with 17,000 customers and 2M reviews a week, even as Copilot, Claude and Codex all shipped code review ([BusinessWire](https://www.businesswire.com/news/home/20260812311754/en/), 2026-08-12).
- **[FACT]** Glean reached $300M ARR in May 2026 despite ChatGPT connectors and Microsoft Copilot ([Sacra](https://sacra.com/c/glean/)).
- **[FACT]** Harvey raised at $11B two months after the legal plugin.
- **[FACT]** Granola raised a $125M Series C at $1.5B in Mar 2026 despite ChatGPT's record mode.
- **[FACT]** Cursor reached $2B ARR by Feb 2026 despite Claude Code.
- **[FACT]** Tome had 20M users but under $4M ARR and closed its presentation product, while Gamma passed $100M ARR ([BusinessWire](https://www.businesswire.com/news/home/20251110805751/en/)). The category leader won, not the lab.

**Why the survivors survived:**
- **[FACT]** Neutrality matters because 81% of Global 2000 firms use three or more model families ([a16z](https://a16z.com/leaders-gainers-and-unexpected-winners-in-the-enterprise-ai-arms-race/), 2026-01-30).
- **[FACT]** A 14-release study found that "the release removes the reason to buy from whoever isn't the default"; non-leaders get about 90 days ([VentureCurator](https://www.venturecurator.com/p/ai-startups-model-release-risk)).
- **[FACT]** Glean's moat is a permissions-aware graph across every SaaS tool.
- **[FACT]** Harvey, Abridge and Sierra own regulated workflows that come with liability.

**Rule [INF]:** Labs absorb anything that raises token use *on their own platform*: single-model features, tooling for building and running their own agents, and now implementation services. They do not absorb:
1. Things that need **independence from the model vendor**, such as validation, certification, audit and insurance. A vendor cannot provide "effective challenge" of itself.
2. **Accountability for outcomes** in licensed or regulated work.
3. **Neutral cross-vendor layers**, but only for the category leader.

Speed matters as much as category: a non-default product has a window of about one quarter.

## C. The current thesis, tested

**(i) Verifying agent-written code: saturated.**
- **[FACT]** CodeRabbit: $1.5B valuation, $50M ARR, $24/$48/$72 per developer per month ([pricing](https://www.coderabbit.ai/pricing)). Its new pitch is "Agentic Change Management", which is already the governance story.
- **[FACT]** Greptile: $180M valuation (Sep 2025), $30 per developer per month, 2,000+ customers.
- **[FACT]** Qodo: $70M Series B, 2026-03-30 ([TechCrunch](https://techcrunch.com/2026/03/30/qodo-bets-on-code-verification-as-ai-coding-scales-raises-70m/)).
- **[FACT]** Claude Code Review launched 2026-03-09, token-based, about $15-25 per review ([Anthropic](https://claude.com/blog/code-review)).
- **[FACT]** Codex runs automatic PR reviews and flags only P0/P1 issues ([OpenAI](https://developers.openai.com/codex/integrations/github)).
- **[FACT]** From 2026-06-01, Copilot code review consumes AI credits plus GitHub Actions minutes ([GitHub](https://github.blog/changelog/2026-04-27-github-copilot-code-review-will-start-consuming-github-actions-minutes-on-june-1-2026/)).
- **[FACT]** Cursor's Bugbot dropped its $40 seat fee for usage pricing of about $1-1.50 per run ([Cursor](https://cursor.com/blog/may-2026-bugbot-changes)).
- **[INF]** Price is converging toward a few dollars per run, and the owners of the PR surface (GitHub, Anthropic, OpenAI, xAI) bundle review. There is no wedge here for a solo, pre-traction founder.

**(ii) AI tools for PMs: bundled or free.**
- **[FACT]** Linear Agent is included on every plan. Linear's launch post says "the bottleneck... shifts toward judgment: deciding exactly what to build" ([Linear](https://linear.app/changelog/2026-03-24-introducing-linear-agent), 2026-03-24). That is his thesis, shipped by the system of record.
- **[FACT]** Productboard Spark costs $15 per maker per month ([pricing](https://www.productboard.com/pricing/spark/)).
- **[FACT]** Atlassian's Rovo is bundled into paid plans.
- **[FACT]** Anthropic open-sourced a free product-management plugin covering specs, roadmaps and metrics ([GitHub](https://github.com/anthropics/knowledge-work-plugins/tree/main/product-management)).
- **[FACT]** Amplitude's agents recommend actions from usage data (2026-02-17).
- **[FACT]** ChatPRD is solo-founded and bootstrapped, with a reported 100k+ users ([SoloFounders](https://solofounders.com/blog/100k-users-nine-ai-employees-claire-vo-chatprd/)).

**(iii) Tracking decisions and grading outcomes: no standalone market.**
- **[FACT]** Cloverpop's last found raise is a Series A in Dec 2022 ([Newswire](https://www.newswire.com/news/cloverpop-decision-intelligence-platform-raises-series-a-financing-to-21901676)).
- **[FACT]** The *paid* form of "grade the outcome against the hypothesis" is experimentation, and it was absorbed: Eppo went to Datadog for about $220M (May 2025); Statsig went to OpenAI for $1.1B, then its brand and customers went to Amplitude on 2026-05-05 ([MarTech](https://martech.org/amplitude-and-statsig-deal-raises-questions-for-customers/)).
- **[FACT]** DX, which measures the impact of AI on engineering, went to Atlassian for $1B ([Constellation](https://www.constellationr.com/insights/news/atlassian-buys-dx-1-billion)).
- **[INF]** Buyers pay for outcome measurement only when it is attached to the system that produces the data.

**Verdict [INF]:** The only live wedge is "AI value realization": grading AI or agent spend against a benefit committed *before* go-live, sold to CFOs, finance-ops and AI centres of excellence. That is opportunity #4, and it is thin.

## D. What agent builders actually struggle with, ranked by evidence

1. **Reliability and quality: strong pain, crowded supply.**
   - **[FACT]** Quality is the #1 barrier for 32% of 1,340 respondents surveyed Nov-Dec 2025 ([LangChain](https://www.langchain.com/state-of-agent-engineering)).
   - **[FACT]** An ICML 2026 study found 74% of production agents depend mainly on human evaluation, and 68% run at most 10 steps before a human steps in ([arXiv](https://arxiv.org/abs/2512.04123)).
   - **[FACT]** Gartner predicts more than 40% of agentic projects will be cancelled by 2027 over cost, unclear value and weak risk controls, and counts only about 130 "real" agentic vendors ([Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027), 2025-06-25).
2. **Cost and value: strong pain.**
   - **[FACT]** Uber used up its 2026 AI budget by April and capped AI coding tools at $1,500 per month per tool ([TechCrunch](https://techcrunch.com/2026/06/02/uber-caps-employee-ai-spending-after-blowing-through-budget-in-four-months/)). Its COO said the link to customer value "is not there yet" ([Fortune](https://fortune.com/2026/05/26/uber-coo-ai-spending-tokens-claude-code/)).
   - **[FACT]** 98% of FinOps teams now manage AI spend (n=1,192), and it is their #1 priority ([FinOps Foundation](https://data.finops.org/)).
   - Counter-evidence: the labs shipped per-vendor spend limits in Jun-Jul 2026.
3. **Integration with legacy systems and enterprise context: strong pain, services-shaped.** Evidence is the forward-deployed engineer hiring surge and the labs' own services joint ventures (section A).
4. **Security and governance in regulated firms: real, but the budget is small.**
   - **[FACT]** Security is the top concern for 24.9% of respondents at companies with 2,000+ employees (LangChain).
   - **[FACT]** Regulators have moved: FINRA's 2026 oversight report covers agent scope, audit trails and human-in-the-loop ([FINRA](https://www.finra.org/sites/default/files/2025-12/2026-annual-regulatory-oversight-report.pdf)); US bank regulators replaced model-risk guidance SR 11-7 with SR 26-2 on 2026-04-17 ([Fed](https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm)); Treasury's financial-services AI risk framework has 230 control objectives (Feb 2026, [Lowenstein](https://www.lowenstein.com/news-insights/publications/client-alerts/financial-services-ai-risk-management-framework-operationalizing-the-230-control-objectives-before-the-market-wakes-up-data-privacy)); Singapore's regulator (MAS) published SAFR, a voluntary runtime checkpoint of identity, rulebook, allow/observe/escalate/deny decision and tamper-evident log, on 2026-07-03 ([Ashurst](https://www.ashurstperkinscoie.com/en/insights/mas-safr-explained-singapores-runtime-governance-standard-for-agentic-ai-in-finance/)).
   - Against: Gartner sizes AI governance *platforms* at only $492M in 2026 ([Gartner](https://www.gartner.com/en/newsroom/press-releases/2026-02-17-gartner-global-ai-regulations-fuel-billion-dollar-market-for-ai-governance-platforms)); the EU AI Act's high-risk obligations moved to 2027-12-02 ([Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)); Colorado's AI Act slipped to 2027-01-01.
5. **Liability and insurance: an emerging gap.** **[FACT]** Verisk/ISO endorsements let carriers such as AIG, Chubb and Berkley exclude generative AI from general liability policies from 2026-01-01 ([Armilla](https://www.armilla.ai/resources/armilla-ai-raises-lloyds-backed-coverage-to-25m-as-traditional-insurers-retreat-from-ai-risk)). Underwriting needs capital and licences.
6. **Identity** (consolidated), **durable execution** ("fails at step 9 of 12", [HN](https://news.ycombinator.com/item?id=48342441)) and **billing** (consolidated) are real problems with little room left.
7. **Agent payments: weak demand.** **[FACT]** OpenAI retired ChatGPT Instant Checkout in Mar 2026 ([CNBC](https://www.cnbc.com/2026/03/24/openai-revamps-shopping-experience-in-chatgpt-after-instant-checkout.html)). **[FACT]** Volume on x402, the open agent-payment rail, fell from $800K to about $40K a day, and some experts call it partly synthetic ([American Banker](https://www.americanbanker.com/payments/news/agentic-payment-rail-shows-volume-decline)).
8. **Human approval as a standalone product: weak.** HumanLayer pivoted.

## E. Investor theses and what they mean for his application

- **YC Summer 2026 RFS:** Software for Agents; AI-Native Service Companies (insurance brokerage, accounting/tax/audit, **compliance**, healthcare admin); SaaS Challengers; **Startups That Want to Sell to Huge Companies**; Company Brain ([VC Corner](https://www.thevccorner.com/p/yc-summer-2026-requests-for-startups-ideas)). **[FACT]**
- **YC Fall 2026 RFS:** includes **AI-Native Compliance Infrastructure**, Multiplayer AI, Self-Maintaining APIs, and AI consumer products for 1B people ([YC](https://www.ycombinator.com/rfs)). **[FACT]**
- **Sequoia:** "services are the new software"; for every $1 on software, enterprises spend $6 on services. Its named risks are inference margins and go-to-market ([Fortune](https://fortune.com/2026/04/21/services-are-the-new-software-sequoia-venture-capital-julien-bek-ai-native-eye-on-ai/)). **[FACT]**
- **Bessemer 2026 infrastructure roadmap:** harness (memory and evals), continual learning, RL environments, inference, world models ([BVP](https://www.bvp.com/atlas/ai-infrastructure-roadmap-five-frontiers-for-2026)). **[FACT]**
- **Menlo:** $37B enterprise generative-AI spend in 2025; startups took 63% of app-layer revenue ([Menlo](https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/)). **[FACT]**
- **a16z counterpoint:** 65% of enterprises prefer incumbents. **[FACT]**
- **What YC batches looked like:**
  - W26 (third-party analysis): 28% AI-native services, 17% developer infrastructure, 2% consumer, 22 solo founders (11%) ([Extruct](https://www.extruct.ai/research/ycw26/)). **[FACT]**
  - W26 also had three times as many companies at $1M annualized revenue as W25. **[FACT]**
  - F25: about 50% agent-related ([SylphAI](https://github.com/SylphAI-Inc/yc-agent-landscape)). **[FACT]**

**Implications [INF]:**
- A solo, pre-traction, horizontal "PM platform" that has repositioned five times sits in the categories labs *just entered* (PM plugin, Managed Agents, code review), and it matches no RFS item.
- His founder-market fit (AI platform for 200+ banks) lines up almost word for word with "AI-Native Compliance Infrastructure" and "sell to huge companies."
- Solo acceptances skew toward founders with visible traction.

## F. B2B or B2C

- **[FACT]** ChatGPT is 2.7x the size of Gemini on web (a16z, 2026-03).
- **[FACT]** AI apps earn 41% more per payer but churn 30% faster; annual retention is 21.1% versus 30.7% for non-AI apps ([TechCrunch](https://techcrunch.com/2026/03/10/ai-powered-apps-struggle-with-long-term-retention-new-report-shows)).
- **[FACT]** Consumer-agent winners exit to labs or big tech: Manus reached about $200M ARR and sold to Meta for about $2B.
- **[FACT]** On the B2B side: buy-over-build rose to 76%, and product-led growth is 27% of AI app spend (Menlo).
- **[INF]** A solo founder with no consumer distribution should not go B2C. His realistic path is B2B, sold either bottom-up to startups (weeks per deal) or through domain credibility into regulated firms (6-18 month cycles). Only the first can show traction before a raise.

## Top 5 opportunities the evidence supports

**1. Independent pre-deployment validation and runtime evidence for agents in banks**
- **Problem:** Model-risk teams have to give "effective challenge" to agents under SR 26-2, Treasury's framework, SAFR-style runtime controls, and India's RBI FREE-AI framework.
- **Buyer:** The bank's second line of defence (model risk management, CRO office).
- **Why labs won't absorb it [INF]:** A vendor cannot independently validate itself, and banks run several model families.
- **Competitors:** ValidMind, Credo AI, IBM watsonx.governance, ServiceNow AI Control Tower, Microsoft Agent 365, the Big Four, AIUC.
- **Evidence strength:** Medium. The regulatory pull is documented; the budget is small ($492M) and much of the rulebook is voluntary or delayed.
- **Biggest reason it fails:** 12-18 month bank sales cycles, and the Big Four or ServiceNow bundling it before he can raise.

**2. "Bank-ready" evidence packs for AI agent vendors selling into financial institutions**
- **Problem:** Agent startups stall in vendor due diligence (FS-ISAC questionnaires, Treasury's 230 control objectives, EU DORA).
- **Buyer:** Founders and sales leads at those vendors. They buy fast, which makes this the fastest to prove.
- **Why labs won't absorb it [INF]:** It needs to be third-party and cross-vendor.
- **Competitors:** Vanta and Drata (ISO 42001), AIUC-1, compliance-automation startups.
- **Evidence strength:** Medium-low. The inference is strong; I found no direct revenue comparables.
- **Biggest reason it fails:** Vanta adds a financial-services AI module.

**3. An AI-native service for one boring bank back-office process, priced per completed outcome**
- **Examples:** Third-party and AI vendor risk reviews for mid-size banks and credit unions; regulatory reporting prep.
- **Why labs won't absorb it [INF]:** The provider carries accountability and does human QA.
- **Evidence strength:** Medium. Sequoia and YC both push this model. **[FACT]** Bretton raised $75M; Norm Ai is valued at $1.2B.
- **Evidence against:** **[FACT]** Anthropic's KYC screener and month-end closer, and FIS building AML agents on Claude.
- **Biggest reason it fails:** Services margins, operational load on a solo founder, and a lab template shipping for the same task.

**4. A cross-vendor ledger of AI spend against promised value**
- **Problem:** Lock the expected benefit of each agent deployment before go-live, then grade spend against actual results. This reuses Supaprod's forecast-grading engine.
- **Buyer:** CFO, finance-ops, AI centre of excellence.
- **Why labs won't absorb it [INF]:** They have a conflict of interest and see only their own spend.
- **Competitors:** Larridin ($17M seed), Pendo Agent Analytics, DX (now Atlassian), Jellyfish, FinOps vendors.
- **Evidence strength:** Medium on the pain (Uber, FinOps survey); weak on whether a standalone product can hold.
- **Biggest reason it fails:** It becomes a feature of FinOps or analytics suites.

**5. Certification-grade simulation testing for regulated customer-facing agents (for example, bank contact centres)**
- **Why labs won't absorb it [INF]:** The testing has to be independent, and scenario libraries are domain-specific.
- **Competitors:** Patronus, Hamming, Coval, Cekura, Cyara, Braintrust, AgentCore Evaluations.
- **Evidence strength:** Strong on the pain, weak on whitespace.
- **Biggest reason it fails:** Eval-tool consolidation (eight acquisitions in 14 months).

**[SPEC]** Across #1-3, check his Intellect non-compete and IP terms first.

## Categories to avoid

- **Generic AI code review:** price collapse, and the platforms own the PR surface.
- **"Cursor for PMs" / AI PM tooling:** bundled by Linear, Atlassian and Productboard; free from Anthropic.
- **Standalone decision or forecast tracking:** no willingness to pay found; experimentation was absorbed.
- **Agent identity:** roughly $27B+ of consolidation by security incumbents.
- **Runtimes, frameworks, memory, sandboxes:** labs and hyperscalers ship them, or they need scale capital.
- **Billing and metering for agent companies:** Stripe and Adyen bought the leaders.
- **Agent payment rails and wallets:** networks own the rails and demand is weak.
- **Generic eval and observability platforms:** consolidating.
- **Human approval as a service:** pivot evidence.
- **Horizontal consumer agents:** exit to labs or big tech, poor retention.
- **Generic implementation / forward-deployed-engineer services:** labs' $1.5B and $14B joint ventures.
- **Thin vertical templates** for work labs already ship (NDA triage, KYC screening).

