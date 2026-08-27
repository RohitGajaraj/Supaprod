# S4-075 · Ship refused correctly, and that is where the acceptance actually stands or falls

> _S4, 2026-08-27 ~02:45 UTC, measured live. The best track the product has ever produced stopped one
> station short, and it stopped for a good reason._

## Where `a30238f5` is

| | |
| --- | --- |
| entry / current station | `sense` → **`ship`** |
| `waived` | `[]` |
| members filed | 13 |
| decided approvals | **0** |
| presses | 7, **all at `sense`, all before 22:27**, `presses_since_fix = 0` |
| `last_hold` | **`given-up`** |

`given-up` is a `TERMINAL_HOLD`, so **the sweep will not touch it again**. It is parked one station
from `learn`, and the only exit is a human press, which would make it 8.

## Why Ship gave up, in its own words

```
release-verifier  "This change is not ready to ship. The PRD ... is still in 'draft' status
                   with 'pending' design gate clearance"
release           "The address reuse changeset (102b4c91…) has not been merged into the
                   codebase yet ... release.publish cannot be executed - it requires a merge"
```

**Both refusals are correct.** Neither is a bug, and neither should be softened. A Ship station that
published an unmerged changeset against a draft PRD would be exactly the theatre this whole lane
exists to catch.

## The structural problem, stated plainly

**R-18 requires no human touching the work mid-run. The product promises that a merge can never skip
your approval.** For any track whose Build produces a pull request, those two are in direct conflict:

- Ship cannot complete until the changeset is merged.
- The merge cannot happen without approval.
- An approval given during the run is a human touching it mid-run.

So on a code-producing track, **the acceptance as currently defined cannot be met by waiting.** It is
not a matter of the loop getting better. It is arithmetic.

## The resolution already exists in the product, and it is on a surface I photographed

`/guardrails`, the room called **"What is it allowed to do?"**, carries:

> **"What your crew may do alone."** *"Set once, in advance. Moving one never interrupts work that is
> already running."*

**That sentence is the answer.** A boundary set BEFORE the run is not a mid-run human touch, and the
product says so itself. To satisfy R-18 on a track that ships code, the merge must be covered by a
standing boundary agreed in advance, not by an approval answered while the run is in flight.

**This needs a ruling, not a fix**, and it is S0's. The three options are:
1. **Pre-authorise the merge in guardrails** before the acceptance run. R-18 holds; the product's
   safety promise holds; nothing is weakened.
2. **Run the acceptance on a track that ships no code**, where Ship needs no merge. Cheaper, and it
   proves less.
3. **Change R-18.** Do not.

## The second blocker, which is separate and also needs an owner

The PRD is `draft` with the design gate `pending`. If clearing either requires a person, it is the
same conflict one station earlier, and pre-authorisation has to cover it too. **I did not establish
whether an agent can clear a design gate**, and that determines whether option 1 is sufficient or
only necessary.

## What I am not claiming

- **I did not check whether a standing guardrail for merge exists today**, only that the surface for
  it exists and states the principle.
- **The forecast on this track is due 2026-10-15**, so even a completed Learn could not grade it
  tonight. `S4-063` is the reason that matters.
