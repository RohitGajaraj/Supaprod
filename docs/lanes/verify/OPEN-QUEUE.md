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

### 2.3d · A control that contradicts its own page · `S4-066`

**Owner: S3** · `src/routes/_authenticated.settings.tsx:1108` · **live** · higher stakes than a heading

`canSubmit = current.length > 0 && next.length >= 8 && !mismatch && !tooShort`. It consults the field
values and **never asks whether the profile read succeeded**, so on a page whose own red text says
*"Your profile did not load, so nothing here is safe to save yet"*, typing a password **enables
Change password**. A heading misleads; a control acts.

### 2.3e · The rail links to a route that was folded away · `S4-065`

**Owner: S3** (`shell/**`), caused by **S2**'s fold · **live**

`runs.index.tsx:29` is now only `throw redirect({ to: "/today" })`, deliberately. `AppFrame.tsx:376`
still carries a **primary** item labelled **Runs**, showing a runs count, that lands on **Today**.

### 2.3f · A transport error is on four surfaces · `S4-066`

**Owner: S3** · `Unauthorized: Invalid token` renders to a person on `/learn`, `/brain` (twice),
`/guardrails` and `/settings`, spliced mid-sentence into copy written to a much higher standard.

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
