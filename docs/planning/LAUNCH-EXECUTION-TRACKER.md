# Launch execution tracker

> _Created 2026-08-07 · Rebuilt 2026-08-07 18:40 IST from live verification_

**This is the single board.** Every status below was checked against the live site, the live account, or the source on 2026-08-07. Where something was not checked, the row says `NOT VERIFIED` rather than guessing. A tracker that guesses is worse than no tracker, which is the lesson from the previous version of this file: it shipped rows marked done that were not done, and rows marked not-started that had shipped.

**Legend.** ✅ done and verified · 🔵 done, needs a founder action to land · ⏳ in progress · ⛔ blocked · ⬜ not started · ❓ not verified

---

## 0. THE ONE DECISION THAT GATES SCHEDULING

| Item | Owner | Status | Risk | Next action |
| --- | --- | --- | --- | --- |
| **Launch date conflict** | Founder | ⛔ | **Three independent audits hit this today.** `docs/planning/SOURCE-OF-TRUTH.md` works to **2026-08-10**. `README.md` says **mid-September 2026** on every external surface. Everything written this session is deliberately date-agnostic because of it, which cost real work. | Pick one. It sets the Show HN gap, the email send dates, the community cadence and the PH schedule. Nothing below can be scheduled until it exists. |

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
| A2 | **No ESP key, sending domain unverified** | Founder | ⛔ | **Nobody who signs up can be emailed.** Gates A3, A4 and every sequence in §4. | Resend key + verify `supaprod.ai` |
| A3 | No confirmation email | Agent | ⛔ A2 | A waitlist that never acknowledges reads as broken | After A2 |
| C1 | **Nothing reads the funnel** | Agent | ⬜ | `landing_events` writes correctly and is read by no code. Launch day is measurable but not readable; you would be running SQL by hand while traffic arrives. | One admin page grouping by referrer hostname and day |
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
| Waitlist email | Agent | ⛔ A2 | D0 | Blocked on ESP |

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
| Nobody can be emailed after signing up | **Certain today** | High | A2 |
| Launch day unmeasurable in real time | High | High | C1 + C2 |
| Stub connector named as available in public copy | Medium | High | Nine real / eleven stub split now recorded in `README.md` and every listing follows it |

---

## WHAT CHANGED IN THIS REBUILD

The previous version of this file carried rows that were wrong in both directions: LinkedIn marked `Not started` when it was claimed and half-filled, `PRODUCT QUALITY — VERIFIED ✅` when `applyOutcome` had never run, and X 2FA as `pending` when it was a founder decision. Every status above was re-checked against the live thing rather than carried forward. Anything not re-checked says so.

## Related

- [`SOURCE-OF-TRUTH.md`](./SOURCE-OF-TRUTH.md) — the build board
- [`../growth/brand-ops/social-accounts.md`](../growth/brand-ops/social-accounts.md) — per-platform claim walkthroughs
- [`../growth/launch-listings.md`](../growth/launch-listings.md) — paste-ready listing copy
- [`../strategy/brownfield-positioning-evaluation.md`](../strategy/brownfield-positioning-evaluation.md) — the positioning answer
