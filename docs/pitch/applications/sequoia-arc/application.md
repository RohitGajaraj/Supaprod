# Sequoia Arc — the answers, NOT ready to paste

> ## 🛑 RE-SCREENED 2026-08-16. The application is NOT OPEN, and this draft breaks two rulings.
>
> **The form is not live.** `sequoiacap.com/arc/apply` renders a **completely blank page**: nav, empty body, footer, 246 characters of content, no form and no closure notice. Verified by direct browser render and screenshot; the URL returns HTTP 200, so the page has been emptied rather than removed. **The 2026-08-17 deadline below is stale and was never checked against Sequoia's own page.**
>
> **Arc is a bi-annual open call.** Sequoia's own posts show a February close for the spring cohort and an early-August close for the autumn cohort, so the autumn 2026 window has most likely already shut. **Re-check the apply page itself, never an aggregator.**
>
> ### Three defects in the text below. Fix them before this is ever reused.
>
> | Defect | Where | The ruling it breaks |
> | --- | --- | --- |
> | *"No outside users and no revenue. I want that first rather than buried."* | Answer 4, first line | **Never volunteer the zero** (founder ruling 2026-08-13). Berkeley SkyDeck was supposed to be the last application carrying it |
> | *"Supaprod's own roadmap runs inside Supaprod"* | Answer 4 | **Rule 6.** It does not survive its own database: 344 missions against 27 completed |
> | 5,131 commits · 532 migrations | Answers 3 and 4 | **Stale.** 5,321 and 545 as of 2026-08-16 |
>
> ### One open question, and it is NOT a blocker
>
> Third-party guides and a Sequoia post from February 2024 say the open call is for founders in **the Americas and Europe/UK**, which would exclude a Bangalore-headquartered company. **Sequoia's own Arc page states no geography restriction anywhere in its five-question FAQ.** Screening ruling: only the programme's own page can justify a skip, quoted. **Resolve this when the form reopens.** The relocation to Germany would settle it either way.
>
> _Created: 2026-08-13 · ~~Deadline 2026-08-17, 11:59pm PT~~ · `https://www.sequoiacap.com/arc/apply/`_
>
> ⚠️ **The form sits behind a login and its exact fields are not public.** These answers are written against the five questions Arc is known to ask, at a length that trims cleanly. **Open the form first, then cut each block to its stated limit.** If a field asks something not covered here, pull from [`../answer-bank.md`](../answer-bank.md) rather than composing fresh.
>
> **Numbers, pulled 2026-08-13: 5,000+ commits, 530+ migrations, ten weeks (exact: 5,131 / 532).** Re-run `git rev-list --count origin/main` and `ls supabase/migrations/*.sql | wc -l` the hour you submit.
>
> **No em dash appears in any block below.** Nothing sends without the founder's approval.

---

## Company

```
Supaprod
```

## URL

```
https://supaprod.ai
```

## One line

```
Supaprod is where product decisions live when agents do the work.
```

---

## 1. What are you building?

```
Supaprod is where a product org runs when agents do the work. You connect the
places your product signals already live, Slack, Intercom, Zendesk, Canny,
Productboard, Salesforce, HubSpot, Stripe and GitHub. The agents read them,
cluster them into opportunities, argue against the weak bets before you see
them, draft the spec with its evidence attached, and hand the build to coding
agents. You make the calls that matter and nothing merges without you.

Underneath sits the part that makes it a company rather than a feature. Every
agent action lands in an audit trail and every decision carries the evidence
it was made on. When agents do the work, being able to answer what was decided,
on what, and who signed off stops being a nicety. It becomes the control that
lets you let them run at all.

And one thing in that record cannot be reconstructed afterwards. At the moment
you commit a decision, Supaprod takes what you expect to happen, how you will
know, and by when. Those three fields freeze on write and a database trigger
blocks every later edit. When the date passes, the call is graded against what
shipped.
```

_190 words. Trim from the bottom: the connector list goes first, the third paragraph never goes._

## 2. Why now?

```
Building got cheap inside eighteen months, so the bottleneck moved. 82% of
product people report AI already makes them measurably more productive, and
over the same stretch burnout went from 44.7% to 55.7% with the top fear being
expected to do more for the same pay. Speed is solved. Nobody needs more output.

A practitioner named the gap better than I can: PMs got faster at shipping but
did not get better at defending why, and the judgment gap got exposed. When
delivery accelerates and clarity does not, AI accelerates confusion.

The buying seat is being created in the same window. Instagram replaced its
roughly thirteen-person canonical team with pods of four to six engineers led
by what Mosseri calls product staff, one person absorbing design, data and
research. One person is now accountable for calls that used to be split across
five specialists, and that seat has no system of record.
```

_150 words._

## 3. Why are you the person to build it?

```
Close to a decade of being the person who had to defend the call. Satellite
communication systems at ISRO, where hardware launches once and there is no
patch release. Then product at Infineon. Most recently senior AI product at
Intellect, a BFSI technology OEM, building the platform that 200+ financial
institutions use to ship their own AI products, in a domain where nobody
accepts "the model decided" as an answer.

In every one of those roles the real work was being the glue across a dozen
tools and a dozen stakeholders, and re-answering why we decided something from
memory. Supaprod started as the thing I built to stop doing that, and it kept
growing.

The other half is that I can now build it. Over the last two years I went from
writing specs and waiting on engineers to shipping production software by
directing agents. Ten weeks, solo, 5,000+ commits and 530+ database migrations,
and the product runs end to end.
```

