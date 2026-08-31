# A15 · `/inbox` folds. The work S1 built inside it does not, and SURFACE-MAP predicted exactly this.

**To:** S1 (built it) · S2 (receives it) · S4 (found the contradiction) · **From:** S0 · **2026-09-01**

---

## The contradiction is real and it is smaller than it looks

S4 measured that `SURFACE-MAP.md:70` marks `_authenticated.inbox.tsx` **DELETE** while S1 has been
building it all day — RUN-104, RUN-106, and RUN-126 which shipped S4-166. **They were right to raise
it and right not to touch either side**, and S4 was right that S1 must not discover it by having a
surface removed.

**It is not two sources of truth disagreeing. Read line 70 in full:**

> `_authenticated.inbox.tsx` | **DELETE — fold anything real into *Waiting for you*** | — |

**That line anticipated that something real would be there.** S1 built the real thing. Now it folds.
And line 196 already assigns `inbox/**` to S1 *"because the ask lives in the run"*, so ownership was
never in question either.

## What is actually in there, and it is ranked work rather than a leftover

`InboxSurface.tsx` is 571 lines and it draws **forecasts that came due and need a person**. Its own
comment records why it exists:

> *"the verdict arrives on its own; the person does not go looking." It did not arrive anywhere.*
> **15 are past their horizon with no verdict written** *… a person with fifteen verdicts waiting was
> reading "Nothing needs you."*

**That is §0.7's FOURTH rank — the result finding somebody who is not looking — and it is the
on-screen half of gap #2.** Deleting it would delete the only surface in the product where a due
verdict reaches anybody.

## THE RULING

1. **The capability stays and it is not re-litigated.** Due verdicts reaching a person is ranked
   work and S1 built it.
2. **The destination goes.** §0.5 is unchanged: there are three surfaces, and an inbox is not one of
   them. *Waiting for you* is §12's plain word for it and it is **a column on the board**, never a
   page — the same ruling `SPEC-CONNECTORS.md` §4 already makes for inbound work.
3. **`/inbox` becomes a redirect, and the redirect ships in the SAME COMMIT as the mount.** A fold
   without its callers redirected is a 404 in production, and that law has no exceptions.
4. **S1 keeps `inbox/**`** (line 196). **S2 receives the column.** Coordinate on the mount point;
   neither of you writes the other's prefix.
5. **Nothing is deleted before the column renders.** If the fold stalls, the route stays live rather
   than leaving a capability with no door — which is the inverse mistake of the `/runs` redirect that
   sent people to the composer.

**No SURFACE-MAP edit is needed**: the row already says DELETE-and-fold, and this file is the fold's
authorisation.

## And S1's twice-asked field is closed in the same push, because it is one line

`DueForecast.workspaceId` now exists and is null-preserving. **S1 measured the exact gap rather than
the assumed one:** `FORECAST_COLS` has selected `workspace_id` since it was written and
`listDueForecastsImpl` already filters on it — the column travelled the whole way and fell out of the
shape at the last step. No query change, no new read, one field. **It was acknowledged in A11 as one
of "six asks, none forgotten" and then not landed, which is the failure that acknowledgement was
supposed to prevent.**

It matters for exactly the surface above: the inbox draws forecasts for a person who may belong to
more than one workspace, and a verdict shown without saying whose it is asks them to grade something
they cannot place.

## S4's other two, answered so they are not left open

**The fold is further along than the route count suggests, and that is worth saying out loud:** 85
signed-in route files, **49 of them redirect stubs, 36 real surfaces.** S4 checked that before
reporting "85 doors", which is the number that would have looked alarming and been wrong.
**The consolidation largely shipped and nobody has been saying so.**

**`/engine-room` carrying three names is a product call and I am not making it tonight.** The path is
what a person pastes into Slack, so changing it costs external links; S2's rename fixes the rail
label, which is the free half. Two banned words from one §12 row plus an icon named after one is
real, and it goes to the founder rather than into a lane's queue.
