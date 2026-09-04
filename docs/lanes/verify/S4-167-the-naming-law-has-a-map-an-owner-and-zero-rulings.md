# S4-167 — the naming law has a map, an owner and zero rulings, and four of seven rail items are words it replaces

> _Created: 2026-08-31 · Last updated: 2026-08-31_

> _S4 · 2026-08-31 ~11:1x UTC · measured on the RENDERED signed-in shell via
> `e2e/check-motion.sh --signed-in /inbox /learn /today`, dead backend, dummy env pointing at a dead
> port. **Dev server taken and released: `:8080` clear, dummy `.env` removed, confirmed by the
> harness's own closing line.** No row written, nothing pressed._

**This is the §ALSO read-it-out-loud check (§12), owed every pass and deferred twice this session.
It is measured on the page, not on the source.**

## What §12 says about itself

> *"**The law: if a person would not use the word out loud to a colleague, it does not go on a
> surface.** Not in a nav item, not in a heading, not in a button, not in an empty state, not in a
> toast … **it is cross-surface, and a session that renames a thing in its own prefix and leaves it
> stale elsewhere has made the problem worse.**"*

And, on the map: *"**S0 rules on each row and owns the sweep**; a lane applies it inside its own
prefix and files an ask for anything outside."*

## The finding, and the fair version of it comes first

**No row of the rename map has ever been ruled.** `grep -n -i "rename map|§12|plain words|guardrails"`
over `RULINGS.md` returns **one** line, 272, and it is not a ruling — it is prose that itself reads
*"Today → Engine Room (guardrails + approvals) → Brain"*, using two of the words the map replaces.

**So the rail is not breaking a law that is in force. The sweep that §12 mandates has not started**,
five days after §12 was written and called a law rather than a copy preference. That is the honest
statement, and it is the finding: **a naming law with a map, a named owner, and zero rulings.**

## What the primary navigation shows today

Photographed on `/today`, signed in, dead backend — `docs/screenshots/s4-motion/surface_today.png`.
The rail, top to bottom, against the map:

| rail label | what §12's map says | |
| --- | --- | --- |
| **Today** | *Cockpit · Mission Control · Observe · **Today** → **Work*** | replaced |
| **Approvals** | *Approvals → **Waiting for you*** | replaced |
| Work | this is the target word | ok |
| Stations | not in the map; stations keep their names | ok |
| **Brain** | *Brain · Memory · Knowledge → **What we've learned*** | replaced |
| **Threads** | not in the map — but `SURFACE-MAP.md:69` says **DELETE** | see below |
| **Guardrails** | *Engine Room · **Guardrails** · Govern · Boundary · Safety → **What it's allowed to do*** | replaced |

**Four of the seven rail items are words the map replaces.**

### The sharpest one is not a word, it is a contradiction

**The rail shows `Today` and `Work` as two separate destinations.** The map folds `Today` *into*
`Work`, and its stated reason is three words: ***"The board. One name."***

**The product currently ships, side by side in one rail, the exact duplication that row exists to
remove.** A person reading that rail has to guess which of two rows is the board.

### Two routes are in the rail against their own disposition

- `_authenticated.threads.tsx` — `SURFACE-MAP.md:69`: **"DELETE — a collaboration surface, killed by
  R-04."** It is **808 lines**, live, and in the rail. `SPEC-AGENT-COMMS.md` §3 goes further and
  writes about it in the past tense: *"noise is what `_authenticated.threads.tsx` was deleted for."*
  **It was not deleted.** That sentence is a load-bearing argument in the spec that closes the message
  vocabulary at seven, and its premise is false on this tree.
- `_authenticated.guardrails.tsx` — `SURFACE-MAP.md:88`: **"FOLD → same section / What it's allowed
  to do."** Live, and in the rail under the word the fold was supposed to remove.

### This is an unswept rename, not drift, and the dates say so

```
3faf6857b  2026-08-15  "The shell moves onto Meridian, and the rail stops being a menu"
                       -> AppFrame.tsx:279 records: "Engine room" became "Guardrails" on the same pass
2026-08-26             §12 is written, and bans Guardrails by name
```

**The rail was renamed INTO the banned word eleven days before the word was banned.** Nobody did
anything wrong on 08-15. §12 arrived afterwards, named the word, assigned the sweep to S0, and the
sweep has not happened. **This is precisely the failure §12 predicts of itself** — one word left
stale after a rename elsewhere — and it is happening to §12's own vocabulary.

## Standing question 2 on these three surfaces: no theatre found

Worth recording as a pass, because it is the question that ends features and this time the answer is
clean.

- **Every station on `/today` reads `count unavailable`** with a dead backend. Seven stations, seven
  honest blanks. **No fabricated count, no advancing bar, no state that is not derived from a row.**
- The header says *"Cannot see what is running."*
- `/learn` **settled** and nothing moves without data.
- `/inbox` and `/today` are still redrawing 9s after settle. **I am not filing that**: S1 already
  measured this class on `/start` and showed `document.getAnimations()` returns nothing at settle+9s
  and +15s with `body.innerText` byte-identical, so no state changes and no false claim is made. The
  cause remains unidentified and is S1's open note, not a new finding.

**The baseline's two "REGRESSED" lines are both improvements and I am reporting them as such**, which
is what the harness's own header asks for: `/inbox` went 0 → 1 failure sentence and `/today` 1 → 2.
Going from silent to explaining yourself scores worse and is better. `/learn` genuinely improved on
all three counts (8 → 2 sentences, 3 → 0 retries, 2 → 0 contrast), which confirms S1's and S3's work
on that surface.

### One thing on `/today` that is worth a look, and it is small

The shell says *"Your session ended. Sign in again and this will load."* with a **Sign in** link. The
body says *"This could not be read, so it cannot tell a quiet morning from a workspace it never saw."*
with **Try again**. **Two remedies for one condition, and the shell has already diagnosed it.** If the
session ended, "Try again" retries into the same failure. This is S3's open item — *"`ReadFailed`
repeats the shell's session sentence and adds a second door"* — in a new place, and it is named here
rather than re-filed.

## Owner

**S0**, explicitly: §12 assigns the ruling on every row and the sweep itself to S0, and the rail is
the shell, which S3 recorded as having no live owner. **The freeze does not protect any of this** —
the rail is the product shell, not a public or marketing route.

I write no product code and have changed nothing.
