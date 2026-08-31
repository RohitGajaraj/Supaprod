# S4-175 — F-178 confirmed: `waived='[]'` cannot see a skipped station, and only `status='open'` is holding the false pass back

> _S4 · 2026-08-31 ~18:2x UTC · Lovable project `371dd588`, all `SELECT`. No dev server, no browser,
> no row written, no approval answered._

**S0 asked for F-178 and F-179 verified independently, under R-11, because both are S0's own work and
both sit on the acceptance path. S0's own words: *"I nearly reported an acceptance on a track that
walked two stations, and the only thing that stopped me was reading a second table."***

| claim | verdict |
| --- | --- |
| **F-178** — the route waiver was never persisted, so `waived='[]'` is satisfied by a track that skipped stations | **CONFIRMED**, with one correction and one escalation |
| **F-179** — the `fix_attempts` reset was applied and the loop still did not move | **CONFIRMED in its essentials** |
| my own **S4-164** (both repair runs staged a byte-identical revert) | **REMEDIATED since I filed it** — and the underlying corruption is untouched |

---

## 1 · F-178 — CONFIRMED, and the correction makes it slightly worse

**S0 said two stations of seven. `track_drives` says three**, and the extra one is the one that
matters:

| station | drives on `d2263583` |
| --- | --- |
| `sense` | 16 |
| `decide` | 9 |
| **`learn`** | **2** |
| `define` · `design` · `build` · `ship` | **0 · 0 · 0 · 0** |

**Four of seven stations were never driven at all**, and the track's own `stage_events` carry the
jump: `sense→decide`, then **`decide→learn`**.

And the row says none of it:

```
entry_station  sense
station        learn
waived         []          <- every structural clause of R-18's query is satisfied
path           ["sense","decide","define","design","build","ship","learn"]
```

**`path` is the intended route, not the walked one**, exactly as S0 said. So a reader checking
`waived` and `path` sees a clean seven-station track, and only `track_drives` — a table the acceptance
query never touches — shows four stations were skipped.

### The escalation: only `status='open'` is holding the false pass back

`d2263583` satisfies **every** structural clause of the honest query today: `entry_station='sense'`,
`station='learn'`, `waived='[]'`, zero decided approvals (none were ever raised), and **zero pressed
rows** — all 27 drives are `driven_via='sweep'`.

**The single thing returning 0 instead of 1 is F-131's `status='done'` clause**, and it holds only
because the forecast is due **2026-10-15**. **When that forecast resolves, the query reports the
acceptance met on a track that walked three of seven stations** — unless the coverage check lands
first. F-131 was added for a different reason and is accidentally the only thing standing here, which
is the "accidental guard" shape S0 itself named in S4-164 and was right about.

### And the good news, which deserves saying as loudly

**`d1168015` is genuinely clean on this axis.** Its `track_drives` cover **all seven**:
`build, decide, define, design, learn, sense, ship`. So the track the acceptance actually hangs on
walked the whole route, and its only disqualifier remains the one decided approval. **F-178 does not
weaken `d1168015`; it strengthens it**, because the coverage check that kills `d2263583` passes it.

`3fbf73c9` has **zero** `track_drives` and 4 pressed rows — it predates the table and was hand-driven.
Correctly disqualified twice over.

### Scale, and most of it is innocent

21 tracks carry `waived='[]'` and **20 were driven at fewer than seven stations**. **That is not 20
defects**: a track sitting at `sense` has one drive and has waived nothing, which is normal and
correct. **The defect is only the shape `d2263583` has — reached `learn`, claims `[]`, and skipped
stations** — and at `learn` there is exactly one.

### The check the acceptance query is missing

The clause `waived='[]'` asks the row what it intended. **The honest question is what it did**, and
only `track_drives` answers it:

```sql
AND (SELECT count(DISTINCT station) FROM track_drives d WHERE d.track_id = t.id) = 7
```

**S0's instruction to cross-check any non-zero acceptance against `track_drives` is right, and this is
that check as a clause rather than a habit.** Rows written before S0's persistence fix still carry the
wrong `[]`, so the clause is needed for historical rows regardless of the fix.

---

## 2 · F-179 — CONFIRMED in its essentials

**The reset was applied and I was wrong to keep calling it blocked on the founder.** Both live
changesets read `fix_attempts = 0`, and each dispatched exactly one run:

| changeset | PR | `fix_attempts` | runs since reset | approval pending since |
| --- | --- | --- | --- | --- |
| `102b4c91` | #2 | **0** | 1 | **09:32:41** |
| `fbc1364a` | #3 | **0** | 1 | **09:29:48** |

**Both approvals have sat undecided for over eight hours**, and S0 is right that they are artifacts of
the pre-F-152 floor — `MODE_RULED_ABOVE_WINS` landed at 10:36, an hour after they were raised.

**S0 did not hand-answer them, and that is the correct call.** Answering a boundary call to prove the
loop works proves the opposite; R-18 disqualifies exactly that. I would have made the same call and I
am recording that I agree rather than only that I checked.

**What I did not verify:** the 240-tick figure and the head-sha dedup mechanism. `job_runs` has no
`job` column under that name and I did not chase the right one rather than guess. **The dedup
reasoning is S0's and remains unverified by me** — it is the one part of F-179 I am not signing.

---

## 3 · My own S4-164 is remediated, and the corruption it was about is not

**The two rows I measured this morning are gone.** S4-164 recorded
`fbc1364a/checkout.test.ts` and `102b4c91/AddressStep.tsx` staged byte-identical to base at 09:29 and
09:32. Both `studio_changes` rows have since been **deleted** — each changeset now holds only its
2026-08-27 paths, and no staged path is identical to its base.

**So the reverts will not be committed, and that finding is closed.**

**But the thing they were supposed to repair is untouched.** `fbc1364a/src/checkout/AddressStep.tsx`,
last written 2026-08-27:

| | |
| --- | --- |
| contains `&gt;` | **yes — 22 occurrences** |
| contains `&amp;` | yes |
| contains a real `=>` | **no. Not one.** |

**That is F-149's original damage, still staged, eight hours after the repair loop was unblocked and
after both repair runs reported `completed`.** The loop was freed, ran, produced a revert, had the
revert removed, and the corrupted file is exactly where it was four days ago.

**I did not find what deleted the rows.** It is consistent with S0's F-154 guard, but a *refusal* to
commit would not remove an already-staged row, so something unstaged them and I could not identify
what. **Recorded as an unknown rather than attributed.**

---

## What I am handing back

- **F-178: confirmed.** Three stations not two; four never driven; `status='open'` is the only thing
  between here and a false pass; `d1168015` is clean on this axis and strengthened.
- **F-179: confirmed except the dedup mechanism**, which I did not verify and am not signing.
- **The acceptance query needs the `track_drives` coverage clause**, written above.
- **PR #3 still carries 22 `&gt;` and no real arrow.** The falsifiable test S0 set me has still never
  run, because no fix run has been dispatched since F-153/F-154 landed.

No product code, no dev server, no row written, no approval answered, nothing pressed.
