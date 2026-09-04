# Launch Readiness Tracker — 2026-08-07

> _Created: 2026-08-07 · Last updated: 2026-08-07_

> **Deadline: THIS WEEK (Product Hunt + X launch, founder direction 2026-08-06)**
> **Owner: Founder + agents (distributed below)**
> **Single source of truth for execution status, risks, and next actions**

---

## 0. BLOCKER: Product-Level Risk

| Item | Severity | Owner | Status | Deadline | Evidence | Next Action | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **applyOutcome has never completed (zero outcome records in agent_memory)** | 🔴 blocker | Founder | Not started | 2026-08-09 | SESSION HANDOFF: "applyOutcome has still never completed (957 memories, 119 learnings, zero outcomes)". 2026-08-06 verified: all three writes (learnings insert, agent_memory insert, prds.outcome update) accepted in rolled-back transaction. No database constraint blocks it. Workspace trigger (BEFORE INSERT) was reproduced and pinned. | Execute /learn on a seeded spec in a test workspace; confirm outcome row appears in agent_memory with correct workspace_id | If /learn fails in launch week, the core differentiation (decision→outcome→guidance) is unproven and undermines trust-ledger narrative |

---

## 1. FOUNDER PREREQUISITES (gates all social account claiming)

| Item | Severity | Owner | Status | Deadline | Evidence | Next Action | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Authorize Notion OAuth** | 🔴 blocker | Founder | Pending auth | Today | notion-push.md: "NOT YET PUSHED". OAuth URL generated but not yet opened. | Open the authorization URL and approve. Then provide parent page URL for Brand & Social Ops workspace. | If not done, cannot mirror social account ledger to Notion |
| **Create social@supaprod.ai explicitly** | 🔴 blocker | Founder | Not created | Today | Catch-all routing is live, but explicit address is required for account ownership transferability. docs/growth/brand-ops/social-accounts.md §0.1. | Cloudflare → supaprod.ai zone → Email Routing → Create custom address → social → your inbox | Every account claimed before this exists is welded to a personal identity; cannot be handed off |
| **Set up Proton Pass vault under founder@supaprod.ai** | 🔴 blocker | Founder | Not created | Today | Standing debt noted in social-accounts.md §0.2: "The vault does not exist yet." Personal GitHub account controls the entire supaprod org; losing it loses the org. | (a) Create Proton Pass Free account under founder@supaprod.ai. (b) Generate recovery codes for your personal GitHub account (github.com/settings/auth/recovery-codes). (c) Store those codes in the vault. | If not done, recovery codes for the org are lost. Losing personal GitHub account = losing the entire organization. |

---

## 2. SOCIAL ACCOUNTS (Pass 1 — Contested, high visibility)

*Prerequisite: Founder prerequisites (section 1) must be complete.*

| Platform | Handle | Status | Owner | Deadline | Evidence | Walkthrough | Next Action | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **GitHub org** | `supaprod` | ✅ CLAIMED 2026-08-05 | Founder | ✅ Done | check-handles.sh verified; avatar, description, URL, email all live | docs/growth/brand-ops/social-accounts.md §6.1 | Migrate personal GitHub account's recovery codes to Proton Pass vault | None |
| **X** | `@supaprodhq` | ✅ CLAIMED 2026-08-05 | Founder | ✅ Done | check-handles.sh verified (http 200, bot-walled but claimed); account exists | docs/growth/brand-ops/social-accounts.md §6.2 | Verify 2FA is on, save recovery codes to vault, update section 8 ledger | Header image not yet uploaded; see §3 assets |
| **YouTube** | `@supaprodhq` | Not started | Founder | 2026-08-08 | Available (docs checked as of 2026-08-05, ~3% confidence given bot-walling) | docs/growth/brand-ops/social-accounts.md §6.3 — ⚠️ **MUST be Brand Account, not personal channel** | Create account; use channel_switcher path to force Brand Account (not avatar menu); upload avatar + banner; close-out (2FA, TOTP seed, recovery codes to vault) | If personal channel chosen, conversion is messy and later. This is the single most common irreversible mistake on the list. |
| **Instagram** | `@supaprodhq` | Not started | Founder | 2026-08-08 | Unknown, bot-walled (available assumption per board, ~2% confidence) | docs/growth/brand-ops/social-accounts.md §6.4; must precede Threads | Create account from instagram.com/accounts/emailsignup; switch to professional (Business); close-out (2FA, TOTP, recovery codes) | Must be done BEFORE Threads creation. If Threads created first, cannot redo Instagram easily. |
| **LinkedIn** | `company/supaprod` | Not started | Founder | 2026-08-08 | Available per check-handles.sh (http 404); ⚠️ **MAKES NAME PUBLICLY INDEXABLE IMMEDIATELY** | docs/growth/brand-ops/social-accounts.md §6.5 | Go to linkedin.com/company/setup/new; answer questions honestly (1 employee, Privately Held, no legal entity); fill company info; cover image (4200x700, NOT 1128x191 — upscale kills quality); close-out (on personal LinkedIn account that controls the page) | Going live here means the name becomes searchable and indexable. Trademark filing is in parallel (item §9). |

