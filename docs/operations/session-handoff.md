# Pick up here

> _Created: 2026-08-07 · Last updated: 2026-08-10_

**State at close:** seven commits on `main`, pushed to `origin/main`, tree clean. `tsc` 0 · 8,299 pass / 0 fail · eslint 0 · `bun run build` green · `docs:check` clean. **App code is not live until the founder clicks Publish in Lovable.**

The canonical work order remains [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md). No board rows changed status: this session was founder-directed copy, positioning and design work, not queue items.

---

## Lenny's Data is set up and the first probe is done. START HERE.

The founder bought the $400 Annual + Insider plan on 2026-08-10 and named this **the highest-priority work**, above build items: *"are we building even the right thing."* Official launch stays **mid-September** (he confirmed: do not touch the SSOT date; a 36-hour figure he mentioned is a private stretch target, not a deadline).

**Setup is finished and committed (`64f537dc`). Do not redo it. Read [`../research/lennys-data-archive.md`](../research/lennys-data-archive.md) first.**

- 679 documents (312 podcasts to 2026-08-09, 367 newsletters to 2026-05-05) cloned to `lennys-newsletterpodcastdata-all/`, **gitignored**.
- **The paid licence forbids redistributing raw files "in any form", private repos included, and forbids commercial use.** Treat it as reading, never as an asset: no corpus in git, no corpus in Supaprod's brain or RAG, no analysis published as Supaprod marketing. Derivative internal analyses are explicitly permitted.
- MCP `lennysdata` lives in [`.mcp.json`](../../.mcp.json) (env-driven, portable to Codex/Antigravity/Cursor); token in `.env` as `LENNYSDATA_TOKEN`, **expires 2026-09-09**. It was deliberately removed from the Claude-local registry, so **a restart is required** before `mcp__lennysdata__*` tools resolve.
- The 3-month newsletter embargo is a property of the archive, not the tier. Insider does not lift it. Those ~13 posts are readable on the site; they were never the bottleneck.

**Prior work exists: [`../research/podcast-corpus-lenny.md`](../research/podcast-corpus-lenny.md) already mines 16 episodes with a 10-insight synthesis, and it is cited downstream. DO NOT re-run that sweep.** The delta is 84 unmined in-window podcasts, 367 unmined newsletters, 5 post-cutoff episodes, and quote verification (existing quotes are ASR auto-captions; all 14 source files are now in the archive as official text, and those quotes are already flowing into the YC application).

**First probe, already run — a near-null that matters.** Across all 679 documents: *"forgot the why / nobody remembers the reason"* appears in **1 file**; *"institutional/tribal knowledge"* in 12, mostly in passing. But *"repeating mistakes"* hits 36 files, *"what did we learn / close the loop"* 38, *"no memory / blank slate"* 28. Three quotes carry the finding:

- **Zevi Arnovitz (2026-01-18):** after a model errs you "update the `/command` prompts with that knowledge so that in the future, it's not making that same mistake."
- **Dan Shipper (2025-07-17):** "he recorded all of it, put it into a prompt, and **he never made the same mistake twice**."
- **Lenny's newsletter (2026-02-03), "Step 9: Adding agent memory with AGENTS.md":** LLMs are "Mensa geniuses with the short-term memory of a hamster… if you want continuity, **you have to engineer it**."

**Read:** the pain is real but the vocabulary is wrong. Nobody says "we forgot why we decided." They say the loop is **hand-cranked**. The market's taught best practice is a hand-maintained markdown file. So the wedge is *"the loop you are hand-cranking runs itself"* — which independently validates the existing never-say-remembers/stores/logs doctrine with evidence rather than taste.

**Method warning:** regex over 5.9M words is at its ceiling — "reinventing the wheel" returned 36 files of which ~2 were on-topic. It finds phrases, not meanings, and cannot find the operator who described this pain in words nobody guessed. The deep pass needs semantic search (`search_content` over MCP, post-restart) or parallel full reads. **The founder has not authorised a workflow or subagents; ask before spending at that scale.**

## The one pattern worth carrying forward

