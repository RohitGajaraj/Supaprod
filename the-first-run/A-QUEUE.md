# A-QUEUE — the one queue for A1, A2 and A3

> _Created: 2026-09-02 · Last updated: 2026-09-02 · by A1. This file replaces `BUILD-QUEUE.md`, `docs/lanes/QUEUE-S*.md` and
> `coordination/` as the channel between lanes. Those are frozen as records. If a document and this
> file disagree about what to build next, this file wins; `RULINGS.md` still wins on doctrine._

**Report of record:** [`A1-REPORT.md`](./A1-REPORT.md) — audit, positioning,
journey, decisions, dated plan. Read it once before claiming anything.

---

## 0 · Protocol. Short, and every line has cost a lost write somewhere in this repo.

**Three lanes, one repo, one branch: `main`.** No lane branches. No worktrees. Small commits, pushed
within minutes. Lovable deploys from GitHub, so unpushed work is unshipped.

| Lane | Model | Takes | Does not |
| --- | --- | --- | --- |
| **A1** | Fable 5.1 | Writes packets, verifies against acceptance, rules, queries the database (Lovable MCP), pulls design references (Mobbin, beautifui.dev), walks the product in a browser | Write production code |
| **A2** | Opus 5 | Packets tagged `A2`: architecture, the run's live surfaces, the loop that moves work, anything where two files disagree and someone has to decide | Take an `A3` packet unless A3 is starved and A1 says so |
| **A3** | Sonnet | Packets tagged `A3`: fully specified components, wiring, states, copy, deletion, tests | Widen scope. If the packet is under-specified, write `BLOCKED: spec` and take the next one |

### How a packet moves

```
READY → CLAIMED (lane, hh:mm IST) → DONE-PENDING-VERIFY (lane) → DONE (A1) | REJECTED (A1, reason) | BLOCKED (lane, reason)
```

1. **Before any write to this file:** `git pull --rebase origin main`. Then edit **only inside your
   own packet's `Report` and `Blockers` blocks and its `Status` line**. Never reorder, never rename
   a packet, never edit another lane's block. Push immediately.
2. **Claim by changing the Status line** and pushing. One packet in `CLAIMED` per lane at a time.
3. **A packet names its files. Only those files.** Two packets never hold the same file at once;
   A1 guarantees that when writing them. If you need a file outside your packet, write `BLOCKED:
   needs <file>` and take the next packet.
4. **Done means evidence.** The `Report` block must carry: commit shas · `bunx tsc --noEmit` result ·
   `bun test` pass/fail counts · the test file you added or extended · for anything visual, the
   route and what a person sees (an A1 browser walk will check it). **"Done" without evidence is
   returned as REJECTED without review.**
5. **A1 verifies every packet** against its acceptance lines. A packet that passes tests and misses
   the point is REJECTED with the line that failed. Minor defects A1 fixes in place and notes.
6. **Blockers go in the `Blockers` block with a `BLOCKED:` prefix**, not in a separate file. A1 reads
   this file first on every wake. Anything needing the database, a founder call or a design reference
   is a blocker line; A1 answers inside the packet.
7. **Dev server: one, ever.** Before starting one, check the `DEV SERVER` line below. If it is `off`,
   set it to `up · <lane> · hh:mm` in the same push that starts it, and set it back to `off` in the
   push that stops it. A lane that leaves one running has failed the packet. Prefer `bunx tsc
   --noEmit`, `bun test` and reading the source; the server answers one question only: what does this
   look like rendered.
8. **Gates, always, before pushing:** `bunx tsc --noEmit` · `bun test` · `bun run lint` on the files
   you touched (the repo-wide lint is red on ~334 pre-existing `no-explicit-any`; do not claim them,
   do not fix them). Never pipe a gate into `tail`.
9. **Commit with `git commit <paths> -F <msgfile>`**, never `-m`, never `git add -A`. Check
   `git status` for someone else's staged work before you commit.
10. **Meridian:** never edit `src/components/meridian/**` or `src/styles/meridian.css` in an A3
    packet. An A2 packet may, when the packet says so. A new local component must name in its
    Report which Meridian component was checked first and why it did not serve.
