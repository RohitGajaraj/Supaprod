# 06 — YC & fundraising readiness: the evidence engine

> _Created: 2026-07-12 · Part of the [GTM launch operating manual](./README.md). This file is NOT the application — the live application package is complete in [`../pitch/yc/`](../pitch/yc/fall-2026-application.md) (Fall 2026, deadline **July 27, 2026, 8pm PT**, rolling review). This file is the **evidence engine that feeds it**: what the launch must generate, capture, and prove so the application and every investor conversation runs on real customer outcomes, not narrative. Routing rule: anything here that changes positioning language gets distilled INTO `docs/pitch/` in the same session (never parallel copies)._

**Contents:** [The batch decision](#0-the-batch-decision-fall-2026-vs-w27) · [What investors weigh](#1-what-investors-actually-weigh-ranked) · [The quote vault](#2-the-quote-vault) · [Traction hierarchy](#3-the-traction-metrics-hierarchy) · [PMF experiments](#4-experiments-whose-results-are-fundraise-evidence) · [Gate → narrative map](#5-milestone-map-gates--what-you-can-truthfully-say) · [Mistakes that weaken](#6-mistakes-that-weaken-the-application) · [The Friday ritual](#7-the-weekly-evidence-ritual)

---

## 0. The batch decision: Fall 2026 vs W27

Two honest paths exist, and the founder has already ruled Fall 2026 live (application-strategy.md header). The compressed launch sprint (viral wave inside 7 days from 2026-07-12) changes the math: launch evidence CAN now exist before July 27 — roughly 8–15 days of real data, not zero.

| Path | What you submit with | Strength | Risk |
| --- | --- | --- | --- |
| **Submit Fall 2026 (Jul 27)** — the ruled default | 8–15 days of launch data: first external workspaces, first waitlist→activation conversions, 2–5 design partners in first sessions, possibly a first paid pilot. Framed as _velocity + curve just starting_, per YC's own FAQ that progress since a prior application "is a strong signal." | Rolling review rewards early submission; the prior application rolled forward, so the delta story is built in. A live wire, however small, beats a plan. | 15 days can't show retention cohorts. If the launch slips and the application shows _zero_ external users at submit time, it reads as the same application as last batch — that burns the shot. |
| **Wait for W27 (~Nov)** — the fallback | 12–14 weeks of week-over-week curves, retention cohorts, paying workspaces, NRR early signal. Matches YC's "8–10 weeks of clean data" guidance. | The strongest version of the evidence this file defines. | Momentum risk: four months is an eternity in the 2026 agent market; the empty-cell positioning (outcome-linked ranking) may not stay empty. |

**Decision criteria (check on July 25, two days before deadline):** submit Fall IF all three hold — (a) ≥5 external workspaces have completed a first session, (b) ≥1 genuinely quotable moment is in the vault (§2), (c) the demo runs end-to-end on a fresh production account. If any fails, the application ships anyway ONLY if the founder can honestly write "doors opened [date], here is the first week's curve" — otherwise hold for W27 and treat Fall as the free option it is (a rejection with a later progress delta is YC-tolerated; a vague application is not).

**Next action:** put the July 25 checkpoint in the calendar now; the sprint plan (file 00) already sequences the evidence to make (a)–(c) true.

---

## 1. What investors actually weigh (ranked)

Pre-seed, AI B2B, solo founder, 2026 market. Ranked by how much each moves a partner or angel, with the Supaprod-specific form of each:

| Rank | Signal | Supaprod's version | Status |
| --- | --- | --- | --- |
| 1 | **Genuine usage by strangers** — people with no relationship to the founder, returning | Weekly closed loops per external workspace (decision → shipped → outcome recorded); week-2 return | ROADMAP until launch — this is what the sprint exists to create |
| 2 | **Willingness to pay** — a real card, a paid pilot, even one | First credit purchase through the live billing path (PC-05, Stripe sandbox-verified) | WIRING — billing built; first real charge is the event |
| 3 | **Founder velocity + learning rate** — shipped-per-week and decisions-changed-by-evidence | The public commit history (hundreds of receipted ships), the register + independent code audit, and after launch: "we learned X in week 1 and changed Y" | PROVEN (velocity) / ROADMAP (learning-from-users) |
| 4 | **The un-backfillable data story — the FORECAST, not the record** (corrected 2026-08-10; the record is backfillable and was backfilled twice on the record, see [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) §2) | What a team believed would happen, captured before the outcome was known — the one part of a decision that leaves no trace unless recorded at the time. The mechanism is in the code and checkable there: the writer that records a settled outcome against the decision that caused it exists at `outcome.functions.ts:632`, and the re-ranking reads it. **There is no founder-data number to quote, and that is the corrected position** | WIRING — the loop is wired and proven, and it begins accruing on first real use |
| 5 | **Named pull quotes** — real people, real companies, permissioned | The quote vault (§2) | ROADMAP — empty today, by design of honesty |
| 6 | **Market timing evidence** — cited, dated, not vibes | Already banked: YC's own RFS language, the 2026 competitive sweep's empty cell, the absorb pattern (Cycle→Atlassian, Kraftful→Amplitude) | PROVEN (documented in `docs/research/`) |

The order matters: a partner discounts 3–6 without 1–2. Everything below in this file exists to generate ranks 1, 2, and 5 during the launch — the only three that cannot be manufactured in a doc.

---

## 2. The quote vault

**What it is:** one file of verbatim, dated, permissioned customer quotes — the raw material for the application's "who's using it" field, the interview's "show me a user" moment, and every investor update. Dogfood it: each quote is filed as a signal in Supaprod itself, tagged `quote-vault`, THEN distilled into `docs/pitch/one-pager.md`'s honest-numbers section when used publicly.

**Capture rules:** verbatim or don't file it (paraphrase is worthless under partner probing) · date + name + company + context line · ask permission in the moment ("mind if I quote that, with your name?") — the ask itself is a signal (people who say yes are advocates; log refusals too) · capture at the moment of delight or the moment of money, never retroactively by email (retroactive asks produce polite fiction).

**The eight archetypes worth hunting** (a vault with one of each beats fifty generic compliments):

| # | Archetype | The shape of it | Why it converts investors |
| --- | --- | --- | --- |
| 1 | **The switched-from** | "I stopped doing X in [tool] because Supaprod…" | Proves displacement, not addition — budget comes from somewhere |
| 2 | **The pay quote** | "Can I pay you?" / "what does the paid tier get me?" — unprompted | The only pricing validation that matters pre-revenue |
| 3 | **The retention quote** | "It's part of my Monday now" / evidence of a ritual formed | Retention narrated by the user beats a chart at this scale |
| 4 | **The wrong-then-recovered** | "It ranked X wrong, I reverted, and the track record showed me why — that's when I trusted it" | THE Supaprod-specific quote: the trust thesis in a customer's mouth. Hunt this one hardest. |
| 5 | **The time-saved-with-a-number** | "The Monday brief saves me ~2 hours of Slack archaeology" | Numbers in quotes survive diligence; adjectives don't |
| 6 | **The upset-if-it-died** | "Don't kill this / what happens to my track record if you shut down?" | YC's literal live-wire test, verbatim |
| 7 | **The unprompted share** | Screenshot of them sending a teardown/track record link to a colleague | Word-of-mouth caught in the act — attach the artifact |
| 8 | **The accountable-exec** | "I showed the decision record to my CEO/board" | The enterprise expansion story, one sentence long |

**Why/impact/effort:** near-zero effort (a capture habit + one file), highest leverage per minute of any GTM activity in this manual. **Success metric:** ≥1 quote in archetypes 2, 4, and 6 by July 25; ≥5 archetypes filled by G-BETA. **Next action:** create the `quote-vault` tag and file template during sprint day 1; add the permission-ask line to the beta session script (file 03).

---

## 3. The traction metrics hierarchy

Zero-base honesty is the constraint and the asset: every number starts at zero on a knowable date, so _curves are clean_. Rank of what to lead with:

1. **Weekly closed loops per external workspace** (the north star, plan §1) — nobody else in the category can even measure this; reporting it IS differentiation.
2. **Week-over-week active external workspaces** — small and true: "0 → 7 → 16 → 31" reads formidable _because_ it starts at zero on launch day.
3. **Week-2 return rate** of activated workspaces — the first honest retention signal available inside the window.
4. **Paying workspaces + first dollars** — 3 paying at $49 beats 3,000 free signups in every serious room. Report the absolute number and the ask-to-close story.
5. **Activation rate** (signup → first receipted value moment, the G-SPRINT definition) — proves the product, not the marketing.
6. **Unprompted share events** (teardown/track record links sent outward) — the organic-pull proxy; each one is also a quote-vault candidate (§2.7).

**Explicit vanity list — never lead with these, cap them to one context line:** waitlist size (intent without friction is noise — see file 04's waitlist-qualification design for how we make ours _partially_ honest), social impressions/followers, HN points/PH rank (report what they _converted to_), GitHub stars, demo-video views, "pipeline." The internal rule extends the repo's claim discipline: **a metric may be reported only with its conversion to the next real step attached** ("2,400 waitlist → 310 activated → 41 week-2 active" is a story; "2,400 waitlist" alone is theater).

**Next action:** the metrics pack (file 04 defines the dashboard) gets a one-page investor view with exactly the six metrics above, auto-filled weekly from the live DB — numbers must trace to the DB or a dated source (Pitch Room rule 3).

---

## 4. Experiments whose results are fundraise evidence

Each launch experiment below is designed twice: once to learn (primary), once because its _result is itself an artifact investors weigh_ (secondary). Full experiment specs live in file 04; this table is the fundraise view.

| Experiment | Design (one line) | The evidence it mints | Success threshold |
| --- | --- | --- | --- |
| **Paid-pilot conversion** | Offer every design partner a paid pilot at the end of week 2 (real price, real card, founder discount allowed and disclosed) | WTP proof + the pay-quote (§2.2) + conversion % from engaged-free to paid | ≥2 of 10 partners convert |
| **Concierge WTP test** | Before the feature exists, sell the outcome manually ("I'll run your signal triage this week — $X") to 5 non-partner prospects | Demand for the _job_ separated from the product's polish; a number for "what is the job worth" | ≥1 accepts at a non-trivial price |
| **Unprompted-share rate** | Instrument teardown/track record share links; count shares not prompted by the founder | The organic-pull metric + screenshot artifacts (§2.7) | ≥10% of active workspaces share within 2 weeks |
| **Week-2 retention cohort** | Cohort every launch-week activation; measure return in week 2 without any founder nudge that week (nudge-free by design, or the number lies) | The first honest retention curve | ≥40% week-2 return of activated workspaces |
| **The design-partner renewal decision** | At day 30, each partner explicitly decides: continue (paid or committed), pause, or stop — forced, recorded, with reason | Churn-with-reasons at n=10 — the densest learning artifact per user available at this stage | ≥6 of 10 continue; every "stop" has a verbatim reason filed |
| **Pricing-page honesty test** | Publish real prices from day 1 (no "contact us"); measure tier-click → checkout-start → completion | The pricing-validation curve + where hesitation lives | Checkout-start rate measured (any value); ≥1 completion |

**Why this framing matters:** at the YC interview, "we ran six pre-registered experiments; here are the numbers, including the two that failed" is a formidability signal no polished deck matches — it demonstrates learning rate (rank-3 signal, §1) with the evidence.

---

## 5. Milestone map: gates → what you can truthfully say

The v13 gates are already the operating calendar; this maps each gate to the sentence it unlocks. The rule is mechanical: **a sentence enters the application, the interview, or an investor update only when its gate has closed.** Until then it is WIRING and stays internal.

| Gate | Closes when | The sentence it unlocks (truthfully) | Fundraising beat |
| --- | --- | --- | --- |
| **G-SPRINT** | A stranger signs up, connects a source, gets a Critic teardown of their own bet, unassisted, <10 min | "A stranger can get value from Supaprod in under ten minutes, unassisted." | Application: product-readiness; demo confidence |
| **G-BETA** | 10+ external beta workspaces active; loop closes live in demo; a real card buys credits | "Ten external product teams run Supaprod weekly; the first customers have paid." | The live wire. This gate is the difference between a good and a fundable application. |
| **G-LAUNCH** | Listed publicly; ≥50 external workspaces; ≥20 weekly-active | "We launched on [date]; here is the week-over-week curve since." | Momentum narrative + the HN/PH story as distribution proof |
| **G-REV** | ≥10 paying workspaces, first revenue booked | "Revenue is real and growing off a knowable zero." | Seed-round opener; converts YC from accelerator-ask to allocation-competition |
| **G-LEARN** | Judgment memory felt by users; outcome contracts GA | "The system provably gets better from customers' own outcomes — here's a user saying so." | The moat, demonstrated instead of argued — the series-A story seeded at pre-seed |

**Interview readiness by gate:** G-SPRINT → demo drills possible on fresh accounts. G-BETA → the "who uses it TODAY" answer has names. G-LAUNCH → the numbers card (interview-prep.md) fills with real values. Never rehearse an answer whose gate hasn't closed; partners probe exactly one layer deeper than the claim.

---

## 6. Mistakes that weaken the application

The anti-pattern list, each with the discipline that prevents it (most are already standing repo rules — listed here because launch pressure is when they break):

1. **Claim outruns wiring.** The self-improvement loop, connector breadth, enterprise readiness — say only what demonstrably runs (the PROVEN/WIRING/ROADMAP tags exist for this; the sanitizer is the habit, the tag is the gate).
2. **"AI PM tool."** Banned vocabulary (v13 §8) — the category label pattern-matches to the 2026 graveyard (Cycle, Kraftful). The category is _the decision and outcome operating system_; the hook is the Cursor transfer line.
3. **Vanity numbers, or true numbers framed as more.** No run-rate multiplication, no waitlist-as-traction, no "pipeline." Partners now explicitly discount run-rate theater; one inflated number poisons the true ones.
4. **Guru citations.** Artifacts and companies only (Pitch Room rule 2). "A 480-point r/ProductManagement thread says X" survives probing; "[influencer] says X" invites an eye-roll.
5. **Hiding the engine-first history.** Thirteen months building with zero external users is a _liability if concealed and a story if framed_: the strategy corpus predicted the shape (capability before showcase), an independent audit confirmed the build, and the doors opened on [date] — then show the curve. Partners respect a named risk with a mechanism; they reject a gap they find themselves.
6. **Manufactured urgency or agreement theater.** The Garry Tan tension (full-autonomy vs our human-accountable design) is _named and answered_ in application-strategy.md §2 — keep it named. A reasoned disagreement is a formidability signal.
7. **Solo-founder evasiveness.** The bar is higher solo; the answer is the product's own story — one person shipping like a team through governed agent lanes, evidence public in the repo. Lean in; don't apologize.
8. **Submitting a plan instead of a wire.** If July 25 arrives and the §0 criteria fail, the strongest move may be NOT submitting the weak version — a burned first read costs more than a later application with a delta. Make the call on the criteria, not on sunk feeling.

---

## 7. The weekly evidence ritual

**20 minutes, every Friday, non-negotiable from launch week onward.** The compounding asset this file exists for is built here or not at all.

The ritual (in Supaprod itself — the evidence workflow IS a dogfood workflow):

1. **Metrics pack refresh (5 min):** the six §3 metrics pulled from the live DB into the investor one-pager view. Numbers that don't trace to the DB don't ship.
2. **Quote vault filing (5 min):** the week's captures filed with date/name/permission status; archetype coverage checked (§2 table — which of the eight are still empty?).
3. **Learning track record (5 min):** one line each — _what we believed Monday, what we learned, what we changed_. This is the learning-rate evidence (§1 rank 3) and it cannot be reconstructed later; three weeks of these lines is an interview answer no one else has.
4. **Distill outward (5 min):** anything that changes public positioning routes into `docs/pitch/` in place (one-pager honest numbers, qa-bank answers that got sharper from a real objection this week).

**Success metric for the ritual itself:** zero skipped Fridays; by the July 25 YC checkpoint the pack shows two completed cycles; by any investor conversation the founder opens the pack, not a memory. **Next action:** schedule the Friday block now; create the metrics-pack view during sprint day 2 (paired with the funnel instrumentation work, PC-06, so it's one wiring job, not two).

---

_Related: [00 — the 7-day sprint](./00-launch-operating-manual.md) sequences when each evidence stream starts · [03 — customer discovery](./03-customer-discovery-and-validation.md) owns the interview + session capture mechanics · [04 — growth engine](./04-growth-engine-metrics-and-experiments.md) owns the full experiment specs and dashboard. The application itself: [`../pitch/yc/fall-2026-application.md`](../pitch/yc/fall-2026-application.md)._
