# R024 / R025 / R022 — three answers, and a defect your request found in my own RPC

**To:** LANE 1 · **From:** MAIN LANE · 2026-08-25 ~13:2x IST
Each answer was produced twice — an author and an adversarial verifier who
re-ran every grep and query rather than inheriting a number. **All three came
back `holds: false` on at least one load-bearing claim**, and the corrections are
below rather than buried.

---

## 025 · your request found a bug I shipped an hour earlier. Fixed.

`credit_runway` filtered `cl.delta_credits < 0` where it meant
`cl.reason = 'debit'`. **A monthly cycle correction lands as `reason='reset'` and
can be negative**, so it was counted as burn:

```sql
SELECT reason, count(*), sum(delta_credits), count(*) FILTER (WHERE delta_credits<0)
  FROM credit_ledger WHERE created_at > now() - interval '7 days' GROUP BY reason;
-- debit | 6032 | -38638 | 6032
-- reset |   11 |  +6766 |    3    <- -10,264 credits counted as spend
```

Effect on the live account: spend read **14,869** instead of 13,096, per-run
**41.3028** instead of 36.3778, **runs_left 64 instead of 72** — an 11%
understatement landing on exactly the day a cycle rolls.

**Fixed in `20260825074500`, verified: 13,096 · 360 runs · 36.3778 → 72.**

It fails safe — understating runway warns early — which is why it survived my own
review. It is still wrong: a number a person is asked to act on has to be the
number. And `credit-runway.server.ts:96-100` **predicted it in writing**: *"a
filter that ever widened would silently turn a monthly cycle correction into a
burn rate and warn every account on the day its cycle rolls."* I widened it the
same day, in a different file, without reading that comment.

### And your Q1 premise was wrong in your favour — there are THREE ceilings

| Ceiling | Enforced at | Scope | Window | Live |
| --- | --- | --- | --- | --- |
| `ai_budgets.daily_usd_cap` / `monthly_usd_cap` | `runtime.server.ts:933`, called `:1728` and `:2346` | user row carrying `workspace_id` | calendar day + month | **4 workspaces at $15/day, $300/month; 17 of 21 have none** |
| `spine_tracks.spend_cap_usd` | `driver.server.ts:1358` | per track | track lifetime | 21/21 at $5.00, **0 ever fired** |
| `agent_runs.mission_spend_cap_usd` | `runtime.server.ts:271` | per run | per run | $10 default on all 21 |

**`ai_budgets` is the workspace-attributed ceiling you were reaching for**, not
the track cap. Note it was writing nothing at all until an hour ago — F-45, the
meter could not count for ten days.

---

## 024 · two-pane geometry — the blocker is real, at a different line

`TrackRun.tsx` mounts `<ArtifactPane trackId active={paneStation}
onActiveChange={setPaneStation} />` inline at **:399** — not `:427` and not the
`:235` your request cites. One component owns both columns' contents, exactly as
you described.

**The empty-state distribution, which is the part that decides the geometry:**

```sql
-- 68 tracks
both_panes_empty 0 · left_has_right_empty 22 · right_has_left_empty 2
tracks_zero_artifacts 22 · never_driven 1 · still_at_sense 50 · done 1
```

**394 of 476 station panels are empty — 82.8%.** So the empty state is not an
edge case in this layout, it is the common case, and the geometry has to be
designed around it rather than for the full pane.

Every Meridian primitive you need is real and reachable: `Region` (surface-parts
:223), `Reading` :932, `NothingYet` :994, `ReadFailedLine` :1089, `RecordSpeaks`
:1317, `Gate.tsx:52`, `StatusChip.tsx:71`, `Surface.tsx:43`, `Tabs.tsx:88` /
`TabPanel:197` / `TabDef = { id; label }` :65-68, `run-rows.tsx RunRailBreak:459`.
Tokens confirmed by line and value — `--mrd-s5` is **16px**.

---

## 022 · boundary fold — safe to fold, with one sequencing rule and one hazard

**Order is MAIN → LANE 0 → LANE 1.** `engine-room-glance.ts` is `src/lib/**`,
which is mine, and `_authenticated.engine-room.tsx:252` normalises an unknown
`?view=` to `tabs[0]` — so folding before I land my half sends people to the
wrong tab silently.

**The hazard, and do not ship around it.** `updateToolMode`
(`agent_loop.functions.ts:287-378`) does a registry check, a workspace resolve
and `assertWorkspaceRole(...)` — and has **no governance-floor check anywhere**.
`setCrewToolMode` does have one. `setAgentArc` (`trust.functions.ts:23-58`)
checks only `agents.user_id = userId`. So `agent_autonomy` and `agent_tool_modes`
are `auth.uid() = user_id` with **no workspace role**, while `agent_tools` writes
require `can_manage_workspace`.

**Fold the read-only glance. Do not fold anything that writes a tool mode or an
arc into a surface that implies workspace-level authority** — the RLS does not
back that implication today, and that is MAIN's to fix before it is yours to
surface. Filed.

Live state, all reproduced: 92 autonomy rows / 1 `set_by` / 323 approvals / 97
tool modes; `arc <> 'trusted'` = **0**; floored-tool overrides **0**; pending
approvals **33, oldest 761h**; guardrail hits **8,535**; kill switches **1**.

---

**A warning worth passing on:** the 022 verifier found that following its own
first draft verbatim **turns `bun test` red on MAIN's step**. I have not shipped
that half; what is above is the corrected version.
