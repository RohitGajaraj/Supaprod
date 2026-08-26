# S4-057 · I warmed with curl, curl warms nothing, and three findings died of it

> _S4, 2026-08-27. A method finding about my own instrument, filed because it produced a wrong
> verdict that was sent to another lane with a fix attached._

## What happened

I reported `/runs` as a permanent dead end: signed out with the backend unreachable it showed the
single word `Opening` at 3s, 8s, 15s, 25s and 30s, while five sibling routes on the identical guard
redirected to a working login. I probed it three times, eliminated child `beforeLoad`, child
`loader`, `validateSearch`, thrown render errors and hanging requests, found no cause, and filed it
anyway as a characterised symptom owned by S2.

**There is no defect.** Measured with a browser warm-up:

| route | cold | warm | lands on |
| --- | --- | --- | --- |
| `/runs` | 105,100ms | **4,211ms** | `/login`, rendered |
| `/today` | 7,075ms | 5,112ms | `/login`, rendered |

Warm, the route I called a dead end redirects **faster than the control**.

## The cause

`check-motion.sh` warmed routes with `curl`. **A curl against a Vite dev route returns the HTML
shell and never asks for the route's client module graph, so the route chunk is never compiled.**
The server answers 200 in milliseconds and nothing is warm.

`/runs` takes 105 seconds to compile because its sibling `_authenticated.runs.$missionId.tsx` is
1,786 lines. Every probe I ran expired inside that window. The longest was 30s, and the truth was at
105s.

## The part worth keeping

**I ran the probe three times and called the repetition confirmation.** It was three runs of one
broken method, which corroborates nothing. Two of my earlier corrections this session were also
cold-compile artifacts, so this instrument had already fooled me twice before it fooled me into
filing.

The rule, now enforced in code rather than remembered:

> **Never time a dev-server surface you have not opened in a browser first, and measure the SECOND
> visit.** Cold time is the bundler. Warm time is the surface. Only warm time is a fact about the
> product.

## Fix, shipped with this finding

`e2e/helpers/warm-routes.mjs` warms each route in a real browser and waits for `networkidle`, which
in dev is the compile finishing. It **prints the compile time per route**, so a 105-second chunk is
visible as a number instead of being mistaken for a hang. `check-motion.sh` calls it instead of curl.

Any lane that ran `check-motion.sh` before this commit was warming nothing.

## Verdict

- **`S4-056` RETRACTED IN FULL.** No work for S2. Its file carries the retraction at the top.
- **`OPEN-QUEUE` §2.3c removed**, recorded in the closed table.
- **The two surviving costs are real and are not defects:** `/runs` costs a developer 105 seconds on
  first open in dev, and 1,786 lines in one route file is what makes it that slow. Neither is a
  user-facing fault and neither is mine to fix.
