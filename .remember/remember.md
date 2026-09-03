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
