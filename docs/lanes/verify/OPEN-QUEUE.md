# S4 · The open queue

> _Every S4 finding still open, ranked, with its owner and its fix. Written 2026-08-27, refreshed
> the same night after S0 and S1 landed fixes and after the signed-in dead backend sweep._
>
> **Why this exists:** fifty-two verdict files is a library, not a work queue. Nobody can act on a
> library. This is the one page to read, and every row links to the verdict that proves it.
>
> **Ranking is by what it costs to leave alone, not by how interesting it is.** A wrong verdict that
> compounds outranks a wrong label that annoys.


---

## 0z · THE ONE BLOCKED BRANCH, AND ITS RESOLUTION IS ALREADY DECIDED

> _Measured 2026-08-28. **The 199-commit gap is gone** — main has taken the lanes and they now sit at
> `lane/run +8`, `lane/platform +10`, `lane/control +3`, `lane/proof +4`._

**`lane/control` is the only branch that does not merge**, and it conflicts with `main` *and* with
both other lanes, all on one file:

```
CONFLICT (content): Merge conflict in src/styles.css
```

**Two lanes fixed the same defect two different ways, and that is my doing.** I reported
`--mrd-raised` — the dead token on `.today-hero`, the board's featured band — to S3 as their file and
routed it to S2 as their component. Both acted.

| side | what it did |
| --- | --- |
| **`main`** (S3, `ac449703a`) | `background: var(--mrd-lift)` — repoints to a declared token |
| **`lane/control`** (S2, `859181998`) | deletes the declaration entirely |

**Take main's.** Not because it landed first, but by S2's own standard. S2 deleted it reasoning that
*"the comment above already names this band's hierarchy device: air and rules"*, and that removing a
dead rule cannot change a pixel while choosing a fill would. That reasoning is right and its premise
is incomplete: **the comment eight lines BELOW describes this band as having "a raised background"**,
and `meridian.css:209` names `--mrd-lift` as *"a raised control"*. The intent was on the record the
whole time and only the value was missing, so restoring it is the repair and deleting it ratifies the
accident.

**S2 is offline.** Whoever merges `lane/control` resolves this by taking `main`'s side of that hunk
and keeping S2's other two commits. Nothing else on that branch conflicts.

> ### SUPERSEDED, 2026-08-28 — this note may have discarded a later ruling
>
> **Read this before acting on the paragraph above.** When it was written, `main` held S3's
> **repoint** to `--mrd-lift`, so *"take main's side"* meant *"keep the repoint"*. **S0 afterwards
> ruled the other way and deleted the declaration entirely** (F-150), on a better argument than
> either of ours: the section header already states the band's design intent, and the *"a raised
> background"* comment was written while the broken declaration sat in the file, so it describes the
> **declaration** rather than an observed pixel. **Deleting a dead rule cannot change a pixel;
> choosing a fill can** — on the most-read screen in the product, as a "repair", with no design
> decision behind it.
>
> **As of this writing `origin/main` still carries `background: var(--mrd-lift)`**, verified in code
> with comments stripped — the comment above that line explains the repoint, so a raw grep shows the
> wrong thing. The ruling and the tree disagree, and this note is the likely reason.
>
> **Do not resolve that hunk from this page.** Check what the current ruling is, check what is in the
> tree, and make them agree. A merge note that outlives the decision it was written under is worse
> than no note, because it carries the authority of having been written down.

---

## 0a · NOTHING FIXED TONIGHT IS LIVE

**Production deploys from `main`, and the three build lanes sit 51, 73 and 75 commits ahead of it.**

> **Re-measured 2026-08-27 evening, and the earlier line in this slot said "9 to 16".** That was
> true when it was written and it now understates the gap by roughly five times, which is the
> problem with writing a number into a sentence and leaving it there. 199 commits, up from 182 at
> midday.
>
> **The gap is no longer only a size, it has started producing collisions.** All four branches merge
> cleanly into `main` individually, and `lane/run` and `lane/control` now conflict with EACH OTHER in
> `src/routes/_authenticated.approvals.tsx` — a conflict that did not exist at the midday
> measurement. See [S4-130](./S4-130-a-clean-merge-into-main-does-not-mean-the-lanes-agree.md); the
> gate now catches this class before the deploy does.

Every fix in this document — S0's four, S1's three, S3's transport and duplication work, my harness —
is **inert until someone merges to `main`**. `a30238f5` will keep failing at Ship for the old reason
until it does.

**That merge is the founder's call**, not a lane's, and S0 has explicitly declined to take it
unilaterally. It is the first thing to decide in the morning, because until it happens the measured
state of the product is last night's, and every number in this file describes code nobody is running.

