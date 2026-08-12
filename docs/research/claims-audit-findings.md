# Claims audit — the complete findings, verbatim

> _Created: 2026-08-12 · Last updated: 2026-08-12 23:15_

**The raw record behind [`claims-audit.md`](./claims-audit.md).** That file is
the readable analysis; this one is every finding as the fact-checkers returned
it, so no claim ever has to be re-litigated from memory or re-derived at cost.

It is committed because the workflow journal that produced it (272 KB) lives in
a Claude session directory outside git and **does not survive the session**.
Losing it would mean paying for the same audit twice, which is the exact failure
[`README.md`](./README.md) warns about for this folder.

**Method.** Eight agents: four grounding lanes (vocabulary law, enterprise
proof, real product surfaces, checkable proof), then adversarial fact-checkers
instructed to **refute** rather than confirm. A claim survived only if the agent
could open the cited file and see the mechanism work end to end. A mechanism
with no writer, a column nothing populates, a doc describing an intention, or a
surface rendering seeded data all failed.

**Re-run it:** `Workflow({scriptPath: '.claude/workflows/claims-audit.js'})`.
The harness is committed alongside, so this is reproducible on any machine.

**Before citing anything below, re-verify it.** These were true against the
codebase on 2026-08-12. Evidence lines carry `file:line`; a number without its
query is not evidence.

---

**143 unique claims. 43 refuted, 100 survived.**

## A. Refuted — do not say these (43)

**48 of the ~80 files matching src/routes/_authenticated.*.tsx are pure redirects with no rendered UI at all. The marketing site must not name these as surfaces — they are addresses, not screens.**

- Evidence: Classification loop over src/routes/: every file under 45 lines contains `redirect(` except _authenticated.onboarding.tsx and _authenticated.prds.tsx. Includes /artifacts→/brain?tab=artifacts, /opportunities→/decide, /govern→/engine-room, /observe→/engine-room, /trust-ledger→/track-record→/engine-room, /build/$missionId→/runs/$missionId, plus /roadmap, /memory, /knowledge, /agents, /evals, /guardrails, /drift, /traces, /analytics, /budgets, /prompts, /inbox, /tasks, /calendar, /chat.
- Note: Two of these are genuinely load-bearing IA facts worth knowing: /discover?tab=queue redirects to /decide (the ranked queue left Discover on 2026-07-13), and /trust-ledger is a compatibility stub because 'trust ledger' is retired vocabulary under the 2026-08-11 ruling.

**THE BLOCKER ON THE BEST VISUAL: the re-rank moment — the record moving a bet's score off a recorded outcome — does not currently exist in any real workspace. Measured through the Lovable MCP on 2026-08-06: of 119 learnings, 49 carry a `new_ice`; 48 sit in an is_sample workspace (Sample workspace 24, Sample sandbox 12, Explore workspace 12), the 49th points at a deleted workspace row, and ZERO sit in a real one.**

- Evidence: src/routes/_authenticated.decide.tsx:2328-2345, re-derived in the same block: "119 learnings, 49 with a `new_ice`, 48 of those in a sample workspace ... one pointing at a deleted workspace row, ZERO in a real one". Also decide.tsx:2059-2061: "20 of 292 [opportunities] true, 0 null".
- Note: This is the exact failure mode in the user's own memory note ('A number without its query is not evidence'). Any site copy or screenshot asserting 'the record re-ranked your bets' is today only demonstrable on seeded data. The honest form per CLAUDE.md is 'the loop is wired and proven, and it begins accruing on first real use'.

**Data residency / processing region.**

- Evidence: src/lib/compliance/subprocessors.ts:38 declares `region?: string` as OPTIONAL, and `grep -n 'region:' src/lib/compliance/subprocessors.ts` returns ZERO assignments. src/routes/subprocessors.tsx:68 renders `{s.region ? ' · Processed in ' + s.region : ''}` so it always renders empty. Meanwhile subprocessors.tsx:20 promises 'the region it runs in' and :144 defers to email.
- Note: The site currently PROMISES region disclosure in its own meta description and delivers none. This is a live overclaim on a compliance page, not just a gap — a CISO who reads the description and then the list will notice. Either populate the region field or cut the promise from line 20. No residency commitment exists anywhere in the repo; grep for SAML/SCIM/SSO also returns nothing in src (only CSS/routetree noise).

**There is a /trust page to send an evaluator to.**

- Evidence: src/routes/trust.tsx:1-12 — the file is a permanent redirect to /security and nothing else; :3-4 records it was retired from the sitemap on 2026-07-11
- Note: /security is the only security surface that exists. If the site plan assumes a separate trust center, it has to be built, not linked. Related staleness to fix before an enterprise evaluator reads it: security.tsx:40 still stamps 'July 10, 2026' as the updated date, which predates the kill switch, boundary ledger, egress guard and injection screens now shipped — the page currently undersells the product by about a month.

**/proof is live, SSR, unauthenticated, and computes its number from the real production database at request time — and it currently prints an honest zero rather than a score.**

- Evidence: curl https://supaprod.ai/proof -> HTTP 200. Embedded SSR payload: calibration={predictionHitRate={rate:null,hits:0,total:0,tableReady:!0},supersessionsCaughtTotal:0},decisions=[]. Rendered strings present in the HTML: "Not enough recorded outcomes yet", "honest zero", "No public decisions yet". Loader: src/routes/proof.tsx:23-29; data fns: src/lib/proof-share.functions.ts:27, src/lib/decisions-share.functions.ts:296
- Note: SHOWS AN HONEST ZERO. tableReady is true, so the query succeeded — there is genuinely nothing scored. Do not write any sentence implying a calibration percentage exists. The only usable claim is the meta one: "we publish this live and today it says zero." Note rate:null means Math.round(rate*100) is never reached, so there is no risk of a 0% being printed.

**There are two different MCP servers on this domain and they serve different tools — /api/mcp (11 read + 4 write) and /mcp (4 tools, Lovable auto-generated).**

- Evidence: POST https://supaprod.ai/mcp -> {"error":"unauthorized"} (not JSON-RPC shaped), vs /api/mcp returning proper JSON-RPC. src/routes/mcp.ts is banner-marked "AUTO-GENERATED by @lovable.dev/mcp-js"; its tools are src/lib/mcp/tools/{list_decisions,list_workspaces,search_signals,whoami}.ts. src/lib/mcp-protocol.ts declares 11 read tools (lines 55-173) and 4 write tools (lines 219-261).
- Note: Do not put this on the site — it is an internal inconsistency, not a proof point. Flagging it because any published tool list must point at /api/mcp specifically. The card already gets this right (src/lib/a2a-card.ts endpoints.mcp = /api/mcp).

**Every published tool count on the site is understated and wrong: llms.txt, agents.txt and the agent card all say "10 read tools + 1 write tool"; the server actually has 11 read tools and 4 governed write tools.**

- Evidence: public/llms.txt:'MCP Server: live at POST /api/mcp ... 10 read tools (search_signals, search_opportunities, search_decisions, search_prds, get_prd, get_ard, get_roadmap, export_skillpack, get_governing_decision, get_contradiction_history) + 1 governed write tool (ingest_signal)'. src/lib/a2a-card.ts read_tools[] lists the same 10, write_tools[] lists only ingest_signal, write_scopes_available: ["write:signal"]. Reality: src/lib/mcp-protocol.ts:148 adds outcome_history (11th read tool); WRITE_SCOPE_BY_TOOL at lines 203-215 maps ingest_signal, record_decision, draft_spec, settle_outcome to four scopes; all four are dispatched in src/routes/api/mcp.ts:343,350,354,358. A repo comment already caught this: MachineViewContainer.tsx:6 — 'This line said "10 read tools" and there are 11.'
- Note: Fix before publishing any tool count. The honest current number is 11 read + 4 governed write. Understating is safer than overstating, but these are machine-readable surfaces an agent follows literally — get_ard is listed, outcome_history is not, so an agent discovers ten of eleven capabilities.

**llms.txt states 'row-level security on all 111 tables'. The generated Supabase types declare 170 tables in the public schema.**

- Evidence: public/llms.txt:93 — 'Data layer: Supabase PostgreSQL + row-level security on all 111 tables'. Counted top-level keys under the `Tables: {` block in src/integrations/supabase/types.ts -> 170 (first ten: account_billing_secrets, account_credits, account_members, accounts, activation_events, admin_audit_log, agent_approvals, agent_autonomy, agent_disabled_skills, agent_memory).
- Note: The number is stale by 59 tables, and I did not verify that RLS is enabled on all 170 — that requires a pg_class/pg_policy query, not a type count. Either drop the number or run the SQL and record the query alongside it. Publishing a table count you cannot re-derive is exactly the failure mode this repo's own docs warn about.

**llms.txt and agents.txt claim '?view=machine' works on ANY Supaprod URL. It is implemented on exactly one route, and it is client-side only.**

- Evidence: public/llms.txt: 'append ?view=machine to any Supaprod URL for structured markdown output'. grep -rl MachineViewContainer src/ -> only src/components/machine/MachineViewContainer.tsx and src/routes/index.tsx. Live check: curl 'https://supaprod.ai/proof?view=machine' -> HTTP 200 text/html, 25908 bytes — byte-identical size to https://supaprod.ai/proof (25908), and the response begins with the ordinary <!DOCTYPE html> SPA shell, not markdown.
- Note: Two separate defects: (1) coverage — the toggle exists on the landing page only, so the claim is false for /proof, /demo, /ard, /updates and everything else; (2) delivery — MachineViewContainer branches on a client hook (useMachineView), so an answer-engine crawler that does not execute JS never sees markdown at any URL, including the landing page. Either narrow the claim to the landing page or make it a server response.

**The public demo workspace at /demo is live, SSR, read-only and renders real rows from a real workspace — a real Critic teardown with named risks and missing evidence, and a real decision ledger with supersession rationale.**

- Evidence: curl https://supaprod.ai/demo -> HTTP 200. SSR payload contains teardown={title:"Bank-link drop-off at activation",iceScore:8,verdict:"revise",summary:"Significant drop-off (38%) at bank-linking...",risks:[3],missingEvidence:[4],reviewedAt:"2026-07-06T21:35:25.746Z"} and ledger rows including "Supersede launch fraud policy with per-user precision scoring" with a full rationale. Loader: src/routes/demo.tsx:88-98; data: src/lib/demo.functions.ts, DEMO_WORKSPACE_ID = b90da531-34aa-4009-bcce-2162b87f50ac (line 37). Every query is a plain SELECT with no write path (demo.functions.ts:17-21).
- Note: SEEDED. The live payload reports workspaceName:"Sample sandbox" — a name that is literally on the exclusion list /proof uses to keep seeded data out of the public score (proof-surface.functions.ts:149). Link it as "a sample workspace, no signup" and never as evidence of usage. Two further problems: the live counts are missionsDelivered:1, missionsOpen:0, missionsStopped:32, so the demo's own arithmetic is 32 stopped against 1 delivered and zero in motion; and the source comment (demo.functions.ts:3) calls this workspace "Helio Labs" while it now renders as "Sample sandbox", so the code and the page disagree about what it is.

