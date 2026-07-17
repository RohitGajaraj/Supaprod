# Domain & email setup — supaprod.ai / supaprod.com

> _Created: 2026-07-17 · Last updated: 2026-07-17_

Registrar + DNS: Cloudflare (both `supaprod.ai` and `supaprod.com`, same account, nameservers `fred.ns.cloudflare.com` / `diva.ns.cloudflare.com`). App hosting: Lovable (`supaprod`, project id `371dd588-1b70-4629-9bb5-9f003f3af373` — renamed from `Project-Cadence-v5` as part of the brand rename). `.ai` is the canonical domain; `.com` exists only to redirect to it — founder decision 2026-07-17.

## Domains — live status

| Hostname          | Purpose                          | Points to                     | Status                       |
| ------------------ | --------------------------------- | ------------------------------ | ------------------------------ |
| `supaprod.ai`      | Canonical app domain               | Lovable (Supaprod app)          | Live                          |
| `www.supaprod.ai`  | `www` alias                        | Lovable (Supaprod app)          | Live — 302-redirects to `supaprod.ai` (Lovable's "primary domain" toggle, already set); no code change needed here |
| `supaprod.com`     | Secondary TLD, redirects to `.ai`  | Cloudflare Redirect Rule (301) | Live — verified path + query string preserved |

## Email — live addresses

All currently route to the same personal inbox (`rohit.gajaraj@gmail.com`) — reasonable at single-founder stage. Splitting any one of these to a different inbox or teammate later is purely additive; it doesn't require touching the others.

| Address              | Purpose                          | Why it exists / when to use it                                                                                                   | Status |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `*@supaprod.ai` (catch-all) | Safety net                    | Anything not explicitly listed below still reaches the founder instead of silently bouncing. Configured as Email Routing's dedicated catch-all toggle, not a custom address. | Active |
| `hello@supaprod.ai`   | General public contact             | The default address to put on the site, in outreach signatures, on "join the beta" confirmations. Catches press/partnership/general inbound until volume justifies a split. | Active |
| `founder@supaprod.ai` | Personal / high-trust line         | 1:1 conversations that benefit from feeling personal — YC follow-ups, warm intros, early beta relationships worth nurturing directly. | Active |
| `security@supaprod.ai`| Security disclosure contact        | Matches the public `/security` page already in the app nav. Expected to exist by anyone doing diligence (YC partners, an enterprise beta prospect, a security researcher). | Active |
| `sales@supaprod.ai`   | Enterprise plan inquiries           | Already the live destination on 3 in-app "Contact sales" `mailto:` links — see Open items below, they currently point at the wrong domain. | Active |
| `privacy@supaprod.ai` | GDPR / data-subject requests        | Satisfies GDPR Art. 13/14's expectation of a named privacy contact for access/export/delete requests. Referenced (once the open item below lands) from `/privacy` and `/security`. | Active |
| `investors@supaprod.ai` | Investor inbound                  | Added ahead of the YC application push. | Active |

## Email authentication (SPF / DMARC)

| Record | Value | Status |
| -------- | ------- | -------- |
| SPF (`supaprod.ai` TXT) | `v=spf1 include:_spf.mx.cloudflare.net ~all` | Live — auto-added by Cloudflare Email Routing |
| DMARC (`_dmarc.supaprod.ai` TXT) | `v=DMARC1; p=none; rua=mailto:94e9e0462e5e497ab702ed5b139249db@dmarc-reports.cloudflare.net,mailto:privacy@supaprod.ai` | Live — added 2026-07-17 via Cloudflare API, then enhanced via Cloudflare's DMARC Management tool (added its own reporting mailbox alongside `privacy@supaprod.ai`, enabling the report dashboard at Email → DMARC Management) |
| DKIM (`cf2024-1._domainkey.supaprod.ai` TXT) | Cloudflare-managed signing key | Live — auto-created by Email Routing, no action taken |

DMARC is set to `p=none` (monitor-only): it collects aggregate reports (both to Cloudflare's dashboard and to `privacy@supaprod.ai`) without rejecting or quarantining anything, so nothing legitimate can break. Cloudflare's DMARC Management page (Email → DMARC Management) shows a live dashboard once the first report lands (~24h after setup). Tighten to `p=quarantine` then `p=reject` once reports confirm no legitimate mail is failing alignment — revisit this once real outbound volume exists (ties to the Resend/transactional-email item below, since that's what DMARC alignment actually protects). BIMI (brand logo in recipient inboxes) shows as unavailable in that dashboard by design — it requires `quarantine`/`reject` policy first; not actionable yet.

## Not created yet — deliberately deferred

| Address / item              | Why it's deferred                                                                                      | Revisit when…                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `support@`                    | Folds into `hello@` for now — splitting a support queue before there's real beta support volume is premature. | Beta support volume actually needs its own queue. |
| `press@`                      | No dedicated press pipeline yet; the catch-all covers anyone who guesses it.                                | A real press pipeline starts.                |
| `noreply@` / `notifications@` | Only meaningful once transactional email is wired (see below) — not a routing concern today.                | Transactional email ships.                    |
| Transactional/system email (magic links, signup confirms, product notifications) | Currently sent through Supabase Auth's default mailer, not this domain — generic sender, fine for beta-scale testing. Founder call 2026-07-17: not needed yet, revisit later. | Real user volume makes deliverability/branding matter. Needs a provider (Resend/Postmark) wired via Supabase Auth → SMTP Settings, plus its own SPF/DKIM records on `supaprod.ai`. |
| Cold-outreach warm-up domain   | **Separate initiative, do not conflate with this doc.** See `docs/Growth Strategy/07-gtm-ground-truth-2026-07-14.md` item #7. Cold-email tools (Instantly etc.) conventionally warm up a variant/lookalike domain, not the primary brand domain, so a deliverability problem there can't take down `supaprod.ai`'s reputation. | GTM checklist item #7 gets picked up. |

## How it was set up

- **App domain** — Lovable project → Settings → Domains → "Connect existing domain" → Lovable-provided A/CNAME records added in Cloudflare's `supaprod.ai` zone (DNS-only / grey-cloud during verification).
- **`.com` → `.ai` redirect** — Cloudflare (`supaprod.com` zone) → Rules → Redirect Rules → match "All incoming requests" → Dynamic target `concat("https://supaprod.ai", http.request.uri.path)` → Preserve query string on → 301.
- **Email** — Cloudflare (`supaprod.ai` zone) → Email → Email Routing → destination address added and verified → custom addresses created individually → catch-all enabled separately under its own toggle.

## Known gotchas (hit live during setup, 2026-07-17)

1. Cloudflare Redirect Rules use the Rules expression language, not legacy Page Rules `$1`-style regex — the target must be a full expression, e.g. `concat("https://target.tld", http.request.uri.path)`, wrapped in the function call. A bare `https://target.tld$1` fails to parse.
2. The Email Routing catch-all is a **separate toggle**, not something you type into "Create custom address" — that field only accepts literal characters (`0-9 a-z _ . +`), no wildcard.
3. A newly created Redirect Rule can save without being enabled. Check **Rules → Overview** for an explicit "Active" status badge — don't assume finishing the create form means it's live.
4. Cloudflare Email Routing destination addresses need their own separate verification-email click before routing actually delivers, even if the rule itself shows "Active."
5. A brand-new zone apex needs at least a placeholder A/CNAME record proxied through Cloudflare before any Redirect Rule on that zone can fire at all — with zero records, requests fail at DNS resolution and never reach the Rules engine.
6. DNS negative-cache propagation lag is real and resolver-dependent: a browser or local resolver can keep showing a stale `NXDOMAIN` or a Cloudflare 522 for several minutes after a record is fixed elsewhere. Query the authoritative nameserver directly (or use an incognito window) to check real current state instead of trusting a cached error.

## Open items

- [x] Updated the 3 live `mailto:sales@cadence.app` links to `sales@supaprod.ai` — `src/components/billing/PlanPicker.tsx:649,669,684`, `src/routes/_authenticated.settings.tsx:1550`, `src/routes/pricing.tsx:461`. (2026-07-17)
- [x] Updated the vague "contact address on your account" copy in `src/routes/privacy.tsx` and `src/routes/security.tsx` to name `privacy@supaprod.ai` / `security@supaprod.ai` explicitly. (2026-07-17)
- [x] Updated `src/routes/subprocessors.tsx` (the DPA / data-processing-regions footnote, previously "contact your Cadence account team") to name `privacy@supaprod.ai`, styled in the page's neutral ink tone per its own no-ember-accent convention. (2026-07-17)
- [x] Updated the transactional-email fallback sender in `src/lib/email.server.ts` from `notifications@cadence.app` to `notifications@supaprod.ai`. This is the `RESEND_FROM_EMAIL` fallback constant — the send path is env-gated and currently a no-op (no `RESEND_API_KEY` set), so this was a safe, forward-looking rename. **Still required before this can actually send:** verify `supaprod.ai` as a sending domain in Resend (its own DKIM setup, separate from Cloudflare Email Routing's receiving-side records) — tracked under "Transactional/system email" above. (2026-07-17)
- [x] `src/routes/_authenticated.admin.index.tsx:276` had a form input `placeholder="email@cadence.app"` illustrating the expected format for an admin to type *someone else's* email when granting admin access — not a Cadence-owned contact address, so out of scope for this doc's rebrand pass. It was picked up regardless by the separate product-name rename sweep and now reads `placeholder="email@supaprod.app"`.

Verification for the four fixes above: `tsc --noEmit` clean across the project; `eslint` clean on every touched file. `bun run build` was not run — this environment's Node (v22.23.1) is known to fail at Vite config load independent of this change (see `~/.claude/…/memory/build-node-version.md`).

- [x] Found and fixed a second, unrelated batch: 6 files still referenced the abandoned Lovable preview subdomain `cadence-flow-beta.lovable.app` in SEO-critical spots — the homepage's `<link rel="canonical">` + OG/Twitter image URLs (`__root.tsx`, `src/routes/index.tsx`), 3 route-level `OG_IMAGE` constants (`proof.tsx`, `d.$slug.tsx`, `t.$slug.tsx`), a mention in `terms.tsx` prose, plus `public/sitemap.xml` (12 URLs) and `public/robots.txt`'s `Sitemap:` line. All now point at `https://supaprod.ai`. `tsc --noEmit` clean after. (2026-07-17)

**Scope note (checked 2026-07-17 after a mid-session flag):** none of the fixes above rename the product on their own — this doc's own scope is domain/URL/email plumbing only. At the time this was written, "Cadence" was still untouched elsewhere in the repo's UI copy, titles, and code, and the separate founder-gated **brand rename** (Cadence → Supaprod as the product name) had not started execution. That rename has since executed (2026-07-17, same day) — see [`docs/pitch/naming-decision-supaprod.md`](../pitch/naming-decision-supaprod.md) and [`docs/operations/rename-cadence-to-supaprod.md`](./rename-cadence-to-supaprod.md) for the ledger — so CLAUDE.md's product-name ruling now reads Supaprod. Checked all 5 sibling lane worktrees (`cadence-lane-0/1/2/4`) for overlapping uncommitted changes — none found (at the time).

## Related

- [`docs/Growth Strategy/07-gtm-ground-truth-2026-07-14.md`](../Growth%20Strategy/07-gtm-ground-truth-2026-07-14.md) — item #7 (email domain warm-up for cold outreach) is a separate, not-yet-started initiative; do not conflate its future domain with the routing above.
- [`src/routes/privacy.tsx`](../../src/routes/privacy.tsx), [`src/routes/security.tsx`](../../src/routes/security.tsx) — pages this doc's addresses are meant to be referenced from, once the open item above lands.
- [`docs/operations/demo-credentials.md`](./demo-credentials.md) — sibling ops runbook, same style.
