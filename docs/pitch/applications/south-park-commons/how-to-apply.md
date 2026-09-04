# SPC Founder Fellowship — how to actually submit

> _Created: 2026-07-31 · Last updated: 2026-08-10_

> **Deadline: Sunday 2026-08-02, 11:59pm PT.** That is Monday 2026-08-03, 12:29pm IST. You have until Monday lunchtime India time.

## Before you open the form (20 minutes)

**1. Test the demo login.** Open an incognito window, go to `https://supaprod.ai/login`, sign in as:

```
voyage@supaprod.ai
Supaprod!Voyage2026
```

Confirm three things: it logs in, it lands on a populated workspace, and **the approval queue has live pending items**. If the queue is empty or expired, re-arm it before submitting (see `docs/operations/demo-credentials.md`, the queues decay on their own). This login is going into two answers, so it has to work.

**2. Re-pull the commit count.**
```bash
git rev-list --count origin/main
ls supabase/migrations/*.sql | wc -l
```
It was **4,264** on 2026-07-31. Use whatever it says the hour you submit. The same number appears in Q9 and Q15, so change both.

> _Updated 2026-08-10: **4,876 commits, 508 migrations, nine weeks** since the first commit on 2026-06-03. Two fixes to this step. It said `HEAD`, which on a lane branch counts that branch rather than main, so **use `origin/main`**. And it only re-pulled commits — the **migration count sat at 410 in the filed answers and is now 508**, which nothing here was checking._

**3. Check LinkedIn is current.** `linkedin.com/in/rohit-gajaraj`. It is a required field and partners open it.

**4. Fill the founder slots** in [`application.md`](./application.md). There are five:
- Q4 phone number
- Q7 how you heard, and Q8 the elaboration
- Q10 the real cause of death for two of the four discarded versions
- Q17 real names of people you would recruit

The Q10 and Q17 slots are the two that actually move the needle. Q10 answers SPC's stated interest in how you generate and discard ideas. Q17 is really asking whether anyone good would follow you, and a real name answers that where a job description does not.

## Filling the form

**URL:** `https://www.southparkcommons.com/apply`
(The form is an Airtable embed. If the embed misbehaves, it also loads directly at `https://airtable.com/appxDXHfPCZvb75qk/pag8h6Xe52XNke3ai/form`.)

> ⚠️ **Do not use `spc.vc`.** It now redirects to Square Peg Capital, an unrelated firm.

### Step 1, and this one matters most

The first question, **"Which best describes where you are in your journey today?"**, is a branching selector. It changes every question below it.

**Select: `Founder Fellowship: I'm starting or started a company and am ready to pitch and fundraise`**

The other two options route you to the Member Residency application, which asks completely different questions and is a different program. If you fill the form top to bottom without setting this first, you will answer the wrong application.

### Step 2

Work down the form pasting from [`application.md`](./application.md). The order matches.

Watch the two character limits. Q9 and Q10 are both capped at **1,000 characters**, and the drafts sit at roughly 730 and 780, so your bracket-fills have room but not unlimited room. Recount after filling.

### Step 3, before you hit submit

- No square brackets anywhere in the form.
- No em dashes anywhere in the form.
- Read Q13, Q14 and Q15 aloud. If a sentence sounds like a pitch deck instead of a person talking, rewrite it. This is the SPC-specific test and it is the one most likely to be failed.
- Confirm the numbers in Q9 and Q15 match what git says today.

### Step 4, after submitting

- Record in [`answer-bank.md`](../answer-bank.md) that **`voyage@` is now allocated to South Park Commons**, with today's date. Never send that login to another program.
- Expect to hear about interviews by **2026-08-30**.

## What happens next, and how to be ready

If shortlisted, the interview is **1:1 or 2:1 with SPC partners**, and past fellows describe it as conversational rather than an assessment. Prepare for that register, not a pitch.

Three things to have ready cold:

1. **The four discarded versions.** They will ask. Have one specific sentence per version on what killed it. This is the most SPC-shaped question you could be asked and the one where a vague answer costs you the most.
2. **The ISRO claim.** Which programme, which subsystem, what you personally owned, roughly when. A partner who knows ISRO will ask, and the answer has to come instantly.
3. **The "why not just a feature in Linear or Notion" objection.** The answer is the one step nobody takes: checking the shipped outcome against the decision that caused it and feeding it back. Say it once, plainly, without the deck vocabulary.

Also worth having: the demo video, which the form does not ask for but an interview absolutely can.

## The honest odds, and why it is still the right first application

**What is working for us:** solo founders are explicitly welcomed with a stated preference for people who can build and prototype, which is precisely this founder. The rubric weights acceleration, and "PM inside a company two years ago, directing a fleet of agents shipping production code today" is a measurable acceleration story. Their bar of shipping things nobody paid you to ship is met literally.

**What is working against us:** zero users, and a cultural centre of gravity around exploration rather than a company that already exists. The drafted answers handle both, the first by stating it as a decision with a tradeoff, the second by leading with the question rather than the product.

**Why it is first:** the deadline is real and close, the terms are genuinely good ($400K for 7% plus a guaranteed $600K follow-on plus up to $1M in credits), SF is one of the three bootcamp cities which fits the US-primary goal, and unlike almost every European program on the list, **being solo is not a disqualification here.** That last point is worth more than it sounds. Of the 57 programs surfaced in the European and India sweep, a large share fail him on the two-founder rule alone.
