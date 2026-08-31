# Closing note — S3 · THE PLATFORM

> _Last updated: 2026-09-01_

**Written 2026-09-01, for tomorrow morning rather than for the archive.**
Branch `lane/platform` at `15cddc622` · **0 behind / 29 ahead of main**, pushed, awaiting S0's merge.

---

## DONE

**Gates on the merged tree:** tsc 0 · **13,346 pass / 0 fail** · lint 0 errors on every file this
lane touched · `docs:check` clean · `check:unreachable` back to its frozen 141 server functions.
**No migrations from this lane** — S3 does not write the database by design, so the founder's
"apply your own migrations individually" step is a genuine no-op here, not a skipped one.

Tonight's units, newest first:

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

**My own guards were blind twice today, and only mutation testing found it.** The §12 rename guard
was switched off by an explanatory comment I had written above the line it protected. The billing
guard used `\w*` between two operands, which cannot cross the dot in
`data.monthlyGrantCredits − data.balanceCredits` — the exact spelling that shipped the bug — so
restoring the real defect left the suite green. **Writing the guard is not the work. Trying to
defeat it is.**

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
