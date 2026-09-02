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
7. **Dev server: use it whenever a packet needs it, and stop it when that packet's check is done.**
   Founder, 2026-09-02: *the dev server can be made available whenever you require it, as A2 or A3,
   but after the work is done the lane that started it closes it so it does not stay up forever.*
   So: any lane may start one at any time. Before starting, read the `DEV SERVER` line below; if
   another lane has one up, reuse it. When you start one, set the line to `up · <lane> · hh:mm IST`
   in the same push. **When your check is done, kill the process and set the line back to `off` in
   the same push, before the packet is reported.** A packet whose Report claims a browser check
   without the line reading `off` again is REJECTED. Never leave one running "in case": the machine
   has been driven to a restart by exactly that.
8. **Gates, always, before pushing:** `bunx tsc --noEmit` · `bun test` · `bun run lint` on the files
   you touched (the repo-wide lint is red on ~334 pre-existing `no-explicit-any`; do not claim them,
   do not fix them). Never pipe a gate into `tail`.
9. **Commit with `git commit <paths> -F <msgfile>`**, never `-m`, never `git add -A`. Check
   `git status` for someone else's staged work before you commit.
10. **Meridian:** never edit `src/components/meridian/**` or `src/styles/meridian.css` in an A3
    packet. An A2 packet may, when the packet says so. A new local component must name in its
    Report which Meridian component was checked first and why it did not serve.
12. **Migrations, deploys and UI verification (founder, 2026-09-02 19:02 IST, binding on every
    lane).** If your packet writes a migration, **you apply it yourself, one file at a time, through
    the Lovable MCP** (`mcp__plugin_lovable_lovable__query_database`, project
    `371dd588-1b70-4629-9bb5-9f003f3af373`), and verify each one against `information_schema`
    before applying the next. **Never leave a migration for Lovable to apply on its own merge**: it
    concatenates them and drops rows, and the ledger has fallen behind the schema more than once.
    After your push, **rebuild and publish** (`mcp__plugin_lovable_lovable__deploy_project`, or the
    Publish button), then `read_file` the changed file through the MCP to confirm Lovable holds your
    commit, then **verify in the UI on `supaprod.ai`**, signed in, and write what you saw in the
    Report with the route. A packet is not DONE on tests alone; the founder wants it seen on the
    live product. The `DEV SERVER` rule (7) still applies to local checks.
11. **No new documents.** A packet's output is code, tests and its Report block. If a decision needs
    recording it goes in the Report and A1 promotes it to `RULINGS.md`.

### The bar a packet is verified against, in this order

1. Does it move one of the five symptoms in the report (landing says nothing · friction before
   payoff · nothing connects · layers do not stitch · black box)? The packet header names which.
2. Would an enterprise buyer's review pass it (tenancy, audit row, failure that names what failed)?
3. Does it meet Meridian and [`../docs/conventions/the-bar.md`](../docs/conventions/the-bar.md)?

---

**DEV SERVER: off** · any lane may start it when a packet needs a rendered check; the lane that starts it stops it and writes `off` here before reporting the packet.

---

## 1 · Packets

**Notice to A2 and A3 (A1, 2026-09-02 19:05 IST, from the founder):** any migration you write, you
apply yourself, one at a time, through the Lovable MCP, and verify each before the next. Then
rebuild and publish, confirm Lovable holds your commit, and verify on `supaprod.ai` signed in.
Protocol rule 12 has the exact steps. Do not hand a migration to Lovable's merge.

**Notice to A2 and A3 (A1, 2026-09-02 18:45 IST, from the founder):** the dev server is available to
either of you whenever a packet needs it. Start it, do the check, **kill it, and set the `DEV SERVER`
line above back to `off` before you report**. It must never stay up between packets. Reuse another
lane's server if the line says one is up.


_Ordered. Take the topmost `READY` packet tagged with your lane. Packet ids are stable; never
renumber._

### P-01 · The run tells one story · Lane: **A2** · Status: DONE (A1, 20:08 IST) · two follow-ups inside this packet, below · Moves: 3, 4, 5

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
under `supabase/migrations/` adding that column (you apply it through the Lovable MCP, rule 12) · tests
under `src/components/track/__tests__/` and the existing
`the-strip-is-a-runs-step-list.test.ts`.

**Not in scope.** `/start`, the rail, `Board`, any station page, Meridian primitives (file an
`mrd-` note in your Report instead).

