# OPERATING MODEL — five sessions, five worktrees, one product

> _Written 2026-08-26 by MAIN under the founder's grant: full authority over design, features and
> architecture. Supersedes the three-lane split in `START-HERE.md` for session assignment only.
> `RULINGS.md` remains the tiebreaker on everything it covers._

**Every session reads this file first, then its own SESSION-N file. Nothing else, until you need it.**

**Five sessions: one Claude Code (S0), four OpenCode / OX Alpha (S1–S4).**

---

## 0 · The lens that outranks every other instruction in this repo

**You are not building for a founder, an investor or a reviewer. You are building for one person
who has a job to do and is already tired.** Before you write a line, and again before you commit,
answer these five out loud in your unit file. A unit that cannot answer them is not built, it is
deleted:

1. **What problem of mine does this kill?** Name the thing the user stops suffering. Not a capability
   — a suffering.
2. **What do I stop doing because this exists?** If the answer is "nothing, I do one more thing", it
   is a feature and features are the enemy here.
3. **How is this different from Linear + Notion + Cursor + a Slack channel, which I already pay for?**
   If the honest answer is "it is in one place", that is not a reason to switch.
4. **Could I understand this in ten seconds with nobody explaining it to me?** No tour, no tooltip, no
   docs link. If it needs explaining, the surface is the defect.
5. **Would I open it again tomorrow?** What specifically pulls me back.

**The user does not care that this platform has 119 routes, seven stations, a brain, or that it is
"agentic".** They care whether their day got easier. Buzzwords on a surface are a fail on the same
footing as a tenant leak. Never write "agentic", "autonomous", "AI-native", "orchestration" or
"intelligence" in product copy — show the behaviour instead and let them name it.

---

## 0.5 · The defect, named by the founder 2026-08-26 — and it is not missing features

> *"Features and capability may be there, but structuring is not there. Connectivity is not there.
> Visually, it's not making sense for me. I'm not seeing this as one connected item. That is the main
> problem."*

**Take this literally. It outranks every backlog item in this repo.** We have 119 routes, 121 Meridian
components, seven stations, a brain, an engine room, four names for the boundary concept and seven
doors onto "what is happening". A person arriving at that does not see a product. They see an
inventory. **Nothing on the queue fixes this, because everything on the queue adds to it.**

### The rule that follows, and it binds all five sessions

**There are exactly three surfaces. Everything else is a view inside one of them, or it does not
exist.**

| Surface | What it is | Owner |
| --- | --- | --- |
| **The run** | One piece of work, from handover to verdict. The transcript on the left, the thing being made on the right, the mode and Stop in the footer | S1 |
| **The board** | Every piece of work at once — what is running, who has it, what changed, what needs you | S2 |
| **Settings** | Everything that is genuinely configuration, reached rarely | S3 |

A person is always in exactly one of these three and can always get to the other two. Brain, memory,
approvals, guardrails, govern, boundary, engine room, crew, agents, traces, fleet, swarm, cockpit,
observe, missions, today, discover, decide, define, design, ship, learn — **not one of those is a
destination.** Each is either a view inside the run, a column on the board, a section of settings, or
it is deleted. `THE-ONE-SCREEN.md` already ruled most of these individually; this states the general
law so nobody has to re-litigate them one at a time.

### Connectedness — the specific thing that is missing

Right now the objects are islands. A decision does not visibly come from a track; a spec does not
visibly come from a decision; a diff does not visibly come from a spec; a verdict does not visibly
land against the forecast that predicted it. **Each of those links exists in the data and appears on
no surface.**

**Every object shows, in place: what produced it, and what it feeds.** That is one line on each,
clickable, and it is what turns an inventory into one connected item. It is also nearly free —
`decisions`, `spine_tracks`, `changesets`, `deployments` and `agent_memory` already carry the lineage;
on real lineage, decide's largest inbound source is already learn (36 edges against 9 from
opportunities). **We built the graph and never drew it.**

### What every session does about it, starting now

- **Every unit either removes a surface, folds one into another, or draws a connection that already
  exists in the data.** A unit that adds a destination is rejected on review.
- **Before adding a route, component or page, say in your unit file which of the three surfaces it
  lives inside.** If the honest answer is "its own", the answer is no.
- **S0 arbitrates every fold and owns every deletion.** Propose in coordination/requests/, with the callers you
  found and where they redirect to. **A route folded without its callers redirected is a 404 in
  production.**
- **The measure of a good session is that the count went down.** Routes, components, doors, concepts.
  Adoption of what already exists goes up; inventory goes down. That is the whole shape of this phase.

---

## 0.6 · Where you MAY add — standing authority, and the gaps that are real

**Founder, 2026-08-26:** *"It's not only about structure. If there is genuinely some gap in features,
I authorise you to approve it, build it and fix it. What needs to be built for this platform to be
loved by millions of users?"*

§0.5 says stop adding destinations. **It does not say stop building.** Those are different
instructions and confusing them is how a team polishes an inventory. The rule is:

**Fold surfaces. Build capabilities.**

### The four-part test before you add anything

Answer all four in your unit file. Three out of four is a no.

1. **Which of the six verbs does it serve** — assign, manage, operate, value-audit, review, ship — and
   **what does the user do today instead?**
2. **Does it remove a step from the person, or add one?** If it adds one, it is not a capability, it is
   a chore with a nicer name.
3. **Can it be shown working in under thirty seconds, to someone told nothing?** If it can only be
   described, it is not finished.
4. **Which of the three surfaces does it live inside?** If the honest answer is "its own", the answer
   is no.

### The gaps that are real, ranked. These are authorised — build them.

Each is a genuine missing capability, not a structural fold. Each is named with its evidence so nobody
re-derives it.

1. **Stations do not check their own output before handing on.** Replit verifies before you see it;
   Devin rereads its own error and reruns; Codex returns a PR that already passed checks. Ours advance
   regardless. **This is the mechanism behind the ~46-track `sense` graveyard and three months of the
   acceptance query returning 0.** — *S0, `src/lib/spine/**`.*
2. **Nothing reaches a person who left the page.** The whole frontier is async: submit and leave, the
   result comes to you. We require attendance and call it visible agency. **No notification, email,
   push or digest exists that carries a verdict to someone who closed the tab.** — *S3, with S0 for the
   trigger.*
3. **Three missing steps between Build and Ship, and no station crewed for any of them** — a commit, a
   merge, and a recorded preview deploy. `studio.commit` appears **0 times in `driver.ts`**; Build is
   briefed only on `studio.stage`, step one of six. `ship` has never written a track-member row while
   `deployments` holds 42 successful ones. **This blocks the acceptance directly.** (F-36) — *S0.*
4. **The return edge does not fire.** The due-forecast queue exists and has processed **zero
   workspaces in its life** (F-51). Notion's shape is the model: give it a job, set a schedule, it
   comes back. Until this runs, `learn` starves and the brain starves with it. — *S0.*
5. **You cannot steer without restarting, and you cannot undo a step.** Devin lets you intervene at any
   point. We offer Start and Stop, which makes this a batch job. — *S1.*
6. **You cannot take a step over by hand and hand it back.** The 40-point gap between the ~60% of work
   people use AI for and the 0–20% they can fully delegate is exactly this, and it is what we sell
   into. — *S1.*
7. **"Was it worth it" has no surface.** Spend and token caps live on `agent_runs`; nothing shows cost
   and elapsed time against what was promised at the outset. **Value audit is one of the six verbs and
   it is entirely unbuilt.** — *S1 for the surface, S0 for the numbers.*