---

## 0 · Where this stands at the end of the night, 2026-08-27 ~03:30 UTC

**The acceptance is 0, and for the first time the reason is a definition rather than a failure.**

### The three things that decide it

| | |
| --- | --- |
| **The published query will report a false pass** | It excludes decided approvals and **cannot see a press**. `a30238f5` has 0 decided approvals and **7 presses**, and sits one station from `learn`. One extra `NOT IN` fixes it (`S4-071`). **19 of 106 tracks carry a press.** |
| **No agent can clear a design gate, and there is no `prd.approve`** | Both are columns only a human server function writes. The acceptance also forbids `waived`. So on any path through a design gate it requires three things that cannot all hold (`S4-076`, corroborated by S0). |
| **Learn would have nothing to grade anyway** | **117 of 119 specs carry no standing success metric**, and the Learn brief never names the forecast on any of the 18 runs its two seats have ever had (`S4-063`, S0). |

**S0 is building the missing half** — somewhere for the loop's own verdict to land, plus a
conservative gate that fails on absence. That is the right answer and it is in flight.

### What the loop actually did tonight, which is the good news

`a30238f5` walked **`sense` → `ship`**, agent-driven, after the Discover brief fix: 13 members, a
real pull request, five stations in under three hours, on a track that filed nothing across twelve
drives that morning. **It is parked at `ship` on a terminal hold, and both of Ship's refusals are
correct** (`S4-075`). **Do not press it** — it is S0's proving ground.

### The product's honesty, measured on eleven surfaces signed in against a dead database

**No counted progress advanced anywhere.** There is no fake progress bar in this product.
`/brain` and `/guardrails` are the benchmark: *"so this is not a claim that nothing is standing."*

The live defects found, and most are already fixed by their owners: two headlines that claimed an
empty queue on a failed read (S1, fixed), one section claiming an empty queue it never queried (S1,
fixed), a transport error on four surfaces (S3, fixed at the root), six failure statements from one
read on `/guardrails` (S3, cut to three), and a rail item pointing at a folded route (**still open**,
`S4-065` §2.3e).

### What I got wrong, listed because four lanes read this page

- **`S4-056`** `/runs` is a dead end — **retracted.** My `curl` warming warmed nothing.
- **`S4-074`** four surfaces show cache keys — **retracted.** My 401 shim resolved where the
  middleware throws. S1 caught it.
- **`S4-066`** the settings control is ungated — **observation right, diagnosis inverted.** Gating it
  would have been the dangerous fix. S3 caught it.
- **`S4-047`** the em dash leak is closed — **was closed on a column total, which proves nothing.**
  Now genuinely closed for `agent_runs.output` on 9 rows created after a forward anchor; the other
  three columns have had no writes since and remain unverified.
- **`/meridian` is the worst surface in the product** — it is the component gallery (`S4-078`).

---

## 0b · Structural findings, added late in the night

These came from tooling built after the surface sweep and are the ones that describe the product
rather than a screen. Each ships with a one-command check in `e2e/helpers/`.

| finding | number | owner |
| --- | --- | --- |
| **Server functions nothing imports** (`S4-104`) | **141 of 656** | per file |
| **Components nothing imports** (`S4-104`) | **80 of 492**, noisier | per file |
| **The Meridian ratchet is bypassed by an alias** (`S4-112`) | **46 files**, and a NEW file can be all-retired and pass | **S0** |
| **Tables with a live writer and a dead one** (`S4-108`) | **19** | per table |
| **The Linear push was moved and never arrived** (`S4-110`) | capability lost in a fold | **S2** |
| **A person cannot rename a run** (`S4-108`) | confirmed | **S2** — ruled: delete, do not wire |
| **Spend accrues against no ceiling** (`S4-105`) | **10 of 14** budget rows | the spend room |
| **`/proof` prints a raw config error to the public** (`S4-102`) | one line | **S0** |

**Three of these were found by a check another lane suggested**, and two independently confirmed a
finding a lane had made by hand. That is the pattern worth keeping from tonight: **the second
instrument is what makes the first one believable.**

### And the meta-finding, which outranks all of them

**Four guards reported success while the thing they guarded was happening**: my `curl` warming that
warmed nothing, S1's `Gate` printing a status nobody had set, S0's `FILE_IT` rewrite that reached no
seat, and the ratchet's literal match. **A guard that passes while the defect exists is worse than no
guard, because it gets quoted as evidence.**

---

## 1 · Do these first. They compound.

### 1.1 · The forecast is captured at Decide and graded by nobody · `S4-063` (supersedes `S4-052`)