**Three separate defects this session were the same failure: a fix that edited one constant and missed its twin, plus a test that then certified the result.** It is worth checking for before assuming a past fix landed.

| Fixed once | Still live somewhere else |
| --- | --- |
| Seeded slug removed from `Receipts.tsx` (2026-08-05) | same slug in `LandingFooter.tsx` **and** `index.tsx` `MACHINE_CONTENT` |
| "You approve every gate" corrected in `DESC` (2026-08-06) | same false claim in `MACHINE_CONTENT`, ten lines away |
| "remember" purged from every `.tsx` surface | `brief.html` and the investor deck, six times each, because a `*.tsx` find-and-replace does not open a `.html` file |

In two of the three, the guard written alongside the original fix read only the file that had been edited, so it passed green the whole time. `src/components/landing/no-seeded-slugs.test.ts` now walks `src`, `public` and `docs/pitch` rather than one file.

---

## What changed

**Truthfulness (`ffeb2d80`, `2e0d1c71`, `362a6e39`)**

- The invented four-row "graded ledger" is gone from the landing page, `/brief` and the investor deck, along with its `Worked example` banner and the dead `.ledger` CSS in both HTML files. It was disclosed rather than removed on 2026-08-05; the founder's ruling is that a page arguing "receipts, not claims" cannot ship a fabricated object with a louder label.
- **A seed fixture was being served as live proof.** `/d/acf1fa74…` is an `is_sample` row that `/proof` deliberately filters out, and it was linked from the footer under the heading "proof" and from `MACHINE_CONTENT` under "## Live proof", which is the copy answer engines read. Both removed.
- Two false claims corrected in `MACHINE_CONTENT`: "You approve every gate" and "The human gate stays in the middle the whole time". The loop is *designed* to run unattended (`MAX_TRACK_CORRECTIONS = 2`, three verify cycles per mission, then it escalates). The gate is real but sits at the **edge** (the merge gate is a fixed floor) and at the **cap**, not in the middle.
- `/updates` filled with six real ships, 2026-07-12 to 08-09, each dated from `git --diff-filter=A`.

**Positioning on machine surfaces (`6af52d95`)**

- `llms.txt`, `llms-full.txt`, `agents.txt` and the A2A card opened with July wording. All now carry the canonical thesis and **the three layers**, which were absent from every machine surface.
- The agent card described us as a place where artifacts "live in one place" — the storage claim the doctrine bans.
- `llms-full.txt` told answer engines we are for "teams building net-new products". [`../strategy/brownfield-positioning-evaluation.md`](../strategy/brownfield-positioning-evaluation.md) is explicit that the canon segments by **role**, and that Transform (650K existing teams) is the larger motion. It was suppressing the bigger market.
- Integrations corrected: the file claimed Linear, Notion, Google Docs and Jira (all `stubAdapter`) while omitting Intercom, Zendesk, HubSpot, Salesforce, Stripe, Canny and Productboard (all real).
- Free-tier retention said 14 days; `FREE_MEMORY_RETENTION_DAYS` is **30**.

**Landing page (`9ebaf0a9`, `6fb20d0c`, `f03b92f2`)**

- The hero said "For product managers **who ship with agents**" while the next beat says "Product is still waiting for its own." It also gated out the Transform motion.
- The hero now opens with the category: **"The agentic-first operating system for product teams"**, blue on `agentic-first` (the machine), ember on `product teams` (the humans), which is the page's own colour language.
- Headline's last verb `gets sharper` → **`guides the next call`**, matching the title, meta description, `llms.txt` and the card.
- CTA `Request access` → **`Join the beta`** in nav and hero, matching what the form's own submit button and `MACHINE_CONTENT` always said.
- Removed under the CTA: the Critic offer paragraph and the invite-code link. Three asks under one button.
- `memory sharpens it` → `the brain guides the next` in the replay strip.
- One of eight restatements of the human gate repointed to the idea the page never made: **the boundaries are set in advance**.

**Contrast, and it was a real AA failure (`f03b92f2`)**

