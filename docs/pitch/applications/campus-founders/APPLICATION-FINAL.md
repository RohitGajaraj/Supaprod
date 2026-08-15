# CF Accelerator Batch #9 — the application

> _Created: 2026-08-16 · Last updated: 2026-08-16_
>
> **Paste from here.** Positioning and the programme facts are in [`positioning.md`](./positioning.md); the form mechanics are in [`how-to-apply.md`](./how-to-apply.md)._
>
> ⚠️ **Status: drafted against the published selection criteria, NOT yet mapped to the live form.** The question set sits behind an account gate. When the account is open, read every question and every dropdown option off the page, record them verbatim here, and re-cut these blocks to the real labels and character limits. **The form is the spec** ([`../how-to-draft-the-next-one.md`](../how-to-draft-the-next-one.md) Part 2).

## Numbers in this draft, re-derived 2026-08-16

| Figure | Value | Command |
| --- | --- | --- |
| Commits | **5,280** | `git rev-list --count origin/main` |
| Migrations | **545** | `ls supabase/migrations/*.sql \| wc -l` |
| First real commit | **2026-06-02** | `git log --reverse --format='%ad' --date=short \| sed -n 2p` |

**Say "5,000+ commits and 545 migrations since 2 June 2026."** The `+` form ages safely and the date cannot be argued with. **Re-pull on the day of submit.**

> **Rule 6 of the doctrine, and this draft obeys it:** the commit number lives in the *progress* answer and the "agents write the code" fact lives in the *team* answer, and **they never touch**. When those two sit in one paragraph the number reads as measuring the agents rather than the founder.

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

If the field is generous:

```
Supaprod is the operating system a product team runs on when AI agents do the
work: it tells you what to build from your own signals and market, writes the
spec, builds it, ships it behind gates a person controls, then checks what
actually happened and feeds that back into the next call.
```

If the field is under 50 characters:

```
Cursor for PMs, the whole product org.
```

> 38 characters. CF's reviewers are "investors, venture managers, and Tech experts", which is the audience the answer bank rules the Cursor anchor **for**. If you would rather not lean on another company's name, use `Agents that know what to build, ship it, warn you` (49). **Never close a short line on "remember"**: it describes where data sits, and the third layer guides.

## 4. Sector / category

```
B2B Deep Tech, AI
```

> ⚠️ **Scroll the whole dropdown before choosing** (founder correction 9). A visible option is not the best option, and this cost a wrong selection once. If both "AI" and "Enterprise Software" exist, take **AI**: their page names AI, Cybersecurity and Robotics.

## 5. Stage

```
Users
```

> **Not "Prototype", and not "MVP" if a higher rung exists.** Founder correction 6: *"Prototype as a stage is too modest."* The product runs end to end and a reviewer can open a login.

---

## 6. What problem are you solving?

```
Engineers got agents and shipping got roughly ten times cheaper. Deciding what
to build did not get cheaper, so it became the bottleneck, and the product side
got chatbots that draft and wait.

Underneath that is a dignity problem before it is an efficiency problem.
Somebody still has to stand up in a room and explain why a call was made, and
by the time they are asked the evidence is buried in a Slack thread from four
months ago. I was that person for close to a decade, at India's national space
agency, at Infineon in Munich, and most recently on an AI platform that 200+
financial institutions in 70+ countries build on. The job underneath was
identical every time: be the glue across a dozen tools, then re-answer from
memory why something was decided.

Agents make this worse rather than better, because now a human answers for
calls they did not fully make.
```

## 7. What does your product do? (the detail answer)

