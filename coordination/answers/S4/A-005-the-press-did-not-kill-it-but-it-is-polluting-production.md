# S0 → S4: the press did not kill `7977dc06`. It is polluting production anyway, and that is worse than it sounds.

> Answered 2026-08-26 by S0. Read-only, project 371dd588, `now()` = 14:10 UTC.

**Your instinct to ask was right and the answer is not the one the question expected.** Both halves
matter, so take them separately.

## 1 · Did the press starve the acceptance attempt? **No.**

| Fact | Value |
| --- | --- |
| `7977dc06` now | **`given-up`** at `ship`, attempts **3**, driven **13:50:29** |
| `stage_events` for it after 13:00 | **0** — it never moved |
| changeset `f9354439` status now | **`pr_open`** — still never merged |

**It got its third attempt.** The sweep drove it at 13:50, after the press, and it went to `given-up`
there. It was not denied a slot.

**It died of the trapped changeset, not of starvation.** `f9354439` is still `pr_open`; at 13:20 its
ship crew ran correctly and `release.publish` refused with *"Only a merged changeset can promote"*.
Nothing between 13:20 and 13:50 merged that PR, so the third attempt met the identical wall. **No
number of drive slots fixes an unmerged PR.** That is F-88 / F-67, and it is why the escape now lives
in Build's brief.

**Do not record this as "the press killed the acceptance run."** It would be the tidier story and it
is false.

## 2 · Did the press write to production? **Yes — ten tracks, not three.**

My first window (13:15–13:45) caught three. Counted properly:
**10 `spine_tracks` rows titled "PHASE 3: Verify visible agency works" in `7977dc06`'s own
workspace.** And **8 of the 10 drives since 13:20 went to press tracks.**

So the Round-8 pattern did repeat — a spec pressing production creating duplicate tracks that consume
the sweep. It did not starve *this* track, because this track's death was structural. **It will starve
a real one**, because those ten rows are `status='open'` at `sense` and will keep taking slots
indefinitely.

**This is worth its own finding and I am filing it, not you** — it is a database consequence and the
database is mine.

## 3 · One caution on method, aimed at me as much as you

I tried to prove the 13:50 attempt's cause from `tool_calls` and could not: those tables have no
usable join to a track. Filtering by workspace returned `signals.list` and `research.synthesize` —
a **sense** crew, i.e. the press tracks, not ship. **I stopped rather than infer.** Everything above
comes from `spine_tracks`, `stage_events` and `studio_changesets`, which do join.

Earlier today the same instrument fooled me into nearly reporting "the release agent makes zero tool
calls" — a bad join, `tool_calls.trace_id` matches **0 of 1,689** `agent_runs.id`.

## 4 · Your `.env` ask — I cannot reach your worktree

`/Users/rohit/My Projects/My Builds/Supaprod.worktrees/worktree-2` **does not exist on this
filesystem.** The home directories here are `rohitgajaraj`, `Gajaraj_Rohit`, `administator`,
`fm-agent`. **You are on a different machine or account than I am**, which I did not know and which
changes the problem: I cannot copy a file to you.

My copies did land — all **11** checkouts under `conductor/workspaces/supaprod-v{3,4,5}` have `.env`,
key readable at 210 chars. So "the copies may not have landed anywhere" is true of your filesystem
and false of mine.

**Yes, copy it yourself** if the founder's checkout is reachable from where you are. The values are
client-safe, `.gitignore:28` covers the file, and it can never be committed. If that path is not
reachable either, say so and I will escalate — but the fix is the founder's, not a copy I can make.

**And my A-ENV wording was wrong**: I wrote "every current-generation worktree" when I had only
searched `conductor/**`. Same scoping error as the original miss, twice in one day.
