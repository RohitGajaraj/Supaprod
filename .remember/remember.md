# JOURNEY SWEEP — 2026-09-02 ~03:00 IST — THE STATION STRIP FOLD, AND WHAT EACH STATION PRODUCED

**Branch `main` · HEAD `dc4854abb` · 0 unpushed · 0 behind origin/main · tsc 0 · 13,601 pass / 0
fail · working tree clean**

**Everything is pushed. Lovable deploys from GitHub, so this session's work is shipped.**

## THE THING TO KNOW BEFORE YOU TOUCH THIS

**The horizontal seven-station strip is gone from every workspace screen.** It draws only inside a
run now, and the whole fold rests on ONE condition in `AppFrame.tsx`:

```tsx
{strip && strip.mode === "tab" ? (
```

**Four publishers still push a `nav` strip** — `WorkspaceSpine` for the life of the session, plus
`DiscoverSurface`, `InboxSurface` and `Board` calling `useSpineStrip` directly. **None was
removed**, deliberately: a surface reporting what it is doing is not the defect, drawing a
permanent band from it was. So **gating on `strip` alone puts the band back on every screen with
nothing to notice.** `the-strip-is-a-runs-step-list.test.ts` exists for exactly that.

**The founder asked for a reference point before it went and it is written down, not photographed.**
`docs/design/station-strip-before-the-fold.md` carries the markup, the CSS, the measurements and
the reasoning. `docs/screenshots/` is gitignored, so the two captures will not survive a clone —
that is why the doc is prose. **Read it before proposing the band come back.** It also records the
two founder-reported CSS fixes a rebuild would quietly lose: `overflow-x: auto` and
`min-width: 108px` (now 124px) **are a pair**, and with `clip` + `min-width: 0` the seventh chip
vanishes off the right edge again.

## THE CORRECTION THAT MATTERS MOST

**I filled `RunMapStation.outcome` twice, and the first one was wrong in a way that looked right.**

Version one counted rows in `agent_runs` and rendered "3 turns, 2 with failures" per station. True,
verified against SQL, and the wrong answer: it described the **work** where the field's own
docstring asks for the **product**.

`whatItProduced()` in `what-it-produced.ts` had been in the tree the whole time, reading
`spine_track_members` — the table that records which artifact each station filed — reachable through
`getTrackChain`, **which the run screen already polls** under `["spine-track-chain", trackId]`. The
right build needed no new server function, no new query and no new vocabulary. Mine needed all
three, and `getTrackStationWork` was deleted again in the same session it was added.

**Why I missed it:** I queried `information_schema` for tables carrying a `track_id`, saw
`spine_track_members` in my own results, and read past it as plumbing. It is the join table, which
is to say it is the answer. **A parallel read-only audit agent found it.**

It now reads, on run `ce846e9b`:

```
Discover   Discover filed 1 finding.
Decide     Decide filed 1 decision.
Plan       Plan filed 16 tasks and 5 specs. 12 of them repeat 5 things already filed.
Design     Design filed 10 prototypes. 10 of them repeat 3 things already filed.
Build      Build filed 1 run.
Ship       (nothing — not reached)
Learn      (nothing — not reached)
```

Plan and Design are the argument for the whole change: *"12 of them repeat 5 things already filed"*
says the run is going in circles, which is what a person opens that screen to learn.

## THE OPEN DECISION, AND IT IS THE FIRST THING TO ASK HIM

**The strip and the left pane's route now print the IDENTICAL sentence, 400px apart** —
"Discover filed 1 finding." twice on one screen, because both read it from the same chain. That is
the defect this whole pass removed everywhere else, and I introduced it at the end.

**My inclination, not yet approved:** the strip keeps the sentence (it is the glance and the
control, and it never scrolls away); the left route drops to holds and steps only.

## WHAT ELSE IS STILL OPEN

1. **"Build filed 1 run." is true about membership and thin about outcome.** Build's expected
   artifact is a `changeset` and there is no changeset row — the member is a `mission`. Build made
   **55 tool calls on that run, all repo reads, and staged nothing.** The sentence is not wrong; the
   run is. **That is a finding about the build path**, not about the line.
2. **`TrackChain` is the biggest station display on the run screen at 2,706px** and is untouched.
   The run screen drew the stations **four** times (not three, which is what I wrote first) plus a
   fifth in prose, "Now: Build. Next: Ship." Removing the tab row took it to one tablist and one
   control; the other three remain as readouts.
3. **`bun run lint` is red** and was before this session: ~334 `no-explicit-any` plus
   `react-refresh` warnings. Not touched.
4. **`bun run docs:check` is red on four PRE-EXISTING orphans**, all under the gitignored
   `docs/screenshots/`: `spec-after-radio.md`, `spec-retry.md`, `approved-spec-snapshot.md`,
   `spec-page-snapshot.md`. Nothing this session added to that list.

## THE DEFECT CLASS THAT PRODUCED MOST OF THIS SESSION