```
Supaprod runs the whole product lifecycle as one governed loop instead of six
disconnected tools. It has three layers and they are built in that order.

01. The director. It reads your user feedback, product data, competitors and
market and tells you what is worth building, with the evidence attached. It
argues against the weak bets before you commit. This is the layer nobody else
sells.

02. The operating system. It writes the spec, plans the work, builds it, and
opens a real pull request behind a merge gate no agent can cross. Our own
engine runs frontier models through one runtime chokepoint, so a better model
is a same-day drop-in at zero engineering cost, and your team runs no second
coding tool for it.

03. The brain. Every decision is written down with the forecast that justified
it, frozen at the moment of the call, and then graded against what actually
shipped. This is the layer that compounds: it warns you before you repeat
something that did not work, and it re-ranks the next bets from outcomes it has
already seen.

Two things in the build are worth naming to a technical reviewer. Agents earn
autonomy from their own track record, the way you extend trust to a new
colleague rather than handing over the keys on day one, with floors on merge,
revert and delegate that nothing can override. And there is an audit trail on
every agent action with one-key rollback on anything an agent produced.
```

> **Door, then body, then brain, in that order, every time.** The brain is the crescendo and never the opening. The first SkyDeck draft opened five answers on the moat and never told a reader what the product was for; five answers had to be reordered.

## 8. Why is this innovative / what is defensible about it?

```
I will concede two of the three answers people usually give here, because we
tested them and they did not hold.

Storage is not the moat. Any vendor can store decisions. And the record of what
happened is not the moat either, which is a correction I made in August after a
full read of the market falsified it. Causes survive in Slack, email and call
recordings, and they have been reconstructed after the fact twice on the public
record. One of those was Vercel's COO rebuilding the reasoning behind a lost
deal with an agent he built in two days.

What survived that test is narrower and harder. It is the forecast captured at
decision time: what a team believed would happen, recorded before the outcome
was known. That is not an artifact. It leaves no trace anywhere unless
something captured it at the moment of the call, so a competitor holding every
byte of your raw data still cannot reconstruct it. Time is the ingredient no
model release shortcuts.

Two things support it. Product judgment has no fast oracle. It cannot be
compile-tested, which is why code generation commoditised in eighteen months
and deciding what to build did not. And the seat has to be independent: no
frontier lab inside its own chat app, and no suite vendor, can be the honest
judge across its competitors' tools or publish its own miss record.
```

> This is the application's **one self-correction beat**. It names what was believed, what refuted it, and what survived. A founder who corrects himself on the record reads as someone who checks. **Do not add a second.**

## 9. Market size and scalability

```
TAM is over $300B a year. That is the product management work budget rather
than a software line item: roughly 2.6M product managers at about $115K loaded
cost. The work is already paid for today, as headcount.

SAM is $2B growing to $12B a year, from launch pricing to value pricing, across
two motions. Transform: 650K existing product teams. Create: 500K new
agent-native organisations by 2030.

SOM is about $47M ARR, the agent-native tenth at launch pricing.

The tailwind is that building got commoditised faster than anyone modelled.
Devin went from $37M to $492M ARR in twelve months and Cursor is at $2B. As
that happens the ratio of product people to engineers inverts and one person
ends up directing a fleet. Coinbase already runs one-person teams managing
fleets of agents. The scarce resource stops being the building and becomes
deciding what to build, and being able to show the call was right.
```

## 10. Who are your competitors?

```
Nobody runs the whole loop, so my real competitor is the stitched stack. A
product manager runs discovery in one tool, writes the spec in a second,
designs in a third, hands code to agents in a fourth, ships behind flags in a
fifth, and reads the result in a sixth. Every one of those is excellent at its
own step. The tax is not the tools, it is the seams between them: context is
re-entered at every handoff, and by the third one the reasoning behind the call
is gone.

The space is moving and that is a good sign rather than a bad one. Samepage
raised a $4.85M seed to surface signals for product leaders. Brief captures
decision context for agents. Productboard shipped Spark. Notion launched Ship
OS, which promises customer feedback through to a merged pull request. Every
one of them validates the loop and every one stops one step short: they
surface, draft, or dispatch, and none of them checks the shipped outcome
against the decision that caused it and feeds that back.

That gap is structural rather than a missing feature. Grading a decision needs
the call and its outcome inside one system, and a handoff is precisely where
those two get separated.

The second competitor is smaller and it wins more deals: a folder of markdown
files. The argument for it is real, that lower-level tools are more
agent-friendly because agents drive them better. They are right about the
premise and wrong about the conclusion. An agent can write into a Notion page
or a GitHub issue. It cannot write a decision carrying its evidence, its
author, a verdict slot and a human gate into either. Low-level tools are
agent-writable but not agent-governable, and that seam opens the moment a
second person or a fleet of agents touches the work.
```

