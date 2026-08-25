# UNIT L0-055 — item 27: superseded builds render as doors

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #27 (surface half) · **Date:** 2026-08-25

## What changed

`src/components/studio/ChangesPanel.tsx` — new `SupersededBuilds` block under
the changeset identity line:

- Consumes MAIN's read (getStudioSession's `superseded`) through the SAME
  cache entry the session page polls (`["studio-session", missionId]`) — one
  read serves both, no second fetch, and invalidations after a rollback or a
  new build keep it true.
- Newest first; each row: title (or "Untitled change" when null), last-touched,
  its actual status word, marked **"superseded"**, and its pull request as an
  ActionLink door when one exists. Thin by design per MAIN's note — the body
  stays behind getStudioChanges.
- **An empty array says NOTHING**: it is what a first build looks like. No
  empty region, no "no history" apology.

## Checked first

Meridian has no version-list primitive yet (SPEC-ARTIFACTS §10 GAP 2 names
VersionList as a real gap); rather than wait on it, this composes `Row` +
`Value` + `ActionLink`, which is the same information in the panel's own
rhythm. If MAIN later ships VersionList, swap is mechanical.

## Item 25 — routing conflict, filed not forced

The only render site for `BuildWorkItem.stoppedAt` is
`src/routes/_authenticated.build.index.tsx` (`rowFor`, :363+) — an **L1 file**.
MAIN's row assigns the surface to L0, but path ownership says routes are L1's
and two writers on one prefix broke main once already. Filed
`requests/L0-026-item25-routing.md`: reassign to L1, authorize me for that one
file, or split it — the fix itself is small either way.

## Gates

`tsc` 0 · full suite **10,912 pass / 0 fail** · eslint clean · no dev server.

What would prove 27 false: a mission with superseded builds showing none; an
empty "Earlier builds" region on a first build; a superseded PR without its
door.
