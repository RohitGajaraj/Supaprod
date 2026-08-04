# BRN-02 — "Where your brain lives" card

> _Created: 2026-07-03 · Last updated: 2026-07-07_

> Status · Shipped 2026-07-03 · `/settings?section=data` · No agent (static + one read)

## What it does

A single calm card at the top of Settings > Data that answers the data-custody question plainly: the database substrate (Postgres + pgvector), an ownership statement, the archive/delete/forget model in one place, and a live summary of the Trust Ledger's integrity seal with a link to the full check on `/trust-ledger`.

## Why it exists

Per [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §5.1 (the founder's storage question): the answer to "where does my data live and who owns it" already existed in the codebase (a real Postgres substrate, the memory-on-delete model, the TRUST-VERIFY seal) but was not legible anywhere in-product. This disarms the data-custody question in a sales or procurement conversation instead of leaving it to a support ticket. Board entry: `docs/planning/SOURCE-OF-TRUTH.md` row `BRN-02`.

## Where to find it

Settings > Data pane (`/settings?section=data`), the first card above "Export your data" and "Where your data goes".

## Demo script

1. Open Settings, land on the "You" pane, click "Data".
2. Read the substrate line: a dedicated Postgres database with pgvector for memory search, not a shared model.
3. Read the archive / delete / forget explainer: three tiers, forget is a deliberate future step, not a side effect of tidying up.
4. Point at the integrity seal line at the bottom: a live SHA-256 fingerprint of the workspace's decision record, click through to `/trust-ledger` for the full check.

## How it works

- `src/components/settings/DataSubstrateCard.tsx` — a mostly-static card (substrate + ownership + the three-tier archive/delete/forget explainer) plus one live section reusing the existing `getLedgerSeal` server fn (`src/lib/trust-ledger.functions.ts`, already shipped for TRUST-VERIFY) and `shortHead` (`src/lib/trust-verify.ts`) to show the current fingerprint and record count.
- No new server fn, no new migration, no new CallSurface. The card composes three already-shipped facts instead of inventing new mechanism: the DB substrate itself, the archive/delete/forget model documented in [`../decisions/memory-on-delete.md`](../decisions/memory-on-delete.md), and the TRUST-VERIFY seal already live on `/trust-ledger`.
- Wired into `src/routes/_authenticated.settings.tsx`'s existing `data` section, above `DataExportCard` and `SubprocessorsCard` (both unchanged).
- The integrity-seal section hides itself when the ledger is empty (`seal.count === 0`), matching the same guard `SealPanel` on `/trust-ledger` already uses, so a brand-new workspace never shows a meaningless fingerprint.

## Governance & guardrails

- Read-only: the card writes nothing. `getLedgerSeal` is already RLS-scoped to the caller's own workspace.
- No PII beyond what `/trust-ledger` already surfaces (a hash, a record count, a timestamp).

## Verification checklist

- [x] `bunx tsc --noEmit` clean.
- [x] `bun test` 2111 pass / 0 fail (no new tests needed; the card has no new logic beyond composing an existing server fn and existing pure helpers, both already unit-tested at their source).
- [ ] Manual walk on the primary checkout (this worktree's `bun run dev`/`build` hits the pre-existing node20-vs-ESM `lovable-tagger` failure that every other Obsidian-era item in this lane has also hit; `tsc` + `bun test` are the real gates here).

## Known limits / out of scope

- "Forget" itself is not built (tracked separately, see the "Open / future" section of [`decisions/memory-on-delete.md`](../decisions/memory-on-delete.md)); this card names it honestly as a future step rather than implying it exists today.
- The card does not duplicate the "Verify a saved fingerprint" flow already on `/trust-ledger`; it links there rather than re-implementing it.

## Related

- `docs/planning/SOURCE-OF-TRUTH.md` row `BRN-02`.
- [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §5.1.
- [`../decisions/memory-on-delete.md`](../decisions/memory-on-delete.md) (the archive/delete/forget model this card explains).
- `docs/features/README.md` index (`U6` / `SUBPROC-DISCLOSURE` siblings on the same Settings > Data pane; `src/lib/trust-verify.ts` and `/trust-ledger` are the TRUST-VERIFY seal this card summarizes, which has no feature-doc entry of its own yet).

## Settings/connections audit note (2026-07-07)

Reviewed in the `settings_connections` consumer/enterprise-grade pass. `DataSubstrateCard` (Settings > Data, "Where your brain lives") already meets the bar: composes real, already-shipped facts (Postgres/pgvector substrate, the archive/delete/forget model, the live ledger seal) with a calm front and the integrity-seal guard on an empty ledger. No change needed; the design pass landed on the connections + workspace-binding surfaces on the same route (see [`settings-ia.md`](./settings-ia.md)).
