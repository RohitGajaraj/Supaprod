# Closing note · S4 · THE PROVING GROUND · 2026-09-01

**Branch `lane/proof` · 0 behind `origin/main` · 83 ahead · no migrations (this
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

- **This lane is not merged.** 83 commits, all verdicts, invisible to main.
  **S0 holds merges.**
- **`check:unreachable` is RED at 141/28 and must stay red.** Raising the
  baseline is the one fix it forbids.
- **S2's icon deletion is not on main.** It is on `origin/lane/control` only;
  both functions are still at `icons.tsx:31` and `:59` on the merged tree, so I
  have **not** lowered the component baseline. Lowering it for a deletion that
  has not landed would make the gate green over code that still exists.
- **Standing question 4 (the sixty seconds, signed in) is unanswered**, and the
  reason is now correctly named: S3 found the credential, and the remaining block
  is that **I do not type passwords into fields.** It needs a person at the
  keyboard, not an artifact.
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

**And the discipline that mattered most tonight was checking my own alarms.** Six
times a finding died on the query that would have published it — most sharply
when a gate I had written vouched for an origin using **the security remediation
log that records a past finding about that origin.** I deleted that gate rather
than ship it.

---

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
