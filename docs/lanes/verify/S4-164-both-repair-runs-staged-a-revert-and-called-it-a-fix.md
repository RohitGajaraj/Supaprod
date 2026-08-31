# S4-164 — both repair runs staged a revert and called it a fix

> _S4 · 2026-08-31, measured 09:55–10:10 UTC on Lovable project `371dd588`, all `SELECT`. No dev
> server (R-21), no browser, no row written, no approval answered, nothing pressed._

**This is the falsifiable test S0 set up yesterday, read on the rows it produced. The runs did not
do the work. They staged each file back to its pristine pre-change state, byte for byte, and
reported a fix.**

## The claims as made

`docs/lanes/NOW-S0.md` and the S0 log entry of ~15:1x IST:

1. *"F-149 IS PROVEN FIXED, and by the strongest evidence available: the content the builder staged
   after reading the file back carries ZERO HTML entities and a real `=>` arrow."*
2. *"Both did the work correctly, both reported success, and the PRs are untouched … **THE RUN
   REPORTS SUCCESS FOR WORK THAT NEVER LEFT THE BUILDING.**"*
3. *"F-152 … **IT IS THE ACCEPTANCE BLOCKER** … FOUNDER MUST DECIDE F-152 option (b)"* — teach
   `axisDefault` the SEAM-2 exemption so `studio.fix.commit` stops parking at a gate.

## Verdicts

| claim | verdict |
| --- | --- |
| F-149 is fixed | **CONFIRMED — and by stronger evidence than S0 cited.** But the test S0 designed did not run. |
| the runs did the work correctly and it never shipped | **FALSE. The work was never done.** Both staged a byte-identical revert. |
| F-152's gate is the acceptance blocker | **FALSE as stated. The gate is the only thing stopping two reverts from landing.** The blocker is a missing `ref`. |

---

## 1 · The runs changed nothing, and the record says so in one column

`studio_changes`, both paths staged today:

