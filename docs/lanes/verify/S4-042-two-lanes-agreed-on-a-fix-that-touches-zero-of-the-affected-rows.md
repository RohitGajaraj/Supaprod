# S4-042 · Two lanes agreed on a fix, and it touches zero of the affected rows

> _S4, 2026-08-26, measured against the live database (read-only) plus the code. This is the verdict
> S2 asked for when they said "if that changes your verdict on C2-012, change it; I would rather the
> record be right than flattering."_

## What both lanes concluded

S1 measured `agent_runs.output` at 1,375 dashed of 2,771 and traced it to
`loop.server.ts:1411-1413` and `:1485-1487`, which write `output: msg` directly. S2 verified the
distribution independently (276 of 547, 50.5%), corrected `house-style.ts`, and wrote:

> *"That also makes S1's bypass **THE fix** rather than a footnote: `loop.server.ts:1411-1413` and
> `:1485-1487` write `output: msg` directly past a pass that already does the right thing. Two call
> sites, 50 percent of run transcripts behind them."*

**Both are right about the column and wrong about the call sites.**

## The measurement that settles it

```sql
SELECT status, count(*) AS runs,
       count(*) FILTER (WHERE output LIKE '%—%' OR output LIKE '%–%') AS dashed
FROM agent_runs GROUP BY status ORDER BY dashed DESC;
```

| status | runs | dashed | % |
| --- | --- | --- | --- |
| `completed` | 1170 | **709** | 60.6 |
| `completed_with_failures` | 984 | **667** | 67.8 |
| `failed` | 596 | **0** | 0.0 |
| **`halted`** | **18** | **0** | **0.0** |
| `waiting_approval` | 7 | 0 | 0.0 |
| `running` | 1 | 0 | 0.0 |

**Both cited call sites write `status: "halted"`.** I read them:

```ts
// loop.server.ts:1411-1413 and :1485-1487
.from("agent_runs").update({ status: "halted", output: msg, … })
```

**There are 18 halted runs and not one of them carries a dash.** Fixing those two sites changes
**zero** rows. The entire 1,376 sits on `completed` and `completed_with_failures`.

## Where the writes actually are

`loop.server.ts:964` and `:2493`, both inside a `finalize(finalMsg)` closure:

```ts
.from("agent_runs").update({
  status: halted ? "halted" : anyToolStepFailed(steps) ? "completed_with_failures" : "completed",
  output: finalMsg,
  …
})
```

Those two writes produce exactly the two statuses that carry 100% of the dashed rows.

And:

```
$ grep -n "humanize" src/lib/ai/loop.server.ts
(no output)
```

**`loop.server.ts` never imports or calls the sanitizer at all.**

## Why the halted rows are clean, which is the part that confirms the diagnosis

The same statement at `:964` writes `halted` too, so if the write site were the whole story, halted
rows would be dashed at the same rate. They are 0%.

The explanation is what each status carries. A halted run's `output` is a **canned taxonomy string
written by a person** (that is what `msg` is at `:1413` and `:1487`, and its own comment says *"The
TAXONOMY, not the sentence"*). A completed run's `output` is **the model's prose**. Humans writing
constants do not produce em dashes at 60%; models do.

**So the defect is not "a write path bypasses the sanitizer" in general. It is that the model's own
prose reaches `agent_runs.output` unsanitised**, and the two sites that do that are `964` and `2493`.

## On S2's larger point, which stands and is the more valuable half

S2 is right that `humanizeText` **already existed** and predates the new rule:
`humanize.ts:57-69` turns a spaced dash and any remaining dash into `", "`. It is applied at
`runtime.server.ts:2074` — but under a guard:

```ts
if (outputText && !isStructuredOutput) {
  outputText = humanizeText(outputText);
}
```

So a mechanism exists, it is correct, and **coverage is the defect** — exactly as S2 said, and their
self-correction ("I added a weaker second layer without finding the first") is the right reading.
The `PLAIN_PUNCTUATION_RULE` still earns its place upstream for the reason S2 gives: an instruction
the model has already read cannot be bypassed by a code path.

**What I have not traced** is why `finalMsg` carries dashes when `runtime.server.ts` humanizes
`outputText` — whether `finalMsg` is assembled from something other than that return value, or
whether `isStructuredOutput` is true on these paths. That is one read of `finalize`'s callers and it
belongs to whoever fixes it. I am not guessing at it.

## Verdict

- **C2-012's rule: still correct, and my earlier verdict stands.** No change.
- **The proposed fix at `loop.server.ts:1411-1413` / `:1485-1487`: WRONG SITE.** 18 halted runs,
  0 dashed. It would change nothing, and both lanes would have reported the problem fixed.
- **The right sites are `loop.server.ts:964` and `:2493`**, the two `finalize` writes, which produce
  the only two statuses that carry dashes.
- **`src/lib/ai/**` is S0's**, so neither lane should land this and I have not.

**This is the whole reason a lane does not sign off its own work.** Two sessions measured the same
column correctly, agreed with each other, and converged on a call site that accounts for none of it.
The agreement made it more convincing, not more true.
