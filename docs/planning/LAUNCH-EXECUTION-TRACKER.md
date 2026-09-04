# Launch execution tracker

> _Created: 2026-08-07 · Last updated: 2026-08-07_

> _Created 2026-08-07 · Rebuilt 2026-08-07 18:40 IST from live verification_

**This is the single board.** Every status below was checked against the live site, the live account, or the source on 2026-08-07. Where something was not checked, the row says `NOT VERIFIED` rather than guessing. A tracker that guesses is worse than no tracker, which is the lesson from the previous version of this file: it shipped rows marked done that were not done, and rows marked not-started that had shipped.

**Legend.** ✅ done and verified · 🔵 done, needs a founder action to land · ⏳ in progress · ⛔ blocked · ⬜ not started · ❓ not verified

---

## 0a. THE ACCESS MODEL CHANGED, 2026-08-07 evening

| Item | Owner | Status | Evidence | Next action |
| --- | --- | --- | --- | --- |
| **Signup is now GATED. Private beta, invite code only.** | Founder | ✅ `3ab2f3e8` | Was wide open with auto-confirm, which made the waitlist theatre: a queue for a product anyone could simply join. Founder reasons: scarcity, and "N requested access" reads differently in a deck than "N signed up free". **Counter-evidence recorded rather than argued away:** when the waitlist was the hero CTA, 1,294 visits produced ZERO rows. Gating costs top of funnel and he chose it knowingly. | **Founder: test the no-code screen and an `?invite=` link before any traffic is pointed at it.** This flow is live for every visitor now. |
| **YC and investor code** | Founder | ✅ seeded | `YC-COMPOUND-K7QR4V`. Unlimited, no expiry, case-insensitive. Link: `/signup?invite=YC-COMPOUND-K7QR4V`. Revocable at `/admin/invites`, and the redemption count survives revocation. | **Put it in the YC application, which currently says "sign up with your credentials" and would send a partner into a wall.** Recorded on the YC Notion page. |
| Seventeen marketing surfaces moved with the gate | Agent | ✅ `3ab2f3e8` | Hero, nav, pricing (including JSON-LD `InStock` to `LimitedAvailability`), demo, product, checkout, login, TrustClose, PreSignupCTA. A locked door under a page still shouting "Start free" is the same contradiction pointing the other way. | None. |
| **Launch date stays PUBLICLY WITHHELD** | Founder | ✅ ruled | Mid-September held internally; the founder wants the suspense. `LAUNCH_DATE` stays unset and A1 promises an invite code rather than a date. A test fails the build if a month name leaks while it is unset. | None. The exact day is still needed for Product Hunt scheduling, privately. |

---

## 0. THE ONE DECISION THAT GATES SCHEDULING

| Item | Owner | Status | Risk | Next action |
| --- | --- | --- | --- | --- |
| **Launch date** | Founder | ✅ **RULED 2026-08-07: mid-September 2026** | Resolved. It had been live as two different dates in two files, and three separate audits stopped on it before they could schedule anything. The 2026-08-06 direction moving launch to "this week" is reversed and recorded as such in `SOURCE-OF-TRUTH.md`. | **Remaining: pick the exact day.** Product Hunt needs one, Tuesday to Thursday is strongest, and Show HN goes D+7 at the earliest because HN vote-ring detection shadowbans the domain rather than the post. |

---

## 1. PRODUCT BOTTLENECKS FOUND AND FIXED TODAY

All verified before the change and tested after.

