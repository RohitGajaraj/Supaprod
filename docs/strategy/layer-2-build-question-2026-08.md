# Should Supaprod build the thing too? — the layer-2 question

> _Created 2026-08-26 by MAIN, from the founder's question the same day: "why cannot our platform be
> another Lovable, another Replit? Today they let you build anything and manage it. We can also be
> that, and on top of that tell you what to build. Lovable and Replit are layer 2. Before that we have
> layer 1, telling you what to build. Layer 3 is knowing how it works and guiding your next move."_
>
> **Status: RULED 2026-08-26, the same day. The founder ruled HYBRID — both build paths ship — which
> is a stronger version of what this document argued, not a rejection of it. Canon is
> [`positioning-locked-2026-08.md`](./positioning-locked-2026-08.md) §5N and what ships is
> [`../../the-first-run/SPEC-BUILD-PATHS.md`](../../the-first-run/SPEC-BUILD-PATHS.md). Kept for the
> reasoning, which still holds: no to competing on code generation, yes to owning the handoff.** It obeys
> [`positioning-locked-2026-08.md`](./positioning-locked-2026-08.md) and cites
> [`../research/competitive-landscape.md`](../research/competitive-landscape.md),
> [`../research/chatprd-teardown-2026-08.md`](../research/chatprd-teardown-2026-08.md) and
> [`../research/agentic-product-patterns-2026-08.md`](../research/agentic-product-patterns-2026-08.md).

---

## The framing is already ours, and it is right

Three layers, and `README.md` has said so since the rebuild: **01 the director** (tells you what to
build) · **02 the operating system** (runs the lifecycle) · **03 the brain** (learns, then guides the
next call). Each is the precondition for the next; 03 is the only one defensible alone.

The founder's question is narrower and sharper than the framing: **inside layer 2, do we generate the
code ourselves, the way Lovable, Replit and v0 do?**

---

## The honest answer: no to codegen, yes to owning the handoff — and there is one exception

### Why not codegen

**That market is finished and priced, and our own research already said so.** Cursor ~$4B ARR ·
Lovable $500M · Replit $525M · Vercel/v0 $9.3B · Cognition $492M run-rate at a $25B pre. Combined
vibe-coding is **over $48B**. `chatprd-teardown-2026-08.md` states the operating conclusion in one
line: *"The user is already in Cursor or Claude Code, and that is fine — we should not fight it."*

Three specific reasons, each sufficient on its own:

1. **It is a model-quality war fought with capital we do not have.** Their moat is inference spend,
   eval harnesses and years of scar tissue on generation quality. Entering it means competing on the
   one axis where being small is purely a disadvantage.
2. **It destroys the neutrality that makes layer 1 and layer 3 valuable.** Today Lovable, Replit,
   Cursor, Codex and Claude Code are **substitutable suppliers** to us. The moment we generate code,
   every one of them is a competitor who will not integrate, and our customer has to abandon the
   builder they already like to use us. **Their commoditisation is currently our tailwind; becoming
   one turns it into our problem.**
3. **The pain moved and it did not move to generation.** Code review time is **+441.5%** while
   throughput rose 33.7%; agentic PRs take **5.3x longer to pick up**; DORA is flat because output
   queued at review. **Nobody is short of generated code. Everybody is short of confidence in it.**

### Why owning the handoff is the real layer 2

**Supaprod does not write the change. It decides what change is worth making, hands it to whichever
builder you already have, and checks whether it did what it said it would.**

That is already the architecture: Build calls `studio.stage → studio.commit → studio.pr.open →
studio.checks.run → studio.pr.merge → release.publish`. **It is an orchestrator over a builder, not a
builder.** The work is to finish it, not to replace it — `studio.commit` appears **0 times in
`driver.ts`** and Build is briefed on step one of six (F-36).

This is also the shape the frontier converged on. Codex returns **a reviewable pull request**, not a
running app. Linear made agents **first-class assignees** and integrates Cursor, Devin and Codegen
rather than replacing them. **The winning position at layer 2 is the one that routes work to
builders, not the one that is a builder.**

### The one exception, and it is not optional

**We need a first-party builder that can complete a run with zero customer setup.** Not to compete —
to make the loop closable.

Every wall that has ever stopped a real run sat at the handoff to somebody else's world: the repo the
product stopped recognising (F-49), the merge gate no station was briefed to approach (F-50),
dependencies a customer's repo cannot install (F-56), a CI gate the builder disabled (F-63), GitHub
billing (F-64). **Five separate blocks, one cause: we do not control the far side of the handoff.**

So: a sandboxed first-party build path — the Replit Agent 4 shape, isolated environments, builds *and
verifies* before handing over — used for (a) the proof run that satisfies the acceptance, (b) the
first sixty seconds, where a stranger must see a full loop without connecting anything, and (c) any
customer who has no repo yet. **Everywhere else it is the fallback, and the customer's own builder is
the default.** Vercel's Sandbox SDK, Cloudflare's, or E2B make this a build rather than a research
project.

---

## What this does to the positioning

**Nothing about the moat changes, and that is the point.** The forecast captured at decision time is
still the thing no competitor and no agent sweep can reconstruct. What changes is how layer 2 is
described:

| Old, and it invites the wrong comparison | Proposed |
| --- | --- |
| "runs the lifecycle, seven stations" | **"decides what is worth building, hands it to whatever builds for you, and checks what actually happened"** |
| implies we are in the build market | states plainly that we sit above it |

**The line, in the founder's register, no category words:** *You already have something that writes
the code. What you do not have is something that decides what is worth writing, watches it get done,
and tells you whether it did what you said it would.*

**And the layered story stays exactly as it is:** tell you what to build → run it end to end → learn
from it and guide the next call. **Layer 2 is where we meet the buyer; layer 3 is why they stay.**

---

## What would prove this wrong

Two things, and both are worth watching for:

1. **If a builder ships layer 1 and layer 3 credibly.** Lovable or Replit adding a decision record
   with a forecast at commit time would collapse the distinction. Neither has, and neither is
   incentivised to — their metric is apps shipped, and a forecast slows shipping down. **But this is
   the threat to watch**, and Notion already shipped a free version of the lifecycle framing on
   2026-07-09.
2. **If the handoff cannot be made reliable at all.** If, after the sandbox exists and Build is
   briefed on all six steps, real customer repos still block the loop more often than not, then
   owning the builder stops being optional. **That is an empirical question and we now have the
   instrument to answer it** — five findings, all at the same seam.

---

## The ask

**Founder ruling needed on one thing only:** do we build the sandboxed first-party build path (the
exception above), which is real engineering and a real cost, or do we keep requiring a customer repo
and accept that the acceptance run keeps dying at the handoff?

Everything else in this document is a positioning restatement that changes no code.