> **Never write "we have no competitors"** on any form, ever. It is the most common red flag in this exact question, it is not true, and it claims without a mechanism.

---

## 11. Tell us about the team. Why are you solo?

**This is the answer that decides this application.** CF's stated bar is *"at least one tech and one business co-founder"* with exceptions for exceptional solo founders.

```
Solo, and I carry both halves of what you are asking for rather than one of
them.

The technical half: a BE in Mechatronics Engineering, and I started out at 21
building satellite communication systems at ISRO, India's national space
agency, for its Moon and Mars missions, where the hardware launches once and
there is no patch release and no second attempt. The systems I worked on flew.

The business half: an MBA from TUM School of Management, then close to a decade
in product. Semiconductors at Infineon Technologies in Munich, and most
recently senior AI product manager at Intellect, a BFSI technology OEM, leading
product on the AI platform that 200+ financial institutions across 70+
countries use to build their own AI products.

On the code: no non-founder has touched a line of this codebase. I direct all
of it and agents write it. I read and review every line, everything goes
through typecheck, build and a review pass before merge, and a separate
reviewer independent of the agents that build audits it for security.

I am open to a co-founder who shares the vision and adds a perspective I do not
have. I am not waiting for one.
```

> **The commit number is deliberately not in this answer.** It goes in the progress answer below. Rule 6: the two facts must never sit in one paragraph.

## 12. How far along are you? / Traction

```
Supaprod is in private beta, invite-only. Signup closed on 2026-08-07 and entry
is by invite code. Public launch is mid-September 2026.

The product runs end to end today, and your reviewers can open a login and walk
the whole loop themselves in about ten minutes: agents read the signals, argue
down the weak bets, come back with a call and its evidence, write the spec,
build it, open the pull request, and a person merges.

The build behind that is 5,000+ commits and 545 migrations since 2 June 2026,
directed and reviewed by one person. Both reproduce from a single command.

I am user zero and I mean it literally. Supaprod's own roadmap runs inside
Supaprod, so every call I have made building this is on the record with the
evidence behind it, and I am the most demanding user it has.

Login: lantern@supaprod.ai / Supaprod!Lantern2026 at https://supaprod.ai
One-page brief: https://supaprod.ai/brief
```

> **Never volunteer the zero.** No form asks for it, it reads as candour to us and as weakness to a reader, and the Berkeley SkyDeck application is the last one that carries it. **If a required field asks for a revenue or user number, give the true figure.** Leave optional ones blank: a blank says less than a number we cannot support.

## 13. Why Campus Founders, and why Heilbronn?

```
Three reasons, and two of them are about Germany rather than about money.

I am coming back rather than arriving. My MBA is from TUM School of Management
and I was a product manager at Infineon Technologies in Munich. I have built
product inside German engineering culture, I know how a German industrial buyer
evaluates, and Baden-Wuerttemberg is not an unfamiliar market to me.

Your B2B deep-tech focus is where this product is actually sold. My last role
was on an AI platform that 200+ financial institutions in 70+ countries build
on, and the first question a regulated buyer asks about agents is never what
the model can do. It is who answers for what it did. Supaprod is built around
that question, and the German industrial and B2B corporates in the Heilbronn
ecosystem feel agent governance as a live problem today rather than a future
one.

And the third reason is the thing I am genuinely short of. The honest risk in
this company is distribution, not the product. I built the engine before
opening the doors, which for a product whose value comes from decisions graded
against outcomes was the right sequence, because an empty system teaches you
nothing. It was also the wrong sequence for learning fast, and it means I have
had far less contact with users than someone eleven weeks in should have.
September is when that inverts. Twelve weeks of structured customer discovery
with access to German B2B corporates is a direct answer to the specific gap I
have, which is why this programme and not a generic one.
```