Measured on the rendered page against `#0a0a0a`. The category line was **2.56:1** at 11px against a 4.5:1 floor, so only the ember word was readable. Same 2.56:1 that failed the brief audit.

| | before | after |
| --- | --- | --- |
| category line | `#52525c` 2.56 | zinc-400, 7.55 |
| spec connectives | `#52525c` 2.56 | zinc-400, 7.55 |
| headline verb line | `#71717b` 4.10 (fails under 24px) | `#7a7a85` 4.67, the darkest passing value |

Hero spacing also went from **20 / 28 / 36px** (a linear ramp in 8px steps, invisible against a 52px headline) to **16 / 40 / 56** — a ratio, so the eyebrow hugs the headline it labels, the sub gets a real break, and the CTA gets the largest.

---

## Do not re-debug these

- **`POST /api/mcp` is correct and `/mcp` is a different server.** `src/routes/mcp.ts` is auto-generated by `@lovable.dev/mcp-js` and serves four tools; `src/routes/api/mcp.ts` serves the ten documented ones. Only `search_signals` is in both. A 2026-08-07 change moved the agent card to `/mcp` on the strength of a **GET** probe — GET on an API route falls through to the SPA shell, so it proved nothing. `a2a-card.test.ts` now binds the advertised endpoint to the route file implementing the tools.
- **Layer 02 stays "the loop" in `ThreeLayers.tsx`.** The hero carries the category once, at the top. Under a headline reading "One system, three layers", the same words would be the system inside the system. Both files explain this so it is not re-litigated.
- **Do not re-add an illustrative ledger** anywhere. `Receipts.test.ts` fails if those rows return; its ratchet was reversed this session (it used to *require* them, which made the fabrication load-bearing).
- **The footer's `/proof` link stays.** A beat is persuasion, a footer is a directory. Removing it would leave `/proof` with zero inbound internal links, the condition documented in that same file as what was crippling `/product`.

---

## Open, in the order I would take them

0. **The Lenny corpus analysis — the founder's stated top priority.** Setup is done; the work is not started, by his explicit instruction to stop and restart fresh. See the first section above for the delta, the first finding, and the method warning. Verification of the 16 existing ASR quotes against official transcripts is the cheapest launch-protecting item in it.
1. **P1 is unchanged and still the highest-value action *that needs the founder's hands*: settle one outcome.** It costs ~10 minutes and does not compete with the corpus work, which is agent time. His own stated principle this session — do not "claim which is not there in the product" — is exactly this item. `applyOutcome` has never completed in production. Founder-only; an agent must not author the verdict word. Everything about the compounding claim rests on a path that has never run, and `/proof` shows an honest zero until it does.
2. **Sweep `zinc-600` across the rest of the landing page.** It measures 2.56:1 and fails AA anywhere it carries text under 18px. This session fixed three instances in the hero; the token is almost certainly used as a quiet tier in other sections.
3. **`/faq`, `/product` and `/security` copy was not audited.** Three of the four surfaces that *were* checked carried a dated or false claim, so these deserve the same read.
4. **The hero spec column's vertical anchor.** It is centred against a left column that got ~120px shorter when two blocks came out. Its colours are now correct; its position was not re-derived.
5. **`/brief` and `/investors` are still iframe-over-`brief.html`,** so crawlers cannot see them. This is the SEO/GEO item the founder asked for by name and it is still open.

---

## 🚨 LANE 0 CYCLE 1 COMPLETE — FINDINGS & EXECUTION DIRECTIVES (2026-08-10)

**Lenny's Data analysis is done.** Full findings in [`../research/lane0-cycle1-findings.md`](../research/lane0-cycle1-findings.md). **Eight actionable gaps are now routed to Lanes 1 & 2 in SSOT rows 96–103.** This section broadcasts them. Do not treat this as a report to read later — these are active directives with owner, priority, sequencing.

### Three Primary Findings (Market Evidence)

