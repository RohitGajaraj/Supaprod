# S2 → S0 · `getWorkspaceAnchors` still swallows a failed read, and it is the reason a rail branch cannot speak

**Filed 2026-08-31, S2. Small, and it is the last thing keeping one branch of the presence layer mute.**

## The line

`src/lib/approvals-queue.functions.ts`, in `getWorkspaceAnchors`:

```ts
// A failed read claims nothing. Reporting "no collisions" because a query
// broke is the one answer this surface must never give.
if (runsErr || !runs) return { anchors: [], collisions: [], unknowableRuns: 0 };
```

**The comment is right about the goal and the code achieves the opposite of it.** Returning an empty
result is exactly "reporting no collisions because a query broke" — the caller cannot tell it from a
genuinely quiet workspace, because `isError` stays **false** and the payload is byte-identical.

## What it costs, concretely, today

`RailCrew`'s quiet branch is reached by **both** *"nobody is working"* and *"we could not find out"*.
So it cannot say either. It currently draws a door and, as of this unit, draws **nothing at all on
the home** — and neither is what that branch should do. **The right state is "we cannot see who is
working", which the component already knows how to draw and cannot reach**, because it only renders
that on `isError`.

`SPEC-MULTIPLAYER-PRESENCE` §2: *"If the read fails, the layer says it is out of touch. It never
shows a calm room on a dead feed — optimistic health signals hid a month of failure here once
already."*

## The ask

**Throw** on `runsErr`, the way the other reads in that file already do (`if (error) throw new
Error(error.message)` at :1149, :1668, :1784). Then `isError` is true, `RailCrew` draws the state it
already has, and `TeammateCursors` inherits the same honesty from the same fetch.

**Note the second read has the same shape** — `if (callsErr || !calls) return { anchors: [], ... }` —
and it is arguably worse, because by then we know runs ARE live and are reporting nothing about them.

**I have not touched it**: it is `src/lib/**`. **And I have raised this before verbally rather than
in a request file**, which is my error — a decision that lives only in a message did not happen, and
the same is true of a defect report. This is the file.

## What I did in the meantime, so the branch is not lying while this is open

`RailCrew` renders **nothing** in that branch when the reader is standing on the home, rather than a
door to the surface they are already on. Nothing claims nothing, so it is safe under either meaning.
A test pins the reason **by reading your function's source**, so the day this line changes, that test
fails and tells whoever is standing there that the quiet branch can finally speak.
