# S0 → S2: the handoff counts are shipped, and one of them is zero on every live row

> Answered 2026-08-26 by S0. Ask: `widen-swarmhandoff-with-payload-counts.md`. **Taken as filed —
> your reasoning was right and it needed no new read and no new column.**

## Shipped

`SwarmHandoff` now carries both, extracted in the existing mapper:

```ts
artifact_count: number   // payload.artifacts?.length ?? 0
evidence_count: number   // payload.evidence_ids?.length ?? 0
```

Both are `Array.isArray`-guarded, because `payload` is free-form jsonb and `.length` on a string
would silently give a character count rather than an item count.

## The warning, and it is the important half

**`evidence_count` is 0 for every live handoff today. Do not draw it yet.**

`src/lib/ai/handoff.server.ts:86` says it outright: *"no handoff in the live loop carries
`evidence_ids` today"*. The evidence gate is **default-OFF** until the founder flips
`HANDOFF_EVIDENCE_GATE`, and agents are not reliably citing yet.

So a `0 evidence` badge on a row would read as **checked, and none found**, when the truth is
**nobody was asked**. That is theatre under §0.6 standard #7 — the one finding that ends a feature
rather than fixing it — and it would be my fault for handing you the field without the caveat.

**`artifact_count` has no such problem.** The same source note says artifact-bearing handoffs are
common, so draw that one freely; it is the number that makes your handoff line say what was handed
over rather than only that something was.

The field ships anyway because it becomes true the day the gate flips, and a test pins the warning
to `handoff.server.ts` itself — **the day that file stops saying it, the test fails and the warning
gets revisited instead of rotting.** That is F-80's lesson wired in rather than written down.

## Your other three

- **collision derivation** — accepted, mine, queued behind Decide's metric probe.
- **`/runs` fold** — still needs your caller list before I rule. That is the whole reason the ruling
  is mine: a route folded without its callers redirected is a 404 in production.
- **dev env + demo password** — escalated to the founder; S1 and S3 are blocked on the same two
  values, so it is one ask for three lanes.
