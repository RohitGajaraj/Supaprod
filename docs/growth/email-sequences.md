# Email sequences

> _Created: 2026-08-07 · Status: **DRAFT COPY ONLY. Nothing here can be sent today.**_

## ⛔ Read this before anything else on this page

**There is no ESP key configured and the sending domain is unverified. Nobody who signs up can currently be emailed.**

That is [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) §A row A2, and it gates A3 (no confirmation email on any path), A4 (no admin view of the list) and A5 (no sequence capability at all). The tracker's own instruction is blunt and correct: **do not build a drip before A2, because an unsendable sequence is a spreadsheet.**

So this file is **ready-to-send copy, not a live sequence.** Every email below is written, approved-shaped and pasteable. None of it is scheduled, wired, or attached to a trigger. When A2 closes (Resend key plus a verified `supaprod.ai`), this file is the content and somebody still has to build the triggers.

**The second thing to know before writing a word of your own:**

| Measured on production, 2026-08-07 | Number |
| --- | --- |
| `landing_visit` events since 2026-07-15 | 1,427 |
| Real waitlist signups, ever | **0** |
| Users on the product | 8, all founder or internal |
| Revenue | none, billing is built and switched off |

**The nurture sequence therefore has zero recipients today.** Every line below is written for a stranger who has never heard of us and has nobody to be impressed by. No copy in this file assumes a warm audience, references a community, counts subscribers, or implies anybody else is already here. That is not modesty. It is the only accurate posture available, and a reader who checks will find it holds.

---

## 1. The claims these emails are allowed to make

Everything asserted below is checkable. This table is the allowlist, and the never-list underneath it is binding.

| Claim used in the copy | Where it is verified |
| --- | --- |
| Supaprod tells you what to build, builds it, ships it, and learns from the outcome so it guides the next call | [`../../README.md`](../../README.md), the three layers |
| Agents draft, propose and build unattended, and nothing irreversible happens without a person | `src/routes/index.tsx` `DESC`, and the `/security` body |
| `/demo` is a real workspace you can open without signing up | Tracker §F5 |
| `/p/teardown` is a real Critic teardown you can run without signing up | Tracker §F5, and it now server-renders |
| GitHub is the one connector that works end to end today | Tracker, founder ruling 1 of 2026-08-07 |
| The Free plan is $0 and takes no card | `src/routes/pricing.tsx` |
| The receipts shown publicly are labelled examples | Founder ruling 2 of 2026-08-07 |
| Eight users, all founder or internal. No revenue | [`../../README.md`](../../README.md), "Where this actually is" |
| The record travels to the next person. The compounded recall does not, yet | [`../../README.md`](../../README.md), the `agent_memory` known limit |

**Never, in any email on this page:**

- Any user, customer, subscriber or waitlist count. No "join 500 builders", no "1,400 people have looked at this", no "hundreds on the list". The visit number is ours to read, never theirs to be impressed by.
- Any testimonial, quote or logo. We have none, and an invented one is unrecoverable.
- The words **remembers**, **stores**, **logs**, **archive** or **searchable history** of the brain. It **learns, then guides**.
- Em dashes or en dashes anywhere. Commas, colons and full stops.
- Buzzwords from [`../conventions/ui-voice.md`](../conventions/ui-voice.md): seamless, leverage, empower, robust, unlock, delve, elevate, supercharge, cutting-edge, and the rest of that list.
- "Cursor for PMs", "AI PM tool", any YC mention, any commit or feature count.
- A promise that a person approves every gate. Agents settle some verdicts on their own, by design, and a reader would find the counter-example inside a week.
- A connector we cannot honour. Linear, Jira, Notion, Figma, Google and Microsoft are registered but stubbed. **Name GitHub or name none.**

## 2. Tokens, sender identity and the date problem

| Token | Fill with |
| --- | --- |
| `{{first_name}}` | falls back to nothing, and every sentence below reads correctly with it empty |
| `{{launch_date}}` | see the note directly below |
| `{{teardown_url}}` | `https://supaprod.ai/p/teardown` |
| `{{demo_url}}` | `https://supaprod.ai/demo` |
| `{{signup_url}}` | `https://supaprod.ai/signup` |

