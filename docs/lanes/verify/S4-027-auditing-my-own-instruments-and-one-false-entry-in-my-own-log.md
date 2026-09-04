# S4-027 · Auditing my own instruments — and retracting a claim in my own buildlog

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _S4, 2026-08-26, on `lane/proof`. `e2e/**` is my own path, and F-89 was caused by something in it.
> R-11 says a lane never signs off its own work; the honest reading of that is that I have to be
> hardest on mine._

---

## 1 · The retraction, first, because it is mine

`docs/lanes/log/S4.md` carries this entry, from earlier today:

> *"S4-018: sixty-seconds spec updated to target Sample sandbox workspace (F-90 fix)"*

**That is false and I am withdrawing it.** What the commit actually did was add

```ts
const SAMPLE_SANDBOX_WORKSPACE_ID = "b90da531-34aa-4009-bcce-2162b87f50ac";
```

and a comment about F-90, and reference the constant **nowhere**. `grep -n
SAMPLE_SANDBOX_WORKSPACE_ID e2e/s4-sixty-seconds.spec.ts` returns exactly one line — the declaration.
The spec still does `page.goto("/start")` with no workspace scoping of any kind. **A constant and a
comment landed; no behaviour changed.**

This is the identical defect S4 filed against another lane the same day — `S4-013`, *"the tone half
of the claim lives in comments, not code."* Filing it against someone else and committing it myself
within hours is the exact failure R-11 exists to catch, and the only thing that makes the other
verdicts worth anything is saying so here.

**Corrected in this commit**, in the one way that is honest: the unused constant is removed and the
header now states the real safety property. Naming a uuid in a file is not scoping a session to it,
and an unused guard is worse than no guard because the next reader stops looking.

---

## 2 · What actually makes that spec safe

**It never submits.** It types into the composer and stops. `page.fill` writes nothing anywhere;
only the press does, and there is no press in the file. That is the whole property, it is one line
long, and it does not depend on which workspace the server points at.

The sandbox workspace belongs in the specs that **do** press — `phase-3-visible-agency` and
`round-8` — and reaching it means signing in and selecting it, not declaring its uuid.

---

## 3 · The audit that occasioned this: can any unguarded spec write?

Fourteen files in `e2e/`. Three carry `test.skip` opt-in guards — `phase-3-visible-agency`,
`round-8`, `s4-sixty-seconds` — and those are precisely the three that press. Ten do not.

**"Unguarded" turned out not to mean "dangerous", and the precise answer is better than the alarming
one.** Counting action-shaped lines (`.click()`, `.fill(`, `.press(`, `request.post|patch|put|delete`)
across all ten:

| Spec | Actions | What they are |
| --- | --- | --- |
| `01-auth`, `02-surfaces-desktop`, `03-surfaces-responsive`, `05-typography`, `06-icons`, `09-elevation-tokens` | **0** | pure reads |
| `04-interactive-states` | 10 | eight `keyboard.press("Tab")` focus checks; one `searchInput.click()` + `fill("test")` — **a search box with no submit**, which is a read |
| `07-accessibility` | 3 | `Tab`, one heuristic dialog open, `Escape` |
| `08-theme` | 1 | one theme `toggle.click()` |
| `waves-1-2-qa` | 1 | one `keyboard.press("Tab")` |

**No unguarded spec can create a track.** F-89's ten production rows came from
`phase-3-visible-agency`, which is guarded now, and the guard held — its run in `64c3808fe` was a
deliberate `PHASE3_PRESS=yes` opt-in, which is the guard working as designed rather than failing.

## The one I would tighten, at its true size

`07-accessibility.spec.ts:196-198`:

```ts
const dialogTrigger = page
  .locator('[data-testid*="dialog"], button[aria-haspopup="dialog"], [aria-haspopup="true"]')
  .first();
```

A **blind `.first()` click on a heuristic selector**. `[aria-haspopup="true"]` matches any popup
trigger — an overflow menu, a combobox, a dropdown — and the spec clicks whatever is first on
whatever route it is on, then presses Escape.

**Today this writes nothing**, because opening a menu is a read, and I am not inflating it into a
finding. It is on the list because it is the class of instrument that stops being safe when a
surface changes underneath it, and nothing in the spec would notice: the assertion afterwards is
`becomesVisible(dialog)`, which is legitimately allowed to be `false`, so a click that opened
something else entirely fails nothing. Tightening it to `button[aria-haspopup="dialog"]` alone costs
nothing and removes the class. **`e2e/**` is mine, so this one I can and will do — in its own unit,
not folded into a retraction.**

---

## 4 · A safety property worth stating, because F-90's rule does not cover the read-only case

`playwright.config.ts` sets `baseURL: "http://localhost:8080"` and has **no `webServer` block**
(`grep -c webServer` → 0). Playwright therefore starts nothing; with no dev server running, every
spec fails to connect. That is a real floor.

**But localhost is not local data, and that is the F-89 lesson.** A local dev server reaches the
Lovable production database through `.env`, so pressing a button on `localhost:8080` writes a
production row. Safety never came from the URL.

Which means the post-F-90 rule — *"point e2e at the Sample sandbox"* — is **necessary for the specs
that press and irrelevant to the ten that do not**, and stating it as a blanket rule invites exactly
what I did above: a session adds a sandbox constant to a read-only spec, logs it as compliance, and
changes nothing. The rule that actually holds is narrower and easier to check:

> **A spec that submits must run in a workspace the sweep provably skips. A spec that never submits
> is safe wherever it points, and must not pretend otherwise.**

---

## Verdict

- **My own log entry S4-018 — RETRACTED.** The claimed fix was a constant and a comment. Corrected
  in this commit by removing the constant and stating the real property.
- **Ten unguarded specs — CLEARED.** None can create a row. The three that press are guarded, and
  the guard held under F-89's post-mortem.
- **`07-accessibility`'s blind heuristic click — noted, not a finding.** Writes nothing today; the
  selector gets tightened in its own unit.
- **The blanket "point e2e at the sandbox" rule — too broad, and it produced a false compliance
  claim within hours.** Narrower form proposed above.
