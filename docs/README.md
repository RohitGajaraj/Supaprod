# docs/

> _Created: 2026-06-04 · Last updated: 2026-08-03_

**Thirteen folders, each answering one question.** Every one has an index. The test is that clicking one folder tells you everything about that topic. This file says which folder answers which, and it is the placement policy: before creating any file, find its bucket here and link it from that bucket's index in the same commit.

Start at [`../README.md`](../README.md) if you want to know what the product is. Start at [`../AGENTS.md`](../AGENTS.md) if you are about to write code.

---

## The buckets

### Why we build what we build

| Folder | Question it answers |
| --- | --- |
| **[`strategy/`](./strategy/README.md)** | Direction, the moat, positioning, pricing. Which doc is current is decided by its README, the arbiter. |
| **[`references/`](./research/)** | What the market and competitors actually do. Dated primary sources. Cite artifacts and companies, never gurus. |
| **[`prompts/`](./prompts/README.md)** | The founder's mission briefs, verbatim. Not rules, not plans; the original ask. |

### What we are building

| Folder | Question it answers |
| --- | --- |
| **[`planning/`](./planning/README.md)** | Where we are, what is next, what needs the founder. **[`planning/SOURCE-OF-TRUTH.md`](./planning/SOURCE-OF-TRUTH.md) §0 is the only live cursor.** The register of open work is in that same file; open bugs are [`planning/known-issues.md`](./planning/known-issues.md). |
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
| **[`testing/`](./operations/testing/README.md)** | How tests are written here. One live document; coverage snapshots are archived. |
| **[`security/`](./operations/security/README.md)** | Audit findings and remediation state. |

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

**Only this index sits loose at `docs/` top level.** Nothing else, ever.

---

## Where does a new file go? The routing table.

**Find your row before you create anything.** This table exists so nobody has to guess, and so we never do another cleanup. If your case is genuinely absent, add a row rather than inventing a folder.

### Documents

| What you have | Where it goes | Link it from |
| --- | --- | --- |
| **Research, analysis, a competitor sweep, market evidence, an interview corpus** | [`research/`](./research/README.md) | its README. **Read it first**: this corpus is large enough that the same sweep has been run twice. |
| **A product or design pattern lifted from a proven product** | [`design/REFERENCE-PATTERNS.md`](./design/REFERENCE-PATTERNS.md), appended | already linked. Never a new file per pattern. |
| **Strategy, direction, the moat, market positioning** | [`strategy/`](./strategy/README.md) | its README, the arbiter. **Update `v11-guiding-star.md` in place; do not open a v14.** |
| **Product positioning as words a customer reads** | [`pitch/`](./pitch/README.md), in the existing file | its README. Update in place, never a parallel copy. |
| **An accelerator, incubator or VC application** | `pitch/applications/<programme>/` | [`pitch/applications/README.md`](./pitch/applications/README.md). Answers go in `answer-bank.md`, not per programme. |
| **The product film, or any change to it** | [`../videos/supaprod-film/`](../videos/supaprod-film/README.md) | its README — the deliverables, the source layers, the two change pipelines, and the traps. The shipped 2:22 film lives there, not in `docs/`. |
| **A question you were asked in an interview, or a pushback** | [`pitch/founder-answer-playbook.md`](./pitch/founder-answer-playbook.md), same session | already linked. This file is updated after **every** application and interview. |
| **Launch, marketing, a channel playbook, an experiment, brand ops** | [`growth/`](./growth/README.md) | its README. Numbered `00`..`07` for the launch sequence; brand ownership in `brand-ops/`. |
| **Architecture: a contract about how the system is built** | [`../architecture/`](../architecture/README.md) | its README. Contracts state the invariant; they do not argue for it. |
| **A technical decision, with options and the cost accepted** | [`decisions/`](./decisions/README.md) | its README. Disagree with one? Add a superseding record, do not quietly build the other way. |
| **A durable cross-tool rule** (voice, chrome, destructive actions) | [`conventions/`](./conventions/README.md) | its README. **Add a test if code can violate it silently**, or it is a suggestion. |
| **How a shipped feature works** | [`features/`](./features/README.md), one page per feature | its README. Name it for the feature, **never for its ticket ID**. |
| **A plan for a multi-item initiative** | [`planning/initiatives/`](./planning/initiatives/) | [`planning/README.md`](./planning/README.md). Move it to `planning/archive/` the day its work closes. |
| **Status: what is in flight, what is next** | [`planning/SOURCE-OF-TRUTH.md`](./planning/SOURCE-OF-TRUTH.md) | nowhere else. **There is exactly one board.** |
| **A bug with a reproduction** | [`planning/known-issues.md`](./planning/known-issues.md) | already linked |
| **A non-functional gap belonging to no feature** | [`planning/cross-cutting-gaps.md`](./planning/cross-cutting-gaps.md) | already linked |
| **A runbook, playbook, or ops procedure** | [`operations/`](./operations/README.md) | its README |
| **Anything about testing** | [`operations/testing/`](./operations/testing/README.md) | its README |
| **Anything about security or an audit** | [`operations/security/`](./operations/security/README.md) | its README |
| **A privacy or data-handling disclosure that a public legal page is written from** | [`operations/security/`](./operations/security/README.md) | its README. The page states it in plain words; this states it with file and line, so the two can be checked against each other. [`operations/security/cookie-and-storage-policy.md`](./operations/security/cookie-and-storage-policy.md) is the worked example. |
| **A founder mission brief, verbatim** | [`prompts/`](./prompts/README.md) | its README |
| **What this session did and left open** | [`operations/session-handoff.md`](./operations/session-handoff.md) | already linked. Write it **before** you stop. |

