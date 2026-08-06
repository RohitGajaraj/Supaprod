# Session handoff

> _Last updated: 2026-08-06 ~16:30 IST · soft launch is THIS WEEK_

Read [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §0 first. This file is only what the last session left open.

---

## Two things need a person. Nothing in code can discharge either.

### 1. Settle one real outcome, and watch the brain receive it

**This is the last honest gap before launch.** Four surfaces claim to read a precedent pool that has never held a single row.

`agent_memory` holds **zero** rows of `kind='outcome'` against 119 learnings. The cause is not a bug: all seven specs carrying an outcome are seed rows with `settled_by` null and neither `settled_memory_id` nor `settled_memory_error`, which means **`applyOutcome` has never completed in this database**. Every agent that has read the write path concluded it is correct. It has simply never run.

So:

1. Pick a workspace that is **not** a sample — `select id, name, is_sample from workspaces order by is_sample, name;`
2. Open `/learn` standing in it and settle one shipped, unsettled spec **through the UI**, not the agent sweep, so the human path is the one under test.
3. Then confirm all three:

```sql
-- must return one row
select id, kind, created_at from agent_memory where kind = 'outcome' order by created_at desc limit 1;
-- must be non-null
select outcome->>'settled_memory_id', outcome->>'settled_memory_error' from prds where outcome is not null order by updated_at desc limit 1;
-- must return one row: today it returns zero for every user in the database
select l.id, l.new_ice, w.name from learnings l join workspaces w on w.id = l.workspace_id
where l.new_ice is not null and w.is_sample = false;
```

Until the third query returns a row, `/decide`'s re-rank subtitle and its record recess have never once been seen in the state this session fixed them to produce.

### 2. Decide whether eight stranded missions should start running

`supabase/migrations/20260806140000_eight_missions_were_launched_into_a_word_nothing_reads.sql` is **committed and deliberately NOT applied**, because applying it is a product decision, not a repair.

Eight missions sit at `status='queued'`, a state nothing consumes. Six came from the auto-promote in `trigger-tick`, two from the human launch button. Both writers are fixed, so no new ones will strand.

**If you deploy the code and do nothing**, `resume-runs` adopts all eight into `running` on its first tick (~1 minute). Four fail immediately on a workspace foreign key and get halted 20 minutes later. The other four are month-old goals in demo workspaces that will **actually run orchestrator loops and spend money**. Nothing is lost either way. The only question is whether you want four month-old demo missions springing to life during launch week.

Read the migration; it states both options.

---

## Applied to production today, and recorded

The schema history had been drifting from the repo all session. It is back in sync, and a full diff proved no other drift exists: of 33 repo migrations not recorded, 32 pair to a database record within 15 seconds (the re-stamp the apply tooling does) and one was the deliberate hold above.

| Version | What |
| --- | --- |
| `20260806100000` | `prds.outcome_check_by` — a bet can be too early to judge |
| `20260806103000` | the Learn desk had nothing on it, in any workspace |
| `20260806120000` | `prds.is_sample` — a spec drawn from an example is an example |
| `20260806164500` | **the launch blocker**: `decisions_source_kind_check` did not admit `'opportunity'`, so every Keep-it and Drop-it at `/decide`'s gate was refused by the database and swallowed. 276 decision rows, zero from the gate. Widened and verified. |
| `20260806170000` | `prd_scaffolds.critic_review` — a drawing's review belongs to the drawing, not to the spec's red-team column that five surfaces read whole |

---

## What the audits found, and where the record lives

Four read-only audits ran today. **Their findings are the asset**, and every claim in them was checked against live production data through the Lovable MCP, with each synthesis re-reading the code and dropping what did not survive. Saved outside `/tmp` because macOS clears it on reboot:

`~/.claude/projects/-Users-rohitgajaraj-Projects-My-Projects-My-Builds-Supaprod/carry-forward/`

- `seam-findings.json` — the seven linear station seams. 31 breaks: 7 blockers.
- `nonlinear-findings.json` — skips, external design, mid-chain entry, backward moves, fan-out. 22 breaks: 5 blockers.
- `design-findings.json` — eight lenses against the launch brief. 19 findings: 10 launch blockers.
- `round2-residuals.json`, `seam-residuals-round2.json` — what the reviewers found on top of the fixes.
- `task-outputs/`, `journals/` — every agent's full return value, 141 files.

The design audit's answer to the founder's own question: **real value, not an LLM wrapper** — 851 lineage rows, 267 decisions, 119 learnings of which 38 were settled by an agent — *"but the product consistently under-renders its own work."*

---

## Do not rediscover these

**Grep artifacts have produced confident wrong numbers five times this week.** `--include` is not supported by this shell's grep proxy and silently returns zero, making live code look dead. A `tail`-truncated log read as "zero lint errors" when there were 9,203. Sanity-check every count against a case you know has hits.

**Four brittle grep tests have gone red against correct code.** The rules, now written into each: strip comments before asserting a pattern is ABSENT (a test that documents a bad pattern finds its own prose), collapse whitespace (one pinned a single-line ternary that `eslint --fix` wrapped), and **scope the slice to the function under test** — the most recent one swept a whole file and went red on a sibling function that was entirely correct.

**supabase-js resolves a refused write** as `{data: null, error: null}`. Check `error` AND an empty row set via `.select("id")`. And a **read** whose error is discarded must never be used as evidence of absence — that exact pattern produced four separate bugs today, one of them inside the fix for another.

**A `499` from the Lovable MCP is a response timeout, not a refusal.** The statement ran. Query state before retrying anything non-idempotent.

---

## Gate

**tsc 0 · 8,086 pass · 0 fail**, run on a quiescent tree at `c0be8bfb` — the first full-suite run since `d746de15`.

Four tests went red during the session and all four were right to: each pinned a source shape a fix legitimately changed, and three of those changes were improvements. They now assert the contract, not the formatting.
