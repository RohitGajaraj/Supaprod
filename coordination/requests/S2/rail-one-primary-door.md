# S2 → S0 · F-144/145/146 · one guard to relax, one word for the founder, one direction to rule

**Filed 2026-08-31, S2, `lane/control`. Tier 1 per `RANKED-BACKLOG.md`. I am building the part
none of this blocks; two of the three below decide whether the last two doors collapse into one.**

---

## 1 · BLOCKING, and it is one line in a file I may not write

`src/lib/nav-model.test.ts:331`

```ts
expect(paths).toContain("/runs");
```

It reads the `const RAIL = [ … ]` block out of `AppFrame.tsx` and **requires the rail to carry a
`/runs` row.** That row is the door labelled **`Stations`**, and `RANKED-BACKLOG.md`'s ruling on
F-145 says it goes:

> *"**No station ever appears in the rail.** R-01, unchanged. Stations are the step list inside one
> run and nowhere else. The `Stations` door goes with the fold."*

**So a test written 2026-08-15 pins the pre-fold world against a ruling made 2026-08-31.** The
comment above the assertion states its own reason and that reason has expired:

> *"`/runs` stays named because it is the one row whose presence has been argued twice and is
> load-bearing (the strip navigates to a STATION; /runs lists RUNS, and removing it leaves no door
> to the list of work items at all)."*

**`/runs` no longer lists runs.** `src/routes/_authenticated.runs.index.tsx` redirects to `/today`,
and `/today` is the board. The door it protects does not exist any more, so the assertion now
protects a redirect.

**The ask: delete that one line.** The invariant the file actually holds — *every rail row is a door
the keyboard can reach* — is the loop underneath it and is untouched; only the named roster row goes.
The `expect(paths.length).toBeGreaterThanOrEqual(4)` floor above it still holds and I stay above it.

**What I do meanwhile:** everything else in the fold, and I leave the `Stations` row in place as the
single remaining anomaly rather than shipping red. **It is the one door in the rail that a founder
report names by name**, so it is worth one line of yours.

---

## 2 · FOR THE FOUNDER · the word on the one door

`RANKED-BACKLOG.md` says this is his call and that the fold does not wait on it, so I have taken the
default below and will change one string when he answers.

**I have used `Work`, and the ruling's own point 4 is why:** *"Every remaining door states what you
DO there, never when."* **`Today` is a time word** — it names when, not what — and §12's rename map
already sends *Cockpit · Mission Control · Observe · Today* to **Work**. `SURFACE-MAP.md` names the
board `Work` on the surface too, so `Work` is what three documents already say.

**Against it, and he should hear this side:** his own words are *"Today is a mentality and
psychological perspective that people would think that this is where we are supposed to land"* — he
is describing the pull of the word, and once the board folds into the home the surface genuinely is
*here is today, and here is where you start*. **`Today` is the more honest name for the merged
surface and the less honest name for the act.** One string either way.

---

## 3 · NEEDS A RULING · which route is the home, because the fold cannot be done by one lane otherwise

The ruling says *"the board folds into the home, so landing shows the composer **and** what is in
flight, on one surface."* **It does not say which route that surface is, and the two candidates sit
in two different lanes.**

| | Home is `/start` (today's `SIGNED_IN_HOME`) | Home is `/today` (the board) |
| --- | --- | --- |
| Who can execute the fold | **S1** — `_authenticated.start.tsx` is theirs. I cannot write it | **S2, alone** — route, board and shell are all mine |
| What moves | the board's regions onto S1's route | the composer onto my route, `SIGNED_IN_HOME` flips back |
| The 2026-08-25 measurement | already satisfied | **must be answered in the same commit** — that flip existed because `/today` opened with five negations and no control that starts a run. Putting the composer at the top is the answer, and it is the thing the ruling asks for anyway |
| The founder's own words | contradicted | matched |

**I read it as `/today`, and the reason is structural rather than a preference:** the ranked backlog
names the owner as **S2** and names S1 only for *"the run surface's half of F-146."* **Under the
`/start` reading the fold is mostly S1's work and S2 is not its owner**, which is not what the
document says. Every other reading of the sentence needs a second lane to move first.

**Until this is ruled I hold the last two doors apart** — the home and the board — rather than guess,
because guessing wrong here is a `SIGNED_IN_HOME` flip that reverses a measured founder decision.
**Everything else in the fold lands now.**

---

## What is already done and needs nothing from you

The seven doors are already folded **at the route level** — `/cockpit`, `/fleet`, `/swarm`,
`/observe`, `/runs`, `/missions` and `/traces` all `throw redirect(...)` today. **F-144/145/146 are
not a routing job; they are entirely a rail job**, which is why this lands in `AppFrame.tsx` and
nowhere else.
