# S4-065 · The body handles the failure and the headline lies above it

> _S4, 2026-08-27. Seven product surfaces rendered signed in against a database that does not exist.
> `bash e2e/check-motion.sh --signed-in <paths>`. Screenshots in `docs/screenshots/s4-motion/`._

## The sweep

| surface | verdict |
| --- | --- |
| `/today` | **honest** |
| `/brain` | **honest, and the best in the product** |
| `/work` | **CORRECTED: not a route.** I invented the path. The rail's "Work" item points at `/start` (`S4-066`) |
| `/runs` | folded to `/today` on purpose, but the rail still links to it |
| `/approvals` | body honest, **headline claims an empty queue** |
| `/threads` | body honest, **headline claims nothing was ever asked** |
| `/learn` | honest, **one section claims an empty queue it never queried** (`S4-064`) |

**No counted progress advanced on any product surface**, so the assertion added in `S4-061` passes
across the app. There is no fake progress bar in this product.

## The pattern, and it is one pattern in two files

```ts
// _authenticated.approvals.tsx:564
const headline = queue.isLoading ? "Approvals" : n === 0 ? "Nothing is ready for you." : …

// _authenticated.threads.tsx:453
const headline = thread.isLoading ? … : list.isLoading ? … : "Nothing asked yet.";
```

**Neither headline consults `isError`.** A failed read leaves `isLoading` false and the count at
zero, so both fall through to the sentence that means *"we looked, and there is nothing"*.

**Both files handle the error correctly everywhere else.** `approvals.tsx` checks `queue.isError` at
`:580` and `:656`; `threads.tsx` checks it at `:522`, `:526`, `:617`, `:695` and `:702`. The body
says *"The queue did not load"* and *"Your threads did not load"* while the largest type on the page
says the opposite.

This is `S4-032`'s finding with two more live instances, and it is what makes its proposed fix worth
building rather than patching three sites:

```ts
readState(...queries) -> "loading" | "failed" | "ready"
```

where `failed` is **any** error and `ready` requires **every** query to have answered. A headline is
exactly the place a person forms their belief, and it is the one place none of these files guarded.

## What good looks like, and it already exists here

`/brain` refuses to over-claim in every block on the page:

> *"The standing rules did not load, **so this is not a claim that nothing is standing**."*
> *"The calls did not load, **so this is not a claim that none are on the record**."*
> *"The map did not load. Nothing it draws is lost, and the Graph tab still holds it."*

That is the standard. It is in this repo already, so this is not a request for new craft, only for
the craft that exists to reach two more headlines.

## The rail links to a route that was folded away

**Live, and a person can hit it in one click.**

`runs.index.tsx:29` is now nothing but `beforeLoad: () => { throw redirect({ to: "/today" }) }`. The
fold is deliberate and documented. But `AppFrame.tsx:376` still carries:

```ts
{ to: "/runs", label: "Runs", Icon: IconRuns, count: "runs", owns: LOOP_STATIONS, tier: "primary" }
```

So a **primary** rail item labelled **Runs**, showing a **runs count**, lands the person on
**Today**. Either the item goes, or it points where the surface actually lives. The fold changed the
route and left the door that opens it.

## Taste, against the frontier bar

`Unauthorized: Invalid token` is rendered to a person on `/learn` once and `/brain` twice, spliced
mid-sentence into otherwise well-written copy. The first half of each sentence is the product
speaking; the second is a transport error that escaped.

## What I am not claiming

- **`/work` rendered and settled, and I did not read its content.** No screenshot is written for a
  surface that settles, which is a gap in my own instrument rather than a fact about `/work`.
- **`/settings`, `/start` and `/guardrails` are unmeasured.**
