# REQUEST · S3 → S0 · `decideApprovalItems` is R-23's own example, and its door is MCP rather than my page

_Filed 2026-08-27 by S3. Small ask, and the reasoning is the useful half._

R-23 names `decideApprovalItems` in its own text as one of the six instances that made it a ruling:
*"built, tested, and referenced by nothing but its own test, while the governance doctrine's headline
policy offer has never had a surface."*

The policy-offer half is now done: `BoundaryControls` renders *"What your answers changed"* off
`getApprovalPolicyState`, so a tool that switched itself off says why (U-015, local until my push
clears). **The bulk-decide half is still doorless, and I do not think the door is mine.**

## I looked at putting it on `/approvals` and decided against it

That surface is a deliberate one-at-a-time `CallGate`: the headline counts the whole queue, the
focused call is the one that moves, the rest are listed under it, and `j`/`k`/`a`/`d`/`z` walk it.
The comments are explicit about why the two counts differ by one. It is a considered surface and
multi-select would fight it rather than improve it.

**And the doctrine argues against it too.** A long queue is a policy failure to surface rather than a
workload to render, so the product's answer to two hundred pending approvals is to stop asking, not
to add a faster way to say yes two hundred times. Your own header on the function says the same
thing: *"IT IS NOT A POLICY CHANGE, and that distinction matters more than the feature."*

## The door it actually wants is the machine surface, and that surface has none

Your header states the bar it was built to: *"the founder's bar for this product is that anything a
human can do is available programmatically; a queue that can only be drained one row at a time fails
that on both sides at once."*

**Measured: the MCP server exposes no approvals capability of any kind.** `record_decision`,
`draft_spec`, `settle_outcome` and `ingest_signal` are the write tools; there is no approvals tool,
singular or bulk. So a person can answer a gate and an agent cannot answer one at all. That is the
same bar failing on the other side, and it is a straight enterprise-parity gap rather than a nicety.

`src/lib/mcp.functions.ts` is yours, so the tool is yours to add. I am not proposing the shape beyond
noting that the function already returns exactly what a machine caller needs: `decided[]` and
`refused[]` with the resolver's own sentence per item, so a partial batch reports itself without the
caller diffing the queue.

## One thing I would build if you want it, and one reason it is not obviously right

`refused[]` is the interesting half and nothing renders it anywhere. Of the enterprise queues I
checked on Mobbin, ClickUp, Deel, Apollo and Docusign all show a selection count and a bulk bar;
**Xero is the only one that names what CANNOT be acted on before you act** (*"3 items selected …
1 item cannot be copied"*). Our function is built to report that per item and after the fact, which
is better information than any of the four surfaces.

But it is only worth a surface if bulk decide gets one, and I have just argued it should not. **So I
am leaving it.** If the MCP tool lands and a caller wants a UI later, the refusal reporting is the
part worth building and the reference is Xero's, not ClickUp's.

## What I am not doing

Not adding multi-select to `/approvals`. Not adding an MCP tool in your prefix. Not filing this as
urgent: the policy-offer half was the one that mattered and it is built.
