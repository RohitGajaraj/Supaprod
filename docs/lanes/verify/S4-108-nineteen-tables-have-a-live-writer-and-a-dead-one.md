# S4-108 · Nineteen tables have a live writer and a dead one, and three of the dead ones are edits

> _S4, 2026-08-27. A narrowing of `S4-104`, built after finding the product-binding case by hand._

## Why multi-writer alone is not the signal

**36 of 117 written tables are written from more than one module**, and most of that is correct.
`artifact_lineage` has **twelve** writers because every station legitimately records lineage.
Reporting that as a defect would be exactly the over-claiming this lane exists to catch, so it is
not reported as one.

## The signal that survives

**A table with a LIVE writer and a DEAD one.** That is a duplicate path where one copy won and the
other was left behind, and it is almost never "staged ahead of a surface", because the surface
already exists and already writes.

**19 tables.** The tool found the case I had already traced by hand, which is why I trust it:

```
connection_bindings
    live:  upsertBinding, removeBinding, addProductBinding
    dead:  upsertProductBinding, removeProductBinding, listProducts
```

## The three rows worth reading first, because they are EDITS

An edit operation on the dead side usually means **a person cannot do that thing at all:**

| table | dead writer | what a person cannot do |
| --- | --- | --- |
| `tasks` | **`updateTask`** | change a task after it exists |
| `missions` | **`renameMission`** | rename a run |
| `projects` | **`updateProject`** | change a product's details |

Each is either a surface that was never built, or one built against the other writer. **Both answers
are worth knowing and neither is visible from the source of the function itself**, which reads
perfectly well.

## One of the three, diagnosed rather than left ranked

**`renameMission` appears exactly once in the whole repo: its own definition** at
`missions.functions.ts:848`. There is a rename UI in `ArtifactPane.tsx`, and it renames a **theme**
(`renameTheme`), not a mission.

**So a person cannot rename a run.** The capability was written and no surface can reach it.

### And that corrects my own framing above

I called these "a duplicate path where one copy won". **`renameMission` is not a duplicate of
anything.** The `missions` table has live writers — `startOrchestratedMission`, `cancelMission`,
`promoteMission` — but none of them renames. The table is in use; this *operation* is not.

So the check's real meaning is narrower and better than the words I gave it:

> **The table is live, so this is not a dead feature area. This particular operation has no caller.**

That distinction decides what to do with the row. A duplicate gets deleted; an unwired operation gets
a surface or gets deleted deliberately. **`connection_bindings` is genuinely the first kind and
`missions` is the second, and my original framing collapsed them.**

## The rest of the nineteen, by table

`tasks`, `sync_mappings`, `connection_bindings`, `signals`, `missions`, `artifact_lineage`, `prds`,
`projects`, and eleven more. `sync_mappings` is notable for having three dead writers —
`dispatchPRDToLinear`, `importLinearIssue`, `createLinearIssuesFromTasks` — against four live ones,
which is a whole integration direction that may never have been wired.

## What I am not claiming

- **A dead writer is not proof the operation is impossible.** The live writer may cover it under a
  different name, which is exactly what happened with `getNeedsYou` and `getApprovalsQueue`.
  `updateTask` may be covered by `createTask` upserting.
- **The table attribution is textual**: `.from("x")` followed within 200 characters by an
  `insert`/`update`/`upsert`/`delete`. A writer that builds its query across a longer span is missed.
- **I did not open any of the three edit cases.** They are ranked, not diagnosed.
