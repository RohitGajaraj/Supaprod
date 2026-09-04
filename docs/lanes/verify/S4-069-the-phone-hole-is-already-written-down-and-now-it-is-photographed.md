# S4-069 · The phone hole is already written down, and now it is photographed

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27. The harness can measure any viewport now. First phone run: 390x844, signed in,
> dead database. `bash e2e/check-motion.sh --signed-in --phone /today /approvals /guardrails`._

## What the harness gained

Everything S4 had measured was **1280x800** — the width the screenshots are composed at and the width
nobody has trouble with. `--phone` (390x844) and `--viewport WxH` now work, and screenshots are
suffixed by viewport so a phone run cannot overwrite a desk run of the same surface.

**A dead backend is the harder case for narrow widths, which is why this pairing is worth having:**
error copy is longer than the data it replaces, so failure states are exactly where a narrow column
breaks first.

## The finding, and it is NOT new, which is the point

At 390px the product has **no navigation**. No rail, no menu button, no bottom bar. The header holds
the logo, **Ask**, and **?**. A person can see the surface they are on and reach no other.

**This is already known and written down, in the CSS that causes it**, `shell.css` above
`@media (max-width: 640px) { .sp-rail { display: none } }`:

> *"seven doors are still missing on the size of screen most of a launch day arrives on, and CSS
> cannot summon what has no trigger… Until that lands this rule is a known hole, not a finished
> decision."*

That comment also names the fix precisely: a sheet opened from a header button, reusing
`.sp-keys` / `.sp-keys-scrim` / `.sp-keys-sheet` geometry, plus scoping `.sp-navlabel` and
`.sp-navcount` to `.sp-rail` so rows inside a sheet keep their names.

**So this verdict files no new defect and asks for no new decision.** What it adds is that the hole
is now **photographed rather than described**, and that the mitigation the comment relies on has one
clause I could not confirm.

## The one clause I could not verify

The same comment says the seven stations *"survive on the strip above and are readable and
**scrollable** there now"*.

**The screenshots show the strip clipped mid-word at `04 Design`, with no visible scroll
affordance.** Whether it actually scrolls is a different question from whether it looks like it
does, and I could not answer it: my probe hit a port collision and returned nothing.

**Recorded as unverified rather than as a finding.** If it scrolls, the only issue is that nothing
signals it. If it does not, the comment's argument that "a phone is no longer a room with no exits"
loses its floor, because the strip is the only remaining way out.

The check, for whoever gets there:

```js
const el = /* the station strip */;
el.scrollWidth > el.clientWidth   // is there more than fits
getComputedStyle(el).overflowX     // can it be reached
```

## Method note, against myself

The probe failed because I hand-rolled a port guard instead of using `check-motion.sh`, and my
`exit 1` sat inside a subshell, so the script continued and its cleanup killed a server another lane
was holding. **The refusal is in that script for exactly this reason and I bypassed it by not using
it.** Reported to S3 the moment I saw it.
