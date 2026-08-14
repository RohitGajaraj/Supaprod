# The design system

> _Created: 2026-08-03 · Last updated: 2026-08-14_

> ## ⚠️ SUPERSEDED IN PART, 2026-08-14. READ THIS BEFORE THE REST OF THE FILE.
>
> The founder retired **every** prior design system on 2026-08-14, this one included, and
> instructed that the platform be designed from the product rather than inherited from its own
> history. The named lineage he retired: v1, v2, v3, Obsidian, Tempo, and Cadence/ink.
>
> **The current system is Meridian: [`../../src/styles/meridian.css`](../../src/styles/meridian.css).**
> Its header carries the reasoning, the scene that decided the ground, and the colour rule. Read it
> before building anything.
>
> **What Meridian replaces in this file:** the token layer. Every `--sp-*` reference below, the
> `ink.css` / `primitives.css` / `shell.css` stack, and the "we are past the reskin" paragraph.
> `--sp-*` is now **life support**, not a contract: 32 route files still render through it and
> deleting it in one move would break every surface at once, which is exactly how the 2026-07
> rebuild failed. So: no new surface may use it, every migrated surface drops it, and the layer is
> deleted when the last one moves. **Never extend it.**
>
> **What in this file still binds,** because it is a founder ruling about judgement rather than
> about tokens:
> - The **ratchet**: no change may make a surface worse to satisfy an instruction.
> - The **standard**: the states nobody screenshots are composed, not merely handled.
> - **Colour carries status, never decorates**, and must survive a greyscale test.
> - **Look at it before you ship it.** Both rejected button designs were reasoned from tokens and
>   neither was ever rendered.
> - The **Engine-Room doctrine** and **humanized output**.
> - The **open UX backlog** below, which is still largely undelivered.
> - **Copy the proven pattern per surface**, and file the research in
>   [`REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md) in the same session. The 19-component
>   agentic reference library captured on 2026-08-14 is filed there, with its source and licence.
>
> The rest of this file is kept because the *reasons* recorded in it are expensive and still true.
> Read it as the record of how we got here, not as the contract for what to build next.

**This was the design contract from 2026-08-03 until 2026-08-14.** It replaced `DESIGN.md` (Ember), `DESIGN-OBSIDIAN.md` (v3), `DESIGN-LOOM.md` (v4) and `DESIGN-TEMPO.md` (v5 Tempo). All four are retired history, kept in [`archive/`](./archive/) for reference only. **Never build from them, and never cite them as authority.**

---

## Why those four are dead

On **2026-07-28** the founder ruled the authenticated app rebuilt from zero and revoked every existing design constraint. He had abandoned a demo recording rather than screen-share the app.

The diagnosis was not taste. The build was running **two complete app shells at once**, chosen by a hardcoded pathname allowlist in `src/routes/_authenticated.tsx`: ~68 routes rendered the retired Obsidian rail, 7 rendered the newer ink room. Underneath sat five design systems, four Buttons, three `VerdictChip`s, and three copies of the loop model, with no shared table or skeleton.

On **2026-07-29** he reviewed four fresh authored directions and rejected all four:

> "We have built all four directions only from the perspective of **assembling things**, not really thought through from a **user lens**." … "It looks like absolutely a designed one, which if I ask an AI to vibe code and design something, that is how we would do it."

**The reusable lesson: parallelism does not buy a user lens.** Four directions in parallel produced four competent assemblies with no point of view. Start from a person doing a real task, walk their whole session, and let the composition fall out of that, taken to a high finish in **one** direction.

Full record with verbatim quotes: [`../planning/rebuild-2026-07/FOUNDER-VERDICT-2026-07-29.md`](../planning/rebuild-2026-07/FOUNDER-VERDICT-2026-07-29.md).

---

## The baseline is what is shipped

**Read the code before you design anything.** The vocabulary is not in a document, it is in the app.

| Layer | File | What it is |
| --- | --- | --- |
| **Tokens** | `src/styles/ink.css` | 146 `--sp-*` definitions. The single source of colour, space, type, motion. |
| **Primitives** | `src/styles/primitives.css` | The styles behind the shell primitives. |
| **Shell** | `src/styles/shell.css` | The app frame, rail, panes, sheets. |
| **Components** | `src/components/shell/primitives.tsx` | 37 exports: `Block` `Row` `Grid` `Cell` `Gate` `Button` `Value` `Field` `Loading` `Surface` `Empty` `Failed` `PageHead` `Door` `Receipt` `Record` `Diffstat` `Num` and the rest. |

**Compose from these primitives.** A surface that reaches for a raw `<div>` with hand-written colour is doing it wrong. `--sp-*` is the only namespace to write.

### The legacy layer, and how to treat it

`src/styles.css` is a **123 KB root stylesheet** holding 633 `--ds-*` tokens, consumed by the 49 shadcn files in `src/components/ui/`. It is the Tempo-era layer. It still runs, so do not rip it out, but:

- **Never add a new `--ds-*` token.**
- **Never style a new app surface from `--ds-*`.** New work uses `--sp-*` and the shell primitives.
- Touching a `src/components/ui/` file is fine; porting a whole surface onto it is a regression.

> **Trap:** `src/styles.css` is a *file*, and `src/styles/` is a *directory*. Both exist. Grepping only `src/styles/` misses the 123 KB root sheet and falsely reports tokens as dead.

---

## The founder's live rulings

These outrank anything written earlier.

**Colour.** Monochrome by default: black, grey, white, slate, silver, on a pure dark ground. **Ember is rare** and explicitly not the default for approval buttons, actions or tasks. **Blue means agents running. Green and red mean status** (diffs, counts, tick marks). Starfield and ink stay subtle by default, prominent only where earned.

Colour must **carry status, never decorate**, and never add cognitive load. It must survive a greyscale test: if the screen stops making sense in greyscale, the colour was doing work that structure should have done.

**Buttons: the primary is a solid face on the neutral ladder** (founder ruling, 2026-08-06, given on a screenshot of `/today`). Two designs were rejected in one evening, and they were rejected for the same reason, so the reason is the rule.

| Rejected | What it was | Why it went |
| --- | --- | --- |
| **The white slab** | `background: var(--sp-ink)` on the dark canvas, a raw ink inversion | "There is nothing like a white button within our platform." It rendered brighter than the headline above it and belonged to no palette in the product. |
| **The ember edge** | `--sp-lift` face wearing a partial-ember inset ring and a soft halo | "A subtle ember color on the borders. It's not so great. It is not aligning with the theme." The fill was still the *secondary* fill, so a thin warm line was the only thing separating the main action from its neighbours, and a thin warm line is not an affordance. It also spent the product's one accent on chrome. |

Both tried to make the primary special by **adding a property**: a different fill family, then a different edge family. This theme's separation mechanism is neither. It is **value on a single neutral ramp**, which is how every card, recess and float already distinguishes itself. So the primary is simply the next stop on the ladder the surfaces already climb:

`--sp-bg` → `--sp-sink` → `--sp-sheet` → `--sp-lift` → `--sp-float` → **`--sp-solid`**

Nothing else in the product uses that stop. A secondary button is `--sp-lift`, so the primary is unmistakably the raised one without an accent, a glow or a second vocabulary. Each theme steps **away from its own canvas**: lighter on the dark target, inked on paper. The founder's brief was "something simple, but still feels like a button", and simple here means it needed no new colour idea at all.

Two consequences worth keeping:

- **Ember stays a colour or an edge, never a fill, and never on a button.** `ink.css` declares it the mark that "marks the human, and nothing else". The ember-fill `.btn-pill` and the ember-gradient `.btn-primary` are the *retired* palette; inside the authenticated app they are a defect, and both were ported out on 2026-08-06. On unauthenticated marketing and auth surfaces `.btn-primary` remains correct, because restyling the signup and login heroes is a funnel change and not a cleanup.
- **`.btn-pill-outline` went too, and for a different reason worth remembering.** An outline is not a fill, so it was never the colour defect and the first sweep correctly left it alone. It had to go because of what that sweep did *to* it: the converted halves stood at 38px and their Cancel and Discard partners stayed at roughly 26px, so four pairs on `/plan/spec/$id` ended up visibly mismatched. **Porting one half of a pair is not finishing the job.** All 14 sites moved: the four escape hatches to `variant="ghost"`, the ten real alternative actions to the raised default.
- **A filled control cannot be disabled by opacity alone.** Every other button fades figure and ground together so the ratio survives. The primary is the one control whose face and label sit at opposite ends of the ramp, so fading both collapses them into one mid-tone and the label goes with it. Rendered on paper it was a taupe slab with a ghost of a word on it. A disabled primary therefore drops to the ordinary quiet surface, which is also the honest reading: a primary that cannot be pressed is not the main action right now.

> **Look at it before you ship it.** Both rejected designs were reasoned from tokens and neither was ever rendered. The third was screenshotted in both themes before it was offered, and that is the only reason the broken disabled state on paper was caught rather than shipped.

**Type.** Geist Sans for UI, Geist Mono for technical content. The bar for a typeface inside the product is whether it reads as an enterprise instrument.

**Geist Pixel is retired from the APP and kept for MARKETING** (founder ruling, 2026-08-05). The split is by audience, not by taste:

| Surface | Face | Why |
| --- | --- | --- |
| Authenticated app, every station | Geist Sans / Geist Mono | It is an instrument someone works in all day. Pixel is costume there. |
| Public marketing: `/`, `/demo`, `/p/teardown`, `/brief`, `/investors` | **Geist Pixel allowed on hero moments** | These are a brand first impression, not a workspace. Pixel is the yellow hero face and it is doing its job. |

> **This paragraph used to say Pixel was retired "including from hero moments" and that the `.woff2` files "are unused". Both were false.** The files are used in roughly thirty places and Pixel renders on all three public heroes in production. The doc was audited against the running site on 2026-08-05 and corrected rather than the code being changed to match a stale sentence. If you are about to "fix" a Pixel hero on a marketing page, do not: that is the ruling, not a defect.

**Layout.** Ask lives **top right** and opens a pane; the bottom composer strip is rejected. Cards on a landing surface are **one or two lines**, with depth a click away. Compact with breathing space, never cramped. The rail collapses to icons, expanding to one line of label.

---

## Two governing laws

### 1. The ratchet: today's design is the floor

**No change may make a surface worse in order to satisfy an instruction** (founder ruling 2026-08-01):

> "That doesn't mean you need to compromise on the look and feel… Don't just compress and shrink it and make it worse. Your baseline is what we have today. You need to enhance it on top of that."

"Reduce the vertical scroll", "tighten this", "fit more in" are requests for a **better** surface, never a smaller one. Shrinking type, stripping padding, capping heights, hiding information or dropping a state to save rows is **forbidden** as an answer. The allowed moves are structural: use the horizontal axis, collapse what nobody reads, escape the 74ch measure for non-prose, delete genuine duplication.

The test before committing: **would someone who liked yesterday's screen prefer today's?**

### 2. The standard: Stripe, Google, Anthropic, at enterprise B2B scale

The states nobody screenshots (empty, partial, failed, denied, very long, very short, slow) are each **composed**, not merely handled.

And: **we are past the reskin.** The `--sp-*` system is the built thing and work is now fine touches on top of it. Reaching for a new visual language on a surface that already has one is itself a ratchet regression.

Mechanics (one page scroller, `@container` not `@media` inside a pane, fit-to-content heights, the wait, agent indicators): [`../conventions/surface-discipline.md`](../conventions/surface-discipline.md). **These are enforced by `src/__tests__/surface-discipline.test.ts`**, which was proven to fail by planting the defect rather than only proven to pass, so it binds tomorrow's code and not only today's.

---

## Copy the proven pattern, per surface

Standing rule (2026-08-01): for each surface, **research the best proven product in that category and lift its information model and verbs outright**, even close to literally. Originality is not the goal; an experience customers already know and love is. Name the reference before building, then express it in our shipped primitives and voice.

| Surface | Lift from |
| --- | --- |
| Build | Cursor, Claude Code (including the diff view) |
| Design | Figma's fidelity ladder |
| Discover | Sentry's issue stream + Linear's triage inbox |

Every research pass is appended to [`REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md) **in the same session**, so the same research is never paid for twice. Read it before starting a new one.

