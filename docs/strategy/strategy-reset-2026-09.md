# Strategy reset: should Supaprod exist, and what to do instead

> _Created: 2026-09-23 · Last updated: 2026-09-23_

**Status: RULED 2026-09-23 18:17 IST ([R-42](../../the-first-run/RULINGS.md)). Stopping Supaprod is
accepted. The recommended pivot (§0 items 3 and 4, §10 options 1 to 3, §11) is DECLINED; see §14
for why and for the constraints the next search runs under.** The rest of this file stands as the
analysis and evidence it was. Written by
the Claude Code session "Validating idea" on 2026-09-23, from the founder's brief
([`../prompts/strategy-reset.md`](../prompts/strategy-reset.md), verbatim) and five research files
committed alongside it. Every outside claim below links to the research file that sources it; the
research files carry the URLs and dates.

| Research file | What it holds |
| --- | --- |
| [`../research/supaprod-internal-evidence-2026-09.md`](../research/supaprod-internal-evidence-2026-09.md) | What the repo itself proves: users, runs, positioning history, rejections, what earlier research already said |
| [`../research/agentic-stack-and-absorption-2026-09.md`](../research/agentic-stack-and-absorption-2026-09.md) | The 2026 agentic stack layer by layer, what the labs absorbed, what survived, the current thesis tested, investor theses, B2B vs B2C. Subagent report, verbatim |
| [`../research/regulated-fs-agent-governance-2026-09.md`](../research/regulated-fs-agent-governance-2026-09.md) | Regulation, pain, competitors, buyers and India for AI-agent validation in financial services, briefed to break the idea. Subagent report, verbatim |
| [`../research/leading-indicators-2026-09.md`](../research/leading-indicators-2026-09.md) | YC's requests across three batches, dated regulatory events, where the money went, and the 6–12 month forecast |
| [`../research/jev-and-laya-2026-09.md`](../research/jev-and-laya-2026-09.md) | The typed decision models, their limits, and what they change |

Labels used throughout: **[FACT]** has a source. **[ASSUMPTION]** is believed and untested.
**[HYPOTHESIS]** is testable and untested. **[SPECULATION]** is a guess and says so.

---

## 0. The call

1. **Stop building Supaprod.** Not narrow it, not reposition it again. The problem it solves is
   real, but the people who have it will not pay for it. Its best features are shipped free
   or bundled by the companies that own the work (Linear Agent on every plan from 2026-03-24,
   Atlassian's Product Collection from 2026-05-06, Anthropic's open-source PM plugin, review bots in
   every PR surface). It has no users, and it has never done its core job once for anyone.
2. **Keep the one idea that was right,** because it has a buyer who is required to pay for it
   somewhere else. The idea: **an independent party checks work it did not produce, against an
   expectation recorded before the outcome was known.** For a product manager that is a
   scoreboard of who was wrong, and nobody buys that for themselves. In a regulated financial
   institution it is called **independent validation** and **outcomes analysis**, and it is
   mandatory.
3. **[DECLINED 2026-09-23, §14.]** **The recommended pivot is independent validation of AI agents in regulated financial
   services, sold as a finished validation, not as software.** Start with the AI vendors that sell
   agents into Indian banks and NBFCs, because the RBI's June 2026 draft makes their customers
   validate every third-party model "notwithstanding any validation, certification, or assurance
   already provided by the third-party provider". The vendors need evidence to close deals now.
   This is the founder's own domain: he ran the AI platform that 200+ financial institutions
   build on. It is the one layer the frontier labs cannot absorb, because **a model vendor cannot
   independently validate itself.**
4. **That pivot is a hypothesis with the best evidence found, not a validated business.** It has
   real weaknesses, listed in §10. **It gets two weeks of conversations and one hand-made
   deliverable, and no product code,** before anything is built. The kill criteria are in §11.
   If it fails, the fallback is in §12.

---

## 1. First principles

### What problem was Supaprod solving, and for whom

**[FACT]** The repo states it five ways in ten weeks
([internal evidence §1](../research/supaprod-internal-evidence-2026-09.md)). Reduced to one:
*agents made building cheap, so the scarce thing is knowing what to build and knowing whether
what was built worked.* The customer was a product manager, later "the person accountable for
merging agent-written work".

