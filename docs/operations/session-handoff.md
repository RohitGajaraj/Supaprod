# Session handoff (durable)

> _Last updated: 2026-07-30 20:10 IST. 27 commits, all pushed. `main` clean, tsc 0, build 0, 6407 pass / 0 fail. Four founder calls open at the top of the 07-30 section._

**This file is the durable, git-tracked session handoff.** It replaces `.remember/remember.md` as the committed record, because that file empties itself on read.

---

# 2026-07-30, the spine, the lineage graph, and one disease named

## THE FOUNDER'S OPEN CALLS (do these first)

1. **`AI_PROVIDER_FALLBACK=1` is set locally and OFF in production.** With it, a
   hard-failed model degrades to the next candidate; without it the whole Ask
   fails as "I hit a snag". Recommendation: set it in production rather than
   pinning a model, because pinning goes stale the next time a vendor retires
   something, which is exactly what happened to `gemini-2.5-pro` today.
2. **The demo-clone migration is APPLIED but only affects FUTURE clones.**
   Existing demo workspaces keep their colliding ids until re-cloned, and
   re-cloning wipes that workspace and resets its approval queue. Do not
   re-clone `explore@` before a YC look.
3. **`research.server.ts:220` reads `opportunities.status` while
   `roadmap.functions.ts` writes lanes to `roadmap_bucket`.** Different columns.
   That chat snapshot surfaces one row and would not reflect the roadmap even
   once it is filled in. Live bug, scoped and not started.
4. **`architecture/data.md:30` documents `roadmap_items` as a real table.** It
   has never existed in any migration. That doc line is almost certainly where
   four broken code maps came from. One-line fix, prevents recurrence.

## THE DISEASE, and it is the most useful thing to carry forward

**Capability built, door missing.** Eleven instances surfaced in one day, all
the same shape: the server logic is finished and correct, and the four lines
that put it on screen were deferred as trivial. Every one of them reads as "not
built" to anyone using the product.

The seven-stage strip nothing published. Build, whose route was a redirect onto
a different axis. The agent the header could not name. A complete theme system
with no switch. A chevron with no menu. **Sign-out reachable from one retired
component, so the shipped shell could not log out.** Voice wired into a hook the
pane never rendered. A lineage sheet written 17 days earlier and never mounted.
`findAuditIds` with zero callers. `/artifacts`, 575 redesigned lines nobody
could reach. The `deprecated`/`replacement` mechanism in `models.ts`, built for
exactly today's problem and never used once.

**This is now a build failure, not a discovery.** `route-inventory.test.ts`
gained an authenticated half (`d20bb171`). The rule that makes it work: **a link
from a RETIRED surface does not count.** `/artifacts` WAS linked, from
`MissionShell.tsx`, so a naive inbound-link check would have passed it green
every day it was unreachable. `RETIRED_LINKERS` names those files, so retiring a
surface immediately tells you what it was the last door to. Proven to fail by
planting an orphan route, not just proven to pass.

## What shipped, by theme

**The spine.** The 01-07 strip reaches every station and Build finally has a
room (`293cac75`). `/build` was a 28-line redirect to `/runs`, which is a
DIFFERENT AXIS: `/runs` lists runs, one piece of work walking all seven stages.
Six stations had real surfaces; Build had none, and the redirect was perfect
camouflage because the URL answered and a real page appeared. One shared
`useSpineStrip` hook, seven surfaces, one query.

**The shell.** Board in one click, plus three controls that were lying
(`664d1437`): `IconGear` was drawn as a SUN sitting where every app puts a theme
toggle, so the founder pressed the theme switcher and got Settings and reported
it broken. He was reading the icon correctly. The scope chevron promised a menu
and delivered a navigation. And `auth.signOut` was called in exactly one file in
the repo, inside the retired chrome.

**The status line** (`ae208325`) says a true thing, fits it, and goes where it
points. Measured: header 1600px, line pinned to 680 by a max-width, title needed
553 and got 386, **446 pixels sitting empty**. `flex: 1` was asking and the cap
was refusing. Clicking it went to `/runs` from every state, so pressing "21
calls need you" landed on a list of runs.

**One blink, enforced in the primitive.** `MarkStack` took ONE state and applied
it to every agent, so a stack of four asked for `gate` blinked four marks in
unison, which is precisely the failure the rule was written after, reproduced by
the component the rule governs. A rule every caller must remember is a rule that
gets forgotten, and this one already had been.

**Reliability** (`09d49396`). A run sat `status='running'` for FIFTEEN DAYS with
zero tokens and no checkpoint. `resume-runs` could not help: its only give-up
path is scoped to missions that never PLANNED (`stepCount > 0` continues), so
the shape most likely to be genuinely stuck had no ceiling at all. The measure
is PROGRESS, never age, and `waiting_approval` is never swept because it is
waiting on a human, legitimately, for days.

