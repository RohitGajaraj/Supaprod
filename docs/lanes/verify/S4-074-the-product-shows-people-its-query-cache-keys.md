# RETRACTED. THIS WAS MY INSTRUMENT, NOT THE PRODUCT.

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> **Do not act on this file. I sent S3 three call sites off it and that was wrong.**
>
> S1 has a strictly better instrument: sign in for real with the demo account, then corrupt the
> stored access token in place. The guard still finds a session-shaped value and renders the
> authenticated shell, and every server call is rejected by `requireSupabaseAuth` with the genuine
> string. Nothing is faked but the token's signature, so the middleware runs and the real error
> mapping runs.
>
> **Under that, across seven surfaces and four runs, no cache key appears anywhere.**
>
> I confirmed their source claim rather than taking it: `pm-impact.functions.ts:50-56` has an
> explicit no-workspace branch returning `{ ledger: EMPTY_LEDGER, markdown, workspaceName: null }`.
> **The handler always returns an object and can never return `undefined`**, and it sits behind
> `requireSupabaseAuth`, which throws against a genuinely expired session.
>
> So `data is undefined` cannot come from the handler. It comes from **my `page.route` interception
> returning a 401 body that the TanStack Start serverFn client resolves as undefined instead of
> throwing**, after which TanStack's own error, which embeds the key, is what exists to render.
>
> **This is the third time tonight a finding turned out to be the instrument, and the first time
> another lane caught it for me.** The pattern in all three: I measured a thing my tool created.
>
> **What survives, and it is a question rather than a finding:** if the serverFn client really can
> resolve `undefined` on some error shapes, that is a latent bug for any non-401 failure carrying a
> body. S1's words, which I agree with: worth a look by whoever owns that layer, **not by either of
> us on this evidence.**

---

# S4-074 · The product shows people its query cache keys

> _S4, 2026-08-27. Found by the expired-session mode S1 built and S4 adopted, on its first two runs.
> `bash e2e/check-motion.sh --expired-session <paths>`. Four surfaces, one cause._

## What a person reads

| surface | on screen, verbatim |
| --- | --- |
| `/learn` | The record did not load. **`["impact-ledger",null] data is undefined`** Try again |
| `/brain` | The standing rules did not load, so this is not a claim that nothing is standing. **`["brain-standing",null] data is undefined`** |
| `/brain` | The calls did not load, so this is not a claim that none are on the record. **`["decisions",{}] data is undefined`** |
| `/settings` | Your profile did not load, so nothing here is safe to save yet. **`["profile"] data is undefined`** |

**Each sentence is followed by a React Query cache key.** The first half of every line is the product
speaking, carefully; the second half is the client library's internals.

## One cause, and it is not the copy

`learn.tsx:396` is `queryKey: ["impact-ledger", recordWorkspaceId]`. When the read fails, the query
function **returns `undefined` rather than throwing**, and TanStack Query's own error for that case
embeds the offending key. The surface then renders `error.message` raw.

So there are two halves and both need doing:

1. **A query function must throw on failure, not return `undefined`.** Returning undefined turns a
   read failure into a library-contract violation, and the library's complaint is not written for a
   person.
2. **No surface should render `error.message` raw.** S3 built exactly the right thing tonight,
   `readFailureMessage()` and `sessionEndedMessage()` in `roles.functions.ts`, and **exported it**.
   Nine Settings call sites already go through it. These four do not.

## Why the dead-backend harness never found it

A dead port fails every request identically, including the ones the shell needs, and these surfaces
never got far enough to run the query that misbehaves. **An expired session is narrower**: the app
loads, the guard passes because `getSession()` reads `localStorage` and asks nobody, and only the
authenticated reads fail. That is a tab left open overnight, and it is the common case.

**Two modes, two classes of defect.** This is the argument for keeping both rather than picking one.

## Owners

- `/learn` — **S1**
- `/settings`, `/brain` — **S3** owns `settings/**` and the helper; `brain` routing is theirs to
  confirm, since they told me Brain is not their path while `SURFACE-MAP` line 178 assigns
  `components/brain/**` to them.

## What I am not claiming

- **Not verified against a genuinely expired session on a live backend**, only against a 401 carrying
  the body auth actually returns. The `undefined` return is in the source and does not depend on my
  shim.
- **`/settings` is measured before `355cd83ab`**, which is on `lane/platform` and not in my tree. Its
  copy may already read differently; the cache key is a separate half and I have no evidence that
  commit touches it.
- **Four surfaces found, not four surfaces total.** I ran seven paths in this mode.