---

## The open UX backlog (founder brief, 2026-08-01)

Largely **not yet delivered**. Fold these into feature work rather than running them as a separate pass. Ordered by his own emphasis:

1. **Live agent status.** He called it "the only core USP of our platform". `AgentPulse` exists (`src/components/shell/AgentPulse.tsx`), but it is wired into `TrackActivity` only. He asked for it **across every surface and every depth**, plus the per-action detail: which file, which line, what moved to memory. 64 files use `<Loading>`; the ones where an agent genuinely runs need `working`, and **the rest must not have it, or the indicator becomes a lie**.
2. **The Build terminal.** Expanding a touched file opens something he cannot locate, with unexplained blank space above it. It should sit inline or side by side with the file being touched and change with the selection. Reference to lift: Claude Code's own diff view.
3. **Status colour everywhere**, not just the headline number. Red and green for lines added and deleted wherever they appear; colour on connected dots, threads and mission ids.
4. **Unique shapes** for missions and cards. Not square, circle or triangle. Distinctive on a monotone ground, premium, and specifically not force-fitted.
5. **Space and scroll discipline** across all seven stations.
6. **Left rail auto-collapse** once the 01-07 spine is familiar, with instant hover tooltips.
7. **Perceived speed.** Fix the latency, not just the spinner.