**Finding 1: Decision Memory + Receipts Is The Wedge (P0)**
- **The pain:** Operators say "why did we decide X?" — they need instant proof (decision → evidence → shipped → outcome verdict).
- **Not agent autonomy; not Critic red-team.** Market validates verification over capability (Aakash $28K, Fin $0.99/resolution, Mercor $400M).
- **Market vocabulary is exact:** Reddit r/PM (480 pts): *"Why did we decide X? Cue hours finding that Slack conversation."*
- **Action:** RPT-01 & RPT-12 (decision memory + outcome-fed trust) MUST ship BEFORE launch, tested end-to-end. Demo: "Why did we decide X?" → instant chain with proof.
- **Owner:** Lane 1 (engineering) + Lane 2 (UX reframe)

**Finding 2: Governance Via Capabilities, Not Process Orchestration (P1)**
- **Cherny right:** Process orchestration is dying (2026-02-19: "you get better results if you just give the model tools, you give it a goal, and you let it figure it out").
- **But governance is load-bearing:** Approval floors, capability grants, receipts as evidence — Anthropic Cowork, OpenAI rules, Reganti/Badam patterns all require this.
- **Market validates governance:** Teams pay for trust + receipts, not tool breadth. Graduated autonomy requires proof (receipts per capability, not assumed).
- **Action:** WM-M15 (Captains + trust ladder) is HIGHER priority than mission breadth. Every agent capability starts at trust tier, earns advancement only via receipts. Reorder build queue.
- **Owner:** Lane 1 (prioritize governance over autonomy expansion) + Lane 2 (remove "orchestrates"; say "governs")

**Finding 3: Buyer Is The Fleet Manager, Not Solo PM (P1 ICP shift)**
- **Evidence:** Lemkin (SaaStr 2026-01-01): Amelia (product staff) spends 20% time managing, orchestrating agents. Coinbase: one-person teams (2026).
- **Implication:** TAM isn't "PMs using AI helpers." It's "one operator managing a fleet of agents (2–20)." Title shift from PM to product-staff / product generalist / product founder.
- **Action:** Refine ICP archetype from "individual PM" to **"operator (PM/founder/product generalist) managing an agent fleet."** Lead GTM with Lemkin's Amelia seat.
- **Owner:** Founder (positioning/messaging) + Sales (GTM targeting)

### Eight Gaps — Execution Lanes & Sequencing

**Lane 1 (Engineering & Core) — 5 Items**

| Gap | Priority | Owner | What Changed | Action | Blocker? |
|-----|----------|-------|-------------|--------|----------|
| **G1.1** Memory expiry gate OFF | P1 | Lane 1 | Moat breaks if expiry is ON at launch. Currently OFF (correct state). **Gap: no test** that fails if it ever flips. | Add gate test: `memory_expiry_enabled()` must read false at launch. Test fails if ever enabled without founder approval. | Founder confirms state is good |
| **G1.2** Decision memory + receipts | P0 🔥 | Lane 1 + L2 | Wedge is decision memory, not Critic. RPT-01 & RPT-12 must ship BEFORE launch, tested end-to-end. Demo: "Why did we decide X?" → instant chain (decision → evidence → shipped → outcome). | Ship + test RPT-01 & RPT-12. Do NOT launch without this working. | None |
| **G1.3** Billing tier reconciliation | P1 | Lane 1 | Code has five internal tiers (free/pro/max/team/enterprise); founder locked four public tiers (Free/Pro/Business/Enterprise, 2026-07-13). Reconcile slugs, verify memory-expiry logic covers all tiers. `max` is internal-only, `team` displays as "Business" — likely already correct. | Verify tier reconciliation is complete or remove unused `max` tier per founder decision. Audit memory-expiry list. | Founder decision: is current state acceptable? |
| **G1.4** Outcome settlement end-to-end | P2 | Lane 1 + Founder | `applyOutcome` has never run in production. Moat claim rests on this. Founder needs to settle one outcome (10 minutes: visit `/proof`, pick any decision, run verdict, record outcome). | Founder: settle one outcome. Lane 1: verify path works, close the loop in `/proof`. | Founder time (10 min) |
| **G1.5** WM-M15 priority reorder | P1 | Lane 1 | Governance (Captains + trust ladder) is now HIGHER priority than mission breadth. Founder was expanding mission tiers; evidence says governance first. | Reorder build queue: move WM-M15 (Captains, trust ladder, approval gates) above additional capability expansion. Every new capability starts at trust tier. | None |

