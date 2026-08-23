# UL0-007 ACCEPTED: all three corrections closed, and C-02 was closed better than it was asked

**Verified:** 2026-08-23 18:0x, MAIN LANE, on the merged tree.
**Commits:** `8775d41e1`, `f135f612c`. Gates: `tsc` exit 0, `bun test` **10650 pass / 0 fail / 631 files**.

This is the first full correction cycle in this run: MAIN LANE found it, routed it with
state, the lane fixed it, and it was verified rather than believed. Recorded so the shape
is repeatable.

## C-01 — closed, correctly

```tsx
<Action variant="quiet" onClick={advance} disabled={save.isPending}>Skip</Action>
```

`busy` is gone. The comment added beside it names the reason (a skip must not race the
write), which is the part that stops it being re-broken by the next porter.

## C-02 — closed at the SOURCE, which is better than the correction asked for

The correction asked for one consumer to drop its `@/components/supaprod/Primitives`
import. LANE 0 instead fixed `MonoLabel` where it is defined:

```tsx
className={`mrd-eyebrow flex items-center gap-mrd-inline ${className ?? ""}`}
```

- `.mono-label` is gone, and with it the hard-coded `font-size: 10px` and
  `var(--text-subtle, #7d786f)` -- a retired token with a raw hex fallback.
- The inline `display:flex / alignItems / gap:6` is now `gap-mrd-inline`.
- **`supaprod/Primitives.tsx` no longer imports obsidian at all.** The
  `FlashlightTabs` import that made this file reach the retired system by proxy is gone.

So the consumer's import staying put is now correct, not a miss. **Fixing it at the
source cleared all 58 consumers instead of the one named.** I checked the target it
landed on rather than trusting the name:

```css
@utility mrd-eyebrow {
  font-size: var(--mrd-t-nano);      /* the 10px stop */
  font-weight: var(--mrd-w-micro);   /* the 650, not the class's 500 */
  color: var(--mrd-mute);            /* 5.36:1, against the old 4.51:1 */
}
```

That is exactly the specification in `UL0-004`, and `mrd-eyebrow` is canonical rather
than invented: `meridian.css:1697`, already used by `ContextColumn`, `AgentInbox` and
`surface-parts`, and covered by `empty-region.test.tsx`'s role set.

## C-03 — decided, in the safe direction

```tsx
<Action variant="quiet" onClick={...} disabled={save.isPending}>Back</Action>
```

All three `Back` controls now block during an in-flight write, with the reasoning kept
beside them: abandoning a mid-upsert is the destructive direction, and the harmless
control must not be the only one blocked. This was routed as a decision the lane owed
rather than a defect, and it was made rather than left as an omission. That is the right
handling.

## The baseline repair, checked separately

`a9d19519e` says the ratchet baseline landed corrupted by an unresolved rebase conflict
and was regenerated. A regenerated baseline is where a regression gets silently absorbed,
so it was diffed against the last number MAIN LANE had verified good rather than read:

```
verified-good 23b0fb2b9: 2695  ->  now: 2665   delta -30
ROSE:                  []   NEW files admitted: []
```

Nothing rose and no file was admitted that was not already carried. The file parses and
holds no conflict markers. **The repair absorbed nothing.**

## What to keep doing

Naming the `C-` number in the commit message is what made this verifiable in one pass
instead of a hunt. Keep that. And when you close a correction differently from how it was
written, say so in the unit the way this one did -- it sends the reviewer to the right
file instead of the one named in the original finding.
