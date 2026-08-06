# Session handoff

> _Created: 2026-07-02 · Last updated: 2026-08-06_

**Written 2026-08-06, ~21:45 IST. Soft launch is THIS WEEK on Product Hunt and X.**

State at handoff: **`tsc` exit 0 · 8,232 pass · 0 fail** on a quiescent tree.
Everything is committed and pushed to `main` at `104b80ea`. The app is
**published** at <https://supaprod.lovable.app>, and the deployed commit SHA
matches what was pushed, so nothing is stranded between git and production.

Migrations: **81 of 81 for August applied**, zero drift between disk and the
live database.

---

## 1. Needs a person. Nothing below can be done by an agent.

**a. Settle one outcome through `/learn`.** This is the last unknown on the
moat's own path and the only item here that is a product risk rather than an
account chore.

`applyOutcome` has still never completed: 957 memories, 119 learnings, **zero of
`kind='outcome'`**. What changed today is that this is no longer a guess. Every
write it makes was executed against production inside a rolled-back transaction
and all three were accepted (`learnings` insert, `agent_memory` insert,
`prds.outcome` update), the baseline was re-checked unchanged afterwards, and no
constraint blocks it. So **if it fails now, it fails in the TypeScript, not in
the database.**

Do this: open `/learn` on a workspace with a shipped spec, settle one, then run

```sql
select count(*) from agent_memory where kind = 'outcome';
```

It must return 1, and that row's `workspace_id` must equal the settled spec's
workspace, not your default one. That second check matters: `agent_memory` has a
`BEFORE INSERT` trigger that files a null `workspace_id` into your *earliest*
membership, reproduced today filing a Helio Labs spec into an unrelated
workspace. A follow-up pin corrects it and is now locked by a test.

**b. Rule on the white button on the public landing page.** The nav's
"Start free" pill is white. Tonight's sweep deliberately did not touch public
marketing surfaces (`/`, `/d`, `/proof`, `/t`), on the reasoning that restyling
signup CTAs is a funnel change rather than a cleanup, and `.btn-primary` is
correct there. But the standing ruling is "nothing white in our platform," and
this is the first thing a Product Hunt visitor sees. One small isolated change
if you want it in line.

**c. The four-tier pricing ruling was never implemented.** You locked Free / Pro
/ Business / Enterprise on 2026-07-13 and retired the thematic names. The code
and database still ship **five** tiers on the old slugs (`free`, `pro`, `max`,
`team`, `enterprise`) and `'business'` appears **zero times** in the billing
code, re-verified today. It touches money, so it was flagged rather than
migrated. See §2 for why it is now coupled to something else.

**d. Standing founder-gated list** (unchanged, verify before acting): live
Stripe keys and the credits go-live flip, merchant-of-record pick,
`RESEND_API_KEY`, Figma OAuth registration, `FIRECRAWL_API_KEY` (not blocking),
and deleting five merged branches.

---

## 2. One loaded gun, deliberately not fired

`set_agent_memory_expiry` sets `expires_at` to **30 days** for any user not on a
paid tier. It is **inert today**: `memory_expiry_enabled()` reads `false` and
zero rows carry an expiry.

Two reasons it is written down rather than left to be discovered:

- Its paid list is `('pro','max','team','enterprise')`, so **`'business'` is
  absent.** Land the §1c pricing ruling first, flip this switch later, and
  Business customers' outcome memories start expiring.
- What it deletes is the moat, on a product whose claim is that the record
  *compounds*.

Flipping it is a founder decision, so it was recorded in the SSOT and left
exactly as found.

---

## 3. What landed today, after 17:00

Seven commits, each gated on a quiescent tree before pushing.

| Commit | What |
| --- | --- |
| `119138b2` | The primary button: a solid face on the neutral ladder. 21 ember controls retired from the authenticated app. Composer spacing on `/today`. |
| `279496d0` | The dock, on every authenticated route, says what the agent is working on instead of "native is working". |
| `c445cfd0` | Seeded workspaces were born with no provenance. Fixed at the table with a trigger; the self-healing backfill caught 7 signals the 2026-08-03 pass missed. |
| `8d28c572` | Fan-out turned "nobody said" into "no ceiling". Two uncapped spend paths closed. |
| `ed712c24` | **Task #8, seven stations.** 58 findings, 15 launch blockers. Build and Plan came back *not self-sufficient*. |
| `0972f79d` | The last two surfaces calling an unanswered read an empty workspace. The `.isLoading` budget is now **0**. |
| `104b80ea` | The outcome write path, proven against production and rolled back. |

**Nothing from tonight's lanes is left open.** Every LEFT UNDONE item the agents
reported was closed in a later commit, including the two they could not reach
themselves.

---

## 4. Two operating rules this session paid for

**Verify a finding is still open before dispatching an agent at it.** Four
agents came back REFUSED today because the work was already done, and the
`artifact_lineage` board entry was not merely stale but **wrong in both halves**
— its prescribed fix would have produced a demo with *less* provenance than
existed. One grep or one query kills most stale findings before they cost
anything. The SSOT says this about its own tables; believe it.

**A slow agent and a dead one are indistinguishable in a workflow journal.** A
`started` line with no result, and a 300KB transcript ending at its first
sentence, describe both. Check `git status`, not the journal. Reading it wrong
today cost a duplicated workflow and real file collisions.

---

## 5. Where the detail lives

- Board, open work and open findings: [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md)
- The button rulings, both rejected designs and why: [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md)
- The four audits, saved rather than summarised, plus 141 task outputs and every
  workflow script: `~/.claude/projects/-Users-rohitgajaraj-.../carry-forward/`
