# UNIT 000: reading notes, before anything is built

**Written:** 2026-08-23, ~04:15 IST
**By:** LANE 1
**Status:** context-gathering complete. Plan comes next, in the same push.

## What I read

Repo README, AGENTS.md, CLAUDE.md, SOURCE-OF-TRUTH `## Now`, session-handoff (bottom up),
initiatives/README.md, agent-first-reimagining-index.md, agent-first-platform.md section map,
meridian.css token inventory, the ratchet baseline, MAIN LANE's answer M01. Then the running
app as harbor@ via Playwright: /today, /discover, /decide, /brain, /runs, /settings,
/approvals, plus redirect checks (/tasks -> /today, /notifications -> /settings?section=notifications,
/knowledge -> /brain).

## What the product is, in one paragraph of my own words

Supaprod runs a seven-station product lifecycle on agent crews. Evidence lands from connected
sources, clusters into themes; a theme becomes a bet; a bet becomes a spec, a build run, a
ship; an outcome settles against the forecast recorded when the call was made, and that verdict
re-ranks what Discover and Decide show next. Humans set policy in advance and are pulled in
only where judgment is genuinely required. The moat is the forecast captured at decision time;
the record itself was proven backfillable.

## What surprised me

1. **The reimagining already happened once.** 2026-08-22 produced ten documents and 49 commits
   (`agent-first-reimagining-index.md`). The design did not need reimagining, it needed
   activating -- that session's own finding. My plan must be an *activation and completion*
   plan, not a fresh derivation. Re-deriving §2-§10 of `agent-first-platform.md` would be the
   exact double-payment initiatives/README.md exists to prevent.

2. **The core surfaces are better than the brief implies.** /today, /decide, /approvals,
   /brain and /runs all carry real hierarchy: a page-level claim ("56 bets ranked, strongest
   first"), supporting line, one focal card, distinct primary action. The founder's "random
   dump" complaint is accurate for what remains: dense inset boxes that are walls of small
   text (the cluster detail on /discover, the bet detail on /decide), run-on middot summary
   lines, and above all the long tail + empty/loading states I have not all visited yet.
   Wave 1's rival-scale cleanup is still the root cause work; but Wave 3 should not treat
   these five surfaces as unreached.

3. **Navigation consolidation is further along than the route count suggests.** 58 of the
   authenticated routes carry redirects or guards. /tasks, /knowledge, /notifications and
   others already fold into Today / Brain / Settings. The rail is four items. The station
   strip (01-07) rides above every surface. A lot of IA thinking has already shipped.

4. **Approvals has no home.** Confirmed by driving it: the rail is Today · Runs · Brain ·
   Guardrails; approvals is reachable only by the subtle header ticker (clicking it scrolls to
   /today's queue) or by knowing /approvals exists. The founder flagged this mid-session and
   he is right: a gate that unblocks agents deserves a persistent door with a live count.
   This goes into the plan as a named fix, not a footnote.

5. **The loop's economics broke the moment it touched real input** (index finding 4): one loop
   burned a monthly grant in 80 minutes, promoted by 13 restatements of two sentences. Any
   build work that increases loop frequency without touching economics makes that worse. The
   plan keeps credit visibility inside the flows it touches rather than treating billing as
   someone else's surface.

6. **MAIN LANE's answer M01 changed how the ratchet is worked:** the guard is per-file and
   per-marker; debt cannot be traded between files; a successful reduction turns `bun test`
   red until `bun run design:ratchet` re-freezes, and the re-freeze lands in the same commit
   as the port that earned it. Starting debt is 3,170 across 222 files.

## What I disagree with, stated plainly

- **"113 disconnected redesigns" is the wrong mental model for Wave 3.** The routes share four
  shells, one station strip, one composer, and a component library. The right frame is: a
  small number of shared primitives decide the quality of every surface at once. Fixing
  Meridian's gaps (button tiers, inset-box pattern, empty states) fixes dozens of routes per
  fix. Per-route passes come after the primitives, not instead of them.
- **The gallery-only Meridian components were called "a PORT programme, not a MOUNT
  programme".** True, but it should not become an excuse to leave them mounted nowhere. The
  plan sequences mounts where the surface already wants that job done, verified computed-value
  by computed-value, rather than accepting gallery-only as terminal.

## Where the biggest wins are, ranked

1. **Wave 1 rival-scale collapse** (styles.css 703, primitives.css 279, ink.css 190 = 37% of
   debt): every surface inherits these. Nothing else compounds like this.
2. **The missing primitives**: visibly-tiered buttons (founder-named defect), a caption/inset
   pattern to replace the wall-of-small-text boxes, empty-state treatment. One primitive,
   many surfaces.
3. **Approvals gets a home**: rail entry or persistent affordance with live count, one click
   from anywhere. Founder-flagged this session.
4. **Empty/loading/error states on the long tail**: most of what a new user sees; currently
   bare or absent on unvisited routes.
5. **Agent-first substance**: the composer exists ("What should we build?") on station
   surfaces; making intent-first entry universal and visible agent progress interruptible is
   the differentiating layer on top of the clean base.

## What I am carrying into the plan as constraints

- Vocabulary rules (banned words; approve vs review; no present-tense learning claims).
- No fake/stubbed functionality; no numbers without queries; screenshots stay out of git.
- Bun only; commit messages in a file; never `git add -A`; stage by name.
- Ratchet: per-file guard; re-freeze in the same commit; never widen.
- MAIN LANE owns answers/ and STATUS.md; I own requests/ and units/.
