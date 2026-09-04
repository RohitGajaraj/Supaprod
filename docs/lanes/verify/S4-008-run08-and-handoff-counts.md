# S4-008 · RUN-08 (the value audit) and the SwarmHandoff payload counts

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _Verified 2026-08-26 by S4 on `lane/proof` rebased to `5d6289528`._

## RUN-08 — "was it worth it" gets a surface

**CONFIRMED statically, and it is honest by construction rather than by disclaimer.**
`cost-summary.ts` keeps one honesty rule per column instead of sharing one: time and tokens
aggregate only **measured** values, because a zero would be a finalizer that did not write — a
model call cannot take 0ms (:15-17, :44-49). Money reads as written because zero is legitimate
(a seat refused before reaching a model is genuinely free). When turns exist but no finalizer
wrote a duration, the line is *"No turn recorded how long it worked."* — not "0 minutes" (:62-64).
Uncharged renders *"Nothing was charged."*, never $0.00 (RunCost.tsx via costLines :70). The audit
pairing — cost beside the person's own opening sentence — makes it an audit rather than a bill,
which is exactly capability-register §11 "Report cost" gaining its surface. Open runs say the
figures are not final (RunCost.tsx:75).

Zero new reads claimed and confirmed: pure aggregation over `Turn` receipts already in the
transcript's cache.

## f12e3ffc6 — SwarmHandoff payload counts, with the always-zero declared

**CONFIRMED, including the self-caught theatre risk.** S0 shipped `artifact_count` /
`evidence_count` off the handoff payload, `Array.isArray`-guarded because jsonb `.length` on a
string counts characters, not items. The commit then does the thing this repo usually has to catch
afterwards: it **declares that `evidence_count` is 0 on every live handoff today** — the evidence
gate is default-OFF (`handoff.server.ts:92`), so a "0 evidence" badge would read as
checked-and-none-found when the truth is nobody-was-asked. The warning lives in the type, and
`the-handoff-says-what-travelled-with-it.test.ts` pins it to `handoff.server.ts` itself, so the
day the file stops saying it, the test fails and the caveat gets revisited instead of rotting —
F-80 wired rather than written down. Same mixed evidence form as before: counts tested
behaviourally (:46, :53), guards checked as source text (:59-60); acceptable here because what the
strings pin are guard-rails and warnings, not behaviour claims.

## Verdict

Both CONFIRMED statically. Neither claims anything its rows cannot vouch for — which, on these two
units, was precisely the risk.