| Question | Answer | Label |
| --- | --- | --- |
| Who has the problem? | Product and engineering leads at software companies using coding agents | [FACT] that they exist |
| How painful, how often? | The review bottleneck is real and measured (review time up sharply as agent output rose). "Did the bet work?" is felt quarterly, not daily | [FACT] on review, [INFERENCE] on frequency |
| How is it solved today? | Code review: CodeRabbit, Greptile, Qodo, Claude Code Review, Codex, Copilot, Bugbot. Deciding and specs: Linear Agent, Rovo, Productboard Spark, ChatPRD, Anthropic's free PM plugin. Grading outcomes: experimentation tools, now owned by Datadog, OpenAI/Amplitude, Atlassian | [FACT] ([stack §C](../research/agentic-stack-and-absorption-2026-09.md)) |
| Why is that insufficient? | For review, it isn't: price is collapsing to about $1–1.50 a run. For deciding, the system of record now ships it free. For outcome grading, buyers only pay when it is attached to the system producing the data | [FACT] + [INFERENCE] |
| Nice to have or important? | **Important as a problem, a nice-to-have as a purchase.** Everyone agrees deciding is the bottleneck, which is why Linear put it in its launch post and bundled the fix | [INFERENCE] |
| Evidence anyone would pay? | **None.** Zero users, zero conversations, 0 of 25 outreach sent | [FACT] |
| Growing or disappearing? | The problem grows. Its value to a *standalone* vendor shrinks as every platform bundles an answer | [INFERENCE] |

### The assumptions that were wrong

- **[ASSUMPTION → contradicted]** That the person who suffers from the problem will buy the cure.
  The repo's own 2026-08-11 research found that forecast capture *"creates a legible record of who
  was wrong, and the people with authority to buy it are the people it exposes"*. Google's internal
  prediction markets worked and still died for that reason
  ([internal evidence §1](../research/supaprod-internal-evidence-2026-09.md)).
- **[ASSUMPTION → contradicted]** That the labs would not ship the decision layer. Anthropic's CPO
  said they would; Anthropic then open-sourced a PM plugin, and Linear shipped the thesis inside its
  own product ([stack §C](../research/agentic-stack-and-absorption-2026-09.md)).
- **[ASSUMPTION → contradicted]** That the three layers had to be one product. That turned the
  first sale into "adopt seven stations from one founder", a sale nobody makes.
- **[ASSUMPTION → contradicted]** That building more would produce evidence. 630k lines and 5,000
  commits produced one finished run, about the product's own paperwork.

---

## 2. The adversarial questions, answered

| Question from the brief | Answer |
| --- | --- |
| Are we solving the wrong problem? | **The right problem for the wrong buyer.** |
| Targeting the wrong customer? | **Yes.** A PM's tool budget is $15–50 a seat, and the platforms they already pay for bundle the feature |
| Is the market too small? | For PM tooling, analysts do not even recognise it as a market: no Magic Quadrant, no Wave ([internal evidence](../research/supaprod-internal-evidence-2026-09.md)) |
| Not painful enough? | Painful, but not painful enough to buy from a new vendor when the incumbent includes it |
| Is the timing wrong? | Late. Spring 2026 RFS asked for "Cursor for PMs"; by Fall, Linear, Atlassian and Anthropic had shipped versions |
| Already commoditised? | Code review: yes. PM agents: bundled. Decision tracking: never became a market |
| Will platforms absorb it? | **They already did** |
| Much simpler way to solve it? | Yes: the free PM plugin plus Linear Agent plus the review bot in GitHub |
| More valuable adjacent problems? | **Yes.** The same check, for a buyer the law requires to pay: §4 |
| Technically interesting, commercially weak? | **Yes.** It is the clearest description of the last three months |
| Liked but not paid for? | Untested, because nobody outside has used it |
| Fundamental reasons it should not exist? | As a standalone product, yes: every layer it sells is a feature of a system the customer already owns |

---

## 3. The market from outside, in brief

The full map is [`../research/agentic-stack-and-absorption-2026-09.md`](../research/agentic-stack-and-absorption-2026-09.md).
Three findings decide most of the call:

1. **[FACT]** The labs moved into every layer around their own agents in 2025–26: runtimes,
   sandboxes, memory, evals, spend limits, audit logs, identity hooks, vertical templates, and even
   services (Anthropic's $1.5B and OpenAI's ~$14B joint ventures).
