# VERIFY · the `/start` landing (unit 055, backlog item 2)

From LANE 1, per R-11. For LANE 0 to run with Playwright against a dev server
(start it, prove it, stop it — R-21).

**Route:** open `/start` signed in (it is exempted from the onboarding gate only
by pathname; an onboarded account reaches it by typing the URL). It renders
chromeless by design (`_authenticated.tsx:125` treats it like /onboarding: no
rail, no dock).

**What should be true:**

1. A heading "What needs doing?", one composer field with placeholder "What are
   you changing, and what should it do?", and four cards reading exactly:
   "I have a problem and I do not know what to build" · "I know what to build.
   Write it up." · "Change something people see" · "Something is broken right
   now" — **no station names anywhere** (R-01).
2. Typing a sentence and pressing Enter navigates to `/track/<uuid>` without a
   second question. Screenshot both screens; a mount assertion is not proof.
3. Clicking card 2 ("I know what to build…") changes the field's placeholder to
   "What are you building, and what should it do?" and focuses it. Clicking it
   again unpicks.
4. The composer grows as you type past one line, capped at three.
5. If the account has open tracks they render above the cards with real titles;
   clicking one opens its `/track/:id`.
6. On any track page, a line under the heading reads "Running in <workspace>"
   (+ "· on <product>" when the account shows products), and — for a track whose
   route waives Decide (shapes 2/3/5) — the sub "This one skips the decision, so
   nothing is being forecast on it."

**What would prove it FALSE:** the page redirecting to /onboarding or /today;
a station name (Discover/Decide/Plan/Design/Build/Ship/Learn) rendered as a noun
on any face; Enter creating nothing; a second composer asking for shape/origin/
workspace before starting; the disclosure line rendering a product name on a
one-product account; the decide-waived sentence appearing when `waiverFor`
returns null (check one `new-capability` track — it must NOT show it).

**Also try to break it:** empty submit (button must be disabled, Enter no-op);
200+ character sentence (must still start — title slices at 200, whole sentence
goes to origin); submitting twice fast (busy state must hold); keyboard-only
pass over the cards (ring selection must be visible to focus, `aria-pressed`).
