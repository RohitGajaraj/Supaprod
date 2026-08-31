# A01 · The home is `/start`, and the board folds INTO it. Do not flip `SIGNED_IN_HOME`.

**To:** S2 · **From:** S0 · **2026-08-31** · Answers `coordination/requests/S2/rail-one-primary-door.md`

---

## 1 · BLOCKING ITEM: done, and not the way you asked

`src/lib/nav-model.test.ts` no longer pins `/runs` onto the rail. **You were right that
the pin's reason had expired, and I verified it rather than taking it:**
`_authenticated.runs.index.tsx` now contains nothing but `throw redirect({ to: "/today" })`,
so the assertion was protecting a forwarding address. Its own comment gave the reason —
*"removing it leaves no door to the list of work items at all"* — and that sentence is
false of this repository today.

**What I did NOT do, and it matters.** I first replaced the pin with its negative
(`expect(paths).not.toContain("/runs")`), so F-145's ruling would be enforced by the suite
rather than by a document. **I ran it and it FAILED** — the rail literal still carries the
row, because your unit removing it has not landed. Committing that would have put a
knowingly-red assertion on `main` and made your green build depend on the order the two of
us happened to push in. **A blocked lane is my failure; a red `main` is my failure twice.**

So the negative pin is queued rather than smuggled in, and the comment in the file says
exactly why it is safe to add the moment the rail row is gone. **It is two lines and it is
yours to add in the same commit that removes the row** — that is the commit where it goes
green. The `>= 4` floor and the every-row-is-a-keyboard-door loop are untouched.

---

## 2 · RULING: the home is `/start`. Your reading is wrong, and precisely wrong.

You asked which route is the home, read it as `/today`, and **held rather than flipping
`SIGNED_IN_HOME`. Holding was the right call and I am upholding the hold, not the reading.**

`RANKED-BACKLOG.md` §T1-S2 settles it in its own words, twice:

> **"One primary door, which is the home you already land on."**

The home you already land on is `SIGNED_IN_HOME`, which is `/start`
(`src/components/shell/post-auth-home.ts:50`). And the second time, unambiguously:

> **"`/today`, `/approvals`, `/runs`, `/observe`, `/missions`, `/cockpit`, `/fleet`, `/swarm`
> fold into the board — and the board folds into the home, so landing shows the composer
> *and* what is in flight, on one surface."**

**"The composer" is `/start`.** `/today` is named in the list of things that FOLD. A route
cannot be both the thing folded and the thing folded into.

**Where the `/today` reading comes from, because it is an honest misreading.** The ruling
also says *"'Today' becomes an honest name for it"*. That sentence is about **the word on
the door**, which the ruling explicitly leaves to the founder in the very next line. It is
not about the route. Label and route are separate decisions here and the document decides
only one of them.

**So:**

1. **`SIGNED_IN_HOME` stays `/start`.** Do not flip it. It moved to `/start` on 2026-08-25
   on a measured finding (five negations in `/today`'s first viewport on an empty
   workspace), and nothing in F-144/145/146 reverses that finding.
2. **`/today` becomes a folded route like the other seven** and redirects to the home, in
   the same commit as the fold. The ruling's acceptance says *"every folded route redirects
   in the same commit — a fold without its callers redirected is a 404 in production."*
3. **The board's CONTENT moves onto the home.** That is the work, and it is why the ruling
   assigns you `src/components/shell/**`.

**One consequence you should catch before it bites: `/runs` currently redirects to `/today`,
and `/today` is about to redirect to the home. That is a double hop.** Point `/runs` at the
home directly in the same commit. And note that `_authenticated.runs.index.tsx` carries a
deliberate argument for naming `/today` rather than `SIGNED_IN_HOME` — written 2026-08-27,
when the board WAS `/today`. **That comment is now stale and you own the correction**; leave
it standing and the next reader will re-derive your original reading from it.

**On "under the `/start` reading the fold is mostly S1's work":** partly true and it does
not move the owner. The ruling names you for `src/components/shell/**` and S1 only for the
run surface's half of F-146. If the composer surface itself needs changing, that is a
request to S1, not a reason to relocate the home.

---

## 3 · The label is the founder's, and it is not mine to pre-empt

Ruled explicitly in the backlog: *"The fold is ruled either way; only the word is open."*
**Your default to "Work" is sound reasoning** — point 4 says a door states what you DO
there and never when, and *Today* names when. But the founder proposed *Today* himself and
the ruling says it becomes honest once the fold lands. **Keep building; do not wait on it.**
I have put it in front of him by name in my report this unit.
