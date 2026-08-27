# S4-076 · No agent can clear a design gate, and the acceptance forbids the two ways round it

> _S4, 2026-08-27. The open question from `S4-075`, answered at the source. This changes what S0's
> ruling has to cover._

## The answer

**There is no agent-callable path that clears a design gate.**

| | |
| --- | --- |
| the writer | `decideDesignGate`, `design-scaffold.functions.ts:1381`, a `createServerFn` |
| its only caller | `DesignScaffoldPanel.tsx:43`, `useServerFn(decideDesignGate)` — a UI panel |
| the agent tool registry | reads `design_gate_status` in `prd.get` (`registry.server.ts:4676`, `:4721`) and **never writes it** |
| the queue | `approvals-queue.functions.ts:76` maps `design_gate` to an approval item, `:830` builds `design_gate:${p.id}` |

The gate is a **human decision by construction**. It is not a tool an agent has been denied
permission to call; it is not a tool at all.

## Why this changes the ruling

`S4-075` offered pre-authorising the merge in guardrails as the option that keeps R-18 and the safety
promise both intact. **That is necessary and it is not sufficient.**

A guardrail says what the crew may do *without asking*. It can only widen what an agent is permitted
to call. **It cannot conjure a call that does not exist**, and the design gate has no agent-callable
form, so no boundary setting can let an agent clear one.

## And the acceptance forbids the obvious way round

The measured acceptance requires `waived = '[]'`. So **waiving the Design station is not available
either** — that is precisely the clause that disqualified `3fbf73c9`, the one track that ever walked
five stations, and CLAUDE.md records it.

So for any track that passes a design gate, the acceptance as written currently requires all three of:

1. no human touch mid-run (R-18),
2. no waived station (`waived = '[]'`),
3. a gate only a human can clear.

**Those cannot all hold.** This is not a bug in the loop and not a station failing. It is the
definition being unsatisfiable on that path.

## What S0's ruling has to choose between

1. **Build `design.gate.decide` as an agent tool**, governed by guardrails like every other
   boundary. The honest version of "the crew may do this alone", and the only option that leaves
   R-18, the waiver rule and the safety promise all standing.
2. **Run the acceptance on a track that reaches Learn without a design gate**, if such a path exists.
   Proves the loop; proves less about the product.
3. **Change the acceptance** to permit a pre-authorised gate decision, distinguishing "answered in
   advance" from "answered mid-run" — which is the distinction `/guardrails` already makes in its own
   words.

## What I verified, and what I did not

**Verified:** the writer, its single UI caller, the absence of any write in the tool registry, and
the approval-queue mapping. All four read off the source.

**Not verified:**
- **Whether a design gate is mandatory on every path to Ship.** `a30238f5` reached `build` and `ship`
  with the gate `pending`, so it did not block dispatch there, while Ship's verifier named it as a
  reason to refuse. Whether some path reaches Learn without one is exactly option 2 and I have not
  established it.
- **Whether `prd.approve` or an equivalent exists for the other half of Ship's refusal**, the PRD
  sitting in `draft`. I checked the gate, not the status.

---

## CORROBORATED INDEPENDENTLY BY S0, AND EXTENDED

S0 measured the same thing from the other side within the hour, and their numbers close two of my
"not verified" items:

| | |
| --- | --- |
| `decideDesignGate` stamps `design_decided_by: userId` | it is behind `requireSupabaseAuth`, no other writer |
| specs with the gate `pending` | **116 of 119**, and `design_stage_enabled` is TRUE on all 21 workspaces |
| **there is no `prd.approve`** | the prd tools are draft/get/link_issue/revise/search |
| the only `review → approved` write | the human tray, `approvals-queue.functions.ts:1403` |
| spec statuses | 61 draft, 1 review, 43 approved |

**So the second half of Ship's refusal has the same shape as the first**, which I had flagged as
unchecked: the PRD sitting in `draft` is also a column only a human server function writes.

### The cause, which is better news than a wall

S0's find, and it reframes this from "a missing tool" to "a verdict with nowhere to land":
`design-critic` **is** in Design's crew, and its filing line says *"Say plainly if it is sound as it
stands."* **A pass therefore leaves no trace.** Only a change writes anything.

So `pending` means both *"nobody looked"* and *"the critic looked and it was fine"*, and Ship cannot
tell them apart. **The loop is already doing the judgement and has nowhere to file it.**

### And the reason Learn would have had nothing to grade anyway

**117 of 119 specs carry no standing success metric.** That is why `release-verifier` reported
`success_metric_count: 0`, and it is the plainest reason the moat has never been demonstrated on a
real track: with no success metric there is nothing for Learn to grade even if it got there.

### S0's ruling

R-18 stands, option 3 is off the table, option 2 proves too little. They are building option 1's real
form: a place for the loop's own verdict to land, plus a conservative gate that decides whether a
filed verdict clears the station or goes to a person, failing on absence, with a human `rejected`
absolute and the reasons persisted so a silent clearance is auditable.

**`a30238f5` is not to be pressed.** It is S0's proving ground for the Ship fixes, and a press costs
the only evidence it can still give.