---

## 3. SOCIAL ACCOUNTS (Pass 2 — High Value)

*Prerequisite: Pass 1 complete.*

| Platform | Handle | Status | Owner | Deadline | Evidence | Walkthrough | Next Action | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Bluesky** | `supaprod` (exact name free) | Not started | Founder | 2026-08-09 | bsky.app API cannot resolve (available assumption, ~95% confidence) | docs/growth/brand-ops/social-accounts.md §6.6 | Create account at bsky.app with exact name `supaprod`; fill profile; close-out; then optionally set domain-as-handle for `@supaprod.ai` (TXT record at _atproto.supaprod.ai) | None |
| **Product Hunt** | `supaprod` | Not started | Founder | 2026-08-10 (before launch) | Unknown, bot-walled; assume available per board | docs/growth/brand-ops/social-accounts.md §6.7 | Sign up at producthunt.com; complete maker profile first; create product page UNLISTED (launch is a card you play once); upload assets | **CRITICAL: Keep unlisted until all assets are live and demo is real.** Launching is irreversible. |
| **TikTok** | `@supaprodhq` | Not started | Founder | 2026-08-09 | Unknown, bot-walled | docs/growth/brand-ops/social-accounts.md §6.8 | tiktok.com/signup; switch to Business after signup; close-out | None |

---

## 4. SOCIAL ACCOUNTS (Pass 3 — Defensive)

*Prerequisite: Pass 1 and 2 complete. Instagram must be done before Threads.*

| Platform | Handle | Status | Owner | Deadline | Evidence | Walkthrough | Next Action | Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Threads** | `@supaprodhq` | Not started | Founder | 2026-08-09 | Created from Instagram account, no separate close-out | docs/growth/brand-ops/social-accounts.md §6.9 | Sign into threads.net WITH Instagram account; accept name/photo import | Do NOT create before Instagram. If Instagram not yet done, this cannot be redone easily. |
| **Mastodon** | `@supaprodhq` | Not started | Founder | 2026-08-09 | Unknown | docs/growth/brand-ops/social-accounts.md §6.10 | Pick instance (fosstodon.org or mastodon.social); sign up; fill profile; add Website metadata with rel=me verification | None |
| **Discord** | `supaprod` | Not started | Founder | 2026-08-09 | Unknown | docs/growth/brand-ops/social-accounts.md §6.11 | discord.com/register; create server; set name/icon/description; **banner requires Boost Level 2**, do not apply it yet | None |
| **Reddit** | `u/supaprodhq` | Not started | Founder | 2026-08-09 | Unknown | docs/growth/brand-ops/social-accounts.md §6.12 | reddit.com/register; set avatar/bio; ⚠️ defensive only — Reddit penalizes brand self-promotion hard | None |
| **npm org** | `supaprod` | Not started | Founder | 2026-08-09 | Available per check-handles.sh (http 404) | docs/growth/brand-ops/social-accounts.md §6.13 | npmjs.com/org/create; create Free organization | None |
| **PyPI** | `supaprod` | Not started | Founder | 2026-08-09 | Available per check-handles.sh (http 404) | docs/growth/brand-ops/social-accounts.md §6.14 | pypi.org/account/register; **PyPI requires 2FA** | None |
| **Crunchbase** | `supaprod` | Not started | Founder | 2026-08-12 (post-launch ok) | Unknown | docs/growth/brand-ops/social-accounts.md §6.15 | crunchbase.com; add company profile; ⚠️ submissions reviewed, takes days | Investor-facing; can be done after launch |

---

## 5. PRODUCT SITE & SEO/GEO FIXES

*These block a qualified Product Hunt/HN launch; fixes range from minutes to hours.*

