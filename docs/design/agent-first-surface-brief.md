# The agent-first surfaces: design brief and review log

> _Created: 2026-08-19 · Last updated: 2026-08-19_

> **STANDING INSTRUCTION, founder, 2026-08-19. The `supaprod-reimagined` artifact is a VANILLA WIREFRAME. It is not the design, it is not approved, and nothing may be built by copying it.**
>
> His words: *"I understand and take it as just a structure, a vanilla wireframe diagram, not the finalized one. It needs to be thought through continuously and evaluated from a user lens, colours, user experience, agent experience."*
>
> **Use it for structure only** — which surfaces exist, what each answers, what order things appear in. **Every visual decision in it is unresolved** and several are wrong, listed below. A build that reproduces the artifact has failed this brief.

Direction: [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md). Contract: [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md). Build queue: [`../operations/kiro-queue.md`](../operations/kiro-queue.md).

---

## 1. What the wireframe settled, and may be relied on

These are structural and survive the review. Build against them.

| Settled | Why it holds |
| --- | --- |
| **Home is the application's front door, not Discover's** | It answers five questions in order: what happened while I was away · what needs me · **what is at risk** · what to build next · what got recorded |
| **The composer is docked at the foot of every surface** | Asking is never a mode you enter or a screen you visit. `⌘K` focuses it from anywhere, including mid-run |
| **One gate, at the plan, and its answer is the forecast** | 70% of decisions people make are planning decisions; 93% of permission prompts get approved anyway |
| **Review happens in place, never in a new tab** | A new tab severs the run, and the run carries the meaning. The station spine stays pinned; one press returns |
| **The agent keeps working while you review** | Review is not a stop-the-world event. That is how a queue forms |
| **Stations are lenses over runs, not doors you must walk through** | They keep their names, glyphs and information models. Nothing merged |
| **Identity is shape, status is hue** | Meridian law 4, already violated and removed three times |

---

## 2. Defects found in review, 2026-08-19

Each of these is a real fault in the wireframe. **They are the work, not the polish.**

### 2.1 Layout and alignment

- **Numbers overlap.** On the ranked queue, the impact column collides: *"+2%"* and *"team activation"* run into each other on the second and third rows. The column has no reserved width and no baseline grid.
- **Text is centred where it should not be.** The impact column is centre-set for no reason. Numbers in a column are read by scanning down; centring destroys the scan line. **Right-align figures, left-align their labels.**
- **Alignment is not on a grid.** Rows resolve their own padding rather than sharing one rhythm, so nothing lines up between sections.

### 2.2 Controls and states

- **Interaction states are undefined.** Every control needs `rest / hover / active / focus-visible / disabled / loading / success / error` specified, and **what actually happens on click.** A button in a wireframe that does nothing teaches nothing.
- **Icon states are not designed.** An icon has to say whether it is decorative, interactive, or carrying status, and it currently says none of those.
- **Clicking a bet does nothing.** The single most important interaction on Home is undesigned: what opens, where, and what does it show.

### 2.3 Data display

- **The graphs are not good enough.** The sparkline and the horizontal score meters are the weakest thing on the page. *"The line bar graph is not great."* They read as generic dashboard furniture.
- **The ICE score presentation needs rethinking entirely.** Three stacked bars labelled Impact, Confidence, Ease is a form, not an insight. **Find a representation that says why this ranks first at a glance.**
- **Nothing is clickable through to detail.** A number that cannot be opened is a dead end.

### 2.4 Information density

- **It is too text-heavy.** Founder: *"It cannot be very text-heavy. It needs to give some summary details, and if something I click, I need to know the detailed insights about it."*
- **The rule to apply: summary first, detail on demand.** Every block earns its place by being scannable in about two seconds, with its full argument one press away. Today several blocks front-load the argument.

---

## 3. The standing bar

Beyond fixing the list above, every surface is judged on whether a person can answer these **without clicking**:

- What is happening right now
- What is not working, and why
- What is being affected, and whether that is good or bad
- Why this is worth picking over the alternatives
- What is ranked best, and on what basis
- What decision is being asked of me
- How this turned into something the product learned

And across every surface, not only inside a run: **it must be visible that an agent is acting.**

---

## 4. Open design questions

Genuinely unresolved. Answer with a named reference, per the standing rule that each surface lifts its information model from the best proven product in that category.

| # | Question | Constraint it must satisfy |
| --- | --- | --- |
| 1 | How is a ranked bet's score shown so the ranking is legible at a glance? | Not three bars. Must survive greyscale, must make outcome support visible |
| 2 | What is the right chart vocabulary here? | Categorical colour (`--mrd-viz-*`) is a separate system from status and must never read as status |
| 3 | What opens when a bet is clicked, and where? | Must obey the in-place review rule |
| 4 | How does a surface show agent activity without lying? | 64 files use a loading state; the ones where no agent is running must not show it |
| 5 | What does an illustration look like across the set? | §2a of the contract: it draws the product's own mechanics, never a mascot |

**Three stations have no reference research at all — Plan, Ship and Learn** — plus **Brain**, which is not in that table and has never had one named. `REFERENCE-PATTERNS.md` records the gap: Discover, Design and Build were researched on 2026-08-01 and Decide partially. **Do not invent the missing four; research them first.**

> _Corrected 2026-08-19: an earlier version of this line named Discover and Design as unresearched. They are done. The open ones are Plan, Ship, Learn and Brain._

---

## 5. Process rulings from this review

1. **The wireframe is not canon.** Repeated here because it is the ruling most likely to be forgotten: nothing is built by copying it.
2. **Reuse what already works.** Where the shipped product already does something well, keep it. This is a revision, not a clean sheet, and the 2026-07 rebuild failed by deleting in one move.
3. **Evaluate continuously from four lenses:** the user's, colour and contrast, the experience of operating it, and the experience of an agent working inside it.
4. **Meridian first, always.** Use the shipped components. Extend the system where a genuine gap exists and document the extension. Never reach past it.

---

## 6. Where this work happens

**Ruled 2026-08-19, and it overrules the proposal to build on a long-lived copy of `main`.**

The proposal was to branch `main`, let both agents build there, and merge or retire `main` once approved. **The code can be branched. The database cannot**, and that asymmetry breaks it:

- There is **one Supabase instance**, and migrations applied through Lovable are **live immediately**. So a long-lived branch either applies its migrations to the database `main` is running on, in which case `main` was never protected, or does not apply them, in which case the branch cannot run.
- **Lovable deploys from `main`.** A branch cannot be published, so nobody can look at it, and looking at it is law 5.
- **`main` moves on its own.** Lovable's bot commits and applies migrations, so a long-lived branch accrues merge debt against a moving target.
- **Replacing `main` has an incident report.** On 2026-07-27 it orphaned 4,124 commits; a `pre-push` hook now blocks it. **`main` is never retired or replaced.**

**Instead: additive on `main`, at new routes, behind a flag.** Existing routes stay byte-identical for anyone without the flag, the work is deployable and therefore reviewable, retiring old surfaces becomes a series of small revertible deletions, and there is no merge debt. The `feature_flags` table already exists and holds zero rows, so this is a wiring job rather than a new system.

---

## Related

- [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) — the contract, including §2a on illustration
- [`REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md) — where each surface's reference research is appended
- [`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md) — the component map against beautifui.dev
- [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md) — the direction and its evidence
