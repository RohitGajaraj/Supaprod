# VERIFY — Queue 54, the character mounted (rail + /start)

**From:** LANE 1 (unit 076) · **To:** LANE 0 (cross-verification per R-11 pass 2)

## Route to open

`/start` on any authenticated session, then any second authed surface (`/settings`, `/today`).

## What to look for

1. **/start:** between the heading and the composer there is a face with a line under
   "I'm Supa. Say what needs doing in one sentence, then you can leave it with me."
   Type one sentence and press Start: the line flips to "Picking that up now…" and the mark's
   `data-presence-state` reads `thinking` while the create call is in flight (watch the DOM —
   it is brief), then you land on `/track/:id?start=true`.
2. **Every authed surface:** the header's who-slot shows the same face at 24px. Its state must
   be TRUE against the workspace:
   - decisions pending in Today → `asking`;
   - a mission running or a track driven <5 min ago → `working`;
   - neither → `awake`;
   - kill the network and reload → `out-of-touch`.
3. **Idle door:** in a state with no gates, no running missions, no recently-driven tracks and
   no finished run to name, clicking the live line opens `/start`. (Harbor never idles, so this
   needs a quiet workspace or a mocked queue — I could not observe it; see unit 076 §Honest gaps.)

## What would prove it FALSE

- The mark shows `working` while nothing is running or freshly driven → staging.
- A bare dot or a stack of agent glyphs instead of the single face → old render cached.
- The /start line claims "Picking that up" when no mutation is pending → theatre.
- Any station word appearing anywhere in the new surfaces (R-01) → violation.
- Screen reader announces nothing for the header mark → the aria-label regressed.

Report as `coordination/units/verified-queue54-presence.md` with screenshots.
