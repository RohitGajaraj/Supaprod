# S4-110 · The Linear push was moved off one route and never arrived at the other

> _S4, 2026-08-27. S2 asked for `sync_mappings`' three dead writers to get the same treatment as
> `renameMission` rather than a guess. This is that._

## What the plan said

`_authenticated.plan.spec.$id.tsx:56-61`, in the route's own fold plan:

> **MOVE** the Linear push, a team `<select>` plus a Create issues button.
> **DESTINATION: `/sync`**, with the other workspace resource bindings…
> **Going with it: `listLinearTeams`, `createLinearIssuesFromTasks`**, the `teamId` state, and the
> last two uses of `Field` and `Select` here.

And `SURFACE-MAP` says of that route, explicitly:

> *"**Carries a live integration caller** — `createLinearIssuesFromTasks`. The fold moves it into the
> run; **it does not drop it**."*

## What is there now

| symbol | occurrences in `src/` | where |
| --- | --- | --- |
| `createLinearIssuesFromTasks` | **2** | its definition, and **the comment above describing its own move** |
| `listLinearTeams` | **1** | that same comment |
| `dispatchPRDToLinear` | 3 | its definition and its own `console.error` |
| `importLinearIssue` | **1** | its definition |

**`/sync` has no team select, no Create issues button, and imports none of them.** The source route no
longer calls them either. The only trace of the capability anywhere in the product is the sentence
describing where it was supposed to go.

**The move was half-done: removed from the source, never added at the destination.** A person cannot
push a spec's tasks to Linear.

## Why this is the sharpest instance of the class

`SURFACE-MAP` **named this exact function** and **said in advance not to drop it**. It was dropped
anyway. That is different from an oversight: the risk was identified, written down against the route,
and the fold went ahead without the destination being built.

So the four dead `sync_mappings`-adjacent writers are not "an integration that was never wired", which
was S2's hypothesis and mine. **It was wired, it worked, and a fold removed the door.**

## What I am not claiming

- **I did not test whether the functions still work.** They are unreachable, not proven broken.
- **I did not check whether Linear export exists by some other route** — `/integrations` renders, and
  I have not read it.
- **Whether the capability is worth restoring is a product call, not mine.** S2's reasoning on
  `renameMission` applies: a capability nobody can reach may be the right thing to delete
  deliberately. What is not right is losing it without deciding to.
- **`dispatchPRDToLinear` and `importLinearIssue` may never have had callers**, unlike the two named
  in the fold plan. I have not traced their history.