| Item | Owner | Status | Evidence | Risk if reverted |
| --- | --- | --- | --- | --- |
| **CTA contrast failed WCAG AA** | Agent | ✅ `4f6bd843` | White on ember measured **2.84:1**, needs 4.5:1, fails even the 3:1 large-text floor. Three instances: Hero "Start free", WaitlistForm "Join the beta", `/demo` CTA. `--cta-ink` (6.97:1) already existed for this and they bypassed it. | Legal exposure and the primary conversion button unreadable for low-vision users |
| **Free tier could not connect anything** | Agent | ✅ `fbf074a3` | `entitlements.ts:269` grants Free `connectorTier:"read"`, `connectorLimit:3`. `catalog.ts:148` derived `minTier:"pro"` for every read-only connector, so the UI never offered one. | Kills the "point it at your own data" activation motion entirely |
| **`/product` shipped 6 broken images** | Agent | 🔵 `b1c0602c` | All six `/images/*.png` return **200 with `text/html`**, ~30KB each. `public/images/` does not exist. Guarded so frames degrade cleanly. | Visible neglect on a core marketing page |
| **MCP advertised at a dead path** | Agent | ✅ `8893c4dc` | Agent card said `/api/mcp` → 200 `text/html`, no such route. Real endpoint `/mcp` → 401 JSON. | The one artifact whose job is to be followed by a machine, pointing at a webpage |
| **`/.well-known/mcp.json` absent** | Agent | ✅ `8893c4dc` | Returned the SPA shell with a 200. Now a real manifest. | Tracker's own words: "the strongest unclaimed asset the company owns" |
| **Marketing routes uncached** | Agent | ✅ `8893c4dc` | TTFB measured 0.76–1.9s, 3 runs each; connect+TLS only 20–150ms of it. 14 routes now `s-maxage=300, stale-while-revalidate=86400`. | 1.9s first impression on launch day |

---

## 2. PRODUCT BOTTLENECKS FOUND AND **NOT** FIXED

Ranked by launch-day cost.

| # | Item | Owner | Status | Risk | Next action |
| --- | --- | --- | --- | --- | --- |
| P1 | **`applyOutcome` has never completed in production** | Founder | ⛔ | `agent_memory where kind='outcome'` is **0** against 957 memories. The compounding claim, which is the only defensible layer, rests on a write path that has never once run. | Settle one spec through `/learn` on `helio-labs-harbor`, spec `60000000-0001-4000-8000-000000000031`. One action: exercises the path, gives `/proof` a real number, produces the only frame where compounding comes from the running system. |
| P2 | **Six product screenshots do not exist** | Founder | ⛔ | The guard hides the gap; it does not fill it. `/product` now shows six empty frames. | Capture and commit to `public/images/`. Note `docs/screenshots/` is gitignored, so they cannot be moved from there. |
| P3 | ~~Two contrast tokens fail AA site-wide~~ | Agent | ✅ `1df1ed26` | Verified fixed 2026-08-07. `--ink-faint` is `#7a8089` on the landing theme (4.97:1) and `#7a7a82` globally (4.65:1); `--text-subtle` is `#8b8b93` (5.86:1). The landing override in `inkTheme.ts` was the trap: fixing `ink.css` alone would have left the marketing site failing. | None. Both files carry a comment warning against restoring the old ramp "to recover the hierarchy", since that hierarchy was three steps of which two were unreadable. |
| P4 | ~~Font preload targets a retired stack~~ | Agent | ✅ `1df1ed26` | Verified fixed 2026-08-07. Preloads now name the faces the page actually paints with. | None. |
| P5 | **Missing H2s / landmarks** | Agent | ⬜ | `/pricing` and `/proof` have one H1 and zero H2. `/investors` and `/brief` have **zero headings and zero landmarks** in the parent document; `brief.html` has 16 flat H1s. | Promote plan names to `<h2>`; give `/investors` an `<h1>` and `<main>`. |
| P6 | **`authorization_servers: []`** | Founder | ⛔ | A discovering MCP client is told there is nowhere to authenticate, so it stops. | **Founder question:** does the MCP server delegate to Supabase or issue its own tokens? There is no `authorize`/`token` route to settle it. Not guessed at deliberately. |
| P7 | **Site-wide soft-404** | Agent | ⏳ | Every unknown path returns 200 with the SPA shell. `/.well-known/*` is fixed; the rest is not. | Needs the router to signal notFound. Larger change. |
| P8 | **App-shell JS on marketing routes** | Agent | ⬜ | 249.6 KB gzip across 34 preloaded files. `__root.tsx` ships QueryClientProvider, Radix AlertDialog and a Supabase auth listener to pages that render none of them. | Split the root: lightweight shell for public routes. |
| P9 | ~~Workspace invitations are broken by the gate~~ | Agent | ✅ `2e45ad2e` | Opened and closed the same evening. A workspace invitation is now its own proof of admission, **checked server side rather than trusted**: `?next=/join/<token>` is treated as a claim, the token is validated against `workspace_invitations`, and an invented one falls through to the code gate. Must be server side because the invitee deliberately has no RLS read on their own invitation. Fails closed on a read error; discloses exactly one bit. | None. Six parser tests cover `//evil.com/join/tok`, absolute URLs, query and fragment smuggling, path extension and malformed escapes. |
| P10 | **The gate is not server-authoritative** | Founder | ❓ **decision, not a bug** | `supabase.auth.signUp` is called by the BROWSER with the publishable key, so anyone skipping our form still gets an account. Every door the product shows is locked and every account created through one is counted, but the wall has a window. | **Founder question:** is "every visible door is locked" enough for a private beta, or does this need a Supabase auth hook on `auth.users` reading the code from `raw_user_meta_data`? The hook is higher blast radius and would block Google signup entirely. Not decided unilaterally. |
| P11 | ~~`/product` claims "Join 100+ design partners"~~ | Agent | ✅ | Removed 2026-08-07. There were no hundred design partners, no source for the number anywhere in the codebase, and nothing that would have made it true. It sat one line above the CTA on the page a partner or investor is most likely to be sent to. Replaced with the access model, which is true and checkable in one click. | None. A sweep of every public route found no other unsourced count, so this was the last one. |

