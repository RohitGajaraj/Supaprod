# Launch listing copy

> _Created: 2026-08-07 · Last updated: 2026-08-07_

**Every asset here is paste-ready.** Product Hunt, Hacker News, Indie Hackers, Reddit, Bluesky and Mastodon. Copy the block, do not compose a new one, because two listings that disagree with each other is how a true story starts reading like a false one.

**This file is copy only.** Where to post, when, and the specific mechanism each room uses to punish self promotion is [`community-plan.md`](./community-plan.md), and it wins on any timing or etiquette conflict. Positioning canon is the root [`../../README.md`](../../README.md). Boilerplate, founder bio, quotes and assets are [`press-kit.md`](./press-kit.md). The founder story these posts point at is [`../pitch/founder-story.md`](../pitch/founder-story.md).

**Standing rule, unchanged: nothing outward sends without the founder's approval.** Each post is a separate approval, not one blanket yes.

---

## 0. The five rules every block below was written under

Read these before pasting anything. Four of them are the reason a specific sentence you might expect to find here is missing.

### 0.1 There is no traction, and none is invented

| The zero | Stated plainly |
| --- | --- |
| External users | **Zero organic outside users.** Eight accounts exist, all founder or internal. |
| Waitlist | **Zero waitlist signups have ever been recorded**, against 1,427 landing visits since 2026-07-15. |
| Revenue and customers | None. Billing is built, tested and deliberately switched off. |
| Funding | None to announce. |
| Awards, badges, rankings | None held. |
| Testimonials, logos, "used by" | None exist and none may be implied. |

Traffic is not traction. A visit count offered as demand is the same fabrication in a softer wrapper, so no listing below cites the 1,427.

### 0.2 Connector honesty, verified against code on 2026-08-07

`src/lib/connectors/providers/index.server.ts` maps twenty providers to an adapter. **Nine have a real ingest adapter. Eleven are `stubAdapter`,** which means the OAuth connect succeeds and nothing is read.

| State | Providers |
| --- | --- |
| **Real adapter, may be named as working** | GitHub, Intercom, Stripe, Slack, Zendesk, HubSpot, Salesforce, Canny, Productboard |
| **Stub, must never be named as available** | Linear, Notion, Google Docs, Google Calendar, Google Tasks, Microsoft Outlook, Gmail, Microsoft Mail, Figma, Jira, Firecrawl |

**GitHub is the one path proven end to end in production**, which is why every listing below leads with GitHub rather than with a count. Naming twenty providers and shipping nine is the single most checkable lie available to a reader with an afternoon, and Product Hunt commenters check.

### 0.3 The brain learns, then guides

Never "remembers", "stores", "logs", "archives" or "searchable history" of the brain, on any public surface. Those describe a filing cabinet, which any vendor can build, and they claim less than the product delivers. If a moderator, editor or commenter restates the claim as storage, correct it.

### 0.4 `/proof` is seeded and labelled as examples, so it is not evidence

Founder ruling 2026-08-07: the seeded proof surfaces stay, visibly labelled as examples. **Do not cite `/proof` as evidence in any listing or reply.** Two surfaces are real, need no signup, and a stranger can verify them in under a minute:

| Surface | What a stranger gets | Why it is the one to link |
| --- | --- | --- |
| **supaprod.ai/p/teardown** | Paste a PRD or a one-line product bet, get a receipted Critic red-team: the verdict, the risks, what would kill it, and what you cannot prove yet. No account, no connectors. | The reader supplies the input, so nothing about the result is staged. Rate limited. |
| **supaprod.ai/demo** | A read-only walkthrough of a real workspace: one teardown, the decision record, and one mission trace end to end, including a mission that **stopped short** and says so. | Every data call on the page is GET only. There is nothing on it a visitor can change. |

### 0.5 Gates that must be green before any of this posts

From [`community-plan.md`](./community-plan.md). These are account facts, not copy problems, and no rewrite fixes them.

| Room | Gate | State |
| --- | --- | --- |
| Product Hunt | Maker profile active 30+ days. Accounts created within 72 hours of a launch are shadow filtered. | `[FOUNDER TO FILL: the Product Hunt maker account username and its creation date. The tracker lists the account as not started.]` |
| Hacker News | A personal account with weeks of normal comment history. New or zero-karma accounts are auto removed within minutes, and a company-named account is soft killed. | `[FOUNDER TO FILL: personal Hacker News username, account age and karma.]` |
| Reddit | Roughly 200 to 300 comment karma and two to three weeks of participation, per sub. | `[FOUNDER TO FILL: personal Reddit username, account age and comment karma. The brand handle u/supaprodhq must never be the account that posts.]` |
| Bluesky, Mastodon | The handles are **not claimed yet** per [`press-kit.md`](./press-kit.md) §3. | `[FOUNDER TO FILL: claim supaprod.bsky.social and the Mastodon handle, or delete §5 from the launch plan.]` |

