# S4-056 · `/today` says "Opening" forever. `/settings`, on the same failure, does the right thing.

> _S4, 2026-08-27. Driven in a real browser against a dead backend, using the runner from
> `check-motion.sh`. Server stopped, port clear, dummy env removed._

## The measurement

Signed out, with the database pointed at a port where nothing listens, watching two authenticated
routes for twenty-five seconds:

| | at 2s | at 10s | at 25s |
| --- | --- | --- | --- |
| **`/today`** | `Opening` | `Opening` | **`Opening`** |
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

**`/today` never resolves and never redirects.** Twenty-five seconds on a single word, no spinner
copy, no timeout, no error, no sign-in, no next action. The word is "Opening", so the page is not even
claiming to be loading data; it is claiming to be opening, indefinitely.

`/settings`, hitting exactly the same failure, decides within seconds and sends the person somewhere
they can act. **Two routes, one condition, one of them a permanent dead end.**

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

**Owner: S2** (`routes today`, per the ownership table). The bound on the undecided state is the part
worth doing carefully, because it is the one that also covers a slow backend rather than a dead one.

## Verdict

**CONFIRMED.** `/today` is a permanent dead end under a failure its own sibling route handles
correctly. `/login` is exemplary under the same conditions and should not be touched.
