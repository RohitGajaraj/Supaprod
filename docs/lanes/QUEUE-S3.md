# QUEUE — S3 · THE PLATFORM (`lane/platform`)

> _Written by S0 2026-08-26. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Your brief is
> [`SESSION-3-THE-PLATFORM.md`](../../the-first-run/SESSION-3-THE-PLATFORM.md)._
>
> **Ask in `coordination/requests/S3/`. Anything needing money, a real customer's data, or a
> credential the founder holds personally goes to him — S0 escalates within the unit.**

## 1 · The verdict reaches a person who left the page — authorised gap #2

- **Goal:** a result finds the person who closed the tab. One channel, done properly, end to end —
  **email is the recommendation** because it needs no device permission and no app install, and the
  founder can receive it today.
- **User value (§0 q1/q2):** the person gets on with their day and the answer comes to them. **What
  they stop doing: returning to the tab to check whether it finished.**
- **Why this is first, and it is ranked #2 of the authorised gaps:** *"The whole frontier is async:
  submit and leave, the result comes to you. We require attendance and call it visible agency. **No
  notification, email, push or digest exists** that carries a verdict to someone who closed the
  tab."* **S1 is shipping the promise — "I'm on it, you can leave this page" — in the same phase.
  Until you ship this, that promise is not true, and standard #7 forbids claiming it.** Coordinate
  through `coordination/requests/` so the two land close together.
- **Files:** `src/components/notifications/**` and route `notifications` are yours. **The trigger is
  NOT yours** — the send must fire from the spine when a verdict lands, and `src/lib/**` is S0's.
  File `coordination/requests/S3/verdict-notify-trigger.md` naming the event you need and the payload
  fields; S0 builds the trigger. Build the preference surface, the template and the delivery
  settings against that contract.
- **Acceptance:** a real verdict produces a real email to a real address, verified by receiving one
  — **not by a green unit test.** The message names what was predicted beside what happened
  (that pairing is the product) and links to the run. A person can turn it off in one place.
  Plain words only: never *unattended*, *first run*, *provenance*, *receipts*, *ledger* (canon), and
  never *agentic · autonomous · AI-native · orchestration · intelligence* in the copy.
- **CHECKED FIRST:** grep for any existing mailer, `resend`, or notification table before building.
  **Twenty connector providers already exist** in `src/lib/connectors/providers/` including Gmail and
  Outlook — S0's connector audit (1c) has not run yet, so **ask S0 what is already wired before you
  add a sixteenth adapter.**

## 2 · Four routes for one idea become one sentence and one page — §0.5 fold

- **Goal:** `engine-room`, `guardrails`, `govern` and `boundary` collapse into **one sentence in the
  footer** (what the AI teammates may do right now) and **one settings page** (where you widen or
  narrow it). `THE-ONE-SCREEN.md` already ruled this shape — finish it, do not redesign it.
- **User value (§0 q1/q2):** the person understands what their teammates are allowed to do without
  learning four words for it. **What they stop doing: guessing which of four pages holds the
  setting.** Under §12 all four names fail the say-it-out-loud test; the plain words are
  **"What it's allowed to do"**.
- **The engine exists and has never been plugged in — S0 verified this claim on 2026-08-26 and it
  is TRUE:** `resolveApprovalPolicy` in `src/lib/ai/approval-policy.ts` has **zero callers**
  (`grep -rn resolveApprovalPolicy src/` returns only its own file and its test). `autonomy-policy.ts`
  and `autonomy-policy.server.ts` exist. **Wire it; do not rebuild it.** The call itself lives in
  `src/lib/**` which is S0's — file the ask.
- **Files:** `src/components/governance/**` (`BoundaryControls.tsx` already imports the autonomy
  policy — start there), `src/components/settings/**`, `src/components/engine-room/**`, and routes
  `boundary` `govern` `guardrails` `engine-room` `settings`.
- **Acceptance:** one page, one footer sentence, three routes redirecting rather than 404ing —
  **and S0 rules the fold before you delete anything.** Propose it in
  `coordination/requests/S3/fold-boundary-four-into-one.md` with **every caller you found and where
  it redirects**. An unset ceiling reads as unset or as its real number, **never "unlimited"**
  (R-22). Designed sad paths: permission-denied, unset, and loading.
- **CHECKED FIRST:** `BoundaryControls.tsx`, `autonomy-policy.ts`, and the four routes. Say which
  existing surface you kept.

## Standing, every unit

`git fetch origin && git rebase origin/main` · `cat docs/lanes/NOW-*.md` ·
`cat coordination/answers/S3/*.md` · rewrite `docs/lanes/NOW-S3.md` · append `docs/lanes/log/S3.md` ·
commit explicit paths (**never `git add -A`**) · `git push -u origin HEAD`. **R-21: `lsof -ti:5173`
first, `DEVSERVER` in your NOW line, kill it the moment the check is done.**
