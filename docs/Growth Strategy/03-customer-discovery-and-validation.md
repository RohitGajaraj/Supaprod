# 03 — Customer discovery & validation system

> _Created: 2026-07-12 (GTM launch operating manual, section 3). Owner: founder + GTM lane._
> _Builds ON [`../pitch/design-partner-kit.md`](../pitch/design-partner-kit.md) (the 25-target cohort + outreach templates + weekly ritual — never duplicated here, always referenced) and executes the v13 ground-truth mandate: **every beta first-session doubles as a discovery interview.** Pricing facts from [`../strategy/pricing/pricing-architecture.md`](../strategy/pricing/pricing-architecture.md) (Free / Pro $20 / Team $50 / Enterprise; credits, not seats)._
> _Standing rule (binding): **nothing outward sends without founder approval, per message.** Every template below is a draft until the founder reads, edits, and sends it._

**Contents:** [1. ICP](#1-icp-who-feels-this-worst) · [2. Segments](#2-segmentation-with-pain-hypotheses) · [3. Prospect sourcing](#3-prospect-sourcing-200-500-named-prospects) · [4. Cold outreach](#4-the-cold-outreach-system) · [5. Warm intros](#5-manufacturing-warm-intros) · [6. Pipeline](#6-founder-led-sales-pipeline) · [7. Interviews](#7-the-interview-framework-the-30-minute-beta-first-session) · [8. Problem scorecard](#8-problem-validation-scorecard) · [9. Pricing & WTP](#9-pricing-validation--willingness-to-pay) · [10. Concierge MVP](#10-the-concierge-mvp-run-supaprod-for-them) · [11. Design partners](#11-design-partner-program-pc-13) · [12. Advisory group](#12-customer-advisory-group) · [13. The capture system](#13-the-capture-system-every-interaction-becomes-a-product-decision) · [14. Buyer-likelihood rubric](#14-the-paying-user-likelihood-rubric) · [15. The 7-day cut](#15-what-happens-in-the-first-7-days)

---

## 1. ICP: who feels this worst

**Primary wedge ICP (the one we sell to first):** the **senior or founding PM at a seed-to-Series-B startup who has already tried to hand-build their own AI product rig** (Claude Code + MCP + notes-as-memory) or watched a peer do it. Proof this person exists in volume: the year's top r/ProductManagement post (838 points) is literally a build-log of Supaprod's shape, and its 223 commenters are the first outreach cohort ([design-partner-kit](../pitch/design-partner-kit.md)).

**Why this exact person (the tiebreakers — apply in order when choosing who to pursue):**

| Tiebreaker | Test | Why it predicts pain |
| --- | --- | --- |
| T1: Already spent hours on a DIY rig, or publicly wished for one | Their own post/comment history | They have pre-validated the problem with their own time. No education needed; the sale is "same idea, none of the plumbing." |
| T2: Owns outcomes alone or near-alone (PM:eng ratio 1:8+) | Ask in first reply, or team page | Solo accountability = the "why did we decide X" excavation lands on them personally. |
| T3: Startup stage seed to Series B | Company stage | Big-co PMs hit procurement/security walls (a later segment); pre-seed founders often have no product surface yet. Seed to B has real signal volume AND freedom to adopt. |
| T4: Tool sprawl of 5+ sources (Slack, Linear/Jira, Notion, analytics, support) | Ask; usually volunteered | The glue-cost pain scales with seams. Fewer than 4 tools = pain below purchase threshold. |
| T5: Has shipped something that failed quietly in the last 2 quarters | Surfaces in interview Q3 | The outcome-ledger pitch only lands on someone who has recently felt "nobody checked if the call was right." |

A prospect matching T1+T2 is worth ten who match only T3. **Rank every list by T1 first.**

## 2. Segmentation with pain hypotheses

Four segments, each with a falsifiable pain hypothesis, ordered by expected willingness to pay. Validation status uses the claim discipline: what we KNOW vs what we're testing.

| # | Segment | Pain hypothesis (falsifiable) | Evidence today | WTP guess | Kill signal |
| --- | --- | --- | --- | --- | --- |
| S1 | **DIY-builder PM** (built or started a Claude Code/MCP rig) | "Maintaining my hand-rolled rig costs me 2+ hrs/week and my team can't share it." | PROVEN demand shape: the 838-pt thread; commenters describing upkeep pain | High — already pays in time; Pro/Team fast | They say the rig IS the fun part (hobbyist, not buyer) |
| S2 | **Wants-the-outcome PM** (saw the thread, said "out of my wheelhouse") | "I want signal-to-decision leverage but will not touch a terminal or MCP config." | PROVEN: multiple verbatim comments in the same thread | Medium-high — cleanest product-shaped buyer | They won't connect a single real tool (fear/IT) |
| S3 | **Governance-blocked PM** (enterprise; Claude Code failed security review) | "I'm blocked at the IT layer, and an auditable, scoped, receipts-first layer would pass where raw agents fail." | PROVEN pain, WIRING for us as the answer (needs SSO/DPA maturity we price at Enterprise) | High later, slow now | Procurement cycle > 60 days (park for post-launch) |
| S4 | **Product engineer / solo founder** (one person = whole product org) | "I ship fast with Cursor but decide alone with nothing; a decision layer with receipts is my missing co-founder." | Directional: the PM:eng inversion trend; needs interview confirmation | Medium — price-sensitive but fast to close | They only want build tooling, not decisions |

**Discovery quota per segment for the beta wave: S1×10, S2×8, S3×3 (interview only, do not onboard yet), S4×4.** The quota forces us to learn where pain is worst instead of onboarding whoever is easiest.

## 3. Prospect sourcing: 200-500 named prospects

Wave 1 exists and is done: **25 verified targets** in the [design-partner kit](../pitch/design-partner-kit.md) (24 sendable + 1 design-twin). Waves 2-4 get us to 200-500 without violating the kit's privacy discipline (no cross-source identity compilation; contact people on the channel where they surfaced).

| Wave | Method | Target count | Effort | Why it works | Next action |
| --- | --- | --- | --- | --- | --- |
| W2: More build-log threads | Search Reddit (r/ProductManagement, r/prodmgmt, r/UXDesign, r/SaaS), HN comments, and X for "Claude Code PM", "MCP product manager", "AI product workflow" posts from the last 6 months; harvest engaged commenters exactly like the kit did | +75-125 | 2-3 hrs with the HyperAgent rig (PC-26, its designated use) | Same receipts-first quality as Wave 1: every name comes with their own words as the personalization hook | Run the rig day 1; founder approves the harvested list before any drafting |
| W3: Public pain-posters on LinkedIn/X | People who posted (not liked — posted) about roadmap chaos, PRD drudgery, "three versions of the same roadmap", AI tool sprawl in the last 90 days | +50-100 | 30 min/day of founder scroll + save; rig-assisted search | Self-identified pain, contactable on the platform they posted on | Start a saved list day 1; 10 adds/day |
| W4: YC + recently-funded directories | YC startup directory (filter: B2B SaaS, 11-50 headcount) + last-6-months seed/Series-A announcements; identify the product person from the company site/launch post only | +100-200 | 3-4 hrs, rig-assisted | T3 stage filter built in; funded teams have budget and urgency | Build day 2-3; this is the EMAIL list (company emails are fair game where published) |
| W5: Community members | Lenny's community, Mind the Product Slack, Product-Led Alliance, AI tinkerers meetups — participate first, DM only people you've genuinely interacted with | +25-50 over weeks | Ongoing | Highest trust, slowest; violating community self-promo norms would burn the channel | Join day 1, first genuine (non-promotional) contribution day 2 |

**Success metric:** 250+ named prospects with a personalization hook each by day 5. **Not** a scraped CSV — a name without their own words attached is below the send bar.

## 4. The cold outreach system

The kit's Templates A/B/C cover the Reddit cohort. This section adds the **email sequence for Wave 4** (company-email prospects) and the operating rules for all channels.

**Operating rules (binding):**

1. Founder sends everything; 25/day max total across channels (deliverability + quality both cap there anyway).
2. One personalized first line minimum, drawn from something THEY wrote. No fake "loved your recent post" filler.
3. No links in the first message on Reddit/LinkedIn (reads as spam). Email may carry one link (the no-signup demo, once PC-04 is live).
4. One soft bump after 5 days. Then stop. This audience punishes pushiness publicly.
5. New-domain email warm-up reality: if sending from a fresh domain, cap at 10-15/day week one or use the founder's existing personal domain. A burned domain the week before launch is a self-inflicted wound.

**Wave-4 email sequence (drafts — founder edits and sends):**

Email 1, subject options (pick per prospect, all under 6 words):

```
the "why did we decide X" problem
your roadmap vs what shipped
agents for the decision, not the code
```

Email 1 body:

```
Hi [name],

[One specific line about their company or something they shipped, from
their own site or launch post. Real, not flattery.]

Quick question: when your team ships something, does anyone go back and
check whether the call behind it was right?

I built Supaprod because that answer is almost always no. Agents run the
product loop end to end (signals in, ranked bets, specs, a PR out) and an
outcome ledger records what worked, so the next call is smarter than the
last one.

We're opening a small beta before the public launch. 15 minutes, I show
you the live thing on real data, you tell me where it breaks. Interested?

[founder name]
```

Bump (day 5, only once):

```
Hi [name], floating this once more before we close the beta group.
If the timing is wrong, a plain "not now" is a totally fine answer.
```

**Realistic expectations (set now so week-1 numbers read correctly):** founder-led, well-personalized cold email to a warm-ish ICP runs 5-15% reply, 2-5% meeting. Reddit DMs to the hand-picked cohort should do far better (they pre-described the problem): expect 20-40% reply. If Reddit replies come in under 15%, the pitch framing is wrong — stop and rework before spending the rest of the list (that is a capture-system decision trigger, §13).

**Success metric:** 15+ booked first-sessions by day 7. **Next action:** founder approves Wave-2 harvest and sends the first 5 kit messages on day 2.

## 5. Manufacturing warm intros

Cold works, warm converts ~3-4x better. A pre-seed founder without a network manufactures warmth three ways, all startable this week:

| Play | Mechanics | Effort | Expected yield | Metric |
| --- | --- | --- | --- | --- |
| **The build-in-public reply ladder** | Founder replies substantively (not "great post!") to 5 PM/AI posts daily on X/LinkedIn for 7 days before any ask. By day 5, DMs to those authors are warm. | 30 min/day | 10-15 warm-enough DM channels by day 7 | Reply→conversation rate |
| **The demo-as-gift** | End every single call (any call, including rejections) with "who is one person who'd find this useful?" A specific ask ("one person") beats "anyone you know." | 10 seconds/call | 1 referral per 3 calls once sessions start | Referrals/session |
| **Community citizenship first** | In Lenny's/MTP/PLA Slack: answer 3 questions genuinely before mentioning Supaprod exists. Then the mention is a member sharing their work, not an ad. | 20 min/day | Channel permission to share at launch + 5-10 warm members | Non-founder mentions of Supaprod |

## 6. Founder-led sales pipeline

Seven stages. Every prospect lives in exactly one. **Exit criteria are behavioral, never vibes.**

| Stage | Definition | Exit criteria (advance when…) | Kill criteria (drop when…) |
| --- | --- | --- | --- |
| 0. Named | On a list with a personalization hook | Message drafted + founder-approved | No hook findable |
| 1. Contacted | First message sent | Any reply | No reply after 1 bump |
| 2. Conversation | They replied | 15-min session booked | Two reschedules or ghost |
| 3. First session | The 30-min script (§7) ran | They connect a real source OR paste real notes in-session | "Cool, good luck" with no artifact touched |
| 4. Activated beta | Their own data produced a teardown/brief they reacted to | Return visit within 7 days without prompting | No second session + no product return in 10 days |
| 5. Design partner | Signed the mutual commitment (§11) | Weekly ritual running 2+ consecutive weeks | Two silent weeks |
| 6. Paying | Real card, real credits ([pricing](../strategy/pricing/pricing-architecture.md)) | — (this is the win; feed the case study machine) | Churn → exit interview within 48 hrs, logged as signals |

**The one pipeline metric that matters this month: stage-3→4 conversion (activation).** It is the product-truth number — G-SPRINT's "stranger gets a receipted value moment in under 10 minutes" made measurable. Below 40% = fix the first-session experience before adding more top-of-funnel. **Track in:** the founder's own Supaprod workspace (§13), not a separate CRM — dogfood or admit the product can't do it.

## 7. The interview framework: the 30-minute beta first session

The ground-truth mandate says beta sessions ARE discovery interviews. This script interleaves them so the prospect gets a real product experience while we extract Mom-Test-grade evidence. **Record with consent (Grain/Fathom or plain screen record); the recording is a capture-system input (§13).**

**Minutes 0-3 — Frame (verbatim-usable):**

```
Thanks for the time. Two things today: I want to learn how you actually
run product decisions now, and then I'll put Supaprod on your real data
and you tell me where it breaks. This is not a sales call. The most
useful thing you can be is blunt. OK to record for my notes?
```

**Minutes 3-12 — Past-behavior discovery (before showing ANYTHING — order matters; the demo contaminates memory):**

| # | Question | What it validates | Follow-up | Never ask instead |
| --- | --- | --- | --- | --- |
| 1 | "Walk me through the last decision your team made about what to build next. Start from where the idea came from." | The loop shape; who holds it | "What did you have open on your screen while doing that?" | "Is prioritization hard for you?" (yes/no, leading) |
| 2 | "When did someone last ask why you decided something, and you had to go digging? What did that look like?" | The excavation pain (our wedge) | "How long did it take? What did you find?" | "Wouldn't a decision ledger help?" (pitch disguised as question) |
| 3 | "Of things you shipped last quarter, how do you know which ones worked?" | Outcome-tracking absence | "Who checked? When? Where does that live?" | "Do you track outcomes?" (invites aspirational lying) |
| 4 | "What have you already tried with AI for any of this? What happened?" | Segment (S1 vs S2), tool graveyard | "What made you stop / keep going?" | "Would you use an AI agent for this?" (hypothetical) |
| 5 | "What did that cost you — hours, a missed call, a fight?" | Pain quantification for the scorecard | "Is that typical or a bad week?" | Skipping this one (it prices the pain) |

**Minutes 12-25 — Live product, their data.** Follow [`pitch/demo-script.md`](../pitch/demo-script.md)'s team-demo variant: they pick their own bet; connect one source or paste real notes; watch the Critic tear down THEIR bet. Say nothing during first read of the teardown. **Watch and log:** where they lean in, what they screenshot, the first feature they ask for, the first thing they distrust.

**Minutes 25-30 — Close with three extraction questions:**

1. "If this disappeared Monday, what would you actually miss?" (value location — their words become copy)
2. "What would have to be true for your team to pay for this?" (buying condition, NOT a price quote)
3. "Who is one person who should see this?" (referral engine)

Then the design-partner ask if stage-3 exit criteria were met (§11).

**Success criteria per interview batch (from every 5 sessions):** specific stories not opinions; ≥1 surprise (zero surprises = leading questions); ≥3 verbatim quotable lines; pattern repetition across 3+ people before we act on it.

## 8. Problem validation scorecard

Score every first session within 24 hours. 5 dimensions, 0-2 each; max 10.

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Pain recency | Can't recall an instance | Within the quarter | Within 2 weeks, unprompted detail |
| Pain cost | "Annoying" | Hours named | Hours + a consequence (missed call, conflict, churned customer) |
| Active workaround | None | Manual doc/ritual | Built or bought something (spent money or 5+ hours) |
| Pull in session | Polite | Asked questions | Asked for access / next step / pricing unprompted |
| Loop ownership | Decision made elsewhere | Shares the decision | Owns it and is accountable for outcomes |

**Reading the numbers: 8-10** = design-partner track, same day. **5-7** = beta cohort, nurture. **0-4** = thank them, log the learning, do not onboard (they will churn silently and pollute activation data). **Segment-level read:** after 10 sessions, if a segment's average is under 5, its pain hypothesis is failing — say so in the weekly synthesis and shift quota to the strongest segment. That reallocation decision is exactly what the capture system (§13) exists to force.

## 9. Pricing validation & willingness to pay

The ladder is locked ([pricing-architecture](../strategy/pricing/pricing-architecture.md) §6: Free / Pro $20 / Team $50 / Enterprise committed-credits; credits not seats). **We are not validating the structure — we are validating the numbers and the credit sizing.** Three instruments, cheapest first:

**9a. Van Westendorp (in session, after value moment, from session #6 onward — never in the first five, which are pure discovery):**

```
At what monthly price would this feel so cheap you'd doubt it works?
At what price is it a bargain?
At what price does it start feeling expensive but you'd still pay?
At what price is it out of the question?
```

Log all four numbers per person. After 15 responses, plot; the acceptable band should bracket $20 Pro. If the "bargain" median comes in above $35, we underpriced — raise before public launch (pre-launch is the only free repricing window we will ever get).

**9b. The commitment test (design partners, week 2):** "Beta is free for 60 days. After that it's $20/month for what you're using. Should I put you down to continue at that point, yes or no?" A verbal yes recorded on the call is 10x a survey answer. Target: **≥60% yes** among activated partners. Under 40% = value story problem, not a price problem (they were told the number was coming; hesitation means the value didn't land).

**9c. The real-money test (the only truth — Launch Month W2, PC-05 billing live):** offer 3-5 warmest partners a founder deal: $99 for 6 months Pro-level, in writing, card on file now. **Target: 3+ real transactions before the public listing.** This is the strongest pre-launch traction sentence we can put in front of investors and the YC application: strangers paid before launch.

**Credit-sizing validation (runs itself):** watch design partners' actual credit burn vs the 200/month Pro allowance. If median activated usage exceeds 60% of allowance, sizing is right (felt generous, drives upgrade). Under 20% = allowance reads as infinite; shrink before launch.

## 10. The concierge MVP: run Supaprod FOR them

**The single highest-signal WTP experiment available to us, and nobody in our comp set does it.** Offer 3 prospects (score 8-10, too busy to onboard): "Give me read access to your backlog and support channel, or export me a dump. Monday morning you get: your signals clustered, your top 5 bets ranked with evidence, a Critic teardown of each, and a one-page brief. Free once."

- **Why:** proves value with zero onboarding friction; produces the most concrete before/after case-study material possible; the follow-up ("want this every Monday?") converts a deliverable into a subscription conversation. If they won't take it FREE, the value hypothesis itself is in trouble — that is a finding, not a failure.
- **Effort:** ~2 hrs founder time per prospect (Supaprod does the work; founder curates — which is itself product QA on real external data, the first ever).
- **Metric:** 3 offered → ≥2 accepted → ≥1 asks for it again unprompted. The "asks again" is the pull signal.
- **Risk note:** their data enters a founder-controlled workspace; say so plainly, offer deletion on request, and NEVER use their data in public materials without written OK.
- **Next action:** slot the offer into session closes from day 3.

## 11. Design partner program (PC-13)

Mechanics live in the [kit](../pitch/design-partner-kit.md) (targets, templates, weekly ritual, feedback→signals bridge). This section adds the **terms** and the **graduation path**:

**The mutual commitment (say it verbatim in the close, put it in the follow-up message):**

```
What you get: free access through launch plus 60 days, a direct line to
me, and your name on the wall as a founding partner if you want it.
What I ask: you run one real decision through it each week, and you tell
me every week what it got right and what it got wrong. Deal?
```

- **No advisory equity, no discounts-for-life, no NDAs.** Equity for feedback is pre-seed over-engineering; open-ended free is a churn subsidy. Time-boxed free + founder access is the standard 2026 design-partner offer and it filters for genuine interest.
- **Named target: 25 contacted, ≥10 onboarded (the G-BETA gate).** Contact wave starts day 2-3 per the sprint plan.
- **Graduation:** week 6-8, every active partner gets the 9b commitment test; yeses convert via the 9c founder deal. Partners who gave real feedback but won't pay: keep 2 as advisory-group members (§12), release the rest gracefully. A design partner program that never converts anyone to revenue was a focus group.

## 12. Customer advisory group

Assemble AFTER 15+ first sessions (week 3-4, not launch week — earlier = guessing at composition). **5-8 people: 2×S1, 2×S2, 1×S3, 1-2×S4, at least one vocal skeptic** (advisory groups of fans produce applause, not advice; the skeptic is the quality control).

**Format:** 45-min monthly call + async Slack Connect/DM channel. Agenda fixed: 10 min "here's what we shipped because of you" (the you-said-we-changed receipt — this retention mechanic is why people stay in advisory groups), 20 min one contested roadmap decision debated live, 15 min open. **The contested decision goes through Supaprod's own Critic first and the group sees the teardown** — the advisory group experiences the product being used to run the product.

**What members get:** early features, launch-day credit ("founding advisor"), and visible influence. **Metric:** ≥6 of 8 attend month 2 (attendance decay is the honesty meter for whether WE are worth advising).

## 13. The capture system: every interaction becomes a product decision

**The rule: if it isn't captured within 24 hours, it didn't happen. If it doesn't change a ranking, a message, or a build decision within a week, it wasn't captured — it was hoarded.**

**Supaprod runs its own discovery. This is not optional dogfooding theater — it is the demo.** Every interview becomes signals in the founder's production workspace; themes cluster; the Critic tears down the founder's own launch bets against accumulating evidence; outcomes get recorded when a bet resolves. When a prospect asks "does anyone actually use this?", the answer is the founder's live workspace running the company's own GTM. (Interim manual bridge until PC-15 ships the in-product pulse, per the kit's honest-claims note.)

**Fields per interaction (one signal entry each):**

| Field | Content |
| --- | --- |
| Source | Handle/name + segment (S1-S4) + pipeline stage |
| Verbatim | Their exact words, 1-3 quotes, no paraphrase (paraphrase launders evidence) |
| Scorecard | The §8 score + 4 Van Westendorp numbers when collected |
| Moment | What they leaned into / recoiled from during the live section |
| Ask | Feature/change they requested, in their words |
| Commitment | What THEY agreed to do next (Mom Test law: a meeting that ends without their commitment was a compliment, not progress) |
| Buyer score | §14 rubric |

**The weekly synthesis ritual (Friday, 60 min, non-negotiable):**

1. Re-read the week's signal entries (15 min).
2. Update the pattern board: any pain/objection/ask now heard 3+ times independently graduates to a THEME (10 min).
3. Run the Critic on the top open GTM bet given new evidence (10 min).
4. Make ≤3 decisions, each logged with evidence links: one product (what the sprint builds/kills next), one message (what copy changes), one targeting (which segment/channel gets more or less). (15 min)
5. Send design partners anything that shipped because of them — the you-said-we-changed note (10 min).

**Decision triggers (act immediately, don't wait for Friday):** Reddit-cohort reply rate <15% after 10 sends → rework pitch framing. Activation (stage 3→4) <40% after 8 sessions → stop outreach, fix first-session flow. Any single objection heard 5+ times → it goes on the public FAQ and into the Show HN honest-limitations list.

## 14. The paying-user likelihood rubric

Score every activated user weekly. **Purpose: aim founder time at buyers, not tourists.** Behavioral only — what they DID, never what they said they'd do.

| Signal | Points |
| --- | --- |
| Connected a real tool (not sample data) | +3 |
| Returned unprompted within 7 days | +3 |
| Asked about pricing unprompted | +3 |
| Invited a teammate | +4 |
| Ran a decision they were personally accountable for through it | +3 |
| Shared an artifact externally (teardown/ledger link) | +2 |
| Asked for an integration by name | +2 |
| Verbal yes on the 9b commitment test | +4 |
| Only used sample/demo data after week 1 | −3 |
| Engaged only when founder prompted | −2 |

**Read: 12+ = hot** (founder deal conversation this week). **6-11 = warm** (nurture, weekly ritual). **≤5 = tourist** (product can serve them; founder time cannot). **Meta-metric:** by day 21 we should have ≥5 hot accounts. Fewer means the funnel is filling with the wrong segment — retarget using §8's segment-level scores.

## 15. What happens in the first 7 days

| Day | Discovery actions (this file's slice of the sprint — full day-by-day: [`00-launch-operating-manual.md`](./00-launch-operating-manual.md)) |
| --- | --- |
| 1 | HyperAgent rig harvests Wave 2 (+75-125 names); founder joins 2 communities; reply-ladder starts; capture workspace set up (segments, pipeline stages, signal template) |
| 2 | Founder approves Wave-2 list; **first 5 kit DMs send**; Wave-4 company list build starts; 5 more reply-ladder touches |
| 3 | 10 more sends; first booked sessions expected; concierge offer added to session closes |
| 4 | Sessions run (2-3/day max — synthesis needs air); scorecards same-day; first bump wave |
| 5 | Sessions + sends continue; 250-name milestone check; first mini-synthesis (are S1/S2 hypotheses holding?) |
| 6 | Sessions; Van Westendorp starts (session #6+); referral asks compounding |
| 7 | **First full weekly synthesis**; pipeline review: 15+ sessions booked, ≥6 run, ≥3 activated, ≥2 design partners signed → on track for G-BETA's ≥10 by day 14 |

---

_Related: [`00-launch-operating-manual.md`](./00-launch-operating-manual.md) (the sprint spine) · [`../pitch/design-partner-kit.md`](../pitch/design-partner-kit.md) (targets + templates) · [`../pitch/demo-script.md`](../pitch/demo-script.md) (the live-session demo doctrine) · [`planning/archive/v13-proof-campaign-plan.md`](../planning/archive/v13-proof-campaign-plan.md) (G17 gates this system feeds)._
