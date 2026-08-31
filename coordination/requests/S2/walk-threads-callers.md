# ASK · Walk /threads callers to prepare for deletion — S0 rules

**Filed by:** S2 · S2-Q2 · 2026-08-31

## Summary

Walked the `_authenticated.threads.tsx` route (808 lines, 32 body signals) and its server functions to establish what still reaches it before S0 rules its delete. This surface is marked DELETE ("a collaboration surface, killed by R-04").

## THREADS ROUTE CALLERS

| File | Line | What it does |
| --- | --- | --- |
| `src/components/ask/AskSwitcher.tsx` | 152 | Navigation link `to="/threads"` in component |
| `src/components/shell/AppFrame.tsx` | 397 | Rail door definition: `{ to: "/threads", label: "Threads", ... }` |
| `src/lib/nav-model.ts` | 255 | Navigation model entry for command palette |
| `src/lib/legacy-redirects.ts` | 37 | Legacy redirect list |
| `src/lib/surface-registry.ts` | 796 | Registry entry: `home: "route:/threads"` |
| `src/routes/_authenticated.brain.tsx` | 1341 | Navigate button in Brain surface: `navigate({ to: "/threads" })` |

## THREADS SERVER FUNCTION CONSUMERS

| Function | Called from | Notes |
| --- | --- | --- |
| `listThreads` | `src/components/ask/AskSwitcher.tsx` line 49 | Imports and uses to fetch threads list |
| `listThreads` | `src/routes/_authenticated.threads.tsx` (the route itself) | Used in the route's own component |
| `getThread` | `src/routes/_authenticated.threads.tsx` | Used to fetch individual thread |
| `searchConversations` | `src/routes/_authenticated.threads.tsx` | Used for search functionality |
| `listFolders`, `createFolder`, `moveThreadToFolder`, `listThreadsInFolder` | **ZERO UI CONSUMERS** | Per the route's own comment (line 37-40), these have zero UI consumers as of this redesign |

## DEPENDENCY CHAIN

The route is reachable from:
1. Direct navigation link in AskSwitcher
2. Rail door (Threads row on the board)
3. Deep link via `/threads?c=<conversation-id>`
4. Brain surface can navigate to threads

## MISSING INFORMATION

**Anything reaching it from `sense-tick.ts`:** Not found. No scheduled jobs or automated systems reach `/threads`.

## ACCEPTANCE NOTES

- Every caller named with `file:line` ✅
- No active sense-tick integration found ✅
- This is a walk, not a delete ✅
- S0 rules on actual deletion ⏳
