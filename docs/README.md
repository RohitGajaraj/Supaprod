# docs/

> _Created: 2026-06-04 · Last updated: 2026-08-03_

**Fifteen folders, each answering one question.** Every one has an index. This file says which folder answers which, and it is the placement policy: before creating any file, find its bucket here and link it from that bucket's index in the same commit.

Start at [`../README.md`](../README.md) if you want to know what the product is. Start at [`../AGENTS.md`](../AGENTS.md) if you are about to write code.

---

## The buckets

### Why we build what we build

| Folder | Question it answers |
| --- | --- |
| **[`strategy/`](./strategy/README.md)** | Direction, the moat, positioning, pricing. Which doc is current is decided by its README, the arbiter. |
| **[`references/`](./references/)** | What the market and competitors actually do. Dated primary sources. Cite artifacts and companies, never gurus. |
| **[`prompts/`](./prompts/README.md)** | The founder's mission briefs, verbatim. Not rules, not plans; the original ask. |

### What we are building

| Folder | Question it answers |
| --- | --- |
| **[`planning/`](./planning/README.md)** | Where we are, what is next, what needs the founder. **[`planning/SOURCE-OF-TRUTH.md`](./planning/SOURCE-OF-TRUTH.md) §0 is the only live cursor.** Per-feature status is [`planning/feature-dashboard.md`](./planning/feature-dashboard.md); open bugs are [`planning/known-issues.md`](./planning/known-issues.md). |
| **[`features/`](./features/README.md)** | How each shipped thing works, one page per feature. The loop's proof file is [`features/lifecycle-signal-to-learning.md`](./features/lifecycle-signal-to-learning.md). |

### How it should look, and how it is built

| Folder | Question it answers |
| --- | --- |
| **[`design/`](./design/DESIGN-SYSTEM.md)** | The design contract. **[`design/DESIGN-SYSTEM.md`](./design/DESIGN-SYSTEM.md) is current**; the four earlier systems are in its [`archive/`](./design/archive/README.md). |
| **[`conventions/`](./conventions/README.md)** | Durable cross-tool rules: voice, chrome, destructive actions, the Engine-Room doctrine, surface discipline, humanized output. |
| **[`decisions/`](./decisions/)** | ADRs. Why a technical call went the way it did. |
| **[`../architecture/`](../architecture/)** | The contracts: runtime, orchestration, security, data, frontend, integrations. Lives at repo root, not here. |

### How we run and verify it

| Folder | Question it answers |
| --- | --- |
| **[`operations/`](./operations/README.md)** | Commits, hooks, skills, memory, demo logins, connectors, runbooks, go-live, procurement. |
| **[`testing/`](./testing/README.md)** | How tests are written here. One live document; coverage snapshots are archived. |
| **[`security/`](./security/README.md)** | Audit findings and remediation state. |

### What we say outward

| Folder | Question it answers |
| --- | --- |
| **[`pitch/`](./pitch/README.md)** | The Pitch Room. What we **say**: one-pager, Q&A bank, demo script, investor deck, applications. Updated in place, never forked into parallel copies. Claims carry `PROVEN` / `WIRING` / `ROADMAP`. |
| **[`growth/`](./growth/README.md)** | What we **do** to grow: channel playbooks, launch sequencing, experiments, the brand kit, and [`brand-ops/`](./growth/brand-ops/README.md) for naming, domains, handles and trademark. |

### History

| Folder | Holds |
| --- | --- |
| **[`archive/`](./archive/)** | Cross-cutting history that belongs to no single bucket. |
| Per-folder `archive/` | Superseded material stays beside its bucket: [`design/archive/`](./design/archive/README.md), [`planning/archive/`](./planning/archive/README.md), `strategy/archive/`, `testing/archive/`, `features/archive/`. |
| **`screenshots/`** | Local only, gitignored. Verification captures, never committed. |

Two loose files are allowed at this level and no others: this index, and [`brand-feed.md`](./brand-feed.md), the one-way feed of postable build insights that the separate private build-in-public repo reads.

---

## Placement policy

**Before you create a file, find its bucket above.** Then:

1. **Extend before you create.** If a doc already serves the purpose, add to it. A new file is for a genuinely new purpose.
2. **Link it from its bucket's index in the same commit.** A file nothing links to is a file nobody finds. Nine such orphans were found on 2026-08-03, all in the three folders that had no index at all.
3. **Never at repo root, never at `docs/` top level.** Root holds exactly four files: `README.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
4. **Status lives only in the SSOT.** Never copy a status board or a canon paragraph into a second file. Link instead.
5. **Archive, do not orphan.** A superseded doc moves to the nearest `archive/` **with a line saying why it went**, and its inbound links are retargeted in the same commit.
6. **A date header on every doc**, directly under the H1: `> _Created: YYYY-MM-DD · Last updated: YYYY-MM-DD_`. **No dates in filenames**, except a genuine dated record under `archive/` or `applied/`.
7. **kebab-case, no spaces, no capitals** in folder names. Three folders broke this, and one of them, `Growth Strategy`, forced `%20` into every link that reached it.

`scripts/docs-doctor.sh` enforces items 2, 3, 6 and 7, and it runs itself from the pre-commit hook whenever a commit touches markdown. You do not need to remember to run it.

---

## What the 2026-08-03 cleanup moved

| Before | Now |
| --- | --- |
| 22 markdown files at repo root, 1.87 MB | 4 files, 49 KB |
| `plan.md`, 1.3 MB, and every tool was told to read it | [`planning/archive/build-log.md`](./planning/archive/build-log.md). History, not a plan. |
| `Ai_Cofounder.md` | [`strategy/founding-constitution.md`](./strategy/founding-constitution.md) |
| `DESIGN.md`, `DESIGN-TEMPO.md`, `DESIGN-LOOM.md`, `DESIGN-OBSIDIAN.md` | [`design/archive/`](./design/archive/README.md). The live contract is [`design/DESIGN-SYSTEM.md`](./design/DESIGN-SYSTEM.md). |
| `ENTRY.md` | Deleted. Its only job was the doc map, which [`../README.md`](../README.md) owns. |
| 5 `REBUILD-*`, 3 `WAVE_*`, `DELIVERY-SUMMARY-*` at root | [`planning/archive/rebuild-2026-07-18/`](./planning/archive/rebuild-2026-07-18/README.md) |
| `Growth Strategy/` and `gtm/`, two go-to-market folders | [`growth/`](./growth/README.md), with [`brand-ops/`](./growth/brand-ops/README.md) inside it |
| `strategy/Prompts/`, a prompt filed as strategy canon | [`prompts/`](./prompts/README.md) |
| A mission prompt loose at `docs/` top level with **no file extension** | [`prompts/production-readiness-audit.md`](./prompts/production-readiness-audit.md) |
| `runbooks/`, a folder holding exactly one file | Folded into [`operations/`](./operations/README.md) |
| `planning/`, 51 loose files | **12**, with 30 orphaned reports plus six finished plans in [`planning/archive/reports/`](./planning/archive/reports/README.md) |
| `strategy/` declaring **seven** documents current at once | One per question, per the [arbiter](./strategy/README.md) |
| `feature-dashboard.md`, 6.45 MB | 923 KB. 85% was table padding; removing it was verified lossless. |

**Nothing was deleted except `ENTRY.md`.** Everything else moved, with a README at each destination recording what it was and why it stopped being current.
