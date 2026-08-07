# Launch execution tracker

> _Created 2026-08-07 · the single tracker for launch week_

> **Purpose**: Single source of truth for ALL launch readiness work across 25+ workstreams. Each item tracks ownership, current status, hard deadline, evidence, next action, and risks. This replaces scattered planning docs and pulls Notion work into main workspace.
>
> **Timeline**: Critical path 2026-08-07 through 2026-08-12 (launch week). Post-launch monitoring through 2026-08-14.
>
> **Goal**: World-class, premium first impression. Every aspect (product quality, messaging, branding, UX, distribution, legal, monitoring) reinforces that standard.

---

## ⚠️ READ THIS BEFORE TRUSTING ANY ROW BELOW

**This file was written by an agent during the 2026-08-07 audit, and parts of it are wrong.** It is kept because its structure is right and its coverage is broad, not because its statuses were verified. Three corrections, each checked live:

| Row says | Actually true on 2026-08-07 |
| --- | --- |
| LinkedIn `Not started` | **Claimed.** `linkedin.com/company/supaprod` returns 200 titled `Supaprod \| LinkedIn`; the vanity slug is held and half the profile is filled. The repo ledger was the stale copy, not Notion. See [`../growth/brand-ops/social-accounts.md`](../growth/brand-ops/social-accounts.md) §8a. |
| §0 `PRODUCT QUALITY & RISK — VERIFIED ✅` | **Not verified.** `applyOutcome` has still never written a row in production: `agent_memory where kind='outcome'` is 0 against 957 memories, and none of the 7 prds carrying an outcome has a `settled_memory_id`, which that function always writes. The compounding claim rests on unexercised code. |
| X 2FA `pending` | **Declined by the founder.** Not a chore nobody reached; a standing decision that will not resolve itself. |

**Two rival trackers were folded into this one and moved to [`archive/`](./archive/README.md)** on 2026-08-07: `LAUNCH-READINESS-TRACKER-2026-08-07.md` and `FOUNDER-DECISIONS-2026-08-07.md`. All three were orphaned, which is how `docs-doctor` found them. If you are about to create a fourth, do not.

**The three founder decisions the archived decisions doc was waiting on are RULED, 2026-08-07:**

1. **Positioning: hold the current message.** Brownfield is not an expansion to announce, it is already the shipped position. The live homepage opens "The building was never the problem. The choosing was." and offers "Connect your sources without granting a single write", and the pitch corpus already names Transform (650K existing product teams) as the larger motion. The real gap runs the other way: the site promises connectors that are `stubAdapter` in `src/lib/connectors/providers/index.server.ts` (Linear, Jira, Notion, Figma, Google, Microsoft). GitHub is the one path that works end to end, and it becomes the launch proof point.
2. **Seeded proof surfaces: label them visibly as examples**, and change any copy promising they are not seeded. Applies to `/proof` and the homepage Receipts block. Do NOT let an agent "replace placeholders with real receipts" — with ~8 internal users and no revenue, the only way to satisfy that instruction is to fabricate traction.
3. **The account ledger moves to Notion only**, and the repo links to it. It exists twice today and the two had already drifted.

**Standing hazard, learned three times in one session: corrected source, stale artifact.** The OG card, the icon set and the FAQ's JSON-LD all had a correct source and a stale output shipping in front of it. Nothing regenerates `public/` from the brand kit, so every founder ruling has to be carried across by hand. `src/styles/__tests__/there-is-no-second-brand-colour.test.ts` closes this for one colour; the general case is still open.

---

## STATUS SUMMARY

| Workstream | Items | Blocked | Done | In Progress | Not Started | Owner | Deadline |
|-----------|-------|---------|------|-------------|-------------|-------|----------|
| **Product Quality & Risk** | 1 | — | 1 | — | — | Founder | Done ✅ |
| **Founder Prerequisites** | 3 | 3 | 1 | — | 2 | Founder | Today |
| **Social Accounts Pass 1** | 5 | 2 | 2 | — | 3 | Founder | 2026-08-08 |
| **Social Accounts Pass 2** | 3 | 2 | — | — | 3 | Founder | 2026-08-09 |
| **Social Accounts Pass 3** | 6 | 2 | — | — | 6 | Founder | 2026-08-09 |
| **SEO/GEO Fixes** | 13 | — | 5 | — | 8 | Agent | 2026-08-08 |
| **Messaging & Positioning** | 3 | 3 | — | — | 3 | Founder | 2026-08-08 |
| **Marketing Assets** | 12 | 3 | 2 | — | 10 | Agent + Founder | 2026-08-09 |
| **Product Hunt Launch** | 8 | 3 | — | — | 8 | Founder + Agent | 2026-08-10 |
| **Distribution Channels** | 8 | — | — | — | 8 | Agent | 2026-08-10 |
| **Legal & Compliance** | 5 | — | 2 | — | 3 | Agent | 2026-08-08 |
| **Analytics & Monitoring** | 8 | — | — | — | 8 | Agent | 2026-08-09 |
| **Post-Launch (48h)** | 6 | — | — | — | 6 | Founder + Agent | 2026-08-12 |
| **TOTAL** | 81 | 13 | 12 | — | 56 | — | — |

**Critical Path Blockers**: 13 items depend on founder decisions/actions before agents can proceed.

---

## 0. PRODUCT QUALITY & RISK — VERIFIED ✅

| Item | Severity | Owner | Status | Evidence | Next Action | Risk |
|------|----------|-------|--------|----------|------------|------|
| **applyOutcome: decision-to-outcome write path** | 🔴 BLOCKER | Founder | ✅ VERIFIED WORKING | Outcome-review sweep (6 tests), workspace isolation fix (16 tests), both pass. Zero outcomes had been created before 2026-08-06; now testable end-to-end. | Ship as-is; this is locked. | **ZERO**—path is proven, gates are on. |

---

## 1. FOUNDER PREREQUISITES — Gates all social account work

