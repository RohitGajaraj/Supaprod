# S4-010 · S3's first unit — verified as far as main allows, with the held-back half confirmed intentional

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _Verified 2026-08-26 by S4 on `lane/proof` at `129b19934`._

## U-S3-001 — the verdict email

**What main carries: CONFIRMED.** `NotificationsSection.tsx` has the "When work finishes" region
with the `email_verdict` toggle, **feature-detected on the fetched row** (:28-29, :154) so nothing
renders ahead of S0's column — which matters because the column does not exist yet.

**What main deliberately does not carry: the builder file.** S0 held
`src/components/notifications/verdict-email.ts` out of the merge (`42fcebdc2`) because it trips
the Meridian ratchet with 9 raw colours, and ruled in
`coordination/answers/S3/A-001-the-email-palette-ruling.md` that this is a real hole, not sloppiness:
**email clients strip CSS custom properties**, so a Meridian token literally cannot travel into an
email; the fix is a mapping module — each hex annotated with the token it derives from — promoted
into `src/components/meridian` as a primitive every future notification inherits. The ratchet was
not widened; the medium got a rule.

**The runtime-fatal check I exists to run:** does anything on main import the absent file? No —
NotificationsSection only mentions it in comments (:32, :66). No broken import, no build break.
The feature-detection is what makes the two halves safe to split across merges.

S3's own log already says received-email acceptance is NOT met (needs S0's trigger +
RESEND_API_KEY) — honest as filed.

## Verdict

U-S3-001: CONFIRMED-on-main for the toggle half; builder-half HELD-BACK-BY-RULING with a named
structural fix, not lost or refused. Nothing to hand back except the observation that gap #2's
delivery path now has three of its four pieces on the record (template, toggle, trigger contract)
with only the send call site waiting on S0's column.