---

## 3. SOCIAL ACCOUNTS

Verified against the live accounts, not the ledger. **The ledger was wrong in both directions before today.**

| Platform | Owner | Status | Verified | Next action |
| --- | --- | --- | --- | --- |
| **GitHub org** | Founder | ✅ | description, blog, email, avatar, `location: Remote`, `twitter_username: supaprodhq` all set via API | None. Recovery codes still unsaved, see §8. |
| **X `@supaprodhq`** | Founder | ✅ | Avatar ✅, banner ✅ (re-uploaded with the readable category line), bio ✅ full 156-char ratified copy | 2FA **declined** by founder, a standing decision, not a pending chore |
| **LinkedIn `company/supaprod`** | Founder | 🔵 | Logo ✅ square, tagline ✅, Overview ✅, website ✅, industry ✅, Founded 2026 ✅, **Specialties 20/20** ✅, cover ✅ live | **Variant F ready and not uploaded: LinkedIn throttled after 5 cover changes today.** File: `linkedin-cover-liftall-dark-4200x700.jpg`. Location skipped by founder ruling. |
| YouTube · Instagram · Threads · Bluesky · TikTok · Mastodon · Discord · Reddit · npm · PyPI · Product Hunt · Crunchbase | Founder | ⬜ | Unclaimed | Walkthroughs exist per platform in `../growth/brand-ops/social-accounts.md` §6. **Do not start these before §8 prerequisites.** |

---

## 4. MARKETING ASSETS AND COPY

| Item | Owner | Status | Where | Next action |
| --- | --- | --- | --- | --- |
| Brand kit, banners, avatars, square logo | Agent | ✅ | `docs/growth/branding/` | None |
| **Press kit** | Agent | ✅ | `docs/growth/press-kit.md` | 53 asset paths verified. Needs founder photo. |
| **Email sequences** | Agent | ✅ | `docs/growth/email-sequences.md` | 5 waitlist + launch + 3 onboarding + re-engagement. **Cannot send: see §5.** |
| **Community plan** | Agent | ✅ | `docs/growth/community-plan.md` | 10 rooms ranked, 30-day cadence |
| **Founder story** | Agent | 🔵 | `docs/pitch/founder-story.md` | 2 `[FOUNDER TO FILL]` block shipping |
| **Launch listings** | Agent | ✅ | `docs/growth/launch-listings.md` | PH, Show HN, IH, Reddit, Bluesky, Mastodon. All paste-ready. |
| **Brownfield positioning evaluation** | Agent | ✅ | `docs/strategy/brownfield-positioning-evaluation.md` | **Verdict: not a shift.** Already the shipped position. Real gap was the connector labelling, now fixed. |
| **Teaser video plan** | Agent | 🔵 | `docs/pitch/teaser-video-plan.md` | Beat sheet, tooling (~$34), what cannot honestly be filmed. **Blocked on P1**: the compounding frame needs one settled outcome. |
| LinkedIn cover variants | Agent | ✅ | 8 variants ship, none replaced | Founder chose F |

