# The AI-native SDLC playbook — what we rewire, what it costs us, and what we kill

> _Created: 2026-08-31 · Last updated: 2026-08-31_
>
> **Founder ruling, 2026-08-31:** *"They are the ones leading the industry, so we go with them and push
> back only where it does not fit. This is framework level. We'll model our platform around this
> playbook."*
>
> **This document answers the second half of that instruction: not "what do we adopt" — that is the
> adoption register in [`the-first-run/SPEC-AI-NATIVE-SDLC.md`](../../the-first-run/SPEC-AI-NATIVE-SDLC.md)
> §4 — but what it does to us. What we rewire strategically and tactically, what it is worth, what it
> costs, what could derail us, and what we stop doing.**
>
> **It is deliberately not a sales document.** Every section carries the case against as well as the
> case for, because a framework adopted without its downside priced in is how a team re-plans instead
> of building — and this one has three months and zero acceptances of form on exactly that.

---

## 1 · What was read, so nobody re-reads it

| Source | What it gave us |
| --- | --- |
| [The AI-Native SDLC playbook](https://claude.com/blog/the-ai-native-sdlc-playbook) (2026-08-21) | Six stages, ten artifacts, eighteen measures, the bottleneck thesis. **Extracted in full** in `SPEC-AI-NATIVE-SDLC.md` |
| [How monday.com became agent-first](https://claude.com/blog/how-monday-com-transformed-its-platform-into-an-agent-first-product-where-humans-and-agents-collaborate) (08-20) | The closest analogue to us that exists. Named agents with avatars, assignment by mention, **"AI dust"** as the named anti-pattern, 5M agent interactions since May |
| [How Warp builds self-improving agents](https://claude.com/blog/how-warp-builds-self-improving-agents-on-claude) (08-26) | **The improver pattern** — an outer skill that reads accumulated feedback and proposes an edit to the inner skill, merged through normal review |
| [The Claude Code guide for startups](https://claude.com/blog/claude-code-guide-for-startups) (08-20) | Golden sets, *"fix the principle, not the example"*, versioned instruction sets tested against the records that failed, **"build for rebuilding"** |
| [Slack human-agent teams](https://claude.com/blog/turning-conversation-into-knowledge-how-slack-builds-human-agent-teams) (08-19) | *"Agents can only learn from what they can see."* An emoji reaction as the assignment gesture |
| [Skills API, Files API, computer use](https://claude.com/blog/computer-use-skills-api-files-api) (08-20) | **Skills as versioned, uploadable, conditionally-loaded instruction sets** — the infrastructure the improver pattern needs |
| [SDAD (arXiv 2608.20341)](https://arxiv.org/abs/2608.20341) · [Microsoft spec-driven development](https://developer.microsoft.com/blog/spec-driven-development-ai-native-engineering/) | The academic and second-vendor form of the same thesis, plus **A2A** alongside MCP |

**Nothing here needs re-reading.** If a session needs the playbook, it reads the register.

---

## 2 · The strategic reading, in one page

**Three months ago the bet was that the loop was novel. It is not, and that is good news.** The
vendor, Microsoft, a peer-reviewed formalisation and monday.com have all converged on the same
pipeline shape within four weeks of each other. **A category with one participant is a hypothesis; a
category with four is a market.**

Three things follow, and only the third is uncomfortable.

**One: our thesis is now third-party.** Canon §5N — *code is not the bottleneck, confidence in it
is* — was measured from the market (review time **+441.5%** against throughput **+33.7%**). Anthropic
argues it from their own telemetry: *"the bottleneck moves to plan, review/test and deploy, which
still run at human speed."* **Two independent derivations, neither citing the other.** We no longer
have to establish the premise in a pitch; we can cite it and move to the answer.

**Two: the format is now standard, and standards are cheap to join and expensive to ignore.** Every
team on this playbook will hold `intent.md`, `spec.md`, `plan.md`, `CLAUDE.md` and `REVIEW.md` in
their repository. **If what Supaprod hands a builder is already those files, we are native on day one
and there is nothing to integrate.** If it is our own shape, we are one more thing to map, forever.
That is gap #20 and it is the highest-leverage tactical change in this document.

**Three: the vendor is walking into two of our seven stations.** Managed Code Review, Claude Security
and Claude Tag ship into what we call **Ship** and **Learn**. Today that is a tailwind — they are
suppliers to layer 02 like every builder is. **It stops being a tailwind the day one of them records
a prediction.** §6 is the watch.

### And the moat, re-tested against the whole corpus rather than against one post

Six stages. Ten artifacts. Eighteen measures. monday.com's five million agent interactions. Warp's
improver loop. Slack's conversational memory. **In none of it does anything record what a team
believed would happen, before the outcome was known, in a place that cannot be edited afterwards.**

- `intent.md` carries a *proposed outcome* — a goal, written by the asker, no horizon, no grade.
- `bands.yaml` carries a *baseline* — computed from history.
- Warp's improver reads *feedback after the fact*.
- Slack's pitch is that you can **reconstruct** why something was decided.

**That last one deserves attention, because it is our own falsification published by somebody else.**
On 2026-08-10 we killed the compounding-record moat after finding that causes survive in Slack and
call recordings and have been reconstructed twice on the record. **Anthropic and Slack now say the
same thing in public, as a feature.** That is not a threat; it is confirmation that moving the moat
to the forecast was correct and that the old claim would have been contested by the vendor's own
marketing within three weeks.

**The forecast captured at decision time is the one thing in our product that four independent
descriptions of this pipeline do not contain.** Not because it is hard — because it is not an
artifact and leaves no trace unless something captured it at the moment of the call.

---

## 3 · The five strategic shifts, each with what it costs

### Shift 1 · From "our pipeline" to "the standard pipeline, with our layer on top"

**What changes.** We stop designing handoff formats. Our artifacts serialise as theirs. Our stations
keep their names and gain a **translation** the product speaks, so a customer asking *"where is my
`spec.md`"* is answered in their words rather than taught ours.

| For | Against |
| --- | --- |
| Zero integration cost into any team on the playbook; the format is the distribution | **Our output shape now tracks somebody else's roadmap.** If `intent.md` changes, our emitters break |
| Their vocabulary does our education for us | We lose the ability to put a field in the handoff that their format has no slot for — **except the forecast, which is exactly the field we must keep** |
| It makes the *"we are not a builder"* position concrete rather than rhetorical | A reviewer may read format-compatibility as commodity positioning |

**Mitigation, and it is not optional:** our artifact stays the source of truth in
`spine_track_members`; **their names are a serialisation, never the storage.** A forecast block travels
alongside `intent.md` rather than inside it, so their schema changing cannot delete our moat.

### Shift 2 · From "the loop is novel" to "the loop is standard and the grade is ours"

**What changes.** Outward material stops explaining that a lifecycle exists and starts on the one
question the standard pipeline cannot answer: *what did you believe would happen, and were you right?*

| For | Against |
| --- | --- |
| Shortens every pitch by the whole premise section, which is now citable | **We lose "we invented this" and some audiences buy novelty** |
| Puts us on ground no competitor's marketing occupies | The remaining claim is **narrower**, and narrow claims are easier to test — which is only a downside if it is not true |
| The vendor's own post is the citation | It concedes layers 01 and 02 are contested |

**This is the trade the positioning canon already made on 2026-08-10.** The playbook does not create
it; it confirms it.

### Shift 3 · From "we learn" to "an improver proposes a reviewable change" — and this is the big one

**Warp's pattern is the first implementable shape for layer 03 we have seen anywhere.** An **inner
skill** does the work. An **outer improver skill** reads accumulated feedback on a schedule, compares
what the agent suggested against what the human actually did, and **proposes a targeted edit to the
inner skill** — as a file, through normal review, mergeable or rejectable. Anthropic's **Skills API**
is the infrastructure: versioned, uploadable, conditionally loaded.

**Ours would be sharper than theirs, and for a structural reason.** Warp's improver learns from
*feedback* — a thumbs-down and a sentence. **Ours would learn from a graded forecast**: not "somebody
disliked this" but "this station predicted X, the world did Y, and here is the edit that follows."
**That is the difference between preference-fitting and calibration**, and it is the mechanism behind
*"learns, then guides"* that we have claimed and never shipped.

| For | Against |
| --- | --- |
| The first buildable mechanism for the only defensible layer | **It cannot start until forecasts are being graded**, and the grader has processed **zero workspaces in its life** (F-51) |
| Every proposal is a reviewable file, so nothing changes silently | An improver is a second system that can be wrong, and a bad edit degrades a station for every customer on it |
| Skills API means we do not build the versioning | It makes a station's behaviour depend on a model vendor's storage |

**The honest sequencing:** gap #15 (bands) → gap #4 (the return edge fires) → **then** the improver.
**Anyone proposing the improver before forecasts are graded is proposing a machine that learns from
nothing**, which is the failure that produced 133 of 133 seed `learnings` rows.

### Shift 4 · From "agentic features" to "an agent-first product", using monday.com's map

Their named anti-pattern is worth the whole post: **"AI dust — sprinkling automations onto existing
workflows."** They rebuilt the product experience around humans and agents working together, gave
each agent **a name and an avatar**, and made assignment happen **through triggers and mentions in
surfaces that already existed**. Five million agent interactions since May.

**Their three lessons map onto three of our open findings exactly:**

| monday.com's lesson | Ours |
| --- | --- |
| *"The mental model is harder to change than the technology"* | §12, the plain-words law. Five words for one idea and none is a word a person says out loud |
| *"Adoption depends on trust as much as capability"* | The boundary page, and 19 of 106 tracks a person pressed rather than trusted |
| *"Capability needs infrastructure to match"* | 121 Meridian components, ~20 connectors, an MCP server — **we have the infrastructure and have not wired it** |

| For | Against |
| --- | --- |
| An existence proof at scale that this product shape works | monday.com had **an installed base to embed agents into.** We do not, so "embed in the workflow they already have" means somebody else's tool, which is the connector work |
| Named, avatared teammates is already specced here | It validates a surface we have repeatedly failed to ship, which is a delivery finding rather than a design one |

### Shift 5 · From "verify by review" to "verify by golden set"

The startup guide's third principle is **trust, but verify**, and its mechanics are concrete: a
**golden set** of verified question–answer pairs, back-testing before deployment, versioned
instruction sets, and *"every change is made against a versioned set of instructions and tested
against the records that failed."* Plus the rule we independently derived and wrote into memory as
*a fix in one field is not a fix*: **"fix the principle, not the example."**

**We have no golden set.** S4 proves claims one at a time by hand. That is high quality and it does
not scale past one session.

| For | Against |
| --- | --- |
| Turns S4's verdicts into a regression suite instead of a document | Building one costs real time against a queue that is already long |
| It is the only stated defence against *"overfitting to examples"* | A golden set built from a broken pipeline **encodes the breakage** — ours must be built from real runs, and we have few |

---

## 3.5 · THE PAIN THE PLAYBOOK NAMES AND DOES NOT SOLVE — and it is our market

**Founder, 2026-08-31:** *"The core problem this playbook is calling out is that many engineering
teams still have the same approval gates, reviews, handoffs and policies stalling the productivity
gains made by agentic coding. Agentic coding has taken care of building. How does Supaprod solve this
for the rest of the lifecycle? That is the real problem we want to be solving."*

**He has found the load-bearing sentence in the post, and it is the best strategic reading available
of what we are for.** This section is the answer.

### 3.5.1 · What the playbook says, and what its own remedies do not reach

> *"The controls stop matching reality and become intractable. Reviewing each line by hand made sense
> when a person had written it, but it can't keep up once agents write most of the diff. Governance
> costs increase because exceptions still route through meetings and committees that meet weekly or
> monthly."*
>
> *"Security teams are sized for human output, so when agents multiply code output, either the review
> queue builds or code ships under-reviewed."*

**Their remedies are hooks as deterministic gates, AI review of every PR, autonomy tiered by
environment, and named approvals. Every one of them makes the gate FASTER. None removes the reason
the gate exists.**

**A gate exists because somebody is accountable for an outcome and cannot tell whether this change is
safe.** Reading the diff faster does not create that confidence — it shortens a queue that is
refilling at the rate agents write. **A review queue growing at machine speed, reviewed at machine
speed, is still a queue whose length is set by how much nobody trusts.**

### 3.5.2 · The reframe: a gate is a question, and only one of the four is about code

Every stall the playbook names is a question somebody is trying to answer:

| The stall | The question underneath it |
| --- | --- |
| **Approval gate** | *Will this do what we wanted?* |
| **Review** | *Is it correct and safe?* |
| **Handoff** | *Does the next person know what I decided, and what I was unsure about?* |
| **Policy** | *Are we allowed to do this, and who says so?* |

**Only the second is answerable by reading code — and agentic coding plus AI review already answers
it.** The other three are answered by **evidence the code does not contain.** That is the whole
opportunity, stated in one line, and it is why the pain moved without moving to generation.

### 3.5.3 · Our four mechanisms — and every one is already a queued gap

**This is the finding worth the most: we had already queued the answer and did not have the sentence.**

**1 · The approval gate is answered by the forecast, not the diff.** A change arrives carrying what
was predicted, by when, in what band, and **how often this team's forecasts at this station have
landed.** The gate becomes a policy check against evidence rather than a person reading a diff.
*Gaps #15, #19.*

> **And the sharpest single change in this document, which is small and new:** `trust-ramp.ts` should
> promote on **calibration** — how often forecasts at this station landed in band — **not on a count
> of successful runs.** A team that has been right eight times in ten earns a wider band before a
> human is asked; a team that has been confidently wrong narrows, automatically, with the reason
> visible. **Nothing in the playbook does this, because nothing in the playbook records a forecast.**
> It is the trust ramp the rest of the industry cannot build.

**2 · The review proves itself before a person sees it.** `REVIEW.md` is the customer declaring what
counts as done; the station self-check proves it and **shows the proof.** Human review becomes an
exception with a named reason rather than the default. Anthropic's own posture is *"human review
reserved for regulated and critical code"* — **and somebody has to define "critical". That is what
#18 is.** *Gaps #18, #22, #21.*

**3 · The artifact IS the handoff.** One `intent.md` carrying problem, outcome, affected systems,
constraints, **open questions**, and the forecast. **The stall in a handoff was never the meeting — it
is the ambiguity nobody resolved**, and *"AI cannot correct ambiguity that was never resolved."*
**Naming the open questions is what removes the meeting**, which is why an empty `Open questions` is
a defect here and merely a field there. *Gaps #16, #20, #29.*

**4 · The policy is declared once, binds automatically, and learns from its own answers.**
`delegate.openhands`: **0 approved, 7 rejected, and the queue kept asking.** A policy that does not
learn from the answers it already received is a committee with a database. Declared gates above
inferred policy, answers widening the **class** and never the instance. *Gap #19, and the
class-widening consent rule.*

### 3.5.4 · The sentence

> **Agentic coding removed the cost of writing the change. We remove the cost of being accountable
> for it.**

**That is the market the playbook identifies as stalled and does not clear.** It is narrower than
"we run the lifecycle" — a phrase canon forbids outward anyway — and it is defensible, because three
of the four answers need a forecast and nobody else records one.

**Not yet approved for outward use.** Nothing outward-facing ships without the founder's approval, and
this belongs in `positioning-locked-2026-08.md` if it is taken.

### 3.5.5 · Layers 01, 02 and 03 — reconciled rather than reordered

**Founder, same message:** *"Layer 1, telling you what to build, is the USP. Layer 3 — the learning,
memory and guiding part — is an added bonus."*

**Canon says 03 is the only layer defensible alone.** Both statements are true and they answer
different questions. **Do not overwrite one with the other; state the split:**

- **01 SELLS.** *Tell me what to build* is what a buyer arrives wanting. It opens the conversation and
  it is the reason anyone looks.
- **02 RETAINS.** **This section is 02's case, and it did not have one before today.** The gates,
  reviews, handoffs and policies stopping being the bottleneck is the value felt every day. **A
  product is kept for what it does on a Tuesday**, and this is that.
- **03 DEFENDS.** The forecast and what compounds from it is what a competitor cannot copy, and the
  vendor's own published pipeline has no field for it.

**A buyer buys 01, stays for 02, and cannot leave because of 03.** Nothing in canon changes; 02 gains
the argument it was missing, which is exactly what the founder's reading supplies.

---

## 4 · The tactical rewiring — what actually changes in the repo

Every row is already carried into
[`OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md) §0.8 as a numbered
gap with an owner, or into the register's §4. **This table is the index, not a second backlog.**

| # | Change | Owner | Replaces |
| --- | --- | --- | --- |
| 15 | Forecast carries a **band and tiered response**, not a point graded once | S0 · S1 | A grader that has never usefully fired |
| 16 | What enters Discover has **five fields**, including *open questions* | S1 · S0 | A slug, and ~46 tracks dead at `sense` |
| 17 | **Value audit** = gaps between artifact timestamps we already store | S1 · S0 | Nothing. The verb was entirely unbuilt |
| 18 | **`REVIEW.md`** — the customer says what counts as done | S3 | Severities hardcoded by us |
| 19 | A **declared gate** above the inferred policy, and a **named approver** | S3 · S0 | `decided_by` NULL on 18 of 176 |
| 20 | **Hand out `intent.md` · `spec.md` · `plan.md`**, their names | S0 · S1 | Our own handoff shape, undesigned |
| 21 | A **hook the agent cannot edit around** during a fix | S0 | Tests that asserted nothing |
| 22 | The **self-check becomes visible and counted** | S0 · S1 | Their Test stage, which we fold and hide |
| 23 | **Station briefs become versioned skills** (Skills API shape) — the precondition for the improver | S0 | Inline prompt strings |
| 24 | A **golden set** built from real graded runs; S4's verdicts become its cases | S4 proposes · S0 holds | One-at-a-time manual proof |

**23 and 24 are new in this document** and are the two that Shift 3 and Shift 5 depend on. Neither is
a new destination.

---

## 5 · What we eliminate. This is the half that is usually skipped.

1. **Any plan for a code-review surface, a vulnerability-triage screen or a scan-results board.**
   Managed Code Review and Claude Security ship those. **Consuming them IS following the playbook**; a
   lane building one has departed from it while believing it is following it.
2. **Our own handoff format.** Do not design one. Gap #20 replaces it before it exists.
3. **The sixty-seconds-as-landing-page reading.** Killed in §0.7. It is measured signed in.
4. **The sixteenth evidence adapter**, and every connector that is not one of the four carrying the
   loop.
5. **Any bespoke agent-to-agent protocol.** MCP for tools, **A2A** for agent-to-agent — both standard,
   both external. `SPEC-AGENT-COMMS.md`'s seven message types are a *product* surface, not a wire
   protocol, and must not become one.
6. **Any surface claiming accumulated learning before the improver has a graded forecast to read.**
   133 of 133 `learnings` rows were seed. This is standard #7 and it deletes features.
7. **Gold-plating the 119→9 fold.** *"Build for rebuilding — accept that what you build today is very
   likely scrapped in six months."* Fold it, redirect the callers, move on.
8. **Re-deriving the bottleneck claim.** It is citable now. Every hour spent re-measuring it is an
   hour not spent on the acceptance.

---

## 6 · What could derail us. Four, ranked by how much they would cost.

### 6.1 · The playbook becomes a reason to re-architect instead of ship. **Most likely, by far.**

**73 tracks, 71 entered at `sense`, and the acceptance has never once been met.** The failure mode of
this repository is not a shortage of good frameworks; it is that a good framework arrives and the
fleet re-plans. A 226-line spec, ten new gaps and a strategy document are **exactly** what that
failure looks like from the inside.

**The guard, and it is why §0.7 and §0.8 shipped in the same commit:** the freeze exists so this
adoption cannot become a general licence to redesign. **Gap #15 and gap #4 are the only two on the
list that move the acceptance. Everything else waits behind them.** If the next session opens with
artifact emitters rather than the forecast band, that is this risk happening.

### 6.2 · Anthropic records a forecast. **Least likely, highest cost.**

If `intent.md` gains a horizon and a grade — or `bands.yaml` gains a *predicted* band rather than a
historical one — layer 03 closes and we are a workflow product in a market with four vendors.

**The watch, and it is cheap:** re-read the playbook and the Skills/Files API changelog **once a
month**, and check one thing only — *does anything now record a belief before the outcome is known?*
Record the answer with the date in `SPEC-AI-NATIVE-SDLC.md` §5. **A watch nobody schedules is not a
watch**, so this belongs on S0's standing list, not in this paragraph.

### 6.3 · Format compatibility reads as commoditisation

Speaking somebody else's format is either "native on day one" or "a thin wrapper", depending entirely
on whether the thing we add on top is visible. **The forecast block travelling alongside `intent.md`
is what makes it the first reading.** If our emitted artifacts are indistinguishable from what Claude
Code produces, we have handed away the only differentiated line in the handoff.

### 6.4 · We adopt their measures and our numbers are bad

Their leading indicators are public and comparable. **Ours will not flatter us**: first-pass success,
rework cycles and time-to-first-artifact on a product where a dead track took 34 hours to file
anything. **That is an argument for measuring, not against it** — but it should be known before the
numbers are on a screen a customer sees, and gap #17 puts them on one.

---

## 7 · What is now industry standard that we do not have

Stated plainly, because the founder asked whether we are up to the mark.

| Standard practice | Us | Gap |
| --- | --- | --- |
| Versioned, machine-readable intent → spec → plan artifacts | Rows in `spine_track_members`, no serialisation | **#20** |
| A named verification target the agent iterates against | Shipped (F-76), **invisible and uncounted** | **#22** |
| A golden set and back-testing before deployment | None | **#24** |
| Deterministic hooks as gates, exit allow/ask/block | Internally yes; **not offered to a customer** | **#19** |
| A named approver on a production gate | NULL on 18 of 176 | **#19** |
| An improver loop editing versioned instructions | Claimed, never shipped | **#23 → Shift 3** |
| Agents as named teammates assigned by mention | Specced, **mounted zero times** | `SPEC-MULTIPLAYER-PRESENCE` |
| Async delivery of the result to a person who left | **None at all** | Gap #2, S3 job 1 |
| MCP for tools · A2A for agent-to-agent | MCP yes, **A2A not evaluated** | New — S0 to assess |

**Eight of nine are already owned and queued.** The one genuinely new item is A2A, and it is an
assessment rather than a build.

---

## 8 · Where this is wired, so it cannot be orphaned

**Founder's instruction: *"don't just document or link it — any agent that picks it up must know this
is what we are supposed to do."*** This document and the register are reachable from every path a
session actually takes:

| Entry point | What it says |
| --- | --- |
| `CLAUDE.md` | Loaded every session. Names the framework ruling and links both files |
| `the-first-run/OPERATING-MODEL-5-SESSIONS.md` §0.8 | **Read in full by all five sessions before acting.** Carries the ruling, gaps 15–22, and the three refusals |
| `the-first-run/SPEC-AI-NATIVE-SDLC.md` | The register. §7 tells a session how to use it |
| `docs/prompts/MASTER-PROMPT-five-sessions.md` | The paste-ready blocks. Every one of the five names the spec in its required reading |
| Each `SESSION-N-*.md` | S0 gains a framework gate; S1 gains four units; S3 gains two page sections; S4 gains the drift check |
| `the-first-run/README.md` · `docs/strategy/README.md` · `docs/planning/SOURCE-OF-TRUTH.md` | Indexed, so `docs-doctor` keeps them reachable |

**And the enforcement, which is the part that makes it stick:** S0 runs a **framework gate** on every
lane push. A unit that builds a handoff, gate, metric or artifact in a shape the playbook already has,
without an argument written into the register's §4.2, **is rejected as drift.** S4 files it as a
finding independently. **An unargued departure is not a judgement call; it is a defect.**