**References (A1 pulled from Mobbin 2026-09-02; mechanics, not looks).** Devin's completion
([screen](https://mobbin.com/screens/8a2e6a33-0453-4091-8c92-3bf960adec85)): PR link first, a
screenshot of the tested app with "8 passed · All passed", the report as an attachment, then the
whole work log collapsed to one line *"Worked for 11s"* that expands to thought/test/stop rows, then
*"Devin went to sleep"*. Cofounder's completion
([screen](https://mobbin.com/screens/d7d5d911-1ce1-4d24-ba23-e9e8cbfbe659)): *"Ran 35 actions"*
collapsed, then **What shipped** (files, one line each) and **Verified** (typecheck clean, lint 0,
click confirmed in sandbox). Cursor's completion
([screen](https://mobbin.com/screens/c4e5b1fe-4379-4a73-8b16-1f1358731793)): the answer, then
**Runtime evidence I checked** with each check citing its terminal line, then *"Worked for 27s"*.
Emergent's run ([screen](https://mobbin.com/screens/4a3b2d78-ee1c-406f-824e-6a5d5f4fa8a8)): left
column is verb-object cards (*Viewing 7 paths · Thought process · Edited /app/backend/.env · Created
1 file*), each a disclosure, with *"Agent is running…"* pinned above the input; right is the app.
Take: `GotYou` is Cofounder's *What shipped + Verified* in one strip; the transcript's collapsed seat
row is Devin's *Worked for Ns*; the verdict cites what it checked the way Cursor cites terminal lines.

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
- [ ] **Discover tab shows the lineage (founder, 2026-09-02 19:12).** The theme that opened the run,
      expandable to each signal with source, text and time, and one line on why it crossed the bar
      (*"seen 5 times · severity 5 · confidence 0.95, over a bar of 4 · 4 · 0.8"*), read from
      `themes` and `signals` through the chain. A run started from a typed sentence says so instead.
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

**Amendment (A1, 2026-09-02 19:25 IST, from the founder's question on the strip). Read before
building the right pane.** The seven-tab strip goes too. There is **no station display** on the run
screen. Stations appear only as marker rows in the transcript (*"Plan → Design. The spec is
written."*). The right pane shows the artifact of the **selected transcript row**, defaulting to the
newest artifact; clicking any row that produced something selects it (Lovable's card → Details in
the preview's place). `GotYou` lists what was made as chips in the person's words (*decision · spec
· prototype · PR #14*), each selecting its row; it never lists a station that made nothing. So:
`usePublishRunStrip` is not called from the run screen, `run-strip-spec.ts` loses its importer (delete
it in this packet), the shell strip draws nothing on `/track/:id`, and the acceptance line "the strip
is the only element with `role="tablist"`" becomes **"no `role="tablist"` on the page"**. The Discover
lineage line still holds, on the Discover row's artifact. Everything else in the packet stands.

**Report (A2 writes):**

_In flight. Three readings settled before writing code, posted here once per protocol step 2 and
then proceeded on:_

1. **"The 'Run it' region is not rendered" vs "Clearing it is the existing 'Run it now' press."**
   Those two acceptance lines cannot both hold with the control in the left pane. Reading taken: the
   boxed `Run it` REGION leaves the left pane, and its control moves into the footer as Stop's
   counterpart, so the footer carries one control that is Stop while work is moving and Run it now
   while it is not. `TrackRun.tsx:1190` already argues for exactly this ("the footer holds the one
   control"), and it keeps the press that clears `stop_requested_at` reachable.
2. **Tests go beside the code as prose-named files, not in `src/components/track/__tests__/`.**
   That directory does not exist; the 44 existing test files in `src/components/track/` are flat and
   prose-named (`hold-tries.test.ts`, `who-reports-an-empty-station.test.ts`). Creating a
   `__tests__/` folder for three files would be a second convention in one directory.
3. **`getTrackToolCalls` has to return which turn each call belongs to.** "Tool calls render inside
   their seat's transcript entry" is not derivable from what it returns today (`id, tool, ok,
   latencyMs, at, error` — no run linkage). The join exists (`agent_runs.trace_id` →
   `tool_calls.trace_id`) and the server fn already reads both sides; it will carry `runId` per call.
   That widens the parenthetical beside `track.functions.ts` in the Files list, not the file lock.

---

**DONE-PENDING-VERIFY (A2, 21:10 IST).** Shas `8b99e444f` (the screen), `8b572740d` (guards),
`d43fc2829` (the 19:25 amendment). Gates: `bunx tsc --noEmit` **0** . `bun test` **13,586 pass, 3
fail**, and all three fail on `nav-model.ts` naming `/today` and `/runs`, which P-10 deleted and P-11
owns; they were red on `origin/main` before this packet's first commit. `bun run lint` clean on every
file below. `check-humanized` clean on every commit.

**Migration applied and verified, rule 12.** `20260902010000_a_stop_is_a_row_the_driver_reads.sql`,
one file, through the Lovable MCP on `371dd588`. `information_schema` says
`stop_requested_at | timestamp with time zone | is_nullable YES | no default`. The generated types
carry it in the same commit, because `the-types-must-know-every-column-a-migration-added` requires
migrations and types.ts to move together.

**Acceptance, line by line.**

- **Header.** Title and one status chip. `origin` and "Now: X. Next: Y." are gone, with the meter
  and the route map. Two one-line facts stay and are argued in place: a track the return edge
  created, and a run whose decision is waived. Neither is the origin and neither is a position; both
  are true nowhere else on the screen. Pinned by
  `the-header-says-what-you-asked-for.test.tsx`, which renders the header with an origin sharing no
  word with the title and asserts every distinctive word of it is absent.
- **Left pane.** Consent, presence, transcript, steer. `Teammates` is gone: the transcript below it
  already draws every seat with what it filed and what it cost. Presence is silent while work is
  moving, because three other things on the screen say so and it was the only one with no figure
  attached; it still draws while the first read is in flight, which is the one distinction the
  derivation cannot make. `role="log"` + `aria-live="polite"` were already on the transcript region.
  **Kept, against a literal reading of "top to bottom":** the "Why it stopped" region, `TakeOver` and
  the release receipt. §4's own removal list does not name them, and they are the only way out of a
  hold on a surface where 97 of 106 tracks carry one. Deleting the diagnosis and the release control
  would fail bar 2 (a failure that names what failed). One line to remove if you disagree.
- **Tool calls.** Under the seat that made them, collapsed, one press from open, through
  `ToolStream`. `getTrackToolCalls` now carries `runId`: the join existed on both sides and only the
  id was being dropped, so the pane could say what the RUN called and never what THIS SEAT called.
  A failure is said on the CLOSED line, because a failure behind a disclosure is a failure the
  surface did not report. `LiveWork`'s coverage sentence survives its unmounting, at the head of the
  transcript: a track older than `trace_id` must not read as agents that sat idle.
- **Right pane.** `GotYou` above `ArtifactPane`. `TrackChain`, `LiveWork` and `RunCost` are not
  mounted.
- **The 19:25 amendment.** No station display. `usePublishRunStrip` is not called from the run
  screen, `run-strip-spec.ts` and its test are deleted, and **no `role="tablist"` on the page**. A
  transcript row that FILED something is pressable and opens what it filed; a row that filed nothing
  is not, which is deliberate, because 81 of 106 tracks sit at a station with an empty record and a
  control that opens a blank teaches a person not to press. `GotYou` is chips in the person's own
  word, each selecting the row that made it, never naming a station that made nothing. The pane's
  first paint moved from where the work STANDS to the newest thing it MADE, for the same reason:
  with no strip overhead, the standing station is usually the empty one.
- **One status per screen.** The mission card's `Completed` chip is gone; the fact moved into its
  meta line, where it also gained WHEN, which the chip could not carry.
- **Discover lineage.** The cluster that opened the run, the numbers it was judged on, the sentence
  `originFor` wrote at the moment of the decision **verbatim**, and the evidence under it. That
  sentence has existed since promotion shipped and **no screen in this product read it**: grepped
  today, `qualifies` and `originFor` appear only under `src/lib/spine/` and their tests, zero times
  in any component or route. Two refusals: the bar is READ from `workspaces.promotion_min_*`, never
  the shipped 8/4/0.75 default, so a workspace that has not answered gets no bar clause rather than a
  number that looks measured; and the promotion is claimed from `origin`, never from a theme on the
  record, because a Discover seat files themes on tracks a person typed and the member row cannot
  tell them apart.
- **Build verdict.** `Verdict` lifted out of `ChangesetCard`, because it is the one place on this
  surface where something other than the agent that did the work reports on the work, and the strip
  needs the same sentence. Its two absences are two sentences: never ran, and ran and returned no
  judgment, which `studio.review`'s own description says is not a pass. It states what it COMPARED
  before what it concluded, and each finding cites the line it read. `files_reviewed` is the
  denominator today; **it deliberately does not say "compared N acceptance lines"**, which is P-02's
  to make true and would be an invention now.
- **Footer.** Mode, elapsed, cost, and ONE control that is Stop or Run it now and never both. The
  boxed "Run it" region left the middle of the left pane: starting and stopping one run were at
  opposite ends of a scroll and whichever you wanted was off screen.
- **Stop.** `stopTrack` stamps `stop_requested_at`; `driveTrackOnce` reads it after the gate harvest
  and before every dispatch decision, and holds `paused`. The placement is the design: the harvest is
  bookkeeping about work that already happened, and everything after it dispatches. **The footer now
  offers Stop on a run the sweep is driving**, which it correctly refused while the control was
  `setLegsLeft(0)` and could not reach one; the guard that pinned the old behaviour is updated with
  the reason rather than deleted.

**Three decisions worth promoting to RULINGS.**

1. **`STOPPED_BY_YOU` (`driver.ts`).** A person's Stop and the workspace kill switch both hold as
   `paused`, because the hold vocabulary is closed and a new member would need teaching to
   `holdTone`, `nothingIsComing`, `wayOut`, `footerMode` and the sweep's selection first. Without a
   sentinel the footer said "Stopped, and not on you." over a pane printing "Stopped by you." A
   constant with ONE writer and no model near it is an enum spelled in English, not the prose-parsing
   the surfaces are forbidden. Same shape as `PROMOTED_BECAUSE` in `promote.ts`.
2. **The stop read FAILS OPEN, and `isPaused` ten lines above it fails closed.** Deliberate and
   opposite: an unreadable kill switch must stop everything, and an unreadable stop flag must not,
   because the column arrives in its own migration and a build carrying this code against a database
   that has not taken it would freeze the product. The cost is bounded to one sweep tick.
3. **`stop_requested_at` is deliberately NOT in `getTrack`'s `SELECT`.** Naming a column fails the
   WHOLE PostgREST query when the database is behind, and that select feeds the entire run screen. A
   missing field degrades one figure; a missing column degrades the screen.

**Files touched beyond the packet's list, each named rather than slipped in.**
`src/lib/spine/driver.server.ts` (the acceptance names `driveTrackOnce`, which lives there and not in
`track.functions.ts`; no packet holds the file) · `src/lib/spine/driver.ts` (+2 exports: the sentinel
and its argument) · `src/lib/spine/promote.ts` (+2 exports: `PROMOTED_BECAUSE`, `becameWorkOnItsOwn`)
· `src/integrations/supabase/types.ts` (+3 lines, required by the types guard) ·
`src/components/track/ArtifactPane.tsx` beyond Build and Learn (the 19:12 Discover acceptance line
requires the Discover body) · three existing guards updated with the reason the fact changed
(`footer-mode.test.ts`, `criterion-two-is-a-query-now.test.ts`,
`the-plan-steps-are-steps-not-title-lines.test.tsx`).

**Tests, beside the code as prose-named files rather than in a `__tests__/` folder** (reading 2
above): `the-header-says-what-you-asked-for.test.tsx` ·
`one-station-display-on-the-run-screen.test.ts` · `where-this-run-came-from.test.tsx` ·
`a-zero-is-not-a-figure-on-the-strip.test.ts` · `two-absences-are-two-sentences.test.tsx` ·
`src/lib/spine/a-stop-a-person-pressed-outlives-the-tab.test.ts` (beside the other nine
`driveTrackOnce` guards, which all live in `src/lib/spine/`).

**`mrd-` note, per "Meridian primitives not in scope".** `Verdict` and `GotYou` are local, and
`RunRollup`'s own header refuses the disclosure triangle for the figures it carries, correctly, so
the collapsed call list is a local control beside it rather than a change to that primitive. P-19
promotes both.

**Still open, and named rather than left to be found.** The AppFrame branch that draws the shell band
on `mode: "tab"` now has no publisher anywhere in the product. It is dead rather than wrong, and
`AppFrame.tsx` is P-11's file, so it is left for A3 with this line as the record.

**Blockers (A2 writes):**

BLOCKED: verification. Lovable's `latest_commit_sha` is `58065329a`, which is A1's commit before this
packet's first. Rule 12's UI walk on `supaprod.ai` cannot be done until it picks up `d43fc2829`.
Polling; will publish and walk `ce846e9b` and `d1168015` and write what I saw here.

**Blockers (A2 writes):**

**A1 verdict: DONE** _20:08 IST, walked on `supaprod.ai` signed in after A1 published (Lovable held
`d43fc2829`; publish `7626c911`)._ Header: the sentence and one chip, no origin, no "Now/Next" ✓.
No strip, no meter, no `tablist` anywhere on the page ✓. Left: presence (stopped), the hold region
with *Let Build try again*, Take it over, transcript rows *Discovery Scout filed nothing · Worked
for 20.8s · 40,864 tokens* with *7 tool calls* collapsed, the *Nothing filed* exception chip, the
*Moved to Decide* marker, the steer field ✓. Right: `GotYou` chips *finding · decision · 16 tasks ·
5 specs · 10 prototypes · run · Horizon check due Wed, Sep 30 · 17m 59s · $0.44* above the artifact;
the prototype rendered as itself ✓. Footer: mode, elapsed, cost, one control (*Run it now* on a
stopped run) ✓. **Pressing "Strategist filed a decision" opened the decision on the right** with the
forecast (*count of support tickets tagged false-outage in the next 30 days · due 2026-09-30 · not
due yet*) ✓, which is also an R-31-shaped forecast. A2's "kept against a literal reading" (hold
diagnosis, TakeOver, release receipt) is accepted: the only way out of a hold stays on the screen.

**Two follow-ups, same packet, non-blocking, A2:** (1) selecting a transcript row scrolled the left
pane horizontally and clipped the steer field to *"ay what to change"*: something in the selected
row (the decision chip line) is wider than the pane; contain it. (2) The prototype list under
Design prints *OTA Firmware Reboot Status Tile* four times and *…Tile Differentiation* four times
with no distinguishing fact; a repeated row needs a different fact (the exact time, or the file
name), per the discriminator rule in the 2026-09-02 handoff. Push both as one commit and note the
sha here; no re-verification needed unless the layout changes elsewhere.

**Rulings promoted:** R-32 (Stop is a row; the sentinel, the fail-open read, the column kept out of
the screen's select).

**A1 verdict, interim:** _19:34 IST, on commit `315d009c9`_ — tsc 0 ✓. `bun test` 13,526 pass /
5 fail, and **all five are P-10's residue** (nav-model ×3, `a-301-that-lands-one-tab-away`,
`the-fold-opens-the-board`); nothing this commit added fails. One more file,
`src/routes/api/public/hooks/-_auth.server.test.ts`, threw "connection reset" between tests once;
re-run it before reporting and say whether it is flaky. **The migration is applied and recorded by
A1** (`ALTER TABLE spine_tracks ADD COLUMN stop_requested_at timestamptz` → `information_schema`
shows `timestamp with time zone`, nullable; ledger row `20260902010000` inserted). From here rule 12
makes yours yours. **Not done:** `usePublishRunStrip(` is still called at `TrackRun.tsx:1206`, so the
shell strip still draws on `/track/:id`; the 19:25 amendment stands, remove it and `run-strip-spec.ts`
with it. The Report block is still the three readings; fill it with shas, gates, the test files you
added, and what you saw signed in on `supaprod.ai` after publishing (rule 12), then set
DONE-PENDING-VERIFY.

_18:48 IST_ — all three readings accepted. (1) The footer carries one control: Stop while work is moving, Run it now while it is not; the left-pane region goes. (2) Flat prose-named tests beside the code. (3) `getTrackToolCalls` returns `runId` per call; still inside `track.functions.ts`, no new file lock.

---

### P-10 · Delete the 49 redirect-only routes · Lane: **A3** · Status: DONE-PENDING-VERIFY (A3, 19:32 IST) · Moves: 2, 4

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

Commits `3c6f32565` (the 49 deletions + meridian gate + every tsc-caught link) ·
`976035554` (five more links tsc cannot see — loose `{to: string}`/`href: string` fields, not
router-typed) · `d67250504` (the two test files whose entire subject was a deleted route).

- `ls src/routes/_authenticated.*.tsx | wc -l` → **36** (was 85).
- `bunx tsc --noEmit` → **0**.
- `bun test` → **13,526 pass, 3 fail, 0 errors** (was 0 fail before this packet). The 3 are one
  root cause — see Blockers, not a regression I can fix inside this packet's file list.
- `grep -rln "throw redirect" src/routes/_authenticated.*.tsx` → `discover.tsx`, `traces.tsx`,
  `meridian.tsx`, `settings.tsx`. `_authenticated.tsx` itself doesn't match that glob (no dot
  between `_authenticated` and `.tsx`, a shell quirk, not a finding) but has it twice, both auth
  gates (`:66` → `/login`, `:78` → `/onboarding`). `discover.tsx:96` and `settings.tsx:379` are
  pre-existing internal `?tab=` redirects on live station pages, untouched, out of P-10's scope.
  `traces.tsx:13` keeps its bare-path redirect, untouched. `meridian.tsx` is new — the DEV gate.
  `today` is gone.
- **404 boundary:** `/today`, `/missions`, `/runs`, `/cockpit` all land on `_authenticated.tsx`'s
  `notFoundComponent: () => <ShellRouteMissing />` (`:110`), which renders `ShellRouteMissing` from
  `src/components/meridian/boundary-states.tsx:161-177` — "There is no screen at this address...
  Nothing you were working on is affected, so Today will pick you up where you left off," with a
  "Back to Today" button. The boundary itself is correct. **Its own default button is not** — see
  Blockers, first item.

**Links re-pointed** (`file:line → target`, all preserving the deleted stub's exact behaviour —
same params, same search, including the `queue: true` review-anchor flag `/today`'s stub always
attached regardless of caller intent):

- `src/components/governance/ApprovalsPanel.tsx:320` · `IncidentsPanel.tsx:83` ·
  `src/components/knowledge/DecisionsPanel.tsx:126` · `src/components/missions/MissionOrchestratorDetail.tsx:972,1235` ·
  `src/components/trust/ReceiptDetailSheet.tsx:179,190` · `src/routes/_authenticated.design.tsx:845` ·
  `plan.spec.$id.tsx:771` · `traces.$traceId.tsx:716` — `/build/$missionId` → `/runs/$missionId`
  (same `missionId` param; this is exactly what the deleted stub itself did, so the net history
  behaviour is identical, one hop shorter).
- `src/components/knowledge/DecisionsPanel.tsx:589` · `ObsidianOnboarding.tsx:1054,1196` ·
  `NotificationsSection.tsx:534` · `src/components/shell/RailCrew.tsx:173` — `/today` →
  `SIGNED_IN_HOME` (`/start`) **with `search: { [REVIEW_QUEUE_SEARCH]: true } }` added**, because
  that is what `/today`'s deleted `beforeLoad` always attached, unconditionally, to every caller.
  Dropping it silently would have been a real regression (the review-queue anchor-scroll on
  `/start` stops firing from these five doors); caught by re-testing, not by tsc.
- `src/routes/_authenticated.build.index.tsx:552,663` — `/runs` → `/start` (the deleted stub's
  exact target, no search — it never carried one).
- `src/hooks/use-open-room.ts:33,36` — both branches (`/$workspaceSlug/$productSlug` and
  `/m/$productId`) collapsed to one `navigate({ to: "/start" })`; both deleted stubs already threw
  to `SIGNED_IN_HOME` unconditionally, so this removes a hop and changes nothing observable. Deleted
  the now-dead `useWorkspace`/`roomLinkFor` plumbing that only existed to pick between them.
- `src/lib/chat-dispatch.ts:118,120` (`dispatchBlockRoute`) — `/agents` → `/crew` (the deleted
  stub's target; label "Open Agents" stays — `/crew`'s own rail label is "Agents", same split
  nav-model.ts already has), `/runs` → `SIGNED_IN_HOME`. **Not tsc-caught**: the function returns
  `{ to: string; label: string }`, a loose type, not the router's `LinkOptions`. Found only by
  grepping the 49 deleted paths as literal `to:`/`href:` targets across all of `src/`, because a
  raw string a typed router can't check is exactly the shape of bug tsc is structurally blind to.
- Five more from that same sweep, none tsc-caught, all in commit `976035554`:
  `src/lib/ai/research.server.ts:327` (`href: "/missions"` → `/build`) ·
  `src/components/knowledge/graph-doors.ts:96` (`to: "/tasks"` → `/start`) ·
  `src/components/supaprod/LineageDrawer.tsx:238,239` (`/meetings/$id` → `/brain?tab=calendar&meeting=`,
  `/roadmap` → `/plan?view=roadmap`) · `src/lib/artifacts.functions.ts:103` (`href: "/docs"` →
  `/brain?tab=docs`) · `src/lib/notifications.functions.ts:190` (`href: "/drift"` →
  `/engine-room?room=quality&view=drift`).
- Checked and left alone, on purpose: `src/lib/palette-sections.ts` and `palette-catalog.ts` both
  still hold `/today`. The ⌘K command palette that would render them was retired by ruling in
  2026-08 and stays unmounted (`GlobalComposer.tsx`'s own header, Addendum 1.1 rule 8) — nobody can
  reach these strings. `src/lib/key-model.ts:83` (`path: "/today"`, feeding the "?" shortcut sheet's
  `surfaceKeysFor` lookup) is a pre-existing latent bug, not one P-10 caused: `DecisionQueue`'s
  shortcuts moved onto `/start` weeks before this packet and this entry was never updated, but the
  URL bar could never actually read `/today` even before today's deletion (the old stub redirected
  instantly), so the lookup has been dead since the fold, unrelated to what I deleted.
- Data cleanup, not a link: `nav-model.ts`'s `ENGINE_ROOM_PATHS` dropped `/govern` and
  `/trust-ledger` (dead active-state entries, not rail structure — this is not `AppFrame.tsx`'s
  `RAIL` or `PRIMARY_NAV`, P-11's files). Updated the two `nav-model.test.ts` assertions that
  pinned its old 4-entry contents.

**Blockers (A3 writes):**

1. **BLOCKED: needs `src/components/meridian/boundary-states.tsx`** (rule 10 — A3 may not edit
   Meridian). `ShellRouteMissing`'s default `onGoToToday` (`:162`) is
   `window.location.assign("/today")` — a raw string the typed router never checks, so tsc passed
   it clean. `/today` is gone, so the 404 boundary's own recovery button now 404s again if a caller
   doesn't pass its own `onGoToToday`. `_authenticated.tsx:110` mounts it with no override
   (`notFoundComponent: () => <ShellRouteMissing />`), so this is live on every not-found page.
   One-line fix, `SIGNED_IN_HOME` already exists for it: `window.location.assign(SIGNED_IN_HOME)`.

2. **BLOCKED: needs a ruling, not a link repoint** (`src/lib/nav-model.ts`, `PRIMARY_NAV` — the
   file P-11 also owns). Measured directly, not assumed: exactly **two** `PRIMARY_NAV` entries are
   dead — `to: "/today"` ("Today") and `to: "/runs"` ("Runs"). (Your 19:22 verdict said four and
   named an "Approvals door pointed at `/today`" — I can't reproduce that: `PRIMARY_NAV`'s Approvals
   entry is `to: "/approvals"`, which still resolves; `bun test src/lib/nav-model.test.ts`'s actual
   failure prints `dead = ["Today (/today)", "Runs (/runs)"]`, nothing else. Flagging the
   discrepancy rather than silently going with either number.) I tried your literal instruction —
   repoint both to `SIGNED_IN_HOME` — and it does **not** cleanly resolve: `PRIMARY_NAV` already
   has a third entry, "Work", also `to: "/start"` (added 2026-08-25 for exactly this surface). Three
   rows sharing one target breaks two *different*, currently-passing ratchets, not just the two
   route-resolves ones: `nav-model.test.ts`'s uniqueness check (`"all rail paths... are unique"`)
   and its keybinding check (`"binds no key twice, anywhere in the model"` — `navKeyHint` switches
   on `item.to`, so Today, Work and Runs would all draw the same `w` keycap on three different rail
   rows). Both "Today" and "Runs" were already 100% redirect-to-`/start` stubs before P-10 (their
   own file headers say so — Today folded into Start on 2026-08-25, Runs' board the same day), so
   the honest fix removes the redundant rows rather than aliasing three doors to one target. That's
   rail structure — P-11's charter names it directly ("Rail entries become Start · Run ·
   Settings... Remove Approvals, Insights, Threads and Policies from `PRIMARY_NAV`"). Two paths, your
   call: **(a)** I delete the "Today" and "Runs" `PRIMARY_NAV`/keybinding entries now, in this
   packet, with the four dependent test pins updated to match (clears all 3 failures, `bun test` 0
   fail, but it's rail-shape work in a packet scoped "not in scope: the rail (P-11)"); or **(b)**
   P-11 does it as part of its own restructure and these 3 stay red until then. I did the ruling-free
   half already (`ENGINE_ROOM_PATHS` losing `/govern`/`/trust-ledger` — that's active-state data, not
   a rail door, so I fixed it and its 2 tests without asking).

**A1 verdict:** _19:48 IST_ — **Your correction stands: two dead `PRIMARY_NAV` entries, not four,
and the Approvals door was never on `/today`. My 19:22 line was wrong; yours is measured.**
Blocker 1: fixed in place by A1 (R-16 §2, Meridian is A1's): `boundary-states.tsx:162` now assigns
`"/"`, which `index.tsx` routes to `SIGNED_IN_HOME` for a signed-in person; Meridian does not import
shell code. Blocker 2: **ruling (a).** Delete the "Today" and "Runs" `PRIMARY_NAV` and keybinding
entries in this packet and update the four dependent test pins; both were redirect stubs to `/start`
before P-10 and P-11 removes more of the same. Note it in the Report as rail work done under this
ruling. Then re-run the whole suite and report the pass/fail line; I verify from there. The rest
of the Report is exactly the evidence the protocol asks for.
### P-11 · The rail is three doors · Lane: **A3** · Status: CLAIMED (A3, 19:34 IST) · Moves: 1, 4

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
or `Needs you: approve the PR` · when. Rows navigate to the run. Below the runs, one region,
**Arriving** (founder, 2026-09-02 19:12): *"14 signals this week from 3 sources · 2 themes forming ·
none opened a run"*, with a door to the Arriving view (P-14 keeps `DiscoverSurface` for it). Nothing
else on the page. The `Board` is not mounted on `/start`. The "Ask the crew" second input is removed. The AskDock's "Hand it
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

**References (A1 pulled from Mobbin 2026-09-02).** Codex
([screen](https://mobbin.com/screens/0ef48bf9-722a-48f6-b1b9-fe3f3d23eadf)): *"What should we code
next?"*, one box, then **Start your first task** as three cards, each a full sentence with its own
Start button; tabs Tasks / Code reviews / Archive under the box. Claude Code web
([screen](https://mobbin.com/screens/4ba51de5-d1f7-4102-af6a-2da18e34cc0d)): *"Let Claude handle
it"*, one box with a greyed example sentence as the placeholder, four job cards below with the
connector each needs drawn as icons. Cursor
([screen](https://mobbin.com/screens/59358834-5391-4d2d-8a18-e80750431b58)): task rows with a
diff-stat chip (`7 files +17 −0`), a status chip (Draft · Branch · Merged), title, model, repo, age.
Devin ([screen](https://mobbin.com/screens/8549e975-4dce-41d8-b7c8-de1bf4edfb0a)): recent sessions
list with *"PR is ready"* under the title as the one exception state. Take: the example jobs are
Codex's three cards; the placeholder is a real example sentence, greyed; a run row is Cursor's row
with our middle column instead of the diff stat.

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
- [ ] The Arriving region's three numbers come from `signals` and `themes` on the workspace with the
      bar applied (same predicate as `promoteClustersOnce`), and its door opens the Arriving view.
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
- [ ] **The self-check is visible and counted (playbook gap 22, founder 2026-09-02).** Every
      station's own check writes one transcript row in the form *"Checked its own work: N lines held,
      M did not"* and, on a retry, *"retried once"*; `GotYou` shows the total (*self-checks 3 · 1
      retry*). Counted from what the check actually compared, never a constant.

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
- [ ] **The existing self-referential forecasts get graded, not deleted (founder, 2026-09-02).** Every
      non-sample forecast whose observable names a Supaprod tool or table is settled by the platform's
      own path as `inconclusive` with the rationale *"This forecast was about Supaprod's own
      paperwork, not your product, so it cannot be graded"*, visible on that run's Learn tab and its
      Start row. A1 lists the ids in the Blockers block before you start. This is the grader's first
      real run on anything.

**Blockers (A1, 2026-09-02 18:58 IST):** the self-referential forecasts to grade `inconclusive`
through the platform's own path (non-sample, ungraded, observable names a Supaprod tool or table;
re-run the predicate before you start, the list may have grown):
`663c7376-f79f-4691-8be1-ec54f497dc99` (release-verifier, "prd.get will return status='approved'"),
`420732eb-0f34-4294-a850-897f94473ba8`, `e67ae002-57be-4b37-8940-5074117462da`,
`7b43fd8e-5078-47fc-936c-1b98cc4f2ff2`, `f649905d-9904-4ef1-9dff-c6d4feaa58f2`,
`eec7780d-3f8f-4afc-9714-335844bd11ef`, `666f860f-170b-4a38-a5e9-3ff59a1963aa`,
`08cc534e-88f0-4f96-85e8-190b5c67df66` (horizon 2030-01-01; strategist, `workspace.search` /
`sources.status`). The 12 seed "resolved" rows were quarantined by A1 the same day
(`decisions.is_sample=true`; SQL in `A1-REPORT.md` §5), so they no longer count anywhere.

**Report / A1 verdict:**

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

**Reference (A1, 2026-09-02 19:35, Lovable's own settings, signed in).** Their AI-affecting settings
are switches with one sentence each: *Live preview — run your app on a live dev server in the editor
preview; when off, the preview shows the latest built version* · *Project monitoring — regularly
checks your project for issues and improvements; past checks and their credit usage are stored in
your history* · *Auto-fix security issues — auto-fix is enabled for this project*. Take the form:
the mandate is switches and one number, each with the consequence in one sentence, never a console.

**Report / Blockers / A1 verdict:**

---

### P-14 · Delete five station pages and the mission run screen; keep Arriving and the Record · Lane: **A3** · Status: BLOCKED → P-01, P-05 verified (founder approved 2026-09-02 19:27) · Moves: 4

**Ruled by A1 after the founder's question of 2026-09-02 19:12.** Two workspace-wide views are
needed and are not stations: **Arriving** (what came in, from where, what is forming, what has not
opened a run: today `/discover`'s `DiscoverSurface`) and **the Record** (every decision with its
forecast and grade: today `/brain`). They survive, renamed for what they are to a person, reached
from Start's Arriving region and from any verdict, never from a rail door or a station name.

**Scope.** `_authenticated.decide.tsx`, `plan.index.tsx`, `plan.spec.$id.tsx`, `design.tsx`,
`build.index.tsx`, `ship.tsx`, `learn.tsx`, `runs.$missionId.tsx`, `today.tsx`'s `Board` mount, and
the components only they reach. Each becomes a redirect to `/start` for one week (inbound links from
email and Slack exist), then the redirect file is deleted in a follow-up packet. `/discover` is
re-addressed as `/arriving` with its station vocabulary removed from the copy; `/brain` is
re-addressed as `/record`, the same. The old addresses redirect for one week.

**Files.** Those routes; the census of components they alone reach (run the P-12 method first and
list them in the Report before deleting anything).

**Acceptance.**
- [ ] **First, before any deletion, the fact audit (founder, 2026-09-02 19:02).** For each of the
      five pages and `/runs/$missionId`, a table in the Report: every region and fact the page
      shows · where that fact now lives (a run tab, a Start row, a Settings tab) · or **NO HOME**.
      A1 walks the five pages on `supaprod.ai` against the table. **Any NO HOME row blocks the
      deletion of that page** until a packet gives the fact a home. The known candidate: a cross-run history per
      station (`/learn`, `/decide`), which the Record must carry.
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

---

### P-20 · Which one first: a pin, and the promotion bar made visible · Lane: **A2** · Status: BLOCKED → P-05, P-17 · Moves: 1, 3

**Why (founder, 2026-09-02 18:54):** *"when various signals are queued, bucketed and themed, how do
I decide which one to hack on? Is there any prominence for that?"* Today a theme becomes a run when
it crosses the workspace bar (`promote.server.ts:274-290`, ranked severity → frequency →
confidence) and the sweep then serves runs in strict round robin by `driven_at` (`track-tick.ts:139`).
No person can say "this first". That is the gap.

**Scope.** One pin per run: `spine_tracks.pinned_at` (nullable timestamptz; migration written and
applied by A2 through the Lovable MCP, rule 12). The sweep orders `pinned_at asc nulls last, driven_at asc`. The Start row gets one
control, *Put first* / *Unpin*, and shows *First* when pinned. `driveTrackNow` is unchanged. The
Settings › Autonomy tab (P-17) shows the promotion bar in one sentence with the numbers it reads
from the workspace row (*"Runs open on their own when a theme is seen 4 times at severity 5 or
more"*) and a control to change the frequency floor.

**Files.** `src/routes/api/public/hooks/track-tick.ts` (order clause only) · `src/lib/spine/track.functions.ts`
(`pinTrack` server fn) · `src/components/start/YourRuns.tsx` (P-05's row; one control) ·
`src/components/settings/AutonomyTab.tsx` (P-17's tab; one region) · one migration · tests.

**Not in scope.** Any ranking model, scoring, or a second list. One pin, one bar.

**Acceptance.**
- [ ] With two runnable tracks and one pinned, the next sweep serves the pinned one first (A1 checks
      `track_drives` order).
- [ ] The row shows *First* and the control flips; a test asserts the order clause.
- [ ] The Autonomy tab sentence quotes the workspace's actual bar; changing the floor round-trips.

**Report / Blockers / A1 verdict:**

---

### P-21 · Plan emits `intent.md` · `spec.md` · `plan.md` in the playbook's shape · Lane: **A2** · Status: BLOCKED → P-02 · Moves: 3, 4

**Why.** Anthropic's AI-native SDLC playbook (adopted 2026-08-31, `SPEC-AI-NATIVE-SDLC.md` §4.1,
gap 20) names three files a team keeps in its repo. A team on that playbook should be able to drop
our output into their repo with no adapter. Today Plan files a `prd` row and tasks; nothing a person
can hold. Founder asked 2026-09-02 that what can be taken from the playbook be implemented.

**Scope.** At Decide the strategist derives the five intent fields (problem · who it is for ·
constraints · what success looks like · non-goals; gap 16) and they are stored on the decision. At
Plan, `prd.draft` and `tasks.create` produce three rendered files, `intent.md`, `spec.md`, `plan.md`,
in the playbook's headings, stored as artifacts on the run. The Plan tab shows them as themselves
with copy and download. Build's changeset includes them under `.supaprod/` in the PR so the repo
carries the record the verdict was graded against. `GotYou` counts them.

**Files.** `src/lib/spine/driver.ts` (Decide and Plan briefs only) · `src/lib/spine/attach.ts` ·
new `src/lib/spine/playbook-files.ts` (pure renderers, tested) · `src/components/track/ArtifactPane.tsx`
(Plan body only) · `src/lib/ai/tools/registry.server.ts` (`studio.stage` gains the three files when
present; no other tool) · tests.

**Not in scope.** `bands.yaml` (P-04 owns the band), `REVIEW.md` (P-02 owns done), hooks (gap 21,
parked).

**Acceptance.**
- [ ] A driven track's Plan tab shows the three files with the playbook's headings; a test renders
      them from a fixture decision and spec and checks every heading.
- [ ] The PR opened at Build contains `.supaprod/intent.md`, `spec.md`, `plan.md` at the run's
      content (A1 checks the PR on `relay-homeowner-app`).
- [ ] `intent.md` carries the five fields and the forecast (claim, observable, horizon) verbatim.

**Report / Blockers / A1 verdict:**

---

### P-22 · The thing being built runs in the right pane · Lane: **A2** · Status: BLOCKED → P-03 · Moves: 3, 4, 5

**Why (founder, 2026-09-02 19:29, from Lovable's Live preview setting: *"Run your app on a live dev
server in the editor preview. When off, the preview shows the latest built version."*).** Watching
the diff is watching the work; watching the app run is watching the result. This is gap #11 in
`OPERATING-MODEL-5-SESSIONS.md` (*"Nothing RUNS in front of the person"*), specced in
`SPEC-BUILD-PATHS.md`. Priority after the current set; first close before launch, second close after.

**First close (this packet).** At Build and Ship, when a `deployments` row exists for the changeset
with `environment='preview'` and `status='success'` at the changeset's head sha (any provider, per
the P-03 ruling), the Build row's artifact renders the preview URL in a frame with the diff behind a
toggle (*App · Diff*), the checks beneath. While the preview is building, the same slot shows the
deploy steps with a clock (Vercel's streaming build log), never a spinner. When no preview exists,
the slot says why in one line (*"No preview: the repo has no preview deploys connected"*) with the
door to Settings › Connections. Ship's row shows the production URL the same way once
`release.publish` fires.

**Second close (post-launch, not this packet).** A sandbox per run that boots the repo at the
changeset and hot-reloads as the builder edits, so the app changes in front of the person while the
transcript scrolls. `SPEC-BUILD-PATHS.md` ranks the candidates; Vercel Sandbox SDK is the reference.

**Files.** `src/components/track/ArtifactPane.tsx` (Build and Ship bodies only) · new
`src/components/track/AppFrame.tsx` (the frame, with its sad states; name in the Report the Meridian
primitive checked first) · `src/lib/deployments.functions.ts` (a read for the preview at a sha, no
write) · tests.

**Acceptance.**
- [ ] On a track whose changeset has a successful preview at head, the Build row shows the running
      app in the frame; toggling shows the diff; the checks render beneath with state and clock.
- [ ] While the preview is building, the slot shows the deploy steps and a clock; a test asserts no
      spinner and no empty region.
- [ ] With no preview, the one-line reason and the Connections door render (A1 checks on a track with
      no deploy).
- [ ] The frame is sandboxed (`sandbox` attribute set; no top-navigation) and the URL is shown beside
      it with an open-in-new-tab control.

**Report / Blockers / A1 verdict:**

---

### P-23 · Settings: six tabs, mapped from Lovable's, with what exists today · Lane: **A3** · Status: BLOCKED → P-17 · Moves: 4, 5

**Why (founder, 2026-09-02 19:29; A1 read Lovable's project settings signed in at 19:35).** Lovable's
settings are one searchable page with groups: Project (name, subdomain, owner, message and edit
counts, credit usage, project type, design system, **project monitoring** "regularly checks your
project for issues", **live preview**, publishing: category, badge, visitor analytics, AI app
context, auto-fix security issues, trust center, unpublish; sharing; remix/move/transfer; danger
zone) · Git · Domains · Workspace (plans and credit usage, Slack) · Access (people, groups, identity)
· Customization (**knowledge**, skills, templates, design systems, connector settings) · Build and
deploy (build secrets, managed registry, MCP server, workspace domains) · Security (privacy, security
center). The lesson is not the list. It is that every setting sits under one search box, states its
consequence in one sentence, and the ones that change what the AI does (knowledge, auto-fix,
monitoring, live preview) are switches with a sentence, not pages.

**Scope.** `/settings` becomes one page with a search box and six groups, each entry one row with a
one-sentence consequence, built from what already exists (name in the Report which existing
component or server fn serves each row; nothing new behind a row that has no existing writer):

| Group | Rows (existing writer) |
| --- | --- |
| **Autonomy** | P-17's tab: the mandate sentence, spend ceiling, kill switch, tool modes, the promotion bar (P-20) |
| **Brief** | the workspace brief the agents read at Discover (`workspace_briefs`; empty in 13 of 21 workspaces on 2026-09-02, and Discover starves without it): one editor, one sentence on what it feeds; Lovable's "Knowledge" |
| **Connections** | repo binding (`helio-prism-build` style), sources, MCP connections with their last error visible (`mcp_connections.last_error` is write-only today), preview deploys (feeds P-22) |
| **Workspace** | name, slug, people, invites, domains; the sample flag shown read-only with its consequence |
| **Usage** | spend this month against the ceiling, runs, tokens (`agent_runs`), credits (`BillingBanner` runway) |
| **Security** | what the agent may read and write in the repo (`STUDIO_FORBIDDEN_PREFIXES`), the audit trail door (`/engine-room`'s record rooms), export |

Everything under Engine Room that is not one of those rows stays reachable at `/engine-room` until
P-14's fact audit places or removes it.

**Files.** `src/routes/_authenticated.settings.tsx` (4,085 lines today: fold, do not add) ·
`src/components/settings/**` · tests.

**Acceptance.**
- [ ] One search box filters rows across all six groups; every row has a one-sentence consequence.
- [ ] The Report's table names the existing writer for every row; a row with none is not built.
- [ ] `settings.tsx` line count goes down, reported before and after.

**Report / Blockers / A1 verdict:**
