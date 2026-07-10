# v13 Proof Campaign — the execution bible (group G17)

> _Created: 2026-07-10 · Status: **ACTIVE — the current build front.** Strategy canon: [`../strategy/v13-proof-campaign.md`](../strategy/v13-proof-campaign.md) (the why). This doc is the what/when/who: **the Launch Month** (the only calendar that exists), the post-launch gates, the PC-01..27 work packages, and the **parallel-lane protocol with explicit model assignments (Fable vs Sonnet)** so the founder can spin up parallel sessions and the work self-orchestrates. Board rows: group **G17** in [`feature-dashboard.md`](./feature-dashboard.md)._

> [!IMPORTANT]
> **HORIZON RULING (founder, 2026-07-10, binding, sharpened same day — [`session-decisions.md`](../strategy/session-decisions.md) decisions 5–6):** **no six-month execution planning, anywhere. Ship publicly in UNDER 25 DAYS** (< ~Aug 4): a **3–4 day total build sprint** closes the launch-gating gaps (founder committing 24-hour days), then beta rollout, then the listing — **beta first → Show HN → Product Hunt the same week** — and **startup applications (YC first) come AFTER the launch, consuming its traction as evidence**, not before. The product presents **enterprise-grade AND consumer-grade simultaneously** ("we want everything to be built now — an explicit command"). Everything after launch is a ranked, gate-picked backlog — **gates, not dates**. Two standing companions: the **ground-truth mandate** (every major build/positioning claim carries a user-evidence pointer or a named assumption; the beta cohort doubles as the research instrument) and the **overwhelm bar** (the founder's own read: "most of the things are there, but it's too much overwhelming… partially cooked" — subtraction and a first-session receipted value moment are sprint work, mirroring the incumbents' #1 death pattern).

> **The one-sentence mission (from v13):** the engine is finished and the board was dry — the scarce thing is no longer engineering, it is **users, proof, and love**. Launch within the month; let the gates after it be earned by evidence, not scheduled by hope.

---

## 0. Operating mode

- **BUILD-ONLY MODE stays ACTIVE** (founder ruling 2026-07-04). Per shipped PC row: flip the dashboard row + one-line note. No doc ceremony. This plan is updated only at gate closures or when a row's scope genuinely changes.
- **Pick order:** `bash scripts/lane.sh next` remains the law. The G17 rows are registered so the campaign IS the front (behind the OBS-PORT and SW-7 partials, which fold in — §5).
- **The Love Gate (standing — founder 2026-07-10, "world class product people love"):** no gate closes without a fresh-account walkthrough on production (the SW-7 oracle pattern) passing the felt-experience checklist: zero dead ends, warm first-run, honest claims (claim-never-outruns-wiring), one genuine delight moment per surface touched. Green tests with a cold first-run is NOT done. The dual bar applies: enterprise-credible (security answers, receipts, audit) and consumer-grade (10-minute wow) at the same time — and it is a bar, not a license to gold-plate; correctness gates stay as-is (AGENTS.md §3).
- **Every insight ships to a consumer (founder ruling #3):** anything this campaign learns lands in the YC application, the demo script, or the beta trust surface — in the same session it surfaces (see the consumer mapping in [`../references/pm-voice-and-ai-tooling-research.md`](../references/pm-voice-and-ai-tooling-research.md) §8–9).

## 1. The 25-day ship (the only calendar) and the gates after it

**Ship window: 2026-07-10 → public listing in under 25 days (< ~Aug 4).** A 3–4 day build sprint, then beta, then the listing; applications follow the launch.

| Phase | Push | Rows | Gate that closes the phase |
| --- | --- | --- | --- |
| **Days 1–4: THE BUILD SPRINT** | Close every launch-gating gap. LOOM publish + 3 migrations applied (founder, day 1); surface truth + **subtraction pass** (the overwhelm bar: recess/kill until the first session delivers one receipted value moment); onboarding = the wedge; public homepage up (Google verification fast-tracked same day); no-signup demo; funnel instrumented; rewind + confidence gates if they fit | PC-01, PC-02, PC-03, PC-04, PC-06 (+PC-10, PC-11 if sprint capacity allows) | **G-SPRINT:** a stranger signs up on production, connects a source (or pastes notes), gets a Critic teardown of their own bet, and sees a warm brain — unassisted, under 10 minutes, with nothing on screen they don't understand |
| **Days 5–14: BETA WAVE** | 25 design partners contacted, ≥10 onboarded; **beta first sessions double as discovery interviews (the ground-truth mandate)**; feedback→signals loop; billing path wired (MoR — founder pick); goal-until-verified missions; Routines visible | PC-13, PC-15, PC-05, PC-07, PC-08, PC-12 (+PC-09 when ungated) | **G-BETA:** 10+ external beta workspaces active; the demo runs end-to-end live showing the loop close (signal→decision→PRD→PR→receipt), never narrated; a real card buys credits |
| **Days 14–25: THE LISTING** | **Beta stories → Show HN** (no-signup demo path, founder in the comments, honest-limitations list, the failure path shown — revert on screen) **→ Product Hunt the same week**; build-in-public arc; Google-OAuth tiles gated "request access" if verification hasn't cleared; first judgment-memory moments on beta data | PC-14, PC-16 | **G-LAUNCH:** listed publicly in under 25 days; ≥50 external workspaces; ≥20 weekly-active externals; day-1/week-1 funnel reviewed |
| **AFTER LAUNCH: APPLICATIONS** | **YC first, then other accelerators — the application consumes launch traction as evidence** (founder ruling: applications follow the listing, never precede it) | PC-27 | **G-APPLY:** YC application submitted with real usage numbers; demo rehearsed twice on a fresh production account |
| *(standing, throughout)* | HyperAgent GTM rig runs the research/outreach ops | PC-26 | — |

**After the Launch Month — gates, not dates.** Nothing below is calendar-scheduled; `lane.sh next` + evidence decide the pick. Each gate is a fact, earned when it's earned:

| Gate | Meaning | Rows |
| --- | --- | --- |
| **G-REV** | ≥10 paying workspaces; first revenue booked; conversion mechanics clean | PC-19 (+PC-05 already live) |
| **G-LEARN** | Judgment memory FELT by users; outcome contracts GA; the Hermes move live (missions distill outcome-ranked playbooks) | PC-16 (deepen), PC-17, PC-18 |
| **G-TEAM** | A 3-seat team runs a real week; eng receipts chain live; a partner repo builds through the BuildDriver seam | PC-20, PC-21, PC-22 |
| **G-MOAT** | Opt-in benchmarks live; ARD consumed externally; NRR cohort table exists on real data | PC-23 (+PC-17's ARD leg) |
| **G-SCALE** | Enterprise questionnaire answerable end-to-end; metrics/raise pack auto-generates from live data | PC-24, PC-25 |

**North-star metric (always): weekly closed loops per workspace** — a decision made → shipped → outcome recorded. Secondary: week-2 return; unprompted shares (teardown/ledger links).

## 2. The work packages (PC-01..27)

Legend — **Model**: `Fable` = judgment-heavy, chokepoint-touching, taste-setting (run in a Fable/Opus-class session). `Sonnet` = well-specified build with crisp acceptance (a Sonnet-class session executes it cold). **Lane**: A/B/C per §3. **Gated** rows need a founder input first (§4).

### Phase 1 — the build sprint (days 1–4)

| ID | What / Why / Acceptance | Model | Lane |
| --- | --- | --- | --- |
| **PC-01** | **Post-LOOM surface truth pass.** Verify every authenticated route earns its place; execute the audit kill list (dead `agent-tick.ts` stub, duplicate `govern`/`governance` redirects, `obsidian-specimen` out of the prod tree, `/sync` provider honesty); zero routes that render empty for a fresh account; a deliberate autonomy-defaults checkpoint after the 07-08/09 confirm→auto flips. *Accept:* fresh-account sweep shows every reachable surface warm or honestly empty; kill list executed. | Fable | A |
| **PC-02** | **The first ten minutes ARE the wedge.** Signup → name your product → connect one source OR paste notes/PRD → Critic teardown of your top bet with receipts → the brain visibly warms ("3 signals, 1 precedent, 1 risk"). No tour, no jargon wall, no empty states. *Accept:* G-W1 with a stopwatch; onboarding completion instrumented ≥60% in beta. | Fable | A |
| **PC-03** | **Public homepage + positioning refresh.** The v13 one-liner + story (parchment contract, `DESIGN.md`); real proof (live teardown example, Trust Ledger share); one CTA (the teardown); a plain **data-trust answer** (what we read, what we never touch, connector scopes — 43% of PMs name security THE blocker; the beta trust surface per the research §8). Unblocks Google verification. *Accept:* live on prod domain; verification submitted; 10-second "what is this?" test passes with 3 cold readers; security section answers the top-3 objections. | Sonnet | B |
| **PC-04** | **Try-without-signup demo.** Zero-auth read-only warm demo workspace from the homepage: real teardown, real ledger, real mission trace. *Accept:* demo route live; every panel warm; demo→signup conversion instrumented. | Sonnet | B |
| **PC-06** | **Activation funnel instrumentation.** signup→connect→first-teardown→first-mission→week-2-return into `product_analytics`; founder funnel view in Engine Room; weekly snapshot in the digest. *Accept:* funnel renders on live data. | Sonnet | B |

### Phase 2 — beta wave (days 5–14): trust + delegation

| ID | What / Why / Acceptance | Model | Lane |
| --- | --- | --- | --- |
| **PC-05** | **Billing go-live pack.** Wire the dormant credits engine to a live merchant path. Founder decides: **Paddle/LemonSqueezy as merchant-of-record (recommended — dissolves the Stripe-India entity blocker in days, MoR handles tax)** vs the Stripe-entity route. Chosen adapter behind the existing billing seam; pricing page per `pricing-strategy.md`. *Accept:* a real card buys credits in production; `credits_enabled()` flip runbook rehearsed; refund path tested. | Fable | A (Gated) |
| **PC-07** | **Goal-until-verified missions.** Mission termination = its Outcome Contract oracle passing (verifier ≠ actor), not a step count, within budget caps; grounded in CNV-02 oracles. Attended chokepoint edit (`loop.server.ts`). *Accept:* a mission with a failing oracle self-corrects to green; verifier separate in the trace; caps enforced. | Fable | A |
| **PC-08** | **Routines, productized.** The 30 crons become user-visible Routines (signal sweep, competitor refresh, morning brief) with on/off, last-run receipts, next-run time — delegation without a laptop on. *Accept:* panel lists real cron state; toggles work; every run leaves a receipt. | Sonnet | B |
| **PC-10** | **One-key rewind for AI-touched artifacts.** Instant revert on agent-modified PRDs/decisions/roadmaps; reverts land in the Trust Ledger. The fear-killer that lets users grant autonomy. *Accept:* revert works on all three artifact types. | Sonnet | B |
| **PC-11** | **Confidence-gated execution, generalized.** Every agent-drafted artifact carries a confidence tier; low confidence auto-routes to the review queue instead of landing silently. *Accept:* confidence visible on drafts; auto-queue verified. | Sonnet | B |
| **PC-09** | **@cadence in Slack.** Mention → evidence pull / spec draft / gated mission launch from the channel; inbound bridge over the JNY-05 outflow leg. *Accept:* @cadence in a connected workspace answers with evidence and can launch a gated mission. | Fable | A (Gated: Slack app registration) |

### Phase 2 — beta wave (days 5–14): partners + ground truth

| ID | What / Why / Acceptance | Model | Lane |
| --- | --- | --- | --- |
| **PC-13** | **Design-partner program.** Target list of 25 (founding/solo PMs at AI-native startups); outreach kit; weekly feedback ritual; partner feedback flows INTO Cadence as signals (dogfood). HyperAgent runs the research/CRM rig (§6). *Accept:* 25 contacted, ≥10 onboarded, feedback→signals live. | Sonnet | C (Founder: sends) |
| **PC-15** | **In-product feedback loop.** Pulse on teardowns/briefs ("was this call useful?") landing as signals + a "you said → we changed" changelog surface. *Accept:* pulse→signals verified; changelog live. | Sonnet | B |
| **PC-12** | **Parallel fan-out → one review queue.** One ask fans out to parallel subagent drafts (PRD + eval + risks) reconciled into a single review item, not N notifications. *Accept:* fan-out mission produces one reconciled review. | Fable | A |
| **PC-27** | **The YC application (POST-LAUNCH — founder ruling: applications consume launch traction, never precede the listing).** Drafted from the strategy corpus (v13 §1 honest state, §3 USP, §7 competition/moat incl. the Cycle→Atlassian absorption + the $28k bakeoff evidence, §6 market, the research §11 thought-leader triangulation) + the demo script (research §8 mapping: receipts ON SCREEN, the loop closing live, never narrated) + hostile-question prep (research §9) + **real usage numbers from the listing**. *Accept:* application submitted with launch traction cited; every claim wired-true; demo rehearsed twice on a fresh production account. | Fable | A (Founder: final voice + submit) |

### Phase 3 — the listing (days 14–25), then the applications

| ID | What / Why / Acceptance | Model | Lane |
| --- | --- | --- | --- |
| **PC-14** | **The listing (first-class work item, founder ruling).** Sequence: beta usage stories first → **Show HN** (no-signup demo path, founder live in the comments, an honest-limitations list, the failure path shown on screen — a revert, not just a win) → **Product Hunt the same week** → Lenny-ecosystem + PM communities; 90-sec demo video; teardown share links; build-in-public arc via the brand repo (founder approves every post); every claim wired-true. **Launch trap guarded:** Google-OAuth connector tiles gated behind "request access" if verification hasn't cleared by listing day. *Accept:* listed in under 25 days; day-1/week-1 funnel reviewed. | Sonnet | C (Founder: publishes) |
| **PC-16** | **Judgment-memory hero moments.** At decision time Cadence cites the user's own record ("your last 3 checkout bets under-performed; this mirrors #2") — the RF wiring made FELT on beta data; weekly "what Cadence learned" digest section. *Accept:* memory citation visible on ranked bets for accounts with ≥3 outcomes. | Fable | A |

### Post-launch (gate-picked, no dates)

| ID | What / Why / Acceptance | Model | Lane | Gate |
| --- | --- | --- | --- | --- |
| **PC-19** | **Conversion mechanics.** Trial→paid nudges at value moments (memory persistence, teardown limits); top-up polish; dunning basics. *Accept:* upgrade path clean end-to-end. | Sonnet | B | G-REV |
| **PC-17** | **Outcome Contracts GA + ARD push.** Authoring to consumer grade; 2 external ARD examples; 2 partner tools invited to consume the endpoint. *Accept:* a partner authors a contract unassisted; one external ARD consumer. | Sonnet | B | G-LEARN |
| **PC-18** | **Self-writing playbooks (the Hermes move).** Completed missions distill reusable playbook drafts; playbooks rank by validated outcomes (`playbook_runs`); reuse measurably shortens repeat missions. *Accept:* a mission yields a reviewable playbook; reuse effect measured. | Fable | A | G-LEARN |
| **PC-20** | **Multiplayer hardening.** Roles on the judgment lane; approval routing to the accountable human; shared ledger views. *Accept:* a 3-seat team runs a real week; RLS audit green. | Fable | A | G-TEAM |
| **PC-21** | **BuildDriver GA slice.** Un-defer G13 BD-1/BD-2: the Claude Agent SDK adapter behind the `BuildDriver` seam for a partner's real repo (native floor stays default). *Accept:* partner repo spec→PR through the seam with merge gate + receipts. | Fable | A (Gated: spend cap) | G-TEAM |
| **PC-22** | **Eng receipts chain.** spec→PR→CI→merge→outcome as one view for eng leads; folds the SW-7 remainder (trust-ramp counter to 5/5 via real approvals; CI self-correct on a genuinely failing test; `ci-poll-tick` re-verified). *Accept:* SW-7 closes ✅; chain view demo-able. | Sonnet | B | G-TEAM |
| **PC-23** | **Anonymized benchmarks (opt-in).** "Teams like yours validated 62% of similar bets" — privacy-reviewed, strictly opt-in. *Accept:* opt-in flow + one live benchmark; privacy review documented. | Sonnet | B | G-MOAT |
| **PC-24** | **Enterprise trust pack.** SSO groundwork, audit export, residency answers, SOC2-readiness checklist, security page. *Accept:* answers a real enterprise questionnaire end-to-end. | Fable | A | G-SCALE |
| **PC-25** | **Metrics / raise pack.** Auto-generated from live data: funnel, retention cohorts, NRR/GRR, MOAT-METRIC, closed-loops/week. *Accept:* one page produces the pack live. | Sonnet | B | G-SCALE |
| **PC-26** | **HyperAgent $20k deployment.** §6: GTM/research compute at arm's length, all month and after. *Accept:* rig running; founder-time saved logged; zero product data in Airtable. | Sonnet | C (Gated: account) | standing |

## 3. The parallel-lane protocol (founder directive, 2026-07-10)

**Three lanes, each a git worktree on its own branch, claims via the existing dashboard machinery.** The founder opens 1–3 parallel Claude Code sessions and pastes a lane brief; each session self-orchestrates from this doc.

| Lane | Model class | Owns | Row order |
| --- | --- | --- | --- |
| **A — Judgment** | **Fable** | Chokepoints (`loop.server.ts`, `runtime.server.ts`), onboarding/positioning taste, trust/autonomy, YC application | PC-01 → PC-02 → PC-05 → PC-07 → PC-12 → PC-27 → PC-16 → PC-18 → PC-20 → PC-21 → PC-24 (+PC-09 when ungated) |
| **B — Build** | **Sonnet** | Well-specified product builds; never touches pinned chokepoint files | PC-03 → PC-04 → PC-06 → PC-08 → PC-10 → PC-11 → PC-15 → PC-19 → PC-17 → PC-22 → PC-23 → PC-25 |
| **C — GTM/Ops** | **Sonnet** | Outreach kits, launch assets, HyperAgent rig; `docs/` + brand-repo handoffs only | PC-13 → PC-14 → PC-26 (support: assets for PC-03/04, YC evidence pulls for PC-27) |

**Mechanics (per lane session):**
1. `git worktree add ../cadence-lane-<X> -b parallel/lane-<X>` (or reuse the existing `cadence-lane-N` checkouts — all repointed at v5).
2. Read this doc §2 for your lane's next row → claim: flip the dashboard row to `🔨 In Dev (lane<X>)` + `bash scripts/lane.sh claim <ID> lane<X> "<globs>"` — globs disjoint from other lanes (the Active-claims table is the collision law).
3. Build to acceptance; gates green; commit with a WHY; `git push origin parallel/lane-<X>:main` (explicit refspec).
4. Flip the row ✅ + one-line note, release the claim, next row.
5. **Collision rule:** Lane A owns the pinned files exclusively. If a B/C row unexpectedly needs a chokepoint edit: stop, mark the row `[needs lane A]`, continue with the next.

**Paste-ready lane briefs:**
- **Lane A (run on Fable):** `Read docs/planning/v13-proof-campaign-plan.md. You are Lane A (judgment lane, Fable). Work the Lane A row set in §3 order: claim per the mechanics, build to acceptance, ship, continue. Chokepoint edits are yours alone. Skip Gated rows until their §4 input exists. The Love Gate governs: enterprise-credible AND consumer-grade, simultaneously.`
- **Lane B (run on Sonnet):** `Read docs/planning/v13-proof-campaign-plan.md. You are Lane B (build lane, Sonnet). Work the Lane B row set in §3 order per the mechanics. Never edit loop.server.ts / runtime.server.ts — if a row needs it, mark [needs lane A] and continue.`
- **Lane C (run on Sonnet):** `Read docs/planning/v13-proof-campaign-plan.md. You are Lane C (GTM lane, Sonnet). Work the Lane C row set: research, assets, rigs, docs. Nothing outward-facing is ever sent or published without the founder's explicit approval.`

## 4. Founder-gated register (the only human dependencies)

| Gate | Blocks | The ask | Recommendation |
| --- | --- | --- | --- |
| LOOM publish + 3 migrations | W1 floor (warm prod) | Publish pending build + apply migrations via Lovable | **Do first — today** |
| Merchant of record | PC-05, G-W2, revenue | Choose Paddle/LemonSqueezy MoR vs Stripe entity; create the account | **Paddle as MoR** — days not months; revisit Stripe at scale |
| Slack app registration | PC-09 | Register the Cadence Slack app (mentions + chat:write) | 30 minutes, do with PC-03 live |
| Google verification | Connector depth for beta + the listing | Submit once PC-03 is live (homepage + privacy policy + domain verification); CASA only when a partner needs Gmail | Fast-track the day the homepage ships (sprint day 2–3); if not cleared by listing day, gate the Google tiles behind "request access" (the documented launch trap) |
| 9 provider OAuth registrations | Connector breadth (Linear, Notion, Figma, Jira, Intercom, Stripe, Zendesk, Productboard, Microsoft) | Register apps (flows built) | Linear + Notion first (wedge users live there); 2/week |
| BuildDriver spend | PC-21 | Approve provider + per-task cap | Claude Agent SDK adapter, capped |
| Outreach/publish approvals | PC-13/14/27, all Lane C sends | Approve target list + every outward post + the YC submit | Standing rule: nothing sends without you |
| Tool-mode floor ruling | Trust UX | Should a human-tightened tool mode be a floor the autonomy dial cannot loosen? | **Yes — human-set is a floor**; dial may only tighten |
| Rename decision | Brand | `Selvedge` brief parked | Keep **Cadence** through launch; revisit only on real user evidence |
| HyperAgent account | PC-26 | Access + verify the $20k grant's expiry terms | Front-load use in the Launch Month |

## 5. Reconciliation with the existing board

- **SW-7 (◐):** non-gated remainder folds into **PC-22**; gated items live in §4. The row closes when PC-22 ships.
- **OBS-PORT (◐ ~80%):** remaining slices ride Lane B opportunistically when a PC row touches that surface.
- **BUILD-DRIVER (⏭️ G13):** **PC-21** un-defers exactly BD-1/BD-2; the rest stays deferred.
- **CMD (H2), SANDBOX, BYO-P5, DSN-05:** parked/gated; nothing here depends on them.
- **G15 (v12) / G16 (LOOM):** done; v13 consumes their outputs (RF loop, oracles, design system).

## 6. HyperAgent $20k deployment (arm's-length GTM compute)

**Posture (research-verified 2026-07-10):** Airtable ships ProductCentral — a direct category competitor — so the credit is **disposable GTM/research compute**, never product infrastructure, never a maintained two-way integration, zero product data resident.

1. **GTM ops engine (spend first):** prospect/community research for the 25-partner list, launch-day monitoring, outreach-cadence tracking; Slack/email triggers; ~$50–100/week. Feeds PC-13/14.
2. **Research rig:** review-mining at scale (G2/Reddit/HN refresh), interview synthesis; $10–25/run. Feeds positioning + YC evidence.
3. **Raise/ops pipeline (secondary):** post-launch.
4. **Never:** core orchestration, decision data, anything ProductCentral could learn from. **Verify the grant's expiry on the account and front-load use** (public terms unverified; treat as time-bound).

## 7. Rhythm (the 25-day ship)

- **Daily during the sprint (days 1–4):** lanes ship continuously; the dashboard is the coordination surface; end-of-day fresh-account walkthrough — the sprint is done when G-SPRINT holds, not when the days run out.
- **Phase close:** Love-Gate walkthrough on a fresh production account (the overwhelm bar: nothing on screen the user doesn't understand, one receipted value moment in the first session); gate fact recorded — no partial credit; next phase opens.
- **Beta sessions ARE research** (the ground-truth mandate): every first session is a discovery interview; findings land as signals + evidence pointers on the claims they touch.

> Full strategic rationale, market evidence, positioning, pricing, and the pressure-test verdicts: [`../strategy/v13-proof-campaign.md`](../strategy/v13-proof-campaign.md).
