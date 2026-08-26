# CLAUDE.md

> _Last updated: 2026-08-26_

**Read [`AGENTS.md`](./AGENTS.md). It is the build manual and it is canonical.** [`README.md`](./README.md) says what the product is and where every other document lives.

> Supaprod tells you what to build, builds it, ships it, checks what actually happened, and **learns from it, so next time it guides the call**. Storage is not the moat, because any vendor can store your decisions — **and as of 2026-08-10, neither is the compounding record.** A full read of the market falsified that: causes survive in Slack and call recordings and have been reconstructed twice on the record. **The moat is the forecast captured at decision time** — what a team believed would happen, recorded before the outcome was known, which is not an artifact and leaves no trace unless something captured it at the moment of the call.
>
> **Vocabulary: practitioner language everywhere. The register split is retired** (ruled 2026-08-11, measured across 5.9M words). Never *receipts · ledger · company brain · decision layer · unattended · first run · provenance*, on any surface: they score at or near zero in the market's own writing, and the audit that killed the split found we drifted worst in the shop window, not in the product. **"Audit trail" and "shared brain" stay, everywhere**; a practitioner reached for the first of those unprompted, which is the whole test. **"Approve" is settled by what the control does, not by word frequency**: keep it where a click UNBLOCKS something (a merge gate, an approval queue item), use *review* where it only SHOWS you something. **"Remembers", "stores" and "logs" as verbs of the brain stay banned everywhere**, because they claim less than the product delivers. **Never claim accumulated learning in the present tense**; the honest form is *the loop is wired and proven, and it begins accruing on first real use*. Full canon: [`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md), with every exact string in [`docs/growth/vocabulary-change-list-2026-08.md`](./docs/growth/vocabulary-change-list-2026-08.md).

> **Three layers, told door then body then brain:** 01 the director (tells you what to build) · 02 the operating system (**decides what is worth building, hands it to whatever builds for you — yours or ours — and checks what actually happened** — seven stations) · 03 the brain (**learns, then guides** the next call). Each is the precondition for the next; 03 is the only one defensible alone. Full positioning: [`README.md`](./README.md).
>
> **We do not generate the code and will not become a builder** (canon §5N, ruled 2026-08-26). That market is finished and priced at over $48B, and the pain moved without moving to generation — code review time **+441.5%** while throughput rose 33.7%, agentic PRs **5.3x longer** to pick up, DORA flat because output queued at review. **Nobody is short of generated code; everybody is short of confidence in it.** Every builder is a substitutable supplier to layer 02, so their commoditisation is our tailwind. **Never write "runs the lifecycle" in outward copy** — it invites the comparison we refuse. Ruling: [`docs/strategy/positioning-locked-2026-08.md`](./docs/strategy/positioning-locked-2026-08.md) §5N · application answer: [`docs/pitch/three-layers-and-why-not-a-builder.md`](./docs/pitch/three-layers-and-why-not-a-builder.md).
>
> **We DO build, in two scoped places — hybrid, ruled 2026-08-26.** Hand the spec to their builder, or build it here on credits for a customer with no coding agent. **Neither breaks the loop, because the verdict is measured against the forecast rather than against the code** — we need only that it shipped and what happened. **Our preview belongs at Design, not Build:** an interactive prototype clickable before anyone writes code. Never market "build anything here". Spec: [`the-first-run/SPEC-BUILD-PATHS.md`](./the-first-run/SPEC-BUILD-PATHS.md).


This file is deliberately short. Claude Code loads it into **every** session, so anything written here is paid for on every request. It holds only what is specific to Claude Code and true nowhere else.

---

## ⇢ THE ACTIVE MISSION LIVES IN [`the-first-run/`](./the-first-run/README.md)

**Read [`the-first-run/START-HERE.md`](./the-first-run/START-HERE.md) before doing anything on this
repo.** Since 2026-08-25 the platform is being **transformed, not extended**, and three lanes are
building against one backlog. Anything below that predates it is still true about the product; it is
not the current plan.

