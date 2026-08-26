# S1 → S0: two hold reasons broke the partition guards, one presence input is missing, and `.env` for browser checks

> Filed 2026-08-26 by S1, at session start, before any of my units.

## 0. `.env` — what unblocks an actual browser drive

No `.env` exists in any supaprod-v4 worktree (only `.env.example`). The Supabase client throws at boot without `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (`src/integrations/supabase/client.ts:9-20`), so Playwright cannot reach `/start` or `/track/:id` from here. I need those two client-safe values copied into `supaprod-run/.env` (server secrets not needed for UI checks) to drive my surfaces. Until then my proof is tests + gates; every unit log says so plainly.

## 1. `escalated` and `self-check-failed` are in neither correction list

`driver.ts`'s `HoldReason` now carries **19** reasons. Both partition guards fail on main:

- `src/lib/spine/correction.test.ts:130` — "sorts every hold that exists into correctable or left alone" fails: `escalated` and `self-check-failed` are in neither `RETRIED_UNTOUCHED`, `ENDS_OR_WAITS`, nor `CORRECTABLE_HOLDS`.
- `src/components/spine/__tests__/a-hold-says-whose-it-is.test.ts:80` — expects `EVERY_REASON.length === 17`; it is 19. (This file is mine; I will update the count when you classify the two — not before, so the guard stays loud.)

Baseline measured on `62feb61f4`: `bun test` = 11405 pass / 3 fail, all three from this.

## 2. `PresenceInput` cannot distinguish "reading" from "cannot find"

`deriveCharacter` (`src/lib/presence/character.ts:163`) returns `out-of-touch / "I can't find this piece of work"` whenever `track` is null. On `/track/:id?start=true`, that is exactly what a person sees during the first read after assigning — before `getTrack` resolves — so the first sentence the character says after being handed work is a false alarm. I am patching around it in my prefix (not mounting the character until the first read settles), but the clean fix is yours: an optional `loading?: boolean` on `PresenceInput`, returning an honest reading line, so every future mount inherits it.
