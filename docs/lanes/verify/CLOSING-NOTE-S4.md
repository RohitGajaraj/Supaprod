# Closing note · S4 · THE PROVING GROUND · 2026-09-01

> _Created: 2026-09-01 · Last updated: 2026-09-01_

**Branch `lane/proof` · 0 behind `origin/main` · 14 ahead · no migrations (this
lane owns `e2e/**` and `docs/lanes/verify/**` and writes no product code and no
schema).**

> **WHERE THE REASONING IS.** Everything below is a summary. The arguments,
> measurements and mutations live in **`docs/lanes/verify/S4-*.md` on
> `lane/proof`**, and **main cannot see them until this lane is merged.** If
> tomorrow asks *why* a decision was made, those files are the sharpest answer
> anyone has, and they are the reason the merge matters beyond the code.

---

## DONE

**The unreachable gate went from a number to a name, and then got honest twice.**

- **S4-185** — `check:unreachable` fired on its own and reported only *"140 → 142"*.
  It now **names the newcomer**. The baseline freezes sorted `file::name` beside
  the counts, and the names were **measured, not trimmed**: the detector *of the
  baseline commit* ran against the tree *of that commit* and returned 140/44
  exactly. Mutation-proven both ways.
- **S4-188** — S1 traced two rows and found both reachable by a person opening
  `/ship`. The component half was asking *"does another **file** import this"* —
  right for a server function, wrong for a component reached through its parent.
  **17 of 45 rows were in that class.** They are now printed separately and not
  counted; **components 44 → 27 at the same commit**, measured the same way, with
  server functions held at 140 there as the control.
  **The tool had warned about this in prose since it was written and counted them
  anyway** — this file's own `React.lazy` lesson unlearned one section later, by
  me.
- **A note is not an excuse** — the baseline now takes `notes` keyed by name,
  printed beside a row, changing nothing about the count. Added because S2 asked
  for `getLineageCounts` to be marked *staged ahead of a surface* so a later lane
  would not read it as dead weight.
- **The instrument is versioned, and a delta across versions is refused.** S2
  compared components **80 to 69** and reported an improvement nobody had earned;
  the rule had changed twice between those numbers and neither change was a
  deletion. S2 named the fix better than my note did — *a note explains a number;
  not printing a misleading one is better than explaining it afterwards.*
  `INSTRUMENT` is now stamped into the baseline, **printed beside the count** so a
  number quoted elsewhere carries its instrument, and **checked before any delta
  is reported**. A *rise* still fires on a mismatch, because a rise may be real
  and failing loudly is the safe direction; **IMPROVED and Holding do not fire at
  all**, because both read as good news and neither can be true across a rule
  change. Mutation-proven three ways.

**What the gate then found, and all of it was acted on by other lanes:**
`getSubjectEvidence` (S0's F-184 door, landed with no importer — **now mounted by
S1, 142 → 141**), `getLineageCounts` (S0 built it because S2 asked; still
unwired), and two icons orphaned by the fold.

**Findings handed over, each measured before it was sent:**

- **S4-186** — the sweep neglects nothing. I nearly filed *"64 tracks abandoned"*;
  21 abandoned + 7 sample + 36 terminal accounts for every one. **Of ~100 held
  tracks exactly two are open, non-sample and drivable.**
- **S4-187** — `script-src` grants `unpkg.com` and `cdn.jsdelivr.net` and nothing
  the browser loads references either, while the same directive carries
  `'unsafe-inline'`. `generateNonce()` has zero callers and
  `withSecurityHeaders(response, nonce?)` accepts a nonce it never reads.
- **S4-189 / S4-190** — `ce846e9b`, the closest this product has come to the
  acceptance, refuses at Build because it has the **wrong repository**
  (`product_id` and `project_id` both NULL). **All four exports of
  `connectors/product-binding.functions.ts` are orphaned**, and `listProducts`
  names `ProductBindingsSection` in its own comment — a component that exists,
  is live on `/sync`, and calls **a rival implementation** at
  `connections.functions.ts:837`.
- **Demo approval queues expire 2026-09-25** and SkyDeck runs 09-08 to 10-05.

---

## PENDING

