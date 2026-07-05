# Founder demo script · under 3 minutes

> _Created: 2026-07-05 · Last updated: 2026-07-05_

> **Purpose:** a tight, spoken founder demo of Cadence in under 3 minutes, driven by the seeded **Prism** (consumer money app) sample workspace. Problem, why you built it, the capabilities, and why it matters. No future-roadmap section (bootstrapped, pre-seed). Log in as `demo@redcadence.app` first; open the **Sample workspace**, **Prism** product. Full seed detail: [`../features/sample-workspace-seed.md`](../features/sample-workspace-seed.md).

**How to use this:** the left column is what you *say* (spoken, plain, no jargon). The right column in brackets is what you *do* on screen. Aim for a calm pace, roughly 150 words a minute. Practice the click path once so the talk track and the screen stay in sync.

---

## 0:00 · The problem (25 seconds)

> "Every product team is drowning in the same way. Signals live in support, sales, analytics, and reviews. Decisions live in someone's head or a doc nobody reads. And nobody remembers, six months later, whether the call was even right. The scarce skill today isn't building software anymore. AI can build. The scarce skill is deciding *what* to build, and knowing whether you were right."

_[Stay on a title slide or the Cadence login. Do not click yet.]_

## 0:25 · Why I built this (20 seconds)

> "I built Cadence because I lived that pain. I wanted one system that runs the whole loop for me. It senses the signal, red-teams the decision, drafts the spec, runs the build, and then remembers the outcome, so the next decision is smarter than the last. Not a chatbot that hands me a paragraph. An operating system that owns the loop."

_[Sign in. Land on Today.]_

## 0:45 · The loop, live (35 seconds)

> "This is a real workspace for a consumer money app called Prism. Here's my morning brief. It's not a to-do list, it's the stakes: fraud false positives are up, and one thing needs my decision. Watch what's underneath it."

_[Today → point at the brief's stakes line. Click into Discover.]_

> "Every one of these is a real signal, cited, from support, churn calls, the app store, analytics. Cadence clustered them into themes on its own, and ranked the opportunities. I never sorted a spreadsheet."

_[Discover → scroll signals, then the ICE-ranked opportunity queue.]_

## 1:20 · The Critic, the wedge (30 seconds)

> "Now the part I love. A competitor shipped crypto, and my team wanted to match it. Cadence's Critic red-teamed the idea before I spent a dollar, and it killed it, citing our own history: every parity bet we ever made failed to retain our users. That is judgment, backed by receipts, in ten seconds."

_[Open the killed "crypto wallet" opportunity / the Critic decision. Point at the rationale citing the precedent.]_

## 1:50 · The moat · memory that compounds (40 seconds)

> "Here's why this gets better the longer it runs. Months ago I made a call: block aggressively on any fraud signal. It was right at launch. But the outcome came back wrong, false declines became my top churn driver. Look at this."

_[Open the Trust Ledger. Point at the fraud decision marked superseded.]_

> "Cadence caught its own mistake. It superseded that decision with precision scoring, and it kept the receipt: what I decided, why, and whether it was right. This is the thing no model and no single tool can hand you: an auditable, compounding record of your team's judgment. That's the moat."

_[Point at the supersession edge / the "was it right" outcome.]_

## 2:30 · Why it matters + close (25 seconds)

> "So one operator runs like a team. Agents execute, I decide the calls that matter, and every call is cited, reversible, and remembered. The build is commoditizing. Deciding what to build, and proving you were right, is not. Cadence owns that layer. That's Cadence."

_[Return to Today, or the Trust Ledger hero view. Stop.]_

---

## Delivery notes
- **Total:** about 2 minutes 45 seconds spoken. Trim the Discover beat first if you run long.
- **The one line that must land:** "Cadence caught its own mistake, and kept the receipt." That is the moat in a sentence.
- **Keep it plain.** No "orchestration layer", no "bi-temporal graph" on camera. Say "it remembers", "it red-teams", "it keeps the receipts".
- **If asked "is this real data?"** Yes, it is a seeded sample workspace that runs the full product on realistic data, so every surface is live, not mocked.
- **Second product (Trellis, analytics):** if a viewer wants proof it generalizes, switch products and show the same loop killing a reverse-ETL parity bet, citing the *same* precedent that spanned the money app. That cross-product memory is a strong closer for a technical audience.

## Related
- [`../features/sample-workspace-seed.md`](../features/sample-workspace-seed.md) · the seed that powers this demo
- [`demo-credentials.md`](./demo-credentials.md) · the login
- [`../strategy/moat.md`](../strategy/moat.md) · the moat argument in depth
