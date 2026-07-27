# Session handoff - 2026-07-28 (demo video SHOT, CUT and UPLOADED; YC founder profile rewritten)

## State: local main = `ad2ff15c` + this file. Two production bugs found, fixed, deployed, verified.

The demo video is **done and uploaded**. The YC founder profile answers are **written and paste-ready**.
Two real product bugs were caught during rehearsal, fixed, published and verified live.

---

## 1. THE DEMO VIDEO — shipped

**Uploaded file:** `~/Library/Mobile Documents/com~apple~CloudDocs/Supaprod/YC/Supaprod_Product Demo.mp4`
**46.4 MB · 4:51.02 · 1920x1076 · h264 · native 60 fps · AAC 160k.** Under the 100 MB cap with room to spare.

Originals archived by the founder in `.../Supaprod/Archieve Resources/`:
`Supaprod_Product Demo_Original.mov` (179 MB, 5:35.8) and `Supaprod_Product Demo_web.mp4` (the 5:35 compress).

**How it was cut.** The founder gave 7 exact ranges to remove; all applied, total 44.77s removed:
`1:57-2:08 · 3:14-3:21 · 3:33-3:45 · 4:21-4:23 · 4:27-4:29 · 5:06-5:16 · 5:35-end`.
Method: 7 per-segment extractions from the ORIGINAL (one encoding generation), 40ms audio fades at each join
so seams do not click, then concat with stream copy. Script: scratchpad `cut_hq.sh`.

**Quality lesson, do not repeat.** The first pass used CRF 20 / 30 fps and came out at 18 MB with SSIM 0.9935.
The founder rejected it ("please dont compromise on the video quality"). He was right: we were using 18 MB of
a 100 MB budget. The shipped version is **CRF 10 at native 60 fps**. When re-cutting, probe CRF against a
busy segment first and spend the budget.

**Founder rulings on the video:** keep the multiple browser tabs (they were deliberate, he was showcasing
other tabs to move faster), do NOT crop the browser chrome, no live build run.

---

## 2. TWO PRODUCTION BUGS FIXED AND DEPLOYED

Both were found by the founder while rehearsing, both root-caused, fixed, pushed and **verified live**.

### a. The Ask answer was invisible (`MissionShellView.tsx`)
Commit `3e908897` locally, `5131c947` on origin/main. The Thread rail appends the conversation BELOW the
briefing and every inline gate, so the new exchange landed ~1300px down a rail that never scrolled (measured
live: scrollHeight 2190, clientHeight 809, **scrollTop 0**, question at top:1341 in a 1080px viewport). The
composer clears on send, so it read as "I typed, it vanished, nothing happened". The backend was healthy the
whole time. Fix: pull the newest message into view, and keep it pinned while streaming only when the reader is
already near the bottom. **Verified live: scrollTop 0 -> 556, question top 1341 -> 785, in viewport.**

### b. `/discover` crashed on every cold load (`SignalFeed.tsx`)
Commit `080f7a45` locally, `3faba8f0` on origin/main. React #310, "Rendered more hooks than during the
previous render". `SignalFeed` returned early for loading and error, then called `useMemo` twice below them.
Cold mount runs the short hook list; first render with data runs two more. Took the whole route down through
its errorComponent. **This is a regression of a bug already fixed in `AutoClustered.tsx` on 2026-07-19** (its
comment describes the identical crash); SignalFeed was missed in that pass. Worth enabling
`react-hooks/rules-of-hooks` to catch it statically.

> **Deploy note:** pushing to origin/main is NOT enough. Lovable syncs the commit but the published site keeps
> serving the old build until the founder hits **publish**. Both fixes only went live after he did.

---

## 3. WHAT THE LIVE APP ACTUALLY RENDERS (hard-won, trust this over older docs)

Verified by walking supaprod.ai as `harbor@` on 2026-07-27/28.