> **One open founder decision that changes every date, not a placeholder.** [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §Now records a soft launch **this week** on Product Hunt and X, by founder direction on 2026-08-06. [`press-kit.md`](./press-kit.md) and the root [`../../README.md`](../../README.md) both say **mid-September 2026 on every external surface**. Both cannot be printed. Nothing in this file states a launch date, so every block holds either way, but the conflict has to be resolved before a listing is scheduled and before any reply quotes a date.

---

## 1. Product Hunt

### 1.1 Tagline, 60 characters maximum

**Primary, and it is the ratified string** from [`brand-ops/social-accounts.md`](./brand-ops/social-accounts.md) §3. Use this unless the founder rules otherwise.

```
The product team that learns what actually worked
```

`49 characters.`

**Three alternates.** Read all four aloud on submit day and pick one; do not blend them.

```
Agents that own outcomes. Not just output.
```

`42 characters. The live landing hero sub, verbatim. Strongest if the gallery leads with the mission trace, because the slide then proves the sentence.`

```
Tells you what to build, then grades the call
```

`45 characters. The plainest verb-first reading of the loop. Best if the audience skews product rather than technical.`

```
For product managers who ship with agents
```

`52 characters. The category line. Safest, least differentiated, and the right pick only if the description is doing the work.`

**Banned in this field, and in the category picker too:** "AI PM tool", "AI product manager", "Cursor for PMs", "copilot", "assistant", and any adjective standing in for a number.

### 1.2 Description, 260 characters maximum

**Ratified, from [`brand-ops/social-accounts.md`](./brand-ops/social-accounts.md) §3.**

```
Supaprod runs the whole product lifecycle across seven stations. Agents do the product work end to end and you make the calls. Then it joins those calls to the outcomes you actually got, so the next decision starts with evidence rather than a blank page.
```

`254 characters.`

### 1.3 The long description

```
Engineers got agents. Product people got chatbots. Supaprod is the operating
system that closes that gap.

It runs as one loop instead of fifteen tools. Signals land from the sources you
already use. The queue of what is worth building is ranked and re-ranked. A
Critic red-teams every candidate before you see it. The spec gets written with
citations. Our own engine writes the code in your repository and opens a real
pull request. Release, gates, what customers see. Then the outcome is settled
with a verdict, written back against the decision that caused it.

That last step is the whole product. A settled outcome changes what you are
shown next, so the system gets better at your judgment the longer you run it.
A loop that ends in a report is a dashboard. This one ends by changing what you
are shown, which is why it is an operating system and not another view of your
backlog.

It is a route, not a conveyor. Work visits only the stations it needs and can
enter at any of them. An existing product getting one feature starts at the
spec and never sees discovery. A skipped station is recorded with its reason,
never silently dropped.

Three things stay yours no matter how good the agents get: merge, revert,
delegate. Policy is set in advance and does not block. Permission is asked in
the moment and does. If every step passes to a human for sign-off you do not
have agents, you have a queue with a nicer interface.

Two things you can check right now without an account:

- supaprod.ai/p/teardown : paste a product bet, get a receipted red-team.
- supaprod.ai/demo : a read-only walkthrough of a real workspace, including one
  mission that stopped short and says so.

What is honestly true today. Supaprod has no outside users, no revenue and no
customers. Billing is built, tested and switched off. The demo runs on my own
workspace on purpose: a seeded demo would prove the interface works, and this
proves the loop works. Nine sources have a working ingest adapter today, GitHub,
Intercom, Stripe, Slack, Zendesk, HubSpot, Salesforce, Canny and Productboard,
and GitHub is the one proven end to end in production. Eleven more connect but
do not read anything yet, and they are named in the comments rather than hidden.

Free tier: three sources, read only, on a monthly credit allowance. Paid tiers
remove the cap on sources, and only the team tier lets an agent write back into
your tools. That boundary is enforced in code, not in the price list.
```

**Two sentences that must survive any edit.** The zero-users paragraph, and the connector counts. If a form is too short to carry both, cut a benefit sentence, never one of those.

### 1.4 First comment from the maker

**Post within one minute of the listing going live.** This is the highest-leverage text on the page: Product Hunt readers reward the paragraph most founders delete, which here is the fourth one.

**Paste verbatim.** This is the ratified 250-word block from [`../pitch/founder-story.md`](../pitch/founder-story.md), written for exactly this slot.

```
Hi Product Hunt. I am Rohit. Supaprod is the thing I wanted for ten years and
never had.

I spent close to a decade as the person between product and engineering.
Satellite communication systems at ISRO, semiconductors at Infineon in Munich,
then the AI platform at Intellect that financial institutions across seventy
countries build on. Different industries, identical job underneath: carry context
across a dozen tools, and answer why we decided something from memory, months
later, with the evidence buried in a thread nobody can find.

Then agents got good enough to do the building, not just draft it. Code has a
compiler, so it commoditized fast. Product judgment has no compiler. Feedback on
a bet lands in weeks. So the expensive half of the job is the half nobody
automated.

Supaprod is one loop instead of fifteen tools. It reads your signals and ranks
what is worth doing, red teams the bet before you see it, writes the spec, builds
it, and opens a real pull request a human still has to merge. Then it settles
what actually happened against the decision that caused it, and that changes what
you get shown next.

What I will not claim: no outside users, no revenue. Billing is built and
switched off. I am user zero, my own workspace is the demo, and that is both
deliberate and the honest limit of what I can prove today.

I am in this thread all day. Tell me where it breaks.
```

**Do not add to this comment:** a discount code, an upvote ask, a founder photo collage, or a second comment restating the same thing. Soliciting upvotes is Product Hunt's number one removal cause, and the ask is unnecessary because the paragraph already earns the reply.

**The follow-up, posted as a reply to your own first comment about twenty minutes in.** It is new information rather than a restatement, and it takes the most checkable objection off the table before a commenter finds it.

```
One thing worth saying before anyone has to dig for it: the integrations are not
all live. Nine sources have a working adapter today, GitHub, Intercom, Stripe,
Slack, Zendesk, HubSpot, Salesforce, Canny and Productboard. GitHub is the one
I would stake the demo on, because it is the only one proven end to end in
production. Eleven more, including Linear, Jira, Notion, Figma and the Google
and Microsoft suites, will complete the OAuth handshake and then read nothing.
That is a stub, and I would rather you hear the word from me.

If the one you need is in the second list, tell me which and I will tell you
honestly where it sits rather than what quarter I hope it lands in.
```

### 1.5 Gallery shot list, five slides

**Order is evidence before claims.** Each slide is a real surface that exists today. No mockups, no composites, no numbers pasted over a screenshot.

> **Every one of these has to be captured fresh.** `docs/screenshots/` is gitignored, so no product screenshot is committed to this repository and none can be pulled from it. Product Hunt gallery frames are 1270x760; the branded frame is `docs/growth/branding/social/producthunt-gallery-dark-1270x760@2x.png`.

| # | The shot | Surface | Caption to burn in | Why it is in this position |
| --- | --- | --- | --- | --- |
| **1** | The result of a real teardown on the ordinary example bet: the verdict, the risks, what would kill it, and what you cannot prove yet, all visible in one frame. | `/p/teardown` | *Paste any product bet. This is what comes back.* | The only artifact on the page a stranger can reproduce in sixty seconds with no account, so it converts skepticism instead of asking for trust. Use the built-in example bet, which is deliberately weak: a Critic that waved through a good bet would prove nothing. |
| **2** | One mission trace end to end, every station and every agent's work visible, **including the mission that stopped short** with its red "stopped" state on screen. | `/demo`, mission trace section | *One mission, station by station. This one stopped before it finished, and the product shows you the stop.* | The failure path is the highest-trust frame available. Skeptics judge the error path, not the win path, and shipping a screenshot of your own product failing is a thing a fabricated listing cannot do. |
| **3** | The decision record with an outcome settled against the decision that caused it, the verdict and the decision visible in the same frame. | `/demo`, track record section | *The call, and what actually happened, on the same row. That is what re-ranks the next one.* | This is the claim. Slides 1 and 2 earn the right to make it; this one makes it. |
| **4** | The human boundary: the approval surface showing merge, revert and delegate pinned to a human, with a tool set to review rather than auto. | Engine Room, Safety, Controls | *Agents run on their own inside boundaries you set first. Merge, revert and delegate never leave you.* | The instant objection to "agents write code in your repo" is safety. Answering it in the gallery means the comment thread starts one objection further along. |
| **5** | The connect surface with GitHub connected and real signals landed from it, with the honest state of the others visible rather than cropped out. | Integrations | *GitHub, connected and reading. Nine sources have a working adapter today, and we say which.* | Naming the one that works beats claiming twenty. It also pre-answers the connector question, which is the objection most likely to be checked by a commenter with an afternoon. |

**What is deliberately not in the gallery:** `/proof`, because it is seeded and labelled as examples and a seeded surface in a gallery reads as a fabricated one; any frame carrying a user count, a revenue figure or a logo wall; and the pricing table, which belongs on the page it lives on and wins nobody a vote.

### 1.6 Topics and categories

**Select, in this order of confidence:**

```
Artificial Intelligence
Productivity
SaaS
```

**Two candidates to add if the picker offers them on submit day**, verified live rather than from memory, because Product Hunt's topic list changes:

```
Product Management
Developer Tools
```

**Do not select:** "AI Assistant", "No-Code", "Chatbots", "Note taking". The ban on "AI PM tool" framing applies to the category picker exactly as it applies to copy, because a category is a claim about what kind of thing this is.

### 1.7 The launch-day comment-reply playbook

**Posture, before any individual answer.** Reply inside fifteen minutes through the 6am to 10am PT peak. Answer plainly, concede fast, never argue with a skeptic, and never let a reply run longer than the comment it answers. A defensive founder in a launch thread is the most reliably punished behaviour on the platform, and the community's own top threads call it out by name.

**The eight most likely objections, and the honest answer to each.**

---

**1. "Isn't this just a wrapper on GPT or Claude?"**

```
Partly, and the part that is a wrapper is the part I would lose first. Ranking
what to build is a capability, not an asset: a frontier model with the same
inputs gets most of the way there, and closer with every release. I say that
because it is what makes the other claim credible.

What is not a wrapper is the loop and what it produces. Every model call in this
product goes through one function, so budgets, guardrails, cost tracking,
caching and output sanitising are implemented once and cannot be bypassed. A new
AI surface without a budget is a type error, not an incident. And the thing that
compounds is your decisions joined to your outcomes, labelled over time. No model
has that, because it is not something you can buy or scrape. It is produced as a
byproduct of running the loop.
```

---

**2. "How is this different from Linear, Notion or Jira?"**

```
They dispatch work. They do not verify whether the bet paid off, and that
verification is the entire company.

I am not trying to be a better tracker and I would lose that fight. The
difference is one row: when something ships, a verdict is settled against the
decision that caused it, and that verdict changes what you are shown next. Your
tracker knows the ticket closed. It does not know whether closing it was right,
and it has no way to find out, because it never held the decision.

Honest version of the threat: Notion shipped feedback-to-a-merged-PR copy in
July 2026 and they have distribution I do not. What they do not have is the
forecast — what a team believed would happen, captured before the outcome was
known. Everything else about a decision can be reconstructed after the fact from
Slack and call recordings. That one thing cannot, because it is not an artifact
unless something wrote it down at the time.
```

---

**3. "How many people are using it? Who are your customers?"**

```
Nobody, and none. Zero organic outside users, zero revenue, zero customers.
Eight accounts exist and all of them are mine or internal testing. Billing is
built, tested and switched off.

That is a decision rather than an accident. The whole claim is that the loop
closes, and you cannot validate that with half a loop: you get feedback on a
demo instead of on the thesis. So the engine got finished before the doors
opened. Today is the doors opening.
```

*Do not attach a silver lining in the same breath. Say the number, then stop. It lands ten times harder as an answer than as a defence.*

---

**4. "It writes code in my repository? What stops it doing damage?"**

```
Four things, and none of them is trust.

Policy is set in advance and does not block. Permission is asked in the moment
and does. Agents draft, propose and build on their own, and nothing irreversible
happens without a person.

Merge, revert and delegate stay human, always, and no amount of earned autonomy
lowers those floors.

Tenancy is enforced in the database on membership, not in application code, so a
bug in a route cannot reach another workspace's data.

And a skipped station is recorded with its reason rather than silently dropped,
so the trail of what an agent chose not to do exists too.

The failure mode I actually built this against is the opposite one. Early on I
approved everything my own agents did. It felt responsible. What it did was turn
me into a queue, approving pull requests at two in the morning that I had not
really read, which is worse than not checking, because now my name is on it.
```

---

**5. "Which integrations actually work?"**

```
Nine have a working adapter today: GitHub, Intercom, Stripe, Slack, Zendesk,
HubSpot, Salesforce, Canny and Productboard. GitHub is the one I would stake a
demo on, because it is the only one proven end to end in production.

Eleven more will complete the OAuth handshake and then read nothing: Linear,
Notion, Google Docs, Google Calendar, Google Tasks, Microsoft Outlook, Gmail,
Microsoft Mail, Figma, Jira and Firecrawl. Those are stubs and I am calling them
stubs.

If the one you need is in the second list, say which and I will tell you where it
actually sits rather than name a quarter I cannot defend.
```

---

**6. "So it is an AI PRD writer. ChatPRD already exists."**

```
Drafting is one station out of seven, and it is the cheap half. It commoditized
first, which is why every chat tab can do it now.

The expensive half is deciding what deserves a spec at all, and then finding out
whether you were right. That has no fast oracle. Code compiles in seconds so an
agent can iterate against it. "Was this bet correct" comes back in weeks to
quarters, which is exactly why nobody automated it.

If Supaprod only wrote specs it would be a feature, and I would agree with you.
```

---

**7. "What happens to my data? Can I get it out?"**

```
Full export in open formats, any time. A record that compounds is only a
retention argument if leaving is genuinely possible, and buyers can tell the
difference.

Every source you connect is read only on the free and single-seat paid tiers.
Not as a paywall trick: the product is not permitted to post, comment or move a
ticket on those tiers, and that is enforced in code as an entitlement that
throws, not as a setting somebody can flip. Write-back is a genuinely different
risk posture, so it sits with the tier that also carries roles, approval lanes
and an audit trail.

Enterprise governance, meaning SSO, full audit and roles, is architected and not
built. I am not going to pretend otherwise.
```

---

**8. "Solo founder, no funding, no users. Why would I build on this?"**

```
Today, do not build on it. Try it on one bet and tell me whether the teardown was
sharper than what you would have written yourself. That is a fifteen-minute
question and it costs you nothing, and it is the only thing I am actually asking
for.

What I can tell you about durability rather than promise: your data exports in
open formats any time, the read-only default means nothing in your stack has
been changed by it, and the honest gap list is published rather than discovered.
On 2026-08-02 I found nine separately shipped features doing nothing in
production. All nine passed the full test suite, two had unit tests asserting the
defect as the contract, and none of them was found by reading code. They were
found by querying the live database, and a detector now exists so the tenth is
caught automatically. That is not a comfortable story, and it is the reason
anything I tell you is shipped can be checked.
```

---

**The two things to refuse rather than soften, if they come up:** a revenue date, because it depends on which of the first cohort converts and that is unknown, and a user projection. "I will not give you a number I cannot defend" is a strong answer and costs nothing.

---

## 2. Hacker News

> **Read [`community-plan.md`](./community-plan.md) §2 before this section is used.** The Show HN gate is an account gate, not a copy gate. A Show HN from a fresh or company-named account is removed within minutes, and vote-ring detection shadowbans the **domain**, not just the account, so one round of asked-for upvotes can cost supaprod.ai its ability to be submitted at all.

### 2.1 Show HN title

HN convention: the `Show HN:` prefix, a plain description of the thing, no marketing adjectives, no exclamation, no title case, under 80 characters, and it must point at something a reader can actually use.

**Primary:**

```
Show HN: Supaprod, an agent loop for product work with an track record
```

`72 characters.`

**Alternate 1**, and the better pick if the submission points at `/p/teardown` rather than the home page, because it names the thing you can use in the first four words:

```
Show HN: A no-signup red-team for your product bet, with the evidence
```

`65 characters.`

**Alternate 2**, and the sharpest statement of the actual mechanism, at the cost of reading slightly more like a claim:

```
Show HN: Agents run the product loop and the outcome re-ranks the next bet
```

`74 characters.`

**Do not submit** a title containing "AI-powered", "revolutionary", "the future of", "I built", an emoji, or the word "team" used as a product noun.

### 2.2 Body text

Short, technical, no marketing voice. HN penalises a body that reads like a landing page harder than it penalises a short one.

```
Supaprod runs the product lifecycle as one loop: signals in, a ranked queue of
bets, a Critic that red-teams each candidate, a cited spec, code written into
the repo behind a human merge gate, then the outcome settled with a verdict and
written back against the decision that caused it. That verdict re-ranks what the
first two stations surface next.

Two things you can try without an account:

https://supaprod.ai/p/teardown  paste a product bet, get a receipted red-team
https://supaprod.ai/demo        a read-only walkthrough of a real workspace

Stack: TanStack Start (React 19, Vite), Tailwind v4, deployed as a single
Cloudflare Worker. Supabase Postgres with RLS keyed on membership, pgvector,
pg_cron driving the mission engine. Model-agnostic, every model call routed
through one server function so budget, guardrails, caching and cost tracking
cannot be bypassed.

No outside users, no revenue, billing switched off. The demo runs on my own
workspace on purpose. Details on what is real and what is scaffolded in a
comment.
```

### 2.3 First comment, the technical detail

Post it immediately after submitting. This is where HN readers decide whether you are worth arguing with.

```
Detail, since the post is short.

Stack. TanStack Start on React 19 and Vite, Tailwind v4, shadcn/ui, built to a
single Cloudflare Worker. Supabase Postgres underneath: RLS keyed on membership
rather than on a tenant column, pgvector for retrieval, pg_cron advancing
missions on a schedule. 1,544 source files, 491 migrations, 478 test files.
Last full gate: typecheck clean, 8,086 tests passing on 2026-08-06.

The one design decision I would defend hardest. Every model call in the product
goes through a single server function. Budget, credit accounting, cache,
pre-guard, retrieval, provider routing, post-guard, output sanitising and logging
all live there, once, and there is no second path. Adding an AI surface requires
a valid call-surface literal, so an unbudgeted or unguarded call is a type error
rather than an incident. It is boring and it is the reason autonomy is safe
enough to ship.

Tenancy is account, then workspace, then product, enforced by RLS on membership
in the database. Not in application code. A bug in a route cannot reach another
workspace's rows, which is the property you need before you let an agent run
on its own at all.

Agent boundaries. Policy is resolved in advance and does not block; permission is
asked in the moment and does. Merge, revert and delegate are pinned to a human
and no earned autonomy lowers them. A skipped station is written to the record
with its reason rather than silently omitted, so the trail includes what an agent
chose not to do.

What is real:
- The loop runs. Missions advance on cron through the stations, the Critic
  red-teams candidates, specs get written with citations, the build engine opens
  real pull requests, and a merge goes through the product's own gated path.
- Nine connectors have a working ingest adapter: GitHub, Intercom, Stripe, Slack,
  Zendesk, HubSpot, Salesforce, Canny, Productboard. GitHub is the only one I
  would call proven end to end in production.
- /p/teardown and /demo are both real and both zero-auth. /demo is GET-only, with
  no mutation path on the page at all.

What is scaffolded or not finished, and I would rather you heard it here:
- Eleven connectors are stubs. The OAuth handshake completes and nothing is read:
  Linear, Notion, Google Docs, Google Calendar, Google Tasks, Microsoft Outlook,
  Gmail, Microsoft Mail, Figma, Jira, Firecrawl.
- The agent memory layer is scoped to the user who wrote it, not the workspace.
  A successor inherits the record and not the compounded recall. So the accurate
  phrase is "the record travels", never "the memory travels".
- The write that settles an outcome into that precedent pool is built and thinly
  exercised. Every statement it makes has been executed against production inside
  a rolled-back transaction and accepted, and a workspace-isolation bug was found
  and pinned by a test doing exactly that. It has not yet completed end to end
  through the UI on a non-sample workspace. The code is built; the proof is
  pending, and I am not going to describe that as done.
- Enterprise governance, SSO, full audit, roles: architected, not built.
- One code path still passes an explicit null spend cap where every other writer
  resolves a ceiling. It reads as deliberate and it is on the list.
- Nothing tests the Discover ranking and formatting modules together, so a format
  helper change can reorder the queue with 212 unit cases green.

The thing that shaped how I verify anything. On 2026-08-02 I found nine
separately shipped features doing nothing in production. All nine passed
typecheck and the full suite. Two had unit tests asserting the defect as the
contract. None was found by reading code: they were found by querying the live
database, and there is now a detector so the tenth is caught automatically. A
green test is evidence the code does what the test says and nothing more.

Zero outside users, zero revenue, billing built and switched off, eight accounts
all mine or internal. Solo. Happy to go deeper on any of it.
```

> **Verify before pasting:** the file, migration and test counts, and the pass total, are as of 2026-08-06 and 2026-08-07. Re-run `find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l`, `ls supabase/migrations | wc -l` and `bun test` on the morning of submission and correct the numbers. A stale count on HN is read as carelessness about numbers generally, and it is the cheapest possible own goal.

### 2.4 Timing, relative to the Product Hunt launch

**Do not run them on the same day.** Five reasons, in the order they cost you the most:

1. **You cannot be in two comment threads at once, and both punish absence.** Product Hunt needs replies inside fifteen minutes through a four-hour peak. Hacker News front-page position decays with unanswered comments. Splitting the founder between them makes both worse than either alone.
2. **The gates are different and Hacker News's is the harder one.** The demo gate is already satisfied by `/demo` and `/p/teardown`. The account gate is not, and it takes weeks of ordinary participation to clear. Product Hunt can go before that clears. Hacker News cannot.
3. **A visible Product Hunt launch on the same day reads as coordinated marketing**, which is the exact frame HN downweights, and commenters will say so in the first ten replies.
4. **A same-day traffic spike is a flag risk you do not need.** If anything about the pattern trips vote-ring detection, the penalty lands on the domain, and you lose the Hacker News option entirely rather than one post.
5. **The Product Hunt thread produces the objections that make the Hacker News post better.** Every question asked on launch day is free research for the body and the first comment, and rewriting them afterwards costs nothing.

**The recommendation:** Product Hunt first. Show HN **no earlier than seven days later**, and only when the personal account gate is green. Submit Tuesday, Wednesday or Thursday, roughly 8am to 10am Eastern, which is when the front page turns over and a good post can still climb. Clear the whole day afterwards.

**Never, in any channel, including a private message:** ask anyone to upvote. Asking the warm list to "take a look and comment honestly" is allowed. Asking for a vote costs the domain.

### 2.5 The three things most likely to get flamed, and the pre-emptive answer

These belong in the first comment or in the first reply, not held back. The pattern that works on HN is to make the criticism yourself, accurately, before somebody else makes it approximately.

---

**Flame 1: "This is a thin wrapper on frontier models with a lot of words around it."**

```
Two of the three layers are a wrapper and I will say which. Ranking what to build
is a capability, not an asset: a frontier model with the same inputs gets most of
the way there and closer with every release. The loop, the gates and the track record
are real engineering and still buildable by anyone with money and distribution;
they buy a lead measured in quarters, not a position.

The part I claim is defensible is the third one, and it is not a model property.
It needs a specific team's decisions joined to that team's outcomes, labelled
over time. The part of that a competitor cannot rebuild is what the team
believed would happen before they found out. Everything else survives in chat
logs and call recordings, and an agent can reconstruct it in an afternoon; a
forecast leaves no trace unless something captured it at the moment of the
call. It also gets more valuable as models commoditize:
when everyone reasons equally well, the differentiator is whose context is
better.

If you think that argument is wrong, that is the argument I want to have.
```

---

**Flame 2: "Zero users, and every number in your demo is your own data. This proves nothing."**

```
Correct on both, and I would rather concede it than dress it.

The demo is my own workspace deliberately. A seeded demo would prove the
interface renders. This proves the loop runs, which is the only thing I can prove
with zero outside users, and it is exactly the limit of what I am claiming.

The one thing that is not my data: /p/teardown takes your input. You paste your
own bet and the Critic red-teams it with the evidence. If that output is not sharper
than what you would have written yourself, the rest of this does not matter and
you should say so in this thread.
```

---

**Flame 3: "Autonomous agents writing to my repo and my SaaS tools is a security nightmare."**

```
It would be, unwired. What is actually wired:

Tenancy is enforced by RLS on membership in the database, not in application
code, so a route bug cannot cross a workspace boundary.

Every source is read only on the free and single-seat tiers. Not a paywall trick:
it is an entitlement that throws when a plan attempts an operation it does not
permit, so an agent on a read-only plan cannot write to your board even if
something asks it to. Write-back only exists on the tier that also carries roles,
approval lanes and an audit trail.

Merge, revert and delegate are pinned to a human and no earned autonomy lowers
them. Agents draft, propose and build on their own, and nothing irreversible
happens without a person.

What is not built: SSO, full audit and roles are architected and not shipped. If
your bar is enterprise governance today, this is not ready for you and I would
rather say that than take the meeting.
```

---

## 3. Indie Hackers

**The room where "solo founder, zero users, here is what that cost" is the expected genre rather than a confession.** Lowest etiquette risk on the whole plan. Post around D0 to D2 and answer every comment. A promotional version gets no comments, and a post with no comments is a wasted slot.

**Title:**

```
I finished the whole loop before I let anyone in. Here is what that cost me.
```

**Body:**

```
I am a solo founder. I have been building for a little over two months and I
launched this week with zero outside users, zero revenue, and billing built and
deliberately switched off. That was a decision, and it is the one I want to talk
about, because I think it was right and I am no longer certain.

The product is Supaprod. It runs product work as one loop instead of fifteen
tools: signals land, bets get ranked, a Critic red-teams each one before I see
it, the spec gets written, our engine writes the code and opens a real pull
request I still have to merge, and then the outcome is settled with a verdict
written back against the decision that caused it. That verdict changes what I am
shown next.

Here is the decision. The entire claim is that the loop closes. You cannot
validate a closed loop with half a loop, because what you get back is feedback on
a demo instead of feedback on the thesis. So I built the whole thing first.

What that cost, honestly:

Two months of building against my own judgment with no outside correction. Every
prioritisation call I made was mine, checked by nobody, and I will not know which
of them were wrong for weeks.

Zero waitlist signups. Not a poor conversion rate. Zero, ever. The landing page
had been asking people to wait for something that was actually open, which is a
mistake I only found by querying the database rather than by reading the page.

An honest gap list I now have to publish rather than discover. Eleven of twenty
connectors complete an OAuth handshake and then read nothing. The memory layer is
scoped to the user who wrote it rather than the workspace. Enterprise governance
is architected and not built. None of that would have shipped as a surprise if
someone outside had been using it.

The thing I got that I would not trade:

On 2026-08-02 I found nine separately shipped features doing nothing in
production. Every one passed typecheck and the full test suite. Two had unit
tests asserting the defect as the contract. None of them was found by reading
code: they were found by querying the live database. There is a detector now, so
the tenth gets caught automatically.

I could only find that because I was the user. If nine dead features had been
sitting under a real customer's workspace for a month, that is not a lesson, that
is a refund.

What I am asking for is not a signup. Try one thing and tell me it is bad:
supaprod.ai/p/teardown takes a product bet you actually have and red-teams it
with the evidence. No account, no connectors, about ninety seconds. If the output is
not sharper than what you would have written yourself, say so here and I will
take that more seriously than any signup this week produces.

Ask me anything, including what is not built.
```

---

## 4. Reddit

> **Reddit is a week-two channel at the absolute earliest, and only if account seasoning starts today.** AutoMod removes zero-participation accounts before a human reads them, and a removal burns the account's standing in that sub afterwards. Karma is not a score to farm, it is proof that a human has been in the room.

### 4.1 The structure every Reddit post uses

Five parts, in this order. Deviating from the order is what gets a post read as an ad.

1. **Disclosure in the first line.** "Full disclosure, I built this." It is the single most effective removal and backlash shield available, and it costs one sentence.
2. **The problem, in the reader's words, not the product's.** No brand name in this paragraph.
3. **What it does, in three sentences maximum**, plain verbs, no adjectives standing in for numbers.
4. **The honest limit, volunteered.** Zero outside users, and the connector stub count if the sub is technical. This paragraph is why the post gets comments instead of downvotes.
5. **One ask, and it is for a reaction rather than a signup.** A link a stranger can use with no account.

**Three standing rules.** Never post the same content to two subs on the same day. Read the sub's own rules page in full before your first comment there, because the sidebar is authoritative over anything written in this file. Post in the designated thread first, always.

### 4.2 The per-subreddit rules

| Sub | Where the post goes | Format rule | The specific mechanism that punishes you |
| --- | --- | --- | --- |
| **r/ProductManagement** | The **Friday Show and Tell** thread, as a comment. Not a top-level post. | Disclosure first line. No link in the post body until you have commented in the sub. | The 90/10 participation ratio, enforced socially in a sub this size, and a removal the sub does not forget. |
| **r/SideProject** | Top level, and it is the friendliest room on this list. | Title must be `[Project name] - [description]`. | Low formal risk. High indifference risk: a post that reads like a press release simply gets no comments. |
| **r/startups** | The **Share Your Startup** sticky, or the weekly **Feedback Thread**. | Never a top-level launch post. | Top-level self promotion is removed by rule, not by judgment. |
| **r/AI_Agents** | The **weekly project thread**. | A stated 1-in-10 self-promotion ratio: nine genuine comments for every one post of your own. | The ratio is published, so violating it is not a grey area and gets treated accordingly. |
| **r/SaaS** | Top level is permitted, and the room is saturated. | Lead with the number that is unflattering. A "zero users on purpose" post outperforms a launch post here by a wide margin. | Downvotes rather than removal, which costs the account's future reach in the sub. |
| **r/ClaudeAI** | Top level, and only the technical angle: the chokepoint, the boundary model, the merge gate. | The build is the post. The product is the footnote. | Informal and sharp. A pitch marks you as someone who did not read the room. |
| **r/ChatGPT** | **Never.** | Its rule 3 bans posts advertising another LLM service. We are the banned category. | Removal, and it is deserved. |

### 4.3 Paste-ready: r/SideProject

**Title:**

```
Supaprod - agents run the whole product loop, and the outcome grades the decision that caused it
```

**Body:**

```
Full disclosure, I built this. Solo, about two months, and I have zero outside
users today.

The problem I kept hitting: the tools that hold your work do not hold your
reasons. Your tracker knows the ticket closed. It does not know whether closing
it was the right call, and it cannot find out, because it never held the
decision. So six months later somebody asks why you shipped that thing and you
answer from memory.

Supaprod runs product work as one loop instead of fifteen tools. Signals land,
bets get ranked, a Critic red-teams each one before you see it, the spec gets
written, the engine writes code in the repo and opens a pull request a human
still has to merge. Then the outcome is settled with a verdict, written back
against the decision that caused it, and that changes what you get shown next.

The honest state: no outside users, no revenue, billing built and switched off.
Nine of twenty connectors have a working adapter, GitHub being the one proven end
to end. The other eleven complete an OAuth handshake and read nothing, and I call
them stubs rather than "coming soon".

One thing to try, no account and about ninety seconds: supaprod.ai/p/teardown.
Paste a product bet you actually have and the Critic red-teams it with the evidence.
If the output is worse than what you would have written yourself, I would rather
hear that here than not hear it.
```

### 4.4 Paste-ready: r/ProductManagement Friday Show and Tell

**Post as a comment in the Friday thread. No top-level post, and no link before the second paragraph.**

```
Full disclosure, I built this, and I have no users yet.

The thing I could never fix in ten years of product jobs: every reason I ever had
was scattered. A thread somewhere, a call nobody recorded, a doc nobody linked.
Someone asks in October why we shipped that thing in March, you know there was a
good reason, and you cannot find it. So you defend a guess.

I built a loop where the decision, the alternatives weighed against it, and what
actually happened all stay in one place, and where the outcome re-ranks what you
are shown next rather than ending in a report. Agents do the work end to end
inside boundaries set in advance. You make the calls.

Where I would genuinely like this group's read, because I cannot answer it from
my own workspace: is "why did we decide this" actually a problem you have, or is
it a problem I have because of the specific jobs I held? I have zero outside
users, so every answer I have is mine.

If it is easier to react to a thing than to a question, supaprod.ai/p/teardown
red-teams a product bet you paste in, no account needed, and tells you what it
cannot prove. That output is the part I most want torn apart.
```

### 4.5 Paste-ready: r/AI_Agents weekly project thread

```
Supaprod. Agents run a product lifecycle end to end and the outcome is settled
back against the decision that caused it. Solo build, zero outside users.

The parts this sub will actually care about:

Every model call goes through one server function. Budget, credits, cache,
pre-guard, retrieval, provider routing, post-guard, sanitising, logging, all in
one place with no second path. Adding an AI surface without a budget is a type
error rather than an incident.

Policy versus permission. Policy resolves in advance and does not block.
Permission is asked in the moment and does. If everything passes to a human for
sign-off you do not have agents, you have a queue with a nicer interface. Merge,
revert and delegate stay human and no earned autonomy lowers those floors.

Tenancy is RLS on membership in the database, not checks in application code,
which is the precondition for letting anything run on their own.

Not finished, and worth saying in this room: the memory layer is scoped to the
user who wrote it rather than the workspace, so a successor inherits the record
and not the compounded recall. Eleven of twenty connectors are stubs that
complete OAuth and read nothing.

Read-only walkthrough, no account: supaprod.ai/demo
```

---

## 5. Bluesky and Mastodon

> **Neither handle is claimed yet** per [`press-kit.md`](./press-kit.md) §3. Claim `supaprod.bsky.social` and the Mastodon handle before scheduling, or drop this section from the plan.

**Bluesky, 283 characters against a 300 limit.**

```
Supaprod is open to try with no signup.

Paste a product bet and the Critic red-teams it with the evidence:
supaprod.ai/p/teardown

Or watch one real mission run end to end:
supaprod.ai/demo

Zero outside users so far. The demo is my own workspace, deliberately. Tell me where it breaks.
```

**Mastodon, 484 characters against a 500 limit.** One or two hashtags maximum, and only if the instance culture uses them.

```
Supaprod is where product decisions live when agents do the work. It tells you what to build, builds and ships it, then learns what actually worked, so the next call arrives with evidence.

Two things you can try now, no account needed:

A receipted red-team of any product bet: supaprod.ai/p/teardown
One real mission end to end, including one that stopped short: supaprod.ai/demo

Zero outside users so far, and the demo runs on my own workspace on purpose. Tell me where it breaks.
```

**Attach** the OG card, `docs/growth/branding/social/og-dark-1200x630@2x.png`, and write real alt text rather than the filename.

---

## 6. Placeholders

**Each of these is a fact only the founder holds, and each one gates a post above.** None can be filled from this repository, and inventing any of them would be the exact failure this file exists to prevent.

| # | Placeholder | Gates |
| --- | --- | --- |
| 1 | `[FOUNDER TO FILL: Product Hunt maker account username and creation date.]` | Whether the listing can be self-hunted at all, since accounts under 30 days old are shadow filtered |
| 2 | `[FOUNDER TO FILL: personal Hacker News username, account age and karma.]` | Whether §2 is postable in the first 60 days |
| 3 | `[FOUNDER TO FILL: personal Reddit username, account age and comment karma.]` | Every block in §4 |
| 4 | `[FOUNDER TO FILL: are supaprod.bsky.social and the Mastodon handle claimed, and under which email?]` | §5 |
| 5 | `[FOUNDER TO FILL: five gallery screenshots captured fresh from the live product and approved. docs/screenshots/ is gitignored, so nothing can be pulled from the repo.]` | §1.5, and therefore the Product Hunt listing |
| 6 | `[FOUNDER TO FILL: a founder photograph for the Product Hunt maker profile. None exists anywhere in this repository.]` | The maker profile, per [`press-kit.md`](./press-kit.md) §4 |
| 7 | `[FOUNDER TO FILL: is the launch date this week or mid-September 2026? The tracker and the canon disagree, and no reply may quote a date until it is settled.]` | Scheduling, and any comment reply that mentions availability |

**Three things to re-pull rather than trust**, on the morning of any post that carries them:

- The file, migration and test counts in §2.3. Verified 2026-08-07 and they change with the next merge.
- The connector split in §0.2. Verified against `src/lib/connectors/providers/index.server.ts` on 2026-08-07, and it changes the day an adapter lands.
- **Every duration.** The first commit is 2026-06-03, so "a little over two months" in §3 and "about two months" in §4.3 are correct on 2026-08-07 and wrong later. Recompute at paste time. A reader who spots a stale duration reads it as carelessness about numbers generally.

---

## Related

| You need | Go to |
| --- | --- |
| Where to post, when, and how each room punishes self promotion | [`community-plan.md`](./community-plan.md) |
| The verified per-platform rules and the reach research | [`01-channel-playbooks.md`](./01-channel-playbooks.md) |
| Boilerplate, founder bio, approved quotes, asset paths, what Supaprod is not | [`press-kit.md`](./press-kit.md) |
| The founder story at 100, 250 and 500 words | [`../pitch/founder-story.md`](../pitch/founder-story.md) |
| The earlier Show HN and Product Hunt drafts this file supersedes | [`../pitch/launch-assets.md`](../pitch/launch-assets.md) |
| Ratified per-platform profile copy | [`brand-ops/social-accounts.md`](./brand-ops/social-accounts.md) §3 |
| Where new objections get written down after launch day | [`../pitch/founder-answer-playbook.md`](../pitch/founder-answer-playbook.md) · [`../pitch/qa-bank.md`](../pitch/qa-bank.md) |
| The launch board these posts answer to | [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) |
| The positioning canon every block is cut from | [`../../README.md`](../../README.md) |
