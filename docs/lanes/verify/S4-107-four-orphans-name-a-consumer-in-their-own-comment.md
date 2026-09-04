# S4-107 · Four orphans name a consumer in their own comment, and one is a duplicated write path

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27. A ranking on top of `S4-104`, suggested by the shape of S3's `getWorkspacePauseState`._

## The filter

Of the 141 server functions with no importer, **four name their intended consumer in their own doc
comment.** That is different in kind from something staged ahead of a surface: **the author knew who
was meant to call it, wrote it down, and the wiring never happened.** Nobody stages that deliberately.

| function | its own comment |
| --- | --- |
| `getWorkspacePauseState` | *"probe used by AppShell"* |
| `listProducts` | *"Used by the ProductBindingsSection to drive the per-product binding UI"* |
| `listPlatformProviders` | *"Used by the model picker to surface…"* |
| `setStationWaiver` | *"The next tick then drives the station"* |

## Two are already known, which is the tool validating rather than finding

**`getWorkspacePauseState`** is S3's, found by hand and fixed in U-077. My scan reached it
independently.

**`setStationWaiver`** is documented in `spine/route.ts:58-70` in more detail than I could have
produced: *"a repo-wide grep finds no caller of it whatsoever: no UI, no route, no test"*, with a
named control grep to prove the zero is real, and the observation that **a caller alone would not be
enough** — the handler hard-codes `reopensWhen: "never"` and calls `reopen` without `force`, which
`reopen` refuses, so it would write the unchanged path and **return `problems: []`, a no-op reported
as a success.**

That paragraph also records having been wrong twice before. It is the best-documented gap in this
repo and my tool rediscovering it is a check on the tool, not a finding.

## The one that is new: two modules implement product bindings

`ProductBindingsSection.tsx` is live, rendered on `/sync`. It **reads** from one module and **writes**
through another:

| | module | status |
| --- | --- | --- |
| `listProductBindings` | `connectors/product-binding.functions.ts` | **used** |
| `addProductBinding`, `removeBinding` | `connections.functions.ts` | **used** |
| `upsertProductBinding`, `removeProductBinding`, `listProducts` | `connectors/product-binding.functions.ts` | **orphaned** |

**So the connectors module's entire write half is dead, while a second implementation in
`connections.functions.ts` does the work.** And `listProducts`, the orphan, says in its own comment
that `ProductBindingsSection` uses it — naming a component that exists, is live, and does not.

**Two write paths for one object is the shape that produces disagreeing rows**, which is worth
holding beside `S4-021`: one binding of three renders `label = RohitGajaraj/helio-prism-build` while
`id = Supaprod/relay-homeowner-app`. **I am not claiming this caused that** — I have not traced which
path wrote that row — but a duplicated writer is the first place to look.

## `listPlatformProviders` is unresolved

Its comment names *"the model picker"*. No importer, and I found no component matching a model
picker by name. Either the picker is named something else or it was never built.

## The three-way test, answered on a real row

`S4-104` says a row is one of three things and only reading it tells you which: a gap worth closing,
something staged ahead of a surface, or genuine dead weight. **All three have now been demonstrated
on actual rows, by three different people, within an hour.**

| row | verdict | who established it |
| --- | --- | --- |
| `getWorkspacePauseState` | **a gap.** Every empty queue read as *quiet* rather than *held* | S3, shipped the banner |
| `setStationWaiver` | **a gap, and documented as one** before either of us looked | `spine/route.ts` |
| `getNeedsYou` | **superseded. Dead weight. Nobody should wire it** | S2, with evidence |

S2's evidence on the last is worth keeping, because it nearly went the other way. `getNeedsYou` still
runs — all twelve tables it reads resolve and eleven hold rows — and its own comment states an
architectural rule the board appears to violate. **But `getApprovalsQueue`, which the board does use,
reads the same ten tables PLUS six more** and emits an item kind for every class `getNeedsYou`
counts.

So wiring it would put **a second source under one question** and produce a different count from the
same tables. S2 had already counted 35 items with its filters and was one step from reporting that
the board hides them.

**That is the strongest argument yet that this list is not a delete order and not a wire-it-up order
either.** Three rows, three different right answers.

## What I am not claiming

- **The comment phrasing is a heuristic**, matching `used by`, `rendered by`, `powers`, `drives` and
  four others. A function whose comment names a consumer in different words is missed.
- **Four is not the total.** It is four of the 141 whose comment says so out loud.
- **I did not check whether the two write paths behave differently**, only that both exist and one is
  unreachable.
