# The direction search: what to build after Supaprod

> _Created: 2026-09-28 · Last updated: 2026-09-28_

**Status: the analysis is complete and the direction is CHOSEN BUT NOT VALIDATED.** The founder
steered toward the supply side of the agent wave on 2026-09-28 ([R-43](../../the-first-run/RULINGS.md));
§5's ten-day test has not been run, no code has been written, and nothing below licenses building.

**What this file is.** The second half of [R-42](../../the-first-run/RULINGS.md). The
[strategy reset](./strategy-reset-2026-09.md) stopped Supaprod and had its recommended pivot
declined; its §14 left seven constraints and an unresolved tension. This file runs that search and
answers it. The fresh evidence is
[`../research/consumer-surface-and-agent-supply-side-2026-09.md`](../research/consumer-surface-and-agent-supply-side-2026-09.md),
which closes three gaps the reset corpus named in itself and never filled.

Labels: **[FACT]** has a source and a date, **[INFERENCE]** is ours, **[SPECULATION]** says so.

---

## 0. The call

1. **The thesis failed, but the thesis was the second problem.** The first was that nobody outside
   was ever asked. Zero customer interviews, 0 of 25 design partners contacted, no waitlist, four
   real identities, no human sign-in since 2026-07-19, five framings in ten weeks and none tested.
   **[INFERENCE] A different idea run the same way fails the same way.** Everything in §5 exists to
   make that structurally impossible this time.
2. **Be horizontal in surface. Never horizontal in function.** This is the one durable rule the
   research produced, and it resolves the reset's §14 tension between "huge and industry-agnostic"
   and "a frontier release must not eliminate it". Wispr is industry-agnostic because it is an input
   method living in every app except the lab's own. Jasper was horizontal in function and went from
   about $120M to $55M. ([research §2, §4](../research/consumer-surface-and-agent-supply-side-2026-09.md))
3. **The direction is the supply side of the consumer-agent wave.** Meta shipped a horizontal
   personal agent on **2026-09-08** that fills forms, books and negotiates, and it was the **number
   one free US iOS app by 2026-09-18** with 2.5M+ downloads in thirteen days. Every standard built
   for that wave — UCP, ACP, AP2 — assumes a **SKU, a cart and a price**. None of them expresses
   *book, hold, reschedule, quote, qualify, apply, enrol*. **The catalog half is contested by giants.
   The service half has no owner.**
4. **But do not sell the wave. Sell the enquiry the business is losing tonight.** The same gap that
   will cost a business agent bookings in 2027 is costing it human enquiries today, and there is a
   priced, funded, proven market for the second one — SMB voice agents at **$0.07–0.33 a minute** and
   from **$29.99/month**, with **Newo.ai raising $25M** for it. "Your traffic will rise" is
   unfalsifiable in a fortnight. "Here are nine enquiries you did not lose" is a number the owner can
   check.
5. **Nothing is built until §5 passes.** Ten days, no product code, a hand-run service for five
   businesses, and two of them paying. Kill criteria and locked predictions are in §5.

---

## 1. Verdict on the Supaprod thesis

**The problem was real. The shape was not a business. The procedure was the actual failure.**

Real: agents made building cheap, so judgment and verification became scarce. Linear's own launch
post (2026-03-24) says the bottleneck moves to deciding what to build; Miro bought Reforge on that
reasoning the same month.

Not a business: universal agreement is what makes something a feature. Linear Agent ships on every
plan; Atlassian's Product Collection landed 2026-05-06; Anthropic open-sourced a free PM plugin;
Notion shipped Ship OS free on 2026-07-09. There is **no Gartner Magic Quadrant and no Forrester Wave
for product management software at all** — analysts do not recognise the buyer as a buying decision
([market-validation §8.2](../research/market-validation-2026-08.md)).

The moat inverted on inspection: a forecast recorded before the outcome creates a legible record of
who was wrong, and the people with budget are the people it exposes. Google's internal prediction
markets beat expert forecasts and died anyway ([market-validation §8.5](../research/market-validation-2026-08.md)).