**Owner: S0** · `driver.ts:1002`, `chain.ts:120`, `driver.ts:871`

> **`S4-052` blamed the crew and was wrong.** The Learn brief tells the seat to grade against
> `prd_id`, the SPEC. `data-analyst`'s own job says the same. **Neither ever names the forecast**, so
> both verdicts were the crew doing exactly what it was told. Measured: `input ILIKE '%forecast%'` is
> false on **18 of 18** runs those two seats have ever had, including two composed briefs of 7,800
> and 7,842 characters.
>
> **Three changes, and any one alone does nothing:** `chain.ts:120` carries the forecast columns in
> the decision's body (today it selects `rationale` only, so none of the **eleven** `forecast_*`
> columns is ever loaded); `driver.ts:871` adds `decision` to Learn's yardstick beside `prd`, or the
> decision is dropped as one of the oldest artifacts; `FILE_IT.learn` names the forecast.
>
> Guarded in `src/lib/spine/every-seat-is-told-how-to-finish.test.ts` as a todo carrying the
> assertion. The original `S4-052` text follows, and its *proposed fix* still stands.

**Original framing, kept because the fix survives it:** · `src/lib/ai/tools/registry.server.ts`

`learning.record` has fired **twice in the product's life** and produced a wrong verdict both times.
The forecast said *"the PRD will be approved and design gate cleared within 3 business days"* with a
horizon of **2026-08-29**. Both verdicts were written **2026-08-25**, two hours later, grading a
different thing entirely (tablet abandonment against a ≤5% spec target). `forecast_resolution` is
still `null`.

Every verdict re-ranks the bet behind it and compounds into later guidance. There is no working
sample of this path to compare against.

**Fix: two comparisons, both against fields already on the decision row.**
1. Refuse to grade before `forecast_horizon_date`.
2. Require the verdict to name `forecast_how_we_will_know`.

> The guard exists today as prose in the tool description, and it is *good* prose. It was ignored
> twice. `S4-053` is the general form: **a rule left to the model gets a violation rate.**

### 1.2 · Eight of nine real open tracks are parked, and nothing says so · `S4-041` (corrected), `S4-043`

**Owner: S0** for the decision, **S2** for the surface

Of 9 real open tracks (the other 51 are `is_sample` demo fixtures), **8 are terminally held** and
excluded from the sweep by `track-tick.ts:119-120`. The only exit is one human press each, and no
surface anywhere says they are waiting.

Worse, the hold text misdirects: `station-cannot-finish` interpolates `MAX_STATION_ATTEMPTS` as a
**constant**, so it tells a person *"finished empty 3 times"* on 13 tracks whose counter reads **0**,
and **20 of 32 filed real work at the very station it names**. One track has 20 signals at `sense`,
`attempts` 0, 56 drives, and a hold telling the reader to go inspect the station.

**Fix:**
1. Read the row's `attempts`, not the constant. One token.
2. Run one `EXISTS` against `spine_track_members` on `(track_id, station)` before choosing this
   reason. If the station filed, this is the wrong hold.
3. **S0 decides** what happens to the 8: bulk-release, abandon, or leave and say so on the surface.

---

## 2 · Live and user-visible

### 2.1 · The screen offers the one action its own sentence rules out · `S4-049`

**Owner: S1** · `src/components/track/TrackRun.tsx:758-783` · **live on `main`**

`going-in-circles` says *"nothing further will be spent on it until you look"*, `station-cannot-finish`
says *"it needs your eyes"*, and the only button under both reads **"Let Discover try again"**. Those
two holds carry 7 of the 8 real parked tracks.

The same file gets it right where the problem is connection-shaped (`tools-refused` →
*"Reconnect it and start this work again"*). Two halves of one surface written to different standards.

**S1's RUN-23 addresses this and is unpushed.** Pair the offer: a parked track needs an instruction
**and** a press, because a steer alone clears no hold (`S4-045`).

### 2.2 · "step N of M" counts skipped steps as done · `S4-033`, `S4-044`

**Owner: S2** · `RunBoard.tsx:361`, `RunsGrid.tsx:395,423`

`STEP_DONE` contains `"skipped"`. Live: **179 done, 69 skipped, 360 total** — so **28% of every
"step 6 of 8" a person reads is steps nobody performed**.

**Fix:** exclude skipped from the numerator, or say how many were skipped. The second is more honest
and costs one clause.

### 2.3 · A settled receipt announces the next agent as working · `S4-033`

**Owner: S0** · `src/components/meridian/Receipt.tsx:103`