**The public decision share route /d/$slug exists and is RLS-gated, but there is currently nothing published to point at.**

- Evidence: listPublicDecisions (src/lib/decisions-share.functions.ts:296-321) queries decisions where is_public = true and share_slug is not null, excluding sample workspaces; the live /proof SSR payload returned decisions:[]. /proof renders the empty branch: 'No public decisions yet' (proof.tsx:237-246). Route file src/routes/d.$slug.tsx exists.
- Note: Zero public decisions exist right now, so there is no shareable receipt URL to feature. The mechanism is built and the empty-state copy is honest ('never seeded or staged'), but publishing even one real decision from Supaprod's own build would convert this from a capability claim into a checkable artifact — that is the single highest-leverage thing you could do before the site ships.

**The investor-facing build-scale line already on record is stale in three places.**

- Evidence: docs/pitch/founder-answer-playbook.md:78 — '~1,440 source files · 79 authenticated routes · 151 server-function modules · 512 migrations · 402 test files · 7,159 tests passing'. Measured today: 1,602 source files, 82 authenticated route files, 158 server-function modules, 530 .sql migrations, 514 test files, 8,755 tests passing.
- Note: Every figure moved up, so the error is understatement rather than inflation — but it is a live outward-facing answer sheet quoting six numbers that no longer reproduce. Refresh it in the same session as any site copy that draws on it.

**BANNED — "receipts" / "receipt" / "receipted". Rate 3.0 per million in the market's own writing. Replace with **evidence** (50.9/M) or **history** (103.3/M). 35 of the 116 audited string changes were this one word.**

- Evidence: AGENTS.md:39 — "DROP, we invented these … receipts 3.0 → evidence 50.9 or history 103.3"; count at docs/growth/vocabulary-change-list-2026-08.md:9
- Note: Adjectival form "receipted" also dies: "Get a receipted teardown" → "Get an evidence-backed teardown" (vocabulary-change-list-2026-08.md:161-162). Note the article changes a→an.

**BANNED — "ledger" (0.2/M) and "trust ledger" / "Trust Ledger" / "The Ledger" (measured ZERO occurrences in 5.72M words). Replace with **track record**. 48 of the 116 audited changes were this word.**

- Evidence: AGENTS.md:39 — "ledger 0.2, trust ledger zero → track record"; docs/growth/vocabulary-change-list-2026-08.md:9 and :134
- Note: "ledger" is a NAMING failure, not a copy failure: it must be renamed on every surface at once or a page names itself two things (vocabulary-change-list-2026-08.md:258). The shipped label is already "Track record" in the landing footer (LandingFooter.tsx:59) and in llms.txt.

**BANNED — "unattended" (0.2/M). Replace with **"on their own"** / **"on its own"** (12.4/M) or **"overnight"** (14.3/M). The canonical approved sentence is: "Seven stations that agents walk on their own, inside boundaries a human sets in advance."**

- Evidence: AGENTS.md:39; approved replacement string at docs/growth/vocabulary-change-list-2026-08.md:30 and shipped at public/llms.txt:14
- Note: The replacement sentence IS usable on site verbatim — it is already live in public/llms.txt.

**BANNED — "first run" / "time to first run" (0.2/M). Replace with **"get started"** / **"time to get started"** (42.1/M).**

- Evidence: AGENTS.md:39 — "first run 0.2 → get started 42.1"; docs/growth/vocabulary-change-list-2026-08.md:176

**BANNED — "provenance" (0.3/M). Replace with **history**.**

- Evidence: AGENTS.md:39 — "provenance 0.3 → history"; example swap at docs/growth/vocabulary-change-list-2026-08.md:67 ("shown for honest provenance" → "shown for honest history")

**BANNED — "decision layer". No replacement noun: say what it does. Where a thing must be named, the approved noun is "the decision record".**

- Evidence: AGENTS.md:39 — "decision layer → say what it does"; worked example at docs/growth/vocabulary-change-list-2026-08.md:197

**BANNED — "company brain" as our own words. It is YC's phrase and may only appear as an attributed quotation of YC's Request for Startups, never as our brand identity. Our word is **shared brain**.**

- Evidence: README.md:49 — "'Company brain' is YC's phrase, quoted and attributed, never our brand identity"; ban listed at CLAUDE.md:9 and positioning-locked-2026-08.md:301; 10 audited changes per docs/growth/vocabulary-change-list-2026-08.md:9
- Note: README.md:280 also bans YC mentions in generic materials, so on a public site the attributed-quote exception is effectively unusable.

**BANNED — "agentic-first" and "agent-first", everywhere in our own voice. `X-first` is a category-claim construction doing exactly what "operating system" did, and the compound is ours, not the market's. Say what agents do instead.**

- Evidence: AGENTS.md:39 and docs/strategy/positioning-locked-2026-08.md:422 — "Kill `agentic-first` and `agent-first` … Everywhere in our own voice. Third-party quotes and dated records keep it"

