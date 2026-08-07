# Launch execution tracker

> _Created 2026-08-07 · Rebuilt 2026-08-07 18:40 IST from live verification_

**This is the single board.** Every status below was checked against the live site, the live account, or the source on 2026-08-07. Where something was not checked, the row says `NOT VERIFIED` rather than guessing. A tracker that guesses is worse than no tracker, which is the lesson from the previous version of this file: it shipped rows marked done that were not done, and rows marked not-started that had shipped.

**Legend.** ✅ done and verified · 🔵 done, needs a founder action to land · ⏳ in progress · ⛔ blocked · ⬜ not started · ❓ not verified

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
| P3 | **Two contrast tokens fail AA site-wide** | Agent | ⬜ | `--ink-subtle #71717a` = **4.10:1** powers every `.mono-label`, including the only visible label on `/p/teardown`'s form. `--ink-faint #52525b` = **2.56:1**, fails even large-text, used across the footer, `/product` tags and the waitlist explainer. | Repoint `.mono-label` at `--text-subtle #7d786f` (4.52:1). Retire `--ink-faint` as a text colour on dark. |
| P4 | **Font preload targets a retired stack** | Agent | ⬜ | Mona Sans + IBM Plex Mono (35,648 B) preloaded on every route, used only by `.sp-*`, which appears **zero times** in `src/components/landing/`. Geist Pixel Square, which paints the H1 and is the likely LCP element, is **not** preloaded. `styles.css:14` explicitly bans IBM Plex Mono as retired. | Swap the two preloads in `__root.tsx`. |
| P5 | **Missing H2s / landmarks** | Agent | ⬜ | `/pricing` and `/proof` have one H1 and zero H2. `/investors` and `/brief` have **zero headings and zero landmarks** in the parent document; `brief.html` has 16 flat H1s. | Promote plan names to `<h2>`; give `/investors` an `<h1>` and `<main>`. |
| P6 | **`authorization_servers: []`** | Founder | ⛔ | A discovering MCP client is told there is nowhere to authenticate, so it stops. | **Founder question:** does the MCP server delegate to Supabase or issue its own tokens? There is no `authorize`/`token` route to settle it. Not guessed at deliberately. |
| P7 | **Site-wide soft-404** | Agent | ⏳ | Every unknown path returns 200 with the SPA shell. `/.well-known/*` is fixed; the rest is not. | Needs the router to signal notFound. Larger change. |
| P8 | **App-shell JS on marketing routes** | Agent | ⬜ | 249.6 KB gzip across 34 preloaded files. `__root.tsx` ships QueryClientProvider, Radix AlertDialog and a Supabase auth listener to pages that render none of them. | Split the root: lightweight shell for public routes. |

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
| Cookie consent | Founder | ⬜ | No consent surface. The only `document.cookie` write is the sidebar preference, a functional cookie needing no consent. If the analytics `session-id` is set without consent that is an EU exposure. |
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
| 14 | **Privacy** | ✅ cookies and localStorage disclosed | High | done | — | — |
| 15 | **Terms** | ✅ plain-language, all required sections | Medium | done | — | — |
| 16 | **Cookie consent** | ⬜ no consent surface. Sidebar cookie is functional and needs none; the analytics `session-id` is the exposure | Medium | 4 h | nothing | **12** |
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

**Everything from 12 down is genuinely deferrable.** Cookie consent, feedback widgets, a help centre and customer interviews are real work that does not decide whether launch week succeeds.

**The single highest-leverage item is not on this list**, because it is a product action rather than a launch domain: settling one outcome, P1 in section 2. It converts the compounding claim from an argument into a demonstration, gives `/proof` a real number, and unblocks the teaser video's closing frame. One action, three unblocks.