- **RESOLVED, and it changes two items below: `lane/proof` MERGED** (`4a311b936`).
  Main now carries the v3 baseline (`140 / 26`) and the versioned detector.
  **The merge-order hold on `e2e/unreachable-baseline.json` is LIFTED** — main
  and the detector are one instrument again, so editing it there is safe and an
  `IMPROVED` line on main is now bankable. Told S1, S2, S3 and S0.
  **11 commits remain unmerged**, all `docs/lanes/verify/**` and `e2e/**`.
- **MERGE-ORDER HAZARD: nobody may touch `e2e/unreachable-baseline.json` on main
  until this lane merges.** Main holds the **v1** gate — `141 / 80`, no names, no
  instrument stamp — and **none of tonight's four changes to that detector are on
  main.** This lane's baseline is **v3: `140 / 27`**. Those are not the same
  measurement: v3 counts 27 where v1 counts 80 because 26 rows were `React.lazy`
  mounts the old detector could not see and 17 are exports rendered inside their
  own file. **Nothing was deleted.** Merging `lane/proof` is safe, because
  detector and baseline land in one commit. Any *other* edit to that JSON on main
  first is not: git would resolve a conflict between two numbers that mean
  different things by line position, producing a baseline no instrument produced.
- **The wording of a check is part of what it does, and it caught me twice.**
  The component half warned in prose about a class it went on to count
  (S4-188). The `IMPROVED` line said *"Lower the numbers in
  e2e/unreachable-baseline.json"* — a directive the script has no standing to
  issue, since it cannot tell wiring from deletion, cannot see a change queued
  on another branch, and cannot know the instrument is about to change under it.
  S3 read it and moved to bank an unbankable number. **Their sentence is the
  fix**: *a gate that asks for a value to be frozen is asking you to make a
  judgement, not to obey.* Both reworded.
- **An `IMPROVED` line nobody can bank becomes standing noise** (S3). Tonight's
  improvements are unbankable until this merges, and a check people learn to
  scroll past is worse than no check. **No fix tonight**; recorded as open.
- **`check:unreachable` is RED at 141 server functions and must stay red.** Its
  single newcomer is **`getLineageCounts`**, whose wiring S2 landed on
  `lane/control`, **not on main**. Banking a fix that has not merged is the same
  error as banking a deletion that has not merged, and I told two lanes not to do
  it tonight. Raising the baseline remains the one fix it forbids.
- **DONE, and the plausible story was the wrong one.** S2's icon deletion reached
  main and components fell 27 → 26 — but **the one that left is `AskInPlace`**,
  S3's 176-line zero-mount component, now wired. The icons were **never in this
  baseline's names**: it was measured at `cda1276fa` before they became orphans,
  so their deletion nets to zero here. **Banked on the reason, not the number**,
  which is the judgement my own reworded `IMPROVED` line asks for — made on the
  first occasion it applied to me, and the obvious story was wrong.
- **ANSWERED — standing question 4, for the first time**, by S3 driving `harbor@`
  on my behalf: **979 ms warm, in-app, to a readable count**, zero clicks to see
  it and one to act. Cold **9.3 s is an upper bound only** and includes Vite's
  first compile. Both numbers flatter — localhost, warm server, hot cache.
- **NEW: `/start` shows four numbers for one question and no two are equal**
  (S4-192) — All 65, Waiting on you 93, Gates 16, `agent_approvals` 77. They count
  **four different populations** across a fifteen-table union and nothing on
  screen says which. **The instruction I gave S3 was wrong**: I named one table as
  if it were the population.
- **NEW: `$0.83 spent on runs` against 23,218 credits debited** this cycle.
  Different units, possibly different windows, and **nobody can convert one to the
  other from the screens** while both claim to say what this has cost.
- **S4-Q1** parked with its measurement: the trailer ratchet is a false-positive
  machine (914 commits without vs 766 with).
- **The `e2e/golden/` set is still empty** — four admission tests, no cases.

---

## OBSERVATIONS

**The loop is better than I said, and stuck for a reason no station can fix.**

At 21:10, after three refusals at Build, the loop **sent `ce846e9b` back to Define
and reset attempts to 0, unattended.** Six transitions, every one
`actor='system'` `driven_via='sweep'`, zero presses, zero answered approvals. I
had published *"one tick from `given-up`"* and the next tick falsified it; the
correction went to S0 within two minutes.

**That self-correction is stronger evidence for R-18 than a clean walk would be.**
A clean walk shows the loop goes forwards. This shows it notices it is stuck.

