# Session handoff (durable)

> _Last updated: 2026-08-01 00:00 IST. `main` clean, all pushed through `93e2fac9`. **Four applications submitted, one drafted and waiting on the founder.** Read the 07-31 section first; it is the live one._

**This file is the durable, git-tracked session handoff.** It replaces `.remember/remember.md` as the committed record, because that file empties itself on read.

---

# 2026-07-31, the accelerator campaign: four filed in a day

## WHERE WE STAND

### ✅ Submitted, now waiting

| Program | Filed | Decision | Login spent | Open item |
| --- | --- | --- | --- | --- |
| **Y Combinator F26** | 07-23 | rolling | `explore@` | **Demo + founder video still need updating.** Founder video is 2:37 against their 1:00 rule. |
| **The Residency** | 07-31 | **by 08-28** | none given | none |
| **Betaworks AI Camp** | 07-31 | rolling, batch starts 08-31 | `compass@` | none |
| **South Park Commons** | 07-31 | **invites by 08-30** | `voyage@` | Q10 needs a truth check, see below |

### 🟡 Drafted, waiting on the founder

**EF The Bridge Residency, San Francisco. Deadline 2026-08-30, rolling review so earlier is better.**
`docs/pitch/applications/ef-bridge-sf/`. All fourteen page-1 answers written and verified under the **100-word cap** on every field. Three things outstanding:

1. **A new one-minute video.** EF says "do not pitch an idea or a CV", so the Betaworks founder video cannot be reused. Script is at the bottom of `application.md`, 131 words, names no company or product.
2. **Two references**, one senior. Suggested: an Intellect manager who saw the 0-to-100K platform, and someone from ISRO who can confirm the moved-into-product story, which makes that answer verifiable rather than merely well told. **Message them before submitting.**
3. **Page 2 ("Your Details") has not been captured.** Founder screenshots it, then it gets drafted.

### ⬜ Next in the queue

**Dated:** Sequoia Arc (08-17) · Berkeley SkyDeck (08-21) · Hub71 (08-21) · Slush (08-31)
**Rolling, high value:** Emergent Ventures (equity-free, replies in about a week) · Alchemist (enterprise-only, welcomes solo founders in writing) · Peak XV Surge · Accel Atoms · Z Fellows · Conviction Embed · a16z Speedrun (accepts off-cycle any time)
**One hour, near-certain, keeps getting deferred:** the credits batch. Cloudflare, Microsoft, AWS Activate, Google Cloud, Anthropic, NVIDIA. Structure-agnostic, no entity needed.

**Decided against:** EF London (08-04). Same organisation as The Bridge, wrong geography under the US-primary ruling, no visa help. One EF application plus a note about their US Funding and Fellowships track beats two.

## TWO CONSTRAINTS THAT BITE NEXT SESSION

**Demo logins: three of five are spent.** `explore@` (YC), `voyage@` (SPC), `compass@` (Betaworks). Only `meridian@` and `lantern@` remain, and four dated applications are still ahead of them. **Clone more workspaces before promising a login to a third program**, pattern in `supabase/migrations/20260725140000_clone_helio_to_investor_workspaces.sql`. Sharing one hands the second reviewer an emptied approval queue, which is the exact beat these applications are built around.

**The YC founder video is still 2:37 against a 1:00 rule.** Speed cannot fix it; you would need 2.89x. It needs a re-record against a ~130-word cut, and it is the one open item on an application already in front of partners.

## WHAT THE FOUNDER RULED TODAY (all now in the doctrine)

Everything below lives in `docs/pitch/applications/POSITIONING-DOCTRINE.md` and `ANSWER-BANK.md`. Read those before drafting anything.

- **Rule 4, lead with the person not the market.** The company exists because people get blamed for decisions nobody can reconstruct. Dignity problem before efficiency problem.
- **Rule 5, three layers in order, and the brain guides rather than stores.** Director (tells you what to build, the sharpest claim), operating system (runs the lifecycle), company brain (warns you before you repeat what did not work). "Memory is one layer of the moat, not the headline." Banned: "where the record lives", "the accountability layer" as the whole pitch.
- **Rule 6, the commit count is per-surface.** Fine at YC, SPC and Betaworks; wrong at a builder house. **Never adjacent to "agents wrote the code"**, or the number appears to measure them. Framing that works: "4,297 commits directed and reviewed."
- **The 50-character line depends on the audience.** "Cursor for PMs" for investors; never for builder audiences, where "product manager" is not aspirational. Always name the actor, a verb-first fragment leaves the reader asking what knows. Never close on "remember".
- **Never imply he is not talking to users.** The single thing every accelerator screens hardest for. An early six-month-goals draft said "nobody telling me I am wrong" and read as exactly that.
- **Never open an answer on a negative.** Zero-users belongs at the end of a list, framed as sequencing.
- **Formatting:** paste blocks are reflowed so paragraphs are single lines. Rule is kill mid-sentence wraps, keep deliberate breaks (numbered items, URLs, logins). An earlier blanket-join folded a demo login into the sentence above it.

## VIDEO ASSETS, WHERE THEY ARE

