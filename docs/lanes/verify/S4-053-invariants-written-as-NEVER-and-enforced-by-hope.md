# S4-053 · Invariants written as NEVER, enforced by asking

> _S4, 2026-08-27, code plus live database, read only. A generalisation of `S4-052`, sized honestly:
> one of these is serious and the other is small, and saying which is the point._

## The pattern

`registry.server.ts` states several invariants to the model in imperative capitals. Some are backed
by a code refusal. Some are not, and the ones that are not are enforced by the model choosing to
comply.

**Two unenforced ones, with their live violation rates measured:**

| invariant | enforcement | uses | violations |
| --- | --- | --- | --- |
| `learning.record`: *"If the evidence is not in yet, **DO NOT CALL THIS TOOL AT ALL**"* | prose only | **2** | **2** |
| `repo.read`: *"**NEVER** stage an edit to a file you have not read in this session"* | prose only | **30** | **1** |

```sql
WITH stages AS (SELECT trace_id, created_at FROM tool_calls
                WHERE tool_name='studio.stage' AND trace_id IS NOT NULL)
SELECT count(*) FROM stages s WHERE NOT EXISTS (
  SELECT 1 FROM tool_calls r WHERE r.tool_name='repo.read'
    AND r.trace_id = s.trace_id AND r.created_at < s.created_at);
```

**Stage without a prior read: 1 of 30. That is a 3.3% rate and I am not inflating it.** The
instruction mostly works. `repo.read` was called 81 times against 30 stages, so the agents are
generally reading first, and the description is doing its job.

**The `learning.record` one is different in kind, not degree**: 2 uses, 2 violations, and each
violation is a wrong verdict that re-ranks the bet behind it (`S4-052`).

## What is NOT unenforced, which is the control

The same file backs several invariants with real refusals, so this is not a house style:

- **Citing the product's own work as a source** is refused in code. Its description says so:
  *"the tool refuses those and the refusal is not a bug to work around."*
- **Staging a path outside the boundary** refuses (`studio.commit`'s F-63 floor).
- **Staging a change importing a dependency the manifest lacks** refuses, with a full sentence
  naming the missing packages.
- **Opening a PR against a rebound repository** refuses and explains which repo the work is on.

**So the codebase clearly knows how to turn a rule into a predicate. These two were left as
requests.**

## Why it matters at the bar the founder set

Claude Code, one of the five products named as the standard, enforces read-before-edit as a **hard
precondition**: the edit fails if the file was not read. It is not a line in a prompt. That is the
difference between an invariant and an intention, and it is exactly the comparison the frontier
question is for.

An enterprise reviewer asks what stops the bad thing. *"We ask the model not to"* is a real answer
about a model's reliability and not an answer about the system's.

## The fixes, both cheap, and sized to match

**1. `learning.record` (serious, do this one):** two comparisons, both against fields already on the
decision row. Refuse to grade before `forecast_horizon_date`; require the verdict to name
`forecast_how_we_will_know`. Detail in `S4-052`.

**2. `studio.stage` (small, do it when convenient):** track read paths per trace and refuse a stage
for a path absent from that set. The data to do it already exists, since `tool_calls` records both
calls with a shared `trace_id`, which is how I measured the violation.

## What I am not claiming

- **I did not sweep every tool description.** I searched for `NEVER`/`DO NOT`/`Never`/`Do not` in
  `registry.server.ts` and followed the two most checkable results. **There may be more; I did not
  look at the other five hits in depth.**
- **The 1-in-30 violation caused no observed harm.** I did not trace what that stage wrote or whether
  it clobbered anything. It is a rate, not an incident.
- `tool_calls.trace_id` groups reliably for this comparison because both sides are `tool_calls` rows.
  S0 previously found `trace_id` joins poorly to `agent_runs.id`; that limitation does not apply here.

## Verdict

**CONFIRMED as a pattern, with honest sizes.** One invariant violated on both of its two uses and
compounding into future guidance. One violated once in thirty and doing little harm. The shared
cause is that both are prose where a predicate was available, in a file that demonstrates elsewhere
that it knows the difference.

`src/lib/ai/**` is S0's. I have changed nothing.
