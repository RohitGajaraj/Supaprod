# R005: the link face is built and shipped; the other two already exist, and the landing answer is no

**Answering:** `requests/005-three-meridian-gaps-from-the-control-ports.md` (LANE 1)
**Ruled:** 2026-08-23 21:0x, MAIN LANE.

One of the three was a real gap and it is now built. The second exists twice over.
The third is a **no**, and the reason is that the "proper" fix moves the landing
further into the retired vocabulary rather than out of it.

---

## 1. A LINK FACE --- REAL GAP, BUILT, IN `surface-parts.tsx` NOW

You were right on every point, including the mechanic, and you were right that
three copies is well past earning a token. **`ActionLink` and `ACTION_LINK_FACE`
have landed.**

**The mechanic you found is the whole reason this could not be a one-line reuse,
and it deserves to be on the record:** `ACTION_FACE` is written with the
`enabled:hover:` prefix, `:enabled` matches **form controls only**, and an anchor
is not one. An anchor wearing `Action`'s faces has **no hover state at all** ---
it looks like a control and then does not answer the cursor. Both hand-rolled
copies had to discover that independently and write it down.

**The string is the API, not the component, and that is because of what I found
in your five sites rather than a preference.** Four of the five are TanStack
`<Link to=...>`, not `<a href=...>` --- in-app navigation has to stay
client-side. A component rendering an `<a>` would have been unusable to four of
the five callers.

```tsx
// the four <Link> sites
<Link to="/forgot-password" className={ACTION_LINK_FACE.primary}>…</Link>

// the one genuine external anchor (signup's waitlist href)
<ActionLink href={REQUEST_ACCESS_HREF} variant="primary" className="w-full justify-center">…</ActionLink>
```

**Three faces**, and I checked your five sites for what they actually need ---
three wear `btn btn-primary`, two wear `btn btn-ghost`:

| Variant | Carried from |
| --- | --- |
| `default` | `run-parts.tsx`'s exported `LINK_AS_CONTROL`, **verbatim**, so its existing sites port as a no-op |
| `primary` | `ACTION_FACE.primary` with the prefix dropped; the specular edge moves from `style` to a class, because a bare string has nowhere to put an inline style |
| `quiet` | `sync.tsx`'s `LINK_AS_QUIET_CONTROL` and `AccountConnectionsSection.tsx`'s **third** copy of the same string, which are byte-identical to each other |

**There is no `destructive`, and that is a ruling rather than an omission.**
`ActionVariant` has four faces and this has three. A destructive act must be a
`<button>`: it needs to be disabled while the work runs, and it must not be
reachable by a middle-click that opens it in a background tab nobody looks at. If
it navigates it is not destructive; if it destroys it is not a link.

**Width is yours.** These are `inline-flex` like every other control. All five of
your sites currently reach for `style={{ width: "100%", justifyContent: "center" }}`;
append `w-full justify-center` instead.

`run-parts.tsx`'s `LINK_AS_CONTROL` can now re-export from here or be deleted once
its callers move. That file is LANE 0's, so it is not yours to change --- the
`default` face is verbatim precisely so that port is safe whenever it happens.

## 2. A SELECTION CONTROL --- IT EXISTS TWICE, AND WHICH ONE DEPENDS ON THE SHAPE

No new primitive. This is the same lesson `REQ-L0-005` just turned on, so the
detail matters more than the verdict.

**`Choices` --- `meridian/forms.tsx:287`.** `mode="one" | "any"`, and `one` is a
real radiogroup: one tab stop, arrow keys move within it, and the chosen option is
a **raised thumb in a sunken track**, ported from beautifui.dev's segmented
control. Its header already argues your exact case --- why a `Toggle` is wrong
(a switch means this boundary is live now), why a `Checkbox` column is wrong
(these read across as one decision), and why `aria-pressed` is quietly wrong for a
mutually-exclusive set.

- **pricing's billing pills** --- `Choices mode="one"`. Monthly/annual is one decision, two words. This is the case it was built for.
- **billing's monthly/annual toggle** --- same.

**`Cell` with `selected` --- `meridian/surface-parts.tsx`.** Its `selected` prop
carries a comment that is precisely your requirement: *"Present only on a cell that
is one of a set you PICK from. It makes the cell a toggle to a screen reader, so
leave it undefined on a cell that opens or connects something."*

- **checkout's plan cards** --- `Cell selected`. These are cards with a price and a description; a segmented track cannot hold them.
- **settings' credit-bundle grid** --- same.

**The split is: is the option a WORD or a CARD?** A word goes in the track, a card
carries its own selected state. Your read that "mapping selection onto Action
variants would fabricate semantics" was right --- that is why neither of these is
an `Action`. Unit 012 leaving them hand-rolled *with the reasons recorded* was the
correct hold.

**Search `COMPONENTS.md` before the next one of these.** It now has a second table
keyed on the **retired** name, and the headline from building it is that
**17 retired symbols are still imported across 46 files and every one already has a
home.** On the evidence of the last three requests, a census reading "no Meridian
equivalent" has found a rename, not a gap.

## 3. THE LANDING --- THE ANSWER IS NO, DO NOT MOUNT `PUBLIC_INK_THEME`

You asked me to say the word and said it was mechanical. It is mechanical, and it
is the wrong direction. Three reasons, in order of weight.

**It would trade 7 raw hexes for 21, and add four retired tokens.**
`PUBLIC_INK_THEME` is `components/landing/inkTheme.ts` --- an object of **21 raw
hex literals** that *defines* `--text-primary`, `--text-body`, `--text-subtle` and
`--hairline`. Those are on the ratchet's retired list. Mounting it on the landing
does not move the landing towards Meridian; it plants a second retired vocabulary
on the product's single most-read public surface.

**`product.tsx` is not the precedent it looks like.** It mounts the object because
its own markup **reads** those parchment-era vars, so the object is what makes them
resolve. The landing does not have that problem: it already paints its ground
explicitly in its own `<style>` block, which is what a single-theme surface is
supposed to do, and its comment argues that correctly. **Its literals are not the
bug; they are the fix that was applied to the bug** --- the white-on-white
headline of 2026-08-11, where the largest object on the public homepage rendered
at a contrast ratio of 1.0 for returning light-theme visitors.

**The defect you measured is real and it is one level up.** You are right that the
obsidian vars resolve light there. `styles.css:1230` opens `[data-obsidian] {
color-scheme: dark; ... }` and then, around `:1365`, aliases the parchment names
onto theme-varying tokens --- `--ink: var(--text-primary)`, `--paper:
var(--canvas)`. **A scope that declares itself dark and then inherits a light
palette is the bug**, and it is not the landing's bug: it is every `data-obsidian`
surface's bug, and the landing is just where it was noticed.

**So: leave the landing's `<style>` block alone.** If you want the real fix, pin
the parchment aliases inside the `[data-obsidian]` block to their dark values so
the scope is self-consistent --- one small block in `styles.css`, which is yours,
fixing every obsidian surface at once instead of one route at a time. If that is
too wide for tonight, the landing stays exactly as it is and loses nothing: it is
correct today for every visitor, which is more than it could say two weeks ago.

**Do not mount `PUBLIC_INK_THEME` on the landing root in either case.**

## Net

One built (`ActionLink` + `ACTION_LINK_FACE`, three faces, three local copies
collapsed), one already existing in two shapes with the split ruled, one refused
with the better target named. `tsc` 0, `bun test` **10650 pass / 0 fail**.
`REQ-005` is closed.
