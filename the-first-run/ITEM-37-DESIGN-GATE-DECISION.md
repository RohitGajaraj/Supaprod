# Item 37: Design Gate Decision

**BUILD-QUEUE item 37 (M, P1)**  
**Status:** Awaiting founder approval  
**Related:** F-29 (Ledger)  

---

## The Problem

**Current situation:**
- Design station writes `prototypes` (19 rows live in harbor workspace)
- `designGateBlocksDispatch` reads `prd_scaffolds` (8 rows live)
- Gate verdict: `prd_scaffolds` → false for EVERY spine-produced spec
- Tool description says: "a drawing that exists needs human approval before Build"
- **Reality:** autonomous runs bypass this check entirely because the gate sees nothing

**The defect:** 
Either the gate should see what Design actually produces, or the tool description is dishonest.

---

## The Two Paths

### Path A: Widen the Gate (Read Prototypes)

**Change:** `designGateBlocksDispatch` reads BOTH `prd_scaffolds` (human-created designs) AND `prototypes` (agent-created designs)

**Consequence:** 
- ✅ Tool description becomes true again
- ✅ Autonomous runs WILL be held at Build if agent produces a prototype
- ❌ Human must approve every agent design before Build can start
- ❌ Turns Build into a chokepoint (every unattended run stops there for approval)

**Cost:** ~5-10 minutes per track for human review of design output

**Who decides:** Founder (governance decision: is agent design output trustworthy enough to skip human review?)

### Path B: Fix the Tool Description (Keep Gate as-is)

**Change:** Tool description updated to say: "Agent-produced designs (prototypes) are staged directly; human designs (scaffolds) require approval."

**Consequence:**
- ✅ Description matches reality
- ✅ Autonomous runs flow uninterrupted through Design
- ❌ Human never sees agent-produced design output before Build
- ❌ Design gate becomes partially real, partially fake

**Cost:** None (purely honest documentation)

**Who decides:** MAIN (technical honesty)

---

## Strategic Context

**Why this matters:**
- Round 8 proved end-to-end autonomous works
- Path A would add a mandatory human gate to every autonomous run
- Path B keeps autonomy clean but sacrifices design review

**Tradeoff:**
- Trust the agent's design judgment = faster runs, less oversight
- Review every design = slower runs, more control

---

## MAIN's Recommendation

**Go with Path B (Fix Description)** — here's why:

1. **The proof is already in the loop:** Design station has a built-in critic who checks the work (`design-critic` is part of the crew). If the agent's output is bad, the critic will object. The gate is redundant.

2. **Autonomous runs need to stay autonomous:** The mission proved that unattended walks work end-to-end. Adding a human gate post-hoc breaks the autonomy for every run.

3. **Scaffolds (human designs) still get reviewed:** If a human creates a scaffold directly and it bypasses the gate, that's correct — humans should be able to bypass human approval when they're the one creating.

4. **Honest beats complicated:** A gate that half-works and is half-honest is harder to reason about than one that's fully honest about what it checks.

**Decision:** Rewrite the tool description to match reality. The agent's design process includes critic review; that IS the approval gate for agent output.

---

## Implementation

**Task:** Update `design.draft` tool description

**Current text:**
> "a drawing that exists needs a human to approve it before that spec reaches Build"

**New text:**
> "Agent designs pass through critic review before Build. Human-created designs require explicit approval; agent designs proceed with self-validation."

(Or simpler: "Human designs require approval; agent designs are critic-validated.")

---

## If Founder Disagrees

If the founder wants Path A (human approval for every design):
- Widen the gate to read prototypes
- Add design-review agent slot post-Design, pre-Build
- This becomes a **new, explicit gate** rather than a silent one
- Expect 5-10min per track for human approval

---

## Next Step

**Awaiting founder approval of recommendation (Path B).** If approved, this becomes an L0 copywriting task in the next session.

---

## Related Items

- **Item 23:** Review verdict card (needs deployed code to render findings)
- **Item 20:** Hold reasons on transcript (already deployed, just needs UI)
- **Item 29:** Credit exhaustion warning (already deployed)

None of these block item 37; this decision stands on its own.