| Item | Severity | Owner | Status | Deadline | Evidence | Walkthrough | Next Action | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Analytics sets session-id cookie; privacy policy never mentions cookies; no consent surface** | 🔴 blocker | Agent | Not fixed | 2026-08-08 | /~flock.js writes `document.cookie` session-id + 8 localStorage keys. privacy.tsx has zero matches for "cookie". No CookieBanner component exists. Lovable audit confirmed. | docs/planning/LAUNCH-READINESS-TRACKER-2026-08-07.md §5 SEO findings #1 | Add "Cookies and local storage" section to privacy.tsx naming session-id, its 30m lifetime, and localStorage keys. Add consent gate: inject /~flock.js only after accept click, persist choice in localStorage. Or: delete the document.cookie write and say analytics are cookieless in privacy policy. | Without this, the site fails GDPR/privacy compliance for any EU traffic and Product Hunt reviewers will flag it. |
| **/p/teardown ssr:false returns crawlers only "Loading"; the public acquisition wedge is invisible to search** | 🔴 blocker | Agent | Not fixed | 2026-08-08 | src/routes/p.teardown.tsx:31 sets ssr: false. curl returns body text "Loading" + hydration script only. Page is priority 0.7 in sitemap and linked from footer as "A public teardown". Lovable audit confirmed. | Server-render the above-the-fold shell (h1, explanation, EXAMPLE_BET specimen, sample receipt) without browser APIs. Guard interactive parts behind mounted check. Verify fix: `curl supaprod.ai/p/teardown | grep -c '<h1'` >= 1 | The no-signup wedge is invisible to Product Hunt visitors and AI crawlers. This is launch-day visibility lost. |
| **Canonical tags missing on 13 of 17 public routes** | 🔴 blocker | Agent | Not fixed | 2026-08-08 | Missing on pricing, demo, proof, security, privacy, terms, updates, ard, subprocessors, p.teardown, d.$slug, p.$slug, t.$slug. Product Hunt's ?ref= param will duplicate every one. Lovable audit confirmed. | Extract seoHead({ path, title, description }) helper in src/lib; convert every public route to use it. Add canonical link element to every route's head(). | Without canonicals, launch-day traffic via Product Hunt (all appended with ?ref=producthunt) will fragment rankings across duplicate URLs. |
| **No question-shaped FAQ headings; AI answer engines cannot lift and cite you** | 🟡 high | Agent | Not fixed | 2026-08-09 | Zero headings phrased as questions (h2 values are all statements). Zero FAQ section in src/routes. Lovable audit confirmed. | Add src/routes/faq.tsx with h2 headings phrased as questions ("What is Supaprod?", "How is Supaprod different from…", etc.); each answered in 40-60 words directly under heading. Or: add FAQ section to product.tsx. Add to footer + sitemap. | AI answer engines (ChatGPT, Claude, Perplexity, Google AI Overviews) cite sources by lifting question-shaped content. Without this, you stay invisible in AI-generated answers even if ranked. |
| **Structured data (JSON-LD) stops at homepage; no FAQPage, Offer, BreadcrumbList** | 🟡 high | Agent | Not fixed | 2026-08-09 | grep returns only index.tsx carries ld+json. /product, /pricing, /security, /brief, /demo, /proof, /ard, /p/teardown all carry zero blocks. Lovable audit confirmed. | Add JSON-LD to key routes via head() scripts array: FAQPage on /faq (byte-identical to visible copy), Offer nodes on /pricing (matching real plan names/prices from src/lib/entitlements), HowTo or ItemList on /product (the seven stations), extend homepage SoftwareApplication with featureList. | Structured data is what AI answer engines parse. Without it, even question-shaped content is harder to lift. |
| **/brief's deck lives inside iframe; crawlers see no content** | 🟡 high | Agent | Not fixed | 2026-08-09 | BriefDeck.tsx:20 renders iframe src=/brief.html. curl /brief returns 3.9KB shell with only text "Loading". Live /brief.html is 506KB with five h1s. Google does not attribute iframe content to parent. Lovable audit confirmed. | Either: (a) server-render text summary above iframe (h2 + paragraph for problem, three layers, market, team, ~600 words); guard interactive parts behind mounted check. Or: (b) accept /brief as share link; add rel=canonical href=/brief to /brief.html; collapse five h1s to one. | A Product Hunt launch that lists /brief in the pitch but sends crawlers an empty shell looks broken. |
| **robots.txt has no Disallow; entire authenticated app (80 routes) is crawlable** | 🟡 high | Agent | Not fixed | 2026-08-08 | No Disallow in public/robots.txt. /today, /missions, /build, /knowledge return 200 with real titles, no robots meta, no noindex. Lovable audit confirmed. | Add to public/robots.txt before Sitemap line: Disallow list (/today, /missions, /build, /knowledge, /trust-ledger, /discover, /settings, /admin, /inbox, /approvals, /api/, /checkout, /join/, /reset-password, /forgot-password). Add noindex, nofollow meta to src/routes/_authenticated.tsx head() so children inherit it. Keep crawlers Allow blocks for GPTBot, ClaudeBot, PerplexityBot as-is. | Launching with your entire app crawlable wastes crawl budget, spreads your PageRank thin across auth-only content, and can hurt rankings of actual pages you want found. |
| **Ambiguous terminology in /llms.txt; uses banned vocabulary and points to 404** | 🟡 high | Agent | Not fixed | 2026-08-08 | public/llms.txt uses "Remember" (banned word), em dashes (banned punctuation), references /products (404), frames product as "Sense/Decide/Execute/Remember" (not current canon). Lovable audit confirmed. | Rewrite public/llms.txt against v10-master-blueprint.md. Replace fourth bullet with "Learn: every decision is graded, next call is guided by what proved true". Strip em dashes. Delete /products or point at /discover. Restructure as three layers: director, operating system (seven named stations), company brain. Add public/llms-full.txt with expanded descriptions + FAQ + pricing. | Perplexity, ChatGPT, and Grok all fetch llms.txt and llms-full.txt. If it's wrong or banned, they will either skip you or cite you incorrectly. |
| **/llms-full.txt missing** | 🟡 high | Agent | Not fixed | 2026-08-08 | curl llms-full.txt returns 404. Public llms.txt exists but is sparse. Lovable audit confirmed. | See above. Create public/llms-full.txt with full station-by-station description, FAQ answers verbatim, pricing table. | AI crawlers fall back to llms.txt if full is absent, but full is preferred. Missing it weakens what they can cite about you. |
| **Sitemap lists /mcp (401) and /trust (redirects to /security)** | 🟡 medium | Agent | Not fixed | 2026-08-08 | public/sitemap.xml includes /mcp (returns 401) and /trust (307 to /security). src/routes/trust.tsx states "is retired from the sitemap" but file still exists on disk. All lastmod values are 2026-07-15/24, stale. Lovable audit confirmed. | Delete /mcp and /trust url blocks from sitemap.xml. Update every lastmod to launch date. Change redirect in trust.tsx from 307 to 301/308 so ranking consolidates to /security. Add /brief.html only if you decide not to canonicalize away. | Stale sitemap confuses crawlers about what pages are actual vs. deprecated. 307 keeps ranking split between /trust and /security. |
| **/product orphaned: second-priority sitemap page (0.9), zero internal links** | 🟡 medium | Agent | Not fixed | 2026-08-08 | /product in sitemap at priority 0.9 but zero internal links to it (grep shows no to="/product" or href="/product"). Footer lists only Demo, Pricing, Updates under product column. Lovable audit confirmed. | Add "How it works" → /product to product column of LandingFooter.tsx:29; add same to LandingNav.tsx next to Demo. Add /product link from homepage body (from the "One system, three layers" section). Add /subprocessors to footer trust column after Terms. | An orphaned, high-priority page that never receives internal links ranks poorly despite the sitemap hint. |
| **Every marketing page is no-cache; 1.6s warm TTFB on homepage; OG image is 471KB PNG** | 🟡 medium | Agent | Not fixed | 2026-08-08 | cache-control: no-cache, must-revalidate on /, /pricing, /product, /privacy, /terms, /security, /demo, /p/teardown. Homepage measured ttfb 1.636s warm (total 2.063s, 140KB HTML). /og-supaprod.png is 471,226 bytes. Lovable audit confirmed. | Set cache-control on public routes: `public, s-maxage=300, stale-while-revalidate=86400`. Move LandingBackdrop grid SVG into stylesheet as CSS background to de-inline and shrink HTML. Move OG image optimization: re-encode at quality 85 or convert to optimized PNG, target <150KB. Measure warm ttfb again; target sub-500ms for Product Hunt traffic. | A 1.6s TTFB on launch day looks slow to Product Hunt reviewers. A 471KB OG image will be refetched per unfurl on X, Product Hunt, Slack. |
| **Alternate hostnames (lovable.app, www) use 302 redirects, not 301** | 🟡 low | Agent | Not fixed | 2026-08-08 | lovable.app and www both redirect with 302 to supaprod.ai, signaling temporary move. Search engines may keep indexing the origin host. Lovable audit confirmed. | Set both host-level redirects to 301. Point all Product Hunt and X launch links directly at supaprod.ai, never at lovable.app, so no launch-day link depends on a redirect at all. | A 302 keeps search engines from consolidating rankings onto the canonical host. |
| **No status page; uptime commitment not visible** | 🟡 low | Agent | Not started | 2026-08-10 (post-launch ok) | curl /status returns 404. No status link in footer. Lovable audit confirmed. | Either: (a) add src/routes/status.tsx that renders /api/public/health result + plain-language uptime statement, link from footer trust column, add to sitemap; or (b) leave it out. Do not link to a 404. | Not critical for launch, but can be done in parallel. If you do add it, it gives trust signals. |

