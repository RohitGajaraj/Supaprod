# The YC videos — founder (1:00) + demo (~2:10)

> _Rewritten 2026-07-10 against YC's official rules and the research corpus ([`research-findings.md`](./research-findings.md) §1.3): founder video is **1 minute, founders talking, nothing else, and "do not recite a written script: use bullet points instead."** Demo video: partners give it 60–90 seconds of attention; funded demos "often look terrible… but they sound incredible — dense, factual, and fast." One take, no editing, real product. Claim law: anything not true on filming day gets cut — check [`../one-pager.md`](../one-pager.md) tags before recording. Both videos: re-record replaces the 2:54 founder video and the 11:46 demo currently on the application._

---

## Part 1 — the founder video (1:00 max)

**Format:** webcam, sit close, look at the lens. ONE take — a stumble is fine, reading is not. No slides, no product shots, no music. Partners watch this to answer one question: _would I back this person?_

**Your bullet card (glance, don't read — YC's own instruction):**

- Rohit, solo founder of Supaprod — Cursor for product managers
- Ten years in product: ISRO at 21 → the AI platform 200+ banks build on
- The wall I hit: agents did MORE of my work, I could explain LESS of it — accountable for everything, able to prove nothing
- So I built the layer that was missing: agents run the lifecycle, every action has a receipt, every decision gets checked against what happened
- Proof: Supaprod built itself — ~[3,400] commits in [8] weeks, one person directing the fleet, every change receipted
- 16 hours a day for [45+] days; beta opening now, public launch weeks away; going all the way in, full-time, regardless of anything
- Close: "Agents do the work. You answer for it. Supaprod is how you answer."

**Delivery notes:** energy beats polish; smile once; if you go over 1:00, cut the resume bullet, never the wall story or the close. Say the numbers as numbers ("thirty-four hundred commits"), they carry the video.

---

## Part 2 — the demo video (~2:10, hard ceiling 3:00)

**Rules:** screen-record the real product with the seeded Explore workspace (re-seed first; verify demo credits — [`../../operations/demo-credentials.md`](../../operations/demo-credentials.md)). Your voice over it, one take. Product on screen from the first frame — no title card, no black-screen intro. The magic moment lands inside the first 30 seconds. Dense, factual, fast: every sentence states what the screen is doing.

| Time      | ON SCREEN (you drive)                                                                                                                                                                             | YOU SAY (~145 wpm)                                                                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:12 | Already logged in. The Today view, calm, fleet activity visible. Cursor moves with purpose.                                                                                                       | "This is Supaprod — AI agents that run product work end to end and keep the receipts. I'm Rohit, I built it solo with the same agents you're about to watch. Here's my actual morning."                                                                                                 |
| 0:12–0:35 | Type into the ask box: **"why did we decide [the seeded decision]?"** → the answer card appears: the decision, its evidence, who made it, the outcome check. Hover each receipt link slowly once. | "Start with the question every product person gets asked and nobody can answer: why did we decide this. Supaprod answers in seconds — the decision, the evidence it was made on, and what actually happened after. Every claim links to a receipt. This alone is why people come."      |
| 0:35–1:00 | Scroll the overnight activity: signals clustered into themes, re-ranked bets, agent bylines on each line. Click one byline → its trace.                                                           | "While I slept, agents read the overnight signals — support, reviews, analytics — clustered them, and re-ranked my bets, because an outcome landed on something we shipped and it underperformed. Every line is signed by the agent that did it, and every one opens to a full trace." |
| 1:00–1:25 | Open the top decision. The critic's argument is visible: evidence for, evidence against, a precedent. Click Approve. The decision record appears.                                                 | "My morning is three calls, not thirty tabs. On this one the fleet argues _against_ me — here's the precedent from my own history. I decide. And the call is recorded with exactly the evidence I saw when I made it."                                                                 |
| 1:25–1:50 | The approved decision becomes a spec → tasks → a real pull request opens; CI checks run; the merge button is visibly gated.                                                                       | "Approved means built: Supaprod writes the spec from the record, breaks it down, and hands it to coding agents — a real pull request, behind a gate no agent can cross. Merging stays human. Permanently."                                                                              |
| 1:50–2:10 | Open the outcome view on a past shipped bet marked as a miss. One keystroke: the artifact rolls back. End on the calm Today view.                                                                 | "And when a call is wrong? Supaprod says so — it keeps score on itself and publishes its misses. One key rolls the work back, logged. Agents do the work. You answer for it. Supaprod is how you answer."                                                                                |

**If over 3:00, cut in this order:** the trace click at 0:55 → shorten the spec beat. **Never cut** the 0:12 wedge or the 1:50 miss/rollback — the miss beat is the moment no other AI tool can film.

**Pre-record checklist:** re-seed demo workspace · credits topped up · notifications off · 1440p window · run the whole path twice silently first so nothing loads slow on take.
