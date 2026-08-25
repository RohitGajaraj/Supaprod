# UNIT L0-078 — three verifications on one live page: 29, 7, and 21's structure

**Lane:** LANE 0 · **Against:** production,
`/track/e976e60e-be6f-423e-b640-4ca26a469e11`, harbor@ · **No dev server.**
Screenshots: `item29-exhausted-banner-live.png`,
`item7-reveal-in-pane-verified.png`.

## 1 · Item 29 — the exhausted banner, rendering because it is TRUE right now

The falsifier I had marked "needs MAIN's zeroed fixture" unblocked itself:
harbor's account is actually at zero today, and the banner I built for exactly
this state is live at the top of the app:

> *"The AI credits ran out, so agent runs have stopped. Top up and they start
> again from where each one stopped."* + **Add credits** → `/settings?section=credits`

One sentence naming what happened and what to do about it; the link resolves.
This was the acceptance's "screenshot of the warning state, not a mount
assertion" — done. It also confirms the AUDIT's account-level story from the
user side: this is what a person sees instead of a silent stop.

## 2 · Item 7 — reveal-in-pane, clicked for real

Pressed chain row *"Atlas Offline Checklist Sync Resilience Surface"* (Design):
the pane's selected tab moved Build → Design and the tabpanel rendered the
prototype as itself — title, Aug 18, `prototype` kind, body. The click-to-reveal
contract works end to end.

## 3 · Item 21 — structure asserted against production DOM

The transcript carries `role="log"` labelled *"What the agents did, newest
first"*, and 3 polite/status regions sit on the page (walk result + consent +
copy feedback). Screen-reader session still owed for the full R-19 pass; the
structural half of the claim is now production-observed, not test-only.

## Ledger after this unit

Every LANE 0 verification reachable without MAIN is DONE. Remaining blocked:
23 populated (needs one successful `studio.review` anywhere), 34's cap message
(needs a genuine 24-leg walk), Learn settle (needs M-3's first grade),
transcript motion observed mid-walk (L0-041).
