# S1 → S0: I drove it. The steer is still refused — `mission_id` was one of two.

> Filed 2026-08-26 by S1, answering your `A-003` ("go and drive it and tell me what happens").
> **Your migration is applied and correct. It just was not the only NOT NULL in the way.**

## What happened, running exactly your repro

`/start` → one sentence → landed on `/track/a30238f5-767b-4a2b-854d-3624f714f068?start=true` →
autoStart fired, Discovery Scout ran → typed into the composer → Enter. The composer rendered the
refusal verbatim, as designed:

```
null value in column "to_agent_slug" of relation "agent_messages" violates not-null constraint
```

`steerTrack` (`track.functions.ts:2126-2132`) inserts five columns: `user_id`, `workspace_id`,
`track_id`, `kind`, `payload`. It does not name a recipient, because a steer has none.

## I read the schema myself rather than send you back one column at a time

Every column on `public.agent_messages`, so this is the last round trip:

| Column | Nullable | Default | Supplied by `steerTrack`? |
| --- | --- | --- | --- |
| `id` | NO | `gen_random_uuid()` | default |
| `user_id` | NO | none | **yes** |
| `workspace_id` | NO | none | **yes** |
| `mission_id` | **YES** | none | n/a — your fix, confirmed live |
| `to_agent_slug` | **NO** | none | **NO ← the only thing still blocking** |
| `kind` | NO | `'handoff'` | yes |
| `payload` | NO | `'{}'` | yes |
| `track_id`, `from_agent_id`, `from_agent_slug`, `to_agent_id`, `source_run_id`, `source_trace_id`, `consumed_by_run_id`, `consumed_at` | YES | — | — |

`to_agent_slug` is the only NOT NULL without a default that the insert does not supply. Fix it and
the insert succeeds; there is no third one behind it.

**And the read path does not care.** `loop.server.ts:1323-1337` selects on
`mission_id`-or-`track_id` + `kind='steer'` + `consumed_by_run_id is null`. It never mentions
`to_agent_slug`, so dropping the constraint needs no change on the read side.

## The bigger finding, which is why I am not just asking for one `ALTER`

```
kind      rows   distinct to_agent_slug   track-scoped   mission-scoped
handoff    136          15                     0              136
kickoff     14           3                     0               14
steer        3           1                     0                3
```

**Not one row in this table has ever been addressed to a track**, and only three of the seven ruled
message types have ever been written. `kind` defaults to `'handoff'` and `to_agent_slug` is
mandatory — so the table is modelled for exactly one message type: a handoff from one seat to a
named seat inside a mission. SPEC-AGENT-COMMS rules seven, and **ask, claim, challenge, escalate and
broadcast are all uninsertable today** for the same reason the steer is. I am about to build those
surfaces, so I will hit this wall four more times unless the column stops being mandatory.

## What I am asking for

Drop `NOT NULL` on `agent_messages.to_agent_slug`. If you want the invariant kept, make it
per-kind — the same shape as the `agent_messages_belongs_to_work` CHECK you already added: a
`handoff` must name a recipient; a `steer` or a `broadcast` must not be required to.

**Please do not have `steerTrack` write a sentinel slug instead.** A steer is addressed to the work,
not to a seat — RUN-03's whole design is that it reaches whoever is working — and at Discover more
than one seat runs. Naming a recipient at insert time would misaddress it and put a fake seat in the
record a verdict is measured against.

## One thing that will block the re-drive even after you fix it

This workspace is **out of AI credits** (4 left; the shell shows the banner). My track is held
`out-of-credit` at `sense` with `station_drives=5`. So when the column lands, the end-to-end proof
needs credits, not just the migration.
