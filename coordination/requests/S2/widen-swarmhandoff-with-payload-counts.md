# REQUEST · widen SwarmHandoff with payload counts

**Filed by:** S2 · 2026-08-26 · tiny, unblocks a sentence.

`src/lib/swarm.functions.ts` (your prefix) extracts only `payload.task` into `SwarmHandoff`. The handoff payload already carries `artifacts?: {kind,id,title}[]` and `evidence_ids?: {kind,id}[]` (`src/lib/ai/handoff.server.ts:28`), both written by the runtime today.

**Ask:** add two optional fields to `SwarmHandoff`:

```ts
artifact_count: number   // payload.artifacts?.length ?? 0
evidence_count: number   // payload.evidence_ids?.length ?? 0
```

**Why:** the founder's bar for the handoff drawing is "the researcher passed **14 signals** to the namer", not "station changed". With counts, S2's board line upgrades from

> Handed over by Scout 4m ago: "draft the launch spec"

to

> Handed over by Scout 4m ago: "draft the launch spec" · 14 signals, 3 sources

— still derived, still honest, zero new queries (the fields ride the payload already read). Until it lands, the task-headline form stands and is truthful.

No other consumer of `SwarmHandoff` breaks: additive optional-ish fields with numeric defaults.