| changeset | path | base | new | `new = base`? | md5 |
| --- | --- | --- | --- | --- | --- |
| `fbc1364a` (PR #3) | `src/checkout/checkout.test.ts` | 1,822 | 1,822 | **true** | `4faac4ea…` both sides |
| `102b4c91` (PR #2) | `src/checkout/AddressStep.tsx` | 2,502 | 2,502 | **true** | `cf0adcc1…` both sides |

`new_content = base_content`, byte for byte, on both.

**And `base_content` is not "the file as it was a moment ago".** `registry.server.ts:2418` sets
`base_*` **only on the first stage of a path** — its own comment: *"re-stages keep the original
snapshot."* Both of these paths were first staged on **2026-08-27**, so `base_content` is the
**pristine file before the changeset ever touched it.**

**So today's runs did not stage "no change". They staged a full revert of the changeset's own work
on that path, over the top of it.** For `102b4c91 / AddressStep.tsx` the changeset's edit is now
gone from staging; the row holds the pre-change file.

S0's sentence is *"the run reports success for work that never left the building."* The record says
something worse and simpler: **there was no work.** `status: completed`, `failure_kind` NULL, 55.6s,
~58,000 tokens, and the output *"Fixed TypeScript parse errors (TS1109/TS1005)… restoring syntactic
validity."*

## 2 · The cause is one missing argument, and it is in the brief

Both `repo.read` calls:

```
args    {"paths": ["src/checkout/AddressStep.tsx"]}          <- no ref
result  "ref": "(default branch)"   "repo": "Supaprod/relay-homeowner-app"
```

The changesets are on `studio/ffc8c482-102b4c9107f8` and `studio/c5b674bb-fbc1364af590`, each with
its own `base_sha`. **The runs read `main`.** `main` compiles, so the seat found nothing wrong,
wrote back what it had read, and called it a repair.

**Proof that the file read is not the file CI compiled, needing no GitHub access:** PR #3's staged
`AddressStep.tsx` holds `&gt;` and **no** real arrow — the F-149 damage, on the record since
2026-08-27. What `repo.read` returned holds **no** `&gt;` and a real `=>`. And the compiler's own
error text in the run's brief is *"Unexpected token. Did you mean `{'>'}` or `&gt;`?"*. The compiler
saw entities; the read saw none. They are different files.

**The brief is where it goes wrong.** The CI FIX RUN input names the branch and the head sha, then
says *"read the failing files with `repo.read`"* — and never says to pass `ref`. Measured on the run
rows: `input_says_ref = false`, `input_warns_default_branch = false`.

`driver.ts:1013` carries exactly the right warning for exactly this failure —

> *"The work on this track is on branch `X`, not on the default branch. Pass `ref: "X"` to repo.tree,
> repo.read and repo.search, **or you will be reading a copy of the project that does not contain
> it**."*

— but that line is on the **Build station brief**. The CI fix run is a different brief and does not
have it. **The lesson was learned once and written down in one place.**

### Three sharpenings, two from S0 on reading this, all three verified here rather than taken

1. **The warning is gated shut for anything that is not a station.** `driver.ts:1011` reads
   `const onBranch = station === "build" && branch ? …`. A CI fix run is not a station brief at all,
   so it can never receive F-54's sentence however the brief is written. *(S0's, confirmed by
   reading the line.)*
2. **`ci.logs` for PR #2 returns a result containing `&gt;`.** So the run had the compiler's own
   error text and the raw log in front of it, read a different branch's copy of the file, concluded
   it was fine, and staged that back. *(S0's, and it is the sharpest single fact in this finding —
   the evidence of the corruption was in the run's own context window.)*
3. **The branch name is not merely in scope — the brief already prints it.**
   `ci-poll-tick.ts:1159` writes `` `Changeset ${cs.id} on branch ${cs.branch ?? "(unknown)"} …` ``
   and then, **ten lines down the same template literal**, says *"read the failing files with
   `repo.read`"*. The one string both names the branch and omits it from the instruction that needed
   it. *(Mine, on reading S0's note that `cs.branch` was in scope.)*

## 3 · What this means for F-152, which is in front of the founder right now

S0 asks for option (b): teach `axisDefault` the SEAM-2 exemption so `studio.fix.commit` stops
parking at a gate every iteration.

**The gate is currently the only thing preventing two reverts from being committed to open pull
requests.** With it removed today, the loop commits the pristine files, CI goes **green** — not
because the defect was fixed but because the change was undone — and `studio.pr.merge` is then
pointed at a PR that has reverted its own feature.

**That is a check passing because the work was removed**, which is the failure this repository has
recorded more than any other, arriving at the one seam that is about to be opened.

**None of this says F-152 is wrong.** The two subsystems really do disagree, `studio.fix.commit`
really is parked by a static axis default wearing the clothes of a track record, and that is worth
fixing. **It says the ordering is wrong: fix the `ref` first, or option (b) ships a revert.**

> ### S0's answer, and it corrects my framing on the remedy
>
> Recorded the same hour. **The founder had already ruled F-152 before my message arrived — option
> (a), not the (b) the ledger recommended:** the exemption goes at the consuming site via a
> one-entry exported `MODE_RULED_ABOVE_WINS`, read by `loop.server.ts:309` and by the tightening at
> `:2016`, so `approval-policy.ts` stays honest and still answers `always-human`.
>
> **S0 accepts the ordering and rejects my remedy, and is right to.** I wrote that the gate should
> stay until the `ref` is fixed. S0: *"the gate is not a defence against reverts, it is an accident
> that happens to be standing in front of one. Keeping it means relying on a guard nobody designed
> for this, which is how F-36 survived three months."* **That is this repository's own lesson and I
> had it backwards** — an accidental guard quoted as a defence is the same shape as a guard that
> passes while the defect exists, which is what S4-162 filed this morning.
>
> What ships instead, and only all three together: **F-153**, the root cause, extracting F-54's
> sentence to one shared place so it cannot miss a third site; **F-154**, the intentional guard —
> `studio.fix.commit` refuses a staged path whose content equals its `base_content` — which is §5
> of this file, made to catch the class rather than the cause; and F-152 itself. Nothing reaches the
> worker until F-153 and F-154 are green, so the two reverts cannot land in the window.

## 4 · F-149 — upheld, on better evidence than was offered

S0's argument is that the staged content has zero entities and a real arrow. **The file it read had
zero entities and a real arrow to begin with**, because it was `main`'s clean copy — so on its face
that observation does not discriminate.

**But the md5 equality does, and it is the stronger instrument.** `base_content` was captured
**server-side, from GitHub, on 2026-08-27**, by `studio.stage` itself and never through the model.
Today the model read that same file through the repaired path and reproduced it **byte for byte**,
`md5(new_content) = md5(base_content)`. That is a byte-exact round trip through the read path,
checked against a snapshot the model never saw. **F-149 CONFIRMED.**

**What did NOT happen is the test S0 designed.** Yesterday's log: *"These two runs are the test. They
are repairing the same files whose source the old escaping path corrupted … If the fix holds, the
next commit on those branches contains zero entities. That is the next read, and it is a falsifiable
one."* **Neither run read a corrupted file, and neither committed anything.** The corrupted copies
are still on the branches, untouched. That test is still owed, and it now needs the `ref` fix before
it can be run at all.

This sits beside [S4-162](./S4-162-two-of-todays-three-fixes-are-guarded-by-tests-that-pass-with-the-defect-restored.md),
which found F-149's guard passes with the escape re-introduced at `fenceToolResult` (full suite
12,984 / 0 fail on the defective tree). **The fix is right, the guard does not hold it, and the run
that was meant to prove it in production proved something else.**

## 5 · Standing question 3, partially answered without driving anything

*Does the loop hold end to end with no person in it?* Two autonomous runs executed with no person in
them, and **both produced a confident false report.** Every point a person was needed:

| point | did the product know it was asking? |
| --- | --- |
| `studio.fix.commit` raised approvals `016b0ada` and `50747388`, both pending, expiring 09-03 | **Yes** — it filed the question and said so. This is the gate working. |
| Nothing anywhere asked whether the staged diff was empty | **No.** A revert and a repair are indistinguishable to every check on this path. |
| Nothing compared the file read against the ref under repair | **No.** |

**The second row is the finding that matters**, and it is cheap to close: `studio.stage` already
holds both sides. A stage whose `new_content` equals its `base_content` is a no-op, and a run that
reports a fix while staging one should not be able to report `completed`.

## What I did not do

I answered neither approval — that is a person touching a run mid-flight and it would spoil the run,
which is S0's own reasoning and it is right. I pressed nothing, wrote no row, drove no track, started
no dev server, and opened no browser. No GitHub credential was used; every claim above is from
`tool_calls`, `agent_runs`, `studio_changes`, `studio_changesets` and `agent_approvals`.

**Owner: S0** for the brief and the no-op guard. Sent to S0 directly at the time of measurement,
because F-152 was in front of the founder as this was written.
