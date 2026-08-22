# The premium pass, 2026-08-22

> _Created: 2026-08-22 · Last updated: 2026-08-22_

> _Run under the founder's ruling of this session, which overrides the standing 2026-06-18
> "design pass is LAST": **"make the platform premium, ultra-premium, at the same time a more
> effective and working platform… loved by millions and billions of users and also by agents."**
> And: **"Meridian + Beautiful UI.dev are the baseline, not the ceiling."**_
>
> The contract is [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md). The system is
> [`../../src/styles/meridian.css`](../../src/styles/meridian.css). Numbers about Meridian in this
> file were taken from that stylesheet or from a live browser, never from a document about it.

**The question this pass was pointed at: when an agent is working, what does a person see, and does
it feel expensive or does it feel like a spinner?**

The short answer is that it feels like a very well-argued spinner, and the reason is not that anyone
chose badly. It is that the system has exactly one present-tense word for the machine and no other
word for it at all, so every surface that wants to say something about the crew either says "working
now" or says nothing. Three quarters of what a person meets is the second case.

---

## What could be seen, and what could not

The dev server on `localhost:8080` served **authenticated surfaces without any sign-in**. Navigating
to `/` redirected straight into `/today` with a live workspace ("Helio Labs / Relay", 14 decisions,
16 agents). No credential was entered and none was attempted. That is worth recording as a fact
about this environment rather than as a convenience: **anyone who runs `bun run dev` on this machine
is inside the product.**

| Surface | Seen | Note |
| --- | --- | --- |
| `/today` | yes | the live workspace, dark and paper |
| `/crew` | yes | 16 agents |
| `/runs` | yes | renders the heading "Build"; the run list sat at "Reading the record." |
| `/meridian` | yes | the full gallery, 1,283 `[data-mrd]` roots, both grounds |
| `/pricing` `/demo` `/security` `/product` | yes | measured, screenshotted |
| `/proof` | **no** | returns **HTTP 500** |
| Everything behind a real workspace switch, admin, a live run mid-flight | **no** | nothing was running during the session, so the working state could only be seen in the gallery |

**The single most important thing that could not be seen: an agent actually working in the product.**
Every screenshot of the working state in this file comes from the gallery's fixtures. The gallery is
honest about being fixtures, but it means no claim here about how the working state feels *in situ*
is first-hand.

