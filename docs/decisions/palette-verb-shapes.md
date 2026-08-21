# The three shapes a palette verb can take, and the one that cannot work

> _Created: 2026-08-21 · Last updated: 2026-08-21 (built, with one premise corrected)_

> **SUPERSEDED IN PART, 2026-08-21 (same day, later): THE PALETTE THIS RULING SHAPES IS RETIRED.** The shape law below is still
> correct and its build guard (`src/lib/palette-catalog.test.ts`) still runs — `ACT_VERBS` and `JUMP_DESTINATIONS` survive as data
> in `src/lib/palette-sections.ts` — but **no UI reads them**, because there is no command palette any more. What is recorded here
> about *why* the third shape rots is worth keeping and applies to any future verb list. What is recorded here about the palette
> being a live surface no longer holds. Full record, including the two written contracts the retirement reverses and the case for
> keeping the palette verbatim: [`./palette-retired-2026-08.md`](./palette-retired-2026-08.md).
>
> **One correction carried forward:** only **1** of the 19 catalog rows was genuinely dead (`open-calendar` → `/today`), not the
> 5 an intermediate reading claimed. `challenge-belief`, `point-critic` and `tickets-to-signals` all routed correctly.

**Founder ruling, 2026-08-21. Settles K-37.** Measured by Kiro, ruled by the founder, **built by Claude** — Kiro documented this and did not touch the code. **BUILT 2026-08-21, and the build falsified one of the premises below. Read the correction first.**

**The decision in one line: a palette verb either navigates to the station that owns the job, or it acts in place through something mounted globally. It never does both.**

---

## ⚠️ CORRECTION 2026-08-21, found while building this: the palette is not mounted, so nothing was lying to anyone

**The rule above survives unchanged. The urgency behind it does not.** This document says four verbs "are reachable by a real user today — type 'task', 'signal', 'status' or 'focus' into Cmd+K", and that **the four verbs that lie were shipping**. Both are false, and the sentence they rest on is the one immediately below: *"`src/routes/_authenticated.tsx:211` renders `{!isOnboarding && <GlobalComposer />}`, so it is available on every authenticated route."*

**That line is real. What it renders is not the palette.** `GlobalComposer()` returns `<AskDock />`. The palette lives in `GlobalComposerHost`, declared in that same file and **never called**, and in `CommandPalette`, which is **mounted nowhere**. `SuggestionPopover` — the file cited as proof a user reaches `ACT_VERBS` — renders only inside `Composer` ← `ComposerOverlay` ← `GlobalComposerHost`. **Nothing in `src/` dispatches `supaprod:open-cmdk`, and both of its listeners are unmounted anyway.** Cmd+K is bound in `src/lib/ask-context.tsx:296` and opens Ask; the shell's own button says **"Ask ⌘K"**, confirmed in a browser on 2026-08-21.

**So `ACT_VERBS` is dead data. There is no command palette in the running product.**

**This is the same error the re-measurement warned about, one layer further out.** Its own method note says *"a name is not a symbol"* and records catching itself twice. It then read `<GlobalComposer />` at `:211`, confirmed the mount, and stopped — without reading what `GlobalComposer` returns. The stale comment sitting directly above that line asserted Cmd+K opens the `ComposerOverlay`, which made stopping there feel like confirmation; that comment has been corrected in the same commit as this note.

**The previous session's browser attempt was the product telling the truth and was written off as an instrument fault.** Its log records *"the palette did not open on Cmd/Ctrl+K under this harness and I did not see the four verbs myself"*, and attributes it to headless keyboard focus or a workspace-less user. It did not open because it does not exist.

**What this changes, and what it does not.**

- **Every one of the five build steps was still the right thing to do**, and all five are built. The law correction and the guard are what stop shape 3 being reinvented the day somebody remounts the palette, which is the day it would matter.
- **The one step with user-visible value today is the Discover landing**, and it does not involve the palette at all: two **live** controls labelled *"Capture a signal"* (`_authenticated.brain.tsx:1482`, `GraphCanvasView.tsx:323`) navigated to a bare `/discover`, and now carry the param.
- **Two acceptance lines in K-37 cannot be met and were not claimed.** *"`Capture a signal` lands on the capture box"* and *"`Name a bet` appears"* were to be checked in Cmd+K. They are verified in the DATA and by direct URL; they are **not** verifiable through a palette that does not open.
- **The founder now has a question that is bigger than K-37: does the palette come back, or does it go?** Filed as an open finding in `../planning/SOURCE-OF-TRUTH.md`. Twelve files in `mission/` exist only to serve `GlobalComposerHost`, and the two jobs this ruling removed from `ACT_VERBS` both queue behind the answer.

