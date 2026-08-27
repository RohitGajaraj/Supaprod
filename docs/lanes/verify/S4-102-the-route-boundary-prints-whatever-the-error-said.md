# S4-102 · The route error boundary prints whatever the error said, and one public page proved it

> _S4, 2026-08-27. Two code-level findings, both bounded by what I could actually demonstrate rather
> than by what the code permits._

## 1 · `router.tsx` renders `error.message` verbatim, to whoever is looking

```tsx
// src/router.tsx:37
const message =
  error instanceof Error && error.message
    ? error.message
    : "Something went wrong while loading this page.";
```

That string goes straight into the page. **Demonstrated on `/proof`, a PUBLIC marketing page**, which
rendered:

> **This page hit an error.**
> Missing Supabase environment variable(s): SUPABASE_SERVICE_ROLE_KEY. Connect Supabase in Lovable
> Cloud.
> `[Reload the page]`

A public visitor is told the name of a missing environment variable and the vendor product to go and
configure. That is the general form of the transport-error leak S3 fixed at component level: they
routed 30 call sites through `error-copy.ts`, which S0 ruled the one home, and **the route boundary
does not use it**.

**The fix is one line**, sending `message` through the same helper the components now use.

### What I could NOT demonstrate, and it lowers the severity

**I created the condition.** My harness omits `SUPABASE_SERVICE_ROLE_KEY`, and in production that key
exists. So I went looking for an ordinary route error that would reach the same boundary, and did not
find one:

`/runs/not-a-real-mission-id`, signed in, renders the app shell and a handled failure — *"This run did
not load. Unauthorized: Invalid token Try again"* — never touching the boundary. **The components
catch first, which is the boundary working as a last resort should.**

So: **the leak is real in the code and I have shown it reaching a public page only under a
configuration fault I induced.** Worth fixing because it is one line and because the one condition
that reaches it is precisely a misconfigured production, which is when you least want the page
naming your infrastructure.

## 2 · A silent swallow on the function behind `/proof`

```ts
// src/lib/decisions-share.functions.ts:314-318
if (error || !data) return [];
…
} catch {
  return [];
}
```

`listPublicDecisions()` feeds `/proof`, the public page whose whole job is to show real decisions as
evidence. A failed read returns an empty list with **no logging and no error marker**, so *"the
database did not answer"* and *"there are no public decisions"* are the same screen.

**Contrast the good pattern in the same codebase:** `approvals-queue.functions.ts:264` calls
`familyFailed("trust graduation")(e)` **before** returning `[]`, so the caller knows which family
failed and can say so. That is a handled failure. The one above is a swallow.

**I could not demonstrate this one reaching a user either**, for the same reason: the route throws on
the missing service key before the catch matters. It is real in the source and unproven on screen,
and I am filing it as that rather than as a live defect.

## The population, so the shape is clear

**243 `catch` blocks across 160 `*.functions.ts` files. Seven return an empty result within three
lines.** Of the four on user-facing paths, one records the failure first (`approvals-queue`, correct)
and three are silent (`decisions-share`, `design-memory`, `routing-console`).

**That is a small number, and it is the class S1 found by rendering rather than reading**: `TrackStart`
saying *"Nothing is in flight"* on `/plan` beside work that was moving. A swallowed read does not
look like a bug from the source; it looks like an empty product.

## What I am not claiming

- **Three silent sites is not three defects.** `design-memory` wraps an AI extraction where an empty
  result is arguably valid, and `routing-console` is an admin surface. Only `decisions-share` is on a
  public page whose purpose is evidence.
- **I did not audit the other 236 catch blocks**, only those returning an empty result within three
  lines of the `catch`.