**Mobbin did not authenticate.** `mcp__mobbin__authenticate` returned an OAuth URL that has to be
opened in a browser by the founder. There is no way to complete that from here, so it was dropped
rather than retried, per the brief. beautifui.dev was not re-extracted either: the existing
extraction in [`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md) is from that page's
own flight payload with the byte counts recorded, which is a better source than anything a second
pass would have produced today, and it already answers the components this pass touched.

---

## The measurements

### 1. The machine has one word, and it is present tense

| Status role | Occurrences in `src/**` (raw + utility) | Route files using it |
| --- | --- | --- |
| `--mrd-you` | 89 raw · 116 utility | 4 |
| `--mrd-fail` | 68 raw · 127 utility | — |
| `--mrd-pass` | 57 raw · 80 utility | — |
| `--mrd-hold` | 45 raw · 65 utility | — |
| **`--mrd-agent`** | **44 raw · 66 utility** | **0** |

Counts include each role's `-dim` and `-chip` variants, so the five are compared on the same basis.
Not one route file in the product paints the agent hue. Every use of it is inside a component, and
the components that use it most are the two lattices.

**And the imbalance is not a mistake to correct by painting more things azure.** `/crew` is the page
whose entire subject is the machine — "16 agents work here", sixteen cards, three sections — and its
body is entirely monochrome. The only hue anywhere on that screen is in the station strip the shell
draws above it, and all of it is orchid or red: "88 runs waiting on you", "2 failed". That is
*correct* under law 3: `--mrd-agent` means a machine **is working**, present tense, and none of those
sixteen were. Painting a resting agent azure is the lie the honesty rule exists to stop.

So the gap is real and it is one level below where it looks. **Meridian can say "a machine is working
right now". It has no way to say "this is your machine, this is what it is for, this is what it did
last week."** Every surface about the crew therefore renders in the same greys as a settings page,
and a product whose premise is a crew looks, at rest, like a form.

### 2. What a person actually sees while an agent works

The whole vocabulary, measured on the gallery: a 14px three-by-three pixel lattice tinted azure, a
rotating gerund with a highlight travelling through it, an optional noun, an optional elapsed figure.
About 250px wide, on a 1,512px screen, and every one of the four rows on the panel is that same row.

It is a good row. `AgentPulse`'s own header argues every part of it and the arguments hold: no
percentage because we do not know the percentage, one word because a sentence asks to be read, no
`working` boolean because a prop that can be handed the wrong fact will be. **Nothing in it should
change.** The premium gap is not inside that row, it is that the row is the whole answer.

The two components that would make it not the whole answer are already built:

| Built | Lines | Renders |
| --- | --- | --- |
| `ToolStream` | 394 | gallery only |
| `RunTimeline` | 437 | gallery only |

[`MERIDIAN-INVENTORY.md`](./MERIDIAN-INVENTORY.md) already records why, and it is worth restating
here because it changes what this pass should recommend: `ToolStream` is **blocked on a transport,
not on a surface**. `api/chat.ts` closes its controller before the mission runs, so a `tool` frame
for mission work can never arrive on that stream. **The design work for deep agent visibility is
done. What is missing is a second transport.** Another design pass will not produce it, and a design
pass that pretends otherwise will produce a fifteenth component nobody can reach.

### 3. The concurrency of the crew is computed and shown only to screen readers

`src/components/shell/CrewWorking.tsx` reads every mission mid-run, takes `shown[0]` as the lead, and
computes `others = shown.length - 1`. That count goes into `label`, which `AgentPulse` renders inside
`<span className="sr-only">`. The visible output is the lead agent and nothing else.

**With five agents working, a sighted reader sees exactly the pixels they would see with one.** That
is information the surface already holds being dropped from the surface, which ratchet law 1 forbids.

It is not a Meridian gap and needs no new part: `CrewWorking` already passes `detail={lead.title}`,
and `detail` takes a `ReactNode`. `detail={<>{lead.title} · and {others} more</>}` closes it. The file
is outside this lane, so it is filed here rather than changed.

### 4. Motion: the system names three one-shot durations and no period

Meridian's motion scale is `--mrd-d-press` 120ms, `--mrd-d-move` 140ms, `--mrd-d-enter` 420ms. All
three are one-shot. **None of them names a repeating cadence**, which is the motion this product
needs most, because its premise is that a machine keeps working while somebody watches.

What that absence cost, counted on 2026-08-22:

| Literal | Files | Values in use |
| --- | --- | --- |
| `mrd-shimmer 1.4s linear infinite` | **5**, character for character | one |
| `mrd-pixel-on` | 6 | **650ms · 900ms · 1.1s · 1.6s · 2s** |
| `mrd-fade-up` / `-in` / `-pop-in`, hand-written duration, inside `src/components/meridian` alone | 15 | **160 · 180 · 200 · 250 · 300 ×5 · 320 · 350 ×2 · 450** |
| `cubic-bezier(0.23, 1, 0.32, 1)`, a drifted near-copy of `--mrd-ease` | 6 | one |

`--mrd-d-enter` has seven callers. Fifteen sites inside the design system's own folder write a
different number for the same three keyframes. **Restraint is most of what reads as expensive**, and
that is `AgentPulse`'s own sentence; an arrival that happens at nine speeds is the opposite of it.

### 5. The reduced-motion state of the working mark, which nobody had rendered

This is the defect of the pass, and it was found by measuring the reduced-motion rule instead of
reading it.

The rule stops animation by setting `animation-duration: 1ms; animation-iteration-count: 1`. No
keyframe declares a fill mode, so when that one iteration ends the element reverts to **its own
resting style**. Six of the eight callers set no resting opacity and revert to 1, correctly, and
their own comments say so.

The two that do set one are the pixel lattice. A lattice cell carries an inline `opacity: 0.15` —
the **trough** of `mrd-pixel-on`, the value it sits at between flashes. Stopping the animation parked
every cell at the bottom of its own envelope.

Measured in a live browser, composited through a canvas against each ground:

| | dark | paper |
| --- | --- | --- |
| agent lattice, animating (peak) | 7.02 | 5.62 |
| **agent lattice, reduced motion** | **1.19** | **1.24** |
| **ink lattice, reduced motion** | **1.43** | **1.36** |

**1.19 is the number this system's own contract records as the catastrophe it caught by rendering
rather than by reasoning** (law 5, the primary button on paper). Same shape, same direction: a value
that is correct while something else is true, and invisible once it is not.

Verified rather than inferred. Under `emulateMedia({ reducedMotion: 'reduce' })` all **128** lattice
cells on the gallery reported `getAnimations() == []` and `opacity: 0.15`.

The word survived, so this was never a total loss of the fact. But the mark that carries
`--mrd-agent` — which `AgentPulse`'s header names as the token's canonical use, the one surface in
the product that says a machine is working — was rendering as a dim grey square with no hue in it at
all, for every reader who has reduced motion on.

### 6. The shop window is not built from the design system

The contract's first line is "there is no surface exempt from it." Measured in a live browser, with
`/meridian` and `/today` as controls:

| Route | `[data-mrd]` roots | elements carrying a `mrd-` class | elements carrying a retired `sp-` class |
| --- | --- | --- | --- |
| `/meridian` (control) | 1,283 | 6,406 | 48 |
| `/today` (control) | 8 | 19 | **51** |
| `/pricing` | **0** | **0** | 0 |
| `/security` | **0** | **0** | 0 |
| `/product` | **0** | **0** | 0 |

`meridian.css` is loaded on all of them — `--mrd-bg` resolves — and nothing uses it. The public
routes are a separate visual system that happens to share a domain, and `/today`, the surface a
working reader opens first, carries more retired classes than Meridian ones.

This is not a taste finding and it is not this pass's to fix, but it is the largest single answer to
"does it feel expensive": **the first thing anyone sees was not built from the system the product's
quality argument rests on.**

---

## What shipped

Three changes, all inside the lane, all rendered and measured in both grounds before being called
done. `bunx tsc --noEmit` clean.

### A. The working mark survives the stop

`src/styles/meridian.css`, reduced-motion block.

```css
[style*="mrd-pixel-on"] { opacity: 1 !important; }
```

The mark now stops at its **peak** rather than at its trough. Nothing moves, and the fact that a
machine is working is still on the screen, which is that block's own stated rule: decoration stops,
information does not.

It moves only the lattice, and that is a property of the selector rather than a claim. The six
callers with no resting opacity already computed to 1. `LoadingState`'s dead cells — the ones that
give the chevron and the orbit their shape — are excluded for free, because their inline `animation`
is the string `none` and the attribute selector never matches them.

**Verified after:** 124 lattice cells at `opacity: 1`, the 2 dead cells still at `0.07`, in both
grounds. Screenshots: `docs/screenshots/premium-pass/06-reduced-motion-{dark,light}.png` before,
`07-reduced-motion-AFTER.png` and `08-loading-reduced-AFTER.png` after.

### B. The word stops somewhere deliberate

Same block, found while looking at A.

```css
[style*="mrd-shimmer"] { background-position: 50% 0 !important; }
```

The shimmer drives `background-position` across a label painted `text-transparent` with
`bg-clip-text`. Reverting to position `0` put the gradient's bright stop at 100% of the word:
"Reading the record" rendered quiet for two thirds and then brightened into its last syllable, in
both grounds. A highlight hard against one edge of a word reads as a rendering fault, which is the
worst thing a resting state can do.

`50% 0` centres the image, so all three gradient stops fall inside the window and the highlight sits
in the middle of the word. That is the animation's own midpoint held still.

**Flattening it to one colour was considered and rejected**: only the component knows which colour is
honest. `LoadingState` shimmers toward ink because it reports a job; `AgentPulse` shimmers toward
azure because it reports an agent. One stylesheet rule cannot tell them apart, and holding the
gradient keeps each component's meaning without this file guessing.

**Verified after:** 22 shimmer elements, all reporting `background-position: 50% 0px` under reduced
motion, and still one running animation at `1.4s` without it. Screenshot:
`09-shimmer-rest-AFTER.png`.

### C. `--mrd-d-alive: 1400ms`, and the easing that had drifted

**The token.** How long one pass of "still going" takes across a label. It did not earn its place on
a second caller, it earned it on a fifth: the literal `mrd-shimmer 1.4s linear infinite`, character
for character, in `LoadingState`, `AgentPulse`, `Thinking`, `FineTuneCard` and `SelectionActions`.
Five files agreeing on a number by copying it is five chances to disagree later.

It names exactly one thing and the file says so, because over-claiming here would be worse than no
token: this is the period of the highlight that travels through a **label**. The **marks** beside
those labels run at 650ms, 900ms, 1.1s, 1.6s and 2s, each argued at its own call site, and that
spread is recorded above rather than resolved by this token.

The value does not move. 1400ms is what all five already ship, so this changes no pixel today.

**Both grounds.** It is declared once, in `:root`, and deliberately **not** restated under
`[data-theme="light"]`. That is not an oversight and it is the opposite of the "defined only in dark"
defect: the paper block's own header says *"Type, space, radius and motion never change with the
ground; a layout that shifts on a theme toggle is a bug."* Checked rather than assumed — the light
block redefines **58** tokens and every one of them is a colour or a shadow; no `--mrd-d-*`,
`--mrd-s*`, `--mrd-t-*` or `--mrd-r-*` appears there. Verified in a live browser: `--mrd-d-alive`
resolves to `1.4s` with the root at dark and `1.4s` with the root at `data-theme="light"`, and the
applied `animationDuration` on a real shimmer element is `1.4s`.

**The easing.** Six sites inside `src/components/meridian` hand-wrote `cubic-bezier(0.23, 1, 0.32, 1)`
— a near-copy of `--mrd-ease`, which is `cubic-bezier(0.22, 1, 0.36, 1)`. Both are easeOutQuint from
different published lists. The curve appears nowhere in this folder's research, so it is an
undocumented duplicate rather than a ported mechanic, and it is exactly the shape this stylesheet
names as the failure it exists to prevent: one idea, two literals, and they drift the first time
anybody changes one. Folded onto the token in `DiffTable`, `Thinking` (×4) and `CodeBlock`. The
visual delta between the two curves is sub-perceptual; the point is that `--mrd-ease` now means
something.

`SelectionActions.tsx:382` keeps its longhand and is correct to: it is a Web Animations API call, and
`var()` in a WAAPI easing string is silently ignored rather than resolved. Its own comment says so.

**Files changed:** `src/styles/meridian.css`, and under `src/components/meridian/`:
`LoadingState.tsx`, `AgentPulse.tsx`, `Thinking.tsx`, `FineTuneCard.tsx`, `SelectionActions.tsx`,
`CodeBlock.tsx`, `DiffTable.tsx`.

---

## What is proposed and was not shipped

Each of these is argued rather than built, and the reason is given, because a change that cannot be
seen rendered is a change to argue for and not to ship.

### 1. Converge the arrival durations onto `--mrd-d-enter`

Fifteen hand-written durations in eight values, inside the design system's own folder, for the three
arrival keyframes. `--mrd-d-enter` already exists, is already 420ms, and its header already contains
the argument for why an arrival keeps a duration where a reveal does not.

Not shipped because it changes fifteen rendered behaviours the founder has not compared side by side,
and he refines by seeing. The recommendation is two stops and no more: **`--mrd-d-enter` for an
arrival** (a row joining a list, a card landing, a line resolving) and **nothing at all for a reveal**
(a dialog, a menu, a popover), which is what the stylesheet already argues. `Dialog.tsx`'s 160ms and
180ms are reveals and should lose their entrance entirely rather than be retuned; the other thirteen
are arrivals and should take the token.

### 2. A word for the machine that is not present tense

The finding in §1 above. `/crew` is grey because the only word Meridian has for the machine is a
status, and a resting agent has no honest claim on it.

What is missing is not a sixth status colour — the refusal of one is correct and should stand. It is
that **identity is shape** (law 4) and the crew has no shapes. Sixteen agents render as sixteen
identical rounded rectangles with a station glyph borrowed from the station they stand at, so nothing
on that page distinguishes Watch from Research except a word.

The move that fits the laws: give the crew a **mark of its own** in the monoline vocabulary
`station-glyphs.tsx` already uses, identifying the agent by shape while hue stays reserved for what it
is doing right now. That is a real piece of design work with a real surface waiting for it, and it is
the thing this pass would do next.

### 3. Take up the illustration allowance, which is three days old and unused

The founder lifted the illustration ban on 2026-08-19 and the ruling is written into law 2a and into
`surface-parts.tsx`. **Nothing has used it.** Searched the tree: three components mention it, and all
three are declining it — `StalledWork`, `AgentInbox` and `AskPane` each argue, correctly for their own
case, that their empty state should be silence.

They are right individually and the aggregate is wrong: a permission granted and never exercised is a
permission that will be forgotten and re-litigated. The honest first use is the one the ruling
describes almost word for word — the loop at rest, drawn in the same stroke weight and round caps, on
a surface where nothing is running. That cannot assert activity the workspace does not have, because
what it draws is the absence of it.

Not shipped because the surfaces that need it are outside this lane, and adding a fifteenth component
that renders only in the gallery would make the inventory's own headline finding worse.

### 4. Two things outside this lane, filed so they are not lost

- **`CrewWorking` drops the crew's concurrency** (§3 above). One-line fix, given.
- **`CrewWorking` reaches into the retired layer for its typography.** It uses `.sp-line-sub` for the
  planner's sentence, and its own comment explains why: it is the one second-line style in the system
  with a prose measure on it (56ch), and Meridian has no counterpart. That is a gap in Meridian named
  by a component that had nowhere else to go, which is the exact case the 2026-08-15 standing ruling
  covers. The token or part is owed.
- **`/proof` returns HTTP 500.** Not a design finding, but it is a public route.

---

## What was deliberately not touched

- **`agent-first-platform.md` §7.1.** Superseded, and its two corrections to Meridian were falsified
  by measurement. Body weight 450 is wrong; `getComputedStyle` on the reference returns 400.
  `--mrd-d-move` is already 140ms. `--mrd-d-enter` deliberately stays 420ms because all its callers
  are arrivals. Every number in this file came from `meridian.css` or from a browser.
- **`AgentPulse`'s composition.** Every part of it is argued in its own header and the arguments
  hold. The only change made to it was substituting a token for a literal it already shipped.
- **A sixth status colour.** Refused, and the refusal is correct.
- **Anything that shows less.** No type was shrunk, no height capped, no state removed. The two
  behaviour changes both make something visible that was not.

## Gates

Each run as its own command with its own exit code, never piped into `tail`.

| Gate | Exit | Result |
| --- | --- | --- |
| `bunx tsc --noEmit` | 0 | clean |
| `bun test` | 0 | **10,429 pass · 0 fail** · 23 skip · 60 todo, 613 files |
| `bun run docs:check` | 0 | clean of hard rot; the new doc is linked and carries its date header |
| `bun run design:ratchet` | 0 | **before 3,176 / 222 files · after 3,176 / 222 files**, baseline file unchanged |

The tree is shared with other lanes mid-flight, so that green covers their uncommitted work as well
as this pass's. Nothing here touched theirs.

All seven files touched carry **no** entry in `meridian-ratchet.baseline.json`, so they are clean
files held to rule 1. Nothing added is a retired token or a raw colour: the changes are one duration,
one opacity, one background-position and seven substitutions of an existing token for a literal.

## Related

- [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) — the contract and the five laws
- [`MERIDIAN-INVENTORY.md`](./MERIDIAN-INVENTORY.md) — what is built and what renders it
- [`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md) — the map against beautifui.dev
- [`REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md) — verified research with source URLs