---

## 6. MESSAGING & POSITIONING VALIDATION

| Item | Severity | Owner | Status | Deadline | Evidence | Next Action | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Confirm: narrow positioning (new product teams) or expand (brownfield + product enhancements)?** | 🔴 blocker | Founder | Pending decision | 2026-08-08 | Audit dimension "positioning-brownfield" not yet returned. Founder proposed: also serve companies with existing products, connecting their existing sources, using Supaprod to discover/plan/build/ship/learn enhancements. v10-master-blueprint.md current positioning unknown to audit. | Read v10-master-blueprint.md. Decide: launch narrow (new product teams only, sharper message, proven ICP) or wide (greenfield + brownfield, two sentences, diluted but larger TAM). Decision affects copy on /brief, /product, Product Hunt tagline. | If launch week message is confused between two audiences, Product Hunt reviewers will note it and impact rank. Brownfield is more defensible sales-motion but muddies launch clarity. |
| **Decide: homepage Receipts section — label as example, publish real receipt, or remove?** | 🔴 blocker | Founder | Pending decision | 2026-08-08 | Lovable panel flagged "Replace placeholder examples with real product receipts". Board shows ~8 internal users, no revenue. Do not auto-fix. | (a) Label the examples visibly as examples ("Example workspace: Acme Co's product roadmap"); (b) publish one real receipt from your own workspace (only if you have a meaningful decision to show); (c) remove the section for launch and add it post-beta. | An agent told to "replace placeholder examples with real receipts" and given no context can fabricate traction on the homepage. That is the core failure this canon forbids. |
| **Decide: white "Start free" CTA in public nav — keeper or change color?** | 🔴 blocker | Founder | Pending decision | 2026-08-08 | Session handoff notes: "The white 'Start free' pill in the PUBLIC landing nav. Tonight's sweep deliberately left marketing surfaces alone (restyling signup CTAs is a funnel change). Your ruling says nothing white in our platform. Your call." | Review LandingNav.tsx. If white is off-brand, change to brand color. If it's intentional contrast for accessibility, leave it. Decision needed before launch. | Minor UX call, but blocking until decided per handoff. |