**BANNED IN HERO/EYEBROW/KICKER — the adjective "agentic" survives (53 corpus documents; it is the market's word, not our invention) but is NEVER allowed in a hero, eyebrow, kicker, the 50-character line, or cold outreach. Keep it only for technical docs, investor and analyst material.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:420-421 and AGENTS.md:39
- Note: Reason: Gartner's 2026 Hype Cycle puts agentic AI at the Peak of Inflated Expectations and the corpus discusses it sceptically, so a sceptical reader applies the discount before the second sentence (positioning-locked-2026-08.md:412-414). The concrete noun "agents" is always safe.

**BANNED — the whole phrase "the agentic-first operating system for product teams". Retired EVERYWHERE, not demoted, including machine-readable surfaces (llms.txt, agents.txt, the A2A card). Founder's instruction: "make sure everywhere it is replaced."**

- Evidence: docs/strategy/positioning-locked-2026-08.md:236 and README.md:23 — "That phrasing is now retired everywhere, not merely demoted"
- Note: Evidence: April Dunford (~200 B2B positioning engagements) finds platform-class words read as meaningless to buyers, and across 5.9M words nobody names a lifecycle or an operating system (positioning-locked-2026-08.md:15).

**BANNED ON THE SHOP WINDOW — the bare word "operating system" is on the Never list for landing page, brief and listings.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:203 — Landing page/brief/listings Never column: "receipts · ledger · audit trail · company brain · operating system · unattended"
- Note: IMPORTANT TENSION: layer 02 is still NAMED "the operating system" in the three-layer table and that name survives on the live public crawler file (public/llms.txt:13, README.md:42). What is banned is using it as the category claim / lead / hero, not the layer's name inside the three-layer telling. Also note the same table's "audit trail" entry is explicitly declared WRONG at positioning-locked-2026-08.md:197.

**BANNED AS VERBS OF THE BRAIN — "remembers", "stores", "logs". Banned everywhere (not just public), because they claim less than the product delivers. Layer 03 "learns, then guides. Never 'stores' or 'remembers'."**

- Evidence: AGENTS.md:23 and CLAUDE.md:9 — "'Remembers', 'stores' and 'logs' as verbs of the brain stay banned everywhere"
- Note: They remain ordinary words elsewhere: a dated shipping log, an app store, a variable named `store` (README.md:82). The ban is only on the brain.

**BANNED PHRASES — "where the record lives", "searchable history", "it remembers your decisions", and "storage"/"archive"/"log" of the brain. Say instead: "it compounds" · "next time it tells you what is right, and warns before you repeat what was wrong" · "it guides the next call" · "the brain, which learns and guides".**

- Evidence: README.md:75-80 (the Say/Rather-than table) and AGENTS.md:51 — "Never write 'where the record lives', 'stores', or 'searchable history' in UI copy, a doc, or a commit message"
- Note: The right-hand column of that table IS the approved copy and is usable verbatim. README.md:82: the table is phrasing, not a script — rewording is always free as long as the claim survives.

**BANNED CLAIM — "90–95% agentic". Retired; contradicted by everyone shipping agents. The truthful replacement is graduated autonomy with gates, which is both what was built and the empirically winning pattern.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:87, :220, :249 and README.md:154

**BANNED CLAIM — "the outcome ledger cannot be backfilled" / any "cannot be backfilled" claim about the record. Falsified: the record WAS backfilled twice on the record. Only the forecast cannot be backfilled.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:86 — "❌ 'The outcome ledger cannot be backfilled' → the forecast cannot be"; prohibition restated at :249

**BANNED CLAIM — "the labs decline this vertical". Falsified: they could have built it and could not do so securely across someone else's tools; an independent third party has no such restriction.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:88
- Note: Related correction at positioning-locked-2026-08.md:279-283: it is ONE lab on record (Krieger/Anthropic), not two. Anyone repeating it must say one, not two.

**BANNED CLAIM — "single-suite incumbents cannot be neutral". Absent from 5.9M words. The threat operators actually name is **DIY**.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:89

**BANNED — "legacy the day it ships" and all inevitability language. Softened deliberately: the most credentialed post of its era called web3 "risky and inevitable" and pointed readers at FTX nine months before it collapsed.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:90, :249 and README.md:154

**BANNED CLAIM — "that compounding is the moat" / "the compounding record is the moat". Retired 2026-08-10; the compounding record is backfillable. The forecast is the moat.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:220 — "❌ 'that compounding is the moat' — the compounding record is backfillable; the forecast is the moat"
- Note: LIVE DRIFT: the current site still ships the retired claim at src/routes/index.tsx:153 — "## The moat / The compounding, not the record." Do not copy that string forward into a new site.

**BANNED STRUCTURE — the seven-station route diagram as the front door. The stations predate agents at ~15 named companies so they are a commodity, and a heavily-diagrammed staged lifecycle is the visual signature of SAFe, which this buyer is ripping out.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:94 and :220
- Note: The approved replacement picture is a CYCLE WITH TWO FRONT DOORS — Discover for genuinely new problems, Build → Learn for anything cheap to test (positioning-locked-2026-08.md:140, founder-approved, in flight). The stations may still be listed, just not diagrammed as the hero.

**BANNED PHRASING — "Cursor for PMs" on any surface. Also on the investor never-list: commit counts, feature-register numbers, YC mentions in generic materials, and an explicit self-build story.**

- Evidence: README.md:280 — "Never list, investor material: no commit counts or feature-register numbers, no YC mentions in generic materials, self-build story implicit only, no 'Cursor for PMs' phrasing on surfaces"

**BANNED — the word "context" used alone on a marketing surface. It means the LLM context window here and reads as jargon.**

- Evidence: AGENTS.md:42 — "Never use 'context' alone on a marketing surface"
- Note: "Context governance" (the operator's own name for the category) and "context graph" (ThoughtWorks' term) are both KEEP — the ban is on the bare noun.

**BANNED IN HEADLINES — "audit trail" may NEVER appear in a headline, hero, eyebrow, or anywhere it is trying to make someone care. "It names a control. Controls do not earn attention."**

- Evidence: docs/strategy/positioning-locked-2026-08.md:381-382 — table rows: "Trying to make someone care → ❌ never `audit trail`" and "A headline, hero or eyebrow → ❌ never"
- Note: This is the single most misread rule in the corpus — see the KEEP finding below for where it IS allowed.

**TENSE LAW #2 — NEVER imply an unbroken signal → shipped → learned chain. It is broken in two places: Discover promotes 3 of 86 themes, and Build writes zero changeset and zero deployment edges. Only the Discover → Decide → Learn half is real and demoable.**

- Evidence: AGENTS.md:37 and docs/strategy/positioning-locked-2026-08.md:79, :134, :248
- Note: A site animation or film that shows one signal flowing through all seven stations to a shipped outcome traverses precisely the broken region. positioning-locked-2026-08.md:134: "do not demo the full station walk on a real account."

**NEVER RESTORE A COUNT to the proof line. The parenthetical "36 real learning → decision edges" was seed data — all 71 such edges are seeded, zero have `seeded = false`, and the `prd → learning` writer had never fired. The proof is that the arrow EXISTS and is wired, with no number attached.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:213 — "Never restore a count to this beat"; retraction at :74
- Note: Any metric on the site that came from that lineage query is unsupported until requeried. §5I's "Learn auto-settles 32% of outcomes" figure sits in the same retracted measurement family — treat it as unverified for public use.

**DO NOT claim the category "decision intelligence". It is a real Gartner category whose Leaders (FICO, SAS, IBM, Quantexa, ACTICO, Aera) sell automated high-volume operational decisioning. Claiming the name puts us in a bake-off on decision throughput and latency — "worse than having no category."**

- Evidence: docs/strategy/positioning-locked-2026-08.md:353

**SUPERSEDED STRINGS — the 2026-07-22 ratified tagline "Agents that know what to build, ship it, and remember.", its support line "One agentic operating system, every call on the record.", and the journey kicker `signal -> shipped -> remembered` all LOSE on any public surface. Ship the guiding form instead.**

- Evidence: README.md:272-275 — "This string predates the learns-and-guides ruling above and loses to it on any public surface"
- Note: They are still printed under a heading called 'Positioning canon', so they are an easy trap for anyone skimming. They break three rules at once: "remember", "agentic operating system", and "remembered".

**CURRENT TRUTH behind the tense laws: 8 users all founder/internal, **zero organic external users**; no revenue (billing built, tested, deliberately switched off); 6 production workspaces all founder/test, no customer data at all; 18 missions · 5 decisions · **0 learnings**; solo founder, no entity incorporated yet.**

- Evidence: README.md:292-299
- Note: Not site copy — but it is the fact base that makes every present-tense learning claim false. Build stats (1,440 source files · 79 authenticated routes · 462 migrations · 402 test files, 7,159 passing) sit at README.md:296, but README.md:280 bans commit counts and feature-register numbers in investor material.

**NO AUTOMATED GUARD EXISTS for any of these banned words. `scripts/check-humanized.sh` and `scripts/docs-doctor.sh` contain zero vocabulary checks — a site that breaks the law ships silently and green.**

- Evidence: Command output: `grep -in "ledger|receipt|unattended|provenance|operating system" scripts/check-humanized.sh scripts/docs-doctor.sh` returned one unrelated hit (docs-doctor.sh:7, "Documentation Operating System" in a comment); `ls scripts/` shows no vocabulary linter.
- Note: Corollary: the sweep HAS already been applied to the live public surfaces — grep of public/llms.txt, public/agents.txt and src/routes/ marketing files returns no banned terms. Remaining hits are in-product identifiers and code comments only (e.g. src/routes/_authenticated.boundary.tsx), which AGENTS.md:225-230 puts explicitly out of scope.

**LIVE DRIFT TO NOT COPY FORWARD: src/routes/index.tsx:153 still ships the retired moat claim "## The moat / The compounding, not the record" inside MACHINE_CONTENT, contradicting the 2026-08-10 correction that the compounding record is backfillable and the forecast is the moat.**

- Evidence: src/routes/index.tsx:153 vs docs/strategy/positioning-locked-2026-08.md:220

**NEW FINDING, not in the submitted list: the new marketing site's own Hero violates the repo's build-failing anti-theater guard, and a new site route breaks the reserved-slug invariant. Both are why `bun test` is red.**

- Evidence: src/components/site-v3/Hero.tsx:38-39 — `const id = setInterval(() => { if (!paused.current) setLit((n) => (n + 1) % STATIONS.length); }, 1600)`. This is the exact banned shape: a timer advancing an index into a list of step labels. Caught by src/__tests__/no-fabricated-agent-steps.test.ts:106, offenders = ["components/site-v3/Hero.tsx"]. The guard's rationale (:5-39) states the line: 'A timer that advances a COUNT is fine ... A timer that advances an INDEX INTO A LIST OF STEP LABELS is a fabrication.' Separately, src/lib/reserved-workspace-slugs.test.ts:68 fails with unreserved = ["next"], because src/routes/next.tsx is a new untracked route whose first segment was never reserved via migration.
- Note: MUST FIX — this is the most consequential thing I found, and it is about the site itself rather than the product. The guard exists because two surfaces previously narrated agent work that never happened, and its comment argues that invented narration is 'the precise screenshot a skeptical reviewer needs to argue it is a wrapper with theater on top, and that argument would be fair.' Hero.tsx now does the same thing on the homepage: its own comment at :29-31 concedes the rail is 'decoration with a meaning: the loop runs whether or not you are watching it' — i.e. animated motion implying live work, on a marketing page, for a product whose whole claim is that you can see what agents are actually doing. It is the highest-visibility possible place to reintroduce the defect. Fix by lighting the rail on scroll position or hover rather than a timer, which keeps the motion and drops the false implication. Separately, reserve 'next' in a migration (insert into public.reserved_workspace_slugs) in the same commit as next.tsx, per the note at reserved-workspace-slugs.test.ts:66-67 — otherwise a workspace could claim the slug and collide with the route. Until both land, no 'all tests passing' claim can go on the site.

---

## B. Survived the fact-check — usable, with their evidence (100)

Each one was opened and confirmed in the codebase. Cite the evidence, not this file.

**All seven lifecycle stations are real, shipped product surfaces — none is a placeholder. Combined weight of the seven station route files alone is ~11,500 lines, before their component trees.**

- Evidence: wc -l over src/routes/: decide 3191, ship 2940, design 1731, plan.index 1201, build.index 701, learn 684, discover 80 (shell only, see below). Each defines a component route, not a redirect: e.g. _authenticated.decide.tsx:3174 `createFileRoute("/_authenticated/decide")({ component: DecideSurface ...`

**01 Discover is the single richest surface in the app: a triage stream of signal clusters modelled explicitly on Sentry's issue stream crossed with Linear's triage inbox — volume beside distinct sources, a novelty score, keep/merge/decline dispositions on digit keys, source coverage, and promote-to-bet. Best candidate for the 'signals become ranked bets' visual.**

- Evidence: Route shell src/routes/_authenticated.discover.tsx:48 delegates to src/components/discover/DiscoverSurface.tsx (149.1K, 8 useQuery calls). Its header names the reference at lines 10-22: "the model is SENTRY'S ISSUE STREAM crossed with LINEAR'S TRIAGE INBOX". Supporting files: OpportunityDetailSheet.tsx 54.3K, ranking.ts 14.3K, OpportunityRow.tsx 11.2K.

**02 Decide is the money shot: one Gate holding a single bet with one primary answer, and directly beneath it a 'record recess' where the account's own history contradicts you at the moment of the call — plus the ranked queue, editable ICE, and Now/Next/Later placement on the same screen. This is the layer-03 'the brain guides the next call' claim made literal in one frame.**

- Evidence: src/routes/_authenticated.decide.tsx:3174 (route def); header lines 19-23: "KEEP the record recess, directly under the Gate. The record contradicting you at the moment you decide is the single differentiated moment in this product". 3191 lines, 8 useQuery calls.
- Note: See the sample-data finding below — this exact moment currently only renders inside a seeded example workspace, and renders with an 'This is an example.' mark on it.

**03 Plan renders a Now/Next/Later board with an undeclared-outcome Gate on top, spec rows joined to the bet each one serves, and a 'who works the plan' crew column. Clean, conventional, low-risk marketing visual.**

- Evidence: src/routes/_authenticated.plan.index.tsx:234 (route def), 1201 lines, 4 useQuery calls; panel titles "Now, Next and Later" and "Specs". Component tree: src/components/plan/RoadmapColumns.tsx 37.9K, BetCard.tsx 15.6K, CommitCeremony.tsx 7.5K.
- Note: plan.index.tsx:666 records that on the live shape `committed.length` and `nowCount` are "BOTH PINNED AT 0, because no opportunity anywhere carries a lane" — so an un-seeded workspace shows an empty board with a zeroed headline.

**04 Design renders the drawings the crew made, the design gate on each, a fidelity spectrum, the Critic's findings, a consequence panel and a publish action. It was audited as the thinnest station in the product (four server calls) and was rebuilt on 2026-08-02 and 2026-08-06 — it is no longer thin.**

- Evidence: src/routes/_authenticated.design.tsx:1688 (route def), 1731 lines, 4 useQuery calls; panel titles "Screens the crew drew", "What the Critic found", "Links made from this spec". Header lines 4-12 record the audit finding: "found Design the thinnest stage in the product: four calls ... this surface called none of it."
- Note: Its own component dir is tiny (src/components/design/ is just drawing.tsx 7K + vocabulary.ts 3.7K) — all weight is in the route file. It renders drawings via a fidelity/drawing abstraction, not a live iframe preview, so it will not look like a design tool.

**05 Build renders 'Being written now' (live agents with an animated AgentPulse mark), 'Waiting on you', 'Stopped', and 'Every change' — every changeset with repo, branch, file count and pull request, workspace-wide.**

- Evidence: src/routes/_authenticated.build.index.tsx:685 (route def), 701 lines, 3 useQuery calls; panel titles at lines with "Being written now", "Waiting on you", "Stopped", "Every change", "The boundary". Component tree: src/components/build/ReadyToBuild.tsx 40.2K, HeldClaims.tsx 6.8K.
- Note: The most cinematic block is the one most likely to be empty. build.index.tsx:271 records a live measurement: "the state that dominates the live database (67 halted, 19 completed_with_failures, 0 running on 2026-08-06)". With zero running agents the live block collapses and the screen reads as a list of halted work.

**06 Ship renders an announcement Gate waiting on an owner, the composer, 'Where it is live', 'Live releases', 'What shipped' and the release-notes list — and it is the only place in the product where anything becomes readable by a stranger, at a public /p/<slug>.**

- Evidence: src/routes/_authenticated.ship.tsx:2928 (route def), 2940 lines, 5 useQuery calls; header lines 11-14: "Taking a change public: writing the announcement, sending it up, and publishing it at /p/<slug>. Nowhere else in the product does anything become readable by a stranger." Component: src/components/ship/WhatShipped.tsx 45.9K.

**07 Learn renders the settle Gate with a verdict form and waiting queue, a projection (what this verdict WOULD move the linked bet's priority to, computed server-side before you click), a receipt of what settling caused, 'The last verdict on the record' and 'What paid off'. The projection-then-receipt pair is the cleanest visual proof that the loop closes.**

- Evidence: src/routes/_authenticated.learn.tsx:174 (route def), 684 lines, 5 useQuery calls; header lines 28-33 describe the projection: "Before you click, the Gate says what the verdict would move the linked bet's priority to, computed by the server from the same arithmetic the write runs". The weight is in src/components/learn/SettlePanel.tsx (44.2K).
- Note: Thinnest of the seven route files at 684 lines; judged on the route file alone it looks thin, but SettlePanel carries it. Its own header (lines 5-10) records that until recently stage 07 "was a report" you could not record an outcome from.

**Brain is a full surface with nine-plus panels: the Record recess (the newest call an outcome re-ranked, in the record's own words), the decisions ledger with a contradiction auditor on the drill, the compounding panel, MemoryList, a memory review queue, brief and docs, a knowledge GraphPanel, an artifacts tab, and StandingRules — house rules distilled from validated outcomes that are injected into every agent's prompt before it acts.**

- Evidence: src/routes/_authenticated.brain.tsx:537 (route def), 1748 lines, 5 useQuery calls. Header lines 32-55 enumerate the panels; the StandingRules claim cites the injection site directly: "go into every agent's prompt before it acts (loop.server.ts:387-388)". Components: src/components/brain/ArtifactsView.tsx 28.0K, StandingRecord.tsx 8.8K.

**Today is a real attention-allocation surface, not a dashboard: a decision queue, FocusNext, PushedInsights, a QuietMorning empty state, an ask composer, and a confidence-disclosure chip. Its own header states it "ALLOCATES ATTENTION. It does not display output." — which is a defensible marketing line about an agentic product.**

- Evidence: src/routes/_authenticated.today.tsx:103 (route def), 1080 lines, 3 useQuery calls; header at lines 50-55. Components: src/components/today/DecisionQueue.tsx 15.5K, PushedInsights.tsx 6.6K, FocusNext.tsx 4.7K, QuietMorning.tsx 2.6K, AskComposer.tsx 4.5K.
- Note: QuietMorning is the empty state and it is small (2.6K) — a screenshot taken against a quiet workspace shows almost nothing.

**Approvals is the surface where a click UNBLOCKS something — one Gate plus one-line rows, j/k/a/r keys, optimistic decide with rollback, and a receipt that renders what the approval CAUSED rather than a toast confirming it registered. Per CLAUDE.md's vocabulary rule this is the one place 'approve' is the correct verb on the marketing site.**

- Evidence: src/routes/_authenticated.approvals.tsx:89 (route def), 545 lines, 3 useQuery calls. Header lines 45-53: "A toast confirms that your click REGISTERED; a receipt renders what your click CAUSED."
- Note: Smallest of the ten at 545 lines and visually sparse by design (one gate + one-line rows). It photographs as a list, not as a product.

**There ARE six fully-seeded, isolated demo workspaces built for exactly this purpose — Helio Labs, cloned per investor prefix — carrying a coherent narrative (Maya Ruiz, PM on Relay; a checkout bet that shipped, worked 59→78%, and missed on tablet) with 4 projects, 9 signals, 7 decisions, 6 opportunities, 7 prds, 3 missions, 5 learnings, plus lineage edges, ICE re-ranks, mission steps, tool calls, memory recall and a pending approval queue. Screenshot from harbor@supaprod.ai, never from a real workspace and never from an investor login.**

- Evidence: supabase/migrations/20260725130000_helio_demo_seed_rich.sql:29-36 ("verified live 2026-07-25: 4 projects, 9 signals, 7 decisions, 6 opportunities, 7 prds, 3 missions, 5 learnings" and the Maya Ruiz narrative), and docs/operations/demo-credentials.md (the four investor logins plus the harbor@ rehearsal copy: "Rehearse on harbor@, never on a login you plan to send. Approving a gate is a write.").
- Note: Helio Labs is seeded with is_sample = true (20260718120000_helio_labs_demo_seed.sql:115-116), so Decide and Discover will render "This is an example." on the Gate, "Example ·" on queue rows, and Decide's re-rank line becomes "...off an outcome recorded in this example workspace. That is the loop working, on a record that did not come from your product." A test enforces this everywhere (src/routes/__tests__/an-example-bet-says-so-everywhere.test.ts), so it cannot be quietly removed — either accept the mark in the shot, or provision a screenshot workspace with is_sample false.

**There is already a zero-auth, read-only public demo at /demo, drawn in the landing page's own ink language, backed by a fixed demo workspace — so the site can link to a live product surface rather than only screenshotting one.**

- Evidence: src/routes/demo.tsx:1-11 ("the no-signup demo. Zero-auth, read-only view of the public demo workspace ... there is nothing on this page a visitor can change") and src/lib/demo.functions.ts:39 `export const DEMO_WORKSPACE_ID = "b90da531-34aa-4009-bcce-2162b87f50ac"` with GET-only handlers getDemoOverview / getDemoTeardown / getDemoLedger / getDemoMissionTrace.

**Four more authenticated surfaces outside the seven stations are heavier than several of the stations and are strong visual candidates the brief did not ask about: /engine-room (the 'Pulse' — spend, quality, safety and record rooms), /runs/$missionId (a run's diff, trace, CI and merge gate), /plan/spec/$id (the spec editor), and /crew (how much rope each agent gets).**

- Evidence: Line counts in src/routes/: _authenticated.plan.spec.$id.tsx 2494, _authenticated.runs.$missionId.tsx 1631, _authenticated.crew.tsx 1398, _authenticated.runs.index.tsx 1316, _authenticated.engine-room.tsx 566 backed by src/components/engine-room/ (18 files, 4788 lines).

**The whole app shares one design vocabulary rendered from a single primitives module — Gate, Record (the recess), Receipt, Door, AgentMark, Num, Diffstat, Surface with a context column — so screenshots from any two stations will read as one product rather than as separate tools.**

- Evidence: src/components/shell/primitives.tsx exports Gate (line 486), Receipt (578), Record (649), Door (1381), AgentMark (71), Num (1354), Diffstat (451), Surface (709), plus CtxHead/CtxBody/CtxRow (1296-1308). Every one of the ten surfaces above imports from this module.

**Data lives in three named infrastructure sub-processors — Supabase (managed Postgres, auth, file storage), Cloudflare (hosting + Workers edge compute), and Lovable (AI gateway) — disclosed on a public, no-login page derived live from the model catalog so the list cannot drift.**

- Evidence: src/lib/compliance/subprocessors.ts:47-79 (INFRASTRUCTURE_SUBPROCESSORS: lovable/supabase/cloudflare with purpose + dataCategories); src/routes/subprocessors.tsx:1-15 (public Art. 28 disclosure, imports the pure module directly, no auth)

**Newly-added model providers cannot be silently dropped from the legal disclosure — any provider not in the metadata map is still disclosed under a humanized fallback name.**

- Evidence: src/lib/compliance/subprocessors.ts:83-89 (comment + PROVIDER_META open string-keyed map), :118-120 providerMeta() fallback to humanizeProvider()

**Workspace isolation is enforced at the database layer: row-level security is enabled 309 times across 92 migration files.**

- Evidence: `grep -rhoiE 'enable row level security' supabase/migrations/ | wc -l` = 309; `grep -rl 'ROW LEVEL SECURITY' supabase/migrations/ | wc -l` = 92 of 530 total migrations
- Note: Say 'enforced by row-level security policies in the database' — do NOT say 'proven' or 'tested'. There is no automated cross-workspace isolation test: the e2e suite (e2e/01-auth through 09-elevation-tokens) is auth + design/UI only (typography, icons, theme, a11y). The claim rests on migration DDL, not on a passing isolation test.

**The workspace audit log is append-only by construction: members can read it, and there is no write policy at all, so no client can write to it directly — only a SECURITY DEFINER function can append.**

- Evidence: supabase/migrations/20260619250000_wm_f4_ownership_transfer.sql:22-38 — table def, then comment at :35 'SECURITY DEFINER RPC below (no write policy = no direct client writes)', then policy 'ws members read audit' FOR SELECT USING (is_workspace_member(workspace_id))
- Note: Scope it honestly. This log covers only ownership_transfer, workspace-claim events, and decision-gate events (the only INSERT sites: 20260619250000:83, 20260802270000:140+227, 20260803095240:93+174, plus src/lib/decision-gate.server.ts:13). It is NOT a general 'every admin action' audit log. Do not imply enterprise admin audit coverage.

**Every model call in the product goes through one chokepoint that writes an immutable event row: trace id, parent event, surface, provider, model, whether it went via gateway or your own key, prompt/completion/total tokens, estimated cost, latency, time-to-first-token, status (ok | error | blocked), error code, fallback and cache-hit flags.**

- Evidence: supabase/migrations/20260522001642_...sql:7-27 (full ai_events column list, incl. `via text NOT NULL DEFAULT 'gateway' -- gateway | byo` at :15 and `status text ... -- ok | error | blocked` at :23); src/lib/ai/runtime.server.ts:6 'Persists ai_events + guardrail_hits', inserts at :294, :1755, :2007

**Guardrail hits are written at that same chokepoint, so a blocked call leaves a record rather than vanishing.**

- Evidence: src/lib/ai/runtime.server.ts:1774 and :2058 — `.from("guardrail_hits").insert(...)`

**The boundary ledger records what the agents did NOT do and why, splitting two outcomes that most products collapse: ASKED (an agent hit a tool its boundary won't let it use alone, stopped, and put the call to a person) and REFUSED (a rule matched and the content never travelled). Outcomes are waiting / allowed / declined / expired / blocked.**

- Evidence: src/lib/boundary-ledger.ts:1-30 (the two-kinds doctrine and why collapsing them hides the interruption cost), :54-80 (LedgerOutcome union and BoundaryEvent shape); rendered live at src/routes/_authenticated.boundary.tsx:396-398 via useQuery(fLedger)
- Note: This is the sharpest differentiated claim available. The file itself (boundary-ledger.ts:4-16) records that a research sweep found Cursor, Copilot, Devin, Codex and Claude Code all keep permissions in a config file and never mention it again at runtime — the near-miss is invisible everywhere else. That comparison is a repo assertion from docs/design/REFERENCE-PATTERNS.md, so make the positive claim about Supaprod and let the buyer draw the contrast; don't put the competitor list on the site as fact.

**Consent is set once per consequence class, not tool by tool, and the four classes carry real default postures: read-only research auto-runs, internal reversible writes ask first, stakeholder-facing work is drafted to you to release, repo writes are always gated.**

- Evidence: src/lib/consent-classes.ts:26-90 — ConsequenceClassId union at :27, then CLASSES with defaultPosture mode 'auto' / 'confirm' / 'review'; header comment :1-14 confirms classes derive from the same isSideEffectingTool / isExternalTool / toolRisk primitives 'the loop already enforces with, so the posture shown is the posture that actually holds'

**"Supaprod drafts. You release. Nothing stakeholder-facing sends itself."**

- Evidence: src/lib/consent-classes.ts:22-24 — exported as CONSENT_PHILOSOPHY, the line the in-product panel leads with
- Note: Ready-made site copy, already shipped in-product, and it survives the vocabulary canon (no banned terms). Reusing it keeps the site and the product saying the same sentence.

**An agent given a blast-radius cap cannot call — or even see in its prompt — a tool above that cap. Over-cap tools are removed from the agent entirely, which is stricter than gating them behind a confirm.**

- Evidence: src/lib/agent-tool-cap.ts:1-12 (doc: 'drops any tool whose static blast-radius tier ... exceeds the cap, so a scoped agent literally cannot call (or see in its prompt) a tool beyond its remit ... this removes over-cap tools from the agent entirely'), :25-35 capToolsByRisk implementation

**There is a kill switch at two scopes — whole system and single workspace — read by the AI chokepoint before every call, plus per-mission token and spend caps that halt a run mid-flight.**

- Evidence: supabase/migrations/20260603205441_...sql:110-124 (current_kill_state(ws) returning system_paused/workspace_paused/reason, SECURITY DEFINER), :126-141 (check_mission_caps); src/lib/ai/runtime.server.ts:167-178 (GovernanceHaltError with kind 'kill_switch' | 'mission_token_cap' | 'mission_spend_cap'), :248-265 (the cap throws)
- Note: Do not claim it is absolute. checkKillSwitch fails OPEN: src/lib/ai/runtime.server.ts:190-193 — on an RPC error it logs and `return`s, so the call proceeds. Safe phrasing: 'a pause switch at system and workspace scope, checked at the single model chokepoint' — never 'guaranteed to stop every call'.

**A halted call is not silent — it lands in the trace as status 'blocked' with the reason, so the person sees why the agent stopped.**

- Evidence: src/lib/ai/runtime.server.ts:167-171 — "Surfaced as status='blocked' in ai_events with error_message='governance_halt: <reason>'"; insert at :294

**A secret pasted into content on its way to a public surface is hard-blocked by nine structural credential patterns (OpenAI incl. scoped keys, AWS access key id, GitHub tokens and fine-grained PATs, Stripe live keys, Slack tokens, Google API keys, private key blocks) — and this floor is deliberately NOT loaded from per-workspace config, so it holds even for a workspace that never configured guardrails.**

- Evidence: src/lib/egress-guardrails.ts:33-55 (EGRESS_SECRET_RULES, all action:'block'), :10-13 ('deliberately owned here, not loaded from the per-workspace guardrail_rules table, so the floor holds ... a security floor must not depend on opt-in config'), :80-83 (error names the secret TYPE, never the value)

**Untrusted external content is screened for prompt injection BEFORE it is stored, at three real ingest boundaries: the public signal webhook, connected-source preparation, and the MCP write tools. A structural attack is quarantined and never lands; an item that merely quotes an injection is kept and tagged for review rather than dropped.**

- Evidence: src/lib/ingest-guardrails.ts:1-32 (doc + screenIngestText at :27, INGEST_REVIEW_TAG at :32, quote-vs-attack distinction at :12-15); call sites: src/routes/api/public/ingest-signals.ts:7, src/lib/sources/prepare.ts:11, src/lib/mcp.functions.ts:6

**The agent write surface cannot self-approve: a decision cannot land already-approved, a spec cannot land shipped, a caller cannot name a workspace it does not hold, and one scope does not grant all three write verbs.**

- Evidence: src/lib/mcp-write-tools.test.ts:1-17 (the five properties enumerated as the reason the guards exist), asserted against real recordDecision/draftSpec from mcp.functions and the WRITE_SCOPE_BY_TOOL map

**These are not documentation claims — the governance, boundary, egress, autonomy-policy, consent-class, tool-cap and injection guards are covered by 157 passing tests.**

- Evidence: `bun test` on 7 governance files → '114 pass, 0 fail, 410 expect() calls'; `bun test` on ingest-guardrails/mcp-filter-injection/studio-rollbacks/tool-consequences → '43 pass, 0 fail, 82 expect() calls'. Run 2026-08-12 on this checkout.
- Note: Cite the behaviour, not the number, on the site — a test count is a figure that goes stale and that a buyer cannot verify. Keep the number for the security questionnaire and the founder's live answers.

**Bring-your-own model keys across 20 providers — Anthropic, OpenAI, Google, Mistral, DeepSeek, Groq, xAI, Qwen, Moonshot, MiniMax, OpenRouter, Together, Fireworks, Cerebras, DeepInfra, Perplexity — plus Ollama for fully local inference and a custom option for any OpenAI-compatible endpoint.**

- Evidence: src/lib/byokeys.functions.ts:46-76 (BYO_PROVIDERS, incl. ollama 'local' at :67 and 'Custom / OpenAI-compatible' at :71-75)
- Note: Must be stated as an Enterprise capability. BYO is entitlement-gated server-side and self-serve is credits-only: byokeys.functions.ts:161-166 blocks save, :240-251 blocks the key test (deliberately, so a denied test doesn't silently fall back to the platform key and report a misleading success), and src/lib/entitlements.ts:275 sets `byokAllowed: enterprise`. The gate fails CLOSED on any error (byokeys.functions.ts:41-43), which is the right direction and worth saying.

**Keys you bring are encrypted at rest with AES-256-GCM via WebCrypto, decrypted only in server-side code, and the legacy plaintext column was dropped from the table — only cipher, IV, key version, and a 4-character display prefix are stored.**

- Evidence: src/lib/byokeys-vault.server.ts:1-5 ('The legacy plaintext api_key column was dropped from user_api_keys (migration 20260620211507) ... reads/writes ONLY the encrypted columns'), :58-71 buildEncryptedKeyColumns; src/lib/connectors/crypto.server.ts:2 ('WebCrypto AES-256-GCM; key comes from CONNECTOR_SECRETS_KEY (base64, 32 bytes'), :48 and :57 importKey/encrypt with name 'AES-GCM'

**Every model call records whether it was served by the platform gateway or by your own key, so you can audit which credential served which call.**

- Evidence: supabase/migrations/20260522001642_...sql:15 — `via text NOT NULL DEFAULT 'gateway', -- gateway | byo` on ai_events

**When a release goes wrong there is a one-action revert: an inverse changeset is synthesized from the parent commit state (create becomes delete, update becomes restore, delete becomes create), and a changeset over 100 files fails loudly rather than reverting partially.**

- Evidence: src/lib/studio-rollbacks.ts:1-9 (the inverse-changeset doctrine), :27 (`const MAX_ROLLBACK_FILES = 100` with 'fails loudly rather than reverting partially'), :180 runRollbackRelease; exposed both as a server fn (src/lib/studio.functions.ts:1657) and as the studio.revert agent tool

**There is a read-only record of what went wrong: failed tool executions, errored pipeline events, guardrail blocks, cost-cap incidents and runaway missions, newest first, each linked to its trace.**

- Evidence: src/lib/incidents.functions.ts:12-19 (the P7 incidents doc comment and IncidentKind union 'execution' | 'pipeline' | 'guardrail' | 'cost' | 'manual' | 'runaway'), :20-33 Incident type with traceId and missionId drill targets

**Workspace policy is settable, and the one carve-out a person can state — 'an agent never settles a bet above impact N' — can only ever take a call away from the agent and give it to a person, never the reverse.**

- Evidence: src/lib/autonomy-policy.ts:217-236 decideSettlement (an escalated decision is returned untouched at :222, the ceiling only converts settle→escalate at :224-235); :204-215 doc 'The carve-out then runs in ONE direction'; :106-121 out-of-range values fall back to the shipped default rather than being clamped, so a bad value never silently enforces a policy nobody stated

**Not holding SOC 2 or ISO 27001, stated plainly on the security page rather than implied away.**

- Evidence: src/routes/security.tsx:135-141 — 'We do not currently hold a SOC 2 or ISO 27001 certification. If your evaluation needs one, tell us.'
- Note: Keep this. For a beta-stage vendor it converts a weakness into a credibility signal, and the surrounding page (security.tsx:41-44) already frames the posture honestly. Removing it to look bigger would be the single worst edit available on this page.

**'Nothing merges, ships, or takes an irreversible outward action without a human approval.'**

- Evidence: src/routes/security.tsx:82-88 (the shipped 'merge gate' section). The narrowing is documented in the same file at :11-19: the Critic runs unattended (critic.server.ts calls callModel directly), Measure settles outcomes unattended (38 of 119 learnings on production carried a recorded_by_agent_slug, measured 2026-08-06), and Discover clusters unattended.
- Note: Usable ONLY in this narrow irreversible-action form. The file's own comment records that a broader 'every AI action' summary was caught and corrected, with the reason: 'On a security page the gap between the summary a buyer reads in search results and the body they read after is what costs the deal.' Any new site copy must repeat the narrow form, including in meta descriptions and social cards.

**Role-based access control with owner / admin / member / viewer, and approval lanes.**

- Evidence: src/routes/security.tsx:46-53 (the shipped claim); backed by src/lib/entitlements.ts:156-158 (`rbac`, `approvalLanes`) and :261-263 gating both on the collaboration tiers, plus :218 perRoleApprovalLanes
- Note: RBAC and approval lanes are tier-gated (collab tiers and up), not universal — say so, or an evaluator on a lower tier will find them missing. There is no SSO, SAML, SCIM or directory sync anywhere in src; if the buyer's checklist has those, they are a roadmap conversation, not a site claim.

**The free PRD teardown at /p/teardown genuinely works end to end, right now, with no signup — a stranger pastes a bet and a real model argues against it in about 11 seconds.**

- Evidence: curl -s -X POST https://supaprod.ai/api/public/teardown -d '{"text":"We should ship a weekly AI digest so PMs stop missing customer signals. Success = 40% of teams open it twice a week."}' -> HTTP 200 in 11.3s, 1154 bytes: {"teardown":{"verdict":"risky as written","headline":"The problem isn't well-defined, and the success metric measures engagement with the solution, not the problem it aims to solve.","risks":[3 items],"gaps":[4 items],"recommendation":"Interview PMs to understand what customer signals they currently miss...","confidence":0.9}}. Route: src/routes/p.teardown.tsx:96; API: src/routes/api/public/teardown.ts:1-99
- Note: Runs on the platform's own paid AI account (app_settings key public_teardown_user_id); if that row is unset the endpoint returns 503 (teardown.ts:33,142). Caps are real and tight: TEARDOWN_PER_IP_DAILY = 10 (teardown.ts:99) and a platform-wide DAILY_CAP = 300 (teardown.ts:155). Do not point a launch-scale audience at it without raising those. Output shape is fixed JSON (verdict/headline/risks/gaps/recommendation/confidence), so any screenshot on the site should match that shape.

**The unit and integration suite is 8,755 tests passing, 0 failing, across 514 files, with 23,081 assertions — and it runs in under 13 seconds.**

- Evidence: bun test 2>&1 | tail -12 -> "8755 pass / 23 skip / 60 todo / 0 fail / 23081 expect() calls / Ran 8838 tests across 514 files. [12.77s]" (a second run reported 8.06s). Reproducible with one command in the repo root.
- Note: This is the Bun unit/integration suite ONLY. The Playwright e2e suite is a separate runner (`bun run test:e2e`) with 10 spec files and ~51 `test(` calls in e2e/ — it needs a live server and was NOT run here, so its state is unverified. Say "8,755 unit and integration tests", not "8,755 tests", or the e2e gap is a fair challenge. Also 60 todo + 23 skip exist; "8,838 tests" is the honest denominator.

**The /proof score is computed with seeded and demo workspaces explicitly excluded — by is_sample flag, by workspace name, and by six hardcoded seed workspace ids.**

- Evidence: src/lib/proof-surface.functions.ts:136-157 — SEEDED_CLONE_IDS lists six uuids (helio-labs-voyage/compass/meridian/lantern/harbor/explore); sampleWorkspaceIds() unions those with `.or('is_sample.eq.true,name.in.("Sample workspace","Demo workspace","Sample sandbox")')`. Applied at computePredictionHitRate (line 216) and computeSupersessionsCaught (line 175) via a `.not(workspace_id,in,...)` filter with a never-matching sentinel when the list is empty.
- Note: This is a claim about integrity of method, not about a result. The code comment at proof-surface.functions.ts:105-134 also documents that the page previously printed "12 of the last 24 calls right" where 100% was seed data — true and creditable, but it is an admission of a past defect, so only use it in a 'how we work' register, never as a headline. It is checkable only by reading the repo, not by a visitor.

**The MCP server is live at POST /api/mcp and answers a real JSON-RPC 2.0 error, proving it is a JSON-RPC server rather than a marketing claim.**

- Evidence: curl -X POST https://supaprod.ai/api/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' -> {"jsonrpc":"2.0","error":{"code":-32003,"message":"Missing bearer token"},"id":1}. Implementation: src/routes/api/mcp.ts (dispatch cases at lines 199-358).
- Note: A stranger CANNOT verify the tool catalogue — tools/list requires a bearer token, so the only public evidence is the auth error. Also a code comment records zero real traffic: src/components/machine/MachineViewContainer.tsx:6-11 says "no agent has ever called this endpoint (0 tokens, 0 api_calls, measured 2026-08-10)". Never imply agent adoption.

**The A2A agent card is live and standards-shaped at /.well-known/agent.json, served with CORS and a 5-minute cache, and mirrored at /api/public/a2a/agents/supaprod/card.**

- Evidence: curl https://supaprod.ai/.well-known/agent.json -> HTTP 200 application/json, 4358 bytes, schema_version 0.1, name Supaprod, version 0.8.0, provider.url https://supaprod.ai, full endpoints/mcp/skills/policies blocks. Built by src/lib/a2a-card.ts:8; served by src/server.ts:295 and src/routes/api/public/a2a.agents.supaprod.card.ts:15. Sibling A2A endpoints exist as route files: a2a.message.send.ts, a2a.message.stream.ts, a2a.tasks.ts.
- Note: The card's tool inventory is stale (see the tool-count finding above). I verified the card is served; I did NOT exercise /api/public/a2a/message/send or /stream, so 'streaming: true' in capabilities is unverified by me. src/server.ts:376 correctly 404s any other /.well-known/* path in JSON rather than serving the SPA shell — that hardening is real and worth a line if you want a technical credibility beat.

**/llms.txt is live, substantial and real — 9.3KB of plain text describing the product, the loop, the public surfaces and the machine interfaces.**

- Evidence: curl https://supaprod.ai/llms.txt -> HTTP 200 text/plain, 9323 bytes. Source: public/llms.txt (110 lines). A fuller public/llms-full.txt also exists.
- Note: Contains two claims that are currently false — fix before pointing anyone at it. See the next two findings.

**The ARD is a genuinely published, versioned, fetchable machine standard — the JSON Schema returns 8.5KB of real draft-2020-12 schema with wildcard CORS.**

- Evidence: curl https://supaprod.ai/api/public/ard/schema -> HTTP 200, Content-Type application/schema+json, 8498 bytes, body opens {"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://supaprod.ai/api/public/ard/schema","title":"Supaprod Agent Requirements Document (ARD)"...}. Route: src/routes/api/public/ard.schema.ts:15 (GET + OPTIONS preflight, Access-Control-Allow-Origin *). Version pinned at src/lib/ard-schema.ts:16 ARD_SCHEMA_VERSION = "0.1". Explainer page: curl https://supaprod.ai/ard -> HTTP 200.
- Note: The /ard page itself is a static explainer with a hand-written EXAMPLE document (src/routes/ard.tsx:42-68) — it is documentation, not data, so it proves the standard exists, not that anyone uses it. The example's schema_url reads 'https://supaprod.app...' (ard.tsx:44) while the live $id resolves to supaprod.ai — a domain drift worth fixing before an integrator copies it. Version 0.1 is honest but reads as early; keep it visible rather than hiding it.

**/updates is a real, dated changelog of 12 shipped changes written in plain language, and it visibly supersedes its own past claims rather than editing them.**

- Evidence: src/routes/updates.tsx:36-111 — 12 ENTRIES from 2026-06-25 to 2026-08-10. Two entries are self-corrections kept on the record: the 2026-08-07 row 'Our public scorecard now counts only real calls' says outright 'That is why it currently shows an honest zero'; the 2026-07-10 row carries a comment (lines 81-90) explaining an unverifiable 'ten minutes' claim was removed while the row stayed. Live: curl https://supaprod.ai/updates -> HTTP 200.
- Note: It is a hardcoded TypeScript array, not queried data — there is no data function and nothing for a visitor to independently verify against the build log. Two inconsistencies to fix first: the page footer renders 'Last updated August 9, 2026' (LegalPageShell prop, updates.tsx:115) while the newest entry is dated 2026-08-10; and the 'You said, we changed' section renders an honest empty state because no entry carries fromPulse (updates.tsx:157).

**/api/public/health is live and reports real subsystem checks.**

- Evidence: curl https://supaprod.ai/api/public/health -> HTTP 200 {"status":"ok","service":"supaprod","time":"2026-08-12T17:06:25.045Z","release":null,"checks":{"worker":"ok","database":"ok","crons":"ok"}}. Route: src/routes/api/public/health.ts
- Note: "release" is null, so the endpoint cannot tell a visitor which build is deployed. Fine as a liveness proof; do not describe it as a status page.

**The product film is real, served, captioned, and exactly the 2:22 the site claims.**

- Evidence: ffprobe public/film/supaprod-film-1080.mp4 and -720.mp4 -> 142.100000 seconds = 2:22, matching FILM_DURATION_LABEL = "2:22" (src/components/landing/FilmPlayer.tsx:55). Live: curl range request on https://supaprod.ai/film/supaprod-film-720.mp4 -> HTTP 206 video/mp4; https://supaprod.ai/film/supaprod-film.vtt -> HTTP 200, 3094 bytes; https://supaprod.ai/film -> HTTP 200.
- Note: The duration claim is one of the few numbers on the site I could verify exactly against the artifact. Captions are present, which matters for the accessibility claim if you make one.

**/agents.txt is live and is a real, specific agent access policy — allowed paths, auth requirements, rate limits, write scopes.**

- Evidence: curl https://supaprod.ai/agents.txt -> HTTP 200, real policy body with User-agent/Allow directives for /llms.txt, /.well-known/agent.json, /api/public/health, /ard, /api/public/ard/schema, /api/mcp and the public surfaces. Source: public/agents.txt (109 lines).
- Note: Its own header line reads '# https://supaprod.app/agents.txt' while the live domain is supaprod.ai — a self-referencing URL that is wrong on the file whose entire audience is machines. Fix before publishing. It also carries the '?view=machine on any URL' claim, which is false (see above).

**Build-scale figures, re-derived today: 1,602 source .ts/.tsx files, 113 route files, 82 authenticated route files, 158 server-function modules, 530 SQL migrations, 514 unit test files.**

- Evidence: find src -name '*.ts' -o -name '*.tsx' | grep -v routeTree.gen | wc -l -> 1602; ls src/routes/*.tsx src/routes/*.ts | wc -l -> 113; ls src/routes/_authenticated.*.tsx | wc -l -> 82; ls src/lib/*.functions.ts | wc -l -> 158; ls supabase/migrations/*.sql | wc -l -> 530; find src -name '*.test.ts*' | wc -l -> 514
- Note: These are size metrics, not proof the product works — use them only in an engineering-credibility context, never as evidence of outcomes. Each is reproducible with the one-line command recorded above, which is the condition for quoting any of them.

**THE GOVERNING RULE: practitioner language everywhere — in-product as well as public. The old public/private "register split" is RETIRED (founder ruling 2026-08-11). There is no surface where the invented vocabulary is allowed.**

- Evidence: AGENTS.md:38 — "Use practitioner language everywhere — in-product as well as public (founder ruling 2026-08-11; this replaces the register split, which is retired)." Also positioning-locked-2026-08.md:299-301 §5J④ and CLAUDE.md:9
- Note: The audit found we drifted WORST on public surfaces: 4 public files gave 31 changes from 15 surfaces, while 305 in-product surfaces gave only 26 (positioning-locked-2026-08.md:303). A marketing site is the highest-risk surface for this.

**THE TEST FOR WHAT IS BANNED: "The DROP list is not a frequency list. It is a list of words we invented. Frequency was the detector, never the criterion." Drop the words we invented; keep the industry's words even when the buyer's peers do not say them; never let an industry word do the work of making someone care.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:371 and :394

**KEEP — "audit trail" is allowed, and only, when NAMING the artifact/control ("Every agent action lands in an audit trail") or naming what an enterprise buys ("the audit trail is the thing they actually budget for"). It is kept because it is the industry's standard term and the native vocabulary of AI-governance platforms — NOT because practitioners say it (measured 0.2/M, one occurrence in 5.9M words).**

- Evidence: AGENTS.md:40 and docs/strategy/positioning-locked-2026-08.md:377-382 (§5L, full ruling at :357-394)
- Note: An earlier claim that "a practitioner reached for it unprompted" was retracted as too thin (positioning-locked-2026-08.md:365). CLAUDE.md:9 still carries the retracted justification — the positioning doc §5L is the current authority.

**KEEP — "shared brain" is the mandated form. Not "the brain" alone on public surfaces, not "company brain". Approved strings: "**The shared brain**: learns, and then guides." and "You cannot be the shared brain without owning the loop that generates the outcomes."**

- Evidence: AGENTS.md:40 (KEEP list), docs/growth/vocabulary-change-list-2026-08.md:31, :32, :50, :75, :97, and live at public/llms.txt:13,15

**KEEP — the approved practitioner vocabulary, with measured rates: **decisions** 562.8/M · **history** 103.3/M · **evidence** 50.9/M · **review** 232.1/M · **ready** 160.3/M · **stuck** 95.8/M (beats "blocked" 11.7 by 8×) · **example** 712/M (highest term in the corpus) · **track record** · **judgment** (never "judgement") · **drift** · **gate** · **context governance** · **source of truth** · **what good looks like**.**

- Evidence: AGENTS.md:40; "example" rate at docs/strategy/positioning-locked-2026-08.md:309

**THE APPROVE/REVIEW RULE — settled by what the control DOES, not by word frequency. Keep **approve** where a click UNBLOCKS something (a merge gate, an approval queue item, a status of `approved`). Use **review** where it only SHOWS you something. The test is whether clicking it unblocks anything.**

- Evidence: AGENTS.md:41 and CLAUDE.md:9
- Note: All 8 audited "approve" changes were judgment calls, none certain; the auditor flags that "approval" is doing real work in gate copy and the 5.8-vs-232.1 frequency gap may not survive contact with the merge gate (docs/growth/vocabulary-change-list-2026-08.md:259). The merge-gate noun "without a human approval" explicitly STAYS (vocabulary-change-list-2026-08.md:214).

**TENSE LAW #1 (binding on every surface) — NEVER claim accumulated learning in the present tense. Not "we learn from your corrections." The honest and stronger form is: **"The loop is wired and proven, and it begins accruing on first real use."****

- Evidence: AGENTS.md:36; restated CLAUDE.md:9, positioning-locked-2026-08.md:78, :247
- Note: Reason: it does not survive one query against `agent_memory`. Production holds 0 learnings (README.md:298).

**TENSE LAW #3 — the honest beat, said BEFORE they ask: "the loop is **wired and proven, and empty by design until used**." First-pass acceptance began capturing 2026-08-10, so the rework metric has no history and any figure shown before real usage is a number about demo data.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:216 and :132

**AUDIENCE RULE #1 — never imply obligation. "Pressured to use AI" is the Resentful cluster's defining trait, and pressure language repels them AND the Conflicted 35% who are already at 55.7% burnout with "expected to do more for the same pay" as their top fear.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:43

**AUDIENCE RULE #2 — sell relief, never throughput. 82% already report AI makes them measurably more productive. "Nobody needs more output. Copy that promises speed is selling the thing that is hurting them." Throughput features are banned as the headline: "Speed is the disease."**

- Evidence: docs/strategy/positioning-locked-2026-08.md:44 and :97
- Note: This bans the standard SaaS hero ("ship 10x faster") outright.

**THE AUDIENCE — front door is the **individual PM or founding PM**, targeted by AI-identity stance rather than role/seniority/company size. Addressable population is the Energized (41%) + Conflicted (35%) = 76%. The Resentful 12% "will not buy. Do not target."**

- Evidence: docs/strategy/positioning-locked-2026-08.md:27-40 (cluster table at :34-38, "Our addressable population is the Energized + Conflicted 76%" at :40)
- Note: Stance predicts career optimism (β=+0.39) and field recommendation (β=+0.60) more than role, level and company size combined — d ≈ 1.55, roughly 3× the founder effect.

**THE AUDIENCE, three tiers as shipped: **Front door** — the individual PM or founding PM, drowning in the low-judgment half of the job, entering via the Critic teardown. **Expansion** — the product team. **Buyer** — the VP or Head of Product, who wants the decision record, the governance layer and the accountability story.**

- Evidence: README.md:136-140
- Note: Willingness-to-pay is NOT first use — it is the team-under-agents transition (positioning-locked-2026-08.md:175). And Bret Taylor's warning applies: PLG "doesn't work well when your buyer and the user of the software are different", which is our shape (positioning-locked-2026-08.md:46).

**THE HUMAN-SURFACE TAGLINE (approved, live): **"For product managers who ship with agents"**. Narrow on purpose, because nobody self-identifies as a team, and because the land motion is a person who can start without procurement.**

- Evidence: README.md:5 (shipped as the h3) and :23; ruling at docs/strategy/positioning-locked-2026-08.md:240
- Note: positioning-locked-2026-08.md:424 — this eyebrow "already solved" the agentic problem: it uses the concrete noun, needs no teaching, makes no category claim, and takes no hype-cycle discount.

**THE MACHINE-SURFACE DEFINITION (approved, live): **"Supaprod is where product decisions live when agents do the work."** Categorical, and still a noun a stranger can hold. This replaced the retired platform-word definition on llms.txt, agents.txt and the A2A card.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:240; shipped at public/llms.txt:3 and AGENTS.md:15
- Note: Deliberate, evidence-backed concession: "where decisions live" is storage-shaped language, allowed because the community describes this problem entirely in nouns of storage and correctness. What stays banned is the VERB form — the brain never remembers, stores or logs (positioning-locked-2026-08.md:230).

**THE 44-WORD PRODUCT DEFINITION (recommended, approved): "Supaprod is where product decisions live when agents do the work. Agents run the reps; you direct. It records what you expected before the outcome landed — the one part of a decision nobody can reconstruct afterwards — and uses it to sharpen the next call."**

- Evidence: docs/strategy/positioning-locked-2026-08.md:226

**THE 38-WORD ALTERNATE (job-first, for audiences who already feel the pain): "Agents do the reps now. What doesn't compress: deciding what's worth doing, defining what good looks like, and catching when the system is confidently wrong. Supaprod runs those three, and records what you expected before you found out."**

- Evidence: docs/strategy/positioning-locked-2026-08.md:234

**THE SPINE — three beats, entirely in operator language, in this order: **1.** The half of the job that was doing the reps is going to agents. **2.** What doesn't compress: deciding what's worth doing, defining what good looks like, and catching when the system is confidently wrong. **3.** Supaprod runs those three — and keeps what you believed *before* you found out.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:185-187, mirrored README.md:25-27
- Note: Beat 2 is verbatim from an operator (Bal Sieber, 2026-06-27) and those three jobs ARE stations 02 Decide, 03 Plan and 07 Learn. Beat 3 is the forecast claim.

**THE FELT PROMISE, one line (operator's own words): **"Less operator, more director."** It maps exactly onto layer 01, the director.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:191 and :175; README.md:29

**CATEGORY LINE, UNDER TEST — "There is no GitHub for product decisions." Marketing surfaces only, no product code. Ship it only if it brings people who can already name the pain; a line that lifts traffic and lowers qualification is a loss.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:13, :19, :21, :193
- Note: NOT locked — it is an A/B candidate, judged on qualified beta applications that describe the judgment gap in their own words, not on clicks. The three layers, the seven stations in-product, and every src/ string do NOT change while the test runs.

**THE THREE LAYERS, always told door → body → brain, one headline per surface, brain as the crescendo, NEVER all three at once: **01 the director** (tells you what to build; marigold `#e8b44c`) · **02 the operating system** (runs the whole lifecycle, seven stations agents walk on their own; blue) · **03 the brain** (learns, and then guides; green).**

- Evidence: README.md:37-43 and :276; AGENTS.md:17-23; CLAUDE.md:11
- Note: Ordering rationale (README.md:45): "The door is who it is for, so it earns attention. The body is what it does, so it earns belief. The brain is why it wins, so it earns the close. Leading with the brain sounds like a database; leading with the door and never reaching the brain sounds like a workflow tool." On public surfaces say "the shared brain" for 03.

**WHY ALL THREE ARE ONE PRODUCT (the earned insight, and the answer to "isn't this three companies"): "You cannot be the shared brain without owning the loop that generates the outcomes, and you cannot run the loop without being the operating system. Ship any one alone and it is a feature, not a company."**

- Evidence: README.md:47, AGENTS.md:25, live at public/llms.txt:17
- Note: Layer 03 is the only one defensible alone; 01 is "a capability, not an asset" and 02 buys a lead measured in quarters (README.md:174-176). Saying so is deliberate: "we are honest that two of our three layers are copyable, because that is what makes the claim about the third one credible."

**THE MOAT SENTENCE (canonical): **"The forecast captured at decision time — what a team believed would happen, recorded before the outcome was known. It is not an artifact; it leaves no trace unless something captured it at the moment of the call."** Everything else about a decision can be rebuilt afterwards.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:66-68 and :212; README.md:65; CLAUDE.md:7
- Note: Supporting line, safe to use: "Causes survive in artifacts. Forecasts do not." (README.md:61). The falsifying evidence — Vercel's COO reconstructed a lost deal's true cause from Slack, email and Gong calls with an agent built in two days for ~$1,000/year (README.md:59).

**ORDERING LAW — do NOT lead with the forecast. **Lead with the governed record of agentic product work**: when agents do the work, answering "why did we decide this, on what evidence, and who signed off" stops being a nicety and becomes the control that lets you let them run at all. THEN the forecast, as what makes that record uniquely ours.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:324-330 (§5K.1) and README.md:63-67; AGENTS.md:31
- Note: Not cosmetic: corporate prediction markets at Google beat expert forecasts by up to a 25% reduction in mean-squared error (Cowgill & Zitzewitz, Review of Economic Studies, 2015) and died anyway, because "a pitch that leads with 'we record what you predicted so it can be checked later' is selling accountability to the person who would be held accountable."

**THE FORECAST'S FRAMING IS BINDING — it is a **byproduct of doing the work**, not a submission to a scoreboard, and **its first consumer is the agent doing the next piece of work**, not a reviewing executive. Any surface that inverts that reintroduces the Google failure.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:336; AGENTS.md:31

**THE MARKET NAME FOR THE CATEGORY WE ENTER: AI governance platforms — inaugural Gartner Magic Quadrant 2026-06-16, a Forrester Wave in Q3 2025, an IDC MarketScape 2025-2026, and Gartner forecasting **$492M in 2026 growing 45.3% a year**.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:328 and README.md:63

**THE ONE JOB WE WIN: **we close the judgment gap.** The name is a practitioner's: "PMs got faster at shipping but didn't get better at defending why. The judgment gap got exposed." The job in one sentence: when building gets cheap, the cost of a wrong call goes up and the ability to defend a call does not improve on its own. **We are what stops the acceleration from becoming confusion.****

- Evidence: docs/strategy/positioning-locked-2026-08.md:52-60
- Note: Companion quote from the same thread, also usable: "If the team doesn't have clarity on goals, priorities, decisions, and ownership, AI basically accelerates confusion."

**THE WEDGE: **"The wedge is not 'better than your folder.' It is the point at which the folder stops working — the second person, or the first fleet of agents."** Every DIY success in the corpus is single-operator; every DIY failure is multi-person or multi-agent governance. Do not sell to the operator whose folder works. Sell at the transition.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:171 and :169, :173

**THE ANSWER TO THE DIY / "lower-level tools are more AI-friendly" OBJECTION: **"The low-level tools are agent-writable but not agent-governable."** An agent can write into a Notion page or a GitHub issue, but it cannot write a decision with its evidence, its author, a verdict slot and a human gate into either.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:112-118 (§5C)

**THE METRIC, and the answer to "vitamin or painkiller": **rework, not speed** — clarification loops, reopened tickets, spec/design mismatches, review burden, first-pass acceptance. **Rework is unpaid work**, so cutting it is relief rather than more throughput.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:105 and :214
- Note: Only 4 of 5 components are instrumented; **clarification loops are unmeasured — "Declare it, never draw a zero"** (positioning-locked-2026-08.md:130). Capture began 2026-08-10, so the metric has no history and no number may be shown.

**THE FOUR-PART OUTPUT CONTRACT for every agent artifact, in an operator's words: "Here's what I used, what changed, what I think is true, and how to verify it."**

- Evidence: docs/strategy/positioning-locked-2026-08.md:106

**THE FOUR UNMET NEEDS, in the operator's own questions — the practitioner-language substitute for "audit trail" when you are trying to make someone care: **who changed what · what is trustworthy vs polluted · why they changed it · how to stop the ones that shouldn't change.****

- Evidence: docs/strategy/positioning-locked-2026-08.md:167 and :367, :381
- Note: Practitioners have NO noun for this concept: "paper trail" appears twice in 5.9M words and both are negative; "traceability" does not appear at all. Use the questions, not a category noun.

**"context graph" is the industry name for layer 03 (ThoughtWorks Technology Radar Vol. 34, April 2026, Assess ring). Use it in docs and with technical buyers/CTOs — "worth more there than any category we could invent" — but NEVER in the hero, the 50-character line, or a cold conversation, because it must be taught before it helps.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:338-348 (§5K.2) and README.md:69
- Note: Its own enumeration (decisions, policies, exceptions, precedents, evidence, outcomes) OMITS forecasts — that omission is the gap we occupy.

**THE LOOP, approved phrasing: "One loop, not seven tools. Discover, Decide, Plan, Design, Build, Ship and Learn run as one governed route that agents walk on their own, inside boundaries a human sets in advance. A recorded outcome re-ranks the next bet rather than ending in a report."**

- Evidence: README.md:90; station table at README.md:122-130; live public wording at public/llms.txt:21-30
- Note: Also approved and live: "The loop does not end in a report. It ends by changing what you are shown." Work visits only the stations it needs and can enter at any of them; a skipped station is a decision on the record with a reason, never a silent omission (README.md:118-120).

**THE MERGE-GATE PROMISE (approved, live, and the "approval" here is deliberate and protected): "The merge gate stays human: nothing merges, ships, or takes an irreversible outward action without an approval." And: "You remain in control: no irreversible action happens without your approval."**

- Evidence: public/llms.txt:7 and :26 (live); protection ruling at docs/growth/vocabulary-change-list-2026-08.md:214 — "'without a human approval' … is the governance term for the fixed floor, not the weak verb, and it stays"
- Note: The auditor proposed swapping these two to "your review" and flagged both as judgment calls needing a single founder decision (vocabulary-change-list-2026-08.md:130-133). As of now the approve-form is what ships and what the ruling protects.

**HONESTY CONSTRAINT — say "informed by what we learned from earlier decisions," NEVER "informed by measured outcomes." The arrow moves learnings, not outcomes: `agent_memory` holds zero `kind='outcome'` rows.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:77

**HONESTY CONSTRAINT — say "the record travels", NEVER "the memory travels". `agent_memory` is scoped to the user who wrote it, not the workspace, so a successor inherits the record today and not yet the compounded recall.**

- Evidence: README.md:94 and :305
- Note: README.md:94: "This is the one place where the honest claim is narrower than the ambition, and stating it narrowly is what makes the rest credible."

**HONESTY CONSTRAINT — never claim a step of the loop the repo cannot show in code; cite docs/features/lifecycle-signal-to-learning.md, which carries a file:line for every structural claim and names its gaps.**

- Evidence: README.md:96

**CONNECTOR HONESTY — nine to ten adapters are real (GitHub, Intercom, Stripe, Slack, Zendesk, HubSpot, Salesforce, Canny, Productboard, GitLab); ELEVEN are stubs (Linear, Notion, Google Docs/Calendar/Tasks, Microsoft Outlook, Gmail, Microsoft Mail, Figma, Jira, Firecrawl). "Do not name a stub as available in any outward-facing copy."**

- Evidence: README.md:221 and :246, verified against src/lib/connectors/providers/index.server.ts on 2026-08-07
- Note: A logo wall is the classic way to break this — Linear, Notion, Jira and Figma logos would all be false claims today.

**SHIPPED PUBLIC HERO, compliant and approved: **"Agents that own outcomes. Not just output."** Site tagline constant in code: "Agents that know what to build, ship it, and guide the next call."**

- Evidence: README.md:82 ("a hero that says the claim harder in different words … is compliant") and src/routes/index.tsx:59 — `const TAGLINE = "Agents that know what to build, ship it, and guide the next call."`

**PUBLIC LAUNCH DATE on every external surface: **mid-September 2026**.**

- Evidence: README.md:278

**PRICING, as shipped: Free $0 / 750 credits / 1 seat / 3 connectors read-only · **Pro $20/mo** / 3,750 credits / unlimited connectors read-only · **Business $50 per seat/mo** / 15,000 pooled / min 2 seats / connectors write back · Enterprise committed contract. Annual ≈17% off. Four tiers and only four.**

- Evidence: README.md:213-219, :250, :262
- Note: A fifth slug `max` lingers internally and "must not appear on any surface or in any document". Business is the `team` slug in code. src/routes/pricing.tsx is the authority when a doc disagrees.

**THE COMPETITOR ANSWER in one line: "On the loop closing, nobody, and that is the bet. On the workspace, Linear and Notion, who have distribution we do not and no outcome verification. Everyone else in this space is either an input we read or a category we absorb."**

- Evidence: README.md:203; the eight-surface posture table at README.md:190-199
- Note: Framing rule that must survive onto the site: "A company claiming to beat eight categories at once is not focused, it is unfocused with a long list." We COMPETE on exactly one row — outcome verification and decision memory (README.md:186-188).

**REFUSE — a Critic that renders a verdict on the user's pet feature. Automated code review lost for exactly this reason ("a thing roasts your code and tells you how terrible of a developer you are"), and a feature-team PM who red-teams "gradually depletes their social capital." Build co-produced evidence the user gets credit for. **Flag, never gate.****

- Evidence: docs/strategy/positioning-locked-2026-08.md:95
- Note: Directly constrains how the /p/teardown entry point is sold: "an evidence-backed red-team, with the evidence behind every call attached" (README.md:136), never "get roasted".

**REFUSE — anything that promises to take the judgment over. The survey's own words: "I feel like I don't think hard enough anymore — I just follow Claude." Compounding that is the Snyk absolution effect and it destroys the buyer we want.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:96

**COMMUNITY/SLACK SURFACES: plain problem language only, ALL deck vocabulary banned — "'cracked' is VC BS" was said twice in one thread.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:206

**EMPTY STATES show a **worked example** ("example" is the highest-frequency term in the corpus at 712/M) and promise a **sharpened call**, never a handled one.**

- Evidence: docs/strategy/positioning-locked-2026-08.md:309

**VOICE BAR for every user-visible string: contextual not generic (if the sentence would fit on ten other screens it is not finished) · empathetic only where something broke · enterprise-credible (could sit in Stripe's or Linear's product unnoticed; no exclamation marks, no cheerleading) · written for one reader, second person, present tense.**

- Evidence: AGENTS.md:235-240

**NAMING: lowercase `supaprod` for domains/handles/slugs, `Supaprod` in prose, `SUPAPROD` only in legal contexts, and **never camel-case "SupaProd"**. The old name *Cadence* is retired except for the generic English word, dated historical narrative, and unmigrated internal identifiers.**

- Evidence: README.md:446
