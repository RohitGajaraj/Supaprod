# 07 — GTM ground truth, verified 2026-07-14

> _Created: 2026-07-14 · Status: **VERIFIED SNAPSHOT** — a code-and-dashboard-audited reading of where the launch actually stands, against the 7-day sprint in [`00-launch-operating-manual.md`](./00-launch-operating-manual.md)._
>
> **Why this file exists:** the sprint calendar (Day 0 = Jul 12) says the public wave opens Jul 15. A four-agent audit on Jul 14 (dashboard rows + live codebase grep + checklist cross-reference + git history) found we are still functionally at Day 0. This file records that audit so no session re-derives it or, worse, trusts the calendar. When the landing page v2 plan ([`planning/archive/landing-page-v2-plan.md`](../planning/archive/landing-page-v2-plan.md)) and this file disagree on what exists, re-verify in code.

---

## 1. The launch checklist, audited (3 of 11 done)

Checklist source: [`00-launch-operating-manual.md`](./00-launch-operating-manual.md) §4. Every verdict below was verified against the codebase and dashboard on 2026-07-14, not read off the plan.

| # | Item | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | LOOM publish + migrations | ✅ DONE | All migrations applied live (head `20260711010000`+, re-confirmed through the Jul 13 Lovable publish commit `692a9be3`); app published to cadence-flow-beta.lovable.app |
| 2 | Public homepage + waitlist + funnel events | ◐ SPLIT | Homepage ✅ (PC-03, live with /privacy /terms /security /updates). **Waitlist ✗ — zero code.** `grep -rli waitlist src/` returns nothing; the live page ships a direct `/signup` CTA. Funnel events ◐ — `funnel_milestones` fires 4/5 stages post-signup, but no pre-signup visit→waitlist→referral funnel exists and no posthog-js SDK is installed client-side |
| 3 | Google OAuth verification submitted | ✗ NOT DONE | Precondition (live homepage + privacy policy) cleared Jul 10 via PC-03; no doc records a submission since. Still an unexecuted founder action |
| 4 | Failure-path GIF + 3 demo GIFs + 60s video | ✗ NOT DONE | Only shot-list briefs exist (`docs/pitch/launch-assets.md`); its own checklist boxes all unchecked. **Founder ruling 2026-07-14: no recorded demo video — the landing page must showcase the product through built (code-rendered) means instead.** See landing-page-v2-plan |
| 5 | Copy pack approved | ✗ NOT DONE | `02-prelaunch-copy-pack.md`: 17 assets drafted, 17 founder-approval boxes unchecked |
| 6 | Prospect list 300+ with hooks | ✗ NOT STARTED | No list exists anywhere in the repo; only the sourcing methodology (03) is written. (PC-13's 25 design-partner targets ARE verified and sendable — a separate, smaller list) |
| 7 | Email domain warm-up started | ✗ NOT STARTED | No record of the Instantly (or equivalent) signup. **This is a 30-day clock; every day of delay pushes cold email back a day. Highest-urgency clock-starter.** Note: `supaprod.ai`'s primary domain + inbox routing (`hello@`/`founder@`/`security@`/`sales@`/`privacy@`/`investors@`, catch-all) is now live — see [`operations/domain-and-email-setup.md`](../operations/domain-and-email-setup.md) — but this is a *separate* concern from the cold-outreach warm-up domain, which should be its own variant/lookalike domain, not `supaprod.ai` itself. |
| 8 | DP terms + agreement ready | ✗ NOT DONE | Talking points exist (03 §11); no signable Common Paper doc anywhere |
| 9 | No-signup demo (PC-04) | ✅ DONE | `/demo` live in production, read-only against the real demo workspace (`src/routes/demo.tsx` + `demo.functions.ts`); `activation_events` sink live. Plus `p.teardown.tsx` — paste-a-bet public Critic teardown, also no-signup. **The Show HN hard gate is cleared** |
| 10 | ToS + privacy live | ✅ DONE | `src/routes/terms.tsx`, `privacy.tsx`, `security.tsx` — live, linked from the homepage footer |
| 11 | Billing path executed | ✗ DEFERRED | Founder ruling 2026-07-11: rail decision deferred. Stripe is the wired default (sandbox-verified, live keys slot in config-only); Paddle adapter built and inactive. `credits_enabled` is ON in prod. No live card taken yet |

## 2. The G17 board (PC-01..27), one-line tally

13 ✅ done · 5 ◐ partial · 9 ⬜ open (of which most are gated on external reality, not build work).

- **Done and load-bearing for launch:** PC-03 homepage, PC-04 no-signup demo, PC-07 verifier gate (armed in prod), PC-08 routines, PC-10 rewind, PC-12 fan-out (dormant behind `AGENT_FANOUT`), PC-15 feedback loop, PC-16 judgment-memory moments, PC-22 eng evidence chain, PC-26 HyperAgent rig (verified running), PC-27 YC application assembly (voice pass + submit remain founder's).
- **Partial:** PC-05 billing (◐ awaiting MoR/keys), PC-06 funnel (◐ ~90%, week-2 cron line remains), PC-11 confidence-gating (playbook leg live; rest gated), PC-13 design partners (kit + 25 verified targets ready; **0/25 sent** — founder-gated), PC-14 launch execution (~55%, assets drafted; needs 2-3 real beta stories).
- **Open but honestly gated:** PC-17/18 (G-LEARN needs external users), PC-19 (G-REV needs paying workspaces), PC-09 Slack app, PC-20/21/23/24/25 post-launch gates.

**The pattern:** the product side of launch is essentially ready. Every remaining blocker is either a founder action (send, approve, submit, sign up) or a GTM artifact that was never built (waitlist, prospect list, showcase assets).

## 3. Where the last two days actually went

Of 51 commits since Jul 12: zero touched a launch surface. Jul 12 evening went to test coverage + the G-PRICE billing engine (legitimate blocker-clearing). Jul 13 evening through Jul 14 early hours went entirely to the Tempo V5 app port + brand identity (103-file design-system port, Today hero, TopBar, avatars, Ask redesign, CadenceMark logo + 55-file brand kit + favicon). High-quality work — and a real two-day drift from the sprint's own Day 1-2 themes ("launch surface live", "ammunition ready") against the binding "<25 days, gates not dates" ruling.

**Silver lining, now load-bearing:** the brand kit + CadenceMark + Tempo V5 system produced exactly the assets the landing page v2 rebuild needs. The drift accidentally paid for the redesign's foundation.

## 4. What fires next (the corrected order)

1. **Clock-starters, today, zero dependencies (founder, ~30 min):** start email domain warm-up (30-day clock); submit Google OAuth verification (blocker already cleared).
2. **Landing page v2** — the founder's directed focus as of 2026-07-14 (this session). The waitlist mechanic gets resolved INSIDE this rebuild, not as a separate fork: plan at [`planning/archive/landing-page-v2-plan.md`](../planning/archive/landing-page-v2-plan.md).
3. **Then the wave** — the Day 3-7 content sequence fires only after the new surface + approved copy exist. The calendar dates in `00` shift right accordingly; the sequence and tiered targets stand unchanged.
4. **In parallel, founder-only queue:** copy-pack approval pass (17 boxes), DP terms doc, the 25 PC-13 sends.

## 5. Standing facts every future session should carry

- Production is current: all migrations applied, app published, verifier armed, `credits_enabled` ON.
- **Zero external users.** **6 workspaces, all founder or test accounts. No customer data at all.** 18 missions · 5 decisions · **0 learnings.** The loop is wired and proven; it begins accruing on first real use. The earlier engine-warmth figures were seed data and are retired (`../pitch/verified-numbers.md`).
- The demo path for strangers exists TODAY: `/demo` (read-only real workspace) + `/p/teardown` (paste-your-bet Critic teardown). The landing page's job is to route people into them.
- No waitlist exists in code. Any copy promising queue mechanics is describing an unbuilt thing.
- Nothing outward has been sent, posted, or published. The HN/PH cards remain unspent.
