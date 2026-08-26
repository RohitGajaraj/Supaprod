# S4-039 · The stranger's sixty seconds, in a real browser, and the timer caught on camera

> _S4, 2026-08-27, on `lane/proof`. **The first browser-driven measurement this session has been
> able to make**, and it settles a claim that was static-only until now._

## How, and what it cost to get here

Playwright had no browsers installed. `bunx playwright install chromium` (98.8 MiB, disk at 30%),
then one dev-server lifecycle: ports checked free, `DEVSERVER` declared in `NOW-S4.md`, **dummy**
`.env` pointing at `http://localhost:54321` where nothing listens, spec run, **server killed, ports
confirmed clear, dummy `.env` removed.**

Two adjustments the run itself forced, both recorded because they are the difference between a
result and a failure:

- `playwright.config.ts` runs an `auth.setup` dependency that needs the demo password. `--no-deps`
  skips it, and this spec needs no auth.
- Every project injects a signed-in `storageState`. **I overrode it to signed-out**, which is not a
  workaround but the more honest simulation: the founder's acceptance is about a person who has
  never seen this, and that person has no session. `/` is public, so unlike
  `s4-sixty-seconds.spec.ts` (which must simulate a stranger *with* an account because `/start` is
  behind auth), here the stranger can be a real one.

Spec: `e2e/s4-the-stranger-lands.spec.ts`. It lands, waits, screenshots and reads. **There is no
press in it.**

## The finding: the stations complete while nothing is running

**t = 10s** — the seven station bars under the hero card are **all grey**. Nothing started.

**t = 60s** — the **first bar is green (complete)** and the **second is blue (in progress)**.

**There is no backend.** The app is booted against a Supabase URL with nothing listening. No track
exists, no row exists, no run exists, no network call can succeed. **The stations advance anyway.**

`S4-028` established this from source — `HeroLoopDemo.tsx:51-57`, `setInterval(() => setCycleTime(t
=> (t + 50) % TOTAL_CYCLE), 50)`, with each station's state computed from `cycleTime` alone. **This
is the same claim with a photograph attached**, and it is the operating model's own worked example
of theatre: *"Not a spinner and not a step label on a timer… This repo has already failed a branch
for a timer advancing step labels."*

Directly above those bars, and above the fold at 1280×800, a stranger reads:

> **AUTONOMOUS EXECUTION**
> **One sentence. Seven stations. Fully automatic.**
> No clicks mid-run. No human intervention. Agent decides, builds, ships.

So the sentence claims the acceptance R-18's honest query has returned **0** for three months, and
the illustration under it demonstrates that claim using a clock.

> **CORRECTION, 2026-08-27, after S3 challenged it.** An earlier draft of this verdict said
> "autonomous" is on **the canon's** banned list. That is ambiguous and half wrong, and the ambiguity
> is the finding: see `S4-046`. `OPERATING-MODEL-5-SESSIONS.md:32` and `:735` do ban it in product
> copy, twice. `positioning-locked-2026-08.md` does **not** ban it, and at `:269` uses it itself as a
> measured claim. **S3 was right about the positioning canon and I was right about the operating
> model.** The correct citation is the operating model, and the false capability claim stands on its
> own without the adjective either way.

## What a stranger actually understands, which is the question that was asked

**The comprehension half is good, and it deserves saying as plainly as the defect.** Above the fold
at ten seconds, with no scrolling:

- *"FOR PRODUCT MANAGERS WHO SHIP WITH AGENTS"* — the audience, immediately.
- *"Supaprod tells you what to build."* then *"builds it. ships it. grades it. guides the next
  call."* — **that is the product, in four verbs, in plain words.**
- *"TO DECIDE WHAT TO BUILD / TO SHIP WHILE IT MATTERS / TO KNOW IF YOU WERE RIGHT"* — the same
  thing again as outcomes.
- *"Agents that own outcomes. Not just output."* — the differentiation, in six words.
- One clear action: **Join the beta**.

A stranger at ten seconds knows who it is for, what it does, and what to press. **On clarity the
sixty seconds holds.** The measured text above the fold is **identical at 10s, 30s and 60s** (28
blocks, unchanged), so nothing new is learned after the first screen — which is fine, because the
first screen already said it.

**The failure is not clarity. It is honesty**, and it is confined to the demonstration: the one
element that moves is the one element with nothing behind it.

## Limits of this measurement, stated so nobody over-reads it

- **Public landing only.** The signed-in sixty seconds still needs real credentials.
- **One viewport** (1280×800, `chromium-desktop`). The station strip sits at the very bottom edge, so
  a shorter window would not show it at all; a taller one shows more of it.
- **My station-name extraction is too broad and I am not reporting it.** It searched the whole
  document, so it returned all nine names at every checkpoint by also finding the *correct* strip
  further down the page (the one `S4-037` contrasts with). The screenshots, not that list, are the
  evidence here.
- **No scroll.** What is below the fold at 60s is not measured.

## Verdict

**CONFIRMED, with a photograph.** The public landing's seven-station strip advances on a timer with
no data behind it, under copy asserting fully automatic execution with no human intervention.
`S4-028` and `S4-037` said this from the source; this is the same finding driven in a browser, which
is what R-11 asks for and what this repo has repeatedly shipped without.

**Standing question 2, public half: clarity PASSES, honesty FAILS.** Both halves matter and neither
should be reported without the other.

**Not fixed.** `landing/**` is S3's and this is outward-facing, so `docs/pitch/`'s rule puts it with
the founder. The fix for the strip is a constant (`S4-037`); the fix for the copy is a sentence.

Evidence: `docs/screenshots/s4-039/t10s.png`, `t30s.png`, `t60s.png`,
`what-a-stranger-reads.txt` — gitignored by policy, so they live on this machine and are sent to the
founder directly rather than committed.
