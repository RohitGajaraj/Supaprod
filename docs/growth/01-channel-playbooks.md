# 01 — Channel Playbooks (per-channel execution)

> _Created: 2026-07-12. Part of the GTM launch operating manual ([README](./README.md)). Research basis: two web sweeps run 2026-07-12 (channel meta + prospecting); rules quoted below were pulled from live platform rules pages where marked VERIFIED; numbers marked ~directional come from secondary/vendor sources and must not be treated as hard. Sequence anchor: the wave fires days 3–7 ([`00`](./00-launch-operating-manual.md) §2), the Show HN + Product Hunt listing fires week 2–3 (v13 phase 3). Copy for every slot: [`02`](./02-prelaunch-copy-pack.md). Stunts these channels carry: [`05`](./05-viral-and-guerrilla-playbook.md). **Standing rule: founder approves every outward send.**_

## Contents

1. [Channel priority matrix](#1-channel-priority-matrix)
2. [Start today, regardless of everything else](#2-start-today-regardless-of-everything-else)
3. [Competitive alert](#3-competitive-alert)
4. [Hacker News / Show HN](#4-hacker-news--show-hn)
5. [Product Hunt](#5-product-hunt)
6. [X / Twitter](#6-x--twitter)
7. [LinkedIn](#7-linkedin)
8. [Reddit](#8-reddit)
9. [Slack / Discord communities](#9-slack--discord-communities)
10. [Newsletters and podcasts](#10-newsletters-and-podcasts)
11. [Overlooked channels](#11-overlooked-channels)

---

## 1. Channel priority matrix

Ranked for OUR situation: zero audience, 7-day wave, listing in week 2–3. The ranking metric is **qualified signups per founder-hour**, not reach.

| Rank | Channel | Phase | Qualified-signup yield per founder-hour | Why this rank |
| --- | --- | --- | --- | --- |
| 1 | LinkedIn DMs + X DMs (gift-first, from [`03`](./03-customer-discovery-and-validation.md)) | days 3–7 | Highest floor: personalized 1st-degree DMs reply at 25–35% | Direct, qualified, no algorithm between us and the buyer |
| 2 | X (founder story + evidence posts + reply-guy routine) | days 3–7 | Medium, high variance | The wave's public stage; where the PM/builder ecosystem actually talks |
| 3 | Communities (Lenny's Slack, r/AI_Agents, Lovable Discord, AI Tinkerers) | seed day 0, harvest week 2+ | Low this week, compounds | Best audience match anywhere (Lenny's); etiquette gates the speed |
| 4 | LinkedIn posts (carousel + text) | days 3–7 | Low-medium | Credibility amplifier for the DM motion; anti-viral by design |
| 5 | Newsletters (Aakash Gupta, How I AI slots) | email day 0–1, lands week 2–4 | Potentially high per $ | Longest lead time of anything actionable — start first |
| 6 | Show HN | week 2–3 (gated) | High on the day, one-shot | Requires no-signup demo + human-sounding copy + warm first hour |
| 7 | Product Hunt | same week as HN | Medium, one-shot | Badge + credibility; 30–100 signups realistic at #4–10 |
| 8 | Reddit posts | week 2+ (accounts must season first) | Medium | Converts well (~directional: better than PH) but rules punish haste |
| 9 | Podcasts | post-traction | ~0 this month | Lenny's Podcast explicitly does not take pre-traction founders |

**The core research finding (three independent sweeps converged on it):** HN, PH, and X are **velocity amplifiers, not discovery engines**. First-hour momentum on all three comes from an already-warm owned audience. Everything in §2 exists to build that warmth before the cards get played.

---

## 2. Start today, regardless of everything else

Day 0 actions with lead times longer than the wave:

- [ ] **Reddit account seeding.** Create/dust off a personal account; begin genuine participation in r/ProductManagement, r/SaaS, r/AI_Agents, r/SideProject. Target ~200–300 karma and 2–3 weeks of history before any product mention (~directional threshold; zero-participation accounts are AutoMod-removed in the big subs — VERIFIED for r/SaaS-class subs).
- [ ] **HN karma seeding.** The founder's HN account needs normal participation weeks before the Show HN; new/zero-karma accounts get auto-removed within minutes (documented Apr 2026 case). Personal username, never the company name (DDL to Data was soft-killed for this, Jan 2026).
- [ ] **Newsletter emails out.** Aakash Gupta sponsorship (productgrowthppp@gmail.com) and How I AI (jordan@penname.co) — the two longest-lead, best-fit slots. Draft in [`02`](./02-prelaunch-copy-pack.md) §7.
- [ ] **Warm-list building.** Every DM reply, waitlist signup, and community contact goes into the launch-day notify list. Target 300–400+ before listing day (below ~400, PH top-10 math gets hard — ~directional).
- [ ] **Join Lenny's Slack (paid), Lovable Discord, Latent Space Discord, Anthropic Developer Discord.** Participate genuinely; zero pitching until we've contributed.
- [ ] **Email domain warm-up** (already in [`00`](./00-launch-operating-manual.md) checklist — 30-day clock).
- [ ] **Read the Samepage Signals and Brief PH comment threads** (§3).

---

## 3. Competitive alert

> **Two near-identical positioning launches happened on Product Hunt in June 2026. Read their pages and comment threads BEFORE our copy finalizes.**
>
> - **Samepage Signals** (samepage.ai) — "second brain for product leaders," pushes insights across Jira/Linear/Productboard/Slack/Notion/Gong. 205 upvotes, Jun 25 2026, launched with a $4.85M raise (Craft Ventures; angels incl. Justin Kan). Differentiation line: _they surface insight; Supaprod closes the loop — decision to build to recorded outcome, with the evidence._
> - **Brief** (briefhq.ai) — "Navigate your agents to product-market fit," a Product Graph serving context to humans and agents via Slack/CLI/MCP, explicitly targets Cursor/Claude Code/Windsurf. 264 upvotes, Jun 2026. Differentiation line: _they feed context to agents; Supaprod governs agents end to end and keeps the track record — nobody else connects decide → build → outcome and learns from it._
>
> Their comment threads are a free preview of the objections our listing will get. Mine both; feed objections into the qa-bank ([`pitch/qa-bank.md`](../pitch/qa-bank.md)).

---

## 4. Hacker News / Show HN

**Why it matters:** the highest-trust technical audience; a good Show HN drives 1-week traffic, GitHub-star halo (AI tools averaged +121 stars/24h post-HN, arXiv 2511.04453), and permanent credibility. It is also our best-fit audience for the "it built part of itself" evidence story.

**Audience fit:** engineers, product engineers, technical founders — exactly the expanded wedge (v13 §3). Skeptical of AI claims; rewards evidence and honest limitations.

**Timing:** week 2–3 (v13 phase 3), Tue–Thu, start of US business hours (sources conflict ET vs PT; err toward 8–10am ET). Secondary window: Sunday ~6–9pm PT. **Hard gates before submitting** (from [`pitch/launch-assets.md`](../pitch/launch-assets.md), confirmed by the official rules):

- **A no-signup demo path is REQUIRED.** Official Show HN rules: something people can actually try, "ideally without barriers such as signups or emails." A waitlist page is NOT Show HN eligible. PC-04 blocks the post — no workaround.
- 2–3 real beta stories exist (the "who's using it" beat must be truthful).
- The failure-path GIF is ready.

**Posting strategy (VERIFIED rules + documented cases):**

- Post from the founder's **personal** account with real karma history. Company-named accounts get soft-killed (DDL to Data, Jan 2026 — restored only after emailing hn@ycombinator.com).
- Title: `Show HN: Supaprod – [one concrete thing]` — the drafted title lives in [`pitch/launch-assets.md`](../pitch/launch-assets.md); no adjectives, no exclamation marks. July 2026 calibration: agent-tool Show HNs land **20–220 points** (GitAgent 147, Understudy 120, Rowboat 217) — four-figure outcomes (Clippy 1,122) are personality/nostalgia outliers. Plan for the band, not the outlier.
- **The post must read unmistakably human.** The 2025–26 norm: LLM-written launch copy gets detected and flamed — and we are an AI product, so the scrutiny doubles. The founder rewrites the final text in his own words even if the structure comes from the draft.
- Maker's first comment goes up immediately: what/why/technical decisions + at least one honest limitation (the honest-limitations list is already drafted).

**First-90-minutes protocol:** ranking is vote velocity with ~45-min gravity decay. ~8–10 genuine upvotes + 2–3 substantive comments in the first 30 minutes puts you atop the Show tab; 30–50 first-hour votes gives a front-page shot. That velocity comes from the warm list (§2) being notified at post time — **never** from asking for upvotes (vote-ring detection shadowbans the domain; friends/investors upvoting on request is exactly what it catches). Ask the warm list to _check it out and comment honestly_, nothing more. Founder replies to every substantive comment within ~15 min for the first 2 hours, all day where possible.

**Pre-submit QA checklist (the prufa.dev finding: 38 of 49 audited Show HNs had analytics not firing on their biggest traffic day):**

- [ ] Analytics events verified firing on the demo path (PostHog test event visible)
- [ ] Demo path tested logged-out, fresh browser, mobile
- [ ] All links on landing + demo click through
- [ ] Console clean on the demo path
- [ ] The `[N]` slots in the drafted post refilled from live DB same morning

**Common mistakes:** waitlist-page submissions (ineligible); reposting quickly after a failed attempt (JobPilot AI's day-2 post was invisibly shadowbanned, Jun 2026 — one legitimate reattempt after a real gap is tolerated); arguing with skeptics (answer plainly, show the track record); launching into a flooded Show tab (CodeYam died twice this way — if the tab is flooded at post time, wait a day).

**Success metrics:** 100+ points = strong; 30+ real comments with founder answers = the actual asset (Understudy won on answer quality at 120 points); demo tries and signups attributed (fix the analytics first); 5+ qualified beta applications.

**Expected ROI:** at the calibrated band, a decent result is ~1,000–5,000 visitors over 36h, tens-of-signups to low hundreds, plus the credibility artifact. DDL to Data's cautionary math: front page #8 = ~1,000 visitors, 425 demo tries, **3 signups** — conversion depends on the landing, not the points.

---

## 5. Product Hunt

**Why it matters (2026 verdict — contested, run it anyway):** the indie-hacker camp calls PH dead for signups (~directional claim: Reddit converts 3–8% vs PH 0.5–2%); the multi-channel camp still gets value. The strongest-evidenced position: PH is the **same-week companion to Show HN** (exactly v13's sequence) for the badge, backlink, and investor/hiring credibility — not a top-of-funnel bet. 49% of all PH launches are now AI; competition is hardest there.

**Timing:** same week as Show HN, live at 12:01am PT for the full 24h. Tue/Wed = max traffic but needs a 200+ warm list; Thursday = better odds for smaller lists (a Tuesday #6 can out-traffic a Sunday #1 — pick Tue/Wed if the warm list is 300+, Thu otherwise).

**Playbook:**

- **Self-hunt** (~44% of 2026 launches do) with a maker profile active 30+ days prior — start founder PH activity day 0. External hunter only if one with top-30 recent hunts offers.
- Assets: 8–12 visuals; the tagline and description are drafted in [`pitch/launch-assets.md`](../pitch/launch-assets.md). Gallery shot list exists there too.
- Early-hour velocity dominates: ~30 hour-1 upvotes from established accounts can outrank 200 spread across the day (~directional). Accounts created within 72h of launch are shadow-filtered — the warm list must be _existing_ PH users; identify them when they join the waitlist.
- **VERIFIED rule:** asking or incentivizing upvotes is banned (the #1 removal cause). You MAY ask people to "check it out / try it / leave honest feedback." Paid upvote rings are AI-detected via social-graph analysis. We never touch them.
- Founder responds to every comment within 15 min during the 6–10am PT peak; 3–4-deep genuine comment threads are a ranking multiplier (~directional).

**The case to imitate:** Jesse by Floworks (YC W23) — **unfeatured** launch, 1 week of prep, direct outreach to existing users to show up: 400+ upvotes, #3 Product of the Day, 2,000+ visitors, 500+ signups, 25+ paying customers. Warmth beat featuring.

**Success metrics + realistic outcomes (Causo Hub 2026):** #1–3 = 5,000–15,000 visitors, 100–400 signups; #4–10 = 1,000–3,000 visitors, 30–100 signups; #11–30 = 300–700 visitors. B2B converts ~1–2% visitor→signup; a self-serve demo roughly doubles conversion vs "book a demo." AI category #1 now costs ~800–1,200 upvotes (~directional). **The vanity warning, verbatim from the research: "VCs view PH rankings as vanity metrics without activation numbers."** Track activation of PH signups separately; that number is the real deliverable.

**Common mistakes:** upvote-begging DMs (ban risk); launching with no warm list and calling PH dead afterward (LoreConvo: simultaneous PH+HN, zero audience → 1 upvote); treating the badge as the outcome.

---

## 6. X / Twitter

**Why it matters:** the wave's public stage (days 3–7). The PM/AI-builder conversation happens here; every stunt in [`05`](./05-viral-and-guerrilla-playbook.md) fires here first.

**The link-suppression reality (best-sourced finding):** X's open-sourced ranker (Phoenix, Jan 2026) has no reward for link clicks and demotes link posts (documented A/B: 3,670 views with link vs 65,400 without — ~94% cut). **Rule: native captioned video or text in the post; the waitlist URL goes in reply 1.** Replies are weighted heavily (~directional: ~150x a like) — the founder living in the replies is strategy. X Premium ($8/mo) is cheap launch-month insurance, but the claim that it exempts links is unverified — assume it does not.

**Posting strategy:**

- **Launch-day storm, not one tweet:** master thread + 5–10 supporting posts through the day (clips, screenshots, replies-as-posts).
- Demo video: 30–60s, captions burned in (~80% sound-off), native upload (multiplier direction solid, magnitude soft).
- Thread skeleton for the founder story (day 3): hook → problem → founder story → what's real (numbers) → the wrong calls too → CTA in reply. Full copy: [`02`](./02-prelaunch-copy-pack.md) §1.
- **Reply-guy routine (45–60 min/day, founder):** reply substantively within 15–60 min to posts from PM/AI accounts; never pitch in replies — the bio and pinned post carry the product. Target ecosystem: levelsio (892K, actively quote-boosts builders' launches in 2026), Marc Lou, Tony Dinh, Arvid Kahl, swyx/Latent Space; PM side: Aakash Gupta (~180K on X). **No evidence Lenny or Aakash amplify cold launches — the route to them is the sponsorship/relationship path (§10), not tagging.**

**Realistic reach (the honest number):** accounts that get launch-day reach posted consistently for ~6 months prior. Fresh accounts reach ~nobody. Floor case from the research: 600 followers → 150K impressions but 12 signups over 6 weeks. Our counter: the wave is designed to be _quote-tweetable by bigger accounts_ (evidence, teardowns, the built-itself PR), and the DM motion doesn't need reach. Directional benchmarks if the account grows: 3,500 followers ≈ 450 launch signups (~directional, uncredited).

**Success metrics:** saves/bookmarks + profile clicks + waitlist referrals tagged from X; 3+ quote-tweets from 10K+ accounts during the wave = the breakout signal.

**Common mistakes:** links in the post body; posting the thread and leaving; AI-sounding copy (it gets called out here as fast as on HN); buying engagement.

---

## 7. LinkedIn

**Why it matters:** where the actual buyer (senior PM, head of product) scrolls at work. By design anti-viral (dwell-time ranker "360Brew"; 61+ sec dwell ≈ 15.6% engagement vs 1.2% for skims) — treat it as the **credibility layer for the DM motion**, not a conversion channel. No verified 2025–26 case of a LinkedIn-primary AI tool launch with hard numbers exists — plan accordingly.

**Format ranking (AuthoredUp 3M+ post dataset):**

1. **Document/PDF carousels — 6.60% avg engagement, +39% reach vs average, and only ~4.9% of creators use them** (the low-competition gap). 5–15 slides. The day-4 evidence drop and the day-5 teardown both become carousels.
2. Native video (5.60%, 45–90s).
3. Text-only (~2% but highest raw-reach ceiling; 150–300 words).

**The stale-playbook trap (flag to everyone):** **the link-in-first-comment workaround is DEAD as of early 2026** — it is now also penalized. External links cost ~60% reach. Options: native documents (no link needed), link in profile, "comment TEARDOWN and I'll DM you" gating (which also feeds the DM motion), or eat the tax on the one day it matters.

**Supaprod + voice:** 3–5 posts/week during the wave; hooks in the first ~210 chars/3 lines; contrarian and specific-number hooks outperform (~3x, ~directional). AI-fingerprint phrasing correlates with −47% reach (~directional) — the humanized-output rule is also an algorithm strategy here. Saves are reportedly the strongest signal — end posts with something worth saving (the checklist, the scorecard), not "thoughts?".

**Engagement tactics:** founder comments substantively on PM-leader posts daily (same reply-guy logic); DM follow-ups within 24h of any meaningful comment on our posts — commenters are self-identified warm leads for [`03`](./03-customer-discovery-and-validation.md)'s pipeline.

**Success metrics:** DM conversations opened per post (the real number); saves; profile views → connection requests from ICP titles. Impressions are vanity here.

**Common mistakes:** link in first comment (dead); >3 hashtags (−68%, ~directional); posting the X thread verbatim (format mismatch); pitching in other people's comments.

---

## 8. Reddit

**Why it matters:** converts skeptics better than any launch platform (~directional: a good 50-upvote thread beats PH for qualified signups) — but it has the strictest etiquette and the longest runway. **Accounts season for 2–3 weeks first (start day 0); product posts land week 2+.**

**Per-subreddit verified rules (pulled from live rules pages 2026-07-12; counts unreliable post-API-change — check sidebars at post time):**

| Subreddit | Rule (verbatim-based) | Our play |
| --- | --- | --- |
| r/ProductManagement | "No Self-Promotion or spam." ONLY exception: **Friday Show and Tell thread** | Friday thread in listing week; before that, product-nameless discussion posts (e.g. "why outcome tracking dies in every PM tool") — product named only in comments if asked |
| r/SaaS | "No Direct Sales Or Non-Productive Self-Promotion"; blog links only if the ideas are IN the post. Unconfirmed Apr 2026 change: 60-day self-promo cap + AutoMod URL blacklist — **behave as if true** | Metrics-forward lessons post ("what 13 months of dogfooding an agent engine taught us"), product incidental |
| r/startups | No promotion except the **Share Your Startup** sticky; general posts must not name/link your project; feedback → weekly Feedback Thread (weekly reposting explicitly invited) | Both designated threads, weekly, every week |
| r/SideProject | No self-promo ban; required title: `[Project name] - [Short description]` | Best fit for the straight launch post |
| r/microsaas | 3 rules: on-topic, respectful, no spam; founder posts are the norm | Direct launch post; verify activity first |
| r/AI_Agents | Links in comments not posts; projects → **weekly project display thread**; explicit 1-in-10 self-promo ratio | Strong fit (we ARE an agent product): weekly thread + genuine participation |
| r/ArtificialInteligence | "Project/Build" flair explicitly for things you built (technical context required) | Technical "how we built the agent loop + trust ramp" post |
| r/artificial | No explicit ban; net-downvoted → removed | "We built X, honest feedback wanted" framing |
| r/ChatGPT | Rule 3: no posts solely advertising another LLM service | **Skip** — we'd be the banned category |
| r/ClaudeAI, r/ClaudeCode | Rules not retrieved — **manual sidebar check before touching** | Highest relevance ("Claude Code for the product lifecycle") — check rules day 0, plan a how-it's-built post |

**Cross-cutting etiquette (all subs):** 90/10 participation ratio; **"full disclosure, I built this" is the single most effective removal/backlash shield**; answer every comment; never post the same content to multiple subs the same day.

**Success metrics:** comment quality and DM inbound, not upvotes; waitlist signups tagged from Reddit; zero removals (a removal burns the account's standing in that sub).

**Common mistakes:** posting with a fresh account (AutoMod removal); links in post bodies where rules forbid; ignoring the designated-thread structure; arguing.

---

## 9. Slack / Discord communities

**The map (verified alive, mid-2026):**

| Community | Size / status | Fit | Entry + etiquette |
| --- | --- | --- | --- |
| **Lenny's Slack ("Friends of Lenny's")** | 15–30K (conflicting first-party figures); #ai channel 50+ substantive msgs/day; senior PMs from Linear/Notion/Figma/Stripe | **Best audience match of any channel in this document** | Paid newsletter sub gates entry. Join day 0, contribute genuinely, surface Supaprod only in-context (e.g. answering "how are you using agents"). Internal self-promo rules unverified — assume strict |
| **AI Tinkerers** | 116K+, 247 cities | Product engineers + AI-forward PMs | **Explicitly bans pitching.** 5-min live demos of HOW you built it, no decks. Perfect slot: "how we built a trust-ramp for autonomous agents" demo. Post-event Science Fair for the informal showcase |
| **Lovable Discord** | 171K, "made with Lovable" showcase culture | Natural fit — Supaprod is built on Lovable | Showcase channel per its rules; the "product built on Lovable that orchestrates builds" story lands here ([`04`](./04-growth-engine-metrics-and-experiments.md) co-marketing loop) |
| **Latent Space Discord** (swyx) | The applied-AI-eng home in 2026 | Agent-architecture credibility | Norm: "bring a build or a result." Verify it's swyx's server (a lookalike exists) |
| **Anthropic Developer Discord** | Claude Code + agent channels | We're Claude-Agent-SDK-based (beta driver, PC-35) | Technical space; share the build, never pitch |
| **Product-Led Alliance Slack** | 14–15K, free | PLG/product ops | Rule: "learning and knowledge-sharing, not selling"; mentions only in-context with disclosed affiliation |
| **Product School Slack** | 100K+ claimed | Broad PM, junior-skewed | Free; check self-promo rules on join |
| Indie Hackers | Alive, below peak | Founder segment | Product showcase mechanism exists; honest build story fits |
| Ramen Club / src.club / AI Builder Club | Small paid circles | Relationship channels | Weekly demo days — book one, not for reach but for reps + quotes |

**The dead/unverifiable list (do not spend time):** GrowthHackers Slack, standalone Product Hunt Makers Slack/Discord, an official r/ProductManagement Discord (doesn't exist), Reforge network without a $2K program purchase, Maven cohort Slacks, "Build Club" (name collision — disambiguate before citing). Mind the Product Slack: 60K on paper but the org has largely moved off Slack and its rules remove ANY product promotion — low launch ROI.

**Success metrics:** conversations started and DP candidates met, per hour spent. Communities are a week-2+ harvest from day-0 seeds; the wave does not depend on them.

---

## 10. Newsletters and podcasts

**Newsletters (the in-window play):**

| Outlet | Audience | Route | Action + timing |
| --- | --- | --- | --- |
| **Aakash Gupta, "Product Growth"** | 236–249K subs, 40–45% open rate | productgrowthppp@gmail.com (published sponsor route) | **Email day 0–1 — the single best realistic PM slot in-window.** Sponsor CTR 0.4–1.2% → a placement plausibly lands 1,000–3,000 clicks of exactly our ICP |
| **How I AI (Claire Vo, Lenny network)** | Newest show in the network | jordan@penname.co | Email day 0–1. Cursor already sponsors — the slate is proven AI-dev-tool-friendly |
| **TLDR AI** | 1.1M readers, 47% open | advertise.tldr.tech | $5,000–15,000/slot (published). Only if budget approved and a slot exists in-window |
| **Superhuman AI** | 1.5–2M | joinsuperhuman.io/ad-sponsorships | "AI Tool of the Day" placement — inquire, cheaper than TLDR |
| Paved / Swapstack marketplaces | Mid-tier newsletters | Direct | Check remnant/last-minute inventory — the only route to landing something inside 7 days |
| Lenny's Newsletter | 1M+ | No public route | Booked far out; NOT cold-buyable in 25 days. Do not burn the contact on a sponsorship ask now |

**Podcasts — post-traction, explicitly:** Lenny's Podcast guest policy states it does **not** prioritize founders/CEOs; the founder exception bar is Cursor/v0/Lovable-level heat. No Priors and Latent Space book on relevance/notability. **Verdict: podcasts are the week-6+ PR channel once beta stories and numbers exist. The one exception:** the 90-day guest-booking system (50 shows, 3 tiers, 120-word pitches referencing a specific episode) starts its clock now because bookings land in 4–8 weeks anyway — pitches drafted in [`02`](./02-prelaunch-copy-pack.md) §7, send in week 2.

**Common mistakes:** pitching Lenny's Podcast pre-traction (burns the future slot); sponsoring a 1M-generalist letter when 240K-of-exactly-our-ICP is available; newsletter copy that reads like an ad instead of a story.

---

## 11. Overlooked channels

- **Reforge alumni network** — 8,300+ professionals, 2,100+ in PM roles at high-growth companies; unusually senior and high-trust. No cold blast possible (program-gated) — but any single Reforge-alum design partner opens referral paths (68% of hires there flow through alumni referrals; the trust graph is real). Ask every early user "are you in Reforge/a PM community?" and request one intro.
- **Product Manager HQ** — 7K members, one-time $25 entry, low founder competition. Cheap seat, join day 0.
- **University/MBA PM clubs** (MIT Sloan, Kellogg, Booth, Columbia, Simon) — slow-burn; recent-grad founding PMs at seed startups are in-ICP. One templated workshop offer ("bring your roadmap, the Critic tears it down live") emailed to 5 clubs = a week-4+ pipeline for near-zero cost.
- **GitHub** — the ARD open-spec idea ([`05`](./05-viral-and-guerrilla-playbook.md) idea #13): "ADR for product decisions," Supaprod as reference implementation. Compounds past the wave; the repo also gives the HN crowd something to star (the +121 stars/24h halo).
- **Marketplace directories** — Slack App Directory, Linear integrations page, Notion integrations gallery: free, permanent, high-intent listings once the OAuth registrations clear (plan §4 — Linear + Notion first). Each listing is a standing acquisition page; file listings the day each registration clears.
- **The waitlist itself as a channel** — every bet-submission teardown delivered ([`05`](./05-viral-and-guerrilla-playbook.md) idea #2) is a personalized artifact the recipient can share; ask permission at delivery ("screenshot-friendly, if you're inclined"). Owned, zero-cost, and it compounds with volume.

---

_Every number above marked ~directional is soft; treat the VERIFIED platform rules as hard constraints. When a channel's live rules contradict this file, the live rules win — and this file gets updated the same day ([`00`](./00-launch-operating-manual.md) §8 daily cadence)._