---

## 5. WAITLIST, EMAIL AND ANALYTICS

| # | Item | Owner | Status | Risk | Next action |
| --- | --- | --- | --- | --- | --- |
| A1 | Rate brake | Agent | ✅ | Was global 20/min, would have rejected the 21st genuine signup in any minute | Raised to 300/min |
| A2 | ~~No ESP key, sending domain unverified~~ | Founder | ✅ 2026-08-07 | Was: nobody who signs up can be emailed. `supaprod.ai` verified on the apex; `RESEND_API_KEY` in Lovable secrets. Cloudflare Email Routing survived intact (apex MX and SPF untouched, Resend confined to `send.` and `resend._domainkey`), so inbound still works. | Nothing. **Not yet proven end to end**: the domain has never sent a single message. |
| A3 | ~~No confirmation email~~ | Agent | ✅ `a5e79f76` | A1 fires from `joinWaitlist` on a genuine first signup. Guarded on `!alreadyJoined` so a repeat submission cannot earn a duplicate-send spam complaint, and it cannot throw, so a dead vendor cannot cost us the row. | **Two founder blockers before the four nurture emails behind it may send**: no postal address (CAN-SPAM, no entity incorporated) and unsubscribe is mailto-only, not RFC 8058 one-click. |
| C1 | ~~Nothing reads the funnel~~ | Agent | ✅ `3ec6b932` | `/admin/launch`: four funnel counts, signups per day, referrer breakdown, waitlist source. Admin-gated. The referrer was already being captured in `props.ref` and had simply never been displayed. | Nothing. C2 still open. |
| C2 | **Success criteria undefined** | Founder | ⛔ | Without numbers set beforehand, every result gets rationalised afterwards | Pick figures you would be disappointed by: signups, `/demo` sessions, PH rank at 24h |

---

## 6. LEGAL, TRUST, SUPPORT

| Item | Owner | Status | Note |
| --- | --- | --- | --- |
| `/privacy`, `/terms`, `/security`, `/subprocessors` | — | ✅ | All real routes, linked from footer. **This is usually what sinks a launch and it is done.** |
| Cookie consent | — | ✅ | **Closed 2026-08-07 by finding that none is required.** No cookie is set at all: the sidebar write is stock shadcn whose provider nothing imports. No third-party script loads and no browser analytics SDK is installed. The `session-id` feared here does not exist. Full inventory and the legal reading: [`operations/security/cookie-and-storage-policy.md`](../operations/security/cookie-and-storage-policy.md). |
| Contact route | Agent | ✅ | `hello@supaprod.ai` in footer |
| Help centre | — | 🔵 | `/faq` covers launch week. A real help centre is post-launch. |
| Status page | — | ⬜ | Deferred deliberately: with no customers there is nobody to inform. |
| **Security badge unopened** | Founder | ❓ | A "Security — 4 issues" badge was visible in the Lovable panel 2026-08-07 and never opened | **Open it before launch** |

---

## 7. DISTRIBUTION SEQUENCE

| Step | Owner | Status | Timing | Next action |
| --- | --- | --- | --- | --- |
| Product Hunt | Founder | 🔵 | D0 | Copy ready. Create page **unlisted** first. Maker account must be >72h old or PH shadow-filters it. |
| Show HN | Founder | 🔵 | **D+7, not D0** | Copy ready. Same-day risks vote-ring detection, which shadowbans the **domain**, not the post. |
| Indie Hackers, Reddit, Bluesky, Mastodon | Founder | 🔵 | D0–D+3 | Copy ready. Reddit needs a personal aged account; the brand handle must never be the poster. |
| Waitlist email | Agent | ✅ | D0 | A1 wired and sending. The launch-day announcement behind it is still blocked: postal address and one-click unsubscribe. |

---

