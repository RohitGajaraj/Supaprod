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
| Local repo folder `project_cadence_v5` and the GitHub remote `project_cadence_v5.git` | Renaming the working directory and the GitHub repo are external, disruptive actions (breaks every open terminal/IDE reference, requires a coordinated remote rename + re-clone). Founder action item, not a file edit — see `docs/planning/SOURCE-OF-TRUTH.md`. |
| `docs/strategy/archive/v3-positioning-cadence.md` | An already-archived, superseded historical doc; the filename accurately names what it was about at the time. Left as history, matching how `docs/strategy/archive/` generally preserves dated snapshots. |
| Historical/dated narrative (session decision logs, changelog-style entries, `DELIVERY-SUMMARY-*.md`, anything describing what happened before 2026-07-17) | Stays factually accurate to what the product was called when the event happened. Not rewritten. |
| Supabase project ref (`ysszyrczxanuzhiohygx.supabase.co`), Cloudflare worker name (`tanstack-start-app` in `wrangler.jsonc`), `package.json` name (`tanstack_start_ts`) | Never brand-derived — nothing to rename. |
| `.claude/worktrees/*` | Separate git worktrees from other sessions/lanes; out of scope for this sweep (see the lane force-push risk note — do not touch another lane's checkout). |

## Founder-only follow-ups (not file edits — see the chat summary for the full list)

Lovable project `display_name`/`description` metadata (still reads "Project-Cadence-v5" in
the Lovable dashboard — no MCP tool exposes a rename, needs a manual dashboard edit), the
GitHub repo rename + local folder rename + git remote URL update, and confirming the
`supaprod.com`/`supaprod.ai` domain purchase + DNS/custom-domain connection status (per
`docs/gtm/brand-supaprod.md` §3-4).
