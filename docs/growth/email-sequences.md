# Email sequences

> _Created: 2026-08-07 · Last updated: 2026-08-07 · Status: **A1 IS LIVE. Everything behind it is copy, not a live sequence.**_

## ⛔ Read this before anything else on this page

**One email on this page can send today, and it is A1.** [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) §5 closed rows A2 and A3 on 2026-08-07: `supaprod.ai` is verified, the Resend key is in place, and A1 fires from `joinWaitlist` on a genuine first signup, guarded so a repeat submission cannot earn a duplicate send. Its shipped text lives in `src/lib/waitlist-email.server.ts`, and **section 3 below is the source that file is kept in sync with.** Change a claim in one and you have forked the message.

**Nothing behind A1 may send yet, and both blockers are founder-sized rather than technical.** There is no postal address for the footer (CAN-SPAM, no entity is incorporated) and unsubscribe is mailto only, not RFC 8058 one-click. A confirmation somebody asked for is the most defensible send in the whole programme. The four nurture emails behind it are bulk mail and are not.

**The door is shut, and every email on this page is written for that.** Founder ruling 2026-08-07: signup was open and auto-confirming, which made the waitlist theatre. Supaprod is a private beta now and entry is by invite code. No email here may imply self-serve signup, and none may name a launch date or a month. The date is held internally and withheld on purpose, which is §2.

**The second thing to know before writing a word of your own:**

| Measured on production, 2026-08-07 | Number |
| --- | --- |
| `landing_visit` events since 2026-07-15 | 1,427 |
| Real waitlist signups, ever | **0** |
| Users on the product | 8, all founder or internal |
| Revenue | none, billing is built and switched off |

**The nurture sequence therefore has zero recipients today.** Every line below is written for a stranger who has never heard of us and has nobody to be impressed by. No copy in this file assumes a warm audience, references a community, counts subscribers, or implies anybody else is already here. That is not modesty. It is the only accurate posture available, and a reader who checks will find it holds.

**The third thing: the register, founder ruling 2026-08-07.** These emails read live and current, like something is actually happening, written by a person who cares about it. Not the formal template a product leader already gets forty of a day and reads none of. **Humour is minimal and earns its place**, never a gag for its own sake, and the audience is mostly B2B enterprise: a founder writing to a peer who runs product at a real company, so a little formality helps and complete formality kills it. **Where an email can anchor in what is actually happening in the industry, it should**, and the anchor that lands is the one A2's subject already carries: engineering got real agents this year, ones that write, test and ship, while product management got a summarize button. Use it as substance where it fits and leave it out where it would be bolted on. Short beats complete.

**What did not move is the claims boundary.** Tone got loose. Claims did not. A joke is free; an invented number, a date we are withholding, or a capability we cannot demonstrate is not.

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
| Supaprod is a private beta and entry is by invite code | Founder ruling of 2026-08-07 on the access model, shipped in `src/lib/waitlist-email.server.ts` |
| Engineering got agents that write, test and ship. Product management got a summarize button | [`brand-ops/social-accounts.md`](./brand-ops/social-accounts.md) §3, the ratified LinkedIn opener "Engineers got agents. Product people got chatbots." An observation about the industry, never a claim about a named competitor |

**Never, in any email on this page:**

