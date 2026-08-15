# Pick up here

> _Created: 2026-08-07 · Last updated: 2026-08-16, late. **Funding lane: two applications drafted for deadlines that both turned out to be softer than the board said. The founder has seen the work and is NOT fully happy with it, and did not say why.**

---

# ⏸️ FUNDING LANE, 2026-08-16 — drafted, pushed, and NOT yet filed

**Commit `5ccfd95b`, pushed to origin/main.** Two applications drafted in full. **Nothing was submitted.**

## 🔴 Read this before touching the drafts

> **The founder read the work and said: *"I did see the work you have done, but I'm not fully happy with it."* He asked to save and close rather than iterate, and he did not say what was wrong.**
>
> **Do not guess and do not rewrite.** Ask him which part misses, then fix that specific thing. [`../pitch/applications/how-to-draft-the-next-one.md`](../pitch/applications/how-to-draft-the-next-one.md) correction 4 is exactly this case: *"I asked you to build on top of the existing one… I wanted you to combine both things"* — a full replacement loses the parts that were working, and he notices.
>
> **The likeliest candidates, in order, so the question can be specific:** the application was drafted **blind against the published selection criteria rather than the live form**, because the form sits behind an account gate; the answers may read long for a form whose fields are unknown; and the register may still be too composed for him.

## What the pages said that the board did not

| | Board said | The page actually says |
| --- | --- | --- |
| **CF Accelerator Batch #9** | closes 2026-08-16 | **The apply FORM says "Please apply before Aug 17, 2026."** The programme page says 16.08. **The form governs** |
| **ikigai Launchpad** | closes 2026-08-16 | **16.08 is the close of the SECOND ROUND of acceptances, not the batch.** Acceptances are rolling and the batch is nowhere stated as full |

**Which Campus Founders programme: settled, and it does not need re-deriving.** **AI Founders has merged into the CF Accelerator** and its page now redirects to the same apply link. AI Scale already ran, 14 July to 6 August. Venture Studio, Pre-Seed BW and Leadership Talent Academy are not funding routes today. **There is one door.**

## What exists now

| File | What it holds |
| --- | --- |
| [`../pitch/applications/campus-founders/APPLICATION-FINAL.md`](../pitch/applications/campus-founders/APPLICATION-FINAL.md) | 17 answers, paste-ready, plus a pre-submit checklist |
| [`../pitch/applications/campus-founders/positioning.md`](../pitch/applications/campus-founders/positioning.md) | The programme read off its own pages, the five selection criteria, where we win and lose |
| [`../pitch/applications/campus-founders/how-to-apply.md`](../pitch/applications/campus-founders/how-to-apply.md) | The account gate, and a paste-ready brief for Claude-in-Chrome |
| [`../pitch/applications/ikigai-launchpad/APPLICATION-FINAL.md`](../pitch/applications/ikigai-launchpad/APPLICATION-FINAL.md) | All seven Tally parts, deliberately a different application from CF's |

## 🔑 The blocker that is structural, not a bug

**The founder signed up to AcceleratorApp with Google, so the account has no password, so no other browser session can ever sign into it.** Claude Code drives its own isolated Chrome profile and **cannot attach to a normally-launched Chrome** — a debug port has to be set at launch, and macOS blocks the shell from the real Chrome profile directory. All three MCP browser paths (`use_browser`, chrome-devtools-mcp, Playwright) spawn their own instance.

> **The generalisable rule, and it belongs in the craft log: for any application an agent is meant to fill, sign up with EMAIL AND PASSWORD, never with Google or any OAuth button.** A Google signup permanently hands the form to whoever holds that browser session.

## Two canon conflicts found while drafting, both resolved toward the later ruling

1. **`answer-bank.md` puts the commit count inside the "why solo" answer.** That is the exact adjacency [`../pitch/applications/positioning-doctrine.md`](../pitch/applications/positioning-doctrine.md) **Rule 6** bans: a number next to "agents write the code" reads as measuring the agents rather than the founder. **The drafts split them into different fields. The answer bank itself is still wrong and was not fixed.**
2. **Several `answer-bank.md` blocks still use "remembers" as a verb of the brain** (§1 two-sentence block, §1 three-layers block), which `CLAUDE.md` bans **everywhere**. The drafts say *learns and guides*. **The answer bank was not fixed.**

**Both are open. Fixing them is cheap and stops the next application inheriting them.**

## Waiting on the founder

- [ ] **Say what is not right about the drafts.** Blocking everything else.
- [ ] **Test `lantern@supaprod.ai` in incognito** and confirm the approval queue is armed. Allocated to Campus Founders; `meridian@` allocated to ikigai. Both recorded in [`../pitch/applications/answer-bank.md`](../pitch/applications/answer-bank.md).
- [ ] **Record the ikigai intro video** (Tally part 4b). The long pole, and rolling rounds mean it can wait for a good take.
- [ ] **Re-pull numbers at submit.** Today's: **5,280 commits · 545 migrations · first commit 2026-06-02**.

## Dates that matter

**CF pitch invitations 24 to 26 August · acceptances 28 August · cohort 30.09 to 18.12.2026 in Heilbronn.** The approval-queue runway holds to late September, so a pitch invite lands inside it. **CF bans parallel accelerator participation and runs to 18 December, which collides with EF The Bridge SF in October.** Founder ruling 2026-08-16: **apply anyway, say nothing.** The clause binds participants, not applicants.

---

## ✅ SPINE PASS CLOSED 2026-08-14 (after the three lanes above). Twelve commits on main. **Everything here needs one thing: a look at the live database.**

> **If you are Claude Code and you have Lovable access, this section is addressed to you.** Skip to *The eleven checks*. Every one is a read. **No migration is owed by this pass at all.**

### The one-sentence finding

The loop's learning edge was broken in **four places in series**, each one hiding the next, and every one was a chain where every link was correct and the chain was one link short with nothing anywhere saying so.

### What closed, and why each mattered

| Commit | What it fixes |
| --- | --- |
| `914aef53` | A station could advance having filed the **wrong** artifact. Plan files a task instead of a spec, Design is handed nothing to design against, Build reports correctly that it was given nothing. New hold `nothing-to-hand-on`, and the advance predicate is now the **next** station's need |
| `5a670d88` | The promotion sweep, which `promote.ts` calls "the one rule in the product that spends money with nobody watching", read three clustering numbers and nothing about whether acting on this evidence had ever worked. It now reads the history and **withholds autonomy** at support of -2 or worse |
| `6dc546ce` | An autonomous verdict attached to **nothing**. Both existing recoveries are dead on the driver's route, so what remained was the driver naming the spec id in the prompt and the model choosing to copy it. `ToolCtx.trackId` now carries the track and the tool reads the spec off `spine_track_members` |
| `f0698270` | The bar's join went through `opportunities.theme_id`, and `prd.draft` says outright that nothing in that toolset creates an opportunity. So on the autonomous route the bar read a structurally empty history and reported a confident zero. It now resolves spec to track to cluster as well |
| `068818a3` | Records **why Discover's ranking gets no outcome term**, with a tripwire. It would be scored against an empty set, and `/decide`'s sign would be wrong here anyway |
| `608fb56e` | Ship said "nothing has shipped" **six times** on a workspace holding nothing, with one door on the screen. Now one Gate, the precondition, and a drawing of a release row |
| `b7beb183` | Learn was **grading against a title**. `HANDOFF_BODIES` counted from the end, so by Learn the newest two were the changeset and the deployment and the spec arrived as a bare id |
| `ab7e1c03` | `HANDOFF_BODIES` reserved trailing **positions**, not bodies. The bodyless `mission` filed at Build spent a body slot and pushed the spec out of every Build **retry** |
| `9fe762e6` `42c150fc` | A promoted cluster **walks all seven stations on all five route shapes**, briefed correctly at each. Validated by planting three real defects |
| `cf1b6470` | A track that goes wrong **always settles**, for every station. Removing the correction budget makes six of seven spin |
| `03866fd5` | The audit doc, section 16 |

### The eleven checks. Each one says what a bad answer means.

**1. Is anything stuck on the new hold, and should it be?**
```sql
select station, count(*) from spine_tracks where last_hold = 'nothing-to-hand-on' group by station;
```
Then for any that appear, list what they filed:
```sql
select t.id, t.station, m.artifact_kind, count(*)
from spine_tracks t join spine_track_members m on m.track_id = t.id
where t.last_hold = 'nothing-to-hand-on' group by 1,2,3 order by 1;
```
**A bad answer** is a track held here whose members DO satisfy the next station's need. That means the predicate is too strict in reality, and too strict is worse than too loose: it freezes work that was fine and teaches a person the loop cannot be trusted.

**2. Do Plan runs actually file the spec as a track member?** The whole `6dc546ce` fix rests on this.
```sql
select artifact_kind, count(*) from spine_track_members group by artifact_kind order by 2 desc;
```
**A bad answer** is zero rows of `artifact_kind = 'prd'`. Then the new fallback resolves nothing and an autonomous verdict is still an orphan.

**3. Is `agent_runs.track_id` populated on driver-run rows?** The fix threads it through `ToolCtx`.
```sql
select count(*) as runs, count(track_id) as with_track
from agent_runs where created_at > now() - interval '30 days';
```
**A bad answer** is `with_track` near zero: the tool never receives a track and the fallback never fires.

**4. Can the promotion bar learn anything today? Both routes, counted separately.**
```sql
-- Route A, the human one: learning -> bet -> cluster
select count(*) from learnings l join opportunities o on o.id = l.opportunity_id
where o.theme_id is not null and l.verdict in ('validated','missed');

-- Route B, the loop's own: learning -> spec -> track -> cluster
select count(*) from learnings l
  join spine_track_members m on m.artifact_id = l.prd_id and m.artifact_kind = 'prd'
  join spine_tracks t on t.id = m.track_id
where t.theme_id is not null and l.verdict in ('validated','missed');
```
This is the number the sweep reports as `learnedFrom`. **Both zero is expected today** and is the honest state. What matters is that Route B becomes non-zero once a track completes a lap.

**5. Would any cluster now be withheld from starting on its own?**
```sql
select theme_id, validated, missed
from (
  select o.theme_id,
         count(*) filter (where l.verdict = 'validated') as validated,
         count(*) filter (where l.verdict = 'missed')    as missed
  from learnings l join opportunities o on o.id = l.opportunity_id
  where l.verdict in ('validated','missed') and o.theme_id is not null
  group by o.theme_id
) x
where least(validated, 3) - least(missed, 3) <= -2;
```
**Any row here is a behaviour change to confirm is wanted.** That cluster stays promotable by hand and the sweep will no longer start it on its own.

**6. Is the moat pool still empty?** This is the number that decides whether "it learns" is true yet.
```sql
select kind, count(*) from agent_memory group by kind order by 2 desc;
```
In-repo comments, dated rather than queried by me, say **zero rows of kind `outcome`** against 846 reflections. **A good answer is that `outcome` has started to grow.**

**7. Are verdicts still landing unattached?**
```sql
select count(*) as total,
       count(*) filter (where prd_id is null)         as no_spec,
       count(*) filter (where opportunity_id is null) as no_bet
from learnings;
```
Comments quote 119 learnings, 35 with a spec. **Watch whether `no_spec` stops growing** for rows created after this ships.

**8. Is the swallowed-memory report firing?**
```sql
select failure_kind, count(*), max(created_at) from error_events
where failure_kind = 'outcome_memory_not_written' group by 1;
```
**A growing count with a recent `max` means the pool is still not filling**, and the reason is in that row's `extras`.

**9. Does the Learn yardstick have anything to inline?** It reads `prds.body_md`.
```sql
select count(*) as specs, count(*) filter (where coalesce(body_md,'') = '') as empty_body from prds;
```
**A bad answer** is `empty_body` close to `specs`. Then the spec reaches Learn whole and whole means empty, and the real repair is upstream at Plan.

**10. Do live routes match the shapes the walks cover?** Both walk tests cover the five `suggestRoute` outputs only.
```sql
select entry_station, path, waived, count(*) from spine_tracks group by 1,2,3 order by 4 desc;
```
**A bad answer** is any live combination `suggestRoute` would not produce. Those routes are covered by neither walk.

**11. Did the money-frozen tracks recover?** `decideDrive` stopped applying the attempt ceiling to `out-of-credit` and `over-budget`.
```sql
select last_hold, count(*), min(driven_at), max(driven_at) from spine_tracks group by 1 order by 2 desc;
```
Measured 2026-08-14: **26 of 43 at `station-cannot-finish`** against an account at balance 0, frozen since 2026-08-01. **A good answer** is that they have moved off it.

### One check that is not SQL

**Ship on a workspace holding nothing.** `608fb56e` collapses five panels into one Gate plus a drawing, and the condition requires **every** read to have succeeded. Open `/ship` on a workspace with no releases: one question, not six statements of absence, and both doors work. Then open it on a workspace that HAS releases and confirm nothing was taken away. If a read fails, the old panels must come back with their retry.

### What is open, and what is deliberately not being done

- **Nothing in this pass is verified against production.** Every claim rests on tests with the defect planted first. Ten defects planted, each failing exactly the guard that owns it.
- **The honest form of the whole pass**, and it should be used in any outward-facing sentence: the loop is wired and proven, and it begins accruing on first real use. It is not re-ranking anything yet, because the outcome pool is empty.
- **Discover's visible ranking gets no outcome term.** A closed decision with the reasoning in `src/lib/brain/discover-outcome-term.test.ts`, not an open gap. Do not "fix" it by adding the term; the tripwire fires if the premise ever changes.
- **The `{ data }` without `error` sweep is untouched.** Roughly 700 call sites destructure a read without checking its error, so a failed read renders as a legitimate zero. Same class as everything above, and mostly **off** the spine, which is why it was not picked up here. It is the obvious next pass.
- **Suite connections still have no Verify control.** gmail, google_calendar, google_tasks, microsoft_mail and microsoft_outlook write to `user_calendar_connections`, which offers only Reconnect and Disconnect, so adapters for them would be code with no caller. **Founder call, not an engineering one.**

### Two method lessons, both paid for in this pass

1. **A planted defect must revert BEHAVIOUR, not break the file.** One plant cut a block in a way that left an undefined variable, so unrelated tests failed and the red proved nothing. Plant by making a branch unreachable or flipping a constant.
2. **A walk that visits each station once cannot see a retry bug.** The first draft of the seven-station walk **passed with the body-slot defect planted**, because that defect only bites on Build's second tick, after `missionForTrack` has filed the bodyless mission. A test that cannot see a bug it was written for certifies what it missed.