---

## 7. PRICING & ENTITLEMENTS (known gap)

| Item | Severity | Owner | Status | Deadline | Evidence | Next Action | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Four-tier pricing ruling (locked 2026-07-13) never implemented; code ships FIVE slugs** | 🔴 blocker | Agent | Not fixed | 2026-08-08 | Handoff notes: "The four-tier pricing ruling (locked 2026-07-13) was never implemented. Code and DB still ship FIVE slugs and 'business' appears zero times. Touches money, so flagged not migrated." Handoff also warns: "LOADED GUN, inert today: set_agent_memory_expiry expires memories at 30 days for non-paid tiers... 'business' is ABSENT. Land the pricing first, flip this later." | Audit dimension "product-readiness" should detail this. Decode: are we shipping Free/Pro/Business/Enterprise (4 tiers) or Free/Pro/Max/Team/Enterprise (5)? Rename/delete rows in the pricing table. Update `entitlements.ts` and all tier checks. Rebuild /pricing UI for four tiers. Update docs/growth/brand-ops/notion-push.md and any deck/brief that references pricing. | **CRITICAL LOADING GUN**: set_agent_memory_expiry is enabled for non-paid tiers but references ('pro','max','team','enterprise'); 'business' is absent from that list. If we're moving to Business tier and this code ships, Business customers' outcome memories will start expiring after 30 days, deleting the moat. Must land pricing correctly first, verify memory_expiry_enabled() is false or list is updated before launch. |

---

## 8. LEGAL, COMPLIANCE & TRUST SURFACES (already live)

| Item | Severity | Owner | Status | Deadline | Evidence | Next Action | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Privacy policy must document analytics cookies and localStorage** | 🔴 blocker | Agent | Partial | 2026-08-08 | privacy.tsx exists as route but does not mention cookies, localStorage, or the session-id cookie set by /~flock.js. See §5 analytics finding. | Update privacy.tsx "Cookies and local storage" section to list session-id (first-party, 30m, product analytics) and localStorage keys. If moving to cookieless analytics, document that instead. | Failure to disclose cookies in privacy policy is a compliance gap. Product Hunt reviewers may flag. EU visitors may trigger GDPR enforcement. |
| **Google Search Console not connected** | 🟡 high | Founder | Not started | 2026-08-09 | Lovable audit finding: "Google Search Console isn't set up". No GSC connection. Does not prevent crawling/indexing, but blocks Lovable's automated sitemap submission and indexing actions. | founder@supaprod.ai login to search.google.com → Add property → Domain: supaprod.ai → Verify (usually via DNS TXT record) → Submit sitemap.xml. | Without GSC, you cannot see Search Console errors, mobile usability issues, or click-through rates post-launch. It is measurement, not ranking, but post-launch debugging is harder. |
| **Terms of service** | ✅ live | — | Done | ✅ Done | src/routes/terms.tsx exists; linked from footer | None | None |
| **Security page** | ✅ live | — | Done | ✅ Done | src/routes/security.tsx exists; linked from footer | None | None |
| **Subprocessors** | ✅ live | — | Done | ✅ Done | src/routes/subprocessors.tsx exists; referenced in privacy linkage | None | None |

---

## 9. DISTRIBUTION CHANNELS — LAUNCH PLAN

*Prerequisite: Product is launch-ready (sections 1–8 complete).*