**Lane 2 (Design & UX) — 3 Items**

| Gap | Priority | Owner | What Changed | Action | Blocker? |
|-----|----------|-------|-------------|--------|----------|
| **G2.1** Hero reframe | P0 🔥 | Lane 2 + Founder | Current hero says "agents build autonomously." Market pain is "why did we decide X?" with proof. Wedge is decision memory, not agent autonomy. | Reframe hero from "agents build" to "every decision on the record with proof." Lead with "Why did we decide X?" — the exact operator pain language. | None |
| **G2.2** Seven-station UX compression | P1 | Lane 2 | Station model is architecturally correct (seven-station is right). But market loops compress to 3-beat: Prototype → Outcome → Learn (W3 finding). Showing all seven names adds cognitive load, makes product look pedagogical. | Hide station names from user path; show only decision → build → outcome milestones. Keep 7-station in Engine Room (admin). UX refactor only, no architecture change. | None |
| **G2.3** Vocabulary shift | P1 | Lane 2 | Cherny right: process orchestration dying. But governance is load-bearing. Language matters for differentiation. "Orchestrates" is wrong. | Replace "orchestrates" with "governs decisions." Add "agents earn capability via receipts," "approval gates," "graduated autonomy." Audit all user-facing surfaces. | None |

### Founder-Escalated Calls (Blocking)

These three must be resolved before Lanes 1 & 2 can execute some gaps.

| Item | Status | Action | Urgency |
|------|--------|--------|---------|
| **Lemkin quote in YC app** | BROKEN (lines 1051–1052 in fall-2026-application.md) | Paste corrected paragraph (lines 1071–1080, same file). Full audit in [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md). | 🚨 URGENT — blocks investor submission |
| **Memory expiry gate** | GOOD (set to FALSE in DB seed) | Confirm this state is acceptable. G1.1 will add test to prevent flipping. | CRITICAL — unblocks G1.1 |
| **Billing tier reconciliation** | LIKELY OK (max is internal-only, team displays as Business) | Confirm current structure matches your intent or decide on max-tier removal. | STRATEGIC — unblocks G1.3 |

### What This Means for Build Priority

**Do not start anything new until:**
1. G1.2 ships (decision memory + receipts) — this is the wedge and the moat
2. G2.1 ships (hero reframe) — this is how you talk about G1.2
3. WM-M15 moves up the queue (governance before autonomy expansion)

**Do not launch without:**
1. G1.2 working end-to-end
2. G1.1 test in place (memory expiry gate)
3. G1.4 verified (at least one outcome settled and on `/proof`)

**What you are not building (kill list):**
- Mission breadth expansion without governance in place
- Agent expansion without capability-tier advancement
- Orchestration language (use "governance" instead)
- Storage claims (use "decides," "learns," "guides next call")
- Seven-station UX (keep internal, hide from user path)

### Evidence

- **Lenny's Data:** 679 documents (312 podcasts + 367 newsletters), official paid archive, 2026-08-10
- **W3 analysis:** Full corpus sweep completed; findings synthesized from 200+ on-topic hits
- **Quote verification:** [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md) — official transcripts checked against ASR captions; two Class 2 defects found (archive mis-filing)
- **Positioning locked:** moat, category, ICP (shift to fleet manager), wedge (decision memory), station model (pedagogical, UX refactor only)

### What the Next Cycle Looks Like

**Trigger:** New Lenny drop (newsletter or podcast) OR when Lanes 1 & 2 ship 50%+ of the 8 gaps.  
**Refresh:** Compare market shifts against what you built; push changes only when something moved.  
**Frequency:** Max 2x/month, never daily.

---

**Cycle status:** Analysis complete. Findings routed. Execution waiting on Lanes 1 & 2 prioritization and founder confirmation on three calls. Do not mark this as done until lanes have committed changes.
