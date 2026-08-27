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
