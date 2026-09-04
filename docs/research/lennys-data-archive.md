# Lenny's Data — the paid archive, and what any agent may do with it

> _Created: 2026-08-10 · Tool-agnostic. Claude Code, Codex, Antigravity, Gemini CLI, Cursor and Lovable all read this file. Licence-bound: read §Licence before quoting a single line._

**The corpus is not in this repo and must never be.** It is a paid, licensed archive of 679 documents cloned to `lennys-newsletterpodcastdata-all/` at repo root and ignored in [`.gitignore`](../../.gitignore). This file is the pointer: where it is, how any agent on any machine gets it, what is in it, and the line nobody may cross.

---

## Licence — the binding constraint

The **paid** archive licence is materially stricter than the public starter repo's. Two clauses govern everything below:

> **Redistribute the raw content** — Do not share, upload, repost, or redistribute the archive files (or substantial portions of them) **in any form**. This content is for paid subscribers only.

> **Use it commercially** — Do not use this content in any commercial product, service, or offering, including commercial AI/ML products, paid APIs, or SaaS tools.

Supaprod is a commercial product. That makes the line sharper here than for a hobbyist:

| Permitted | Forbidden |
| --- | --- |
| Reading it; letting it inform judgement and positioning. "This archive is yours to learn from" is explicit. | Committing, uploading, or mirroring the raw files anywhere — **including a private repo you own**. |
| Derivative analyses. "Adapt and remix — create derivative works (summaries, guides, analyses)" is explicit. | Feeding the corpus into Supaprod's brain, RAG, embeddings, or any product surface. That is the "commercial AI/ML product" clause verbatim. |
| Quoting a guest operator with attribution in internal strategy docs. | Publishing an analysis of it as Supaprod marketing. Publishing *personal* projects is allowed; using it commercially is not. |

**The usable rule: treat it as reading, not as an asset.** It shapes the thinking. It never becomes a file, a feature, or a marketing artifact.

**Inherited rule, still binding.** [`podcast-corpus-lenny.md`](./podcast-corpus-lenny.md) sets a citation-integrity rule under the §12.4 cite-artifacts-not-gurus doctrine: anything reaching the YC application, demo, or positioning must be a **guest operator quote or a named-company fact** — never host framing, host polls, or sponsored-segment claims. Sponsor adjacencies get flagged inline. That rule governs this archive too.

---

## What is in it

| | Count | Range | Words |
| --- | --- | --- | --- |
| Podcast transcripts | 312 | 2022-06-07 → 2026-08-09 | 4,796,202 |
| Newsletter posts | 367 | 2019-06-14 → **2026-05-05** | 1,138,823 |
| **Total** | **679** | | **~5.9M** |

Layout: `podcasts/<guest-slug>.md`, `newsletters/<post-slug>.md`, plus `index.json` (title, guest, date, word count, description, tags, `post_url`, type) and `RELEASES.md`.

### The 3-month newsletter embargo is a property of the archive, not of your tier

The private archive's own `README.md` states it plainly: *"Newsletter posts published within the last 3 months are intentionally excluded from this archive."* Verified against the paid `index.json` — the newest newsletter is **2026-05-05**.

**No subscription tier removes this,** including Annual + Insider. The archive *is* the paid perk; the embargo is baked into the product. The distinction that matters:

- **Your subscription** = read every post live on lennysnewsletter.com, including today's.
- **The data archive** = everything older than 3 months, in bulk, as files.

So the ~13 posts between 2026-05-05 and now are **not missing from your access — only from your files.** Read them on the site. Podcasts carry no embargo and run current to the day.

Refresh cadence is irregular, roughly monthly: `RELEASES.md` shows 2026-06-21, 2026-06-24, then nothing until 2026-08-10.

---

## Setting up on a new machine, or under a different agent

Per [`AGENTS.md` §10](../archive/agent-operating-manual.md), git is the only shared substrate and each tool's agent layer sits on top. That splits this setup cleanly:

| Layer | Travels with the repo? | Where it lives |
| --- | --- | --- |
| This pointer doc, the ignore rule, derived analyses | **Yes** | the git tree |
| MCP server definition | **Yes**, open standard | [`.mcp.json`](../../.mcp.json), env-driven |
| The bearer token | **No** — secret | `.env` (gitignored), key `LENNYSDATA_TOKEN` |
| The 61 MB corpus clone | **No** — licensed, machine-local | `lennys-newsletterpodcastdata-all/` |

### New machine — three steps

