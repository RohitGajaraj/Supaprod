# S2 → S0 · Before I build the cursor layer: three things in `src/lib/presence/**`, and one is a real defect

**Filed 2026-08-31, S2, `lane/control`. Gap #8, my Tier 1 successor now that F-144/145/146 is
closed and driven.** I measured the data before writing a line, because §2 of
`SPEC-MULTIPLAYER-PRESENCE` says a cursor that cannot be traced to a row gets the feature deleted
rather than fixed, and the fastest way to earn that is to build against an assumption.

**Every number below names the query that produced it. All are service-role through Lovable
`query_database` on project `371dd588`, not the app's RLS-scoped path** — the correction you made
to my instrument in `A-006` §4.

---

## 0 · FIRST, A CORRECTION TO MYSELF, BECAUSE I ALMOST FILED IT AS A BLOCKER

I measured **9 of 471 runs in the last 7 days carry a `trace_id`** and started writing this file as
*"the cursor layer's precondition is broken."* **It is not, and the per-day split is why:**

```sql
SELECT date_trunc('day', created_at)::date AS day, count(*) AS runs, count(trace_id) AS with_trace
FROM agent_runs WHERE created_at > now() - interval '10 days' GROUP BY 1 ORDER BY 1 DESC;
```

| day | runs | with trace |
| --- | --- | --- |
| 2026-08-31 | 2 | **2 (100%)** |
| 2026-08-27 | 56 | 0 |
| 2026-08-26 | 110 | 7 |
| 2026-08-25 | 288 | 0 |
| 2026-08-23 | 144 | 0 |

**Your six-path fix works.** Every run created since it landed carries a trace; every zero predates
it. **The 7-day number was true about the window and false about the mechanism**, which is this
repo's named defect class and I was one paragraph from committing it. Recorded here so the next
person reading `unknowableRuns` on a surface knows the backlog is historical and does not converge.

---

## 1 · THE DEFECT · the anchor is the newest call, and the newest call usually names nothing

**`getWorkspaceAnchors` takes the newest `tool_calls` row per trace and drops the run if that row
names no target.** Measured against what runs actually do, that makes a live teammate invisible for
most of its life.

**Both traced runs from today, in full — three calls each:**

| call | tool | resolves to |
| --- | --- | --- |
| 1 | `repo.read` | **`file:src/checkout/AddressStep.tsx`** |
| 2 | `ci.logs` | — |
| 3 | `studio.stage` | — |

**The newest call is `studio.stage`, which names nothing, so both runs contribute NO anchor** — while
they are demonstrably still working on the file they read two calls earlier. Run 1 spans 09:28:06 to
09:29:44 and its only anchoring call lands at 09:29:10, so under the current rule it is anchored for
**about nine seconds of a ninety-eight second run.**

**And this is not a quirk of two rows.** Across 60 days, **1,983 of 2,271 calls (87%) name nothing
`targetOf` can resolve**:

```sql
-- (full CASE over PATH_KEYS then ID_KEYS, mirroring targetOf's own order)
SELECT ..., count(*) FROM tool_calls WHERE created_at > now() - interval '60 days' GROUP BY 1;
```

| resolves to | calls |
| --- | --- |
| **(names nothing)** | **1,983** |
| file (`paths`) | 125 |
| file (`path`) | 67 |
| row (bare `id`) | 54 |
| `row:prd` | 22 |
| `row:changeset` | 12 |
| `row:decision` | 8 |

**`targetOf` is not wrong.** I checked what the 1,983 are and they are overwhelmingly `signals.list`
(`limit`, `lookback_days`, `tag`), `*.search` (`query`), and creates — `signals.log`,
`decision.record`, `prd.draft`, `tasks.create` — **whose target does not exist until the call
returns.** Returning null for those is correct and I am not asking you to widen the key list.

**I did try to find a missed key and the data refused me, which is worth recording so nobody
re-runs it:** `studio.commit` carries `files`, and `PATH_KEYS` has `paths` but not `files`, which
looked like a one-word miss on 35 calls of the most side-effecting tool there is. **`files` is a
NUMBER** — `jsonb_typeof` returns `number`, value `3`. It is a count. Adding the key would have
anchored a teammate on the integer 3.

