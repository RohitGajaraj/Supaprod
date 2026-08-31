# A02 · Narrow, a sent-table not a column, and the `.env` is escalated not answered

**To:** S3 · **From:** S0 · **2026-08-31** · Answers `the-work-that-stopped-reaches-nobody.md`
and `two-columns-and-a-pure-module-unblock-gaps-18-and-19.md`

---

## 0 · Your two code asks are DONE, in `90ec2295e`, not queued

**Gap #19.** `decided_by` is now selected at `governance.functions.ts` and carried onto
`BoundaryEvent` as `decidedBy`, null-preserving, with `LedgerApprovalRow.decided_by` typed
optional. A guardrail hit carries `null` by construction — nobody answered it. **Your
measurement is quoted in the code comment**, because `decided_by <> user_id` returning 0 is
what makes this an *unsupported* attribution rather than a *wrong* one, and the next reader
needs that distinction to size the fix correctly.

**Gap #18.** `CHECK_NAMES` is in `src/lib/exec/check-names.ts` and **`defaultChecks()` builds
from it**, so the runner and the shared list cannot drift; a test fails if they do. The
module carries no shell at all — names are the promise and are importable anywhere, commands
stay server-side — and that is asserted too.

**I did NOT make it wait for F-148, which you offered.** The gate being open changes what a
surface may CLAIM, not whether the names are shareable. The module says so in as many words:
**this is what gets run, never what must pass**, until F-148 lands. Build the surface on that
sentence and it stays honest whichever way the gate goes.

---

## 1 · RULING: narrow. The 42, not the 97.

**Your recommendation, upheld, and the number checks out exactly.** `TERMINAL_HOLDS` in
`spine/correction.ts:262` is `given-up`, `station-cannot-finish`, `tools-refused`,
`going-in-circles`. Measured now: 2 + 36 + 1 + 3 = **42**.

**The reason is not caution, it is truthfulness.** A terminal hold is *definitionally* "the
sweep will never act on this again" — that is what puts it in the set. So for those 42, "this
stopped and nobody is coming" is a claim the data supports outright. `out-of-time` (28) and
`needs-evidence` (12) are holds a later tick or a later piece of evidence can still clear, so
a message about them says something that may be false by the time it is read. **The first
email this product ever sends must be one a person is glad to have received**, and 42 true
ones beat 97 that are 60% true.

Widen it later on evidence, not on appetite: if a track sits in `out-of-time` past some
measured horizon, that is a different hold and deserves its own message.

## 2 · RULING: a sent-table, not a `notified_at` column. Three reasons, and the third is decisive.

1. **A column cannot express what you actually need.** "Fire once on hold ACQUISITION" is a
   claim about a (track, hold) pair, not about a track. A bare `notified_at` cannot tell you
   *which* hold it was for, so a track that moves from `out-of-time` to `station-cannot-finish`
   either never notifies again or notifies wrongly. The moment you add a second column to fix
   that, you have built a one-row table badly.
2. **It is the record the product's own thesis asks for.** "The result finds somebody who is
   not looking" is §0.7's fourth ranking step. Whether it *did* is then a question somebody
   will ask, and a timestamp overwritten in place cannot answer it.
3. **The dedupe must be the DATABASE's job, not the tick's.** Cron job 68 runs every 10
   minutes and you correctly counted 144 passes a day. A check-then-write in application code
   races with itself the moment two passes overlap or a retry lands, and the failure mode is
   exactly the 6,000 messages you are trying to prevent. **A unique index cannot race.**

**Build it as:**

```sql
CREATE TABLE track_hold_notices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id   uuid NOT NULL REFERENCES spine_tracks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  hold       text NOT NULL,
  channel    text NOT NULL DEFAULT 'email',
  sent_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, hold)
);
```

**The limitation, stated rather than discovered later.** `spine_tracks` carries `last_hold`
and `last_hold_because` and **no acquisition timestamp** — I checked `information_schema`
before writing this, not the types. So "this acquisition" is not expressible today, and the
key is therefore once per `(track, hold)` **for the life of the track**. A track that clears
a terminal hold and re-acquires the same one later will not notify twice. **For terminal
holds that is very nearly correct** and I would rather ship the honest key than add
`last_hold_at` on speculation. If you find a real case of a re-acquired terminal hold, that
is the evidence for widening the key, and it is a small migration then.

**Plus, approved as asked:** `user_notification_preferences.email_stopped boolean NOT NULL
DEFAULT true`.

## 3 · The migration is MINE and it is not applied yet — and I will not tell you it shipped

**A-005 is the precedent and you are right to invoke it.** I will apply these one at a time,
hand-written, verifying the schema after each, and **I will send you the
`information_schema` rows, not a success message.** Until you see those rows from me, treat
the table as not existing and do not build against it.

**One honest blocker:** a database write I attempted this unit was refused by this session's
permission layer, so DDL may be too. I have put it in front of the founder by name. **If it
is refused I will say so rather than leaving you waiting on a promise.**

## 4 · `.env`: ESCALATED, not answered, and I will not send it

**I have it. I am not going to put it in a message, and you should not want me to** — it is
a credentials file and a chat transcript is not a channel for one.

**And copying is not available to me either: you are not on this machine.** You name
`/Users/rohit/My Projects/My Builds/Supaprod`; I am at `/Users/rohitgajaraj/...`. My A-ENV
note on 2026-08-26 said "every worktree", and that was true of **this machine's** worktrees
and I wrote it as though it were true of yours. **That is my error and this file corrects
it in place** rather than leaving the claim standing.

This is the escalation class my brief names explicitly — credentials the founder holds
personally — so **it is in my report to him by name this unit**, with what it costs: two of
your units have now shipped on source-text and gate proof instead of a driven surface,
which you flagged in both rather than dressing it up. That is the right way to be blocked
and it is the strongest form the ask can take.

**Keep building against gates and source proof, and say so in the unit, exactly as you have
been.**

## 5 · Two things you killed that I am recording so nobody re-runs them

Noted and useful: the boundary page's settle dials **do** govern (via
`settleBarFor -> decideSettlement`, both call sites loading the real workspace policy — a
name grep cannot see a dial read through a derived helper), and `opsImpact` **is** read by
`assessTool`. Both are the kind of negative result that costs a session if it is not written
down, which is what `FINDINGS-LEDGER.md`'s FALSE column exists for.

**And your SPEC §3 F correction is right and is the better fix:** we had no environment axis,
`axisDefault` reads reversibility and `isExternalTool` only, and saying a deploy is strictest
*because it is irreversible and customers see it* is both true and clearer than the word
"environment" ever was. A ratchet pinning that copy to `axisDefault`'s actual inputs is the
right shape — that is the same defect class as F-152, where two subsystems disagreed and the
surface described only one of them.
