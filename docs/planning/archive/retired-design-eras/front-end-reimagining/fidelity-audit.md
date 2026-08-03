# Reimagining Fidelity Audit — delivered vs mockups (ground-truth, live)

> _Created: 2026-07-20 · Last updated: 2026-07-20_

> **🔒 HARD RULE (founder, standing, restated 4x — strictly binding across ALL surfaces): the mockup `.html` files ARE the baseline floor. Build each surface to match its mockup faithfully FIRST — every section, control, and layout the mockup shows — then add on top if valuable. Never ship a thinner interpretation. When building or reviewing any surface, open its mockup (`docs/planning/front-end-reimagining/mockups/screen-*.html`, `card-spec.html`, `landing-when-you-login.html`) and reproduce it 1:1 before wiring real data. A surface that omits a section the mockup has is INCOMPLETE, not done.**

> Founder-directed (Rohit, 2026-07-20): "run through all the product surfaces, compare with mockups; where no mockup exists, build to standard." This is the second request; this pass is grounded in a LIVE walkthrough of the running dev server (localhost:8080, demo@redcadence.app) with side-by-side mockup renders (served from localhost:8099), not assumptions. Branch `sandbox/mission-control-v2`. Production/main/public-landing untouched.

## How this was captured
Logged into the running app, walked each surface, screenshotted it, and rendered each mockup HTML at 1440px for side-by-side comparison. Evidence PNGs (repo root, git-ignored working files): `audit-01-today-old-shell`, `audit-02-m-room`, `audit-03-settings-staff-current`, `audit-04-screen7-mockup-target`, `audit-05-room-current`, `audit-06-screen2-mockup`.

## The three systemic root causes (why "it's not matching")
1. **Shell incoherence (the bounce).** Only `/m`, `/threads`, `/artifacts` render in the reimagined room shell. Every other surface — Settings, Brain, Approvals, Today, Build, Plan, etc. — still renders inside the OLD Obsidian `AppShell` (the 10-destination rail: Today/Discover/Decide/Plan/Design/Build/Ship/Learn/Brain/Pulse). `src/lib/nav-model.ts` still defines those 10. So moving from the room to Settings visibly drops you back into the retired shell. This is the founder's "it clicks me back to the shell again."
   - **FIXED (2026-07-20):** post-login + authenticated-landing now go to `/m` (the room), not `/today` (`src/routes/index.tsx`). Remaining: route Settings/Brain/Approvals through the reimagined shell.
2. **Fidelity gap (built thinner than the mockups).** The faces exist and sit on the right contract, but each is built to a thinner baseline than its mockup — the richest, most product-defining sections are missing (see per-surface deltas).
3. **Seed gap (thin demo data).** The live demo workspace ("Explore workspace / Solar Rebate Calculator") is sparse: stages read `inferred`, `0 shipped`, one-line briefing. The mockups are built on a rich "Helio Labs / Relay" story (dated ship history, 41 decisions in memory, memory cards with provenance). Even correctly-built surfaces look empty without the rich seed.

## Surface-by-surface register
Legend: ✅ at bar · ◐ right shell/skeleton, thin vs mockup · ❌ wrong shell or far from mockup · ⬜ no mockup, build to standard.

| # | Surface | Route | Mockup | State | The concrete delta to close |
|---|---------|-------|--------|-------|------------------------------|
| 1 | Post-login landing | `/` → app | (charter: land in the room) | ✅ FIXED | Was `/today` (old shell); now `/m`. Verified live. |
| 2 | Room at rest | `/m/$productId` | screen-2 | ◐ | Right shell + spine + briefing. MISSING vs mockup: the **"What memory holds"** column (moat cards w/ provenance), the **"Shipped"** column, rich **per-stage narratives** (currently terse / "inferred"), **composer journey chips** on the face, **working-strip activity** (left side reads only "nothing running"). Partly seed-driven. |
| 3 | Settings (all groups) | `/settings` | screen-7 | ❌ | Renders in OLD AppShell. Current = cramped numbered index + flat agent **card grid** with clipped text + lone "Tool reach" dropdown. Target = room TopBar (Settings active) + **5-group settings-nav (20 doors)** + roster **TABLE** (Agent·Job·Stage·Approval·Tools·Last activity·On) + **expandable agent** with 3 ledgers (Skills / Tool access / Knowledge & instructions) + roster lede + working strip. Biggest single gap. |
| 4 | Build face | `/m/$productId?stage=build` | screen-3 | ◐ blocked-data | Code + honest states are RIGHT (This session / changeset / CI line / terminal / Other builds), verified live. Renders THIN because Relay has no rich studio session (halted mission, 0 files, "GitHub is not connected"). Full screen-3 (live diff, plan-flow steps, passing CI, terminal test output) needs a connected GitHub repo + a real build run, OR a service-role studio-session seed (agent_runs/checkpoints/changeset files) - NOT writable via the demo-user RLS path. FOUNDER-GATED (GitHub OAuth). |
| 5 | Approvals tray + gates | `?panel=approvals` | screen-4 | ◐ | Tray ships 2 honest verbs (approve/decline); send-back + snooze backends added (apply at Gate-2). Confirm gate-card anatomy vs screen-4. |
| 6 | Journey flow | `/m` + journey chips | screen-5 | ◐ | Journey chips + spine-slice highlight exist; the spec-forming Plan face rebuilt. Confirm start→done fidelity + chip prominence on the room. |
| 7 | Design face | `?stage=04` | screen-6 | ◐ | Live scaffold in a browser-chrome frame + switcher + provenance. MISSING per mockup: version trail (V1..V4) + before/after — `artifact_versions` backend added, applies at Gate-2, then wire. |
| 8 | Decision board | `?stage=02` | screen-8 | ◐ | Ranked bets + ICE + Critic red-team inline. Confirm board richness vs screen-8. |
| 9 | Threads home | `/threads` | screen-9 | ◐ | 3-pane (rail/list/preview) in the reimagined chrome. Folders/search/save-to-brain wired (some apply at Gate-2). Confirm vs screen-9. |
| 10 | Artifacts | `/artifacts` | (card-spec) | ◐ | Union list + rename/delete + per-product tab + versions (apply at Gate-2). Confirm card anatomy vs card-spec. |
| 11 | First run / onboarding | `/start` | screen-1 | ◐ | One-question first run, chromeless. Confirm vs screen-1 richness. |
| 12 | Brain | `/brain` | (no mockup) | ❌ | Renders in OLD AppShell. Build to standard inside the reimagined shell (knows + runs analyst). |
| 13 | Auth (login/signup/forgot) | `/login` etc | (align to public landing) | ⬜ | Founder ruling 2026-07-20: redesign to the public landing's ink + starfield system. Currently the shared dark `AuthScaffold`. |
| 14 | Today (legacy) | `/today` | (retired by room) | ❌ | Old 10-rail shell. No longer the landing; decide redirect-into-room vs keep as strangler. |

