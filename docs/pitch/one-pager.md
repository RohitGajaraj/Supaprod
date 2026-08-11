# Supaprod — the one-pager (for pitches, applications, and the founder's own head)

> _Last updated: 2026-07-10. Every claim below is tagged: **[PROVEN]** live and verifiable · **[WIRING]** built, public claim gated until it demonstrably runs · **[ROADMAP]** honest future. Numbers trace to the live DB or a dated source._

## What Supaprod is (the answer, three depths)

**One line (category):** Supaprod is where product decisions live when agents do the work. It tells you what to build — from your signals, the market, and your own decision history — then builds it, ships it, checks what happened, and learns from it, so next time it guides the call. The more it runs, the sharper it gets. _(Category headline founder-ratified 2026-07-22 — the triple-RFS repositioning, supersedes the 2026-07-18 headline; the decision-and-outcome layer stays the moat story. Full architecture, corrected live RFS verbatims, vocabulary rules: [`repositioning-2026-07-22.md`](./repositioning-2026-07-22.md).)_

**The intersection claim (the earned insight, for applications and decks):** YC has now asked for this company three times, in three pieces — a "Cursor for product managers" (Spring 2026), an "AI operating system for companies" (Summer 2026), a "company brain" (Summer 2026). They are one product: you can't be the brain without owning the loop that generates the outcomes, and you can't run the loop without being the operating system. The product org is where that loop is tightest, so that's where we started. Told always door → body → brain, one headline per surface, brain as the crescendo.

**One line (the instant anchor):** _"Supaprod is Claude Code for the product lifecycle — agents do the product work end to end, you make the calls, and the track record proves what worked."_

**One paragraph (the story):** Engineers got agents — Cursor, Claude Code — and shipping became 10x cheaper. Product decisions became the bottleneck, and the product side got chatbots that draft and wait. Supaprod gives product teams what engineering got: governed agents that run the whole lifecycle — sense signals, rank the bets, red-team them, write the specs, build to PR, ship, and record what actually happened. Plus the thing engineering never needed: an **track record** — because code has a compiler and product judgment doesn't. **The track record is the compiler for judgment.** Its feedback arrives in weeks, not seconds — which is exactly why this layer doesn't commoditize, and why owning it compounds.

## The thesis that makes us different

**Everyone sells capability. We sell accountability.** Every competitor — copilots, incumbents with AI bolted on, agent platforms — sells "do more, faster." But capability commoditizes at open-source speed, while **trust is the collapsed resource**: users catch tools lying about completion, engineers don't believe roadmaps, PMs burn hours excavating "why did we decide X," and the one thing that never transfers to an agent is accountability. As execution goes to zero, the volume of decisions a human must _answer for_ explodes.

> **Agents do the work. You answer for it. Supaprod is how you answer.**

**The three deliberately controversial moves:**

