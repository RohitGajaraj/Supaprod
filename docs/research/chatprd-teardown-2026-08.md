# ChatPRD, torn down — and what the category says about us

> _2026-08-25. Produced by a six-agent workflow: a product teardown, a category map, an outside read
> of our own surfaces, a friction count, and an adversarial test of our moat. Every claim carries a
> URL, a file:line or a production number._
>
> **The full strategic read, including what to delete and the ten-day plan, is
> [`../../the-first-run/REIMAGINING.md`](../../the-first-run/REIMAGINING.md). This file is the
> competitor record so the analysis is not paid for twice.**

## The competitor

**ChatPRD** (chatprd.ai) — AI product-management writing assistant. Chat produces a PRD; the PRD is
the artifact you keep.

| | |
| --- | --- |
| Buyer | The IC product manager drafting docs, individual through enterprise |
| Wedge | Rough idea, meeting notes or a prompt → PRD, user stories, technical specs, GTM briefs |
| Pricing | Free 3 chats · **Pro $15/mo ($179/yr)** · Teams $29/seat ($349/seat/yr) · Enterprise custom |
| Scale | Claims 100,000+ PMs, 750,000+ documents, Autodesk / LaunchDarkly / Handshake |
| Revenue | **Six figures**, on 100,000 users and a celebrity founder (every.to/podcast) |
| Integrations | Google Drive, Notion, Confluence, Linear, Slack, and an AI shelf: v0, Gamma, Bolt, Lovable |

## The product shape, from the founder's own session

- **Empty state is the onboarding.** *"How can I help you today?"* + four cards, each a whole job:
  write a document · improve an existing document (Pro) · brainstorm features · get feedback.
- **Two panes.** Chat left, **document right, materialising as it is written**, `Saved`, with
  `Current · v1`, Save, Export, Related, Improve, live word count, collaborator faces, comments.
- **Tool calls are cards** in the transcript — `Create Document`, its description, the template used,
  a status dot, and an **Edit** action into the artifact.
- **Consent is inline and contextual.** Adding a competitor pops *"Scan Website? · Not Now · Scan
  Now"* at the moment, in the place the work is happening.
- **Products + Competitors** auto-researches a company from one URL into positioning, audience,
  pricing and a feature list, each with a source link.
- **Templates are structured and previewable** before saving — named sections, each with instructions.
- **Usage meter is always visible** — `Used 1 of 3 free chats`, with the upgrade next to it.

## What we take, take-and-beat, and refuse

**Take:** consent in context (see below), the empty state as onboarding, tool calls as actionable
cards, versioning present before the user asks for it.

**Take and beat:** they version a **document**; we can version a **decision** — the claim, its
horizon, and later its verdict. They cannot copy that: it must be captured at the moment of the call
and they have no run to hang it on.

**Refuse:** the chat-first frame and the document as the deliverable. Their product is a PRD. Copying
that makes us a worse version of a company with 100,000 users whose whole business is writing
quality. **Also refuse the 3-chat meter** — right for a $15 tool with instant value, wrong for a
product whose value is a run that finished.

## The finding that cost us three months

**Their consent is a question at the moment of the work. Ours was a queue.** Measured in our own
production: **90 `cluster.trigger` approvals raised since July — 42 cancelled, 38 expired, 10
pending, zero ever approved.** A question that has to be found does not get answered. The lesson is
not that we need a better approvals queue; a queue was the wrong shape.

## The category, which matters more than the competitor

**Producing work is finished and priced.** Cursor ~$4B ARR, Lovable $500M, Replit $525M, Cognition
$492M run-rate — against ChatPRD's six figures. **Writing the document is a $15/mo feature with a
measured ceiling.** **Running the lifecycle is free** — OpenAI shipped Symphony on GitHub in April
2026, and Linear includes it at $16/seat with coding agents in 75% of enterprise workspaces.

**Accepting work is where the pain moved, and it is measured:** code review time **+441.5%** while
throughput rose 33.7% (Faros AI, 22,000 developers); agentic PRs have **5.3x longer pickup** (LinearB
2026); DORA flat because output queued at review. The specific gap is intent — *"the reviewer
receives a completed diff without the implementation journey or decision trail"*
(codex.danielvaughan.com/2026/05/24).

**So the position argued for us:** the check between what a change was supposed to do and what it
did, run by something that did not write the change — sold to the person now accountable for merging
output they did not write. **Not the IC PM drafting a PRD.** That buyer is served at $15 and the
ceiling is proven.

## The prior art nobody in our corpus had named

**Cloverpop** — *"Capture every decision in the Decision Bank, tracking rationale, data sources, and
outcomes"*, a Learning Loop, a Decision System of Record tracking *"how results compare with
expectations"*. **Eleven years, $12.6M raised across five rounds.** Our strategy docs decline the
category naming FICO, SAS, IBM, Quantexa, ACTICO and Aera — and never mention the company that
shipped this exact thesis in 2015. **There is no answer in this repo to "how are you different from
Cloverpop." Read their product before the next investor call.**

Also against the un-backfillable claim: pre-registration is the identical mechanism and tops out at
**10–12% after twenty years** of journal and funder pressure; Eppo made the hypothesis backfillable
deliberately; Statsig sold for $1.1B without enforcing pre-commitment; ADRs have carried
append-only expected-consequences since 2011, free, prescribed by Microsoft.


## The "Open in" menu, and why we do the opposite

ChatPRD's document header carries **`Open in →` v0.app · Lovable · Bolt · Magic Patterns · Replit ·
Linear Issue · Cursor.** The founder asked whether we should offer the same.

**No, and the menu itself is the argument.** Every destination in that list is where the value
accrues. ChatPRD makes six figures; Cursor makes roughly $4B ARR. That menu is a product admitting
its scope ends at the document and handing the customer to whoever does the work. It is the correct
call *for them* — and it is the exact move that caps them.

**Three specific costs if we copy it:**

1. **It breaks the loop, which is the only thing we have.** We exist to check what a change was
   supposed to do against what it did. Work that leaves through an exit door never reports back, so
   the forecast we recorded can never be graded. We would be paying for the moat and then exporting
   the evidence.
2. **It puts us on the producing side, where everything is priced and we are last.** A handoff menu
   is a feature of a doc tool. We would be ChatPRD with fewer users.
3. **It is the friction we are trying to delete, wearing a nice icon.** The user still has to go
   somewhere else and come back by hand.

**The inversion, and this is the ruling: we RECEIVE, we do not hand off.**

The user is already in Cursor or Claude Code, and that is fine — we should not fight it. What is
missing is not a way out; it is a way **back**. So:

- **Inbound is the integration that matters.** A merged PR arrives from GitHub, gets matched to the
  decision that authorised it, and on the horizon date the run reopens itself and says whether the
  thing did what it was supposed to do. **That is the product.** Nothing in the ChatPRD list does it,
  and a coding agent structurally cannot: it wrote the diff, so it cannot be the counterparty that
  checks the diff.
- **One narrow outbound is allowed, and it is not an exit door.** A single control that copies a
  brief for whatever coding agent the person uses — **with the forecast and a run id embedded in
  it** — so the work can be matched when it comes back. That is a tracking beacon, not a handoff.
  It ships only alongside the inbound half, never before it.

**What this means for the roadmap:** the GitHub inbound outranks every integration on ChatPRD's
shelf. If we build only one connector, build the one that closes the loop.