## Execution order (decisive)
1. **Shell coherence** — extract the room TopBar into a reusable shell; route Settings, Brain, Approvals through it (no bounce). [landing already fixed]
2. **Settings → screen-7** — 5-group nav + roster table + expandable ledgers, real data, honest where unwired. (Founder-named.)
3. **Room-rest → screen-2** — add the Shipped + "What memory holds" columns, per-stage narratives, journey chips on the face, working-strip activity.
4. **Each remaining face → its mockup** — build (3), tray+gates (4), journey (5), design+versions (6), board (8), threads (9), artifacts, first-run (1).
5. **Brain** — build to standard in the reimagined shell.
6. **Auth pages** — ink + starfield redesign.
7. **Rich seed** — `seed_sample_workspace` to the "Relay"-level story so every surface/journey shows believable content; artifact V1..V4 progression.
8. **Verify** — tsc + build + tests + live Love-Gate walkthrough; commit + push per increment.

## Demo seed status (live DB, `demo@redcadence.app`, 2026-07-20)
Founder ruling: drop "Solar Rebate Calculator" (a small example that downgrades the platform); showcase a premium, enterprise-credible story like the mockups' Helio Labs / Relay. Ground truth: the rich **Helio Labs** seed (migration `20260718120000`, products Atlas/Relay/Comet/Beacon) was ALREADY in the live DB; the app just defaulted to the older "Explore workspace" (resolution is localStorage else alphabetical-first).
Done (as the demo user, RLS-scoped, reversible):
- Deleted the two empty clutter products (0 content): **Solar Rebate Calculator** + the stray **Winter Savings Challenge**.
- Made **Relay** Helio's newest product (created_at bump) so `/m` defaults to it.
- Renamed "Explore workspace" -> "Sample sandbox" so **Helio Labs** sorts first and is the default workspace on a fresh session. Verified live: a cleared session lands on `/m/{relay}` = Helio Labs / Relay with rich gates (the notification-digest two-passes gate, the checkout gate) + a live Build.
Caveat + open decision: a browser with a stale stored workspace pref still opens "Sample sandbox" until one switch. To make Helio the ONLY demo everywhere, delete the Sample sandbox (Prism + Trellis) - destructive, holds rich supersession content, so FOUNDER-CONFIRM before deleting. The remaining room-face thinness ("inferred" stages, 0 shipped, no memory/shipped columns) is fidelity work (rows 2/#3), not seed.

### Helio enrichment (2026-07-20, live DB, RLS as demo user)
Helio was thinner than Sample sandbox on deep surfaces, so before any retirement it was enriched (idempotent upserts, fixed Helio-namespace UUIDs `10000000-0a00/0d00/0e00-...`): 5 APPROVED decisions on Relay (belief statements + rationale, provenance-linked to the two approved Relay PRDs "Simplify checkout" / "notification digest", attributed to Prioritize/Challenge/Listen/Chief of Staff/Plan, dated over the last 2 weeks); 3 deployments (2 production + 1 staging releases with commit shas); 3 learnings (2 validated + 1 mixed, metric-labelled, linked to the Relay PRDs). Result live-verified: room-rest now reads "3 shipped, 7 decisions in memory" with real Shipped releases + What-memory-holds cards; Brain + Learn also light up. FOLLOW-UP: fold these into the Helio seed migration (20260718120000) for reproducibility; enrich the remaining deep surfaces (opportunities/themes/signals breadth, more shipped history) before retiring Sample sandbox.

Rule carried from HANDOFF: mockup Addenda + committed code beat the mockups where they disagree (chips are slate, memory is Vellum). No merge to main without the founder's explicit words.

## Round-3.1 design floors registered (2026-07-24)

The Round-3.1 mockups (screen-1b, screen-3b, screen-10 through screen-19) are now committed and extend the baseline floor to the remaining surfaces. As of this date the following surfaces have a binding design floor for the first time: Discover (screen-10), Decide (screen-11), Ship (screen-12), Learn (screen-13), Brain (screen-14), Auth and Account (screen-15), Settings You and Workspace (screen-16), Settings Connections and Plan (screen-17), Library (screen-18), Engine room (screen-19), First-run v2 (screen-1b), and Build board and focus (screen-3b). All twelve were authored against the _round3-brief law at the raised bar. Note: screen-8 remains a decision-board DOCUMENT (an options board); screen-11 is the real Decide floor going forward. The hard rule at the top of this file applies to all twelve: build each surface to match its mockup faithfully first, then add on top.
