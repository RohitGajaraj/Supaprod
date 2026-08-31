# Closing note — S3 · THE PLATFORM

> _Last updated: 2026-09-01_

**Written 2026-09-01, for tomorrow morning rather than for the archive.**
Branch `lane/platform` at `7582da56d` · **0 behind / 32 ahead of main**, pushed, awaiting S0's merge.

> **Close-out status against the founder's five steps.** (1) Safe: clean tree, nothing unpushed.
> (2) 0 BEHIND is done; **0 AHEAD is not reachable by this lane** — §4 makes S0 the only session
> that merges to main, and S0 has been told plainly rather than left to infer it. (3) **No
> migrations, verified two ways**: no `supabase/` path appears anywhere in this lane's 32 commits.
> S3 does not write the database by design. (4) **The deploy is not mine and I am not taking it**
> — the operating model gives S0 the database, migrations, deploys and merges, and my own brief
> says so in terms. Stated to S0 explicitly so the fleet does not end with two lanes each assuming
> the other has it. (5) Loop and goal cleared; see the last section.

---

## DONE

**Gates on the merged tree:** tsc 0 · **13,346 pass / 0 fail** · lint 0 errors on every file this
lane touched · `docs:check` clean · `check:unreachable` back to its frozen 141 server functions.
**No migrations from this lane** — S3 does not write the database by design, so the founder's
"apply your own migrations individually" step is a genuine no-op here, not a skipped one.

Tonight's units, newest first:

