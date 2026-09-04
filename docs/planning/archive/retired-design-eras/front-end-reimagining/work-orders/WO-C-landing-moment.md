# WO-C — The landing moment: /start becomes the front door and it works

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**WHY.** The wow first-run exists only in mockups. In runtime: the gate (`_authenticated.tsx` beforeLoad) sends new users to `/onboarding` (the OLD five-screen flow); the reimagined `/start` is (a) unreachable for gated users — line ~34 exempts only `/onboarding`, so `/start` redirect-bounces; (b) a trap — `MissionOnboarding` never calls `markOnboarded()` after `completeOnboarding()`, so its exit loops back into onboarding; (c) it exits to `/today` (the old world). Founder complaint #2: "as soon as I land there is no surprise element."

**Founder rulings reconciled:** `/start` stays frictionless — ONE question, nothing else added to the form. The moment comes from (i) the Pixel hero line, (ii) the starfield, (iii) exiting into the LIVE room that visibly picks the user's words up (that part is the room's job — see mockup screen-1b; this packet only fixes /start + the wiring).

**Mockup floor:** `mockups/screen-1-first-run.html` zone 1 + `mockups/screen-1b-first-run-v2.html` (the room after); `mockups/starfield-variant.html` (density/motion rules).

**Files owned:** `src/components/mission/MissionOnboarding.tsx`, `src/routes/_authenticated.tsx` (**beforeLoad block + AuthedNotFound only** — the render body belongs to WO-B; start only after WO-B merges), optionally a small `StartBackdrop` component in `src/components/mission/`.

## Steps

1. `_authenticated.tsx` beforeLoad: change the onboarding redirect target from `/onboarding` to `/start`; the exemption check must cover BOTH `location.pathname.startsWith("/onboarding")` and `.startsWith("/start")` (keep `/onboarding` routable as the legacy fallback).
2. `MissionOnboarding.tsx`:
   a. After `completeOnboarding()` succeeds, call `markOnboarded(session.user.id)` (from `@/lib/onboarding-gate`) BEFORE navigating — this is the loop-breaker.
   b. Change both exit navigations (enter + explore paths) from `/today` to `/m`.
   c. Add the Pixel hero line above the question: `Say it. Agents move. You make the calls.` (Geist Pixel, the screen's one Pixel moment; sentence styling per screen-1's hero treatment).
   d. Add the starfield backdrop: reuse the existing backdrop component (`AppIdleBackdrop` app preset or the landing preset per `starfield-variant.html` — 36 far + 22 near, far layer breathing, static under `prefers-reduced-motion`). Onboarding is a sanctioned starfield surface.
   e. Change NOTHING else about the form: one textarea, one always-enabled primary, the quiet sample-workspace door.
3. Verify the room tour offer (`offerTour` / `TOUR_SEEN_KEY` in `MissionShell.tsx`) fires on first `/m` entry after this path — it already exists; just confirm, do not modify.

## Out of scope

No enrichment of /start beyond hero + starfield (founder ruling: frictionless). No changes to `ObsidianOnboarding` (it remains the legacy fallback at `/onboarding`). No RestFace changes (that is WO-D). No render-body changes in `_authenticated.tsx`.

## Acceptance checklist

- [ ] Fresh account (or set the profile's onboarded flag false): login → lands on `/start`, NOT `/onboarding`; no redirect bounce.
- [ ] Type a goal → "Walk me in" → lands in `/m` with NO redirect loop; the tour offer appears.
- [ ] The explore-sample path also exits to `/m`.
- [ ] Pixel hero renders; starfield breathes; `prefers-reduced-motion` renders static stars.
- [ ] `/onboarding` still works if visited directly (legacy fallback).
- [ ] `bunx tsc --noEmit && bun run build && bun test` green.