`state="running"` is a literal with no condition, so any receipt row with a handoff draws the agent
in the machine-is-working colour and tells a screen reader *"&lt;agent&gt;, running"*. Rendered on
`SettlePanel`, which is Learn's record of what already happened.

*(Corrected from the original audit: it does **not** animate. Only `gate` animates.)*

### 2.3b · Demo data is unlabelled everywhere a person looks · `S4-055`

**Owner: S3** (`src/components/shell/**`), with **S0** for the readers in `src/lib/**`

`use-workspace.tsx:17-21` carries `is_sample` to the client with a comment saying it exists *"so the
shell can label it (a tag + a banner)"*. `ScopeMenu.tsx:132-147` renders `{w.name}` and nothing else.

And the lists do not filter either: `listTracks` has **no workspace filter and no `is_sample`
filter**, relying on RLS, which scopes by membership and membership includes demo workspaces.

**Nine of ten users have demo data in their open-work list. For eight it is entirely demo.** The one
user with genuinely mixed work sees 9 of 15 rows from fixtures, interleaved by `updated_at`.

**Fix:** one line for the tag in the existing `.map`. The list-level filter or grouping is a larger
call and needs a ruling on whether demo work should appear at all.

### 2.3d · CLOSED, and my diagnosis was inverted · `S4-066`

**Fixed by S3 in `355cd83ab`.** The observation was right: the copy said *"nothing here is safe to
save yet"* while **Change password** enabled. **The cause was the copy, not the control.**
`PasswordRegion` is a sibling of `ProfileSection`, and the mutation goes through
`supabase.auth.signInWithPassword` / `updateUser` and never reads the profile row.

**Gating the control would have been the dangerous fix** — it removes a security action exactly when
the product looks broken to the person. **Do not generalise "controls must be gated on reads" from
this row.** The general form that survives: *a page must not make a blanket claim about what is safe
when only part of it failed.*

### 2.3e · The rail links to a route that was folded away · `S4-065`

**Owner: S3** (`shell/**`), caused by **S2**'s fold · **live**

`runs.index.tsx:29` is now only `throw redirect({ to: "/today" })`, deliberately. `AppFrame.tsx:376`
still carries a **primary** item labelled **Runs**, showing a runs count, that lands on **Today**.

### 2.3f · A transport error is on four surfaces · `S4-066` · **fixed at the root**

**S3 fixed it in `355cd83ab`, once rather than four times.** `sessionEndedMessage()` in
`roles.functions.ts` matches all seven strings `auth-middleware` actually throws and returns *"Your
session ended. Sign in again and this will load."* Nine Settings call sites now go through
`readFailureMessage()`.

**Still open on `/brain` and `/learn`**, which are not S3's paths. The helper is exported and ready.

### 2.4 · An all-clear that only requires *something* to have been read · `S4-032`

**Owner: S3** · `VerifyCockpit.tsx:502`, `DiagnosticsSection.tsx:59`

`summaryReady = !isLoading && !isLoading` never asks `isError`, so a failed read renders *"Nothing is
waiting on you, and no applied changes on the record yet."* Diagnostics' `bothFailed` is an `&&`, so
one failed read never reaches the honest heading.

**Fix, and it is one helper for both:** `readState(...queries) → "loading" | "failed" | "ready"`,
where `failed` is **any** error and `ready` requires **every** query to have answered.

### 2.5 · The connector surface names a repo it does not target · `S4-021`, `S4-044`

**Owner: S3** for the display, **S0** for the row

Live: one binding of three reads `label = RohitGajaraj/helio-prism-build` while
`id = Supaprod/relay-homeowner-app`. All four render sites show `resource_label ?? resource_id`, so
the label wins and the id is never shown beside it. The happy path itself drops the owner
(`product-binding.functions.ts:328` writes `repoRef.repo`).

---

## 3 · Canon that contradicts itself

### 3.1 · The vocabulary rules disagree across three files · `S4-046`

**Owner: S0**

| | |
| --- | --- |
| `CLAUDE.md:9`, `OPERATING-MODEL:733` | *"Audit trail and shared brain stay, everywhere"* |
| `positioning-locked:203` | landing Never column **bans "audit trail"** |
| `OPERATING-MODEL:32`, `:735` | ban **"autonomous"** in product copy |
| `positioning-locked:269` | **uses** "autonomous" as a measured claim |

`CLAUDE.md` names `positioning-locked` as *"Full canon"*, so the file it defers to bans the word it
protects. The cause is visible in the source: `:203`'s Register column is struck through because the
split was retired 2026-08-11, and **the per-surface Never columns were never updated.**

