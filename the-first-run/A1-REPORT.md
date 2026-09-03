# A1 report — audit, positioning, journey, decisions, plan, date

> _Created: 2026-09-02 · Last updated: 2026-09-02_

> _Written by A1 (Fable 5.1) for the founder, 2026-09-02 evening IST. Every number carries its query
> or its `file:line`; the SQL is in the audit transcript and the important ones are reproduced here.
> The queue this report dispatches is [`A-QUEUE.md`](./A-QUEUE.md). Rulings made today are R-29 to
> R-31 in [`RULINGS.md`](./RULINGS.md)._

---

## 0 · The call, in eight lines

1. **The diagnosis is not new and it is correct.** The repo made it on 2026-08-25 (`REIMAGINING.md`,
   `ROOT-CAUSE.md`) and 2026-08-26 (`OPERATING-MODEL-5-SESSIONS.md` §0.5: *"Nothing on the queue
   fixes this, because everything on the queue adds to it"*). What has not happened is obeying it.
   Since then the repo gained a fifth queue, a five-session fleet, a strip fold, a discriminator
   sweep and a Meridian pass. **Not one of those changed what a person sees in the first sixty
   seconds or what a run gives them at the end.** The pattern to break is not a design pattern. It is
   that the runtime and the run screen have never been the only thing anyone worked on.
2. **The product has no real data.** Zero non-sample workspaces with volume. The one "real" workspace
   is a seeded persona wearing `is_sample=false`. No human has signed in since 2026-07-19. Every run,
   signal and sign-in in the last thirty days was an agent or the founder driving a demo persona.
   (§1.2, with SQL.)
3. **Exactly one run has ever walked all seven stations**, and its Ship station *declined*, its
   changeset was abandoned, and its forecast was about Supaprod's own process (*"the PRD will be
   approved within 3 business days"*), not the user's product. That is what "Finished" shows today.
4. **The plumbing for visibility exists and is wired.** Tool calls reach the browser at 500 ms. The
   transcript, the artifact pane, the ask-in-place, the footer mode, the steer field, the one-press
   start: all real, all at HEAD. The run screen is not missing parts. It has four station displays,
   two composers with different meanings, internal debug prose in the header, and no ending.
5. **Layer 1 leads. Layer 3 is the reason to trust it and come back. Layer 2 is the machine and is
   never shown as a product.** §2.
6. **Three surfaces: Start, Run, Settings.** Everything else folds in or is deleted. §3 names them.
7. **Two verdicts, not one.** The check at Build (did the change do what the spec said, judged by a
   seat that did not write it) is what launch demonstrates. The horizon check (did it have the effect
   you predicted) arrives later inside the same run. This is the change that makes the launch date
   independent of a calendar the product does not control.
8. **15 September is not honest for public launch. 23 September is.** 15 September is the date the
   product is complete and in your daily use. §7.

---

## 1 · Honest audit

### 1.1 What a person meets (walked live, signed in as the harbor persona, 2026-09-02 18:25 IST)

**Start (`/start`).** Headline *"What needs doing?"*, one line under it, a character line from
"Supa", one composer (*"What are you changing, and what should it do?"*), then a **"Today" board**
with eleven regions: a greeting, *"50 days on the record"*, *"Your forecasts came true 1 of 2 times.
6 more are past their date and nobody has said which way"*, *What needs you*, run lanes, an inbox
door, *the last thing it learned*, and a **second input** labelled *"Ask the crew · Tell Supaprod what
to build…"* that files a mission the run screen cannot see. The four job cards sit **below** all of
that. The top bar says *"3 runs are moving"* over a database whose newest agent run is 2026-09-01
09:30 UTC. (`_authenticated.start.tsx:469-724`, `Board.tsx:2106-3065`, `AskDock.tsx:96-98`.)

Verdict: the box is right and everything under it is a dashboard for a machine the person has not
used yet. Nothing on the page says what this is for or what will happen when they press Enter. The
sixty seconds are spent reading a status board.

**The rail.** Home · Approvals (68) · Insights · Threads · Policies · Settings. Rows 1 and 2 resolve
to the same URL (`/today` redirects to `/start?queue`). "Insights" is `/brain` and its keyboard chord
is `k`. "Policies" is `/engine-room`, which `nav-model.ts` still calls "Guardrails". Three names for
each of two doors. (`AppFrame.tsx:381-606`, `nav-model.ts:371-416`.)

**The run (`/track/$trackId`), on the newest track `ce846e9b`.** Header shows the title, *"Now:
Build. Next: Ship."*, a *Needs a restart* chip, and **the origin text, which is a session's internal
notes**: *"Created directly by S0 on 2026-09-01 as the THIRD acceptance candidate, and it carries no
press: F-164 measured that 18 of 20 driven tracks…"*. Left pane: Supa saying *"I've stopped"*, a
**"Station 5 of 7" meter with seven segments** (the coordinate R-13 killed on 2026-08-25), then the
route list, then the transcript, then the steer field. Right pane: *"What it has made"* with seven
tabs, *"Build filed 1 run."*, then a mission card reading **"Completed"** on a run whose hold is
*given-up*, then the same origin prose again, then 2,706 px of `TrackChain`. Scroll the right pane and
the shell strip appears above everything: *01 Discover 89+ runs waiting on you · 05 Build 6+ runs
waiting on you · 07 Learn 6 outcomes to record*. Footer: *"Stopped here. Nothing will pick it up
again on its own."*

That is four station displays plus one in prose, two contradictory statuses ("Completed" and
"given-up") on one screen, and a person's first sight of the product's internal ledger ids.

**The one finished run (`d1168015`).** Header *Finished*. Left: *"This work is finished. There is
nothing left for me to do on it."* Right, Learn tab: *PREDICTED: The PRD will be approved and design
gate cleared within 3 business days · How we will know: prd.get will return status='approved' ·
Due 2026-08-29 · ACTUALLY: Due 5 days ago and not graded.* The forecast is about the machine's own
paperwork, the verdict never arrived, and the run calls itself finished.

**The person is told a story about the machine, in the machine's words, and the story has no ending.**
That is the whole defect, and it is why no amount of surface polish has made value feelable.

### 1.2 Whether it is agentic (code at HEAD `4dce8eed4`; production queried 2026-09-02 12:45 UTC)

| Claim | Reality | Evidence |
| --- | --- | --- |
| One sentence starts a run | **True.** One press, zero decisions; the shape card is optional; auto-continues 24 legs | `start.tsx:205-236`, `TrackRun.tsx:585-628` |
| The work is visible as it happens | **True at the plumbing level.** `tool_calls` inserted per call; browser polls at 500 ms while running; transcript, tool stream, artifact chain all live. No streaming, and none needed | `loop.server.ts:2304`, `LiveWork.tsx:88`, `TrackActivity.tsx:390` |
| Consent is asked in place | **True.** `TrackConsent` sits at the top of the run and resumes the walk on answer | `TrackRun.tsx:960` |
| Build is briefed on the whole chain to Ship | **True now** (F-36 fixed): stage → commit → review → PR → checks → merge | `driver.ts:371, 415, 1167` |
| Stop works | **Half.** "Stop after this leg" cancels remaining foreground legs client-side. Nothing cancels a running seat server-side; the only server stop is the workspace kill switch | `TrackRun.tsx:764`, `driver.ts:1317` |
| A run finishes on its own | **Once, ever.** 60 non-sample tracks: 45 abandoned, 38 never left Discover, 2 "done", of which one has no drive history. `d1168015` walked all seven with Ship *declining* | SQL below |
| Ship can fire | **Never has.** 42 deployment rows, 0 non-sample by both flags. `release.publish` requires a **Deno** preview at the exact commit; a GitHub or Vercel preview is refused | `deployments.functions.ts:1094-1131` |
| Commits happen without a person | **No.** `studio.commit` defaults to `confirm`. Four real builder commits on the bound repo are pending and auto-cancel on 2026-09-03 | `defaults.ts:202`; SQL below |
| The forecast gets graded | **Never has.** `forecast_resolution_log` has 0 rows. All 12 "resolved" forecasts are seed rows. 7 non-sample forecasts are past horizon and nothing reads them. The return edge (missed → new track) has a cron and has created nothing because nothing was ever graded | SQL below; `return-edge.server.ts:39`, `outcome-tick.ts:315` |
| The loop is running now | **No.** 0 agent runs in the last 24 h; the sweep hit three held tracks 432 times in 27 hours and spawned nothing | SQL below |

The four SQL results that decide the above (all filtered on both `is_sample` flags, DB is UTC):

```sql
-- tracks by status and station, non-sample
select t.status, t.station, count(*) from spine_tracks t join workspaces w on w.id=t.workspace_id
 where t.is_sample is not true and w.is_sample is not true group by 1,2;
-- abandoned/sense 37 · open/build 5 · open/decide 3 · done/learn 2 · … total 60

-- runs in the last 24h / 48h, non-sample
select count(*) filter (where created_at >= now()-interval '24 hours'),
       count(*) filter (where created_at >= now()-interval '48 hours'), max(created_at)
  from agent_runs r left join workspaces w on w.id=r.workspace_id
 where r.is_sample is not true and w.is_sample is not true;
-- 0 · 112 · 2026-09-01 09:30:02

-- forecasts, non-sample
select count(*) filter (where forecast_claim is not null), count(*) filter (where forecast_horizon_date <= now()),
       count(*) filter (where forecast_resolution is not null) from decisions d join workspaces w on w.id=d.workspace_id
 where d.is_sample is not true and w.is_sample is not true;
-- 67 · 19 due · 12 "resolved" (every one a seed row: resolved_at at 00:00:00, resolver null)
select count(*) from forecast_resolution_log;  -- 0

-- pending approvals, non-sample
select tool_name, count(*), min(expires_at) from agent_approvals a join workspaces w on w.id=a.workspace_id
 where a.status='pending' and a.is_sample is not true and w.is_sample is not true group by 1;
-- studio.commit 2 · studio.fix.commit 2 (expire 2026-09-03, expiry_default='cancel') · 4 seed rows
```

Who has used it: 16 auth users, 4 with a Google provider (real people), **none signed in since
2026-07-19**. The five sign-ins in the last thirty days are all `*@supaprod.ai` persona accounts
named "Maya Ruiz".

### 1.3 The repo's own audits: what holds, what is stale

| Document | Date | Verdict | Use |
| --- | --- | --- | --- |
| `REIMAGINING.md` | 08-25 | Holds on the diagnosis, the deletions (§2) and the on-screen mechanics (§4). Its "cut the step list" is superseded: the founder wants the work visible, and R-13 already resolved it as a transcript | Reuse §2 and §4 |
| `FRONTIER-BRIEF.md` | 08-25 | Holds: transcript not coordinate, footer carries mode, bounded mandate. Its "313 raised, 0 approved" is false (X-04) and the argument survives without it | Reuse §1, §4 |
| `ROOT-CAUSE.md` | 08-25 | Holds: nothing was missing, everything was unwired | The rule |
| `THE-ONE-SCREEN.md` | 08-25 | Holds as the architecture station by station | The run screen spec, corrected by §4 below |
| `OPERATING-MODEL-5-SESSIONS.md` §0.5–0.8 | 08-26/31 | Holds: three surfaces; the 24 gaps. Gaps 5 and 6 are built; gaps 3, 4, 15 are the runtime packets below | The gaps are the A2 packets |
| `docs/research/agentic-product-patterns-2026-08.md` | 08-26 | Holds. Supplemented today by [`docs/research/agentic-surface-patterns-2026-09.md`](../docs/research/agentic-surface-patterns-2026-09.md) (landing, running, output, depth, hidden, intervention, per product, with URLs) | Do not redo |
| `RULINGS.md` R-01…R-28 | 08-25/26 | Hold. R-29 to R-31 added today | Tiebreaker |
| `BUILD-QUEUE.md` (08-25), `RANKED-BACKLOG.md` (08-31), `docs/lanes/QUEUE-S*.md` (09-01), `coordination/` (08-23) | | **Five queues. `START-HERE` names one, `README` names another, the fleet used a third.** Items marked READY that the tree shows built (2, 20, 22, 28, 29, 34, 52, 55). All frozen as records; open items re-issued as packets | Frozen |
| `FINDINGS-LEDGER.md` | 09-01 | 354 KB, ~65 open findings, F-158 and F-159 each used twice, FIXED rows filed under OPEN. Still the best record of what was tried | Read before re-investigating; nothing new is filed there without a packet |
| `docs/design/premium-pass-2026-08.md`, `non-station-surfaces-2026-08.md`, `agent-first-surface-brief.md` | 08-19/22 | Findings hold; two of three never say what was done about them. The build orders in them were not executed | Mined into packets P-13, P-15 |
| `docs/planning/SOURCE-OF-TRUTH.md` | 08-31 | The `## Now` section is a diary. "Needs the founder" was last reconciled 2026-07-10 | Replaced by §7 of this report as the board; one pointer added |

### 1.4 What to delete, park or merge

**Delete (A3 packets, this week):**

- **49 redirect-only route files** under `src/routes/_authenticated.*.tsx`. TanStack's typed routes
  make this safe: a removed route that anything still links to fails `tsc`. (P-10)
- **Four rail doors** (Approvals, Insights, Threads, Policies) as rail entries. The surfaces behind
  them survive as regions or Settings tabs; the doors go. (P-11)
- **15 unreachable component files, 117 KB**: `InboxSurface.tsx`, `RunsGrid.tsx`, `AskComposer.tsx`,
  `LivePulse.tsx`, `shader-animation.tsx`, `AgentMark.tsx`, `AskDecisionsSection.tsx`,
  `AskDecisionCard.tsx`, `RowActions.tsx`, `dropdown-menu.tsx`, `claim-check.ts`, `sdlc-strip.ts`,
  `an-example-says-so.ts`, `contrast.ts`. `stopped-email.ts` is parked, not deleted: P-04 wires it.
  (P-12)
- **`TrackChain` from the run screen** and the **"Station N of 7" meter** from the left pane. One
  station display remains: the strip, as the right pane's tabs. (P-01)
- **The second composer on Start** ("Ask the crew") and the run-screen origin prose. (P-05, P-01)
- **The `/meridian` gallery from the signed-in route tree.** It renders fabricated data to a signed-in
  user. Dev-only. (P-10)
- **The four coordination systems as live channels.** `A-QUEUE.md` is the only queue. (done today)

**Park (dated note, revisit after launch):**

- `resolveApprovalPolicy` and `autonomy-policy.ts`: the mandate engine, still zero callers on the
  live path. The footer reads the wired `resolveToolMode`. Wire or delete after the first honest run.
- `/runs/$missionId` (1,825 lines, a second run screen for a `mission`). Missions still exist because
  the ungated chat branch files them (F-04). P-05 stops that branch; the route is then unreachable
  and is deleted in P-14.
- The seven station pages (`/discover` … `/learn`, 10,000+ lines between them). They are off the
  rail and their content is already the run's right pane. **They are deleted in P-14 after P-01 and
  P-05 are verified**, never before: a deleted route with an unknown inbound link is a 404 in
  production (R-15 §3).
- The 14 self-referential agent forecasts and the seed "resolved" rows on the harbor workspace.
  **Founder decision:** delete them, or the first calibration readout grades the product on its own
  empty connectors. I recommend delete.

**Merge:** the two run objects. A chat "hand it over" that is a piece of work creates a **track**
(R-24) and navigates to it; missions stay Build's internal container. (P-05)

---

## 2 · Positioning

**The sentence a customer repeats:** *"I say what a change should do. It does the work where I can
watch, and tells me whether it worked."*

**The line under the logo:** **Say what it should do. Watch it get done. Find out if it worked.**

| Layer | Role | Why | What we give up |
| --- | --- | --- | --- |
| **1 · Tell it what to build** | **Leads.** The door and the gesture everyone already has: one sentence, one box | Lovable, Codex, Devin, Claude Code all open on exactly this (research doc, §"six things they all do"). A stranger understands it in five seconds with no vocabulary. It is the one path in this product that has worked end to end | We stop pitching "platform". The door looks like the category's door; the difference is earned by the third clause, never claimed on the landing |
| **3 · Learn and guide** | **Supports, as the reason to trust it and return.** Two verdicts inside every run: the check at Build, and the horizon check on the date | It is the one thing a coding agent cannot do for itself: it wrote the diff and cannot be its own counterparty. It pays on the first run and compounds later. R-06 binds: no present-tense "it learns" until a real grade lands | "Company brain" is not a headline until it has graded something real. The brain page leaves the rail and is reached from a verdict |
| **2 · Run the SDLC** | **Waits. Never shown as a product, never sold.** The stations exist as markers in the transcript and tabs of the right pane, nothing else | OpenAI ships this free (Symphony), Linear includes it at $16/seat, and a station map on the door is the visual signature of the process tooling this buyer is ripping out (`positioning-locked-2026-08.md` §5). The canon banned it and the product kept shipping it | The "process platform" pitch. That buyer can buy Linear, and we say so when asked |

**For whom, in one line:** the person accountable for a change they did not write by hand, who wants
to say what it should do, watch it get done, and know whether it did.

**Why not all three:** a product that argues three layers on its own surfaces reads as an org chart.
The person meets one gesture (say it), one screen (watch it) and one moment (the verdict). Layers 1,
2 and 3 are then the beginning, middle and end of one run. **That is the stitching.** There is no
separate stitching work.

**What the research adds that nobody in the category does** (research doc, last section): predicted
beside actual beside cost, per run; two runs colliding on one thing; the review verdict carried into
the next run. The first is ours by construction. It goes on the run's "what this got you" strip.

---

## 3 · The three surfaces

| Surface | Route | What it is | What folds into it |
| --- | --- | --- | --- |
| **Start** | `/start` | One orientation line until the first run exists · the composer · three example jobs, each a real sentence with a Start button · your runs, one row each: what it is doing now (verb, object, clock) or what it produced, and whether it needs you | Today, the Board, Runs, Missions, Approvals ("needs you" is a row state; `/approvals` survives as the overflow reached from a row) |
| **Run** | `/track/$trackId` | The transcript · the thing being made · the ask in place · the footer mode and Stop · **what this run got you** | Every station page, Brain (one line before Decide when a real record exists; the verdict), Traces (a disclosure on a transcript row), `/runs/$missionId` |
| **Settings** | `/settings` | Autonomy (what it may do without asking, spend ceiling, ship on proof), Connections, Workspace, People, Billing | Guardrails, Engine Room, Govern, Boundary, Integrations, Budgets, Agents, Crew, Prompts, Evals, Admin |

The rail is **Start · Run (the current one, while in one) · Settings.** Three doors.

---

## 4 · The run screen. The story a run tells.

_Reference: Lovable's split (activity left, preview right). Bettered in four places: the right pane
renders each station's artifact as itself; the ask lives in the stream; the footer states the
mandate; the run ends with a verdict, not a preview. Every item below names the existing component
it uses. Nothing here is a new component._

**Header.** The person's sentence. A status chip (Working · Needs you · Stopped · Finished). Nothing
else. Never the `origin` text, never "Now: X. Next: Y.", never an internal id. (`RunHeader`)

**Left: the transcript.** Append-only, newest last, the live entry ticking. Top to bottom:
1. The ask, when there is one, as the first thing (`TrackConsent`). Two buttons, the affirmative one
   naming the consequence; "Not yet" opens a one-line instruction; "and don't ask again for this kind"
   writes the class rule.
2. Supa's presence line (`RunPresence`), one sentence, only when it discriminates (stopped, waiting,
   finished). Silent while working.
