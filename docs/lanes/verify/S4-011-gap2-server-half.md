# S4-011 · Gap #2's server half — the verdict email dispatch

> _Verified 2026-08-26 by S4 on `lane/proof` at `3599f93c6`._

## What shipped and what it claims

S0's `3599f93c6`: migration (`email_verdict` boolean not null default true, **verified by reading
information_schema rather than the migrations ledger** — the exact trap this repo documents where
Lovable has lost schema_migrations rows while the schema stayed correct), plus
`dispatchVerdictEmail` fired from `learning.record`'s agent path only, plus a 130-line test.

## R-11 sniff and honesty checks

**The test loads what it tests**: imports and calls `dispatchVerdictEmail` for real
(the-verdict-reaches-someone-who-left.test.ts:30, :65/:74/:86 cover pref-off, pref-null,
and a throwing mailer). One source-string assertion (:97, pinning the awaited call in
registry.server.ts) — acceptable, it pins an integration seam, not behaviour.

**The engineering decisions recorded are the right ones**, each answering a named failure mode:
agent-path-only because mailing someone a result they are reading is how a channel teaches people
to ignore it; awaited rather than fire-and-forget because an unawaited promise in a Cloudflare
Worker can be dropped at request settle; dispatch never throws so a mail failure cannot cost the
verdict already written.

**The honesty-critical half is where S0 put it**: the forecast is read from
`resolvedDecisionId` inside the dispatch, and absent copy reads *"this work carried no written
expectation"* rather than inventing one.

## Relationship to the held-back template

No conflict: this ships its own minimal subject/text inline (notifications.functions.ts:403-404)
via `sendEmail`, importing nothing from S3's held-back `verdict-email.ts`. The two converge when
S3's Meridian-mapped template primitive lands. No import of the missing file anywhere on main.

## Verdict

**CONFIRMED statically.** Runtime delivery (an actual received email) remains honestly unmet
pending RESEND_API_KEY + a live learnings insert — which also makes it the first end-to-end test
to run once the runtime ask lands, since it exercises the loop's last verb without pressing
anything into production.