| Channel | Effort | Impact | Deadline | Owner | Status | Walkthrough | Next Action | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Product Hunt (self-launch, soft launch)** | 2 days | ⭐⭐⭐⭐⭐ | 2026-08-09 | Founder + agent | Not started | docs/growth/00-launch-operating-manual.md, 01-channel-playbooks.md, 07-gtm-ground-truth.md | Schedule launch at producthunt.com/launch; confirm all assets live (Product Hunt thumbnail 600x400, gallery images, tagline "The product team that learns what actually worked", first comment written); go live at 12:01am PT (typical convention); prepare 48h monitoring plan. **Keep product UNLISTED until all assets live and demo is real.** Verify: demo shows real users with real data, not placeholder workspace. | If you ship a placeholder demo or unfinished assets, Product Hunt reviewers will downrank or remove. Launch is a card you play once. |
| **Hacker News (Show HN)** | 2 days | ⭐⭐⭐⭐ | 2026-08-10 (day after PH) | Founder + agent | Not started | HN title formula: "Show HN: Supaprod — [one-line value prop]". Example: "Show HN: Supaprod — Agentic OS for product teams that joins decisions to outcomes and gets sharper". Avoid "AI PM tool" phrasing; HN will downvote. Target post time: 2–4pm PT (peak HN activity). | Write the HN comment draft in advance. Schedule for day after Product Hunt to ride momentum without direct channel duplication. Do not cross-post Product Hunt copy; HN readership hates spam and will flag. | HN is notoriously anti-hype, anti-AI-marketing. "We built an AI PM tool for product managers" will be flagged. "We taught agents to own outcomes, not just outputs" reads better and is true. |
| **X (Twitter) launch thread** | 1 day | ⭐⭐⭐⭐ | 2026-08-09 (simultaneous with PH) | Founder | Not started | Craft 5–7 tweet thread. Open with the problem (product decisions made blind to outcomes). Show the three-layer solution (director, OS, brain). Use your @supaprodhq handle. Mention Product Hunt link in thread. Use #buildinpublic, #productdev, #agentic. Retweet major replies. | Draft thread and schedule to post at launch time (or shortly after PH goes live). Assign monitoring watch during launch day (retweet supporters, respond to questions, flag technical issues). | If the X thread is generic hype-speak, it will get dunked and buried. If it is specific, honest, and shows code/outcomes, it will thread. Supaprod's best X signal is showing the actual loop running (signal→decision→build→learn). |
| **Indie Hackers** | 1 day | ⭐⭐⭐ | 2026-08-10 | Agent | Not started | Post to Indie Hackers with the same HN-style copy (one-line value prop, focus on product differentiation, not hype). Link to Product Hunt + HN thread for social proof. | Submit the launch post; monitor for replies; this audience is kind to founder-led products. | Lower reach than HN or PH but highly targeted at builders. Good for second-day momentum. |
| **LinkedIn (founder story + company post)** | 1 day | ⭐⭐⭐ | 2026-08-09 | Founder | Not started | Post on your personal LinkedIn: "Today I shipped Supaprod..." (founder story, problem, aha moment, what it does). Company page posts the same or a variant. Tag @Supaprod org and use #launch, #founders, #productteams. | Write and schedule posts; recruit supporters to like/comment early (signals matter on LinkedIn). Post simultaneous with PH launch or same morning. | LinkedIn reach is modest for dev products but strong for founder credibility signals. Investors watch for founder voice here. |
| **Bluesky and Mastodon** | 0.5 day | ⭐⭐ | 2026-08-09 | Founder | Not started | Post brief launch announcement (3–4 sentences, problem + solution, link to Product Hunt). Same message across both, adapted for platform tone. Bluesky is casual, Mastodon is technical/verbose-friendly. | Schedule simultaneous with PH. Bluesky: casual tone ("just shipped something I'm excited about"). Mastodon: technical ("the signal-to-decision-to-outcome loop is now live"). | Reach is smaller than X/LinkedIn but Mastodon and Bluesky audiences are supportive of indie launches. |
| **Redirect campaigns: landing page, email list, waiting list** | 2 days | ⭐⭐⭐⭐⭐ | 2026-08-08 | Founder + agent | Pending assessment | *Audit dimension "waitlist-analytics" not yet returned.* TBD: confirm there IS an email capture on the landing page, a waitlist backend, and an email sequence ready. | Verify: (a) landing page email capture works and sends confirmation. (b) captured emails are stored and retrievable by you. (c) a "we shipped, here's the link" drip is drafted and ready to send on launch day. (d) referral mechanism (if any) is wired. | If you have no waitlist backend or email sequence, you lose the list you've been building since launch was announced. This is high-leverage if done, high-regret if missed. |
| **Ad budget (optional)** | TBD | ⭐⭐ | 2026-08-10+ | Founder | Not decided | Low-lift option: $500/week on Google Ads (search) or $300/week on Twitter Ads (reach). Target: "agentic product team", "product OS", "AI-native workflow". Geo-target US + Western Europe. Track UTM=paid to segment analytics. | Decide if worth the spend. If yes, set budgets and geo targets 2026-08-08 so they're live launch morning. Track spend vs. conversion via analytics (requires Google Analytics 4 or PostHog wired first). | Optional pre-launch spend can amplify reach but is not required for a successful launch if organic channels are strong. |

---

## 10. MARKETING ASSETS (Status inventory)

