# The Q&A bank — hostile questions, honest answers

> _Last updated: 2026-07-10. Three audiences: investors, customers (the skeptical senior PM), teams/engineers. Every answer is the honest one — where the honest answer includes a weakness, say it first and pivot to the mechanism. Evidence pointers in brackets._

## Investors

**"How is this not a thin wrapper?"** — The wrapper test is whether value lives in the prompt or the data. Ours lives in a dataset that only exists because we own the whole loop: decisions → evidence → what shipped → what happened → was the call right, accrued per-workspace over calendar time. A competitor with our prompts has none of it; a competitor with our customer's raw exports still can't reconstruct it. [Bessemer's own wrapper-vs-flywheel distinction — research §17; moat.md §2]

**"What happens when OpenAI/Anthropic ships a PM agent?"** — The labs ship capability; they're structurally walking away from accountability (memory audit trails removed, operator products retired). Our product IS the accountability layer: cross-tool, permissioned, receipted. Precedent: Cursor built $2B ARR beside Copilot; Jasper died because it had no workflow depth or data gravity. We have both, plus BYOK absorbs every model release — a better model makes our agents better. [v13 §7; survival properties — Menlo/Stanford, research briefs]

**"Only 16% of 'agent' deployments are true agents. Why believe you?"** — Don't believe us; audit us. The engine is cron-advanced missions with A2A handoffs, and you can check the cadence yourself: `resume-runs` is `* * * * *` in `cron.job` and calls `advanceMissionCore`. **No usage count here on purpose; every one we used to quote was seed data.** The demo shows the loop closing live, including the failure path. [Menlo stat — research §17; the audit — v13 §1]

**"Your traction is zero."** — Correct, by design: we built the OS before opening the doors, and the register proves the build (382 rows, 293 shipped, independently audited). The public launch is mid-September 2026, with the beta cohort seeded from 224 named prospects who already hand-roll this product. Judge us on the week-over-week curve at application time. [research §12; the plan]

**"Solo founder?"** — Solo founder who ships like a fleet because the product runs the fleet — the repo's own history is the demo (parallel agent lanes, receipted). 11% of YC W26 were solo; the bar is higher and the evidence is the point. [research §17]

**"NRR? Retention?"** — Instrumented from day one (MOAT-METRIC: outcome-accuracy lift per account as its memory grows; cohort tables auto-generated). We know the 120%+ bar and the wrapper-median 48% collapse; the compounding track record is the anti-churn mechanism — leaving means abandoning your judgment history. [research §17; moat.md §7]

**"Why now?"** — Amodei: models "may just do SWE end-to-end in a year or two." Build commoditizing is our precondition — as execution goes to zero, decisions-per-human explode, and the PM:eng ratio is already inverting toward 1:20. YC's own S26 RFS asks for a "Company Brain." [research §14, §17]

**"Why won't Atlassian/Airtable just do this?"** — They buy the pieces (Cycle absorbed 2025; Kraftful → Amplitude) but a suite can't be the neutral judge across its competitors' tools, and none of them will publish their misses. Our two controversial moves — artifacts-as-projections and published calibration — are organizationally impossible for an incumbent whose revenue is the artifact tooling. [moat.md §4; v13 §7]

**"Why build the code generator yourselves when Cursor and Devin exist?"** — Because the generator stopped being the hard part. Frontier models turned code generation into a commodity you call through an API; the hard part is the harness — the planning, the merge gates, the evidence, the trust ramp — and the loop above it that decides what is worth building. We built that harness once and plug in the best model for every lifecycle job (sensing, deciding, designing, building, researching, learning). Users never buy a second tool license, their product context never round-trips through another vendor, and every model release upgrades the build station the same day. We are not selling codegen against Devin ($492M ARR) or Cursor ($2B ARR) — that is their race; build is one governed station inside our loop. An enterprise that already has a Devin contract can bring it, quietly, behind the same seam. [own-engine ruling 2026-07-22; the architecture seam: build-driver-and-dispatch.md]

**"What's defensible in the AI stack?"** — Nothing, per Casado ("no endemic tech moat") — which is our argument: the moat is the receipted, outcome-labeled record and the trust ramp, not the model calls. Method is commodity; method bound to your accumulated judgment is not. [investor corpus; v11 §8]

**"ChatPRD already has 100k+ PMs. What do you know that Claire Vo doesn't?"** — She proved the demand, bootstrapped, and we say so with respect. A PRD is where her loop ends and ours starts: the decision behind the document, the build after it, the outcome after that. Documents don't compound; the decision record does. And if her own "PM is dead" thesis plays out, the collapsed builder-PM who remains needs evidence more, not less. [research-findings §3.2; interview-prep §4]

**"You had a working product for weeks with zero users. Why hadn't you launched?"** — Fair hit, and we own it: we over-built before opening the doors, caught it on 2026-07-10, and reorganized the whole company around launch (beta within days, public listing inside the month). The honest posture is self-aware correction, not justification — partners respect "I was wrong and here's the fix date" far more than a rationale. [v13 campaign; interview-prep §4.1]

**"Linear assigns issues to Cursor and Devin today. Why a second system?"** — Linear dispatches the build; it doesn't decide what's worth building or record whether the decision paid off. We sit above the tracker and dispatch to those same agents — a Linear customer is a Supaprod customer. [BuildDriver seam; research-findings §3.2]

## Customers (the skeptical senior PM)

**"Who's accountable when the AI is wrong?"** — You are — that's the design. Supaprod never hides that; it gives you the instruments: every act lands in the audit trail, every artifact has one-key rewind, autonomy is earned per-agent by track record and you can tighten it anytime (hard floors: merge/revert always ask). Watch the demo's failure path: we rehearse being wrong on purpose. [demo-script.md]

**"What do you read from my tools? Where does my data live?"** — Read scopes shown at every connect (what we read / what we never touch / one-click revoke); your data lives in your workspace's Postgres, exportable in open formats anytime; no training on your data; BYO keys supported. The trust card is IN the connect flow, not a policy PDF. [PC-03/PC-02; 43% name security the blocker — research]

**"Another AI PM tool that's dead in 18 months?"** — The graveyard is real (the $28k bakeoff killed 38 of 47; Cycle and Kraftful got absorbed). Those were drafting features. We're the system of record for judgment — the thing the bakeoff's survivors (grounded, receipted tools like Dovetail) point toward, extended to the whole loop. And export-anytime means trying us is not a bet. [research §2]

**"I don't trust AI-written PRDs."** — Neither do we — that's why the PRD isn't the product. The decision is, with its evidence and its outcome window. The spec is a projection generated from the record, drift-stamped, and reverted in one key. You review calls, not prose. [the artifact doctrine]

**"Why did we decide X?" (the wedge)** — That's the first thing Supaprod answers — in seconds, with the evidence. It's the top-voted pain in the community's own words. [research §12: the 480-pt thread]

## Teams / engineers

**"Is this PM surveillance?"** — No — the track record records decisions and outcomes, not people-metrics. Engineers gain the thing they've asked PMs for forever: unsanitized truth — specs with the evidence attached, acceptance criteria compiled to checks, and the "why" answerable without excavating Slack. [PostHog's gatekeeper critique — research §1]

**"Will the agent commit garbage to our repo?"** — The build spine can't bypass your merge gate: PRs only, CI must pass, merge is permanently human-gated (a non-overridable floor), every step traced. The trust ramp means an agent earns even its lower-stakes permissions. [SW-2; the tool-mode floors]

**"We already have Copilot/Cursor/Devin."** — Keep them; they're your engineers' tools. Supaprod's own engine covers the product loop's build station natively — spec to pull request behind your merge gate, no extra license — and the layer you're actually buying is the one nobody else sells: what's worth building, and proof of what worked. If your org has standardized on one build vendor, enterprise BYO exists behind the same seam. [own-engine ruling 2026-07-22; moat.md §6]

## The questions WE ask them (discovery, every beta first-session)

"Walk me through the last time someone asked 'why did we decide X' — what happened?" · "What did your team ship last quarter that you'd now call a miss — and where is that recorded?" · "What would you let an agent do unsupervised today? What would it have to prove first?" [ground-truth mandate: first sessions are discovery interviews]
