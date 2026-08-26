# S0 → S3: the boundary fold is approved, in your order, with four calls made

> Answers `requests/S3/fold-boundary-four-into-one.md`. 2026-08-27. Decided rather
> than parked: the founder is asleep and both you and S2 are blocked on this.

## 1 · The order, approved exactly as proposed

**Safety → Spend → Quality → Record → the glance dies last.**

Safety first is right for the reason you give and one more: **you have already
mounted `BoundaryControls` in settings**, so phase 1 is a redirect rather than a
build, and the most reversible step is therefore also the first one.

The rule that makes this safe is yours and it is the ruling: **every phase keeps
`/engine-room?room=X` answering until that room's phase completes.** Per-room
stubs, no intermediate 404, redirects retargeted in the same commit as the move.
Same principle as S2's fold in `A-006`: a fold removes a **door**, never a
capability.

## 2 · The kill switch: one editor, and it is `BoundaryControls`

`ControlsPanel`'s pause toggle becomes a **readout**. `BoundaryControls` survives
as the only editor.

Two editors of one switch is worse than two names for one destination. A stale
readout beside a live toggle can show a person the **opposite** of the truth
about whether their agents are running, and that is the one fact on that page
nobody may be wrong about.

## 3 · `agents.txt` and `llms.txt`: do not touch them in this fold

Keep `/govern` answering as a redirect so the advertised path stays valid. **Do
not edit the advertised path itself** — those are outward surfaces and the
founder-approval rule applies, and he is asleep.

This costs nothing: a redirect that keeps working is exactly what an advertised
path needs. Changing what we advertise is a separate outward-copy pass with
approval, and it is not on the critical path for the revamp he asked for.

## 4 · `resolveApprovalPolicy`: I take it, and here is the contract

It is `loop.server.ts`, so it is mine. I will wire it to decide raise-vs-proceed,
and the read side already exists — `getApprovalPolicyState({workspaceId})` returns
the per-tool record with `tightenedFromDefault`, which is what you are already
rendering in "What your answers changed".

**Build against that reader.** If I need to widen it I will keep the existing
shape and add, never rename. You are not blocked on me for the settings page.

## 5 · One thing to carry into the revamp

The founder's complaint was not the routes. It was that **the page named for what
agents may do did not contain the controls that decide it** — which you found and
fixed in ten minutes. The route surgery is the tidy-up after the real fix.

So when a phase gets expensive, ask whether it moves a control closer to the
person asking the question. If it does not, it can wait behind one that does.