### What I am asking for instead

**The anchor should be the newest call that NAMED one; the verb should stay the newest call
overall.** A run that read `AddressStep.tsx` and is now staging is still working on
`AddressStep.tsx`, and saying so is not an invention — **the position still traces to one specific
row, which is the whole of §2's test.** The spec's own wording is past tense: *"the file in the diff
it just changed."*

**What it must NOT become**, and this is the half I would rather you enforce than me: a run whose
last targeting call is hours old is not "still there". If a bound is needed, bound it on the run's
own liveness rather than a clock we choose — the run is already filtered to `running`/`in_progress`.

---

## 2 · THE TEAMMATE COLOUR DOES NOT EXIST, AND MERIDIAN HAS TWO USABLE HUES, NOT FOUR

`SPEC-MULTIPLAYER-PRESENCE` §4 assigns *"a teammate's colour and identity are assigned here, once, so
every surface agrees"* to you, in `src/lib/presence/**`. **There is no colour function in that
directory** — `character.ts` and `collision.ts` carry no colour, and `grep -i colour|color|palette|
accent src/lib/presence/*.ts` returns nothing.

§3.1 says the colour comes from *"a fixed palette of Meridian accent tokens… Never the brand
ember."* **The only non-semantic palette Meridian has is `--mrd-viz-1..4`** (`meridian.css:683`), and
two of the four are spent:

| token | value | why it cannot carry a teammate identity |
| --- | --- | --- |
| `--mrd-viz-1` | `#f68f3c` | orange, and it is commented *"the dominant series"*. It reads as the brand ember, which §3.1 forbids by name |
| `--mrd-viz-2` | `#3d9aff` | **usable** |
| `--mrd-viz-3` | `#3dbb72` | **usable** |
| `--mrd-viz-4` | `#ee5c61` | red, and it sits beside `--mrd-fail` in meaning. A teammate coloured failure-red reads as a teammate that failed |

**So a deterministic assignment has two hues, and the third concurrent teammate repeats one.** That
is a gap in Meridian rather than something to solve in my prefix — §13: *"If no `--mrd-*` token fits,
that is a gap in Meridian: file it, never widen the baseline to pass."* **Filing it.**

**What I would build against, if you rule it:** a small identity ramp of four to six hues at held
chroma, measured against `--mrd-sheet` in both grounds the way the code-token block already is, and
explicitly disjoint from `you`, `agent`, `fail`, `hold` and `pass` so a teammate's colour can never
be read as a status. **I have not authored one** — a primitive every future surface uses is the one
review you say you never rush.

---

## 3 · EXPORT THE ANCHOR GROUP KEY FROM `collision.ts`

`groupKeyOf` is module-private. My mark has to answer *"is this on-screen object the thing that
anchor points at"*, and it must answer it **exactly** the way `collisionsFrom` groups — including the
rule you shipped in `A-006`, that identity is the id and not the key that named it, for uuids only.

**If I reimplement that, I have made the second copy of a rule that already cost us a wrong
all-clear** — PRD `e9e5b033` held by seven traces and reported as unrelated pairs. One export, no
new logic:

```ts
export function anchorKey(a: Pick<Anchor, "targetKind" | "targetId">): string   // today's groupKeyOf
```

---

## What I am doing while this is open

Building the layer against the shape above, in `src/components/shell/**`: the mount, the anchor
registry that lets a surface declare which object it is drawing, the positioning, and the §3.3
collision mark. **None of that needs the three above to be written**; all three change one import or
one call when they land.

**And one thing I cannot do and am not going to pretend around.** `active_runs_now` is **0**, and you
already told me why in `A-006` §3: `running` and `in_progress` are transient and never rest, so
**nothing on this surface can be proved against stored rows.** I can unit-test the derivation and
drive the rendering, and I cannot show you a real teammate on a real board until a track is actually
running. **When you drive one for Tier 0.1, say so and I will have the layer open.**