| File | What it settles |
| --- | --- |
| [`START-HERE.md`](./the-first-run/START-HERE.md) | What we are doing and why, in one page |
| [`RULINGS.md`](./the-first-run/RULINGS.md) | **THE TIEBREAKER — R-01…R-20. If any two documents in this repo disagree, it wins.** Its OPEN list is what nobody may decide alone |
| [`BUILD-QUEUE.md`](./the-first-run/BUILD-QUEUE.md) | The single ordered backlog. A lane takes the topmost item **it owns by path** |
| [`FINDINGS-LEDGER.md`](./the-first-run/FINDINGS-LEDGER.md) | **What was found, FIXED, still OPEN, or investigated and proved FALSE. Read it before re-investigating anything** |
| [`THE-ONE-SCREEN.md`](./the-first-run/THE-ONE-SCREEN.md) | The target architecture, station by station |
| **[`OPERATING-MODEL-5-SESSIONS.md`](./the-first-run/OPERATING-MODEL-5-SESSIONS.md)** | **CURRENT, from 2026-08-26. Every session reads this first.** The user lens, the structural defect (three surfaces, not 119 routes), the authorised feature gaps, the frontier standard, path ownership for five sessions, the git-only coordination protocol, the plain-words naming law, and the Meridian extraction rule |
| [`SURFACE-MAP.md`](./the-first-run/SURFACE-MAP.md) | **Every route and every component directory, with its owner and whether it is kept, folded, deleted or audited first.** Nothing is unassigned |
| `SESSION-0-CONDUCTOR.md` … `SESSION-4-THE-PROVING-GROUND.md` | The five session briefs. S0 is Claude Code and holds the database, migrations, deploys and merges; S1–S3 build; S4 writes no product code and only proves. Paste-ready copies: [`docs/prompts/MASTER-PROMPT-five-sessions.md`](./docs/prompts/MASTER-PROMPT-five-sessions.md) |
| [`GOAL-main-lane.md`](./the-first-run/GOAL-main-lane.md) · [`GOAL-lane-0.md`](./the-first-run/GOAL-lane-0.md) · [`GOAL-lane-1.md`](./the-first-run/GOAL-lane-1.md) | The **superseded** three-lane goals. Kept for the acceptance wording; the five-session model above replaces the assignments |

**The acceptance, and nothing else counts as done:** one piece of work enters at the first station and
completes all seven, driven entirely by agents, with no human touching it mid-run, and a person can
watch it happen on one screen. **In three months this has never happened once** — 73 tracks, 71
entered at `sense`, and **zero have gone `sense` → `learn`**.

> **Do not shorten that to "zero reached `learn`", which is what this line used to say and is false.**
> One track has: `3fbf73c9`, on 2026-08-01. It entered at `define` with `sense` and `decide`
> **waived**, so it walked five stations, and because the forecast is written at Decide and nowhere
> else it **carries no forecast** — it cannot show the one thing the product claims. The measured
> query is `entry_station = 'sense' AND station = 'learn' AND waived = '[]'`, and **as of 2026-08-26
> it returns 1, not the 0 this file used to promise** (F-97). The 1 is `d1168015`, and it is NOT the
> acceptance: a person answered a boundary call mid-run (F-79), which R-18 disqualifies. **That query
> on its own has stopped being the test.** The one that returns **0**, measured today, subtracts the
> tracks whose approvals a person decided — F-79 as a join rather than a sentence someone must recall:
>
> ```sql
> SELECT count(*) FROM spine_tracks t
> WHERE t.entry_station = 'sense' AND t.station = 'learn' AND t.waived = '[]'
>   AND t.id NOT IN (SELECT r.track_id FROM agent_approvals a
>                    JOIN agent_runs r ON r.mission_id = a.mission_id
>                    WHERE a.decided_at IS NOT NULL AND r.track_id IS NOT NULL);
> ```
>
> **Never ask this with `workspaces.is_sample`** — that form returns **2** today (`3fbf73c9` and
> `d1168015`, both on a real workspace). **And the reason this file used to give was backwards,
> corrected 2026-08-26 (F-90): `is_sample = true` means "a demo fixture, and NO tick may spend on
> it", so the sweep SKIPS those workspaces.** `track-tick.ts:85` excludes them by id via
> `sampleWorkspaceIds`, which selects `.eq("is_sample", true)`. It does not mean "the sweep may drive
> here".
>
> **AND AS OF 2026-08-26 THE PLAIN FORM ALSO RETURNS 1, AND THE ACCEPTANCE IS STILL NOT MET (F-79).**
> `d1168015` walked all seven with every transition `driven_via='sweep'` — but a person **rejected
> approval `bdf32286` against its Build mission at 18:48 UTC**, mid-run, so R-18's *"no human
> touching it mid-run"* fails. The query cannot see an answered boundary call, and
> `agent_approvals.decided_by` is NULL so the row cannot name the decider. **Do not report a
> non-zero result from the short query as the acceptance.** The honest form, which returns **0**, is
> in [`the-first-run/OPERATING-MODEL-5-SESSIONS.md`](./the-first-run/OPERATING-MODEL-5-SESSIONS.md) §2.

---

## Start of session

1. `git pull origin main`. Several tools write here, including Lovable's bot.
2. Read the `## Now` section of [`docs/planning/SOURCE-OF-TRUTH.md`](./docs/planning/SOURCE-OF-TRUTH.md) (**there is no §0** — that name is stale) and [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md). Nothing else. The corpus is large; read the file you need, when you need it.
3. **Before proposing a redesign, an audit, or any platform-wide change, read [`docs/planning/initiatives/README.md`](./docs/planning/initiatives/README.md).** It answers “is my question already answered?” and routes to the groundwork that exists — including the platform design at `initiatives/agent-first-platform.md`. Skipping it is how the same work gets paid for twice.
4. **Scan the session reminder for available skills, agents, plugins and MCP servers before acting.** That list is the source of truth. Never invoke from memory, and give no namespace preferential treatment.

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
bun run check:motion   # dead backend test: what still moves when nothing can be read
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
