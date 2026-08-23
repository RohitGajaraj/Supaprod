# UL0-002 — ACCEPTED, one number corrected, and a ruling you must read before your next port

**Verdict: accepted.** Nothing to undo. Verified on the merged tree at 14:20.

**Read the loom-press ruling below before you touch it.** Your open item 4 proposes deleting it
on a premise that is false, and acting on it would remove live accessibility behaviour from 29
controls.

## Verified

| you claimed | I measured |
| --- | --- |
| retired-layer classes in file: 5 to 0 | **0** live (comments stripped) |
| ember refs: 0 | **0** |
| both roots carry `data-mrd` | **2** |
| focus-ring exemption register 13 to 12 | **12 entries**, correct |
| ratchet entry for this file deleted | **absent from the baseline**, correct |
| ratchet 2,859 to 2,849 / 219 | **2,849 / 219**, and it composes with both LANE 1 units to 2,800 today |
| h1 now `text-mrd-h2 font-semibold text-mrd-ink` | **confirmed** |
| no fabrication | `Array.from`, `Math.random`, `mock`, `placeholder`, sample arrays: **all 0** |

**Your h1 finding is the best thing in this unit.** An unscoped base-layer rule set every `h1`
at `clamp(2.25rem, 4vw, 3.75rem)`, so `sp-title`'s intended 25px rendered at 36px and the section
heading outran the page's own title. That is the founder's number one complaint with a mechanism
attached, and it is the same SHAPE as the defect MAIN LANE found in Meridian, where every
`@utility text-mrd-*` emitted after every `text-[Npx]` and silently won. Two different systems,
one disease: **a declared size losing to something the author could not see.**

**One number is wrong, and it is cosmetic.** You report "ten Meridian controls"; there are
**nine** (`<Action>` x7, `<Approve>` x2). The tenth line in that grep is `<Actions>`, the wrapper.
Eight native buttons is right. Nothing rests on it.

**Your rebase resolution was correct.** Both lanes re-froze the baseline in the same window and
you took upstream's numbers then re-ran `design:ratchet` on the merged tree rather than
hand-merging the JSON. That is the only safe way: the baseline is a derived file, so it is
regenerated, never reconciled by hand.

**And your provenance note is the right call.** MAIN LANE independently observed those
uncommitted changes in `cadence-lane-0` at about 12:45 and a session that had stopped, so your
account matches what I saw from outside. Reviewing every hunk before pushing work you did not
write is exactly right; a lane that silently adopted it would have been claiming authorship of
code it had not read.

## THE RULING: DO NOT DELETE `loom-press`. IT IS LIVE.

Your open item 4 says it *"resolves nothing under a `data-mrd` root"*. **It resolves.** The
premise is false and the check is one grep:

```
src/routes/_authenticated.tsx:113
  document.documentElement.setAttribute("data-obsidian", "");
```

`data-obsidian` is mounted on `<html>` for the entire authenticated tree, deliberately, so that
Radix portals inherit the right tokens. `.loom-press` is defined as `[data-obsidian] .loom-press`,
a descendant selector, so an ancestor on `<html>` matches **every** element in the app. Adding
`data-mrd` to a root does not shadow it; the two attributes are unrelated.

**And what it gives is not decoration:**

```css
@media (max-width: 768px) {
  [data-obsidian] .loom-press { min-height: 44px; min-width: 44px; ... }
}
```

That is the **WCAG 2.1 AAA target size**. Deleting the 29 uses would strip the mobile touch
minimum from 29 controls. It is an accessibility regression, not a tidy-up.

**When it may go:** only once `data-obsidian` comes off `<html>` (LANE 1's file, `src/routes/**`)
**and** the controls it protects have the floor from somewhere else. Until both, leave it.

## THE PART THAT WAS MERIDIAN'S FAULT, AND IS NOW FIXED

Chasing your item 4 turned up a defect in the design system underneath you, and your unit is how
it surfaced.

`CONTROL_SHAPE` was `inline-flex h-8` — **a fixed 32px with no mobile branch**. So:

| a control that is... | mobile tap target |
| --- | --- |
| a native `<button className="loom-press">` | **44px** |
| a Meridian `<Action>` or `<Approve>` | **32px** |

**Porting a control onto Meridian's tiers was shrinking its tap target**, and both lanes are doing
exactly that on MAIN LANE's own instruction in M07 and M10. Your unit moved nine controls that
way, correctly, against a system that was wrong beneath you.

Meridian had already argued the case against itself: `surface-parts.tsx` defends the decision
bar's move to 44px in its own words, *"a row carrying a decision earns the height, and 44px is the
smallest square a finger reliably hits"*. Rows got that floor. The things a finger lands on did not.

**Fixed in `17130d7c2`:** `CONTROL_SHAPE` now carries `max-md:min-h-11 max-md:min-w-11`. Desktop is
untouched, because `min-height` beats `height` only when it is larger. Verified emitted rather than
assumed, since `max-md:` was used nowhere else in this codebase and a variant that generates no
rule looks exactly like a fix. Guarded by `a-control-is-big-enough-to-hit.test.ts`, which resolves
the Tailwind step to pixels rather than asserting a class name, and which was proven by injecting
a 36px floor and watching it fail.

**So your ports are now correct in both directions.** Nothing for you to redo.

## Your other open items

1. **`MissionDiff.tsx`** — yours, same folder. Take it.
2. **`["mission-steps"]` has no `isError` branch** — a failed read rendering as "no steps yet" is a
   surface stating a fact it does not have. That is the failure mode the founder has banned
   outright. **Fix it in your next unit**; `EmptyRegion` is for genuinely empty, and a read that
   did not finish is a different sentence.
3. **`fontSize: 22`** — snap it. Nearest stops are `--mrd-t-h3` (20) and `--mrd-t-lead` (17).
   Take 20 and say so, on the same nearest-stop rule that answered REQ-001.
4. **`loom-press`** — ruled above. Leave it.
5. **Duplicate page title** — correctly handed up. It is LANE 1's, in `src/routes/**`.
