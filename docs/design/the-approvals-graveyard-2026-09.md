# The approvals graveyard: what the 66 actually are

> _Created: 2026-09-03 · Last updated: 2026-09-03_

> _Written 2026-09-03 · A2 · **A proposal. No migration and no data write until the founder says
> yes.** Every number below was read from production on 2026-09-03 with the query beside it._

A1, reading the served approvals page for **Helio Labs** (`helio-labs-harbor`,
`60000000-0000-4000-8000-000000000000`, the workspace a visitor is shown):

> "66 decisions are ready for you" and "65 pieces of work are stopped, waiting on you", the oldest
> 56 and 49 days.

That is a workspace greeting a visitor with a graveyard. Below is what is actually in it, what a
retirement rule would and would not fix, and the one thing that needs no founder decision at all.

---

## 1. The finding that comes before any rule: those are one population, counted twice

`66` and `65` are not two queues. They are the same rows.

- **66** is `getApprovalsQueue`'s ten families for this workspace, summed.
- **65** is `rest` on the approvals route: `visibleItems.filter((i) => i.id !== focusedId)` at
  `src/routes/_authenticated.approvals.tsx:396`, fed to `StalledWork`, which prints
  `${waitingOnPerson.length} pieces of work are stopped, waiting on you.`
  (`src/components/meridian/StalledWork.tsx:269`).

**65 is 66 minus the one card already open.** So the page states the same obligation twice, in two
vocabularies, and the second number is one lower for a reason no reader can recover. A visitor
totals them and reads **131 things waiting**, where there are 66, of which one is on screen.