**The three layers were architecture, not need.** They made the first sale "adopt seven stations from
a solo founder". The audit is unambiguous: one run ever walked the whole loop and its forecast was
about Supaprod's own paperwork; 45 of 60 tracks abandoned; 38 never left the first station; zero
forecasts graded for a real user; Ship never fired outside a sample workspace
([A1-REPORT §1.2](../../the-first-run/A1-REPORT.md)).

**And the decisive finding predated the reset by six weeks.** On 2026-08-11 the repo's own validation
concluded outside evidence *"contradicts the business"*. Building continued for six weeks. That is
the procedural failure in one sentence.

---

## 2. Why the accelerators said no

**No programme gave a reason and none may be invented** — the standing rule from
[`../pitch/applications/README.md`](../pitch/applications/README.md) holds. But six facts about what
was filed are on the record, each independently disqualifying at a written screen:

| # | Fact | Source |
| --- | --- | --- |
| 1 | **No users, no revenue, no conversations, no waitlist.** Hub71's letter — the only one naming criteria — listed *evidence the solution is effective and scales* and *demonstrated progress* as what the shortlisted startups had | [`../pitch/applications/hub71/OUTCOME.md`](../pitch/applications/hub71/OUTCOME.md) |
| 2 | **The first thing a YC reader saw was a phrase the company had banned.** The locked 50-character field reads *"Cursor for PMs, the whole product org."* — retired from the landing page 2026-07-15, filed to YC 2026-07-23, uneditable | [`../pitch/yc/OUTCOME.md`](../pitch/yc/OUTCOME.md) |
| 3 | **Field 7d carried an 11:46 demo video**, against the file's own note that partners watch 60–90 seconds. The 2:22 film shipped 2026-08-12, seventeen days before the decision, with no record of a swap | [`../pitch/yc/APPLICATION-FINAL.md`](../pitch/yc/APPLICATION-FINAL.md):552 |
| 4 | **Filed under a company name that no longer exists** (Cadence) | [`../pitch/yc/OUTCOME.md`](../pitch/yc/OUTCOME.md) |
| 5 | **Three product metrics presented as proof were seed data**, found by the repo's own audit after filing | [`../pitch/verified-numbers.md`](../pitch/verified-numbers.md) |
| 6 | **Seven external one-liners between 2026-07-10 and 2026-08-17.** A partner has to be able to repeat the sentence to another partner | [`../pitch/one-pager.md`](../pitch/one-pager.md), [`../pitch/README.md`](../pitch/README.md) |

Three structural points on top, all **[INFERENCE]**:

- **The idea chased a published request from two batches earlier.** "Cursor for PMs" was Diana Hu's
  Spring 2026 ask; by review, Linear, Atlassian and Anthropic had shipped versions. An RFS is a
  lagging signal for the idea and a leading one for attention
  ([leading-indicators §1](../research/leading-indicators-2026-09.md)).
- **Real founder-market fit was on the form and unused.** The AI platform 200+ financial institutions
  build on sat in field 9a while the application sold a horizontal PM tool.
- **No application was ever read by a human outside the founder.** The pressure test used three
  *simulated* readers, and on 2026-08-13 all three scored a fabricated sentence strongest in its
  field. The harness was added after five filings had gone out.

**[FACT]** For calibration: 571 programmes tracked, 9 filed, 6 decided, 6 noes, **0 interviews
reached**. Series A now starts nearer **$3–5M ARR** than $1–2M. Roughly **10% of YC companies are
solo-founded** and are held to a higher bar. **YC W27 closes 2026-11-02 8pm PT, decisions by
2026-12-11.**

**Ruling that follows: no further applications until a stranger has paid.** Applications were never
the constraint; evidence was.

---

## 3. The three directions that survived

Scored against the reset's §14 constraints: (1) a frontier release must not eliminate it, (2) huge
and untapped, (3) product not services, (4) not narrow, (5) not the ex-employer's domain,
(6) provable fast enough to raise, (7) B2B or B2C open.