Standing quality bar from the same brief: *"premium feel and premium experience, but at the same time do not feel like a force-fitting one"*, and a quick glance must not put cognitive load on the human to work out what something is and why it is like that.

---

## Two doctrines that survive every design change

**The Engine-Room doctrine.** Complexity lives in the engine, never in the experience. The user meets the *output* of the machine, never the machine. All observability, governance and internal machinery lives behind one recessed Engine Room door, revealed on demand. Labels name the **outcome**, not the mechanism. Every new surface runs the Engine-Room Test ("would a smart non-technical person feel this is for them?") and carries a greppable `Engine-Room:` line. Body: [`../conventions/engine-room-doctrine.md`](../conventions/engine-room-doctrine.md).

**Humanized output.** No em or en dashes, no invisible Unicode, no AI-cliché phrasing in UI copy, in source, or in anything the platform generates for a user. The runtime sanitizer at the AI chokepoint is the hard gate. Markdown docs are exempt. Body: [`../conventions/humanized-output.md`](../conventions/humanized-output.md), UI application: [`../conventions/ui-voice.md`](../conventions/ui-voice.md).

---

## Working with the founder

Observed and self-described: **he refines by seeing, not by specifying.** Ship a faithful attempt fast, then expect two or three taste passes. He reviews element by element and expects every item in a feedback batch closed or explicitly declined. He invites pushback but wants **a recommendation, not a survey**.

Prior attempts failed at **dispatch, not design**: 28 mockups and 13 work-order packets were authored and only 2 of 11 lanes ever ran. Produce code, not more documents.

---

## Related

- [`README.md`](./README.md), the station audits (unverified agent output, read its provenance warning)
- [`REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md), verified research with source URLs
- [`SEVEN-STATIONS-BLUEPRINT.md`](./SEVEN-STATIONS-BLUEPRINT.md)
- [`../conventions/design-anatomy.md`](../conventions/design-anatomy.md), card and detail-view anatomy, the trace-ref registry
- [`archive/`](./archive/), the four retired contracts
