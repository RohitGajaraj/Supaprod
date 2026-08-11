# Supaprod — Brand, Domain, Email & Trademark Playbook

> _Created: 2026-07-16 · Last updated: 2026-08-05 · Status: ACTIVE — brand decided, `.com` and `.ai` REGISTERED 2026-07-16, in-product rename EXECUTED 2026-07-17, social handles STILL UNCLAIMED_
>
> ⚠️ **Two things in this document were overtaken by later rulings. Read these first.**
>
> **1. `.ai` is canonical, not `.com`.** §3 and the whole of §7 build the email scheme on `@supaprod.com`. The founder ruled the opposite on **2026-07-17**, one day after this was written: `supaprod.ai` is the canonical domain and `.com` exists only to 301 to it. Live email runs on **`@supaprod.ai`** with seven role addresses; `supaprod.com` has no MX record at all. See [`../../operations/domain-and-email-setup.md`](../../operations/domain-and-email-setup.md), which is the live state. §7's address scheme below is stale and kept only for its reasoning.
>
> **2. Claiming the handles is now an executable runbook.** §6 decided the convention; [`social-accounts.md`](./social-accounts.md) is what you actually work from, with availability re-verified 2026-08-05, the copy pack, the asset map and the track record.
>
> **The in-product rename executed 2026-07-17** — code, DB, envs, and UI now operate as "Supaprod." This document governs the outward brand (domains, handles, email, trademark, launch identity) for the name **Supaprod**, founder-locked 2026-07-16 after a five-round, ~30-agent, ~680-live-check naming study. The full evidence chain for all evaluated names lives in [`pitch/naming-decision-supaprod.md`](../../pitch/naming-decision-supaprod.md).
>
> **Audience:** (1) the founder, executing registration and launch steps; (2) a **US trademark attorney or Indian trademark advocate**, who should be able to run clearance and file directly from §8 without redoing our research.
>
> **Budget mode is ON:** §3 is the only money spent today (~$181). Everything else is parked in §4 and §10 with explicit triggers so nothing is forgotten.

---

## Contents