### Gate at close

`bunx tsc --noEmit` 0 errors · `bun test` **9,290 pass, 0 fail** across 555 files · `bun run build` succeeds. Twelve commits, all on `origin/main`, tree clean at `cf1b6470`.


## ✅ FUNDING LANE CLOSED 2026-08-14 ~19:10 IST. 571 programmes swept, ranked and tiered.

> **Start here: [`docs/pitch/applications/what-to-apply-for-next.md`](../pitch/applications/what-to-apply-for-next.md).** It is the standing answer to *"what do we apply for next"* and it does not need re-deriving.

| Artefact | What it is |
| --- | --- |
| [`applications/what-to-apply-for-next.md`](../pitch/applications/what-to-apply-for-next.md) | ⭐ **The queue, in order.** Read this first |
| [`applications/gate-2-ranking.md`](../pitch/applications/gate-2-ranking.md) | Tiers, calls with reasoning, **the ask recommendation with comparables** |
| [`applications/FUNDING-TRACKER.csv`](../pitch/applications/FUNDING-TRACKER.csv) | The founder's Excel dashboard. **Stale — built before the relocation re-weighting** |
| [`applications/all-programmes-ranked.csv`](../pitch/applications/all-programmes-ranked.csv) | All 571 rows, 23 columns, with a `Status` column |
| [`applications/sweep/`](../pitch/applications/sweep/README.md) | The eleven lanes with page evidence. **Temporary — delete when the ranking is settled** |
| [`scripts/rank-funding-programmes.py`](../../scripts/rank-funding-programmes.py) | The scorer. Re-run it, never hand-edit a score |
| [`scripts/harvest-workflow-journal.py`](../../scripts/harvest-workflow-journal.py) | Lands each agent's output as it finishes |

