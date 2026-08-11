# Verified numbers, with the query beside every one

> _Created: 2026-08-11 · Last updated: 2026-08-11 · **This file exists because three numbers presented as proof in the YC application turned out to be seed data, and a fourth set in the launch copy claimed thirteen months against ten weeks of data. Neither had a recorded query anywhere in the repo.**_

**The rule, and it is not negotiable: a number quoted outward carries its query, or it does not go.** If a figure is not in the table below with a command that reproduces it, it does not appear in an application, a listing, a deck, a post or a script.

**Measured `2026-08-11`.** The repo-side figures grow daily. Re-run before pasting. The product-side figures should be re-run too, and the zeros below are the ones most likely to change, because they change the moment a real user does real work.

---

## 1. Repo side. These are sound, they reproduce in one line, and they are what carries the progress claim now.

| Number | Value | Command |
| --- | --- | --- |
| Commits | **4,950** | `git rev-list --count HEAD` |
| Migrations | **510** | `ls supabase/migrations/*.sql \| wc -l` |
| Elapsed | **ten weeks** | First real commit is `2026-06-02`. One template commit is dated `2025-01-01` and is scaffold, not work. `git log --reverse --format=%ad --date=short \| head -5` |

**Say "4,900+ commits in ten weeks".** The `+` form ages safely, because as the count grows the claim only becomes an understatement. **"4,000 commits in seven weeks" was in five fields as recently as today** and was a 20 percent understatement of our own velocity in the field where velocity is the point.

---

## 2. Product side, all workspaces. True, and weaker than it sounds.

| Number | Value | Query |
| --- | --- | --- |
| Missions | **341** | `select count(*) from missions;` |
| Decisions | **288** | `select count(*) from decisions;` |
| AI calls | **34,686** | `select count(*) from ai_events;` |
| Learnings | **119** | `select count(*) from learnings;` |

**These include every seeded, sample and fixture workspace, so they are not a claim about usage.** Never attach them to "my own workspace" or to a user. The earliest mission is `2026-06-04`; nothing predates the repo.

---

## 3. Product side, excluding seeded and fixture workspaces. This is the honest set.

| Number | Value |
| --- | --- |
| Missions | **95** |
| Decisions | **55** |
| Learnings | **0** |
| Learning citations | **0** |
| Lineage edges written by the product itself | **120** of 1,121 rows (360 seeded, 446 from the 2026-08-03 repair backfill, 195 from a mission backfill) |
| Lineage edges `learning → decision` that are not seeded | **0** of 71 |
| Lineage edges `prd → learning` | **0**, and the writer had never fired before 2026-08-11 |

```sql
-- the compounding claim, both halves
select count(*) filter (where not seeded) from artifact_lineage
  where parent_kind='learning' and child_kind='decision';
select count(*) from artifact_lineage
  where parent_kind='prd' and child_kind='learning';
```

> **The zeros are the point, and they are not a problem to hide.** The loop is wired and proven, and it begins accruing on first real use. That is the form `CLAUDE.md` prescribes and it is the honest one. **Do not substitute a smaller number for a falsified one**: a smaller number is still queryable and still zero.

---

## 4. Numbers that are retired and must not reappear

| Retired | Why |
| --- | --- |
| **119 lessons · 38 self-decided · 36 decisions from an earlier lesson** | All seed data. Every `learnings` row sits in a seeded workspace; 37 of them are dated before the repo's first commit, earliest `2025-12-05`. `38` is the total held by seven fixture workspaces named "Helio Labs". `36` came from a census that told demo from real by matching **the shape of a workspace id**, and `seed_sample_workspace()` gives its workspace an ordinary random id. |
| **133 missions · 72 recorded decisions · 2,162 AI calls, "from my own workspace"** | Matches no workspace. Largest is the "Helio Labs" fixture at 94 and 85. The plausible founder workspace holds 64 and 50. |
| **370 features shipped** (build register) | Accurate to `2026-08-04` and **not maintained since**, by a deliberate call: keeping it current cost more than it returned. It therefore understates the build by roughly 450 commits of work. **Volume claims are dropped from outward material entirely** (founder ruling, 2026-08-11); the working demo login is stronger evidence than any count and cannot be argued with. |
| **145 missions · 81 decisions · 54 outcomes graded** | Unreproducible and inconsistent with the rest of the same file, which also carries 83, 176 and 16 for the same quantities. No recorded query. |
| **"13 months" of Supaprod running on itself** | The earliest mission is `2026-06-04`. Ten weeks. Some of the sixteen instances in the launch copy are biography about a previous product and only the founder can separate them. |
| **"4,000 commits in seven weeks"** and the correction that said **"eight weeks"** | The first was a 20 percent understatement. The second was wrong arithmetic: `2026-06-02` to `2026-08-10` is 68 days, which is ten weeks, not eight. |
| **`[refresh]` and `[refresh; live counters]` tags** | There is no live counter behind them. The four landing count fields are computed in the route loader and rendered nowhere. A tag promising a figure refreshes is worse than a stale figure, because it claims the number is maintained. |

---

## 5. How this happened, so it does not happen again

Every census in this repo separated demo data from real data by **matching a workspace name or the shape of a workspace id**. The pattern was `_0000000-0000-4000-8000-000000000000`, and `seed_sample_workspace()` creates its workspace with an ordinary random id, so seeded rows counted as production and some production rows counted as seeded. **Wrong in both directions.** A `seeded` column now exists and is the only correct test.

**Assume any number in `docs/` is suspect if it splits demo from real by an id shape or a name.** Re-derive it from the column.

## Related

- [`yc/fall-2026-application.md`](./yc/fall-2026-application.md) — the block after the first field carries the full finding and the SQL
- [`../growth/02-prelaunch-copy-pack.md`](../growth/02-prelaunch-copy-pack.md) — opens with a do-not-send block for the same reason
- [`../operations/session-handoff.md`](../operations/session-handoff.md) — what is waiting on the founder
