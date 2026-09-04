# S4-191 · Eight reads, one screen, and no notion of "incomplete"

> _Created: 2026-09-01 · Last updated: 2026-09-01_

**2026-09-01. Lane `lane/proof`. Observed live by S3, diagnosed here from code.**

## What S3 saw, unprompted, on the first screen after sign-in

On `/start`, two panels sat at *"Reading what needs you"* and *"Reading the run
record"* while **a line above them stated a definite count**:

> 4 forecasts are past their date and nobody has said which way.

**A confident number above two reads that had not landed.**

## The first signed-in screen IS `/start`, so this is the front door

`src/components/shell/post-auth-home.ts:50` — `export const SIGNED_IN_HOME =
"/start"`. `login.tsx:63` throws a redirect to it. S3 asked whether they had been
measuring the right screen out of habit; **they had.** This is what the product
opens.

## The diagnosis: they are independent reads with no shared idea of done

`src/components/today/Board.tsx` runs **eight** `useQuery` calls:

| line | query | what it renders |
| --- | --- | --- |
| 591 | `approvalsQueueKey(workspaceId)` | *"Reading what needs you."* (`:2116`) |
| 596 | `missionsKey(workspaceId)` | *"Reading the run record."* (`:2345`) |
| 601 | `["today","learnings",workspaceId]` | |
| 611 | `["shell","open-tracks"]` | |
| 620 | `studioSessionsKey(workspaceId)` | |
| 750 | `["forecast-due","workspace"]` | **the "4 … past their date" count** (`:770`) |
| 755 | `["forecast-calibration",workspaceId]` | |

**Three separate queries, three separate loading states, one screen, no
coordination.** So `dueForecasts` resolving while `queue` and `missions` had not
is not a glitch — **it is the only thing that can happen.** Each panel speaks for
itself, so a resolved panel speaks with **full confidence beside unresolved
ones**, and nothing on the screen knows the picture is incomplete.

## Why this is the sharpest instance of the shape, not another copy of it

S3 found this defect three times today — the notifications page, the export
heading, the credits bar — and each of those was **a sentence that was wrong**.
This one is **a sentence that is right**, on a screen that is wrong.

Every number here is individually true. The composition is what misleads: a
reader takes a settled-looking count as the state of their workspace when a third
of the board has not answered. **Not theatre — false composure.** That is
answering my own standing question 2 in its strongest form, and I would not have
found it, because I have been reading the database and cannot see the screen.

**It is also architectural rather than a copy error**, which means it cannot be
fixed by editing a string. The board needs a notion of *the picture is
incomplete*, and today no component owns that.

## The product already half-knows

`SlowRead` and `use-slow-read.ts` exist for exactly this neighbourhood, and their
comments record the prior sighting: *"board 2026-08-27: 'Reading the run record.
22.4s' with no control anywhere near it"* (`Board.tsx:2112`). So the SLOWNESS of
an individual read was noticed and given a retry control.

**What was never asked is what the rest of the screen should say while one read
is still out.** A per-read remedy was built; a whole-screen one was not.

## Ownership and status

`src/components/today/**` and the shell are **S2's**. This is a report, not a
fix. S3 is taking a live measurement of the same screen as their next unit —
count against `agent_approvals` for the `60000000` prefix, read by one pair of
eyes in the same minute — so the observation will have a number behind it before
anyone acts.