### A. One gesture, every app — a prosumer surface layer

**Who:** an individual professional paying $15–30/month on a card. Industry-agnostic because it is a
surface. **Light surface / heavy engine:** one keystroke, something correct lands in the app you were
already in, nothing shown. Underneath: a sub-second latency budget, accuracy that makes zero edits
the default, per-user learning that becomes a switching cost. **Lab-proof because** they optimise
their own conversational surface; this lives in every surface except theirs. **Evidence:** Wispr at
$2B on 150%+ quarterly growth; Granola $1.5B; Gamma $100M ARR; ChatPRD solo and unfunded at 100k
users. **Fails if** the gesture is guessed rather than observed — which is the Supaprod failure mode
exactly. **Not chosen**, and the reason is honest: the specific gesture is unknown, and choosing one
from desk research repeats the mistake.

### B. The supply side of the agent wave — make service businesses answerable and bookable *(CHOSEN)*

**Who:** businesses whose funnel is a booking, quote, application or eligibility check rather than a
SKU. Clinics, driving schools, physiotherapy, tutoring, trades, salons, veterinary, repair. One
buyer: the owner. **It is B2B.** The consumer benefits and never pays.

**The asset:** the business's **answerable, bookable core** — real offerings, real prices, live
availability, policies, eligibility — assembled once from what they already have, and served to every
channel that asks: a human in web chat, a WhatsApp message, **a phone call**, and an agent over
MCP/UCP.

**Light surface:** the owner connects a number and a calendar and corrects one generated draft. Then
a weekly line: *nine enquiries arrived outside your hours, four are now appointments.* **Heavy
engine:** generating the core without a human on our side, keeping availability truthful, never
asserting a price it cannot support, escalating cleanly, and telling a delegated agent apart from
fraud automation.

**Lab-proof because** the labs build the *asker*. Muse needs a supply side and will not become the
authoritative record of a million small businesses' prices and availability. **Giants nearby but not
on it:** Cloudflare owns measurement and network access (isitagentready April 2026, AEO dashboard
2026-08-06); Shopify and Google own catalog discovery; Stripe/Visa/Mastercard own payment; Okta and
Microsoft own delegation. **None holds live availability or carries the booking.**

**Compounding:** every conversation corrects the core and records which answers converted, and a
verified index of transactable businesses is what every consumer agent needs — routing leverage
later, option value now, **not a revenue plan**.

**Chosen because** the pain is measurable in someone else's data rather than in an opinion. You can
phone twenty businesses tonight and count who fails to answer. That is the property Supaprod never
had.

### C. Voice-first AI for the users the labs' distribution cannot reach *(the bigger swing, parked)*

