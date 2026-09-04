# RETRACTED IN FULL, 2026-08-27. THERE IS NO DEFECT HERE.

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> **`/runs` is not broken, `/today` is not broken, and nothing in this file should reach S2.**
> The whole finding was an artifact of my own measuring instrument. Measured with a browser
> warm-up instead of `curl`, signed out, backend dead:
>
> | route | cold | warm | lands on |
> | --- | --- | --- | --- |
> | `/runs` | 105,100ms | **4,211ms** | `/login`, rendered |
> | `/today` | 7,075ms | 5,112ms | `/login`, rendered |
>
> **Warm, `/runs` redirects faster than `/today` does.** It is slow to compile because its
> sibling `$missionId` route is 1,786 lines, so the Vite dev chunk takes 105 seconds on first
> request. Every probe I ran, at 3s, 8s, 15s, 25s and 30s, expired inside that compile.
>
> **The cause was that I "warmed" with `curl`, which returns the HTML shell and never asks for
> the route's client chunk, so it warms nothing.** Three probes, each of which I reported as
> independent confirmation, were three runs of the same broken method. Independent repetition of
> a broken instrument is not corroboration, and I treated it as corroboration.
>
> The instrument is fixed (`e2e/helpers/warm-routes.mjs`, now used by `check-motion.sh`) so the
> next lane cannot inherit this. Everything below is kept as the record of the error.

---

# S4-056 · CORRECTED. `/runs` is the dead end, not `/today`.

> ## CORRECTION, 2026-08-27, and the original headline named the wrong route
>
> **The first version of this verdict said `/today` sits on "Opening" forever. It does not.** I had
> not warmed the route before timing it, so the twenty-five seconds I measured was Vite compiling on
> first request, not the product hanging. That is the second time tonight a cold compile fooled an
> instrument of mine; the first cost a Playwright navigation timeout.
>
> **Re-run with every route requested twice before measuring, four samples each:**
>
> | route | 3s | 8s | 15s | 30s |
> | --- | --- | --- | --- | --- |
> | **`/runs`** | `Opening` | `Opening` | `Opening` | **`Opening`** |
> | `/today` | `Opening` | → `/login` | `/login` | **login painted** |
> | `/start` | `Opening` | **login painted** | login | login |
> | `/learn` | | | | resolved to login |
> | `/approvals` | | | | resolved to login |
>
> **`/runs` is the permanent dead end.** Thirty seconds, twice warmed, never redirects, never
> resolves, one word throughout.
>
> **`/today` resolves**, though it is the slowest of the four that do: it redirects by 8s and the
> login page does not paint until somewhere between 15s and 30s. That is worth its own look but it is
> not a dead end, and calling it one was wrong.
>
> **Method note, since it caught me twice:** never time a surface on a dev server without requesting
> it first. The bundler's first compile is indistinguishable from a hang, and it is slower than most
> real hangs.

## The measurement

## The measurement

Signed out, with the database pointed at a port where nothing listens, watching two authenticated
routes for twenty-five seconds:

| | at 2s | at 10s | at 25s |
| --- | --- | --- | --- |
| `/today` *(unwarmed, see correction)* | `Opening` | `Opening` | `Opening` |
| `/settings` | `Opening` | redirected to `/login` | `/login` |

And `/login` itself, watched for thirty seconds on the same dead backend:

```
/login @3s   inputs=2  ::  Welcome back … Sign in. Your decisions, the evidence behind them,
                           and what happened next. Continue with Google OR WORK EMAIL PASSWORD …
/login @30s  inputs=2  ::  (identical)
console errors: none
```

**`/login` renders completely, immediately, with both fields and no console errors, even with no
backend at all.** That is the behaviour to keep, and it is worth naming before the defect.

*(A correction to my own mid-probe reading: I briefly recorded `/login` as showing "Opening" too.
That sample caught the redirect in flight. Watched directly, the page is fine.)*

## The defect

