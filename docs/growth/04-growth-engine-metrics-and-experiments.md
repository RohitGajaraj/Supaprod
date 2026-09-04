# 04 — Growth engine, metrics, and the experiment system

> _Created: 2026-08-03 · Last updated: 2026-08-11_

> _Part of the [GTM Launch Operating Manual](./README.md). Created 2026-07-12. Owner: founder + GTM lane (Lane C)._
> _Binding anchors: [v13 Proof Campaign](../strategy/archive/v13-proof-campaign.md) (gates G-SPRINT → G-BETA → G-LAUNCH → G-REV; north star = weekly closed loops per workspace), [pricing architecture](../strategy/pricing/pricing-architecture.md) (credits-not-seats, free wedge), claim discipline PROVEN / WIRING / ROADMAP. Nothing here publishes without founder approval (standing rule, plan §4)._

**Contents:** 1. Growth loops · 2. The four motions · 3. SEO + AI search · 4. Content engine · 5. Partnerships & integrations · 6. Weekly experiment system · 7. Metrics dashboard

---

## 1. Growth loops — the Supaprod-native viral objects

The product's structural advantage: **Supaprod manufactures evidence, and evidence are inherently shareable.** Most B2B tools have to bolt on virality; ours is the moat object itself. Every loop below follows the same shape: **trigger → shareable artifact → viewer gets standalone value → viewer signs up → their usage makes more artifacts.**