### Images and other non-documents

| What you have | Where it goes |
| --- | --- |
| **A screenshot you took to verify a build, or during a walkthrough** | **`docs/screenshots/`**, which is **gitignored**. Never commit it, and never leave it at repo root. Sixty were found loose at root on 2026-08-04. |
| **A screenshot from a specific session** | `docs/screenshots/session-captures/` |
| **An image a build must match**, curated and worth committing | `design-reference/` |
| **A brand asset for outward use** (logo, favicon, social) | `docs/growth/branding/` |
| **A generated artifact** (graphify output, build output, test results) | its own gitignored directory. **Never hand-edit it**, and never commit one that is rewritten on every build. |
| **A temp file or scratch script** | your scratchpad, outside the repo. `.tmp-*/` is gitignored; a 1.9 MB temp screenshot directory was found committed. |

---

## The seven rules

1. **Extend before you create.** If a doc already serves the purpose, add to it. A new file is for a genuinely new purpose.
2. **Link it from its bucket's index in the same commit.** A file nothing links to is a file nobody finds. Nine orphans were found on 2026-08-03, all in the three folders that had no index.
3. **Never at repo root, never at `docs/` top level.** Root holds exactly four files: `README.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`. This index is the only loose file in `docs/`.
4. **One board.** Status lives only in [`planning/SOURCE-OF-TRUTH.md`](./planning/SOURCE-OF-TRUTH.md). Never copy a status table or a canon paragraph into a second file; link instead. Two files answering "where are we" is what produced a 260 KB board whose own section 3 restated the other one.
5. **Archive, do not orphan.** A superseded doc moves to the nearest `archive/` **with a line saying why it went**, and its inbound links are retargeted in the same commit. A plan whose work is done is not a plan.
6. **A date header on every doc**, directly under the H1: `> _Created: YYYY-MM-DD · Last updated: YYYY-MM-DD_`. **No dates in filenames**, except a genuine dated record under `archive/` or `applied/`.
7. **kebab-case, no spaces, no capitals**, and **name a file for what it is, not for its ticket ID.** `h2-writes.md` told a reader nothing; `governed-roadmap-writes.md` tells them everything. A folder called `Growth Strategy` forced `%20` into every link that reached it.

`scripts/docs-doctor.sh` enforces rules 2, 3, 6 and 7, plus a scan for retired wording, and **it runs itself from the pre-commit hook** whenever a commit touches markdown. You never need to remember to run it. It caught four broken links during this very cleanup.

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
| `SOURCE-OF-TRUTH.md`, 6.45 MB | 923 KB. 85% was table padding; removing it was verified lossless. |

**Nothing was deleted except `ENTRY.md`.** Everything else moved, with a README at each destination recording what it was and why it stopped being current.
