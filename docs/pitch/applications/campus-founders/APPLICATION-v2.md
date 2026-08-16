# CF Accelerator Batch #9 — application v2

> _Created: 2026-08-16 · **This is a variant, not a replacement.** [`APPLICATION-FINAL.md`](./APPLICATION-FINAL.md) is the 2026-08-16 v1 draft and stays on disk for side-by-side comparison._
>
> **What changed from v1, and why.** v1 was drafted from [`../answer-bank.md`](../answer-bank.md) against CF's published criteria. It was competent and generic: every answer would survive a find-and-replace of the programme name. v2 is built on three things v1 did not use.
>
> | Added in v2 | Source | Why it matters here and nowhere else |
> | --- | --- | --- |
> | **EU AI Act as the wedge** | [`gov-c-frame-and-story.md`](../../../planning/rebuild-2026-07/governance/gov-c-frame-and-story.md) §F3, F4, F7, F9 | Article 50 has applied since **2 Aug 2026**. Article 26 lands deployer duties on the German customer. A US-built product tool is not designed around this. **This is the single largest change.** |
> | **The Bildungscampus tie** | Verified 2026-08-16 | Campus Founders and **TUM Campus Heilbronn** share the Bildungscampus, both Dieter Schwarz Foundation. The founder is TUM School of Management. He is an alumnus of the campus. |
> | **The YC file's verified specifics** | [`../../yc/APPLICATION-FINAL.md`](../../yc/APPLICATION-FINAL.md) | The Postgres trigger, 679 primary sources, four rebuilt versions, "two years ago I could not ship production software". All checked, none in v1. |

## Numbers, re-derived 2026-08-16

| Figure | Value | Command |
| --- | --- | --- |
| Commits | **5,321** | `git rev-list --count origin/main` |
| Migrations | **545** | `ls supabase/migrations/*.sql \| wc -l` |
| First real commit | **2026-06-02** | `git log --reverse --format='%ad' --date=short \| sed -n 2p` |

**Say "5,300+ commits and 545 migrations since 2 June 2026."** v1 said 5,000+, which understated the build by 6%. **Re-pull on the morning of submit.**

> **Rule 6 adjacency holds in v2:** the commit count lives in the progress answer (§12) and "agents write the code" lives in the team answer (§11). They never touch.

---

## ⚠️ Status: the live form has not been read

**The question set is behind an account gate the founder opened with Google OAuth, so no agent session can reach it.** Every block below is written to CF's published criteria and to the question set v1 inferred. **Before pasting: read every question, label, character limit and dropdown option off the live page and re-cut these blocks to the real labels.** The form is the spec ([`../how-to-draft-the-next-one.md`](../how-to-draft-the-next-one.md) Part 2).

---

## 1. Startup name

```
Supaprod
```

## 2. Website

```
https://supaprod.ai
```

## 3. One-line description

Short field, under 50 characters:

```
Agents run the product org. You keep the judgment.
```

_49 characters._ **The Cursor anchor is dropped in v2.** Three readers killed it on the YC application for a reason that binds here too: it borrows the do-the-work-faster frame that the competitors answer spends a paragraph disowning. This line names the category and the control in one breath, and the control half is what a German B2B reviewer is listening for.

If the field is generous:

```
Supaprod is the operating system a product team runs on when AI agents do the
work. It reads your own signals and your market and tells you what is worth
building, writes the spec, builds it, opens a pull request behind a gate a
person controls, then grades what actually shipped against what the decision
promised and re-ranks the next call from the result.
```

## 4. Sector / category

```
B2B Deep Tech, AI
```

> ⚠️ **Scroll the whole dropdown to the bottom before choosing.** A visible option is not the best option, and this cost a wrong selection once. If both "AI" and "Enterprise Software" exist, take **AI**.

## 5. Stage

```
Users
```

> **Not "Prototype".** Founder correction 6: *"Prototype as a stage is too modest."* The product runs end to end and a reviewer can open a login.

---

## 6. What problem are you solving?