3. The transcript (`TrackActivity`, rows from `run-rows.tsx`): *Strategist filed a decision · Decide ·
   34.1s · 65,930 tokens* with the artifact chip inline, station changes as one marker line
   (*Plan → Design. The spec is written.*), tool calls collapsed under their seat and expandable
   (Claude Code's Ctrl+O; Lovable's Details). `aria-live="polite"` on the region.
4. The steer field, sticky (`SteerComposer`). Typing while it runs queues; the row it lands on says so.

**Removed from the left:** the seven-segment meter, the route list, the "Run it" region (the footer
holds the one control), `Teammates` as a header block (seats appear in the transcript when they act).

**Right: the thing that exists now.** The strip is the tab list and the only station display on the
screen. It selects what the pane shows. Per station, rendered as itself, every control on it
(`ArtifactPane`'s existing `StationPanel` bodies):

| Station | Shown | Actions |
| --- | --- | --- |
| Discover | Signals as cards, grouping into themes | keep / discard · "this one matters most" |
| Decide | The decision, what it rests on, and **the forecast as an editable field** (`ForecastForm`): claim, observable, date | edit · accept · "no, here is what I actually think" |
| Plan | The spec, section by section | edit a section · redo this one |
| Design | The prototype in a frame | approve · send one instruction back |
| Build | The diff, then the checks with state and clock, then **the verdict**: what the check compared, what passed, what did not (`studio.review`, today filed where nobody looks) | approve the PR · request a change |
| Ship | Deploy steps with a clock, the URL, the commit, the forecast it is now on the hook for and when | hold · roll back |
| Learn | *You said X. It is Y.* Held, missed, or cannot tell, with the evidence read | agree · disagree and say why · reopen |

**Above the right pane, once the run has produced anything: what this run got you.** One strip:
*Produced: 1 decision · spec (12 sections) · prototype · PR #14 (+312 −40), checks green · Verdict at
Build: did what the spec said · Horizon check due 12 Sep · 2h 14m · $0.44.* Computed from
`spine_track_members`, `studio_changesets`, `agent_runs`. This is the "impact, evidenced" line and it
is the sentence the person repeats to a colleague.

**Removed from the right:** `TrackChain` (2,706 px of the same facts), the mission card's own status
chip (one status per screen, in the header), the origin prose, `LiveWork` as a separate block (its
rows move under their seats in the transcript).

**Footer.** *Working on its own · will ask before it ships* · Stop · elapsed · cost. Mode, never
position. The Stop cancels the current seat server-side (P-01 adds the column and the check), not only
the next leg.

**Layers, stitched.** Layer 1 is the header and the transcript's first row (what you said). Layer 2
is the markers and tabs. Layer 3 is the forecast field at Decide, the verdict at Build, the horizon
verdict at Learn, and the one Brain line before Decide when a real prior record exists. A person never
leaves the screen to meet any of them.

**Start, so the story begins before the run.** One line, first run only: *Say what you want changed
and what it should do. It does the work here, where you can watch, and tells you whether it worked.*
Then the composer, then three example jobs with a Start button each (Codex, Claude Code web), then
your runs as rows (Cursor's task list): *title · Strategist is writing the decision · 0:34* or
*Produced spec, prototype, PR #14 · verdict: did what it said* or *Needs you: approve the PR*. Rows are
the only way a person meets an approval, a verdict or a hold.

---

## 5 · Decisions made today (reversible; recorded so nobody re-litigates)

| # | Decision | Reason | Reverse by |
| --- | --- | --- | --- |
| R-29 | **One queue.** `A-QUEUE.md` is the only channel between lanes. `BUILD-QUEUE`, `RANKED-BACKLOG`, `docs/lanes/QUEUE-S*`, `coordination/` are frozen records | Five queues, three of them named as canonical by three documents | Delete the file |
| R-30 | **A commit on a branch is reversible and runs without asking.** `studio.commit` moves from `confirm` to `auto`. `studio.pr.merge` stays `confirm`; `release.publish` stays under R-27. The forbidden-path floor stays | Four real commits pending, expiring tomorrow; the inverted gate of R-27 repeating one tool earlier | One line in `defaults.ts` |
| R-31 | **A forecast is about the user's product, never about Supaprod's own process.** Decide's brief refuses observables that read Supaprod's own tables (`prd.get`, `sources.status`, `workspace.search`). Default horizon 14 days; a longer one must say why | The one finished run forecast "the PRD will be approved within 3 days" and called that Learn | One paragraph in `driver.ts` |
| — | The strip keeps the produced-sentence; the left pane drops the route (the open question from the 09-02 03:00 handoff) | One fact, one place. The strip never scrolls away | Restore `RunRouteHeader` |
| — | `release.publish` accepts any recorded successful preview at the exact commit, not only `provider='deno'` | A customer repo on Vercel or GitHub previews could never ship. A2 confirms the preview row is at the same sha, which is the actual safety property | Restore the provider check |
| — | Lanes work on `main`, no lane branches | The fleet's lane branches no longer exist on the remote; two lanes reported "ahead, not merging" | — |

**Needs the founder, and nothing below blocks on it except where marked:**

1. ~~GitHub Actions billing on the `Supaprod` org (F-64).~~ **Checked 2026-09-02 19:20 IST: CI runs
   on `Supaprod/relay-homeowner-app`** (`gh run list`: run 33429887265 completed success on
   2026-08-31 19:19 UTC after two failures). F-64 is stale. P-03 is not blocked on you.
2. ~~Which repo the first honest run is on.~~ **Founder, 2026-09-02 18:47: `relay-homeowner-app`.**
   Already bound to harbor with CI on the Supaprod org. The Sep 8 run goes there. A customer-facing
   repo for the launch demo is a later choice and nothing waits on it.
3. ~~Delete the 14 self-referential forecasts and the 12 seed "resolved" rows on harbor.~~
   **Founder delegated the call 2026-09-02 18:47; ruled and executed 18:58.** The 12 seed rows
   (resolver null, resolved at 00:00:00, `.270201` seed microseconds or `60000000-0a00-…` ids) are
   quarantined, not deleted:
   ```sql
   update decisions set is_sample = true where id in (…12 ids, listed in commit b202f4900…)
     and forecast_resolution is not null and forecast_resolved_by_agent_slug is null
   returning id, is_sample;  -- 12 rows, all true
   ```
   The self-referential agent forecasts (8 ungraded by the R-31 predicate, ids in P-04's Blockers)
   are **graded by the platform, not deleted**: Learn settles each `inconclusive` with the rationale
   that it was about Supaprod's own paperwork, visible on the Learn tab and the Start row. A real
   outcome shown on the platform, and the grader's first real run.
4. ~~Delete the seven station pages after P-01 and P-05 are verified.~~ **Founder, 2026-09-02 19:27:
   approved** the seven-stations-same-treatment design, the strip removal, and P-14 as re-scoped
   (five pages go after the fact audit; *Arriving* and *the Record* stay under their own names).
5. **Sign in as yourself, once, on your own workspace**, when P-05 lands. The product has no record
   of a real person since 2026-07-19.

---

## 6 · The queue

[`A-QUEUE.md`](./A-QUEUE.md). Protocol at the top. A2 takes the topmost `A2` packet, A3 the topmost
`A3`. First packets: A2 P-01 (the run tells one story), A3 P-10 (delete the 49 redirects), P-11 (rail
to three doors), P-12 (dead files), P-13 (register sweep).

---

## 7 · Dated plan and the date call

**Velocity:** 27 and 23 commits on 09-01 and 09-02 across several sessions. Two lanes plus A1 from
today. 9 working days to 15 September, 15 to 23 September.

| Date | A2 | A3 | A1 |
| --- | --- | --- | --- |
| **Sep 3–4** | P-01 run screen: one story, one station display, verdict slot, server-side stop | P-10 delete redirects · P-11 rail to three · P-12 dead files · P-13 register sweep | Verify each packet in the browser; answer blockers; founder items 1–2 |
| **Sep 5** | P-05 Start: composer, three jobs, your runs; chat "hand it over" creates a track | P-15 sad-path states on Start and Run · P-16 a11y | Founder signs in on his workspace; first browser walk of the new Start |
| **Sep 6–8** | P-03 Ship fires for real: R-30, preview-provider fix, binding, the four commits | P-17 Settings › Autonomy tab (the mandate, one page) · P-18 Start row states from `tracks-feed` | **First honest run attempt on the named repo, Sep 8.** Findings become packets |
| **Sep 9–10** | P-02 the verdict at Build (surface `studio.review`, make handoff depend on it) · P-04 the horizon verdict arrives: R-31 brief, band surface, `stopped-email` wired for a verdict | P-14 delete the seven station pages and `/runs/$missionId` (after P-01, P-05 verified) · P-19 Meridian: `Verdict` and `GotYou` promoted from A2's local components | Second and third honest runs; cross-verification: both lanes walk one run independently and report separately (R-11) |
| **Sep 11–12** | Fix what the runs found | Fix what the runs found · copy pass on every state with a screenshot per state | Third walk; **`EXPERIMENT-first-finish.md` written with SQL, track id, screenshots** |
| **Sep 13–15** | Buffer | Buffer | **Sep 15: product complete.** All packets DONE with evidence, tsc 0, `bun test` green, two independent walks agree. Founder uses it daily from here |
| **Sep 16–22** | Nothing new. Fixes only, from the founder's own use | Same | Launch copy per the canon; the horizon verdict of the Sep 8 run lands (14-day cap means Sep 22 at the latest; a 7-day horizon on that run lands Sep 15) |
| **Sep 23 (Tue)** | | | **Public launch.** Product Hunt Tue–Thu; Show HN D+7 at the earliest |

**The date call.** 15 September is not honest for a public launch, and the reason is not the
surface work. It is that three things on the critical path have **never once worked**: a real Ship,
a real graded forecast, and a loop that runs without a person unsticking it. Each has an external
dependency (CI billing, a repo binding, a horizon date) that no packet can compress. Launching on the
15th means launching three days after the first time the product finished a job, with no week of
your own use behind it. That is the "quietly fails on the 14th" scenario.

**23 September is honest** if P-03 fires by Sep 8 and the founder items 1–2 are answered by Sep 4. If
the Sep 8 run walks clean first time, the launch pulls in to Sep 16–17 and I will say so on Sep 9. If
the founder items slip past Sep 6, the launch moves to Sep 30 and I will say that on Sep 6, not on
the 22nd.

**What this plan does not do, said plainly:** it does not add a feature. It removes 49 routes, four
doors, 15 files, three station displays, one composer and one queue system, and it makes the four
things already built (start, transcript, artifact pane, ask-in-place) tell one story with an ending.

**Checkpoint, 2026-09-03 03:05 IST.** Fifteen packets are done and live. The Build path ran
unattended for the first time at 20:51 UTC and opened PR #4 on the bound repo, and in doing so showed
three defects nobody could have found by reading: R-30 was inert in production (a policy matrix
forced review after every mode layer said auto), a Build with an open PR is re-driven every tick, and
a cancelled gate parks its run for good. One is fixed and published; two are with A2 tonight. The
honest run has not yet walked Build → verdict → Ship. The 15 September call stands; it is re-read
on 6 September against one question: has one run walked the whole route with nobody pressing anything.

**Checkpoint, 2026-09-03 06:05 IST.** Twenty packets done and live. The first unattended pull request
exists. Running the Build path once exposed nine defects that reading never would have, including the
loop that has been writing duplicate specs and prototypes for weeks; eight are fixed and published,
the ninth is in hand. The honest run stands at the first human gate: PR #4's merge, the founder's
decision. The 15 September call stands.
