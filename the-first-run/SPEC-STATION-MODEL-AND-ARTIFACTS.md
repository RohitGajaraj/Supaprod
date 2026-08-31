# SPEC — the station model, the artifact formats, and running on any engine

> _Created: 2026-08-31 · Last updated: 2026-08-31_
>
> **Answers three founder questions from 2026-08-31, in order:** should Discover and Decide merge;
> should our stations become Anthropic's six; and what the artifacts actually look like — including
> **what happens when the customer's engine is not Claude.**
>
> Companion to [`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md), which is the adoption register.
> **That file says what we take. This one says what it looks like.**

---

## 1 · The station question, answered

**Founder:** *"Can we club Discover and Decide together? Should we have Discover+Decide and then the
six stages? Can we club test, deploy and maintain? If everything is expanded it widens our stages."*

**Recommendation: the spine keeps seven stations, unchanged. Three things change instead** — the
handoff becomes ONE artifact, the display gains a second vocabulary, and the self-check becomes
visible. **The instinct behind the question is right and the merge is the wrong instrument for it.**

### 1.1 · Why Discover and Decide do not merge

The instinct is sound: **71 of 73 tracks entered at `sense` and roughly 46 died there.** Something at
that boundary is broken. But the boundary is not what broke.

**Three arguments, and the first is the one that settles it.**

1. **The forecast is written at Decide and nowhere else, and it is the entire moat.** A forecast
   recorded while you are still finding things is not a forecast — it is a guess with nothing
   committed behind it. **The moat is "the forecast captured at decision time", which requires a
   moment of decision distinct from the moment of finding.** Merge the stations and you blur the one
   moment the product exists to capture.
2. **The two have different cardinality.** Discover produces **0..n candidates**. Decide produces
   **exactly one commitment.** A station whose output is both has no clean acceptance test — and
   gap #1, *stations must check their own output before handing on*, becomes uncheckable at the very
   station where the graveyard is.
3. **The graveyard was a mechanism bug and it is already fixed.** The restatement fold returned
   `ids: []`, so the second track in any evidenced workspace could never clear Discover honestly —
   every honest signal folded, and only rewording got past. Fixed in `5ea7415a2` (F-73). **Merging two
   stations to cure a bug that is already cured is surgery for a symptom.**

### 1.2 · What we do instead, and it is what the merge was actually reaching for

**One artifact, two stations.** Discover and Decide both write into a **single `intent.md`**:

- **Discover** fills problem, proposed outcome, affected users and systems, constraints, open
  questions — and files it **incomplete on purpose**, with the unfilled fields named.
- **Decide** adds the commitment, the chosen option and the **forecast block**, and signs it.

**The person sees one file with one name. The spine keeps two stations and two checkable outputs.**
That is the merge's whole benefit at none of its cost — and it is exactly Anthropic's shape, whose
Stage 1 also produces one `intent.md`. **We match them at the artifact level while keeping a finer
spine underneath**, which is the correct place for the two models to differ.

### 1.3 · Why Test does not become a station, and why Deploy and Maintain do not club

**Test. CORRECTED 2026-08-31 — this section originally claimed we already cover it, and we do not
(F-148).** Their Stage 4 is *"a named verification target the agent iterates against."* What F-76
shipped is a **filing check**: `verifyStationOutput` confirms a row of the right kind exists and, at
four of seven stations, that one string is non-empty. **It compiles nothing and runs nothing** — and
at Build it requires artifact kind `mission`, which the driver writes itself before any seat runs, so
**it cannot fail.** Real execution exists at `studio.checks.run` (a sandboxed clone taking real exit
codes) but it is one skippable instruction with no gate behind it.

**The answer is still not an eighth station** — that would solve a coverage problem with a reporting
change. It is that **Test needs a real gate at the Build→Ship seam**: `studio.checks.run` briefed as
required rather than suggested, its verdict recorded, and the advance refused on red. Until that
exists, **we do not claim this stage**, because standard #7 deletes features that claim what they do
not do.

**Deploy and Maintain, and this is the sharp one: Deploy is an event; Learn is a wait.** Ship
completes in seconds. Learn waits for the forecast's horizon — F-104's is due **2026-10-15**, two
months out. **You cannot merge a moment with a two-month wait**: the merged station could never
report whether it succeeded, which breaks gap #1 again, and it would demote the only defensible layer
to a checkbox at the end of a deploy.

### 1.4 · The count is presentational, not structural — and R-01 already authorised the fix

**Founder's worry that adopting the playbook widens our stages is answered: it does not add one.**

R-01 already rules that **the internal slug and the displayed name are decoupled through a map** —
*"`sense` already displays as Discover and `define` as Plan. One vocabulary, on the display side,
derived from one map. A raw station slug reaching a screen is a bug."*

**So we speak their vocabulary by extending that map with a column. No rename, no migration, and the
acceptance query keeps working on three months of comparable history.**

| Our slug | Displays as | Their stage | Their artifact |
| --- | --- | --- | --- |
| `sense` | **Discover** | 1 · Plan | `intent.md`, fields 1–5 |
| `decide` | **Decide** | 1 · Plan | `intent.md`, commitment + **the forecast block** |
| `define` | **Plan** | 2 · Design | `spec.md` |
| `design` | **Design** | 2 · Design | `spec.md` + the prototype |
| `build` | **Build** | 3 · Build **and** 4 · Test | `plan.md`. **Test is NOT yet honestly covered** — see §1.3 and F-148 |
| `ship` | **Ship** | 5 · Deploy | the deploy record; reads their `REVIEW.md` |
| `learn` | **Learn** | 6 · Maintain | **`verdict.md` — ours, see §2.5** |

**Read the table in both directions and the apparent gap disappears.** Two of theirs collapse into
one of ours twice (Plan covers `sense`+`decide`; Design covers `define`+`design`), and one of ours
covers two of theirs (`build` covers Build and Test). **Six and seven are the same pipeline sliced
differently, and neither is wrong.**

**Do not put both vocabularies on screen at once.** R-01's law is one vocabulary at a time; the SDLC
names are what a customer *on the playbook* can switch to, not a second label beside ours.

---

## 2 · The artifact formats

**Two rules govern every one of them, and they are what make the rest of this file safe.**

**Rule A — the artifact is the serialisation, never the storage.** `spine_track_members` stays the
source of truth. These files are emitted from it. **If Anthropic changes their format, we change an
emitter, not a schema.**

**Rule B — engine-neutral body, engine-specific wrapper.** Nothing inside an artifact body names a
model vendor. §3 handles the two files that must.

Every artifact opens with the same frontmatter block:

```yaml
---
supaprod:
  schema: supaprod.<kind>/1        # ours, versioned independently of theirs
  track: <uuid>
  workspace: <uuid>
  stations: [<slug>, ...]          # which of our seven produced this
  emitted_at: <ISO 8601, UTC>
sdlc:
  stage: plan | design | build | test | deploy | maintain
  artifact: intent.md | spec.md | plan.md | verdict.md
---
```

**The `sdlc:` block is the translation, machine-readable.** A tool that knows only the playbook reads
`sdlc.artifact` and ignores everything under `supaprod:`. A tool that knows us reads both. **That is
how one file serves both audiences without a second format.**

### 2.1 · `intent.md` — Discover writes it, Decide signs it

```markdown
---
supaprod: { schema: supaprod.intent/1, track: …, workspace: …, stations: [sense, decide], emitted_at: … }
sdlc:     { stage: plan, artifact: intent.md }
---

# <the problem in one line, in the user's own words>

## Problem
<what is happening, and the evidence that says so — each claim carries its source>

## Proposed outcome
<what should be true instead>

## Affected users and systems
<who feels it, and what it touches>

## Constraints
<what must not change: budget, deadline, policy, a system that cannot be taken down>

## Open questions
<what is genuinely unsettled>
<!-- An empty list is a DEFECT, not a clean bill. Discover filing zero open questions
     means it did not look, and the station's self-check rejects it. -->

## The forecast
<!-- OURS. Their format has no field for any of this, which is the moat in one block.
     Written at Decide and nowhere else. Absent here means the track is not decided. -->
- **Metric:** <the one number this is judged on>
- **Reading now:** <value> — read by <probe>, at <ISO>
- **Predicted:** <value> by <ISO horizon>
- **Confidence:** <0.00–1.00>
- **Band:** on-track <range> · drifting <range> · missed <range>
- **If drifting:** <the tier-2 action> · **If missed:** <the tier-3 action>
- **Recorded at:** <ISO — stamped by the database, immutable to application callers>
- **Decided by:** <agent id, or the person, and never blank>
```

**Four design decisions worth stating.**

1. **Their five fields keep their names and their order.** A team on the playbook reads a file they
   already know.
2. **The forecast is a separate section, not a field inside theirs.** If their schema moves, our moat
   field is untouched — this is Rule A applied at the paragraph level.
3. **`Recorded at` is database-stamped.** `created_at` was a client-settable, rewritable column until
   2026-08-10, and 93 decisions carried a date earlier than the workspace containing them. **A
   forecast that can be written into the past is not a forecast**, so this line is the claim and the
   enforcement together.
4. **An empty `Open questions` fails the station's own check.** Anthropic's field is descriptive; we
   make it load-bearing, because *"AI cannot correct ambiguity that was never resolved"* and a
   confident empty handoff is the exact failure that filled the `sense` graveyard.

### 2.2 · `spec.md` — Plan and Design

Sections: **What we are building · Requirements** (each traceable to an intent line) **· What is out
of scope · Design decisions and what was rejected · Interfaces and contracts · How this will be
verified · Open questions still standing.**

**The rejected-options section is not optional.** A spec that lists only what was chosen cannot be
graded later, and grading is what we are for.

### 2.3 · `plan.md` — Build

Theirs verbatim: **files that change, the order of the work, and the tests that prove it.** Plus one
of ours — **the self-check result per step**, which is their Test stage made visible (gap #22).

**Updated alongside the code when the implementation departs from the plan**, which is their rule and
a good one: a plan that silently stopped matching the diff is worse than none.

### 2.4 · `REVIEW.md` — we READ this one, we do not write it

Written by the customer's tech lead: the review passes, the severity definitions, the exclusions.
**Ship reads it to know what the outcome had to clear** (gap #18 builds the surface where a customer
who has no repo can write one).

### 2.5 · `verdict.md` — ours, at Learn, and their pipeline has no equivalent

**This is worth noticing.** Their Stage 6 turns a breach into a *new* `intent.md`. **The grade itself
is never a document in their model.** Ours must be, because the grade is the product.

```markdown
---
supaprod: { schema: supaprod.verdict/1, track: …, stations: [learn], emitted_at: … }
sdlc:     { stage: maintain, artifact: verdict.md }
---

# <what was decided> — <MET | DRIFTING | MISSED>

## What was predicted
<the forecast block, copied verbatim from intent.md, with its original Recorded at>

## What happened
- **Metric:** <same metric> · **Reading:** <value> at <ISO> · **Read by:** <probe>
- **Band it landed in:** <on-track | drifting | missed>

## The gap, and what it suggests
<the difference, and what it implies about how this call was made — never about the code>

## What follows
- **Tier action taken:** <logged | diagnosed | new work opened>
- **New work:** <link to the intent.md this produced, or "none, and why">
```

**Copying the forecast verbatim rather than linking it** is deliberate: a verdict that renders its
prediction by lookup can be read after the source row changed. **A grade must carry the thing it
grades.**

### 2.6 · Bands, and why they are a section rather than a file

Anthropic put thresholds in `bands.yaml`, a **service-level** file. **Ours belong to the decision, not
to the service** — every forecast has its own metric, horizon and tiers. So the band lives in the
forecast block (§2.1) and there is no `bands.yaml`. **A workspace-level default is fine and is a
fallback, never the record.**

---

## 3 · Running on an engine that is not Claude

**Founder:** *"If I'm not using Claude as my core engine — if I switch to Gemini or some Chinese model
— how would other models read CLAUDE.md? That pointer and that mapping need to be done."*

**The good news first: eight of the ten artifacts have no vendor coupling at all.** `intent.md`,
`spec.md`, `plan.md`, `verdict.md` and `REVIEW.md` are plain markdown with YAML frontmatter. **The
problem is exactly two files, and this repository already solved it.**

### 3.1 · The rule: substance in `AGENTS.md`, one thin pointer per engine

**`AGENTS.md` is the cross-vendor convention** and it is what we already do here: our own `CLAUDE.md`
and `GEMINI.md` both open with *"Read `AGENTS.md`. It is the build manual and it is canonical."*
**Productise the pattern we already run.**

- **`AGENTS.md` carries every word of the substance.** It is what Supaprod writes and what Supaprod
  reads.
- **Each engine gets a pointer file of a few lines**, whose only job is to send that engine to
  `AGENTS.md`. Generated, never hand-written, never diverging.

| Engine | Pointer file | Notes |
| --- | --- | --- |
| Claude Code / Claude | `CLAUDE.md` | Also read at subdirectory level |
| Gemini / Jules | `GEMINI.md` | |
| OpenAI Codex · Cursor · most forks | `AGENTS.md` | **Reads the canonical file directly — no pointer needed** |
| GitHub Copilot | `.github/copilot-instructions.md` | |
| Cursor, legacy projects | `.cursorrules` | |
| Qwen Code | `QWEN.md` | The path most Chinese-model users arrive on |
| DeepSeek · GLM · Kimi, via a Codex-derived CLI | `AGENTS.md` | Same as Codex; they inherit the convention |

**Unknown engine? Write `AGENTS.md` and stop.** It is the widest-read filename and a pointer we
invent for an engine nobody named is a file nobody opens.

### 3.2 · Skills, which are the second coupled thing and the cheaper one

`.claude/skills/<name>/SKILL.md` is a **folder path**, not a format: the file inside is markdown with
YAML frontmatter naming the skill and when it triggers. **The content is already neutral.**

So the adapter writes one body to whichever layout the engine expects — `.claude/skills/<name>/SKILL.md`,
`.gemini/`, `.cursor/rules/`, or a plain `docs/` folder referenced from `AGENTS.md` for an engine with
no skills concept. **A directory-layout adapter, not a translation.**

### 3.3 · The design law that keeps this true

> **No engine's name appears in the body of any artifact Supaprod emits.** Engine coupling is a
> filename and a folder path, and both live in one adapter. **A sentence in a spec that says "ask
> Claude to…" is a defect** — it is an instruction to one vendor's product inside a document meant to
> outlive that choice.

**And the reason this matters more than it looks.** We tell customers we are not a builder and that
their builder is substitutable. **An artifact that only Claude can read makes that false.** Engine
portability is not a feature request; **it is the position, kept honest at the file level.**

### 3.4 · What we do NOT promise

**We do not promise that a different engine performs the same.** We promise it can **read** what we
hand it. **Quality is the engine's; the format is ours** — and the verdict is measured against the
forecast rather than against the code, which is precisely why a weaker engine does not break the loop.

---

## 4 · The user experience, and the tension this spec creates

**Founder, 2026-08-31:** *"User experience plays a very vital role. No too much friction, no too much
learning curve. Visually agentic work matters, and how a user interacts at each stage."*

**Name the tension before resolving it: §2 just specified five markdown files with YAML frontmatter,
and the persona is a person accountable for an outcome who is not doing the work.** Handed to them
raw, that is a developer artifact and a learning curve. Three rules keep it from becoming one.

### 4.1 · The artifact is never the interface. The run is.

**A person never sees YAML, a filename, or a section heading from §2.** R-01 rules that a raw station
slug reaching a screen is a bug; **the same law extends — raw frontmatter reaching a screen is a
bug.**

The artifacts are three things, and none of them is a UI:

- **the handoff between stations**, which is why the self-check has something to check;
- **what we hand a builder**, which is gap #20 and the reason the format is theirs;
- **what a customer takes away** on export.

**On screen, an artifact appears as a card in the run: what this station produced, in a sentence a
person reads without scrolling.** The file is behind a "take this" control, not in front of the work.

### 4.2 · Three kinds of moment, not seven. This is the whole learning curve.

**A person's interaction at any station is exactly one of three things**, and naming them is what
stops seven stations from being seven things to learn:

| The moment | Where it happens | What it feels like |
| --- | --- | --- |
| **Nothing.** It runs. | Most stations, most of the time | Work visibly moving. No decision offered, because none is needed |
| **An answer.** Something is genuinely unknown | `Open questions` · a boundary call | One question, in place, in the transcript. Answering widens the class, never the instance |
| **A judgement.** Only you can make this call | The **forecast** at Decide · accepting the **verdict** at Learn | One number and one date. Prefilled by the agent, changeable by you |

**Seven stations, three kinds of moment.** A person learns three things and the machine keeps the
other four. **If a surface asks for a fourth kind of interaction, that surface is the defect.**

### 4.3 · The five fields are a shape, never a form

**The product never asks a person to fill in problem, outcome, affected users, constraints and open
questions.** That is a setup wall and §1's first agentic property forbids it: *it starts without a
form.*

**Discover fills them and the person reads them.** A field the station could not fill is shown as
what it is — *"I could not find who this affects"* — with the one action that resolves it, inline.
**A missing field is a question the product asks, not a blank the person is handed.**

**And the open questions are where the person is actually worth something.** Anthropic's field is
descriptive; here it is the primary human touchpoint. The agent says what it does not know; the
person answers, or says proceed anyway and that becomes part of the record. **That is the interaction
this product is for, and it is one tap in the place the work already is.**

### 4.4 · Visually agentic means the artifact lands where you can see it

**The artifact is the unit of visible progress**, and we already measure it: F-99 recorded a dead
track filing its **first artifact in 34 hours** once the ceiling was cleared. A station that produced
something has something to show; a station that produced nothing cannot fake it.

So: **an artifact appears in the pane at the moment it is filed**, and the transcript says who filed
it and what it feeds. **No progress bar advanced by a timer, no step label that moves without a row
behind it** — a state the data cannot prove is a state we do not draw, and a feature caught staging
one is deleted rather than fixed.

### 4.5 · The friction test, stated so it can be failed

Before any surface in this spec ships, all five must hold:

1. **Nothing must be filled in before something happens.**
2. **A person can answer any question without leaving the place the work is.** No queue, no detour.
3. **Every number on screen names its source when asked**, and no number appears that no writer sets.
4. **A word a person would not say out loud to a colleague does not appear** — `intent.md`, `spec.md`
   and `sdlc.stage` are **file names and machine fields, and they never become UI vocabulary.**
5. **A stranger signed in reaches the first useful moment without being told anything** (§0.7 — and
   the sixty seconds is measured signed in).

---

## 5 · What this adds to the gap list

| # | Gap | Owner |
| --- | --- | --- |
| 25 | **Engine-neutral emission with a per-engine pointer adapter.** `AGENTS.md` carries the substance; `CLAUDE.md`, `GEMINI.md`, `QWEN.md`, `.cursorrules`, `.github/copilot-instructions.md` are generated pointers. Skills adapt by directory layout. **No engine name in any artifact body.** | **S0** |
| 26 | **The SDLC vocabulary as a display translation, under R-01.** Extend the existing slug→display map with a third column so a customer on the playbook can switch to Plan/Design/Build/Test/Deploy/Maintain. **One vocabulary at a time on screen; never both.** | **S1** map · **S2** shell |
| 27 | **`verdict.md` at Learn**, carrying its forecast verbatim. Their pipeline has no artifact here, so nothing is being copied — this one is ours to define. | **S0** emitter · **S1** surface |
| 28 | **The artifact card**: what a station produced, as one readable sentence in the run, with the file behind a "take this" control. **No frontmatter, no filename, no section headings on screen** (§4.1). | **S1** |
| 29 | **Open questions as the human touchpoint** — answered in place in the transcript, the answer widening the class rather than the instance, and *proceed anyway* recorded as an answer (§4.3). | **S1** |

**None adds a station, a route or a destination.**
