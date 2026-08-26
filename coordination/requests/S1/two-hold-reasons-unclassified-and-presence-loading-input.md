# S1 → S0: two hold reasons broke the partition guards, one presence input is missing, and `.env` for browser checks

> Filed 2026-08-26 by S1, at session start, before any of my units.

## 0. `.env` — what unblocks an actual browser drive

No `.env` exists in any supaprod-v4 worktree (only `.env.example`). The Supabase client throws at boot without `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (`src/integrations/supabase/client.ts:9-20`), so Playwright cannot reach `/start` or `/track/:id` from here. I need those two client-safe values copied into `supaprod-run/.env` (server secrets not needed for UI checks) to drive my surfaces. Until then my proof is tests + gates; every unit log says so plainly.

## 1. `self-check-failed` broke the partition guards (corrected after deeper read)

`HoldReason` now carries **18** reasons; `HOLD_LINE` covers all 18. The one S0-001 added without updating its guards is `self-check-failed`:

- `src/lib/spine/correction.test.ts:130` — fails: `self-check-failed` is in neither `RETRIED_UNTOUCHED`, `ENDS_OR_WAITS`, nor `CORRECTABLE_HOLDS`. Its own doc comment says the fix is better work from the same seat ("always resolvable by the station itself, so it does not reach a person"), which reads as RETRIED_UNTOUCHED — your call, your file.
- `src/components/spine/__tests__/a-hold-says-whose-it-is.test.ts` — MINE, fixed in RUN-05: count 17→18, amber list carries it with the reason recorded.

## 3. Full-suite failures inventoried on `62feb61f4` (+ my RUN-05 state)

Clean run on my tree after my fixes: **11422 pass / 3 fail**. All three are in your paths:

1. `src/lib/spine/correction.test.ts:130` — `self-check-failed` in neither correction list (see §1).
2. `src/lib/spine/a-crew-split-by-the-clock-still-filed-its-work.test.ts:118-123` — source-text assertions against `driver.server.ts`: expects the literal `if (!producedThisVisit)` and the absence of `if (attached.length === 0) {`; the S0-001 refactor moved both.
3. `src/components/meridian/__tests__/tool-stream.test.tsx` — "animates none of 500 rows present at mount", ~7.9s then fails inside happy-dom; looks timing-bound rather than behavioural, but that is your read to make.

(The fourth earlier failure was mine and is fixed in RUN-05.)

## 2. `PresenceInput` cannot distinguish "reading" from "cannot find"

`deriveCharacter` (`src/lib/presence/character.ts:163`) returns `out-of-touch / "I can't find this piece of work"` whenever `track` is null. On `/track/:id?start=true`, that is exactly what a person sees during the first read after assigning — before `getTrack` resolves — so the first sentence the character says after being handed work is a false alarm. I am patching around it in my prefix (not mounting the character until the first read settles), but the clean fix is yours: an optional `loading?: boolean` on `PresenceInput`, returning an honest reading line, so every future mount inherits it.