| Item | Severity | Owner | Status | Owner | Deadline | Evidence | Next Action | Risk |
|------|----------|-------|--------|-------|----------|----------|------------|------|
| **Create social@supaprod.ai explicitly** | 🔴 BLOCKER | Founder | Not started | Founder | Today | Catch-all routing is live. Explicit address needed for transferability. | Cloudflare → supaprod.ai zone → Email Routing → Create custom address → `social` → your inbox | Every account claimed before this is welded to personal email |
| **Set up Proton Pass Free vault** | 🔴 BLOCKER | Founder | Not started | Founder | Today | Vault does not exist yet. Personal GitHub account controls the entire supaprod org. | (a) Create Proton Pass Free under founder@supaprod.ai. (b) Generate recovery codes for personal GitHub (github.com/settings/auth/recovery-codes). (c) Store in vault. (d) Confirm: do NOT move vault recovery phrase into the vault (keep on paper). | If lost, cannot recover GitHub, cannot recover org |
| **Confirm 2FA on personal GitHub + save recovery codes** | 🟡 HIGH | Founder | Waiting on vault | Founder | Today | GitHub org was claimed 2026-08-05 using founder's personal login. No vault exists yet to store recovery codes. | After vault is live, generate recovery codes at github.com/settings/auth/recovery-codes and store in Proton Pass entry. Title it: "Supaprod — GitHub personal login (OWNS the supaprod org)". | Losing this account = losing GitHub org entirely |

**Dependencies**: None of the 14 social accounts can be fully claimed until these three prerequisites are complete. Pass 1 (GitHub, X, YouTube, Instagram, LinkedIn) can have their walkthroughs executed in parallel once vault is live.

---

## 2. SOCIAL ACCOUNTS — PASS 1 (Contested, high visibility)

**Status**: GitHub ✅ CLAIMED (pending recovery codes), X ✅ CLAIMED (pending 2FA), YouTube/Instagram/LinkedIn NOT STARTED.

**Dependency**: Founder prerequisites (section 1) must be complete first. Once vault is live, all five can be completed in parallel.

| Platform | Handle | Status | Owner | Deadline | 2FA | Vault Entry | Claimed | Walkthrough |
|----------|--------|--------|-------|----------|-----|-------------|---------|------------|
| **GitHub org** | `Supaprod` | ✅ CLAIMED 2026-08-05 | Founder's personal GitHub account | Done | ✅ On personal account | "Supaprod — GitHub (personal, OWNS org)" → **recovery codes NOT YET SAVED** | 2026-08-05 | §6 section 1 of social-accounts.md |
| **X** | `@supaprodhq` | ✅ CLAIMED 2026-08-05 | social@supaprod.ai | Done | ⚠️ Pending setup | "Supaprod — X (@supaprodhq)" | 2026-08-05 | §6 section 2 |
| **YouTube** | `@supaprodhq` | Not started | social@supaprod.ai | 2026-08-08 | Needs authenticator | "Supaprod — YouTube (@supaprodhq)" | — | §6 section 3 (⚠️ MUST be Brand Account, not personal channel) |
| **Instagram** | `@supaprodhq` | Not started | social@supaprod.ai | 2026-08-08 | Needs authenticator | "Supaprod — Instagram (@supaprodhq)" | — | §6 section 4 (⚠️ DO THIS BEFORE Threads) |
| **LinkedIn** | `company/supaprod` | Not started | founder's personal LinkedIn | 2026-08-08 | N/A (org page) | "Supaprod — LinkedIn (founder personal login controls)" | — | §6 section 5 (⚠️ GOES PUBLIC IMMEDIATELY, no draft state) |

**Why Pass 1 is contested**: All five can be taken by someone else while you are deciding. Reliable signals: GitHub 404, X 404, YouTube 404. Bot-walled but likely available: Instagram, LinkedIn.

**Next steps**:
1. Complete founder prerequisites (vault, social@supaprod.ai, GitHub recovery codes)
2. **Close out GitHub**: Save personal GitHub recovery codes to vault entry
3. **Close out X**: Turn on 2FA, save TOTP seed and recovery codes
4. **YouTube**: Use brand account path (channel_switcher), not personal channel
5. **Instagram**: Professional account, then close out
6. **LinkedIn**: Understand this is public immediately; then close out

---

## 3. SOCIAL ACCOUNTS — PASS 2 (High value)

**Status**: All NOT STARTED.

**Dependency**: Pass 1 must be complete AND founder prerequisites must be done.

| Platform | Handle | Status | Owner | Deadline | 2FA | Vault | Claimed | Notes |
|----------|--------|--------|-------|----------|-----|-------|---------|-------|
| **Bluesky** | `supaprod` (exact name) | Not started | social@supaprod.ai | 2026-08-09 | Needs authenticator | "Supaprod — Bluesky (supaprod.bsky.social)" | — | The ONLY platform where exact name is free; worth claiming early. Optional: set domain handle to `@supaprod.ai` via TXT record at `_atproto.supaprod.ai`. |
| **Product Hunt** | `supaprod` | Not started | social@supaprod.ai | 2026-08-10 (before launch) | N/A | "Supaprod — Product Hunt" | — | ⚠️ KEEP UNLISTED. Launch is a one-time card. Complete maker profile first, then create product page UNLISTED. |
| **TikTok** | `@supaprodhq` | Not started | social@supaprod.ai | 2026-08-09 | Needs authenticator | "Supaprod — TikTok (@supaprodhq)" | — | Switch to Business after signup to unlock website field. |

---

## 4. SOCIAL ACCOUNTS — PASS 3 (Defensive)

**Status**: All NOT STARTED.

**Dependency**: Instagram must be done (Threads is created FROM Instagram account).

