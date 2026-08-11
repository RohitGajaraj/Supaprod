# "What if Anthropic ships this tomorrow?" — the answer, and how to keep it true

> _Created: 2026-08-11 · Lane 0 · **The single question most likely to end an investor conversation badly.** Written because the old answer ("the labs decline this vertical") was falsified on 2026-08-10: Anthropic's own CPO said on record that he wants it. This is the replacement, plus the tracker that keeps it honest as the labs move._

**The old answer is dead. Do not use it.** *"Frontier labs decline this vertical"* is indefensible in front of anyone who follows the space, and it fails in the worst way — it makes you look like you have not been paying attention to the company whose models you run on.

---

## 1. What was actually said, and when

**Mike Krieger, CPO of Anthropic, on Lenny's Podcast, 2025-06-05:**

> *"I started the year by writing a doc that was effectively how do we do product today and where is Claude not showing up yet that it should? And I think that **upstream part is the next one to go**… **Can Claude be a partner in figuring out what to build? What the market size is if you want to approach it that way? What the user needs are if you look at a different way?**"*

He names our exact layer, calls it the next thing to go, and mentions ChatPRD by name in the same breath. **Assume any serious investor either knows this or will find it.** Never be the person who did not.

**One correction, because precision is the whole point of this document.** An earlier draft claimed OpenAI said the same. It did not. Alexander Embiricos (Codex lead, 2026-01-12) said Codex *"participates early on in the ideation and planning phases **of writing software**."* That is upstream of **code**, not upstream of **product decisions**. **One lab, not two.** Say one.

---

## 2. The answer, in the order to say it

### ① The fourteen-month test — lead with this

**He said it on 2025-06-05. It is now 2026-08-11.** In those fourteen months Anthropic shipped Claude Code, the Agent SDK, skills, MCP, several frontier models and a drug-discovery programme. **They did not ship a product-decision system.**

That is not incapacity. Anthropic can build software. **It is revealed priority**, and fourteen months is a very long time in this market. A stated intent that has not moved in over a year is a roadmap item, not a threat.

**Why this is the right opener:** it concedes the premise entirely, then answers it with a fact the investor can check. It reads as someone who tracks the company they depend on, which is the opposite of the impression the old answer gave.

### ② The structural reason it did not happen — Willison's mechanism

Simon Willison, 2026-04-02, on a different product in the same shape:

> *"Anthropic and OpenAI could have built this and they didn't because **they didn't know how to build it securely**. If you're an independent third party, you don't have that restriction."*

**A frontier lab holding cross-tool write access into a customer's Jira, Linear, Slack, GitHub and Notion is a liability surface they have strong reasons to refuse.** A third-party vendor granted scoped, revocable access is a normal procurement relationship. **That asymmetry does not shrink as models improve** — it is about trust boundaries and who carries liability, not about capability.

**Corroborated from inside a customer:** Spotify built this loop themselves in February 2024 and it broke on **permissioning, not model quality** — *"it lacks context on the product and other external factors, but I can't feed that to the GPT out of data privacy issues."*

### ③ Assistant versus system of record

Krieger's own framing was **"virtual collaborator."** That is an assistant. **An assistant answers a question; a system of record holds state, permissions and accountability across a team over calendar time.** They are different products with different buyers, different security postures and different failure modes.

To do our job you need cross-tool write access, per-workspace permissioning, an audit surface, and someone accountable for what the agent did. **That is an enterprise governance product.** Labs sell models and developer tools, and every vertical they occupy puts them in competition with the API customers who are their own distribution.

### ④ Every frontier release makes us stronger, not weaker

We are model-agnostic behind a single routing chokepoint. **A better Claude is a better Supaprod at zero engineering cost.** That is the opposite exposure to a wrapper, whose advantage is a model advantage it neither owns nor renews.

### ⑤ The precedent, and it is the closest one available

**Cursor beside Copilot.** GitHub and Microsoft had the models, the distribution, the repo, the IDE and a multi-year head start. Cursor built on the same models and reached a $29.3B valuation. **The "why won't the platform owner just build it" argument was made against Cursor and was wrong.** Same shape: Vercel beside AWS.

### ⑥ The honest concession — say it, it is what makes the rest credible

**If Anthropic decided to build this seriously, they could.** Our answer is not *impossible*. It is: **they have had fourteen months and a stated intent and have not, the reason is structural rather than temporal, and if they start tomorrow the thing they still will not have is your accumulated forecast record — which only accrues in calendar time inside a running loop.**

**One vulnerability beat, delivered without flinching, buys credibility for everything above it.** An answer with no concession in it reads as a sales pitch.

---

## 3. The tracker — this answer expires unless it is maintained

**The fourteen-month argument is only as good as its last check.** The day Anthropic ships a team-shared product-decision surface, section ②③ still hold but ① is gone, and anyone still saying it will be caught.

| Date | Who | What was said or shipped | Bearing on us | Checked |
| --- | --- | --- | --- | --- |
| 2025-06-05 | Krieger, CPO Anthropic | *"that upstream part is the next one to go"*; names ChatPRD | **The threat statement.** Assume investors know it | 2026-08-11 |
| 2026-01-12 | Embiricos, Codex lead, OpenAI | Codex *"participates early on in ideation and planning phases **of writing software**"* | Adjacent, **not our layer.** Do not cite as a lab wanting our vertical | 2026-08-11 |
| 2026-04-02 | Willison | Labs *"didn't know how to build it securely"* | **Our replacement argument** | 2026-08-11 |
| 2025-06 → 2026-08 | Anthropic | Claude Code, Agent SDK, skills, MCP, frontier models, Claude Science | **Fourteen months, no product-decision system.** The lead argument | 2026-08-11 |

**Review trigger:** any Anthropic or OpenAI launch touching product decisions, team memory, permissioned cross-tool write, or a PM-shaped vertical. **Also re-check before any investor conversation** — the fourteen-month number must be recomputed, and it only ever grows in our favour until the day it collapses.

**A live external check is in flight:** [`../research/market-validation-2026-08.md`](../research/market-validation-2026-08.md) tests exactly this from primary sources outside the Lenny corpus. **If it finds either lab shipped something in this layer, section ① is retired the same day.**

---

## 4. What must never be said

- ❌ *"The labs decline this vertical"* — falsified by Krieger
- ❌ *"Both labs said…"* — one lab. Embiricos is about software engineering
- ❌ *"They can't build it"* — they can; claiming otherwise destroys the credibility of the real argument
- ❌ Any version that does not concede the premise first. **The concession is what makes the fourteen months land**

## Related

- [`positioning-locked-2026-08.md`](./positioning-locked-2026-08.md) §5J — the correction that produced this document
- [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) §2 — the falsification of the old answer
- [`../pitch/applications/answer-bank.md`](../pitch/applications/answer-bank.md) — every application pulls its version of this answer from here