| Claim in older docs | Reality |
| --- | --- |
| "`?stage=design` is a white void, cut the beat" | **WRONG.** It renders a real prototype (v1 Flow map .. v4 Interactive). `prototype_files` is empty but that is NOT what the surface renders from. |
| "`?stage=discover` shows the theme with severity/frequency" | **WRONG.** It is `01 Discover · Evidence`, a flat 25-signal feed. No theme, no severity, no frequency, rows are not clickable. |
| The theme view | Lives at **`/discover`** (the evidence desk): "Raw signal in, ranked bets out", clustered themes, checkout theme at **rank #4, 9 signals / 8 sources**. Different left nav from the room. |
| Headline count | Drifts. Was 23, then 21, then 19. **Read it on the day.** |
| `?stage=plan` | Opens on the WRONG spec (notification digest). The checkout spec needs a tab click. Best frame in the product: Outcome contract commits to 75% by Aug 20 before any code exists. |
| Brain graph | WebGL 3D constellation; labels smear at video bitrate. Use the **LIST** view. |

**Mission dispatch reality:** 176 missions in 45 days, 80 never dispatched, **63 halted, 10 completed**.
Builder runs 40 clean of 83. A live build run on camera is a 1-in-10 gamble. The engine HAS opened **15 real
PRs** on `RohitGajaraj/Test-Project-Cadence` (#5-#20, most merged), so the capability is real, it just needs
rehearsal rather than a live gamble.

---

## 4. YC FOUNDER PROFILE — rewritten, paste-ready

**`docs/pitch/yc/founder-profile-answers.md`** is the single file. Boxes 2 and 3 were blank on the form.

- **Box 2** now names the Moon and Mars missions and converts "space" into a constraint (launches once, no
  patch release), which is the part a partner scores.
- **Box 3** deliberately carries **no repo URLs**. The founder challenged linking them as giving away IP and
  he was right: those public READMEs publish the full moat thesis verbatim, named competitive positioning
  (factory.ai, Devin, Replit, Linear, Cursor, Lovable), a map of the internal strategy docs, and in v4 **live
  demo credentials in plain text** (already neutralised, those accounts were suspended 2026-07-25).
- Domains named per the investor deck's own wording: **semiconductors at Infineon in Munich**, **satellite
  communication systems** at India's national space agency. **Bosch dropped** (zero mentions in the deck, no
  documented role anywhere).

### ⚠️ STILL OPEN — the founder has not done these yet

1. **Make private:** `Project-Cadence`, `-v2`, `-v3`, `-v4`, and `build-in-public`.
   `build-in-public` is **PUBLIC while `CLAUDE.md` asserts it is private**; it exposes `founder-profile.md`,
   `positioning.md` and unpublished drafts. No token leak (Buffer token reads from `process.env.BUFFER_TOKEN`).
2. **Personal website field** must be `https://supaprod.ai`. An older draft recommended
   `cadence-flow-beta.lovable.app`, which **returns 404** and carries the retired brand.
3. **Two claims he must defend cold:** which ISRO programme/subsystem, and where the "200+ institutions /
   70+ countries" figure is published.
4. Retracted advice: do NOT pin the Cadence repos. A pinned private repo is invisible to visitors, so pinning
   and privacy are mutually exclusive. Builder evidence rests on the **Paxel report** (already auto-attaching),
   the live product, and the demo video.

---

## 5. 🚨 THE ORPHAN REMOTE — STILL UNRESOLVED, decide before any normal push

`origin/main` has **no common ancestor** with local main. Local main is **4120 commits**; origin/main is the
short orphan history Lovable re-committed. **Lovable deploys from origin/main**, which is why both bug fixes
had to be applied there directly via a temporary worktree rather than pushed from local main.

- Real history is safe on **`origin/rescue/real-main-2026-07-27`**.
- The orphan is backed up on **`origin/backup/orphan-main-2026-07-27`**.
- Tonight's two code fixes exist **only on the orphan main**, not in local main's ancestry, and will need
  carrying across whenever the histories are reconciled.
- Tonight's doc commits (`483259c2`..`ad2ff15c` and the demo scripts) exist **only on local main**, and are
  pushed to `origin/session/2026-07-28-demo-and-yc` for safety.

**Deliberately not force-pushed at 02:00** with the YC video just uploaded and Lovable deploying from that
branch. This is a founder decision, and it wants a clear head.

---

## Next session, in order

1. Founder decision on the orphan remote (section 5). Nothing else in git is safe to reason about until then.
2. The four GitHub privacy changes + the personal-website URL (section 4).
3. Optional: rehearse a real build run against `relay-homeowner-app` in a **scratch workspace, never harbor**,
   so a halted mission never dirties the room used for recording.