- **U-S3-044 · S4's three standing measurements, taken signed in on `/start`.** The first screen
  **does** say what needs the person — a count, a named item and its actions, above the fold, no
  click. **And four of its numbers are four different populations presented as siblings**,
  none naming which: *All 65*, *Waiting on you 93*, `agent_approvals` 7, *Gates* 16. **I called
  this a disagreement and S4 corrected me the same night** — the queue is a deduped union across
  up to fifteen tables, so a mismatch was guaranteed by construction and the fix is **labelling,
  not reconciliation**. What survives is stronger: a reader cannot tell what each one counts,
  and neither could I with the source and the database both open. The list claims the oldest has
  waited 44 days beside a card reading 53, where the true oldest approval is 38. The 93 **admits
  its own inflation** (*"17 of these repeat others on this list, and 5 ask for work this board
  already shows as finished"*) and headlines the uncorrected total anyway. Time to a readable
  count: **979 ms** warm; the 9.3 s cold figure is an upper bound including Vite's first compile
  and should not be quoted as a product number. All of it is in `components/today/**`, which is
  S2's, so **nothing was changed** — reported to them with file and line.

- **U-S3-043 · The credits usage bar was wrong on every account that had spent anything.**
  `/settings?section=billing` drew **"0 of 10000 this month"** while, four hundred pixels below on
  the same screen, *Spend and runway* read **"Spent 28,090 credits in the last 7 days."** The
  derivation was `used = Math.max(0, monthlyGrantCredits − balanceCredits)`, which does not measure
  consumption — it measures the current dip below a nominal grant, so a grant landing mid-cycle
  erases the memory of every credit spent and the clamp turns the negative into a confident zero.
  Measured across all sixteen accounts: **four have ever spent a credit and it understated all
  four** (0 vs 23,218 · 3,508 vs 16,020 · 0 vs 4,250 · 6 vs 4,247). Claim deleted, not softened.
- **U-S3-042 · The browser tab was the one surface no check was pointed at.** `/engine-room` read
  *"Engine room"* and `/brain` read *"Brain"* — both §12-retired — while my own rename guard
  reported the prefix clean, because it reads props and JSX text and a route's `head()` returns
  plain objects. Guard extended; tabs now track the rail doors.
- **U-S3-041 · `/brain` rendered nothing and the type was certifying the bug.** `decisions.status`
  carries five values, `OUTCOME_WORD` mapped three, and the map was typed `Record<Union, …>` over a
  union **narrower than the column**. 115 of 385 rows (29.9%) fell through. **Verified signed in by
  S2 afterwards:** body 525 → 4,296 characters, page errors 1 → 0.
- **U-S3-040 · The demo credential was documented all along.** `harbor@supaprod.ai` at
  `docs/operations/demo-credentials.md:82`; four lanes had been reading `.env` and concluding no
  credential existed. `.env.example` now points at it and names why investor logins must never be
  used for rehearsal.
- **§0.9 "NO LANE IS EVER DONE"** in `OPERATING-MODEL-5-SESSIONS.md`, plus the `NEVER DONE` clause
  in all five `/goal` blocks, after auditing why four of five lanes had stopped: S0's brief made
  continuing conditional and S1/S2/S3 had finite job lists with no successor instruction. S4 was
  the only lane still running and the only one told "your loop, forever."
- **The dev-server port was wrong fleet-wide.** Every brief said `lsof -ti:5173`, which is always
  free because Vite binds **8080** here, so R-21's one-server guard had never once fired. Corrected
  in all five briefs. It explains S2's machine crash.

---

## PENDING

**Mine, and next:**

1. **The pages still say the old words on themselves.** The rail now reads Home · Approvals ·
   Insights · Threads · Policies. I have taken the browser tabs; the page bodies behind `/brain`
   and `/engine-room` have not moved. S2 correctly called this the higher-value half.
2. **The naming sweep beyond the rail**, per the founder's second instruction — settings, billing,
   admin, governance. Not tooltips, which should stay sentences: anything a stranger reads as a
   **name**. Candidates already in hand: *"Per-member credit allocation"*, *"Per-product spending
   caps"*, and the member picker that literally renders **`owner · 60000000`**.
3. **Connections, never driven signed in.** Billing was reached tonight and produced U-S3-043 on
   the first look. Connections is the last surface in my prefix with no browser evidence at all.

**Blocked on others, all filed:**

- **A real per-cycle spend on `CreditsView`** (S0). The shortcut does not work and was checked
  first: `ledger` is `.limit(20)` for display and the demo account holds 6,461 rows.
- **Gap #2's send** — the verdict reaching a person who left the page. Needs S0's
  `track_hold_notices` migration and `RESEND_API_KEY` in the deployed Worker. Escalated.
- **The Free plan card says 750 monthly credits** while the live Free account holds 10,000 (S0).
- **The seeded-ratings count** — all 77 "rated" recalls share one microsecond and `ai_feedback` has
  0 rows ever, so *"91% of rated recalls helped"* is a statistic over seed data (S0).
- **`check:unreachable` components 80 → 71** after tonight's merges. The script asks for the
  baseline to be lowered; `e2e/**` is S4's path so I have not touched it.

---

## OBSERVATIONS

**One defect shape accounted for most of tonight, and it is worth naming for tomorrow: a true
detail under a false headline.** The notifications page, the concurrency cap, the export heading,
the `/crew` headline, and now the credits bar. In every case the details below were right and the
number on top was wrong, which is the hardest version to catch — the page looks carefully made.

**A guard that passes for environmental reasons is not a guard, it is a coincidence** (F-159), and
the credits bar is the sharpest instance yet. Twelve of sixteen accounts agreed with the ledger
**only because they have never spent a credit**. Prevalence was not the test; the four accounts
that exercised the code were 4-for-4 wrong. Any sampling check would have reported it correct.

**And a number I filed was wrong three ways before it was right.** I reported `agent_approvals` at
**77**; `count(*)` over a join to `agent_runs` counts approval x run pairs and that table fans out
28 runs to one mission, so the true 7 arrived as 77. It reached three documents and two lanes
before S4 failed to reproduce it. **Third time today I made this class of error and the first time
it escaped the session** — an aggregate beside a `join` is unproven until it is `count(distinct)`.

**My own guards were blind twice today, and only mutation testing found it.** The §12 rename guard
was switched off by an explanatory comment I had written above the line it protected. The billing
guard used `\w*` between two operands, which cannot cross the dot in
`data.monthlyGrantCredits − data.balanceCredits` — the exact spelling that shipped the bug — so
restoring the real defect left the suite green. **Writing the guard is not the work. Trying to
defeat it is.**

**FOUR INSTRUMENTS IN ONE NIGHT RETURNED CONFIDENT, WELL-FORMATTED ANSWERS ABOUT THINGS THEY
STRUCTURALLY COULD NOT SEE.** This is the one observation from tonight I would most want a stranger
to this repository to read, and it was reached from opposite ends by two lanes who were not looking
for it:

| instrument | what it could not see | what it reported |
| --- | --- | --- |
| a guard regex using `\w*` | the dot in `data.monthlyGrantCredits - data.balanceCredits` | the suite passing on the exact line that shipped the bug |
| a probe reading `innerText` | an `aria-label` | that a labelled region did not exist |
| `count(*)` beside a one-to-many join | that it was counting approval x run **pairs** | **77** where the answer was **7** |
| S4's CSP origin guard | that a file *mentioning* an origin is not a page *loading* it | a security log's record of a concern as evidence dismissing it |

Three of the four are mine. **Every one of them was clean, plausible and well-formed** — none
failed, none warned, none looked wrong. **The plausibility is the mechanism, not the excuse:** 77
looked like what I expected and so was never audited, where 7 would have prompted a check. A
fan-out produces exactly that failure — bigger, rounder, more impressive, still wrong.

The two defences that actually worked, both cheap: **make the guard fail on the literal string that
shipped the defect** before believing it, and **look at the thing with your own eyes before
measuring it** — every instrument failure above was caught only because a result disagreed with a
screen or a file already read directly.

**Driving found what reading could not, every single time.** Every finding above came from a
browser: the tab titles, the crash, the credits bar. tsc, the tests and the build were green
throughout on all of them.

**The founder's own instinct on the credential was right and four lanes were wrong.** It was
documented in the repo the whole time and we were all looking at `.env`. The fix that matters is
not "read more carefully" — it is that `.env.example` never mentioned the demo accounts at all, so
the file every one of us opened first was silent. S1 generalised it well: *a convention that lives
only where you would have to already know to look is not discoverable.*

**On the deploy.** The relayed instruction is that the last lane to finish carries it. I am not
assuming that is me. If it is, I will take it.

---

## NEXT

In order, and each is a browser drive before it is a commit:

1. **Connections, signed in** — the only surface in my prefix with no browser evidence.
2. **The page bodies behind Insights and Policies**, so the door and the destination agree.
3. **The naming sweep** across settings, billing, admin and governance.
4. **`owner · 60000000`** — give the member picker a person's name, or hand it back to S0 if the
   display name only exists server-side.

---

## THE GOAL AND THE LOOP THIS LANE WAS RUNNING, AND THAT THEY ARE CLEARED

The founder asked each lane to state what it was running, clear it, and restart on close-out.

**Goal:** `S3 · THE PLATFORM` on `lane/platform` — five jobs in rank order (J1 the verdict reaching
a person who left the page · J2 what teammates may do and what counts as done · J3 the door ·
J4 the rest of a real product · J5 the route fold), the public surface **frozen** under §0.7, and
the sixty seconds measured **signed in**, never on the landing page.

**Loop:** a self-paced `/loop` — close one unit logically, then scan for the next and pick it up,
with cross-lane messages where relevant. Tick was 60 seconds after the founder corrected an earlier
20-minute pace.

**Both are cleared as of this note.** No wakeup is armed and no further unit will start from this
lane without a new instruction.

### One thing to hand over rather than leave implied

**The five defects on `/start` are the highest-value open item on the platform tonight and none of
them are mine to fix.** They sit on the first screen a signed-in person sees, which is where §0.7
says the sixty seconds is measured. S2 has them with file and line. If tomorrow starts anywhere,
it should start there — not because they are hard, but because that screen offers four
numbers over four different populations to the question *"what needs me?"*, **none of which says
which population it counts**. The work is to name them, not to reconcile them.

