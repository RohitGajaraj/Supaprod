# S4-049 · The screen offers the one action its own sentence just ruled out

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27, on `main`, with the live hold distribution behind it. **First verdict written
> under the corrected three-part bar (`S4-048`): taste first as the question, reference second as the
> check, frontier bar third as the veto.**_

## Taste first: what does a person actually read, and is it good?

The held region on the run screen (`TrackRun.tsx:758-783`) renders the hold sentence as the lead, how
long it has sat, which try this is, a status chip, and then **one control**:

```tsx
<Action busy={release.isPending} onClick={() => release.mutate()}>
  {release.isPending ? "Releasing it" : `Let ${AGENT_STATIONS[track.station].name} try again`}
</Action>
```

Now read the two holds that carry **7 of the 8 real parked tracks**, next to that button.

**`going-in-circles`** (3 real tracks):

> *"This station has been run many times over and the work has not moved on once. That is the loop
> rather than any single run, so nothing further will be spent on it until you look."*
>
> **[ Let Discover try again ]**

**`station-cannot-finish`** (4 real tracks):

> *"This station has everything it needs on the record and still finishes with nothing, several times
> over. That is the station rather than the work, so it needs your eyes."*
>
> **[ Let Discover try again ]**

**The sentence says retrying is not the answer. The only button says try again.** They are on the
same screen, arguing with each other, and the button is the one a tired person presses.

That is the taste failure and it needs no reference to see: a surface that talks a person out of an
action and then offers only that action has not decided what it thinks.

## The surface already knows how to do this, which is what makes it a defect rather than a gap

The same file, same list, gets it right wherever the problem is connection-shaped:

| hold | sentence ends with | agrees with the control? |
| --- | --- | --- |
| `tools-refused` | *"Reconnect it and start this work again."* | **yes** |
| `needs-evidence` | *"Connect a source, or file the missing input by hand, and this starts again on its own."* | **yes** |
| `going-in-circles` | *"nothing further will be spent on it until you look."* | **no** |
| `station-cannot-finish` | *"so it needs your eyes."* | **no** |

The connection-shaped holds name an action and the control matches. The loop-shaped holds end on
**"until you look"** and **"needs your eyes"**, which are states rather than actions, and then hand
the person a button that does the wrong thing.

**So this is not a missing feature. It is two halves of one surface written to different standards.**

## Reference, second: what the pattern actually is

The convention for an unrecoverable-by-retry state is to change the offer rather than keep it and
weaken the words: escalate to the thing that will work, or disable the action that will not and say
why. That is ordinary and it is what the connection-shaped holds already do here. **No reference was
needed to find the defect; it is only needed to confirm the fix is not exotic.**

## Frontier, third, as the veto

Would Anthropic or Perplexity ship a screen whose only button does the thing the paragraph above it
says is pointless? No, and not because it is ugly. Because it wastes the user's one action and then
charges them for it: `going-in-circles` exists precisely to stop spend, and pressing the button spends
again to reach the same hold.

## What is live, and what is already fixed elsewhere

**This is live on `main` now.** S1's RUN-23 addresses exactly this and is **not pushed**, so the dead
end stands in the shipped tree. Their diagnosis and mine agree independently, which is worth
recording since we reached it from opposite ends: they by driving a track, me by reading the hold
table against the live distribution.

**And the pairing matters.** `S4-045` established that a steer alone does not move a terminally held
track, because `steerTrack` clears no hold and the tick excludes it. So the honest offer on these two
holds is **an instruction and a press together**, not either alone.

## Verdict

**CONFIRMED, taste-first.** 7 of 8 real parked tracks show a person a sentence that rules out
retrying, above a button that retries. Severity: it is the dead end R-20 forbids, wearing a control.

**Not fixed, and not mine.** `src/components/track/**` is S1's, and their unpushed RUN-23 already
covers it. The one thing I would add to their fix from the live data: the two holds that need it most
are `station-cannot-finish` and `going-in-circles`, in that order, because those two carry seven of
the eight real parked tracks between them.
