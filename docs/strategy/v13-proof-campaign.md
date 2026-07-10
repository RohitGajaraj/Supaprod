# v13: The Proof Campaign

> _Created: 2026-07-10 · Status: **CURRENT campaign canon (sits under v11's direction).** Produced from the founder's 2026-07-10 goal ("design and build a future-proof, billion-dollar, agentic-first product operating system within six months — act as the founder"), grounded in a 7-agent evidence sweep run this session: live-DB ground truth, a codebase surface audit, and four outward research passes (real PM voices, the 2026 competitive landscape, the frontier-lab/agent-UX study, market sizing) plus an Airtable HyperAgent deep-dive. **Scope ruling (founder, mid-session): not PM-only — the campaign explicitly spans the adjacent software-engineering lifecycle where it strengthens the wedge.**_
>
> **How this layers:** v11 still wins *direction* (the decision-and-outcome OS; own the loop / sense continuously / keep the receipts). v12 still wins the *learning-depth* build plans (now shipped). **v13 wins on what the work is now FOR: users, proof, and love.** When v13 and an older doc disagree about what to do next, v13 wins. Execution lives in [`../planning/v13-proof-campaign-plan.md`](../planning/v13-proof-campaign-plan.md) (the Launch Month, the post-launch gates, work packages PC-01..27, the parallel-lane protocol with Fable/Sonnet model assignments; board group **G17**).
>
> **HORIZON RULING (founder, 2026-07-10, binding, sharpened same day — [`session-decisions.md`](./session-decisions.md) decisions 5–6):** **no six-month execution planning anywhere. Ship publicly in UNDER 25 DAYS**: a **3–4 day build sprint** closes the launch-gating gaps, then beta, then the listing (**beta stories → Show HN → Product Hunt the same week**), and **startup applications (YC first) come AFTER the launch, consuming its traction** — never before. The product presents **enterprise-grade AND consumer-grade simultaneously** ("everything built now — an explicit command"); the founder's own overwhelm read ("too much… partially cooked") sets the Love-Gate bar, so **subtraction is sprint work**. Everything beyond launch is a ranked backlog picked by **gates, not dates**, under the standing **ground-truth mandate** (every major claim carries user evidence or a named assumption; beta first sessions double as discovery interviews). This doc is written to that horizon.

---

## 1. The honest assessment: where Cadence truly stands (2026-07-10)

**The journey so far.** Cadence began as a productivity tool, became a PM tool, and has genuinely become an agentic-first product OS *in architecture*. That third claim is no longer aspiration — it is code and live data:

- **The engine is real and warm.** Live DB (pulled this session via Lovable): 133 missions, 129 agent runs, 72 decisions, 49 learnings, 63 lineage edges, 97 agent memories, 101 signals, 2,162 AI events through one governed chokepoint, 1,200 credit-ledger rows. The reinforcement seam shipped (RF-01..08): recorded outcomes now move the ranking of new bets. In v11's audit (2026-06-23) the moat was cold — 1 learning, zero outcome edges. It has since warmed end to end. The 300-row build register stands at 292 done (97.3% strict).
- **The market contact is zero.** 8 users total: 4 gmail (founder + associates, newest 2026-06-17), 3 internal @redcadence.app accounts, 1 test account. No organic external user has ever touched the product. Revenue: zero (billing engine built, dormant; Stripe blocked on an India entity). Distribution: none. Google OAuth verification: pending a public homepage.

**The one-sentence truth:** *we built the operating system and never opened the doors.* Thirteen months of engineering produced a governed autonomous engine most competitors describe in slides — and a company that has never run a single external user through it. The scarce asset is no longer code. It is proof: users, outcomes on other people's products, revenue, and love.

**Why this is a strong position, not a failure:** the strategy corpus (v7–v12) predicted exactly this shape — build the capability before the showcase. The capability now exists and the board is dry. The risk has inverted: every additional week of inward building now *destroys* value (the 2026 market moves monthly; the moat compounds only on real usage). Every week from here is outward.

## 2. The thesis: the Proof Campaign

**Mission:** convert a finished agentic engine into a loved product with real users — **a 3–4 day build sprint, a beta wave, and a public listing in under 25 days (< ~Aug 4), with the YC application following the launch and consuming its traction** — then earn revenue, team expansion, and raise-ready evidence gate by gate.

**The single ranking question for everything:** *does this put Cadence in front of real product people and make them love it?* Features that deepen the engine but not the proof are deferred by default — the engine is ahead of the market's ability to see it.

**What "billion-dollar" honestly means at this horizon:** the Launch Month does not build a $1B company; it opens the doors and starts the only clock that matters — real outcomes accruing in real workspaces. The gates after it (first revenue, teams, moat evidence, raise pack) are verifiable facts earned by evidence, not scheduled by calendar (claim-never-outruns-wiring stays law; the horizon ruling above forbids multi-month calendars by construction).

## 3. The user lens: the problem, the grunt work, the USP

### 3.1 The problem, precisely
Product decisioning is slow, undocumented, headcount-bound, and unaccountable — while the build layer beneath it got 10x faster. Fresh 2026 evidence sharpened three edges:

1. **The tools are the bureaucracy.** Jira's own users: "optimized for productivity theater"; Productboard "too much... rigid"; Aha! "teams use less than 20% of it." The meta-complaint: tools don't talk, so PMs keep "three versions of the same roadmap." Only 7% of product-ops teams report high automation, while 43% name it their #1 focus (Productboard State of Product Ops 2025).
2. **The PM is miscast as a gatekeeper.** PostHog's founders: "PMs become the bottleneck and gatekeeper for all decisions, and engineers feel frustrated... engineers get a sanitized version of the truth." The handoff boundary (PM↔eng↔design) is where trust and information die — 68% of rework cost traces to it.
3. **AI-PM tooling has a trust graveyard.** Aakash Gupta's $28,336 bakeoff of 47 AI PM tools kept 9 — ChatPRD, Productboard AI, Zeda, Kraftful, Cycle all failed the cut; Cycle was absorbed into Atlassian (2025-09) and sunset. What survived is *grounded* tools ("answers backed by actual quotes" — Dovetail). What dies is thin AI on an old workflow. And 43% of enterprise PMs name data security as THE adoption blocker.

### 3.2 The grunt work Cadence automates (the full lifecycle)
Signal triage across 13+ tools → theme clustering → evidence-ranked bets (ICE, reinforced by recorded outcomes) → Critic teardowns with precedent → PRDs/specs with lineage → acceptance oracles → autonomous build to PR with CI receipts → launch kits and stakeholder packs → outcome windows → learnings that re-rank the next bets. Plus the ambient layer: routines, morning brief, drift watch — the work that happens while the user sleeps.

### 3.3 What users would say about Cadence today (unflinching)
A skeptical senior PM's actual first questions (from the research): *"Who's accountable when the auto-PRD is wrong or the auto-PR breaks something?" "What exactly do you read from my 13 tools?" "How is this not another AI-PM tool that's acquired or dead in 18 months?"* They would withhold trust until they watched Cadence be **wrong** and handle it well — revert, record, learn. The one thing that earns the second look: **outcome-linked ranking with receipts**, because the unsolved pain isn't drafting speed, it's *stale roadmaps nobody trusts and decisions nobody can defend.*

**The feedback loops we give them (product answers, all wired or in the campaign):** the outcome record on every decision ("was this call right?"), the in-product pulse on every artifact, the "you said → we changed" changelog, the Trust Ledger share link, and the judgment-memory citations that show the system learning from *their* corrections.

### 3.4 The USP, stated once
**Cadence is the only system where the product decision is the primary object — wired to evidence upstream, execution downstream, and outcomes afterward — run by governed agents that earn autonomy by track record, on a ledger your team can audit and no competitor can backfill.** Drafting is commodity. Judgment bound to your accumulated, outcome-labeled record is not.

## 4. Truly agentic, defined (and where we go beyond the frontier)

**The six tests that separate an agentic OS from a chat wrapper** (Cadence's status against each):
1. **Owns a loop, not a prompt** — plans, acts across tools, hands off, resumes. ✅ wired (missions, A2A, cron-advanced DAG).
2. **Self-initiates** — acts from signals, schedules, and thresholds without a human pressing go. ✅ wired (ambient triggers, sense/derive ticks) — must now be *felt* (Routines, PC-08).
3. **Works while you sleep, reports like a chief of staff** — ✅ crons + morning brief; the digest is the SLA.
4. **Autonomy is earned, not toggled** — trust ramp by track record with non-overridable safety floors. ✅ wired — a genuine differentiator; the frontier study found only Claude Code's permission ramp comparable, and no product does it *per-workspace by outcome record*.
5. **Every act leaves a receipt** — trace, approval, evidence, outcome. ✅ wired (Trust Ledger).
6. **The system gets measurably better from ITS outcomes in YOUR workspace** — ✅ shipped this month (RF seam) — no competitor found does this at all (the 2026 sweep's empty cell, still empty).

**Frontier-parity moves we adopt natively (from the study of what people love):** goal-until-verified missions (Claude Code `/goal` → our Outcome-Contract oracles as termination conditions); Routines with receipts (ChatGPT Tasks / Claude Routines); @cadence where work happens (Claude Tag); one-key rewind on AI-touched artifacts (`/rewind`); confidence-gated drafts (Devin's green/red); parallel fan-out reconciled to one review (Jules); proactive narrated brief (Pulse — ours exists; keep it the hero); grounded honesty over fabrication (NotebookLM's retention lesson).

**Beyond the frontier (ours alone):**
1. **Self-writing playbooks (the Hermes move, institutionalized):** Nous Research's Hermes agent compounds by writing itself a new skill after each task. Cadence's version is stronger because it has what Hermes lacks — an outcome ledger: every completed mission distills a playbook draft; playbooks *rank by validated outcomes* in your workspace. Institutional judgment as software, compounding twice (per-workspace, per-outcome).
2. **Judgment memory at decision time:** "Your last three checkout bets under-performed; this one mirrors #2" — the workspace's own record cited in the moment of choice. Memory that advises, never overrules.
3. **The autonomy ramp as product language:** agents visibly earn scopes ("Scout earned auto-mode: 14 clean runs, 2 validated outcomes"). Trust as a first-class UI object, not a settings page.

## 5. The pressure-test: what stays, sharpens, merges, dies

Applying the four questions (why does it exist / what pain does it kill / can an agent run it end to end / what runs while users sleep) to the built surface — the campaign's PC-01 executes this with the full audit in hand:

- **Heroes (sharpen):** Today (the brief), the Critic teardown (the wedge), Decide (outcome-reinforced ranking), Build (missions with receipts), Brain (the analyst), Trust Ledger (the proof object), Connections (the fuel door).
- **Recess (keep, out of the front):** evals/prompts/drift/analytics remain Engine Room bands — the doctrine already says so; PC-01 verifies no regression to front-of-house.
- **Merge:** any surviving duplicate homes (approvals/spend/calendar) — one canonical home each.
- **Kill:** anything that renders empty for a fresh account and can't be made warm or honest by M0. An empty panel is a trust-destroyer (the deflation finding in v11 §6.1 — now a hard Love-Gate rule, not advice).
- **While you sleep (the standing answer):** every-minute mission advance; 5-min sense + delegate polls; nightly cluster/derive/steward/outcome/digest ticks; scout diffing; drift watch. By morning: a brief with stakes, moved rankings, teardowns of new risks, and receipts for everything. This list is now a product page, not just architecture.

## 6. Market (refreshed 2026-07-10, sourced in the plan's research references)

- **TAM:** PM software ~$8B (2026, 10–14% CAGR) + enterprise AI dev-agents ~$10–11B annualized (Gartner) — combined ≈ **$18B baseline**, ≈ **$40–50B by 2030**; Gartner's agentic-AI ceiling ($450B by 2035) frames the envelope.
- **SAM:** ~2M core PMs + 5–8M product-adjacent operators (founders, eng leads, product engineers) × $1,000–2,500 blended/yr ≈ **$11B central case** ($6–20B band).
- **SOM:** comparable challengers hold 0.5–1.5% after 8–10 years → **$55–165M ARR** (5–7yr); bottoms-up 5,000–15,000 teams × $10–20K ACV converges at $50–300M. **The 6-month SOM is a proof cohort, not a revenue scale:** 100+ active workspaces, 10+ paying, NRR evidence.
- **The role-shift tailwind:** PM:eng ratios compressing; Cagan: delivery-only PMs are automatable, strategic PMs are not; the "product engineer" rise collapses PM+eng+design into one operator — **exactly Cadence's expanded buyer** (the founder's widened scope is the market's direction, not a stretch).
- **Pricing the market accepts:** hybrid floors + usage (Bessemer: "hybrid wins when uncertain"); pure outcome pricing disputes when outcomes are ambiguous. Our credits-not-seats + 4-tier ladder (pricing-strategy.md) is already the right shape; unchanged, now with a go-live date.

## 7. Competition and the "frontier lab ships it tomorrow" defense

**The map (2026 refresh, full grid in the research reference):** the incumbents consolidated — Atlassian absorbed Cycle into Jira Product Discovery; Amplitude absorbed Kraftful; **Airtable now ships ProductCentral, a named PM hub marketed directly against point solutions**, plus HyperAgent's general agent runtime. Every prioritization product found (Productboard Spark, Zeda, airfocus, Aha!) still scores with a **static ICE/RICE formula, never re-weighted by what shipped**. Build-side agents keep commoditizing execution at record speed (Devin $37M→$492M ARR in 12 months at a $26B valuation; Cursor $2B ARR; Lovable $400M+) — which *raises* the value of the layer that decides what to execute; VentureBeat reports the PM:eng ratio inverting toward ~1:20 as each engineer ships more. **The empty cell stays empty on both axes: nobody connects decisions → outcomes → learned ranking, and nobody sits above both a multi-source signal Brain and a dispatched build layer under one outcome record.** **Ranked threats:** (1) **Linear**, 12–18mo — free Agent on every plan + Coding Sessions closing decide→code inside the workspace of record, but no signal Brain or outcome ranking yet; (2) **Airtable**, 12–24mo — HyperAgent runtime + ProductCentral + ~$500M revenue; (3) **Atlassian**, 18–24mo — buying Discover piecemeal with Rovo distribution. Posture map unchanged (moat.md §4): integrate/absorb/race/ignore.

**If Anthropic/OpenAI/Google ships a "PM agent" tomorrow, at the feature level we survive because (each is built, not pitched):**
1. **Per-workspace outcome data** — RF-ranked judgment accrues over calendar time inside the customer's loop; a model release contains none of it (the un-backfillable asset; Abridge/EvenUp precedent from vertical-AI survivals).
2. **Cross-tool write-path trust** — trust ramps, approval routing, revert, audit: the boring enterprise spine labs walk away from (OpenAI removed its memory audit trail; Operator retired).
3. **The neutral seat** — a lab agent inside ChatGPT can't be the system of record across Jira+Linear+Figma+GitHub; an incumbent can't be neutral against its own suite.
4. **The ledger as switching cost** — leaving Cadence means abandoning your team's decision history and its learned ranking; export is free (gravity, not a wall).
5. **Distribution in the judgment community** — the wedge (teardown links, PM-impact ledgers) spreads PM-to-PM; labs sell horizontal seats.
The survival playbook from precedent (Cursor beside Copilot, Perplexity beside Google, vs Jasper's death): workflow depth + compounding proprietary data + trust friction + application-layer speed. All four are our existing architecture; the campaign's job is to make them *visible and used*.

**The why-now, from the people building the threat (research §14):** Amodei says models "may just do SWE end-to-end… in a year or two" — build commoditization is Cadence's *precondition*, stated by the person shipping the models. Masad describes Replit's production self-improving agent with the exact mechanism of our reinforcement doctrine ("it's not improving its weights, it's improving its context, which matters just as much") and predicts internal "Oracle" agents execs consult for decisions — a description of our layer from a founder building the layer below it. Every 2026 voice points at the same empty seat: **the governed decision layer with outcome memory above the agent fleet** — and nobody named in any of those conversations occupies it.

## 8. Positioning, pricing, the one-liner

**The category:** the decision and outcome operating system for product teams (unchanged, v11 1A verbatim stands). Never "AI PM tool" — that category label pattern-matches to the graveyard.

**The one-liner (the instant anchor):**
> **"Cadence is Claude Code for the product lifecycle — agents do the product work end to end, you make the calls, and the ledger proves what worked."**

**The story behind it:** engineers got agents — Cursor, Claude Code — and shipping became 10x cheaper. Product decisions became the bottleneck, and the product side got… chatbots that draft and wait. Cadence gives product teams what engineering got: governed agents that own the whole loop, from signal to shipped. Plus the thing engineering never needed: an outcome ledger — because code has a compiler and product judgment doesn't. **The ledger is the compiler for judgment** — its feedback arrives in weeks, not seconds, which is exactly why it can't be commoditized and why owning it compounds. (For formal/enterprise contexts, lead with the category line; the anchor is for landings, communities, and the first ten seconds.)

**Evidence-ratified support lines (2026-07-10 research merge — ADDITIVE under the anchor and the story spine, never replacing them; authority: [`session-decisions.md`](./session-decisions.md) 2026-07-10 decision 7):**

- *"Most product orgs run an open loop — decide, then maybe check the results weeks later. Cadence closes the loop: every decision is watched against what actually happened, and the next ranking learns."* — YC's own RFS vocabulary (Diana Hu, "The AI Operating System for Companies," Summer 2026 RFS, fetched 2026-07-10: turn the "open loop into a closed loop"; [`../references/investor-corpus-yc-vc.md`](../references/investor-corpus-yc-vc.md) §1/§A move 1). Fits because the RF seam already runs live (§1: recorded outcomes move the ranking) — the line is wired, not aspirational.
- *"The labs shipped the hands — Cadence is the memory that decides."* — defensible because both halves are quoted, dated, and from the people shipping the agents: Karpathy on continual learning ("you can't just tell them something and they'll remember it," 2025-10-17) and Altman on production ("very few [agents] actually make it into production," 2025-10-06); [`../references/podcast-corpus-frontier.md`](../references/podcast-corpus-frontier.md) move 9. Fits because the admitted-open layer is exactly the one Cadence occupies.
- *"Every company is about to run a fleet of agents. Nobody sells the seat above the fleet — the governed layer that decides, approves, and learns from outcomes. Cadence is that seat."* — the empty-seat synthesis ([`../references/pm-voice-and-ai-tooling-research.md`](../references/pm-voice-and-ai-tooling-research.md) §14), corroborated operator-side by Mosseri's product-staff pods (2026-07-09) and Lemkin's 1.2-humans-20-agents GTM (2026-01-01; [`../references/podcast-corpus-lenny.md`](../references/podcast-corpus-lenny.md) synthesis 1–2). Fits the one-person-runner consumer exactly.
- *"The OS spans from market signal to shipped outcome to told story."* — the widened upstream/downstream aperture (founder directive, 2026-07-10, relayed mid-merge; grounded in v12's journey-ends finding — JNY-01..05: intelligence and strategy upstream, launch/GTM and the stakeholder loop downstream — and the generalist-pod trend, research §14). G18 rows RPT-46..49 build the two ends.
- *"Cadence runs on Cadence: its agents review what worked, propose their own improvements, and the ledger decides what ships — every change with a receipt."* — the self-improving property (founder directive, 2026-07-10: wired, never just claimed). **Two layers, stated honestly:** WORKSPACE learning (recorded outcomes re-rank decisions) is live and claimable NOW (§1: the RF seam shipped — 72 decisions, rankings moved); SYSTEM self-improvement (the nightly trace-reading agent shipping its own gated changesets through the build spine) is **claim-on-wiring** — this line enters public materials only once G18 row RPT-50 demonstrably runs, per the claim-never-outruns-wiring law. Evidence: Masad, SaaStr 2026 ("it's not improving its weights, it's improving its context" — the shipped Replit precedent, research §14); shipped rungs RF-01/05/06/07.

**Pricing (continuity + go-live):** the 4-tier ladder stands (Free wedge / Pro / Business with pooled credits / Enterprise with BYOK + outcome pilots; annual toggle the only discount; credits-not-seats philosophy per moat.md §7). v13 adds only urgency and a route: billing is wired LIVE in Launch Month W2 (PC-05) via a merchant-of-record (Paddle/LemonSqueezy recommended — dissolves the Stripe-India entity blocker; founder-gated), revenue is the first post-launch gate (G-REV), and usage "mission packs" become a visible spending option once real missions run on customer repos.

## 9. The full lifecycle (with the widened scope) and HyperAgent

**Stage → what agents run end-to-end → where the human stays:**
- **Vision/strategy:** living Strategic Brief + assumption watchers (wired) → human owns intent and the bet-the-quarter calls.
- **Discovery/planning:** signal fabric → themes → ranked bets → teardowns (wired) → human approves the portfolio.
- **Definition:** PRD + flows + acceptance oracles + scaffolds (wired) → human edits taste, approves contracts.
- **Design:** design memory + scaffold parity (wired, v12 DSN leg) → human owns taste.
- **Build (the SWE bridge, the widened scope):** spec→PR with CI receipts on the native spine (wired); BuildDriver seam GA'd to a partner repo at gate G-TEAM (PC-21); requirement oracles compile to test plans (CNV-02); the eng lead gets the receipts chain (PC-22). We feed the builders and judge the results — never race Cursor/Devin (moat.md §6 stands).
- **Launch/GTM:** launch plans + stakeholder packs + changelog (wired; launch_plans awaits migration apply) → human approves everything outward.
- **Learn:** outcome windows → learnings → re-ranked next bets → self-written playbooks (PC-18) → human records the judgment calls agents can't.

**HyperAgent ($20k, the ruling):** Airtable is now a category competitor (ProductCentral), so the credit is **disposable GTM/research compute at arm's length** — the launch ops engine (prospect/community research, launch monitoring, outreach cadence), the review-mining rig, the raise pipeline. Never core orchestration, never product data residency, never a maintained two-way integration. Verify grant expiry on the account and front-load use. (Full runbook: plan §6.)

## 10. What I decided (the founder calls made in this doc)

1. The **Proof Campaign** is the front — users/proof/love outrank engine depth; G17 is the register.
2. **The 25-day ship is the only calendar** (founder horizon ruling, sharpened): a 3–4 day build sprint → beta → listing (Show HN → Product Hunt) in under 25 days; applications AFTER launch; everything after is gates, not dates.
3. Scope widens to the product ORG (PM + eng handoff + design + GTM), wedge audience stays the individual PM/founding PM.
4. The one-liner and story in §8; "AI PM tool" is banned vocabulary.
5. Billing goes live via MoR (pending founder's account pick); revenue is the first post-launch gate, not a someday.
6. HyperAgent = arm's-length GTM compute only (Airtable is now a category competitor).
7. The Love Gate with the dual bar: enterprise-credible AND consumer-grade simultaneously; no gate closes on green tests alone — a fresh account must *feel* it.
8. Parallel-lane execution with explicit model split (Fable = judgment lane; Sonnet = build/GTM lanes) — the plan's §3 protocol is the standing way we build from today.
9. The YC application (PC-27) is a first-class work package that runs AFTER the listing (it consumes launch traction as evidence — founder ruling): drafted from this corpus + real usage numbers, every claim wired-true, demo script shows the loop closing live (never narrated).
10. The ground-truth mandate is standing law (decision 6): every major build/positioning claim carries a user-evidence pointer or an explicitly named assumption; the beta cohort is the primary research instrument. Five independent authorities (research §11) converge on the thesis without having built it — execution commoditizes, judgment is the scarce asset, nobody has productized judgment that compounds — **but the primary-source pass (§12) found the community actively distrusts the influencer layer, so the outward citation rule is binding: cite artifacts, threads, and companies (the 480-pt "why did we decide X" thread; the 831-pt hand-rolled-Cadence build-log; the Coinbase one-person-teams memo), never gurus.** The strongest wedge evidence is now primary: the community's own top comment on PRDs is the ledger thesis verbatim ("So why did we decide on X? Cue hours of finding that slack conversation from months ago").

_Cascade executed this session: strategy README role map, SSOT §0, dashboard G17, CLAUDE.md 1.45, moat ripple check, inputs-log + decisions-log entries. Research evidence: [`../references/pm-voice-and-ai-tooling-research.md`](../references/pm-voice-and-ai-tooling-research.md) + the agent briefs distilled into this doc's sections._
