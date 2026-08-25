# Unit 068 · the core flow proven live: sentence → Enter → the run

LANE 1 · 2026-08-25 · dev server started (port checked free), used for one
batched verification session, **stopped immediately after** — before any of this
write-up.

## The one test the mission is named for, executed on harbor@

Typed "Add a print-friendly checklist summary page for field crews" into
/start's composer and pressed Enter.

**Result: a track was created and the browser landed on its run page —
`/track/0265dfcb-9862-4947-910f-c11a71c7dd79` — with zero configuration and no
second question.** The page rendered completely: disclosure line ("Running in
Helio Labs · on Relay"), the artifact pane with station tabs showing the honest
zero ("Nothing has been filed against this work yet."), and the Run-it control.
Screenshot: `.playwright-mcp/verify-start-flow-new-track.png`.

This is acceptance criterion 3's front half proven in a browser, not asserted:
one action, zero configuration, landing on the watchable address. The back half
(autostart so landing IS the start) remains item 28, LANE 0's — click count
stands at 2 until it lands.

## Item 24 verified in passing (LANE 0's build)

"Copy a summary of this run" clicked on the new track: announced **"Copied.
Paste it wherever the review happens."** inside a status region — visible,
polite, screen-reader-announced. NOT verified: the pasted content itself
(clipboard read timed out on a permission prompt in automation; paste-quality
check stays open for LANE 0 or the founder's own paste).

## Also confirmed live this session

- Open-work section on /start now shows FOUR real runs — the section updates as
  the workspace works (with the new 20s poll from unit 067).
- Hold sentences on those rows have changed between sessions ("being sent for a
  fix" now appears) — the rows read live data, not cached copies.

Cross-signoff per R-11 still belongs to LANE 0; `verify-start-landing.md` is
updated with what is already observed so their pass can focus on what is not:
Enter-with-empty (disabled), 200+ char sentences, double-submit, keyboard walk,
and refusal rendering.
