# S4-004 · Evidence audit of e2e/** — the instrument itself, before it is trusted again

> _Verified 2026-08-26 by S4 on `lane/proof` at `60dd95e34`. S4 owns `e2e/**`; this is the audit of
> my own instrument. A verdict produced through a broken instrument is how false proofs happen, and
> two of the repo's named failures (the includes-detection spec, the six duplicate tracks) were
> e2e specs._

## Per-file findings

| Spec | Verdict | The finding |
| --- | --- | --- |
| `round-8.spec.ts` | **GUARDED, honestly labelled** | Skips unless `ROUND8_PRESS_PRODUCTION=yes`; header documents that its station detection (`pageContent.includes(station)`) cannot fail because the spine strip renders all seven names, and that its two cited tracks died at sense. The broken detector still sits in the body behind the flag — acceptable, documented, do not cite its output even when run. |
| `phase-3-visible-agency.spec.ts` | **WAS UNGUARDED — fixed this unit** | Pressed `/start` + "Run it now" with no skip guard and no `login()` call — a real track per run wherever `:8080` points, the exact mechanism that starved the watched run on 2026-08-25. Its console block prints "✅ MISSION GATE CONDITION: SATISFIED" or "⚠️ LIMITED VISIBILITY" without affecting pass/fail (only the final two expects decide), which is the same species as the deleted S0-001 tests' hardcoded gate-met printer. Station detection reads an `At X` region — better than round-8's includes-over-the-page — but `.first()` can mis-grab when several sections match. **Guard added mirroring round-8** (`PHASE3_PRESS=yes` to opt in). Full rewrite deferred until S4 has a runtime; its selectors ("Start", "Run it now", "It reached the end") may be stale against today's surfaces anyway. |
| `waves-1-2-qa.spec.ts` | **CLEAN patterns** | Uses `login()` from the helper, `BASE_URL`, `waitForShell`; its own comments document removing `/premium` cases that passed vacuously against a 404 boundary — three green checks for a route that does not exist, caught and fixed in-file. |
| `01–09` numbered suites | **CLEAN at grep level** | No production URLs anywhere in `e2e/**` (grep recorded: only localhost/8080). Every `.includes(` hit is URL-login redirects, CSS shadow strings, or font-family names — not station detection; the canvas-not-regex lesson appears in-file as comments at `02:42` and `04:276`. |

## Two config-level traps, named for whoever runs the suite next

1. **R-21 names port 5173; this suite lives on 8080.** `playwright.config.ts:54` sets
   `baseURL: "http://localhost:8080"` and `helpers/auth.ts:102` defaults `BASE_URL` to the same.
   R-21's letter says check `lsof -ti:5173` before starting a server — **I did exactly that on
   first pass and checked the wrong door.** Any session running e2e must guard 8080 too, and the
   operating model's dev-server discipline should name both ports until they agree.
2. **The env override is half-wired.** `E2E_BASE_URL` changes the helper's `BASE_URL`
   (absolute gotos in waves/round-8 honour it) but NOT the config's `baseURL` (relative gotos like
   `page.goto("/start")` keep hitting whatever is hardcoded). One suite, two possible origins in a
   single run. Fix belongs to whoever touches config next; noted here so nobody debugs it twice.

Also verified: `auth.setup.ts` signs in once via password from `.env` and every other project
starts from that `storageState` — so any unguarded press is a press by a real signed-in account.
That is what makes the phase-3 guard load-bearing rather than cosmetic.

## Verdict

Instrument status: **USABLE WITH EYES OPEN after this unit's guard fix; UNVERIFIED AT RUNTIME** —
S4 still has no bun/node (ask pending), so nothing here was executed; every finding above is from
reading, with file:line. The moment runtime lands, first runs are:
`bunx playwright test --list` (do the selectors resolve?), then the guarded-off files skipped by
default prove the guard, then one local-server pass of `waves-1-2-qa.spec.ts`.