All under `~/Library/Mobile Documents/com~apple~CloudDocs/Supaprod/`.

| | Location | State |
| --- | --- | --- |
| Betaworks x3 | `Beatworks/FINAL/` | Done, 1.15x, all under 2:00 (1:47, 1:40, 1:49). Video 2 has a 1s cut at the original 1:08-1:09. |
| YC founder | `YC/FINAL/` | 1.1x, **2:37, still over their 1:00 rule** |
| YC demo | `YC/FINAL/` | 1.25x, 3:52, over the 3:00 guidance. 1.62x would hit 3:00 exactly if wanted. |
| EF Bridge | not recorded | Fresh 1-minute "who you are" take needed |

Originals untouched in the parent folders. `ffmpeg` recipe used: `setpts=PTS/N` + `atempo=N`, CRF 15, preset slow, `+faststart`.

## THINGS TO VERIFY, NOT ASSUME

1. **SPC Q10, the four discarded versions.** The account submitted (dashboard, then agents he could not trust, then gates with nothing remembering) was **reconstructed from his own written record**, not dictated by him. A partner may ask which version was which. Confirm before any interview.
2. **The hero tagline still ends on "remember".** It is on the deck, the site and every external surface, and it is the same weak word he corrected twice today. Founder-locked, so it was flagged rather than changed. Worth a decision.
3. **`/brief` renders inside an iframe** from `/brief.html`. Fine for humans, invisible to crawlers that do not follow iframes. SEO nit, not an application risk. An earlier "it is broken" alarm was a bad measurement.

## THE CAMPAIGN FILES

`docs/pitch/applications/` is the whole thing.

| File | What it is |
| --- | --- |
| `README.md` | Master index: submitted, urgent queue, rolling, credits, closed, login ledger |
| `POSITIONING-DOCTRINE.md` | **Read first.** How we get selected. Six rules, asset ledger, per-program axis, quality gate |
| `ANSWER-BANK.md` | Reusable answers at every length, live numbers, login allocation |
| `TRACKER-notion.csv` / `TRACKER.csv` | 124 programs, typed columns |
| `board.html` | Read-only dashboard, also published as an artifact |
| `<program>/` | POSITIONING, application, HOW-TO-APPLY per program |

**Notion database:** `https://app.notion.com/p/4014ff9cb1c240c9a3b761e790852970` — 67 programs, four views (Deadlines, Calendar, Equity-free, By status). The Notion MCP is installed and working.

**Live numbers as of 2026-08-01:** 4,297 commits · 410 migrations · 401 specced / 362 shipped · 8 weeks · zero external users · zero revenue. Re-pull before every submit.

---

# 2026-07-30, the spine, the lineage graph, and one disease named

## THE FOUNDER'S OPEN CALLS (do these first)

0. **RESOLVED 20:35 IST, but read it: the demo-id scatter (20260730150000) was
   REVERTED by 20260730203000, applied live.** It broke cloning outright.
   `clone_demo_workspace` does NOT clone the `projects` table (verified:
   `pg_get_functiondef` contains no `into public.projects`), so the four demo
   products already exist per workspace with PASTED ids. Under the scatter,
   every product foreign key pointed at a derived row nothing ever creates, and
   the clone died on `themes_product_id_fkey`. Transactional, so nothing was
   left half-built, but every clone failed while it was live. `harbor@` has
   since been re-cloned successfully and is whole (22 opps, 20 missions, 25
   decisions, 16 themes, 4 projects, 3 pending approvals). **Demo tags still
   collide, and that is the accepted trade**, because the collision is already
   neutralised in code: `getEntityLineage` returns `ambiguous` and refuses to
   pick. To revive the scatter, first make the clone own `projects`.
   `demo_derive_id` is left in place for that.
1. **`AI_PROVIDER_FALLBACK=1` is set locally and OFF in production.** With it, a
   hard-failed model degrades to the next candidate; without it the whole Ask
   fails as "I hit a snag". Recommendation: set it in production rather than
   pinning a model, because pinning goes stale the next time a vendor retires
   something, which is exactly what happened to `gemini-2.5-pro` today.
2. **Do not re-clone `explore@` before a YC look.** Cloning works again, but it
   wipes and rebuilds a workspace and resets its pending approval queue, which
   is the demo's signature beat. `harbor@` is the disposable rehearsal account.
3. FIXED (02ced1aa): the roadmap snapshot now reads `roadmap_bucket`, and
   `architecture/data.md` no longer lists a `roadmap_items` table that never
   existed. That doc line was the source of four broken code maps.

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

## READING A DIFF IS NOT RUNNING IT

The scatter above is the sharpest example of the day. The migration was
reviewed, its arithmetic verified, and its FK claim reasoned about in writing.
It still could not work, for a reason invisible in the diff: a table the clone
does not touch. Diagnosing it from the code produced a plausible cause
(predicate mismatch between the two remappers, which was real and which I
fixed) that was NOT the cause. Only running the clone produced the true one.

Anything that writes to a database gets executed against real data before it is
believed, and a founder-applied migration is not evidence it works.

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