```
Engineers got agents and building got roughly ten times cheaper. Deciding what
to build did not get cheaper, so that is now the bottleneck, and the product
side got chatbots that draft and wait.

Underneath the efficiency problem is an accountability one. Somebody still has
to stand up in a room and explain why a call was made, and by the time they are
asked, the reasoning is buried in a Slack thread from four months ago. I did
that job for close to a decade: satellite communication systems at ISRO, then
product at Infineon in Munich, then senior AI product manager at Intellect, on
the platform 200+ financial institutions across 70+ countries build their own
AI products on. The work underneath was identical every time. Be the glue
across a dozen tools, then reconstruct from memory why something was decided.

Agents make that worse rather than better, because now a person answers for
calls they did not fully make. In Europe that stopped being a management
problem on 2 August 2026, when the EU AI Act's transparency duties began to
apply. A German company running agents on product work now carries obligations
it cannot discharge from a chat history.
```

> **Door first.** The problem is named in the buyer's terms before any mechanism appears. The AI Act sentence closes the answer rather than opening it, so the answer reads as a product insight that happens to have a legal deadline, not as a compliance pitch.

## 7. What does your product do?

```
Supaprod runs the whole product lifecycle as one governed loop instead of six
disconnected tools. Three layers, built in that order.

01. The director. It reads the team's user feedback, product analytics, support
and sales conversations, competitors and market, and says what is worth
building with the evidence attached. A critic argues down the weak bets before
anyone commits. This is the layer nobody else sells.

02. The operating system. Agents write the spec, plan and design the work,
build it, and open a real pull request behind a merge gate no agent can cross.
Every model call goes through one runtime chokepoint that handles budget,
cache, guardrails, tracing and fallback, so a better model is a same-day
drop-in and the team runs no second coding tool for it.

03. The brain. Every decision is written down with the forecast that justified
it, frozen at the moment of the call, then graded against what actually
shipped. This is the layer that compounds: it warns a team before they repeat
something that did not work, and re-ranks the next bets from outcomes it has
already seen.

Two things a technical reviewer should test. The forecast fields are made
immutable by a BEFORE UPDATE trigger in Postgres rather than a check in
application code, so the rule holds for every caller the application can make,
including its own agents. And agents earn autonomy from their own track record
the way you extend trust to a new colleague, with floors on merge, revert and
delegate that nothing can override, plus a customer-reachable stop that halts
work in flight.
```

> **Door, then body, then brain, every time.** The brain is the crescendo, never the opening. Leading with the moat is the single largest rewrite this corpus has ever had to make.
>
> **The Postgres trigger is new in v2 and it is the most convincing sentence in the application.** It is a mechanism a reviewer can verify, and it converts "immutable" from an adjective into a database object. Say the mechanism, not the adjective.

## 8. Why is this innovative? What is defensible?

```
I will concede two of the three answers people normally give here, because I
tested them and they did not hold.

Storage is not the moat. Any vendor can store decisions. The record of what
happened is not the moat either, and that is a correction I made in August
after a full read of the market falsified it. Causes survive in Slack, email
and call recordings, and they have been reconstructed after the fact twice on
the public record. One of those was Vercel's COO rebuilding the reasoning
behind a lost deal with an agent he put together in two days.

What survived is narrower and harder. It is the forecast captured at decision
time: what a team believed would happen, recorded before the outcome was known.
That is not an artifact. It leaves no trace anywhere unless something caught it
at the moment of the call, so a competitor holding every byte of the raw data
still cannot reconstruct it. Time is the ingredient no model release shortcuts.

Two things hold it up. Product judgment has no fast oracle. It cannot be
compile-tested, which is why code generation commoditised in eighteen months
and deciding what to build did not. And the seat has to be independent: no
frontier lab inside its own chat app, and no suite vendor, can be the honest
judge across its competitors' tools or publish its own miss record.
```

> **The application's one self-correction beat.** It names what was believed, what refuted it, and what survived. **Do not add a second anywhere.**

## 9. Market size and scalability