11. **No new documents.** A packet's output is code, tests and its Report block. If a decision needs
    recording it goes in the Report and A1 promotes it to `RULINGS.md`.

### The bar a packet is verified against, in this order

1. Does it move one of the five symptoms in the report (landing says nothing · friction before
   payoff · nothing connects · layers do not stitch · black box)? The packet header names which.
2. Would an enterprise buyer's review pass it (tenancy, audit row, failure that names what failed)?
3. Does it meet Meridian and [`../docs/conventions/the-bar.md`](../docs/conventions/the-bar.md)?

---

**DEV SERVER: off**

---

## 1 · Packets

_Ordered. Take the topmost `READY` packet tagged with your lane. Packet ids are stable; never
renumber._

### P-01 · The run tells one story · Lane: **A2** · Status: CLAIMED (A2, 18:37 IST) · Moves: 3, 4, 5

**Scope.** Make `/track/$trackId` one transcript on the left, one artifact pane on the right, one
station display (the strip, as the right pane's tabs), one status per screen, and a "what this run
got you" strip. Spec: `A1-REPORT.md` §4. Existing components only; nothing new except
the two named below.

**Files.** `src/routes/_authenticated.track.$trackId.tsx` · `src/components/track/TrackRun.tsx` ·
`src/components/track/RunFooter.tsx` · `src/components/track/footer-mode.ts` ·
`src/components/track/ArtifactPane.tsx` (header region and the Build/Learn bodies only) ·
`src/components/spine/TrackActivity.tsx` · `src/components/track/LiveWork.tsx` ·
`src/components/track/run-strip-spec.ts` · new `src/components/track/GotYou.tsx` · new
`src/components/track/Verdict.tsx` · `src/lib/spine/track.functions.ts` (a `stopTrack` server fn and
the `spine_tracks.stop_requested_at` read in `driveTrackOnce`'s pre-dispatch check) · one migration
under `supabase/migrations/` adding that column (A1 applies it; write it, do not apply it) · tests
under `src/components/track/__tests__/` and the existing
`the-strip-is-a-runs-step-list.test.ts`.

**Not in scope.** `/start`, the rail, `Board`, any station page, Meridian primitives (file an
`mrd-` note in your Report instead).

**Acceptance.**
- [ ] The header renders the person's sentence and one status chip. `origin` text never renders in
      the header; "Now: X. Next: Y." is gone.
- [ ] Left pane, top to bottom: `TrackConsent` (when a gate exists) · `RunPresence` (only when
      stopped, waiting or finished; empty while working) · `TrackActivity` · `SteerComposer`.
      `RunRouteHeader`/`RunMap`/`StepMeter`, the "Run it" region and the `Teammates` block are not
      rendered. The transcript region carries `aria-live="polite"`.
- [ ] Tool calls render inside their seat's transcript entry, collapsed, expandable; `LiveWork` is
      not mounted as a separate block.
- [ ] Right pane: `GotYou` strip (produced counts by artifact kind from the chain, verdict line,
      horizon date, elapsed, cost) above `ArtifactPane`. `TrackChain` is not mounted. The strip is the
      only element with `role="tablist"` on the page. No text matching `/Station \d of \d/` anywhere.
- [ ] One status per screen: the mission card inside Build shows no status chip of its own.
- [ ] Build tab shows `Verdict`: the latest `studio.review` result for the changeset (what it
      compared, pass/fail lines). When none exists it says so in one line and names the reason.
- [ ] Footer: mode line · Stop · elapsed · cost. Stop calls `stopTrack`, which stamps
      `stop_requested_at`; `driveTrackOnce` refuses to dispatch a new seat while it is set and holds
      `paused` with the line "Stopped by you". Clearing it is the existing "Run it now" press.
- [ ] Tests: one asserts exactly one tablist and zero station meters; one asserts the header never
      renders `origin`; one asserts `stop_requested_at` blocks dispatch.
- [ ] Verified on track `ce846e9b-2f40-416a-92da-205848f9541c` and `d1168015-05fb-4d6e-82b2-d80bdf7f5ff8`
      in a browser (A1 walks it; write what you saw).

**Definition of done.** tsc 0 · `bun test` 0 fail · pushed to `origin/main` · Report filled · A1
verdict DONE.

**Report (A2 writes):**

**Blockers (A2 writes):**

**A1 verdict:**

---

### P-10 · Delete the 49 redirect-only routes · Lane: **A3** · Status: READY · Moves: 2, 4

**Scope.** Delete every file under `src/routes/` matching `_authenticated.*.tsx` whose component
does nothing but `throw redirect(...)`. The census (A1, 2026-09-02) lists 49: `$workspaceSlug.$productSlug`,
`agents`, `analytics`, `artifacts`, `boundary`, `briefing`, `budgets`, `build.$missionId`, `calendar`,
`changelog`, `chat`, `cockpit`, `delegate`, `discovery`, `docs`, `drift`, `eval-health`, `evals`,
`fleet`, `govern`, `guardrails`, `impact`, `inbox`, `integrations`, `knowledge`, `m.$productId`,
`m.index`, `meetings`, `meetings.$id`, `memory`, `missions.$missionId`, `missions.index`,
`notifications`, `observe`, `opportunities`, `outcome`, `prds.$id`, `prds.index`, `prompts`,
`roadmap`, `runs.index`, `stakeholder`, `studio.$missionId`, `studio.index`, `swarm`, `tasks`,
`today`, `track-record`, `trust-ledger`. Also move `_authenticated.meridian.tsx` behind
`import.meta.env.DEV` (it renders fabricated data to a signed-in user).

**Files.** Those route files · `src/routeTree.gen.ts` (regenerate, do not hand-edit) · any file that
`tsc` reports linking to a removed route (fix the link to the surviving target, do not restore the
route) · `src/lib/nav-model.ts` and `src/components/shell/post-auth-home.ts` only where they name a
deleted route · tests that assert those routes exist (delete the assertion, keep the test).

**Not in scope.** The rail (P-11). The seven station pages and `/runs/$missionId` (P-14). Any
route under `src/routes/api/`. `trust.tsx` and `p.teardown.tsx` are public and stay.

**Acceptance.**
- [ ] `ls src/routes/_authenticated.*.tsx | wc -l` drops from 85 to 36 (13 admin + 21 live + 2
      layouts). Report the number.
- [ ] `bunx tsc --noEmit` is 0: every `to=` still resolves.
- [ ] `grep -rn "throw redirect" src/routes/_authenticated.*.tsx` returns only `_authenticated.tsx`
      (auth gates), `today` is gone, `traces.tsx` keeps its bare-path redirect.
- [ ] `/today`, `/missions`, `/runs`, `/cockpit` typed into the address bar land on `/start` via the
      404 boundary, not a blank page: state what the 404 boundary shows and its file.
- [ ] Report lists every link you re-pointed, as `file:line → target`.

**Definition of done.** tsc 0 · `bun test` 0 fail · pushed · Report filled · A1 DONE.

**Report (A3 writes):**

**Blockers (A3 writes):**

**A1 verdict:**

---

### P-11 · The rail is three doors · Lane: **A3** · Status: READY · Moves: 1, 4

**Scope.** Rail entries become **Start · Run · Settings**. "Run" appears only while the person is on
`/track/$trackId` and points at it. Remove Approvals, Insights, Threads and Policies from `RAIL` and
from `PRIMARY_NAV` in `nav-model.ts`; keep their chords dead (no chord to a removed door). The
"New work item" button and "Find a run" stay. The 68 badge goes with the Approvals door: a pending
approval is a row state on Start (P-05 draws it).

**Files.** `src/components/shell/AppFrame.tsx` (the `RAIL` constant `:381-606` and its render
`:2343-2460` only; nothing else in that file) · `src/lib/nav-model.ts` ·
`src/components/shell/post-auth-home.ts` · tests under `src/components/shell/__tests__/`.

**Not in scope.** `/brain`, `/threads`, `/engine-room`, `/approvals` themselves (they stay reachable
by URL until P-14 and P-17). The shell strip publishers (P-01 owns the strip).

**Acceptance.**
- [ ] Signed in on `/start`, the rail shows exactly Start and Settings (plus brand, find, new work).
      On `/track/:id` it shows Start, Run, Settings.
- [ ] No `Link` in `AppFrame.tsx` points at `/today`, `/brain`, `/threads`, `/engine-room` or
      `/approvals`.
- [ ] `nav-model.ts` `PRIMARY_NAV` has three entries; the chord table has no entry for a removed
      door; the shortcut sheet (`?`) lists only live chords.
- [ ] A test asserts the rail entry count per route.

**Definition of done.** tsc 0 · `bun test` 0 fail · pushed · Report with a screenshot path per
route · A1 DONE.

**Report (A3 writes):**

**Blockers (A3 writes):**

**A1 verdict:**

---

### P-12 · Delete the unreachable components · Lane: **A3** · Status: READY · Moves: 3

**Scope.** Delete the fourteen files no route reaches (A1 census, 2026-09-02, transitive, tests
excluded): `src/components/inbox/InboxSurface.tsx`, `src/components/runs/RunsGrid.tsx`,
`src/components/today/AskComposer.tsx`, `src/components/supaprod/LivePulse.tsx`,
`src/components/ui/shader-animation.tsx`, `src/components/agents/AgentMark.tsx`,
`src/components/ask/AskDecisionsSection.tsx`, `src/components/ask/AskDecisionCard.tsx`,
`src/components/runs/RowActions.tsx`, `src/components/ui/dropdown-menu.tsx`,
`src/components/shell/claim-check.ts`, `src/components/shell/sdlc-strip.ts`,
`src/components/inbox/an-example-says-so.ts`, `src/components/landing/contrast.ts`, with their
test files. **Keep `src/components/notifications/stopped-email.ts`** (P-04 wires it).

**Files.** Those files and their tests. Nothing else.

**Acceptance.**
- [ ] Each deletion's commit message names the file and the census line ("zero importers outside
      tests, 2026-09-02").
- [ ] tsc 0 after each deletion (delete one, typecheck, commit; a failing typecheck means the census
      was wrong for that file: leave it, say so in the Report).
- [ ] Report: bytes removed, and any file the census got wrong.

**Definition of done.** tsc 0 · `bun test` 0 fail · pushed · A1 DONE.

**Report (A3 writes):**

**Blockers (A3 writes):**

**A1 verdict:**

---

### P-13 · Register sweep on signed-in surfaces · Lane: **A3** · Status: READY · Moves: 1, 3

**Scope.** Remove from every string a signed-in person can read: `crew`, `bet`, `the call`, `the
record` (as a noun for the product), `station` (as a word shown to a user), `seven stations`,
`agentic`, `autonomous`, `orchestrat*`, `Station N of M`, and any internal id or ledger reference
(`F-\d+`, `S0`, `RUN-\d+`, `U-\d+`) that reaches a render. Replace with the plain word the canon
gives (`docs/strategy/positioning-locked-2026-08.md` §5, `docs/conventions/ui-voice.md`).

**Files.** `src/components/track/**`, `src/components/spine/**`, `src/components/today/**`,
`src/components/shell/**` (strings only), `src/routes/_authenticated.start.tsx`,
`src/routes/_authenticated.track.$trackId.tsx`, `src/lib/spine/driver.ts` **`HOLD_LINE` strings
only**. Extend the existing register guard test (find it: `grep -rl "seven stations" src/**/*.test.*`)
or add `src/lib/__tests__/a-user-never-reads-the-org-chart.test.ts`.

**Not in scope.** Public routes (frozen). Agent prompts and briefs other than `HOLD_LINE`. Docs.

**Acceptance.**
- [ ] `grep -rniE "\b(crew|bet|agentic|autonomous)\b" src/components/track src/components/spine src/components/today src/routes/_authenticated.start.tsx src/routes/_authenticated.track.\$trackId.tsx --include=*.tsx | grep -v test` returns only comments (state the count).
- [ ] A test fails if any rendered string in those directories matches the list above.
- [ ] Report: a table of before → after for every string changed (this is the copy review).

**Definition of done.** tsc 0 · `bun test` 0 fail · pushed · A1 DONE.

**Report (A3 writes):**

**Blockers (A3 writes):**

**A1 verdict:**

---

### P-05 · Start tells the story before the run · Lane: **A2** · Status: READY · Moves: 1, 2, 3

**Scope.** `/start` becomes: one orientation line (only while the workspace has no track) · the
composer · three example jobs, each a full sentence with a Start button that fills the composer and
starts · **Your runs**, one row per track: title · what it is doing now (`Strategist is writing the
decision · 0:34`, from the newest `agent_runs` row) or what it produced (`spec, prototype, PR #14`)
or `Needs you: approve the PR` · when. Rows navigate to the run. Nothing else on the page. The
`Board` is not mounted on `/start`. The "Ask the crew" second input is removed. The AskDock's "Hand it
over" fork creates a **track** through `startTrackCore` and navigates to it (R-24); the mission
branch in `chat.ts` is no longer reached from the UI.

**Files.** `src/routes/_authenticated.start.tsx` · new `src/components/start/YourRuns.tsx` and
`src/components/start/ExampleJobs.tsx` (compose Meridian `Row`, `PickCard`, `Composer`; name in the
Report which Meridian primitive each region uses) · `src/components/today/tracks-feed.ts` (read
model for the rows; extend, do not fork) · `src/components/ask/AskPane.tsx` and
`src/hooks/use-ask-stream.ts` (the "do" intent posts to `/api/plan-gate` or a new
`startTrack` call and navigates; A2 decides which and says why) · tests.

**Not in scope.** `Board.tsx` (left mounted at `/today`'s old anchor only until P-14 removes it),
the rail (P-11), the run screen (P-01).

**Acceptance.**
- [ ] A new workspace's `/start` shows the orientation line, the composer, three example jobs and an
      empty runs region whose copy says what to do ("Nothing running. Start one above."). No greeting,
      no "days on the record", no forecast tally, no inbox door, no second input.
- [ ] A workspace with tracks shows rows sorted: needs-you first, then running, then finished, then
      abandoned; each row's middle column is computed from the newest run or member, and no two rows
      print an identical middle column unless the fact is identical (the discriminator rule).
- [ ] Pressing Enter with a sentence lands on `/track/:id?start=true` with no intermediate screen.
      Pressing an example job does the same.
- [ ] ⌘K "Hand it over" with a sentence lands on `/track/:id?start=true`. A test asserts no path from
      the UI reaches `createMission` in `chat.ts`.
- [ ] `aria-live` on the runs region; rows are keyboard-reachable.
- [ ] Verified in a browser on the harbor workspace and on an empty workspace (A1 walks it).

**Definition of done.** tsc 0 · `bun test` 0 fail · pushed · Report · A1 DONE.

**Report (A2 writes):**

**Blockers (A2 writes):**

**A1 verdict:**

---

### P-15 · The sad path on Start and Run · Lane: **A3** · Status: BLOCKED → P-01, P-05 · Moves: 2, 5

**Scope.** Every empty, loading, failed, held and permission-denied state on `/start` and
`/track/:id` says what happened and what to do next, in the canon's register, with no internal id.
Enumerate them first (Report lists each state, its trigger, its copy, its next action), then build.

**Files.** The components P-01 and P-05 leave in place; tests.

**Acceptance.**
- [ ] A table in the Report: state · trigger · copy · action. Every hold reason in `HoldReason`
      (`driver.ts:488-626`) has a row; the copy comes from `HOLD_LINE` and is shown once per screen.
- [ ] No state renders a UUID, a ledger id, or a session name.
- [ ] Loading never shows an empty region longer than 300 ms without a skeleton row.

**Report / Blockers / A1 verdict:**

---

### P-16 · Accessibility on the two surfaces · Lane: **A3** · Status: BLOCKED → P-01, P-05 · Moves: 5

**Scope.** Keyboard reachability and focus order on `/start` and `/track/:id`; `aria-live` on the
transcript and the runs region; focus moves to the ask when it appears; no colour as the only
signal on a status chip (R-19). Meridian tokens only.

**Files.** The components P-01 and P-05 leave in place; `e2e/` one spec.

**Acceptance.**
- [ ] Tab order documented in the Report per surface.
- [ ] A Playwright spec (not pressing production: seed workspace only) asserts the live regions and
      the focus move.

**Report / Blockers / A1 verdict:**

---

### P-03 · Ship fires for real · Lane: **A2** · Status: READY (after P-01; CI on `Supaprod/relay-homeowner-app` verified running 2026-09-02, run 33429887265 success) · Moves: 3, 5

**Scope.** On the bound repo, a track walks Build → Ship with no person: commits (R-30), PR, checks,
merge under the arc, a recorded preview at the merged sha, `release.publish` fires, a `deployment`
member is filed at `ship`, and the run shows the URL. Includes: R-30 in `defaults.ts`; the
preview-provider check accepting any successful preview row at the exact commit (`deployments.functions.ts:1094-1131`),
with the sha equality made explicit; the four pending builder commits on Helio Labs released
(A1 will cancel or approve them on your word); F-101/F-106 binding checked against the repo the
founder names.

**Files.** `src/lib/ai/tools/defaults.ts` · `src/lib/deployments.functions.ts` ·
`src/lib/ai/loop.server.ts` (only if the arc composition needs a change; say why) ·
`src/lib/spine/driver.ts` Ship brief (`:421-424`, `:1201`) · tests.

**Acceptance.**
- [ ] SQL from A1 shows one `spine_track_members` row with `station='ship'`, `artifact_kind='deployment'`
      on a non-sample track, and a `deployments` row with `status='success'` at the merged sha.
- [ ] The run screen's Ship tab shows the URL, the commit, and the forecast it is on the hook for.
- [ ] No human action between the person's sentence and the deployment row, proven by
      `track_drives.driven_via` and `agent_approvals` for that track.

**Report / Blockers / A1 verdict:**

---

### P-02 · The verdict at Build · Lane: **A2** · Status: BLOCKED → P-01 · Moves: 3, 4

**Scope.** Build's handoff depends on a verdict from a seat that did not write the diff. `studio.review`
already produces one and files it where nobody looks (BUILD-QUEUE item 23). Make it: run by the `qa`
seat against the spec's acceptance lines; written where `whatItProduced()` can read it; shown by
`Verdict` (P-01) as *compared N acceptance lines · M held · K did not*, with the lines; a `did not`
sends the changeset back to the builder once with the failing lines in context (the self-check, gap
1) before it may hand on.

**Files.** `src/lib/spine/driver.ts` (qa brief, `:415`) · `src/lib/spine/attach.ts` ·
`src/lib/spine/what-it-produced.ts` · `src/lib/ai/tools/registry.server.ts` (`studio.review` only) ·
tests.

**Acceptance.**
- [ ] On a driven track, the Build tab shows the verdict with the compared lines within one poll of
      the qa seat finishing.
- [ ] A track whose review says `did not` re-runs the builder once with the lines; the transcript
      shows it as *Sent back once: 2 lines did not hold*.
- [ ] `GotYou` (P-01) reads the verdict line from the same source.

**Report / Blockers / A1 verdict:**

---

### P-04 · The horizon verdict arrives · Lane: **A2** · Status: BLOCKED → P-02 · Moves: 3, 4, 5

**Scope.** R-31 in Decide's brief (forecast about the user's product; observable never a Supaprod
table; default horizon 14 days). The band surface on the Decide tab (`forecast-band.ts` exists;
numeric columns landed as F-169). When the horizon passes: the sweep dispatches Learn, Learn grades
with the evidence it read, the verdict appears as a transcript entry and on the Start row
(*Verdict: held / missed / cannot tell*), and `stopped-email.ts` sends one email carrying it (the
first time that file ever fires). Fix the coverage mismatch: the sweep excludes sample workspaces,
`calibrate-tick` requires `auto_derive_enabled`; make one rule.

**Files.** `src/lib/spine/driver.ts` (Decide brief `:229`, `:1130`; Learn brief `:437-444`, `:1206`) ·
`src/lib/spine/forecast-band.ts` · `src/components/track/ArtifactPane.tsx` (Decide and Learn bodies)
· `src/components/notifications/stopped-email.ts` · `src/routes/api/public/hooks/calibrate-tick.ts` ·
`src/routes/api/public/hooks/track-tick.ts` (the scope rule only) · tests.

**Acceptance.**
- [ ] A track started with a 1-day horizon (test workspace) shows a graded verdict on its Learn tab
      and on its Start row within one sweep after the horizon, with the evidence quoted.
- [ ] `forecast_resolution_log` gains its first non-seed row (A1 SQL).
- [ ] One email sent, recorded, with the verdict in the subject.
- [ ] A test refuses a forecast whose observable names `prd.get`, `sources.status` or
      `workspace.search`.

**Report / Blockers / A1 verdict:**

---

### P-17 · Settings › Autonomy: the mandate on one page · Lane: **A3** · Status: BLOCKED → P-11 · Moves: 4, 5

**Scope.** One Settings tab that says what the agent may do without asking, in the footer's own
words, with the three controls that exist today: the spend ceiling (`default_track_spend_cap_usd`),
the kill switch (`kill_switches.paused`, `BoundaryControls.tsx:1293-1313`), and the tool modes that
the arc resolves (read-only list from `resolveToolMode`, grouped: runs on its own · asks first · never).
Engine Room's other 22 tabs are not moved; they stay at `/engine-room` until P-14 decides them.

**Files.** `src/routes/_authenticated.settings.tsx` (one new tab) · new
`src/components/settings/AutonomyTab.tsx` composing `BoundaryControls` pieces · tests.

**Acceptance.**
- [ ] The tab renders the footer sentence verbatim from `footer-mode.ts` for the workspace's arc.
- [ ] Changing the ceiling or the kill switch round-trips (A1 verifies the row).
- [ ] Every tool in the list carries the mode the runtime would actually use, from
      `resolveToolMode`, not from `defaults.ts`.

**Report / Blockers / A1 verdict:**

---

### P-14 · Delete the seven station pages and the mission run screen · Lane: **A3** · Status: BLOCKED → P-01, P-05 verified, founder item 4 · Moves: 4

**Scope.** `_authenticated.discover.tsx`, `decide.tsx`, `plan.index.tsx`, `plan.spec.$id.tsx`,
`design.tsx`, `build.index.tsx`, `ship.tsx`, `learn.tsx`, `runs.$missionId.tsx`, `today.tsx`'s
`Board` mount, and the components only they reach. Each becomes a redirect to `/start` for one week
(inbound links from email and Slack exist), then the redirect file is deleted in a follow-up packet.

**Files.** Those routes; the census of components they alone reach (run the P-12 method first and
list them in the Report before deleting anything).

**Acceptance.**
- [ ] Route count reported before and after. tsc 0 after each deletion.
- [ ] Every `Link` that pointed at a deleted page now points at `/track/:id` with the tab in search,
      or at `/start`.

**Report / Blockers / A1 verdict:**

---

### P-18 · Start rows read the same facts as the run · Lane: **A3** · Status: BLOCKED → P-05 · Moves: 3

**Scope.** `tracks-feed.ts` becomes the one read model for a track's one-line state, used by
`YourRuns` (P-05), the shell top bar ("3 runs are moving"), and the strip's produced-sentence
(`what-it-produced.ts`). Three places, one function, one sentence.

**Files.** `src/components/today/tracks-feed.ts` · `src/lib/spine/what-it-produced.ts` ·
`src/components/shell/AppFrame.tsx` (the top-bar sentence only) · tests.

**Acceptance.**
- [ ] A test asserts the top bar's count equals the number of tracks with a running `agent_runs`
      row, not `status='open'`. Today it says "3 runs are moving" with 0 runs in 24 h.
- [ ] The strip and the row print the same sentence for the same track.

**Report / Blockers / A1 verdict:**

---

### P-19 · Promote `Verdict` and `GotYou` into Meridian · Lane: **A3** · Status: BLOCKED → P-01 DONE · Moves: 4

**Scope.** Generalise A2's two local components into `src/components/meridian/` with tokens only,
documented in `docs/design/DESIGN-SYSTEM.md`, and swap the run screen to import them. A2's local
files are deleted in the same packet. **A1 reviews the primitives before merge (R-17, R-20).**

**Files.** `src/components/meridian/verdict.tsx`, `got-you.tsx` · `docs/design/DESIGN-SYSTEM.md` ·
`src/components/track/TrackRun.tsx` (imports only).

**Acceptance.**
- [ ] `bun test` Meridian guards pass with no baseline change.
- [ ] `MERIDIAN-ADOPTION.md` count updated with the date.

**Report / Blockers / A1 verdict:**