**A value printed identically on every row distinguishes nothing.** Found and fixed in eight
separate places: 16 agent cards ending "Runs on its own", every armed switch reading "Running on
its own.", 40 audit rows printing the word "agent", all 16 Brand rows ending "Learned", 24 Insights
rows leading "An outcome memo", every handoff row saying "the run moved on its own", the CI list
stamping one verdict on every expectation, and four of seven strip chips carrying nothing.

**The rule that fixes it:** print it when it DISCRIMINATES, computed over the rendered set, and stay
silent when it does not. **Never suppress an exception** — a person is required, something is
switched off, something failed. Those are what the reader came for.

**The trap inside the rule, learned the hard way on the audit trail:** adding a `title` tooltip
fixes a CUT string and does nothing for a REPEATED one. Six rows on Record shared a subject, so the
tooltip handed back the same sentence six times. A repeated row needs a **different fact** (there,
the exact timestamp), not the hidden half of the same one.

## TWO THINGS ABOUT WORKING IN THIS CHECKOUT

**Another session (`supaprod-eb`) is live in this same worktree.** It archived `AGENTS.md`,
`CLAUDE.md` and `GEMINI.md` to `docs/archive/`, unregistered the SessionStart injection, and hardened
`playwright.config.ts` to exclude every UNTRACKED spec in `e2e/` (computed from `git ls-files`) after
my agents left probe specs behind twice. Root now holds `README.md` and `CLAUDE.md` only.

**My `git add` swept its three staged renames into `bed7bfe7c`**, whose message is about automation
switches. It chose to leave them rather than rewrite shared history. **Commit explicit paths:
`git commit <path> -F <file>`, never `git add -A`, and check the index before committing** — it may
already hold another lane's work.

**Four MCP route files arrived in the tree with their object literals collapsed onto one line** by
some formatter. Whitespace only, semantically identical, and they FAILED `prettier --check` while
the committed versions passed. Restored with `prettier --write`, which reproduced the committed
content exactly — proof the diff was formatting. Not mine, nothing lost.

## WHAT WAS VERIFIED IN A BROWSER, NOT JUST READ

Every fix in this session's 34 commits was checked on the running app at `localhost:8080` signed in
as Maya Ruiz / Helio Labs / Prism. **Three defects were only findable that way** and code review had
not caught them: `?queue=1` silently stripped by the router, the front door printing the same
sentence twice while its own test stayed green, and Quality > By surface rendering **8463%**.

**And two numbers were only correct because they were checked against SQL rather than against the
screen.** "18 agents finished" was 2 agents × 9 runs each. `passRate * 100` was a judge score out of
100, so every surface on Quality was green permanently, whatever it scored.

## 2026-09-02 20:20 IST — A1 lane (Fable). P-01 and P-10 DONE on the live site; suite green.
Queue `the-first-run/A-QUEUE.md`; report `A1-REPORT.md`. Live at `d43fc2829`. In flight: P-11 (A3), P-24 (A2). Date: 15 Sep complete, 23 Sep public.

## 2026-09-02 22:05 IST — A1. Seven packets DONE and live (P-01, P-10, P-11, P-12, P-13, P-17, P-24). In flight P-05 (A2), P-16 (A3). Suite 13,653 / 0. Lovable publish builds the commit it holds at that moment; check latest_commit_sha before walking.

## 2026-09-03 03:05 IST — A1 (Fable). 15 packets DONE and live; P-18 rejected (one fix); P-14 ruled per row (R-34 no lanes, R-35 a mission without a track is not a run). R-30 was inert in production (approval-policy forced review), fixed and published; first unattended PR on the bound repo (PR #4, 20:51 UTC); then two more Build-path defects (re-drive in pr_open; cancelled gate parks the run) with A2. Track 6817e386 stopped via stop_requested_at until fixed. Honest run 2fdf93b6 still parked. Date call unchanged.

## 2026-09-03 06:05 IST — A1 (Fable). Twenty packets done/live. The Build path ran unattended (PR #4) and exposed nine defects, all fixed but one ordering fix in hand; the correction loop behind weeks of duplicates is named and fixed (P-03c); a schema-vs-queries test closes the dead-join class. Founder decides PR #4. Extension down since 04:12; live walks pending. Date call unchanged.

## A1 · 2026-09-03 14:05 IST · the seeder rule moved into the database; P-35 done; Start's Arriving line still by person

- **Lovable's `send_message` never delivered** (idle 300 s, no message in `list_messages`); do not rely on it to apply SQL. `query_database` takes one `sql` string; a 91 KB function was staged in a scratch table in four md5-checked chunks and would have executed, except that a `git pull` first showed A2 had withdrawn the file (a61243fdd) for a trigger migration. **Pull before executing anything prepared over more than a few minutes.**
- `20260909020000` verified by objects: 12 `mark_sample_rows` triggers, function present, rolled-back probe true/false, 0 unmarked of 2,467; ledger row inserted by A1 at 13:49 IST after the checks. Lovable drops `schema_migrations` rows; the ledger check is A1's after every apply.
- Twelve Helio decisions carry `is_sample = true`: seven are seeder titles in the real workspace, five are Helio's own written from a parent opportunity that was marked on the day. Ruling in the queue under P-33; fix is A2's.
- Start's Arriving line reads `getSenseCoverage` and `getThemePromotionCounts` (`discovery.functions.ts` 1263 and 599) with no `workspace_id` filter. Third and fourth readers of the P-33 item (1) defect; A2 told, guard test to be extended.
- P-35 verified by reintroduction (scratch `select("*")` on signals fails the guard naming the file); published at 13:43 IST (Lovable at 2e8868d17).