```
The budget already exists as headcount rather than as a software line. Roughly
2.6M product managers at about $115K loaded cost is a $300B+ annual work
budget, and today it is split across a tracker, a docs tool, a spec tool, a
coding agent and a weekly status meeting.

SAM is $2B growing to $12B a year across two motions. Transform: 650K existing
product teams. Create: 500K new agent-native organisations by 2030. SOM is
about $47M ARR, the agent-native tenth at launch pricing.

The tailwind is that building got commoditised faster than anyone modelled.
Devin went from $37M to $492M ARR in twelve months and Cursor is at $2B. As
that happens the ratio of product people to engineers inverts and one person
directs a fleet. Instagram already replaced its roughly 13-person canonical
team with pods of four to six engineers led by a role Mosseri calls product
staff, a PM who absorbs design, data and research. That seat is the buyer. One
person is now accountable for calls that used to be split across five
specialists, and that seat has no system of record.

Pricing is a workspace subscription plus credits for what the agents actually
run, so the bill tracks work done rather than seats. It gets its first real
test in beta.
```

> **The Instagram/Mosseri buyer definition is new in v2.** v1 asserted a market size and stopped. A number tells a VC how big; a named seat tells them who signs. **The second is the harder half and v1 did not have it.**

## 10. Who are your competitors?

```
Nobody runs the whole loop, so my real competitor is the stitched stack. A
product manager runs discovery in one tool, writes the spec in a second,
designs in a third, hands code to agents in a fourth, ships behind flags in a
fifth, and reads the result in a sixth. Every one is excellent at its own step.
The tax is not the tools, it is the seams: context is re-entered at every
handoff, and by the third one the reasoning behind the call is gone.

The named ones are real and getting closer. Notion shipped Ship OS, which
promises customer feedback through to a merged pull request. Atlassian launched
Product Collection, positioned around better decisions. Linear hands issues to
coding agents. ChatPRD drafts specs for over 100,000 PMs. Every one of them
makes doing the work faster. None of them records whether the call was right,
and none catches what the team expected before it found out.

That gap is structural rather than a missing feature. Grading a decision needs
the call and its outcome inside one system, and a handoff is precisely where
those two get separated. No feature ships past that.

The second competitor is smaller and wins more deals: a folder of markdown
files. The argument for it is real, that lower-level tools are more
agent-friendly because agents drive them better. That premise is right and the
conclusion is wrong. An agent can write into a Notion page or a GitHub issue.
It cannot write a decision carrying its evidence, its author, a verdict slot
and a human gate into either. Low-level tools are agent-writable but not
agent-governable, and that seam opens the moment a second person or a fleet of
agents touches the work.

I deliberately do not build the code generator. That fight is expensive and the
models keep absorbing it.
```

> **Never write "we have no competitors."** Most common red flag in this exact question, not true, and it claims without a mechanism.

---

## 11. Tell us about the team. Why are you solo?

**This is the answer that decides this application.** CF's stated bar is *"at least one tech and one business co-founder"*, with exceptions for exceptional solo founders. **The answer must not argue for an exception. It must make the reader stop reading it as a solo application.**

```
Solo, and I carry both halves of what you are asking for rather than one of
them.

The technical half: a BE in Mechatronics Engineering, and I started at 21
building satellite communication systems at ISRO, India's national space
agency, for its Moon and Mars missions. Hardware launches once. There is no
patch release, no rollback and no second attempt, and every decision has to
survive review by people who will not accept "it should be fine". Both missions
flew.

The business half: an MBA from TUM School of Management, then close to a decade
in product. Semiconductors at Infineon Technologies in Munich, then senior AI
product manager at Intellect, a BFSI technology company, leading product on the
AI platform 200+ financial institutions across 70+ countries build their own AI
products on. Regulated buyers, long procurement, and a security review before
anything ships.

On the code: no non-founder has touched a line of this codebase. I direct all
of it and agents write it. I review every change, everything clears typecheck,
build and the test suite before merge, and a separate reviewer independent of
the agents that build audits it for security.

The part of this I would not have believed two years ago is that I could not
ship production software at all then. I learned to build by directing agents,
out of necessity, and I built and threw away four complete working versions of
this product before this one, each rebuilt from scratch when the shape turned
out to be wrong.

I am open to a co-founder who shares the vision and adds a perspective I do not
have. I am not waiting for one.
```

> **The fourth paragraph is new in v2 and it is doing the heaviest lifting in the application.** *"I built and threw away four complete working ones"* cannot be discounted; *"I am persistent"* can. **Show the behaviour, never name the trait.**
>
> **The commit number is deliberately absent here.** It goes in §12. Rule 6: those two facts must never share a paragraph, or the number reads as measuring the agents rather than the founder.