| Asset | Status | Location | Effort to complete | Deadline |
| --- | --- | --- | --- | --- |
| **Logo, avatars, banners (per platform)** | ✅ Built | docs/growth/branding/ (orrery.ts + generate-social.ts) | None | ✅ Done |
| **OG image (1200x630)** | ✅ Built but large | /og-supaprod.png (471KB; needs optimization to <150KB) | hours | 2026-08-08 |
| **Product screenshots** | ⚠️ Partial | docs/screenshots/ (gitignored) | TBD per audit | TBD |
| **Demo video (YC + site hero)** | ⚠️ Spec'd, not filmed | docs/pitch/demo-script.md, runsheet (74.9MB YC video exists; teaser cut not yet produced) | 2–4 days | 2026-08-10 (post-launch ok) |
| **One-pager** | ✅ Built | docs/pitch/ | None | ✅ Done |
| **Press kit** | ⚠️ Spec'd, not built | docs/pitch/README.md notes press-kit needed | 1 day | 2026-08-09 |
| **Founder story** | ⚠️ Partial | docs/pitch/ (design-partner-kit.md exists; founder bio not yet written) | hours | 2026-08-09 |
| **FAQ content** | ⚠️ Not built | See §5 finding "No question-shaped headings" | hours | 2026-08-09 |
| **Pricing page** | ⚠️ Live but broken (5 tiers, not 4) | src/routes/pricing.tsx | hours | 2026-08-08 |
| **Product Hunt assets** | ⚠️ Partial | Thumbnail (600x400), gallery images, tagline, first comment | 1 day | 2026-08-09 |
| **Case studies / testimonials** | ❌ None | — | N/A (no traction yet) | Post-launch |
| **Email launch sequence** | ⚠️ Spec'd, not sent | See waitlist audit findings | hours | 2026-08-08 |
| **X thread** | ⚠️ Not drafted | Launch plan §9 | hours | 2026-08-09 |
| **HN post draft** | ⚠️ Not drafted | Launch plan §9 | hours | 2026-08-09 |

---

## 11. POST-LAUNCH MONITORING & TRIAGE (Ready for day-1)

| Workstream | Owner | Action | Deadline | Risk |
| --- | --- | --- | --- | --- |
| **Live incident response** | Founder + agent | Monitor Product Hunt comments, HN threads, X replies for 48h post-launch. Triage bugs vs. questions. Respond to every substantive comment within 2h. | 2026-08-09–2026-08-11 | If you don't monitor, negative comments compound. First-day perception is make-or-break. |
| **Analytics setup & tracking** | Agent | Verify Google Analytics 4 (or PostHog) is receiving events. Set up UTM tracking for all launch channels so you can measure channel attribution. Set up conversion funnels (landing → signup → first spec created). | 2026-08-08 | Without analytics live at launch, you won't know which channel drives conversions. Post-hoc analysis is weak. |
| **Feedback collection** | Founder | Set up a simple feedback form (Typeform, Sprig) or Slack community for early users to report bugs and feature requests. Goal: rapid iteration if something is broken. | 2026-08-09 | First week defines whether users come back. Fast response to feedback builds loyalty. |
| **Bug triage SLA** | Founder | Commit to: P0 (login broken, data lost) → fix same day. P1 (feature not working, confusing) → fix within 48h. P2 (polish, performance) → backlog. | 2026-08-09+ | If you ship P0 bugs to Product Hunt and don't fix them that day, your product rating collapses. |
| **Deployment readiness** | Agent | Ensure CI/CD is green, Supabase migrations are synced (81/81 per handoff), and the deployed SHA matches the git tree. Test one full end-to-end flow on production 2h before launch. | 2026-08-08 | A deploy that breaks on launch day is unrecoverable. |

---

## TIMELINE & CRITICAL PATH

```
2026-08-07 (TODAY)
├─ ☐ Founder: authorize Notion OAuth
├─ ☐ Founder: create social@supaprod.ai
├─ ☐ Founder: set up Proton Pass vault
├─ ☐ Founder: decide positioning (narrow vs. brownfield)
├─ ☐ Founder: decide Receipts section
├─ ☐ Founder: decide white CTA color
└─ ☐ Agents: fix analytics cookie disclosure + privacy policy

2026-08-08 (THURSDAY)
├─ ☐ Agents: Fix 3 SEO blockers (/p/teardown ssr, canonical tags, robots.txt)
├─ ☐ Agents: Fix pricing (4 tiers, not 5) + memory_expiry_enabled() validation
├─ ☐ Agents: Fix /llms.txt + add /llms-full.txt
├─ ☐ Founder: Complete Pass 1 social accounts (YouTube, Instagram, LinkedIn)
├─ ☐ Founder: verify Google Search Console connection
└─ ☐ Founder: draft Product Hunt assets + HN thread + X thread

2026-08-09 (FRIDAY)
├─ ☐ Agents: Fix remaining SEO findings (FAQ, structured data, orphaned pages, caching)
├─ Founder: Complete Pass 2 social accounts (Bluesky, Product Hunt, TikTok)
├─ ☐ Founder: SHIP Product Hunt launch (12:01am PT or announce time)
├─ ☐ Founder: post X thread + LinkedIn + Bluesky + Mastodon
├─ ☐ Founder: monitor PH comments + setup analytics tracking + feedback form
└─ ☐ Agent/Founder: test applyOutcome (settle one outcome in /learn) — verify outcome row created

2026-08-10 (SATURDAY)
├─ ☐ Founder: post Hacker News "Show HN" thread (2–4pm PT)
├─ ☐ Founder: complete Pass 3 social accounts (Threads, Mastodon, Discord, Reddit, npm, PyPI)
├─ ☐ Founder: continue launch monitoring (48h window ongoing)
├─ ☐ Agents: film teaser video OR decision to defer post-launch
└─ ☐ Agents: post-launch retrospective (what drove traffic, drop-off, highest-value feedback)

2026-08-11 (SUNDAY)
├─ ☐ Founder: continue monitoring through end of 48h window
├─ ☐ Founder: claim any remaining accounts (Crunchbase, etc. — defensive only)
└─ ☐ Founder + agents: triage high-priority feedback + bugs + deploy fixes

2026-08-12+ (POST-LAUNCH)
├─ ☐ Agents: film high-quality teaser video (if deferred)
├─ ☐ Agents: write case studies from launch learnings
├─ ☐ Agents: build help center / FAQ site
├─ ☐ Agents: optimize based on analytics (highest drop-off, highest convert channels)
└─ ☐ Founder: evaluate opportunities (Y Combinator Launches, investors, press)
```

