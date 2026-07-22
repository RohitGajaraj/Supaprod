# Repositioning — the triple-RFS intersection (2026-07-22)

> _Status: **RATIFIED — founder sign-off 2026-07-22** ("reposition the documents at the root level: README.md, AGENTS.md, CLAUDE.md and so on"). Propagated same session: `README.md` (header, one-paragraph, positioning statement #6, moat validation), `AGENTS.md` §0, `CLAUDE.md` §1.45, [`one-pager.md`](./one-pager.md) (category line + intersection claim), `docs/strategy/session-decisions.md`. Next: the YC application third column ([`yc/fall-2026-application.md`](./yc/fall-2026-application.md)) and the deck draw from §3. Research provenance: live ycombinator.com/rfs fetch 2026-07-22, Wayback 2026-03-13 (Spring RFS), speedrun.a16z.com + FAQ + Substack, fresh competitor sweep 2026-07-22._

## 1. The founder's directive

Position Supaprod at the intersection of three circles (founder Venn, 2026-07-22): ① **Product Management Operating System**, ② **AI Operating System for Companies** (AI-native, agentic-first, focused on the product organisation), ③ **Company Brain**. All three are literal YC Request-for-Startups categories — ② and ③ in Summer 2026 (Diana Hu, Tom Blomfield), ① in Spring 2026 as **"Cursor for Product Managers"** (Andrew Miklas, reported as that batch's #1 request). The founder's six founding threads (recorded 2026-06-03, `docs/archive/idea-origination-inputs.md`) already listed these as threads #1 and #3 — this is a return to origin, not a pivot.

**The dilemma, answered: this is not overcomplication.** The three circles are one product seen at three altitudes — ① is WHO it's for (the wedge), ② is WHAT it is (the closed-loop architecture), ③ is WHY it wins (the compounding memory). The code contains all three today: the loop engine (35 cron jobs, missions advancing every minute), the decision ledger + outcome memory, the PM lifecycle surfaces. The only real risk is in the telling — leading with all three at once. The discipline: **one headline per surface, three layers revealed in strict order: door → body → brain.** The Venn is application field 9a and deck slide ~4, never the hero line.

## 2. The market check (fresh, 2026-07-22)

**The intersection cell is genuinely unoccupied — and the window is short (1–2 quarters).** Every adjacent player stops one step before the loop closes:

| Player | State (July 2026) | Where they stop |
|---|---|---|
| Samepage Signals | $4.85M seed (Craft, Freestyle; angels Justin Kan, Matt Mullenweg), launched late June 2026; "the AI-powered second brain for product leaders", 35+ tool connections | Surfaces/monitors only — no execution, no outcome loop |
| Brief (briefhq.ai) | a16z Speedrun-backed, 2 people; "AI Ships. Brief Navigates."; decision capture into a "Product Graph" | **Nearest neighbor on decision memory** — retrieval/context only, no execution, no outcome verification. Watch closely. |
| ChatPRD | ~2 people, claims 100k+ PMs / 750k+ docs | Document generation; no loop |
| Productboard Spark | Launched 2026-01-27, "the first agentic product system"; Pulse folding in | Stops at delivery-ready specs |
| Linear | Agent beta Mar 2026 + Code Intelligence May 2026 | Context→execution for engineering; no decision/outcome ledger |
| Notion Ship OS | **Early July 2026**: "Run your entire product development cycle in Notion, from customer feedback to a merged PR" | Template + agent workflows; **no outcome measurement, no decision-outcome memory** |
| Atlassian Rovo/Jira | Agents GA May 2026, 50+ app connections | Horizontal work-AI |
| "Company brain" claimants | Hyper, Memory Store, Cerenovus, Shepherd (all YC 2026); Glean $7.2B/$300M ARR; Meta acquired Limitless Dec 2025 | Search/summarize/feed agents; none closes a product-decision→outcome loop |

**Two consequences, both binding on our language:**
1. **"Closes the loop" alone is no longer differentiating copy** — Notion Ship OS already markets "feedback to a merged PR." The defensible, uncontested claim is the last step: **outcome verification + decision→outcome memory that re-ranks the next bets.** The brain is the crescendo of every telling, not the loop. (This confirms the founder's instinct that Company Brain is the most important circle.)
2. **"Company brain" is genericizing fast** (four YC startups literally named around it; Samepage squats "second brain for product leaders"). Use it as YC's named cell — quoted, attributed — never as our brand identity. Our owned words: **the outcome ledger, the decision brain, receipts.**

## 3. The positioning architecture (the proposal)

**One product, three altitudes — told in this order, always:**

- **① The door — "Cursor for product managers."** Miklas's RFS verbatim: _"an AI-native system focused on helping teams figure out what to build, not just how to build it."_ Instant legibility; the 50-char stays: `Cursor for PMs, the whole product org.`
- **② The body — the operating system for the product org.** Hu's RFS verbatim: _"This turns a company from an open loop into a closed loop… flag when engineering is building the wrong thing, or generate specs agents can execute on… Not another dashboard. The system that turns a company's own artifacts into a self-improving loop."_ That is the loop engine, literally: sense → decide → define → build → ship → learn, governed, receipted.
- **③ The brain — the part that compounds.** Blomfield's RFS verbatim: _"a living map of how a company works… turns it into an executable skills file for AI… I think every company in the world is going to need one."_ Supaprod's decision ledger + outcome memory, scoped to the product org first — plus the exportable agent-context bundle (the literal "executable skills file," see §7).

**Category sentence (deck/investor surfaces):**
> "Supaprod is the agentic operating system for product teams. It tells you what to build — from your signals, the market, and your own decision history — then builds it, ships it, checks the outcome, and remembers. The more it runs, the sharper it gets."

**The intersection claim (application field 9a / deck slide 4):**
> "YC has now asked for this company three times, in three pieces: a 'Cursor for product managers' (Spring 2026), an 'AI operating system for companies' (Summer 2026), a 'company brain' (Summer 2026). My insight is that they are one product — you cannot be the company brain without owning the loop that generates the outcomes, and you cannot run the loop without being the operating system. The product org is where that loop is tightest, so that is where I started."

**Differentiation in one breath (post-Ship-OS sharpening):**
> "Everyone else stops one step short: Samepage surfaces, ChatPRD and Spark draft, Brief remembers context, Linear and Notion's Ship OS dispatch — nobody checks the shipped outcome against the decision and feeds it back. That last step is the only one that compounds."

**The standing close (unchanged, already canonical):** "Agents do the work. You answer for it. Supaprod is how you answer."

**The own-engine ruling (founder, 2026-07-22 — binding on every pitch surface):** Supaprod builds everything under one platform. The engine harness is ours; the best model plugs in per job across the ENTIRE lifecycle (sensing, deciding, designing, building, researching, learning). Users never buy a second Cursor/Devin license and their context never round-trips through another vendor. BYO dispatch survives ONLY as a quiet, unadvertised enterprise escape hatch in the architecture (`build-driver-and-dispatch.md` remains the architecture reference); it appears on no outward surface. This supersedes every "we deliberately don't build the code generator" and "we dispatch to Cursor/Devin" formulation.

## 4. Corrected RFS verbatims — use ONLY these

The repo corpus (`docs/references/investor-corpus-yc-vc.md` §1) contains real misquotes vs the live page (e.g. "transforms" for **"turns"**; "Every company in the world will need one" for **"I think every company in the world is going to need one"**). Quote from the live-fetched text (2026-07-22). New finds the corpus missed, all application-grade:

- Hu: _"I've seen teams that do this cut sprint time in half and ship twice as much."_
- Hu (the pain, with named tools): _"building this today requires brutal integration work, stitching together Slack, Linear, GitHub, Notion, call recordings, and a dozen other tools with custom glue code."_
- Blomfield: _"We need Garry's G-Brain, but for every business in the world."_
- Epstein (the durability close): _"While everyone else is building agents, the biggest opportunity might be building the software those agents depend on."_
- Miklas (nearly a Supaprod spec): _"Imagine a tool where you upload customer interviews and product usage data, ask 'what should we build next?', and get the outline of a new feature complete with an explanation based on customer feedback as to why this is a change worth making."_

Full corrected texts: the four complete RFS entries are preserved in the session research capture; refresh the corpus file with them before any copy freeze. Standing rule kept: RFS = confirmation, never origin ("decade-of-pain first, dashboard origin second, RFS echo third" — founder ruling 2026-07-10). Bias flag always attached: an RFS is YC's demand signal, not market proof — "the seat is named, so it will get crowded" (it now measurably has: see §2).

## 5. Vocabulary rules per surface

| Surface | Leads with | Allowed | Never |
|---|---|---|---|
| YC application | The anchor (Cursor for PMs) → scope escalation | "operating system" in later fields; RFS cells quoted in 9a | "agentic" in any first line; "AI PM tool"; interview/user counts that aren't real |
| Deck / investor | Category sentence (§3) | All three cells named on the Venn slide | "company brain" as self-description (it's YC's phrase, quoted) |
| Landing page | Current hero (unchanged) | — | "operating system" stays banned on-site per the 2026-07-15 ruling **until the founder re-rules** |
| Demo video | The wedge ("why did we decide X") | The brain beats (outcome check, miss, rollback) | Presenting seeded data as real customer proof |

## 6. The ten-year durability argument (frontier-model releases)

1. **No fast oracle.** Code compiles in seconds; product judgment settles in weeks. The layer without a fast oracle doesn't commoditize — it compounds. (Precondition, not threat: Amodei's own timeline for SWE automation is the tailwind.)
2. **The ledger cannot be backfilled.** A frontier model with every export still can't reconstruct which calls you made, on what evidence, and whether they paid off. Time is an ingredient no model release shortcuts.
3. **The engine is ours; the models are commodity plug-ins (own-engine ruling, 2026-07-22).** One runtime chokepoint, one owned harness: the best model plugs into every lifecycle job, and a better model is a same-day drop-in at zero engineering cost. We don't race the models; we put them to work. No second license, no data round-trip; enterprise BYO dispatch survives quietly in architecture only.
4. **The neutral seat.** No lab will own cross-tool accountability (they retire exactly those surfaces), and no suite (Atlassian/Notion) can be the judge across its competitors' tools — or publish its own misses.
5. **Software for agents** (Epstein's cell — the quiet fourth circle). MCP + A2A + the exportable skills bundle mean that when agents become the users, Supaprod is already what they depend on: _"the biggest opportunity might be building the software those agents depend on."_ Better agents need more context and more accountability, not less.

## 7. Make-it-true gap list (the 3-day build sprint)

Each item converts a positioning claim from words to demo:

1. **Flip `DECISION_BRAIN_SUPERSESSION` on** (founder + demo workspaces minimum) — the brain's signature mechanic is dark in prod; verify the RF-01..08 reinforcement seam is actually enabled while there.
2. **Build the agent-context-bundle export** (RPT-15, already specced): Settings → Export → an AGENTS.md/skills-format pack of decisions+receipts+outcomes+precedents. One day of work; it is Blomfield's "executable skills file" made demoable — the single most RFS-resonant beat we can film.
3. **Hide or "coming soon"-badge the 10 stub connectors** (Linear, Notion, Jira, Figma, Google/Microsoft suites) — a partner clicking Connect Linear must not hit a dead adapter. Real today: GitHub + Intercom/Stripe/Slack/Zendesk/HubSpot/Salesforce/Canny/Productboard + Firecrawl.
4. **Demo integrity sweep:** re-seed the demo workspace; verify demo login against `https://supaprod.ai`; ensure `/proof` labels seeded content as the sample workspace; refresh the stale public changelog (`/updates` last entry 2026-07-10).
5. **Fix `scripts/dashboard-tally.sh`** (rank 1–99 regex bug) before quoting register numbers anywhere.
6. **URL/credential sweep:** every application/doc URL → `supaprod.ai`; decide whether demo creds stay on `redcadence.app` or migrate; test in incognito.
7. **Re-record both videos** (founder ≤1:00 bullet-card; demo ≤2:15) — scripts exist, minor updates for the sharpened brain-first beats. The 2026-07-14 "no recorded demo video" ruling was landing-page-scoped; the YC demo video proceeds.

## 8. Customer-evidence rules (binding for all application copy)

Zero first-party discovery interviews have occurred (0/25 outreach sent — `docs/Growth Strategy/03-customer-discovery-and-validation.md` is a plan, not a record). Therefore:

- **Never** claim interviews, discovery-call counts, or "we spoke to N customers." YC states it may verify any number; the 10-minute interview probes exactly this; the application's own Law 1 ("true on the day you hit submit") already forbids it.
- **Freely and strongly** cite the documented customer voice — with one format rule (founder ruling 2026-07-22): **on application/investor surfaces, cite named-company hand-rollers, never community point counts** (the founder doesn't relate to point-score evidence and partners may not either). Preferred citations: PMs at OpenAI and DoorDash hand-building their own rigs out of Claude Code + MCP + memory files (one describing 1,500 hours on her setup); Abhi Muchhal (OpenAI) on cognitive overload; Matthew Wensing (customer.io) on stale artifacts and the wish for a contradiction auditor; Gabor Meyer (Google, on Lovable) / Mike Ball (David's Bridal, on Replit) / Sahil Lavingia (on Codex) on AI trust collapse; PostHog's founders on the gatekeeper problem. The Reddit threads (the "why did we decide X" thread; the senior-PM build-log) remain internal evidence and demo-video material, not application citations.
- **Dogfooding is first-party evidence:** the founder is the daily user with a decade of the pain; Supaprod runs its own roadmap.
- The **soft-open path** converts "no time for outreach" into real numbers without interviews: the no-signup teardown (`/p/teardown`) and `/demo` are live; sharing them publicly (not the reserved HN/PH cards) before submit day creates a truthful "doors opened [date]" line and possibly real usage counts. Founder's call.

## 9. Accelerator mechanics (verified 2026-07-22)

- **YC Fall 2026:** deadline July 27, 8pm PT (confirmed live). Rolling review — early = fresh readers. **Late applications are reviewed** (only the guaranteed Aug-28 decision is lost). The July-25 gate (≥5 external workspaces, ≥1 quotable moment, clean fresh-account demo) currently fails on all three per the 2026-07-14 ground truth; the five-laws application was engineered to win with zero users; the founder decides on-time-honest vs soft-open-then-submit vs hold-W27, consciously.
- **a16z Speedrun:** **no open window.** SR007 closed May 17, 2026; its cohort starts July 27. Next window (SR008) unannounced; precedent says ~September 2026 for winter/spring 2027, 12 weeks in-person SF, $500K for 10% + $500K next round. B2B AI admits show fast traction ($700K-ARR-in-weeks profiles); September-with-real-usage is strictly the stronger application. The 12-14-page deck built this week doubles as the Speedrun 5–7-slide deck (their own guidance: SCQA opening, lead with strongest achievement) with a cut-down pass.
