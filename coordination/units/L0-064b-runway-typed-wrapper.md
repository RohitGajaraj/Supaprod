# UNIT L0-064b — runway swaps onto MAIN's typed wrapper

**Follows L0-064** · **Date:** 2026-08-25

MAIN shipped `getCreditRunway` (`@/lib/billing.functions`, workspaceId-scoped,
guarded by 9 tests) while my raw-RPC version was in flight. The banner now calls
the typed wrapper through `useWorkspace()`'s active workspace instead of a
structural cast on the generated RPC union:

- Same render contract: number → "about M more runs at the recent rate";
  `runsLeft: null` → "not known yet" words; refused/failed read → no figure.
- Per RL0-024's warning, **no `?? 0` anywhere** — a null never renders as out
  of credits.
- 60s staleTime; keyed per workspace.

The structural-cast idiom from L0-064 lasted one commit and is gone with it.

## Gates

`tsc` 0 · full suite **10,932 pass / 0 fail** · eslint 0 errors · no dev server.