**This needs no founder decision and no data write.** It is a duplicated count on one page, the same
defect the shell and `/today` were fixed for on 2026-08-21 ("83 calls need you" over "83 decisions
are ready for your review", `AppFrame.tsx:1206`) — *"Same number, same things, two nouns, which
reads as two different counts until you work out that it isn't."* That fix is recorded and this
surface did not get it. **I would take this as a packet regardless of the answer to §4.**

---

## 2. The 66, by kind, with the query for each

All ten families as `getApprovalsQueue` reads them, scoped to
`workspace_id = '60000000-0000-4000-8000-000000000000'`. They sum to exactly 66, which is what
confirms this is the right population and not a near-miss.

| Kind | On the queue | Source | The predicate the queue uses |
|---|---:|---|---|
| `design_gate` | **35** | `prds` | `design_gate_status = 'pending'` |
| `assumption_challenge` | **10** | `assumption_challenges` | `status = 'open'` |
| `decision` | **8** | `decisions` | `status = 'pending'` |
| `tool_call` | **4** | `agent_approvals` | `status = 'pending'` |
| `house_rule` | **4** | `house_rules` | `status = 'pending'` |
| `opportunity` | **3** | `opportunities` | `status = 'backlog'` **and** `critic_review->>'verdict' in ('revise','kill')` |
| `memory_candidate` | **2** | `memory_candidates` | `status = 'pending'` |
| `spec` | 0 | `prds` | `status = 'review'` |
| `playbook_proposal` | 0 | `playbook_proposals` | `status = 'proposed'` |
| `trust_graduation` | 0 | `listGovernApprovals` | `status = 'pending'` |

**Two of these are worth pausing on.**

**`design_gate` is 35 of the 66, and it is the family that was invisible until 2026-08-24.** Its
predicate was `.is("design_gate_status", null)` against a column that is `NOT NULL DEFAULT
'pending'`, so it could never match a row — the history is in
`approvals-queue.functions.ts:415-446`. Restoring it turned an empty family into the largest one on
the queue. **More than half of the graveyard is a family that started reporting nine days ago.** It
is not that this work has been ignored for 49 days; it is that nobody could see it until recently.

**`opportunity` is 3, not 73.** The backlog holds 73 rows, and the queue shows only those the Critic
returned `revise` or `kill` on. Worth stating because a rule written against "opportunities in
backlog" would move 73 rows to fix 3 that are actually on the page.

---

## 3. Age, which is the part that changes the proposal

The framing "seeded work nobody answered" implies the queue is old. Counted, it is not.

| Age | Rows | Share |
|---|---:|---:|
| 7 days or less | 22 | 33% |
| 8 to 14 days | 23 | 35% |
| 15 to 30 days | 10 | 15% |
| **Over 30 days** | **11** | **17%** |

The two ages A1 read are real and they are the **tail**: the oldest opportunity is 56 days
(2026-07-09), the oldest decision 49 (2026-07-16), the oldest design gate 48 (2026-07-17). Behind
them, **two thirds of the queue is under a fortnight old** and 15 rows landed in the last three days.

> **So an age rule is not the lever.** Retiring everything over 30 days clears 11 rows and leaves
> the page saying **"55 decisions are ready for you"**. The visitor's experience is unchanged. Any
> proposal whose rule is "retire the old ones" is solving the sentence A1 quoted rather than the
> thing it describes, and I would rather say so than hand over a rule that reads decisive and moves
> 11 rows.

**The problem is volume, and volume is a product question, not a cleanup.** 35 design gates in one
workspace is what a seeder produces when it stages work at every station and nothing walks the
queue. A real workspace reaching 35 open design gates would have the same problem, which is the
part worth designing for.

---

## 4. What I would put to the founder

Three options. **Each is one statement, each is reversible by its inverse, and none is run until he
answers.** All are scoped to `workspace_id = '60000000-0000-4000-8000-000000000000'`.

**A. Retire the tail only (11 rows).** Set the over-30-day rows in each family to their declined
state. Honest, tiny, and it leaves the page reading 55. Reversible by flipping the same rows back on
`updated_at`.

**B. Retire everything the seeder staged and nobody answered (up to 66).** The queue empties and the
arrival reads as a workspace at rest. The cost is real: `helio-labs-harbor` is the workspace a
visitor is shown, and a demo whose approvals queue is empty cannot demonstrate the approvals queue.
**This trades one bad first impression for a different one.**

**C. Leave the rows and fix what the page says about them (my recommendation).** Do §1 — one
population, counted once — and give the queue the thing it has never had: **an honest shape at the
top**. "35 design gates, 10 assumption challenges, 8 decisions" is a queue a person can start on.
"66 decisions are ready for you" is a wall. The rows are real work in a real state; the defect is
that the surface reports a total where it should report a shape, and then reports it twice.

**I recommend C, with A folded in if he wants the tail gone.** C is the only one that also helps the
first real customer who reaches 35 open design gates, and B is the only one that cannot be undone by
a person's judgment later — a retired gate nobody looked at is a decision made by a cleanup script.

**What I am not proposing.** Deleting rows. Every option above is a status change, so the work stays
in the record and the ledger keeps its history. Nothing here touches the six other Helio workspaces,
which carry the same shape and should follow whatever he decides here rather than be swept in with it.

---

## 5. What the approvals page and Start read afterwards

- **After §1 (either way):** the approvals page states the obligation once. `StalledWork` keeps the
  row list, which is its real job, and loses the headline that restates the count above it.
- **After A:** 55 on the queue, tail gone, no other surface changes — Start reads the same count from
  the same reads.
- **After B:** 0, and the arrival's designed zero state fires — the one written in
  `docs/design/arrival-2026-09.md`. Worth knowing that this is the first time that state would be
  seen on the served workspace, so it should be walked before it ships, not after.
- **After C:** the top of the queue reads as a shape rather than a total, and the number the shell
  carries stays the same. Start is unaffected either way: it reads open tracks, not this queue.

---

## 6. Every query in this document

```sql
-- The population (sums to 66). One workspace, the ten families as the queue reads them.
with w as (select '60000000-0000-4000-8000-000000000000'::uuid id)
select 'design_gate' k, count(*) from prds
  where workspace_id=(select id from w) and design_gate_status='pending'
union all select 'assumption_challenge', count(*) from assumption_challenges
  where workspace_id=(select id from w) and status='open'
union all select 'decision', count(*) from decisions
  where workspace_id=(select id from w) and status='pending'
union all select 'tool_call', count(*) from agent_approvals
  where workspace_id=(select id from w) and status='pending'
union all select 'house_rule', count(*) from house_rules
  where workspace_id=(select id from w) and status='pending'
union all select 'opportunity', count(*) from opportunities
  where workspace_id=(select id from w) and status='backlog'
    and critic_review->>'verdict' in ('revise','kill')
union all select 'memory_candidate', count(*) from memory_candidates
  where workspace_id=(select id from w) and status='pending'
union all select 'spec', count(*) from prds
  where workspace_id=(select id from w) and status='review'
union all select 'playbook_proposal', count(*) from playbook_proposals
  where workspace_id=(select id from w) and status='proposed';
```

The age table in §3 is the same union with `created_at` (`updated_at` for `design_gate`, which is
what its own read orders by) bucketed at 7, 14 and 30 days against `now()`.

---

## 7. Standing, for the ledger

- The 66/65 duplication is **a code defect on one page**, independent of every data question here,
  and it is the same defect class the shell and `/today` were fixed for on 2026-08-21.
- **`design_gate` is 35 of 66 and only became visible on 2026-08-24.** Any claim that this queue was
  ignored for 49 days is wrong for more than half of it.
- **Only 11 of 66 rows are over 30 days.** An age-based retirement rule does not fix what A1 read.