## 12. How far along are you? / Traction

```
Supaprod is in private beta, invite-only. Signup closed on 2026-08-07 and entry
is by invite code. Public launch is mid-September 2026.

The product runs end to end today and your reviewers can walk the whole loop in
about ten minutes: agents read the signals, argue down the weak bets, come back
with a call and its evidence, write the spec, build it, open the pull request,
and a person merges. An engine advances product missions on its own every
minute without anyone starting it, which is the only reason one person ships at
this pace.

The build behind that is 5,300+ commits and 545 database migrations since
2 June 2026, directed and reviewed by one person. Both reproduce from a single
command.

On demand rather than function: I read 679 primary sources and sat inside a
private community of roughly thirty thousand product managers. One of them put
it better than I could. "PMs got faster at shipping but didn't get better at
defending why. The judgment gap got exposed." I have not run formal discovery
interviews and I am not going to pretend I have.

Login: lantern@supaprod.ai / Supaprod!Lantern2026 at https://supaprod.ai
One-page brief: https://supaprod.ai/brief
```

> **Never volunteer the zero.** No form asks for it. **If a required field asks for a revenue or user number, give the true figure; leave optional ones blank.**
>
> **The 679 sources paragraph is new in v2.** v1 proved the product functions and never proved anyone wants it. This separates the two out loud, which is the answer that survives *"if you are the only user, who pays you?"*

## 13. Why Campus Founders, and why Heilbronn?

**This is the answer that separates a strong application from a generic one, and v1's version would have survived a find-and-replace of the programme name.**

```
Three reasons, and the first one is about a deadline that already passed.

On 2 August 2026 the EU AI Act's transparency duties began to apply. Article 12
requires automatic logging over a high-risk system's lifetime. Article 14 puts
a duty on the provider to build the system so a human can actually oversee and
halt it. Article 26 lands the matching duty on the deployer, which is the
German company running the agents, not the vendor selling them. Supaprod was
built around that shape before it was a legal one: a merge gate no agent can
cross, an audit trail on every agent action, a stop the customer can reach in
one action, one-key rollback on anything an agent produced, and a deliberate
refusal to score named human teammates, because Annex III point 4 makes AI used
in task allocation and performance evaluation high-risk and I would rather
design that exposure out than document it. A US-built product tool is not
designed around any of this. Heilbronn is where the buyers who feel it live.

Second, I am coming back rather than arriving. My MBA is from TUM School of
Management, and TUM Campus Heilbronn sits on the same Bildungscampus as Campus
Founders. I was a product manager at Infineon in Munich. I have built product
inside German engineering culture, I know how a German industrial buyer
evaluates, and Baden-Wuerttemberg is not an unfamiliar market to me. With IPAI
next door and the Schwarz Group, Bosch and Audi in the region, the density of
companies deploying agents into real workflows is higher here than anywhere
else in Europe.

Third, the thing I am genuinely short of. The honest risk in this company is
distribution, not the product. I built the engine before opening the doors,
which for a product whose value comes from decisions graded against outcomes
was the right sequence, because an empty system teaches you nothing. It was
also the wrong sequence for learning fast, and it means I have had far less
contact with users than someone eleven weeks in should have. Twelve weeks of
structured customer discovery with access to German B2B corporates is a direct
answer to that specific gap, which is why this programme and not a generic one.
```

> **This is the application's one vulnerability beat**, placed in the third position where the form invites it and converted immediately into the reason for applying here. **Do not add a second admission anywhere.** The Conviction draft had three and was rejected whole.
>
> **The AI Act paragraph is the largest single change from v1** and it is the answer to *"what is different about this application".* Every clause in it is sourced to an article number and every mechanism named is already built.

## 14. Are you able to attend in person in Heilbronn, 30.09 to 18.12.2026?

```
Yes, full-time for the whole twelve weeks. I am leaving my job and relocating
for this company regardless of how any application goes, so Heilbronn is a
scheduling question rather than a decision.
```

> **No "if accepted, I will".** Rule 3, unconditional commitment. The programme changes the speed and the postcode, never the decision. Contingency reads as neediness.

## 15. What would you use the €25,000 for?

