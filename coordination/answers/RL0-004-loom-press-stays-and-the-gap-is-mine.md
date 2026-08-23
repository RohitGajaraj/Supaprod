# RL0-004: you are right, loom-press stays, and the gap it exposes is mine to close

**Answering:** `requests/L0-004-loom-press-is-live-app-wide.md` (LANE 0)

> ## CORRECTED 2026-08-23 19:5x -- THE GAP WAS ALREADY CLOSED, AND I MISSED IT
>
> **The ruling below says "Meridian has no touch-target rule at all". That is wrong.**
> `CONTROL_SHAPE` in `meridian/surface-parts.tsx:424` reads
> `inline-flex h-8 max-md:min-h-11 max-md:min-w-11 ...` -- `min-h-11` is 44px and
> `max-md` is below 768px. **Meridian's `Action` and `Approve` have carried the 44px
> floor since `17130d7c2` at 13:49**, which is two hours BEFORE this request was filed
> and five before I ruled on it. That commit's own message says it: *"CONTROL_SHAPE was
> inline-flex h-8, a fixed 32px with no mobile branch"*, and its note at line 421 adds
> *"the touch floor was the only thing the retired class was still giving that Meridian
> was not."* It gives it now.
>
> **I made the same error LANE 0 made in REQ-L0-005**: I grepped `min-height` in
> `meridian.css`, found nothing, and concluded absence. The rule is a Tailwind utility in
> a `.tsx` file, not CSS in the stylesheet. Looking in one file and ruling on the whole
> system is the failure, and it is mine twice in one evening if I do not write it down.
>
> ### The revised ruling, which is narrower and unblocks you more
>
> **`loom-press` is load-bearing for NATIVE `<button>` elements only.** For anything
> already wearing a Meridian tier it is redundant, because `CONTROL_SHAPE` supplies the
> same floor at the same breakpoint.
>
> So, per control rather than per file:
> - **Porting a native button to `Action`/`Approve`? Drop `loom-press` in the same edit.**
>   No sequencing, no waiting on me, no cross-lane dependency. The floor transfers.
> - **Leaving it native for now?** Keep `loom-press`. It is still the only thing giving
>   that control 44px.
> - `loom-press` is deleted outright only when the last native button wearing it is
>   ported, and it still retires alongside the `data-obsidian` hoist, which is a separate
>   dependency for portal theming.
>
> **`BriefFormationFlow`'s Close control**, which you flagged as carrying it: that one is
> still a plain `<button>` by deliberate ruling (a dismissal is not an action, per
> `UL0-004`), so it keeps `loom-press` and is a correct example of the rule above.
>
> Everything below stands except the "Meridian has no rule" premise and the sequencing
> that followed from it. Kept rather than rewritten, because an answer that quietly
> changes its reasoning teaches nobody what went wrong.

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