## 8. FOUNDER PREREQUISITES

These gate the remaining social accounts.

| Item | Owner | Status | Risk | Next action |
| --- | --- | --- | --- | --- |
| `social@supaprod.ai` explicit address | Founder | ⬜ | Every account claimed before this is welded to a personal email | Cloudflare → supaprod.ai → Email Routing → custom address |
| Password vault | Founder | ⬜ | **The `supaprod` GitHub org is controlled entirely by one personal account** whose recovery codes are stored nowhere the company can reach | Proton Pass Free + Proton Authenticator |
| GitHub recovery codes | Founder | ⛔ vault | Losing that personal account loses the org | `github.com/settings/auth/recovery-codes` |

---

## RISK REGISTER

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Launch date never decided, work stays unschedulable | **High** | **Critical** | §0. One decision. |
| Compounding claim demoed but never executed | **High** | **Critical** | P1. One settle, three unblocks. |
| GitHub org lost with a personal account | Low | **Critical** | §8 recovery codes |
| ~~Nobody can be emailed after signing up~~ | Retired 2026-08-07 | High | A2 + A3 both closed. Replaced by the row below. |
| **First send from a cold domain is the launch announcement** | High if unmanaged | High | `supaprod.ai` has never sent a message. The nurture sequence at low volume IS the warm-up; do not let the largest send be the first. |
| ~~Launch day unmeasurable in real time~~ | Retired 2026-08-07 | High | C1 closed (`/admin/launch`). C2 still open. |
| Stub connector named as available in public copy | Medium | High | Nine real / eleven stub split now recorded in `README.md` and every listing follows it |

---

## WHAT CHANGED IN THIS REBUILD

The previous version of this file carried rows that were wrong in both directions: LinkedIn marked `Not started` when it was claimed and half-filled, `PRODUCT QUALITY — VERIFIED ✅` when `applyOutcome` had never run, and X 2FA as `pending` when it was a founder decision. Every status above was re-checked against the live thing rather than carried forward. Anything not re-checked says so.

## Related

