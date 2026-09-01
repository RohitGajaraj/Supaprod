# Cross-cutting archive

> _Created: 2026-08-04 · Last updated: 2026-09-01_

**Six documents that belong to no single bucket.** Three are history; three are the root instruction files retired from auto-loading on 2026-09-01, kept live as reference. Everything else superseded lives in an `archive/` beside its own folder, which is the pattern: [`../design/archive/`](../design/archive/README.md), [`../planning/archive/`](../planning/archive/README.md), `../strategy/archive/`, `../testing/archive/`, `../features/archive/`, `../operations/archive/`.

This folder exists only for material that would be arbitrary to file under any one of those.

| File | What it is |
| --- | --- |
| [`idea-origination-inputs.md`](./idea-origination-inputs.md) | Where the idea came from. The earliest inputs, before there was a product to have a strategy about. Worth reading once for the founding intent. |
| [`competitive-reference.md`](./competitive-reference.md) | An early competitor reference. Superseded by [`../research/competitive-landscape.md`](../research/competitive-landscape.md) and the 2026-07-10 sweep in [`../research/launch-research-briefs.md`](../research/launch-research-briefs.md). |
| [`design-legacy.md`](./design-legacy.md) | Design history predating the four named systems. The full retirement record is [`../design/archive/README.md`](../design/archive/README.md); the live contract is [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md). |
| [`agent-operating-manual.md`](./agent-operating-manual.md) | **Was `AGENTS.md` at repo root until 2026-09-01, 47KB.** The full build manual: operating rules, gates, the doc loop, every tool. Still true; simply no longer auto-loaded into every session. |
| [`claude-code-brief.md`](./claude-code-brief.md) | **Was `CLAUDE.md` at repo root until 2026-09-01, 19KB.** Carries the acceptance SQL, the vocabulary canon summary and the five-session model. The live short brief is [`../../CLAUDE.md`](../../CLAUDE.md). |
| [`gemini-brief.md`](./gemini-brief.md) | **Was `GEMINI.md` at repo root until 2026-09-01.** The Gemini / Antigravity equivalent. |

---

> **The three 2026-09-01 arrivals are the exception to the line below.** They were archived to
> test whether a smaller instruction surface produces better work, not because anything in them was
> found wrong. No claim in them was withdrawn and no ruling reversed. If one of them contradicts a
> live document, that is a real contradiction to resolve, not a stale file. Restoring any of them is
> one `git mv` back to the root name.

**Nothing here is authority.** If a claim in one of these files contradicts a live document, the live document wins, and the contradiction is a sign this file should have been annotated when it was superseded.
