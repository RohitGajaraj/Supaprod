# GEMINI.md

> _Last updated: 2026-08-03_

**Read [`AGENTS.md`](./AGENTS.md). It is the build manual and it is canonical.** [`README.md`](./README.md) says what the product is and where every other document lives.

> Supaprod tells you what to build, builds it, ships it, checks what actually happened, and **learns from it, so next time it guides the call**. It learns and guides; it never "remembers", "stores", or "logs" — those verbs stay banned everywhere, because they claim less than the product delivers.
>
> **Corrected 2026-08-10: that distinction is not the moat.** A full read of the market falsified the compounding-record claim — causes survive in Slack and call recordings and have been reconstructed twice on the record. **The moat is the forecast captured at decision time**: what a team believed would happen, recorded before the outcome was known. It is not an artifact and leaves no trace unless something captured it at the moment of the call. **Never claim accumulated learning in the present tense.** Canon: [`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md).

> **Three layers, told door then body then brain:** 01 the director (tells you what to build) · 02 the loop (**decides what is worth building, hands it to whatever builds for you — yours or ours — and carries it through plan, design, build, checks, deploy and what happened after** — seven stations) · 03 the brain (**learns then guides**, never "stores"; the industry name for it is *context graph*, ThoughtWorks Radar Assess, April 2026). Each is the precondition for the next; 03 is the only one defensible alone. Full positioning: [`README.md`](./README.md).


This file is deliberately short. Antigravity and the Gemini CLI load it with the highest precedence, so anything written here is paid for on every request. It holds only what is specific to those tools.

---

## Precedence

Rules apply in this order; later files defer to earlier ones.

1. **System rules**, immutable, set by the tool.
2. **`GEMINI.md`**, this file, tool-specific notes only.
3. **[`AGENTS.md`](./AGENTS.md)**, the canonical operating manual. **Every real rule is here.**
4. **`.agent/rules/`** (Antigravity), additional modular workspace rules if present.

Keep this file thin, and keep any global `~/.gemini/GEMINI.md` thin too. A fat global file conflicts with project rules.

## Start of session

1. `git pull origin main`. Claude Code, Lovable and other sessions all write here. The repository is the live source of truth; this file is orientation only.
2. Read [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) §0 and [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md). Nothing else up front. The corpus is large; read the file you need, when you need it.

## Configuration

- **Antigravity**: mirror `.mcp.json` into its MCP settings so tool capability matches Claude Code's. Modular rules go in `.agent/rules/`.
- **Gemini CLI**: set `context.fileName` in `.gemini/settings.json` to `["GEMINI.md", "AGENTS.md"]`, and bundle MCP servers as an extension.
- **Skills, subagents and hooks under `.claude/` do not run here.** They are harness-bound to Claude Code. If a behaviour must hold across every tool, the rule belongs in `AGENTS.md`, not in a skill.

## Commands

Bun is the package manager and runner.

```bash
bun install
bun run dev            # Vite dev server, use this to verify UI changes
bunx tsc --noEmit      # typecheck
bun test               # unit and integration
bun run build          # production build to a Cloudflare Worker
bun run docs:check     # doc anti-rot check, before committing doc changes
```

## Two things that catch every tool here

- **Database access is through the Lovable MCP.** Lovable is the live system of record for schema, data, logs and deploys. Do not guess, and do not ask the founder to authorize Supabase directly; he does not hold that credential.
- **Pushing does not deploy.** The founder must click publish in Lovable for app code to go live.

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