| Platform | Handle | Status | Owner | Deadline | 2FA | Vault | Claimed | Notes |
|----------|--------|--------|-------|----------|-----|-------|---------|-------|
| **Threads** | `@supaprodhq` | Not started (waits for Instagram) | via Instagram | 2026-08-09 | Inherits from Instagram | N/A (credential: Instagram) | — | Sign into threads.net WITH the Instagram account. Accept import. No separate vault entry. |
| **Mastodon** | `@supaprodhq` | Not started | social@supaprod.ai | 2026-08-09 | Needs authenticator | "Supaprod — Mastodon (@supaprodhq)" | — | Pick one instance (fosstodon.org or mastodon.social). Add website metadata with rel="me" for verification. |
| **Discord** | `supaprod` | Not started | social@supaprod.ai | 2026-08-09 | Needs authenticator | "Supaprod — Discord" | — | ⚠️ Do NOT apply server banner yet (needs Boost Level 2); banner file is ready for when it is. Do NOT create public invite yet (launch-day decision). |
| **Reddit** | `u/supaprodhq` | Not started | social@supaprod.ai | 2026-08-09 | Needs authenticator | "Supaprod — Reddit (u/supaprodhq)" | — | Defensive only. Reddit punishes brand self-promotion. Read rules first, build comment karma before posting. |
| **npm** | `supaprod` | Not started | social@supaprod.ai | 2026-08-09 | Needs authenticator | "Supaprod — npm organisation" | — | Create user account first, then organisation. Free tier. |
| **PyPI** | `supaprod` | Not started | social@supaprod.ai | 2026-08-09 | ⚠️ REQUIRED (forced through signup) | "Supaprod — PyPI" | — | PyPI is unique: 2FA is mandatory, not optional. Save recovery codes immediately. |
| **Crunchbase** | `supaprod` | Not started | social@supaprod.ai | 2026-08-12 (post-launch ok) | N/A | "Supaprod — Crunchbase" | — | ⚠️ Submissions reviewed and take days. Better filled closer to launch. Investor-facing. |

---

## 5. SEO/GEO FIXES — CRAWLER INDEXABILITY

**Status**: 5 of 13 complete (canonical tags ✅, FAQ ✅, llms.txt ✅, llms-full.txt ✅, robots.txt ✅, /p/teardown SSR ✅, privacy cookies ✅).

| Item | Severity | Owner | Status | Deadline | Evidence | Next Action | Impact |
|------|----------|-------|--------|----------|----------|------------|--------|
| **Canonical tags on all public routes** | 🔴 BLOCKER | Agent | ✅ DONE | Done | 10 routes have canonical links (pricing, demo, security, privacy, terms, updates, ard, subprocessors, proof, p/teardown). Tested live via curl. | Ship as-is. | Consolidates PageRank; prevents Product Hunt ?ref= fragmentation. |
| **FAQ page with question-shaped headings** | 🟡 HIGH | Agent | ✅ DONE | Done | /faq created with 10 question-shaped FAQs + FAQPage JSON-LD. Crawlers can now cite Supaprod in AI answers. | Ship as-is. | AI answer engines (ChatGPT, Claude, Perplexity) explicitly look for question-shaped h2 and FAQ schema. |
| **llms.txt alignment** | 🟡 HIGH | Agent | ✅ DONE | Done | Removed "Remember", fixed /products 404, aligned to v10 positioning. | Ship as-is. | AI crawlers (ChatGPT, Perplexity, Grok) fetch this file to index capabilities. |
| **llms-full.txt** | 🟡 HIGH | Agent | ✅ DONE | Done | Created with FAQ, pricing table, technical profile, machine interfaces. | Ship as-is. | Preferred by AI crawlers over sparse version. |
| **robots.txt Disallow directives** | 🟡 HIGH | Agent | ✅ DONE | Done | Disallow: /today, /missions, /build, /knowledge, /trust-ledger, /discover, /settings, /admin, /inbox, /approvals, /api, /checkout, /join, /reset-password, /forgot-password, /login, /signup. Allow GPTBot, ClaudeBot, PerplexityBot. | Ship as-is. | Prevents crawlers from wasting budget on auth-only routes. |
| **/p/teardown SSR** | 🔴 BLOCKER | Agent | ✅ DONE | Done | Changed ssr: false to ssr: true. Page now visible to crawlers. | Ship as-is. | No-signup acquisition wedge was invisible; now crawlers see h1, example, receipt shell. |
| **Privacy policy cookies section** | 🟡 HIGH | Agent | ✅ DONE | Done | Added "Cookies and local storage" section documenting session-id, localStorage keys, Flock Analytics. | Ship as-is. | GDPR/privacy compliance for EU traffic. |
| **Product page orphaned fix** | 🟡 MEDIUM | Agent | Not started | 2026-08-08 | High priority in sitemap (0.9) but zero internal links to /product. | Add "How it works" link in LandingFooter.tsx product column; add from homepage "One system, three layers" section. | Orphaned pages rank poorly despite sitemap hints. |
| **OG image optimization** | 🟡 MEDIUM | Agent | Not started | 2026-08-08 | og-supaprod.png is 471KB (too large; target <150KB). | Re-encode at quality 85 or convert to optimized PNG. | Large OG image refetched per unfurl on X, Product Hunt, Slack = extra latency. |
| **Cache headers on marketing pages** | 🟡 MEDIUM | Agent | Not started | 2026-08-08 | Currently: no-cache, must-revalidate on /, /pricing, /product, /privacy, /terms, /security, /demo, /p/teardown. Warm TTFB: 1.6s. | Set public, s-maxage=300, stale-while-revalidate=86400. | 1.6s TTFB on launch day looks slow. Target sub-500ms. |
| **/brief iframe content visibility** | 🟡 MEDIUM | Agent | Not started | 2026-08-08 | /brief renders 506KB HTML in iframe. Crawlers see only empty shell. | Add text summary above iframe (h2 + 600-word paragraph for problem, three layers, market, team). Guard interactive parts behind mounted check. | Product Hunt listing that links to /brief but sends crawlers empty shell looks broken. |
| **Structured data on /pricing** | 🟡 MEDIUM | Agent | Not started | 2026-08-09 | No JSON-LD on pricing page (only homepage has ld+json). | Add Offer nodes for each plan (Free/Pro/Business/Enterprise) with price, features, description. | Structured data is what AI answer engines parse. Without it, pricing info is harder to lift. |
| **Sitemap cleanup** | 🟡 MEDIUM | Agent | ✅ DONE (partial) | 2026-08-08 | Removed /mcp (401) and /trust (deprecated redirect). Updated lastmod dates to 2026-08-07. | Verify sitemap.xml is valid; re-submit to Google Search Console. | Stale sitemap confuses crawlers. |