1. **Clone the corpus.** Access is **git-only**. The repo is not browsable in the GitHub web UI, and `gh api repos/LennysNewsletter/lennys-newsletterpodcastdata-all` returns **404 by design** — expected, not a fault. Go to `lennysdata.com/access/github`, hit **Copy command to clone repo**, run it from the repo root. The command embeds a GitHub App token that expires in ~59 minutes and is stripped from the remote by the clone itself. Never paste that command into a shared channel.
2. **Set the token.** Put `LENNYSDATA_TOKEN=<bearer>` in `.env`. Reissue at lennysdata.com; it carries ~30-day expiry (current one lapses **2026-09-09**). A stale token fails with an auth error, not with wrong data.
3. **Refresh later** with **Copy command to pull updates** from the same page — a fresh short-lived token each time.

### Different agent harness

`.mcp.json` is the open standard and already carries the server, so any harness that reads it picks up `lennysdata` once `LENNYSDATA_TOKEN` is set. For a harness that keeps its own MCP registry, these are the only parameters needed:

| Field | Value |
| --- | --- |
| Transport | HTTP (streamable) |
| URL | `https://mcp.lennysdata.com/mcp` |
| Auth header | `Authorization: Bearer ${LENNYSDATA_TOKEN}` |
| Server name | `lennys-archive` |
| Tools | `search_content`, `list_content`, `read_excerpt`, `read_content` |

Do **not** also register it in a harness-local config (`~/.claude.json`, etc.) while `.mcp.json` carries it — §10 warns that double-sourcing registers the server twice.

**Sanity check:** `list_content` should report `"total": 679` alongside `"tier": "eligible"`. A total of 60 means the token is starter-tier, not full. Verified against the live endpoint 2026-08-10.

Pagination over MCP is slow. Prefer the local clone for bulk work, MCP for targeted search.

### Claude Code — two traps between a correct `.mcp.json` and a working server

A correct `.mcp.json` is not sufficient here. Both traps present as the same symptom — `mcp__lennysdata__*` simply absent — and **neither is a token problem**. Both cost a session on 2026-08-10.

**1. Claude Code never reads `.env`.** `${LENNYSDATA_TOKEN}` in [`.mcp.json`](../../.mcp.json) expands against the *Claude Code process environment*, not the repo's `.env`. Bun and Vite read `.env`; the agent harness does not — one filename, two unrelated consumers. Left unset, the server is skipped and `claude doctor` reports `Missing environment variables: LENNYSDATA_TOKEN`. Inject it in `.claude/settings.local.json`, which is gitignored, so the secret stays out of the tree:

```json
{ "env": { "LENNYSDATA_TOKEN": "<bearer>" } }
```

That is a **second copy of the token.** When it lapses **2026-09-09**, rotate `.env` *and* this file.

**2. A claude.ai connector on the same URL hides it.** If "Lenny's Newsletter" is also enabled as an account-level connector at claude.ai, Claude Code dedupes by URL and reports `◯ hidden — same URL as your server 'lennysdata'`, offering `claude mcp remove lennysdata`. **Do not take that offer.** The `.mcp.json` server carries the bearer verified at `tier: eligible`; the connector's tier follows whichever account its OAuth resolved to and is unverified. Keeping `.mcp.json` also preserves the portability §10 asks for — the connector exists only inside Anthropic surfaces, and Codex, Antigravity and Cursor cannot see it.

Project-scoped servers need explicit approval on top of that, or they sit at `⏸ Pending approval` forever:

```json
{ "enabledMcpjsonServers": ["lennysdata"] }
```

**MCP changes need a full restart.** `claude mcp list` printing `✔ Connected` is evidence about a *fresh* process, never about the running session. Confirm with ToolSearch after restarting, not before.

---

## Prior work — read before starting anything

[`podcast-corpus-lenny.md`](./podcast-corpus-lenny.md) (2026-07-10) already mines **16 episodes** across 8 themes and carries a closing synthesis of 10 ranked insights plus 10 ranked product moves. It is good, and it is cited downstream in positioning and the YC application. **Do not re-run that sweep.**

What the archive adds over it, measured:

| Gap | Size |
| --- | --- |
| Podcasts in the 18-month window never examined | **84** (100 in window, 16 mined) |
| Newsletter posts never examined | **367** (zero coverage today) |
| Episodes published after the doc's cutoff | **5**, incl. the 2026-07-12 annual AI sentiment survey |
| Quote provenance | Existing quotes are **ASR auto-captions** with hand-fixed mis-transcriptions. All 14 source files are in the archive, so every quote is now verifiable against official text. |
| Time depth | Existing doc starts 2025. Archive reaches 2019/2022, making language-drift analysis possible. |

The highest-value use is **verification and extension**, not repetition.

---

## Related

- [`podcast-corpus-lenny.md`](./podcast-corpus-lenny.md) — the 16-episode sweep this archive extends.
- [`pm-voice-and-ai-tooling-research.md`](./pm-voice-and-ai-tooling-research.md) — the §12.4 citation rule that binds all quoting here.
- [`AGENTS.md` §10](../archive/agent-operating-manual.md) — the cross-tool layering this setup follows.
- [`README.md`](./README.md) — folder index and the two standing evidence rules.
