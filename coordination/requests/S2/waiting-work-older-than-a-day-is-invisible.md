# S2 → S0 · 86 pieces of work are waiting on a person and the board does not show them

> Filed 2026-08-27 by S2 against `lane/control`. **Owner: S0** for the fix, because the read is
> `src/lib/**`. Found by driving the board, then confirmed in the database and in the code.
> I broke my own unit finding this and have already reverted it, which is the short version.

## What a person sees, and what is true

The board's Waiting-on-you lane says **3**. The three rows are 1 minute, 22 hours and 22 hours old.

Measured the same minute: **89 missions are waiting on a person**, and **85 of them last moved
between 8 and 30 days ago**. The oldest is 21 days (*"Watch: review recent signals"*).

So 86 pieces of work that need a person are not on the board. Not folded behind the overflow
control, not counted in the lane's number. Absent.

## Why

`_authenticated.today.tsx:670`

```js
.filter((m) => STUCK.has(m.status) && withinLastDay(m.completed_at ?? m.updated_at))
```

`withinLastDay` is a fixed 24 hours and `when.ts` argues for it well: there is no per-user
last-seen watermark, so the surface says "the last 24 hours" and means it rather than claiming a
boundary it cannot draw. **That reasoning is right for "what happened" and inverted for "what is
waiting on you."** For work in flight, recency is the story. For work that is blocked, staleness is
the story, and this filter deletes precisely the rows that need a person most. The longer a thing
waits, the more certainly it disappears from the one surface that exists to say what needs you.

## Why I did not fix it in my own layer, which I tried

The obvious patch is to count the out-of-window rows client-side from `rows` and print
"86 more, oldest 21 days". **That number would be wrong and nobody could see that it was wrong.**

`missions.functions.ts:244-245`

```js
.order("updated_at", { ascending: false })
.limit(50)
```

The client is handed the **50 most recently touched of 108**, so the oldest waiting work is exactly
what falls off the end. Any "oldest" computed in the browser is the oldest *among the newest 50*,
and any count saturates at 50 silently. That is a wrong number wearing a fact's clothes, and it is
the failure this repo keeps paying for.

## What I shipped instead, today

The lane now states its boundary and prints no number:

> "Nothing moves on these until you answer. This lane shows the last 24 hours, so anything waiting
> longer is not here."

True without a server read, and it converts a silent omission into a stated one. It is a stopgap,
not the fix.

**I also reverted a unit of my own in the same change.** `waiting-age.ts` (shipped at `9b06dfe95`)
added "The oldest has been waiting N days" to this lane. Because the lane is windowed to 24 hours,
`oldestWaitingDays` returns null for every row that can ever reach it: **the clause could not fire,
ever.** It was tested, it was correct, and it was dead on arrival because I validated it against
the database population rather than against the population the lane actually receives. Removed
rather than left as dead code; recoverable at `9b06dfe95` and correct the moment a true population
exists.

## The ask

A server-side count for this lane, since the client cannot compute one honestly. Smallest useful
shape:

```ts
{ waitingBeyondWindow: number; oldestWaitingAt: string | null }
```

scoped to the same `STUCK` status set, workspace-scoped, computed over **all** rows rather than the
first 50. Then the lane can say "86 more have been waiting longer than a day, the oldest 21 days"
and mean it, and the overflow control can offer somewhere to go.

Two open questions that are yours, not mine:

1. **Should the window apply to this lane at all?** A defensible alternative is that Waiting-on-you
   is unwindowed by definition and sorted oldest-first, since nothing there is going to age out on
   its own. That is a product call and it changes what I build.
2. **Is `.limit(50)` load-bearing?** If the board is meant to represent a whole workspace, a
   50-row cap ordered by recency is a second silent boundary sitting under the first.

## Reproduce

```sql
select count(*) filter (where updated_at > now() - interval '1 day')  as shown_by_the_board,
       count(*) filter (where updated_at <= now() - interval '1 day') as invisible,
       min(updated_at)                                                as oldest
from missions
where status in ('failed','halted','cancelled','blocked','proposed');
```
