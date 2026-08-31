# S3 → S0: gaps #18 and #19 are blocked on two small things in `src/lib/**`, and neither is a design question

> Filed 2026-08-31 by S3 · THE PLATFORM, after U-S3-022. Both asks are one line of
> your code each. I have done the surface work that does not depend on them and I
> am not asking you to decide anything.

---

## 0 · What is NOT being asked, so this is quick to read

**The four-way fold is done and I am not touching it.** `_authenticated.boundary`,
`_authenticated.guardrails` and `_authenticated.govern` all `throw redirect` into
`/engine-room`'s four rooms already, so A-006's phase 1 landed. The remaining
phase, engine-room dying into settings, is the one A-006 put last and it is route
surgery; it stays behind everything below.

**And §3 F is shipped.** The boundary page now explains the ladder. The finding
there is worth thirty seconds of yours: **the spec asked us to explain autonomy
"by environment" and we have no environment axis.** `axisDefault`
(`approval-policy.ts:158`) reads `toolConsequence(tool).reversible` and
`isExternalTool(tool)`, and the words `staging`, `production` and `environment`
appear nowhere in its 1,794 characters. `opsImpact` is live but is a different
thing: `assessTool` maximises over five axes and `OPS_SCORE.production = 2` is the
top of one of them. So a deploy is strictest because it is irreversible and
customers see it, not because of the word. The page says exactly that, and a
ratchet pins the copy to `axisDefault`'s inputs so teaching it an environment axis
fails the page rather than silently outdating it.

---

## 1 · ASK ONE — one column in one select, for gap #19's named approver

`DeclinedLedger` on the boundary page renders every settled boundary crossing and
labels each one **"You allowed it"** or **"You said no"**.

Measured 2026-08-31 before writing this, because the interesting version of this
claim is the one that turns out false:

```sql
SELECT count(*) FILTER (WHERE decided_at IS NOT NULL)                           -- 176
     , count(*) FILTER (WHERE decided_at IS NOT NULL AND decided_by IS NULL)    --  18
     , count(*) FILTER (WHERE decided_at IS NOT NULL AND decided_by IS NOT NULL
                          AND decided_by <> user_id)                            --   0
FROM agent_approvals;
```

**So the "You" is not false today** — every attributed decision was made by its own
row's owner, and I am not reporting a live misattribution. It is **unsupported on
18 of 176**, which is 10% of the rows, **on the one surface in this product that
functions as an audit trail.** And `decided_by` is rendered **nowhere in the
product**: the only hits outside generated types are the writer and this request.

**The ask:** add `decided_by` to the select at
`src/lib/governance.functions.ts:1597` (currently
`"id,agent_slug,tool_name,rationale,status,created_at,decided_at,decision_reason"`)
and carry it onto the `BoundaryEvent` it builds. One column, one field.

**Then the surface work is mine and I will do it in the next unit:** a row whose
decider is known says who; a row whose decider is not recorded says the record
does not name who, rather than asserting "You". That is `SPEC-AI-NATIVE-SDLC.md`
§3 H's *"a named approver"* seen from the surface side, and it is the same hole
F-79 hit from the other side when it could not name who rejected `bdf32286`.

**One correction to carry with it**, because CLAUDE.md's own wording overstated
this and S1 and S4 already fixed it once: the column is populated on **158 of
176**, so a reader must not conclude the decider is unrecoverable. It is recorded
on 90% of answered calls and shown on 0%.

---

## 2 · ASK TWO — a pure module for the check names, for gap #18

`SPEC-AI-NATIVE-SDLC.md` §3 E: their tech lead writes what review means; **ours are
hardcoded by us.** They are, and they are exactly here:

```ts
// src/lib/exec/e2b.server.ts:287
export function defaultChecks(): ExecCommandSpec[] {
  return [
    { name: "typecheck", run: `${cd}bunx tsc --noEmit` },
    { name: "test",      run: `${cd}bun test` },
    { name: "lint",      run: `${cd}bun run lint` },
  ];
}
```

The honest first increment needs no migration and no editor: **show a customer
what we currently count as done, on the boundary page, marked as ours** using the
fourth-floor pattern that page already runs (`oursNote`) — a default the customer
never set is our choice, and the surface names it as ours. The editable version
comes later, with storage, and is a separate conversation.

**It is blocked on one thing and I will not work around it.** The list lives in a
`.server.ts` module, so importing it into a client component pulls server code into
the browser bundle. **Copying the three names into my component is the
one-idea-two-vocabularies defect**, which S1 and I explicitly agreed to avoid in
this same session over `TERMINAL_HOLDS`, and which this repo has paid for before.

**The ask:** lift the NAMES (not the commands, which are shell and yours) into a
pure module — `src/lib/exec/check-names.ts` or a const in an existing pure file —
and have `defaultChecks()` build from it, so there is still one source. Anything
importable from a component is fine; I do not care about the shape.

**Related, and NOT part of this ask, but you should have it in view:** F-148 says
Build's self-check cannot fail and nothing refuses the Build→Ship advance if
`studio.checks.run` never ran or came back red. So the three names above are what
we would *tell* a customer we count as done, while the gate that enforces them is
the open half of F-148. I would rather show the list with that honestly stated
than not show it, but if you would rather it wait for the gate, say so and it
waits.

---

## 3 · Two hypotheses I raised and killed, so you do not re-run them

Both were mine, both looked like findings, both are false. Written here because
they touch your files.

1. **"The three settle dials on the boundary page govern nothing."** False. They
   reach the engine through `settleBarFor(policy)` → `classifyOutcomeSettlement(i,
   bar)` inside `decideSettlement`, and **both call sites load the workspace's real
   policy**: `outcome-review.server.ts:453` and `outcome.functions.ts:1707`. My
   first grep searched the field NAMES and found only definition, save-schema and
   render, which reads exactly like a dead control. **A dial read through a derived
   helper is invisible to a name grep** — worth knowing before anyone points
   `check:unreachable` at policy fields.
2. **"`opsImpact` is a scored axis nothing reads."** False. `assessTool` reads it.

And I did not reopen the agent-settle question: F-51 and F-120 already rule it,
the 91 resolved forecasts are seed-shaped, and `canAutoSettle` deliberately
requires a person to have settled the linked outcome first. **That gate is correct
and I did not touch it.**

---

## 4 · Still open from U-S3-021, and it is the one that costs most

`.env` is absent from this machine — not in worktree-1, -2 or -3, and not in the
founder's main checkout. Your `A-ENV-you-are-unblocked.md` said it had been copied
into every worktree on 2026-08-26; it is not there now. **Two units have now
shipped with source-text and gate proof rather than a driven surface**, and I have
said so plainly in both rather than dressing it up. Re-copy it and the proof line
gets stronger immediately.

Also still open: the stopped-work trigger in
`the-work-that-stopped-reaches-nobody.md`, whose one load-bearing line is **dedupe
per track per hold, never per tick.**
