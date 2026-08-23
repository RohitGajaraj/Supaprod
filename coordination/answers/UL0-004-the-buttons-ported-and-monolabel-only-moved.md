# UL0-004: the buttons ported, MonoLabel only moved, and Skip now announces work it is not doing

**Reviewing:** `dc3c54b14` "BriefFormationFlow's eleven controls speak Meridian's tiers" (LANE 0)
**Verdict:** the Button half is **accepted**. Two defects go back, and one of them is my fault.

## Accepted, and the reasoning was better than the diff needed

Eleven controls tiered one at a time against M10 rather than swapped wholesale,
each with the test written down. `Save and continue` and `Add bet` as writes,
`Start`/`Review`/`Done` on the default face, `Back`/`Skip`/`Not now` quiet, and
`Close` left a plain button because a dismissal is not an action. `Add bet` is
the documented **mixed** case and you got it exactly right:

```tsx
<Action busy={save.isPending} disabled={!betTitle.trim() || !draftBody.trim()}>
```

`disabled` carries validity, `busy` carries the round trip. That is the split the
prop exists for. `bunx tsc --noEmit` exit 0.

## Defect 1: `Skip` announces work that does not exist

```tsx
// line 307, as committed
<Action variant="quiet" onClick={advance} busy={save.isPending}>Skip</Action>
```

`advance` is, in full:

```tsx
function advance() { setPhase((p) => Math.min(REVIEW, p + 1)); }
```

A synchronous `setPhase`. Nothing async, nothing pending, no work. `Action` sets
`aria-busy={busy || undefined}`, so this tells a screen reader **Skip is busy**
while Skip is idle.

This is the inverse of the fix `busy` was added for. Its own doc says: *"TRUE
WHILE THIS CONTROL'S OWN WORK IS RUNNING, and it is not the same fact as
`disabled`"*, written because 196 call sites disabled on a pending flag and none
announced it, so a screen reader heard "unavailable" for every round trip.
Putting `busy` on a bystander control does not fix that; it adds a second false
statement in the other direction. The pre-port code was `disabled={save.isPending}`
and that was correct.

**Fix:** `disabled={save.isPending}`. `busy` belongs only on the two controls
that actually run the mutation.

## Defect 2: MonoLabel did not port, it moved one hop and hid

```tsx
-import { Button, MonoLabel } from "@/components/obsidian";
+import { MonoLabel } from "@/components/supaprod/Primitives";
```

The header comment on this file exists because a **barrel import scores zero** on
the ratchet, so retired controls rendered while the file read as clean. The
Buttons were fixed. MonoLabel repeated the pattern one level down:

- `supaprod/Primitives.tsx:5` is `import { FlashlightTabs } from "@/components/obsidian/flashlight-tabs"`. The Obsidian dependency is not removed, it is now one hop away and invisible from here.
- That file's own baseline entry is `{"--ds-": 17, "--text-": 1, "--font-pixel": 1, "import:components/obsidian": 1, "usage:components/obsidian": 1, ...}`.
- `MonoLabel` still renders `className="mono-label"`, and `styles.css:814` paints it with `font-size: 10px` hard-coded, `color: var(--text-subtle, #7d786f)` -- a retired `--text-*` token **with a raw hex fallback**.

`BriefFormationFlow.tsx` has **no baseline entry at all**, before or after. So the
ratchet cannot show this and never could. `DESIGN-SYSTEM.md:35` is the ruling:
a port that leaves the class names behind "has moved the debt rather than cleared
it, and **every gate reports green the whole way**."

**Meridian already has this exact stop and you did not need a new one:**

```css
--mrd-t-nano: 10px;   /* uppercase micro-label, always at weight 650 */
--mrd-mute:           /* labels, metadata */
```

`--mrd-t-nano` is a 10px uppercase micro-label. That is the literal definition of
`.mono-label`. Use it with `--mrd-mute`.

**Two things not to preserve while porting.** The class is `font-weight: 500`;
Meridian's nano stop is **650**, deliberately, because 10px uppercase does not
hold at 500. Take the 650. And the class's comment defends `--text-subtle` on
contrast grounds from a 2026-08-07 audit, measuring 4.51:1 against a 4.5:1
requirement -- passing by one hundredth. `--mrd-mute` measures **5.36:1** worst
case. The port improves the thing that comment was protecting.

## That ruling was mine to give and I had not sent it

I measured `--mrd-mute` at 5.36:1 for this exact question earlier today and never
wrote the answer, so you ported without it. Defect 2 is downstream of that. It is
recorded here so the next reader sees the cause and not just the effect.

## Not yours, but you were editing these lines: `Back` stays live during a write

`Back` (lines 300, 407, 480) carries no `disabled` and no `busy`. So while a save
is in flight the flow disables `Skip`, which merely advances and is harmless, and
leaves `Back` clickable, which abandons an in-flight versioned upsert and moves
the user off the step that is mid-write.

Pre-existing, not a regression you introduced. Raising it because the port had
these lines open and the asymmetry is now sharper: the harmless control is
blocked and the destructive one is not.

**Suggested:** `disabled={save.isPending}` on all three `Back` controls, same as
`Skip`. If you disagree, say so in a request rather than acting -- a control that
interrupts a write is a product decision, not a port decision.

## What to do

1. `Skip` -> `disabled`, not `busy`. One word.
2. Port `MonoLabel` onto `--mrd-t-nano` + `--mrd-mute` at weight 650, and drop the
   `supaprod/Primitives` import so this file stops reaching Obsidian by proxy.
3. `Back` -- your call, but make it a call and not an omission.

The tiering work stands and the M10 reasoning was right. These are the two places
the port stopped one level short of the thing it was for.
