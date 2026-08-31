# S4-176 — the settings page promises an email, and nothing anywhere records whether one was sent

> _S4 · 2026-08-31 ~19:0x UTC · source read end to end, plus a schema read on project `371dd588`. No
> dev server, no browser, no row written._

**S1 asked for a third measurement on a claim it could not settle from its own prefix, and flagged it
to S3 rather than touching it. The claim is real, and the reason it is real is one layer deeper than
either lane had it.**

## The claim as made

S1: *"`NotificationsSection.tsx:295` renders 'Work that reaches a result emails you what came of it'
in the PRESENT TENSE when the preference is on. The verdict chain is code-complete … but S3 reports
`RESEND_API_KEY` absent in the deployed Worker. If that is right, the sentence is a promise the
deployment cannot keep."*

## Verdict: **CONFIRMED, and the sentence is not the worst part**

**The sentence renders exactly as described.** `NotificationsSection.tsx:295-297`, appended to the
subtitle whenever `verdictEmail === true`:

> *" Work that reaches a result emails you what came of it."*

Present tense, unconditional, and shown on the strength of a **preference toggle** rather than of any
capability check.

**The chain is code-complete, as S1 says.** `registry.server.ts:5994` → `dispatchVerdictEmail`
(`notifications.functions.ts:891`) → `sendEmail` (`email.server.ts:54`).

## The part neither lane had: the failure is designed to be silent, and nothing records it

**`sendEmail` does not throw when the key is missing. It returns a clean, accurate refusal**
(`email.server.ts:56-58`):

```ts
if (!cfg.enabled) {
  return { sent: false, reason: "email delivery not configured (RESEND_API_KEY absent)" };
}
```

**`dispatchVerdictEmail` returns `{ sent, reason }` and, in the call site's own words, *"never throws
— every failure path returns"*.**

**And the call site awaits it and throws the answer away** (`registry.server.ts:5994`):

```ts
await dispatchVerdictEmail(supabase, { userId, learningId, verdict: a.verdict, … });
```

**No assignment. The `{ sent, reason }` is not captured, not logged, not returned to the agent, and
not written to any row.**

**There is no table to write it to.** Every table in `public` whose name contains `email`, `notif` or
`deliver`:

```
user_notification_preferences
```

**That is the whole list. There is no email log, no delivery record, no send attempt table.**

### So the claim is unfalsifiable from inside the product

Put together: if `RESEND_API_KEY` is absent, the one function that knows says so precisely, to a
caller that discards it, with nowhere to write it and no surface that reads it. **The verdict is
recorded, the agent's tool result says nothing about the email, and the settings page goes on saying
work "emails you what came of it".**

**The product cannot tell you whether it emailed you.** Not "it might be wrong" — *whether* it is
wrong cannot be determined from any row or any screen.

**And the silence is deliberate, for a good reason.** The comment above the call explains it:
*"`dispatchVerdictEmail` never throws — every failure path returns — so awaiting it cannot cost the
verdict that is already written."* **That reasoning is correct.** An email failure must never lose a
verdict. The defect is not the swallow; it is that **nothing downstream of the swallow ever asks what
it swallowed.**

## What I could NOT settle, stated plainly

**I did not verify that `RESEND_API_KEY` is actually absent in the deployed Worker.** I cannot: it is
Worker runtime state and I have no read on it. **`email-health.functions.ts:11` already names this
exact problem in the repo's own words** — *"3. `RESEND_API_KEY` is absent in the WORKER (unknowable
from a browser)"* — so the uncertainty is modelled and known.

**But the finding does not depend on it**, which is why it is worth filing. Whether the key is present
or absent, **no row records a send and no caller reads the result**, so nobody can answer the question
either way. If the key IS present, the sentence is true by luck and still unverifiable. If it is
absent, the sentence is false and nothing would ever say so.

**The behavioural test S3 would need is the same one that does not exist:** I looked for a send record
to check against and there is none, which is the finding rather than a gap in my method.

## The smallest thing that closes it

**Capture the return.** One line at `registry.server.ts:5994`, and one place to put it:

```ts
const mail = await dispatchVerdictEmail(supabase, { … });
// mail.reason already carries "email delivery not configured (RESEND_API_KEY absent)"
```

`sendEmail` already produces the exact sentence a person or an operator would need. **It is written
and thrown away.** That is the same shape as `track_drives` — 820 rows recorded faithfully and read by
nothing — and as `studio.review`, implemented and called zero times.

**And until it is captured, the settings sentence should be conditional on something measurable rather
than on a toggle**, which is S3's call since `settings/**` is theirs.

## Owner

**S3** for `NotificationsSection.tsx` and the settings claim, which is where S1 routed it and that
routing is right. **S0** for the discarded return at `registry.server.ts:5994`, which is the half that
makes the claim unanswerable rather than merely unproven.

No product code written. No dev server, no row written, nothing pressed.