---

## RISK SUMMARY

| Risk | Probability | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- |
| **applyOutcome fails; zero outcomes recorded** | Medium | 🔴 Critical | Execute /learn before launch; confirm outcome row in agent_memory with correct workspace | Founder + agent |
| **Analytics cookie disclosure missing; GDPR violation** | Medium | 🔴 Critical | Add cookie section to privacy.tsx today; add consent gate or move to cookieless analytics | Agent |
| **/p/teardown (no-signup wedge) is invisible; launch-day crawlers see "Loading"** | High | 🔴 Critical | Fix SSR:false and server-render static content today | Agent |
| **Canonical tags fragmented; Product Hunt ?ref=X duplicates every page** | High | 🟡 High | Add canonical link to all 13 routes; consolidate fragments before launch | Agent |
| **Pricing still ships FIVE tiers, not FOUR; memory_expiry_enabled() breaks Business customers** | High | 🟡 High | Decode and implement correct tier model; validate memory expiry is disabled or whitelist updated | Agent + Founder |
| **No question-shaped FAQ; AI answer engines cannot cite you** | Medium | 🟡 High | Add FAQ section with h2-as-questions; deploy before launch day | Agent |
| **Positioning unclear (narrow vs. brownfield); launch message confused** | Medium | 🟡 High | Founder decides by EOD 2026-08-08; all copy locked to one positioning | Founder |
| **Receipts section shows fake data; traction fabricated** | Medium | 🟡 High | Founder decides: label as examples, show one real receipt, or remove. Do NOT auto-fix | Founder |
| **Social accounts not claimed; brand accounts fragmented across platforms** | Low | 🟡 Medium | Complete Pass 1 (YouTube, Instagram, LinkedIn) by 2026-08-09; rest by 2026-08-11 | Founder |
| **No analytics tracking live; cannot measure launch; cannot optimize** | Medium | 🟡 Medium | Verify GA4 or PostHog receiving events; setup UTM on all channels; deploy before launch | Agent |
| **No email sequence ready; waitlist not captured; list lost** | Low | 🟡 Medium | Verify landing page capture works; draft drip sequence; test before launch | Founder + Agent |
| **Product Hunt tagline is generic hype; gets downranked** | Low | 🟡 Medium | Use exact copy: "The product team that learns what actually worked". Avoid "AI PM tool". | Founder |
| **Hacker News post uses banned terminology; flagged and removed** | Low | 🟡 Medium | Avoid "remembers", "stores", "logs", "AI PM tool". Use "agents own outcomes, decisions guide the next call". | Founder |

---

## EXECUTION OWNER MATRIX

| Workstream | Primary | Secondary | Decision Gate |
| --- | --- | --- | --- |
| Founder prerequisites (Notion, social@, Proton Pass) | Founder | — | Must complete before Pass 1 accounts |
| Social account claiming (all passes) | Founder | Agent (ledger update) | Must track in Notion per social-accounts.md §8 |
| SEO/cookie/robots fixes | Agent | Founder (review) | All blockers done before launch |
| Pricing tier model | Agent | Founder (validate) | Correct 4-tier model deployed before launch |
| Analytics setup | Agent | Founder (monitor) | Live before launch day |
| Positioning decision | Founder | Agent (execute copy) | By 2026-08-08 close of business |
| Receipts decision | Founder | Agent (execute) | By 2026-08-08 close of business |
| Product Hunt launch | Founder | Agent (asset preparation) | All assets live 2026-08-09 00:01 PT |
| HN/X/LinkedIn posts | Founder | Agent (draft) | Drafted 2026-08-08, posted 2026-08-09/10 |
| Launch monitoring (48h) | Founder | Agent (assist) | 2026-08-09 00:01 – 2026-08-11 00:01 |
| Post-launch retrospective | Agent | Founder (validate) | 2026-08-11 end of day |

---

## NEXT STEP (RIGHT NOW)

**Your immediate action: Do the three founder prerequisites (section 1).**

Once those are complete, come back and tell me. I will then execute section 5 (SEO blockers) in parallel while you claim section 2 (Pass 1 social accounts).

The audit results for the remaining 6 dimensions (product, waitlist/analytics, assets, positioning-detail, distribution-detail, video-plan) are still processing in the background and will feed into this tracker's gaps as they complete.

**Estimated time to "launch-ready" from this point: 36 hours (Thursday night through Friday afternoon launch).**
