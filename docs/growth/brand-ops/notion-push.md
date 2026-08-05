# Notion push — the brand and social ops workspace

> _Created: 2026-08-05 · Last updated: 2026-08-05_

**Status: NOT YET PUSHED. This is a work order, not a record of something done.**

## Why this file exists

The session that produced the brand kit and [`social-accounts.md`](./social-accounts.md) could not reach Notion. `claude mcp list` reported the Notion server as **Connected**, but no `notion` tools were exposed to the session, which is the failure mode `CLAUDE.md` already warns about:

> **MCP added mid-session needs a restart.** `claude mcp list` reporting Connected is not evidence *this* session can call it. Verify with ToolSearch.

Rather than debug that, everything Notion needs is specified here. **Any session that can call the Notion tools can execute this file top to bottom without re-deriving anything.** Delete nothing when done: change the status line at the top to point at the created pages.

---

## Before you start

1. **Confirm you can actually call Notion.** Run a ToolSearch for `notion`. If no tools come back, stop. A Connected server is not a callable one, and half-writing this structure is worse than not starting.
2. **Ask the founder where it goes.** Creating top-level pages in someone's Notion is outward-facing enough to confirm first. Ask which parent page should hold it. Do not guess and do not create a new top-level workspace.
3. **Read the rule in §4 below before writing anything.** It is the one part of this that cannot be undone by editing.

---

## 1. What gets created

Two objects under whichever parent the founder names.

```
<parent page>
└─ Brand & Social Ops                (page)
   ├─ Brand Accounts                 (database, inline)
   └─ (page body: the sections in §3)
```

The repo stays canonical. Notion is the founder's working surface, so **every page opens with the backlink in §3.0**. Without it Notion quietly becomes a second source of truth, and then the two disagree and nobody knows which is right.

---

## 2. The database: `Brand Accounts`

One row per platform. Properties, in this order:

| Property | Type | Options / notes |
| --- | --- | --- |
| Platform | Title | |
| Handle | Text | |
| URL | URL | Filled in once the account exists |
| Status | Select | `Not started` · `Claimed` · `Profile complete` · `Verified` |
| Pass | Select | `1 contested` · `2 high value` · `3 defensive` |
| Owner email | Text | `social@supaprod.ai` for all but Threads |
| 2FA | Select | `None` · `Authenticator` · `SMS` · `Passkey` |
| Vault entry | Text | The **name** of the Proton Pass entry. Never its contents. |
| Date claimed | Date | |
| Notes | Text | |

**Seed all fifteen rows** with `Status = Not started` and the handles below. The founder fills the rest in as accounts are created.

| Platform | Handle | Pass | Owner email |
| --- | --- | --- | --- |
| GitHub org | `supaprod` | 1 contested | `social@supaprod.ai` |
| X | `@supaprodhq` | 1 contested | `social@supaprod.ai` |
| YouTube | `@supaprodhq` | 1 contested | `social@supaprod.ai` |
| Instagram | `@supaprodhq` | 1 contested | `social@supaprod.ai` |
| LinkedIn | `company/supaprod` | 1 contested | `social@supaprod.ai` |
| Bluesky | `supaprod` | 2 high value | `social@supaprod.ai` |
| Product Hunt | `supaprod` | 2 high value | `social@supaprod.ai` |
| TikTok | `@supaprodhq` | 2 high value | `social@supaprod.ai` |
| Threads | `@supaprodhq` | 3 defensive | via Instagram |
| Mastodon | `@supaprodhq` | 3 defensive | `social@supaprod.ai` |
| Discord | `supaprod` | 3 defensive | `social@supaprod.ai` |
| Reddit | `u/supaprodhq` | 3 defensive | `social@supaprod.ai` |
| npm | `supaprod` | 3 defensive | `social@supaprod.ai` |
| PyPI | `supaprod` | 3 defensive | `social@supaprod.ai` |
| Crunchbase | `supaprod` | 3 defensive | `social@supaprod.ai` |

