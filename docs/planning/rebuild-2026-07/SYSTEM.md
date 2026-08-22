# The system, as built

> **STALE, 2026-08-22.** Written 2026-07-29. It describes Cadence/ink as "the design system that now exists in code". That system was retired 2026-08-14. The design system is **Meridian** and there is no other one — contract [`DESIGN-SYSTEM.md`](../../design/DESIGN-SYSTEM.md), system `src/styles/meridian.css`, components `src/components/meridian/`. v1 Ember, v3 Obsidian, v4 Loom, v5 Tempo and Cadence/ink were all retired 2026-08-14 and the retirement is enforced by `src/__tests__/meridian-ratchet.test.ts`.


> 2026-07-29. The reference for the design system that now exists in code. Written because the
> sweep kept re-deriving the same answers, and because a system nobody can look up is a set of
> conventions waiting to drift.
>
> **This describes what IS. The rules it obeys live elsewhere and outrank it:**
> [`SURFACE-JUSTIFICATION.md`](./SURFACE-JUSTIFICATION.md) (what earns a place on a surface),
> [`FOUNDER-VERDICT-2026-07-29.md`](./FOUNDER-VERDICT-2026-07-29.md) (the rulings),
> [`agents/FINAL-agent-presence.md`](./agents/FINAL-agent-presence.md) (the crew),
> [`../../conventions/anti-slop.md`](../../conventions/anti-slop.md) (what not to draw).

## Where it lives

| --- | --- |
| --- | --- |
| `src/styles/ink.css` | 146 `--sp-*` tokens, dark on `:root`, light on `[data-theme="light"]`. Below a fence: the legacy `--ink-*`/`--voice-*` layer, kept until its call sites are gone. |
| `src/styles/shell.css` | the four shell regions |
| `src/styles/primitives.css` | what every primitive renders as |
| `src/components/shell/primitives.tsx` | 28 components |
| `src/components/shell/agent-glyphs.tsx` | 13 agent silhouettes + the stage-hue resolver |
| `src/components/shell/AppFrame.tsx` | the one shell |

**Why `--sp-` and not the prototype's bare names.** `--ink`, `--hover`, `--ease` and
`--radius-panel` are already defined in `styles.css`, which wins the cascade because `ink.css` is
`@import`ed first, and the legacy `[data-obsidian]` blocks beat `:root` inside the app scope.
Bare names would have looked right in the prototype and been silently wrong in the app.

## The four laws

1. **Colour has jobs.** The interface is monochrome: black, grey, white, slate, silver. Ember
   (`--sp-gate`) marks the human and the one thing waiting on you, and is never the default for a
   primary action. Green and red carry outcomes. An agent carries its loop-stage hue only while
   running, ember only while waiting on you, red on failure.
2. **State is never a hue.** A ring means running, low opacity means quiet, a blink means it needs
   you. That is what keeps seven stage hues from competing with the status colours.
3. **Identity is doubly encoded.** Shape says which agent (13 drawn silhouettes), hue says which
   of the seven loop stages. It survives greyscale and colour blindness, and a colour is useful
   even for an agent you have never met.
4. **Depth is a click away.** A list row is one line plus at most a second line carrying
   *different* information. Full detail belongs to the one item in focus.

## The primitives

**Layout** `Surface({context, wide})` · `PageHead({title, sub})` · `Block({title, sub, more, onMore})`

`wide` drops the 74ch measure. The measure exists so a LINE OF PROSE stays readable; it is the
wrong constraint for a grid, a table or a canvas.

**Decision** `Gate({question, lines})` · `Button({variant, shortcut})` · `Actions({trailing})`

One primary per screen. `trailing` separates a destructive action by DISTANCE, not colour.

**The crew** `AgentMark({slug, state, size})` · `MarkStack` · `YouMark` · `PairMark`

`state`: `quiet | idle | running | gate | waiting | failed`. **`gate` blinks and is the only
blink in the system, so exactly one mark on a screen may wear it**: the one thing actually
asking. `waiting` is the same ember without the animation, for everything queued behind it. A
list that gave every pending row `gate` blinked a dozen marks at once and spent the whole
restraint budget.

