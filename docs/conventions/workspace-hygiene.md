# Convention: working-tree hygiene (no clutter at the root)

> _Created: 2026-06-16 · Last updated: 2026-09-02_

> Standing rule. The repo working tree stays clean: no images at the root or `docs/` top level, no agent probe or snapshot artifacts anywhere, and no macOS FS-duplication artifacts. Every captured image has one logical home by scenario with a retention window, and stray images + `" 2"`-style duplicates are swept by one janitor. This is enforced, not advisory.

## Why this exists

Tools (Playwright, the verify and run skills, the browser MCP) capture screenshots constantly, and a case-insensitive macOS filesystem plus cloud sync quietly create `<name> 2.<ext>` duplicates. Left alone they pile up in the working tree the founder sees (one sweep found nine loose PNGs at the root, 444 scratch files in `.playwright-mcp/`, and `agentdb 2.rvf` / `agentdb.rvf 2.lock` dups). Git already ignores most of it, so version control stays clean, but the local tree clutters. This convention fixes the local hygiene: where each image goes, how long it stays, and how the tree self-cleans, both for images and for FS-dup artifacts.

## Agent probe and snapshot artifacts (added 2026-09-02)

**A session driving the browser leaves two kinds of litter, and one of them can touch production
data.** Both were found in the tree on 2026-09-02, written by read-only audit agents an hour earlier.

**1. Accessibility-tree dumps at the repo root.** `er-overview.yml`, 6.9KB of Playwright snapshot
YAML, sitting at the root and failing `bun run docs:check` as a stray. Harmless in itself.

**2. Throwaway probe specs in `e2e/`, and this one is not tidy-up.** `playwright.config.ts` sets
`testDir: "./e2e"` and, until 2026-09-02, carried **no ignore rule**. Any spec file left in that
directory joined **every** `playwright test` run. **This repo has already paid for exactly that:** a
probe pressing real surfaces created six duplicate tracks, which then starved the one track a
session was watching, and the ids it produced were abandoned at `sense`. A probe spec sitting where
`testMatch` can reach it is a hazard to production data, not to the gate.

**A NAME-BASED RULE DOES NOT WORK HERE, and this was learned the same night.** The first version of
this convention said "throwaway probes are named `zz-*.spec.ts`" and keyed everything on that
prefix. Within minutes a second probe appeared as `qq-probe.spec.ts`, written by another agent that
had never read the rule and could not be reached mid-flight to learn it. **Agents that leave scratch
behind are, by definition, the ones not following your naming convention.**

**So the gate keys on the property that actually separates the two: a real spec is tracked in git,
and a scratch spec never is.** All 15 reviewed specs are tracked. A new one joins the run the moment
it is `git add`ed. An agent's ad-hoc probe is excluded whatever it is called.

**Why an unreviewed spec is not merely noise.** `round-8.spec.ts` and
`phase-3-visible-agency.spec.ts` both sign into a real environment and create real rows, and both
carry an explicit opt-in guard (`ROUND8_PRESS_PRODUCTION=yes`, `PHASE3_PRESS=yes`) for exactly that
reason. **A probe written ad hoc carries no such guard**, because nobody reviewed it.

**The rules:**

- **A spec that is not tracked does not run.** If it is real, `git add` it.
- **Name a deliberate throwaway `zz-*` or `qq-*`** so the second gate catches it even if committed.
- **Root-level `*.yml` / `*.yaml` is not a repo convention.** Nothing tracked lives there, so
  anything appearing is scratch.
- **Never commit either artifact.** `.gitignore` covers `/*.yml` (root only, so
  `.github/workflows/*.yml`, `.serena/project.yml` and `docs/pitch/applications/baseline.yml` are
  untouched) and `e2e/zz-*.spec.ts`.

**Three defences, deliberately independent**, because a probe reaching a real run should need more
than one thing to go wrong:

1. **`playwright.config.ts` excludes every untracked spec** and **names them on stderr** rather than
   skipping silently, so a real spec you forgot to add announces itself instead of quietly not
   running. If git is unavailable the list is empty and everything runs, because a config that
   silently skips the whole suite is worse than the problem it solves.
2. **`.gitignore`** stops either artifact being committed.
3. **`bun run clean:workspace`** relocates root snapshots into `.playwright-mcp/` (never deletes
   them; that bucket purges at 7 days) and removes `e2e/zz-*.spec.ts`.

**Sweeping is not fixing.** The janitor's first run removed a second probe that appeared during the
ten minutes it took to write these rules, because the agents generating them were still running. A
cleanup pass over a directory a live process writes into is a snapshot, not a guard. **Ask what
collects the file, and disarm that.**

## The hard rules

