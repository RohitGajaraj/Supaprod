# CLAUDE.md

> _Last updated: 2026-08-03_

**Read [`AGENTS.md`](./AGENTS.md). It is the build manual and it is canonical.** [`README.md`](./README.md) says what the product is and where every other document lives.

> Supaprod tells you what to build, builds it, ships it, checks what actually happened, and **learns from it, so next time it guides the call**. Storage is not the moat, because any vendor can store your decisions — **and as of 2026-08-10, neither is the compounding record.** A full read of the market falsified that: causes survive in Slack and call recordings and have been reconstructed twice on the record. **The moat is the forecast captured at decision time** — what a team believed would happen, recorded before the outcome was known, which is not an artifact and leaves no trace unless something captured it at the moment of the call.
>
> **Vocabulary: practitioner language everywhere. The register split is retired** (ruled 2026-08-11, measured across 5.9M words). Never *receipts · ledger · company brain · decision layer · unattended · first run · provenance*, on any surface: they score at or near zero in the market's own writing, and the audit that killed the split found we drifted worst in the shop window, not in the product. **"Audit trail" and "shared brain" stay, everywhere**; a practitioner reached for the first of those unprompted, which is the whole test. **"Approve" is settled by what the control does, not by word frequency**: keep it where a click UNBLOCKS something (a merge gate, an approval queue item), use *review* where it only SHOWS you something. **"Remembers", "stores" and "logs" as verbs of the brain stay banned everywhere**, because they claim less than the product delivers. **Never claim accumulated learning in the present tense**; the honest form is *the loop is wired and proven, and it begins accruing on first real use*. Full canon: [`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md), with every exact string in [`docs/growth/vocabulary-change-list-2026-08.md`](./docs/growth/vocabulary-change-list-2026-08.md).

> **Three layers, told door then body then brain:** 01 the director (tells you what to build) · 02 the operating system (runs the lifecycle, seven stations) · 03 the brain (**learns, then guides** the next call). Each is the precondition for the next; 03 is the only one defensible alone. Full positioning: [`README.md`](./README.md).


This file is deliberately short. Claude Code loads it into **every** session, so anything written here is paid for on every request. It holds only what is specific to Claude Code and true nowhere else.

---

## Start of session

1. `git pull origin main`. Several tools write here, including Lovable's bot.
2. Read [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) §0 and [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md). Nothing else. The corpus is large; read the file you need, when you need it.
3. **Scan the session reminder for available skills, agents, plugins and MCP servers before acting.** That list is the source of truth. Never invoke from memory, and give no namespace preferential treatment.

## Commands

Bun is the package manager and runner. The lingering `package-lock.json` is not canonical.

```bash
bun install            # bunfig.toml enforces a 24h supply-chain guard
bun run dev            # Vite dev server, use this to verify UI changes
bunx tsc --noEmit      # typecheck
bun test               # unit and integration
bun run build          # production build to a Cloudflare Worker
bun run lint           # ESLint
bun run docs:check     # doc anti-rot check, run before committing doc changes
bun run cost:track     # capture this session's token spend
```

## Claude Code specifics

- **MCP added mid-session needs a restart.** `claude mcp list` reporting Connected is not evidence *this* session can call it. Verify with ToolSearch.
- **Database access is through the Lovable MCP**, currently `mcp__plugin_lovable_lovable__*`. Do not ask the founder to authorize Supabase directly; he does not hold that credential.
- **Project skills** live in `.claude/skills/`. `supaprod-tempo` and `supaprod-design` are **deprecated stubs**; the design contract is [`docs/design/DESIGN-SYSTEM.md`](./docs/design/DESIGN-SYSTEM.md).
- **Meridian is the only design system, and this is enforced, not requested.** Every prior one is retired (v1, v3 Obsidian, v4 Loom, v5 Tempo, Cadence/ink). `bun test` fails if a **new** file carries a retired token (`--sp-*`, `--ds-*`, `--text-*`, `--hairline`, `--raised`, `data-obsidian`) or a raw colour, and fails if an **existing** file grows its count. If no `--mrd-*` token fits, that is a gap in Meridian: build it there. Never widen the baseline to pass.
- **Hooks enforce repo invariants** (commit policy, migration safety, humanization). Treat a hook message as user feedback. Setup: [`docs/operations/hooks.md`](./docs/operations/hooks.md).
- **Session handoff is a pair.** Write both `.remember/remember.md` (untracked; the plugin injects it at SessionStart and clears it as it reads, so never expect to find it on disk and never commit it) and [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md) (tracked, survives the read).

## Knowledge graph (graphify)

Query it before grepping; roughly 206x cheaper per question than reading the corpus.

```bash
graphify explain "<symbol>"     # sharpest: exact file, line, every edge
graphify affected "<symbol>"    # what breaks if this changes
graphify query "<question>" --budget 1500
```

The graph is **not in git**. If this checkout has no `graphify-out/`, use the machine-wide copy: `--graph ~/.graphify/global-graph.json`, whose node ids are prefixed `supaprod::`. Refresh with `PYTHONHASHSEED=0 graphify update .`, and always pin that variable or clustering is nondeterministic and every community gets renamed. Never use `--backend claude-cli`; it returns a wrong-schema graph that is discarded as hollow. Do not reinstall the graphify git hook: it writes into the shared `.git/hooks` and once broke a rebase mid-flight.

Two accuracy limits: every file is truncated at 20,000 characters before extraction, and 26 mostly-SVG files yield no nodes.

## Creating a file? Do not guess.

**[`docs/README.md`](./docs/README.md) has a routing table with a row for every case** and names the index to link it from. Find your row first. Adding a row beats inventing a folder.

The four that get broken most:

- **Screenshots go in `docs/screenshots/`, which is gitignored.** Never commit one; never leave one at repo root.
- **Root holds four files only:** `README.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. `docs/` top level holds its index only.
- **One board.** Status lives in `docs/planning/SOURCE-OF-TRUTH.md` and nowhere else.
- **Link a new doc from its folder index in the same commit**, or nobody finds it.

`docs-doctor` runs from the pre-commit hook and fails on a misplaced or unlinked file, so a mistake here is caught rather than shipped.

## If the task is outward-facing

An accelerator application, an investor answer, a demo script, launch copy: start at [`docs/pitch/`](./docs/pitch/README.md) and follow its seven-step procedure. For a live conversation, [`docs/pitch/founder-answer-playbook.md`](./docs/pitch/founder-answer-playbook.md). **Both are updated in the same session as the work**, and nothing outward sends without the founder's approval.
