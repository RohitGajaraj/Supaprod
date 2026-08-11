# Market validation, tested from outside Lenny's world

> _Created: 2026-08-11 - Lane 0. Commissioned because every prior finding came from ONE ecosystem
(Lenny's archive), which self-selects for people who enjoy building their own tools. This document tests the
same theses against funding, hiring, analyst and practitioner data from OUTSIDE that world._

**What is being tested.** Four theses drawn from a full read of Lenny Rachitsky's archive (679 documents, 5.9M words):

- **(a)** Deciding what to build is the bottleneck. Building has commoditised.
- **(b)** The real competitor is DIY. Teams reach for a folder of markdown files, not a product.
- **(c)** The wedge is the transition point. A folder works for one person and fails the moment a second person or a fleet of agents touches it.
- **(d)** Buyers want graduated autonomy with human gates, not 90 to 95 percent autonomy.

**How to read this file.** Every claim carries a source and a date. Every section separates **Fact** from **Inference**. Where lanes disagree the disagreement is shown and the better-sourced side is named. Where the evidence is one blog post it is labelled thin and is not treated as a trend.

**Method and its limits.** Four research lanes returned usable findings and are labelled A to D below: **A** the frontier labs, **B** the money, **C** hiring and job descriptions, **D** engineering practitioners. None of them used Lenny's corpus. All four are still English-language and US or EU heavy. We traded PM-adjacency for engineering, investor and employer adjacency. We did not buy geographic diversity. That limitation survives this document.

> **A fifth lane, E, died mid-run and is being re-run** (`gather:category-and-analysts`, killed 2026-08-11 by a dropped connection, not by a lack of evidence). It covers the one question the four surviving lanes do not touch: **whether this market has an analyst-recognised name at all**, what Gartner, Forrester, IDC and the ThoughtWorks Radar say about it, what became of Gartner's "decision intelligence" push, and whose existing budget line we come out of. **Until section 8 lands, this document cannot be cited on the category question**, and the sharpest form of that question, *"what happened the last time analysts tried to make decisions a category"*, is exactly the one an investor asks. Treat its absence as an open hole, not as a null result.

---

## 1. The verdict in one paragraph

Outside evidence **confirms the problem, confirms the default, and contradicts the business**. Thesis (a) is confirmed so emphatically from outside Lenny's world that it has stopped being an insight: Miro paid for Reforge on the stated reasoning that the bottleneck is direction not speed (2026-03-24), and Notion shipped a free template built on identical language (2026-07-09). Thesis (b) is confirmed hard by engineers who have never heard of Lenny: the reflex on r/ExperiencedDevs and Hacker News is commit a file, and the largest organisation found solving this at scale, Cloudflare, built the whole thing in-house rather than buying (2026-04-20). Thesis (c) is confirmed as a real and measurable failure, including a repository where two agent-context files have disagreed for eleven months without anyone noticing (verified 2026-08-11). Thesis (d) is confirmed as a **buyer** preference by hard survey numbers from outside the PM world (Stack Overflow 2025: 46 percent distrust AI accuracy, 3 percent highly trust it) and by employer job descriptions at Gap, Zendesk and Databricks, but it is contradicted as a **venture category**. The single most important finding is in section 2: fourteen months after Anthropic's CPO named the upstream product-decision layer as the next thing to fall, **neither lab has shipped it**, and both walked away from the productised measurement layer they already owned. The single most dangerous finding is in section 3: Notion shipped the agent-native product lifecycle as a free template five weeks ago. The moat claim, the forecast captured at decision time, is real whitespace with no funded competitor anywhere; but section 5 shows that engineering wrote down that exact practice more than a decade ago, called it an Architecture Decision Record with a confidence level, and never built tooling for it, which is as consistent with "nobody will pay" as with "unclaimed moat".

---

## 2. What the labs have actually shipped since Krieger's statement

_Lane A. Primary sources only: release-note archives, product pages, docs, job posts, repositories._

This is the defensibility section. If either lab had built the product-decision layer in the fourteen months since it publicly named the opportunity, the company would have a much harder story. Neither did.

### 2.1 The clock starts, 2025-06-05

**Fact.** Mike Krieger, Anthropic CPO, on Lenny's Podcast, transcript at 00:19:02 to 00:19:25: *"i started the year by writing a doc that was effectively like ... how do we do product today and where is Claude not showing up yet that it should and i think that upstream part is the next one to go ... at your conference i talked to somebody who was working on like a prd gpt kind of like chat prd ... can [Claude] be a partner in figuring out what to build what the market size is if you wanna approach it that way what the user needs are if you look at it a different way"*
Source: https://lennysvault.com/episodes/4d6cd513-b4b5-4e1a-83f1-8780cd9800ad and https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/mike-krieger/transcript.md. Date: 2025-06-05.

**Fact.** In the same episode he described the full closed loop and put a deadline on it: read the community signal, propose the fix, open the pull request, run the A/B test, check it a week later. *"feels very achievable this year"*. Same source, same date.

### 2.2 Eleven months later the same loop is still described in the future tense

**Fact.** Cat Wu, Anthropic Head of Product for Claude Code and Cowork: *"I think there is maybe this next level where Claude can anticipate what you want ... it should monitor GitHub issues and feedback in Slack and Twitter and whatever ... It's actually not that far away, but I think this is an imminent next step."* Source: Ars Technica, https://arstechnica.com/ai/2026/05/claude-codes-product-lead-talks-usage-limits-transparency-and-the-lean-harness/. Date: 2026-05-15. Repeated to TechCrunch two days earlier.

### 2.3 The null result, stated plainly

**Fact.** All 96 dated entries in the Claude Platform release notes from 2025-06-11 to 2026-08-07 were read. Every one is a model, a token or thinking or caching control, an agent harness primitive, or an enterprise auth or compliance control. **Zero entries mention PRDs, roadmaps, prioritisation, discovery, decisions or forecasts.** Source: https://platform.claude.com/docs/en/release-notes/overview. Date: 2026-08-07.

**Fact.** Across fourteen months of ChatGPT Enterprise and Edu release notes (2025-06-18 to 2026-08-07, 100,151 characters of fetched article text), a machine string count returns: PRD 0, roadmap 0, prioriti* 0, forecast 0, hypothes* 0, A/B 0, product manag* 0. "decision" appears once, describing the Codex app showing agent progress and decisions. Source: https://help.openai.com/en/articles/10128477-chatgpt-enterprise-edu-release-notes. Date: 2026-08-07.

**Fact.** No evidence was found, at either lab, of any of the four load-bearing components: a decision record shared across a team; a forecast captured before the outcome landed; an after-the-fact verdict labelling a decision as worked or did not; permissioning at the level of the decision record. Both full release-note archives, both product and business pages, and press coverage were searched. This is a genuine null, not an absence of looking.

### 2.4 Both labs exited the productised measurement layer they owned

**Fact.** OpenAI acquired Statsig, described in its own announcement as *"one of the most trusted experimentation platforms in the industry, powering A/B testing, feature flagging, and real-time decisioning"*, in an all-stock deal reported at roughly $1.1B. Source: https://openai.com/index/vijaye-raji-to-become-cto-of-applications-with-acquisition-of-statsig/. Date: 2025-09-02.

**Fact.** Eight months later Amplitude announced: *"Amplitude will take on Statsig's brand and customers ... We'll work closely with the Statsig team at OpenAI during the transition."* Source: https://amplitude.com/blog/amplitude-and-statsig-partnership. Date: 2026-05-05. Statsig's own blog confirms *"the original Statsig team, now at OpenAI"* on 2026-06-17 (https://www.statsig.com/blog/statsig-amplitude-phase-1).

**Fact.** OpenAI's own job posting says the system is internal: *"The Statsig team within OpenAI builds the experimentation, feature rollout, dynamic configuration, and analytics systems that help OpenAI ship products with speed, safety, and evidence ... bringing deep product expertise, customer intuition, and mature platform infrastructure into the product development system used by every OpenAI team."* Source: https://openai.com/careers/engineering-manager-core-experimentation-seattle/. Retrieved 2026-08-11.

**Fact.** OpenAI is retiring the only productised "did it work" surface it shipped for agents. Banner on the AgentKit launch post: *"Update on June 3, 2026: OpenAI is winding down the Agent Builder and Evals products. From November 30, 2026 onward, they will no longer be available on the OpenAI platform."* Source: https://openai.com/index/introducing-agentkit/. Date: 2026-06-03.

**Fact.** Anthropic ran the same inward-absorption play a month before OpenAI bought Statsig. It hired Humanloop's three co-founders and roughly a dozen engineers, and *"An Anthropic spokesperson confirmed that the AI firm did not acquire Humanloop's assets or its intellectual property."* Humanloop had already told customers in July 2025 it would shut down. Source: https://techcrunch.com/2025/08/13/anthropic-nabs-humanloop-team-as-competition-for-enterprise-ai-talent-heats-up/. Date: 2025-08-13.

**Inference, and it is ours not the companies'.** Both labs want the decision-and-measurement system for themselves and do not want to sell it. The only outside voice on record reading it the same way is an analyst, not either company: Liz Miller, quoted in martech.org 2026-05-08, *"it's clear OpenAI realized it has no interest in running an enterprise software business focused on testing."* Treat the strategic reading as inference. The dates and facts are primary.

### 2.5 The one direct counter-example collapses on inspection

**Fact.** Anthropic did ship a product-management plugin, on 2026-01-30, in the open-source `knowledge-work-plugins` repo: *"Product management: Write specs, prioritize roadmaps, and track progress"*, with connectors for Slack, Linear, Asana, Monday, ClickUp, Jira, Notion, Figma, Amplitude, Pendo, Intercom and Fireflies. Its contents are `.mcp.json`, `CONNECTORS.md`, `README.md`, a `commands/` folder and eight skill folders. The `metrics-review` skill compares current values against target only, with no instruction to store anything. Anthropic's own launch note: *"Plugins are currently saved locally to your machine."* Sources: https://github.com/anthropics/knowledge-work-plugins, https://claude.com/blog/cowork-plugins.

**Inference.** The lab's answer to the product-decision job is a stateless folder of markdown files with no persisted decision, no forecast and no verdict. That strengthens thesis (b) rather than weakening it: the DIY competitor is now shipped by Anthropic itself.

**Gap.** Anthropic publishes no plugin install counts. We cannot say whether this folder is used or ignored.

### 2.6 Both labs shipped the forecast primitive, and both stopped at the session

**Fact.** Anthropic `define_outcome`, public beta 2026-05-06: *"An outcome tells the session what the end result should look like and how to measure its quality ... the harness automatically provisions a grader to evaluate the artifact against a rubric."* One outcome at a time. `max_iterations` default 3, maximum 20. Results are `satisfied`, `needs_revision`, `max_iterations_reached`, `failed` or `interrupted`. State lives on an API session object. Source: https://platform.claude.com/docs/en/managed-agents/define-outcomes.

**Fact.** OpenAI Goal mode, 2026-05-21: *"Goal mode is generally available across the Codex app, IDE extension, and CLI, so users can define an outcome and success criteria and let Codex keep working toward it."* Source: the ChatGPT Enterprise release notes above.

**Inference.** Both labs independently validated the shape of the idea, state the expectation before the work, judge against it afterwards, at the level of one agent session. Neither took it up to the organisational decision. There is no team surface, no permission model over the record, and no notion of a real-world outcome landing weeks later.

### 2.7 What they built instead, and the one thing that actually threatens the wedge

**Fact.** Anthropic Claude Code routines are single-player by design: *"Routines belong to your individual claude.ai account. They are not shared with teammates."* Source: https://code.claude.com/docs/en/routines. Launched 2026-04-14.

**Fact.** OpenAI Frontier, launched 2026-02-05, governs agents, not decisions: *"Business Context connects enterprise systems, data warehouses, CRM tools, and internal apps, so AI agents can work with the same information people do"*; *"Agent identities let you scope access to exactly what each task requires."* Source: https://openai.com/business/frontier/.

**Fact.** OpenAI Company knowledge, 2025-10-23: *"a new way to bring together context from all your connected tools for answers that know your business, with citations and links back to sources from your apps ... Company knowledge respects your existing company permissions."* Extended to custom MCP connectors 2025-11-19. Anthropic's equivalent is connectors plus Claude Tag in Slack (2026-06-23).

**Fact.** Where the labs did build governance, permissions and audit trails, they built them over agents and prompts. Anthropic in this window shipped RBAC and custom roles (2026-04-09, extended 2026-06-02), a Compliance API and Activity Feed, Access Transparency, Trusted Devices, and inference hooks that hold *"each governed prompt across claude.ai, Cowork, and Claude Code"* for an allow or deny verdict (2026-08-05). OpenAI shipped RBAC (2025-07-17), EKM, a Global Admin Console and Spend Controls.

**Fact.** When OpenAI shipped role-specific agent packs on 2026-06-02, the roles were Sales, Data Analytics, Product Design, Creative Production, Investment Banking and Public Equity Investing. Product management was not one of them. The only later role packs through August 2026 are education plugins.

**Fact.** Anthropic verticalised into finance (2025-07-15, ten finance agent templates 2026-05-05), healthcare and life sciences, security, legal and small business, plus a Claude Science workbench (2026-06-30). Never into product decision-making.

**Fact.** ChatPRD, the company Krieger named on the podcast, was neither built nor bought. It is still independent and unfunded fourteen months later, claiming roughly 100,000 PMs and 750,000 documents as of June 2026, at $15 per month for Pro. Sources: https://chatprd.ai/, https://solofounders.com/blog/100k-users-nine-ai-employees-claire-vo-chatprd/.

**Inference, and this is the encroachment vector that matters.** The labs' answer to shared team context is **permissioned retrieval over the tools where the folder already lives**, not a new record. Both read the folder. Neither writes a decision back to it. That is a narrower threat than "the lab ships our product", but it is a real one, and it shipped early (2025-10-23) rather than late.

### 2.8 Lane A gaps, stated

- OpenAI `openai.com/index/*` returns HTTP 403 to direct fetch. The Frontier launch text is sourced from the business page plus same-day Verge, TechCrunch and Bloomberg coverage quoting the post, not from the post itself.
- The Claude Apps help-centre release notes returned only October 2025 onward on repeated fetches. June to September 2025 app entries could not be enumerated by direct read.
- No systematic diff of historical pricing-page snapshots was done. No SKU, plan tier or seat type at either lab is named for product management, discovery or prioritisation, but that is from current pages only.
- Careers sites were not exhaustively searched. Absence of a job post is weak evidence either way.
- Everything here is about what shipped. A private beta could exist with no public trace.

---

## 3. The money

_Lane B. Announcements, press releases, funding trackers, acquirer statements._

### 3.1 The problem is confirmed, by acquirers, and it is now consensus

**Fact.** Miro CEO Andrey Khusid on acquiring Reforge: *"The biggest opportunity ahead isn't just moving faster, it's moving faster in the right direction."* Miro's stated rationale is that the bottleneck slowing companies is not coding speed but deciding what to build. Source: https://miro.com/newsroom/miro-acquires-reforge-to-help-organizations-navigate-the-transition-to-ai/. Date: 2026-03-24.

**Inference.** This confirms thesis (a) from a buyer who paid real money and is nowhere near Lenny's world. It also means the insight is table stakes. An investor has heard it before.

### 3.2 The most decision-changing finding in this lane

**Fact.** Notion launched **Ship OS**, described as *"the agent-native way to ship software"*, running the cycle from customer feedback to merged pull requests with agents for feedback triage, PRD generation, task lists, PRs and status updates. Notion's framing: *"While tools like Cursor and Windsurf made individual developers faster, the challenge shifted to deciding what to build and synchronizing work across scattered tools."* **The template is free.** Notion charges only for AI usage on existing workspace plans. Sources: https://x.com/NotionHQ/status/2075249002208227743 and https://www.createwith.com/tool/notion/updates/notion-launches-ship-os-for-agent-driven-product-development. Date: 2026-07-09.

**Fact.** Ship OS stops at dispatching. No feature-performance, adoption or business-outcome tracking is described.

**Fact.** 2026 Series A diligence now opens on exactly this risk. Reported shift: *"Investors who once asked about your roadmap now open with questions about your data moat, your inference costs, and whether your product survives when a foundation model ships your feature natively."* Source: https://www.crv.com/content/ai-startup-funding.

**Gap, and it is important.** Ship OS is five weeks old. There is no usage, retention or install data. Its threat level is inferred from Notion's distribution and a zero price, not from measured uptake.

### 3.3 Who is funded

| Company | Amount | Date | Where it stops |
| --- | --- | --- | --- |
| Interloom (Munich) | $16.5M led by DN Capital, with Bek Ventures and Air Street | 2026-03-23 | Builds a "context graph" of how problems actually get resolved. Reconstructs resolution paths after the fact. No forecast, no outcome score. |
| Samepage | $4.85M seed from Craft Ventures, Freestyle, Glasswing, plus Justin Kan and Matt Mullenweg | 2026-06-25 | "Second brain for product leaders", 35+ sources. Stops at surfacing. |
| Brief (briefhq.ai) | a16z Speedrun Cohort 005, amount undisclosed | 2026 | "AI Chief Product Officer". Builds a Product Graph queried from the IDE by Cursor and Claude Code. Claims 95 percent decision compliance and 68 percent lower cost per merge-ready task. Measures agent compliance, not whether the bet worked. |
| Norm Ai | $120M Series C at $1.2B led by Khosla, with Blackstone, Bain Capital Ventures, Coatue, Vanguard | 2026-07-07 | Decision provenance, funded hard, at the **regulatory** layer not the product layer. |
| Linear | $82M Series C at $1.25B led by Accel | 2025-06-10 | Issue tracking. The execution layer. Profits up 280 percent year on year, 15,000+ customers. |

Sources in order: https://fortune.com/2026/03/23/interloom-ai-agents-raises-16-million-venture-funding/ ; https://www.prnewswire.com/news-releases/samepageai-launches-to-bring-continuous-intelligence-to-product-teams-302809943.html ; https://speedrun.a16z.com/companies/brief and https://briefhq.ai/ ; https://www.prnewswire.com/news-releases/norm-ai-raises-120-million-at-a-1-2-billion-valuation-led-by-khosla-ventures-to-deliver-the-full-stack-model-for-legal-ai-302819152.html ; https://techcrunch.com/2025/06/10/atlassian-rival-linear-raises-82m-at-1-25b-valuation/.

**Inference.** Money is flowing into the layers **beside** the product-decision seat: regulatory decision provenance, execution, and outcome measurement. Not into the seat itself.

### 3.4 Who died, and who stopped raising

**Fact.** Four comparables were absorbed or sunset in nineteen months. Kraftful to Amplitude 2025-07-10, terms undisclosed, platform shut down 2025-08-11. Cycle to Atlassian 2025-09-03, standalone product sunset 2025-10-31. Reforge to Miro 2026-03-24, terms undisclosed, Reforge Learning left as a separate entity. Zeda.io raised roughly $4M seed in 2022 and fell to one employee by 2025-03-31.

**Fact.** The two best-capitalised incumbents in the seat have not raised in over four years. Productboard: $262M total, last round a $125M Series D on 2022-02-02 at $1.72B post. Dovetail: $69.5M total, last round a $63M Series A in 2022 led by Accel. Sources: https://tracxn.com/d/companies/productboard/funding-and-investors ; https://dovetail.com/blog/series-a/.

**Fact.** Enterpret, the best-funded feedback-intelligence pure-play, raised a $20.8M Series A on 2024-12-04 led by Canaan and has no Series B twenty months later, despite shipping an agentic feedback system in October 2025.

**Fact.** ChatPRD and Vistaly, two of the most respected products in the seat, have raised nothing. Vistaly is the closest positioning to closing the loop, connecting daily product work to business impact, and has zero funding rounds.

**Inference.** Either the seat does not reward capital, or capital has decided the seat is not a business. Both readings are available from the same facts. We should not pick the flattering one in outward-facing material.

### 3.5 The finding that cuts against thesis (d), and why it is weaker than it looks

**Fact, thin source.** One analyst's dataset of publicly disclosed equity rounds at or above $300K (January 2024 to early July 2026) puts human approval as a category at *"only 1 deal and 0.8 percent of YTD 2026 capital"* and two deals at 1.4 percent of full-year 2025 capital, while Agent Development Platforms took roughly $275M year to date in 2026. Source: https://newmarketpitch.com/blogs/news/agentic-ai-funding-trends. Date: 2026-07-01.

**How to weight this.** It is one analyst blog with self-defined category boundaries and no independent corroboration. Its methodology is stated and reasonable. It measures **what VCs fund**, not what buyers want. Lane C and Lane D measure what buyers want and both confirm thesis (d) with better sources (see sections 4.4 and 6.1). **Where the lanes disagree, the buyer-side evidence is better sourced.** The correct reading is: graduated autonomy survives as a buyer requirement and fails as a standalone venture category. Sell it as a feature of the product, never as the category.

### 3.6 The measurement half is a different, richer market

**Fact.** Datadog acquired Eppo for a reported $220M, announced 2025-05-05, now shipping as "Eppo by Datadog". Statsig raised $100M Series C at $1.1B in 2025 before OpenAI bought it. Source: https://www.datadoghq.com/about/latest-news/press-releases/datadog-acquires-eppo-to-expand-its-ai/.

**Inference.** "Closing the loop" means competing with observability and experimentation infrastructure incumbents, not with PM tools. That is a harder fight and a different buyer.

### 3.7 The whitespace, honestly stated

**Fact.** Across repeated searches for closed-loop decision-to-outcome capture, forecast capture before shipping, prediction tracking and product-bet accountability in 2025 and 2026, **no company was found doing it, funded or unfunded.** Every funded comparable stops earlier. Samepage stops at surfacing. Brief and Notion Ship OS stop at dispatching. Interloom reconstructs after the fact. Enterpret and Kraftful synthesise feedback. Statsig and Eppo measure outcomes with no recorded prior belief. Negative result, searched 2026-08-11.

**Inference.** Whitespace nobody has paid for is as consistent with "no market" as with "unclaimed moat". Section 5.6 makes this worse, not better: engineering wrote the practice down years ago and never built tooling for it.

### 3.8 Lane B gaps, stated

- No primary source segments "product decision tooling" as a fundable category. Crunchbase, PitchBook and Tracxn do not report it as a vertical. Every directional claim here is assembled from individual deals, which is weaker than a category series.
- The widely repeated Productboard layoff figure (30 percent, 2026-04-15) **could not be verified**. It traces to a low-quality aggregator. trueup.io returned 403. No press release, WARN notice or tier-1 report was found. Do not use it. The load-bearing fact, no funding since 2022-02-02, is separately sourced and holds.
- Brief's round size, date and investors are not public. The "up to $1M" figure is Speedrun's standard programme term, not a confirmed round. Brief is the closest competitor to the wedge and its true capitalisation is unknown.
- Revenue figures for Dovetail and BuildBetter come from getlatka, an aggregator with known accuracy problems. **Do not use them outward.**
- Deal terms were not disclosed for Kraftful, Cycle or Reforge. Without prices, a soft landing and a real outcome are indistinguishable, which is precisely the distinction that decides whether this is a graveyard or a consolidating market.
- The shutdown census (95 shutdowns, 101 acquisitions over eighteen months, tooldirectory.ai, 2026-08-09) is a single aggregator with no stated methodology. Directionally useful, not citable.
- Geographic coverage is incomplete. Two non-US companies surfaced. No systematic search of Asian, Indian, LatAm or Japanese tooling was completed, so the outside-Lenny test is only partly satisfied here.

---

## 4. The role: is the buyer persona real outside Meta

_Lane C. Job postings, labour-market data, company statements._

### 4.1 The title is Meta-only

**Fact.** "Member of Product Staff" is a live, funded requisition at Instagram, San Francisco, $205,000 to $277,000 plus bonus and equity, 10+ years PM or Product Design. The description: *"Product Staff is how we build at Instagram: small, talent-dense teams of product builders, engineers, designers, and data scientists ... Members of the Product Staff create directional design, analyze data hands-on, and leverage AI tools to move faster with fewer handoffs."* Preferred qualifications include *"Demonstrated ongoing AI skill development (e.g., prompt/context engineering, agent orchestration)"*. Source: metacareers.com/profile/job_details/1050587157626836/.

**Fact, and it is a negative one.** Targeted searches across LinkedIn Jobs, Ashby, Greenhouse, Indeed, ZipRecruiter, Dynamite Jobs, JobsRadar, the Index Ventures board and direct company career pages returned **zero non-Meta postings using the title**. Every other hit was "Staff Product Manager", a pre-existing IC seniority level in use since roughly 2018. Searched 2026-08-11.

**Inference, and it is a directive.** **Sell the work, not the title.** If a pitch names "product staff" as an emerging role, it is making a Meta-only claim and a sharp reader will catch it.

### 4.2 The structural move is real, under other names

**Fact.** LinkedIn (Microsoft) retired its Associate Product Manager programme and replaced it with the **Associate Product Builder**: two-year rotational, Mountain View and San Francisco hybrid, $126,000 to $207,000 base. Applications opened 2025-09-02 and closed 2025-09-07. First cohort started January 2026. There is no resume. The application is a 60-second demo of something you built plus six written answers. CPO Tomer Cohen: *"We're going to teach them how to code, design, and PM at LinkedIn"*, with small pods of cross-trained builders, *"less about an engineer, designer, PM working together"* and more about people *"who can flex across."* Sources: Business Insider via aol.com/articles/linkedin-scrapping-associate-product-manager-063508038.html (2025-12-05) and apmlist.org/blog/linkedin-apm-associate-product-manager-builder (2026-07-22).

**Fact, and it is a correction to the summary.** Mosseri's own words are more modest than the framing. Pods are roughly six to seven people total, down from about thirteen. But later in the same interview: *"for an area like trust and safety, I have an engineering lead, I have a product staff lead, I have a data science lead, I have a design lead, I have a research lead."* The functions have not collapsed. They have been pulled out of the pod and up into leadership. Source: podscripts.co transcript of Lenny's Podcast, 2026-07-09, at 00:02:54, 00:03:23 and 00:32:49.

**Gap.** No third company outside Meta and LinkedIn was confirmed to have adopted the pod structure with a primary source.

### 4.3 The work is real and mostly outside tech, which is the point

**Fact, best source in this lane.** Indeed Hiring Lab, six countries, consistent methodology back to 2022: US job titles containing "AI" rose from 264 in Q1 2022 (2.6 percent of all titles with 5+ postings) to 822 by Q1 2026 (8.3 percent, about one in twelve). **63 percent of US AI-touched titles are now outside tech occupations.** Non-tech share exceeds 50 percent in five of six markets. One of three named clusters is *"AI enablement and consulting: roles where candidates are expected to advise on AI strategy, manage AI adoption, or oversee process changes."* Source: https://hiringlab.org/2026/07/08/ai-is-no-longer-just-a-tech-occupation-story/, Pawel Adrjan. Date: 2026-07-08.

**Fact, weaker source, same direction.** A single-day scrape of 24,000 postings found 1,035 "AI operator" roles, 67 percent outside the tech industry, at Harvard, BJ's Wholesale Club ($245K to $340K), Marriott, JPMorganChase, Molina Healthcare and NBC Universal. Skill mix 59 percent operations-oriented, under 5 percent technical. Source: news.theaiexchange.com AI Operator Jobs Index, 2026-05-19. One scrape, one day, one newsletter. Corroborative only.

**Inference.** This is the strongest single answer to the ecosystem-bias limitation. Two independent datasets, one of them a proper labour-market research shop with a four-year series, agree that the work has left the tech bubble.

### 4.4 Graduated autonomy, specified by buyers in their own requisitions

**Fact.** Gap Inc., "Product Manager II, Orchestration & Workflow", 55 Thomas Street NYC, job R213458, posted 2026-07-01. Responsibilities include *"defining the workflows ... where agents act autonomously, where humans decide"*; *"the triggers, conditions, handoffs, exception paths, and human-in-the-loop checkpoints"*; *"Design human-AI collaboration patterns that calibrate trust over time: where agents recommend, where they act, where they request confirmation, and how decision rationale, confidence, and provenance are surfaced to users"*; and *"Define agent evaluation and observability requirements; how we measure whether agents are doing the right thing, how we detect drift or regression, and how we close the loop between user feedback, eval data, and orchestration logic."* OKRs tie to agent reliability and human intervention rate. Source: gapinc.com/en-us/jobs/w45/8/product-manager-ii,-orchestration-workflow.

**Inference.** A Fortune 500 apparel retailer, not a tech company, not in Lenny's world, wrote our product specification into a job description. That is the single best artefact in this document for an outward-facing deck.

**Fact.** The forecast loop is also written into a requisition, in a regulated non-US industry. SimCorp (owned by Deutsche Börse), "Head of AI Operations", Copenhagen, DKK 600,000 to 800,000, applications to 2026-06-20. The role owns the AI use case pipeline and value realisation, specifically: *"translate operational challenges into clearly scoped AI use cases with defined value hypotheses"* and *"Own the benefits tracking framework for Ops AI initiatives; define metrics, measurement methodology, and reporting cadence; report AI value outcomes in regular business reviews; flag underperforming initiatives and drive corrective action."* Source: dk.trabajo.org/job-2257-9dc57b2206b5d1e28069a1d9fa76dac4.

**Fact.** Companies pay $170,000 to $220,000 for a human whose literal job is to maintain the folder. Tennr, "AI Operations Lead", NYC: *"Every team at Tennr uses AI and most of it is happening bottoms-up. What's missing is someone who owns it from the top."* Duties include *"a maintained prompt library, and a skills library the whole company can use"* and *"Publish a monthly AI scorecard to the executive team"*. Source: jobs.ashbyhq.com/tennr/acfb7000-c25c-435d-9aeb-5d3f15972ac9. Live as of 2026-08-11.

**Fact.** "Evals" is now its own PM sub-discipline at large non-startup companies. ServiceNow "Senior Staff, Product Manager, AI Evaluation & Quality" (2026-07-22): *"Agentic AI is only as trustworthy as the evaluation discipline behind it"*. Databricks "Staff PM, Agentic AI Applications" (2026-06-23): *"mandatory evaluation gates in CI/CD. No agent reaches production without passing quality and safety thresholds."* Zendesk "Senior Product Manager, AI Agents Testing" (2026-05-28) owns a *"pre-publish readiness gate that gives admins a quantified view of risk before every deployment"*. Also Workato, Trimble and Scale AI.

**Fact.** ClickUp "Staff Product Manager", $200,000 to $250,000: *"AI has collapsed the work that used to sit between an idea and a working version of it, and for the first time, PMs can be true builders ... Familiarity with tools like Claude Code, Cursor, Figma AI, and MCP integrations is expected."* Source: jobs.ashbyhq.com/clickup/7d03744f-2b83-4371-b248-e8fd9e04d1a7.

**Fact.** Product management asks for AI skills at a higher rate than software engineering does. Job Lobster analysed 558,596 postings active in the first week of July 2026, pulled directly from public employer ATS feeds (Greenhouse, Lever, Ashby, Workday), 492,144 with full description text: Data and AI 64.7 percent, **product management 54.9 percent**, security 50.7 percent, design 50.1 percent, **software engineering 43.9 percent**. Independently corroborated by Qarera across 360,000+ postings collected 2025-12-27 to 2026-06-16, where "AI" was the single most-requested skill in PM postings at 37.0 percent, ahead of "product management" itself at 29.5 percent. **Caveat: the Job Lobster page returned HTTP 404 on direct fetch and the figures come from a cached snapshot. Re-verify before quoting externally.**

### 4.5 The counter-evidence, and it is real

**Fact.** At the world's largest bank the dedicated AI executive seat is being **eliminated**. JPMorgan Chase Chief Data and Analytics Officer Teresa Heitsenrether, who led AI strategy for three years, is retiring at end-2026 and will not be replaced with a standalone AI chief. Her portfolio moves to CTO Scot Baldry, who will **not** take her seat on the twelve-person operating committee. Source: Bloomberg, memo reviewed by Reuters. Date: 2026-07-01.

**Fact.** The role has no agreed name. 1,035 AI-operator postings carried **636 distinct job titles**. A separate 2026 analysis counted at least eight competing labels with no market consensus and published pay from $75,000 to $247,000, a factor of 3.3. Its explicit prediction: *"The one thing we would bet against is the standalone AI ops headcount surviving at small companies. It gets absorbed back into operations or IT once the workflows are stable, the way webmaster did."* Source: digitalapplied.com/blog/ai-ops-role-smb-hiring-guide-2026, 2026-08-04.

**Fact.** "Context engineer" as a hiring title is substantially vendor marketing. Cognizant announced 1,000 Context Engineer hires on 2025-08-29 in partnership with Workfabric AI, which sells a product called ContextFabric. Do not lean on that title.

**Fact, two corrections to our own brief.**
1. **The Quora claim is wrong.** Adam D'Angelo opened an **engineering** role, not a head-of-AI-operations role: *"a single engineer who will use AI to automate manual work across the company"* (x.com/adamdangelo/status/1936504553916309617, 2025-06-21). The requisition is "AI Automation Engineer (Remote)", $155K to $234K, requiring 5+ years full-stack Python, React and JavaScript. This should be corrected wherever we have repeated it.
2. **The Every example is weaker than claimed.** Katie Parrott's own essay documents the project failing, ending with her abandoning custom infrastructure for shared Claude Projects. Her current title is "Staff Writer & AI Editorial Lead". Every's careers page lists no AI operations role as of August 2026. Source: every.to/working-overtime/how-i-successfully-failed-at-my-first-ai-operations-project.

**Fact.** The fastest-growing genuinely new AI role is a **deployment** role, not a decide-what-to-build role. Forward Deployed Engineer postings reportedly went from 643 in April 2025 to 5,330 in April 2026. Note: these figures reach us via secondary aggregation, not an Indeed Hiring Lab post. Lower confidence than section 4.3.

**Where lanes disagree.** Lane B says human approval gates draw 0.8 percent of agentic capital. Lane C says employers write graduated autonomy into requisitions at Gap, Zendesk and Databricks. **Lane C is better sourced** for the buyer question: these are primary employer documents, not one analyst's category boundaries. Investor appetite and buyer willingness to pay can diverge for years.

### 4.6 Lane C gaps, stated

- No consistent-methodology time series exists for PM posting volume. Vendor datasets disagree on direction: headcount down 28 percent from the 2022 peak (Live Data Technologies via Mind the Product, 2026-06-25) while LinkedIn shows PM jobs worldwide up 12 percent. **Do not put a single PM-hiring number in a deck.**
- No consistent series for "AI operations" posting counts across 2025 into 2026. Axial's dataset begins January 2026, so the growth rate of the role is unmeasured. We can show the role exists at scale. We cannot show it is growing.
- The "42 percent of LinkedIn AI-titled roles require no ML skills" figure appears only in secondary career blogs and could not be verified.
- Support for thesis (d) in this lane is entirely from what employers **write**, not what they **answered when asked**. One adjacent survey exists (Bluevine, 942 US small-business owners, fielded 2026-04-07 to 09: 74 percent using or testing AI, only 22 percent completely confident AI could handle low-level tasks unsupervised) but it was not verified against Bluevine's own publication.

---

## 5. Build vs buy: the direct test of the DIY thesis

_Lane D. Repositories measured through the GitHub API, Hacker News through the Algolia API, vendor changelogs, engineering blogs._

### 5.1 The DIY reflex, in engineers' own words

**Fact.** r/ExperiencedDevs, "Agent config is the new .editorconfig and nobody is managing it", 2026-03-04. The post states the transition-point thesis almost verbatim: *"Right now every engineer on my team has: Different CLAUDE.md content (or none at all) / Different MCP servers connected (with different credentials) / Different skills/rules for Cursor / Different permission settings ... We're essentially back to 'works on my machine' but for AI agent behavior. Anyone thinking about this at the org level? Curious how teams of 20+ are handling this."*

**Fact.** The replies are the finding. Top comment, 28 upvotes: *"Dude just commit your agent files. My team has had a shared agent directory since day one."* Others: *"Just commit your instruction files, they're not secret."* *"A simple slack message in the team channel should do."* *"Couldn't this be solved in a 5 min conversation?"* One senior reply describes a home-built system with an `/agents` directory, an org-wide template, a manifest of allowed MCP servers and a tiny CLI that generates everyone's config. **Zero commenters named a commercial product.** The original poster's own follow-up: *"I crafted caliber, an opensource to solve this one."*

**Fact.** Ask HN, 2026-03-05, an eight-engineer team: *"We've tried shared CLAUDE.md and multiple markdown doc files but they go stale fast and don't scale well. How is everyone else handling this? Has anyone found something that actually works at scale?"* The single reply recommended scoped instruction files, an agent hook, and microsoft/agentrc. All free. No product was named. Source: https://news.ycombinator.com/item?id=47266783.

### 5.2 The transition-point failure, measured not asserted

**Fact, first-party measurement via the GitHub API on 2026-08-11.** `browser-use/browser-use` ships both `AGENTS.md` (38,463 bytes, last commit 2026-07-30) and `CLAUDE.md` (11,149 bytes, last commit 2025-08-31). They describe the same repository differently. AGENTS.md opens *"Browser-Use is an AI agent that autonomously interacts with the web"*. CLAUDE.md opens *"Browser-use is an async python >= 3.11 library"*. A Codex session and a Claude Code session in that repo have been reading materially different briefings for about eleven months, and nobody noticed. By contrast `astral-sh/uv` reduces CLAUDE.md to an 11-byte `@AGENTS.md` stub; `vercel/next.js`, `apache/airflow` and `ghostty` keep byte-identical files; `langchain-ai/langchain` keeps two independent 18,831-byte copies in sync by hand.

**Fact.** The governance failure is named precisely at team scale. HN commenter bisonbear: *"if I write a bad AGENTS.md for a repo with 100 engineers actively working in it, then every agent for every engineer gets worse, without anyone really noticing."* Source: https://news.ycombinator.com/item?id=48160604, 2026-05-16.

**Fact.** A dated practitioner account of an agent acting on a reversed decision, with the self-healing behaviour that hides it. Aliou Diallo, consultant, 2026-02-03: *"the AGENTS.md referenced a library and one of its commands that had been deprecated weeks earlier (they had moved from Kysely to Drizzle). Every day, the agent kept running `kysely migrate latest` instead of the new Drizzle equivalent. It would then read the package.json, notice the error, and correct itself, so developers wouldn't see the issue immediately and never thought to update the AGENTS.md."* And: *"Agents make decisions based on what they read and the first thing they read is that file. If it's stale, the decisions are stale too and the cost compounds over weeks."* His proposed fix is pure DIY: a CODEOWNERS entry, a CI nudge and a scheduled audit. Source: https://aliou.me/posts/coding-agents-team-scale/.

**Fact, at scale.** HN commenter bredren, on two monorepos with 80+ and 40+ developers: *"On the first, there were ~no shared skills ... they were not minded properly and became stale / ate context for little gain. I maintained my own set of skills and CLIs to back them ... it was like the old days of manage your own stuff. But then on the second one we were in better shape, we had vendoring set up to distro skills automatically ... Like night and day."* The fix that worked was internally built. Source: https://news.ycombinator.com/item?id=48962163, 2026-07-18.

### 5.3 The largest organisation solving this built it

**Fact.** Cloudflare, "The AI engineering stack we built internally", 2026-04-20: 93 percent adoption across R&D in eleven months, 3,683 active users, 241.37B tokens per month. Three layers, all in-house: a Backstage service catalog (2,055 services, 375 teams), an LLM generator that opened automated pull requests adding a tailored AGENTS.md to *"roughly 3,900 repositories"*, and 100 percent AI code reviewer coverage that flags when a change means AGENTS.md needs updating. Their stated reason: *"A stale AGENTS.md can be worse than no file at all."* Source: https://blog.cloudflare.com/internal-ai-engineering-stack/.

**Inference, two ways.** Against us: the biggest, best-resourced organisation with this exact problem built rather than bought. For us: Dosu's read is that *"most teams can't dedicate the time or budget to build a center of excellence like Cloudflare's ... that can take a year (or more) of dedicated infrastructure plumbing."* Both readings are honest. The first is the fact, the second is a vendor's commentary on it.

### 5.4 The platform vendors are absorbing the wedge, free, with the seat

**Fact.** GitHub, changelog 2025-11-05: *"Copilot coding agent ... now supports organization custom instructions ... you can also set default instructions for all coding agent usage across your organization, ensuring a consistent experience across teams."* Organization custom instructions went GA 2026-04-02, plus enterprise-level custom agents scoped across all orgs.

**Fact.** Cursor: *"Team and Enterprise plans can create and enforce rules across their entire organization from the Cursor dashboard"*; admins can Enforce this rule, after which *"the rule is required for all team members and cannot be disabled in Customize"*. Cursor shipped Organizations for Enterprise 2026-06-03. Source: https://cursor.com/docs/context/rules.

**Fact.** Microsoft gives away the generate-and-detect-drift product. `microsoft/agentrc`: *"AgentRC reads your codebase and generates the files that close that gap, then evaluates whether they actually help, so the context doesn't go stale as your code evolves. Works as a CLI, as a VS Code extension, and in your CI/CD pipeline to monitor drift."* Created 2026-01-29, 1,007 stars, last pushed 2026-08-05. `microsoft/apm`, an agent package manager, 3,502 stars. `dyoshikawa/rulesync`, 1,300 stars, pushed 2026-08-10. Star and date figures verified via the GitHub API 2026-08-11.

**Gap.** Neither GitHub nor Cursor publishes adoption figures for these features. The strength of this contradicting force is unquantified.

### 5.5 Demand is pointed at a file format, not at a product

**Fact.** `anthropics/claude-code` issue #6235, "Feature Request: Support AGENTS.md", opened 2025-08-21, **still open on 2026-08-11**, with 347 comments and **5,864 reactions** (4,535 thumbs up). Verified via the GitHub API.

**Fact, and this is the market signal.** Hacker News attention is asymmetric by roughly 100x between the free format and products selling the managed version. Measured via the HN Algolia API on 2026-08-11:

| Item | Points / comments | Date |
| --- | --- | --- |
| "AGENTS.md, Open format for guiding coding agents" | 837 / 382 | 2025-08-20 |
| "AGENTS.md outperforms skills in our agent evals" | 524 / 196 | 2026-01-29 |
| "Evaluating AGENTS.md" | 232 / 161 | 2026-02-16 |
| "Company-Wide Agents.md" (alignbase.ai) | 12 / 6 | 2026-06-23 |
| Show HN: Straion, dynamic AGENTS.md context | 4 / 1 | 2026-02-22 |
| Show HN: CodeYam, "tired of managing Claude.md files" | 4 / 1 | 2026-03-12 |

**Fact.** The commercial category exists and is tiny. Sequa AI: 3 employees, down 33 percent year on year, EUR 100,000 seed plus USD 114,800 pre-seed. Packmind: 7 employees, down 15 percent, roughly EUR 930K seed plus USD 1.0M pre-seed, though it claims on LinkedIn (2025-12-30) *"used by 100s of teams from startup to large enterprises"*, which is a vendor self-claim with no logos. Alignbase, Straion, CodeYam, ccmd.dev, Blume and First-Tree are in the same category with no disclosed enterprise logos. ccmd.dev prices at 9 to 19 dollars a month solo, 49 for a team.

### 5.6 Three findings that cut against the compounding-context moat

These are the hardest facts in the document and should not be softened.

**Fact.** Boris Cherny, creator of Claude Code, at YC Startup School 2026: *"For people who aren't building agentic products but are using Claude Code, every 6 months, delete your claude.md file, delete your skills, and delete your hooks. Then see what the model does. It might surprise you."* Anthropic cut Claude Code's own system prompt by over 80 percent when Opus 5 shipped. Sources: https://www.ycombinator.com/library/UN-boris-cherny-building-claude-code and https://www.youtube.com/watch?v=qyPCVqFUyDo.

**Fact.** Peer-reviewed. Gloaguen, Mündler, Müller, Raychev and Vechev (ETH Zurich and LogicStar), "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?": *"providing context files does not generally improve task success rates, while increasing inference cost by over 20% on average"*, and *"while instructions in the context files are well followed by coding agents, repository overviews, although popular and recommended by model providers, are not helpful."* Source: https://arxiv.org/abs/2602.11988. Submitted 2026-02-12, revised 2026-06-23.

**Fact.** Rules loaded into context are not reliably obeyed, and a governance product cannot fix that. Cursor staff, responding to a user whose rules were ignored: *"We checked and your rules really are being included in the context, they're visible in the system prompt. So it's not a bug with passing the rules through, it's an issue with how the model follows them."* And elsewhere: *"Rules in context don't guarantee 100% adherence. These models are probabilistic."* The community's convergent fix is to move rules out of prose into hooks and lint: *"If a rule can be enforced by lint, type checks, or a small script, it should live there."*

**Fact.** The DIY corpus is drifting toward **deletion**, not accumulation. Convergent 2026 practitioner advice: *"Delete any rule the agent could infer from reading the code"*; *"Convert rules that must always happen into hooks, which are deterministic, instead of instructions, which are suggestions"*; *"Anything nobody has been corrected on in 3+ months: delete it."*

**Inference, and it should change our language.** A pitch built on "context compounds" is arguing against the creator of Claude Code and against a peer-reviewed result. The defensible version is narrower and survives all three facts: **the record of what was decided, by whom, on what evidence, and whether it worked is durable; the prose instructions telling an agent how to behave are not.** Model improvement deletes the second and does not touch the first. Say it that way.

### 5.7 The forecast idea already exists in engineering, and never became a product

**Fact.** Martin Fowler on Architecture Decision Records: *"it's handy to record the confidence level of the decision. This is a good place to mention any changes in the product context that should trigger the team to reevaluate the decision."* Storage guidance is to keep them in the source repository, commonly `doc/adr`, *"written in a lightweight markup language, such as markdown"*. Once accepted, an ADR *"should never be reopened or changed, instead it should be superseded."* Source: https://martinfowler.com/bliki/ArchitectureDecisionRecord.html.

**Fact.** Microsoft's Well-Architected Framework says the same: *"The ADR serves as an append-only log"* and *"Record the confidence level of the decision."* Source: https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record.

**Fact.** The tooling is stagnant. `npryce/adr-tools`: 5,608 stars, **last pushed 2024-04-25**. `adr/madr`: 2,390 stars. Verified via the GitHub API 2026-08-11.

**Fact.** The gap we claim is named, by an engineering source: *"The retroactive ADR has the form of the decision record but not the substance. The context is reconstructed, the alternatives are forgotten, and the consequences are described as outcomes rather than as a forecast the team committed to."* And: *"A team that writes ADRs but never re-reads them ends up with a system that has quietly drifted away from its own decisions ... it's the reason most ADR programs eventually stall."* Source: https://www.catio.tech/blog/architecture-decision-record, 2026-06-11.

**Where lanes disagree, and the resolution.** Lane B concluded the forecast moat is *"genuine whitespace with zero external validation"*. Lane D shows it is not conceptually novel: engineering doctrine has specified a confidence level and a revisit trigger for years, and both Fowler and Microsoft Learn are stronger sources than any of Lane B's negative searches. **Lane D is better sourced.** The correct claim is therefore sharper and more defensible: *the practice is documented doctrine, the tooling has been dead since April 2024, and the reason stated by practitioners is that consequences get written as outcomes rather than as a forecast the team committed to.* That is a better story than "nobody thought of this". It also carries the obvious risk: a decade of doctrine with no tooling is evidence the buying never happened.

### 5.8 Lane D gaps, stated

- **No canonical name exists** for "the agent acted on a stale decision". At least seven competing labels are in use: context drift, instruction drift, import drift, context rot, rules rot, agent drift, stale AGENTS.md. There is no term an engineer would type into a search bar, which means there is no established buying category to attach a product to.
- **The key artefact could not be replicated.** No dated, first-person post was found of the form "we trialled commercial tool X and went back to markdown". Lenny's nine DIY clusters have that shape. Outside his corpus we found the DIY reflex and we found products with near-zero engagement, but not the explicit trial-and-return. Absence is weak evidence either way, since nobody blogs about a tool they never tried.
- **No procurement or revenue evidence in either direction.** No named engineering organisation publicly states it pays for a shared agent-context product. No public statement of a team refusing to buy either.
- Reddit is not directly fetchable from this environment. All Reddit evidence came through a cached index. Vote counts could not be independently confirmed and full comment trees could not be read. r/ProductManagement returned nothing usable on this topic.
- **Several widely circulated quotes were deliberately excluded** because they trace only to SEO-shaped vendor blogs and the originating thread could not be located. Specifically a much-repeated r/cursor thread (*"Six months later half the rules in it are wrong ... It trusts the file more than the code"*) and quotes attributed to u/ultrathink-art, u/JimmyBenHsu and u/CODE_HEIST. **Do not cite these.**
- No non-US, non-English practitioner evidence. This lane traded PM-adjacency for engineering-adjacency, not for geography.

---

## 6. Outside-the-bubble practitioner evidence

### 6.1 The hardest number supporting thesis (d)

**Fact.** Stack Overflow Developer Survey 2025, published December 2025, the largest developer survey run anywhere and entirely outside the PM world:

- 84 percent are using or planning to use AI tools in their development process.
- **46 percent actively distrust the accuracy of AI tools; 33 percent trust it.**
- **Only 3 percent report highly trusting AI output.**
- Trust fell 11 percentage points in one year, from 40 to 29 percent.
- On autonomous agents specifically: 14.1 percent use them daily at work, 9 percent weekly, 7.8 percent monthly, and **37.9 percent have no intention of adopting AI agents at all.**

Sources: https://survey.stackoverflow.co/2025/ai and https://stackoverflow.blog/2026/02/18/closing-the-developer-ai-trust-gap/.

**Inference.** Adoption is near-universal and trust is falling. That is exactly the condition under which graduated autonomy with human gates is the only sellable posture. Thesis (d) survives its hardest external test. Note again that this measures **developers**, and that Lane B's funding data says investors do not fund gates as a category. Both are true. Build the gates, do not name the category after them.

### 6.2 The most conservative communities reach for a folder anyway

**Fact.** `sqlite/sqlite` committed "Add a prototype AGENTS.md file" on 2026-05-22, followed the same day by "Strengthen the statement about not accepting agentic code." Verified via the GitHub API 2026-08-11.

**Fact.** On emacs-devel, 2026-08-03, Sean Whitton: *"An alternative to hooks, which is producing a lot of minutiae, maybe we could add an AGENTS.md file to the repository ... Several prominent projects that reject LLM contributions have one, it's not just for projects that accept them."* Source: https://lists.gnu.org/archive/html/emacs-devel/2026-08/msg00077.html.

**Inference.** A project that bans agentic contributions still writes the folder. The DIY default is not an early-adopter behaviour. It is the universal one.

### 6.3 The labs' own people say the PRD is being replaced, not systematised

**Fact.** Scott White, Head of Product for Claude.ai: *"evals are the new PRD"*. His workflow is to write the PRD, generate evals from it, and implement those evals inside the product. Cat Wu: *"Just building ten great evals is important."* The Claude Code team runs side quests instead of a long-term roadmap, replaced standups with demos, and writes a one-page PRD only for large fuzzy projects. Ars Technica confirms independently: *"Anthropic doesn't have a long-term road map for Claude Code."* Sources: https://claude.com/blog/product-management-on-the-ai-exponential/ and the Ars Technica interview above.

**Inference, and it cuts both ways.** The forecast idea exists in the labs' own vocabulary, which is validation. But their response was to **delete** the artefact rather than build a system to hold it, which is a warning about how a sophisticated buyer may react.

---

## 7. What we still cannot answer, and what it would take

### 7.1 The five questions this document does not close

**1. Does anyone pay for this?**
No procurement evidence, in either direction, anywhere in four lanes. No named organisation publicly states it pays for a shared decision or agent-context product. No named organisation publicly states it refused to. Packmind's "100s of teams" is a vendor self-claim with no logos.
*What it would take:* five to ten first-party conversations with buyers who have a budget line, or one signed pilot. Nothing in secondary research substitutes for this.

**2. Does the trial-and-return pattern exist outside Lenny's corpus?**
This is the load-bearing shape of thesis (b) and Lane D could not replicate it. We found the DIY reflex in abundance. We did not find a single dated post saying "we bought X and went back to markdown".
*What it would take:* a targeted search of vendor churn, or asking the question directly in r/ExperiencedDevs and Ask HN and citing the answers with dates.

**3. Is Notion Ship OS actually being adopted?**
Five weeks old, free, backed by enormous distribution, and using our exact framing. Zero usage data exists.
*What it would take:* re-check in November 2026 for template install counts, Notion changelog follow-ups, and whether outcome tracking gets added. **Set a calendar reminder. This is the single largest external risk in the file.**

**4. Is the forecast record durable, or is it the next thing model improvement deletes?**
Section 5.6 contains three credible facts pointing at accumulated context being a depreciating asset. Our counter-argument, that a decision ledger is different in kind from prose instructions, is currently an inference we have made and not a fact anyone else has stated.
*What it would take:* one external voice, ideally an engineering or compliance source, making the same distinction independently. Norm Ai's $120M at the regulatory layer is the nearest adjacent evidence and it is about regulated decisions, not product ones.

**5. Does any of this hold outside the US and EU, in English?**
It has not been tested. Two non-US companies surfaced across four lanes (Interloom in Munich, Cycle in France) and one non-US requisition (SimCorp in Copenhagen). No systematic search of Asian, Indian, LatAm or Japanese ecosystems was completed. The limitation we set out to remove is only partly removed. We traded one bubble for three adjacent ones.

### 7.2 Corrections to make in our own material

- **Quora did not create a head-of-AI-operations role.** It opened an AI Automation Engineer requisition requiring 5+ years of full-stack development. Correct this wherever we have repeated it (§4.5).
- **Every's AI operations role is not a durable example.** The project is documented as having failed and the title has since changed (§4.5).
- **"Product staff" is a Meta-only title.** Sell the work, not the title (§4.1).
- **Do not use the Productboard 30 percent layoff figure**, the getlatka revenue figures for Dovetail or BuildBetter, or the unattributed r/cursor quotes (§3.8, §5.8).

### 7.3 What is now safe to say outward

Only these, and each with its source:

1. Fourteen months after Anthropic's CPO named it publicly, neither frontier lab has shipped a team-shared, permissioned, outcome-labelled product-decision system. Both walked away from the productised measurement layer they already owned. (§2, primary sources throughout.)
2. A Fortune 500 retailer wrote graduated autonomy with human gates into a product manager requisition, in July 2026. (§4.4, Gap Inc.)
3. A Deutsche Börse subsidiary wrote value hypotheses at decision time plus benefits tracking into a job description, in a regulated non-US industry. (§4.4, SimCorp.)
4. 46 percent of developers distrust AI accuracy and only 3 percent highly trust it, while 84 percent use it. (§6.1, Stack Overflow 2025.)
5. Two agent-context files in a widely used open-source repository have disagreed for eleven months without anyone noticing. (§5.2, our own GitHub API measurement, 2026-08-11.)
6. Engineering doctrine has specified recording a decision's confidence level and revisit trigger for years, and the tooling for it has not been touched since April 2024. (§5.7, Fowler, Microsoft Learn, GitHub API.)
