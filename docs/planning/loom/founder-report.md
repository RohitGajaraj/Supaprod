# Loom · the morning report

> _Created: 2026-07-04 · Last updated: 2026-07-04 (early morning, mission in final waves)_

You asked for the final production-readiness pass: audit everything against
the live app, recover the homeless features, redesign beyond v3 without
mimicking it, humanize the language, validate on production. Here is what
happened overnight, what to look at, and the calls parked for you.

## What shipped (all pushed to main; Lovable auto-deploys)

| Commit | What |
| --- | --- |
| `3549fc2e` | Repo-wide prettier sweep, code only (~7,800 lint findings cleared) |
| `24fccc59` | Dormant-payments crash chain fixed (the recurring prod console error) + a real cross-tenant security hole in audio transcription closed |
| `41d4b3b1` | The portal theme escape fixed: dropdowns, dialogs, palette, toasts now inherit the dark theme (the "white workspace switcher" bug) |
| `ba05bd3f` | DESIGN-LOOM v4 adopted (the contract) + the build bible + all audit evidence committed |
| `34bea876` | W1: the rail now shows every home (THE LOOP 01-05 · THE ENGINE 06-08 · Settings/Admin/account), v4 tokens, /knowledge is now /brain, no more blank-frame navigation, quiet top bar, complete command palette, Lovable/gpt-engineer fingerprints stripped |
| `3b6b3018` | W2: all seven surfaces transformed (detail below) |

## The audit, in numbers

28 agents audited code + the live app: 81 routes, 96 features, 54 product
defects + 66 quality findings (12 blockers). Evidence:
[`audit-master-inventory.md`](./audit-master-inventory.md) ·
[`audit-quality-register.md`](./audit-quality-register.md). Root causes of
your complaints: the nav collapse orphaned real surfaces (visibility, not
missing code); portals escaped the dark theme scope; `ssr:false` + zero
pending components caused the blank black frames; v3's 1060px container +
13px type read mobile-sized.

## What each surface got (W2)

- **Today** — your triage feedback, implemented: calls grouped by kind with
  one featured card + "N more" inline expanders (no more 11-card wall), the
  My-day strip (meetings · tasks due · focus suggestion), quick capture into
  the signal engine, tasks got their UI back (add/complete from Today), the
  brief humanized, the "Not set yet" walls gone. The ritual fits ~1.5
  screens with a full queue.
- **Engine Room** — ONE home now: all 15 /govern tabs folded into the four
  rooms (Spend/Quality/Safety/Record), /govern redirects, Prompt Studio is
  reachable again, and every fabricated number (the "$482 of $600" prototype
  literal, the fake "ACME · CONNECTED" strip) replaced with honest
  skeletons/errors.
- **Build** — the mission detail is off parchment; alarming raw telemetry
  ("7.07% of calls succeeded") reframed with meaning and scope.
- **Plan** — the full spec editor re-homed at `/plan/spec/$id` (old
  `/prds/$id` redirects), PRD is now "Spec" everywhere users read.
- **Brain** — tabs merged (8 from 10), panels lazy-load (the 527KB chunk is
  gone), and the flagship: **the living knowledge graph** — physics-driven
  constellation of your decisions/outcomes/learnings, role-color glows,
  thread edges, supersession shimmer, drag/zoom/focus/story. The demo
  workspace only has a handful of nodes; it comes alive with the rich seed.
- **Discover / Settings / Admin / Auth** — deep links honored everywhere,
  Settings sections fixed (`?tab=` and `?section=` both work), the fake
  Connect button is honest now, single-product workspaces hide the product
  switcher until a second product exists (your workspace/product ruling),
  auth pages got real labels + autocomplete + error states, pricing→signup
  carries the plan pick, admin never renders an error as "No users match."

## The rename (your ask)

**"Cadence" is confirmed untenable** — Cadence Design Systems ($80B, 149
marks, enforcement habit), Uber's Cadence in developer mindshare, and any
LLM asked about "Cadence" answers about someone else.
Full brief: [`brand/rename-brief.md`](./brand/rename-brief.md) + four SVG
marks in [`brand/`](./brand/).

