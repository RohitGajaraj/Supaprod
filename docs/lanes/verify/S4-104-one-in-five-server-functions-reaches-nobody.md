# S4-104 · 141 of 656 server functions cannot be reached by anything a person opens

> _S4, 2026-08-27. S3 suggested the method after tracing four dead Settings toggles by hand. Run it
> with `bun run e2e/helpers/unreachable-server-functions.mjs`._

## The number

```
141 of 656 server functions have NO importer in src/.
5 more are inside dynamically imported modules and are NOT counted.
0 files use a namespace import of a functions module.
```

**More than one in five.** They exist, they compile, several have tests, and **nothing a person can
open calls them.**

## Whole features, not scattered leftovers

| file | orphans |
| --- | --- |
| `calendar.functions.ts` | **9** |
| `meetings.functions.ts` | **6** |
| `today.functions.ts` | 5 |
| `threads.functions.ts` · `audio.functions.ts` · `demo.functions.ts` · `linear.functions.ts` · `agent_loop.functions.ts` | 4 each |
| `connectors/product-binding.functions.ts` · `studio.functions.ts` | 3 each |

Nine calendar functions and six meeting functions is not drift. **That is a feature built end to end
and never given a door.**

`today.functions.ts` is the sharpest case, because `/today` is the product's home screen and it does
**not** use it. Its feed is assembled from `approvals-queue`, `missions`, `outcome`,
`spine/track`, `studio` and `brain-insights`. `getNeedsYou`, `getColdStart`, `snoozeApproval`,
`getRecentExecutedUnattended` and `getMemoryExpiry` sit in a file named after the screen that ignores
them. The only export of that module anyone imports is `getCompounding`, and `/brain` uses it.

## It independently confirms S3's finding

S3 traced four Settings toggles by hand: the preference saves, `getNotifications` computes the feed,
and no surface renders it. **`getNotifications` appears in this list, found by a different method
that knew nothing about their investigation.** Two instruments, one answer, which is the only reason
either of us should be believed tonight.

## Why this is a product question rather than tidiness

The operating model's defect is *"three surfaces, not 119 routes"*. **This is the same defect measured
from the server side**: work that was built, works, and reaches nobody. It is also the cheapest
available answer to *"did we build a thing, or a demo of a thing"*.

And it bears directly on `S4-094`: 166 runs and 7.1M tokens produced 31 artifacts in a day. A product
where a fifth of the server surface has no consumer is a product where a great deal of correct work
does not arrive anywhere.

## Verified to discriminate, because a check that flags everything is not a finding

`listMissions`, `listTracks`, `listLearnings`, `getCompounding`, `listStudioSessions` and
`decideDesignGate` all have callers and are all correctly excluded.

S3's warning is built in: this counts **importers, not mentions**. Their first pass returned zero
orphans because it matched any occurrence of the name, including inside the file's own comments.
`getNeedsYou` has five mentions in `src/lib` and **not one is an import**.

## What I am not claiming

- **An orphan is not automatically waste.** Some are deliberately staged ahead of a surface, and
  `demo.functions.ts` may be driven from outside `src/`.
- **Dynamic imports are excluded conservatively**, five of them, because a wholesale module import
  makes every export reachable.
- **I did not check whether any orphan is called from a route in `src/routes/api/**`** by a path this
  scan cannot see; the scan does read those files, so a named import there would count.
- **This says nothing about how many SURFACES are unreachable** — that is `S4-068`, where the answer
  was that nothing in the router is dead.
