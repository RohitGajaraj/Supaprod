# CLAUDE.md

> _Created: 2026-09-01 · Last updated: 2026-09-01_

**This file is loaded into every session, so it holds only what is load-bearing and true nowhere
else.** As of 2026-09-01 the long instruction set is deliberately not here; it is archived at
[`docs/archive/agent-operating-manual.md`](./docs/archive/agent-operating-manual.md) and
[`docs/archive/claude-code-brief.md`](./docs/archive/claude-code-brief.md). Read them when you need
them. **They are still true. They are not withdrawn.**

## Where to start

- **The active mission:** [`the-first-run/START-HERE.md`](./the-first-run/START-HERE.md).
  [`RULINGS.md`](./the-first-run/RULINGS.md) is the tiebreaker when two documents disagree.
- **Status:** the `## Now` section of
  [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md). One board, nowhere else.
- **Already-investigated:** [`the-first-run/FINDINGS-LEDGER.md`](./the-first-run/FINDINGS-LEDGER.md)
  before re-investigating anything.
- **Anything outward-facing** (pitch, launch copy, investor answers): start at
  [`docs/pitch/`](./docs/pitch/README.md) and the vocabulary canon in
  [`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md).
  Nothing outward ships without the founder's approval.

## Commands

Bun is the package manager and runner. `package-lock.json` is not canonical.

```bash
bun install            # bunfig.toml enforces a 24h supply-chain guard
bun run dev            # Vite dev server; use it to verify UI changes
bunx tsc --noEmit      # typecheck
bun test               # holds the repo invariants - tsc + lint passing is NOT green
bun run build          # production build to a Cloudflare Worker
bun run lint           # ESLint
bun run docs:check     # doc anti-rot; run before committing doc changes
```

## Invariants that bite

- **Meridian is the only design system, and `bun test` enforces it.** A new file carrying a retired
  token (`--sp-*`, `--ds-*`, `--text-*`, `--hairline`, `--raised`, `data-obsidian`) or a raw colour
  fails, as does an existing file growing its count. If no `--mrd-*` token fits, that is a gap in
  Meridian - build it there. Never widen the baseline to pass.
- **Database access is through the Lovable MCP** (`mcp__plugin_lovable_lovable__*`). The founder does
  not hold a direct Supabase credential; do not ask him to authorize one.
- **Lovable is the only deploy path**, and it deploys from GitHub. Unpushed work is unshipped.
- **Never commit a screenshot.** `docs/screenshots/` is gitignored.
- **Root holds `README.md` and `CLAUDE.md` only.** For anything else, [`docs/README.md`](./docs/README.md)
  has a routing table with a row for every case; link a new doc from its folder index in the same
  commit. `docs-doctor` runs pre-commit and fails on a misplaced or unlinked file.
- **Commit with `git commit -F <file>`, not `-m`.** zsh evaluates backticks in `-m` and silently
  eats words. Commit explicit paths; `git add -A` is banned here.
- **Hooks enforce repo invariants.** Treat a hook message as user feedback.
- **Session handoff is a pair and both halves are committed:** `.remember/remember.md` and
  [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md). Several sessions run
  in parallel, so append - never overwrite another lane's entry.
