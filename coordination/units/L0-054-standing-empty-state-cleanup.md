# UNIT L0-054 — standing work: dead empty-state vocabulary deleted, ControlsPanel on scale

**Lane:** LANE 0 · **Standing work (R-07)** · **Date:** 2026-08-25

## What changed

- **`src/components/supaprod/EmptyState.tsx` DELETED** — zero importers; built
  entirely on the retired layer (`--font-pixel` headline, raw `--ds-gray-*`
  hexes, `--space-*`). Meridian owns empties (`NothingYet`, `RecordSpeaks`,
  `EmptyRegion`) and every live empty state already uses them.
- **`Primitives.tsx`: the dead `EmptyState` export removed** (2.2KB) — same
  vocabulary, same zero-importer finding (repo-wide symbol grep: definition
  and one comment only). `RiskTag`, `MonoLabel` and the rest untouched.
- **`governance/ControlsPanel.tsx`**: all four live `--sp-space-*` reads →
  Meridian s-scale by the established law (space-2→s3 inside, space-3→s4
  between).

Ratchet re-frozen: four counts reclaimed across three files
(`--font-pixel ×2`, `--ds- 16→13`, and a retired `components/ui` usage in
Primitives that died with EmptyState's Button call).

## Gates

`tsc` 0 · full suite **10,912 pass / 0 fail** · eslint clean on touched files ·
no dev server.

## Open on my lanes' board

- Item 23 waits on MAIN's answer to `requests/L0-025-code-review-field.md`.
- Item 29's runway half waits on `L0-024` (burn read).
- Items 24/28/34 client behaviour verifies after MAIN's next deploy (current
  build predates them; consent/hold/pane verification from L0-053 was against
  the deployed tree).
