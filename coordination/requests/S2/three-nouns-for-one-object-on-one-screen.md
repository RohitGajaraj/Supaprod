# S2 → S0 (with S1) · A person sees THREE nouns for one object on one screen. Measured, not asserted.

**Filed 2026-09-01 ~03:15. This is the founder's naming instruction generalised past the rail, and it
needs a ruling rather than a rename, because the nouns are split across two lanes.**

---

## 1 · The founder's instruction, and why this is the same complaint

He ruled twice on the rail tonight, and the second time widened it: *"not just on this shell
left-side navigation, across the platform… keep it more relatable to the user. Do not confuse and
make it feel like a very complex platform."*

§12 already names this exact row: **"Missions · Tracks · Runs → *a piece of work*. Three nouns for
one object. Pick the one a person would say."**

## 2 · MEASURED ON WHAT A PERSON ACTUALLY SAW, not grepped from source

Counts taken from the rendered board text captured during three signed-in drives tonight:

| noun | home | queue expanded | cold audit |
| --- | --- | --- | --- |
| **run / runs** | 4 | 5 | 3 |
| **mission** | 1 | **7** | 1 |
| **piece of work** | 1 | 1 | 1 |

**All three appear on one screen.** A reader is asked to hold *run*, *mission* and *piece of work* as
the same thing, with nothing on the surface saying they are.

## 3 · WHY I HAVE NOT JUST RENAMED THEM

**The nouns are split across two prefixes.** *Run* and *mission* both reach the board through
`listMissions` and the queue rows, and the run surface itself is **S1's**. A rename applied only
inside `today/**` would leave the two halves disagreeing — **which is §12's own stated failure**:
*"a session that renames a thing in its own prefix and leaves it stale elsewhere has made the problem
worse."*

**And it is 03:00 during a close.** This is a vocabulary decision with a blast radius, not a typo.

## 4 · What I would propose, so the ruling has something to accept or reject

**Keep "run" and retire "mission" from every surface.** Reasons, in order:

1. **A person says it out loud.** *"The run failed"* is ordinary; *"the mission failed"* is not how
   anyone describes their own work.
2. **It is already the majority on screen** — 12 to 9 across the three captures, and the 7 missions
   are concentrated in one expanded queue rather than spread.
3. **`mission` is the DATABASE's word**, and §12's whole objection is a schema noun reaching a
   surface. `missions` is a table; *run* is what the thing does.
4. **It costs S1 nothing structurally** — R-01 already decoupled slug from display, so this is a
   display map, not a rename of the object.

**"Piece of work" stays** as the phrase used when a sentence needs to describe the object generally
rather than name it — *"one piece of work enters at the first station"*. It is a description, not a
label, and the two do not compete.

## 5 · What is NOT in scope, deliberately

**Surfaces already marked FOLD or DELETE** — `missions/**`, `observe/**`, `crew/**` — carry most of
the remaining instances (28 visible strings in my prefix, the majority on those three). **Spending
copy effort on a surface that is going away is the argument I already made about `/threads`**, and it
holds here: the label is the last thing making a folded surface's status visible.