Priority order (build/verify in this order; ship #1 and #5 for launch, the rest ride the beta wave):

### Loop 1 — the Critic teardown share link (the wedge loop)

- **Artifact:** a public, read-only teardown of a product bet: the claim, the evidence for, the red-team against, the precedent cited. Viewer needs no account to read it.
- **Trigger:** every completed teardown offers "Share this teardown" (copy link). The PM shares it to justify a call in Slack/a doc — _they share it to do their job, not to market us._ That is what makes the loop honest and repeatable.
- **Viewer value:** the strongest argument document they've seen for/against a bet — with sources. Footer: "Red-teamed by Supaprod. Run your own bet through the Critic → [link]."
- **Loop metric:** teardowns shared per active workspace per week; visitor → signup rate on teardown pages.
- **Status:** teardown engine PROVEN; the public share route is **WIRING — verify the no-auth share view exists before day 3; if not, it is a sprint item, not a nice-to-have.** This is the #1 growth asset.
- **Next action:** test share link on a fresh incognito session against the demo workspace; screenshot for the copy pack.

### Loop 2 — the Track record share link (the proof loop)

- **Artifact:** a read-only track record view: decisions made, what shipped, what the outcome was, which calls were right. The "PM impact track record."
- **Trigger:** performance reviews, stakeholder updates, job hunting ("here is my decision record"). Quarterly cadence, deeper trust than Loop 1.
- **Viewer value:** the first time most executives will ever see an auditable decision record. Footer CTA mirrors Loop 1.
- **Loop metric:** ledgers shared / month; exec-viewer → team signup (this is the bottom-up→top-down handoff).
- **Status:** track record PROVEN; share view WIRING (same verification as Loop 1).

### Loop 3 — "you said → we changed" public changelog

- **Artifact:** a public page per workspace (opt-in): user feedback in, shipped change out, dated, linked to the evidence.
- **Trigger:** teams share it with their own customers — Supaprod rides _their_ customer communication.
- **Why it compounds:** every viewer is a product person's customer, and a subset are product people. WIRING (the changelog object exists in the campaign; the public page is beta-wave work).
- **Loop metric:** workspaces with public changelog on; referred visits from changelog pages.

### Loop 4 — PRD lineage links

- **Artifact:** a spec whose every paragraph cites its evidence (signal → theme → decision → spec). Shared in the PM↔eng handoff, which v13 §3.1 identifies as where trust dies (68% of rework cost).
- **Trigger:** normal work — the PM sends the spec to engineering. Engineers are the viewer; engineers are on HN. This loop seeds the Show HN audience for free.
- **Loop metric:** lineage-link opens by non-members; eng-viewer signups.

### Loop 5 — workspace invites (the evidence chain)

- **Artifact/trigger:** the PM invites their eng lead because the evidence chain (spec → PR → CI → outcome) is _for_ the eng lead. Every activated workspace should generate ≥1 invite within 2 weeks — instrument this from day 1.
- **Why it matters most:** invites are the only loop that moves the north star directly (multi-member workspaces close more loops) and the precondition for G-TEAM.
- **Loop metric:** invites sent per activated workspace; invite acceptance rate.

### Loop 6 — watermarked outputs (ambient)

Every export/PDF/shared artifact carries a quiet "Decided with Supaprod · [evidence link]" footer (removable on paid tiers — a classic PLG upgrade nudge, and honest: the evidence link _is_ the artifact's history). Low lift, permanent surface area. WIRING.

### Pre-launch loop — the waitlist referral ladder

For the 7-day wave (details and copy in [05-viral-and-guerrilla-playbook.md](./05-viral-and-guerrilla-playbook.md)): position-jumping waitlist (share to move up) with **utility rewards, not swag** — e.g. referring 3 people unlocks the no-signup demo early; 10 unlocks a founder-run Critic teardown of _your_ real product bet (concierge; capacity-capped at ~5/day). The teardown reward doubles as discovery interviews and as the first public teardown artifacts. **Vanity warning applies:** the waitlist number is a vanity metric; the teardown-request count is the real demand signal.

---

## 2. The four motions

### 2.1 Founder-led (weeks 1–8 this is ~70% of growth; do not delegate it)

- **Build-in-public arc with the evidence.** The standing pipe exists: postable insights → [`brand-feed.md`](../growth/brand-feed.md) → the brand engine stages Buffer drafts → **founder approves every send** (never auto-publish; standing rule). The launch month arc: _"ten weeks building an autonomous product engine in silence. Opening the doors in 25 days. Evidence daily."_ Daily artifact-backed posts (a real trace, a real revert, a real track record entry) — never announcements without evidence.
- **Founder-led sales IS the discovery system** — every beta first-session doubles as a discovery interview (ground-truth mandate; frameworks in [03-customer-discovery-and-validation.md](./03-customer-discovery-and-validation.md)).
- Why: at zero market contact, credibility only transfers person-to-person. Impact: fills the 25-partner list (PC-13). Effort: 60–90 founder-min/day. Metric: replies + booked sessions/week. Next: the day-by-day script in [00-launch-operating-manual.md](./00-launch-operating-manual.md).

### 2.2 Product-led

- **Activation is defined by G-SPRINT and nothing else:** a stranger reaches one receipted value moment (their own bet, torn down, with evidence) unassisted in under 10 minutes. All PLG tuning targets that single moment.
- **Free wedge → credits ladder:** free tier delivers the wedge (teardowns + brief) with visible credit metering; upgrade moment = the first time an agent offers to _do_ the next step (build the spec, open the PR) and the meter says "this mission needs a credit pack." Buying credits with a real card is the G-BETA exit condition — pull, not vanity.
- Metric: signup → activated %, activated → week-2 return %, free → first credit purchase %.

### 2.3 Community-led

Give value in PM/AI communities for 2 weeks before asking anything (channel etiquette per [01-channel-playbooks.md](./01-channel-playbooks.md)). The durable play: become the person who posts **decision autopsies** (§4) — the community-native format of our wedge. Later (post G-LAUNCH): a small "Closed Loops" community of beta users comparing decision records — only if ≥10 users ask for it; never manufacture a ghost town.

### 2.4 Referral (product phase)

Post-G-REV: credits-for-referrals both ways (giver and receiver get a mission pack). Credits-not-seats makes this clean — a referral literally funds the friend's first closed loop. ROADMAP until billing is live; design now, ship with PC-19.

---

## 3. Organic: SEO + AI search (GEO)

**Honest timeline: SEO is a 3–6 month lever on a zero-authority domain. Start now, expect nothing before October.** Weeks 1–2 get only the free wins: homepage indexed, llms.txt, 3 bottom-funnel pages.

- **Bottom-funnel wedge pages first, no blog spam.** (1) _Alternatives/comparison_: "Productboard alternative that learns from outcomes," Supaprod vs ChatPRD / vs Airtable ProductCentral / vs Linear — honest tables, our WIRING items included (an honest comparison page is itself differentiation, and it is what LLMs cite). (2) _Job-to-be-done_: "how to defend a roadmap decision," "why did we decide X — reconstructing product decisions," "PM decision log template" (template = lead magnet feeding the waitlist). (3) _The while-you-sleep page_ (v13 §5 says it becomes a product page — it is also a perfect search object: "what can AI agents do for product managers overnight").
- **GEO — being the answer inside ChatGPT/Claude/Perplexity.** This is the channel incumbents are slowest on. Ship `llms.txt` + `llms-full.txt` day 1 (minutes of work); every claim on public pages in extractable, sourced, tabular form; publish the one-liner and category definition ("decision and outcome operating system") consistently everywhere so models learn one phrasing; seed Q&A-shaped pages ("What is a product decision record?") that answer-engines lift verbatim. Metric: monthly manual probe — ask the 5 major assistants "best tool to track product decisions and outcomes" and log citations (HyperAgent rig can automate the probe).
- Effort: 2–3 days total across the month. Impact: compounding; the only channel that gets cheaper over time. Next: llms.txt + the 3 pages before the listing (they catch HN/PH spillover search).

---

## 4. The content engine

**Voice: sharp PM, plain words, evidence over adjectives ([humanized-output](../conventions/humanized-output.md) applies to every public word — no AI-fingerprint phrasing, no em dashes in posted copy).**

| Pillar | Format | Cadence | Why it works |
| --- | --- | --- | --- |
| **Decision autopsies** | A real decision (ours or a public company's), the evidence at the time, the call, the outcome, what the track record would have caught | 2/week | The wedge as content; infinitely repeatable; communities allow it (it is analysis, not promo) |
| **What the agents did while I slept** | Morning screenshot of the brief: missions advanced, drift caught, rankings moved — with the evidence | Daily during launch month | The USP as a daily proof-object; the series title is the hook |
| **Build-in-public with the evidence** | Traces, reverts, the failure path, real numbers (users, revenue: zero until it isn't) | Daily | Honesty is the differentiator; zero→N is the most-followed startup arc |
| **The open-loop essays** | "Your roadmap is an open loop," "The track record is the compiler for judgment" | 1/week | Category creation; feeds newsletters/podcasts |

**Repurposing chain (one artifact, four surfaces):** X thread (day 0) → LinkedIn narrative rewrite (day 1, never a crosspost) → the strongest of the week becomes a long-form essay (personal site/Substack) → essay excerpts feed newsletter pitches. HyperAgent or the brand engine drafts derivatives; **founder approves every send.**

---

## 5. Partnerships & the integration ecosystem as distribution

- **Marketplace listings are free, high-intent, zero-authority-friendly channels.** With 13 OAuth providers live: submit to the **Slack App Directory** (PC-09 registration unblocks), **Linear integrations directory**, **Notion integrations gallery** first (wedge users live in Linear/Notion per plan §4). Each listing is a permanent search surface inside the buyer's daily tool. Effort: ~half-day each incl. required screenshots. Metric: installs/month per listing. Timing: submit during beta wave; directories take days–weeks to review.
- **Co-marketing with the build layer, never rivalry.** Posture is binding (moat §6): we dispatch Lovable/Cursor-class tools and feed them work. The pitch to them: "Supaprod sends your tool qualified build missions with compiled specs." Concrete asks: a joint demo clip (spec in Supaprod → PR via their tool), a mention in their showcase/newsletter. Start with Lovable — Supaprod is _built and hosted on it_; "product built on Lovable orchestrates Lovable" is a story their DevRel wants. ROADMAP: co-marketing outreach after G-BETA (we need the demo to be real first).
- **The A2A/MCP angle for the dev audience:** Supaprod speaks MCP/A2A both ways — a listing in MCP server directories reaches the agent-builder crowd that upvotes on HN. Effort: low (the card exists at `src/routes/api/*` A2A endpoint — PROVEN).

---

## 6. The weekly experiment system

**Rules:** every experiment pre-registers hypothesis, metric, and a kill/scale/iterate decision rule before it runs. Max 3 concurrent. Reviewed in the weekly ritual. ICE-scored (Impact, Confidence, Ease, 1–10; run order = score).

| # | Experiment | Hypothesis | Success metric (7-day unless noted) | Effort | ICE | Decision rule |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | Concierge teardown offer ("reply with your hardest roadmap call, I'll run the Critic on it") on X/LinkedIn/communities | The wedge sells itself when demonstrated on the prospect's own problem | ≥10 requests, ≥5 delivered, ≥3 → beta signups | M | 9.3 | Scale if ≥5 requests; it becomes the standing CTA everywhere |
| E2 | Waitlist referral ladder (utility rewards, §1) | Product people share for utility, not swag | Referral K-factor ≥0.4; ≥15% of signups from referrals | M | 8.7 | Kill rewards nobody claims; keep the teardown reward |
| E3 | Public teardown of a famous product decision (e.g. a well-covered feature flop), posted as analysis | The wedge format earns organic reach without self-promo | ≥50k impressions or 1 front-page community thread; ≥200 site visits | L | 8.7 | Scale to 2/week if either threshold hits |
| E4 | Cold outreach A/B: "watch Supaprod red-team YOUR bet" vs generic demo ask | Specific artifact offer beats demo ask ≥2x on booked calls | ≥8% positive reply on the winner (n≥50/arm) | L | 8.3 | Winner becomes the standing sequence |
| E5 | Founder "open track record" page — our own Supaprod workspace's decision record, public | Radical dogfood transparency drives return visits + trust | ≥500 unique visits, ≥3 unprompted shares | M | 8.0 | Keep if it earns links; it costs nothing after setup |
| E6 | LinkedIn DM to PMs who complained publicly about roadmap/stakeholder pain (signal-sourced list) | Pain-expressers convert 3x cold lists | ≥15% reply, ≥5 sessions booked (n≥40) | M | 7.7 | Scale via HyperAgent list-building if reply ≥10% |
| E7 | "Decision log template" lead magnet (Notion/Sheet) gated on email | Templates out-convert product waitlists for PM audiences | ≥300 downloads, ≥25% join waitlist | L | 7.7 | Keep the template public forever either way (SEO object) |
| E8 | 2-min failure-path video (wrong call → revert → evidence) as the pinned demo | The failure path converts skeptics better than the win path (research: skeptics judge the error path) | View-through ≥40%; demo-link CTR ≥8% | M | 7.3 | If it beats the win-path video, it leads everywhere incl. Show HN |
| E9 | Newsletter classifieds (Lenny's/Product Growth tier-2 slots) | Paid PM newsletter reach converts at ≥$5/waitlist signup | CPL ≤$5, ≥100 signups | L (cash) | 6.7 | One test slot only pre-launch; scale post-revenue |
| E10 | University/bootcamp PM communities (Reforge/Product School alumni Slacks) | Cohort communities are an overlooked high-trust channel | ≥30 signups, ≥2 design partners | M | 6.3 | Keep only channels that produce a partner |
| E11 | Live "roast my roadmap" session (Zoom/X Space, Critic on screen) | Live wedge demo creates clip-able moments + trust | ≥30 live, ≥3 clips, ≥10 signups | M | 6.0 | Monthly if ≥30 attend; the clips are the real yield |
| E12 | Comparison pages (§3) probe | Bottom-funnel intent exists pre-authority via long-tail | Any impressions in Search Console in 14 days; 1 AI-assistant citation in 30 | L | 6.0 | Iterate titles; this is a slow lever, never kill early |
| E13 | Time-to-first-evidence onboarding A/B (connect source vs paste notes first) | Paste-notes path activates faster for cold signups | Activation Δ ≥15% (n≥60/arm) | M | 7.0 | Winner becomes default; loser stays as fallback |
| E14 | "Supaprod built this" PR badge — public PRs merged via Supaprod link back | Eng-side evidence recruit the HN audience passively | ≥50 badge clicks/month | L | 5.7 | Set-and-forget if >0; remove if partners object |

**The weekly growth review (30 min, Friday — run it INSIDE Supaprod as a mission; the review itself generates track record evidence we can show):**

1. North star + funnel vs last week (5 min, dashboard pre-read)
2. Each live experiment: metric vs decision rule → kill/scale/iterate, no debate beyond the pre-registered rule (10 min)
3. Top 3 customer verbatims of the week → one product decision each (10 min)
4. Pick next week's ≤3 experiments from the backlog by ICE (5 min)
   Output: one track record entry per decision. This ritual is also our best demo of the product.

---

## 7. The metrics dashboard

**North star (binding, v13 plan §1): weekly closed loops per workspace** — a decision made → shipped → outcome recorded. Secondary: week-2 return; unprompted shares (teardown/track record links). Instrumentation: PostHog EU per the AFD initiative (funnel events only; implementation lives with PC-06, not this doc).

**The funnel (all-zero baselines as of 2026-07-12 — honest by design):**

| Stage | Definition | Baseline | 7-day target | G-LAUNCH target (day ~25) |
| --- | --- | --- | --- | --- |
| Visit | Unique on public pages | 0 | 3,000–10,000 | 25,000+ |
| Waitlist / signup | Email captured (pre-launch) or account (post) | 0 | 500–2,000 quality signups | 2,000–5,000 |
| Activated | G-SPRINT moment: own bet torn down, <10 min, unassisted | 0 | 10 (concierge counts) | ≥50 external workspaces |
| Weekly-active | ≥1 session + ≥1 evidence generated that week | 0 | 5 | ≥20 |
| Paying | Real card bought credits | 0 | 0–1 | first purchases (G-BETA exit) |
| Expanding | 2nd member or 2nd credit pack | 0 | — | first instances |

Targets are calibrated to comparable B2B launches, not to hope. A "few million waitlist" is not a planning number any real B2B launch supports; if the wave dramatically overperforms, the plan scales up gracefully — the constraint becomes concierge capacity, which is a good problem the decision framework in [00](./00-launch-operating-manual.md) covers.

**Vanity vs pull (the investor-facing discipline — report the right column, track both):**

| Vanity (context only) | Pull (evidence of product-market pull) |
| --- | --- |
| Waitlist size, impressions, upvotes, followers | Unprompted teardown/track record shares by users |
| Signups | Week-2 return; weekly closed loops |
| Demo views | "Can I pay you today?" asks; real-card credit purchases (unprompted payment attempts logged verbatim, dated) |
| Community applause | Users inviting their eng lead unprompted |
| Press/newsletter mentions | Design partners renewing past the free period; users angry when something breaks (they depend on it) |

**Gate tie-in (no parallel gate system — these are v13's own):** G-SPRINT = activation is real · G-BETA = 10+ external workspaces active + a real card · G-LAUNCH = listed, ≥50 workspaces, ≥20 weekly-active · G-REV = ≥10 paying. The dashboard exists to tell us which gate is nearest and what blocks it — any metric that doesn't inform a gate or a kill/scale decision gets deleted from the dashboard.