- **My recommendation: Selvedge** — the self-finished edge of a weave, the
  part that cannot unravel: your moat as a word, native to the Loom design
  language. Cleanest collision field of 16 checked. Pairs with the **Loom
  Knot** mark (one continuous thread, a knot that cannot be untied).
- Runner-up: **Throughline** (the decision-to-outcome pitch in plain
  English). Then Weft, Rondo, Cairn.
- Before committing: USPTO/EUIPO knockout search (classes 9/42, both
  spellings Selvedge/Selvage), registrar + handle sweep. Rename cost is ~2
  focused days (user-facing name + routes + landing + docs; internal
  identifiers stay per your two prior rename precedents).

## Parked for you (each with my recommended closure)

1. **Lovable MCP OAuth** — one click enables live-DB verification, log
   reads, the debris cleanup, and the rich seed from sessions. Recommend:
   authorize this morning (the URL flow re-issues from any session).
2. **Two migrations await the next publish/apply**: the RLS prd-scope
   consistency fix (authored in W4) and any future defer-verb column. The
   "Later" snooze on calls needs a schema column — recommend a small
   migration next session.
3. **Light theme** — recommend later; one flagship dark done world-class.
4. **URL renames done with permanent redirects** (`/knowledge`→`/brain`,
   `/prds/$id`→`/plan/spec/$id`) — flagging per the rename gate; nothing to
   do unless you object.
5. **Live-DB debris** — "This is an Test Message - By RG" and two test
   tasks from tonight's verification; cleaned via the UI or one SQL once
   Lovable MCP is authorized.
6. **Custom domain** — og:url/og:image reference the lovable.app domain
   (correct today); swap at domain time.
7. **PARALLEL-BUILD.md** — pre-existing docs-doctor FAIL (root stray),
   predates tonight; recommend allowlisting or moving in the next docs pass.
8. **founders@cadence.dev** was removed from the login page (unverified
   address); add a real support address when one exists.

## How to verify in 10 minutes

Log in as `demo@redcadence.app` on the live app: (1) the rail shows
everything — click through THE ENGINE group and Settings; (2) Today — answer
a call, expand "N more", add a task on the My-day strip, capture a note;
(3) Brain → Graph — drag the constellation; (4) Engine Room → each room,
then `/govern?tab=prompts` redirecting into Quality/Prompt Studio; (5)
`/plan/spec` on any spec; (6) open the workspace switcher — it stays dark.

## W4 — done (commit `df9bb3f1`)

All eleven sweeps landed: route error boundaries, the eval-tick judge calls
routed through the chokepoint (judge spend now visible in ai_events — a new
"judge" line in AI costs is old spend made visible, not new spend), money
paths fail closed (a failed top-up cap check now blocks with a retry
message), the RLS prd-scope migration authored, polling pauses in hidden
tabs, dialog-safe shortcuts, the gradient language applied and verified,
honest Today numbers, 66 em-dash fixes.

## W5 — the one blocker found, and it is not the code

**Lovable has not deployed anything pushed tonight.** The live app still
serves a build from before `24fccc59` (its console still throws the Stripe
error that commit fixed). GitHub `main` carries all seven mission commits;
the local production build compiles green; the full experience is verified
on the dev server. The deploy pipeline between GitHub and
cadence-flow-beta.lovable.app is stuck — only your Lovable dashboard (or
authorizing the Lovable MCP) can show why and republish.

**Morning sequence (10 minutes):**
1. Open Lovable → the project → check build/deploy status. One publish
   deploys all seven commits.
2. Applying pending migrations at publish: `20260704110900_loom_prd_scope
   _consistency.sql` (+ any earlier unapplied ones Lovable lists).
3. Then run the 10-minute verification path above on the live app.
4. Authorize the Lovable MCP when convenient — it unlocks live-DB checks,
   the "This is an Test Message - By RG" debris cleanup, and the rich demo
   seed (deliberately last, per your mission: only after stable).

The demo seed was NOT run: the mission gates it on a stable, deployed
production — that gate is yours to open after the publish.