8. **Many teammates working at once is invisible.** Specced 2026-08-26 in
   [`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md). — *S2 for the layer, S0 for the
   derivation.*
9. **Evidence ingestion has never worked in production.** `scout_targets` is 0 in **21 of 21**
   workspaces, `scout_snapshots` is **0 rows ever**, `scout_runs` stopped 2026-07-25 after 98 runs that
   captured nothing — and `scout-tick.ts:78` returns `{ok: true, skipped: true}`, **a dormant pipeline
   reporting SUCCESS to `pg_cron`**, which is why a month passed unnoticed. Agents were told to gather
   evidence from a pipeline that has never delivered any, correctly reported there was none, and their
   honest reports hardened into 144 standing prohibitions. **Turning it on starts paid crawling against
   real sites, so S0 proposes it with the cost and the founder confirms the key — that one is money,
   and money stays his.** — *S0 to propose.*
10. **Search across work, and export.** Both untouched, both table stakes at the scale being aimed for.
    — *S3.*
11. **Nothing in the product ever RUNS in front of the person.** Ruled hybrid on 2026-08-26: both build
    paths ship, and one isolated-execution primitive serves five stations. **The two highest-value uses
    are not about code** — Decide proving its forecast's metric is readable today (without which the
    verdict can never land, and the grader has processed zero workspaces in its life), and Ship's
    preview deploy, which is precisely the proof R-27 gates production on and precisely what the loop
    cannot produce (F-36). Then Design's clickable prototype, Discover's connector dry-run, Learn's live
    verdict query, and last of all Build. Spec: [`SPEC-BUILD-PATHS.md`](./SPEC-BUILD-PATHS.md).
    — *S0 the primitive and every probe, S1 the surfaces, S3 the credit meter and connections.*
12. **The handback.** When somebody else's builder made the change, nothing brings the outcome back.
    Four mechanisms, cheapest first: paste a PR or deploy URL, a repository app reporting four events,
    the customer's own telemetry read one metric per forecast, and the handoff out as a formatted brief
    with the forecast travelling alongside it. **The load-bearing fact: the verdict is measured against
    the forecast, not against the code**, which is why bring-your-own-builder does not break the loop.
    — *S0, with S1 for the paste-back surface and S3 for connections.*
13. **The four integrations that carry the loop are not finished, while about twenty providers sit
    built.** `src/lib/connectors/providers/` already holds GitHub, GitLab, Jira, Linear, Slack, Figma,
    Stripe, Zendesk, Intercom, HubSpot, Salesforce, Canny, Productboard, Gmail and Outlook, plus a
    **generic MCP client**, and Supaprod is already an MCP server the customer's own agents can write
    back through. **So this is a wiring job, not a building job** — and the four that matter are an
    issue tracker in and out, the repository handback, one analytics source for the verdict, and Slack
    or email reaching a person who left. **Build those before the sixteenth evidence adapter.** And
    **an issue assigned to Supaprod in Linear or Jira should become a piece of work** — the gesture is
    native to the tool they already have open, so nothing needs teaching. Spec:
    [`SPEC-CONNECTORS.md`](./SPEC-CONNECTORS.md). — *S0, with S2 for the inbound column and S3 for the
    ask-in-place connect control.*
14. **Teammates cannot address each other, or you.** A station hands to the next and nothing says what
    was handed over; no teammate can tell another that its output is unusable; nothing can reach you
    where you already are. **Seven message types and no eighth** — handoff, ask, claim, challenge,
    escalate, broadcast — with the person as a participant rather than an audience: you `@` a teammate
    mid-flight and it takes the instruction without restarting, and only a message addressed to you
    interrupts you. **Challenge is the highest-value one and nobody ships it**: gap #1 made social, a
    station told its output is bad by something that did not produce it. It renders in the transcript
    that already exists (R-13) and adds no surface. Spec:
    [`SPEC-AGENT-COMMS.md`](./SPEC-AGENT-COMMS.md), whose §1 holds the falsifiable guard — **if
    teammates spend more tokens addressing each other than working, the feature comes out.**
    — *S0 the model, S1 the transcript and the composer, S2 claim and collision, S3 Slack consent,
    S4 the budget.*

**A gap you find that is not on this list is still authorised** if it passes the four-part test. Put it
in coordination/requests/, build it, and add it here with its evidence.

### The standard, stated so it can be failed

*"If OpenAI, Anthropic, Google, Perplexity, **Vercel** or **Linear** shipped this, how would it behave
on day one?"* The last two are the sharpest craft references available and the founder named them:
**Vercel** for surface craft, motion, empty states and the sandbox shape; **Linear** for speed,
keyboard-first density, and delegation-by-assignment done without inventing vocabulary. Not a mood —
these eight, and any one of them failing is a fail:

1. **It works the first time for someone who was told nothing.** No tour, no tooltip, no docs link.
2. **Work starts visibly in under a second.** Nothing blocks on a spinner past ~2s without saying, in
   plain words, what it is doing.
3. **No raw error ever reaches a person.** Every failure names the thing that failed and the next
   action. A refused station is not a failed station (R-26).
4. **Keyboard-first.** Everything reachable without a mouse; accessibility is not deferred (R-19).
5. **It survives being left alone** — tab closed, laptop shut, network dropped, session resumed. The
   work continues and the result finds them.
6. **One visual system, no orphans.** Meridian, ported from beautifului.dev, which is the floor and not
   the ceiling.
7. **It is honest.** No fabricated progress, no invented number, no seeded memory presented as
   learning. **This is the one the frontier gets right and imitators get wrong**, and it is the only
   item on this list that deletes a feature rather than sending it back.
8. **It gets out of the way.** The fewest possible decisions between the person and the outcome. Count
   them; every one you remove is the feature.

---

## 0.7 · The freeze — where no lane spends a unit. Ruled by the founder 2026-08-31.

**Founder, 2026-08-31:** *"All objectives of all five lanes should be on making our platform stronger.
Focus more on platform functionality, making it more agentic. Less on public-facing or low-impact
items — anything on the public landing page and anything associated with it. We can do it at a later
point in time. First make the platform stronger and more effective."*

§0.6 says where you MAY add. **This says where you may not spend**, and it is not a lane's judgement
call in the moment. **A unit that improves the frozen surface is rejected at S0's gate exactly as a
raw colour is.** The work may be good; it is the wrong work today.

### What is frozen

**Routes** — `index.tsx` · `product.tsx` · `pricing.tsx` · `faq.tsx` · `demo.tsx` · `film.tsx` ·
`investors.tsx` · `proof.tsx` · `trust.tsx` · `security.tsx` · `privacy.tsx` · `terms.tsx` ·
`subprocessors.tsx` · `updates.tsx` · `brief.tsx` · `ard.tsx` · `d.$slug.tsx` · `p.$slug.tsx` ·
`p.teardown.tsx` · `t.$slug.tsx` · `_authenticated.admin.landing.tsx`

**Components** — `src/components/landing/**` · `src/components/public/**` · `src/components/plg/**` ·
`src/components/supaprod/**` · `src/components/brief/**` · `src/components/product/**`

Measured 2026-08-31: **~3,900 lines of route and ~380KB of component** that no lane opens for
improvement until the acceptance in §2 is met.

### The four exceptions. Nothing else is one.

1. **A live public page states something false** — a number that no longer holds, a claim the canon
   retired, a capability we do not have. Fix the sentence, commit it alone, name the wrong claim in
   the unit file. **A correction, never a redesign: if the fix is longer than the claim, it is a
   redesign.**
2. **A legal, security or privacy page is wrong**, or omits something we are obliged to state.
3. **The page is broken** — a 500, a dead link, a route that no longer resolves, a build failure.
4. **The founder asks for it by name.** Then it is an instruction, not drift.

Everything else waits: a hero rewrite, a new beat, a motion pass, a pricing table, the waitlist, the
film, the investor page, an SEO sweep, a marketing empty state.

### The sixty seconds is measured SIGNED IN. This is the correction that matters most.

The second acceptance — *a person understands this inside sixty seconds and wants to come back* — has
been read as a landing-page test, including by this document. **It is not one.** It is measured from
**signup → the product already working**: the first paint of the signed-in surface, work visibly
starting, nothing to fill in first. **A landing page can neither pass nor fail it**, because the thing
being judged is whether the product explains itself *by doing something*. Anyone measuring it at
`index.tsx` is measuring the wrong surface.

### What "a stronger platform" means, so a lane can rank its own queue

When two items compete and neither is on a queue, take the one higher on this list:

1. **It makes a station do its job without a person** — self-check, retry, the return edge, the
   handback, the missing Build→Ship steps. This is the acceptance, and it has never once been met.
2. **It lets a person direct work without restarting it** — intervene, undo, take one step by hand and
   give it back, address a teammate mid-flight.
3. **It makes what the agents are doing legible** — the transcript as a channel, lineage drawn,
   presence read from rows, one board instead of seven doors.
4. **It carries the result to a person who is not looking.**
5. **It lets a company trust it with real work** — the boundary, ceilings, tenancy, audit trail,
   export, search.
6. **It makes a surface more pleasant.** Real, and last.

**Anything not on that list is not platform strength, whatever else it is.**

---

## 0.8 · Anthropic's AI-native SDLC playbook is our framework. Adopt by default.

### The ruling, founder 2026-08-31

*"Whatever this AI SDLC playbook Anthropic has published, we need to adopt it wherever possible.
That's a master thing for us. They are the ones leading the industry, so we go with them and push back
only where it does not fit. This is framework level."*

**The default is ADOPT and the burden of proof is on the refusal.** A session does not ask *"should we
take this?"* — it asks *"can I argue why not?"*, writes the argument into
[`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md) §4.2, and adopts if it cannot. **An unargued
departure is drift, and S0 rejects it at the gate.** Three refusals exist today; a fourth is allowed
and must be argued the same way.

**The commercial reason, which is sharper than "they lead the industry":** every team that follows
this playbook will hold `intent.md`, `spec.md`, `plan.md`, `CLAUDE.md` and `REVIEW.md` in their
repository. **If what Supaprod hands a builder is already those files, we are native to their pipeline
on day one and there is nothing to integrate.** Compatibility with the leader's format is worth more
than any format we could design — and it is gap #20 below.

The playbook is read, mapped station by station, and written down once in
[`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md), whose §4 is **the adoption register: every
artifact and every practice, each marked ADOPTED, ADOPTING, ADAPTED or REFUSED.** **Read that spec
before proposing anything at a station boundary, handoff, gate, metric or artifact. Never re-read the
post; it is already extracted.**

**The three facts a session needs from it:**

1. **Its central claim is canon §5N, published by the vendor** — *"code is no longer the bottleneck;
   the bottleneck moves to plan, review/test and deploy, which still run at human speed."* Ours was
   measured from the market, theirs argued from their own telemetry, **and neither cites the other.**
2. **Their six stages map cleanly onto our seven**, with two asymmetries that are both useful: they
   have no Discover (their pipeline starts with a person who already knows the problem — the harder
   half is ours), and they have a **Test stage we fold inside Build**, measured by *first-pass CI
   success rate*. **They count the thing we hide.**
3. **Nowhere in six stages, ten artifacts and eighteen measures is a prediction recorded before the
   outcome is known.** `intent.md` holds a *proposed outcome* — a goal, no horizon, no grade.
   `bands.yaml` holds a *baseline* — history. **The vendor has published the canonical shape of layers
   01 and 02 and left 03 empty**, which is where we are.

**And the instruction that follows from the risk:** the same post ships **Managed Code Review**,
**Claude Security** and **Claude Tag** into their Stage 5 and Stage 6 — our Ship and Learn. Those are
suppliers to layer 02 like every builder is, and we consume them. **A lane that builds a code-review
surface, a vulnerability-triage screen or a scheduled-scan feature is rebuilding something the vendor
now gives away. Say so before you start it, not after.**

### Gaps 15 – 19, authorised, continuing §0.6's ranking

15. **A forecast is a point and it should be a band.** `bands.yaml` carries a baseline, detection
    rules and **three response tiers — 1σ log, 2σ read-only diagnosis, 3σ open a change.** We record
    one number at Decide and grade it once at horizon, which is why the grader has never usefully
    fired. The band is the missing half of Decide's metric probe (gap #11), not a new probe. A band
    from too few observations must say so; **a tier firing on noise is theatre.**
    — *S0 the columns and the tick, S1 the surface.*
16. **Nothing entering Discover has a shape.** `intent.md` carries five fields — problem statement,
    proposed outcome, affected users and systems, constraints, **open questions**. A track enters at
    `sense` as a slug, and ~46 died there. The last field is the one we would not have thought of: it
    is what makes a handoff honest rather than confident. — *S1 the surface, S0 the schema.*
17. **We built the value-audit instrument and never read it.** Every one of their leading indicators
    is the gap between two committed artifacts' timestamps, and `spine_track_members` already holds
    ours. Gap #7 calls value audit entirely unbuilt; **the mapping table in `SPEC-AI-NATIVE-SDLC.md`
    §3 D is that surface's content, and every row is a query against data we already have.**
    — *S1 the surface, S0 the numbers.*
18. **Nothing anywhere says what counts as DONE.** Their `REVIEW.md` is written by the customer's tech
    lead: the review passes, the severity definitions, the exclusions. Ours are hardcoded by us.
    **"What it's allowed to do" answers what agents may DO; this is the other half**, and it is the
    question a company actually argues about. One more section on a page already queued. — *S3.*
19. **A gate should be declarable, and an approval should name its approver.** Their hooks exit
    0 allow / 1 ask / 2 block, and a production deploy requires **a named approval**. Keep
    `resolveApprovalPolicy`'s inference — it is good and it is now wired at
    `src/lib/approvals-queue.functions.ts:1904` — and put a declared rule above it.
    `agent_approvals.decided_by` is NULL on **18 of 176** answered calls, which is the same hole from
    the other side. — *S3 the surface, S0 the engine.*

20. **What we hand a builder should BE their files, named their names — and this is the largest of
    the five.** `SPEC-BUILD-PATHS.md` rules the hybrid handoff and never says what the handoff looks
    like. The playbook answers it: Discover and Decide emit **`intent.md`** (plus our forecast block,
    which theirs has no field for), Plan and Design emit **`spec.md`**, Build emits **`plan.md`**, and
    the handback reads their **`REVIEW.md`** to know what the outcome had to clear. **Not a new
    station and not a new surface** — the serialisation of artifacts `spine_track_members` already
    holds. **A team on the playbook drops our output into their repo and their agent picks it up with
    no adapter.** — *S0 the emitters, S1 the copy-out control (queue item 24 already wants this).*
21. **A hook the agent cannot edit around.** Theirs prevents an agent editing test files during a fix.
    We have shipped tests that asserted nothing and a suite that printed a hardcoded pass. Cheap, and
    the finding is already paid for. — *S0.*
22. **They count the thing we hide.** They have a Test stage; we fold the check inside Build. **We do
    not add an eighth station** — the spine, the acceptance query and R-14 all key on seven. **We
    adopt the substance: the self-check becomes visible and counted**, as *stations passing their own
    check without a retry*, on the value-audit surface. — *S0 the count, S1 the surface.*

23. **Station briefs become versioned skills, and this is the precondition for layer 03.** Warp's
    pattern is the first implementable shape for *"learns, then guides"* we have seen anywhere: an
    **inner skill** does the work; an **outer improver skill** reads accumulated feedback on a
    schedule, compares what the agent suggested against what the human actually did, and **proposes a
    targeted edit to the inner skill** as a file, merged or rejected through normal review.
    Anthropic's **Skills API** is the versioning. **Ours would be sharper than theirs for a structural
    reason: Warp's improver learns from a thumbs-down; ours would learn from a graded forecast** —
    not *"somebody disliked this"* but *"this station predicted X, the world did Y."* That is
    calibration rather than preference-fitting. **SEQUENCING IS NOT OPTIONAL: gap #15, then gap #4,
    THEN this.** An improver with no graded forecast to read is a machine that learns from nothing,
    which is the failure that produced 133 of 133 seed `learnings` rows. — *S0.*
24. **A golden set, and S4's verdicts are its cases.** The startup guide's third principle is *trust,
    but verify*, and its mechanics are a golden set of verified pairs, back-testing before deploy, and
    *"every change made against a versioned set of instructions and tested against the records that
    failed."* **We have none.** S4 proves claims one at a time by hand, which is high quality and does
    not scale past one session. **Build it from real graded runs** — a golden set built from a broken
    pipeline encodes the breakage. — *S4 proposes, S0 holds.*

**Also adopt, without a gap number because they land inside work already owned:** the return edge's
published shape (a missed forecast becomes a **normal, refusable** piece of work at Discover, not a
special object — gap #4, S0), and the inbound gesture's refinement (**the size of the response is
decided by the work, not the channel**: small comes back as a change, large enters at the front —
gap #13, S0 · S2 · S3).

### The three refusals, and each is argued in `SPEC-AI-NATIVE-SDLC.md` §4.2

**Everything else in the playbook is adopted.** Plan mode, parallel worktrees, subagents, scoped CI
credentials, MCP-exposed tools, hooks as gates and their whole measurement set are **already ours or
being taken.** The refusals are three and they are narrow:

1. **We do not generate the code** (canon §5N). **Narrow: we refuse to build, not to speak the
   format** — gap #20 adopts every Stage 3 artifact and still hands the building out.
2. **We do not own the customer's `CLAUDE.md` or `.claude/skills/`.** We **read** them where a
   connector reaches the repo, and may **propose** a change through their own review. Writing them
   silently is the fastest way to lose a repository connection.
3. **We do not renumber our seven stations to their six** — but we pay for that refusal: **the mapping
   becomes a translation the product speaks**, so a customer asking "where is my `spec.md`" is
   answered in their words. Refusing a rename is not refusing the vocabulary.

### The standing watch, and it is S0's — monthly, and it is cheap

**If Anthropic records a forecast, layer 03 closes.** If `intent.md` gains a horizon and a grade, or
`bands.yaml` gains a *predicted* band rather than a historical one, we become a workflow product in a
market with four vendors. **Once a month, S0 re-reads the playbook and the Skills/Files API changelog
and checks one thing only: does anything now record a belief before the outcome is known?** Write the
answer with its date into [`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md) §5. **A watch nobody
schedules is not a watch.**

**And the risk that is far more likely than that one:** a good framework becomes a reason to
re-architect instead of ship. **73 tracks, 71 entered at `sense`, and the acceptance has never once
been met.** Ten new gaps and a strategy document are exactly what that failure looks like from the
inside. **Only #15 and #4 move the acceptance. Everything else waits behind them**, and a session that
opens with artifact emitters rather than the forecast band is this risk happening. The full analysis,
with what each shift costs us and what we kill, is
[`../docs/strategy/ai-native-sdlc-rewiring-2026-08.md`](../docs/strategy/ai-native-sdlc-rewiring-2026-08.md).

---

## 1 · What "truly agentic" means here, stated so it can be failed

Five properties. Each is falsifiable. A surface that has fewer than all five is a dashboard with a
chat box, which is what every competitor already ships.

1. **It starts without a form.** One sentence in. No project to create first, no connector to pick,
   no template, no settings visited. Antigravity required a project, measured it, and shipped the
   bypass. If your surface asks a question before it does anything, cut the question.
2. **It keeps going without you.** It holds a stated authority — a spend ceiling, a blast radius, a
   tool set, an expiry — and acts inside it without asking. `resolveApprovalPolicy` and
   `autonomy-policy.ts` already exist with **zero callers**. When it reaches the edge of that
   authority it asks **in place, once**, and the answer widens the authority for the whole class,
   never for the single instance. 90 queued approvals since July, zero ever answered, is what the
   other shape produces.
3. **You can see it think, and what you see is true.** Not a spinner and not a step label on a timer.
   The actual act, named in plain words, derived from a row that exists — `agent_runs`,
   the newest `tool_calls`, `spine_tracks.last_hold`. **A state the data cannot prove is a state you
   do not draw.** This repo has already failed a branch for a timer advancing step labels. Theatre is
   the one regression that ends a feature rather than fixing it.
4. **You can steer it without restarting it.** One instruction back into work that is still moving —
   *"the empty state is wrong"* — and it takes it. Undo a step, not the run. Take over a step by hand
   and hand it back. If the only controls are Start and Stop, it is a batch job.
5. **It comes back on its own.** The verdict arrives on the horizon date, unasked, and says what was
   predicted beside what happened. The person never goes looking for it.

**The parallel property, which is the new bet:** more than one piece of work is moving at once, and a
person can see, in one glance, what is running, who owns it, what changed in the last minute, and
where two efforts are about to collide. We are living that problem right now with four worktrees on
one repo. **Build the thing we wish we had while we build it.**

---

## 2 · The acceptance. Nothing else counts as done.

R-18, unchanged and unsoftened:

**One piece of work enters at `sense` and completes all seven stations — sense, decide, define,
design, build, ship, learn — driven entirely by agents, no human touching it mid-run, watched on one
screen, ending with a verdict that names what was predicted beside what happened.**

Measured query, and only this one:

```sql
SELECT id, entry_station, station, waived, created_at
FROM spine_tracks
WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]';
```

**CORRECTED 2026-08-26 (F-90): `is_sample = true` means "a demo fixture, and NO tick may spend a
model call on it" — the sweep SKIPS those workspaces.** `track-tick.ts:85` excludes them by id
through `sampleWorkspaceIds`, which selects `.eq("is_sample", true)`. Earlier wording here and in
`CLAUDE.md` said it meant *"the sweep may drive here"*, which is backwards, and it is a flag that
gates real money. **That also makes an `is_sample = true` workspace the guarded place for an e2e
spec to write** — the sweep provably will not drive it (F-89).

Never ask the acceptance through `workspaces.is_sample` — the obvious form returns
a false 1 (F-61/F-71).

> **CORRECTED 2026-08-26 (F-79). THAT QUERY NOW RETURNS 1, AND THE ACCEPTANCE IS STILL NOT MET.**
> Track `d1168015` walked all seven on 2026-08-25 — six `stage_events`, every one `actor='system'`
> and `driven_via='sweep'`, so nobody pressed anything. **But approval `bdf32286` was raised against
> its Build mission at 18:11 UTC and rejected at 18:48 UTC**, 2 days 23 hours before `expires_at`, so
> a person answered a boundary call mid-run. R-18 says *no human touching it mid-run*. The query
> above cannot see that, and `agent_approvals.decided_by` is **NULL**, so the row cannot even name
> who. **Anyone running the short form today reports the first acceptance in three months and is
> wrong.** Ask this instead, and it returns **0**:

```sql
WITH walked AS (
  SELECT id FROM spine_tracks
  WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]'
    -- ARRIVED AT LEARN IS NOT GRADED AT LEARN (F-131, 2026-08-27). `status` is
    -- written 'done' only when the route completes; a track waiting on its
    -- forecast holds `needs-evidence` at 'learn' with status 'open'. F-104's
    -- real forecast is due 2026-10-15, so without this the FIRST run that
    -- actually worked would report the acceptance met for two months before
    -- anything was graded. Changes nothing today: both learn tracks are 'done'.
    AND status = 'done'
)
SELECT count(*) FROM walked w
WHERE w.id NOT IN (            -- nobody answered a boundary call mid-run
        SELECT m.track_id FROM spine_track_members m
        JOIN agent_approvals a ON a.mission_id = m.artifact_id
        WHERE a.decided_at IS NOT NULL)
  AND w.id NOT IN (            -- and nobody pressed a transition by hand (F-55)
        SELECT entity_id FROM stage_events WHERE driven_via IS DISTINCT FROM 'sweep');
```

The older reading — **0 of 93 tracks in three months** — remains the honest state of the loop. One
other track sits at `learn`: it entered at `define` with sense and decide waived, carries no
forecast, and proves the machinery rather than the loop.

**Second acceptance, added by the founder 2026-08-26 and equal in weight:** a person who has never
seen this product opens it, and inside sixty seconds — without being told anything — knows what it
is doing for them and wants to come back. Judged by the founder on the running product, not on a
description of it.

---

## 3 · The five sessions and what each owns

Ownership is by path and it is absolute. **Two writers on one path is what broke `main` on
2026-08-22.** If you need a file outside your prefix, file a request file in coordination/requests/<you>/. Never reach in, not
even for a one-line fix, not even when you are certain.

| | Runs on | Worktree / branch | Owns (writes) |
| --- | --- | --- | --- |
| **S0 · CONDUCTOR** | Claude Code | `Supaprod` / `main` | `src/lib/**` · `src/routes/api/**` · `src/components/meridian/**` · `src/components/ui/**` · `supabase/**` · `docs/**` · `the-first-run/**` · `coordination/**` |
| **S1 · THE RUN** | OpenCode | `supaprod-run` / `lane/run` | `src/components/track/**` · `spine/**` · `presence/**` · `decisions/**` · `learn/**` · `ask/**` · `discover/**` · routes `track.$trackId` `start` `decide` `learn` `discover` |
| **S2 · MISSION CONTROL** | OpenCode | `supaprod-control` / `lane/control` | `src/components/shell/**` · `runs/**` · `today/**` · `observe/**` · `crew/**` · `agents/**` · `traces/**` · `mission/**` `missions/**` · routes `_authenticated.tsx` `today` `runs.*` `missions.*` `cockpit` `fleet` `swarm` `observe` `traces*` `agents` `crew` |
| **S3 · THE PLATFORM** | OpenCode | `supaprod-platform` / `lane/platform` | `src/components/onboarding/**` · `settings/**` · `billing/**` · `admin/**` · `system/**` · `governance/**` · `engine-room/**` · `connections/**` · `plg/**` · `public/**` · `landing/**` · `src/styles/**` except `meridian.css` · routes `settings` `onboarding` `admin.*` `integrations` `notifications` `boundary` `govern` `guardrails` `engine-room` `budgets` `approvals` `login` `signup` `forgot-password` `checkout*` |
| **S4 · THE PROVING GROUND** | OpenCode | `supaprod-proof` / `lane/proof` | `e2e/**` · `docs/lanes/verify/**` — **and nothing in `src/` at all** |

**Everything not listed is read-only to everyone but S0.** Read the whole repo freely; write only your
prefix.

**[`SURFACE-MAP.md`](./SURFACE-MAP.md) is the complete version of this table** — all 113 product
routes and all 50 component directories, each with an owner and a disposition (keep, fold, delete, or
audit-first). **Nothing is unassigned.** If a path is not in it, it was added after 2026-08-26 and
needs an owner before anyone writes in it.

**Why S4 writes no product code at all.** R-11: a lane never signs off its own work. Every session
has an incentive to believe its own unit shipped, and this repo has paid for that belief repeatedly —
a "Round 8 proven" claim whose two cited tracks were `sense`/`abandoned`, a spec that detected
stations with `pageContent.includes()` against a strip rendering all seven names, twelve tests naming
one surface that turned out to be one broken precondition. S4 exists to make claims expensive. It
cannot fix what it finds — it can only prove it, name it, and hand it back. **A session that could
patch what it found would stop looking.**

**Why the brain and the engine room are not their own session.** Both are answers to the question
"where does this concept live", and `THE-ONE-SCREEN.md` already ruled it: the brain is a line inside
the run before a decision, not a page — so it belongs to S1. The engine room is one sentence in the
footer and one settings page — so it belongs to S3. Measured 2026-08-25: 133 of 133 `learnings` rows
are seed, the four brain tools have zero calls across 2,652 agent runs, and `decisions.cited_by_count`
is 0 on all 355. **A fifth session building brain surfaces would be building rooms for furniture that
does not exist.** The brain earns its first pixel when the first real learning exists.

---

## 4 · How five worktrees talk to each other — git, and only git

**Founder's ruling, 2026-08-26: "this communication needs to be established only through GIT, because
that is the only common channel for all of you."** An earlier draft of this section proposed a local
directory outside the repo as a fast side-channel. **That is retired.** It was invisible to anything
but this one Mac, it left no record, and a second channel is a second place to forget to look.

**Everything goes through git. All of it. And the design that makes that work is one writer per
path** — no two sessions ever write the same file, so there is never a merge, never a lock, and never
a lost write. A file three sessions write is a file three sessions lose; that already happened here,
three handoffs overwritten inside ten minutes.

| Path | Who writes it | What it is |
| --- | --- | --- |
| `docs/lanes/NOW-<S>.md` | that session only | **One line**, rewritten every unit. The merged view of the whole fleet is `cat docs/lanes/NOW-*.md` |
| `docs/lanes/log/<S>.md` | that session only | Append-only unit history. Merged view: `cat docs/lanes/log/*.md \| sort` |
| `docs/lanes/QUEUE-<S>.md` | **S0** only | The next items. That session reads, never writes |
| `coordination/requests/<S>/*.md` | that session only | Anything only S0 can do: a DB count, a deploy, a migration, a design reference, a ruling, a blocked path |
| `coordination/answers/<S>/*.md` | **S0** only | The answer, naming the committed path of anything it produced |
| `docs/lanes/verify/*.md` | **S4** only | Verdicts |
| `docs/lanes/BUILDLOG.md` | **S0** only | The rolled-up narrative. **No lane writes it any more** |
| `docs/design/reference-2026-08-26/**` | **S0** only | Mobbin pulls, committed so the lanes can see them |

### The cadence

**Before every unit** — not once at session start:

```bash
git fetch origin && git rebase origin/main
cat docs/lanes/NOW-*.md                 # what every other session is on, right now
cat coordination/answers/<you>/*.md     # anything S0 answered since your last pull
cat docs/lanes/QUEUE-<you>.md           # what is next
```

**If another session's NOW line names what you were about to start, do not start it.** Take the next
item and say why in your own NOW line. That is the entire purpose of the file.

**After every unit:** rewrite your `NOW-<S>.md`, append to `log/<S>.md`, commit explicit paths, push.
**Pushing is how you speak.** An unpushed commit is a thought nobody heard.

**S0, every unit:** read every `coordination/requests/*/`, answer within one unit, and keep every lane
holding at least two fully specified queued items. **A blocked lane is S0's failure, not the lane's.**

### Branches

Each lane lives on its own branch and pushes every commit: `git push -u origin HEAD`. **S0 is the only
session that merges into `main`** — Lovable deploys from `main`, so a lane pushing straight there
ships a half-finished surface to production. **Verify on the merged tree, never on your own:** five
worktrees means every session can report "clean" against a tree that exists nowhere.

## 5 · Sync first, then work safety. Both non-negotiable.

### The first command of every session, and of every unit inside it

```bash
git fetch origin && git rebase origin/main      # lanes, on your own branch
git pull --rebase origin main                   # S0, on main
```

**Founder's instruction, and it is binding: no session starts work without syncing to `main` first.**
A lane that does not pull is editing stale files, and its "clean" verification is measured against a
tree missing four other sessions' work. This is not a nicety — three worktrees each reported green
against a tree that did not exist anywhere.

Do it again **before every unit**, not once at session start. Five sessions push continuously; a
thirty-minute-old checkout is already behind. And a behind-count is measured against your branch's
configured upstream rather than against `main`, so fetch and rebase explicitly rather than trusting a
status line.

If the rebase conflicts inside your own prefix, resolve it. If it conflicts **outside** your prefix,
you have written where you should not have — stop, take yours out, and file an ask.

### Work safety

The founder closes the laptop mid-session and nothing may be lost.

- **Commit after every logical unit, and never work longer than ~45 minutes without one.**
- `git commit -F <message-file>`, **never** `-m`. zsh evaluates backticks in `-m` and has silently
  deleted words from commit messages here.
- **`git add -A` is banned.** Stage explicit paths only. The index may already hold changes you did
  not stage — 25 film masters nearly shipped inside a component port that way.
- **Push on every commit.** An unpushed local commit looks exactly like shipped work and is not.
- **Commit before you start any long gate** (`bun test`, `bunx tsc --noEmit`, a build). A validated
  edit set was reset away mid-typecheck by another session.
- On start, and after any interruption: `git status` first, resume from uncommitted work, never from
  zero. Read your own `heartbeat` and your last three commits before deciding anything.
- **The dev server stays off (R-21).** Start it only for a browser check, stop it the moment that check
  is done. Check nothing is already listening first. Three servers on this laptop has frozen it and
  forced a restart. A unit is not finished while a server it started is alive.

---

## 6 · The two gates every unit passes before it is called done

Neither is advisory. Correct-and-cheap-looking is rejected exactly as beautiful-and-leaking is.

**ENTERPRISE.** Tenant isolation (`workspace_id` on every read and write). Permission checked, not
assumed. An audit trail for anything that changes state. A failure that names what failed and what to
do about it. No secret, no PII, in a log or a URL.

**DESIGN — R-20's eight, and a reviewer must be able to point at the one that failed:**
restraint (count the accents; more than one live signal is a fail) · rhythm (one spacing scale, one
grid, optical edges aligned) · type (Meridian scale only; a hardcoded size is a fail) · motion that
reports rather than decorates (a raw duration is a fail; use `--mrd-ease` / `--mrd-d-*`) · a designed
sad path (empty, loading, failed, held, permission-denied; an empty state that does not say what to do
next is a fail) · no dead end (every surface offers the next action) · ported not eyeballed
(beautifului.dev is the **floor**, mechanics from its real source, never from a screenshot) · density
that earns its space.

**And the Meridian duty:** per region, ask *which Meridian component serves this?* A bespoke div where
a primitive exists is a fail. 121 components, 95 adopted, 17 built with no importer — including
`run-rows.tsx`, 22.8KB of run vocabulary that three surfaces each reinvented around. **Adoption must go
up.** If no `--mrd-*` token fits, that is a gap in Meridian: file an ask, do not invent a token.

**Before you add a component, name in your unit file which existing one you checked first and why it
did not serve.** A unit that cannot answer that is rejected. `TrackActivity` and `TrackChain` were
built to a founder ruling, sat with zero importers for 24 days, and the founder re-requested the same
thing unaware it existed. **The default move is always: wire what exists.**

---

## 7 · Tools. Use all of them, aggressively.

Scan the session reminder for every available skill, agent, plugin, MCP and extension **before** each
piece of work, and pick the best fit regardless of namespace. Never invoke from memory. Specific ones
that matter here:

- **Subagents:** parallelise every audit, sweep and multi-file read. If a task is "look at N things",
  spawn N readers rather than reading them yourself.
- **Playwright MCP** (all sessions): drive the real UI. Note that a spec pressing production creates
  production rows — six duplicate tracks once starved the very run we were watching. **Point Playwright
  at a local dev server you start and stop, or at a guarded workspace S0 names. Never at production.**

  > **THE GUARDED WORKSPACE, NAMED 2026-08-26 (F-89/F-90):
  > `b90da531-34aa-4009-bcce-2162b87f50ac` — "Sample sandbox".**
  >
  > It carries `is_sample = true`, and **that is what makes it safe**: `track-tick.ts:85` excludes
  > sample workspaces by id through `sampleWorkspaceIds` (`.eq("is_sample", true)`), so **the sweep
  > provably will not drive anything a spec creates there.** No model spend, no drive slots taken,
  > no starving a real track.
  >
  > **This is not optional and the guard has already failed once.** On 2026-08-26 a
  > `phase-3-visible-agency` run wrote **10 real tracks** into the LIVE workspace
  > `60000000-…` — the same one holding the closest acceptance attempt this product has had — and
  > **8 of the next 10 sweep drives went to them** (F-89). A local dev server talks to the Lovable
  > production database through `.env`, so "Track created" in a spec's output is a production row.
- **Mobbin MCP** (S0 certainly; try it in OpenCode, and if it is not there say so and file an ask):
  600k screens from teams who ship world-class product. Pull patterns for agent presence, live
  progress, parallel work, onboarding, empty states. **Port mechanics, never screenshots.** S0 commits
  what it pulls into `docs/design/reference-2026-08-26/` so the lanes have it.
- **Lovable MCP — S0 only.** It is the only path to the database and the only deploy path. Lanes have
  no database. Anything needing a row, a count, a migration or a deploy is an ask.
- **Model policy, and say which you are using:** framing, audits, architecture and product calls →
  the strongest reasoning model you have. Multi-file implementation, refactors, hard debugging → your
  main coding model. Mechanical edits, docs, config, tests → the cheap fast one.

---

## 8 · Reporting — one line everyone can see, and no two sessions writing one file

The founder asked for a shared one-liner per lane so that every session, on its next fetch, can see
what the others are on and not duplicate it. **The design constraint is that a file three sessions
write is a file three sessions lose:** on 2026-08-25 three sessions closed within ten minutes and each
overwrote the others' handoff.

**So: one file per session, single writer, and the merged view is a `cat`.** Same law as section 4.

### `docs/lanes/NOW-<S>.md` — exactly one line, rewritten by its owner every unit

```
S2 · 13:40 IST · WORKING · runs board: folding cockpit+fleet+swarm into one board · src/components/runs/** · 83b2070ac
```

`<session> · <time> · WORKING|BLOCKED|DONE|DEVSERVER · what, in a few words · the paths you hold · last commit`.

**`DEVSERVER` is not optional.** While you hold a dev server, say so here, and clear it the moment you
stop it — five sessions on one laptop is how this machine gets driven to a restart, and the NOW files
are the only way you can see each other's load.

**Read every other lane's line before you pick up anything**, which after a fetch is one command:

```bash
git fetch origin && git show origin/main:docs/lanes/NOW-S0.md origin/main:docs/lanes/NOW-S1.md ... 2>/dev/null
# or simply, after the rebase:  cat docs/lanes/NOW-*.md
```

**If another lane's line names what you were about to start, do not start it.** Take the next item
instead and say why in coordination/requests/. That is the whole point of the file.

Sub-minute latency lives on the local bus (`docs/lanes/NOW-<S>.md`), which does not need a
push to be visible. The `NOW-` file is the durable version that survives a fetch from any worktree.

### `docs/lanes/log/<S>.md` — your own append-only history

Append one block per unit. **Your own file, so it never conflicts.** The merged history is
`cat docs/lanes/log/*.md | sort`. S0 rolls the narrative up into `docs/lanes/BUILDLOG.md`; **no lane
writes BUILDLOG.md directly any more.**

```
### <S> · <ISO time> · <unit id> — <one line>
WHAT: what changed, with paths
WHY IT MATTERS TO A USER: the answer to §0 questions 1 and 2, in one sentence
CHECKED FIRST: the existing component or function considered, and why it did not serve
GATES: enterprise pass/fail · design pass/fail (name the failing one of the eight if any)
PROOF: the command run, the route opened, the screenshot path — or "not verified", said plainly
NEXT: the next unit
COMMIT: <sha>
```

**A number without its query is not evidence.** Record the SQL, the command, the `file:line`. Three
metrics that proved the product worked were all seed data, and nobody could re-check them because no
query was written down.

**Report honestly.** If a test fails, say so with the output. If a step was skipped, say that. Never
report progress as completion, and never describe the remaining distance as smaller than it is.

## 9 · What the frontier actually ships, and the three things it does that we do not

_Researched 2026-08-26. Ported as mechanics, per R-20 §7 — never as screenshots._

| Product | The mechanic that works | What we take |
| --- | --- | --- |
| **Claude Code** | The primary surface is a **transcript**, not a dashboard. Capability is layered — memory, hooks, skills, subagents, MCP — and each layer appears only at the moment it is needed; the user never meets a shelf of them. Permission mode is an **autonomy dial set once**, not a question asked per action | Confirms R-13: the left pane is the transcript. The footer is the dial. Connectors and skills are reached at the moment of need, never browsed first |
| **Codex in ChatGPT** | A command centre with **built-in worktrees**: queue many tasks, each in its own sandbox, results arrive as **separate reviewable pull requests**. Async by default — submit and leave, results come to you | S2's shape exactly. And the returned unit is reviewable — a diff, a decision, a spec — never "status changed to design" |
| **Cursor 2.0 / Composer 2** | Parallel tool calling: reads up to 15 files simultaneously before editing. The agent determines its own next steps without step-by-step prompting | Show the fan-out. When five things are being read at once, that is more convincing than any spinner — and it is true |
| **Replit Agent 4** | Parallel execution across isolated micro-VMs, and it **builds *and verifies* before letting you test**. Fewer round trips, longer first build, and the user prefers it | **The single most important one for us.** See below |
| **Devin** | A persistent environment you can watch live and **intervene in at any point** to redirect. A self-debugging loop: read the error output, reason about the cause, apply a fix, rerun | Steer without restart. And the self-debug loop is precisely what our stations lack — they stall at `MAX_STATION_ATTEMPTS` instead of reading their own failure |
| **Manus 1.6** | Chat Mode beside Agent Mode: **the user picks how much autonomy this particular task gets** | The footer mode becomes choosable, not just reported |
| **Linear** | You delegate by **assigning the issue to the agent** — the gesture people already know. Many in parallel, progress monitorable | Zero new vocabulary. Never teach a verb the user already has |
| **Notion 3.3 Custom Agents** | Give it a job, set a trigger or a schedule, it runs unattended | This is exactly the `learn` return edge: a scheduled agent that comes back when the horizon closes |
| **Amoeba** | "Many, coordinated" agents on one project with shared visibility, **collision detection**, clear ownership, Mission Control, and *guide / take over / spawn parallel help* | S2's brief, close to verbatim |

### The three things all of them do that Supaprod does not

1. **They verify before they hand over.** Replit builds and tests before you see it; Devin reruns until green; Codex returns a PR that passed checks. **Our stations produce and advance regardless of whether what they produced is any good** — which is the whole reason 46 tracks sit in a `sense` graveyard and the honest acceptance query has returned 0 for three months. A station that cannot check its own output is not autonomous, it is merely unattended.
2. **They let you leave.** Async is the default and the result comes to you. Gemini's line is the model: *"I'm on it — you can leave this page in the meantime."* Ours currently requires a person to sit and watch, and calls that "visible agency". Visible must not mean mandatory.
3. **They borrow a gesture the user already has.** Assign an issue. Review a diff. Merge a PR. We invented seven station names and put them on screen — which is exactly what R-01 forbids and R-13 replaced. **If a surface teaches vocabulary, it has already lost the sixty seconds.**

---

## 10 · Testing and validating is half the job, not the tail of it

The founder's instruction, and it is binding: **do not just build, add features and move on.** This
repo's characteristic failure is not bad code. It is confident claims about code that was never
driven. Three examples that each cost a week: a "Round 8 proven" claim whose two cited tracks were
`sense`/`abandoned`; a spec that detected stations with `pageContent.includes()` against a strip
rendering all seven names; three headline metrics proving the product worked that were all seed data,
unre-checkable because nobody wrote down the query.

**The rules, for every session:**

- **A unit is not done when it compiles. It is done when it has been driven.** Open the route, take
  the action a user would take, and record what happened. `bunx tsc --noEmit` and `bun run lint`
  passing is not a gate here — `bun test` holds the invariants, and even green tests are not a driven
  surface.
- **Watch a run; do not only read the code.** Three of five defects found in one night came from
  driving a real track. Code review had missed all three for weeks.
- **Assert on what your fix uniquely controls, across two cycles.** A fast empty tick looks identical
  whether your filter worked or the work was simply held.
- **A test name says what it intended to reach, not what it reached.** When many tests naming one
  surface fail together, suspect one broken precondition, not many bugs.
- **Suspect the instrument when a known-good control fails as badly as the broken case.**
- **Never pipe a gate into `tail`** — it returns `tail`'s exit code and `main` has shipped red that
  way. **The 12 pre-existing test failures are known: do not claim them and do not silently fix them.**
- **S4 is the adversary and its verdict outranks the builder's.** A unit S4 cannot reproduce is
  reopened, whatever the buildlog says.

**If a credit, quota or auth limit stops you** — Lovable token expiry, an MCP that will not connect, a
model quota — **say so in one line in coordination/requests/ and switch tools rather than reporting a blocker.**
Playwright, chrome-devtools and the Chrome plugin are three separate paths to a browser. Only a
credential boundary is a real blocker, and for those the founder has granted standing authority to
re-authorize: file the ask, name exactly what you need, and keep working on everything that does not
depend on it.

---

## 11 · The persona, and the capability register — CORRECTED 2026-08-26

**Correction, and it is mine to own.** An earlier draft of this section said the six verbs *replace
the station names on screen*. **That was wrong and the founder rejected it.** The stations —
Discover, Decide, Plan, Design, Build, Ship, Learn — are how the work moves and they stay exactly as
they are. Nothing here renames or removes them.

### The persona

**Founder, 2026-08-26:** *"If I have to deliver my work and the entire thing is taken care of by AI
teammates, they have to assign, manage, operate, value-audit, review and ship."*

**The user is the person accountable for an outcome who is not doing the work — a delegator whose
team is AI teammates.** They do not walk a lifecycle. They run a team they do not want to
micromanage. That is a different person from the one the seven stations were drawn for, and both are
true at once: the stations are how the machine moves the work, the delegation is how the person
experiences it.

### What the founder was actually naming: the capability register

Those six are **things an AI teammate must be able to do**, not labels for anything. And the founder
was explicit that the list is not closed: *"there might be n number of other tasks which an agent
might want to do from our platform perspective."* So this is a register, it is open, and **every
session adds to it as it finds a capability the teammates need and do not have.**

| Capability | State today | Owner |
| --- | --- | --- |
| **Assign** — hand a piece of work to a teammate | Partial. `/start` takes a sentence; assignment from elsewhere does not exist | S1 |
| **Manage** — sequence, reprioritise, see what is stuck | Missing as a surface | S2 |
| **Operate** — act inside a stated authority without asking | Engine exists, **zero callers** (`resolveApprovalPolicy`, `autonomy-policy.ts`) | S3 |
| **Value-audit** — was it worth what it cost | **Entirely unbuilt.** Spend caps live on `agent_runs`; nothing shows cost against what was promised | S1 + S0 |
| **Review** — check what came back, respond in place | Partial. The right pane exists; approve / one-instruction-back / undo do not | S1 |
| **Ship** — let it out, gated by proof not a click | Blocked. Three missing steps between Build and Ship, no station crewed for any (F-36) | S0 |
| **Verify its own output before handing on** | **Missing, and it is gap #1.** Stations advance regardless | S0 |
| **Hand off with context** — pass to another teammate and say what was passed | Data exists, never drawn | S2 |
| **Sync** — see what another teammate already has, and not redo it | Missing. This is the collision case | S2 |
| **Ask** — escalate to a person, in place, once, answer covers the class | Partial. `TrackConsent` exists; 90 queued asks died detached from the work | S1 |
| **Refuse** — say the door is locked and which one, without retry theatre | Ruled (R-26), partly wired | S1 |
| **Recall** — check what was learned before deciding | Tools exist with **zero calls across 2,652 runs** | S0 |
| **Schedule** — come back when the window closes | Queue exists, has processed **zero workspaces** (F-51) | S0 |
| **Notify** — reach a person who left the page | **Missing entirely.** Gap #2 | S3 |
| **Hand back** — let a person take a step by hand and return it | Missing | S1 |
| **Undo** — revert a step without restarting the run | Missing | S1 |
| **Report cost** — what this spent, in money and time | Data exists, no surface | S1 |

**Add a row when you find one.** A capability a teammate needs and does not have is a real gap under
§0.6 and is authorised — it does not need a new destination, so it does not conflict with §0.5.

Full derivation, with sources and the nine-product teardown it came from:
[`docs/research/agentic-product-patterns-2026-08.md`](../docs/research/agentic-product-patterns-2026-08.md).
**Read it before any "make it more agentic" work.** It exists so nobody pays for that sweep twice.

---

## 12 · Plain words. The naming law, and it is cross-surface

**Founder, 2026-08-26:** *"At the platform level — Engine Room, safety and other things — those look
like rattling words. It's not to the point. How can I make it simple so people literally understand,
rather than rattling it? Use the words that are commonly understood, across every surface, not just
one section."*

**The law: if a person would not use the word out loud to a colleague, it does not go on a surface.**
Not in a nav item, not in a heading, not in a button, not in an empty state, not in a toast. This is
not a copy pass on one page — **it is cross-surface, and a session that renames a thing in its own
prefix and leaves it stale elsewhere has made the problem worse.** Grep the claim, not the spelling:
one word travels under seven wordings and escaped six sweeps in a day.

### The stations keep their names, because they are already plain

Discover · Decide · Plan · Design · Build · Ship · Learn. Those are ordinary words and everyone knows
them. The internal slugs (`sense`, `define`) never appear on a surface; the surface names above do.
**This section is not about them.**

### The rename map — jargon out, plain words in

Proposed by MAIN under the founder's grant. **S0 rules on each row and owns the sweep; a lane applies
it inside its own prefix and files an ask for anything outside.** Never change a word in one place
only.

| Today, on a surface | Plain word | Why |
| --- | --- | --- |
| Engine Room · Guardrails · Govern · Boundary · Safety | **What it's allowed to do** | Four routes and a mood for one idea: the spend ceiling, the blast radius, the tool set, the expiry. Say the idea |
| Approvals | **Waiting for you** | Names who is blocked and on what. "Approvals" names a queue, which is why 90 of them died in one |
| Crew · Agents · Fleet · Swarm | **Your team** | Four words for the same people |
| Cockpit · Mission Control · Observe · Today | **Work** | The board. One name |
| Missions · Tracks · Runs | **a piece of work** | Three nouns for one object. Pick the one a person would say |
| Brain · Memory · Knowledge | **What we've learned** | And it stays honestly empty until a real learning exists (R-06, F-70) |
| Trust ledger | **Track record** | `ledger` is banned outright by the vocabulary canon |
| Signals | **What we found** | Or *evidence*. A practitioner does not say "signals" |
| Artifacts | **What was made** | Or just the thing: the spec, the diff, the design |
| Forecast | **What we expect** | Keep *forecast* internally; on screen, say the expectation |
| Verdict | **What actually happened** | Beside the expectation. That pairing is the product |
| Traces | **Activity** | |
| Evals · eval-health | **Quality** | |
| Budgets | **Spending** | |
| Delegate | **Assign** | Linear's gesture, and the word people already use |
| Drift · Impact · Stakeholder | *fold, then delete* | None survives the "would you say it out loud" test, and none is a destination under §0.5 |

**The banned list from the positioning canon still binds and is not up for renegotiation:** never
*receipts · ledger · company brain · decision layer · unattended · first run · provenance*, on any
surface. **Audit trail** and **shared brain** stay. **Approve** only where a click *unblocks*
something; **review** where it only shows you something. **Never claim accumulated learning in the
present tense.** And never write *agentic · autonomous · AI-native · orchestration · intelligence* in
product copy — show the behaviour and let the person name it. Canon:
`docs/strategy/positioning-locked-2026-08.md`, exact strings in
`docs/growth/vocabulary-change-list-2026-08.md`.

### The test, before any word ships

Read the surface out loud to someone who does not work here. **If they ask what a word means, the
word is wrong** — not their understanding.

---

## 13 · Meridian is the only design system, and you extract it rather than write it

**Founder, 2026-08-26:** *"Only follow the Meridian design system, and wherever possible incorporate
all its components and elements into the platform. Meridian is a reference from beautifului.dev — it
has all the components needed and the codebase is there, so you do not need to generate anything.
Literally copy the code, extract it, implement it. beautifului.dev and Meridian are the baseline. On
top of that you may create; you must not go below."*

### The rule

**Do not write a component that already exists in the reference. Extract its source and port it.**
Choosing a value because it "looked right" is a fail under R-20 §7; a value with a reason is not. This
is not a style preference — it is the difference between one product and three gutters for one row.

**Every prior design system is retired and this is enforced, not requested:** v1, v3 Obsidian, v4
Loom, v5 Tempo, Cadence/ink. `bun test` fails if a **new** file carries a retired token (`--sp-*`,
`--ds-*`, `--text-*`, `--hairline`, `--raised`, `data-obsidian`) or a raw colour, and fails if an
**existing** file grows its count. **If no `--mrd-*` token fits, that is a gap in Meridian — file it,
never widen the baseline to pass.**

### How to get the real source, and the domain is `beautifului.dev`

The correct domain is **`https://www.beautifului.dev/`**. Several files in this repo dropped the second
`u` from it, which is wrong and has been corrected where found.

The extraction is already documented and reproducible —
[`docs/design/MERIDIAN-REFERENCE-PARITY.md`](../docs/design/MERIDIAN-REFERENCE-PARITY.md) has the
component-by-component map and the method:

> Fetch `https://www.beautifului.dev/`, decode the `self.__next_f.push([1,"…"])` chunks, JSON-parse
> each, concatenate, then split on the `<id>:T<hexlen>,` markers. **19 blobs, 191,239 bytes.** Each
> blob declares its byte length ahead of it, so a truncated read is detectable.

**Never compare against the rendered demo.** A screenshot loses the mechanics, which is the only part
worth having.

### Who does what

- **S0 fetches the reference and commits the source** into `docs/design/reference-2026-08-26/`, the
  same way it commits Mobbin pulls. Lanes may not have web access; **a lane blocked on a reference is
  S0's failure.** S0 also re-checks the reference for anything new since 2026-08-15, since the site
  ships.
- **S0 owns `src/components/meridian/**`.** A lane authors a primitive locally and files
  `coordination/requests/<S>/mrd-<name>.md`. **S0 reviews it hard against R-20's eight and rebuilds it
  if needed before it enters** — a primitive is used by every future surface, so a mediocre one is a
  debt charged forever. This is the one review S0 never rushes.
- **Every lane, per region of every surface: which Meridian component serves this?** A bespoke div
  where a primitive exists is a fail. **Adoption must go up** — 121 components, 95 adopted, and 17
  built with no importer, including `run-rows.tsx`, 22.8KB of run vocabulary that three surfaces each
  reinvented around. A component still unadopted after its natural surface ships **gets deleted with
  the reason recorded**, because inventory nobody reaches for is the defect this whole phase is about.

### The lens for design decisions

**Founder's instruction: think as a head of design, a head of product, and a consumer psychologist —
not as an engineer implementing a ticket.**

- **Head of design.** Would this survive being put next to Vercel or Linear on the same screen? R-20's
  eight are the checklist, and a reviewer must be able to point at the one that failed.
- **Head of product.** What does the person *do* here, and what did they stop doing? A surface that
  only tells is a status panel and does not ship (R-03).
- **Consumer psychology.** Premium is not ornament — it is **confidence, legibility and the absence of
  doubt.** Three things carry it: **restraint** (one colour for the one live fact, so the eye is never
  asked to choose), **honesty** (nothing on screen that the data cannot prove — a person who catches
  one staged state stops trusting all of them), and **relief** (the person arrives tired; every
  decision you remove is felt). A designed sad path is where cheap products are exposed, and four of
  seven stations commonly produce nothing.

**"Ultra-premium that actually does the job" is one test, not two:** the surface is beautiful *because*
every region carries a fact the person came for, and nothing else is on it.

---

## 14 · Research: at the moment of need, by the session that needs it, written down once

**Founder's ruling, 2026-08-26:** *"Whatever comes into the picture while they're building, they should
ask, and they should build it. We can give the Linear access if they want."*

**There is no up-front research phase.** It produces a document nobody reads and a backlog nobody
builds. Research is part of the unit that needs it.

**But research nobody records is research bought twice**, and this repo has paid for that repeatedly —
which is why `docs/research/` exists, why the 35-agent brand audit was committed rather than left in a
session directory, and why the nine-product agentic teardown was written down the day it was done.

### The four steps, every time

1. **Look before you research.** `docs/research/` for anything market, product or design;
   `docs/research/integrations/` for a tool's API; `the-first-run/FINDINGS-LEDGER.md` before
   re-investigating any defect. **If a file answers your question, read it and stop.** A symptom marked
   FIXED means check the commit and move on.
2. **Time-box it to the decision you actually face.** Not *"everything about the Jira API"* —
   *"can I create an issue with a custom field, and what scope does that need?"* One decision, one
   answer, one date.
3. **Write it down where the next session will look**, in the same commit as the work, linked from its
   folder index. Every claim carries the date it was checked, and **what you did not verify is stated
   plainly** — a gap named is useful, a gap hidden costs the next session a day.
4. **Ask for access in one line naming three things:** the tool, the exact scope, what it unblocks.
   `coordination/requests/<S>/access-<tool>.md`. **S0 answers or escalates within the same unit.**
   Anything involving money, a customer's real data, or a credential the founder holds personally goes
   to him; everything else S0 decides.

**And keep building while you wait.** A blocked integration is not a blocked unit — do the part that
does not need the credential, and say in your NOW line what you are waiting on. **Switch tools rather
than reporting a blocker:** Playwright, chrome-devtools and the Chrome plugin are three paths to a
browser, and only a credential boundary is a real blocker.

### The one thing that is not a research question

**Whether something already exists in this repo.** That is a grep, and it takes thirty seconds.
`TrackActivity` and `TrackChain` were rebuilt because nobody ran it. **Twenty connector providers,
121 Meridian components and a full MCP server are sitting here.** Grep first, always.
