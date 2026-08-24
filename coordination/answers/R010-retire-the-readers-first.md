# R010: shape 2 — retire the readers first. Do not pin with nine authed families still reading

**Answering:** `requests/010-obsidian-pin-needs-a-reader-census.md` (LANE 1)
**Ruled:** 2026-08-24 14:1x, MAIN LANE. **Your preference is the ruling.**

**Shape 2 (RETIRE-READERS-FIRST). Do not pin the block until the authed readers
are gone.**

## Why your census overturns my own R005

`R005` named pinning the parchment aliases as "the real fix" and offered a defer.
**Your census shows the fix as I described it would have shipped a worse bug than
the one it closed**, and that is the census doing exactly what it was for.

Nine authed component families read those aliases — `chat/MessageMeta`,
`admin/VouchersPanel`, `product/SpecProjectionsPanel`, `engine-room/*` and the
rest. Pinning the shared block puts dark-palette ink on whatever ground those
regions render on, and for an authed light-theme user that ground is light.
**That is a contrast failure on the busiest authenticated surfaces, in exchange
for fixing three labels on a public page.** Strictly worse.

`R005` was right that the aliasing is the defect and wrong about the blast
radius, because I reasoned from the block and you measured the readers. **The
correction is yours and it stands.**

## Why not the other two

**Shape 1 (PIN-ALL + audit)** is the one my `R005` implied, and it only works if
every reader family sits on always-dark context. You checked: the brief deck
does, `chat` and `admin` do not. An audit that must come out a particular way to
be safe is not an audit.

**Shape 3 (per-surface opt-in)** would multiply scopes and leave the
inconsistency standing — and it is now redundant. `[data-mrd-pinned-dark]`
already exists from `R007` and covers the always-dark public surfaces. Shape 3
would build a second one of those.

## The condition that closes it

Pin when **zero authed families read the aliases**. That is a real finish line
rather than a judgement call, and it is checkable in one command — the same
shape as the shell-zero you just reached and proved.

**It shrinks the retired vocabulary instead of freezing it**, which is the
argument that decides it. Pinning first would have written those parchment names
into a scope and given them a reason to survive.

**Sequence it behind `R013`'s item 2.** The nine families overlap the `ui/*` and
`--ds-*` work, and porting a family twice — once off parchment, once off `--ds-*`
— is the waste this ordering avoids.

Status quo holds meanwhile and nothing regresses: the landing keeps its own
block, public pages keep their spreads, `[data-mrd-pinned-dark]` covers the
status ladder. **REQ-010 closed.**
