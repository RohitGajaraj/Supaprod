# S4-064 · The first signed-in dead backend test, and two surfaces that claim what they cannot read

> _S4, 2026-08-27. Three product surfaces rendered signed in, against a database that does not
> exist, and photographed. Screenshots in `docs/screenshots/s4-motion/` (gitignored)._

## How this became possible, because it was blocked until now

Every dead backend measurement so far was of the PUBLIC pages, because signed out all six product
routes redirect to `/login` and you end up measuring the login page. Logging in properly is
impossible here by construction: the whole point is that the database is unreachable, so no
credential can be checked against it.

`_authenticated.tsx` calls `supabase.auth.getSession()`, which reads `localStorage` and makes no
network call, and `previewAuthStorage.ts:18` returns plain `localStorage` in an unframed browser. So
a session-shaped value under the key supabase-js derives from the URL renders the authenticated
shell while every data read behind it fails. `e2e/helpers/dead-backend-session.mjs` fabricates it,
and `bash e2e/check-motion.sh --signed-in /today /approvals` runs it.

**It is not a credential and cannot reach a live system**: locally fabricated, signed by no real
secret, and the only server it is ever sent to is a port with nothing listening.

## What passes, and it is most of it

**`/today` is honest.** Header reads *"Cannot see what is running"*. The body says, in red,
*"This could not be read, so it cannot tell a quiet morning from a workspace it never saw."* with a
**Try again**. No counts, no fabricated quiet morning.

**`/approvals`' error card is the standard the rest should meet:** *"The queue did not load. Nothing
has been settled and nothing has been lost. The queue is still whatever it was a moment ago; this
screen just could not read it."*

**The station strip reads `count unavailable` across all seven** on both surfaces. It would have
been trivial to render `0`.

**`/learn` leads with *"The record is not readable right now."*** and marks four separate blocks as
failed rather than empty.

## Finding 1 · `/approvals` says "Nothing is ready for you." when it could not read the queue

**Owner: whoever owns `routes/_authenticated.approvals.tsx`** · **live** · one line

```ts
// _authenticated.approvals.tsx:564
const headline = queue.isLoading
  ? "Approvals"
  : n === 0
    ? "Nothing is ready for you."   // <- reached on a FAILED read
```

`queue.isError` is never consulted. On a failed read `isLoading` is false and `n` is 0, so the page
puts *"Nothing is ready for you."* in its largest type directly above a card explaining that the
queue could not be read. **The screen asserts the queue is empty and unreadable at the same time.**

This is `S4-032`'s class, and this file already knows the rule: `:580` includes `!queue.isError`
before deciding somebody is in no workspace, and `:656` branches on `queue.isError` for the card.
**The heading is the single place it was missed.** One `isError` branch closes it.

## Finding 2 · `/learn` says "Nothing is waiting to graduate" without asking anything

**Owner: whoever owns `routes/_authenticated.learn.tsx`** · **live**

`:899` renders `<NoPromotions />` unconditionally. There is no query behind it, failed or otherwise.
The section always reads *"Nothing is waiting to graduate."*

The comment above it is careful and its reasoning is right: no resolver returns rows that answer the
scope question, and feeding `PromotionCard` the wrong rows would mean inventing a `kind`, which is
fabrication. **Declining to fabricate cards is correct. The empty state is still a claim**, and a
person reads it as "the promotion queue was checked and is empty" when nothing was checked.

> **I first wrote this up as a missing `isError` check and it is not.** It is a hardcoded empty
> state, which is a different fix and a different owner. Recorded because the wrong cause would have
> sent someone to add error handling to a component that performs no read.

## Taste, against the frontier bar

`/learn` renders **`The record did not load. Unauthorized: Invalid token`** to a person. The first
sentence is the product speaking; the second is a transport error that escaped. Nobody outside this
repo can act on "Invalid token", and the surrounding surfaces are written to a much higher standard.

## Checked and NOT a defect

**The sidebar highlights "Runs" while `/learn` is open, and that is deliberate.**
`AppFrame.tsx:380` declares the Runs item `owns: LOOP_STATIONS`, and Learn is a loop station. I had
this written as a navigation bug before checking the nav config.

## What I am not claiming

- **Three surfaces, not six.** `/work`, `/brain` and `/threads` are unmeasured.
- **The "still moving" result on all three is not a finding.** It is the header's own wait
  indicator, which is what `S4-054` says pixel hashing cannot separate from state.