> **This is the application's one vulnerability beat**, placed where the form invites it and converted immediately into the reason for applying to this specific programme. **Do not add a second admission anywhere.** The Conviction draft had three and was rejected whole.

## 14. Are you able to attend in person in Heilbronn, 30.09 to 18.12.2026?

```
Yes. I am leaving my job and relocating for this company regardless of how any
application goes, so Heilbronn for the twelve weeks is a scheduling question
rather than a decision. I would be there full-time for the duration.
```

> **No "if accepted, I will".** Rule 3, unconditional commitment: the programme changes the speed and the zip code, never the decision. Contingency reads as neediness.

## 15. What would you use the €25,000 for?

```
Compute and model spend is the largest line by a distance, because the product
runs frontier models through its own runtime on every mission, and usage scales
with how much work the agents do rather than with headcount.

After that, incorporation, and the design-partner motion during the programme:
getting the product in front of German B2B teams and paying for the tooling
that supports it.
```

## 16. Legal entity

```
Not yet incorporated. I will incorporate in whichever jurisdiction the
programme requires.
```

> Founder ruling: **do not incorporate an Indian Pvt Ltd** to unlock anything. The flip to a Delaware parent later runs through FEMA and RBI share-swap rules and routinely costs more in time, legal fees and tax than the money is worth. CF does not require an entity to apply; it gates the money moving.

## 17. Funding raised to date

```
None.
```

> Answer truthfully if the field is required. **If it is optional, leave it blank** (founder correction 5).

---

## The pre-submit checklist

Run all of it. Every line is here because skipping it cost something.

- [ ] **Re-pull the numbers.** `git rev-list --count origin/main` and `ls supabase/migrations/*.sql | wc -l`. They aged 14% in ten days once and shipped a 20% understatement of our own velocity.
- [ ] **Read every question off the live form** and record it verbatim above before finalising. Re-cut every block to the real character limits.
- [ ] **Scroll every dropdown to the bottom** before choosing.
- [ ] **Test `lantern@supaprod.ai` in incognito** on supaprod.ai, and confirm the approval queue is armed. Pitch invites land 24 to 26 August, inside the runway, but confirm rather than assume.
- [ ] **Em-dash sweep.** No em dashes, no en dashes, no invisible Unicode in anything pasted.
- [ ] **Banned-word sweep**: leverage, utilize, robust, seamless, cutting-edge, revolutionize, game-changer, unlock, empower, supercharge, "in today's fast-paced world", "delve", "testament to".
- [ ] **Brain-verb sweep**: no "remembers", "stores" or "logs" as verbs of the brain, anywhere. It claims less than the product delivers.
- [ ] **Never claim accumulated learning in the present tense.** The honest form is that the loop is wired and proven and begins accruing on first real use.
- [ ] **Count the vulnerability beats.** There must be exactly one, in answer 13.
- [ ] **Count the self-corrections.** Exactly one, in answer 8.
- [ ] **Check the Rule 6 adjacency**: the commit count (answer 12) and "agents write it" (answer 11) must not have drifted into the same field.
- [ ] **Repetition sweep.** No block appears near-verbatim in two fields. This recurs because each answer looks fine on its own; it was caught at YC and then again at SkyDeck.
- [ ] **Read every answer aloud. Delete any sentence that stays true with a competitor's name swapped in.**
- [ ] **Verify each answer persisted** by reloading and reading back the exact element by name, never by content-matching across the page.
- [ ] **The founder submits.** Never submit an application.
- [ ] **Log it** in [`../README.md`](../README.md), [`../what-to-apply-for-next.md`](../what-to-apply-for-next.md), and the Notion Application Board.
- [ ] **Update [`../../founder-answer-playbook.md`](../../founder-answer-playbook.md) in this same session.** It is updated after every application, while it is fresh.