**The caveat this document raised about its own evidence was the right instinct and the measurement is now done.** It said "off-screen" was inferred from source position rather than a measured viewport. Measured 2026-08-21 in a browser on a populated workspace: the capture box sits at **1173px in a 627px viewport — 546px below the fold**, nothing focused. With `?capture=1` it sits at **346px, in the viewport and focused.** The inference was correct.

---

## Why this needed a decision at all

The command palette is mounted globally: `src/routes/_authenticated.tsx:211` renders `{!isOnboarding && <GlobalComposer />}`, so **it is available on every authenticated route**. That makes "what a verb does" a cross-station question by construction, and it is the reason four verbs could be broken on twelve surfaces at once.

Four of the palette's eight `ACT_VERBS` silently did nothing. The obvious readings were both wrong:

- **It is dead code.** No. `SuggestionPopover.tsx:99` surfaces `ACT_VERBS` as soon as a query is typed, so **a real user reaches all four** by typing "task", "signal", "status" or "focus" into Cmd+K. K-37 as originally filed said both host sites were dead; that was true of `GlobalComposerHost` and false of `GlobalComposer`, a different symbol.
- **It just needs the listener wired.** No. The mechanism it would be wired through has never worked anywhere in this product, and three of the four verbs have no destination to be wired to.

---

## The three shapes

**Shape 1 — navigate to the station that owns the job.** No event. Three verbs use it: *Challenge a belief*, *Connect a source*, *Answer the waiting call*. **Works from anywhere, because navigation is station-independent by nature.**

**Shape 2 — act in place through a globally mounted listener.** No navigation. Two events use it:

| Event | Listener | Mounted by |
| --- | --- | --- |
| `supaprod:open-ask` | `src/lib/ask-context.tsx:324` (`AskProvider`) | globally |
| `supaprod:open-lineage` | `src/components/supaprod/AuditLineageSheet.tsx:279` | `AppFrame.tsx:2042`, which wraps every authenticated surface |

**Works from anywhere, because the listener is everywhere.**

**Shape 3 — navigate AND open something on arrival.** Coordinated by `src/lib/desk-compose.ts`: a module-level pending flag with a 10-second TTL, set by `fireDeskCompose` and meant to be read by `useDeskComposeIntent` on the destination's mount. **Four verbs. All four broken.**

### Shape 3 is used nowhere else, and that is not a coincidence

It is the only shape that **couples a global dispatcher to a route-specific mount across a navigation boundary**, and it is the only one that rotted. `useDeskComposeIntent`, `consumePendingDeskCompose` and `resetDeskComposeForTest` have **zero callers**; `desk-compose.ts` is the repo's only attempt at cross-navigation coordination and nothing consumes it.

Both shapes that work avoid that coupling, and they avoid it in opposite directions: shape 1 has no listener to miss, shape 2 has no navigation to race. **Shape 3 needs the destination to mount a listener within a TTL of a route change it does not control.** That is a timing contract between two things that do not know about each other, and nothing in the codebase enforces it.

---

## The root cause is a sentence, not the code

`src/lib/palette-sections.ts:32` asserts:

> *"Every composer opens in place via its scoped `supaprod:*` event … no verb merely navigates and calls it an action."*

**That stated law forbids the one shape that works and demands the one that cannot.** It is why shape 3 was invented, and **deleting the four verbs while leaving that comment standing would get them rebuilt the same way.** `desk-compose.ts:1-13` repeats it at greater length, including two premises that are now false: *"The focus dock is mounted globally"* (there is no `FocusDock` file) and *"These three composers live on Today's Desk"* (Today has no Desk).

**The older canon already disagreed with that sentence and was right.** `docs/planning/rebuild-2026-07/clicks/FINAL-click-register.md:173` (S-11) and `clicks-a-chrome.md:71` (A17) both prescribe *"navigate to `/today` when the dock is absent"* — treating navigation as the honest repair rather than as dishonesty.

**And the product already shipped the correct answer for the exact job in question.** `_authenticated.brain.tsx:1483` labels its primary control *"Capture a signal"*, navigates to `/discover`, and its own copy says *"open Discover, type what you heard and where from, and press Capture."* Learn does the same at `learn.tsx:757-761`, with the note *"these two navigate: nothing on this page is blocked pending the click."*

---

## Why ACT rotted and JUMP could not

`palette-sections.ts` carries a **DERIVATION LAW** in its own header, and applies it to exactly one of its two lists:

- **JUMP is derived** — `JUMP_DESTINATIONS = PRIMARY_NAV.map(...)`, and the comment says *"the hand-copied list is gone, so the palette can never drift from the rail."*
- **ACT is a hand-written literal array.**

**That asymmetry is the whole story.** A hand-written list of actions cannot notice that its destination was rebuilt underneath it, which is precisely what happened when Today lost its Desk.