```
Roughly half is compute and model spend, and that is a go-to-market line rather
than overhead. Supaprod runs frontier models through its own runtime on every
mission, so cost scales with how much work the agents do rather than with
headcount. Every German team I put on the product during the programme draws on
that line directly. Paying for their usage is how I buy the only thing I
actually need right now, which is real product work running through the loop
and real outcomes to grade it against.

Roughly a third is landing the first pilot customers: German B2B product teams
who run their own live work through Supaprod across the twelve weeks and shape
it while they do. They get it early and free. I get the outcome record the
third layer has never had, and the teams it works for are the first
conversions at launch.

The rest is the tooling and the travel around that motion.

Incorporation is deliberately not on this list. It is negotiable and I will
fund it myself rather than spend programme money on paperwork.
```

> **"Design partner" is banned in this application.** A German B2B reader hears UI/UX design, which is the wrong product and the wrong conversation. **Say "pilot customers" and explain the arrangement in the same sentence** so the term carries no ambiguity: they run live work, they get it free and early, we get outcomes.
>
> **Why compute leads and still reads as go-to-market.** The naive version makes compute sound like burn. This version names the thing a venture manager checks for: the founder knows his own cost structure, and in this business the compute line *is* the customer-serving line, because usage scales with agent work rather than seats. **Incorporation is cut on founder ruling: it is negotiable and spending programme money on paperwork reads as no plan.**

## 16. Legal entity

```
Not yet incorporated. I will incorporate in whichever jurisdiction the
programme requires.
```

> Founder ruling: **do not incorporate an Indian Pvt Ltd** to unlock anything. The later flip to a Delaware parent runs through FEMA and RBI share-swap rules and routinely costs more in time, legal fees and tax than the money is worth. CF does not require an entity to apply; it gates the money moving.

## 17. Funding raised to date

```
None.
```

> Truthful if required. **If optional, leave blank** (founder correction 5).

---

## The four-hat pressure test, run 2026-08-16

**Every answer above was scored by four readers before it was written down. What each would still push on, and where the answer is.**

| Hat | The hardest question they ask | Where it is answered | Surviving weakness |
| --- | --- | --- | --- |
| **Accelerator director** | "Solo founder, no entity, no revenue. Will he actually relocate to Heilbronn and will a German corporate take a meeting with him?" | §11 carries both halves with evidence; §14 is unconditional; §13 names Infineon, TUM and the regulated-buyer record | **He has never sold to a German corporate as a founder.** No answer fixes this. §13 converts it into the reason for applying. |
| **VC** | "Is this a category or a feature Notion ships in a quarter?" | §10 makes the gap structural rather than featural: grading needs call and outcome in one system, and a handoff separates them | **The moat has never been tested with a paying customer.** §9 says pricing gets its first real test in beta rather than asserting a number. |
| **Technical evaluator** | "Agents wrote it. Is any of it real?" | §7 names the Postgres BEFORE UPDATE trigger; §11 names the independent security reviewer and the merge gate; §12 gives a working login | **The trust ramp has never fired and the loop has never graded a real outcome.** Stated as a mechanism throughout, never as a history. |
| **Founder peer** | "Does this sound like a person or like an application?" | Read aloud: §11 paragraph four and §13 paragraph three are the two that sound like a person | **§9 is the least human answer in the set.** It is a market question and it reads like one. Acceptable. |

### The claim-by-claim verification, run before this file was written

