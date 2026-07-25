# Rename ledger: Cadence → Supaprod

> _Created: 2026-07-17_

The product shipped as **Cadence** from 2026-06-03. The brand rename to **Supaprod** was
founder-locked 2026-07-16 (evidence chain: [`docs/pitch/naming-decision-supaprod.md`](../pitch/naming-decision-supaprod.md);
operational playbook: [`docs/gtm/brand-supaprod.md`](../gtm/brand-supaprod.md)). The in-product
rename — every user-facing surface, all code, and all documentation — executed 2026-07-17.

This doc is the equivalence ruling for the rename, following the same convention already
used for the Builder → Studio → Build rename (see the `CLAUDE.md` disclaimer): **rename every
user-facing and documentation surface; leave a short, explicit list of deep internal
identifiers unmigrated** rather than risk a big-bang schema/infra migration. Anything not on
the exclusion list below that still reads "Cadence" is a miss, not an intentional legacy token.

## Casing rules

| Context | Form |
| --- | --- |
| Prose, headings | `Supaprod` |
| Domains, handles, wordmark, slugs, skill/package identifiers | `supaprod` (all lowercase) |
| Trademark / legal references | `SUPAPROD` |
| Never | `SupaProd` (camel-case — the brand playbook flags this as the styling that makes the wrong parse ["Prod"] loudest) |

## What changed

- Every UI string, page title, meta tag, landing/marketing copy, doc, README, and the
  `CLAUDE.md` product-name banner.
- Brand-named components: `src/components/cadence/CadenceMark.tsx` → `src/components/supaprod/SupaprodMark.tsx`
  (same seven-petal geometry — only the wordmark/identifier changed, per founder instruction;
  a new logo/wordmark design is a separate follow-up), `CadenceLoader` → `SupaprodLoader`.
- Project skills: `.claude/skills/cadence-tempo` → `supaprod-tempo`, `cadence-design` →
  `supaprod-design`, `cadence-feature-pair` → `supaprod-feature-pair` (frontmatter `name:` and
  body text updated to match).
- `design-reference/cadence/` → `design-reference/supaprod/`.
- `docs/strategy/byo-build-and-cadence-cloud.md` → `docs/strategy/byo-build-and-supaprod-cloud.md`
  (a current, active spec — not history).
- Public surface: `public/llms.txt`, `public/agents.txt`, `public/sitemap.xml`,
  `public/robots.txt` — brand text and the stale `cadence-flow-beta.lovable.app` domain
  reference (now the current live Lovable URL, `supaprod.lovable.app`, confirmed via the
  Lovable MCP on 2026-07-17; re-point to the purchased custom domain once DNS is connected).

## What was intentionally left alone (and why)

| Item | Why it stays |
| --- | --- |
| `demo@redcadence.app` / `demo2@redcadence.app` and the `Cadence!Demo2026` password | Documented in `docs/operations/demo-credentials.md`: changing them risks breaking live Supabase auth sessions for the seeded demo accounts. Functional, not cosmetic. |
| The DB `cadence` column (`hourly`/`daily`/`weekly` schedule frequency — e.g. `scout_watchtower`, `sw4_loop_mode`) | The English word (a schedule's cadence), not the brand. Verified: no table or column in `supabase/migrations/` is literally brand-named. |
| Local repo folder `project_cadence_v5` (still named this on disk) | Renaming the working directory is disruptive (breaks every open terminal/IDE reference) and wasn't asked for. The GitHub remote itself *was* renamed by the founder (see below) — GitHub transparently redirects the old `project_cadence_v5.git` URL, but the local `origin` remote now points straight at the new one. |
| `docs/strategy/archive/v3-positioning-cadence.md` | An already-archived, superseded historical doc; the filename accurately names what it was about at the time. Left as history, matching how `docs/strategy/archive/` generally preserves dated snapshots. |
| Historical/dated narrative (session decision logs, changelog-style entries, `DELIVERY-SUMMARY-*.md`, anything describing what happened before 2026-07-17) | Stays factually accurate to what the product was called when the event happened. Not rewritten. |
| Supabase project ref (`ysszyrczxanuzhiohygx.supabase.co`), Cloudflare worker name (`tanstack-start-app` in `wrangler.jsonc`), `package.json` name (`tanstack_start_ts`) | Never brand-derived — nothing to rename. |
| `.claude/worktrees/*` | Separate git worktrees from other sessions/lanes; out of scope for this sweep (see the lane force-push risk note — do not touch another lane's checkout). |

## Founder-only follow-ups (not file edits — see the chat summary for the full list)

Done since this ledger was first written: the founder renamed the GitHub repo to
`RohitGajaraj/Supaprod` (confirmed via GitHub's redirect notice on push, 2026-07-17; local
`origin` remote updated to point at it directly) and renamed the Lovable project (`name`/
`display_name` now `supaprod`/`Supaprod`, confirmed via the Lovable MCP). The
`supaprod.com`/`supaprod.ai` domain purchase + DNS/custom-domain connection is live (see
`docs/operations/domain-and-email-setup.md`).

Still open, cosmetic only: the Lovable project's AI-generated `description` field still
opens with "Project Cadence v5 is an AI-powered platform..." — no MCP tool exposes rewriting
it, needs a manual Lovable dashboard edit whenever the founder gets to it. The local repo
folder on disk is still named `project_cadence_v5` (see above — left alone on purpose).

### ❗ A rename miss this ledger did not catch: `GITHUB_APP_SLUG` (found 2026-07-25)

**This one was not cosmetic. It broke GitHub connect in production for eight days.**

The GitHub App was renamed on GitHub during the rebrand (`Cadence Connector` → **`Supaprod Connector`**, app id `4144110`, owner `RohitGajaraj`), which changes its **public slug**. But `GITHUB_APP_SLUG` in the production environment still held the old value `cadence-connector`.

`startGithubAppConnect` (`src/lib/connections.functions.ts:245`) builds the install URL as
`https://github.com/apps/${slug}/installations/new?state=…`, so every Connect attempt sent the
founder to `github.com/apps/cadence-connector/...`, which now **404s**. Nothing in the app
reported a problem, because the failure happens on GitHub's side after the redirect.

**The fix:** set `GITHUB_APP_SLUG=supaprod-connector` in the production environment. Verified
authoritatively against `GET /app` with a signed App JWT, not guessed. The value is now also
set in the local `.env`; `.env.example` already listed the key.

**Why the sweep missed it:** the ledger checked code, docs, DB and public surfaces, but never
enumerated **environment variables whose VALUES encode the brand**. A brand rename can break
config that contains no brand string in its *name*. Worth checking whenever anything external
is renamed: OAuth app slugs, webhook URLs, sender addresses, bucket names, queue names.

**Related latent trap, unfixed:** `readConnectState` (`github.server.ts:206`) wraps its whole
body in `try { … } catch { return null }`, and `stateHmac` throws when `CONNECTOR_SECRETS_KEY`
is unset. So a missing production secret is indistinguishable from an expired state token:
both surface as `?error=github_connect`. Two very different causes, one uninformative message.