2. **[FACT]** The middle layers are consolidating by acquisition: evals and observability (eight
   deals in 14 months), security ($250M–$915M exits), billing (Stripe–Metronome, Adyen–Orb),
   identity (~$27B).
3. **[INFERENCE, from 14 lab releases]** What the labs do **not** absorb: anything that needs
   **independence from the model vendor** (validation, certification, audit, insurance),
   **accountability for outcomes** in licensed or regulated work, and **neutral cross-vendor
   layers**, the last only for the category leader. A non-default product gets about one quarter
   after a lab ships into its space.

**B2B or B2C [FACT → INFERENCE]:** consumer AI apps retain 21% annually against 31% for non-AI apps,
and consumer-agent winners exit to labs (Manus to Meta). A solo founder with no consumer audience
should not go B2C. B2B, in a domain where he is credible.

---

## 4. Where the real opportunities are

**The pattern across both research reports:** the defensible, fundable 2026 companies are either
**agents that do regulated work with the evidence built in** (Bretton $75M, Norm Ai $1.2B,
Harvey $11B) or **independent assurance** of AI (Vals AI $40M at $400M, AIUC $40M, Lloyd's-backed
Armilla). Governance *dashboards* raise small rounds (ValidMind $11M total) because the spend is
labour, not software: US banks run about 19 model-risk FTEs per €100B of assets and lean on
consultants, and a single vendor-model validation costs $75k or more
([regulated-fs §2](../research/regulated-fs-agent-governance-2026-09.md)). Sequoia puts services at
$6 for every $1 of software.

**So the opportunity is to replace validation labour with agents and sell the finished
validation, in the domain where the founder already knows the buyer, before the rules that force
it are final.**