**From:** `Rohit at Supaprod <rohit@supaprod.ai>` · **Reply-to:** `founder@supaprod.ai` · **Support in the footer:** `hello@supaprod.ai`, which already routes.

**The launch date is contested in canon and must not be hard-coded from memory.** [`../../README.md`](../../README.md) says mid-September 2026 on every external surface. [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §0 says the soft launch is this week, by the founder's direction on 2026-08-06, and explicitly supersedes the September date. Use `{{launch_date}}` and let the founder set it at send time. Do not resolve this by picking one.

**Sending domain, when A2 is done.** Lifecycle and transactional email can share the verified root domain. Cold outreach must not: [`00-launch-operating-manual.md`](./00-launch-operating-manual.md) §1 puts cold email on a separate warmed domain for exactly this reason, and mixing them puts the product's own password resets behind whatever the cold list does to the reputation.

---

## 3. Sequence A: the waitlist nurture, five emails

**Trigger:** a row lands in `waitlist_signups`. **Audience:** somebody who left an email address on a landing page and has never used the product. **Rule for the whole sequence: one link per email.** A second link halves the first one and gives a cold domain a spam signal it does not need.

### A1. Welcome, sent within five minutes of signup

**Subject:** You are on the list for Supaprod
**Alt 1:** Thanks for joining. Here is what happens next.
**Alt 2:** What you just signed up for

**Preheader:** What it is, when you get in, and one thing you can do right now.

**Timing:** immediate. A waitlist that never acknowledges reads as broken even when the row is safely captured, which is tracker row A3.

**Body:**

> Hi {{first_name}},
>
> You are on the list. It is Supaprod, said with an A: SOO-pa-prod.
>
> Here is the short version of what you signed up for. Supaprod is the agentic-first operating system for product teams. It tells you what to build, builds and ships it, then learns what actually worked, so the next call arrives with evidence rather than a blank page. Agents do the product work end to end. You make the calls. Nothing irreversible happens without you.
>
> We open on {{launch_date}} and you will get one email that day with your way in.
>
> You do not have to wait for the interesting part. Point the Critic at a bet you believe in and it will red-team it, with the evidence it used. No account, no card, nothing to install.
>
> **[Red-team one of your bets]({{teardown_url}})**
>
> If it finds nothing useful, reply and tell me. That is a more useful email for me than a good one.
>
> Rohit
> Founder, Supaprod

**CTA:** one. The teardown.

---

### A2. The problem, sent two days after A1

**Subject:** Engineers got agents. Product people got chatbots.
**Alt 1:** Building stopped being the hard part
**Alt 2:** The expensive half of product work is the half nobody automated

**Preheader:** Code got a fast oracle. Judgment did not.

**Timing:** day 2.

**Body:**

> {{first_name}}, here is the argument underneath Supaprod, in one email.
>
> Code compiles in seconds. That is a fast oracle, so an agent can iterate against it, so building gets cheaper every quarter. Your engineers felt that first and they felt it hard.
>
> "What should we build, and was that right" has no fast oracle. The feedback lands in weeks or quarters, long after the decision that caused it has scrolled out of view. So the expensive half of product work is the half nobody automated, and it is also the half that does not get cheaper when the next model ships.
>
> Meanwhile the job itself is smeared across fifteen tools. Talk to users in one, decide in another, spec in a third, build in a fourth, launch in a fifth, and carry the context across every seam yourself. The cost of switching and re-explaining now exceeds the cost of the work.
>
> A point tool makes one seam faster and leaves you as the glue. To remove the glue, one system has to own the whole arc, and agents have to run it rather than assist it.
>
> That is what we built. What is the bet you are least sure about right now? Hit reply and tell me in one line. I read every one of these myself.
>
> Rohit

**CTA:** one, and it is a reply rather than a link. Replies are the strongest positive signal a young sending domain can generate, and each one is a discovery interview we currently have no other way to get.

---

### A3. The mechanism, sent five days after A1

**Subject:** What happens after you ship
**Alt 1:** The part that compounds
**Alt 2:** How a settled outcome changes what you see next

**Preheader:** Most tools end in a report. This one ends by changing the next ranking.

**Timing:** day 5.

**Body:**

> {{first_name}},
>
> Most product tools stop at the ship. Supaprod's whole design is what happens after.
>
> The loop runs as one route. Signals land from your sources and cluster into themes. A ranked queue of bets gets red-teamed by the Critic before you ever see it. The spec is written with its citations attached. Our engine writes the code in your repo, behind a merge gate. It ships.
>
> Then the outcome gets settled with a verdict, and the verdict is written back against the decision that caused it. That is the step that matters: it re-ranks what you are shown next time. The loop does not end in a dashboard. It ends by changing what appears in front of you.
>
> Which is why the brain is not a filing cabinet. It learns from what your bets actually did, and then it guides: it tells you what is right next time, and warns you before you repeat what went wrong. Any vendor can hold your decisions. Nobody else holds your decisions joined to your outcomes, labelled over time, because that only exists as a byproduct of running the loop.
>
> Work also skips what it does not need. An existing product getting one feature starts at the spec and never goes near discovery. A skipped step is recorded with its reason, not silently dropped.
>
> **[See the whole loop](https://supaprod.ai/product)**
>
> Rohit

**CTA:** one. The product page.

---

### A4. The proof position, sent nine days after A1

This is the email most companies do not send, and it is the reason the rest of the sequence is believable. **It contains no traction because there is none.**

**Subject:** What we can prove, and what we cannot yet
**Alt 1:** No customer logos in this email
**Alt 2:** The honest state of Supaprod, before you get in

**Preheader:** Eight users, all of them us. Here is what that means for you.

**Timing:** day 9.

**Body:**

> {{first_name}},
>
> This is the email where a pre-launch company usually shows you logos. I do not have any, so here is the real state of things instead.
>
> Eight people use Supaprod. All eight are me or internal. There is no revenue: billing is built, tested and deliberately switched off. Nobody outside has run a quarter on it, so nobody can tell you what a quarter on it feels like. The receipts on our site are labelled as examples for that exact reason.
>
> That was a decision rather than an accident. A half-built loop teaches you the wrong thing. The whole claim is that the loop closes, and you cannot test that with a partial one: you get feedback on a demo instead of on the thesis. The loop closes now, which is why the doors open now.
>
> Two more things you would find out anyway, so you should hear them from me.
>
> One: GitHub is the connector that works end to end today. Others are registered and not yet real. If your repo is not on GitHub, wait for us.
>
> Two: when a person leaves your team, the record they built travels to whoever picks it up. The compounded recall does not travel yet, it is still scoped to the person who created it. The record travels. The memory does not, yet.
>
> What I can offer instead of proof is access. The full workspace is open without an account, with real work in it. Go and try to break it.
>
> **[Open the demo workspace]({{demo_url}})**
>
> Rohit

**CTA:** one. The demo. Proof they can check beats proof we assert.

---

### A5. Launch CTA, sent 24 hours before the doors open

**Subject:** Supaprod opens tomorrow
**Alt 1:** Your way in, tomorrow
**Alt 2:** One email tomorrow, then I will leave you alone

**Preheader:** Free plan, no card, and one thing to have ready.

**Timing:** 24 hours before `{{launch_date}}`.

**Body:**

> {{first_name}},
>
> Supaprod opens tomorrow. This is the heads-up so tomorrow's email is short.
>
> Two things worth doing tonight, both of them one minute.
>
> Have one bet in mind. Not a roadmap, one thing you are about to build and are not certain about. That is what you point Supaprod at first, and it is the fastest way to find out whether any of this is real for you.
>
> Have your GitHub handy if you want the build half. That is the connector that works end to end today.
>
> The Free plan is $0 and takes no card, so there is nothing to decide tomorrow beyond whether to open the tab.
>
> **[See what you get on the free plan](https://supaprod.ai/pricing)**
>
> Rohit

**CTA:** one. Pricing, because tomorrow's email carries the signup link and two emails should not compete for the same click.

> **If only one launch email sends, send the announcement in §4 and drop A5.** A5 exists so the day-of email can be four lines. It is not worth sending on its own.

---

## 4. The launch-day announcement

**Subject:** Supaprod is open
**Alt 1:** It is live. Here is the door.
**Alt 2:** You can start now

**Preheader:** Free plan, no card. Start with one bet.

**Timing:** on `{{launch_date}}`, one send, morning in the recipient's likeliest timezone. Sent to the waitlist and to anyone who reached the demo, and to nobody else.

**Body:**

> {{first_name}},
>
> Supaprod is open.
>
> Start with one bet you are not sure about. The Critic red-teams it with the evidence it used, you make the call, and from there it can write the spec, build it in your repo behind a merge gate, and ship it. When the outcome is settled, that verdict changes what it puts in front of you next time. That last part is the whole product.
>
> Free plan, no card, one seat. GitHub is the connector that works end to end today.
>
> **[Start free]({{signup_url}})**
>
> If something is broken, reply to this email. Today I am reading everything as it arrives.
>
> Rohit
> Founder, Supaprod

**CTA:** one. Signup.

---

## 5. Sequence B: post-launch onboarding, three emails

**Trigger:** an account is created. **Audience:** someone who is actually inside. This sequence has one job, which is to get them to the moment where the product stops being a demo, and that moment is a settled outcome.

### B1. First run, sent immediately after signup

**Subject:** You are in. Start with one bet.
**Alt 1:** The first five minutes of Supaprod
**Alt 2:** One thing to do before you explore

**Preheader:** Not a tour. One action, and it is the one that shows you the product.

**Timing:** immediate, on account creation.

**Body:**

> {{first_name}}, you are in.
>
> Skip the tour. Do this instead: name one thing you are about to build and are not certain about, and let the Critic take it apart. It comes back with the case against it and the evidence behind each objection, before anyone has spent a sprint.
>
> That is the honest five-minute version of Supaprod. Everything else in here follows from it.
>
> If you want the build half, connect GitHub. It is the one connector that runs end to end today, and it is one click rather than a key you paste into a file. Nothing writes to your repo without a merge gate in front of it.
>
> **[Open Supaprod and name one bet]({{signup_url}})**
>
> Rohit

**CTA:** one. Into the product.

---

### B2. The daily surface, sent two days after signup

**Subject:** The one screen to open tomorrow morning
**Alt 1:** What the agents did overnight
**Alt 2:** Where Supaprod expects to meet you

**Preheader:** Today is the ritual. Everything else is reachable from it.

**Timing:** day 2 after signup. **Branch it:** if they have not completed a first action, send the B1 nudge instead, one line asking whether the first screen got in the way.

**Body:**

> {{first_name}},
>
> Supaprod is not a place to visit. It is a thing to open once a day.
>
> That place is Today. It tells you what changed, what needs you, and what the agents did while you were not looking. Agents run the work unattended inside the boundaries you set in advance, and Today is where the results and the decisions waiting on you both land.
>
> The rest of the machinery is behind one door, on purpose. Traces, evals, budgets and guardrails all live in the Engine Room, reachable when you want them and never in the way when you do not.
>
> If Today is empty, that is honest rather than broken: nothing new has landed to rank. Connect a source and it fills.
>
> **[Open Today](https://supaprod.ai/today)**
>
> Rohit

**CTA:** one.

---

### B3. Settle an outcome, sent seven days after signup

**Subject:** Settle one outcome this week
**Alt 1:** This is the step that makes the rest compound
**Alt 2:** The five minutes that change every future ranking

**Preheader:** Until a bet is settled, Supaprod is guessing like everyone else.

**Timing:** day 7 after signup, and only to accounts with at least one shipped item. **Do not send this to an empty workspace.** An email asking someone to settle an outcome they do not have is the fastest way to be unsubscribed.

**Body:**

> {{first_name}},
>
> You have shipped something through Supaprod. Here is the step most people skip, and it is the one the whole product is built around.
>
> Go to Learn and settle it. Say what actually happened: it worked, it did not, it was inconclusive. That verdict gets written back against the decision that caused it.
>
> What that buys you is not a tidier history. It changes the ranking. The next time something similar comes up the queue is ordered by what your bets actually did, not by what sounded good in a meeting, and you get warned before you repeat a call that already failed once.
>
> One settled outcome is enough to see it move. Five and it starts to feel like the system knows your product.
>
> **[Settle an outcome](https://supaprod.ai/learn)**
>
> Rohit

**CTA:** one.

---

## 6. Re-engagement: signed up, never came back

**Trigger:** an account created 14 or more days ago with no session since day one. **Send once.** There is no re-engagement series here, because a second email to someone who ignored the first is a spam complaint waiting to be filed.

**Subject:** Was it the first screen?
**Alt 1:** One question, one line back
**Alt 2:** You signed up and did not come back

**Preheader:** I would rather know why than send you another feature email.

**Timing:** day 14 after signup, zero sessions since the first.

**Body:**

> {{first_name}},
>
> You made an account and did not come back. I would rather find out why than send you another email about features.
>
> One line back is enough. Was it the first screen, was it that nothing you needed was connected, or was it just not the week for it?
>
> If it is the last one, say nothing and I will stop here. This is the only email of its kind you will get.
>
> Rohit

**CTA:** one, and it is a reply. No link at all, which is deliberate: a re-engagement email with a link reads like marketing, and a re-engagement email with a question reads like a person.

---

## 7. Plain-text variant note, for deliverability

Every email above sends as `multipart/alternative` with a real plain-text part. This matters more than usual because the domain will have no sending history at all on day one.

- **The text part is written, not generated.** HTML with the tags stripped leaves orphaned link text and collapsed spacing, and filters read that as machine output. Write the text version by hand from the same copy, with the URL on its own line under the sentence that earns it.
- **One naked URL per email**, matching the single CTA. Long tracking wrappers on a domain with no reputation look like a redirect chain, which is exactly what a filter is trained to distrust. On the first two weeks of sends, use the plain URL and take the loss on click attribution, or use a tracking subdomain of `supaprod.ai` rather than the ESP's shared one.
- **No image-only email and no image-only CTA.** Every email in this file reads completely with images off, which is how a large share of recipients will see it.
- **Keep the text-to-link ratio sane.** These drafts are one link in roughly two hundred words, which is comfortably on the right side of every heuristic.
- **`List-Unsubscribe` and `List-Unsubscribe-Post` headers on all of it**, including the launch announcement, with one-click support per RFC 8058. Gmail and Yahoo require it for bulk senders and the threshold is lower than people assume.
- **A visible unsubscribe link and a postal address in the footer.** The postal address is a legal requirement under CAN-SPAM and there is no entity incorporated yet, which is a founder question to resolve before the first bulk send rather than after it.
- **Warm the domain before the launch announcement.** The nurture sequence at low volume is the warm-up. Do not let the first send from a virgin domain be the largest one.
- **Send the sequence to a seed inbox on Gmail, Outlook and Apple Mail first**, and read all three in dark mode. Dark mode is where a hand-written text part and a badly exported HTML part stop looking alike.

---

## 8. Measurement

**Before any of this: nothing currently reads the funnel.** `landing_events` is written correctly and consumed by no code anywhere, and the PostHog facade is double-gated off. That is tracker row C1. Whoever sends the first email is running SQL by hand unless the admin view exists, so build the read side before the send side.

### Per email, track exactly this

| Metric | Why it is on the list | Read it from |
| --- | --- | --- |
| **Delivered** | On a new domain this is the number that fails first, and every rate below is meaningless without it | ESP |
| **Bounce rate, hard and soft separately** | A hard-bounce spike on a young domain is an emergency, not a statistic | ESP |
| **Spam complaint rate** | The only metric with a hard ceiling attached | ESP |
| **Unique click rate** | The single CTA per email means this is a clean read of whether the email worked | ESP, plus the referrer on the landing event |
| **Reply count** | Two emails in this file ask for a reply and nothing else. For those, this is the conversion metric | inbox, counted by hand |
| **Unsubscribe rate** | Reads as message-fit, not just annoyance | ESP |
| **Downstream action** | The only metric that matters: demo session, teardown run, signup, or settled outcome, attributed to the send | `landing_events` by referrer and day, joined to send time |
| Open rate | Kept, but demoted. Apple Mail Privacy Protection inflates it and it cannot be compared across providers | ESP |

**Attribution, concretely:** the funnel already captures the referrer hostname on `landing_visit`, so email traffic is separable if the CTA carries a query parameter the landing event records. Add it before the first send. Retrofitting attribution after a launch is how a launch becomes unmeasurable.

### What would count as working

**Rates are not readable below about fifty recipients**, and there are zero today. So each row carries an absolute floor as well as a rate, and the floor is what gets judged first.

| Email | Working looks like | Do something about it if |
| --- | --- | --- |
| A1 welcome | 45% or better unique click to the teardown, and at least one person actually completes a teardown | under 20% click, which means the CTA is not the thing they wanted |
| A2 problem | 3% or better of recipients reply, and at least three replies name a real bet | zero replies across thirty sends: the argument is not landing and the subject line is not the reason |
| A3 mechanism | 12% or better click to `/product` | under 5%, which means the mechanism is being explained rather than shown, and the answer is a demo link |
| A4 honest proof | **unsubscribe rate no higher than A3's** | a spike here, which would be the finding: honesty about our stage cost us the reader, and it changes how we open, not whether we tell the truth |
| A5 pre-launch | 10% or better click, and no measurable unsubscribe move | any unsubscribe spike, since this email asks for nothing |
| Launch announcement | 25% or better click to signup, and **at least 30% of clickers create an account** | click without signup, which is a landing-page problem rather than an email problem |
| B1 first run | 60% or better complete a first action inside 48 hours | under 30%, which points at the first-run screen and not the copy |
| B2 daily surface | 35% or better return to the product within 72 hours | under 15%, which means there is nothing worth returning for and no email fixes that |
| B3 settle | at least one settled outcome per ten sends | zero across twenty sends, which is the most important negative result available to us and goes straight to the board |
| Re-engagement | 5% or better reply rate | under 1%, and then retire the email rather than rewrite it |

**Across the whole programme, three hard limits.** Spam complaints above 0.1% means stop sending and diagnose, and above 0.3% means the domain is already damaged. Hard bounces above 2% on any send means the capture path is taking junk addresses and needs validation at the form. Unsubscribes above 1% on a single send means that email is wrong, not the list.

**And the number that outranks all of the above:** how many of these people are still opening the product in week two. A waitlist that converts and then leaves is worse than a smaller one that stays, and this file's own success criterion is week-two return, not click rate. That is the same standard [`00-launch-operating-manual.md`](./00-launch-operating-manual.md) §0 applies to the launch itself.

---

## 9. Before any of this sends

1. **A2: Resend key, and verify `supaprod.ai`.** Founder action, hours. Everything else on this page is blocked behind it.
2. **A3: wire the confirmation email**, which is A1 above. It is the only email here with a real trigger already in the code path.
3. **C1: build the read side.** One admin view over `landing_events` grouped by referrer and day. Without it, section 8 is aspirational.
4. **Add the CTA query parameter** so email traffic is attributable on arrival.
5. **Resolve `{{launch_date}}`.** Founder only. The two canonical dates disagree and neither an agent nor this file may pick.
6. **Postal address for the footer.** No entity is incorporated yet, which makes this a real question rather than a form field.
7. **Founder approval on every email.** Standing rule for this whole folder: nothing outward sends without it.

## Related

- [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) §A, the sending infrastructure and what it cannot do.
- [`brand-ops/social-accounts.md`](./brand-ops/social-accounts.md) §3, the ratified copy pack every line here is cut from, and §4, the never-list.
- [`02-prelaunch-copy-pack.md`](./02-prelaunch-copy-pack.md), the social and outreach copy. Email never forks a claim that file already owns.
- [`../pitch/launch-assets.md`](../pitch/launch-assets.md), the Show HN and Product Hunt copy.
- [`../conventions/humanized-output.md`](../conventions/humanized-output.md) and [`../conventions/ui-voice.md`](../conventions/ui-voice.md), the voice contract.
