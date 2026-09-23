# Leading indicators: what the market will need in the next six to twelve months

> _Created: 2026-09-23 · Last updated: 2026-09-23_

**Part of the 2026-09-23 strategy reset** ([`../strategy/strategy-reset-2026-09.md`](../strategy/strategy-reset-2026-09.md)).
The founder asked for a forecast built from signals that are published **before** the market
moves, with YC's Requests for Startups as the example. This file lists those signals with dates,
then states the forecast, labelled. **Re-run it before relying on it after 2026-12-31**, because
several of the dated events below will have happened.

Labels: **[FACT]** is sourced and dated. **[INFERENCE]** is reasoning from facts. **[SPECULATION]**
is a forecast and says so.

---

## 1. Signal one: how YC's requests moved across three batches

| Batch | Requests (author) | Source |
| --- | --- | --- |
| **Spring 2026** | **Cursor for Product Managers (Diana Hu)** · AI-native hedge funds (Garry Tan) · AI-native agencies (Eric Migicovsky) · stablecoin financial services (Anu Hariharan) · AI for government, AI guidance for physical work, infra for government fraud hunters (Jared Friedman) · modern metal mills (Gustaf Alströmer) | [Modelence](https://modelence.com/yc-rfs-spring-2026) |
| **Summer 2026** | AI-native service companies (Alströmer) · **Company Brain (Tom Blomfield)** · dynamic software interfaces · hardware supply chain · SaaS challengers (Friedman) · **Software for Agents** (Aaron Epstein) · **startups that want to sell to huge companies** · supply chain 2.0 for semiconductors · **The AI Operating System for Companies (Diana Hu)** · inference chips for agent workflows · AI for low-pesticide agriculture · AI personalised medicine · counter-swarm defense · electronics in space · industrial capabilities in space | [Modelence](https://modelence.com/yc-rfs-summer-2026) |
| **Fall 2026** | The Primer (AI tutor) · Future of American Defense (US Secretary of the Army) · cloud for small software · **Multiplayer AI** · compute at sea · AI consumer products for 1B people · AI for the aging population · operating systems for the physical world · crypto · data for the real world · **Proving you're human** · **AI-native compliance infrastructure (Daivik Goel)** · self-maintaining APIs | [YC](https://www.ycombinator.com/rfs) |

- **[FACT]** The Fall 2026 compliance request, in YC's words: *"Financial compliance is still
  stitched together with spreadsheets, siloed tools, and expensive headcount. Most compliance work is
  monitoring regulatory changes, flagging anomalies, generating reports, and keeping audit trails.
  The companies that get this right will become essential infrastructure for any business operating
  globally."* ([YC](https://www.ycombinator.com/rfs))
- **[FACT]** Supaprod's YC one-liner was *"Cursor for PMs, the whole product org"*
  ([`../pitch/yc/OUTCOME.md`](../pitch/yc/OUTCOME.md)), and its product spans Spring's "Cursor for
  PMs", Summer's "Company Brain" and Summer's "AI Operating System for Companies". It was filed on
  2026-07-23 for the Fall batch.
- **[INFERENCE]** The drift is from **horizontal tools for knowledge-work roles** (Spring), to
  **agents as the foundation and services-as-software** (Summer), to **AI entering categories that
  were "too physical, too regulated, or too poorly measured"** plus compliance, identity and
  multiplayer (Fall). Each request also attracts a crowd of applicants the moment it is published,
  so **an RFS is a lagging signal for the idea and a leading signal for where partners' attention
  is going.** Filing a Spring idea into the Fall batch was two moves behind.
- **[SPECULATION]** The next lists will keep pushing into regulated and physical work, and into
  *trust*: verification, identity, provenance and assurance of what agents did. That is consistent
  with "Proving you're human" and "AI-native compliance infrastructure" appearing together.

## 2. Signal two: dated regulatory events inside the window

| When | Event | Status | Source |
| --- | --- | --- | --- |
| **"Near future"** | US Fed/OCC/FDIC **request for information on AI model risk, "in particular… generative AI and agentic AI"** | Announced 2026-04-17, not yet issued | [OCC 2026-13](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html) |
| Pending | **RBI Model Risk Management guidance, final.** Draft 2026-06-24 covers GenAI, all 11 entity types, no size carve-out, independent validation of third-party models regardless of vendor assurance | Comments closed 2026-07-24 | [regulated-fs §1](./regulated-fs-agent-governance-2026-09.md) |
| ~Sep–Oct 2026 | IRDAI AI working group reports (3-month mandate from 2026-06-19) | Due | same |
| "Soon" | MAS AI risk management guidelines, final (cover agents) | Consulted Nov 2025 | same |
| **Nov 2026** | NAIC AI Systems Evaluation Tool expected adoption (insurers, 12-state pilot) | Pilot ends Sep 2026 | same |
| End 2026 | FCA guidance on AI and senior-manager accountability, requested by the Treasury Committee | Requested | same |
| **2027-01-01** | Colorado's replacement AI law in force (disclosure, 3-year records) | Signed | same |
| **2027-05-01** | **OSFI Guideline E-23 in force** (Canada; all models incl. third-party and generative) | Final | same |
| **2027-12-02** | EU AI Act Annex III high-risk obligations (incl. credit scoring), after the Digital Omnibus delay | Final | same |

- **[FACT]** The one regulator most people assumed would force this, the US, **explicitly put
  generative and agentic AI out of scope** of SR 26-2 and told banks to use their own risk practices
  in the meantime. ([OCC](https://www.occ.gov/news-issuances/bulletins/2026/bulletin-2026-13.html))
- **[INFERENCE]** Inside twelve months, **the first binding, agent-inclusive model-risk rules land in
  Asia (India, Singapore) and Canada**, not the US or EU. The US produces an RFI, which is a
  question, not a rule. Banks everywhere are building their own agent controls in a vacuum now, and
  whoever gives them a defensible method before the rules arrive is writing the practice the rules
  later describe.

## 3. Signal three: where the money went in 2026

- **[FACT]** Security, evaluation and observability layers were **bought**: Protect AI, Lakera,
  Prompt, Galileo, Langfuse, Promptfoo, Arize ($915M), Statsig ($1.1B), Eppo, DX ($1B). Billing:
  Metronome to Stripe (~$1B), Orb to Adyen ($335M). Identity: ~$27B+ of consolidation.
  ([agentic-stack §A–C](./agentic-stack-and-absorption-2026-09.md))
- **[FACT]** Capital went to **agents that do regulated work with the evidence built in** and to
  **independent assurance**: Bretton $75M (AML/KYC), Norm Ai $120M at $1.2B, Harvey at $11B, Vals AI
  $40M at $400M (independent evaluation for finance, legal, tax), AIUC $40M (agent certification,
  Lloyd's-backed, KPMG the first Big Four firm certified to its standard).
  ([regulated-fs §3–4](./regulated-fs-agent-governance-2026-09.md),
  [agentic-stack §A](./agentic-stack-and-absorption-2026-09.md))
- **[FACT]** Governance *workflow software* raised small: ValidMind $11.1M total, Monitaur $13.2M,
  Trustible $4.6M. Gartner sizes AI governance platforms at **$492M in 2026**.
- **[FACT]** Sequoia: *"services are the new software"*, $6 spent on services for every $1 on
  software. ([Fortune](https://fortune.com/2026/04/21/services-are-the-new-software-sequoia-venture-capital-julien-bek-ai-native-eye-on-ai/))
- **[FACT]** The UK's AI assurance market: **£1.01bn GVA and 12,000+ jobs in 2024**, 524 firms, 84
  specialised, projected to reach **£6.53bn by 2035**; the government names "limited demand, lack of
  quality infrastructure, and fragmented frameworks" as the barriers.
  ([DSIT, *Assuring a Responsible Future for AI*](https://assets.publishing.service.gov.uk/media/672a2ca440f7da695c921b7c/Assuring_a_Responsible_Future_for_AI.pdf),
  [techUK](https://www.techuk.org/resource/dsit-secretary-of-state-announces-rta-ai-assurance-initiative-6-5bn-market-growth-potential-and-new-public-consultation.html))
- **[INFERENCE]** The labour spend is the market; the software line is small because the work is
  still done by people and consultants. Venture money is following companies that **replace that
  labour with agents and sell the outcome**, not companies that sell a dashboard to the people doing
  it.

## 4. Signal four: what the labs shipped, and what they did not

- **[FACT]** In 2025–26 the labs and hyperscalers shipped into every layer around their own agents:
  runtimes, sandboxes, memory, evals, spend limits, audit logs, identity hooks, vertical templates
  (Anthropic's ten finance agents including a KYC screener; ChatGPT for Financial Services,
  2026-09-10), and now services joint ventures ($1.5B and ~$14B).
  ([agentic-stack §A](./agentic-stack-and-absorption-2026-09.md))
- **[FACT]** On compliance they **partnered**: Anthropic's Compliance API feeds 28 partners
  including Purview and IBM Guardium. ([regulated-fs §6](./regulated-fs-agent-governance-2026-09.md))
- **[FACT]** A new primitive arrived on 2026-09-15: typed decision models (Jev, then Laya three days
  later) that return calibrated probabilities for about a hundredth of the cost of an LLM judge.
  ([jev-and-laya](./jev-and-laya-2026-09.md))
- **[INFERENCE]** Labs will keep absorbing anything that raises token use on their own platform.
  They do not absorb what needs **independence from the model vendor** (validation, certification,
  audit, insurance) or **accountability for outcomes** in licensed work. Their own marketing proves
  it: Anthropic cites Vals AI's third-party benchmark, not its own grading.

## 5. The forecast

| # | Within 6–12 months | Label |
| --- | --- | --- |
| 1 | Every agent-building layer (runtime, memory, evals, observability, logs, spend, identity) is a lab or incumbent feature. **A startup entering those layers now is entering to be acquired or flattened.** | [INFERENCE] |
| 2 | Banks, NBFCs and insurers keep deploying agents (31% of reported bank AI use cases were agentic in Q1 2026, up from 15%) while their validation capacity stays flat. **The queue moves from "can we build it" to "can we approve it".** | [INFERENCE] on Evident + Deloitte data |
| 3 | India's final RBI model-risk guidance and Singapore's MAS guidelines become the first binding agent-inclusive rules. Canada follows in May 2027. The US issues an RFI. | [SPECULATION] on timing; the drafts are [FACT] |
| 4 | Buyers want **evidence an examiner accepts**, produced continuously and cheaply, from someone who is not the model vendor. Lab logs become the raw input; the independent opinion on top is what is bought. | [INFERENCE] |
| 5 | Typed decision models make per-action checking cheap enough to run on every tool call. At least one frontier lab ships its own decision model. Checking becomes a commodity; **the record of checks, graded against outcomes, does not.** | [SPECULATION] (analyst prediction quoted in [jev-and-laya](./jev-and-laya-2026-09.md)) |
| 6 | Big Four and incumbents (IBM, ServiceNow, Solytics in India) expand AI assurance practices. The race for a startup is against **consultancies' labour cost**, not against labs' capability. | [INFERENCE] |

**The gap, in one sentence [INFERENCE]:** regulated institutions will be running agents they cannot
independently validate, the rules that require validation are arriving first where this founder
already knows the buyers, and the only parties structurally barred from filling the gap are the
model vendors themselves.