1. [The brand](#1-the-brand)
2. [Verified ownability snapshot (2026-07-16)](#2-verified-ownability-snapshot-2026-07-16--decays-fast)
3. [BUY TODAY — budget mode, ~$181](#3-buy-today--budget-mode-181-total)
4. [PARKED — future purchases register](#4-parked--future-purchases-register-the-do-not-forget-table)
5. [Registrar decision, fully reasoned](#5-registrar-decision-fully-reasoned)
6. [Social handles](#6-social-handles)
7. [Email architecture](#7-email-architecture)
8. [TRADEMARK — attorney-ready brief](#8-trademark--attorney-ready-brief)
9. [Launch / YC / fundraising checklist](#9-launch--yc--fundraising-checklist)
10. [Future-actions register (consolidated)](#10-future-actions-register-consolidated)

---

## 1. The brand

| Attribute | Value |
| --- | --- |
| **Name** | **Supaprod** |
| **Construction** | `supa` + `prod` — the Supabase naming formula (supa + meaningful word-chunk), invented by the founder |
| **What "prod" carries** | Double meaning, both true of the product: **prod**uct (the domain: PM chief-of-staff, discovery, PRD, roadmap, decision memory) **and** production — the autonomous engine literally **ships to prod** |
| **Pronunciation** | SOO-pa-prod (three syllables) |
| **Spoken rule** | Say **"Supaprod, with an A"** once in every spoken pitch, podcast, and demo. The only systematic leak in the name is spelling (supa → super), and it is coachable. |
| **Tagline candidate** | **"Ships to prod, with the evidence."** — makes the production reading deliberate and pre-empts the "lol it tests in prod" joke before Twitter writes it for us |
| **Wordmark** | Lowercase single word — `supaprod` — set in the Tempo design contract (`docs/design/archive/tempo-v5.md`) type system. **Never camel-case "SupaProd"**: the capital D visually amputates and amplifies "Prod", and the risk analysis flagged camel-casing as the styling that makes the wrong parse loudest. |

### The three accepted taxes (decided with eyes open, 2026-07-16)

These were surfaced by the adversarial (kill) and risk agents. The founder accepted all three. Each has a standing mitigation.

| # | Tax | Reality | Mitigation |
| --- | --- | --- | --- |
| 1 | **Variant social handles.** Exact `@supaprod` is taken on X (dormant-ish account, indexed tweet March 2022), Instagram (a real Thai person surnamed Supaprod — permanent, not a squatter), and YouTube (small "Supa Productions" channel). | We operate as **@supaprodhq** on those platforms. GitHub (`supaprod`) and LinkedIn (`company/supaprod`) get the exact name. | Uniform `@supaprodhq` everywhere (§6); post-trademark handle-recovery petitions for X/YouTube added to the future register (§10). Instagram exact handle is unrecoverable — accept permanently. |
| 2 | **Spoken-name leak into Superprod's namespace.** Said aloud, "Supaprod" = "superprod" to a general US ear, and the "superprod" search results belong to Superprod Group, a ~$120M French animation company (Wikipedia page, press footprint). `superprod.com` is unobtainable (unrelated holder since 1995). | Spelling-only leak — unlike the rejected "Supaduct" (whose leak was semantic: people heard a different object), there is no second English word "supaprod" collapses into. Supabase survives the identical super/supa leak (it does not own superbase.com — the 1990s Superbase database company still holds it: [supabase.com/blog/supabase-dot-com](https://supabase.com/blog/supabase-dot-com)). | The "with an A" spoken rule; day-one SERP capture (§9); defensive `superprod.ai` purchase — **parked for budget** (§4), consciously accepted risk; never use entertainment/production language in copy (§8). |
| 3 | **Supa- reads "Supabase-school naming."** The prefix is permanently associated with Supabase ($10.5B valuation, June 2026) and its ecosystem (Supaglue, Supafast, Supademo…). The technical half of the audience will clock the formula instantly — including YC partners (Supabase is YC S20; 1,000+ YC companies use it). Our stack actually runs on Supabase, so the association is discoverable. | Precedent says unpunished: **Supaglue** (YC W23, same formula) was funded and acquired by Stripe in March 2024; Supabase's brand policy protects only the SUPABASE mark, not the prefix, and the company has historically celebrated supa-\* community naming. "Prod" points at **our** domain (product/production), so the name reads "same naming school," not "Supabase accessory" — unlike "Supaduct," which read as Supabase plumbing. | Never write "Supabase for product teams" or any supa-formula framing in our own copy; keep the Supabase stack detail out of headline branding (architecture slide only); send Supabase's team a friendly pre-launch heads-up to convert adjacency into goodwill (§10). |

### Known wrinkles that are NOT taxes (assessed and de-escalated)

- **"Supaprod broke prod" / "tests in prod" jokes** — double-edged: guaranteed on the first public incident, but the same vocabulary gives the name dev-culture fluency. Owned via the tagline. Net asset **if** the evidence/verification story stays strong.
- **"Prod" as Northern Ireland sectarian slang** (documented: PSNI language guidance lists capital-P "Prod" alongside "Taig") — near-invisible inside "Supaprod" for a US-first software brand; a known wrinkle for future UK/Ireland hiring or press, nothing more.
- **French "la prod"** = the production/the beat — neutral-to-positive, though it reinforces the music-producer reading in France (see §2 handles).
- **Cattle-prod echo** — the adversarial agent searched for and found **no** real-world case of a product attacked over "prod" naming; scored speculative.
- **Thai** — "Supa-" is an auspicious Thai personal-name prefix; "Supaprod" resembles a real surname. Neutral.
- **"Prod" ≠ "product" in speech.** Honest finding: engineers parse "prod" as *production* instantly; almost nobody abbreviates *product* as "prod" out loud. The product reading must be taught by marketing — survivable because the production reading is also true and flattering.

---

## 2. Verified ownability snapshot (2026-07-16 — decays fast)

All domain rows verified against authoritative registry RDAP on **2026-07-16**. RDAP 404 = no registration record = available at standard fee (subject only to the checkout premium-flag caveat in §3). **This table is a snapshot; availability decays in days, not months** — this session watched `getemberloop.com` get registered 4 days before we checked it and `supaduck.com` 3 weeks before.

### Domains

| Domain | Status 2026-07-16 | Evidence |
| --- | --- | --- |
| `supaprod.ai` | ✅ AVAILABLE | RDAP 404 via rdap.org/domain/supaprod.ai |
| `supaprod.com` | ✅ AVAILABLE | RDAP 404 (Verisign) — a genuinely unregistered brandable .com, rare in 2026 |
| `supaprod.io` | ✅ AVAILABLE | RDAP 404 |
| `supaprod.dev` | ✅ AVAILABLE | RDAP 404 (Google Registry) |
| `supaprod.app` | ✅ AVAILABLE | RDAP 404 (Google Registry) |
| `supaprod.so` | ✅ AVAILABLE | RDAP 404 |
| `getsupaprod.com` | ✅ AVAILABLE | RDAP 404 |
| `supaprodhq.com` | ✅ AVAILABLE | RDAP 404 |
| `superprod.ai` | ✅ AVAILABLE (defensive target) | RDAP 404 — the studio uses `.net`, not `.ai` |
| `superprod.io` | ✅ AVAILABLE | RDAP 404 (retried past a 429) |
| `superprod.com` | ❌ REGISTERED-PARKED, unobtainable | RDAP 200: created **1995-08-15**, registrar Network Solutions, expires **2027-08-14**, clientTransferProhibited, last changed 2026-06-15. DNS dark (SERVFAIL apex + www). **Not** the French studio's site (they live at `superprod.net`, created 2010). Unidentified long-term holder. |

### Social handles

| Platform | Handle | Status | Evidence / notes |
| --- | --- | --- | --- |
| GitHub | `supaprod` | ✅ AVAILABLE (reliable signal) | https://github.com/supaprod returns HTTP 404 — GitHub 404s are trustworthy. **Claim the org immediately.** |
| LinkedIn | `company/supaprod` | ⚠️ Leans available | HTTP 404 unauthenticated (no company page found); LinkedIn is bot-walled — confirm at page creation. Note `company/superprod` **does** exist (the French studio). |
| X (Twitter) | `@supaprod` | ❌ TAKEN | Indexed tweet from March 2022 (twitter.com/Supaprod/status/1506240478253043718); profile page bot-walled to automated checks. Recovery petition possible post-trademark (§10). |
| Instagram | `@supaprod` | ❌ TAKEN — permanent | Live profile "Janjira Supaprod (@supaprod)" — a real person whose **surname** is Supaprod ("Supa-" is a common auspicious Thai name prefix). A person, not a squatter: **not recoverable**, ever. |
| YouTube | `@supaprod` | ❌ TAKEN | HTTP 200 channel titled "Supa Productions" (small shorts/edits channel, no brand weight). Recovery petition possible post-trademark (§10). |
| Producer-tag usage | "supaprod" | Common-law noise | Rap-producer culture uses the tag: "Freeze Corleone x Kaaris \| Ralis \| @supaprod" remix on YouTube (youtube.com/watch?v=wXeHhLJx1CU); SoundCloud credit "Prod. SupaProd FiftyCal". Small beatmakers, no registered brand — they occupy handles, not trademarks. |

### Trademark scan (secondary sources — see §8 for the attorney brief)

| Finding | Result |
| --- | --- |
| SUPAPROD, any register | **Zero hits anywhere** (web, Justia USPTO mirror, USPTO-indexed searches). The string is commercially virgin — no company, product, or app named Supaprod exists anywhere findable. |
| SUPERPROD, US federal register | **No registration found** via the Justia USPTO mirror (nearest hits: SUPERMEGA, SUPER PRENEUR). Direct TESS/TSDR and TMview/EUIPO queries were bot-blocked — primary confirmation is the attorney's first task (§8). |
| SUPERPROD, EU/France | Unverified (blocked). Superprod Group SAS very likely holds INPI/EUIPO marks in entertainment classes — **the** key unverified fact. |

**Ownability score in one line (risk agent):** domains 3/3, US trademark likely clean, exact social handles 0/3 — "about two-thirds of full ownability," the best score of all ~19 names evaluated across five rounds.

---

## 3. BUY TODAY — budget mode ($181 total)

All three at **Cloudflare Registrar**, one account, one dashboard.

| # | Domain | Price | Why |
| --- | --- | --- | --- |
| 1 | `supaprod.com` | **$10.46/yr** | Canonical business domain. Email lives here; investors expect it; longest-term asset. |
| 2 | `supaprod.ai` | **$160.00** (mandatory 2-year term; $80.00/yr at-cost) | The AI-native brand/product domain. |
| 3 | `supaprodhq.com` | **$10.46/yr** | Matches the `@supaprodhq` handle convention (§6); catches "supaprodhq" type-ins from social. |
| | **Total today** | **≈ $180.92** | |

Canonical-domain decision: **`supaprod.com` is canonical** (email + long-term identity; the Supabase-on-YC-advice playbook); `supaprod.ai` serves as the product/launch URL and 301s are set whichever way marketing prefers — owning both makes this reversible.

### Step-by-step: Cloudflare Registrar for a first-timer

1. Create/log in to a Cloudflare account at `dash.cloudflare.com` → **turn on 2FA immediately** (Account → Authentication). This account will hold the company's crown-jewel domains.
2. Add a payment method: Manage Account → Billing.
3. Go to **Domain Registration → Register Domains**, search `supaprod.com`, `supaprod.ai`, `supaprodhq.com`, add all three to cart, register.
   - New registrations automatically create the DNS zone on Cloudflare — no separate "add site" step needed.
   - WHOIS privacy/redaction is automatic and free. DNSSEC available free (enable after purchase).
4. **Enable auto-renew on all three** the moment they land (Domain Registration → Manage → auto-renew toggle). A missed renewal on a brand domain is an existential loss.
5. Screenshot/record the confirmation and registration dates; add renewal dates to the founder calendar anyway (belt and suspenders).

> ⚠️ **Checkout caveat — premium flags.** The .ai registry flags certain unregistered strings as "premium," and that price only appears at checkout (registry-set, so it follows the name to every registrar). `supaprod` is unlikely to be premium-flagged (not a dictionary word, not short), but **if the checkout price looks wrong, stop and cross-check at one other registrar (Porkbun/Spaceship) before assuming** — if both show it, the flag is registry-level and the price is real everywhere.

> ⚠️ **Cloudflare constraint, accepted as a feature:** domains registered at Cloudflare must keep Cloudflare nameservers for the life of the registration. Fine — the product already deploys to Cloudflare Workers, so DNS belongs there regardless (evidence: developers.cloudflare.com/registrar/get-started/register-domain/).

**Same hour as purchase:** claim the social handles (§6) and set up email routing (§7 Phase 1). Do **not** mention the name publicly anywhere — not even a teaser — until the trademark filing gate in §8.

---

## 4. PARKED — future purchases register (the do-not-forget table)

Founder ruling 2026-07-16: budget mode — the items below are **deliberately deferred, not rejected**. Each has a trigger. This table is mirrored in the consolidated register (§10).

| Item | Cost (verified 2026-07-16) | Trigger to buy | Risk if delayed |
| --- | --- | --- | --- |
| `superprod.ai` (defensive — closes the spoken supa→super leak on our primary TLD) | $160 / 2-yr term | **First funding or launch, whichever first** | A third party registers it and owns our most common misspelling on our own TLD. **Founder consciously accepted this risk on 2026-07-16 to stay in budget.** Highest-priority parked item. |
| `supaprod.io` | $50/yr (Cloudflare) | Launch | Squatters target .io of freshly launched dev-adjacent startups; ransom pricing later. |
| `supaprod.dev` | ~$12/yr | Public developer docs / MCP endpoint goes live | Low — small squat risk; natural home for `docs.`/agent-native surfaces. |
| `getsupaprod.com` | ~$10/yr | Optional, with .io batch | Low — we own the real .com, so the get- variant is cosmetic. |
| `superprod.io` | $50/yr | Optional, with funding batch | Low. |
| `superprod.com` | **WATCHLIST ONLY — not purchasable today.** Held since 1995-08-15 at Network Solutions, expires **2027-08-14**, unidentified holder, DNS dark. | Post-funding: quiet **broker** inquiry (never direct pre-announcement — an approach reveals the rebrand and multiplies the price) | None near-term; it has sat dark for 30 years. Calendar check around its 2027-08 expiry on the off chance it drops. |

---

## 5. Registrar decision, fully reasoned

**Decision: single-source everything at Cloudflare Registrar.**

Why Cloudflare:

1. **Verified at-cost pricing, flat forever.** $10.46 .com / $80.00-yr .ai / $50.00 .io, zero markup ("Cloudflare does not mark up domain prices at all" — cloudflare.com/products/registrar/; corroborated by the live tracker cfdomainpricing.com, updated 2026-07-16). Proof of the no-markup claim: the .ai registry's March-2026 wholesale is $160/2-year term — Cloudflare charges exactly $80/yr.
2. **Renewal price = registration price.** No teaser-then-jump. The renewal, not year one, is where registrars make their money on startups.
3. **Free WHOIS privacy, free DNSSEC, free SSL.**
4. **The constraint is a feature.** Cloudflare requires the domain to sit on Cloudflare nameservers for the registration's life — and Supaprod already deploys to Cloudflare Workers, so DNS lives there anyway. One vendor for registrar + DNS + compute edge.
5. **.ai support confirmed** on Cloudflare's own buy-ai-domains page (one stale third-party claim to the contrary was checked and disproven).

### The founder's split-registrar question, answered directly

> *"Can I buy each domain from whichever site is cheapest — e.g., .ai at Spaceship, .com elsewhere?"*

**Technically yes — domains from different registrars interoperate perfectly. Practically no, and here is the math and the reasoning:**

- The only real saving is Spaceship's .ai at **$68.98/yr** (genuinely the cheapest .ai renewal of 96 registrars tracked — domainoffer.net/tld/ai/spaceship) vs Cloudflare's $80.00. On the **one** .ai we're buying today, that is **~$22 saved over the 2-year term**.
- The cost of that $22: a second registrar account to secure (every account is a phishing/credential surface for the company's most unrecoverable assets), a second renewal calendar, a second billing card on file, and transfer friction later. **A missed renewal on a brand domain is an existential loss, not a $22 problem.** Spaceship's below-wholesale .ai price is also flagged by reviewers as a loss-leader that may not hold at renewal.
- GoDaddy is **rejected outright** even where its first-year promos look cheap: verified renewals are ~2× at-cost — .com renews at $21.99–22.99, .ai at up to $159.99, .io at $89.99 ("the GoDaddy tax"), inside an upsell-heavy checkout. Over 3 years the same basket costs roughly double.
- Namecheap is rejected on renewal jumps: .com $10.98 → **$18.48**, .io $33.23 → **$60.78**, and .ai renews **higher than registration** ($83.98 → $91.98).

### Verified price comparison (fetched/tracked 2026-07-16; first-year → renewal, USD)

| TLD | **Cloudflare** ⭐ | Spaceship | Porkbun | Namecheap | GoDaddy |
| --- | --- | --- | --- | --- | --- |
| .com | **$10.46 → $10.46** | $10.18 → $10.18 | $11.08 → $11.08 | $10.98 → $18.48 | promo → $21.99–22.99 |
| .ai (per yr; 2-yr min everywhere) | **$80.00 → $80.00** | $68.98 → $68.98 | $82.70 → $82.70 | $83.98 → $91.98 | $104.99 (promo $97.49) → $144.99–159.99 |
| .io | **$50.00 → $50.00** | $31.98 (promo $14.98) → $51.75 | $28.12 → $51.80 | $33.23 → $60.78 | ~$39–49 → $89.99 |
| WHOIS privacy | Free | Free | Free | Free | Bundled, upsell-heavy |

Sources: porkbun.com/products/domains (fetched live), cfdomainpricing.com + cloudflare.com/products/registrar/, domainoffer.net trackers (Namecheap/Spaceship/GoDaddy pages block bots; verify at checkout).

**Fallback registrar** (only if we ever need DNS off Cloudflare, which nothing on the roadmap suggests): **Porkbun** — near-cost flat pricing, free privacy, no drama.

### .ai registry facts (why the 2-year charge is normal)

- .ai is Anguilla's ccTLD; registry back-end operated by **Identity Digital since 2025-01-15**.
- The **2-year minimum registration term survived** the migration — it applies to new registrations and renewals (2–10 year increments). Budget 2× the per-year price upfront on every .ai. This is the rule, not a registrar trick.
- Registry wholesale rose from $140 to **$160 per 2-year term in March 2026** — which is why at-cost is $80/yr.

---

## 6. Social handles

**Convention: `@supaprodhq` uniformly on X, Instagram, YouTube, and TikTok. Exact `supaprod` on GitHub and LinkedIn, where it is free.**

Reasoning, including alternatives considered:

| Option | Verdict |
| --- | --- |
| **`@supaprodhq`** ✅ | "HQ" reads official and corporate-neutral, ages well, and is the established startup convention. Chosen. |
| `@getsupaprod` | Reads 2015-era growth-hack; "get" implies a download. Rejected. |
| `@supaprodai` | Chains the brand to an "ai" suffix we don't need (we own the .ai domain; the name shouldn't depend on the hype suffix). Rejected. |
| `@trysupaprod` | Salesy. Rejected. |

**The rule that matters more than the suffix: the same variant everywhere.** A user who finds `@supaprodhq` on X must find `@supaprodhq` on Instagram and YouTube without thinking.

### Claim list — the runbook now lives in its own file

**Execute from [`social-accounts.md`](./social-accounts.md), not from here.** It carries availability re-verified live on 2026-08-05, the claim order and its one hard dependency (Instagram before Threads), the per-platform copy pack inside each real character limit, which generated asset goes where, and the track record of what actually exists. Re-check with `bash scripts/check-handles.sh` before claiming.

Two corrections to what this section used to say:

- **The role address is on `.ai`, not `.com`.** Create every account with **`social@supaprod.ai`** so ownership is transferable and recoverable. `supaprod.com` has no mailbox.
- **Scope widened on 2026-08-05.** The founder added Bluesky (where the *exact* `supaprod` is free), Threads, Mastodon, Discord, Reddit, npm, PyPI and Crunchbase to the original seven.

**Founder ruling, 2026-08-05:** claim every handle now **and fill in bios and logos**, accepting the trademark exposure that §9's "no public use before the US ITU filing" gate was written to avoid. Recorded as a decision made with eyes open. The mitigation is not to delay: it is to run register item #7 (the attorney knockout) in parallel, which is three weeks past its own trigger.

### Handle recovery, later (post-trademark)

Once the US mark registers (§8), X and YouTube both have inactive-account and trademark/impersonation processes under which a rights holder can petition for a dormant exact-match handle. Add to the future register (§10): petition for `@supaprod` on X (dormant-ish since ~2022) and YouTube ("Supa Productions" small channel — weaker case, worth one attempt). **Instagram is permanently off the table** — the holder is a real person named Supaprod, which no policy overrides (and shouldn't).

---

## 7. Email architecture

### The founder's mechanics question, answered directly

> *"If aliases route to my Gmail and I reply, does the mail go from my Gmail or from the routed address?"*

**Cloudflare Email Routing handles INCOMING only.** `hello@supaprod.com` → forwards free to your existing Gmail (up to 200 custom addresses + 200 verified destinations + a catch-all per domain; unlimited inbound volume on the free plan — developers.cloudflare.com/email-service/platform/limits/).

**If you just hit Reply in Gmail, the outgoing mail is sent FROM `rohit.gmudaliar@gmail.com`** — the recipient sees your personal Gmail, which looks unprofessional and leaks the routing setup.

**The fix (free, ~10 minutes): Gmail "Send mail as."**
1. Google Account → Security → 2-Step Verification → **App passwords** → generate one for "Mail".
2. Gmail → Settings → Accounts and Import → "Send mail as" → **Add another email address** → `hello@supaprod.com` (untick "treat as alias" is optional; leave ticked for normal use).
3. SMTP server: `smtp.gmail.com`, port 587, username = your Gmail address, password = the App Password.
4. Verification mail arrives via the Cloudflare route → click confirm.
5. Now every Compose/Reply has a **From** dropdown; set `hello@supaprod.com` (or `rohit@`) as default "reply from the same address the message was sent to."

**Honest caveat:** mail sent this way is DKIM-signed by `google.com`, not by `supaprod.com`. Most recipients see it cleanly; some clients (especially Outlook) may show "via gmail.com" or score it lower on trust. **Acceptable for pre-launch correspondence; not what you want for fundraising outreach** — that's what Phase 2 is for.

### The phased plan

| Phase | When | What | Cost |
| --- | --- | --- | --- |
| **1 — now** | Same day as domain purchase | Cloudflare Email Routing on `supaprod.com`: create the named addresses below + a **catch-all** → Gmail. Add Gmail Send-as (above). DNS: Cloudflare sets MX automatically when you enable routing; add SPF including `_spf.google.com` (for the send-as path) and a DMARC record at `p=none` (monitor mode). | **$0/mo** |
| **1.5 — optional bridge** | If Outlook-facing email matters before launch | Either Zoho Mail Lite (**$1/user/mo**, real mailbox + IMAP — the cheapest proper mailbox in 2026) or Cloudflare's new Email Service authenticated SMTP (beta, June 2026; needs Workers **Paid $5/mo**, includes 3,000 sends/mo — the plan the Supaprod deploy may already be on, making marginal cost ≈ $0). | $0–5/mo |
| **2 — at launch / first investor outreach** (~1 month, per the v13 horizon) | **Google Workspace Business Starter, 1 seat, annual: $7/user/mo** ($8.40 flexible). Full DKIM/DMARC-aligned sending from `supaprod.com`, 30 GB, Meet/Drive/Calendar — the suite investors and customers expect. **Aliases are free:** up to 30 per user; role addresses (`hello@`, `support@`) are best as **free Google Groups** (collaborative inboxes). Migration = swap MX records from Cloudflare-routing to Google on `supaprod.com`; keep Cloudflare routing on the secondary domain (`supaprod.ai`) forwarding into Workspace **forever, free**. | **$7/mo** |
| **3 — when the app sends email** | Product transactional mail (auth, notifications) | **Resend free tier** — 3,000 emails/mo, 100/day, native Lovable integration — on a **dedicated subdomain `mail.supaprod.com`** with its own SPF/DKIM, so app-sending reputation never touches founder/human email. Upgrade Resend Pro $20/mo only past 3k/mo. (Postmark's "free" tier is ~100/mo — a test allowance, not production; revisit only if deliverability at scale becomes the bottleneck.) | $0 → $20/mo |

**Why not Zoho/iCloud+/Proton/Fastmail as the end state:** Zoho Mail Lite ($1) is the documented strict-budget alternative but loses the Google suite; iCloud+ caps at 3 addresses/domain with no team story; Proton ($3.99) only wins on privacy positioning; Fastmail ($5–6) costs Workspace money without the Workspace suite.

### Address scheme

| Address | Purpose | Phase 1 handling |
| --- | --- | --- |
| `rohit@supaprod.com` | Founder personal | Named route → Gmail; the Send-as default |
| `founders@supaprod.com` | Founder(s) shared — investor intros | Named route → Gmail (→ Google Group in Phase 2) |
| `hello@supaprod.com` | Public/general — website contact | Named route → Gmail (→ Group in Phase 2) |
| `support@supaprod.com` | Product support | Named route → Gmail (→ Group in Phase 2) |
| `privacy@supaprod.com` | **Required** contact in the privacy policy (GDPR/CCPA) | Named route → Gmail |
| `security@supaprod.com` | Vulnerability disclosure; future `/.well-known/security.txt` | Named route → Gmail |
| `legal@`, `billing@`, `press@` | Later | Covered by **catch-all** until needed |

Phase 1 practical note: the **catch-all → Gmail** covers every address anyone ever guesses; the named routes above exist for hygiene and so Phase-2 migration is a checklist, not archaeology.

### DNS records checklist (supaprod.com)

- [ ] MX — auto-set by Cloudflare Email Routing (Phase 1) → replaced by Google MX (Phase 2)
- [ ] SPF — `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all` (Phase 1; tighten in Phase 2)
- [ ] DKIM — Google Workspace DKIM key (Phase 2); Resend DKIM on `mail.` subdomain (Phase 3)
- [ ] DMARC — `v=DMARC1; p=none; rua=mailto:privacy@supaprod.com` now → move to `p=quarantine` once Phase 2 sending is verified

---

## 8. TRADEMARK — attorney-ready brief

> **Purpose of this section:** a US trademark attorney or Indian trademark advocate should be able to run the clearance and file directly from here. Everything below the "Knockout findings" heading is our research, with sources; items marked **[UNVERIFIED — primary source needed]** were blocked to our automated access and are counsel's first tasks. Nothing here is legal advice; it is a structured research handoff.

### The mark

| Field | Value |
| --- | --- |
| Mark | **SUPAPROD** — standard-character word mark (file the word mark first; stylized/logo mark later, after the Tempo wordmark is finalized) |
| Applicant | **[FOUNDER TO FILL: legal entity name & type — e.g., private limited / LLC / individual; registered address; citizenship/state of incorporation]** |
| Correspondence | **[FOUNDER TO FILL: email — suggest `legal@supaprod.com` once Phase-1 email is live]** |
| Current use in commerce | **NONE in the trademark sense.** The SUPAPROD mark has never been used publicly or in commerce; the in-product rename (code, DB, envs, UI) executed internally 2026-07-17, but no public announcement or commercial use of the name has occurred. No public announcement is planned before filing (standing instruction). |
| US filing basis | **§1(b) intent-to-use (ITU)** — bona fide intent evidenced by this playbook, the domain registrations, and the naming-decision record (docs/pitch/naming-decision-supaprod.md). |

### Filing strategy and sequence

| Jurisdiction | Priority | Classes | Basis / form | Est. government fees (verify current schedule) | Trigger |
| --- | --- | --- | --- | --- | --- |
| **United States (USPTO)** | **FIRST — before any public use of the name** | **9 + 42** | §1(b) ITU, base application | ~**$350/class** (post-January-2025 base-application fee) → ~$700 for both classes, + attorney fees; budget for one office action | Attorney knockout clears (below) |
| **India (CGPDTM)** | Second — founder's home jurisdiction, cheap | 9 + 42 | Form **TM-A**, e-filing | ~**₹4,500/class** for individual / startup / small entity (with Startup India or MSME/Udyam recognition; otherwise ₹9,000/class) → ~₹9,000 for both | Around launch (parked — §10) |
| **EU (EUIPO)** | **PARKED — deliberate** | **42 ONLY** (see rationale) | EUTM application | **€850** first class | First EU customers / EU expansion |
| Madrid Protocol | Later | — | International extension from the US or India base application | — | International go-to-market |

**EU class-strategy rationale (important):** the senior EU risk is Superprod Group, an entertainment company whose likely portfolio includes **class 9** (recorded/downloadable media — standard for studios) alongside 41. Filing EU **class 42 (SaaS services) only**, with no class-9 goods language, denies them their only credible opposition hook (EUIPO oppositions cost ~€320 and French media companies do file them). In the US, both 9 and 42 are wanted and defensible.

**Standing copy instruction (already adopted):** never use entertainment / content-production / media wording in any specification of goods or in marketing copy.

### Draft goods/services language (for counsel to refine)

- **Class 9:** "Downloadable software for product management, product decision tracking and reasoning capture, and AI-agent-assisted software development."
- **Class 42:** "Software as a service (SaaS) featuring artificial-intelligence agents for product discovery, requirements documentation, road-mapping, decision memory, and autonomous software build, review, and deployment."

### Knockout findings to verify on primary sources

Our automated access was **bot-blocked at USPTO TESS/TSDR, TMview, EUIPO, and Trademarkia**; the findings below come from the Justia USPTO mirror and open-web research on 2026-07-16 and **all need primary confirmation**.

**(a) SUPERPROD — Superprod Group SAS** — **[UNVERIFIED — primary source needed: enumerate their INPI + EUIPO portfolio and exact Nice classes. This is THE key unverified fact of the whole clearance.]**
- French audiovisual production group, founded 2010 by ex-Gaumont executives. `superprod.net`; Wikipedia page (en.wikipedia.org/wiki/Superprod_Group); ~471 staff and ~$120.7M revenue per growjo.com/company/SUPERPROD; studios in Paris, Angoulême, Milan; **offices in Los Angeles and New York** (US commercial presence). Partners incl. Netflix, HBO Max, Warner Bros Animation, Universal, Nickelodeon. Subsidiaries: Superights (distribution), **440 Hz — a music-rights platform (software-adjacent, note for the class analysis)**. Acquired Studio 352/Mélusine 2024.
- **US federal register: NO SUPERPROD registration found** via the Justia USPTO mirror (nearest hits: SUPERMEGA, SUPER PRENEUR). If confirmed on TESS, examiner 2(d) citation risk in the US ≈ zero (examiners cite registered marks only), leaving only a common-law opposition theory that must argue a B2B product-management SaaS confuses buyers of children's animation — different services, channels, and buyers.
- `superprod.com` is held by an unidentified third party since 1995 (not the studio); the studio uses `.net`.

**(b) SUPABASE — Supabase Inc.** (YC S20; $10.5B valuation June 2026 — cnbc.com/2026/06/04/). Context for the `supa-` formative: their published brand guidelines claim the SUPABASE mark and logos only, assert nothing over the `supa-` prefix (supabase.com/brand-assets), and there is **no found enforcement history** against supa-\* companies. Precedent: **Supaglue** (YC W23, supa-formula name) operated, was funded, and was acquired by Stripe in March 2024 without a naming challenge. Our product runs on Supabase infrastructure — flag to counsel as perception context, not a legal conflict.

**(c) SupaPro** — live South African lead-management SaaS (`supapro.com` + iOS App Store listing). One letter from SUPAPROD, same broad software space. Assess as part of the crowded-field analysis; no US registration found in our scan.

**(d) SUPER — King.com Ltd, US Reg. 5135888** — evidence the SUPER-formative field in class 9 is crowded, which cuts both ways (weakens everyone's marks; favors coexistence of distinctive compounds).

**(e) Music-producer common-law uses of "supaprod"** — producer tags only: X `@Supaprod` (personal account, tweet indexed March 2022), SoundCloud credit "Prod. SupaProd FiftyCal", YouTube on-screen credit "@supaprod" (Freeze Corleone × Kaaris remix). No registered marks found; assess common-law weight for software/SaaS (our read: nil — different field, no commercial software use).

**(f) For completeness — not SUPAPROD blockers:** Supaduct® (Hynds Pipe Systems, NZ culvert pipes) and SupaDuct (MW Insulation, UK) plus SuperDuct®/SuperDuct (Johns Manville duct board; Edwards duct **smoke detectors — class 9**; Harrison PVC duct) were diligence items on the **rejected sibling candidate "Supaduct"** and are recorded in the naming-decision doc; they do not bear on SUPAPROD.

### The aural-similarity question for counsel

SUPAPROD vs SUPERPROD are **phonetically near-identical** ("supa" is the standard phonetic respelling of "super"). Our analysis to confirm or correct:
- **US: risk LOW** absent a US SUPERPROD registration — no examiner citation possible; a common-law §43(a)/opposition theory is weak given sharply different services, trade channels, and purchasers (B2B SaaS for product teams vs animation production for broadcasters/streamers).
- **EU: risk MANAGEABLE** if we file class 42 only and keep all goods/marketing language clear of media/production terms.
- Counsel to confirm both reads after enumerating the Superprod portfolio.

### Post-filing checklist

- [ ] Set a **trademark watch** on SUPERPROD / SUPAPROD / confusable SUPA-formatives in classes 9/42 (US + EU).
- [ ] Calendar **ITU statement-of-use deadlines** (6-month windows, extensions up to 36 months) against the rename-execution and launch timeline.
- [ ] After US registration: X / YouTube handle-recovery petitions (§6).
- [ ] Keep specimens ready at first use in commerce: product UI under the Supaprod mark, pricing page, launch post.

---

## 9. Launch / YC / fundraising checklist

- [ ] **YC application:** brand = Supaprod, URL = `supaprod.com`. **The legal entity does NOT need renaming** — brand ≠ entity; the application form takes the company name and the product/brand independently. [FOUNDER TO FILL: entity name on the form.]
- [ ] **No public use of the name before the US ITU filing is in** (§8). No teaser tweets, no bio changes, no "something new is coming" with the name visible.
- [ ] **Day-one SERP capture** (the week the name goes public, all under the exact string "supaprod"): launch post on the company blog, Crunchbase profile, LinkedIn company page, GitHub org made public, Product Hunt page — so Google's "did you mean superprod" correction has a better target within days.
- [ ] **Spoken-pitch rule** in every demo, podcast, and the YC video: say "Supaprod — with an A" once; always show the wordmark on screen while saying it.
- [ ] **Press-kit line:** pronunciation (SOO-pa-prod) + the one-line name story ("super + product — and it ships to prod, with the evidence").
- [ ] **Email posture for outreach:** investor/customer outreach only after Phase 2 email (Workspace DKIM) is live — pre-launch correspondence may use Phase 1 send-as (§7).
- [x] **Rename-execution dependency:** the in-product rename (code, DB identifiers, envs, Lovable project, `CLAUDE.md` product-name ruling, brand assets, app UI) is **DONE — executed 2026-07-17**, clearing the way for public demos under the new name.

---

## 10. Future-actions register (consolidated)

The single do-not-forget table. Everything parked anywhere in this document appears here. Owner is the founder unless delegated.

| # | Action | Cost | Trigger | Risk if forgotten |
| --- | --- | --- | --- | --- |
| 1 | Buy `superprod.ai` (defensive, spoken-leak closer) | $160/2-yr | First funding **or** launch — whichever first | A stranger owns our #1 misspelling on our own TLD; risk consciously accepted 2026-07-16. **Trigger firing: launch is mid-September 2026.** Re-verified available 2026-08-05 |
| 2 | Buy `supaprod.io` | $50/yr | Launch | Post-launch squat/ransom pricing. **Trigger firing: launch is mid-September 2026.** Re-verified available 2026-08-05 |
| 3 | Buy `supaprod.dev` | ~$12/yr | Public dev docs / MCP endpoint | Low; loses the natural docs home |
| 4 | Buy `getsupaprod.com`, `superprod.io` (optional batch) | ~$60/yr | Funding batch | Low |
| 5 | `superprod.com` watchlist — quiet broker inquiry; calendar its **2027-08-14** expiry | inquiry-dependent | Post-funding; never pre-announcement | Price multiplies if approached after the rebrand is public |
| 6 | **US ITU filing, classes 9+42** (gate for ANY public use of the name) | ~$700 gov + attorney | Attorney knockout clears — target: before launch | Public use before filing surrenders priority and invites squatter filings |
| 7 | Attorney knockout: confirm SUPERPROD absent from TESS; enumerate Superprod's INPI/EUIPO classes | ~$300–600 (or bundled with filing) | This or next week | **THREE WEEKS OVERDUE** (trigger dated 2026-07-16). Now the highest-priority item on this table: the 2026-08-05 ruling puts the name on public bios, which is what makes the filing urgent rather than merely planned |
| 8 | India TM-A filing, classes 9+42 (₹4,500/class with Startup India/MSME recognition — obtain recognition first if not held) | ~₹9,000 | Around launch | Cheap home-jurisdiction protection missed |
| 9 | EU EUTM filing, **class 42 only** | €850 | First EU customers | Superprod's home turf; 42-only strategy documented in §8 |
| 10 | Madrid Protocol extensions from US/India base | varies | International GTM | — |
| 11 | Trademark watch on SUPERPROD/SUPAPROD/SUPA- in 9/42 | ~$0–300/yr | At US filing | Miss a conflicting filing's opposition window |
| 12 | Google Workspace Business Starter, 1 seat | $7/mo | Launch / first investor outreach | Fundraising email from a "via gmail.com" address |
| 13 | Resend on `mail.supaprod.com` subdomain | $0 (→$20/mo past 3k emails/mo) | App sends its first email | App sending taints founder-email reputation if mixed |
| 14 | DMARC `p=none` → `p=quarantine` | $0 | After Phase-2 DKIM verified | Spoofing exposure stays open |
| 15 | X + YouTube `@supaprod` handle-recovery petitions | $0 | After US trademark registers | Dormant exact handles stay squatted (Instagram: permanently unrecoverable — real person's surname) |
| 16 | Friendly pre-launch heads-up note to Supabase team re: supa- naming | $0 | Week before launch | Adjacency discovered on launch day instead of converted to goodwill |
| 17 | ~~**Rename-execution project** (code, DB, envs, Lovable, `CLAUDE.md` ruling, brand assets)~~ | time | **DONE 2026-07-17** | — |
| 18 | Security.txt + `security@` disclosure page | $0 | With launch site | — |
| 19 | **Buy `supaprodhq.com`** | $10.46/yr | **NOW** | It was on the §3 BUY TODAY list, was never purchased, and is the domain matching the `@supaprodhq` handle convention. Re-verified available 2026-08-05 |
| 20 | Claim the social handles per [`social-accounts.md`](./social-accounts.md) | $0 | **NOW** (founder ruling 2026-08-05) | Every handle still unclaimed 20 days after the domains landed |

---

*Evidence chain and the full 5-round, ~19-name evaluation record: [`pitch/naming-decision-supaprod.md`](../../pitch/naming-decision-supaprod.md). Registrar/email price verification and RDAP domain checks performed live on 2026-07-16 by this session's research workflows; re-verify prices at checkout.*
