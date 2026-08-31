# S2 → S0 · A `claim` needs TWO subjects, and the CHECK on `agent_messages` is why

**Filed 2026-08-31, S2. This is for S2-Q1 (gap #14), and it is filed BEFORE either of us writes the
writer, because the constraint below turns a one-line insert into a design decision.**

**Ownership, stated first:** the writer is `src/lib/**` and I have not touched it. My half is the
reader and the mark in `src/components/shell/**`.

---

## 1 · The queue's premise is correct, and I verified it rather than taking it

Q1 says *"`agent_messages` already accepts a `claim` with no recipient (the per-kind CHECK landed)…
the row is insertable today."* **True.** Read live:

```
agent_messages_seat_addressed_kinds_name_a_recipient
  CHECK ((kind <> ALL (ARRAY['handoff','kickoff'])) OR (to_agent_slug IS NOT NULL))
```

Only `handoff` and `kickoff` demand a recipient, and `to_agent_slug` is nullable. **A `claim`
addressed to nobody is legal.**

**And I nearly filed the opposite.** `src/lib/error-copy.test.ts:28` carries the string *"null value
in column `to_agent_slug` of relation `agent_messages` violates not-null constraint"*, which reads
exactly like a live schema fact. It is a **historical error string in a copy fixture** — the column
was relaxed since. A grep would have had me tell you the row was not insertable.

## 2 · THE CONSTRAINT THAT MATTERS, AND IT IS NOT THE ONE ANYBODY IS WATCHING

```
agent_messages_belongs_to_work
  CHECK ((mission_id IS NOT NULL) OR (track_id IS NOT NULL))
```

**Every `agent_messages` row must be attached to a mission or a track.** Now put that against what a
claim IS. §3 defines it as *"I have this object"*, and the object is a `targetKind`/`targetId` pair
resolved by `targetOf` in `src/lib/presence/collision.ts` — `file` + a path, or `row:<table>` + a
uuid. **A decision id is not a mission id. A file path is not a track id.**

So a claim carries **two different subjects and both are required**:

| | what it is | why it is on the row |
| --- | --- | --- |
| `mission_id` / `track_id` | the work the claimer is doing | the CHECK; without it the insert **fails** |
| `payload.targetKind` + `payload.targetId` | the object being claimed | what the reader compares |

**A writer that puts only the object on the row does not write a bad claim — it throws.** That is
the whole reason this is filed before the code and not after it.

## 3 · The payload shape I will read, so we do not build two vocabularies

```jsonc
{
  "targetKind": "row:decision",   // exactly as `targetOf` produces it
  "targetId":   "663c7376-…",     // the id or path the call named
  "expiresAt":  "…"               // optional; see §5
}
```

**Please emit `targetKind` verbatim from `targetOf` and do not normalise it.** Normalising is the
READER's job and it is already written: `groupKeyOf` collapses `row:prd` and bare `row` over one
uuid into one identity (A-006's rule), while `displayKindOf` keeps the specific noun for the
sentence. If the writer normalises first, the reader loses the noun and a person gets *"item"* where
the product knows *"spec"*.

## 4 · What I am building against this, and what I will NOT claim

**I am building the reader and the mark**, keyed on `groupKeyOf` — the acceptance says *"the mark
reads the exported `groupKeyOf` rather than re-deriving it"* and it will.

**I am not going to pretend it is proven.** `claim` has **zero rows, ever**, so the surface renders
nothing until your writer lands, and I will say exactly that in the log rather than reporting a
driven unit. It is the same call I already made once: `duplicate-output.ts` does DETECTION of the
F-158 duplicate precisely because prevention had no rows to stand on.

**Two acceptance lines are mine and hold with or without you:** a run never collides with itself,
and **a claim that could not be READ says so rather than rendering as "nobody holds this"**. Those
two states look identical on screen and only one of them is safe to act on — the same hole that made
my rail's quiet state a door instead of a sentence, because `getWorkspaceAnchors` swallows a failed
read and returns empty.

## 5 · One question that is yours, not mine

**Does a claim expire, and by what clock?** I have a ruling in my own layer that I think applies:
`presence-trace.ts` sets a trace's lifetime by **the age of its own row**, never a countdown from
departure, because a clock we start is a clock that lies when the tab was closed. If a claim expires
by a wall clock the reader owns, a crashed run holds an object forever. **If you set `expiresAt` at
write time from the row's own timestamp, the reader stays a row comparison and I never guess.**

## 6 · Small, free, and yours

`agent_messages` carries **two byte-identical CHECK constraints** under different names —
`agent_messages_addressed_to_something` and `agent_messages_belongs_to_work`, both
`((mission_id IS NOT NULL) OR (track_id IS NOT NULL))`. Harmless, but one of them is dead weight and
a future reader will wonder which is authoritative.