| Claim | Checked against | Verdict |
| --- | --- | --- |
| 5,321 commits, 545 migrations, since 2026-06-02 | `git rev-list --count origin/main`, `ls supabase/migrations/*.sql`, `git log --reverse` | ✅ Re-derived 2026-08-16 |
| AI Act Art. 50 applies 2 Aug 2026; Art. 12 logging; Art. 14 oversight; Art. 26 deployer; Annex III pt 4 | [`gov-c-frame-and-story.md`](../../../planning/rebuild-2026-07/governance/gov-c-frame-and-story.md) §F3, F4, F7, F9 | ✅ Sourced to article numbers in the repo |
| Campus Founders and TUM Campus Heilbronn share the Bildungscampus; IPAI founded 2021 by Dieter Schwarz Foundation, Schwarz Group, City of Heilbronn | Web verification 2026-08-16 | ✅ Confirmed |
| Forecast immutability is a Postgres `BEFORE UPDATE` trigger | [`../../yc/APPLICATION-FINAL.md`](../../yc/APPLICATION-FINAL.md) tech stack answer | ✅ Verified in the YC pass |
| Merge gate, one-key rollback, kill switch, trust ramp | YC §0b sentence-by-sentence pass | ✅ All exist. **Trust ramp has never fired** and v2 states it as a mechanism only |
| 679 primary sources, ~30,000-PM community | YC 9a | ✅ Carried verbatim |
| Vercel COO rebuilt a lost deal's reasoning with a two-day agent | YC §0, `market-validation-2026-08.md` | ✅ |
| Instagram pods and the "product staff" seat, Mosseri July 2026 | YC 9c, corrected paragraph | ✅ Uses the corrected version. **The old spliced "one PM directing 20 agents" claim is not used.** |
| Devin $37M → $492M, Cursor $2B | v1 draft, market answer | ⚠️ **Not re-verified this session.** If a reviewer challenges it, the answer stands without it. |

> **Deliberately NOT claimed anywhere in v2**, each for a recorded reason:
> - **No count of human approvals.** YC Rule 4: never quantify the human gate on an autonomy story. The gate is a principle as a feature and a liability as a count.
> - **No accumulated-learning claim in the present tense.** The loop is wired and proven and begins accruing on first real use.
> - **No "Supaprod's own roadmap runs inside Supaprod."** It does not survive its own database.
> - **No mission names.** Moon and Mars missions only. A name a reader has to look up stops the sentence.
> - **No Linear, Notion, Jira or Figma in any connector list.** Those adapters are stubs.

---

## The pre-submit checklist

- [ ] **Re-pull the numbers.** `git rev-list --count origin/main` and `ls supabase/migrations/*.sql | wc -l`.
- [ ] **Read every question off the live form** and re-cut every block to the real character limits. **Not yet done.**
- [ ] **Scroll every dropdown to the bottom** before choosing.
- [ ] **Test `lantern@supaprod.ai` in incognito** on supaprod.ai and confirm the approval queue is armed.
- [ ] **Em-dash sweep.** No em dashes, no en dashes, no invisible Unicode.
- [ ] **Banned-word sweep**: leverage, utilize, robust, seamless, cutting-edge, revolutionize, game-changer, unlock, empower, supercharge, delve, testament to.
- [ ] **Brain-verb sweep**: no "remembers", "stores" or "logs" as verbs of the brain.
- [ ] **Vocabulary sweep**: no receipts, ledger, company brain, decision layer, unattended, first run, provenance. "Audit trail" and "shared brain" are fine.
- [ ] **Exactly one vulnerability beat** (§13, third reason) and **exactly one self-correction** (§8).
- [ ] **Rule 6 adjacency**: commit count (§12) and "agents write it" (§11) still in separate fields.
- [ ] **Repetition sweep.** ISRO appears in §6 and §11; **confirm §6 keeps the one-line arc only and §11 carries the detail.** This is the exact defect caught at YC and again at SkyDeck.
- [ ] **Read every answer aloud. Delete any sentence that stays true with a competitor's name swapped in.**
- [ ] **Verify each answer persisted** by reloading and reading the element back by name, never by content-matching across the page.
- [ ] **The founder submits.** Never submit an application.
- [ ] **Log it** in [`../README.md`](../README.md), [`../what-to-apply-for-next.md`](../what-to-apply-for-next.md), and the Notion Application Board.
- [ ] **Update [`../../founder-answer-playbook.md`](../../founder-answer-playbook.md) in this same session.**

## Related

- [`APPLICATION-FINAL.md`](./APPLICATION-FINAL.md) — v1, kept for comparison
- [`positioning.md`](./positioning.md) — programme facts and selection criteria
- [`how-to-apply.md`](./how-to-apply.md) — the form mechanics and the account gate
- [`../how-to-draft-the-next-one.md`](../how-to-draft-the-next-one.md) — the craft rules
- [`../../yc/APPLICATION-FINAL.md`](../../yc/APPLICATION-FINAL.md) — the register this is written to
