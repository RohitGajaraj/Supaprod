# WO-D — The rest beat: the room's first breath answers "what needs me"

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**WHY.** A returning user lands on the room's RestFace. Today it summarizes; it should LEAD with the one thing that needs them and make acting one click — the anticipatory rule ("deliver before the user asks"). The delight is the existing approval choreography firing from that click; we add no new spectacle (the Class-C motion budget is already spent on it).

**Mockup floor:** `mockups/landing-when-you-login.html` Frame A (returning user) + `mockups/screen-2-room-rest.html`.

**Files owned:** `src/components/mission/faces.tsx` (RestFace region ONLY), `src/components/mission/MissionShell.tsx` (one prop thread). **Start only after WO-A merges** (MissionShell.tsx overlap).

## Steps

1. In `faces.tsx` RestFace: when `gateCount > 0`, the headline area gains the TOP waiting call rendered as an ember gate row — the call's headline, its consequence clause, and ONE action that opens the approvals tray in place. This is the screen's single ember locus (check what else on RestFace currently wears ember and demote per the one-locus law if trivially in this region — otherwise leave for WO-EMBER).
2. Thread a new optional `onOpenTray?: () => void` prop from `MissionShell` (which already owns `trayOpen`/`onTrayChange` plumbing wired to `?panel=approvals` in `_authenticated.m.$productId.tsx`) down to RestFace. Clicking the gate row calls it.
3. Below the headline, a "since you left" line if cheap from existing loop-state data (e.g. "2 finished overnight · 1 waiting on you"); if the data isn't already on hand in RestFace's props, SKIP — do not add queries.
4. Approving from the tray then fires the existing choreography unchanged — verify, do not modify it.

## Out of scope

No new server functions or queries. No changes to the tray, the choreography, or other faces. No WorkingStrip changes.

## Acceptance checklist

- [ ] Login as a user with pending approvals (explore@ on Helio Labs): rest room leads with the top call as an ember row.
- [ ] Click → tray opens in place (`?panel=approvals` appears in the URL); approve → choreography plays; the count decrements everywhere it renders (one count, one source).
- [ ] With zero gates: RestFace shows its normal rest state; no empty ember row.
- [ ] `bunx tsc --noEmit && bun run build && bun test` green.