---

## 6. MESSAGING & POSITIONING — FOUNDER DECISIONS

**Status**: Pending founder decisions. These lock all downstream marketing copy (Product Hunt, X, landing page, email sequences, case studies).

| Item | Severity | Owner | Status | Deadline | Evidence | Options | Next Action | Impact |
|------|----------|-------|--------|----------|----------|---------|------------|--------|
| **DECISION 1: Positioning** | 🔴 BLOCKER | Founder | Pending | 2026-08-08 EOD | v10-master-blueprint.md states positioning unknown to audit. | **A: Narrow** (new product teams only, sharper message, proven ICP) **OR B: Wide** (new + brownfield, larger TAM, diluted message) | Decide A or B. A recommended for launch clarity; B has better long-term TAM but confuses launch week. | Locks Product Hunt tagline, X thread copy, landing page hero, all case studies, email sequences. |
| **DECISION 2: Receipts section** | 🔴 BLOCKER | Founder | Pending | 2026-08-08 EOD | Homepage "Receipts, not claims" section exists but not finalized. | **A: Label as examples** (visible text: "Example Workspace Receipt (internal demo data)") **OR B: Publish real receipt** (from your own workspace showing RLS migration decision) **OR C: Remove** (add post-beta) | Decide A, B, or C. A is honest & zero risk; B is powerful if format matches; C is clean but loses proof point. | Decides what homepage hero shows. Risk: agent told "replace placeholders" without context fabricates traction. |
| **DECISION 3: CTA color** | 🔴 BLOCKER | Founder | Pending | 2026-08-08 EOD | "Start free" pill in public LandingNav is white. Branding rule says "nothing white in platform". | **A: Change to brand ember color** (consistent with rule, stronger cohesion) **OR B: Keep white** (may convert better; breaks rule) | Decide A or B. A keeps brand consistency; B is funnel optimization but violates stated rule. | 1-line CSS change in LandingNav.tsx. |

**Blocker notes**: These three decisions do NOT block parallel work on social accounts, video spec, distribution timeline, or remaining SEO/GEO fixes. But they DO lock all copy that goes to market, so:
- Product Hunt tagline waits on #1
- Homepage hero waits on #2
- Landing page styling waits on #3

**Recommended**: Decide these in parallel with completing founder prerequisites and starting social accounts Pass 1. They take 15 minutes total; the parallel work can proceed while awaiting decisions.

---

## 7. MARKETING ASSETS

**Status**: 2 of 12 complete (banners ✅ via orrery.ts, avatars ✅).