Add two views: **By pass** (grouped on Pass, sorted by Platform) and **Outstanding** (filtered to Status is not `Verified`).

---

## 3. The page: `Brand & Social Ops`

Content, in order. Source everything from the repo files named; do not paraphrase from memory.

### 3.0 The header block, verbatim

> **The repo is canonical.** This page mirrors `docs/growth/brand-ops/social-accounts.md`. If the two disagree, the repo is right and this page is stale. Never store a password, a TOTP seed or a recovery code here.

### 3.1 The decisions, with their reasons

Lift from [`social-accounts.md`](./social-accounts.md) §0 and this list:

- **Handle convention.** Exact `supaprod` where free (GitHub, LinkedIn, Bluesky, npm, PyPI); `@supaprodhq` everywhere it is not. The same variant everywhere matters more than the suffix.
- **Email.** Send from `@supaprod.ai`; it is live and hardened while `supaprod.com` has no MX record at all. The site and the email being the same string is the point, not the TLD. `.com` aliases receive only.
- **Credentials.** Proton Pass Free, vault created under `founder@supaprod.ai`, never a personal Apple ID. Bitwarden moved integrated TOTP behind Premium in January 2026, which is what decides it for a free plan that needs 2FA on fifteen accounts.
- **Founder ruling 2026-08-05.** Claim every handle now *with bios and logos*, accepting the trademark exposure that the "no public use before the US ITU filing" gate was written to avoid.
- **Typeface.** Geist Pixel Square, hero word only. **Colour.** Monochrome ground, one ember core.

### 3.2 The copy pack

Copy §3 of [`social-accounts.md`](./social-accounts.md) **verbatim, as a table** of Platform / Field / Text / Character count. The founder pastes from here on a phone, so it must be selectable text rather than a screenshot, and the counts must survive the transfer.

Include the banned-vocabulary table from §4 immediately after it, as a callout. The copy is audited clean; the table is what keeps it that way when someone edits a line later.

### 3.3 The asset map

Copy §5 of [`social-accounts.md`](./social-accounts.md). **Do not upload the images to Notion.** They are generated artefacts and would immediately go stale against `generate-social.ts`. Reference the repo paths; the founder uploads from the checkout.

### 3.4 The walkthrough

Copy §6 of [`social-accounts.md`](./social-accounts.md), one toggle per platform, in claim order. Keep every ⚠️ marker: they mark the irreversible steps (YouTube Brand Account, LinkedIn going public, the recovery codes) and stripping them for tidiness is how one of them gets skipped.

### 3.5 Open items

Copy §9. Four rows: `supaprodhq.com` unbought, register items #1 and #2 firing, item #7 three weeks overdue, and the unresolved tagline conflict.

---

## 4. The rule that cannot be undone by editing

**No secret goes into Notion. Ever.**

Not a password, not a TOTP seed, not a recovery code, not a security-question answer. Notion pages are shareable by link, searchable, readable by every integration the workspace has ever authorised, and synced to every signed-in device. A password pasted and later deleted has still been in all of those places.

Secrets live in Proton Pass. Notion holds the **name** of the vault entry, which is useless to anyone who does not already have the vault.

If the founder asks for passwords in Notion during execution, say no and point at this section. That is not a preference, it is the reason the split exists.

---

## 5. When it is done

1. Change the status line at the top of this file from `NOT YET PUSHED` to the created page URLs, with the date.
2. Add the Notion link to [`README.md`](./README.md)'s file table so the next person finds it.
3. Note it in [`../../operations/session-handoff.md`](../../operations/session-handoff.md).

## Related

- [`social-accounts.md`](./social-accounts.md) — the source for every section above, and the canonical ledger
- [`brand-supaprod.md`](./brand-supaprod.md) — the convention, the domain register, the trademark position
- [`../branding/README.md`](../branding/README.md) — how the assets are generated
