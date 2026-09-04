# S4-148 · The harness that proves the product was never typechecked

> _Created: 2026-08-28 · Last updated: 2026-08-28_

> _S4, 2026-08-28. Found by breaking my own spec and watching every gate pass._

## What happened

I added a viewport label to the motion spec:

```ts
compareToBaseline(path, …, RUN_MODE, `${VIEWPORT.width}x${VIEWPORT.height}`);
```

`VIEWPORT` is `undefined` on any run without `--viewport` or `--phone`, which is **most runs**. So the
spec threw `TypeError: Cannot read properties of undefined (reading 'width')` before measuring
anything.

**And every gate had already passed.** `tsc`, `eslint`, `bun run build`, `bun run docs:check`, and
`bun test` — all green, on a spec that could not start.

## Why nothing caught it

```json
"include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts", "eslint.config.js"],
"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
```

**`e2e/` is not in `tsconfig.json`. Neither is any `*.test.ts` in `src/`.**

Proven rather than inferred — I appended this to the spec and ran the gate:

```ts
const s4TypeProbe: number = "definitely not a number";
```

**`bunx tsc --noEmit` reported it zero times.**

And `bun test` does not run Playwright specs, so the one gate that executes code never touches the
harness either. **Between them, the four gates cannot see the code that proves the product works.**

## What was hiding in there

With `e2e/**` typechecked properly (Node and Bun types, since the harness is not browser code):

| error | whose |
| --- | --- |
| `contrastJudged` does not exist on `Partial<SurfaceNumbers>` | **mine, tonight** |
| `mode` does not exist (x2) | **mine, tonight** |
| `viewport` does not exist | **mine, tonight** |
| `Type 'string' is not assignable to type 'null'` | pre-existing |

**Four of the five were mine, written in the last two hours.** I read `.mode`, `.viewport` and
`.contrastJudged` off a type that has none of them. It ran correctly — JavaScript does not care — and
the types were a fiction the whole time. The baseline shape now exists as `BaselineEntry` instead of
being an inline lie at the call site.

The fifth is `let lastStationSeen = null`, which infers the **type** `null`, so every later assignment
is an error. It has run correctly for months.

## Fixed

**`e2e/tsconfig.json`**, and `tsc:e2e` is now a gate. It needs its own config rather than a wider
`include`, because the harness is Node and Bun code while `src` is browser code and one `types` field
cannot be right for both.

**Mutation-tested**, because a gate nobody has watched fail is not a gate:

```
=== MUTATED: const s4GateProbe: number = "not a number" ===
  tsc:e2e … FAIL
GATES FAILED: tsc:e2e - do not commit or push.
(restored)  → 0 errors
```

## The part that generalises

**`bun test` does not run Playwright specs.** So a broken harness still passes every gate, and the
only thing that runs it is `check-motion.sh` — which a lane runs by hand.

That is the strongest argument yet for the founder's instruction that every lane run the dead-backend
check themselves rather than waiting for this one to find things: **it is not a nicety, it is the only
execution the harness gets.**

`src/**/*.test.ts` is still unchecked, and that is the whole unit suite. Left alone deliberately: the
full-repo probe ran the compiler out of heap at 8GB, so sizing it is its own unit rather than a change
smuggled into this one.

## Verdict

- **CONFIRMED: `e2e/` was never typechecked**, proven with a probe that produced zero errors.
- **CONFIRMED: four live type errors were mine**, written tonight, in the checks I was using to judge
  other people's code.
- **Fixed and gated**, mutation-tested both ways.
- **OPEN: `src/**/*.test.ts` is still excluded**, carries **414** type errors of its own, and the
  compiler could not complete the check reliably enough to gate it here.

---

## Follow-up · the unit suite is 797 files and 414 type errors, and the ratchet did not ship

**Sized in the next unit, and the first answer was wrong in the most dangerous direction.**

| | |
| --- | --- |
| test files in `src/` | **797** |
| type errors **in the test files themselves** | **414** |
| further errors in files they import | 9 |

**My first probe reported ZERO, and I nearly filed it.** The run had exhausted the compiler's heap and
died before emitting anything, and `grep -c "error TS"` counted a crash as a clean bill of health.

**The mutation probe is the only reason that did not ship.** I appended
`const s4ProbeUnit: number = "not a number"` to a test and re-ran, expecting to see it named. Instead
the output filled with errors from a completely different file — `'probe' is possibly 'undefined'`,
`Object is possibly 'undefined'`, `No overload matches this call` — which is how a "0" became a "423".

> **A count of zero from a tool that crashed looks exactly like a count of zero from a tool that
> passed.** That is the same lesson as `/pricing` reporting "0 below AA of 0 judged", and it is the
> third time tonight the population, not the count, was the thing that mattered.

**The number needed a second correction too.** The first split was 423, and **9 of those are in
`src/routes/api/**`** — files the tests *import*, reported only because a tests config must add Node
and Bun globals that the browser config does not have. They are an artifact of the probe, not a
property of the code. **414 is the honest number**, and freezing a total that moves when a `types`
field moves would have frozen the wrong thing.

**I BUILT THE RATCHET AND WITHDREW IT.** `scripts/test-types-ratchet.sh` froze the count, failed on an
increase, and carried the anti-vacuity guard this finding is about — tsc prints *"Found N errors"* only
when it completes, so a run without that line refuses instead of passing.

**It refused on three consecutive runs.** The compiler could not finish this project on this machine
once other work was in flight, and the two earlier completions were luck. **The guard was right every
time**, which is the one good thing here: it caught a real crash rather than a simulated one, and
never once reported a crash as a clean suite.

**A gate that refuses on every run is not a gate**, so it is not shipped. Removed rather than left
half-wired. The measurement stands, the enforcement does not, and that is stated rather than left for
somebody to discover.

**The `e2e/` gate shipped because its number was 5, four of them mine and all five fixed in the same
unit.** The difference between the two is the size of the number, and nothing else.