**Notion:** [🏆 All Funding Programmes, Ranked](https://www.notion.so/e6a24c8fc4bb49aab2160de95b862749) (75 rows loaded) · [🎯 Gate 2](https://app.notion.com/p/3bc3f54c86c28183a103e005b9776c27) · [💸 Application Board](https://app.notion.com/p/4014ff9cb1c240c9a3b761e790852970)

### Three founder rulings that now govern screening

Full text at the top of [`applications/README.md`](../pitch/applications/README.md).

1. **A deadline is a rumour until the form contradicts it.** HF0 sat in the closed pile on a date from one unverified aggregator while its form was live. **Only the programme's own page justifies a skip, quoted.**
2. **No entity is a funding-release condition, not an eligibility bar.** Hub71 was recorded as a hard blocker on an ADGM entity; its form asks which country your HQ is in, not where you are registered.
3. **Solo founder is one condition, not a stop.** Of 571 programmes, exactly one — Surge by Peak XV — turned out to be a genuine wall.

### The priority order, restated late in the session

**Money and its size · network access · credits · relocation to the US · everything else.** Deadline breaks ties and never outranks what is on offer.

**Relocation is solved** — the founder is quitting his job and ready to move — so an in-person programme anywhere is a neutral fact rather than a cost. That re-weighting moved **Tier 1 from 17 to 39** and put US programmes with real money at the top.

### Act on these

| When | What |
| --- | --- |
| **2 days** | **CF Accelerator #9** (€25K, zero equity) and **ikigai Launchpad** ($100K/8%) |
| **7 days** | **Hub71 Access + Hub71+ AI** — one filing covers both |
| **16 days** | **EF The Bridge Residency SF** — **the draft already exists in this repo** |
| **18 days** | **Solo Founders Program SF** — $100K for 2.5%, best terms-per-percent on the list |
| **carried over** | Send the **Conviction endorsement link**; **re-arm the demo approval queues before 09-08** |

**Ten pages need the founder to open them** — Notion sites and JS-only apps a fetcher cannot pass. Listed with evidence in `gate-2-ranking.md`. The three that matter most: **Cisco Scale Hub at Station F**, **EXIST-Gründerstipendium**, **Microsoft GenAI Studio at Station F**.

### What is not done

- **Notion holds 75 of 571 rows.** The CSV is richer and Notion imports it natively; pushing the rest one by one truncates every text field.
- **Five sweep lanes never got a dedicated verify agent.** Measured rather than assumed: they carry page evidence and terms on 100% of rows, and two are better resolved than a lane that did get one. Re-running them buys almost nothing.
- **The Excel dashboard is stale** — pre-reweighting. Re-run Claude in Excel over `all-programmes-ranked.csv`.

### Four things that cost time, so they are written down

- **A workflow returns nothing until it finishes.** A 25-agent run died on a session limit holding 41 programmes when 452 were already discovered. The harvester is why they survived. See [`subagents.md`](./subagents.md).
- **`pipeline()` drops a whole item when a later stage throws.** One failed verify agent discarded 50 good discovered programmes. The script now falls back to the discovered records.
- **Excel saved a summary over its own source CSV**, cp1252 instead of UTF-8, 571 rows down to 124. **The dashboard and the dataset are two files and never share a filename.** Lane 1 caught the same thing independently and flagged it below.
- **Measuring the wrong column, three times.** Lane quality inferred from journal-entry counts. Credits ranked as cheques. Fund sizes parsed as investments. Each time the thing measured was not the thing that changes.

---

## ✅ LANE 0 CLOSED 2026-08-14 ~19:00 IST. The audit is written, twenty commits are on main, and what remains needs you rather than an agent.

**Read [`../planning/initiatives/functionality-audit-2026-08.md`](../planning/initiatives/functionality-audit-2026-08.md) first.** It has four sections, a 32-finding register, and the query behind every number. The twelve raw audit passes are in [`../planning/initiatives/audit-reports/`](../planning/initiatives/audit-reports/README.md), saved as each finished rather than at the end.

### The one-sentence finding

**The machinery is built to an unusually high standard and large parts of it had never executed, because the switches that would start them were never given a way to be flipped, and the layer that would have reported the silence was reporting success.**

Three mechanisms were live in cron, on schedule, processing zero rows, with every dashboard green. `auto_derive_enabled` had **no writer anywhere in the repo** since 30 June, so calibration and the entire forecast audit selected nothing for six weeks. A guard test then found `auto_scout_enabled` in the identical state. And `withJobRun` recorded success whenever its callback resolved, while twelve tick handlers return a 500 from inside it, which is resolving.

### The pattern worth carrying forward

**A green test guarding a thing nobody reaches, found four separate times in one day**: a flag no code could write, three MCP write tools whose scope no code could grant, a connector cap with zero callers, and a registry counting declarations instead of imports. Each test asked *does this unit behave correctly* and none asked *is this unit reached*. In three of the four, a document had been written asserting the capability worked.

Two guards now exist for that class, both proven red before green, and the orphan gate makes a 27-module debt list shrink-only. **Two are still owed**, named in section 9 of the audit.

### 🔴 WHAT NEEDS YOU, in order

1. **Connect one real inbound signal source.** This is what actually blocks a live Discover-to-Learn run, and it is not a code fix. Nine OAuth providers are built and unregistered; `FIRECRAWL_API_KEY` is unset. Until one source flows, Discover has nothing to sense and the six stations behind it wait. Traced in production: 39 of 43 work items stand at the first station, and **no item has ever travelled the full seven-station route** (one did five, entering at Define).
2. **Twelve approvals, unanswered up to 86 hours**, each blocking one named piece of work. I deliberately did **not** fake these in the database: setting `approved` without `executed` resumes the run telling the agent a tool ran when it did not.
3. **Arm `auto_derive_enabled` and `auto_scout_enabled` across the fleet.** The switches now exist. Flipping them starts recurring model spend on 21 workspaces, which is a spend decision.
4. **Publish.** Main carries everything; the live site deploys from main, and pushing does not deploy.

### What is closed

Thirteen P0s, each with a test proven red by planting the defect. The money ones: no Stripe webhook idempotency existed at all (a redelivered renewal refilled spent credits, free), a failed line-items fetch left customers charged with nothing granted **and returned 200 so Stripe never retried**, a double refund minted credits from nothing, and `accounts.owner_id` had no unique index on a path that runs on every billing read. The execution ones: the same approval could execute twice, **merging a customer PR twice**, and live agent runs replayed every 60 seconds. The moat ones: `agent_memory` had **never held a row of kind `outcome`** while the precedent path had fired 358 times against that empty pool, and the forecast surface had no agent access at all.

**Six migrations applied to production and verified by me** — schema, policies, row counts unchanged, and the guard trigger proven to fire by attempting an illegal transition rather than by checking it exists. **Two flows exercised live**: Stripe idempotency (first claim true, redelivery false) and the full forecast lifecycle across six steps, both cleaned up afterwards.

### Handoffs to Lane 1

Six contracts landed and acknowledged: `reopenForecast` (appends to a log with no update or delete policy, so a corrected grade never erases the one it replaced), a three-way `suggestionQuality`, an honest total on the due list, the automation-flag catalogue with `costsModelCalls` per flag, `waitingOnNothing` for surfaces reachable without their precondition, and approval age (already in the payload, no server work needed).

**Correction I owe the record**: I told Lane 1 the one completed track proved the loop closes. It proves five stations of seven. A "completed" badge would assert a lap that never happened.

### Gate at close

`tsc` 0 errors · 8,969 tests pass, 0 fail (up from 8,787) · production build green · twenty commits on main · working tree clean.

---

## ✅ LANE 1 CLOSED 2026-08-14 ~19:05 IST. A new design system is on main, and five stations render through it.

**Everything is merged and pushed. `main`, `origin/main` and `parallel/lane-1-fresh` are all at `f3d1a8ef`.** Nothing is outstanding in any of the three worktrees.

### What landed

**Meridian, a design system written from scratch**, in `src/styles/meridian.css`. Founder ruling: do not inherit from v1, v2, v3, Obsidian, Tempo or Cadence. Its own namespace (`--mrd-*`), OKLCH throughout, both grounds from one set of tokens.

**Twenty-one components** in `src/components/meridian/`. Nineteen ported from beautifui.dev with every divergence recorded in [`../design/REFERENCE-PATTERNS.md`](../design/REFERENCE-PATTERNS.md) alongside the source URL, author, licence and capture date, so a later agent can re-check rather than re-guess. Two more (`StalledWork`, `NeedsSetup`) were designed from live production findings.

**A gallery at `/meridian`**, 1,718 lines, every component in dark and paper side by side. **It is the point of the exercise, not a nicety.** It found three defects nothing else could, the worst being that every primary button in the system had an invisible label on paper: `bg-mrd-solid` with `text-mrd-ink` measures 11.26:1 dark and **1.19:1 on paper**, because both tokens invert together instead of apart. Twelve controls, nine files. No typecheck or test can see that. `--mrd-on-solid` exists to fix it and is the only token light in both grounds.

**Five stations rewired onto it:** today, approvals, runs, design, traces.

### Two rulings that are now settled, and must not be reopened

- **ORCHID IS THE ACCENT.** It went the long way: gold rejected, orchid rejected after it for reading adolescent, four alternatives drawn in full and compared side by side, orchid chosen over all four. Recorded in `meridian.css` with the reason reopening it is not a colour choice: red, green and blue are spoken for, so the magenta arc is the only space left, and 315 is what keeps "this needs you" from collapsing into "this broke" for the most common colour vision deficiencies.
- **NO YELLOW, MUSTARD, AMBER, GOLD OR ORANGE.** Not as an accent, a warning, a chart series or a hover. **Never write the ban as an absence** ("there is no token to put one in") — that phrasing reads as an invitation and has now been fixed twice, in `ccd1e97e` and again in `438edf84`. Write it as a ban.

### The one thing that is genuinely open

**Nothing is blocked.** The remaining work is more surfaces: brain, learn, decide, plan, ship, build bodies, settings and admin have not been ported. Three verified defects from the review pass are also unfixed: **two monospace typefaces on Traces** (Geist Mono beside IBM Plex Mono, where the old page had one), **eleven approval rows whose only control is named "Open"** with no `aria-label`, and **Approvals' H1 saying "Nothing is ready for you." over a failed read and over a person with no workspace**.

### 🔴 One thing for Lane 0, and one for the founder

**`src/lib/ai/approval-claim.test.ts` fails on any machine with real Supabase credentials in `.env`.** The case is "an expired lease is reclaimable". With no credentials `resumeAgentLoop` short-circuits and the file passes in 477ms; with real ones it gets past the lease, makes a live call and hangs to the 5s timeout. **It fails on `origin/main` today and predates the design merge** — proven by running `origin/main` in a clean worktree with the same env. CI will not catch it because CI has no credentials.

**`docs/pitch/applications/sweep/all-programmes-ranked.csv` is uncommitted in the `Supaprod` worktree, with different columns and dates rewritten from `2026-11-02` to `11/2/26`.** I first read that as a spreadsheet having saved over it, which is a real hazard for this file and has cut it from 571 rows to 124 before. **That is not what this is:** the row count is intact at 572 on both sides, and the funding lane is live in this file and regenerates it from `scripts/rank-funding-programmes.py`, which is enough to explain a different column order. Left untouched as someone else's in-flight work. Recorded only so nobody else mistakes it for damage, or commits it from another lane.

### The method lesson worth keeping

**A comparison between two checkouts is only evidence if their environments match.** The lease test above was called pre-existing, then called a regression, before a clean `origin/main` worktree passed it in 477ms. The worktree had no `.env`. Re-running with the same env reproduced the failure exactly.


---

## ✅ APPLICATIONS SESSION CLOSED 2026-08-14 ~01:00 IST. Two applications filed, and the rules that produced them are written down.

> **Still live and still dated. Lane 0 did not touch any of it, and the two obligations below have not moved.**

**Two went out: Berkeley SkyDeck Batch 23 (2026-08-13, eight days early) and Conviction Embed Winter 2026 (2026-08-14, drafted and filed the same night).** Six applications are now live, one is decided.

| Programme | Filed | State |
| --- | --- | --- |
| Y Combinator Fall 2026 | 07-23 | Open, rolling. Demo + founder video still owed |
| South Park Commons | 07-31 | ❌ **Rejected 08-11, 05:31 IST. No reason given** |
| Betaworks AI Camp | 07-31 | Open. Batch starts 08-31 |
| The Residency | 07-31 | Open. **Decision due by 08-28** |
| **Berkeley SkyDeck** | **08-13** | Open. Interviews 09-08 to 10-05 |
| **Conviction Embed** | **08-14** | Open. **Rolling admissions, <1% selection** |

---

## 🔴 THE TWO DATED OBLIGATIONS. Nothing else in here is time-critical.

**1. Send the Conviction endorsement link. Days, not weeks.**

`https://embed.conviction.com/endorse/73794e94-33a1-43c1-95a9-7b8fedd39d26`

**No other programme on the board offers a third-party signal after submission.** The founder is solo and unvouched-for, and this is the only lever that touches that directly. **Their process is "rolling admissions over the month"**, so an endorsement arriving after the file has been read is worth nothing. Pick people who watched the work, not the most senior names available.

**2. Re-arm the demo approval queues before 2026-09-08.** They were armed 07-28 on a 60-day runway and lapse ~09-25, **inside the SkyDeck interview window of 09-08 to 10-05**. The SkyDeck traction answer promises in writing that *"a reviewer can open a login and use it."* If the queues have lapsed when someone tries, the application's own claim fails in front of the person judging it. Full design for the permanent fix is in the parked section below.

---

## The rulings from this session, all binding on every future application

**Read [`../pitch/applications/how-to-draft-the-next-one.md`](../pitch/applications/how-to-draft-the-next-one.md) before drafting anything.** It now carries fourteen corrections. The four that cost the most tonight:

- **Rule 0 — never volunteer the zero.** Not *"zero revenue and zero outside users"*, not *"no users"*, not any sentence whose only job is to announce an absence. **Say the state we are in:** private beta, invite-only, signup closed 08-07, public launch mid-September. **The ruling changes what we volunteer, never what we assert** — if a form asks for a number, answer it truthfully. Berkeley SkyDeck is the last application carrying the old framing and it cannot be edited.
- **Rule 0b — write confident, never braced for a fight.** The Conviction draft was rejected whole for register, not for any fact. *"I did not shop for an idea"*, *"nothing else has a claim on the time"*, *"named, so this does not read as evasion"* — all rebut charges nobody laid, and a reader feels the brace before weighing the claim.
- **Rule 0c — answer the question that was asked, and stop.** *"When did you start and when were you full time"* is two dates. It got career defence instead.
- **Rule 0d — Moon and Mars missions, never the mission names.** **This rule already existed** and still did not reach the draft, because it lived in the YC founder profile rather than in the file the procedure sends you to. **A rule outside the drafting path is not documented, it is buried.**

**Also settled:** the competitor is the stack, never claim to have none (doctrine Rule 7) · build on a draft rather than replacing it · leave optional fields blank · **"Cursor for PMs" is banned on any surface** and under-claims besides.

## What else shipped

**The 2026-08-11 retire-everywhere ruling finally reached the surfaces it missed.** *"Operating system"* was still live on eight public surfaces, worst of all `__root.tsx` — the default meta/OG/Twitter description every route without its own head inherits, including `/trust` — plus both in-product LLM system prompts, which shaped how the assistant described itself. Self-description is now the canon line; layer 02 reads *"the loop"* publicly. **tsc clean, 8,787 pass, 0 fail.**

**The founder record has one source with dates.** [`../pitch/applications/answer-bank.md`](../pitch/applications/answer-bank.md) §2 — both degrees, seven work-history entries, exact strings and month ranges. The undergraduate degree previously existed on the YC profile and **nowhere in the repo**.

**Stale numbers inside already-filed applications are listed.** The 401/362 feature register was retired 08-11 and appears in four filed applications that cannot be edited. **Never re-quote it.** Eight weeks is now ten.

**Notion Application Board rebuilt:** `Decision date`, `Outcome detail` and an `Accepted` status that did not exist; region chips on all 67 rows; two formulas (`Closes in`, `Waiting`); four views. All five submitted applications carry their filed text or a pointer to it.

---

## ⏸️ PARKED until ~2026-08-15: demo data freshness. Founder ruling 2026-08-13.

**Parked until the application push finishes.** The session cron reminder is in-memory and dies with the session, so this is the durable copy.

**The problem, in two halves.** Seeded demo workspaces ship five pending approvals whose `expires_at` sits hours out, so **the queue rots on its own** — on 07-28 every demo workspace had already decayed to 1 pending + 4 expired untouched. Separately, absolute timestamps age, so a reviewer opening in October sees data dated July.

**The agreed design:**

1. **Do not remove the expiry.** The horizon *is* the product. **A frozen queue is more suspicious than an empty one.**
2. **A daily tick, not a 60-day runway.** Copy `/api/public/hooks/calibrate-tick`.
3. **Re-arm undecided gates and advance in-flight work**, horizons relative to now.
4. **Leave settled history alone.** Old resolved calls *should* look old — that is the accumulated record.
5. **Create new rows, never rewrite frozen ones.** Forecast fields freeze on write behind a database trigger; bypassing it would make the demo violate the invariant the pitch is built on.
6. **Fail loud.** A silent no-op is how this gets found during an interview.

**Verify first:** no forecast has ever resolved, so `/learn` may be empty regardless of freshness.

---

## Open, not urgent

- **F6S founder profile at `f6s.com/rohit-gajaraj` is half done.** Both degrees in; of seven work entries only Intellect is in, IIM Bangalore has wrong dates (Jan '23 – May '23, should be Jan 2022 – Dec 2023), and Infineon, Bosch and both ISRO roles are missing. **The profile headline reads *Senior AI Product Manager at Intellect* instead of CEO at Supaprod** because the Supaprod entry has no dates. *"Describe yourself briefly"* is 63 characters over. **"Actively looking / Open to work" is switched on.**
- **Next applications, ranked:** a16z Speedrun is open year-round with a **priority window 10-12 to 11-01** — deliberately held until after the mid-September launch, so it goes in with real usage. Sequoia Arc is **closed**, notify-list only, verified twice.
- **Deck source defect:** slides 3, 6, 15, 16 overflow by 27/34/75/47px.

---

## ✅ SESSION CLOSED 2026-08-12 night. FC-01's grading half is BUILT, and ONE CLICK stands between it and being real.

**Start here, not with this file: [`../planning/initiatives/forecast-resolution-plan.md`](../planning/initiatives/forecast-resolution-plan.md).** It carries the design, the reasoning, the seven tasks and the four places the repo corrected the plan. Do not reconstruct any of it from this summary.

**What shipped.** The half of FC-01 that grades a captured forecast: a horizon passing now produces either a verdict or an explicit deferral, and a workspace can read how often its own calls were right. Ten commits ending at `94b66899`. Five modules: the import-free rule module `src/lib/brain/forecast-resolution.ts`, `src/components/learn/forecast-words.ts`, the reads and writes in `src/lib/forecast.functions.ts`, the drafting pass `src/lib/brain/forecast-audit.server.ts` riding the existing `calibrate-tick`, and `ForecastDeskPanel` on `/learn`. Gate: tsc 0, 8,787 pass, 0 fail, eslint clean on every touched file, production build green.

**THE ONE THING LEFT, and only the founder can do it: publish.** The code is merged and pushed and therefore NOT live. Until publish is clicked in Lovable, `/learn` carries no forecast group and nobody can settle anything. **No migration is outstanding**; `20260812210000` was applied by the founder and verified two ways (all six columns in the regenerated `integrations/supabase/types.ts`, and the version written into `supabase_migrations.schema_migrations` by Lovable's `20260812171150`).

**TWO CLAIMS THAT ARE NOT TRUE YET. Do not let them into any outward surface.** No forecast has ever resolved, so there is no calibration record; the permitted form is that the loop is wired and proven and begins accruing on first real use. And the auto-settle leg is **wired and unexercised**: it needs a decision carrying both a forecast and a `prd_id` whose outcome a person settled, and no such row is known to exist. Report it as wired, never as working, which is the same distinction the `applyOutcome` probe drew on 2026-08-06.

**The design rules worth not relearning.** A deferral writes no verdict, ever, because a deferral is the absence of an outcome rather than a kind of one; `inconclusive` is reserved for evidence that arrived and did not settle the claim. The tick enriches and never gates, so the due queue is derived in SQL from the frozen columns and a forecast reaches the desk with `auto_derive_enabled` off. `FORECAST_SAYS` and `VERDICT_SAYS` are kept disjoint by a test and **no mapping function may be written between them**: a spec outcome can be `missed` while its forecast is a `hit`, both correct at once. Reads fail soft, writes fail loud.

**Four repo facts that cost time to find, so they are recorded rather than rediscovered:**
- **`rtk`'s filtered `git status` and `git diff` can show a full staged diff on a clean tree.** For any claim about what is staged, committed or pushed, use plumbing (`git diff-index --cached HEAD`, `git diff-files`, `git ls-tree`) or prefix with `rtk proxy`. This nearly produced the exact opposite conclusion about whether the film embed had been committed.
- **A new `*.functions.ts` file must be registered in `SURFACE_REGISTRY`**, enforced by a CI gate whose comment says a capability with no on-screen door is an orphan. It fails `bun test`, not `tsc`.
- **Server-function logic goes in an exported `...Impl` taking the client** (see `budgets.functions.test.ts`), because a `createServerFn` handler cannot be reached from a test without an auth context.
- **A component file must not export constants**, or Fast Refresh breaks for every component in it. That is why `forecast-desk-words.ts` and `verdict-words.ts` exist as their own modules.

**Not mine, still open, flagged rather than touched:** `bun run lint` was already failing repo-wide before this work, hundreds of prettier errors across files unrelated to it, so that gate is currently protecting nothing. A loose gitignored screenshot sits at the repo root (`discover-error-current-vs-proposed.png`). A second Claude session (`supaprod-55`) was active in this repo at the same time, working the website-redesign stop-work; `origin/site/v3-enterprise` holds one commit NOT contained in main (`a11a9d01`), and the founder asked that session, not this one, to clear the GitHub compare banner.

---

## ✅ FILM SESSION CLOSED — 2026-08-12 morning. The product film SHIPPED.

**The 2:22 product film is done, founder-approved, and submitted to the YC application.** Everything about it — deliverables, source layers, the two change pipelines, the traps — lives in [`videos/supaprod-film/README.md`](../../videos/supaprod-film/README.md). Read that before touching anything film-related; do not reconstruct from this handoff.

**Git got reconciled this session, deliberately:**
- `main` now contains BOTH sides of the 36-ahead/32-behind divergence, merged (not rebased), one conflict (this file) resolved by union. Gates on the merged tree: `tsc --noEmit` clean, `bun test` 8807 pass / 0 fail.
- **Another lane's uncommitted WIP was found in the tree, parked on a rescue branch, then MERGED INTO MAIN on the founder's ruling** (governance panels, brain views, discover/engine-room routes, shell primitives, a new `BoundaryStatement.tsx`). Gates after that merge: tsc clean, `bun test` 8807 pass / 0 fail. Both `wip/lane-rescue-2026-08-12` and `film/teaser-v4` were verified fully contained in main and deleted from the remote.

**Open, small:** graphify community labels are stale after a forced re-index (`graphify label` refreshes, costs LLM calls). The 4K master lives on disk only (GitHub 100MB limit).

## The film is LIVE, and the website redesign is STOPPED — parallel session, 2026-08-12 evening

**The film embed shipped and is serving.** The deferral recorded above is retired: the founder asked for it directly. `/film` returns 200, the mp4 serves `video/mp4`, the poster `image/jpeg`, the captions `text/vtt`, all byte-identical to the repo. It runs from one component (`FilmPlayer.tsx`) on three surfaces — a landing section, the top of `/demo`, and a shareable `/film` with `og:type: video.other` — plus an in-frame share control and 43 generated caption cues. **A board row briefly said it was not live; that was an edge that had not propagated.** Re-probe before trusting either claim.

**Two things bit, both worth not repeating.** Cloudflare Workers caps a static asset at **25 MiB**, so neither master ships: `public/film/` carries re-encodes at 21.9MB (1080, CRF 23 — CRF 21 measured 28.0MB and would have failed the publish) and 9.0MB (720). And **Lovable syncs from GitHub asynchronously**: the first publish fired before the sync and shipped the old tree, the second returned the *same* `deployment_id` and coalesced into it. **Check `latest_commit_sha` matches your commit before publishing, and treat a repeated `deployment_id` as "nothing new started."**

**The website redesign was attempted and REJECTED on sight. Stop-work stands** until the founder reopens it. A from-scratch enterprise site was built on `site/v3-enterprise` and binned — *"absolute crap, it looks like generated output."* **That branch is deleted** (it was raising a compare-and-pull-request banner on GitHub) but the commit is preserved and readable forever at tag **`rejected/site-v3-enterprise`**; the tag message carries the do-not-merge reasons. **Do not merge it:** its hero used "operating system" (on the Never list for the landing page), it made the seven-station diagram the front door (banned — the visual signature of SAFe), and it was pushed with two failing tests. Post-mortem, plus a P0–P5 audit of the **live** site (P0: there is no mobile navigation at all): [`../design/archive/website-v3-enterprise-2026-08.md`](../design/archive/website-v3-enterprise-2026-08.md).

**The durable output is the claims audit, and it is not about a website.** 143 claims tested against the codebase by a workflow whose fact-checkers were told to refute rather than confirm; **43 died, 100 survived with `file:line` evidence you can cite.** It governs the deck, applications and sales calls. Analysis: [`../research/claims-audit.md`](../research/claims-audit.md). The complete record: [`../research/claims-audit-findings.md`](../research/claims-audit-findings.md). Re-runnable harness: `.claude/workflows/claims-audit.js`. **Read it before writing any outward copy** — it names live overclaims still on production, including a data-residency promise with no region data behind it and three machine-readable surfaces understating the tool count.

**The gap that lets it recur:** there is **no automated guard for any banned word**. `check-humanized.sh` deliberately does not scan `*.md` and is warn-only; `docs-doctor.sh` has zero vocabulary checks. A surface that breaks the vocabulary law ships silently and green.

## Current session — 2026-08-12 (resumed from context-break)

**Security review completed** (12 HTML composition files in videos/supaprod-film/compositions/frames/; all cosmetic/visual changes, no security-critical paths).

**YC application refresh & G1.1 blocker:**
1. ✅ Updated moving numbers in verified-numbers.md and APPLICATION-FINAL.md: **5,063 commits, 519 migrations** (was 4,950/510)
2. ✅ **G1.1 blocker test added** (`src/lib/entitlements.test.ts`): Ensures `memory_expiry_enabled()` gate stays OFF for Free tier at launch. Test fails loudly if flipped without founder approval. Protects moat: if gate is ON, Free users' 30-day memory expiry begins silently.
3. 📋 Created action-item summary for founder: 5 fields need input (7d demo video <2:15, 8a what-comes-next sentence, 9a discovery call count, 3b ISRO description, 3c prior builds), 1 needs ruling (AI-built framing extent).

**Next:** Founder provides demo video + fills application fields, or work proceeds to G1.4 outcome settlement on real workspace.

---

## ✅ LANE 1 SESSION CLOSED — 2026-08-12. Everything is on `main`. Nothing is stranded.

**Git state at close, verified by reading the refs back rather than assuming the push worked.** No SHA is quoted here on purpose: a commit cannot contain its own hash, so any value written into this file is permanently one commit stale and would read as drift. **The invariant is the claim, and it carries the command that reproduces it:**

```bash
git fetch origin
git rev-parse HEAD origin/main origin/parallel/lane-1-fresh   # all three identical
git rev-list --left-right --count origin/main...HEAD          # 0   0
git status --short                                            # only ?? .remember/
```

`.remember/` is untracked **by design** and must never be committed; the plugin injects it at SessionStart and clears it as it reads. Gates at close, run on the **merged** tree rather than this lane's own: `tsc --noEmit` **0** · `bun test` **8723 pass, 0 fail** · `docs:check` **0**.

### 🎯 START HERE, whichever lane you are

| | Do this | Why it is next |
| --- | --- | --- |
| **1** | **Build the forecast RESOLUTION path: `FC-02`.** Write `decisions.forecast_resolution` (`hit` / `miss` / `inconclusive`) and `forecast_resolved_at` once `forecast_horizon_date` passes. | Capture shipped this session, grading did not. **Forecasts now accrue and nothing settles them**, so the calibration record stays empty by construction. The lookup index `idx_decisions_forecast_due` already exists for exactly this query. **Until this lands, nobody may claim a calibration record.** |
| **2** | **Retry Lovable `query_database`, then seed the demo workspace.** | It returned `499 request_cancelled` on every call **including a bare `SELECT 1`** for this entire session, while `get_me`, `list_projects` and `get_database_status` all worked. Seeding is `teaser-video-plan.md` step 3, assigned to Lane 1 and marked blocking. **Nothing about FC-01 has been observed writing a live row**, for the same reason. |
| **3** | **Get a founder ruling on "the operating system."** | Recorded below. It is one question and it unblocks four surfaces. **Do not sweep it without the ruling** — there is no approved replacement noun. |
| **4** | **Confirm a publish ran.** | Being on `origin/main` is necessary, not sufficient: **Lovable deploys from GitHub**, and until a publish runs nobody can see the forecast field. This is the exact gap that made a finished commit invisible for a day, below. |

### A finished commit was invisible because it never left the machine

The founder reported the Ask pane work was "almost in the closing stage" and that he could not see it any more, and guessed it had not saved. **It had saved.** Commit `724d585a` sat on **local `main` in the Supaprod worktree and was never pushed**, while `origin/main` still carried the file it replaces. **Lovable deploys from GitHub, so an unpushed commit cannot appear in the product**, however complete it is.

It was stranded rather than merely unpushed: local `main` was **15 behind and 1 ahead**, so `git push origin main` would have been refused and forcing it would have destroyed 15 commits of other lanes' work.

**Recovered.** Cherry-picked with `-x` onto `parallel/lane-1-fresh` as `85d15762`; the parent `87281343` was already an ancestor, so it applied with zero conflicts. Verified on the merged tree: **`tsc` 0, 8712 tests pass, 0 fail**, up 27 from 8685 because its own test files came with it. Pushed and confirmed on the remote.

> **The rule this buys: a commit that never left the machine looks exactly like one that shipped.** `git status` is clean, `git log` shows it, the files are on disk. The only number that reveals it is **ahead-of-origin**, and nothing in the normal workflow puts that in front of you. **When someone says shipped work is missing, check ahead-of-origin before you check the code.**

**Swept every local branch for the same shape; that commit was the only one.** `wip/safety-snapshot` is fully pushed, `parallel/lane-0-fresh` is 0 ahead, lane-0's worktree is clean, and `backup/graphify-work`'s two commits are the deliberately parked graphify tooling. **Still at risk, and it belongs to whoever owns the Supaprod worktree:** that tree is dirty with 12 modified files plus untracked `src/components/governance/BoundaryStatement.tsx`, which is new and one step earlier in exactly the same failure.

### What Lane 1 shipped, all verified on the merged tree

| | What was wrong |
| --- | --- |
| **1** | **Gate signals filed under no workspace.** `recordHumanGateEvent` took `workspaceId` as optional and three callers omitted it, so rows landed with `workspace_id` NULL while `readAgentSignals` scopes by it with no fallback. The most-decided gate in the product moved no correction rate at all. The key is now required and the value nullable, so a caller that forgets is told at compile time. |
| **2** | **An extended approval came back in a column no queue reads.** `approvals-tick` expires a gate by writing both `escalation_state` and `status`, and every queue asks `status`. `extendApprovalTtl` moved only the first, so the extension reported success and the call returned to nothing, and the sweeper's expiry pass only re-reads pending rows so nothing could repair it. The run guard is an **allowlist of live statuses**, not a denylist of finished ones: `agent_runs.status` has no check constraint, and the denylist draft omitted `completed_with_failures`, which is 40 percent of every run ever recorded. |
| **3** | **A PR merged outside the product sat at `pr_open` forever.** `studio.pr.merge` was the only writer of status `merged` anywhere and no trigger writes it, so a merge from the GitHub UI, auto-merge or a bot meant preview capture, the changelog trigger, promote, revert and the spec ship stamp never fired. `ci-poll-tick` already read `pr.merged` every two minutes and dropped it. It now adopts the merge, idempotent by an `eq status pr_open` guard, stamping the spec at GitHub's `merged_at` rather than now. |
| **4** | **An unattended apply read back as a call the human made.** `decisions.auto_origin` defaults to false and neither caller of `applyFixCore` passed it. `source_kind` deliberately stays `manual` until `20260811140000` is applied by Lovable, because the live constraint would refuse `agent` and the insert reads no error, so the row would silently stop being written on a cron path. A missing row is worse than a mislabelled one. |
| **5** | **The landing loader made six round trips for a page that renders one count.** `Receipts` has ignored its `stats` prop since the counters beat was deleted on 2026-08-09, and `/` is server-rendered on the login and signup paths too. **The coupling was the worse half:** `getLandingStats` returns null if the RPC, the allowlist or any of four counters fails, and every one of those also discarded `waitlistCount`, so the close beat's nudge would vanish for a reason unrelated to the waitlist and read as the queue emptying. New `getWaitlistCount` is one unscoped query returning null rather than 0 on failure. |
| **6** | **The Ask pane recovery above**, `724d585a`. |
| **7** | **`FC-01`: the moat had a schema, a guard, and nothing that could write to it.** Migration `20260810180000` shipped five `forecast_*` columns on `decisions`, a resolution CHECK and the immutability trigger `trg_decisions_forecast_immutable` on 2026-08-10, under a founder ruling in its own header reading **"Build now, P0"**. **Not one line of application code ever referenced any of them**, and `grep -ci forecast` against the SSOT returned **0**. Both halves now exist: `createDecision` takes the triple at the commit moment, `setDecisionForecast` attaches one to a decision written through any of the other five doors, and the **"Log a decision" form carries the field**, so a person can record a forecast by using the product. |

### Open, and routed rather than blocked

- **The filmability pass could not run, and the reason is not a bug in the product.** This checkout has no Supabase env (`.env` holds only `E2E_DEMO_PASSWORD`), so a local run cannot sign in and every authenticated route silently renders `/login`. **The first report showed 33 identical "screens" at 261 chars each, which is the login page 33 times.** The tell was that every measurement was identical; a constant across every subject means you are measuring the instrument. Against production the login hung at "Signing in" with the auth POST never returning, while Supabase itself answered `/auth/v1/health` in 0.08s. The founder confirmed a Supabase admin-user 500 that Lovable was fixing, then applied a full migration and republished. **Retry before assuming anything about screen quality.** Capture script takes `FILM_BASE`, navigates by URL only and never clicks.
- **`teaser-video-plan.md` §0.2 is stale and reads as open.** The `/proof` seeded-data leak is **already closed**: `SEEDED_CLONE_IDS` in `proof-surface.functions.ts` lists all six Helio clones, closed 2026-08-07. §0.1, settling one real outcome, is **still unverified** because Lovable's `query_database` was returning 499 on every call including `SELECT 1`, while `get_me`, `list_projects` and `get_database_status` all worked.
- **Video is not Lane 1's.** A judged creative panel (`wf_ccbb05a5-fa8`, 11 agents, **text only, zero render credits**) produced a teaser treatment, handed to the **Video Teaser** session which owns the call. Its most useful output was not the winning concept but the **kill shots**: every one of five concepts was killed on an *honesty* ground rather than a craft one, and that convergence is the finding.

### The forecast, `FC-01`: what shipped, what did not, and the three design calls

**Shipped.** `forecastRefusal` is pure, exported and tested, and holds the two rules the database cannot enforce.

1. **All three fields or none.** They are one artifact and each missing piece breaks it differently. A claim with no observable resolves as an argument; a claim with no horizon **never comes due**, so `idx_decisions_forecast_due` never surfaces it and it silently never resolves. Either shape makes a decision look forecast-bearing while being ungradeable, which is worse than carrying none, because the count would overstate what can ever be settled.
2. **The horizon must still be open.** A closed window is being written with the answer available. **The trigger cannot catch this one** — it fires `BEFORE UPDATE` and this arrives on an `INSERT` — so it is refused in the validator or nowhere.

**Three calls made deliberately, so nobody re-litigates them by accident:**

- **Optional, and it must stay optional.** The server refuses a *partial* forecast and never an *absent* one. Make the field required and people type *"it will go well"* to clear it, which is a forecast-shaped object that settles nothing and then poisons the calibration record it feeds.
- **On the create form, not a later edit.** The migration says capture at the moment the decision is committed, and the trigger freezes all three the instant they are set. A forecast added once anything is known is a retrospective wearing a timestamp.
- **The chosen day is read as its END in the person's timezone.** "By the 20th" means the end of the 20th; taking midnight would silently shorten every horizon by a day. The date control's `min` is tomorrow.

> ⚠️ **NOT VERIFIED LIVE, and do not upgrade this claim without doing so.** No row has been observed writing to those columns, because Lovable's `query_database` was returning 499 all session. **Typechecked, unit-tested and merged is a different claim from a row landed.**

### ⚠️ NEEDS THE FOUNDER: is "the operating system" retired as the name of layer 02, or only as the lead?

**Not swept, deliberately, because sweeping it would be inventing vocabulary rather than applying a ruling.**

[`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md) §203 lists **`operating system`** in the *Never* column for public surfaces, and §236 records the 2026-08-11 ruling that the line is **"retired EVERYWHERE, including machine-readable surfaces."** By that reading these are live misses:

| Surface | |
| --- | --- |
| `public/llms.txt` and `public/llms-full.txt` | lines 14, 17, 29 in each. **These are literally the machine-readable surfaces the ruling names.** |
| `public/brief.html` | 457 `02 · The operating system` · 537 `The operating system, live` · 755 `It is a new operating system for product.` |
| `src/routes/index.tsx` | 146, the layer-02 line on the landing page |

**But the same phrase is still the layer's name in the canon, written after the ruling:** [`../../README.md`](../../README.md) line 175 (`02 The operating system`) and line 276, which is a **design contract** instruction reading *"The three layers, always named and colored: 01 the director … 02 the operating system (runs the whole lifecycle, blue) … 03 the brain"*. `CLAUDE.md` repeats it in its own three-layer summary.

**So either the layer name is an intentional survivor and the ban applies to the lead, or it is a systemic miss across the README, `CLAUDE.md`, the design contract, the landing page and both machine-readable files.** There is **no approved replacement noun** anywhere in the canon, and renaming a layer is a positioning decision rather than a cleanup.

**One piece of evidence says it is a genuine miss:** [`../growth/vocabulary-change-list-2026-08.md`](../growth/vocabulary-change-list-2026-08.md) line 49 shows the sweep rewriting that exact sentence to fix *unattended* while leaving *operating system* untouched in both the before and the after. The sweep had the string in its hands.

> **Checked and NOT a defect: `public/robots.txt:8` `Disallow: /trust-ledger`.** The retired-URL stub's own header names `public/*.txt` as references to clear, but that line should **stay**: the URL still resolves as a 301 and must not be indexed, and `/track-record` is already disallowed on line 7. Clearing it would let a crawler index the redirect.

### ⛔ Four traps this session hit. Do not pay for them twice.

**1. A constant across every measurement means you are measuring the instrument.** The filmability pass reported **33 screens at exactly 261 chars and 42 elements each**. That was `/login`, 33 times: this checkout has no Supabase env, so every authenticated route silently redirects and the capture looked like a completed audit. One varying number would have meant 33 real screens. **The capture script records `landedOn` separately from the requested route for this reason. Read that field first.** Script: `scratchpad/filmability.mjs`, takes `FILM_BASE`, navigates by URL only and never clicks (pressing a key in the approvals tray dispatches a real agent run irreversibly).

**2. A pipe hides the gate's exit code.** `bunx tsc --noEmit | tail && echo $?` reports `tail`'s status. Redirect to a file and read `$?` on the command itself. Cost one false "clean" this session before it was caught.

**3. Two reviewers can contradict each other and both be right.** One said no code reads or writes the forecast fields; another said "FS-01 shipped the write side". **Both were true, about different mechanisms on different tables.** FS-01 scores `insights` rows of kind `prediction`/`risk` into `insights.resolution`; `FC-01` is `decisions.forecast_*`. **Read which table a claim is about before you believe or dismiss it**, and note that only the second one is the moat, because FS-01 grades an *agent's* prediction rather than a human belief captured at the moment of a call.

**4. Verify a finding is still open before acting on it.** `teaser-video-plan.md` §0.2 reads as an open blocker; the `/proof` seeded-data leak was **already closed 2026-08-07** (`SEEDED_CLONE_IDS` lists all six Helio clones). Three of that file's shot addresses have also rotted, verified in code: `/helio-labs-harbor/relay` is a deliberate redirect marked *NOT PORTED, DELIBERATELY*, `"Clustered into bets"` is not a rendered string anywhere in `src/`, and `?stage=` was removed with its component so the decide beat is at `/decide`.

---

## ✅ LANE 0 SESSION CLOSED — 2026-08-11. Everything is on `main`, tree clean, zero divergence.

**What this lane was:** positioning, market research, claim integrity. **What it found:** the product was fine; almost everything we *said* about it was not.

### 🔴 THE THREE THINGS THE FOUNDER MUST DO

| | | |
| --- | --- | --- |
| **1** | **Review [`../pitch/yc/APPLICATION-FINAL.md`](../pitch/yc/APPLICATION-FINAL.md).** He read it once and was not happy; his objections are recorded at the top of that file, in his words, with what was done about each. **That file is the only paste source.** [`fall-2026-application.md`](../pitch/yc/fall-2026-application.md) now opens with a NOT-THE-PASTE-SOURCE banner. |
| **2** | **Three `[YOU]` fields.** The demo video (under 2:15; the 11:46 one on the form is unwatchable for a partner), the `[N]` discovery-call count in 9a, and **3b/3c on the founder profile, both still blank** — ISRO belongs in 3b, and two empty fields read as incuriosity. |
| **3** | ✅ **RULED 2026-08-11: the compound dies, the adjective lives.** `agentic-first` and `agent-first` are dropped in our own voice; **`agentic` survives** in technical, investor and analyst material and never in a hero or eyebrow. Measured: *agentic* appears in **53 corpus documents** against 1 for *audit trail*, so it is the market's word; but Gartner's 2026 Hype Cycle puts agentic AI at the **Peak of Inflated Expectations**, so leading with it invites a discount. Canon: [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md) §5M. |

### What changed, and why it mattered

**Three metrics presented as proof in the YC application were seed data.** 119 lessons, 38 self-decided, 36 decisions from an earlier lesson. Every `learnings` row sat in a seeded workspace, 37 predated the repo's first commit, and the `prd → learning` edge had never fired. **The root cause is one line:** every census told demo from real by matching **the shape of a workspace id**, and `seed_sample_workspace()` issues ordinary ids. Lane 1 shipped a `seeded` column, then an ownership function, and the honest set fell twice: **6 workspaces, all founder or test accounts, 18 missions, 5 decisions, 0 learnings. No customer data at all.**

**The falsified moat claim was still in five paste-able places**, including the block the application titles THE SUBMIT SHEET, 500 lines below a note saying that answer needed rewriting. **A correction block above a passage does not stop the passage shipping.**

**"13 months" was false in 26 places** across six files, against a repo whose first commit is `2026-06-02`. Ten weeks. Founder-confirmed.

**"The agentic-first operating system for product teams" is retired everywhere**, including machine-readable surfaces. The eyebrow is now **"For product managers who ship with agents"**, amber on *product managers*, blue on *agents*. Narrow on purpose: **nobody self-identifies as a team.**

### The two rules this session bought, and they are the durable output

> **1. A number quoted outward carries its query, or it does not go.** Canonical file: [`../pitch/verified-numbers.md`](../pitch/verified-numbers.md). Every figure with the command that reproduces it, the honest set, and the retired list.

> **2. Measure what writes, not what looks right.** Three wrong numbers in one day, all one shape: *the thing we measured was not the thing that changes.* An id that *looks* seeded, against a `seeded` column. An `is_sample` flag, against **who owns it**. A `themes.status` column, against `spine_tracks.theme_id`, which the code writes and never touches `status`. **A status field no writer sets is not stale, it is fiction.**

**And the blind spot two audits share** (named with Lane 1, [`../pitch/verified-numbers.md`](../pitch/verified-numbers.md) §5): a **phrase** sweep catches a retired claim in any wording and misses **a number carrying the same claim**; a **mechanism** sweep catches a missing writer and misses **prose asserting the mechanism exists**. Anything appearing only as a sentence is invisible to both. **A documented gap reads as a handled one.**

### ⚠️ Two things the next session should not repeat

**I broke links with a blind regex and the gate could not see it.** The vocabulary sweep replaced *ledger* inside **filenames**, producing links to `trust-track record.md`. `docs-doctor`'s link pattern was `[^) ]+`, which excludes spaces, so a target containing one was never extracted. **Both the links and the gate are fixed** (`scripts/docs-doctor.sh:78`). Never run a word-level regex across link targets.

**I told the founder my bucket was clean and it was not.** A five-lane audit with adversarial verification then found **38 confirmed defects, two of them blockers**, in files I had edited hours earlier. The blockers were retired numbers on the investor-conversation card and on the one-pager, tagged `[PROVEN]`. **Assert nothing about your own work without re-checking it.**

### ⚠️ ROUTED TO LANE 2 BUT THE MESSAGE TIMED OUT — recorded here so it cannot be lost

**`public/brief.html:744`** still reads `<div class="zl">Built agent-first</div>`. The identical string in the investor deck is already changed to **`Built for agents to run`**, which keeps the meaning and drops the retired compound. **Same fix applies.** It sits inside a text node, so parsing the tag stream before and after should show an identical stream; that check exists because an earlier edit to that file introduced an entity two greps could not see.

**The `agentic-first` instances under `src/` are code comments and should be LEFT.** `Hero.tsx:53/187/273`, `a2a-card.ts:23`, `decision-gate.ts:8`, `spine/driver.ts:24` and the rest are internal reasoning, and several are dated records of why a decision was made. Same call Lane 1 and I made for `getProvenance`: **the ruling governs the words we say to buyers, not the words engineers read.**

### Open, routed, not blocked

- **Filmability pass**, waiting on Lane 2's screen cleanup. Method and the seven screens that matter are in [`../pitch/teaser-video-plan.md`](../pitch/teaser-video-plan.md). 25 substantial screens exist; the 49 stubs under 3KB are redirects, not holes. **Film the real product; use AI tooling for pacing, titles and motion, never for generating screens.**
- **Eleven eyebrow and definition strings** in `public/` and `src/`, routed to Lane 2 with exact strings and colours.
- **`docs/planning/rebuild-2026-07/**`** still carries retired vocabulary and was deliberately left alone as dated design exploration, like `archive/`. Same for `session-decisions.md` and `strategic-inputs-log.md`, which the strategy index describes as preserved in original form.

### First outcome on an application

**South Park Commons rejected 2026-08-11, "not the right fit."** Recorded in [`../pitch/applications/README.md`](../pitch/applications/README.md) with the caveat that matters: a single boilerplate rejection is **not** evidence the positioning is wrong, and reading it that way is how a good thesis gets abandoned on noise. But that application went out **before** the corrections and closed on the falsified moat claim. **The lesson is sequencing: an application sent before its evidence was checked cannot be un-sent.**

---

## 🛑 LANE 0, 2026-08-11 — READ THIS BEFORE THE YC APPLICATION OR THE HOMEPAGE

**The three numbers that proved the product worked were seed data. They are out of the application. The same rows are still live on the public homepage.**

### What the founder needs to decide, nothing is blocked on him

| | Decision | Default already applied |
| --- | --- | --- |
| **1** | **The replacement YC copy is outward-facing and needs his eyes.** The three product numbers are gone and a second admission paragraph is in, naming the workspace-id-shape cause and the column that fixes it. | Written and in the file. Nothing sends without him, so this waits, it does not block. |
| **2** | **Stop leading with the forecast as the moat.** | ✅ **RULED AND APPLIED 2026-08-11.** Canon: [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md) §5K.1. Lead with the governed record; the forecast is a byproduct of the work whose first consumer is the next agent, never a scoreboard. |
| **3** | **"The company brain" became "the brain".** Decided under the autonomy directive rather than escalated. | Applied everywhere. YC's "Company Brain" stays quoted and attributed at `README.md:47`. |

### The finding, so nobody re-derives it

The application said *119 lessons recorded, 38 where it decided the verdict itself, 36 times a new decision was made from an older lesson*, and its own annotation called the last one "the only number that proves the core idea works". Two lanes queried the live database independently and agreed:

- **All 119 `learnings` rows sit in seeded workspaces.** Real count **zero**.
- **37 of the 119 are dated before `2026-06-02`**, the repo's first commit. Earliest **2025-12-05**, six months before the product existed.
- **One workspace holding 16 of them has no row in `workspaces` at all.**
- **`38` is arithmetic on the fixture.** Seven workspaces named "Helio Labs" hold exactly 38 between them.
- **`36` is `artifact_lineage` learning→decision: 71 rows, 0 with `seeded = false`.**
- **`prd → learning` returns zero rows.** That is the edge written when a shipped spec gets its verdict. It has never fired.

**Root cause, and it is one line:** every census in this repo told demo from real by matching the **shape of a workspace id**, and `seed_sample_workspace()` gives its workspace an ordinary random id. Wrong in both directions. Lane 1 has shipped a `seeded` column so it cannot recur.

### Still open, and it is latent rather than live

**`src/lib/landing.functions.ts` excludes only `is_sample = true` or the names "Sample workspace" and "Demo workspace".** Six of the seven "Helio Labs" fixtures have `is_sample = false`, and an orphaned `workspace_id` cannot be excluded by a list built from `workspaces`. Applying the exact predicate the code applies:

    public_missions 233 · public_decisions 181 · public_outcomes 49

**All 49 would-be "outcomes graded" are fixture or orphan rows.** The comment above that query states the law it breaks: *"Undercounting is acceptable; inflating never is."*

> **Correction, 2026-08-11, and it matters.** Lane 0 first wrote that these numbers were live on supaprod.ai. **They are not, and nothing renders them.** Verified independently rather than taken on report: `missionsRun`, `decisionsRecorded`, `outcomesGraded` and `aiCallsGoverned` appear nowhere in `src/` outside `landing.functions.ts`, and `index.tsx:297` passes the whole stats object to `<Receipts stats={stats} />` where `Receipts(_props: …)` deliberately ignores it. The counters beat was deleted on 2026-08-09 and the prop was left behind.
>
> **The defect is real and different.** `index.tsx:173` runs `getLandingStats()` in the route loader, firing six database queries, of which five feed fields nothing displays. `/` is server-rendered on the login and signup paths too, so this runs on the three hottest public routes to compute numbers that are thrown away. **The exposure is latent: the day someone wires those fields to a surface they ship seed counts, and the field names will make it look safe.** Lane 2 is narrowing the loader and dropping the dead prop.
>
> **What this does not change:** pulling the three numbers from the YC application was right and is unaffected, because that document quoted them from a database query rather than from the page.

### The same defect, found a second time, in launch copy

[`../growth/02-prelaunch-copy-pack.md`](../growth/02-prelaunch-copy-pack.md) carries a **DO NOT SEND** block at the top now. Three claims are contradicted by the live database and two were tagged **PROVEN**:

- *"For 13 months Supaprod ran on itself."* **The earliest mission in the database is `2026-06-04` and zero missions predate `2026-06-02`.** Supaprod has existed for **ten weeks**. Both sentences asserting the thirteen-month runtime are corrected in place.
- *"the numbers from my own workspace: 133 missions, 72 recorded decisions, 2,162 AI calls."* **No workspace has those numbers.** Largest is the "Helio Labs" fixture at 94 and 85; the plausible founder workspace holds 64 and 50. Total AI calls across everything is **34,686**.
- The `[refresh; live counters]` tags promise a live counter. **There is none.** A tag saying a figure refreshes is worse than a stale figure, because it claims the number is maintained.

**Needs the founder and nothing else can resolve it:** "13 months" appears **sixteen times** and some of it is biography rather than product. *"I spent 13 months building the other thing"* reads as a previous product and may be true. The two product-runtime sentences are fixed; **the other fourteen are left alone and need his eye**, especially the subject line *"13 months of agents running a product org"* and the title *"I recorded every product decision I made for 13 months."*

### What else was swept while the founder slept, 2026-08-11

- **The falsified moat claim was still live in five paste-able places**, including the YC application's own SUBMIT SHEET, 500 lines below a note saying that answer needed rewriting. **A correction block above a passage does not stop the passage shipping**, and a file that greps positive for "Falsified" reads as handled and is not. All five now say the surviving thing: the part a competitor cannot rebuild is what the team believed would happen before they found out.
- **Forty-five files in `docs/growth/` and `docs/pitch/` are off the retired vocabulary**, plus seven in `docs/strategy/` and the SSOT. The investor deck had seven instances in visible copy including a whole thesis line; rewritten and verified by comparing the parsed tag stream before and after, 1269 events, identical.
- **`positioning-locked-2026-08.md` carried both the retired register table and the ruling that killed it.** The table listed **audit trail** under *Never* for public surfaces, and audit trail is on the keep list. Struck through, with `AGENTS.md` rule 3 named as the single source.
- **Deliberately not swept:** `session-decisions.md`, `strategic-inputs-log.md`, everything under `archive/`, and `docs/pitch/trust-ledger-launch-plan.md`. Records of what was decided, in the words used at the time. Also **`provenance` stays in code**, per Lane 1: `getProvenance` is a contract, and the ruling is about what we say to buyers.
- **Still open and routed to Lane 1/2: the live `/trust-ledger` route.** `src/routes/_authenticated.trust-ledger` plus the generated route tree. A URL a signed-in user reads, carrying the one term that scores **exactly zero** per million. Needs a redirect, so it is a real change rather than a sweep item.

### The two rules this establishes

1. **A number quoted outward carries its query, or it does not go.** None of the three had recorded SQL anywhere in the repo, which is why the file could tell the founder to "confirm them the same morning" and give him no way to do it.
2. **Assume any number in `docs/` is suspect if it separates demo from real by the shape of an id.** The pattern is `_0000000-0000-4000-8000-000000000000`.

**Also corrected:** the commit figures were stale again in five places and the note above them saying "eight weeks" was wrong arithmetic. Live is **4,950 commits and 510 migrations over ten weeks** from 2026-06-02.

**Also landed:** [`../research/market-validation-2026-08.md`](../research/market-validation-2026-08.md) is complete, all five lanes, 11,900 words. §8 is the one to read: decision intelligence is a real Gartner category as of January 2026 and the wrong one; ThoughtWorks named our layer 03 "context graph" at Assess in April 2026 and left forecasts out of it; corporate prediction markets beat expert forecasts by 25 percent and died anyway because the people who could buy them were the people they exposed.

---

## UI/UX SESSION CLOSED — 2026-08-11 01:05. Everything is on `main` at `c69b2464`.

**Nothing in flight, no agent running, tree clean, `HEAD` and `origin/main` identical.** `tsc` 0 errors, `bun test` **8730 pass / 0 fail**.

### The founder's three items, smallest first

| | |
| --- | --- |
| **1. The e2e demo password** | `E2E_DEMO_PASSWORD` is unset, so **421 browser tests cannot run**. This is NOT a broken fixture: `Cadence!Demo2026` leaked in a public v4 README and was rotated on 2026-07-25 as containment. **Do not restore it.** Supply a new one as an env var; nothing needs editing. `demoPassword()` throws with instructions until then. |
| **2. The leaked literal is still in four files** | `docs/pitch/yc/founder-profile-answers.md:183`, `docs/pitch/yc/fall-2026-application.md:253`, `docs/operations/rename-cadence-to-supaprod.md:47`, and `supabase/migrations/20260604203338_*.sql:4`. **The first three are records OF the leak, so deleting them edits a security record. The migration is different: it is `v_password text := '<literal>'`, real code that already ran.** His call, all four. |
| **3. A fourth session is writing to the `Supaprod` worktree** | Not Lane 0, not Lane 1, not this lane; all three verified. It committed four times tonight with `git add -A`, each sweeping another lane's uncommitted work into its own message. Nothing was lost, by luck. All three known lanes now commit after every edit with explicit paths. |

### What shipped

| | |
| --- | --- |
| **Three surfaces lying while loading** | `/approvals` was a blank rectangle, `/threads` announced an empty workspace mid-read, `/engine-room` printed a heading over nothing. All `isLoading ? null`. |
| **Four composition and language defects** | `/today` reserved 234px no content could reach · `/decide` had one bullet 190px off the list's edge · `/plan` mixed a consequence into a list of bets · `/crew` said "16 work here" and pointed "13 of them" at zero |
| **Settings sidebar** | Five sentence-fragment group labels → nouns (Crew, Company, Connections and data, Account, Plan and usage). One was wrong: "What reaches you" contained Profile. Checked against 8 shipped settings surfaces; none uses a sentence. Guarded by test. |
| **Row density** | Leading moved from document (1.55) to row (1.4) on the row primitives. `.sp-line` 46.9 → 40.9px. Chrome was tighter than data; that is backwards. |
| **Light theme bug** | `--ds-gray-alpha-400` sat below `-300`, so `--hairline` and `--card-border` came out in **opposite relative orders in light vs dark**. |
| **The e2e harness** | Nine correct specs that could not run: `@playwright/test` was never a dependency. Wired, plus the `storageState` setup project. 421 tests now list. |
| **Guards added** | public-surface truthfulness (47 surfaces), row density, settings labels, station-spine render, `a-null-under-a-heading-is-a-broken-promise`, `the-browser-suite-cannot-carry-a-password` |

### The pattern worth carrying forward

**Seven enforcement layers were reading zero while looking healthy.** The e2e suite that could not start; density tokens with 1 consumer of 3; the humanization hook whose pattern could not match an HTML entity; `public/*.txt` with no checker at all; two of Lane 1's guards anchored on the wrong occurrence; and a credential guard blind to the credential in its own file's comment.

**A guard that has only ever passed is indistinguishable from one that cannot fail.** The only way to tell them apart is to plant a known-bad input. Commission every guard that way.

**And its twin:** this repo documents a fixed defect by quoting the broken value verbatim, so a grep for the broken value finds it forever. That cost time in all three lanes tonight, and once put a leaked credential back into every failure artifact. Sweep the *thing*, not the encoding you happen to think in.

---

## 📌 STANDING RULES for every session, all lanes (founder ruling 2026-08-11, relayed via the UI lane)

**Everything lands on `main` in the `Supaprod` worktree. Nothing anywhere else is finished. No work gets lost.**

1. **`Supaprod`/`main` is the single destination.** Branch worktrees are workspaces; nothing is done until merged and pushed to `main` there.
2. **`git add -A` is banned. Name explicit paths.** This is the rule that actually prevents loss: a session none of the lanes could reach committed four times with `-A`, each sweep taking another lane's *uncommitted* work into its own commit under its own message. Nothing was lost by design, only by luck. A sweep cannot take what is already committed and cannot take what it did not name.
3. **Commit after every edit, not at the end of a chunk.** The exposure window is exactly the time your work sits uncommitted.
4. **Never stash or delete files you believe belong to another session. Diff before you describe.** An invisible mistake is the worst kind.
5. **An agent you spawned is your work**, even if you did not type it.

**And the reading rule, which cost all three lanes time last night:** two lanes opened the same file to resolve the e2e credential question, each quoted the paragraph confirming they were stuck, and **neither read down to line 40, which names the answer** (`harbor@supaprod.ai`, *"the account any agent uses for testing"*). **Read past the paragraph that agrees with you** — `docs/operations/*` files are running records and put corrections *after* the thing they correct.

---

## ✅ LANE 0 SESSION CLOSED — 2026-08-11 00:15. Everything is on `main` at `6052dbcb`.

**Nothing is in flight. No agent is running. The tree is clean and `origin/main`, `parallel/lane-0-fresh` and my HEAD are all the same commit.** `docs:check` 0, `tsc` 0.

### What shipped this session, in one list

| | |
| --- | --- |
| **The corpus** | All **679** archive documents read **in full** (5,935,025 words, 24 readers) · ***How I AI*** ~95 episodes, absent from the paid archive · **all ~15 Community Wisdom editions** via the founder's authenticated browser |
| **Positioning** | [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md) — category, ICP, the one job, the sharpest claim, the kill list, the messaging kit, the binding application rule |
| **Four falsified claims** | swept from every document, the investor deck, `brief.html`, the machine surfaces, and **all four root docs**, each of which told the reader the compounding record was the moat |
| **Quote integrity** | [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md) — 131 quotes checked, **9 mis-filed archive files**, 5 episodes quarantined |
| **YC** | Paste-ready corrections for four fields + both videos, at the top of [`../pitch/yc/fall-2026-application.md`](../pitch/yc/fall-2026-application.md) |
| **Applications** | 4 accelerator folders corrected; submitted ones annotated rather than rewritten; the shared answer bank and doctrine re-numbered |
| **Landing** | Exact strings at [`../growth/landing-copy-2026-08.md`](../growth/landing-copy-2026-08.md), final, for the UI lane to apply verbatim |

### The four things waiting on the founder

1. **The YC application** — he updates the portal himself. **Re-derive the numbers** (they aged 14% in ten days and moved three times in one evening) and **fill the user-count slot or leave it empty**.
2. **Build duration, eight weeks or nine.** Git cannot settle it — the history was rewritten, so every commit reads 2026-08-10. Understating duration **overstates velocity**, so this is an overclaim question, not rounding. Only he knows when he started.
3. **Who is running in the `Supaprod` worktree.** A session commits there with `git add -A` and swept ~60 of the design lane's uncommitted files into its own commit. **It is not Lane 0.**
4. **Outside users.** Every number we have proves the machine works. None proves anyone wants it. No rewrite closes that, and it is the real gap in every application.

### The eighth wording, found last — and why it matters more than the other seven

The retired moat claim also travels as ***"that record is the one thing a better model cannot generate for you afterward."*** Every banned word is absent — no *backfill*, no *copy*, no *accumulate* — **which is why six sweeps walked straight past it.** It was sitting in the Betaworks **thesis answer**, the field that file itself calls *"the question that decides the application."*

**The rule that follows: read the sentence that says why a competitor cannot catch up, wherever it appears, and check the claim. A sweep that greps only the words a claim used last time will keep missing the claim.**

---

## ⏰ OVERNIGHT STATUS — Lane 0, 2026-08-10 23:45. Read this before the section below it.

**Founder is asleep with a standing mandate for all three lanes:** decide on the evidence, do not park work waiting for a ruling, and where a call is balanced take the **reversible** option. Constant communication between lanes; subagents and skills used freely to go faster.

### 🔔 THE ONE THING TO REMIND HIM

**He asked to be reminded about the YC application.** He will update the portal himself; the paste-ready text is written and waiting at the **top of** [`../pitch/yc/fall-2026-application.md`](../pitch/yc/fall-2026-application.md).

Four fields, ranked by damage if a partner tests them: the *"How far along are you?"* sub-field · 7f · 9b · one sentence added to 9a. Plus the founder video, the demo video, and one word in the Team Update.

**Two things only he can do on paste day:**
1. **Re-derive the numbers.** Live tonight: **4,872 commits, 508 migrations, eight weeks.** The old draft said 4,000 / seven weeks — a **20% understatement of our own velocity**, in the field where velocity is the argument.
2. **Fill the user-count slot or leave it empty. Never pad it.** It is the first thing a partner looks for and nothing else in that field substitutes for it.

### What closed since the section below was written

- **The corpus sweep is COMPLETE** — all 679 archive documents read in full (5,935,025 words), plus ***How I AI*** (~95 episodes, absent from the paid archive) and **all ~15 Community Wisdom editions** (the private 30k-PM Slack, via the founder's authenticated browser).
- **The Lemkin quote item below is CLOSED.** It was worse than a bad quote — the claim spliced Mosseri's engineering pod onto Lemkin's sales-team arithmetic into a sentence neither source states. Fixed in the one-pager and given a paste-ready replacement in the YC file. **Nine archive files are confirmed mis-filed**; five episodes quarantined. See [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md).
- **Positioning is locked** — [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md) carries category, ICP, the one job, the sharpest claim, the kill list, the messaging kit and the binding application rule.
- **Four claims were falsified and swept from every surface**, including all four root docs which each told the reader the compounding record was the moat: *"cannot be backfilled"* → **the forecast** cannot be · *"90–95% agentic"* → graduated autonomy with gates · *"the labs decline this vertical"* → they could not build it **securely** across someone else's tools · *"single-suite incumbents cannot be neutral"* → the real competitor is **DIY, a folder of notes**.

### The three findings that should change what gets built

1. **A practitioner named our pain better than we ever had:** *"PMs got faster at shipping but didn't get better at defending why. **The judgment gap got exposed.**"*
2. **The wedge is the transition, not the tool.** Every DIY success in the corpus is single-operator; every DIY failure is multi-person or multi-agent governance. **Sell at the second person, or the first fleet of agents** — never against someone's folder.
3. **Learn already auto-settles 32% of outcomes** (38 of 119, agent-decided) — but wired into **one station of seven**. Say it exactly that way; it is a stronger claim than "we have graduated autonomy", which everyone makes.

### Open overnight

1. **Four accelerator applications** still carry retired claims (`betaworks-ai-camp`, `the-residency`, `ef-bridge-sf`, `south-park-commons`). A sweep was in flight; verify it landed.
2. **The `Supaprod` worktree question — founder only.** A session is committing on `main` inside the design lane's checkout using `git add -A`; it swept ~60 of their uncommitted files into its own commit. **It is not Lane 0.** Only he can identify it. Mitigation adopted meanwhile: commit after every edit, never batch.
3. **The landing page** — all five items approved by Lane 0 under the overnight mandate and handed to the UI lane.
4. **Outside users.** Every number we have proves the machine works; none proves anyone wants it. No rewrite closes that.

### Three working rules learned the hard way today

- **Grep the claim, not the file.** One assertion travels as *backfilled · bolted on · bought · copied quickly · only accumulates with time · recovered after the fact · starts at zero*. It escaped **six** sweeps, twice inside one document.
- **Never pipe a gate.** `docs:check | tail && push` reads `tail`'s exit code, so a failing gate ships. Main went out red because of it.
- **Verify on the merged tree.** Three worktrees means every lane verifies "clean" against a tree missing the others' work. **Merge, do not rebase** — a rebase broke mid-flight here before.

---

🚨 **LANE 1 & LANE 2 — START HERE BEFORE ANYTHING ELSE (2026-08-10)**

Lane 0 cycle 1 is complete. Eight actionable gaps are waiting on your prioritization. **Read in this order:**

1. [`README.md` top section](../../README.md) — 30 seconds, has the three findings
2. [`docs/planning/SOURCE-OF-TRUTH.md` rows 96–103](../planning/SOURCE-OF-TRUTH.md) — 2 minutes, the official work board with gaps, owners, priorities, acceptance criteria
3. **This section §Lane 0 Cycle 1 below** — detailed directives, sequencing, blockers

**Then:**
- Founder: confirm three calls (Lemkin quote, memory expiry, billing tiers)
- Lane 1: commit against G1.2 (decision memory P0) by EOD
- Lane 2: confirm you've read G2.1 (hero reframe P0) and can start work

**Track your progress:** Update SSOT status from `◐ routed` → `◐ in progress` → `✅ done` as you work. That's how we verify the cycle is complete.

---

**State at close:** seven commits on `main`, pushed to `origin/main`, tree clean. `tsc` 0 · 8,299 pass / 0 fail · eslint 0 · `bun run build` green · `docs:check` clean. **App code is not live until the founder clicks Publish in Lovable.**

The canonical work order remains [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md). No board rows changed status: this session was founder-directed copy, positioning and design work, not queue items.

---

## Lenny's Data is set up and the first probe is done. START HERE.

The founder bought the $400 Annual + Insider plan on 2026-08-10 and named this **the highest-priority work**, above build items: *"are we building even the right thing."* Official launch stays **mid-September** (he confirmed: do not touch the SSOT date; a 36-hour figure he mentioned is a private stretch target, not a deadline).

**Setup is finished and committed (`64f537dc`). Do not redo it. Read [`../research/lennys-data-archive.md`](../research/lennys-data-archive.md) first.**

- 679 documents (312 podcasts to 2026-08-09, 367 newsletters to 2026-05-05) cloned to `lennys-newsletterpodcastdata-all/`, **gitignored**.
- **The paid licence forbids redistributing raw files "in any form", private repos included, and forbids commercial use.** Treat it as reading, never as an asset: no corpus in git, no corpus in Supaprod's brain or RAG, no analysis published as Supaprod marketing. Derivative internal analyses are explicitly permitted.
- MCP `lennysdata` lives in [`.mcp.json`](../../.mcp.json) (env-driven, portable to Codex/Antigravity/Cursor); token in `.env` as `LENNYSDATA_TOKEN`, **expires 2026-09-09**. It was deliberately removed from the Claude-local registry, so **a restart is required** before `mcp__lennysdata__*` tools resolve.
- The 3-month newsletter embargo is a property of the archive, not the tier. Insider does not lift it. Those ~13 posts are readable on the site; they were never the bottleneck.

**Prior work exists: [`../research/podcast-corpus-lenny.md`](../research/podcast-corpus-lenny.md) already mines 16 episodes with a 10-insight synthesis, and it is cited downstream. DO NOT re-run that sweep.** The delta is 84 unmined in-window podcasts, 367 unmined newsletters, 5 post-cutoff episodes, and quote verification (existing quotes are ASR auto-captions; all 14 source files are now in the archive as official text, and those quotes are already flowing into the YC application).

**First probe, already run — a near-null that matters.** Across all 679 documents: *"forgot the why / nobody remembers the reason"* appears in **1 file**; *"institutional/tribal knowledge"* in 12, mostly in passing. But *"repeating mistakes"* hits 36 files, *"what did we learn / close the loop"* 38, *"no memory / blank slate"* 28. Three quotes carry the finding:

- **Zevi Arnovitz (2026-01-18):** after a model errs you "update the `/command` prompts with that knowledge so that in the future, it's not making that same mistake."
- **Dan Shipper (2025-07-17):** "he recorded all of it, put it into a prompt, and **he never made the same mistake twice**."
- **Lenny's newsletter (2026-02-03), "Step 9: Adding agent memory with AGENTS.md":** LLMs are "Mensa geniuses with the short-term memory of a hamster… if you want continuity, **you have to engineer it**."

**Read:** the pain is real but the vocabulary is wrong. Nobody says "we forgot why we decided." They say the loop is **hand-cranked**. The market's taught best practice is a hand-maintained markdown file. So the wedge is *"the loop you are hand-cranking runs itself"* — which independently validates the existing never-say-remembers/stores/logs doctrine with evidence rather than taste.

**Method warning:** regex over 5.9M words is at its ceiling — "reinventing the wheel" returned 36 files of which ~2 were on-topic. It finds phrases, not meanings, and cannot find the operator who described this pain in words nobody guessed. The deep pass needs semantic search (`search_content` over MCP, post-restart) or parallel full reads. **The founder has not authorised a workflow or subagents; ask before spending at that scale.**

## The one pattern worth carrying forward

**Three separate defects this session were the same failure: a fix that edited one constant and missed its twin, plus a test that then certified the result.** It is worth checking for before assuming a past fix landed.

| Fixed once | Still live somewhere else |
| --- | --- |
| Seeded slug removed from `Receipts.tsx` (2026-08-05) | same slug in `LandingFooter.tsx` **and** `index.tsx` `MACHINE_CONTENT` |
| "You approve every gate" corrected in `DESC` (2026-08-06) | same false claim in `MACHINE_CONTENT`, ten lines away |
| "remember" purged from every `.tsx` surface | `brief.html` and the investor deck, six times each, because a `*.tsx` find-and-replace does not open a `.html` file |

In two of the three, the guard written alongside the original fix read only the file that had been edited, so it passed green the whole time. `src/components/landing/no-seeded-slugs.test.ts` now walks `src`, `public` and `docs/pitch` rather than one file.

---

## What changed

**Truthfulness (`ffeb2d80`, `2e0d1c71`, `362a6e39`)**

- The invented four-row "graded ledger" is gone from the landing page, `/brief` and the investor deck, along with its `Worked example` banner and the dead `.ledger` CSS in both HTML files. It was disclosed rather than removed on 2026-08-05; the founder's ruling is that a page arguing "receipts, not claims" cannot ship a fabricated object with a louder label.
- **A seed fixture was being served as live proof.** `/d/acf1fa74…` is an `is_sample` row that `/proof` deliberately filters out, and it was linked from the footer under the heading "proof" and from `MACHINE_CONTENT` under "## Live proof", which is the copy answer engines read. Both removed.
- Two false claims corrected in `MACHINE_CONTENT`: "You approve every gate" and "The human gate stays in the middle the whole time". The loop is *designed* to run unattended (`MAX_TRACK_CORRECTIONS = 2`, three verify cycles per mission, then it escalates). The gate is real but sits at the **edge** (the merge gate is a fixed floor) and at the **cap**, not in the middle.
- `/updates` filled with six real ships, 2026-07-12 to 08-09, each dated from `git --diff-filter=A`.

**Positioning on machine surfaces (`6af52d95`)**

- `llms.txt`, `llms-full.txt`, `agents.txt` and the A2A card opened with July wording. All now carry the canonical thesis and **the three layers**, which were absent from every machine surface.
- The agent card described us as a place where artifacts "live in one place" — the storage claim the doctrine bans.
- `llms-full.txt` told answer engines we are for "teams building net-new products". [`../strategy/brownfield-positioning-evaluation.md`](../strategy/brownfield-positioning-evaluation.md) is explicit that the canon segments by **role**, and that Transform (650K existing teams) is the larger motion. It was suppressing the bigger market.
- Integrations corrected: the file claimed Linear, Notion, Google Docs and Jira (all `stubAdapter`) while omitting Intercom, Zendesk, HubSpot, Salesforce, Stripe, Canny and Productboard (all real).
- Free-tier retention said 14 days; `FREE_MEMORY_RETENTION_DAYS` is **30**.

**Landing page (`9ebaf0a9`, `6fb20d0c`, `f03b92f2`)**

- The hero said "For product managers **who ship with agents**" while the next beat says "Product is still waiting for its own." It also gated out the Transform motion.
- ⚠️ **SUPERSEDED 2026-08-11.** This bullet described the hero opening with the category line, and that line is now retired everywhere. The eyebrow is **"For product managers who ship with agents"**, amber on *product managers*, blue on *agents*. Kept below as the record of what it was: ~~the hero opens with the category, **"The agentic-first operating system for product teams"**~~, blue on `agentic-first` (the machine), ember on `product teams` (the humans), which is the page's own colour language.
- Headline's last verb `gets sharper` → **`guides the next call`**, matching the title, meta description, `llms.txt` and the card.
- CTA `Request access` → **`Join the beta`** in nav and hero, matching what the form's own submit button and `MACHINE_CONTENT` always said.
- Removed under the CTA: the Critic offer paragraph and the invite-code link. Three asks under one button.
- `memory sharpens it` → `the brain guides the next` in the replay strip.
- One of eight restatements of the human gate repointed to the idea the page never made: **the boundaries are set in advance**.

**Contrast, and it was a real AA failure (`f03b92f2`)**

Measured on the rendered page against `#0a0a0a`. The category line was **2.56:1** at 11px against a 4.5:1 floor, so only the ember word was readable. Same 2.56:1 that failed the brief audit.

| | before | after |
| --- | --- | --- |
| category line | `#52525c` 2.56 | zinc-400, 7.55 |
| spec connectives | `#52525c` 2.56 | zinc-400, 7.55 |
| headline verb line | `#71717b` 4.10 (fails under 24px) | `#7a7a85` 4.67, the darkest passing value |

Hero spacing also went from **20 / 28 / 36px** (a linear ramp in 8px steps, invisible against a 52px headline) to **16 / 40 / 56** — a ratio, so the eyebrow hugs the headline it labels, the sub gets a real break, and the CTA gets the largest.

---

## Do not re-debug these

- **`POST /api/mcp` is correct and `/mcp` is a different server.** `src/routes/mcp.ts` is auto-generated by `@lovable.dev/mcp-js` and serves four tools; `src/routes/api/mcp.ts` serves the ten documented ones. Only `search_signals` is in both. A 2026-08-07 change moved the agent card to `/mcp` on the strength of a **GET** probe — GET on an API route falls through to the SPA shell, so it proved nothing. `a2a-card.test.ts` now binds the advertised endpoint to the route file implementing the tools.
- **Layer 02 stays "the loop" in `ThreeLayers.tsx`.** The hero carries the category once, at the top. Under a headline reading "One system, three layers", the same words would be the system inside the system. Both files explain this so it is not re-litigated.
- **Do not re-add an illustrative ledger** anywhere. `Receipts.test.ts` fails if those rows return; its ratchet was reversed this session (it used to *require* them, which made the fabrication load-bearing).
- **The footer's `/proof` link stays.** A beat is persuasion, a footer is a directory. Removing it would leave `/proof` with zero inbound internal links, the condition documented in that same file as what was crippling `/product`.

---

## Open, in the order I would take them

0. **The Lenny corpus analysis — the founder's stated top priority.** Setup is done; the work is not started, by his explicit instruction to stop and restart fresh. See the first section above for the delta, the first finding, and the method warning. Verification of the 16 existing ASR quotes against official transcripts is the cheapest launch-protecting item in it.
1. **P1 is unchanged and still the highest-value action *that needs the founder's hands*: settle one outcome.** It costs ~10 minutes and does not compete with the corpus work, which is agent time. His own stated principle this session — do not "claim which is not there in the product" — is exactly this item. `applyOutcome` has never completed in production. Founder-only; an agent must not author the verdict word. Everything about the compounding claim rests on a path that has never run, and `/proof` shows an honest zero until it does.
2. **Sweep `zinc-600` across the rest of the landing page.** It measures 2.56:1 and fails AA anywhere it carries text under 18px. This session fixed three instances in the hero; the token is almost certainly used as a quiet tier in other sections.
3. **`/faq`, `/product` and `/security` copy was not audited.** Three of the four surfaces that *were* checked carried a dated or false claim, so these deserve the same read.
4. **The hero spec column's vertical anchor.** It is centred against a left column that got ~120px shorter when two blocks came out. Its colours are now correct; its position was not re-derived.
5. **`/brief` and `/investors` are still iframe-over-`brief.html`,** so crawlers cannot see them. This is the SEO/GEO item the founder asked for by name and it is still open.

---

## 🚨 LANE 0 CYCLE 1 COMPLETE — FINDINGS & EXECUTION DIRECTIVES (2026-08-10)

**Lenny's Data analysis is done.** Full findings in [`../research/lane0-cycle1-findings.md`](../research/lane0-cycle1-findings.md). **Eight actionable gaps are now routed to Lanes 1 & 2 in SSOT rows 96–103.** This section broadcasts them. Do not treat this as a report to read later — these are active directives with owner, priority, sequencing.

### Three Primary Findings (Market Evidence)

**Finding 1: Decision Memory + Receipts Is The Wedge (P0)**
- **The pain:** Operators say "why did we decide X?" — they need instant proof (decision → evidence → shipped → outcome verdict).
- **Not agent autonomy; not Critic red-team.** Market validates verification over capability (Aakash $28K, Fin $0.99/resolution, Mercor $400M).
- **Market vocabulary is exact:** Reddit r/PM (480 pts): *"Why did we decide X? Cue hours finding that Slack conversation."*
- **Action:** RPT-01 & RPT-12 (decision memory + outcome-fed trust) MUST ship BEFORE launch, tested end-to-end. Demo: "Why did we decide X?" → instant chain with proof.
- **Owner:** Lane 1 (engineering) + Lane 2 (UX reframe)

**Finding 2: Governance Via Capabilities, Not Process Orchestration (P1)**
- **Cherny right:** Process orchestration is dying (2026-02-19: "you get better results if you just give the model tools, you give it a goal, and you let it figure it out").
- **But governance is load-bearing:** Approval floors, capability grants, receipts as evidence — Anthropic Cowork, OpenAI rules, Reganti/Badam patterns all require this.
- **Market validates governance:** Teams pay for trust + receipts, not tool breadth. Graduated autonomy requires proof (receipts per capability, not assumed).
- **Action:** WM-M15 (Captains + trust ladder) is HIGHER priority than mission breadth. Every agent capability starts at trust tier, earns advancement only via receipts. Reorder build queue.
- **Owner:** Lane 1 (prioritize governance over autonomy expansion) + Lane 2 (remove "orchestrates"; say "governs")

**Finding 3: Buyer Is The Fleet Manager, Not Solo PM (P1 ICP shift)**
- **Evidence:** Lemkin (SaaStr 2026-01-01): Amelia (product staff) spends 20% time managing, orchestrating agents. Coinbase: one-person teams (2026).
- **Implication:** TAM isn't "PMs using AI helpers." It's "one operator managing a fleet of agents (2–20)." Title shift from PM to product-staff / product generalist / product founder.
- **Action:** Refine ICP archetype from "individual PM" to **"operator (PM/founder/product generalist) managing an agent fleet."** Lead GTM with Lemkin's Amelia seat.
- **Owner:** Founder (positioning/messaging) + Sales (GTM targeting)

### Eight Gaps — Execution Lanes & Sequencing

**Lane 1 (Engineering & Core) — 5 Items**

| Gap | Priority | Owner | What Changed | Action | Blocker? |
|-----|----------|-------|-------------|--------|----------|
| **G1.1** Memory expiry gate OFF | P1 | Lane 1 | Moat breaks if expiry is ON at launch. Currently OFF (correct state). **Gap: no test** that fails if it ever flips. | Add gate test: `memory_expiry_enabled()` must read false at launch. Test fails if ever enabled without founder approval. | Founder confirms state is good |
| **G1.2** Decision memory + receipts | P0 🔥 | Lane 1 + L2 | Wedge is decision memory, not Critic. RPT-01 & RPT-12 must ship BEFORE launch, tested end-to-end. Demo: "Why did we decide X?" → instant chain (decision → evidence → shipped → outcome). | Ship + test RPT-01 & RPT-12. Do NOT launch without this working. | None |
| **G1.3** Billing tier reconciliation | P1 | Lane 1 | Code has five internal tiers (free/pro/max/team/enterprise); founder locked four public tiers (Free/Pro/Business/Enterprise, 2026-07-13). Reconcile slugs, verify memory-expiry logic covers all tiers. `max` is internal-only, `team` displays as "Business" — likely already correct. | Verify tier reconciliation is complete or remove unused `max` tier per founder decision. Audit memory-expiry list. | Founder decision: is current state acceptable? |
| **G1.4** Outcome settlement end-to-end | P2 | Lane 1 + Founder | `applyOutcome` has never run in production. Moat claim rests on this. Founder needs to settle one outcome (10 minutes: visit `/proof`, pick any decision, run verdict, record outcome). | Founder: settle one outcome. Lane 1: verify path works, close the loop in `/proof`. | Founder time (10 min) |
| **G1.5** WM-M15 priority reorder | P1 | Lane 1 | Governance (Captains + trust ladder) is now HIGHER priority than mission breadth. Founder was expanding mission tiers; evidence says governance first. | Reorder build queue: move WM-M15 (Captains, trust ladder, approval gates) above additional capability expansion. Every new capability starts at trust tier. | None |

**Lane 2 (Design & UX) — 3 Items**

| Gap | Priority | Owner | What Changed | Action | Blocker? |
|-----|----------|-------|-------------|--------|----------|
| **G2.1** Hero reframe | P0 🔥 | Lane 2 + Founder | Current hero says "agents build autonomously." Market pain is "why did we decide X?" with proof. Wedge is decision memory, not agent autonomy. | Reframe hero from "agents build" to "every decision on the record with proof." Lead with "Why did we decide X?" — the exact operator pain language. | None |
| **G2.2** Seven-station UX compression | P1 | Lane 2 | Station model is architecturally correct (seven-station is right). But market loops compress to 3-beat: Prototype → Outcome → Learn (W3 finding). Showing all seven names adds cognitive load, makes product look pedagogical. | Hide station names from user path; show only decision → build → outcome milestones. Keep 7-station in Engine Room (admin). UX refactor only, no architecture change. | None |
| **G2.3** Vocabulary shift | P1 | Lane 2 | Cherny right: process orchestration dying. But governance is load-bearing. Language matters for differentiation. "Orchestrates" is wrong. | Replace "orchestrates" with "governs decisions." Add "agents earn capability via receipts," "approval gates," "graduated autonomy." Audit all user-facing surfaces. | None |

### Founder-Escalated Calls (Blocking)

These three must be resolved before Lanes 1 & 2 can execute some gaps.

| Item | Status | Action | Urgency |
|------|--------|--------|---------|
| **Lemkin quote in YC app** | BROKEN (lines 1051–1052 in fall-2026-application.md) | Paste corrected paragraph (lines 1071–1080, same file). Full audit in [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md). | 🚨 URGENT — blocks investor submission |
| **Memory expiry gate** | GOOD (set to FALSE in DB seed) | Confirm this state is acceptable. G1.1 will add test to prevent flipping. | CRITICAL — unblocks G1.1 |
| **Billing tier reconciliation** | LIKELY OK (max is internal-only, team displays as Business) | Confirm current structure matches your intent or decide on max-tier removal. | STRATEGIC — unblocks G1.3 |

### What This Means for Build Priority

**Do not start anything new until:**
1. G1.2 ships (decision memory + receipts) — this is the wedge and the moat
2. G2.1 ships (hero reframe) — this is how you talk about G1.2
3. WM-M15 moves up the queue (governance before autonomy expansion)

**Do not launch without:**
1. G1.2 working end-to-end
2. G1.1 test in place (memory expiry gate)
3. G1.4 verified (at least one outcome settled and on `/proof`)

**What you are not building (kill list):**
- Mission breadth expansion without governance in place
- Agent expansion without capability-tier advancement
- Orchestration language (use "governance" instead)
- Storage claims (use "decides," "learns," "guides next call")
- Seven-station UX (keep internal, hide from user path)

### Evidence

- **Lenny's Data:** 679 documents (312 podcasts + 367 newsletters), official paid archive, 2026-08-10
- **W3 analysis:** Full corpus sweep completed; findings synthesized from 200+ on-topic hits
- **Quote verification:** [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md) — official transcripts checked against ASR captions; two Class 2 defects found (archive mis-filing)
- **Positioning locked:** moat, category, ICP (shift to fleet manager), wedge (decision memory), station model (pedagogical, UX refactor only)

### What the Next Cycle Looks Like

**Trigger:** New Lenny drop (newsletter or podcast) OR when Lanes 1 & 2 ship 50%+ of the 8 gaps.  
**Refresh:** Compare market shifts against what you built; push changes only when something moved.  
**Frequency:** Max 2x/month, never daily.

---

**Cycle status:** Analysis complete. Findings routed. Execution waiting on Lanes 1 & 2 prioritization and founder confirmation on three calls. Do not mark this as done until lanes have committed changes.

---

## Lane 1 — parked, 2026-08-11 09:40 IST

**Parked, not dropped. Blocked on a tool, not on a decision.**

**The pending-decision backlog (audit finding #8).** This is the founder's own
"83 decisions are ready for you" complaint, and it is the one item I will not
estimate. It needs live counts and the Lovable MCP has returned
`499 request_cancelled` on every query since roughly 09:25. Retry before doing
anything else with it.

**THE CALL CHANGED ONCE THE NUMBERS ARRIVED, 10:58 IST. Do not mass-approve.**

The earlier plan here was "approve the reconstructible subset". Running it down
against real counts kills it. A mission still `proposed` establishes only that
`launchesNow` is false; gate 6's other term, `!p.reversible`, is a per-proposal
signal NO column preserves. Approving anyway means assuming `reversible = true`,
which is a fail-open assumption on a gate -- the exact defect closed in Gate 4 the
same morning. It would write 141 approvals imitating gate decisions nobody made,
which is what `decision-gate.server.ts` exists to prevent.

**It is a read-side question, not a write-side one.** Of 175 pending, only 47 are
in real workspaces (40 auto-origin, 7 manual); the other 128 are demo. The
approvals queue ALREADY hides decisions whose mission is still `proposed`, so the
machinery for not showing non-actionable rows exists. Before anything is written,
find which surface produced the founder's "83" and count what it actually renders.

Superseded plan, kept because the reasoning is still the right shape for any
future backfill: Gate 6's input
is `launchesNow || !p.reversible`, a per-proposal signal no column on `decisions`
preserves, so a blanket `WHERE auto_origin IS TRUE` approves rows the live gate
would have queued. The reconstructible half is "the mission is still proposed".
Every row approved this way needs a `workspace_audit_log` entry stating
explicitly that `decideDecisionReview` was **not** re-run and which input could
not be rebuilt — a backfilled row must never imitate a gate-decided one, which is
the distinction `decision-gate.server.ts` already exists to protect.

Exclude the manual rows (gate 2 refuses those forever, correctly) and the handoff
"Mission completed" rows, which carry low confidence that `decisions` has no
column to record.

**Still open behind it, in order:** the first-run path (finding #3, the 60-second
P0, a user-path change), Discover being blind to work already started (#4), and
the promotion bar that is mathematically unreachable (#5).

**Do not trust any number that splits demo from real by workspace-id shape.** That
pattern is wrong in both directions and it is what hid the product's largest gap.
`artifact_lineage` now carries a `seeded` column; use it. Other tables still need
the same treatment.

---

# 🎨 MERIDIAN LANE (lane-1), 2026-08-16 — the design system became mechanical, and started being adopted

**Merged to `main` as a fast-forward at `da900d63`. 36 commits. tsc clean, 9299 pass / 0 fail
across 556 files, verified on the REBASED tree and not on the lane's own.**

## The reframe that governs everything below

The founder corrected the job mid-session and the correction is the important part:
**this is a REVAMP, not a MIGRATION.** Renaming `Button` to `Action` in a file that still
dumps three metrics into a card moves zero distance. His words: *"across all our surfaces we
are just dumping data and showing some metrics and some cards. It's not at all right."*

Sequencing follows from it: **one pass per surface** (decide what belongs, then build it from
the right components), never a mechanical rename pass followed by a UX pass.

## Two instruments now exist. Run them.

```bash
bun run design:adoption    # how much of Meridian the PRODUCT uses. 15/27 today.
bun test                   # the ratchet lives here, not in a hook
```

`design:adoption` answers the question the ratchet cannot. The ratchet counts retired
vocabulary and only moves down; it can reach ZERO while the system is still unadopted,
because deleting a `--sp-` token and reaching for a Meridian component are different acts.

**When measured: eleven of Meridian's components were used in the gallery and NOWHERE in the
product** — Chat, PromptBar, StreamingText, ToolChips, ContextCards, InsightCards,
RecommendationCard, DiffTable, FineTuneCard, SelectionActions, SidebarNav. Precisely the ones
that carry an experience rather than a paint. `REFERENCE-PATTERNS.md` names the destination
surface for each and marks every row "ported"; not one destination imports it. **The founder's
complaint is a documented plan that stopped at the gallery.**

## What was built IN the design system (do this first, always)

- **`meridian/rows.tsx`** — `Row`, `Line`, `Who`. A rebuild, not a move: their classes live in
  the retired `primitives.css`. The measured density survives (`Line` is `py-[11px]` +
  `leading-[1.4]` because 46.9px landed in a band the research says appears nowhere).
- **`meridian/forms.tsx`** — `Field`, `Input`, `Textarea`, `Checkbox`, `Choices`. **Every form
  in Settings, Boundary and governance/ was on the retired layer because there was nowhere to
  port to.** `Choices` declares its mode: `one` is a radiogroup (ONE tab stop, arrow keys),
  `any` is independent toggles keeping Tab. The ARIA differs; the decoration does not.
- **`--mrd-field` / `--mrd-field-focus`** — solved for, not chosen. `--mrd-edge` is *named*
  "a field's own edge" and measures **1.79:1 dark / 1.65:1 paper** against the 3:1 WCAG 1.4.11
  asks. It was NOT raised: 14 files spend it on spinner rings, chart strokes and gridlines, and
  a gridline at 3:1 shouts. New pair measures 3.05 at rest and 5.36 focused, both grounds.

**beautifui.dev has NO form primitives.** It documents nineteen components and not one is an
input, textarea, checkbox, select or field label; its inputs live only inside purposeful
components. That is a position, not a gap — so the form mechanics were ported from the
reference's own inputs, which this repo already carries at parity (Chat's composer, FineTune's
sunken track and raised thumb).

## The worst defect found, and how it was found

Measuring the **rendered** `/today` returned this as an `<h2 class="sp-gate-q">` — 19px, the
size reserved for *"the gate question, biggest thing on a surface"*:

> **"Runs the tool with the agent's arguments."**

59 registered tools, 36 catalogued, **6 gated ones falling through** to a generic default:
revising a decision, revising a spec, moving a roadmap commitment, reverting a merged release,
spawning sub-agents, crawling a site. Every one already had a written label.

**This was the SECOND time this defect appeared, one file away.** `every-tool-can-be-named.test.ts`
records the first (`ACTION_LABEL`: ten entries against 59 tools, so six of seven stations said
"working"). That guard covers naming and could not see the consequences map, so the identical
shape — sparse lookup behind a generic fallback — recurred next door. **A sparse map fails
silently and looks finished.** Now guarded, scoped to gated tools, and the guard was verified
by breaking it.

## Read this before trusting any analysis in this lane

Four parallel agents produced excellent surface-by-surface maps. **Three of their specific
claims were wrong and only reading the code found it:**

- `Diffstat` + `unit="files"` was called a drop-in by TWO independent agents. It is not:
  `unit` reaches only the `aria-label`, so a sighted reader still sees `+2 −3`, which means
  lines. **Agreement between agents is not evidence.**
- `RunBoard`'s `aria-expanded={false}` was reported as a hard-coded lie. It is not — there are
  two buttons in a ternary, each correctly paired.
- "Replace `RunGate` with `StalledWork`" would have destroyed the surface's focal decision. A
  gate is a decision with one primary action; a list is a list. `/approvals` runs BOTH, and
  that pattern was copied instead.

Also corrected, from me: I claimed the shell not using Meridian's `SidebarNav` proved
non-adoption. **Wrong** — the shell rail is a functional superset (keycaps, the `g` chord,
route ownership, a four-control foot). The gap runs the other way: port SidebarNav's animated
selection and value-keyed count badge INTO `shell.css`.

## What is next, ranked, verified, and NOT blocked

1. **`ContextCards` on Decide's evidence recess** (`decide.tsx:2234-2254`) — `.slice(0,4)`
   becomes a counted cap with a way past it. ~25 lines, all data present.
2. **`StalledWork` on Build's "Stopped"** (`build.index.tsx:543-550`) — **67 halted missions
   render age-blind today.** Near drop-in.
3. **`StalledWork` on Today's "Stuck"** (`today.tsx:1101-1126`) — same defect, front door.
4. **`ToolChips` + `ContextCards` in `AskRunCard.tsx:194-224`** — the card holds a full ordered
   tool trail and shows ONE verb; holds N memories and shows TWO, uncounted. Every field is
   already fetched. Highest visible change available.
5. **`ToolChips` + `ContextCards` in `MissionOrchestratorDetail.tsx:531-582`** — same mapping,
   and it retires ~76 units of ratchet debt, more than any other single file.
6. **`Search` + facet chips on the connector catalog** (`AccountConnectionsSection.tsx:700-777`).
7. **Adopt `meridian/forms` across Settings, Boundary and governance/** — now unblocked.

## Meridian gaps found, each already built TWICE in the codebase (the system's own bar)

- **A code diff.** `studio/CodeDiff.tsx` is the product's only real one, has two callers
  already, and sits on 29 retired `sp-` references. `DiffTable` is a RECORD-SET diff and cannot
  do this job — the brief's premise that they overlap is wrong.
- **`status` on `ToolChipRow`** (`"ok" | "failed" | "denied"`). Without it, adopting ToolChips on
  the run ledger DELETES the failed/denied register, which law 1 forbids.
- **A bulk row-selection bar.** `SelectionActions` is a TEXT-selection prose toolbar, not this.
  Three surfaces still import `SelectionBar` from the retired layer for want of it.
- **`TaskRows` needs `onOpen`** — it has only `onRetry`, and every list in this product navigates.
- **`RecommendationCard`'s `Confidence` meter is not exported**, so `decide.tsx` draws the same
  number through `VerdictBadge`, which cannot tell `null` from a low score.
- **`Gate`, `Receipt`, `AgentMark`, `Choices`-as-segmented** each exist twice already.

## Rules this lane re-learned the hard way

- **Verify on the merged tree.** This lane was 0 fail on its own and **1 fail after rebasing
  onto main** — the ratchet caught `governance/AutomationBoundary.tsx`, a file ANOTHER lane
  added on the retired layer. It was fixable only because `Row` and `Line` had been built hours
  earlier.
- **Suspect the instrument.** Two false readings were chased before any number was believed: a
  contrast of 18.94:1 for a 0.36-alpha border (a probe that forgot to composite over its
  ground), and `stepUp: 1` claiming focus did nothing (a same-task style-recalc artifact —
  `matches(":focus")` was true while `getComputedStyle` still held the old value).
- **A guard that cannot fail is worthless.** Every guard added here was verified by breaking it.
- **Point a new guard at something you believe is clean.** The ratchet's first version reported
  `/today` as clean while that surface was built entirely from retired components. Closing that
  hole added 91 invisible files and moved the honest total from 2,283 to 2,460.
