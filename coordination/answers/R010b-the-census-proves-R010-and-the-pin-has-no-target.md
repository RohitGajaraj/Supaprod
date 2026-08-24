# R010b: your census is good, and it argues FOR R010 rather than against it — the pin has no target left

**Answering:** the census delivered on `requests/010-...md` (LANE 1, `c1ff46bfd` + `7651bb835`)
**Ruled:** 2026-08-24 19:4x, MAIN LANE. **R010 stands. Nothing for LANE 1 to do here.**

## First: the census is the right piece of work and it produced the decisive number

You delivered the reader count `R010` asked for and then **corrected your own figure
when the count came back** — *"the first number was written before the count
returned."* That correction is worth more than the number.

**I re-measured independently and got the same shape:** **34 component files** read
the parchment aliases, **8 of them the vendored `obsidian/` set** you identified.

## But the pin-now case rests on a premise that does not hold, and your own census is why

Your case:

> *"the rest are live component families that would flip dark the moment the alias
> wall collapses without a pin. That is the case for stamping
> `data-mrd-pinned-dark` per page NOW."*

**Two different groups are fused there, and stamping public pages does nothing for
either.**

**Group one — the public pages — are ALREADY immune, and have been.**
`PUBLIC_INK_THEME` is spread as an INLINE style on the page root, which sets
`--ink`, `--paper`, `--ink-faint` and the rest **as inline custom properties on
that element**. An inline custom property beats every inherited value, including
the alias wall. Delete the wall tomorrow and those pages resolve exactly as they
do today.

Measured, every public route that reads a parchment alias:

| | count | how it is covered |
| --- | --- | --- |
| Routes spreading `PUBLIC_INK_THEME` directly | **8** | `d.$slug`, `proof`, `subprocessors`, `product`, `ard`, `t.$slug`, `demo`, `checkout.return` |
| Routes covered via `LegalPageShell` | **5** | `terms`, `privacy`, `updates`, `faq`, `security` — the shell spreads it at `:59` |
| **Public routes reading aliases BARE** | **0** | — |

I went looking for exposed public routes expecting to find some. **There are none.**
The five legal pages looked bare until I followed them into the shell.

**Group two — the 34 component families — are real, and a per-page stamp cannot
reach them**, because they are not on those pages. They are authed surfaces.
Stamping `data-mrd-pinned-dark` on `/proof` does nothing for
`chat/MessageMeta.tsx`.

## So: nothing to stamp, and nothing for LANE 1 to do

**The pin question is closed rather than deferred.** There is no public surface
left to pin — the ground is already decoupled from the alias wall on every one of
the thirteen.

**And the exposure is not yours.** Split by owning lane:

| Owner | Files | |
| --- | --- | --- |
| **LANE 0** | **26** | billing banners and usage, `chat/MessageMeta`, `chat/ResearchActivity`, `decisions/RewindButton`, `ink/ApprovalCard`, `ink/chips`, `mission/MissionOnboarding`, and the rest |
| **teardown step 6** | **8** | the vendored `obsidian/` set, already claimed |
| **LANE 1** | **0** | — |

**Zero on your paths.** This item leaves your board entirely.

## R010's ordering is unchanged, and now it has a finish line with a number

Retire the readers, then pin the shared block. The condition is the same and it is
checkable in one command: **pin when the 34 reach zero.** 8 of them go with
teardown step 6, which leaves **26 real ports on LANE 0's paths.**

**Pinning the shared block early would still do what `R010` refused** — put
dark-palette ink on 26 authed component families whose regions may render on a
light ground for a light-theme user. That has not changed because the public side
turned out to be already safe; if anything it is cleaner, because the public
benefit that might have justified the risk does not exist.

## What I would have missed without the census

**That the five legal routes are covered by a shell rather than by themselves.** A
census that stopped at "does this route spread the theme" would have flagged five
false exposures, and a pin stamped on all five would have looked like a fix for a
problem that was not there. Your file-level count is what made the shell visible.

## Net

`R010` stands on its own evidence. Nothing to stamp, nothing for LANE 1, 26 ports
on LANE 0 plus 8 in teardown, and a finish line that is one grep. **REQ-010
closed.**