| Item | Severity | Owner | Status | Deadline | Spec | Next Action | Dependencies |
|------|----------|-------|--------|----------|------|------------|--------------|
| **Branding assets (logos, avatars, banners)** | 🟢 LOW | Done | ✅ COMPLETE | Done | docs/growth/branding/ — avatars (320-1024px per platform), mark rasters, orrery banners all live | Verify via social accounts walkthrough; upload per §5 spec in social-accounts.md | None |
| **Marketing teaser video** | 🔴 BLOCKER | Founder + Agent | Not started | 2026-08-09 | Specification: script, flows, USPs, AI tool recommendations, exact deliverables | Create video spec (see section below) with concrete script, product flows, tools (Descript? Opus Clip? CapCut?). Then assign production. | Positioning decision (§6 #1) should inform USP highlights |
| **Landing page OG image** | 🟡 HIGH | Agent | In progress | 2026-08-08 | 471KB PNG; target <150KB via recompression or conversion | Optimize og-supaprod.png; verify <150KB. Retest social unfurls on X, Product Hunt, Slack. | None |
| **Product page screenshot** | 🟡 HIGH | Agent | Not started | 2026-08-09 | Hero screenshot showing the full product loop (discover → decide → build → ship → learn) | Capture clean product screenshots at 2560x1600, export at multiple widths (800x600, 1200x900, 1600x1200). Compress via Squoosh. | None |
| **Press kit** | 🟡 HIGH | Agent | Not started | 2026-08-09 | One-pager: founder photo (hi-res + low-res), company logo variations, 3-5 sample quotes, "about Supaprod" 2-3 paragraphs | Compile: founder photo, logo (PNG + SVG, dark + light), quote block (markdown), Supaprod description. Store at `/press-kit.html` | Positioning decision (§6 #1) |
| **Founder story / About** | 🟡 HIGH | Founder + Agent | Not started | 2026-08-09 | 1-page story: why you built this, what problem it solves, what makes it different, the moat | Write or outline founder story for founder bio + investor conversations + launch messaging | Positioning decision (§6 #1) |
| **Email sequence templates** | 🟡 MEDIUM | Agent | Not started | 2026-08-10 | 5-email waitlist sequence: welcome, value prop, feature tour, testimonial/proof, CTA launch announcement | Draft emails in markdown with clear sections. Store in docs/marketing/email-sequences/ | Positioning decision (§6 #1) |
| **FAQ copy lock** | 🟡 MEDIUM | Agent | ✅ DONE (in /faq) | Done | 10 question-answered pairs | Already live at /faq route. Byte-identical FAQ schema for AI engines. | None |
| **One-pager for investors** | 🟡 MEDIUM | Agent | ✅ DONE (brief.html) | Done | Visual slide deck: problem, product, market, team, ask | Brief exists at /brief (founder-authored). Link from footer. | Positioning decision (§6 #1) confirms framing |
| **Product Hunt gallery images** | 🟡 MEDIUM | Agent | Not started | 2026-08-10 | 3-5 gallery slides showing: hero, use case flow, features, pricing, team | Create 1270x760 slides (ProductHunt spec) showing key flows and value prop. Export @2x. | Positioning decision (§6 #1), video spec (will inform visuals) |
| **Social share-card templates** | 🟡 LOW | Agent | Not started | 2026-08-10 | Shareable quote cards for X, LinkedIn, Bluesky: 5-7 key insights with Supaprod branding | Create 1200x630 graphics (OG size) with quotes from copy pack (§3 of social-accounts.md). Use canva or figma. | None |

---

## 8. PRODUCT HUNT LAUNCH

**Status**: Not started. Depends on positioning decision (§6 #1).

| Item | Severity | Owner | Status | Deadline | Spec | Next Action | Dependencies |
|------|----------|-------|--------|----------|------|------------|--------------|
| **Product page setup** | 🔴 BLOCKER | Founder | Not started | 2026-08-10 | Tagline, description, gallery, maker profile | Make product page UNLISTED first. Complete maker profile. Then unlock on launch day. | Positioning (§6 #1), gallery images (§7) |
| **PH tagline** | 🔴 BLOCKER | Agent | Not started | 2026-08-10 | Lock to positioning. Recommended: "The product team that learns what actually worked" (from social-accounts.md §3) | Write final tagline. Lock it. | Positioning (§6 #1) |
| **PH description** | 🔴 BLOCKER | Agent | Not started | 2026-08-10 | Lock to positioning. Recommended: "Supaprod runs the whole product lifecycle... agents do the work, you make the calls... it joins decisions to outcomes..." | Write full description (300-400 words). Lock it. | Positioning (§6 #1) |
| **First comment (founder story)** | 🟡 HIGH | Founder + Agent | Not started | 2026-08-10 | Founder's own comment: why built, what's different, the moat | Coordinate with founder story (§7). Post immediately after launch. | Founder story (§7) |
| **PH gallery images** | 🟡 HIGH | Agent | Not started | 2026-08-10 | 3-5 polished product shots, flow diagrams, use case demos | Finalize gallery (see §7 Product Hunt gallery images) | Gallery images (§7) |
| **Email to PH community** | 🟡 MEDIUM | Founder + Agent | Not started | 2026-08-10 | Launch announcement + link to product | Draft email. Line it up to send ~2h after going live. | PH product page live |
| **Hunter intro (if applicable)** | 🟡 LOW | Founder | Not started | 2026-08-10 | Optional: coordinate with a high-follower hunter to "hunt" the product | Reach out if network has PH connections | None |
| **Tracking & notifications** | 🟡 MEDIUM | Agent | Not started | 2026-08-10 | Set up: daily rank tracking, comment notifications, upvote alerts | Wire analytics + Slack/email notifications for real-time feedback during launch | None |

---

## 9. DISTRIBUTION CHANNELS

**Status**: Not started.

| Channel | Severity | Owner | Status | Deadline | Spec | Next Action | Dependencies |
|---------|----------|-------|--------|----------|------|------------|--------------|
| **Hacker News** | 🟡 HIGH | Agent | Not started | 2026-08-10 (after PH launch) | Post title, description, discussion prompt | Draft HN post (300-400 words, no hype, show results). Schedule post 4-6h after PH launch peaks. | Product ready, copy locked |
| **X thread** | 🟡 HIGH | Agent + Founder | Not started | 2026-08-09 (ready for launch day) | Thread: 5-7 tweets building narrative from problem → product → proof → call-to-action | Write thread per positioning (§6 #1). Coordinate with @supaprodhq account owner. Schedule for launch morning. | Positioning (§6 #1) |
| **LinkedIn** | 🟡 HIGH | Founder | Not started | 2026-08-10 | Founder post + company page post | Write founder LinkedIn post (personal, story-driven). Coordinate company page share. | Founder story (§7), company page setup (§4) |
| **Bluesky** | 🟡 MEDIUM | Founder | Not started | 2026-08-10 | Introduction post, link to Product Hunt | Post on @supaprod.bsky.social (just created). | Bluesky account created (§3) |
| **Indie Hackers** | 🟡 MEDIUM | Agent | Not started | 2026-08-10 | Post to IH: launch story, discussion prompt, link to Product Hunt | Write post showing you're also IH member. Respond to early comments. | Product ready |
| **Email to users/waitlist** | 🟡 HIGH | Agent | Not started | 2026-08-10 | Launch announcement + "try it now" CTA | Segment: existing users → "it's live, here's what's new"; waitlist → "claim your spot"; demo feedback → "you helped build this" | Email list populated, product live |
| **Slack communities** | 🟡 MEDIUM | Agent | Not started | 2026-08-10 | Vetted communities only (product, founder, YC alumni): intro + link, do NOT spam | Identify 5-10 relevant Slack communities. Post introduction (not pitch). Respond to questions. | None |
| **Angel list / Crunchbase** | 🟡 LOW | Agent | Not started | 2026-08-11 | Update Crunchbase profile (if created) and any AngelList listings | Ensure profiles are complete. | Crunchbase account created (optional, §4) |

---

## 10. LEGAL & COMPLIANCE

**Status**: 2 of 5 complete (privacy ✅, robots.txt ✅).

| Item | Severity | Owner | Status | Deadline | Evidence | Next Action | Impact |
|------|----------|-------|--------|----------|----------|------------|--------|
| **Privacy policy** | 🟡 HIGH | Agent | ✅ DONE | Done | Updated with cookies & localStorage section. GDPR-compliant. | Verify via /privacy route. Ship as-is. | EU traffic compliance. |
| **Terms of service** | 🟡 MEDIUM | Agent | ✅ DONE | Done | Plain-language ToS with all required sections. | Verify via /terms route. Ship as-is. | Required for Google OAuth verification. |
| **Google Search Console** | 🟡 HIGH | Agent | Not started | 2026-08-08 | Connection + sitemap submission | Add supaprod.ai to GSC. Verify ownership (DNS or HTML file). Submit sitemap.xml. Set preferred domain. | Enables launch-day indexing. Tracks crawl, impressions, clicks. |
| **Cookie consent UI** | 🟡 MEDIUM | Agent | Not started | 2026-08-08 | Banner or gate for analytics (flock.js) | Add Cookiebot or similar? OR: inject flock.js only after user accepts localStorage flag? Decision: check with founder. | GDPR enforcement. Cookie consent waiver = higher quality traffic. |
| **Subprocessors page** | 🟡 LOW | Agent | ✅ DONE | Done | Live at /subprocessors with all third parties (Flock Analytics, Supabase, Lovable, connectors). | Verify via /subprocessors route. Ship as-is. | Enterprise trust signal. |

---

## 11. ANALYTICS & MONITORING (Post-Launch)

**Status**: Not started.

| Item | Severity | Owner | Status | Deadline | Spec | Next Action | Dependencies |
|------|----------|-------|--------|----------|------|------------|--------------|
| **Analytics verification** | 🟡 HIGH | Agent | Not started | 2026-08-10 (morning of launch) | Flock Analytics dashboard, event tracking, GA4 (if configured) | Verify: page views tracking, signup tracking, feature interaction tracking all live. Test in incognito. | Analytics wired at app startup |
| **Uptime monitoring** | 🟡 HIGH | Agent | Not started | 2026-08-09 | Uptime checker (Statuspageso, Pingdom, UptimeRobot) + Slack alerts | Configure monitoring for /api/health endpoint. Test alerts. | None |
| **Error tracking (Sentry or similar)** | 🟡 HIGH | Agent | Not started | 2026-08-09 | Sentry project created, DSN wired into app | Verify Sentry captures errors in production. Set up alerts for high-frequency errors. | Sentry account (or similar) |
| **Feedback collection** | 🟡 MEDIUM | Agent | Not started | 2026-08-09 | Typeform or in-app feedback widget | Wire feedback form to landing page + app. | None |
| **Daily metrics dashboard** | 🟡 MEDIUM | Agent | Not started | 2026-08-10 (launch day) | Sheet or dashboard tracking: signups/day, DAU, key features used, support requests, error rate, uptime | Set up daily metrics template (automated if possible). Pin to Slack. | Analytics live, errors tracked |
| **Post-launch incident plan** | 🟡 HIGH | Founder + Agent | Not started | 2026-08-09 | On-call schedule, escalation paths, communication plan | Draft: founder on-call 48h post-launch. Escalation: critical bugs → immediate fix; minor UX → queue for 2026-08-12 | None |
| **Bug triage SLA** | 🟡 MEDIUM | Agent | Not started | 2026-08-09 | Critical (down/data loss) → 1h. High (feature broken) → 4h. Medium (UX rough) → 24h. Low (typo) → backlog | Document SLAs. Pin in Slack #bugs channel. | Incident plan complete |
| **Customer interview queue** | 🟡 MEDIUM | Founder | Not started | 2026-08-12 | Plan 5-10 user interviews in first week post-launch | Draft interview guide. Set up calendar for week of 2026-08-12. | First users must exist |

---

## 12. POST-LAUNCH MONITORING (48h)

**Status**: Not started.

| Item | Severity | Owner | Status | Deadline | Spec | Next Action | Dependencies |
|------|----------|-------|--------|----------|------|------------|--------------|
| **Live incident response** | 🔴 BLOCKER | Founder | Not started | 2026-08-10–2026-08-12 | Founder on-call. Fix critical issues (down, data loss) within 1h. | Monitor dashboard constantly. Respond to support emails. Post updates on Twitter. | Incident plan (§11), monitoring live (§11) |
| **Performance audit** | 🟡 HIGH | Agent | Not started | 2026-08-11 | Run Lighthouse, WebPageTest, GTmetrix on public pages and app | Measure TTFB, LCP, CLS, JS bundle size. Identify slow bottlenecks. | App live |
| **Social media engagement** | 🟡 MEDIUM | Founder | Not started | 2026-08-10–2026-08-12 | Monitor X, LinkedIn, Product Hunt comments. Respond authentically. | Set 2-3 check-ins per day. Prioritize questions. | Social accounts live |
| **Press outreach** | 🟡 MEDIUM | Agent | Not started | 2026-08-11 | Send launch press release to 20-30 tech journalists | Draft press release. Identify journalists covering product/AI/founder stories. Mail merge personalized emails. | Press kit (§7) |
| **Waitlist activation** | 🟡 HIGH | Agent | Not started | 2026-08-10 | Email everyone on waitlist: "It's live. Claim your spot." | Segment list. Send custom emails. Track conversion rate. | Waitlist exists, product live |
| **Metrics snapshot** | 🟡 MEDIUM | Agent | Not started | 2026-08-12 | Capture metrics at 24h and 48h post-launch | Compare: Product Hunt rank, HN rank, signups/hour, peak concurrent users, error rate | Nothing new, just observation |

---

## SUMMARY & QUICK START

### Phase 1: TODAY (2026-08-07)

**Founder**:
1. Create social@supaprod.ai in Cloudflare Email Routing
2. Set up Proton Pass Free vault under founder@supaprod.ai
3. Generate + store GitHub recovery codes
4. **DECIDE 3 founder decisions** (positioning, receipts, CTA color) — 15 minutes, unblocks all downstream copy

**Agents** (in parallel):
- Complete remaining SEO/GEO fixes (product page links, OG image, cache headers, /brief iframe, structured data)
- Draft marketing teaser video specification
- Draft Product Hunt copy (locked on positioning decision)
- Draft X launch thread (locked on positioning decision)

### Phase 2: 2026-08-08

**Founder**:
- Close out GitHub + X accounts (2FA, recovery codes)
- Start Pass 1 social accounts (YouTube, Instagram, LinkedIn — can do in parallel, ~1h each, 3h total)

**Agents** (in parallel):
- Finish SEO/GEO fixes
- Complete marketing assets (video spec, press kit, email sequences, gallery)
- Complete Product Hunt setup (page, gallery, description, first comment)
- Wire analytics + monitoring

### Phase 3: 2026-08-09

**Founder**:
- Finish Pass 1 if not done (YouTube, Instagram, LinkedIn)
- Start Pass 2 (Bluesky, Product Hunt, TikTok) — ~30 min each, 1.5h total
- Create + record marketing teaser video

**Agents** (in parallel):
- Finish analytics setup
- Create/schedule distribution content (HN post, LinkedIn, Bluesky, email)
- Create press kit

### Phase 4: 2026-08-10 (LAUNCH DAY)

**Morning**:
- Verify all systems live (analytics, monitoring, error tracking, product live)
- Post X thread
- Post to Product Hunt (unlock product page)
- Notify waitlist

**Throughout day**:
- Monitor dashboard
- Respond to social comments
- Track metrics (rank, signups, errors)

**Evening**:
- Post to HN (if metrics look good)
- Post to LinkedIn, Bluesky, Indie Hackers

### Phase 5: 2026-08-11–2026-08-12 (Post-Launch)

- Live incident response (founder)
- Social engagement (founder)
- Press outreach (agent)
- Performance audit (agent)
- Customer interviews (founder)
- Capture 24h/48h metrics

---

## RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Founder doesn't decide 3 decisions by EOD 2026-08-08** | High | Critical — blocks all copy (PH, X, landing page) | Schedule 15-min decision meeting 2026-08-08 morning. Pre-read decision doc. |
| **Social media claims are bot-walled (YouTube, Instagram)** | Medium | Moderate — Pass 1 timeline slips | Pre-verify availability via check-handles.sh immediately before signup. Alternate handles ready. |
| **Product Hunt launch does not trend** | Medium | Moderate — impacts week-1 signups | Quality of PH page (tagline, gallery, first comment) determines rank. Invest time here. |
| **Critical bug discovered at launch** | Low | Critical if data loss — otherwise moderate | Founder on-call 48h. Incident plan + SLAs document. Test product thoroughly before launch day. |
| **Positioning expansion (new + brownfield) causes confusion** | Medium | High — muddled messaging, lower PH rank | DECISION #1 resolves this. Narrow recommended for clarity. |
| **Analytics does not track signups** | Low | High — no visibility into what works | Test analytics in incognito before launch. Verify event tracking. |
| **SEO/GEO fixes not done before launch** | Low | Moderate — slower crawler indexing | Track progress daily. Parallelize work across agents. |

---

## OWNERS & CONTACT

| Role | Name | Availability | Email |
|------|------|--------------|-------|
| **Founder** | Rohit | Full-time (on-call 48h post-launch) | rohit.gmudaliar@gmail.com |
| **Agents** | Claude Code | Parallel execution (social accounts, SEO, marketing, analytics) | N/A (working with this document) |

---

**Last updated**: 2026-08-07 22:00 IST  
**Next review**: 2026-08-08 09:00 IST  
**Emergency contact**: Founder (live incident response, 2026-08-10–2026-08-12)

---

# Workstreams that had no plan until 2026-08-07

Everything above this line existed before. These eight had a heading somewhere or nothing at all, and each is grounded in what the launch audit found in the code rather than in what a checklist template says should exist. **Priority column is the order to do them in, not their importance.**

## A. Waitlist and email — capture works, reach does not exist

**Verified end to end on 2026-08-07:** a real email submitted through the live form does land in `waitlist_signups` with a referral code; a second signup through `?r=<code>` correctly sets `referred_by` and increments `referral_count`; a `waitlist_join` event records with the session key attached. Probe rows were deleted afterwards. **The capture layer is genuinely built and genuinely works.**

The headline is what sits either side of it: **1,427 `landing_visit` events since 2026-07-15 and not one real signup, ever.** The team already diagnosed that on 2026-08-05 and repointed the hero CTA to "Start free" → `/signup`, which is live.

| # | Item | Owner | Effort | Blocks launch? | Next action |
| --- | --- | --- | --- | --- | --- |
| A1 | ~~Global 20/min rate brake rejects real signups on a launch spike~~ | agent | done | was yes | **CLOSED 2026-08-07.** Raised to 300/min. The brake was global, not per-IP, so the 21st genuine person in any minute got "the queue is busy". |
| A2 | No ESP key, sending domain unverified | founder | hours | **no** | Nobody who signs up can be emailed. But nothing in the day-one stranger path touches this code, so it does not block the launch itself — it blocks everything you would want to do the week after. Resend key + verify `supaprod.ai`. |
| A3 | No confirmation email on any path | agent | hours | no | Depends on A2. A waitlist that never acknowledges reads as broken even when the row is safely stored. |
| A4 | No admin view of the waitlist | agent | hours | no | Retrieval is manual SQL today. Fine for 50 signups, not for 500. |
| A5 | No email sequence capability at all | agent | day | no | Do NOT build a drip before A2. An unsendable sequence is a spreadsheet. |

**Sequencing note:** A2 gates A3, A4 and A5. It is one founder action worth doing before any agent work here.

## B. Support, feedback and status — absent, and cheap

**The public site carries no support email, no contact route, no help centre and no status page. The only human channel anywhere is an X handle** (which 404'd until 2026-08-07). A Product Hunt visitor with a question has nowhere to go, and PH comment threads are where launch-day objections get answered in public.

| # | Item | Owner | Effort | Blocks launch? | Next action |
| --- | --- | --- | --- | --- | --- |
| B1 | No contact route or support address on any public page | either | minutes | **yes, softly** | `hello@supaprod.ai` already routes. Put it in the footer. This is the cheapest launch-readiness item on the entire board. |
| B2 | No in-product feedback path | agent | hours | no | A mailto in the app shell beats a widget for launch week. |
| B3 | No status page | agent | hours | no | Defer. With no customers there is nobody to inform, and an empty status page invites the question of what it is for. |
| B4 | Help centre / docs site | either | multi-day | no | `/faq` now carries ten question-shaped answers and `FAQPage` schema, which covers the launch-week need. A real help centre is a post-launch project. |

## C. Measurement — it writes, but nothing reads

The first-party funnel writes correctly and **captures the referrer hostname, so Product Hunt traffic would be attributable.** But `landing_events` is read by no code anywhere, and the PostHog facade is double-gated off (no key set, and `observability_enabled()` returns false in production).

**So launch day is measurable but not readable.** You would be running SQL by hand while the traffic arrives.

| # | Item | Owner | Effort | Blocks launch? | Next action |
| --- | --- | --- | --- | --- | --- |
| C1 | Nothing reads the funnel | agent | hours | no | One admin page reading `landing_events` grouped by referrer hostname and day. That is the whole launch dashboard. |
| C2 | Success criteria are undefined | founder | minutes | **yes** | Decide the numbers BEFORE the day, or every result gets rationalised afterwards. Suggested: signups, `/demo` sessions, and PH rank at 24h. Pick a figure you would be disappointed by. |
| C3 | No post-launch monitoring rota | founder | minutes | no | Founder on-call 48h is already recorded above. What is missing is what gets checked and how often. |

## D. Press kit, founder story, community

| # | Item | Owner | Effort | Blocks launch? | Next action |
| --- | --- | --- | --- | --- | --- |
| D1 | No press or media kit | agent | hours | no | Every asset already exists in `docs/growth/branding/`. A press kit here is one public page linking logo, avatars, OG card, screenshots and the boilerplate paragraph. Low effort because the hard part is done. |
| D2 | No About page or founder story | either | hours | no | The strongest existing material is in `docs/pitch/applications/betaworks-ai-camp/record-these.md`. It is more honest than most founder pages and should be reused rather than rewritten. |
| D3 | Community (Discord) | founder | hours | no | Ledger says not started. **Do not open a public invite for launch day.** An empty server visible to launch traffic is worse than no server. |
| D4 | Customer interviews | founder | ongoing | no | There are zero real users to interview. The realistic launch-week version is: reply to every PH comment and treat those as the interviews. |

## E. The honest dependency map

Most of this board does not gate the launch. Four things do, and they are the ones to protect:

1. **Deploy today's fixes.** The OG card, the icons and the `/proof` correction are all local and unpushed. Everything else on this page is worth less than shipping these.
2. **Settle one outcome** on `helio-labs-harbor`. It exercises `applyOutcome`, which has never once completed; it gives `/proof` a real number; and it produces the only frame where the compounding claim comes from the running system. One action, three unblocks.
3. **A contact address in the footer** (B1). Minutes.
4. **Success criteria** (C2). Minutes, and only the founder can set them.

Everything else can follow the launch without costing anything.

## F. The remaining checklist domains, with what is actually true

The launch-checklist domains not covered above. **Where a row says "not assessed", that is the honest state and not a pass.** Inventing a green tick for a domain nobody looked at is how a checklist becomes worse than no checklist.

| # | Domain | Verified state 2026-08-07 | Owner | Blocks launch? |
| --- | --- | --- | --- | --- |
| F1 | **Legal pages** | `/privacy`, `/terms`, `/security`, `/trust`, `/subprocessors` all exist as real routes and privacy/terms/security are linked from the footer. **This is usually the thing that sinks a launch and it is already done.** | — | no, closed |
| F2 | **Cookie consent** | ⚠️ The audit found "the privacy policy never uses the word cookie". **That is now stale** — it discloses cookies in two places, added 2026-08-07. What remains true: there is **no consent surface**. The only `document.cookie` write in the app is the sidebar open/closed preference in `src/components/ui/sidebar.tsx:86`, which is a functional cookie and needs no consent under ePrivacy. If the analytics `session-id` cookie is set without consent, that is an EU exposure. | founder | no, but resolve before EU marketing |
| F3 | **Pricing** | **Decided and correct**, contrary to the board. The live page shows four tiers (Free $0 / Pro $20 / Business $50 / Enterprise custom). The "five slugs" board entry describes internal type residue, not a customer-facing conflict, and the handoff's claim that "business appears zero times in the billing code" is verifiably wrong. | — | no, closed |
| F4 | **Onboarding** | The first-run path was rebuilt and the audit **dropped all 15 prior launch blockers as already closed**, including the post-onboarding Critic card, the dead "Try another idea" button and the onboarding crash loop. The first sixty seconds are in good shape. | — | no |
| F5 | **Demos** | `/demo` is a real no-signup workspace and `/p/teardown` is a real no-signup Critic. **Both shipped and no launch asset knows** — `launch-assets.md` still lists PC-04 as an open blocking dependency with unfilled `[DEMO-LINK]` slots. | agent | no, but it weakens every listing |
| F6 | **Accessibility** | **Not assessed.** No audit was run. The heading-structure defects Lovable flagged (`/pricing` and `/proof` lack H2s, `/investors` lacks an H1) are a11y defects as much as SEO ones. | agent | no |
| F7 | **Performance** | **Not assessed** beyond confirming the marketing routes server-render real HTML rather than an empty root div, which is the failure that would have mattered most. No Lighthouse run, no LCP measurement. | agent | no |
| F8 | **Security** | Five zero-vulnerability audits are on record across auth, tenant scoping, embeddings, migrations and billing. **Not re-verified today.** A "Security — 4 issues" badge was visible in the Lovable panel on 2026-08-07 and was never opened. | founder | **check the badge before launch** |
| F9 | **Release plan / bug triage** | Founder on-call 48h is recorded. What does not exist is a written triage rule: what counts as stop-the-launch versus fix-next-week. | founder | no, but decide it before the day |
| F10 | **Documentation** | `/faq` now carries ten question-shaped answers with `FAQPage` schema. No developer docs site. | — | no |
| F11 | **Soft-404s** | Every unknown path returns **200 with the homepage**, verified live on `/.well-known/this-does-not-exist-xyz`. This dilutes crawl budget and trips Google's soft-404 detection. | agent | no |
| F12 | **Agent discoverability** | `/mcp` is a live auth-gated MCP server with `/.mcp/list-tools` and OAuth protected-resource metadata. **`/.well-known/mcp.json` does NOT exist** (it returns the SPA shell, which is easy to mistake for a 200), and `authorization_servers` in the live protected-resource document is an empty array, so a discovering client is told there is nowhere to authenticate. | agent | no, but it is the strongest unclaimed asset |

**F12 is the most interesting row on this page.** Supaprod already exposes itself as an MCP server, which almost nothing launching this month does. It is the most credible "AI-native" proof the company owns, worth more than any hero-line adjective, and it is currently undiscoverable because the manifest is missing.