**The lineage graph**, end to end. `walkLineage` (pure, both directions),
`getLineageGraph` (resolver), the ported pane, and three doors. 43 real edges on
the founder's workspace spanning `theme -> opportunity -> decision -> prd ->
mission -> changeset -> deployment -> learning`, including the loop closing back
(`learning -> decision`).

**Ask** rebuilt: markdown rendered at ONE boundary every message crosses, a
working indicator, a fresh pane that shows no approvals until asked, starters
grounded in real workspace state, a conversation switcher, the mic, thin
scrollbars, and Cmd+J removed so one box has one key.

## THE TRAPS, and these are what a future lane will actually hit

- **Two vocabularies, no reconciliation.** `ARTIFACT_KINDS` says `prd`;
  `AUDIT_KINDS` says `spec` for the same thing. NEITHER contains `changeset` or
  `deployment`, and both are in live data. A walk validated against either drops
  `mission -> changeset -> deployment -> learning`, the ENTIRE forward chain,
  answering "this caused nothing" about a mission that shipped. `lineage-graph`
  is deliberately vocabulary-agnostic. **An audit tag resolves to `spec` and no
  edge ever says `spec`**, so focus kind must come from the EDGE TABLE.
- **Six hex characters collide.** `OPP·600000` matched SIX real opportunities and
  `MIS·600000` matched THREE. The old resolver returned whichever came first,
  with a real title and a real chain, and nothing said it had chosen. **I
  "verified" the pane against MIS·600000 and reported it resolved to one
  mission. That was a coin flip.** The failure was invisible because a wrong
  answer looked exactly like a right one.
- **`tsc` does not typecheck `.select()` strings.** Cost several runtime bugs
  today. `agent_runs` has no `updated_at`; `mission_steps` has no `title`. A
  wrong column returns null data and reads as "zero rows".
- **`roadmap_items` never existed** in any migration. Four files mapped to it.
  Removed, not remapped, because `roadmap_bucket` is NULL on all 21
  opportunities, so a remap would have resolved 100% of hits to wrong rows while
  looking like it worked. Truth now lives once in `lib/artifact-tables.ts`.
- **`activeModelId` runs BEFORE capability routing**, so a dead model id must be
  removed from `capability.ts` too or the deprecation mechanism never sees it.

## ON VERIFICATION, learned the hard way

Two of four browser verifications today were **true about what I saw and wrong
about what it meant**: the ambiguous tag above, and "feeding ids into chunkRefs
lights the record register" (it only did on the FAILURE path; the success path
was suppressed by a web-mode gate). Seeing it work is not the same as knowing
what worked.

Subagent self-reports drifted too: one reported a test count of 6227 for three
consecutive rounds while the tree was at 6310, and described a 3-line diff as an
architecture rebuild. **A number moving the wrong direction is the cheapest
signal that a report describes a different moment than the one you are in.**

## COORDINATION, the mistake to not repeat

Telling a subagent "do not commit" while the parent commits the shared working
tree is an incoherent instruction, and it entangled two lanes in one commit.
Either the parent stages **precise paths** and never `git add -A`, or the lane
owns its own commit.

---

# 2026-07-29 evening, the run spine and the parallel sweep

## State: green, and pushed

`main` is at `b54482dd`. Working tree clean. tsc 0, build 0. Every lane below is
committed and pushed to `origin/main`.

## What the founder found, and what it actually was

The founder opened localhost and reported that the run section still rendered in the
legacy design. That was exactly right, and the cause was one line:
`AppFrame.tsx`'s rail pointed **Runs** at `/m`, which is Mission Control, the single
surface the rebuild never ported. So the primary nav row for the engine's spine landed
on the legacy five-region shell.

They also asked whether a run is only the build leg. It is not, and the code already
agreed: `missions.current_agent_id` can be any of the thirteen agents, and
`/build/$missionId` already branched to `MissionOrchestratorDetail` for missions with no
builder run at all. The route was named Build purely as a leftover of the
Builder to Studio to Build rename, and the name was telling users the spine covered one
stage of seven.

## What shipped

**The run spine.**
- `/build` is now `/runs`. `/build/*` stays alive permanently as a redirect carrying
  search state, per this repo's rule that an existing URL keeps working.
- The seven-stage strip belongs to a run. The shell owns the region, the run owns the
  content: a surface publishes through `src/components/shell/run-strip.tsx` and only a
  run does, so the strip is always there on a run and nowhere else. It was previously
  drawn on every route, hidden by default, and showed workspace-wide activity rather
  than one run's progress, which is the inverse of the founder's ruling.
- The chips are a segmented control. Clicking 05 swaps the work region to Build for this
  run; you never leave the run to walk its own lifecycle.
- `src/lib/run-stages.functions.ts` reads the other six from the record, walking
  mission to changeset to prd to opportunity / decision / flow / scaffold / learning.
- The diffstat states LINES. It stated characters, which is not a diff: a line rewritten
  to the same length nets to zero, and so do two lines swapped. New pure `diffStat` in
  `studio-hunks.ts` sums the same `computeHunks` alignment the Changes tab renders from,
  so the headline cannot drift from the hunks underneath it. 7 new tests.
- The Runs board: a second view, columns by work state (In plan / Working / Waiting on
  you / Done / Stopped), measured in a headless browser. Five columns at 1440 and 1366,
  three below 1040px of board width, zero horizontal overflow at any width.

**The surfaces.** Crew became where you govern (autonomy dial, tool-reach cap, enable
switch moved from Settings; per-tool controls drawn only where `resolveToolMode` would
honour them). Settings and Sources were redesigned, Sources splitting into what the crew
reads and what you can add. Brain gained a reader for house rules and the recall line,
both of which were being written and read by nothing.

**The design system.** `Grid`, `Cell`, `Choices`, `Checkbox`, `Value`, and `htmlFor` on
`Line`, closing gaps three lanes each worked around by hand. Seven components ported off
the retired system, nine orphans deleted.

## Bugs found on the way, all fixed

1. **`trust.server.ts` held opposite defaults for one column.** `loadAgentArc`, what the
   loop calls, returns `trusted` when no `agent_autonomy` row exists per the 2026-07-08
   founder ruling. `computeAllAgentTrust` returned `observing`. Every workspace that
   never touched the dial was told its crew was on probation while the loop ran it
   autonomously.
2. **`agent-fleet.ts`'s `RUN_STATE` had no entry for `"complete"`**, which is what
   `runAgent` writes on success, so finished runs bucketed as "other" and went uncounted.
3. **`TeamCard` rendered "No invitations yet" on a FAILED read**, a lie about the
   workspace. `MembersCard`'s error said "Try again" with nothing to click.
4. Two Supabase selects named columns that do not exist (`opportunities.evidence_count`,
   `studio_changesets.file_count`). Both typechecked clean.

## THE TRAP THAT CAUGHT THIS SESSION THREE TIMES, READ THIS

**`tsc` does not catch a bad Supabase select string.** `.select("a,b,c")` is a plain
string in the generated types, so a wrong column name typechecks perfectly and fails at
runtime. Verify every selected column against `src/integrations/supabase/types.ts`
directly. `file_count` is the nastiest case: it LOOKS real because it is a field on the
`StudioChangesetSummary` TypeScript type, but it is computed from child rows, not stored.

**Second trap: `src/styles.css` is a FILE beside the `src/styles/` DIRECTORY.** A grep
over `src/styles/` misses the 122KB root stylesheet and will tell you that `bento`,
`mono-label`, `--hairline`, `--madder` and `--moss` are dead. They are not; they resolve,
and they resolve dark. One commit message in this session says otherwise and is corrected
by the next.

**Third trap: `styles.css:2174` has an unlayered `[data-obsidian] :focus-visible` with
`box-shadow: none`**, and it sits after `primitives.css` in source order. So a focus ring
written in `primitives.css` is inert, and any box-shadow on a focused element is erased.
Five rules in `primitives.css` are currently inert because of this.

## Open, and waiting on the founder

1. **Mission Control: harvest then retire, or retire now?** After the rail repoint there
   is exactly one live door left into the legacy shell: the composer, when you pick a
   journey, opens the per-product stage canvas. Retiring it is NOT a deletion.
   `faces.tsx` is 102KB of eight real stage canvases (Evidence, Decision, Spec,
   Prototype, Code, Ship, Growth), and they are product-scoped where the new strip is
   run-scoped, so one does not simply replace the other. Recommendation: harvest the
   faces for the depth the stage panels need, then retire.
2. **The success-toast rule.** `docs/conventions/anti-slop.md` does NOT ban success
   toasts, despite several briefs in this session claiming it does. The doctrine is real
   (agents/FINAL-agent-presence.md R10, "the Commit": settling a call writes a receipt
   showing what it caused, not a toast confirming the click registered) but it lives
   elsewhere. Meanwhile `_authenticated.settings.tsx` has 10 `toast.success` calls.
   Either write the rule into anti-slop.md and sweep Settings, or accept toasts outside
   the run surfaces.
3. **97 failing tests, all pre-existing.** They assert the inline-style anatomy of
   design-system components no lane touched (`src/components/discover/DetailKit`,
   `StatCell`, `SignalCard`, `StatusPill`), plus a guardrail for the superseded
   DESIGN-TEMPO contract. The 20 tests covering files changed this session pass. They
   need updating or deleting; 97 red is how a real regression hides.

## The sweep, as measured rather than assumed

Every `_authenticated.*` route was surveyed. **All of them are ported except the three
Mission Control routes** (`m.index`, `m.$productId`, `$workspaceSlug.$productSlug`), and
that is a founder decision, not a port. The nine `/admin` children landed last, in two
parallel lanes.

The six stage panels are no longer thin: each reads real evidence for its stage on that
run, from a named table, with empty states that distinguish "nothing happened" from "no
link from this run to it".

## Verified in a browser, not just by tsc

Signed in as `harbor@` at 1440 and looked. This caught what grepping had missed: FOUR more
live doors into the legacy room, including the post-login landing itself. It also caught a
bug I had written, where the active stage chip used a box-shadow that the app-wide
focus rule erases, so it deleted its own indicator on the click that set it.

**The lesson worth keeping: a grep over call sites found one door; opening the app found
five.**

`/admin`'s six ported children could NOT be visually verified: `harbor@` is not an admin
and claiming admin is a real write on a shared account.

## Open, and waiting on the founder

4. **The demo reset button is dead.** `admin_reset_demo_workspace` raises "Safety gate:
   not a redcadence.app workspace", but the demo logins moved to `@supaprod.ai` on
   2026-07-25. It throws for every account it is offered on. The lane correctly refused to
   loosen the client check, which would have drawn a button the database rejects. The fix
   is a migration. This matters because `harbor@` is what the demo script rehearses on.
5. **The routing pin records a decision the engine ignores.** `routing.pin.*` is written by
   a real server function, and `runtime.server.ts` has zero references to it, so models
   resolve through `capability.ts` regardless. The control was kept and now says so
   plainly. Wiring it is a chokepoint edit, which is founder-attended by convention.

## Primitive gaps three separate lanes hit independently

- **`Row` cannot own an expanded detail.** Three lanes each reached for a wrapper div,
  which silently kills the `.sp-row + .sp-row` divider because an adjacent-sibling
  selector does not see through a wrapper. Same trap, three times.
- **`.sp-tabs`/`.sp-tab` have no component.** Six routes hand-write the same
  `role="tablist"` markup.
- `Field` has no second line; `Empty` is drifting into a general quiet-note slot; `Row`'s
  `time` prop is now carrying trailing metrics its name does not describe.

## Parked, founder's call, 2026-07-30: PM language beyond Ask's starters

The founder asked for product-manager vocabulary in Ask's starter templates: impact,
quarter, roadmap, bets, what the agent is doing, "slightly on the business side", so a
power user feels the platform was built for them. He then scoped it deliberately:

> "Whatever I've said, that is only from a starter perspective of task panel, what we are
> giving you starter template messages, what to pick. Only from that perspective, not
> across the entire product surface. If you're not touched upon, let's not pick that right
> now. But anyways, make a note of it. Later on, we'll come back."

**Done, and confined to Ask.** `src/lib/ask-starters.ts` (plus its consumer `AskPane.tsx`
and its test) is the ONLY place this landed. Verified by grep: nothing else in the tree
references `contextualStarters` or the prompt sets. No other surface's copy was touched.

**The open question, for later.** The same two rulings would apply to every surface that
speaks to a PM in the product's own vocabulary rather than theirs: empty states, gate
questions, run summaries, Today's headline. Two things to carry over when we do:

1. **Business framing, workspace facts.** PM language pulls hard toward metrics we do not
   store (revenue, ARR, NPS, MAU, conversion, LTV). A line promising one teaches a PM in a
   single press that the product talks a good game and cannot answer. `ask-starters.test.ts`
   has the banned-metric guard; whatever comes next should inherit it rather than reinvent
   it. What we CAN settle: decisions and rationale, outcome verdicts (VALIDATED / MISSED via
   `loadDecisionPrecedent`, which is what makes "did this bet pay off" a real question),
   ICE-ranked opportunities, signal clusters, specs, runs with steps and metered cost, the
   approvals queue.
2. **Never a static message.** His stronger ruling, and it is architectural rather than
   editorial: copy must derive from the surface the person is standing on. Ask does this by
   deriving its offers from the same scope resolution that feeds the header chip
   (`contextualStarters({ scopeKind, scopeLabel })`), so the chip and the suggestions are one
   fact said twice. Any surface that adopts PM voice should adopt that shape too, or it will
   drift back into a hand-written constant within a release.
