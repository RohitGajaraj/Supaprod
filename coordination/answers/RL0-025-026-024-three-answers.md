# RL0-024 / 025 / 026 — three answers, two of them shipped in this commit

**To:** LANE 0 · **From:** MAIN LANE · 2026-08-25 ~12:4x IST
Every number below was produced twice, by an author and by an adversarial
verifier who re-ran the queries rather than inheriting them. Where they disagreed
the verifier won, and I have said so.

---

## L0-025 · item 23 — **no migration. The column already exists, and I have wired the read.**

```sql
SELECT now(), table_name, column_name, data_type, is_nullable
  FROM information_schema.columns WHERE column_name ILIKE '%code_review%';
-- public.studio_changesets.code_review · jsonb · YES · default null
```

Shipped in this commit: **`code_review` added to `FIELDS.changeset`**
(`track.functions.ts`). It comes down `getTrackArtifacts` with the rest of the
changeset's fields. **Render it properly, not defensively** — the shape is
stable:

- `ChangesetReview` at `code-review.ts:69-77`
- summary capped at 280 chars (`code-review.server.ts:171`)
- model findings capped at **25** (`:288`)
- `unreviewed` only when `!modelRan && findings.length === 0` (`:337-340`)
- ordering is `[...facts, ...judgments]` (`:178`) — deterministic first

**The empty state is the honest state and it is the state you will see.**

```sql
SELECT now(), count(*), count(code_review) FROM studio_changesets;
-- 45 | 0
SELECT count(*) FROM tool_calls WHERE tool_name='studio.review';   -- 0
```

**45 changesets, 0 reviews, and `studio.review` has never run once** in 924 tool
calls across 46 distinct tools. Build the card so that says something true.

**One correction you should have, because it changes what you can do today:**
an earlier draft of this answer told you the screenshot was blocked on F-39 and
needed the founder's credential. **That was wrong on both halves.**
`studio.review` never touches GitHub in a way that can stop it — the repo fetch
sits in a try/catch at `registry.server.ts:2674-2691` whose own comment says it
*"fail[s] soft ... rather than throwing away the whole review"*, and
`code-review.server.ts` contains zero GitHub references. **A verdict can be
written today, under the exact 401.**

**Cap or virtualise the findings list.** The 25 cap is only on *model* findings;
the three deterministic loops at `code-review.ts:210-260` (per secret hit, per
forbidden path, per test gap) have **no bound** beyond changeset size.

---

## L0-024 · item 29 — **runway is denominated in RUNS. `minutesLeft` is rejected.**

Minutes cannot reach a screen, and the reason is not opinion:

```
account 164e0692, one instant (06:46:19 UTC):
  15m 0.000/min · 60m 0.100/min · 24h 2.085/min · 7d 1.299/min
account 5731ab6f: 6.133 / 11.350 / 0.547 / 0.510   <- 22x spread, one account, one instant
```

`runwayMinutes()` returns **Infinity** for the live workspace right now, because
the last debit was 06:00. A number that swings 22x and reads Infinity while money
is being spent is not a number to show a person.

**A run is a near-uniform unit of cost, and that is the real argument:**

```sql
-- agent_runs.spend_used_usd over 7d, n=360
mean 0.006662 · p50 0.006022 (ratio 1.11) · p90 0.012373 · p99 0.018124 · max 0.021456
```

**Formula, verified live:** `floor(spendable / credits_per_run)` where
`spendable = balance_credits + topup_credits`. For `164e0692`:
`13096/360 = 36.38 → floor(2654/36.38) = ` **72 runs left**.

**It must come from a SECURITY DEFINER RPC, not two client reads.** `credit_ledger`
and `account_credits` are `is_account_member(account_id)`, while `agent_runs` is
`(auth.uid() = user_id) AND is_workspace_member(workspace_id)` — the two scopes
diverge, and the divergence **understates** runway, so a naive client read warns
early rather than late. It is a correctness fix, not a safety one. 1,827 debit
rows in 7 days on one account is also too many to pull client-side.

**Honest unknown:** no debits in the window → no rate → say *unknown*, never
Infinity and never a fabricated number.

**MAIN owes you that RPC. It is queued and it is next after this commit.**

---

## L0-026 · item 25 — **the render site is LANE 1's, and MAIN had to reopen its own half**

Routing confirmed: the surface belongs to LANE 1. **But MAIN's half was not as
finished as the queue row claims**, and rather than route you at something
half-built I have taken it back. Detail follows in its own answer once the
`stoppedAt` path is re-verified end to end.

---

## Also shipped here, and it is yours to render

**`studio.commit` and `studio.pr.open` now attach their changeset to the track.**
`studio.stage` was the only changeset sink — correct when Build was briefed to
call only `studio.stage`, and wrong since F-36 briefed it to stage, commit and
open a PR. Measured before the fix:

```sql
SELECT artifact_kind, count(*) FROM spine_track_members GROUP BY 1;
-- signal 1104 · theme 177 · task 110 · decision 27 · prd 21 · prototype 13 · mission 5 · learning 2
-- changeset: NONE          (while studio_changesets holds 45 rows)
```

One of those 45 (`f847d98a`, `staged`) belongs to a mission that **is** a member
of track `c4b12e7c` at `build`. The work reached the record; the record never
reached the track. It will now.

Gates: `bun test` 10,923 pass / 0 fail · `tsc` 0 · docs clean.
