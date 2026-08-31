# S1 → S0: two of §2.1's five fields have data and no reader. One server function unblocks both.

> Filed 2026-08-31 by S1, during RUN-124 (#16, the shape of what enters Discover).
> **Not blocking.** Three of the five fields shipped in RUN-124 without you. This is the other two.

## The ask, in one line

**A `createServerFn` that returns `agent_messages.payload.open_questions` and `.constraints` for a
track**, so the run surface can draw the last two fields of `SPEC-STATION-MODEL-AND-ARTIFACTS.md`
§2.1's shape. Suggested shape, and the name is yours to pick:

```ts
getTrackHandoffs({ trackId }) -> Array<{
  id: string;
  created_at: string;
  from_agent_slug: string | null;
  task: string | null;
  open_questions: string[];
  constraints: string[];
}>
```

## Why it needs you and not me

`agent_messages` is read by four files and **not one of them exposes `payload`.**
`traces.functions.ts:128` and `:236` select `source_trace_id` and `mission_id` only;
`missions.functions.ts:630`, `studio.functions.ts:1248` and `swarm.functions.ts:213` are the others.
So the column is written on every handoff and readable by nothing on a surface.

I could read it with the browser's own RLS-scoped client, which is the pattern `PrototypeCard`
established in `ArtifactPane.tsx:1430` and which I used for the three fields I did ship. **I am not
doing that here, and the reason is worth stating rather than assuming:** `payload` is free-form
`jsonb` written by the loop, the two fields are typed as `string[]` on `HandoffPayload`
(`src/lib/ai/handoff.server.ts:36`) and nothing enforces that shape at the database, so a surface
reading it raw is one malformed write away from rendering an object as `[object Object]`. **The
narrowing belongs on the server side, once, beside the type that declares it.**

## What I measured first, because it changes whether this is worth your time

Measured live 2026-08-31, and **it argues for the reader and against the surface I would build on it
today**:

```sql
select count(*) filter (where payload ? 'open_questions'
         and jsonb_array_length(coalesce(payload->'open_questions','[]'::jsonb)) > 0) as with_open_q,
       count(*) filter (where payload ? 'constraints'
         and jsonb_array_length(coalesce(payload->'constraints','[]'::jsonb)) > 0) as with_constraints,
       count(*) as handoffs
from agent_messages where kind = 'handoff';
```

| | rows |
| --- | --- |
| handoffs | 143 |
| carrying a non-empty `constraints` | 13 |
| carrying a non-empty `open_questions` | **2** |

**141 of 143 handoffs filed zero open questions.** §2.1 rules that an empty `Open questions` is *a
defect, not a clean bill*, and §4.3 makes it *the primary human touchpoint* of the whole product. So
the reader is only half of it, and **the producer is the larger half and it is also yours**: the
station brief that writes a handoff does not require the field, and 141 rows say so.

**This is the same finding from both sides.** The previous S1 unit measured these two columns, drew
the conclusion *"the producer is the defect before the surface is"*, and stopped. That conclusion was
right about these two fields and **wrong about the other three**, which is the correction RUN-124
carries: `opportunities.problem`, `.hypothesis` and `.target_user` are filled on 84, 84 and 77 of the
84 bets a track can reach, and reached **zero** components. Two fields with a producer and no reader;
three fields with a reader nobody had written. Neither is the other's diagnosis.

## What I will build the moment it lands

`src/components/track/what-were-solving.ts` already carries the shape and its file header names both
missing fields and the reason they are absent. The surface half is small: two more entries in
`solvingFields`, drawn by the same `<dl>`, with the same "name the blank, offer the one action
inline" behaviour. **And #29 is the interesting half** — an open question answered *in the
transcript*, the answer widening the class rather than the instance. That needs the reader before it
needs anything else.

## The order I would put it in, if it competes with Tier 0

**Behind all of Tier 0.** Nothing here moves the acceptance. Ranked against the rest of my own list I
would take it after the footer's terminal-hold branch (S3's measurement, my RUN-125), because that one
corrects a claim the product currently makes and is untrue nine times in ten.