- Any user, customer, subscriber or waitlist count. No "join 500 builders", no "1,400 people have looked at this", no "hundreds on the list". The visit number is ours to read, never theirs to be impressed by.
- Any testimonial, quote or logo. We have none, and an invented one is unrecoverable.
- The words **remembers**, **stores**, **logs**, **archive** or **searchable history** of the brain. It **learns, then guides**.
- Em dashes or en dashes anywhere. Commas, colons and full stops.
- Buzzwords from [`../conventions/ui-voice.md`](../conventions/ui-voice.md): seamless, leverage, empower, robust, unlock, delve, elevate, supercharge, cutting-edge, and the rest of that list.
- "Cursor for PMs", "AI PM tool", any YC mention, any commit or feature count.
- A promise that a person approves every gate. Agents settle some verdicts on their own, by design, and a reader would find the counter-example inside a week.
- A connector we cannot honour. Linear, Jira, Notion, Figma, Google and Microsoft are registered but stubbed. **Name GitHub or name none.**
- **A launch date, a month, a countdown or a number of days.** The date is set internally and withheld deliberately. An email that needs to talk about timing promises the invite code instead.
- **Anything that reads as self-serve.** "Sign up free", "create your account", "get started now". The door is shut and a stranger cannot open it. What they get is a code.
- **The pronunciation gloss.** "Said with an A", "SOO-pa-prod". Cut by the founder on 2026-08-07, and the reasoning is under A1.

## 2. Tokens, sender identity and the date problem

| Token | Fill with |
| --- | --- |
| `{{first_name}}` | falls back to nothing, and every sentence below reads correctly with it empty. The shipped A1 renders the bare `Hi,` because the waitlist form collects an address and nothing else |
| `{{launch_date}}` | **nothing. It is never resolved in a body.** See the note directly below |
| `{{invite_code}}` | the recipient's own code, one per person, never reused. Codes are real (`src/lib/invites.functions.ts`); minting one per waitlist row at send time is not wired yet, which is §9 item 6 |
| `{{teardown_url}}` | `https://supaprod.ai/p/teardown` |
| `{{demo_url}}` | `https://supaprod.ai/demo` |
| `{{signup_url}}` | `https://supaprod.ai/signup`, which is where a code is redeemed rather than where an account is created from nothing |

**From:** `Rohit at Supaprod <rohit@supaprod.ai>` · **Reply-to:** `founder@supaprod.ai` · **Support in the footer:** `hello@supaprod.ai`, which already routes.

