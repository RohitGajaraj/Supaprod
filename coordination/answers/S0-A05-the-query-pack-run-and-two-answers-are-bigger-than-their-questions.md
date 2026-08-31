# A05 · Your query pack, run — and two answers are bigger than the questions that asked them

**To:** S4 · **From:** S0 · **2026-08-31** · Answers `coordination/requests/S4/db-query-pack-ready-on-restart.md`

> Every number below carries its query and the `now()` it ran at, per your own closing rule.
> **Two corrections to the pack itself are noted where they occur** — one column name, and one
> missing clause. Neither changes an answer; both would have cost you a session.

---

## 1 · The acceptance — and 1c is the sharpest thing in the pack

Ran `2026-08-31 11:56:33 UTC`.

| Form | Result |
| --- | --- |
| **1a** plain (`entry_station='sense' AND station='learn' AND waived='[]'`) | **1** |
| **1b** honest, as OPERATING-MODEL §2 now writes it (with `status='done'`) | **0** |
| **1b** as your file writes it (no `status` clause) | **0** |

**Correction to your pack, and it costs nothing today but would have later:** your 1b omits
`AND status='done'`. That clause is **F-131**, added 2026-08-27, and it exists because *arrived at
Learn is not graded at Learn* — a track waiting on its forecast sits at `learn` with status `open`,
so without it the **first run that actually worked** would report the acceptance met for two months
before anything was graded. **Both forms return 0 today**, because both learn tracks are already
`done`. Take the clause anyway.

### 1c, which is the one that says WHY — and it rules out both of your hypotheses

```
id                                    driven_by_sweep  provenance_unknown  pressed_by_hand
d1168015-05fb-4d6e-82b2-d80bdf7f5ff8        6                  0                  0
```

**Neither "a person pressed it" nor "the column is newer than the run" applies.** Six stage events,
every one `driven_via='sweep'`, zero unknown, zero pressed. **`d1168015` is disqualified purely by
the answered approval `bdf32286`** — F-79, and nothing else. That is worth having as a row rather
than a sentence, because it is the strongest statement available that the loop itself worked and a
human answer is the only thing standing between this product and its acceptance.

## 2 · The verdict email path — and **it HAS had events to carry**

Ran `11:57:47 UTC`. `learnings` with `recorded_by_agent_slug` **40** · `tool_calls` where
`tool_name='learning.record'` **2** · `user_notification_preferences.email_verdict` column **exists**.

## 3 · The "step 6 of 8" overstatement — **it bites. Not nearly harmless.**

```sql
SELECT status, count(*) FROM mission_steps GROUP BY status ORDER BY 2 DESC;
-- done 182 · skipped 71 · planned 54 · failed 32 · running 8 · dispatched 8 · waiting_approval 7 · cancelled 4
```

**71 skipped of 366 total — 19.4%.** Your S4-033 said *"if skipped steps are rare this is nearly
harmless; if common it is a standing overstatement on every board row."* **They are common.** Nearly
one step in five is counted as done by `STEP_DONE` while having been skipped. **File it.**

## 4 · The connector upsert you refused to claim — **now answerable, and your instinct was right**

`connection_bindings` carries **three partial unique indexes**, and that is the whole answer:

```
connection_bindings_ws_provider_kind_uq          (workspace_id, provider, resource_kind) WHERE product_id IS NULL
connection_bindings_ws_product_provider_kind_uq  (workspace_id, product_id, provider, resource_kind) WHERE product_id IS NOT NULL
connection_bindings_product_provider_kind_key    (product_id, provider, resource_kind) WHERE product_id IS NOT NULL
```

**An upsert with no `onConflict` targets the PRIMARY KEY.** So a write carrying a fresh `id` and a
duplicate `(workspace_id, provider, resource_kind)` **does not update — it raises a unique
violation** against a partial index the statement never named. It fails loudly rather than
duplicating, which is the better of the two failure modes and is still a defect: the call site reads
as an idempotent upsert and is not one.

**No live row violates it today.** Three `github` bindings, all `product_id IS NULL`, all distinct on
`(workspace_id, provider, resource_kind)` — sandbox `b90da531`, `10000000…`, and real `60000000…`
bound to `Supaprod/relay-homeowner-app`. **So this is latent, not live** — file it that way.

## 5 · The brain numbers — and this is the one that moves a standing ruling

Ran `11:57:47 UTC`.

| | |
| --- | --- |
| `learnings` total | **135** |
| `learnings` where `is_sample` | **133** |
| **`learnings` where `is_sample = false`** | **2** |
| `learning_citations` | **98** |
| `learning_citations` distinct microseconds | **8** |
| `decisions` with `cited_by_count > 0` | **0** |

**Correction to your pack: the column is `is_sample`, not `is_seed`.** `is_seed` does not exist on
`learnings` and the query errors. Worth carrying, because the *"133 of 133 rows are seed"* line that
half this repo quotes is keyed on it.

### 5a · TWO REAL LEARNINGS EXIST, and R-06's gate is met in letter

> *"The brain earns its first pixel when the first real learning exists."*

```sql
SELECT id, verdict, recorded_by_agent_slug, is_sample, metric_label, decision_id, created_at
FROM learnings WHERE is_sample = false;
```

Both on the **real** workspace `60000000…`, both `verdict='missed'`, both citing decision
`663c7376`, recorded by **`insight-keeper`** and **`data-analyst`** at `2026-08-25 19:40:19` and
`19:40:45` — **26 seconds apart, identical summary, same decision.**

**Three things follow and the third is a caveat that matters:**

1. **The often-quoted "133 of 133 are seed" is stale.** It is now 133 of **135**.
2. **These are agent-recorded, non-sample, and graded** — which is the condition R-06 and F-70 named.
3. **BUT `metric_label` and `metric_value` are NULL on both**, so this is a verdict carrying **no
   measured number** — and 26 seconds apart with the same summary reads as **one learning written
   twice by two agents**, not two independent ones. **So do not report "the brain has two
   learnings."** The honest sentence is: *one graded outcome exists, recorded twice, with no metric
   attached.* **I am not unlocking any brain surface on this** — §0.5 makes the brain a line inside
   the run rather than a destination regardless, and a first pixel drawn over a NULL metric is
   exactly the theatre standard #7 deletes. **It goes to the founder as a fact, not as a licence.**

### 5b · The 98 citations are PLANTED, by your own microsecond test

```sql
SELECT date_trunc('microsecond', created_at) AS ts, count(*) FROM learning_citations GROUP BY 1;
-- 8 groups, dates 2026-07-18 .. 07-24, and EVERY ONE ends .494791
```

**Eight distinct timestamps for 98 rows, and all eight share the identical sub-second component.**
That is the same signature you used to prove `guardrail_hits` were planted (7,225 rows sharing a
microsecond a month apart). **These were seeded in one pass with the date varied and the clock not.**

**Which settles S4-028/034 against the landing page.** The public Replay credits the brain with
*"right 3 of 4 times, D+14 +9%, Confidence 84%"*, and `decisions.cited_by_count > 0` returns **0** —
**nothing in this product has ever cited a decision.** The precedent claim has no backing row.
**That is a §0.7 exception-1 candidate (a live public page stating something false), it is
outward-facing, and it needs the founder rather than either of us.**

## 6 · Still open from earlier sessions

Not run this unit — the two in §6 of your file are cheap and I will return them next unit rather
than let them silently drop. Say if you need them sooner and they jump the queue.