1. **No image at the repo root. No image at the `docs/` top level.** When you capture a screenshot, always pass an explicit path into the right bucket below. Never use a bare filename (it lands in the current directory, which is usually the root). Strays are swept into `docs/screenshots/verify/`.
2. **No macOS FS-duplication artifacts.** Files or directories named `<name> 2.<ext>` or `<name> 2` (a space + digit inserted before the extension or at the end) are case-insensitive-FS / sync junk. Never edit, import from, or `cd` into them (see CLAUDE.md). The janitor removes them, but only when the canonical `<name>.<ext>` / `<name>` exists, so a legitimately-named file is never deleted.

## Where each image goes (scenario to location)

| Scenario | Location | Committed? | Retention |
| --- | --- | --- | --- |
| Automated test / verify run (Playwright, the verify skill) | `docs/screenshots/verify/` | No (local) | 14 days, then auto-purged |
| Browser MCP default scratch (`browser_take_screenshot` with no path) | `.playwright-mcp/` (hidden) | No (local) | 7 days, then auto-purged |
| Documenting a shipped feature / app UI (for a feature doc or demo) | `docs/screenshots/app-ui/` | No (local) | Kept (no auto-purge) |
| Per-screen design-port reference | `docs/screenshots/screen-<n>/` | No (local) | Kept |
| Before / after a fix | `docs/screenshots/fixes/` | No (local) | Kept |
| Design inspiration / reference | `docs/screenshots/reference/` | No (local) | Kept |
| Build-in-public capture | `docs/screenshots/brand-feed/` | No (local) | Kept (feeds the brand engine; see [[brand-feed-capture-rule]]) |
| Canonical design reference a parallel build must match | `design-reference/**` | **Yes (committed)** | Permanent |
| Anything at the repo root or `docs/` top level | swept to `docs/screenshots/verify/` | No | 0 (immediate) |

`design-reference/**` is the ONLY place a committed image belongs (one curated image per screen, never a bulk dump). Everything under `docs/screenshots/` is local-only by design.

## Retention policy (how long things stay)

- **Ephemeral (auto-purged by the sweep):** `docs/screenshots/verify/` at 14 days; `.playwright-mcp/` at 7 days. Override per-run via `SCREENSHOT_VERIFY_RETENTION_DAYS` / `SCREENSHOT_MCP_RETENTION_DAYS`.
- **Durable but local (kept, never committed):** `docs/screenshots/{app-ui,reference,fixes,screen-*,misc,design-refs,brand-feed}`. These document the product; prune by hand when a screen is retired.
- **Committed and permanent:** `design-reference/**`.
- **Zero tolerance (swept on sight):** the repo root, the `docs/` top level, and every `" 2"`-style FS-dup artifact.

## How it is enforced (three layers)

1. **`.gitignore`** ignores `*.png` / `*.jpg` / `*.jpeg` / `*.gif` / `*.webp`, `docs/screenshots/`, `.playwright-mcp/`, and the recurring `" 2"` dups that actually occur (the `agentdb*` state files, `src/routeTree.gen 2.ts`), re-including only `design-reference/**`. So no stray image enters git; the janitor (layer 2) removes any other `" 2"` artifact from the working tree.
2. **`scripts/clean-workspace.sh`** (`bun run clean:workspace`) is the janitor: it relocates root / `docs`-top-level image strays into `verify/`, purges the ephemeral buckets past retention, and removes `" 2"` FS-dup artifacts whose canonical twin exists. Idempotent and safe (never `design-reference/`, `public/`, `src/` assets, or the durable buckets). Safe to run any time.
3. **A Claude Code Stop hook** (one line in `.claude/settings.json` that calls the janitor at session end, so the tree self-heals without anyone remembering to). This is the one piece still pending: editing `.claude/settings.json` is gated as agent self-modification, so it needs the founder's explicit approval or a `/update-config` pass. Until it is wired, run `bun run clean:workspace` by hand. Layers 1 and 2 are already in force.

## When you capture a screenshot

- Pass an explicit path into the right bucket, for example `docs/screenshots/verify/login-step-1.png`, not `login-step-1.png`.
- If you only need it to debug right now, `docs/screenshots/verify/` (or the MCP default) is correct; it will be purged automatically.
- If it documents a shipped surface for a feature doc, put it in `docs/screenshots/app-ui/` and reference it from the doc.
- Only commit an image if it is a canonical `design-reference/` asset.

## Related

- [`README.md`](./README.md) (conventions index)
- [`../README.md`](../README.md) § "Repository map & file-placement policy" (the parent anti-rot rule)
- [`../../CLAUDE.md`](../../CLAUDE.md) (the `" 2"`-suffixed FS-dup-artifact rule: never edit / import / `cd` into them)
- [`../../.gitignore`](../../.gitignore) (the ignore rules)
- `scripts/clean-workspace.sh` (the janitor)