**[FACT]** India passed 900M internet users; the Google-KPMG work projected nine of ten new users
preferring an Indian language; vernacular voice queries grew about **156%** against English in early
2026 ([Haptik](https://www.haptik.ai/blog/vernacular-voice-ai-for-tier-2-tier-3-india)). Labs are
English-first, app-first, card-first. **Parked because** monetisation at that ARPU is unproven here,
the enterprise side is crowded (Sarvam, Gnani, Haptik, Yellow.ai, Uniphore, Mihup), and constraint 6
(provable fast enough to raise) is the weakest link. **It is the most interesting long-term market in
this file and it should be revisited if B fails its test.**

---

## 4. The pain point, and the four corrections the first framing needs

### 4.1 The pain, in the owner's words

Not "I am not AI-ready". This:

> **Someone wanted to give me money and I was not there to take it.**

An enquiry arrived — 8:40pm, or on WhatsApp, or through a form nobody checks — and nobody answered,
so it went to whoever answered first.

**Why this pain and not Supaprod's [INFERENCE], point by point against what failed:**

| Property | This | Supaprod |
| --- | --- | --- |
| Felt how often | **Daily** | Quarterly, which alone made it unbuyable |
| Countable | **Yes** — missed calls are a log | No. "Did the bet work" has no counter |
| Already believed by the buyer | **Yes**, no education needed | Required adopting seven stations and a worldview |
| Already has a price | **Yes.** $29.99–$300/month and $0.07–0.33 a minute, with Newo.ai raising $25M on it | None. Zero evidence anyone would pay, ever |

**And the sentence that makes it a company rather than a utility:**

> **A human who cannot reach you calls back. An agent just books your competitor.**

**[FACT]** Muse was the number one free US iOS app ten days after launch with 2.5M+ downloads in
thirteen days. **[INFERENCE]** It does not hold, does not leave a message and does not call back; it
moves to the next business. So "no answer" stops being a delayed sale and becomes an instant,
invisible, permanent loss. The same gap, revalued by an order of magnitude, on a timer.

### 4.2 Why they cannot answer, which is the actual product insight

**It is not that nobody is at the desk. It is that the answer does not exist anywhere a machine can
reach it.** The price is in the owner's head. Availability is in a paper diary or one person's
calendar. The policy is "it depends". Eligibility is a judgment. **That is why website chatbots are
useless here, and why an AI receptionist that only takes a message is half a product.**

So what gets built, deliberately **not** described as layers:

- **One asset — the answerable core.** What you sell, what it actually costs, when you are genuinely
  free, what you will not do, who you cannot serve.
- **One surface.** Whoever asks gets a real answer and can commit: phone, WhatsApp, web, and later an
  agent over MCP/UCP. **Same core, no second build.**
- **One number.** Enquiries recovered, named and timestamped. *Nine arrived outside your hours, four
  are now appointments.*

The engine underneath is hard where it matters: generating the core with no human of ours, keeping
availability truthful, never asserting a price it cannot support, escalating cleanly, and telling a
delegated agent apart from fraud traffic.

**Three things this is not, and each one is a way to lose:**

1. **It is B2B.** The business pays; the consumer benefits and never pays. "B2B and B2C and everyone"
   conflates one user in two contexts (Wispr) with two buyers (this), and saying it in a pitch costs
   the pitch.
2. **It is not also direction A.** Choosing this drops the prosumer surface layer. Different buyer,
   different distribution, different company.
3. **It must not be another AI receptionist.** That category is crowded and the price war is on voice
   quality. The sentence that has to stay true: **an AI receptionist answers your phone; this makes
   your business answerable.** The phone is a channel. The core is the asset. If the product cannot
   hold that distinction, do not start.

### 4.3 The four corrections

The founder's proposal, verbatim in substance: *a platform where small and medium businesses from any
industry onboard, we make them AI-transformation-ready and ready for AI bots so their traffic and
revenue go up, small subscription, two-week free trial.*

The wave is right. Four things in the framing are wrong, and each has a named fix.

| Problem | Why it is fatal | The fix |
| --- | --- | --- |
| **"AI-ready" is a promise, not a product** | Dozens of AI-visibility tools sell it, and **Cloudflare gives the scanner away free** while sitting in front of ~a fifth of the web. Competing scores already disagree wildly | Sell a **completed transaction**, not a readiness score. Use a free scan only as the front door |
| **"Traffic and revenue go up" is unattributable in two weeks** | The documented pattern is **known but not recommended**; being mentioned earns nothing. Unattributable value is the first thing an SMB cancels | Report **recovered enquiries, named and timestamped**, with the booking attached |
| **Horizontal in function** | Growth and marketing is a function the labs and Google already occupy. §0 item 2 forbids it | Horizontal in **surface**: one always-on answering-and-booking endpoint that serves a dentist and a driving school identically |
| **"Any industry, any domain" on day one** | No depth anywhere, and an engine good at nothing | **Horizontal product, vertical go-to-market, one category at a time.** The surface is general; the first hundred customers are not |

**And one rule that decides whether this is a company or an agency:** onboarding must be automated.
If generating the core needs a human of ours per business, it is a services business, which
constraint 3 forbids and which the founder explicitly declined.

### 4.4 The build sequence, if the test passes

**[INFERENCE]** Sequencing matters more than the plan, because the failure mode here is building.

1. **v1 is one category, one city, one channel, ten customers** — the after-hours phone call and
   WhatsApp message for one kind of appointment business. Highest intent, trivially measurable, already
   priced, and it forces the core into existence because you cannot answer "how much" without a price
   or "when" without availability.
2. **Build those first ten cores by hand.** You cannot automate generating a thing whose shape you
   have not learned. This is the one place manual work is correct rather than a warning sign.
3. **The gate that turns this from an agency into a company:** a core generated in **under 30 minutes
   with no human of ours**. That is the milestone to raise on, not the first ten customers.
4. **Explicitly not in v1:** the agent endpoint, the visibility scan, multiple channels, multiple
   industries, a dashboard. The scan becomes the free front door for acquisition, later.

**Choosing the category is the founder's call, on five criteria:** high value per booking (one
recovered job pays for a year), appointment-based (availability is the constraint), owner-operated
(one call, no procurement), dense enough to reach twenty in a day, and — the real constraint — **he
can actually reach the owners**. Candidates: dental, physiotherapy, veterinary, driving schools,
aesthetics, home services, tutoring centres.

**Geography:** test where twenty owners can be reached this week, which is India, and price for the
US. **[FACT]** Indian ARPU is roughly an order of magnitude lower. **Do not let the test location
become the market decision.**

---

## 5. The test. Ten days, no product code.

**The rule: nothing is built until a stranger has paid for work done by hand.** This exists because
630,000 lines produced one finished run and zero users.

**Days 1–2 · measure the pain in their data, not their opinion.** Pick one dense category the founder
can physically reach twenty of. Phone all twenty **as a customer**, once inside hours and once
outside. Record four things: did anyone answer, how long it took, could you get a price, could you
book. No product talk. Cost: a phone.

**Days 3–5 · go back as a founder, with their own number.** *"I called at 7:40pm on Tuesday, nobody
answered, and here is what I wanted to book."* Ask what a missed job is worth and what they pay today
for anything that touches it.

**Days 6–8 · be the product by hand.** For the five most willing, forward the after-hours line and
WhatsApp to the founder and answer **as the business** for 48 hours, from their own price list, into
their own calendar. Wizard of Oz. No code.

**Days 9–10 · ask for money, and count the wave separately.** A price, today, on a card or UPI. In
parallel, ask ten businesses for 30 days of web and call logs and count agent-originated requests —
this is the only way to test whether the service half of the wave has started, since Adobe's data
covers retail and travel, never a clinic.

### Kill criteria

- Fewer than 12 of 20 fail to answer or cannot give a price → **the pain is not there.** Go to A.
- Zero of 5 pay after the founder personally recovered their bookings → **wrong buyer or wrong
  price.**
- **No owner will forward a line or connect a calendar → existential.** The whole model dies at the
  consent step, and it dies cheaply, on day 8.

### Continue criteria — all three

- **≥2 paying**, cash collected, not promised.
- **≥1 recovered booking with a value the owner confirms out loud.**
- **≥1 owner asks what happens when an AI assistant calls**, unprompted.

### The predictions, locked before the answers are known

Graded on the day they fall due. Do not edit a row; add the result beneath it.

| # | Prediction | Probability | Due | Result |
| --- | --- | --- | --- | --- |
| P1 | ≥12 of 20 businesses fail to answer, or cannot quote a price, on an out-of-hours call | 70% | day 2 | — |
| P2 | ≥10 of 20 owners take a follow-up call when shown their own missed enquiry | 50% | day 5 | — |
| P3 | ≥3 of 5 owners will forward a line or connect a calendar to a stranger | 35% | day 8 | — |
| P4 | ≥2 paying customers by day 10 | 30% | day 10 | — |
| P5 | ≥2 of 10 businesses show ≥20 agent-originated requests in 30 days of logs | 40% | day 10 | — |

**[INFERENCE] P3 is the one to watch.** P1 is nearly certain and proves only that the pain exists.
P3 is the first moment a stranger gives up something that costs them, and it is the earliest honest
signal in the whole plan.

---

## 6. Monetisation, and the pipeline behind it

**[SPECULATION] on every number below; all of it is untested and the arithmetic is stated so it can be
checked.**

- **Land:** flat monthly for one location, inside the band the category has already established
  ($29–79, or ₹999–2,499). The trial is *"we answer for fourteen days; you pay if we recovered
  anything"* — falsifiable, unlike a free scan.
- **Usage above a bundle:** the phone channel settled at $0.07–0.33 a minute all-in, so an included
  allowance plus overage carries margin without a second pricing model.
- **Expand:** multi-location, then per-location. This is where ACV moves from $50 to $500+ and it is
  the only expansion path that does not require a new product.
- **The option, not the plan:** once thousands of businesses hold a verified, live, machine-readable
  core, the demand side — assistants, agents, aggregators — is the counterparty. **No revenue is
  forecast on this.** It is what makes the story venture-shaped rather than a small SaaS, and it is
  the moat sentence that survives a query: *a system of record the labs do not own, in a two-sided
  market they need and will not build.*

---

## 7. What is kept from Supaprod, and what is dropped

**Kept.**

| Asset | Where | Why it travels |
| --- | --- | --- |
| **The evidence discipline** | this folder's habits | A query or a `file:line` behind every claim. Genuinely rare, and the only reason this document could be written. It is also what diligence rewards |
| **Locked predictions, graded on the date** | §5 above | The one mechanism from the product worth keeping, pointed for the first time at something real |
| **The single model-call chokepoint, as a pattern** | `src/lib/ai/runtime.server.ts` (2,961 lines) | One function seeing every call makes an unbudgeted call a type error. Worth ~200 lines in a new repo, not 2,961 |
| **RLS keyed on membership in the database** | `supabase/migrations/**` | Tenancy enforced below the application. Correct instinct, cheap to rebuild |
| **OAuth connectors with per-tenant encrypted secrets; sandbox-with-redaction** | `src/lib/**connector*` | Reference material for the same problem in a new shape |

**Dropped.** The 630,000 lines, 634 migrations, seven stations, the run screen, Meridian, the brand,
the three-layer framing, the pricing architecture, the 571-programme funding pipeline, the five
competing queues, and the ~33,000 lines of audit documentation in `the-first-run/`. Freeze, do not
delete, do not port. **Also dropped: the instruction that the agent's work must be shown**
([`../conventions/the-bar.md`](../conventions/the-bar.md) §4) — it is the largest single source of the
heaviness the founder is now trying to escape, and it is incompatible with a light surface.

**Stopped, 2026-09-28.** The scheduled fleet. 36 HTTP tick jobs plus two more, four of them firing
every minute or two, POSTing hooks that reach the model chokepoint for a product with no users.
Migration: `supabase/migrations/20260928120000_the_engine_stops_because_nobody_is_using_it.sql`, with
the exact reversal in its header.

---

## 8. What would change this verdict

- **P3 fails and no owner will connect anything** → B is dead at the consent step; go to A with the
  ten-day observation method in §3.
- **P5 comes back at zero across twenty businesses** → the wave has not reached service businesses.
  B survives on the phone channel alone, which makes it a good SMB SaaS and not a venture case. Say
  so rather than repricing the story.
- **Cloudflare, Shopify or Google ships availability and booking for service businesses** → the
  unclaimed asset is claimed. A non-leader has about a quarter
  ([stack §B](../research/agentic-stack-and-absorption-2026-09.md)). Re-check monthly.
- **Onboarding cannot be automated** → it is an agency. Stop.

## Related

- [`strategy-reset-2026-09.md`](./strategy-reset-2026-09.md) — the first half: why Supaprod stopped, and §14's constraints this file answers
- [`../research/consumer-surface-and-agent-supply-side-2026-09.md`](../research/consumer-surface-and-agent-supply-side-2026-09.md) — the fresh evidence, with every source and date
- [`../../the-first-run/RULINGS.md`](../../the-first-run/RULINGS.md) — R-42 and R-43
