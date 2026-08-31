# QUEUE — S3 · THE PLATFORM (`lane/platform`)

> _Written by S0 2026-08-26. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Your brief is
> [`SESSION-3-THE-PLATFORM.md`](../../the-first-run/SESSION-3-THE-PLATFORM.md)._
>
> **Ask in `coordination/requests/S3/`. Anything needing money, a real customer's data, or a
> credential the founder holds personally goes to him — S0 escalates within the unit.**

> ## ⚠ RE-RANKED 2026-08-31 BY FOUNDER INSTRUCTION. READ THIS BEFORE THE ITEMS BELOW.
>
> The order in [`../../the-first-run/RANKED-BACKLOG.md`](../../the-first-run/RANKED-BACKLOG.md)
> **supersedes the order in this file.** The items below are still specified correctly; they are no
> longer necessarily topmost. Two rulings changed the ranking: **§0.7 the freeze** (every lane's
> weight on platform strength until the acceptance is met) and **§0.8 Anthropic's AI-native SDLC
> playbook as our framework**, which added gaps 15–29.
>
> **Two specs are new and you read them before touching a station boundary, an artifact or a
> handoff:** [`SPEC-AI-NATIVE-SDLC.md`](../../the-first-run/SPEC-AI-NATIVE-SDLC.md) (the adoption
> register) and [`SPEC-STATION-MODEL-AND-ARTIFACTS.md`](../../the-first-run/SPEC-STATION-MODEL-AND-ARTIFACTS.md)
> (why the seven stations stay seven, the artifact formats, running on an engine that is not Claude,
> and the UX contract in its §4).
>
> **THE SEQUENCING GUARD.** Only **Tier 0** moves the acceptance and all of Tier 0 is S0's. Ten new
> gaps arrived from a playbook this week; **a lane that opens with artifact emitters instead of its
> Tier 1 item is re-architecting instead of shipping**, which is this repository's signature failure.
>
> **THE STALLS YOU CLEAR: reviews and policies** — *what counts as done* (nobody has ever written it down; ours are hardcoded by us), and *are we allowed to do this, and who says so*. `delegate.openhands` was refused **7 of 7 times and the queue kept asking** — a policy that does not learn from its own answers is a committee with a database. `docs/strategy/ai-native-sdlc-rewiring-2026-08.md` §3.5.
>
> **YOUR TIER 1 ITEM:** **#2 · the verdict reaches a person who left the page** — unchanged, and it is still first. S1 already ships *"you can leave this page"* on screen and **that sentence is untrue until this lands.** Then #18 (what counts as DONE, from their `REVIEW.md`) and #19 (a declared gate above the inferred policy, and a named approver). **The public surface is frozen and the sixty seconds is measured signed in.** One door is yours in S2's rail fold: `Guardrails` becomes *What it's allowed to do* — coordinate, do not both edit it.

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

## 3 · Why a tool went quiet — the surface that lets the policy bind

- **Goal:** on the "What it's allowed to do" page, show the tools this workspace's own answers have
  changed, each with **the policy's own sentence** and a way to turn it back on.
- **User value (§0 q1/q2):** the person stops being asked the same question they have already
  refused seven times, **and can see why a tool went quiet instead of finding out by it not
  working.** What they stop doing: answering a queue that never learns.
- **THIS IS THE THING THAT UNBLOCKS THE BINDING, and it is worth knowing why.** The engine is built
  and correct and has **zero callers** (`resolveApprovalPolicy`). I built the missing record half
  today (`approvalRecordFor`), and the invariant is proved by test: **a record can switch a tool OFF
  or make it ask more often, and can NEVER earn a tool more autonomy.** So wiring it to the gate is
  safe. **I did not wire it, and not for safety — for silence.** A tool that stops working with no
  explanation is a dead end (R-20 §5). Once your page can show the reason, the gate call is three
  lines and the behaviour binds without going quiet.
- **The read is already built and waiting for you — you are not blocked on me:**
  `getApprovalPolicyState({ workspaceId })` in `src/lib/approvals-queue.functions.ts`. Read-only,
  changes no behaviour, and returns per tool: `decision`, `reason`, `approved`, `rejected`,
  `tightenedFromDefault`.
- **What it returns today, measured 2026-08-26:**
  `delegate.openhands` 0 approved / 7 rejected → `disabled` · `calendar.create` 0 approved / 7
  rejected → `disabled`. **Fourteen requests for two tools refused every single time.** That is the
  doctrine's own line made visible: *"a long approvals queue is a policy failure to surface, not a
  workload to render."*
- **Files:** `src/components/governance/**` and `src/components/settings/**` — the same page as your
  queue item 2's fold, so this is a region on a surface you are already building, **not a new
  destination**.
- **Acceptance:** a person sees which tools their own answers switched off, reads the reason in the
  product's words rather than a status token, and can turn one back on. Only tools with a real
  record appear — a tool nobody has answered is at its default and is **not** a finding, so it must
  not be listed as one. Designed empty state: most workspaces will have nothing here, and that is
  healthy rather than broken. Both themes, `--mrd-*` only.
- **CHECKED FIRST:** `BoundaryControls.tsx` and your queue item 2 fold. Say what you reused.
- **Do NOT** invent a second autonomy ladder here. Earning more autonomy is `trust-ramp.ts`'s job and
  its promotions are themselves approval items; two ladders driven by counting rows is the worst
  outcome available.

## Standing, every unit

`git fetch origin && git rebase origin/main` · `cat docs/lanes/NOW-*.md` ·
`cat coordination/answers/S3/*.md` · rewrite `docs/lanes/NOW-S3.md` · append `docs/lanes/log/S3.md` ·
commit explicit paths (**never `git add -A`**) · `git push -u origin HEAD`. **R-21: `lsof -ti:5173`
first, `DEVSERVER` in your NOW line, kill it the moment the check is done.**