Hue resolves from the agent's station automatically. Never pass a colour. The human is a solid filled disc, so you are a different KIND
of thing from an agent rather than a different colour of the same thing.

**The record** `Row({marks, lead, sub, time, tight, focused})` · `Who` · `Diffstat` ·
`Receipt({verb, consequence, handoff, failed})` · `Record({evidence})`

`Record` is the ONE lit surface in the product: use it for what the record LEARNED, never for a
count. `Receipt` is the Commit, below.

**State** `Empty({action})` · `Failed({onRetry})` · `Loading`

Three different facts, and they must never wear each other's clothes. "Nothing here", "we could
not find out", and "still reading" make a person act differently. `Loading` reserves the height
so the layout does not jump, and carries no shimmer: motion confirms, and it has nothing yet to
confirm.

**Form and documents** `Field` · `Input` · `Select` · `Textarea` · `Line({label, sub})` ·
`Switch` · `Pre` · `Prose`

`Pre` is for code and holds its whitespace. `Prose` is for agent-written documents (a release
note, a launch draft, a rationale) and keeps the measure.

`Line` is a boundary you set: label left, control right, one per line. A boundary is a sentence
with a switch at the end of it, not a card.

**Context column** `CtxHead` · `CtxBody` · `CtxRow` · `Num`

`Num` wraps every number, duration, count, identifier and timestamp. IBM Plex Mono is for data
and nothing else.

## The Commit

The signature moment ([`agents/FINAL-agent-presence.md`](./agents/FINAL-agent-presence.md) R10).
**An action must not vanish into a toast.**

> A toast confirms that your click registered; the Commit renders what your click **caused**.

An approval that erases itself teaches you that your judgment left no trace, and judgment is the
product. So a settled call writes a `Receipt` carrying the item's own real consequence. Rules:

- A failed write **still** writes a receipt and goes honest immediately. Never a success shape
  over a failed write: that is the one thing that makes the successful ones trustworthy.
- Draw the handoff arrow only when real data says who picks the work up. **Never an arrow to
  nowhere**. Where nothing follows, say what changed instead.

## Two things that are true and easy to get wrong

**The measure vs the room.** `.sp-main` caps at 74ch. Caught on the Crew roster, where it squeezed
a 13-card grid into two columns with half the screen empty. Prose keeps the measure; anything laid
out in columns passes `wide`.

**Specificity is not a decision.** `.sp-navrow[aria-current] .sp-navcount` silently out-specified
`.sp-navcount[data-hot]`, so the one place ember belongs in the rail lost it exactly on the page
you were standing on. If a rule can lose by accident, tie the specificity and win on order.

## Legacy token map

For any panel interior still on the old system:

| legacy | new |
| --- | --- |
| `--ink-bg`, canvas | `--sp-bg` |
| `--card`, `--surface-*`, a panel | `--sp-sheet`, or `--sp-sink` for a recess |
| a raised control | `--sp-lift`; floating: `--sp-float` |
| `--text-primary`, `--ink-text` | `--sp-ink` |
| `--text-body`, `--ink-body` | `--sp-body` |
| `--text-muted`, `--ink-subtle`, `--ink-faint` | `--sp-mute` |
| `--hairline`, `--ink-hairline` | `--sp-line`; a rule between sections: `--sp-line-soft` |
| `--radius-card` | `--sp-radius-card` 10, `--sp-radius-panel` 12, `--sp-radius-ctl` 8 |
| `MonoLabel` | delete it. The `Block` above already titled the section. |

## Before a surface is done

1. Grayscale it. If colour was carrying the hierarchy, the hierarchy was never there.
2. Grep the bans: banned hex families, `border-left` on a card, nested bordered containers,
   `background-clip:text`, emoji in chrome, a greeting, `toast.success` on a judgment.
3. No list row wraps. No page scrolls sideways.
4. Every row says who made it, or says `unattributed` honestly.
5. Draw the empty state AND the failure state. They are different.
6. The six questions are answered in the file header.