**Three sessions made wrong claims from this in one night.**
**Fix:** strike the retired Never columns, or mark that table retired the way its Register column is.

### 3.2 · Gap #2 is built and briefed, and the blocker is a credential · `S4-026`

**Owner: the founder**

The operating model lists *"nothing reaches a person who left the page"* as gap #2. The path exists
end to end: Learn → `learning.record` → `dispatchVerdictEmail` → Resend, with the forecast read and
paired, and `learning.record` is properly briefed. It has fired twice and delivered zero, because
**`RESEND_API_KEY` is absent** and belongs in Lovable project secrets.

**The gap list currently sends a session to build something that exists.**

---

## 4 · Instrument problems, which cost everyone time

### 4.1 · The gate is not portable · `S4-022`, `S4-035`

**Owner: S0**

Three sessions, three counts (11,691 / 11,640 / 11,634) on overlapping trees, and **nothing pins the
runtime** — no `engines`, no `packageManager`, no `.bun-version`. On bun 1.4.0, `button.test.tsx`
fails deterministically at four `Object.defineProperty(import.meta.env, …)` calls, because in bun
`import.meta.env` **is** `process.env` and it rejects a descriptor without all three flags.

**No session's "gates green" is evidence about another session's machine.**
**Fix:** pin the runtime; add `writable: true, enumerable: true` to those four lines, or delete the
two tests, which guard obsidian → Tempo aliases for two retired design systems.

### 4.2 · The motion test does not automate yet · `S4-054`

**Owner: S0** for the convention

Three instruments tried, none discriminates decoration from state. **The blocker is that nothing in
the DOM says which elements are state-bearing**, and no pixel threshold helps because the offending
strip's change is *smaller* than the background gradient's.

**Fix that would work:** a `data-state-of="…"` convention on state-bearing elements, then sample only
those. That is a convention, not a test.

---

## 5 · Closed this session, recorded so nobody reopens them

| finding | outcome |
| --- | --- |
| The transcript leak (`agent_runs.output` 1,375 dashed) | **FIXED by S0**, verified at 0 of 2,777 (`S4-047`) |
| 13 user-facing em dashes | **FIXED**, build-verified 26 → 5, all 5 structural |
| Gaps #5/#6/#12 had zero callers | **CLOSED on `lane/run`** by RUN-20 (`S4-035`) |
| C2-010's confident negative on a broken read | **CLOSED** incidentally by S2 (`S4-024` addendum) |
| S3's registry sweep safety | **VERIFIED SAFE** (`S4-036`) |
| The 6 dashed `forecast_claim` rows | **CORRECT STATE**, do not "fix" (`S4-047`) |
| The approval status drift | **STOPPED** 2026-07-25; 28 rows of residue (`S4-050`) |
| `/runs` never resolves (`S4-056`) | **RETRACTED, no defect.** My own `curl` warming was the bug. Warm, `/runs` redirects in 4.2s, faster than `/today` (`S4-057`) |
| Discover never clears (S0's brief fix) | **FIXED** at `8b724e096` after S4 proved the rewrite reached no seat. All three sense seats now carry it (`S4-060`, `S4-062`) |
| §2.1 the offer contradicts the hold · §2.3b demo data unlabelled | **S1 reports RUN-48 / earlier runs.** Not yet re-verified by me on `main` |
| `/approvals` "Nothing is ready for you." on a failed read (`S4-064`) | **FIXED by S1** on `lane/run`, code verified. **Screen not re-measured until it reaches `main`** |
| `/learn` "Nothing is waiting to graduate" (`S4-064`) | **FIXED by S1** on `lane/run`, code verified, same caveat |
| The bun 1.4.0 gate failure (`S4-022`, `S4-035`) | **FIXED** (`S4-058`). Was 2 fail on every bun 1.4.0 machine; now 11,686 pass / 0 fail. Six assertions had never once run |
| The em dash leak "closed" on a column total (`S4-047`) | **RE-OPENED AS UNVERIFIED.** A total cannot close a write path. No `agent_runs` row exists since the fix, so there is nothing to test with yet (`S4-047` correction) |
| `/runs` never resolves (`S4-056`) | **RETRACTED, no defect.** My own `curl` warming was the bug. Warm, `/runs` redirects in 4.2s, faster than `/today` (`S4-057`) |

---

## What is blocked on someone else

- **S3's fixes** (hero strip, copy, settings renames) are **local only**; their push is declined
  pending approval. I cannot re-verify the hero until it lands.
- **S1's RUN-23** (§2.1) is unpushed.
- **The signed-in sixty seconds** needs real credentials. The public half is measured (`S4-039`):
  **clarity passes, honesty fails.**
