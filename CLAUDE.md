# CLAUDE.md

> _Created: 2026-06-03 · Last updated: 2026-08-03_

**Read [`AGENTS.md`](./AGENTS.md). It is the build manual and it is canonical.** [`README.md`](./README.md) says what the product is and where every other document lives.

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
