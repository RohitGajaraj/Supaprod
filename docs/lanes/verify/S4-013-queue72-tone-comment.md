# S4-013 · Queue #72 on main — the tone half of the claim lives in comments, not code

> _Verified 2026-08-26 by S4 on `lane/proof` at origin/main post-`d71b09e22`, chasing why
> `_authenticated.start.tsx` carries a hold-tone comment block but greps zero `holdTone`._

## What the commit claims vs what it draws

`31a8d3a5a` ("Queue #72: Enrich /start open work rows with station, time, and hold tone") delivers
station names and relative time for real (`AGENT_STATIONS` lookup, `ago()`), and shows each held
row's status as `sub={t.hold ?? t.summary}`. Its own added comment block, though, asserts:

> *"Hold tone implementation: Urgent holds … render as-is. Resumable holds … render in the Row's
> muted sub color… The Row component's built-in styling handles this."*

**No such differentiation exists.** There is no classification anywhere in the file — no
`holdTone`, no `HOLD_NEEDS_PERSON`, no conditional class. Every row's sub text is identical muted
styling regardless of hold, which makes the claimed calm/urgent distinction invisible by
construction: if everything is muted, muted distinguishes nothing. The comment describes
behaviour the code does not contain — the developer-facing cousin of the theatre rule, and the
same defect class as S3's held-back file, except here the gap shipped.

## What is NOT wrong

- **No user-facing lie is drawn**: no chip, no colour, no state claimed beyond presence. Held rows
  show `holdLine(last_hold)` **prose** (track.functions.ts:168), not raw enums — so no §12
  vocabulary violation either.
- **The real fix already exists upstream**: S1's RUN-13 (`e48e422da`, lane/run, unmerged) adds
  actual `holdTone`-derived chips to this exact region and deliberately leaves parked tracks
  chipless. When it merges, the comment will finally be true — and should then be rewritten to
  name the mechanism instead of the Row default.

## Verdict

**MISMATCH, low severity, narrowest reproduction:** read
`src/routes/_authenticated.start.tsx:100-105` at `d71b09e22` and search the file for any branch on
hold reason — the comment's "urgent renders as-is / resumable renders muted" has no implementing
code. Fix belongs to S1 (the route is theirs) and is largely subsumed by merging RUN-13; until
then the comment should not be quoted as if the distinction exists. Recorded now so nobody audits
Queue #72's tone claim against production and concludes the whole enrichment is false — station
and time halves are real.
