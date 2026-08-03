# The design system

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**This is the current design contract for every Supaprod surface.** It replaces `DESIGN.md` (Ember), `DESIGN-OBSIDIAN.md` (v3), `DESIGN-LOOM.md` (v4) and `DESIGN-TEMPO.md` (v5 Tempo). All four are retired history, kept in [`archive/`](./archive/) for reference only. **Never build from them, and never cite them as authority.**

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

**Type.** **Geist Pixel is retired**, including from hero moments. Geist Sans for UI, Geist Mono for technical content. The bar for a typeface is whether it reads as an enterprise instrument. (The Pixel `.woff2` files remain in `public/fonts/geist/` and are unused; leave them, they are cheap and the licence is bundled.)

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