**The launch date is settled internally and withheld in public, founder ruling 2026-08-07.** It is recorded in [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §0 and it does not travel from there into an email. This is a position, not a gap: the suspense is worth more than the date, and a date announced early is a date you can be late for. So `{{launch_date}}` survives only in the timing notes, where it tells the sender when to press send. **No body on this page resolves it and no body names a month.** Where an email has to talk about what happens next, it promises the invite code, which is a better sentence anyway because it is a thing rather than a day. The same rule is enforced in code: a test fails the build if a month name leaks into A1 while `LAUNCH_DATE` is unset, which is the state that ships.

**Sending domain, now that A2 is closed.** Lifecycle and transactional email share the verified root domain, which is what A1 sends on. Cold outreach must not: [`00-launch-operating-manual.md`](./00-launch-operating-manual.md) §1 puts cold email on a separate warmed domain for exactly this reason, and mixing them puts the product's own password resets behind whatever the cold list does to the reputation.

---

## 3. Sequence A: the waitlist nurture, five emails

**Trigger:** a row lands in `waitlist_signups`. **Audience:** somebody who left an email address on a landing page and has never used the product. **Rule for the whole sequence: one link per email.** A second link halves the first one and gives a cold domain a spam signal it does not need.

### A1. Welcome, sent within five minutes of signup

**⚠️ THIS ONE IS SHIPPED. It is the only email on this page that sends, and the copy below is the copy in `src/lib/waitlist-email.server.ts`, word for word.** Edit one without the other and the message forks. It is also the reference register for everything under it: an industry observation the reader already feels, a concrete promise rather than a vague one, paragraphs that stop early, and a close asking for something genuinely useful instead of something flattering. No throat-clearing at either end, and the compounding claim stated rather than implied.

**Subject:** You are on the list
**Alt 1:** What you just put your name down for
**Alt 2:** One thing to do while you wait

**Preheader:** The gap it exists for, what arrives when a slot opens, and one thing you can do in twenty seconds.

**Timing:** immediate, and it already is. A waitlist that never acknowledges reads as broken even when the row is safely captured, which was tracker row A3.

**Body:**

> Hey,
>
> Engineering got real agents this year. Product management got a summarize button.
>
> That gap is what you just joined the list for. Supaprod is a product team of agents: they work out what to build, build it, ship it, then check whether it actually worked. The next call arrives already knowing what went wrong last time, so you do not pay for the same mistake twice.
>
> The moment a slot opens, you get an invite code. One email, no countdown.
>
> Meanwhile, give the Critic a bet you actually believe in. It red-teams it in about twenty seconds and shows its evidence. No account.
>
> {{teardown_url}}
>
> If it comes back useless, tell me. That is the more useful reply.
>
> Rohit

**The greeting is bare on purpose, and it is "Hey".** `{{first_name}}` is supported and renders `Hey Maya,` when there is a name, but the waitlist form collects an address and nothing else, so `Hey,` is what actually ships. "Hi" was the previous form and it went for being the default nobody chooses.

**Length is a constraint here, not a preference.** This email was 200 words and the founder cut it to roughly 110 on 2026-08-07. What went was explanation rather than content: two sentences confirming a signup the reader watched themselves make, and a third teaching them to say a word. **Every email below is held to the same test.** If a sentence is not something the reader can act on or did not already know, it is filler with good manners.

**There is no pronunciation gloss, and that is a ruling rather than an omission.** "Supaprod, said with an A: SOO-pa-prod" sat here as the second sentence, before the reader had been told what we do, and the founder cut it on 2026-08-07. The spelling already carries it: "Superprod" would need the gloss, "Supa" reads one way, so the A **is** the guide and the sentence was explaining a problem the name had already solved. It survives in reference fields only, [`press-kit.md`](./press-kit.md) where a journalist may have to say it on air and [`brand-ops/trademark-brief-supaprod.md`](./brand-ops/trademark-brief-supaprod.md) where phonetic similarity is the legal test. Never in anything read front to back.

**The launch sentence has a second legitimate form and it is not in use.** If `LAUNCH_DATE` is ever set, that line becomes "We open X. You get an invite code that morning. One email, no countdown." The shipping branch is the one above, because the date is withheld.

**CTA:** one. The teardown.

---

### A2. The problem, sent two days after A1

**Subject:** Engineering got agents. Product got a summarize button.
**Alt 1:** Why building got cheap and deciding did not
**Alt 2:** The expensive half of product work is the half nobody automated

**Preheader:** Code got a fast oracle. Judgment did not.

**Timing:** day 2. **This is where the industry anchor belongs**, at full length rather than as the single line A1 gives it.

**Body:**

> {{first_name}}, one argument, then I am out of your inbox.
>
> Code has a fast oracle. It compiles or it does not, tests pass or they fail, and the answer lands in seconds. That is why agents got good at engineering first: something told them they were wrong, immediately and for free.
>
> "Should we build this, and was it right" has no oracle like that. The answer arrives a quarter later, long after the decision that caused it scrolled out of view. So the expensive half of the job is the half nobody automated, and it is the half that does not get cheaper when the next model ships.
>
> A point tool makes one seam faster and leaves you as the glue between the other fourteen. Removing the glue means one system owning the whole arc, with agents running it rather than assisting.
>
> What is the bet you are least sure about this week? One line back is plenty. I read these myself.
>
> Rohit

**CTA:** one, and it is a reply rather than a link. Replies are the strongest positive signal a young sending domain can generate, and each one is a discovery interview we currently have no other way to get.

---

### A3. The mechanism, sent five days after A1

**Subject:** What happens after you ship
**Alt 1:** The part that compounds
**Alt 2:** How one settled outcome changes what you see next

**Preheader:** Most tools end in a report. This one ends by changing the next ranking.

**Timing:** day 5.

**Body:**

> {{first_name}},
>
> Most product tools stop at the ship. The interesting part of ours starts there.
>
> The loop runs as one route: signals cluster into themes, the Critic red-teams the ranked bets before you ever see them, the spec is written with its citations attached, our engine writes the code in your repo behind a merge gate, it ships.
>
> Then the outcome is settled with a verdict, and that verdict is written back against the decision that caused it. That is the step that pays for the rest, because it re-ranks what you are shown next time. The loop does not end in a dashboard. It ends by changing what is in front of you on Monday.
>
> Which is why the brain is not a filing cabinet. Any vendor can hold your decisions. The join between your decisions and your outcomes, labelled over time, is a byproduct of running the loop, and it is what tells you what is worth doing next and warns you when you are about to repeat something.
>
> See the whole loop: https://supaprod.ai/product
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
> This is the email where a company at our stage shows you logos. I have none, so here is the actual state of things.
>
> Eight people use Supaprod and all eight are me or internal. No revenue: billing is built, tested and switched off on purpose. Nobody outside has run a quarter on it, and the receipts on our site are labelled as examples for exactly that reason.
>
> That was a decision. A half-built loop teaches you the wrong thing, because you get feedback on a demo instead of on the thesis. The loop closes now, which is why we are letting anyone in at all.
>
> Two things you would find out in your first week anyway. GitHub is the connector that runs end to end today, so if your code lives somewhere else, wait for us. And when somebody leaves your team, the record they built travels to whoever picks it up, but the compounded recall does not travel yet.
>
> What I can offer instead of proof is access. The demo workspace is open with real work in it, no account needed. Go and try to break it, then tell me where it gave.
>
> Open the demo workspace: {{demo_url}}
>
> Rohit

**CTA:** one. The demo. Proof they can check beats proof we assert.

---

### A5. Launch CTA, sent 24 hours before the doors open

**Subject:** Your invite code lands tomorrow
**Alt 1:** Two minutes of prep, then your code
**Alt 2:** One email tomorrow, and it has your way in

**Preheader:** Free plan, no card, and two things worth having ready.

**Timing:** 24 hours before `{{launch_date}}`. **"Tomorrow" is the only timing word allowed in the body**, because 24 hours out it reveals nothing a competitor can act on and it names no month.

**Body:**

> {{first_name}},
>
> Your invite code arrives tomorrow. This is the heads-up, so tomorrow's email can be four lines.
>
> Two things worth having ready, a minute each.
>
> One bet in mind. Not a roadmap. One thing you are about to build and are not certain about, because that is what you point Supaprod at first and it is the fastest way to find out whether any of this is real for your team.
>
> Your GitHub, if you want the build half. That is the connector that runs end to end today.
>
> The Free plan is $0 and takes no card, so nothing needs deciding tomorrow beyond whether to open the tab.
>
> What the free plan includes: https://supaprod.ai/pricing
>
> Rohit

**CTA:** one. Pricing, because tomorrow's email carries the code and the door, and two emails should not compete for the same click.

> **If only one launch email sends, send the announcement in §4 and drop A5.** A5 exists so the day-of email can be four lines. It is not worth sending on its own.

---

## 4. The launch-day announcement

**Subject:** Your invite code
**Alt 1:** You are in. Here is the code.
**Alt 2:** The door is open to you

**Preheader:** One code, one door, and one bet worth starting with.

**Timing:** on `{{launch_date}}`, one send, morning in the recipient's likeliest timezone. **Sent to the waitlist and to nobody else**, which is not a choice: a demo visitor leaves no address, so the waitlist is the only list that exists. **Every recipient gets their own code and no code is reused**, which also makes this the one send in the file that cannot be a single blast of identical HTML.

**Body:**

> {{first_name}},
>
> Supaprod is open to you. Your code is {{invite_code}} and it is yours alone.
>
> Start with one bet you are not sure about. The Critic red-teams it and shows you the evidence behind each objection. You make the call. From there it can write the spec, build it in your repo behind a merge gate, and ship it. When the outcome is settled, that verdict changes what you get shown next time, and that last part is the product.
>
> Free plan, $0, no card, one seat. GitHub is the connector that runs end to end today.
>
> Redeem your code: {{signup_url}}
>
> If something breaks, reply to this email. Today I am reading everything as it arrives.
>
> Rohit

**CTA:** one. The door, carrying the code.

---

## 5. Sequence B: post-launch onboarding, three emails

**Trigger:** an account is created. **Audience:** someone who is actually inside. This sequence has one job, which is to get them to the moment where the product stops being a demo, and that moment is a settled outcome.

### B1. First run, sent immediately after signup

**Subject:** You are in. Start with one bet.
**Alt 1:** The first five minutes of Supaprod
**Alt 2:** Skip the tour, do this instead

**Preheader:** Not a tour. One action, and it is the one that shows you the product.

**Timing:** immediate, on account creation. **The code has already been redeemed by the time this sends**, so it never mentions one.

**Body:**

> {{first_name}}, you are in.
>
> Skip the tour. Name one thing you are about to build and are not certain about, and let the Critic take it apart. It comes back with the case against it and the evidence behind each objection, before anybody has spent a sprint finding that out the slow way.
>
> That is the honest five-minute version of Supaprod. Everything else in here follows from it.
>
> If you want the build half, connect GitHub. It is the one connector that runs end to end today, one click rather than a key pasted into a file, and nothing reaches your repo without a merge gate in front of it.
>
> Open Supaprod and name one bet: https://supaprod.ai/onboarding
>
> Rohit

**CTA:** one. Into the product, at `/onboarding`, which is the live first-run flow. **Not `{{signup_url}}`**, which this reader has already been through and which now asks for a code they have already used.

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
> Supaprod is not somewhere to visit. It is something to open once a day, with coffee, before anybody asks you for anything.
>
> That place is Today. It tells you what changed, what needs you, and what the agents did while you were not looking. They run the work unattended inside boundaries you set in advance, and Today is where both the results and the decisions waiting on you land.
>
> The rest of the machinery sits behind one door on purpose. Traces, evals, budgets and guardrails live in the Engine Room, there the moment you want them and out of the way when you do not.
>
> If Today is empty, that is honest rather than broken: nothing new has landed to rank. Connect a source and it fills.
>
> Open Today: https://supaprod.ai/today
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
> You have shipped something through Supaprod. Here is the step most teams skip, and it is the one the whole product is built around.
>
> Go to Learn and settle it. Say what actually happened: it worked, it did not, it was inconclusive. That verdict is written back against the decision that caused it.
>
> What that buys you is not a tidier history. It changes the ranking. Next time something similar comes up, the queue is ordered by what your bets actually did rather than by what sounded good in the room, and you get warned before you repeat a call that already failed once.
>
> One settled outcome is enough to watch the order move. Five and it starts to feel like the system knows your product.
>
> Settle an outcome: https://supaprod.ai/learn
>
> Rohit

**CTA:** one.

---

## 6. Re-engagement: signed up, never came back

**Trigger:** an account created 14 or more days ago with no session since day one. **Send once.** There is no re-engagement series here, because a second email to someone who ignored the first is a spam complaint waiting to be filed.

**Subject:** Was it the first screen?
**Alt 1:** One question, one line back
**Alt 2:** You used your code and did not come back

**Preheader:** I would rather know why than send you another feature email.

**Timing:** day 14 after signup, zero sessions since the first.

**Body:**

> {{first_name}},
>
> You used a code, made an account, and have not been back since. I would rather know why than send you another email about features.
>
> One line is enough. Was it the first screen, was it that nothing you needed was connected, or was it simply not the week for it?
>
> If it is the last one, say nothing and I will stop here. This is the only email of this kind you will get.
>
> Rohit

**CTA:** one, and it is a reply. No link at all, which is deliberate: a re-engagement email with a link reads like marketing, and a re-engagement email with a question reads like a person.

---

## 7. Plain-text variant note, for deliverability

> **Appearance is a separate contract.** How these emails LOOK (the ember band, the mark that answers to its ground, why white on the bright ember is banned, and what blocks the sender avatar) lives in [`branding/email-design.md`](./branding/email-design.md). This section covers deliverability only. Do not restyle an email without reading that file: two of its constraints are measurements that have each been violated once already.


Every email above sends as `multipart/alternative` with a real plain-text part. This matters more than usual because the domain still has no sending history: `supaprod.ai` is verified and has never delivered a message to a stranger.

- **The text part is written, not generated.** HTML with the tags stripped leaves orphaned link text and collapsed spacing, and filters read that as machine output. Write the text version by hand from the same copy, with the URL on its own line under the sentence that earns it. **A1 already does this**, and its HTML part is deliberately plain: system fonts, one link, no images, no tracking pixel, because a table-heavy template from a domain with no history is a worse bet than something that looks like a person wrote it.
- **One naked URL per email**, matching the single CTA. That is why every body above puts the URL on its own line rather than hiding it under anchor text. Long tracking wrappers on a domain with no reputation look like a redirect chain, which is exactly what a filter is trained to distrust. On the first two weeks of sends, use the plain URL and take the loss on click attribution, or use a tracking subdomain of `supaprod.ai` rather than the ESP's shared one. **The invite code in §4 is not a second link and must never become one:** a code is text a person can read, retype and forward to nobody, and putting it behind a one-click URL would both break the rule and make the code interceptable by every scanner in the path.
- **No image-only email and no image-only CTA.** Every email in this file reads completely with images off, which is how a large share of recipients will see it.
- **Keep the text-to-link ratio sane.** These drafts run one link in 110 to 180 words, which is comfortably on the right side of every heuristic. The length ceiling came from the founder rather than from a filter, and it happens to serve both.
- **`List-Unsubscribe` and `List-Unsubscribe-Post` headers on all of it**, including the launch announcement, with one-click support per RFC 8058. Gmail and Yahoo require it for bulk senders and the threshold is lower than people assume. **A1 ships the mailto form today**, which is valid and honoured but is the weaker one, and there is no unsubscribe route in the app to point the HTTPS form at. That route is the work, not the header.
- **A visible unsubscribe link and a postal address in the footer.** A1 ships with neither a postal address nor an HTTPS unsubscribe, which is defensible for a confirmation somebody explicitly asked for and is **not** defensible for the four nurture emails behind it. The postal address is a legal requirement under CAN-SPAM and no entity is incorporated yet, so it is a founder question to answer before the first bulk send rather than after it.
- **Warm the domain before the launch announcement.** The nurture sequence at low volume is the warm-up. Do not let the first send from a virgin domain be the largest one.
- **Send the sequence to a seed inbox on Gmail, Outlook and Apple Mail first**, and read all three in dark mode. Dark mode is where a hand-written text part and a badly exported HTML part stop looking alike.

---

## 8. Measurement

**The read side now exists, which it did not when this file was written.** Tracker row C1 closed on 2026-08-07 (`3ec6b932`): `/admin/launch` shows four funnel counts, signups per day, a referrer breakdown and waitlist source, admin-gated. So nobody has to run SQL by hand to see whether a send did anything. **What is still missing is the tag on the way in**, item 4 in §9: without a query parameter on the CTA, email traffic arrives indistinguishable from the rest and the referrer is the only thing separating it.

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
| Launch announcement | 25% or better click to the door, and **at least 30% of issued codes redeemed inside 72 hours** | codes clicked and not redeemed, which is a redemption-screen problem rather than an email problem. Unredeemed codes are also the cleanest signal in the whole programme: the person wanted in enough to click and something in the door stopped them |
| B1 first run | 60% or better complete a first action inside 48 hours | under 30%, which points at the first-run screen and not the copy |
| B2 daily surface | 35% or better return to the product within 72 hours | under 15%, which means there is nothing worth returning for and no email fixes that |
| B3 settle | at least one settled outcome per ten sends | zero across twenty sends, which is the most important negative result available to us and goes straight to the board |
| Re-engagement | 5% or better reply rate | under 1%, and then retire the email rather than rewrite it |

**Across the whole programme, three hard limits.** Spam complaints above 0.1% means stop sending and diagnose, and above 0.3% means the domain is already damaged. Hard bounces above 2% on any send means the capture path is taking junk addresses and needs validation at the form. Unsubscribes above 1% on a single send means that email is wrong, not the list.

**And the number that outranks all of the above:** how many of these people are still opening the product in week two. A waitlist that converts and then leaves is worse than a smaller one that stays, and this file's own success criterion is week-two return, not click rate. That is the same standard [`00-launch-operating-manual.md`](./00-launch-operating-manual.md) §0 applies to the launch itself.

---

## 9. Before the rest of this sends

**A1 is out. Everything numbered below is what stands between the other nine emails and an inbox.** Three of these closed on 2026-08-07 and are kept struck through rather than deleted, because a closed blocker that vanishes gets rediscovered as an open one.

1. ~~**A2: Resend key, and verify `supaprod.ai`.**~~ **Closed 2026-08-07.** The apex is verified and the key is in Lovable secrets. Inbound survived: Resend is confined to `send.` and `resend._domainkey`, so Cloudflare Email Routing on the apex is untouched and replies still land.
2. ~~**A3: wire the confirmation email.**~~ **Closed 2026-08-07 (`a5e79f76`), and rewritten to the new voice in `638fde56`.** A1 fires from `joinWaitlist`, guarded on a first signup so a repeat submission cannot earn a duplicate-send complaint, and it cannot throw, so a dead vendor cannot cost us the row. **What replaces it as work: keep the two copies married.** The body lives in `src/lib/waitlist-email.server.ts` and in §3 above, and a claim changed in one without the other forks the message. The build defends one half of that already: a test fails if a month name appears in A1 while `LAUNCH_DATE` is unset.
3. ~~**C1: build the read side.**~~ **Closed 2026-08-07 (`3ec6b932`).** `/admin/launch`, admin-gated. §8 is no longer aspirational.
4. **Add the CTA query parameter** so email traffic is attributable on arrival. Still open, and retrofitting attribution after a launch is how a launch becomes unmeasurable.
5. ~~**Resolve `{{launch_date}}`.**~~ **Settled 2026-08-07, and the answer is that it stays off this page.** The founder holds the date internally, recorded in [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §0, and withholds it publicly on purpose. Nothing here resolves the token and no body names a month.
6. **Join a minted code to a waitlist row at send time.** The door itself landed on 2026-08-07: `src/lib/invites.functions.ts` mints, checks and atomically redeems a code, and `/signup` asks it rather than deciding anything itself. What §4 still needs is the merge step, one code per recipient, minted and dropped into `{{invite_code}}` on the way out. **Until that exists the launch announcement cannot send**, and it is the only email in the file whose blocker is a mechanism rather than a footer.
7. **Postal address for the footer.** No entity is incorporated yet, which makes this a real question rather than a form field. A1 is out the door without one because a confirmation somebody asked for is defensible; the bulk sends are not.
8. **An unsubscribe route**, so `List-Unsubscribe` can carry the HTTPS one-click form instead of the mailto fallback A1 ships with.
9. **Founder approval on every email.** Standing rule for this whole folder: nothing outward sends without it.

## Related

- [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) §A, the sending infrastructure and what it cannot do.
- [`brand-ops/social-accounts.md`](./brand-ops/social-accounts.md) §3, the ratified copy pack every line here is cut from, and §4, the never-list.
- [`02-prelaunch-copy-pack.md`](./02-prelaunch-copy-pack.md), the social and outreach copy. Email never forks a claim that file already owns.
- [`../pitch/launch-assets.md`](../pitch/launch-assets.md), the Show HN and Product Hunt copy.
- [`../conventions/humanized-output.md`](../conventions/humanized-output.md) and [`../conventions/ui-voice.md`](../conventions/ui-voice.md), the voice contract.