**Adjacent to the current product:** the same "check against a commitment made in advance",
applied to AI spend (the CFO's AI value ledger, §10 option 4). Thin.

**Unrelated to the current product but aligned to the founder:** independent validation of AI
agents in regulated finance (§10 options 1–3). Also his earlier semiconductor and space work lines
up with two Summer 2026 RFS items (§10 option 5), not researched here.

---

## 5. Continue, narrow, pivot, or stop

| | The evidence | Verdict |
| --- | --- | --- |
| **A. Continue** | Zero users after three months. Its thesis shipped free by the system of record. Code review has fallen to about $1 a run. Standalone decision tracking was never a market. The repo's own validation said on 2026-08-11 that outside evidence *"contradicts the business"*. Five programmes declined | **Rejected.** There is no evidence for it and a lot against |
| **B. Narrow** | Narrowing to "the check at Build" lands in the most crowded, fastest-deflating category in the stack. Narrowing to one ICP inside PM tooling keeps the buyer who will not pay. Narrowing to the AI value ledger is the only surviving adjacent wedge, and it is thin | **Rejected** as the main path. The value ledger stays on the list |
| **C. Pivot** | The founder's domain, one correct idea, and a buyer compelled by regulators to pay for it line up in regulated financial services. Dated rules land inside a year (India, Singapore, Canada). The labs are structurally barred from the core of it | **Recommended, conditional on the §11 test** |
| **D. Stop and restart** | True for the product: stop Supaprod. For the company, C is close to a restart. It keeps the founder, the idea and a few code patterns, but not the product, the brand or the codebase as a whole | **Stop the product now. If C fails its test, D in full** |

---

## 6. The YC rejection, read carefully

**What cannot be inferred:** the reason. YC gives no feedback by policy, and none was given
([`../pitch/yc/OUTCOME.md`](../pitch/yc/OUTCOME.md)). Four of five rejections carry no signal at
all. **Inventing a cause would be worse than recording none.**

**What the filing showed a partner [FACT]:**

- a solo founder, eleven weeks in;
- *"Are people using your product? No. Revenue? No."*;
- a one-liner of *"Cursor for PMs, the whole product org"*, which was Diana Hu's Spring 2026
  request. By the time of review, Linear and Anthropic had shipped versions of it.

**What the batches show [FACT]:**

- In W26, 11–17% of companies were solo-founded, 28% were AI-native services, and three times as
  many companies as W25 were already at $1M annualised revenue
  ([leading indicators §1](../research/leading-indicators-2026-09.md)).
- Solo acceptances skew toward visible traction.

**The reading that survives [INFERENCE]:**

- A pre-traction solo application has to substitute an exceptional insight or overwhelming
  founder-market fit for traction.
- This one had real founder-market fit and **did not use it**: the application sold a horizontal PM
  tool, not what someone who ran AI for 200 banks knows that nobody else does.
- The five rejections are consistent with "no evidence of demand". They do not show the founder is
  wrong to start a company.
- **The idea was weak on independent evidence, not because YC said no.**

**For a reapplication:** only with the new direction and paid evidence. YC's Fall 2026 list
includes *"AI-native compliance infrastructure"* for finance
([leading indicators §1](../research/leading-indicators-2026-09.md)). Chasing a published RFS is
still two moves behind, as the last filing showed. What matters is walking in with money from
customers in a category partners already want.

---

## 7. The agentic landscape: where the problems are

Full layer table: [`../research/agentic-stack-and-absorption-2026-09.md`](../research/agentic-stack-and-absorption-2026-09.md) §A.
What builders pay to fix, ranked by the strength of the evidence (§D of that file):

1. **Reliability and quality.** Strong pain, crowded supply.
2. **Cost against value.** Strong pain. Uber burned through its 2026 AI budget by April.
3. **Legacy integration.** Strong pain, but it is services work.
4. **Security and governance in regulated firms.** Real pain, small software budget.
5. **Liability and insurance.** An emerging gap that needs capital and licences.

Below those, identity, billing and durable execution are real but consolidated. Agent payments and
standalone human-approval tools show **weak demand**.

**The categories to avoid** are listed at the end of the stack report. The ones that matter here:

- generic code review;
- AI PM tooling;
- standalone decision tracking;
- runtimes, memory and sandboxes;
- identity;
- billing;
- agent payment rails;
- generic evals;
- horizontal consumer agents;
- thin vertical templates for work the labs already ship.

---

## 8. Jev, assessed after the verdict

Full file: [`../research/jev-and-laya-2026-09.md`](../research/jev-and-laya-2026-09.md).

- **[FACT]** Jev is TypeSafe's hosted model and Laya is Convai's open-source (Apache 2.0) clone,
  released three days later. Both return typed, calibrated answers for about a hundredth of the
  cost of an LLM judge.
- **It does not save Supaprod.** The product's failures are commercial, not a model cost.
- **It does strengthen the pivot as a cheap, replaceable part.** It makes it affordable to check
  every action an agent takes. Its calibrated probabilities are forecasts that can be back-tested,
  which is exactly the outcomes analysis a validator must produce. Laya's air-gapped route suits
  banks that cannot send data to a hosted API.
- **It is not a moat for anyone.** Everyone else can use it as easily as we can.

---

## 9. How this was researched

- **Two subagents, briefed adversarially.** One mapped the stack and tested the current thesis.
  The other was told to break the regulated-FS hypothesis, and it did break the broad version.
  Both reports are committed verbatim.
- **The synthesising session** researched Jev and Laya, YC's requests across three batches, SR 26-2
  and OCC 2026-13 at the primary source, Intellect's Purple Fabric, Indian law on non-competes, and
  the UK AI assurance market. It also re-read the repo's own earlier research.

**What this did not do:**

- **no customer conversations**, which is the one thing no desk research replaces;
- no production database queries (the numbers used are the last recorded ones, with their dates);
- no research on the semiconductor and space option.

---

## 10. The strongest directions

> **Options 1 to 3 were declined by the founder on 2026-09-23 (§14).** Kept as the record of what was
> evaluated and why it looked strongest on the evidence.

### Option 1 (recommended, then declined). Independent validation evidence for AI agents sold into regulated finance, vendor side first

| | |
| --- | --- |
| **Problem** | AI vendors selling agents (collections voice agents, KYC, underwriting, customer operations) into Indian banks and NBFCs face their customers' model-risk and third-party questionnaires. The RBI's 2026-06-24 draft requires the customer to validate the vendor's model independently, to get documentation and audit rights by contract, to keep kill switches on customer-facing and generative models, and to red-team generative ones ([regulated-fs §1](../research/regulated-fs-agent-governance-2026-09.md)) |
| **Target customer** | First: founders and sales leads at AI vendors selling into Indian regulated entities, who buy in weeks. Second: the risk and model-validation heads at the NBFCs and banks who receive the evidence |
| **Existing alternatives** | Vendors answer questionnaires by hand; banks use Big-4 or Solytics for validation; ValidMind (US-first, open-source Atryum), Vanta/Drata ISO 42001 modules, AIUC-1 certification, Swept AI |
| **Why they fall short** | Nobody owns agent-specific validation; the method is unsettled because US regulators declined to define it. ISO 42001 certifies a management system, not whether this agent behaves. Consultants are slow and expensive per model |
| **Why now** | The RBI draft (2026-06-24) covers GenAI with no size carve-out; MAS guidelines are due; OSFI E-23 takes effect 2027-05-01; a US RFI on agentic AI is announced. 31% of reported bank AI use cases were agentic in Q1 2026, up from 15% ([leading indicators §2](../research/leading-indicators-2026-09.md)) |
| **Technology tailwind** | Agents can now do the validator's labour (scenario generation, trace review, documentation). Lab compliance logs (Claude Compliance API, Frontier audit logs) are raw input. Jev/Laya make per-action checks cheap and produce calibrated probabilities that can be back-tested |
| **Market** | [SPECULATION, rough arithmetic, inputs stated] India alone is small: if the ~20% of ~11,000 RBI-regulated entities that use AI spend ₹5–20 lakh a year on third-party AI validation, that is roughly ₹100–450 Cr ($12–55M). The venture case is the global validation labour pool. About 19 validation FTEs per €100B of assets across ~$24T of US bank assets is on the order of 4,000 people, near $1B a year before consultants. The UK's AI assurance market alone is £1.01bn today, projected at £6.53bn by 2035 ([leading indicators §3](../research/leading-indicators-2026-09.md)). **India is the proving ground, not the company** |
| **Business model** | A fixed-fee pre-validation dossier per agent (Agent B's indicative ₹3–8 lakh, [SPECULATION]), then a monthly evidence feed as the agent changes. Later, bank-side validation priced per model. Services-as-software: agents do the work, a named human signs |
| **Competitive landscape** | ValidMind, Solytics (₹38 Cr revenue, no VC), IBM/ServiceNow (Gartner leaders), Big-4 AI assurance practices, Vals AI, AIUC, and the founder's former employer's Purple Fabric, which sells embedded governance of its own platform |
| **Defensibility** | Independence (labs and platform vendors cannot validate themselves); a clause-by-clause method mapped per jurisdiction; the record of which validated agents then behaved in production, graded over time. That record is the forecast-and-grade loop Supaprod built, finally with a buyer. Also a two-sided network: evidence produced once for a vendor gets reused across every bank it sells to |
| **Distribution challenge** | The founder is solo and has no firm behind him, and validation buyers want a credentialed firm with professional-indemnity cover. Non-solicitation terms may bar his former employer's clients. Indian contract values are low and the few accounts that matter are concentrated |
| **MVP** | **No code.** One hand-made dossier for one vendor's agent: scenario suite, captured traces, override and kill-switch tests, each RBI draft clause mapped to its evidence. Produced with Claude and the founder's judgment in a week |
| **Evidence needed before investing** | ≥3 vendors paying; ≥1 bank or NBFC risk head confirming the dossier cut their validation work; a credentialed co-founder or partner; a buyer signal from a second jurisdiction (Canada, GCC, Singapore) |
| **Main reasons it could fail** | Credibility gap; a vendor dossier ignored by the bank (the RBI says the bank validates regardless); RBI final guidance delayed or softened; low Indian ACV; the Big-4 or Solytics bundle it; small funding rounds for governance; services margins; the ex-employer overlap ([regulated-fs (c)](../research/regulated-fs-agent-governance-2026-09.md)) |

### Option 2. Validation as a service for mid-tier regulated entities (the bank side of option 1)

**What it is:** AI inventory, tiering and a gap assessment against the RBI draft, then independent
validation of their third-party agents. Sold to CROs at NBFCs, small finance banks and co-operative
banks, which have no in-house validators and get no size carve-out.

- **Competitors:** Solytics and the Big-4.
- **Why it might work:** independence is required.
- **Why it might not:** the date of the final RBI guidance is unknown, and PSU and co-operative
  buyers pay slowly.
- **Sequencing [INFERENCE]:** this is the second side of option 1, not an alternative to it. The
  vendor side proves the method fast; the bank side is where the recurring money and the network
  sit.

### Option 3. An AI-native service for one boring bank back-office process: reviewing AI vendors

**Problem:** Third-party risk teams in financial services are thin. 63% have 1–2 staff and 51%
oversee 300+ vendors ([regulated-fs §5](../research/regulated-fs-agent-governance-2026-09.md)), and
AI vendors are arriving faster than those teams can review them.

- **The service:** a per-review, outcome-priced review of AI vendors for mid-size banks and credit
  unions, possibly US-first.
- **Competitors:** existing vendor-risk services and platforms. The evidence for this option is
  weaker, and **one of Anthropic's own finance agents already targets back-office work**.
- **Why it stays on the list:** it is the US on-ramp for option 1's evidence.

### Option 4. A cross-vendor ledger of AI spend against the value promised before go-live

**What it is:** it locks the benefit each agent deployment promised, then grades spend against
results, for CFOs and AI centres of excellence. **It is the only option that reuses Supaprod's
forecast engine almost directly.**

- **Evidence for:** Uber's budget overrun and FinOps data show the pain.
- **Evidence against:**
  - Larridin raised a $17M seed for it.
  - Pendo, DX (now Atlassian), Jellyfish and the FinOps suites are close.
  - The labs shipped per-vendor spend limits.
- **Main risk:** it becomes a feature of a FinOps suite. **Thin; keep only as a fallback.**

### Option 5. Not researched: the founder's semiconductor and space background

- **[FACT]** Summer 2026's RFS listed *"Supply Chain 2.0 for Semiconductors"* (Diana Hu) and
  *"Electronics in Space"* ([leading indicators §1](../research/leading-indicators-2026-09.md)).
  The founder worked at ISRO and at Infineon.
- **[INFERENCE]** Both are capital- and team-heavy, and his most recent and deepest expertise is
  financial-services AI. It ranks below options 1–2, but it is recorded here so it is not
  forgotten. Research it only if options 1–2 fail.

---

## 11. The validation plan

> **Not run. The pivot it tests was declined on 2026-09-23 (§14).** Predictions P1 to P5 are void,
> not failed: they were never tested. The method (48-hour conversations, one hand-made deliverable,
> kill criteria, locked predictions) carries over to whatever the next search proposes.

**The rule: no product code until the one-week test passes. The deliverable is made by hand.**

### The assumptions, in order of danger

| # | Assumption | Existential? |
| --- | --- | --- |
| V1 | **The Intellect employment contract does not bar the target list** (non-solicitation, confidentiality), **and no IP assignment clause reaches Supaprod code written while employed** | **Yes. A legal gate, checked first** |
| V2 | AI vendors selling into Indian regulated entities are being asked for AI/model-risk evidence **now**, and it slows deals | **Yes** |
| V3 | They will pay an independent party for it before the RBI rule is final | **Yes** |
| V4 | Bank and NBFC risk heads will use a third-party dossier as input to their own validation | **Yes** |
| V5 | A solo founder, or one plus a credentialed partner or co-founder, is credible as the independent party | **Yes** |
| V6 | Agents can do most of the dossier work, so one takes days, not weeks | No; it decides the margin |
| V7 | The method travels to Canada, Singapore, the GCC and the EU | No; it decides venture scale |
| V8 | The labs keep partnering rather than building independent validation | No; watch it |

### The first 48 hours

1. **V1.** Read the Intellect contract. Note the non-solicitation scope, the duration, which
   clients it names, the confidentiality terms and the IP assignment clause. If unsure, get
   one hour of an employment lawyer's time. **Nothing below starts until this is known.**
2. **V2 and V3.** List 30 AI vendors that sell agents into Indian banks, NBFCs or insurers, taken
   from public case studies and industry associations. Leave off anyone the contract covers. Send
   a short message asking:
   - *"Since June, has a bank or NBFC sent you an AI or model-risk questionnaire?"*
   - *"How many hours did it take, and did it slow the deal?"*
3. **V4.** Five conversations with risk, model-validation or procurement people at banks and NBFCs
   from the founder's own network who are not his former employer's clients.

### Within one week

- At least 12 conversations in total.
- **Hand-make one dossier** for the most willing vendor.
- **Ask for money**: a paid pilot or a priced letter of intent. A number, not "interest".
- Ask two risk heads to read the dossier and say whether they would use it.

### Questions to ask

**Vendors.** Ask what they did, not what they think.

- "Walk me through your last sale to a bank or NBFC. What did their risk team ask about your AI?
  Who answered it, how long did it take, and what did it cost you?"
- "Has anything changed since June?"
- "Have you paid anyone for certification, pen tests or consultants to get through procurement?
  How much?"
- "Can you show me the questionnaire?"

**Bank and NBFC side**

- "How many AI and agent use cases are in your inventory?"
- "Who validates third-party AI today? What is in the backlog?"
- "What did the last validation cost, and how long did it take?"
- "What would you accept from a vendor as evidence?"
- "What changes for you when the RBI guidance is final?"

### Behaviour to measure

- The reply rate.
- **Questionnaires actually shared.**
- Hours and money already spent on this problem.
- Whether a vendor will hand over agent traces or sandbox access.
- Whether a risk head forwards an introduction.
- **Money or a priced LOI.**

### What counts as evidence

- **Strong:** a payment, a priced LOI, or a shared questionnaire; a vendor who says a deal is stuck
  on this; a risk head who asks to see the next dossier; someone introducing a peer without being
  asked.
- **Weak:** "interesting", "send me a deck", "come back when the RBI finalises", compliments, or
  sign-ups for a free thing.

### Kill criteria

**Stop option 1** if any of these holds after 14 days:

- fewer than 3 of 30 vendors confirm being asked since June;
- zero willingness to pay after 12 conversations;
- the risk heads say they would ignore a vendor-supplied dossier;
- the contract bars the target list.

If so, test option 2 on the same kill rule. If both fail, see §12 item 8.

### What justifies continuing

By day 14, **all** of:

- at least one paid engagement or two priced LOIs;
- one risk head who says the dossier would cut their work;
- a named candidate co-founder or partner with validation credentials.

Then, and only then, build the smallest software that makes dossier two cheaper than dossier one.

### The predictions for this test, locked

This uses Supaprod's own mechanism on this decision: **each prediction is recorded before the
result is known, and graded on the day it falls due.** Do not edit these rows. Add the result
underneath each one.

| # | Prediction | Probability | Due | Result |
| --- | --- | --- | --- | --- |
| P1 | ≥4 of 30 contacted vendors confirm being sent an AI or model-risk questionnaire by an Indian regulated customer since 2026-06-24 | 55% | 48h after outreach | — |
| P2 | ≥2 vendors share the actual questionnaire | 40% | 48h after outreach | — |
| P3 | ≥1 paid pilot or ≥2 priced LOIs within 7 days of the first conversation | 25% | day 7 | — |
| P4 | ≥2 of 5 bank or NBFC risk contacts say they would use a third-party dossier as input to their validation | 50% | day 7 | — |
| P5 | The reply rate on cold vendor outreach is ≥20% | 45% | 48h after outreach | — |

---

## 12. The recommendation, in the brief's nine questions

1. **What do we understand correctly?** Agents made building cheap, so the scarce thing is
   trusting what they produce. An independent check against a commitment made in advance is
   valuable. A vendor cannot be its own checker. Evidence discipline (a query behind every number)
   is a real strength of how this repo works.
2. **What are we probably misunderstanding?**
   - Who pays for the check: not the person it grades.
   - That the product had to be the whole lifecycle.
   - That more building, better surfaces or better positioning would create demand that was never
     tested.
   - That the founder's edge is general product judgment, when it is AI in regulated finance.
3. **The most dangerous assumptions now:**
   - that regulated buyers will accept a solo founder as the independent party;
   - that the rules arrive inside the runway;
   - that Indian contract values can fund a venture path before other jurisdictions open.
4. **The evidence still missing:**
   - any buyer conversation;
   - any price;
   - the Intellect contract terms;
   - whether a bank uses vendor evidence;
   - the RBI final date;
   - how Solytics and ValidMind respond in India.
5. **What to stop immediately:**
   - all Supaprod product work: runs, run screen, Meridian, the lanes and their queues;
   - the funding applications (571 programmes tracked);
   - brand, film and naming work;
   - positioning rewrites.

   **Also pause the autonomous engine's crons, which spend model credits every minute on a product
   with no users.** That is a founder call; the Lovable MCP can do it.
6. **What to continue:**
   - the evidence habit;
   - recording predictions before outcomes and grading them (the §11 table);
   - the founder's network in Indian financial services, used carefully.
7. **What to investigate next:** the contract first; then vendors, then risk heads, per §11.
8. **Continue, narrow, pivot, or stop?**
   - **Stop Supaprod.**
   - **Pivot the company** to independent validation of AI agents in regulated finance, vendor side
     first, on a two-week test.
   - **If both options 1 and 2 fail their kill rule, stop fully.** Then choose between researching
     option 5, taking option 4 as a small bootstrapped business, or joining a team in this space to
     learn it from inside with a salary. That is not a failure: fourteen days of conversations cost
     less than one more week of building.
9. **The fastest way to find out if this is right:** thirty messages and five phone calls in 48
   hours, then one hand-made dossier and one request for money within a week. **Nothing here needs
   code.**

---

## 13. What happens to the codebase

- **Freeze it, do not delete it.** The public site can stay up. The private repo stays as it is.
- **What is worth carrying later, as patterns in a new small repo, only after §11 passes**
  ([internal evidence §3](../research/supaprod-internal-evidence-2026-09.md)):
  - the single model-call chokepoint with per-call event logging (`src/lib/ai/runtime.server.ts`);
  - the write-once forecast and verdict triggers;
  - the audit lineage from decision to evidence;
  - the independent verifier-seat pattern.

  Each is what a validator needs to evidence.
- **What is not carried:** the 630k lines, the lifecycle stations, the run screen, Meridian, the
  brand. They answer a question the new direction does not ask.
- **Check V1 before reusing any of it.** If an IP assignment clause reaches code written while
  employed, only the ideas travel, not the code.

---

## 14. The founder's ruling, 2026-09-23 18:17 IST

**Accepted: stop Supaprod.** *"One thing I understood is that whatever we are building is not the right thing, so we need to stop it. I'm good with that. Let's think about what we need to build."* Recorded as [R-42](../../the-first-run/RULINGS.md).

**Declined: the finance-validation pivot.** *"I'm not really sure why you picked up the finance part and want to correlate it with what I'm working on with my ex-employer. I really do not want to operate as a service company or something particular to particular work. I want to work on something where the possibilities are there, opportunities are huge, and untapped potential is there, and so on."*

**Why this file recommended finance in the first place, so the next search does not repeat it.** The
founder's 17:27 message asked to focus *"on any area where our expertise comes from"*, and his
deepest recent expertise is the AI platform at his former employer. The research then showed the
layer labs cannot absorb is independence and accountability, which in finance is validation. That
reasoning was sound on its inputs. **The ruling adds three inputs it did not have:** no services
company, nothing tied to one particular kind of work, and nothing correlated with his former
employer's domain. Expertise is an advantage to use where it helps, not a domain to stay inside.

### The constraints the next search runs under

| # | Constraint | Source |
| --- | --- | --- |
| 1 | A frontier model or vertical release must not eliminate it | Founder, 17:27 |
| 2 | Huge, untapped opportunity; possibilities, not a niche | Founder, 18:17 |
| 3 | A product company, not a services company | Founder, 18:17 |
| 4 | Not particular to one narrow kind of work | Founder, 18:17 |
| 5 | Not in or correlated with his former employer's domain (financial-services AI) | Founder, 18:17 |
| 6 | Provable fast enough to raise; open to investors | Founder, 17:27 |
| 7 | B2B or B2C both open; the evidence so far favours B2B for a solo founder with no consumer audience | Founder, 17:27, and [stack §F](../research/agentic-stack-and-absorption-2026-09.md) |

### The tension the next search has to resolve, stated now

**[INFERENCE]** The research found three things labs do not absorb: independence from the model
vendor, accountability for outcomes in regulated work, and neutral cross-vendor layers (for the
category leader only) ([stack §B](../research/agentic-stack-and-absorption-2026-09.md)). The first
two tend to be services-shaped, which constraint 3 rules out. **So the next direction has to get its
protection from a source this reset did not examine:** a proprietary data asset or network effect
that compounds with use, a system of record the labs do not own, a hard physical-world or hardware
component, or distribution the labs cannot reach. Constraint 2 (huge) and the earlier "boring, few
players" can both hold; they cannot hold for a category the labs' own releases already describe.

### What carries forward

- All five research files stand as evidence. The categories to avoid in
  [stack, "Categories to avoid"](../research/agentic-stack-and-absorption-2026-09.md) still apply.
- The validation method in §11 carries over. Its specific test does not.
- Nothing in the codebase carries over until a new direction passes its own test.