## A1 · 2026-09-03 15:40 IST · the honest run, two rulings, and the evidence number

- Honest run `870b70d3` (founder, 14:12 IST, Helio Labs, product Prism by the switcher): five Sense passes on a no-evidence sentence; the Researcher wrote two signals into the workspace (14:41); Decide declined the sentence on them (15:00); Critic upheld; Learn at 15:10. Nobody pressed. R-36 (carry on the person's word, no attempt) and R-37 (Sense reads, never writes) in RULINGS.md; P-40 and P-41 built by A2, published 14:56 and 15:15, proved live (Arriving 15 → 17 → 13).
- **943 of 1,512 signals are `source = 'agent'`; Helio 96 of 277.** Excluded from every evidence count from 15:15; marked `loop_authored`, never deleted.
- The switcher (workspace and product) is per-user server state on the shared demo account: do not switch from A1's tab while the founder is about to press. Probe workspace `a1-delete-probe` (owner demo user, no member row) exists for the P-39 delete walk; walk it after his second run starts, then it is gone.
- Live and verified this stretch: P-16b (both halves), P-36, P-39 items 1 and 2 (item 3 redirected to `changeset-deploy.server.ts` via `ci-poll-tick.ts`), P-33 §5 (A2's walk by rule 18), P-35. Rules 17 and 18 in §0.
- Timer wakes: a background `sleep N; echo` gives one notification; the hook clock runs a few minutes behind the labels I write.

## A1 · 2026-09-03 17:45 IST · the afternoon after the honest run

- Live and verified since 15:40: P-32 (warm first row 1.2 s by its own marks; cold Worker 5 s first byte is a hosting item for the founder), P-42 (grader read kit; live read on the 06:00 UTC tick), P-43, P-44's door (lands on `/sync` with the product; Helio Labs has no live source beyond the repo, a founder decision), P-34 (by object), P-39 items 1 to 3 on the code; P-37's design walked, three Meridian components and two surfaces served (gate card slots fixed, verdict leads the row).
- One ruling reversed on A2's evidence (P-04: the settle gate stays; the grader had no evidence, eight verdicts at confidence 1.0 with nothing behind them). P-42 came out of it.
- Queue rebalanced at 16:10: A3 holds P-45, P-46 (READY) and P-38 (BLOCKED: its session's permission check refused the cron migration; A1 refused to run it for A3; the founder approves in A3's session or says the word to A1). A2 holds P-37's surfaces.
- Lovable's bot pushes `Work in progress` commits that requote five files every time it regenerates types.ts; reverted twice (e619e836e, 502ad462b). Read its commit before publishing.
- Founder inputs still open at 17:45: the second sentence under Relay (proof of P-40/P-41 live), the tablet track's release gate (since 12:13), P-38's approval, the seven Prism and Trellis decisions. The `a1-delete-probe` workspace (owner demo user, no member row) still exists for the P-39 delete walk; walk it after his run starts, then it is gone.
- The switcher and the theme are per-user state on the shared demo account; the page went dark at 17:10 without either lane touching it.

## A1 · 2026-09-03 20:10 IST · both lanes idle; the day's close

- 40 of 47 packets DONE with A1's evidence. Closed since 17:45: P-38 (founder approved in A3's session; verified by object, 36/37 cron jobs on supaprod.ai with deadlines, ledger 20260909050000), P-46 (founder approved; publish gates PC-04 and the beta stories still open; nothing went outward), P-47 (by repro), P-43, P-44's door and header; P-45 retired (my premise error).
- P-37: gate card, transcript row, calendar wait served and verified; A2's 691f87dba (character quiet, composer promise) published 18:44 but the live run at Learn/`needs-evidence` still showed the Supa line and the default placeholder at 19:42; A2 has the read. Remaining items listed under P-37 in the queue.
- Two of my claims were wrong today and are recorded as such: P-45's premise (unverified mount), the calendar-wait evidence (a stale DB read). Re-read the row and say when.
- Founder inputs open: the second sentence under Relay (proof of R-36/R-37 live), the tablet release gate (`0c7374b6`, pending since 12:13 IST), the seven Prism/Trellis decisions. Helio Labs has no live source beyond the repo (founder decision). Probe workspace `a1-delete-probe` still exists for the P-39 delete walk.
- Tomorrow 06:00 UTC: the grader's first real read (P-42); check `forecast_resolution_log` for `read` and `cited` and the Learn tab.