1. **The artifact is dead; the enemy is productivity theater.** Roadmaps, PRDs, status decks — projections with no source of truth behind them ("Jira is optimized for productivity theater" — the community's own words). Our posture: _receipts or it didn't happen._ Artifacts are generated from the track record on demand, drift-stamped — outputs, never sources.
2. **We publish our own misses.** Every AI product hides its failure rate. We invert it: calibration on our own dogfood track record, a demo that rehearses the wrong path on purpose, "Supaprod called N of the last M" as a first-class surface. A published miss record takes months of honesty to build and one faked number to destroy — that's why it's a moat, not a feature.
3. **We sell to the accountable individual, not the workflow.** The person whose name is on the decision — the senior/founding PM today, the one-person product runner as orgs collapse (Coinbase runs "one-person teams… managing fleets of agents" — a public company's org experiment). Amplifier, never replacement.

**Why nobody can call it a copy:** their demo says "look what the AI did." Ours says **"look what we can prove."** And every frontier model release makes this stronger — more agent work means more to answer for; BYOK absorbs the release.

## What we can PROVE today (the demo-able facts)

- **[PROVEN] The loop is real and autonomous.** A pg_cron engine advances missions every minute through Sense→Decide→Define→Build→Ship→Learn; agents hand off typed payloads (A2A); 30 background jobs run while the user sleeps. **No count here, deliberately** (2026-08-11): every figure this line used to carry was seed data. The evidence is the demo login, which a reader can run themselves and cannot argue with.
- **[WIRING] Outcomes move the ranking.** The reinforcement seam (RF-01..08) is live: recorded decision outcomes re-rank the next bets — _"your Supaprod gets smarter about your product with every outcome it records"_ (the exact mechanism Replit's founder called the one that matters: "it's not improving its weights, it's improving its context").
- **[WIRING] Earned autonomy.** A trust ramp *proposes* graduating an agent's permissions after a run of clean approvals, and a human accepts; an agent with a recent missed outcome gets no proposals at all. **`capability_changes` is 0: no agent has earned a graduation yet.** The floors are real and non-overridable (review→confirm→auto), with non-overridable floors (merge/revert/delegate always human-gated). An outside code audit (2026-07-10) called the trust ramp "genuinely mature for this stage."
- **[PROVEN] Real build-to-PR.** The spine merged a real PR through its own gated path, produced a real preview deploy and production promote with auto release notes.
- **[PROVEN] The self-report survives audit.** The 97%-complete register was independently code-audited and held — we grade our own homework and then invite the re-grade (that's the accountability thesis, applied to ourselves).
- **[WIRING] "Supaprod runs on Supaprod."** The self-improvement loop (agents reading their own traces, proposing changes as receipted build-spine changesets) is designed and partially wired (RPT-50) — **we do not say it publicly until it demonstrably runs.**
- **[ROADMAP] The felt agent layer** (named cast with visible evidence on every surface — PC-29), the Brand-Kit-driven Prototype station (PC-31), skills-with-evidence (PC-30). Say "shipping in the launch sprint," not "shipped."

**The honest state (never hide it, it's our credibility):** the engine is finished and independently verified; organic external users as of 2026-07-10: zero — we built the OS before opening the doors, deliberately, and the Launch Month (< 25 days to public listing) opens them. Traction numbers get added here weekly once beta starts.

## The moat, in one breath

The decision-and-outcome layer: (1) **no fast oracle** — product judgment can't be compile-tested, so it doesn't commoditize like codegen; (2) **the forecast can't be backfilled** — a competitor with all your raw data *can* reconstruct what happened, because causes survive in Slack and call recordings; what nothing reconstructs is what your team believed would happen, recorded before the outcome was known _(corrected 2026-08-10, [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) §2)_; (3) **the independent seat** — the labs could have built this and didn't, because they couldn't build it securely across someone else's tools, and an independent third party has no such restriction; (4) **the white space is measured, still empty** (2026-07 sweep): nobody reinforces ranking from outcomes; nobody spans signal→decision→build under one record. Precedent says vertical survivors beside frontier models share exactly our shape: workflow depth + compounding proprietary data + trust friction (Cursor beside Copilot; Abridge/EvenUp's corpora).

## Market and money (sourced)

PM software ~$8B (2026) + AI dev-agents ~$10–11B → ~$18B combined, ~$40–50B by 2030. SAM ≈ $11B central. The tailwind: build commoditized faster than modeled (Devin $37M→$492M ARR in 12 months; Cursor $2B) while PM:eng ratios invert toward 1:20 — deciding what to build is the scarce resource, and YC's own Summer-2026 RFS asks for a "Company Brain." Pricing: 4-tier, **credits price closed decision loops** (the value event), never seats or tokens; the Critic teardown is free (the wedge); NRR 120%+ is the bar we instrument for from day one.

## The one-liners bank

**Narrative candidates added 2026-07-10 (additive — founder picks; ranked by instant relatability):**

- **"What Cursor did for writing code, Supaprod does for deciding what to build."**
- **"Cursor for product managers — except it also proves which decisions were right."**
- "Every engineer got an AI pair. The person deciding what they build got a chatbot. We fixed that."
- "An AI product team you can actually hold accountable."
- **"The product-staff seat. Instagram replaced its ~13-person canonical team with pods of four to six engineers led by a new role it calls _product staff_ — one PM absorbing design, data and research (Mosseri, 2026-07-09). Supaprod is the console for that seat."** [RPT-35]
  > _Corrected 2026-08-10 (Lane 0 quote audit). The prior version read "One PM directing a fleet of 20 agents across a 4–6 person pod (Mosseri). 1.2 humans + 20 agents = 10-human output (Lemkin)." **Mosseri never says "agents"** — his pod is four to six *engineers* plus a product staff, a core of "six or seven," and he partly credits smaller teams rather than agent leverage. The Lemkin arithmetic describes a **sales/GTM** function, not a product pod, and could not be corroborated anywhere in the 679-document paid archive. The two were spliced into a sentence neither source states. Only Mosseri survives, and he is verified verbatim. Full audit: [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md)._
- "Your product org, running itself — with a track record that proves what worked."

**The original bank:**

- "Agents do the work. You answer for it. Supaprod is how you answer."
- "The track record is the compiler for judgment."
- "Evidence or it didn't happen."
- "Their demo shows what the AI did. Ours shows what we can prove."
- "Lovable builds you the wrong feature, beautifully, in ten minutes. Supaprod stops you from building the wrong thing — and proves which thing was right."

**The engine is ours; the models are plug-ins (own-engine ruling, founder 2026-07-22 — supersedes the RPT-42 dispatch-first framing on every pitch surface):**

- "Your models will change. Your decision history shouldn't." (the deprecation-insurance line, kept.)
- Supaprod's own build engine runs the lifecycle end to end through one chokepoint, plugging the best model into every job — sensing, deciding, designing, building, researching, learning. A frontier release is a same-day drop-in, never a vendor negotiation; users never buy a second tool license; product context never round-trips through another vendor. Enterprise BYO (an existing Devin/Codex contract) exists behind the same seam, unadvertised. MCP + Skills interop unchanged.
- "The labs shipped the hands. We're the seat above the fleet where a human answers for the work."

---

## Landing page canonical lines (locked on the live page, 2026-07-15)

The public landing (`/`, landing v2, commit 81fefcfe) now carries these as the outward-facing wording. Reuse them verbatim in decks, applications, and outreach so the story never drifts from the site:

- **Hero:** "Supaprod tells you what to build. then builds it. ships it. grades it. gets sharper." (Geist Pixel, founder-ruled USP-first framing; verbs hover to ember)
- **Identity line (title/meta/llms.txt, verbatim in all three):** "Supaprod tells product teams what to build, then runs a loop to shipped code and grades the outcome. Every outcome sharpens the next. You approve the gates."
- **Title tag:** "Supaprod: agents that know what to build, and ship it"
- **The gap:** "> Devs got agents that ship real code. / Product is still waiting for its own." (the word Devs types terminal-style; Product in Pixel ember)
- **USP beat:** "Everyone can build now. Knowing what to build is the moat." + Pixel line "Supaprod builds that moat for you."
- **Close:** "A product team of agents, answerable to you."
- **Vocabulary rulings baked into the page (binding):** never "chatbot" / "copilot" / "operating system"; no competitor names or borrowed-brand analogies anywhere on the site (the Cursor hook is retired from the landing); "second brain" is sanctioned; ember = human action + founder-sanctioned USP highlights. Full design record: `design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md`.
