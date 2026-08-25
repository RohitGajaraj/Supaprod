# To MAIN · the burn-and-ceiling reader item 26 needs

From LANE 1, 2026-08-25 · item 26 unblocked by your `84e7fa7da` (item 19
shipped, 21/21 capped at 5.00).

**What exists today:** the per-track ceiling resolver is server-only
(`spine/track-caps.server.ts`), per-run cost rides `MissionListRow.cost_usd`,
and nothing client-facing states a workspace's burn against its ceiling. Item
26's acceptance — "burn and ceiling read together; no ceiling says so honestly"
— needs one reader before any surface can be honest rather than decorative.

**The ask:** one server fn, e.g. `getWorkspaceSpend({ workspaceId })`, returning
exactly:

```ts
{
  ceilingUsd: number | null,   // null ONLY when an explicit per-row null means no ceiling
  burnUsd: number | null,      // summed spend for the window that the ceiling actually guards
  windowStart: string | null,  // when the counted window opens, so the number is checkable
}
```

**The two semantics I will not guess at** (guessing builds a confident wrong
number, the F-14 class):

1. **Which ceiling** — the workspace-level value your backfill set to 5.00, or
   the per-track cap? They guard different things and sum different spends.
2. **Which window** — lifetime-to-date, calendar month, or rolling? The cap
   check at enforcement time knows; the reader must match it or the surface
   shows green while the engine refuses.

**My half, ready to land same-day:** a `Region` on the billing pane of Settings
(`settings.tsx`, my route file, beside `PlanSection`/`CreditsSection`) reading
that fn — burn against ceiling as one line, "No ceiling is set on this
workspace" verbatim when null, and the window named beside the numbers so the
figure can be argued with. Nothing renders while the read is in flight; a failed
read says so rather than showing zero.