**`/runs` never resolves and never redirects.** Thirty seconds on a single word, twice warmed, no
spinner copy, no timeout, no error, no sign-in, no next action. The word is "Opening", so the page is
not even claiming to be loading data; it is claiming to be opening, indefinitely.

`/settings`, `/start`, `/learn`, `/today` and `/approvals` all hit exactly the same failure and all
decide, sending the person to a login page that works. **Six routes, one condition, and only `/runs`
is a permanent dead end.** That the other five get it right is what makes this a defect rather than a
missing feature.

## What the hang is NOT, which is the part that saves the fixer time

Reproduced three times, twice-warmed each time. On the third I instrumented it:

```
url: /runs          text: "Opening"      after 25s
console errors: NONE
failed requests: 0
```

**Nothing throws and nothing fails.** No error, no rejected promise, no failed fetch. The route
simply never leaves the pending state and never redirects.

Eliminated by reading the routes, so nobody repeats it:

| suspect | ruled out because |
| --- | --- |
| a child `beforeLoad` on `runs.index` | there is none. Nor on `today`, `settings` or `start` |
| a child `loader` | none on any of the four |
| `validateSearch` | `runs.index:385` has one, and so does `settings:319`, which resolves fine |
| a thrown render error | zero console errors, zero page errors |
| a hanging network call | zero failed requests, and the guard's own comment says `getSession()` reads localStorage with no network roundtrip |

**The shared guard is identical for all six routes**: `_authenticated.tsx:57` renders
`<BrandWait label="Opening" />` as the `pendingComponent`, and `:58-64` runs
`supabase.auth.getSession()` then `throw redirect({ to: "/login" })`.

So the same guard redirects five routes and does not redirect this one, with nothing erroring.
**I have characterised the symptom firmly and I have not found the cause**, and I am not going to
guess at it: the next step is a router-level look at whether `/runs` matches the `_authenticated`
tree the way its siblings do, and that belongs to whoever owns the route.

## Against the standard

- **Frontier standard #2:** *"Nothing blocks on a spinner past ~2s without saying, in plain words,
  what it is doing."* Twenty-five seconds on one word.
- **Frontier standard #3:** *"No raw error ever reaches a person. Every failure names the thing that
  failed and the next action."* No raw error reached the person, which is good, and no next action
  did either.
- **R-20, no dead end:** *"every surface offers the next action."* This one offers nothing.

Nothing here is a crash. It is worse in one specific way: **a crash tells you something happened.**

## What I checked and what I did not

- **Checked:** `/today` and `/settings` in a browser, signed out, dead backend, 25s each. `/login`
  separately for 30s. Console errors on `/login`: none.
- **Also seen, SSR only:** `/runs`, `/start`, `/learn`, `/approvals` all return 200 with the same
  ~26KB shell and the same single word. **I did not drive those in a browser**, so I do not know
  whether they resolve like `/settings` or hang like `/today`. Naming the scope, per `S4-051`.
- **Not claimed:** that this happens in production. My backend was dead on purpose. **The finding is
  the failure mode, not its frequency** — an outage, a dropped network, a slow region or an expired
  session all reach the same code path, and a person on a train is the ordinary case.

## The fix, and `/settings` is the template

The route already has a sibling doing it correctly on the identical failure. Whatever `/settings`
does to decide "no session, go to `/login`", `/today` needs the same, plus a bound on how long it will
sit in the undecided state before saying so.

**Owner: S2** (`routes runs.*`, per the ownership table). Five sibling routes already do it correctly,
so the pattern is in the codebase; `/runs` just does not use it.

**A second, smaller thing for the same owner:** `/today` resolves but is the slowest to, redirecting
at 8s and not painting the login until between 15s and 30s. Not a dead end, worth a look.

## Verdict

**CONFIRMED, with the route corrected.** `/runs` is a permanent dead end under a failure that five
sibling routes handle correctly. `/today` resolves and my original headline was wrong. `/login` is
exemplary under the same conditions and should not be touched.