**And it corrected the wrong thing.** The binding is still NULL, so Define will
re-spec, Design will re-design, and Build will meet the same sixteen checkout
files. **A re-plan cannot reach a binding fault, because nothing in the spec is
wrong.** The ceiling moved from `given-up` to `going-in-circles`.

**The Build seat is not failing. It is being punished for being right.** It read
the tree, searched four relevant terms, found nothing, and named the repository
where the work belongs — three times, identically, because nothing changed
between attempts. R-26 says a refused station is not a failed station and forbids
retry theatre. This is retry theatre by that ruling's own definition.

**Throughput, measured:** `track-tick` is `cron.job` 68, `*/10`, with
`TICK_DEADLINE_MS = 45_000`. The platform's entire station-advancing capacity is
**45 seconds in every 600 — a 7.5% duty cycle** — sequential by design, capped at
five tracks. Not a defect at two live tracks; **a ceiling that scales with tracks
rather than with workspaces.**

**One fix re-verified on live data rather than on its original measurement.** At
20:50 the tick served one track and skipped three. I predicted the 2026-08-23
round-robin change would repay it, because an unserved track is no longer
stamped and keeps its older key. **At 21:00 all four were served.**

**And I made the instrument error myself, one level up.** I told S2 they were
comparing across an instrument boundary from a stale checkout. **They were not —
main is the old instrument**, and I had read their number against *this branch's*
definition without checking which definition their tree held. That is a number
read without its instrument, landing the way that flattered my account of it,
which is the exact error I was attributing to them. Corrected to both S2 and S3
within minutes, and it is the strongest argument for the versioning that the
versioning itself would not have caught.

**The best rule of the night is S2's and it is aimed at exactly this pair of
lanes.** *Verify a correction the same way you would verify a claim, especially
when it is about your own work and especially when agreeing costs nothing.* They
wrote it after accepting one of my corrections without running the two commands
that would have settled it. **Between lanes trying hard to be honest the failure
mode is not stubbornness — it is conceding too fast, and the record ending up
wrong in the humble direction.**

It lands on me from the other end. **I told S2 they were on a stale checkout
before I ran `git show origin/main:e2e/unreachable-baseline.json`** — one
command, which I ran only after S3 reported the same number and made me doubt my
own account. I published a diagnosis and then checked it.

**And the discipline that mattered most tonight was checking my own alarms.** Six
times a finding died on the query that would have published it — most sharply
when a gate I had written vouched for an origin using **the security remediation
log that records a past finding about that origin.** I deleted that gate rather
than ship it.

---

## THE LAST THING FOUND, AND IT IS THE MOST IMPORTANT ONE

**The acceptance query's F-79 clause reaches one answered approval of 176**
(S4-193). Of 176 answered boundary calls: **68 carry no `mission_id` at all**, 70
have no `agent_runs` row, 106 join to a run whose `track_id` is NULL, **one is
reachable**, and it can exclude **one track of 111** — the row it was written for.
F-112's press clause, by contrast, excludes 19.

It changes nothing today (the query returns 0 either way) and it may not even be
wrong. **What is certainly true is that nobody knew the reach was 1**, and it
reads as though it screens all 176. **The first time a track walks seven stations,
that clause is what must prove no person touched it.**

**And it was found by chasing a number neither of us could reproduce.** S3 and I
disagreed about `agent_approvals` on one workspace — their 77, my 9 — and *none*
of my scopings yields 77; their own join returns 7 in my hands. The disagreement
was not the finding. **It was the instrument that produced one**, and I would not
have looked at that join tonight for any other reason.

## NEXT

1. **Merge `lane/proof`.** 83 commits of verdicts that main cannot see.
2. **Bind `ce846e9b` to a repository, or hold it for a person.** It is the only
   candidate that has ever walked five stations unattended, and it is now
   circling. The fix is a binding, not a re-plan.
3. **Rule on `product-binding.functions.ts`** — half-live, four orphaned exports
   duplicating a wired implementation. Merge, not delete; which survives is a
   product call.
4. **Delete `unpkg.com` and `cdn.jsdelivr.net` from `script-src`**, and either
   wire the nonce or drop the parameter that pretends it is wired.
5. **Re-arm the demo queues before 2026-09-25**, and prefer a mechanism to a
   calendar reminder in a doc.
6. **Lower the component baseline once S2's icon deletion reaches main** — and
   not before.
7. **Answer the sixty seconds signed in**, which needs a person to sign in.
