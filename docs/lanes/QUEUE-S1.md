# QUEUE — S1 · THE RUN (`lane/run`)

> _Created: 2026-08-26 · Last updated: 2026-09-01_

> _Rewritten by S0 2026-08-31. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Take the top one that is not BLOCKED. Your brief is
> [`SESSION-1-THE-RUN.md`](../../the-first-run/SESSION-1-THE-RUN.md); the ranking is
> [`RANKED-BACKLOG.md`](../../the-first-run/RANKED-BACKLOG.md)._
>
> **Nothing frozen is in this queue** (§0.7). **Before starting either: grep for it first** — one
> coordination answer in six says the thing already existed (F-162).

---

## S1-Q1 · The artifact card — gap #28

> **S1-Q1 WAS "open questions, answered in place" AND YOU SHIPPED IT** in RUN-153 (`d19fc7987`),
> including the fifth state your own measurement earned — `said-nothing` (140 of 143) beside
> `filed-none` (one row in the product's history). Replaced rather than left to rot: a queue that
> lies to its lane spends units rediscovering finished work, which cost you one on F-150.

**Goal.** What a station produced, as one readable sentence in the run, with the file behind a
"take this" control. `SPEC-STATION-MODEL-AND-ARTIFACTS.md` §4.1 and §5 gap #28.

**What problem of mine does this kill?** I open a run and cannot tell what actually came out of a
station without reading a pane full of structure.
**What do I stop doing?** Opening the artifact to find out whether it is worth opening.

**THE HARD CONSTRAINT, AND IT IS THE WHOLE ITEM (§4.1).** *"A person never sees YAML, a filename,
or a section heading from §2."* R-01 rules that a raw station slug reaching a screen is a bug; the
same law extends — **raw frontmatter reaching a screen is a bug.** `intent.md`, `spec.md` and
`sdlc.stage` are file names and machine fields and **never become UI vocabulary** (§4.5 rule 4).

**Files.** `src/components/track/**` (yours). **`ArtifactPane` already exists — 2,415 lines,
mounted, six call sites, ten kind-specific renderers.** RANKED-BACKLOG settled this: *"Add exactly
one control"* in the `Region` header (`:2352-2355`), `Action` is already imported at `:73-82`, and
the `download()` shape is proven at `DataSection.tsx:91`. **Not a settings page, not a per-station
route, not a global list** — that last one was built, orphaned, audited and redirected away on
2026-07-30.

**Acceptance.** One sentence per station a person reads without scrolling · the file reachable and
never in front of the work · a station that produced nothing says so and cannot fake it (§4.4) ·
**driven, not unit-tested only** — you caught your own dead end in RUN-153 by opening the pane.

**Checked first, and name it in your unit file.** `ArtifactPane`'s existing `Region` header, and
why a new component was or was not needed.

## S1-Q2 · The value-audit surface — gap #17 / #7

**Goal.** *"Was it worth it"* has a surface, built from timestamps already stored.

**What problem of mine does this kill?** I authorise work and never learn what it cost against what
it promised.
**What do I stop doing?** Guessing whether the machine is earning its spend.

**Files.** `src/components/track/**` and the run's right pane. **Numbers are mine** — file the ask
and keep building the surface against a stub.

**The content is already written**: `SPEC-AI-NATIVE-SDLC.md` §3 D maps every one of Anthropic's
leading indicators onto rows we already hold. **Every row is a query, not a feature.**

**Acceptance.** Every number names its source when asked (§4.5) · no number appears that no writer
sets · a track with nothing to report says so rather than rendering zeros · **`studio.checks.run`
is NOT used as first-pass CI success rate** — it has run **once in the product's life** (F-148).

**BLOCKED-ISH, AND READ THIS BEFORE YOU START.** Another session pushed `d9acc36e3` *"S1 UNIT 7
PLANNING: value audit surface (gap #17)"* to `lane/run` and **filed a request to S0 for these very
queries** (F-161). **Do not start Q2 until the founder rules who is S1.** Take Q1, which nothing
else has touched.
