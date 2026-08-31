# QUEUE — S2 · MISSION CONTROL (`lane/control`)

> _Written by S0 2026-08-26. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Your brief is
> [`SESSION-2-MISSION-CONTROL.md`](../../the-first-run/SESSION-2-MISSION-CONTROL.md)._
>
> **Ask in `coordination/requests/S2/`. You have no database — every number you display comes from a
> payload, and you name the field and its writer in your unit file.**

> ## ⚠ TWO PREMISES IN YOUR BRIEF ARE STALE. S0 RE-MEASURED THEM 2026-08-26.
>
> **1. `run-rows.tsx` has been adopted. It is no longer the orphan your brief describes.** The
> original finding (F-13, `FRONTIER-BRIEF.md:64`) was precisely worded — *"the one Meridian file
> with no importer **outside its own module and tests**"* — and that is what changed. Measured
> 2026-08-26 with `grep -rn "from ['\"].*run-rows" src/ --include=*.tsx --include=*.ts | grep -v
> '\.test\.'`: **two importers now sit outside the module** — `src/components/track/ArtifactPane.tsx`
> and `src/components/spine/TrackActivity.tsx` — plus five within it (`ToolStream`, `PlanCard`,
> `RunTimeline`, `AgentInbox`, `use-elapsed`). **So "start there because nothing imports it" is no
> longer the argument.** The reuse duty stands and is stronger for it: it is the run vocabulary,
> two surfaces already speak it, and a third that invents its own row is a fail.
> **2. It lives in `src/components/meridian/run-rows.tsx`, which is S0's prefix, not yours.**
> Import it freely; **do not edit it.** If it needs a change, file
> `coordination/requests/S2/mrd-run-rows.md` and S0 reviews it hard — a primitive is used by every
> future surface.
> **3. `rail-presence.ts` and `run-strip.tsx` are already wired**, not orphaned:
> `src/components/shell/AppFrame.tsx:140,142` imports `deriveRailPresence` and `RunStripProvider`,
> and `use-spine-strip.ts`, `StagePanel.tsx`, `settings` and `runs.$missionId` all consume
> `run-strip`. **Brief unit 2 is therefore not "wire them" — it is "check what the wiring already
> renders, and fix what it gets wrong."** Open the route and look before you write anything.

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
> **THE STALL YOU CLEAR: the operator's side of approval gates and reviews** — one board sorted by *what needs a person soonest* replaces a queue nobody opens. **A queue whose length is set by how much nobody trusts is not fixed by making it faster to read.** `docs/strategy/ai-native-sdlc-rewiring-2026-08.md` §3.5.
>
> **YOUR TIER 1 ITEM:** **F-144, F-145 and F-146 — the founder's own report, and it outranks #8.** The rail sends a landing person away from home: `SIGNED_IN_HOME` flipped to `/start` on 2026-08-25 and **the rail was never flipped with it**, so `Today` sits first (`AppFrame.tsx:339`) above the home you actually land on (`Work`, `:365`). Four of seven doors contradict an existing ruling. **The ruling is one primary door with the board folded into it — not a rename, which leaves two doors and moves the confusion.** Full ruling and acceptance in the ranked backlog. **Then** #8.

## 1 · One board that replaces the seven doors — brief unit 1

- **Goal:** every piece of work in flight on one surface: its live verb line, its owner, its elapsed
  clock, its next action, sorted by **what needs a person soonest**. `cockpit`, `fleet`, `swarm`,
  `observe`, `today`, `runs`, `missions` collapse into it.
- **User value (§0 q1/q2):** the person stops opening seven doors to answer *"what is happening and
  what needs me"*. **What they stop doing: checking `/today` then `/runs` then `/observe` to build
  the picture in their head.**
- **This is §0.5 work — the count must go DOWN.** State in your unit file which routes this folds
  and where each caller redirects. **A route folded without its callers redirected is a 404 in
  production**, and **S0 owns every deletion** — propose the fold in `coordination/requests/S2/`
  with the callers you found; do not delete a route yourself.
- **Files:** `src/components/runs/**`, `src/components/today/**`, `src/components/observe/**`, and
  the routes listed for you in operating-model §3. Import `@/components/meridian/run-rows` for the
  row vocabulary — do not restate it.
- **Acceptance:** one route shows every in-flight piece of work; sort order is genuinely "needs a
  person soonest" and you can name the field it sorts on and who writes it; every row offers a next
  action (**no dead end**, R-20); designed empty state that says what to do next; both themes;
  `--mrd-*` only. **Open it in a browser and look — a mount is not a render.**
- **CHECKED FIRST:** `run-rows.tsx` (seven importers, read it), `run-strip.tsx`, `rail-presence.ts`.

## 2 · The handoff, drawn — brief unit 3

- **Goal:** when work moves between teammates, the surface shows **what was handed over**. One line
  on the object: what produced it, and what it feeds — clickable.
- **User value (§0 q1/q2):** the person stops reconstructing why a spec exists by opening four
  objects. **What they stop doing: asking "where did this come from".**
- **Why this one and not collision (brief unit 4):** §0.5 names connectedness as *the* defect —
  *"we built the graph and never drew it"* — and the lineage is already in the data:
  `decisions`, `spine_tracks`, `changesets`, `deployments` and `agent_memory` carry it, and on real
  lineage **decide's largest inbound source is already learn, 36 edges against 9 from
  opportunities.** It is nearly free. **Collision (unit 4) is deferred behind it deliberately:** a
  dedupe screen that returns nothing is worse than none — the restatement fold answered `ids: []`
  and produced the graveyard — so it needs the visible-reasoning design your brief demands, and that
  is a bigger unit than this one.
- **Files:** `src/components/runs/**` and your route set. **The lineage read is S0's** — file
  `coordination/requests/S2/lineage-payload.md` naming exactly which edges you need on which object,
  and S0 answers within the unit. Build the surface against the shape you asked for; do not invent
  a number to fill it.
- **Acceptance:** every object on your surfaces carries its produced-by and feeds-into line; each is
  clickable and lands on the real thing; an object with no lineage says so plainly rather than
  rendering an empty row. **This unit must not add a destination** — it is a line on things that
  already exist.
- **CHECKED FIRST:** `TrackChain` — it was built to a founder ruling, sat with **zero importers for
  24 days**, and the founder re-requested the same thing unaware it existed. Read it first and say
  whether it serves.

## Standing, every unit

`git fetch origin && git rebase origin/main` · `cat docs/lanes/NOW-*.md` ·
`cat coordination/answers/S2/*.md` · rewrite `docs/lanes/NOW-S2.md` · append `docs/lanes/log/S2.md` ·
commit explicit paths (**never `git add -A`**) · `git push -u origin HEAD`. **R-21: check
`lsof -ti:5173` first, say `DEVSERVER` in your NOW line while you hold one, kill it immediately
after.**
