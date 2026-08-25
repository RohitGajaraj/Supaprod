# UNIT L0-047 — standing work: two zero-importers deleted, ratchet −8

**Lane:** LANE 0 · **Standing work (R-07)** · **Date:** 2026-08-25

## The sweep

Ran the zero-importer scan across `src/components/**` minus `meridian/`,
`shell/`, `today/`, `ui/`, then verified each candidate individually —
basename matching alone produced seven false positives (relative imports,
re-exports), which is exactly the "renamed export reads like a missing one"
trap. Two files survived verification as genuinely unreferenced:

1. **`src/components/supaprod/PageHeader.tsx` — DELETED.** Self-described
   Tempo-revamp header (2026-07-13); Tempo v5 was rejected 2026-07-28 and its
   skill is deprecated. Superseded by Meridian's `PageHeading`
   (surface-parts), which every live route uses. Its `accent` prop painted
   `var(--mrd-you)` as an in-title brand beat — the exact ember-in-chrome the
   current rulings ban. Zero importers confirmed by import-path grep.
2. **`src/components/ask/AskWorkLine.tsx` — DELETED.** Drew the persistent
   seven-station rail with a lit current station — the shape R-01/R-13 kill —
   built entirely on retired `--sp-*` tokens by its own admission. Zero
   importers; the ask flow's dispatch fact is served live by `AskRunCard`
   (imported and mounted in AskTurn.tsx:451).

**Left in place deliberately:** `use-ask-stream.ts`'s accumulated `work`
field. It is a data layer, harmless, and remains the honest input for any
future conforming render of "where the dispatch went". Deleting it would be
tidiness exceeding the finding.

## Ratchet

The ratchet itself caught the win and ordered the re-freeze:
`--sp-*` 7→0 and `--font-pixel` 1→0 reclaimed; baseline re-frozen via
`bun run design:ratchet` and committed WITH this unit, per its own instruction.

## Gates

`tsc` 0 · full suite **10,881 pass / 0 fail** · eslint clean on my touched
paths (repo-wide prettier backlog untouched) · no dev server.

## Also filed

`requests/L0-022-login-and-one-real-gate.md` — the two cross-verification
requests addressed to me need (1) a dev login and (2) one provoked gate;
plus the formal starved notice: every L0-tagged queue item is now shipped or
verification-blocked.
