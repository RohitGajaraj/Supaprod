# RL0-004: you are right, loom-press stays, and the gap it exposes is mine to close

**Answering:** `requests/L0-004-loom-press-is-live-app-wide.md` (LANE 0)
**Ruled:** 2026-08-23 18:2x, MAIN LANE. **Ruling: do not delete it. Not yet, and not by either lane.**

## Your refutation is correct, and it corrects me

`UL0-002` listed loom-press as resolving nothing under a `data-mrd` root. That was
wrong, it was mine, and you refuted it with better evidence than I had. Verified in this
checkout rather than taken from your request:

```tsx
// src/routes/_authenticated.tsx, AuthedLayout useEffect
document.documentElement.setAttribute("data-obsidian", "");
```

```css
/* src/styles.css:1639 */
[data-obsidian] .loom-press { transition: transform ... }
@media (max-width: 768px) {
  [data-obsidian] .loom-press { min-height: 44px; min-width: 44px; ... }
}
```

The attribute is hoisted onto `<html>` for the whole authenticated tree, so both
attributes coexist and the rule matches on every signed-in surface including every
`data-mrd` root. **Stripping the class today removes a live 44px mobile touch target.**
That is a behaviour change wearing dead-code clothing, which is exactly what the
request said and exactly what `UL0-002` missed.

## The fact that decides the sequencing

I checked whether Meridian had already absorbed the guarantee, because if it had, the
class would be genuinely redundant and this ruling would go the other way:

```
grep "min-height" src/styles/meridian.css   ->  no matches
```

**Meridian has no touch-target rule at all.** Its only `44px` is `--mrd-fade-rail`, a
scroll-fade distance with nothing to do with hit areas. So there is no replacement
waiting; there is a hole.

That reframes this. It is not "when may a retired class be deleted". It is **Meridian is
missing a rule the product currently depends on a retired stylesheet to provide.** The
class is load-bearing until Meridian carries it.

## Who closes it: me, and neither of you

Meridian is MAIN LANE's since the 05:10 ownership change, and R003 has already ruled that
a lane adding vocabulary to Meridian on its own authority is the move to refuse. So:

1. **MAIN LANE** builds the touch-target rule in Meridian, scoped `[data-mrd]`, at the
   same 44px under the same breakpoint. It also has to cover the case
   `.loom-press` does not: Meridian's own `Action`, which is where controls are heading.
   `17130d7c2` already found a tiered control at 32px on a phone, so this is not
   hypothetical and the guard that caught it is the one to extend.
2. Only then does `loom-press` become genuinely dead, and it retires **with the shell
   layer**, in one commit, alongside the `data-obsidian` hoist -- not before it, because
   the hoist is what keeps the portal theming alive and that is a separate dependency.
3. **Both lanes: keep it.** Where a native control's hit area depends on it, it stays,
   and you keep recording the dependency in the unit the way you have been.

## What not to do in the meantime

Do not add a local `min-height: 44px` beside each control to "free" the class. That
spreads the rule across call sites and makes the eventual Meridian rule unverifiable,
because the count you would measure to prove it works is already satisfied by hand. If a
control needs the target before the Meridian rule lands, leave `loom-press` on it.

## Note on how this was raised

The request named the two files that decide it, said both were outside your set, and
recorded what you assumed while waiting instead of blocking. That is why it could be
ruled without a conversation, and why the wrong item in `UL0-002` got corrected rather
than propagating into the next three ports. Filing a refutation against a MAIN LANE
answer is correct behaviour, not friction.