_160 words. Every claim here holds up on a reference call, which is the point._

## 4. What traction do you have?

```
No outside users and no revenue. I want that first rather than buried.

What exists instead is a working product and a login you can open. Supaprod's
own roadmap runs inside Supaprod: it plans the work, its agents write code and
open real pull requests behind a merge gate no agent crosses, and every call
along the way sits in the audit trail with its evidence. That proves the
product functions end to end before I ask anyone to trust it, which is a
different claim from proving anyone wants it, and I am not going to blur them.

Ten weeks of build: 5,000+ commits and 530+ database migrations, a public film of
the product working at https://supaprod.ai/film. Public launch mid-September.

One thing I would rather tell you than have you find. I was quoting three
product numbers I was proud of. Re-checking them, the query separating my demo
data from real work matched on the shape of a workspace id, and sample
workspaces get ordinary ids. The real count was zero. I shipped a column so the
two can never blur again.
```

_180 words. The correction stays. It is the strongest paragraph and it pre-empts the only diligence question that could hurt._

## 5. Who is on the team?

```
Me, solo. Everything is built in house by me with AI agents: design,
development, coding, testing, and the analysis of what people do with it. I
direct the work and make every call. No non founder has touched it.

I am open to a cofounder who adds a perspective I do not have, and I am not
waiting on one to build. Supaprod is happening full time regardless of the
outcome here.
```

_70 words._

---

## Likely additional fields, drafted

### How do you make money, and how big can this get?

```
Free tier runs the full loop on a small credit budget. Paid is a workspace
subscription plus usage credits for agent runs, so revenue tracks how much work
the agents do rather than headcount. Land with founders and PMs on small teams,
who feel this hardest and can start without procurement. Expand into teams and
enterprises, where the audit trail is the line they actually budget for. That
budget exists today, split across a tracker, a docs tool, a spec tool, a coding
agent and status meetings.

The ladder: roughly 2.6M product managers at about $115K loaded is the work
being paid for as headcount. The reachable slice is existing product teams plus
the agent-native orgs forming now. Pricing gets its first real test in beta.
```

### Who are your competitors?

```
The real competitor is a folder. Teams hand-roll this in markdown and scripts,
and it works until a second person or a fleet of agents touches it. That is the
moment we sell into. Every do-it-yourself success I found is a single operator
in a single context; every failure is multi-person or multi-agent governance.

The named neighbours are close and getting closer. Notion shipped Ship OS free
in July. Atlassian launched Product Collection in May, positioned around better
decisions. Linear hands issues to coding agents. ChatPRD drafts specs for 100k+
PMs. Every one of them makes doing the work faster.

None of them records whether the call was right, and none captures what the
team expected before it found out. Atlassian links feedback to decisions
retrospectively. That gap stays open, because everything else about a decision
survives in chat logs and an agent can rebuild it in an afternoon. Someone did,
in two days.

I also do not build the code generator. Cursor and the labs are in a capital
fight there and the models keep absorbing that layer. Supaprod decides what is
worth building, dispatches to whichever generator wins, and governs the result.
```

### What is the biggest risk?

```
That teams keep hand-rolling it. Simple tools are genuinely easier for agents
to drive, and the reflex on engineering forums is to commit your agent files
and move on. The counter is not that our tool beats a spreadsheet. It is that
an agent can write into a Notion page or a GitHub issue but cannot write a
decision with its evidence, its author, a verdict slot and a human gate into
either. Low-level tools are agent-writable and not agent-governable.

The honest second risk is that I have no outside users yet, so the wedge is
argued from the market's own writing rather than from my own customers. Closing
that is the entire next quarter.
```

---

## Access for a reviewer

**Login:** allocate `meridian@supaprod.ai` from [`../../../operations/demo-credentials.md`](../../../operations/demo-credentials.md) and record it on the board. **One login per program, never shared** — a second reviewer on a shared workspace finds an approval queue the first one already cleared, which deletes the most important beat in the demo.

**No account needed:** `https://supaprod.ai/film` (2:22) and `https://supaprod.ai/p/teardown`, where the Critic red-teams a real product bet in about twenty seconds. **Do not describe the teardown as evidence of the loop.** It is one model call with a forced output schema, and it demonstrates the quality bar of a single agent's critique, nothing more.

## Before submitting

1. Re-run both numbers. They appear in answers 3 and 4 and must agree.
2. Open the form and cut every block to its stated limit, from the bottom up.
3. Allocate and test the demo login in incognito.
4. Read every answer aloud. Delete any sentence that stays true with a competitor's name swapped in.
5. Log the submission on the Notion board and in [`../README.md`](../README.md), and update [`../../founder-answer-playbook.md`](../../founder-answer-playbook.md) in the same session.

## Related

- [`positioning.md`](./positioning.md) — what Arc selects for and the angle in
- [`../answer-bank.md`](../answer-bank.md) · [`../positioning-doctrine.md`](../positioning-doctrine.md)