**So the rule for other stations is the same law applied twice: an ACT verb exists for a station when that station owns a create surface, and it navigates there.** No machinery, works from all twelve destinations.

### What that yields today, measured 2026-08-21

| Station | Create surface it owns | Verb today |
| --- | --- | --- |
| Discover | capture box, `DiscoverSurface.tsx:3141` | broken, points at `/today` |
| Decide | `NameABet`, `_authenticated.decide.tsx:3385` | **none — and it is the most valuable act in the product** |
| Plan | draft the spec, `_authenticated.plan.index.tsx:1016` | none |
| Ship | announcement composer, `_authenticated.ship.tsx:2511` (behind a click) | none |
| Learn | `SettlePanel`, `_authenticated.learn.tsx:564` (count-gated) | none |
| Today | `AskComposer`, `_authenticated.today.tsx:1281` | reached via `supaprod:open-ask`, shape 2, works |
| Design, Build, Runs, Crew, Brain, Engine Room | none that creates the station's own object | correctly absent |

**Four verbs that lie were shipping while Decide had none.**

---

## The deep-link standard this has to satisfy

`src/routes/_authenticated.discover.tsx:5-11` states the standard, and it was written about a palette link:

> *"A deep link either lands on the thing it names or it is broken, and this one was broken quietly, which is worse."*

**A bare `to: "/discover"` does not meet it.** The capture box sits at roughly line 3,122 of a 3,442-line surface, **deliberately below the ranked reading** — its own comments say so (`:2166`, `:2193` *"Or capture it yourself below"*). So the verb would land you on the right station with the box off-screen.

**The route already learned this exact lesson once**, for `?focus=`, and the write-up sits in that same header as a repair of that same law: `validateSearch` was dropping the param, so a link from a spec landed on whichever cluster ranked first with nothing saying why. **The fix is the same fix.**

⚠️ **One caveat on the evidence.** "Off-screen" is inferred from source position and the surface's own stated design, **not from a measured viewport** — Kiro cannot open an authenticated page. Whoever builds this should confirm it in a browser, and if the box is in fact visible on arrival the param is a smaller win but still the honest form.

---

## The options, and the cost accepted

| | Option | Cost |
| --- | --- | --- |
| **A** | Delete all four verbs plus `desk-compose.ts` | Smallest. Cmd+K stops lying. Ships nothing, and leaves the false law standing. |
| **B** | Delete three, re-point *Capture a signal* at `/discover` | Same size as A, and one verb works. |
| **C** | Wire all four | **Not one decision but four.** *Add a task*: no page a human opens — `createTask`'s only client caller is `use-ask-stream.ts:243`, Ask promoting a task out of a stream. *Share status*: `getStakeholderUpdate` and `getStakeholderPack` have **zero callers anywhere in `src/`**; there is no standup, broadcast or digest preview. *Start a focus block*: no listener, no `FocusDock`, no focus-block concept anywhere. So three of the four mean **design a surface**, not wire a listener. |
| **B+** | **CHOSEN.** B, plus the deep-link param, plus correcting the stated law, plus Decide's missing verb | One commit. **Two working verbs where there were zero**, four lies removed, and a rule with a guard so shape 3 cannot come back. |

**The cost B+ accepts:** *Add a task* and *Share status* leave the palette entirely, so the two jobs become unreachable from Cmd+K until somebody designs their surfaces. That is the right trade, because **a verb that silently does nothing is worse than an absent one** — it spends the user's trust and returns nothing — and shape 2 is available to both of them later through Ask, which is already globally mounted.

**Deferred, not dropped:** *Add a task* and *Share status* should be re-filed as their own items, honestly scoped as **design a surface**. `FINAL-ia.md:137` constrains how urgent that is: *"A palette as the IA … It ships and it is never load-bearing."* Neither job may depend on the palette as its only door.

---

## What the guard must assert, or this is a suggestion

`docs/conventions/README.md`'s rule applies: **add a test if code can violate it silently.** `src/lib/palette-catalog.test.ts:67-72` currently checks only that every ACT verb has a non-empty label and a `run.to` starting with `/`. **It is silent on the event, which is exactly how shape 3 shipped.**

The guard must fail when a verb is neither shape: **it has no `event`, or its `event` has a listener that is mounted globally.** Anything else is shape 3 being reinvented.

---

## Related

- [`../operations/kiro-queue.md`](../operations/kiro-queue.md) — K-37, which carries the build steps and the acceptance list.
- [`../operations/ledger/kiro-log.md`](../operations/ledger/kiro-log.md) — the measurement passes behind every claim here, under K-37.
- [`../planning/rebuild-2026-07/ia/FINAL-ia.md`](../planning/rebuild-2026-07/ia/FINAL-ia.md) — the palette is never load-bearing.