- [`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md) — the build board
- [`../growth/brand-ops/social-accounts.md`](../growth/brand-ops/social-accounts.md) — per-platform claim walkthroughs
- [`../growth/launch-listings.md`](../growth/launch-listings.md) — paste-ready listing copy
- [`../strategy/brownfield-positioning-evaluation.md`](../strategy/brownfield-positioning-evaluation.md) — the positioning answer

---

# THE FULL DOMAIN CHECKLIST

Every domain the founder named, with its verified state, and scored so the order is derived rather than asserted.

**How to read the scores.** `Impact` is what it costs the launch if it stays as it is. `Effort` is hours, not difficulty. `Order` is the sequence to execute in, and it is a function of dependencies rather than of impact: a high-impact item that is blocked ranks below a low-impact item that unblocks it.

| # | Domain | Verified state, 2026-08-07 | Impact | Effort | Depends on | Order |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Release plan / launch date** | ✅ **mid-September 2026**, ruled 2026-08-07. Exact day still to pick | **Critical** | done | — | — |
| 2 | **Success criteria** | ⛔ undefined | **Critical** | 15 min | nothing | **2** |
| 3 | **Security** | ❓ five zero-vuln audits on record, but a "Security, 4 issues" badge in the Lovable panel was never opened | **Critical** | 30 min | nothing | **3** |
| 4 | **Onboarding** | ✅ rebuilt; audit dropped all 15 prior blockers. First sixty seconds are sound | Low | done | — | — |
| 5 | **Waitlist automation** | 🔵 capture verified end to end; brake raised 20→300/min | High | done | — | — |
| 6 | **Email sequences** | ⛔ written, unsendable. No ESP key, sending domain unverified | **Critical** | 20 min | nothing | **4** |
| 7 | **Analytics** | ⬜ `landing_events` writes correctly and is read by no code. Launch day measurable, not readable | High | 3 h | 2 | **5** |
| 8 | **Accessibility** | 🔵 audited. CTA contrast fixed. Two systemic tokens and missing H2s remain | High | 3 h | nothing | **6** |
| 9 | **Performance** | 🔵 audited and measured. Cache headers shipped. Font preload targets a retired stack | High | 2 h | nothing | **7** |
| 10 | **Website** | 🔵 SSR verified on all marketing routes; `/product` images guarded | High | — | 24 | **8** |
| 11 | **Pricing** | ✅ four tiers live, structured data added, Free-tier connector bug fixed | High | done | — | — |
| 12 | **Branding** | ✅ kit complete, 5 cover variants, square logo, all assets regenerate from source | Medium | done | — | — |
| 13 | **Legal pages** | ✅ `/privacy` `/terms` `/security` `/subprocessors` all real and linked | **Critical** | done | — | — |
| 14 | **Privacy** | ✅ storage section rewritten 2026-08-07. It previously described a `session-id` cookie, four key names this repo never used, and a vendor that does not exist | High | done | — | — |
| 15 | **Terms** | ✅ plain-language, all required sections | Medium | done | — | — |
| 16 | **Cookie consent** | ✅ none required, and building one would have been a false claim about our own storage. Verdict and inventory in [`operations/security/cookie-and-storage-policy.md`](../operations/security/cookie-and-storage-policy.md), held by a guard test | Medium | done | — | — |
| 17 | **Demos** | ✅ `/demo` and `/p/teardown` both real, both no-signup | High | done | — | — |
| 18 | **FAQs** | ✅ `/faq`, ten question-shaped answers, FAQPage schema | Medium | done | — | — |
| 19 | **Documentation** | 🔵 `/faq` covers launch week. No developer docs site | Low | — | post-launch | — |
| 20 | **Help center** | ⬜ deferred deliberately | Low | — | post-launch | — |
| 21 | **Customer support** | 🔵 `hello@supaprod.ai` in footer. No in-product path | Medium | 1 h | nothing | **13** |
| 22 | **Feedback loops** | ⬜ no in-product feedback path | Medium | 2 h | 21 | **14** |
| 23 | **SEO / GEO** | 🔵 canonicals, FAQ schema, llms.txt, robots, pricing schema, MCP manifest, cache headers all shipped. Site-wide soft-404 and OG size remain | High | 3 h | nothing | **9** |
| 24 | **Product screenshots** | ⛔ six do not exist; `/product` shows empty frames | High | 1 h | nothing | **10** |
| 25 | **Press kit** | ✅ written, 53 asset paths verified. Needs founder photo | Medium | done | — | — |
| 26 | **Founder story** | 🔵 written at three lengths. 2 `[FOUNDER TO FILL]` block shipping | High | 30 min | founder | **11** |
| 27 | **Community building** | ✅ plan written, 10 rooms ranked, 30-day cadence | Medium | done | 1 | — |
| 28 | **Launch metrics** | ⛔ = domain 2 and 7 | **Critical** | — | 2, 7 | — |
| 29 | **Post-launch monitoring** | ⬜ no uptime check, no error alerting verified, on-call recorded but not tooled | High | 3 h | 1 | **15** |
| 30 | **Bug triage** | ⬜ no written rule for stop-the-launch versus fix-next-week | Medium | 20 min | 1 | **16** |
| 31 | **Customer interviews** | ⬜ zero real users to interview | Low | — | launch | **17** |

## What the ordering says

**Positions 1 to 4 are all founder actions and total under an hour.** They are first not because they are large but because six other rows are waiting on them. Nothing an agent can do moves the launch until the date exists, the numbers are set, the security badge is opened and email can send.

**Positions 5 to 10 are agent work with no founder dependency**, and can run in parallel with each other the moment 1 to 4 are done.

**Everything from 12 down is genuinely deferrable.** Feedback widgets, a help centre and customer interviews are real work that does not decide whether launch week succeeds. Cookie consent left this list on 2026-08-07 without being built: the four hours were spent establishing that nothing we store requires consent, which is the cheaper answer and the true one.

**The single highest-leverage item is not on this list**, because it is a product action rather than a launch domain: settling one outcome, P1 in section 2. It converts the compounding claim from an argument into a demonstration, gives `/proof` a real number, and unblocks the teaser video's closing frame. One action, three unblocks.
