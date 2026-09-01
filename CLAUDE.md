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

## The bar

**Read [`docs/conventions/the-bar.md`](./docs/conventions/the-bar.md) before any surface work.** It
is short and it is the standard. Compressed, because these four decide most calls:

- **Build it as if Anthropic, OpenAI, Google, Vercel, Figma, Perplexity or Microsoft were shipping
  it.** If one of them put their name on this screen tomorrow, would it go out or get sent back?
- **This is not a B2B SaaS app with AI features. It is an agentic platform.** So **the agent's work
  is shown, not hidden**: what it is doing, what it decided, what it needs from you, visible as it
  happens. **A spinner is not agent visibility.** And the person keeps talking to it while the
  backend runs. The *machinery* stays behind the engine-room door; the *work* does not.
- **Wear the user's hat at every step, not at the review.** Walk the arrival, the wait, the first
  failure, the second visit. Empty, slow and wrong are the states that decide whether it is trusted,
  and they are the ones that get designed last.
- **Design for where this lands, not where it starts.** A surface that only makes sense while a
  human does most of the work is one we will pay to replace.

**You have full liberty on the design system, the features and the gaps** (founder, 2026-09-01 and
2026-09-02). Raise Meridian, build the missing component, redesign the surface. What that never
licenses: compressing instead of designing, widening a test baseline to pass, or shipping a claim
the repo cannot show.

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

- **Meridian is the design system, it is the latest one, and `bun test` enforces it.** A new file
  carrying a retired token (`--sp-*`, `--ds-*`, `--text-*`, `--hairline`, `--raised`,
  `data-obsidian`) or a raw colour fails, as does an existing file growing its count. Contract:
  [`docs/design/DESIGN-SYSTEM.md`](./docs/design/DESIGN-SYSTEM.md); the system itself, with the
  reasoning behind every token, is `src/styles/meridian.css`.

- **Meridian is a floor, not a ceiling, and you have standing authority to raise it** (founder,
  2026-09-01). It is a baseline and it is not perfect. **Nothing ships below it.** But where you can
  deliver something better on font, colour, typography, spacing, motion, components or any design
  element, **build it into Meridian first and then use it in the product** - do not fork it, do not
  special-case one surface, and do not hand-roll a local style that quietly competes with the
  system. If no `--mrd-*` token fits, that is a gap in Meridian: close the gap there. **Never widen
  the test baseline to make something pass**; raising Meridian is the sanctioned move, loosening the
  guard never is.

- **Meridian is extracted from [beautifui.dev](https://beautifui.dev), and that site is the floor,
  not the inspiration.** If something is missing from Meridian, go there first: it exposes the
  actual codebase, so **port from the real source rather than approximating what a screenshot looks
  like** - a screenshot loses the mechanics (easing curves, stacking, focus and hover states, the
  exact spacing ramp), and an approximation of those is how a surface ends up looking almost right
  and feeling wrong. Copy it properly, then land it as `--mrd-*` tokens and Meridian components so
  the whole product gets it, not the one screen you were building.

- **For design references beyond that, use the Mobbin MCP** (`mcp__mobbin__search_screens`,
  `search_flows`, `search_sections`) before inventing a pattern. Founder's steer: pull real
  references and inputs from there, then decide what Meridian should absorb. A pattern already
  solved well somewhere is worth porting properly rather than reinventing from memory.
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
